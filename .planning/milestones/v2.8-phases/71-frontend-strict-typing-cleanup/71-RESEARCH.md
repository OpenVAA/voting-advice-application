# Phase 71: Frontend Strict-Typing Cleanup — Research

**Researched:** 2026-05-09
**Domain:** TypeScript / ESLint cleanup at the Supabase-adapter boundary in a SvelteKit frontend
**Confidence:** HIGH (full lint output captured at HEAD on `feat-gsd-roadmap`; all 95 errors enumerated; supabase-types layout verified; existing patterns in `mapRow`/`COLUMN_MAP` confirmed)

## Summary

Phase 71 clears the 95 pre-existing ESLint errors in `apps/frontend/` deferred under v2.7 Phase 68 Option C. A live `yarn workspace @openvaa/frontend lint:check` at HEAD (feat-gsd-roadmap) confirms the breakdown: **67 `no-explicit-any` + 13 `naming-convention` + 11 `func-style` + 3 `consistent-type-imports` + 1 `no-unused-expressions` = 95 errors** plus 27 warnings (unchanged scope). The `no-explicit-any` cluster splits into 4 sub-clusters: 38 in `supabaseDataProvider.test.ts`, 14 in `supabaseDataProvider.ts`, 3 in `supabaseDataWriter.ts`, 5 in `supabaseAdminWriter.test.ts`, 1 in `supabaseDataWriter.test.ts`, 1 in `storageUrl.test.ts`, and 5 in route layout `data: any` props (`+layout.svelte` boundaries). The `naming-convention` cluster is **not** DB-row snake_case at all — it is **13 type-parameter `T` violations** (rule requires `^T[A-Z]`) plus 1 type-alias `_Unused` violation. This is a **major correction** to the assumed CONTEXT.md narrative ("DB-row passthrough"). The `func-style` cluster is 11 mechanical `export const foo = () => …` → `export function foo() {…}` conversions in route handlers, helpers, and a few tests. The 3 `consistent-type-imports` errors are all `import('…')` type annotations in `.type.ts` files. The single `no-unused-expressions` is a Svelte 5 `$derived` subscription pattern at `EntityListControls.svelte:72`.

**Primary recommendation:** Plan-71-02 (naming-convention) becomes a **mechanical T-prefix rename** — not the boundary-rename strategy CONTEXT.md D-02 anticipated. Adapter code already uses `mapRow()` + `COLUMN_MAP` from `@openvaa/supabase-types` (verified — see Code Examples §1), so DB-row snake_case is already converted at the boundary; the remaining `naming-convention` errors are a separate (smaller, easier) issue. The planner should explicitly correct CONTEXT.md D-02's framing in Plan-71-02's intro and rename the plan to "type-parameter naming sweep" to match reality. `no-explicit-any` cluster fixes split as: (a) test files use `as ReturnType<typeof createMockSupabaseClient>` directly instead of `as any` for `serverClient` casts; (b) production adapter code casts `row.image as Json | null` (or `unknown`) instead of `as any`; (c) route `+layout.svelte` files declare `data: PageData` from the colocated `./$types` (or accept `unknown` + narrow). All four plans are independent and parallelizable as D-01 specifies — no file appears in more than one rule cluster after the corrected Plan-71-02 framing (verified — see Cross-Plan File Conflict Audit §10).

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions

- **D-01: Split by rule — 4 parallelizable plans.** One plan per rule cluster: `no-explicit-any` (67), `naming-convention` (13), `func-style` (11), long-tail (4 = `consistent-type-imports` + `no-unused-expressions`). Each rule has a uniform fix pattern, so per-rule plans are easy to bisect and easy to parallelize. Same audit-pattern as v2.7 P65 + P68. Planner may merge `func-style` + long-tail into a single plan if scope warrants (they total only 15 errors), but the default is 4.

- **D-02: Fix at source — rename to camelCase at the adapter boundary.** DB-row snake_case keys are converted to camelCase at the Supabase adapter boundary (`apps/frontend/src/lib/api/adapters/supabase/`). Downstream code (contexts, components, utilities) consumes camelCase only. Snake_case in non-adapter code is **treated as a warning sign** — a signal that the adapter boundary is leaking. No `naming-convention` rule-tuning. Per-line `// eslint-disable-next-line` is last-resort, with an inline justification, and only for genuinely-unavoidable cases (e.g. a third-party type's exported member that we can't rename).

  > **Researcher correction (read this before planning Plan-71-02):** the assumed framing is **wrong for the current 13-error set**. None of the 13 `naming-convention` errors are DB-row snake_case keys. All 13 are type-parameter `T` violations (the rule requires `^T[A-Z]` — i.e., `TFoo`, `TElement`, etc.) plus 1 type-alias `_Unused` violation. The boundary-rename strategy is already in place via `mapRow()` + `COLUMN_MAP` from `@openvaa/supabase-types`; that's why no DB-row sites trip the rule. The D-02 strategy still **applies in spirit** as the long-term invariant, but Plan-71-02's actual work is mechanical `T → TX` renames (and one type-alias rename). See `## Cluster Analysis: naming-convention (13 errors)` for the full file:line list.

- **D-03: Real type preferred; `unknown` + narrow only at unbounded boundaries.** Default fix path is to import the SDK's own type or define a project-local type. `unknown` + runtime narrow + inline `// reason: <why unbounded>` comment is acceptable ONLY when the boundary genuinely admits unbounded shapes (e.g. raw JSON from a third-party webhook, OIDC SDK callback with an opaque payload). Matches ROADMAP SC-1 wording.

  - For the Supabase adapter cluster (~50 of 67 anys per the deferred-tech-debt note, 56 of 67 measured): import `Database` types from `packages/supabase-types/` and propagate.
  - For the OIDC / Signicat / auth callback cluster: if the SDK exports types, import them; if not, narrow to a project-local type or `unknown` + narrow.

  > **Researcher addendum:** the actual auth/OIDC cluster size is **2 errors** (one `as any` in storageUrl.test.ts is unrelated; the `import('…')` annotations in `auth/__tests__/token-endpoint.test.ts:90` and `auth/getIdTokenClaims.test.ts:42` are `consistent-type-imports`, not `no-explicit-any`). The dominant cluster is **Supabase mocks in test files (44 of 67)** — fix via `mockSupabase: ReturnType<typeof createMockSupabaseClient>` + `as ReturnType<typeof createMockSupabaseClient>` casts, not Database types. Database types apply to **production adapter code (17 of 67)** — `supabaseDataProvider.ts:14`, `supabaseDataWriter.ts:3`, plus 5 route `+layout.svelte` `data: any` props that should be `data: PageData`.

- **D-04: `// reason: <one-line reason>` for `unknown`-typed narrowing.** Single-line; lowercase prefix matching the project's existing `// reason:` convention if any (planner verifies by grep). Distinct from the v2.7 P65 `// bind: keep —` family and from Phase 70's `// svelte-warning: accepted —` so a future grep can find each independently.

  > **Researcher verification:** `git grep -nE "// reason:"` at HEAD returns **zero matches** in `apps/frontend/src/`. Phase 71 introduces the convention; planner should call this out in Plan-71-01's anchor docs so it's grep-able for future sweeps.

