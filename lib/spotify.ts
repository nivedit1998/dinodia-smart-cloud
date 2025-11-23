// lib/spotify.ts
import { prisma } from './prisma';

const SPOTIFY_AUTH_URL = 'https://accounts.spotify.com/authorize';
const SPOTIFY_TOKEN_URL = 'https://accounts.spotify.com/api/token';
const SPOTIFY_API_BASE = 'https://api.spotify.com/v1';

export const SPOTIFY_SCOPES = [
  'user-read-playback-state',
  'user-modify-playback-state',
  'user-read-currently-playing',
  'user-read-email',
  'user-read-private',
].join(' ');

// Default owner + household for now.
// Later, you’ll replace this with real auth & multi-household selection.
const DEFAULT_OWNER_EMAIL = 'owner@dinodia.local';
const DEFAULT_HOUSEHOLD_NAME = 'Default Household';

const FALLBACK_BASE_URL = 'http://127.0.0.1:3000';

function normalizeOrigin(value: string) {
  return value.replace(/\/$/, '');
}

export function getBaseUrl(origin?: string) {
  if (origin) {
    return normalizeOrigin(origin);
  }

  if (process.env.NEXT_PUBLIC_BASE_URL) {
    return normalizeOrigin(process.env.NEXT_PUBLIC_BASE_URL);
  }

  if (process.env.SPOTIFY_REDIRECT_URI) {
    try {
      const redirectUrl = new URL(process.env.SPOTIFY_REDIRECT_URI);
      return normalizeOrigin(redirectUrl.origin);
    } catch (error) {
      console.warn('Invalid SPOTIFY_REDIRECT_URI, falling back to default', error);
    }
  }

  return FALLBACK_BASE_URL;
}

export function getSpotifyRedirectUri(origin?: string) {
  if (process.env.SPOTIFY_REDIRECT_URI) {
    return process.env.SPOTIFY_REDIRECT_URI;
  }

  return `${getBaseUrl(origin)}/api/spotify/callback`;
}

export function buildSpotifyAuthUrl(state: string, origin?: string) {
  const params = new URLSearchParams({
    response_type: 'code',
    client_id: process.env.SPOTIFY_CLIENT_ID ?? '',
    scope: SPOTIFY_SCOPES,
    redirect_uri: getSpotifyRedirectUri(origin),
    state,
  });

  return `${SPOTIFY_AUTH_URL}?${params.toString()}`;
}

// Create or get the default owner + household
export async function ensureDefaultHousehold() {
  const owner = await prisma.user.upsert({
    where: { email: DEFAULT_OWNER_EMAIL },
    update: {},
    create: {
      email: DEFAULT_OWNER_EMAIL,
      name: 'Default Owner',
    },
  });

  const household = await prisma.household.upsert({
    where: { id: 1 },
    update: {},
    create: {
      id: 1,
      name: DEFAULT_HOUSEHOLD_NAME,
      ownerId: owner.id,
      plan: 'SINGLE_HOUSEHOLD',
    },
  });

  return household;
}

// Exchange auth code for tokens
export async function exchangeCodeForTokens(code: string, origin?: string) {
  const clientId = process.env.SPOTIFY_CLIENT_ID;
  const clientSecret = process.env.SPOTIFY_CLIENT_SECRET;

  if (!clientId || !clientSecret) {
    throw new Error('Spotify client ID/secret not set');
  }

  const basicAuth = Buffer.from(`${clientId}:${clientSecret}`).toString('base64');

  const params = new URLSearchParams({
    grant_type: 'authorization_code',
    code,
    redirect_uri: getSpotifyRedirectUri(origin),
  });

  const res = await fetch(SPOTIFY_TOKEN_URL, {
    method: 'POST',
    headers: {
      Authorization: `Basic ${basicAuth}`,
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: params.toString(),
  });

  if (!res.ok) {
    const text = await res.text();
    console.error('Error exchanging code for tokens', text);
    throw new Error('Failed to exchange code for tokens');
  }

  const data = (await res.json()) as {
    access_token: string;
    token_type: string;
    scope: string;
    expires_in: number;
    refresh_token: string;
  };

  const expiresAt = new Date(Date.now() + data.expires_in * 1000);

  return {
    accessToken: data.access_token,
    refreshToken: data.refresh_token,
    tokenType: data.token_type,
    scope: data.scope,
    expiresAt,
  };
}

// Save tokens for the default household (id=1 for now)
export async function saveSpotifyTokensForDefaultHousehold(tokens: {
  accessToken: string;
  refreshToken: string;
  tokenType: string;
  scope: string;
  expiresAt: Date;
}) {
  const household = await ensureDefaultHousehold();

  await prisma.spotifyToken.upsert({
    where: { householdId: household.id },
    update: {
      accessToken: tokens.accessToken,
      refreshToken: tokens.refreshToken,
      tokenType: tokens.tokenType,
      scope: tokens.scope,
      expiresAt: tokens.expiresAt,
    },
    create: {
      householdId: household.id,
      accessToken: tokens.accessToken,
      refreshToken: tokens.refreshToken,
      tokenType: tokens.tokenType,
      scope: tokens.scope,
      expiresAt: tokens.expiresAt,
    },
  });
}

// Get Spotify profile for default household's token
export async function getSpotifyProfileForDefaultHousehold() {
  const household = await ensureDefaultHousehold();

  const record = await prisma.spotifyToken.findUnique({
    where: { householdId: household.id },
  });

  if (!record) return null;

  // (No refresh logic yet – we’ll add token refresh later when needed)
  const res = await fetch(`${SPOTIFY_API_BASE}/me`, {
    headers: {
      Authorization: `Bearer ${record.accessToken}`,
    },
  });

  if (!res.ok) {
    console.error('Error fetching Spotify profile', await res.text());
    return null;
  }

  const data = await res.json();
  return data as {
    display_name?: string;
    email?: string;
    id: string;
  };
}

export type SpotifyNowPlaying = {
  is_playing: boolean;
  item: {
    name: string;
    artists: { name: string }[];
    album: { name: string; images?: { url: string }[] };
    duration_ms: number;
  } | null;
  progress_ms?: number;
};

// Get Now Playing info for default household
export async function getNowPlayingForDefaultHousehold(): Promise<SpotifyNowPlaying | null> {
  const household = await ensureDefaultHousehold();

  const record = await prisma.spotifyToken.findUnique({
    where: { householdId: household.id },
  });

  if (!record) return null;

  const res = await fetch(`${SPOTIFY_API_BASE}/me/player/currently-playing`, {
    headers: {
      Authorization: `Bearer ${record.accessToken}`,
    },
  });

  if (res.status === 204) {
    // Nothing currently playing
    return null;
  }

  if (!res.ok) {
    const text = await res.text();
    console.error('Error fetching now playing', text);
    return null;
  }

  const data = (await res.json()) as SpotifyNowPlaying;
  return data;
}
