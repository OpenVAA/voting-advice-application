# Lens: Server · ID prefix `SRV`

**Applies when** the PR touches a Supabase Edge Function or its shared modules (`apps/supabase/supabase/functions/`), a SvelteKit server endpoint (`apps/frontend/src/routes/api/**/+server.ts`), `apps/frontend/src/hooks.server.ts`, or server-only code in `apps/frontend/src/lib/server/`.

## List

Each server entry point added or changed: _function or endpoint_ → _method and path_ → _who may call it_ → _what it reads and writes_ → _which client it uses_ (caller's token or service role).

## Evaluate (criterion slugs)

- `srv-refuse-first`: an Edge Function decides authority by asking `user_can` through the caller's own token (the `callerMayOnProject` helper in `callerAuthority.ts`), never by reading the grants claim in TypeScript, and refuses before any service-role client exists. Read the handler top-down: the first `createClient` with the service-role key must come after the refusal path. This is `.agents/code-review-checklist.md` § Edge Functions.
- `srv-shared`: a module two functions use lives in `apps/supabase/supabase/functions/_shared/`, not copied between functions. Deno code stays out of the vanilla TypeScript tree; Deno tooling is scoped by `deno.enablePaths` and `apps/supabase/supabase/functions/deno.json`, and `deno check .` from that directory is clean.
- `srv-env`: every new environment variable is registered in the env-pair registry with defaults that agree (`yarn assert:env-pair-registry`, `yarn assert:edge-env-defaults`, `yarn check:env-pairs-agree`). Nothing secret is readable from a `PUBLIC_*` variable.
- `srv-errors`: status codes and error bodies follow the function's existing contract; errors are logged; replies stay opaque wherever identity is at stake (an unknown address and a known one must look the same to the caller).
- `srv-sveltekit-endpoint`: endpoints and hooks keep the cookie names (`yarn assert:cookie-names`), use `safeGetSession()` rather than `getSession()`, and keep server-only imports under `$lib/server`.
- `srv-identity-secret`: `identity-callback` answers the frontend server alone, proven by `IDENTITY_CALLBACK_SERVER_SECRET`; a new caller of it, or a new path into it, keeps that proof.

## Where to look

`apps/supabase/supabase/functions/send-email/callerAuthority.ts`, `apps/supabase/supabase/functions/_shared/`, `apps/supabase/supabase/functions/deno.json`, `apps/frontend/src/hooks.server.ts`, `apps/frontend/src/routes/api/`, `scripts/` (the `assert-*` guards named above).

## Promote to

`.agents/code-review-checklist.md` § Edge Functions; `.claude/skills/database/SKILL.md`; `.claude/skills/spike-findings-voting-advice-application-gsd/SKILL.md` (Deno typecheck).
