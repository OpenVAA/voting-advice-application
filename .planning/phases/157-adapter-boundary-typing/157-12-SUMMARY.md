---
phase: 157-adapter-boundary-typing
plan: 12
subsystem: api-adapter
tags: [dataWriter, adminWriter, supabase, interface-shape, admin-jobs, selector, svelte5]

requires:
  - phase: 157-11
    provides: "the swept `authToken` surface — both server feature files are already at 0 occurrences, which is what made this plan's repoint a clean import swap rather than a credential-threading edit"
  - phase: 157-09
    provides: "`157-AUTH-SHIM-DISPOSITION.md` and its ⚠ CORRECTION block, which released the class-4 MUST-NOT-SWEEP on the two feature files"
provides:
  - "`apps/frontend/src/lib/api/adminWriter.ts` — the fourth one-line selector, and the first production consumer `SupabaseAdminWriter` has ever had"
  - "`updateQuestion` / `insertJobResult` removed from the `DataWriter` interface, the `UniversalDataWriter` abstract contract, its public wrappers and the Supabase implementation"
  - "the measured correction that `merge_custom_data` is not the RPC's name — it is `merge_question_custom_data`, and its adapter call sites went 2 -> 1"
  - "the measured correction that neither server feature file called any writer method other than these two"
affects: [156 merge_question_custom_data rename, 157-17 logging codemod, 157-18 phase E2E gate, 158 adapter-boundary worklist]

actuals:
  tokens: 18900
  tasks: 3
  commits: 3

tech-stack:
  added: []
  patterns:
    - "Repoint-then-delete across two commits, with `typecheck` green at the seam: every caller moves while both implementations still exist, so an incomplete repoint is a named compile error rather than a runtime surprise."
    - "One preparation step, widened rather than duplicated: `prepareDataWriter` became generic over `UniversalAdapter` so a second writer could share it, instead of the admin writer acquiring an initialisation story of its own."

key-files:
  created:
    - "apps/frontend/src/lib/api/adminWriter.ts"
  modified:
    - "apps/frontend/src/lib/contexts/utils/prepareDataWriter.ts"
    - "apps/frontend/src/lib/contexts/admin/adminContext.svelte.ts"
    - "apps/frontend/src/lib/contexts/admin/adminContext.type.ts"
    - "apps/frontend/src/lib/server/admin/features/condenseArguments.ts"
    - "apps/frontend/src/lib/server/admin/features/generateQuestionInfo.ts"
    - "apps/frontend/src/lib/api/adapters/supabase/dataWriter/supabaseDataWriter.ts"
    - "apps/frontend/src/lib/api/base/universalDataWriter.ts"
    - "apps/frontend/src/lib/api/base/dataWriter.type.ts"
    - "apps/frontend/src/lib/api/adapters/supabase/utils/mapRow.ts"

key-decisions:
  - "The admin writer needs the SAME preparation as the data writer, measured, not assumed: `supabaseAdapterMixin`'s `get supabase()` throws `'Supabase client not initialized. Call init() first.'`, and `SupabaseAdminWriter` reaches `this.supabase` in every method. So Task 1's second branch applies — the selector is a plain one-line re-export and the call sites keep an init step."
  - "`prepareDataWriter` was widened to `<TWriter extends UniversalAdapter>(writer: TWriter): Promise<TWriter>` rather than duplicated. Widening the ONE existing helper is the opposite of the plan's prohibited 'second initialisation contract'; a private init inside adminContext would have been that second contract."
  - "The two server feature files dropped the `dataWriter` import ENTIRELY, because measurement showed they called no other writer method. The plan asserted they did."
  - "`adminContext` types its two repointed wrappers against `typeof adminWriter` rather than a `DataWriter`-style interface, because `SupabaseAdminWriter` has no base interface. Logged as WINDOWS 202."

patterns-established:
  - "When a plan's acceptance grep cites a symbol name, run it before trusting the count it predicts. `rpc('merge_custom_data'` returns 0 both before and after this plan; the real RPC is `merge_question_custom_data`, and only re-measuring turned a vacuously-passing criterion into a real one."

requirements-completed: [REVIEW-ADP-04]

