# Pitfalls Research: Frontend Adapter Migration (Strapi to Supabase)

**Domain:** SvelteKit frontend adapter migration from Strapi REST API to Supabase (PostgREST + GoTrue + Edge Functions)
**Researched:** 2026-03-18
**Confidence:** HIGH (codebase analysis, official Supabase docs, verified community patterns)

---

## Critical Pitfalls

### Pitfall 1: Using getSession() Instead of getUser()/getClaims() for Server-Side Auth Checks

**What goes wrong:**
The existing `hooks.server.ts` already calls `supabase.auth.getSession()` then `supabase.auth.getUser()` in `safeGetSession()` -- this is correct. The danger is that new route load functions or API routes use `getSession()` alone for authorization decisions. The session data from `getSession()` comes directly from cookies without verification. A malicious client can craft a cookie with a spoofed user ID, role claims, or session data that `getSession()` will trust.

Supabase has introduced `getClaims()` (available in `@supabase/supabase-js` v2.95.0+) which validates the JWT signature locally using the project's public key -- faster than `getUser()` (no network round-trip) and more secure than `getSession()` (signature verification). However, `getClaims()` cannot detect server-side session revocation (logout from another device).

**Why it happens:**
- Strapi auth was simpler: a JWT `token` cookie was the entire auth state, and the backend validated it on each API call. Developers are used to trusting cookie contents.
- `getSession()` is faster and returns a familiar `session` object. It feels like the "right" call.
- The existing codebase has `safeGetSession` in hooks but new code paths may bypass it.
- The Supabase SSR docs historically recommended `getSession()` + `getUser()` before `getClaims()` existed, so older examples show the pre-`getClaims()` pattern.

**How to avoid:**
- Establish a rule: server-side code (load functions, API routes, hooks) MUST use `event.locals.safeGetSession()` or `getClaims()`, NEVER raw `getSession()` for authorization.
- Update the `safeGetSession` helper in `hooks.server.ts` to use `getClaims()` for the common case (role checking from JWT claims) and reserve `getUser()` for operations that need to verify the session is still active server-side (logout detection).
- The current `app.d.ts` already types `locals.safeGetSession` -- keep this as the single entry point.
- Add a linting rule or code review checklist item: "No direct calls to `supabase.auth.getSession()` outside of `hooks.server.ts`."

**Warning signs:**
- Any `.server.ts` file importing `supabase` and calling `.auth.getSession()` directly.
- Authorization logic that reads `session.user` without going through `safeGetSession`.
- Supabase console warnings: "Using supabase.auth.getSession() is potentially insecure."

**Phase to address:** Auth migration phase (first phase of adapter work) -- establish the auth pattern before any data adapter work begins.

---

### Pitfall 2: Dual Auth Token State During Migration (JWT Cookie + Supabase Session Cookie)

**What goes wrong:**
The current codebase maintains auth via a single `token` cookie containing a Strapi JWT (see `AUTH_TOKEN_KEY = 'token'` in `authToken.ts`). Supabase auth uses `sb-<project-ref>-auth-token` cookies managed by `@supabase/ssr`. During migration, both cookie types may exist simultaneously. The `hooks.server.ts` already checks for both (`token || event.cookies.getAll().some(c => c.name.startsWith('sb-'))`), but the downstream code paths diverge:

- The `candidate/+layout.server.ts` reads `cookies.get(AUTH_TOKEN_KEY)` and passes `token` in page data
- The `authContext.ts` derives `authToken` from `page.data.token`
- The `candidateContext.ts` passes `authToken` to every DataWriter call
- The `UniversalDataWriter.WithAuth` type expects `authToken: string`

Migrating to Supabase sessions means these flows must change fundamentally: from "pass a JWT string to every API call" to "the Supabase client carries the session via cookies automatically." If both auth mechanisms are partially wired, you get phantom auth states where the user appears logged in (cookie exists) but API calls fail (wrong auth mechanism), or vice versa.

