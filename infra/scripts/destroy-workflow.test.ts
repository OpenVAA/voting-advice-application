/**
 * Guards on `.github/workflows/destroy.yml`, the guarded destroy of the AWS stack of the deployment the resolve job picks.
 *
 * The workflow removes every resource of a deployment's AWS root, in two jobs that each wait for an approval of that deployment's destroy environment, and its log is public. Its triggers, its environments, the one root it may plan, the order of its steps and the absence of any secret are therefore checked here rather than by its first run. The shared rules of `workflowGuards.ts` are shown red in `infra-plan-workflow.test.ts`; the rules particular to this file are shown red below on mutated copies of its text.
 */

import { existsSync, readFileSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';
import { jobSteps, loadWorkflow, parseWorkflow, sharedViolations, workflowJobs } from './workflowGuards';
import type { WorkflowDocument, WorkflowJob, WorkflowStep } from './workflowGuards';

const HERE = dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = resolve(HERE, '../..');
const WORKFLOW = join(REPO_ROOT, '.github', 'workflows', 'destroy.yml');
const DEPLOY_WORKFLOW = join(REPO_ROOT, '.github', 'workflows', 'deploy.yml');

const { doc, text } = loadWorkflow(WORKFLOW);

/** The `-chdir` word of every Terraform command of the AWS root, bound to the resolve job's `aws_root` output. */
const AWS_ROOT = '"$AWS_ROOT"';
/** The `-chdir` word of the one refused init of the Supabase root, bound to the resolve job's `supabase_root` output. */
const SUPABASE_ROOT = '"$SUPABASE_ROOT"';
const RESOLVED_AWS_ROOT = '${{ needs.resolve.outputs.aws_root }}';
const RESOLVED_SUPABASE_ROOT = '${{ needs.resolve.outputs.supabase_root }}';
const DEPLOY_ROLE_ARN = '${{ needs.resolve.outputs.deploy_role_arn }}';
const DESTROY_ENVIRONMENT = '${{ needs.resolve.outputs.destroy_environment }}';
/** The environment of each destroy job, in the object form whose empty name was observed to run with no environment. */
const DESTROY_JOB_ENVIRONMENT = { name: DESTROY_ENVIRONMENT, url: 'https://${{ needs.resolve.outputs.domain }}' };
/** The condition both destroy jobs run under: a push of the resolved destroy branch, or a dispatch with the resolved confirmation. */
const JOB_CONDITION =
  "(github.event_name == 'push' && github.ref == format('refs/heads/{0}', needs.resolve.outputs.destroy_branch)) || (github.event_name == 'workflow_dispatch' && inputs.confirm == needs.resolve.outputs.destroy_confirm)";
/** The outputs of the resolve job, in the order the resolver prints them. */
const RESOLVE_OUTPUTS = [
  'key',
  'environment',
  'destroy_environment',
  'domain',
  'aws_account_id',
  'aws_region',
  'state_bucket',
  'aws_root',
  'supabase_root',
  'state_key',
  'supabase_state_key',
  'deploy_role_arn',
  'plan_role_arn',
  'topic_arn',
  'cluster_name',
  'service_name',
  'destroy_branch',
  'destroy_confirm'
];
const PLAN_FILE = '"$RUNNER_TEMP/destroy.tfplan"';
/** The digest a destroy plan passes: a destroy replaces nothing, so the value only satisfies the variable's form. */
const PLACEHOLDER_DIGEST = `sha256:${'0'.repeat(64)}`;
const GUARD_COMMAND =
  'infra/scripts/check-destroy-plan.sh --plan-json "$RUNNER_TEMP/destroy.json" --state-list "$RUNNER_TEMP/state.txt"';

/** The ids of the plan job's steps that must run in this order. */
const PLAN_ORDER = ['credentials', 'supabase-root-refused', 'init', 'state', 'plan', 'export', 'guard', 'show'];
/** The ids of the apply job's steps that must run in this order. */
const APPLY_ORDER = ['credentials', 'init', 'state', 'plan', 'export', 'guard', 'show', 'apply', 'state-after'];

/** The job `id` of a workflow; fails the test when it is absent. */
function jobOf(source: WorkflowDocument, id: string): WorkflowJob {
  const found = workflowJobs(source).find(([jobId]) => jobId === id);
  if (!found) throw new Error(`destroy.yml has no job ${id}`);
  return found[1];
}

/** The steps of a job of a workflow. */
function stepsOf(source: WorkflowDocument, id: string): Array<WorkflowStep> {
  return jobSteps(jobOf(source, id));
}

/** The step with `id` in a list of steps; fails the test when it is absent. */
function stepWithId(steps: Array<WorkflowStep>, id: string): WorkflowStep {
  const step = steps.find((candidate) => candidate.id === id);
  if (!step) throw new Error(`the job has no step with id ${id}`);
  return step;
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

/** The ids of `order` as they appear among a list of steps. */
function idsInOrder(steps: Array<WorkflowStep>, order: Array<string>): Array<string> {
  return steps.flatMap((step) => (typeof step.id === 'string' && order.includes(step.id) ? [step.id] : []));
}

/** The index of the first step whose script contains `fragment`, or -1. */
function indexOfRun(steps: Array<WorkflowStep>, fragment: string): number {
  return steps.findIndex((step) => runOf(step).includes(fragment));
}

/** Every root a `terraform -chdir=` of a list of steps names, in order. */
function chdirRoots(steps: Array<WorkflowStep>): Array<string> {
  return steps.flatMap((step) => [...runOf(step).matchAll(/terraform -chdir=(\S+)/g)].map(([, root]) => root));
}

/** The violations of the root rule in a workflow: a step other than the refusal names the Supabase root, or a
 * Terraform command reaches a root other than the AWS root, other than the refusal's one `init`. */
function rootViolations(source: WorkflowDocument): Array<string> {
  const violations: Array<string> = [];
  for (const [jobId, job] of workflowJobs(source)) {
    for (const step of jobSteps(job)) {
      const script = runOf(step);
      const where = `job ${jobId} step ${String(step.id ?? step.name)}`;
      const env = envOf(step);
      if (step.id === 'supabase-root-refused') {
        const commands = [...script.matchAll(/terraform -chdir=(\S+) (\S+)/g)];
        if (commands.length !== 1 || commands[0][1] !== SUPABASE_ROOT || commands[0][2] !== 'init') {
          violations.push(`${where} runs ${commands.map(([command]) => command).join(', ') || 'nothing'}`);
        }
        if (env.SUPABASE_ROOT !== RESOLVED_SUPABASE_ROOT) {
          violations.push(`${where} binds SUPABASE_ROOT to ${JSON.stringify(env.SUPABASE_ROOT)}`);
        }
        continue;
      }
      if (JSON.stringify(step).includes('SUPABASE_ROOT') || JSON.stringify(step).includes('supabase_root')) {
        violations.push(`${where} names the Supabase root`);
      }
      const roots = [...script.matchAll(/terraform -chdir=(\S+)/g)].map(([, root]) => root);
      for (const root of roots) {
        if (root !== AWS_ROOT) violations.push(`${where} reaches ${root}`);
      }
      if (roots.length > 0 && env.AWS_ROOT !== RESOLVED_AWS_ROOT) {
        violations.push(`${where} binds AWS_ROOT to ${JSON.stringify(env.AWS_ROOT)}`);
      }
      if (/^\s*terraform (?!-chdir=)/m.test(script)) {
        violations.push(`${where} runs Terraform without -chdir`);
      }
    }
  }
  return violations;
}

/** `source` with the first match of `pattern` replaced; fails when nothing matched, so a mutation is never a no-op. */
function mutate(source: string, pattern: string | RegExp, replacement: string): string {
  const mutated = source.replace(pattern, replacement);
  if (mutated === source) throw new Error(`the mutation found nothing to replace: ${String(pattern)}`);
  return mutated;
}

/** The text of a workflow with its comment lines removed. */
function uncommentedText(source: string): string {
  return source
    .split('\n')
    .filter((line) => !/^\s*#/.test(line))
    .join('\n');
}

/** The Supabase state key the resolver derives for a deployment key. */
function supabaseStateKey(key: string): string {
  return `hand/${key}/supabase/terraform.tfstate`;
}

/** The keys of the deployment map that have a Supabase root under infra/envs. */
function supabaseRootKeys(): Array<string> {
  const map = JSON.parse(
    readFileSync(join(REPO_ROOT, 'infra', 'bootstrap', 'deployments.auto.tfvars.json'), 'utf8')
  ) as { deployments: Record<string, unknown> };
  return Object.keys(map.deployments).filter((key) => existsSync(join(REPO_ROOT, 'infra', 'envs', key, 'supabase')));
}

/** The `key` of the `backend "s3"` block of a Terraform text, or undefined when it declares none. */
function declaredBackendKeyOf(source: string): string | undefined {
  return /backend "s3" \{[^}]*?^\s*key\s*=\s*"([^"]*)"/m.exec(source)?.[1];
}

/** The backend key a root's main.tf declares. */
function declaredBackendKey(mainTf: string): string | undefined {
  return declaredBackendKeyOf(readFileSync(mainTf, 'utf8'));
}

describe('destroy.yml and the shared rules', () => {
  it('finds no violation of the shared rules', () => {
    expect(sharedViolations(doc, text)).toEqual([]);
  });

  it('names no secret and no setting at all', () => {
    expect(text).not.toMatch(/secrets\./);
    expect(text).not.toMatch(/vars\./);
    expect(text).not.toMatch(/GITHUB_TOKEN|github\.token/);
  });

  it('writes nothing to $GITHUB_ENV', () => {
    expect(text).not.toContain('GITHUB_ENV');
  });

  it.each(['plan-destroy', 'apply-destroy'])(
    'lets only the export, the guard and the cleanup of %s touch the JSON plan',
    (id) => {
      const touching = stepsOf(doc, id).filter((step) => runOf(step).includes('destroy.json'));
      expect(touching.map((step) => step.id)).toEqual(['export', 'guard', 'cleanup']);
    }
  );
});

describe('the triggers and the concurrency of destroy.yml', () => {
  const on = doc.on as Record<string, unknown>;

  it('runs on a push to a deploy-evidence/destroy-* branch only and on a dispatch', () => {
    expect(Object.keys(on).sort()).toEqual(['push', 'workflow_dispatch']);
    expect(on.push).toEqual({ branches: ['deploy-evidence/destroy-*'] });
  });

  it('asks a dispatch for the required string confirm, described for any deployment', () => {
    const dispatch = on.workflow_dispatch as Record<string, unknown>;
    const inputs = dispatch.inputs as Record<string, Record<string, unknown>>;
    expect(Object.keys(inputs)).toEqual(['confirm']);
    expect(inputs.confirm.description).toBe(
      'Type destroy <deployment> aws, with the deployment this ref deploys, to destroy its AWS stack'
    );
    expect(inputs.confirm.required).toBe(true);
    expect(inputs.confirm.type).toBe('string');
    expect('default' in inputs.confirm).toBe(false);
  });

  it('has no pull-request trigger', () => {
    expect('pull_request' in on).toBe(false);
    expect('pull_request_target' in on).toBe(false);
  });

  it('shares the aws-pipeline group with the deploy workflow and never cancels a running destroy', () => {
    expect(doc.concurrency).toEqual({ group: 'aws-pipeline', 'cancel-in-progress': false });
    expect(loadWorkflow(DEPLOY_WORKFLOW).doc.concurrency).toEqual(doc.concurrency);
  });

  it('owns the branches the deploy workflow excludes', () => {
    const deployOn = loadWorkflow(DEPLOY_WORKFLOW).doc.on as Record<string, unknown>;
    expect((deployOn.push as Record<string, unknown>).branches).toContain('!deploy-evidence/destroy-*');
  });
});

describe('the resolve job of destroy.yml', () => {
  const resolveJob = jobOf(doc, 'resolve');
  const steps = jobSteps(resolveJob);
  const step = stepWithId(steps, 'resolve');

  it('is the first job, with exactly contents: read, no environment and no id-token', () => {
    expect(workflowJobs(doc)[0][0]).toBe('resolve');
    expect(resolveJob.permissions).toEqual({ contents: 'read' });
    expect('environment' in resolveJob).toBe(false);
    expect('needs' in resolveJob).toBe(false);
    expect('if' in resolveJob).toBe(false);
    expect(resolveJob['runs-on']).toBe('ubuntu-24.04');
    expect(resolveJob['timeout-minutes']).toBe(5);
  });

  it('checks out without persisted credentials and runs the resolver in destroy mode with the repository id, the ref and the event', () => {
    expect(steps).toHaveLength(2);
    expect(String(steps[0].uses)).toMatch(/^actions\/checkout@[0-9a-f]{40}$/);
    expect(steps[0].with).toEqual({ 'persist-credentials': false });
    expect(envOf(step)).toEqual({
      REPOSITORY_ID: '${{ github.repository_id }}',
      REF_NAME: '${{ github.ref_name }}',
      EVENT_NAME: '${{ github.event_name }}'
    });
    expect(runOf(step).replace(/\\\n\s*/g, '')).toContain(
      'infra/scripts/resolve-deployment.sh --mode destroy --repository-id "$REPOSITORY_ID" --ref "$REF_NAME" --event "$EVENT_NAME" --github-output "$GITHUB_OUTPUT" || resolve_exit=$?'
    );
  });

  it('maps every output of the resolver to a job output', () => {
    expect(resolveJob.outputs).toEqual(
      Object.fromEntries(RESOLVE_OUTPUTS.map((name) => [name, `\${{ steps.resolve.outputs.${name} }}`]))
    );
  });
});

describe('the jobs of destroy.yml', () => {
  it('has exactly the jobs resolve, plan-destroy and apply-destroy; the plan needs resolve and the apply both', () => {
    expect(workflowJobs(doc).map(([id]) => id)).toEqual(['resolve', 'plan-destroy', 'apply-destroy']);
    expect(jobOf(doc, 'plan-destroy').needs).toBe('resolve');
    expect(jobOf(doc, 'apply-destroy').needs).toEqual(['resolve', 'plan-destroy']);
  });

  it.each(['plan-destroy', 'apply-destroy'])(
    'runs %s in the resolved destroy environment with its own approval',
    (id) => {
      const job = jobOf(doc, id);
      expect(job.environment).toEqual(DESTROY_JOB_ENVIRONMENT);
      expect(job.permissions).toEqual({ contents: 'read', 'id-token': 'write' });
      expect(job['runs-on']).toBe('ubuntu-24.04');
      expect('env' in job).toBe(false);
    }
  );

  it.each(['plan-destroy', 'apply-destroy'])(
    'admits to %s a push of the resolved destroy branch or the resolved typed confirmation only',
    (id) => {
      expect(jobOf(doc, id).if).toBe(JOB_CONDITION);
    }
  );

  it('gives the plan job 30 minutes and the apply job 45', () => {
    expect(jobOf(doc, 'plan-destroy')['timeout-minutes']).toBe(30);
    expect(jobOf(doc, 'apply-destroy')['timeout-minutes']).toBe(45);
  });

  it('holds no env mapping at the top level', () => {
    expect('env' in doc).toBe(false);
  });

  it.each([
    ['plan-destroy', 'destroy-plan-${{ github.run_id }}'],
    ['apply-destroy', 'destroy-apply-${{ github.run_id }}']
  ])('assumes the resolved deploy role in %s, once, in the resolved account and region only', (id, session) => {
    const assumes = stepsOf(doc, id).filter(
      (step) => typeof step.uses === 'string' && step.uses.startsWith('aws-actions/configure-aws-credentials@')
    );
    expect(assumes).toHaveLength(1);
    expect(assumes[0].with).toEqual({
      'role-to-assume': DEPLOY_ROLE_ARN,
      'aws-region': '${{ needs.resolve.outputs.aws_region }}',
      'role-session-name': session,
      'allowed-account-ids': '${{ needs.resolve.outputs.aws_account_id }}'
    });
  });
});

describe('the Supabase root is shown out of reach in plan-destroy', () => {
  const steps = stepsOf(doc, 'plan-destroy');
  const refusal = stepWithId(steps, 'supabase-root-refused');
  const script = runOf(refusal);

  it('comes right after the credentials and before any plan', () => {
    expect(steps.indexOf(refusal)).toBe(steps.indexOf(stepWithId(steps, 'credentials')) + 1);
    expect(steps.indexOf(refusal)).toBeLessThan(steps.indexOf(stepWithId(steps, 'plan')));
    expect(steps.indexOf(refusal)).toBeLessThan(indexOfRun(steps, `terraform -chdir=${AWS_ROOT}`));
  });

  it('runs one init of the Supabase root and nothing else of that root', () => {
    expect([...script.matchAll(/terraform -chdir=(\S+) (\S+)/g)].map(([, root, command]) => [root, command])).toEqual([
      [SUPABASE_ROOT, 'init']
    ]);
    expect(envOf(refusal)).toEqual({
      SUPABASE_ROOT: RESOLVED_SUPABASE_ROOT,
      STATE_BUCKET: '${{ needs.resolve.outputs.state_bucket }}',
      SUPABASE_STATE_KEY: '${{ needs.resolve.outputs.supabase_state_key }}'
    });
  });

  it('heads the resolved Supabase state key in the resolved state bucket, with the output discarded', () => {
    expect(script).toContain('aws s3api head-object --bucket "$STATE_BUCKET" --key "$SUPABASE_STATE_KEY" > /dev/null');
    expect(script).not.toMatch(/hand\/|openvaa-tfstate-/);
  });

  it('fails unless both reads were refused', () => {
    expect(script).toContain("'Error refreshing state'");
    expect(script).toContain("'AccessDenied|403'");
    expect(script).toMatch(/\[ "\$init_status" -ne 0 \]/);
    expect(script).toMatch(/\[ "\$head_status" -ne 0 \]/);
    expect(script).toMatch(/supabase_root_refused=no"\necho "::error::[^\n]*"\nexit 1\n$/);
  });

  it('finds the Supabase root of every deployment that has one, staging among them', () => {
    expect(supabaseRootKeys()).toContain('staging');
  });

  it.each(supabaseRootKeys())(
    "derives for %s the backend key that deployment's Supabase root itself declares",
    (key) => {
      expect(declaredBackendKey(join(REPO_ROOT, 'infra', 'envs', key, 'supabase', 'main.tf'))).toBe(
        supabaseStateKey(key)
      );
    }
  );

  it('is red against a root that declares another key', () => {
    expect(declaredBackendKeyOf('  backend "s3" {\n    key = "hand/other/supabase/terraform.tfstate"\n  }\n')).not.toBe(
      supabaseStateKey('staging')
    );
  });

  it('is absent from apply-destroy', () => {
    expect(stepsOf(doc, 'apply-destroy').some((step) => step.id === 'supabase-root-refused')).toBe(false);
  });
});

describe('the roots destroy.yml reaches', () => {
  it('runs Terraform in the resolved AWS root only, but for the one refused init', () => {
    expect(rootViolations(doc)).toEqual([]);
    for (const id of ['plan-destroy', 'apply-destroy']) {
      const roots = chdirRoots(stepsOf(doc, id).filter((step) => step.id !== 'supabase-root-refused'));
      expect(roots.length).toBeGreaterThan(0);
      expect(new Set(roots)).toEqual(new Set([AWS_ROOT]));
    }
  });

  it('names no infra/envs/ path at all outside a comment, and the Supabase root in the one refusal step only', () => {
    expect(uncommentedText(text)).not.toMatch(/infra\/envs\//);
    expect(text.split(RESOLVED_SUPABASE_ROOT)).toHaveLength(2);
  });
});

describe('the deployment destroy.yml names', () => {
  it('names staging in comments only', () => {
    expect(uncommentedText(text)).not.toMatch(/staging/);
  });

  it.each([
    [
      'a literal Supabase state key',
      (source: string) => mutate(source, '--key "$SUPABASE_STATE_KEY"', '--key hand/staging/supabase/terraform.tfstate')
    ],
    [
      'a step named for staging',
      (source: string) => mutate(source, '"Initialise the AWS root"', '"Initialise the staging AWS root"')
    ],
    [
      'a literal confirm text',
      (source: string) =>
        mutate(source, 'description: "Type destroy <deployment> aws,', 'description: "Type destroy staging aws,')
    ],
    [
      'the workflow named for staging',
      (source: string) => mutate(source, /^name: "Destroy AWS stack"$/m, 'name: "Destroy staging AWS"')
    ]
  ])('is red with %s', (_label, mutation) => {
    expect(uncommentedText(mutation(text))).toMatch(/staging/);
  });
});

describe.each([
  ['plan-destroy', PLAN_ORDER],
  ['apply-destroy', APPLY_ORDER]
])('the steps of %s', (id, order) => {
  const steps = stepsOf(doc, id);

  it('run in their fixed order', () => {
    expect(idsInOrder(steps, order)).toEqual(order);
  });

  it('read no running digest, so a destroy that stopped after the service went can be run again', () => {
    expect(steps.some((step) => step.id === 'digest')).toBe(false);
    expect(steps.some((step) => runOf(step).includes('running-image-digest.sh'))).toBe(false);
  });

  it('initialise the AWS root with the lock file read-only and list its state into $RUNNER_TEMP', () => {
    expect(runOf(stepWithId(steps, 'init'))).toContain(
      `terraform -chdir=${AWS_ROOT} init -input=false -no-color -lockfile=readonly`
    );
    expect(runOf(stepWithId(steps, 'state'))).toContain(
      `terraform -chdir=${AWS_ROOT} state list > "$RUNNER_TEMP/state.txt"`
    );
  });

  it('plan -destroy with a placeholder digest and a placeholder alert address into $RUNNER_TEMP', () => {
    const plan = stepWithId(steps, 'plan');
    expect(runOf(plan)).toContain(
      `terraform -chdir=${AWS_ROOT} plan -destroy -input=false -no-color -var "image_digest=$DIGEST" -out=${PLAN_FILE}`
    );
    expect(envOf(plan)).toEqual({
      AWS_ROOT: RESOLVED_AWS_ROOT,
      DIGEST: PLACEHOLDER_DIGEST,
      TF_VAR_alert_email: 'destroy-plan@example.invalid'
    });
  });

  it('export the saved plan as JSON into $RUNNER_TEMP and never print it', () => {
    const script = runOf(stepWithId(steps, 'export'));
    expect(script).toContain(`terraform -chdir=${AWS_ROOT} show -json ${PLAN_FILE} > "$RUNNER_TEMP/destroy.json"`);
    expect(script).toContain('umask 077');
    expect(script).not.toMatch(/\bcat\b/);
  });

  it('run the guard on the saved plan before showing it', () => {
    const guard = stepWithId(steps, 'guard');
    expect(runOf(guard)).toContain(GUARD_COMMAND);
    expect(runOf(guard)).toContain('guard_exit=$?');
    const show = indexOfRun(steps, `show -no-color ${PLAN_FILE}`);
    expect(show).toBe(steps.indexOf(stepWithId(steps, 'show')));
    expect(steps.indexOf(guard)).toBeLessThan(show);
    expect(steps.indexOf(guard)).toBeGreaterThan(steps.indexOf(stepWithId(steps, 'export')));
  });

  it('print the plan only after the guard, to the step summary', () => {
    const show = runOf(stepWithId(steps, 'show'));
    expect(show).toContain('>> "$GITHUB_STEP_SUMMARY"');
  });

  it('remove the plan, its JSON and the step files in a last step that always runs', () => {
    const cleanup = steps[steps.length - 1];
    expect(cleanup.id).toBe('cleanup');
    expect(cleanup.if).toBe('always()');
    const script = runOf(cleanup);
    for (const file of ['destroy.tfplan', 'destroy.json', 'destroy-plan.log', 'destroy-plan.txt', 'state.txt']) {
      expect(script).toContain(`"$RUNNER_TEMP/${file}"`);
    }
  });
});

describe('the apply of apply-destroy', () => {
  const steps = stepsOf(doc, 'apply-destroy');

  it('applies its own saved plan after its guard', () => {
    const apply = stepWithId(steps, 'apply');
    expect(runOf(apply)).toContain(`terraform -chdir=${AWS_ROOT} apply -input=false -no-color ${PLAN_FILE}`);
    expect(steps.indexOf(apply)).toBeGreaterThan(steps.indexOf(stepWithId(steps, 'guard')));
    expect(runOf(apply)).toContain('apply_exit=$?');
  });

  it('is the only step of the workflow that applies', () => {
    const applies = [...stepsOf(doc, 'plan-destroy'), ...steps].filter((step) =>
      /terraform -chdir=\S+ apply\b/.test(runOf(step))
    );
    expect(applies.map((step) => step.id)).toEqual(['apply']);
    expect(text).not.toMatch(/terraform -chdir=\S+ destroy\b/);
    expect(text).not.toContain('-auto-approve');
  });

  it('shows the state empty afterwards and fails unless it is', () => {
    const script = runOf(stepWithId(steps, 'state-after'));
    expect(script).toContain(`terraform -chdir=${AWS_ROOT} state list > "$RUNNER_TEMP/state-after.txt"`);
    expect(script).toContain('[ "$count" -ne 0 ]');
  });

  it('applies nothing in plan-destroy', () => {
    expect(stepsOf(doc, 'plan-destroy').some((step) => /terraform -chdir=\S+ apply\b/.test(runOf(step)))).toBe(false);
  });
});

describe('the destroy-specific guards are red on a faulty copy', () => {
  it('sees a secret named in a step', () => {
    const mutated = mutate(
      text,
      '          TF_VAR_alert_email: destroy-plan@example.invalid\n',
      '          TF_VAR_alert_email: ${{ secrets.ALERT_EMAIL }}\n'
    );
    expect(mutated).toMatch(/secrets\./);
  });

  it('sees a plan of the Supabase root', () => {
    const mutated = mutate(
      text,
      `terraform -chdir=${AWS_ROOT} plan -destroy`,
      `terraform -chdir=${SUPABASE_ROOT} plan -destroy`
    );
    expect(rootViolations(parseWorkflow(mutated)).length).toBeGreaterThan(0);
  });

  it('sees a literal root in a plan', () => {
    const mutated = mutate(
      text,
      `terraform -chdir=${AWS_ROOT} plan -destroy`,
      'terraform -chdir=infra/envs/example/aws plan -destroy'
    );
    expect(rootViolations(parseWorkflow(mutated)).length).toBeGreaterThan(0);
  });

  it('sees AWS_ROOT bound to the Supabase root output in a step', () => {
    const mutated = mutate(
      text,
      /(id: apply\n {8}env:\n {10})AWS_ROOT: [^\n]*/,
      '$1AWS_ROOT: ${{ needs.resolve.outputs.supabase_root }}'
    );
    expect(rootViolations(parseWorkflow(mutated)).length).toBeGreaterThan(0);
  });

  it('sees SUPABASE_ROOT bound to anything but the resolved Supabase root in the refusal', () => {
    const mutated = mutate(
      text,
      `SUPABASE_ROOT: ${RESOLVED_SUPABASE_ROOT}`,
      'SUPABASE_ROOT: infra/envs/example/supabase'
    );
    expect(rootViolations(parseWorkflow(mutated)).length).toBeGreaterThan(0);
  });

  it('sees a job condition with a literal destroy branch', () => {
    const mutated = mutate(
      text,
      "format('refs/heads/{0}', needs.resolve.outputs.destroy_branch)",
      "'refs/heads/deploy-evidence/destroy-staging'"
    );
    expect(jobOf(parseWorkflow(mutated), 'plan-destroy').if).not.toBe(JOB_CONDITION);
  });

  it('sees the apply job without the resolve job in its needs', () => {
    const mutated = mutate(text, 'needs: [resolve, plan-destroy]', 'needs: plan-destroy');
    expect(jobOf(parseWorkflow(mutated), 'apply-destroy').needs).not.toEqual(['resolve', 'plan-destroy']);
  });

  it('sees the resolve job given id-token: write', () => {
    const mutated = mutate(
      text,
      /( {2}resolve:\n[\s\S]*? {4}permissions:\n {6}contents: read\n)/,
      '$1      id-token: write\n'
    );
    expect(jobOf(parseWorkflow(mutated), 'resolve').permissions).not.toEqual({ contents: 'read' });
  });

  it('sees a second command of the Supabase root in the refusal step', () => {
    const mutated = mutate(
      text,
      `terraform -chdir=${SUPABASE_ROOT} init`,
      `terraform -chdir=${SUPABASE_ROOT} state pull; terraform -chdir=${SUPABASE_ROOT} init`
    );
    expect(rootViolations(parseWorkflow(mutated)).length).toBeGreaterThan(0);
  });

  it('sees the guard moved after the show', () => {
    const swapped = mutate(mutate(text, 'id: guard\n', 'id: show-swap\n'), 'id: show\n', 'id: guard\n').replace(
      'id: show-swap\n',
      'id: show\n'
    );
    const steps = stepsOf(parseWorkflow(swapped), 'plan-destroy');
    expect(idsInOrder(steps, PLAN_ORDER)).not.toEqual(PLAN_ORDER);
  });

  it('sees the apply job in another environment', () => {
    const mutated = mutate(
      text,
      /(apply-destroy:[\s\S]*?)name: \$\{\{ needs\.resolve\.outputs\.destroy_environment \}\}/,
      '$1name: ${{ needs.resolve.outputs.environment }}'
    );
    expect(jobOf(parseWorkflow(mutated), 'apply-destroy').environment).not.toEqual(DESTROY_JOB_ENVIRONMENT);
  });

  it('sees the apply job name its environment in the short form', () => {
    const mutated = mutate(
      text,
      /(apply-destroy:[\s\S]*?)environment:\n {6}name: (\$\{\{ needs\.resolve\.outputs\.destroy_environment \}\})\n {6}url: [^\n]*/,
      '$1environment: $2'
    );
    expect(jobOf(parseWorkflow(mutated), 'apply-destroy').environment).not.toEqual(DESTROY_JOB_ENVIRONMENT);
  });

  it('sees a pull-request trigger', () => {
    const mutated = mutate(text, /^ {2}workflow_dispatch:$/m, '  pull_request:\n  workflow_dispatch:');
    expect('pull_request' in (parseWorkflow(mutated).on as Record<string, unknown>)).toBe(true);
  });
});
