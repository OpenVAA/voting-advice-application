---
created: 2026-11-20T00:00:00.000Z
title: Bank authentication is not wired on the AWS task
area: deployment / auth
severity: minor
source: Phase 189 (research open question 6)
owner: a later phase, and any deployment that offers bank authentication until it is done
files:
  - infra/modules/frontend-service/task-environment.json
  - apps/frontend/src/lib/server/constants.ts
---

## Problem

The frontend task on the AWS path receives exactly the variables of `infra/modules/frontend-service/task-environment.json`, and that list holds none of the variables bank authentication reads. Read on 2026-11-20 against `apps/frontend/src/lib/server/constants.ts` and the env page's § Identity provider, the task list lacks:

- `IDENTITY_CALLBACK_SERVER_SECRET`, which the frontend server sends to `identity-callback` in the `x-identity-callback-secret` header; the function refuses every request without it;
- `PUBLIC_IDENTITY_PROVIDER_TYPE`, `PUBLIC_IDENTITY_PROVIDER_CLIENT_ID`, and for Signicat `PUBLIC_IDENTITY_PROVIDER_AUTHORIZATION_ENDPOINT`;
- the private ones of `constants.ts`: `IDENTITY_PROVIDER_CLIENT_SECRET`, `IDENTITY_PROVIDER_DECRYPTION_JWKS`, `IDENTITY_PROVIDER_JWKS_URI`, `IDENTITY_PROVIDER_ISSUER`, `IDENTITY_PROVIDER_TOKEN_ENDPOINT`, and for Idura `IDURA_DOMAIN`, `IDURA_SIGNING_JWKS`, `IDURA_SIGNING_KEY_KID`.

On the Supabase side, `infra/modules/supabase/function-secrets.tf` sets `PUBLIC_PROJECT_ID`, `SITE_URL` and the five SMTP secrets and no identity-provider secret, so `identity-callback` holds neither the shared secret nor the provider's settings. Staging runs without bank authentication. The deployment guide (§ The AWS root and its image) and the env page (§ Identity provider) both state that it is not wired on the AWS path.

## Solution

- Add the variables to `task-environment.json` as `parameter` entries (the secrets, and any value a deployment keeps out of a tracked file) or `value` entries (the `PUBLIC_` ones), with `required: false`, and the parameters to the parameter store under the root's `parameter_path`. `taskEnvironment.test.ts` then requires each name in `.env.example` and in the staging AWS runbook's environment table, and every name ending in `KEY`, `SECRET`, `PASSWORD` or `TOKEN` to be a `parameter`.
- Set the same secret on both sides: add `IDENTITY_CALLBACK_SERVER_SECRET` and the provider's function variables to `function-secrets.tf`, from Terraform variables given in the operator's shell, so that the frontend's value and the function's are one value.
- Test it on a deployment whose provider is configured, and record the observation in the staging runbooks before the docs state the path as wired.
