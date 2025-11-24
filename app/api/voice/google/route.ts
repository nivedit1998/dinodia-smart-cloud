// app/api/voice/google/route.ts
import { NextRequest } from 'next/server';
import {
  getVoiceHouseholdId,
  getVoiceDevicesForHousehold,
  googleDeviceTypeForLabels,
  callHaServiceForVoice,
} from '@/lib/voice';

/**
 * Minimal Google Smart Home endpoint for MVP:
 * - SYNC: list devices
 * - EXECUTE: OnOff commands
 *
 * This assumes one household for voice control (VOICE_DEFAULT_HOUSEHOLD_ID).
 * You must configure a Google Smart Home project and point fulfillment here.
 */
export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => null);

  if (!body || !body.inputs || !Array.isArray(body.inputs) || !body.requestId) {
    return new Response(JSON.stringify({ error: 'Invalid Google payload' }), {
      status: 400,
    });
  }

  const requestId = body.requestId;
  const input = body.inputs[0];
  const intent = input.intent as string;

  try {
    // ---------- SYNC ----------
    if (intent === 'action.devices.SYNC') {
      const householdId = getVoiceHouseholdId();
      const devices = await getVoiceDevicesForHousehold(householdId);

      const payloadDevices = devices.map((d, index) => {
        const labels = d.labels ?? [];
        const type = googleDeviceTypeForLabels(labels);

        return {
          id: d.entityId, // use HA entity_id as Google device id
          type,
          traits: ['action.devices.traits.OnOff'],
          name: {
            name: d.friendlyName,
          },
          roomHint: d.areaName || '',
          willReportState: false,
          attributes: {},
          deviceInfo: {
            manufacturer: 'Dinodia Smart Living',
            model: d.domain,
            hwVersion: '1',
            swVersion: '1',
          },
          customData: {
            domain: d.domain,
            index,
          },
        };
      });

      const response = {
        requestId,
        payload: {
          agentUserId: 'dinodia-voice-user', // later map to real user
          devices: payloadDevices,
        },
      };

      return new Response(JSON.stringify(response), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // ---------- EXECUTE ----------
    if (intent === 'action.devices.EXECUTE') {
      const commands = input.payload.commands || [];
      const results: Array<{
        ids: string[];
        status: string;
        states?: Record<string, unknown>;
      }> = [];

      for (const cmd of commands) {
        const devices = cmd.devices || [];
        const execution = (cmd.execution || [])[0];

        if (!execution) continue;

        const command = execution.command as string;
        const params = execution.params || {};

        if (command === 'action.devices.commands.OnOff') {
          const on = !!params.on;
          for (const dev of devices) {
            const entityId = dev.id as string;
            const domain = (dev.customData?.domain as string) || 'light';

            try {
              await callHaServiceForVoice(domain, on ? 'turn_on' : 'turn_off', {
                entity_id: entityId,
              });

              results.push({
                ids: [entityId],
                status: 'SUCCESS',
                states: {
                  on,
                  online: true,
                },
              });
            } catch (err) {
              console.error('Error executing OnOff for', entityId, err);
              results.push({
                ids: [entityId],
                status: 'ERROR',
              });
            }
          }
        } else {
          // Unknown command
          for (const dev of devices) {
            const entityId = dev.id as string;
            results.push({
              ids: [entityId],
              status: 'ERROR',
            });
          }
        }
      }

      const response = {
        requestId,
        payload: {
          commands: results,
        },
      };

      return new Response(JSON.stringify(response), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // ---------- OTHER INTENTS (NOT IMPLEMENTED) ----------
    console.warn('Unhandled Google Smart Home intent:', intent);
    const response = {
      requestId,
      payload: {
        errorCode: 'notSupported',
      },
    };

    return new Response(JSON.stringify(response), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (err) {
    console.error('Error handling Google Smart Home request:', err);
    const response = {
      requestId,
      payload: {
        errorCode: 'internalError',
      },
    };
    return new Response(JSON.stringify(response), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  }
}
