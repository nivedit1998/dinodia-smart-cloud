// app/households/[id]/devices/page.tsx
import { prisma } from '@/lib/prisma';
import { notFound, redirect } from 'next/navigation';
import { DinodiaDevice, getDevicesWithMetadata } from '@/lib/homeAssistant';
import { DeviceToggleButton } from '@/app/components/DeviceToggleButton';
import { HouseholdNavTabs } from '@/app/components/HouseholdNavTabs';
import { getCurrentUser } from '@/lib/auth';
import { getHouseholdAccessInfo } from '@/lib/tenants';

type PageProps = {
  params: Promise<{
    id: string;
  }>;
};

export const dynamic = 'force-dynamic';

export default async function HouseholdDevicesPage({ params }: PageProps) {
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
      homeAssistant: true,
      owner: true,
    },
  });

  if (!household) {
    notFound();
  }

  const access = await getHouseholdAccessInfo(householdId, user.id);
  if (access.role !== 'OWNER') {
    notFound();
  }

  let devices: DinodiaDevice[] | null = null;
  let error: string | null = null;

  if (!household.homeAssistant) {
    error = 'Home Assistant hub is not configured for this household yet.';
  } else {
    const result = await getDevicesWithMetadata(householdId);
    if (!result.ok) {
      error = result.error ?? 'Failed to load devices from Home Assistant';
      devices = result.devices ?? [];
    } else {
      devices = result.devices ?? [];
    }
  }

  // Simple domain ordering: lights & switches first, then others
  const domainOrder = ['light', 'switch', 'cover', 'sensor', 'binary_sensor', 'media_player'];

  if (devices) {
    devices.sort((a, b) => {
      const ai = domainOrder.indexOf(a.domain);
      const bi = domainOrder.indexOf(b.domain);
      const ad = ai === -1 ? 999 : ai;
      const bd = bi === -1 ? 999 : bi;
      if (ad !== bd) return ad - bd;

      // Secondary sort: area then name
      const an = a.areaName ?? '';
      const bn = b.areaName ?? '';
      if (an !== bn) return an.localeCompare(bn);

      return a.friendlyName.localeCompare(b.friendlyName);
    });
  }

  return (
    <main
      style={{
        minHeight: '100vh',
        padding: '40px 24px',
        background: '#eff6ff',
        fontFamily: 'system-ui, -apple-system, BlinkMacSystemFont, sans-serif',
      }}
    >
      <div
        style={{
          maxWidth: '960px',
          margin: '0 auto',
        }}
      >
        <a
          href="/households"
          style={{
            display: 'inline-flex',
            marginBottom: '8px',
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
            fontSize: '1.6rem',
            fontWeight: 600,
            marginBottom: '4px',
            color: '#111827',
          }}
        >
          Devices in {household.name}
        </h1>
        <p
          style={{
            marginBottom: '8px',
            color: '#6b7280',
            fontSize: '0.9rem',
          }}
        >
          These entities are coming directly from the Home Assistant hub configured for
          this household. Lights and switches can be toggled from here.
        </p>

        {/* Per-household nav tabs */}
        <HouseholdNavTabs householdId={householdId} role="OWNER" />

        {!household.homeAssistant && (
          <p
            style={{
              fontSize: '0.9rem',
              color: '#b91c1c',
              marginBottom: '12px',
            }}
          >
            Home Assistant is not configured yet. Configure it first, then come back.
          </p>
        )}

        {error && (
          <div
            style={{
              marginBottom: '16px',
              padding: '10px 12px',
              borderRadius: '12px',
              background: '#fef2f2',
              color: '#b91c1c',
              fontSize: '0.85rem',
            }}
          >
            {error}
          </div>
        )}

        {devices && devices.length > 0 && (
          <div
            style={{
              borderRadius: '20px',
              background: '#ffffff',
              boxShadow: '0 16px 30px rgba(15, 23, 42, 0.08)',
              padding: '16px 18px',
              overflowX: 'auto',
            }}
          >
            <table
              style={{
                width: '100%',
                borderCollapse: 'collapse',
                fontSize: '0.85rem',
                minWidth: '820px',
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
                    Name
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
                    Entity ID
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
                    Domain
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
                    Area
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
                    Labels
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
                    State
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
                    Control
                  </th>
                </tr>
              </thead>
              <tbody>
                {devices.map((d) => (
                  <tr key={d.entityId}>
                    <td
                      style={{
                        padding: '8px',
                        borderBottom: '1px solid #f3f4f6',
                      }}
                    >
                      {d.friendlyName}
                    </td>
                    <td
                      style={{
                        padding: '8px',
                        borderBottom: '1px solid #f3f4f6',
                        color: '#6b7280',
                        fontFamily:
                          'ui-monospace, Menlo, Monaco, Consolas, "Liberation Mono", "Courier New", monospace',
                      }}
                    >
                      {d.entityId}
                    </td>
                    <td
                      style={{
                        padding: '8px',
                        borderBottom: '1px solid #f3f4f6',
                        color: '#4b5563',
                      }}
                    >
                      {d.domain}
                    </td>
                    <td
                      style={{
                        padding: '8px',
                        borderBottom: '1px solid #f3f4f6',
                        color: d.areaName ? '#111827' : '#9ca3af',
                      }}
                    >
                      {d.areaName ?? '—'}
                    </td>
                    <td
                      style={{
                        padding: '8px',
                        borderBottom: '1px solid #f3f4f6',
                      }}
                    >
                      {!d.labels || d.labels.length === 0 ? (
                        <span style={{ color: '#9ca3af' }}>—</span>
                      ) : (
                        <div
                          style={{
                            display: 'flex',
                            flexWrap: 'wrap',
                            gap: '4px',
                          }}
                        >
                          {d.labels.map((label) => (
                            <span
                              key={label}
                              style={{
                                padding: '2px 6px',
                                borderRadius: '9999px',
                                background: '#eef2ff',
                                color: '#4f46e5',
                              }}
                            >
                              {label}
                            </span>
                          ))}
                        </div>
                      )}
                    </td>
                    <td
                      style={{
                        padding: '8px',
                        borderBottom: '1px solid #f3f4f6',
                        color: d.state === 'on' ? '#16a34a' : '#6b7280',
                      }}
                    >
                      {d.state}
                    </td>
                    <td
                      style={{
                        padding: '8px',
                        borderBottom: '1px solid #f3f4f6',
                      }}
                    >
                      <DeviceToggleButton
                        householdId={householdId}
                        entityId={d.entityId}
                        domain={d.domain}
                        initialState={d.state}
                      />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {devices && devices.length === 0 && !error && (
          <p
            style={{
              marginTop: '12px',
              fontSize: '0.9rem',
              color: '#6b7280',
            }}
          >
            No entities found from Home Assistant. Add some devices first.
          </p>
        )}
      </div>
    </main>
  );
}
