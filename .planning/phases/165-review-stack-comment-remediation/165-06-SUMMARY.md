---
phase: 165-review-stack-comment-remediation
plan: 06
subsystem: frontend
tags: [supabase-types, adapter-boundary, parity-test, vitest, expectTypeOf, comment-hygiene]

requires:
  - phase: 165-review-stack-comment-remediation
    provides: 165-01 instruments (hygiene-changed-files.sh, record-hygiene-read.sh, code-identity.mjs, assert-absent.sh, ledger-check.sh)
provides:
  - Frontend-local grant vocabulary in roles.ts (GRANT_SCOPES, GRANT_ROLES, GrantScope, GrantRole, GrantShape.target_type as EntityType)
  - supabaseTypes.parity.test.ts next to the Supabase adapter, covering enum parity (runtime and type level) and an import-boundary census
  - SupabaseDatabase alias exported by supabaseAdapter.type.ts, used by the seven client-typing sites
  - Hygiene-clean comments in the five lib/supabase client factories and lib/api/dataProvider.ts
affects: [165-15, 165-19, 165-24, 165-36, adapter-selection todo (D-03)]

actuals:
  tokens: 18988
  tasks: 3
  commits: 7
plan_head_before: a0b876eb256f766a39631501fa286d5aa79d4598
plan_head_after: 8735f18d871e52b2bdd2aca73e5e055dc7684969

tech-stack:
  added: []
  patterns:
    - "Frontend keeps its own as-const vocabulary for database enums and a colocated parity test at the adapter asserts set equality (runtime) and type equality (expectTypeOf, checked by svelte-check)"
    - "Code outside the adapter types Supabase clients through `SupabaseDatabase` from supabaseAdapter.type.ts, never through @openvaa/supabase-types"
    - "Filesystem-walking tests under jsdom derive paths with dirname(fileURLToPath(import.meta.url)), not new URL(rel, import.meta.url)"

key-files:
  created:
    - apps/frontend/src/lib/api/adapters/supabase/supabaseTypes.parity.test.ts
    - .planning/phases/165-review-stack-comment-remediation/scripts/hygiene-reads/165-06.tsv
  modified:
    - apps/frontend/src/lib/auth/roles.ts
    - apps/frontend/src/lib/api/adapters/supabase/supabaseAdapter.type.ts
    - apps/frontend/src/app.d.ts
    - apps/frontend/src/lib/api/dataProvider.ts
    - apps/frontend/src/lib/supabase/anon.ts
    - apps/frontend/src/lib/supabase/browser.ts
    - apps/frontend/src/lib/supabase/job.ts
    - apps/frontend/src/lib/supabase/server.ts
    - apps/frontend/src/lib/supabase/universal.ts
    - .planning/phases/165-review-stack-comment-remediation/165-LEDGER.md
    - .planning/phases/165-review-stack-comment-remediation/deferred-items.md

key-decisions:
  - "GrantShape.target_type is typed with EntityType from @openvaa/data (the frontend's own entity vocabulary), and the parity test checks ENTITY_TYPE and EntityType against the entity_type enum"
  - "The comment rewrites of the six client-factory and selector files went into a separate Hygiene: D-04 commit, because they were too large to share the alias commit"
  - "The import-boundary census scans .ts, .d.ts and .svelte files under apps/frontend/src and exempts only lib/api/adapters/supabase/"

patterns-established:
  - "Parity at the boundary: a local copy of a generated enum is allowed only with a test next to the adapter that fails on drift in both directions"

requirements-completed: [165-SC2, 165-SC3, C-4106633861]

