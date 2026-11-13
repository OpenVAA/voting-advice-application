---
phase: 183-terraform-foundation-and-supabase-as-code
plan: 01
subsystem: infra
tags: [terraform, aws, gitignore, dockerignore, baseline, attempt-files]

requires:
  - phase: 182
    provides: "yarn install --immutable and yarn build green under Node 24.21.0 on the rebased branch"
provides:
  - "Hand-written Terraform ignore block at the end of .gitignore (state, plan, local tfvars, overrides, module lock files) that keeps terraform.tfvars and root lock files tracked"
  - ".dockerignore entry keeping infra out of the image build context"
  - "infra/.terraform-version (1.16.5)"
  - "infra/envs/staging/aws pipeline root: literal S3 backend with key pipeline/staging/aws/terraform.tfstate, allowed_account_ids, default cost tags, no resources"
  - "AWS provider lock: hashicorp/aws 6.68.0 under ~> 6.60 with h1 hashes for linux_amd64, darwin_arm64, darwin_amd64 (copied unchanged by every later AWS root)"
  - "tools/attempt.sh: per-attempt scratch files behind a pointer, with new/id/path/has/bound/field/put and a passing --self-test"
  - "Baseline of lint:check, format:check, test:unit (all exit 0) at bfbaaffa0 on a clean tree"
affects: [183-02, 183-03, 183-13, 185]

actuals:
  tokens: 9500
  tasks: 3
  commits: 4

plan_head_before: 621fe08a48d451937b8c5eaa62999f282cfab94d
plan_head_after: 8b987d6a091c99470b14586b385600c4f8da01e2

tech-stack:
  added: ["Terraform AWS provider hashicorp/aws 6.68.0 (lock file only; nothing applied)"]
  patterns:
    - "Literal backend block per root; hand/ vs pipeline/ state key prefixes"
    - "Whole-repository gate protocol: tree sample + HEAD before and after, gate in background with status file"
    - "Attempt files behind a <key>.current pointer; checks read only via the helper"

key-files:
  created:
    - infra/.terraform-version
    - infra/envs/staging/aws/main.tf
    - infra/envs/staging/aws/variables.tf
    - infra/envs/staging/aws/terraform.tfvars
    - infra/envs/staging/aws/.terraform.lock.hcl
    - .planning/workstreams/deployment/phases/183-terraform-foundation-and-supabase-as-code/tools/attempt.sh
    - .planning/workstreams/deployment/phases/183-terraform-foundation-and-supabase-as-code/evidence/183-01-baseline-gates.md
  modified:
    - .gitignore
    - .dockerignore

key-decisions:
  - "The exact-constraint step was needed: the newest release under ~> 6.60 on 2026-10-18 was 6.69.1, so 6.68.0 was locked with an exact constraint and the range then restored"
  - "After restoring ~> 6.60, re-running terraform providers lock (not init -backend=false) rewrote the lock's constraints line while keeping 6.68.0"
  - "The attempt helper delegates line selection and the reply screen to embedded Perl, because the workstation's /bin/bash is 3.2"

patterns-established:
  - "Terraform ignore block appended last in .gitignore; never the stock template (it ignores every *.tfvars)"

requirements-completed: []  # The plan underpins INFRA-15, INFRA-17, INFRA-18 and SUPA-11 and closes none of them.

duration: 13min
completed: 2026-10-18
status: complete
---

# Phase 183 Plan 01: Terraform foundation (ignores, baseline, first root) Summary

**Hand-written Terraform ignore entries proven in both directions, an attempt-file helper whose self-test refuses stale bindings and pasted secrets, an all-green baseline of the three gates, and the staging pipeline root with hashicorp/aws locked at 6.68.0 for three platforms.**

## Performance

- **Duration:** about 13 min
- **Started:** 2026-10-18T20:13:38Z
- **Completed:** 2026-10-18T20:26Z
- **Tasks:** 3
- **Files:** 9 (2 modified, 7 created)

## Plan start and baseline

- **Commit at which the plan started:** 621fe08a48d451937b8c5eaa62999f282cfab94d
- **Exact-constraint step needed:** yes (newest `~> 6.60` release was 6.69.1)
- **Baseline (attempt 01-2 20261018T202029Z.bfbaaffa0), tree 0/0 before and after each gate:**

| Gate | Exit status | HEAD before = after |
| --- | --- | --- |
| lint:check | 0 | bfbaaffa055f146a2ebe681fad5983de7d0fd267 |
| format:check | 0 | bfbaaffa055f146a2ebe681fad5983de7d0fd267 |
| test:unit | 0 | bfbaaffa055f146a2ebe681fad5983de7d0fd267 |
| format:check after infra/ (attempt 01-3 20261018T202510Z.be1e9c18d) | 0 | be1e9c18d3df39ba4f947fcd02abaf0e69db0ab7 |

No gate is red, so plan 183-13 is not held up by a red baseline.

## Accomplishments