**Why it happens:**
- The entire `DataWriter` interface is designed around explicit `authToken` passing (every write method takes `WithAuth` with `authToken: string`).
- A gradual migration tempts developers to keep the Strapi `token` cookie "for now" while adding Supabase session cookies.
- The `hooks.server.ts` OR logic (`token || sb-*`) makes both appear to work during development.

**How to avoid:**
- Clean break: the SupabaseDataWriter should NOT accept `authToken` as a parameter. Instead, it should use the Supabase client from `event.locals.supabase` (server-side) or the browser client singleton (client-side), which carry the session automatically.
- The `WithAuth` type in `dataWriter.type.ts` either needs to become optional/conditional on adapter type, or the Supabase adapter should ignore it and use the implicit session.
- Remove the `AUTH_TOKEN_KEY` cookie handling entirely when cutting over. Do not maintain a compatibility layer.
- The `candidate/+layout.server.ts` should pass session/user data from `event.locals.safeGetSession()` instead of a raw token.

**Warning signs:**
- Both `token` cookie and `sb-*` cookies present in browser dev tools.
- Login works but data writes fail (or vice versa).
- `page.data.token` is undefined but `page.data.session` exists (or vice versa).

**Phase to address:** Auth migration phase -- this is the single most impactful architectural change and must be completed before DataWriter implementation.

---

### Pitfall 3: RLS Returns Empty Results Instead of Errors -- Silent Data Loss

**What goes wrong:**
Strapi returns explicit HTTP errors (401, 403, 404) when queries fail due to authorization or missing data. PostgREST with RLS returns HTTP 200 with an empty array `[]` when RLS policies filter out all rows. The frontend receives a successful response with no data, and error handling code never triggers. Users see blank screens, empty lists, or "no results" states that appear intentional but are actually authorization failures.

This is particularly dangerous for OpenVAA because:
- The voter app shows elections, candidates, questions -- empty arrays mean "no election data exists" rather than "you don't have access"
- The candidate app shows "no nominations" instead of "your session expired"
- The admin app shows "no data to manage" instead of "your project_id is wrong"

**Why it happens:**
- PostgREST by design does not expose RLS failures. This is a security feature (prevents enumeration attacks) but creates terrible DX.
- The existing Strapi adapter code uses `.length === 0` as "no data" and throws only on HTTP errors. Reusing this pattern with PostgREST means RLS failures become silent.
- The `published = true` filter in anon RLS policies means development data (unpublished) is invisible to anon queries -- everything looks correct with admin auth but breaks without it.
- Supabase's error response format (`{ data: [], error: null }`) is indistinguishable from a legitimate empty result.

**How to avoid:**
- Add explicit "expected non-empty" assertions in the SupabaseDataProvider for queries that MUST return data (e.g., `getElectionData` with no filters should never return empty in a configured project).
- Implement a diagnostic mode that logs PostgREST response metadata alongside query results during development.
- For critical queries (elections, app_settings), treat empty results as errors: if `getElectionData()` returns `[]`, throw an error with debugging context (current auth state, project_id, published status).
- Test with both anon and authenticated clients during development. The voter app uses anon (no auth), so all voter-facing data must have `published = true`.
- Add a "data health check" endpoint or startup validation that verifies core data is accessible.

**Warning signs:**
- Voter app renders correctly in development but shows empty pages in production (published flag difference).
- Candidate app loads but shows "no nominations" after session expiry.
- E2E tests pass locally (service_role bypasses RLS) but fail in CI (anon/authenticated respects RLS).
- Zero-length arrays in API responses where data is expected.

**Phase to address:** DataProvider implementation phase -- build defensive empty-result handling into every query method from the start.

---

### Pitfall 4: Forgetting to Handle JSONB Localization Client-Side

**What goes wrong:**
Strapi returns pre-translated strings -- the Strapi adapter calls `translate()` and `translateObject()` to extract the locale-appropriate string from Strapi's localized fields. The Supabase schema stores all translatable fields as JSONB objects (`{"en": "Election", "fi": "Vaalit", "sv": "Val"}`). The `get_localized()` SQL function exists but is ONLY used server-side by email helpers (as documented in `000-functions.sql`). The API returns raw JSONB for all localized fields.

