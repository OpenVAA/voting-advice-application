# Phase 168 — Proposed requirement IDs

The roadmap entry says "Requirements: TBD — registered at planning". The planner does not edit
`.planning/REQUIREMENTS.md` (other planners run concurrently in this worktree); the orchestrator registers
these IDs, adds a "Docs Site" section and eight Traceability rows, and updates the rollup.

The prefix `DOCS-` is unused in `.planning/REQUIREMENTS.md`. The IDs are the ones `168-RESEARCH.md`
§ Phase Requirements proposed, adopted without change. Each one is subject to the file's *Standing
acceptance rule*: the check that guards it must be observed failing on an injected fault before it counts.

| ID | Description | Success criterion / decisions | Plans |
|----|-------------|-------------------------------|-------|
| DOCS-01 | Every VESTIGES page is rewritten, merged or deleted; the Developers' Guide follows the D-02 tree; the four Strapi nav titles are gone from `navigation.config.ts`; `generate-navigation-config.ts` leaves no `// New` / `// Removed` marker and no diff | SC1 · D-02, D-03 | 168-02, 168-03, 168-04, 168-05, 168-06, 168-07, 168-08 |
| DOCS-02 | Every hand-written page plus the generated set has a row in `168-DOCS-AUDIT.md` with a verdict (current / updated / merged → X / deleted / redirect stub); every `<ResearchQuote>` span is byte-identical to the phase base and `ResearchQuote.svelte` (with `ReferenceList.svelte`, `Author.svelte`) is unchanged, proven by a script observed red on a one-character injection | SC2 · D-05, D-07, D-08, D-20 | 168-01, 168-02, 168-07, 168-08 |
| DOCS-03 | VESTIGES sweeps #1, #2, #5–#7, #9, #10 and the three D-21 patterns return no hit under `apps/docs` other than ledger-recorded exceptions | SC3 · D-21 | 168-03, 168-04, 168-05, 168-06, 168-07, 168-08 |
| DOCS-04 | Every factual claim on a changed page has a content-anchored claim-ledger row that a script re-verifies; one independent `gsd-doc-verifier` pass covers every changed page and its findings are reconciled against the ledgers; every `yarn …` command on a page matches a script; the safe ones were run once with redacted evidence | SC4 · D-09, D-11, D-17 | 168-01, 168-03, 168-04, 168-05, 168-06, 168-07, 168-08 |
| DOCS-05 | The candidate-app pages describe the post-166 grant-only flows; `register-page-registrationkey-method.md` is closed as superseded, `configurable-mock-data.md` closed as satisfied by `@openvaa/dev-seed`, `password-reset-code-method.md` settled by reading the code and left open while the dead branch exists | SC5 · D-16, D-18 | 168-06, 168-08 |
| DOCS-06 | The broken docs scripts are repaired or deleted per D-13; `glob` is declared in `apps/docs`; `move-generated.ts` clears its destinations so the orphan `EntityCardAction` page is gone after regeneration; `typedoc`, `typedoc-plugin-markdown` (and the orphaned `@playwright/test`) are removed with the audit-baseline rows reconciled; `2026-08-28-broken-docs-script-references.md` is closed | SC6 · D-13, D-14 | 168-01.1, 168-07, 168-08 |
| DOCS-07 | `validate-links.ts --check` covers markdown links, `.svelte` hrefs, navigation leaf routes, `#anchor` targets, redirect stubs, GitHub source paths and in-repo inbound references, each class observed red on an injected fault and `--check` observed to write nothing; every moved or deleted URL has a stub; every in-repo inbound reference resolves to a final page | SC7 (link check) · D-04, D-10, D-12 | 168-01, 168-02, 168-08 |
| DOCS-08 | `apps/docs` has a `lint` script that root `lint:check` runs; the ESLint config loads (crash cause recorded CONFIRMED / UNCONFIRMED) and lints `.svelte` with the Svelte parser; docs lint is green and observed red on an injected `simple-import-sort` + `no-explicit-any` violation; docs `check`, `build`, `lint:full`, root `lint:check` and `format:check` are green | SC7 (build/lint/check) · D-15, D-22 | 168-01.1, 168-08 |
