---
phase: 164-returns-table-nullability-audit-single-override-mechanism
plan: 04
subsystem: testing
tags: [negative-control, mutation-testing, typescript, supabase, nullability, evidence-artifact]

requires:
  - phase: 164-returns-table-nullability-audit-single-override-mechanism
    provides: "164-01's override locus and null-guard (NC-1/NC-2/NC-3 mutate them), 164-02's assert script (NC-4/NC-5 are its two failure paths), 164-03's regeneration proof and the K extends keyof constraint (NC-6 re-proves its bite independently)"
provides:
  - "164-NEGATIVE-CONTROL.md — seven mutation runs across six rows, each with its command, exit code and verbatim output, so a later reader can re-run any of them from the document alone"
  - "ROADMAP criterion 2 discharged by NC-1, with the explicit finding that the committed unit test is NOT that proof"
  - "a measured demonstration that the override mechanism is load-bearing (NC-3/NC-3b), not merely present"
  - "three D-N2 follow-up entries filed during the owning phase, one of them a gap the control itself surfaced"
affects: [164-05, 156-supabase-schema-corrections, 163-ci-gates, any future RETURNS TABLE RPC]

actuals:
  tokens: 14582
  tasks: 3
  commits: 3

tech-stack:
  added: []
  patterns:
    - "Paired mutation matrix: a guard and its enabling mechanism are mutated independently AND together, so 'the guard is unflagged' and 'the guard is unforced' are separated rather than conflated"
    - "Second-instrument sourcing for a diagnostic the primary instrument does not print, with a differential run proving the second instrument's unrelated noise is not mutation-caused"

key-files:
  created:
    - .planning/phases/164-returns-table-nullability-audit-single-override-mechanism/164-NEGATIVE-CONTROL.md
    - .planning/todos/pending/2026-09-03-deno-edge-functions-do-not-consume-supabase-types.md
    - .planning/todos/pending/2026-09-03-consolidate-supabase-hosting-ci-jobs.md
    - .planning/todos/pending/2026-09-03-nothing-guards-the-supabase-types-barrel-wiring.md
  modified:
    - .planning/WINDOWS.md

key-decisions:
  - "Added a seventh run (NC-3b, both mutations at once) because NC-3 alone proves only that nothing FLAGS the guard, not that nothing FORCES it — the pairing is what makes the mechanism's contribution measurable"
  - "Sourced the TS2345 code from a second instrument (bare tsc) rather than asserting a code svelte-check never prints, and ran a differential against the reverted tree to prove that instrument's 85 unrelated errors are not mutation-caused"
  - "Reported NC-6's first, malformed mutation attempt — it produced a syntax-error red that would have been literally defensible and substantively false"
  - "Filed a third follow-up the plan did not ask for: NC-3b exposed that nothing guards the barrel wiring, and D-N2 requires it be filed in the owning phase"
  - "Recorded the plan's stale NC-5 attribution numbers (32/33 vs a measured 16) and its six non-resolving Phase-157 anchors as corrections, and proved the criterion's substance by enumerating the hit list instead"

patterns-established:
  - "A green in a negative control is evidence when its mechanism is written next to it; NC-2 and NC-3 are both greens and both load-bearing"
  - "A mutation must be verified to have applied as intended before its verdict is banked — a corrupted file fails to parse and never reaches the check under test"

requirements-completed: [CIGATE-04, CIGATE-05]