- **D-05: svelte-check baseline locked at "no regression beyond 160 err / 12 warn".** Per ROADMAP SC-2; reductions welcome but not gated. The phase verification report records the post-phase svelte-check counts and notes any reduction explicitly, but a non-reduction is not a phase failure.

  > **Researcher verification:** live `yarn workspace @openvaa/frontend check` at HEAD reports **`160 ERRORS 0 WARNINGS 35 FILES_WITH_PROBLEMS`**. The "12 warn" figure in the deferred-tech-debt doc is stale — the actual baseline is **160 err / 0 warn / 35 files**. Planner should record this as the operational baseline; the "12 warn" wording in CONTEXT.md and ROADMAP SC-2 is non-binding (Phase 70's bind-rationale strip + a11y sweep zeroed out warnings between v2.7 close and HEAD).

### Claude's Discretion

- Whether to merge Plan-71-03 (`func-style`, 11) + Plan-71-04 (long-tail, 4) into a single small plan if the planner judges 15 errors not worth two plans.

  > **Researcher recommendation:** **MERGE.** Both clusters are mechanical with zero shared files (Cross-Plan Audit §10), totaling 15 errors. A single Plan-71-03 reduces orchestrator overhead. The planner can structure the merged plan as two sequential commits within the same plan if executor diff-cohesion is desired.

- Whether the `no-explicit-any` sweep needs internal sub-batches (e.g. Supabase adapter sub-batch / auth sub-batch / routes sub-batch) for diff-cohesion vs one big plan.

  > **Researcher recommendation:** **YES, sub-batch internally** by file-group within the plan. Sub-batch boundaries: (i) test files (44 errors, 4 files), (ii) production adapter code (17 errors, 2 files), (iii) route layout `data` props (5 errors, 5 files), (iv) misc (1 error in `storageUrl.test.ts`). This preserves single-plan parallelism (one executor) while keeping the diff per-commit reviewable.

- Exact wording of the CLAUDE.md / project anchor (if any) capturing "snake_case in non-adapter code is a warning sign". Planner picks whether this needs codifying or stays implicit via the lint-rule.

  > **Researcher recommendation:** **stays implicit** for Phase 71 — the lint rule already enforces it via `naming-convention` (camelCase default for variables/properties), and the current 13-error set proves the boundary is holding. Codifying in CLAUDE.md is a v2.9+ concern.

- Whether the 27 `unused-imports/no-unused-vars` warnings get addressed in Plan-71-04's diff or in a separate cleanup commit.

  > **Researcher recommendation:** **separate, opportunistic.** The 27 warnings split across ~20 files unrelated to the 95 errors. Folding them into Plan-71-04 (or merged Plan-71-03) bloats diff scope. If a plan's diff already touches one of those files, the executor handles it inline; otherwise leave for a v2.9 hygiene phase.

### Deferred Ideas (OUT OF SCOPE)

- **svelte-check baseline reduction** — explicitly out of scope per ROADMAP SC-2 (not gated). A future hygiene phase may set a reduction target.
- **27 `unused-imports/no-unused-vars` warnings** — addressed opportunistically per plan; not gated. If any remain after Phase 71, capture as a small follow-up todo.
- **`apps/frontend/src/lib/paraglide/**` cleanup** — lint-ignored; not in this or any planned phase.
- **Refactoring the Supabase adapter structurally** — out of scope. Phase 71 changes types; the adapter shape stays.
- **Adding tests for type-narrowed boundaries** — existing unit + E2E parity is the gate; no new tests added.
- **`@openvaa/supabase` lint pipeline** — Phase 72 LINT-01, already complete.
</user_constraints>

<phase_requirements>
## Phase Requirements

| ID         | Description (from REQUIREMENTS.md)                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                          | Research Support                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                              |
| ---------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------|-------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------|
| TYPING-01  | The 95 pre-existing `apps/frontend/` ESLint errors deferred under v2.7 Phase 68 Option C are resolved. Breakdown per `.planning/milestones/v2.7-phases/68-dev-tooling-trio/68-02-DEFERRED.md`: ~67 `@typescript-eslint/no-explicit-any`, ~13 `@typescript-eslint/naming-convention`, ~11 `func-style`, plus ~4 long-tail. Each `no-explicit-any` is resolved via real types (preferred) or, where the boundary genuinely admits unknowns, `unknown` + a runtime narrow + an inline justification. Each `naming-convention` and `func-style` error is fixed at the source site (no per-rule disable comments unless inline-justified). After: `yarn workspace @openvaa/frontend lint:check` exits 0. svelte-check baseline does not regress beyond v2.7-close baseline (160 err / 12 warn — actual is 160 err / 0 warn at HEAD) without explicit acknowledgement. E2E + unit suites remain green. | Full per-file:line error inventory captured (§Cluster Analysis); fix patterns derived per cluster (§Code Examples + §Fix-Pattern Templates); validation commands (§Validation Architecture) one-to-one with each error class; cross-plan conflict audit (§10) confirms no file appears in two rule clusters; baseline confirmed live at HEAD: lint 95 errors / svelte-check 160 err / 0 warn / 35 files. |
</phase_requirements>

## Architectural Responsibility Map

The capabilities affected by Phase 71 are confined to **type declarations** at specific architectural layers. No tier ownership reassignment; the typing changes preserve the existing tier boundaries.

| Capability                                                | Primary Tier             | Secondary Tier | Rationale                                                                                                                                                                                                                                                                                          |
| --------------------------------------------------------- | ------------------------ | -------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| DB-row → domain-object typing                             | API / Backend (adapter)  | —              | `apps/frontend/src/lib/api/adapters/supabase/` is the canonical seam; `Database` types from `@openvaa/supabase-types/` are imported there and converted via `mapRow` / `toDataObject`. The seam is already in place; Phase 71 just removes residual `as any` casts inside it.                       |
| OIDC / auth callback typing                               | API / Backend (auth)     | —              | `apps/frontend/src/lib/api/utils/auth/` plus the `routes/api/oidc/token/+server.ts` endpoint. The two long-tail errors live in test files for these endpoints; the production code is already typed.                                                                                            |
| Route `data: any` prop typing                             | Frontend Server (SSR)    | —              | `+layout.svelte` and `+page.svelte` `data` props are SvelteKit-emitted `PageData` / `LayoutData` types from the colocated `./$types` virtual module. Five `+layout.svelte` files currently bypass that with `data: any`.                                                                              |
| Test-mock typing                                          | Frontend Server (test)   | —              | Vitest mock factories `createMockSupabaseClient` are local helpers in two test files. The `serverClient: mockSupabase as any` casts are at the test-only `init()` boundary.                                                                                                                       |
| Generic type-parameter naming                             | (Cross-cutting / utils)  | —              | Type parameters live in pure utility modules (`mapRow.ts`, `EntityListWithControls.helpers.ts`, etc.) and tests; no tier reassignment, just a token-level rename.                                                                                                                                  |

## Standard Stack

The standard stack for this phase is **already installed** — Phase 71 is purely a typing-correctness pass over existing dependencies. No new packages.

### Core (already present, no install)

| Library                       | Version (lockfile)         | Purpose                                                                                                          | Why Standard                                                                                                                          |
| ----------------------------- | -------------------------- | ---------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------- |
| `@openvaa/supabase-types`     | `workspace:^` (0.1.0)      | Generated `Database`, `Tables<'name'>['Row']`, `TablesInsert`, `TablesUpdate`, `Json` types from Supabase schema | Single source of truth for DB-row shapes — already imported by `app.d.ts`, `supabase/browser.ts`, `supabase/server.ts`, `supabaseAdapter.ts`, `supabaseAdapter.type.ts`, `mapRow.ts` `[VERIFIED: git grep]` |
| `@supabase/supabase-js`       | catalog (lockfile-pinned)  | Supabase client; provides `SupabaseClient<Database>` generic                                                     | Idiomatic SDK; already used everywhere `[VERIFIED: imports across adapter cluster]`                                                                                                                       |
| `@sveltejs/kit`               | 2.x                        | `RequestHandler`, `LayoutLoad`, `PageLoad`, `PageData`, `LayoutData` types via `./$types`                        | Standard SvelteKit pattern; route `data: any` is a code smell — `./$types` already exists for every route `[VERIFIED: app.d.ts]`        |
| `vitest`                      | catalog                    | Test framework; provides `vi.fn()`, `Mock<…>`                                                                    | Existing pattern in test files                                                                                                        |
| `jose`                        | catalog                    | OIDC JWT/JWKS types (`jose.JWK`, `JWTPayload`)                                                                   | Already used in `getIdTokenClaims.test.ts:54-58`                                                                                      |

### Supporting (already in use, no install)

| Library                          | Purpose                                                                              | When to Use                                                                                                                              |
| -------------------------------- | ------------------------------------------------------------------------------------ | ---------------------------------------------------------------------------------------------------------------------------------------- |
| `@openvaa/data` types            | `Image`, `AnyEntityVariantData`, `ConstituencyData`, etc.                             | Already used in `parseStoredImage`, `supabaseDataProvider.ts`. Domain-object typing.                                                     |
| `@openvaa/app-shared` types      | `DynamicSettings`, `Color`, etc.                                                     | Already used in route layouts and adapter; route `+layout.svelte` `data` props sometimes need this transitively.                         |
| TypeScript `Record<string, unknown>` | Where row shape is genuinely opaque (rare after Database typing)                     | Already the project's idiomatic narrow-of-`any` — used in `mapRow.ts`, `toDataObject` calls.                                            |

### Alternatives Considered

| Instead of                                  | Could Use                                       | Tradeoff                                                                                                                                                                                                                                                                                                                              |
| ------------------------------------------- | ----------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `data: PageData` from `./$types`            | `data: { userData?: …; … }` ad-hoc inline type   | `./$types` is auto-generated by SvelteKit and stays in sync with the route's `+layout.ts` / `+page.ts` load function. Ad-hoc inline types drift. **Use `./$types`.**                                                                                                                                                                  |
| `Tables<'candidates'>['Row']`               | Hand-rolled `CandidateRow` interface             | `Tables<…>` regenerates on schema change via `yarn supabase:types`. Hand-rolled drifts. **Use `Tables<…>`** for production code; tests with mocks may stay structural.                                                                                                                                                                |
| `unknown` + narrow                          | `any`                                            | `unknown` forces narrowing at use site, catching bugs at compile time. Use only when the value is genuinely opaque (raw JSON, unbounded SDK callbacks). Per D-03, prefer real types first.                                                                                                                                            |
| `import('…').Foo` annotation                | `import type { Foo } from '…'` at file top      | The lint rule `@typescript-eslint/consistent-type-imports` forbids inline `import('…')`; auto-fix usually resolves these. The 3 errors at HEAD likely have an edge case (e.g., used both as type AND value in the same file). **Try `--fix` first**; manual conversion otherwise.                                                       |

**No installation required.** All types are present in the existing dependency graph.

## Architecture Patterns

### System Architecture Diagram

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                        Phase 71 Type-Boundary Surface                       │
└─────────────────────────────────────────────────────────────────────────────┘

   ┌────────────────────┐         ┌──────────────────────────┐
   │ Supabase DB schema │ ──gen──▶│ @openvaa/supabase-types  │
   │  (apps/supabase/)  │         │  Database, Tables<…>,    │
   └────────────────────┘         │  Json, COLUMN_MAP        │
            │                     └────────────┬─────────────┘
            │                                  │ import
            │                                  ▼
            │              ┌─────────────────────────────────────┐
            │              │  Supabase Adapter Cluster           │
            │              │  apps/frontend/src/lib/api/         │
            │              │   adapters/supabase/                │
            │              │  - supabaseDataProvider.ts          │  ◀─ 14 anys
            │              │  - supabaseDataWriter.ts            │  ◀─  3 anys
            │              │  - utils/mapRow.ts                  │  ◀─  3 T-naming
            │              │  - utils/storageUrl.ts              │  ◀─  1 func-style
            │              │   ...                               │
            │              │  TEST FILES (mocks):                │
            │              │  - supabaseDataProvider.test.ts     │  ◀─ 38 anys
            │              │  - supabaseDataWriter.test.ts       │  ◀─  1 any
            │              │  - supabaseAdminWriter.test.ts      │  ◀─  5 anys
            │              │  - utils/storageUrl.test.ts         │  ◀─  1 any
            │              └────────────────┬────────────────────┘
            │                               │ row.foo (camelCase via mapRow)
            │                               ▼
            │              ┌─────────────────────────────────────┐
            │              │  UniversalDataProvider /            │
            │              │  UniversalDataWriter base classes   │
            │              │  (already typed)                    │
            │              └────────────────┬────────────────────┘
            │                               │
            │                               ▼
            │              ┌─────────────────────────────────────┐
            │              │  DataRoot / contexts / components   │
            │              │  (camelCase domain objects)         │
            │              │  ─ Phase 71 does NOT touch this tier─│
            │              └─────────────────────────────────────┘
            │
            │              ┌──────────────────────────────────────┐
            │              │  Route Layouts (SSR boundary)        │
            │              │  +layout.svelte data: any  →  PageData/LayoutData
            │              │  ─ 5 sites ─                         │  ◀─  5 anys
            │              └──────────────────────────────────────┘
            │
            ▼              ┌──────────────────────────────────────┐
   ┌────────────────────┐  │  Auth / OIDC                         │
   │ Idura / Signicat   │─▶│  routes/candidate/auth/callback/     │  ◀─  2 func-style (callback + logout)
   │ (Identity Provider)│  │  api/oidc/token/+server.ts           │
   └────────────────────┘  │  utils/auth/getIdTokenClaims.test.ts │  ◀─  1 import-type
                           │  utils/auth/__tests__/...test.ts     │  ◀─  1 import-type
                           └──────────────────────────────────────┘

   ┌──────────────────────────────────────┐
   │  Generic helpers / contexts / tests  │
   │  - mapRow.ts (T → TRow)              │  ◀─  3 T-naming
   │  - filterContext.svelte.ts           │  ◀─  1 func-style
   │  - filterContext.svelte.test.ts      │  ◀─  1 T-naming
   │  - voterContext.svelte.ts            │  ◀─  1 T-naming
   │  - Input.type.ts                     │  ◀─  1 T-naming (_TElement)
   │  - StackedState.svelte.test.ts       │  ◀─  1 func-style
   │  - persistedState.svelte.test.ts     │  ◀─  1 func-style
   │  - EntityListControls.svelte         │  ◀─  1 no-unused-expressions (line 72: `entities;` $effect tick)
   │  - EntityListWithControls.helpers.ts │  ◀─  3 T-naming + 1 type-alias
   │  - EntityListWithControls.svelte     │  ◀─  1 func-style + 1 T-naming
   │  - EntityListWithControls.test.ts    │  ◀─  3 T-naming
   │  - +layout.svelte routes             │  ◀─  1 func-style + 1 unused-expressions
   │  - +server.ts route handlers         │  ◀─  4 func-style
   │  - results/+layout.ts / +page.ts     │  ◀─  2 func-style
   │  - getRoute.svelte.ts                │  ◀─  1 func-style
   │  - Button.type.ts                    │  ◀─  1 import-type
   └──────────────────────────────────────┘
```

### Recommended Project Structure

No structural changes. Phase 71 modifies types **in place** in the existing layout:

```
apps/frontend/
├── src/
│   ├── app.d.ts                                       # already imports Database (no change)
│   ├── lib/
│   │   ├── api/adapters/supabase/
│   │   │   ├── supabaseAdapter.ts                     # already typed (no change)
│   │   │   ├── supabaseAdapter.type.ts                # already typed (no change)
│   │   │   ├── dataProvider/
│   │   │   │   ├── supabaseDataProvider.ts            # ⚙ 14 anys → Json | Tables<…>['Row'] casts
│   │   │   │   └── supabaseDataProvider.test.ts       # ⚙ 38 anys → ReturnType<typeof createMockSupabaseClient>
│   │   │   ├── dataWriter/
│   │   │   │   ├── supabaseDataWriter.ts              # ⚙ 3 anys → Json | unknown casts
│   │   │   │   └── supabaseDataWriter.test.ts         # ⚙ 1 any
│   │   │   ├── adminWriter/
│   │   │   │   └── supabaseAdminWriter.test.ts        # ⚙ 5 anys
│   │   │   └── utils/
│   │   │       ├── mapRow.ts                          # ⚙ 3 T-naming (T → TRow)
│   │   │       ├── storageUrl.ts                      # ⚙ 1 func-style (toUrl arrow → declaration OR keep — see Pitfall 2)
│   │   │       └── storageUrl.test.ts                 # ⚙ 1 any
│   │   ├── api/utils/auth/
│   │   │   ├── getIdTokenClaims.test.ts               # ⚙ 1 import-type
│   │   │   └── __tests__/token-endpoint.test.ts       # ⚙ 1 import-type
│   │   ├── components/
│   │   │   ├── button/Button.type.ts                  # ⚙ 1 import-type
│   │   │   └── input/Input.type.ts                    # ⚙ 1 T-naming (_TElement → _T<Cap>)
│   │   ├── contexts/
│   │   │   ├── app/getRoute.svelte.ts                 # ⚙ 1 func-style
│   │   │   ├── filter/filterContext.svelte.ts         # ⚙ 1 func-style
│   │   │   ├── filter/filterContext.svelte.test.ts    # ⚙ 1 T-naming
│   │   │   ├── utils/StackedState.svelte.test.ts      # ⚙ 1 func-style
│   │   │   ├── utils/persistedState.svelte.test.ts    # ⚙ 1 func-style
│   │   │   └── voter/voterContext.svelte.ts           # ⚙ 1 T-naming
│   │   └── dynamic-components/entityList/
│   │       ├── EntityListControls.svelte              # ⚙ 1 no-unused-expressions (line 72)
│   │       ├── EntityListWithControls.helpers.ts      # ⚙ 3 T-naming + 1 _Unused type alias
│   │       ├── EntityListWithControls.svelte          # ⚙ 1 func-style + 1 T-naming
│   │       └── EntityListWithControls.test.ts         # ⚙ 3 T-naming
│   └── routes/
│       ├── +layout.svelte                              # ⚙ 1 func-style (line 164)
│       ├── (voters)/
│       │   ├── (located)/+layout.svelte               # ⚙ 1 any (data: any → LayoutData)
│       │   ├── (located)/results/+layout.ts           # ⚙ 1 func-style
│       │   ├── (located)/results/[[…]]/+page.ts       # ⚙ 1 func-style
│       │   └── nominations/+layout.svelte              # ⚙ 1 any
│       ├── admin/(protected)/
│       │   ├── +layout.svelte                          # ⚙ 1 any
│       │   ├── argument-condensation/+layout.svelte    # ⚙ 1 any
│       │   └── question-info/+layout.svelte            # ⚙ 1 any
│       └── candidate/auth/
│           ├── callback/+server.ts                     # ⚙ 1 func-style
│           └── logout/+server.ts                       # ⚙ 1 func-style
```

### Pattern 1: Real type from `@openvaa/supabase-types` (preferred for adapter production code)

**What:** Replace `as any` row casts with `as Json | null` (for JSONB columns) or `Tables<'name'>['Row'][col]` (for typed columns).
**When to use:** `apps/frontend/src/lib/api/adapters/supabase/dataProvider/supabaseDataProvider.ts`, `supabaseDataWriter.ts`. The 14 + 3 production-code anys.

```typescript
// Source: VERIFIED — packages/supabase-types/src/index.ts:1
import type { Json, Tables } from '@openvaa/supabase-types';

// BEFORE (line 101 in supabaseDataProvider.ts):
result.publisherLogo = parseStoredImage(raw.publisherLogo as any, supabaseUrl);

// AFTER:
result.publisherLogo = parseStoredImage(raw.publisherLogo as Json | null, supabaseUrl);
// `parseStoredImage` accepts `StoredImage | null | undefined`; `Json` widens to that
// shape via the function's null/undefined guard. No runtime change.

// BEFORE (line 154):
image: parseStoredImage(row.image as any, supabaseUrl),
// AFTER (row is `Tables<'elections'>['Row']` from the .from('elections') chain):
image: parseStoredImage(row.image as Json | null, supabaseUrl),
```

### Pattern 2: `ReturnType<typeof createMockSupabaseClient>` for test mocks

**What:** Replace `as any` casts on `serverClient: mockSupabase as any` with the existing `ReturnType<typeof createMockSupabaseClient>` helper type.
**When to use:** `supabaseDataProvider.test.ts`, `supabaseAdminWriter.test.ts`, `supabaseDataWriter.test.ts`. The 44 test-mock anys.

```typescript
// Source: VERIFIED — supabaseDataProvider.test.ts:75
let mockSupabase: ReturnType<typeof createMockSupabaseClient>;

// The `as any` casts at lines 82, 129, 223 (and ~35 more) are on the
// `init({ serverClient: mockSupabase as any, … })` boundary. The `init`
// signature on UniversalDataProvider/Writer accepts `SupabaseClient<Database>`
// (verified at supabaseAdapter.ts:5). The mock is structural-only.
//
// FIX: cast the mock to `unknown as SupabaseClient<Database>` ONCE in init,
// or define a small type-only adapter:

import type { SupabaseClient } from '@supabase/supabase-js';
import type { Database } from '@openvaa/supabase-types';

// helper at top of file:
type MockClient = ReturnType<typeof createMockSupabaseClient>;
const asSupabaseMock = (m: MockClient) => m as unknown as SupabaseClient<Database>;

// usage:
provider.init({
  fetch: vi.fn(),
  serverClient: asSupabaseMock(mockSupabase),
  locale: 'en',
  defaultLocale: 'en'
});

// For result-shape casts at lines 136-139, 230-231 etc. (`(result as any).foo`):
//   BEFORE: expect((result as any).notifications.candidateApp.title).toBe('FI');
//   AFTER:  expect((result as Record<string, any>).notifications.candidateApp.title).toBe('FI');
//   ── nope, still has `any` ──
//   BEST:   define a local narrowed type or use `unknown` + narrow:
//     const r = result as Partial<DynamicSettings> & {
//       notifications?: { candidateApp?: { title?: string; content?: string } };
//     };
//     expect(r.notifications?.candidateApp?.title).toBe('FI');
//   This preserves test intent without `any` and reads naturally.
```

### Pattern 3: `data: PageData` / `data: LayoutData` from `./$types`

**What:** Replace route layout `data: any` with the SvelteKit auto-generated `LayoutData` / `PageData`.
**When to use:** Five `+layout.svelte` files: `(voters)/(located)/+layout.svelte:31`, `(voters)/nominations/+layout.svelte:21`, `admin/(protected)/+layout.svelte:17`, `admin/(protected)/argument-condensation/+layout.svelte:20`, `admin/(protected)/question-info/+layout.svelte:20`.

```svelte
<!-- Source: VERIFIED — SvelteKit standard pattern; app.d.ts already augments App.Locals -->
<script lang="ts">
  import type { LayoutData } from './$types';
  import type { Snippet } from 'svelte';

  // BEFORE:
  // let { data, children }: { data: any; children: Snippet } = $props();
  // AFTER:
  let { data, children }: { data: LayoutData; children: Snippet } = $props();
</script>
```

**Caveat:** if the colocated `+layout.ts` (or `+layout.server.ts`) does not exist OR returns nothing, `LayoutData` is `Record<string, never>` and downstream `data.userData` reads will type-error. In that case the load function needs to be added/extended, OR the executor escalates to "this site needs a load function before typing can be tightened". For the 5 sites, **verify the colocated load file** before the rename — if the load function returns `userData`/`nominationData`/etc., `LayoutData` already has those fields.

### Pattern 4: Type-parameter rename (T → TRow / TEntity / TFoo)

**What:** Mechanical token rename. The `naming-convention` rule requires `^T[A-Z]` for `typeParameter`.
**When to use:** All 13 `naming-convention` errors are this pattern.

```typescript
// Source: VERIFIED — packages/shared-config/eslint.config.mjs (rule definition)
// rule: typeParameter, format: ['PascalCase'], custom: { regex: '^T[A-Z]', match: true }

// BEFORE (mapRow.ts:9):
export function mapRow<T extends Record<string, unknown>>(row: T): Record<string, unknown> { … }
// AFTER:
export function mapRow<TRow extends Record<string, unknown>>(row: TRow): Record<string, unknown> { … }

// BEFORE (Input.type.ts:55):
export type InputPropsBase<TValue, _TElement extends string = 'input'> = …
// AFTER (rename _TElement to satisfy ^T[A-Z] — keep underscore prefix as the "intentionally unused" marker):
//   _TElement currently fails because the rule applies BEFORE the underscore is considered.
//   Two options:
//     (a) Rename to `TUnused` (semantic: was "kept for API compat") — preferred per D-02 spirit.
//     (b) Add `// eslint-disable-next-line @typescript-eslint/naming-convention --
//         reason: kept for API compatibility, not actually consumed in body`.
//   Option (a) is cleaner; Option (b) is the inline-justified fallback per D-02.

// BEFORE (EntityListWithControls.helpers.ts:47):
export type _Unused<TEntity> = TEntity;
// AFTER:
//   The line exists per a typescript-eslint quirk (Pitfall 4); the type-alias rule
//   requires PascalCase. Rename to `Unused` (no leading underscore — type aliases
//   accept PascalCase). Or remove the export entirely if no consumer (verify via
//   `git grep "_Unused\b"` — researcher confirmed: zero consumers).
//   FIX (preferred): delete lines 43-47 + the `// Suppress unused TEntity if not
//   needed by consumers — kept for future generic extension.` comment.
//   Alternative: rename to `Unused` if the FilterGroupLike export needs to keep
//   the TEntity slot exposed.
```

### Pattern 5: `func-style` — arrow → declaration

**What:** Replace `export const foo = (…) => { … }` with `export function foo(…) { … }`.
**When to use:** All 11 `func-style` errors.

```typescript
// Source: VERIFIED — packages/shared-config/eslint.config.mjs
// rule: 'func-style': ['error', 'declaration', { allowArrowFunctions: false }]

// BEFORE (results/+layout.ts:23):
export const load: LayoutLoad = async ({ params, url }) => { … };
// AFTER:
export const load: LayoutLoad = async ({ params, url }) => { … };
//                                                                ^ This stays — `load` is
// idiomatically a `const` of type `LayoutLoad` because the type binds the parameter shape.
// `func-style` flags it because arrow is forbidden, but converting to a function declaration
// loses the `LayoutLoad` annotation:

// CORRECT after-form:
//   import type { LayoutLoad } from './$types';
//   export const load: LayoutLoad = async ({ params, url }) => { … };
//                ^^^^^^^^^^^^^^^^                              ^^^^^^^
//   Keep this form, but inline-justify the disable since the type-binding makes
//   declaration form lossy:
//
//   // eslint-disable-next-line func-style -- reason: LayoutLoad type binding requires
//   // const-style annotation; declaration loses param type narrowing.
//   export const load: LayoutLoad = async ({ params, url }) => { … };

// FOR TRULY MECHANICAL CASES (e.g., +server.ts route handlers, helper utilities):
// BEFORE (candidate/auth/callback/+server.ts:19):
export const GET: RequestHandler = async ({ url, locals }) => { … };
// AFTER (same caveat — keep const + RequestHandler annotation OR convert to declaration form):
export async function GET({ url, locals }: Parameters<RequestHandler>[0]) { … }
// ── caveat: this loses the `RequestHandler` return-type narrowing.
// SAFER (matches D-02 inline-justification fallback):
// eslint-disable-next-line func-style -- reason: RequestHandler type-binding form
export const GET: RequestHandler = async ({ url, locals }) => { … };
```

> **Critical for planner:** the `func-style` rule, **for SvelteKit-typed exports** (`load: LayoutLoad`, `GET: RequestHandler`, `POST: RequestHandler`, etc.), generally **cannot** be cleanly converted without losing type narrowing. Per D-02, inline-justified disables are acceptable here. **6 of the 11 `func-style` errors are this pattern** (the 4 `+server.ts` + 2 `+page.ts`/`+layout.ts` `load` cases). The remaining 5 are pure-utility `const foo = () => …` that convert cleanly.

### Pattern 6: `consistent-type-imports` (auto-fix where possible)

**What:** Replace inline `import('…').Foo` annotations with top-of-file `import type { Foo } from '…'`.
**When to use:** 3 sites: `Button.type.ts:8`, `auth/__tests__/token-endpoint.test.ts:90`, `auth/getIdTokenClaims.test.ts:42`.

```typescript
// Source: VERIFIED — eslint rule @typescript-eslint/consistent-type-imports

// BEFORE (Button.type.ts:8):
badge?: import('svelte').Snippet;
// AFTER:
import type { Snippet } from 'svelte';
// …
badge?: Snippet;

// BEFORE (token-endpoint.test.ts:90):
} as unknown as Parameters<typeof import('../../../../../routes/api/oidc/token/+server').POST>[0];
// AFTER:
import type { POST } from '../../../../../routes/api/oidc/token/+server';
// …
} as unknown as Parameters<typeof POST>[0];

