// app/households/page.tsx
import { prisma } from '@/lib/prisma';
import Link from 'next/link';

export const dynamic = 'force-dynamic';

export default async function HouseholdsPage() {
  const households = await prisma.household.findMany({
    include: {
      spotifyToken: true,
      homeAssistant: true,
      owner: true,
    },
  });

  return (
    <main
      style={{
        minHeight: '100vh',
        padding: '40px 24px',
        background: '#f3f4ff',
        fontFamily: 'system-ui, -apple-system, BlinkMacSystemFont, sans-serif',
      }}
    >
      <div
        style={{
          maxWidth: '960px',
          margin: '0 auto',
        }}
      >
        <h1
          style={{
            fontSize: '2rem',
            fontWeight: 600,
            marginBottom: '8px',
            color: '#111827',
          }}
        >
          Households · Dinodia Smart Cloud
        </h1>
        <p style={{ marginBottom: '24px', color: '#6b7280' }}>
          Each household represents a property or flat. In future, you&apos;ll have separate
          single-household homes and HMOs, each with their own Home Assistant hub and media
          integrations.
        </p>

        {households.length === 0 ? (
          <p style={{ color: '#6b7280' }}>
            No households yet. Connect Spotify from the home page to create your first
            household.
          </p>
        ) : (
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))',
              gap: '16px',
            }}
          >
            {households.map((h) => {
              const spotifyStatus = h.spotifyToken ? 'Connected' : 'Not connected';
              const haStatus = h.homeAssistant ? 'Configured' : 'Not configured';

              return (
                <div
                  key={h.id}
                  style={{
                    background: '#ffffff',
                    borderRadius: '20px',
                    padding: '16px 18px',
                    boxShadow: '0 16px 30px rgba(15, 23, 42, 0.08)',
                  }}
                >
                  <div
                    style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      marginBottom: '8px',
                    }}
                  >
                    <h2
                      style={{
                        fontSize: '1.1rem',
                        fontWeight: 600,
                        color: '#111827',
                      }}
                    >
                      {h.name}
                    </h2>
                    <span
                      style={{
                        fontSize: '0.75rem',
                        padding: '4px 8px',
                        borderRadius: '9999px',
                        background:
                          h.plan === 'SINGLE_HOUSEHOLD' ? '#ecfeff' : '#f5f3ff',
                        color:
                          h.plan === 'SINGLE_HOUSEHOLD' ? '#0f766e' : '#6d28d9',
                      }}
                    >
                      {h.plan === 'SINGLE_HOUSEHOLD'
                        ? 'Single-Household'
                        : 'Multi-Tenant HMO'}
                    </span>
                  </div>
                  <p
                    style={{
                      fontSize: '0.8rem',
                      color: '#6b7280',
                      marginBottom: '10px',
                    }}
                  >
                    Owner: {h.owner?.email ?? 'Unknown'}
                  </p>

                  <div
                    style={{
                      display: 'grid',
                      gridTemplateColumns: '1fr',
                      rowGap: '8px',
                      fontSize: '0.85rem',
                    }}
                  >
                    <div
                      style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                      }}
                    >
                      <span style={{ color: '#6b7280' }}>Spotify</span>
                      <span
                        style={{
                          padding: '4px 8px',
                          borderRadius: '9999px',
                          background: h.spotifyToken ? '#ecfdf5' : '#fee2e2',
                          color: h.spotifyToken ? '#15803d' : '#b91c1c',
                        }}
                      >
                        {spotifyStatus}
                      </span>
                    </div>
                    <div
                      style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                      }}
                    >
                      <span style={{ color: '#6b7280' }}>Home Assistant hub</span>
                      <span
                        style={{
                          padding: '4px 8px',
                          borderRadius: '9999px',
                          background: h.homeAssistant ? '#ecfdf5' : '#fee2e2',
                          color: h.homeAssistant ? '#15803d' : '#b91c1c',
                        }}
                      >
                        {haStatus}
                      </span>
                    </div>
                  </div>

                  {/* Future: buttons for "Configure Home Assistant", "Manage tenants", etc. */}
                </div>
              );
            })}
          </div>
        )}

        <Link
          href="/"
          style={{
            display: 'inline-flex',
            marginTop: '24px',
            padding: '10px 14px',
            borderRadius: '9999px',
            border: '1px solid #e5e7eb',
            textDecoration: 'none',
            fontSize: '0.9rem',
            color: '#111827',
          }}
        >
          ← Back to home
        </Link>
      </div>
    </main>
  );
}
