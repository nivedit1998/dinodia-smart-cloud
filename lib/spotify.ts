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

// Helper: base URL (for redirects)
export function getBaseUrl() {
  // In dev, this will be http://localhost:3000
  return process.env.NEXT_PUBLIC_BASE_URL ?? 'http://localhost:3000';
}

// Build the auth URL
export function buildSpotifyAuthUrl(state: string) {
  const params = new URLSearchParams({
    response_type: 'code',
    client_id: process.env.SPOTIFY_CLIENT_ID ?? '',
    scope: SPOTIFY_SCOPES,
    redirect_uri: `${getBaseUrl()}/api/spotify/callback`,
    state,
  });

  return `${SPOTIFY_AUTH_URL}?${params.toString()}`;
}

// Exchange auth code for tokens
export async function exchangeCodeForTokens(code: string) {
  const basicAuth = Buffer.from(
    `${process.env.SPOTIFY_CLIENT_ID}:${process.env.SPOTIFY_CLIENT_SECRET}`,
  ).toString('base64');

  const params = new URLSearchParams({
    grant_type: 'authorization_code',
    code,
    redirect_uri: `${getBaseUrl()}/api/spotify/callback`,
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

// Save tokens for landlord (id = 1 for now)
export async function saveSpotifyTokensForLandlord(tokens: {
  accessToken: string;
  refreshToken: string;
  tokenType: string;
  scope: string;
  expiresAt: Date;
}) {
  // Ensure landlord exists (ID 1)
  const landlord = await prisma.landlord.upsert({
    where: { id: 1 },
    update: {},
    create: {
      email: 'landlord@example.com', // placeholder, can change later
    },
  });

  await prisma.spotifyToken.upsert({
    where: { landlordId: landlord.id },
    update: {
      accessToken: tokens.accessToken,
      refreshToken: tokens.refreshToken,
      tokenType: tokens.tokenType,
      scope: tokens.scope,
      expiresAt: tokens.expiresAt,
    },
    create: {
      landlordId: landlord.id,
      accessToken: tokens.accessToken,
      refreshToken: tokens.refreshToken,
      tokenType: tokens.tokenType,
      scope: tokens.scope,
      expiresAt: tokens.expiresAt,
    },
  });
}

// Get Spotify profile (to show on UI)
export async function getSpotifyProfileForLandlord() {
  const record = await prisma.spotifyToken.findUnique({
    where: { landlordId: 1 },
  });

  if (!record) return null;

  // (No refresh logic yet – we’ll add later if needed)
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
