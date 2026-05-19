---
phase: 74
slug: high-leverage-e2e-coverage
status: draft
nyquist_compliant: false
wave_0_complete: false
created: 2026-05-11
---

# Phase 74 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.
> Source: `74-RESEARCH.md §"Validation Architecture"` + `74-CONTEXT.md D-09/D-10/D-12`.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | Playwright 1.58.2 + Vitest (frontend unit) |
| **Config file** | `tests/playwright.config.ts` + `tests/eslint.config.mjs` |
| **Quick run command** | `yarn workspace @openvaa/frontend test:unit && cd tests && yarn lint:check` |
| **Per-spec run command** | `yarn test:e2e --workers=1 --grep "<spec-name>"` (against running `yarn dev`) |
| **Full suite command** | `yarn dev:reset-with-data && yarn test:e2e --workers=1` (cold-start; matches Phase 73 SC #4 gate shape) |
| **Estimated runtime** | ~37 min per cold-start full run (per Phase 73 anchor: 3 × ~37 min) |
| **Parity verification** | `yarn tsx tests/scripts/diff-playwright-reports.ts <run-1> <run-2>` (must output `PARITY GATE: PASS`) |
| **Vite-cache wipe (mandatory pre-3-run)** | `rm -rf apps/frontend/node_modules/.vite apps/frontend/.svelte-kit` (per CONTEXT D-12) |

---

## Sampling Rate

- **After every task commit:** Run `yarn lint:check` (root) + `yarn workspace @openvaa/frontend test:unit` (if any frontend code touched) + targeted spec smoke (`yarn test:e2e --workers=1 --grep "<changed-spec>"`).
- **After every plan completion:** Run the spec(s) authored in the plan via `--workers=1` × 3 to assert per-plan determinism BEFORE the phase-wide gate.
- **Before phase verification (Plan 07):** Full `--workers=1` cold-start × 3 with vite-cache wipe; SHA-256 hash sorted test-status sets and assert byte-identity across all 3 runs (matches Phase 73 verification protocol).
- **Max feedback latency:** Per-spec smoke < 2 min; per-plan 3-run < 6 min; phase-wide 3-run cold-start ~111 min (3 × 37 min).

---

## Per-Task Verification Map

> Plan IDs are placeholders until the planner generates PLAN.md files. Each task carries a `<verify>` block in PLAN.md per `agent-contracts.md`. This table is updated as plans land.

| Plan | Wave | Requirement | Threat Ref | Secure Behavior | Test Type | Automated Command | File Exists | Status |
|------|------|-------------|------------|-----------------|-----------|-------------------|-------------|--------|
| 01 | 1 | E2E-01 | — | Multilocale candidate sees "Translations" button on questions where `localizationDisabled !== true`; can author translations; reload preserves | Playwright E2E | `yarn test:e2e --workers=1 --grep "candidate-translation"` | ⬜ W0 (spec to author) | ⬜ pending |
| 02 | 1 | E2E-02 | — | Voter under `minimumAnswers` (variant overlay: `matching.minimumAnswers: 1`) navigates to results; no match-score visible; entity cards still render | Playwright E2E | `yarn test:e2e --workers=1 --grep "voter-browse-without-match"` | ⬜ W0 (variant template + setup + spec) | ⬜ pending |
| 03 | 1 | E2E-03 | — | Feedback dialog: open → type → dismiss → reopen preserves text; type → send → reopen empty | Playwright E2E | `yarn test:e2e --workers=1 --grep "voter-feedback-persistence"` | ⬜ W0 (spec to author) | ⬜ pending |
| 03 | 1 | E2E-06 | — | Voter answers N≥`minimumAnswers` → results-CTA visible; delete one → CTA hidden; re-answer → re-visible; browser-back does not corrupt answer state | Playwright E2E | `yarn test:e2e --workers=1 --grep "voter-navigation"` | ⬜ W0 (spec to author) | ⬜ pending |
| 04 | 1 | E2E-04 (5 cells) | — | All 5 cells assert per-cell URL state + selector visibility + cross-bleed-free constituency dropdown | Playwright E2E | `yarn test:e2e --workers=1 --grep "(variant-1e-Nc\|variant-Ne-Nc\|variant-multi-election\|variant-startfromcg\|voter-journey)"` | ⬜ W0 (2 new variants + 2 new specs + assertion additions to 3 existing specs) | ⬜ pending |
| 05 | 1 | E2E-05 (4 cases) | — | All 4 voter-vs-entity answer-state cases render both rows on voter-detail with appropriate visual state | Playwright E2E | `yarn test:e2e --workers=1 --grep "voter-detail.*cases"` | ⬜ W0 (extend `packages/dev-seed/src/templates/e2e.ts` + voter-detail spec extension) | ⬜ pending |
| 05 | 1 | E2E-07 | — | Per-category SubMatch breakdown renders on voter-detail; both Manhattan and directional metric paths exercised | Playwright E2E | `yarn test:e2e --workers=1 --grep "voter-detail.*submatch"` | ⬜ W0 (voter-detail spec extension) | ⬜ pending |
| 06 | 1 | E2E-08 | — | Voter visits `/en/...` → translated content; switches via direct `/fi/...` URL + via LanguageSelection widget → translated content; switches back to en | Playwright E2E | `yarn test:e2e --workers=1 --grep "voter-locale-switching"` | ⬜ W0 (spec to author) | ⬜ pending |
| 07 | 2 | (SC #9 determinism gate) | — | 3 cold-start `--workers=1` runs produce IDENTICAL pass/fail sets (SHA-256 byte-identity); parity-script `PARITY GATE: PASS` × 3 pair comparisons; new variant projects contribute to regenerated PASS_LOCKED constants per CONTEXT D-10 | Cold-start smoke + parity-script | `rm -rf apps/frontend/node_modules/.vite apps/frontend/.svelte-kit && yarn dev:reset-with-data && for i in 1 2 3; do yarn test:e2e --workers=1; done && yarn tsx tests/scripts/diff-playwright-reports.ts` | ⬜ W0 | ⬜ pending |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky*

---

## Wave 0 Requirements

Files that MUST exist (or be created) BEFORE per-task verification can run. The planner is responsible for distributing Wave 0 creation across Plan 01..06; Plan 07 verification depends on all upstream Waves landing GREEN.

### New variant templates (CONTEXT D-02/D-03)
- [ ] `tests/tests/setup/templates/variant-low-minimum-answers.ts` — base `BUILT_IN_TEMPLATES.e2e` + `mergeSettings(E2E_BASE_APP_SETTINGS, { matching: { minimumAnswers: 1 } })` overlay (Plan 02)
- [ ] `tests/tests/setup/templates/variant-1e-Nc.ts` — 1 election × 3 constituencies (Plan 04)
- [ ] `tests/tests/setup/templates/variant-Ne-Nc.ts` — 2 elections × 3 constituencies (Plan 04)

### New variant setup files
- [ ] `tests/tests/setup/variant-low-minimum-answers.setup.ts` (Plan 02)
- [ ] `tests/tests/setup/variant-1e-Nc.setup.ts` (Plan 04)
- [ ] `tests/tests/setup/variant-Ne-Nc.setup.ts` (Plan 04)

### Playwright project additions (`tests/playwright.config.ts`)
- [ ] `data-setup-low-minimum-answers` + `variant-low-minimum-answers` project entries (Plan 02)
- [ ] `data-setup-1e-Nc` + `variant-1e-Nc` project entries (Plan 04)
- [ ] `data-setup-Ne-Nc` + `variant-Ne-Nc` project entries (Plan 04)

### New spec files (per CONTEXT D-13)
- [ ] `tests/tests/specs/candidate/candidate-translation.spec.ts` (Plan 01, E2E-01)
- [ ] `tests/tests/specs/voter/voter-browse-without-match.spec.ts` (Plan 02, E2E-02)
- [ ] `tests/tests/specs/voter/voter-feedback-persistence.spec.ts` (Plan 03, E2E-03)
- [ ] `tests/tests/specs/voter/voter-navigation.spec.ts` (Plan 03, E2E-06)
- [ ] `tests/tests/specs/variants/1e-Nc.spec.ts` (Plan 04, E2E-04 cell 2)
- [ ] `tests/tests/specs/variants/Ne-Nc.spec.ts` (Plan 04, E2E-04 cell 4)
- [ ] `tests/tests/specs/voter/voter-locale-switching.spec.ts` (Plan 06, E2E-08)

### Spec extensions (or new files at planner discretion)
- [ ] Extension of `tests/tests/specs/voter/voter-detail.spec.ts` for E2E-05 + E2E-07 — OR new files `voter-detail-cases.spec.ts` + `voter-detail-submatch.spec.ts` (Plan 05)
- [ ] Additive assertions in `tests/tests/specs/variants/multi-election.spec.ts` for E2E-04 cell 3 (Ne×1c) (Plan 04 — additive only; do NOT modify CONF-01..CONF-06 invariants)
- [ ] Additive assertions in `tests/tests/specs/variants/startfromcg.spec.ts` for E2E-04 cell 5 (Plan 04 — additive only)

### Dev-seed extension (CONTEXT D-07)
- [ ] `packages/dev-seed/src/templates/e2e.ts` voter dataset extended to include 4-case answer mix for E2E-05 (Plan 05). Re-runs `yarn build` for `@openvaa/dev-seed` before specs can consume.
- [ ] Optional: `58-E2E-AUDIT.md` addendum documenting the 4 case markers (CONTEXT D-07 / "Claude's Discretion").

### Helper utilities (planner's call per CONTEXT "Claude's Discretion")
- [ ] OPTIONAL: `tests/tests/utils/selectorMatrix.ts` — shared helper for E2E-04's 5-cell parameterized assertion (Plan 04). Planner may instead use per-spec assertion blocks.

*Existing infrastructure (Playwright config skeleton, eslint config, `expect.poll` pattern, semantic locators, parity-script tooling, voter.fixture, page objects) is in place from Phase 73 close + prior phases — only the deltas listed above are Wave 0.*

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| E2E-01 single-locale absence-of-feature contract | E2E-01 SC #1 (partial) | `staticSettings.supportedLocales` is hardcoded in `packages/app-shared/src/settings/staticSettings.ts:46-64` — no runtime override mechanism exists. Per CONTEXT D-04, this assertion is **DEFERRED** to a follow-up todo (add runtime override). | Phase 74 PASS-WITH-DEFERRAL on SC #1: assert multilocale path only. Defer single-locale check to `.planning/todos/pending/2026-05-11-e2e-01-single-locale-runtime-override.md` (to be created at phase close). |
| Locale-switcher widget presence on voter-app | E2E-08 SC #8 (partial) | Widget at `apps/frontend/src/lib/dynamic-components/navigation/languages/LanguageSelection.svelte` exists but is gated `locales.length > 1`. Spec asserts widget IF present; route-prefixed form is the unconditional contract. | E2E-08 spec asserts route-prefixed form unconditionally; widget assertion is unconditional (default 4-locale config guarantees `supportedLocales.length > 1` per `staticSettings.ts:46-64` → `LanguageSelection` widget IS rendered). Spec asserts widget presence + clicks an option to switch locale, per Plan 06 action step 7. Documented in spec comment + 74-VERIFICATION.md "Dependency direction" field. |
| Order B vs Order A for E2E-08 / CLEAN-04 pairing | E2E-08 SC #8 (dependency direction) | Order B chosen per CONTEXT D-06 (Phase 74 before Phase 78 CLEAN-04). After CLEAN-04 lands, this spec re-validates against the tightened wrapper. The re-validation is Phase 78's responsibility — Phase 74's E2E-08 only asserts the contract against the current wrapper. | Documented in `74-VERIFICATION.md` at phase close: "Order B taken. CLEAN-04 will re-validate E2E-08 against the tightened i18n wrapper in Phase 78." |

---

## Validation Sign-Off

- [ ] All tasks have `<automated>` verify or Wave 0 dependencies (each E2E-0X plan has Playwright spec as the `<automated>` verify; per-plan 3-run smoke is the wave gate)
- [ ] Sampling continuity: no 3 consecutive tasks without automated verify (per-plan smoke after each plan completes; phase-wide 3-run gate in Plan 07)
- [ ] Wave 0 covers all MISSING references (7 new spec files + 3 new variant templates + 3 new variant setups + 3 new Playwright project entries + 1 dev-seed E2E template extension — all listed above)
- [ ] No watch-mode flags (`--workers=1` is the canonical determinism flag; no `--watch` used)
- [ ] Feedback latency < 6 min per-plan smoke; < 111 min phase-wide 3-run cold-start
- [ ] `nyquist_compliant: true` set in frontmatter — to flip at Plan 07 close
- [ ] **CRITICAL — IMGPROXY_TIED_TITLES collision check.** Per CONTEXT D-10 + RESEARCH Pitfall 1, new spec test-block names MUST NOT end with any of the 14 bound title patterns at `tests/scripts/diff-playwright-reports.ts` (or `.planning/phases/73-determinism-baseline/post-fix/regen-constants.mjs:55-70`). Manual check at each plan's PR/verify.
- [ ] **CRITICAL — Parity gate post-regen.** Plan 07 invokes `tests/scripts/diff-playwright-reports.ts` AFTER regenerating constants (Plans 02 + 04 added 3 new variant projects → regen REQUIRED per CONTEXT D-10). Output `PARITY GATE: PASS` × 3 pair comparisons (1v2, 2v3, 1v3) is the closure gate.

**Approval:** pending (will flip to `approved 2026-05-XX` at Plan 07 close)
