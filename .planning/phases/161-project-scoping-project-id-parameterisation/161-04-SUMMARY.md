---
phase: 161-project-scoping-project-id-parameterisation
plan: 04
subsystem: api
tags: [supabase, postgrest, multi-tenancy, static-guard, storage, tdd]

requires:
  - phase: 161-project-scoping-project-id-parameterisation
    provides: 'the scopedFrom facade, the constructor-resolved projectId and the project-scoped query guard landed by plan 161-01'
  - phase: 161-project-scoping-project-id-parameterisation
    provides: 'the GUARDED_SOURCES promotion pattern and the PROJECT_SCOPED_RPCS disposition table as left by 161-02 and 161-02.1'
provides:
  - 'supabaseDataWriter.ts issues zero bare this.supabase.from( calls; nominations and both candidates accesses go through scopedFrom'
  - 'supabaseAdminWriter.ts issues zero bare this.supabase.from( calls; the admin_jobs insert goes through scopedFrom'
  - 'all four project-id derivation round-trips across the two writers are deleted, along with the #resolveProjectId helper'
  - 'both candidate Storage paths are built from the adapter configured project id'
  - "get_candidate_user_data's returned project_id is cross-checked against the configured id and a mismatch throws without naming either uuid"
  - 'DEFERRED_SOURCES is empty and GUARDED_SOURCES names all five adapter sources'
  - 'two independent gate assertions keeping the guard coverage closed'
affects: [161-05, 161-06, 161-07, 162-permissions-and-auth-model-refactor]

actuals:
  tokens: 31652
  tasks: 3
  commits: 6

tech-stack:
  added: []
  patterns:
    - 'A retained-chain mock: every PostgREST chain the mock client hands out is kept, so the project filter the scopedFrom facade appends to a builder the test never holds is observable'
    - 'Assert the count of tables a method reaches, not only the filters it applies: a deleted derivation round-trip is observable only as a table no longer touched at all'
    - 'An identity-scoped RPC result is cross-checked against configuration, and the mismatch message names the condition rather than either value'
    - 'A declared exception surface whose resting state is empty, with the not-yet-converted reason string forbidden by an automated assertion rather than by convention'
    - 'A coverage invariant derived twice — once inside the guard, once in the test suite — so deleting either derivation leaves it asserted'

key-files:
  created: []
  modified:
    - apps/frontend/src/lib/api/adapters/supabase/dataWriter/supabaseDataWriter.ts
    - apps/frontend/src/lib/api/adapters/supabase/dataWriter/supabaseDataWriter.test.ts
    - apps/frontend/src/lib/api/adapters/supabase/adminWriter/supabaseAdminWriter.ts
    - apps/frontend/src/lib/api/adapters/supabase/adminWriter/supabaseAdminWriter.test.ts
    - scripts/assert-project-scoped-queries.mjs
    - packages/dev-seed/tests/projectScopingGate.test.ts

key-decisions:
  - "The admin_jobs insert payload OMITS project_id rather than passing this.projectId: ScopedTableAccess.insert takes Omit<TablesInsert<T>, 'project_id'> and the facade supplies the column, so the plan's literal spelling is an excess-property type error. The 161-01 feedbackWriter conversion set this precedent."
  - "The no-write read-back this.supabase.from('candidates').select(columns) was converted too, though the plan's site list omits it: the plan's own acceptance criterion requires zero bare from( calls in the file."
  - "The guard's DEFERRED_SOURCES docblock does NOT quote the literal string 'conversion pending'. The plan's action text asks it to and the plan's own acceptance criterion forbids it; the criterion won, and the assertion over it was given an explicit positive control so its zero is a measurement rather than a search of an absent string."
  - 'The #resolveProjectId helper was deleted outright rather than re-pointed at this.projectId, because a helper whose whole body is a getter read is a name with nothing behind it.'
  - 'The get_candidate_user_data mismatch message names the condition and the remedy variable, interpolating neither the returned nor the configured uuid.'

patterns-established:
  - 'A gate assertion over a source slice proves the slice is the declaration before asserting what it lacks, so a renamed constant fails loudly instead of making the absence vacuous'
  - 'A declaration reader finds its closing bracket by balance, not by a newline-terminated line, so an EMPTY array reads the same as a populated one — emptiness being the state the assertion exists to hold'

requirements-completed: [PRESHIP-01]

