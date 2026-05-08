# Svelte 5 / SSR / a11y warning sweep — surfaced during Phase 67 UAT

**Captured:** 2026-05-08 during Phase 67 UAT (initially as a `<slot />` follow-up; expanded
into a consolidated warning sweep after the user re-ran `yarn dev` and surfaced a fuller
backlog of vite-plugin-svelte console warnings).

**Source:** Phase 67 manual UI smoke + clean-protocol Playwright re-run (browser DevTools
+ vite-plugin-svelte HMR output).

## Why this is a sweep (not three independent todos)

The warnings below cluster into three Svelte-5 / SvelteKit categories that all recur
across the same set of files. Fixing them one-by-one would scatter the diff across many
PRs; consolidating them into one sweep matches the Phase 65 audit-pattern (one focused
phase per Svelte 5 hazard class). They are NOT blockers for Phase 67 close — Phase 67's
UAT (10/10 tests) passed end-to-end and the v2.6 parity gate held — but they ARE real
correctness/perf/a11y issues that should land before any further frontend feature work.

---

## Category A — Svelte 5 reactivity hazards (`state_referenced_locally`)

Reading a `$state`- / prop-backed value once at component init and binding the captured
value to a local variable. Subsequent updates do not propagate because the read happens
outside the tracking scope. Same hazard class as the v2.6 P61-03 context-destructuring
diagnosis (CLAUDE.md §"Context Destructuring Rule (Svelte 5)").

Confirmed sites:
- `apps/frontend/src/lib/components/expander/Expander.svelte:76:24` — `defaultExpanded`
- `apps/frontend/src/lib/components/entityFilters/enumerated/EnumeratedEntityFilter.svelte:48:17` — `filter`
- `apps/frontend/src/lib/components/entityFilters/enumerated/EnumeratedEntityFilter.svelte:48:36` — `targets`
- `apps/frontend/src/lib/components/entityFilters/enumerated/EnumeratedEntityFilter.svelte:65:2` — `filter`

**Fix pattern:** wrap the read in a closure (`$derived(() => …)`) or reference the value
through the source object (`obj.value` not destructured `value`) — same fix as the
voter/candidateContext destructuring rule.

**Sweep:** before scoping individual fixes, run
```
yarn workspace @openvaa/frontend dev 2>&1 | grep state_referenced_locally
```
to enumerate the full backlog. Likely surface area: filter components, expander/disclosure
patterns, any prop-driven reactive UI state.

Reference: https://svelte.dev/e/state_referenced_locally

---

## Category B — SvelteKit SSR fetch eagerness

Repeated warnings:

> `Avoid calling \`fetch\` eagerly during server-side rendering — put your \`fetch\` calls
> inside \`onMount\` or a \`load\` function instead`

Observed: ~12 occurrences during a single voter-app session — meaning multiple modules
are calling `fetch` at module-evaluation time rather than inside `load()` or `onMount()`.

**Why it matters:** module-time `fetch` calls during SSR run on every page render, are
not cached by SvelteKit's `load`-function caching, can leak credentials if the request
escapes the SSR proxy, and double-fire on hydration. They also show up as "ghost" network
requests in the SSR phase that hold response timing.

**Fix pattern:**
- For data the page needs, move into `+page.ts` / `+layout.ts` `load(...)` functions —
  SvelteKit then caches + de-duplicates correctly.
- For data only the browser needs, move into `onMount(...)` (client-only).
- For background/long-poll fetches, move into `onMount(...)` and gate via feature flags.

**Sweep:** likely candidates are the Supabase data adapter helpers
(`apps/frontend/src/lib/api/adapters/supabase/`) and any context that initializes data
during module load. Run:
```
yarn workspace @openvaa/frontend dev 2>&1 | grep -c "fetch.*eagerly"
```
and walk the call sites by reading the SSR-phase server logs for the actual file paths
(the warning aggregates by message but does not list per-occurrence file in the
plugin output — extract via the dev-server stack trace at the time each fires).

---

## Category C — Accessibility (`a11y_no_noninteractive_element_interactions`)

> `Non-interactive element <label> should not be assigned mouse or keyboard event listeners`

Confirmed sites:
- `apps/frontend/src/lib/components/input/Input.svelte:521:8` — `<label>` with click/key handlers

**Why it matters:** WCAG 2.1 AA — non-interactive elements with event handlers are
invisible to assistive tech; `<button>` or proper form controls should carry interactivity.

**Fix pattern:**
- If the `<label>` is decorating a real form control, ensure the control itself receives
  the events; the `<label>` only needs `for=` to the control's id and the native click
  forwarding handles the rest.
- If the label IS acting as a control (e.g., a custom toggle), promote to `<button>` or
  add `role="button"` + `tabindex="0"` + keyboard handler.

**Sweep:** since the codebase enforces WCAG 2.1 AA (CLAUDE.md §"Important Implementation
Notes"), check for the same pattern in other input/control components — `Checkbox`,
`Radio`, `Switch` analogs.

Reference: https://svelte.dev/e/a11y_no_noninteractive_element_interactions

---

## Original `<slot />` / `{@render ...}` finding (anchor)

`apps/frontend/src/routes/[[lang=locale]]/(voters)/(located)/results/+layout.svelte` triggers:

> `<slot />` or `{@render ...}` tag missing — inner content will not be rendered

**Repro note:** the warning may not always reproduce, but the concrete hanging view observed
during Phase 67 UAT was

```
http://localhost:5173/nominations?constituencyId=52f40a36-fecb-4649-a925-85e480a9f668
```

When investigating, start by hitting that URL directly (note: the `constituencyId` is
seed-specific — substitute a current local id from `psql … "select id from constituencies limit 1;"`
if the existing one is gone after a re-seed).

**Fix pattern:** in Svelte 5 runes mode, layouts must use `{@render children()}`
instead of legacy `<slot />`. Audit sibling `(voters)/+layout.svelte` and other route
segment layouts for the same omission.

---

## Suggested phase placement

Tag for v2.7 wrap-up or as a dedicated Svelte 5 / SSR / a11y hardening phase between
Phase 68 (Dev-Tooling Trio) and v2.7 close. If a v2.8 Svelte 5 migration cycle is planned,
fold into that scope. The sweep should:
1. Run all three grep enumerations (Category A, B, C) to scope the full backlog.
2. Land each category as its own plan inside the phase (parallelizable).
3. Add Playwright assertions where structurally possible (e.g., Category A: verify a
   reactive-update test fails on the `state_referenced_locally` site before the fix).

## Related

- Phase 65 (Svelte 5 Audit Sweeps) — covered `bind:` / `{#key}` only; did NOT enumerate
  `state_referenced_locally`, SSR `fetch` eagerness, or a11y warnings. This sweep is
  the natural follow-on.
- `.planning/milestones/v2.6-phases/61-voter-app-question-flow/61-03-DIAGNOSIS.md` —
  origin diagnosis for the destructure-captures-initial-value class of bugs.
- `.planning/todos/pending/2026-04-30-alliance-tab-rendering-and-sections-config.md` —
  separate sibling todo from same UAT (alliance card render path).
- `.planning/todos/pending/2026-05-08-expander-state-referenced-locally.md` — earlier
  single-file capture for the Expander warning; SUPERSEDED by this consolidated sweep
  (kept for history; can be deleted once this sweep is acknowledged).
- CLAUDE.md §"Context Destructuring Rule (Svelte 5)" — Category A's structural mitigation.
- CLAUDE.md §"Important Implementation Notes" — WCAG 2.1 AA requirement (Category C).
