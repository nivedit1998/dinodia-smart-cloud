// app/api/spotify/login/route.ts
import { NextResponse } from 'next/server';
import { buildSpotifyAuthUrl } from '@/lib/spotify';
import crypto from 'crypto';

const STATE_COOKIE_NAME = 'spotify_oauth_state';

export async function GET() {
  // Generate random state and store in cookie
  const state = crypto.randomBytes(16).toString('hex');

  const authUrl = buildSpotifyAuthUrl(state);

  const response = NextResponse.redirect(authUrl);
  response.cookies.set(STATE_COOKIE_NAME, state, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    maxAge: 10 * 60, // 10 minutes
  });

  return response;
}
