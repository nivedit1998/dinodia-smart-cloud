// app/api/dev-logout/route.ts
import { NextRequest, NextResponse } from 'next/server';

export async function GET(req: NextRequest) {
  // Redirect to homepage after logout
  const res = NextResponse.redirect(new URL('/', req.url));

  // Clear / delete cookie
  res.cookies.set('userId', '', {
    path: '/',
    httpOnly: true,
    maxAge: 0,
  });

  return res;
}
