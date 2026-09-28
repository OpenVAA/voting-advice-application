---
phase: 151-ship-v0-2-akita-review-stack
plan: 12
subsystem: tooling
tags: [dev-seed, documentation-audit, security-review, git-stack, pull-requests, ci-signature]
status: complete

requires:
  - phase: 151-05
    provides: "the operator-approved partition, slices.tsv, and the manifest rows this plan fills for slices 03 and 04"
  - phase: 151-09
    provides: "the proven sweep-fix-cut loop and the canonical pathspec reader"
  - phase: 151-11
    provides: "slice 03 cut and unopened, the F-21 caveat on yarn db:lint:sql, and the instruction that 151-12 owns PR 4"
provides:
  - "slice 04 cut as ship/v0.2-akita-04-dev-seed (7640f7bcb), 162 files, +19,661"
  - "slice 03 published as PR #866, base ship/v0.2-akita-02-shared-packages"
  - "12 disposition cells for slice 04 with the documentation items measured as ratios rather than asserted"
  - "F-34..F-41, eight findings; six fixed pre-cut, two deferred to the operator"
  - "F-34 - the package barrel's 'Public API (stable)' docblock enumerated 18 of the 38 names it exports"
  - "F-35 - the README named a retired built-in template at three sites; the registry has 30 built-ins and no 'e2e'"
  - "F-36 - dev-seed has no locality guard, and the README asserted one it does not have on the destructive command"
  - "F-40 - all three of the Developers' Guide's factual claims about this package were false; fixed into slice 09"
  - "the corrected CI signature: dev-seed-integration is deliberately unconditional AND absent from every published head"
affects:
  - "plan 151-13 (owns PR 5; opens it once slice 05 is swept, per D-07)"
  - "plan 151-16 (F-40's residue: GENERATE_MOCK_DATA_ON_RESTART across 3 docs pages, with F-04 and F-33)"
  - "plan 151-17/151-18 (F-36's locality guard and F-39's lint baseline both need an operator decision)"
  - "plan 151-19 (the bare 'Plan NN' class - 96 occurrences here, 144 repo-wide - is outside criterion 3's rule set; gate design)"

actuals:
  tokens: 21385
  tasks: 3
  commits: 9

tech-stack:
  added: []
  patterns:
    - "measure a documentation claim as a ratio against the thing it describes: parse the barrel's exports and the docblock's bullets and diff the two sets"
    - "cross-check every count against an independent source before it reaches a public PR body - a static parse of the template registry returned a self-consistent and wrong 31 where the runtime returns 30"
    - "prove an error-handling fix against a deliberately broken dependency rather than arguing it from the source"
    - "attribute a line-count delta by its components, not by netting: a hygiene-driven -11 and a fix-driven +112 are two facts, not one"
    - "establish a file-set delta by set difference (comm), never by subtraction - subtraction cannot show that zero files left"

key-files:
  created:
    - .planning/phases/151-ship-v0-2-akita-review-stack/pr-bodies/03.md
    - .planning/phases/151-ship-v0-2-akita-review-stack/151-12-SUMMARY.md
  modified:
    - packages/dev-seed/src/index.ts
    - packages/dev-seed/README.md
    - packages/dev-seed/src/cli/seed.ts
    - packages/dev-seed/tests/writer.test.ts
    - packages/dev-seed/tests/supabaseAdminClient.test.ts
    - packages/dev-seed/tests/cli/teardown.test.ts
    - apps/docs/src/routes/(content)/developers-guide/development/testing/+page.md
    - .planning/phases/151-ship-v0-2-akita-review-stack/151-DISPOSITION.md
    - .planning/phases/151-ship-v0-2-akita-review-stack/151-STACK-MANIFEST.md

