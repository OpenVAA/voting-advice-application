import { describe, expect, test, vi } from 'vitest';
import type { LogRecord } from './logger.type';

/**
 * Re-import the logger with fresh module-scope state.
 * `configureLogger` mutates a module-level variable, so tests that assert the unconfigured default would otherwise depend on execution order.
 */
async function freshLogger() {
  vi.resetModules();
  return import('./logger');
}

describe('configureLogger', () => {
  test('emits nothing before it is called', async () => {
    const { log } = await freshLogger();
    const infoSpy = vi.spyOn(console, 'info').mockImplementation(() => undefined);
    const errorSpy = vi.spyOn(console, 'error').mockImplementation(() => undefined);

    log.debug('a');
    log.info('b');
    log.warn('c');
    log.error('d');

    expect(infoSpy).toHaveBeenCalledTimes(0);
    expect(errorSpy).toHaveBeenCalledTimes(0);

    infoSpy.mockRestore();
    errorSpy.mockRestore();
  });

  test('routes records to an injected sink instead of the console', async () => {
    const { configureLogger, log } = await freshLogger();
    const records = new Array<LogRecord>();
    const infoSpy = vi.spyOn(console, 'info').mockImplementation(() => undefined);

    configureLogger({ level: 'debug', sink: (record) => records.push(record) });
    log.debug('x');

    expect(records).toHaveLength(1);
    expect(infoSpy).toHaveBeenCalledTimes(0);

    infoSpy.mockRestore();
  });

  test('merges partial config, leaving the sink in place when only the level changes', async () => {
    const { configureLogger, log } = await freshLogger();
    const records = new Array<LogRecord>();

    configureLogger({ level: 'silent', sink: (record) => records.push(record) });
    log.error('dropped');
    configureLogger({ level: 'debug' });
    log.debug('kept');

    expect(records.map((record) => record.msg)).toEqual(['kept']);
  });

  test('drops levels below the configured threshold', async () => {
    const { configureLogger, log } = await freshLogger();
    const records = new Array<LogRecord>();

    configureLogger({ level: 'warn', sink: (record) => records.push(record) });
    log.debug('a');
    log.info('b');
    log.warn('c');
    log.error('d');

    expect(records.map((record) => record.msg)).toEqual(['c', 'd']);
  });

  test('uses console.info below level 40 and console.error at or above it when no sink is injected', async () => {
    const { configureLogger, log } = await freshLogger();
    const infoSpy = vi.spyOn(console, 'info').mockImplementation(() => undefined);
    const errorSpy = vi.spyOn(console, 'error').mockImplementation(() => undefined);

    configureLogger({ level: 'debug' });
    log.debug('a');
    log.info('b');
    log.warn('c');
    log.error('d');

    expect(infoSpy).toHaveBeenCalledTimes(2);
    expect(errorSpy).toHaveBeenCalledTimes(2);

    infoSpy.mockRestore();
    errorSpy.mockRestore();
  });
});

describe('log', () => {
  test('carries the pino numeric level, epoch time, message and OTel severity name', async () => {
    const { configureLogger, log } = await freshLogger();
    const records = new Array<LogRecord>();
    const before = Date.now();

    configureLogger({ level: 'debug', sink: (record) => records.push(record) });
    log.debug('d');
    log.info('i');
    log.warn('w');
    log.error('e');

    expect(records.map((record) => record.level)).toEqual([20, 30, 40, 50]);
    expect(records.map((record) => record.severityText)).toEqual(['DEBUG', 'INFO', 'WARN', 'ERROR']);
    expect(records.map((record) => record.msg)).toEqual(['d', 'i', 'w', 'e']);
    for (const record of records) {
      expect(record.time).toBeGreaterThanOrEqual(before);
      expect(record.time).toBeLessThanOrEqual(Date.now());
    }
  });

  test('serialises an Error so that JSON.stringify keeps its message and stack', async () => {
    const { configureLogger, log } = await freshLogger();
    const records = new Array<LogRecord>();

    configureLogger({ level: 'error', sink: (record) => records.push(record) });
    log.error('boom', { err: new Error('kaboom') });

    const serialised = JSON.stringify(records[0].err);
    expect(serialised).toContain('kaboom');
    expect(records[0].err?.type).toBe('Error');
    expect(records[0].err?.message).toBe('kaboom');
    expect(records[0].err?.stack).toBeTruthy();
    expect(records[0].err?.stack?.length).toBeGreaterThan(0);
  });

  test('serialises a non-Error thrown value without losing it', async () => {
    const { configureLogger, log } = await freshLogger();
    const records = new Array<LogRecord>();

    configureLogger({ level: 'error', sink: (record) => records.push(record) });
    log.error('boom', { err: 'a bare string' });

    expect(records[0].err).toEqual({ type: 'unknown', message: 'a bare string' });
  });

  test('passes attributes through verbatim and keeps err out of them', async () => {
    const { configureLogger, log } = await freshLogger();
    const records = new Array<LogRecord>();

    configureLogger({ level: 'info', sink: (record) => records.push(record) });
    log.info('hit', { err: new Error('x'), route: '/candidate', status: 200 });

    expect(records[0].attributes).toEqual({ route: '/candidate', status: 200 });
    expect(records[0].attributes).not.toHaveProperty('err');
  });

  test('omits attributes entirely when the caller passes none', async () => {
    const { configureLogger, log } = await freshLogger();
    const records = new Array<LogRecord>();

    configureLogger({ level: 'info', sink: (record) => records.push(record) });
    log.info('bare');
    log.info('only an error', { err: new Error('x') });

    expect(records[0]).not.toHaveProperty('attributes');
    expect(records[1]).not.toHaveProperty('attributes');
  });

  test('omits err entirely when the caller passes none', async () => {
    const { configureLogger, log } = await freshLogger();
    const records = new Array<LogRecord>();

    configureLogger({ level: 'info', sink: (record) => records.push(record) });
    log.info('bare');

    expect(records[0]).not.toHaveProperty('err');
  });
});