coverage:
  - id: C1
    description: "`updateQuestion` and `insertJobResult` are gone from all four declaration sites each — implementation, `protected abstract`, public wrapper and interface member — and the `ADMIN METHODS` TODO block with them."
    requirement: "REVIEW-ADP-04"
    verification:
      - kind: other
        ref: "grep -c '_updateQuestion|_insertJobResult' supabaseDataWriter.ts -> 0; grep -c '...|updateQuestion|insertJobResult' universalDataWriter.ts -> 0; grep -c 'updateQuestion|insertJobResult' dataWriter.type.ts -> 0; grep -c 'ADMIN METHODS' supabaseDataWriter.ts -> 0"
        status: pass
      - kind: other
        ref: "yarn workspace @openvaa/frontend typecheck -> COMPLETED 2692 FILES 0 ERRORS 0 WARNINGS"
        status: pass
    human_judgment: false
  - id: C2
    description: "Every former caller reaches the same behaviour through `SupabaseAdminWriter`, whose two methods are call-for-call duplicates of the deleted ones."
    requirement: "REVIEW-ADP-04"
    verification:
      - kind: other
        ref: "grep -rn 'dataWriter.updateQuestion|dataWriter.insertJobResult' apps/frontend/src -> 0 lines; grep -rn 'dataWriter' apps/frontend/src/lib/server/admin/features/ -> 1 line, a `dataWriter.type` TYPE import only"
        status: pass
      - kind: unit
        ref: "yarn workspace @openvaa/frontend test:unit -> 55 files / 917 tests passed, matching the 917 baseline exactly; supabaseAdminWriter.test.ts unchanged and green"
        status: pass
    human_judgment: false
  - id: C3
    description: "Phase 156's rename-or-generalise surface is halved: one adapter call site of the question-custom-data RPC survives, down from two."
    requirement: "REVIEW-ADP-04"
    verification:
      - kind: other
        ref: "grep -rn \"rpc('merge_question_custom_data'\" apps/frontend/src/lib/api -> 1 (supabaseAdminWriter.ts:25), was 2"
        status: pass
    human_judgment: false
  - id: C4
    description: "The admin argument-condensation and question-info job flows still run end to end."
    requirement: "REVIEW-ADP-04"
    verification:
      - kind: e2e
        ref: "full E2E suite at the 157-18 phase gate — the plan's declared `backstop` truth"
        status: unknown
    human_judgment: true
    rationale: "Both flows now construct their writer from a different module and call a different class. The classes are duplicates and the unit suite is green, but neither LLM-driven job has unit coverage, so only the live suite proves them. The orchestrator owns that gate."

duration: 25min
completed: 2026-08-30
status: complete
---

# Phase 157 Plan 12: Admin-Writer Selector and the Abstract-Interface Deletion Summary

**Removed `updateQuestion` and `insertJobResult` from the `DataWriter` contract at all four declaration sites each, after repointing ten callers onto `SupabaseAdminWriter` through a new one-line selector — and found along the way that the class had never had a single production consumer.**

## Performance

- **Duration:** ~25 min
- **Tasks:** 3/3
- **Commits:** 3 source commits (`9b13d50d3`, `1efc0c0ef`, `46657a730`)
- **Reach:** 10 files, +45 / -100 lines

## Task 1 — the selector (`9b13d50d3`)

### The two selectors side by side, as the plan asked

```ts
// apps/frontend/src/lib/api/dataWriter.ts
export { dataWriter } from './adapters/supabase/dataWriter';

// apps/frontend/src/lib/api/adminWriter.ts  (new)
export { adminWriter } from './adapters/supabase/adminWriter';
```

Byte-for-byte the same shape, and the same shape as `dataProvider.ts` and `feedbackWriter.ts`. The `lib/api/` seam is now four one-line selectors.

### Does the admin writer need the same preparation? YES — measured, not assumed

The plan set this as a fork with two branches. The evidence decides the second one.

| Fact | Measured |
| --- | --- |
| `adapters/supabase/adminWriter/index.ts` | `export const adminWriter = new SupabaseAdminWriter();` |
| `adapters/supabase/dataWriter/index.ts` | `export const dataWriter = new SupabaseDataWriter();` |
| The two index modules | **identical in contract** — both construct and export a plain instance. Neither is a promise. |
| `supabaseAdapter.ts` `get supabase()` | `if (!this.#supabase) throw new Error('Supabase client not initialized. Call init() first.');` |
| `SupabaseAdminWriter`'s method bodies | reach `this.supabase` in all three methods |

So the admin writer is **not** preparation-free. Its `init({ fetch })` is what populates `#supabase` via the mixin, exactly as the data writer's does. The `await`-and-prepare idiom the callers use is therefore preserved rather than dropped.

