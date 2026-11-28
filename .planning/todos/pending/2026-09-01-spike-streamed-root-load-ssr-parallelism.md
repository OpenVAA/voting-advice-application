---
title: Spike a streamed root load — can we get SSR parallelism AND single client construction?
priority: medium
source: Phase 157.2 wave 3 operator ruling (2026-09-01)
resolves_phase: null
timing: end of milestone v2.15
---

## Why this exists

Phase 157.2 moved every load to a per-request Supabase client. The chosen mechanism — children taking the
finished client from `await parent()` — is correct for isolation but **serialised every nested load behind
the root load's four Supabase round-trips**.

That surfaced as a deterministic WCAG 2.1 AA failure, not a performance nitpick: `routes/+layout.svelte`'s
`afterNavigate` focus reset fires once inside a single `requestAnimationFrame` with no retry, so on cold
entry to a question route the `<h1>` had not mounted yet and keyboard / screen-reader users were left on
`<body>`. E2E spec `a11y-smoke.spec.ts:300` (NAVA11Y-02) caught it; bisected to one file.

**The operator ruled option (a+)** — give each serialised nested load its own `+layout.server.ts` returning
the same filtered cookie array, so each builds its own client from its own `data` with no `parent()`. That
restores parallelism and fixes the latency at its cause. It costs the "reconstruction happens once rather
than six times" design property, which was a preference rather than a correctness requirement.

## What to spike

Option **(c)** from that decision, deferred rather than rejected: make the root `+layout.ts` return its four
datasets **as promises** so `parent()` resolves immediately. That would preserve single construction *and*
restore parallelism — strictly better than (a+) if it works.

It was not taken inline because it reverses that load's documented "await everything" decision, made for
Svelte-5 legacy hydration, and carried the highest blast radius of the three options at a moment when the
phase already had a failing suite.

**Questions the spike must answer:**

1. Does returning promises from the root universal load actually let `parent()` resolve before the data does,
   under SvelteKit 2.55.0 — verified by measurement, not by reading the docs?
2. What breaks in the Svelte-5 legacy-hydration path that the "await everything" decision was protecting?
   Find the original rationale before assuming it is stale.
3. Does streaming interact safely with the per-request client — i.e. can a streamed promise outlive the
   request scope that built its client, which is the exact class Phase 157.2 exists to close?
4. Would it let us delete the per-route `+layout.server.ts` files (a+) adds, or do those stay regardless?
5. Is the NAVA11Y-02 focus reset still fragile under streaming? A single un-retried `requestAnimationFrame`
   is thin regardless of which option wins — worth hardening independently.

## Also worth carrying

Whatever wins, **the un-retried focus reset is a latent fragility of its own**. It happened to be exposed by
this change; a different future latency shift would expose it again. Consider re-targeting focus when the
heading mounts as a standalone hardening, independent of the load architecture.