coverage:
  - id: D1
    description: 'Every project-scoped table access in supabaseDataWriter.ts goes through scopedFrom, and no bare this.supabase.from( call remains'
    requirement: PRESHIP-01
    verification:
      - kind: unit
        ref: 'apps/frontend/src/lib/api/adapters/supabase/dataWriter/supabaseDataWriter.test.ts#project scoping (8 cases)'
        status: pass
      - kind: other
        ref: "comment-filtered grep on supabaseDataWriter.ts: this.supabase.from( -> 0, select('project_id') -> 0, scopedFrom( -> 3"
        status: pass
      - kind: other
        ref: 'node scripts/assert-project-scoped-queries.mjs -> exit 0 with the file inside GUARDED_SOURCES'
        status: pass
    human_judgment: false
  - id: D2
    description: 'All four project-id derivation round-trips across the two writers are deleted; no adapter method issues an extra SELECT to answer which project it is in'
    requirement: PRESHIP-01
    verification:
      - kind: unit
        ref: 'supabaseDataWriter.test.ts#preregisterWithApiToken sends the configured project id and reaches no table'
        status: pass
      - kind: unit
        ref: 'supabaseDataWriter.test.ts#setAnswers builds the Storage path from the configured project and reaches no table'
        status: pass
      - kind: unit
        ref: 'supabaseDataWriter.test.ts#updateEntityProperties builds the image path from the configured project and reaches only candidates'
        status: pass
      - kind: unit
        ref: 'supabaseAdminWriter.test.ts#inserts the job record with the configured project id and reaches no other table'
        status: pass
    human_judgment: false
  - id: D3
    description: 'Both candidate image Storage paths are built from the adapter configured project id rather than from a per-call candidates lookup, and both bucket uploads are untouched'
    requirement: PRESHIP-01
    verification:
      - kind: unit
        ref: 'supabaseDataWriter.test.ts#updateAnswers with File upload (6 cases, path prefix asserted against the configured uuid)'
        status: pass
      - kind: other
        ref: 'git diff HEAD~1 -- supabaseDataWriter.ts | grep -c "^-.*public-assets" -> 0 at the conversion commit; this.supabase.storage -> 1, public-assets -> 1, both unchanged'
        status: pass
    human_judgment: false
  - id: D4
    description: "get_candidate_user_data's returned project_id is cross-checked against the configured id; a mismatch throws and the message names neither uuid"
    requirement: PRESHIP-01
    verification:
      - kind: unit
        ref: 'supabaseDataWriter.test.ts#getCandidateUserData throws when the identity-scoped RPC answers with another project row'
        status: pass
      - kind: unit
        ref: 'supabaseDataWriter.test.ts#does not name either project in the mismatch message'
        status: pass
      - kind: unit
        ref: 'supabaseDataWriter.test.ts#getCandidateUserData accepts a row belonging to the configured project'
        status: pass
    human_judgment: false
  - id: D5
    description: 'The guard checks every adapter source, DEFERRED_SOURCES is empty of not-yet-converted entries, and two independent automated assertions keep it that way'
    requirement: PRESHIP-01
    verification:
      - kind: other
        ref: 'node scripts/assert-project-scoped-queries.mjs -> exit 0, 5 guarded / 0 deferred / 5 on disk / 5 raw client calls examined / 0 violations; --self-test -> exit 0'
        status: pass
      - kind: other
        ref: "red/green flip: injected bare this.supabase.from('admin_jobs') -> exit 1 naming supabaseAdminWriter.ts:76 and admin_jobs; git checkout -- -> exit 0"
        status: pass
      - kind: unit
        ref: 'packages/dev-seed/tests/projectScopingGate.test.ts#the project-scoped query guard covers every adapter source (2 cases, each flipped red independently)'
        status: pass
      - kind: other
        ref: 'TURBO_FORCE=true yarn lint:check -> exit 0'
        status: pass
    human_judgment: false
  - id: D6
    description: 'The converted writers behave correctly against a real PostgREST endpoint and a real Storage bucket in a running deployment'
    verification: []
    human_judgment: true
    rationale: 'Every static and unit-level link is proven, but the runtime hop — an authenticated candidate session issuing these writes against a live database, and an image landing under the configured project prefix in the bucket — needs a Supabase stack, a dev server and a candidate account this plan does not provision. Phase 161 batches that into plan 161-07, and workflow.human_verify_mode is end-of-phase.'

duration: 4h 1m
completed: 2026-09-04
status: complete
---

# Phase 161 Plan 04: Writer Project Scoping and Guard Closure Summary

