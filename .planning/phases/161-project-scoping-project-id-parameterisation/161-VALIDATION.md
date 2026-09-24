---
phase: 161
slug: project-scoping-project-id-parameterisation
# status lifecycle: draft (seeded by plan-phase) → validated (set by validate-phase §6)
# audit-milestone §5.5 distinguishes NOT-VALIDATED (draft) from PARTIAL (validated + nyquist_compliant: false) (#2117)
status: draft
nyquist_compliant: true
wave_0_complete: false
created: 2026-08-28
---

# Phase 161 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Unit framework** | vitest (catalog `^3.2.4`) — per-workspace `vitest.config.ts`; no install needed |
| **E2E framework** | `@playwright/test` (catalog `^1.58.2`), config `tests/playwright.config.ts`; no install needed |
| **SQL framework** | pgTAP via `supabase test db`; entry point `yarn workspace @openvaa/supabase test:db` is **created by plan 161-02 task 2** (Wave 0 item) |
| **Static guard** | `scripts/assert-project-scoped-queries.mjs` — **created by plan 161-01 task 3** (Wave 0 item) |
| **Config files** | `apps/frontend/vitest.config.ts`, `packages/dev-seed/vitest.config.ts`, `tests/playwright.config.ts`, `apps/supabase/supabase/config.toml` |
| **Quick run command** | `yarn workspace @openvaa/frontend test:unit` · `yarn workspace @openvaa/dev-seed test:unit` · `node scripts/assert-project-scoped-queries.mjs` |
| **Full unit suite** | `yarn test:unit` — ⚠ leaves a seeded dataset in the **default** project; must never run between the two proof runs in plan 161-07 |
| **Full lint gate** | `TURBO_FORCE=true yarn lint:check` — 6 links today, 7 after this phase appends its guard, 8–9 if the two sibling phases land first |
| **Full E2E suite** | `yarn test:e2e` |
| **Evidence-producing E2E run** | `tests/scripts/e2e-run.sh --run-dir <path> [--no-db-reset]` — the flag is **created by plan 161-05 task 2** (Wave 0 item) |
| **Estimated runtime** | unit ≈ 60 s · guard < 1 s · pgTAP ≈ 30 s · full E2E ≈ 640 s (150 tests / 10.7 min, last measured) |

---

## Sampling Rate

- **After every task commit:** the touched workspace's `test:unit` plus
  `node scripts/assert-project-scoped-queries.mjs` (sub-second). For Supabase-tree tasks, add
  `yarn workspace @openvaa/supabase test:db`.
- **After every plan wave:** `TURBO_FORCE=true yarn lint:check` + `yarn test:unit` + `yarn build`.
  ⚠ `yarn test:unit` contaminates the default project — harmless mid-development, forbidden between
  the two proof runs.
- **Before `/gsd-verify-work`:** plan 161-07's two full-suite runs green with no intervening reset,
  then plan 161-08's contamination run.
- **Max feedback latency:** 60 s for every task except the three full-suite runs, which are ~11 min
  each by construction and are the phase's terminal gates rather than its sampling loop.

---

## Per-Task Verification Map

