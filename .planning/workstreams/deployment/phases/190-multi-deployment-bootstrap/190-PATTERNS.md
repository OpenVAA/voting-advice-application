# Phase 190: Multi-deployment bootstrap - Pattern Map

**Mapped:** 2026-11-24
**Files analyzed:** 33 new or modified files (grouped below by family)
**Analogs found:** 31 / 33 (two have only a partial analog: the resolve job's `outputs:` wiring and the move-proof harness's two-tree `terraform test`)

All paths are relative to the repository root `/home/user/voting-advice-application`. Line numbers are those of the tree at `e0b7d8189`.

## File Classification

| New/Modified File | Role | Data Flow | Closest Analog | Match Quality |
|---|---|---|---|---|
| `infra/bootstrap/main.tf` (M) | config (Terraform root) | transform (`for_each` over map) | itself + `infra/envs/staging/aws/main.tf` (thin root calling modules) | exact (self) |
| `infra/bootstrap/moves.tf` (N) | config (state refactor) | batch | `infra/modules/supabase/function-secrets.tf:39-42` (only `moved` block in tree) | role-match |
| `infra/bootstrap/variables.tf` (M) | config | request-response (input validation) | `infra/modules/supabase/variables.tf:108-127` (object var + validations), `:49-55` (`optional()`) | exact |
| `infra/bootstrap/terraform.tfvars` (M) | config | — | itself (keeps account-level values; comment style) | exact (self) |
| `infra/bootstrap/deployments.auto.tfvars.json` (N) | config (data) | file-I/O (read by TF + jq) | `infra/modules/supabase/hosted-settings.json` (JSON read by both TF `jsondecode(file())` and a vitest) | role-match |
| `infra/bootstrap/outputs.tf` (M) | config | transform (singular -> map) | itself | exact (self) |
| `infra/bootstrap/example.tfvars` (M) | config (template) | — | itself | exact (self) |
| `infra/bootstrap/tests/deployments.tftest.hcl` (N) | test (terraform) | batch (plan) | `infra/envs/example/aws/tests/plan.tftest.hcl` (root test, mock provider) + `infra/modules/github-oidc/tests/github_oidc.tftest.hcl` (asserts on names/policies) | exact |
| `infra/bootstrap/README.md` (M) | doc (runbook) | — | itself, Step 3 / Step 9 | exact (self) |
| `infra/modules/github-oidc-provider/{main,outputs}.tf` (N) | module | CRUD (one resource) | `infra/modules/github-oidc/main.tf:5-20`, `outputs.tf:1-4` | exact (extract) |
| `infra/modules/github-oidc/main.tf` (M) | module | CRUD | itself | exact (self) |
| `infra/modules/github-oidc/variables.tf` (M) | module config | validation | itself (`:131-276`) | exact (self) |
| `infra/modules/github-oidc/policies.tf` (M) | module (IAM) | CRUD | itself (`plan_deny` `:82-142`, `ecr_push` `:74-79`) | exact (self) |
| `infra/modules/github-oidc/deploy-policies.tf` (M) | module (IAM) | CRUD | itself (`root_tags` `:11-14`, `deploy_dns` `:545-550`) | exact (self) |
| `infra/modules/github-oidc/outputs.tf` (M) | module | — | itself | exact (self) |
| `infra/modules/github-oidc/tests/github_oidc.tftest.hcl` (M) | test (terraform) | batch | itself | exact (self) |
| `infra/scripts/resolve-deployment.sh` (N) | utility (CLI) | transform (JSON map -> `key=value` / `$GITHUB_OUTPUT`) | `infra/scripts/check-destroy-plan.sh` (jq over JSON, named result lines, exit 0/1/2) | role-match |
| `infra/scripts/resolve-deployment.test.ts` (N) | test (vitest, runs script) | request-response | `infra/scripts/check-destroy-plan.test.ts` | exact |
| `infra/scripts/check-bootstrap-plan.sh` (N) | utility (guard) | transform (plan JSON -> verdict) | `infra/scripts/check-destroy-plan.sh` | exact |
| `infra/scripts/check-bootstrap-plan.test.ts` (N) | test (vitest, fixture JSON) | request-response | `infra/scripts/check-destroy-plan.test.ts` | exact |
| `infra/scripts/check-bootstrap-moves.sh` (N) | utility (harness) | batch (git archive + terraform test) | `infra/scripts/build-push-image.sh:117-127,189-202` (temp dir, `git archive`, trap) + `terraform-checks.sh` (terraform runner) | partial |
| `infra/scripts/terraform-checks.sh` (M) | utility (CI runner) | batch | itself (`plan_examples` `:108-125`) | exact (self) |
| `infra/scripts/terraform-checks.test.ts` (M) | test (stub terraform) | batch | itself | exact (self) |
| `infra/scripts/push-migrations.sh` (M) | utility | request-response (refusals) | itself `:79`, `:180-196` | exact (self) |
| `infra/scripts/push-migrations.test.ts` (M) | test | request-response | itself `:120-195` | exact (self) |
| `infra/scripts/bootstrap-tfvars.test.ts` (M, rewrite) | test (text guard) | file-I/O | itself + `hosted-settings-reference.test.ts` (JSON source parse) | exact (self) |
| `infra/scripts/rootCopies.test.ts` (M, generalise) | test (text guard) | file-I/O | itself `:16-20` | exact (self) |
| `infra/scripts/workflows.test.ts` (M) | test (workflow guard, cross-file) | file-I/O | itself | exact (self) |
| `infra/scripts/{deploy,destroy,infra-plan}-workflow.test.ts` (M) | test (workflow guard) | file-I/O | themselves | exact (self) |
| `infra/scripts/workflow-errexit.test.ts` (M) | test (step runner) | batch | itself | exact (self) |
| `.github/workflows/{deploy,destroy,infra-plan}.yml` (M) | CI workflow | event-driven | themselves; resolve-job `outputs:` from `.github/workflows/claude.yml:22-30,145-148` | exact (self) / partial (outputs) |
| `tests/tests/utils/deployedTarget.ts` (+ `.test.ts`, `tests/playwright.deployed.config.ts`) (M) | utility (smoke gate) | request-response | itself; env reader `readSmokeAccessCallerMax` `:440-450` | exact (self) |
| `infra/README.md`, `infra/envs/example/**`, docs `deployment/+page.md` (M) | doc | — | themselves (§ Roots `:39-42`, § Accepted risks `:415-439`, § Example environment `:442+`) | exact (self) |

---

## Pattern Assignments

### `infra/bootstrap/moves.tf` (new, state refactor)

**Analog:** `infra/modules/supabase/function-secrets.tf` lines 39-42, the only `moved` block in the tree. Style: bare block, `from` / `to` aligned, no comment inside, one blank line between blocks.

```hcl
moved {
  from = supabase_edge_function_secrets.this[0]
  to   = supabase_edge_function_secrets.this
}
```

Apply it to the four moves in RESEARCH Pattern 1 (`module.github_oidc.aws_iam_openid_connect_provider.github` -> `module.github_oidc_provider.aws_iam_openid_connect_provider.github`; `module.github_oidc` -> `module.github_oidc["staging"]`; same for `frontend_task_role` and `registry`). `state_bucket` and `budget` stay at root, so they get no block. A file-top comment, if any, follows the one-paragraph `#` style of `infra/bootstrap/backend.tf:1-4` and states what the blocks do now (comment hygiene: no "previously", no phase refs beyond `see phase 190`).