**Both remaining writers converted to the single resolution site, all four project-id derivation round-trips and the `#resolveProjectId` helper deleted, the identity-scoped candidate RPC cross-checked against configuration, and the guard's `DEFERRED_SOURCES` emptied with two independent assertions keeping it empty.**

## Performance

- **Duration:** 4h 1m wall clock, of which the great majority was a harness watchdog stall (see _Issues Encountered_); the working time is closer to 25 minutes.
- **Started:** 2026-09-04T10:36:35Z
- **Completed:** 2026-09-04T14:38:06Z
- **Tasks:** 3
- **Files modified:** 6 (0 created, 6 modified across 6 commits)

## Accomplishments

- Neither writer issues a bare `this.supabase.from(` call. Comment-filtered greps return 0 for both, and both files are now inside the guard's checked set rather than beside it.
- The four derivation round-trips are gone: the `elections` lookup in `_preregister`, the `elections` lookup in `insertJobResult`, and the two `candidates` lookups that shared the `#resolveProjectId` helper. The helper is deleted, not re-pointed.
- Both candidate Storage paths are built from `this.projectId`. The two bucket uploads are untouched, which the conversion commit's own diff proves.
- `get_candidate_user_data` stays identity-scoped and takes no parameter, but its returned `project_id` is now compared with the configured one and a mismatch throws. The message names the condition and the variable to check; it interpolates neither uuid, which is asserted rather than described.
- `DEFERRED_SOURCES` is empty, `GUARDED_SOURCES` names all five adapter sources, and the string that would let a file park there indefinitely occurs nowhere in the guard.

## Task Commits

1. **Task 1 RED: failing tests for the scoped data writer** — `ef5497fc4` (test)
2. **Task 1 GREEN: scope supabaseDataWriter to the configured project** — `976741bb8` (feat)
3. **Task 2 RED: failing tests for the scoped admin writer** — `61d23e08e` (test)
4. **Task 2 GREEN: scope supabaseAdminWriter to the configured project** — `dde32f7d8` (feat)
5. **Task 3 follow-on: func-style repair on the new spec helper** — `3774f19b0` (fix)
6. **Task 3: close the guard's coverage and assert it stays closed** — `d2a71062e` (feat)

Nothing was pushed. Every push to the public repository remains the orchestrator's.

## TDD Gate Compliance

Both `tdd="true"` tasks ran RED before GREEN, and both REDs were observed failing for the intended reason rather than for an import or harness error:

- **Task 1 RED:** 17 failed / 38 passed. Every failure named a behaviour the conversion had not yet delivered — the configured project id in the Storage path prefix, the absent derivation queries, the project filter on `nominations` and `candidates`, and the cross-check throw. The 38 passes confirm the mock-harness change did not disturb the rest of the file.
- **Task 1 GREEN:** 55/55.
- **Task 2 RED:** 2 failed / 11 passed, both failures being `Failed to resolve project for election: not found` — the derivation still running.
- **Task 2 GREEN:** 13/13.

No REFACTOR commit was needed on either. The gate sequence `test(161-04) → feat(161-04)` is present twice in the log.

## Verification

Every gate was run as its own foreground command with its exit code read directly, never through a pipe.

| Gate | Result |
|---|---|
| `yarn workspace @openvaa/frontend test:unit` | **exit 0** — 91 files, 1630 tests; `supabaseDataWriter.test.ts` 55, `supabaseAdminWriter.test.ts` 13 |
| `yarn workspace @openvaa/dev-seed test:unit` | **exit 0** — 57 files, 634 tests; `projectScopingGate.test.ts` 7 (5 pre-existing + 2 new, both reported by name) |
| `node scripts/assert-project-scoped-queries.mjs` | **exit 0** |
| `node scripts/assert-project-scoped-queries.mjs --self-test` | **exit 0** |
| `TURBO_FORCE=true yarn typecheck` | **exit 0** — `svelte-check found 0 errors and 0 warnings` |
| `TURBO_FORCE=true yarn lint:check` | **exit 0** — 17-link chain, `assert:project-scoped-queries` present exactly once |
| `yarn build` | **exit 0** |

### The guard is not scanning an empty corpus

The clean run's zero is only worth something if the instrument harvested something. It did:

```
Project-scoped query guard — 5 guarded source(s), 0 deferred, 5 adapter source(s) on disk, 5 raw client call(s) examined, 0 violation(s).
```

The enumeration was reproduced independently of the guard, and returns the same five files:

