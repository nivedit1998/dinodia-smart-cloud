// app/components/HouseholdNavTabs.tsx
'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

type Props = {
  householdId: number;
};

const tabDefs = [
  { key: 'dashboard', label: 'Room dashboard', href: (id: number) => `/households/${id}/dashboard` },
  { key: 'devices', label: 'All devices', href: (id: number) => `/households/${id}/devices` },
  { key: 'tenant-devices', label: 'Tenant view', href: (id: number) => `/households/${id}/tenant-devices` },
  { key: 'members', label: 'Members & access', href: (id: number) => `/households/${id}/members` },
  { key: 'integrations', label: 'Integrations', href: (id: number) => `/households/${id}/integrations` },
];

export function HouseholdNavTabs({ householdId }: Props) {
  const pathname = usePathname();

  return (
    <nav
      style={{
        marginTop: '16px',
        marginBottom: '16px',
        padding: '4px',
        borderRadius: '9999px',
        background: '#e5e7eb',
        display: 'flex',
        flexWrap: 'wrap',
        gap: '4px',
      }}
    >
      {tabDefs.map((tab) => {
        const href = tab.href(householdId);
        const isActive =
          pathname === href ||
          (pathname?.startsWith(href) && tab.key !== 'dashboard'); // dashboard is the "home" tab

        return (
          <Link
            key={tab.key}
            href={href}
            style={{
              padding: '6px 12px',
              borderRadius: '9999px',
              fontSize: '0.8rem',
              textDecoration: 'none',
              border: isActive ? '1px solid #4f46e5' : '1px solid transparent',
              background: isActive ? '#eef2ff' : 'transparent',
              color: isActive ? '#111827' : '#4b5563',
              fontWeight: isActive ? 500 : 400,
            }}
          >
            {tab.label}
          </Link>
        );
      })}
    </nav>
  );
}