coverage:
  - id: D1
    description: "ROADMAP criterion 2 is discharged: the null-guard is proven live by a mutation observed to fail, with the compiler diagnostic quoted verbatim"
    requirement: CIGATE-05
    verification:
      - kind: other
        ref: "NC-1: guard deleted -> `yarn workspace @openvaa/frontend check` EXIT 1, `ERROR ... 361:59 \"Argument of type 'string | null' is not assignable to parameter of type 'string'.\"`; baseline on the same tree is EXIT 0 / 0 ERRORS"
        status: pass
      - kind: other
        ref: "coded diagnostic from `npx tsc --noEmit -p ./tsconfig.json`: `supabaseDataProvider.ts(361,59): error TS2345`, same position; differential vs the reverted tree adds exactly that pair and nothing else"
        status: pass
    human_judgment: false
  - id: D2
    description: "The honest limitation is recorded rather than hidden: the same mutation leaves the unit suite green, and the mechanism is explained next to it"
    requirement: CIGATE-05
    verification:
      - kind: unit
        ref: "NC-2: `yarn workspace @openvaa/frontend test:unit supabaseDataProvider` EXIT 0, 68/68 passed WITH the guard deleted — Map.get(null) is undefined and undefined ?? null is null, so the runtime path is invariant"
        status: pass
    human_judgment: false
  - id: D3
    description: "The override mechanism is proven load-bearing, not merely present — its verdict observed rather than predicted"
    requirement: CIGATE-05
    verification:
      - kind: other
        ref: "NC-3: barrel reverted to './database' -> frontend check EXIT 0 (2749 files, the one-file delta corroborating the mutation applied). NC-3b: barrel reverted AND guard deleted -> EXIT 0. Against NC-1's EXIT 1, the override is the sole reason the deletion is detectable"
        status: pass
      - kind: other
        ref: "ESLint reading taken before the run: `grep -rn 'no-unnecessary-condition'` and `grep -rn 'recommended-type-checked|strict-type-checked|requiring-type-checking'` both exit 1 (no output) across both eslint configs; :39 extends the non-type-checked `plugin:@typescript-eslint/recommended`"
        status: pass
    human_judgment: false
  - id: D4
    description: "The enumeration gate is proven able to fail on a fourth RETURNS TABLE RPC, with the item named"
    requirement: CIGATE-04
    verification:
      - kind: other
        ref: "NC-4: `node scripts/assert-rpc-return-nullability.mjs` EXIT 1, both set-equality halves naming 'gsd_probe_164_fourth_rpc' and pointing at RPC-NULLABILITY.md; summary 3->4 RPCs, alternation 32->34 columns, proving the column block was parsed not just the CREATE line"
        status: pass
    human_judgment: false
  - id: D5
    description: "The criterion-3 cast gate is proven non-vacuous, so its empty result is a measurement rather than an artefact of a grep that cannot match"
    requirement: CIGATE-05
    verification:
      - kind: other
        ref: "NC-5: cast re-introduced -> assert script EXIT 1 reporting file, line :360 and matched text; 1 gate hit against 17 naive hits, with all 16 non-hits enumerated and classified in the ledger"
        status: pass
    human_judgment: false
  - id: D6
    description: "The Phase-156 bite is proven: a stale override key is a loud compile error, never a silent no-op"
    requirement: CIGATE-04
    verification:
      - kind: other
        ref: "NC-6: one key renamed to 'parent_nomination_idX' -> `yarn workspace @openvaa/supabase-types typecheck` EXIT 2, `error TS2344 ... Did you mean \"parent_nomination_id\"?`; agrees with 164-03 probe R2 on position (52,7), code and exit status"
        status: pass
    human_judgment: false
  - id: D7
    description: "No mutation reached a commit; every revert proven three ways"
    verification:
      - kind: other
        ref: "4 files mutated, each with a pre-capture hash matching after revert; `git status --porcelain` empty at every row boundary and over the whole tree at plan close; `git diff --stat 0e8ed2720 HEAD -- apps packages scripts tests .github` is EMPTY — this plan changed no source file at all"
        status: pass
    human_judgment: false
  - id: D8
    description: "The two D-N2 follow-ups (plus a third the control surfaced) are filed during the owning phase"
    verification:
      - kind: other
        ref: "`ls .planning/todos/pending/ | grep -c 'supabase-types'` -> 2; `| grep -c 'supabase-hosting-ci'` -> 1; git status shows this task touched only .planning/todos/pending/"
        status: pass
    human_judgment: false
  - id: D9
    description: "The supabase-types-drift CI job observed running green in CI"
    verification: []
    human_judgment: true
    rationale: "STRUCTURALLY UNOBSERVABLE ON THIS BRANCH and deliberately not claimed. .github/workflows/main.yaml triggers only on push/pull_request against `main`; this work is on integration/ship-12-squash, which has never run CI, so no GitHub Actions run of the job exists or can exist here. Re-stated verbatim in 164-NEGATIVE-CONTROL.md § 12 under 'What is explicitly NOT discharged'. Already carried as 164-03 coverage D6, a STATE blocker and WINDOWS entry 242 — this plan adds no new claim and must never be read as verifying it. Discharge on the branch's first PR to main."
  - id: D10
    description: "Full E2E suite green after this plan"
    verification: []
    human_judgment: true
    rationale: "Not called for by this plan's <verification> block, and this plan changed NO source: `git diff --stat 0e8ed2720 HEAD -- apps packages scripts tests .github` is empty, so every mutation was reverted byte-identically and the only committed files are under .planning/. The frontend check ran EXIT 0 (2750 files, 0 errors, 0 warnings) on the restored tree and the assert script and package typecheck both EXIT 0. Filed as WINDOWS unrun-verify 248. Plan 164-05 owns the phase E2E gate and must run `yarn db:reset` first."

