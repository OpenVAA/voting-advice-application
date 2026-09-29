# Phase 161 Plan 01 Task 1 — operator decision record

**Recorded:** 2026-09-04, before any file listed in `161-01-PLAN.md`'s `files_modified` was modified.

**Instrument, both directions.** `git diff --name-only | grep -Ev '^\.planning/' | wc -l` returned
`0` at the moment of recording. The zero is not vacuous: appending a newline to `package.json` made
the same pipeline return `1` and name `package.json`; `git checkout -- package.json` returned it to
`0`. The instrument reports a real source modification and reports none here.

---

## Answer 1 — `one-name`

The canonical variable is **`PUBLIC_PROJECT_ID`**, read by BOTH the frontend and the Deno Edge
Function. DR-1 stands as written and is **not** amended. The `two-names` branch is **not** applied:
plan `161-03` task 1 is **not** annotated to keep the Deno-side `DEFAULT_PROJECT_ID` — it renames.

Operator's reasoning, verbatim:

> "One physical name read by both the frontend and the Deno Edge Function: one grep, one documented
> line, one thing to configure per environment. The PUBLIC_ prefix is semantically honest — the
> project id appears in every client query and every storage path, so it is not a secret. Cost: any
> already-provisioned deployment's Edge-Function secret must be renamed from DEFAULT_PROJECT_ID, and
> criterion 1's literal string is not the variable's name."

## The criterion-1 deviation is ACCEPTED

ROADMAP criterion 1 names the literal `PROJECT_ID`. The delivered name is `PUBLIC_PROJECT_ID`.
**A verifier must read this as SATISFIED, not as a missed criterion.**

The measured reason the literal name is undeliverable for the frontend:

- SvelteKit's `kit.env.publicPrefix` defaults to `PUBLIC_`, and `apps/frontend/svelte.config.js`
  declares no `kit.env` block (verified at HEAD: its `kit` object carries only `adapter`, `alias` and
  `version`). An unprefixed name is therefore classified private and is unreadable in the browser,
  while the Supabase adapter constructs a browser client.
- Setting the prefix to `''` would publish every private root-`.env` key — including the
  identity-provider client secret (`IDENTITY_PROVIDER_CLIENT_SECRET`), the decryption JWKS
  (`IDENTITY_PROVIDER_DECRYPTION_JWKS`) and the Idura signing JWKS (`IDURA_SIGNING_JWKS`). Rejected
  outright.

## Answer 2 — the E2E posture is CONFIRMED as specified

- `E2E_PROJECT_ID` = `00000000-0000-0000-0000-0000000000e2`, deliberately distinct from the
  default/seed project id `00000000-0000-0000-0000-000000000001`.
- It is carried as a **committed constant** with its `.env.example` line **commented out**.
- Teardown is **create-if-absent** and never runs `DELETE FROM public.projects`. Only run content is
  torn down.

**The commented-out line is load-bearing, not cosmetic.** `packages/dev-seed/src/cli/seed.ts`
auto-loads the repo-root `.env` via `process.loadEnvFile`, and `tests/playwright.config.ts` calls
`dotenv.config()`. A live line would silently re-point `yarn db:seed:default` — and therefore
`yarn db:reset-with-data` — at the E2E project, leaving a plain local dev session showing an empty
app.

---

## Disposition

- DR-1: stands, unamended.
- DR-2: stands, confirmed.
- DR-3: stands, confirmed.
- `161-03` task 1: unannotated; it renames the Deno-side variable to `PUBLIC_PROJECT_ID`.
