---
phase: quick-261011-ujg
plan: 01
quick_id: 261011-ujg
subsystem: planning
tags: [phase-178, operator-reading, J1, PL-29, planning-documents]
status: complete
requires:
  - the operator's reading of section H, confirmed in session on 2026-10-11
provides:
  - Phase 178's plans in the J1 (b) form
  - plan 178-01's reading rule with the one applied item
  - the reading recorded under Fill status
affects:
  - .planning/phases/178-sign-in-email-code-registration (plans 01, 04, 14, 24; the execution rules; the validation map)
  - .planning/v2.16-OPERATOR-DECISIONS-2026-10-09.md
  - .planning/STATE.md
tech-stack:
  added: []
  patterns: []
key-files:
  created:
    - .planning/quick/261011-ujg-apply-the-operator-s-reading-of-section-/261011-ujg-BASE
  modified:
    - .planning/phases/178-sign-in-email-code-registration/178-EXECUTION-RULES.md
    - .planning/phases/178-sign-in-email-code-registration/178-01-PLAN.md
    - .planning/phases/178-sign-in-email-code-registration/178-04-PLAN.md
    - .planning/phases/178-sign-in-email-code-registration/178-14-PLAN.md
    - .planning/phases/178-sign-in-email-code-registration/178-24-PLAN.md
    - .planning/phases/178-sign-in-email-code-registration/178-VALIDATION.md
    - .planning/v2.16-OPERATOR-DECISIONS-2026-10-09.md
    - .planning/STATE.md
decisions:
  - "J1 is built at option (b) by the operator's ruling of 2026-10-11 (decision H1): the password fact is filled on every call of getBasicUserData, which takes no setting"
  - "PL-29 (a) is cited as the operator's explicit acceptance of 2026-10-11 (decision H38 (a)); the built option does not change"
  - "Plan 178-01's reading takes a ticked (b) on H1 as applied and halts on every other state of H1; no other item has an accepted second option"
metrics:
  duration: "about 17 minutes"
  completed: 2026-10-11
actuals:
  tokens: 30600
  tasks: 3
  commits: 3
plan_head_before: e375152a47bd2226595622af7513c7605a18cff6
plan_head_after: d2c890bf760df9d35bdedbb2c5fc3bcf4703d1ea
---

# Quick 261011-ujg: The operator's reading of section H applied to Phase 178 — Summary

Phase 178's plans now build J1 (b) — the password fact on every read of the user-level data — plan 178-01's reading takes the operator's one tick as applied, and the reading of 2026-10-11 is on the record. Planning documents only: no plan of Phase 178 was run and nothing outside `.planning/` was edited.

## Base

`e375152a47bd2226595622af7513c7605a18cff6`, written to `261011-ujg-BASE` before any other edit.

## The decision document before anything was restored

`git diff -- .planning/v2.16-OPERATOR-DECISIONS-2026-10-09.md` showed two changed lines and nothing else (numstat `2 2`):

- in H1's paragraph on option (b), the line ending "until the plans are changed to it (plan" had gained a trailing space;
- in option (a) of H5, "uninvited" read "uninvted".

Both were restored with `git checkout --` on that one file; `git diff --quiet` on it then exited 0. H1's box (b) stayed ticked: it is the one ticked box between `## H.` and `## Fill status`.

## The proof's outcomes (Task 1)

The reading rule was built onto a scratch copy of Phase 177's reader outside the repository (the table `APPLIED = { H1: 'b' }` and one branch before the untouched case).