```
adapter sources harvested from disk: 5
  - apps/frontend/src/lib/api/adapters/supabase/adminWriter/supabaseAdminWriter.ts
  - apps/frontend/src/lib/api/adapters/supabase/dataProvider/supabaseDataProvider.ts
  - apps/frontend/src/lib/api/adapters/supabase/dataWriter/supabaseDataWriter.ts
  - apps/frontend/src/lib/api/adapters/supabase/feedbackWriter/supabaseFeedbackWriter.ts
  - apps/frontend/src/lib/api/adapters/supabase/supabaseAdapter.ts
```

The five examined raw client calls are the five surviving `rpc(` sites — two in the data provider, two in the data writer, one in the admin writer — each of which check 4 matched against a written disposition. Zero of them are `from(` calls, which is what the conversion means.

### The recorded flip on `supabaseAdminWriter.ts`

**Red half**, with a bare `this.supabase.from('admin_jobs').select('id')` injected above the scoped insert:

```
[ERROR] scripts/assert-project-scoped-queries.mjs: apps/frontend/src/lib/api/adapters/supabase/adminWriter/supabaseAdminWriter.ts:76: bare `this.supabase.from('admin_jobs')`. `admin_jobs` carries a project_id foreign key to public.projects, so an unfiltered query against it returns other projects' rows. Use `this.scopedFrom('admin_jobs')` instead.
Project-scoped query guard — 5 guarded source(s), 0 deferred, 5 adapter source(s) on disk, 6 raw client call(s) examined, 1 violation(s).
exit 1
```

**Green half**, after `git checkout -- apps/frontend/src/lib/api/adapters/supabase/adminWriter/supabaseAdminWriter.ts`:

```
Project-scoped query guard — 5 guarded source(s), 0 deferred, 5 adapter source(s) on disk, 5 raw client call(s) examined, 0 violation(s).
exit 0
```

The examined count moving 5 → 6 → 5 is the second half of the proof: the guard did not merely change its verdict, it changed what it had to look at.

### Both new gate assertions were flipped red independently

Neither is accepted on its green alone.

- **`declares an exception surface holding no not-yet-converted entry`** — with `{ file: …dataWriter…, reason: 'conversion pending' }` restored into `DEFERRED_SOURCES`: `1 failed | 6 passed`. Restored: 7 passed.
- **`names every adapter source in GUARDED_SOURCES`** — with the `supabaseDataWriter.ts` entry removed from `GUARDED_SOURCES`: `1 failed | 6 passed`. Restored: 7 passed.

## Files Created/Modified

- `apps/frontend/src/lib/api/adapters/supabase/dataWriter/supabaseDataWriter.ts` — `_preregister`'s `elections` derivation deleted and the invite body carrying `this.projectId`; the `get_candidate_user_data` project cross-check; `nominations` and both `candidates` accesses through `scopedFrom`; `#resolveProjectId` deleted and both call sites passing `this.projectId`; the `#uploadCandidateFile` docblock's `@param` restated, since it named the deleted helper.
- `apps/frontend/src/lib/api/adapters/supabase/dataWriter/supabaseDataWriter.test.ts` — a retained-chain mock client, `eqCallsFor` and `tablesReached` helpers, seven existing cases re-pointed at the configured project, and a `project scoping` block of eight cases.
- `apps/frontend/src/lib/api/adapters/supabase/adminWriter/supabaseAdminWriter.ts` — the `elections` derivation and its error branch deleted; the `admin_jobs` insert through `scopedFrom`; docblock and inline comment restated to describe the current mechanism only.
- `apps/frontend/src/lib/api/adapters/supabase/adminWriter/supabaseAdminWriter.test.ts` — chain retention, `tablesReached` and `insertPayloadsFor` helpers, and an `insertJobResult` case asserting the inserted project id, the single table reached, and the survival of every other inserted column.
- `scripts/assert-project-scoped-queries.mjs` — both writers promoted into `GUARDED_SOURCES`; `DEFERRED_SOURCES` emptied and its docblock rewritten as a durable exception surface.
- `packages/dev-seed/tests/projectScopingGate.test.ts` — a balance-scanning `declarationOf` reader, an independent `adapterSourcesOnDisk` walk, and two assertions over the guard's own coverage.

## Decisions Made

See `key-decisions` in the frontmatter. The one with the longest reach is the `insert` payload shape: `ScopedTableAccess.insert` is typed `Omit<TablesInsert<TTable>, 'project_id'>` precisely so a caller cannot name a project at all, which means the facade — not the call site — is the single place the column comes from. Plans `161-05` and later should convert inserts the same way, and should read the plan text `insert({ project_id: this.projectId, … })` as satisfied by `insert({ … })` through `scopedFrom`.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 3 - Blocking] The plan's task-1 site list names four methods, three of which do not exist in the file**

