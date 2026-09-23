---
phase: 161-project-scoping-project-id-parameterisation
plan: 01
subsystem: api
tags: [supabase, postgrest, sveltekit, vite, env, multi-tenancy, static-guard]

requires:
  - phase: 156-supabase-schema-corrections
    provides: the settled table names and columns the project-scoped table list is declared against
  - phase: 163-ci-evidence-and-gates
    provides: the lint:check guard chain this plan appends its own link to
provides:
  - PUBLIC_PROJECT_ID documented in .env.example and plumbed into the running frontend
  - resolveProjectIdEnv() in apps/frontend/vite.projectIdEnv.ts
  - '#projectId, get projectId() and scopedFrom() on supabaseAdapterMixin, with fail-fast on empty and on a malformed uuid'
  - ProjectScopedTable and ScopedTableAccess in supabaseAdapter.type.ts
  - SupabaseFeedbackWriter converted off its app_settings derivation
  - scripts/assert-project-scoped-queries.mjs, a blocking link of yarn lint:check
affects: [161-02, 161-03, 161-04, 161-05, 162-permissions-and-auth-model-refactor]

actuals:
  tokens: 59075
  tasks: 3
  commits: 5

tech-stack:
  added: []
  patterns:
    - 'Named-key env plumbing: a vite-config-time module copies two literally named keys from the repo-root .env into process.env, so SvelteKit''s own loadEnv over apps/frontend picks them up without widening envDir'
    - 'Single-resolution-site fail-fast: the project id is resolved once, at adapter construction, with no code-level default anywhere'
    - 'Inverted static guard: forbid the raw call shape rather than assert the presence of a filter, so the read path is covered by construction'
    - 'Self-testing guard: a guard whose real corpus is clean by construction ships committed fixtures and a --self-test, so its own firing stays observable'

key-files:
  created:
    - apps/frontend/vite.projectIdEnv.ts
    - apps/frontend/vite.projectIdEnv.test.ts
    - apps/frontend/src/lib/api/adapters/supabase/supabaseAdapter.test.ts
    - apps/frontend/src/lib/api/adapters/supabase/feedbackWriter/supabaseFeedbackWriter.test.ts
    - scripts/assert-project-scoped-queries.mjs
    - scripts/fixtures/project-scoped-queries/violation.fixture.ts
    - scripts/fixtures/project-scoped-queries/clean.fixture.ts
    - packages/dev-seed/tests/projectScopingGate.test.ts
    - .planning/phases/161-project-scoping-project-id-parameterisation/161-01-DECISION.md
  modified:
    - .env.example
    - package.json
    - apps/frontend/vite.config.ts
    - apps/frontend/tsconfig.json
    - apps/frontend/src/lib/utils/constants.ts
    - apps/frontend/src/lib/i18n/tests/__mocks__/env-dynamic-public.ts
    - apps/frontend/src/lib/api/adapters/supabase/supabaseAdapter.ts
    - apps/frontend/src/lib/api/adapters/supabase/supabaseAdapter.type.ts
    - apps/frontend/src/lib/api/adapters/supabase/feedbackWriter/supabaseFeedbackWriter.ts

key-decisions:
  - 'PUBLIC_PROJECT_ID is the one canonical name for both the frontend and the Deno function (operator answer: one-name); DR-1 stands unamended'
  - 'Roadmap criterion 1''s literal PROJECT_ID is accepted as undeliverable for the frontend and the PUBLIC_ form is the satisfied criterion'
  - 'E2E_PROJECT_ID stays a committed constant with its .env.example line commented out, because two loaders auto-load that file and a live line would re-point yarn db:seed:default'
  - 'The project id is resolved in the mixin CONSTRUCTOR, not an init() method: the adapter has no init() at HEAD, and the constructor is the single resolution site the plan intends'
  - 'scopedFrom returns a four-operation facade rather than a filtered query builder, because PostgrestQueryBuilder has no .eq() and the plan''s one-line form is unimplementable'
  - 'The mixin keeps its explicit Constructor<SupabaseAdapter> & TBase return type; inferring it instead makes svelte-check exhaust a 4GB heap'
  - 'NON_PROJECT_SCOPED_TABLES is seeded with the six measured non-scoped public tables rather than left empty, since the set was derived from the generated schema and is auditable'

