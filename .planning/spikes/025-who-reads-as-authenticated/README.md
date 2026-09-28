---
spike: 025
idea: grant-model-read-cost
name: who-reads-as-authenticated
type: standard
validates: "Given the frontend's Supabase clients, when a signed-in user (candidate or admin) loads the voter app, then we know whether their entity reads go through the authenticated policies"
verdict: VALIDATED
related: [026, 027]
tags: [rls, grant-model, performance, supabase-ssr, phase-162.1]
---

# Spike 025: Who Reads As `authenticated`?

## RESULT IN ONE PARAGRAPH

**Yes, the 4.47x authenticated cost is on a real voter-facing path.** The voter app builds its Supabase
client from the request's session cookies, so **any signed-in person who opens the voter app reads entities
and nominations through the `authenticated` policies**, not the `anon` ones. The people who hold sessions
are candidates (every candidate who logs in to answer, then previews how voters see them) and admins.
Anonymous voters, which is nearly all the traffic, stay on the `anon` path, which Phase 162 closed at
0.99x. So the residual is **real but reaches a small, specific population**. Whether it *matters* depends
on its cost at election scale, which is what Spike 026 measures.

## What This Validates

Given the voter app's client construction, when a signed-in user loads it, then PostgREST receives
`role: authenticated` and applies the four `authenticated_select_*` entity policies (with their three
`user_can` disjuncts) instead of the `anon_select_*` ones.

## How It Was Established — two independent lines of evidence

### 1. The code path (read)

| Load | Client it uses | Carries the session? |
|---|---|---|
| `routes/+layout.ts` (root universal load: app settings, elections, constituencies) | `createSupabaseUniversalClient({ fetch, cookies: data.supabaseCookies })` | **yes**, the cookies are the `sb-*-auth-token` cookies the server load forwards |
| `routes/(voters)/(located)/+layout.server.ts` | forwards every `SUPABASE_COOKIE_PREFIX` cookie to the universal load | **yes** |
| `routes/(voters)/nominations/+layout.ts` → `getNominationData` → `get_nominations` RPC | `supabaseClient` from `parent()`, i.e. the same one | **yes** |
| any client-side navigation in the browser | `createSupabaseBrowserClient()`, a tab-lifetime singleton over the same cookie storage | **yes** |

`get_nominations` is `SECURITY INVOKER` (`503-entity-rpcs.sql`), so RLS **is** applied inside it, on
`nominations` and on all four entity tables it LEFT JOINs. The voter's main data read therefore pays
whichever policy set matches the caller's role.

### 2. The runtime (observed)

`probe.mjs` reproduces production exactly: it signs a throwaway user in through `@supabase/ssr`'s
`createServerClient` with a cookie jar, then builds a **second** client from those cookies the same way
`universal.ts` does, and intercepts that client's `fetch` to decode the JWT `role` claim on each request.

```
$ node .planning/spikes/025-who-reads-as-authenticated/probe.mjs
cookies carried from sign-in: sb-127-auth-token
A. no cookies (anonymous voter): status=200 rows=1
   anon           /rest/v1/candidates
B. signed-in cookies (candidate/admin opening the voter app): status=200 rows=1
   authenticated  /rest/v1/candidates
cleanup: throwaway user deleted
```

## How to Run

```bash
eval "$(yarn workspace @openvaa/supabase exec supabase status -o env | grep -E '^(API_URL|ANON_KEY|SERVICE_ROLE_KEY)=')"
export API_URL ANON_KEY SERVICE_ROLE_KEY
node .planning/spikes/025-who-reads-as-authenticated/probe.mjs
```

Needs a running local Supabase (`yarn db:start`). It creates one throwaway auth user and deletes it at the end.

## Investigation Trail

1. The starting assumption was that "voter app = anon". The code read disproved it: the root layout
   deliberately forwards session cookies so that one client serves both apps.
2. The code read alone did not prove the header is sent (for example, `@supabase/ssr` could drop a
   malformed cookie). The runtime probe closes that gap: same library, same construction, the role
   observed on the wire.
3. `get_nominations` was checked for `SECURITY DEFINER`, which would have bypassed RLS and made the
   question moot. It is `SECURITY INVOKER`, so the policies apply.

## Who Pays the Cost

| Population | Role on voter-app reads | Cost path |
|---|---|---|
| Anonymous voters (almost all traffic) | `anon` | anon policies, **0.99x**, closed |
| Candidates previewing their public profile / results | `authenticated` | **4.47x path** |
| Project admins checking the published app | `authenticated` | **4.47x path** |

**Scale of that population:** at most the candidate count (≈30k in a municipal election). Their use is
bursty around the answering deadline, and they browse the same scoped pages voters do.

## Results

**VALIDATED.** The authenticated path is reachable from the voter app by every signed-in user. The
residual is not hypothetical. What is still open is **whether it costs enough to matter** (Spike 026).
**Verdict input for residual (a):** it cannot be dismissed as "no one reads as authenticated".
