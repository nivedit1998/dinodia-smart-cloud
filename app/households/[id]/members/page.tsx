// app/households/[id]/members/page.tsx
import { prisma } from '@/lib/prisma';
import { notFound } from 'next/navigation';
import { getDevicesWithMetadata } from '@/lib/homeAssistant';
import { revalidatePath } from 'next/cache';

type PageProps = {
  params: Promise<{
    id: string;
  }>;
};

export const dynamic = 'force-dynamic';

// 🔒 In future, plug in your real auth and landlord check here
async function getCurrentUserId(): Promise<number | null> {
  const user = await prisma.user.findFirst();
  return user?.id ?? null;
}

/**
 * Add or update a household member.
 * If a HouseholdMember already exists for (userId, householdId), we update it.
 */
export async function addOrUpdateMember(formData: FormData) {
  'use server';

  const householdId = Number(formData.get('householdId'));
  const userId = Number(formData.get('userId'));
  const role = String(formData.get('role')) as 'OWNER' | 'TENANT';
  const rawArea = formData.get('areaFilter');
  const areaFilter =
    rawArea && String(rawArea).trim().length > 0
      ? String(rawArea).trim()
      : null;

  if (!householdId || !userId || !role) {
    throw new Error('Missing required fields');
  }

  await prisma.householdMember.upsert({
    where: {
      userId_householdId: {
        userId,
        householdId,
      },
    },
    create: {
      householdId,
      userId,
      role,
      areaFilter,
    },
    update: {
      role,
      areaFilter,
    },
  });

  // Refresh the page data
  revalidatePath(`/households/${householdId}/members`);
}

/**
 * Remove a household member by id.
 */
export async function removeMember(formData: FormData) {
  'use server';

  const memberId = Number(formData.get('memberId'));
  const householdId = Number(formData.get('householdId'));

  if (!memberId) return;

  await prisma.householdMember.delete({
    where: { id: memberId },
  });

  revalidatePath(`/households/${householdId}/members`);
}

