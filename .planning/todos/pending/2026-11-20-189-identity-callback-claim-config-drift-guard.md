---
created: 2026-11-20T00:00:00.000Z
title: identity-callback claim-config drift guard - the frontend and Deno copies of the claim configuration are kept equal by hand
area: Edge Functions / auth
severity: medium
source: Phase 189 (G-04)
owner: the deployment workstream, or whoever next changes a provider's claims
files:
  - apps/supabase/supabase/functions/identity-callback/claimConfig.ts
  - apps/frontend/src/lib/api/utils/auth/providers/signicat.ts
  - apps/frontend/src/lib/api/utils/auth/providers/idura.ts
  - apps/supabase/supabase/config.toml
---

## Problem

The claim configuration of each identity provider exists twice. The Edge Function's copy is
`PROVIDER_CONFIGS` in `identity-callback/claimConfig.ts`. The frontend's copies are
`SIGNICAT_FTN_AUTH_CONFIG` in `providers/signicat.ts` and `IDURA_FTN_AUTH_CONFIG` in
`providers/idura.ts`. The value of `identityMatchProp` is the account key on the Edge Function's
side: it becomes `app_metadata.identity_match_value` and the local part of the placeholder address,
so a claim that is not unique per person merges two people into one account. The frontend's
`identifier` is read from its own copy of `identityMatchProp`.

On 2026-11-20 all four sites read `sub` (claimConfig.ts:43 and 48, signicat.ts:40, idura.ts:39;
`evidence/189-17-identity-callback-check.md` in phase 189's directory). The copies agree only
because they have been kept equal by hand. Each side's tests pin its own literals:
`claimConfig.test.ts` pins `identityMatchProp` to `'sub'`, and `signicat.test.ts` and
`idura.test.ts` compare their own `authConfig` whole. No test reads both copies
(`git grep -n -E "claimConfig|identityMatchProp" -- '*.test.ts'`). A change made to one copy and to
its own test passes the suite while the other copy keeps the old claim, and the frontend and the
backend are then keyed to different claims. The source comment at `signicat.ts:37` says that the two
"must stay in agreement". Nothing enforces it.

Related, and not the same: `2026-08-22-edge-function-fourth-idtoken-verifier-copy.md` is about the
duplicated decrypt-verify-claims path, not the claim mapping.

## Solution

One vitest test that imports both copies and fails on any difference, for each provider keyword:
`identityMatchProp` must be equal, and `firstNameProp` and `lastNameProp` must be equal to the
claims the Edge Function extracts. The test lives on the side that can import both: the Deno copy has
no Deno imports (`claimConfig.test.ts` already runs under vitest). The test must also fail when a
provider keyword exists on one side only. A deliberate difference, such as the frontend's
`extractClaims`, which the Edge Function does not read, is named in the test so that it cannot grow
silently.
