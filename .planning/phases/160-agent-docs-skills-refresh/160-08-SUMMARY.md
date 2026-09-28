---
phase: 160-agent-docs-skills-refresh
plan: 08
subsystem: docs
tags: [skills, boundaries, ownership-map, reflexive-recheck, listings, e2e-gate, playwright]

requires:
  - phase: 160-agent-docs-skills-refresh
    provides: "Plan 07's executed deletion — `.claude/skills/architect/` gone, the spike-findings skill surviving `delete-sources-only` — which is the skill set this ownership map is re-homed onto"
  - phase: 160-agent-docs-skills-refresh
    provides: "Plan 03's four `## Verification After Extension` re-check items — the rule this plan applies reflexively to the phase that wrote it"
  - phase: 160-agent-docs-skills-refresh
    provides: "Plan 06's rewritten `CLAUDE.md § Architecture` and `§ Skill Routing` — where the deleted architecture skill's ownership was re-homed, and therefore where this map's orphaned rows now point"
  - phase: 160-agent-docs-skills-refresh
    provides: "Plan 05's rewritten `components` skill and `context-reactivity.md` — the content that makes the map's component rows describable in runes-era terms and lets the `(deferred)` markers come off"
  - phase: 160-agent-docs-skills-refresh
    provides: "Plan 01's `.claude/scripts/audit-skill-links.sh` and its 350-of-678 corpus baseline, which this plan's dangling set is measured against"
  - phase: 159-component-and-context-consolidation
    provides: "the post-consolidation tree every directory path in the ownership map was re-derived against"
provides:
  - "A `.claude/skills/BOUNDARIES.md` in which every owner names a skill that exists and every directory it names exists — 13 of 85 lines corrected across three defect classes"
  - "A consolidated per-listing re-check record spanning every file this phase changed: 52 listings, 42 checked-and-correct, 6 corrected, 4 out-of-scope with their todos named"
  - "Six stale listings found and corrected that no guard could have caught — two of them line anchors pointing past the end of the file this phase itself trimmed"
  - "A dated `§ Last verified` block in `.claude/skills/README.md` naming the commit and the five gates green at it"
  - "A full Playwright run at this plan's own HEAD: 155 passed, 0 failed, 0 skipped, 0 flaky, 0 did-not-run, preflight confirmed against this checkout"

affects: [160-09]

actuals:
  tokens: 9169 # chars/4 over the realized diff, git diff 2e8e8e1e1..HEAD
  tasks: 3
  commits: 3
plan_head_before: 2e8e8e1e1ff681c87127317c7acca9ab2ceea54c

tech-stack:
  added: []
  patterns:
    - "Ownership that belongs to no skill is re-homed with a `(none - CLAUDE.md)` marker following the file's own `(none - legacy)` convention — never blanked, because the ownership is real even when the owner is not a skill."
    - "A removed row is explained in prose next to the table it left, so a reader cannot mistake a deliberate deletion for a forgotten one."
    - "A removal note must not name the dead path it removes: naming it re-creates the dangling citation the removal existed to clear."
    - "Reflexive listing re-check: the evidence is the per-listing disposition and the diff, never a drift-guard exit code, because a phase's own commits reset that guard's baselines."
    - "Anchored figures survive drift; unanchored ones do not. Every figure in this corpus that named its measuring commit was still correct; every one that did not had to be re-derived."

key-files:
  created: []
  modified:
    - .claude/skills/BOUNDARIES.md
    - .claude/skills/README.md
    - .claude/skills/components/SKILL.md
    - .claude/skills/data/object-model.md
    - .claude/scripts/audit-skill-links.sh

key-decisions:
  - "The eight rows naming the deleted `architect` skill were re-homed with a `(none - CLAUDE.md)` owner marker rather than blanked or assigned to a surviving skill. The ownership is real — monorepo structure, frontend routing, the adapter pattern, settings architecture — and Plan 06 folded exactly that content into `CLAUDE.md § Architecture`. The marker copies the file's own `(none - legacy)` shape, so the table's grammar is unchanged."
  - "The removal note for the retired Strapi backend does NOT name `backend/vaa-strapi/`. Naming it in prose would have re-introduced the very dangling citation the row's removal cleared, and the task's own acceptance criterion (`grep -ci 'vaa-strapi'` must return 0) encodes that. The note names the subsystem in words instead."
  - "A new `apps/frontend/src/lib/contexts/` row was ADDED to the directory table, owned by `components`. Not in the plan's three defect classes, but required by it: the concept row `Frontend routing and contexts` had to be split when its owner was deleted, and after Plan 05 the reactivity rules are `components` content while the routing architecture is `CLAUDE.md` content. Leaving the directory unowned would have re-created the gap the split was resolving."
  - "The full Playwright suite was RUN rather than justified away, even though the phase's only non-documentation change is under `apps/docs` and the suite does not exercise that app. Task 3's own `read_first` makes the reason explicit: the E2E hard rule and the preflight contract are two of the four things this phase promised to keep in `CLAUDE.md`, so running the gate is also a check that what the file says about the harness is still true."
  - "The drift guard was run and its OUTPUT TEXT recorded, with its exit code explicitly disclaimed. It reports five of six checked skills `OK (synced as of 2026-09-13)` — a green produced by this phase's own commits resetting their baselines, which is precisely the prohibition's point."

