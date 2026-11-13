---
phase: 176-contestant-home-task-state-nominations-view
step: review-fix
batch: review-fix-B
findings_fixed: [WR-01, WR-02, IN-01]
findings_skipped: [IN-02]
base: 19374478c
gates: tests/e2e-runs/179-gates/review-fix-B-r3
e2e_close: tests/e2e-runs/179-e2e/review-fix-B-r2
status: complete
---

# Phase 176 review fix

Fixed in review-fix batch B, with phases 173 (a second section), 175 and 177. Each finding got a failing test first, committed with the exit of its red run, then the fix, then the green run. IN-01 is 175 IN-06 and was fixed once.

| Finding | Disposition | Commits |
| --- | --- | --- |
| WR-01 | fixed | d77f1c736 (red), a5244f9ce (fix) |
| WR-02 | fixed | d77f1c736 (red), a5244f9ce (fix) |
| IN-01 (= 175 IN-06) | fixed | c32a3c9fa (red), 267bb8254 (fix) |
| IN-02 | skipped: recorded decision, operator | none |

## WR-01 and WR-02: where the nomination task leads, and what it says

**Verified.** For an entity with no nomination, `taskStateOf` routed the task into the editor whenever both locks were off, without asking whether an election admits the entity's type (the editor's guard then redirected to the view), and `taskLabelKey` labelled the task "Define your nomination" also where it led to the view under a lock.

**Red** (d77f1c736): vitest over `taskState.test.ts` and `contestantContext.svelte.test.ts`, **exit 1**, 12 of 282 failed. Log `tests/e2e-runs/179-unit/review-fix-B-176-wr-red.log`.

**Fix** (a5244f9ce):
- **WR-02.** `TaskStateInput.nominationEntryOffered` replaces `nominationsEditable`. The context answers it with `nominationEntryOfferedOf({ locks, elections, entityType })` from `$lib/contestant/nominations`: both locks off and an election admits the type. The elections are the root load's `electionData` from the page data, the same data the editor's guard builds its facts from, so the home and the guard cannot disagree, and the answer is the same in the server's markup and on the first frame (the data root is filled in an effect after mount, which would have made the server markup lead to the view).
- **WR-01.** `taskLabelKey` takes the task's route: an incomplete nomination task reads `contestantApp.home.nomination.enter` where it leads into the editor and `…nomination.view` ("View your nominations") where it leads to the view. No new message key.
- The home and view page tests that pinned the old label and input were updated in the fix commit, and the docs pages `home-and-tasks` and `defining-nominations`.

**Green:** vitest over `src/lib/contestant`, the contestant context and the contestant routes **exit 0**, 2336 passed. Log `review-fix-B-176-wr-green.log`.

## IN-01 (= 175 IN-06): a nomination the data root cannot resolve

**Verified.** One election id the data root did not hold made the lookup throw, the catch wrote `[]`, `questionsReady` stayed false and the home, the view's button and the questions layout stayed in their loading form for good. The constituencies did the same.

**Red** (c32a3c9fa): `contestantContext.svelte.test.ts`, **exit 1**, 2 of 114 failed.

**Fix** (267bb8254), the smaller of the two the reviews offer, without a new failed state:
- The elections and the constituencies are looked up one id at a time; an id the data root does not hold is logged and left out, so it costs the entity none of the others.
- An entity with nominations whose elections are all missing, from a data root that holds elections, is asked no question: `questionsReady` is true with empty lists. That is how the server's preview gate already reads the same case, so the browser and the server agree, and the state is decided. A data root that holds no election yet is still "not loaded".

**Green:** vitest over `src/lib/contexts`, `src/lib/contestant` and the contestant routes **exit 0**, 2812 passed.

## IN-02: skipped, an operator decision

The finding holds: a malformed nominations answer makes `getEntityUserData` reject and the entity load signs the user out with `loginFailed`. That is the recorded policy: 173-CONTEXT D-11 lists "`loginFailed` (the user-data read itself failed) is unchanged: sign out and return to login", and the entity load's header states it. The review itself says no change is needed if this is the intended policy. Showing the entity layout's error view instead would reverse it. **Decision for the operator.**

## Gates and E2E close of batch B

- **Gate set `review-fix-B`**, on 444778c0e: 20 of 22 rows exit 0. `lint` and `unit` were red for one cause: the new adapter source `utils/rpcAnswer.ts` was in neither list of `assert-project-scoped-queries.mjs` (the guard itself, and dev-seed `projectScopingGate.test.ts`); fixed in a633bf167. Before the second run, WR-01 of phase 177 was narrowed to new and moved nominations (3ca2fa7bf red, 456b5ee17 fix, migration `00007`).
- **Gate set `review-fix-B-r2`**, on 456b5ee17: all 22 rows exit **0**; `179-verdict gates review-fix-B`: **PASS**, no Sleep entry in the window.
- The stack was restarted (`yarn db:stop && yarn db:start` through the key filter, exit 0; the edge runtime up) before the E2E.
- **E2E close `review-fix-B`**, on 456b5ee17, under `caffeinate`: **red, not void** (no Sleep entry, no void marker): 2 failed, 383 did not run, 228 passed of 613. The two failures were `contestant-entity-selection`'s draft tests: its fixture read a draft at `<stem>-<type>-<id>`, the key form before 173 WR-01 added the user; the 383 are the perm chain anchored on that project. Fixed in the fixture (a9f7c2511), which finds the one key that ends `-<type>-<id>`.
- **E2E close `review-fix-B-r2`**, on a9f7c2511, under `caffeinate`: **613 passed**, 0 failed, 0 flaky, 0 skipped, 0 did not run, 128 projects, 16.2 min. Wrapper exit 0, the restore ran (`db:stop`, `db:start`, edge runtime running). Not void; `sleep_entries_in_window: 0`. `179-verdict e2e review-fix-B --same-projects-as review-fix-A`: **PASS**, 128 projects compared, 0 not as expected. New E2E test count delta: 0.
- **Gate set `review-fix-B-r3`**, on a9f7c2511, the tree the E2E close ran on: all 22 rows exit **0**; `179-verdict gates review-fix-B`: **PASS**, not stale, no Sleep entry in the window. This is the gate verdict of record for batch B.
- `yarn db:seed:default` exit 0 afterwards.
