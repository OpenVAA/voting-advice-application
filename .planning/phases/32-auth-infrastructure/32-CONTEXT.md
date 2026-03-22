# Phase 32: Auth Infrastructure - Context

**Gathered:** 2026-03-22
**Status:** Ready for planning

<domain>
## Phase Boundary

Set up Supabase cookie-based sessions with PKCE, server hooks, client libraries, and API routes — all adapted to Svelte 5 and the current Paraglide i18n setup. Strapi auth references remain untouched (removal is Phase 38).

</domain>

<decisions>
## Implementation Decisions

### Supabase client setup (AUTH-04)
- **D-01:** Create `apps/frontend/src/lib/supabase/browser.ts` — singleton browser client using `@supabase/ssr` `createBrowserClient<Database>`
- **D-02:** Create `apps/frontend/src/lib/supabase/server.ts` — per-request server client using `@supabase/ssr` `createServerClient<Database>` with cookie handlers
- **D-03:** Both clients typed with `Database` from `@openvaa/supabase-types`

### Hooks integration (AUTH-01, AUTH-02)
- **D-04:** Keep the current Paraglide middleware hook chain intact — do NOT replace with sveltekit-i18n patterns from parallel branch
- **D-05:** Add Supabase session handling as another handler in SvelteKit's `sequence()` — runs before Paraglide middleware so `event.locals.supabase` is available to all subsequent handlers
- **D-06:** Supabase hook creates server client, attaches `supabase` and `safeGetSession()` to `event.locals`
- **D-07:** `safeGetSession` pattern: call `getSession()` then verify with `getUser()` — return null on error

### App.Locals type (AUTH-02)
- **D-08:** Add `supabase: SupabaseClient<Database>` and `safeGetSession()` to `App.Locals` in `app.d.ts`
- **D-09:** Keep existing `currentLocale` and `preferredLocale` fields (used by Paraglide)
- **D-10:** Leave existing `token?: string` in PageData for now — Strapi auth cleanup is Phase 38

### Auth API routes (AUTH-05)
- **D-11:** Create `apps/frontend/src/routes/[[lang=locale]]/candidate/auth/callback/+server.ts` — PKCE token exchange handling recovery, invite, email, signup flows
- **D-12:** Create `apps/frontend/src/routes/[[lang=locale]]/candidate/auth/logout/+server.ts` — server-side signOut to clear httpOnly cookies

### Strapi auth coexistence
- **D-13:** Do NOT remove Strapi auth references (`AUTH_TOKEN_KEY`, `candidateAuthHandle`) in this phase
- **D-14:** Both auth systems coexist until Phase 38 performs thorough Strapi removal
- **D-15:** Phase 38 must do thorough cleanup of all Strapi auth: `AUTH_TOKEN_KEY`, cookie-based JWT checks, `token` in PageData, Strapi adapter auth utilities

### Claude's Discretion
- Whether to use `@supabase/ssr` from Yarn catalog or workspace dep (catalog preferred per D-07 in Phase 30)
- Exact ordering of handlers in `sequence()` (supabase → paraglide → candidateAuth is likely)
- Error handling in auth callback route

</decisions>

<specifics>
## Specific Ideas

- Parallel branch hooks.server.ts is a good reference but uses sveltekit-i18n — we adapt the Supabase parts only
- `safeGetSession` is critical — never trust `getSession()` alone (can be spoofed from cookies)
- Auth callback handles 4 flow types: recovery, invite, email, signup — each redirects differently

</specifics>

<canonical_refs>
## Canonical References

### Parallel branch auth implementation
- `git show feat-gsd-supabase-migration:frontend/src/lib/supabase/browser.ts` — Browser client singleton
- `git show feat-gsd-supabase-migration:frontend/src/lib/supabase/server.ts` — Server client with cookie handlers
- `git show feat-gsd-supabase-migration:frontend/src/hooks.server.ts` — Supabase session handling in hooks
- `git show feat-gsd-supabase-migration:frontend/src/app.d.ts` — App.Locals with supabase + safeGetSession

### Auth routes (parallel branch)
- `git show "feat-gsd-supabase-migration:frontend/src/routes/[[lang=locale]]/candidate/auth/callback/+server.ts"` — PKCE callback with flow-specific redirects
- `git show "feat-gsd-supabase-migration:frontend/src/routes/[[lang=locale]]/candidate/auth/logout/+server.ts"` — Server-side signOut

### Current branch targets
- `apps/frontend/src/hooks.server.ts` — Current Paraglide + Strapi auth hooks (to add Supabase handler)
- `apps/frontend/src/app.d.ts` — Current App.Locals (to extend with Supabase types)

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- Paraglide middleware hook chain (`paraglideHandle`) — preserved, Supabase added via `sequence()`
- `candidateAuthHandle` — currently checks Strapi JWT cookie, will coexist until Phase 38

### Established Patterns
- SvelteKit `sequence()` for composing multiple Handle functions
- `event.locals` for per-request server-side state
- `$env/static/public` for environment variables (PUBLIC_SUPABASE_URL, PUBLIC_SUPABASE_ANON_KEY)

### Integration Points
- `@openvaa/supabase-types` (Phase 30) provides `Database` type for client generics
- `@supabase/supabase-js` and `@supabase/ssr` (Phase 30) provide client factories
- Phase 33 will wire auth context and protected layout guards using these foundations
- Phase 38 will remove Strapi auth and do thorough cleanup

</code_context>

<deferred>
## Deferred Ideas

- Auth context rewrite with Svelte 5 reactivity — Phase 33
- Protected layout guards — Phase 33
- Candidate preregister Edge Function wiring — Phase 33
- Strapi auth removal (AUTH_TOKEN_KEY, JWT checks, token in PageData, adapter auth utils) — Phase 38

</deferred>

---

*Phase: 32-auth-infrastructure*
*Context gathered: 2026-03-22*