key-decisions:
  - "The fixes were committed BEFORE the disposition record, inverting the plan's task order deliberately. The record's own rule is that a cell may not read FIXED before the commit it cites exists; committing fixes first means every cell cites a reachable object when written, instead of carrying a placeholder and being corrected afterwards - which is exactly the shape that produced 151-11's deviation 4."
  - "F-39 was NOT fixed. dev-seed contributes 15 of the repository's 20 lint warnings, all one deliberate class, and the lint rule's own remedy would take the gate to 0/5 - moving a phase-wide baseline number that eight later plans compare 'unchanged' against. Re-baselining a gate mid-stack to make one slice look tidier is worse than recording the gap."
  - "F-36's locality guard was NOT added. The documentation defect was fixed; the missing guard is a behaviour change to a command that deletes rows, and CI legitimately points these CLIs at a non-localhost instance. D-13 excludes restructuring and Rule 4 reserves it for the operator."
  - "F-38 was recorded, not fixed. Removing the CLI's forward-compatibility scaffolding is code restructuring, which D-13 explicitly excludes, and pruning the narrating comments without the casts they explain would be strictly worse."
  - "F-40's fix landed in a DIFFERENT slice (09) and says so in the cell, rather than being forced into slice 04's pathspec - which would have broken the partition and tripped the catch-all."
  - "yarn db:lint:sql was deliberately not run as a gate: it exits 1 pending F-21 and nothing in this slice touches SQL, so naming it would have manufactured a red signal that says nothing about this slice."

patterns-established:
  - "A documentation item can be graded rather than judged: 18 of 38, 2 of 30, 6 of 6 are three different verdicts that 'a README exists' collapses into one"
  - "A gate's reach can be zero for the very files that violate it - all four undocumented any-suppressions live in tests/, which the package's src/-only lint script never sees"

requirements-completed: [criterion-1, criterion-2, criterion-4, criterion-6]

metrics:
  duration: ~1h25m
  completed: 2026-08-17
---

# Phase 151 Plan 12: Sweep and Cut the dev-seed Slice Summary

**The stack's second-largest new package swept with its public surface actually measured rather than assumed documented — and the measurement is the finding: the barrel's own "Public API (stable)" inventory named 18 of the 38 names it exports, the README documented 2 of 30 built-in templates and one of the two had been retired, and the Developers' Guide's only paragraph about this package got all three of its facts wrong.**

## What was built

| Task | Outcome | Commits |
|---|---|---|
| 1 | Slice 04 swept against 12 general item sets; 12 cells filled, zero blank, zero pending | `99ce9bb87` |
| 2 | Six fixes landed on `feat-gsd-roadmap` before the cut (D-04); one lands in slice 09 | `e5f55c111`, `9621f2393`, `0691123d8`, `3242d9dfd`, `ad52b8baf`, `645bee548` |
| 3 | Slice 04 cut; slice 03 published as PR **#866**; catch-all and identity verified | `9dd9c0786` |

| | |
|---|---|
| **PR #866** | https://github.com/OpenVAA/voting-advice-application/pull/866 — base `ship/v0.2-akita-02-shared-packages`, head `ship/v0.2-akita-03-supabase` @ `11f877913` |
| **slice 04** | `ship/v0.2-akita-04-dev-seed` @ `7640f7bcb` — 162 files, +19,661, −0, local and unopened |

## The four findings that matter more than the paperwork

**1. The package's own public-API inventory was half-complete (F-34).** `src/index.ts` opens with a docblock headed *"Public API (stable)"* that enumerates the exports one by one — the kind of artifact a reader trusts precisely because it looks exhaustive. It named **18 of the 38** names the file exports. The omissions were not marginal: the **entire teardown surface** (`runTeardown`, `assertTeardownPrefix`, `ALLOWED_TEARDOWN_TABLES`, `TEARDOWN_USAGE`, `TeardownResult`), the **entire built-in-template surface** (`BUILT_IN_TEMPLATES`, `BUILT_IN_OVERRIDES`, `defaultTemplate`, `defaultOverrides`, `baseTemplate`, `BASE_APP_SETTINGS`), and the **locale surface** (`LOCALES`, `LocaleCode`, `fanOutLocales`). Zero phantom entries, so the inventory was incomplete rather than wrong — which is the harder failure to notice. Now 38 of 38.

