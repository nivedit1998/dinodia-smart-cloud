// app/api/dev-logout/route.ts
import { NextRequest, NextResponse } from 'next/server';

export async function GET(req: NextRequest) {
  // Redirect to homepage on the same origin after logout
  const baseOrigin =
    process.env.NEXT_PUBLIC_BASE_URL || new URL(req.url).origin;
  const res = NextResponse.redirect(new URL('/', baseOrigin));

  // Clear / delete cookie
  res.cookies.delete('userId');

  return res;
}
