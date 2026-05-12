---
phase: 78
slug: cleanup-hygiene-phase
status: draft
nyquist_compliant: false
wave_0_complete: false
created: 2026-05-12
---

# Phase 78 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | Playwright 1.58.x (E2E) + vitest (unit) |
| **Config file** | `tests/playwright.config.ts` + `apps/frontend/vite.config.ts` (unit) |
| **Quick run command** | `yarn workspace @openvaa/tests test:e2e --workers=1 --reporter=list --grep "<spec-title-substring>"` |
| **Full suite command** | `yarn db:reset-with-data --likert-only && yarn workspace @openvaa/tests test:e2e --workers=1` (post-CLEAN-01) OR `yarn dev:reset-with-data --likert-only && yarn workspace @openvaa/tests test:e2e --workers=1` (pre-CLEAN-01 fallback) |
| **Estimated runtime** | ~10-12 min full; ~30-90 sec per spec quick |

---

## Sampling Rate

- **After every task commit:** Run quick command scoped to the spec under modification.
- **After every plan wave:** Run full suite command (post-seed reset + vite-cache wipe).
- **Before `/gsd-verify-work`:** Full suite green; 3 consecutive `--workers=1` cold-start runs identical pass/fail set.
- **Max feedback latency:** ~120 seconds for quick run; ~12 minutes for full suite.

---

## Per-Task Verification Map

| Task ID | Plan | Wave | Requirement | Threat Ref | Secure Behavior | Test Type | Automated Command | File Exists | Status |
|---------|------|------|-------------|------------|-----------------|-----------|-------------------|-------------|--------|
| 78-01-01 | 01 | 1 | CLEAN-01 | — | Root `package.json` scripts renamed `dev:* → db:*`; old names kept as deprecated aliases with one-line `echo` warning | shell | `node -e "const p=require('./package.json'); ['db:start','db:reset','db:reset-with-data','db:clean'].forEach(s=>{if(!p.scripts[s]) throw new Error('Missing '+s)})"` | ❌ W0 | ⬜ pending |
| 78-01-02 | 01 | 1 | CLEAN-01 | — | `dev:clean` wipes `apps/frontend/.svelte-kit` + `apps/frontend/node_modules/.vite/`; `db:reset` + `db:reset-with-data` chain `dev:clean` after supabase reset | shell | `yarn db:clean && test ! -d apps/frontend/.svelte-kit && test ! -d apps/frontend/node_modules/.vite` | ❌ W0 | ⬜ pending |
| 78-01-03 | 01 | 1 | CLEAN-01 | — | CLAUDE.md "Supabase Commands" section updated | source assert | `grep -q "yarn db:reset" CLAUDE.md && grep -q "yarn db:reset-with-data" CLAUDE.md` | ❌ W0 | ⬜ pending |
| 78-02-01 | 02 | 2 | CLEAN-02 | — | Voter hitting located route without selectedElection redirects to /elections?next=...; selector completion resumes original URL | E2E | `yarn workspace @openvaa/tests test:e2e --workers=1 --grep "CLEAN-02"` | ❌ W0 | ⬜ pending |
| 78-02-02 | 02 | 2 | CLEAN-02 | — | URL-whitelist check rejects open-redirect attempts (next= must match voter-app pathname pattern) | E2E | `yarn workspace @openvaa/tests test:e2e --workers=1 --grep "CLEAN-02.*whitelist"` | ❌ W0 | ⬜ pending |
| 78-03-01 | 03 | 1 | CLEAN-03 | — | All 13 cast sites in `supabaseDataProvider.ts` carry per-cast `// reason:` blocks; cluster-level anchor removed | source assert | `grep -c "// reason:" apps/frontend/src/lib/api/adapters/supabase/dataProvider/supabaseDataProvider.ts` (must be >= 13) | ❌ W0 | ⬜ pending |
| 78-03-02 | 03 | 1 | CLEAN-03 | — | `getRoute.svelte.ts:41` setStore structural cast refactored (Option 2 inline-use default per CONTEXT D-09) | source assert | `! grep -q "as unknown as" apps/frontend/src/lib/contexts/app/getRoute.svelte.ts` | ❌ W0 | ⬜ pending |
| 78-03-03 | 03 | 1 | CLEAN-03 | — | CLAUDE.md has new sub-section documenting `// svelte-warning: accepted — <reason>` format | source assert | `grep -q "svelte-warning: accepted" CLAUDE.md` | ❌ W0 | ⬜ pending |
| 78-04-01 | 04 | 1 | CLEAN-04 | — | `t()` signature in `apps/frontend/src/lib/i18n/wrapper.ts` uses TranslationKey (not string); compile-time error on missing keys | type-check | `yarn workspace @openvaa/frontend check` exits 0 (baseline does NOT regress beyond v2.7-close 160 errors / 12 warnings) | ❌ W0 | ⬜ pending |
| 78-04-02 | 04 | 1 | CLEAN-04 | — | `t.get = t` alias deleted (zero consumers verified) | source assert | `! grep -q "t\\.get = t" apps/frontend/src/lib/i18n/wrapper.ts` | ❌ W0 | ⬜ pending |
| 78-04-03 | 04 | 1 | CLEAN-04 | — | `apps/frontend/src/lib/i18n/tests/translations.test.ts` has `@ts-expect-error` regression-locker on bogus key | source assert | `grep -q "@ts-expect-error" apps/frontend/src/lib/i18n/tests/translations.test.ts` | ❌ W0 | ⬜ pending |
| 78-05-01 | 05 | 2 | CLEAN-05 | — | `@openvaa/dev-seed` CLI accepts `--likert-only` flag; template filter restricts opinions to singleChoiceOrdinal while preserving info questions | E2E (template build) | `yarn build --filter=@openvaa/dev-seed && yarn dev:seed --template e2e --likert-only` | ❌ W0 | ⬜ pending |
| 78-05-02 | 05 | 2 | CLEAN-05 | — | 16 voter-app tests in post-73 DATA_RACE pool flip to PASS_LOCKED on cold-start `--workers=1` | E2E | `yarn dev:reset-with-data --likert-only && yarn workspace @openvaa/tests test:e2e --workers=1` (count DATA_RACE entries; must be 16 fewer than Phase 73 baseline) | ❌ W0 | ⬜ pending |
| 78-06-01 | 06 | 1 | CLEAN-05 | — | All 13 Phase 73 review findings (CR-02 + 7 WR + 5 IN) fixed in code OR accepted inline with `// reason:` block | source assert + lint | `yarn workspace @openvaa/tests lint:check` exits 0; per-finding spec smokes pass | ❌ W0 | ⬜ pending |
| 78-06-02 | 06 | 1 | CLEAN-05 | — | RESEARCH-folded CR-01 (multi-election.spec.ts:250 networkidle) fixed | source assert | `! grep -E "page.waitForLoadState\\('networkidle'\\)" tests/tests/specs/variants/multi-election.spec.ts` | ❌ W0 | ⬜ pending |
| 78-07-01 | 07 | 3 | CLEAN-01..05 | — | Vite-cache wipe + 3-run cold-start identical pass/fail set with CLEAN-05's 16 tests now PASS_LOCKED | shell | `yarn db:clean && for i in 1 2 3; do yarn db:reset-with-data --likert-only && yarn workspace @openvaa/tests test:e2e --workers=1 --reporter=json > /tmp/78-run-$i.json; done && diff <(jq '.suites' /tmp/78-run-1.json) <(jq '.suites' /tmp/78-run-2.json) && diff <(jq '.suites' /tmp/78-run-1.json) <(jq '.suites' /tmp/78-run-3.json)` | ❌ W0 | ⬜ pending |
| 78-07-02 | 07 | 3 | CLEAN-01..05 | — | Parity-script constants regen against post-CLEAN-05 baseline (PASS_LOCKED grows by 16 + Phase 76/77 new tests) IF candidate-profile race no longer cascades; OTHERWISE preserve Phase 75 baseline + document persistent cascade | shell | `node .planning/phases/73-determinism-baseline/post-fix/regen-constants.mjs` (conditional per Plan 07 architectural decision) | ❌ W0 | ⬜ pending |
| 78-07-03 | 07 | 3 | CLEAN-01..05 | — | 78-VERIFICATION.md authored with status frontmatter + 5-SC assessment; Phase 73 review findings cross-linked | artifact assert | `test -f .planning/phases/78-cleanup-hygiene-phase/78-VERIFICATION.md && grep -q "^status:" .planning/phases/78-cleanup-hygiene-phase/78-VERIFICATION.md` | ❌ W0 | ⬜ pending |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky*