**2. The README documented a template name that has not existed for two milestones (F-35).** Three sites named a built-in `e2e`: the `--template` flag table, a section heading, and a worked troubleshooting message that quoted the CLI's error output. The registry holds **30** built-ins and no `e2e` key, so `--template e2e` errors. **The cross-check is what makes this a finding rather than a nit**: root `CLAUDE.md:308` is *correct*, writes `e2e/base`, and states the retirement explicitly — so the repo-level document was updated when the name changed and the package's own README was not. The README also documented 2 of 30 built-ins; the `perm-*` family, 28 of them, was absent entirely.

**3. The package has no locality guard, and the README asserted one (F-36).** Security Notes read *"the writer refuses to run without `SUPABASE_URL` set"*. True of `Writer`. **False of the command that deletes rows**: `seed:teardown` never constructs a `Writer` — it constructs `SupabaseAdminClient` directly, whose module-level fallbacks supply a URL and the published demo service-role key with no enforcement at all, a decision recorded in place at `cli/teardown.ts:24-27`. The sharper half is that *both* CLIs auto-load the repo-root `.env` and fall back `SUPABASE_URL ??= PUBLIC_SUPABASE_URL` — **the deployed frontend's variable** — so a `.env` configured for a staging or production Supabase silently retargets both commands at it, with a service-role client that bypasses RLS. The guards that do exist are the prefix scoping, the 2-character minimum, and the tables excluded from the teardown set. A locality check is not among them. The documentation now says exactly that; the guard itself is an operator decision.

**4. The Developers' Guide was wrong about this package in all three of its claims (F-40).** Its only paragraph on `@openvaa/dev-seed` said the built-in template is `e2e` (it is `e2e/base`); that variant specs compose on the base *"see `tests/tests/setup/templates/variant-*.ts`"* — **that directory holds 0 tracked files** and no `variant-*` path exists anywhere outside `.planning/`, the real shape being 25 per-perm setup/teardown pairs under `tests/tests/setup/perm/`; and that the data is *"seeded into Supabase via the Admin Tools API"* — it is written by the `bulk_import` RPC, and Admin Tools was the Strapi plugin slice 01b deleted. Fixed, **landing in slice 09**, recorded as a cross-slice landing rather than forced into this slice's pathspec.

## Criterion 3, confirmed where reference density was highest

The plan's `key_links` records that dev-seed carries 88 of the 183 files holding the bare decision-ID form and asks this sweep to confirm the hygiene passes cleared them. Confirmed **on the slice's own 162 files**, not on the gate's aggregate: bare decision ID **0**, long form **0**, any `D-<digit>` at all **0**, `.planning/` paths **0**, section anchors **0**, the gate's `plan-number` form **0**.

**Slice 04 contributes nothing to the `phase-ref` half of the deliberately-red gate** — all 11 of those occurrences live in three named files, none of them here. **It does contribute 45 of the 84 `task-id` occurrences**, across 21 of the 46 files, and that is stated rather than left to inference: they are requirement IDs used as inline traceability anchors (`GEN-04` ×20, `TMPL-0x` ×16, `GEN-08/09/10` ×6, `CLI-03/04` ×3), covered by a row-level operator KEEP.

One class sits **outside** criterion 3's rule set entirely and is recorded rather than acted on: the bare `Plan NN` form appears **96 times across 39 files** here, of 144 repo-wide — this slice carries **67%** of it. The gate's rule is `(?i)\bplans?\s+\d+[-.]\d+`, which matches the `Plan 88-02` spelling and not the bare one, so the row is green. That is the rule working as written; whether it should be widened is gate design, already deferred to 151-19.

