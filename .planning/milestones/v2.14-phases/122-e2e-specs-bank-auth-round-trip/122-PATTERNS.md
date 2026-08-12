# Phase 122: E2E Specs — Bank-Auth Round-Trip - Pattern Map

**Mapped:** 2026-06-17
**Files analyzed:** 8 (2 modify, 6 new)
**Analogs found:** 8 / 8 (every load-bearing artifact has a real in-repo analog; Phase 122 is assembly + retarget, not net-new infra)

> The locked decisions (Option-B mock issuer, `perm-not-located-2e2cg` reuse, `buildTestIdToken` extraction, deterministic-green JWKS gate) are taken as given. This document maps them to concrete code; it does NOT re-litigate them. The single genuinely-new artifact is the ~40-line mock OIDC issuer (RESEARCH §Code Examples already gives its skeleton).

## File Classification

| New/Modified File | Role | Data Flow | Closest Analog | Match Quality |
|-------------------|------|-----------|----------------|---------------|
| `tests/tests/utils/buildTestIdToken.ts` (NEW) | utility | transform | in-spec `buildTestIdToken`/`generateTestKeys` in `candidate-bank-auth.spec.ts:60-111` | exact (extraction) |
| `tests/tests/specs/candidate/candidate-bank-auth.spec.ts` (MODIFY) | test (Edge-Function seam) | request-response | itself (retarget) + `candidate-journey.spec.ts` for `beforeAll` discipline | exact |
| `tests/tests/specs/candidate/candidate-bank-auth-journey.spec.ts` (NEW) | test (full-browser journey) | event-driven / request-response | `candidate-journey.spec.ts` (serial `test.step` walk + email round-trip) | exact (role + flow) |
| `tests/tests/fixtures/candidate/candidatePreregisterPage.fixture.ts` (NEW) | fixture (page-object) | request-response | `candidatePasswordSetter.fixture.ts` + `candidateProfilePage.fixture.ts` | exact (convention) |
| `tests/tests/support/mockOidcIssuer.ts` (NEW) | utility / local test server | request-response | `emailBucket.fixture.ts` (self-contained REST plumbing) + RESEARCH skeleton | partial (no existing local HTTP server; closest is the raw-`fetch` REST helper shape) |
| `tests/playwright.config.ts` (MODIFY) | config | — | the opt-in `bank-auth` project block (`:170-180`) + perm setup/teardown wiring (`:485-503`) | exact |
| `tests/tests/setup/candidate/bank-auth-journey.setup.ts` (NEW) | setup | batch (seed) | `perm-not-located-2e2cg.setup.ts` + `candidate-journey.setup.ts` | exact |
| `tests/tests/setup/candidate/bank-auth-journey.teardown.ts` (NEW) | teardown | batch | `perm-not-located-2e2cg.teardown.ts` + `candidate-journey.teardown.ts` | exact |

> NOTE on file placement: RESEARCH put the journey setup/teardown under `setup/candidate/` and the seed reuse points at the perm template. The perm setup/teardown analogs live under `setup/perm/`; the planner should pin ONE directory at build (CONTEXT D-04 reuses the perm *template*, not the perm *chain* — the opt-in project stands alone like `bank-auth`, so `setup/candidate/` is consistent with the journey-owned-isolated intent).

## Pattern Assignments

### `tests/tests/utils/buildTestIdToken.ts` (utility, transform — D-03)

**Analog:** the in-spec functions at `tests/tests/specs/candidate/candidate-bank-auth.spec.ts:60-111` (move verbatim; parameterize `iss`/`aud` per Pitfall 4).

