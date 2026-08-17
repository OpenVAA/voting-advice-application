# Phase 126: svelte-check → 0 — supabaseDataProvider - Context

**Gathered:** 2026-07-16
**Status:** Ready for planning

<domain>
## Phase Boundary

Second phase of the svelte-check → 0 workstream (Phases 125–128, gate-flip in 132). `apps/frontend/src/lib/api/adapters/supabase/dataProvider/supabaseDataProvider.ts` (561 lines) is typed against the generated Supabase types, clearing **its 79 errors (TYPE-04)** with **no runtime behavior change** — the E2E suite is the behavior-neutrality safety net.

**Ground truth verified 2026-07-16** (fresh svelte-check run saved to scratchpad during discussion):

- Baseline: **133 errors / 1 warning** (post-Phase-125 count, independently re-confirmed).
- `supabaseDataProvider.ts` (non-test): **79 errors**. Expected post-phase count: **~54** (exact target pinned at plan time; no net-new).
- **78 of the 79 errors are inside `_getNominationData` (lines 258–424)**, all downstream of ONE root cause: the `get_nominations` RPC is **missing from the generated `packages/supabase-types/src/database.ts`** — the generated types are stale. The RPC exists in the DB with a full 33-column `RETURNS TABLE` covering every column the adapter reads (`apps/supabase/supabase/schema/503-entity-rpcs.sql:11`; also in migrations 00001/00002). Error mix: 38 × possibly-null/undefined (TS18047/18048), 38 × property-does-not-exist-on-Json (TS2339), 1 × RPC-name-not-assignable (TS2345 at 258:27), 1 × TS2352 cast (374:33 `entity as AnyEntityVariantData`).
- The 79th error is an independent TS2352 at 549:14 (`... as AnyQuestionVariantData`) in `_getQuestionData`.
- The five `.from()`-based read methods are already fully typed (client is `SupabaseClient<Database>`) and produce **zero** errors.

**Also in scope (folded todo):** delete the inert `declare module 'qs';` shim from `apps/frontend/src/lib/types/global.d.ts:13` (one line; Phase-125 verifier empirically proved it inert).

**Out of bounds:** `supabaseDataProvider.test.ts` errors (10 — Phase 128 / TYPE-08), `supabaseDataWriter.ts` + adapter remainder + contexts (Phase 127 / TYPE-05/06), long-tail/docs (Phase 128), gate flip (Phase 132). Cluster-scoped discipline carries forward: do not fix neighboring-phase errors, they would muddy the exact accounting.

</domain>

<decisions>
## Implementation Decisions

### RPC typing mechanism (root-cause fix)
- **D-01 — Regenerate the Supabase types.** Run `yarn db:types` to regenerate `packages/supabase-types/src/database.ts`. This is the root-cause fix: the schema already defines `get_nominations` with a complete `RETURNS TABLE`, so regeneration adds a fully typed `Returns` row array and collapses ~76 of the 79 errors at the source (TS2345 RPC-name + all TS2339/TS18047/18048 downstream). Do NOT hand-write a duplicate RPC row interface.
- **D-02 — Commit the full regen output as its own atomic commit.** The generated file is a single source of truth — no hand-trimming of the regen diff. If regeneration pulls in unrelated schema drift that introduces **net-new svelte-check errors elsewhere, fix them in-phase** (Phase 125 D-01 fallout precedent: honest clearing includes fallout). Capture before/after counts around the regen commit so drift effects are visible.
- **D-03 — Light refactor allowed in `_getNominationData`.** Beyond type annotations, small structural cleanups are permitted (extract row-mapping helpers, simplify guard flow) where the typed row makes the current shape awkward — still strictly behavior-neutral, E2E-verified. Remove null-guards/casts the typed row makes redundant.

### Residual casts & shared-helper seam
- **D-04 — Fix the two TS2352 casts properly.** `entity as AnyEntityVariantData` (374:33) and `... as AnyQuestionVariantData` (549:14): narrow to the correct variant type at the construction site (typed row → discriminated mapping) so no cast is needed. The 374 cast likely dissolves once the RPC row is typed; 549 gets the same treatment. Do not fall back to the `as unknown as X // reason:` idiom for these two.
- **D-05 — Generify `toDataObject` NOW.** Make `apps/frontend/src/lib/api/adapters/supabase/utils/toDataObject.ts` generic over the row type so typed rows flow through instead of being discarded at the `Record<string, unknown>` seam. **Constraint: backward-compatible generification** — `supabaseDataWriter.ts` and other Phase-127-scope call sites must keep compiling UNCHANGED (e.g. generic parameter defaulting to `Record<string, unknown>`). Update `toDataObject`'s own tests as needed; do not edit Phase-127 files.

