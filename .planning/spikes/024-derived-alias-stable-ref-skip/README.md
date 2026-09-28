---
spike: 024
name: derived-alias-stable-ref-skip
type: standard
validates: "Given the four reactive-accessor shapes in the voter/candidate context, when data is provided AFTER mount (cold direct-URL entry), then ONLY the `const X = $derived(ctx.X)` intermediate-alias consumer over the identity-stable `#version`-backed dataRoot goes stale; reference-replaced / scalar / array-replaced accessors propagate through the alias normally."
verdict: VALIDATED
related: [002, 012, 017, 019, 022]
tags: [svelte5, runes, derived, referential-equality, dataroot, version-bridge, context, scope-classification, phase-113]
---

# Spike 024: `$derived`-alias-over-stable-ref downstream-skip

## What This Validates

Empirical validation of the debug session `.planning/debug/dataroot-stale-direct-nav.md`
root cause **and** its affected-vs-not scope map.

> **Given** the four reactive-accessor shapes exposed by the voter/candidate
> context, **when** data is provided into the context *after* the consumer
> mounts (modelling cold direct-URL entry to `/elections`), **then** only the
> `const X = $derived(ctx.X)` intermediate-alias consumer over the
> identity-stable, `#version`-backed `dataRoot` goes stale — every other
> accessor shape, and the direct-read consumer of `dataRoot`, updates.

## Root cause under test

`dataRoot` is an **identity-stable** object (a non-rune `DataRoot`) whose ONLY
reactive signal is a separate `#version` `$state` counter, bumped on each
`update()`. A consumer that writes:

```ts
const dataRoot = $derived(ctx.dataRoot);                 // intermediate alias
const elections = $derived.by(() => dataRoot.elections); // reads through alias
```

recomputes the alias on the version bump, but the alias yields the **same object
reference** every time. Per Svelte 5 push–pull semantics, *if a derived's new
value is referentially identical to its previous value, downstream updates are
skipped* — so `elections` never re-runs after the post-mount provide and keeps
showing the empty pre-mount snapshot. The operator's fix reads the accessor
**directly inside the consuming thunk**, which re-tracks `#version`:

```ts
const elections = $derived.by(() => ctx.dataRoot.elections); // re-tracks version → updates
```

`intro → Continue` masks the bug (data already present before the alias first
computes); direct-URL cold entry exposes it (data arrives after mount).

## Research / prior art (not re-proven here)

- **CONVENTIONS §9** — "`$derived.by` over per-field reads for reference-stable
  `$state` proxies": same mechanism (ref-stability short-circuits propagation),
  previously surfaced on the `$app/state.page` proxy.
- **Spike 002 / 017 / 022** — the dataRoot `#version` version-bridge: reactivity
  comes from the counter, the object ref is stable; the read/write split.
- **Spike 019** — the **destructure trap** is *orthogonal* to this defect (it
  captures an init-time value; this defect is a live downstream-skip on an alias
  that DOES recompute). Spike 024 confirms they are distinct failure modes.

This spike adds the missing piece: the **intermediate `$derived` alias** as a
distinct trigger, and the **crisp affected-vs-not classification** across all
four accessor shapes — which the prior spikes did not enumerate.

## How to Run

The artifacts use Svelte 5 runes + `mount()` + `flushSync()` and rely on the
frontend's vitest config (browser-condition resolution, svelte plugin, jsdom).
To re-run, drop the three files into the frontend source tree and invoke vitest:

```bash
mkdir -p apps/frontend/src/__spike024__
cp .planning/spikes/024-derived-alias-stable-ref-skip/{ctx.svelte.ts,Harness.svelte,spike024.svelte.test.ts} \
   apps/frontend/src/__spike024__/
cd apps/frontend && yarn vitest run src/__spike024__/spike024.svelte.test.ts
rm -rf apps/frontend/src/__spike024__   # throwaway — clean up after
```

(Artifacts live in the spike dir, not under `src/`, so the throwaway code does
not ship in the unit suite.)

## What to Expect

All 4 tests pass, proving the boundary:

| Case | Accessor shape (models)            | `const X = $derived(ctx.X)` alias | direct `ctx.X.prop` in thunk | Verdict |
|------|------------------------------------|-----------------------------------|------------------------------|---------|
| 1    | stable-ref + `#version` (dataRoot) | **STALE** (`''`)                  | **UPDATES** (`e1,e2`)        | **AFFECTED** |
| 2    | reference-replaced (appSettings)   | UPDATES (`LOADED`)                | UPDATES                      | not affected |
| 3    | scalar (locale)                    | UPDATES (`fi`)                    | UPDATES                      | not affected |
| 4    | array-replaced (selectedElections) | UPDATES (`s1,s2`)                 | UPDATES                      | not affected |

## Investigation Trail

1. Modelled all four accessor shapes in one `ctx.svelte.ts` factory, each with a
   `provide*()` mutator invoked **after mount** to simulate post-mount cold-entry
   population.
2. Built `Harness.svelte` rendering, per case, BOTH consumer shapes side by side
   (`case{n}-alias` via the intermediate `$derived` alias, `case{n}-direct` via a
   direct read inside `$derived.by`) — so the contrast is observed on the *same*
   reactive source within a single mount.
3. The contrast is the control: Case 1 alias and direct read the SAME accessor;
   only the alias goes stale → the cause is isolated to the alias indirection,
   not to data timing or tracking-scope presence (both reads are in tracking
   scopes). This rules out the "non-tracking-scope" hypothesis the debug session
   eliminated.
4. Cases 2–4 confirm the defect requires an identity-stable, mutated-in-place
   source: any accessor that replaces its value's reference (object/array) or is
   a scalar propagates through the alias unharmed.

## Results

**VALIDATED** — the debug session's root cause and scope map are correct and
reproducible (4/4 deterministic tests, ~18ms).

- The defect is **general but precisely bounded**: it fires for `const X =
  $derived(ctx.X)` **only when X is an identity-stable, mutated-in-place
  accessor** (the `#version`-bridge shape). `dataRoot` is the prime instance;
  `answers`/sub-store version-bridge handles of the same shape warrant the same
  audit.
- `appSettings` (reference-replaced) and `locale` (scalar) are **NOT** affected —
  CLAUDE.md's canonical `const X = $derived(ctx.X)` pattern remains correct for
  them.
- Value-replacing array accessors (`selectedElections`, `opinionQuestions`,
  `matches`) are **NOT** affected by *this* defect — though the separate,
  documented **destructure trap** (Spike 019) still applies to them.
- **Surprise / confirmation:** the failure is NOT a tracking-scope issue. Both
  consumers read inside `$derived.by` tracking scopes; the alias still goes stale.
  The discriminator is purely whether the source's value reference changes.

### Signal for the build (codemod scope)

Safe fix for `dataRoot` consumers: **read `ctx.dataRoot.<prop>` directly inside
the consuming tracking scope** — never alias `const dataRoot = $derived(ctx.dataRoot)`
and read through it. The broad codemod should target ONLY `$derived(ctx.dataRoot)`
(and same-shape version-bridge accessors), NOT all `$derived(ctx.X)` sites.
CLAUDE.md's "Context Destructuring Rule" should gain a carve-out documenting the
`dataRoot` alias-indirection hole. The full 14-site consumer map is in the debug
file's `Resolution.scope`; highest-confidence cold-entry repro targets:
`routes/(voters)/constituencies/+page.svelte:56-62` and `routes/(voters)/info/+page.svelte`.
