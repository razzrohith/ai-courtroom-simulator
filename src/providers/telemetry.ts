/**
 * telemetry — Phase 25: in-app provider event log.
 * Ring buffer of provider failures/retries/fallbacks so users can see why
 * a turn fell back to mock without opening devtools.
 */

export interface TelemetryEvent {
  timestamp: string;
  level: 'info' | 'warn' | 'error';
  source: string;
  message: string;
}

const MAX_EVENTS = 100;
const events: TelemetryEvent[] = [];

export function recordProviderEvent(level: TelemetryEvent['level'], source: string, message: string): void {
  events.push({
    timestamp: new Date().toISOString(),
    level,
    source,
    message: message.slice(0, 400),
  });
  if (events.length > MAX_EVENTS) events.shift();
  try {
    window.dispatchEvent(new CustomEvent('judgebench-telemetry'));
  } catch {}
}

export function getTelemetryEvents(): TelemetryEvent[] {
  return [...events].reverse();
}

export function clearTelemetryEvents(): void {
  events.length = 0;
  try {
    window.dispatchEvent(new CustomEvent('judgebench-telemetry'));
  } catch {}
}