patterns-established:
  - 'Chain edits read the lint:check value at execution time, append one link, and prove the pre-edit link set survived'
  - 'A guard whose real corpus yields zero sites reports the examined-site count in its summary line, so a zero is legible rather than reassuring'

requirements-completed: [PRESHIP-01]

coverage:
  - id: D1
    description: 'PUBLIC_PROJECT_ID exists, is documented in .env.example with the default project id, and is carried from the repo-root env file into the Vite process environment'
    requirement: PRESHIP-01
    verification:
      - kind: unit
        ref: 'apps/frontend/vite.projectIdEnv.test.ts#resolveProjectIdEnv (5 cases)'
        status: pass
      - kind: other
        ref: "grep -nE '^PUBLIC_PROJECT_ID=00000000-0000-0000-0000-000000000001$' .env.example"
        status: pass
    human_judgment: false
  - id: D2
    description: 'The resolved project id reaches the running frontend (browser and SSR) through $env/dynamic/public, with no shell prefix'
    requirement: PRESHIP-01
    verification: []
    human_judgment: true
    rationale: 'The static chain is proven (constants reads $env/dynamic/public; vite.config calls resolveProjectIdEnv; the unit tests prove the copy). What is NOT proven here is the end-to-end runtime hop, which needs a running Supabase stack and a dev server this plan does not provision. Carried as the tracer task''s <manual> half, batched for end-of-phase UAT per workflow.human_verify_mode = end-of-phase.'
  - id: D3
    description: 'supabaseAdapterMixin resolves the project id once with fail-fast: it throws on empty and on a non-canonical uuid, normalises whitespace and case, and honours a config override'
    requirement: PRESHIP-01
    verification:
      - kind: unit
        ref: 'apps/frontend/src/lib/api/adapters/supabase/supabaseAdapter.test.ts#supabaseAdapterMixin project scoping (11 cases)'
        status: pass
    human_judgment: false
  - id: D4
    description: 'SupabaseFeedbackWriter issues exactly one Supabase call and inserts the adapter''s project id, with its app_settings derivation deleted'
    requirement: PRESHIP-01
    verification:
      - kind: unit
        ref: 'apps/frontend/src/lib/api/adapters/supabase/feedbackWriter/supabaseFeedbackWriter.test.ts#SupabaseFeedbackWriter (5 cases)'
        status: pass
      - kind: other
        ref: "grep -vE '^\\s*(//|\\*|/\\*)' .../supabaseFeedbackWriter.ts | grep -c app_settings  -> 0"
        status: pass
    human_judgment: false
  - id: D5
    description: 'A static guard catches an unscoped project-scoped query at the call site and blocks yarn lint:check'
    requirement: PRESHIP-01
    verification:
      - kind: other
        ref: 'node scripts/assert-project-scoped-queries.mjs (exit 0) and --self-test (exit 0)'
        status: pass
      - kind: other
        ref: 'red/green flip: injected bare this.supabase.from(''feedback'') -> exit 1 naming file:23 and the table; git checkout -- -> exit 0'
        status: pass
      - kind: unit
        ref: 'packages/dev-seed/tests/projectScopingGate.test.ts#the project-scoped query guard is wired into lint:check (5 cases)'
        status: pass
      - kind: other
        ref: 'TURBO_FORCE=true yarn lint:check (exit 0, guard summary line observed in its output)'
        status: pass
    human_judgment: false
  - id: D6
    description: 'Two follow-up todos filed for the root-env surface this phase deliberately does not widen'
    verification:
      - kind: other
        ref: 'ls .planning/todos/pending/2026-08-28-ci-frontend-does-not-read-root-env.md .planning/todos/pending/2026-08-28-vite-envdir-root-would-fix-six-empty-constants.md'
        status: pass
    human_judgment: false

duration: 34min
completed: 2026-09-04
status: complete
---

# Phase 161 Plan 01: Project-id parameterisation tracer Summary

**`PUBLIC_PROJECT_ID` documented, plumbed from the repo-root `.env` through Vite into `$env/dynamic/public`, resolved once with fail-fast at `supabaseAdapterMixin`'s constructor, one real write path converted to `scopedFrom`, and a self-testing static guard wired into `yarn lint:check`.**

## Performance

- **Duration:** 34 min
- **Started:** 2026-09-04T08:35:03Z
- **Completed:** 2026-09-04T09:09:22Z
- **Tasks:** 3
- **Files modified:** 24 (9 created, 15 modified across 5 commits)

