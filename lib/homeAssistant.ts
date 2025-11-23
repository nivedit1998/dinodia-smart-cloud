// lib/homeAssistant.ts
import { prisma } from './prisma';

export type HomeAssistantInstance = {
  id: number;
  householdId: number;
  baseUrl: string;
  accessToken: string;
};

export type HAState = {
  entity_id: string;
  state: string;
  attributes: Record<string, any>;
  last_changed: string;
  last_updated: string;
  context: {
    id: string;
    parent_id: string | null;
    user_id: string | null;
  };
};

type TemplateDeviceMeta = {
  entity_id: string;
  area_name: string | null;
  labels: string[];
};

export type DinodiaDevice = {
  entityId: string;
  state: string;
  domain: string;
  friendlyName: string;
  icon?: string;
  areaName?: string | null;
  labels?: string[];
  raw: HAState;
};

/**
 * Look up the Home Assistant instance configured for a given household.
 */
async function getHomeAssistantInstanceForHousehold(
  householdId: number,
): Promise<HomeAssistantInstance | null> {
  const instance = await prisma.homeAssistantInstance.findFirst({
    where: { householdId },
  });

  if (!instance) return null;

  return {
    id: instance.id,
    householdId: instance.householdId,
    baseUrl: instance.baseUrl,
    accessToken: instance.accessToken,
  };
}

/**
 * Simple GET helper for normal REST endpoints (e.g. /api/states, /api/).
 */
export async function callHomeAssistantAPI<T = unknown>(
  householdId: number,
  path: string,
): Promise<{ ok: boolean; status: number; data?: T; error?: string }> {
  const instance = await getHomeAssistantInstanceForHousehold(householdId);

  if (!instance) {
    return {
      ok: false,
      status: 0,
      error: 'No Home Assistant instance configured for this household.',
    };
  }

  const base = instance.baseUrl.replace(/\/+$/, '');
  const url = `${base}${path.startsWith('/') ? path : `/${path}`}`;

  try {
    const res = await fetch(url, {
      method: 'GET',
      headers: {
        Authorization: `Bearer ${instance.accessToken}`,
      },
      cache: 'no-store',
    });

    const text = await res.text();

    if (!res.ok) {
      return {
        ok: false,
        status: res.status,
        error: text || `Request failed with status ${res.status}`,
      };
    }

    let data: T;
    try {
      data = JSON.parse(text) as T;
    } catch {
      // Fallback if response isn't JSON (shouldn't really happen for /api/*)
      data = JSON.parse(text || '{}') as T;
    }

    return { ok: true, status: res.status, data };
  } catch (err: any) {
    console.error('[Dinodia] Error calling Home Assistant API:', err);
    return {
      ok: false,
      status: 0,
      error: err?.message || 'Unknown error calling Home Assistant API',
    };
  }
}

/**
 * POST helper for calling Home Assistant services:
 *   /api/services/{domain}/{service}
 * Example: domain "homeassistant", service "toggle"
 */
export async function callHomeAssistantService<T = unknown>(
  householdId: number,
  domain: string,
  service: string,
  payload: Record<string, any>,
): Promise<{ ok: boolean; status: number; data?: T; error?: string }> {
  const instance = await getHomeAssistantInstanceForHousehold(householdId);

  if (!instance) {
    return {
      ok: false,
      status: 0,
      error: 'No Home Assistant instance configured for this household.',
    };
  }

  const base = instance.baseUrl.replace(/\/+$/, '');
  const url = `${base}/api/services/${domain}/${service}`;

  try {
    const res = await fetch(url, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${instance.accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    });

    const text = await res.text();

    if (!res.ok) {
      return {
        ok: false,
        status: res.status,
        error: text || `Service call failed with status ${res.status}`,
      };
    }

    let data: T | undefined;
    try {
      data = text ? (JSON.parse(text) as T) : undefined;
    } catch {
      data = undefined;
    }

    return { ok: true, status: res.status, data };
  } catch (err: any) {
    console.error('[Dinodia] Error calling Home Assistant service:', err);
    return {
      ok: false,
      status: 0,
      error: err?.message || 'Unknown error calling Home Assistant service',
    };
  }
}

