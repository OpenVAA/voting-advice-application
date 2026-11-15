/**
 * Guards on `.github/workflows/deploy.yml`, the gated staging deploy.
 *
 * The workflow applies to the staging account and pushes migrations to the persistent Supabase project, and its log is
 * public, so its triggers, its gate, the order of its stages, where each secret reaches and its alert are checked here
 * rather than by its first run. The shared rules of `workflowGuards.ts` are shown red in
 * `infra-plan-workflow.test.ts`; the rules particular to this file are shown red below on mutated copies of its text.
 */

import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';
import { jobSteps, loadWorkflow, parseWorkflow, sharedViolations, workflowJobs } from './workflowGuards';
import type { WorkflowDocument, WorkflowJob, WorkflowStep } from './workflowGuards';

const HERE = dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = resolve(HERE, '../..');
const WORKFLOW = join(REPO_ROOT, '.github', 'workflows', 'deploy.yml');

const { doc, text } = loadWorkflow(WORKFLOW);

/** The ids of the gated job's stage steps, in the order they must run. */
const STAGE_ORDER = ['build', 'plan', 'apply', 'stable', 'smoke', 'served-build', 'alert'];

/** The job `id` of a workflow; fails the test when it is absent. */
function jobOf(source: WorkflowDocument, id: string): WorkflowJob {
  const found = workflowJobs(source).find(([jobId]) => jobId === id);
  if (!found) throw new Error(`deploy.yml has no job ${id}`);
  return found[1];
}

/** The steps of a job of a workflow. */
function stepsOf(source: WorkflowDocument, id: string): Array<WorkflowStep> {
  return jobSteps(jobOf(source, id));
}

/** The step with `id` in a list of steps; fails the test when it is absent. */
function stepWithId(steps: Array<WorkflowStep>, id: string): WorkflowStep {
  const step = steps.find((candidate) => candidate.id === id);
  if (!step) throw new Error(`the deploy job has no step with id ${id}`);
  return step;
}

/** The index of the first step that uses an action, or -1. */
function indexOfUses(steps: Array<WorkflowStep>, action: string): number {
  return steps.findIndex((step) => typeof step.uses === 'string' && step.uses.startsWith(`${action}@`));
}

/** The `run:` script of a step, or an empty string. */
function runOf(step: WorkflowStep): string {
  return typeof step.run === 'string' ? step.run : '';
}

/** The `env` mapping of a step, or an empty one. */
function envOf(step: WorkflowStep): Record<string, unknown> {
  return typeof step.env === 'object' && step.env !== null && !Array.isArray(step.env)
    ? (step.env as Record<string, unknown>)
    : {};
}

/** The positions of the stage step ids in a list of steps, in the order they appear. */
function stageIdsInOrder(steps: Array<WorkflowStep>, stages: Array<string>): Array<string> {
  return steps.flatMap((step) => (typeof step.id === 'string' && stages.includes(step.id) ? [step.id] : []));
}

/** `source` with the first match of `pattern` replaced; fails when nothing matched, so a mutation is never a no-op. */
function mutate(source: string, pattern: string | RegExp, replacement: string): string {
  const mutated = source.replace(pattern, replacement);
  if (mutated === source) throw new Error(`the mutation found nothing to replace: ${String(pattern)}`);
  return mutated;
}

describe('deploy.yml and the shared rules', () => {
  it('finds no violation of the shared rules', () => {
    expect(sharedViolations(doc, text)).toEqual([]);
  });
});

describe('the triggers and the concurrency of deploy.yml', () => {
  const on = doc.on as Record<string, unknown>;

  it('runs on a push to deploy/staging and to deploy-evidence branches but the destroy branch, and on a dispatch', () => {
    expect((on.push as Record<string, unknown>).branches).toEqual([
      'deploy/staging',
      'deploy-evidence/**',
      '!deploy-evidence/destroy-staging'
    ]);
    expect('workflow_dispatch' in on).toBe(true);
    expect(Object.keys(on).sort()).toEqual(['push', 'workflow_dispatch']);
  });

  it('has no pull-request trigger, no main trigger and no branches-ignore', () => {
    expect('pull_request' in on).toBe(false);
    expect('pull_request_target' in on).toBe(false);
    expect('branches-ignore' in (on.push as Record<string, unknown>)).toBe(false);
    expect((on.push as Record<string, unknown>).branches).not.toContain('main');
  });

  it('shares the staging-aws group with the destroy workflow and never cancels a running deploy', () => {
    expect(doc.concurrency).toEqual({ group: 'staging-aws', 'cancel-in-progress': false });
  });
});

