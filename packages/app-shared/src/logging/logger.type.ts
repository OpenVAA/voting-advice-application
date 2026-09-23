/**
 * The four emittable log levels, named as pino names them.
 * `'silent'` is not a level a record can carry; it is only a {@link LoggerConfig} threshold that drops everything.
 */
export type LogLevel = 'debug' | 'info' | 'warn' | 'error';

/**
 * A single structured log record.
 *
 * The field set is deliberately pino/OTel-conformant without depending on either library: `level`, `time` and `msg` are pino's wire fields, and `severityText` is the OpenTelemetry log-data-model name for the same level.
 * `err` is a plain object rather than an `Error` because `JSON.stringify(new Error('x'))` is `{}`, which would silently discard every stack trace the moment a record is serialised.
 */
export type LogRecord = {
  /** The pino numeric level: 20 debug, 30 info, 40 warn, 50 error. */
  level: 20 | 30 | 40 | 50;
  /** Epoch milliseconds, as `Date.now()` returns them. */
  time: number;
  /** The message body. */
  msg: string;
  /** The OpenTelemetry severity name for {@link LogRecord.level}. */
  severityText: 'DEBUG' | 'INFO' | 'WARN' | 'ERROR';
  /** A flattened error, present only when the caller passed one. */
  err?: {
    type: string;
    message: string;
    stack?: string;
  };
  /** Caller-supplied structured fields, passed through verbatim. */
  attributes?: Record<string, unknown>;
};

/**
 * The logger's module-scope configuration, set by `configureLogger`.
 *
 * Nothing is read from the environment: `@openvaa/app-shared` is consumed by browser, SSR and plain-Node workspaces, and no single environment-variable mechanism exists in all three. The Vite compile-time constants and the SvelteKit virtual env modules are both unavailable here.
 * Enablement is therefore injected by the consumer, and the default is `'silent'` so that adding this package to a workspace is behaviour-neutral by construction.
 */
export type LoggerConfig = {
  /** The minimum level to emit, or `'silent'` to emit nothing. */
  level: LogLevel | 'silent';
  /** Where records go. Defaults to the console when unset. */
  sink?: (record: LogRecord) => void;
};
