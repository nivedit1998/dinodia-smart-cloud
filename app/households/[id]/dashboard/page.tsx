// app/households/[id]/dashboard/page.tsx
import { redirect, notFound } from 'next/navigation';
import { getCurrentUser } from '@/lib/auth';
import {
  getAccessibleDevicesForUser,
  type AccessibleDevicesResult,
} from '@/lib/tenants';
import { TenantRoomDashboard } from '@/app/components/TenantRoomDashboard';

type PageProps = {
  params: Promise<{
    id: string;
  }>;
};

export const dynamic = 'force-dynamic';

export default async function HouseholdDashboardPage({ params }: PageProps) {
  const { id } = await params;
  const householdId = Number(id);

  if (Number.isNaN(householdId)) {
    notFound();
  }

  const user = await getCurrentUser();
  if (!user) {
    redirect('/login');
  }

  const result: AccessibleDevicesResult = await getAccessibleDevicesForUser(
    householdId,
    user.id,
  );

  if (!result.ok) {
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
              fontSize: '1.5rem',
              fontWeight: 600,
              marginBottom: '8px',
              color: '#111827',
            }}
          >
            Room dashboard
          </h1>
          <div
            style={{
              padding: '10px 12px',
              borderRadius: '12px',
              background: '#fef2f2',
              color: '#b91c1c',
              fontSize: '0.9rem',
            }}
          >
            {result.error || 'Could not load devices for this household.'}
          </div>
        </div>
      </main>
    );
  }

  const { access, devices } = result;
  const areaName = access.areaFilter ?? null;

  const labelSet = new Set<string>();
  for (const device of devices) {
    if (device.labels) {
      for (const label of device.labels) {
        labelSet.add(label);
      }
    }
  }
  const allLabels = Array.from(labelSet).sort((a, b) =>
    a.localeCompare(b),
  );

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
            fontSize: '1.6rem',
            fontWeight: 600,
            marginBottom: '4px',
            color: '#111827',
          }}
        >
          {areaName ? `Room: ${areaName}` : 'Room dashboard'}
        </h1>
        <p
          style={{
            marginBottom: '16px',
            color: '#6b7280',
            fontSize: '0.9rem',
          }}
        >
          This view shows devices you can control in this property, based on
          your assigned room and labels.
        </p>

        <TenantRoomDashboard
          householdId={householdId}
          devices={devices}
          labels={allLabels}
          areaName={areaName}
        />
      </div>
    </main>
  );
}
