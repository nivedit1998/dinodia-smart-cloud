// app/api/dev-login/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(req: NextRequest) {
  const url = new URL(req.url);
  const userIdStr = url.searchParams.get('userId');

  if (!userIdStr) {
    // Missing userId – go back to login
    return NextResponse.redirect(new URL('/login', req.url));
  }

  const userId = Number(userIdStr);
  if (Number.isNaN(userId)) {
    return NextResponse.redirect(new URL('/login', req.url));
  }

  const user = await prisma.user.findUnique({
    where: { id: userId },
  });

  if (!user) {
    return NextResponse.redirect(new URL('/login', req.url));
  }

  const res = NextResponse.redirect(new URL('/households', req.url));
  res.cookies.set('userId', String(user.id), {
    path: '/',
    httpOnly: true,
  });

  return res;
}
