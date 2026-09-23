import type { LoggerConfig, LogLevel, LogRecord } from './logger.type';

/**
 * The pino numeric level for each name, and the OpenTelemetry severity name that goes with it.
 */
const LEVELS: Record<LogLevel, { level: LogRecord['level']; severityText: LogRecord['severityText'] }> = {
  debug: { level: 20, severityText: 'DEBUG' },
  info: { level: 30, severityText: 'INFO' },
  warn: { level: 40, severityText: 'WARN' },
  error: { level: 50, severityText: 'ERROR' }
};

/**
 * The module-scope configuration.
 *
 * It starts silent on purpose: this package is loaded by six workspaces, and a chatty default would start emitting records in every one of them the moment the dependency is added.
 * Note that the state is per module graph, so a consumer with separate client and server bundles must call {@link configureLogger} once in each entry point.
 */
let config: LoggerConfig = { level: 'silent' };

/**
 * Set the log level and, optionally, the sink.
 *
 * The argument is merged into the current configuration rather than replacing it, so raising the level later does not discard an already-injected sink.
 *
 * An explicitly-`undefined` member is NOT a change and is dropped from the merge. A plain spread would let `configureLogger({ level: undefined })` — which `Partial<LoggerConfig>` makes type-legal, and which is what `configureLogger({ level: env.LOG_LEVEL as LogLevel })` evaluates to when the variable is unset — clobber a working level with a value no threshold can be resolved from.
 *
 * @param next - The configuration fields to change.
 */
export function configureLogger(next: Partial<LoggerConfig>): void {
  const changes = Object.fromEntries(Object.entries(next).filter(([, value]) => value !== undefined));
  config = { ...config, ...changes };
}

/**
 * Flatten an arbitrary thrown value into a serialisable shape.
 *
 * This exists because `JSON.stringify(new Error('x'))` is `{}`: `name`, `message` and `stack` are all non-enumerable, so a structured emitter that simply attached the `Error` would lose every stack trace and be strictly worse than the `console.error` it replaces.
 *
 * @param value - The thrown value, of any type.
 * @returns A plain object with string fields only.
 */
function serialiseError(value: unknown): NonNullable<LogRecord['err']> {
  if (value instanceof Error) {
    const serialised: NonNullable<LogRecord['err']> = { type: value.name, message: value.message };
    if (value.stack != null) serialised.stack = value.stack;
    return serialised;
  }
  // `String(value)` is not total: a null-prototype object has no `toString`, so `String(Object.create(null))` raises `TypeError: Cannot convert object to primitive value`, and any value with a throwing or non-primitive `toString` does the same. A thrown value is by definition arbitrary, and this function only ever runs while the caller is already handling a failure.
  let message: string;
  try {
    message = String(value);
  } catch {
    message = '[unserialisable thrown value]';
  }
  return { type: 'unknown', message };
}

/**
 * Build a record and hand it to the sink, unless the configured level drops it.
 *
 * @param name - The level to emit at.
 * @param msg - The message body.
 * @param fields - The caller's structured fields, optionally carrying `err`.
 */
function emit(name: LogLevel, msg: string, fields?: Record<string, unknown> & { err?: unknown }): void {
  if (config.level === 'silent') return;
  // Resolve the threshold defensively rather than indexing `LEVELS` straight: an unrecognised level reaches here whenever the level comes from configuration rather than a literal, and a bare `LEVELS[config.level].level` then raises a TypeError on EVERY subsequent call. A record with no threshold to compare against is dropped — the quietest available failure — rather than guessed at.
  const threshold = LEVELS[config.level];
  if (!threshold) return;
  const { level, severityText } = LEVELS[name];
  if (level < threshold.level) return;

  const record: LogRecord = { level, time: Date.now(), msg, severityText };

  if (fields) {
    const { err, ...attributes } = fields;
    if (err !== undefined) record.err = serialiseError(err);
    if (Object.keys(attributes).length > 0) record.attributes = attributes;
  }

  // The emit itself is guarded because the sink is consumer-supplied by design — a remote transport, or a `JSON.stringify` over a circular record — and is therefore the one component of this module that is outside its control. Every `log.*` call site in this repo is a catch block or an error branch, so a sink that throws out of here converts a handled failure into an unhandled one. Swallowing is the only honest response: there is nowhere left to report to.
  try {
    if (config.sink) {
      config.sink(record);
      return;
    }
    // The console default mirrors what the frontend logger did before this module existed: warnings and errors go to `console.error`, everything quieter goes to `console.info`.
    if (record.level >= 40) console.error(record);
    else console.info(record);
  } catch {
    // Deliberately empty: see above.
  }
}

/**
 * Emit a debug record.
 *
 * @param msg - The message body.
 * @param fields - Structured fields, passed through verbatim. A value at `err` is flattened by {@link serialiseError} and moved out of the attributes.
 */
function debug(msg: string, fields?: Record<string, unknown> & { err?: unknown }): void {
  emit('debug', msg, fields);
}

/**
 * Emit an info record.
 *
 * @param msg - The message body.
 * @param fields - Structured fields, passed through verbatim.
 */
function info(msg: string, fields?: Record<string, unknown> & { err?: unknown }): void {
  emit('info', msg, fields);
}

/**
 * Emit a warning record.
 *
 * @param msg - The message body.
 * @param fields - Structured fields, passed through verbatim.
 */
function warn(msg: string, fields?: Record<string, unknown> & { err?: unknown }): void {
  emit('warn', msg, fields);
}

/**
 * Emit an error record.
 *
 * @param msg - The message body.
 * @param fields - Structured fields, passed through verbatim. Pass the caught value as `err` to keep its stack.
 */
function error(msg: string, fields?: Record<string, unknown> & { err?: unknown }): void {
  emit('error', msg, fields);
}

/**
 * The structured logger.
 *
 * Emits nothing until {@link configureLogger} raises the level above `'silent'`.
 * Records are pino/OpenTelemetry-conformant in shape but the package depends on neither library.
 */
export const log = { debug, info, warn, error };
