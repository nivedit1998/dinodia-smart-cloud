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

  // Landlords go to households list; tenants go to first assigned household dashboard
  let redirectTarget = '/households';
  if (user.role === 'TENANT') {
    const membership = await prisma.householdMember.findFirst({
      where: { userId: user.id },
      orderBy: { householdId: 'asc' },
      select: { householdId: true },
    });

    if (membership) {
      redirectTarget = `/households/${membership.householdId}/dashboard`;
    }
  }

  const res = NextResponse.redirect(new URL(redirectTarget, req.url));
  res.cookies.set('userId', String(user.id), {
    path: '/',
    httpOnly: true,
  });

  return res;
}
