import type { LogLevel } from '@openvaa/app-shared';

/**
 * The levels a record can be emitted at, and so the only values `PUBLIC_LOG_LEVEL` accepts. `'silent'` is a logger threshold rather than an emittable level, so it is reported as `invalid` instead of silencing the logs.
 */
export const EMITTABLE: ReadonlyArray<LogLevel> = ['debug', 'info', 'warn', 'error'];

/**
 * Why the raw `PUBLIC_LOG_LEVEL` value could not be used. A missing and an invalid value are reported separately, so a deployer who forgot the variable and one who mistyped it are told different things.
 */
export type LogLevelProblem = {
  /** `missing` when nothing was set, `invalid` when the value is not an emittable level. */
  reason: 'missing' | 'invalid';
  /** The normalised value, present only for `invalid`. */
  provided?: string;
};

/** What {@link resolveLogLevel} returns: the level to configure, and the problem that forced a fallback, if any. */
export type ResolvedLogLevel = {
  /** The level to hand to `configureLogger`: always an emittable level, never `'silent'`. */
  level: LogLevel;
  /** Absent when the raw value was a valid level. */
  problem?: LogLevelProblem;
};

/**
 * Resolve `PUBLIC_LOG_LEVEL` to one of the four emittable levels, falling back to `'debug'` in development or with `PUBLIC_DEBUG`, and to `'warn'` otherwise. It never throws, for any input.
 *
 * It emits nothing. The caller configures the logger with the returned level first and reports the problem second, because the logger drops records while its threshold is still `'silent'`.
 *
 * @param raw - The raw environment value, as `constants.PUBLIC_LOG_LEVEL` passes it through.
 * @param dev - Whether this is a development build, i.e. `import.meta.env.DEV`.
 * @param publicDebug - The `constants.PUBLIC_DEBUG` flag.
 * @returns The level to configure, and the problem that forced a fallback when there was one.
 */
export function resolveLogLevel(raw: string | undefined, dev: boolean, publicDebug: boolean): ResolvedLogLevel {
  const fallback: LogLevel = dev || publicDebug ? 'debug' : 'warn';

  // `typeof`, not a nullish check: the value comes from the process environment, and a non-string reaching `.trim()` would throw at module scope. A whitespace-only value counts as unset.
  if (typeof raw !== 'string' || raw.trim() === '') return { level: fallback, problem: { reason: 'missing' } };

  // Normalise first, so `' WARN '` is a valid level; an invalid value is reported in its normalised form.
  const normalised = raw.trim().toLowerCase();
  if (isEmittable(normalised)) return { level: normalised };

  return { level: fallback, problem: { reason: 'invalid', provided: normalised } };
}

/**
 * Narrow a normalised string to a {@link LogLevel}. A predicate over {@link EMITTABLE}, rather than a cast, keeps the vocabulary and the type one declaration.
 *
 * @param value - A normalised candidate level.
 * @returns Whether the value is one of the four emittable levels.
 */
function isEmittable(value: string): value is LogLevel {
  return EMITTABLE.some((level) => level === value);
}
