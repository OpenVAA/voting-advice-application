---
created: 2026-11-28
title: Add signed requests or PAR to Signicat provider
area: frontend
tags: [contestant, frontend, supabase, feat]
keywords: [signicat, bank-authentication, par, signed-request, ftn]
source: "GitHub issue #851"
github_issues: [851]
files:
  - apps/frontend/src/lib/api/utils/auth/providers/signicat.ts
  - apps/frontend/src/lib/api/utils/auth/providers/idura.ts
  - apps/frontend/src/routes/api/oidc/authorize/+server.ts
  - apps/frontend/src/lib/server/constants.ts
  - .env.example
---

# Add signed requests or PAR to Signicat provider

## Origin

Converted from GitHub issue [#851 feat: update bank authentication to match latest requirements](https://github.com/openvaa/voting-advice-application/issues/851) on 2026-11-28.

## Problem

Traficom's M72B rules for the Finnish Trust Network require service providers to secure the authorization request to their broker either with signed request objects (JAR, 'Sign Request Object') or Pushed Authorization Requests (PAR); Signicat rejects unsigned requests after 2025-12-31. `apps/frontend/src/lib/api/utils/auth/providers/signicat.ts` still builds a plain PKCE authorization URL with query params, and Signicat is the default provider. The Idura provider (`providers/idura.ts`) already signs its request object with `jose.SignJWT`, so the pattern exists. Docs: developer.signicat.com eid-hub/oidc/advanced-security (send-encrypted-signed-requests, pushed-authorization-requests-par).

## Solution

Prefer PAR: in `/api/oidc/authorize` POST the authorization parameters (with client authentication) to Signicat's PAR endpoint server-side and redirect with the returned `request_uri`; or sign a request object with a key from env as Idura does. Add the needed env vars to `.env.example`, update the identity-callback/pre-launch auth checks, and test against Signicat's test environment.
