// app/households/[id]/tenant-devices/page.tsx
import { prisma } from '@/lib/prisma';
import { notFound } from 'next/navigation';
import { getAccessibleDevicesForUser } from '@/lib/tenants';
import { DevicesTableWithFilters } from '@/app/components/DevicesTableWithFilters';

type PageProps = {
  params: Promise<{
    id: string;
  }>;
};

export const dynamic = 'force-dynamic';

// 🔐 Replace this with your real auth logic
async function getCurrentUserId(): Promise<number | null> {
  // TODO: integrate with your auth (Supabase, NextAuth, etc.)
  // For now, this just grabs the first user in the DB to make the page work.
  const user = await prisma.user.findFirst();
  return user?.id ?? null;
}

export default async function TenantDevicesPage({ params }: PageProps) {
  const { id } = await params;
  const householdId = Number(id);
  if (Number.isNaN(householdId)) {
    notFound();
  }

  const userId = await getCurrentUserId();
  if (!userId) {
    // You might want to redirect to /login instead
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
        <div
          style={{
            maxWidth: '960px',
            margin: '0 auto',
          }}
        >
          <h1
            style={{
              fontSize: '1.4rem',
              fontWeight: 600,
              marginBottom: '8px',
              color: '#111827',
            }}
          >
            Tenant devices
          </h1>
          <p
            style={{
              color: '#b91c1c',
              fontSize: '0.9rem',
            }}
          >
            No user session found. Plug in your auth (Supabase/NextAuth/etc.) in
            <code style={{ marginLeft: 4 }}>getCurrentUserId()</code>.
          </p>
        </div>
      </main>
    );
  }

  // Check household exists
  const household = await prisma.household.findUnique({
    where: { id: householdId },
  });

  if (!household) {
    notFound();
  }

  const { access, devices } = await getAccessibleDevicesForUser(
    householdId,
    userId,
  );

  if (access.role === 'NONE') {
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
        <div
          style={{
            maxWidth: '960px',
            margin: '0 auto',
          }}
        >
          <h1
            style={{
              fontSize: '1.4rem',
              fontWeight: 600,
              marginBottom: '8px',
              color: '#111827',
            }}
          >
            Tenant devices
          </h1>
          <p
            style={{
              color: '#b91c1c',
              fontSize: '0.9rem',
            }}
          >
            You don&apos;t have access to this household. Ask your landlord to
            add you as a tenant in Dinodia Cloud and assign you a Home
            Assistant <strong>Area</strong> (for example, &quot;Room 1&quot;).
          </p>
        </div>
      </main>
    );
  }

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
      <div
        style={{
          maxWidth: '960px',
          margin: '0 auto',
        }}
      >
        <a
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
        </a>

        <h1
          style={{
            fontSize: '1.6rem',
            fontWeight: 600,
            marginBottom: '4px',
            color: '#111827',
          }}
        >
          Your devices in {household.name}
        </h1>

        <p
          style={{
            marginBottom: '16px',
            color: '#6b7280',
            fontSize: '0.9rem',
          }}
        >
          You&apos;re logged in as a{' '}
          <strong>{access.role === 'OWNER' ? 'Owner' : 'Tenant'}</strong>.{' '}
          {access.role === 'TENANT' && access.areaFilter && (
            <>
              You can only see devices that are in the Home Assistant{' '}
              <strong>Area</strong>:{' '}
              <code>{access.areaFilter}</code>.
            </>
          )}
          {access.role === 'TENANT' && !access.areaFilter && (
            <>
              Your account has tenant access but no Area has been assigned yet.
              Ask your landlord to set an <code>areaFilter</code> for your
              membership in Dinodia Cloud.
            </>
          )}
        </p>

        {devices.length > 0 ? (
          <DevicesTableWithFilters
            householdId={householdId}
            devices={devices as any}
          />
        ) : (
          <p
            style={{
              marginTop: '12px',
              fontSize: '0.9rem',
              color: '#6b7280',
            }}
          >
            No devices are visible for your account yet. Your landlord may need
            to ensure entities are assigned to the correct Home Assistant
            <strong> Area</strong> (for example, &quot;Room 1&quot;) that
            matches your tenant configuration.
          </p>
        )}
      </div>
    </main>
  );
}
