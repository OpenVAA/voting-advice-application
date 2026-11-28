---
created: 2026-08-20T12:00:00.000Z
title: Six unenumerated F19-class `!`-on-`null` sites in the two auth test files
area: testing / assertion quality
severity: minor
source: Phase 142 discussion A1 (D-05, D-19 i)
files:
  - apps/frontend/src/lib/api/utils/auth/__tests__/authorize-endpoint.test.ts
  - apps/frontend/src/lib/api/utils/auth/getIdTokenClaims.test.ts
  - .planning/phases/139-single-source-sweep-findings-confirm-or-withdraw/139-VERDICTS.md
tags: [contestant, frontend, tests, improvement]
keywords: [assertions, null-blind, auth-tests, f19, test-quality]
resolved: 2026-11-28
resolution: "obsolete: Both named files are gone (getIdTokenClaims.test.ts became decryptAndVerifyIdToken.test.ts; lib/api/utils/auth/__tests__/authorize-endpoint.test.ts no longer exists), so the six enumerated sites no longer exist as described; the successor tests carry explicit non-null-blind assertions (idura.test.ts:160, routes/api/oidc/authorize/server.test.ts:181)."
---

## Problem

Phase 139 surfaced **six further F19-class sites** in the two auth test files that
the original fake-guard sweep never enumerated — `toBeDefined()` (or `!`) applied to
expressions that return `string | null` and therefore never return `undefined`, so
the assertion cannot fail on a missing value. Recorded at `139-VERDICTS.md` § 7
limit 6 and § 8.1 C-2/C-4.

They belong to **ASSERT-03's class** (F19), which Phase 140 owned. Phase 140 is
closed, so nothing currently owns these six. Phase 142 deliberately declined to
absorb them (discussion A1) rather than quietly widening its corpus — the corpus
had to stay the 12 findings ASSERT-07 names.

## Solution

Enumerate the six sites explicitly from `139-VERDICTS.md` § 7 limit 6 and § 8.1
C-2/C-4, then apply the same remediation ASSERT-03 applied to the original F19
set: assert an actual value, so a missing parameter fails. Each site gets a
negative-control pair in whatever ledger the owning phase keeps.

Cheapest home is whichever phase next touches those two files.
