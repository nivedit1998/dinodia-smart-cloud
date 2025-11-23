// app/households/[id]/devices/page.tsx
import { prisma } from '@/lib/prisma';
import { notFound } from 'next/navigation';
import { DinodiaDevice, getDevicesWithMetadata } from '@/lib/homeAssistant';
import { DevicesTableWithFilters } from '@/app/components/DevicesTableWithFilters';

type PageProps = {
  params: Promise<{
    id: string;
  }>;
};

export const dynamic = 'force-dynamic';

export default async function HouseholdDevicesPage({ params }: PageProps) {
  const { id } = await params;
  const householdId = Number(id);
  if (Number.isNaN(householdId)) {
    notFound();
  }

  const household = await prisma.household.findUnique({
    where: { id: householdId },
    include: {
      homeAssistant: true,
      owner: true,
    },
  });

  if (!household) {
    notFound();
  }

  let devices: DinodiaDevice[] | null = null;
  let error: string | null = null;

  if (!household.homeAssistant) {
    error = 'Home Assistant hub is not configured for this household yet.';
  } else {
    const result = await getDevicesWithMetadata(householdId);
    if (!result.ok) {
      error = result.error ?? 'Failed to load devices from Home Assistant';
      devices = result.devices ?? [];
    } else {
      devices = result.devices ?? [];
    }
  }

  return (
    <main
      style={{
        minHeight: '100vh',
        padding: '40px 24px',
        background: '#eff6ff',
        fontFamily: 'system-ui, -apple-system, BlinkMacSystemFont, sans-serif',
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
          Devices in {household.name}
        </h1>
        <p
          style={{
            marginBottom: '16px',
            color: '#6b7280',
            fontSize: '0.9rem',
          }}
        >
          These entities are coming directly from the Home Assistant hub configured for
          this household, grouped using your <strong>Areas</strong> and{' '}
          <strong>Labels</strong> from Home Assistant. Lights and switches can be toggled
          from here.
        </p>

        {!household.homeAssistant && (
          <p
            style={{
              fontSize: '0.9rem',
              color: '#b91c1c',
              marginBottom: '12px',
            }}
          >
            Home Assistant is not configured yet. Configure it first, then come back:
          </p>
        )}

        {error && (
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
            {error}
          </div>
        )}

        {devices && devices.length > 0 && (
          <DevicesTableWithFilters
            householdId={householdId}
            devices={devices as any}
          />
        )}

        {devices && devices.length === 0 && !error && (
          <p
            style={{
              marginTop: '12px',
              fontSize: '0.9rem',
              color: '#6b7280',
            }}
          >
            No entities found from Home Assistant. Add some devices first.
          </p>
        )}
      </div>
    </main>
  );
}
