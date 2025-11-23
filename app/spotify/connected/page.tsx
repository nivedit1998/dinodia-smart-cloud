// app/spotify/connected/page.tsx
import { getSpotifyProfileForDefaultHousehold, ensureDefaultHousehold } from '@/lib/spotify';
import Link from 'next/link';

export const dynamic = 'force-dynamic';

export default async function SpotifyConnectedPage() {
  const profile = await getSpotifyProfileForDefaultHousehold();
  const household = await ensureDefaultHousehold();

  return (
    <main
      style={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: '#ecfeff',
        fontFamily: 'system-ui, -apple-system, BlinkMacSystemFont, sans-serif',
      }}
    >
      <div
        style={{
          background: '#ffffff',
          padding: '32px',
          borderRadius: '24px',
          boxShadow: '0 20px 40px rgba(15, 23, 42, 0.12)',
          maxWidth: '480px',
          width: '100%',
        }}
      >
        <h1
          style={{
            fontSize: '1.8rem',
            marginBottom: '8px',
            fontWeight: 600,
            color: '#111827',
          }}
        >
          Spotify connected ✅
        </h1>

        <p style={{ marginBottom: '8px', color: '#6b7280' }}>
          Household: <strong>{household.name}</strong> ({household.plan})
        </p>

        {profile ? (
          <>
            <p style={{ marginBottom: '16px', color: '#6b7280' }}>
              Dinodia Smart Cloud is now linked to this household&apos;s Spotify account.
            </p>
            <div
              style={{
                padding: '12px 14px',
                borderRadius: '16px',
                background: '#f9fafb',
                marginBottom: '16px',
              }}
            >
              <div
                style={{
                  fontWeight: 500,
                  color: '#111827',
                  marginBottom: '4px',
                }}
              >
                {profile.display_name || profile.id}
              </div>
              {profile.email && (
                <div style={{ fontSize: '0.85rem', color: '#6b7280' }}>
                  {profile.email}
                </div>
              )}
            </div>
            <p style={{ fontSize: '0.85rem', color: '#6b7280' }}>
              For single-household plans, this will usually be the main tenant&apos;s Spotify
              account, so your Dinodia tablets and dashboards can show what&apos;s playing and
              sync scenes with music.
            </p>
          </>
        ) : (
          <>
            <p style={{ marginBottom: '8px', color: '#b91c1c' }}>
              We couldn&apos;t fetch your Spotify profile just now.
            </p>
            <p style={{ fontSize: '0.85rem', color: '#6b7280' }}>
              The connection might have expired or failed. Try going back to the home page
              and reconnecting your Spotify account.
            </p>
          </>
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
          ← Back to Dinodia Smart Cloud
        </Link>
      </div>
    </main>
  );
}
