// lib/voice.ts
import { prisma } from '@/lib/prisma';
import { DinodiaDevice, getDevicesWithMetadata } from '@/lib/homeAssistant';

/**
 * Get the default household ID for voice integrations from env.
 * This is an MVP assumption: one HA/flat for voice.
 */
function getDefaultHouseholdId(): number {
  const raw = process.env.VOICE_DEFAULT_HOUSEHOLD_ID || '1';
  const id = Number(raw);
  if (Number.isNaN(id)) {
    throw new Error(
      'VOICE_DEFAULT_HOUSEHOLD_ID is not a valid number. Set it in your .env file.',
    );
  }
  return id;
}

/**
 * Returns the householdId we should use for voice integrations.
 * For MVP we just use a fixed household (test flat).
 * Later this can map based on account linking.
 */
export function getVoiceHouseholdId(): number {
  return getDefaultHouseholdId();
}

/**
 * Voice-visible devices:
 * - Only entities that have at least one label in Home Assistant.
 * - Areas are still read but not used for filtering yet.
 */
export async function getVoiceDevicesForHousehold(
  householdId: number,
): Promise<DinodiaDevice[]> {
  const result = await getDevicesWithMetadata(householdId);
  if (!result.ok) {
    throw new Error(result.error || 'Failed to load devices from Home Assistant');
  }

  const devices = result.devices ?? [];
  return devices.filter((d) => d.labels && d.labels.length > 0);
}

/**
 * Map Dinodia / HA labels to Alexa displayCategory.
 * Adjust this as you standardise label naming.
 */
export function alexaDisplayCategoryForLabels(labels: string[]): string {
  const normalized = labels.map((l) => l.toLowerCase());

  if (normalized.includes('light') || normalized.includes('lamp')) {
    return 'LIGHT';
  }
  if (normalized.includes('blind') || normalized.includes('curtain')) {
    return 'INTERIOR_BLIND';
  }
  if (normalized.includes('tv')) {
    return 'TV';
  }
  if (normalized.includes('speaker')) {
    return 'SPEAKER';
  }

  // Fallback
  return 'OTHER';
}

/**
 * Map labels to a Google Smart Home device type.
 */
export function googleDeviceTypeForLabels(labels: string[]): string {
  const normalized = labels.map((l) => l.toLowerCase());

  if (normalized.includes('light') || normalized.includes('lamp')) {
    return 'action.devices.types.LIGHT';
  }
  if (normalized.includes('blind') || normalized.includes('curtain')) {
    return 'action.devices.types.BLINDS';
  }
  if (normalized.includes('speaker')) {
    return 'action.devices.types.SPEAKER';
  }
  if (normalized.includes('tv')) {
    return 'action.devices.types.TV';
  }

  return 'action.devices.types.SWITCH';
}

/**
 * Call Home Assistant service for the “voice household”.
 * Thin wrapper over existing HA integration, but standalone here so Alexa/Google
 * can call it without needing a logged-in user.
 */
export async function callHaServiceForVoice(
  domain: string,
  service: string,
  payload: Record<string, unknown>,
) {
  const householdId = getVoiceHouseholdId();

  const ha = await prisma.homeAssistantInstance.findUnique({
    where: { householdId },
  });

  if (!ha) {
    throw new Error('Home Assistant is not configured for the voice household');
  }

  const baseUrl = ha.baseUrl.replace(/\/$/, '');
  const url = `${baseUrl}/api/services/${domain}/${service}`;

  const res = await fetch(url, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${ha.accessToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(payload),
  });

  if (!res.ok) {
    const text = await res.text();
    console.error('HA service error (voice):', domain, service, payload, res.status, text);
    throw new Error(`HA service call failed: ${res.status}`);
  }
}

