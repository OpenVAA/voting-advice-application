/**
 * The none provider and the log provider, driven with a recording output stream.
 *
 * @vitest-environment node
 */

import { log } from '@openvaa/app-shared';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { toLogRecord } from '$lib/analytics/mappers/toLogRecord';
import { createLogProvider } from './log';
import { createNoneProvider } from './none';
import type { AnalyticsEvent } from '$lib/analytics/analyticsEvent.type';

/** A visit id that cannot occur by coincidence in any output. */
const PLANTED_VISIT_ID = '0192f0c4-7a11-7c3e-9d5b-zz9plural0001';

const EVENTS: ReadonlyArray<AnalyticsEvent> = [
  {
    name: 'pageview',
    time: 1_792_400_000_000,
    app: 'voter',
    attributes: { params: { entityTab: 'candidates' }, duration: 4_200 }
  },
  {
    name: 'answer',
    time: 1_792_400_001_000,
    app: 'voter',
    id: PLANTED_VISIT_ID,
    attributes: { questionId: '3b241101-e2bb-4255-8caf-4136c566a962', value: 'line one\nline two' }
  }
];

const logSpies = {
  debug: vi.spyOn(log, 'debug'),
  info: vi.spyOn(log, 'info'),
  warn: vi.spyOn(log, 'warn'),
  error: vi.spyOn(log, 'error')
};

const consoleSpies = {
  log: vi.spyOn(console, 'log'),
  info: vi.spyOn(console, 'info'),
  warn: vi.spyOn(console, 'warn'),
  error: vi.spyOn(console, 'error'),
  debug: vi.spyOn(console, 'debug')
};

beforeEach(() => {
  for (const spy of [...Object.values(logSpies), ...Object.values(consoleSpies)]) spy.mockImplementation(() => {});
});

afterEach(() => {
  for (const spy of [...Object.values(logSpies), ...Object.values(consoleSpies)]) spy.mockReset();
});

describe('createNoneProvider', () => {
  it('is named none and resolves without calling anything', async () => {
    const provider = createNoneProvider();
    expect(provider.name).toBe('none');
    await expect(provider.capture(EVENTS)).resolves.toBeUndefined();
    for (const spy of [...Object.values(logSpies), ...Object.values(consoleSpies)]) expect(spy).not.toHaveBeenCalled();
  });
});

describe('createLogProvider', () => {
  it('is named log', () => {
    expect(createLogProvider({ write: () => {} }).name).toBe('log');
  });

  it('writes one newline-terminated JSON line per event, equal to its log record', async () => {
    const lines: Array<string> = [];
    const provider = createLogProvider({ write: (line) => lines.push(line) });

    await provider.capture(EVENTS);

    expect(lines).toHaveLength(EVENTS.length);
    lines.forEach((line, i) => {
      expect(line.endsWith('\n')).toBe(true);
      expect(line.slice(0, -1)).not.toContain('\n');
      expect(JSON.parse(line)).toEqual(toLogRecord(EVENTS[i]));
    });
  });

  it('writes nothing for an empty batch', async () => {
    const write = vi.fn();
    await createLogProvider({ write }).capture([]);
    expect(write).not.toHaveBeenCalled();
  });

  it('calls neither the console nor the application logger for an event', async () => {
    await createLogProvider({ write: () => {} }).capture(EVENTS);
    for (const spy of [...Object.values(logSpies), ...Object.values(consoleSpies)]) expect(spy).not.toHaveBeenCalled();
  });

  it('resolves when the stream throws, and still tries every event', async () => {
    const write = vi.fn(() => {
      throw new Error(`stream closed ${PLANTED_VISIT_ID}`);
    });

    await expect(createLogProvider({ write }).capture(EVENTS)).resolves.toBeUndefined();

    expect(write).toHaveBeenCalledTimes(EVENTS.length);
    for (const spy of Object.values(consoleSpies)) expect(spy).not.toHaveBeenCalled();
    expect(logSpies.warn).toHaveBeenCalledTimes(1);
    expect(logSpies.warn.mock.calls[0][1]).toEqual({ failed: EVENTS.length });
    expect(JSON.stringify(logSpies.warn.mock.calls)).not.toContain('zz9plural');
  });
});