describe('the checks job of deploy.yml', () => {
  const checks = jobOf(doc, 'checks');
  const scripts = jobSteps(checks).map(runOf).join('\n');

  it('holds no credential', () => {
    expect(checks.permissions).toEqual({ contents: 'read' });
    expect('environment' in checks).toBe(false);
  });

  it('formats, validates the staging AWS root and runs the unit tests of the infrastructure scripts', () => {
    expect(scripts).toContain('terraform fmt -check -recursive');
    expect(scripts).toContain(
      'terraform -chdir=infra/envs/staging/aws init -backend=false -input=false -lockfile=readonly'
    );
    expect(scripts).toContain('terraform -chdir=infra/envs/staging/aws validate');
    expect(scripts).toContain('yarn test:unit:infra');
  });
});

describe('the gate of the deploy job', () => {
  const deploy = jobOf(doc, 'deploy');

  it('needs the checks job and runs in the staging environment', () => {
    expect(deploy.needs).toBe('checks');
    expect(deploy.environment).toEqual({ name: 'staging', url: 'https://staging.openvaa.org' });
  });

  it('runs on the arm runner with a timeout above the longest observed apply', () => {
    expect(deploy['runs-on']).toBe('ubuntu-24.04-arm');
    expect(deploy['timeout-minutes']).toBeGreaterThanOrEqual(50);
  });

  it('holds exactly contents: read and id-token: write, and never runs for a pull request', () => {
    expect(deploy.permissions).toEqual({ contents: 'read', 'id-token': 'write' });
    expect(String(deploy.if)).toContain("github.event_name != 'pull_request'");
  });

  it('is the only job with id-token: write', () => {
    const granted = workflowJobs(doc).filter(
      ([, job]) => (job.permissions as Record<string, unknown> | undefined)?.['id-token'] === 'write'
    );
    expect(granted.map(([id]) => id)).toEqual(['deploy']);
  });

  it('assumes the deploy role from the environment variable, in the staging account only', () => {
    const assumes = jobSteps(deploy).filter(
      (step) => typeof step.uses === 'string' && step.uses.startsWith('aws-actions/configure-aws-credentials@')
    );
    expect(assumes.length).toBeGreaterThanOrEqual(3);
    for (const step of assumes) {
      expect(step.with).toMatchObject({
        'role-to-assume': '${{ vars.AWS_DEPLOY_ROLE_ARN }}',
        'aws-region': 'eu-north-1',
        'allowed-account-ids': '471112560111'
      });
    }
  });
});

