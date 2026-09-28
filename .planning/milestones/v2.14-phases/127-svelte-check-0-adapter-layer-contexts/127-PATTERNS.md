# Phase 127: svelte-check → 0 — Adapter Layer & Contexts - Pattern Map

**Mapped:** 2026-07-16
**Files analyzed:** 9 (all MODIFIED — this is a type-hygiene phase; no new files)
**Analogs found:** 9 / 9 (in-file / same-file precedent for every edit)

> **Nature of this phase:** No new files are created. Every edit is an in-place type/naming
> correction on an existing file. The "closest analog" for each modification is therefore an
> *established idiom already present in the same file or its immediate sibling* — the goal is to
> propagate a truth the runtime already lives by, not to introduce a new abstraction. Concrete
> line-anchored excerpts below.

## File Classification

| Modified File | Role | Data Flow | Closest Analog | Match Quality |
|---------------|------|-----------|----------------|---------------|
| `contexts/utils/prepareDataWriter.ts` | utility (seam) | request-response (init) | its own body (drop `await`) | in-file |
| `contexts/auth/authContext.svelte.ts` | provider (context) | request-response | `prepareDataWriter` call idiom | exact-role |
| `contexts/admin/adminContext.svelte.ts` | provider (context) | request-response | `authContext` `.then()` idiom | exact-role |
| `contexts/candidate/candidateContext.svelte.ts` | provider (context) | request-response | `adminContext` `.then()` idiom | exact-role |
| `contexts/candidate/candidateUserDataState.svelte.ts` | store (Svelte 5 state) | CRUD | its own `#dataWriterPromise` field | in-file |
| `contexts/candidate/candidateUserDataState.svelte.test.ts` | test | — | factory `setup()` call | in-file (fallout) |
| `server/admin/jobs/jobStore.type.ts` | model (type) | transform (→ Json col) | `JobStatus`/`PastJobStatus` type aliases (same file) | in-file |
| `api/adapters/supabase/dataWriter/supabaseDataWriter.ts` | service (adapter writer) | CRUD | Phase-126 `as unknown as` idiom (line 323, same file) | in-file |
| `api/adapters/supabase/adminWriter/supabaseAdminWriter.ts` | service (adapter writer) | CRUD | `supabaseDataWriter.ts` admin_jobs insert | exact (sibling) |

## Pattern Assignments

### `contexts/utils/prepareDataWriter.ts` (utility, request-response) — D-01 root cause

**Analog:** its own current body — change the *param* type only, KEEP `async` and the return type.

**Current (the seam that lies)** (lines 5-17):
```typescript
/**
 * Init and return a `DataWriter` instance from the provided promised import from `$lib/api/dataWriter`.
 */
export async function prepareDataWriter(dataWriterPromise: Promise<UniversalDataWriter>): Promise<UniversalDataWriter> {
  if (!browser) throw new Error('DataWriter methods in contexts can only be called in a browser environment');
  const dataWriter = await dataWriterPromise;
  if (!dataWriter)
    throw new Error(
      `Failed to initialize DataWriter. Perhaps the adapter (${staticSettings.dataAdapter.type}) does not support dataWriter?`
    );
  dataWriter.init({ fetch });
  return dataWriter;
}
```

**Target shape** (param `Promise<UniversalDataWriter>` → `UniversalDataWriter`; drop the `await` line; use param directly; KEEP `async` + `Promise<…>` return so all 11 `.then()`/`await` call sites are untouched; update JSDoc "promised import" → "sync instance"):
```typescript
export async function prepareDataWriter(dataWriter: UniversalDataWriter): Promise<UniversalDataWriter> {
  if (!browser) throw new Error('DataWriter methods in contexts can only be called in a browser environment');
  if (!dataWriter)
    throw new Error(
      `Failed to initialize DataWriter. Perhaps the adapter (${staticSettings.dataAdapter.type}) does not support dataWriter?`
    );
  dataWriter.init({ fetch });
  return dataWriter;
}
```

