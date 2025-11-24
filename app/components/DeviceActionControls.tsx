// app/components/DeviceActionControls.tsx
'use client';

import { useState } from 'react';
import { DeviceToggleButton } from '@/app/components/DeviceToggleButton';
import type { LabelCategory } from '@/lib/labelCatalog';

type Props = {
  householdId: number;
  entityId: string;
  domain: string;
  initialState: string;
  labelCategory: LabelCategory | null;
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
  labelCategory,
}: Props) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [brightness, setBrightness] = useState(100);
  const [fanSpeed, setFanSpeed] = useState<'off' | 'low' | 'medium' | 'high'>(
    'off',
  );
  const [targetTemp, setTargetTemp] = useState(21);

  const isSensor =
    labelCategory === 'MOTION_SENSOR' ||
    labelCategory === 'DOORBELL' ||
    labelCategory === 'SECURITY';
  const isLight = labelCategory === 'LIGHT';
  const isBlind = labelCategory === 'BLIND';
  const labelIsMedia =
    labelCategory === 'TV' ||
    labelCategory === 'SPEAKER' ||
    labelCategory === 'SPOTIFY';
  const supportsMediaControls =
    labelIsMedia && domain === 'media_player';
  const isBoiler = labelCategory === 'BOILER';

  const showToggle =
    !isSensor && !isBlind && (labelCategory ? true : domain === 'switch');

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
      setError(err.message || 'Failed to control blind');
    } finally {
      setBusy(false);
    }
  }

  async function handleVolumeStep(direction: 'up' | 'down') {
    setError(null);
    try {
      setBusy(true);
      await callHaService({
        householdId,
        domain: 'media_player',
        service: direction === 'up' ? 'volume_up' : 'volume_down',
        entityId,
      });
    } catch (err: any) {
      setError(err.message || 'Failed to change volume');
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
        data: { percentage },
      });
    } catch (err: any) {
      setError(err.message || 'Failed to set fan speed');
    } finally {
      setBusy(false);
    }
  }

  async function handleTemperatureAdjust(delta: number) {
    const newTemp = Math.max(5, Math.min(30, targetTemp + delta));
    setTargetTemp(newTemp);
    setError(null);

    try {
      setBusy(true);
      await callHaService({
        householdId,
        domain,
        service: 'set_temperature',
        entityId,
        data: { temperature: newTemp },
      });
    } catch (err: any) {
      setError(err.message || 'Failed to adjust temperature');
    } finally {
      setBusy(false);
    }
  }

  if (isSensor) {
    return (
      <div
        style={{
          fontSize: '0.75rem',
          color: '#9ca3af',
          minWidth: '190px',
        }}
      >
        Read-only sensor. Current state: {initialState}
      </div>
    );
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
      {showToggle && (
        <DeviceToggleButton
          householdId={householdId}
          entityId={entityId}
          domain={domain}
          initialState={initialState}
        />
      )}

      {isLight && (
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
            min={5}
            max={100}
            step={5}
            value={brightness}
            disabled={busy}
            onChange={handleLightBrightnessChange}
            style={{ flex: 1 }}
          />
        </div>
      )}

      {isBlind && (
        <div
          style={{
            display: 'flex',
            gap: '4px',
            flexWrap: 'wrap',
          }}
        >
          <button
            type="button"
            disabled={busy}
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
            disabled={busy}
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
            disabled={busy}
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

      {supportsMediaControls && (
        <>
          <div
            style={{
              display: 'flex',
              gap: '4px',
            }}
          >
            <button
              type="button"
              disabled={busy}
              onClick={() => handleVolumeStep('down')}
              style={{
                padding: '3px 8px',
                borderRadius: '9999px',
                border: '1px solid #d1d5db',
                background: '#f9fafb',
                fontSize: '0.75rem',
                cursor: 'pointer',
              }}
            >
              Vol –
            </button>
            <button
              type="button"
              disabled={busy}
              onClick={() => handleVolumeStep('up')}
              style={{
                padding: '3px 8px',
                borderRadius: '9999px',
                border: '1px solid #d1d5db',
                background: '#f9fafb',
                fontSize: '0.75rem',
                cursor: 'pointer',
              }}
            >
              Vol +
            </button>
            <button
              type="button"
              disabled={busy}
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
              ◀︎
            </button>
            <button
              type="button"
              disabled={busy}
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
              ▶︎
            </button>
          </div>
        </>
      )}

      {labelIsMedia && !supportsMediaControls && (
        <div
          style={{
            fontSize: '0.7rem',
            color: '#9ca3af',
          }}
        >
          Connect this device as a media player in Home Assistant to adjust
          volume here.
        </div>
      )}

      {isBoiler && (
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
            Temperature
          </span>
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '4px',
            }}
          >
            <button
              type="button"
              disabled={busy}
              onClick={() => handleTemperatureAdjust(-1)}
              style={{
                padding: '3px 8px',
                borderRadius: '9999px',
                border: '1px solid #d1d5db',
                background: '#f9fafb',
                fontSize: '0.75rem',
                cursor: 'pointer',
              }}
            >
              –
            </button>
            <span
              style={{
                minWidth: '40px',
                textAlign: 'center',
                fontSize: '0.8rem',
                color: '#111827',
              }}
            >
              {targetTemp}°C
            </span>
            <button
              type="button"
              disabled={busy}
              onClick={() => handleTemperatureAdjust(1)}
              style={{
                padding: '3px 8px',
                borderRadius: '9999px',
                border: '1px solid #d1d5db',
                background: '#f9fafb',
                fontSize: '0.75rem',
                cursor: 'pointer',
              }}
            >
              +
            </button>
          </div>
        </div>
      )}

      {labelCategory === 'SPEAKER' && (
        <div
          style={{
            fontSize: '0.7rem',
            color: '#9ca3af',
          }}
        >
          Use the controls above to toggle power or adjust volume.
        </div>
      )}

      {domain === 'fan' && !labelCategory && (
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
            disabled={busy}
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
