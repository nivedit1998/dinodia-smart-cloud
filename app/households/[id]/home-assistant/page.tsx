// app/households/[id]/home-assistant/page.tsx
import { prisma } from '@/lib/prisma';
import { notFound, redirect } from 'next/navigation';
import { revalidatePath } from 'next/cache';
import TestConnection from './TestConnection';
import { getCurrentUser } from '@/lib/auth';
import { getHouseholdAccessInfo } from '@/lib/tenants';

type PageProps = {
  params: Promise<{
    id: string;
  }>;
};

export const dynamic = 'force-dynamic';

export default async function HomeAssistantConfigPage({ params }: PageProps) {
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
    include: {
      homeAssistant: true,
      owner: true,
    },
  });

  if (!household) {
    notFound();
  }

  const access = await getHouseholdAccessInfo(householdId, user.id);
  if (access.role !== 'OWNER') {
    notFound();
  }

  async function saveHomeAssistant(formData: FormData) {
    'use server';

    const currentUser = await getCurrentUser();
    if (!currentUser) {
      throw new Error('Not authenticated');
    }

    const saveAccess = await getHouseholdAccessInfo(householdId, currentUser.id);
    if (saveAccess.role !== 'OWNER') {
      throw new Error('Forbidden');
    }

    const rawBaseUrl = (formData.get('baseUrl') as string) ?? '';
    const rawAccessToken = (formData.get('accessToken') as string) ?? '';

    const baseUrl = rawBaseUrl.trim();
    let accessToken = rawAccessToken.trim();

    if (!baseUrl || !accessToken) {
      // In a real app, you'd handle validation messages with cookies or redirects.
      return;
    }

    // If user pasted "Bearer eyJhbGciOi..." strip the "Bearer " part.
    if (accessToken.toLowerCase().startsWith('bearer ')) {
      accessToken = accessToken.slice(7).trim();
    }

    await prisma.homeAssistantInstance.upsert({
      where: { householdId },
      update: {
        baseUrl,
        accessToken,
      },
      create: {
        householdId,
        baseUrl,
        accessToken,
      },
    });

    // Refresh this page + the households overview
    revalidatePath(`/households/${householdId}/home-assistant`);
    revalidatePath('/households');
  }


  const ha = household.homeAssistant;

  return (
    <main
      style={{
        minHeight: '100vh',
        padding: '40px 24px',
        background: '#eef2ff',
        fontFamily: 'system-ui, -apple-system, BlinkMacSystemFont, sans-serif',
      }}
    >
      <div
        style={{
          maxWidth: '720px',
          margin: '0 auto',
          background: '#ffffff',
          padding: '28px 24px',
          borderRadius: '24px',
          boxShadow: '0 20px 40px rgba(15, 23, 42, 0.12)',
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
          Configure Home Assistant hub
        </h1>
        <p style={{ marginBottom: '18px', color: '#6b7280', fontSize: '0.95rem' }}>
          Household: <strong>{household.name}</strong> ({household.plan})
          <br />
          Owner: {household.owner?.email ?? 'Unknown'}
        </p>

        <form action={saveHomeAssistant}>
          <div style={{ marginBottom: '16px' }}>
            <label
              htmlFor="baseUrl"
              style={{
                display: 'block',
                fontSize: '0.9rem',
                fontWeight: 500,
                color: '#111827',
                marginBottom: '4px',
              }}
            >
              Home Assistant Base URL
            </label>
            <input
              id="baseUrl"
              name="baseUrl"
              type="text"
              defaultValue={ha?.baseUrl ?? 'http://homeassistant.local:8123'}
              placeholder="http://homeassistant.local:8123"
              style={{
                width: '100%',
                padding: '10px 12px',
                borderRadius: '12px',
                border: '1px solid #e5e7eb',
                fontSize: '0.9rem',
              }}
            />
            <p
              style={{
                fontSize: '0.8rem',
                color: '#9ca3af',
                marginTop: '4px',
              }}
            >
              This should be how the Dinodia Smart Hub can reach the Home Assistant Green
              in this flat. It can be an IP or local hostname.
            </p>
          </div>

          <div style={{ marginBottom: '16px' }}>
            <label
              htmlFor="accessToken"
              style={{
                display: 'block',
                fontSize: '0.9rem',
                fontWeight: 500,
                color: '#111827',
                marginBottom: '4px',
              }}
            >
              Long-lived access token
            </label>
            <input
              id="accessToken"
              name="accessToken"
              type="password"
              defaultValue={ha?.accessToken ?? ''}
              placeholder="Paste Home Assistant long-lived token"
              style={{
                width: '100%',
                padding: '10px 12px',
                borderRadius: '12px',
                border: '1px solid #e5e7eb',
                fontSize: '0.9rem',
              }}
            />
            <p
              style={{
                fontSize: '0.8rem',
                color: '#9ca3af',
                marginTop: '4px',
              }}
            >
              Generate this in Home Assistant under your profile &gt; Long-lived access tokens.
              Later, we can switch to a dedicated Dinodia service user.
            </p>
          </div>

          <button
            type="submit"
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              padding: '10px 16px',
              borderRadius: '9999px',
              background: '#4f46e5',
              color: '#ffffff',
              fontSize: '0.9rem',
              fontWeight: 500,
              border: 'none',
              cursor: 'pointer',
            }}
          >
            💾 Save Home Assistant config
          </button>
        </form>

        {ha && (
          <div
            style={{
              marginTop: '24px',
              paddingTop: '16px',
              borderTop: '1px solid #e5e7eb',
            }}
          >
            <h2
              style={{
                fontSize: '1rem',
                fontWeight: 600,
                marginBottom: '8px',
                color: '#111827',
              }}
            >
              Test connection
            </h2>
            <p
              style={{
                fontSize: '0.85rem',
                color: '#6b7280',
                marginBottom: '8px',
              }}
            >
              Check that Dinodia Smart Cloud can reach this Home Assistant hub using the
              URL and token above.
            </p>
            <TestConnection householdId={householdId} />
          </div>
        )}
      </div>
    </main>
  );
}