export default async function HouseholdMembersPage({ params }: PageProps) {
  const { id } = await params;
  const householdId = Number(id);
  if (Number.isNaN(householdId)) {
    notFound();
  }

  const currentUserId = await getCurrentUserId();
  if (!currentUserId) {
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
        <div style={{ maxWidth: '960px', margin: '0 auto' }}>
          <h1
            style={{
              fontSize: '1.6rem',
              fontWeight: 600,
              marginBottom: '8px',
              color: '#111827',
            }}
          >
            Members &amp; Access
          </h1>
          <p
            style={{
              color: '#b91c1c',
              fontSize: '0.9rem',
            }}
          >
            No user session found. Wire your auth into{' '}
            <code>getCurrentUserId()</code> to restrict access properly.
          </p>
        </div>
      </main>
    );
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

  // Load users so a landlord can select who to add as member
  const users = await prisma.user.findMany({
    orderBy: { email: 'asc' },
  });

  // Derive available Areas from Home Assistant devices (areaName)
  const devicesResult = await getDevicesWithMetadata(householdId);
  const areaOptions =
    devicesResult.ok && devicesResult.devices
      ? Array.from(
          new Set(
            devicesResult.devices
              .map((d) => d.areaName || '')
              .filter((name) => name && name.trim().length > 0),
          ),
        ).sort((a, b) => a.localeCompare(b))
      : [];

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
      <div style={{ maxWidth: '960px', margin: '0 auto' }}>
        <a
          href="/households"
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
          ← Back to households
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
            marginBottom: '20px',
            color: '#6b7280',
            fontSize: '0.9rem',
          }}
        >
          Manage who can control this household and which Home Assistant{' '}
          <strong>Area</strong> each tenant can see. Dinodia uses Home
          Assistant Areas (e.g. &quot;Living Room&quot;, &quot;Room 1&quot;)
          to isolate access for HMOs.
        </p>

        {/* Owner summary */}
        <section
          style={{
            marginBottom: '24px',
            padding: '16px 18px',
            borderRadius: '16px',
            background: '#eef2ff',
            border: '1px solid #e5e7eb',
          }}
        >
          <h2
            style={{
              fontSize: '1.1rem',
              fontWeight: 600,
              marginBottom: '8px',
              color: '#111827',
            }}
          >
            Owner
          </h2>
          <p
            style={{
              margin: 0,
              fontSize: '0.9rem',
              color: '#4b5563',
            }}
          >
            {household.owner?.name || 'Unnamed'} –{' '}
            <code>{household.owner?.email}</code>
          </p>
        </section>

        {/* Current members */}
        <section
          style={{
            marginBottom: '24px',
            padding: '16px 18px',
            borderRadius: '16px',
            background: '#ffffff',
            boxShadow: '0 10px 25px rgba(15, 23, 42, 0.06)',
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
            Current Members
          </h2>

          {household.members.length === 0 ? (
            <p
              style={{
                fontSize: '0.9rem',
                color: '#6b7280',
              }}
            >
              No additional members yet. Use the form below to add tenants or
              co-owners.
            </p>
          ) : (
            <div style={{ overflowX: 'auto' }}>
              <table
                style={{
                  width: '100%',
                  borderCollapse: 'collapse',
                  fontSize: '0.85rem',
                  minWidth: '620px',
                }}
              >
                <thead>
                  <tr>
                    <th
                      style={{
                        textAlign: 'left',
                        padding: '8px',
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
                        padding: '8px',
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
                        padding: '8px',
                        borderBottom: '1px solid #e5e7eb',
                        color: '#6b7280',
                        fontWeight: 500,
                      }}
                    >
                      Area Filter
                    </th>
                    <th
                      style={{
                        textAlign: 'left',
                        padding: '8px',
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
                          padding: '8px',
                          borderBottom: '1px solid #f3f4f6',
                        }}
                      >
                        <div
                          style={{
                            display: 'flex',
                            flexDirection: 'column',
                          }}
                        >
                          <span
                            style={{
                              fontWeight: 500,
                              color: '#111827',
                            }}
                          >
                            {m.user.name || '(No name)'}
                          </span>
                          <span
                            style={{
                              color: '#6b7280',
                              fontFamily:
                                'ui-monospace, Menlo, Monaco, Consolas, "Liberation Mono", "Courier New", monospace',
                            }}
                          >
                            {m.user.email}
                          </span>
                        </div>
                      </td>
                      <td
                        style={{
                          padding: '8px',
                          borderBottom: '1px solid #f3f4f6',
                          textTransform: 'capitalize',
                        }}
                      >
                        {m.role.toLowerCase()}
                      </td>
                      <td
                        style={{
                          padding: '8px',
                          borderBottom: '1px solid #f3f4f6',
                        }}
                      >
                        {m.areaFilter ? (
                          <span
                            style={{
                              padding: '2px 6px',
                              borderRadius: '9999px',
                              background: '#ecfdf5',
                              color: '#047857',
                              fontSize: '0.8rem',
                            }}
                          >
                            {m.areaFilter}
                          </span>
                        ) : (
                          <span style={{ color: '#9ca3af' }}>All areas</span>
                        )}
                      </td>
                      <td
                        style={{
                          padding: '8px',
                          borderBottom: '1px solid #f3f4f6',
                        }}
                      >
                        <form action={removeMember}>
                          <input
                            type="hidden"
                            name="memberId"
                            value={m.id}
                          />
                          <input
                            type="hidden"
                            name="householdId"
                            value={householdId}
                          />
                          <button
                            type="submit"
                            style={{
                              border: 'none',
                              background: '#fef2f2',
                              color: '#b91c1c',
                              padding: '4px 8px',
                              borderRadius: '9999px',
                              fontSize: '0.8rem',
                              cursor: 'pointer',
                            }}
                          >
                            Remove
                          </button>
                        </form>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>

        {/* Add / update member form */}
        <section
          style={{
            marginBottom: '24px',
            padding: '16px 18px',
            borderRadius: '16px',
            background: '#ffffff',
            boxShadow: '0 10px 25px rgba(15, 23, 42, 0.06)',
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
            Add or Update Member
          </h2>
          <p
            style={{
              marginTop: 0,
              marginBottom: '12px',
              fontSize: '0.85rem',
              color: '#6b7280',
            }}
          >
            Choose a user, assign them a role, and optionally limit them to a
            single Home Assistant Area (for example, &quot;Room 1&quot;). If no
            area is selected, they&apos;ll see all areas they&apos;re allowed
            to access.
          </p>

          <form
            action={addOrUpdateMember}
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
              gap: '12px 16px',
              alignItems: 'flex-end',
            }}
          >
            <input type="hidden" name="householdId" value={householdId} />

            {/* User select */}
            <div style={{ display: 'flex', flexDirection: 'column' }}>
              <label
                htmlFor="userId"
                style={{
                  fontSize: '0.8rem',
                  color: '#4b5563',
                  marginBottom: '4px',
                }}
              >
                User
              </label>
              <select
                id="userId"
                name="userId"
                required
                style={{
                  padding: '6px 8px',
                  borderRadius: '10px',
                  border: '1px solid #d1d5db',
                  fontSize: '0.85rem',
                }}
              >
                <option value="">Select user…</option>
                {users.map((u) => (
                  <option key={u.id} value={u.id}>
                    {u.email}
                    {u.name ? ` – ${u.name}` : ''}
                  </option>
                ))}
              </select>
            </div>

            {/* Role select */}
            <div style={{ display: 'flex', flexDirection: 'column' }}>
              <label
                htmlFor="role"
                style={{
                  fontSize: '0.8rem',
                  color: '#4b5563',
                  marginBottom: '4px',
                }}
              >
                Role
              </label>
              <select
                id="role"
                name="role"
                required
                defaultValue="TENANT"
                style={{
                  padding: '6px 8px',
                  borderRadius: '10px',
                  border: '1px solid #d1d5db',
                  fontSize: '0.85rem',
                }}
              >
                <option value="OWNER">Owner</option>
                <option value="TENANT">Tenant</option>
              </select>
            </div>

            {/* Area select */}
            <div style={{ display: 'flex', flexDirection: 'column' }}>
              <label
                htmlFor="areaFilter"
                style={{
                  fontSize: '0.8rem',
                  color: '#4b5563',
                  marginBottom: '4px',
                }}
              >
                Home Assistant Area
              </label>
              <select
                id="areaFilter"
                name="areaFilter"
                style={{
                  padding: '6px 8px',
                  borderRadius: '10px',
                  border: '1px solid #d1d5db',
                  fontSize: '0.85rem',
                }}
              >
                <option value="">All areas</option>
                {areaOptions.map((area) => (
                  <option key={area} value={area}>
                    {area}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <button
                type="submit"
                style={{
                  padding: '8px 16px',
                  borderRadius: '9999px',
                  border: 'none',
                  background: '#4f46e5',
                  color: '#ffffff',
                  fontSize: '0.85rem',
                  fontWeight: 500,
                  cursor: 'pointer',
                  boxShadow: '0 10px 20px rgba(79, 70, 229, 0.25)',
                }}
              >
                Save member
              </button>
            </div>
          </form>
        </section>
      </div>
    </main>
  );
}
