/**
 * Guards on `.github/workflows/infra-plan.yml`, and the red cases of every shared workflow rule.
 *
 * The workflow is guarded by tests rather than by its first run: a run needs a push to this public repository, and a
 * workflow that leaked a credential, uploaded a plan or ran a fork's code with a token would have done so by the time
 * the run could be read. Each shared rule of `workflowGuards.ts` is first shown red on a copy of the real file with one
 * deliberate fault, so that its green result on the real file means something.
 */

import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';
import {
  jobSteps,
  loadWorkflow,
  parseWorkflow,
  SHARED_RULES,
  sharedViolations,
  triggerEvents,
  workflowJobs
} from './workflowGuards';
import type { SharedRule, WorkflowJob } from './workflowGuards';

const HERE = dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = resolve(HERE, '../..');
const WORKFLOW = join(REPO_ROOT, '.github', 'workflows', 'infra-plan.yml');

const { doc, text } = loadWorkflow(WORKFLOW);

/** A commit SHA of the right form, for a step that should break one rule only. */
const SOME_SHA = '0123456789abcdef0123456789abcdef01234567';

/** The job `id` of the workflow; fails the test when it is absent. */
function job(id: string): WorkflowJob {
  const found = workflowJobs(doc).find(([jobId]) => jobId === id);
  if (!found) throw new Error(`infra-plan.yml has no job ${id}`);
  return found[1];
}

/** The `run:` scripts of a job, joined. */
function runScripts(target: WorkflowJob): string {
  return jobSteps(target)
    .map((step) => (typeof step.run === 'string' ? step.run : ''))
    .join('\n');
}

/** `text` with the first match of `pattern` replaced; fails when nothing matched, so a mutation is never a no-op. */
function mutate(source: string, pattern: string | RegExp, replacement: string): string {
  const mutated = source.replace(pattern, replacement);
  if (mutated === source) throw new Error(`the mutation found nothing to replace: ${String(pattern)}`);
  return mutated;
}

/** The first step of the `checks` job, as it opens in the text; a step inserted before it lands in that job. */
const FIRST_CHECKS_STEP = '      - name: "Checkout source code"\n';

/** One mutated copy of the real workflow for each shared rule. */
const RED_COPIES: Array<{ rule: SharedRule; fault: string; copy: () => string }> = [
  {
    rule: 'top-level-permissions-empty',
    fault: 'the top-level permissions are missing',
    copy: () => mutate(text, /^permissions: \{\}\n/m, '')
  },
  {
    rule: 'job-permissions-explicit',
    fault: 'a job sets no permissions',
    copy: () => mutate(text, /^ {4}permissions:\n(?: {6}.*\n)+/m, '')
  },
  {
    rule: 'action-pinned-by-sha',
    fault: 'an action is pinned by tag',
    copy: () => mutate(text, 'actions/checkout@3d3c42e5aac5ba805825da76410c181273ba90b1', 'actions/checkout@v7')
  },
  {
    rule: 'action-tag-comment',
    fault: 'a uses: line has no tag comment',
    copy: () =>
      mutate(text, 'actions/checkout@3d3c42e5aac5ba805825da76410c181273ba90b1 # v7', `actions/checkout@${SOME_SHA}`)
  },
  {
    rule: 'no-pull-request-target',
    fault: 'the workflow triggers on pull_request_target',
    copy: () => mutate(text, /^ {2}pull_request:$/m, '  pull_request_target:')
  },
  {
    rule: 'no-artifact-upload',
    fault: 'a step uploads an artifact',
    copy: () =>
      mutate(
        text,
        FIRST_CHECKS_STEP,
        `      - name: "Upload"\n        uses: actions/upload-artifact@${SOME_SHA} # v6\n        with:\n          name: plan\n          path: plan\n\n${FIRST_CHECKS_STEP}`
      )
  },
  {
    rule: 'no-privileged-key-name',
    fault: 'the text names a service-role key',
    copy: () => `${text}# SUPABASE_SERVICE_ROLE_KEY\n`
  },
  {
    rule: 'no-expression-in-run',
    fault: 'a run script holds a secret expression',
    copy: () =>
      mutate(text, 'run: terraform fmt -check -recursive -diff infra', 'run: echo "${{ secrets.ALERT_EMAIL }}"')
  },
  {
    rule: 'id-token-only-where-assumed',
    fault: 'a job with no assume step grants id-token: write',
    copy: () => mutate(text, /^( {4}permissions:\n {6}contents: read\n)/m, '$1      id-token: write\n')
  },
  {
    rule: 'checkout-no-persisted-credentials',
    fault: 'a checkout persists its credentials',
    copy: () => mutate(text, 'persist-credentials: false', 'persist-credentials: true')
  },
  {
    rule: 'runner-label',
    fault: 'a job runs on ubuntu-latest',
    copy: () => mutate(text, 'runs-on: ubuntu-24.04', 'runs-on: ubuntu-latest')
  },
  {
    rule: 'plan-file-in-runner-temp',
    fault: 'a plan file is written outside $RUNNER_TEMP',
    copy: () =>
      mutate(
        text,
        'run: terraform fmt -check -recursive -diff infra',
        'run: terraform -chdir=infra/envs/staging/aws plan -out=tfplan'
      )
  }
];