---

### `infra/bootstrap/main.tf` (modified)

**Analog:** itself. Keep the header shape (lines 1-28) and the root-level prose comment (line 30, "The root declares no resource of its own"). Current single calls to convert (lines 38-42, 52-81):

```hcl
module "registry" {
  source = "../modules/registry"

  repository_name = var.registry_name
}
...
module "github_oidc" {
  source = "../modules/github-oidc"

  name_prefix                = var.name_prefix
  iam_path                   = var.iam_path
  environment                = var.deploy_environment
  ...
  frontend_execution_role_arn = module.frontend_task_role.execution_role_arn
  hosted_zone_id              = var.deploy_hosted_zone_id
  domain                      = var.deploy_domain
}
```

Conventions to keep: two blank-line-separated argument groups inside a module block (identity args, then account/ARN args), aligned `=` (terraform fmt). Under `for_each = var.deployments`, cross-module refs become `module.frontend_task_role[each.key].execution_role_arn` and `module.registry[each.key].repository_arn`; `oidc_provider_arn = module.github_oidc_provider.oidc_provider_arn`. Derived values (`pipeline_state_key = "pipeline/${each.key}/aws/terraform.tfstate"`, `environment = each.key`) go in a `locals` block or inline, never as map input (D3). Provider `default_tags` (lines 20-27, `Environment = "shared"`) stays unchanged.

---

### `infra/bootstrap/variables.tf` (modified)

**Analog for an object-typed variable with validation:** `infra/modules/supabase/variables.tf` lines 108-127:

```hcl
variable "identity_provider" {
  description = "..."
  type = object({
    type      = string
    client_id = string
    jwks_uri  = string
    issuer    = string
  })
  default = null

  validation {
    condition     = var.identity_provider == null || contains(["signicat-ftn", "idura-ftn"], try(var.identity_provider.type, ""))
    error_message = "identity_provider.type must be signicat-ftn or idura-ftn."
  }
```

**`optional()` analog:** same file lines 49-55 (`rate_limit_otp = optional(number, 30)`). Use `optional(string)` (no default) for `registry_name`, `iam_name_prefix`, `environment`, and compute the default in `locals` with `coalesce`.

**Validation wording analog:** `infra/bootstrap/variables.tf:155-163` and `infra/modules/github-oidc/variables.tf:151-156`:

```hcl
  validation {
    condition     = startswith(var.pipeline_state_key, "pipeline/") && endswith(var.pipeline_state_key, "/terraform.tfstate")
    error_message = "pipeline_state_key must lie under pipeline/ and name a terraform.tfstate object."
  }
```

Error messages: one sentence, name the variable, say what it "must" be. Validations to write (D3): key regex `^[a-z][a-z0-9-]*$`, `length("${var.name_prefix}-${key}-frontend") <= 32`, digits-only ids (copy `github-oidc/variables.tf:176-179`), subjects `repo:` prefix and no `*`/`?` (copy `:151-156` per entry), distinct domains / zone+domain / registry names / repo-id+subject sets across entries (`length(distinct([...])) == length(...)`). Descriptions: one paragraph, plain prose, as in lines 82-173. Remove the flat `deploy_environment`, `plan_subjects`, `deploy_subjects`, `github_repository_id`, `github_repository_owner_id`, `deploy_hosted_zone_id`, `deploy_domain`, `pipeline_state_key`, `frontend_environment`, `registry_name` (moved into the map). Note RESEARCH Pattern 2: the move-proof harness's `pre_map` run uses the base tree's flat variables, so either keep them resolvable from `terraform.tfvars` or pass them in the harness's `run "pre_map" { variables { ... } }`.

---

### `infra/bootstrap/deployments.auto.tfvars.json` (new)

**Analog:** `infra/modules/supabase/hosted-settings.json`, read by Terraform (`infra/modules/supabase/settings.tf:8`, `hosted = jsondecode(file("${path.module}/hosted-settings.json"))`) and parsed in vitest (`infra/scripts/hosted-settings-reference.test.ts:112-121`, `JSON.parse` with a named problem on invalid JSON). Here Terraform auto-loads it as a tfvars (`*.auto.tfvars.json`), so the top level is `{ "deployments": { "staging": { ... } } }`. Values for staging are the current `infra/bootstrap/terraform.tfvars:14-35` values byte for byte (subjects, ids `546467466`/`115159211`, zone `Z02494181MAM7OCUAIPKC`, domain `staging.openvaa.org`), plus `registry_name: "openvaa-frontend"`, `iam_name_prefix: "openvaa"`, `environment` names, `deploy_branches: ["deploy/staging", "deploy-evidence/*"]`. JSON has no comments: the explanatory prose that lives in `terraform.tfvars:13-35` today moves to `infra/bootstrap/README.md` and to the variable descriptions.

---

### `infra/bootstrap/tests/deployments.tftest.hcl` (new)

**Analog 1 (root-level test with mocks):** `infra/envs/example/aws/tests/plan.tftest.hcl` lines 1-4, 76-80, 107-118. Header comment explains why mocks are used; `mock_provider "aws"` with `mock_resource ... defaults` giving ARNs "of the right form"; `override_data` for a module data source; `variables {}` only for what tfvars leaves to the shell:

```hcl
# Plans the whole template root offline. The providers are mocks because ...

# The mocks' generated values are random strings. The provider checks some of the arguments that receive them, so the resources whose ARNs feed such an argument get ARNs of the right form.
mock_provider "aws" {
  mock_resource "aws_lb" {
    defaults = {
      arn     = "arn:aws:elasticloadbalancing:eu-north-1:000000000000:loadbalancer/app/openvaa-example/0000000000000000"
...
override_data {
  target = module.frontend.data.aws_availability_zones.available
  values = {
    names = ["eu-north-1a", "eu-north-1b"]
  }
}

# Only the inputs terraform.tfvars leaves to the shell that runs the apply.
variables {
  alert_email  = "alerts@example.org"
```

