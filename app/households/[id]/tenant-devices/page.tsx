// app/households/[id]/tenant-devices/page.tsx
import { notFound } from 'next/navigation';
import { prisma } from '@/lib/prisma';
import { getCurrentUser } from '@/lib/auth';
import {
  getAccessibleDevicesForUser,
  HouseholdAccessRole,
} from '@/lib/tenants';
import { TenantDevicesGrid } from '@/app/components/TenantDevicesGrid';

type PageProps = {
  params: Promise<{
    id: string;
  }>;
};

export const dynamic = 'force-dynamic';

export default async function TenantDevicesPage({ params }: PageProps) {
  const { id } = await params;
  const householdId = Number(id);
  if (Number.isNaN(householdId)) {
    notFound();
  }

  const user = await getCurrentUser();

  if (!user) {
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
        <div style={{ maxWidth: '960px', margin: '0 auto' }}>
          <h1
            style={{
              fontSize: '1.6rem',
              fontWeight: 600,
              marginBottom: '8px',
              color: '#111827',
            }}
          >
            Tenant Room Dashboard
          </h1>
          <p
            style={{
              fontSize: '0.9rem',
              color: '#6b7280',
              marginBottom: '12px',
            }}
          >
            You&apos;re not logged in. Go to the login page to choose a
            user (owner or tenant).
          </p>
          <a
            href="/login"
            style={{
              display: 'inline-flex',
              padding: '8px 14px',
              borderRadius: '9999px',
              background: '#4f46e5',
              color: '#ffffff',
              fontSize: '0.85rem',
              textDecoration: 'none',
              boxShadow:
                '0 10px 20px rgba(79, 70, 229, 0.25)',
            }}
          >
            Go to login
          </a>
        </div>
      </main>
    );
  }

  const household = await prisma.household.findUnique({
    where: { id: householdId },
  });

  if (!household) {
    notFound();
  }

  const { access, devices } = await getAccessibleDevicesForUser(
    householdId,
    user.id,
  );

  const role: HouseholdAccessRole = access.role;

  // Primary area = membership areaFilter, else first device's area
  const areaName =
    access.areaFilter ??
    (devices.length > 0 ? devices[0].areaName ?? null : null);

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
      <div style={{ maxWidth: '960px', margin: '0 auto' }}>
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
            fontSize: '1.8rem',
            fontWeight: 600,
            marginBottom: '4px',
            color: '#111827',
          }}
        >
          Room Dashboard – {household.name}
        </h1>
        <p
          style={{
            marginBottom: '16px',
            color: '#6b7280',
            fontSize: '0.9rem',
          }}
        >
          This view is designed for tenants. It shows only the devices in
          their assigned <strong>Home Assistant Area</strong> and only
          devices that have <strong>labels</strong> (e.g. &quot;Main
          light&quot;, &quot;Blinds&quot;). Use labels to create neat,
          human-friendly controls.
        </p>

        {role === 'NONE' && (
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
            You don&apos;t currently have access to this household. Make
            sure there&apos;s a HouseholdMember record for this user.
          </div>
        )}

        {devices.length === 0 && role !== 'NONE' && (
          <div
            style={{
              marginBottom: '16px',
              padding: '10px 12px',
              borderRadius: '12px',
              background: '#eff6ff',
              color: '#1d4ed8',
              fontSize: '0.85rem',
            }}
          >
            No labelled devices found for your area yet. Add devices and
            labels in Home Assistant, then refresh this page.
          </div>
        )}

        {devices.length > 0 && role !== 'NONE' && (
          <TenantDevicesGrid
            householdId={householdId}
            areaName={areaName}
            role={role === 'OWNER' ? 'OWNER' : 'TENANT'}
            devices={devices}
          />
        )}
      </div>
    </main>
  );
}
