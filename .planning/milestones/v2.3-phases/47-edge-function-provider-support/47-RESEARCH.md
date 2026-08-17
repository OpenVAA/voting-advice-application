# Phase 47: Edge Function Provider Support - Research

**Researched:** 2026-03-27
**Domain:** Supabase Edge Functions (Deno), OIDC identity claim processing, jose JWE/JWT library
**Confidence:** HIGH

## Summary

Phase 47 transforms the existing `signicat-callback` Edge Function into a provider-agnostic `identity-callback` function that dispatches identity matching based on configuration rather than hardcoded Signicat logic. The current function (383 lines) handles JWE decryption, JWT verification, identity claim extraction, user creation, candidate record creation, role assignment, and magic link session generation. Most of this logic is already provider-agnostic -- the only provider-specific parts are: (1) env var names referencing "SIGNICAT", (2) the `extractIdentityClaims` function hardcoded to `birthdate`, and (3) the `findUserByBirthdateId` function searching `app_metadata.birthdate_id`.

The changes are well-scoped: rename the directory, generalize env var names, make identity matching configurable via provider config (which claim to use as the identity key, which claims to extract, which claims map to first/last name), and store provider audit metadata in `app_metadata`. The frontend caller at `apps/frontend/src/routes/api/candidate/preregister/+server.ts` also needs updating to invoke `identity-callback` instead of `signicat-callback`.

**Primary recommendation:** Refactor the Edge Function in-place -- do not create a parallel function. The existing JWE/JWT/user-creation logic is reusable. Introduce a provider config object that maps `IDENTITY_PROVIDER_TYPE` to claim property names, then use that config throughout instead of hardcoded strings.

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions
- **D-01:** Rename `signicat-callback` to `identity-callback` -- single provider-agnostic function
- **D-02:** Old `signicat-callback` directory deleted entirely
- **D-03:** Provider type read from env var (e.g., `IDENTITY_PROVIDER_TYPE`) to select matching config
- **D-04:** Auth config defines `identityMatchProp` -- which id_token claim to use for user lookup (e.g., `sub` for Idura, `birthdate` for Signicat)
- **D-05:** Edge Function searches `app_metadata` for `identity_match_value` matching the resolved claim value
- **D-06:** No migration for existing Signicat users -- clean break when switching providers
- **D-07:** Auth config defines `firstNameProp` and `lastNameProp` for extracting candidate name from claims
- **D-08:** Auth config defines `extractClaims` for additional claims to save in user metadata (e.g., `birthdate`, `hetu`)
- **D-09:** `app_metadata` stores: `identity_provider` (provider type), `identity_match_prop` (claim name used), `identity_match_value` (claim value), plus all extracted claims
- **D-10:** Provider type stored for audit trail -- tells you which provider authenticated the user
- **D-11:** Decryption JWKS env var name stays generic: `IDENTITY_PROVIDER_DECRYPTION_JWKS` (same key name, different keys per provider)
- **D-12:** JWKS URI and issuer also generic: `IDENTITY_PROVIDER_JWKS_URI`, `IDENTITY_PROVIDER_ISSUER`

### Claude's Discretion
- How to structure the provider config (inline object vs env var parsing)
- Error message format for missing/invalid claims
- Whether to log provider-specific debugging info

### Deferred Ideas (OUT OF SCOPE)
None -- discussion stayed within phase scope

</user_constraints>

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|------------------|
| EDGE-01 | Identity callback Edge Function supports both providers via configuration | Provider config object maps `IDENTITY_PROVIDER_TYPE` env var to claim property names; single function dispatches based on config |
| EDGE-02 | Idura identity matching uses `sub` claim (persistent pseudonym) instead of `birthdate` | Configurable `identityMatchProp` in provider config: `sub` for Idura, `birthdate` for Signicat; `findUserByIdentityMatch()` searches `app_metadata.identity_match_value` |
| EDGE-03 | Provider type is stored in user `app_metadata` for audit trail | `app_metadata` stores: `identity_provider`, `identity_match_prop`, `identity_match_value`, plus extracted claims |

</phase_requirements>

## Standard Stack

### Core
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| jose | v5.9.6 (Deno) | JWE decryption + JWT verification | Already used in current Edge Function; proven in production |
| @supabase/supabase-js | v2 (esm.sh) | Admin client for user/candidate operations | Standard Supabase client, already in use |