- **Found during:** Task 1, reading `supabaseDataWriter.ts` in full.
- **Issue:** The plan directs edits to `_inviteCandidate`, `_insertJobResult` and `_updateQuestion`/`merge_custom_data` in the data writer. Measured at HEAD: the invite method is `_preregister`; there is no `_insertJobResult` and no `admin_jobs` reference anywhere in the file (`insertJobResult` lives only in the admin writer); there is no `_updateQuestion` and no `merge_custom_data` call — the admin writer calls `merge_question_custom_data`, which plan `161-01` had already corrected once for the same reason. The plan also describes two separate inline `candidates` `select('project_id')` derivations; measured, there is ONE shared `#resolveProjectId` helper called from two sites.
- **Fix:** Converted the sites that exist, matching the plan's stated behaviour rather than its method names. The helper was deleted outright rather than re-pointed.
- **Verification:** `this.supabase.from(` and `select('project_id')` both 0 in the file; 55/55 in the spec.
- **Committed in:** `976741bb8`

**2. [Rule 3 - Blocking] The plan's site list omits a site its own acceptance criterion requires converting**

- **Found during:** Task 1.
- **Issue:** `_updateEntityProperties` reads the row back when there is nothing to write, through `this.supabase.from('candidates').select(columns).eq('id', id).single()`. The plan's numbered list covers the `update` branch and not this one, but its acceptance criterion requires zero bare `from(` calls in the file, and RLS is explicitly not the guard for this path.
- **Fix:** Converted to `this.scopedFrom('candidates').select(...)`. A dedicated case asserts the project filter is applied on the no-write branch too.
- **Verification:** `supabaseDataWriter.test.ts#filters the no-write read-back by project as well as by id`.
- **Committed in:** `976741bb8`

**3. [Rule 3 - Blocking] The plan's `insert({ project_id: this.projectId, … })` spelling is a type error**

- **Found during:** Task 2.
- **Issue:** `ScopedTableAccess<TTable>['insert']` takes `Omit<TablesInsert<TTable>, 'project_id'>` and the facade adds the column itself. Passing `project_id` in the object literal is an excess-property error, and it would also mean two sources for one column.
- **Fix:** The payload omits `project_id`, following the `SupabaseFeedbackWriter` conversion landed by `161-01`. The stated behaviour — the row carries the adapter's configured project — is unchanged and is asserted directly on the recorded insert payload rather than inferred from the source.
- **Verification:** `svelte-check` 0 errors; `supabaseAdminWriter.test.ts` asserts `payload.project_id === PROJECT_ID`.
- **Committed in:** `dde32f7d8`

**4. [Rule 1 - Bug] `func-style` violation in the new mock helper, invisible until the full chain ran**

- **Found during:** the task-3 gate sweep.
- **Issue:** `const settle = () => …` inside the new `createChain` helper is an error under the repo's `func-style` rule. The three test runs before it all passed; only `yarn lint:check` sees it. This is the same class `161-01` hit with its own arrow helper.
- **Fix:** Converted to a nested function declaration; it still closes over the per-table response map.
- **Verification:** `TURBO_FORCE=true yarn lint:check` exit 0.
- **Committed in:** `3774f19b0`

**5. [Rule 3 - Blocking] Task 3's action text and its own acceptance criterion contradict each other**

- **Found during:** Task 3.
- **Issue:** The action says the `DEFERRED_SOURCES` docblock should state that an entry whose reason is `conversion pending` is forbidden — quoting the literal string. The acceptance criterion says `grep -c "conversion pending" scripts/assert-project-scoped-queries.mjs` must return 0. Both cannot hold.
- **Fix:** The criterion won, because it is the testable one and because a live grep for the phrase is what a future reader will actually run. The docblock states the rule without quoting the phrase. That creates a second hazard — an assertion searching for a string that occurs nowhere measures nothing — so the gate assertion proves its instrument first: it asserts the extracted slice really is the `DEFERRED_SOURCES` declaration and really ends in a closing bracket before asserting what it lacks, and the assertion was flipped red by reinstating a real entry.
- **Verification:** `grep -c "conversion pending"` → 0; the red flip above.
- **Committed in:** `d2a71062e`

### Measured corrections to filed documents

Each of these is a place where a document disagreed with the live tree. In every case the measurement was taken as authoritative and the document is corrected here rather than silently satisfied.

