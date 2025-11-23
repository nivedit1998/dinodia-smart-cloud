// app/page.tsx
import Link from 'next/link';

type SearchParams = {
  spotify_error?: string;
};

export default function Home({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  const spotifyError = searchParams?.spotify_error;

  return (
    <main
      style={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: '#f5f3ff',
        fontFamily: 'system-ui, -apple-system, BlinkMacSystemFont, sans-serif',
      }}
    >
      <div
        style={{
          background: '#ffffff',
          padding: '32px',
          borderRadius: '24px',
          boxShadow: '0 20px 40px rgba(15, 23, 42, 0.12)',
          maxWidth: '420px',
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
          Dinodia Smart Cloud
        </h1>
        <p style={{ marginBottom: '24px', color: '#6b7280' }}>
          Connect your Spotify account so Dinodia can show what&apos;s playing in
          your smart home dashboards.
        </p>

        {spotifyError && (
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
            Spotify connection failed: {spotifyError}
          </div>
        )}

        <a
          href="/api/spotify/login"
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '8px',
            padding: '12px 16px',
            borderRadius: '9999px',
            background: '#16a34a',
            color: '#ffffff',
            textDecoration: 'none',
            fontWeight: 500,
            width: '100%',
            marginBottom: '8px',
          }}
        >
          {/* You can replace this with a Spotify logo later */}
          <span>🎧</span>
          <span>Connect Spotify</span>
        </a>

        <p style={{ fontSize: '0.8rem', color: '#9ca3af', marginTop: '8px' }}>
          We never see your Spotify password. You&apos;ll log in securely on Spotify.com,
          and you can revoke access at any time from your Spotify account settings.
        </p>

        <div
          style={{
            borderTop: '1px solid #e5e7eb',
            marginTop: '24px',
            paddingTop: '16px',
            fontSize: '0.85rem',
            color: '#6b7280',
          }}
        >
          <p style={{ marginBottom: '4px' }}>
            Coming soon to Dinodia Smart Cloud:
          </p>
          <ul style={{ paddingLeft: '20px', margin: 0 }}>
            <li>Alexa &amp; Google Home voice integrations</li>
            <li>YouTube / YouTube Music connectivity</li>
            <li>Multi-property landlord dashboards</li>
          </ul>
        </div>
      </div>
    </main>
  );
}
