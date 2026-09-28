---
title: The E2E harness derives its redirect origin from `SUPABASE_URL` and defaults to `localhost`, while `.env.example` documents `127.0.0.1` — a fresh `.env` copy now crosses origins
created: 2026-08-29
source_phase: 153-build-tooling-config-correctness
source_plan: 10
priority: medium
suggested_phase: future-e2e-hardening
keywords: [SUPABASE_URL, PUBLIC_SUPABASE_URL, localhost, 127.0.0.1, baseURL, storageState, supabaseAdminClient, playwright, redirectTo, env-pairs, cross-runtime]
---

# `SUPABASE_URL`: `localhost` in the harness, `127.0.0.1` in the template

## Origin

Phase 153 plan 10 added a cross-runtime env-pair register. `SUPABASE_URL` derives as a pair
(`Deno.env.get('SUPABASE_URL')` in the Edge Functions; `PUBLIC_SUPABASE_URL` in the frontend), and
the registry guard requires both members to be documented in `.env.example`. `SUPABASE_URL` was not
documented there at all, so plan 10 added it — **with the same value as its twin**, which is what
the pairing contract requires:

```
PUBLIC_SUPABASE_URL=http://127.0.0.1:54321
SUPABASE_URL=http://127.0.0.1:54321
```

That is correct for the pair. It is what surfaced a **third** consumer that the pair register
deliberately does not cover.

## The finding, measured

`tests/tests/utils/supabaseAdminClient.ts:55` reads the same variable from `process.env` and
defaults to a **different host spelling**:

```ts
const SUPABASE_URL = process.env.SUPABASE_URL ?? 'http://localhost:54321';
```

and then derives a **frontend** origin from it, twice, by port substitution:

- `tests/tests/utils/supabaseAdminClient.ts:518` — `const frontendUrl = SUPABASE_URL.replace('54321', '5173');`
  used as `redirectTo: ${frontendUrl}/en/candidate/auth/callback` for `inviteUserByEmail`.
- `tests/tests/utils/supabaseAdminClient.ts:558` — the same substitution for
  `resetPasswordForEmail`.

Meanwhile `tests/playwright.config.ts:251` fixes the suite's own origin to the other spelling:

```ts
baseURL: process.env.FRONTEND_PORT ? `http://localhost:${process.env.FRONTEND_PORT}` : 'http://localhost:5173'
```

`tests/scripts/tcp-forward.mjs:6` states the constraint explicitly: *"Both of the suite's endpoint
literals hardcode `localhost` … The candidate `storageState` cookie is minted for the origin
`localhost:<port>`."*

So: **today**, with `SUPABASE_URL` unset, the `??` default supplies `localhost` and both origins
agree. **After a fresh `cp .env.example .env`**, `SUPABASE_URL` is set to the `127.0.0.1` spelling,
the two invite/reset redirects become `http://127.0.0.1:5173/...` while `baseURL` and the minted
`storageState` cookie remain `http://localhost:5173` — a cross-origin mismatch in exactly the auth
flows that depend on the cookie.

## Not fixed here, and why

Out of scope for plan 10, which adds detection and documentation and changes no runtime behaviour.
Three things would each be a defensible fix and they are not the same decision:

1. Make the harness's fallback and `baseURL` derive from one place, so the spelling cannot diverge.
2. Stop deriving a **frontend** origin from a **backend** URL by port substitution at all — it is a
   coincidence that `54321` → `5173` produces a working origin, and it silently couples the two.
3. Change the documented spelling of the pair to `localhost` on both members. This is the smallest
   edit and the most suspect: it changes a pre-existing documented value (`PUBLIC_SUPABASE_URL`) to
   accommodate a harness default, rather than fixing the coupling.

**Which side is the outlier, measured.** `packages/dev-seed/src/cli/seed.ts:184` defaults the same
variable to `http://127.0.0.1:54321`, matching `.env.example`; `apps/supabase/supabase/config.toml`
and the Supabase CLI likewise speak `127.0.0.1`. The Playwright harness is the only consumer
defaulting to `localhost`, and it does so because its `storageState` cookie origin and its
`baseURL` are hardcoded to that spelling (`tests/scripts/tcp-forward.mjs:6`). That points at fix 1
or 2, not fix 3.

## Impact today

**None on the current tree.** `.env.example` is a template; the operator's real `.env` was not
touched, and the E2E baseline (150/150, zero skipped) is unaffected. This is a hazard for the next
person who copies the template — which is the only audience the template has.

## Not covered by either env-pair script

The Playwright harness is outside both scan roots
(`apps/supabase/supabase/functions`, `apps/frontend/src`), so it derives no pair and neither guard
looks at it. Recorded as blind spot 4 in
`.planning/phases/153-build-tooling-config-correctness/153-ENV-PAIRS.md` §4.