coverage:
  - id: D1
    description: "roles.ts defines its grant scopes, roles and entity target type without importing @openvaa/supabase-types, and every existing export keeps its behaviour"
    requirement: "C-4106633861"
    verification:
      - kind: other
        ref: "bash scripts/assert-absent.sh '@openvaa/supabase-types' -- apps/frontend/src/lib/auth (exit 0)"
        status: pass
      - kind: other
        ref: "yarn typecheck:tests (exit 0; tests/tests/utils/supabaseAdminClient.ts still imports ADMIN_GRANTS)"
        status: pass
      - kind: unit
        ref: "yarn workspace @openvaa/frontend test:unit (103 files, 1832 tests passed)"
        status: pass
    human_judgment: false
  - id: D2
    description: "supabaseTypes.parity.test.ts fails when the frontend's scope, role or entity-type sets differ from Constants.public.Enums or Enums<...>"
    requirement: "C-4106633861"
    verification:
      - kind: unit
        ref: "apps/frontend/src/lib/api/adapters/supabase/supabaseTypes.parity.test.ts#frontend vocabulary matches the database enums"
        status: pass
      - kind: other
        ref: "yarn workspace @openvaa/frontend check (0 errors, 0 warnings; 1 error on a scratch narrowing of GrantShape.target_type)"
        status: pass
    human_judgment: false
  - id: D3
    description: "The seven client-typing sites import SupabaseDatabase from the adapter, and no frontend source outside lib/api/adapters/supabase imports @openvaa/supabase-types"
    requirement: "C-4106633861"
    verification:
      - kind: other
        ref: "bash scripts/assert-absent.sh \"from '@openvaa/supabase-types'\" -- apps/frontend/src ':!apps/frontend/src/lib/api/adapters/supabase/**' (exit 0)"
        status: pass
      - kind: unit
        ref: "apps/frontend/src/lib/api/adapters/supabase/supabaseTypes.parity.test.ts#import boundary of @openvaa/supabase-types"
        status: pass
    human_judgment: false
  - id: D4
    description: "All ten shipped files pass the hygiene gate and have their reads recorded"
    requirement: "165-SC3"
    verification:
      - kind: other
        ref: "bash scripts/hygiene-changed-files.sh --check-reads --files <the ten files> (exit 0, VERDICT: CLEAN)"
        status: pass
      - kind: other
        ref: "node scripts/code-identity.mjs 2296761f9 WORKTREE <six rewritten files> (exit 0, 0 changed code)"
        status: pass
    human_judgment: false

duration: 12min
completed: 2026-09-27
status: complete
---

# Phase 165 Plan 06: supabase-types Boundary Summary

**`roles.ts` owns its grant vocabulary (`GRANT_SCOPES`, `GRANT_ROLES`, `EntityType` targets). `supabaseTypes.parity.test.ts` next to the Supabase adapter fails on any drift from the database enums and on any import of `@openvaa/supabase-types` outside the adapter. The seven client-typing sites now use an adapter-exported `SupabaseDatabase` alias.**

## Performance

- **Duration:** about 12 min
- **Started:** 2026-09-27T18:17:26Z
- **Completed:** 2026-09-27T18:29:30Z
- **Tasks:** 3 of 3
- **Files modified:** 13 (10 shipped source files, the read log, the ledger, deferred-items.md)

## Accomplishments

- `roles.ts` imports only `type { EntityType } from '@openvaa/data'`. `GRANT_SCOPES` and `GRANT_ROLES` are exported `as const` arrays, and `GrantScope` and `GrantRole` are derived from them. `ADMIN_GRANTS`, `CANDIDATE_GRANTS`, `GrantClaim`, `GrantShape`, `readGrants` and `hasAnyGrant` keep their exports and behaviour. The docblocks now state each contract (the fail-closed rule, why the signature-blind decode is safe only after `safeGetSession`, why the gates match on pairs), without the `162-REVIEW IN-05` id, the "claim key this module used to read" narrative or restated counts.
- `supabaseTypes.parity.test.ts` checks runtime set equality for scopes, roles and entity types against `Constants.public.Enums`, and type equality against `Enums<...>` through `expectTypeOf`, which svelte-check compiles. A second `describe` walks `apps/frontend/src` and names every file outside `lib/api/adapters/supabase/` that imports the generated types.
- `supabaseAdapter.type.ts` exports `type SupabaseDatabase = Database`. `app.d.ts`, `lib/api/dataProvider.ts` and `lib/supabase/{anon,browser,job,server,universal}.ts` use it through type-only imports.
- The comments in the six client-factory and selector files were rewritten to their contracts, dropping ruling ids (`D10`, `D11`, `A2`, `B2(a)`), plan ids (`157-16`, `157.2-07`, `157.2-08`), `WR-01`, lint-measurement transcripts and "until this phase" history. `code-identity.mjs` confirms the change is comment-only.

## Task Commits

