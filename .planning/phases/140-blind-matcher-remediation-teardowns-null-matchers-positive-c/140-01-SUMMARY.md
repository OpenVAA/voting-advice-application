---
phase: 140-blind-matcher-remediation-teardowns-null-matchers-positive-controls
plan: 01
subsystem: frontend-auth-tests
tags: [assertions, negative-control, oidc, jar, vitest, evidence]
status: complete

requires:
  - 139-VERDICTS.md §§ 5.7, 5.8, 5.9 (recorded injections, blind outcomes, pre-specified repairs)
  - 137-NEGATIVE-CONTROL.md / 138-NEGATIVE-CONTROL.md (evidence-document skeleton)
provides:
  - 140-NEGATIVE-CONTROL.md (phase evidence document; §§ 1-5 + 6, 7/8 for the F19 lane)
  - The five-stage evidence pipeline plans 02-06 reuse (repair → inject → two-run control → revert → hygiene post-gate → doc section)
  - Discharge of Phase 142's F19 obligation under ASSERT-07 (one diff serves both)
affects:
  - Phase 142 (must NOT re-apply the idura.ts injections for F19)
  - Plans 140-02..06 (append to the same evidence document)

tech-stack:
  added: []
  patterns:
    - "expect(value, 'explanatory message').toEqual(expect.stringMatching(/^…$/)) — anchored-shape assertion with a failure-naming message"

key-files:
  created:
    - .planning/phases/140-blind-matcher-remediation-teardowns-null-matchers-positive-c/140-NEGATIVE-CONTROL.md
  modified:
    - apps/frontend/src/lib/api/utils/auth/__tests__/authorize-endpoint.test.ts
    - apps/frontend/src/lib/api/utils/auth/providers/idura.test.ts
    - apps/frontend/src/lib/api/utils/auth/__tests__/token-endpoint.test.ts
    - .planning/WINDOWS.md

decisions:
  - "Replaced the plan's pre-specified `toMatch(re)` with `toEqual(expect.stringMatching(re))` after measuring that vitest's `toMatch` throws a raw TypeError on `null` and drops the custom message — the exact input the repair exists to catch. Identical discrimination across 7 probed inputs; strictly better diagnostics."
  - "Ran the two-run control against each site's OWN file even where sites 1 and 2 share one injection target, so every recorded file:line is attributable to a single vehicle."
  - "Used the entry-deletion injection at site 3, not the `undefined as unknown as string` variant (rejected design R-6) which stringifies to the four-character string \"undefined\" and would model a malformed value rather than a missing one."
  - "Filed the three sibling Rigidity-contract drift files to .planning/WINDOWS.md rather than absorbing them — ASSERT-06's scope is voter-journey.spec.ts only."

metrics:
  duration: ~15min
  completed: 2026-08-15

actuals:
  tokens: 8600
  tasks: 3
  commits: 3
---

# Phase 140 Plan 01: F19 Null-Blind Matcher Remediation (TRACER) Summary

Repaired three `toBeDefined()` assertions that were structurally incapable of failing — `URLSearchParams.get()` / `FormData.get()` return `string | null`, never `undefined` — and established the five-stage evidence pipeline (repair → transient injection → observed two-run control → revert → three-check hygiene gate → evidence-document section) that plans 02-06 reuse.

## What Was Built

**Three assertion repairs**, each replacing a blind `toBeDefined()` with an anchored three-segment shape assertion carrying an explanatory, failure-naming message, and each removing the now-subsumed `.split('.')` / `toHaveLength(3)` pair together with its non-null assertion:

| Site | File:line | Message | Removed |
|---|---|---|---|
| 1 | `authorize-endpoint.test.ts:144` | `authorize URL is missing the 'request' (JAR) parameter` | `requestParam!.split('.')` + `toHaveLength(3)` |
| 2 | `providers/idura.test.ts:148` | same | `requestParam!.split('.')` + `toHaveLength(3)` |
| 3 | `token-endpoint.test.ts:167` | `token request body is missing 'client_assertion'` | trailing `!` on `.get('client_assertion')!`, `assertion.split('.')` + `toHaveLength(3)` |

**`140-NEGATIVE-CONTROL.md`** (802 lines) — the phase evidence document, with §§ 1-5 (why the run existed, environment, the injections rebuildable on any machine, RUN 1 blindness, RUN 2 the catch, the load-bearing side-by-side table, per-site records for all three sites) and §§ 6, 7/8 (what the pair does and does not prove, the verdict-to-criteria map, the Phase-142 ownership seam, the out-of-scope `toBeDefined()` enumeration, the honest-gaps section, reproducibility and non-contamination).

## The Observed Two-Run Control

