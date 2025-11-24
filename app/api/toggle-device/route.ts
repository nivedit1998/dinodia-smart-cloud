// app/api/toggle-device/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { callHomeAssistantService } from '@/lib/homeAssistant';
import { getCurrentUser } from '@/lib/auth';
import { getAccessibleDevicesForUser } from '@/lib/tenants';

export async function POST(req: NextRequest) {
  try {
    let body: any;
    try {
      body = await req.json();
    } catch {
      return NextResponse.json(
        { ok: false, error: 'Invalid JSON body' },
        { status: 400 },
      );
    }

    const householdId = Number(body?.householdId);
    const entityId = body?.entity_id as string | undefined;
    let domain = body?.domain as string | undefined;

    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json(
        { ok: false, error: 'Unauthorized' },
        { status: 401 },
      );
    }

    if (!householdId || Number.isNaN(householdId)) {
      return NextResponse.json(
        { ok: false, error: 'householdId is required and must be a number' },
        { status: 400 },
      );
    }

    if (!entityId) {
      return NextResponse.json(
        { ok: false, error: 'entity_id is required' },
        { status: 400 },
      );
    }

    if (!domain || typeof domain !== 'string') {
      // Derive from entity_id if not provided
      domain = entityId.split('.', 1)[0];
    }

    if (!domain) {
      return NextResponse.json(
        { ok: false, error: 'Could not determine domain for entity' },
        { status: 400 },
      );
    }

    const accessResult = await getAccessibleDevicesForUser(
      householdId,
      user.id,
    );

    if (!accessResult.ok) {
      return NextResponse.json(
        { ok: false, error: accessResult.error },
        { status: 403 },
      );
    }

    const targetDevice = accessResult.devices.find(
      (device) => device.entityId === entityId,
    );

    if (!targetDevice) {
      return NextResponse.json(
        { ok: false, error: 'You do not have access to this device.' },
        { status: 403 },
      );
    }

    const effectiveDomain = domain ?? targetDevice.domain;

    // Call {domain}.toggle – e.g. light.toggle, switch.toggle
    const result = await callHomeAssistantService(
      householdId,
      effectiveDomain,
      'toggle',
      { entity_id: entityId },
    );

    if (!result.ok) {
      console.error(
        '[Dinodia] Toggle service call failed:',
        'householdId:',
        householdId,
        'entity:',
        entityId,
        'domain:',
        domain,
        'status:',
        result.status,
        'error:',
        result.error,
      );
      return NextResponse.json(
        {
          ok: false,
          status: result.status,
          error: result.error ?? 'Service call failed',
          entity_id: entityId,
          domain: effectiveDomain,
        },
        { status: 200 }, // keep 200 so client can always parse JSON
      );
    }

    return NextResponse.json(
      {
        ok: true,
        status: result.status,
        entity_id: entityId,
        domain: effectiveDomain,
      },
      { status: 200 },
    );
  } catch (err: any) {
    console.error('[Dinodia] Unexpected error in /api/toggle-device:', err);
    return NextResponse.json(
      {
        ok: false,
        error: 'Unexpected server error in toggle route',
        debug: String(err?.message || err),
      },
      { status: 500 },
    );
  }
}