**CRITICAL — keep `async`:** the return type stays `Promise<UniversalDataWriter>`. Call sites
consume via `.then((dw) => …)` (all 8 admin sites, candidateContext 419/423) or `await`
(authContext, candidateUserDataState). Making it synchronous would break every `.then()` and
balloon the diff. Only the parameter type + local naming change.

---

### `contexts/auth/authContext.svelte.ts` (provider, request-response) — 4 errors

**Analog:** the `prepareDataWriter(...)` invocation idiom (unchanged call pattern).

**Change:** import alias `dataWriter as dataWriterPromise` (line ~4) → `dataWriter`; update the 4
refs at 81, 88, 93, 100 from `prepareDataWriter(dataWriterPromise)` → `prepareDataWriter(dataWriter)`;
fix the stale comment at line ~40. Call/logic pattern is preserved — rename only.

---

### `contexts/admin/adminContext.svelte.ts` (provider, request-response) — 8 errors

**Analog:** identical to authContext — same `prepareDataWriter(...).then(...)` idiom.

**Change:** import alias (line ~3) → `dataWriter`; update 8 refs (162–204) `dataWriterPromise` →
`dataWriter`. `.then()` chains stay intact (return type unchanged).

---

### `contexts/candidate/candidateContext.svelte.ts` (provider, request-response) — 6 errors

**Analog:** adminContext `.then()` idiom + factory hand-off.

**Change:** import alias (line ~7) → `dataWriter`; update the factory arg passed into
`candidateUserDataState({ … })` at line 127 + the 5 wrapper refs (419, 423, 431, 460, 487). The
writer is passed into the user-data-state factory — its param name changes in lockstep (below).

---

### `contexts/candidate/candidateUserDataState.svelte.ts` (store, CRUD) — clean today, moves with D-01

**Analog:** its own private field + factory param — plain (non-reactive) private field, safe to rename.

**Current field** (line 40):
```typescript
class CandidateUserDataStateImpl implements CandidateUserDataState {
  #answersLocked: () => boolean;
  #dataWriterPromise: Promise<UniversalDataWriter>;
  #locale: () => string;
```

**Change:** `#dataWriterPromise: Promise<UniversalDataWriter>` → `#dataWriter: UniversalDataWriter`
(line 40); constructor param + destructure (86–97); factory param + JSDoc + `new` call (305–317);
the 2 `prepareDataWriter(this.#dataWriterPromise)` calls (234, 260) → `prepareDataWriter(this.#dataWriter)`.

**Reactivity note (Svelte 5):** `#dataWriterPromise` is a **plain private field, NOT `$state`** —
no `$derived`/`$effect` depends on it. Renaming has zero reactivity implications. (Confirms the
CLAUDE.md Context-Destructuring rule does not apply here — the writer is not a reactive accessor.)

---

### `contexts/candidate/candidateUserDataState.svelte.test.ts` (test) — IN-PHASE FALLOUT (D-01)

**Analog:** the `setup()` factory-call — must track the factory's param-type change.

**Current** (lines 100-108) — **BREAKS after D-01** (2 new type errors + runtime `.init` on a Promise):
```typescript
function setup(userData: CandidateUserData<true>) {
  const fake = makeFakeWriter();
  let store!: CandidateUserDataState;
  cleanup = $effect.root(() => {
    store = candidateUserDataState({
      answersLocked: () => false,
      dataWriterPromise: Promise.resolve(fake.writer),
      locale: () => 'en'
    });
  });
```

**Change:** `dataWriterPromise: Promise.resolve(fake.writer)` → `dataWriter: fake.writer`. This file
is CLEAN today (not in the 46). Fixing it in the SAME commit as the source change is mandatory —
without it the 46→24 target is unreachable (lands at 26) and `yarn test:unit` goes red in `.save()`.