If the SupabaseDataProvider returns raw JSONB where the frontend expects strings, you get `[object Object]` rendered in the UI, TypeScript type errors (string vs Record), or crashes when calling `.length` or `.split()` on an object.

**Why it happens:**
- The Strapi adapter's `parseBasics()`, `parseCandidate()`, etc. do locale extraction inline. Developers may assume Supabase handles this differently.
- The `@openvaa/data` types expect string values for `name`, `info`, `shortName`, etc. But the database stores JSONB. The type gap is invisible until runtime.
- The column-map (`COLUMN_MAP`) handles snake_case -> camelCase but does NOT handle JSONB -> string extraction.
- A decision was already made (see `11-DECISION.md`) to do locale selection client-side, but this means EVERY localized field in EVERY query must be processed.

**How to avoid:**
- Create a `localizeRow<T>()` utility that takes a Supabase row and a locale, and extracts string values from all JSONB-localized columns. This replaces the Strapi `translate()` calls.
- Define which columns are JSONB-localized in a central constant (derived from the schema or COLUMN_MAP). Don't rely on developers remembering which fields need localization.
- The localization utility must implement the same fallback chain as `get_localized()`: requested locale -> project default locale -> first available key -> null.
- Write unit tests: given a row with `name: {"en": "Foo", "fi": "Bar"}` and locale `"fi"`, assert the result is `"Bar"`.
- Consider whether the SupabaseDataProvider should return localized strings (like Strapi does) or raw JSONB (letting the frontend handle it). The existing `DataProvider` return types expect strings, so the provider must localize.

**Warning signs:**
- `[object Object]` appearing in the UI.
- TypeScript errors about `string` vs `Json` or `Record<string, string>`.
- Translations working for the default locale but missing for other locales.
- `name` fields displaying as empty when the JSONB has no key for the requested locale.

**Phase to address:** DataProvider implementation phase -- the localization utility must be written BEFORE any query method, since every query uses localized fields.

---

### Pitfall 5: Missing project_id Scoping in Frontend Queries

**What goes wrong:**
The Supabase schema is multi-tenant with `project_id` on every content table. RLS policies enforce tenant isolation for admin users (`can_access_project(project_id)`). But for anon users (voter app), RLS only checks `published = true` -- it does NOT filter by project_id because anon users don't have project context in their JWT.

This means: if two projects share the same Supabase instance, the voter app sees published data from ALL projects. Elections from Project A and Project B appear together. Candidates from different projects get mixed in results.

For authenticated users (candidates), RLS allows reading their own record (`auth_user_id = auth.uid()`) plus all published data -- again across all projects.

**Why it happens:**
- Strapi was single-tenant per deployment. There was no project_id concept in the frontend.
- The RLS policies correctly enforce tenant isolation for admin operations but rely on the frontend to filter by project_id for voter/candidate reads.
- The `app_settings` table has `anon_select` with `USING (true)` -- all projects' settings are readable.
- Developers test with a single project and never encounter cross-project data leaks.

**How to avoid:**
- The SupabaseDataProvider MUST add `.eq('project_id', currentProjectId)` to EVERY query that reads content tables (elections, candidates, questions, nominations, constituencies, app_settings, etc.).
- Define `currentProjectId` as a configuration value (environment variable or app setting) that is set per deployment.
- Create a base query builder that automatically adds the project_id filter, so individual query methods cannot forget it.
- Write a pgTAP test or integration test that seeds two projects and verifies the frontend adapter only returns data for the configured project.
- Consider adding project_id filtering to anon RLS policies as a defense-in-depth measure, using a Supabase "request header" approach (`current_setting('request.headers')::json->>'x-project-id'`).

**Warning signs:**
- More elections/candidates appearing than expected during development.
- App settings from a different project being loaded.
- Data appearing that doesn't match the seed data for the active project.
- E2E tests passing in single-project setup but failing in shared environments.