## The measurement that was self-consistent and wrong

A static parse of `BUILT_IN_TEMPLATES`'s object literal returned **31** keys. Self-consistent, reproducible, and wrong — the regex also matched the marker line that opens the block. Importing the module under `tsx` and reading `Object.keys` returns **30**, and the live CLI's own error message lists 30 names. **The number was one keystroke from entering a public PR body.** It is recorded in the disposition because it is the same failure mode this phase keeps finding in other people's artifacts: an internal identity that balances, checked against nothing.

The same discipline caught a second one. My first pass at the item-6 ratio reported "36 of 38 enumerated" after the fix, because the bullet parser captured only the first backticked name per line and two bullets name two exports each. Re-run against **both** the pre-fix blob and the worktree with a parser that reads every identifier: **18 → 38**. The pre-fix 18 is robust; the interim 36 was the measurement, not the document.

## The cut

| check | result |
|---|---|
| chain | `04^ == 03` by `rev-parse` |
| catch-all, `TIP04..TARGET` pathspec `.` | `files=3651` |
| arithmetic | 252 + 97 + 119 + 162 + 3651 = **4281** = comparable total. **Gap: 0.** |
| attribution of the rise from 151-11's 4280 | **+1, named** — `151-11-SUMMARY.md`, riding slice 11. Established by `comm` over the two file sets: exactly one entering, **zero leaving**. Subtraction alone cannot show the second half. |
| deviation from the predicted remainder | 3812 − 162 + 1 = 3651. **0.000%**, against a 1% halt threshold |
| partial-stack identity | five cut slices + catch-all → tree `c5b0fecde` = `TARGET^{tree}`. **MATCH** |
| free cross-check | `C1..slice-03` = **468** = 252 + 97 + 119. The chain's arithmetic closes without the catch-all |
| taxonomy over `C1..TIP04` | `[db]` gaps **0**, shared paths **0**, unplaced **0**; three cardinality clauses at `0 == 1` because slices 11, 09 and 05 are not cut yet |
| guards | 4 `ship/*` refs on origin; PR 5 not opened (`gh pr list --head … → 0`); `origin/main` unmoved at `ac30f132a`; PR **#860 untouched**; push dry-run reported `[new branch]`, no force anywhere |

**No slice was re-cut**, so PRs #863, #864 and #865 were never disturbed. All six fixes fall inside the *uncut* slices 04, 09 and 11.

**The line count moved and both components are attributed.** The dry run's 19,560 was 19,549 at this plan's starting tip — a −11 residue of the 151-07/08 hygiene rewrites inside this package's comments — and this plan added +112 net (131 insertions, 19 deletions), listed file by file in the manifest. 19,549 + 112 = **19,661**. **The file count did not move at all**: every one of the six edits touched a file already inside some slice's diff, so no file entered or left any partition cell. The slice now sits 339 lines under GitHub's 20,000-line render cap rather than 440.

## Deviations from Plan

### 1. [Deliberate ordering call] The fixes were committed before the disposition record, inverting the plan's task order

**Found during:** writing Task 1's artifact.
**Issue:** the plan orders sweep (Task 1) → fixes (Task 2). But this record's own rule is that **a cell may not read `FIXED` before the commit it must cite exists**, and six of slice 04's twelve cells are `FIXED`. Following the commit order literally means writing placeholders and correcting them afterwards — precisely the shape that produced 151-11's own deviation 4, where five cells cited an amended, unreachable hash.
**Resolution:** the *sweep* ran first, as written; the *commits* were ordered fixes-then-record, so every `FIXED` cell cited a reachable object from the moment it was written. D-04's actual requirement — fixes land on `feat-gsd-roadmap` before the slice is cut — is unaffected and met. Recorded in the disposition itself, not only here.

### 2. [Rule 1 — the plan's claim was wrong, not the content] The plan's account of the dev-seed CI job is wrong on both halves

