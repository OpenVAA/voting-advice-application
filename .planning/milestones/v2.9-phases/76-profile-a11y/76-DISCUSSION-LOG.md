# Phase 76: Profile + A11y - Discussion Log

**Mode:** `--auto` (single-pass; all gray areas auto-selected; recommended option chosen per question)
**Date:** 2026-05-12

## Auto-selected gray areas

All gray areas auto-selected per `--auto` mode. Areas:

1. **Plan grouping + sequence** — D-01
2. **Existing-coverage baseline (do NOT re-assert)** — D-02
3. **Validation surface — what the rejection paths actually assert** — D-03
4. **Axe smoke wiring + env-flag gating** — D-04
5. **Profile fixture extension for A11Y-02** — D-05 / D-06
6. **Axe smoke routes + assertion shape** — D-07 / D-08
7. **Determinism contract + parity-gate regen** — D-09 / D-10
8. **Locator + lint convention** — D-11a
9. **Vite-cache wipe + end-of-phase gate** — D-11
10. **Plan order + dependency direction** — D-12

## Auto-selected decisions per question

### Plan grouping + sequence
- **Q:** "How many plans? Estimate per ROADMAP: ~3-4. Split or bundle A11Y-03 wire+baseline?"
- **Selected:** "4 plans (P01 A11Y-01 / P02 A11Y-02 / P03 axe wire / P04 baseline+verification gate)" (recommended default per ROADMAP line 217 + Phase 74 P07 / Phase 75 P02b precedent)

### Validation surface
- **Q:** "Which validation cells to cover?"
- **Selected:** "All 5 cells: email format + name length too short + name length too long + image type + image size" (recommended default per ROADMAP SC #1 literal text + scout §2 confirmation of validation implementation)

### Existing-coverage handling
- **Q:** "A11Y-01 new file vs. extend `candidate-profile.spec.ts`?"
- **Selected:** "New scope-marked file `candidate-profile-validation.spec.ts`" (recommended default per Phase 75 D-04 precedent)

### Axe smoke wiring
- **Q:** "Default-on or opt-in?"
- **Selected:** "Opt-in behind `PLAYWRIGHT_A11Y=1`" (recommended default — mirrors PLAYWRIGHT_VISUAL / PLAYWRIGHT_PERF precedent; avoids ~30-60s CI cost for a baseline-only deliverable)

- **Q:** "Add `@axe-core/playwright` to root or `tests/` package.json?"
- **Selected:** "`tests/package.json` devDependencies" (recommended default — keeps a11y harness isolated to the E2E workspace)

### Profile fixture extension
- **Q:** "Extend e2e template seed for A11Y-02 fields (name/bio/social links)?"
- **Selected:** "Conditional extension at PLAN.md time — D-06 fixture audit decides per field (EXISTS / MISSING / PRODUCT-GAP)" (recommended default — single-template extension per Phase 74 P05 + Phase 75 P01; PASS-WITH-DEFERRAL on PRODUCT-GAP fields per Phase 74 D-04 + Phase 75 D-03 precedent)

### Axe smoke routes
- **Q:** "Which 5 routes?"
- **Selected:** "Home + selector(s) + questions + results + voter-detail drawer" (recommended default — literal ROADMAP SC #3 list)

- **Q:** "How many locales?"
- **Selected:** "1 locale (en) for first-run baseline" (recommended default — reduces baseline volume by 4×; multi-locale deferred to cite-and-fix downstream)

### Determinism contract
- **Q:** "Axe smoke enters parity baseline?"
- **Selected:** "NO — axe project is opt-in, out of default 3-run gate; separate one-shot determinism check at Plan 04" (recommended default — preserves Phase 73 baseline; axe deterministic-baseline is a separate contract)

### Locator + lint convention
- **Q:** "Role/aria or testIds?"
- **Selected:** "Role/aria default; reuse existing `testIds.candidate.profile.*` registry; NO new test-id additions expected" (recommended default — Phase 74 D-11 / Phase 75 D-06 inheritance + scout §1 confirms existing registry is sufficient)

### Vite-cache wipe + end-of-phase gate
- **Q:** "Use imperative `rm -rf` recipe OR wait for Phase 78 / CLEAN-01 `dev:clean`?"
- **Selected:** "Imperative recipe directly — Phase 78 has not landed" (recommended default — same disposition as Phase 74 D-12 + Phase 75 D-09)

### Plan order
- **Q:** "Serial or parallel?"
- **Selected:** "Mostly-serial 01 → 02 → 03 → 04; planner may parallelize 01 with 03 if seed surface is unchanged" (recommended default — avoids merge conflict in `candidate-profile.spec.ts` + seed; mirrors Phase 75 D-10)

## Deferred ideas captured

- Cite-and-fix WCAG violations (filed as follow-up todo at Plan 04 close)
- Multi-locale axe coverage
- Real-time axe in CI gating
- Profile field expansion beyond name/bio/social links
- JSON-serialized axe results
- A11Y-01 PRODUCT-GAP fields (if fixture audit at D-06 surfaces)
- Visual-regression-style baseline drift detection for axe
- Accessibility tree introspection beyond axe rules

## Folded todos

None. Phase 76's scope is bounded by REQUIREMENTS A11Y-01/02/03.

## Reviewed-but-not-folded todos

23 keyword-matched todos surfaced by `gsd-sdk query todo.match-phase 76`; all route to other phases per `.planning/STATE.md §"Deferred Items"`. See `<deferred>` section of `76-CONTEXT.md` for the full audit.

---

*Phase: 76-Profile + A11y*
*Mode: --auto*
*Discussion log generated: 2026-05-12*