Every outcome below traces to a captured log under `${TMPDIR}/gsd-140/`. Both halves were run at all three sites under a byte-identical injection.

| Site | Injection | RUN 1 assertion | RUN 1 failing line | RUN 2 assertion | RUN 2 failing line |
|---|---|---|---|---|---|
| 1 | `idura.ts:74` | **PASS** (blind) | `authorize-endpoint.test.ts:147:33` | **FAIL** (caught) | `authorize-endpoint.test.ts:144:84` |
| 2 | `idura.ts:74` (shared) | **PASS** (blind) | `idura.test.ts:151:35` | **FAIL** (caught) | `idura.test.ts:148:86` |
| 3 | `idura.ts:101-102` (entry deleted) | **PASS** (blind) | `token-endpoint.test.ts:170:29` | **FAIL** (caught) | `token-endpoint.test.ts:167:75` |

RUN 1 failure text at every site: `TypeError: Cannot read properties of null (reading 'split')`. RUN 2 failure text names the missing parameter. The file outcome was FAIL in **both** halves at every site — which is exactly why the TWO-COLUMN RULE exists; the discrimination lives in the assertion column and the moving failing line.

Clean-tree runs with the repairs in place and no injection: **9/9, 13/13, 10/10**.

## Verification

| Gate | Result |
|---|---|
| `npx vitest run` over all three repaired files | exit 0 |
| `yarn test:unit` | exit 0 — 21/21 turbo tasks; frontend 773 tests / 54 files |
| `yarn lint:check` (incl. `typecheck:tests`) | exit 0 — 0 errors, 2 pre-existing warnings |
| `yarn workspace @openvaa/frontend typecheck` | 2683 files, **0 errors, 0 warnings** |
| `git status --porcelain -- apps tests packages` | empty after every injection |
| `grep -rn 'INJECTED (140)' apps packages tests` | no match after every injection |

No `yarn dev`, no `yarn test:e2e`, no Playwright command was run at any point (C-5 / research Pitfall 7). No injection reached a commit, a branch or a running process.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] The pre-specified matcher `toMatch(re)` failed the plan's own must-have truth**

- **Found during:** Task 1, RUN 2
- **Issue:** `must_haves.truths[0]` requires the sites to fail "with the failure message naming the missing parameter". Applied literally, `expect(requestParam, 'msg').toMatch(/^…$/)` on `null` produced `TypeError: .toMatch() expects to receive a string, but got object` — vitest type-guards the received value and throws **before** the `expect(value, message)` message is attached. The message survived only in the printed code frame, not in the assertion error. On `null` — the exact regression F19 names — the pre-specified form failed at the right line with the wrong message.
- **Fix:** Measured seven inputs against two matcher forms with the same regex (throwaway probe file, run once, deleted; log at `${TMPDIR}/gsd-140/f19-matcher-probe.log`). `toEqual(expect.stringMatching(re))` is **identical in discrimination** — same accept/reject set across `null`, `''`, `'undefined'`, two-segment, four-segment, synthetic three-segment and a real RS256-signed JAR — and surfaces the custom message on `null`. It is also already house style in the frontend suite (`supabaseDataWriter.test.ts:283,298` use anchored `expect.stringMatching(/^…$/)`), so no new idiom was introduced. Applied at all three sites.
- **Why this is not a weakening:** the standing prohibition forbids weakening any assertion. The substitution changes nothing about what the assertion accepts or rejects; it only changes whether the explanatory message reaches the reader. The full measurement table is recorded in `140-NEGATIVE-CONTROL.md` § 5.6 alongside the discarded implementation, per the "discarded rather than hidden" discipline.
- **Files modified:** all three test files
- **Commits:** `749b41e69` (site 1), `8e3487ad7` (sites 2 and 3)

### Plan-cite corrections (recorded, not silently applied)

Two counts in the plan text did not match the tree. In both cases the **measured** number was used, per D-01's principle that a number must be derived from a measurement rather than a quotation:

1. **Surviving `toBeDefined()` calls in the two `__tests__/` files: 5, not 4.** The plan's task-3 action says "the four other `toBeDefined()` calls"; `grep -c` returns 3 in `authorize-endpoint.test.ts` + 2 in `token-endpoint.test.ts` = **5**. The § 7.3 table lists 5, satisfying the criterion that the listed count equals the grep. (Post-edit line numbers are `:124`, `:177`, `:178` and `:231`, `:237` — the plan cited pre-edit `:179`, `:180`, `:233`, `:239`, which drifted by the two lines each repair removed. Two further calls exist in `idura.test.ts` at `:126`, `:136`; listed for completeness outside the criterion's scope.)
2. **`expect(capturedFetchBody).not.toBeNull()` occurs 7 times in `token-endpoint.test.ts`, not 1.** The plan's acceptance criterion expected `grep -c` to return 1. The criterion's intent — "the correct neighbouring idiom is preserved, not replaced" — holds: the instance at `:165`, immediately above the repaired assertion, is untouched, and so are the other six.