describe('the stages of the deploy job', () => {
  const steps = stepsOf(doc, 'deploy');

  it('runs the stage steps in their fixed order, with the alert last', () => {
    expect(stageIdsInOrder(steps, STAGE_ORDER)).toEqual(STAGE_ORDER);
    expect(steps[steps.length - 1].id).toBe('alert');
  });

  it('builds before setup-yarn installs anything into the checkout, and accepts status 0 and 3', () => {
    const build = steps.indexOf(stepWithId(steps, 'build'));
    expect(build).toBeGreaterThanOrEqual(0);
    expect(build).toBeLessThan(indexOfUses(steps, 'threeal/setup-yarn-action'));
    const script = runOf(stepWithId(steps, 'build'));
    expect(script).toContain('infra/scripts/build-push-image.sh --repository-url "$url"');
    expect(script).toContain('build_exit=$?');
    expect(script).toContain('[ "$build_exit" -ne 0 ] && [ "$build_exit" -ne 3 ]');
    expect(script).toContain("sed -n 's/.*image_digest=\\(sha256:[0-9a-f]\\{64\\}\\).*/\\1/p'");
    expect(script).toContain('echo "digest=$digest" >> "$GITHUB_OUTPUT"');
  });

  it('plans with the built digest into a file under $RUNNER_TEMP and applies that file', () => {
    const plan = stepWithId(steps, 'plan');
    expect(runOf(plan)).toContain('-var "image_digest=$DIGEST"');
    expect(runOf(plan)).toContain('-out="$RUNNER_TEMP/tfplan"');
    expect(envOf(plan)).toEqual({
      DIGEST: '${{ steps.build.outputs.digest }}',
      TF_VAR_alert_email: '${{ secrets.ALERT_EMAIL }}'
    });
    expect(runOf(stepWithId(steps, 'apply'))).toContain(
      'terraform -chdir=infra/envs/staging/aws apply -input=false -no-color "$RUNNER_TEMP/tfplan"'
    );
  });

  it('prints the saved plan with show -no-color to the log and the step summary, and no JSON plan', () => {
    const show = steps.find((step) => runOf(step).includes('show -no-color "$RUNNER_TEMP/tfplan"'));
    expect(show).toBeDefined();
    expect(runOf(show as WorkflowStep)).toContain('>> "$GITHUB_STEP_SUMMARY"');
    expect(steps.indexOf(show as WorkflowStep)).toBeGreaterThan(steps.indexOf(stepWithId(steps, 'plan')));
    expect(text).not.toMatch(/show\s+-json/);
  });

  it('runs Terraform in the staging AWS root only', () => {
    const roots = [...text.matchAll(/terraform -chdir=(\S+)/g)].map(([, root]) => root);
    expect(roots.length).toBeGreaterThan(0);
    expect(new Set(roots)).toEqual(new Set(['infra/envs/staging/aws']));
  });

  it('assumes the credentials again right before the apply', () => {
    const apply = steps.indexOf(stepWithId(steps, 'apply'));
    const before = steps[apply - 1];
    expect(String(before.uses)).toMatch(/^aws-actions\/configure-aws-credentials@/);
  });

  it('checks that the primary deployment runs the applied task definition, completed, at the floor', () => {
    const script = runOf(stepWithId(steps, 'stable'));
    expect(script).toContain('output -raw task_definition_arn');
    expect(script).toContain('task_floor');
    expect(script).toContain('select(.status == "PRIMARY")');
    expect(script).toContain('[ "$rollout_state" != COMPLETED ]');
    expect(script).toContain('[ "$running" -ge "$floor" ]');
    for (const line of [
      'stable_task_definition_matches=',
      'stable_rollout_state=',
      'stable_running=',
      'stable_desired='
    ]) {
      expect(script).toContain(`echo "${line}`);
    }
  });

  it('runs the deployed smoke entry with the commit and the contestant secrets and nothing privileged', () => {
    const smoke = stepWithId(steps, 'smoke');
    const env = envOf(smoke);
    expect(env).toEqual({
      SMOKE_EXPECTED_SHA: '${{ github.sha }}',
      SMOKE_CONTESTANT_EMAIL: '${{ secrets.SMOKE_CONTESTANT_EMAIL }}',
      SMOKE_CONTESTANT_PASSWORD: '${{ secrets.SMOKE_CONTESTANT_PASSWORD }}'
    });
    expect(Object.keys(env).filter((key) => key.startsWith('SUPABASE_') || key.startsWith('PG'))).toEqual([]);
    const script = runOf(smoke);
    expect(script).toContain('yarn test:e2e:deployed --output "$RUNNER_TEMP/smoke-output"');
    expect(script).toContain('smoke_exit=$?');
    expect(script).toContain('echo "smoke_exit=$smoke_exit"');
    expect(script).not.toMatch(/--reporter|PLAYWRIGHT_HTML/);
  });

  it('has no switch, input or variable that skips the contestant spec', () => {
    expect(text).not.toMatch(/--grep|--project|SMOKE_SKIP|skip-contestant|SKIP_CONTESTANT/i);
    expect('inputs' in ((doc.on as Record<string, unknown>).workflow_dispatch ?? {})).toBe(false);
  });

  it('fails after the smoke run when /api/health no longer serves the commit', () => {
    const script = runOf(stepWithId(steps, 'served-build'));
    expect(script).toContain(
      'curl -fsS --max-time 20 -o "$RUNNER_TEMP/health.json" https://staging.openvaa.org/api/health'
    );
    expect(script).toContain('echo "served_build_after_smoke=$served"');
    expect(script).toContain('[ "$served" != "$GITHUB_SHA" ]');
  });

  it('removes the plan and the smoke output in a step that always runs, before the alert', () => {
    const cleanup = steps.find((step) => runOf(step).includes('rm -rf'));
    expect(cleanup?.if).toBe('always()');
    const script = runOf(cleanup as WorkflowStep);
    expect(script).toContain('"$RUNNER_TEMP/tfplan"');
    expect(script).toContain('"$RUNNER_TEMP/smoke-output"');
    expect(steps.indexOf(cleanup as WorkflowStep)).toBeLessThan(steps.indexOf(stepWithId(steps, 'alert')));
  });

  it('writes nothing to $GITHUB_ENV', () => {
    expect(text).not.toContain('GITHUB_ENV');
  });
});

