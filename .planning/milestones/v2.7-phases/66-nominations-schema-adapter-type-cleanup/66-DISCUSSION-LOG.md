# Phase 66: Nominations Schema + Adapter Type Cleanup - Discussion Log

> **Audit trail only.** Do not use as input to planning, research, or execution agents.
> Decisions are captured in CONTEXT.md — this log preserves the alternatives considered.

**Date:** 2026-04-29
**Phase:** 66-nominations-schema-adapter-type-cleanup
**Areas discussed:** Schema scope, Migration safety, Intermediate type location, Plan split, Scope reframe (added during discussion)

> **⚠ SCOPE CHANGE DURING DISCUSSION:** User declined the schema-migration scope mid-discussion. Phase 66 narrowed from "drop both columns + adapter retype" to **adapter retype only**. DB-01 requirement → moved to deferred. ROADMAP/REQUIREMENTS/STATE updates land in the same commit as this log.

---

## Schema Scope (initial question)

| Option | Description | Selected |
|--------|-------------|----------|
| Drop name only | Drop `nominations.name`. Keep `entity_type` (it's already correctly derived; querying via it is convenient + indexed). Matches ROADMAP SC-1 escape clause. | |
| Drop name + entity_type | Drop both columns. Adapter derives entity_type in-memory from FK at read time. Tighter denormalization, but loses index utility + every consumer query needs the derivation. | |
| Drop name + scope entity_type behind a not-null CHECK | Drop name; replace generated column with `CHECK` asserting entity_type matches non-null FK. More explicit, but redundant with the existing generated-always semantic. | |
| **Other (free text):** "Let's keep the table as is." | Decline migration entirely; phase becomes adapter-retype only. | ✓ |

**User's choice:** "Let's keep the table as is."
**Notes:** Triggered the scope-reframe question below. User reasoning: `entity_type` is structurally safe (generated-always-stored); `name` is harmless; cleanup is nice-to-have, not blocking.

---

## Migration Safety (initial question)

| Option | Description | Selected |
|--------|-------------|----------|
| Pre-flight + abort-on-data | Migration pre-checks for non-null `name` rows, aborts if found. | |
| Pre-flight + log-and-continue | Log row count + sample, drop anyway. | |
| Unconditional drop | No pre-flight. | |
| **Other (free text):** "Se earlier" | Defers to schema-scope answer; no migration → no safety concern. | ✓ |

**User's choice:** "Se earlier" (deferred to schema decision)
**Notes:** Moot once D-01 made migration N/A.

---

## Intermediate Type Location

| Option | Description | Selected |
|--------|-------------|----------|
| Top of supabaseDataProvider.ts | Define near the top of the file, alongside the function it serves. Local to consumer; no cross-file maintenance burden. | |
| **Sibling supabaseDataProvider.types.ts** | Extract to a sibling file. Cleaner separation; the type is only used in one consumer. | ✓ |
| Add to @openvaa/supabase-types | Centralize there. Wrong location — that package mirrors DB schema; this is an adapter-internal intermediate. | |

**User's choice:** Sibling supabaseDataProvider.types.ts
**Notes:** Adapter-internal type colocated with consumer; types separated from runtime; no cross-package leak.

---

## Plan Split

| Option | Description | Selected |
|--------|-------------|----------|
| Migration → Cleanup grep → Adapter retype | (1) SQL migration + pgTAP + types regeneration, (2) Codebase grep + remove any reads of dropped columns + dev-seed updates, (3) Adapter retyping. | ✓ (initial answer; superseded by scope reframe) |
| Migration+cleanup combined → Adapter retype → Verification | Bundle migration + grep cleanup; separate adapter + verification. | |
| Adapter first, then migration | Retype adapter first using current shape, then drop columns. | |

**User's choice:** Migration → Cleanup grep → Adapter retype (initial)
**Notes:** Superseded by the scope-reframe response below — with no migration, plan structure narrows to ~1 plan covering adapter retype only.

---

## Scope Reframe (added during discussion)

| Option | Description | Selected |
|--------|-------------|----------|
| Reframe Phase 66 as adapter-retype only | Drop DB-01 from v2.7. Phase 66 narrows to ADAPTER-01 only. ROADMAP + REQUIREMENTS need an update; DB-01 deferred or dropped. | ✓ |
| Defer DB-01 to a future phase | Keep DB-01 in REQUIREMENTS.md as 'deferred' (v2.8+ or backlog). Phase 66 still narrows to adapter-retype only. | |
| Wait — drop just `name` | Keep `entity_type`, drop `name`. Phase 66 = drop name + adapter retype, 2 plans, narrower migration. | |

**User's choice:** Reframe Phase 66 as adapter-retype only (Recommended)
**Notes:** Triggers ROADMAP, REQUIREMENTS, STATE updates. DB-01 → REQUIREMENTS.md "Future Requirements (deferred)". Phase 66 plan count drops from 3 to ~1. v2.7 total drops from 11 to ~9 plans.

---

## Migration Safety v2 (conditional, asked alongside reframe)

| Option | Description | Selected |
|--------|-------------|----------|
| N/A — picked option 1 or 2 above | Skip if neither column is being dropped. | |
| Pre-flight + abort-on-data (option 3) | Best safety. | |
| Log-and-continue (option 3) | Log row count + sample, drop anyway. | |
| Unconditional drop (option 3) | No pre-flight. | |
| **Other (free text):** "We don't drop it." | Confirms option 1 (full reframe — neither column dropped). | ✓ |

**User's choice:** "We don't drop it."
**Notes:** Confirms the full schema-stays-as-is decision.

---

## Claude's Discretion

- Exact name + shape of the intermediate type (`InternalFlatNomination` is a suggestion; planner picks)
- Whether `InternalFlatNomination` is a single type or a small type family
- Whether to add JSDoc to the new types pointing at v2.6 P64 reverse-fill rationale
- Whether to add a unit test scaffold for the typed reverse-fill

## Deferred Ideas

- DB-01 schema cleanup (drop `nominations.name` + `nominations.entity_type`) — moved to REQUIREMENTS.md "Future Requirements (deferred)"
- Wider `as unknown as` sweep across the frontend — todo is targeted at one file
- Restructuring `supabaseDataProvider.ts` mapping pipeline — explicit OoS per REQUIREMENTS.md
- Adding unit test scaffold for the typed reverse-fill — Playwright parity gate covers integration

## Reviewed Todos (not folded)

- `2026-04-28-cleanup-nominations-table.md` — reviewed; deferred per the scope reframe. Stays in `.planning/todos/pending/`.