### Acceptance gate & accounting
- **D-06 — Carry forward Phase 125's D-04 full gate.** Success = build + unit tests + svelte-check showing **all 79 supabaseDataProvider.ts (non-test) errors gone with no net-new (133 → ~54, exact number pinned at plan time)** + **one full E2E suite run as the behavior-neutrality trust signal** (cardinal rule — failing or did-not-run E2E blocks completion). Capture before/after counts in verification evidence. E2E prereqs per project convention: fresh dev server on :5173 + clean DB (`yarn db:reset`) before the gate.
- **D-07 — Folded qs-shim deletion verified by unchanged output.** Delete `declare module 'qs';` from `global.d.ts:13`; acceptance = svelte-check error set unchanged by that deletion (the Phase-125 verifier already proved byte-identical output).

### Claude's Discretion
- Commit granularity beyond D-02's regen-is-atomic rule — prefer per-cluster atomic commits (regen / provider typing / toDataObject generification / qs-shim) so regressions bisect cleanly (workstream convention).
- The exact generic signature for `toDataObject` (constraint shape, default parameter), as long as D-05's backward-compatibility constraint holds.
- Whether `_getNominationData` cleanups extract helpers into the file or into `utils/` — judged by what stays behavior-neutral and readable.
- How to verify the regenerated `get_nominations` Returns shape matches what the adapter reads (spot-check against 503-entity-rpcs.sql is cheap and recommended).

### Folded Todos
- **`2026-07-15-remove-inert-qs-declare-module-shim.md`** — Remove the inert `declare module 'qs';` shim from `apps/frontend/src/lib/types/global.d.ts:13`. Origin: Phase 125 verification finding; the real `@types/qs` types provably govern (byte-identical check output with/without the shim). Fits here as one-line TYPE-workstream hygiene (the todo itself targets "any later TYPE-workstream phase (126–128)"). See D-07.

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Phase scope & requirements
- `.planning/ROADMAP.md` — Phase 126 entry (goal + 3 success criteria; lines ~428–439).
- `.planning/REQUIREMENTS.md` — TYPE-04 (line 101). TYPE-05+ are Phases 127–128 — do NOT pull in.

### The target file & its error surface
- `apps/frontend/src/lib/api/adapters/supabase/dataProvider/supabaseDataProvider.ts` — the file (561 lines; class `SupabaseDataProvider extends supabaseAdapterMixin(UniversalDataProvider)`; 78/79 errors in `_getNominationData` lines 258–424; 79th at 549:14).
- `apps/frontend/src/lib/api/adapters/supabase/dataProvider/supabaseDataProvider.type.ts` — companion types (49 lines).

### Generated types & RPC schema
- `packages/supabase-types/src/database.ts` — the stale generated file (missing `get_nominations`); regenerated by D-01 via `yarn db:types`.
- `packages/supabase-types/src/index.ts` — exports `Database`, `Json`, `Tables<>`, `Enums<>` etc. plus `column-map.ts` maps.
- `apps/supabase/supabase/schema/503-entity-rpcs.sql` (line 11) — `get_nominations` definition with the full 33-column `RETURNS TABLE` (ground truth for the regenerated Returns shape).
- `apps/frontend/src/lib/api/adapters/supabase/supabaseAdapter.ts` (lines 36, 44, 55) — client already created as `SupabaseClient<Database>`; the typed foundation the RPC fix plugs into.

### Shared helper seam (D-05)
- `apps/frontend/src/lib/api/adapters/supabase/utils/toDataObject.ts` — the `Record<string, unknown>` seam to generify (pipeline: `localizeRow` → `mapRow`); has its own `.test.ts`.
- `apps/frontend/src/lib/api/adapters/supabase/utils/` — `localizeRow.ts`, `mapRow.ts`, `getLocalized.ts`, `storageUrl.ts` (`StoredImage` + `parseStoredImage`) — the ad-hoc guard layer the provider uses (no Zod anywhere in the adapter path).
- `apps/frontend/src/lib/api/adapters/supabase/dataWriter/supabaseDataWriter.ts` — Phase 127 scope; MUST keep compiling unchanged under D-05 (it already imports `{ Json, Tables }` from `@openvaa/supabase-types` — see line 242 for the closest in-repo generated-type row-mapping example).

