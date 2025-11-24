// lib/tenants.ts
import { prisma } from '@/lib/prisma';
import { getDevicesWithMetadata, type DinodiaDevice } from '@/lib/homeAssistant';

export type HouseholdAccessRole = 'OWNER' | 'TENANT' | 'NONE';

export type HouseholdAccessInfo = {
  role: HouseholdAccessRole;
  areaFilter: string | null;
  labelFilterCsv: string | null;
};

export type AccessibleDevicesResult = {
  access: HouseholdAccessInfo;
  devices: DinodiaDevice[];
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
  const access = await getHouseholdAccessInfo(householdId, userId);
  const result = await getDevicesWithMetadata(householdId);

  if (!result.ok || !result.devices) {
    throw new Error(result.error ?? 'Failed to load devices for household');
  }

  const devices = result.devices.filter((device) =>
    deviceMatchesFilters(device, access.areaFilter, access.labelFilterCsv),
  );

  return { access, devices };
}
