# Phase 155: Edge Function Hardening — env, JWT, provider identity - Pattern Map

**Mapped:** 2026-08-28
**Files analyzed:** 14 (7 new source/test modules, 1 new guard script, 3 modified Edge Functions, 3 modified config/doc files)
**Analogs found:** 13 / 14 (one file — `.env.example` block — has no structural analog, it is data)

All excerpts below were read from the working tree this session (branch `integration/ship-12-squash`). Line numbers are as measured now.

---

## File Classification

| New/Modified File | Role | Data Flow | Closest Analog | Match Quality |
|-------------------|------|-----------|----------------|---------------|
| `apps/supabase/supabase/functions/identity-callback/verifyConfig.ts` (NEW) | utility (pure module beside an Edge Function) | transform / fail-closed validation | `apps/supabase/supabase/functions/identity-callback/claimConfig.ts` | **exact** (same directory, same contract) |
| `.../identity-callback/verifyConfig.test.ts` (NEW) | test | request-response (unit) | `.../identity-callback/claimConfig.test.ts` | **exact** |
| `.../invite-candidate/jwtSegment.ts` (NEW) | utility | transform (decode) | `claimConfig.ts` | **exact** |
| `.../invite-candidate/jwtSegment.test.ts` (NEW) | test | unit | `claimConfig.test.ts` | **exact** |
| `.../send-email/jwtSegment.ts` (NEW, duplicate copy) | utility | transform | `claimConfig.ts` | **exact** |
| `.../send-email/jwtSegment.test.ts` (NEW) | test | unit | `claimConfig.test.ts` | **exact** |
| `.../send-email/templateVars.ts` (NEW) | utility | transform (string substitution) | `claimConfig.ts` | **exact** |
| `.../send-email/templateVars.test.ts` (NEW) | test | unit | `claimConfig.test.ts` | **exact** |
| `envConfig.ts` + `.test.ts` (NEW, one per function dir — see Pitfall 2) | utility | validation | `claimConfig.ts` | **exact** (structure); **no analog for `requireEnv` itself — see § No Analog Found**) |
| `scripts/assert-edge-env-defaults.mjs` (NEW) | config / build guard | batch (static scan) | `scripts/assert-a11y-scan-wiring.mjs` | **exact** |
| root `package.json` (`assert:edge-env-defaults` + `lint:check` link) (MODIFIED) | config | — | existing `assert:i18n-catalog-namespaces` / `assert:a11y-scan-wiring` links | **exact** |
| membership assertion (extend `packages/dev-seed/tests/ciTypecheckGate.test.ts` or a sibling) (MODIFIED/NEW) | test | unit (repo-meta) | `packages/dev-seed/tests/ciTypecheckGate.test.ts:83-88` | **exact** |
| `.../identity-callback/index.ts` (MODIFIED — `:17`, `:20-21`, `:69-94`, `:169`, `:197`, `:361`) | controller (Deno HTTP handler) | request-response | `apps/frontend/src/lib/api/utils/auth/decryptAndVerifyIdToken.ts` (for the criterion-5 shape) | **role-match** (different runtime, same reviewed pattern) |
| `.../invite-candidate/index.ts` (MODIFIED — `:81`, `:131`) | controller | request-response | its own sibling `send-email/index.ts` (byte-identical `atob` line) | **exact** |
| `.../send-email/index.ts` (MODIFIED — `:111`, `:174-176`, `:210`, `:211`, `:234`) | controller | request-response | `invite-candidate/index.ts` | **exact** |
| `155-NEGATIVE-CONTROL-LEDGER.md` (NEW, phase dir) | documentation | — | `.planning/phases/142.1-…/142.1-NEGATIVE-CONTROL-LEDGER.md` | **exact** |
| `.env.example` (MODIFIED — 6-7 missing vars) | config | — | — | **no analog** (data, not structure) |
| `tests/IDURA-TEST-RUNBOOK.md` (MODIFIED) | documentation | — | itself (in-place edit) | n/a |

---

## Pattern Assignments

### 1. `verifyConfig.ts` / `jwtSegment.ts` / `templateVars.ts` / `envConfig.ts` (utility, transform)

**Analog:** `apps/supabase/supabase/functions/identity-callback/claimConfig.ts` — the ONLY URL-import-free sibling module in the tree, and the only Edge-Function code vitest reaches today.

