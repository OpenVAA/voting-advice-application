# Phase 179: Identity-Provider Registration & Coverage Close - Pattern Map

**Mapped:** 2026-10-21
**Tree read at:** `a0f1c389f` (branch `feat/entity-signup-multi-grant`; Phases 170–178 executed; baseline NOT frozen on this branch)
**Files analyzed:** ~70 new / modified / deleted files, in 11 families
**Analogs found:** 62 / 66 (deletions excluded from the count)

## How to read this file

- **Code is cited by content anchor** — a path and a quoted string or symbol — never by line number. Re-derive every anchor at plan time.
- `F/` = `apps/frontend/src/`, `S/` = `apps/supabase/supabase/`, `ENTRY/` = `F/routes/contestant/`, `PD178/` = `.planning/phases/178-sign-in-email-code-registration/`.
- **"structure only"**: copy shape, imports and control flow; write every comment anew. Most analogs below carry history, debug-file paths (`.planning/debug/...`), or phase/threat ids in comments (e.g. `callback/+server.ts` "See `.planning/debug/resolved/idura-bank-auth-empty-client.md`", `mockOidcIssuer.ts` "EFLOW-10b", "T-122-07"), which `CLAUDE.md` § *Comment Hygiene* forbids in touched code. Rewriting a file means rewriting those comments too.
- Names of new modules, cookies, codes, headers and test ids are the proposals of `179-RESEARCH.md` / `179-UI-SPEC.md` (marked `[ASSUMED]` there); the planner fixes them.
- Every analog path below was checked with `git ls-files` and is tracked source. None is a gitignored mirror. The one exception is the **frozen-migration manifest**, which exists only on `feat/deployment-terraform-supabase` (cited via `git show`), see family 2.
- Nothing was run for this file but `git`, `grep`, `sed`, `wc` and reads.

## File Classification

### 1. Edge Function `identity-callback` (plan 1; J4 in plan 2)

| New/Modified File | Role | Data Flow | Closest Analog | Match |
|---|---|---|---|---|
| `S/functions/identity-callback/index.ts` (rewrite) | Edge entry (controller) | request-response | itself + `S/functions/account-access/index.ts` (project from body, `answer(...)` helper) | exact, **structure only** |
| `…/identity-callback/requestContract.ts` (new: parse `{id_token, project_id, entity_type}`, closed result codes) | utility (pure contract) | transform | `S/functions/account-access/contract.ts` (`parseAccountAccessRequest`, `UUID_PATTERN`, frozen `*_BODY` answers) | exact |
| `…/identity-callback/registrationMatrix.ts` (new: Deno copy of the matrix rule) | utility (pure) | transform | `packages/app-shared/src/settings/contestantAppConfig.ts` (`isRegistrationModeAllowed`, `getEffectiveRegistrationModes`) — logic; `entityGrant.ts` — module shape (no imports, no `Deno`) | role-match |
| `…/identity-callback/registrationMatrix.test.ts` (new: 32-row conformance) | test | transform | `packages/dev-seed/tests/registrationModeMatrixParity.test.ts` (parses `*-registration-mode-matrix.test.sql` rows as text) | exact |
| `…/identity-callback/organizationRecord.ts` (+ `.test.ts`) (new: create unconfirmed nameless org, delete on grant failure) | service (pure, client injected) | CRUD | `…/identity-callback/candidateRecord.ts` (`createCandidate`, `deleteCandidate`, `Candidate*Client` interfaces) | exact |
| `…/identity-callback/ownEntity.ts` (+ `.test.ts`) (new: J6 `app_metadata.registered_entities` record + live-grant check) | service (pure) | CRUD | `candidateRecord.ts` `findExistingCandidate` (the throw-on-error reading of `maybeSingle()`) | role-match |
| `…/identity-callback/candidateRecord.ts` (mod: lookup no longer "any candidate grant") | service | CRUD | itself | exact |
| `…/identity-callback/entityGrant.ts` | — | — | **unchanged**: already takes `entityType` as a parameter (`ENTITY_GRANT_VOCABULARY`) | — |
| `…/identity-callback/serverCredential.ts` (+ test) (new, J4: constant-time header compare) | middleware (pure) | request-response | `…/identity-callback/verifyConfig.ts` (`requireVerifyClaimBinding` — a guard that throws on unset) + `envConfig.ts` `requireEnv` | role-match |
| `…/identity-callback/flowConformance.test.ts` (mod) | test (source-text) | — | itself; and `S/functions/account-access/flowConformance.test.ts` | exact |
| `…/identity-callback/envReadSites.test.ts` (mod) | test | — | itself | exact |
| `…/identity-callback/placeholderDomain` constant + conformance test (new; shared with frontend) | config | transform | `entityGrant.ts` vocabulary-as-one-declaration idiom; text-reading test like `registrationModeMatrixParity.test.ts` | role-match |
| `S/functions/.env.example`, root `.env.example` (mod: J4 secret; maybe drop `PUBLIC_PROJECT_ID`/`SITE_URL`) | config | — | themselves | exact |
| `scripts/assert-project-scoped-queries.mjs` (mod: `'identity-callback': 'scoped-by-deployment: PUBLIC_PROJECT_ID'` → requires a project term) | config (gate) | — | itself | exact |

### 2. Edge Function `account-access` — the address-confirmation operation (plan 3)

| New/Modified File | Role | Data Flow | Closest Analog | Match |
|---|---|---|---|---|
| `S/functions/account-access/contract.ts` (mod: `confirm-address` request + `sent`/`in_use`/`refused` bodies) | utility | transform | itself — the `request-recovery` arm of `parseAccountAccessRequest` | exact |
| `…/account-access/addressConfirmation.ts` (+ `.test.ts`) (new: three-call recipe, deps injected) | service (pure, deps injected) | request-response | `…/account-access/linkIssue.ts` (`LinkIssueDeps`, `issueRecoveryLink`, `describeFailure`, `say`) | exact |
| `…/account-access/index.ts` (mod: authenticated operation, deps wiring) | Edge entry | request-response | itself — `createPasswordlessUser`/`mintToken`/`sendMail` dep bodies and the `request.operation ===` dispatch | exact |
| `…/account-access/signInLink.ts` (mod: `LINK_TYPES` gains `'email_change'`) | utility | transform | itself — `export const LINK_TYPES = ['magiclink', 'recovery'] as const;` | exact |
| `…/account-access/mailTemplates.ts` (mod: third template set ×7) | config (templates) | transform | itself — `RECOVERY_MAIL_TEMPLATES` + `renderRecoveryMail` | exact |
| `…/account-access/{contract,signInLink,mailTemplates,flowConformance}.test.ts` (mod) | test | — | themselves | exact |

