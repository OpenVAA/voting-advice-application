# Phase 125: svelte-check → 0 — Trivial Tier - Discussion Log

> **Audit trail only.** Do not use as input to planning, research, or execution agents.
> Decisions are captured in CONTEXT.md — this log preserves the alternatives considered.

**Date:** 2026-07-15
**Phase:** 125-svelte-check-0-trivial-tier
**Areas discussed:** qs typing mechanism, cookies cluster direction, Spike deletion scope, Acceptance gate & baseline accounting

---

## qs typing mechanism

| Option | Description | Selected |
|--------|-------------|----------|
| @types/qs + fix fallout in-phase | Add @types/qs devDependency; real types; if new downstream errors surface in the 8 importing files, fix them within this phase | ✓ |
| @types/qs, shim fallback | Try @types/qs; revert to `declare module 'qs'` shim if fallout appears, defer to Phase 128 | |
| declare-module shim only | One-line ambient shim; zero fallout risk but qs stays `any` | |

**User's choice:** @types/qs + fix fallout in-phase (Recommended)
**Notes:** Ground truth: 8 × TS7016 confirmed by fresh svelte-check run; `qs@^6.15.0` direct dep, no types installed.

---

## cookies cluster direction

| Option | Description | Selected |
|--------|-------------|----------|
| Drop cookies from call sites | Remove dead `cookies` property from the 6 admin-jobs +server.ts calls; behavior-neutral | ✓ |
| Widen getUserData signature | Add optional `cookies?` accepted-and-ignored | |
| Thread cookies through | Make getUserData actually use cookies — auth-plumbing change, out of scope | |

**User's choice:** Drop cookies from call sites (Recommended)
**Notes:** `getUserData({ fetch, parent? })` never reads cookies; session flows via cookie-forwarding server fetch (comment at getUserData.ts:29).

---

## Spike deletion scope

| Option | Description | Selected |
|--------|-------------|----------|
| Delete whole _spikes-017-019 dir | All 4 files removed; findings preserved in .planning/spikes/ + skill; _spikes-020 untouched | ✓ |
| Delete only 018b file | Remove just the erroring file; dir left half-deleted | |
| Delete both spike dirs | Also remove _spikes-020-class-conversion — mild scope creep into Phase 128 | |

**User's choice:** Delete whole _spikes-017-019 dir (Recommended)
**Notes:** All 4 errors live in 018b-snapshot-mechanism.spike.svelte.test.ts; zero importers verified by grep.

---

## Acceptance gate & baseline accounting

| Option | Description | Selected |
|--------|-------------|----------|
| Full gate, exact accounting | build + unit + svelte-check (all 18 targeted gone, no net-new, final ≤ 133) + full E2E run | ✓ |
| Full gate, loose accounting | Same gates, success = "roughly 18 fewer" | |
| Skip E2E for this phase | Type-only argument; rejected — spike deletion and call-site edits touch runtime files | |

**User's choice:** Full gate, exact accounting (Recommended)
**Notes:** Baseline re-verified at exactly 151 errors / 1 warning during discussion (2026-07-15).

## Claude's Discretion

- Commit granularity (prefer one atomic commit per cluster).
- Typing of any D-01 fallout fixes, kept behavior-neutral.

## Deferred Ideas

None — discussion stayed within phase scope. Reviewed-but-not-folded todos recorded in CONTEXT.md.
