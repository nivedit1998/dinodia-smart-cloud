// app/households/[id]/overview/page.tsx
import { notFound, redirect } from 'next/navigation';
import { prisma } from '@/lib/prisma';
import { getCurrentUser } from '@/lib/auth';
import { getDevicesWithMetadata } from '@/lib/homeAssistant';
import { HouseholdNavTabs } from '@/app/components/HouseholdNavTabs';

type PageProps = {
  params: Promise<{
    id: string;
  }>;
};

export const dynamic = 'force-dynamic';

export default async function HouseholdOverviewPage({ params }: PageProps) {
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
      homeAssistant: true,
      spotifyToken: true,
      members: true,
    },
  });

  if (!household) {
    notFound();
  }

  // Landlord-only: either the global LANDLORD role or the actual owner of this household
  const isOwner = household.ownerId === user.id;
  const isLandlordUser = user.role === 'LANDLORD';

  if (!isOwner && !isLandlordUser) {
    // Tenants shouldn't see this page
    notFound();
  }

  const ha = household.homeAssistant;
  const spotify = household.spotifyToken;

  // Count tenants for this household
  const tenantCount =
    household.members?.filter((m) => m.role === 'TENANT').length ??
    0;

  // Try to load devices to estimate "rooms" from HA areas
  let roomCount: number | null = null;
  let haDevicesError: string | null = null;

  if (ha) {
    const result = await getDevicesWithMetadata(householdId);
    if (!result.ok) {
      haDevicesError = result.error ?? 'Could not load devices from Home Assistant.';
    } else {
      const seenAreas = new Set<string>();
      for (const d of result.devices ?? []) {
        if (d.areaName) {
          seenAreas.add(d.areaName);
        }
      }
      roomCount = seenAreas.size;
    }
  }

  const haStatus = ha ? 'Connected' : 'Not configured';
  const spotifyStatus = spotify ? 'Linked' : 'Not linked';

  // Simple “sentence” summary for the top of the page
  const summaryParts: string[] = [];
  summaryParts.push(`Home Assistant: ${haStatus}`);
  summaryParts.push(`Spotify: ${spotifyStatus}`);
  summaryParts.push(`${tenantCount} tenant${tenantCount === 1 ? '' : 's'}`);
  if (roomCount !== null) {
    summaryParts.push(`${roomCount} room${roomCount === 1 ? '' : 's'} (from HA areas)`);
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
      <div style={{ maxWidth: '960px', margin: '0 auto' }}>
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
            fontSize: '1.7rem',
            fontWeight: 600,
            marginBottom: '4px',
            color: '#111827',
          }}
        >
          Landlord overview · {household.name}
        </h1>

        <p
          style={{
            marginBottom: '8px',
            color: '#6b7280',
            fontSize: '0.9rem',
          }}
        >
          High-level status for this property. Only visible to the landlord / owner.
        </p>

        {/* Per-household tabs (overview isn’t in the tab bar yet, but keeps nav consistent) */}
        <HouseholdNavTabs householdId={householdId} />

        {/* Summary pill */}
        <div
          style={{
            marginTop: '12px',
            marginBottom: '16px',
            padding: '10px 14px',
            borderRadius: '9999px',
            background: '#eef2ff',
            border: '1px solid #c7d2fe',
            fontSize: '0.8rem',
            color: '#3730a3',
          }}
        >
          This flat has: {summaryParts.join(' · ')}. Alexa / Google voice will be
          configured at the household level in future.
        </div>

        {/* Card grid with more details */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'minmax(0, 1.2fr) minmax(0, 1fr)',
            gap: '16px',
            marginBottom: '16px',
          }}
        >
          {/* Left column: Integrations + HA connection */}
          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              gap: '12px',
            }}
          >
            {/* Home Assistant card */}
            <div
              style={{
                borderRadius: '20px',
                padding: '14px 16px',
                background: '#ffffff',
                boxShadow: '0 16px 30px rgba(15,23,42,0.12)',
              }}
            >
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  marginBottom: '4px',
                }}
              >
                <div
                  style={{
                    fontSize: '0.95rem',
                    fontWeight: 600,
                    color: '#111827',
                  }}
                >
                  Home Assistant hub
                </div>
                <span
                  style={{
                    fontSize: '0.75rem',
                    padding: '2px 8px',
                    borderRadius: '9999px',
                    background: ha ? '#dcfce7' : '#fee2e2',
                    color: ha ? '#166534' : '#b91c1c',
                  }}
                >
                  {haStatus}
                </span>
              </div>
              <p
                style={{
                  fontSize: '0.8rem',
                  color: '#6b7280',
                  margin: 0,
                }}
              >
                Dinodia Smart Cloud is connected to the Home Assistant Green hub for this
                property. Device lists, room dashboards and tenant limits all flow from
                this.
              </p>
              {ha ? (
                <p
                  style={{
                    fontSize: '0.75rem',
                    color: '#4b5563',
                    marginTop: '6px',
                  }}
                >
                  Base URL:{' '}
                  <span
                    style={{
                      fontFamily:
                        'ui-monospace, Menlo, Monaco, Consolas, "Liberation Mono", "Courier New", monospace',
                    }}
                  >
                    {ha.baseUrl}
                  </span>
                </p>
              ) : (
                <p
                  style={{
                    fontSize: '0.75rem',
                    color: '#b91c1c',
                    marginTop: '6px',
                  }}
                >
                  Not connected yet. Go to the Integrations tab and configure the Home
                  Assistant URL and token.
                </p>
              )}

              {haDevicesError && (
                <p
                  style={{
                    marginTop: '8px',
                    fontSize: '0.75rem',
                    color: '#b91c1c',
                  }}
                >
                  ⚠️ {haDevicesError}
                </p>
              )}
            </div>

            {/* Spotify card */}
            <div
              style={{
                borderRadius: '20px',
                padding: '14px 16px',
                background: '#ffffff',
                boxShadow: '0 16px 30px rgba(15,23,42,0.12)',
              }}
            >
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  marginBottom: '4px',
                }}
              >
                <div
                  style={{
                    fontSize: '0.95rem',
                    fontWeight: 600,
                    color: '#111827',
                  }}
                >
                  Household Spotify
                </div>
                <span
                  style={{
                    fontSize: '0.75rem',
                    padding: '2px 8px',
                    borderRadius: '9999px',
                    background: spotify ? '#dcfce7' : '#fef3c7',
                    color: spotify ? '#166534' : '#92400e',
                  }}
                >
                  {spotifyStatus}
                </span>
              </div>
              <p
                style={{
                  fontSize: '0.8rem',
                  color: '#6b7280',
                  margin: 0,
                }}
              >
                One Spotify account per home. Used for TVs and speakers in shared areas
                like the living room. Tenants only see controls for devices in their own
                room.
              </p>
              <div
                style={{
                  marginTop: '8px',
                  display: 'flex',
                  justifyContent: 'flex-end',
                  gap: '8px',
                  fontSize: '0.8rem',
                }}
              >
                <a
                  href={`/households/${householdId}/integrations`}
                  style={{
                    padding: '6px 10px',
                    borderRadius: '9999px',
                    border: '1px solid #e5e7eb',
                    textDecoration: 'none',
                    color: '#111827',
                    background: '#f9fafb',
                  }}
                >
                  Open integrations
                </a>
                <a
                  href="/spotify/connected"
                  style={{
                    padding: '6px 10px',
                    borderRadius: '9999px',
                    textDecoration: 'none',
                    color: '#ffffff',
                    background: '#4f46e5',
                  }}
                >
                  Manage Spotify
                </a>
              </div>
            </div>
          </div>

          {/* Right column: people & rooms */}
          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              gap: '12px',
            }}
          >
            {/* People card */}
            <div
              style={{
                borderRadius: '20px',
                padding: '14px 16px',
                background: '#ffffff',
                boxShadow: '0 16px 30px rgba(15,23,42,0.12)',
              }}
            >
              <div
                style={{
                  fontSize: '0.95rem',
                  fontWeight: 600,
                  color: '#111827',
                  marginBottom: '4px',
                }}
              >
                People in this property
              </div>
              <p
                style={{
                  fontSize: '0.8rem',
                  color: '#6b7280',
                  margin: 0,
                }}
              >
                Owner: <strong>{household.owner?.name ?? household.owner?.email}</strong>
              </p>
              <p
                style={{
                  fontSize: '0.8rem',
                  color: '#6b7280',
                  marginTop: '4px',
                  marginBottom: '8px',
                }}
              >
                {tenantCount === 0
                  ? 'No tenants added yet.'
                  : `${tenantCount} tenant${tenantCount === 1 ? '' : 's'} with room-level access.`}
              </p>
              <a
                href={`/households/${householdId}/members`}
                style={{
                  padding: '6px 10px',
                  borderRadius: '9999px',
                  background: '#f9fafb',
                  border: '1px solid #e5e7eb',
                  textDecoration: 'none',
                  color: '#111827',
                  fontSize: '0.8rem',
                }}
              >
                Manage members & access
              </a>
            </div>

            {/* Rooms card */}
            <div
              style={{
                borderRadius: '20px',
                padding: '14px 16px',
                background: '#ffffff',
                boxShadow: '0 16px 30px rgba(15,23,42,0.12)',
              }}
            >
              <div
                style={{
                  fontSize: '0.95rem',
                  fontWeight: 600,
                  color: '#111827',
                  marginBottom: '4px',
                }}
              >
                Rooms & areas
              </div>
              {roomCount !== null ? (
                <p
                  style={{
                    fontSize: '0.8rem',
                    color: '#6b7280',
                    margin: 0,
                  }}
                >
                  We found <strong>{roomCount}</strong> distinct areas in Home Assistant
                  for this property. Room dashboards and tenant access are based on these
                  areas plus your label filters.
                </p>
              ) : (
                <p
                  style={{
                    fontSize: '0.8rem',
                    color: '#6b7280',
                    margin: 0,
                  }}
                >
                  We couldn&apos;t load areas from Home Assistant yet. Once the hub is
                  connected and devices are added, this will show a count of rooms.
                </p>
              )}
              <p
                style={{
                  fontSize: '0.75rem',
                  color: '#9ca3af',
                  marginTop: '6px',
                }}
              >
                Tip: in Dinodia, tenants are linked to an <strong>area</strong> (e.g.
                “Room 1”, “Bedroom 2”). They only see devices in that area that also have
                the right labels.
              </p>
            </div>
          </div>
        </div>

        {/* Roadmap info card */}
        <div
          style={{
            marginTop: '4px',
            padding: '10px 14px',
            borderRadius: '16px',
            background: '#f9fafb',
            border: '1px dashed #e5e7eb',
            fontSize: '0.8rem',
            color: '#4b5563',
          }}
        >
          <strong>Roadmap:</strong> voice assistants (Alexa / Google), per-tenant Spotify
          and usage reports can all plug into this overview so you can see, at a glance,
          how “smart” each flat is.
        </div>
      </div>
    </main>
  );
}
