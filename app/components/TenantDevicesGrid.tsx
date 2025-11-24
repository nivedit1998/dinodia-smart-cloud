// app/components/TenantDevicesGrid.tsx
'use client';

import { useMemo, useState } from 'react';
import type { DinodiaDevice } from '@/lib/homeAssistant';
import { DeviceActionControls } from '@/app/components/DeviceActionControls';
import {
  labelDisplayName,
  type LabelCategory,
} from '@/lib/labelCatalog';

type Props = {
  householdId: number;
  areaName: string | null;
  role: 'OWNER' | 'TENANT';
  devices: DinodiaDevice[];
};

export function TenantDevicesGrid({
  householdId,
  areaName,
  role,
  devices,
}: Props) {
  const [search, setSearch] = useState('');
  const [labelFilter, setLabelFilter] = useState<LabelCategory | null>(null);

  const labelOptions = useMemo(() => {
    return Array.from(
      new Set(
        devices
          .map((device) => device.labelCategory)
          .filter((cat): cat is LabelCategory => Boolean(cat)),
      ),
    ).sort((a, b) => labelDisplayName(a).localeCompare(labelDisplayName(b)));
  }, [devices]);

  const filtered = useMemo(() => {
    return devices.filter((device) => {
      if (labelFilter && device.labelCategory !== labelFilter) {
        return false;
      }

      if (!search.trim()) return true;
      const term = search.toLowerCase();

      return (
        device.friendlyName.toLowerCase().includes(term) ||
        device.entityId.toLowerCase().includes(term) ||
        (device.areaName && device.areaName.toLowerCase().includes(term)) ||
        device.labels.some((label) => label.toLowerCase().includes(term)) ||
        (device.labelCategory &&
          labelDisplayName(device.labelCategory)
            .toLowerCase()
            .includes(term))
      );
    });
  }, [devices, search, labelFilter]);

  const domainOrder = ['light', 'switch', 'cover', 'media_player', 'fan'];

  filtered.sort((a, b) => {
    const ai = domainOrder.indexOf(a.domain);
    const bi = domainOrder.indexOf(b.domain);
    const ad = ai === -1 ? 999 : ai;
    const bd = bi === -1 ? 999 : bi;
    if (ad !== bd) return ad - bd;

    const an = a.friendlyName ?? '';
    const bn = b.friendlyName ?? '';
    return an.localeCompare(bn);
  });

  return (
    <div>
      {/* Filters row */}
      <div
        style={{
          marginBottom: '16px',
          display: 'flex',
          flexDirection: 'column',
          gap: '8px',
        }}
      >
        <div
          style={{
            display: 'flex',
            flexWrap: 'wrap',
            gap: '8px',
            alignItems: 'center',
          }}
        >
          {areaName && (
            <span
              style={{
                padding: '4px 10px',
                borderRadius: '9999px',
                background: '#eef2ff',
                color: '#4f46e5',
                fontSize: '0.8rem',
              }}
            >
              Area: {areaName}
            </span>
          )}
          <span
            style={{
              padding: '4px 10px',
              borderRadius: '9999px',
              background: '#ecfdf5',
              color: '#047857',
              fontSize: '0.8rem',
            }}
          >
            Role: {role === 'TENANT' ? 'Tenant' : 'Owner'}
          </span>
        </div>

        <div
          style={{
            display: 'flex',
            flexWrap: 'wrap',
            gap: '6px',
            alignItems: 'center',
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
            onClick={() => setLabelFilter(null)}
            style={{
              padding: '4px 10px',
              borderRadius: '9999px',
              border:
                labelFilter === null
                  ? '1px solid #4f46e5'
                  : '1px solid #e5e7eb',
              background:
                labelFilter === null ? '#eef2ff' : '#ffffff',
              fontSize: '0.8rem',
              cursor: 'pointer',
            }}
          >
            All
          </button>
          {labelOptions.map((category) => {
            const display = labelDisplayName(category);
            return (
              <button
                key={category}
                type="button"
                onClick={() =>
                  setLabelFilter((prev) =>
                    prev === category ? null : category,
                  )
                }
                style={{
                  padding: '4px 10px',
                  borderRadius: '9999px',
                  border:
                    labelFilter === category
                      ? '1px solid #4f46e5'
                      : '1px solid #e5e7eb',
                  background:
                    labelFilter === category ? '#eef2ff' : '#ffffff',
                  fontSize: '0.8rem',
                  cursor: 'pointer',
                }}
              >
                {display}
              </button>
            );
          })}
        </div>

        <input
          type="text"
          placeholder="Search devices by name, label, or room…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          style={{
            padding: '8px 12px',
            borderRadius: '9999px',
            border: '1px solid #d1d5db',
            fontSize: '0.9rem',
          }}
        />
      </div>

      {filtered.length === 0 ? (
        <p
          style={{
            fontSize: '0.9rem',
            color: '#6b7280',
          }}
        >
          No devices match the current filters. Try selecting a different
          label or clearing search.
        </p>
      ) : (
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
            gap: '12px',
          }}
        >
          {filtered.map((device) => (
            <div
              key={device.entityId}
              style={{
                borderRadius: '16px',
                background: '#ffffff',
                boxShadow: '0 14px 30px rgba(15, 23, 42, 0.08)',
                padding: '12px 14px',
                display: 'flex',
                flexDirection: 'column',
                gap: '6px',
              }}
            >
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  gap: '8px',
                }}
              >
                <div>
                  <div
                    style={{
                      fontSize: '0.95rem',
                      fontWeight: 600,
                      color: '#111827',
                    }}
                  >
                    {device.friendlyName}
                  </div>
                  <div
                    style={{
                      fontSize: '0.75rem',
                      color: '#6b7280',
                    }}
                  >
                    {device.areaName || 'No area'} · {device.domain}
                  </div>
                </div>
                <div
                  style={{
                    fontSize: '0.75rem',
                    color:
                      device.state === 'on' || device.state === 'open'
                        ? '#16a34a'
                        : '#6b7280',
                  }}
                >
                  {device.state}
                </div>
              </div>

              <div
                style={{
                  display: 'flex',
                  flexWrap: 'wrap',
                  gap: '4px',
                }}
              >
                {device.labelCategory && (
                  <span
                    style={{
                      padding: '2px 6px',
                      borderRadius: '9999px',
                      background: '#eff6ff',
                      color: '#1d4ed8',
                      fontSize: '0.75rem',
                    }}
                  >
                    {labelDisplayName(device.labelCategory)}
                  </span>
                )}
                {device.labels.length === 0 && (
                  <span
                    style={{
                      fontSize: '0.75rem',
                      color: '#9ca3af',
                    }}
                  >
                    No labels
                  </span>
                )}
                {device.labels.map((label) => (
                  <span
                    key={label}
                    style={{
                      padding: '2px 6px',
                      borderRadius: '9999px',
                      background: '#eef2ff',
                      color: '#4f46e5',
                      fontSize: '0.75rem',
                    }}
                  >
                    {label}
                  </span>
                ))}
              </div>

              <div
                style={{
                  marginTop: '4px',
                }}
              >
                <DeviceActionControls
                  householdId={householdId}
                  entityId={device.entityId}
                  domain={device.domain}
                  initialState={device.state}
                  labelCategory={device.labelCategory}
                />
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