| # | Document, sections | Exit | Outcome |
|---|---|---|---|
| 1 | the round document, `H` | 0 | 36 items; `H1: applied (b)`; 35 `recommended-unticked` |
| 2 | scratch copy with H1's tick removed, `H` | 1 | `H1: halt — the plans build option (b) by the operator's ruling and the document does not say so` |
| 3 | scratch copy with H1's tick on (a), `H` | 1 | the same halt on H1 |
| 4 | scratch copy with H38's (b) ticked as well, `H` | 1 | `H1: applied (b)`; `H38: halt — option (b) ticked, for which the plans state no fallback an executor may build` |
| 5 | the round document, `CD` | 0 | 7 items, none halting |
| 6 | the round document, `F` | 1 | `F1: halt` |
| 7 | plan 178-01 through both validators | 0 and 0 | `valid: true` each; its verify blocks parse |

Beside them: Phase 177's unpatched reader on section `H` exits 1 with H1 halting, which is what stopped the phase before this task.

## Verify blocks

Each block was written byte for byte into a script file outside the repository and run with `bash`; every status was read from the command itself.

| Block | When | Exit |
|---|---|---|
| Task 1 | before its commit, after its commit, on the final tree | 0, 0, 0 |
| Task 2 | before its commit, on the final tree | 0, 0 |
| Task 3 | after its commit, and again after the state file's one-character correction | 0, 0 |

Both validators over all 24 plans, each run on its own: `verify.plan-structure` exit 0 with `valid: true`, no error and no warning, 24 of 24; `frontmatter.validate --schema plan` exit 0 with `valid: true`, 24 of 24. The frontmatter of all 24 plans also parses with the `yaml` package.

## Places changed, by file and quoted anchor

### `178-EXECUTION-RULES.md`

- The paragraph under `## Items built at the recommended option, each isolated`: its first sentence is now "**The operator read this round on 2026-10-11**…"; "stops the phase when the document says anything else"; the sentence "**On item J1 the operator's ruling is later than all three**…" added after "*(UI over research)*". The heading is unchanged.
- The row `| J1 |`: built at "(b) — ruled by the operator on 2026-10-11 (decision H1)…"; the other cell names (a) as the planner's recommendation, not built.
- The row `| PL-29 |`: its Built cell begins "accepted by the operator on 2026-10-11 (decision H38 (a), put to the operator by name) and documented".
- The paragraph beginning "`$P/178-read-rulings.mjs`, built by plan 178-01": the sentence on the one item read otherwise, and "— J1 excepted, which stands at (b) on the ruling recorded above —".
- `## Names this phase introduces`: the `| writer |` row holds `BasicUserData.passwordSet: boolean`, filled on every call; the `| frontend |` row beginning "gate id `'setPassword'`" no longer holds a narrowed gate type.

### `178-01-PLAN.md`

- The truth beginning "The operator's rounds are read by a fixed rule and not by judgment".
- The source-coverage row `| Orchestrator |`.
- `## Rulings and deviations carried by this plan`: a fifth item.
- Task 2 step 1 (the addition stated in full, and the printed form `<item>: applied (<option>)`), step 2 (the applied branch seen three ways on scratch copies), step 4 (H1 reads `applied (b)`; the J1 exception for an absent round file).
- Task 2's acceptance criteria (one line), its automated chain (the two links after the `--facts` run), its fails-when text.
- The row `| T-178-03 |`, the reader's line in the artifacts-produced block, and the output block ("the three scratch readings of the applied branch").

### `178-04-PLAN.md`

- Frontmatter `files_modified`: the writer's base-class file left, `supabaseDataWriter.integration.test.ts` entered.
- The truth beginning "The adapter fills `BasicUserData.passwordSet`"; the artifact of `dataWriter.type.ts` (`contains: "passwordSet: boolean"`); the key link's `via`.
- The objective (two phrases); the context block (one sentence on what ruling 2 supersedes); the long-gates block's row list.
- Ruling 2, whole ("**The fact is filled on every call**"), and ruling 4 (the integration row runs again in `178-04-close`).
- The source-coverage row `| RESEARCH |`.
- `## What this plan's commits do to committed specs`, whole.
- Task 3, as one piece: name, reversibility line, the precondition line of Task 2, files line, read-first list, behaviour block, the six steps, acceptance criteria, automated chain, fails-when text and done line. The chain changed in the links the plan named and in no other.
- The rows `| T-178-20 |` (component and mitigation) and `| T-178-22 |` (disposition `accept`, dated, naming the Admin App).
- The verification block's `178-04-close` line, the success criteria, the Frontend line of the artifacts-produced block, the output block.

