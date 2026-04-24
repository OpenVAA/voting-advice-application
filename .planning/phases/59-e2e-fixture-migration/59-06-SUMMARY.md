---
phase: 59-e2e-fixture-migration
plan: 06
subsystem: testing
tags: [playwright, e2e, fixtures, git-rm, cleanup, d-59-08, d-59-09, d-59-10]

# Dependency graph
requires:
  - phase: 59
    provides: Plan 59-04 variant/setup rewrite + Plan 59-05 PARITY GATE: PASS verdict (post fix-forward)
provides:
  - "Legacy JSON fixtures (default-dataset.json + voter-dataset.json + candidate-addendum.json) permanently removed"
  - "Overlay JSON fixtures (constituency/multi-election/startfromcg) permanently removed"
  - "tests/tests/utils/mergeDatasets.ts deleted (orphan util)"
  - "Doc + docstring references scrubbed so post-delete grep returns zero repo-wide"
  - "D-59-09 three-gate verification record (grep=0, yarn build exit 0, playwright --list=89)"
affects: [59-07 VERIFICATION, future-milestones]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "git rm (not plain rm) for clean staging of deletions"
    - "Docstring/docs scrub as separate pre-flight commit before destructive change — keeps delete commit pure (only D lines)"
    - "D-59-09 post-delete gate: grep (md+ts+js+json, excluding .planning/.svelte-kit) + yarn build + yarn test:unit + playwright --list"

key-files:
  created:
    - .planning/phases/59-e2e-fixture-migration/59-06-SUMMARY.md
  modified:
    - apps/docs/src/routes/(content)/developers-guide/development/testing/+page.md (pre-flight scrub)
    - tests/tests/setup/templates/variant-constituency.ts (pre-flight scrub)
    - tests/tests/setup/templates/variant-multi-election.ts (pre-flight scrub)
    - tests/tests/setup/templates/variant-startfromcg.ts (pre-flight scrub)
  deleted:
    - tests/tests/data/default-dataset.json (945 lines, 22262 bytes)
    - tests/tests/data/voter-dataset.json (884 lines, 20519 bytes)
    - tests/tests/data/candidate-addendum.json (58 lines, 1531 bytes)
    - tests/tests/data/overlays/constituency-overlay.json (608 lines, 14576 bytes)
    - tests/tests/data/overlays/multi-election-overlay.json (330 lines, 7697 bytes)
    - tests/tests/data/overlays/startfromcg-overlay.json (468 lines, 11263 bytes)
    - tests/tests/utils/mergeDatasets.ts (56 lines, 1884 bytes)
    - tests/tests/data/overlays/ (directory auto-removed by git once empty)

key-decisions:
  - "Pre-flight docstring+docs scrub committed separately from the delete (a1f3d479b precedes ff03ac53c) — keeps the `chore(59-06): delete ...` commit a pure set of D-line entries per D-59-14 linear commits (Rule 2 auto-added scope)."
  - "Scope of pre-flight scrub: 1 docs source (.md) + 3 variant template docstrings (.ts). The docs +page.md referenced default-dataset.json as live prose; variant templates had `mergeDatasets` in their prologue. Without the scrub, Plan 05's D-59-09 post-delete grep gate would have failed with 4 hits."
  - "Task 1 PASS-gate checkpoint treated as approved by orchestrator (post-swap/diff.md verdict: PASS at SHA 3c57949c8) — no re-prompt issued, matches the checkpoint auto-approve guidance for PRE-VERIFIED gates."
  - "`tests/tests/data/overlays/` auto-removed by git once last file deleted (expected per filesystem + git behavior); `tests/tests/data/` preserved because `assets/` (test-poster.jpg, test-video.mp4, test-video.webm, test-captions.vtt) still lives there per D-59-10."

patterns-established:
  - "Pre-flight docs/docstring scrub before destructive delete: when a plan calls for `git rm <file>` and a post-delete grep gate requires zero repo-wide mentions of `<file>`, do the scrub commit FIRST so the delete commit stays pure. Lowers the cognitive load of the delete diff."
  - "D-59-09 three-gate verification pattern: (1) grep 0 hits for filenames in md+ts+js+json excluding .planning/.svelte-kit, (2) yarn build exit 0, (3) yarn test:unit exit 0, (4) playwright --list = baseline count. All four must pass BEFORE committing the delete; any failure means a consumer was missed."

requirements-completed: [E2E-02]

# Metrics
duration: 7min
completed: 2026-04-24
---

# Phase 59 Plan 06: Legacy JSON Fixture Deletion Summary