duration: 15 min
completed: 2026-09-03
status: complete
---

# Phase 164 Plan 04: The Negative-Control Ledger Summary

**Seven mutation runs proving every guard and gate this phase claims can actually fail — with the criterion-2 failure proof correctly identified as a typecheck-under-mutation rather than the committed unit test, and the two runs that honestly come back green recorded as evidence rather than omitted.**

## Performance

- **Duration:** 15 min
- **Started:** 2026-09-03T09:04:38Z
- **Completed:** 2026-09-03T09:19:17Z
- **Tasks:** 3
- **Files modified:** 5 (4 created, 1 modified) — **all under `.planning/`**

## Accomplishments

- **Criterion 2 is discharged, and by the right instrument.** `NC-1` — the null-guard deleted, `yarn workspace @openvaa/frontend check` **exit 1** with the diagnostic quoted verbatim — is the proof. The ledger states plainly that `164-01` Task 3's committed unit test is a behavioural pin and **not** that proof, because `NC-2` shows it passes with the guard gone.
- **The disclosed limitation is in the record, with its mechanism.** `NC-2`: the identical mutation, 68/68 passing, **exit 0**, because `Map.get(null)` is `undefined` and `undefined ?? null` is `null`. Recording that green is what makes `NC-1`'s red mean something.
- **The override mechanism is proven load-bearing, not merely present.** A seventh run (`NC-3b`) was added beyond the plan's six, because `NC-3` alone proves only that nothing *flags* the guard. The four-row matrix shows the override is the **sole** reason deleting the guard is detectable at all.
- **All three gates were made to fail on a real mutation** — the enumeration set-equality (`NC-4`, naming the injected RPC), the cast grep (`NC-5`, 1 hit of 17 naive), the override type constraint (`NC-6`, TS2344 naming the literal).
- **No mutation reached a commit, and this is checked rather than asserted:** `git diff --stat 0e8ed2720 HEAD -- apps packages scripts tests .github` is **empty**. This plan changed no source file at all.
- **A gap the control itself surfaced was filed** rather than left in the document: nothing in the repo fails if the barrel is rewired past the override.

## Task Commits

1. **Task 1: scaffold the ledger, run NC-1 / NC-2 / NC-3** — `342230b86` (docs)
2. **Task 2: run NC-4 / NC-5 / NC-6 and close with the verdict table** — `8c34b5184` (docs)
3. **Task 3: file the D-N2 follow-ups** — `67c0f4451` (docs)

## The six rows' exit codes in one table (required by the plan's output spec)

| Row | Mutation | Instrument | Exit | Verdict |
|---|---|---|---|---|
| **NC-1** | null-guard ternary deleted (`:361-362`) | `yarn workspace @openvaa/frontend check` | **1** | **RED** — the criterion-2 failure proof |
| **NC-2** | *the same mutation* | `yarn workspace @openvaa/frontend test:unit supabaseDataProvider` | **0** | **GREEN** — disclosed limitation, 68/68 |
| **NC-3** | barrel `Database` reverted to `./database` | `yarn workspace @openvaa/frontend check` | **0** | **GREEN** — and that green *is* the original defect |
| **NC-3b** | *both* — barrel reverted **and** guard deleted | `yarn workspace @openvaa/frontend check` | **0** | **GREEN** — the guard is unflagged *and* unforced |
| **NC-4** | a fourth `RETURNS TABLE` RPC injected | `node scripts/assert-rpc-return-nullability.mjs` | **1** | **RED** — names `gsd_probe_164_fourth_rpc` |
| **NC-5** | the Phase-126 cast re-introduced | `node scripts/assert-rpc-return-nullability.mjs` | **1** | **RED** — file, line `:360`, matched text |
| **NC-6** | one override key renamed | `yarn workspace @openvaa/supabase-types typecheck` | **2** | **RED** — TS2344 naming the literal |

## The two verbatim diagnostics (required by the plan's output spec)