### `178-14-PLAN.md`

- The truth beginning "The gate is decided by the server, on the user-level data"; the artifact of `gates.ts` (`provides`); the key link (`via`, and `pattern: "passwordSet"`).
- `## Rulings and deviations carried by this plan`: an eleventh item.
- Task 2: the reversibility line; step 1 (the type-level case of `gates.test.ts`, the first case of `layout.server.test.ts`); step 2; step 4; two acceptance criteria; the two named changes of the verify script and no other; two phrases of the fails-when text.
- The artifacts-produced block: the Gate line and the Load line.
- PL-29: the truth ending "put to the operator as item PL-29", ruling 9 ("The other options are the operator's"), the row `| T-178-153 |`.
- The output block's "unanswered" sentence.

### The others

- `178-24-PLAN.md`: the truth beginning "Every item of the operator's round stands".
- `178-VALIDATION.md`: the row `| 178-04-03 |` — behaviour cell, test-type cell (`integration`), threat cell (T-178-20).
- `.planning/v2.16-OPERATOR-DECISIONS-2026-10-09.md`: the last cell of the row `| H — Phase 178` ("Planned; read 2026-10-11"); one paragraph under `## Fill status`, on one line, between "**Read on 2026-10-11, section G, in part:**" and "**Found while Phase 177 was executed". Every fact of the paragraph was found as the plan stated it.
- `.planning/STATE.md`: `stopped_at`, `last_updated`, `last_activity`, `last_activity_desc`. **Left uncommitted in the working tree** on the dispatch's instruction.

## Found beyond the starting list

1. **A fourth caller.** `apps/frontend/src/routes/admin/(protected)/+layout.ts` reads the user-level data through `getUserData` on every load of the Admin App's protected layout, and redirects to the Admin login with `loginFailed` when the read gives no user. The plan's table of the (b) form names the job polls, the two Admin pages and the Contestant layout. Plan 178-04 now names this caller as well, in its truth, ruling 2, the paragraph on committed specs, Task 3's read-first list, T-178-20 and T-178-22. It is a consequence of "a failed read fails every caller", not a new decision.
2. **Three places in plan 178-14 that rest on the on-request form and are in no search and no list**: "the load's question" in the objective's Output line, in the paragraph beginning "**One commit.**" and in Task 2's name. Each now reads "the load's check of the fact". In the same Output line, "the gate's entry, type, view and tests" lost "type".
3. **Plan 178-04 Task 3, step 1** held a backticked tag name in its prose. The rewritten step says "the behaviour block above".
4. **Typed fixtures outside plan 178-04's file list.** With the member required, the type check will name producers of `BasicUserData` in test files — `gates.test.ts`, `layout.server.test.ts` and `contestantContext.svelte.test.ts` hold such objects today. Step 5 of Task 3 tells the executor to give each the member and name it in the summary; the frontmatter's `files_modified` cannot list them ahead of the type check.

## Search hits left untouched that the starting list does not name

| Place | Why it is left |
|---|---|
| `178-06-PLAN.md`, ruling 4 ("true for the password fact (plan 178-04)") | about the census of public functions; true under both forms |
| `178-07-PLAN.md`, the step naming "an account with a password and a project-scope grant" | the recovery operation; does not touch the user-data read |
| `178-10-PLAN.md`, the `RegistrationModeSelector` step ("with the option's text") | an unrelated use of the words |
| `178-12-PLAN.md`, `expectNoMailAfter` ("when asked") | an unrelated use of the words |
| `178-24-PLAN.md`, "**The operator's round**: every item … with the option built and where the other option lands" | reports whatever is built; true under both forms |
| `178-04-PLAN.md`: the truth ending "(D-06; item J1)", ruling 1, the source-coverage row `| CONTEXT |`, the run-evidence line naming `178-04-close` | each true under both forms |
| `178-14-PLAN.md`: the source-coverage rows `| CONTEXT |` and `| RESEARCH |`, and the context block's reading list naming § *J1* | the sources are not edited; ruling 11 says which reading stands |
| `178-VALIDATION.md`: the rows `| 178-04-02 |` and `| 178-14-02 |` | their behaviour cells are true under both forms |