patterns-established:
  - "Per-class row accounting on a table edit: report the count in each defect class AND the union, because overlapping classes double-count (line 15 is both an orphaned-owner row and a moved-path row, which is how an earlier count reached 14 instead of 13)."
  - "When a record's figure is superseded, add a row measured at the new commit rather than overwriting the old one, and itemise the difference per file — so a reader can tell 'the corpus changed as the phase said' from 'the corpus has drifted'."

requirements-completed: [REVIEW-DOC-02, REVIEW-DOC-03]

coverage:
  - id: D1
    description: "Every owner named in `.claude/skills/BOUNDARIES.md` is a skill directory that exists, and every directory path it names exists"
    requirement: REVIEW-DOC-03
    verification:
      - kind: other
        ref: "owner-column extraction over all three tables -> tokens {components, data, database, filters, matching, ship-review-stack}, each `test -d .claude/skills/<token>` OK; backticked-directory loop prints nothing"
        status: pass
      - kind: other
        ref: "bash .claude/scripts/audit-skill-links.sh .claude/skills/BOUNDARIES.md -> Checked: 14  Dangling: 0, exit 0 (from 5 of 13)"
        status: pass
    human_judgment: false
  - id: D2
    description: "The retired backend's row is removed with its reason stated, the Svelte 4 row is rewritten to the runes-era conventions, and every `(deferred)` marker is resolved"
    requirement: REVIEW-DOC-03
    verification:
      - kind: other
        ref: "grep -ci 'vaa-strapi' -> 0; grep -c 'Svelte 4' -> 0; grep -c '(deferred)' -> 0; the file contains a named removal paragraph after the first table"
        status: pass
    human_judgment: false
  - id: D3
    description: "Every listing in every file this phase changed carries a recorded per-listing disposition, with the one deliberate omission naming its filed todo"
    requirement: REVIEW-DOC-02
    verification:
      - kind: other
        ref: "the 52-row consolidated record below; 42 checked, 6 corrected, 4 out of scope; the out-of-scope schema citations cite .planning/todos/pending/2026-08-28-dangling-schema-citations-database-skill.md"
        status: pass
      - kind: other
        ref: "each 'corrected' row appears in `git diff --name-only 2e8e8e1e1..HEAD` (5 files), and no file in files_modified is absent from the record"
        status: pass
    human_judgment: true
    rationale: "Whether the enumeration of listings is COMPLETE — whether some listing in a changed file was overlooked rather than dispositioned — is a reading judgement no command can settle. The mechanical half is Plan 09's routing auditor; this half is a human read of the record against the files."
  - id: D4
    description: "The corpus dangling set after this plan contains no token this phase introduced, measured against the recorded baseline"
    requirement: REVIEW-DOC-02
    verification:
      - kind: other
        ref: "bash .claude/scripts/audit-skill-links.sh -> Checked: 631  Dangling: 207 (from Plan 01's 350 of 678); token-level diff of the dangling set against the pre-change set is EMPTY"
        status: pass
    human_judgment: false
  - id: D5
    description: "The repository's documentation, lint and end-to-end gates are green, with the preflight confirmed to have resolved this working tree"
    verification:
      - kind: other
        ref: "yarn workspace @openvaa/docs validate:links -> exit 0 (198 files, 172 links, 0 broken)"
        status: pass
      - kind: other
        ref: "yarn lint:check -> exit 0, read from $? on the command itself"
        status: pass
      - kind: e2e
        ref: "tests/scripts/e2e-run.sh --run-dir tests/e2e-runs/160-08-phase-gate --no-db-reset -> 155 passed / 0 unexpected / 0 skipped / 0 flaky / 0 did-not-run; playwright exit 0; wrapper exit 0; preflight-failures 0, preflight-successes 1"
        status: pass
    human_judgment: false
  - id: D6
    description: "`.claude/skills/README.md` carries a dated verification block naming the commit and the gates green at it"
    verification:
      - kind: other
        ref: "grep -cE '20[0-9]{2}-[0-9]{2}-[0-9]{2}' .claude/skills/README.md -> 8 (>= 2); § Last verified names commit f8e7b4b07 and tabulates five gates"
        status: pass
    human_judgment: false

duration: 31 min
completed: 2026-09-13
status: complete
---

# Phase 160 Plan 08: Ownership Map, Reflexive Re-check and the Phase Gate Summary

**The ownership map re-homed onto the seven skills that actually exist and the post-159 tree (13 of 85 lines, three defect classes), the phase's own re-check rule applied to the phase's own edits across 52 listings — which found six stale ones including two line anchors pointing past the end of the file this phase itself trimmed — and the gate closed with 155/0/0/0/0 on a preflight-confirmed Playwright run.**

## Performance

- **Duration:** 31 min
- **Started:** 2026-09-13T20:42:48Z
- **Completed:** 2026-09-13T21:13:30Z
- **Tasks:** 3
- **Files modified:** 5

## Task Commits

1. **Task 1: Re-home the ownership map** — `e8f3f5689` (docs)
2. **Task 2: Apply the re-check rule reflexively** — `f8e7b4b07` (docs)
3. **Task 3: Close the phase against the repository's gates** — `1c086d423` (docs)

`commits: 3` is MEASURED, not narrated: `git rev-list --count 2e8e8e1e1ff681c87127317c7acca9ab2ceea54c..HEAD` at SUMMARY-write time, from a ledger written before the first commit.

## Task 1 — the ownership map, per class

Every count below was **re-derived from the pre-edit file at execution time**, not carried from a planning document.