**The `await` in the feature files was never awaiting a promise.** `condenseArguments.ts` read `import { dataWriter as dataWriterPromise }` then `const dataWriter = await dataWriterPromise;` — `await` on a plain instance. The name `dataWriterPromise` was already false before this plan; the repoint removes both it and the vacuous `await`.

### One preparation contract, widened — not two

`prepareDataWriter` was typed `(dataWriter: UniversalDataWriter) => Promise<UniversalDataWriter>`. `SupabaseAdminWriter extends supabaseAdapterMixin(UniversalAdapter)` and is **not** a `UniversalDataWriter`, so the existing helper could not accept it.

The plan forbids "a second initialisation contract". Duplicating the helper's three steps inside `adminContext` would have been exactly that, so instead the one helper was widened:

```ts
export async function prepareDataWriter<TWriter extends UniversalAdapter>(writer: TWriter): Promise<TWriter>
```

Existing callers are unaffected — the generic infers each concrete writer, and the return type is now *narrower* than the old wide `Promise<UniversalDataWriter>`. All 29 call sites across 7 files compile untouched, including the two `vi.mock`ed test files. See Deviation 1.

## Task 2 — the ten repointed callers (`1efc0c0ef`)

| Site | Count | What changed |
| --- | --- | --- |
| `adminContext.svelte.ts` | 2 | both wrappers now `prepareDataWriter(adminWriter).then((aw) => aw.…)`; types moved to `Parameters<typeof adminWriter.…>[0]` |
| `adminContext.type.ts` | 2 declarations | same type move; the section header now says which two wrap the admin writer |
| `condenseArguments.ts` | 1 `updateQuestion` + 3 `insertJobResult` | import swapped whole; `const dataWriter = await dataWriterPromise; dataWriter.init({ fetch });` collapsed to `adminWriter.init({ fetch });` |
| `generateQuestionInfo.ts` | 1 `updateQuestion` + 3 `insertJobResult` | structurally identical |
| `supabaseAdminWriter.test.ts` | 0 | already exercises both through the admin writer; needed no repointing, as the plan predicted |

**The option shapes were confirmed identical before switching, not after.** `SupabaseAdminWriter.updateQuestion({ id, data: { customData } }: SetQuestionOptions)` and `insertJobResult({ data }: InsertJobResultOptions)` take the same named types the deleted methods took, so no call was adapted. The two implementations are also duplicates in what they call: the same `merge_question_custom_data` RPC with the same arguments, and the same `elections` -> `admin_jobs` insert with the same twelve column mappings. T-157-29 (a repoint that changes which RPC is called) is mitigated by identity, not by argument.

**Typecheck was green at the seam with BOTH implementations still present** — `COMPLETED 2692 FILES 0 ERRORS` — which is the ordering guarantee T-157-30 asks for.

## Task 3 — the deletion (`46657a730`)

Four declaration sites per method, all removed:

| Site | `updateQuestion` | `insertJobResult` |
| --- | --- | --- |
| implementation, `supabaseDataWriter.ts` | `protected async _updateQuestion` | `protected async _insertJobResult` |
| `protected abstract`, `universalDataWriter.ts` | ✅ | ✅ |
| public wrapper, `universalDataWriter.ts` | ✅ | ✅ |
| interface member, `dataWriter.type.ts` | ✅ (with its 6-line JSDoc) | ✅ |

The `ADMIN METHODS` banner and its TODO were **deleted, not reworded**, per the plan and D-N1: the TODO said the implementations "satisfy the abstract contract on UniversalDataWriter", and there is no such abstract contract any more. Two now-unused type imports (`SetQuestionOptions`, `InsertJobResultOptions`) were dropped from `supabaseDataWriter.ts` and `universalDataWriter.ts`; both type ALIASES stay in `dataWriter.type.ts`, because `supabaseAdminWriter.ts` still uses them.

### For Phase 156's owner — the count, and a correction to the name

The plan's acceptance criterion reads `grep -rc "rpc('merge_custom_data'" apps/frontend/src/lib/api` returns 1, down from 2.

**Measured: that grep returns 0, both before and after.** There is no `merge_custom_data` RPC in this repository. The real name is **`merge_question_custom_data`**, and against the corrected string the criterion holds exactly as intended:

```
$ grep -rn "rpc('merge_question_custom_data'" apps/frontend/src/lib/api    # BEFORE
apps/frontend/src/lib/api/adapters/supabase/dataWriter/supabaseDataWriter.ts:368
apps/frontend/src/lib/api/adapters/supabase/adminWriter/supabaseAdminWriter.ts:25

$ grep -rn "rpc('merge_question_custom_data'" apps/frontend/src/lib/api    # AFTER
apps/frontend/src/lib/api/adapters/supabase/adminWriter/supabaseAdminWriter.ts:25
```

