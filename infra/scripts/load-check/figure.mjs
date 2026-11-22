#!/usr/bin/env node

/**
 * The capacity figure of one load-check run, read from the summary `voter-journey.js` writes.
 *
 * Usage: node infra/scripts/load-check/figure.mjs <summary.json>
 *
 * It prints one line per step:
 *
 *   ```text
 *   step=<i> rate_per_min=<r> page_p95_ms=<x> relay_p95_ms=<y> error_rate=<e> dropped=<n> met=yes|no
 *   ```
 *
 * and then the figure, in journeys per minute: the arrival rate of the highest step that met every threshold with every step below it, so the first step that did not meet them ends the figure:
 *
 *   ```text
 *   figure_journeys_per_minute=<r, or 0 when no step met>
 *   figure_step=<i, or none>
 *   ```
 *
 * A step meets the thresholds when its page p95 is under 1000 ms, its relay p95 under 300 ms, its error rate under 1 % and it dropped no iteration. A dropped iteration is a journey the arrival rate called for that k6 did not start, because every virtual user was busy: it fails no request, so without this count a step short of users would pass at a lower real rate than its label. A p95 or error rate the summary does not hold, as for a step the run was aborted before, prints as `none` and the step is not met; an absent dropped count counts as none dropped. The values are read from the per-step sub-metrics the script defines thresholds on:
 *
 *   ```js
 *   metrics["http_req_duration{kind:page,step:<i>}"].values["p(95)"]
 *   metrics["http_req_duration{kind:relay,step:<i>}"].values["p(95)"]
 *   metrics["http_req_failed{step:<i>}"].values.rate
 *   metrics["dropped_iterations{scenario:step_<i>}"].values.count
 *   ```
 *
 * and the step rates from `load_check.steps`, which must rise strictly.
 *
 * Exit codes: 0 when the lines were printed; 1 when the summary is unreadable, holds no step or holds steps that do not rise strictly; 2 on a usage error.
 */

import { readFileSync } from 'node:fs';
import { pathToFileURL } from 'node:url';

/** The page p95, in milliseconds, a step must stay under. */
export const PAGE_P95_MS = 1000;
/** The relay p95, in milliseconds, a step must stay under. */
export const RELAY_P95_MS = 300;
/** The error rate a step must stay under. */
export const STEP_ERROR_RATE = 0.01;

/**
 * A number of a metric's values, or `undefined` when the summary does not hold it.
 *
 * @param {Record<string, unknown>} metrics - The summary's `metrics`.
 * @param {string} name - The metric name with its tag set.
 * @param {string} field - The member of `values`.
 * @returns {number | undefined}
 */
function valueOf(metrics, name, field) {
  const value = metrics?.[name]?.values?.[field];
  return typeof value === 'number' && Number.isFinite(value) ? value : undefined;
}

/**
 * The per-step results and the figure of one summary.
 *
 * @param {{ metrics?: Record<string, unknown>, load_check?: { steps?: Array<number> } }} summary - The parsed summary.
 * @returns {{ steps: Array<{ step: number, rate: number, pageP95?: number, relayP95?: number, errorRate?: number, dropped: number, met: boolean }>, figure: number, figureStep: number | undefined }}
 */
export function computeFigure(summary) {
  const rates = summary?.load_check?.steps;
  if (!Array.isArray(rates) || rates.length === 0) throw new Error('the summary holds no load_check.steps');
  rates.forEach((rate, index) => {
    if (typeof rate !== 'number' || !Number.isFinite(rate) || rate <= 0)
      throw new Error(`load_check.steps holds ${String(rate)}, not a positive rate`);
    if (index > 0 && rate <= rates[index - 1]) throw new Error('load_check.steps do not rise strictly');
  });
  const metrics = summary.metrics ?? {};
  const steps = rates.map((rate, index) => {
    const step = index + 1;
    const pageP95 = valueOf(metrics, `http_req_duration{kind:page,step:${step}}`, 'p(95)');
    const relayP95 = valueOf(metrics, `http_req_duration{kind:relay,step:${step}}`, 'p(95)');
    const errorRate = valueOf(metrics, `http_req_failed{step:${step}}`, 'rate');
    const dropped = valueOf(metrics, `dropped_iterations{scenario:step_${step}}`, 'count') ?? 0;
    const met =
      pageP95 !== undefined &&
      relayP95 !== undefined &&
      errorRate !== undefined &&
      pageP95 < PAGE_P95_MS &&
      relayP95 < RELAY_P95_MS &&
      errorRate < STEP_ERROR_RATE &&
      dropped === 0;
    return { step, rate, pageP95, relayP95, errorRate, dropped, met };
  });
  const firstUnmet = steps.findIndex((entry) => !entry.met);
  const highest = (firstUnmet === -1 ? steps : steps.slice(0, firstUnmet)).at(-1);
  return { steps, figure: highest?.rate ?? 0, figureStep: highest?.step };
}

function show(value, digits) {
  return value === undefined ? 'none' : value.toFixed(digits);
}

/**
 * The lines the figure is recorded with.
 *
 * @param {ReturnType<typeof computeFigure>} result
 * @returns {Array<string>}
 */
export function figureLines(result) {
  const lines = result.steps.map(
    (entry) =>
      `step=${entry.step} rate_per_min=${entry.rate} page_p95_ms=${show(entry.pageP95, 1)} ` +
      `relay_p95_ms=${show(entry.relayP95, 1)} error_rate=${show(entry.errorRate, 4)} dropped=${entry.dropped} ` +
      `met=${entry.met ? 'yes' : 'no'}`
  );
  lines.push(`figure_journeys_per_minute=${result.figure}`);
  lines.push(`figure_step=${result.figureStep ?? 'none'}`);
  return lines;
}

function main(args) {
  if (args.length !== 1) {
    process.stderr.write('usage: figure.mjs <summary.json>\n');
    process.exit(2);
  }
  let result;
  try {
    result = computeFigure(JSON.parse(readFileSync(args[0], 'utf8')));
  } catch (error) {
    process.stderr.write(`figure.mjs: ${error instanceof Error ? error.message : 'the summary is unreadable'}\n`);
    process.exit(1);
  }
  process.stdout.write(`${figureLines(result).join('\n')}\n`);
}

if (process.argv[1] !== undefined && import.meta.url === pathToFileURL(process.argv[1]).href)
  main(process.argv.slice(2));
