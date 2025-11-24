// app/households/[id]/members/page.tsx
import { notFound, redirect } from 'next/navigation';
import { prisma } from '@/lib/prisma';
import { getCurrentUser } from '@/lib/auth';
import { getDevicesWithMetadata } from '@/lib/homeAssistant';

type PageProps = {
  params: Promise<{
    id: string;
  }>;
};

export const dynamic = 'force-dynamic';

// --- Server actions ---

async function requireOwnerForHousehold(householdId: number) {
  const user = await getCurrentUser();
  if (!user) {
    redirect('/login');
  }

  const household = await prisma.household.findUnique({
    where: { id: householdId },
    include: { owner: true },
  });

  if (!household) {
    notFound();
  }

  if (household.ownerId !== user.id) {
    throw new Error('You are not the owner of this household.');
  }

  return { household, owner: user };
}

export async function addMemberAction(formData: FormData) {
  'use server';

  const householdId = Number(formData.get('householdId'));
  const email = String(formData.get('email') || '').trim();
  const role = String(formData.get('role') || 'TENANT') as 'OWNER' | 'TENANT';
  const areaFilter = String(formData.get('areaFilter') || '').trim() || null;
  const labelFilter = String(formData.get('labelFilter') || '').trim() || null;

  if (!householdId || !email) {
    return;
  }

  await requireOwnerForHousehold(householdId);

  // Find or create user
  let user = await prisma.user.findUnique({ where: { email } });
  if (!user) {
    user = await prisma.user.create({
      data: {
        email,
        role: role === 'OWNER' ? 'LANDLORD' : 'TENANT',
      },
    });
  }

  // Upsert HouseholdMember
  await prisma.householdMember.upsert({
    where: {
      userId_householdId: {
        userId: user.id,
        householdId,
      },
    },
    update: {
      role,
      areaFilter,
      labelFilterCsv: labelFilter,
    },
    create: {
      userId: user.id,
      householdId,
      role,
      areaFilter,
      labelFilterCsv: labelFilter,
    },
  });

  redirect(`/households/${householdId}/members`);
}

export async function updateMemberAction(formData: FormData) {
  'use server';

  const householdId = Number(formData.get('householdId'));
  const memberId = Number(formData.get('memberId'));
  const role = String(formData.get('role') || 'TENANT') as 'OWNER' | 'TENANT';
  const areaFilter = String(formData.get('areaFilter') || '').trim() || null;
  const labelFilter = String(formData.get('labelFilter') || '').trim() || null;

  if (!householdId || !memberId) {
    return;
  }

  await requireOwnerForHousehold(householdId);

  await prisma.householdMember.update({
    where: { id: memberId },
    data: {
      role,
      areaFilter,
      labelFilterCsv: labelFilter,
    },
  });

  redirect(`/households/${householdId}/members`);
}

export async function deleteMemberAction(formData: FormData) {
  'use server';

  const householdId = Number(formData.get('householdId'));
  const memberId = Number(formData.get('memberId'));

  if (!householdId || !memberId) {
    return;
  }

  await requireOwnerForHousehold(householdId);

  await prisma.householdMember.delete({
    where: { id: memberId },
  });

  redirect(`/households/${householdId}/members`);
}

// --- Page component ---

