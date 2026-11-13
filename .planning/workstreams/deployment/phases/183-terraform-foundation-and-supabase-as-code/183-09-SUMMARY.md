---
phase: 183-terraform-foundation-and-supabase-as-code
plan: 09
subsystem: infra
tags: [terraform, aws, iam, lint-guard, lint-check, vitest]
status: complete

requires:
  - phase: 183-03
    provides: "infra/modules/github-oidc: roles with managed-policy attachments and aws_iam_role_policies_exclusive with policy_names = [] (the real IAM the guard must pass)"
  - phase: 183-04
    provides: "infra/modules/mail-ses/smtp.tf: SMTP user with aws_iam_user_policy_attachment and aws_iam_user_policies_exclusive with policy_names = []"
provides:
  - "scripts/assert-no-inline-iam-policies.mjs: the NO-INLINE-IAM-POLICIES GUARD over infra/**/*.tf, flags --root <dir> and --self-test, exit 0/1/2"
  - "Finding names: aws_iam_user_policy, aws_iam_role_policy, aws_iam_group_policy, inline_policy, aws_ssoadmin_permission_set_inline_policy, aws_iam_policy_attachment, aws_iam_*_policies_exclusive not empty, and the path finding '.tf.json file'"
  - "scripts/fixtures/no-inline-iam-policies/{ok/main.tf, violations/main.tf, violations/extra.tf.json, expected.violations}"
  - "package.json: script key assert:no-inline-iam-policies and the lint:check link yarn assert:no-inline-iam-policies (appended last)"
  - "packages/dev-seed/tests/noInlineIamPoliciesGate.test.ts: 8 tests on wiring and teeth"
  - "evidence/183-09-inline-iam-red-control.md: five dated runs, statuses 0 1 0 1 2"
affects: [183-12, 183-13, 183-14, 183-17]

estimate:
  tokens: 72000
  tasks: 3
actuals:
  tokens: 6400     # chars/4 over the eight committed files plus the package.json diff (25336 chars + ~250)
  tasks: 3
  commits: 4

plan_head_before: f76c44ecf4f57943c8d7bd205553c1df221381fe
plan_head_after: 671596d2018e22b9ba09162cf5a087d919b3d234

tech-stack:
  added: []
  patterns:
    - "A text guard over a directory walk (readdirSync, .terraform skipped) rather than git ls-files, so a planted uncommitted file is a finding"
    - "Fixture as a directory pair (clean root, violating root) with a committed expected.violations the self-test matches in both directions"
    - "Gate spec runs the guard as a child process (spawnSync(process.execPath, ...)) and never imports it"

key-files:
  created:
    - scripts/assert-no-inline-iam-policies.mjs
    - scripts/fixtures/no-inline-iam-policies/ok/main.tf
    - scripts/fixtures/no-inline-iam-policies/violations/main.tf
    - scripts/fixtures/no-inline-iam-policies/violations/extra.tf.json
    - scripts/fixtures/no-inline-iam-policies/expected.violations
    - packages/dev-seed/tests/noInlineIamPoliciesGate.test.ts
    - .planning/workstreams/deployment/phases/183-terraform-foundation-and-supabase-as-code/evidence/183-09-inline-iam-red-control.md
  modified:
    - package.json

key-decisions:
  - "The account-wide exclusive attachment is banned on the provider's own words: the v6.68.0 page for aws_iam_policy_attachment was fetched and its WARNING is quoted in the guard's docblock"
  - "The exclusive-policies resources are allowed only when every policy_names in the block is an empty list; a block with no policy_names at all, or one that never closes, is also a finding"
  - "inline_policy matches any use of the word, so a permission-set inline policy reports twice (the resource line and its inline_policy argument); the fixture's expected findings say so"
  - "A --root argument is resolved against the caller's working directory; findings print repository-relative paths, or absolute paths outside the repository"
  - "A root that cannot be read exits 1 (nothing examined), like a root with no .tf file"

requirements-completed: []  # INFRA-17's repository half is built and seen red on the fixture; it closes after 183-13 sees it red through lint:check and 183-14/183-17 cover the account half.

duration: 6min
completed: 2026-10-18
---

# Phase 183 Plan 09: No-inline-IAM-policies guard Summary

**A Node-only `lint:check` guard that fails on any inline IAM policy form, the account-wide exclusive attachment, a non-empty exclusive-policies list or a `.tf.json` file under `infra/`, with fixture self-test, a gate spec and a dated red control.**

## Performance

- **Duration:** about 6 min of execution (2026-10-18T20:56Z to 21:02Z)
- **Tasks:** 3
- **Files:** 7 created, 1 modified

## Accomplishments