## Accomplishments

- The canonical variable exists end to end as a static chain: `.env.example` → `vite.projectIdEnv.ts` → `process.env` → SvelteKit's own `loadEnv` → `$env/dynamic/public` → `constants.PUBLIC_PROJECT_ID` → `supabaseAdapterMixin`.
- The adapter resolves the project once and refuses to guess: empty and non-canonical values throw, naming the variable, the file to set it in, and the default uuid. There is no fallback anywhere in application code.
- `SupabaseFeedbackWriter` no longer depends on there being exactly one `app_settings` row; it went from two Supabase calls to one.
- `scripts/assert-project-scoped-queries.mjs` is a blocking link of `yarn lint:check`, with five fail-closed checks, committed fixtures, a `--self-test`, and a recorded red/green flip against a real adapter source.

## Task Commits

1. **Task 1: record the operator's one-way decisions** — `4dc765f04` (docs)
2. **Task 2 RED: failing tests** — `75422be41` (test)
3. **Task 2 GREEN: variable, plumbing, resolution, scoped insert** — `247b8d7bd` (feat)
4. **Task 3: the static guard, wired and proven** — `e53a74b6c` (feat)
5. **Task 3 follow-on: comment-hygiene fix on the newly tracked spec** — `076067d95` (docs)

Nothing was pushed. Every push to the public repository remains the orchestrator's.

## Task 1 — the operator's decision, recorded verbatim

Recorded on disk first, at `.planning/phases/.../161-01-DECISION.md`, committed as `4dc765f04`
**before any source file was modified**. The task's `<verify>` was satisfied and proven in both
directions: `git diff --name-only | grep -Ev '^\.planning/' | wc -l` returned `0`; appending a
newline to `package.json` made the same pipeline return `1` and name the file; `git checkout --`
returned it to `0`. The zero is therefore a measurement, not an empty instrument.

### Answer 1 — `one-name`

The canonical variable is **`PUBLIC_PROJECT_ID`**, read by BOTH the frontend and the Deno Edge
Function. DR-1 stands as written and is **not** amended. The `two-names` branch is **not** applied,
so plan `161-03` task 1 is **not** annotated to keep the Deno-side `DEFAULT_PROJECT_ID` — it renames.

Operator's reasoning, verbatim:

> "One physical name read by both the frontend and the Deno Edge Function: one grep, one documented
> line, one thing to configure per environment. The PUBLIC_ prefix is semantically honest — the
> project id appears in every client query and every storage path, so it is not a secret. Cost: any
> already-provisioned deployment's Edge-Function secret must be renamed from DEFAULT_PROJECT_ID, and
> criterion 1's literal string is not the variable's name."

### The criterion-1 deviation is ACCEPTED — read it as SATISFIED, not missed

ROADMAP criterion 1 names the literal `PROJECT_ID`. The delivered name is `PUBLIC_PROJECT_ID`.
**A verifier must read this as satisfying criterion 1.** The measured reason the literal name is
undeliverable for the frontend:

- SvelteKit's `kit.env.publicPrefix` defaults to `PUBLIC_`, and `apps/frontend/svelte.config.js`
  declares no `kit.env` block (verified at HEAD: its `kit` object carries only `adapter`, `alias`
  and `version`). An unprefixed name is therefore classified private and is unreadable in the
  browser, while the Supabase adapter constructs a browser client.
- Setting the prefix to `''` would publish every private root-`.env` key, including
  `IDENTITY_PROVIDER_CLIENT_SECRET`, `IDENTITY_PROVIDER_DECRYPTION_JWKS` and `IDURA_SIGNING_JWKS`.
  Rejected outright.

### Answer 2 — the E2E posture, CONFIRMED as specified

- `E2E_PROJECT_ID` = `00000000-0000-0000-0000-0000000000e2`, deliberately distinct from the
  default/seed project id `00000000-0000-0000-0000-000000000001`.
- Carried as a **committed constant** with its `.env.example` line **commented out**.
- Teardown is **create-if-absent** and never runs `DELETE FROM public.projects`; only run content is
  torn down.

**The commented-out line is load-bearing, not cosmetic.** `packages/dev-seed/src/cli/seed.ts`
auto-loads the repo-root `.env` via `process.loadEnvFile` and `tests/playwright.config.ts` calls
`dotenv.config()`, so a live line would silently re-point `yarn db:seed:default` — and therefore
`yarn db:reset-with-data` — at the E2E project, leaving a plain local dev session showing an empty
app. The committed `.env.example` block says so inline, in capitals.