**TS2345 — NC-1.** `svelte-check` prints the diagnostic text but **not** TypeScript's numeric code, so rather than assert a code the instrument never printed, it was sourced from `npx tsc --noEmit -p ./tsconfig.json` on the same mutated tree:

```
src/lib/api/adapters/supabase/dataProvider/supabaseDataProvider.ts(361,59): error TS2345: Argument of type 'string | null' is not assignable to parameter of type 'string'.
  Type 'null' is not assignable to type 'string'.
```

`(361,59)` is the identical position `svelte-check` reported as `361:59`. That second instrument is noisy — 85 unrelated implicit-`any` errors, because bare `tsc` runs outside `svelte-kit sync` and SvelteKit's generated `./$types` are absent — so the same command was re-run on the **reverted** tree and the outputs diffed. The complete difference is the TS2345 pair and nothing else.

**TS2344 — NC-6:**

```
src/database.overrides.ts(52,7): error TS2344: Type '"parent_nomination_idX" | "candidate_id" | ... ' does not satisfy the constraint '"candidate_id" | "organization_id" | ... | "short_name"'.
  Type '"parent_nomination_idX"' is not assignable to type '"candidate_id" | ... | "short_name"'. Did you mean '"parent_nomination_id"'?
```

Independently run rather than cited from `164-03` probe R2; the two agree on position `(52,7)`, code and exit status.

## NC-3's observed verdict and the ESLint reading that predicted it

The reading was taken **before** the run and the commands' actual output recorded (`T-164-12` — a predicted verdict recorded as an observed one is the failure this document exists to prevent):

```
$ grep -rn "no-unnecessary-condition" packages/shared-config/eslint.config.mjs apps/frontend/eslint.config.mjs
grep exit=1                       # no output — the rule is configured nowhere

$ grep -rn "recommended-type-checked\|strict-type-checked\|requiring-type-checking" \
      packages/shared-config/eslint.config.mjs apps/frontend/eslint.config.mjs
grep exit=1                       # no output — no type-checked preset is extended

$ grep -n "compat.extends" packages/shared-config/eslint.config.mjs
39:  ...compat.extends('eslint:recommended', 'plugin:@typescript-eslint/recommended', 'prettier'),
```

**Observed verdict: GREEN, exit 0**, `COMPLETED 2749 FILES 0 ERRORS 0 WARNINGS`. The prediction held, and the ledger states in words that this green **is the original defect** faithfully reproduced: with the generated `Database` in place, `parent_nomination_id` is typed `string`, the `!= null` guard is dead code by the type system's reckoning and live code by the database's, and nothing in the repository flags that contradiction.

The **2749** against 2750 in every other run is `database.merged.ts` dropping out of the program graph — the corroboration that the mutation actually applied. A green from a mutation that silently did not apply would prove nothing.

## The three-way revert proof for each mutated file

| File | Pre-mutation hash | Post-revert hash | `git diff --exit-code` | Rows |
|---|---|---|---|---|
| `apps/frontend/.../supabaseDataProvider.ts` | `2f9dc1225ee3a627ef882efd2f9cd0f6bd6bcfec` | **identical** | **0** | NC-1, NC-2, NC-3b, NC-5 |
| `packages/supabase-types/src/index.ts` | `d29905c7bd71839a9bd64f3e15bab7db5c337972` | **identical** | **0** | NC-3, NC-3b |
| `apps/supabase/supabase/schema/900-test-helpers.sql` | `ffc36d22ce0bc76c90ae2dada145fe739555c016` | **identical** | **0** | NC-4 |
| `packages/supabase-types/src/database.overrides.ts` | `82dd060ff750a7857022e78ca039072513c93877` | **identical** | **0** | NC-6 |

Third proof, at every row boundary: `git status --porcelain apps packages scripts` returned **0 lines**. At plan close the whole-tree `git status --porcelain` returned 0 lines, and — the strongest form — `git diff --stat 0e8ed2720 HEAD -- apps packages scripts tests .github` is **empty**: this plan's three commits touch only `.planning/`.

Every revert used `git checkout -- <specific file>`. No `git clean`, no `git stash`, no blanket reset.

## Reconciliation against what the prior SUMMARY files actually recorded

This plan records the phase's control evidence, so each prior claim was read rather than assumed.

