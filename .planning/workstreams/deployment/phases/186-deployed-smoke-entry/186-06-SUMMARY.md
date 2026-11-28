---
phase: 186-deployed-smoke-entry
plan: "06"
subsystem: testing
tags: [playwright, deployed-smoke, documentation, staging]
status: complete
requires:
  - phase: 186-03
    provides: "yarn test:e2e:deployed root script, ESLint lock, deployedSmokeGuards.test.ts"
provides:
  - "tests/README.md § Deployed smoke run: inputs, refusals, workstation run, gate reading, contestant account, guards, pipeline rule"
  - "CLAUDE.md § Testing line for yarn test:e2e:deployed"
affects: [186-07, 186-08, 187, 189]
tech-stack:
  added: []
  patterns:
    - "Deployed-run how-to as numbered steps, each one wrapped shell block with its expected output, statuses read on the next line"
key-files:
  created: []
  modified:
    - tests/README.md
    - CLAUDE.md
key-decisions:
  - "The error-context.md aria-snapshot risk 186-02 flagged is documented in § Deployed smoke run (the contestant's account part): a run directory with a failed contestant test is never published, uploaded or attached. The undocumented PLAYWRIGHT_NO_COPY_PROMPT switch is not recommended in the docs; whether to use it is left to 186-08 and phase 187."
  - "SUPA-09 stays Pending until 186-08; requirements.mark-complete was not run."
metrics:
  duration: "about 3 min"
  completed: 2026-11-14
actuals:
  tokens: 4500
  tasks: 2
  commits: 2
plan_head_before: 97414d29a4318af774009598270e6372d19e9a11
plan_head_after: 8b6accd8addada2aae39730dde2c957ca819c21e
---

# Phase 186 Plan 06: How the deployed smoke entry is run and read Summary

**`tests/README.md` now has a § Deployed smoke run that names the entry's inputs and refusals and gives the workstation run as six wrapped steps with expected output. It explains how to read the four gate lines and the failure headline, where the contestant's account and keychain item come from, and what keeps the run read-mostly. `CLAUDE.md` § Testing has one aligned line pointing to it.**

## The record

```
V1_exit=0                                  # prettier + 13 required strings
list_exit=0
Total: 2 tests in 2 files                  # yarn test:e2e:deployed --list --reporter=list
V2_exit=0                                  # list + no fenced line over 80 (longest is 60)
V3_exit=0                                  # CLAUDE.md: prettier, one added line, none changed
grep -c '^## Deployed smoke run' = 1
grep -c 'SMOKE_EXPECTED_SHA' tests/README.md = 5
grep -c 'yarn test:e2e:deployed' CLAUDE.md = 1
hyg_exit=0                                 # scripts/assert-comment-hygiene.mjs, 0 violations
```

A scan of the section for an email address, a JWT shape (`eyJ`) or a command that echoes a contestant variable found nothing (`scan_exit=1`, no match). One further check: with `PLAYWRIGHT_JSON_OUTPUT_FILE` and `PLAYWRIGHT_HTML_OUTPUT_DIR` exported, `--list --reporter=list` exited 0 and wrote neither report, which bears out the section's claim.

## Performance

- **Duration:** about 3 min (2026-11-14T23:24:24Z to 23:26:27Z, plus the summary)
- **Tasks:** 2 of 2
- **Files modified:** 2

## Accomplishments