**Docstring pattern — state the contract that makes it testable** (`claimConfig.ts:1-8`, verbatim):

```ts
/**
 * Provider claim configuration and extraction logic.
 *
 * Pure functions extracted from the identity-callback Edge Function for
 * testability. This module has NO Deno imports (no Deno.env, no Deno.serve,
 * no URL imports from deno.land) so it can be imported by both the Edge
 * Function and vitest.
 */
```

Every new module in this phase MUST open with a docstring making the same declaration. This sentence is the module's reason to exist; a new module without it reads as an arbitrary split.

**Export shape** (`claimConfig.ts` — exports measured at `:14`, `:42`, `:66`):

```
14:export interface ProviderClaimConfig {
42:export const PROVIDER_CONFIGS: Record<string, ProviderClaimConfig> = {
66:export function extractIdentityClaims(
```

Named exports only; no default export; interface first, then data, then functions. No barrel file (Edge Function directories have none).

**Rationale-carrying doc comment above the exported constant** (`claimConfig.ts:30-41`, excerpt) — the house voice for "why this value, and what breaks if you change it":

```ts
 * `identityMatchProp` MUST name a claim that is unique per person. It is not merely a
 * lookup hint: its value becomes `app_metadata.identity_match_value` (the key
 * `findUserByIdentityMatch` matches on) AND the local part of the placeholder email the
 * auth user is created with, so two people whose claim values collide resolve to ONE
 * Supabase account -- the second to authenticate is silently logged in as the first.
 * Signicat was keyed on `birthdate` until Phase 142.1, which made that a certainty for
 * any realistic candidate population rather than a corner case. Never key on a claim
 * that is not an identifier.
```

This is where criterion 4's Signicat `sub`-stability citation belongs (CONTEXT gives the planner discretion; this docstring is the file a future reader opens, and it already carries exactly this kind of prose). Note the `--` em-dash-as-double-hyphen convention in force in this file.

**Import asymmetry — the load-bearing detail:**

```ts
// Deno side, .ts suffix REQUIRED — apps/supabase/supabase/functions/identity-callback/index.ts:29
import { PROVIDER_CONFIGS, extractIdentityClaims } from './claimConfig.ts';

// vitest side, NO extension — .../identity-callback/claimConfig.test.ts:11-12
import { describe, it, expect } from 'vitest';
import { PROVIDER_CONFIGS, extractIdentityClaims } from './claimConfig';
```

Both resolve; the 20 passing tests prove it. Copy this asymmetry exactly for every new module.

---

### 2. `*.test.ts` beside an Edge Function (test, unit)

**Analog:** `apps/supabase/supabase/functions/identity-callback/claimConfig.test.ts`

**Test-file docstring pattern** (`:1-9`, verbatim):

```ts
/**
 * Edge Function claim configuration and extraction tests.
 *
 * Tests the pure functions extracted from the identity-callback Edge Function.
 * Covers PROVIDER_CONFIGS for both Signicat and Idura, and extractIdentityClaims
 * behavior with various payloads (from).
 *
 * No mocks needed -- claimConfig.ts has no external dependencies.
 */
```

**Test body pattern — the assertion carries the WHY in a comment** (`:14-35`, verbatim):

```ts
describe('PROVIDER_CONFIGS', () => {
  describe('signicat', () => {
    it('uses sub for identity matching (stable OIDC subject)', () => {
      // NOT `birthdate`. See the collision test at the bottom of this file for what
      // that cost: `identityMatchProp`'s value is the account key, so a non-identifier
      // claim merges distinct people into one auth user.
      expect(PROVIDER_CONFIGS.signicat.identityMatchProp).toBe('sub');
    });
    ...
    it('still captures birthdate, as metadata rather than as the key', () => {
      // Re-keying to `sub` must not LOSE the claim -- it moves it from the account key
      // to app_metadata.
      expect(PROVIDER_CONFIGS.signicat.extractClaims).toEqual(['birthdate']);
    });
```

Nested `describe` per exported symbol → per variant; `it` names state the property, not the mechanism. The premise-guard assertions RESEARCH mandates (`expect(/[-_]/.test(seg), '…').toBe(true)`) fit this convention: they are assertions with a message, in the same body.

**Zero configuration needed** — `apps/supabase/vitest.config.ts` (whole file):

