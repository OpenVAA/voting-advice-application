# Phase 103: `.current` Handle Codemod (HANDLE-02 + HANDLE-03) - Context

**Gathered:** 2026-06-09 (batch discussion — `v2.12-DISCUSSION-POINTS.md`)
**Status:** Ready for planning (scope finalized by the Phase 102 decision record)

<domain>
## Phase Boundary

Conform every migratable context handle to the idiom chosen in Phase 102, and mechanically convert **all ~524 consumer `.current` read/write sites** via an **idempotent codemod** — build green at every commit boundary, destructure-trap contract intact.

**Depends on:** Phase 102 (the spike finalizes which handles change and to what shape — the codemod scope only exists once the decision record lands). **Must complete before Phase 104** (codemod-collision: both touch many of the same frontend files).
**Requirements:** HANDLE-02, HANDLE-03. **Parallel-eligible:** No. **UI hint: yes** (admin/auth-gated + voter-flow surfaces read these handles — verify visually + via E2E).
</domain>

<decisions>
## Implementation Decisions

### Idiom conformance (from Phase 102)
- **🔒 (HANDLE-02):** read-only handles expose a plain reactive getter (`ctx.x`); read-write handles expose the get/set accessor pair **at property level** (`ctx.x` read, `ctx.x = v` write — R1). Target = **zero `.current`** on both classes (102-2/D-02), except spike-documented retained-handle exceptions.
- The **exact per-handle transformation list is the Phase 102 decision record** — this phase does not re-decide it.

### Codemod execution + review
- **D-01 (103-1 + cross-cutting R2 — ⚠️ DEVIATION from the recommended default):** **Auto-apply the codemod and commit, gated by `typecheck` + `lint` + full E2E** — no pre-commit blocking human review. (The recommended default was "run → human-review the full diff → commit"; the user chose auto-apply + rely on gates.) The DX-5 "codemod diff review" is satisfied **post-apply**: the committed diff is reviewed at the per-phase PR (DX-3), and the chain surfaces the result before Phase 104. Run a **single E2E pass as cheap validation right after the codemod lands** (K3).
- **🔒 (HANDLE-03):** the codemod is **idempotent** (re-running it is a no-op) and the **build is green at every commit boundary** (no red intermediate). Any additive-getter / atomic-rewrite technique needed to keep the tree green mid-migration is allowed (mirrors the v2.11 97 atomic-commit handling).

### Commit shape
- **D-02 (103-2):** **One commit for the mechanical codemod rewrite** + **separate commits for each manual fix** the work surfaces. Clean revert boundary between mechanical and hand-edited changes.

### Codemod script lifecycle
- **D-03 (103-3):** **Archive the codemod script under `.planning/`** (single-use, kept for provenance) once the wave lands. Its ongoing-protection role is taken over by the Phase 105 widened ESLint guard (SWEEP-03).

### Plan split
- **D-04 (103-4):** **Two plans** — (a) conform the handle **declarations** to the chosen idiom, (b) codemod the **~524 consumer sites**. Separates the small risky surface-change from the large mechanical sweep; each independently green-able.

### Destructure-trap invariant
- **🔒:** consumers read reactive accessors via `ctx.X`, **never destructure** them — verifiable against the CLAUDE.md "Context Destructuring Rule" patterns; existing E2E stays green.

### Claude's Discretion
- Exact archive path under `.planning/` for the codemod script.
- Whether the additive-getter bridge technique is needed per handle to preserve green-at-every-commit (decided by the Phase 102 PoC findings).
</decisions>

<specifics>
## Specific Ideas
- Highest-blast-radius phase of the milestone (~524 sites + read-write writes now flow through property setters). Watch for any AdminNav-style destructure regression on auth-gated surfaces (the exact class of bug the v2.11 Phase 97 codemod surfaced).
- **UI hint:** verify auth state still drives nav rendering, and the voter question/results flow still reacts, after the write-surface change.
- **Single-E2E mid-chain validation (K3)** lands here — don't defer the first regression check to the GATE-01 close.
</specifics>

<canonical_refs>
## Canonical References — MUST read before planning/implementing
- The **Phase 102 decision record** (`.planning/phases/102-handle-idiom-spike/`) — the authoritative per-handle scope.
- `Skill("spike-findings-voting-advice-application-gsd")` — esp. `consumer-migration-codemod.md`.
- The v2.11 Phase 97 codemod precedent: `.planning/milestones/v2.11-phases/97-domain-a-wave-3-getroute-consumer-codemod/97-CONTEXT.md` (atomic-commit / additive-getter technique, idempotent dry-run-by-default).
- `CLAUDE.md` → "Context Destructuring Rule (Svelte 5)".
- `.planning/v2.12-DECISIONS.md` (R1, R2, K3).
</canonical_refs>
