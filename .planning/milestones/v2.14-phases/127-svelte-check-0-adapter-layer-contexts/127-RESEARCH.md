# Phase 127: svelte-check → 0 — Adapter Layer & Contexts - Research

**Researched:** 2026-07-16
**Domain:** TypeScript type-hygiene refactor (SvelteKit frontend adapter/context layer) — behavior-neutral, zero external dependencies
**Confidence:** HIGH (all findings verified by direct codebase inspection)

## Summary

This phase clears exactly 22 svelte-check errors (baseline 46 → 24) across 5 non-test files by (a) deleting a dead `Promise<UniversalDataWriter>` abstraction (D-01, TYPE-06, 18 errors) and (b) making `JobMessage` `Json`-assignable plus two mechanical writer fixes (D-02 + discretion, TYPE-05, 4 errors). There is **no runtime behavior change** — the data writer is already a synchronous instance; the types merely lie about it. The full E2E suite is the behavior-neutrality safety net (D-06).

The decisions are locked; research focused on the HOW and the risks. The single most important finding: **the D-01 blast radius includes one test file that MUST be fixed in-phase** — `candidateUserDataState.svelte.test.ts` passes `Promise.resolve(fake.writer)` into the factory whose param type changes to synchronous. Leaving it unfixed produces 2 new type errors (blocking the 46→24 target) and a runtime failure (unit suite red). The other two context test files are insulated (mocked seams / untyped `vi.mock` factories) and need no change. Separately, `prepareDataWriter` **must remain `async`** because 11 call sites consume it via `.then()`/`await` — only its *parameter* type changes, not its return type.

**Primary recommendation:** Change `prepareDataWriter`'s param from `Promise<UniversalDataWriter>` → `UniversalDataWriter` (keep it `async`, drop the internal `await`), rename the misleading `dataWriterPromise` bindings in the 4 core consumers, fix `candidateUserDataState.svelte.test.ts` as in-phase fallout, flip `interface JobMessage` → type alias, drop the redundant `['Row']` index, and cast `processedAnswers` to `Json` at the RPC boundary with a documented reason. Verify per-file (5 files at 0) + total 46→24 + green unit + one full E2E run.

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions
- **D-01 — Drop the dead Promise plumbing (root-cause fix, TYPE-06).** Change `prepareDataWriter` to accept the synchronous `UniversalDataWriter` (keep guard duties: browser-only check, null/adapter-support check, `init({ fetch })`). Rename the misleading `dataWriterPromise` bindings to `dataWriter` at the context call sites (`authContext`, `adminContext`, `candidateContext`), and follow through `candidateUserDataState.svelte.ts`'s `#dataWriterPromise` field + factory params (~5 files). Do NOT re-wrap the export in `Promise.resolve` and do NOT merely widen to a union — the honest shape is synchronous. Type/naming truth-telling only.
- **D-02 — Convert `interface JobMessage` → type alias** in `jobStore.type.ts` (structurally identical; type aliases get implicit index signatures → `Json`-assignable, fixing both `admin_jobs` insert sites at source, zero runtime change, no casts). If other interfaces in the same file feed the same Json columns (via `input`/`output`) and surface follow-on errors, apply the same interface→type treatment in-phase (fallout rule).
- **D-03 — Keep 127 mechanical; RPC nullability audit NOT folded.** The audit todo stays in backlog. Do not let writer-side fixes silently "solve" nullability by trusting generated non-null Returns columns — preserve existing null-guards.
- **D-04 — Test files are Phase 128.** All adapter-dir `.test.ts` errors (`supabaseDataProvider.test.ts` 10, `supabaseDataWriter.test.ts` 4, `supabaseAdminWriter.test.ts` 1) remain TYPE-08 scope. Phase 127 target: exactly 22 errors cleared, 46 → 24, the 5 non-test target files at 0.
- **D-06 — Carry forward the workstream full gate.** Success = build + unit tests + svelte-check showing all 22 targeted errors gone with **no net-new (46 → 24 exact)**, verified per-file (writer 0, adminWriter 0, adminContext 0, candidateContext 0, authContext 0) + **one full E2E suite run** as the behavior-neutrality trust signal (cardinal rule). E2E prereqs: fresh dev server on :5173 (no Playwright webServer) + clean DB (`yarn db:reset`); watch for the storage/imgproxy 502-wedge (remedy: `supabase stop && supabase start`, re-verify via fast probe). Capture before/after counts in evidence.