**Note:** there is no `S/functions/_shared/` directory on the tree (`git ls-files` → nothing). Each function keeps its own `envConfig.ts` / pure siblings; do not invent `_shared` unless the planner decides to.

### 3. Schema — appended migrations, pgTAP (plan 1 or 3; blocked on freeze merge)

| New/Modified File | Role | Data Flow | Closest Analog | Match |
|---|---|---|---|---|
| `S/schema/506-invitation-rpcs.sql` (mod: J3 predicate in `claim_invitations`; new service-role slot RPC) | migration source | CRUD | itself — `invitation_link_request` (`private.invitation_throttle_take('link:' …, 1, interval '60 seconds')`) and the code throttle `'code:' || p_project_id::text || ':' || v_hash, 10, interval '15 minutes'` | exact |
| `S/migrations/00002_<name>.sql` (new, appended) | migration | — | **no analog on this branch.** The model is on `feat/deployment-terraform-supabase`: `git show feat/deployment-terraform-supabase:scripts/assert-schema-migration-parity.mjs` (header "A schema change is one commit, in three steps") | none here |
| `S/migrations.manifest.json` (mod: append line with sha256) | config | — | `git show feat/deployment-terraform-supabase:apps/supabase/supabase/migrations.manifest.json` (not on this branch) | none here |
| `S/tests/database/39-invitations.test.sql` (mod: J3 case; `plan (329)` bumps) | test (pgTAP) | — | itself | exact |
| `S/tests/database/48-<slot-rpc>.test.sql` (new) | test (pgTAP) | — | `39-invitations.test.sql` § helpers ("who may be mailed a sign-in link, the limits and how a slot is given back") | role-match |
| `packages/supabase-types/src/database.ts` (regenerated) | generated | — | `yarn db:types` | — |

### 4. OIDC SvelteKit routes + cookies + error codes (plan 2)

| New/Modified File | Role | Data Flow | Closest Analog | Match |
|---|---|---|---|---|
| `F/routes/api/oidc/authorize/+server.ts` (mod: `entityType`, matrix check, type cookie, server-built `redirectUri`) | controller | request-response | itself | exact |
| `F/routes/api/oidc/callback/+server.ts` (rewrite: invoke function, `verifyOtp`, arrival marker, closed codes, redirect to `ContestantAppHome`/CI2) | controller | request-response | itself (binding switch, `clearFlowCookies`) + `F/routes/api/contestant/preregister/+server.ts` (invoke + `verifyOtp` from `action_link`'s `token`) | exact, **structure only** |
| `F/routes/api/oidc/{authorize,callback}/server.test.ts` (new) | test | — | `F/routes/api/auth/callback/server.test.ts` | exact |
| `F/lib/cookies/index.ts` (mod: drop `idToken`; add type cookie + arrival marker) | config | — | itself — `export const COOKIE = deepFreeze({` | exact |
| `F/lib/cookies/cookies.test.ts` (mod: exact-set pin) | test | — | itself | exact |
| `F/lib/contestant/utils/oidcError.ts` (rewrite: closed set of 8–9 codes + `code → class` map; `upstreamOidcError` deleted) | utility | transform | itself (`OIDC_ERROR: Record<OidcErrorKey, OidcError>`) + `F/lib/contestant/utils/loginError.ts` (`getErrorTranslationKey` with `Object.hasOwn` guard) | exact |
| `F/lib/contestant/utils/oidcError.test.ts` (mod) | test | — | itself + `loginError.test.ts` | exact |
| `tests/IDURA-TEST-RUNBOOK.md` (mod: code spellings) | docs | — | itself | exact |

### 5. CI1 — gate view, user-level facts, form action (plan 3)

| New/Modified File | Role | Data Flow | Closest Analog | Match |
|---|---|---|---|---|
| `F/lib/contestant/gates/gates.ts` (mod: `'identityProvider'` id between `setPassword` and `termsOfUse`; `setPassword` gains `addressState === 'proved'`) | config (frozen list) | transform | itself | exact |
| `F/lib/contestant/gates/gateViews.ts` (mod) | config | — | itself — `setPassword: SetPasswordGate,` | exact |
| `F/lib/contestant/gates/IdentityProviderGate.svelte` (new) | component (gate view) | request-response | `F/lib/contestant/gates/SetPasswordGate.svelte` (status `'idle' \| 'saving' \| 'failed'`, `invalidateAll`, logout button, `formId`) | exact, **structure only** |
| `F/lib/contestant/gates/IdentityProviderGate.svelte.test.ts` (new) | test | — | `F/lib/contestant/gates/TermsOfUseGate.svelte.test.ts` | exact |
| `F/lib/contestant/gates/gates.test.ts` (mod: V1–V6 predicate table) | test | — | itself | exact |
| `F/lib/api/base/dataWriter.type.ts` (mod: `BasicUserData` gains `addressState`, `pendingEmail`, `ownOrganizationUnnamed`, maybe `answersLocked`) | type | — | itself — the `passwordSet` member's TSDoc | exact |
| `F/lib/api/adapters/supabase/dataWriter/supabaseDataWriter.ts` (mod: `_getBasicUserData`) | service (adapter) | request-response | itself — `getUser()` first, then `get_user_entities` → `parseCallerPasswordSet(listed)` | exact |
| `ENTRY/(protected)/+layout.server.ts` (mod: arrival marker from `cookies.get`; lock fact before gates) | route load | request-response | itself — "Stage 2"/"Stage 3" | exact |
| `ENTRY/(protected)/{layout.server.test.ts,layout.tracking.test.ts}` (mod) | test | — | themselves | exact |
| `ENTRY/(protected)/identityProviderLayout.svelte.test.ts` (new) | test | — | `ENTRY/(protected)/setPasswordLayout.svelte.test.ts` | exact |
| CI1's form action / clear-marker action (new; location the planner's: an `/api/contestant/...` route or `+page.server.ts` action) | controller | request-response | `ENTRY/register/sign-in/+page.server.ts` (`actions.default`, `fail(status, { status })`, per-request `createDataWriter`) | role-match |
| `F/lib/contestant/components/emailEntry/EmailEntry.svelte` (mod: export `showEmailError`) | component | transform | itself; `passwordField/` `focus()` export | exact |
| entity home reminder + settings pending section (mod, page markup) | route page | request-response | the existing home / settings page under `ENTRY/(protected)/[entityType]/[entityId]/` (re-derive) | exact |