---

## Wave 0 Requirements

- [ ] `package.json` script rename (Plan 01 — CLEAN-01)
- [ ] `tests/tests/specs/voter/voter-not-located-redirect.spec.ts` NEW (Plan 02 — CLEAN-02)
- [ ] `apps/frontend/src/routes/(voters)/(located)/+layout.ts` redirect logic (Plan 02; insertion point per RESEARCH §CLEAN-02)
- [ ] `apps/frontend/src/lib/api/adapters/supabase/dataProvider/supabaseDataProvider.ts` per-cast reason distribution (Plan 03)
- [ ] `apps/frontend/src/lib/contexts/app/getRoute.svelte.ts` setStore cast refactor (Plan 03)
- [ ] `CLAUDE.md` Svelte warning anchor sub-section (Plan 03)
- [ ] `apps/frontend/src/lib/i18n/wrapper.ts` TranslationKey signature + t.get delete (Plan 04)
- [ ] `apps/frontend/src/lib/i18n/tests/translations.test.ts` @ts-expect-error regression-locker (Plan 04)
- [ ] `@openvaa/dev-seed` CLI `--likert-only` flag (Plan 05)
- [ ] 13 Phase 73 review-finding fixes + 1 bonus CR-01 fold (Plan 06)
- [ ] `tests/scripts/diff-playwright-reports.ts` constants regen (Plan 07; conditional)

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| Plan 07 regen-vs-defer decision | CLEAN-05 | Operator confirms whether candidate-profile race cascade is resolved by Plan 06 (it should NOT be — race is OUT OF SCOPE per RESEARCH Q2) and routes regen accordingly | Plan 07 SUMMARY captures the decision; operator approves at verification gate |
| Auth-setup race (candidate-profile.spec.ts:85-145) deferral confirmation | (out-of-scope) | Phase 78 explicitly does NOT fix the cascading race per RESEARCH Q2; operator confirms routing to a future phase / milestone | Plan 07 VERIFICATION.md records the persistent cascade + routes to v2.10+ todo |
| Phase 77 P01 deferred-cell production fixes | (out-of-scope) | Non-reactive topBarSettings.push / popupQueue.push fixes route to v2.10+ per RESEARCH Q3 | Confirm at phase close — 78-VERIFICATION.md cross-references the Phase 77 P01 deferred-cells without folding |

---

## Validation Sign-Off

- [ ] All tasks have `<automated>` verify or Wave 0 dependencies
- [ ] Sampling continuity: no 3 consecutive tasks without automated verify
- [ ] Wave 0 covers all MISSING references
- [ ] No watch-mode flags
- [ ] Feedback latency < 120s (quick) / 12min (full)
- [ ] `nyquist_compliant: true` set in frontmatter

**Approval:** pending
