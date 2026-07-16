# Phase 126: svelte-check → 0 — supabaseDataProvider - Discussion Log

> **Audit trail only.** Do not use as input to planning, research, or execution agents.
> Decisions are captured in CONTEXT.md — this log preserves the alternatives considered.

**Date:** 2026-07-16
**Phase:** 126-svelte-check-0-supabasedataprovider
**Areas discussed:** RPC typing mechanism, Residual casts & toDataObject seam, Acceptance gate & accounting (+ todo fold)

---

## Area selection

| Option | Description | Selected |
|--------|-------------|----------|
| RPC typing mechanism | Regenerate database.ts vs hand-written RPC row interface | ✓ |
| Residual casts & toDataObject seam | The 2 TS2352 casts + the `Record<string, unknown>` seam in shared utils/toDataObject.ts | ✓ |
| Acceptance gate & accounting | Carry forward Phase 125 D-04 convention or adjust | ✓ |

**User's choice:** All three areas.

## Todo fold

| Option | Description | Selected |
|--------|-------------|----------|
| Fold into 126 (Recommended) | One-line qs-shim deletion with verified-unchanged check output as acceptance | ✓ |
| Leave for 127/128 | Keep Phase 126 strictly single-file scoped | |

**User's choice:** Fold into 126.

---

## RPC typing mechanism

| Option | Description | Selected |
|--------|-------------|----------|
| Regenerate types (Recommended) | `yarn db:types` regenerates database.ts; root-cause fix collapsing ~76 of 79 errors | ✓ |
| Hand-written row type | Explicit RPC result-row interface in the adapter; duplicates schema by hand | |
| Regen + verify against schema | Regenerate plus explicit diff of the emitted Returns shape against 503-entity-rpcs.sql | |

**User's choice:** Regenerate types.
**Notes:** Schema-spot-check kept as a Claude-discretion recommendation.

| Option | Description | Selected |
|--------|-------------|----------|
| Commit full regen (Recommended) | Full regen output as its own atomic commit; net-new drift errors fixed in-phase (125 D-01 fallout precedent) | ✓ |
| Full regen, but drift errors block | Net-new errors in 127/128-cluster files stop the phase and surface the decision | |
| Minimal regen | Hand-trim the diff to only the get_nominations addition | |

**User's choice:** Commit full regen.

| Option | Description | Selected |
|--------|-------------|----------|
| Types only (Recommended) | Keep dedup/mapping logic byte-for-byte; only annotations + redundant-guard removal | |
| Light refactor allowed | Small structural cleanups (extract helpers, simplify guards) where the typed row makes the shape awkward; behavior-neutral | ✓ |

**User's choice:** Light refactor allowed.

---

## Residual casts & toDataObject seam

| Option | Description | Selected |
|--------|-------------|----------|
| Fix properly (Recommended) | Narrow to the correct variant type at construction; no cast needed | ✓ |
| Accepted-cast idiom | `as unknown as X // reason:` per the file's existing idiom | |
| Researcher decides per-cast | Judge each cast at research/plan time | |

**User's choice:** Fix properly (both TS2352s).

| Option | Description | Selected |
|--------|-------------|----------|
| Keep seam, defer to 127 (Recommended) | Leave toDataObject signature as-is; provider upcasts at the boundary | |
| Generify now | Generic row type in this phase; provider keeps type flow end-to-end; bigger blast radius | ✓ |

**User's choice:** Generify now.
**Notes:** Claude added the backward-compatibility constraint — Phase-127-scope call sites (supabaseDataWriter.ts) must keep compiling unchanged.

---

## Acceptance gate & accounting

| Option | Description | Selected |
|--------|-------------|----------|
| Carry forward D-04 (Recommended) | Build + unit + exact accounting (133 → ~54, no net-new) + one full E2E run as trust signal | ✓ |
| Adjust the gate | Modify something about the gate | |

**User's choice:** Carry forward D-04.

---

## Claude's Discretion

- Commit granularity beyond the regen-is-atomic rule (prefer per-cluster commits).
- Exact generic signature for toDataObject (with the backward-compat constraint).
- Where `_getNominationData` cleanup helpers live (in-file vs utils/).
- Whether/how to spot-check the regenerated Returns shape against 503-entity-rpcs.sql.

## Deferred Ideas

None raised — discussion stayed within phase scope. (Reviewed-but-not-folded todos are listed in CONTEXT.md.)