and line 141-142 for the module-boundary limit: "A root test cannot reach a module's resources, so ... is read through the module's outputs." That forces the name pins (staging's `openvaa-plan`, `openvaa-staging-deploy`, eleven policy names, `openvaa-staging-frontend-execution`, `openvaa-frontend`, `openvaa-monthly`) to go through module outputs, so `github-oidc` likely needs a `policy_names` output (map) for the test.

**Analog 2 (assert style):** `infra/modules/github-oidc/tests/github_oidc.tftest.hcl` lines 30-53 and 55-91. One `run "<snake_case_property>"` per property, `command = plan`, `assert { condition = (...) error_message = "<Sentence that says what must hold>." }`:

```hcl
run "policy_sizes" {
  command = plan
  ...
  assert {
    condition = alltrue([
      for p in [ aws_iam_policy.deploy_network, ... ] : p.path == "/openvaa/" && startswith(p.name, "openvaa-deploy-")
    ])
    error_message = "Every deploy policy must lie under /openvaa/ and be named openvaa-deploy-<concern>."
  }
}
```

**Per-run variable override for the two-entry case:** `github_oidc.tftest.hcl:217-236` (`variables { ... }` inside a `run`). Feed the stand-in second entry there (`nuorten-2027` shape with `Z0000...` zone, `vaa.example.org`-style domain, `repo:EXAMPLE-ORG@1234567/...` subjects, as `infra/bootstrap/example.tfvars:18-25`). Because the root also auto-loads `deployments.auto.tfvars.json`, a run that sets `deployments` replaces the whole map, so include staging's entry verbatim in that run.

**Validation refusals:** `infra/modules/supabase/tests/settings.tftest.hcl:369-384`:

```hcl
run "identity_provider_refuses_an_unknown_type" {
  command = plan

  variables {
    identity_provider = { type = "bankid", ... }
  }

  expect_failures = [var.identity_provider]
}
```

Use for: key over 15 characters, bad key regex, duplicate domain, duplicate registry name.

Wiring: add `infra/bootstrap` to `terraform-checks.sh` (see below); `infra/bootstrap/.terraform.lock.hcl` already exists, so the init uses `-lockfile=readonly` as `plan_examples` does.

---

### `infra/modules/github-oidc-provider/` (new module)

**Analog:** extract from `infra/modules/github-oidc/main.tf` lines 5-20 (terraform block + the one resource with its comment) and `outputs.tf` lines 1-4. Copy the `terraform { required_version = "~> 1.16" required_providers { aws ... "~> 6.60" } }` block verbatim (it is identical in every module, e.g. `infra/modules/registry/main.tf:1-10`). Header comment states the account-wide rule (one provider per issuer URL) in present tense. Resource address must stay `aws_iam_openid_connect_provider.github` so the `moved` target is `module.github_oidc_provider.aws_iam_openid_connect_provider.github`.

```hcl
# No thumbprint list: for GitHub, AWS validates the provider against its own library of trusted certificate authorities and ignores any configured thumbprint.
resource "aws_iam_openid_connect_provider" "github" {
  url            = "https://token.actions.githubusercontent.com"
  client_id_list = ["sts.amazonaws.com"]
}
```

---

### `infra/modules/github-oidc/*.tf` (modified)

**Header comment to rewrite** (`main.tf:1-3`) currently says "one account hosts one deployment environment"; it must describe the new state (one call per deployment, provider passed in) without history.

**Trust policy:** `main.tf:24-106`. Replace `identifiers = [aws_iam_openid_connect_provider.github.arn]` (lines 31, 73) with `[var.oidc_provider_arn]`. The `dynamic "condition"` blocks on `github_repository_id`/`owner_id` (lines 46-62, 88-104) become plain `condition` blocks once the ids are required (D3, D8 step 2: in-place). Keep `null` handling until step 2 if the pure move must render the same JSON.

**Names that must not change for staging** (ForceNew on `name`, `path`, `description`):
- `main.tf:110` `name = "${var.name_prefix}-plan"` -> needs `iam_name_prefix` (staging `openvaa`).
- `main.tf:116` `name = "${var.name_prefix}-${var.environment}-deploy"` -> formula unchanged.
- `policies.tf:43` `"${var.name_prefix}-tfstate-${var.environment}-aws"` -> unchanged.
- `policies.tf:75` `"${var.name_prefix}-ecr-push"`, `:138` `"${var.name_prefix}-plan-deny"`, `deploy-policies.tf:60,218,290,340,368,498,546,620,689` `"${var.name_prefix}-deploy-<concern>"` -> switch to the per-entry IAM prefix.
- `deploy-policies.tf:548` description `"Change the frontend's A, AAAA and CNAME records in the staging zone, and no other record."` -> render the word from a variable whose staging value reproduces this text byte for byte.

Keep `name_prefix` itself for the resource-name formulas the deploy policies scope to (`deploy-policies.tf:4-5`, `local.frontend_name`, `deployments_topic`), because those mirror `frontend-service` names.

**Environment tag scope (D8 step 2):** `deploy-policies.tf:11-14`:

```hcl
  # The tags the root's providers set on every resource they create.
  root_tags = {
    Project = "openvaa"
    Root    = "aws"
  }
```

Add `Environment = var.environment`; every `dynamic "condition" { for_each = local.root_tags ... }` (lines 89, 109, 125, 147, 169, 207, 249, 404, 424, 452, 471, 487) picks it up.

**Plan-deny narrowing (D6):** `policies.tf:104-110`, change `not_resources = ["${var.state_bucket_arn}/pipeline/*"]` to the entry's own key (and its `.tflock` is not needed: the plan role holds no lock). Keep the comment above it accurate.

**New variables** follow `variables.tf:131-276`: one `description` sentence or two, `type`, optional `default`, `validation` with `can(regex(...))` and an error message naming the variable. `oidc_provider_arn` validation can copy the ARN regex style of `frontend_execution_role_arn` (`:248-256`).

---

### `infra/modules/github-oidc/tests/github_oidc.tftest.hcl` (modified)

**Analog:** itself. Real provider with fake keys (lines 5-13, keep as is), file-level `variables {}` (lines 15-28) gains `oidc_provider_arn` (and `iam_name_prefix` etc.). Since the provider resource leaves the module, nothing in the module creates it; a literal stand-in ARN `arn:aws:iam::000000000000:oidc-provider/token.actions.githubusercontent.com` is enough. Extend:
- `creates_carry_request_tags` (lines 217-264): add `aws:RequestTag/Environment` == `"staging"` to the condition, same `contains(flatten([for op, kv in s.Condition : try(flatten([kv["aws:RequestTag/Environment"]]), [])]), "staging")` shape.
- `plan_deny_object_reads` (lines 372-413): expected `NotResource` becomes `["arn:aws:s3:::openvaa-tfstate-000000000000/pipeline/staging/aws/terraform.tfstate"]` (or the chosen narrowing).
- `ecr_describe_images` (lines 93-112) already pins the one repository ARN.
- New run pinning the trust's `repository_id` condition is mandatory (no `null`).
- `policy_sizes` (lines 75-90) asserts `startswith(p.name, "openvaa-deploy-")`; keep it true for staging's prefix and add a second-entry run showing `openvaa-nuorten-2027-deploy-` (or the chosen default).

---

### `infra/scripts/check-bootstrap-plan.sh` (new)

**Analog:** `infra/scripts/check-destroy-plan.sh` (whole file, 153 lines). Copy its skeleton exactly:

**Header** (lines 1-34): `#!/usr/bin/env bash`, `#`, `# <name>.sh -- <one sentence>.`, a paragraph of what it reads "and nothing else", the named result lines it prints (one per line, `name=<n>   meaning`), `# Usage:`, flag list with `REQUIRED.`/`OPTIONAL.`, `-h, --help  Print this header and exit 0.`, `# For a caller: read the status directly, never through a pipe.`, `# Exit codes:` table, `` # `set -x` must not be added. ``. The header ends at `set -euo pipefail` because `cli.sh`'s `usage`/`print_header` read lines 2..`set -euo pipefail` (`scripts/lib/cli.sh:10-22`).

**Prologue** (lines 36-45):

```bash
set -euo pipefail
set -f

export LC_ALL=C

SCRIPT_PATH="${BASH_SOURCE[0]}"
SCRIPT_NAME="check-destroy-plan.sh"
USAGE_LINE="--plan-json <file> --state-list <file> | -h | --help"
# shellcheck source=../../scripts/lib/cli.sh
. "$(dirname "$SCRIPT_PATH")/../../scripts/lib/cli.sh"
```

**Core: one jq program in a shell variable, counts returned space-separated** (lines 50-65):

```bash
PLAN_COUNTS='
  if type != "object" then error("not a plan document") else . end
  | if (.resource_changes | type) != "array" then error("resource_changes is not a list") else . end
  | (.resource_changes | map(select(.mode == "managed"))) as $managed
  ...
  | map(tostring)
  | join(" ")
'
```

**Status capture and fail-closed on unreadable input without printing it** (lines 93-100):

```bash
  rc=0
  counts="$(jq -r --arg state "$addresses" "$PLAN_COUNTS" "$PLAN_JSON" 2> /dev/null)" || rc=$?
  if [ "$rc" -ne 0 ]; then
    echo "check-destroy-plan.sh: the plan file is not a plan document (jq exited $rc)" >&2
    echo "destroy_guard=fail"
    exit 1
  fi
  read -r planned outside other unmatched <<< "$counts"
```

**Verdict lines then exit** (lines 102-115): compute `guard=pass|fail`, echo every `bootstrap_plan_*=<n>` line, last line `bootstrap_plan_guard=pass|fail`, `[ "$guard" = pass ] || exit 1`.

**Argument loop** (lines 118-151): `main()` with `-h|--help` -> `print_header; exit 0`, `while` / `case` with `[ "$#" -ge 2 ] || usage_error "--x requires a value"`, then required checks, `[ -f ... ] && [ -r ... ] || usage_error`, `command -v jq > /dev/null || usage_error "jq is not on the PATH"`, `check`, `exit 0`; file ends `main "$@"`.

Rule content from RESEARCH § Code Examples (no `delete` in any managed action; every change with `previous_address` is `["no-op"]` or `["update"]`; `["create"]` only under `["<new-key>"]`). Suggested lines: `bootstrap_plan_delete=`, `bootstrap_plan_replace=`, `bootstrap_plan_moved=`, `bootstrap_plan_unexpected_create=`, `bootstrap_plan_update=`, `bootstrap_plan_guard=`. A flag such as `--new-key <key>` (repeatable) and optionally `--expect-moved <n>` / `--pure-move` (0 update allowed) for D8 step 1. Inputs: both `terraform show -json` and the `test_plan` object of `terraform test -json` (the harness should extract `.test_plan` with jq to a file, so the guard reads one shape).

---

### `infra/scripts/check-bootstrap-plan.test.ts` (new)

**Analog:** `infra/scripts/check-destroy-plan.test.ts`. Copy:
- TSDoc file header (lines 1-5): what runs, "No plan is made and no account is read. The child gets a minimal environment, so no credential of the shell that runs the suite reaches it."
- Imports (lines 7-12): `node:child_process` `spawnSync`, `node:fs` `mkdtempSync, rmSync, writeFileSync`, `node:os` `tmpdir`, `node:path`, `node:url` `fileURLToPath`, `vitest` `afterEach, describe, expect, it`.
- Fixture builder `planJson(changes)` (lines 36-49); extend `ResourceChange` with `previous_address?: string` and `replace_paths?: Array<Array<string>>` and put them where Terraform puts them (`previous_address` at entry level, `replace_paths` under `change`).
- `run(args)` with `env: { PATH: process.env.PATH ?? '', HOME: process.env.HOME ?? '' }, timeout: 30_000` (lines 56-63).
- `dirs` + `afterEach` cleanup (lines 30-34); `lines(stdout)` parser (lines 76-84).
- Cases: exact `toBe` of the full stdout for the pass case (lines 91-97), `toMatchObject` on `lines()` for each red case, non-JSON input never echoed (lines 231-245, `PLAN-CONTENT-DO-NOT-PRINT`), `it.each` usage errors exit 2 (lines 247-258), `--help` exits 0 (lines 260-265).
- Fixture set from VALIDATION Wave 0: clean move (all `no-op` with `previous_address`), a replace (`["delete","create"]`, `replace_paths [["name"]]`), a delete, a stray create (create outside `--new-key`), a create under the new key (passes), an update (passes only when not `--pure-move`), data-mode entries ignored.

---

### `infra/scripts/resolve-deployment.sh` (new)

**Analog:** `infra/scripts/check-destroy-plan.sh` for skeleton (header, prologue, jq-in-a-variable, named lines, exit 0/1/2, `main()` loop) and `infra/scripts/running-image-digest.sh:1-39` for a header that names its caller context and prints `name=value` lines a workflow step parses. Header convention for the stdout contract, from `running-image-digest.sh:27`:

```bash
# For a caller: read the status directly, never through a pipe. Status 0 prints three lines, `running_task_definition=`, `running_image_reference=digest|tag` and `running_image_digest=`. Status 1 prints the lines of the steps that passed and one `failed=` line. ...
```

Flags (RESEARCH Pattern 3): `--map <file>` (default `infra/bootstrap/deployments.auto.tfvars.json` resolved against the repo root, as `cli.sh` `resolve_path` does, `scripts/lib/cli.sh:55-61`, which needs `REPO_ROOT` set as in `push-migrations.sh:73-74`), `--repository-id <id>`, `--ref <ref_name>` or a mode for the PR plan (list every owned entry as a JSON array for `fromJSON` in a matrix), optional `--github-output <file>` (or write to `$GITHUB_OUTPUT` when set). Account id, region, name prefix and IAM path come from `infra/bootstrap/terraform.tfvars`; `cli.sh` already has a reader pattern for key = "value" files (`toml_value`, `scripts/lib/cli.sh:63-79`), and `deploy.yml:123` reads tfvars with `sed -n 's/^registry_url *= *"\(.*\)"$/\1/p'`. Exit codes: 0 resolved; 1 no entry / two entries / foreign repository / key fails regex / `infra/envs/<key>/aws` missing / `DEPLOY_ENVIRONMENT` given and different (CONTEXT D5); 2 usage error or no jq. Branch matching: exact names and one-segment `<prefix>/*` (mirror GitHub's environment branch-policy semantics; `push-migrations.sh:191` uses `refs/heads/deploy-evidence/?*` in a `case` for the same idea). Output lines named like `deployment_key=`, `deployment_domain=`, `deploy_role_arn=`, `plan_role_arn=`, `topic_arn=`, `cluster_name=`, `service_name=`, `aws_root=infra/envs/<key>/aws`, `supabase_root=`, `state_key=`, `environment=`, `destroy_environment=`, `destroy_branch=`, `destroy_confirm=` (formulas: RESEARCH § Derived ARNs). Never `set -x`; values are non-secret.

---

### `infra/scripts/resolve-deployment.test.ts` (new)

**Analog:** `infra/scripts/check-destroy-plan.test.ts` (fixture files written to `mkdtempSync`, script run by `spawnSync('bash', [SCRIPT, ...args])` with a minimal env). For the `infra/envs/<key>/aws`-exists check, build a throwaway repo tree and copy the script and `scripts/lib/cli.sh` into it, as `infra/scripts/terraform-checks.test.ts:57-91` does:

```ts
  mkdirSync(join(repo, 'infra', 'scripts'), { recursive: true });
  copyFileSync(SCRIPT, join(repo, 'infra', 'scripts', 'terraform-checks.sh'));
  mkdirSync(join(repo, 'scripts', 'lib'), { recursive: true });
  copyFileSync(CLI, join(repo, 'scripts', 'lib', 'cli.sh'));
  for (const dir of tree.roots) mkdirSync(join(repo, dir), { recursive: true });
```

Red cases (RESEARCH Pattern 3): unknown ref, foreign repository id, two matches, key failing regex, missing `infra/envs/<key>/aws`, `DEPLOY_ENVIRONMENT` mismatch. Also one green case run against the **real** `infra/bootstrap/deployments.auto.tfvars.json` with `--repository-id 546467466 --ref deploy/staging` that pins today's literals (`arn:aws:iam::471112560111:role/openvaa/openvaa-staging-deploy`, `openvaa-plan`, `arn:aws:sns:eu-north-1:471112560111:openvaa-staging-frontend-deployments`, `openvaa-staging` / `openvaa-staging-frontend`), so the derived values keep the role of the deleted literal pins in `workflows.test.ts:521-555`. Exit-code `it.each` and `--help` cases as in `check-destroy-plan.test.ts:247-265`.

---

### `infra/scripts/check-bootstrap-moves.sh` (new, phase-verification harness)

**Partial analogs:**
- Temp workspace + trap: `infra/scripts/build-push-image.sh:117-127` and `:509-510`:

```bash
make_workdir() {
  WORK="$(umask 077; mktemp -d "${TMPDIR:-/tmp}/openvaa-build-push.XXXXXX")"
}

on_exit() {
  ...
  [ -z "$WORK" ] || rm -rf "$WORK"
}
...
  trap on_exit EXIT
  trap 'exit 130' INT TERM HUP
```

- `git archive` into a file then extract, failing by named step: `build-push-image.sh:189-202`:

```bash
  if ! git -C "$REPO" archive --format=tar -o "$WORK/context.tar" "$SHA" 2> /dev/null; then
    fail_step context "the commit could not be archived"
  fi
  if ! "$TAR" -x -f "$WORK/context.tar" -C "$WORK/context" 2> /dev/null; then
    fail_step context "the commit's archive could not be extracted"
  fi
```

  Here: `git archive "$BASE" infra/bootstrap infra/modules` into `$WORK/base/`, and the working tree's `infra/bootstrap` + `infra/modules` copied into `$WORK/tree/`.
- Terraform invocation style: `terraform -chdir="$root" init -backend=false -input=false -lockfile=readonly` (`terraform-checks.sh:78`, `:118-119`). The harness test file (Pattern 2 of RESEARCH) is written by the script into `$WORK/tree/infra/bootstrap/tests/move.tftest.hcl`, not tracked.
- Output: `terraform test -json -verbose`, jq-select the `test_plan` of run `map` into a file, then call `check-bootstrap-plan.sh --plan-json <file>` and propagate its status; print its lines unchanged (as `destroy.yml` prints `check-destroy-plan.sh` lines). Also run the unchanged-tree control (RESEARCH Pitfall 4): plan base-on-base and require a clean guard before trusting the real result.
- Header/prologue/exit codes as for every `infra/scripts/*.sh` (see Shared Patterns). Usage `--base <commit> | -h | --help`; exit 0 clean, 1 guard fail, 2 usage / no terraform / no jq / base not a commit, other = terraform's status (as `terraform-checks.sh:17-21`).

No vitest test is required by VALIDATION for this harness; if one is wanted, copy the stub-`terraform` approach of `terraform-checks.test.ts:72-77`.

---

### `infra/scripts/terraform-checks.sh` (modified) and `terraform-checks.test.ts`

**Analog:** itself. `plan_examples` (lines 108-125) is the template for a new check (`test-roots` or folding `infra/bootstrap` into a tested set):

```bash
plan_examples() {
  local tests root
  local -a required=()
  ...
  REACHED=()
  for tests in infra/envs/example/*/tests/; do
    root="${tests%/tests/}"
    echo "::group::$root"
    terraform -chdir="$root" init -backend=false -input=false -lockfile=readonly
    terraform -chdir="$root" test -verbose -no-color
    echo "::endgroup::"
    REACHED+=("$root")
  done
  require_reached "example roots planned" "Its tests directory is missing or the glob no longer reaches it." "${required[@]}"
```

Keep every array one bare entry per line, because `terraformChecksLists.ts:18-26` parses them with a regex (`^${name}=\(\n((?:[ \t]+\S+\n)+)\)$`). A new check name must be added to `USAGE_LINE` (line 28), the header's check list (lines 7-10), the `case` lists (lines 129-144), and an `infra-plan.yml` step (copy lines 55-65 there, `if: ${{ !cancelled() }}`). Test: copy the `describe('terraform-checks.sh validate'...)` block (lines 102-120) with a tree holding `infra/bootstrap/tests`; the `FULL_TREE` constant (lines 37-41) gains it. `REQUIRED_ROOTS` today lists `infra/envs/staging/*`; Pitfall 12 says the downstream root set must validate too, which the glob `infra/envs/*/*/` (line 75) already covers.

---

### `infra/scripts/push-migrations.sh` (modified) and `push-migrations.test.ts`

**Analog:** itself. The literal to replace: line 79 `CONFIRMING_ENVIRONMENT="staging"`; the checks at lines 180-196:

```bash
  if [ "${OPENVAA_DEPLOY_ENVIRONMENT:-}" != "$CONFIRMING_ENVIRONMENT" ]; then
    fatal "--confirmed-ref is accepted only in a job of the $CONFIRMING_ENVIRONMENT environment, ...; nothing was pushed" 2
  fi
  case "${GITHUB_REF:-}" in
    refs/heads/deploy/staging | refs/heads/deploy-evidence/?*) ;;
    *)
      fatal "--confirmed-ref is accepted only on refs/heads/deploy/staging or a refs/heads/deploy-evidence/ branch; GITHUB_REF is '${GITHUB_REF:-}'; nothing was pushed" 2
      ;;
  esac
```

Add a flag (pattern: `--confirmed-ref` block lines 151-158 with `require_value` and the empty-value refusal) such as `--deployment <key>`, validated against the key regex and against the existence of `infra/envs/<key>/supabase/terraform.tfvars` under `REPO_ROOT`, defaulting to nothing (confirmed form refused without it), and compare it with `OPENVAA_DEPLOY_ENVIRONMENT`; the ref check becomes `refs/heads/deploy/<key>` or `refs/heads/deploy-evidence/?*`. Update the header text in the same places that name staging: lines 11, 25, 34, 46, 56 (header is the `--help` output, so it must stay accurate). The test fixture `PIPELINE_ENV` (test lines 120-124) and the refusal `it.each` (lines 176-185) gain the key argument; add a case for a second key with its own `infra/envs/<key>/supabase/terraform.tfvars` in the `makeRoot()` tree (lines 68-86) and a refusal for a key whose directory is missing.

---

### `infra/scripts/bootstrap-tfvars.test.ts` (rewrite)

**Analog:** itself (TSDoc header lines 1-3, `describe`/`it` naming in plain sentences) plus `hosted-settings-reference.test.ts:112-121` (JSON parse with a named problem). The regex readers `stringValue`/`listValue` (lines 25-34) give way to `JSON.parse(readFileSync('infra/bootstrap/deployments.auto.tfvars.json'))` for the per-entry facts, while account-level values stay regex-read from `terraform.tfvars`. Keep the module-text assertions (lines 70-102: no `job_workflow_ref`, no `plan_lock`, plan role attachments exactly `ReadOnlyAccess` + `plan_deny`, lock statement shape) unchanged. Add:
- schema subset test (Pitfall 6): every entry's keys are a subset of the attribute names parsed from `variable "deployments"`'s `object({ ... })` in `infra/bootstrap/variables.tf` (parse with the `block()` helper, lines 45-51), and the parse is shown non-vacuous (finds the known attribute names);
- staging entry pins (ids `546467466`/`115159211`, the three subjects of lines 59-68);
- distinctness across entries.

---

### `infra/scripts/rootCopies.test.ts` (generalise)

**Analog:** itself, lines 15-20:

```ts
const FAMILIES: ReadonlyArray<{ name: string; roots: ReadonlyArray<string>; identical: ReadonlyArray<string> }> = [
  { name: 'aws', roots: ['staging/aws', 'example/aws'], identical: ['variables.tf', 'outputs.tf'] },
  { name: 'dns-mail', roots: ['staging/dns-mail', 'example/dns-mail'], identical: ['variables.tf'] },
  { name: 'supabase', roots: ['staging/supabase', 'example/supabase', 'scratch/supabase'], identical: ['variables.tf'] }
];
```

Build `roots` from `readdirSync(ENVS)` (every `<name>/<family>` that exists, `staging/<family>` first; `scratch` kept only for supabase as today), and keep a non-vacuous assertion that the list contains `staging/aws` and `example/aws`.

---

### `.github/workflows/deploy.yml`, `destroy.yml`, `infra-plan.yml` (modified)

**Analog:** themselves. Conventions every edit must keep:
- File header comment block (deploy lines 3-25, destroy 3-31, infra-plan 3-13) describes the run in numbered stages; rewrite to name "the deployment the resolve job picks" instead of staging, in present tense.
- `on.push.branches` static lists (deploy 27-33, destroy 33-41): per D5 become `deploy/*`, `deploy-evidence/**`, `!deploy-evidence/destroy-*` (deploy) and `deploy-evidence/destroy-*` (destroy). `workflows.test.ts` `no-main-push` (lines 163-182) refuses a pattern that `startsWith('*')` or contains `main`; `deploy/*` passes it.
- `concurrency:` (deploy 35-40, destroy 43-48): constant group replacing `staging-aws`, `cancel-in-progress: false`, keep the explaining comment.
- `permissions: {}` top-level; each job `permissions:` explicit; checkout `persist-credentials: false`; actions pinned by SHA with `# vX` comment (deploy 52-55, 57-61, 107-114) — copy the exact `uses:` lines.
- **No `${{ }}` inside `run:`** (`workflowGuards.ts` rule `no-expression-in-run`, lines 172-180): every resolved value reaches a script through `env:`, e.g. deploy 209-217:

```yaml
      - name: "Plan the staging AWS root with the built digest"
        id: plan
        env:
          DIGEST: ${{ steps.build.outputs.digest }}
          TF_VAR_alert_email: ${{ secrets.ALERT_EMAIL }}
        run: |
          set -uo pipefail
          plan_exit=0
          terraform -chdir=infra/envs/staging/aws plan -input=false -no-color -var "image_digest=$DIGEST" -out="$RUNNER_TEMP/tfplan" || plan_exit=$?
```

  So `-chdir=infra/envs/staging/aws` becomes `-chdir="$AWS_ROOT"` with `AWS_ROOT: ${{ needs.resolve.outputs.aws_root }}` in `env:`. The `apply-root` rule in `workflows.test.ts:156-161` matches the literal `-chdir=${APPLY_ROOT}`; it must be rewritten to accept exactly the resolved-variable form (e.g. `-chdir="$AWS_ROOT"` with `AWS_ROOT` bound to `needs.resolve.outputs.aws_root` in the step's `env`), keeping its red cases.
- Status reads only as `cmd || name=$?` after `name=0` (rule `status-read-after-or`).
- `with:` inputs may hold expressions (they are not `run:`): `role-to-assume: ${{ needs.resolve.outputs.deploy_role_arn }}`, `environment: { name: ${{ needs.resolve.outputs.environment }}, url: https://${{ needs.resolve.outputs.domain }} }`. `allowed-account-ids: "471112560111"` and `aws-region: eu-north-1` may stay literal (single account per CONTEXT) or come from resolve; the tests at `deploy-workflow.test.ts:248-261` and `destroy-workflow.test.ts:203-219` pin them.
- **Resolve job, partial analog:** `.github/workflows/claude.yml:22-30` (job-level `outputs:` mapping step outputs) and `:145-148` (`needs.route.outputs.*` in `if:` and `with:`):

```yaml
  route:
    runs-on: ubuntu-latest
    outputs:
      action: ${{ steps.determine-action.outputs.action }}
      pr_number: ${{ steps.determine-action.outputs.pr_number }}
...
    needs: route
    if: needs.route.outputs.action == 'review' && needs.route.outputs.pr_number != ''
```

  claude.yml is not an infra workflow and breaks the infra rules (`ubuntu-latest`, unpinned `uses:`, top-level permissions), so copy only the `outputs:`/`needs` shape. The resolve job itself copies the `checks` job of `deploy.yml:44-50` (runs-on `ubuntu-24.04`, `permissions: { contents: read }`, checkout with `persist-credentials: false`), with one `run:` step calling `infra/scripts/resolve-deployment.sh` and env `REPOSITORY_ID: ${{ github.repository_id }}`, `REF_NAME: ${{ github.ref_name }}`, `DEPLOY_ENVIRONMENT: ${{ vars.DEPLOY_ENVIRONMENT }}`.
- `destroy.yml` job `if:` (line 54) compares `inputs.confirm == 'destroy staging aws'` and `github.ref == 'refs/heads/deploy-evidence/destroy-staging'` before any job runs; with resolve as the first job, these become `needs.resolve.outputs.destroy_confirm` / `destroy_branch` comparisons on `plan-destroy` and `apply-destroy`, and the resolve job itself runs credential-free on every trigger.
- `infra-plan.yml` `plan` job: matrix over owned entries, `strategy.matrix.deployment: ${{ fromJSON(needs.resolve.outputs.deployments) }}`; the `running-image-digest.sh --cluster openvaa-staging --service openvaa-staging-frontend` line (line 102) takes `$CLUSTER`/`$SERVICE` from env. `wrong-subject` job `DEPLOY_ROLE_ARN` literal (line 168) comes from resolve output.
- The deploy alert (lines 683-688) builds `--topic-arn` and subject from env (`TOPIC_ARN`, `DEPLOYMENT_KEY`); keep the step's printf/publish shape.
- Smoke step (lines 552-558) gains `SMOKE_DEPLOYMENT: ${{ needs.resolve.outputs.key }}` (and/or `SMOKE_BASE_URL`), and the re-read (line 577) uses `https://$DOMAIN/api/health` via env.
- Migrations step (lines 310-316): keep `OPENVAA_DEPLOY_ENVIRONMENT: ${{ vars.DEPLOY_ENVIRONMENT }}` (CONTEXT D5) and pass the resolved key as the new `push-migrations.sh` flag via env.

---

### `infra/scripts/workflows.test.ts` (modified)

**Analog:** itself. Keep the module-TSDoc rule list (lines 1-17, one bullet per rule, bold rule id, "Each rule is shown red on a mutated in-memory copy"), `withMutation` (lines 66-77, throws when the mutation finds nothing), and the per-rule `describe` with a green case and an `it.each` of red copies (`$fault` titles), e.g. lines 497-519. Replace:
- `APPLY_ROOT` (line 33) -> the resolved-root form; keep `mutatingCommands`.
- `SHARED_CONCURRENCY` (line 35) -> the new constant group.
- `EXPECTED_ENVIRONMENTS` (lines 37-41) -> environment names now come from `needs.resolve.outputs.*`; the rule becomes "every `environment` is a resolve output expression (or absent), `infra-plan.yml` names none".
- `bootstrapValue`/`expectedDeployRoleArn` (lines 199-216) read `deploy_environment` from the flat tfvars; after the rewrite they read `deployments.auto.tfvars.json` plus the account-level tfvars, and the `deploy-role-arn` rule (lines 521-555) changes from "the literal ARN in the workflow equals the derived ARN" to "no workflow holds a literal role ARN, and `resolve-deployment.sh` derives the bootstrap's" (pin the derivation in `resolve-deployment.test.ts`). Its red case at lines 549-555 (`deploy_environment = "staging"` -> `"prod"`) must get a JSON equivalent.
- `arm-lock` (lines 586-620) reads `APPLY_ROOT`'s lock literally and fails "a job that initialises Terraform ... in a root that the rule cannot read as a literal" (line 11). With `-chdir="$AWS_ROOT"` the rule must resolve the root set from the map (every `infra/envs/<key>/aws` the map names that exists), or it turns red by design.

---

### `infra/scripts/{deploy,destroy,infra-plan}-workflow.test.ts` (modified)

**Analog:** themselves. Structure to keep (deploy-workflow.test.ts): TSDoc header (lines 1-5), `loadWorkflow` once (line 18), helpers `jobOf`, `stepsOf`, `stepWithId`, `runOf`, `envOf`, `mutate` (lines 46-125), `describe('deploy.yml and the shared rules', ...)` with `sharedViolations(doc, text)` `toEqual([])` (lines 174-178), and a final `describe('the deploy-specific guards are red on a faulty copy', ...)` (lines 632+). Staging pins to replace: deploy-workflow lines 183-201 (triggers, concurrency), 214-219 (checks `-chdir`), 227-230 (`environment`), 248-261 (`role-to-assume: ${{ vars.AWS_DEPLOY_ROLE_ARN }}`), 290, 302-305, 352, 398, 615-616; destroy-workflow lines 20-22 (constants), 141-167, 179-193, 203-219, 241, 254, 263, 415-416; infra-plan-workflow lines 125, 233-269, 298. Add per file: a resolve job is the first job, holds `contents: read` only, no `id-token`, no `environment`; every credentialed job `needs` it; the `DEPLOY_ENVIRONMENT` comparison is present.

---

### `infra/scripts/workflow-errexit.test.ts` (modified)

**Analog:** itself. Steps are found **by display name** (`findStep`, lines 223-229, `candidate.name === name`), e.g. `pipelineStep('infra-plan.yml', 'plan', 'Plan the staging AWS root')` (line 436) and `"Show the Supabase root's state is out of reach"` (line 452-456). Renaming a step in a workflow (for example "Initialise the staging AWS root" -> "Initialise the AWS root") requires the same rename here in the same commit. The build step case (lines 403-433) copies `infra/envs/staging/aws/terraform.tfvars` into the stub workspace by literal path (line 405); it must use the path the step now reads (from env), and `standInEnv` (lines 160-164) fills every env name with `standin`, so a step that builds a path from `$AWS_ROOT` needs an explicit `env` override in the case (pattern: `env` object of lines 350-355). The sweep (lines 383-400) needs no change. A new resolve step that reads `$?` is automatically in the sweep; a case for it follows lines 435-449. Baseline: six failures in this file are host-only (CONTEXT § Baseline); do not add any.

---

### `tests/tests/utils/deployedTarget.ts` (+ `.test.ts`, `tests/playwright.deployed.config.ts`)

**Analog:** itself. Literals at lines 14-18:

```ts
/** Path, relative to the repository root, of the committed tfvars that names the dedicated Supabase project. */
export const DEDICATED_SUPABASE_TFVARS = 'infra/envs/staging/supabase/terraform.tfvars';

/** The deployed application a smoke run targets when no other address is given. */
export const DEFAULT_SMOKE_BASE_URL = 'https://staging.openvaa.org';
```

The module is pure (header lines 8-12: "reads no process environment of its own ... the caller passes the environment ... in"), so the key reader takes `env` as a parameter. **Env-reader analog** with its validation and error-message convention, `readSmokeAccessCallerMax` (lines 440-450):

```ts
export function readSmokeAccessCallerMax(env: GateEnv): number {
  const value = (env.SMOKE_ACCESS_CALLER_MAX ?? '').trim();
  if (value === '') return CALLER_LIMIT;
  if (!/^[1-9][0-9]*$/.test(value) || !Number.isSafeInteger(Number(value))) {
    throw new Error(
      `SMOKE INPUT INVALID: SMOKE_ACCESS_CALLER_MAX must be a whole number of at least 1, got ${JSON.stringify(value)}`
    );
  }
  return Number(value);
}
```

So: `readSmokeDeployment(env)` -> `'staging'` when unset, `SMOKE INPUT INVALID: SMOKE_DEPLOYMENT ...` on a bad key; `dedicatedSupabaseTfvars(key)` -> `infra/envs/${key}/supabase/terraform.tfvars`, refused unless the file exists under `repoRoot`. Every consumer of `DEDICATED_SUPABASE_TFVARS` (`runDeployedGate` line 96, `readDedicatedTarget` 247-256, `readPublicOrigin` 268-271, `requireCredentialOrigin` 367-372, `readTfvarsValue` 457-465 error text) takes the path. The default base URL becomes the `public_origin` of the resolved tfvars (`readPublicOrigin`, line 268), which keeps "no input can name another target". Consumers to update: `tests/playwright.deployed.config.ts:4,31`, `tests/deployed-global-setup.ts:29`, `tests/tests/deployed/contestant.smoke.ts:19-32`, `tests/tests/utils/deployedSmokeGuards.test.ts`. Test style: `deployedTarget.test.ts` reads the real committed tfvars (lines 33-36) and uses `describe` per function; add `describe('readSmokeDeployment')` copying `describe('readSmokeAccessCallerMax')` (line 762+), and keep the staging-literal cases (lines 520, 570, 611-627, 642-671) valid because the default stays staging.

---

### Docs: `infra/README.md`, `infra/bootstrap/README.md`, `infra/envs/example/**`, `apps/docs/.../deployment/+page.md`

**Analog:** themselves. Passages that state the premise this phase removes (rewrite in present tense, no history):
- `infra/README.md:39-42` "One AWS account holds one deployment environment ... A second environment ... gets an account of its own".
- `infra/README.md:429-434` accepted risk "That holds because the account hosts one deployment environment" -> becomes the `Environment` tag scope; add the cross-tenant remainders of RESEARCH Pitfall 8 (ECS task-definition family, autoscaling writes, plan-role `ReadOnlyAccess` reads) and the D7 downstream "no reviewer gate" risk, in the existing bullet style (`- ` + wrapped at ~100 columns).
- `infra/README.md:442-470` § Example environment step 1 tells a fork to copy `example.tfvars` over `terraform.tfvars`; add the map entry step.
- `infra/modules/github-oidc/main.tf:1` (same premise in a comment).
- Docs guide `### The account-level root` (lines 44-63) and `### The deploy pipeline` (line 233): add "adding a deployment from a downstream repository" (upstream PR to the map, own `infra/envs/<key>/**`, branches `deploy/<key>` / `deploy-evidence/destroy-<key>`). Guide-to-runbook links use the absolute GitHub URL form of line 48 (`https://github.com/OpenVAA/voting-advice-application/blob/main/infra/bootstrap/README.md#step-8-...`).
- Runbook `infra/bootstrap/README.md`: steps are `## Step N: <Title>` (lines 96-1235) with an `## Observations` section; the live move plan through `check-bootstrap-plan.sh` is a new step in that form.
- `infra/envs/example/aws/terraform.tfvars:1-30` comment style (one `#` line per value explaining the stand-in) for any new example value.

---

## Shared Patterns

### Shell script header, prologue and exit codes
**Source:** `infra/scripts/check-destroy-plan.sh:1-45`, `scripts/lib/cli.sh:1-61`
**Apply to:** `resolve-deployment.sh`, `check-bootstrap-plan.sh`, `check-bootstrap-moves.sh`, edits to `push-migrations.sh` / `terraform-checks.sh`
- Header from line 2 to `set -euo pipefail` is the `--help` text (`cli.sh:10-12,20-22`), so it must hold Usage, flags (`REQUIRED.`/`OPTIONAL.`), output lines and the exit-code table.
- `set -euo pipefail`, `set -f` when no glob is needed, `export LC_ALL=C`, `SCRIPT_PATH`, `SCRIPT_NAME`, `USAGE_LINE`, `# shellcheck source=../../scripts/lib/cli.sh` then `. "$(dirname "$SCRIPT_PATH")/../../scripts/lib/cli.sh"`.
- Helpers: `usage_error` (exit 2, `cli.sh:36-44`), `require_value` (`:49-53`), `fatal "<msg>" <code>` (`:30-33`), `note` (`:25-27`), `resolve_path` with `REPO_ROOT` (`:56-61`).
- Exit codes: 0 pass, 1 check failed, 2 usage error / missing tool, 130 interrupted when a trap is set (`running-image-digest.sh:29-33`).
- Status captured as `rc=0; out="$(cmd)" || rc=$?`, never through a pipe; jq stderr suppressed so no input text reaches the log.
- `` `set -x` must not be added. `` as the last header line where any value could be sensitive.

### Vitest script tests
**Source:** `infra/scripts/check-destroy-plan.test.ts:1-84`, `infra/scripts/terraform-checks.test.ts:57-91`
**Apply to:** `resolve-deployment.test.ts`, `check-bootstrap-plan.test.ts`, updated `push-migrations.test.ts`, `terraform-checks.test.ts`
- TSDoc file header saying what runs and that the child gets a minimal environment; `HERE`/`REPO_ROOT` from `fileURLToPath(import.meta.url)`; `spawnSync('bash', [SCRIPT, ...args], { encoding: 'utf8', env: { PATH, HOME }, timeout: 30_000 })`; temp dirs in `dirs` cleaned in `afterEach`; `lines(stdout)` -> record; exact full-stdout `toBe` for one green case, `toMatchObject` for reds, `it.each` usage errors with exit 2, `--help` exit 0. TypeScript strict, no `any`, TSDoc on helpers. Picked up automatically by `infra/vitest.config.ts` (`include: ['scripts/**/*.test.ts']`).

### Workflow guards
**Source:** `infra/scripts/workflowGuards.ts:13-27,143-232`; red-copy pattern `infra/scripts/workflows.test.ts:66-77`, `infra-plan-workflow.test.ts:44-49`
**Apply to:** all three workflows and their tests
- Every rule has a green assertion on the real file and at least one red mutated copy whose mutation is checked to have changed something; a rule rewritten in this phase keeps a red case (RESEARCH anti-pattern "guards must stay red-capable").
- Shared rules a new resolve job must obey: `top-level-permissions-empty`, `job-permissions-explicit`, `action-pinned-by-sha` + `action-tag-comment`, `no-expression-in-run`, `id-token-only-where-assumed`, `checkout-no-persisted-credentials`, `runner-label` (`ubuntu-24.04` or `ubuntu-24.04-arm` only), `plan-file-in-runner-temp`, `status-read-after-or`.

### Terraform tests
**Source:** `infra/modules/github-oidc/tests/github_oidc.tftest.hcl:1-28` (real provider, fake keys), `infra/envs/example/aws/tests/plan.tftest.hcl:1-118` (mock provider, override_data), `infra/modules/supabase/tests/settings.tftest.hcl:369-384` (`expect_failures`)
**Apply to:** `infra/bootstrap/tests/deployments.tftest.hcl`, the harness's generated test, `github_oidc.tftest.hcl` edits
- Leading comment says why real or mock providers are used; `run "<snake_case>" { command = plan ... }`; one `assert` per property, `error_message` a full sentence with "must"; documents read through `flatten([...])` (header line 3). Mock providers never report replacement (RESEARCH Pitfall 3), so name/ForceNew proofs live in the real-provider harness, not in the mock test.

### Comment hygiene
**Source:** CLAUDE.md § Comment Hygiene
**Apply to:** every `.tf`, `.sh`, `.ts`, `.yml` comment touched
- Present tense, no "previously"/"now"/"changed", no `.planning/` paths, no `D-NN` ids, only `see phase 190` if a reference is needed. Passages to rewrite listed under Docs above, plus `infra/modules/github-oidc/main.tf:1-3`, `infra/bootstrap/main.tf:30`, `infra/bootstrap/terraform.tfvars:13-35`, `push-migrations.sh` header lines 11/25/34/46/56, `deployedTarget.ts:8-18`, and the three workflow header blocks.

## No Analog Found

| File | Role | Data Flow | Reason |
|---|---|---|---|
| resolve job in `deploy.yml`/`destroy.yml`/`infra-plan.yml` (job `outputs:` + `needs.resolve.outputs.*` in `environment`, `with:`, `matrix`) | CI job | event-driven | No infra workflow passes values between jobs today; `claude.yml:22-30,145-148` shows the syntax only and violates the infra guards. Planner relies on RESEARCH Pattern 3 for the contract. |
| `infra/scripts/check-bootstrap-moves.sh` two-tree `terraform test` with `state_key` and `module { source }` | utility (harness) | batch | No existing test uses `state_key`, `module { source }` or `plan_options`; the mechanics come from RESEARCH Pattern 2 (prototyped on 1.16.5). Only the temp-dir/`git archive`/trap shell parts have analogs. |

## Metadata

**Analog search scope:** `infra/bootstrap`, `infra/modules/*` (all `.tf` and `tests/*.tftest.hcl`), `infra/envs/{example,staging}`, `infra/scripts/*.sh` and `*.test.ts`, `scripts/lib/cli.sh`, `.github/workflows/*.yml`, `tests/tests/utils/deployedTarget*.ts` and its consumers, `infra/README.md`, `infra/bootstrap/README.md`, the docs deployment guide.
**Files scanned:** ~45
**Pattern extraction date:** 2026-11-24
