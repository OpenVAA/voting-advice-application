# Phase 102: Handle-Idiom Spike (HANDLE-01) - Context

**Gathered:** 2026-06-09 (batch discussion — `v2.12-DISCUSSION-POINTS.md`)
**Status:** Ready for planning

<domain>
## Phase Boundary

Classify the **40 `{ readonly current }` context handles** read-only vs read-write, choose **one canonical runes-native idiom per class**, and prove it on a representative slice — producing a **decision record + a working proof-of-concept** that **finalizes the exact per-handle transformation scope Phase 103's codemod will apply** (which handles change, which keep a handle shape).

**Depends on:** Nothing (first phase of the milestone). **GATES Phase 103.**
**Requirements:** HANDLE-01. **Parallel-eligible:** No — must complete before any handle codemod work.
</domain>

<decisions>
## Implementation Decisions

### Idiom targets
- **🔒 Read-only target (locked by HANDLE-02):** a plain reactive getter — consumers read `ctx.x`, **not** `ctx.x.current`.
- **D-01 (102-1 + cross-cutting R1):** Read-write handles get a **get/set accessor pair**, applied **at the context-property level** (`get x()` / `set x(v)` on the context object) so consumers read `ctx.x` and write `ctx.x = v`. The accessor pair is the *mechanism*; the **goal is to eliminate the nested `.current`, not retain it** (see D-02). Chosen over the explicit setter-method form (`x.set(v)`) for the smaller consumer-site delta.
- **D-02 (102-2 — ⚠️ DEVIATION from the recommended default):** **Max-native EVERYWHERE.** Drive `.current` to zero on **both** the read-only **and** the read-write classes — accept the larger write-site churn. (The recommended default was "max-native read-only / pragmatic read-write"; the user chose the more aggressive zero-`.current`-everywhere target.) Handles the spike finds genuinely *cannot* shed `.current` are **documented with rationale**, not forced (REQUIREMENTS Out-of-Scope) — but the default posture is removal.

### Proof-of-concept
- **D-03 (102-3):** PoC slice = **minimal-but-representative**: at least one **read-only** handle (e.g. `appContext.darkMode` / `locale`), one **read-write** handle (e.g. voter `answers`), **plus the special derived `getRoute` handle**. Must build green and preserve the CLAUDE.md destructure-trap contract.

### `getRoute` (special derived handle)
- **D-04 (102-4):** Treat `getRoute` (a `{ readonly current: RouteBuilder }` **derived** handle, spike 012, `$derived.by` per-field reads) as read-only and **fold it into the plain-getter idiom** (callable directly) — **unless** the spike finds the `$derived.by` shape genuinely needs the handle wrapper, in which case document it as a retained-handle exception.

### Output (gates Phase 103)
- The decision record must enumerate **all 40 handles** with a per-handle classification (read-only / read-write / retained-handle-exception) and the exact target shape — this **is** the Phase 103 codemod scope.

### Claude's Discretion
- Exact representative handles chosen for the PoC (beyond the one-RO + one-RW + getRoute floor).
- Decision-record file name/location under this phase dir.
</decisions>

<specifics>
## Specific Ideas
- This is the spike-first gate the user explicitly chose. Its output **finalizes** Phase 103's scope, so the per-handle table must be complete and unambiguous.
- The destructure-trap contract (CLAUDE.md "Context Destructuring Rule") is the hard invariant — whatever idiom is chosen, consumers must still read reactive accessors via `ctx.X` and never destructure them. Verify the PoC against the canonical pattern.
- **DX-5 gate:** the autonomous chain **pauses here** for human review of the decision record before Phase 103 begins.
</specifics>

<canonical_refs>
## Canonical References — MUST read before planning/implementing
- `Skill("spike-findings-voting-advice-application-gsd")` — esp. `reactive-contexts.md`, `persistent-rune-stores.md`, `consumer-migration-codemod.md`, `context-orchestration.md`.
- Spikes: `001`–`010`, `012-getroute-rune` (rune-handle mechanics + `$derived.by` Pattern 3).
- `CLAUDE.md` → "Context Destructuring Rule (Svelte 5)".
- `.planning/v2.12-DECISIONS.md` (R1 north star; K1 no-back-compat) + `v2.11-DECISIONS.md` K1.
- Handle inventory: grep `readonly current` across `apps/frontend/src/lib/contexts/**` (40 declarations; ~524 `.current` read sites).
</canonical_refs>
