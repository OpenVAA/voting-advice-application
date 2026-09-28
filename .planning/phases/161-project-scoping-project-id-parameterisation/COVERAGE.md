# Phase 161 — API Coverage Decision

No external API integration: the phase parameterises queries issued through the already-integrated
Supabase client (`@supabase/supabase-js` / `@supabase/ssr`, PostgREST + Edge Functions), adds a
static source guard, and changes one existing SQL RPC signature. No new external API, SDK or service
is introduced, and no new package is installed.

Confirmed against the phase scope: `161-CONTEXT.md` `<domain>`, `161-RESEARCH.md` § "Standard Stack"
(*"No new runtime dependency is required by this phase. Everything it needs is already in the
tree."*) and § "Package Legitimacy Audit" (*"Not applicable — this phase installs no external
packages."*).
