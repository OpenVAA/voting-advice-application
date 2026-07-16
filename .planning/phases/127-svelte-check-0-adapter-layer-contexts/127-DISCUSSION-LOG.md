# Phase 127: svelte-check → 0 — Adapter Layer & Contexts - Discussion Log

> **Audit trail only.** Do not use as input to planning, research, or execution agents.
> Decisions are captured in CONTEXT.md — this log preserves the alternatives considered.

**Date:** 2026-07-16
**Phase:** 127-svelte-check-0-adapter-layer-contexts
**Areas discussed:** Promise-plumbing fix direction, JobMessage → Json seam, RPC nullability audit fold, Scope boundary confirmation

---

## Promise-plumbing fix direction (TYPE-06, 18 errors, one root cause)

| Option | Description | Selected |
|--------|-------------|----------|
| Drop the dead Promise plumbing | prepareDataWriter accepts the sync UniversalDataWriter (keeps browser guard + null check + init({fetch})); rename dataWriterPromise → dataWriter at call sites; candidateUserDataState's #dataWriterPromise field follows. ~5 files, honest root-cause fix. | ✓ |
| Widen signature only | Accept UniversalDataWriter \| Promise<UniversalDataWriter>; zero call-site churn but misleading naming stays. | |
| Re-wrap in Promise.resolve | One-line change keeping the Promise contract; codifies dead indirection. | |

**User's choice:** Drop the dead Promise plumbing (recommended option)
**Notes:** Ground truth established during discussion: all 18 context errors trace to `$lib/api/dataWriter` exporting a sync `new SupabaseDataWriter()` while `prepareDataWriter()` demands `Promise<UniversalDataWriter>` — leftover from the removed adapter-switch dynamic-import era. Runtime already synchronous.

---

## JobMessage → Json seam (TYPE-05, 2 of 4 errors)

| Option | Description | Selected |
|--------|-------------|----------|
| interface → type alias | Change `interface JobMessage` to a type alias in jobStore.type.ts — implicit index signature fixes both insert sites at the source, zero runtime change. | ✓ |
| Cast at the 2 insert sites | `as Json` with // reason: comments — hides the seam at each consumer. | |
| Serialization helper | toJson()/Jsonify<T> at the boundary — new machinery for a structurally-fine type. | |

**User's choice:** interface → type alias (recommended option)
**Notes:** The `'project_id' does not exist` text in both errors was diagnosed as overload-2 noise — project_id exists in schema and regenerated types; the real failure is the missing index signature on the interface.

---

## RPC nullability audit fold

| Option | Description | Selected |
|--------|-------------|----------|
| Don't fold — keep 127 mechanical | Phase stays a clean 22-error clearing with pinned accounting; audit belongs in its own slot. | ✓ |
| Fold it in | Handle the RETURNS-TABLE nullability audit here — grows scope beyond the 22 errors. | |

**User's choice:** Don't fold (recommended option)
**Notes:** The todo (`2026-07-16-rpc-returns-table-nullability-audit.md`) names Phase 127 as a natural home, but it is a per-column design decision (3 candidate mechanisms), not error clearing. Its null-guard warning still binds this phase's writer-side work.

---

## Scope boundary confirmation

| Option | Description | Selected |
|--------|-------------|----------|
| Yes — tests are Phase 128 | Adapter-dir .test.ts errors (10+4+1) stay TYPE-08; 127 pinned at exactly 22 errors, 46 → 24. | ✓ |
| No — pull adapter tests in | Clear dataWriter.test + adminWriter.test here too (46 → 19); muddies TYPE-08 accounting. | |

**User's choice:** Yes — tests are Phase 128 (recommended option)
**Notes:** Consistent with the Phase-126 precedent (supabaseDataProvider.test.ts explicitly deferred to TYPE-08).

---

## Claude's Discretion

- Writer 242:77 — drop redundant `['Row']` indexing (mechanical).
- Writer 319:7 — how to type `processedAnswers` for the `upsert_answers` RPC `Json` param (prefer proper typing over casting).
- Commit granularity (atomic per-cluster preferred, workstream convention).
- Whether `prepareDataWriter` gets renamed now that it no longer awaits.
- Fallout handling if the Promise-type removal surfaces follow-on errors in importing files (fix in-phase if caused by the change; defer pre-existing Phase-128 errors).

## Deferred Ideas

- RPC RETURNS-TABLE nullability audit — stays in backlog (`.planning/todos/pending/2026-07-16-rpc-returns-table-nullability-audit.md`); Phase 128+ / backlog candidate.