- `.gitignore` gains one block at the end; `git check-ignore` confirms seven sample paths (state, backup, `.terraform/`, `tfplan`, `*.auto.tfvars`, `*_override.tf`, module lock) are ignored and `terraform.tfvars`, `example.tfvars` and a root lock file are not. The diff only adds lines.
- `.dockerignore` gains `infra` with a reason (no Dockerfile copies `infra`; the proxy compose mounts `infra/local/nginx.conf` as a volume, not through the build context). The Docker build wiring spec passes (7/7).
- `tools/attempt.sh` passes `--self-test`: 187 checks, covering pointer and binding cases, every must-refuse paste (exit 3 with the expected class, size unchanged, value not printed), the two exit-2 cases and every must-pass line. RED was observed first (exit 127, commands not yet defined). Mutation probes confirmed the self-test catches a dropped secret word, a dropped attempt-id check and a loosened sha256 length.
- `infra/envs/staging/aws` initialises with `-backend=false -lockfile=readonly` without changing the lock, validates ("Success! The configuration is valid.") and passes `terraform fmt -check -recursive infra`. No credentials were used and nothing was applied.

## Task Commits

1. **Task 1: Terraform ignore entries** - `bfbaaffa0` (chore)
2. **Task 2: attempt helper + baseline** - `d2debefe7` (feat; TDD, with RED observed before the implementation and RED and GREEN in one commit, as the plan's single-commit acceptance requires)
3. **Task 3: CLI pin, pipeline root, provider lock** - `be1e9c18d` (feat)
4. **Task 3: format:check after infra/ evidence row** - `8b987d6a0` (docs)

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] The plan's second verify command for Task 1 cannot run as written**
- **Found during:** Task 1
- **Issue:** `git check-ignore -q` with several paths is refused by Git ("--quiet is only valid with a single pathname", exit 128), so `test $? -eq 1` could never pass.
- **Fix:** Ran the same check without `-q` (`git check-ignore <4 paths>; test $? -eq 1`). It exited 1 and printed nothing. The same applies to the identical acceptance check in Task 3, which was also run without `-q` and also exited 1.
- **Files modified:** none
- **Commit:** n/a

**2. [Rule 3 - Blocking] `init -backend=false` did not rewrite the lock's constraints line**
- **Found during:** Task 3
- **Issue:** After the range `~> 6.60` was restored, `terraform init -backend=false` kept `constraints = "6.68.0"` in the lock file. The acceptance criterion requires `constraints = "~> 6.60"`.
- **Fix:** Re-ran `terraform providers lock` for the three platforms. It kept version 6.68.0 and its hashes and rewrote `constraints` to `~> 6.60`. A scratch copy outside the repository was tried first to confirm this. The read-only init afterwards left the lock byte-identical.
- **Files modified:** infra/envs/staging/aws/.terraform.lock.hcl
- **Commit:** be1e9c18d

**3. [Premise] `infra/` already held tracked files before this plan**
- **Found during:** Task 1
- **Issue:** Phase 181 had already committed `infra/local/*` and `infra/scripts/*` (non-Terraform). The plan's check `git log --diff-filter=A -- infra | tail -1` therefore names a commit from 2026-10-12, which is older than the ignore commit.
- **Resolution:** The invariant the plan protects still holds: no Terraform file precedes the ignore entries. The first commit that adds a file under `infra/envs` or `infra/.terraform-version` is `be1e9c18d`, which comes after `bfbaaffa0`.

**4. [Premise] `.dockerignore` was no longer "two patterns, no trailing newline"**
- **Found during:** Task 1
- **Issue:** The file already holds `**/node_modules`, `**/build`, the `.env` patterns and a trailing newline. That is why no newline repair was needed.
- **Resolution:** Appended the comment line and `infra` and kept every existing line.

## Known Stubs

None. The pipeline root has no resources on purpose: phase 185 fills it.

## Threat Flags

None. No network endpoint, auth path or schema change was added. The helper's `put` screen is the T-183-71 mitigation and is covered by the self-test.

## Notes for later plans

- Plugin cache: `~/.terraform.d/plugin-cache` now holds hashicorp/aws 6.68.0 for darwin_arm64. It also holds 6.69.1, left by the newest-version check, which is harmless.
- Use `git check-ignore` without `-q` whenever more than one path is given.
- `yarn lint:check` took about 47 s, `format:check` about 15 s and `test:unit` about 32 s with a fresh private `TURBO_CACHE_DIR`.

## Self-Check: PASSED

- FOUND: infra/.terraform-version, infra/envs/staging/aws/{main.tf,variables.tf,terraform.tfvars,.terraform.lock.hcl}, tools/attempt.sh, evidence/183-01-baseline-gates.md
- FOUND commits: bfbaaffa0, d2debefe7, be1e9c18d, 8b987d6a0 (all ancestors of HEAD)
- `commits: 4` measured with `git rev-list --count 621fe08a4..HEAD` before this SUMMARY's commit
