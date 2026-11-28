---
created: 2026-08-24T10:20:00.000Z
title: Cold direct navigation to /results crashes the dev server
area: frontend
priority: high
files:
  - apps/frontend/src/lib/supabase/server.ts
  - apps/frontend/src/hooks.server.ts
---

## Problem

Navigating **directly** to `http://localhost:5173/results` in a browser with no prior
session kills the Vite dev server outright with an uncaught promise rejection:

```
Error: Cannot use `cookies.set(...)` after the response has been generated
    at event2.cookies.set (@sveltejs/kit/src/runtime/server/respond.js:551:15)
    at eval (apps/frontend/src/lib/supabase/server.ts:12:25)
    at Array.forEach (<anonymous>)
    at setAll (apps/frontend/src/lib/supabase/server.ts:11:22)
    at applyServerStorage (@supabase/ssr/dist/main/cookies.js:334:11)
    at async Object.callback (@supabase/ssr/dist/main/createServerClient.js:59:13)
    at async GoTrueClient.js:2190:21
    at async SupabaseAuthClient._notifyAllSubscribers (GoTrueClient.js:2196:13)
node:internal/process/promises:394
    triggerUncaughtException(err, true /* fromPromise */);
```

The process exits — this is not a logged warning, it takes the whole dev server down.

## Reproduction (measured 2026-08-24, HEAD `e74ae377e`)

1. `yarn db:reset-with-data`
2. `cd apps/frontend && yarn dev` (fresh server, no prior requests)
3. In a browser with **no** cookies for `localhost:5173`, navigate straight to
   `http://localhost:5173/results`
4. The page shows a browser error page; the dev server process has exited

Navigating to `/` first and clicking through (`/` → `/intro` → `/constituencies` →
`/questions` → `/results?electionId=…&constituencyId=…`) does **not** crash — the
session cookie is established on the earlier requests, so `setAll` is never called
after the response has been generated.

## Mechanism (hypothesis — NOT yet confirmed)

`createSupabaseServerClient` (`apps/frontend/src/lib/supabase/server.ts:10-20`) hands
`@supabase/ssr` a `setAll` that calls `event.cookies.set(...)` unconditionally.
`GoTrueClient._notifyAllSubscribers` fires that callback **asynchronously**, so on a
route where the auth refresh resolves after the response has been flushed, SvelteKit
throws — and because the call originates inside an unawaited `Promise.all` in auth-js,
nothing catches it.

Suspected fix shape: guard `setAll` so it no-ops once the response is sent (or wrap the
`event.cookies.set` call in a try/catch that logs), rather than letting an async auth
refresh take the process down. **Not verified** — treat as a starting point, not a
diagnosis. Per `feedback_flag_unverified_root_cause`, re-test in isolation before acting.

## Why it is filed rather than fixed

Surfaced during Phase 145's discussion (`145-DISCUSSION-POINTS.md` M-14 / D-07) while
verifying the default seed template in the running app. It has no connection to seed
data — it reproduces on any cold session-less hit to a `(voters)/(located)` route — and
Phase 145's boundary is `packages/dev-seed`. Fixing an `apps/frontend` server-lifecycle
bug there would widen the phase past what its plans can verify.

Worth noting this is a first-run developer-experience defect on the same path Phase 145
exists to repair, so the two are worth mentioning together in any DX write-up.

## Carried forward — this is the standing filing of record (D-07)

Phase 145 closed **without** fixing this, deliberately, and this todo is what carries it
rather than letting it be forgotten. Confirmed at that phase's close (2026-08-24, HEAD
`8372d0dff`):

- **Still unfixed.** Nothing in Phase 145 touched `apps/frontend`; the phase's whole
  product diff is inside `packages/dev-seed`.
- **It did not affect the phase's own measurements.** Every app-level observation in
  Phase 145 was taken through the **warm** voter journey (`/` → intro → constituencies →
  questions → results), where the session cookie is established on the earlier requests
  and `setAll` is therefore never called after the response has been generated. The cold
  path this todo describes was never on the measured route.
- **It did not affect the cardinal E2E gate.** `yarn test:e2e` at that HEAD ran **135
  passed · 0 failed · 0 flaky · 0 skipped · 0 did-not-run** against a fresh dev server
  that stayed up for the whole 11.5-minute run — the suite's fixtures walk the warm path
  too, so nothing in the gate exercises the crash.
- **Named as residue** in
  `.planning/phases/145-default-seed-template-repair/145-NEGATIVE-CONTROL-LEDGER.md`
  § Residue, so the ledger's account of what the phase left behind points here by
  filename.

**Belongs to:** an `apps/frontend` server-lifecycle / hooks phase. The hypothesis in
§ Mechanism above is still **unconfirmed** and must be re-tested in isolation before any
fix is designed on top of it.
