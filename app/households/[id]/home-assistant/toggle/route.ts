// app/api/households/[id]/home-assistant/toggle/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { callHomeAssistantAPI, callHomeAssistantService } from '@/lib/homeAssistant';

type RouteContext = {
  params: Promise<{
    id: string;
  }>;
};

type ToggleBody = {
  entity_id: string;
  domain: string;
  current_state?: string;
};

type HAState = {
  entity_id: string;
  state: string;
  attributes: {
    friendly_name?: string;
    device_class?: string;
  };
};

export async function POST(req: NextRequest, context: RouteContext) {
  const { id } = await context.params;
  const householdId = Number(id);
  if (Number.isNaN(householdId)) {
    return NextResponse.json(
      { ok: false, error: 'Invalid household id' },
      { status: 400 },
    );
  }

  let body: ToggleBody;
  try {
    body = (await req.json()) as ToggleBody;
  } catch {
    return NextResponse.json(
      { ok: false, error: 'Invalid JSON body' },
      { status: 400 },
    );
  }

  const { entity_id, domain, current_state } = body;

  if (!entity_id || !domain) {
    return NextResponse.json(
      { ok: false, error: 'Missing entity_id or domain' },
      { status: 400 },
    );
  }

  // Only support simple domains for now
  if (domain !== 'light' && domain !== 'switch') {
    return NextResponse.json(
      { ok: false, error: 'Toggling is only supported for lights and switches for now' },
      { status: 400 },
    );
  }

  // Decide service based on current state
  const service = current_state === 'on' ? 'turn_off' : 'turn_on';

  const serviceResult = await callHomeAssistantService(
    householdId,
    domain,
    service,
    { entity_id },
  );

  if (!serviceResult.ok) {
    return NextResponse.json(
      {
        ok: false,
        error: serviceResult.error ?? 'Failed to call Home Assistant service',
        status: serviceResult.status,
      },
      { status: 200 },
    );
  }

  // Fetch updated state
  const stateResult = await callHomeAssistantAPI<HAState>(
    householdId,
    `/api/states/${entity_id}`,
  );

  if (!stateResult.ok) {
    return NextResponse.json(
      {
        ok: true,
        service,
        new_state: null,
        warning:
          stateResult.error ??
          'Service call succeeded, but failed to fetch updated state',
      },
      { status: 200 },
    );
  }

  return NextResponse.json(
    {
      ok: true,
      service,
      new_state: stateResult.data?.state ?? null,
    },
    { status: 200 },
  );
}
