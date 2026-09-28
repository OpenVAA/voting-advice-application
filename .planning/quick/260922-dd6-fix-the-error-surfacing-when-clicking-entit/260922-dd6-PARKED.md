# 260922-dd6 — PARKED

**Status:** planned, not executed. Parked by operator decision on 2026-09-22.
**Batch:** 260922-dd4. Item remains `pending` in `BATCH.json` — `--resume 260922-dd4` picks it up if unparked.

## The item

> Fix the error surfacing when clicking entities in Results: "Uncaught TypeError: Cannot read
> properties of undefined (reading 'startTime') at et.reportAllChanges" — stack is minified
> third-party and reads like web-vitals/PerformanceObserver. Identify the source and stop it
> throwing.

## Why it is parked rather than done

The static diagnosis was completed during planning and points away from this codebase. The
remaining step in the plan was a Playwright control probe, which by construction cannot reproduce
the symptom (Playwright Chromium carries no extensions and no DevTools — the two leading suspects).
The facts that would actually settle it can only come from the operator's own browser. Running the
probe would have produced evidence of absence that we already have, so it was not run.

## What was established (evidence, not conjecture)

Measured during planning on 2026-09-22:

1. **`reportAllChanges` appears zero times anywhere in the checkout.** Recursive grep over repo-root
   `node_modules/`, over `apps/frontend/node_modules/` following symlinks, and over
   `apps/ packages/ tests/`. Same result for `web-vitals`.
2. **No perf/analytics dependency exists.** `apps/frontend/package.json` declares none. `yarn.lock`
   (11810 lines) carries no `web-vitals`, `speed-insights`, `sentry`, `posthog`, `plausible` or
   `@vercel/analytics` entry. The only `@vercel/*` installed is `node_modules/@vercel/oidc`
   (transitive, server-side).
3. **The page injects no external script of its own.** `apps/frontend/src/app.html` has no
   `<script src>`; `vite.config.ts` loads only tailwind / paraglide / sveltekit /
   vite-plugin-restart.
4. **The one third-party script our code can inject is Umami** —
   `apps/frontend/src/lib/components/analytics/umami/UmamiAnalytics.svelte`, mounted from
   `routes/+layout.svelte` only when `appSettings.analytics?.platform` is truthy.
5. **That gate is closed on a normal local stack.** `staticSettings.ts` sets
   `analytics: { trackEvents: false }` with no `platform`; the `default` dev-seed template writes no
   `analytics` key. Only the E2E template `perm-analytics-tracking` arms it.
6. **The current Umami build is guarded.** Fetched 2026-09-22 (HTTP 200, 4810 bytes): it constructs
   `PerformanceObserver`s over navigation/paint/LCP/layout-shift/event, but has zero occurrences of
   the reported method name and guards every entry read in its fallback path. A *stale cached
   build* in the operator's browser is not excluded by this.

## Leading hypothesis

The thrower is injected by the browser — a Chrome extension, or DevTools' own live-metrics
instrumentation. Stated as a hypothesis; not confirmed.

## The one in-tree finding worth keeping

The app wraps **every** soft navigation in a View Transition: `routes/+layout.svelte` resolves
`onNavigate` inside `document.startViewTransition`, and `Tabs.svelte` does the same for the
entity-detail drawer — which is exactly the interaction that triggers the report. A View Transition
suspends rendering and produces no fresh paint entries across the swap, which is a plausible
*trigger* for an observer re-reading an empty entry buffer on each soft navigation.

This makes our code a possible trigger of a third-party bug, not its source. It is falsifiable
without touching code.

## To unpark: four facts only a human browser can supply

Next time the error appears, record:

1. The **top frame's scheme and host** in the stack (is it `chrome-extension://`, `devtools://`, or
   our own origin?).
2. Whether it survives with **all extensions disabled**.
3. Whether it survives with **DevTools closed** (open a fresh window, reproduce, then check).
4. Whether it survives under **`?notr=1`** — the in-tree View Transition escape hatch
   (`shouldAnimate()`, `apps/frontend/src/lib/utils/viewTransition.ts`). Reduced-motion at the OS
   level is the second arm of the same test.

If (2) or (3) makes it vanish, the item closes as "not ours" with no product change. If (4) makes it
vanish but (2)/(3) do not, the View Transition wrapper is implicated as the trigger and the item
becomes a real one. If none of them change anything, `<prior_evidence>` above is falsified and the
plan must be rebuilt from scratch.

## Related

- Plan: `260922-dd6-PLAN.md` (carries the full `<prior_evidence>` block and the three-branch verdict)
- No product file was edited. No file was added under `tests/`.