### Grep-shaped acceptance criteria superseded by deviation 1

Criteria written as `grep -n "toMatch(/\^\[\\w-\]+"` no longer match, because the matcher form changed. The equivalent verified check is `grep -c 'stringMatching(/\^\[\\w-\]+'`, which returns **exactly 1 per repaired file** (verified in all three). Every other grep criterion was checked as written and passed:

- `grep -c 'toBeDefined()' authorize-endpoint.test.ts` → **3** (down from 4) ✓
- `grep -c "requestParam!" authorize-endpoint.test.ts` → **0** ✓
- `grep -rc "requestParam!\|assertion.split"` over sites 2 and 3 → **0** each ✓
- `grep -n "get('client_assertion')" token-endpoint.test.ts:166` → no trailing `!` ✓

## Edge Coverage (ASSERT-03)

| Category | Disposition | Where |
|---|---|---|
| `adjacency` | resolved | Anchored regex accepts exactly three segments; two- and four-segment values measured as rejected (§ 5.6 table) |
| `empty` | resolved | Fails on `null`, on `''`, and on the literal four-character `'undefined'` — all three measured |
| `encoding` | resolved | `[\w-]` is ASCII-only (`\w` = `[A-Za-z0-9_]`, no `u` flag) and exactly spans base64url; a real RS256 JAR passes on the clean tree at all three sites |
| `concurrency` | resolved (backstop) | Each test constructs its own request material; no repaired assertion reads state written by another file. Injections nevertheless run one file at a time |
| `ordering` | **unresolved → flagged** | Recorded in § 5.9 of the evidence document. Each site extracts ONE named parameter by key — no collection, no output order. Inventing a criterion here would be a bogus predicate authored to hit a count |

## Known Stubs

None. `140-NEGATIVE-CONTROL.md` carries a trailing HTML comment reserving the F3/F9/F10 lanes for plans 02-06; this is a documented hand-off in a document those plans append to by design, not an unfinished stub — the F19 lane it owns is complete through § 8.

## Follow-ups Filed (not absorbed)

Three sibling `Rigidity contract` drift files, **measured at `568b1dfe`** rather than quoted, filed to `.planning/WINDOWS.md` (entries 2-4) and recorded in the evidence document:

| File | Declares | Carries |
|---|---|---|
| `tests/tests/specs/candidate/candidate-journey.spec.ts:47` | `0 expect.soft` | 3 |
| `tests/tests/fixtures/candidate/candidateProfilePage.fixture.ts:43` | `NO expect.soft` | 6 |
| `tests/tests/fixtures/candidate/candidateHomePage.fixture.ts:23` | `NO expect.soft` | 4 |

Same drift class F10 exists to close, but ASSERT-06's scope is `voter-journey.spec.ts` only. Widening plan `140-02` would pad a scoped requirement with adjacent work.

## What This Does NOT Discharge

ROADMAP criterion 2 is discharged. Criteria 1, 3 and 4 are untouched and owned by plans 05/06, 03/04 and 02. Criterion 5 is **partially** advanced — unit, lint and typecheck are green at this HEAD, but **no E2E evidence exists** and none was attempted, deliberately: live `idura.ts` injections strip OIDC material from production source, so plan 01 is alone in wave 1 with no Playwright command. No CI run has exercised these assertions.

## Threat Flags

None. The two trust boundaries this plan crossed (working tree → git history; test source → production source) were held by the three-check HYGIENE-LOOP post-gate after every injection; the third (injected build → a browser) was held by lane serialization — no server was started. `T-140-SC` remains `accept`: zero external packages were installed.

## Commits

| Task | Commit | Description |
|---|---|---|
| 1 (TRACER) | `749b41e69` | Site 1 repair + evidence pipeline established + `140-NEGATIVE-CONTROL.md` created |
| 2 | `8e3487ad7` | Sites 2 and 3 repaired, all three two-run controls recorded |
| 3 | `8b7dfb554` | Suite gate, verdict table, ownership seam, honest gaps, follow-ups filed |

## Self-Check: PASSED

- `140-NEGATIVE-CONTROL.md` — FOUND (802 lines)
- `140-01-SUMMARY.md` — FOUND
- Commits `749b41e69`, `8e3487ad7`, `8b7dfb554` — all FOUND in `git log`
- All three repaired test files — FOUND, modified as described
- `.planning/WINDOWS.md` — FOUND, `open_count: 4`
