---
phase: 151-ship-v0-2-akita-review-stack
plan: 13
subsystem: e2e-test-suite
tags: [review-stack, e2e, playwright, checklist-disposition, comment-hygiene, accessibility-reach, criterion-4-3]
requires:
  - "151-12: slice 04 cut at 7640f7bcb, PRs #863-#866 open"
  - "151-08: the KEEP verdict on test titles (criterion 3 exception)"
  - "151-04: the re-measured assertAxeScan reach (7 route entries x 2 themes)"
  - "151-06: the disposition scaffold, cells_expected 163"
provides:
  - "slice 05 branch ship/v0.2-akita-05-e2e-tests at 545cc26c8 (195 files, +23325/-778), unpushed"
  - "criterion 4.3 satisfied structurally, evidence SHA 545cc26c8"
  - "PR #867 open (slice 04 -> ship/v0.2-akita-03-supabase)"
  - "151-DISPOSITION.md slice-05 section, 12 terminal cells, cells_filled 84/163"
  - "pr-bodies/04.md"
  - "F-42..F-50 (9 findings; 5 fixed, 4 deferred with routing)"
affects:
  - "151-14 (slice 06 sweep; F-42's class exists in apps/frontend, F-44's three patterns to re-run, PR 6 opens there)"
  - "151-16 (slice 09 cut carries F-47's docs fix; mock-data-generation page routed here)"
  - "151-18 (D-24 full-suite run discharges 43 did-not-run specs; criterion 4.3 already closed)"
  - "151-19 (F-44 gate-design routing)"
tech-stack:
  added: []
  patterns:
    - "old/new diff-pair damage detection: derive codemod breakage from the commit's own line pairs, not from a tree grep (672 candidates vs 43 real)"
    - "hold an operator-approved gate's FULL row set, not only its named rows — including the occ column, not only the gated bare column"
key-files:
  created:
    - .planning/phases/151-ship-v0-2-akita-review-stack/pr-bodies/04.md
    - .planning/phases/151-ship-v0-2-akita-review-stack/151-13-SUMMARY.md
  modified:
    - .planning/phases/151-ship-v0-2-akita-review-stack/151-DISPOSITION.md
    - .planning/phases/151-ship-v0-2-akita-review-stack/151-STACK-MANIFEST.md
    - tests/playwright.config.ts
    - tests/README.md
    - tests/tests/utils/testIds.ts
    - tests/tests/specs/voter/eperm07-term-trigger.spec.ts
    - "apps/docs/src/routes/(content)/developers-guide/development/testing/+page.md"
decisions:
  - "Item 13 verdict is MET-with-complement rather than n/a: slice 04 had no a11y gate, slice 05 IS the a11y gate, so the item has a real surface (the gate's adequacy)."
  - "Item 14 is DEFERRED, not MET: the keyboard half has no gate at all — uncovered on the 5 scanned routes as much as on the other 31."
  - "F-44's gate blind spots are recorded, not patched: widening a pattern mid-stack would move operator-approved counts (the F-39 failure mode). Routed to 151-19."
  - "The 23 `plan NN` references are left in place while the 12 bare `NNN-NN` are fixed: the former parses as a reference, the latter names nothing."
  - "F-48's three false rigidity contracts are made TRUE rather than enforced: playwright.config.ts reserves widening SOFT_ASSERTION_BUDGETS for a deliberate decision."
  - "PR-title format stabilised at 'N/12 <subject verbatim>' for 151-14 onward; the three open PRs predating it are NOT retitled."
metrics:
  duration_min: 96
  completed: 2026-08-17
  tasks: 3
  commits: 8
  slice_files: 195
  slice_insertions: 23325
  slice_deletions: 778
  cells_filled_delta: 12
  findings_raised: 9
  findings_fixed: 5
  findings_deferred: 4
actuals:
  tokens: 41000
  tasks: 3
  commits: 8
status: complete
---

# Phase 151 Plan 13: Sweep and cut the E2E test slice Summary

Swept the whole 195-file root `tests/` tree against the 16 general checklist items, fixed 52 defects
in 6 commits, cut slice 05 as the single `test:` commit criterion 4.3 requires, and opened PR #867.

## What was built

**Slice 05** — `ship/v0.2-akita-05-e2e-tests` at **`545cc26c8`**, 195 files, +23,325 / −778, parented
on slice 04. Local and unpushed; PR 6 opens at 151-14 per D-07.