// AUTO-FIX: try `yarn workspace @openvaa/frontend lint:fix` first.
// The rule is auto-fixable; the 3 errors at HEAD have likely persisted because the
// import path appears in a generic position the auto-fixer can't extract. Manual fix.
```

### Pattern 7: `no-unused-expressions` — Svelte 5 `$effect` subscription

**What:** A bare `entities;` statement inside a Svelte 5 `$effect` block that exists solely to register the dependency. The lint rule sees an expression statement with no side effect.
**When to use:** Single site: `EntityListControls.svelte:72` (`entities; updateFilters();`).

```typescript
// Source: VERIFIED — EntityListControls.svelte:71-74
// $effect(() => {
//   entities;          // ← line 72, lint error
//   updateFilters();
// });

// FIX (idiomatic Svelte 5):
$effect(() => {
  void entities;       // explicit void — flags the dependency-only read clearly
  updateFilters();
});

// ALTERNATIVE: inline the read into the function call:
$effect(() => {
  updateFilters();
  // (updateFilters reads `entities` directly; the explicit subscription becomes implicit)
});
// ── this works ONLY if updateFilters reads `entities` synchronously; verify before applying.
//    Looking at line 76-79, `updateFilters` does read `filterGroup`/`entities`/etc, so
//    inlining works. BUT if the call is async or wrapped, the dep registration breaks.
//    Safest: use `void entities;` with no behavior change.
```

### Anti-Patterns to Avoid

- **Adding `// eslint-disable @typescript-eslint/no-explicit-any` at file-top.** Defeats the rule. Per D-03 + D-02, only per-line inline-justified disables are acceptable.
- **Replacing `any` with `unknown` everywhere without narrowing.** `unknown` propagates, eventually forcing `as any` at use sites. Always narrow at the boundary.
- **Auto-fixing the entire file with `lint:fix` and reviewing the diff later.** Some auto-fixes change runtime behavior (e.g., `func-style` declaration vs. const-with-type-annotation). Review per-error.
- **Converting `export const load: LayoutLoad = …` to `export async function load(…)` to satisfy `func-style`.** Loses type narrowing. Use inline-justified disable instead (D-02 fallback).
- **Renaming type parameters without searching for downstream consumers.** A `T → TRow` rename inside `mapRow` is local; a rename in `voterContext.svelte.ts:91` may need to follow consumers. Always `git grep` after renaming.
- **Replacing `data: any` with `data: { userData: unknown }` ad-hoc.** Use `LayoutData` from `./$types` — auto-generated by SvelteKit. Drift-free.
- **Touching `apps/frontend/src/lib/paraglide/**`.** Lint-ignored; do not edit.

