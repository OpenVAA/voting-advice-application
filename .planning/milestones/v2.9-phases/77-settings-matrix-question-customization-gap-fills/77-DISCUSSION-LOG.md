# Phase 77: Settings Matrix + Question-Customization Gap-Fills - Discussion Log

**Mode:** `--auto` (single-pass; all gray areas auto-selected; recommended option chosen per question)
**Date:** 2026-05-12

## Auto-selected gray areas

All gray areas auto-selected per `--auto` mode. Areas:

1. **Plan grouping + sequence** — D-01
2. **Variant fixture strategy** — D-02 / D-03 / D-04
3. **`appSettings` toggle inventory + coverage map** — D-05
4. **Filter-type matrix dependency map** — D-06
5. **Voter-side allowOpen UI surface** — D-07
6. **Visibility + required scope** — D-08
7. **Determinism contract + parity-gate regen** — D-09 / D-10
8. **Locator + lint convention** — D-11
9. **Vite-cache wipe + end-of-phase gate** — D-12
10. **Plan order + dependency direction** — D-13

## Auto-selected decisions per question

### Plan grouping + sequence
- **Q:** "How many plans? ROADMAP estimate: ~3-5; SETTINGS-01 2-3 plans, SETTINGS-02 + SETTINGS-03 1 each."
- **Selected:** "5 plans (P01 SETTINGS-01 wave A toggle matrix / P02 SETTINGS-01 wave B filter-type matrix / P03 SETTINGS-02 allowOpen / P04 SETTINGS-03 visibility+required / P05 verification gate)" (recommended default per ROADMAP estimate + the natural toggle-matrix vs. filter-type-matrix split)

### Variant fixture strategy
- **Q:** "New variant for SETTINGS-02 / SETTINGS-03?"
- **Selected:** "YES — `variant-allowopen.ts` (Plan 03) + `variant-hidden-required.ts` (Plan 04); SETTINGS-01 toggles applied via `SupabaseAdminClient.updateAppSettings()` at test time, no new variant" (recommended default — variant for differential assertion + Plan 01 reuses existing CAND-* overlay pattern)

### Toggle inventory + coverage
- **Q:** "Per scout §1 ~28 uncovered toggles. In-scope or scope-limited?"
- **Selected:** "All functional toggles in-scope (~12-15 cells); `headerStyle.*` color/sizing OUT-OF-SCOPE per SC #1 literal 'TOGGLES' interpretation" (recommended default — clear scope boundary; styling is visual-regression territory)

### Filter-type matrix
- **Q:** "Need new fixture question for NumberFilter?"
- **Selected:** "YES — add `test-question-number-1` at sort 19 to e2e template (mirrors Phase 74 P05 + Phase 75 P01 single-row-addition pattern)" (recommended default — minimal extension; Alpha gets a number answer cell)

- **Q:** "Fold `2026-04-27-extend-e2e-filter-type-coverage.md`?"
- **Selected:** "YES — FOLDED into Plan 02 (ROADMAP line 224 explicitly directs)" (recommended default — explicit ROADMAP folding)

### `customData.allowOpen` voter surface
- **Q:** "Differential assertion (both true + false in same fixture) vs. ON-only?"
- **Selected:** "Differential — variant fixture carries BOTH `allowOpen: true` AND `allowOpen: false` questions" (recommended default — catches gating logic, not just component existence)

### Visibility + required scope
- **Q:** "Voter-side OR candidate-side OR both?"
- **Selected:** "BOTH — voter-side hidden + candidate-side required (default surfaces per scout §5); voter-side required asserted if surface exists at PLAN.md audit" (recommended default — CLAUDE.md mentions voter-context `requiredInfoQuestions` accessor; SC literal mandates 'required-but-unanswered blocks navigation' on the surface that gates it)

- **Q:** "Split into 2 specs (voter + candidate) or bundle?"
- **Selected:** "Split for clarity (`voter-visibility-required.spec.ts` + `candidate-required-info.spec.ts`)" (recommended default — different role contexts; different navigation paths)

### Determinism contract
- **Q:** "How to handle parity-gate regen?"
- **Selected:** "Conditional regen — if Plans 03 + 04 add new variant projects OR pass/fail set changes" (recommended default — same shape as Phase 74 D-10 / Phase 75 D-08 / Phase 76 D-10)

### Locator + lint convention
- **Q:** "Role/aria or testIds?"
- **Selected:** "Role/aria default; existing `candidate-settings.spec.ts` raw selectors (`figure[role="presentation"]`) are pre-Phase-73 — captured in IN-03 / Phase 78 CLEAN-05; new assertions follow new convention" (recommended default — Phase 74 D-11 / Phase 75 D-06 / Phase 76 D-11a inheritance)

### Vite-cache wipe + end-of-phase gate
- **Q:** "Imperative `rm -rf` or wait for CLEAN-01 `dev:clean`?"
- **Selected:** "Imperative recipe — Phase 78 not yet landed" (recommended default — same disposition as Phase 74 D-12 / Phase 75 D-09 / Phase 76 D-11)

### Plan order
- **Q:** "Serial or parallel?"
- **Selected:** "Mostly-parallel — Plans 01/02/03/04 independent surfaces; P05 verification gate depends on all 4" (recommended default — different spec hosts + different fixture changes minimize merge conflict)

## Deferred ideas captured

- `headerStyle.*` color/sizing toggles (visual-regression workstream)
- `FilterGroup` OR-mode UI assertion if surface doesn't exist (PASS-WITH-DEFERRAL precedent)
- Multi-key entity-details toggles (multi-effect cells default)
- Multi-locale toggle coverage (locale-orthogonal)
- Settings overlay live-reload coverage (architecture concern)
- `appCustomization` runtime override matrix
- Voter-side required-info coverage if surface doesn't exist
- `58-E2E-AUDIT.md`-style addendum for new fixture extensions

## Folded todos

- `2026-04-27-extend-e2e-filter-type-coverage.md` — FOLDED into Plan 02 per explicit ROADMAP folding (line 224). Source todo resolves at Plan 02 close.

## Reviewed-but-not-folded todos

23 keyword-matched todos surfaced by `gsd-sdk query todo.match-phase 77`; 1 folded (above); 22 route to other phases per `.planning/STATE.md §"Deferred Items"`. See `<deferred>` section of `77-CONTEXT.md` for the full audit.

---

*Phase: 77-Settings Matrix + Question-Customization Gap-Fills*
*Mode: --auto*
*Discussion log generated: 2026-05-12*