**Criterion 4.3 is satisfied structurally**, with `545cc26c8` recorded in the manifest frontmatter as
its evidence. `git log --oneline 04..05 | wc -l` → **1**. Slice 05's pathspec in `slices.tsv` is the
single token `tests`, so "one slice", "one commit" and "all tests" are the same set by construction
rather than by a squash that happened to gather them — and there is no second `test:`-typed commit
anywhere in the stack to collapse.

**PR [#867](https://github.com/OpenVAA/voting-advice-application/pull/867)** — slice 04 →
`ship/v0.2-akita-03-supabase`. GitHub independently confirms the body's central numbers:
`changedFiles: 162, additions: 19661, deletions: 0`.

**12 terminal disposition cells** for slice 05 — `cells_filled` 72 → **84** of 163. MET on items 2, 4,
5, 6, 10 and 13; FIXED on 3, 7 and 15; `n/a` on 8 and 9; DEFERRED on 14.

## The sweep's substantive results

**Item 4 is the cleanest result in the stack, and it breaks a three-slice pattern.** `any` appears in
type position **0 times across all 195 files** — so there is no `eslint-disable no-explicit-any`
anywhere in the slice, and F-12 / F-25 / F-41 (undocumented `any` suppressions in slices 02, 03, 04)
does not continue here. Recorded with its complement: the rule is set to `warn` for `tests/`, so the
zero is evidence from the count, not from the gate.

**Items 13 and 14 are D-18's central case and are answered with the complement named.** The a11y gate
lives in this slice, is default-on, and asserts against all four WCAG tags. Its reach, re-measured:
**7 route entries → 5 distinct URLs → 14 emitted tests × 2 themes** (entries 5–7 are three DOM states
of `/results`, which is why "7 routes" overstates route coverage by 2). Its complement is the larger
half: **31 of the 36 `+page.svelte` route surfaces are never scanned** — all 18 candidate-app routes,
all 5 admin routes, and 8 voter routes including `questions/[questionId]`, the surface a voter spends
most of the journey on. Item 14 is **DEFERRED** rather than MET because the screen-reader half inherits
exactly the axe gate's reach (one call site, inside `assertAxeScan`) and **the keyboard half has no
gate at all** — axe is a static-DOM auditor, so keyboard is uncovered on the 5 scanned routes as much
as on the other 31. The remedy is stated so a later phase need not re-derive it.

**Item 2 comes out MET on a slice that commits a private key, and the reason is that the acceptance is
done properly.** `mock-oidc-key.pem` is a 2048-bit RSA key, `CN=127.0.0.1`, un-ignored by an explicit
two-line `.gitignore` exception with a four-line rationale naming threat T-122-09; `testKeys.ts` does
the same for its inline JWKs under T-122-01 and states the failure mode outright. The
secret-shaped-literal scan returns **0** across all 195 files — cleaner than slice 04, which carries
two demo-key literals. `ignoreHTTPSErrors` appears once, on the opt-in `bank-auth-journey` project
only, never on the top-level `use`. And `tests/.gitignore` — one of three files invisible to this
slice's diff — turns out to be load-bearing: its `playwright*/` rule is what keeps the visual chain's
`storageState` out of git, and `git ls-files` confirms **0** tracked files under `playwright/`,
`.auth` or `blob-report`.

## Deviations from Plan

### Auto-fixed issues

**1. [Rule 1 — Bug] F-42: the hygiene codemod broke 38 comments in `tests/` and stage 2 fixed 13 of 43**

- **Found during:** Task 1, sweeping item 3.
- **Issue:** `0c538024c` deleted each planning reference without repairing the sentence. Three classes:
  12 empty code spans (`` * the bug. Negative control: ` `. ``); **2 corrupted code identifiers**,
  because `hygiene-codemod.mjs:524`'s empty-enclosure cleanup fires on **any** `()` on a line that
  carried a reference edit — `submitElection()` → `submitElection `, `not.toBeVisible()` →
  `not.toBeVisible`; and 24 broken sentences (`video→, questionInfo→` destroying a four-way probe→perm
  mapping; `see phase 130 04 riders`; `is 's "persists across reload"`; `the ONLY available mechanism
  for.`).
- **One of the 38 was load-bearing**, which is why this is a bug and not tidying: `playwright.config.ts:56`
  is the sentence recording a knowingly-deferred guard-scope decision, and the codemod had rendered it
  `* Scoped deliberately to a single file: 's scope is …`. The record of a deliberate deferral, made
  unreadable — and it is the record F-48 below depends on.
- **Fix:** each rewritten to state the fact without reintroducing a reference.
- **Commit:** `822108b0f`

**2. [Rule 1 — Bug] F-43: 14 comments cite a plan by a number that resolves to nothing**

- **Found during:** Task 1, sweeping item 3.
- **Issue:** bare `122-04`, `122-05`, `119-08` ×2, `129-06`, `120-01`, `120-05`, `128-02`, `122-02` ×2,
  `(129)` in 6 files, plus 2 references split across a line break. None resolves for a reader outside
  the planning directory, and none is reachable by the hygiene gate.
- **Commit:** `54ec7fed9`

**3. [Rule 2 — Missing documentation] F-45 + F-46: `tests/README.md` presented two incomplete
inventories as complete**

- **Issue:** the "Project inventory" omits the `_probes` project entirely, while `test:e2e` appends
  `--grep-invert @probe` — so **5 of the suite's 43 specs, 12%, never ran in what the README called the
  "full suite"**, and `test:e2e:probes` was undocumented. Separately the shared-fixture list named **4
  of 10** files with no ellipsis, while the adjacent voter list has one; same class as F-34.
- **Commit:** `76b0735a7`

**4. [Rule 1 — Bug] F-47: the Developers' Guide made six false claims about this slice**

- **Issue:** each verified false rather than argued — the dataset imported *"via Admin Tools API"* (it
  is `bulk_import` with a service-role client; Admin Tools was the Strapi plugin slice 01b deletes);
  `auth-setup` as step 2 of the default chain (declared **only** under `PLAYWRIGHT_VISUAL`); *"Run with
  the pre-authenticated browser state"* (the default run is unauthenticated); *"created automatically on
  Strapi bootstrap (via `ensureDevData`)"* (**0** code references); `DEV_CANDIDATE_EMAIL` /
  `DEV_CANDIDATE_PASSWORD` (**0** code references); and `yarn dev:down` (**no such script** —
  a documented command that cannot be run). The page also omitted the served-application preflight and
  the `@probe` exclusion, the two facts an operator most needs.
- **Cross-slice landing:** the file is `apps/docs/**` = slice **09**, cut by 151-16. Same shape as F-40.
- **Commit:** `4e0cf5580`

**5. [Rule 1 — Bug] F-48: three files declare a rigidity contract they violate**

- **Issue:** `candidate-journey.spec.ts` states *"0 expect.soft"* and carries 3;
  `candidateHomePage.fixture.ts` and `candidateProfilePage.fixture.ts` state *"NO `expect.soft`"* and
  carry 4 and 6. This is item 1's real shape in this slice: not a spec asserting less than its title,
  but a file describing its own rigour falsely, in the one slice whose credibility every other slice
  borrows.
- **Fix:** each header made **true** — the count, where the calls are, why soft is right there, and that
  the file sits outside `SOFT_ASSERTION_BUDGETS`. **The guard table was deliberately not widened**:
  `playwright.config.ts:56-58` reserves that, and names these exact three files as a recorded follow-up.
- **Commit:** `3cad264bd`

### Deferred, each with its reason and its route

- **F-44 — the hygiene gate reports `plan-number occ = 0 OK` over a tree with 35 plan references in
  `tests/` alone.** Three blind spots, each a property of the pattern rather than of the tree: the
  `plan-number` regex needs the literal word *plan* **and** a two-part number; the `phase-ref` regex
  needs keyword and digits on the **same line**; and `\b[A-Z]{3,}-\d{2}\b` misses `EFLOW-10b` on the
  trailing boundary. **Not patched** — widening a pattern mid-stack moves operator-approved counts,
  which is the F-39 failure mode. Routed to **151-19**; **151-14/15/16 must run the three patterns over
  their own slices**, because the gate will not.
- **F-49 — `tests/` contributes 2 of the 20 `lint:check` warnings, one a decorative `eslint-disable`**
  for a rule that reports nothing (`mockOidcIssuerEntry.ts:33`) — a fourth member of the F-12/25/41
  family. Fixing either takes the repository from 20 warnings to 19 or 18, moving the number eight later
  plans compare "unchanged" against. Remedy recorded for the plan that re-baselines.
- **F-50 — CI sets `retries: 3`,** which can green a flake. Accepted because the project already built
  the remedy and it is in this slice: `determinism-batch.sh` **refuses to start** with `CI` set for
  exactly this reason and fails a batch outright when `flaky != 0`; four projects pin `retries: 0` where
  a retry would mask a state-mutating assertion. 151-18's D-24 run is local and non-CI at `retries: 0`.
- **Item 14's keyboard gate** — net-new test authorship, which D-13 excludes; widening the axe route
  table is Phase 147's declared scope, and Phase 147 has not executed.

### One near-miss worth recording, because it will catch the next plan

An intermediate version of the `eperm07-term-trigger.spec.ts` fix rewrote a line-broken `(Phase / 138
review WR-01)` into the D-14-authorised `see phase 138` form — **across the same line break**, so the
continuation line read `* phase 138). …`, which the gate's `(?<!see\s)\bphases?\s+\d+` correctly counts
as **bare**. `phase-ref bare` went 11 → 12 and criterion 3's operator-approved state moved. **The
authorised collapsed form is only authorised when it survives on one line.** The fix was reworked to
drop the citation entirely, returning every gate column to its pre-plan value — the `occ` column too,
not only the gated `bare` column, because an operator approved a report with 660 in it.

## Verification

### Gates — every one matched to the baseline

| Gate | Baseline | Measured | Verdict |
|---|---|---|---|
| `yarn build` | 14/14 | **14/14** | unchanged |
| `yarn test:unit` | 1522 / 149 files | **1522 / 149** | unchanged |
| `yarn lint:check` (`TURBO_FORCE=1`) | 0 errors / 20 warnings | **0 / 20** (core 2, dev-seed 15, frontend 1, tests 2) | unchanged |
| `yarn format:check` | RED on exactly 2 PD-03-fenced files | **RED on exactly 2** | unchanged |
| `hygiene-grep-report.sh --assert-clean` | exit 1, `task-id` 84 / `phase-ref` bare 11 | **exit 1, every column identical** | unchanged |
| `yarn typecheck:tests` | not in baseline | **clean** | new datum |
| `npx playwright test --list` | not in baseline | **143 tests in 94 files**, all 3 config-load guards active | new datum |

`tests/README.md` was edited and stays in the `format:check` red set — it was already in it, and the
set's *cardinality* is what PD-03 fences. **`yarn format` was not run.** `yarn db:lint:sql` was
deliberately not run: it exits 1 on a correct tree pending F-21 and nothing here touches SQL.

### The partition safety check — gap 0, identity MATCH

252 + 97 + 119 + 162 + 195 + 3458 = **4283** = comparable total (`diff --no-renames C1..TARGET`).
**Gap: 0.** The rise from 151-12's 4281 is **+2, both named** — `151-12-SUMMARY.md` and
`pr-bodies/03.md`, `.planning/` files riding slice 11 — established by **set difference**, with **zero
files leaving**. Predicted remainder 3651 − 195 + 2 = **3458**, the measured value; deviation
**0.000%**. Partial-stack identity: the six cut slices plus the catch-all produce tree **`8459312c9`**
= `TARGET^{tree}`. **MATCH.** A second, independent decomposition falls out for free: slice 11's own
pathspec measures 2314, and 3458 − 2314 = **1144** = the dry run's slices 06–10 summed exactly.

**The dry run's `+23,297` prediction for this slice is reproduced EXACTLY** at the pre-hygiene tip. It
then moved −4 (the codemod), −1 (stage 2) and +33 (this plan's `+98 / −65`), each measured rather than
netted. The file count never left 195 and `−lines` never left 778. Both ends of the file arithmetic
close in both directions: `origin/main`'s 14 = 7 D + 4 M + 3 unchanged; `HEAD`'s 191 = 184 A + 4 M + 3
unchanged.

### Publishing invariants — asserted, not assumed

`git ls-remote --heads origin 'ship/*'` → exactly **5**. `origin/main` unmoved at `ac30f132a`. PR
**#860 untouched** (`updatedAt` still `2026-05-19T12:08:25Z`). `gh pr list --head
ship/v0.2-akita-05-e2e-tests` → **0**, so D-07's one-slice lag held. `gh pr checks 867` → *"no checks
reported"*. The push was dry-run first and reported `[new branch]`; **no force-push anywhere**, no
`git clean`, no `git stash`, worktree clean throughout, `HEAD` never left `feat-gsd-roadmap`.

### What was NOT verified — stated, because the alternative is a claim

**The 43 E2E specs were not run.** No dev server on `:5173`, no seeded local Supabase; D-24's
full-suite run at 151-18 is where that cost is paid once, against the post-sweep tip. **Per `CLAUDE.md`
a did-not-run E2E test counts as a failure, so this plan records 43 did-not-run specs rather than a
green suite.** Every disposition verdict is static — source read, call sites counted, config loaded.
The strongest executable evidence obtained is `playwright test --list`, which has a real failure mode
(a dropped spec, an orphaned probe, a drifted soft-assertion budget) and passed. It is not a suite pass.

**No assertion was changed, so this plan's two-sided negative-control requirement has no subject.** All
25 `tests/` edits are comment- or documentation-only; no `expect`, `test`, `describe`, `use` or
`dependencies` expression differs. Recorded as **not triggered**, not as satisfied — a negative control
with nothing to control for would be theatre.

**Nothing was skipped and no baseline was regenerated.** `test.skip` / `test.fixme` / `test.only` and
bare `skip(` / `fixme(` all return **0** across the 43-spec suite, before and after. `git diff
--name-only` over this plan's commits matches `-snapshots` and `__screenshots__` **0** times each.

**No test title was rewritten** — plan 151-08's KEEP verdict, confirmed on real slice content: all 34
`task-id`-shaped tokens in `tests/` sit in a `describe`/`test`/`test.step` title, a positive-control
message, a functional string, or a runbook heading. **Zero are in comments**, so there was nothing in
that class to fix and nothing to undo.

## Method note — how the 38 damage sites were found, and why a grep would not have done it

The sites were derived from the codemod commit's **own old/new line pairs**, flagging where a damage
signature appears in the new line and not the old. A tree grep for the same signatures returns **672
candidates**, overwhelmingly legitimate `...` spread syntax and ordinary possessives. The pair method
returned **43**, of which 30 survived stage 2 verbatim; a wider signature pass over the same pairs found
8 more and 3 adjudicated false positives (banner dashes, complete sentences).

The same discipline caught a measurement artefact that would otherwise have become a false finding:
`voter-dark-mode.spec.ts` contains exactly **one** `expect(` token under a title making three claims —
which reads as a spec asserting a third of what it says, until you read it and find all three
assertions inside `theme.expectTheme`, a web-first `expect.poll` in the fixture, with the docblock
explaining that `expect` is deliberately not imported at the spec site.

## Commits

| Commit | Subject |
|---|---|
| `822108b0f` | `fix(151-13): repair the 38 comments the hygiene codemod left broken in tests/` |
| `54ec7fed9` | `docs(151-13): remove the 14 bare plan identifiers left in tests/ comments` |
| `76b0735a7` | `docs(151-13): document the isolation-probe project and complete the shared-fixture inventory` |
| `4e0cf5580` | `docs(151-13): correct six false claims about the E2E suite in the Developers' Guide` |
| `3cad264bd` | `docs(151-13): correct three rigidity contracts that claimed zero soft assertions` |
| `c0c47513f` | `docs(151-13): disposition slice 05 — the E2E suite, 12 cells with the scan complements named` |
| `9180b8a0b` | `docs(151-13): record slice 05's cut, criterion 4.3, and PR #867` |

Plus the slice commit itself, `545cc26c8`, on `ship/v0.2-akita-05-e2e-tests`.

## For the next plans

- **151-14** (slice 06) — F-42's class exists in `apps/frontend/src/lib` (`dataContext.svelte.ts:24`,
  `persistedState.svelte.ts:83`, `voterContext.svelte.ts:622` all carry the eaten-`()` form); use the
  old/new pair method, not a tree grep. Run F-44's three patterns over your slice. **PR 6 opens there.**
  Use the title form `N/12 <slices.tsv column 3 verbatim>`.
- **151-16** (slice 09) — carries F-47's docs fix in its diff. `backend/mock-data-generation/+page.md`'s
  `ensureDevData` / `DEV_CANDIDATE_*` claims join F-04, F-33 and the `GENERATE_MOCK_DATA_ON_RESTART`
  class as a whole-page decision.
- **151-18** — criterion 4.3 is **already closed** with SHA evidence; do not re-derive it. The taxonomy
  gate's `test` cardinality clause now reads `1 == 1`. D-24's run discharges 43 did-not-run specs.
- **151-19** — F-44's gate blind spots.

## Self-Check: PASSED

Files asserted present: `pr-bodies/04.md`, `151-DISPOSITION.md`, `151-STACK-MANIFEST.md`,
`151-13-SUMMARY.md` — all FOUND. Commits asserted reachable: `822108b0f`, `54ec7fed9`, `76b0735a7`,
`4e0cf5580`, `3cad264bd`, `c0c47513f`, `9180b8a0b`, `545cc26c8` — all FOUND. Branch
`ship/v0.2-akita-05-e2e-tests` exists at `545cc26c8` with `545cc26c8^ == 7640f7bcb`. PR #867 OPEN with
base `ship/v0.2-akita-03-supabase`.