**2 -> 1.** Phase 156's criterion-6 rename-or-generalise surface in `lib/api` is now a single line, at `supabaseAdminWriter.ts:25`. Two further mentions of the name live in `supabaseAdminWriter.test.ts` (`:64`, `:72`) and two in that file's own comments; a rename must move those with it.

Had this been run as written, the criterion would have passed vacuously at 0 and recorded a halving that was never measured.

## `authToken` — before and after, and why the plan's prohibition 3 could not be met as worded

The plan's third prohibition says: *"MUST NOT alter the genuine `authToken` threading inside `condenseArguments.ts` and `generateQuestionInfo.ts`"*, verified by an unchanged occurrence count.

**There is no such threading. `157-11` swept both files under operator decision B1**, after `157-09`'s class-4 rows were amended in place (`5f4a031e2`). The prohibition describes a pre-`157-11` world.

The criterion is nonetheless satisfiable and was satisfied — the count is unchanged, at zero:

| File | Pre-plan | Post-plan |
| --- | --- | --- |
| `condenseArguments.ts` | **0** | **0** |
| `generateQuestionInfo.ts` | **0** | **0** |

## PROHIBITION 3 (the standing one) — untouched, proven by empty diff

The genuine `Authorization: Bearer` mechanism was neither released nor approached. All three class-5 files are byte-identical to this plan's base commit `03099c425`:

```
$ git diff --stat 03099c425 -- apps/frontend/src/lib/api/base/universalAdapter.ts \
    apps/frontend/src/lib/api/base/universalAdapter.type.ts \
    apps/frontend/src/lib/api/base/universalAdapter.test.ts
(no output — empty diff)

$ grep -c 'Bearer' apps/frontend/src/lib/api/base/universalAdapter.ts
1

$ grep -rn 'authToken' apps packages tests | wc -l
7        # 3 files, exactly class 5, unchanged from 157-11's close
```

`FetchOptions.authToken`, its `Bearer` construction and the `hasAuthHeaders` cache gate are intact.

## Verification — commands run, with their real output

| Command | Result |
| --- | --- |
| `grep -rn 'dataWriter.updateQuestion\|dataWriter.insertJobResult' apps/frontend/src` | **0 lines** |
| `grep -c '_updateQuestion\|_insertJobResult' supabaseDataWriter.ts` | **0** |
| `grep -c '_updateQuestion\|_insertJobResult\|updateQuestion\|insertJobResult' universalDataWriter.ts` | **0** |
| `grep -c 'updateQuestion\|insertJobResult' dataWriter.type.ts` | **0** |
| `grep -c 'ADMIN METHODS' supabaseDataWriter.ts` | **0** |
| `grep -c 'adminWriter' condenseArguments.ts` / `generateQuestionInfo.ts` | **6** / **6** (≥ 1 required) — the import, the `init`, one `updateQuestion` and three `insertJobResult` |
| `grep -c 'authToken'` on both feature files | **0** / **0**, unchanged |
| `grep -rn "rpc('merge_question_custom_data'" apps/frontend/src/lib/api` | **1**, down from 2 |
| `git diff --stat 03099c425 -- universalAdapter{,.type,.test}.ts` | **empty** |
| `yarn workspace @openvaa/frontend typecheck` | `COMPLETED 2692 FILES 0 ERRORS 0 WARNINGS 0 FILES_WITH_PROBLEMS` |
| `yarn workspace @openvaa/frontend test:unit` | `Test Files 55 passed (55) / Tests 917 passed (917)` |
| `yarn workspace @openvaa/app-shared test:unit` (inside the monorepo run) | `Tests 79 passed (79)` |
| `yarn test:unit` (monorepo) | `Tasks: 25 successful, 25 total`, **exit 0** |
| `yarn lint:check` | **exit 0**; frontend `✖ 1 problem (0 errors, 1 warning)` — the stated clean signature exactly |
| `yarn format:check` | **exit 0** — run from the repo root, separately from lint |
| `assert:comment-hygiene` (inside lint:check, POST-commit) | `files scanned: 1581 … 0 violation(s)` |
| adapter-boundary guard (157-15/16) | **did not fire.** 0 errors on the new selector; the allowlist was **NOT** extended |

### Baselines: measured vs recorded