### Claude's Discretion
- **Writer error ① (242:77):** drop the redundant `['Row']` index (`Tables<'nominations'>` is already the Row type) — mechanical.
- **Writer error ② (319:7):** how to type `processedAnswers` to satisfy the `upsert_answers` `Json` param — prefer typing the accumulator over casting; a documented cast is acceptable only if `LocalizedAnswers` genuinely can't be expressed as `Json` without runtime change.
- Commit granularity — prefer atomic per-cluster commits (Promise-plumbing / JobMessage / writer residuals) for clean bisects.
- Whether `prepareDataWriter` keeps its name or gets renamed (e.g. `initDataWriter`) — don't churn beyond the ~5 touched files.
- Exact handling if dropping the Promise type surfaces follow-on errors in importing files — fix in-phase if caused by this change (fallout rule), defer if pre-existing Phase-128 errors.

### Deferred Ideas (OUT OF SCOPE)
- **RPC RETURNS-TABLE nullability audit** (`2026-07-16-rpc-returns-table-nullability-audit.md`) — deliberately not folded (D-03); its null-guard warning still binds this phase.
- All adapter-dir `.test.ts` errors → Phase 128 / TYPE-08 (D-04).
- Long-tail singles (candidate routes, `viewTransition.ts`, `EntityInfo.svelte`, `FeedbackPopup.svelte`, `Term.svelte` warning) → Phase 128 / TYPE-07/09.
- Gate flip → Phase 132.
</user_constraints>

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|------------------|
| TYPE-05 | `supabaseDataWriter.ts` (3 errors: 242:77, 319:7, 415:62) + `supabaseAdminWriter.ts` (1: 49:62) typecheck clean | § "TYPE-05 — Writer/AdminWriter Fixes" — ① drop `['Row']`; ② documented `Json` cast at `p_answers`; ③+④ `JobMessage` type-alias (D-02) clears both `admin_jobs` inserts. Verified `input`/`output`/`metadata` (Serializable) are ALREADY Json-assignable → no follow-on. |
| TYPE-06 | `adminContext.svelte.ts` (8) + `candidateContext.svelte.ts` (6) + `authContext.svelte.ts` (4) resolved | § "TYPE-06 — The Promise-Plumbing Seam" — one root cause; change `prepareDataWriter` param type (keep `async`), rename 4 core consumers' bindings, fix 1 test file as in-phase fallout. |
</phase_requirements>

## Project Constraints (from CLAUDE.md)

- **E2E cardinal rule:** Failing OR did-not-run E2E is a CARDINAL FAILURE — no task completes while any E2E fails. Prefer running the whole suite (`yarn test:e2e`) as the trusted signal. No "known-flaky" exemptions.
- **Context Destructuring Rule (Svelte 5):** the data writer is NOT a reactive accessor — it's a plain field/import, safe to rename/pass. (Verified: `#dataWriterPromise` is a plain private field, not `$state`.) This rule does not constrain the D-01 rename but the planner must not accidentally destructure any reactive context accessor while touching these files.
- **Use TypeScript strictly — avoid `any`, prefer explicit types.** The `processedAnswers` fix should prefer a narrow `as Json` boundary cast over `as any`.
- **Localization / accessibility / matching invariants** — untouched by this phase (type-only).
- **Code review checklist** (`.agents/code-review-checklist.md`) — mandatory per CLAUDE.md.
- **Svelte warning-accepted / `// reason:` idiom** — use for the one documented cast if taken.

## Architectural Responsibility Map

| Capability | Primary Tier | Secondary Tier | Rationale |
|------------|-------------|----------------|-----------|
| DataWriter instantiation & init | API/Backend adapter (`$lib/api/adapters/supabase/dataWriter`) | — | Single sync Supabase adapter owns the writer; `new SupabaseDataWriter()` is the source of truth. |
| Browser/SSR guard + `init({ fetch })` | Frontend Server ↔ Client boundary (`prepareDataWriter`) | — | Guard belongs at the context→adapter seam; throws outside browser by design. Unchanged. |
| Context method wrappers (auth/admin/candidate) | Frontend Client (Svelte 5 context classes) | API adapter (delegate) | Contexts forward to the writer; they own naming/typing of the seam, not the writer itself. |
| Job-result persistence typing (`JobMessage` → `admin_jobs.messages`) | Server (`$lib/server/admin/jobs`) → DB (`admin_jobs`) | API writer | `JobMessage` is a server-side job-store type crossing into both adapter writers via `AdminJobRecord.messages`. |
| Answer upsert payload typing (`processedAnswers` → `upsert_answers` RPC) | API adapter | DB (jsonb column) | Writer builds a jsonb-safe map (Files pre-replaced with `{ path }`); the RPC boundary is where `Json` is asserted. |

