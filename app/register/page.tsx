// app/register/page.tsx
import { redirect } from 'next/navigation';
import { prisma } from '@/lib/prisma';
import { getCurrentUser } from '@/lib/auth';

type PageProps = {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
};

export const dynamic = 'force-dynamic';

// --- Server action ---

export async function registerAction(formData: FormData) {
  'use server';

  const name = String(formData.get('name') || '').trim();
  const username = String(formData.get('username') || '').trim(); // we'll store this as email for now
  const propertyRaw = String(formData.get('property') || '1').trim();
  const roleRaw = String(formData.get('role') || 'TENANT').toUpperCase();
  const room = String(formData.get('room') || '').trim();

  if (!username) {
    // Minimal validation – could be smarter later
    throw new Error('Username (email) is required');
  }

  const householdId = Number(propertyRaw || '1');
  if (Number.isNaN(householdId) || householdId <= 0) {
    throw new Error('Invalid property id');
  }

  // Make sure the property (household) exists
  const household = await prisma.household.findUnique({
    where: { id: householdId },
  });

  if (!household) {
    throw new Error(`Household/property ${householdId} does not exist`);
  }

  // Map role from form to Prisma enums
  const userRole: 'LANDLORD' | 'TENANT' =
    roleRaw === 'LANDLORD' ? 'LANDLORD' : 'TENANT';

  const householdRole: 'OWNER' | 'TENANT' =
    roleRaw === 'LANDLORD' ? 'OWNER' : 'TENANT';

  // Find or create user
  let user = await prisma.user.findUnique({
    where: { email: username },
  });

  if (!user) {
    user = await prisma.user.create({
      data: {
        email: username,
        name: name || null,
        role: userRole,
      },
    });
  } else {
    // Optionally update name/role on re-register
    user = await prisma.user.update({
      where: { id: user.id },
      data: {
        name: name || user.name,
        role: userRole,
      },
    });
  }

  // Upsert HouseholdMember: this ties user → property → access
  await prisma.householdMember.upsert({
    where: {
      userId_householdId: {
        userId: user.id,
        householdId,
      },
    },
    update: {
      role: householdRole,
      areaFilter: householdRole === 'TENANT' ? room || null : null,
      // leave labelFilterCsv null for now; can add later if you want per-tenant label restrictions
    },
    create: {
      userId: user.id,
      householdId,
      role: householdRole,
      areaFilter: householdRole === 'TENANT' ? room || null : null,
    },
  });

  // For now, after registering, send them to the login page so you can pick the user
  // (we already have /login wired to dev-login)
  redirect('/login');
}

// --- Page component ---

export default async function RegisterPage({}: PageProps) {
  const currentUser = await getCurrentUser();
  if (currentUser) {
    // If you're already logged in, just go to households
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
        background: '#eff6ff',
        fontFamily: 'system-ui, -apple-system, BlinkMacSystemFont, sans-serif',
      }}
    >
      <div
        style={{
          width: '100%',
          maxWidth: '460px',
          borderRadius: '24px',
          background: '#ffffff',
          padding: '24px 22px',
          boxShadow: '0 20px 40px rgba(15, 23, 42, 0.16)',
        }}
      >
        <h1
          style={{
            fontSize: '1.4rem',
            fontWeight: 600,
            marginBottom: '4px',
            color: '#111827',
          }}
        >
          Register for Dinodia Smart Cloud
        </h1>
        <p
          style={{
            fontSize: '0.9rem',
            color: '#6b7280',
            marginBottom: '16px',
          }}
        >
          Create a landlord or tenant account for a property. For now, you&apos;re
          testing on property <strong>1</strong>, which maps to your single Home
          Assistant hub.
        </p>

        <form action={registerAction}>
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
              Name
            </label>
            <input
              id="name"
              name="name"
              type="text"
              placeholder="e.g. Sarah Tenant"
              style={{
                width: '100%',
                fontSize: '0.9rem',
                padding: '8px 10px',
                borderRadius: '10px',
                border: '1px solid #d1d5db',
              }}
            />
          </div>

          <div style={{ marginBottom: '10px' }}>
            <label
              htmlFor="username"
              style={{
                display: 'block',
                fontSize: '0.8rem',
                color: '#374151',
                marginBottom: '2px',
              }}
            >
              Username (email)
            </label>
            <input
              id="username"
              name="username"
              type="email"
              required
              placeholder="tenant@example.com"
              style={{
                width: '100%',
                fontSize: '0.9rem',
                padding: '8px 10px',
                borderRadius: '10px',
                border: '1px solid #d1d5db',
              }}
            />
          </div>

          <div style={{ marginBottom: '10px' }}>
            <label
              htmlFor="property"
              style={{
                display: 'block',
                fontSize: '0.8rem',
                color: '#374151',
                marginBottom: '2px',
              }}
            >
              Property ID
            </label>
            <input
              id="property"
              name="property"
              type="number"
              defaultValue={1}
              min={1}
              style={{
                width: '100%',
                fontSize: '0.9rem',
                padding: '8px 10px',
                borderRadius: '10px',
                border: '1px solid #d1d5db',
              }}
            />
            <p
              style={{
                fontSize: '0.75rem',
                color: '#9ca3af',
                marginTop: '2px',
              }}
            >
              For your current setup, use <strong>1</strong>.
            </p>
          </div>

          <div style={{ marginBottom: '10px' }}>
            <label
              htmlFor="role"
              style={{
                display: 'block',
                fontSize: '0.8rem',
                color: '#374151',
                marginBottom: '2px',
              }}
            >
              Role
            </label>
            <select
              id="role"
              name="role"
              defaultValue="TENANT"
              style={{
                width: '100%',
                fontSize: '0.9rem',
                padding: '8px 10px',
                borderRadius: '10px',
                border: '1px solid #d1d5db',
                background: '#f9fafb',
              }}
            >
              <option value="TENANT">Tenant (room-level access)</option>
              <option value="LANDLORD">Landlord (full property access)</option>
            </select>
          </div>

          <div style={{ marginBottom: '16px' }}>
            <label
              htmlFor="room"
              style={{
                display: 'block',
                fontSize: '0.8rem',
                color: '#374151',
                marginBottom: '2px',
              }}
            >
              Room / Area name (Home Assistant)
            </label>
            <input
              id="room"
              name="room"
              type="text"
              placeholder='e.g. "Living Room" or "Room 1"'
              style={{
                width: '100%',
                fontSize: '0.9rem',
                padding: '8px 10px',
                borderRadius: '10px',
                border: '1px solid #d1d5db',
              }}
            />
            <p
              style={{
                fontSize: '0.75rem',
                color: '#9ca3af',
                marginTop: '2px',
              }}
            >
              For tenants, this should exactly match the <strong>Area</strong> name
              in Home Assistant. Landlords can leave this blank.
            </p>
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
              background: '#4f46e5',
              color: '#ffffff',
              cursor: 'pointer',
              boxShadow: '0 14px 28px rgba(79, 70, 229, 0.35)',
            }}
          >
            Register
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
          Already registered?{' '}
          <a
            href="/login"
            style={{ color: '#4f46e5', textDecoration: 'none' }}
          >
            Go to login
          </a>
        </p>
      </div>
    </main>
  );
}