## The guard's red/green flip, recorded

**Clean, before injection:**

```
Project-scoped query guard — 2 guarded source(s), 3 deferred, 5 adapter source(s) on disk, 0 raw client call(s) examined, 0 violation(s).
exit 0
```

**With a bare `this.supabase.from('feedback').select('id')` injected into
`feedbackWriter/supabaseFeedbackWriter.ts`:**

```
[ERROR] scripts/assert-project-scoped-queries.mjs: apps/frontend/src/lib/api/adapters/supabase/feedbackWriter/supabaseFeedbackWriter.ts:23: bare `this.supabase.from('feedback')`. `feedback` carries a project_id foreign key to public.projects, so an unfiltered query against it returns other projects' rows. Use `this.scopedFrom('feedback')` instead.
Project-scoped query guard — 2 guarded source(s), 3 deferred, 5 adapter source(s) on disk, 1 raw client call(s) examined, 1 violation(s).
exit 1
```

**After `git checkout -- <file>`: exit 0 again.** The same flip was repeated through the yarn alias
(`yarn assert:project-scoped-queries`) with the same two exit codes, proving the alias resolves.

### Why the guard also ships fixtures and a `--self-test`

The clean run above reports **0 raw client calls examined**. That is the correct outcome of the
conversion and it is also exactly the shape that "a zero from an empty instrument" describes: both
guarded sources reach the database only through `scopedFrom`, so a plain run cannot distinguish
"checked and clean" from "checked nothing". Three things close that gap, and all three are asserted:
the summary line prints the examined-site count so the zero is legible; `--self-test` runs checks 1,
3 and 4 over two committed fixtures with **exact** access counts (3 and 1), which is the positive
control proving the storage-bucket exclusion drops exactly one access per fixture rather than
silently dropping table accesses too; and the flip above exercises a real adapter source.

## The `lint:check` chain edit

The value was read at execution time and **one link appended**. Never rewritten, never reordered.

**Pre-edit snapshot (16 links):**

```
 1. turbo run lint
 2. eslint --flag v10_config_lookup_from_file tests
 3. yarn typecheck:tests
 4. yarn typecheck
 5. yarn assert:i18n-catalog-namespaces
 6. yarn assert:a11y-scan-wiring
 7. yarn assert:comment-hygiene
 8. yarn assert:edge-env-defaults
 9. yarn assert:declared-binaries
10. yarn assert:node-engine
11. yarn assert:env-pair-registry
12. yarn assert:schema-migration-parity
13. yarn assert:adapter-casts
14. yarn assert:cookie-names
15. yarn assert:no-session-in-loads
16. yarn assert:rpc-nullability
```

**Post-edit (17 links):** identical 1 to 16, plus `17. yarn assert:project-scoped-queries`.

**Difference, computed rather than eyeballed:** `LOST from snapshot: []`, `ADDED: ["yarn
assert:project-scoped-queries"]`. Exactly one link added, none lost. The plan's baseline of six links
was stale — the chain already carried sixteen when this ran, which is why the value was read rather
than assumed.

## Files Created/Modified

