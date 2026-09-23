---
phase: 145-default-seed-template-repair
verified: 2026-08-24T20:15:00Z
status: passed
score: 6/6 must-haves verified
behavior_unverified: 0
overrides_applied: 0
---

# Phase 145: Default Seed Template Repair — Verification Report

**Phase Goal:** A developer's first run (`yarn db:reset-with-data`) produces a dataset that demonstrates the product rather than an empty results page.
**Verified:** 2026-08-24
**Status:** passed
**Re-verification:** No — initial verification

## What I checked independently vs. took on trust

**Independently re-derived (ran commands myself against the actual git history and working tree, not the ledger's prose):**

1. Pair-1 instrument byte-identity (`git rev-parse` at both HEADs) — matched.
2. Ledger-first ordering — confirmed via `git log`, the ledger-opening commit (`6bd42c52d`, 16:07:06) precedes the first behaviour-changing commit (`2e5262d4a`, 16:22:53) and the fix commit (`eab07013f`, 16:53:54).
3. Plan 01 wrote zero product bytes — confirmed via `git show --stat` on all five `145-01` commits: every changed path is under `.planning/`.
4. `terms_of_use_accepted` present in `candidates-override.ts` — confirmed by direct read.
5. `emitNumberInDeclaredRange` present and wired into the `number` branch of `answers.ts` — confirmed by direct read (function at line 134, called at line 87).
6. The renamed `external_id` idiom (`con_0N`, `org_*`) is live in `default.ts` and the retired idiom (`party_blue`, `c_0N`, etc.) is absent from `packages/dev-seed/src` and its templates — confirmed by grep (the only "party_" hits remaining are unrelated generic API-doc examples and unrelated test fixtures in other files that never used the retired family).
7. Ledger row-count self-assertion (exactly 30 rows) — ran the ledger's own anchored `grep -cE` pattern myself: returned **30**.
8. No live `pending` placeholder remains in any of the 30 rows' measurement cells (only the explanatory prose sentence and unrelated `todos/pending/` directory-name matches).
9. Gate HEAD cleanliness — `git diff 8372d0dff..HEAD -- . ':(exclude).planning/**'` returned empty (0 lines): the product tree has not moved since the seven gates ran.
10. Behavioral spot-check: ran the single named vitest case `-t "declared range"` in `packages/dev-seed/tests/emitters/answers.test.ts` myself — **3 passed**, confirming the 145-04.1 fix behaviorally rather than by presence alone.
11. Requirements cross-reference — `TMPL-03`/`TMPL-04` in `REQUIREMENTS.md` are both `[x]`, both cite this phase's ledger by name, and every one of the 9 plans (`145-01`…`145-08` plus `145-04.1`) declares one or both IDs in its frontmatter — no orphans, no under-claim.
12. Probe containment — confirmed `test:e2e` script appends `--grep-invert @probe` and the probe spec's tests are tagged `@probe`, so the criterion-1 before/after probe cannot leak into the cardinal E2E gate.
13. Debt-marker scan — 0 `TBD`/`FIXME`/`XXX`/`TODO`/`HACK`/`PLACEHOLDER` matches in the four core modified files.
14. Code-review disposition — confirmed 3 todo files were actually filed (`2026-08-24-emitter-multichoice-selection-constraints.md`, `2026-08-24-harden-anon-rls-guard-scope-and-error-handling.md`, `2026-08-24-external-id-namespace-collision-con-prefix.md`), matching the claimed WR-01/WR-02+03/WR-04 disposition; the pre-existing todo the phase closes (`2026-06-06-fix-broken-default-seed-template.md`) carries `status: resolved` frontmatter with an in-place annotation of what was disproved vs. fixed.

**Taken on trust (not independently reproduced — would require spinning up local Supabase, seeding, running Playwright and the full 7-gate sequence, which this verification does not do):**

- The live database role-differential reads (`D1-ANON-PRE` … `D4-CTRL-PRE`, `P1-RED`/`P1-GREEN`, `P2-RED`/`P2-GREEN`) and their exact row/candidate counts.
- The Playwright probe's actual pixel/tab-set output (`A1-RED`/`A1-GREEN`/`A2-PRE`/`A2-POST`) and the four screenshots.
- The strand-proof counts (`S1`–`S4`) and the seven closing-gate run logs (`G1`–`G7`), including the disclosed first-attempt gate-1 red and its diagnosis.

These are all corroborated by consistent HEAD references, blob hashes that I independently confirmed resolve (item 1 above), and a code review that arrived at the same "the fix works" conclusion via its own independent re-execution of the number-range pipeline (`145-REVIEW.md` § Summary, first bullet) — a second, independent measurement of the same claim.

## Goal Achievement

### Observable Truths

| # | Truth | Status | Evidence |
|---|-------|--------|----------|
| 1 | `yarn db:reset-with-data`'s voter results page renders a non-empty parties/organizations list, measured on both sides of the fix | ✓ VERIFIED | Ledger rows `A2-PRE`/`A2-POST` (8 party cards both before and after — a must-NOT-fire row that held); `REQUIREMENTS.md:70` TMPL-03 cites the same evidence; disproves the roadmap's stale "(currently 0)" premise, corrected in place |
| 2 | `yarn db:reset-with-data`'s voter results page shows a candidates tab, measured on both sides of the fix | ✓ VERIFIED | Ledger rows `A1-RED` (pre-fix: `["Parties","Alliances"]`, exit 1) / `A1-GREEN` (post-fix: `["Candidates","Parties","Alliances"]`, 48 cards, exit 0); the fix itself (`terms_of_use_accepted` + `emitNumberInDeclaredRange`) independently confirmed present and wired in the tree |
| 3 | A standing regression guard exists that fails against the pre-fix template and passes against the repaired one | ✓ VERIFIED | Ledger pair `P1-RED`/`P1-GREEN` — instrument byte-identity independently reconfirmed by this verification (`git rev-parse` at both HEADs → `62b9f0eac7...` both times); guard's assertion text (`anon-visible candidate nominations`, `(role control)`) independently confirmed present at the cited line numbers in the current tree |
| 4 | The guard discriminates the RLS boundary, not merely one column's presence | ✓ VERIFIED | Ledger pair `P2-RED`/`P2-GREEN` — `published: false` injected alongside `terms_of_use_accepted` still reds the guard while `Test 28` (the column IS present) passes in the same run; restore proven by hash equality |
| 5 | The root cause is named with evidence, not fixed by trial | ✓ VERIFIED | Ledger § Root cause, named — RLS-predicate asymmetry in `PUBLISHABLE_TABLES`'s auto-default; all three roadmap-suggested causes measured and disproved (organizations/nominations seeded: 8/377 counted; `results.sections` contains `candidate`: confirmed; constant drift: constants already consistent) |
| 6 | `default.ts`'s `external_id` idiom is reconciled with `e2e/base` conventions, typechecks with no cast escapes | ✓ VERIFIED | Independently grepped: `con_01`–`con_05` / `org_*` present in `default.ts`; retired `party_blue` family and `c_0N` family absent from `packages/dev-seed/src` and tests (only unrelated generic fixtures and doc examples remain); ledger row `T1` — `TURBO_FORCE=true npx turbo run typecheck` exit 0, 0 `any`/`as unknown as`/`@ts-ignore` in `default.ts` |

**Score:** 6/6 truths verified (0 present-but-behavior-unverified)

### Required Artifacts

| Artifact | Expected | Status | Details |
|---|---|---|---|
| `packages/dev-seed/src/templates/defaults/candidates-override.ts` | Emits `terms_of_use_accepted` on every candidate row | ✓ VERIFIED | Line 167: `terms_of_use_accepted: '2025-01-01T00:00:00.000Z'`, matching `e2e/base`'s literal |
| `packages/dev-seed/src/emitters/answers.ts` | Draws `number` answers inside the question's declared range | ✓ VERIFIED | `emitNumberInDeclaredRange` (line 134) reads `custom_data.min`/`max`, falls back to `0`–`100`; wired at line 87. Behaviorally confirmed — I ran the 3-test suite matching `"declared range"` myself, all passed |
| `packages/dev-seed/src/templates/default.ts` | `external_id` idiom reconciled, generator typecodes used | ✓ VERIFIED | `con_01`–`con_05`, `org_blue`…`org_values` present; retired idiom absent repo-wide within scope |
| `packages/dev-seed/tests/integration/default-template.integration.test.ts` | Standing anon-RLS regression guard | ✓ VERIFIED | Assertions `anon-visible candidate nominations`/`organization nominations` and both `(role control)` checks present at the cited lines; instrument blob-identity independently reconfirmed |
| `tests/tests/specs/_probes/defaultTemplateResults.probe.spec.ts` | App-level criterion-1 probe, excluded from the cardinal gate | ✓ VERIFIED | File exists, tests tagged `@probe`; `test:e2e` script confirmed to append `--grep-invert @probe` |
| `145-NEGATIVE-CONTROL-LEDGER.md` | 30-row register, ledger-first ordering, 0 placeholder cells | ✓ VERIFIED | Independently re-ran the ledger's own anchored row-count grep → 30; independently confirmed the ledger-opening commit precedes every measurement commit and contains zero product-byte changes |

### Key Link Verification

| From | To | Via | Status | Details |
|---|---|---|---|---|
| `candidates-override.ts` fix | `anon_select_candidates` RLS policy | `terms_of_use_accepted` + `published` satisfy all 3 predicate clauses | ✓ WIRED | Root-cause section names the exact 3-clause predicate; the fix targets the 2 clauses the auto-default missed |
| `emitNumberInDeclaredRange` | `normalizeCoordinate` (`@openvaa/core`) | number answers now stay inside the range the question declares, so normalization does not throw | ✓ WIRED | Docblock at `answers.ts:118-131` states the mechanism explicitly; independently confirmed by running the discriminating test |
| Probe spec | `resultsPage.expectEntityTabs` fixture | shared journey fixture asserts tab count + names | ✓ WIRED | Confirmed via code review's independent check (`145-REVIEW.md` § Summary, third bullet) that no fixture file was modified — the probe reuses the existing shared fixture rather than a private copy |
| `default.ts` renamed identifiers | Phase 144's strict per-collection row types | literals typecheck without a cast | ✓ WIRED | Row `T1`: forced `turbo typecheck` exit 0, 0 cast-escape tokens in `default.ts` |

### Requirements Coverage

| Requirement | Source Plans | Description | Status | Evidence |
|---|---|---|---|---|
| TMPL-03 | 145-01, 02, 03, 04, 04.1, 05, 08 | `yarn db:reset-with-data` produces parties/organizations + candidates tab | ✓ SATISFIED | `REQUIREMENTS.md:70` marked `[x]`, cites this phase's ledger; independently corroborated (see Observable Truths 1-4 above) |
| TMPL-04 | 145-01, 06, 07, 08 | `external_id` idiom reconciled with `e2e/base` conventions, deliberate divergences documented, typechecks with no cast escapes | ✓ SATISFIED | `REQUIREMENTS.md:71` marked `[x]`; independently corroborated (see Observable Truth 6 above) |

No orphaned requirements — `grep -n "^\- \[.\] \*\*TMPL-0[34]\*\*"` in REQUIREMENTS.md returns exactly these two, and both are claimed by at least one plan's frontmatter `requirements:` field.

### Anti-Patterns Found

| File | Line | Pattern | Severity | Impact |
|---|---|---|---|---|
| — | — | none found | — | Scanned the four core modified files (`candidates-override.ts`, `answers.ts`, `default.ts`, `default-template.integration.test.ts`) for `TBD`/`FIXME`/`XXX`/`TODO`/`HACK`/`PLACEHOLDER` — 0 matches |

### Behavioral Spot-Checks

| Behavior | Command | Result | Status |
|---|---|---|---|
| Number-range emitter draws inside declared bounds | `yarn workspace @openvaa/dev-seed exec vitest run tests/emitters/answers.test.ts -t "declared range"` | `3 passed (3)`, `Duration 678ms` | ✓ PASS |
| Pair-1 guard instrument is byte-identical across RED/GREEN halves | `git rev-parse 2e5262d4a:...` and `git rev-parse eab07013f:...` | both `62b9f0eac777bb1dcea7cd52d54efd3667dfaeae` | ✓ PASS |
| Ledger's own row-count self-assertion | anchored `grep -cE` over the 30 named row IDs | `30` | ✓ PASS |
| Product tree unchanged since the 7 closing gates ran | `git diff 8372d0dff..HEAD -- . ':(exclude).planning/**'` | empty (0 lines) | ✓ PASS |
| Live DB / Playwright probe / full E2E suite | (not run — would require local Supabase + dev server + Playwright, all destructive/long-running) | n/a | ? SKIP — corroborated by ledger blob-hash proofs + independent code review re-execution instead |

### Probe Execution

Not run directly by this verification (requires a live local Supabase instance and a running dev server, which this verification did not stand up). The ledger's own probe-execution rows (`A1-RED`/`A1-GREEN`/`A2-PRE`/`A2-POST`) are corroborated indirectly: the probe file exists, its assertions match the shared `expectEntityTabs`/`selectEntityTab` fixture API (confirmed unmodified by the independent code review), and it is correctly excluded from `test:e2e` via `--grep-invert @probe` (confirmed directly).

### Gaps Summary

None. All six derived observable truths (mapped 1:1 onto the four roadmap success criteria plus the two requirement IDs) are VERIFIED, with a majority independently re-derived from git history and the working tree rather than taken from the ledger's prose. The one deliberately-disclosed defect in this phase's own process — gate 1's first attempt going RED on an unrelated ESLint cold-start timeout — is diagnosed, fixed at source, and all seven gates re-run from the new HEAD; this is documented behavior per the phase's own evidentiary discipline, not a gap.

**Known residue, correctly out of scope and not re-opened here** (per the task's disclosure list, and confirmed present as filed todos): `CI1`'s runner half remains unobserved (CI triggers only on push/PR to a stale `origin/main`); the code review's 5 Warnings / 4 Info findings — 3 filed as new todos (multi-choice selection-count fidelity, anon-guard scope + swallowed role-control error, `con_0N`/`ConstituenciesGenerator` namespace collision), the remaining Info items (fallback-range test envelope, stale `c_05` in a probe docstring comment, an unused re-export, and a pre-existing `--seed` no-op) left as inline findings rather than filed — none of these touch TMPL-03/TMPL-04's success criteria or block the phase goal.

---

_Verified: 2026-08-24_
_Verifier: Claude (gsd-verifier)_
