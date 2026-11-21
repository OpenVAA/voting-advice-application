/**
 * The analytics configuration of this server process, resolved once from the private environment. This is the only analytics module that reads the environment; everything else takes these values from here, and the problems are reported by whoever configures the logger.
 */

import { env } from '$env/dynamic/private';
import { resolveAnalyticsConfig, toProjection } from './config';
import type { AnalyticsProjection } from '$lib/analytics/modes';
import type { AnalyticsConfig, AnalyticsConfigProblem } from './config';

const resolved = resolveAnalyticsConfig(env);

/** The resolved configuration. Provider `none` whenever any variable has a problem. */
export const analyticsConfig: AnalyticsConfig = resolved.config;

/** The problems found while resolving, by variable name. Never logged here. */
export const analyticsConfigProblems: ReadonlyArray<AnalyticsConfigProblem> = resolved.problems;

/** The part of the configuration the browser may learn. */
export const analyticsProjection: AnalyticsProjection = toProjection(resolved.config);
