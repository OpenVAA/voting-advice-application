---
phase: 189-documentation-and-closure
verified: 2026-11-21T13:25:00Z
status: passed
score: 5/5 must-haves verified
covered_files:
  - .planning/workstreams/deployment/phases/189-documentation-and-closure/189-01-PLAN.md
  - .planning/workstreams/deployment/phases/189-documentation-and-closure/189-01-SUMMARY.md
  - .planning/workstreams/deployment/phases/189-documentation-and-closure/189-02-PLAN.md
  - .planning/workstreams/deployment/phases/189-documentation-and-closure/189-02-SUMMARY.md
  - .planning/workstreams/deployment/phases/189-documentation-and-closure/189-03-PLAN.md
  - .planning/workstreams/deployment/phases/189-documentation-and-closure/189-03-SUMMARY.md
  - .planning/workstreams/deployment/phases/189-documentation-and-closure/189-04-PLAN.md
  - .planning/workstreams/deployment/phases/189-documentation-and-closure/189-04-SUMMARY.md
  - .planning/workstreams/deployment/phases/189-documentation-and-closure/189-05-PLAN.md
  - .planning/workstreams/deployment/phases/189-documentation-and-closure/189-05-SUMMARY.md
  - .planning/workstreams/deployment/phases/189-documentation-and-closure/189-06-PLAN.md
  - .planning/workstreams/deployment/phases/189-documentation-and-closure/189-06-SUMMARY.md
  - .planning/workstreams/deployment/phases/189-documentation-and-closure/189-07-PLAN.md
  - .planning/workstreams/deployment/phases/189-documentation-and-closure/189-07-SUMMARY.md
  - .planning/workstreams/deployment/phases/189-documentation-and-closure/189-08-PLAN.md
  - .planning/workstreams/deployment/phases/189-documentation-and-closure/189-08-SUMMARY.md
  - .planning/workstreams/deployment/phases/189-documentation-and-closure/189-09-PLAN.md
  - .planning/workstreams/deployment/phases/189-documentation-and-closure/189-09-SUMMARY.md
  - .planning/workstreams/deployment/phases/189-documentation-and-closure/189-10-PLAN.md
  - .planning/workstreams/deployment/phases/189-documentation-and-closure/189-10-SUMMARY.md
  - .planning/workstreams/deployment/phases/189-documentation-and-closure/189-11-PLAN.md
  - .planning/workstreams/deployment/phases/189-documentation-and-closure/189-11-SUMMARY.md
  - .planning/workstreams/deployment/phases/189-documentation-and-closure/189-12-PLAN.md
  - .planning/workstreams/deployment/phases/189-documentation-and-closure/189-12-SUMMARY.md
  - .planning/workstreams/deployment/phases/189-documentation-and-closure/189-13-PLAN.md
  - .planning/workstreams/deployment/phases/189-documentation-and-closure/189-13-SUMMARY.md
  - .planning/workstreams/deployment/phases/189-documentation-and-closure/189-14-PLAN.md
  - .planning/workstreams/deployment/phases/189-documentation-and-closure/189-14-SUMMARY.md
  - .planning/workstreams/deployment/phases/189-documentation-and-closure/189-15-PLAN.md
  - .planning/workstreams/deployment/phases/189-documentation-and-closure/189-15-SUMMARY.md
  - .planning/workstreams/deployment/phases/189-documentation-and-closure/189-16-PLAN.md
  - .planning/workstreams/deployment/phases/189-documentation-and-closure/189-16-SUMMARY.md
  - .planning/workstreams/deployment/phases/189-documentation-and-closure/189-17-PLAN.md
  - .planning/workstreams/deployment/phases/189-documentation-and-closure/189-17-SUMMARY.md
  - .planning/workstreams/deployment/phases/189-documentation-and-closure/189-18-PLAN.md
  - .planning/workstreams/deployment/phases/189-documentation-and-closure/189-18-SUMMARY.md
  - .planning/workstreams/deployment/phases/189-documentation-and-closure/189-19-PLAN.md
  - .planning/workstreams/deployment/phases/189-documentation-and-closure/189-19-SUMMARY.md
  - .planning/workstreams/deployment/phases/189-documentation-and-closure/189-20-PLAN.md
  - .planning/workstreams/deployment/phases/189-documentation-and-closure/189-20-SUMMARY.md
  - apps/docs/src/lib/components/NavigationItem.svelte
  - apps/docs/src/lib/navigation.config.ts
  - apps/docs/src/lib/utils/navigation.ts
  - apps/docs/src/routes/(content)/developers-guide/configuration/analytics/+page.md
  - apps/docs/src/routes/(content)/developers-guide/configuration/environmental-variables/+page.md
  - apps/docs/src/routes/(content)/developers-guide/deployment/+page.md
  - apps/docs/src/routes/(content)/developers-guide/deployment/hosted-settings/+page.md
  - apps/docs/src/routes/(content)/developers-guide/deployment/operations/+page.md
  - apps/frontend/Dockerfile
  - apps/frontend/src/lib/analytics/eventCatalogue.test.ts
  - apps/frontend/src/lib/server/startup/environmentReference.test.ts
  - docker-compose.dev.yml
  - infra/scripts/hosted-settings-reference.test.ts
