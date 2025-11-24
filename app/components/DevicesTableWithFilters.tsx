// app/components/DevicesTableWithFilters.tsx
'use client';

import { useMemo, useState } from 'react';
import type { DinodiaDevice } from '@/lib/homeAssistant';
import { DeviceActionControls } from '@/app/components/DeviceActionControls';

type Props = {
  householdId: number;
  devices: DinodiaDevice[];
};

const DOMAIN_LABELS: Record<string, string> = {
  light: 'Lights',
  switch: 'Switches',
  cover: 'Blinds / Covers',
  sensor: 'Sensors',
  binary_sensor: 'Binary Sensors',
  media_player: 'Media Players',
  fan: 'Fans',
};

export function DevicesTableWithFilters({ householdId, devices }: Props) {
  const [search, setSearch] = useState('');
  const [domainFilter, setDomainFilter] = useState<string>('all');
  const [areaFilter, setAreaFilter] = useState<string>('all');

  const allDomains = useMemo(
    () =>
      Array.from(
        new Set(devices.map((d) => d.domain).filter(Boolean)),
      ).sort((a, b) => a.localeCompare(b)),
    [devices],
  );

  const allAreas = useMemo(
    () =>
      Array.from(
        new Set(
          devices
            .map((d) => d.areaName || '')
            .filter((a) => a && a.trim().length > 0),
        ),
      ).sort((a, b) => a.localeCompare(b)),
    [devices],
  );

  const filtered = useMemo(() => {
    return devices.filter((d) => {
      if (domainFilter !== 'all' && d.domain !== domainFilter) {
        return false;
      }

      if (areaFilter !== 'all') {
        if (!d.areaName || d.areaName !== areaFilter) return false;
      }

      if (!search.trim()) return true;

      const term = search.toLowerCase();
      return (
        d.friendlyName.toLowerCase().includes(term) ||
        d.entityId.toLowerCase().includes(term) ||
        (d.areaName && d.areaName.toLowerCase().includes(term)) ||
        (d.labels || []).some((label) =>
          label.toLowerCase().includes(term),
        )
      );
    });
  }, [devices, search, domainFilter, areaFilter]);

  // Domain ordering: lights & switches first
  const domainOrder = ['light', 'switch', 'cover', 'media_player', 'fan'];

  filtered.sort((a, b) => {
    const ai = domainOrder.indexOf(a.domain);
    const bi = domainOrder.indexOf(b.domain);
    const ad = ai === -1 ? 999 : ai;
    const bd = bi === -1 ? 999 : bi;
    if (ad !== bd) return ad - bd;

    const an = a.areaName ?? '';
    const bn = b.areaName ?? '';
    if (an !== bn) return an.localeCompare(bn);

    return a.friendlyName.localeCompare(b.friendlyName);
  });

  return (
    <div>
      {/* Filter bar */}
      <div
        style={{
          marginBottom: '12px',
          display: 'flex',
          flexWrap: 'wrap',
          gap: '8px',
          alignItems: 'center',
        }}
      >
        <input
          type="text"
          placeholder="Search by name, entity ID, or area…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          style={{
            flex: 1,
            minWidth: '180px',
            padding: '6px 10px',
            borderRadius: '9999px',
            border: '1px solid #d1d5db',
            fontSize: '0.85rem',
          }}
        />
        <select
          value={domainFilter}
          onChange={(e) => setDomainFilter(e.target.value)}
          style={{
            padding: '6px 10px',
            borderRadius: '9999px',
            border: '1px solid #d1d5db',
            fontSize: '0.8rem',
          }}
        >
          <option value="all">All types</option>
          {allDomains.map((domain) => (
            <option key={domain} value={domain}>
              {DOMAIN_LABELS[domain] || domain}
            </option>
          ))}
        </select>
        <select
          value={areaFilter}
          onChange={(e) => setAreaFilter(e.target.value)}
          style={{
            padding: '6px 10px',
            borderRadius: '9999px',
            border: '1px solid #d1d5db',
            fontSize: '0.8rem',
          }}
        >
          <option value="all">All areas</option>
          {allAreas.map((area) => (
            <option key={area} value={area}>
              {area}
            </option>
          ))}
        </select>
      </div>

      {/* Table */}
      <div
        style={{
          borderRadius: '20px',
          background: '#ffffff',
          boxShadow: '0 16px 30px rgba(15, 23, 42, 0.08)',
          padding: '16px 18px',
          overflowX: 'auto',
        }}
      >
        <table
          style={{
            width: '100%',
            borderCollapse: 'collapse',
            fontSize: '0.85rem',
            minWidth: '920px',
          }}
        >
          <thead>
            <tr>
              <th
                style={{
                  textAlign: 'left',
                  padding: '8px',
                  borderBottom: '1px solid #e5e7eb',
                  color: '#6b7280',
                  fontWeight: 500,
                }}
              >
                Name
              </th>
              <th
                style={{
                  textAlign: 'left',
                  padding: '8px',
                  borderBottom: '1px solid #e5e7eb',
                  color: '#6b7280',
                  fontWeight: 500,
                }}
              >
                Entity ID
              </th>
              <th
                style={{
                  textAlign: 'left',
                  padding: '8px',
                  borderBottom: '1px solid #e5e7eb',
                  color: '#6b7280',
                  fontWeight: 500,
                }}
              >
                Domain
              </th>
              <th
                style={{
                  textAlign: 'left',
                  padding: '8px',
                  borderBottom: '1px solid #e5e7eb',
                  color: '#6b7280',
                  fontWeight: 500,
                }}
              >
                Area
              </th>
              <th
                style={{
                  textAlign: 'left',
                  padding: '8px',
                  borderBottom: '1px solid #e5e7eb',
                  color: '#6b7280',
                  fontWeight: 500,
                }}
              >
                Labels
              </th>
              <th
                style={{
                  textAlign: 'left',
                  padding: '8px',
                  borderBottom: '1px solid #e5e7eb',
                  color: '#6b7280',
                  fontWeight: 500,
                }}
              >
                State
              </th>
              <th
                style={{
                  textAlign: 'left',
                  padding: '8px',
                  borderBottom: '1px solid #e5e7eb',
                  color: '#6b7280',
                  fontWeight: 500,
                }}
              >
                Control
              </th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((d) => (
              <tr key={d.entityId}>
                <td
                  style={{
                    padding: '8px',
                    borderBottom: '1px solid #f3f4f6',
                  }}
                >
                  {d.friendlyName}
                </td>
                <td
                  style={{
                    padding: '8px',
                    borderBottom: '1px solid #f3f4f6',
                    color: '#6b7280',
                    fontFamily:
                      'ui-monospace, Menlo, Monaco, Consolas, "Liberation Mono", "Courier New", monospace',
                  }}
                >
                  {d.entityId}
                </td>
                <td
                  style={{
                    padding: '8px',
                    borderBottom: '1px solid #f3f4f6',
                    color: '#4b5563',
                  }}
                >
                  {d.domain}
                </td>
                <td
                  style={{
                    padding: '8px',
                    borderBottom: '1px solid #f3f4f6',
                    color: d.areaName ? '#111827' : '#9ca3af',
                  }}
                >
                  {d.areaName ?? '—'}
                </td>
                <td
                  style={{
                    padding: '8px',
                    borderBottom: '1px solid #f3f4f6',
                  }}
                >
                  {!d.labels || d.labels.length === 0 ? (
                    <span style={{ color: '#9ca3af' }}>—</span>
                  ) : (
                    <div
                      style={{
                        display: 'flex',
                        flexWrap: 'wrap',
                        gap: '4px',
                      }}
                    >
                      {d.labels.map((label) => (
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
                  )}
                </td>
                <td
                  style={{
                    padding: '8px',
                    borderBottom: '1px solid #f3f4f6',
                    color: d.state === 'on' ? '#16a34a' : '#6b7280',
                  }}
                >
                  {d.state}
                </td>
                <td
                  style={{
                    padding: '8px',
                    borderBottom: '1px solid #f3f4f6',
                  }}
                >
                  <DeviceActionControls
                    householdId={householdId}
                    entityId={d.entityId}
                    domain={d.domain}
                    initialState={d.state}
                  />
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {filtered.length === 0 && (
          <p
            style={{
              marginTop: '12px',
              fontSize: '0.9rem',
              color: '#6b7280',
            }}
          >
            No devices match the current filters.
          </p>
        )}
      </div>
    </div>
  );
}