## Standard Stack

No new libraries. This phase is internal type-hygiene using the existing toolchain.

### Core (existing, unchanged)
| Tool | Version source | Purpose |
|------|----------------|---------|
| `svelte-check` | `yarn check` in `apps/frontend` | Before/after error measurement (baseline `46 ERRORS 1 WARNINGS`). |
| `vitest` | monorepo `yarn test:unit` | Unit suite (context test files live here). |
| `@playwright/test` | `yarn test:e2e` | Full E2E behavior-neutrality gate. |
| `@openvaa/supabase-types` (`packages/supabase-types/src/database.ts`) | regenerated at Phase 126 — current, do NOT regen | Source of `Json`, `Tables<>`, RPC `Args`, `admin_jobs` `Insert`. |

**Version verification:** N/A — no packages installed or changed this phase.

## Package Legitimacy Audit

**Not applicable.** This phase installs no external packages. No `npm install` / `yarn add` occurs. All changes are edits to existing TypeScript source. `[VERIFIED: codebase grep — zero new dependencies]`

## TYPE-06 — The Promise-Plumbing Seam (D-01)

### Root cause (one seam, verified)
`apps/frontend/src/lib/api/dataWriter.ts` re-exports `export const dataWriter = new SupabaseDataWriter()` — a **synchronous instance** (`apps/frontend/src/lib/api/adapters/supabase/dataWriter/index.ts:3`). `SupabaseDataWriter extends supabaseAdapterMixin(UniversalDataWriter)`, so it IS a `UniversalDataWriter`. But `prepareDataWriter(dataWriterPromise: Promise<UniversalDataWriter>)` demands a `Promise`. Passing the sync instance → 18 type errors across the 3 contexts. Runtime already works (`await` on a non-promise is a no-op). `[VERIFIED: read prepareDataWriter.ts + index.ts + dataWriter.ts]`

### Recommended fix shape (minimal churn — keep `async`)
```ts
// prepareDataWriter.ts — change PARAM type only; KEEP async (return stays Promise<UniversalDataWriter>)
export async function prepareDataWriter(dataWriter: UniversalDataWriter): Promise<UniversalDataWriter> {
  if (!browser) throw new Error('DataWriter methods in contexts can only be called in a browser environment');
  if (!dataWriter)
    throw new Error(`Failed to initialize DataWriter. Perhaps the adapter (${staticSettings.dataAdapter.type}) does not support dataWriter?`);
  dataWriter.init({ fetch });
  return dataWriter;
}
```
**Why keep `async`:** 11 call sites consume the result via `.then((dw) => …)` (e.g. `candidateContext.svelte.ts:419,423`; all 8 `adminContext` sites) or `await` (authContext, candidateUserDataState). If `prepareDataWriter` returned a bare `UniversalDataWriter`, every `.then()` site breaks (`.then` on a non-thenable) — that would balloon the diff. Keeping it `async` means **zero call-site logic changes** — only the local-alias rename. The name `prepareDataWriter` remains accurate (it prepares/inits the writer); renaming to `initDataWriter` is optional and NOT recommended (adds churn to 4 import lines for no correctness gain). `[VERIFIED: read all call sites]`

### Files that MUST change (the ~5 core, D-01)
| File | Change |
|------|--------|
| `contexts/utils/prepareDataWriter.ts` | Param `Promise<UniversalDataWriter>` → `UniversalDataWriter`; drop the `const dataWriter = await dataWriterPromise` line (use param directly). Update the JSDoc ("promised import" → sync instance). |
| `contexts/auth/authContext.svelte.ts` | Import alias `dataWriter as dataWriterPromise` → `dataWriter` (line 4); update the 4 `prepareDataWriter(dataWriterPromise)` refs (81, 88, 93, 100) → `prepareDataWriter(dataWriter)`; fix the stale comment (line 40). |
| `contexts/admin/adminContext.svelte.ts` | Import alias (line 3) → `dataWriter`; update 8 refs (162–204). |
| `contexts/candidate/candidateContext.svelte.ts` | Import alias (line 7) → `dataWriter`; update the factory arg (127) + 5 wrapper refs (419, 423, 431, 460, 487). |
| `contexts/candidate/candidateUserDataState.svelte.ts` | `#dataWriterPromise: Promise<UniversalDataWriter>` → `#dataWriter: UniversalDataWriter` (line 40); constructor param + destructure (86–97); factory param + JSDoc + `new` call (305–317); the 2 `prepareDataWriter(this.#dataWriterPromise)` calls (234, 260). |

