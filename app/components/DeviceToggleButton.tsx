'use client';

import { useState } from 'react';

const TOGGLE_DOMAINS = ['light', 'switch'];

type DeviceToggleButtonProps = {
  householdId: number;
  entityId: string;
  domain: string;
  initialState: string;
};

export function DeviceToggleButton({
  householdId,
  entityId,
  domain,
  initialState,
}: DeviceToggleButtonProps) {
  const [state, setState] = useState(initialState);
  const [loading, setLoading] = useState(false);

  const supported = TOGGLE_DOMAINS.includes(domain);

  if (!supported) {
    return <span style={{ color: '#9ca3af', fontSize: '0.8rem' }}>—</span>;
  }

  const label = state === 'on' ? 'Turn off' : 'Turn on';

  const handleClick = async () => {
    if (loading) return;
    setLoading(true);

    try {
      const res = await fetch('/api/toggle-device', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          householdId,
          entity_id: entityId,
          domain,
        }),
      });

      const text = await res.text();
      let data: any = null;
      try {
        data = JSON.parse(text);
      } catch {
        console.error(
          'Toggle route did not return JSON. Status:',
          res.status,
          'Body:',
          text,
        );
        alert(
          `Toggle failed (status ${res.status}). See console for raw response.`,
        );
        return;
      }

      if (data?.ok) {
        // Optimistic: flip local state
        setState((prev) => (prev === 'on' ? 'off' : 'on'));
      } else {
        console.error('Toggle failed:', data?.error, data);
        alert(
          'Failed to toggle device: ' +
            (data?.error || `HTTP ${res.status} error`),
        );
      }
    } catch (err: any) {
      console.error('Network error toggling device:', err);
      alert('Network error talking to Dinodia Cloud.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <button
      type="button"
      onClick={handleClick}
      disabled={loading}
      style={{
        fontSize: '0.8rem',
        padding: '4px 10px',
        borderRadius: '9999px',
        border: '1px solid #e5e7eb',
        background: state === 'on' ? '#dcfce7' : '#f3f4f6',
        color: '#111827',
        cursor: loading ? 'default' : 'pointer',
        whiteSpace: 'nowrap',
      }}
    >
      {loading ? 'Working…' : label}
    </button>
  );
}
