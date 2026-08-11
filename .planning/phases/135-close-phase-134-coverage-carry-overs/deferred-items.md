# Phase 135 — Deferred Items

Out-of-scope discoveries surfaced during Phase 135 execution. Per the executor SCOPE BOUNDARY
rule these were **logged, not fixed** — they are not caused by this phase's changes.

---

## DEF-135-01 — The `[data-theme='dark']` custom-variable block is dead CSS; `--line-color` is light-locked in dark

**Status:** OPEN
**Severity:** low (visual only — not a WCAG failure, not axe-detectable)
**Surfaced during:** Plan 01 Task 2, while probing whether the new dark scans measure a genuinely
dark DOM.

### Observation

`apps/frontend/src/app.css` declares its non-DaisyUI custom variables per theme via an attribute
selector:

```css
:root,
[data-theme='light'] {
  --line-color: #d9d9d9;
  ...
}
[data-theme='dark'] {
  --line-color: #262626;
  ...
}
```

`data-theme` is **never set on any element** — `grep -rn "data-theme" apps/frontend/src/` returns
only these two `app.css` declarations. Light works anyway because `:root` carries it. Dark does
not: the DaisyUI dark theme is applied through `prefersdark: true` (an
`@media (prefers-color-scheme: dark)` rule), which never adds a `data-theme` attribute, so
`[data-theme='dark']` matches nothing and the block is dead.

Measured in a confirmed-dark page (`prefersDark: true`, `--color-base-100: #000000`,
`--color-base-content: #cccccc`):

| variable | intended in dark | actually resolves to |
|---|---|---|
| `--line-color` | `#262626` | **`#d9d9d9`** (the light value) |
| `--progress-color` | `var(--color-neutral)` | `var(--color-neutral)` — identical in both blocks, so unaffected |
| `--progress-label-color` | `var(--color-neutral)` | identical in both blocks, so unaffected |

So `--line-color` is the only variable with a real light/dark difference, and dark never gets it:
dividers and rules that should be a near-black `#262626` render as a near-white `#d9d9d9` on the
`#000000` dark background.

### Why it is not a WCAG failure

`--line-color` is consumed only as a **border** colour, never as a text colour:

- `lib/components/electionSymbol/ElectionSymbol.svelte:27` — `border-color-[var(--line-color)]`
- `lib/dynamic-components/navigation/NavGroup.svelte:44` — `before:border-t-[var(--line-color)]`
- `lib/dynamic-components/entityDetails/EntityDetails.svelte:182` — `after:border-b-[var(--line-color)]`
- `lib/dynamic-components/entityDetails/EntityInfo.svelte:135` — `border-t-[var(--line-color)]`

`#d9d9d9` on `#000000` is ~15.9:1 — *higher* contrast than intended, not lower. axe's
`color-contrast` rule only evaluates text, so no scan flags it, correctly. The defect is that the
dividers are visually far louder in dark than the design specifies.

### Why deferred

Pre-existing and entirely unrelated to this plan's change: the same light-locked value is already
present on the `home` / `elections-selector` / `constituencies-selector-located` dark scans that
have been green since Phase 134. It is a design-token bug in `app.css`, not a coverage gap, and
`app.css` is outside this plan's `files_modified`.

### Suggested fix

Move the two custom-variable blocks into the same mechanism the rest of the theme uses — declare
the dark values inside `@media (prefers-color-scheme: dark)` (keeping the `[data-theme='dark']`
selector alongside it only if an explicit theme override is ever planned). Re-measure
`--line-color` in a dark page afterwards; it should read `#262626`.

---

## DEF-135-02 — Unhandled `cookies.set` rejection can kill the SvelteKit dev server mid-run

**Status:** OPEN
**Severity:** medium (developer-experience / E2E-reliability hazard, not a production path)
**Surfaced during:** Plan 01 Task 2, during a full-suite a11y run.

### Observation

The frontend dev server exited with code 1 partway through a run, taking the whole
`_dev:concurrent` process group with it and failing 16 of 18 tests as collateral:

```
Error: Cannot use `cookies.set(...)` after the response has been generated
    at event2.cookies.set (@sveltejs/kit/src/runtime/server/respond.js:551:15)
    at eval (apps/frontend/src/lib/supabase/server.ts:12:25)
    at Array.forEach (<anonymous>)
    at setAll (apps/frontend/src/lib/supabase/server.ts:11:22)
    at applyServerStorage (@supabase/ssr/dist/main/cookies.js:334:11)
    at async SupabaseAuthClient._notifyAllSubscribers (@supabase/auth-js/.../GoTrueClient.js:2196:13)
Node.js v24.14.1
```

`createSupabaseServerClient` (`apps/frontend/src/lib/supabase/server.ts:10-20`) hands
`@supabase/ssr` a `setAll` that calls `event.cookies.set(...)`. A background auth-token refresh
(`_notifyAllSubscribers`) can fire that callback **after** SvelteKit has already generated the
response, and SvelteKit throws. Because it surfaces as an unhandled promise rejection — fatal by
default on Node 24 — the dev server process dies rather than logging and continuing.

### Why deferred

Intermittent, pre-existing, and unrelated to this plan (the file is untouched here). It is an SSR
auth-lifecycle issue, not an a11y or theme issue. Fixing it means changing production auth-cookie
handling, which is a Rule-4 architectural call rather than an in-plan auto-fix.

### Suggested fix

Guard the `setAll` callback so a post-response write is a no-op instead of a throw — e.g. wrap the
`event.cookies.set` call in a try/catch that swallows only the "after the response has been
generated" case, matching the pattern `@supabase/ssr` documents for SvelteKit. Verify by running
the full E2E suite and confirming the dev server survives.

---

## DEF-135-03 — A stale Docker container from the sibling checkout squats port 5173

**Status:** OPEN (environment, not repository code)
**Severity:** high while present — it silently invalidates every local E2E measurement
**Surfaced during:** Plan 01 Task 2, diagnosing a 16-failure run.

### Observation

`voting-advice-application-frontend-1` (from the older Strapi-era `docker-compose` stack in the
sibling non-`-gsd` checkout) publishes `0.0.0.0:5173->5173/tcp` and restarts automatically with the
Docker daemon. When it wins the race for the port, `curl localhost:5173` still answers `200` — but
it is the **container's stale build** answering, not the repo's Vite dev server:

```
$ lsof -i:5173 | grep LISTEN
com.docke 2792 ... TCP *:5173 (LISTEN)      # container — WRONG
node     10551 ... TCP localhost:5173 (LISTEN)  # vite — correct
```

A run against the container produced 16 failures that had nothing to do with the code under test.
This matches the existing memory note that this repo's E2E must run via host Vite + local Supabase,
never Docker.

### Mitigation applied

`docker stop voting-advice-application-frontend-1` before the binding measurement. The container is
stopped, not removed — `docker start voting-advice-application-frontend-1` restores it.

### Suggested follow-up

An HTTP 200 on :5173 is not sufficient proof that the dev server is the repo's Vite. Any local E2E
runbook step should assert the listener is `node`, e.g.:

```bash
lsof -i:5173 | grep LISTEN | grep -q '^node' || { echo "5173 is not Vite — abort"; exit 1; }
```

Consider removing the obsolete Strapi-era compose stack from the sibling checkout entirely.