## Don't Hand-Roll

| Problem                                       | Don't Build                                                | Use Instead                                                                                                    | Why                                                                                                                                                                                              |
| --------------------------------------------- | ---------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| DB-row type definitions                       | Hand-rolled `interface CandidateRow { … }`                  | `Tables<'candidates'>['Row']` from `@openvaa/supabase-types`                                                   | Generated from schema; regenerates on `yarn supabase:types`. Never drifts. Already imported in `app.d.ts`, `supabase/server.ts`, `supabase/browser.ts`, `supabaseAdapter.ts`, `mapRow.ts`. |
| Snake_case → camelCase rename at boundary     | A new mapper function inside `+layout.svelte`              | `mapRow()` + `COLUMN_MAP` from `@openvaa/supabase-types` (already used in adapter)                              | Existing infra. Phase 71 doesn't add new mappers — the existing ones already cover all DB-row sites (which is why none of the 13 `naming-convention` errors are DB-row).                          |
| Route `data` prop type                        | Ad-hoc inline `{ userData: User; nominationData: Nominations }` | `LayoutData` / `PageData` from `./$types`                                                                       | Auto-generated by SvelteKit from the colocated `+layout.ts`/`+page.ts` load function return type. Stays in sync.                                                                                  |
| OIDC JWT type                                 | Hand-rolled `interface JWTPayload { … }`                    | `jose.JWTPayload`, `jose.JWK` from `jose` package                                                              | Already imported in `getIdTokenClaims.test.ts`. Standard.                                                                                                                                        |
| Mock Supabase client typing                   | Hand-rolled `interface MockSupabase { from: …; rpc: … }`    | `ReturnType<typeof createMockSupabaseClient>` (already in test files)                                          | Existing pattern; the mock helper IS the type.                                                                                                                                                    |
| `unknown`-narrowed JSONB column shape         | A new helper `assertStoredImage(x: unknown): StoredImage`   | `Json` from `@openvaa/supabase-types` + the existing `parseStoredImage(stored, url)` null-guard                | `parseStoredImage` already handles null/undefined and missing `path`; it accepts `StoredImage | null | undefined`. Cast `Json` to that shape (Json is a structural superset; intersection is safe). |

**Key insight:** the project's typing infrastructure for this domain is **already in place** — `@openvaa/supabase-types` is built, `mapRow`/`COLUMN_MAP` are wired, `./$types` virtual modules exist for every route. Phase 71 is **applying existing infra**, not adding new typing scaffolding. Resist the urge to introduce new helpers; the right answer is almost always "import the existing type and propagate."

## Cluster Analysis (95 errors, fully enumerated)

### Cluster 1: `no-explicit-any` (67 errors)

#### Sub-cluster 1a — Test mocks (44 errors, 4 files)

The dominant pattern. Almost all are `serverClient: mockSupabase as any` casts at the test `init()` boundary plus `(result as any).foo` casts in assertions.

| File                                                                                       | Lines (col)                                                                                                                                                                                                                                                                                                                                                                                                                                                                                  | Count | Recommended Fix                                                                                                                                                  |
| ------------------------------------------------------------------------------------------ | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ----: | ---------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `lib/api/adapters/supabase/dataProvider/supabaseDataProvider.test.ts`                       | 82:37, 129:39, 136:25, 137:25, 138:25, 139:25, 177:39, 223:39, 230:65, 231:68, 252:39, 424:39, 651:64, 653:41, 684:64, 686:35, 713:65, 716:71, 812:64, 845:39, 850:66, 852:35, 999:39, 1069:39, 1076:47, 1131:40, 1374:55, 1375:49, 1391:49, 1392:43, 1408:49, 1409:37, 1441:48, 1441:63, 1464:48, 1464:63, 1478:48, 1479:48                                                                                                                                                                  |    38 | Pattern 2 — `MockClient`/`asSupabaseMock` helper for `serverClient` casts; local narrowed type for `(result as any).foo` assertions.                              |
| `lib/api/adapters/supabase/adminWriter/supabaseAdminWriter.test.ts`                         | 50:37, 76:39, 109:43, 130:45, 154:45                                                                                                                                                                                                                                                                                                                                                                                                                                                          |     5 | Pattern 2 — same helper.                                                                                                                                          |
| `lib/api/adapters/supabase/dataWriter/supabaseDataWriter.test.ts`                           | 45:37                                                                                                                                                                                                                                                                                                                                                                                                                                                                                         |     1 | Pattern 2 — same helper.                                                                                                                                          |
| `lib/api/adapters/supabase/utils/storageUrl.test.ts`                                       | 36:43                                                                                                                                                                                                                                                                                                                                                                                                                                                                                         |     1 | One-off — likely a test fixture cast on a Json/StoredImage shape; verify and cast to `Partial<StoredImage>` or `Json | null`.                                       |

> **Researcher note:** the test-mock cluster is **44 errors**, not the "~50 of 67" the deferred doc estimated. The remaining 17 (sub-clusters 1b–1d) are production code. The plan should sub-batch this as the largest single commit.

#### Sub-cluster 1b — Production adapter code (17 errors, 2 files)

| File                                                                          | Lines (col)                                                                                                  | Count | Recommended Fix                                                                                                                                                                                                                                                                          |
| ----------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------ | ----: | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `lib/api/adapters/supabase/dataProvider/supabaseDataProvider.ts`              | 101:66, 102:52, 103:60, 154:46, 187:46, 210:46, 320:46, 351:55, 352:55, 447:48, 448:48, 478:46, 486:40, 527:46 |    14 | Pattern 1 — `Json | null` casts. All sites are `parseStoredImage(row.X as any, supabaseUrl)` (image fields) or `parseAnswers(row.X as any, locale)` (answers JSONB) or `(cat as any).electionIds` (filtered array narrowing).                                                            |
| `lib/api/adapters/supabase/dataWriter/supabaseDataWriter.ts`                  | 205:50, 220:55, 349:45                                                                                       |     3 | Pattern 1 — same; line 220 is `(n: any) => …` map callback (use `Tables<'nominations'>['Row']` directly), 205 is `entityRow.image as any`, 349 is `data.image as any` — both `Json | null`.                                                                                              |

