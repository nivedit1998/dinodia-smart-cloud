// app/components/TenantDevicesGrid.tsx
'use client';

import { useMemo, useState } from 'react';
import type { DinodiaDevice } from '@/lib/homeAssistant';
import { DeviceActionControls } from '@/app/components/DeviceActionControls';

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
  const [labelFilter, setLabelFilter] = useState<string>('all');

  const allLabels = useMemo(
    () =>
      Array.from(
        new Set(
          devices.flatMap((d) => d.labels || []).filter((l) => l.trim() !== ''),
        ),
      ).sort((a, b) => a.localeCompare(b)),
    [devices],
  );

  const filtered = useMemo(() => {
    return devices.filter((d) => {
      if (labelFilter !== 'all') {
        if (!d.labels || !d.labels.includes(labelFilter)) {
          return false;
        }
      }

      if (!search.trim()) return true;
      const term = search.toLowerCase();

      return (
        d.friendlyName.toLowerCase().includes(term) ||
        d.entityId.toLowerCase().includes(term) ||
        (d.areaName && d.areaName.toLowerCase().includes(term)) ||
        (d.labels || []).some((l) => l.toLowerCase().includes(term))
      );
    });
  }, [devices, search, labelFilter]);

  // Domain ordering to keep cards grouped nicely
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

        {/* Label filter chips */}
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
            onClick={() => setLabelFilter('all')}
            style={{
              padding: '4px 10px',
              borderRadius: '9999px',
              border:
                labelFilter === 'all'
                  ? '1px solid #4f46e5'
                  : '1px solid #e5e7eb',
              background:
                labelFilter === 'all' ? '#eef2ff' : '#ffffff',
              fontSize: '0.8rem',
              cursor: 'pointer',
            }}
          >
            All
          </button>
          {allLabels.map((label) => (
            <button
              key={label}
              type="button"
              onClick={() => setLabelFilter(label)}
              style={{
                padding: '4px 10px',
                borderRadius: '9999px',
                border:
                  labelFilter === label
                    ? '1px solid #4f46e5'
                    : '1px solid #e5e7eb',
                background:
                  labelFilter === label ? '#eef2ff' : '#ffffff',
                fontSize: '0.8rem',
                cursor: 'pointer',
              }}
            >
              {label}
            </button>
          ))}
        </div>

        {/* Search */}
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

      {/* Cards grid */}
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
            gridTemplateColumns:
              'repeat(auto-fit, minmax(220px, 1fr))',
            gap: '12px',
          }}
        >
          {filtered.map((d) => (
            <div
              key={d.entityId}
              style={{
                borderRadius: '16px',
                background: '#ffffff',
                boxShadow:
                  '0 14px 30px rgba(15, 23, 42, 0.08)',
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
                    {d.friendlyName}
                  </div>
                  <div
                    style={{
                      fontSize: '0.75rem',
                      color: '#6b7280',
                    }}
                  >
                    {d.areaName || 'No area'} · {d.domain}
                  </div>
                </div>
                <div
                  style={{
                    fontSize: '0.75rem',
                    color:
                      d.state === 'on' ? '#16a34a' : '#6b7280',
                  }}
                >
                  {d.state}
                </div>
              </div>

              {/* Labels */}
              <div
                style={{
                  display: 'flex',
                  flexWrap: 'wrap',
                  gap: '4px',
                }}
              >
                {(!d.labels || d.labels.length === 0) && (
                  <span
                    style={{
                      fontSize: '0.75rem',
                      color: '#9ca3af',
                    }}
                  >
                    No labels
                  </span>
                )}
                {d.labels?.map((label) => (
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

              {/* Controls */}
              <div
                style={{
                  marginTop: '4px',
                }}
              >
                <DeviceActionControls
                  householdId={householdId}
                  entityId={d.entityId}
                  domain={d.domain}
                  initialState={d.state}
                />
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