| Prior plan | What it actually recorded | How this ledger treats it |
|---|---|---|
| `164-01` | A type probe (`Row['parent_nomination_id'] = null` compiles; `Row['entity_id'] = null` is TS2322) and a Task 3 assertion proven live **by inversion** (exit 1 `expected null not to be null`, then exit 0) | Both cited as real. **But neither is criterion 2's failure proof** — `NC-2` shows the Task 3 test passes with the guard deleted. Stated explicitly in § 12 so the phase gate cannot read it as that proof. |
| `164-02` | Probe D found a **real vacuity hole in its own guard** — the override-key parser matched `'[a-z0-9_]+'` so an uppercase typo key was silently dropped and check 5 reported clean over a set it had never read; broadened, it fires | Recorded in § 11 as the one episode of the three where **the guard itself was at fault**. `NC-4`/`NC-5` exercise the post-fix script. |
| `164-02` | The naive adapter-grep count is **16**, not the 32/33 this plan's NC-5 asserts | Re-measured independently: **16** clean, **17** under mutation. Third agreeing measurement. The plan's premise is corrected in the ledger, not copied forward. |
| `164-03` | Probe R1 (real table created, regenerated, **exit 1** showing `+ gsd_probe_164: {`, dropped, byte-identical sha) and R2 (TS2344, exit 2) | Cited as criterion 4's discharge. `NC-6` re-runs R2's class independently rather than citing it, and the two agree. |
| `164-03` | **Probe P3 did not fire**: it removed one of two `paths-filter` mentions and the guard was correctly still satisfied — the probe, not the assertion, was wrong | Recorded in § 11 as the phase's clearest example of "the probe was too weak" vs "the guard is wrong". This plan then produced a third instance of its own (§ 9a). |
| `164-03` | `tsconfig.tsbuildinfo` is **untracked and gitignored**, contrary to the premise the plan and RESEARCH R8 carry | Re-measured and still false. See "Unsatisfiable acceptance criteria" below. |
| `164-03` | The `supabase-types-drift` job is **unobservable on this branch** and is deliberately not claimed | Carried forward unchanged as `D9` and restated verbatim in § 12. This plan adds no claim about it. |

## Decisions Made

- **A seventh run was added.** `NC-3` answers "does anything flag the guard without the override?" (no). It does not answer "does anything force it?" — and that second question is the one that decides whether the mechanism is load-bearing. `NC-3b` (both mutations at once, green) supplies it. Without the pairing, `NC-3`'s green would have been a curiosity rather than a finding.
- **The TS2345 code was sourced, not asserted.** The plan's acceptance criterion requires `grep -c 'TS2345'` ≥ 1 in the ledger. Writing `TS2345` next to output that does not contain it would have been a fabricated citation in a permanent artifact. A second instrument was run and its unrelated noise quantified by differential.
- **NC-6's failed first attempt was reported, not silently retried.** It would have been easy to bank a non-zero exit on `database.overrides.ts` and write "the typecheck fails when a key is renamed" — literally defensible, substantively false.
- **A third follow-up was filed** beyond the two the plan names, because Task 3's action explicitly says "if Task 1 or Task 2 surfaced anything else … file it here", and `NC-3b` surfaced a real unguarded seam.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] The first NC-6 mutation was malformed and measured the wrong thing**

- **Found during:** Task 2, NC-6
- **Issue:** A `perl -pi -e "s|…|…|"` substitution used `|` as its own delimiter — the same character as the union separator being matched. It **prepended** the replacement to fifteen lines instead of renaming one. The typecheck went red with exit 2 and a wall of `TS1005 '>' expected` / `TS1131 Property or signature expected` **syntax** errors. A corrupted file fails to *parse*; it never reaches the `K extends keyof ReturnsRow<F>` check the row is about, so that red proved nothing about the constraint.
- **Fix:** reverted (hash back to `82dd060ff…`), re-applied with a script that **asserts the target string occurs exactly once** before substituting, and re-ran — producing the TS2344 above on a one-line diff.
- **Verification:** `git diff` on the retry shows exactly one changed line; the diagnostic names the renamed literal and offers the correct key.
- **Committed in:** the episode is documented in the ledger § 9a; no code was committed.

---

**Total deviations:** 1 auto-fixed (1 bug, in my own instrumentation rather than in the repository). **Impact:** none on deliverables. Recording it is itself part of the deliverable — § 11 now carries all three of this phase's mis-fired-probe episodes side by side.