### In-phase test fallout (CRITICAL — verified by reading all 3 test files)
| Test file | Status after D-01 | Action |
|-----------|-------------------|--------|
| `contexts/candidate/candidateUserDataState.svelte.test.ts` (line 104–108) | **BREAKS** — `setup()` calls the factory with `dataWriterPromise: Promise.resolve(fake.writer)`. After D-01 the param is `dataWriter: UniversalDataWriter` → **2 new type errors** (unknown property `dataWriterPromise` + `Promise<…>` not assignable) AND runtime failure (`prepareDataWriter` calls `.init` on a Promise). This file is CLEAN today (not in the 46). **MUST fix in-phase** (D-01 fallout rule): change to `dataWriter: fake.writer`. Without this, the 46→24 target is unreachable and the unit suite goes red. |
| `contexts/candidate/candidateContext.svelte.test.ts` (line 95–99) | **INSULATED** — mocks `./candidateUserDataState.svelte` (factory stubbed to `() => ({ current: undefined })`) AND `vi.mock('$lib/api/dataWriter', () => ({ dataWriter: Promise.resolve({}) }))`. `vi.mock` factory returns are NOT type-checked against the module → no svelte-check error. The mocked `dataWriter` value is never consumed by a real `prepareDataWriter` call in this test (it exercises `questionBlocks`/RUNES-05). No break. OPTIONAL cosmetic honesty: change to `dataWriter: {}`. **Verify it stays at 0 post-change.** |
| `contexts/auth/authContext.svelte.test.ts` (line 37–40) | **INSULATED** — mocks BOTH `$lib/api/dataWriter` (`dataWriter: writer`) and `../utils/prepareDataWriter` (`prepareDataWriter: vi.fn(async () => writer)`). The real signature change is invisible; `vi.mock` factories untyped → no error. No break. |

### Files intentionally NOT changed (out of D-01 scope — verified)
Eight other modules import `dataWriter as dataWriterPromise` from `$lib/api/dataWriter` and directly `await` it — they do NOT route through `prepareDataWriter` and are **already type-clean** (`await` on a sync instance is a type no-op). Do NOT rename their aliases (D-01: "don't churn beyond the ~5 touched files"). They contribute 0 errors before and after:
`lib/auth/getUserData.ts:26`, `lib/server/admin/features/condenseArguments.ts:47`, `lib/server/admin/features/generateQuestionInfo.ts:58`, `routes/candidate/(protected)/+layout.server.ts:26`, `routes/admin/(protected)/+layout.ts:42`, `routes/admin/(protected)/argument-condensation/+page.server.ts:30`, `routes/admin/(protected)/question-info/+page.server.ts:65`, `routes/api/auth/login/+server.ts:20`. `[VERIFIED: grep of all `$lib/api/dataWriter` importers + confirmed none error today]`

**Reactivity check (Svelte 5):** `#dataWriterPromise` is a **plain private field**, NOT `$state<…>` (verified `candidateUserDataState.svelte.ts:40`). The writer is not reactive state. Renaming it has zero reactivity implications — no `$derived`/`$effect` depends on it. `[VERIFIED: read line 38–42]`

## TYPE-05 — Writer / AdminWriter Fixes

### Error ① — `supabaseDataWriter.ts:242:77` — redundant `['Row']` (mechanical, discretion)
`(nomData ?? []).map((n: Tables<'nominations'>['Row']) => …)`. `Tables<'nominations'>` already resolves to the Row type; the `['Row']` index is the exact redundant idiom Phase 126 flagged "don't copy". **Fix:** `(n: Tables<'nominations'>) => …`. `[VERIFIED: read line 242]`

