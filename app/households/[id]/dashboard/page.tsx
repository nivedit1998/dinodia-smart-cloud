// app/households/[id]/dashboard/page.tsx
import { redirect, notFound } from 'next/navigation';
import { prisma } from '@/lib/prisma';
import { getCurrentUser } from '@/lib/auth';
import {
  getAccessibleDevicesForUser,
  type AccessibleDevicesResult,
} from '@/lib/tenants';
import { TenantRoomDashboard } from '@/app/components/TenantRoomDashboard';
import { HouseholdNavTabs } from '@/app/components/HouseholdNavTabs';
import {
  labelDisplayName,
  type LabelCategory,
} from '@/lib/labelCatalog';

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

  const household = await prisma.household.findUnique({
    where: { id: householdId },
  });
  if (!household) {
    notFound();
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
              marginBottom: '8px',
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
              marginBottom: '4px',
              color: '#111827',
            }}
          >
            Room dashboard
          </h1>

          <HouseholdNavTabs householdId={householdId} />

          <div
            style={{
              marginTop: '12px',
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

  const devices = result.devices;
  const access = result.access!;
  const areaName = access.areaFilter ?? null;

  // Collect label categories across visible devices for filter chips
  const categorySet = new Set<LabelCategory>();
  for (const device of devices) {
    if (device.labelCategory) {
      categorySet.add(device.labelCategory);
    }
  }
  const labelCategories = Array.from(categorySet).sort((a, b) =>
    labelDisplayName(a).localeCompare(labelDisplayName(b)),
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
            marginBottom: '8px',
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
          {areaName ? `Room: ${areaName}` : `Room dashboard (${household.name})`}
        </h1>
        <p
          style={{
            marginBottom: '8px',
            color: '#6b7280',
            fontSize: '0.9rem',
          }}
        >
          This view shows devices you can control in this property, based on
          your assigned room and labels.
        </p>

        {/* Per-household nav tabs */}
        <HouseholdNavTabs householdId={householdId} />

        <TenantRoomDashboard
          householdId={householdId}
          devices={devices}
          labelCategories={labelCategories}
          areaName={areaName}
        />
      </div>
    </main>
  );
}