**Phase to address:** DataProvider implementation phase -- establish the project_id scoping pattern in the base query builder before implementing any specific query.

---

### Pitfall 6: SSR Hydration Mismatch Between Server and Browser Supabase Clients

**What goes wrong:**
SvelteKit renders pages on the server using the server Supabase client (from `event.locals.supabase`), then hydrates on the client using the browser Supabase client (singleton from `createSupabaseBrowserClient()`). If the server renders with one auth state (e.g., authenticated session) and the client hydrates with a different state (e.g., expired session, or session not yet restored from cookies), the page content flickers or crashes.

Specific scenarios:
1. Server renders candidate page with full data (server client has valid session). Browser client starts without session, triggers re-render showing login redirect.
2. Server renders voter page as anon. Browser client has stale auth cookies, sends authenticated request that returns different data (admin sees unpublished data).
3. Session refresh happens during SSR -- server sets new cookie headers, but the browser client doesn't pick them up until the next navigation.

**Why it happens:**
- SvelteKit's `load` functions run on both server and client. The server uses `event.locals.supabase` (request-scoped), the client uses the browser singleton.
- The browser client's session state comes from `localStorage`/cookies AFTER the page has hydrated, creating a window where server and client states diverge.
- Token refresh happens asynchronously -- the server may use a refreshed token while the client still has the old one.
- The existing Strapi adapter avoids this because the JWT is a simple cookie read, not a stateful session.

**How to avoid:**
- Follow the Supabase SvelteKit SSR pattern exactly: pass session data from server load functions to the client via `data`, and initialize the browser client with the server-provided session.
- Use `depends('supabase:auth')` in load functions and `invalidate('supabase:auth')` on auth state changes to synchronize.
- In the root `+layout.ts`, pass `data.session` to the browser client initialization to prevent hydration mismatch.
- Add `filterSerializedResponseHeaders` in hooks to pass `content-range` and `x-supabase-api-version` (already done in hooks.server.ts).
- Test with slow network simulation to catch race conditions between SSR and client hydration.

**Warning signs:**
- Page content "flashes" on load (shows one state, then switches).
- Console warnings about hydration mismatch.
- Auth-protected pages briefly show content before redirecting to login.
- `onAuthStateChange` firing unexpectedly during initial page load.

**Phase to address:** Auth migration phase -- the hydration pattern must be correct before DataProvider/DataWriter work begins, since they depend on consistent auth state.

---

## Technical Debt Patterns

Shortcuts that seem reasonable but create long-term problems.

| Shortcut | Immediate Benefit | Long-term Cost | When Acceptable |
|----------|-------------------|----------------|-----------------|
| Keeping `WithAuth` / `authToken` parameter in SupabaseDataWriter | Interface compatibility with existing code | Every call site must extract and pass a token that the Supabase client doesn't need; the adapter fights the framework | Never -- Supabase's cookie-based session is automatic |
| Using `service_role` key in browser client for development | Bypasses RLS, everything "works" | Masks all RLS issues; deployed code fails silently | Never -- use anon key in browser, service_role only in Edge Functions |
| Dual adapter support (Strapi + Supabase simultaneously) | Gradual rollout | Doubled maintenance, two auth flows, confusing test matrix | Only during a bounded transition period (max 2 weeks) with a hard cutoff date |
| Hardcoding project_id in frontend | Quick single-tenant dev | Cannot deploy multi-tenant without code changes | Only if you accept single-tenant deployments permanently |
| Skipping localization in early DataProvider development | Faster iteration on query shape | JSONB fields leak to UI; fixing requires touching every query method | Never -- build localization into the first query |

## Integration Gotchas

Common mistakes when connecting to Supabase services from SvelteKit.