| Gate | Recorded in the briefing | Measured |
| --- | --- | --- |
| frontend unit tests | 917 | **917** ✅ |
| app-shared unit tests | 79 | **79** ✅ |
| monorepo `test:unit` | 25/25 | **25/25** ✅ |
| frontend typecheck files | 2691 | **2691** before this plan, **2692** after — the +1 is `adminWriter.ts`, the only file added |
| lint clean signature | `✖ 1 problem (0 errors, 1 warning)` | **identical** ✅ |
| `rpc('merge_custom_data'` call sites | "2, going to 1" | **0, going to 0** — the RPC is named `merge_question_custom_data`; corrected above |

### Why the adapter-boundary guard did not need a new allowlist entry

`ADAPTER_BOUNDARY_ALLOWLIST` names `src/lib/api/dataProvider.ts`, `dataWriter.ts` and `feedbackWriter.ts` as "three one-line re-export selectors that name the adapter path". `adminWriter.ts` is the fourth of that kind, but it was measured to need no entry: the ban's `patterns` regex is `^\$lib/(supabase|api/adapters)(/|$)`, and the selector — like the other three — imports **relatively** (`'./adapters/supabase/adminWriter'`), which that regex does not match. Lint was run with the file committed and reported 0 errors. `eslint.config.mjs` was NOT edited, so no inherited ban could have been silently dropped and no `--print-config` re-verification was owed.

### What I could NOT verify

- **The full E2E suite.** Not run, per instruction; the orchestrator owns that gate at `157-18`. Both admin job flows now build their writer from a different module and call a different class, so C4 is genuinely open until it runs.
- **The two admin job screens end to end.** `condenseArguments` / `generateQuestionInfo` are LLM-driven and carry no unit coverage. Their `updateQuestion` / `insertJobResult` targets are duplicates of the deleted ones, and `supabaseAdminWriter.test.ts` covers the targets, but no test exercises the two features themselves.
- **The database, pgTAP, `db:lint:sql`, `yarn build`.** Not run, per instruction. No database object, migration or generated type was touched.

## Deviations from Plan

### 1. [Rule 3 — blocking] `prepareDataWriter` was widened; it is not in `files_modified`

The plan's Task-1 fork resolves to "it needs the same preparation", and the *only* helper implementing that preparation was typed to `UniversalDataWriter`, which `SupabaseAdminWriter` is not. Repointing `adminContext` was therefore impossible without either widening the helper or writing a second one.

Widened, not duplicated:

```ts
- export async function prepareDataWriter(dataWriter: UniversalDataWriter): Promise<UniversalDataWriter> {
+ export async function prepareDataWriter<TWriter extends UniversalAdapter>(writer: TWriter): Promise<TWriter> {
```

The two error strings and the JSDoc were rewritten from "DataWriter" to "writer" in the same edit, because both would otherwise have described a constraint the signature no longer carries — the D-N1 stale-explanation class.

**The name now under-describes the function.** A rename to `prepareAdapter` touches 29 sites across 7 files including a `vi.mock('../utils/prepareDataWriter')` path, which is well outside this plan and carries real risk to the 917-test baseline. Deferred and logged as **WINDOWS 201**.

### 2. [Measurement correction] The plan's claim that the feature files "also call other writer methods" is false

The plan's Task-2 action says *"Both files also call other writer methods and both thread a GENUINE admin auth token; leave every other line alone."* Measured, `grep -n 'dataWriter' <file>` before the edit returns, in each file, only: the import, the `await`, the `init`, and the four call sites under repoint. **No other writer method is called in either file.**

So the `dataWriter` import was removed **entirely** rather than kept alongside `adminWriter`. `generateQuestionInfo.ts` retains one `dataWriter.type` line — a `import type { TemporarySetQuestionData }`, a type import, not a writer use. Had the plan's premise been believed, both files would have carried a dead import past lint.

The second half of that sentence — the "GENUINE admin auth token" — is the already-amended class-4 claim; see the `authToken` section above.

### 3. [Rule 2 — stale-comment hygiene] `mapRow.ts`'s NB named the deleted method

`mapRow.ts:22` explained why `mapRowToDb` has no production call site by naming *"the one write that would want it, `SupabaseDataWriter._insertJobResult`"*. That symbol ceased to exist in the same commit. Re-anchored to `SupabaseAdminWriter.insertJobResult`, which is the surviving write and has the identical twelve spelled-out snake_case keys the NB describes. The reasoning is unchanged; only the referent moved.

### 4. [Observation, no code impact] `SupabaseAdminWriter` had zero production consumers before this plan