**Insulated test files (verify stay at 0, do NOT need changes):**
- `authContext.svelte.test.ts` — mocks both `$lib/api/dataWriter` and `../utils/prepareDataWriter` (`vi.mock` factories untyped).
- `candidateContext.svelte.test.ts` — mocks `./candidateUserDataState.svelte` + `$lib/api/dataWriter`. OPTIONAL cosmetic honesty: `Promise.resolve({})` → `{}`.

---

### `server/admin/jobs/jobStore.type.ts` (model) — D-02: interface → type alias

**Analog:** the sibling `type` aliases already in this file (`JobStatus`, `PastJobStatus`, `ActiveJobStatus` at lines 41-45) — the file already prefers type aliases for exported types.

**Current** (lines 35-39):
```typescript
export interface JobMessage {
  type: 'info' | 'warning' | 'error';
  message: string;
  timestamp: string; // ISO
}
```

**Target** (structurally identical; type aliases get an implicit index signature → `Json`-assignable):
```typescript
export type JobMessage = {
  type: 'info' | 'warning' | 'error';
  message: string;
  timestamp: string; // ISO
};
```

**Why it fixes both insert sites:** interfaces get NO implicit index signature (can be
declaration-merged) → not assignable to `Json`'s `{ [key: string]: Json | undefined }`. Type
aliases DO → `JobMessage[]` → `Json`. `JobMessage` is declared exactly once and used purely as a
value type (verified: `jobStore.ts`, `WarningMessages.type.ts`, `InfoMessages.type.ts`,
`AdminJobRecord.messages`) — the flip is transparent, zero runtime change, no casts. If sibling
interfaces feeding the same Json columns surface follow-on errors, apply the same flip in-phase
(fallout rule) — but research verified `input`/`output`/`metadata` are `Serializable` (already
Json-assignable), so no follow-on is expected.

---

### `supabaseDataWriter.ts` (service, CRUD) — 3 errors

**Error ① (242:77) — redundant `['Row']` index (mechanical).**
Current (line 242): `(nomData ?? []).map((n: Tables<'nominations'>['Row']) => ({`
Fix: `(n: Tables<'nominations'>) => ({` — `Tables<'x'>` already resolves to the Row type. This is
the exact idiom Phase 126 flagged "don't copy."

**Error ② (319:7) — `Record<string, unknown>` → `Json` at `upsert_answers` `p_answers`.**
**Analog:** the Phase-126 documented-cast idiom TWO LINES BELOW in the same function (line 323):
```typescript
if (error) throw new Error(`setAnswers: ${error.message}`);
return (data as unknown as LocalizedAnswers) ?? {};   // ← existing boundary-cast idiom to mirror
```
Current RPC call (lines 317-321):
```typescript
const { data, error } = await this.supabase.rpc('upsert_answers', {
  p_entity_id: id,
  p_answers: processedAnswers,          // ← Record<string, unknown> not assignable to Json
  p_overwrite: overwrite
});
```
Fix (single documented boundary cast — `LocalizedAnswer.value`'s `AnswerValue`/`File` union can't
be statically expressed as `Json`; the runtime map is already jsonb-safe because Files were
replaced with `{ path }` in the loop above at line 310):
```typescript
const { data, error } = await this.supabase.rpc('upsert_answers', {
  p_entity_id: id,
  // reason: processedAnswers is jsonb-safe at runtime (File values already replaced with { path });
  // LocalizedAnswer.value's static AnswerValue/File union can't be expressed as Json without a runtime transform.
  p_answers: processedAnswers as Json,
  p_overwrite: overwrite
});
```
Prefer `as Json` over `as any` (CLAUDE.md strict-TS). Do NOT skip/relocate the File-replacement
loop — the cast is downstream of it (security note in RESEARCH).

**Error ③ (415:62) — `JobMessage[]` → `Json` at `admin_jobs.insert`.** Fixed at source by D-02
(no edit needed here once `JobMessage` is a type alias). The insert (lines 415+) resolves
`project_id` from `elections` at runtime — behavior-neutral zone, do NOT touch `project_id` (the
`'project_id' does not exist` error text is overload-2 decoy noise; `project_id` exists in schema
and types).

---