| Integration | Common Mistake | Correct Approach |
|-------------|----------------|------------------|
| PostgREST queries | Using `.select('*')` and getting all columns including internal ones (project_id, auth_user_id, is_generated) | Explicitly select needed columns: `.select('id, name, first_name, ...')`. Or use a view that hides internal columns. |
| Edge Function invocation | Calling `supabase.functions.invoke()` from the browser without CORS handling | Invoke Edge Functions from SvelteKit server routes (API routes or load functions), not directly from browser code. The server-side Supabase client avoids CORS entirely. |
| Edge Function auth | Passing the anon key as the function auth header | Edge Functions receive the caller's JWT automatically via `supabase.functions.invoke()`. For admin operations, the Edge Function uses `service_role` internally (already implemented in `invite-candidate`). |
| Storage file uploads | Using the browser client to upload directly to Storage | Route uploads through a SvelteKit API endpoint that uses the server client, ensuring proper auth and bucket policy enforcement. |
| Supabase Realtime | Subscribing to channels in `+page.svelte` `onMount` without cleanup | Not currently needed (Realtime is out of scope), but if added later: always `unsubscribe()` in `onDestroy`. |
| snake_case vs camelCase | Manually converting column names in each query | Use the existing `COLUMN_MAP` / `PROPERTY_MAP` from `@openvaa/supabase-types` and build a generic row transformer. |
| JSONB answer updates | Using `.update({ answers: newAnswers })` which replaces the entire JSONB | Use a PostgreSQL function or `jsonb_set()` for partial answer updates, or do read-modify-write with optimistic locking. The current JSONB answer trigger validates the merged result. |

## Performance Traps

Patterns that work at small scale but fail as usage grows.

| Trap | Symptoms | Prevention | When It Breaks |
|------|----------|------------|----------------|
| N+1 queries from PostgREST | Fetching nominations, then fetching each candidate separately | Use PostgREST's `select` with foreign table joins: `.select('*, candidates(*)')`. Single round-trip. | >50 candidates -- query count scales linearly |
| No query result caching | Every page navigation re-fetches all data from PostgREST | The existing `cachifyUrl` pattern in `UniversalAdapter` should be preserved. For Supabase, consider SvelteKit's `depends()`/`invalidate()` pattern for cache invalidation. | >100 concurrent voters -- PostgREST connection pool exhaustion |
| Fetching all locales when only one is needed | Returning full JSONB `{"en": "...", "fi": "...", "sv": "..."}` for every field | This is by design (client-side locale selection). The overhead is small for 2-4 locales but monitor payload sizes. Consider a PostgREST view that extracts a single locale if payloads exceed 500KB. | >10 locales or >500 questions (unlikely for VAA) |
| RLS policy evaluation on hot paths | Complex RLS policies re-evaluated on every row for every query | The schema already uses `(SELECT auth.jwt())` pattern for optimizer caching. Monitor via `pg_stat_statements` for slow queries. | >1000 concurrent users -- each query evaluates RLS per row |
| Loading all nomination data on voter app start | Single query fetches all candidates + organizations + nominations + images | Implement pagination or constituency-based filtering. The Strapi adapter already filters by constituency when available. | >10,000 candidates across all constituencies |

## Security Mistakes

Domain-specific security issues beyond general web security.

| Mistake | Risk | Prevention |
|---------|------|------------|
| Exposing `service_role` key in browser environment variables | Full database bypass -- attacker can read/write/delete all data | Only use `service_role` in Edge Functions and server-side code. Frontend uses `SUPABASE_ANON_KEY` only. The existing `server.ts` and `browser.ts` correctly use anon key. |
| Trusting `page.data.session.user` for authorization | Session user object comes from cookies, can be spoofed | Always verify via `safeGetSession()` (which calls `getUser()`) or `getClaims()` for server-side authorization. |
| Missing column-level restrictions in SupabaseDataWriter | Candidates could update `project_id`, `auth_user_id`, `published`, `organization_id` | Column-level REVOKE is already in place (`013-auth-rls.sql`). The DataWriter should not even attempt to set protected columns. Add a whitelist of updatable columns in the adapter. |
| Not validating Edge Function input on the server side | Injection via malformed projectId, email, or nomination data | The existing Edge Functions validate inputs (see `invite-candidate`). All new Edge Function integrations must validate before acting. |
| Frontend bypassing RLS by constructing PostgREST URLs directly | Could access unpublished or cross-project data if URL is manipulated | Never expose raw PostgREST URLs to the browser. All queries go through the Supabase client library which uses the user's session. |
| Caching responses that contain session tokens | Another user receives cached response with different user's session | The `filterSerializedResponseHeaders` in hooks.server.ts already handles this. Also ensure CDN/reverse proxy does not cache Set-Cookie responses. |