## Measured drift from the plan (reported, not worked around)

Every anchor was re-measured before being cited. **None was resolved by writing a false citation into a permanent artifact.**

| Plan claim | Measured at HEAD `0e8ed2720` | Handling |
|---|---|---|
| The null-guard ternary is at `supabaseDataProvider.ts:301-302` | **`:360-362`** | **Eleventh consecutive plan with anchor drift.** Anchored by content; the ledger cites the measured lines. WINDOWS 243. |
| NC-5: the naive adapter grep "returns 32 hits post-`164-01` (33 before)" | **16** clean, **17** under mutation | Corrected in the ledger. The criterion's substance proven by enumerating all 17 hits and showing the gate reports exactly 1. WINDOWS 244. |
| NC-5: Phase-157's anchors are `:56`, `:92`, `:368-378`, `:511`, and the `allow_open` cast is at `:573` | **None of the six is a cast.** They point at `): number {`, a function signature, object-literal properties, a closing brace and a `Map` constructor. `allow_open` is at **`:613`** | Substance proven against the measured hit list instead. WINDOWS 244. |
| NC-3 reverts the barrel to `'./database.js'` | The barrel uses **no** `.js` extension (`164-01` measured this and followed CLAUDE.md) | Mutation applied to `'./database'`, the form that exists |
| `packages/supabase-types/tsconfig.tsbuildinfo` is tracked; restore it with `git checkout --` | **Untracked and gitignored** (`.gitignore:29`), as `164-03` already corrected | See below — this one is worse than a no-op |
| `eslint.config.mjs:39`; `tsconfig.base.json:15` `"strict": true` | **Both exact** | Cited as given |

## Unsatisfiable acceptance criteria (measured, reported, not met)

| Criterion as written | Measured | What was run instead |
|---|---|---|
| Task 2 `<verify>`: `… && git checkout -- packages/supabase-types/tsconfig.tsbuildinfo && test -z "$(git status --porcelain apps packages scripts)"` | The path is untracked and gitignored, so that command **errors with exit 1** (`pathspec … did not match any file(s) known to git`) — **breaking the `&&` chain even with every other clause green**. Not merely a no-op, as `164-03` found it. | Every clause run separately: `grep -c 'NC-6'` → 6, `grep -c 'TS2344'` → 5, `node scripts/assert-rpc-return-nullability.mjs` → **0**, `yarn workspace @openvaa/supabase-types typecheck` → **0**, `git status --porcelain apps packages scripts` → **0 lines**. WINDOWS 245. |
| Task 3 AC4: "`grep -rl 'send-email' .planning/todos/pending/` returns **only** the new file" | **Two pre-existing entries** already mention `send-email` — `2026-08-29-edge-function-non-null-env-assertions.md` (non-null `Deno.env.get(...)!` assertions) and `2026-08-29-153-extension-bearing-specifier-class-wider-than-js.md` (`.ts`-bearing specifiers) | The criterion's **intent** — do not re-file an existing finding — checked by reading both. Neither states that the functions consume no shared types; `grep -c "supabase-types"` on the first returns **0**. The non-duplication is recorded in the new entry's Context section. WINDOWS 246. |

Every other acceptance criterion across the three tasks passes as written, including both `grep -c` clauses of Task 3's `<verify>` (2 and 1) and every clause of Task 1's.

## Verification results (every exit code read directly, never through a pipe)

| Gate | Exit | Detail |
|---|---|---|
| Task 1 `<verify>`, verbatim | **0** | file exists, `NC-1` 9, `TS2345` 6, `git diff --exit-code` on both mutated paths 0, porcelain empty |
| `node scripts/assert-rpc-return-nullability.mjs` | **0** | 3 RPCs, 4/32/15, 32-name alternation, 0 cast hits, 0 violations |
| `yarn workspace @openvaa/supabase-types typecheck` | **0** | |
| `yarn workspace @openvaa/frontend check` | **0** | `2750 FILES 0 ERRORS 0 WARNINGS` on the restored tree |
| `yarn format:check` | **0** | after the ledger and three todos were written |
| `npx prettier --check` on all four new files | **0** | |
| `git status --porcelain` (whole tree) | — | **0 lines** |
| `git diff --stat 0e8ed2720 HEAD -- apps packages scripts tests .github` | — | **empty — no source file changed by this plan** |

