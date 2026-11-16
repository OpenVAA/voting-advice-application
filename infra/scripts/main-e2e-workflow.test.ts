/**
 * The Edge Functions' environment of the `e2e-tests` job of `main.yaml`.
 *
 * The local edge runtime reads `apps/supabase/supabase/functions/.env` when the stack starts and does not inherit the
 * root env file, and a running edge runtime keeps the environment it booted with. Without the file, `account-access`
 * throws at request time on its first required variable and every mailed-link flow of the suite times out. Two rules
 * hold the job to that:
 *
 * - **env-before-start** — a step copies the tracked template `functions/.env.example` to `functions/.env` before the
 *   step that starts Supabase.
 * - **edge-log-on-failure** — a step guarded by `if: failure()` prints `docker logs` of the edge runtime container
 *   after the E2E run and before the stack is stopped, so that a failed run shows what the functions threw. The
 *   container is named after `project_id` of the stack's `config.toml`.
 *
 * Each rule is shown red on a mutated in-memory copy, so that its green result on the real file means something.
 */

import { readFileSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';
import { jobSteps, parseWorkflow, workflowJobs } from './workflowGuards';
import type { WorkflowStep } from './workflowGuards';

const HERE = dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = resolve(HERE, '../..');
const MAIN_YAML_TEXT = readFileSync(join(REPO_ROOT, '.github', 'workflows', 'main.yaml'), 'utf8');
const CONFIG_TOML_TEXT = readFileSync(join(REPO_ROOT, 'apps', 'supabase', 'supabase', 'config.toml'), 'utf8');

const JOB_ID = 'e2e-tests';
const ENV_STEP = "Configure the Edge Functions' environment";
const LOG_STEP = "Print the edge runtime's log";
const START_STEP = 'Start Supabase';
const RUN_STEP = 'Run E2E tests';
const STOP_STEP = 'Stop Supabase';
const COPY_COMMAND = 'cp apps/supabase/supabase/functions/.env.example apps/supabase/supabase/functions/.env';

/** The `project_id` of a `config.toml`, which names the stack's containers. */
function projectId(configToml: string): string {
  const match = /^project_id\s*=\s*"([^"]+)"\s*$/m.exec(configToml);
  if (!match) throw new Error('config.toml has no project_id');
  return match[1];
}

const EDGE_CONTAINER = `supabase_edge_runtime_${projectId(CONFIG_TOML_TEXT)}`;

/** The steps of the `e2e-tests` job of a workflow text. */
function e2eSteps(text: string): Array<WorkflowStep> {
  const job = workflowJobs(parseWorkflow(text)).find(([id]) => id === JOB_ID)?.[1];
  if (!job) throw new Error(`the workflow has no job ${JOB_ID}`);
  return jobSteps(job);
}

/** The index of the step of the given name, or -1. */
function stepIndex(steps: Array<WorkflowStep>, name: string): number {
  return steps.findIndex((step) => step.name === name);
}

/** The violations of the two rules in the steps of the job, as `<rule>: <what>` strings. */
function violations(steps: Array<WorkflowStep>): Array<string> {
  const found: Array<string> = [];
  const start = stepIndex(steps, START_STEP);
  const copy = steps.findIndex((step) => typeof step.run === 'string' && step.run.trim() === COPY_COMMAND);
  if (copy === -1) found.push('env-before-start: no step copies the functions template');
  else if (start === -1 || copy > start) found.push(`env-before-start: the copy is not before "${START_STEP}"`);
  const run = stepIndex(steps, RUN_STEP);
  const stop = stepIndex(steps, STOP_STEP);
  const dumps = steps
    .map((step, index) => ({ step, index }))
    .filter(
      ({ step }) =>
        typeof step.run === 'string' && /\bdocker logs\b/.test(step.run) && step.run.includes(EDGE_CONTAINER)
    );
  if (dumps.length === 0) found.push(`edge-log-on-failure: no step prints the log of ${EDGE_CONTAINER}`);
  for (const { step, index } of dumps) {
    if (step.if !== 'failure()') found.push('edge-log-on-failure: the log step is not guarded by if: failure()');
    if (run === -1 || stop === -1 || index < run || index > stop)
      found.push(`edge-log-on-failure: the log step is not between "${RUN_STEP}" and "${STOP_STEP}"`);
  }
  return found;
}

const STEPS = e2eSteps(MAIN_YAML_TEXT);

/** A copy of the job's steps, each step copied too, so that a mutation leaves the parsed real file as it is. */
function stepsCopy(): Array<WorkflowStep> {
  return STEPS.map((step) => ({ ...step }));
}

describe('main.yaml e2e-tests: the Edge Functions environment', () => {
  it('names the edge runtime container after the project id of config.toml', () => {
    expect(EDGE_CONTAINER).toBe('supabase_edge_runtime_openvaa-local');
  });

  it('finds no violation in the real file', () => {
    expect(violations(STEPS)).toEqual([]);
  });

  it('holds the copy directly before the stack starts and the log step directly after the run', () => {
    expect(stepIndex(STEPS, ENV_STEP)).toBe(stepIndex(STEPS, START_STEP) - 1);
    expect(stepIndex(STEPS, LOG_STEP)).toBe(stepIndex(STEPS, RUN_STEP) + 1);
  });

  it('is red on a copy where the copy step comes after the stack starts', () => {
    const steps = stepsCopy();
    const [copyStep] = steps.splice(stepIndex(steps, ENV_STEP), 1);
    steps.splice(stepIndex(steps, START_STEP) + 1, 0, copyStep);
    expect(violations(steps)).toEqual([`env-before-start: the copy is not before "${START_STEP}"`]);
  });

  it('is red on a copy where the log step has no if: failure()', () => {
    const steps = stepsCopy();
    const logStep = steps[stepIndex(steps, LOG_STEP)];
    expect(logStep.if).toBe('failure()');
    delete logStep.if;
    expect(violations(steps)).toEqual(['edge-log-on-failure: the log step is not guarded by if: failure()']);
  });
});