### Supporting
| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| Deno runtime | (Supabase-managed) | Edge Function execution environment | All Edge Functions |

### Alternatives Considered
| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| jose v5.9.6 | jose v6.0.10 (latest) | v6 has breaking changes (importJWK behavior for oct keys, JWE zip removal). Not needed -- v5 works fine. Upgrade only if required by Supabase runtime. |

**Import URLs (Deno style):**
```typescript
import * as jose from 'https://deno.land/x/jose@v5.9.6/index.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
```

**Note on jose v6:** The latest jose is v6.0.10, which has breaking changes including `importJWK` behavior for oct keys and removal of JWE "zip" compression. The current Edge Function uses v5.9.6 and none of the v6 changes affect the RSA-OAEP/RSA-OAEP-256 JWE decryption or JWT verification used here. Stay on v5.9.6 to avoid unnecessary churn.

## Architecture Patterns

### Recommended Project Structure (Edge Function)
```
apps/supabase/supabase/functions/
├── identity-callback/          # Renamed from signicat-callback
│   └── index.ts                # Provider-agnostic identity callback
├── invite-candidate/
│   └── index.ts
└── send-email/
    └── index.ts
```

### Pattern 1: Provider Configuration Object
**What:** Define a TypeScript interface for provider-specific claim mapping and create a config lookup by provider type.
**When to use:** When the Edge Function needs to behave differently per provider without conditional branching scattered throughout.
**Example:**
```typescript
// Provider configuration interface
interface ProviderConfig {
  /** Which id_token claim to use as the identity key (e.g., 'sub' for Idura, 'birthdate' for Signicat) */
  identityMatchProp: string;
  /** Which claim maps to first name */
  firstNameProp: string;
  /** Which claim maps to last name */
  lastNameProp: string;
  /** Additional claims to extract and store in app_metadata */
  extractClaims: string[];
}

const PROVIDER_CONFIGS: Record<string, ProviderConfig> = {
  signicat: {
    identityMatchProp: 'birthdate',
    firstNameProp: 'given_name',
    lastNameProp: 'family_name',
    extractClaims: []
  },
  idura: {
    identityMatchProp: 'sub',
    firstNameProp: 'given_name',
    lastNameProp: 'family_name',
    extractClaims: ['birthdate', 'hetu']
  }
};

const providerType = Deno.env.get('IDENTITY_PROVIDER_TYPE') ?? 'signicat';
const config = PROVIDER_CONFIGS[providerType];
if (!config) {
  throw new Error(`Unknown identity provider type: ${providerType}`);
}
```

### Pattern 2: Generalized Identity Matching
**What:** Replace `findUserByBirthdateId()` with `findUserByIdentityMatch()` that searches for `identity_match_value` in `app_metadata`.
**When to use:** When identity lookup needs to work with any claim type.
**Example:**
```typescript
async function findUserByIdentityMatch(
  supabaseAdmin: any,
  identityMatchValue: string
): Promise<string | null> {
  let page = 1;
  const perPage = 1000;

  while (true) {
    const { data: { users }, error } = await supabaseAdmin.auth.admin.listUsers({ page, perPage });
    if (error) throw new Error(`Failed to list users: ${error.message}`);
    if (!users || users.length === 0) break;

    const matchingUser = users.find(
      (u: any) => u.app_metadata?.identity_match_value === identityMatchValue
    );
    if (matchingUser) return matchingUser.id;
    if (users.length < perPage) break;
    page++;
  }
  return null;
}
```

### Pattern 3: Configurable Claim Extraction
**What:** Extract claims dynamically based on provider config rather than hardcoding specific claim names.
**When to use:** When different providers expose different sets of claims.
**Example:**
```typescript
function extractIdentityClaims(
  payload: jose.JWTPayload,
  config: ProviderConfig
): {
  firstName: string;
  lastName: string;
  identityMatchValue: string;
  extractedClaims: Record<string, unknown>;
} {
  const firstName = payload[config.firstNameProp] as string | undefined;
  const lastName = payload[config.lastNameProp] as string | undefined;
  const identityMatchValue = payload[config.identityMatchProp] as string | undefined;

  if (!firstName || !lastName || !identityMatchValue) {
    throw new Error(
      `Missing required identity claims. ` +
      `${config.firstNameProp}=${firstName ? 'present' : 'missing'}, ` +
      `${config.lastNameProp}=${lastName ? 'present' : 'missing'}, ` +
      `${config.identityMatchProp}=${identityMatchValue ? 'present' : 'missing'}`
    );
  }

  const extractedClaims: Record<string, unknown> = {};
  for (const claimName of config.extractClaims) {
    if (payload[claimName] !== undefined) {
      extractedClaims[claimName] = payload[claimName];
    }
  }

  return { firstName, lastName, identityMatchValue, extractedClaims };
}
```

