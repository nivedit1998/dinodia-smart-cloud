// app/api/spotify/callback/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { exchangeCodeForTokens, saveSpotifyTokensForLandlord } from '@/lib/spotify';

const STATE_COOKIE_NAME = 'spotify_oauth_state';

export async function GET(req: NextRequest) {
  const url = new URL(req.url);

  const code = url.searchParams.get('code');
  const returnedState = url.searchParams.get('state');
  const error = url.searchParams.get('error');

  const storedState = req.cookies.get(STATE_COOKIE_NAME)?.value;

  if (error) {
    console.error('Spotify auth error:', error);
    return NextResponse.redirect('/?spotify_error=' + encodeURIComponent(error));
  }

  if (!code || !returnedState || !storedState || returnedState !== storedState) {
    console.error('State mismatch or missing code');
    return NextResponse.redirect('/?spotify_error=invalid_state');
  }

  try {
    const tokens = await exchangeCodeForTokens(code);
    await saveSpotifyTokensForLandlord(tokens);

    // Clear state cookie
    const res = NextResponse.redirect('/spotify/connected');
    res.cookies.set(STATE_COOKIE_NAME, '', {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge: 0,
    });

    return res;
  } catch (e) {
    console.error('Error handling Spotify callback:', e);
    return NextResponse.redirect('/?spotify_error=callback_failed');
  }
}
