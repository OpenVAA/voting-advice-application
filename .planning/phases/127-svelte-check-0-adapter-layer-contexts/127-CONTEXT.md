# Phase 127: svelte-check → 0 — Adapter Layer & Contexts - Context

**Gathered:** 2026-07-16
**Status:** Ready for planning

<domain>
## Phase Boundary

Third phase of the svelte-check → 0 workstream (Phases 125–128, gate-flip in 132). The remainder of the Supabase adapter layer (**TYPE-05**: `supabaseDataWriter.ts` 3 errors + `supabaseAdminWriter.ts` 1 error) and the context layer (**TYPE-06**: `adminContext.svelte.ts` 8 + `candidateContext.svelte.ts` 6 + `authContext.svelte.ts` 4) typecheck clean — **22 errors cleared, no runtime behavior change**, with the full E2E suite as the behavior-neutrality safety net.

**Ground truth verified 2026-07-16** (fresh svelte-check run saved to scratchpad `svelte-check-127-baseline.txt` during discussion):

- Baseline: **46 errors / 1 warning** (`COMPLETED 2674 FILES 46 ERRORS 1 WARNINGS 16 FILES_WITH_PROBLEMS`) — exactly matches Phase 126's pinned close. The ROADMAP's per-file counts (8/6/4) remain accurate post-regen.
- **All 18 context-layer errors share ONE root cause:** `$lib/api/dataWriter` (`apps/frontend/src/lib/api/dataWriter.ts`) re-exports `dataWriter = new SupabaseDataWriter()` — a **synchronous instance** — but every context call site funnels it through `prepareDataWriter(dataWriterPromise: Promise<UniversalDataWriter>)` (`apps/frontend/src/lib/contexts/utils/prepareDataWriter.ts`), a leftover from the removed adapter-switch dynamic-import era. `SupabaseDataWriter` IS a `UniversalDataWriter` (extends `supabaseAdapterMixin(UniversalDataWriter)`); it's just not a Promise. Runtime already works (`await` on a non-promise is a no-op) — only the types lie.
- **supabaseDataWriter.ts (3):** ① 242:77 — redundant `Tables<'nominations'>['Row']` indexing (`Tables<>` already resolves to Row; the exact idiom Phase 126's CONTEXT flagged "don't copy"); ② 319:7 — `Record<string, unknown>` not assignable to `Json` at the `upsert_answers` RPC `p_answers` arg; ③ 415:62 — `JobMessage[]` not assignable to `Json` at the `admin_jobs` insert.
- **supabaseAdminWriter.ts (1):** 49:62 — same `JobMessage[]` → `Json` failure at its `admin_jobs` insert. **Note:** the `'project_id' does not exist` text in both error messages is overload-2 (array-form) noise — `admin_jobs.project_id` exists in schema (`108-admin-jobs.sql:9`) and in the regenerated types. The real failure is `interface JobMessage` (`src/lib/server/admin/jobs/jobStore.type.ts:35`) lacking an index signature, which blocks assignability to `Json`.
- Expected post-phase count: **24 errors / 1 warning** (46 − 22), with all 5 target files at 0.

**Out of bounds:** ALL `.test.ts` errors — `supabaseDataProvider.test.ts` (10), `supabaseDataWriter.test.ts` (4), `supabaseAdminWriter.test.ts` (1) — are Phase 128 / TYPE-08 (D-04 pins this). Long-tail singles (candidate routes, `viewTransition.ts`, `EntityInfo.svelte`, `FeedbackPopup.svelte`, `Term.svelte` warning) are Phase 128 / TYPE-07/09. The RPC RETURNS-TABLE nullability audit stays in backlog (D-05). Gate flip is Phase 132. Cluster-scoped discipline carries forward: do not fix neighboring-phase errors.

</domain>

<decisions>
## Implementation Decisions

### TYPE-06 — dataWriter Promise-plumbing (18 errors, one seam)
- **D-01 — Drop the dead Promise plumbing (root-cause fix).** Change `prepareDataWriter` to accept the synchronous `UniversalDataWriter` (keep its guard duties: browser-only check, null/adapter-support check, `init({ fetch })`). Rename the misleading `dataWriterPromise` bindings to `dataWriter` at the context call sites (`authContext.svelte.ts`, `adminContext.svelte.ts`, `candidateContext.svelte.ts`), and follow through `candidateUserDataState.svelte.ts`'s `#dataWriterPromise: Promise<UniversalDataWriter>` field + factory params (~5 files). Do NOT re-wrap the export in `Promise.resolve` and do NOT merely widen the signature to a union — the adapter switch is gone (CLAUDE.md: "Supabase is the only production adapter"), so the honest shape is synchronous. Runtime is already synchronous; this is type/naming truth-telling only.

### TYPE-05 — JobMessage → Json seam (2 of the 4 errors)
- **D-02 — Convert `interface JobMessage` to a type alias** in `apps/frontend/src/lib/server/admin/jobs/jobStore.type.ts` (`type JobMessage = {...}` — structurally identical; type aliases get implicit index signatures, so both `admin_jobs` insert sites fix at the source with zero runtime change and no casts). If other interfaces in the same file feed the same Json columns (e.g. via `input`/`output` payloads) and surface follow-on errors, apply the same interface→type treatment in-phase (honest clearing includes fallout — Phase 125 D-01 precedent).

### Scope & accounting
- **D-03 — Keep 127 mechanical; RPC nullability audit NOT folded.** `.planning/todos/pending/2026-07-16-rpc-returns-table-nullability-audit.md` stays in backlog despite naming Phase 127 as a natural home — it is a per-column design decision (documented casts / RPC restructure / type-override layer), not type-error clearing. Do not let writer-side fixes silently "solve" nullability by trusting the generated non-null Returns columns: preserve existing null-guards per the todo's warning.
- **D-04 — Test files are Phase 128.** All adapter-dir `.test.ts` errors (10 + 4 + 1) remain TYPE-08 scope. Phase 127 target pinned: exactly 22 errors cleared, 46 → 24, the 5 non-test target files at 0.

### Acceptance gate
- **D-06 — Carry forward the workstream full gate (Phase 125 D-04 / 126 D-06 convention).** Success = build + unit tests + svelte-check showing all 22 targeted errors gone with **no net-new (46 → 24 exact)**, verified per-file (writer 0, adminWriter 0, adminContext 0, candidateContext 0, authContext 0) + **one full E2E suite run as the behavior-neutrality trust signal** (cardinal rule — failing or did-not-run E2E blocks completion). E2E prereqs per project convention: fresh dev server on :5173 (no Playwright webServer) + clean DB (`yarn db:reset`) before the gate; watch for the storage/imgproxy 502-wedge (remedy: `supabase stop && supabase start`, re-verified via a fast probe before the trusted run). Capture before/after counts in verification evidence.

### Claude's Discretion
- **Writer error ① (242:77):** drop the redundant `['Row']` index (`Tables<'nominations'>` is already the Row type) — mechanical.
- **Writer error ② (319:7):** how to type `processedAnswers` so it satisfies the `upsert_answers` RPC `Json` param — prefer typing the accumulator correctly over casting; a documented cast is acceptable only if the `LocalizedAnswers` shape genuinely can't be expressed as `Json` without runtime change.
- Commit granularity — prefer atomic per-cluster commits (Promise-plumbing / JobMessage / writer residuals) so regressions bisect cleanly (workstream convention).
- Whether `prepareDataWriter` keeps its current name or gets renamed (e.g. `initDataWriter`) now that it no longer awaits — naming truthfulness is in D-01's spirit, but don't churn beyond the ~5 touched files.
- Exact handling if dropping the Promise type surfaces follow-on errors in files importing from the touched contexts — fix in-phase if caused by this change (fallout rule), defer if pre-existing Phase-128 errors.

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Phase scope & requirements
- `.planning/ROADMAP.md` — Phase 127 entry (goal + 3 success criteria; ~line 455).
- `.planning/REQUIREMENTS.md` — TYPE-05 (line 102), TYPE-06 (line 103). TYPE-07/08/09 are Phase 128 — do NOT pull in.

### TYPE-06 — the Promise-plumbing seam (D-01)
- `apps/frontend/src/lib/contexts/utils/prepareDataWriter.ts` — the function whose `Promise<UniversalDataWriter>` param is the single root cause of all 18 context errors; keeps browser guard + null check + `init({ fetch })`.
- `apps/frontend/src/lib/api/dataWriter.ts` — one-line re-export of the sync instance.
- `apps/frontend/src/lib/api/adapters/supabase/dataWriter/index.ts` — `export const dataWriter = new SupabaseDataWriter()` (the sync export).
- `apps/frontend/src/lib/contexts/auth/authContext.svelte.ts` (errors at 81, 88, 93, 100) — 4 call sites.
- `apps/frontend/src/lib/contexts/admin/adminContext.svelte.ts` (errors at 162–204, 8 sites).
- `apps/frontend/src/lib/contexts/candidate/candidateContext.svelte.ts` (errors at 127, 419, 423, 431, 460, 487) — includes passing the writer into the user-data state factory.
- `apps/frontend/src/lib/contexts/candidate/candidateUserDataState.svelte.ts` (lines 40, 88–96, 305–317) — `#dataWriterPromise` field + factory params; typecheck-clean today but MUST be updated in the D-01 rename (it types the same seam).
- `apps/frontend/src/lib/api/base/universalDataWriter.ts` — `UniversalDataWriter` abstract base (`SupabaseDataWriter extends supabaseAdapterMixin(UniversalDataWriter)`).

### TYPE-05 — writer/adminWriter errors (D-02 + discretion items)
- `apps/frontend/src/lib/api/adapters/supabase/dataWriter/supabaseDataWriter.ts` (errors at 242:77, 319:7, 415:62).
- `apps/frontend/src/lib/api/adapters/supabase/adminWriter/supabaseAdminWriter.ts` (error at 49:62).
- `apps/frontend/src/lib/server/admin/jobs/jobStore.type.ts` (line 35) — `interface JobMessage` → type alias (D-02).
- `apps/supabase/supabase/schema/108-admin-jobs.sql` — `admin_jobs` table (confirms `project_id` exists; the error text's complaint about it is overload noise).
- `packages/supabase-types/src/database.ts` — regenerated at Phase 126; current and trusted. Do NOT hand-edit; do NOT regen this phase unless a schema change lands (none planned).

### Workstream context & conventions
- `.planning/phases/126-svelte-check-0-supabasedataprovider/126-CONTEXT.md` — D-05 backward-compat `toDataObject` constraint (now released: Phase 127 owns the writer and MAY consume the generic properly), D-06 gate convention.
- `.planning/phases/126-svelte-check-0-supabasedataprovider/126-05-SUMMARY.md` — residual-46 per-file breakdown (this phase's baseline evidence) + the storage-502 E2E environment-recovery note.
- `.planning/phases/125-svelte-check-0-trivial-tier/125-CONTEXT.md` — fallout-fix rule (D-01 precedent) + cluster-scoped discipline.
- `.planning/todos/pending/2026-07-16-rpc-returns-table-nullability-audit.md` — NOT folded (D-03), but its warning binds this phase: generated RETURNS-TABLE columns lie about nullability; keep null-guards alive (e.g. the documented `parent_nomination_id` cast pattern from 126-03).
- `.planning/todos/pending/2026-06-12-resolve-all-svelte-check-errors.md` — workstream umbrella (tagged `resolves_phase: 132`, NOT this phase).

### Review gate
- `.agents/code-review-checklist.md` — mandatory per CLAUDE.md.

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- svelte-check: `yarn check` inside `apps/frontend` — before/after measurement tool (current: `COMPLETED 2674 FILES 46 ERRORS 1 WARNINGS 16 FILES_WITH_PROBLEMS`; raw baseline in scratchpad `svelte-check-127-baseline.txt`).
- `toDataObject<TRow>` generic (Phase 126 D-05) — the writer may now flow typed rows through it; the backward-compat default (`Record<string, unknown>`) means adopting the generic is optional, not required.
- `Tables<'x'>` helper — resolves directly to the Row type (no `['Row']` indexing).
- Existing gates: `yarn build`, `yarn test:unit`, `yarn test:e2e` (host Vite + local Supabase; suite last green 125/0/0 at Phase 126 close).

### Established Patterns
- **Verified-baseline convention** — 46/1 re-verified via fresh run during this discussion.
- **Atomic per-cluster commits** — workstream convention (Phases 123–126) for clean bisects.
- **E2E cardinal rule** — full-suite run is the trust signal; "did not run" counts as failure. Fresh dev server on :5173 + `yarn db:reset` before the gate.
- **Documented-cast pattern for RPC nullability lies** — 126-03's `row.parent_nomination_id as string | null | undefined` shows how to keep null-guards alive when generated Returns types over-promise non-null (relevant if writer-side RPC reads get touched).
- **`// reason:` accepted-cast idiom** — last resort only; D-02 avoids it entirely via the type-alias fix.

### Integration Points
- `prepareDataWriter` is shared by all three error contexts AND `candidateUserDataState.svelte.ts` (clean today, but its `#dataWriterPromise` typing must move in lockstep with D-01) — one seam, four consumers.
- `JobMessage` originates in server-side job-store types (`src/lib/server/admin/jobs/jobStore.type.ts`) and crosses to both adapter writers via `AdminJobRecord.messages` — D-02's alias change is upstream of both error sites.
- `admin_jobs` inserts resolve `project_id` from `elections` at runtime (writer 405–415, adminWriter 40–49) — behavior-neutral zone; only the `messages` typing changes.
- The contexts' wrapper methods (`§18 arrow fields`) call `prepareDataWriter(...)` per invocation — D-01 changes types/names only, not the call pattern.

</code_context>

<specifics>
## Specific Ideas

- The phase is really "delete a dead abstraction + one interface→type flip": 18 errors dissolve by accepting that the data writer is synchronous now, 2 more by making `JobMessage` Json-compatible, leaving 2 mechanical writer fixes. The diff should be small and mostly renames/removals.
- Expected end state: one measurable line — svelte-check 46 → 24 with all 5 target files at 0 — plus a green full E2E run.
- The `'project_id' does not exist` error text is a known decoy (overload-2 noise); do not "fix" project_id — it exists and works.

</specifics>

<deferred>
## Deferred Ideas

- **RPC RETURNS-TABLE nullability audit** — `.planning/todos/pending/2026-07-16-rpc-returns-table-nullability-audit.md`; deliberately not folded (D-03). Backlog / Phase 128+ candidate.

### Reviewed Todos (not folded)
- `2026-07-16-rpc-returns-table-nullability-audit.md` — design task (3 candidate mechanisms), not error clearing; its null-guard warning still binds this phase (D-03).
- `2026-06-12-resolve-all-svelte-check-errors.md` — workstream umbrella (→ Phase 132 gate flip); Phase 127 clears only its TYPE-05/06 slice.
- `2026-03-28-investigate-migrating-candidate-answer-store.md` — architectural investigation of the candidate answer store, not type hygiene; backlog.
- `2026-06-05-migrate-supabase-auth-code-from-routes-to-adapters.md` — adapter-architecture work; backlog.
- `2026-05-31-display-nominating-org-in-candidate-profile-nominations.md` — feature work touching the writer's surface; Phases 129+.
- `2026-06-03-after-runes-update-check-stale-app-header-styling-banner-ima.md`, `2026-06-06-disable-hover-and-pointer-on-disabled-results-header-button.md` — UI polish, keyword-matched only.
- Remaining keyword matches (adapter-package-loading, frontend-project-id-scoping, seed typing, eslint guard extension, etc.) — architecture/backlog items outside TYPE-workstream scope.

</deferred>

---

*Phase: 127-svelte-check-0-adapter-layer-contexts*
*Context gathered: 2026-07-16*
