/**
 * The rules every infrastructure workflow under `.github/workflows/` obeys, as a list of violations.
 *
 * A workflow of this repository runs in public: its log is readable by anyone, a pull request's run takes its
 * workflow file from the pull request, and the default token of the repository may write. The rules below keep a
 * credential, a plan or an attacker's text out of reach of that surface. They are checked by unit tests rather than by a
 * workflow's first run, because a first run is a public push and a mistake in it cannot be taken back.
 *
 * Each violation is one string, `<rule>: <where and what>`, the rule being one of {@link SHARED_RULES}. A structural
 * rule reads the parsed document; a text rule reads the file line by line, so that it also sees comments.
 */

import { readFileSync } from 'node:fs';
import { load } from 'js-yaml';

/** The identifiers of the shared rules, in the order {@link sharedViolations} checks them. */
export const SHARED_RULES = [
  'top-level-permissions-empty',
  'job-permissions-explicit',
  'action-pinned-by-sha',
  'action-tag-comment',
  'no-pull-request-target',
  'no-artifact-upload',
  'no-privileged-key-name',
  'no-expression-in-run',
  'id-token-only-where-assumed',
  'checkout-no-persisted-credentials',
  'runner-label',
  'plan-file-in-runner-temp'
] as const;

/** One of the shared rules. */
export type SharedRule = (typeof SHARED_RULES)[number];

/** A parsed workflow: the YAML document as plain values. */
export type WorkflowDocument = Record<string, unknown>;

/** One step of a job, as parsed. */
export type WorkflowStep = Record<string, unknown>;

/** One job of a workflow, as parsed. */
export type WorkflowJob = Record<string, unknown>;

/** A workflow read from disk: the parsed document and the text it was parsed from. */
export type LoadedWorkflow = {
  doc: WorkflowDocument;
  text: string;
};

/** The runner labels a job may name. `ubuntu-latest` moves to a new release without notice, so it is not one. */
export const RUNNER_LABELS = ['ubuntu-24.04', 'ubuntu-24.04-arm'] as const;

