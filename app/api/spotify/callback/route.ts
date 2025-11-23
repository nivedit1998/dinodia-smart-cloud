// app/api/spotify/callback/route.ts
import { NextRequest, NextResponse } from 'next/server';
import {
  exchangeCodeForTokens,
  saveSpotifyTokensForDefaultHousehold,
  getBaseUrl,
} from '@/lib/spotify';

const STATE_COOKIE_NAME = 'spotify_oauth_state';

export async function GET(req: NextRequest) {
  const url = new URL(req.url);
  const origin = url.origin;

  try {

    const code = url.searchParams.get('code');
    const returnedState = url.searchParams.get('state');
    const error = url.searchParams.get('error');

    const storedState = req.cookies.get(STATE_COOKIE_NAME)?.value;

    if (error) {
      console.error('Spotify auth error:', error);
      return NextResponse.redirect(
        `${getBaseUrl(origin)}/?spotify_error=${encodeURIComponent(error)}`,
      );
    }

    if (!code || !returnedState || !storedState || returnedState !== storedState) {
      console.error('State mismatch or missing code', {
        codePresent: !!code,
        returnedState,
        storedState,
      });
      return NextResponse.redirect(
        `${getBaseUrl(origin)}/?spotify_error=${encodeURIComponent('invalid_state')}`,
      );
    }

    console.log('Spotify callback received, exchanging code for tokens...');

    const tokens = await exchangeCodeForTokens(code, origin);
    await saveSpotifyTokensForDefaultHousehold(tokens);

    // Clear state cookie
    const res = NextResponse.redirect(`${getBaseUrl(origin)}/spotify/connected`);
    res.cookies.set(STATE_COOKIE_NAME, '', {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge: 0,
    });

    return res;
  } catch (error: unknown) {
    console.error('Error handling Spotify callback:', error);
    const message = error instanceof Error ? error.message : 'callback_failed';

    return NextResponse.redirect(
      `${getBaseUrl(origin)}/?spotify_error=${encodeURIComponent(message)}`,
    );
  }
}
