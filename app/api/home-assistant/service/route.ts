// app/api/home-assistant/service/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getCurrentUser } from '@/lib/auth';
import { getAccessibleDevicesForUser } from '@/lib/tenants';

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

    const haInstance = await prisma.homeAssistantInstance.findUnique({
      where: { householdId: Number(householdId) },
    });

    if (!haInstance) {
      return NextResponse.json(
        { ok: false, error: 'Home Assistant instance not configured' },
        { status: 400 },
      );
    }

    const url = `${haInstance.baseUrl.replace(/\/$/, '')}/api/services/${domain}/${service}`;

    const res = await fetch(url, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${haInstance.accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        entity_id,
        ...(data || {}),
      }),
    });

    if (!res.ok) {
      const text = await res.text();
      console.error(
        'HA service call failed:',
        res.status,
        res.statusText,
        text,
      );
      return NextResponse.json(
        {
          ok: false,
          error: `HA service call failed: ${res.status} ${res.statusText}`,
        },
        { status: 500 },
      );
    }

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error('Error calling HA service:', err);
    return NextResponse.json(
      { ok: false, error: 'Internal error calling Home Assistant service' },
      { status: 500 },
    );
  }
}