/**
 * `log.*` must be TOTAL.
 *
 * Every one of this repo's `log.*` call sites sits in a catch block or an error branch, so a logger that throws converts a handled failure into an unhandled one — strictly worse than a logger that is silent. These are the three triggers measured in the 157 review (Lot A CR-03).
 */
describe('log.* never throws', () => {
  test('survives an unrecognised configured level, including a type-legal `{ level: undefined }`', async () => {
    const { configureLogger, log } = await freshLogger();
    const records = new Array<LogRecord>();

    configureLogger({ level: 'debug', sink: (record) => records.push(record) });
    // `configureLogger` takes `Partial<LoggerConfig>`, so this is type-legal — it is the shape a consumer reaches for the moment the level comes from configuration rather than a literal (`configureLogger({ level: env.LOG_LEVEL as LogLevel })` with the variable unset).
    configureLogger({ level: undefined });
    expect(() => log.error('inside a catch block')).not.toThrow();
    // An explicitly-undefined member is not a change, so the previously configured level stands.
    expect(records.map((record) => record.msg)).toEqual(['inside a catch block']);

    configureLogger({ level: 'trace' as never });
    expect(() => log.error('still inside a catch block')).not.toThrow();
    // An unrecognised level has no threshold to compare against, so the record is dropped rather than guessed at.
    expect(records).toHaveLength(1);
  });

  test('contains a throwing sink instead of propagating it to the caller', async () => {
    const { configureLogger, log } = await freshLogger();

    // A sink is by design consumer-supplied — a remote transport, or a `JSON.stringify` over a circular record — so it is the one component of this design guaranteed to be outside the package's control.
    configureLogger({
      level: 'debug',
      sink: () => {
        throw new Error('sink down');
      }
    });

    expect(() => log.warn('degraded')).not.toThrow();
    expect(() => log.error('degraded', { err: new Error('original') })).not.toThrow();
  });

  test('serialises a thrown value whose stringification throws', async () => {
    const { configureLogger, log } = await freshLogger();
    const records = new Array<LogRecord>();

    configureLogger({ level: 'error', sink: (record) => records.push(record) });

    // A null-prototype object has no `toString`, so `String(value)` throws `TypeError: Cannot convert object to primitive value`.
    expect(() => log.error('x', { err: Object.create(null) })).not.toThrow();
    // Same shape via a throwing `toString`.
    expect(() =>
      log.error('y', {
        err: {
          toString() {
            throw new Error('nope');
          }
        }
      })
    ).not.toThrow();

    expect(records).toHaveLength(2);
    expect(records[0].err?.type).toBe('unknown');
    expect(records[0].err?.message).toBeTypeOf('string');
  });

  test('a throwing sink does not stop a later, working sink from receiving records', async () => {
    const { configureLogger, log } = await freshLogger();
    const records = new Array<LogRecord>();

    configureLogger({
      level: 'debug',
      sink: () => {
        throw new Error('sink down');
      }
    });
    log.warn('swallowed');
    configureLogger({ sink: (record) => records.push(record) });
    log.warn('delivered');

    expect(records.map((record) => record.msg)).toEqual(['delivered']);
  });
});