```ts
import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    globals: true,
    environment: 'node',
    include: ['supabase/functions/**/*.test.ts']
  }
});
```

`apps/supabase/package.json` declares `"test:unit": "vitest run"` and `devDependencies: { supabase, vitest }` (both `catalog:`). Any new `*.test.ts` under the functions tree is collected automatically. If a test imports `jose`, add it to these `devDependencies` (RESEARCH Pitfall 5 — today it only resolves via the root hoist).

---

### 3. `scripts/assert-edge-env-defaults.mjs` (config/build guard, batch static scan)

**Analog:** `scripts/assert-a11y-scan-wiring.mjs` (siblings: `assert-unit-test-coverage.mjs`, `assert-i18n-catalog-namespaces.mjs` — three committed precedents, `scripts/` contains nothing else).

**Header pattern** (`:1-59`, structure + excerpts):

```js
#!/usr/bin/env node

/**
 * A11Y-SCAN WIRING GUARD (phase 147, requirements CSCAN-02 / CSCAN-03).
 *
 * The incident this file exists for: ...
 *
 * FOUR checks, each a distinct way that green-but-blind could reoccur:
 *
 *   Check 1 (CSCAN-02a) — ...
 *
 * This is a plain text/regex read of the three source files, matching the
 * house style of `scripts/assert-unit-test-coverage.mjs` (Node built-ins
 * only, no build step, exit 1 naming the specific problem). It is
 * deliberately NOT an AST parse: these are single-sourced, hand-authored
 * config/source files with one occurrence of each pattern, and a regex read
 * is the cheapest thing that can name the violation precisely.
 *
 * Usage:
 *   node scripts/assert-a11y-scan-wiring.mjs
 *
 * Exit codes:
 *   0 - all four checks clean
 *   1 - at least one violation, or a named precondition failure (a file
 *       missing or unreadable)
 */
```

Mandatory header elements to copy: shebang · title line naming the phase and requirement IDs (here: `EDGE ENV-DEFAULT GUARD (phase 155, requirement REVIEW-EDGE-02)`) · "the incident this file exists for" paragraph · enumerated checks · the "plain regex read, deliberately not an AST parse" justification · `Usage:` · `Exit codes:`.

**Imports, SELF, REPO_ROOT, fail-closed read** (`:60-82`, verbatim):

```js
import { readFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const SELF = 'scripts/assert-a11y-scan-wiring.mjs';
const REPO_ROOT = path.resolve(fileURLToPath(import.meta.url), '..', '..');

const PLAYWRIGHT_CONFIG = path.resolve(REPO_ROOT, 'tests', 'playwright.config.ts');
...

function readSource(filePath) {
  try {
    return readFileSync(filePath, 'utf8');
  } catch (error) {
    console.error(
      `[ERROR] ${SELF}: could not read '${path.relative(REPO_ROOT, filePath)}' (${error.message}). ` +
        'A file this guard cannot read is wiring it cannot verify — this fails closed.'
    );
    return null;
  }
}
```

Node built-ins ONLY (no build step: the guard must run before anything is built). `REPO_ROOT` derived from `import.meta.url`, never from CWD.

**`main()` / violation accounting** (`:84-99`, verbatim):

```js
function main() {
  const configSrc = readSource(PLAYWRIGHT_CONFIG);
  ...
  if (configSrc === null || axeScanSrc === null || a11ySmokeSrc === null || candidateA11ySrc === null) {
    process.exitCode = 1;
    return;
  }

  let violations = 0;
  const violate = (message) => {
    violations++;
    console.error(`[ERROR] ${SELF}: ${message}`);
  };
```

**Violation-message voice — say WHY, not just WHAT** (`:105-110`, verbatim):

```js
    violate(
      "tests/playwright.config.ts no longer declares a 'candidate-a11y-scan' project (or its shape " +
        'changed enough that this guard cannot find it). Losing this project drops 14 candidate a11y ' +
        'scans from the suite silently (CSCAN-02).'
    );
```

Each message: what changed · what it costs · the requirement ID in parentheses. String concatenation over template literals for multi-line prose.

**Terminal lines** (file tail, verbatim):

```js
  console.log(`A11y-scan wiring guard (phase 147: CSCAN-02, CSCAN-03) — ${violations} violation(s).`);
  process.exitCode = violations > 0 ? 1 : 0;
}

main();
```

