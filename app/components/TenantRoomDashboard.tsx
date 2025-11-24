// app/components/TenantRoomDashboard.tsx
'use client';

import { useMemo, useState } from 'react';
import type { DinodiaDevice } from '@/lib/homeAssistant';
import { DeviceToggleButton } from '@/app/components/DeviceToggleButton';

type Props = {
  householdId: number;
  devices: DinodiaDevice[];
  labels: string[];
  areaName: string | null;
};

export function TenantRoomDashboard({
  householdId,
  devices,
  labels,
  areaName,
}: Props) {
  const [activeLabel, setActiveLabel] = useState<string | null>(null);

  const filteredDevices = useMemo(() => {
    if (!activeLabel) return devices;
    return devices.filter(
      (device) => device.labels && device.labels.includes(activeLabel),
    );
  }, [devices, activeLabel]);

  return (
    <div
      style={{
        marginTop: '8px',
        display: 'flex',
        flexDirection: 'column',
        gap: '14px',
      }}
    >
      <div
        style={{
          display: 'flex',
          flexWrap: 'wrap',
          gap: '8px',
          alignItems: 'center',
          marginBottom: '4px',
        }}
      >
        <span
          style={{
            fontSize: '0.8rem',
            color: '#6b7280',
            marginRight: '4px',
          }}
        >
          Filter by label:
        </span>
        <button
          type="button"
          onClick={() => setActiveLabel(null)}
          style={{
            padding: '4px 10px',
            borderRadius: '9999px',
            border:
              activeLabel === null ? '1px solid #4f46e5' : '1px solid #e5e7eb',
            background: activeLabel === null ? '#eef2ff' : '#ffffff',
            fontSize: '0.8rem',
            cursor: 'pointer',
          }}
        >
          All
        </button>
        {labels.map((label) => (
          <button
            key={label}
            type='button'
            onClick={() =>
              setActiveLabel((prev) => (prev === label ? null : label))
            }
            style={{
              padding: '4px 10px',
              borderRadius: '9999px',
              border:
                activeLabel === label
                  ? '1px solid #4f46e5'
                  : '1px solid #e5e7eb',
              background:
                activeLabel === label ? '#eef2ff' : '#ffffff',
              fontSize: '0.8rem',
              cursor: 'pointer',
            }}
          >
            {label}
          </button>
        ))}
      </div>

      <div
        style={{
          fontSize: '0.8rem',
          color: '#6b7280',
        }}
      >
        {areaName && (
          <>
            Room: <strong>{areaName}</strong>
            {' · '}
          </>
        )}
        Devices: <strong>{filteredDevices.length}</strong>
      </div>

      <div
        style={{
          marginTop: '4px',
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
          gap: '12px',
        }}
      >
        {filteredDevices.map((device) => {
          const supportsToggle =
            device.domain === 'light' ||
            device.domain === 'switch' ||
            device.domain === 'cover' ||
            device.domain === 'fan';

          return (
            <div
              key={device.entityId}
              style={{
                borderRadius: '18px',
                padding: '12px 12px 10px',
                background: '#ffffff',
                boxShadow: '0 12px 24px rgba(15, 23, 42, 0.12)',
                display: 'flex',
                flexDirection: 'column',
                gap: '6px',
              }}
            >
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  marginBottom: '2px',
                }}
              >
                <div
                  style={{
                    fontSize: '0.95rem',
                    fontWeight: 500,
                    color: '#111827',
                  }}
                >
                  {device.friendlyName}
                </div>
                <span
                  style={{
                    fontSize: '0.75rem',
                    color:
                      device.state === 'on' || device.state === 'open'
                        ? '#16a34a'
                        : '#6b7280',
                  }}
                >
                  {device.state}
                </span>
              </div>

              <div
                style={{
                  display: 'flex',
                  flexWrap: 'wrap',
                  gap: '4px',
                  alignItems: 'center',
                  fontSize: '0.75rem',
                }}
              >
                <span
                  style={{
                    padding: '2px 6px',
                    borderRadius: '9999px',
                    background: '#eff6ff',
                    color: '#1d4ed8',
                  }}
                >
                  {device.domain}
                </span>
                {device.labels?.map((label) => (
                  <span
                    key={label}
                    style={{
                      padding: '2px 6px',
                      borderRadius: '9999px',
                      background: '#eef2ff',
                      color: '#4f46e5',
                    }}
                  >
                    {label}
                  </span>
                ))}
              </div>

              {device.areaName && (
                <div
                  style={{
                    fontSize: '0.75rem',
                    color: '#9ca3af',
                  }}
                >
                  Area: {device.areaName}
                </div>
              )}

              <div
                style={{
                  marginTop: '6px',
                  display: 'flex',
                  justifyContent: 'flex-end',
                }}
              >
                {supportsToggle ? (
                  <DeviceToggleButton
                    householdId={householdId}
                    entityId={device.entityId}
                    domain={device.domain}
                    initialState={device.state}
                  />
                ) : (
                  <span
                    style={{
                      fontSize: '0.75rem',
                      color: '#9ca3af',
                    }}
                  >
                    No direct control from here
                  </span>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {filteredDevices.length === 0 && (
        <p
          style={{
            marginTop: '8px',
            fontSize: '0.9rem',
            color: '#6b7280',
          }}
        >
          No devices found for this room and label selection.
        </p>
      )}
    </div>
  );
}
