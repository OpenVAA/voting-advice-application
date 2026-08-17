---
phase: 151-ship-v0-2-akita-review-stack
plan: 14
subsystem: frontend-library
tags:
  [
    review-stack,
    svelte5-runes,
    supabase-adapter,
    checklist-disposition,
    context-reactivity,
    dropped-finding-class,
    criterion-1
  ]
requires:
  - '151-13: slice 05 cut at 545cc26c8, PRs #863-#867 open, gate baseline unchanged'
  - '151-11: F-24 routed here for a single decision covering both halves'
  - '151-06: the disposition scaffold, cells_expected 163, adapter block owned by slice 06'
  - "151-05: the manifest's dropped-finding standing instruction and canonical pathspec reader"
provides:
  - 'slice 06 branch ship/v0.2-akita-06-frontend-lib at 8c613634b (533 files, +22715/-8344), unpushed'
  - 'PR #868 open (slice 05 -> ship/v0.2-akita-04-dev-seed), title format 6/12 <subject verbatim>'
  - '151-DISPOSITION.md slice-06 section: 12 general + 3 adapter cells, cells_filled 84 -> 99 of 163'
  - 'the Supabase Adapter block CLOSED — its only appearance in the stack, proven by enumeration'
  - 'pr-bodies/05.md'
  - 'F-51..F-65 (15 findings; 9 fixed, 6 deferred with routing) and F-24 resolved as escalate-not-fix'
affects:
  - '151-15 (slice 07 sweep + PR 6; F-61 is a live reactivity defect in its files, F-62 is the same shape without the failure mode, two F-57 fixes already ride its diff)'
  - "151-16 (slice 09 carries F-64, a 117-file stale-permalink class; slice 10 carries F-59's fix)"
  - '151-18 (F-24 escalation with F-21/F-29/F-30/F-36; F-60 duplication; F-63 blocked by a published slice)'
tech-stack:
  added: []
  patterns:
    - 'prove a project-specific reactivity rule by scripting the enumeration over every consumer, then extend the same script to the neighbouring slice — the violations were all next door'
    - 'read the reactive mechanism before judging a consumer: the #version dependency lives in the ACCESSOR, which is what makes both a destructure and a $derived alias wrong for different reasons'
    - 'a documentation fix can be the right repair for dead code: state the precondition that makes an unused helper unusable, rather than deleting it or wiring it into a path that would break'
key-files:
  created:
    - .planning/phases/151-ship-v0-2-akita-review-stack/pr-bodies/05.md
    - .planning/phases/151-ship-v0-2-akita-review-stack/151-14-SUMMARY.md
    - apps/frontend/src/lib/server/api/README.md
  modified:
    - .planning/phases/151-ship-v0-2-akita-review-stack/151-DISPOSITION.md
    - .planning/phases/151-ship-v0-2-akita-review-stack/151-STACK-MANIFEST.md
    - .planning/phases/151-ship-v0-2-akita-review-stack/scripts/build-slice.sh
    - apps/frontend/src/lib/server/admin/features/condenseArguments.ts
    - apps/frontend/src/lib/server/admin/features/generateQuestionInfo.ts
    - apps/frontend/src/lib/api/adapters/supabase/utils/mapRow.ts
    - apps/frontend/src/lib/components/questions/QuestionChoices.svelte
    - apps/frontend/eslint.config.mjs
decisions:
  - 'F-24 is escalated, not fixed: the decisive fact — what Signicat''s Finnish bank-auth response actually guarantees — is external knowledge the repository does not contain, and the fix is a behaviour change to shipped auth code. The question is narrowed for the operator to whether the Signicat path is now legacy behind Idura.'
  - 'The three context-rule violations found are all in slice 07 and are NOT fixed here. A reactivity fix changes when a component updates and this plan requires a named covering test; the test that would catch F-61 is an E2E spec this plan cannot run.'
  - 'Item 5 is DEFERRED on a real duplication rather than FIXED: extracting the shared filter handlers is code restructuring, which D-13 excludes, and it is behaviour-adjacent with no E2E gate available.'
  - 'F-64 (272 stale permalinks across 117 apps/docs files) is routed to 151-16 whole rather than half-fixed here: many are generated pages, so the repair is a generator change, and a 117-file edit inside another uncut slice would sit outside the disposition that reviews it.'
  - 'prettier was run on two files by path, never `yarn format`: the replacement controller.info calls exceeded the line width and would have grown format:check''s red set from 2 to 4, and the CARDINALITY of that set is what PD-03 fences.'
