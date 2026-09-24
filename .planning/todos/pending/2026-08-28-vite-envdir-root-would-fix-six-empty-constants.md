---
created: '2026-08-28T00:00:00.000Z'
title: Pointing kit.env.dir / vite envDir at the repo root would fill the empty PUBLIC_ constants, and would also publish every private root key
area: infra
priority: medium
files:
  - apps/frontend/svelte.config.js
  - apps/frontend/vite.config.ts
  - apps/frontend/src/lib/utils/constants.ts
  - .env.example
---

## Problem

SvelteKit reads `loadEnv(mode, kit.env.dir, '')` with `kit.env.dir` defaulting to `process.cwd()`.
The frontend workspace's cwd is `apps/frontend`, so the file it reads is `apps/frontend/.env` — a
gitignored file that most checkouts do not have. The repo-root `.env` an operator actually maintains
is therefore invisible to the frontend, and every `PUBLIC_*` constant sourced only from it resolves
to the empty string in a plain `yarn dev` session.

**Measured at filing time, from `apps/frontend/src/lib/utils/constants.ts` against `.env.example`:**
thirteen `PUBLIC_*` keys are read; **ten** of them are assigned in the root template and would be
empty in that session (`PUBLIC_BROWSER_FRONTEND_URL`, `PUBLIC_SERVER_FRONTEND_URL`,
`PUBLIC_IDENTITY_PROVIDER_CLIENT_ID`, `PUBLIC_IDENTITY_PROVIDER_AUTHORIZATION_ENDPOINT`,
`PUBLIC_IDENTITY_PROVIDER_TYPE`, `PUBLIC_DEBUG`, `PUBLIC_LOG_LEVEL`, `PUBLIC_CACHE_ENABLED`,
`PUBLIC_SUPABASE_URL`, `PUBLIC_SUPABASE_ANON_KEY`). Two more
(`PUBLIC_BROWSER_BACKEND_URL`, `PUBLIC_SERVER_BACKEND_URL`) are read but assigned in neither file.
`PUBLIC_PROJECT_ID` is the thirteenth and is already immune, because it is carried across explicitly.

Re-measure before acting: this count moves whenever a key is added to either file.

## Why it is not fixed here

Widening the env directory to the repo root is a behaviour change that touches authentication. With
`envDir` at the root, `$env/dynamic/private` gains every private key in that file:

`SUPABASE_URL`, `SUPABASE_ANON_KEY`, `IDENTITY_PROVIDER_CLIENT_ID`, `IDENTITY_PROVIDER_TYPE`,
`FRONTEND_PORT`, `CACHE_DIR`, `CACHE_TTL`, `CACHE_LRU_SIZE`, `CACHE_EXPIRATION_INTERVAL`,
`LOCAL_DATA_DIR`, `IDENTITY_PROVIDER_DECRYPTION_JWKS`, `IDENTITY_PROVIDER_JWKS_URI`,
`IDENTITY_PROVIDER_ISSUER`, `IDENTITY_PROVIDER_TOKEN_ENDPOINT`, `IDENTITY_PROVIDER_CLIENT_SECRET`,
`IDURA_DOMAIN`, `IDURA_SIGNING_JWKS`, `IDURA_SIGNING_KEY_KID`, `DEFAULT_PROJECT_ID`, `SITE_URL`,
`SMTP_HOST`, `SMTP_PORT`, `SMTP_FROM`, `LLM_OPENAI_API_KEY`.

Three of those are credentials in the strict sense: the identity-provider client secret, the
decryption JWKS and the Idura signing JWKS. Setting `kit.env.publicPrefix` to the empty string —
a nearby idea that would solve the same surface differently — is strictly worse: it would put those
same three into the **browser bundle**. That variant is rejected outright, not merely deferred.

## Solution

TBD — the choice is between the narrow, per-key plumbing this phase used (safe, explicit, one entry
per key) and the broad `envDir` change (fixes everything at once, and needs a deliberate decision
about what `$env/dynamic/private` is allowed to see). Whoever takes it should decide that question
first and record the answer.
