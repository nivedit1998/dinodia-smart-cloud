// lib/auth.ts
import { cookies } from 'next/headers';
import { prisma } from '@/lib/prisma';

export async function getCurrentUser() {
  // In your Next 16 setup, cookies() is async and returns a Promise
  const cookieStore = await cookies() as any;

  const raw = cookieStore.get?.('userId')?.value;
  if (!raw) return null;

  const userId = Number(raw);
  if (Number.isNaN(userId)) return null;

  return prisma.user.findUnique({
    where: { id: userId },
  });
}

export async function requireCurrentUser() {
  const user = await getCurrentUser();
  if (!user) {
    throw new Error('Not authenticated');
  }
  return user;
}