### Error ② — `supabaseDataWriter.ts:319:7` — `Record<string, unknown>` → `Json` at `p_answers`
- The RPC arg type is `upsert_answers: { Args: { p_answers: Json; p_entity_id: string; p_overwrite?: boolean }; Returns: Json }` (`database.ts:1287-1290`). `[VERIFIED: read database.ts]`
- `processedAnswers` is declared `Record<string, unknown>` (`supabaseDataWriter.ts:281`). `unknown` values are not assignable to `Json` → the error.
- **Can it be typed cleanly?** Its assigned values are `null`, `answer` (a `LocalizedAnswer`), or `{ ...answer, value: { path } }`. `LocalizedAnswer = Omit<Answer<TValue>, 'info'> & { info? }` where `value: AnswerValue` is an object type, and the *input* map may legitimately hold `value instanceof File` (the code branches on it). So `LocalizedAnswer` is **not statically `Json`-assignable** (File + arbitrary `AnswerValue` object). Typing the accumulator as `Record<string, Json>` would just push casts to the 3 assignment sites. `[VERIFIED: read localized.type.ts:74 + answer.type.ts:22 + the assignment sites 286/310/312]`
- **Recommendation (discretion):** a single documented boundary cast at the RPC arg — `p_answers: processedAnswers as Json` (or `as unknown as Json`) — mirroring the existing idiom two lines below (`return (data as unknown as LocalizedAnswers) ?? {}`, line 323). It is runtime-neutral: `processedAnswers` is built to be jsonb-safe (Files already replaced with `{ path }`). Add a `// reason:` comment: *"processedAnswers is jsonb-safe at runtime (Files replaced with { path }); LocalizedAnswer.value's static AnswerValue/File union can't be expressed as Json without a runtime transform."* This honors D-03 (no silent nullability trust — the cast is answer payload, not a Returns column).

### Errors ③ + ④ — `JobMessage[]` → `Json` at both `admin_jobs` inserts (D-02)
- Error sites: `supabaseDataWriter.ts:415:62` and `supabaseAdminWriter.ts:49:62`. Both insert `messages: data.messages ?? null` where `data.messages: Array<JobMessage> | undefined` (`AdminJobRecord.messages`, `dataWriter.type.ts:326`) into `admin_jobs.messages: Json | null` (`database.ts:80`). `[VERIFIED]`
- **Root cause:** `interface JobMessage` (`jobStore.type.ts:35`) — interfaces get NO implicit index signature (they can be augmented by declaration merging), so they are NOT assignable to `Json`'s `{ [key: string]: Json | undefined }` member. `[VERIFIED: TS structural rule]`
- **D-02 fix works:** `type JobMessage = { type: 'info'|'warning'|'error'; message: string; timestamp: string }`. Type aliases get an implicit index signature → each field (`'info'|'warning'|'error'` ⊆ string ✓, `string` ✓, `string` ✓) is `Json`-compatible → `JobMessage[]` → `Json[]` → `Json`. Zero runtime change. `[VERIFIED]`
- **Declaration-merging safety (verified):** `JobMessage` is declared exactly ONCE (`jobStore.type.ts:35`). No `interface JobMessage` is reopened anywhere. Consumers use it purely as a value type: `jobStore.ts` (`addJobMessage`, `getAllMessagesFromJob → Array<JobMessage>`), `WarningMessages.type.ts`, `InfoMessages.type.ts`, `AdminJobRecord.messages`. The interface→type flip is transparent to all. `[VERIFIED: grep JobMessage across apps/frontend/src]`
- **No follow-on error on the same insert (verified):** the sibling columns `input`/`output`/`metadata` are `Serializable` (`AdminJobRecord`, `dataWriter.type.ts:324-327`). `Serializable = string | number | boolean | null | Array<Serializable> | { [key: string]: Serializable }` (`packages/core/src/serializable/serializable.type.ts:4`) is **already structurally assignable to `Json`** — that's why those columns don't error today. So once `messages` (the only incompatible property) is fixed, both entire `.insert({...})` objects typecheck. D-02 is self-contained; no `input`/`output` interface conversion is needed. `[VERIFIED: read Serializable + admin_jobs Insert 70-86]`
- **`project_id` decoy:** the `'project_id' does not exist` text in both error messages is overload-2 (array-form) noise — `admin_jobs.project_id: string` exists in `Row`/`Insert`/`Update` (`database.ts:66/83/100`) and in schema. Do NOT touch `project_id`. `[VERIFIED: read database.ts admin_jobs]`

## Architecture Patterns

### Data flow through the touched seam (unchanged behavior)
```
$lib/api/dataWriter (sync `new SupabaseDataWriter()`)
        │  imported as `dataWriter` (was aliased `dataWriterPromise`)
        ▼
context class field/wrapper  ──►  prepareDataWriter(dataWriter)   [async: browser-guard + null-guard + init({fetch})]
        │                                     │ returns Promise<UniversalDataWriter>
        │  (candidateContext also passes      ▼
        │   the writer into the factory)   .then(dw => dw.method(...)) / await
        ▼
candidateUserDataState(#dataWriter)  ──►  prepareDataWriter(this.#dataWriter)  ──►  dw.updateAnswers / dw.getCandidateUserData
```
The arrows and stages are identical before/after — only the **static types and local names** change. The `.then()`/`await` consumption pattern is preserved by keeping `prepareDataWriter` async.