### Pattern 4: Audit-Ready app_metadata
**What:** Store complete provider audit trail in `app_metadata` on user creation.
**When to use:** Every user creation path.
**Example:**
```typescript
// When creating a new user
const appMetadata: Record<string, unknown> = {
  identity_provider: providerType,        // 'signicat' or 'idura'
  identity_match_prop: config.identityMatchProp, // 'birthdate' or 'sub'
  identity_match_value: identityMatchValue, // the actual claim value
  ...extractedClaims                       // e.g., { birthdate: '1970-07-07', hetu: '070770-905D' }
};

const { data: newUser, error: createError } = await supabaseAdmin.auth.admin.createUser({
  email_confirm: true,
  app_metadata: appMetadata,
  user_metadata: {
    given_name: firstName,
    family_name: lastName
  }
});
```

### Anti-Patterns to Avoid
- **Provider-specific if/else chains:** Do NOT write `if (provider === 'idura') { ... } else if (provider === 'signicat') { ... }` throughout the function. Use the config object and dynamic property access. The only branching should be the config lookup at the top.
- **Keeping old `birthdate_id` field:** Do NOT also write `birthdate_id` for backward compat. Decision D-06 says clean break -- use `identity_match_value` exclusively.
- **Hardcoding algorithm in JWE decryption:** The existing code already reads `header.alg` dynamically (`header.alg || 'RSA-OAEP'`). This naturally handles RSA-OAEP-256 from Idura. Do not add provider-specific algorithm logic.

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| JWE decryption | Custom decryption | `jose.compactDecrypt` | Already used, handles both RSA-OAEP and RSA-OAEP-256 via header.alg |
| JWT verification | Manual signature check | `jose.jwtVerify` + `jose.createRemoteJWKSet` | Already used, fetches and caches JWKS |
| User pagination | Custom pagination | `supabaseAdmin.auth.admin.listUsers({ page, perPage })` | Already implemented pattern |

**Key insight:** The current Edge Function already handles JWE decryption algorithm dynamically via `header.alg`. No provider-specific crypto code is needed -- just different keys (via env vars) and different claim names (via config).

## Common Pitfalls

### Pitfall 1: Forgetting to Update Frontend Caller
**What goes wrong:** The frontend `+server.ts` at `apps/frontend/src/routes/api/candidate/preregister/+server.ts` hardcodes `'signicat-callback'` in the `supabase.functions.invoke()` call. If you rename only the Edge Function directory, the frontend breaks with a 404.
**Why it happens:** The function name in `invoke()` must match the directory name exactly.
**How to avoid:** Update `supabase.functions.invoke('signicat-callback', ...)` to `supabase.functions.invoke('identity-callback', ...)` in the frontend server route.
**Warning signs:** 404 errors when calling the Edge Function.

### Pitfall 2: Inconsistent app_metadata Field Names
**What goes wrong:** Existing Signicat users have `app_metadata.birthdate_id` and `app_metadata.provider: 'signicat'`. New users will have `app_metadata.identity_match_value` and `app_metadata.identity_provider`. If lookup code isn't updated consistently, users can't be found.
**Why it happens:** Decision D-06 says "clean break" -- no migration. But the lookup function must search for `identity_match_value`, not `birthdate_id`.
**How to avoid:** The new `findUserByIdentityMatch()` searches ONLY for `identity_match_value`. Existing Signicat users with `birthdate_id` will NOT be found -- they'll get new records. This is the intended behavior per D-06.
**Warning signs:** Duplicate user records for existing Signicat users after provider switch.