- `scripts/assert-no-inline-iam-policies.mjs` reads 42 `.tf` files under `infra/` with no finding, and nine findings on the violating fixture root covering every banned form.
- `yarn assert:no-inline-iam-policies` is the last link of `lint:check`; a whole `yarn lint:check` run on a clean tree at 4c356f947 exited 0 (status read directly, run in the background with a private `TURBO_CACHE_DIR`), the guard's summary line its final output.
- The gate spec (8 tests) fails if the chain link, the script key, the guard file or the guard's teeth are removed.
- The red-control record shows statuses 0, 1, 0, 1, 2 for the real tree, the violating root, the clean root, an empty root and an unknown flag.

## The provider page on the exclusive attachment

Read. `curl` fetched `website/docs/r/iam_policy_attachment.html.markdown` at tag v6.68.0 (exit 0). Its WARNING says the resource "creates **exclusive** attachments of IAM policies. Across the entire AWS account, all of the users/roles/groups to which a single policy is attached must be declared by a single aws_iam_policy_attachment resource. This means that even any users/roles/groups that have the attached policy via any other mechanism (including other Terraform resources) will have that attached policy revoked by this resource." It recommends the per-role, per-user and per-group attachment resources instead. The guard's docblock quotes this, so the ban rests on the provider's documentation rather than on the research's `[ASSUMED]` note.

## Task Commits

1. **Task 1 (RED): fixtures and expected findings** - `532e70ab8` (test). RED observed: `--self-test` exited 1 with the guard absent.
2. **Task 1 (GREEN): the guard** - `91f833cbb` (feat). Self-test passed: 9 findings, 9 expected, 0 on the clean root.
3. **Task 2: wiring and gate spec** - `4c356f947` (feat)
4. **Task 3: red-control record** - `671596d20` (docs)

## Files Created/Modified

- `scripts/assert-no-inline-iam-policies.mjs` - the guard: `PATTERNS` table, block read for the exclusive-policies resources, `.tf.json` path finding, walk skipping `.terraform`
- `scripts/fixtures/no-inline-iam-policies/ok/main.tf` - forms that must pass (trust policy, managed policy, role/user/group attachments, bucket policy, empty exclusive list)
- `scripts/fixtures/no-inline-iam-policies/violations/main.tf` - one instance of each banned form
- `scripts/fixtures/no-inline-iam-policies/violations/extra.tf.json` - the JSON-configuration path finding
- `scripts/fixtures/no-inline-iam-policies/expected.violations` - the nine findings the self-test reproduces
- `package.json` - one added key, one appended `lint:check` link; every earlier link kept
- `packages/dev-seed/tests/noInlineIamPoliciesGate.test.ts` - wiring and teeth spec
- `evidence/183-09-inline-iam-red-control.md` - the dated record (Attempt: 09-3 20261018T210029Z.4c356f947)

## Decisions Made

See `key-decisions` in the frontmatter. The plan's own decisions (directory walk, no comment blanker, directory fixture, child-process spec) were followed as written.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 3 - Blocking] Spec import style corrected for the repository's ESLint rules**
- **Found during:** Task 2
- **Issue:** an inline `type` specifier in the `node:child_process` import failed `simple-import-sort/imports` and `import-x/consistent-type-specifier-style`.
- **Fix:** `eslint --fix` then `prettier --write`; the type import is now a separate top-level `import type` line.
- **Files modified:** packages/dev-seed/tests/noInlineIamPoliciesGate.test.ts
- **Commit:** 4c356f947 (fixed before the commit)

Beyond the plan's acceptance list, the guard also exits 1 on an unreadable or missing `--root` and exits 2 on `--root` followed by another flag; the fixture adds a group attachment to the clean root. These widen coverage without changing any specified behaviour.

## Issues Encountered

None.

## Known Stubs

None.

## User Setup Required

None.

## Next Phase Readiness

- Plan 183-13 can plant a file under `infra/` and see `yarn lint:check` go red at the last link; `lint:check` is green at 4c356f947, so no earlier link masks it.
- Plans 183-14 and 183-17 cover the account half of INFRA-17.

## TDD Gate Compliance

Task 1 carried `tdd="true"`. RED: commit `532e70ab8` (`test(183-09)`) added the fixtures and expected findings; the self-test run with the guard absent exited 1. GREEN: commit `91f833cbb` (`feat(183-09)`) added the guard; the self-test exited 0. No refactor commit was needed.

## Self-Check: PASSED

All eight created or modified files exist; commits 532e70ab8, 91f833cbb, 4c356f947 and 671596d20 are ancestors of HEAD; `git rev-list --count f76c44ecf..671596d20` is 4.
