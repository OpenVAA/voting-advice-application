---
phase: 89
slug: continuing-test-refactoring-implement-the-new-candidate-jour
status: draft
nyquist_compliant: false
wave_0_complete: false
created: 2026-05-29
---

# Phase 89 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.
> Source for per-plan validation requirements: `89-RESEARCH.md` § "Validation Architecture".

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | vitest 1.x (unit), Playwright 1.x (e2e), pgTAP (supabase) |
| **Config file** | `apps/frontend/vitest.config.ts`, `tests/playwright.config.ts`, `apps/supabase/supabase/config.toml` |
| **Quick run command** | `yarn test:unit --filter @openvaa/dev-seed` (per-plan scope; see per-task map) |
| **Full suite command** | `yarn test:e2e` (after Phase 89 lands; requires `yarn dev` running) |
| **Estimated runtime** | unit ~30s; e2e candidate-mega ~3-5 min; full e2e ~25-35 min |

---

## Sampling Rate

- **After every task commit:** Run the task's `<automated>` verify (typically `yarn lint`, `yarn build --filter=<scope>`, `yarn test:unit --filter <scope>`, or a focused Playwright project)
- **After every plan wave:** Run the wave's verification list (per-plan PLAN.md `verification:` block)
- **Before `/gsd:verify-work`:** Full e2e suite green AND `yarn test:unit` green AND `yarn lint:check && yarn format:check`
- **Max feedback latency:** ≤60s for unit/lint; ≤6 min for candidate-mega Playwright run

---

## Per-Task Verification Map

This table is templated. The gsd-planner will overwrite per-task rows with the actual `<task id>`s once PLAN.md files are written. The columns/Threat-Ref convention are locked here.

| Task ID | Plan | Wave | Requirement | Threat Ref | Secure Behavior | Test Type | Automated Command | File Exists | Status |
|---------|------|------|-------------|------------|-----------------|-----------|-------------------|-------------|--------|
| 89-01-WAVE0 | 01 | 0 | TIR4:17-32, 82-100 | T-89-01 / RLS preservation | new baseV1 rows seed without RLS errors; no extra auth.users insert for unregistered candidate | unit + smoke | `yarn workspace @openvaa/dev-seed build && yarn workspace @openvaa/dev-seed test` | ❌ W0 | ⬜ pending |
| 89-01-XX | 01 | 1 | TIR4:18-32 | — | — | unit | `yarn workspace @openvaa/dev-seed test` | ❌ W0 | ⬜ pending |
| 89-01-XX | 01 | 1 | TIR4:25-32, 99 | — | — | e2e | `yarn workspace tests playwright test --project voter-mega-journey` | ❌ W0 | ⬜ pending |
| 89-02-XX | 02 | 1 | TIR4:58-80 | — | — | type-check + import smoke | `yarn workspace tests tsc --noEmit && yarn workspace tests playwright test --list --project candidate-mega-journey` | ❌ W0 | ⬜ pending |
| 89-03-XX | 03 | 2 | TIR4:101-257 | T-89-03 / chain sequencing | candidate-mega chain runs serially after voter-mega; no externalIdPrefix collision | e2e | `yarn workspace tests playwright test --project candidate-mega-journey` | ❌ W0 | ⬜ pending |
| 89-04-XX | 04 | 2 | TIR4:34-54 | T-89-04 / template isolation | each perm template uses distinct externalIdPrefix; parallel-safe with baseV1 chain | e2e | `yarn workspace tests playwright test --project perm-disable-voter-app --project perm-disable-candidate-app --project perm-per-app-notifications` | ❌ W0 | ⬜ pending |
| 89-LAST-XX | LAST | 3 | TIR4:1-12, D-89-04 | — | no orphan testIgnore entries; surviving specs all green | e2e | `yarn workspace tests playwright test` (full) | ❌ W0 | ⬜ pending |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky*

---

## Wave 0 Requirements

Per `89-RESEARCH.md` § "Risk Register":

- [ ] **R3 probe — chain sequencing**: confirm `tests/playwright.config.ts` declares `candidate-mega-journey` project with `dependencies: ['voter-mega-journey']` (or equivalent serialization) so the shared `'test-'` externalIdPrefix doesn't race between voter-mega and candidate-mega chains.
- [ ] **R7 probe — hero round-trip**: confirm `cardContents` resolver round-trips the new `HeroContent` discriminated union (`{ type: 'emoji', value }` and `{ type: 'image', src }`) end-to-end (seed → DB → frontend → testid surface). Pre-flight unit test in `packages/dev-seed/tests/templates/`.
- [ ] **R8 probe — `candidates.email` column**: confirm against `packages/supabase-types/src/database.ts`. If column absent, store unregistered candidate email in a sibling test-constant file (per RESEARCH.md Open Question #4).
- [ ] **Existing infra deltas**: no new framework install — vitest, Playwright, pgTAP already wired.

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| Portrait upload visual sanity (formats accepted/rejected match TIR4:179-180) | TIR4:179-180 | Visual confirmation of error-toast copy on first encounter | After 89-03 lands, run candidate-mega once in `--headed` mode and visually confirm error states render |
| Per-app notification popup visual sanity | TIR4:48-54 | Visual confirmation of popup styling on first encounter | After 89-04 lands, run perm-per-app-notifications once in `--headed` mode |

*All other phase behaviors have automated verification.*

---

## Validation Sign-Off

- [ ] All tasks have `<automated>` verify or Wave 0 dependencies
- [ ] Sampling continuity: no 3 consecutive tasks without automated verify
- [ ] Wave 0 covers all MISSING references (R3, R7, R8)
- [ ] No watch-mode flags
- [ ] Feedback latency < 6 min (candidate-mega Playwright is the longest single sample)
- [ ] `nyquist_compliant: true` set in frontmatter

**Approval:** pending
