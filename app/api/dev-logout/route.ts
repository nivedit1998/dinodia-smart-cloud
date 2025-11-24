// app/api/dev-logout/route.ts
import { NextRequest, NextResponse } from 'next/server';

export async function GET(req: NextRequest) {
  // Redirect to homepage on the same origin after logout
  const res = NextResponse.redirect('/');

  // Clear / delete cookie
  res.cookies.delete('userId');

  return res;
}