| Class | Rows | Lines (pre-edit) | What was done |
| --- | ---: | --- | --- |
| 1 — owner names a skill that no longer exists | **8** | `:15`, `:19`, `:57`, `:58`, `:59`, `:60`, `:81`, `:83` | Re-homed to `CLAUDE.md` with a `(none - CLAUDE.md)` owner marker, Notes naming the answering section. **Not blanked** — the ownership is real; Plan 06 put the content in `CLAUDE.md § Architecture`. |
| 2 — row names a directory that does not exist | **5** | `:15`–`:18` (`frontend/…`), `:21` (retired backend) | Four repointed under `apps/`; the fifth deleted together with its "see CLAUDE.md legacy note" reference, with a named removal paragraph after the table. |
| 3 — stale component conventions | **1** row + **5** markers | `:64`; `(deferred)` on `:15`–`:19` | The `Svelte 4 component conventions` row rewritten to the runes-era conventions, a context-reactivity row added, and every `(deferred)` marker removed. |
| **Union (distinct lines)** | **13 of 85** | `:15` is in classes 1 and 2 | |

**Where this differs from the planning-time figure.** `160-RESEARCH.md` and the plan's own `read_first` say **eight** architect rows and a total of **14**; `160-04-SUMMARY.md` says **13**. Re-derived here: the eight is right, and **13** is right — the 14 double-counts `:15`, which is simultaneously an orphaned-owner row and a moved-path row. Recorded because the plan asked specifically where the re-derivation differs.

**One addition beyond the three classes.** A new `apps/frontend/src/lib/contexts/` row, owned by `components`. The concept row `Frontend routing and contexts` had a single owner that no longer exists, and its two halves now have different homes — routing is `CLAUDE.md` content, context reactivity is `components` content after Plan 05. Splitting the concept row without giving the directory an owner would have left a gap where the map previously had none.

### Acceptance criteria — all six run and read

| Criterion | Result |
| --- | --- |
| Every owner token names an existing skill | **PASS** — `{components, data, database, filters, matching, ship-review-stack}`, each `test -d` OK. **Substitution recorded:** the criterion says "for each bare lowercase token"; applied per-CELL (a cell whose whole trimmed value matches `^[a-z][a-z0-9-]*$`), because word-splitting the gray-zones cell `the directory owner` would assert `test -d .claude/skills/the`. |
| Every backticked directory path exists | **PASS** — the loop prints nothing |
| `grep -ci 'vaa-strapi'` returns 0 and the removal is explained | **PASS** — 0, and the removal paragraph is present. Note this criterion **constrains the prose**: the explanation cannot name the path, or the count is 1 and a new dangling citation exists |
| `grep -c 'Svelte 4'` returns 0, row mentions runes and context reactivity | **PASS** — 0; two rows now carry `$props()`/`$state`/`$derived`/`{@render}` and the destructure trap + `dataRoot` carve-out |
| `grep -c '(deferred)'` returns 0 | **PASS** — 0. No marker survives, so nothing needs explaining |
| `audit-skill-links.sh BOUNDARIES.md` exits 0 | **PASS** — `Checked: 14  Dangling: 0`, exit 0, from `5 of 13` |

## Task 2 — the consolidated per-listing re-check record

This phase added a rule to four extension procedures: **after a change, re-check the skill, because skills contain listings.** This phase is a change to those skills. The record below is that rule applied to it. **52 listings — 42 checked and correct, 6 corrected, 4 out of scope.**

### Corrected (6) — every one is in this plan's diff

| # | File | Listing | What was wrong | Commit |
| ---: | --- | --- | --- | --- |
| 1 | `.claude/skills/BOUNDARIES.md` | all three tables | 13 of 85 lines — see Task 1 | `e8f3f5689` |
| 2 | `.claude/skills/components/SKILL.md` | convention 3, "66 files depend on `concatClass`" | The 66 is the whole of `apps/frontend/src`; the convention is scoped to the three component directories, where it is **60**. Both figures now stated with their scope. | `f8e7b4b07` |
| 3 | `.claude/skills/data/object-model.md` | party-list relationship bullet | Claimed `CandidateNomination.list` returns the parent `OrganizationNomination`. Source: `get list(): OrganizationNomination \| null`. Nullability added. | `f8e7b4b07` |
| 4 | `.claude/skills/README.md` | kept-list anchor `CLAUDE.md:392` | Points past the end of a **341-line** file after this phase's own trim. Re-derived to `:292`. | `f8e7b4b07` |
| 5 | `.claude/skills/README.md` | depth-chain hop 1, `CLAUDE.md:432` | Same class; prose-anchored to `e8052177c`, but an agent following it today lands in nothing. Re-derived to `:319`, with the historical value kept. | `f8e7b4b07` |
| 6 | `.claude/skills/README.md` | corpus table post-deletion row; `§ Adding a skill` stem count | The row was measured at the deletion plan's commit, not this one; the stem count still said "six of those" against the file's own corrected "four of seven". | `f8e7b4b07`, `1c086d423` |
| — | `.claude/scripts/audit-skill-links.sh` | header incident record | Said the five `BOUNDARIES.md` rows "were still live". They stopped being live one commit earlier. | `f8e7b4b07` |

**Two of these six are a class no guard can catch.** `CLAUDE.md:392` and `CLAUDE.md:432` are bare-filename tokens; the link guard's check 2 only applies a line-range test to a path containing a `/`, and its own header says a citation landing on the wrong lines "needed a human read". Both were produced by this phase trimming `CLAUDE.md` from 437 lines to 341 without re-deriving the anchors that pointed into it.