#### Sub-cluster 1c — Route layouts (5 errors, 5 files)

All five are `let { data, children }: { data: any; children: Snippet } = $props();`.

| File                                                              | Line  | Recommended Fix                                                                                                                                                  |
| ----------------------------------------------------------------- | ----- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `routes/(voters)/(located)/+layout.svelte`                        | 31:35 | Pattern 3 — `import type { LayoutData } from './$types'`; `data: LayoutData`. Verify `./$types` exposes `LayoutData` (yes — colocated `+layout.ts` exists at `routes/(voters)/(located)/+layout.ts`). |
| `routes/(voters)/nominations/+layout.svelte`                       | 21:35 | Pattern 3.                                                                                                                                                       |
| `routes/admin/(protected)/+layout.svelte`                          | 17:35 | Pattern 3.                                                                                                                                                       |
| `routes/admin/(protected)/argument-condensation/+layout.svelte`    | 20:35 | Pattern 3.                                                                                                                                                       |
| `routes/admin/(protected)/question-info/+layout.svelte`            | 20:35 | Pattern 3.                                                                                                                                                       |

#### Sub-cluster 1d — Misc (1 error, already counted in 1a — covered above)

Note: `storageUrl.test.ts:36` was counted in 1a but is genuinely production-flavored test fixture; treat as 1a.

**Total no-explicit-any: 38 + 5 + 1 + 1 + 14 + 3 + 5 = 67 ✓** matches lint output.

### Cluster 2: `naming-convention` (13 errors)

**All 13 are type-parameter `T` violations (rule `^T[A-Z]`) plus 1 type-alias `_Unused`.** Zero DB-row snake_case sites. Classification per D-02: all (a) — fix at source via mechanical rename. No (b) third-party-immutable cases. No (c) escalations.

| File                                                          | Line:col | Symbol     | Recommended Rename             |
| ------------------------------------------------------------- | -------- | ---------- | ------------------------------ |
| `lib/api/adapters/supabase/utils/mapRow.ts`                   | 9:24     | `T`        | `TRow`                         |
| `lib/api/adapters/supabase/utils/mapRow.ts`                   | 22:28    | `T`        | `TObj` (since input is camelCase obj for write path) |
| `lib/api/adapters/supabase/utils/mapRow.ts`                   | 34:25    | `T`        | `TRow`                         |
| `lib/components/input/Input.type.ts`                          | 55:36    | `_TElement` | Rename to `TElement` AND change to PascalCase satisfying `^T[A-Z]` (it already does — but with leading `_`, the check is on `_T…` pattern → fails). **Either** drop the underscore (rename to `TElement`) **or** keep underscore + inline-justify. Recommended: drop underscore; rename uses inside the file (currently 1 reference at line 55 as a phantom param). |
| `lib/contexts/filter/filterContext.svelte.test.ts`            | 75:9     | `T`        | `TVal` (test fake `apply<T>(targets: Array<T>)`) |
| `lib/contexts/voter/voterContext.svelte.ts`                   | 91:21    | `T`        | `TItem` (helper `sameRefs<T>`)  |
| `lib/dynamic-components/entityList/EntityListWithControls.helpers.ts` | 18:26 | `T`        | `TFn` (apply method generic)    |
| `lib/dynamic-components/entityList/EntityListWithControls.helpers.ts` | 19:27 | `T`        | `TFn`                           |
| `lib/dynamic-components/entityList/EntityListWithControls.helpers.ts` | 47:13 | `_Unused`  | **Delete the line** (verified zero downstream consumers via grep; the `_Unused` type alias has no users) OR rename to `Unused` if kept. Recommended: delete + comment cleanup.                       |
| `lib/dynamic-components/entityList/EntityListWithControls.svelte` | 108:28 | `T`     | `TFn` (matches helpers form)    |
| `lib/dynamic-components/entityList/EntityListWithControls.test.ts` | 23:9   | `T`        | `TVal`                          |
| `lib/dynamic-components/entityList/EntityListWithControls.test.ts` | 40:9   | `T`        | `TVal`                          |
| `lib/dynamic-components/entityList/EntityListWithControls.test.ts` | 49:9   | `T`        | `TVal`                          |

**Total: 13 ✓** matches lint output.

> **Cross-plan caveat:** `EntityListWithControls.helpers.ts` (47:13) and `EntityListWithControls.svelte` (108:28) appear in BOTH Cluster 2 and Cluster 3 (`func-style`). See §10 Cross-Plan File Conflict Audit.

### Cluster 3: `func-style` (11 errors)

| File                                                     | Line  | Context                                              | Conversion Cleanly?                                                                  | Fix                                                                                                                            |
| -------------------------------------------------------- | ----- | ---------------------------------------------------- | ------------------------------------------------------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------ |
| `lib/api/adapters/supabase/utils/storageUrl.ts`          | 31:9  | `const toUrl = (p: string) => …` (local helper)       | YES                                                                                  | `function toUrl(p: string) { … }`                                                                                              |
| `lib/contexts/app/getRoute.svelte.ts`                    | 36:9  | `const buildFn: () => RouteBuilder = () => { … }`     | YES (lose type-binding `: () => RouteBuilder`, but inferred return matches)          | `function buildFn(): RouteBuilder { … }`                                                                                       |
| `lib/contexts/filter/filterContext.svelte.ts`            | 83:11 | `const handler = () => { version++; }`               | YES                                                                                  | `function handler() { version++; }`                                                                                            |
| `lib/contexts/utils/StackedState.svelte.test.ts`         | 81:11 | `const mergeUpdater = (current, value) => […]`        | YES                                                                                  | `function mergeUpdater(current: …, value: …) { return [ … ]; }`                                                                |
| `lib/contexts/utils/persistedState.svelte.test.ts`       | 36:11 | `const createMockStorage = (): Storage => ({ … })`    | YES                                                                                  | `function createMockStorage(): Storage { return { … }; }`                                                                      |
| `lib/dynamic-components/entityList/EntityListWithControls.svelte` | 91:11 | `const handler = () => { searchVersion++; }`     | YES                                                                                  | `function handler() { searchVersion++; }`                                                                                      |
| `routes/(voters)/(located)/results/+layout.ts`           | 23:14 | `export const load: LayoutLoad = async (…) => { … }`  | NO — type-binding lost                                                                | Inline-justified disable OR convert to `export async function load({ params, url }: Parameters<LayoutLoad>[0]) { … }` (loses return narrowing). **Recommended: inline disable per D-02.** |
| `routes/(voters)/(located)/results/[[…]]/+page.ts`       | 28:14 | `export const load: PageLoad = async (…) => { … }`    | NO                                                                                   | Inline-justified disable.                                                                                                      |
| `routes/+layout.svelte`                                  | 164:11 | `const handler = () => { … }` (inside `$effect`)      | YES                                                                                  | `function handler() { … }` — but verify `$effect` block tolerates the hoist (it does; named function declarations hoist within the block). |
| `routes/candidate/auth/callback/+server.ts`              | 19:14 | `export const GET: RequestHandler = async (…) => …`   | NO                                                                                   | Inline-justified disable.                                                                                                      |
| `routes/candidate/auth/logout/+server.ts`                | 12:14 | `export const POST: RequestHandler = async (…) => …` | NO                                                                                   | Inline-justified disable.                                                                                                      |

**Total: 11 ✓** matches lint output. **5 mechanical, 4 inline-disable, 2 hybrid (the +server.ts handlers — inline disable is the simpler choice).**

> **Per D-02 inline-disable format:**
> ```typescript
> // eslint-disable-next-line func-style -- reason: SvelteKit RequestHandler type-binding requires const-form annotation
> export const GET: RequestHandler = async ({ url, locals }) => { … };
> ```
> Use `--` for ESLint's inline-comment-justification syntax (matches existing project convention).

### Cluster 4: Long-tail (4 errors)

#### consistent-type-imports (3)

| File                                                         | Line:col | Issue                                          | Auto-fixable? | Recommended Fix                                                                                              |
| ------------------------------------------------------------ | -------- | ---------------------------------------------- | ------------- | ------------------------------------------------------------------------------------------------------------ |
| `lib/api/utils/auth/__tests__/token-endpoint.test.ts`        | 90:37    | `import('…').POST` inline                       | UNCERTAIN      | Pattern 6 — manual lift to top-of-file `import type { POST }`.                                                |
| `lib/api/utils/auth/getIdTokenClaims.test.ts`                | 42:46    | `import('jose')` (importOriginal generic)       | UNCERTAIN      | Pattern 6 — likely `vi.mock` callback; manual fix may need `import type * as JoseType from 'jose'` at top.   |
| `lib/components/button/Button.type.ts`                       | 8:11     | `import('svelte').Snippet`                       | YES            | Pattern 6 — auto-fix should resolve. If not: lift to `import type { Snippet } from 'svelte'`.                  |

> **Recommendation:** run `yarn workspace @openvaa/frontend lint:fix` first; review which of the 3 are auto-fixed. Manually fix the rest. Sometimes the rule's auto-fix misses inline annotations in generic positions.

#### no-unused-expressions (1)

| File                                                              | Line:col | Issue                                                                  | Recommended Fix                                |
| ----------------------------------------------------------------- | -------- | ---------------------------------------------------------------------- | ---------------------------------------------- |
| `lib/dynamic-components/entityList/EntityListControls.svelte`     | 72:5     | Bare `entities;` statement inside `$effect` for dep registration       | Pattern 7 — `void entities;` (preserves intent) |

**Total long-tail: 3 + 1 = 4 ✓** matches lint output.

## Cross-Plan File Conflict Audit (§10 enumeration)

For 4 parallelizable plans (D-01) to run safely, no file should appear in multiple rule clusters being fixed in parallel.

| File                                                          | Plans Affected                            | Conflict?  |
| ------------------------------------------------------------- | ----------------------------------------- | ---------- |
| `EntityListWithControls.helpers.ts`                           | Plan-71-02 (3 T-naming + 1 _Unused)       | NO — single plan touches it  |
| `EntityListWithControls.svelte`                               | Plan-71-02 (1 T-naming) + Plan-71-03 (1 func-style) | **YES** — 2 plans touch it |
| `EntityListControls.svelte`                                   | Plan-71-04 (1 no-unused-expressions)      | NO         |
| `mapRow.ts`                                                   | Plan-71-02 (3 T-naming)                   | NO         |
| `storageUrl.ts`                                               | Plan-71-03 (1 func-style)                 | NO         |
| `storageUrl.test.ts`                                          | Plan-71-01 (1 any)                        | NO         |
| `supabaseDataProvider.ts`                                     | Plan-71-01 (14 anys)                      | NO         |
| `supabaseDataProvider.test.ts`                                | Plan-71-01 (38 anys)                      | NO         |
| `supabaseDataWriter.ts`                                       | Plan-71-01 (3 anys)                       | NO         |
| `supabaseDataWriter.test.ts`                                  | Plan-71-01 (1 any)                        | NO         |
| `supabaseAdminWriter.test.ts`                                 | Plan-71-01 (5 anys)                       | NO         |
| `Input.type.ts`                                               | Plan-71-02 (1 T-naming)                   | NO         |
| `filterContext.svelte.ts`                                     | Plan-71-03 (1 func-style)                 | NO         |
| `filterContext.svelte.test.ts`                                | Plan-71-02 (1 T-naming)                   | NO         |
| `voterContext.svelte.ts`                                      | Plan-71-02 (1 T-naming)                   | NO         |
| `getRoute.svelte.ts`                                          | Plan-71-03 (1 func-style)                 | NO         |
| `StackedState.svelte.test.ts`                                 | Plan-71-03 (1 func-style)                 | NO         |
| `persistedState.svelte.test.ts`                               | Plan-71-03 (1 func-style)                 | NO         |
| `EntityListWithControls.test.ts`                              | Plan-71-02 (3 T-naming)                   | NO         |
| `Button.type.ts`                                              | Plan-71-04 (1 import-type)                | NO         |
| `auth/__tests__/token-endpoint.test.ts`                       | Plan-71-04 (1 import-type)                | NO         |
| `auth/getIdTokenClaims.test.ts`                               | Plan-71-04 (1 import-type)                | NO         |
| 5x `+layout.svelte` (route layouts)                           | Plan-71-01 (1 any each)                   | NO         |
| `+layout.svelte` (root)                                       | Plan-71-03 (1 func-style)                 | NO         |
| 4x `+page.ts` / `+layout.ts` / `+server.ts` (route handlers)  | Plan-71-03 (1 func-style each)            | NO         |

