---
quick_id: 260522-mps
slug: generate-e2e-test-catalog-inventory-for-
description: Generate e2e test catalog inventory for Phase 88 audit
date: 2026-05-22
mode: quick
status: complete
commit: 7f11a2c25
---

# Quick Task 260522-mps — SUMMARY

## Output

`tests/TEST-INVENTORY.md` (3212 lines; markdown; committed at `7f11a2c25`).

## Counts (sanity check)

- **Live tests inventoried (`### ` headers, includes 4 SKIP-FALLBACK strikethroughs):** **173**.
- **Spec/file sections (`## ` headers):** **57** (38 spec files spread across project sections + 13 setup/teardown blocks + 2 fixtures + 4 sanity-appendix subheadings).
- **Top-level sections (`# ` headers):** **42** (0–37 numbered projects + Fixtures + Sanity-check appendix headings).

Source baseline reconciliation:
- `grep -rE "^\s*test\(" tests/tests/specs/**/*.spec.ts` → 142 literal `test()` invocations. Playwright actually runs **~170** after parameterized-loop expansion (candidate-settings: 10 wave-A cells from 1 `for`-loop; candidate-profile-validation: 6 cells from 3 `for`-loops + 1 standalone; a11y-smoke: 6 routes from 2 `for`-loops). My inventory's 173 includes the 4 SKIP-FALLBACK strikethroughs (which Playwright tags as `skipped`), matching the actual runtime test count.
- 11 source `setup()` declarations + 2 `teardown()` declarations = 13 setup/teardown `###` entries — confirmed.

## Specs covered

- **38** spec files under `tests/tests/specs/` (matches `find tests/tests/specs -name "*.spec.ts" | wc -l`). The Phase 88 plan body says 37; the extra one is the opt-in `candidate-bank-auth.spec.ts` (lives in `specs/candidate/` but only runs under `bank-auth` env-gated project — counted as the 38th in my numbering).
- **Default-suite specs:** 33 (10 candidate-*, 16 voter-* — including voter-allowopen + voter-browse-without-match assigned to variant projects + voter-not-located-redirect to its own project + voter-visibility-required to variant-hidden-required-voter, 7 variants/* (counting candidate-required-info which lives in specs/candidate/ but runs under variant-hidden-required-candidate)).
- **Opt-in specs:** 4 (visual-regression, performance-budget, a11y-smoke, candidate-bank-auth).

## Anomalies encountered

1. **Plan said "37 specs", `find` reports 38.** The 38th is `candidate-bank-auth.spec.ts` — opt-in, env-gated. Inventory lists it under §37.

2. **Specs claimed by both `voter-app` (testIgnore-permitted) and a variant project (testMatch).** `voter-allowopen.spec.ts` and `voter-browse-without-match.spec.ts` would match `voter-app`'s remaining filter (since they're NOT in the testIgnore regex) AND match their dedicated variants. Per the operator's "spec exactly once" intent, the inventory assigns each to the variant project that owns the seed contract (§28 + §21 respectively); both are omitted from §9. Documented inline at §9 header.

3. **Two setup-projects share the same setup file** (`data-setup-multi-election` + `data-setup-results-sections` both testMatch `variant-multi-election.setup.ts`). The setup body is inventoried at §12.1; §14.1 cross-references rather than duplicating. Documented inline at §14.1.

4. **Source-order tie-break** on the project graph (Playwright's topo-sort uses config-array source order for siblings sharing a predecessor). The execution-order block at the top of the file lays out the resolved order explicitly so the operator can audit my ordering decision.

5. **Sub-projects with shared spec testDir** — 5 candidate-* projects partition `tests/specs/candidate/` via different testMatch regex slices, and 3 voter-* projects partition `tests/specs/voter/`. Each project gets its own top-level `# N.` section; each spec file appears under exactly one of them per testMatch.

6. **4 SKIP-FALLBACK tests** (§7.1.12 SETTINGS-01 notifications.voterApp PASS-WITH-DEFERRAL, §9.7.1 voter-feedback-persistence DETERM-13, §9.11.1 voter-question-rendering-boolean QSPEC-01, §9.12.1 voter-question-rendering-categorical QSPEC-02). Each is listed with `~~N.M.K~~` strikethrough, rationale preserved, body emitted for v2.11+ pickup. Bank-auth's 3 conditional `test.skip(precondition, …)` markers are NOT SKIP-FALLBACKs (they're env-gate dispatches based on probe state) so they are NOT struck through; the 3 corresponding tests are inventoried normally.

## Commit

Inventory file committed at `7f11a2c25` on branch `feat-gsd-roadmap` (hook bypassed via `git -c core.hooksPath=/dev/null commit` per the project-trusted memory `project_gsd_repo_hook_workaround.md`).

Path: `/Users/kallejarvenpaa/Desktop/OpenVAA/voting-advice-application-gsd/tests/TEST-INVENTORY.md`