Note `process.exitCode`, never `process.exit()`.

**The `lint:check` chain line — exact current value** (root `package.json`, verbatim):

```
"assert:unit-coverage": "node scripts/assert-unit-test-coverage.mjs",
"assert:i18n-catalog-namespaces": "node scripts/assert-i18n-catalog-namespaces.mjs",
"assert:a11y-scan-wiring": "node scripts/assert-a11y-scan-wiring.mjs",
"test:unit": "yarn assert:unit-coverage && turbo run test:unit",
"lint:check": "turbo run lint && eslint --flag v10_config_lookup_from_file tests && yarn typecheck:tests && yarn typecheck && yarn assert:i18n-catalog-namespaces && yarn assert:a11y-scan-wiring",
```

The new link is appended to `lint:check` in the same `yarn assert:<name>` form. (`assert:unit-coverage` is chained into `test:unit`, not `lint:check` — do not follow that one; this guard gates source shape, like the other two.) `test:e2e` also chains the two source-shape guards; the planner should decide explicitly whether to add the new one there too, matching the existing pair or deliberately not.

---

### 4. Chain-membership assertion (test, repo-meta unit)

**Analog:** `packages/dev-seed/tests/ciTypecheckGate.test.ts:72-88`, verbatim:

```ts
  it('keeps `yarn typecheck` a blocking link of lint:check — the local-DX half', () => {
    // Deliberately redundant with the CI step above and load-bearing locally:
    // it is what makes `turbo run typecheck` blocking for a developer running
    // `yarn lint:check`. Asserted so a future reader deleting the "redundant"
    // link has to come here and read why it is not.
    //
    // The invariant is MEMBERSHIP of the `&&` chain, not terminal position:
    // every link after it is equally aborted by a type failure, so guards may
    // be appended freely. Asserting `endsWith` instead made this test fail the
    // moment Phase 147 appended its two scan guards — a correct change the
    // over-specified assertion had no business rejecting.
    const links = ROOT_PACKAGE_JSON.scripts['lint:check'].split('&&').map((link) => link.trim());
    expect(links).toContain('yarn typecheck');
    expect(ROOT_PACKAGE_JSON.scripts['lint:check']).toContain('yarn typecheck:tests');
    expect(ROOT_PACKAGE_JSON.scripts.typecheck).toBe('turbo run typecheck');
  });
```

**Repo-root resolution in that file** (`:33-40`, verbatim):

```ts
import { readFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';

const HERE = dirname(fileURLToPath(import.meta.url));
/** `packages/dev-seed/tests` → repo root. */
const REPO_ROOT = resolve(HERE, '../../..');
```

**Why it lives in `packages/dev-seed`** (`:19-27`, verbatim — the planner needs this to decide where the new assertion goes):

```
 * `yarn test:unit` is `turbo run test:unit`, so a repo-meta spec needs a package to run in,
 * and this package already reads repo-root files from its tests — ...
```

Note: this phase now HAS a repo-meta-capable workspace of its own (`@openvaa/supabase` runs vitest), but its `include` is `supabase/functions/**/*.test.ts`, so a root-`package.json` assertion cannot live there without widening the include. Extending `ciTypecheckGate.test.ts` or adding a sibling under `packages/dev-seed/tests/` is the lower-friction option and the one the existing precedent supports.

---

### 5. `identity-callback/index.ts` criterion-5 rewrite (controller, request-response)

**Analog:** `apps/frontend/src/lib/api/utils/auth/decryptAndVerifyIdToken.ts` — Phase 142.1's already-reviewed fail-closed shape.

**Coded, opaque unconfigured-throw** (`decryptAndVerifyIdToken.ts:83-113`, verbatim):

