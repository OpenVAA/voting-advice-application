---
phase: 126-svelte-check-0-supabasedataprovider
plan: 03
subsystem: frontend
tags: [supabase, typescript, svelte-check, discriminated-union, data-provider, TYPE-04]
status: complete

# Dependency graph
requires:
  - phase: 126-01
    provides: Typed get_nominations Args/Returns (RPC args now string | undefined) + regen 133 -> 50
  - phase: 126-02
    provides: Generic toDataObject<TRow extends Record<string, unknown>> so typed rows flow without an input cast
provides:
  - supabaseDataProvider.ts at 0 svelte-check errors (target file cleared)
  - Explicitly-typed entity-variant intermediate (no cast) in _getNominationData
  - Explicitly-typed question-variant intermediate (single cast, no double-cast) in _getQuestionData
  - Pinned total svelte-check count at 46 errors / 1 warning
affects: [126-05, phase-127-writer-cluster]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "Discriminated-union narrowing at the construction site (branch on the discriminant, build a variant-specific object) replaces union-suppressing casts — no `as unknown as X` escape hatch."
    - "null -> undefined RPC-arg coercion is behavior-neutral against SQL DEFAULT NULL columns."

key-files:
  created: []
  modified:
    - apps/frontend/src/lib/api/adapters/supabase/dataProvider/supabaseDataProvider.ts
    - apps/frontend/src/lib/api/adapters/supabase/dataProvider/supabaseDataProvider.test.ts

key-decisions:
  - "Entity site (near 374): achieved genuine NO-cast narrowing by building an explicitly-typed `base` (pulled fields, not a Record spread) and branching on entityType into CandidateData/OrganizationData/FactionData/AllianceData."
  - "Question site (near 549/573): used a SINGLE `as AnyQuestionVariantData` after naming id/type/name/categoryId explicitly. Genuine no-cast is impractical here — the `...obj` spread must carry arbitrary DB columns (behavior), and the choices field is incompatible across choice/non-choice union members. The acceptance forbids only the `as unknown as X` double-cast, which is satisfied."
  - "Kept the `parent_nomination_id as string | null | undefined` cast: the regenerated Returns types the column non-null `string`, but it is semantically nullable (nominations without a parent). Removing it would make TS treat the null-guards as dead and risk a latent bug. This cast is NOT dead — it corrects a generated-type nullability gap."

patterns-established:
  - "Pattern: to clear a TS2352 union cast without the `as unknown as` escape hatch, name the target union's required discriminant + identity fields explicitly on the source literal so it structurally overlaps at least one member."

requirements-completed: [TYPE-04]

coverage:
  - id: D-03
    description: "RPC args coerced null -> undefined (259/260 cleared behavior-neutrally); dead casts/null-guards the typed Returns row makes redundant removed; toDataObject input casts dropped."
    requirement: "TYPE-04"
    verification:
      - kind: automated
        ref: "cd apps/frontend && yarn check — 259/260 absent; supabaseDataProvider.ts source at 0"
        status: pass
      - kind: automated
        ref: "yarn vitest run supabaseDataProvider.test.ts — 46/46 (default-values test updated to assert undefined args)"
        status: pass
  - id: D-04
    description: "The two TS2352 casts (entity near 374, question near 549) replaced by explicitly-typed variant construction; no `as unknown as Any(Entity|Question)VariantData` remains."
    requirement: "TYPE-04"
    verification:
      - kind: automated
        ref: "grep -nE 'as unknown as Any(Entity|Question)VariantData' — no matches"
        status: pass
      - kind: automated
        ref: "cd apps/frontend && yarn check — 0 lines for supabaseDataProvider.ts source; total 46 ERRORS 1 WARNINGS"
        status: pass

# Metrics
metrics:
  duration: ~25m
  completed: 2026-07-16
  tasks: 2
  files: 2
---

# Phase 126 Plan 03: Type supabaseDataProvider.ts (D-03/D-04) Summary

**Cleared the 4 residual `supabaseDataProvider.ts` svelte-check errors the plan 126-01 regen did not resolve — the net-new RPC-arg pair (259/260) via a behavior-neutral null -> undefined coercion, and the two pre-existing TS2352 casts (entity near 374, question near 549) via proper discriminated-union narrowing — taking the target file to 0 errors and the total svelte-check count from 50 to a pinned 46 (1 warning), with runtime behavior unchanged (46/46 provider unit tests green).**

## What was built