| Task ID | Plan | Wave | Requirement | Threat Ref | Secure Behavior | Test Type | Automated Command | File Exists | Status |
|---------|------|------|-------------|------------|-----------------|-----------|-------------------|-------------|--------|
| 161-01-01 | 01 | 1 | PRESHIP-01 | — | N/A (decision checkpoint) | checkpoint | `git diff --name-only \| grep -Ev '^\.planning/' \| wc -l` is 0 | ✅ | ⬜ pending |
| 161-01-02 | 01 | 1 | PRESHIP-01 | T-161-04 / T-161-07 | Missing or malformed configuration throws at adapter init; the message names the variable and the remedy, never a secret | unit | `yarn workspace @openvaa/frontend test:unit` | ❌ W0 (3 new test files) | ⬜ pending |
| 161-01-03 | 01 | 1 | PRESHIP-01 | T-161-02 / T-161-09 | An unscoped project-scoped table access blocks the lint gate; the guard fails closed on anything it cannot parse | guard + flip | `node scripts/assert-project-scoped-queries.mjs && node scripts/assert-project-scoped-queries.mjs --self-test && yarn workspace @openvaa/dev-seed test:unit` | ❌ W0 (guard, fixtures, gate spec) | ⬜ pending |
| 161-02-01 | 02 | 2 | PRESHIP-01 | — | N/A (decision checkpoint) | checkpoint | `git status --porcelain apps/supabase \| wc -l` is 0 | ✅ | ⬜ pending |
| 161-02-02 | 02 | 2 | PRESHIP-01 | T-161-03 / T-161-11 | The RPC refuses to run without a project; the live database, not just the generated types, carries the new signature | pgTAP + schema apply | `yarn workspace @openvaa/supabase test:db` | ❌ W0 (`test:db` script) | ⬜ pending |
| 161-02-03 | 02 | 2 | PRESHIP-01 | T-161-02 / T-161-10 | Every read is project-filtered; the settings row is selected by project, not by an unordered limit | unit | `yarn workspace @openvaa/frontend test:unit && node scripts/assert-project-scoped-queries.mjs` | ⚠ file exists, cases do not | ⬜ pending |
| 161-02-04 | 02 | 2 | PRESHIP-01 | T-161-03 | Two projects' nominations never mix, including under an external-id collision | pgTAP | `yarn workspace @openvaa/supabase test:db` | ❌ W0 (new cases in `07-rpc-security.test.sql`) | ⬜ pending |
| 161-03-01 | 03 | 2 | PRESHIP-01 | T-161-01 / T-161-04 / T-161-07 | A caller-supplied project id is refused unless it matches; missing configuration fails loudly and opaquely | source assertion | the convergence check in the task's `<verify><automated>` | ✅ | ⬜ pending |
| 161-03-02 | 03 | 2 | PRESHIP-01 | T-161-13 / T-161-14 | No secret or literal id enters the tracked config; the runtime either receives the variable or the gap is filed | source + invocation | the wiring check in the task's `<verify><automated>` | ✅ | ⬜ pending |
| 161-04-01 | 04 | 3 | PRESHIP-01 | T-161-02 / T-161-15 / T-161-16 | Writes and storage paths carry the configured project; an identity-scoped RPC's project is cross-checked | unit | `yarn workspace @openvaa/frontend test:unit` | ⚠ file exists, cases do not | ⬜ pending |
| 161-04-02 | 04 | 3 | PRESHIP-01 | T-161-02 | The admin job insert carries the configured project with no derivation query | unit | `yarn workspace @openvaa/frontend test:unit` | ⚠ file exists, cases do not | ⬜ pending |
| 161-04-03 | 04 | 3 | PRESHIP-01 | T-161-09 | No adapter source sits outside the guard's checked set | guard + unit + flip | `node scripts/assert-project-scoped-queries.mjs && node scripts/assert-project-scoped-queries.mjs --self-test && yarn workspace @openvaa/dev-seed test:unit` | ⚠ gate spec exists, new assertions do not | ⬜ pending |
| 161-05-01 | 05 | 3 | PRESHIP-01 | T-161-18 / T-161-19 | An E2E id colliding with the default project is refused; local seeding paths are not re-pointed | unit + integration | `yarn workspace @openvaa/dev-seed test:unit && yarn typecheck:tests` | ❌ W0 (`ensureProject.test.ts`) | ⬜ pending |
| 161-05-02 | 05 | 3 | PRESHIP-01 | T-161-20 / T-161-21 / T-161-23 | The preflight still runs first; the no-reset path still starts the database; no secret is written to evidence | shell + CLI + smoke | `bash -n tests/scripts/e2e-run.sh && tests/scripts/e2e-run.sh --help && yarn typecheck:tests` | ✅ | ⬜ pending |
| 161-05-03 | 05 | 3 | PRESHIP-01 | T-161-22 | The probe describes the project it actually reads; the dead exclusion is gone | source assertion | the probe/filings check in the task's `<verify><automated>` | ✅ | ⬜ pending |
| 161-06-01 | 06 | 4 | PRESHIP-01 | T-161-24 / T-161-25 / T-161-26 | No live document sends a reader to destroy state the suite depends on; legitimate command documentation survives | doc grep | `yarn workspace @openvaa/dev-seed test:unit` | ❌ W0 (`e2eDocPreconditionGate.test.ts`) | ⬜ pending |
| 161-06-02 | 06 | 4 | PRESHIP-01 | T-161-24 | The retirement is gated, with an explicit allowlist and a completeness half | unit + flip | `yarn workspace @openvaa/dev-seed test:unit` | ❌ W0 | ⬜ pending |
| 161-07-01 | 07 | 5 | PRESHIP-01 | T-161-27 / T-161-28 / T-161-29 | The verdict is read from artefacts, not impressions; the run is against this checkout | E2E, full suite | the run-one verdict check in the task's `<verify><automated>` | ✅ harness exists | ⬜ pending |
| 161-07-02 | 07 | 5 | PRESHIP-01 | T-161-27 / T-161-30 | Two runs, one commit, no reset between them | E2E, full suite | the pair verdict check in the task's `<verify><automated>` | ✅ harness + new flag | ⬜ pending |
| 161-07-03 | 07 | 5 | PRESHIP-01 | T-161-31 | Discarded attempts are on the record, not only the successful pair | checkpoint | human confirmation against the two evidence directories | ✅ | ⬜ pending |
| 161-08-01 | 08 | 6 | PRESHIP-01 | T-161-32 / T-161-33 | The isolation assertion is non-vacuous and leaves no residue of its own | unit + integration | `yarn workspace @openvaa/dev-seed test:unit` | ❌ W0 (`projectScopedContaminationIsolation.test.ts`) | ⬜ pending |
| 161-08-02 | 08 | 6 | PRESHIP-01 | T-161-34 / T-161-35 / T-161-36 | The suite is green with the residue genuinely present and no reset | E2E, full suite | the contamination-run verdict check in the task's `<verify><automated>` | ✅ harness exists | ⬜ pending |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky*

