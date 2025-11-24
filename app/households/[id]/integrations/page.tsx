// app/households/[id]/integrations/page.tsx
import { notFound, redirect } from 'next/navigation';
import { prisma } from '@/lib/prisma';
import { getCurrentUser } from '@/lib/auth';
import { getHouseholdAccessInfo } from '@/lib/tenants';
import { HouseholdNavTabs } from '@/app/components/HouseholdNavTabs';

type PageProps = {
  params: Promise<{
    id: string;
  }>;
};

export const dynamic = 'force-dynamic';

export default async function HouseholdIntegrationsPage({ params }: PageProps) {
  const { id } = await params;
  const householdId = Number(id);
  if (Number.isNaN(householdId)) {
    notFound();
  }

  const user = await getCurrentUser();
  if (!user) {
    redirect('/login');
  }

  // Check access (we only really want landlords/owners here)
  const access = await getHouseholdAccessInfo(householdId, user.id);
  if (access.role !== 'OWNER') {
    notFound();
  }

  const household = await prisma.household.findUnique({
    where: { id: householdId },
    include: {
      homeAssistant: true,
      spotifyToken: true,
      owner: true,
    },
  });

  if (!household) {
    notFound();
  }

  const ha = household.homeAssistant;
  const spotify = household.spotifyToken;
  const isLandlordView = true;

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
            fontSize: '1.6rem',
            fontWeight: 600,
            marginBottom: '4px',
            color: '#111827',
          }}
        >
          Integrations · {household.name}
        </h1>
        <p
          style={{
            marginBottom: '8px',
            color: '#6b7280',
            fontSize: '0.9rem',
          }}
        >
          Manage how this property connects to Home Assistant, Spotify and,
          in future, voice assistants like Alexa and Google Home.
        </p>

        {/* Tabs */}
        <HouseholdNavTabs householdId={householdId} role="OWNER" />

        {/* Card grid */}
        <div
          style={{
            marginTop: '8px',
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
            gap: '16px',
          }}
        >
          {/* Home Assistant */}
          <div
            style={{
              borderRadius: '20px',
              padding: '14px 14px 12px',
              background: '#ffffff',
              boxShadow: '0 14px 28px rgba(15,23,42,0.12)',
              display: 'flex',
              flexDirection: 'column',
              gap: '8px',
            }}
          >
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
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
                {ha ? 'Connected' : 'Not configured'}
              </span>
            </div>
            <p
              style={{
                fontSize: '0.8rem',
                color: '#6b7280',
                margin: 0,
              }}
            >
              Dinodia Smart Cloud talks to this property&apos;s Home Assistant Green hub.
            </p>
            {ha ? (
              <>
                <div
                  style={{
                    fontSize: '0.75rem',
                    color: '#4b5563',
                    marginTop: '4px',
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
                </div>
                {isLandlordView && (
                  <div
                    style={{
                      marginTop: '6px',
                      display: 'flex',
                      justifyContent: 'flex-end',
                    }}
                  >
                    <a
                      href={`/households/${householdId}/home-assistant`}
                      style={{
                        padding: '6px 10px',
                        borderRadius: '9999px',
                        border: '1px solid #e5e7eb',
                        background: '#f9fafb',
                        color: '#111827',
                        fontSize: '0.8rem',
                        textDecoration: 'none',
                        cursor: 'pointer',
                      }}
                    >
                      Edit Home Assistant config
                    </a>
                  </div>
                )}
              </>
            ) : (
              <>
                <div
                  style={{
                    fontSize: '0.75rem',
                    color: '#b91c1c',
                    marginTop: '4px',
                  }}
                >
                  Home Assistant isn&apos;t connected yet for this household.
                </div>
                {isLandlordView && (
                  <div
                    style={{
                      marginTop: '6px',
                      display: 'flex',
                      justifyContent: 'flex-end',
                    }}
                  >
                    <a
                      href={`/households/${householdId}/home-assistant`}
                      style={{
                        padding: '6px 10px',
                        borderRadius: '9999px',
                        border: 'none',
                        background: '#4f46e5',
                        color: '#ffffff',
                        fontSize: '0.8rem',
                        textDecoration: 'none',
                        cursor: 'pointer',
                      }}
                    >
                      Connect Home Assistant
                    </a>
                  </div>
                )}
              </>
            )}
          </div>

          {/* Spotify */}
          <div
            style={{
              borderRadius: '20px',
              padding: '14px 14px 12px',
              background: '#ffffff',
              boxShadow: '0 14px 28px rgba(15,23,42,0.12)',
              display: 'flex',
              flexDirection: 'column',
              gap: '8px',
            }}
          >
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
              }}
            >
              <div
                style={{
                  fontSize: '0.95rem',
                  fontWeight: 600,
                  color: '#111827',
                }}
              >
                Spotify (household)
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
                {spotify ? 'Linked' : 'Optional'}
              </span>
            </div>
            <p
              style={{
                fontSize: '0.8rem',
                color: '#6b7280',
                margin: 0,
              }}
            >
              One Spotify account for this home. Used for TV and speakers in shared areas
              like the living room.
            </p>

            {spotify ? (
              <p
                style={{
                  fontSize: '0.75rem',
                  color: '#4b5563',
                  marginTop: '4px',
                }}
              >
                This household already has Spotify linked. Tenants can control playback on
                devices they have access to.
              </p>
            ) : (
              <p
                style={{
                  fontSize: '0.75rem',
                  color: '#4b5563',
                  marginTop: '4px',
                }}
              >
                Link a Spotify account so this property can play music on TVs and speakers
                via Dinodia Smart Cloud.
              </p>
            )}

            {isLandlordView && (
              <div
                style={{
                  marginTop: '6px',
                  display: 'flex',
                  justifyContent: 'flex-end',
                }}
              >
                <a
                  href="/spotify/connected"
                  style={{
                    padding: '6px 10px',
                    borderRadius: '9999px',
                    border: 'none',
                    background: '#4f46e5',
                    color: '#ffffff',
                    fontSize: '0.8rem',
                    textDecoration: 'none',
                    cursor: 'pointer',
                  }}
                >
                  Manage Spotify
                </a>
              </div>
            )}
          </div>

          {/* Alexa */}
          <div
            style={{
              borderRadius: '20px',
              padding: '14px 14px 12px',
              background: '#ffffff',
              boxShadow: '0 14px 28px rgba(15,23,42,0.12)',
              display: 'flex',
              flexDirection: 'column',
              gap: '8px',
            }}
          >
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
              }}
            >
              <div
                style={{
                  fontSize: '0.95rem',
                  fontWeight: 600,
                  color: '#111827',
                }}
              >
                Alexa (coming soon)
              </div>
              <span
                style={{
                  fontSize: '0.75rem',
                  padding: '2px 8px',
                  borderRadius: '9999px',
                  background: '#f3f4f6',
                  color: '#6b7280',
                }}
              >
                Planned
              </span>
            </div>
            <p
              style={{
                fontSize: '0.8rem',
                color: '#6b7280',
                margin: 0,
              }}
            >
              One Amazon account per home. Dinodia will register this household with an
              Alexa skill so voice commands can control the same devices you see here.
            </p>
            <p
              style={{
                fontSize: '0.75rem',
                color: '#9ca3af',
                marginTop: '4px',
              }}
            >
              This is a roadmap feature. For now, you can still use Alexa directly with
              Home Assistant if you want.
            </p>
          </div>

          {/* Google Home */}
          <div
            style={{
              borderRadius: '20px',
              padding: '14px 14px 12px',
              background: '#ffffff',
              boxShadow: '0 14px 28px rgba(15,23,42,0.12)',
              display: 'flex',
              flexDirection: 'column',
              gap: '8px',
            }}
          >
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
              }}
            >
              <div
                style={{
                  fontSize: '0.95rem',
                  fontWeight: 600,
                  color: '#111827',
                }}
              >
                Google Home (coming soon)
              </div>
              <span
                style={{
                  fontSize: '0.75rem',
                  padding: '2px 8px',
                  borderRadius: '9999px',
                  background: '#f3f4f6',
                  color: '#6b7280',
                }}
              >
                Planned
              </span>
            </div>
            <p
              style={{
                fontSize: '0.8rem',
                color: '#6b7280',
                margin: 0,
              }}
            >
              One Google account per home. Dinodia will register this property as a home
              so Nest speakers and displays can control the same devices.
            </p>
            <p
              style={{
                fontSize: '0.75rem',
                color: '#9ca3af',
                marginTop: '4px',
              }}
            >
              This will be part of Dinodia Smart Cloud v2. Your current setup remains
              fully compatible with standard Google Home + Home Assistant integrations.
            </p>
          </div>
        </div>
      </div>
    </main>
  );
}
