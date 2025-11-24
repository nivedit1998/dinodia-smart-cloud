// app/components/DeviceActionControls.tsx
'use client';

import { useState } from 'react';
import { DeviceToggleButton } from '@/app/components/DeviceToggleButton';

type Props = {
  householdId: number;
  entityId: string;
  domain: string;
  initialState: string;
};

async function callHaService(args: {
  householdId: number;
  domain: string;
  service: string;
  entityId: string;
  data?: Record<string, any>;
}) {
  const res = await fetch('/api/home-assistant/service', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      householdId: args.householdId,
      domain: args.domain,
      service: args.service,
      entity_id: args.entityId,
      data: args.data ?? {},
    }),
  });

  if (!res.ok) {
    const text = await res.text();
    console.error('HA service error:', res.status, text);
    throw new Error(`HA service error: ${res.status}`);
  }

  const json = await res.json();
  if (!json.ok) {
    console.error('HA service reported failure:', json.error);
    throw new Error(json.error || 'Unknown HA service error');
  }
}

export function DeviceActionControls({
  householdId,
  entityId,
  domain,
  initialState,
}: Props) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [brightness, setBrightness] = useState(100); // 0–100%
  const [volume, setVolume] = useState(30); // 0–100%
  const [fanSpeed, setFanSpeed] = useState<'off' | 'low' | 'medium' | 'high'>(
    'off',
  );

  const disabled = busy;

  async function handleLightBrightnessChange(
    e: React.ChangeEvent<HTMLInputElement>,
  ) {
    const value = Number(e.target.value);
    setBrightness(value);
    setError(null);

    try {
      setBusy(true);
      await callHaService({
        householdId,
        domain: 'light',
        service: 'turn_on',
        entityId,
        data: { brightness_pct: value },
      });
    } catch (err: any) {
      setError(err.message || 'Failed to set brightness');
    } finally {
      setBusy(false);
    }
  }

  async function handleCover(action: 'open' | 'close' | 'stop') {
    setError(null);
    try {
      setBusy(true);
      const service =
        action === 'open'
          ? 'open_cover'
          : action === 'close'
          ? 'close_cover'
          : 'stop_cover';
      await callHaService({
        householdId,
        domain: 'cover',
        service,
        entityId,
      });
    } catch (err: any) {
      setError(err.message || 'Failed to control cover');
    } finally {
      setBusy(false);
    }
  }

  async function handleVolumeChange(
    e: React.ChangeEvent<HTMLInputElement>,
  ) {
    const value = Number(e.target.value);
    setVolume(value);
    setError(null);

    try {
      setBusy(true);
      await callHaService({
        householdId,
        domain: 'media_player',
        service: 'volume_set',
        entityId,
        data: {
          volume_level: value / 100, // HA expects 0.0–1.0
        },
      });
    } catch (err: any) {
      setError(err.message || 'Failed to set volume');
    } finally {
      setBusy(false);
    }
  }

  async function handleMediaAction(action: 'prev' | 'next') {
    setError(null);
    try {
      setBusy(true);
      const service =
        action === 'prev'
          ? 'media_previous_track'
          : 'media_next_track';
      await callHaService({
        householdId,
        domain: 'media_player',
        service,
        entityId,
      });
    } catch (err: any) {
      setError(err.message || 'Failed to control media');
    } finally {
      setBusy(false);
    }
  }

  async function handleFanSpeedChange(
    e: React.ChangeEvent<HTMLSelectElement>,
  ) {
    const value = e.target.value as 'off' | 'low' | 'medium' | 'high';
    setFanSpeed(value);
    setError(null);

    const percentage =
      value === 'off' ? 0 : value === 'low' ? 30 : value === 'medium' ? 60 : 100;

    try {
      setBusy(true);
      await callHaService({
        householdId,
        domain: 'fan',
        service: 'set_percentage',
        entityId,
        data: {
          percentage,
        },
      });
    } catch (err: any) {
      setError(err.message || 'Failed to set fan speed');
    } finally {
      setBusy(false);
    }
  }

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        gap: '6px',
        minWidth: '190px',
      }}
    >
      {/* Always show basic toggle */}
      <DeviceToggleButton
        householdId={householdId}
        entityId={entityId}
        domain={domain}
        initialState={initialState}
      />

      {/* Domain-specific controls */}
      {domain === 'light' && (
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
          }}
        >
          <span
            style={{
              fontSize: '0.7rem',
              color: '#6b7280',
              whiteSpace: 'nowrap',
            }}
          >
            Brightness
          </span>
          <input
            type="range"
            min={10}
            max={100}
            step={5}
            value={brightness}
            disabled={disabled}
            onChange={handleLightBrightnessChange}
            style={{ flex: 1 }}
          />
        </div>
      )}

      {domain === 'cover' && (
        <div
          style={{
            display: 'flex',
            gap: '4px',
            flexWrap: 'wrap',
          }}
        >
          <button
            type="button"
            disabled={disabled}
            onClick={() => handleCover('open')}
            style={{
              padding: '3px 8px',
              borderRadius: '9999px',
              border: '1px solid #d1d5db',
              background: '#ecfdf5',
              fontSize: '0.75rem',
              cursor: 'pointer',
            }}
          >
            Open
          </button>
          <button
            type="button"
            disabled={disabled}
            onClick={() => handleCover('stop')}
            style={{
              padding: '3px 8px',
              borderRadius: '9999px',
              border: '1px solid #d1d5db',
              background: '#fef9c3',
              fontSize: '0.75rem',
              cursor: 'pointer',
            }}
          >
            Stop
          </button>
          <button
            type="button"
            disabled={disabled}
            onClick={() => handleCover('close')}
            style={{
              padding: '3px 8px',
              borderRadius: '9999px',
              border: '1px solid #d1d5db',
              background: '#fee2e2',
              fontSize: '0.75rem',
              cursor: 'pointer',
            }}
          >
            Close
          </button>
        </div>
      )}

      {domain === 'media_player' && (
        <>
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
            }}
          >
            <span
              style={{
                fontSize: '0.7rem',
                color: '#6b7280',
                whiteSpace: 'nowrap',
              }}
            >
              Volume
            </span>
            <input
              type="range"
              min={0}
              max={100}
              step={5}
              value={volume}
              disabled={disabled}
              onChange={handleVolumeChange}
              style={{ flex: 1 }}
            />
          </div>
          <div
            style={{
              display: 'flex',
              gap: '4px',
            }}
          >
            <button
              type="button"
              disabled={disabled}
              onClick={() => handleMediaAction('prev')}
              style={{
                padding: '3px 8px',
                borderRadius: '9999px',
                border: '1px solid #d1d5db',
                background: '#f9fafb',
                fontSize: '0.75rem',
                cursor: 'pointer',
              }}
            >
              ◀︎ Prev
            </button>
            <button
              type="button"
              disabled={disabled}
              onClick={() => handleMediaAction('next')}
              style={{
                padding: '3px 8px',
                borderRadius: '9999px',
                border: '1px solid #d1d5db',
                background: '#f9fafb',
                fontSize: '0.75rem',
                cursor: 'pointer',
              }}
            >
              Next ▶︎
            </button>
          </div>
        </>
      )}

      {domain === 'fan' && (
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
          }}
        >
          <span
            style={{
              fontSize: '0.7rem',
              color: '#6b7280',
              whiteSpace: 'nowrap',
            }}
          >
            Fan speed
          </span>
          <select
            disabled={disabled}
            value={fanSpeed}
            onChange={handleFanSpeedChange}
            style={{
              flex: 1,
              padding: '3px 6px',
              borderRadius: '9999px',
              border: '1px solid #d1d5db',
              fontSize: '0.75rem',
            }}
          >
            <option value="off">Off</option>
            <option value="low">Low</option>
            <option value="medium">Medium</option>
            <option value="high">High</option>
          </select>
        </div>
      )}

      {error && (
        <div
          style={{
            marginTop: '4px',
            fontSize: '0.7rem',
            color: '#b91c1c',
          }}
        >
          {error}
        </div>
      )}
    </div>
  );
}