### Checked and correct (42) — re-derived, not carried

| File | Listing | Source it was checked against | Result |
| --- | --- | --- | --- |
| `data/object-model.md` | 21 `OBJECT_TYPE` values | `packages/data/src/core/objectTypes.ts` | 21 = 21, both directions, 0 asymmetry |
| `data/object-model.md` | 13 `DataRoot` collection getters | `packages/data/src/root/dataRoot.ts` | all 13 present as getters |
| `data/object-model.md` | 4 entity types | `…/entities/base/entityTypes.ts` | 4 = 4, both directions |
| `data/object-model.md` | 9 question types across 3 constants | `…/questions/base/questionTypes.ts` | all present |
| `data/object-model.md` | 3 question category types | `…/category/questionCategoryTypes.ts` | 3 = 3, both directions |
| `data/object-model.md` | 4 constituency-selection API citations (this phase's own addition) | `constituencyGroup.ts`, `dataRoot.ts`, `election.ts` | `impliedBy`, `getImpliedConstituency`, `getCombinedElections`, `getApplicableConstituency` all resolve |
| `data/object-model.md` | 4 factory functions | the four `variants.ts` / `parseFullVaaData.ts` | all 4 exported symbols present |
| `data/object-model.md` | 12 path citations | the tree | `Dangling: 0`, exit 0 |
| `data/extension-patterns.md` | new step 9 skill-file list (3 files) | `.claude/skills/data/` | all present |
| `data/extension-patterns.md` | the measured cost claim | see below | re-derives exactly |
| `database/extension-patterns.md` | new step 7 skill-file list (4 files) | `.claude/skills/database/` | all present |
| `database/extension-patterns.md` | the measured cost claim | see below | re-derives exactly |
| `database/extension-patterns.md` | `BUILT_IN_TEMPLATES` / `BUILT_IN_OVERRIDES` registry symbols | `packages/dev-seed/src/templates/index.ts` | both present |
| `database/extension-patterns.md` | "30 registered built-ins, backed by 40 `.ts` files" | the registry + `find` | **30** keys, **40** files |
| `database/extension-patterns.md` | "28 per-permutation E2E fixtures (`perm-*` plus `show-feedback-survey`)" | `…/templates/e2e/perm/` | 30 files, of which 27 `perm-*` + `show-feedback-survey` = **28** fixtures; `shared.ts` and `notLocated2e2cgShape.ts` are helpers |
| `database/extension-patterns.md` | 5 dev-seed paths + the README "Template shape reference" heading | the package | all present (heading at `README.md:241`) |
| `filters/extension-patterns.md` | 13 `createEntityFilters(page)` fixture symbols | `tests/tests/fixtures/voter/entityFilters.fixture.ts` | all 13 present |
| `filters/extension-patterns.md` | 3 cited spec/step titles | `tests/tests/specs/voter/voter-journey.spec.ts` | `full voter journey end-to-end` `:473`, the Party/pick-multiple step `:1228`, `EFLOW-01…` `:1301` |
| `filters/extension-patterns.md` | the `EntityFilters` UI path and its per-category children | `apps/frontend/src/lib/components/entityFilters/` | component + `enumerated`/`numeric`/`text` children present |
| `filters/extension-patterns.md` | verification item 4 — `FILTER_TYPE` / `FilterTypeMap` / type guards in sync | `filterTypes.ts` + `utils/typeGuards.ts` | 6 filter types, 0 missing from the guards |
| `filters/extension-patterns.md` | verification item 5 — the barrel chain | the three `index.ts` | chain intact |
| `filters/extension-patterns.md` | 24 path citations | the tree | `Dangling: 0` |
| `matching/extension-patterns.md` | new step 8 skill-file list (3 files) | `.claude/skills/matching/` | all present |
| `matching/extension-patterns.md` | the measured cost claim | see below | re-derives exactly |
| `components/SKILL.md` | the three library directories | the tree | all present |
| `components/SKILL.md` | convention 1 counts: `export let` 0, `$$Props` 0, `<slot` 0, `$props()` 103, co-located type files 103 | the three directories | **0 / 0 / 0 / 103 / 103** — exact |
| `components/SKILL.md` | the generated listing link and its total | `apps/docs/…/components/generated/+page.md` | listing footer **104**; an independent multiline scan with the generator's own regex finds **104** |
| `components/SKILL.md` | `targets:` — 3 directories | the tree | all 3 exist, so the drift guard checks rather than skips |
| `components/SKILL.md` | 6 cited scripts/config files | the tree | all present |
| `components/SKILL.md` | 17 path citations | the tree | `Dangling: 0` |
| `components/context-reactivity.md` | 26 reactive-accessor names | `apps/frontend/src/lib/contexts/**` | 26 = 26, none missing as a member |
| `components/context-reactivity.md` | 4 line-range anchors, **content-checked not just existence-checked** | the four cited files | `candidateContext.svelte.ts:44-45` contains "Destructure-trap contract"; `:131-134` contains "Root mechanism" + "tracking scope"; `results/[[electionTab]]/+layout.svelte:63-70` contains the `voterCtx` reads and the `dataRoot` warning; `elections/+page.svelte:40-41` contains `$derived.by` + `voterCtx.dataRoot.elections` |
| `components/context-reactivity.md` | 4 planning-document citations | `.planning/` | all 4 resolve |
| `README.md` | corpus table, 4 slices | anchored at `e8052177c` | anchored, so correct as stated |
| `README.md` | deletion-ledger reconciliation (`506,527 − 813 − 173,289 = 332,425`, +1,132) | arithmetic + the two grown files | exact; spike `SKILL.md` **30,574 B**, `references/` **85,594 B** both confirmed |
| `README.md` | the 59-non-Markdown caveat | `sources/` | **59 files / 186,701 B** — exact |
| `README.md` | discriminativeness "four of the seven" | the 7 live `SKILL.md` descriptions | **4 of 7** — exact |
| `README.md` | depth chain — `spike-findings/SKILL.md:149` § Feature Areas, "a table of 8 rows" | the file | heading at `:149`; **8** data rows |
| `README.md` | Judgement 4's `BOUNDARIES.md` damage: "13 of its 85 lines" with every line number | the pre-edit file | **13 of 85**, and all 14 cited line numbers match |
| `README.md` | the two filed todos | `.planning/todos/pending/` | both present |
| `README.md` | 5 other line-anchored citations (`audit-skill-drift.sh:79-81`, `.prettierignore:37`, `PRE-SHIP-REVIEW-TRIAGE.md:348`/`:362`, `v2.15-DISCUSSION-POINTS.md:1051`) | the files | all resolve and all contain what they claim |
| `CLAUDE.md` | 4 path aliases + the `$voter` dead-target annotation | `apps/frontend/svelte.config.js` | 4 declared = 4 listed; `$voter`'s target is absent and has **0** importers, exactly as annotated |
| `CLAUDE.md` | 11 key directories, 7 routing invocations, 3 Edge Function names, the Paraglide i18n claim | the tree | all resolve; 7/7 skills exist; `identity-callback`, `invite-candidate`, `send-email` all present |
| `spike-findings` SKILL.md + 4 `references/` | 10 citations repointed to `.planning/spikes/` by Plan 07 | `.planning/spikes/` | all 10 resolve |
| `apps/docs` generated component listing | 104 entries | the three component directories | 104 = 104 |

**The measured cost claim, re-derived (it appears in all four extension-pattern files).** `.claude/skills/database/schema-reference.md` still opens *"Complete column listing for all 17 tables … (18 SQL files)"*. Live: **25 SQL files declaring 20 tables**, and `feedback`, `feedback_rate_limits`, `admin_jobs` each appear **0** times in a listing that calls itself complete. The claim the phase wrote is exact.

### Out of scope (4), each with its reason

| File | Listing | Reason | Filed as |
| --- | --- | --- | --- |
| `database/extension-patterns.md` + the `database` skill's other files | 12 dangling `schema/1NN-*.sql` and `tests/database/*.test.sql` filename citations | Required by no requirement id here; the phase that renames the entity terminology churns the same files | **`.planning/todos/pending/2026-08-28-dangling-schema-citations-database-skill.md`** |
| `data/extension-patterns.md` | 16 package-relative path citations (`root/dataRoot.ts`, `objects/…`) | The corpus-wide package-relative habit Plan 01 recorded as the residue of its baseline, not a defect this phase introduced | Plan 01's recorded baseline |
| `matching/extension-patterns.md` | 7 package-relative path citations, 2 of which are maths expressions (`1/n`, `1/Math.sqrt(n)`) the guard reads as paths | Same class; the two maths tokens are guard false positives | Plan 01's recorded baseline |
| `spike-findings/sources/012-getroute-rune/page.svelte` | `.planning/spikes/012-getroute-rune/.continue-here.md` in a code comment | A preserved spike harness, not Markdown, so the guard never scans it. Plan 07's diff shows this phase **removed** one such citation and added none | no todo — a historical artifact of a deliberately preserved harness |

### The drift guard — output text recorded, exit code disclaimed

```
  components      OK    (synced as of 2026-09-13)
  data            OK    (synced as of 2026-09-13)
  database        OK    (synced as of 2026-09-13)
  filters         OK    (synced as of 2026-09-13)
  matching        OK    (synced as of 2026-09-13)
  ship-review-stack  DRIFT  1 commits, 1 files since 2026-08-29
    .claude/scripts  (1 commits, 1 files changed)
  spike-findings-voting-advice-application-gsd  SKIP  (no targets defined)

Checked: 6  Drifted: 1  Skipped: 1
```

Exit 1. **This is context, not evidence, and its exit code is not the evidence for any criterion in this plan.** Read the text: the five `OK` lines say "synced as of 2026-09-13" — the date of *this phase's own commits into those skills*. The guard baselines each skill on the last commit touching its directory, so a phase that edits a skill resets that skill to clean whether or not a single listing was re-checked. The workflow that runs it additionally carries `paths-ignore: "**.md"` on every trigger and does not trigger on this branch, so it does not fire on this phase at all. **The evidence for Task 2 is the 52-row record above and the diff it produced.** The one `DRIFT` is `ship-review-stack` against `.claude/scripts`, caused by Plan 01 adding a file to one of its declared targets; it belongs to Phase 153 by operator decision `O4` and is untouched here.

## Task 3 — the phase gate

### The link checker against Plan 01's baseline

| Measurement | Checked | Dangling | Skipped |
| --- | ---: | ---: | ---: |
| Plan 01's recorded baseline | 678 | **350** | 191 |
| Plan 07's close | 627 | 212 | 173 |
| After Task 1 | 628 | 207 | 173 |
| After Task 2 | 630 | 207 | 173 |
| **Final (this plan's HEAD)** | **631** | **207** | **179** |

**The subset proof, not just the falling number.** The dangling set is a strict subset of the inbound one: a token-level `comm -13` of the final set against the pre-change set is **empty** — zero tokens introduced. The fall from 212 to 207 is exactly the five `BOUNDARIES.md` rows Task 1 repaired, itemised and reproducible. `Checked:` rises because this plan wrote new citations, including the six in the verification record itself; that guard, unlike the README's byte counts, does not exclude the README.

Per-file at the close: `BOUNDARIES.md` `Dangling: 0` (from 5 of 13), `README.md` `Dangling: 0`, `CLAUDE.md` `Dangling: 0`, `components/SKILL.md` and `components/context-reactivity.md` `Dangling: 0`, `data/object-model.md` `Dangling: 0`, `filters/extension-patterns.md` `Dangling: 0`.

**Plan 01's own note stands and is repeated rather than papered over:** the 207 residue is the corpus's package-relative citation habit plus the filed schema citations — it is not "every remaining dangling token is a schema citation", which is how the plan's criterion is worded. Reported as a substitution, not as a pass on the criterion's literal wording.

### The repository gates

| Gate | Command | Result |
| --- | --- | --- |
| Docs links | `yarn workspace @openvaa/docs validate:links` | **exit 0** — 198 files scanned, 172 internal links, 0 fixed, **0 broken** |
| Lint chain | `yarn lint:check` | **exit 0**, read from `$?` on the command itself — never through a pipe |

`lint:check` carries Phase 152's scan and it is live and green: *"Comment hygiene guard (phase 152: REVIEW-HYG-01) — files scanned: 1663; vendored files excluded by name: 2; rules live: 2 of 2; **0 violation(s)**."* Every planning-document reference this phase wrote is in Markdown, which is the safe locus — and the scan is the proof of that rather than the assumption.

### The end-to-end gate — RUN, not justified away

**Decision and its basis.** The phase's only change outside `.claude/`, `.planning/` and `CLAUDE.md` is under `apps/docs`: `apps/docs/scripts/generate-navigation-config.ts`, `apps/docs/src/lib/navigation.config.ts`, and 105 generated Markdown files under `apps/docs/src/routes/(content)/developers-guide/`. Verified, not assumed: `git diff --name-only 051d016d3..HEAD` filtered of those three prefixes yields **108 paths, all under `apps/docs`** — nothing under `apps/frontend/src`, nothing under `packages/`, nothing under `tests/`. This plan's own diff is five files, all under `.claude/`. The Playwright suite drives `apps/frontend`; it does not exercise the docs app.

**It was run anyway, for a reason Task 3's own `read_first` names:** the E2E hard rule and the preflight contract are two of the four things this phase promised to keep in `CLAUDE.md`, so running the gate is simultaneously a check that what the file says about the harness is still true. Disk headroom was checked first per the task's `<precondition>` — **85 GiB free** — because a run that dies on a full disk produces did-not-run tests, which count as failures.

```
tests/scripts/e2e-run.sh --run-dir tests/e2e-runs/160-08-phase-gate --no-db-reset
```

| Metric | Verbatim |
| --- | --- |
| **passed** (`expected`) | **155** |
| **failed** (`unexpected`) | **0** |
| **skipped** | **0** |
| **flaky** | **0** |
| **did-not-run** | **0** — 155 of 155 reported, `errors: 0` |
| Playwright exit | **0** (`155 passed (10.5m)`) |
| Wrapper exit | **0** |
| `preflight-failures` / `preflight-successes` | **0 / 1** |
| retries / workers | **0 / 6** (`ci_env=unset`, the `EPERM07_` knobs unset) |
| HEAD at run | `f8e7b4b0701b78b37631c2755afc0d75fad5585f` |
| Window | `2026-09-13T20:56:07Z` → `2026-09-13T21:06:44Z` (627,600 ms) |

**Preflight confirmed rather than bypassed**, verbatim from the run's own stdout:

```
E2E PREFLIGHT OK /Users/kallejarvenpaa/Desktop/OpenVAA/voting-advice-application-gsd/apps/frontend (verified against /Users/kallejarvenpaa/Desktop/OpenVAA/voting-advice-application-gsd)
```

The served application resolved to **this** working tree, and the project-id half of the gate passed too — the wrapper spawned its own server on port 5273 with `PUBLIC_PROJECT_ID=00000000-0000-0000-0000-0000000000e2`, the project the suite seeds, after asserting the port had no listener. **Zero retries with `CI` unset** matters as much as the pass count: this is not a retried-to-green result. Full evidence directory: `tests/e2e-runs/160-08-phase-gate/` (`results.json`, `stdout.log`, `devserver.log`, `env-posture.txt`, `preflight-successes`, `head`, `exit`).

### The prohibition check — reported as a substitution, not as a pass

The criterion says `git diff --name-only` **across the whole phase** must list no `.planning/ROADMAP.md`, `.planning/STATE.md`, `.planning/REQUIREMENTS.md` and no `.github/workflows/` path. Run as written it **FAILS**: `ROADMAP.md` and `STATE.md` appear.

Attributed rather than left as a bare failure: every commit that touched them is an **orchestrator tracking commit** — `6f8deea47`, `e7d5f71ca`, `103b51d49`, `c548c0df3`, `bc88065db`, `4199953f8`, `2e8e8e1e1`, all subject `docs(phase-160): …`. **No plan commit touches any of the three.** The prohibition binds the plans (CONTEXT.md § 0.1(c) scopes it to *this phase does not edit* those files because another agent owns the concurrent correction); the criterion as written cannot separate a plan's edit from the orchestrator's central tracking write, which the orchestrator's own dispatch instruction mandates. Asserted in the form that matches the prohibition: `git diff --name-only 2e8e8e1e1..HEAD` lists exactly five paths, all under `.claude/`, and matches none of `(ROADMAP|STATE|REQUIREMENTS)\.md` or `^\.github/`. `REQUIREMENTS.md` and `.github/workflows/` are untouched by the whole phase, plans and orchestrator alike.

### The corpus record

`.claude/skills/README.md` gains a `§ Last verified` block naming commit `f8e7b4b07`, the date, and the five gates above as a table — with the drift guard's row carrying its disclaimer inline, so a reader of the record meets the caveat at the same time as the result. `grep -cE '20[0-9]{2}-[0-9]{2}-[0-9]{2}'` returns **8**.

The corpus figures were re-derived and the table given a new row rather than an overwrite: **25 files / 336,488 B**, against the deletion plan's 333,557 B. The 2,931 B difference is itemised per file in the record itself (`BOUNDARIES.md` +2,773, `object-model.md` +58, `components/SKILL.md` +100 — and 2,773 + 58 + 100 = 2,931 exactly). The file count does not move because nothing was created or deleted.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] The removal note could not name the path it removed**

- **Found during:** Task 1
- **Issue:** The plan asks for the retired backend's row to be removed *and* the removal explained. The first draft's explanation named `backend/vaa-strapi/` in backticks — which re-created the dangling citation the row's removal had just cleared, and made `grep -ci 'vaa-strapi'` return a non-zero count against its own acceptance criterion.
- **Fix:** The note names the subsystem in words ("the retired Strapi backend's row") and names the live replacement (`apps/supabase/`, owned by `database`) instead.
- **Verification:** `grep -ci 'vaa-strapi'` → 0; `audit-skill-links.sh BOUNDARIES.md` → exit 0.
- **Committed in:** `e8f3f5689`

**2. [Rule 2 - Missing Critical] Splitting the orphaned concept row left a directory unowned**

- **Found during:** Task 1
- **Issue:** `Frontend routing and contexts` had one owner, the deleted skill. Its two halves have different homes now — routing is `CLAUDE.md` content, context reactivity is `components` content after Plan 05. Splitting the concept row without an owner for `apps/frontend/src/lib/contexts/` would have created a gap in a map whose whole purpose is that there is none.
- **Fix:** Added a directory-table row for `apps/frontend/src/lib/contexts/` owned by `components`, noting it owns how a component reads a context and the rules that govern the read.
- **Committed in:** `e8f3f5689`

**3. [Rule 1 - Bug] Six listings were stale — see the Corrected table above**

Found during Task 2 and each fixed in the same commit as its discovery: the `concatClass` scope, the nullable `list` getter, two `CLAUDE.md` line anchors past the end of a 341-line file, the corpus row measured at the wrong commit, and the `§ Adding a skill` stem count. Committed in `f8e7b4b07` and `1c086d423`. **The two line anchors are the consequential ones**: this phase trimmed `CLAUDE.md` by 96 lines and did not re-derive the anchors pointing into it, which is the exact defect class the phase exists to remove, committed by the phase itself.

**4. [Rule 1 - Bug] The guard's own header made a claim this plan falsified**

- **Found during:** Task 2
- **Issue:** `.claude/scripts/audit-skill-links.sh`'s incident record said the five `BOUNDARIES.md` rows "were still live". Task 1 had just closed that class one commit earlier.
- **Fix:** One clause added stating the class is now closed, how (four repointed, one deleted with its subsystem), and that again it closed only because a plan went looking — which is the header's own thesis.
- **Verification:** `bash -n` clean; the guard still runs and exits 0 on `BOUNDARIES.md`.
- **Committed in:** `f8e7b4b07`

---

**Total deviations:** 4 (1 missing-critical, 3 bugs). **Impact:** all four are accuracy repairs inside this plan's own blast radius; deviation 3 is what the plan asked for and would have been a failure to find nothing. No scope creep — the `database` skill's schema citations were left to their todo.

## Defective criterion idioms met, and the substitutions used

Per the phase's standing rule, every idiom was run and read before being relied on.

| Idiom | Verdict | Substitution |
| --- | --- | --- |
| `grep -v '^\./\.planning/'` | **Vacuous** under this shell — `grep` is a function wrapping `ugrep`, which emits no `./` prefix (Plan 07's finding, re-confirmed) | `command grep` where the prefix matters; not needed for most of this plan's checks, which are scoped to explicit paths |
| `awk '/^## X/,/^## /'` | **Collapses to the heading line** | `awk '/^## X/,0'` — used for the `CLAUDE.md § Skill Routing` extraction |
| "for each bare lowercase token in the owner column" | **Ambiguous**: word-splitting `the directory owner` yields `test -d .claude/skills/the` | Applied per-CELL: a cell whose whole trimmed value matches `^[a-z][a-z0-9-]*$` must be a skill directory |
| "every remaining dangling token is one of the known out-of-scope schema citations" | **False as written** — the residue is dominated by the package-relative habit Plan 01 recorded | Asserted the property that matters instead: the dangling set is a strict SUBSET of the inbound set, proven token by token |
| "`git diff --name-only` across the whole phase lists no ROADMAP/STATE/REQUIREMENTS" | **Fails as written** — the orchestrator's own tracking commits touch two of them | Asserted per-commit attribution plus the plan-scoped diff; see § The prohibition check |
| `grep -c` for a zero result | Returns the number but **exits 1** | The number is read; the exit status is never used as the gate |

## Issues Encountered

None unresolved.

**No CI claim is made.** `.github/workflows/main.yaml` carries `paths-ignore: "**.md"` on every trigger and does not trigger on `integration/ship-12-squash` at all. Every gate reported here was run locally and its output is quoted.

**A stale dev server was found on port 5173 and deliberately not killed.** The wrapper defaults to `FRONTEND_PORT=5273` precisely because 5173 is held on this host, and it refuses to adopt a foreign listener. Port 5273 was asserted free before the spawn; the wrapper owned its own server and tore it down from a trap.

## Next Phase Readiness

- **Plan 09 inherits a live, unresolved routing-depth violation, and it is its chartered work.** The chain is **two hops**: `CLAUDE.md:319` § Skill Routing → `spike-findings-…/SKILL.md:149` § Feature Areas (a table of 8 rows) → `references/`. Re-derived here, not carried: the `CLAUDE.md` anchor is now **`:319`**, not the `:432` the record carried before this plan. `.claude/skills/README.md` states plainly that the violation is live. **Do not record it as resolved, and disposition it by promoting or splitting, never by discarding** — and note the skill is machine-generated, so any hand flatten expires at the next `/gsd-spike --wrap-up`.
- **Plan 09's Check B figure, re-derived:** **four of seven** `SKILL.md` descriptions open with `Domain expert for the` (`data`, `database`, `filters`, `matching`). Two superseded figures (six of eight, five of eight) are in circulation and both are named as superseded in the record.
- **Link baseline for Plan 09:** whole corpus `Checked: 631  Dangling: 207  Skipped: 179`. `BOUNDARIES.md`, `README.md`, `CLAUDE.md`, both `components` files, `data/object-model.md` and `filters/extension-patterns.md` are each individually `Dangling: 0`.
- **Corpus figures for Plan 09 to re-derive against:** 25 Markdown files / **336,488 B** excluding `README.md`, measured at `f8e7b4b07`. `CLAUDE.md` is **28,038 B / 341 lines**. Any `SKILL.md` edit Plan 09 makes moves the byte figure and the `§ Last verified` block's commit anchor with it.
- **Plan 09's manual half is done, and it should not be redone.** This plan's 52-row record is the manual re-check; Plan 09's auditor is the mechanical half. Where the auditor re-finds something recorded here, cite the record rather than re-deriving it — but **do** re-derive anything the record marks as anchored to an older commit.
- **Plan 09 carries the same E2E gate.** It was green at `f8e7b4b07` with **155/0/0/0/0** and a confirmed preflight, run through `tests/scripts/e2e-run.sh` on port **5273** (5173 is held on this host). `tests/e2e-runs/` must not be deleted; disk headroom was 85 GiB at this run.
- **No blockers.** `.planning/ROADMAP.md`, `.planning/REQUIREMENTS.md` and `.planning/STATE.md` are unmodified by this plan — verified, 0 matching paths in `git diff --name-only 2e8e8e1e1..HEAD`.

---

_Phase: 160-agent-docs-skills-refresh_
_Completed: 2026-09-13_

## Self-Check: PASSED

- All five `key-files.modified` present on disk.
- All three task commits resolve in `git log --oneline --all`: `e8f3f5689`, `f8e7b4b07`, `1c086d423`.
- `commits: 3` is MEASURED — `git rev-list --count 2e8e8e1e1ff681c87127317c7acca9ab2ceea54c..HEAD` against a ledger written before the first commit, not narrated.
- Task 1's six acceptance criteria re-run at SUMMARY time; one reported as a substitution (owner-token extraction applied per-cell), none as a vacuous pass.
- Task 2's per-listing record covers **every** file in the plan's `files_modified`, plus `CLAUDE.md`, the `spike-findings` repoints and `.claude/scripts/audit-skill-links.sh` which the phase also changed. Every listing marked `corrected` appears in `git diff --name-only 2e8e8e1e1..HEAD`; the reverse also holds — all five changed files carry at least one corrected listing.
- Task 2's `grep -cE 'checked|corrected|out of scope'` criterion returns **23**, satisfying "at least one row". Recorded as a weak proxy rather than a proof: the record's dispositions live in table columns whose per-row keyword is not repeated on every line, so the count under-reads the 52 dispositions the tables actually carry. The tables are the evidence, not the grep.
- Task 3's gates all re-run and quoted verbatim: docs links exit 0, `lint:check` exit 0 read from `$?` directly, link audit 631/207/179 with an empty introduced-token diff, and the full Playwright suite 155/0/0/0/0 with the preflight line confirming this checkout.
- Prohibition honoured at plan scope: `git diff --name-only 2e8e8e1e1..HEAD` lists exactly five paths, all under `.claude/`, matching none of `(ROADMAP|STATE|REQUIREMENTS)\.md` or `^\.github/`. The phase-wide form of the criterion is reported as failing-as-written with its per-commit attribution, not as a pass.
- No criterion in this summary is marked verified on a green `audit-skill-drift.sh` run; the guard's output text is quoted as context with its exit code explicitly disclaimed.
