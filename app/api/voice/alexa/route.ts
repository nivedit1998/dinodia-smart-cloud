// app/api/voice/alexa/route.ts
import { NextRequest } from 'next/server';
import {
  getVoiceHouseholdId,
  getVoiceDevicesForHousehold,
  alexaDisplayCategoryForLabels,
  callHaServiceForVoice,
} from '@/lib/voice';

/**
 * Minimal Alexa Smart Home endpoint for MVP:
 * - Alexa.Discovery#Discover
 * - Alexa.PowerController#TurnOn / TurnOff
 *
 * This assumes a single household for voice control (VOICE_DEFAULT_HOUSEHOLD_ID).
 * You still need to configure an Alexa Smart Home Skill and point its endpoint here.
 */
export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => null);

  if (!body || !body.directive) {
    return new Response(
      JSON.stringify({ error: 'Invalid Alexa directive payload' }),
      { status: 400 },
    );
  }

  const directive = body.directive;
  const header = directive.header || {};
  const namespace = header.namespace;
  const name = header.name;
  const messageId = header.messageId || 'message-id';
  const correlationToken = header.correlationToken;

  try {
    // ---------- DISCOVERY ----------
    if (namespace === 'Alexa.Discovery' && name === 'Discover') {
      const householdId = getVoiceHouseholdId();
      const devices = await getVoiceDevicesForHousehold(householdId);

      const endpoints = devices.map((d) => {
        const labels = d.labels ?? [];
        const displayCategory = alexaDisplayCategoryForLabels(labels);

        return {
          endpointId: d.entityId, // use HA entity_id as endpointId
          manufacturerName: 'Dinodia Smart Living',
          friendlyName: d.friendlyName,
          description: `${d.domain} via Dinodia Smart Cloud`,
          displayCategories: [displayCategory],
          cookie: {
            domain: d.domain,
            areaName: d.areaName || '',
            labels: labels.join(','),
          },
          capabilities: [
            {
              type: 'AlexaInterface',
              interface: 'Alexa',
              version: '3',
            },
            {
              type: 'AlexaInterface',
              interface: 'Alexa.PowerController',
              version: '3',
              properties: {
                supported: [{ name: 'powerState' }],
                proactivelyReported: false,
                retrievable: false,
              },
            },
          ],
        };
      });

      const response = {
        event: {
          header: {
            namespace: 'Alexa.Discovery',
            name: 'Discover.Response',
            messageId,
            payloadVersion: '3',
          },
          payload: {
            endpoints,
          },
        },
      };

      return new Response(JSON.stringify(response), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // ---------- POWER CONTROLLER: TURN ON/OFF ----------
    if (namespace === 'Alexa.PowerController' && (name === 'TurnOn' || name === 'TurnOff')) {
      const endpoint = directive.endpoint || {};
      const endpointId = endpoint.endpointId as string | undefined;

      if (!endpointId) {
        throw new Error('Missing endpointId');
      }

      const turnOn = name === 'TurnOn';
      const domain = endpoint.cookie?.domain || 'light';
      const service = turnOn ? 'turn_on' : 'turn_off';

      await callHaServiceForVoice(domain, service, {
        entity_id: endpointId,
      });

      const response = {
        context: {
          properties: [
            {
              namespace: 'Alexa.PowerController',
              name: 'powerState',
              value: turnOn ? 'ON' : 'OFF',
              timeOfSample: new Date().toISOString(),
              uncertaintyInMilliseconds: 500,
            },
          ],
        },
        event: {
          header: {
            namespace: 'Alexa',
            name: 'Response',
            messageId,
            correlationToken,
            payloadVersion: '3',
          },
          endpoint: {
            endpointId,
          },
          payload: {},
        },
      };

      return new Response(JSON.stringify(response), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // ---------- UNSUPPORTED DIRECTIVES ----------
    console.warn('Unhandled Alexa directive:', namespace, name);
    return new Response(
      JSON.stringify({
        event: {
          header: {
            namespace: 'Alexa',
            name: 'ErrorResponse',
            messageId,
            payloadVersion: '3',
          },
          payload: {
            type: 'INVALID_DIRECTIVE',
            message: `Unsupported directive: ${namespace}.${name}`,
          },
        },
      }),
      { status: 200, headers: { 'Content-Type': 'application/json' } },
    );
  } catch (err: any) {
    console.error('Error handling Alexa directive:', err);
    return new Response(
      JSON.stringify({
        event: {
          header: {
            namespace: 'Alexa',
            name: 'ErrorResponse',
            messageId,
            payloadVersion: '3',
          },
          payload: {
            type: 'INTERNAL_ERROR',
            message: err?.message || 'Internal error',
          },
        },
      }),
      { status: 200, headers: { 'Content-Type': 'application/json' } },
    );
  }
}
