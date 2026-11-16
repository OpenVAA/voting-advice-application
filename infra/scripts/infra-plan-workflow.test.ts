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

  it('is red on no-expression-in-run when the expression holds a brace', () => {
    const mutated = mutate(
      text,
      'run: terraform fmt -check -recursive -diff infra',
      "run: echo ${{ format('{0}', github.head_ref) }}"
    );
    const violations = sharedViolations(parseWorkflow(mutated), mutated);
    expect(violations.some((violation) => violation.startsWith('no-expression-in-run: '))).toBe(true);
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

describe('the plan job of infra-plan.yml', () => {
  const plan = job('plan');
  const steps = jobSteps(plan);

  /** The first step of the plan job whose `run:` contains `fragment`. */
  function stepRunning(fragment: string): (typeof steps)[number] {
    const step = steps.find((candidate) => typeof candidate.run === 'string' && candidate.run.includes(fragment));
    if (!step) throw new Error(`the plan job has no step running ${fragment}`);
    return step;
  }

  it('runs only for a pull request whose head is this repository', () => {
    expect(plan.if).toContain("github.event_name == 'pull_request'");
    expect(plan.if).toContain('github.event.pull_request.head.repo.full_name == github.repository');
  });

  it('holds exactly contents: read and id-token: write', () => {
    expect(plan.permissions).toEqual({ contents: 'read', 'id-token': 'write' });
  });

  it('assumes the plan role from the repository variable, in the staging account only', () => {
    const assume = steps.find(
      (step) => typeof step.uses === 'string' && step.uses.startsWith('aws-actions/configure-aws-credentials@')
    );
    expect(assume?.with).toMatchObject({
      'role-to-assume': '${{ vars.AWS_PLAN_ROLE_ARN }}',
      'aws-region': 'eu-north-1',
      'role-session-name': 'pr-plan-${{ github.run_id }}',
      'allowed-account-ids': '471112560111'
    });
  });

  it('passes the running digest to a lock-free plan whose file stays in $RUNNER_TEMP', () => {
    const digest = steps.find((step) => step.id === 'digest');
    expect(String(digest?.run)).toContain(
      'infra/scripts/running-image-digest.sh --cluster openvaa-staging --service openvaa-staging-frontend'
    );
    expect(String(digest?.run)).toContain('>> "$GITHUB_OUTPUT"');

    const planStep = stepRunning('terraform -chdir=infra/envs/staging/aws plan ');
    const script = String(planStep.run);
    expect(script).toContain('-chdir=infra/envs/staging/aws');
    expect(script).toContain('-lock=false');
    expect(script).toContain('-var "image_digest=$DIGEST"');
    expect(script).toContain('-out="$RUNNER_TEMP/tfplan"');
    expect(script).toContain('echo "plan_exit=$plan_exit"');
    expect(planStep.env).toEqual({
      DIGEST: '${{ steps.digest.outputs.digest }}',
      TF_VAR_alert_email: '${{ secrets.ALERT_EMAIL }}'
    });
  });

  it('prints the plan with terraform show -no-color to the log and the step summary', () => {
    const show = stepRunning('show -no-color');
    expect(String(show.run)).toContain('cat "$RUNNER_TEMP/tfplan.txt"');
    expect(String(show.run)).toContain('>> "$GITHUB_STEP_SUMMARY"');
    expect(steps.indexOf(show)).toBeGreaterThan(
      steps.indexOf(stepRunning('terraform -chdir=infra/envs/staging/aws plan '))
    );
  });

  it('removes the plan file in a final step that always runs', () => {
    const last = steps[steps.length - 1];
    expect(last.if).toBe('always()');
    expect(String(last.run)).toContain('rm -f "$RUNNER_TEMP/tfplan"');
  });
});

describe('the wrong-subject job of infra-plan.yml', () => {
  const wrongSubject = job('wrong-subject');
  const steps = jobSteps(wrongSubject);
  const script = runScripts(wrongSubject);

  it('runs only on a push, names no environment and checks nothing out', () => {
    expect(wrongSubject.if).toBe("github.event_name == 'push'");
    expect('environment' in wrongSubject).toBe(false);
    expect(steps.some((step) => typeof step.uses === 'string')).toBe(false);
  });

  it('holds exactly id-token: write', () => {
    expect(wrongSubject.permissions).toEqual({ 'id-token': 'write' });
  });

  it('names the deploy role and reads the plan role from the repository variable through env', () => {
    expect(steps).toHaveLength(1);
    expect(steps[0].env).toEqual({
      DEPLOY_ROLE_ARN: 'arn:aws:iam::471112560111:role/openvaa/openvaa-staging-deploy',
      PLAN_ROLE_ARN: '${{ vars.AWS_PLAN_ROLE_ARN }}'
    });
  });

  it('asks STS for both roles with the push token and prints the subject and each refusal', () => {
    expect(script).toContain('audience=sts.amazonaws.com');
    expect(script).toContain('::add-mask::');
    expect(script.match(/aws sts assume-role-with-web-identity/g)).toHaveLength(2);
    expect(script).toContain('--role-arn "$DEPLOY_ROLE_ARN"');
    expect(script).toContain('--role-arn "$PLAN_ROLE_ARN"');
    for (const line of [
      'token_subject=',
      'deploy_role_assume_status=',
      'deploy_role_error=',
      'plan_role_assume_status=',
      'plan_role_error='
    ]) {
      expect(script).toContain(`echo "${line}`);
    }
  });

  it('keeps the token in $RUNNER_TEMP and removes it', () => {
    expect(script).toContain('token_file="$RUNNER_TEMP/oidc-token"');
    expect(script).toContain('trap cleanup EXIT');
    expect(script).not.toMatch(/echo "\$token|printf '%s' "\$token/);
  });

  it('passes only when both roles refuse with AccessDenied, the code of a trust that does not match', () => {
    expect(script).toContain(
      'if [ "$deploy_status" -ne 0 ] && [ "$plan_status" -ne 0 ] && [ "$deploy_code" = AccessDenied ] && [ "$plan_code" = AccessDenied ]; then'
    );
  });
});
