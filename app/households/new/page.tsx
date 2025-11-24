// app/households/new/page.tsx
import { redirect } from 'next/navigation';
import { prisma } from '@/lib/prisma';
import { getCurrentUser } from '@/lib/auth';

export const dynamic = 'force-dynamic';

// Server action to create a new household
export async function createHouseholdAction(formData: FormData) {
  'use server';

  const user = await getCurrentUser();
  if (!user) {
    redirect('/login');
  }

  if (user.role !== 'LANDLORD') {
    redirect('/households');
  }

  const name = String(formData.get('name') || '').trim();
  const planRaw = String(formData.get('plan') || 'SINGLE_HOUSEHOLD').trim();

  if (!name) {
    throw new Error('Household name is required');
  }

  const plan =
    planRaw === 'MULTI_TENANT' ? 'MULTI_TENANT' : 'SINGLE_HOUSEHOLD';

  const household = await prisma.household.create({
    data: {
      name,
      plan,
      ownerId: user.id,
    },
  });

  // After creating the household, go to its overview page.
  // From there you can register landlord/tenant users against this property id.
  redirect(`/households/${household.id}/overview`);
}

export default async function NewHouseholdPage() {
  const user = await getCurrentUser();
  if (!user) {
    redirect('/login');
  }

  if (user.role !== 'LANDLORD') {
    redirect('/households');
  }

  return (
    <main
      style={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '24px',
        background: '#eef2ff',
        fontFamily:
          'system-ui, -apple-system, BlinkMacSystemFont, sans-serif',
      }}
    >
      <div
        style={{
          width: '100%',
          maxWidth: '520px',
          borderRadius: '24px',
          background: '#ffffff',
          padding: '24px 22px',
          boxShadow: '0 20px 40px rgba(15, 23, 42, 0.16)',
        }}
      >
        <h1
          style={{
            fontSize: '1.5rem',
            fontWeight: 600,
            marginBottom: '6px',
            color: '#111827',
          }}
        >
          Register a new household
        </h1>
        <p
          style={{
            fontSize: '0.9rem',
            color: '#6b7280',
            marginBottom: '16px',
          }}
        >
          Create a property in Dinodia Smart Cloud. You&apos;ll be set as the
          landlord for this household. After it&apos;s created, you can add
          tenants or additional landlords via the <strong>Register</strong>{' '}
          page by using this household&apos;s id.
        </p>

        <form action={createHouseholdAction}>
          <div style={{ marginBottom: '10px' }}>
            <label
              htmlFor="name"
              style={{
                display: 'block',
                fontSize: '0.8rem',
                color: '#374151',
                marginBottom: '2px',
              }}
            >
              Household name
            </label>
            <input
              id="name"
              name="name"
              type="text"
              required
              placeholder='e.g. "Demo Flat 1" or "12 High Street – Flat 3"'
              style={{
                width: '100%',
                fontSize: '0.9rem',
                padding: '8px 10px',
                borderRadius: '10px',
                border: '1px solid #d1d5db',
              }}
            />
          </div>

          <div style={{ marginBottom: '16px' }}>
            <label
              htmlFor="plan"
              style={{
                display: 'block',
                fontSize: '0.8rem',
                color: '#374151',
                marginBottom: '2px',
              }}
            >
              Plan type
            </label>
            <select
              id="plan"
              name="plan"
              defaultValue="SINGLE_HOUSEHOLD"
              style={{
                width: '100%',
                fontSize: '0.9rem',
                padding: '8px 10px',
                borderRadius: '10px',
                border: '1px solid #d1d5db',
                background: '#f9fafb',
              }}
            >
              <option value="SINGLE_HOUSEHOLD">
                Single household (one family / occupant)
              </option>
              <option value="MULTI_TENANT">
                Multi-tenant (HMO / multiple rooms)
              </option>
            </select>
          </div>

          <button
            type="submit"
            style={{
              width: '100%',
              marginTop: '4px',
              border: 'none',
              borderRadius: '9999px',
              padding: '10px 14px',
              fontSize: '0.95rem',
              fontWeight: 500,
              background: '#2563eb',
              color: '#ffffff',
              cursor: 'pointer',
              boxShadow: '0 14px 28px rgba(37, 99, 235, 0.35)',
            }}
          >
            Create household
          </button>
        </form>

        <p
          style={{
            marginTop: '12px',
            fontSize: '0.8rem',
            color: '#6b7280',
            textAlign: 'center',
          }}
        >
          Already have households set up?{' '}
          <a
            href="/households"
            style={{ color: '#2563eb', textDecoration: 'none' }}
          >
            Go back to households
          </a>
        </p>
      </div>
    </main>
  );
}