**Conflict count: 1 file** (`EntityListWithControls.svelte`).

**Mitigation options for the planner:**
1. **Sequence Plan-71-02 and Plan-71-03** for that file only — Plan-71-02 lands the T-naming first, then Plan-71-03 picks up the file in the func-style sweep. Adds a tiny ordering constraint but keeps both plans in their natural rule scope.
2. **Move both fixes into one plan** — fold the single func-style site (line 91) into Plan-71-02. Asymmetric (one plan has 14 errors, other has 10), but no conflict.
3. **Run all 4 plans against the same baseline branch and merge sequentially** with auto-rebase on conflict. Default for D-01-style parallel plans; conflict at line 91 vs line 108 is far apart enough that a 3-way merge resolves cleanly without manual intervention.

**Recommended:** option 3 (merge-sequential, accept the rebase). The two edits are 17 lines apart and modify different tokens; auto-merge succeeds.

## Risks & Mitigations

| # | Risk                                                                                                                                                                                                                                                                            | Likelihood | Mitigation                                                                                                                                                                                                                                                                                                                              |
| - | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 1 | **`./$types` `LayoutData` is `Record<string, never>`** for a route whose load function returns nothing or whose load file doesn't exist. Then `data.userData` reads break.                                                                                                       | LOW        | Per-site verify: `cat apps/frontend/src/routes/<path>/+layout.ts` (or `+layout.server.ts`) before applying Pattern 3. If load returns `userData`, `LayoutData` already has it. The 5 sites all have load functions (verified for `(voters)/(located)/+layout.ts`); spot-check the other 4 in plan-task time.                          |
| 2 | **Snake_case→camelCase rename propagates downstream.** If a context destructures a renamed property (e.g., `const { electionDate } = ctx`), the read is captured at init (CLAUDE.md "Context Destructuring Rule") and stale.                                                       | NONE       | Phase 71 does **not** rename DB-row snake_case keys (cluster analysis confirmed). The 13 naming-convention errors are type parameters; the rename is local to the type file. No context propagation. **Risk does not apply.**                                                                                                            |
| 3 | **svelte-check baseline regresses past 160 err / 0 warn.** A type tightening surfaces a type error svelte-check missed.                                                                                                                                                          | MEDIUM     | After each plan: run `yarn workspace @openvaa/frontend check` and grep the trailing summary. If err count goes up, identify the new error, decide accept-vs-fix per D-05. Reductions are welcome but not gated.                                                                                                                          |
| 4 | **`as Json | null` cast to `parseStoredImage`** doesn't structurally match `StoredImage | null | undefined`.                                                                                                                                                                    | LOW        | `parseStoredImage` does runtime null/path guard at line 29 (`if (!stored?.path) return undefined`) — Json is a structural superset of `{ path: string; pathDark?: string; … }` minus undefined narrowing. **Verify by spot-running** the affected provider tests after the cast change; tests pass = OK. If cast fails in TS, fall back to `as unknown as StoredImage | null`. |
| 5 | **`func-style` inline disables proliferate** — if executors apply inline disables to mechanical sites, defeats D-02's "fix at source" intent.                                                                                                                                    | LOW        | Plan task guidance: only inline-disable for type-binding cases (load/RequestHandler/PageLoad). For the 5 mechanical sites, convert to function declaration. Plan-71-03's Wave 0 audit pass classifies each of the 11 sites.                                                                                                              |
| 6 | **Test mock cast `as unknown as SupabaseClient<Database>` becomes the test's load-bearing assertion** — if the mock structurally diverges from the SDK in a way the cast hides, tests pass on a bug.                                                                              | LOW        | This is a regression of an existing risk; the current `as any` cast is even worse. The mock helper is structurally tested by the same suite that uses it (lines 38-71 vs 73+). No new risk introduced.                                                                                                                                  |
| 7 | **Phase 70's bind-rationale strip already touched some of these files** — merge conflict if Phase 70 is in flight.                                                                                                                                                                | LOW        | Phase 70 is **complete** (per ROADMAP Coverage table — both WARN-01 and BIND-01 status: Complete). Phase 71 lands against a clean Phase 70 baseline. No conflict.                                                                                                                                                                          |
| 8 | **`yarn lint:fix` on the long-tail plan accidentally edits files outside the 4 long-tail errors** — auto-fix can rewrite import sort order, type-only conversions, etc., across the whole frontend.                                                                              | MEDIUM     | Plan-71-04 (or merged Plan-71-03) explicitly limits `lint:fix` to scoped paths, e.g., `yarn workspace @openvaa/frontend lint:fix -- src/lib/components/button/Button.type.ts src/lib/api/utils/auth/__tests__/token-endpoint.test.ts src/lib/api/utils/auth/getIdTokenClaims.test.ts`. Review diff before commit.                          |
| 9 | **The 38-error commit on `supabaseDataProvider.test.ts`** is a single-file diff so large it's hard to review.                                                                                                                                                                     | MEDIUM     | Sub-batch within Plan-71-01 by sub-cluster: (a) `MockClient` helper introduction (1 small diff), (b) `serverClient: as any` → `asSupabaseMock(…)` mass-replace (mechanical, easy review), (c) `(result as any).foo` assertions narrowed per-test (judgment-required, smaller diffs). Three commits within the plan.                          |
| 10 | **`_Unused` type alias deletion** breaks a downstream consumer the grep missed.                                                                                                                                                                                                  | NONE       | `git grep "_Unused\b" apps/frontend/` at HEAD: zero matches outside the definition file. Safe to delete. (Verified by researcher.)                                                                                                                                                                                                       |

## Code Examples (verified patterns from project source)

### Example 1: Existing snake_case → camelCase boundary via mapRow + COLUMN_MAP

```typescript
// Source: VERIFIED — apps/frontend/src/lib/api/adapters/supabase/utils/mapRow.ts:1-37
import { COLUMN_MAP, PROPERTY_MAP } from '@openvaa/supabase-types';

export function mapRow<TRow extends Record<string, unknown>>(row: TRow): Record<string, unknown> {
  const result: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(row)) {
    const mappedKey = (COLUMN_MAP as Record<string, string>)[key] ?? key;
    result[mappedKey] = value;
  }
  return result;
}

// CONFIRMS: the boundary already exists. Phase 71's naming-convention plan is
// NOT about adding boundary rename; it's about renaming the type parameter `T`
// to `TRow` to satisfy the `^T[A-Z]` rule.
```

### Example 2: Existing Database type import in adapter

```typescript
// Source: VERIFIED — apps/frontend/src/lib/api/adapters/supabase/supabaseAdapter.ts:5
import type { Database } from '@openvaa/supabase-types';

// And app.d.ts:1, supabase/server.ts:3, supabase/browser.ts:3, supabaseAdapter.type.ts:1.
// Five places already import Database. Phase 71 propagates this further into the
// data-provider/writer files where `as any` casts persist.
```

### Example 3: Test mock pattern

```typescript
// Source: VERIFIED — supabaseDataProvider.test.ts:38-71 (factory) + 75 (type alias use)
function createMockSupabaseClient() {
  const mockResponses: Record<string, { data: unknown; error: unknown }> = {};
  const mockRpcResponses: Record<string, { data: unknown; error: unknown }> = {};
  function createChain(table: string) { /* … */ }
  const client = {
    from: vi.fn((table: string) => createChain(table)),
    rpc: vi.fn((fnName: string, _params?: Record<string, unknown>) => { /* … */ }),
    _mockResponses: mockResponses,
    _mockRpcResponses: mockRpcResponses
  };
  return client;
}

// existing pattern — mockSupabase is typed as the factory's return type:
let mockSupabase: ReturnType<typeof createMockSupabaseClient>;

// Phase 71 fix — introduce a single helper that handles the SupabaseClient<Database>
// cast at one site instead of `as any` everywhere:
type MockClient = ReturnType<typeof createMockSupabaseClient>;
const asSupabaseMock = (m: MockClient) =>
  // reason: createMockSupabaseClient is structural-only; SupabaseClient<Database> has 50+ methods we don't mock
  m as unknown as SupabaseClient<Database>;
```

### Example 4: Existing `unknown` + narrow pattern at adapter

```typescript
// Source: VERIFIED — apps/frontend/src/lib/api/adapters/supabase/dataProvider/supabaseDataProvider.ts:88
const raw = (data?.customization ?? {}) as Record<string, unknown>;

// existing pattern — `Record<string, unknown>` is the project's idiom for "this is a
// JSONB blob whose shape is loosely-known and we narrow per-key". Phase 71 follows
// this pattern for the `as any` JSONB sites.
```

## Fix-Pattern Templates (paste-ready for plan tasks)

### Template A — Plan-71-01 task: Supabase test-mock anys

```markdown
**Action:** In `<test file path>`, replace all `serverClient: mockSupabase as any` with `serverClient: asSupabaseMock(mockSupabase)` after introducing the `MockClient` + `asSupabaseMock` helper at the top of the file. Replace all `(result as any).foo` assertions with locally-narrowed type casts (e.g., `(result as Partial<DynamicSettings> & { notifications?: { … } }).notifications?.…`).

**Verify:**
- `yarn workspace @openvaa/frontend lint:check 2>&1 | grep "no-explicit-any" | grep "<test file>"` returns 0 lines.
- `yarn workspace @openvaa/frontend test:unit -- <test file>` passes.

**Reason-tag (where unknown-cast is needed):**
- `// reason: createMockSupabaseClient is structural-only; SupabaseClient<Database> has 50+ methods we don't mock`
```

### Template B — Plan-71-01 task: Production adapter anys

```markdown
**Action:** In `apps/frontend/src/lib/api/adapters/supabase/{dataProvider/supabaseDataProvider,dataWriter/supabaseDataWriter}.ts`, replace `as any` casts on `row.image`, `row.entity_image`, `row.answers`, `row.entity_answers`, `data.image`, `entityRow.image`, `(cat as any).electionIds` with explicit `as Json | null` (importing `Json` from `@openvaa/supabase-types`) or `as Tables<'name'>['Row']['col']` for typed columns. For `(n: any) => …` map callback at supabaseDataWriter.ts:220, replace with the literal SDK return-row type from `.from('nominations').select('…')` chain (use `Tables<'nominations'>['Row']` or the inferred `Awaited<ReturnType<typeof query>>['data'][number]`).