- `.env.example` — a `#### Project scoping` block with a live `PUBLIC_PROJECT_ID` and a commented-out `E2E_PROJECT_ID`, placed AFTER the cross-runtime pair block so the pair-registry guard's contiguity assertion is untouched.
- `apps/frontend/vite.projectIdEnv.ts` — `resolveProjectIdEnv({ mode, repoRoot, target })`; reads two literally named keys, never overwrites a non-empty target value, never invents one.
- `apps/frontend/vite.projectIdEnv.test.ts` — five cases over throwaway temp directories. Carries `// @vitest-environment node`, which is mandatory: importing `vite` loads esbuild, whose `TextEncoder` invariant is false under the project-wide jsdom environment.
- `apps/frontend/vite.config.ts` — one call, immediately after the existing `FRONTEND_PORT` read, which is left untouched.
- `apps/frontend/tsconfig.json` — a `files` entry for the two new root-level modules. `include` comes from the generated `.svelte-kit/tsconfig.json` and lists `vite.config.ts` but nothing beside it; `files` unions with `include` rather than replacing it, so the generated list stays authoritative.
- `apps/frontend/src/lib/utils/constants.ts` — an eleventh key in the existing flat `?? ''` idiom, with no throw (a throw here fires at import time for every server module that never touches the adapter).
- `apps/frontend/src/lib/i18n/tests/__mocks__/env-dynamic-public.ts` — seeded with the default project id.
- `apps/frontend/src/lib/api/adapters/supabase/supabaseAdapter.type.ts` — `ProjectScopedTable` (13 members), `ScopedTableAccess`, `projectId?` on the config, `projectId` and `scopedFrom` on the interface.
- `apps/frontend/src/lib/api/adapters/supabase/supabaseAdapter.ts` — `#projectId`, `resolveProjectId`, `get projectId()`, `scopedFrom()`, and the exported `tableBuilder` helper the type derivation reads.
- `apps/frontend/src/lib/api/adapters/supabase/feedbackWriter/supabaseFeedbackWriter.ts` — `app_settings` derivation deleted; docblock rewritten (its claim about a single-project deploy was now false).
- `scripts/assert-project-scoped-queries.mjs` + two fixtures — the guard.
- `package.json` — the `assert:project-scoped-queries` alias and one appended chain link.
- `packages/dev-seed/tests/projectScopingGate.test.ts` — five membership-not-position assertions.
- Two `.planning/todos/pending/` entries.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 3 - Blocking] The plan's `init()` resolution site does not exist at HEAD**

- **Found during:** Task 2, while reading `supabaseAdapter.ts`.
- **Issue:** The plan says the project id is resolved in `supabaseAdapterMixin.init()` and that the throw fires there. There is no `init()` on the mixin, on `UniversalAdapter`, or anywhere in the adapter tree — `grep -n "init(" apps/frontend/src/lib/api/base/universalAdapter.ts` returns nothing. The mixin configures itself in its **constructor**.
- **Fix:** Resolution and both throws were placed in the mixin constructor, which is the single resolution site the plan's intent names. Every stated behaviour is unchanged.
- **Files modified:** `apps/frontend/src/lib/api/adapters/supabase/supabaseAdapter.ts`
- **Verification:** `supabaseAdapter.test.ts`, 11 cases, all green.
- **Committed in:** `247b8d7bd`

**2. [Rule 3 - Blocking] `scopedFrom`'s one-line form is unimplementable; PostgREST's query builder has no `.eq()`**

- **Found during:** Task 2.
- **Issue:** The plan specifies `scopedFrom(table)` as `this.supabase.from(table).eq('project_id', this.projectId)`. Measured against the installed client, `PostgrestQueryBuilder` (`node_modules/@supabase/postgrest-js/src/PostgrestQueryBuilder.ts`) exposes only `select`, `insert`, `upsert`, `update` and `delete`. `.eq()` lives on `PostgrestFilterBuilder`, which those methods return. The plan's chain is a type error and a runtime error, and the plan's own contingency note ("if the installed client's types reject the chain") assumed the method existed.
- **Fix:** `scopedFrom` returns a four-operation facade — `select`/`update`/`delete` append `.eq('project_id', …)` to the filter builder, `insert` supplies `project_id` as a column because an insert carries no filter. The caller does not pass `project_id`. The facade is typed per table by `ScopedTableAccess<TTable>`, so converted call sites in later plans keep their real column types.
- **Files modified:** `supabaseAdapter.ts`, `supabaseAdapter.type.ts`
- **Verification:** typecheck 0 errors; `scopedFrom('feedback').select/delete/insert` asserted in `supabaseAdapter.test.ts`.
- **Committed in:** `247b8d7bd`

**3. [Rule 3 - Blocking] The four sibling adapter specs override the env stub inline, so seeding the stub alone did not keep them passing**

- **Found during:** Task 2.
- **Issue:** The plan's step 5 says seeding `__mocks__/env-dynamic-public.ts` keeps `supabaseDataProvider.test.ts`, `supabaseDataWriter.test.ts`, `supabaseAdminWriter.test.ts` and `universalAdapter.test.ts` passing without touching their call sites. Measured: all four adapter specs carry their own `vi.mock('$env/dynamic/public', …)`, which REPLACES the alias stub. Seeding the stub reaches none of them, and each would have thrown on the new fail-fast.
- **Fix:** `PUBLIC_PROJECT_ID` added to the four inline mocks as well as to the stub. (The fourth file is `supabaseAdapter.concurrency.test.ts`, not `universalAdapter.test.ts`, which carries no such mock.)
- **Files modified:** the four `*.test.ts` files above.
- **Verification:** 1612 frontend tests green.
- **Committed in:** `247b8d7bd`