export default async function HouseholdMembersPage({ params }: PageProps) {
  const { id } = await params;
  const householdId = Number(id);
  if (Number.isNaN(householdId)) {
    notFound();
  }

  const user = await getCurrentUser();
  if (!user) {
    redirect('/login');
  }

  const household = await prisma.household.findUnique({
    where: { id: householdId },
    include: {
      owner: true,
      members: {
        include: {
          user: true,
        },
        orderBy: { id: 'asc' },
      },
    },
  });

  if (!household) {
    notFound();
  }

  if (household.ownerId !== user.id) {
    throw new Error('You are not the owner of this household.');
  }

  // Discover Areas + Labels from HA for this household
  let detectedAreas: string[] = [];
  let detectedLabels: string[] = [];
  let haError: string | null = null;

  try {
    const result = await getDevicesWithMetadata(householdId);
    if (!result.ok || !result.devices) {
      haError =
        result.error ??
        'Could not load devices from Home Assistant for this household.';
    } else {
      const devices = result.devices;
      const areaSet = new Set<string>();
      const labelSet = new Set<string>();

      for (const d of devices) {
        if (d.areaName) {
          areaSet.add(d.areaName);
        }
        if (d.labels && d.labels.length > 0) {
          d.labels.forEach((l) => {
            if (l && l.trim().length > 0) {
              labelSet.add(l.trim());
            }
          });
        }
      }

      detectedAreas = Array.from(areaSet).sort((a, b) =>
        a.localeCompare(b),
      );
      detectedLabels = Array.from(labelSet).sort((a, b) =>
        a.localeCompare(b),
      );
    }
  } catch (e) {
    haError = 'Failed to query Home Assistant for areas and labels.';
  }

  return (
    <main
      style={{
        minHeight: '100vh',
        padding: '40px 24px',
        background: '#eff6ff',
        fontFamily:
          'system-ui, -apple-system, BlinkMacSystemFont, sans-serif',
      }}
    >
      <div style={{ maxWidth: '980px', margin: '0 auto' }}>
        <a
          href={`/households/${householdId}/devices`}
          style={{
            display: 'inline-flex',
            marginBottom: '16px',
            padding: '6px 10px',
            borderRadius: '9999px',
            border: '1px solid #e5e7eb',
            fontSize: '0.85rem',
            color: '#111827',
            textDecoration: 'none',
          }}
        >
          ← Back to devices
        </a>

        <h1
          style={{
            fontSize: '1.8rem',
            fontWeight: 600,
            marginBottom: '4px',
            color: '#111827',
          }}
        >
          Members &amp; Access – {household.name}
        </h1>
        <p
          style={{
            marginBottom: '18px',
            color: '#6b7280',
            fontSize: '0.9rem',
          }}
        >
          Manage who can control this household, which{' '}
          <strong>Home Assistant Areas</strong> they see, and which{' '}
          <strong>Labels</strong> they&apos;re allowed to control.
          Tenants only see devices that match both their Area and allowed
          Labels.
        </p>

        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'minmax(0, 2.2fr) minmax(0, 1.2fr)',
            gap: '16px',
            alignItems: 'flex-start',
          }}
        >
          {/* Members list + add form */}
          <div
            style={{
              borderRadius: '20px',
              background: '#ffffff',
              boxShadow: '0 16px 30px rgba(15, 23, 42, 0.08)',
              padding: '16px 18px',
            }}
          >
            <h2
              style={{
                fontSize: '1.05rem',
                fontWeight: 600,
                marginBottom: '12px',
                color: '#111827',
              }}
            >
              Current members
            </h2>

            {household.members.length === 0 ? (
              <p
                style={{
                  fontSize: '0.9rem',
                  color: '#6b7280',
                  marginBottom: '12px',
                }}
              >
                No members yet. Add your first tenant below.
              </p>
            ) : (
              <table
                style={{
                  width: '100%',
                  borderCollapse: 'collapse',
                  fontSize: '0.85rem',
                }}
              >
                <thead>
                  <tr>
                    <th
                      style={{
                        textAlign: 'left',
                        padding: '6px',
                        borderBottom: '1px solid #e5e7eb',
                        color: '#6b7280',
                        fontWeight: 500,
                      }}
                    >
                      User
                    </th>
                    <th
                      style={{
                        textAlign: 'left',
                        padding: '6px',
                        borderBottom: '1px solid #e5e7eb',
                        color: '#6b7280',
                        fontWeight: 500,
                      }}
                    >
                      Role
                    </th>
                    <th
                      style={{
                        textAlign: 'left',
                        padding: '6px',
                        borderBottom: '1px solid #e5e7eb',
                        color: '#6b7280',
                        fontWeight: 500,
                      }}
                    >
                      Area
                    </th>
                    <th
                      style={{
                        textAlign: 'left',
                        padding: '6px',
                        borderBottom: '1px solid #e5e7eb',
                        color: '#6b7280',
                        fontWeight: 500,
                      }}
                    >
                      Labels (comma-separated)
                    </th>
                    <th
                      style={{
                        textAlign: 'left',
                        padding: '6px',
                        borderBottom: '1px solid #e5e7eb',
                        color: '#6b7280',
                        fontWeight: 500,
                      }}
                    >
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {household.members.map((m) => (
                    <tr key={m.id}>
                      <td
                        style={{
                          padding: '6px',
                          borderBottom: '1px solid #f3f4f6',
                        }}
                      >
                        <div
                          style={{
                            fontWeight: 500,
                            color: '#111827',
                          }}
                        >
                          {m.user.name || m.user.email}
                        </div>
                        <div
                          style={{
                            fontSize: '0.75rem',
                            color: '#6b7280',
                            fontFamily:
                              'ui-monospace, Menlo, Monaco, Consolas, "Liberation Mono", "Courier New", monospace',
                          }}
                        >
                          {m.user.email}
                        </div>
                      </td>
                      <td
                        style={{
                          padding: '6px',
                          borderBottom: '1px solid #f3f4f6',
                        }}
                      >
                        <form action={updateMemberAction}>
                          <input
                            type="hidden"
                            name="householdId"
                            value={householdId}
                          />
                          <input
                            type="hidden"
                            name="memberId"
                            value={m.id}
                          />
                          <select
                            name="role"
                            defaultValue={m.role}
                            style={{
                              fontSize: '0.8rem',
                              padding: '4px 6px',
                              borderRadius: '8px',
                              border: '1px solid #d1d5db',
                              background: '#f9fafb',
                            }}
                          >
                            <option value="TENANT">TENANT</option>
                            <option value="OWNER">OWNER</option>
                          </select>
                      </td>
                      <td
                        style={{
                          padding: '6px',
                          borderBottom: '1px solid #f3f4f6',
                        }}
                      >
                          <input
                            type="text"
                            name="areaFilter"
                            defaultValue={m.areaFilter ?? ''}
                            placeholder='e.g. "Room 1"'
                            style={{
                              width: '100%',
                              fontSize: '0.8rem',
                              padding: '4px 6px',
                              borderRadius: '8px',
                              border: '1px solid #d1d5db',
                            }}
                          />
                      </td>
                      <td
                        style={{
                          padding: '6px',
                          borderBottom: '1px solid #f3f4f6',
                        }}
                      >
                          <input
                            type="text"
                            name="labelFilter"
                            defaultValue={m.labelFilterCsv ?? ''}
                            placeholder='e.g. "Lights, Blinds"'
                            style={{
                              width: '100%',
                              fontSize: '0.8rem',
                              padding: '4px 6px',
                              borderRadius: '8px',
                              border: '1px solid #d1d5db',
                            }}
                          />
                      </td>
                      <td
                        style={{
                          padding: '6px',
                          borderBottom: '1px solid #f3f4f6',
                          whiteSpace: 'nowrap',
                        }}
                      >
                          <div
                            style={{
                              display: 'flex',
                              gap: '6px',
                            }}
                          >
                            <button
                              type="submit"
                              style={{
                                border: 'none',
                                borderRadius: '9999px',
                                padding: '4px 8px',
                                fontSize: '0.75rem',
                                background: '#4f46e5',
                                color: '#ffffff',
                                cursor: 'pointer',
                              }}
                            >
                              Save
                            </button>
                        </form>
                        <form action={deleteMemberAction}>
                          <input
                            type="hidden"
                            name="householdId"
                            value={householdId}
                          />
                          <input
                            type="hidden"
                            name="memberId"
                            value={m.id}
                          />
                          <button
                            type="submit"
                            style={{
                              border: 'none',
                              borderRadius: '9999px',
                              padding: '4px 8px',
                              fontSize: '0.75rem',
                              background: '#fee2e2',
                              color: '#b91c1c',
                              cursor: 'pointer',
                            }}
                          >
                            Remove
                          </button>
                        </form>
                          </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}

            {/* Add member form */}
            <div
              style={{
                marginTop: '18px',
                paddingTop: '12px',
                borderTop: '1px solid #e5e7eb',
              }}
            >
              <h3
                style={{
                  fontSize: '0.95rem',
                  fontWeight: 600,
                  marginBottom: '8px',
                }}
              >
                Add member
              </h3>
              <p
                style={{
                  fontSize: '0.8rem',
                  color: '#6b7280',
                  marginBottom: '8px',
                }}
              >
                Enter the tenant&apos;s email, choose their role, Area and
                allowed Labels. Dinodia Cloud will create the user if it
                doesn&apos;t exist yet.
              </p>
              <form action={addMemberAction}>
                <input
                  type="hidden"
                  name="householdId"
                  value={householdId}
                />
                <div
                  style={{
                    display: 'grid',
                    gridTemplateColumns: '2fr 1fr',
                    gap: '8px',
                    marginBottom: '8px',
                  }}
                >
                  <div>
                    <label
                      style={{
                        display: 'block',
                        fontSize: '0.75rem',
                        color: '#6b7280',
                        marginBottom: '2px',
                      }}
                    >
                      Email
                    </label>
                    <input
                      type="email"
                      name="email"
                      required
                      placeholder="tenant@example.com"
                      style={{
                        width: '100%',
                        fontSize: '0.85rem',
                        padding: '6px 8px',
                        borderRadius: '8px',
                        border: '1px solid #d1d5db',
                      }}
                    />
                  </div>
                  <div>
                    <label
                      style={{
                        display: 'block',
                        fontSize: '0.75rem',
                        color: '#6b7280',
                        marginBottom: '2px',
                      }}
                    >
                      Role
                    </label>
                    <select
                      name="role"
                      defaultValue="TENANT"
                      style={{
                        width: '100%',
                        fontSize: '0.85rem',
                        padding: '6px 8px',
                        borderRadius: '8px',
                        border: '1px solid #d1d5db',
                        background: '#f9fafb',
                      }}
                    >
                      <option value="TENANT">TENANT</option>
                      <option value="OWNER">OWNER</option>
                    </select>
                  </div>
                </div>

                <div
                  style={{
                    display: 'grid',
                    gridTemplateColumns: '1fr 1fr',
                    gap: '8px',
                    marginBottom: '10px',
                  }}
                >
                  <div>
                    <label
                      style={{
                        display: 'block',
                        fontSize: '0.75rem',
                        color: '#6b7280',
                        marginBottom: '2px',
                      }}
                    >
                      Area (HA)
                    </label>
                    <input
                      type="text"
                      name="areaFilter"
                      placeholder='e.g. "Room 1"'
                      style={{
                        width: '100%',
                        fontSize: '0.85rem',
                        padding: '6px 8px',
                        borderRadius: '8px',
                        border: '1px solid #d1d5db',
                      }}
                    />
                  </div>
                  <div>
                    <label
                      style={{
                        display: 'block',
                        fontSize: '0.75rem',
                        color: '#6b7280',
                        marginBottom: '2px',
                      }}
                    >
                      Labels (comma-separated)
                    </label>
                    <input
                      type="text"
                      name="labelFilter"
                      placeholder='e.g. "Lights, Blinds"'
                      style={{
                        width: '100%',
                        fontSize: '0.85rem',
                        padding: '6px 8px',
                        borderRadius: '8px',
                        border: '1px solid #d1d5db',
                      }}
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  style={{
                    border: 'none',
                    borderRadius: '9999px',
                    padding: '8px 14px',
                    fontSize: '0.85rem',
                    background: '#4f46e5',
                    color: '#ffffff',
                    cursor: 'pointer',
                    boxShadow:
                      '0 10px 20px rgba(79, 70, 229, 0.25)',
                  }}
                >
                  Add member
                </button>
              </form>
            </div>
          </div>

          {/* HA Areas & Labels reference */}
          <div
            style={{
              borderRadius: '20px',
              background: '#ffffff',
              boxShadow: '0 16px 30px rgba(15, 23, 42, 0.08)',
              padding: '14px 16px',
            }}
          >
            <h2
              style={{
                fontSize: '1.0rem',
                fontWeight: 600,
                marginBottom: '10px',
                color: '#111827',
              }}
            >
              Home Assistant Areas &amp; Labels
            </h2>

            {haError && (
              <div
                style={{
                  marginBottom: '10px',
                  padding: '8px 10px',
                  borderRadius: '12px',
                  background: '#fef2f2',
                  color: '#b91c1c',
                  fontSize: '0.8rem',
                }}
              >
                {haError}
              </div>
            )}

            {!haError && (
              <>
                <div style={{ marginBottom: '10px' }}>
                  <div
                    style={{
                      fontSize: '0.8rem',
                      fontWeight: 500,
                      marginBottom: '4px',
                      color: '#374151',
                    }}
                  >
                    Areas
                  </div>
                  {detectedAreas.length === 0 ? (
                    <p
                      style={{
                        fontSize: '0.8rem',
                        color: '#6b7280',
                      }}
                    >
                      No Areas detected yet. Set Areas for devices in Home
                      Assistant to use area-based access.
                    </p>
                  ) : (
                    <div
                      style={{
                        display: 'flex',
                        flexWrap: 'wrap',
                        gap: '4px',
                      }}
                    >
                      {detectedAreas.map((a) => (
                        <span
                          key={a}
                          style={{
                            padding: '2px 8px',
                            borderRadius: '9999px',
                            background: '#eef2ff',
                            color: '#4f46e5',
                            fontSize: '0.78rem',
                          }}
                        >
                          {a}
                        </span>
                      ))}
                    </div>
                  )}
                </div>

                <div>
                  <div
                    style={{
                      fontSize: '0.8rem',
                      fontWeight: 500,
                      marginBottom: '4px',
                      color: '#374151',
                    }}
                  >
                    Labels
                  </div>
                  {detectedLabels.length === 0 ? (
                    <p
                      style={{
                        fontSize: '0.8rem',
                        color: '#6b7280',
                      }}
                    >
                      No Labels detected yet. Add labels to devices in Home
                      Assistant to create nice tenant-friendly controls like
                      &quot;Main Light&quot; or &quot;Blinds&quot;.
                    </p>
                  ) : (
                    <div
                      style={{
                        display: 'flex',
                        flexWrap: 'wrap',
                        gap: '4px',
                      }}
                    >
                      {detectedLabels.map((l) => (
                        <span
                          key={l}
                          style={{
                            padding: '2px 8px',
                            borderRadius: '9999px',
                            background: '#ecfdf5',
                            color: '#047857',
                            fontSize: '0.78rem',
                          }}
                        >
                          {l}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </main>
  );
}
// app/households/[id]/members/page.tsx
import { notFound, redirect } from 'next/navigation';
import { prisma } from '@/lib/prisma';
import { getCurrentUser } from '@/lib/auth';
import { getDevicesWithMetadata } from '@/lib/homeAssistant';

type PageProps = {
  params: Promise<{
    id: string;
  }>;
};

export const dynamic = 'force-dynamic';

// --- Server actions ---

async function requireOwnerForHousehold(householdId: number) {
  const user = await getCurrentUser();
  if (!user) {
    redirect('/login');
  }

  const household = await prisma.household.findUnique({
    where: { id: householdId },
    include: { owner: true },
  });

  if (!household) {
    notFound();
  }

  if (household.ownerId !== user.id) {
    throw new Error('You are not the owner of this household.');
  }

  return { household, owner: user };
}

export async function addMemberAction(formData: FormData) {
  'use server';

  const householdId = Number(formData.get('householdId'));
  const email = String(formData.get('email') || '').trim();
  const role = String(formData.get('role') || 'TENANT') as 'OWNER' | 'TENANT';
  const areaFilter = String(formData.get('areaFilter') || '').trim() || null;
  const labelFilter = String(formData.get('labelFilter') || '').trim() || null;

  if (!householdId || !email) {
    return;
  }

  await requireOwnerForHousehold(householdId);

  // Find or create user
  let user = await prisma.user.findUnique({ where: { email } });
  if (!user) {
    user = await prisma.user.create({
      data: {
        email,
        role: role === 'OWNER' ? 'LANDLORD' : 'TENANT',
      },
    });
  }

  // Upsert HouseholdMember
  await prisma.householdMember.upsert({
    where: {
      userId_householdId: {
        userId: user.id,
        householdId,
      },
    },
    update: {
      role,
      areaFilter,
      labelFilterCsv: labelFilter,
    },
    create: {
      userId: user.id,
      householdId,
      role,
      areaFilter,
      labelFilterCsv: labelFilter,
    },
  });

  redirect(`/households/${householdId}/members`);
}

export async function updateMemberAction(formData: FormData) {
  'use server';

  const householdId = Number(formData.get('householdId'));
  const memberId = Number(formData.get('memberId'));
  const role = String(formData.get('role') || 'TENANT') as 'OWNER' | 'TENANT';
  const areaFilter = String(formData.get('areaFilter') || '').trim() || null;
  const labelFilter = String(formData.get('labelFilter') || '').trim() || null;

  if (!householdId || !memberId) {
    return;
  }

  await requireOwnerForHousehold(householdId);

  await prisma.householdMember.update({
    where: { id: memberId },
    data: {
      role,
      areaFilter,
      labelFilterCsv: labelFilter,
    },
  });

  redirect(`/households/${householdId}/members`);
}

export async function deleteMemberAction(formData: FormData) {
  'use server';

  const householdId = Number(formData.get('householdId'));
  const memberId = Number(formData.get('memberId'));

  if (!householdId || !memberId) {
    return;
  }

  await requireOwnerForHousehold(householdId);

  await prisma.householdMember.delete({
    where: { id: memberId },
  });

  redirect(`/households/${householdId}/members`);
}

// --- Page component ---

export default async function HouseholdMembersPage({ params }: PageProps) {
  const { id } = await params;
  const householdId = Number(id);
  if (Number.isNaN(householdId)) {
    notFound();
  }

  const user = await getCurrentUser();
  if (!user) {
    redirect('/login');
  }

  const household = await prisma.household.findUnique({
    where: { id: householdId },
    include: {
      owner: true,
      members: {
        include: {
          user: true,
        },
        orderBy: { id: 'asc' },
      },
    },
  });

  if (!household) {
    notFound();
  }

  if (household.ownerId !== user.id) {
    throw new Error('You are not the owner of this household.');
  }

  // Discover Areas + Labels from HA for this household
  let detectedAreas: string[] = [];
  let detectedLabels: string[] = [];
  let haError: string | null = null;

  try {
    const result = await getDevicesWithMetadata(householdId);
    if (!result.ok || !result.devices) {
      haError =
        result.error ??
        'Could not load devices from Home Assistant for this household.';
    } else {
      const devices = result.devices;
      const areaSet = new Set<string>();
      const labelSet = new Set<string>();

      for (const d of devices) {
        if (d.areaName) {
          areaSet.add(d.areaName);
        }
        if (d.labels && d.labels.length > 0) {
          d.labels.forEach((l) => {
            if (l && l.trim().length > 0) {
              labelSet.add(l.trim());
            }
          });
        }
      }

      detectedAreas = Array.from(areaSet).sort((a, b) =>
        a.localeCompare(b),
      );
      detectedLabels = Array.from(labelSet).sort((a, b) =>
        a.localeCompare(b),
      );
    }
  } catch (e) {
    haError = 'Failed to query Home Assistant for areas and labels.';
  }

  return (
    <main
      style={{
        minHeight: '100vh',
        padding: '40px 24px',
        background: '#eff6ff',
        fontFamily:
          'system-ui, -apple-system, BlinkMacSystemFont, sans-serif',
      }}
    >
      <div style={{ maxWidth: '980px', margin: '0 auto' }}>
        <a
          href={`/households/${householdId}/devices`}
          style={{
            display: 'inline-flex',
            marginBottom: '16px',
            padding: '6px 10px',
            borderRadius: '9999px',
            border: '1px solid #e5e7eb',
            fontSize: '0.85rem',
            color: '#111827',
            textDecoration: 'none',
          }}
        >
          ← Back to devices
        </a>

        <h1
          style={{
            fontSize: '1.8rem',
            fontWeight: 600,
            marginBottom: '4px',
            color: '#111827',
          }}
        >
          Members &amp; Access – {household.name}
        </h1>
        <p
          style={{
            marginBottom: '18px',
            color: '#6b7280',
            fontSize: '0.9rem',
          }}
        >
          Manage who can control this household, which{' '}
          <strong>Home Assistant Areas</strong> they see, and which{' '}
          <strong>Labels</strong> they&apos;re allowed to control.
          Tenants only see devices that match both their Area and allowed
          Labels.
        </p>

        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'minmax(0, 2.2fr) minmax(0, 1.2fr)',
            gap: '16px',
            alignItems: 'flex-start',
          }}
        >
          {/* Members list + add form */}
          <div
            style={{
              borderRadius: '20px',
              background: '#ffffff',
              boxShadow: '0 16px 30px rgba(15, 23, 42, 0.08)',
              padding: '16px 18px',
            }}
          >
            <h2
              style={{
                fontSize: '1.05rem',
                fontWeight: 600,
                marginBottom: '12px',
                color: '#111827',
              }}
            >
              Current members
            </h2>

            {household.members.length === 0 ? (
              <p
                style={{
                  fontSize: '0.9rem',
                  color: '#6b7280',
                  marginBottom: '12px',
                }}
              >
                No members yet. Add your first tenant below.
              </p>
            ) : (
              <table
                style={{
                  width: '100%',
                  borderCollapse: 'collapse',
                  fontSize: '0.85rem',
                }}
              >
                <thead>
                  <tr>
                    <th
                      style={{
                        textAlign: 'left',
                        padding: '6px',
                        borderBottom: '1px solid #e5e7eb',
                        color: '#6b7280',
                        fontWeight: 500,
                      }}
                    >
                      User
                    </th>
                    <th
                      style={{
                        textAlign: 'left',
                        padding: '6px',
                        borderBottom: '1px solid #e5e7eb',
                        color: '#6b7280',
                        fontWeight: 500,
                      }}
                    >
                      Role
                    </th>
                    <th
                      style={{
                        textAlign: 'left',
                        padding: '6px',
                        borderBottom: '1px solid #e5e7eb',
                        color: '#6b7280',
                        fontWeight: 500,
                      }}
                    >
                      Area
                    </th>
                    <th
                      style={{
                        textAlign: 'left',
                        padding: '6px',
                        borderBottom: '1px solid #e5e7eb',
                        color: '#6b7280',
                        fontWeight: 500,
                      }}
                    >
                      Labels (comma-separated)
                    </th>
                    <th
                      style={{
                        textAlign: 'left',
                        padding: '6px',
                        borderBottom: '1px solid #e5e7eb',
                        color: '#6b7280',
                        fontWeight: 500,
                      }}
                    >
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {household.members.map((m) => (
                    <tr key={m.id}>
                      <td
                        style={{
                          padding: '6px',
                          borderBottom: '1px solid #f3f4f6',
                        }}
                      >
                        <div
                          style={{
                            fontWeight: 500,
                            color: '#111827',
                          }}
                        >
                          {m.user.name || m.user.email}
                        </div>
                        <div
                          style={{
                            fontSize: '0.75rem',
                            color: '#6b7280',
                            fontFamily:
                              'ui-monospace, Menlo, Monaco, Consolas, "Liberation Mono", "Courier New", monospace',
                          }}
                        >
                          {m.user.email}
                        </div>
                      </td>
                      <td
                        style={{
                          padding: '6px',
                          borderBottom: '1px solid #f3f4f6',
                        }}
                      >
                        <form action={updateMemberAction}>
                          <input
                            type="hidden"
                            name="householdId"
                            value={householdId}
                          />
                          <input
                            type="hidden"
                            name="memberId"
                            value={m.id}
                          />
                          <select
                            name="role"
                            defaultValue={m.role}
                            style={{
                              fontSize: '0.8rem',
                              padding: '4px 6px',
                              borderRadius: '8px',
                              border: '1px solid #d1d5db',
                              background: '#f9fafb',
                            }}
                          >
                            <option value="TENANT">TENANT</option>
                            <option value="OWNER">OWNER</option>
                          </select>
                      </td>
                      <td
                        style={{
                          padding: '6px',
                          borderBottom: '1px solid #f3f4f6',
                        }}
                      >
                          <input
                            type="text"
                            name="areaFilter"
                            defaultValue={m.areaFilter ?? ''}
                            placeholder='e.g. "Room 1"'
                            style={{
                              width: '100%',
                              fontSize: '0.8rem',
                              padding: '4px 6px',
                              borderRadius: '8px',
                              border: '1px solid #d1d5db',
                            }}
                          />
                      </td>
                      <td
                        style={{
                          padding: '6px',
                          borderBottom: '1px solid #f3f4f6',
                        }}
                      >
                          <input
                            type="text"
                            name="labelFilter"
                            defaultValue={m.labelFilterCsv ?? ''}
                            placeholder='e.g. "Lights, Blinds"'
                            style={{
                              width: '100%',
                              fontSize: '0.8rem',
                              padding: '4px 6px',
                              borderRadius: '8px',
                              border: '1px solid #d1d5db',
                            }}
                          />
                      </td>
                      <td
                        style={{
                          padding: '6px',
                          borderBottom: '1px solid #f3f4f6',
                          whiteSpace: 'nowrap',
                        }}
                      >
                          <div
                            style={{
                              display: 'flex',
                              gap: '6px',
                            }}
                          >
                            <button
                              type="submit"
                              style={{
                                border: 'none',
                                borderRadius: '9999px',
                                padding: '4px 8px',
                                fontSize: '0.75rem',
                                background: '#4f46e5',
                                color: '#ffffff',
                                cursor: 'pointer',
                              }}
                            >
                              Save
                            </button>
                        </form>
                        <form action={deleteMemberAction}>
                          <input
                            type="hidden"
                            name="householdId"
                            value={householdId}
                          />
                          <input
                            type="hidden"
                            name="memberId"
                            value={m.id}
                          />
                          <button
                            type="submit"
                            style={{
                              border: 'none',
                              borderRadius: '9999px',
                              padding: '4px 8px',
                              fontSize: '0.75rem',
                              background: '#fee2e2',
                              color: '#b91c1c',
                              cursor: 'pointer',
                            }}
                          >
                            Remove
                          </button>
                        </form>
                          </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}

            {/* Add member form */}
            <div
              style={{
                marginTop: '18px',
                paddingTop: '12px',
                borderTop: '1px solid #e5e7eb',
              }}
            >
              <h3
                style={{
                  fontSize: '0.95rem',
                  fontWeight: 600,
                  marginBottom: '8px',
                }}
              >
                Add member
              </h3>
              <p
                style={{
                  fontSize: '0.8rem',
                  color: '#6b7280',
                  marginBottom: '8px',
                }}
              >
                Enter the tenant&apos;s email, choose their role, Area and
                allowed Labels. Dinodia Cloud will create the user if it
                doesn&apos;t exist yet.
              </p>
              <form action={addMemberAction}>
                <input
                  type="hidden"
                  name="householdId"
                  value={householdId}
                />
                <div
                  style={{
                    display: 'grid',
                    gridTemplateColumns: '2fr 1fr',
                    gap: '8px',
                    marginBottom: '8px',
                  }}
                >
                  <div>
                    <label
                      style={{
                        display: 'block',
                        fontSize: '0.75rem',
                        color: '#6b7280',
                        marginBottom: '2px',
                      }}
                    >
                      Email
                    </label>
                    <input
                      type="email"
                      name="email"
                      required
                      placeholder="tenant@example.com"
                      style={{
                        width: '100%',
                        fontSize: '0.85rem',
                        padding: '6px 8px',
                        borderRadius: '8px',
                        border: '1px solid #d1d5db',
                      }}
                    />
                  </div>
                  <div>
                    <label
                      style={{
                        display: 'block',
                        fontSize: '0.75rem',
                        color: '#6b7280',
                        marginBottom: '2px',
                      }}
                    >
                      Role
                    </label>
                    <select
                      name="role"
                      defaultValue="TENANT"
                      style={{
                        width: '100%',
                        fontSize: '0.85rem',
                        padding: '6px 8px',
                        borderRadius: '8px',
                        border: '1px solid #d1d5db',
                        background: '#f9fafb',
                      }}
                    >
                      <option value="TENANT">TENANT</option>
                      <option value="OWNER">OWNER</option>
                    </select>
                  </div>
                </div>

                <div
                  style={{
                    display: 'grid',
                    gridTemplateColumns: '1fr 1fr',
                    gap: '8px',
                    marginBottom: '10px',
                  }}
                >
                  <div>
                    <label
                      style={{
                        display: 'block',
                        fontSize: '0.75rem',
                        color: '#6b7280',
                        marginBottom: '2px',
                      }}
                    >
                      Area (HA)
                    </label>
                    <input
                      type="text"
                      name="areaFilter"
                      placeholder='e.g. "Room 1"'
                      style={{
                        width: '100%',
                        fontSize: '0.85rem',
                        padding: '6px 8px',
                        borderRadius: '8px',
                        border: '1px solid #d1d5db',
                      }}
                    />
                  </div>
                  <div>
                    <label
                      style={{
                        display: 'block',
                        fontSize: '0.75rem',
                        color: '#6b7280',
                        marginBottom: '2px',
                      }}
                    >
                      Labels (comma-separated)
                    </label>
                    <input
                      type="text"
                      name="labelFilter"
                      placeholder='e.g. "Lights, Blinds"'
                      style={{
                        width: '100%',
                        fontSize: '0.85rem',
                        padding: '6px 8px',
                        borderRadius: '8px',
                        border: '1px solid #d1d5db',
                      }}
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  style={{
                    border: 'none',
                    borderRadius: '9999px',
                    padding: '8px 14px',
                    fontSize: '0.85rem',
                    background: '#4f46e5',
                    color: '#ffffff',
                    cursor: 'pointer',
                    boxShadow:
                      '0 10px 20px rgba(79, 70, 229, 0.25)',
                  }}
                >
                  Add member
                </button>
              </form>
            </div>
          </div>

          {/* HA Areas & Labels reference */}
          <div
            style={{
              borderRadius: '20px',
              background: '#ffffff',
              boxShadow: '0 16px 30px rgba(15, 23, 42, 0.08)',
              padding: '14px 16px',
            }}
          >
            <h2
              style={{
                fontSize: '1.0rem',
                fontWeight: 600,
                marginBottom: '10px',
                color: '#111827',
              }}
            >
              Home Assistant Areas &amp; Labels
            </h2>

            {haError && (
              <div
                style={{
                  marginBottom: '10px',
                  padding: '8px 10px',
                  borderRadius: '12px',
                  background: '#fef2f2',
                  color: '#b91c1c',
                  fontSize: '0.8rem',
                }}
              >
                {haError}
              </div>
            )}

            {!haError && (
              <>
                <div style={{ marginBottom: '10px' }}>
                  <div
                    style={{
                      fontSize: '0.8rem',
                      fontWeight: 500,
                      marginBottom: '4px',
                      color: '#374151',
                    }}
                  >
                    Areas
                  </div>
                  {detectedAreas.length === 0 ? (
                    <p
                      style={{
                        fontSize: '0.8rem',
                        color: '#6b7280',
                      }}
                    >
                      No Areas detected yet. Set Areas for devices in Home
                      Assistant to use area-based access.
                    </p>
                  ) : (
                    <div
                      style={{
                        display: 'flex',
                        flexWrap: 'wrap',
                        gap: '4px',
                      }}
                    >
                      {detectedAreas.map((a) => (
                        <span
                          key={a}
                          style={{
                            padding: '2px 8px',
                            borderRadius: '9999px',
                            background: '#eef2ff',
                            color: '#4f46e5',
                            fontSize: '0.78rem',
                          }}
                        >
                          {a}
                        </span>
                      ))}
                    </div>
                  )}
                </div>

                <div>
                  <div
                    style={{
                      fontSize: '0.8rem',
                      fontWeight: 500,
                      marginBottom: '4px',
                      color: '#374151',
                    }}
                  >
                    Labels
                  </div>
                  {detectedLabels.length === 0 ? (
                    <p
                      style={{
                        fontSize: '0.8rem',
                        color: '#6b7280',
                      }}
                    >
                      No Labels detected yet. Add labels to devices in Home
                      Assistant to create nice tenant-friendly controls like
                      &quot;Main Light&quot; or &quot;Blinds&quot;.
                    </p>
                  ) : (
                    <div
                      style={{
                        display: 'flex',
                        flexWrap: 'wrap',
                        gap: '4px',
                      }}
                    >
                      {detectedLabels.map((l) => (
                        <span
                          key={l}
                          style={{
                            padding: '2px 8px',
                            borderRadius: '9999px',
                            background: '#ecfdf5',
                            color: '#047857',
                            fontSize: '0.78rem',
                          }}
                        >
                          {l}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </main>
  );
}