**Verify:**
- `yarn workspace @openvaa/frontend lint:check 2>&1 | grep "no-explicit-any" | grep "supabaseDataProvider\.ts\|supabaseDataWriter\.ts"` returns 0 lines.
- `yarn workspace @openvaa/frontend test:unit` (full unit suite) passes.
- `yarn workspace @openvaa/frontend check 2>&1 | tail -1` shows ≤ 160 ERRORS.
```

### Template C — Plan-71-01 task: Route layout `data: any` props

```markdown
**Action:** In each of the 5 sites, replace `let { data, children }: { data: any; children: Snippet } = $props();` with:

\```svelte
<script lang="ts">
  import type { LayoutData } from './$types';
  // … other imports
  let { data, children }: { data: LayoutData; children: Snippet } = $props();
\```

If `LayoutData` is `Record<string, never>` (no colocated load function), either (a) verify if the load file exists by `ls` and confirm it returns a value, or (b) escalate as a planner question.

**Verify:**
- `yarn workspace @openvaa/frontend lint:check 2>&1 | grep "no-explicit-any" | grep "+layout\.svelte"` returns 0 lines.
- `yarn workspace @openvaa/frontend check 2>&1 | tail -1` shows ≤ 160 ERRORS.
```

### Template D — Plan-71-02 task: Type-parameter rename

```markdown
**Action:** In each of the 13 sites listed in §Cluster Analysis, rename `T` (or `_Unused`) per the table. For each rename:
1. `git grep -nE "<old-token>\b" <file>` to find all references in-file.
2. Rename the type parameter at the declaration AND all references in the same scope.
3. For the `_Unused` type alias at `EntityListWithControls.helpers.ts:47`, **delete** lines 43-47 (the type alias and its preceding comment). Researcher verified zero downstream consumers.

**Verify:**
- `yarn workspace @openvaa/frontend lint:check 2>&1 | grep "naming-convention"` returns 0 lines.
- `yarn workspace @openvaa/frontend test:unit` passes (rename should not affect runtime).
- `yarn workspace @openvaa/frontend check 2>&1 | tail -1` shows ≤ 160 ERRORS.
```

### Template E — Plan-71-03 task: func-style sweep

```markdown
**Action:** For each of the 11 sites:
- **Mechanical (5 sites):** convert `const foo = () => { … }` to `function foo() { … }`. Sites: storageUrl.ts:31, getRoute.svelte.ts:36, filterContext.svelte.ts:83, StackedState.svelte.test.ts:81, persistedState.svelte.test.ts:36, EntityListWithControls.svelte:91, +layout.svelte (root):164.
- **Type-binding (4 SvelteKit sites):** apply inline-justified disable. Sites: results/+layout.ts:23, results/[[…]]/+page.ts:28, candidate/auth/callback/+server.ts:19, candidate/auth/logout/+server.ts:12.

  Format: `// eslint-disable-next-line func-style -- reason: SvelteKit <TypeName> type-binding requires const-form annotation`

**Verify:**
- `yarn workspace @openvaa/frontend lint:check 2>&1 | grep "func-style"` returns 0 lines.
- `yarn workspace @openvaa/frontend test:unit` passes.
- `yarn workspace @openvaa/frontend check 2>&1 | tail -1` shows ≤ 160 ERRORS.
```

### Template F — Plan-71-04 task: long-tail (consistent-type-imports + no-unused-expressions)

```markdown
**Action:**

Step 1 — Try auto-fix for the 3 import-type errors:
\```bash
yarn workspace @openvaa/frontend lint:fix -- \
  src/lib/components/button/Button.type.ts \
  src/lib/api/utils/auth/__tests__/token-endpoint.test.ts \
  src/lib/api/utils/auth/getIdTokenClaims.test.ts
\```

Step 2 — For any error remaining after auto-fix, manually convert per Pattern 6 (lift to top-of-file `import type { X } from '…'`).

Step 3 — Fix the no-unused-expressions error at `EntityListControls.svelte:72`:
- Change `entities;` (line 72) to `void entities;`.

**Verify:**
- `yarn workspace @openvaa/frontend lint:check 2>&1 | grep -E "(consistent-type-imports|no-unused-expressions)"` returns 0 lines.
- `yarn workspace @openvaa/frontend test:unit` passes.
```

## State of the Art

| Old Approach                                           | Current Approach                                              | When Changed                       | Impact                                                                                                |
| ------------------------------------------------------ | ------------------------------------------------------------- | ---------------------------------- | ----------------------------------------------------------------------------------------------------- |
| `as any` casts on Supabase row data                    | `as Json | null` or `Tables<'name'>['Row']['col']`            | v2.6 Phase 63 (`@openvaa/supabase-types` introduced) | Existing infra; Phase 71 finishes the migration to the existing pattern.                                |
| Hand-rolled DB-row interface types                     | Generated `Database` from `supabase gen types typescript`     | v2.6 (supabase-types package)       | Single source of truth.                                                                                |
| `naming-convention` rule allows bare `T`               | Custom `^T[A-Z]` regex enforcement                            | v2.7 Phase 68 (rule additions)      | Phase 71 cleans up the residue. After: TFoo / TBar / TItem mandatory.                                  |
| `func-style` allows arrow-as-const                     | `'declaration', { allowArrowFunctions: false }` enforcement   | v2.7 Phase 68                      | Phase 71 cleans up residue + introduces inline-justified-disable pattern for type-binding sites.        |
| `import('…').Foo` inline annotations                   | `import type { Foo } from '…'` + named usage                  | v2.7 Phase 68 auto-fix sweep        | 3 residual sites Phase 71 cleans.                                                                      |

**Deprecated/outdated:**
- The "12 warn" baseline figure in `68-02-DEFERRED.md` and ROADMAP SC-2 — actual baseline at HEAD is **0 warn**. Phase 70's a11y/bind sweeps zeroed out warnings.
- The CONTEXT.md D-02 framing of "DB-row snake_case keys" — the 13 errors are not DB-row sites. Strategy still applies in spirit but Plan-71-02's actual work is type-parameter renames.

## Assumptions Log

| #  | Claim                                                                                                                                                  | Section                                                       | Risk if Wrong                                                                                                                                                                       |
| -- | ------------------------------------------------------------------------------------------------------------------------------------------------------ | ------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| A1 | `LayoutData` from `./$types` already includes the fields each route's `data` consumes (e.g., `userData`, `nominationData`)                              | Pattern 3 / Sub-cluster 1c                                    | Cast-mismatch at the layout file; executor finds the load function returns less than `data.userData`. Resolution: extend the load function or escalate.                              |
| A2 | `Json | null` cast structurally matches `StoredImage | null | undefined` for `parseStoredImage` calls                                                  | Pattern 1 / Risks #4                                          | TS rejects the cast → fall back to `as unknown as StoredImage | null`. Tests still pass (runtime is identical).                                                                       |
| A3 | The 3 `consistent-type-imports` errors are at least partially auto-fixable                                                                              | Cluster 4 / Pattern 6                                         | Auto-fix doesn't resolve them → manual lift to top-of-file `import type` (mechanical, low-risk).                                                                                     |
| A4 | `_Unused` type alias at `EntityListWithControls.helpers.ts:47` has zero downstream consumers                                                            | §Cluster 2 / Risks #10                                        | Verified by `git grep "_Unused\b"` returning zero matches outside the definition. **Verified — not assumed.**                                                                       |
| A5 | `func-style` inline disable with `-- reason: …` syntax is recognized by ESLint flat-config + project's existing convention                              | Pattern 5 / Template E                                        | Verified via the project's existing pattern (`// bind: keep —` in v2.7 P65). The `--` separator is ESLint flat-config standard for inline justifications. **Cited: ESLint docs.** |

**Verified items moved out of assumed (no claim is `[ASSUMED]`):**
- All 95 errors enumerated against live lint output `[VERIFIED: yarn workspace @openvaa/frontend lint:check at HEAD feat-gsd-roadmap]`.
- svelte-check baseline `[VERIFIED: yarn workspace @openvaa/frontend check at HEAD]`.
- `@openvaa/supabase-types` exports `[VERIFIED: packages/supabase-types/src/index.ts]`.
- `Database`/`Tables`/`Json` types `[VERIFIED: packages/supabase-types/src/database.ts]`.
- Existing `mapRow` + `COLUMN_MAP` pattern `[VERIFIED: apps/frontend/src/lib/api/adapters/supabase/utils/mapRow.ts]`.
- No DB-row snake_case naming-convention errors `[VERIFIED: per-line lint output classification]`.
- Zero `// reason:` matches at HEAD `[VERIFIED: git grep]`.
- Phase 70 complete `[VERIFIED: REQUIREMENTS.md Coverage table]`.
- 5 route `+layout.svelte` `data: any` sites (and which routes) `[VERIFIED: per-file inspection]`.

## Open Questions

1. **Should Plan-71-02's framing be corrected to "type-parameter naming sweep"?**
   - What we know: All 13 errors are type-parameter `T → TX` renames (12) + 1 `_Unused` type alias.
   - What's unclear: Whether the planner/orchestrator preserve the CONTEXT.md plan-name verbatim or update to match scope.
   - Recommendation: Plan-71-02's PLAN.md introduces the corrected framing in its Summary section but keeps the file name `71-02-PLAN-naming-convention.md` for traceability with CONTEXT.md.

2. **Should Plan-71-03 (func-style) and Plan-71-04 (long-tail) merge?**
   - What we know: 11 + 4 = 15 errors, no shared files between the two clusters, mechanical fixes.
   - What's unclear: Whether splitting into two reviews vs. one review better serves the user.
   - Recommendation: **MERGE** into Plan-71-03 with two sub-batches (func-style sweep, long-tail). Reduces orchestrator overhead; keeps reviewability via sub-batch commits.

3. **27 unused-imports/no-unused-vars warnings — handle inline or defer?**
   - What we know: 27 sites across ~20 files; many are `restProps` in Svelte 5 components (8 sites, all matching `restProps: any` pattern).
   - What's unclear: User preference between "address opportunistically" vs. "separate cleanup commit at end".
   - Recommendation: Address inline only when a plan's diff already touches the file. Otherwise defer to a v2.9+ hygiene phase.

4. **`EntityListWithControls.svelte` cross-plan conflict resolution.**
   - What we know: 1 T-naming error (line 108) + 1 func-style error (line 91) → both Plan-71-02 and Plan-71-03 touch the file.
   - What's unclear: Whether the planner prefers (a) sequential plan ordering for that file, (b) folding the 1 func-style site into Plan-71-02, or (c) merge-sequential parallel execution with auto-rebase.
   - Recommendation: (c) — auto-rebase. The two edits are 17 lines apart; merge succeeds without manual intervention.

## Environment Availability

The phase has no external dependencies beyond the existing toolchain.

