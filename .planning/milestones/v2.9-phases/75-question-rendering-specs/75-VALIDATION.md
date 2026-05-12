---
phase: 75
slug: question-rendering-specs
status: revised
nyquist_compliant: true
wave_0_complete: true
created: 2026-05-11
revised: 2026-05-12
revision_notes: |
  Per checker feedback (4 BLOCKER + 6 WARNING). Plan 02 split into Plan 02a (Wave 2,
  autonomous=true) + Plan 02b (Wave 3, autonomous=false) per CONTEXT D-01 fallback.
  Dedup audit promoted to a persistent Nyquist-compliant artifact at
  `75-02-DEDUP-AUDIT.md` (B-03). Pre-flight DB seed gate added as Plan 02a Task 0
  (B-04). 4-step contract revised to include explicit `page.goBack()` browser-back
  persistence assertion per CONTEXT D-05 step 3 LOCKED (B-02). W-01 testId reason
  annotations, W-02 strict grep, W-04 negative `.last()` check, W-05 programmatic
  seed verification, W-06 runtime budget all enforced in revised plans.
  nyquist_compliant flipped from false → true (B-03 dedup audit now writes
  persistent artifact with automated `test -f` + `grep -q "AUDIT COMPLETE"` gate).
---

# Phase 75 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.
> **REVISED 2026-05-12** — checker feedback addressed; see revision_notes in frontmatter.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | Playwright 1.58.2 (E2E) + Vitest (unit, not exercised by Phase 75) |
| **Config file** | `tests/playwright.config.ts` (timeout: 90000, workers: CI?1:6, fullyParallel: true) |
| **Quick run command** | `yarn workspace @openvaa/tests test:e2e --workers=1 --grep "@voter"` (per-spec subset) |
| **Single spec command** | `yarn workspace @openvaa/tests test:e2e --workers=1 -- tests/specs/voter/voter-question-rendering-{boolean,categorical}.spec.ts` |
| **Full suite command** | `yarn dev:reset-with-data && yarn test:e2e --workers=1` (with `rm -rf apps/frontend/node_modules/.vite apps/frontend/.svelte-kit` first per D-09 vite-cache wipe) |
| **3-run determinism gate** | Same full suite × 3 (no reset between runs 2 + 3); identical pass/fail set per D-07 |
| **Parity-script smoke** | `tests/scripts/diff-playwright-reports.ts` self-identity smoke + regen via `regen-constants.mjs` if new tests land in baseline (per D-08) |
| **Estimated runtime** | New specs: ~30-60s combined (boolean walk ≈ ~30s incl. goBack; categorical walk ≈ ~30s incl. goBack). Full 3-run gate: ~111 min cold-start (per W-06 runtime budget). |

---

## Sampling Rate

- **After every task commit:** Run the single-spec command for the spec just edited (~30-60s feedback).
- **After every plan wave:** Run quick subset (`--grep "@voter"`) — voter-app project (read-only), ~3-5 min.
- **Before `/gsd-verify-work`:** Full 3-run cold-start `--workers=1` smoke must be green; parity-gate must PASS (3×).
- **Max feedback latency:** ~60s per single-spec run; ~5 min per voter-app subset.

---

## Per-Task Verification Map (REVISED per checker feedback)

