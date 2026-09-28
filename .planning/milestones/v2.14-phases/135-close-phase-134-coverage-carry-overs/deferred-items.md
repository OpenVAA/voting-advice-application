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

---

## DEF-135-04 — Unreproduced single failure of the EPERM-07 term-trigger assertion

**Status:** RESOLVED 2026-08-14 by v2.15 Phase 138 — named root cause (a URL-committed-before-DOM-swapped ordering defect that the walk's navigation settle released into) + proven test-side fix; see `138-DIAGNOSIS.md` § Named root cause and `.planning/v2.14-CARDINAL-RULE-WAIVER.md` § Discharged. Everything below this line is the original 2026-08-11 record and is unchanged.
**Severity:** low (one occurrence in 8 voter-journey runs and 2 full-suite runs during Plan 02)
**Surfaced during:** Plan 02 Task 2, on the FIRST voter-journey run after a dev-server restart.

> **Plan 04 gate update (2026-08-11): did NOT recur.** The three consecutive full-suite gate runs
> each executed `voter-journey › full voter journey end-to-end` (test 3/134) and each passed —
> and each ran against a **freshly restarted dev server on a cold Vite cache** (`yarn dev` runs
> `dev:clean` first), i.e. under the exact condition the original — and disproved — cold-start
> hypothesis named. Cumulative tally is now **1 failure in 5 full-suite runs plus 8 voter-journey
> runs**. That is evidence the step is not reliably reproducible; it is **not** proof the defect is
> absent, and this item stays OPEN. A single unexplained observation does not become a non-issue by
> failing to recur — it becomes a lower-frequency unexplained observation.

### Observation

`voter-journey.spec.ts` step "EPERM-07 customData.terms" failed at:

```
Error: expect(locator).toBeVisible() failed
Locator: getByTestId('voter-questions-term-trigger').first()
Expected: visible
Timeout: 2000ms
Error: element(s) not found
```

The failure's own page snapshot, however, SHOWS the trigger present in the DOM at that moment:

```yaml
- heading "[qu-opin-base-3-likert7] Base opinion 3 — Likert 7." [level=1]:
    - text: "[qu-opin-base-3-likert7] Base opinion 3 —"
    - button "Likert":
        - generic: Likert
```

So the element does render; it simply had not satisfied the assertion inside the 2 s
`TIMEOUTS.element` budget. That is a latency signal, not an absence signal.

### Why it is NOT attributable to Plan 02

The failing step runs strictly UPSTREAM of every line Plan 02 changed (the first modified step is
"answer remaining base questions at polar-MAX", which follows it in the same serial test). A
sequential spec cannot be perturbed at step N by an edit at step N+k.

### Why no root cause is claimed

The initial hypothesis was cold-start Vite module compilation (the run was the first after a
dev-server restart). That hypothesis was TESTED and NOT confirmed: three subsequent runs, each
also the first after a dev-server restart (the two negative-control runs and the post-restore
run), all passed this step. Two full-suite runs also passed it. One observation with a disproved
hypothesis is not a diagnosis, so none is recorded here.

### Suggested follow-up

If it recurs, capture the trace and check whether the `<Term>` trigger's mount is racing the
heading's term-parsing pass. Note that this assertion is HARD while the heading assertion
immediately above it is `expect.soft` — so a mis-timed arrival on Base-3 surfaces here rather
than at the (softer) heading check that would have explained it. Making that heading assertion
hard would improve the diagnostic even if it does not change the failure rate.

---

## DEF-135-05 — Two concurrent turbo build graphs race on `packages/*/dist`, breaking `question-info#build`

**Status:** OPEN (developer-experience hazard; does not affect any gate command)
**Severity:** low (only reachable by forcing a rebuild while the dev watcher is mid-build)
**Surfaced during:** Plan 04 Task 1, on the first loaded `yarn test:unit` run.

### Observation

A `yarn test:unit --force` started ~20 s after `yarn dev` (dev server launched 14:13:02) failed —
not on a test, but on a build task:

```
Failed:    @openvaa/question-info#build
 ERROR  run failed: command  exited (2)
 Tasks:    12 successful, 16 total

@openvaa/question-info:build: ../llm/dist/index.js(23,30): error TS7006: Parameter 'provider' implicitly has an 'any' type.
@openvaa/question-info:build: ../llm/dist/index.js(27,52): error TS7053: Element implicitly has an 'any' type because expression of type 'any' can't be used to index type '{ openai: … }'.
   … 30+ further TS7006 / TS7031 / TS7053, all on ../llm/dist/index.js
```

### Root cause — established, not assumed

`yarn dev` runs `watch:shared` = `turbo watch build --filter=./packages/*`, whose **initial pass
rebuilds every package**. `yarn test:unit --force` starts a **second** turbo graph that also
rebuilds every package. Both write `packages/llm/dist`.

`packages/llm/package.json` declares `"types": "./dist/index.d.ts"` and
`"exports": {"import": "./dist/index.js"}`. `tsup` **cleans the output folder** before emitting, so
there is a window in which `index.js` exists and `index.d.ts` does not. A consumer typechecked in
that window resolves the JS instead of the declarations and reports implicit-`any` on every
exported symbol — which is exactly the error shape observed. `packages/llm/dist/index.d.ts` mtimes
tracked the concurrent rebuild (14:13 during the failure, rewritten again at 14:14).

Discriminating evidence:

| condition | result |
|---|---|
| `yarn test:unit --force`, watcher mid-initial-pass | **FAILS** at `question-info#build` |
| `yarn test:unit --force`, watcher idle (same session, 90 s later) | exit 0, 19/19 tasks |
| `yarn build --force`, no dev server at all | exit 0, 14/14 tasks |
| `yarn test:unit` (no `--force`), watcher running, 7 and 14 CPU burners | exit 0, 19/19 tasks |

### Why it does not affect any gate

`--force` is not part of any gate command, and it is what creates the second build graph. In
`turbo.json`, `test:unit` is `"cache": false` while `build` is cached — so a plain `yarn test:unit`
**re-runs every test but rebuilds nothing**, leaving no window to race. Both binding loaded runs
used the plain command and exited 0.

### Why deferred

Pre-existing monorepo-tooling behaviour, unrelated to anything Phase 135 changed, and outside every
plan's `files_modified`. It is a build-tooling ordering hazard, not a test or product defect.

### Suggested fix

Either emit declarations to a staging directory and swap atomically, or drop `clean: true` from the
package `tsup` configs so a stale `.d.ts` is overwritten rather than briefly removed. Cheapest
mitigation meanwhile: do not run a forced build while `yarn dev` is running — wait for the
watcher's initial pass to report `Build success` for every package first.