/**
 * POST helper for /api/template – renders a Jinja template server-side in HA.
 * We expect the template to render valid JSON and we parse it here.
 */
export async function renderHomeAssistantTemplate<T = unknown>(
  householdId: number,
  template: string,
): Promise<{ ok: boolean; status: number; data?: T; error?: string }> {
  const instance = await getHomeAssistantInstanceForHousehold(householdId);

  if (!instance) {
    return {
      ok: false,
      status: 0,
      error: 'No Home Assistant instance configured for this household.',
    };
  }

  const url = `${instance.baseUrl.replace(/\/+$/, '')}/api/template`;

  try {
    const res = await fetch(url, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${instance.accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ template }),
    });

    const text = await res.text();

    if (!res.ok) {
      return {
        ok: false,
        status: res.status,
        error: text || `Template render failed with status ${res.status}`,
      };
    }

    try {
      const data = JSON.parse(text) as T;
      return { ok: true, status: res.status, data };
    } catch (parseErr: any) {
      console.error('[Dinodia] Error parsing template JSON:', text);
      return {
        ok: false,
        status: res.status,
        error:
          'Template did not return valid JSON. Got: ' +
          text.slice(0, 200) +
          (text.length > 200 ? '…' : ''),
      };
    }
  } catch (err: any) {
    console.error('[Dinodia] Error calling /api/template:', err);
    return {
      ok: false,
      status: 0,
      error: err?.message || 'Unknown error calling /api/template',
    };
  }
}

/**
 * Fetches all entities from /api/states and enriches them with:
 *  - areaName (Room 1, Kitchen, etc.)
 *  - labels (label names, not IDs)
 *
 * Uses the /api/template endpoint with Jinja helpers:
 *   - area_name(entity_id)
 *   - labels(entity_id) | map('label_name')
 *
 * This picks up labels applied at:
 *   - entity level
 *   - device level
 *   - area level
 */
export async function getDevicesWithMetadata(
  householdId: number,
): Promise<{ ok: boolean; devices?: DinodiaDevice[]; error?: string }> {
  // 1) Get raw states (entities)
  const statesRes = await callHomeAssistantAPI<HAState[]>(
    householdId,
    '/api/states',
  );

  if (!statesRes.ok || !statesRes.data) {
    return {
      ok: false,
      error: statesRes.error || 'Failed to load states from Home Assistant',
    };
  }

  const states = statesRes.data;

  // 2) Ask HA to render a template that returns a JSON array of:
  //    { entity_id, area_name, labels[] }
  //
  // This is the exact template you verified in HA Dev Tools.
  const template = `
{% set ns = namespace(result=[]) %}
{% for s in states %}
  {% set item = {
    "entity_id": s.entity_id,
    "area_name": area_name(s.entity_id),
    "labels": (labels(s.entity_id) | map('label_name') | list)
  } %}
  {% set ns.result = ns.result + [item] %}
{% endfor %}
{{ ns.result | tojson }}
`.trim();

  const metaRes = await renderHomeAssistantTemplate<TemplateDeviceMeta[]>(
    householdId,
    template,
  );

  const metaByEntity = new Map<string, TemplateDeviceMeta>();

  if (metaRes.ok && Array.isArray(metaRes.data)) {
    for (const m of metaRes.data) {
      metaByEntity.set(m.entity_id, m);
    }
  } else if (!metaRes.ok) {
    console.warn(
      '[Dinodia] Could not load area/label metadata via /api/template:',
      metaRes.error,
    );
  }

  // 3) Combine states + metadata into DinodiaDevice objects
  const devices: DinodiaDevice[] = states.map((s) => {
    const [domain] = s.entity_id.split('.', 2);
    const friendlyName =
      (s.attributes && s.attributes.friendly_name) || s.entity_id;
    const icon =
      s.attributes && typeof s.attributes.icon === 'string'
        ? s.attributes.icon
        : undefined;

    const meta = metaByEntity.get(s.entity_id);

    return {
      entityId: s.entity_id,
      state: s.state,
      domain,
      friendlyName,
      icon,
      areaName: meta?.area_name ?? null,
      labels: meta?.labels ?? [],
      raw: s,
    };
  });

  return { ok: true, devices };
}