### Folded todo
- `.planning/todos/pending/2026-07-15-remove-inert-qs-declare-module-shim.md` — the one-line `global.d.ts` cleanup (D-07).
- `apps/frontend/src/lib/types/global.d.ts` (line 13) — the shim itself.

### Workstream context & conventions
- `.planning/phases/125-svelte-check-0-trivial-tier/125-CONTEXT.md` — the D-04 gate convention carried forward here as D-06; cluster-scoped discipline.
- `.planning/phases/125-svelte-check-0-trivial-tier/125-VERIFICATION.md` — 133-error baseline evidence + the qs-shim inertness A/B test.
- `.planning/todos/pending/2026-06-12-resolve-all-svelte-check-errors.md` — workstream umbrella todo (tagged `resolves_phase: 132`, NOT this phase).

### Review gate
- `.agents/code-review-checklist.md` — mandatory per CLAUDE.md.

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- svelte-check: `yarn check` inside `apps/frontend` — the before/after measurement tool (current: `COMPLETED 2090 FILES 133 ERRORS 1 WARNINGS 17 FILES_WITH_PROBLEMS`).
- Type regeneration: `yarn db:types` → `supabase gen types typescript --local` (requires local Supabase running; writes `packages/supabase-types/src/database.ts`).
- `Tables<'x'>` helper resolves directly to the Row type — idiomatic generated-type consumption (note: `supabaseDataWriter.ts:242` indexes `['Row']` redundantly; don't copy that).
- Existing gates: `yarn build`, `yarn test:unit`, `yarn test:e2e` (host Vite + local Supabase; suite last green 125/0/0).

### Established Patterns
- **Typed `.from()` queries already work** — the client is `SupabaseClient<Database>`; the five `.from()` read methods have zero errors. The RPC is the only untyped surface.
- **Verified-baseline convention** — capture svelte-check count BEFORE changes (133 re-verified during this discussion; scout output saved in scratchpad `svelte-check-126.txt`).
- **Atomic per-cluster commits** — workstream convention (Phases 123–125) for clean bisects.
- **E2E cardinal rule** — full-suite run is the trust signal; "did not run" counts as failure. Fresh dev server on :5173 + `yarn db:reset` before the gate.
- **`// reason:` accepted-cast idiom** exists in the file (`as Json as unknown as StoredImage | null`) — D-04 forbids it for the two TS2352s, but pre-existing occurrences outside the error set are not in scope to churn.

### Integration Points
- `_getNominationData` fans `this.supabase.rpc('get_nominations', {...})` out per (election, constituency) pair, then dedups/reverse-fills relationships in memory (258–424) — the typed row lands here; D-03 allows light structural cleanup.
- `toDataObject` is shared by the provider AND `supabaseDataWriter.ts` (Phase 127) — D-05's backward-compat constraint is what keeps the phases decoupled.
- `parseStoredImage` / `parseAnswers` remain the runtime guards for JSONB image/answer payloads — typed rows don't remove the need for them (JSONB columns stay `Json` even in regenerated types).

</code_context>

<specifics>
## Specific Ideas

- The phase is really "regenerate stale types + let the compiler do the work": ~76 errors collapse from the regen alone. The provider-side diff should be small and mostly *removals* (dead null-guards, dissolved casts).
- Expected end state: one measurable line — svelte-check 133 → ~54 with `supabaseDataProvider.ts` (non-test) at 0 — plus a green full E2E run.
- Regen drift is expected and fine (D-02); watch the regen commit's before/after counts so any drift-caused fallout is attributed honestly.

</specifics>

<deferred>
## Deferred Ideas

None raised — discussion stayed within phase scope.

### Reviewed Todos (not folded)
- `2026-06-12-resolve-all-svelte-check-errors.md` — whole-workstream umbrella (→ Phase 132 gate flip); Phase 126 clears only its TYPE-04 slice.
- `supabaseDataProvider.test.ts` type errors (10) — Phase 128 / TYPE-08 scope; explicitly not fixed here even though the file sits next to the target.
- `2026-06-05-migrate-supabase-auth-code-from-routes-to-adapters.md` — adapter-architecture work, not type hygiene; backlog.
- `frontend-project-id-scoping.md`, `configurable-mock-data.md`, `adapter-package-loading.md` — data-provider-adjacent architecture/backlog items; out of TYPE-workstream scope.
- Remaining keyword matches (nominations fetch, MultipleTextQuestion, view-transition flicker, etc.) — Phases 129+ feature work or unrelated backlog.

</deferred>

---

*Phase: 126-svelte-check-0-supabasedataprovider*
*Context gathered: 2026-07-16*