## UX Pitfalls

Common user experience mistakes in this domain.

| Pitfall | User Impact | Better Approach |
|---------|-------------|-----------------|
| Session expires silently during questionnaire | Candidate loses unsaved answers when session expires mid-edit | Implement session refresh monitoring. Warn user before expiry. Auto-save answers to localStorage as backup. |
| Login redirect loses context | Candidate is on question page, session expires, redirected to login, after re-login lands on home instead of question page | Preserve `redirectTo` parameter (already implemented in hooks.server.ts). Ensure the Supabase auth flow maintains the redirect chain. |
| Registration flow confusion during auth migration | Candidates who were invited via Strapi see different UI than Supabase-invited candidates | Ensure the invite-candidate Edge Function's `redirectTo` URL matches the SvelteKit route for registration completion. |
| Loading states during PostgREST queries | Voter sees empty page while data loads, assumes app is broken | The existing data loading pattern catches errors. Ensure Supabase queries have similar loading/error states via `{#await}` blocks. |

## "Looks Done But Isn't" Checklist

Things that appear complete but are missing critical pieces.

- [ ] **DataProvider reads work:** Often missing project_id filter -- verify by seeding two projects and checking isolation
- [ ] **Auth login works:** Often missing session persistence across page navigations -- verify by logging in, navigating to 3+ pages, and checking session survives
- [ ] **Candidate answer save works:** Often missing JSONB merge logic -- verify partial answer update preserves existing answers for other questions
- [ ] **Voter app works without auth:** Often missing anon query path -- verify voter app loads with no cookies at all (incognito window)
- [ ] **Edge Function integration works:** Often missing CORS for browser-initiated calls -- verify from actual browser, not just curl/Postman
- [ ] **E2E tests pass:** Often missing test data seeding via Supabase (instead of Strapi Admin Tools) -- verify data.setup.ts uses Supabase service_role client
- [ ] **Logout works completely:** Often missing cookie cleanup -- verify ALL `sb-*` cookies are removed AND the old `token` cookie is removed
- [ ] **Password reset works:** Often missing Supabase email template configuration -- verify password reset email actually sends and contains correct URL
- [ ] **Published/unpublished separation works:** Often missing `published = true` filter in provider queries or seed data missing `published` flag -- verify unpublished data is invisible to voters

## Recovery Strategies

When pitfalls occur despite prevention, how to recover.

| Pitfall | Recovery Cost | Recovery Steps |
|---------|---------------|----------------|
| getSession() used for auth decisions | MEDIUM | Audit all .server.ts files for raw getSession() calls. Replace with safeGetSession() or getClaims(). Add lint rule. |
| Dual auth token state causing phantom logins | HIGH | Full auth flow audit. Remove all AUTH_TOKEN_KEY references. Ensure every auth check uses Supabase session exclusively. May require re-deploying and asking active users to re-login. |
| Silent empty results from RLS | MEDIUM | Add defensive assertions to DataProvider. Create a diagnostic page that shows raw query results with auth context. Check published flags in seed data. |
| Missing JSONB localization | LOW | Create localizeRow() utility, apply to all existing queries. Unit test with all supported locales. |
| Missing project_id scoping | HIGH | Audit every query in SupabaseDataProvider. Add base query builder with automatic scoping. If data has leaked cross-project, investigate impact. |
| SSR hydration mismatch | MEDIUM | Follow Supabase SvelteKit SSR guide exactly. Pass session from server to client in layout. Add depends()/invalidate() pattern. |
| E2E tests broken after Strapi removal | HIGH | Replace StrapiAdminClient with a SupabaseAdminClient using service_role. Rewrite data.setup.ts to seed via Supabase. Update auth.setup.ts to use Supabase login flow. |

