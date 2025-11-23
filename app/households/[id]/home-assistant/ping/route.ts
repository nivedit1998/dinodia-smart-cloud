// app/api/households/[id]/home-assistant/ping/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { callHomeAssistantAPI } from '@/lib/homeAssistant';

type RouteContext = {
  params: Promise<{
    id: string;
  }>;
};

export async function GET(_req: NextRequest, context: RouteContext) {
  const { id } = await context.params;
  const householdId = Number(id);
  if (Number.isNaN(householdId)) {
    return NextResponse.json(
      { ok: false, error: 'Invalid household id' },
      { status: 400 },
    );
  }

  const result = await callHomeAssistantAPI<{ message?: string }>(
    householdId,
    '/api/',
  );

  if (!result.ok) {
    return NextResponse.json(
      {
        ok: false,
        status: result.status,
        error: result.error ?? 'Unknown error',
      },
      { status: 200 },
    );
  }

  return NextResponse.json(
    {
      ok: true,
      status: result.status,
      message: result.data?.message ?? 'Connection successful',
    },
    { status: 200 },
  );
}
