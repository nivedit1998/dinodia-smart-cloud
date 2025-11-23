// app/spotify/now-playing/page.tsx
import {
  ensureDefaultHousehold,
  getNowPlayingForDefaultHousehold,
} from '@/lib/spotify';
import Link from 'next/link';

export const dynamic = 'force-dynamic';

export default async function NowPlayingPage() {
  const household = await ensureDefaultHousehold();
  const nowPlaying = await getNowPlayingForDefaultHousehold();

  const item = nowPlaying?.item ?? null;
  const isPlaying = nowPlaying?.is_playing ?? false;

  let artistNames = '';
  if (item?.artists?.length) {
    artistNames = item.artists.map((a) => a.name).join(', ');
  }

  const albumImage =
    item?.album?.images && item.album.images.length
      ? item.album.images[0].url
      : null;

  return (
    <main
      style={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: '#f0fdf4',
        fontFamily: 'system-ui, -apple-system, BlinkMacSystemFont, sans-serif',
      }}
    >
      <div
        style={{
          background: '#ffffff',
          padding: '28px 24px',
          borderRadius: '24px',
          boxShadow: '0 20px 40px rgba(15, 23, 42, 0.12)',
          maxWidth: '520px',
          width: '100%',
        }}
      >
        <Link
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
        </Link>

        <h1
          style={{
            fontSize: '1.5rem',
            fontWeight: 600,
            marginBottom: '4px',
            color: '#111827',
          }}
        >
          Spotify · Now Playing
        </h1>
        <p
          style={{
            marginBottom: '16px',
            color: '#6b7280',
            fontSize: '0.9rem',
          }}
        >
          Household: <strong>{household.name}</strong>
        </p>

        {!nowPlaying || !item ? (
          <p style={{ color: '#6b7280', fontSize: '0.95rem' }}>
            Nothing is currently playing for this Spotify account.
            <br />
            Start playing something on your Spotify device and refresh this page.
          </p>
        ) : (
          <div
            style={{
              display: 'flex',
              gap: '16px',
              alignItems: 'center',
            }}
          >
            {albumImage && (
              <div
                style={{
                  width: '96px',
                  height: '96px',
                  borderRadius: '16px',
                  overflow: 'hidden',
                  flexShrink: 0,
                  background: '#e5e7eb',
                }}
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={albumImage}
                  alt={item.name}
                  style={{
                    width: '100%',
                    height: '100%',
                    objectFit: 'cover',
                    display: 'block',
                  }}
                />
              </div>
            )}

            <div>
              <div
                style={{
                  fontSize: '0.8rem',
                  color: isPlaying ? '#16a34a' : '#6b7280',
                  marginBottom: '4px',
                }}
              >
                {isPlaying ? '▶ Now playing' : 'Paused'}
              </div>
              <div
                style={{
                  fontSize: '1.05rem',
                  fontWeight: 600,
                  color: '#111827',
                  marginBottom: '2px',
                }}
              >
                {item.name}
              </div>
              {artistNames && (
                <div
                  style={{
                    fontSize: '0.9rem',
                    color: '#6b7280',
                    marginBottom: '2px',
                  }}
                >
                  {artistNames}
                </div>
              )}
              <div
                style={{
                  fontSize: '0.8rem',
                  color: '#9ca3af',
                }}
              >
                {item.album?.name}
              </div>
            </div>
          </div>
        )}

        <p
          style={{
            marginTop: '20px',
            fontSize: '0.8rem',
            color: '#9ca3af',
          }}
        >
          In future, this data will feed directly into Dinodia room dashboards and scenes,
          so tenants in single-household plans can see what&apos;s playing and sync
          lighting, blinds and more.
        </p>
      </div>
    </main>
  );
}
