// app/households/[id]/scenes/page.tsx
import { notFound, redirect } from 'next/navigation';
import { prisma } from '@/lib/prisma';
import { getCurrentUser } from '@/lib/auth';
import { getHouseholdAccessInfo } from '@/lib/tenants';
import { HouseholdNavTabs } from '@/app/components/HouseholdNavTabs';

type PageProps = {
  params: Promise<{
    id: string;
  }>;
};

export const dynamic = 'force-dynamic';

export default async function HouseholdScenesPage({ params }: PageProps) {
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
    select: { id: true, name: true },
  });

  if (!household) {
    notFound();
  }

  const access = await getHouseholdAccessInfo(householdId, user.id);
  if (access.role !== 'OWNER') {
    notFound();
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
          Scenes · {household.name}
        </h1>
        <p
          style={{
            marginBottom: '12px',
            color: '#6b7280',
            fontSize: '0.9rem',
          }}
        >
          Scene management is coming soon. You&apos;ll be able to create preset
          lighting/comfort setups for this household and expose them to tenants
          selectively.
        </p>

        <HouseholdNavTabs householdId={householdId} role="OWNER" />

        <div
          style={{
            marginTop: '12px',
            padding: '14px 16px',
            borderRadius: '16px',
            background: '#ffffff',
            border: '1px dashed #e5e7eb',
            color: '#4b5563',
            fontSize: '0.9rem',
          }}
        >
          Placeholder: hook this up to Home Assistant scenes or blueprint-based
          automations. Tenants will only see scenes that match their area/labels.
        </div>
      </div>
    </main>
  );
}

