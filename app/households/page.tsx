// app/households/page.tsx
import { prisma } from '@/lib/prisma';
import Link from 'next/link';
import type { CSSProperties } from 'react';

export const dynamic = 'force-dynamic';

export default async function HouseholdsDashboard() {
  const households = await prisma.household.findMany({
    include: {
      homeAssistant: true,
      spotifyToken: true,
    },
  });

  return (
    <main
      style={{
        minHeight: '100vh',
        padding: '48px 24px 64px',
        background: '#eef2ff',
        fontFamily: 'system-ui, -apple-system, BlinkMacSystemFont, sans-serif',
      }}
    >
      <div style={{ maxWidth: '1100px', margin: '0 auto' }}>
        <header style={{ marginBottom: '32px' }}>
          <h1
            style={{
              fontSize: '2rem',
              fontWeight: 600,
              color: '#111827',
              marginBottom: '8px',
            }}
          >
            Your Households
          </h1>
          <p style={{ color: '#6b7280', maxWidth: '640px' }}>
            Manage each property&apos;s smart-home integrations, tenant access, and
            Home Assistant hubs. Use the quick actions below to jump into device
            lists, tenant views, or member settings.
          </p>
        </header>

        {households.length === 0 ? (
          <section
            style={{
              background: '#ffffff',
              borderRadius: '24px',
              padding: '32px',
              textAlign: 'center',
              boxShadow: '0 25px 45px rgba(15, 23, 42, 0.1)',
            }}
          >
            <p style={{ fontSize: '1rem', color: '#6b7280', marginBottom: '16px' }}>
              You haven&apos;t added any households yet.
            </p>
            <Link
              href="/households/new"
              style={{
                display: 'inline-flex',
                padding: '12px 20px',
                borderRadius: '9999px',
                border: 'none',
                background: '#2563eb',
                color: '#ffffff',
                fontWeight: 500,
                cursor: 'pointer',
                textDecoration: 'none',
              }}
            >
              + Create household
            </Link>
          </section>
        ) : (
          <section
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
              gap: '18px',
            }}
          >
            {households.map((household) => {
              const haConfigured = Boolean(household.homeAssistant);
              const planLabel =
                household.plan === 'SINGLE_HOUSEHOLD'
                  ? 'Single-Household'
                  : 'Multi-Tenant HMO';

              return (
                <article
                  key={household.id}
                  style={{
                    background: '#ffffff',
                    borderRadius: '24px',
                    padding: '20px',
                    boxShadow: '0 20px 40px rgba(15, 23, 42, 0.08)',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '14px',
                  }}
                >
                  <div
                    style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'flex-start',
                      gap: '12px',
                    }}
                  >
                    <div>
                      <h2
                        style={{
                          fontSize: '1.15rem',
                          fontWeight: 600,
                          margin: 0,
                          color: '#111827',
                        }}
                      >
                        {household.name}
                      </h2>
                      <p
                        style={{
                          margin: '4px 0 0',
                          fontSize: '0.85rem',
                          color: '#6b7280',
                        }}
                      >
                        Plan: {planLabel}
                      </p>
                    </div>
                    <span
                      style={{
                        padding: '4px 10px',
                        borderRadius: '9999px',
                        fontSize: '0.75rem',
                        background: haConfigured ? '#ecfdf5' : '#fee2e2',
                        color: haConfigured ? '#15803d' : '#b91c1c',
                        fontWeight: 500,
                        whiteSpace: 'nowrap',
                      }}
                    >
                      Home Assistant: {haConfigured ? 'Yes' : 'No'}
                    </span>
                  </div>

                  <div
                    style={{
                      display: 'flex',
                      flexWrap: 'wrap',
                      gap: '8px',
                    }}
                  >
                    <Link
                      href={`/households/${household.id}/devices`}
                      style={actionButtonStyle}
                    >
                      💡 Devices
                    </Link>
                    <Link
                      href={`/households/${household.id}/tenant-devices`}
                      style={actionButtonStyle}
                    >
                      👥 Tenant view
                    </Link>
                    <Link
                      href={`/households/${household.id}/members`}
                      style={actionButtonStyle}
                    >
                      🔐 Members & access
                    </Link>
                  </div>
                </article>
              );
            })}
          </section>
        )}
      </div>
    </main>
  );
}

const actionButtonStyle: CSSProperties = {
  display: 'inline-flex',
  justifyContent: 'center',
  alignItems: 'center',
  padding: '8px 12px',
  borderRadius: '9999px',
  border: '1px solid #e5e7eb',
  background: '#f9fafb',
  color: '#111827',
  fontSize: '0.85rem',
  textDecoration: 'none',
};