metrics:
  duration_min: 118
  completed: 2026-08-17
  tasks: 3
  commits: 8
  slice_files: 533
  slice_insertions: 22715
  slice_deletions: 8344
  cells_filled_delta: 15
  findings_raised: 15
  findings_fixed: 9
  findings_deferred: 6
  dropped_class_files_swept: 492
actuals:
  tokens: 96000
  tasks: 3
  commits: 8
status: complete
---

# Phase 151 Plan 14: Sweep and cut the frontend library slice Summary

Swept the stack's largest reviewing surface — 526 files in the diff **plus 492 more that no slice's
diff contains** — against 19 checklist item sets, closed the Supabase Adapter block by enumeration,
proved the project's two undetectable reactivity rules consumer by consumer, fixed 9 defects in 6
commits, cut slice 06, and opened PR #868.

## What was built

**Slice 06** — `ship/v0.2-akita-06-frontend-lib` at **`8c613634b`**, 533 files, +22,715 / −8,344,
parented on slice 05. Local and unpushed; PR 7 opens at 151-15 per D-07.

**PR [#868](https://github.com/OpenVAA/voting-advice-application/pull/868)** — slice 05 →
`ship/v0.2-akita-04-dev-seed`. GitHub independently confirms the body's central numbers:
`changedFiles: 195, additions: 23325, deletions: 778`.

**15 terminal disposition cells** — `cells_filled` 84 → **99** of 163. Twelve general (6 FIXED,
3 MET, 3 DEFERRED, and **0 NOT-SWEPT — the first slice in the stack where every general item has a
real surface**) plus the three Supabase Adapter cells, all MET. **The adapter block appears in this
slice and in no other, so this closes it for the phase.**

## The two results that only an exhaustive check could produce

**The adapter block, proven by counts rather than sample.** All three items are `none`-reach: no gate,
no type and no test enforces any of them, and `getSession()` compiles as readily as `safeGetSession()`.

| Item | Checked | Conforming |
|---|---:|---:|
| 26 — adapter classes use the mixin's fetch-carrying initialiser | 4 concrete classes | **4** |
| 27 — row mapping goes through the shared column map | 11 read-mapping sites; 24 files scanned for hand-rolled case conversion | **11**, and **0** hand-rolled |
| 28 — route guards use the safe session accessor | 9 safe call sites | **9**, and **unsafe-in-a-guard = 0** |

Item 28's second number is the one that matters and it is **0**. Both bare `getSession()` occurrences
are named individually rather than netted, because netting would hide the interesting one: `hooks.server.ts:24`
**is** `safeGetSession`'s own implementation and validates via `getUser()` on the next line, and
`supabaseDataWriter.ts:169` is a data-read method whose `role` does reach an authorization decision —
but behind a `safeGetSession` gate that runs first and redirects.

**The two context reactivity traps, enumerated by script over every consumer.** These are the rules
no lint rule, type or test enforces, and the project has a documented incident where a violation
shipped.

| Surface | Destructuring sites | Destructuring a reactive accessor | `dataRoot` consumers | Bound to an intermediate alias |
|---|---:|---:|---:|---:|
| slice 06 (`src/lib`) | **60** | **0** | 5 | **0** |
| slice 07 (`src/routes`) | 41 | **1** | 3 | **2** |

**Slice 06 is clean and clean deliberately** — every one of its five `dataRoot` consumers reads
through the accessor inside its own tracking scope and says so, including one that uses a *thunk*
(`dataRoot: () => DataRoot`, called inside `$derived.by`) to defer the read into the consumer.
**All three violations are next door, in slice 07** — which is exactly why the scan was extended
there rather than stopped at the pathspec boundary.

**Reading the mechanism before judging the consumers is what made the verdicts trustworthy.**
`dataContext.svelte.ts:81-88` installs `dataRoot` as `get() { void self.#version; return dataRoot; }`.
So the reactive dependency is taken **only where `ctx.dataRoot` is read** — which is simultaneously
why a destructure freezes it (the getter runs once, at init) and why a `$derived` alias silently
skips (it recomputes, yields the same reference, and referential equality suppresses downstream
notification). The two failure modes are different and the same source line explains both.

## F-24 — resolved as routed, and the resolution is "escalate", not "fix"

151-11 found the Signicat path keying account identity on `birthdate` — so two candidates sharing a
birth date collide into one auth user — and routed it here so one decision would cover the frontend
and Edge Function halves together. The frontend half is where 151-11 said it was and states the design
in its own words (`providers/authConfig.ts:18-26`, `getIdTokenClaims.ts:44`, `dataWriter.type.ts:64`).

**It is not fixed, and the reason is not convenience.** The decisive fact — whether Signicat's Finnish
bank-authentication response can be relied on to carry a stable subject identifier for this deployment
— is external knowledge the repository does not contain, and no amount of reading this codebase
settles it. Both halves state the design independently and consistently, so it is a design rather than
a slip; the fix is a behaviour change to shipped authentication code well beyond D-05's bar; and the
bank-auth E2E specs are not runnable here. Idura, the newer provider, correctly uses `sub`, which is
evidence about intent and not about what Signicat returns.

Routed to the operator at **151-18** with the question narrowed: *is `birthdate` still the intended
identity key for the Signicat path, or is that path now legacy behind Idura?* If legacy, the remedy is
a deprecation, not a schema change.

## Deviations from Plan

### Auto-fixed issues

**1. [Rule 1 — Bug] F-56: a tracked file whose NAME is editor debris, invisible to every content grep**

- **Found during:** Task 1, working the dropped-finding class.
- **Issue:** `apps/frontend/src/lib/server/api/README.md 21-40-30-014.md` — a space and a
  timestamp-shaped suffix in the filename. Contents are an ordinary README. Introduced by
  `b2d6a24c7 feat(v1.1): Monorepo Refresh`, so inherited rather than added by v0.2 — and **byte-identical
  across the layout move, so it is in no slice's diff and would have been reviewed by nobody.**
- **Fix:** renamed to `README.md`. A filename sanity scan over all 492 dropped and all 526 in-diff
  files finds no second instance.
- **Commit:** `a75b87e4c`

**2. [Rule 1 — Bug] F-57: every "or locally" README link is dead, at 9 sites**

- **Issue:** `/docs/src/routes/developers-guide/…` is wrong twice — `docs/` became `apps/docs/` in
  slice 01a, and the route carries a `(content)` group segment the links omit.
- **Fix:** 8 sites fixed with **each target asserted to exist on disk**; the ninth,
  `packages/app-shared`, is **not** fixed and is deferred — slice 02 is cut, pushed and open as PR
  #865, so correcting it would mean force-pushing a PR under review. First time this phase has *paid*
  D-07's lag rather than collected on it.
- **Commit:** `a75b87e4c`

**3. [Rule 1 — Bug] F-53: five console statements bypassing the job controller, two at ERROR level**

- **Issue:** `condenseArguments.ts:107-108` shipped `console.error({ election })` and
  `console.error(dataRoot.candidateNominations.map(...))` — an entire `Election` object and every
  candidate-nomination id, at ERROR level, unguarded, on every run of a job an admin triggers from the
  UI. Neither is an error and neither reaches the admin. Three `console.info` progress dumps bypassed
  the same controller.
- **Fix:** the two deleted; the three moved onto `controller.info`, which writes into the job store
  where an admin sees them. `console.*` under `server/admin` is now 0.
- **Commit:** `873e1a7f8`

**4. [Rule 1 — Bug] F-51: four component usage examples document a deleted API**

- **Issue:** four `@component` docblocks show `bind:selected={$selectedConstituencies}` and
  `answer={$voterAnswers[question.id]}` — the `$store` syntax for a `svelte/store` seam this milestone
  deleted and the frontend's own eslint config makes an **error**. A reader copying the documented
  usage writes code that cannot compile. `QuestionChoices`'s example was wrong a second, independent
  way: `selectedId` is typed `Id | null` and the example passed an `Answer`.
- **Fix:** all four rewritten against their real call sites. `SingleGroupConstituencySelector` was
  already correct and is the in-slice control.
- **Commit:** `e32b4031f`

**5. [Rule 1 — Bug] F-52 + F-59: six hygiene-codemod comment defects**

- **Issue:** five in the slice — a double citation (`see phase 62 see phase 88`), a dangling
  preposition ("the canonical shape for the results-page integration in."), an eaten connective, a
  surviving possessive (`see phase 140's remit is …`), and a bare `(decision 99-2)` naming nothing —
  found with the **old/new diff-pair method**, not a tree grep. A sixth, in
  `apps/frontend/eslint.config.mjs`, had three broken sentences in the one block explaining why a lint
  ban is duplicated verbatim; an unreadable version invites the next editor to delete the duplication.
- **Commits:** `77ab326f9`, `c98ec04d2`

**6. [Rule 2 — Missing documentation] F-54, F-55, F-58**

- Three `Array<any>` mixin rest parameters undocumented — and the complement is the finding: they do
  not trip `lint:check` because `no-explicit-any` is configured with **`ignoreRestArgs: true`**, so
  they are exempted by configuration, not judged conforming. One a11y suppression without a rationale
  (`Button.svelte:181`), the only one of nine in the slice lacking one. And `mapRowToDb`/`mapRows`,
  exported and unit-tested with **zero production call sites repo-wide**, now state why the write path
  cannot use them: `COLUMN_MAP` lacks the `admin_jobs` operational columns, so the writer that would
  want `mapRowToDb` correctly spells 12 snake_case keys by hand.
- **Commit:** `021d37218`

### Deferred, each with its reason and its route

- **F-61 → 151-15.** `results/[[electionTab]]/+layout.svelte:73-77` destructures `appSettings` and
  `dataRoot` while its comment at `:69-72` asserts the destructure is correct — true before the v2.13
  handle flatten, false now. `appSettings` is value-replacing, so the local goes stale on navigation;
  `dataRoot` is identity-stable, so `{#if dataRoot.elections.length > 1}` at `:349` never re-evaluates
  when data arrives. **A slice-07 file, and this plan's own rule forbids landing it**: a reactivity fix
  changes when a component updates and must name a covering test, and that test is an E2E spec
  unrunnable here.
- **F-62 → 151-15.** Two `const dataRoot = $derived(ctx.dataRoot)` aliases — the forbidden shape
  **without** the failure mode, because both use the alias only to write, deliberately outside a
  tracking scope. Recorded with that analysis so 151-15 neither "fixes" a non-bug nor dismisses F-61
  by association.
- **F-60.** Real duplication: `EntityListControls` and `EntityListWithControls` carry the same three
  filter handlers and near-identical markup, and the extraction target already exists. Not fixed —
  extraction is code restructuring, excluded by D-13, and behaviour-adjacent with no E2E gate.
- **F-63.** The ninth dead doc link, blocked by a published slice.
- **F-64 → 151-16.** 272 `blob/main/frontend/…` permalinks across 117 `apps/docs/` files, plus
  store-era prose on the contexts page. A generator change plus a prose pass, and slice 09's to make.
- **F-65.** `COLUMN_MAP` carries an identity entry contradicting its own docblock and two keys mapping
  to one property. Neither is live; both noted because the map is the adapter block's shared contract.
  Slice 03 is published, so it cannot be touched.

## Verification

### Gates — every one matched to the baseline

| Gate | Baseline | Measured | Verdict |
|---|---|---|---|
| `yarn build` (`TURBO_FORCE=1`) | 14/14 | **14/14** | unchanged |
| `yarn test:unit` (`TURBO_FORCE=1`) | 1522 / 149 files | **1522 / 149** | unchanged |
| `yarn lint:check` (`TURBO_FORCE=1`) | 0 errors / 20 warnings | **0 / 20** (core 2, dev-seed 15, frontend 1, tests 2) | unchanged |
| `yarn format:check` | RED on exactly 2 PD-03-fenced files | **RED on exactly 2** | unchanged |
| `hygiene-grep-report.sh --assert-clean` | exit 1; `task-id` 84 / `phase-ref` bare 11 | **exit 1, every column identical** | unchanged |

**`yarn format` was NOT run.** Two files were reformatted individually by path because the replacement
`controller.info(...)` calls exceeded the line width and would otherwise have grown `format:check`'s
red set from 2 to 4 — the *cardinality* of that set is what PD-03 fences. Every other edited file was
`prettier --check`ed individually and was already clean. **F-39 honoured: the lint warning count was
not reduced.** `yarn db:lint:sql` deliberately not run — it exits 1 on a correct tree pending F-21 and
nothing here touches SQL.

Every `see phase N` this plan wrote survives on **one line** — the trap that moved criterion 3's
approved state during 151-13. Where a fix would have removed a citation and taken `phase-ref occ` from
660 to 659, the citation was kept and the grammar repaired around it, because an operator approved a
report with 660 in it.

### The partition safety check — gap 0, identity MATCH

252 + 97 + 119 + 162 + 195 + 533 + 2934 = **4292** = comparable total. **Gap: 0.** The rise from
151-13's 4283 is **+9, every one named** by set difference with **zero files leaving**: seven in slice
06 (this plan's fixes) and two `.planning/` files 151-13 committed after its own measurement.
Predicted remainder 3458 − 526 + 2 = **2934**, the measured value; deviation **0.000%**. A second,
independent decomposition closes without the catch-all — 213 + 329 + 39 + 37 + 2316 = **2934**, with
slices 07–10 unchanged **file for file** from the dry run. Partial-stack identity: the seven cut slices
plus the catch-all produce tree **`06f7ab4f4`** = `TARGET^{tree}`. **MATCH.**

### The measurement artefact this plan caught in its own work

`awk '{print $2}'` over `git diff --name-status` output **truncates a path containing a space**, so
the corrupted README's old path vanished from the delta and the first attribution read **+6 against a
measured +7**. The count was right and the attribution was one short — the same self-consistent-and-wrong
shape as this phase's other five. Re-run on `--name-only`, both close. `build-slice.sh` handles this
correctly and its docblock cited that exact path as the reason; the docblock is updated rather than
left naming a path that no longer exists.

### Publishing invariants — asserted, not assumed

`git ls-remote --heads origin 'ship/*'` → exactly **6**. `origin/main` unmoved at `ac30f132a`. PR
**#860 untouched** (`updatedAt` still `2026-05-19T12:08:25Z`). `gh pr list --head
ship/v0.2-akita-06-frontend-lib` → **0**, so D-07's one-slice lag held. `gh pr checks 868` → *"no
checks reported"*. The push was dry-run first and reported `[new branch]`; **no force-push anywhere**,
no `git clean`, no `git stash`, worktree clean throughout, `HEAD` never left `feat-gsd-roadmap`.

**The CI failure signature was re-verified before being published again**, because 151-10 published
the wrong step name and had to correct two live bodies. `gh run view 32017478048 --json jobs`:
step **3 `Setup Yarn 4.6` — failure**, step **5 `Install all dependencies` — skipped**; the log
carries `YN0085: … and 407 more` and `YN0028` on all three jobs.

### What was NOT verified — stated, because the alternative is a claim

**The E2E suite was not run.** No dev server on `:5173`, no seeded local Supabase; D-24's run at 151-18
is where that is paid, against the post-sweep tip. Per `CLAUDE.md` a did-not-run E2E test counts as a
failure, so **this plan claims a statically swept slice, not a green one** — and `pr-bodies/05.md` says
so in the PR for the very slice that *is* the project's green signal, where the temptation to imply
otherwise is greatest.

**No reactivity fix was landed, so this plan's covering-test requirement has no subject.** The one
genuine reactivity defect found is in slice 07 and is deferred to the plan that owns it, for exactly
that reason. Recorded as **not triggered**, not as satisfied.

**No test was skipped and no baseline regenerated.** `git diff --name-only` over this plan's commits
matches `-snapshots` and `__screenshots__` **0** times each.

## One defect this plan introduced into its own record, and caught

The first commit of this SUMMARY carried a **YAML-invalid frontmatter**: a shell single-quote escape
sequence (`'"'"'`) leaked verbatim into a `affects:` entry because it was written inside a Python
heredoc, where that sequence has no meaning. The file rendered fine and read fine; `yaml.safe_load`
refused it. Caught by parsing the frontmatter rather than by reading it, and repaired in the following
commit. **Recorded rather than quietly amended** — it is the same class as the five self-consistent
artifacts this phase has already caught, produced by this plan, and the lesson is the cheap one:
validate a machine-readable block with the machine.

## Method note — why the disposition surface is 1,018 files and not 526

**The diff is not the surface.** 526 files are in slice 06's diff; **492 more under the same pathspec
are in the dropped-finding class** — byte-identical across the layout move, so slice 01a renders them
as rename lines and no later slice's diff contains them. Reviewed by nobody, if review is organised by
slice diff.

The two sets partition the tree exactly, asserted with `comm`: 467 in-diff-and-present + 492 dropped +
1 (`apiRouteAdapter.ts`, moved into the diff by this plan's own fix) = 960 tracked, with **zero files
in neither set and zero in both**.

**Working that half is what found two of this plan's nine fixes**, including the one no content grep
could ever have reached — a defect in a *filename*. Six previously-invisible files are now in a
reviewer's diff, and they are there because they were defective.

## For the next plans

- **151-15** (slices 07 + 08) — **PR 6 opens there**, and slice 06's body owes the reviewer an explicit
  statement that the diff exceeds **both** render budgets (533 files, 31,059 lines) plus the guided
  path through it. **F-61 is a live reactivity defect in your files**; F-62 is the same shape without
  the failure mode, recorded separately so they are not conflated. Two F-57 fixes already ride slice
  07's diff. Run F-44's three patterns over your own slices — they returned 0/0/0 here, but the gate
  will not run them for you.
- **151-16** (slices 09 + 10) — slice 09 carries **F-64**, a 117-file / 272-occurrence stale-permalink
  class needing a generator change; slice 10 carries F-59's eslint-config fix in its diff.
- **151-18** — **F-24 needs an operator decision**, alongside F-21, F-29, F-30 and F-36's locality
  half. F-60 (duplication) and F-63 (blocked by a published slice) are yours. The Supabase Adapter
  block is **closed** — do not re-derive it.