### `supabaseAdminWriter.ts` (service, CRUD) — 1 error (49:62)

**Analog:** identical to `supabaseDataWriter.ts`'s `admin_jobs` insert (same shape, same fix path).

The insert at lines 49+ (`this.supabase.from('admin_jobs').insert({ ... messages: data.messages ?? null })`)
fails on the same `JobMessage[]` → `Json` incompatibility. **Fixed at source by D-02** — no edit in
this file. Same `project_id` decoy applies. Verify it drops to 0 after the `JobMessage` flip.

## Shared Patterns

### Pattern A — interface → type alias for any object written to a Supabase `Json`/`jsonb` column
**Source:** `jobStore.type.ts` D-02 (sibling aliases `JobStatus` et al. already present).
**Apply to:** any type flowing into a `Json` column. Only type aliases receive TS's implicit index
signature; interfaces do not. Reusable rule for the rest of the svelte-check workstream.

### Pattern B — documented boundary cast for jsonb-safe payloads (`// reason:` idiom)
**Source:** `supabaseDataWriter.ts:323` (`data as unknown as LocalizedAnswers`) — Phase 126 precedent.
**Apply to:** RPC/insert args where a runtime-safe value can't be statically expressed as `Json`
(error ②). Narrow `as Json` (never `as any`) + a `// reason:` comment. Last-resort only —
D-02 avoids it entirely via the type flip.

### Pattern C — `Tables<'x'>` NOT `Tables<'x'>['Row']`
**Source:** Phase 126 CONTEXT "don't copy" flag; error ① is the last surviving instance.
**Apply to:** all Supabase Row typings. `Tables<'x'>` already resolves to the Row type.

### Pattern D — keep the seam `async`, change only the param type (dead-abstraction removal)
**Source:** `prepareDataWriter.ts` D-01.
**Apply to:** the 4 core consumers — rename local `dataWriterPromise` bindings → `dataWriter`, do
NOT touch `.then()`/`await` consumption. Do NOT re-wrap in `Promise.resolve` and do NOT widen to a
union — the adapter switch is gone (CLAUDE.md: "Supabase is the only production adapter"); the
honest shape is synchronous.

### Pattern E — cluster-scoped discipline + atomic per-cluster commits
**Source:** workstream convention (Phases 123–126).
**Apply to:** commit in 3 clusters (Promise-plumbing / JobMessage / writer residuals) for clean
bisects. Do NOT fix neighboring Phase-128 errors (all `.test.ts` in the adapter dir, long-tail singles).

## No Analog Found

None. Every modification maps to an in-file or immediate-sibling precedent. This is a type-hygiene
phase with zero new abstractions — the closest-analog question resolves to "the truth the runtime
already lives by," documented per-file above.

## Files Intentionally NOT Changed (verified out of scope)

Eight `$lib/api/dataWriter` importers that `await` the sync instance directly (do NOT route through
`prepareDataWriter`, already type-clean — `await` on a sync instance is a type no-op): `lib/auth/getUserData.ts`,
`lib/server/admin/features/condenseArguments.ts`, `.../generateQuestionInfo.ts`,
`routes/candidate/(protected)/+layout.server.ts`, `routes/admin/(protected)/+layout.ts`,
`.../argument-condensation/+page.server.ts`, `.../question-info/+page.server.ts`,
`routes/api/auth/login/+server.ts`. Do NOT rename their aliases (D-01: don't churn beyond the ~5 touched files).

## Metadata

**Analog search scope:** `apps/frontend/src/lib/contexts/{utils,auth,admin,candidate}`,
`apps/frontend/src/lib/api/adapters/supabase/{dataWriter,adminWriter}`,
`apps/frontend/src/lib/server/admin/jobs`, `packages/supabase-types/src/database.ts` (Json/Tables/RPC Args — read-only).
**Files scanned:** 9 target + upstream type sources (verified via CONTEXT/RESEARCH direct reads).
**Pattern extraction date:** 2026-07-16
</content>
</invoke>
