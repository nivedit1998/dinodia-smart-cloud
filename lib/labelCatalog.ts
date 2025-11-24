export type LabelCategory =
  | 'LIGHT'
  | 'BLIND'
  | 'MOTION_SENSOR'
  | 'SPOTIFY'
  | 'BOILER'
  | 'DOORBELL'
  | 'SECURITY'
  | 'TV'
  | 'SPEAKER';

const LABEL_MAP: Record<string, LabelCategory> = {
  light: 'LIGHT',
  lights: 'LIGHT',
  blind: 'BLIND',
  blinds: 'BLIND',
  'motion sensor': 'MOTION_SENSOR',
  motion: 'MOTION_SENSOR',
  spotify: 'SPOTIFY',
  boiler: 'BOILER',
  doorbell: 'DOORBELL',
  'home security': 'SECURITY',
  security: 'SECURITY',
  tv: 'TV',
  television: 'TV',
  speaker: 'SPEAKER',
  speakers: 'SPEAKER',
};

const DISPLAY_NAMES: Record<LabelCategory, string> = {
  LIGHT: 'Light',
  BLIND: 'Blind',
  MOTION_SENSOR: 'Motion Sensor',
  SPOTIFY: 'Spotify',
  BOILER: 'Boiler',
  DOORBELL: 'Doorbell',
  SECURITY: 'Home Security',
  TV: 'TV',
  SPEAKER: 'Speaker',
};

export function classifyDeviceByLabel(labels: string[]): LabelCategory | null {
  const lower = labels.map((label) => label.toLowerCase());
  for (const [name, category] of Object.entries(LABEL_MAP)) {
    if (lower.includes(name)) {
      return category;
    }
  }
  return null;
}

export function labelDisplayName(category: LabelCategory): string {
  return DISPLAY_NAMES[category] ?? category;
}

export const ALL_LABEL_CATEGORIES: LabelCategory[] = [
  'LIGHT',
  'BLIND',
  'MOTION_SENSOR',
  'SPOTIFY',
  'BOILER',
  'DOORBELL',
  'SECURITY',
  'TV',
  'SPEAKER',
];