### Pattern: interface → type alias for `Json`-column assignability
**What:** Object types written to Supabase `Json` columns must be **type aliases**, never interfaces. **When:** any type flowing into a `Json`/`jsonb` column. **Why:** only type aliases receive TS's implicit index signature. This is a reusable rule for the rest of the workstream.

### Anti-Patterns to Avoid
- **Re-wrapping the export in `Promise.resolve`** to satisfy the old signature — reintroduces the dead abstraction (D-01 forbids).
- **Making `prepareDataWriter` fully synchronous** (dropping `async`) — breaks 11 `.then()`/`await` call sites and balloons the diff. Keep it `async`.
- **Renaming the 8 non-`prepareDataWriter` importers** — out of scope, adds churn (D-01).
- **`as any` for `processedAnswers`** — use a narrow `as Json`/`as unknown as Json` with a `// reason:` comment.
- **Regenerating `database.ts`** — current & trusted (Phase 126); no schema change this phase.
- **"Solving" nullability by trusting non-null generated Returns columns** — D-03 forbids; keep existing null-guards.

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Row type from a table | `Tables<'x'>['Row']` | `Tables<'x'>` | Already resolves to Row; the index is redundant (error ①). |
| `Json`-compatibility for an object type | manual index-signature interface / cast per field | type alias (implicit index signature) | D-02 — one flip fixes both insert sites, no casts. |
| Async writer plumbing | `Promise.resolve(writer)` wrappers, union widening | accept the sync instance directly | The adapter switch is gone; the writer is synchronous. |

**Key insight:** every error in this phase is a type *telling the truth the code already lives by* — the writer is sync, `JobMessage` is a plain record, `processedAnswers` is jsonb-safe. No new abstractions; delete/simplify.

## Common Pitfalls

### Pitfall 1: Forgetting the test-file fallout → can't hit 46→24
**What goes wrong:** D-01 changes `candidateUserDataState`'s factory param; `candidateUserDataState.svelte.test.ts:106` still passes `Promise.resolve(fake.writer)` → 2 new type errors + runtime failure.
**How to avoid:** update the test to `dataWriter: fake.writer` in the same commit as the source change. **Warning sign:** svelte-check total lands at 26 (not 24), or `yarn test:unit` fails in `candidateUserDataState.save()`.

### Pitfall 2: Breaking `.then()` sites by over-simplifying `prepareDataWriter`
**What goes wrong:** making `prepareDataWriter` return a bare `UniversalDataWriter` breaks `adminContext`/`candidateContext` `.then()` chains.
**How to avoid:** keep the function `async`; change only the parameter type. **Warning sign:** new "Property 'then' does not exist" errors in admin/candidate contexts.

### Pitfall 3: Assuming the `project_id` error text is real
**What goes wrong:** chasing the `'project_id' does not exist` decoy and editing schema/types.
**How to avoid:** the real failure is `JobMessage` index-signature; `project_id` exists. Fix `JobMessage` and re-run — both errors clear.

### Pitfall 4: E2E environment wedge masking behavior-neutrality
**What goes wrong:** storage/imgproxy 502-wedge makes the full E2E run fail spuriously → false "behavior changed" signal, or a "did-not-run" cascade counted as pass.
**How to avoid:** fresh dev server on :5173 (no Playwright webServer — a stale server steals the port) + `yarn db:reset` before the gate; on 502s run `supabase stop && supabase start` and re-verify via a fast probe (see `126-05-SUMMARY.md`). Treat "did not run" as failure.

## Code Examples

### JobMessage flip (D-02)
```ts
// jobStore.type.ts — BEFORE
export interface JobMessage { type: 'info' | 'warning' | 'error'; message: string; timestamp: string; }
// AFTER (structurally identical; now Json-assignable)
export type JobMessage = { type: 'info' | 'warning' | 'error'; message: string; timestamp: string; };
```

### Documented Json cast at the RPC boundary (error ②)
```ts
const { data, error } = await this.supabase.rpc('upsert_answers', {
  p_entity_id: id,
  // reason: processedAnswers is jsonb-safe at runtime (File values already replaced with { path });
  // LocalizedAnswer.value's static AnswerValue/File union can't be expressed as Json without a runtime transform.
  p_answers: processedAnswers as Json,
  p_overwrite: overwrite
});
```

## Runtime State Inventory

> This is a type/naming refactor (rename of local bindings + a private field). No stored data, service config, OS state, secrets, or build artifacts embed the renamed identifiers.

