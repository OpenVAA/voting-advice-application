# Phase 85 RCA-FINDINGS — Variant-Project Cascade Single-Source Verdict

**Investigated:** 2026-05-14
**Plan:** 85-01
**Verdict:** H0 confirmed (chain-head deterministic FAIL); H1 architecturally disproven; H2/H3 deferred (require chain-head fix to test).
**Confidence:** HIGH (empirical 3/3 deterministic FAIL across Phase 84 binding anchor run-{1,2,3}.json)

## Provenance + D-04 Divergence Note (WARNING 8)

CONTEXT.md D-04 originally stipulated: "research agent spawned by Plan 01's plan body." In practice, D-04 was satisfied UPSTREAM — the standard plan-phase workflow's research step produced `85-RESEARCH.md` before Plan 01 executed. Plan 01 therefore synthesizes the existing RESEARCH artifact into the canonical RCA artifact rather than spawning a fresh research-agent invocation. The substantive RCA scope, hypothesis catalog, and verdict are unchanged; only the agent-invocation timing shifted by one workflow step. This benign divergence is recorded here for transparency.

## Summary

The 47-entry CASCADE pool decomposes into:
- **3 SOURCE-SKIP entries** (PRODUCT-GAP `test.skip()` in `candidate-app-settings`): `SETTINGS-01 wave A — header.showFeedback`, `header.showHelp`, `notifications.voterApp`. Out of Phase 85 scope per RESEARCH §"Pitfall 1" (these are intentional skips, not cascades).
- **44 CASCADE-SKIP entries** (all variant chain + voter-app-popups dismissal-cascade companions + 4 voter-not-located-redirect + 2 voter-app-popups + 1 voter-navigation). All transitively rooted in a single deterministic upstream FAIL.

Root cause: `voter-app-popups :: voter-popups.spec.ts > should remember dismissal after page reload` fails deterministically 3-of-3 across the Phase 84 binding anchor (`04ddfdd85cf…`) with a Playwright strict-mode locator violation (`getByRole('dialog').getByRole('button', { name: /close|sulje|stäng|luk/i })` matches 2 elements). Per `tests/playwright.config.ts:236`, the variant chain head `data-setup-multi-election` declares `dependencies: ['candidate-app-password', 'voter-app-popups']`, so the popup test's deterministic FAIL cascades — via Playwright's strict project-dependency contract — through the 19-project variant linear chain (8 data-setup projects + 10 spec projects + 1 shared teardown), producing the 44 CASCADE-SKIP entries.

## Hypothesis Disposition

| ID | Hypothesis | Disposition | Evidence |
|----|------------|-------------|----------|
| H0 | Upstream chain-head deterministic failure (not in CONTEXT.md; surfaced by RESEARCH 2026-05-14) | CONFIRMED | `rca-capture/chain-head-failure.txt` — 3-of-3 deterministic FAIL on `voter-app-popups :: should remember dismissal after page reload` |
| H1 | yarn-arg-forwarding LANDMINE-9 propagation through nested project deps | ARCHITECTURALLY DISPROVEN | `rca-capture/h1-grep.txt` — all 8 variant setups bypass the dev-seed CLI; they import primitives via Node. Zero shell/process-boundary invocations exist. LANDMINE-9 requires shell chains; not applicable. |
| H2 | fixture-overlay-ordering races in the variant-data-setup chain | DEFERRED (untestable until chain-head fix) | All 8 variant setups skipped with empty error in the Phase 84 anchor — their bodies never executed. Overlay-ordering races require execution to manifest. Re-instrument H2 if variants surface deterministic failures post-Plan 02. |
| H3 | shared bootstrap state contamination | DEFERRED (untestable until chain-head fix) | Same reasoning as H2; the chain head never ran, so no per-variant state could leak. Re-instrument H3 if H2 also turns up empty post-Plan 02. |

## Evidence Index

- `rca-capture/chain-head-failure.txt` — empirical 3-run FAIL capture (Task 1)
- `rca-capture/h1-grep.txt` — H1 architectural disproof (Task 2)
- `rca-capture/cascade-classification.txt` — 47-entry source-skip vs cascade-skip partition (Task 3)
- `rca-capture/dependency-dag.md` — variant linear-chain DAG (Task 3)

## Scope Boundary (CONTEXT.md D-08 binding)

Per CONTEXT.md D-08: "DETERM-10 must NOT pre-resolve voter-FAILURE-CLASS items." The chain-head test `voter-app-popups :: should remember dismissal after page reload` is EXPLICITLY Phase 86 DETERM-12 scope (ROADMAP.md:232, REQUIREMENTS.md:61). Phase 85 cannot directly fix the popup test without violating D-08.

Phase 85's path-forward options (per RESEARCH §"Fix-Plan Template"):