**Sampling continuity:** no three consecutive tasks lack an automated verify. Every task in the map
carries an `<automated>` command or is a checkpoint whose gate is itself a command.

---

## Wave 0 Requirements

Test infrastructure that does not exist yet and is created by the plan that first needs it. There is
no separate Wave 0 plan: each item is created inside the task that depends on it, before that task's
implementation half, and each is listed here so a reader can see the gap was named rather than assumed.

- [ ] `scripts/assert-project-scoped-queries.mjs` plus
      `scripts/fixtures/project-scoped-queries/{violation,clean}.fixture.ts` and its `--self-test`
      mode — created by 161-01 task 3. Covers criterion 2.
- [ ] `packages/dev-seed/tests/projectScopingGate.test.ts` — the lint-chain membership spec, created
      by 161-01 task 3 and extended by 161-04 task 3. Covers criterion 2.
- [ ] `apps/frontend/vite.projectIdEnv.test.ts`,
      `apps/frontend/src/lib/api/adapters/supabase/supabaseAdapter.test.ts` and
      `apps/frontend/src/lib/api/adapters/supabase/feedbackWriter/supabaseFeedbackWriter.test.ts` —
      created by 161-01 task 2. Covers criterion 1 and the empty/encoding edges.
- [ ] `test:db` script in `apps/supabase/package.json` — created by 161-02 task 2, so the pgTAP suite
      has a named entry point.
- [ ] New project-scope cases in `apps/supabase/supabase/tests/database/07-rpc-security.test.sql` —
      created by 161-02 task 4. Covers criterion 2's RPC half and the adjacency edge.
- [ ] New cases in `supabaseDataProvider.test.ts`, `supabaseDataWriter.test.ts` and
      `supabaseAdminWriter.test.ts` — the files exist, the cases do not.
- [ ] `packages/dev-seed/tests/ensureProject.test.ts` — created by 161-05 task 1. Covers criterion 3's
      idempotency half and the adjacency and ordering edges.
- [ ] `tests/scripts/e2e-run.sh --no-db-reset` — created by 161-05 task 2. This is criterion 3's
      evidence path; without it the canonical harness cannot produce a reset-free run.
- [ ] `packages/dev-seed/tests/e2eDocPreconditionGate.test.ts` — created by 161-06 task 2. Covers
      criterion 4.
- [ ] `packages/dev-seed/tests/projectScopedContaminationIsolation.test.ts` — created by 161-08 task 1.
      The automated negative control for the contamination-immunity claim.
- [ ] Framework install: **none needed** — vitest, Playwright and pgTAP are all present.

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| The project id reaches a genuinely running dev server through the repo-root environment file rather than only through a shell prefix | PRESHIP-01 criterion 1 | The plumbing runs inside Vite's config factory at process start; a unit test exercises the resolver, but only a real server proves the whole chain | Run `yarn db:reset-with-data`, then `yarn dev` with the line present in the repo-root `.env` and **no** shell prefix; load the voter home page and confirm data renders and the browser issues project-filtered requests. Recorded in 161-01 task 2's `<verify><manual>` |
| The local edge runtime supplies the project id to the identity function | PRESHIP-01 criterion 1 | The delivery mechanism is a low-confidence claim about the installed CLI; only invoking the deployed-local function distinguishes wired from unwired | Three POST probes described in 161-03 task 2: no project id, a mismatched one, and a matching one; record status and body for each |
| The two full-suite runs discharge criterion 3 | PRESHIP-01 criterion 3 | The automated checks assert the numbers; a human must confirm that no flake was waived, no did-not-run test was counted as a pass, and nothing touched the database between the runs | 161-07 task 3's checkpoint, against the two evidence directories |

---

## Validation Sign-Off

- [x] All tasks have `<automated>` verify or a Wave 0 dependency named above
- [x] Sampling continuity: no 3 consecutive tasks without automated verify
- [x] Wave 0 covers all MISSING references
- [x] No watch-mode flags
- [x] Feedback latency < 60 s for every task except the three terminal full-suite runs
- [x] `nyquist_compliant: true` set in frontmatter

**Approval:** pending
