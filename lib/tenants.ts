// lib/tenants.ts
import { prisma } from '@/lib/prisma';
import { DinodiaDevice, getDevicesWithMetadata } from '@/lib/homeAssistant';

export type HouseholdAccessRole = 'OWNER' | 'TENANT' | 'NONE';

export type HouseholdAccess = {
  role: HouseholdAccessRole;
  /** For TENANT, this is the Home Assistant Area they are allowed to see (e.g. "Room 1"). */
  areaFilter: string | null;
};

/**
 * Determine how a user is allowed to access a household.
 * We base this entirely on the HouseholdMember table:
 * - OWNER: HouseholdMember.role === OWNER
 * - TENANT: HouseholdMember.role === TENANT (uses areaFilter)
 * - NONE: no membership
 */
export async function getHouseholdAccessForUser(
  householdId: number,
  userId: number,
): Promise<HouseholdAccess> {
  // First, make sure the household exists
  const household = await prisma.household.findUnique({
    where: { id: householdId },
    select: { id: true },
  });

  if (!household) {
    return { role: 'NONE', areaFilter: null };
  }

  // Look for a membership record in HouseholdMember
  const membership = await prisma.householdMember.findFirst({
    where: {
      householdId,
      userId,
    },
  });

  if (!membership) {
    return { role: 'NONE', areaFilter: null };
  }

  if (membership.role === 'OWNER') {
    return { role: 'OWNER', areaFilter: null };
  }

  // TENANT role – area-based access
  return {
    role: 'TENANT',
    areaFilter: membership.areaFilter ?? null,
  };
}

/**
 * Get devices for a user in a household, applying areaFilter if TENANT.
 * OWNER sees everything.
 */
export async function getAccessibleDevicesForUser(
  householdId: number,
  userId: number,
): Promise<{
  access: HouseholdAccess;
  devices: DinodiaDevice[];
}> {
  const access = await getHouseholdAccessForUser(householdId, userId);

  // If user has no access, return empty
  if (access.role === 'NONE') {
    return { access, devices: [] };
  }

  const result = await getDevicesWithMetadata(householdId);
  if (!result.ok || !result.devices) {
    return { access, devices: [] };
  }

  const allDevices = result.devices;

  // OWNER (or no areaFilter set) -> see everything
  if (access.role === 'OWNER' || !access.areaFilter) {
    return { access, devices: allDevices };
  }

  const areaFilter = access.areaFilter;

  // TENANT: restrict by Home Assistant Area name
  const filtered = allDevices.filter((d) => {
    if (!d.areaName) return false;
    return d.areaName === areaFilter;
  });

  return { access, devices: filtered };
}