- **Task 1 (`fix`, `b6d6799aa`):** `_getNominationData` typed against the regenerated `get_nominations` Returns row.
  - RPC args coerced `eid ?? undefined` / `cid ?? undefined` at the `get_nominations` call — the regenerated types both filters as `string | undefined` while the fan-out locals are `string | null`; omitting the value applies the SQL DEFAULT NULL, semantically identical to passing null. Clears 259/260.
  - Removed the now-dead casts/guards the non-null typed row makes redundant: the `row.id != null && row.entity_type != null` guard + `as string` casts in the `nominationTypeById` loop, the `row.id as string` casts in the dedup loop, `row.entity_id as string`, `row.entity_type as string`, and the `as Record<string, unknown>` input casts on `toDataObject(nomRow)` / `toDataObject(entityRow)`.
  - Replaced the `entity as AnyEntityVariantData` cast (TS2352 at 374) with an explicitly-typed `base` intermediate (fields pulled + typed, not a `Record` spread) branching on `entityType` into Candidate (adds firstName/lastName/organizationId), Organization (`name: base.name ?? ''`), Faction, and Alliance — the discriminated `AnyEntityVariantData` union now resolves structurally with **no cast**.
  - JSONB runtime guards (`parseStoredImage`, `parseAnswers`) retained verbatim (guard counts 23 / 6 unchanged).
  - Updated the `passes default values when no filter options provided` test to assert `undefined` args (the behavior-neutral coercion) — see Deviations.
- **Task 2 (`fix`, `fd11941b6`):** `_getQuestionData` question-variant cast narrowed.
  - Named the discriminant (`type`) plus identity fields (`id`, `name`, `categoryId`) explicitly on the returned literal, drawn from the typed row / localized `obj`, so the object structurally overlaps `AnyQuestionVariantData` — clearing the TS2352 at the question site. A single `as AnyQuestionVariantData` remains (no `as unknown as` double-cast).
  - Dropped the `as Record<string, unknown>` input cast on `toDataObject(row)` (126-02 generic).
  - Preserved the `choices` localization, the `customData.allowOpen` bridge, and the `parseStoredImage(row.image)` guard unchanged.

## Verification results

| Check | Result |
|-------|--------|
| `cd apps/frontend && yarn check` — `grep -c "supabaseDataProvider.ts"` (source) | **0** ✓ |
| `cd apps/frontend && yarn check` total | **46 ERRORS / 1 WARNING** (was 50; pinned, matches RESEARCH ≈46) ✓ |
| `grep -nE "as unknown as Any(Entity\|Question)VariantData"` | no matches ✓ |
| JSONB guards `parseStoredImage` / `parseAnswers` counts | 23 / 6 — unchanged vs baseline ✓ |
| RPC arg source assertion | `p_election_id: eid ?? undefined`, `p_constituency_id: cid ?? undefined` ✓ |
| `yarn vitest run supabaseDataProvider.test.ts toDataObject.test.ts` | 52/52 passing ✓ |
| Net-new errors outside target file | none (FILES_WITH_PROBLEMS 17 -> 16, only the source cleared) ✓ |

## Deviations from Plan

**1. [Test-maintenance accompanying the RPC-arg fix] Updated the default-values unit test assertion (null -> undefined)**
- **Found during:** Task 1
- **Issue:** `supabaseDataProvider.test.ts` `passes default values when no filter options provided` asserted the RPC was called with `p_election_id: null, p_constituency_id: null`. The plan's null -> undefined coercion changes the literal argument (semantically identical against SQL DEFAULT NULL).
- **Fix:** Updated the assertion to expect `undefined` for both args, with a comment explaining the behavior-neutral coercion. This is expected test-maintenance for the source change, not masking a regression — the SQL semantics (DEFAULT NULL) are unchanged.
- **Files modified:** `apps/frontend/src/lib/api/adapters/supabase/dataProvider/supabaseDataProvider.test.ts`
- **Commit:** `b6d6799aa`

**2. [Judgment call, within plan intent] Question site retains a single cast; entity site is genuinely cast-free**
- The plan's key-links aspire to "no cast is needed" for both sites. The entity site achieves this. The question site cannot practically be cast-free: the `...obj` spread must carry arbitrary DB columns for behavior parity, and `choices` is incompatible across the choice vs non-choice union members (no-cast would require 9-way per-type branching). The single `as AnyQuestionVariantData` satisfies the hard constraint (no `as unknown as X` double-cast) and the acceptance grep. Documented as a decision.

**3. [Correctness preservation] Kept the `parent_nomination_id as string | null | undefined` cast**
- The plan's D-03 says remove casts the non-null typed row makes redundant. The regenerated Returns types `parent_nomination_id` as non-null `string`, but the column is semantically nullable (nominations without a parent). This cast is NOT dead — removing it would make TS treat the `!= null` parent-lookup guards as dead code and risks a latent bug. Retained for correctness.

## Known Stubs

None.

## Self-Check: PASSED

- FOUND: apps/frontend/src/lib/api/adapters/supabase/dataProvider/supabaseDataProvider.ts (source at 0 errors)
- FOUND: apps/frontend/src/lib/api/adapters/supabase/dataProvider/supabaseDataProvider.test.ts (assertion updated)
- FOUND: .planning/phases/126-svelte-check-0-supabasedataprovider/126-03-SUMMARY.md
- FOUND commit: b6d6799aa (Task 1)
- FOUND commit: fd11941b6 (Task 2)

---
*Phase: 126-svelte-check-0-supabasedataprovider*
*Completed: 2026-07-16*