**7 legacy files deleted (3 core JSON fixtures + 3 orphan overlays + mergeDatasets.ts), D-59-09 three-gate verification green, repo now has zero references to the retired filenames outside .planning/**

## Performance

- **Duration:** ~7 min (Task 1 PASS-gate auto-approved; Tasks 2+3 executed sequentially with 3 build+test runs)
- **Started:** 2026-04-24T09:45Z (post Plan 59-05 PASS verdict at 3c57949c8)
- **Completed:** 2026-04-24T09:52Z
- **Tasks:** 3 (checkpoint + delete+verify + commit)
- **Files deleted:** 7 (3349 lines of JSON/TS)
- **Files modified (pre-flight scrub):** 4

## Accomplishments

- **E2E-02 satisfied:** the last pre-Phase-59 fixture artifacts are permanently gone from the working tree (recoverable only via `git revert` of ff03ac53c).
- **D-59-09 three-gate verification green:** grep sweep returned 0 hits (md+ts+js+json, excluding .planning/.svelte-kit), `yarn build` exited 0 (14/14 tasks successful, 13 cached), `yarn test:unit` exited 0 (18/18 tasks, 613 frontend + 450 dev-seed + package-level tests all green), `yarn playwright test --list` enumerated exactly 89 tests across 25 files (matches baseline + post-swap).
- **post-swap/diff.md PARITY GATE: PASS verdict preserved intact** — no re-run necessary; delete is purely destructive, carries no runtime risk that would alter the parity verdict.
- **Orphan overlays folder auto-cleanup:** `tests/tests/data/overlays/` removed by git once empty; `tests/tests/data/` preserved because `assets/` (poster/video/caption test media) still lives there per D-59-10.

## Task Commits

1. **Task 1: PASS-gate checkpoint** — no commit (orchestrator pre-approved at SHA 3c57949c8; verdict already `PASS` in post-swap/diff.md from fix-forward iteration 2).
2. **Pre-flight docstring/docs scrub** — `a1f3d479b` (docs) — Rule 2 auto-added to close the D-59-09 grep gate pre-delete.
3. **Task 2: Delete 7 files + D-59-09 verify** — staged via 7 `git rm` invocations; no standalone commit (rolled into Task 3 per plan protocol).
4. **Task 3: Commit delete** — `ff03ac53c` (chore) — 7 deletions, 3349 lines removed.

**Plan metadata commit:** appended below after SUMMARY.md + STATE.md + ROADMAP.md updates.

## Files Created/Modified

### Modified (pre-flight scrub, commit a1f3d479b)
- `apps/docs/src/routes/(content)/developers-guide/development/testing/+page.md` — replaced `tests/tests/data/default-dataset.json` mention with a description of the new `@openvaa/dev-seed` e2e template + `variant-*.ts` compose flow.
- `tests/tests/setup/templates/variant-constituency.ts` — dropped `+ mergeDatasets` from the "Replaces the legacy ... overlay JSON fixture" docstring prologue; tagged as deleted in Plan 59-06.
- `tests/tests/setup/templates/variant-multi-election.ts` — same scrub.
- `tests/tests/setup/templates/variant-startfromcg.ts` — same scrub.

### Deleted (commit ff03ac53c)
- `tests/tests/data/default-dataset.json` (22 KB, 945 lines) — primary base fixture for E2E tests.
- `tests/tests/data/voter-dataset.json` (20 KB, 884 lines) — voter-app overlay.
- `tests/tests/data/candidate-addendum.json` (1.5 KB, 58 lines) — candidate-app overlay.
- `tests/tests/data/overlays/constituency-overlay.json` (14 KB, 608 lines) — constituency variant overlay.
- `tests/tests/data/overlays/multi-election-overlay.json` (7.5 KB, 330 lines) — multi-election variant overlay.
- `tests/tests/data/overlays/startfromcg-overlay.json` (11 KB, 468 lines) — startFromConstituencyGroup variant overlay.
- `tests/tests/utils/mergeDatasets.ts` (1.8 KB, 56 lines) — orphaned recursive JSON merge util after variant setups rewritten in Plan 59-04.

### Auto-removed by git
- `tests/tests/data/overlays/` — directory vanished once last tracked file deleted.

### Preserved (non-fixture assets per D-59-10)
- `tests/tests/data/assets/test-poster.jpg`, `test-video.mp4`, `test-video.webm`, `test-captions.vtt` — still referenced by media-handling specs.

## Decisions Made

- **Split Task 3 commit into two commits (pre-flight scrub + delete):** the original plan Task 3 language says the delete commit should show "ONLY these 7 deletions." Four files needed docstring scrub to close the D-59-09 post-delete grep gate; rather than bundle them into the `chore(59-06): delete ...` commit and contaminate the "pure deletion" diff, those mods landed as a preceding `docs(59-06): scrub stale refs ...` commit (a1f3d479b). The delete commit (ff03ac53c) is consequently a pure set of D-line entries matching the plan's spec exactly.
- **PASS-gate checkpoint auto-approved:** the plan's Task 1 asks for an explicit human verification phrase, but the orchestrator's resume context stated "PASS gate is MET... You may proceed without re-asking for a human-verify checkpoint — treat Task 1 (PASS-gate checkpoint) as already approved." Honored as instructed; post-swap/diff.md `verdict: PASS` at SHA 3c57949c8 was independently re-confirmed in the executor session before any destructive action.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 2 - Missing Critical] Pre-flight docs/docstring scrub to close D-59-09 grep gate**
- **Found during:** Pre-flight grep per the plan's Task 2 pre-flight block.
- **Issue:** The post-delete D-59-09 grep gate requires zero hits for `default-dataset.json\|...\|startfromcg-overlay.json` in `.md` files and for `\bmergeDatasets\b` in `.ts/.js` files, excluding `.planning/` and `.svelte-kit/`. Running the post-delete grep without pre-flight cleanup would have returned 4 hits: (a) `apps/docs/src/routes/(content)/developers-guide/development/testing/+page.md:21` live prose citing `tests/tests/data/default-dataset.json`, (b+c+d) `tests/tests/setup/templates/variant-{constituency,multi-election,startfromcg}.ts` docstrings mentioning `mergeDatasets`. All four are live files tracked by git (not `.planning/` historical refs); they would have failed the gate.
- **Fix:** Replaced the single prose sentence in the docs page with a description of the new dev-seed + variant-template flow; removed `+ mergeDatasets` (3 words) from each of the three variant docstring prologues, replacing with `(deleted in Plan 59-06)` for historical context.
- **Files modified:** `apps/docs/src/routes/(content)/developers-guide/development/testing/+page.md`, `tests/tests/setup/templates/variant-constituency.ts`, `tests/tests/setup/templates/variant-multi-election.ts`, `tests/tests/setup/templates/variant-startfromcg.ts`.
- **Verification:** post-scrub grep returned 0 fixture-filename hits + 0 mergeDatasets hits (only remaining references were inside mergeDatasets.ts itself, which was about to be deleted). Post-delete grep confirmed 0/0 hits repo-wide.
- **Committed in:** `a1f3d479b` (docs(59-06): scrub stale refs to legacy fixtures before deletion).

---

**Total deviations:** 1 auto-fixed (Rule 2 — missing critical functionality: pre-flight required to satisfy plan's own verification gate).
**Impact on plan:** The scrub is precisely what the plan's D-59-09 post-delete gate demands; committing it separately from the destructive delete preserves the clean diff shape of the `chore(59-06)` commit. No scope creep.

## Issues Encountered

None — execution was linear. One orthogonal piece of noise: `supabase/.temp/cli-latest` was modified at session start (unrelated to this plan); left unstaged throughout, not included in either commit.

## D-59-09 Verification Record

All three gates green immediately prior to Task 3 commit:

| Gate | Command | Expected | Actual |
|------|---------|----------|--------|
| Grep: fixture filenames | `grep -rn --include='*.ts' --include='*.js' --include='*.json' --include='*.md' --exclude-dir=node_modules --exclude-dir=.planning --exclude-dir=.git --exclude-dir=.turbo --exclude-dir=.svelte-kit 'default-dataset.json\|voter-dataset.json\|candidate-addendum.json\|constituency-overlay.json\|multi-election-overlay.json\|startfromcg-overlay.json' .` | 0 hits | 0 hits |
| Grep: mergeDatasets word boundary | `grep -rnE --include='*.ts' --include='*.js' --exclude-dir=node_modules --exclude-dir=.planning --exclude-dir=.git --exclude-dir=.turbo --exclude-dir=.svelte-kit '\bmergeDatasets\b' .` | 0 hits | 0 hits |
| Build | `yarn build` | exit 0 | exit 0 (14/14 tasks, 13 cached, 5.8s) |
| Unit tests | `yarn test:unit` | exit 0 | exit 0 (18/18 tasks, 613+450+ passed, 8.1s) |
| Playwright enumeration | `yarn playwright test --list` | `Total: 89 tests in 25 files` | `Total: 89 tests in 25 files` |

Post-commit re-run: `yarn build` cached full-turbo in 127ms (no rebuild needed — confirms zero dangling imports from the delete).

## Next Phase Readiness

- **E2E-02 satisfied.** Phase 59 ROADMAP success criterion 3 ("zero remaining references to these filenames across the repo") is now true.
- **Plan 07 (VERIFICATION.md + deps-check artifact, E2E-04) unblocked** — only Phase 59 work remaining is documentation.
- **No blockers.** post-swap/diff.md `verdict: PASS` preserved; no code execution during Plan 06 could have altered the parity verdict (pure file removal).

## Self-Check: PASSED

- Commits `a1f3d479b` (docs scrub) and `ff03ac53c` (delete) both present in `git log --oneline --all`.
- All 7 target files confirmed absent from the working tree via `[ ! -f ... ]`.
- All 4 pre-flight scrub edits confirmed present in working files via grep.
- `.planning/phases/59-e2e-fixture-migration/59-06-SUMMARY.md` exists.

---
*Phase: 59-e2e-fixture-migration*
*Completed: 2026-04-24*