`grep -rn "adminWriter" apps/frontend/src` excluding its own directory returned **0 lines** at the plan's base commit. The class's JSDoc calls itself "the primary access point" and the deleted TODO block repeated the claim, but nothing outside its own test file had ever imported it. That is now true rather than aspirational: ten call sites reach it, through the selector.

### 5. [Tooling] The classifier block 157-11 reported did not recur

157-11 recorded that scripted Bash edits to `lib/server/admin/features/*` were denied by the auto-mode permission classifier. I used the `Edit` tool for those two files from the outset rather than testing the boundary, per the briefing. No block was hit and no workaround was attempted.

## Known Stubs

None. No placeholder, empty literal, TODO or FIXME was introduced — one TODO was **deleted**. No test was skipped, deleted or weakened: the frontend unit count is 917 -> 917 and no assertion was removed. Every `<verify>` block in the plan was run and is reported above with real output, except the E2E backstop the orchestrator owns.

Two items were appended to the cross-phase ledger as `deviation`, both naming/shape debt rather than defects:

- **WINDOWS 201** — `prepareDataWriter`'s name under-describes it after the widening.
- **WINDOWS 202** — `adminContext` types two wrappers against `typeof adminWriter`, i.e. against the concrete adapter instance, because `SupabaseAdminWriter` has no base interface the way `DataWriter` does. The other eight wrappers type against the interface. If Phase 158 gives the admin writer an interface, these two should move onto it.

## Threat Flags

None. This plan removes surface and introduces no new trust boundary.

Against the plan's register:

- **T-157-29** (a repoint that changes which RPC is called) — **mitigated by identity.** The two implementations were compared line by line before the switch: same `merge_question_custom_data` RPC, same `p_question_id` / `p_patch` arguments, same `elections` lookup, same twelve `admin_jobs` columns, same error strings. `supabaseAdminWriter.test.ts` passed unchanged.
- **T-157-22** (disturbing genuine admin-token threading) — **not applicable, and proven so.** Both files carry zero `authToken` occurrences before and after; `157-11` established there was never a credential to disturb.
- **T-157-30** (deleting an implementation before its callers move) — **mitigated by ordering.** Task 2's commit is green at 0 typecheck errors with both implementations present; Task 3 deletes only after.
- **T-157-SC** — holds: zero packages installed, zero dependency-manifest edits.

One posture note, stated because it is a real consequence rather than a theoretical one: the two admin job flows now run against a **module-level singleton** `adminWriter` whose `init({ fetch })` is called per invocation on the server. That is byte-for-byte the pattern they already used with the `dataWriter` singleton — the risk profile is unchanged, not newly introduced — but it is worth Phase 158's attention if server-side writer instances are ever revisited.

## Deferred / observed, not fixed

- **`condenseArguments.ts` and `generateQuestionInfo.ts` remain near-duplicates**, as 157-11 observed. This plan made the duplication tighter, not looser: both files now differ only in their LLM call and their result shape, with an identical `adminWriter.init` line and an identical `insertJobResult` completed/aborted/failed triplet. A shared job-record helper is the obvious extraction; still out of scope.
- **`SupabaseAdminWriter`'s own `TODO: Rename to something more descriptive`** is untouched. It sits in the class JSDoc, is not the block criterion 4 named, and its stated condition still holds.
- **`merge_question_custom_data` has four further mentions** outside the one surviving call: two assertions and two comments. Phase 156 must move them with any rename.
- **The pre-existing frontend lint warning** (`candidateContext.svelte.test.ts:19:9`) is untouched and unrelated.

## Self-Check: PASSED

Files:

- `apps/frontend/src/lib/api/adminWriter.ts` — FOUND (created, `9b13d50d3`)
- `prepareDataWriter.ts`, `adminContext.svelte.ts`, `adminContext.type.ts`, `condenseArguments.ts`, `generateQuestionInfo.ts` — FOUND (modified, `1efc0c0ef`)
- `supabaseDataWriter.ts`, `universalDataWriter.ts`, `dataWriter.type.ts`, `mapRow.ts` — FOUND (modified, `46657a730`)

Commits:

- `9b13d50d3` — FOUND
- `1efc0c0ef` — FOUND
- `46657a730` — FOUND

Post-commit integrity: `git diff --diff-filter=D --name-only HEAD~1 HEAD` reports **no file deletions** on any of the three commits. Working tree carries no new untracked files — `.planning/state.json` was untracked before this plan began and is not mine.