### Pitfall 3: Missing IDENTITY_PROVIDER_TYPE Env Var
**What goes wrong:** If `IDENTITY_PROVIDER_TYPE` is not set in Supabase secrets, the function falls back to `'signicat'` (safe default). But if the deployment intends to use Idura and forgets the env var, it silently uses Signicat config.
**Why it happens:** Env vars for Supabase Edge Functions are set via `supabase secrets set`, not `.env` files.
**How to avoid:** Validate provider type early in the request handler. Log the active provider on startup or first request. Consider failing loudly if the env var is missing rather than defaulting.
**Warning signs:** Identity matching fails because Idura's `sub` claim is being looked up as `birthdate`.

### Pitfall 4: Old signicat-callback Directory Left Behind
**What goes wrong:** If the old `signicat-callback/` directory isn't deleted, `supabase functions deploy` may deploy both the old and new functions. On production Supabase, the old function remains accessible.
**Why it happens:** `supabase functions deploy` deploys all directories in `functions/`.
**How to avoid:** Delete the old directory entirely (D-02). For production cleanup, use `supabase functions delete signicat-callback` or `supabase functions deploy --prune` to remove functions that no longer exist locally.
**Warning signs:** Both `/functions/v1/signicat-callback` and `/functions/v1/identity-callback` responding.

### Pitfall 5: Console Error Message Still Says "signicat-callback"
**What goes wrong:** The catch block at line 376 logs `console.error('signicat-callback error:', e)`. After rename, this misleading log remains.
**Why it happens:** Easy to miss string literals in error messages.
**How to avoid:** Search for all `signicat` string literals in the new `index.ts` and update them.
**Warning signs:** Confusing log messages referencing the old function name.

## Code Examples

### Complete Provider Config (recommended structure)
```typescript
// At the top of identity-callback/index.ts

interface ProviderConfig {
  identityMatchProp: string;
  firstNameProp: string;
  lastNameProp: string;
  extractClaims: string[];
}

const PROVIDER_CONFIGS: Record<string, ProviderConfig> = {
  signicat: {
    identityMatchProp: 'birthdate',
    firstNameProp: 'given_name',
    lastNameProp: 'family_name',
    extractClaims: []
  },
  idura: {
    identityMatchProp: 'sub',
    firstNameProp: 'given_name',
    lastNameProp: 'family_name',
    extractClaims: ['birthdate', 'hetu']
  }
};
```

### Updated User Creation with Audit Metadata
```typescript
// Replaces the current createUser call (lines 253-263 of current index.ts)
const { data: newUser, error: createError } = await supabaseAdmin.auth.admin.createUser({
  email_confirm: true,
  app_metadata: {
    identity_provider: providerType,
    identity_match_prop: config.identityMatchProp,
    identity_match_value: identityMatchValue,
    ...extractedClaims
  },
  user_metadata: {
    given_name: firstName,
    family_name: lastName
  }
});
```

### Updated Frontend Caller
```typescript
// apps/frontend/src/routes/api/candidate/preregister/+server.ts
// Change line 16 from:
const { data, error: fnError } = await locals.supabase.functions.invoke('signicat-callback', {
// To:
const { data, error: fnError } = await locals.supabase.functions.invoke('identity-callback', {
```

### Env Var Mapping (Edge Function)
```typescript
// Old (Signicat-specific):
// SIGNICAT_DECRYPTION_JWKS, SIGNICAT_JWKS_URI, SIGNICAT_CLIENT_ID

// New (provider-agnostic):
// IDENTITY_PROVIDER_DECRYPTION_JWKS, IDENTITY_PROVIDER_JWKS_URI, IDENTITY_PROVIDER_CLIENT_ID
// IDENTITY_PROVIDER_TYPE (new)

const providerType = Deno.env.get('IDENTITY_PROVIDER_TYPE') ?? 'signicat';
const decryptionJWKS = Deno.env.get('IDENTITY_PROVIDER_DECRYPTION_JWKS')!;
const jwksUri = Deno.env.get('IDENTITY_PROVIDER_JWKS_URI')!;
const clientId = Deno.env.get('IDENTITY_PROVIDER_CLIENT_ID');
```

## Inventory of Changes Required

### Files to Create
| File | Purpose |
|------|---------|
| `apps/supabase/supabase/functions/identity-callback/index.ts` | New provider-agnostic Edge Function |

### Files to Modify
| File | Change |
|------|--------|
| `apps/frontend/src/routes/api/candidate/preregister/+server.ts` | Change `invoke('signicat-callback', ...)` to `invoke('identity-callback', ...)` and update comment |