```ts
  get audience(): string {
    const audience = publicConstants.PUBLIC_IDENTITY_PROVIDER_CLIENT_ID;
    if (!audience) {
      // Opaque identifier only -- per this module's standing bar the message names neither
      // the configured audience nor the env var's value.
      throw Object.assign(new Error('Cannot verify ID token: no expected audience is configured.'), {
        code: 'ERR_AUDIENCE_UNCONFIGURED'
      });
    }
    return audience;
  },
  /**
   * FAILS CLOSED when unset, for exactly the reason spelled out on {@link audience} above:
   * `IDENTITY_PROVIDER_ISSUER` is `?? ''`-defaulted, and jose's `if (issuer && …)` value
   * comparison is skipped for `''` while the presence check still passes. Without this,
   * an unset issuer meant any signature-valid token bound to no provider at all.
   *
   * A getter for the same reason as {@link audience}: the throw must land on read, inside the
   * provider's `try`, so it carries a `code`.
   */
  get issuer(): string {
    const issuer = constants.IDENTITY_PROVIDER_ISSUER;
    if (!issuer) {
      // Opaque identifier only -- the configured issuer is NOT echoed.
      throw Object.assign(new Error('Cannot verify ID token: no expected issuer is configured.'), {
        code: 'ERR_ISSUER_UNCONFIGURED'
      });
    }
    return issuer;
  }
};
```

**Structural (not positional) re-check on the call path** (`decryptAndVerifyIdToken.ts:152-182`, verbatim):

```ts
  // Re-check on the CALL PATH, not only in `defaultOptions`' getters. jose binds a token to
  // a relying party only when these are TRUTHY: `jwt_claims_set.js` pushes a presence check
  // when the option is `!== undefined`, but compares the VALUE only under `if (audience && …)`
  // / `if (issuer && …)`. So `''` -- and `undefined` even more so -- accepts any token signed
  // by a key in the configured JWK set, including one minted for a different relying party.
  //
  // The getters alone make that guard POSITIONAL: they fire only for callers who take
  // `defaultOptions`. Both production callers do today, but `DecryptAndVerifyOptions` declares
  // `audience?`/`issuer?` optional, so an explicit options object omitting them would silently
  // buy no binding at all. Validating here makes the guard structural -- it holds for every
  // caller, whatever options they pass.
  const audience = options.audience;
  const issuer = options.issuer;

  if (!audience) {
    // Opaque identifier only -- the configured audience is NOT echoed.
    throw Object.assign(new Error('Cannot verify ID token: no audience is configured.'), {
      code: 'ERR_AUDIENCE_UNCONFIGURED'
    });
  }

  if (!issuer) {
    // Opaque identifier only -- the configured issuer is NOT echoed.
    throw Object.assign(new Error('Cannot verify ID token: no issuer is configured.'), {
      code: 'ERR_ISSUER_UNCONFIGURED'
    });
  }
```

**Carry across:** the `Object.assign(new Error(...), { code })` shape; the identical code strings `ERR_AUDIENCE_UNCONFIGURED` / `ERR_ISSUER_UNCONFIGURED`; the `// Opaque identifier only --` comment discipline (never echo the configured value); validation on the path that calls `jose.jwtVerify`.
**Do NOT carry:** the getter-object shape — it exists because the frontend passes an options object through providers. The Edge Function reads `Deno.env.get` inline in one function; a plain exported function in `verifyConfig.ts` is the right adaptation (RESEARCH § "Recommended extraction").

---

### 6. Current state of the three Edge Functions — every site this phase touches

#### `apps/supabase/supabase/functions/identity-callback/index.ts`

`:16-24` — the docstring whose "(checked when set)" and "defaults to 'signicat'" become FALSE this phase:

```ts
 * Environment variables (set via Supabase secrets):
 * - IDENTITY_PROVIDER_TYPE: Provider type ('signicat' or 'idura', defaults to 'signicat')
 * - IDENTITY_PROVIDER_DECRYPTION_JWKS: JSON string array of private JWK objects for JWE decryption
 * - IDENTITY_PROVIDER_JWKS_URI: URL to the provider's public JWKS endpoint for JWT signature verification
 * - IDENTITY_PROVIDER_CLIENT_ID: Expected audience in the JWT (checked when set)
 * - IDENTITY_PROVIDER_ISSUER: Expected issuer of the JWT (checked when set)
 * - DEFAULT_PROJECT_ID: Project to assign self-registered candidates to
 * - SUPABASE_URL: Supabase project URL (auto-set by Supabase)
 * - SUPABASE_SERVICE_ROLE_KEY: Service role key for admin operations (auto-set by Supabase)
 */
```

`:27-31` — imports and the **Phase-161-owned constant** (READ CONTEXT ONLY — 155 must NOT change `:31`):

```ts
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import * as jose from 'https://deno.land/x/jose@v5.9.6/index.ts';
import { PROVIDER_CONFIGS, extractIdentityClaims } from './claimConfig.ts';

const DEFAULT_SEED_PROJECT_ID = '00000000-0000-0000-0000-000000000001';
```