- **The plan's objective says "six project-id derivation round-trips across the two writers".** Measured: **four call sites** through three code blocks — one `elections` lookup in `_preregister`, one `elections` lookup in `insertJobResult`, and two calls to the single shared `#resolveProjectId`. All four are deleted; the count in the objective is the thing that was wrong.
- **`161-PATTERNS.md` § 8 cites five derivation sites in `supabaseDataWriter.ts` at `:125-139`, `:287-293`, `:339-347`, `:400-408`.** Those line numbers no longer locate the described code, and the file carries three call sites, not four. The section was read for its *pattern*, which is accurate, and not for its citations.
- **Task 1's acceptance criterion "the comment-filtered grep for `storage` returns exactly 2".** Measured **6 before the conversion and 6 after** — unchanged, which is the property the criterion was reaching for. The criterion is written against a file shape that no longer exists: it counts two byte-for-byte duplicated upload blocks, which requirement WR-06 collapsed into the single `#uploadCandidateFile` helper. The invariant that actually holds, and was checked in both directions: `this.supabase.storage` → **1**, `public-assets` → **1**, and the conversion commit deletes no line containing `public-assets` (`git diff HEAD~1 … | grep -c "^-.*public-assets"` → 0). **The code was not bent to reach the number 2.**
- **Task 3's acceptance criterion says "0 violations across four guarded adapter sources", then lists five files.** Measured: **five** guarded sources, which is also what the guard's own directory enumeration yields. The criterion's prose count is stale; its file list is right.

---

**Total deviations:** 5 auto-fixed (1 bug, 4 blocking) plus 4 measured document corrections.
**Impact on plan:** every deviation was forced by a plan premise that is false at HEAD, and none dropped a stated behaviour or added scope. The one carrying downstream weight is deviation 3 — later plans converting an `insert` must omit `project_id` from the payload.

## Issues Encountered

- **The run was interrupted by a harness watchdog and resumed.** `TURBO_FORCE=true yarn lint:check` exceeded the 600-second foreground limit and the turn was killed with no output while it ran. Nothing was lost: tasks 1 and 2 were already committed, and task 3's edits were intact but uncommitted in the working tree. The gate itself had in fact completed with **exit 0**; its output was recovered from the backgrounded job's file. Work resumed at task 3's gating. The lesson for the remaining plans in this phase: run `yarn lint:check` in the background and poll its output file, rather than blocking a turn on it.
- **A gate that runs green three times can still be red.** The `func-style` violation survived three targeted vitest runs and a full `typecheck`. Only the whole `lint:check` chain sees it, and the chain is the slowest gate — which is exactly why it is tempting to skip. It was not skipped, and it caught something.
- **The plan's own two halves disagreed once** (deviation 5), and its site inventory was stale in three separate ways (deviations 1 and 2, plus the corrections above). Reading the source in full before editing is what surfaced all of it; the plan's `<read_first>` instruction to read "the whole file" is load-bearing and was followed.

## User Setup Required

None. This plan adds no environment variable, no dependency and no external service. `PUBLIC_PROJECT_ID`, which every conversion here depends on, was documented by plan `161-01` and is unchanged.

## Next Phase Readiness

- **Criterion 2's adapter half is complete.** Every one of the five adapter sources is inside the guard's checked set, `DEFERRED_SOURCES` is empty, and the emptiness is held by two independent automated assertions plus the guard's own check 5.
- **Ready for `161-05`**, which touches a disjoint file set (`.env.example`, `packages/dev-seed/src/**`, `tests/**`). Nothing in that set was edited here.
- **`161-07`** inherits the unproven half: these writes have not been exercised against a live PostgREST endpoint or a live Storage bucket. That is deliverable D6 and is deliberately batched to the end-of-phase run.
- **A note for whoever converts an `insert` next:** read `insert({ project_id: …, … })` in any remaining plan text as `insert({ … })` through `scopedFrom`. The facade owns the column and the type forbids passing it.
- **Nothing was pushed.**

---

_Phase: 161-project-scoping-project-id-parameterisation_
_Completed: 2026-09-04_

## Self-Check: PASSED

- All 6 modified source files and the SUMMARY verified present on disk with `[ -f ]`.
- All 7 commit hashes verified reachable with `git log --oneline --all`.
- `git diff --diff-filter=D --name-only ef5497fc4~1 HEAD` is empty: no file was deleted by this plan.
- No stubs, no skipped tests, no unrun `<verify>` command. Every gate the plan names was run to a directly-read exit code.
