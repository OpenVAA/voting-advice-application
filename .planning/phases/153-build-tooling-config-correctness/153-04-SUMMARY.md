---
phase: 153-build-tooling-config-correctness
plan: 04
subsystem: build-tooling
tags: [esm, vitest, config, portability, negative-control, REVIEW-CFG-03]
status: complete
requires: []
provides:
  - "`apps/frontend/vitest.config.ts` free of the CommonJS directory global"
  - "`153-NC-ROW-3-CFG-03.md` — Row-3 evidence fragment for `153-NEGATIVE-CONTROL.md` (assembled by 153-09)"
affects:
  - apps/frontend unit-test module resolution
tech-stack:
  added: []
  patterns:
    - "derive-your-own-directory: `fileURLToPath(new URL('.', import.meta.url))`, matching `apps/frontend/vite.config.ts:9`"
key-files:
  created:
    - .planning/phases/153-build-tooling-config-correctness/153-NC-ROW-3-CFG-03.md
    - .planning/todos/pending/2026-08-29-153-stale-line-citations-in-phase-docs.md
  modified:
    - apps/frontend/vitest.config.ts
    - .planning/REQUIREMENTS.md
decisions:
  - "Wrote the explanatory comment as ONE dense line, not the plan's 'two-line' instruction: the cited model (`vite.config.ts:8`) is one line, and `assert-comment-hygiene.mjs` Rule 2 fails a comment line that ends without terminal punctuation and continues on the next."
  - "Cited BOTH installed Vite copies in the evidence fragment (root 7.3.0 and the vitest-nested 7.3.1 that actually loads the config) rather than the plan's uninstalled 6.4.1."
  - "Declined the E2E suite on a traced proof of unreachability, not by reflex."
  - "Did NOT run `state.advance-plan` — the operator claims ownership of STATE.md, and advancing the counter from one of eleven parallel plans would corrupt it."
metrics:
  duration: ~25 min
  completed: 2026-08-29
actuals:
  tokens: 9500
  tasks: 2
  commits: 3
---

# Phase 153 Plan 04: vitest.config.ts ESM Directory Derivation Summary

Collapsed all 11 `__dirname` usages in `apps/frontend/vitest.config.ts` to one
`import.meta.url`-derived constant and proved every alias still resolves to a byte-identical path —
with a wrong-directory control showing the proof is capable of failing.

## What was done

**Task 1** (`dd5db8890`) — `apps/frontend/vitest.config.ts`:

- `import path from 'path'` → `'node:path'`; added `import { fileURLToPath } from 'node:url'`.
- Added `const here = fileURLToPath(new URL('.', import.meta.url));` with a one-line explanatory
  comment above it.
- Replaced the first argument of all 11 `path.resolve(...)` calls with `here`. No alias string, key
  or ordering changed — the diff is 16 insertions / 12 deletions and touches nothing else.

**Task 2** (`fdea92288`) — `153-NC-ROW-3-CFG-03.md`, the Row-3 evidence fragment.

## Verification