1. **Task 1: frontend-local grant types and the parity test (tracer)**: `f9d963be1` (feat)
2. **Task 2: the `SupabaseDatabase` alias and its seven consumers**: `2296761f9` (refactor), then `edd1705ef` (docs, `Hygiene: D-04`, the comment rewrite)
3. **Task 3: the census test and the read log**: `074b52196` (test), `8034a24ea` (chore, `Hygiene: D-04`)

Ledger: `8735f18d8` (docs, C-4106633861 row and the deferred item). The orchestrator's LEDGER backfill of plan 05's seven rows is `61328c89c` (`docs(165-05)`). It is the first commit after `plan_head_before`, so `commits: 7` includes it.

**Tracer gate:** interactive, `end-of-phase`, automated-only `<verify>`. The verify was re-run after the Task 1 commit (parity test exit 0, `assert-absent.sh` exit 0). Tracer verified end to end; expanding.

## Red runs (quoted)

**Task 1 RED**, before `roles.ts` exported the arrays (`yarn workspace @openvaa/frontend test:unit supabaseTypes.parity`, exit 1):

```
   × frontend vocabulary matches the database enums > has the same grant scopes 2ms
     → GRANT_SCOPES is not iterable
   × frontend vocabulary matches the database enums > has the same grant roles 0ms
     → GRANT_ROLES is not iterable
   ✓ frontend vocabulary matches the database enums > has the same entity types 0ms
      Tests  2 failed | 1 passed (3)
```

GREEN: exit 0, 3/3.

**Scratch: an extra `GRANT_SCOPES` member** (`'election'` appended, then restored from a copy), exit 1:

```
 FAIL  ... > frontend vocabulary matches the database enums > has the same grant scopes
AssertionError: expected [ 'account', 'election', …(3) ] to deeply equal [ 'account', 'entity', 'global', …(1) ]
+   "election",
```

**Scratch: type-level drift.** `GrantShape.target_type` was narrowed to `Exclude<EntityType, 'alliance'>` and then restored. The runtime assertions still pass in that state, but `yarn workspace @openvaa/frontend check` exits 1:

```
ERROR "src/lib/api/adapters/supabase/supabaseTypes.parity.test.ts" 28:74 "Type '"candidate" | "organization" | "alliance" | "faction"' does not satisfy the constraint '"Expected: literal string: candidate, Actual: never" | ...
COMPLETED 2771 FILES 1 ERRORS 0 WARNINGS 1 FILES_WITH_PROBLEMS
```

**Scratch: census.** `import type { Json } from '@openvaa/supabase-types';` was added to `lib/auth/roles.ts`, exit 1:

```
AssertionError: these files import @openvaa/supabase-types outside the adapter: lib/auth/roles.ts: expected [ 'lib/auth/roles.ts' ] to deeply equal []
```

The same import in `lib/components/accordionSelect/AccordionSelect.svelte`, exit 1:

```
AssertionError: these files import @openvaa/supabase-types outside the adapter: lib/components/accordionSelect/AccordionSelect.svelte: expected [ Array(1) ] to deeply equal []
```

Each scratch file was restored from a copy, and `git diff --quiet HEAD -- <file>` confirmed the restore before any commit.

## Audit: every `@openvaa/supabase-types` import site

Re-derived with `git grep -l "@openvaa/supabase-types"` at the end of the plan (62 paths outside `.planning/`; the `.planning/**` hits are planning prose).