`:70-92` — `verifyJwt`, the criterion-5 defect **and its own written justification**, verbatim:

```ts
async function verifyJwt(jwt: string): Promise<jose.JWTPayload> {
  const jwksUri = Deno.env.get('IDENTITY_PROVIDER_JWKS_URI')!;
  const clientId = Deno.env.get('IDENTITY_PROVIDER_CLIENT_ID');
  const issuer = Deno.env.get('IDENTITY_PROVIDER_ISSUER');

  const verifyOptions: jose.JWTVerifyOptions = {};
  if (clientId) {
    verifyOptions.audience = clientId;
  }
  // The issuer check is what binds a signature-valid token to the provider we
  // configured. The frontend's equivalent verifier already applies it
  // (lib/api/utils/auth/decryptAndVerifyIdToken.ts, reached via
  // providers/{idura,signicat}.ts), and this
  // function is reachable directly at /functions/v1/identity-callback without
  // passing through it, so omitting it here left the weaker of the two paths
  // publicly callable. Applied only when configured, matching how `audience` is
  // handled above, so a deployment that has not set IDENTITY_PROVIDER_ISSUER keeps
  // its current behaviour instead of failing closed on upgrade.
  if (issuer) {
    verifyOptions.issuer = issuer;
  }

  const { payload } = await jose.jwtVerify(jwt, jose.createRemoteJWKSet(new URL(jwksUri)), verifyOptions);
```

The comment at `:79-87` argues FOR the defect — it must be replaced in the same edit, not merely contradicted by the code below it.

`:169` (criterion-2 site 1), with the adjacent unknown-provider branch that its throw must read as one story with:

```ts
    const providerType = Deno.env.get('IDENTITY_PROVIDER_TYPE') ?? 'signicat';
    const config = PROVIDER_CONFIGS[providerType];
    if (!config) {
      return new Response(JSON.stringify({ error: `Unknown identity provider type: ${providerType}` }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }
```

`:197` (criterion-2 site 2, the D-D3 boundary — collapse operands 2 and 3 into a throw naming `DEFAULT_PROJECT_ID`; keep `project_id` first; do NOT rename):

```ts
    const projectId = project_id || Deno.env.get('DEFAULT_PROJECT_ID') || DEFAULT_SEED_PROJECT_ID;
```

`:355-362` (criterion-2 site 3 — note `:355` is an unrelated `!` site, out of scope):

```ts
    const siteUrl = Deno.env.get('SUPABASE_URL')!.replace(/\/+$/, '');

    const { data: linkData, error: linkError } = await supabaseAdmin.auth.admin.generateLink({
      type: 'magiclink',
      email: placeholderEmail,
      options: {
        redirectTo: `${Deno.env.get('SITE_URL') || 'http://127.0.0.1:5173'}/candidate`
      }
    });
```

#### `apps/supabase/supabase/functions/invite-candidate/index.ts`

`:79-89` (criterion-1 site; note `payload.user_roles || []` at `:82` is a legitimate absent-claim default and is NOT a criterion-2 site):

```ts
    // Decode JWT to check roles from claims (Custom Access Token Hook)
    const token = authHeader.replace('Bearer ', '');
    const payload = JSON.parse(atob(token.split('.')[1]));
    const userRoles: Array<{ role: string; scope_type: string; scope_id: string }> = payload.user_roles || [];

    const isAdmin = userRoles.some(
      (r) =>
        r.role === 'super_admin' ||
        r.role === 'account_admin' ||
        (r.role === 'project_admin' && r.scope_type === 'project' && r.scope_id === projectId)
    );
```

`:131-132` (criterion-2 site 7 — the silent wrong-host default):

```ts
    const siteUrl = Deno.env.get('SITE_URL') || Deno.env.get('SUPABASE_URL');
    const redirectTo = `${siteUrl}/candidate/complete-registration`;
```

#### `apps/supabase/supabase/functions/send-email/index.ts`

`:109-115` (criterion-1 site — `:111` is byte-identical to `invite-candidate:81`):

```ts
    // Decode JWT to check roles from claims (Custom Access Token Hook)
    const token = authHeader.replace('Bearer ', '');
    const payload = JSON.parse(atob(token.split('.')[1]));
    const userRoles: Array<{ role: string; scope_type: string; scope_id: string }> = payload.user_roles || [];

    const isAdmin = userRoles.some(
      (r) => r.role === 'super_admin' || r.role === 'account_admin' || r.role === 'project_admin'
    );
```