covered_digest: "v4:sha256:04a982de1ed4cfb8a595b82cc52fa707aa710f8e6e251143eb033bf77e4ae902"
behavior_unverified: 0
overrides_applied: 0
---

# Phase 189: Documentation and Closure Verification Report

**Phase Goal:** A deployer can follow the documentation from an empty AWS account and a new Supabase project to a tested instance, every statement about a hosted project is a dated observation, and the absorbed todos are closed on the record.
**Verified:** 2026-11-21T13:25:00Z
**Status:** passed
**Re-verification:** No, initial verification

## Goal Achievement

The five ROADMAP success criteria are the contract (criterion 5 as amended by 189-CONTEXT F-01, the operator's 2026-11-20 overrule). Each was checked against the tree at HEAD `7245a1e96`, not against the SUMMARY files.

### Observable Truths

| #   | Truth | Status | Evidence |
| --- | ----- | ------ | -------- |
| 1   | The deployment guide follows the Terraform and Supabase-as-code path, says the HCL is kept OpenTofu-compatible; a settings reference lists each hosted setting, where the repository sets it and how to verify it; the env-variable reference covers the proxy variables, the analytics variables and `PUBLIC_PROJECT_ID` | VERIFIED | `developers-guide/deployment/+page.md` (334 lines) walks eight stages from fork-and-configure through the account-level root, the zone-and-mail root, the Supabase root, the two parameters, the AWS root and image, the probe and smoke checks, and the deploy pipeline, with commands against `infra/envs/<env>/{dns-mail,supabase,aws}` and each cited script present (`infra/scripts/push-migrations.sh`, `build-push-image.sh`, `probe-hosted.mjs`, `bootstrap.sql`, `grant-project-admin.sql`, `infra/envs/example/*`, `infra/bootstrap/example.tfvars`, `infra/.terraform-version`). Line 26: "The HCL is kept to what OpenTofu also accepts". `deployment/hosted-settings/+page.md` has one row per setting (group, setting, value, where set, parity class, probe check); `infra/scripts/hosted-settings-reference.test.ts` (22 tests) holds it to the JSON keys, secret names, stale rows and values, and passes. `configuration/environmental-variables/+page.md` has sections Required at start, `PUBLIC_PROJECT_ID`, Proxy (`ORIGIN`, `ADDRESS_HEADER`, `XFF_DEPTH` and how the depth is measured), Timeouts, Analytics (six `ANALYTICS_*`), Logging and diagnostics, Identity provider, Edge Functions (`send-email` reads `PUBLIC_PROJECT_ID`, the l.62 fix), Bootstrap, Local only; `environmentReference.test.ts` guards both directions and passes. Docs build exit 0, `validate:links --check` 0 findings, docs unit tests 50 passed. |
| 2   | A search of the documentation and the repository's comments finds no statement about a hosted project marked unverified; each is a dated observation or removed | VERIFIED | The locked C-02 search `git grep -n -i -E 'unverified\|not yet observed\|untested' -- ':!.planning'` re-run here returns 92 hits, the count recorded in `evidence/189-20-recorded-searches.md`, with 0 unclassified. The "Not yet observed" sections of the bootstrap, AWS, dns-mail and supabase runbooks are gone (only two phrases remain, see Anti-Patterns). The remaining open questions went to `.planning/todos/pending/2026-11-20-189-unobserved-statements-about-the-deployed-stack.md` and `...-pre-launch-auth-checks-on-the-production-project.md`. Dated observation rows cite the 2026-11-20 probe sitting (`evidence/189-05-staging-reads.md`). |
| 3   | The analytics documentation gives the event catalogue, how to add a provider, the privacy mechanism and a deployer's checklist; says the consent determination is the deployer's; nowhere says no consent is required | VERIFIED | `configuration/analytics/+page.md` has the sections How it works, Event catalogue, Adding a provider, Privacy mechanism and The deployer's checklist (eleven items). Line 90: "Whether a deployment may collect usage data, and whether it must ask for consent first, is the deployer's determination ... The repository makes no such determination". `eventCatalogue.test.ts` (names exactly the `EventSchema` literals, and the Sensitive column against `SENSITIVE_EVENTS`) passes. A grep of the docs, the publishers' guide, the analytics code, `CLAUDE.md` and `infra/README.md` for "no consent", "consent is not required", "without consent", "exempt" finds no such claim. The publishers' guide page `what-data-should-be-collected` points to the checklist. The feedback-limit retention claim ("nothing deletes the row") matches `107-feedback.sql`, which has no delete of `feedback_rate_limits`. |
| 4   | An operations runbook covers election-day scaling, rollback, teardown and restore, secret rotation, SES, and the Admin job limit | VERIFIED | `deployment/operations/+page.md` (363 lines) has Election-day scaling (with Capacity), Rollback (circuit breaker, roll-forward, FUT-10), Teardown, Restore (what Supabase keeps, in place, to a new project, each cited from Supabase's documentation read 2026-11-21, with the staging backups read of 2026-11-20 and the statement that no restore has been run), Secret rotation (nine procedures; the origin header secret rehearsed on staging 2026-11-20, a 5-second 403 window and no 5xx, `evidence/189-07-origin-rotation.md`), SES sandbox and production access, Admin jobs and more than one task (`jobStore.ts` in memory, `task_ceiling = 2`, the pin-to-one workaround), and Cost (50.78 / 36.96 / 44.26 USD). The three operator sittings (probe and reads, backups read, origin rotation) are recorded in `evidence/189-05`, `-06` and `-07`. |
| 5   | The Render deployment example and its mentions are removed, the orphan compose file is retired if nothing references it, and each of the seven absorbed todos has a closure record (amended by F-01) | VERIFIED | `render.example.yaml` and `apps/frontend/docker-compose.dev.yml` are gone from the tree (commits `5f8ae5034`, `96b53fc8b`); `git grep` for Render outside `.planning/` finds only unrelated verbs ("Render a ...") and one demo link to an externally hosted example VAA on the docs landing page, which is not a deployment mention. No `development` Dockerfile stage or `--target development` remains. `PUBLIC_BROWSER_FRONTEND_URL` and `PUBLIC_SERVER_FRONTEND_URL` survive only as stale-name fixtures inside `environmentReference.test.ts`. Root `docker-compose.dev.yml` is kept and its dev-seed tests pass (4 files, 107 tests). Six todos sit in `.planning/todos/completed/` with `completed: 2026-11-2x`, `status: completed` (one carries the fields in a longer front matter) and a `## Closed (phase 189)` section with built / remains / moved; the seventh, the per-caller limit, is closed by phase 188 and pointed to from `189-20-SUMMARY.md`. Six new pending todos carry what moved. DOCS-07 and ROADMAP criterion 5 carry the F-01 amendment. |

**Score:** 5/5 truths verified (0 present, behavior-unverified)

### Closing E2E (CLAUDE.md ruling 2026-11-09)

| Check | Result |
| ----- | ------ |
| Run | `tests/e2e-runs/189-close2-20261121T122229Z`: `exit` 0, `wrapper-exit` 0, `head` 03469505a, no `VOID-host-suspend.txt`; `node tests/scripts/e2e-evidence.mjs` read here: total 729, passed 729, failed 0, flaky 0, skipped 0, didNotRun 0 |
| Baseline | `188-close3-20261119T213204Z`: 729 tests, all `passed` in `results.json`; this run's `results.json` also 729, all `passed`; summed delta 0 |
| Void run | `189-close-20261121T081102Z` carries `VOID-host-suspend.txt` and exit 8; not evidence either way |
| Commits after the run (`git diff 03469505a HEAD`, outside `.planning/`) | Docs navigation (`navigation.ts`, `NavigationItem.svelte`, new `navigation.test.ts`), unit-test files (`environmentReference.test.ts`, `eventCatalogue.test.ts`, `hosted-settings-reference.test.ts`), one test fixture, one env page sentence, the Dockerfile stage fold, and comment-only edits in `condenseArguments.ts` and `generateQuestionInfo.ts` (diff read: comment lines only, no statement changed). Nothing under `tests/` or `apps/frontend/src/routes/`. The E2E suite serves none of these beyond comments, so the run stands for HEAD |

### Required Artifacts

| Artifact | Expected | Status | Details |
| -------- | -------- | ------ | ------- |
| `apps/docs/.../deployment/+page.md` | Terraform-path guide | VERIFIED | 334 lines, eight stages, dated observations with runbook links, no Render |
| `apps/docs/.../deployment/hosted-settings/+page.md` | Settings reference | VERIFIED | one row per setting, guarded |
| `apps/docs/.../deployment/operations/+page.md` | Runbook summary | VERIFIED | 363 lines, eight sections |
| `apps/docs/.../configuration/analytics/+page.md` | Analytics page | VERIFIED | 102 lines, five sections |
| `apps/docs/.../configuration/environmental-variables/+page.md` | Env reference by role | VERIFIED | 201 lines, guarded both ways |
| `apps/docs/src/lib/navigation.config.ts` | Deployment subtree | VERIFIED | Overview, Hosted settings and Operations children at lines 250-263, plus the analytics route |
| `infra/scripts/hosted-settings-reference.test.ts`, `environmentReference.test.ts`, `eventCatalogue.test.ts`, `navigation.test.ts` | Guards | VERIFIED | All run here and pass (22, 35 across the two frontend files, docs 50) |
| `.planning/todos/completed/` six records and `pending/2026-11-20-189-*` six new todos | Closure records | VERIFIED | Present with the closing sections |

### Key Link Verification

| From | To | Via | Status | Details |
| ---- | -- | --- | ------ | ------- |
| Guide | Runbook steps | dated "Observed on staging" rows with anchored links | WIRED | `validate:links --check` reports 0 findings in-site, 0 github-path, 0 inbound |
| Guide | Hosted settings, Operations, Env, Analytics pages | in-site links | WIRED | Same link check |
| Nav menu | New pages | `generate:navigation`, idempotent per `189-20-closing-gates.md` | WIRED | Config holds the three Deployment entries |
| Publishers' guide | Analytics checklist | link | WIRED | `what-data-should-be-collected/+page.md:11` |

### Data-Flow Trace (Level 4)

Not applicable beyond the docs navigation: the menu's current-leaf logic reads the real `navigation.config.ts`, and `navigation.test.ts` exercises it against that config.

### Behavioral Spot-Checks

| Behavior | Command | Result | Status |
| -------- | ------- | ------ | ------ |
| Env reference guard | `vitest run environmentReference.test.ts eventCatalogue.test.ts` (frontend) | 2 files, 35 tests, exit 0 | PASS |
| Hosted-settings guard | `vitest run --config infra/vitest.config.ts infra/scripts/hosted-settings-reference.test.ts` | 22 tests, exit 0 | PASS |
| Docs unit tests (nav, CR-01) | `vitest run` in `apps/docs` | 9 files, 50 tests, exit 0 | PASS |
| Compose and Dockerfile guards | dev-seed `ciDockerImageBuildGate`, `deploymentTemplates`, `analyticsEnvTemplates`, `localSupabaseUrl` | 4 files, 107 tests, exit 0 | PASS |
| Docs build and links | `yarn workspace @openvaa/docs build`, `validate:links --check` | exit 0, 0 findings | PASS |
| Production image after IN-03 | `docker build --file apps/frontend/Dockerfile --target production .` | exit 0; CMD `["node","./apps/frontend/build/index.js"]`, WORKDIR `/opt` | PASS |

### Probe Execution

SKIPPED: the phase declares no probe script of its own. The conformance probe's hosted run is operator evidence (`evidence/189-05-staging-reads.md`, 22 checks, 2026-11-20); the probe's offline tests are in `yarn test:unit:infra` (458 tests, green per `189-REVIEW-FIX.md`).

### Requirements Coverage

| Requirement | Source Plan | Description | Status | Evidence |
| ----------- | ----------- | ----------- | ------ | -------- |
| DOCS-01 | 04, 11, 12, 15, 16, 20 | Guide on the Terraform path, OpenTofu-compatible | SATISFIED | Truth 1 |
| DOCS-02 | 04, 08, 12, 20 | Settings reference | SATISFIED | Truth 1, guard test |
| DOCS-03 | 05, 11, 12, 15, 16, 20 | Unverified statements observed or removed | SATISFIED | Truth 2 |
| DOCS-04 | 02, 09, 20 | Env reference | SATISFIED | Truth 1, guard test |
| DOCS-05 | 04, 10, 20 | Analytics docs, consent is the deployer's | SATISFIED | Truth 3 |
| DOCS-06 | 04, 06, 07, 13, 14, 19, 20 | Operations runbook | SATISFIED | Truth 4 |
| DOCS-07 | 01, 02, 03, 20 | Render removed, orphan compose retired (F-01 amendment) | SATISFIED | Truth 5 |
| DOCS-08 | 05, 17, 18, 19, 20 | Closure record for each of seven todos | SATISFIED | Truth 5 |

All eight IDs appear in plan frontmatter and in REQUIREMENTS.md (marked Complete); no orphaned requirement maps to phase 189.

### Anti-Patterns Found

| File | Line | Pattern | Severity | Impact |
| ---- | ---- | ------- | -------- | ------ |
| `infra/bootstrap/README.md` | 1208, 1210 | "not yet observed" inside two dated observation rows (2026-11-16, 2026-11-17) | Info | Each is a dated record of what was unobserved that day and is resolved by the rows that follow (runs 44042442257, 44088753527); classified `DatedObservationsRow` in the recorded search. Not a live unverified claim |
| Debt markers | modified files | `TBD`, `FIXME`, `XXX` | None | No unreferenced marker found by the closing gates (`lint:check` exit 0, comment hygiene 0 violations) |

### Review findings (`189-REVIEW.md`, `189-REVIEW-FIX.md`)

All eight findings are fixed in commits `c0075be1c` to `4847ca056`. The two marked "needs human verification" were settled here:

- **CR-01** (docs menu current leaf): `navigation.test.ts` renders the Deployment disclosure with `svelte/server` for each of its three pages against the real config and asserts exactly one `menu-active` link and the right previous and next page; it passes here (docs 50 tests). The matching logic is covered by test, not by a look at the rendered site.
- **IN-03** (`frontend` stage folded into `production`): the production target builds here (exit 0), CMD and WORKDIR unchanged, and the `ciDockerImageBuildGate` test passes. Every consumer of the target names `production`.

### Human Verification Required

None required by a must-have. The restore drill, the rehearsal of the non-origin secret rotations, the bank-authentication wiring on the AWS task and the hosted pre-launch auth checks are deferred by decision (189-CONTEXT) to pending todos, each recorded.

Optional: open the built docs site once and look at the Deployment menu group (three leaves, one highlighted per page). The unit test already asserts this.

### Gaps Summary

No gaps. Phase 189 delivers the Terraform-path guide, the hosted-settings, environment-variable, analytics and operations pages (each with a guard test where a code source exists), the sweep of unverified statements with a recorded, fully classified search, the Render removal and the compose retirement, and closure records for all seven todos. The full E2E run is green at 729 of 729 against a baseline of 729, and the commits after it change no served code beyond comments.

---

_Verified: 2026-11-21T13:25:00Z_
_Verifier: Claude (gsd-verifier)_