**4. [Rule 3 - Blocking] Inferring the mixin's return type exhausts svelte-check's heap**

- **Found during:** Task 2.
- **Issue:** Putting `scopedFrom` on the class and letting TypeScript infer the mixin's return type (the natural way to preserve its per-table generic) made `svelte-check` die with `FATAL ERROR: Ineffective mark-compacts near heap limit` at ~4GB, twice, reproducibly.
- **Fix:** The explicit `Constructor<SupabaseAdapter> & TBase` annotation was kept, and `scopedFrom` was added to the `SupabaseAdapter` interface with an explicit `ScopedTableAccess<TTable>` type. A conformance type-assertion was tried and also OOMed, so it was dropped; the interface remains load-bearing because the annotation is what the mixin is checked against.
- **Files modified:** `supabaseAdapter.ts`, `supabaseAdapter.type.ts`
- **Verification:** `svelte-check found 0 errors and 0 warnings` over 2165 files.
- **Committed in:** `247b8d7bd`

**5. [Rule 3 - Blocking] The new root-level module was not in any tsconfig's file list**

- **Found during:** Task 2. `vite.config.ts` importing `./vite.projectIdEnv` produced "is not listed within the file list of project".
- **Fix:** A `files` entry in `apps/frontend/tsconfig.json`. `files` unions with the generated `include` rather than replacing it, so SvelteKit can keep regenerating `.svelte-kit/tsconfig.json` freely. **Proven in both directions:** an injected `const _control: number = "not a number"` in `vite.projectIdEnv.ts` was reported at `41:7`, and removing it returned the run to `0 ERRORS`. The file is genuinely checked.
- **Committed in:** `247b8d7bd`

**6. [Rule 1 - Bug] The plan's RPC seed list names an rpc that does not exist and omits one that does**

- **Found during:** Task 3.
- **Issue:** The plan seeds `PROJECT_SCOPED_RPCS` with `merge_custom_data`. Measured, the adapter calls `merge_question_custom_data` (`adminWriter/supabaseAdminWriter.ts:62`). It also calls `get_questions` (`dataProvider/supabaseDataProvider.ts:559`), which the plan's seed omits entirely. Seeding the plan's list verbatim would have declared a disposition for a function nobody calls while leaving a real one undispositioned.
- **Fix:** The map was seeded from the measured call sites: `get_nominations`, `get_questions`, `get_candidate_user_data`, `upsert_answers`, `merge_question_custom_data`.
- **Committed in:** `e53a74b6c`

**7. [Rule 3 - Blocking] `func-style` rejects the arrow-function scope helper**

- **Found during:** Task 3, from `yarn lint:check`.
- **Issue:** `const scoped = <TBuilder>(b) => …` inside `scopedFrom` is an error under the repo's `func-style` rule.
- **Fix:** Converted to a nested function declaration. It still closes over `projectId`.
- **Committed in:** `e53a74b6c`

**8. [Rule 1 - Bug] Twelve comment-hygiene violations, invisible to the `lint:check` run that preceded the commit**

- **Found during:** post-Task-3 gate sweep.
- **Issue:** `assert-comment-hygiene.mjs` scans **tracked** files only. `packages/dev-seed/tests/projectScopingGate.test.ts` was still untracked when `yarn lint:check` last ran green, so its twelve rule-2 forced-line-break violations were unmeasured. They surfaced only after the commit.
- **Fix:** The docblock was rewritten to one line per paragraph, the house style. `yarn assert:comment-hygiene` then reported `0 violation(s)` over 1652 scanned files. The instrument is proven live in both directions inside this session: it reported 12 on this file minutes earlier.
- **Committed in:** `076067d95`

### Recorded refusals — plan text that was measured and NOT followed