describe('the shared workflow rules', () => {
  it('has one red copy per rule', () => {
    expect(RED_COPIES.map(({ rule }) => rule).sort()).toEqual([...SHARED_RULES].sort());
  });

  for (const { rule, fault, copy } of RED_COPIES) {
    it(`is red on ${rule} when ${fault}`, () => {
      const mutated = copy();
      const violations = sharedViolations(parseWorkflow(mutated), mutated);
      expect(violations.filter((violation) => violation.startsWith(`${rule}: `))).not.toEqual([]);
    });
  }

  it('is red on checkout-no-persisted-credentials when a checkout has no with block', () => {
    const mutated = mutate(
      text,
      /( {8}uses: actions\/checkout@\S+ # v7\n) {8}with:\n {10}persist-credentials: false\n/,
      '$1'
    );
    const violations = sharedViolations(parseWorkflow(mutated), mutated);
    expect(violations.some((violation) => violation.startsWith('checkout-no-persisted-credentials: '))).toBe(true);
  });

  it('finds no violation in infra-plan.yml', () => {
    expect(sharedViolations(doc, text)).toEqual([]);
  });
});

describe('infra-plan.yml', () => {
  it('runs on pull requests touching infra/ or the workflow, and on deploy-evidence pushes', () => {
    expect(triggerEvents(doc).sort()).toEqual(['pull_request', 'push']);
    const on = doc.on as Record<string, Record<string, unknown>>;
    expect(on.pull_request).toEqual({
      types: ['opened', 'synchronize', 'reopened', 'ready_for_review'],
      paths: ['infra/**', '.github/workflows/infra-plan.yml']
    });
    expect(on.push).toEqual({ branches: ['deploy-evidence/**'] });
  });

  it('grants the checks job no id-token', () => {
    expect(job('checks').permissions).toEqual({ contents: 'read' });
  });

  it('plans the three example roots and fails when one is not reached', () => {
    const step = jobSteps(job('checks')).find(
      (candidate) => typeof candidate.run === 'string' && candidate.run.includes('infra/envs/example/*/tests/')
    );
    expect(step, 'the checks job has no step looping over the example roots').toBeDefined();
    const script = String(step?.run);
    expect(script).toContain('terraform -chdir="$root" init -backend=false -input=false -lockfile=readonly');
    expect(script).toContain('terraform -chdir="$root" test -verbose -no-color');
    const required = /for required in \\\n((?:\s+\S+ \\\n)*\s+\S+); do/.exec(script)?.[1];
    expect(
      required
        ?.split(/\s*\\\n\s*|\s+/)
        .filter(Boolean)
        .sort()
    ).toEqual(['infra/envs/example/aws', 'infra/envs/example/dns-mail', 'infra/envs/example/supabase']);
    expect(script).toContain('::error::');
  });

  it('formats, validates every root and tests every module in the checks job', () => {
    const scripts = runScripts(job('checks'));
    expect(scripts).toContain('terraform fmt -check -recursive -diff infra');
    expect(scripts).toContain('for root in infra/bootstrap infra/envs/*/*/; do');
    expect(scripts).toContain('for tests in infra/modules/*/tests/; do');
  });

  it('prints no JSON plan', () => {
    expect(text).not.toMatch(/show\s+-json/);
  });
});
