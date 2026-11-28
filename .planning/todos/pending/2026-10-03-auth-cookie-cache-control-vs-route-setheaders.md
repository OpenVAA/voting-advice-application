---
title: "Responses that write auth cookies now carry `Cache-Control: private, no-cache, no-store…`; a route that sets its own cache-control on such a request will throw"
created: 2026-10-03
source_phase: 169-dependency-bump-to-latest-safe-versions
source_plan: 13
priority: low
suggested_phase: when a route first needs its own cache-control header
keywords: [supabase-ssr, cookies, cache-control, setHeaders, sveltekit, auth]
re_check_trigger: "any new `setHeaders({ 'cache-control': … })` call in apps/frontend"
---

# Duplicate `cache-control` header risk (169-07)

`@supabase/ssr` 0.12 asks the cookie adapter to forward cache headers whenever it writes auth cookies.
`createSupabaseCookieAdapter` (`apps/frontend/src/lib/supabase/server.ts`, `9075a027b`) forwards them through
`event.setHeaders`, once per name per request, so those responses carry
`Cache-Control: private, no-cache, no-store, must-revalidate, max-age=0` (intended: a response that sets a session
cookie must not be cached by a shared cache).

SvelteKit's `setHeaders` throws on a header set twice in one request. The adapter skips names it has already
forwarded, but it cannot know about a route's own call. So a route (or `+layout`) that calls
`setHeaders({ 'cache-control': … })` on a request that also refreshes a session will fail with SvelteKit's
duplicate-header error. No route does this today (2026-10-03).

**What to do when it comes up:** either have the route skip its own cache-control when the response sets cookies, or
route both through one helper that merges directives (the most restrictive wins). Add a server test for the
combination.
