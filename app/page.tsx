import { getCurrentUser } from '@/lib/auth';
import { redirect } from 'next/navigation';

export default async function HomePage() {
  const user = await getCurrentUser();

  if (user) {
    redirect('/households');
  }

  return (
    <main
      style={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: '#eef2ff',
        fontFamily: 'system-ui, -apple-system, BlinkMacSystemFont, sans-serif',
        padding: '24px',
      }}
    >
      <div
        style={{
          maxWidth: '480px',
          width: '100%',
          background: '#ffffff',
          padding: '32px',
          borderRadius: '24px',
          boxShadow: '0 25px 45px rgba(15, 23, 42, 0.12)',
          textAlign: 'center',
        }}
      >
        <h1
          style={{
            fontSize: '2rem',
            marginBottom: '12px',
            fontWeight: 600,
            color: '#111827',
          }}
        >
          Welcome to Dinodia Smart Cloud
        </h1>
        <p style={{ marginBottom: '24px', color: '#6b7280', fontSize: '1rem' }}>
          Landlord and tenant dashboards for connecting Home Assistant hubs,
          media integrations, and smart home automations across your Dinodia
          properties.
        </p>
        <a
          href="/login"
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '12px 20px',
            borderRadius: '9999px',
            background: '#2563eb',
            color: '#ffffff',
            textDecoration: 'none',
            fontWeight: 500,
          }}
        >
          Login to continue
        </a>
      </div>
    </main>
  );
}