- **The plan's `.env.example` placement instruction ("immediately after the existing Supabase block") was not taken literally.** The Supabase entries sit at the head of the cross-runtime pair block, and `scripts/assert-env-pair-registry.mjs` check 3 asserts that block is contiguous with no unrelated assignment inside it. Inserting there would have reddened that guard. The new block was placed immediately after the whole pair block instead. `yarn assert:env-pair-registry` is green.
- **The plan's stale line/count citations were re-measured, not cited.** The `storage.from('public-assets')` accesses are at `dataWriter/supabaseDataWriter.ts:311-312`, not 295-302 and 345-352; the union-typed dynamic `.from(table)` is at `dataProvider/supabaseDataProvider.ts:519`, not 459-475; the `lint:check` chain had 16 links, not 6. The thirteen project-scoped tables WERE confirmed correct, derived independently from the generated schema (19 public tables, 13 carrying `project_id`).
- **The sibling todo's "six empty constants" figure is stale and was corrected in the filed todo.** Measured: thirteen `PUBLIC_*` keys are read by `constants.ts`; ten of them are assigned only in the root template and would be empty in a plain `yarn dev` session; two more are assigned in neither file. The todo records the measured list and tells the next reader to re-measure.

---

**Total deviations:** 8 auto-fixed (2 bugs, 6 blocking) plus 3 recorded refusals.
**Impact on plan:** every deviation was forced by a plan premise that is false at HEAD. No stated
behaviour was dropped, no scope was added. The two design changes that matter downstream —
resolution in the constructor rather than an `init()`, and `scopedFrom` as a facade rather than a
filtered builder — should be carried into plans `161-02` and `161-04`, which are written against the
`init()`/`.eq()` shapes that do not exist.

## Issues Encountered

- **The guard's real corpus is empty by construction.** Both guarded sources examine 0 raw client
  calls. This is honest (it is what conversion means) but it makes a plain zero uninformative, so
  the examined-count is printed, the self-test uses exact fixture counts, and the flip is recorded.
  A verifier should not read the plain run's zero as evidence on its own.
- **`yarn lint:check` cannot see an uncommitted file for one of its own guards.** The
  comment-hygiene link scans tracked files only. Running the full chain before committing a new
  source is therefore not sufficient; it must be re-run after. That cost one extra commit here.

## Outstanding verification (batched for end-of-phase UAT)

Deliverable **D2** is the tracer task's `<manual>` half and is the only unproven item:

> With `yarn db:reset-with-data` and `PUBLIC_PROJECT_ID=00000000-0000-0000-0000-000000000001 yarn dev`,
> load the voter home page and submit the feedback form; confirm the inserted `public.feedback` row
> carries that `project_id`. Then restart `yarn dev` with **no** shell prefix and the line present in
> the repo-root `.env`, and confirm the page still renders — which proves the plumbing carries the
> value rather than the prefix.

It is not run here: it needs a Supabase stack and a dev server this plan does not provision, and
`workflow.human_verify_mode` is `end-of-phase`, which batches exactly this. The tracer feedback gate
itself was satisfied by re-running the automated half end to end before any expansion work started —
1612 frontend tests, 632 dev-seed tests, `svelte-check` 0 errors, `yarn workspace @openvaa/frontend
build` exit 0 — so Task 3 did not build onto an unproven slice.

## User Setup Required

None. `PUBLIC_PROJECT_ID` is documented in `.env.example` with a working local default; an existing
checkout needs the line copied into its own `.env`, or the app throws with a message naming the
variable, the file and the value.

## Next Phase Readiness

- **Ready for `161-02`** (the `get_nominations` project parameter). It should be read against the
  `scopedFrom` facade shape and the constructor resolution site recorded above, not the plan's
  `init()`/`.eq()` text.
- **`161-03` is unblocked and unannotated:** the operator chose `one-name`, so it renames the Deno
  side to `PUBLIC_PROJECT_ID` rather than keeping `DEFAULT_PROJECT_ID`. Note that `.env.example`
  still carries a live `DEFAULT_PROJECT_ID=…` line in its Edge Function block; removing it is
  `161-03`'s edit, deliberately not taken here.
- **`161-04`** inherits three `DEFERRED_SOURCES` entries, each reason-stringed `conversion pending`.
  Moving a file into `GUARDED_SOURCES` and deleting its deferred entry is the completion signal.
- **Nothing was pushed.** Every push remains the orchestrator's.

---

_Phase: 161-project-scoping-project-id-parameterisation_
_Completed: 2026-09-04_

## Self-Check: PASSED

- All 9 created files verified present on disk with `[ -f ]`.
- All 5 commit hashes verified reachable with `git log --oneline --all`.
- `git diff --diff-filter=D --name-only 4dc765f04~1 HEAD` is empty: no file was deleted.
- Working tree clean at close.
