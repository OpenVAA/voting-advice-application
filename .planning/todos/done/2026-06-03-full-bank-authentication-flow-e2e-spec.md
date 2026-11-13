---
created: 2026-06-03T19:12:34.010Z
title: Test and create E2E spec for full bank authentication flow
area: testing
files:
  - tests/tests/specs/candidate/candidate-bank-auth.spec.ts
resolves_phase: 122
---

## Problem

The candidate bank authentication flow (OpenID Connect via Signicat — see CLAUDE.md "Bank authentication via OpenID Connect (Signicat)") is not covered by a full end-to-end E2E spec. An existing `tests/tests/specs/candidate/candidate-bank-auth.spec.ts` covers only part of the flow (likely the entry point / redirect, not a complete round-trip through the IdP and back to an authenticated session). The full flow — initiate bank-auth → Signicat OIDC redirect → callback → session established → access to protected candidate routes — has no automated coverage, so regressions in the auth round-trip would go undetected.

## Solution

TBD. Investigation needed first:
- Determine whether the full Signicat OIDC round-trip can be exercised in E2E against the local stack, or whether it requires a mock/stub IdP (Signicat sandbox vs. a local OIDC test double). Check `.env` IdP settings and how `hooks.server.ts` / the candidate `(protected)` routes consume the session.
- Decide the seam: real Signicat sandbox (flaky, external dependency) vs. a deterministic mock OIDC provider wired into the e2e stack (preferred for a green, hermetic suite — aligns with the all-green-suite priority).
- Then author the spec: cover initiate → redirect → callback → authenticated session → protected-route access, plus the failure/cancel path.
- Extend or replace `candidate-bank-auth.spec.ts` accordingly; add any needed fixture/setup + a dev-seed template hook if bank-auth users need seeding.

## Resolution

**Closed 2026-10-22 by Phase 179** (plan 179-14's scenario 1; moved by 179-23).

- **The seam.** A deterministic mock OIDC issuer, not a provider sandbox: the mock issuer that Playwright's `webServer` starts on 127.0.0.1:9443, one issuer for both identity-provider projects (`dd51b3bf1`, 179-04). The E2E wrapper serves `identity-callback` against it and restores the shared stack at its end; both projects run in every default run (`640eb5fa3`, 179-05).
- **The spec.** `tests/tests/specs/contestant/contestant-identity-provider.spec.ts`, project `contestant-identity-provider`. Its first scenario, `a new candidate identifies at the provider, gives the address they will sign in with and goes straight to editing; the mailed link proves the address` (`388c76328`, `feat(179-14)`), walks start → provider → callback → `identity-callback` → session → the protected routes. The cancel and failure paths are `a cancel at the provider …` and `an error at the provider …` (`52b84a51b`, 179-06). The spec now holds 16 scenarios tagged `@reg-idp`; `yarn assert:e2e-coverage-tags` fails if none of them is in the default run.
