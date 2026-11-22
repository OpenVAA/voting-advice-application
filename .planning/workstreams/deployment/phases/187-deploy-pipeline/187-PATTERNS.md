# Phase 187: Deploy Pipeline - Pattern Map

**Mapped:** 2026-11-15
**Files analyzed:** 22
**Analogs found:** 19 / 22

Anchors below are content anchors (named blocks / grep strings); line numbers are as of 2026-11-15 and are hints only. Re-locate by content at run time.

## File Classification

| New/Modified File | Role | Data Flow | Closest Analog | Match Quality |
|---|---|---|---|---|
| `.github/workflows/infra-plan.yml` (new) | CI workflow | request-response (PR event -> plan) | `.github/workflows/main.yaml` job `infra-validate` | exact (fmt/validate/test steps) |
| `.github/workflows/deploy.yml` (new) | CI workflow | batch pipeline | `main.yaml` `infra-validate` + `dependency-audit` (node/yarn setup) | role-match |
| `.github/workflows/destroy.yml` (new, two jobs per F-01) | CI workflow | batch | `main.yaml` `infra-validate` | role-match |
| `infra/modules/github-oidc/deploy-policies.tf` (new) | IaC IAM policy | config | `infra/modules/github-oidc/policies.tf` | exact |
| `infra/modules/github-oidc/policies.tf` (modify: `ecr:DescribeImages`, drop `plan_lock`) | IaC IAM policy | config | itself | exact |
| `infra/modules/github-oidc/variables.tf` (modify: new string inputs) | config | config | itself | exact |
| `infra/modules/github-oidc/tests/github_oidc.tftest.hcl` (new) | test (terraform) | plan-time assert | `infra/modules/frontend-service/tests/frontend_service.tftest.hcl` | role-match (real offline aws provider, not mock, per RESEARCH Pattern 1) |
| `infra/bootstrap/main.tf`, `terraform.tfvars` (modify: subjects, ids, inputs) | config | config | themselves | exact |
| `infra/modules/frontend-service/service.tf`, `variables.tf` (image_tag -> image_digest) | IaC | config | `variables.tf` `variable "image_tag"` | exact |
| `infra/envs/staging/aws/*`, `infra/envs/example/aws/*` (drop image_tag) | config | config | themselves | exact |
| `infra/envs/example/{aws,dns-mail,supabase}/tests/plan.tftest.hcl` (new) | test (terraform) | mock plan | `frontend_service.tftest.hcl` mock_provider blocks + RESEARCH Code Examples | exact |
| `infra/scripts/build-push-image.sh` (modify: CR-01 git archive context) | utility script | file-I/O | itself (`self_test()` block) | exact |
| `infra/scripts/build-push-image.test.ts` (modify: new case name) | test (vitest) | spawn | itself | exact |
| `infra/scripts/push-migrations.sh` (modify: `--confirmed-ref`) | utility script | request-response | itself (arg-parse `case` + refusals block) | exact |
| `infra/scripts/push-migrations.test.ts` (new) | test (vitest) | spawn | `infra/scripts/build-push-image.test.ts` | exact |
| `infra/scripts/workflows.test.ts` (new guard tests, js-yaml) | test (vitest) | file scan | `tests/tests/utils/deployedSmokeGuards.test.ts` (`.github/` scan) + `build-push-image.test.ts` (path setup) | role-match |
| `package.json` (root: `lint:workflows`, `js-yaml: catalog:`) | config | config | existing `test:unit:infra` script | exact |
| `infra/README.md` (new section "The deploy pipeline", fix Prerequisites, first-run sentence) | docs | - | existing sections | exact |
| `infra/envs/staging/aws/README.md`, `infra/bootstrap/README.md`, `tests/README.md` (digest steps, Observations rows) | docs | - | themselves | exact |
| Red-run commit (unresolvable import in one route) | throwaway | - | none | no analog |
| `187-*/evidence/` records | evidence | - | 185 evidence dirs | role-match |
| GitHub Environments / secrets (H2/H3) | repo settings | - | none in code | no analog |

## Pattern Assignments