**Found during:** Task 2, before writing the claim into a public PR body.
**Issue:** `151-12-PLAN.md` states the dev-seed integration job "exists in CI but is conditional and will not fire on a sibling-based PR, so the local run is the evidence". Measured: `main.yaml:130-136` records that `dev-seed-integration` carries **deliberately NO `paths-filter`**, and names the incident that made it unconditional (*"a conditional guard is how F5 happened in the first place"*). And more decisively, **the job does not exist at any published head in this stack** — `main.yaml` is blob `c2fdcedb2`, byte-identical to `origin/main`'s, at 01a through 04, defining three jobs on `Setup Yarn 4.6`; `skill-drift-check`, `supabase-tests` and `dev-seed-integration` arrive with slice 10.
**Resolution:** the conclusion survives — the local run *is* the evidence — but for a different reason, and `pr-bodies/03.md` states the real one: the `pull_request` trigger is `branches: [main]` and the base is a sibling. **This is the eighth plan-encoded claim in this phase to be wrong as written, and again the reasoning is sound while the observable signature is not.** This is the same class of error 151-10 had to correct on two live PRs; catching it before publication is the whole point of the carry-forward instruction.

### 3. [Rule 2 — sharpens a prior plan's record] 151-11's framing of the Supabase CI gap was true but understated

151-11 recorded the `supabase-tests` job as "conditional on a paths filter and fires on none of this stack's PRs". Measured at PR #866's head, the job **does not exist**, and the backend job that does exist there, `backend-validation`, builds and validates `@openvaa/strapi` — the workspace slice 01b deletes. There is no CI job anywhere in the published stack that could exercise the Supabase schema, conditional or not. Recorded in the manifest and stated in `pr-bodies/03.md` in those terms.

### 4. [Deliberate scope call] One fix landed in slice 09 rather than slice 04

F-40's file is under `apps/docs/**`, which belongs to slice 09. The plan anticipates exactly this and instructs that such a fix lands on the branch and is recorded as a cross-slice landing. Done: the slice-04 item-15 cell names the file, the owning slice, and the plan that will cut it. Forcing it into slice 04's pathspec would have broken the partition and tripped the catch-all.

### 5. [Recorded] `yarn db:lint:sql` was deliberately not run as a gate

151-11's standing instruction is that any `<verify>` naming it fails on a correct tree until F-21 is discharged. This plan's `<verify>` blocks name `yarn test:unit && yarn lint:check`, which were run and hold exactly. Nothing in this slice touches SQL, so running the SQL gate would have produced a red signal saying nothing about slice 04.

## Known Stubs

None introduced. No stub, placeholder or skipped test was added. All three of the plan's `<verify>` blocks were run and all three pass: the decision-ID grep returns no matches, `yarn test:unit && yarn lint:check` hold at baseline, and `04^ == 03` by `rev-parse`.

## Deferred Issues

| ID | Routed to | Why not fixed here |
|---|---|---|
| **F-36** (the guard) | **operator** | Adding a locality check changes the behaviour of a command that deletes rows across 10 tables, and CI legitimately points these CLIs at a non-`localhost` instance. The documentation half is fixed |
| **F-38** | **a later phase** | Removing the CLI's forward-compatibility scaffolding is code restructuring, which **D-13 explicitly excludes**; pruning its narrating comments alone would leave three casts unexplained. The remedy is written out so it need not be re-derived |
| **F-39** | **operator** | The fix would take `lint:check` from `0 errors / 20 warnings` to `0 / 5`, moving a phase-wide baseline eight later plans compare "unchanged" against |
| F-40 residue | **151-16** | `GENERATE_MOCK_DATA_ON_RESTART` in 3 docs pages and no code, plus the rest of that page's Strapi-era content (`ensureDevData`, `yarn dev:down`) — the F-04 / F-33 class, all under `apps/docs/**` |
| the bare `Plan NN` class | **151-19** | 96 occurrences here, 144 repo-wide, outside criterion 3's rule set entirely. Widening the rule is gate design |

