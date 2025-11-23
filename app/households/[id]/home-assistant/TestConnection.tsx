// app/households/[id]/home-assistant/TestConnection.tsx
'use client';

import { useState } from 'react';

type Props = {
  householdId: number;
};

export default function TestConnection({ householdId }: Props) {
  const [status, setStatus] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleTest() {
    setLoading(true);
    setStatus(null);

    try {
      const res = await fetch(
        `/households/${householdId}/home-assistant/ping`,
      );

      const data = await res.json();

      if (res.ok && data.ok) {
        setStatus(
          `✅ Connected to Home Assistant. Status: ${data.status} - ${data.message ?? ''}`,
        );
      } else {
        setStatus(
          `❌ Failed to connect: ${data.error ?? 'Unknown error'} (HTTP ${res.status})`,
        );
      }
    } catch (e) {
      console.error(e);
      setStatus('❌ Error calling ping endpoint.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div>
      <button
        type="button"
        onClick={handleTest}
        disabled={loading}
        style={{
          display: 'inline-flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '8px 14px',
          borderRadius: '9999px',
          background: loading ? '#9ca3af' : '#22c55e',
          color: '#ffffff',
          fontSize: '0.85rem',
          fontWeight: 500,
          border: 'none',
          cursor: loading ? 'default' : 'pointer',
        }}
      >
        {loading ? 'Testing…' : '🔌 Test Home Assistant connection'}
      </button>

      {status && (
        <p
          style={{
            marginTop: '8px',
            fontSize: '0.85rem',
            color: status.startsWith('✅') ? '#15803d' : '#b91c1c',
          }}
        >
          {status}
        </p>
      )}
    </div>
  );
}