**Why:** This IS the extraction. Both consumers (EFLOW-10 spec + the mock issuer's token endpoint) must share ONE builder. `utils/` is the established home for cross-spec shared helpers (`testIds.ts`, `testCredentials.ts`, `candidateJourneyConstants.ts`, `supabaseAdminClient.ts` all live there with named exports, no default).

**Key extraction excerpt** (`spec:88-111`) — keep the kid contract (`test-sig-1`/`test-enc-1`) and add `opts` param:
```typescript
export async function buildTestIdToken(
  claims: Record<string, string>,
  sigPriv: CryptoKey,          // jose v6: WebCrypto CryptoKey (NOT KeyLike)
  encPubJwk: jose.JWK,
  opts: { issuer: string; audience: string } = { issuer: 'https://test-idp.example.com', audience: 'test-client-id' }
) {
  const innerJwt = await new jose.SignJWT(claims)
    .setProtectedHeader({ alg: 'RS256', kid: 'test-sig-1' })
    .setIssuer(opts.issuer).setAudience(opts.audience)
    .setExpirationTime('5m').setIssuedAt().sign(sigPriv);
  const encKey = await jose.importJWK(encPubJwk, 'RSA-OAEP-256');
  return new jose.CompactEncrypt(new TextEncoder().encode(innerJwt))
    .setProtectedHeader({ alg: 'RSA-OAEP-256', enc: 'A256GCM', kid: 'test-enc-1' })
    .encrypt(encKey);
}
```
**Also extract `generateTestKeys`** (`spec:60-82`) — but per RESEARCH A2/Open-Q3, the RECOMMENDED determinism path is a FIXED committed test key pair (enc+sig JWKs under `tests/`) that `generateTestKeys` returns and the served Edge Function env / mock issuer reference, rather than per-run `jose.generateKeyPair`. Pin at build.

**Export convention** (mirror `utils/*.ts`): named `export function` / `export const`, relative import `import { testIds } from '../../utils/testIds'` style from consumers (`import { buildTestIdToken } from '../../utils/buildTestIdToken'`). No `.js` extension on TS-internal relative imports.

---

### `tests/tests/specs/candidate/candidate-bank-auth.spec.ts` (test, request-response — MODIFY, EFLOW-10)

**Analog:** itself. The structure stays: `test.describe(..., { tag: ['@bank-auth'] })`, `test.describe.configure({ mode: 'serial' })`, `adminClient = createClient(...)`, `beforeAll` probe, `afterAll` cleanup (`spec:185-193` already deletes `user_roles`→`candidates`→`auth.users`).

**Two changes only:**

1. **Retarget assertions to the Idura sub-match model** (replace the generic `toBeTruthy` block at `spec:226-228`). Target excerpt (RESEARCH §Code Examples):
```typescript
expect(user?.app_metadata?.identity_provider).toBe('idura');
expect(user?.app_metadata?.identity_match_prop).toBe('sub');
expect(user?.app_metadata?.identity_match_value).toBe(TEST_IDENTITY.sub);
expect(user?.app_metadata?.hetu).toBe(TEST_IDENTITY.hetu);
expect(user?.app_metadata?.country).toBe(TEST_IDENTITY.country);
expect(user?.app_metadata?.birthdate).toBe(TEST_IDENTITY.birthdate);
```
Drop the Signicat-path assertions. `TEST_IDENTITY` (`spec:43-51`) already carries `sub`/`hetu`/`country`/`birthdate` — no new fixture needed.

2. **Deterministic-green gate (D-02):** the keys-configured create path must RUN every run, never `test.skip`. The existing `beforeAll` probe (`spec:139-183`) builds a synthetic token and POSTs to `/functions/v1/identity-callback`; today `keysConfigured` can be false → the keys-configured test `test.skip`s (`spec:201`). The fix is to GUARANTEE the served Edge Function has `IDENTITY_PROVIDER_DECRYPTION_JWKS` set to the test `encPrivJwk` (the spec's own comment at `spec:147-150` documents the `supabase secrets set ...` path). With a FIXED test key pair, `keysConfigured` is always true → the create path always runs.

**`beforeAll` discipline analog** (for any new env/key setup): `candidate-journey.spec.ts:298-300` `test.beforeAll` (builds a fixture once) + this spec's existing `beforeAll:139` (probes once, captures both modes). Use the same single-probe-then-assert pattern; do NOT add per-test env mutation.

**Rigidity:** spec retains its `// reason:` + `// eslint-disable-next-line playwright/no-skipped-test` annotations on any remaining precondition skips; the keys-configured test loses its skip entirely (that's the point of D-02).

**Run command (document in spec header):**
```bash
PLAYWRIGHT_BANK_AUTH=1 FRONTEND_PORT=5174 npx playwright test --project=bank-auth -c tests/playwright.config.ts
# Edge Functions served with test JWKS:
cd apps/supabase/supabase && npx supabase functions serve identity-callback --no-verify-jwt --env-file <env-with-test-JWKS>
```

---

### `tests/tests/specs/candidate/candidate-bank-auth-journey.spec.ts` (test, full-browser journey — NEW, EFLOW-10b)

**Analog:** `tests/tests/specs/candidate/candidate-journey.spec.ts` — the canonical multi-step candidate journey. Copy its SHAPE exactly:
- ONE `test.describe('...', { tag: [...] })` + `test.describe.configure({ mode: 'serial' })` (`spec:293-294`).
- `test.use({ storageState: { cookies: [], origins: [] } })` to start UNAUTHENTICATED (`spec:291`) — the bank-auth flow mints its own session.
- ONE long `test('...', async ({ page, emailBucket, ...pageObjects }) => {...})` with named `await test.step('N. ...', ...)` segments (`spec:307-790`).
- `test.setTimeout(TIMEOUTS.testMax)` at the top of the test body (`spec:321`).
- Module-scope helpers (NOT inline `if`) for any conditional dispatch, per `playwright/no-conditional-in-test` (`spec:206-288` `walkRemainingOpinionQuestions` / `loginIfRedirectedToLoginPage`).

**Email round-trip (registration key → set password)** — copy directly from `candidate-journey.spec.ts:365-391`:
```typescript
import { toCallbackUrl } from '../../fixtures/shared/emailBucket.fixture';
// ...
await emailBucket.expectEmail(REGISTRATION_EMAIL_SUBJECT_REGEX);
const links = await emailBucket.getLinksInEmail(REGISTRATION_EMAIL_SUBJECT_REGEX);
const registrationCallbackUrl = toCallbackUrl(links[0]);
await page.goto(registrationCallbackUrl);
await candidatePasswordSetter.setPassword(PASSWORD_1);
```
> The preregister email embeds `?registrationKey=<%= candidate.registrationKey %>` (RESEARCH §Pattern 3) — extract `registrationKey` from the received email and navigate `/candidate/register?registrationKey=…`, then reuse `candidatePasswordSetter.setPassword`.

**Imports to mirror** (`candidate-journey.spec.ts:62-83`): `import { expect, test } from '../../fixtures/candidate/<journey-composition-root>'`, `testIds` from `../../utils/testIds`, `TIMEOUTS` from `../../helpers`, `SupabaseAdminClient` from `../../utils/supabaseAdminClient`.

**Locale note:** journey runs on the `/en` locale-prefixed route (`toCallbackUrl` default `/en/candidate/auth/callback`); assert on testids, never localized strings (CLAUDE.md localization rule + candidate-journey precedent).

---

### `tests/tests/fixtures/candidate/candidatePreregisterPage.fixture.ts` (fixture / page-object — NEW)

**Analog:** `tests/tests/fixtures/candidate/candidatePasswordSetter.fixture.ts` (simplest reference for the convention) + `candidateProfilePage.fixture.ts` (richer multi-step page-object).

**Why:** Every candidate page-object follows `createCandidate<Thing>Page(page: Page) { return { async stepMethod() {...} } }` + a `export type ...Fixture = ReturnType<typeof create...>`. Copy this shape exactly.

**Convention excerpt** (`candidatePasswordSetter.fixture.ts:17-46`):
```typescript
import { expect } from '@playwright/test';
import { testIds } from '../../utils/testIds';
import type { Page } from '@playwright/test';

export function createCandidatePreregisterPage(page: Page) {
  return {
    async clickStart(): Promise<void> { await page.getByTestId('preregister-start').click(); },
    async submitElection(): Promise<void> { /* pick from preregister-elections-list → preregister-elections-submit */ },
    async submitConstituency(): Promise<void> { /* preregister-constituencies-list → preregister-constituencies-submit */ },
    async fillEmailAndAcceptToU(email: string): Promise<void> { /* preregister-email-input/-confirm + ToU checkbox → preregister-email-submit */ }
  };
}
export type CandidatePreregisterPageFixture = ReturnType<typeof createCandidatePreregisterPage>;
```

**Testids the page-object drives** (RESEARCH verified these IN THE PAGE SOURCES; they are NOT yet in `tests/tests/utils/testIds.ts` — the planner should ADD a `preregister: {...}` block to `testIds.ts` mirroring the existing `register`/`terms`/`password` blocks at `testIds.ts:88-118`, OR reference them as raw strings):
- `preregister-start`, `preregister-continue`, `preregister-return`
- `preregister-elections-list`, `preregister-elections-submit`
- `preregister-constituencies-list`, `preregister-constituencies-submit`
- `preregister-email-input`, `preregister-email-confirm`, `preregister-email-submit`
- existing (already in `testIds.ts`): `testIds.candidate.terms.checkbox` (`terms-checkbox`), `testIds.candidate.password.field` (`password-field`) + `.submit` (`set-password-submit`), `testIds.candidate.register.submit` (`register-submit`).

**Rigidity contract** (copy the doc-block from `candidatePasswordSetter.fixture.ts:13-15`): NO `expect.soft`, NO `try/catch` wrapping `expect(...)`, NO `.catch(() => null)` on assertion-bearing interactions.

**Composition root:** if the journey spec uses a fixture-composition file (like `candidate-journey.ts` at `fixtures/candidate/candidate-journey.ts:79-115`), add this page-object + `emailBucket` + `candidatePasswordSetter` to a NEW `candidate-bank-auth-journey.ts` composition root following that `base.extend<...>({ ... })` shape, OR instantiate page-objects directly in the spec. Pin at build.

---

### `tests/tests/support/mockOidcIssuer.ts` (local test server — NEW, Option-B, D-01)

**Analog:** No existing local HTTP server in the suite. Closest shape is `emailBucket.fixture.ts` — a self-contained module that owns its own HTTP plumbing (`fetch` to Mailpit REST) and depends on no other module (`emailBucket.fixture.ts:5-9` doc-block). The mock issuer mirrors that "self-contained, owns its own transport" property but as a SERVER (`http.createServer`) rather than a client.

**Why this analog:** the suite's precedent for "talk to an external HTTP surface from test code with zero new deps" is `emailBucket` (raw `fetch` + `cheerio`). The mock issuer extends that precedent to the server side using Node built-in `http` + the already-present `jose@6.2.1`. NO new npm package (RESEARCH Package Legitimacy Audit is empty by design).

**Skeleton** (RESEARCH §Code Examples — 3 routes, derived from the verified `idura.ts` + callback `+server.ts` server-side flow):
```typescript
import http from 'node:http';
import * as jose from 'jose';
import { buildTestIdToken } from '../utils/buildTestIdToken';
const server = http.createServer(async (req, res) => {
  const u = new URL(req.url!, 'https://localhost');
  if (u.pathname === '/oauth2/authorize') {
    const jar = jose.decodeJwt(u.searchParams.get('request')!); // JAR signed request object; decode (NO verify) for state + redirect_uri
    res.writeHead(302, { Location: `${jar.redirect_uri}?code=test-code&state=${jar.state}` }).end();
  } else if (u.pathname === '/oauth2/token' && req.method === 'POST') {
    const id_token = await buildTestIdToken(IDURA_CLAIMS, sigPriv, encPubJwk,
      { issuer: process.env.IDENTITY_PROVIDER_ISSUER!, audience: process.env.PUBLIC_IDENTITY_PROVIDER_CLIENT_ID! });
    res.writeHead(200, { 'Content-Type': 'application/json' }).end(JSON.stringify({ id_token }));
  } else if (u.pathname.endsWith('/jwks')) {
    res.writeHead(200, { 'Content-Type': 'application/json' }).end(JSON.stringify({ keys: [sigPubJwk] }));
  } else { res.writeHead(404).end(); }
});
```

**Critical build-time design points the planner MUST resolve (RESEARCH Pitfalls 1-4, Open Qs):**
- **Pitfall 2 / Open-Q1 (HIGHEST uncertainty, A3):** `idura.ts` hard-codes `https://${IDURA_DOMAIN}/oauth2/...`. The server-side `exchangeCodeForToken` `fetch` AND the browser authorize redirect both hit `https://<mock>`. → the mock issuer must serve over HTTPS (self-signed cert) with `NODE_TLS_REJECT_UNAUTHORIZED=0` scoped to the frontend-server process for this opt-in run only. Resolve in the FIRST EFLOW-10b task (spike if needed).
- **Pitfall 1:** the SvelteKit Node server reads `IDURA_DOMAIN`/`IDENTITY_PROVIDER_*`/`PUBLIC_IDENTITY_PROVIDER_TYPE=idura` at ITS process startup, not from the Playwright worker. A Playwright `webServer` entry can spawn the mock issuer cleanly (self-contained, no app env), but the FRONTEND server's env is the operator's responsibility — document the run procedure (mirror `tests/IDURA-TEST-RUNBOOK.md`).
- **Pitfall 4:** the synthetic JWT's `iss`/`aud` MUST equal `IDENTITY_PROVIDER_ISSUER` / `PUBLIC_IDENTITY_PROVIDER_CLIENT_ID` — the parameterized `buildTestIdToken` (D-03) carries these. Keep kids aligned (`test-sig-1` in JWKS, `test-enc-1` in the decryption JWK).

---

### `tests/playwright.config.ts` (config — MODIFY)

**Analog:** the opt-in `bank-auth` project block (`playwright.config.ts:170-180`) + a perm setup/teardown/spec triple (`:485-503`).

**Add a sibling `bank-auth-journey` project** mirroring the `bank-auth` block — opt-in via `PLAYWRIGHT_BANK_AUTH`, OWN `testMatch`, OWN data-setup dependency (NOT threaded into the perm serial chain — RESEARCH A4/Pitfall 3: opt-in projects stand alone like `bank-auth`):
```typescript
...(process.env.PLAYWRIGHT_BANK_AUTH
  ? [
      { name: 'data-setup-bank-auth-journey',
        testMatch: /bank-auth-journey\.setup\.ts/,
        teardown: 'data-teardown-bank-auth-journey' },
      { name: 'data-teardown-bank-auth-journey',
        testMatch: /bank-auth-journey\.teardown\.ts/ },
      { name: 'bank-auth-journey',
        testDir: './tests/specs/candidate',
        testMatch: /candidate-bank-auth-journey\.spec\.ts/,
        use: { ...devices['Desktop Chrome'], storageState: { cookies: [], origins: [] } },
        dependencies: ['data-setup-bank-auth-journey'] }
    ]
  : []),
```
**Existing `bank-auth` project block (the exact analog to copy)** (`:172-179`):
```typescript
{ name: 'bank-auth',
  testDir: './tests/specs/candidate',
  testMatch: /candidate-bank-auth\.spec\.ts/,
  use: { ...devices['Desktop Chrome'] },
  dependencies: ['data-setup-base'] }
```
**`webServer` for the mock issuer:** the config currently has NO `webServer` and NO `globalSetup` (`:41`, verified). Add a `webServer` entry (Playwright-managed start/wait-for-port/teardown + `reuseExistingServer`) to spawn `mockOidcIssuer.ts` for this opt-in run — RESEARCH recommends `webServer` over a global-setup spawn. The `testMatch`-as-its-own-project grammar is load-bearing: a bare new spec file runs nothing without its project (Pitfall 3).

---

### `tests/tests/setup/candidate/bank-auth-journey.setup.ts` (setup, batch — NEW)

**Analog:** `tests/tests/setup/perm/perm-not-located-2e2cg.setup.ts` (the D-04 reuse target — seeds the 2-election × disjoint-CG shape) + `candidate-journey.setup.ts` (idempotent auth-state pre-clean).

**Why:** D-04 reuses the `perm-not-located-2e2cg` *template* (registry key confirmed at `packages/dev-seed/src/templates/index.ts:65` → `permNotLocated2e2cgTemplate`) — the only existing shape forcing BOTH the election AND constituency selectors to render. Verify at build that the candidate-preregister selectors (not just voter) render against it (RESEARCH A1; fallback `perm-2e-asymmetric`).

**Seed excerpt** (`perm-not-located-2e2cg.setup.ts:8-13`):
```typescript
import { test as setup } from '@playwright/test';
import { setupFromTemplate } from '../shared/setupFromTemplate';
setup('import perm-not-located-2e2cg dataset (bank-auth-journey)', async () => {
  await setupFromTemplate('perm-not-located-2e2cg', { extraTeardownPrefix: ['test-', 'e2e-perm-'] });
});
```
**Auth pre-clean (combine with the seed)** — mirror `candidate-journey.setup.ts:22-29`: instantiate `new SupabaseAdminClient()` and idempotently clear the journey's test identity (the `auth.users` row the identity-callback creates) so a partial prior run converges to a clean start.

---

### `tests/tests/setup/candidate/bank-auth-journey.teardown.ts` (teardown, batch — NEW)

**Analog:** `perm-not-located-2e2cg.teardown.ts` (prefix-scoped `runTeardown`) + `candidate-journey.teardown.ts` (auth-user cleanup).

**Why:** EFLOW-10b creates runtime state (`auth.users` + `candidates` + `user_roles` via the magic-link session — RESEARCH §Runtime State Inventory). Teardown must (a) clear the perm seed prefix AND (b) delete the created auth user.

**Prefix teardown excerpt** (`perm-not-located-2e2cg.teardown.ts:7-17`):
```typescript
import { runTeardown } from '@openvaa/dev-seed';
import { expect, test as teardown } from '@playwright/test';
import { SupabaseAdminClient } from '../../utils/supabaseAdminClient';
const PREFIX = 'e2e-perm-notloc-';
teardown('delete bank-auth-journey dataset + created auth user', async () => {
  const client = new SupabaseAdminClient();
  const { rowsDeleted } = await runTeardown(PREFIX, client);
  expect(rowsDeleted, 'runTeardown returned non-numeric rowsDeleted').toBeGreaterThanOrEqual(0);
  // + delete the created bank-auth identity (mirror candidate-journey.teardown.ts unregisterCandidate),
  //   OR delete by user_id like candidate-bank-auth.spec.ts afterAll:189-191.
});
```
**Auth-user delete analog** — either `candidate-journey.teardown.ts:18-20` (`client.unregisterCandidate(email)`) or the existing EFLOW-10 `afterAll` cascade (`candidate-bank-auth.spec.ts:189-191`):
```typescript
await adminClient.from('user_roles').delete().eq('user_id', userId);
await adminClient.from('candidates').delete().eq('auth_user_id', userId);
await adminClient.auth.admin.deleteUser(userId);
```

## Shared Patterns

### Synthetic JWE token construction
**Source:** `tests/tests/utils/buildTestIdToken.ts` (D-03 extraction from `candidate-bank-auth.spec.ts:60-111`).
**Apply to:** EFLOW-10 spec + the mock issuer's `/oauth2/token` endpoint. ONE builder, kid contract `test-sig-1`/`test-enc-1`, parameterized `iss`/`aud`. Use a FIXED committed test key pair (not per-run `generateKeyPair`) for 3×-green determinism (RESEARCH A2 / Open-Q3).

### Email round-trip (Mailpit)
**Source:** `tests/tests/fixtures/shared/emailBucket.fixture.ts` (`createEmailBucket` + `toCallbackUrl`).
**Apply to:** EFLOW-10b registration-key extraction → set password. `expectEmail` / `getLinksInEmail` poll Mailpit REST (`:54324`); `toCallbackUrl` rewrites the verify link to the frontend auth callback. Do NOT hand-roll Mailpit polling (RESEARCH §Don't Hand-Roll).

### Admin client (verification + cleanup)
**Source:** `tests/tests/utils/supabaseAdminClient.ts` (`SupabaseAdminClient`) + `@supabase/supabase-js` `createClient` (already imported in `candidate-bank-auth.spec.ts:24,135`).
**Apply to:** EFLOW-10 assertions (`auth.admin.getUserById`, `from('candidates').select(...)`) + both teardowns. `unregisterCandidate(email)` is the idempotent auth-user cleanup primitive.

### Page-object convention
**Source:** `tests/tests/fixtures/candidate/candidatePasswordSetter.fixture.ts` (+ `candidate-journey.ts` composition root).
**Apply to:** the new preregister page-object. `createCandidate<Thing>Page(page)` → step methods → `export type ...Fixture = ReturnType<...>`. Rigidity contract enforced (0 `expect.soft`, 0 try/catch around expect, 0 `.catch(()=>null)`).

### Opt-in serial-DAG project wiring
**Source:** `tests/playwright.config.ts` `bank-auth` block (`:170-180`) + perm setup/teardown triples.
**Apply to:** the `bank-auth-journey` project — own `testMatch`, own data-setup dependency, `PLAYWRIGHT_BANK_AUTH`-gated, stands ALONE (not in the perm serial chain). A bare spec file with no project runs nothing (Pitfall 3).

## No Analog Found

| File | Role | Data Flow | Reason |
|------|------|-----------|--------|
| (none) | — | — | Every artifact has an in-repo analog. The mock OIDC issuer (`mockOidcIssuer.ts`) is the closest to net-new — there is no existing local HTTP *server* in the suite — but its transport precedent (`emailBucket.fixture.ts`, self-contained `fetch`/HTTP, zero new deps) and its full skeleton (RESEARCH §Code Examples) are both present, so the planner is not starting from zero. |

## Metadata

**Analog search scope:** `tests/tests/specs/candidate/`, `tests/tests/fixtures/{candidate,shared}/`, `tests/tests/setup/{candidate,perm,shared}/`, `tests/tests/utils/`, `tests/playwright.config.ts`, `packages/dev-seed/src/templates/index.ts`.
**Files scanned:** 11 read in full + directory listings of 4 dirs + 3 targeted greps.
**Pattern extraction date:** 2026-06-17