| Path(s) | Classification | Reason |
|---|---|---|
| `apps/frontend/src/lib/auth/roles.ts` | **moved** (this plan) | Domain types (`Enums`) replaced by frontend-local `GRANT_SCOPES`/`GRANT_ROLES` and `EntityType`, with the parity test enforcing agreement (D-08) |
| `apps/frontend/src/app.d.ts`, `apps/frontend/src/lib/api/dataProvider.ts`, `apps/frontend/src/lib/supabase/{anon,browser,job,server,universal}.ts` | **aliased** (this plan) | They type Supabase clients; now `SupabaseDatabase` from `supabaseAdapter.type.ts`. Moving the factories behind the adapter is deferred with the adapter-selection work (D-03, `.planning/todos/pending/2026-09-27-adapter-selection-entrypoints.md`) |
| `apps/frontend/src/lib/api/adapters/supabase/**` (`supabaseAdapter.ts`, `supabaseAdapter.type.ts`, `utils/mapRow.ts`, `utils/parseJsonbColumn.ts`, `adminWriter/supabaseAdminWriter.ts`, `dataProvider/supabaseDataProvider.ts`, `dataWriter/supabaseDataWriter.ts`, their tests, `supabaseAdapter.test.ts`, `supabaseAdapter.concurrency.test.ts`, `feedbackWriter/supabaseFeedbackWriter.test.ts`, `supabaseTypes.parity.test.ts`) | kept, inside the boundary | The adapter is the one place allowed to use the generated types |
| `apps/frontend/package.json` | kept | The adapter's own dependency |
| `packages/dev-seed/**` (38 paths: `package.json`, `src/**`, `tests/**`) | kept | Writes through the Supabase admin client by design |
| `tests/tests/utils/supabaseAdminClient.ts` | kept | The E2E Supabase admin client; imports `PROPERTY_MAP`, `TABLE_MAP` |
| `packages/supabase-types/package.json`, `packages/supabase-types/RPC-NULLABILITY.md` | kept | The package itself |
| `package.json` (root), `yarn.lock` | kept | Workspace dependency and the `db:types` script (`yarn workspace @openvaa/supabase-types generate`) |
| `.github/workflows/main.yaml` | kept | Comments describing the type-generation CI step |
| `packages/README.md`, `apps/docs/src/routes/(content)/developers-guide/app-and-repo-structure/+page.md`, `.agents/code-review-checklist.md` | kept | Prose mentions (package list; the checklist's `COLUMN_MAP`/`PROPERTY_MAP` row-mapping item, which concerns adapter code) |

## Review-comment dispositions

| Comment | Disposition | Commits | Evidence | Draft reply |
|---|---|---|---|---|
| C-4106633861 | fix | `f9d963be1`, `2296761f9`, `074b52196` | `yarn workspace @openvaa/frontend test:unit supabaseTypes.parity` (4/4, each assertion observed red above); `yarn workspace @openvaa/frontend check` (0/0, red on a type-level scratch); `assert-absent.sh "from '@openvaa/supabase-types'" -- apps/frontend/src ':(exclude)apps/frontend/src/lib/api/adapters/supabase/**'` (exit 0) | Fixed after a repo-wide audit: `roles.ts` now defines its grant scopes and roles itself (and uses `EntityType` from `@openvaa/data` for the target), and `supabaseTypes.parity.test.ts` next to the Supabase adapter fails when they drift from the database enums in either direction. The seven files that type Supabase clients (`app.d.ts`, `lib/api/dataProvider.ts`, `lib/supabase/*`) import a `SupabaseDatabase` alias from `supabaseAdapter.type.ts`, and the same test fails if frontend code outside the adapter imports `@openvaa/supabase-types` again. Moving the client factories behind the adapter is deferred with the adapter-selection work; dev-seed and the E2E admin client keep the import because they write through the Supabase admin client by design. |

The same row is filled in `165-LEDGER.md`, and `ledger-check.sh` exits 0.

## Verification (plan level, final re-run on the committed tip)

| Command | Exit | Key output |
|---|---|---|
| `yarn workspace @openvaa/frontend test:unit supabaseTypes.parity` | 0 | 4 passed |
| `yarn workspace @openvaa/frontend test:unit` | 0 | 103 files, 1832 tests passed |
| `yarn workspace @openvaa/frontend check` | 0 | `2771 FILES 0 ERRORS 0 WARNINGS` |
| `yarn typecheck:tests` | 0 | none |
| `yarn workspace @openvaa/frontend lint` | 0 | one pre-existing warning in `candidateContext.svelte.test.ts` (logged in deferred-items.md) |
| `bash scripts/assert-absent.sh '@openvaa/supabase-types' -- apps/frontend/src/lib/auth` | 0 | `absent` |
| `bash scripts/assert-absent.sh "from '@openvaa/supabase-types'" -- apps/frontend/src ':!apps/frontend/src/lib/api/adapters/supabase/**'` | 0 | `absent`; the `':(exclude)…'` form also exits 0, and the control run without the exclude exits 1 with the 15 adapter matches |
| `bash scripts/hygiene-changed-files.sh --check-reads --files <ten files>` | 0 | `unread=0`, `VERDICT: CLEAN` |
| `node scripts/code-identity.mjs 2296761f9 WORKTREE <six rewritten files>` | 0 | `6 compared, 0 changed code` |
| `bash scripts/tip-proofs.sh` | 0 | includes the `readGrants` reads `payload?.grants` proof on the edited `roles.ts` |
| `bash scripts/ledger-check.sh` | 0 | `VERDICT: PASSED` |
| `grep -c 'export const ADMIN_GRANTS' apps/frontend/src/lib/auth/roles.ts` | — | `1` |
| `git grep -c SupabaseDatabase -- apps/frontend/src/lib/supabase apps/frontend/src/app.d.ts apps/frontend/src/lib/api/dataProvider.ts` | — | all seven files listed |

No `roles` test exists (`git ls-files | grep -i roles.*test` is empty), so `test:unit roles` does not apply.

## Decisions Made

See `key-decisions` in the frontmatter.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] The census test cannot build its paths with `new URL(rel, import.meta.url)` under jsdom**
- **Found during:** Task 3
- **Issue:** The first run failed at collection with `TypeError: The URL must be of scheme file`. The frontend's vitest environment is jsdom, whose `URL` is not Node's.
- **Fix:** The test derives paths with `dirname(fileURLToPath(import.meta.url))` and `join`, the pattern `translations.test.ts` and `hoverShadedRule.test.ts` already use.
- **Files modified:** `apps/frontend/src/lib/api/adapters/supabase/supabaseTypes.parity.test.ts`
- **Committed in:** `074b52196`

