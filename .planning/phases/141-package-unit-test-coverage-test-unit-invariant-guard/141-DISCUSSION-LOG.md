# Phase 141 — Discussion Log

**Date:** 2026-08-18
**Mode:** default (interactive), 4 areas selected of 4 offered
**Human reference only** — downstream agents read `141-CONTEXT.md`, not this file.

## Pre-discussion scout

Ran before any question was asked, because two of this phase's requirements rest
on assumptions that turned out to be checkable. Both were checked.

| Assumption (from ROADMAP/REQUIREMENTS) | Measured at HEAD | Effect |
|---|---|---|
| Experimental packages may "require a live API key", hence UNIT-02's skip-contract branch | All 5 unwired packages green: 18 files / 140 tests / 0 failures, no network, no env reads, all keys `'test-api-key'` literals | Skip contracts unnecessary — wire all three |
| ASSERT-10 might need the 27 teardown files edited | All 27 declare uniformly as one-line `const PREFIX = '<literal>';` | Guard is read-only; 0 edits to those files |

Additional measured facts that shaped options: 22 of 27 prefixes appear in
multiple files as docblock prose (false-positive hazard); all 27 are currently
distinct AND mutually non-prefixing (clean baseline); CI invokes `yarn test:unit`
at `main.yaml:70`; root `lint:check` already composes with `&&`.

## Areas offered

1. ASSERT-10 guard strictness · 2. UNIT-04 guard home · 3. Experimental wiring
shape · 4. `--passWithNoTests` posture. **All four selected.**

## Questions and answers

### ASSERT-10 guard strictness
**Q:** Exact duplicates, prefix-containment, or containment + reserved-namespace shape check?
**A:** Prefix-containment (recommended). → D-03
*Rationale carried forward:* `bulk_delete` matches by prefix, so containment is the real hazard; equality only catches the proxy. Baseline already clean, so it lands green.

**Q:** Declaration-site regex, comment-strip-then-scan, or a shared registry?
**A:** Declaration-site regex (recommended). → D-04, D-06
*Rationale:* immune to the 22-file prose hazard by construction rather than by filtering; registry rejected as 27 unnecessary edits, deferred rather than dropped.

### UNIT-04 guard home
**Q:** Wrap root `test:unit`, separate CI step, or `playwright.config.ts` config-load?
**A:** Wrap root `test:unit` (recommended). → D-07
*Rationale:* fires on the exact command it protects, locally and in CI; a CI-only step is invisible to a developer until push.
*Claude's call, recorded as D-08:* guard is a plain no-build root `.mjs`, because it runs before turbo builds anything — a workspace-hosted guard would depend on the pipeline it gates.

### Experimental wiring shape
**Q:** Rename `test` → `test:unit`, add alongside, or alias?
**A:** Rename (recommended). → D-10
*Verified before offering:* nothing in CI or root scripts calls a bare `yarn workspace X test`, so the rename breaks nothing.

### `--passWithNoTests` posture
**Q:** Bare `vitest run`, match the `--passWithNoTests` majority, or bare + harmonise the other five?
**A:** Bare `vitest run` for the new five; existing five untouched. → D-12, D-13
*Rationale:* the flag would let a package whose tests are all deleted keep reporting green — the unfailable-check class this milestone exists to close. Harmonising the other five declined as out of scope, deferred.

## Todos

Six matched by `todo.match-phase 141`, all on generic `area: packages` keyword
overlap. None folded — one is already scoped to Phase 144, the rest are
unrelated domains. Recorded in CONTEXT.md § Deferred › Reviewed Todos with
per-item reasons.

## Scope guardrail

One scope-widening option was offered and declined (harmonise `--passWithNoTests`
repo-wide); one design alternative was rejected on scope grounds (shared prefix
registry). Both preserved in Deferred rather than dropped.
