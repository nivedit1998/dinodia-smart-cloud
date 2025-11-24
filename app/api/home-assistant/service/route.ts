// app/api/home-assistant/service/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

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

    if (!householdId || !domain || !service || !entity_id) {
      return NextResponse.json(
        { ok: false, error: 'Missing required fields' },
        { status: 400 },
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