/** The action that assumes an AWS role through OIDC. */
const ASSUME_ACTION = 'aws-actions/configure-aws-credentials';
/** The variable a script reads to request an OIDC token itself. */
const TOKEN_REQUEST_VARIABLE = 'ACTIONS_ID_TOKEN_REQUEST_URL';
/** A full-length commit SHA after the `@` of a `uses:` reference. */
const COMMIT_SHA = /^[0-9a-f]{40}$/;
/** A `uses:` line whose reference is followed by a version tag comment, such as `# v7` or `# v6.3.0`. */
const USES_WITH_TAG_COMMENT = /^\s*(?:-\s+)?uses:\s*\S+\s+#\s*v\d[\w.-]*\s*$/;
/** Any `uses:` line. */
const USES_LINE = /^\s*(?:-\s+)?uses:\s*(\S+)/;
/** The names of a key that bypasses row-level security or signs as the project, in any of their usual spellings. */
const PRIVILEGED_KEY_NAME = /service[\s_-]?role|secret[\s_-]?key/i;
/** The opener of a workflow expression. An expression may hold braces of its own, so its end is not searched for. */
const EXPRESSION_OPENER = /\$\{\{/;
/** A Terraform `-out` flag and its value. */
const OUT_FLAG = /(?:^|\s)-out(?:=|\s+)(\S+)/g;
/** The accepted beginnings of a plan file path. */
const RUNNER_TEMP_PREFIXES = ['$RUNNER_TEMP/', '"$RUNNER_TEMP/', '${RUNNER_TEMP}/', '"${RUNNER_TEMP}/'];

/**
 * Read and parse a workflow file.
 *
 * @param path - Absolute path of the workflow file.
 * @returns The parsed document and the file's text.
 */
export function loadWorkflow(path: string): LoadedWorkflow {
  const text = readFileSync(path, 'utf8');
  return { doc: parseWorkflow(text), text };
}

/**
 * Parse a workflow's text.
 *
 * @param text - The YAML text of a workflow.
 * @returns The parsed document.
 * @throws When the text does not parse to a mapping.
 */
export function parseWorkflow(text: string): WorkflowDocument {
  const doc = load(text);
  if (!isRecord(doc)) throw new Error('the workflow does not parse to a mapping');
  return doc;
}

/**
 * The jobs of a workflow, by id.
 *
 * @param doc - A parsed workflow.
 * @returns Each job id with its parsed job; an empty list when the workflow has no `jobs` mapping.
 */
export function workflowJobs(doc: WorkflowDocument): Array<[string, WorkflowJob]> {
  const jobs = doc.jobs;
  if (!isRecord(jobs)) return [];
  return Object.entries(jobs).flatMap(([id, job]) => (isRecord(job) ? [[id, job] as [string, WorkflowJob]] : []));
}

/**
 * The steps of a job.
 *
 * @param job - A parsed job.
 * @returns Its steps, in order; an empty list when it has none.
 */
export function jobSteps(job: WorkflowJob): Array<WorkflowStep> {
  return Array.isArray(job.steps) ? job.steps.filter(isRecord) : [];
}

/**
 * The event names a workflow triggers on, whichever of the string, list or mapping forms its `on` key takes.
 *
 * @param doc - A parsed workflow.
 * @returns The event names.
 */
export function triggerEvents(doc: WorkflowDocument): Array<string> {
  const on = doc.on;
  if (typeof on === 'string') return [on];
  if (Array.isArray(on)) return on.filter((event): event is string => typeof event === 'string');
  if (isRecord(on)) return Object.keys(on);
  return [];
}

/**
 * Every violation of the shared rules in one workflow.
 *
 * The rules: the top-level `permissions` is an empty mapping; every job sets its own `permissions`; every action is
 * pinned by a full commit SHA, and its `uses:` line carries the tag in a comment; no trigger is `pull_request_target`;
 * no step uploads an artifact; the text names no service-role or secret key; no `run:` script holds a workflow
 * expression, so secrets and event text reach scripts through `env`; `id-token: write` is granted only to a job that
 * assumes a role, with the credentials action or a script reading the token request URL; every checkout sets
 * `persist-credentials: false`; every job runs on one of {@link RUNNER_LABELS}; and every Terraform `-out=` writes
 * under `$RUNNER_TEMP`.
 *
 * @param doc - The parsed workflow.
 * @param text - The text the workflow was parsed from.
 * @returns One string per violation, each starting with the broken rule's identifier; an empty list when the workflow
 *   obeys every rule.
 */
export function sharedViolations(doc: WorkflowDocument, text: string): Array<string> {
  const violations: Array<string> = [];
  function report(rule: SharedRule, message: string): void {
    violations.push(`${rule}: ${message}`);
  }
  const lines = text.split('\n');

  if (!isRecord(doc.permissions) || Object.keys(doc.permissions).length > 0) {
    report('top-level-permissions-empty', 'the top-level permissions must be {}');
  }

  for (const [id, job] of workflowJobs(doc)) {
    const steps = jobSteps(job);

    if (!('permissions' in job)) report('job-permissions-explicit', `job ${id} sets no permissions`);

    const references = [
      ...(typeof job.uses === 'string' ? [{ where: `job ${id}`, uses: job.uses }] : []),
      ...steps.flatMap((step, index) =>
        typeof step.uses === 'string' ? [{ where: `job ${id} step ${stepName(step, index)}`, uses: step.uses }] : []
      )
    ];
    for (const { where, uses } of references) {
      if (isRemoteReference(uses) && !COMMIT_SHA.test(uses.slice(uses.lastIndexOf('@') + 1))) {
        report('action-pinned-by-sha', `${where} uses ${uses}, not a full commit SHA`);
      }
      if (/upload-artifact/.test(uses)) report('no-artifact-upload', `${where} uploads an artifact with ${uses}`);
    }

    for (const [index, step] of steps.entries()) {
      const run = typeof step.run === 'string' ? step.run : '';
      const opener = EXPRESSION_OPENER.exec(run);
      if (opener) {
        report(
          'no-expression-in-run',
          `job ${id} step ${stepName(step, index)} holds ${run.slice(opener.index, opener.index + 60)} in its run script; pass it through env`
        );
      }
      if (typeof step.uses === 'string' && step.uses.startsWith('actions/checkout@')) {
        const inputs = isRecord(step.with) ? step.with : {};
        if (inputs['persist-credentials'] !== false) {
          report(
            'checkout-no-persisted-credentials',
            `job ${id} step ${stepName(step, index)} checks out without persist-credentials: false`
          );
        }
      }
    }

    const permissions = isRecord(job.permissions) ? job.permissions : {};
    if (permissions['id-token'] === 'write' && !steps.some(assumesRole)) {
      report('id-token-only-where-assumed', `job ${id} grants id-token: write and assumes no role`);
    }

    if (!(typeof job.uses === 'string' && !('runs-on' in job))) {
      const label = job['runs-on'];
      if (typeof label !== 'string' || !(RUNNER_LABELS as ReadonlyArray<string>).includes(label)) {
        report('runner-label', `job ${id} runs on ${JSON.stringify(label)}, not ${RUNNER_LABELS.join(' or ')}`);
      }
    }
  }

  if (triggerEvents(doc).includes('pull_request_target')) {
    report('no-pull-request-target', 'the workflow triggers on pull_request_target');
  }

  for (const [index, line] of lines.entries()) {
    const lineNumber = index + 1;
    const uses = USES_LINE.exec(line);
    if (uses && isRemoteReference(uses[1]) && !USES_WITH_TAG_COMMENT.test(line)) {
      report('action-tag-comment', `line ${lineNumber} uses ${uses[1]} without a tag comment`);
    }
    if (PRIVILEGED_KEY_NAME.test(line)) {
      report('no-privileged-key-name', `line ${lineNumber} names ${PRIVILEGED_KEY_NAME.exec(line)?.[0]}`);
    }
    for (const [, value] of line.matchAll(OUT_FLAG)) {
      if (!RUNNER_TEMP_PREFIXES.some((prefix) => value.startsWith(prefix))) {
        report('plan-file-in-runner-temp', `line ${lineNumber} writes a plan to ${value}, outside $RUNNER_TEMP`);
      }
    }
  }

  return violations;
}

/** Whether a step assumes a role: the credentials action, or a script that requests an OIDC token itself. */
function assumesRole(step: WorkflowStep): boolean {
  if (typeof step.uses === 'string' && step.uses.startsWith(`${ASSUME_ACTION}@`)) return true;
  return typeof step.run === 'string' && step.run.includes(TOKEN_REQUEST_VARIABLE);
}

/** Whether a `uses:` reference names a repository action or workflow, rather than a local path or a container. */
function isRemoteReference(uses: string): boolean {
  return !uses.startsWith('./') && !uses.startsWith('docker://') && uses.includes('@');
}

/** A step's name, or its one-based position when it has none. */
function stepName(step: WorkflowStep, index: number): string {
  return typeof step.name === 'string' ? JSON.stringify(step.name) : `#${index + 1}`;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}
