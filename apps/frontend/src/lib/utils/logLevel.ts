import type { LogLevel } from '@openvaa/app-shared';

/**
 * The levels a record can actually be emitted at, and therefore the only values `PUBLIC_LOG_LEVEL` accepts.
 *
 * `'silent'` is deliberately NOT a member. It is a `LoggerConfig` threshold rather than a level a record can carry (`packages/app-shared/src/logging/logger.type.ts:3`), and honouring it here would let one environment variable reintroduce — with no signal at all — the exact production silence this phase exists to close, which is the same class of defect as the one being retired. It is therefore reported as `invalid`, which is loud, rather than accepted, which would be quiet (decision **D-DISC-1**, recorded in `157.1-02-PLAN.md`; `157.1-RESEARCH.md` § "The `PUBLIC_LOG_LEVEL` resolver, and how C3's error is made visible", point 1 — research titles that section with the pre-amendment name).
 */
export const EMITTABLE: ReadonlyArray<LogLevel> = ['debug', 'info', 'warn', 'error'];

/**
 * Why the raw `PUBLIC_LOG_LEVEL` value could not be used.
 *
 * The two reasons stay separate on purpose. Decision **C3**'s NOTE requires that an absent value and an out-of-vocabulary value each produce their own `error` record, so a deployer who forgot the variable and a deployer who typo'd it are told different things. That is also why `constants.PUBLIC_LOG_LEVEL` is a raw passthrough rather than a coercion: `PUBLIC_DEBUG`'s `?.toLowerCase() === 'true'` shape maps both cases onto the same `false` and destroys the distinction before this module ever sees it.
 */
export type LogLevelProblem = {
  /** `missing` when nothing was set at all, `invalid` when something was set but is not an emittable level. */
  reason: 'missing' | 'invalid';
  /** The normalised value that was supplied. Present only for `invalid`, because an unset variable has no value to name. */
  provided?: string;
};

/** What {@link resolveLogLevel} returns: a level that is always usable, plus the problem that forced a fallback, when there was one. */
export type ResolvedLogLevel = {
  /** The level to hand to `configureLogger`. Always an emittable level; never `'silent'`. */
  level: LogLevel;
  /** Absent when the raw value was a valid level. Present — and worth one `error` record — otherwise. */
  problem?: LogLevelProblem;
};

/**
 * Resolve `PUBLIC_LOG_LEVEL` into a level the shared logger can be configured with, reporting separately whether the raw value was missing or unusable.
 *
 * This lives in the frontend rather than in `@openvaa/app-shared` because that package must not read the environment: it is consumed by browser, SSR and plain-Node workspaces and no single environment mechanism exists in all three (`logger.type.ts:32-37`). Enablement is injected by the consumer, so the consumer is where the environment is read.
 *
 * The function is pure and emits nothing. The caller configures the level first and emits the record about the fallback second, because the shared logger early-returns while the threshold is still `'silent'` (`logger.ts:67`) — reverse the two and the message about silence is itself silent (decision **C3** NOTE, pitfall **P3**). Splitting the resolution from the emission is what makes that ordering assertable without a running server.
 *
 * It never throws, for any input. Decision **C3**'s NOTE is explicit that a bad value must not prevent the app booting, and both entry points call this at module scope — a throw here would take the SSR process down at server start rather than degrade the logging (threat `T-157.1-04`). Fail loudly, do not fail closed.
 *
 * `dev` and `publicDebug` are retained as the *fallback* rather than overridden (decision **D-DISC-2**, recorded in `157.1-02-PLAN.md`): an explicit `PUBLIC_LOG_LEVEL` wins, and a developer who never sets it keeps `'debug'`. The only behaviour change for someone who never sets the variable is that production moves from `'silent'` to `'warn'`, which is the point of ruling **D9**.
 *
 * @param raw - The raw environment value, as `constants.PUBLIC_LOG_LEVEL` passes it through. Typed `string | undefined`, but handled defensively because the callers run at module scope.
 * @param dev - Whether this is a development build, i.e. `import.meta.env.DEV`.
 * @param publicDebug - The existing `constants.PUBLIC_DEBUG` flag.
 * @returns The level to configure, and the problem that forced a fallback when there was one.
 */
export function resolveLogLevel(raw: string | undefined, dev: boolean, publicDebug: boolean): ResolvedLogLevel {
  const fallback: LogLevel = dev || publicDebug ? 'debug' : 'warn';

  // `typeof` rather than a bare nullish check, because this is called at module scope in both entry points from a value that ultimately comes from the process environment: a non-string reaching `.trim()` would raise a `TypeError` at server start, which is precisely the fail-closed outcome C3's NOTE forbids. A whitespace-only value is treated as unset for the same reason `''` is — there is no value there to report back to the deployer.
  if (typeof raw !== 'string' || raw.trim() === '') return { level: fallback, problem: { reason: 'missing' } };

  // Normalise before the vocabulary check, not after, so `' WARN '` is a valid level rather than a typo report. Anything that survives normalisation and is still unrecognised is genuinely out of vocabulary, and the normalised form is what gets named in the record — reporting the raw form would put unbounded deployer input into a log message.
  const normalised = raw.trim().toLowerCase();
  if (isEmittable(normalised)) return { level: normalised };

  return { level: fallback, problem: { reason: 'invalid', provided: normalised } };
}

/**
 * Narrow an already-normalised string to a {@link LogLevel}.
 *
 * Written as a predicate over {@link EMITTABLE} rather than as a cast so the accepted vocabulary and the type stay one declaration: adding a level to the array is the only edit required, and a cast could not be checked against it.
 *
 * @param value - A normalised candidate level.
 * @returns Whether the value is one of the four emittable levels.
 */
function isEmittable(value: string): value is LogLevel {
  return EMITTABLE.some((level) => level === value);
}