| Category | Items Found | Action Required |
|----------|-------------|------------------|
| Stored data | None — the rename touches TS local/private names only; no DB keys, collection names, or IDs reference `dataWriterPromise`/`JobMessage` as string data. | None |
| Live service config | None — no external service config references these identifiers. | None |
| OS-registered state | None. | None |
| Secrets/env vars | None. | None |
| Build artifacts | None that persist — `packages/supabase-types/src/database.ts` is consumed, not regenerated; no compiled artifact carries the old field name. | None (no reinstall) |

## Validation Architecture

### Test Framework
| Property | Value |
|----------|-------|
| Framework | `vitest` (unit) + `@playwright/test` (E2E) |
| Config file | `apps/frontend/vitest.config.*` (unit); Playwright config in `apps/frontend` |
| Quick run command | `cd apps/frontend && yarn check` (svelte-check, the primary phase signal) |
| Full suite command | `yarn test:unit` then `yarn test:e2e` |

### Phase Requirements → Test Map
| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|-------------|
| TYPE-05 | writer + adminWriter typecheck clean | typecheck | `cd apps/frontend && yarn check 2>&1 \| grep -E 'supabaseDataWriter\.ts\|supabaseAdminWriter\.ts'` → 0 lines | ✅ (svelte-check) |
| TYPE-06 | 3 contexts typecheck clean | typecheck | `cd apps/frontend && yarn check 2>&1 \| grep -E 'adminContext\|candidateContext\|authContext'` → 0 (excluding `.test.ts`) | ✅ |
| TYPE-06 fallout | candidate user-data store unit tests stay green | unit | `cd apps/frontend && yarn test:unit --run candidateUserDataState` | ✅ (`candidateUserDataState.svelte.test.ts`, 6 tests) |
| TYPE-05/06 | no behavior change | e2e | `yarn test:e2e` (full suite) | ✅ (last green 125/0/0 at Phase 126 close) |

### Sampling Rate
- **Per task commit:** `cd apps/frontend && yarn check` — confirm the touched cluster dropped to 0 and total is monotonically decreasing (never > 46).
- **Per cluster (Promise-plumbing / JobMessage / writer residuals):** `yarn test:unit --run` on the affected files.
- **Phase gate (D-06):** `yarn build` + full `yarn test:unit` + `yarn check` showing **exactly 24 errors / 1 warning** with all 5 target files at 0 + one full `yarn test:e2e` green (fresh :5173 dev server + `yarn db:reset` first).

### Per-file verification recipe
```bash
cd apps/frontend && yarn check 2>&1 | tee /tmp/check-127-after.txt
grep -c "ERROR" /tmp/check-127-after.txt                     # expect total 24
grep -E "adminContext\.svelte\.ts|candidateContext\.svelte\.ts|authContext\.svelte\.ts|supabaseDataWriter\.ts|supabaseAdminWriter\.ts" /tmp/check-127-after.txt | grep -v "\.test\.ts"   # expect 0 lines
grep "candidateUserDataState.svelte.test.ts" /tmp/check-127-after.txt   # expect 0 lines (fallout fixed)
```

### Wave 0 Gaps
- None — svelte-check + the existing `candidateUserDataState.svelte.test.ts` (6 tests) + the E2E suite fully cover this phase. No new test files needed. The only test *edit* is the D-01 fallout fix in `candidateUserDataState.svelte.test.ts`.

## Environment Availability

> Existing toolchain only; no new external dependencies.

| Dependency | Required By | Available | Version | Fallback |
|------------|------------|-----------|---------|----------|
| Node + Yarn 4 workspaces | build/typecheck/test | ✓ (repo standard) | per `.nvmrc`/`package.json` | — |
| Local Supabase (`supabase start`) | E2E gate | ✓ (dev standard; `-gsd` repo runs E2E clean per memory `project_gsd_repo_e2e_runs_clean`) | CLI | — |
| Playwright browsers | E2E gate | ✓ (installed prior) | — | `yarn playwright install` if missing |

**Missing dependencies with no fallback:** none.
**Missing dependencies with fallback:** Playwright browsers (reinstall if absent).

## Security Domain

> `security_enforcement` absent in config → treated as enabled. This phase is a **behavior-neutral type/naming refactor** — it adds no new input surface, no new data path, no auth/crypto/validation change.

