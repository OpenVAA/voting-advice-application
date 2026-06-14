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