| Dependency                       | Required By                                          | Available    | Version (lockfile)        | Fallback |
| -------------------------------- | ---------------------------------------------------- | ------------ | ------------------------- | -------- |
| Node.js                          | yarn / lint / vitest                                 | ✓ (existing) | per repo `.nvmrc` / engines | —        |
| Yarn 4                           | workspace runner                                     | ✓ (existing) | corepack-pinned            | —        |
| TypeScript                       | type-check                                           | ✓ (existing) | catalog                    | —        |
| ESLint flat config                | rule enforcement                                     | ✓ (existing) | catalog                    | —        |
| Vitest                           | unit-test gate                                       | ✓ (existing) | catalog                    | —        |
| svelte-check                     | regression-baseline gate                             | ✓ (existing) | catalog                    | —        |
| `@openvaa/supabase-types`        | `Database` / `Tables` / `Json` imports               | ✓ (built)    | workspace:^ (0.1.0)        | —        |
| `@supabase/supabase-js` types    | `SupabaseClient<Database>` cast in test mocks         | ✓ (built)    | catalog                    | —        |
| `jose` types                     | OIDC test fixtures                                   | ✓ (built)    | catalog                    | —        |

**Missing dependencies with no fallback:** none.
**Missing dependencies with fallback:** none.

## Validation Architecture

### Test Framework
| Property             | Value                                                                                                        |
| -------------------- | ------------------------------------------------------------------------------------------------------------ |
| Framework            | ESLint flat-config (lint), svelte-check 4.x (type baseline), Vitest (unit), Playwright (E2E parity baseline)  |
| Config file          | `packages/shared-config/eslint.config.mjs` (lint rules); `apps/frontend/tsconfig.json` (svelte-check)          |
| Quick run command    | `yarn workspace @openvaa/frontend lint:check 2>&1 | tail -10`                                                |
| Full suite command   | `yarn lint:check && yarn workspace @openvaa/frontend check && yarn test:unit`                                |

### Phase Requirements → Test Map

| Req ID    | Behavior                                                                                                                                                  | Test Type             | Automated Command                                                                                                                            | File Exists? |
| --------- | --------------------------------------------------------------------------------------------------------------------------------------------------------- | --------------------- | -------------------------------------------------------------------------------------------------------------------------------------------- | ------------ |
| TYPING-01 | Frontend lint:check exits 0                                                                                                                                | static / lint         | `yarn workspace @openvaa/frontend lint:check; echo $?` → 0                                                                                    | ✅            |
| TYPING-01 | No `no-explicit-any` errors remain                                                                                                                         | static (rule)         | `yarn workspace @openvaa/frontend lint:check 2>&1 | grep -c "no-explicit-any"` → 0                                                            | ✅            |
| TYPING-01 | No `naming-convention` errors remain                                                                                                                       | static (rule)         | `yarn workspace @openvaa/frontend lint:check 2>&1 | grep -c "naming-convention"` → 0                                                          | ✅            |
| TYPING-01 | No `func-style` errors remain                                                                                                                              | static (rule)         | `yarn workspace @openvaa/frontend lint:check 2>&1 | grep -c "func-style"` → 0                                                                 | ✅            |
| TYPING-01 | No `consistent-type-imports` errors remain                                                                                                                  | static (rule)         | `yarn workspace @openvaa/frontend lint:check 2>&1 | grep -c "consistent-type-imports"` → 0                                                     | ✅            |
| TYPING-01 | No `no-unused-expressions` errors remain                                                                                                                    | static (rule)         | `yarn workspace @openvaa/frontend lint:check 2>&1 | grep -c "no-unused-expressions"` → 0                                                       | ✅            |
| TYPING-01 | Root monorepo lint:check is green                                                                                                                          | static (root)         | `yarn lint:check; echo $?` → 0                                                                                                                | ✅            |
| TYPING-01 | svelte-check baseline does not regress beyond 160 ERRORS                                                                                                    | static (regression)   | `yarn workspace @openvaa/frontend check 2>&1 | grep -oE "[0-9]+ ERRORS" | head -1 | awk '{print $1}'` → ≤ 160                              | ✅            |
| TYPING-01 | Unit test suite passes                                                                                                                                      | unit                  | `yarn test:unit; echo $?` → 0                                                                                                                | ✅            |
| TYPING-01 | v2.7-close Playwright parity baseline still passes                                                                                                          | E2E (manual gate)     | `yarn dev` (background) + `yarn test:e2e` against the 11 specs from v2.7 Phase 67                                                            | manual       |

### Sampling Rate
- **Per task commit:** `yarn workspace @openvaa/frontend lint:check 2>&1 | grep "<rule-being-fixed>" | wc -l` should drop monotonically toward 0.
- **Per plan completion:** `yarn workspace @openvaa/frontend lint:check; echo $?` should reflect the cumulative drop. If exit code 0, the plan's rule-cluster is cleared.
- **Per wave merge:** `yarn workspace @openvaa/frontend lint:check && yarn workspace @openvaa/frontend check && yarn test:unit` — all green.
- **Phase gate (`/gsd-verify-work`):** full suite green + Playwright E2E parity baseline (manual run, deferred per ROADMAP convention).

### Coverage Bookkeeping (per §9 ask)

Each plan's PLAN.md contains an `## Error List` section with the exact file:line entries from §Cluster Analysis. After plan completion, the executor's STATE/COMPLETION report includes a per-file:line checkmark verifying the entry was resolved. The verifier's final sweep runs `lint:check` once and confirms 0 errors — any error remaining triggers a per-line audit against the plan's Error List to identify the gap.

**Schema:** `## Error List` table in each plan, columns: `File | Line:Col | Rule | Status | Resolved By (commit SHA)`. Mark `Status: pending → fixed → verified`.

### Wave 0 Gaps

- [ ] No new test files needed — existing infra covers all 95 errors via static / unit / svelte-check / E2E.
- [ ] No framework install needed — lint, svelte-check, vitest, playwright all present.
- [ ] No new fixtures needed — the existing `createMockSupabaseClient` factory in test files is the type source for Pattern 2.

*(None.)*

## Project Constraints (from CLAUDE.md)

The following directives from `CLAUDE.md` constrain the planner and executors:

- **"Use TypeScript strictly — avoid `any`, prefer explicit types"** (§Important Implementation Notes) — Phase 71 enforces this at the rule level. **Constraint applies maximally**; this is the phase's central tenet.
- **"Test accessibility — app must be WCAG 2.1 AA compliant"** — type changes do not affect a11y; verify by manual smoke after route layout `data: any` → `LayoutData` changes.
- **"Localization — all user-facing strings must support multiple locales"** — type changes do not introduce new strings; constraint preserved.
- **"Matching algorithms — questions creating subdimensions need special handling"** — Phase 71 does not touch matching code.
- **Context Destructuring Rule (Svelte 5)** — typing changes must not break existing reactive patterns. **Critical:** the 5 `data: any` → `LayoutData` changes in route layouts touch a stable reference (the `data` prop is stable per-render, not a reactive accessor); destructuring is fine. The `voterContext.svelte.ts:91` T-naming change is inside a private helper `sameRefs<T>`, not exposed via the context; rename is local. The Pattern 2 test-mock helper does not flow through any context. **No reactive-pattern violation introduced.**
- **"Type generation: Run `yarn supabase:types` after schema changes"** (§Backend) — Phase 71 does not change schema; no regeneration.
- **"Always check your code against the Code review checklist"** — applies during plan execution, especially around Svelte 5 reactivity.
- **Project skill domain experts:** `database` (Supabase schema conventions, including StoredImage shape), `architect` (adapter boundary discipline). Plan tasks may invoke skill agents for the production-adapter sub-batch (1b).

## Sources

### Primary (HIGH confidence)

- `[VERIFIED: yarn workspace @openvaa/frontend lint:check]` — full 95-error inventory captured at HEAD `feat-gsd-roadmap`.
- `[VERIFIED: yarn workspace @openvaa/frontend check]` — svelte-check baseline 160 errors / 0 warnings / 35 files.
- `[VERIFIED: packages/supabase-types/src/index.ts]` — `Database`, `Tables`, `Json`, `COLUMN_MAP`, `PROPERTY_MAP` exports confirmed.
- `[VERIFIED: packages/supabase-types/src/database.ts]` — generated DB types structure confirmed.
- `[VERIFIED: apps/frontend/src/lib/api/adapters/supabase/utils/mapRow.ts]` — boundary mapper present, T-naming violation identified.
- `[VERIFIED: apps/frontend/src/lib/api/adapters/supabase/dataProvider/supabaseDataProvider.ts]` — production-code anys at lines 101-103, 154, 187, 210, 320, 351-352, 447-448, 478, 486, 527 confirmed.
- `[VERIFIED: apps/frontend/src/lib/api/adapters/supabase/dataProvider/supabaseDataProvider.test.ts]` — 38 anys + mock factory pattern confirmed.
- `[VERIFIED: apps/frontend/src/lib/api/adapters/supabase/dataWriter/supabaseDataWriter.ts]` — 3 anys at 205, 220, 349 confirmed.
- `[VERIFIED: apps/frontend/src/routes/(voters)/(located)/+layout.svelte:31]`, `[VERIFIED: routes/(voters)/nominations/+layout.svelte:21]`, `[VERIFIED: routes/admin/(protected)/+layout.svelte:17]` and 2 admin-area sibling files — all 5 `data: any` props confirmed.
- `[VERIFIED: packages/shared-config/eslint.config.mjs]` — rule definitions including `^T[A-Z]` regex and `func-style: declaration` confirmed.
- `[VERIFIED: .planning/REQUIREMENTS.md]` — TYPING-01 wording.
- `[VERIFIED: .planning/milestones/v2.7-phases/68-dev-tooling-trio/68-02-DEFERRED.md]` — original deferral source confirmed.
- `[VERIFIED: .planning/phases/71-frontend-strict-typing-cleanup/71-CONTEXT.md]` — locked decisions D-01..D-05.

### Secondary (MEDIUM confidence)

- `[CITED: SvelteKit docs — Type generation for routes via ./$types]` — `LayoutData` / `PageData` / `RequestHandler` are auto-generated; the project's own `app.d.ts` already imports `Database`. Pattern is standard.
- `[CITED: TypeScript ESLint — consistent-type-imports rule]` — auto-fix supports inline-import lift; edge cases require manual.

### Tertiary (LOW confidence — none required)

*(None — all critical claims are VERIFIED against project source or live tool output.)*

## Metadata

**Confidence breakdown:**
- Per-rule error inventory: **HIGH** — live `lint:check` output captured and parsed.
- Standard-stack types: **HIGH** — every type referenced is verified in the project's `node_modules` / workspace.
- Architecture / adapter boundary: **HIGH** — `mapRow.ts` + `Database` import path confirmed across 6 files via `git grep`.
- Naming-convention cluster classification: **HIGH** — every one of the 13 sites read and classified per D-02's (a)/(b)/(c) bucket.
- Func-style cleanly-convertible vs. type-binding: **HIGH** — every one of the 11 sites read.
- Cross-plan file conflict audit: **HIGH** — full file → cluster mapping verified.
- Risks & mitigations: **MEDIUM** — Risk #4 (Json | null vs StoredImage cast structural compat) is the only item that warrants spot-test verification at executor-time.

**Research date:** 2026-05-09
**Valid until:** 30 days (stable monorepo; risk: a new commit on `feat-gsd-roadmap` mutating the affected files invalidates per-line numbers — re-run `lint:check` if planning is delayed past mid-June 2026).
