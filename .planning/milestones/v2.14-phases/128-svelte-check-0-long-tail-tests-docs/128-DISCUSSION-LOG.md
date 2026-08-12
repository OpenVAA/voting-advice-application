# Phase 128: svelte-check → 0 — Long-Tail, Tests & Docs - Discussion Log

> **Audit trail only.** Do not use as input to planning, research, or execution agents.
> Decisions are captured in CONTEXT.md — this log preserves the alternatives considered.

**Date:** 2026-07-16
**Phase:** 128-svelte-check-0-long-tail-tests-docs
**Areas discussed:** serverClient type seam, Password-API mismatches, Test & spike scaffolding, A11y warnings → 0

---

## Area selection

All 4 offered gray areas were selected. Todo cross-reference offered 4 relevant todos for folding; user chose **"None — review only"** (keep 128 mechanical; investigations stay backlog).

---

## serverClient type seam (13 of 24 errors, one root cause)

| Option | Description | Selected |
|--------|-------------|----------|
| Concrete typing | Expose/consume the writer as SupabaseDataWriter where Supabase-specific config is passed; zero change to the universal layer; mirrors 127 D-01 honesty | ✓ |
| Generic config param | UniversalDataWriter generic over TConfig extends AdapterConfig; cleaner abstraction, bigger diff | |
| Widen base AdapterConfig | Add optional serverClient to universal AdapterConfig; leaks SupabaseClient into adapter-agnostic layer | |

**User's choice:** Concrete typing (recommended option)
**Notes:** Scout verified the runtime is already correct — `SupabaseAdapterConfig` declares `serverClient?` and the mixin `init()` consumes it; only the call-site static type lies.

---

## Password-API mismatches (5 errors)

| Option | Description | Selected |
|--------|-------------|----------|
| Type-truth only | Align types with runtime, flows untouched; declare confirmPasswordTestId as a real PasswordSetter prop; Strapi-era investigations stay backlog | ✓ (amended) |
| Prune provably-dead branches | Delete unreachable branches instead of typing them; risks scope creep into auth-flow redesign | |
| You decide | Claude picks per-error at plan time | |

**User's choice:** Type-truth only, **amended**: "But hardcode the confirmPasswordTestId into the PasswordSetter's confirmation input. There's no need to pass a separate test id for it. Check that it's reflected in the testIds catalogue."
**Notes:** Follow-up scout confirmed PasswordSetter already hardcodes `password-setter-confirmation`, the E2E fixture only uses the hardcoded ids, and the `settings-confirm-password` catalogue entry (testIds.ts:71) is dead → D-03: drop the dead prop pass, keep hardcoded ids, reconcile the catalogue.

---

## Test & spike scaffolding (_spikes-020 disposition)

| Option | Description | Selected |
|--------|-------------|----------|
| Delete the dir | Consistent with 017-019 deletion; findings preserved in .planning/spikes/ + skill; verify zero importers first | ✓ |
| Keep it | Error-free living reference; costs unit-suite time | |

**User's choice:** Delete the dir (recommended option)

---

## A11y warnings → 0 (Term.svelte + apps/docs)

| Option | Description | Selected |
|--------|-------------|----------|
| Fix at source, both | Real markup fixes; WCAG 2.1 AA project requirement; source-fix is convention-preferred | ✓ |
| Fix docs, accept Term.svelte | Accepted-comment for Term.svelte if tabindex is intentional | |
| Accept both with comments | Zero markup risk; weakest fit for the 0-warnings criterion | |

**User's choice:** Fix at source, both (recommended option)

---

## Claude's Discretion

- Exact mechanism for the concrete typing (export retype vs local narrowing vs typed accessor).
- Per-error fixes for the 6 scattered singles (viewTransition built-in types, EntityInfo comparison, string→number pair, FeedbackPopup 'idle', thenable mock).
- Commit granularity (per-cluster atomic, workstream convention).
- Fallout rule per 125 D-01 precedent.

## Deferred Ideas

- Strapi-era auth-flow investigations (password-reset code method; registrationKey register flow) — backlog.
- RPC RETURNS-TABLE nullability audit — backlog.
- View-transition flicker UI work — separate todo, behavior work, not this phase.
