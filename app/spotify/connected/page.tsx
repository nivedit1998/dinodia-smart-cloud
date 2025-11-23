// app/spotify/connected/page.tsx
import { getSpotifyProfileForLandlord } from '@/lib/spotify';

export const dynamic = 'force-dynamic';

export default async function SpotifyConnectedPage() {
  const profile = await getSpotifyProfileForLandlord();

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
          maxWidth: '440px',
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

        {profile ? (
          <>
            <p style={{ marginBottom: '16px', color: '#6b7280' }}>
              Dinodia Smart Cloud is now linked to your Spotify account.
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
              Soon, Dinodia dashboards in your rentals will be able to show
              what&apos;s playing, let you pause/resume, and sync scenes with your
              music.
            </p>
          </>
        ) : (
          <>
            <p style={{ marginBottom: '8px', color: '#b91c1c' }}>
              We couldn&apos;t fetch your Spotify profile just now.
            </p>
            <p style={{ fontSize: '0.85rem', color: '#6b7280' }}>
              The connection might have expired or failed. Try going back and
              reconnecting your Spotify account.
            </p>
          </>
        )}
      </div>
    </main>
  );
}