## Notes for the next plans

- **151-13 owns PR 5.** Slice 04 is cut and unopened. Sweep slice 05 first, then open it — D-07.
- **Do not describe CI as "conditional" on any PR in this stack.** No check fires because `main.yaml`'s `pull_request` trigger is `branches: [main]` and the bases are siblings. And do not name `skill-drift-check`, `supabase-tests` or `dev-seed-integration` in a PR body — none of them exists at any head below slice 10.
- **Slice 04 is 339 lines under the 20k render cap.** Any later fix inside `packages/dev-seed` moves it. Crossing 20,000 changes how the PR renders.
- **Establish file-set deltas with `comm`, not subtraction.** Subtraction gives the count; only the set difference shows that zero files left.
- **Cross-check any count that will reach a public body.** A static parse of the template registry returned a self-consistent 31 against a true 30, and an early ratio read 36 of 38 against a true 38 of 38 — both were artefacts of the measurement, both caught by a second, independent method.
- **Eight plan-encoded claims in this phase have now been wrong as written**, and the eighth is again correct reasoning attached to an unverified observable signature. That is the pattern for 151-19.

## Self-Check: PASSED

| Claim | Check | Result |
|---|---|---|
| `pr-bodies/03.md` created | `[ -f … ]` | FOUND |
| `151-12-SUMMARY.md` created | `[ -f … ]` | FOUND |
| All 8 cited fix/record commits reachable | `git log --oneline --all \| grep -c` | each returns 1 |
| No placeholder token left in the disposition | `grep -c 'FIX[A-F]`'` | 0 |
| `04^ == 03` | `git rev-parse` | `11f877913` both sides |
| Slice 04 shape | `diff --name-status --no-renames 03..04` | 162 files, all `A`, +19,661 |
| Partial-stack identity | catch-all tree vs `TARGET^{tree}` | `c5b0fecde` == `c5b0fecde` |
| Partition arithmetic | 252 + 97 + 119 + 162 + 3651 | 4281 == comparable total |
| Comparable-total rise attributed | `comm` over the two file sets | 1 entering, **0 leaving** |
| Decision-ID form absent from the package | `git grep -c -I -P '\bD-\d{2,3}(-\d{2})?\b' -- packages/dev-seed` | no matches |
| Public API inventory complete | parser over both the pre-fix blob and the worktree | 18/38 → **38/38** |
| Built-in template count | `Object.keys` under `tsx`, and the live CLI's error text | **30**, twice, against a wrong static 31 |
| F-37 fix proven | CLI run against a deliberately throwing registry | real cause printed before the fallback message |
| PR #866 base | `gh pr view 866 --json baseRefName` | `ship/v0.2-akita-02-shared-packages` |
| PR #866 head SHA | `gh pr view 866 --json headRefOid` | `11f877913` == local |
| PR #866 checks | `gh pr checks 866` | "no checks reported" — asserted, not predicted |
| PR 5 not opened | `gh pr list --head ship/v0.2-akita-04-dev-seed --jq length` | 0 |
| `ship/*` refs on origin | `git ls-remote --heads origin 'ship/*'` | 4 |
| `origin/main` unmoved | `git ls-remote origin refs/heads/main` | `ac30f132a` |
| PR #860 untouched | `gh pr view 860` | OPEN, base `main`, title unchanged |
| Four-gate baseline held | `TURBO_FORCE=1` on each | build 14/14 (0 cached); test:unit 1522/149 (21/21, 0 cached); lint:check 0 errors/20 warnings (11/11, 0 cached); format:check red on exactly the 2 PD-03-fenced files |

---

*Phase: 151-ship-v0-2-akita-review-stack · Plan 12 · completed 2026-08-17*