### 6. CI2 — public error page (plan 4)

| New/Modified File | Role | Data Flow | Closest Analog | Match |
|---|---|---|---|---|
| `ENTRY/register/identity-provider/error/+page.server.ts` (new: code → class only) | route load | request-response | `ENTRY/password-reset/+page.server.ts` (tiny load, returns one field, TSDoc says what is never returned) + `loginError.ts` mapping | role-match |
| `ENTRY/register/identity-provider/error/+page.svelte` (new) | route page | request-response | `ENTRY/email-sent/+page.svelte` (public entry page in `MainContent`) | role-match |
| `…/error/{page.server.test.ts,page.svelte.test.ts}` (new) | test | — | `ENTRY/password-reset/{page.server.test.ts,page.svelte.test.ts}` | exact |
| `F/lib/routes/route.ts` (mod: add CI2 constant; delete six `ContestantAppPreregister*`) | config | — | itself — `ContestantAppRegisterSignIn: \`${CONTESTANT}/register/sign-in\`,` | exact |
| `F/lib/routes/appGates.ts` (mod: `entryRoutes` gains CI2) + test | config | — | itself — `entryRoutes: Object.freeze([ 'ContestantAppLogin', …` | exact |
| `F/lib/analytics/pageviewRoutes.ts` (mod: CI2 `NO_PARAMS`; preregister rows out) | config | — | itself — `[ROUTE.Home]: NO_PARAMS,` | exact |
| `ENTRY/register/+page.svelte` (mod: provider panel becomes a form with type radios; `goto(getRoute.current('ContestantAppPreregister'))` replaced by POST to authorize) | route page | request-response | itself — the email panel's form (`panelMode === 'identity_provider'` branch) | exact |
| `F/lib/contestant/utils/registrationOffer.ts` (mod: offered types for the IdP mode) + test | utility | transform | itself — `listedRegistrationModes`, `signInLinkOffered` | exact |
| `apps/frontend/messages/*/contestantApp.*.json` ×7 + `project.inlang/settings.json` + `F/lib/types/generated/translationKey.ts` | config (i18n) | — | 178's catalogue additions (see `PD178/178-PATTERNS.md` § messages) | exact |

### 7. REG-14 — deletion set and its guard (plan 5)

**Delete** (all `git ls-files`-confirmed today):
`ENTRY/preregister/` (9 files: `+page.svelte`, `+page.ts`, `+layout.svelte`, `+layout.server.ts`, `status/+page.svelte`, `(authenticated)/+layout.svelte`, `(authenticated)/{elections,constituencies,email}/+page.svelte`);
`F/routes/api/contestant/preregister/{+server.ts,preregisterUpstreamStatus.test.ts}`;
`F/routes/api/oidc/token/+server.ts`;
`F/lib/contestant/utils/preregistrationError.ts`;
`tests/tests/fixtures/contestant/contestantPreregisterPage.fixture.ts`;
`apps/frontend/messages/*/contestantApp.preregister.json` ×7 + its inlang line;
the `PreregisteredNotification` component dir and its generated docs page; writer methods `preregisterWithIdToken`, `_preregister`, `exchangeCodeForIdToken`, `clearIdToken`; context members `preregister`, `preregistrationElectionIds`, `preregistrationConstituencyIds`, `preregistrationNominations`, `isPreregistered`, `idTokenClaims`; `testIds.contestant.preregister`; `COOKIE.idToken`; the `apps/frontend/eslint.config.mjs` entry `'src/routes/api/contestant/preregister/+server.ts'`; `'contestantContext-isPreregistered'` in `tests/tests/utils/privacyAllowlists.ts`.
**Rewrite (not delete):** `apps/docs/src/routes/(content)/developers-guide/contestant-app/{registration,pre-registration-and-invitation,bank-authentication}/+page.md`; comments in `F/lib/supabase/anon.ts`, `F/lib/api/dataProvider.ts`, `F/lib/supabase/universal.ts`, `F/routes/+layout.server.ts`, `F/routes/(voters)/(located)/+layout.server.ts`, `F/lib/utils/constants.ts`.

