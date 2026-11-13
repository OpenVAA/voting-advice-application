---
phase: 183-terraform-foundation-and-supabase-as-code
plan: 26
subsystem: infra
tags: [supabase, terraform, lint-guard, lint-check, settings-parity, red-control]
status: complete

requires:
  - phase: 183-10
    provides: "scripts/assert-hosted-settings-parity.mjs (the comparing core, 40 cases), its fixture and gate spec, and the operator-ruled send-email hook group and switch"
  - phase: 183-05
    provides: "infra/modules/supabase (hosted-settings.json, settings.tf, main.tf) and infra/scripts/check-settings-types.sh"
  - phase: 183-07
    provides: "infra/envs/{example,scratch,staging}/supabase roots and their tracked terraform.tfvars"
provides:
  - "scripts/assert-hosted-settings-parity.mjs: structural assertions (JSON encoded by the module, known hosted keys, one owner per key, protected project block, no empty-object conditional, no second writer of hosted settings); flag --module-dir; 66 embedded cases"
  - "evidence/183-26-parity-red-control.md: twelve dated direct runs, ten red and two green, each status equal to its expected one; content hashes of the real inputs equal before and after"
affects: [183-13, 183-21, 183-24, 183-25, 183-27]

estimate:
  tokens: 60000
  tasks: 2
actuals:
  tokens: 10860    # chars/4 over the added lines of this plan's three task commits (43441 chars)
  tasks: 2
  commits: 3       # MEASURED: git rev-list --count plan_head_before..HEAD at SUMMARY write

plan_head_before: 77b0bac6bd3f88c30633b1c8ee4f451005658cc5
plan_head_after: fdc6cd6081e8aa4473c5ab410a2b2686d0a07cad

tech-stack:
  added: []
  patterns:
    - "HCL read as text with comments removed and strings kept, blocks found by counting braces outside strings; presence checks cannot be satisfied by a comment, absence checks are not tripped by one"
    - "A command the guard forbids is built from its words in the source (PUSH_WORDS), so the guard's own file never holds it whole; the guard's own paths are also excluded from the scan by path"
    - "Self-test cases may name the files their findings must point at (`files`), not only the finding ids"

key-files:
  created:
    - .planning/workstreams/deployment/phases/183-terraform-foundation-and-supabase-as-code/evidence/183-26-parity-red-control.md
  modified:
    - scripts/assert-hosted-settings-parity.mjs

key-decisions:
  - "The group-read check covers five JSON groups (api, auth, auth_hook, auth_send_email_hook, redirect_callback_paths), the union of a fixed expected list and the JSON's own top-level keys, following the 183-10 operator ruling that added auth_send_email_hook"
  - "Known hosted keys are kept per settings attribute (api: 4 keys, auth: 46 keys); the hook groups are checked against the auth list. The auth list adds hook_send_email_enabled and hook_send_email_uri to the research's Q1 table; all 50 names were re-read from pkg/api/types.gen.go at the CLI's pkg/v1.2.3 (the client provider 1.11.0 compiles against)"
  - "--module-dir replaces the module directory for every .tf read, the hook-default read of variables.tf included; --settings stays independent, so the compared JSON is chosen separately"
  - "The second-writer scan reads tracked files only (git ls-files), skipping a listed file absent from the tree; the regex tolerates whitespace and a backslash line continuation between the words"

requirements-completed: []  # SUPA-11 stays open until the chain is seen failing (183-13) and the hosted settings are applied and read back (183-24, 183-25)

duration: ~10 min
completed: 2026-10-19
---

# Phase 183 Plan 26: Structural assertions of the settings parity guard Summary

**The parity guard now also fails when the Supabase module stops encoding one of the JSON's five groups, when a key sits with the wrong owner or is not a known hosted key, when the project block loses `prevent_destroy` or the password ignore, when a conditional has an empty-object branch, and when the CLI's configuration-push command appears in a workflow, `infra/`, `scripts/` or a `package.json`; twelve dated direct runs show it red once per kind of finding.**

## Performance

- **Started:** 2026-10-19T06:19:07Z
- **Completed:** 2026-10-19T06:27:38Z
- **Tasks:** 2/2
- **Files:** 1 created, 1 modified

## Accomplishments