## Listed places the search no longer found

None. Every anchor of § *Sites found on the planning day* was found exactly once.

## Commits

| Task | Commit | Subject |
|---|---|---|
| 1 | `7babaf8f5` | docs(178): the reading command takes the operator's ticked (b) on H1 as applied and halts on every other state of it |
| 2 | `7f8b893fa` | docs(178): the plans changed to J1 (b) — the password fact is filled on every read of the user-level data and the method's option goes; each Admin job poll and page load makes one more round trip |
| 3 | `d2c890bf7` | docs(178): section H read on 2026-10-11 — H1 (b), H38 (a) accepted, every other item and the UI contract's thirty proposals at their recommended options; the phase is ready to execute |

Commit 3 holds the decision document alone. Measured: `git rev-list --count` from the base to HEAD is 3.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] The dictated `stopped_at` sentence broke the state file's frontmatter for a strict YAML parser**

- **Found during:** Task 3, after its block had exited 0
- **Issue:** the plan's text reads "ready to execute: the operator read…". A colon followed by a space inside an unquoted scalar is not valid YAML: the `yaml` package rejected the frontmatter ("Nested mappings are not allowed in compact mappings"), and it parsed the file as it was before the edit. The planning tool's own reader took the line whole either way.
- **Fix:** the colon became a dash — "ready to execute — the operator read…". Nothing else of the sentence changed.
- **Files modified:** `.planning/STATE.md` (uncommitted, as instructed)
- **Checked:** the `yaml` package parses the file; `frontmatter.get` exits 0; Task 3's block exits 0 again.

### Not done, on the dispatch's instruction

- `.planning/STATE.md`, this summary and the quick plan are not committed.
- No state command of the planning tool was run: each would change the state file outside the four keys, which Task 3's block refuses. `.planning/ROADMAP.md` is untouched.

## For the orchestrator — consequences of (b) this plan settled without a ruling

1. **The narrowed gate type goes.** The gate list and `firstNeededGate` take `BasicUserData`; the type-level case is "a user object without the member is not assignable".
2. **A failed read of the fact fails the Admin identity check too** — and the Admin App's protected layout (item 1 of § *Found beyond the starting list*). Stated in plan 178-04's truth and in T-178-20.
3. **Plan 178-04's closing gate set gains the row `integration`** — seven rows — and Task 3 gains one case in `supabaseDataWriter.integration.test.ts` and Task 2's precondition line.
4. **T-178-22 is `accept`**, citing the ruling and its date.
5. **The index row's cell** reads "Planned; read 2026-10-11".
6. **The first full E2E run over plan 178-04 Task 3's commit is still `178-05-close`.** From that commit every signed-in load of both apps makes the new read, and between it and `178-05-close` the evidence is the unit suite and the integration row.

## Not verified

- **The rewritten verify blocks of plans 178-01, 178-04 and 178-14 were parsed, not run** (`bash -n` on each block, `node --check` on each script inside one). They run when Phase 178 does.
- **`178-read-rulings.mjs` does not exist yet.** The rule was seen deciding on a scratch patch of Phase 177's reader, which is the executable statement of it; the file plan 178-01 writes was not.
- **Plan 178-14's check of the load** now looks for `getBasicUserData()`, a string the load holds today, so that link no longer tells the task's change from the tree before it. The plan named this change exactly; what holds the load's behaviour is the two server cases of `layout.server.test.ts`.

## Self-Check: PASSED

- `261011-ujg-BASE` is tracked and names a commit.
- `7babaf8f5`, `7f8b893fa` and `d2c890bf7` are ancestors of HEAD.
- `git status --short` shows the state file modified, the quick plan and this summary untracked, and `CAND-APP-PLAN.md` untracked and untouched; nothing else.
- Nothing outside `.planning/` differs from the base.