**2. [Plan detail] `dataProvider.ts` imports the alias through its existing relative import**
- `dataProvider.ts` already imported `SupabaseAdapterConfig` from `./adapters/supabase/supabaseAdapter.type`, so `SupabaseDatabase` joins that import instead of adding a second `$lib/api/adapters/supabase/supabaseAdapter.type` import of the same module. The other six consumers use the `$lib` path as specified.
- **Committed in:** `2296761f9`

**3. [Plan detail] No `hygiene-allow/165-06.tsv`**
- The plan lists this file in `files_modified`, but no finding needed an allowlist entry. All ten files pass the gate outright, so the file was not created.

**4. [Orchestrator note] The ledger base includes the plan 05 backfill**
- `plan_head_before` is `a0b876eb2`, the tip before this executor ran. `commits: 7` therefore includes `61328c89c` (`docs(165-05)`, the orchestrator-requested backfill of plan 05's seven ledger rows). Six of the seven commits are this plan's.

---

**Total deviations:** 1 auto-fixed bug, 2 plan-detail adjustments, 1 accounting note. **Impact:** none on scope.

## Issues Encountered

- `yarn workspace @openvaa/frontend lint` exits 0 with one pre-existing warning (`'question' is assigned a value but never used` in `lib/contexts/candidate/candidateContext.svelte.test.ts`, last changed before this phase in 41bee4002). The file is outside this plan's scope, so the warning is logged in `deferred-items.md` for the phase-wide gate plans.

## Threat Model Outcome

- **T-165-11 (mitigate):** the parity test fails on drift in either direction, at runtime for the sets and at compile time for the types. `hasAnyGrant` and `readGrants` have unchanged code, and the `readGrants` tip proof passes.
- **T-165-12 (mitigate):** the census test fails when any non-adapter source imports the generated types.
- **T-165-SC (accept):** no package was installed.

## Known Stubs

None.

## User Setup Required

None.

## Next Phase Readiness

- The adapter-selection todo (D-03) can move the `lib/supabase` factories behind the adapter. The census test's exempt directory is the one line to widen if the factories move under `lib/api/adapters/supabase/`.
- 165-15 edits writer docstrings that mention the `lib/supabase/browser.ts` memo. This plan changed only that file's comment, and the memo code is identical.

## Self-Check: PASSED

- The created files exist: `supabaseTypes.parity.test.ts` and `hygiene-reads/165-06.tsv` (checked with `[ -f ]`).
- Commits `61328c89c`, `f9d963be1`, `2296761f9`, `edd1705ef`, `074b52196`, `8034a24ea` and `8735f18d8` are ancestors of HEAD.
- `git status --short` lists only the maintainer's unstaged `MainContent.svelte` and the untracked `.planning/milestone.lock`.