- **Gate mode on the repository** (exit 0) prints a new census line: `structure: 4 .tf file(s) of infra/modules/supabase; 5 of 5 JSON group(s) read; 15 HCL-owned key(s); 203 tracked file(s) scanned for a second writer of hosted settings.`
- **`--self-test`:** 66 cases, all pass (40 after plan 183-10, so 26 more). The new cases cover a group read missing (auth, and the send-email hook group); the auth group read only in a comment; the module reading another JSON file; the settings resource taking another expression than `jsonencode(local.auth)`, and one missing `jsonencode(local.api)`; an unknown JSON key; an auth key in the api group; a JSON-owned key written in HCL (bare, and as a quoted map key); a known key the JSON does not hold, written in HCL; an HCL-owned key misspelled; an HCL-owned key put in the JSON; a project block without `prevent_destroy`, with `prevent_destroy = false`, without the password ignore, or with both protections outside its `lifecycle` block; no project block in `main.tf`; an empty-object branch (`{}` and `tomap({})`); an empty module directory; the push command in a workflow, in a `package.json` and split across a line continuation in an `infra/` script; and two cases that must stay green (the guard's own paths, and a file outside the scanned paths).
- **Plan verify commands:** `--self-test && gate` exit 0. The red control on a module copy with `local.hosted.auth,` replaced by `{},` exits 1 and names `module/local.hosted.auth`. The gate spec `packages/dev-seed/tests/hostedSettingsParityGate.test.ts` passes 9/9.
- **Acceptance probes:** `--module-dir <empty dir>` exits 1 and withholds the verdict. `--self-test --module-dir x` exits 2. `--module-dir` with no path exits 2. The source does not hold the push command whole (`grep -c` gives 0), every import specifier starts with `node:`, and no comment cites a planning path, phase number or decision id.
- **Red-control record** (`evidence/183-26-parity-red-control.md`, attempt `26-2 20261019T062611Z.fc7521da6`): runs 1 to 8, 9a, 9b, 10 and 11 exited 0,1,1,1,1,1,1,1,1,0,1,1, each equal to its expected status. Run 2's finding names `api/max_rows`. Run 7's finding names `api/max_rows` and `dataAdapter.pageSize 1000`. Run 9b's census names `staging`. The seven real inputs (config.toml, hosted-settings.json, staticSettings.ts and the module's four `.tf` files) had the same `git hash-object` before and after. The file holds the line `Red controls: 12 of 12 as expected`.
- **Full `yarn lint:check`** on a clean tree (the only untracked files were the orchestrator's `.planning/workstreams/deployment/{config,state}.json`), run in the background with a private `TURBO_CACHE_DIR`, exit status read directly: **0**. The parity link ran last and printed the structure line above.

## Task Commits

1. **Task 1 RED: failing self-test cases plus input plumbing:** `43c2ef18d` (test)
2. **Task 1 GREEN: the structural assertions:** `fc7521da6` (feat)
3. **Task 2: the red-control record:** `fdc6cd608` (docs)

## TDD Gate Compliance

- **RED** (`43c2ef18d`): `node scripts/assert-hosted-settings-parity.mjs --self-test` exited 1. 23 of the 26 new cases failed on their own assertion: the expected finding was not reported (for example `reported [], expected [module/local.hosted.auth]`). All 40 earlier cases still passed, and gate mode still exited 0. Three new cases passed in RED by construction: the empty-module channel error, which the input plumbing alone produces, and the two cases that must stay green. *Semantic assessment:* each failing case failed on its planned assertion and on nothing else. There was no load, syntax or fixture failure.
- The embedded self-test prints neither TAP nor JUnit, so `gsd_run check tdd-red-evidence` has no adapter for it. RED was judged from the run's own per-case output instead. That output is kept under `tmp/183-evidence/`, which Git ignores.
- **GREEN** (`fc7521da6`): 66/66 pass. One fix was made on the way. An HCL-owned key put in the JSON was reported twice under one id, once against the JSON and once against `settings.tf`, so the JSON-owned-in-HCL check now skips keys the HCL owns.
- **REFACTOR:** none.

## Deviations from Plan

### Following the 183-10 operator ruling (orchestrator note)

**1. [183-10 ruling] Five JSON groups and the second hook switch, not four groups**
- **Found during:** Task 1
- **Issue:** The plan lists four groups (`api`, `auth`, `auth_hook`, `redirect_callback_paths`) and a known-keys list from the research's Q1 tables. Plan 183-10's operator ruling 2A added a fifth group, `auth_send_email_hook`, with `hook_send_email_enabled` and `hook_send_email_uri`, and a module switch `enable_send_email_hook`.
- **Fix:** The group-read check requires `local.hosted.auth_send_email_hook`, and it has its own embedded case. The known auth keys include both send-email hook keys, both read from the provider's API client. The known-keys check covers the `auth_send_email_hook` group. The new switch was already held by 183-10's hook-switch rule, so the structure adds nothing for it. Red run 9 used the access-token switch, which the plan allows ("either switch").
- **Files modified:** scripts/assert-hosted-settings-parity.mjs
- **Commit:** `fc7521da6`

### Auto-fixed Issues

**1. [Rule 1 - Bug] An existing case would have reported two findings**
- **Found during:** Task 1 RED
- **Issue:** The 183-10 case "a hosted key no row compares" used `external_google_enabled`. That key is not in this plan's known list, so the case would also raise the new unknown-key finding and stop testing its one class.
- **Fix:** The case now uses `mfa_max_enrolled_factors`, a known key that no row compares. The unknown-key class has cases of its own.
- **Commit:** `43c2ef18d`

**2. A spoiled attempt file (process, no code)**
- The first `attempt.sh new 26-2` file (`20261019T062604Z`) has one bad hash line, because zsh did not split a file list. A fresh attempt (`20261019T062611Z`) was started and the evidence was written from it, as the attempt rule requires. The earlier file was kept and not read.

## Known Stubs

None.

## Threat Flags

None. The guard reads files and lists tracked files with `git ls-files` (a local, read-only child process). It adds no endpoint, auth path or trust boundary. T-183-23, T-183-31 and T-183-62 are mitigated as the plan specifies, and T-183-SC holds: no package was added.

## Next Phase Readiness

- Plan 183-13 can show this guard failing through `yarn lint:check`, for the structural kinds as well as the comparison.
- Plan 183-27 reads the line `Red controls: 12 of 12 as expected` from the evidence file.
- Open follow-up 183-R4, the password ignore, is still the recommended answer and has not been ruled. If the operator overrules it, the password-ignore assertion and its two cases must be removed by a plan revision, together with the lifecycle argument in plan 183-05.

## Self-Check: PASSED

- FOUND: scripts/assert-hosted-settings-parity.mjs, .planning/workstreams/deployment/phases/183-terraform-foundation-and-supabase-as-code/evidence/183-26-parity-red-control.md
- FOUND commits on HEAD: 43c2ef18d, fc7521da6, fdc6cd608