`:172-176` (criterion 3 — the regex, and at `:174` the misleading comment D-D4 requires be corrected in the same edit):

```ts
      const vars: Record<string, string> = recipient.variables || {};

      // Replace {{variable.path}} placeholders with resolved values
      const replaceVars = (text: string): string =>
        text.replace(/\{\{(\w+(?:\.\w+)*)\}\}/g, (_match, key) => vars[key] ?? _match);
```

`:210-234` (criterion-2 sites 4, 5, 6 — note `:212-213` `SMTP_USER`/`SMTP_PASS` have NO default and are correctly optional; the `else` block at `:222-229` is an existing, well-commented conditional the throws must not disturb):

```ts
    const smtpHost = Deno.env.get('SMTP_HOST') || 'inbucket';
    const smtpPort = parseInt(Deno.env.get('SMTP_PORT') || '2500');
    const smtpUser = Deno.env.get('SMTP_USER');
    const smtpPass = Deno.env.get('SMTP_PASS');
    ...
    const senderAddress = from || Deno.env.get('SMTP_FROM') || 'noreply@openvaa.org';
```

`from` is a request-body field and stays the first operand; only the second `||` collapses.

---

### 7. `155-NEGATIVE-CONTROL-LEDGER.md` (documentation)

**Analog:** `.planning/phases/142.1-provider-getidtokenclaims-duplication-make-a-07-reach-produc/142.1-NEGATIVE-CONTROL-LEDGER.md` (the milestone's most recent and most complete instance; `137-NEGATIVE-CONTROL.md` is the prose-narrative ancestor, and there are eight further siblings under `.planning/phases/{138,140,142,143,144,145,146,147}-*`). The format is a **living precedent chain**; reuse, do not invent.

**Preamble block to copy** (`142.1-…-LEDGER.md:5-20`, structure, verbatim keys):

```
- **Phase:** 142.1 (provider-getidtokenclaims-duplication-make-a-07-reach-produc)
- **Requirement:** ASSERT-11
- **Opened by:** `142.1-01-PLAN.md` (wave 1). ...
- **Corpus:** exactly **8 pairs** (**D-18**) — ...
- **Protocol source:** `139-VERDICTS.md` § 3.1 HYGIENE-LOOP, reused verbatim ...
- **Baseline for OLD halves:** none inherited. **`cited` is not a legal value in any cell of this ledger** ...
- **HEAD at ledger creation:** `e936f3bbc` — branch `feat-gsd-roadmap`. ...
- **Machine:** developer Mac, host Node + host vitest via `npx` ... macOS 26.5.1 arm64 / Darwin 25.5.0 / Node v24.14.1.
- **Resolved `$TMPDIR`:** ... a log path that cannot be resolved later is not evidence.
- **Clean-tree baseline, measured this session at `e936f3bbc`:** ...
- **The untouched control (D-02d):** ...
- **Decisions discharged:** ...
- **Precedent followed:** `.planning/phases/142-…/142-NEGATIVE-CONTROL-LEDGER.md` is this ledger's **template**
```

**Row table header** (`:198-199`, verbatim):

```
| # | Finding | Site | Injection source (…-RESEARCH § 6.2) | OLD half (measured) | NEW-assertion outcome | File outcome | Collateral | Verdict |
|---|---------|------|----------------------------|-------------------------|-----------------------|--------------|------------|---------|
```

Per-cell conventions the planner must preserve: each half records its own HEAD + a resolvable log path; `GREEN (blind) ✅` / `FAIL (red) ✅ — and the red IS the evidence` verdict vocabulary; a `Collateral` column that is pre-registered before the run; a row with an unrun NEW half stays `pending` and carries NO verdict.

For 155 the natural corpus is three rows (criteria 1, 3, 5) — fixture · pre-fix observation · post-fix observation · the test file that now holds it. RESEARCH has already measured the pre-fix halves of criteria 1 and 5 (`atob` `InvalidCharacterError`; `jose.jwtVerify(jwt, key, {})` → ACCEPTED), so those rows can cite this session — but per the 142.1 rule, a ledger may only inherit a half that was actually recorded, so RESEARCH's measurement must be re-run and recorded by the phase's own plan rather than quoted as `cited`.

---

## Shared Patterns

### Comment voice (applies to every file this phase writes)

**Source:** `claimConfig.ts:30-41`, `claimConfig.test.ts:16-19`, `decryptAndVerifyIdToken.ts:152-165`, `ciTypecheckGate.test.ts:73-82`, `send-email/index.ts:222-226`.
**Apply to:** all new modules, tests, throws, and the guard script.

Established conventions, all observed in-tree:
- `--` for an em dash (not `—`) inside `.ts` source comments; `—` is used in `.mjs` guard output strings and in `.md`.
- A comment states the CONSEQUENCE of getting it wrong, and names the phase/requirement where one exists.
- Security-sensitive comments state the bar explicitly (`// Opaque identifier only -- the configured issuer is NOT echoed.`).
- Per D-N1, Phase 152's comment scan is NOT yet wired (verified: `lint:check` above contains no comment-scan link). Write to the convention manually; do not rely on a gate.

### Error handling / non-disclosure bar (Edge Functions)

**Source:** `identity-callback/index.ts:171-176` (the `Unknown identity provider type` 500) and the `catch` blocks at `:206-213, 226-233, 242-249`.
**Apply to:** every new throw in the three Edge Functions.

The file's standing bar: log the real error, return a fixed opaque string. A throw naming a missing environment variable is correct in the `Error` and in the log; the variable name must NOT reach the HTTP response body.

### Env read at the boundary, validation in the pure module

**Source:** none in-tree — see § No Analog Found. The shape RESEARCH recommends (`requireEnv(name, value)` taking BOTH the name and the value so the module never touches `Deno`) is new, and is a direct consequence of the `claimConfig.ts` no-Deno-imports contract quoted above.

---

## No Analog Found

| File | Role | Data Flow | Reason |
|------|------|-----------|--------|
| `envConfig.ts` `requireEnv()` throwing accessor | utility | validation | **No `requireEnv`-style throwing env accessor exists anywhere in the repo.** Searched `apps`, `packages`, `scripts`, `tests` for `requireEnv`, `assertEnv`, `Missing required environment`, `missing environment variable` — zero hits outside `.planning/`. The closest behavioural relatives are the frontend's `get audience()` / `get issuer()` getters in `decryptAndVerifyIdToken.ts:83-113` (quoted above), which throw on unconfigured values with a `code`, but read module constants rather than an environment and use a getter-object shape RESEARCH explicitly says not to copy. The planner is inventing this helper; base its error shape on the `Object.assign(new Error(...), { code })` convention above and its module contract on `claimConfig.ts:1-8`. |
| `.env.example` additions | config | — | Content, not structure. RESEARCH measured six of seven variables absent and two present only under a `PUBLIC_` prefix; there is no in-repo "unprefixed Edge Function block" to imitate — the phase creates the first one. |

**Also deliberately without an analog, by scope boundary:** there is no `_shared/` directory under `apps/supabase/supabase/functions/` (measured — the tree contains exactly five files: `identity-callback/{index,claimConfig,claimConfig.test}.ts`, `invite-candidate/index.ts`, `send-email/index.ts`). Two `jwtSegment.ts` copies with cross-reference comments is the pattern-consistent choice; introducing `_shared/` would be a new convention needing its own decision.

---

## Boundaries Respected

- `identity-callback/index.ts:31` (`DEFAULT_SEED_PROJECT_ID`) is quoted above as **read-context only**. Phase 161 owns it; no pattern in this document targets it.
- The duplicated fourth ID-token-verifier copy is **not** proposed for collapse. `decryptAndVerifyIdToken.ts` is mapped strictly as a *shape to mirror* (error codes, opacity, structural placement), never as a module to import from Deno.
- `config.toml` ports are not mapped; Phase 156 criterion 8 owns them.

---

## Metadata

**Analog search scope:** `apps/supabase/supabase/functions/`, `apps/supabase/` (config + manifest), `apps/frontend/src/lib/api/utils/auth/`, `scripts/`, `packages/dev-seed/tests/`, root `package.json`, `.planning/phases/*/`.
**Files scanned:** 16 read; ~5 greps across `apps`, `packages`, `scripts`, `tests`, `.planning`.
**Pattern extraction date:** 2026-08-28
