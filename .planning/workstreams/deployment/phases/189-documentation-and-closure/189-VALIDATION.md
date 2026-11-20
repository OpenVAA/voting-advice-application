---
phase: "189"
slug: "documentation-and-closure"
# status lifecycle: draft (seeded by plan-phase) → validated (set by validate-phase §6)
status: draft
nyquist_compliant: true
wave_0_complete: false
created: "2026-11-20"
---

# Phase 189 — Validation Strategy

> Seeded from `189-RESEARCH.md` § Validation Architecture (below); the planner fills the per-task map.

---


### Test Framework
| Property | Value |
|----------|-------|
| Framework | vitest (per workspace via turbo; root suites `tests/vitest.config.ts`, `infra/vitest.config.ts`); Playwright for E2E |
| Config file | `apps/frontend/vitest.config.ts`, `packages/dev-seed` (vitest run), `infra/vitest.config.ts` (`include: ['scripts/**/*.test.ts']`) |
| Quick run command | `yarn workspace @openvaa/frontend vitest run src/lib/server/startup src/lib/analytics`; `yarn test:unit:infra hosted-settings-reference`; `yarn workspace @openvaa/dev-seed vitest run tests/deploymentTemplates.test.ts tests/analyticsEnvTemplates.test.ts` |
| Full suite command | `yarn test:unit` (needs the local stack), `yarn lint:check`, `yarn format:check`, docs gates, full E2E wrapper run |

### Phase Requirements → Test Map
| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|-------------|
| DOCS-01 | guide on the Terraform/Supabase path, OpenTofu sentence, links resolve | docs gates + grep | `yarn workspace @openvaa/docs validate:links --check && yarn workspace @openvaa/docs build`; `git grep -n -i opentofu -- apps/docs` non-empty | partial (gates exist) |
| DOCS-02 | every hosted setting / function secret on the page | unit | `yarn test:unit:infra hosted-settings-reference` | ❌ Wave 0 |
| DOCS-03 | no unverified hosted statement | recorded search | the two `git grep` commands in § C-02, output classified in VERIFICATION | n/a (manual classification) |
| DOCS-04 | every task/required/analytics variable on the env page | unit | `yarn workspace @openvaa/frontend vitest run src/lib/server/startup` | ❌ Wave 0 (sibling of `taskEnvironment.test.ts`) |
| DOCS-05 | catalogue equals `EVENT_NAMES`; no "no consent" statement | unit + grep | `yarn workspace @openvaa/frontend vitest run src/lib/analytics`; `! git grep -n -i -E "(no|not) consent (is )?(required|needed)\|consent is not (required\|needed)\|does not (require\|need) consent" -- apps/docs` | ❌ Wave 0 |
| DOCS-06 | ops page covers the seven procedures + cost | manual review + link gate | `validate:links --check`; H-01 sittings' evidence rows | — |
| DOCS-07 | Render gone, orphan compose gone, production image builds | grep + unit + build | `test ! -e render.example.yaml && test ! -e apps/frontend/docker-compose.dev.yml`; `! git grep -n -E "render\.example\|render\.com\|fromGroup" -- ':!.planning' ':!scripts/fixtures'`; `! grep -n "AS development" apps/frontend/Dockerfile`; dev-seed tests green; `docker build … --target production` exit 0 | existing tests edited |
| DOCS-08 | seven closure records | file checks | `for f in <six files>; do test -f .planning/todos/completed/$f && grep -q '^status: completed' … && grep -q '^## Closed (phase 189)' …; done`; `test ! -e .planning/todos/pending/<f>` | — |
| B-03 | variables gone, no reader | grep + unit + targeted E2E | `! git grep -n FRONTEND_URL -- ':!.planning'`; frontend unit; wrapper runs `--project bank-auth`, `contestant-identity-provider`, `voter-journey` | — |

### Sampling Rate
- **Per task commit:** the guard's own vitest file, red then green; `yarn workspace @openvaa/docs validate:links --check` after any docs edit.
- **Per plan:** `yarn lint:check`, `yarn format:check`, `yarn test:unit` (stack up), targeted E2E only in the B-03 plan.
- **Phase gate:** full E2E run green, judged against 729 + Δ0; both C-02 searches recorded and classified.

### Wave 0 Gaps
- [x] `infra/scripts/hosted-settings-reference.test.ts` — DOCS-02 — planned red-first in 189-08 Task 1 (tdd)
- [x] `apps/frontend/src/lib/server/startup/environmentReference.test.ts` — DOCS-04 — planned red-first in 189-09 Task 1 (tdd)
- [x] `apps/frontend/src/lib/analytics/eventCatalogue.test.ts` — DOCS-05 — planned red-first in 189-10 Task 1 (tdd)
- Each red first against the current (or absent) page, which they must fail by naming the missing items. The three pages they read exist from 189-04 (wave 1), so each guard's first task runs it red against that page before writing the table. No `<automated>` in the phase is a `MISSING` sentinel.

