'use client';

import { useMemo, useState } from 'react';
import { DeviceToggleButton } from '@/app/components/DeviceToggleButton';

type UiDevice = {
  entityId: string;
  state: string;
  domain: string;
  friendlyName: string;
  areaName?: string | null;
  labels?: string[];
};

type DevicesTableWithFiltersProps = {
  householdId: number;
  devices: UiDevice[];
};

const DOMAIN_ORDER = ['light', 'switch', 'cover', 'sensor', 'binary_sensor'];

export function DevicesTableWithFilters({
  householdId,
  devices,
}: DevicesTableWithFiltersProps) {
  const [selectedArea, setSelectedArea] = useState<string>('all');
  const [selectedLabel, setSelectedLabel] = useState<string>('all');
  const [search, setSearch] = useState<string>('');

  const { sortedDevices, areas, labels } = useMemo(() => {
    // Unique areas
    const areaSet = new Set<string>();
    // Unique labels
    const labelSet = new Set<string>();

    for (const d of devices) {
      if (d.areaName) {
        areaSet.add(d.areaName);
      }
      if (Array.isArray(d.labels)) {
        for (const label of d.labels) {
          if (label) labelSet.add(label);
        }
      }
    }

    const areas = Array.from(areaSet).sort((a, b) => a.localeCompare(b));
    const labels = Array.from(labelSet).sort((a, b) => a.localeCompare(b));

    // Sort devices by domain priority, then area, then friendly name
    const sorted = [...devices].sort((a, b) => {
      const ai = DOMAIN_ORDER.indexOf(a.domain);
      const bi = DOMAIN_ORDER.indexOf(b.domain);
      const ad = ai === -1 ? 999 : ai;
      const bd = bi === -1 ? 999 : bi;
      if (ad !== bd) return ad - bd;

      const an = a.areaName ?? '';
      const bn = b.areaName ?? '';
      if (an !== bn) return an.localeCompare(bn);

      return a.friendlyName.localeCompare(b.friendlyName);
    });

    return {
      sortedDevices: sorted,
      areas,
      labels,
    };
  }, [devices]);

  const filteredDevices = useMemo(() => {
    return sortedDevices.filter((d) => {
      if (selectedArea !== 'all') {
        if (!d.areaName || d.areaName !== selectedArea) return false;
      }

      if (selectedLabel !== 'all') {
        if (!d.labels || !d.labels.includes(selectedLabel)) return false;
      }

      if (search.trim()) {
        const q = search.trim().toLowerCase();
        const name = d.friendlyName.toLowerCase();
        const id = d.entityId.toLowerCase();
        if (!name.includes(q) && !id.includes(q)) return false;
      }

      return true;
    });
  }, [sortedDevices, selectedArea, selectedLabel, search]);

  return (
    <>
      {/* Filters */}
      <div
        style={{
          marginBottom: '16px',
          display: 'flex',
          flexWrap: 'wrap',
          gap: '8px',
          alignItems: 'center',
        }}
      >
        {/* Area filter */}
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            gap: 4,
            minWidth: 160,
          }}
        >
          <label
            style={{
              fontSize: '0.8rem',
              color: '#6b7280',
            }}
          >
            Area
          </label>
          <select
            value={selectedArea}
            onChange={(e) => setSelectedArea(e.target.value)}
            style={{
              borderRadius: '9999px',
              border: '1px solid #e5e7eb',
              padding: '4px 10px',
              fontSize: '0.85rem',
              background: '#ffffff',
            }}
          >
            <option value="all">All areas</option>
            {areas.map((area) => (
              <option key={area} value={area}>
                {area}
              </option>
            ))}
          </select>
        </div>

        {/* Label filter */}
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            gap: 4,
            minWidth: 180,
          }}
        >
          <label
            style={{
              fontSize: '0.8rem',
              color: '#6b7280',
            }}
          >
            Label
          </label>
          <select
            value={selectedLabel}
            onChange={(e) => setSelectedLabel(e.target.value)}
            style={{
              borderRadius: '9999px',
              border: '1px solid #e5e7eb',
              padding: '4px 10px',
              fontSize: '0.85rem',
              background: '#ffffff',
            }}
          >
            <option value="all">All labels</option>
            {labels.map((label) => (
              <option key={label} value={label}>
                {label}
              </option>
            ))}
          </select>
        </div>

        {/* Search */}
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            gap: 4,
            flex: '1 1 220px',
            minWidth: 220,
          }}
        >
          <label
            style={{
              fontSize: '0.8rem',
              color: '#6b7280',
            }}
          >
            Search
          </label>
          <input
            type="text"
            placeholder="Search by name or entity id…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            style={{
              borderRadius: '9999px',
              border: '1px solid #e5e7eb',
              padding: '4px 10px',
              fontSize: '0.85rem',
              background: '#ffffff',
            }}
          />
        </div>

        {/* Count */}
        <div
          style={{
            marginLeft: 'auto',
            fontSize: '0.8rem',
            color: '#6b7280',
            paddingTop: '18px',
          }}
        >
          Showing{' '}
          <span style={{ fontWeight: 600, color: '#111827' }}>
            {filteredDevices.length}
          </span>{' '}
          of {sortedDevices.length}
        </div>
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
            minWidth: '820px',
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
            {filteredDevices.map((d) => (
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
                  <DeviceToggleButton
                    householdId={householdId}
                    entityId={d.entityId}
                    domain={d.domain}
                    initialState={d.state}
                  />
                </td>
              </tr>
            ))}

            {filteredDevices.length === 0 && (
              <tr>
                <td
                  colSpan={7}
                  style={{
                    padding: '16px 8px',
                    textAlign: 'center',
                    color: '#9ca3af',
                    fontSize: '0.9rem',
                  }}
                >
                  No devices match the current filters.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </>
  );
}