| ASVS Category | Applies | Standard Control |
|---------------|---------|-----------------|
| V5 Input Validation | no (unchanged) | The `upsert_answers` payload validation happens server-side in the RPC (`validate_answer_value`); the `as Json` cast is a compile-time assertion on an already-jsonb-safe map, not a validation bypass. |
| V6 Cryptography | no | Not touched. |
| V4 Access Control | no | `admin_jobs` RLS (`project_id`) unchanged; `project_id` still resolved from `elections` at runtime. |

**Threat note:** the documented `processedAnswers as Json` cast must NOT be used to skip the existing runtime File-processing branch — the cast is downstream of it. Reviewer should confirm the File-replacement loop remains intact.

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| Adapter-switch dynamic import → `Promise<UniversalDataWriter>` | Single sync Supabase adapter (`new SupabaseDataWriter()`) | Adapter switch removed (pre-127; CLAUDE.md "Supabase is the only production adapter") | The `Promise<>` plumbing is dead; D-01 removes the type-level residue. |
| `interface` for Json-column payloads | `type` alias (implicit index signature) | This phase (D-02) establishes the rule | Reusable across the workstream for jsonb columns. |

**Deprecated/outdated:** the `dataWriterPromise` naming convention — misleading since the writer became synchronous; D-01 corrects it in the 4 core consumers only.

## Assumptions Log

| # | Claim | Section | Risk if Wrong |
|---|-------|---------|---------------|
| A1 | Baseline is 46 errors / 1 warning (not re-run this session; trusted from CONTEXT's 2026-07-16 fresh run). | Summary | Low — CONTEXT verified it hours earlier; the plan re-measures before/after regardless. If drifted, the 46→24 arithmetic shifts but the per-file target (5 files → 0) is absolute. |
| A2 | `vi.mock` factory returns are not type-checked by svelte-check in this repo (so `candidateContext`/`authContext` test mocks won't error). | TYPE-06 test fallout | Low — inferred from these `.test.ts` files being absent from the current 46 despite mismatched mock shapes. Verified indirectly; the plan's per-file check catches any surprise. |

*All other claims are `[VERIFIED]` by direct file reads this session.*

## Open Questions

1. **`processedAnswers` cast vs. typed accumulator** — Claude's discretion (error ②).
   - What we know: `LocalizedAnswer.value` (`AnswerValue` object + File in input) is not statically `Json`; the runtime map is jsonb-safe.
   - What's unclear: whether a reviewer prefers the single boundary cast or a `Record<string, Json>` accumulator with 3 assignment casts.
   - Recommendation: single documented `as Json` boundary cast (fewer casts, matches line 323's existing idiom).

2. **`candidateContext.svelte.test.ts` mock honesty** — optional cosmetic (`Promise.resolve({})` → `{}`).
   - Recommendation: change it for honesty since the file is already open, but it is not required for the gate.

## Sources

### Primary (HIGH confidence — direct codebase inspection, 2026-07-16)
- `apps/frontend/src/lib/contexts/utils/prepareDataWriter.ts`, `api/dataWriter.ts`, `api/adapters/supabase/dataWriter/index.ts` — the seam.
- `contexts/auth/authContext.svelte.ts`, `admin/adminContext.svelte.ts`, `candidate/candidateContext.svelte.ts`, `candidate/candidateUserDataState.svelte.ts` — consumers.
- The 3 context `.test.ts` files — fallout analysis.
- `api/adapters/supabase/dataWriter/supabaseDataWriter.ts` (242/281/319/415), `adminWriter/supabaseAdminWriter.ts` (49) — writer errors.
- `server/admin/jobs/jobStore.type.ts`, `api/base/dataWriter.type.ts` (AdminJobRecord), `packages/core/src/serializable/serializable.type.ts`, `packages/supabase-types/src/database.ts` (Json, upsert_answers Args, admin_jobs Insert) — type sources.
- Grep of all `$lib/api/dataWriter` importers + all `JobMessage` consumers — blast radius.

### Secondary (MEDIUM confidence)
- `.planning/phases/127-.../127-CONTEXT.md` — locked decisions D-01..D-06, verified baseline.

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH — no new libraries; existing toolchain confirmed.
- Architecture (D-01 blast radius + test fallout): HIGH — every importer and all 3 test files read directly.
- TYPE-05 mechanics (D-02 sufficiency + `input`/`output` non-follow-on): HIGH — Serializable/Json assignability + single-declaration verified.
- Pitfalls: HIGH — derived from actual call-site patterns and CONTEXT conventions.

**Research date:** 2026-07-16
**Valid until:** stable until any of the 5 target files or `database.ts` change — re-verify baseline count if Phase 128 lands first.
