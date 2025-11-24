// app/api/home-assistant/service/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth';
import { getAccessibleDevicesForUser } from '@/lib/tenants';
import { callHomeAssistantService } from '@/lib/homeAssistant';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const {
      householdId,
      domain,
      service,
      entity_id,
      data,
    }: {
      householdId: number;
      domain: string;
      service: string;
      entity_id: string;
      data?: Record<string, any>;
    } = body;

    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json(
        { ok: false, error: 'Unauthorized' },
        { status: 401 },
      );
    }

    if (!householdId || !domain || !service || !entity_id) {
      return NextResponse.json(
        { ok: false, error: 'Missing required fields' },
        { status: 400 },
      );
    }

    const accessResult = await getAccessibleDevicesForUser(
      Number(householdId),
      user.id,
    );

    if (!accessResult.ok) {
      return NextResponse.json(
        { ok: false, error: accessResult.error },
        { status: 403 },
      );
    }

    const targetDevice = accessResult.devices.find(
      (device) => device.entityId === entity_id,
    );

    if (!targetDevice) {
      return NextResponse.json(
        { ok: false, error: 'You do not have access to this device.' },
        { status: 403 },
      );
    }

    const result = await callHomeAssistantService(
      Number(householdId),
      domain,
      service,
      {
        entity_id,
        ...(data || {}),
      },
    );

    if (!result.ok) {
      console.error(
        '[Dinodia] HA service call failed',
        { householdId, entity_id, domain, service, status: result.status },
        result.error,
      );
      return NextResponse.json(
        { ok: false, error: result.error ?? 'HA service call failed' },
        { status: 500 },
      );
    }

    return NextResponse.json({ ok: true, status: result.status });
  } catch (err) {
    console.error('Error calling HA service:', err);
    return NextResponse.json(
      { ok: false, error: 'Internal error calling Home Assistant service' },
      { status: 500 },
    );
  }
}