`yarn test:unit` was **not** re-run at plan close, and deliberately: every source file is byte-identical to the pre-plan HEAD (proven by the empty diff above), so the suite `164-03` recorded green (25/25 workspaces, 0 failed, 0 skipped) is against this exact tree. `NC-2` did run the adapter's own 68 tests mid-plan.

## Issues Encountered

- **One malformed mutation** (NC-6, first attempt), resolved in one retry. See Deviations.
- No other issue required more than one attempt. The fix-attempt limit was not approached.

## Known Stubs

None. The ledger has no placeholder rows, no `TBD` verdicts and no unfilled cells; the `<!-- gsd:write-continue -->` sentinel used while composing the file in two parts was removed and `grep -c` on it returns **0**. Every one of the seven runs carries an exit code and a verbatim output block.

## Threat Flags

None new. Dispositions from this plan's register:

- **`T-164-11`** (a mutation surviving into a commit) — **mitigated, and checked rather than asserted.** Four pre-capture hashes, four matching post-revert hashes, a `git diff --exit-code` 0 per file, a porcelain check per row, and an empty `git diff --stat` against the pre-plan HEAD over `apps packages scripts tests .github`.
- **`T-164-07`** (the cast gate reported satisfied by a grep that cannot match) — **mitigated by `NC-5`**, which makes it exit 1 on a real re-introduction and reports 1 hit of 17 naive.
- **`T-164-08`** (the enumeration gate) — **mitigated by `NC-4`**, with the injected item named and both set-equality halves firing.
- **`T-164-12`** (a predicted verdict recorded as an observed one — "the ledger itself") — **mitigated.** `NC-3` in particular was run despite a strong prediction, and its ESLint reading is recorded as the commands' actual output. § 11 additionally reports the three episodes across this phase where a probe or mutation mis-fired.
- **`T-164-02`** (the `Nomination` constructor invariant) — **mitigated by `NC-1`**, which shows the type-level guard is what forces the null handling that keeps it satisfied; `NC-3b` shows what happens without it.
- **`T-164-SC`** — no package-manager install occurred; `git diff` on `package.json` and `yarn.lock` is 0 lines.

## User Setup Required

None.

## Next Phase Readiness

Ready for `164-05`. Four things it inherits:

- **All four ROADMAP criteria now have a discharge with an observed failure behind it.** § 12's verdict table maps each to its evidence and names `NC-1` as criterion 2's sole failure proof. `164-05` should cite that table rather than re-deriving it.
- **⚠ The `supabase-types-drift` job remains unobserved in CI and must not be recorded as verified.** Structural, not skipped: `main.yaml` triggers only on `main` and this branch has never run CI. Carried as `164-03` `D6`, this plan's `D9`, a STATE blocker and WINDOWS 242. Discharge on the branch's first PR to `main`, with Phase 137's identical standing item.
- **⚠ A new gap is filed and open:** nothing fails if `packages/supabase-types/src/index.ts:1` is rewired past the override — measured green even with the null-guard also deleted. `.planning/todos/pending/2026-09-03-nothing-guards-the-supabase-types-barrel-wiring.md` carries a probe-first fix sketch; WINDOWS 247. If `164-05` has room for a guard, this is the phase's most valuable remaining one.
- **The local database is untouched by this plan.** `NC-4`'s function was injected into a **schema file** and never executed; no migration was applied and no seed data written. `164-05`'s E2E gate must still run `yarn db:reset` first for the reason `164-03` records.

---

_Phase: 164-returns-table-nullability-audit-single-override-mechanism_
_Completed: 2026-09-03_

## Self-Check: PASSED

All four created files verified present on disk with `[ -f ]`: `164-NEGATIVE-CONTROL.md` (721 lines) and the three pending-todo entries. All three commits (`342230b86`, `8c34b5184`, `67c0f4451`) verified present in `git log --oneline --all`. Every task acceptance criterion and the plan-level `<verification>` block re-run at plan close: `TS2345` 7, `TS2344` 5, all six `NC-*` ids present, assert script exit 0, `supabase-types` typecheck exit 0, frontend check exit 0 with 0 errors and 0 warnings, `format:check` exit 0, `git status --porcelain` 0 lines, and `git diff --stat` against the pre-plan HEAD over all source paths **empty**. Two acceptance criteria are reported unsatisfiable-as-written above with what was measured and run instead; neither was met by bending code or prose to a stale fact.