### `.github/workflows/infra-plan.yml`, `deploy.yml`, `destroy.yml`

**Analog:** `.github/workflows/main.yaml`, job `infra-validate` (anchor: `infra-validate:`).

Checkout + Terraform setup to copy verbatim (SHA pins already in use):
```yaml
    steps:
      - name: "Checkout source code"
        uses: actions/checkout@3d3c42e5aac5ba805825da76410c181273ba90b1 # v7
        with:
          persist-credentials: false

      - name: "Setup Terraform 1.16.5"
        uses: hashicorp/setup-terraform@dfe3c3f87815947d99a8997f908cb6525fc44e9e # v4.0.1
        with:
          terraform_version: 1.16.5
          terraform_wrapper: false

      - name: "Check Terraform formatting"
        run: terraform fmt -check -recursive -diff infra
```
Per-job permissions pattern (`infra-validate` has `permissions: contents: read`). New files add top-level `permissions: {}` (repo default is write) and per-job `id-token: write` only on role-assuming jobs (RESEARCH Pattern 5).

Loop-with-required-list pattern (anchor: `for root in infra/bootstrap infra/envs/*/*/`) — copy for the example mock-plan step, since the module-tests loop `for tests in infra/modules/*/tests/` does NOT reach `infra/envs/example/*/tests`:
```bash
          set -euo pipefail
          shopt -s nullglob
          tested=()
          for tests in infra/modules/*/tests/; do
            module="${tests%/tests/}"
            echo "::group::$module"
            terraform -chdir="$module" init -backend=false -input=false
            terraform -chdir="$module" test -no-color
            echo "::endgroup::"
            tested+=("$module")
          done
          if [ "${#tested[@]}" -eq 0 ]; then
            echo "::error::No module under infra/modules has a tests directory, so no module test ran."
            exit 1
          fi
```
Node/Yarn setup (anchor: `dependency-audit:`) — but pin by SHA (dependency-audit uses floating tags; do not copy that) and note the comment that setup-yarn-action runs `yarn install` itself, so place it AFTER the build step in `deploy.yml`:
```yaml
      # Node comes first: setup-yarn-action runs `yarn install`, whose preinstall guard rejects a
      # Node below engines.node.
      - name: Setup Node.js 24.21.0
        uses: actions/setup-node@949feb2413d6458794dcd2491c4babbbce0c15c1 # v7.1.0
        with:
          node-version: 24.21.0
      - name: Setup Yarn 4.18
        uses: threeal/setup-yarn-action@ec8c075e62bc497968de40011c2b766f5e8f1ac5 # v2.0.0
        with:
          version: 4.18
```
Trigger-comment style: `main.yaml` top (`on: push: branches: - main` with an explanatory comment on `ci-evidence/**`). Deploy trigger must include `"!deploy-evidence/destroy-staging"` (RESEARCH Pitfall 5). Runner labels `ubuntu-24.04` / `ubuntu-24.04-arm`, never `ubuntu-latest` (infra-validate's `ubuntu-latest` is not to be copied).

Never write `DEV_SEED_ALLOW_REMOTE|allow-remote|allowRemote` anywhere under `.github/` (scanned by `tests/tests/utils/deployedSmokeGuards.test.ts`).

---

### `infra/modules/github-oidc/deploy-policies.tf`

**Analog:** `infra/modules/github-oidc/policies.tf` (document -> policy -> per-role attachment).

```hcl
data "aws_iam_policy_document" "ecr_push" {
  statement {
    sid    = "PushToRepository"
    effect = "Allow"
    actions = [
      "ecr:CompleteLayerUpload",
      ...
      "ecr:BatchGetImage",          # add "ecr:DescribeImages" here (Pitfall 1)
    ]
    resources = [var.registry_arn]
  }
  # The registry login token is not scoped to a repository.
  statement { sid = "RegistryLogin" ... resources = ["*"] }
}

resource "aws_iam_policy" "ecr_push" {
  name        = "${var.name_prefix}-ecr-push"
  path        = var.iam_path
  description = "Push images to the one image repository."
  policy      = data.aws_iam_policy_document.ecr_push.json
}

# Attachments are per role. The account-wide exclusive attachment form is not used: it would detach a
# policy from every other identity in the account.
resource "aws_iam_role_policy_attachment" "deploy_ecr_push" {
  role       = aws_iam_role.deploy.name
  policy_arn = aws_iam_policy.ecr_push.arn
}
```
Naming: `"${var.name_prefix}-deploy-<concern>"`, `path = var.iam_path`. All ARNs/names as string variables (bootstrap reads no other root's state). Removal targets in `policies.tf`: `data/resource "plan_lock"` and `aws_iam_role_policy_attachment.plan_lock`; also the `pipeline_lock_arn` local if then unused. Keep `aws_iam_role_policies_exclusive` in `main.tf` consistent (anchor: grep `aws_iam_role_policies_exclusive`).

### `infra/modules/github-oidc/tests/github_oidc.tftest.hcl`

**Analog:** `infra/modules/frontend-service/tests/frontend_service.tftest.hcl` (header comment style, `run` + `assert` blocks). Difference: use a real offline `aws` provider (`skip_credentials_validation`, `skip_requesting_account_id`, `skip_metadata_api_check`, fake keys) so `aws_iam_policy.<x>.policy` is known at plan time. Assert `length(replace(policy, "/\\s/", "")) <= 6144` and presence of `ecr:DescribeImages`; do NOT assert on `assume_role_policy` (unknown at plan). Picked up automatically by infra-validate's module loop.

### `infra/envs/example/*/tests/plan.tftest.hcl`

**Analog:** `frontend_service.tftest.hcl` mock_provider blocks (anchor: `mock_provider "aws" {` with `mock_resource "aws_lb"` ARN defaults) — copy those defaults for the aws root, plus the three verified root-specific stubs in 187-RESEARCH.md § Code Examples (`override_data` AZs, `override_resource` supabase project, `mock_data "aws_region"`).

---

### `infra/modules/frontend-service/variables.tf` + `service.tf` (image_digest)

**Analog:** the variable it replaces:
```hcl
variable "image_tag" {
  description = "Tag of the image the task runs: the full commit SHA the image was built from."
  type        = string

  validation {
    condition     = can(regex("^[0-9a-f]{40}$", var.image_tag))
    error_message = "image_tag must be a full commit SHA, 40 lower-case hexadecimal characters."
  }
}
```
New: `image_digest`, regex `^sha256:[0-9a-f]{64}$`, no default. In `service.tf` container_definitions: `image = "${var.registry_url}:${var.image_tag}"` -> `"${var.registry_url}@${var.image_digest}"`. Update `frontend_service.tftest.hcl` variables (`git grep -n image_tag infra/`) and runbooks (14 hits in `envs/staging/aws/README.md`, 2 in `tests/README.md`).

---

### `infra/scripts/push-migrations.sh` (`--confirmed-ref`)

**Analog:** itself. Arg-parse case arm to copy:
```bash
    --ref)
      require_value --ref $#
      REF="$2"
      shift 2
      ;;
```
Refusals block (anchor: `# --- refusals: nothing is called and nothing is written before all of them hold`) uses `fatal "<message>; nothing was pushed" 2`. Put the `--confirmed-ref` checks there (equals `$REF`, `GITHUB_ACTIONS=true`, `OPENVAA_DEPLOY_ENVIRONMENT=staging` per amendment C-04). The tty gate to bypass only when confirmed:
```bash
  if ! (: <>/dev/tty) 2>/dev/null; then
    fatal "there is no terminal to confirm the push on; nothing was pushed" 2
  fi
```
Update the header usage/refusal list comments (anchor: `#   1. \`--ref\` is 20 lower-case letters.`) to name the new option.

### `infra/scripts/push-migrations.test.ts` (new)

**Analog:** `infra/scripts/build-push-image.test.ts`:
```ts
import { spawnSync } from 'node:child_process';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';

const HERE = dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = resolve(HERE, '../..');
const SCRIPT = join(HERE, 'build-push-image.sh');

function run(...args: Array<string>): { status: number | null; stdout: string; stderr: string } {
  const result = spawnSync('bash', [SCRIPT, ...args], {
    cwd: REPO_ROOT,
    encoding: 'utf8',
    env: {
      PATH: process.env.PATH ?? '',
      HOME: process.env.HOME ?? '',
      TMPDIR: process.env.TMPDIR ?? '/tmp',
      AWS_CONFIG_FILE: '/dev/null',
      AWS_SHARED_CREDENTIALS_FILE: '/dev/null'
    },
    timeout: 60_000
  });
  ...
```
Pass `GITHUB_ACTIONS` / `OPENVAA_DEPLOY_ENVIRONMENT` explicitly in `env` per case; assert `status === 2` and the stderr refusal text for each mismatch. Module TSDoc header as in the analog.

### `infra/scripts/build-push-image.sh` (CR-01) + test

**Analog:** itself. Self-test harness: `self_test()` function, `st_expect "<case-name>" has "$docker_calls" "..."`, results printed `self_test <name> PASS|FAIL`, summary `self_test summary cases=$ST_CASES failed=$ST_FAILED`; docker stub section (anchor: `# The docker stub.`). Add a case (e.g. `ignored-file-absent-from-context`) and append its name to the name list in `build-push-image.test.ts` (anchor: `for (const name of [`). Output contract to keep: exit 0 -> `image_tag=` + `image_digest=`; exit 3 -> one line `tag_exists=yes image_digest=$digest`.

### `infra/scripts/workflows.test.ts` (new guard tests)

**Analog:** `tests/tests/utils/deployedSmokeGuards.test.ts` (TSDoc block listing each guard and why lint cannot cover it; module-level regex constants such as `const REMOTE_SEED_SWITCH = /DEV_SEED_ALLOW_REMOTE|allow-remote|allowRemote/;`; `GITHUB_DIR = path.join(REPO_ROOT, '.github')`). Use the `node:`-prefixed import and `HERE/REPO_ROOT` style of `build-push-image.test.ts` (infra/vitest.config.ts collects `scripts/**/*.test.ts`). Parse with `js-yaml` (`load`). Scope id-token/permissions guards to the three new files only (`docs.yml` already uses `id-token: write`).

## Shared Patterns

### Exit statuses and result lines
**Source:** `infra/scripts/push-migrations.sh`, `build-push-image.sh` — status read on the next line, never through a pipe; `name=value` result lines; `fatal "<msg>" <code>`. Apply to every multi-line `run:` in the new workflows (e.g. `out=$(...); status=$?` then `case "$status" in 0|3)`).

### Action pinning and least privilege
**Source:** `main.yaml` `infra-validate` — `uses: <action>@<40-hex> # <tag>`, `persist-credentials: false`, job `permissions`. Apply to all three workflows.

### Secrets
Secrets via `env:` only, never `${{ secrets.* }}` inside `run:`; no `upload-artifact`; plan files in `$RUNNER_TEMP`; `terraform show -no-color` only (never `-json` to log).

### Comments
Comment hygiene style (no history, no `.planning` refs) applies by convention to `infra/` and `.github/` even though the gate scans only `apps packages tests`.

## No Analog Found

| File | Role | Data Flow | Reason |
|---|---|---|---|
| OIDC assume steps (`aws-actions/configure-aws-credentials`) | workflow step | auth | No workflow assumes an AWS role yet; use RESEARCH § Standard Stack SHA `e1253824e5c10ff9df46874f81ed3ec929e19cfd # v6.3.0` |
| Wrong-subject proof step | workflow step | auth | Use RESEARCH § Code Examples verbatim |
| Red-run commit | throwaway | - | Unresolvable import, proven locally per RESEARCH Pitfall 4 |
| GitHub Environments/secrets | settings | - | Not code; `gh api` read-back |

## Metadata

**Analog search scope:** `.github/workflows/`, `infra/modules/`, `infra/scripts/`, `infra/envs/`, `tests/tests/utils/`
**Files scanned:** ~12
**Pattern extraction date:** 2026-11-15