| Task ID | Plan | Wave | Requirement | Threat Ref | Secure Behavior | Test Type | Automated Command | File Exists | Status |
|---------|------|------|-------------|------------|-----------------|-----------|-------------------|-------------|--------|
| 75-01-01 | 01 | 1 | QSPEC-01 | — | dev-seed e2e template includes `test-question-boolean-1` at sort 18 + `test-category-boolean` + Alpha `{ value: true }` cell (W-02 STRICT grep `grep -F`); `yarn build @openvaa/dev-seed` succeeds | unit (type-check + strict grep) | `grep -F "'test-question-boolean-1': { value: true }" packages/dev-seed/src/templates/e2e.ts && yarn workspace @openvaa/dev-seed tsc --noEmit` | ❌ W0 | ⬜ pending |
| 75-01-02 | 01 | 1 | QSPEC-01 | — | dev-seed rebuild + Supabase provision + Skip-Next fallback verification (W-05 programmatic psql probe — NO manual eyeball) | E2E subset + shell | `yarn workspace @openvaa/dev-seed build && yarn dev:reset-with-data && DB_URL=$(yarn supabase:status \| awk '/DB URL/{print $NF}') && psql "$DB_URL" -t -A -c "SELECT external_id FROM questions WHERE external_id = 'test-question-boolean-1';" && yarn workspace @openvaa/tests test:e2e --workers=1 --grep "matching algorithm"` | ❌ W0 | ⬜ pending |
| 75-01-03 | 01 | 1 | QSPEC-01 | — | `walkToQuestion(page, sortOrder)` helper exported alongside `walkToQuestionsIntro`; type-clean; lint-clean | lint | `grep -c "export async function walkToQuestion" tests/tests/utils/voterNavigation.ts && yarn lint:check` | ❌ W0 | ⬜ pending |
| 75-01-04 | 01 | 1 | QSPEC-01 | — | Boolean opinion question renders as 2-button radio (yes/no labels); voter answers; **B-02 step 3 `page.goBack()` browser-back persistence (checked-state still present)**; entity-detail mirror; W-01 `// reason:` for every `getByTestId('opinion-question-input')` scope-wrapper | E2E | `yarn workspace @openvaa/tests test:e2e --workers=1 -- tests/specs/voter/voter-question-rendering-boolean.spec.ts && grep -c "page.goBack" tests/tests/specs/voter/voter-question-rendering-boolean.spec.ts && grep -B1 "getByTestId('opinion-question-input')" tests/tests/specs/voter/voter-question-rendering-boolean.spec.ts \| grep -c "// reason:"` | ❌ W0 | ⬜ pending |
| 75-01-05 | 01 | 1 | QSPEC-01 | — | Plan 01 SUMMARY authored with dedup audit FINDINGS (feeds Plan 02a's unified artifact) + W-03 i18n-hardening deferred-todo filed at `2026-05-12-qspec-01-i18n-hardening.md` | document | `test -f .planning/phases/75-question-rendering-specs/75-01-SUMMARY.md && test -f .planning/todos/pending/2026-05-12-qspec-01-i18n-hardening.md` | ❌ W0 | ⬜ pending |
| 75-02a-00 | 02a | 2 | QSPEC-02 | — | **B-04 PRE-FLIGHT GATE:** verify cross-plan DB seed state (boolean + directional + Alpha answer cells) via 3 psql probes; exit 1 (abort plan) if any missing | shell + psql | `DB_URL=$(yarn supabase:status \| awk '/DB URL/{print $NF}') && psql "$DB_URL" -t -A -c "SELECT count(*) FROM questions WHERE external_id IN ('test-question-boolean-1','test-question-directional-1');"` (expected: 2) | ❌ W0 | ⬜ pending |
| 75-02a-01 | 02a | 2 | QSPEC-02 | — | Categorical (single-choice) opinion question renders as N-button choice list; voter selects middle option (Option B); **B-02 step 3 `page.goBack()` browser-back persistence (checked-state still present on 'b')**; W-04 NEGATIVE check `.last()` NOT used; W-01 `// reason:` for `getByTestId('opinion-question-input')`; entity-detail mirror with asymmetric voter≠Alpha answers | E2E | `yarn workspace @openvaa/tests test:e2e --workers=1 -- tests/specs/voter/voter-question-rendering-categorical.spec.ts && grep -c "page.goBack" tests/tests/specs/voter/voter-question-rendering-categorical.spec.ts && ! grep -E "getByTestId\\('opinion-question-input'\\)\\.last\\(\\)" tests/tests/specs/voter/voter-question-rendering-categorical.spec.ts` | ❌ W0 | ⬜ pending |
| 75-02a-02 | 02a | 2 | QSPEC-01, QSPEC-02 | — | **B-03 Nyquist-compliant PERSISTENT dedup audit artifact:** writes `.planning/phases/75-question-rendering-specs/75-02-DEDUP-AUDIT.md` with required structure (frontmatter, audit table ≥ 6 classified rows, `AUDIT COMPLETE` trailer); no in-memory-only findings | document + automated grep | `test -f .planning/phases/75-question-rendering-specs/75-02-DEDUP-AUDIT.md && grep -q "AUDIT COMPLETE" .planning/phases/75-question-rendering-specs/75-02-DEDUP-AUDIT.md` | ❌ W0 | ⬜ pending |
| 75-02b-01 | 02b | 3 | QSPEC-01, QSPEC-02 | — | Vite-cache wipe + 3-run cold-start `--workers=1` smoke (3×) produces identical pass/fail set; new specs land in PASS_LOCKED; DATA_RACE pool stays at 15 | E2E (full suite ×3) | `rm -rf apps/frontend/node_modules/.vite apps/frontend/.svelte-kit && yarn dev:reset-with-data && yarn test:e2e --workers=1` (×3) | ❌ W0 | ⬜ pending |
| 75-02b-02 | 02b | 3 | — | — | Parity-script self-identity smoke (`tests/scripts/diff-playwright-reports.ts`) + conditional regen (`regen-constants.mjs`) for the +N new PASS_LOCKED entries; PARITY GATE: PASS × 3 | shell | `node tests/scripts/diff-playwright-reports.ts` + `node .planning/phases/73-determinism-baseline/post-fix/regen-constants.mjs run-3.json` + `yarn tsx tests/scripts/diff-playwright-reports.ts run-1.json run-2.json` (×3) | ✅ | ⬜ pending |
| 75-02b-03 | 02b | 3 | — | — | `75-VERIFICATION.md` produced documenting 4/4 SCs PASS/PASS-WITH-DEFERRAL + 3-run SHA-identity + parity-gate output + IMGPROXY_TIED_TITLES safety check + reference to `75-02-DEDUP-AUDIT.md` per B-03 cross-plan flow + §"Cross-Plan Seed State Verification" per B-04 + multi-choice deferred-todo + W-03 i18n-hardening todo references | document | `test -f .planning/phases/75-question-rendering-specs/75-VERIFICATION.md && grep -c "PASS" .planning/phases/75-question-rendering-specs/75-VERIFICATION.md && grep -c "75-02-DEDUP-AUDIT" .planning/phases/75-question-rendering-specs/75-VERIFICATION.md` | ❌ W0 | ⬜ pending |
| 75-02b-04 | 02b | 3 | — | — | Operator checkpoint (CHECKPOINT:human-verify) — blocking gate; operator confirms record + dedup audit + deferral path before phase close | manual gate | (operator types "approved") | N/A | ⬜ pending |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky*

---

## Wave 0 Requirements

- [x] `tests/tests/specs/voter/voter-question-rendering-boolean.spec.ts` — NEW spec file (Plan 01 Task 04) — includes B-02 `page.goBack()` step 3
- [x] `tests/tests/specs/voter/voter-question-rendering-categorical.spec.ts` — NEW spec file (Plan 02a Task 01) — includes B-02 `page.goBack()` step 3 + W-04 negative `.last()` check
- [x] `packages/dev-seed/src/templates/e2e.ts` — extension: new boolean question at sort 18 + new category + Alpha answer cell (Plan 01 Task 01)
- [x] `tests/tests/utils/voterNavigation.ts walkToQuestion(page, sortOrder)` — extracted helper (Plan 01 Task 03)
- [x] `.planning/phases/75-question-rendering-specs/75-02-DEDUP-AUDIT.md` — **NEW (B-03):** Nyquist-compliant unified dedup audit artifact written by Plan 02a Task 02 with `AUDIT COMPLETE` trailer
- [x] `.planning/phases/75-question-rendering-specs/75-VERIFICATION.md` — Plan 02b Task 03 verification report
- [x] `.planning/todos/pending/2026-05-12-qspec-01-i18n-hardening.md` — W-03 deferred-todo filed by Plan 01 Task 05
- [x] `.planning/todos/pending/2026-05-12-qspec-02-multi-choice-categorical-variant.md` — D-03 multi-choice deferred-todo filed by Plan 02b Task 03

*Existing infrastructure (Playwright + dev-seed + voterNavigation utils + EntityDetailPage object + parity-script tooling) covers everything else.*

---

## Manual-Only Verifications (REVISED — fewer items per checker feedback)

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| Dedup audit assertion-by-assertion classification | QSPEC-01, QSPEC-02 (SC #3) | Requires human judgement: comparing the SEMANTIC contract of each assertion in the new specs against analog assertions in `voter-matching.spec.ts` + `packages/matching/`. Grep finds candidates; human judges whether overlap is real. **However, per B-03 the FINDINGS are written to a persistent artifact (`75-02-DEDUP-AUDIT.md`) with automated `test -f` + `grep -q "AUDIT COMPLETE"` gates — closing the Nyquist gap.** The classification work itself is still human judgement; the audit ARTIFACT is automatically verifiable. | (a) `grep -nE "BooleanQuestion\|isBooleanQuestion\|test-question-boolean" packages/matching/src/**/*.test.ts tests/tests/specs/voter/voter-matching.spec.ts`; (b) for each grep hit: read the QSPEC assertion + the analog assertion; (c) confirm: QSPEC asserts user-flow + render-shape (Playwright's strength); analog asserts matching-algorithm contract (unit-test's strength); (d) record outcome in `75-02-DEDUP-AUDIT.md` audit table with classification (DELEGATED / NEW / FALSE-POSITIVE) + rationale; (e) ensure `AUDIT COMPLETE` trailer is present. |
| 3-run SHA-identity verification | SC #4 (Determinism preserved) | Requires inspecting `playwright-report/data/*.json` for identical SHA fingerprints across 3 runs — automated but the SHA comparison + interpretation is a manual review step. | After `yarn test:e2e --workers=1` × 3 (Plan 02b Task 01): `sha256sum playwright-report-run1/data/test-results.json playwright-report-run2/data/test-results.json playwright-report-run3/data/test-results.json`; assert all three SHAs match; record in `75-VERIFICATION.md`. |

---

## Validation Sign-Off

- [x] All tasks have `<automated>` verify or Wave 0 dependencies
- [x] Sampling continuity: no 3 consecutive tasks without automated verify (Plan 02a Task 02 dedup audit artifact + Tasks 01/02b-01/02b-02 are automated — Wave 2/3 satisfy continuity)
- [x] Wave 0 covers all MISSING references (5 new files + 1 modified file + 2 new deferred-todos)
- [x] No watch-mode flags (Playwright `--workers=1` only; no `--watch`)
- [x] Feedback latency < 60s per single-spec run; < 5 min per voter-app subset; ~111 min for full 3-run gate (acceptable for end-of-phase verification only per W-06 runtime budget)
- [x] **`nyquist_compliant: true` set in frontmatter** (flipped from false post-revision per B-03 — dedup audit now writes persistent artifact with automated `test -f` + `grep -q "AUDIT COMPLETE"` gate at Plan 02a Task 02)
- [x] **B-01 plan split:** Plan 02 split into Plan 02a (Wave 2, autonomous=true, 3 tasks: pre-flight + spec + dedup audit) + Plan 02b (Wave 3, autonomous=false, 4 tasks: 3-run smoke + parity-gate + VERIFICATION.md + checkpoint) per CONTEXT D-01 fallback. Plan 01 stays at 5 tasks within ≤ 90 min budget per W-06.
- [x] **B-02 4-step contract revised:** both specs include explicit `page.goBack()` browser-back persistence assertion as step 3 (distinct reactive path from answer-store mirror)
- [x] **B-04 pre-flight gate:** Plan 02a Task 0 verifies cross-plan DB seed state before any spec runs
- [x] **W-01 testId reason annotations:** every `getByTestId('opinion-question-input')` scope-wrapper has inline `// reason:` (testIds.X.Y map references exempt)
- [x] **W-02 strict grep:** Plan 01 Task 1 uses `grep -F` exact-match (no `|| true` masking)
- [x] **W-04 negative `.last()` check:** Plan 02a Task 1 includes a `! grep -E ...\\.last\\(\\)` negative assertion
- [x] **W-05 programmatic seed verification:** psql + supabase:status JSON extraction (no "manual eyeball" alternative)
- [x] **W-06 runtime budget:** Plan 01 (~75 min total per-task) + Plan 02a (~50 min) + Plan 02b (~2-2.5 hr including 111 min 3-run smoke) — transparency emitted in plan objectives

**Approval:** pending (Plan 02b Task 04 operator checkpoint)
</content>