### Manual / operator-only
- H-01(1): fresh read-only probe run (`node infra/scripts/probe-hosted.mjs --root infra/envs/staging/supabase`, Step 23) for G-04(c) — the latest recorded probe on the persistent project is 2026-11-14 (supabase README l.1884), before the 2026-11-19 function redeploy (l.1887); optional `dig` of `_dmarc.openvaa.org` (S18) and the `has_table_privilege` read (S27).
- H-01(2): the backups read (E-02).
- H-01(3): the origin-secret apply with health polled (E-03).
- Reading the docs pages as a deployer (DOCS-01/06 completeness).


---

## Per-Task Verification Map

| Task ID | Plan | Wave | Requirement | Threat Ref | Secure Behavior | Test Type | Automated Command | File Exists | Status |
|---------|------|------|-------------|------------|-----------------|-----------|-------------------|-------------|--------|
| 189-01-T1 | 01 | 1 | DOCS-07 | T-189-01 | template and every link to it gone in one commit | unit + docs gate | `yarn workspace @openvaa/dev-seed test:unit tests/deploymentTemplates.test.ts tests/analyticsEnvTemplates.test.ts tests/ciDockerImageBuildGate.test.ts` (45 passed) + `yarn workspace @openvaa/docs validate:links --check` | ✅ edited | ⬜ pending |
| 189-01-T2 | 01 | 1 | DOCS-07 | T-189-01 | only the demo link and fixture label name Render | grep + gate | Render `git grep -l` equals the two kept files; `yarn assert:comment-hygiene` | ✅ | ⬜ pending |
| 189-01-T3 | 01 | 1 | DOCS-07 | T-189-02 | requirement text matches the 2026-11-20 ruling | grep | DOCS-07 and criterion 5 carry `2026-11-20`, old wording absent | ✅ | ⬜ pending |
| 189-02-T1 | 02 | 1 | DOCS-04, DOCS-07 | T-189-04 | no reader left before removal | unit + grep | `yarn workspace @openvaa/frontend test:unit src/lib/api/utils/auth`; evidence `B03_*` lines | ✅ edited | ⬜ pending |
| 189-02-T2 | 02 | 1 | DOCS-04 | T-189-03 | templates list only read variables | unit + gates | dev-seed template + `localSupabaseUrl` tests; `B03_LINT_EXIT=0`, `B03_TEST_UNIT_EXIT=0` | ✅ | ⬜ pending |
| 189-02-T3 | 02 | 1 | DOCS-04 | T-189-04 | served code proven on the changed tree | E2E targeted | `tests/scripts/e2e-run.sh --project` bank-auth 12, contestant-identity-provider 42, voter-journey 2; `e2e-spec-verdict.mjs --no-flaky` | ✅ | ⬜ pending |
| 189-03-T1 | 03 | 1 | DOCS-07 | T-189-05 | production image unchanged in behaviour | build + unit | `docker build --file apps/frontend/Dockerfile --target production`; last `CMD` check; `ciDockerImageBuildGate.test.ts` | ✅ | ⬜ pending |
| 189-03-T2 | 03 | 1 | DOCS-07 | — | root compose kept with its references | evidence | `F03_*` lines | n/a | ⬜ pending |
| 189-04-T1 | 04 | 1 | DOCS-01/02/05/06 | T-189-06 | overview reachable measured | docs gate | `generate:navigation` x3, `validate:links --check`; `NAV_OVERVIEW_KEPT=` | ❌ pages new | ⬜ pending |
| 189-04-T2 | 04 | 1 | DOCS-01 | T-189-06 | decision bound at top level | checkpoint:decision (conditional) | `attempt.sh bound 189-04-2` | n/a | ⬜ pending |
| 189-04-T3 | 04 | 1 | DOCS-01 | T-189-07 | nav idempotent under the generator | unit (tdd) + docs gate | `yarn workspace @openvaa/docs test:unit`; `validate:links --check` | ✅ generator test | ⬜ pending |
| 189-05-T1 | 05 | 1 | DOCS-03, DOCS-08 | T-189-08 | no secret in evidence | evidence | readiness lines; key/token shape search | n/a | ⬜ pending |
| 189-05-T2 | 05 | 1 | DOCS-03 | T-189-09 | approval bound, operator runs reads | checkpoint:human-action | `attempt.sh put 189-05-2` | n/a | ⬜ pending |
| 189-05-T3 | 05 | 1 | DOCS-03, DOCS-08 | T-189-08, T-189-10 | reads recorded as dated rows, no address | evidence + format | `attempt.sh bound`; 22 `S1_CHECK_` lines; `prettier --check` both runbooks; IPv4/mailto search | ✅ runbooks | ⬜ pending |
| 189-06-T1 | 06 | 2 | DOCS-06 | T-189-12 | step reads only | grep + format | Step 24 present, no restore/POST; `prettier --check` | ✅ runbook | ⬜ pending |
| 189-06-T2 | 06 | 2 | DOCS-06 | T-189-11 | token on stdin, approval bound | checkpoint:human-action | `attempt.sh put 189-06-2` | n/a | ⬜ pending |
| 189-06-T3 | 06 | 2 | DOCS-06 | T-189-11 | backups recorded, no token | evidence + format | `E2_*` lines; token-shape search | ✅ | ⬜ pending |
| 189-07-T1 | 07 | 3 | DOCS-06 | T-189-15 | stop rule allows exactly three addresses | grep + format | Step 19 holds the module address, stop rule, `caffeinate -i` | ✅ runbook | ⬜ pending |
| 189-07-T2 | 07 | 3 | DOCS-06 | T-189-13, T-189-14 | operator applies only a met stop rule | checkpoint:human-action | `attempt.sh put 189-07-2` | n/a | ⬜ pending |
| 189-07-T3 | 07 | 3 | DOCS-06 | T-189-13 | converged, origin refuses wrong header, secret never printed | evidence | `R1_*` lines; 48-char secret-shape search | ✅ | ⬜ pending |
| 189-08-T1 | 08 | 2 | DOCS-02 | T-189-16 | every hosted setting listed | unit (tdd, red first) | `yarn test:unit:infra hosted-settings-reference` | ❌ new test | ⬜ pending |
| 189-08-T2 | 08 | 2 | DOCS-02 | T-189-16, T-189-17 | cited checks exist, no secret values | unit + docs gate | `yarn test:unit:infra hosted-settings-reference`; `validate:links --check` | ❌ new test | ⬜ pending |
| 189-09-T1 | 09 | 2 | DOCS-04 | T-189-18 | every read variable listed | unit (tdd, red first) | `yarn workspace @openvaa/frontend test:unit src/lib/server/startup` | ❌ new test | ⬜ pending |
| 189-09-T2 | 09 | 2 | DOCS-04 | T-189-18, T-189-19 | service-role key never on frontend; proxy depth measured | docs gate | `prettier --check`; `validate:links --check`; startup tests | ✅ | ⬜ pending |
| 189-10-T1 | 10 | 2 | DOCS-05 | T-189-20 | catalogue equals `EVENT_NAMES` both ways | unit (tdd, red first) | `yarn workspace @openvaa/frontend test:unit src/lib/analytics` | ❌ new test | ⬜ pending |
| 189-10-T2 | 10 | 2 | DOCS-05 | T-189-20 | mechanism as the tree has it | docs gate | section headings; `validate:links --check` | ✅ | ⬜ pending |
| 189-10-T3 | 10 | 2 | DOCS-05 | T-189-21, T-189-22 | no "no consent required" anywhere in docs | grep + docs gate | consent `git grep` empty; `validate:links --check` | ✅ | ⬜ pending |
| 189-11-T1 | 11 | 3 | DOCS-01 | T-189-25 | placeholders only, linked steps | docs gate | ≥8 stages; `validate:links --check` | ✅ | ⬜ pending |
| 189-11-T2 | 11 | 3 | DOCS-01, DOCS-03 | T-189-23, T-189-24 | seed.sql never on hosted; dated claims only | grep + docs gate | OpenTofu present; recorded-search words absent | ✅ | ⬜ pending |
| 189-11-T3 | 11 | 3 | DOCS-01 | — | bank auth stated not wired | docs build | `yarn workspace @openvaa/docs build` | ✅ | ⬜ pending |
| 189-12-T1 | 12 | 4 | DOCS-01/02/03 | T-189-26 | sign-up closed by the module, checked by the probe | docs gate | section bounded grep; `validate:links --check` (anchors) | ✅ | ⬜ pending |
| 189-12-T2 | 12 | 4 | DOCS-01/03 | T-189-27 | `behind_cloudflare` via bootstrap | docs gate + build | four headings unchanged; `validate:links --check`; docs build | ✅ | ⬜ pending |
| 189-13-T1 | 13 | 2 | DOCS-06 | T-189-28, T-189-30 | capacity a lower bound; DB never destroyed | docs gate | three headings; `validate:links --check` | ✅ | ⬜ pending |
| 189-13-T2 | 13 | 2 | DOCS-06 | T-189-29 | Admin job limit at its boundary; cost exact | docs gate + build | figures 50.78/36.96/44.26; docs build | ✅ | ⬜ pending |
| 189-14-T1 | 14 | 4 | DOCS-06 | T-189-33 | Storage loss on restore stated | docs gate | `## Restore`, citations, `E02_*`; `validate:links --check` | ✅ | ⬜ pending |
| 189-14-T2 | 14 | 4 | DOCS-06 | T-189-31, T-189-32 | secrets at prompt/stdin only | docs gate + build | ≥6 procedures; ≥10 `E03_SOURCE_`; docs build | ✅ | ⬜ pending |
| 189-15-T1 | 15 | 5 | DOCS-03 | T-189-34 | every statement disposed, none dropped | evidence + format | `C01_S3..S10`; section gone; `prettier --check` | ✅ | ⬜ pending |
| 189-15-T2 | 15 | 5 | DOCS-03 | T-189-34, T-189-35 | dated rows unedited | evidence + format | `C01_S11..S13`; section gone | ✅ | ⬜ pending |
| 189-15-T3 | 15 | 5 | DOCS-01 | — | back-links resolve | docs gate (inbound) | `validate:links --check` | ✅ | ⬜ pending |
| 189-16-T1 | 16 | 6 | DOCS-03 | T-189-37 | every statement disposed | evidence + docs gate | `C01_S14..S29`; sections gone; `validate:links --check` | ✅ | ⬜ pending |
| 189-16-T2 | 16 | 6 | DOCS-03 | T-189-36 | comment-only change | grep + fmt + gate | supplementary pattern empty over `infra/modules`; `terraform fmt -check`; `yarn assert:comment-hygiene` | ✅ | ⬜ pending |
| 189-16-T3 | 16 | 6 | DOCS-03 | T-189-37 | pre-launch risk kept, not called unmeasured | grep + docs gate | supplementary words absent on the auth page; `validate:links --check` | ✅ | ⬜ pending |
| 189-17-T1 | 17 | 5 | DOCS-08 | T-189-38, T-189-39 | opaque replies; `sub` on both copies | evidence | `G04_*` lines | n/a | ⬜ pending |
| 189-17-T2 | 17 | 5 | DOCS-08 | T-189-40 | each ask observed or moved | evidence | `G03_*` lines; ≥2 check sections | n/a | ⬜ pending |
| 189-17-T3 | 17 | 5 | DOCS-08 | T-189-41 | closure record, body intact | file check | moved, keys, closure heading | n/a | ⬜ pending |
| 189-18-T1 | 18 | 5 | DOCS-08 | T-189-41 | same closure shape for every todo | file check | frontmatter + closure for two todos | n/a | ⬜ pending |
| 189-18-T2 | 18 | 5 | DOCS-08 | T-189-41 | stale path corrected with note | file check | `corrected 2026-`; probe checks named | n/a | ⬜ pending |
| 189-18-T3 | 18 | 5 | DOCS-08 | T-189-41 | each gap cites its change | file check | 189-01/02/03 and storage cited | n/a | ⬜ pending |
| 189-19-T1 | 19 | 2 | DOCS-08 | T-189-42 | comment-only change to `seed.sql` | grep + gate | diff has only `--` lines; `yarn assert:comment-hygiene` | ✅ | ⬜ pending |
| 189-19-T2 | 19 | 2 | DOCS-08, DOCS-06 | — | INFRA-13 complete with figures | grep | INFRA-13 ticked, row Complete; FUT-01 note | ✅ | ⬜ pending |
| 189-19-T3 | 19 | 2 | DOCS-08 | — | re-targets dated | grep | `target: after the stream merges` ×2; dispatch row | ✅ | ⬜ pending |
| 189-20-T1 | 20 | 7 | DOCS-03, DOCS-08 | T-189-43 | every hit classified; docs/infra hits only dated rows or the probe name | recorded search | locked + supplementary `git grep`, `C02_UNCLASSIFIED=0`; six closed todos | n/a | ⬜ pending |
| 189-20-T2 | 20 | 7 | all | T-189-44 | gates on the closing tree | gates | `yarn db:reset`, `lint:check`, `format:check`, `test:unit`, `build`, docs `check`/`build`/`validate:links --check`, nav idempotent, `terraform fmt -check -recursive infra`, production `docker build` | ✅ | ⬜ pending |
| 189-20-T3 | 20 | 7 | all | T-189-44 | full suite green vs 729 + Δ0 | E2E full | `tests/scripts/e2e-run.sh --run-dir tests/e2e-runs/189-close-<stamp> --no-db-reset`; `e2e-spec-verdict.mjs --no-flaky` | ✅ | ⬜ pending |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky* — filled by the planner.

---

## Validation Sign-Off

- [x] All tasks have `<automated>` verify or Wave 0 dependencies (54 tasks in 20 plans, each with `<automated>` and `<fails_when>`)
- [x] Sampling continuity: no 3 consecutive tasks without automated verify
- [x] Wave 0 covers all MISSING references (none; the three guards are red-first tdd tasks)
- [x] No watch-mode flags
- [x] `nyquist_compliant: true` set in frontmatter

**Approval:** pending
