// app/api/households/[id]/home-assistant/devices/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { callHomeAssistantAPI } from '@/lib/homeAssistant';

type RouteContext = {
  params: Promise<{
    id: string;
  }>;
};

type HAState = {
  entity_id: string;
  state: string;
  attributes: {
    friendly_name?: string;
    device_class?: string;
  };
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

  const result = await callHomeAssistantAPI<HAState[]>(
    householdId,
    '/api/states',
  );

  if (!result.ok) {
    return NextResponse.json(
      {
        ok: false,
        status: result.status,
        error: result.error ?? 'Failed to fetch states',
      },
      { status: 200 },
    );
  }

  const states = result.data ?? [];

  const devices = states.map((s) => {
    const [domain] = s.entity_id.split('.', 2);
    return {
      entity_id: s.entity_id,
      domain,
      state: s.state,
      friendly_name: s.attributes.friendly_name ?? s.entity_id,
      device_class: s.attributes.device_class ?? null,
    };
  });

  return NextResponse.json(
    {
      ok: true,
      count: devices.length,
      devices,
    },
    { status: 200 },
  );
}