| Check | Baseline | Result |
|---|---|---|
| comment-filtered `__dirname` count in the config | — | **0** (1 unfiltered, in the comment, as in the sibling) |
| pre/post alias-value diff (11 pairs, via Vite's `loadConfigFromFile`) | — | **empty**, md5 `47e87c7a…` both sides |
| `npx vitest list --run` in `apps/frontend` | — | exit **0**, 822 lines, 0 "Failed to resolve" |
| frontend `test:unit` | 54 files / 816 tests | **54 / 816** — measured before AND after |
| `yarn build` | 14/14 | **14/14** |
| `yarn lint:check` | 22/22, 10 chain links, 0 violations | **22/22, 10 links, all guards 0** |
| `yarn test:unit` | 25/25 | **25/25** |
| `yarn format:check` | clean | **clean** |
| dev-seed | 593/52 | **593 tests / 52 files** |
| comment-hygiene | 1579 files / 0 | **1579 / 0** |
| `yarn db:lint:sql` | pre-existing RED | **not scored** — its failing half lints the live DB and reads no working-tree file |

### The negative control (both halves recorded)

Setting `here` to a nonexistent sibling directory:

- **Half A** — the alias-dump `diff` flips from empty to non-empty (exit 1), so the byte-identity
  check is a live comparison, not one examining nothing.
- **Half B** — `npx vitest list --run` exits **1** with `Failed to resolve import "$lib/i18n/wrapper"`,
  347 lines of resolution failures.
- **Restored** via `git checkout --` against the already-committed Task 1 state (safe, because the
  work was committed first). Scoped `git status` empty; `vitest list --run` back to exit 0.

## Deviations from Plan

**1. [Rule 1 - Correctness] Comment written as one line, not two**

The plan's action step said to write "a two-line `//` comment in the register of
`apps/frontend/vite.config.ts:8-9`". Following that literally would have tripped a live guard:
`scripts/assert-comment-hygiene.mjs` **Rule 2** (forced-line-break predicate, added by plan 152-15)
fails any comment line ending without terminal punctuation that continues on the next line at the
same post-marker indent. The cited model is itself a *one*-line comment at `:8` (`:9` is the code),
so the plan mis-described its own model. Wrote one dense line; guard stayed at 1579 files / 0
violations.

**2. [Rule 3 - Blocking] Alias-dump harness needed an absolute Vite import**

The scratch dump script lives outside the repo, so a bare `import { loadConfigFromFile } from 'vite'`
raised `ERR_MODULE_NOT_FOUND`. Resolved by importing the root copy by absolute `file://` URL.

## Falsified premises (measured, not assumed)

The one figure the operator flagged for re-measurement — **11 usages** — **held exactly**, as did
**54 files / 816 tests**. What did not hold was every *positional* citation:

| Claim | Status |
|---|---|
| usages at `:18,22,25,26,27,28,32,36,40,44,48` | **FALSE** — actual `16,20,23,24,25,26,30,34,38,42,46` |
| "56 lines" | **FALSE** — 54 |
| Vite **6.4.1** | **FALSE** — no 6.4.1 installed; root is **7.3.0**, vitest-nested is **7.3.1** |
| `config.js:35802,35819,35822,35862` | **TRUE against root 7.3.0**; the nested copy that actually loads the config has them at `:35804,35821,35824,35864` |
| `assert-i18n-catalog-namespaces.mjs:57` | **FALSE** — `:53` |
| `ciTypecheckGate.test.ts:38` | **FALSE** — `:22` |
| `vite.config.ts:8-9` is a two-line comment | **FALSE** — one-line comment + code |
| `apps/frontend/package.json:59` is `"type": "module"` | **TRUE** |
| `.planning/REQUIREMENTS.md:9-12` is the standing acceptance rule | **TRUE** |
| Vite defines `__dirname` in ESM mode too | **TRUE** — the `define` map at `:35818-35826` sits outside the `format: isESM ? …` branch at `:35813` |

Filed as `.planning/todos/pending/2026-08-29-153-stale-line-citations-in-phase-docs.md`, because
`153-PATTERNS.md:578-579` carries two of the stale citations and plans 05-11 are reading it now.

## E2E: not run — proof of unreachability

House rule 9 asks for a proof rather than a reflex decline. The diff touches `apps/frontend/`, so
the honest question is whether anything changed is reachable from a browser. It is not:

1. `git grep -P 'vitest\.config'` over tracked files shows **every** reference to
   `apps/frontend/vitest.config.ts` comes from unit-test files or comments about unit tests. No
   Playwright config, no `vite.config.ts`, no `svelte.config.js`, no `hooks.server.ts` refers to it.
2. `vitest.workspace.ts` is `['packages/**/vitest.config.ts']` — it does not even include
   `apps/frontend`.
3. The served application gets `$types`/`$voter`/`$candidate` from `apps/frontend/svelte.config.js:11-15`
   (`kit.alias`) and `$lib`/`$app/*`/`$env/*` from SvelteKit itself. The alias table in
   `vitest.config.ts` is a *parallel* table consulted only by the `vitest` CLI.
4. E2E drives a browser against `yarn dev` → `vite dev` → `vite.config.ts`. Vite loads its config by
   name; `vitest.config.ts` is never on that path.

The only other file changed is a `.planning/` markdown doc, which ships nothing. The 54-file / 816-test
unit suite is the gate that actually covers this diff, and it was run on both sides.

## Requirements

`REVIEW-CFG-03` marked complete — both surfaces written (`checkbox` + `traceability`),
`write_set_complete: true`. Genuinely met: the config resolves its paths without the CommonJS
global, and config loading is exercised to prove it.

## Known Stubs

None.

## Threat Flags

None. T-153-13 (a wrong derived constant silently redirecting `$lib`) is the threat this plan's
byte-identity diff and wrong-directory control exist to mitigate; both were executed. T-153-14
(framing a no-regression check as a catch) is mitigated by the evidence fragment stating the
absent-blindness reason explicitly and avoiding the word "caught" entirely.

## Operator attention required

- **`.planning/STATE.md` was not touched.** The operator owns it, and `state.advance-plan` from one
  of eleven parallel plans would corrupt the position. Plans 01, 02 and now 04 are complete; 03 and
  05-11 remain.
- `.planning/milestone.lock` shows dirty throughout (pid heartbeat) — expected, not committed.

## Self-Check: PASSED

All four claimed files exist on disk; both claimed commit hashes (`dd5db8890`, `fdea92288`) resolve
in `git log`. `ROADMAP.md` updated via `roadmap.update-plan-progress 153` (3 summaries, In Progress).
