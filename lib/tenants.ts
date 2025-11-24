// lib/tenants.ts
import { prisma } from '@/lib/prisma';
import { getDevicesWithMetadata, type DinodiaDevice } from '@/lib/homeAssistant';

export type HouseholdAccessRole = 'OWNER' | 'TENANT' | 'NONE';

export type HouseholdAccessInfo = {
  role: HouseholdAccessRole;
  areaFilter: string | null;
  labelFilterCsv: string | null;
};

export type AccessibleDevicesResult =
  | {
      ok: true;
      access: HouseholdAccessInfo;
      devices: DinodiaDevice[];
    }
  | {
      ok: false;
      error: string;
    };

function normalizeLabelCsv(labelFilterCsv: string | null) {
  if (!labelFilterCsv) return [] as string[];
  return labelFilterCsv
    .split(',')
    .map((label) => label.trim())
    .filter((label) => label.length > 0);
}

function deviceMatchesFilters(
  device: DinodiaDevice,
  areaFilter: string | null,
  labelFilterCsv: string | null,
) {
  if (areaFilter && (device.areaName ?? null) !== areaFilter) {
    return false;
  }

  const labelFilters = normalizeLabelCsv(labelFilterCsv);
  if (labelFilters.length === 0) {
    return true;
  }
  const deviceLabels = device.labels ?? [];
  return deviceLabels.some((label) => labelFilters.includes(label));
}

export async function getHouseholdAccessInfo(
  householdId: number,
  userId: number,
): Promise<HouseholdAccessInfo> {
  const household = await prisma.household.findUnique({
    where: { id: householdId },
    select: { id: true, ownerId: true },
  });

  if (!household) {
    throw new Error('Household not found');
  }

  if (household.ownerId === userId) {
    return {
      role: 'OWNER',
      areaFilter: null,
      labelFilterCsv: null,
    };
  }

  const membership = await prisma.householdMember.findFirst({
    where: {
      householdId,
      userId,
    },
  });

  if (!membership) {
    return {
      role: 'NONE',
      areaFilter: null,
      labelFilterCsv: null,
    };
  }

  return {
    role: membership.role,
    areaFilter: membership.areaFilter ?? null,
    labelFilterCsv: membership.labelFilterCsv ?? null,
  };
}

export async function getAccessibleDevicesForUser(
  householdId: number,
  userId: number,
): Promise<AccessibleDevicesResult> {
  try {
    const access = await getHouseholdAccessInfo(householdId, userId);
    const result = await getDevicesWithMetadata(householdId);

    if (!result.ok || !result.devices) {
      return {
        ok: false,
        error: result.error ?? 'Failed to load devices for household',
      };
    }

    const filtered = result.devices.filter((device) => {
      const matchesAccess = deviceMatchesFilters(
        device,
        access.areaFilter,
        access.labelFilterCsv,
      );

      if (!matchesAccess) return false;

      if (access.role === 'TENANT') {
        return Boolean(device.labels && device.labels.length > 0);
      }

      return true;
    });

    return { ok: true, access, devices: filtered };
  } catch (error) {
    return {
      ok: false,
      error:
        error instanceof Error
          ? error.message
          : 'Unexpected error fetching accessible devices',
    };
  }
}