### Path A — Coordinate-with-Phase-86
Wait for Phase 86 DETERM-12 to land the popup fix, then re-run Phase 85's 3-run gate to capture the cascade collapse. **Risk:** Phase 86 timeline; ROADMAP marks Phases 85 + 86 parallel-eligible but does not bind sequencing.

### Path B — Structural decoupling (RECOMMENDED)
Remove `voter-app-popups` from `data-setup-multi-election`'s `dependencies` at `playwright.config.ts:236`. Replace `['candidate-app-password', 'voter-app-popups']` with `['candidate-app-password']`. **Precedent:** Phase 84 made the identical structural maneuver on `re-auth-setup` (`tests/playwright.config.ts:148-152`, commit `93050e4fb`). 1-line config change; independent of Phase 86 timing; preserves D-08 by NOT touching the popup test itself.

### Path C — DONE-AS-NOOP
If Phase 86 DETERM-12 lands before Plan 02 begins, Phase 85 closes without code changes (Phase 79 P02F precedent). The post-Phase-86 anchor regen absorbs Phase 85's CASCADE shrinkage.

## Recommendation

**Path B** (structural decoupling). Justification:
1. **Independent of Phase 86 sequencing** — Plan 02 can proceed regardless of when DETERM-12 lands.
2. **Low-risk** — 1-line `playwright.config.ts` edit; identical precedent (Phase 84 re-auth-setup).
3. **Durable** — even if the popup test continues to flake, the variant chain is no longer affected.
4. **D-08-compliant** — does not touch the popup test itself; Phase 86 still owns DETERM-12.

Watch-out (per RESEARCH Pitfall 7): voter-popups' partial run may leave global app_settings residue (`results.showFeedbackPopup`, `results.showSurveyPopup`) that variant chains don't reset. Mitigation: verify each variant template's `app_settings.fixed[0].settings` block explicitly sets these popup flags to 0 (already present in `variant-multi-election.ts` and `variant-Ne-Nc.ts` per RESEARCH §"Pitfall 7"; if missing in other variants, Plan 02 adds them).

## Plan 02 Shape (per D-02)

Single fix plan covering all variant chains (CONTEXT.md D-02 "If ONE shared root cause: Plan 02 = single fix"):
- Task 1: Apply Path B 1-line decouple at `playwright.config.ts:236` + extend `// Phase 84 DETERM-08`-style comment block citing Phase 85 DETERM-11 rationale.
- Task 2: 1-run cold-start smoke (~54 min) via run_in_background — surface any post-decouple variant deterministic failures (route any to Phase 86 per D-08; do NOT pre-fix).
- Task 3: 3-run cold-start gate (~162 min) via run_in_background per Phase 79 D-13 canonical chain (D-07).
- Task 4: Atomic regen via Phase 79 archived `regen-constants.mjs` + update `diff-playwright-reports.ts` jsdoc + CASCADE_TESTS array (D-05 + Phase 79 D-10 atomic-commit pattern).
- Task 5: SUMMARY.

Plan 02 count = 1 (per CONTEXT.md D-02). Total Phase 85 plan count = 2 (Plan 01 RCA + Plan 02 fix).

## Open Questions for Operator / Planner

1. **Path B vs Path A vs Path C selection** — planner may override the Path B recommendation if Phase 86 is imminent.
2. **3 PRODUCT-GAP source-skips fate** — RESEARCH suggests migrating to a separate `SOURCE_SKIP_TESTS` partition in `diff-playwright-reports.ts` (hygiene). DEFERRED to Phase 87 milestone-close per RESEARCH §"Open Questions Q2".
3. **Post-decouple variant verdicts** — unknown until Plan 02 Task 2 1-run smoke captures them. Any new deterministic failures route to Phase 86 per D-08.

## Footnote — Architecture Correction (Rule-1 Deviation)

CONTEXT.md D-03 + 85-RESEARCH.md describe **9 variant setup files**. Empirically there are **8** `variant-*.setup.ts` files (see `rca-capture/h1-grep.txt`). The "9" count counted `variant-results-sections` as a setup, but per `tests/playwright.config.ts:249-254`, `variant-results-sections` is a **spec-only project** that re-uses the `data-setup-multi-election` seed (its `dependencies: ['variant-multi-election']` at line 254 lacks any own data-setup target). The substantive H1 architectural-disproof argument is unchanged across 8 vs. 9: zero of the variant setup files shell out to the dev-seed CLI; the CLI's `parseArgs` block is never reached; LANDMINE-9 yarn-arg-forwarding is architecturally inapplicable.

This RCA-FINDINGS commits the correct count (8) for future reference. Plan 02's playwright.config.ts edit footprint is also unchanged — a single line at 236.

---

*RCA executed: 2026-05-14*
*Author: Claude (gsd-execute-phase, Plan 85-01)*