describe('the alert of the deploy job', () => {
  const steps = stepsOf(doc, 'deploy');
  const alert = stepWithId(steps, 'alert');
  const script = runOf(alert);

  it('runs on a failure or a cancel, after assuming the deploy role again under the same condition', () => {
    expect(alert.if).toBe('failure() || cancelled()');
    const before = steps[steps.indexOf(alert) - 1];
    expect(String(before.uses)).toMatch(/^aws-actions\/configure-aws-credentials@/);
    expect(before.if).toBe('failure() || cancelled()');
  });

  it('derives the stage from the outcomes of the stage steps', () => {
    const env = envOf(alert);
    expect(env.JOB_STATUS).toBe('${{ job.status }}');
    for (const id of STAGE_ORDER.filter((stage) => stage !== 'alert')) {
      expect(Object.values(env)).toContain(`\${{ steps.${id}.outcome }}`);
    }
    expect(script).toContain('"rollout:$APPLY_OUTCOME"');
    expect(script).toContain('"smoke:$SERVED_BUILD_OUTCOME"');
    expect(script).toContain('stage=setup');
    expect(script).toContain('stage=cancelled');
  });

  it('publishes one message naming the stage, the commit, the trigger and the run to the deployment topic', () => {
    expect(script.match(/^\s*aws sns publish /gm)).toHaveLength(1);
    expect(script).toContain('--topic-arn arn:aws:sns:eu-north-1:471112560111:openvaa-staging-frontend-deployments');
    expect(script).toContain('--subject "openvaa staging deploy failed at $stage"');
    for (const name of [
      '$GITHUB_SHA',
      '$GITHUB_EVENT_NAME',
      '$GITHUB_REF_NAME',
      '$GITHUB_SERVER_URL/$GITHUB_REPOSITORY/actions/runs/$GITHUB_RUN_ID'
    ]) {
      expect(script).toContain(name);
    }
    expect(script).toContain('echo "alert_stage=$stage"');
    expect(script).toContain('echo "alert_message_id=$message_id"');
  });

  it('holds no secret in its environment', () => {
    expect(Object.values(envOf(alert)).filter((value) => String(value).includes('secrets.'))).toEqual([]);
  });
});

describe('the deploy-specific guards are red on a faulty copy', () => {
  /** Whether the stage order of a workflow text is the fixed one. */
  function orderHolds(source: string): boolean {
    const steps = stepsOf(parseWorkflow(source), 'deploy');
    return JSON.stringify(stageIdsInOrder(steps, STAGE_ORDER)) === JSON.stringify(STAGE_ORDER);
  }

  it('sees the apply moved before the plan', () => {
    const swapped = mutate(mutate(text, 'id: plan\n', 'id: apply-swap\n'), 'id: apply\n', 'id: plan\n').replace(
      'id: apply-swap\n',
      'id: apply\n'
    );
    expect(orderHolds(text)).toBe(true);
    expect(orderHolds(swapped)).toBe(false);
  });

  it('sees a secret added to the smoke step', () => {
    const mutated = mutate(
      text,
      '          SMOKE_EXPECTED_SHA: ${{ github.sha }}\n',
      '          SMOKE_EXPECTED_SHA: ${{ github.sha }}\n          PGPASSWORD: ${{ secrets.SUPABASE_DB_PASSWORD }}\n'
    );
    const env = envOf(stepWithId(stepsOf(parseWorkflow(mutated), 'deploy'), 'smoke'));
    expect(Object.keys(env).filter((key) => key.startsWith('SUPABASE_') || key.startsWith('PG'))).toEqual([
      'PGPASSWORD'
    ]);
  });

  it('sees a pull-request trigger', () => {
    const mutated = mutate(text, /^ {2}workflow_dispatch:$/m, '  workflow_dispatch:\n  pull_request:');
    expect('pull_request' in (parseWorkflow(mutated).on as Record<string, unknown>)).toBe(true);
  });
});