## Pitfall-to-Phase Mapping

How roadmap phases should address these pitfalls.

| Pitfall | Prevention Phase | Verification |
|---------|------------------|--------------|
| getSession() misuse | Auth migration | Grep for `.auth.getSession()` outside hooks.server.ts. Should find zero results. |
| Dual auth token state | Auth migration | Browser dev tools show ONLY `sb-*` cookies, no `token` cookie. All AUTH_TOKEN_KEY references removed. |
| Silent RLS empty results | DataProvider implementation | Unit tests with anon client against unpublished data verify errors thrown, not empty arrays. |
| Missing JSONB localization | DataProvider implementation | Unit test: query returns `string` type for name/info fields, not `object`. |
| Missing project_id scoping | DataProvider implementation | Integration test: two projects seeded, provider returns data for configured project only. |
| SSR hydration mismatch | Auth migration | Playwright test: no "hydration mismatch" console warnings on any page load. |
| E2E test breakage | E2E migration | Full Playwright suite passes with Supabase backend (no Strapi running). |
| Edge Function CORS | Edge Function integration | Browser-initiated Edge Function calls succeed without CORS errors in console. Or: all Edge Function calls routed through SvelteKit server routes. |
| Candidate answer data loss | DataWriter implementation | Test: save answer to Q1, save answer to Q2, verify Q1 answer still present. |
| Password reset email | Auth migration | E2E test: trigger password reset, verify email is received (or mock verified), verify reset link works. |

## Sources

- [Setting up Server-Side Auth for SvelteKit - Supabase Docs](https://supabase.com/docs/guides/auth/server-side/sveltekit) -- Official SSR auth setup guide
- [Creating a Supabase client for SSR - Supabase Docs](https://supabase.com/docs/guides/auth/server-side/creating-a-client) -- Server vs browser client patterns
- [Migrating to the SSR package from Auth Helpers - Supabase Docs](https://supabase.com/docs/guides/auth/auth-helpers/sveltekit) -- Migration from deprecated Auth Helpers
- [getClaims() API Reference - Supabase Docs](https://supabase.com/docs/reference/javascript/auth-getclaims) -- New JWT verification method
- [Security issue: getSession vs getUser - GitHub #898](https://github.com/supabase/auth-js/issues/898) -- Security vulnerability discussion
- [Clarify getClaims vs getUser vs getSession - GitHub #40985](https://github.com/supabase/supabase/issues/40985) -- Official guidance on method selection
- [Why select returns empty array - Supabase Troubleshooting](https://supabase.com/docs/guides/troubleshooting/why-is-my-select-returning-an-empty-data-array-and-i-have-data-in-the-table-xvOPgx) -- RLS silent failure documentation
- [RLS Performance Best Practices - Supabase Docs](https://supabase.com/docs/guides/troubleshooting/rls-performance-and-best-practices-Z5Jjwv) -- RLS query optimization
- [CORS for Edge Functions - Supabase Docs](https://supabase.com/docs/guides/functions/cors) -- Edge Function CORS handling
- [Securing Edge Functions - Supabase Docs](https://supabase.com/docs/guides/functions/auth) -- Auth in Edge Functions
- [Perfect Local SvelteKit Supabase Setup - DEV Community](https://dev.to/jdgamble555/perfect-local-sveltekit-supabase-setup-in-2025-4adp) -- Local development patterns
- Codebase analysis: `hooks.server.ts`, `authToken.ts`, `dataWriter.type.ts`, `strapiDataWriter.ts`, `strapiDataProvider.ts`, `010-rls.sql`, `012-auth-hooks.sql`, `013-auth-rls.sql`, `000-functions.sql`, `column-map.ts`, `invite-candidate/index.ts`, `data.setup.ts`, `auth.setup.ts`

---
*Pitfalls research for: Frontend adapter migration (Strapi to Supabase) in OpenVAA*
*Researched: 2026-03-18*
