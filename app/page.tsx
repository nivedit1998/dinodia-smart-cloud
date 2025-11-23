// app/page.tsx
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
          maxWidth: '480px',
          width: '100%',
        }}
      >
        <h1
          style={{
            fontSize: '1.9rem',
            marginBottom: '8px',
            fontWeight: 600,
            color: '#111827',
          }}
        >
          Dinodia Smart Cloud
        </h1>
        <p style={{ marginBottom: '24px', color: '#6b7280' }}>
          Cloud control for your Dinodia Smart Living homes. We&apos;ll start with
          Spotify for single-household plans, then add YouTube, voice assistants, and
          full Home Assistant hub control for each flat.
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
          <span>🎧</span>
          <span>Connect Spotify for default household</span>
        </a>

        <a
          href="/households"
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '8px',
            padding: '10px 14px',
            borderRadius: '9999px',
            border: '1px solid #e5e7eb',
            color: '#111827',
            textDecoration: 'none',
            fontSize: '0.9rem',
            width: '100%',
            marginTop: '8px',
          }}
        >
          🏠 View households
        </a>

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
            <li>Link each household to its own Home Assistant Green hub</li>
            <li>Per-tenant logins for HMOs and room-by-room dashboards</li>
            <li>Alexa / Google Home linking for each property</li>
            <li>YouTube / YouTube Music integration</li>
          </ul>
        </div>
      </div>
    </main>
  );
}
