// app/login/page.tsx
import { prisma } from '@/lib/prisma';
import Link from 'next/link';

export const dynamic = 'force-dynamic';

export default async function LoginPage() {
  const users = await prisma.user.findMany({
    orderBy: { email: 'asc' },
  });

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
      <div style={{ maxWidth: '640px', margin: '0 auto' }}>
        <h1
          style={{
            fontSize: '1.8rem',
            fontWeight: 600,
            marginBottom: '8px',
            color: '#111827',
          }}
        >
          Dinodia Smart Cloud – Login
        </h1>
        <p
          style={{
            marginBottom: '20px',
            color: '#6b7280',
            fontSize: '0.9rem',
          }}
        >
          Dev login: choose an existing user to act as. Later we can swap this
          for a proper auth provider (Supabase/Cognito/etc.).
        </p>

        {users.length === 0 ? (
          <p
            style={{
              fontSize: '0.9rem',
              color: '#b91c1c',
            }}
          >
            No users found in the database. Add at least one <code>User</code>{' '}
            via Prisma Studio or a seed script.
          </p>
        ) : (
          <div
            style={{
              borderRadius: '16px',
              background: '#ffffff',
              boxShadow: '0 16px 30px rgba(15, 23, 42, 0.08)',
              padding: '16px 18px',
            }}
          >
            <h2
              style={{
                fontSize: '1.05rem',
                fontWeight: 600,
                marginBottom: '12px',
                color: '#111827',
              }}
            >
              Choose user
            </h2>
            <ul
              style={{
                listStyle: 'none',
                padding: 0,
                margin: 0,
                display: 'flex',
                flexDirection: 'column',
                gap: '8px',
              }}
            >
              {users.map((u) => (
                <li
                  key={u.id}
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    padding: '8px 10px',
                    borderRadius: '12px',
                    border: '1px solid #e5e7eb',
                    background: '#f9fafb',
                  }}
                >
                  <div>
                    <div
                      style={{
                        fontWeight: 500,
                        color: '#111827',
                      }}
                    >
                      {u.name || '(No name)'}
                    </div>
                    <div
                      style={{
                        fontSize: '0.8rem',
                        color: '#6b7280',
                        fontFamily:
                          'ui-monospace, Menlo, Monaco, Consolas, "Liberation Mono", "Courier New", monospace',
                      }}
                    >
                      {u.email} – {u.role}
                    </div>
                  </div>
                  <Link
                    href={`/api/dev-login?userId=${u.id}`}
                    style={{
                      padding: '6px 12px',
                      borderRadius: '9999px',
                      border: 'none',
                      background: '#4f46e5',
                      color: '#ffffff',
                      fontSize: '0.8rem',
                      textDecoration: 'none',
                      boxShadow:
                        '0 10px 20px rgba(79, 70, 229, 0.25)',
                    }}
                  >
                    Login as
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        )}

        <div style={{ marginTop: '16px' }}>
          <Link
            href="/api/dev-logout"
            style={{
              border: 'none',
              background: '#f3f4f6',
              color: '#4b5563',
              borderRadius: '9999px',
              padding: '6px 12px',
              fontSize: '0.8rem',
              textDecoration: 'none',
            }}
          >
            Clear login
          </Link>
        </div>
      </div>
    </main>
  );
}