### Files to Delete
| File | Reason |
|------|--------|
| `apps/supabase/supabase/functions/signicat-callback/index.ts` | Replaced by identity-callback (D-02) |
| `apps/supabase/supabase/functions/signicat-callback/` | Directory deleted entirely |

### Env Vars for Edge Function (Supabase secrets)
| Old Name | New Name | Notes |
|----------|----------|-------|
| `SIGNICAT_DECRYPTION_JWKS` | `IDENTITY_PROVIDER_DECRYPTION_JWKS` | Same format, different keys per provider |
| `SIGNICAT_JWKS_URI` | `IDENTITY_PROVIDER_JWKS_URI` | Provider's public JWKS endpoint |
| `SIGNICAT_CLIENT_ID` | `IDENTITY_PROVIDER_CLIENT_ID` | Provider's client ID |
| (new) | `IDENTITY_PROVIDER_TYPE` | `'signicat'` or `'idura'` |

**Note:** Phase 45 (provider abstraction) already uses generic env var names in the frontend (`IDENTITY_PROVIDER_DECRYPTION_JWKS`, etc.). This phase aligns the Edge Function env vars to the same naming convention.

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| Hardcoded `birthdate` identity matching | Configurable claim-based matching via `identityMatchProp` | This phase | Enables any OIDC claim as identity key |
| `birthdate_id` in `app_metadata` | `identity_match_value` + `identity_match_prop` + `identity_provider` | This phase | Full audit trail of which provider and claim was used |
| `SIGNICAT_*` env var names | `IDENTITY_PROVIDER_*` env var names | This phase | Provider-agnostic naming |

## Open Questions

1. **Should the function fail loudly if IDENTITY_PROVIDER_TYPE is unset?**
   - What we know: Current pattern defaults to `'signicat'` via `??` operator
   - What's unclear: Whether silent fallback is acceptable or dangerous in production
   - Recommendation: Default to `'signicat'` for backward compat, but log a warning. Planner's discretion.

2. **Should existing users with `birthdate_id` be findable?**
   - What we know: D-06 says "clean break when switching providers" -- no migration
   - What's unclear: Whether both `identity_match_value` AND `birthdate_id` should be searched
   - Recommendation: Search ONLY `identity_match_value`. This is a clean break. Document that switching providers means existing users re-register.

## Environment Availability

Step 2.6: SKIPPED (no external dependencies identified). This phase modifies TypeScript code in Edge Function and frontend server route. No external tools, CLIs, or services are needed beyond what's already in the project.

## Sources

### Primary (HIGH confidence)
- `apps/supabase/supabase/functions/signicat-callback/index.ts` -- Current full implementation (383 lines), read in detail
- `apps/frontend/src/routes/api/candidate/preregister/+server.ts` -- Frontend caller, only file invoking the Edge Function
- `.planning/idura-ftn-auth-plan.md` -- Phase 5-6: Edge Function options, env vars, Idura claims JSON
- `.planning/phases/47-edge-function-provider-support/47-CONTEXT.md` -- All 12 locked decisions
- `.planning/phases/45-provider-abstraction-and-configuration/45-CONTEXT.md` -- Provider abstraction design and env var naming
- [Supabase Edge Functions Deploy docs](https://supabase.com/docs/guides/functions/deploy) -- Deployment, `--prune` flag for cleanup
- [Supabase CLI: functions delete](https://supabase.com/docs/reference/cli/supabase-functions-delete) -- Deleting deployed functions

### Secondary (MEDIUM confidence)
- [jose v6.0.10 changelog](https://github.com/panva/jose/blob/main/CHANGELOG.md) -- Breaking changes in v6; confirmed v5.9.6 is safe to stay on
- [jose Deno module](https://deno.land/x/jose@v5.9.6) -- Import URL verified

### Tertiary (LOW confidence)
- None

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH -- jose v5.9.6 and @supabase/supabase-js@2 already in use, no new dependencies
- Architecture: HIGH -- provider config pattern is straightforward, all code paths verified in existing source
- Pitfalls: HIGH -- identified from direct code reading (frontend caller, env var names, error messages, directory cleanup)

**Research date:** 2026-03-27
**Valid until:** 2026-04-27 (stable -- no fast-moving dependencies)