| New/Modified File | Role | Data Flow | Closest Analog | Match |
|---|---|---|---|---|
| `scripts/assert-no-preregister.mjs` (new; name the planner's) | utility (repo gate) | batch (file scan) | `scripts/assert-no-candidate-app-names.mjs` (`git ls-files -z`, `SELF_PATHS`, `EXEMPT` masked before matching, `--report`/`--self-test`, exit 0/1/2) | exact |
| `scripts/fixtures/assert-no-preregister.{input.ts,expected.ts.violations}` (new) | test fixture | — | `scripts/fixtures/assert-no-candidate-app-names.*` | exact |
| root `package.json` (mod: `assert:no-preregister` script + appended to `lint:check` chain) | config | — | `"assert:no-candidate-app-names": "node scripts/assert-no-candidate-app-names.mjs"` and its `&& yarn assert:no-candidate-app-names` link | exact |

### 8. E2E harness, mock issuer, specs, fixtures (plan 6; mailedLink in Wave 0)

| New/Modified File | Role | Data Flow | Closest Analog | Match |
|---|---|---|---|---|
| `tests/tests/support/mockOidcIssuer.ts` (mod: per-test selector by cookie; unique code → scenario map; cancel / error outcomes) | test service | request-response | itself — the three-endpoint `handle()` | exact, **structure only** |
| `tests/tests/utils/mailedLink.ts` (mod: `MailedLinkType` gains `'email_change'`) | test utility | transform | itself — `export type MailedLinkType = 'magiclink' \| 'recovery';` and `MAILED_LINK_TYPES` | exact |
| `tests/playwright.config.ts` (mod: drop `PLAYWRIGHT_BANK_AUTH` conditionals; IdP scenario project(s) at the perm-chain tail; mock `webServer` unconditional) | config | — | itself — `data-setup-bank-auth-journey` entry (`dependencies` on the chain's last project) | exact |
| `tests/scripts/e2e-run.sh` (mod: generated Edge env, `functions serve identity-callback --env-file`, JWKS on 8777, `NODE_EXTRA_CA_CERTS`, restore) | config (harness) | batch | `PD178/178-bankauth.sh` (steps 1–5, restore, issuer read back by `printenv`) | role-match |
| `tests/tests/specs/contestant/contestant-identity-provider.spec.ts` (new: scenarios 1–8, tags, axe 6–14) | test (E2E) | request-response | `tests/tests/specs/contestant/contestant-email-registration.spec.ts` (mailed link round trip) + `contestant-bank-auth-journey.spec.ts` | exact |
| `tests/tests/specs/contestant/contestant-bank-auth.spec.ts` (re-point at mock-minted tokens or fold in) | test | — | itself | exact |
| `tests/tests/specs/contestant/contestant-bank-auth-journey.spec.ts` (mod: start from C) | test | — | itself | exact |
| `tests/tests/setup/contestant/identity-provider.{setup,teardown}.ts` (new or rename of bank-auth-journey pair) | test setup | CRUD | `tests/tests/setup/contestant/bank-auth-journey.{setup,teardown}.ts` | exact |
| `tests/tests/fixtures/contestant/contestantIdentityProviderGate.fixture.ts` (new) | test fixture | — | `tests/tests/fixtures/contestant/contestantSetPasswordGate.fixture.ts` | exact |
| `tests/tests/fixtures/contestant/contestantIdentityProviderError.fixture.ts` (new) | test fixture | — | `contestantEmailSentPage.fixture.ts` | role-match |
| `tests/tests/fixtures/contestant/contestantRegisterPage.fixture.ts`, `contestant-bank-auth-journey.ts`, `contestantHomePage.fixture.ts` (mod) | test fixture | — | themselves | exact |
| `tests/tests/utils/testIds.ts` (mod: UI-SPEC § Locator Contract) | config | — | itself | exact |
| `tests/tests/specs/contestant/contestant-entry-scan.spec.ts` (mod: entries 1–3), `perm/perm-closed-project.spec.ts` (4–5), `contestant-entry-phone.spec.ts` | test | — | themselves — `declareEntryScans([ { name: 'entry-login', …` | exact |
| `scripts/assert-a11y-scan-wiring.mjs` (mod: check 4a file list) | config (gate) | — | itself | exact |
| `scripts/assert-e2e-coverage-tags.mjs` (new; D-21) | utility (gate) | batch | `scripts/assert-no-candidate-app-names.mjs` (CLI/exit shape) + the orphan-probe guard in `tests/playwright.config.ts` ("Orphaned probe spec(s) in tests/specs/_probes — they match NO Playwright project") | role-match |
| `.github/workflows/main.yaml` (mod: E2E job env) | config | — | itself | exact |

### 9. Phase drivers (copied from 178)

| New File | Analog | Match |
|---|---|---|
| `.planning/phases/179-…/179-gates.sh` | `PD178/178-gates.sh` (17 rows; add `equivalence`, `coverage-tags`, `preregister-gone-self-test`, `test-keys-scope`, `fn-closed`) | exact |
| `179-e2e.sh` | `PD178/178-e2e.sh` | exact |
| `179-verdict.mjs` | `PD178/178-verdict.mjs` | exact |
| `179-bankauth.sh` (plans 1–5 only) | `PD178/178-bankauth.sh` — plus the db:start filter `yarn db:start 2>&1 \| node tests/scripts/withhold-stack-keys.mjs`, status from `PIPESTATUS[0]` | exact |
| `179-stack-probe.sh` | `PD178/178-stack-probe.sh` | exact |
| `179-probe.mjs` (Wave 0, P1–P8) | `PD178/178-probe.mjs` | exact |

(`.planning/` files are exempt from comment hygiene.)

---

## Pattern Assignments

### `S/functions/identity-callback/index.ts` (Edge entry, request-response)

**Analog:** itself. Keep these shapes; replace the rest.

**Imports** (keep the version pins; add the new pure siblings):
```ts
import { createClient } from 'npm:@supabase/supabase-js@2.117.2';
import * as jose from 'npm:jose@6.2.12';
import { createCandidate, deleteCandidate, findExistingCandidate } from './candidateRecord.ts';
import { writeEntityGrant } from './entityGrant.ts';
import { extractIdentityClaims, resolveProviderConfig } from './claimConfig.ts';
import { requireEnv } from './envConfig.ts';
import { requireVerifyClaimBinding } from './verifyConfig.ts';
```

**Logged-never-returned token arms** (keep verbatim in behaviour — anchor `FIELDS, NOT THE ERROR OBJECT`):
```ts
const claimFailure = e as { code?: unknown; claim?: unknown; reason?: unknown };
console.error(
  `[identity-callback] token verification failed: code=${String(claimFailure.code ?? 'none')} claim=${String(claimFailure.claim ?? 'none')} reason=${String(claimFailure.reason ?? 'none')}`
);
return new Response(JSON.stringify({ error: 'Token verification failed' }), { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
```
→ becomes `{ result: 'invalid_token' }` from the contract module.

**Grant-after-entity with compensating delete** (anchor `The entity type is named HERE and nowhere else`) — the org branch repeats it with `deleteOrganization`:
```ts
try {
  await writeEntityGrant(supabaseAdmin, { userId, entityType: 'candidate', entityId: candidateId });
} catch (grantError) {
  if (!existingCandidate) {
    await deleteCandidate(supabaseAdmin, { projectId, candidateId }).catch((deleteError: unknown) => {
      console.error('identity-callback: the candidate whose grant write failed could not be deleted:', deleteError);
    });
  }
  throw grantError;
}
```
`entityType` becomes the validated parameter; the literal `'candidate'` leaves this call site. `flowConformance.test.ts` › `'names exactly ONE entity type on the whole path and takes no type selection from the request'` is asserted **as present** today and must be inverted in the same commit.

**What to replace:**
- `findUserByIdentityMatch` (pages `listUsers`) — keep for now (todo to file), but the **creation** `admin.createUser({ email: placeholderEmail, email_confirm: true, … })` becomes the RQ-3 recipe: `generateLink({ type: 'invite', email: placeholder })` → `updateUserById(id, { app_metadata, email_confirm: true })`. Copy from `S/functions/account-access/index.ts` `createPasswordlessUser`:
  ```ts
  const { error } = await admin.auth.admin.generateLink({ type: 'invite', email: recipient });
  if (error && error.code !== 'email_exists') throw error;
  ```
- The project block (anchor `const projectId = requireEnv('PUBLIC_PROJECT_ID'`) → uuid from body (J5), using `account-access/contract.ts`'s `UUID_PATTERN` copy.
- The magic link (anchor `generateLink({ type: 'magiclink', email: placeholderEmail`) → for `(await admin.auth.admin.getUserById(userId)).data.user.email` (Pitfall 4); return the `token` of `action_link`, not `hashed_token`.
- The final catch (anchor `Logged, never returned. This arm catches the Supabase admin-API failures`) classifies by `code` (`ERR_ENV_UNCONFIGURED`, `ERR_AUDIENCE_UNCONFIGURED`, `ERR_ISSUER_UNCONFIGURED` → `configuration`; else `unavailable`) and still returns a fixed literal.
- D-23 plan-1 compatibility: absent `entity_type` → the single served type; absent `project_id` → env; keep `session.action_link` in the response until plan 2.

---

### `…/identity-callback/requestContract.ts` (pure contract, transform)

**Analog:** `S/functions/account-access/contract.ts`

Module header pattern: "Pure functions and constants with no Deno imports, no URL imports and no reference to the Deno global, so the module can be imported by both the Edge Function and vitest."

```ts
const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
/** The answer to a body that is not a well-formed request. */
export const BAD_REQUEST_BODY = Object.freeze({ error: 'bad-request' } as const);
export const INTERNAL_ERROR_BODY = Object.freeze({ error: 'internal' } as const);

export function parseAccountAccessRequest(body: unknown): AccountAccessRequest | null {
  if (typeof body !== 'object' || body === null || Array.isArray(body)) return null;
  const fields = body as Record<string, unknown>;
  const { operation, project_id: project } = fields;
  if (typeof project !== 'string' || !UUID_PATTERN.test(project)) return null;
  const projectId = project.toLowerCase();
  …
}
```
Results as frozen bodies: `created`, `found`, `no_entity`, `mode_not_allowed`, `invalid_token`, `configuration`, `unavailable`. Test analog: `account-access/contract.test.ts`.

---

### `…/identity-callback/organizationRecord.ts` (service, CRUD)

**Analog:** `…/identity-callback/candidateRecord.ts` — copy the injected narrow client interfaces (`CandidateCreateClient`, `CandidateDeleteClient`, `CandidateDeleteFilter`) and `createCandidate` / `deleteCandidate` shape. Difference: the row is `confirmed: false`, no `name`; the docblock's "WHY THE ROW IS WRITTEN CONFIRMED" paragraph is inverted. Test analog: `candidateRecord.test.ts` (fake client asserting the inserted row).

---

### `…/identity-callback/ownEntity.ts` (service, CRUD)

**Analog:** `candidateRecord.ts` `findExistingCandidate`, header "WHY THE ERROR IS READ RATHER THAN DISCARDED. `maybeSingle()` answers a zero-row read as `{ data: null, error: null }`…". Carry the rule: every non-null error **throws**, never reads as "none". The record lives in `app_metadata.registered_entities[<project>][<type>]`; `updateUserById` merges `app_metadata` at the top level only, so read-modify-write the whole nested object (RESEARCH Pattern 7). J6: record present + grant gone → `no_entity`, create nothing.

---

### `…/identity-callback/registrationMatrix.ts` + `.test.ts`

**Logic analog:** `packages/app-shared/src/settings/contestantAppConfig.ts` — `getEffectiveRegistrationModes`, `isRegistrationModeAllowed`, `SERVED_ENTITY_TYPES = ['candidate', 'organization']`. Plus the D-03 rule: absent type accepted only when exactly one served type allows `identity_provider`; unknown → refuse; settings unreadable → refuse.

**Test analog:** `packages/dev-seed/tests/registrationModeMatrixParity.test.ts`:
```ts
const PGTAP_DIRECTORY = resolve(REPO_ROOT, 'apps/supabase/supabase/tests/database');
const TABLE_FILE_SUFFIX = '-registration-mode-matrix.test.sql';
type MatrixRow = { settings: string; entityType: string; mode: string; allowed: boolean; … };
```
Read the **same** 32 `MATRIX` rows of `45-registration-mode-matrix.test.sql` ("THE FORM IS FIXED") and assert the Deno copy — a third reader, not a second table.

---

### `S/functions/account-access/addressConfirmation.ts` (service, deps injected)

**Analog:** `S/functions/account-access/linkIssue.ts`

Deps-interface pattern:
```ts
export interface LinkIssueDeps {
  siteUrl: string;
  requestEligibility(request: { projectId: string; email: string | null; code: string | null }): Promise<string | null>;
  createPasswordlessUser(address: string): Promise<void>;
  mintToken(address: string): Promise<string>;
  sendMail(mail: OutgoingMail): Promise<void>;
  release(slot: { projectId: string; address: string; code: string | null }): Promise<void>;
  log(message: string, detail?: LogDetail): void;
}
```
Never-reject outcome pattern (`issue(...)`: `let outcome: LinkIssueOutcome = 'not-sent'; try { … } catch (error) { say(deps, '…', describeFailure(error)); }`). New deps: `callerAccount(jwt)`, `takeConfirmationSlot(...)`, `generateEmailChange('current'|'new', …)`, `verifyCurrent(tokenHash)`. Answers `sent | in_use | refused`. Log lines must carry no address, token, link, or locale (`LinkIssueDeps.log` TSDoc).

**Contract caveat:** `contract.ts` header says "None of them carries anything that depends on whether an address … exists". The new `in_use` answer contradicts that — the header and `contract.test.ts` must say so explicitly (D-07).

**Mail:** copy `RECOVERY_MAIL_TEMPLATES` + `renderRecoveryMail(locale, link)` → `ADDRESS_CONFIRMATION_MAIL_TEMPLATES` / `renderAddressConfirmationMail`; `mailTemplates.test.ts` already holds 7 locales × parts completeness. Link via `buildSignInLink({ … type: 'email_change' })` after extending `LINK_TYPES`.

---

### `S/schema/506-invitation-rpcs.sql` + `00002_*.sql` (migration, CRUD)

**Throttle pattern** (anchor in `invitation_link_request`):
```sql
IF NOT private.invitation_throttle_take(
  'link:' || p_project_id::text || ':' || encode(sha256(convert_to(lower(btrim(v_candidate)), 'UTF8')), 'hex'),
  1,
  interval '60 seconds'
) THEN
  RETURN NULL;
END IF;
```
Per-caller counter: model on `'code:' || p_project_id::text || ':' || v_hash, 10, interval '15 minutes'`.

**Privilege pattern** (anchor `-- service_role only. Each of the seven is SECURITY DEFINER`): `REVOKE EXECUTE … FROM PUBLIC, anon, authenticated` then `GRANT … TO service_role`; the new RPC joins that list.

**J3 site:** `claim_invitations`' address read (anchor `SELECT lower(btrim(u.email)) INTO v_email FROM auth.users u WHERE u.id = v_uid AND u.email_confirmed_at IS NOT NULL`) gains a `raw_app_meta_data ->> 'identity_provider' IS NULL` term (exact form the planner's).

**Migration mechanics (binding, RESEARCH § HARD CONSTRAINT):** never regenerate `00001_initial_schema.sql`; the first schema commit requires the freeze from `feat/deployment-terraform-supabase` (`12c98aa5c`) merged first; then one commit = `schema/` edit + `migrations/00002_<snake>.sql` + manifest line with `shasum -a 256`, followed by `yarn check:schema-equivalence`, `yarn db:reset`, `yarn db:types`, pgTAP, `yarn db:lint:sql`. Plan step checks for `S/migrations.manifest.json` at run time and stops if absent.

**pgTAP:** extend `39-invitations.test.sql` (header lists every section; update it and `SELECT plan (329);`). New slot-RPC file copies its preamble:
```sql
BEGIN;
SET search_path = public, extensions;
DROP TABLE IF EXISTS __tcache__;
SELECT plan (N);
SELECT create_test_data ();
```

---

### `F/routes/api/oidc/authorize/+server.ts` (controller, request-response)

**Analog:** itself. Cookie write pattern for the new type cookie (identical attributes):
```ts
cookies.set(COOKIE.oidcState, result.state, {
  httpOnly: true,
  secure: true,
  sameSite: 'lax', // 'lax' required for cross-origin IdP redirects
  path: '/',
  maxAge: 600 // 10 minutes
});
```
Error-preserving catch (keep):
```ts
} catch (e) {
  if (isHttpError(e)) throw e;
  console.error('Failed to construct authorization request:', e);
  return error(500, { message: 'Failed to construct authorization request' });
}
```
Matrix check: `isRegistrationModeAllowed` from `@openvaa/app-shared` over settings read as `F/lib/server/contestant/registrationGuard.ts` does (`createDataProvider({ fetch, client: createSupabaseAnonClient({ fetch }) })`, fail-closed `.catch(() => ({}))`).

---

### `F/routes/api/oidc/callback/+server.ts` (controller, request-response)

**Analog:** itself + `F/routes/api/contestant/preregister/+server.ts`.

Keep: the `switch (provider.callbackBinding)` with `const unhandled: never = provider.callbackBinding;`, the redirect re-throw guard `if (e && typeof e === 'object' && 'status' in e && 'location' in e) throw e;`, and `clearFlowCookies` (add the type cookie):
```ts
function clearFlowCookies(cookies: Cookies): void {
  cookies.delete(COOKIE.oidcState, { path: '/' });
  cookies.delete(COOKIE.oidcNonce, { path: '/' });
  cookies.delete(COOKIE.oidcCodeVerifier, { path: '/' });
}
```
Every `buildRoute({ route: 'ContestantAppPreregister', locale, error: … })` → the CI2 route with a closed code; `upstreamOidcError(errorParam)` → map to cancel / unknown-provider code.

Invoke + session establishment, from the legacy route (status-preserving):
```ts
const { data, error: fnError } = await locals.supabase.functions.invoke('identity-callback', { body: { id_token: idToken } });
const upstreamStatus = (fnError as { context?: { status?: unknown } }).context?.status;
…
const actionUrl = new URL(data.session.action_link);
const tokenHash = actionUrl.searchParams.get('token');
const { error: verifyError } = await locals.supabase.auth.verifyOtp({ token_hash: tokenHash, type });
```
Add `project_id`, `entity_type`, and the J4 header; map `data.result` / status to a code (never forward a message); set the arrival marker; `redirect(303, buildRoute({ route: 'ContestantAppHome', locale }))`. `assert:project-scoped-queries` check 7 needs a `project_id` key in the invoke's argument text.

Test analog: `F/routes/api/auth/callback/server.test.ts`.

---

### `F/lib/contestant/utils/oidcError.ts` (utility, transform)

**Analog:** itself + `loginError.ts`.
```ts
export const OIDC_ERROR: Record<OidcErrorKey, OidcError> = {
  invalidState: 'invalid_state',
  invalidToken: 'invalid_token',
  missingCode: 'missing_code',
  tokenExchangeFailed: 'token_exchange_failed'
} as const;
```
Class lookup from untrusted input, from `loginError.ts`:
```ts
export function getErrorTranslationKey(error: string | null | undefined): TranslationKey | undefined {
  if (error == null || !Object.hasOwn(CONTESTANT_LOGIN_ERROR, error)) return undefined;
  return CONTESTANT_LOGIN_ERROR[error as ContestantLoginError];
}
```
CI2's version returns a class (`'cancelled' | 'retry' | 'noRetry'`), defaulting to `'retry'` for unknown values.

---

### `F/lib/contestant/gates/gates.ts` + `gateViews.ts`

**Analog:** itself:
```ts
export type ContestantGateId = 'setPassword' | 'termsOfUse';
export const CONTESTANT_GATES: ReadonlyArray<ContestantGate> = Object.freeze([
  Object.freeze({
    id: 'setPassword',
    isNeeded: (user: BasicUserData) => user.passwordSet === false
  }),
  Object.freeze({
    id: 'termsOfUse',
    isNeeded: (user: BasicUserData) => user.termsOfUseAccepted == null
  })
]);
```
Insert `identityProvider` between them; `setPassword` gains `&& user.addressState === 'proved'` **in the same commit** as the invite recipe (Pitfall 3). Contract point 2 ("decided on user-level data only") holds — the org-name fact must be on `BasicUserData`. `gateViews.ts`: `identityProvider: IdentityProviderGate,`.

---

### `F/lib/contestant/gates/IdentityProviderGate.svelte` (gate view)

**Analog:** `SetPasswordGate.svelte` — copy the `@component` doc sections (Dynamic component / Properties / Accessibility / Usage), and:
```svelte
import { invalidateAll } from '$app/navigation';
import { MainContent } from '$layouts/main';
import { Button } from '$lib/components/button';
import { ErrorMessage } from '$lib/components/errorMessage';
import { getContestantContext } from '$lib/contexts/contestant/contestantContext.svelte';
import { getUUID } from '$lib/utils/components';

// user is a reactive accessor: read via contestantCtx.user in the markup, never destructured.
const contestantCtx = getContestantContext();
const { clearEntryFlow, logout, setPassword, t } = contestantCtx;
const formId = getUUID();
let status = $state<'idle' | 'saving' | 'failed'>('idle');
```
Components per UI-SPEC: `EmailEntry` (with new `showEmailError`), `Input type="text-multilingual"`, `HeroEmoji`, `Button color="warning"` for logout. State attributes `data-variant`, `data-address-state`, `data-asks`, `data-gate-state` on the container (UI-SPEC Locator Contract).

---

### `F/lib/api/adapters/supabase/dataWriter/supabaseDataWriter.ts` `_getBasicUserData`

**Analog:** itself. The verified user is already read first (`const { data: { user }, error: userError } = await this.supabase.auth.getUser();`), and `get_user_entities` is already called for the password fact:
```ts
const { data: listed, error: passwordError } = await this.supabase.rpc('get_user_entities', { p_project_id: this.projectId });
if (passwordError) throw new Error(`getBasicUserData: could not read the password fact: ${passwordError.message}`);
const passwordSet = parseCallerPasswordSet(listed);
```
Derive `addressState` from `user.email`, `user.new_email`, `user.app_metadata.identity_provider`; `ownOrganizationUnnamed` from `listed` + `app_metadata.registered_entities`. Never from the session object (`assert:no-session-in-loads`).

---

### `ENTRY/(protected)/+layout.server.ts`

**Analog:** itself. Keep "Read for the dependency alone" (`void params.entityType;`) and the no-`url` rule; the arrival marker is `cookies.get(COOKIE.<marker>)` added to the destructured `load({ fetch, locals, params, cookies })`, passed to the gate decision (Stage 3). If `answersLocked` must precede the gates (Pitfall 13), move the `dataProvider.getAppSettings()` read from Stage 4 up, keeping its fail-soft `.catch((e): DPDataType['appSettings'] => { … return {}; })`. `layout.tracking.test.ts` stays green because cookies are not tracked.

---

### CI2: `ENTRY/register/identity-provider/error/+page.server.ts`

**Analog:** `ENTRY/password-reset/+page.server.ts` — a single-purpose load whose TSDoc states what is never returned:
```ts
export async function load({ locals }) {
  const { session, user } = await locals.safeGetSession();
  if (!session || !user) redirect(303, buildRoute({ route: 'ContestantAppLogin', locale: locals.currentLocale }));
  return { email: user.email };
}
```
CI2's: `return { errorClass: oidcErrorClass(url.searchParams.get('error')) };` — the class only, the parameter never echoed. (This is a public route outside `(located)` and `(protected)`, so the no-tracked-url rule does not apply.)

---

### `ENTRY/register/+page.svelte` (selector C)

**Analog:** itself; the replaced line:
```ts
if (mode === 'identity_provider') void goto(getRoute.current('ContestantAppPreregister'));
```
becomes a same-origin `fetch('POST', authorize, { entityType, codeChallenge? })` then `window.location = authorizeUrl` (the PKCE verifier write, if kept client-side, moves here from the deleted `preregister/+page.svelte` `redirectToIdentityProvider`). Its docstring line "The identity provider's panel holds the introduction of the pre-registration start" is rewritten. Test: `ENTRY/register/page.svelte.test.ts`.

---

### `scripts/assert-no-preregister.mjs` (repo gate)

**Analog:** `scripts/assert-no-candidate-app-names.mjs`:
```js
import { execFileSync } from 'node:child_process';
const REPO_ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const SELF = 'scripts/assert-no-candidate-app-names.mjs';
const FIXTURE_INPUT = 'scripts/fixtures/assert-no-candidate-app-names.input.ts';
const FIXTURE_EXPECTED = 'scripts/fixtures/assert-no-candidate-app-names.expected.ts.violations';
const SELF_PATHS = [SELF, 'scripts/fixtures/assert-no-candidate-app-names.'];
const SKIP = (file) => file.startsWith('.planning/') || file.startsWith('.yarn/') || SELF_PATHS.some((p) => file.startsWith(p));
const EXEMPT = [ /* masked before matching */ ];
…
const files = execFileSync('git', ['ls-files', '-z'], { encoding: 'utf8', maxBuffer: 1 << 28 })
```
Usage/exit block (`0` clean / `--report` / self-test pass; `1` finding; `2` usage). Scope to `apps/`, `packages/`, `tests/`. Known traps (Pitfall 15), decided in the plan: `packages/app-shared/src/data/schemas/storedSettings.schema.test.ts` (tests that `preRegistration` is **rejected** — keep) and `assert-no-candidate-app-names.mjs` + its fixtures (its own `Preregistration` patterns, outside the scanned scope only if `scripts/` is excluded). Add to `package.json` beside `"assert:no-candidate-app-names"` and append `&& yarn assert:no-preregister` to `lint:check`.

---

### `tests/tests/support/mockOidcIssuer.ts`

**Analog:** itself. Keep `BIND_HOST = '127.0.0.1'`, the HTTPS server with the committed cert, the JWKS arm. Change the authorize arm:
```ts
const location = `${redirectUri}?code=test-code&state=${encodeURIComponent(state)}`;
```
→ read a selector cookie from `req.headers.cookie`, emit `?error=access_denied&state=…` / `?error=<other>` / a unique code mapped in memory to `{claims, outcome}`; the token arm (`buildTestIdToken(IDURA_CLAIMS, sigPriv, encPubJwk, tokenIssAud())`) looks the code up. Export a claims factory instead of the single `IDURA_CLAIMS`. Rewrite the header (it states "PLAYWRIGHT_BANK_AUTH-gated" and `NODE_TLS_REJECT_UNAUTHORIZED=0`, both untrue after D-19).

---

### `tests/tests/utils/mailedLink.ts`

```ts
export type MailedLinkType = 'magiclink' | 'recovery';
const MAILED_LINK_TYPES: ReadonlyArray<MailedLinkType> = Object.freeze(['magiclink', 'recovery']);
```
Add `'email_change'` to both; update the header's "the type is `magiclink` in a sign-in mail and `recovery` …" sentence.

---

### `tests/tests/specs/contestant/contestant-identity-provider.spec.ts`

**Analog:** `contestant-email-registration.spec.ts` — fixtures-only spec (`createRegistrationTest`), a `# Title` + `## What it covers` TSDoc block, prefixes from `tests/tests/utils/invitationConstants.ts`. Tags in titles (`@reg-idp`, `@org-registration`). Axe entries through the shared `assertAxeScan` light/dark twins as `declareEntryScans` does. Fixture rigidity contract (copy from `contestantSetPasswordGate.fixture.ts`): "NO `expect.soft`, NO `try/catch` wrapping `expect(...)`, NO `.catch(() => null)`".

---

### `tests/playwright.config.ts`

**Analog:** itself — the bank-auth-journey block (`data-setup-bank-auth-journey` → `teardown: 'data-teardown-bank-auth-journey'`, dependency on the perm chain's last project, `ignoreHTTPSErrors: true` on the browser context) and the `webServer` mock entry under `...(process.env.PLAYWRIGHT_BANK_AUTH ? [...] : [])`. Remove the ternaries (three sites: projects for `bank-auth`, the journey trio, the `webServer` entry), and the leaf-derivation docblock that mentions `PLAYWRIGHT_BANK_AUTH`. The orphan-probe guard (`PROBE_TEST_MATCH`, "Orphaned probe spec(s)") is the model for the coverage-tag script's failure message.

---

## Shared Patterns

### Pure-sibling modules for Edge Functions
**Source:** `S/functions/identity-callback/entityGrant.ts` header ("reaches the Deno runtime global nowhere and imports from a remote origin nowhere … The client is a parameter") and `account-access/contract.ts`.
**Apply to:** every new `identity-callback` / `account-access` module. `index.ts` cannot be imported by vitest; assertions about it are source-text (`flowConformance.test.ts`, `envReadSites.test.ts` with `readFileSync(new URL('./index.ts', import.meta.url), 'utf8')`).

### Logged, never returned
**Source:** `identity-callback/index.ts` catch arms; `account-access/linkIssue.ts` `describeFailure` and the `log` TSDoc ("never receives an address, a code, a token hash, a link, a locale or a request").
**Apply to:** both functions, the OIDC callback, CI2. Answers are frozen literals; the coarse code is the only variable part.

### Required environment, never defaulted
**Source:** `identity-callback/envConfig.ts` `requireEnv(name, value)` (throws `ERR_ENV_UNCONFIGURED`); `scripts/assert-edge-function-env.mjs` derives required sets from `requireEnv(` calls.
**Apply to:** the J4 secret in the function; frontend reads it from `$env/dynamic/private` and refuses when unset.

### Cookie names
**Source:** `F/lib/cookies/index.ts` `COOKIE` + `cookies.test.ts` exact-set pin + `scripts/assert-cookie-names.mjs` (no literal names at operation sites).
**Apply to:** type cookie, arrival marker, removal of `idToken`. Flow-cookie attributes: `httpOnly: true, secure: true, sameSite: 'lax', path: '/', maxAge: 600`.

### Fail-closed settings read
**Source:** `F/lib/server/contestant/registrationGuard.ts` `isRegistrationOffered` (anon client, `.catch` → `{}`, which lists no mode).
**Apply to:** authorize and callback matrix checks. In the function, a failed read **refuses** (D-03).

### Route building
**Source:** `buildRoute({ route: '<Key>', locale: locals.currentLocale, error })` — "`error` is not a declared route param, so the builder puts it on the search side and percent-encodes it; no caller here may encode a value first".
**Apply to:** every redirect to CI2 and to `ContestantAppHome`.

### Form actions
**Source:** `ENTRY/register/sign-in/+page.server.ts` (`actions.default`, guard re-asked inside the action, one per-request writer built lazily, `fail(status, { status })`, `redirect(303, buildRoute(...))`).
**Apply to:** CI1's Continue and the resend/change actions.

### Context reactivity
**Source:** `SetPasswordGate.svelte` comment "user is a reactive accessor: read via contestantCtx.user in the markup, never destructured."
**Apply to:** CI1, home reminder, settings section.

### i18n catalogues
**Source:** 178's catalogue additions (`PD178/178-PATTERNS.md`); `assert:i18n-catalog-namespaces` is the tripwire; regenerate `F/lib/types/generated/translationKey.ts`.
**Apply to:** CI1 (four variants), CI2 (three classes), C's type group, the reminder, settings; deletion of `contestantApp.preregister` ×7 and its inlang line.

### Driver gate discipline
**Source:** `PD178/178-gates.sh` (one row per gate, status read directly, background + marker), `PD178/178-bankauth.sh` (generated env outside repo via `mktemp`, issuer read back from the container, `yarn db:stop`/`db:start` restore, `178-stack-probe.sh`).
**Apply to:** all 179 drivers and the D-19 wrapper changes.

## No Analog Found

| File | Role | Data Flow | Reason |
|---|---|---|---|
| `S/migrations/00002_*.sql` + `S/migrations.manifest.json` line | migration | — | Frozen-baseline model exists only on `feat/deployment-terraform-supabase` (`git show …:apps/supabase/supabase/migrations.manifest.json`, `…:scripts/assert-schema-migration-parity.mjs`). This branch's guard rejects a second migration file until the freeze is merged (RESEARCH Open Question 1). |
| Three-call email-change recipe inside `addressConfirmation.ts` | service | request-response | No code on the tree calls `generateLink({ type: 'email_change_current' | 'email_change_new' })` or `/auth/v1/verify` server-side for an email change; use RESEARCH § RQ-1 and Code Examples, confirmed by Wave-0 probe P1–P7. |
| J4 constant-time server-secret compare | middleware | request-response | No shared-secret header check exists in either function; RESEARCH § RQ-4 design is `[ASSUMED]`. |
| Mock-issuer per-test selector | test service | request-response | The mock mints one fixed identity; RESEARCH Pattern 9 design is `[ASSUMED]`. |

## Metadata

**Analog search scope:** `apps/supabase/supabase/{functions,schema,tests/database}`, `apps/frontend/src/{routes/api,routes/contestant,lib/contestant,lib/cookies,lib/server/contestant,lib/api,lib/routes,lib/analytics}`, `packages/app-shared/src/settings`, `packages/dev-seed/tests`, `scripts/`, `tests/{scripts,tests/support,tests/utils,tests/fixtures,tests/specs,tests/setup}`, `tests/playwright.config.ts`, `.planning/phases/178-*/`.
**Files scanned:** ~60 read or grepped.
**Pattern extraction date:** 2026-10-21