- **`## Deployed smoke run`** sits directly before `## Concurrency model`, with its own `---` separator. Its subsections:
  - **The entry itself** (opening paragraphs): one project, `deployed-smoke`, specs `*.smoke.ts`, no setup or teardown, `retries: 0`, read-mostly. It is separate from the local suite and gives no way around its preflight, and `assertSmokeProjects` refuses any other configuration shape.
  - **Inputs:** a table with required/optional and default for each input, and the statement that no `.env` is loaded. It also lists the four refusals and why the expected ref and project id come only from the committed tfvars.
  - **Running it from a workstation:** six steps.
    1. Tree check, `git diff --quiet <image_tag> -- apps packages` → `tree_diff_exit=0`.
    2. Unset both keys and export `SMOKE_EXPECTED_SHA`.
    3. Read the keychain item without printing → `contestant_inputs=set`.
    4. Make the run directory and run → `smoke_exit=0`, with the gate's lines quoted.
    5. Verdict with both `--passed` flags and `--no-flaky` → `VERDICT OK: 2 tests …`.
    6. Unset the credentials.

    After the steps come the host-sleep note (no wrapper, so no heartbeat, and a check against `pmset -g log`, rerun under a new directory) and the `--list --reporter=list` command with the reason for `--reporter=list`.
  - **Reading the gate:** the line order and forms, the OK line, the thrown headline block, and the fact that `results.json` then holds no test. A table gives, for each check, what `observed` holds and the usual cause.
  - **The contestant's account:** creation and removal in Step 22 of `infra/envs/staging/supabase/README.md`, trace, screenshot and video off, and the `error-context.md` accessibility-snapshot caution.
  - **What keeps it read-mostly:** the ESLint block, `deployedSmokeGuards.test.ts` and `deployedTarget.test.ts`, all run by `yarn test:unit`.
  - **In the pipeline:** phase 187 calls the entry as its last stage with the built commit as `SMOKE_EXPECTED_SHA`, the smoke step holds no service-role key, and `forbidOnly` applies on CI.
- **CLAUDE.md:** `yarn test:e2e:deployed        # Read-mostly smoke of a deployed URL; needs SMOKE_EXPECTED_SHA. See tests/README.md § Deployed smoke run`, directly after the `yarn test:e2e` line and aligned to its comment column.

## Task Commits

1. **Task 1 (tracer): § Deployed smoke run, with its list command run.** `cd719adc0` (docs). Tracer feedback gate: both automated verifies were re-run and passed, so the plan went on to Task 2.
2. **Task 2: the Testing line in CLAUDE.md.** `8b6accd8a` (docs).

## Files Created/Modified

- `tests/README.md`: the new § Deployed smoke run (176 added lines, none removed)
- `CLAUDE.md`: one added line under § Testing

## Decisions Made

- The `error-context.md` risk had a natural place in the contestant-account part, so it is documented here and not deferred to 186-08. The section states the fact (an accessibility snapshot of the open page, which on the sign-in form can include the typed address) and the rule (such a run directory is never published, uploaded or attached). It does not recommend Playwright's undocumented `PLAYWRIGHT_NO_COPY_PROMPT`. 186-08 and phase 187 can still decide to set it.
- The gate-reading table is built from the observed-value strings in `deployedTarget.ts` exactly as they are written (`(status <n>)`, `(no build field)`, `(attribute absent)`, `(unsubstituted %projectId% placeholder)`, and so on), so a reader can match a FAIL line to its row.

## Deviations from Plan

### Judgement calls (operator away; safest reversible option taken)

**1. SUPA-09 not marked complete.** The plan's `requirements` lists SUPA-09, but it is met only by the hosted run in 186-08, as in 186-01 to 186-05. `requirements.mark-complete` was not run.

**2. Additions beyond the plan's list (no scope change).**
- A step 6 that unsets the contestant variables after the run.
- A voter-only variant for steps 4 and 5.
- A remedy for each status in the tree-check step.
- A short "Reading the gate" table.
- The `forbidOnly` behaviour on CI.

Each one describes code as built, and none adds a credential-bearing command.

Otherwise the plan was executed as written.

## Issues Encountered

None.

## Known Stubs

None.

## Threat Flags

None. These are documentation-only changes. T-186-16 is mitigated: the documented commands read the contestant's credentials into the environment without echoing them, the section says a failed contestant run directory is never published, and it says the pipeline's smoke step holds no service-role key. T-186-SC: no package was installed.

## Next Phase Readiness

- 186-07 (the phase's one full-suite run) and 186-08 (the hosted contestant sitting) can follow the section. 186-08's credentialed run is steps 1 to 6 of "Running it from a workstation".
- Phases 187 and 189 have the inputs, the refusals and the pipeline rule in one place.

## Self-Check: PASSED

- FOUND: tests/README.md (`## Deployed smoke run` 1 occurrence)
- FOUND: CLAUDE.md (`yarn test:e2e:deployed` 1 occurrence)
- FOUND: cd719adc0, 8b6accd8a (ancestors of HEAD)
