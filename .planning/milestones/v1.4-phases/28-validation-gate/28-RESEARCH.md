# Phase 28: Validation Gate - Research

**Researched:** 2026-03-21
**Domain:** Svelte 5 migration validation (legacy pattern audit, TypeScript checking, E2E testing, SES email infrastructure)
**Confidence:** HIGH

## Summary

Phase 28 is the final validation gate for the v1.4 Svelte 5 candidate app migration. It verifies three requirements: zero legacy Svelte 4 patterns in candidate routes (VALD-01), zero TypeScript errors (VALD-02), and all 5 candidate-app E2E test files passing (VALD-03). Research confirms the codebase is very close to clean based on Phase 27 verification data, but 3 E2E tests fail due to SES email infrastructure issues that must be diagnosed and fixed.

The legacy pattern audit is expected to pass cleanly -- Phase 27 verification found zero executing legacy patterns in candidate routes. One commented-out `on:change` exists in stashed code in the settings page but is inside an HTML comment block (`<!-- -->`), not executing code. TypeScript checking via `svelte-check` reported 0 errors after Phase 27's smart quote fix (120 warnings remain, which are non-blocking per user decision).

The critical work is diagnosing and fixing the SES email infrastructure failure that causes 3 tests in `candidate-registration.spec.ts` and `candidate-profile.spec.ts` to fail. These tests depend on: (1) Strapi sending registration/reset emails via LocalStack SES, (2) the test helper reading emails from LocalStack's `/_aws/ses` endpoint, and (3) extracting registration links from the raw MIME email body. The failure is pre-existing since v1.3 and the root cause needs investigation.

**Primary recommendation:** Run the legacy pattern audit first (fast, expected clean). Then run svelte-check (expected clean). Then diagnose the SES email infrastructure issue by checking LocalStack container health, verifying email identity, checking Strapi logs for send errors, and inspecting the `/_aws/ses` endpoint response. Fix the SES issue, then run the full E2E suite.

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions
- D-01: Do NOT flip `compilerOptions.runes: true` globally -- 16 `.svelte` files (root layout, error page, admin routes, Banner, Header, MaintenancePage, color preview) haven't been migrated and would break
- D-02: Keep per-component `<svelte:options runes />` directives on all 151 migrated files -- they serve as documentation and are harmless
- D-03: Global runes switch deferred to a future milestone when admin routes and remaining files are migrated
- D-04: Audit scope is `apps/frontend/src/routes/candidate/` only -- voter routes and shared components already verified in Phase 26
- D-05: Legacy patterns to check: `$:`, `on:event` directives (not native `onclick`), `<slot`, `createEventDispatcher` -- zero matches required
- D-06: Any legacy pattern found in candidate routes is a regression from Phase 27 and must be fixed inline
- D-07: Run `svelte-check` on the full frontend codebase (not just candidate routes) -- catches cross-file type regressions from the migration
- D-08: Zero TypeScript errors required; compiler warnings are informational but non-blocking
- D-09: All 5 candidate-app E2E test files must execute and pass: candidate-auth, candidate-profile, candidate-questions, candidate-registration, candidate-settings
- D-10: The 3 failing candidate-app-mutation tests (registration, profile, auth -- SES email infrastructure) should be investigated and fixed inline as part of Phase 28. The SES mailer has worked before and the failure is likely a config or LocalStack issue, not a code issue
- D-11: Docker stack (`yarn dev`) assumed already running -- plan does not manage Docker lifecycle

### Claude's Discretion
- Order of validation steps (audit -> type check -> SES fix -> E2E, or different)
- How to diagnose the SES email infrastructure issue
- Exact svelte-check command flags
- How to batch E2E test execution

### Deferred Ideas (OUT OF SCOPE)
- Global `compilerOptions.runes: true` -- flip after admin routes and remaining 16 files are migrated
- Strict compiler warnings mode -- enable `--compiler-warnings treat-as-errors` after all code is migrated
- Context system rewrite -- TODO[Svelte 5] markers in 7 files (contexts, admin, layouts) -- separate milestone
</user_constraints>

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|------------------|
| VALD-01 | Zero legacy Svelte 4 patterns ($:, on:event, `<slot`, createEventDispatcher) in candidate routes | Audit scope is 25 .svelte files in `apps/frontend/src/routes/candidate/`. Phase 27 verification already found 0 executing legacy patterns. One commented-out `on:change` in stashed HTML comment block -- not executing code. Grep commands documented below for verification. |
| VALD-02 | Zero TypeScript errors in candidate app | svelte-check 4.4.5 on full frontend workspace. Phase 27 verified 0 errors, 120 warnings. Warnings are non-blocking per D-08. Command: `cd apps/frontend && npx svelte-check --threshold error`. |
| VALD-03 | All 5 candidate-app E2E test files pass | Playwright 1.58.2 with project dependency ordering. 5 spec files in `tests/tests/specs/candidate/`. 3 tests in candidate-app-mutation project fail due to SES email infrastructure. Root cause investigation and fix documented below. |
</phase_requirements>

## Standard Stack

### Core
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| svelte-check | 4.4.5 | Svelte + TypeScript diagnostics | Official Svelte type checking tool, already installed |
| @playwright/test | 1.58.2 | E2E testing framework | Already configured with project dependencies |
| svelte | 5.53.12 | Frontend framework | Migration target |
| typescript | 5.8.3 (catalog) / 5.9.3 (installed) | Type system | Project standard |

### Supporting
| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| @strapi/provider-email-nodemailer | 5.9.0 | Strapi email via SES | Nodemailer SES transport for registration/reset emails |
| @aws-sdk/client-ses | (bundled) | AWS SES client | Used by nodemailer to send via LocalStack |
| mailparser | (installed in tests) | MIME email parsing | Used by emailHelper.ts to parse RawData from SES inbox |
| cheerio | (installed in tests) | HTML parsing | Used by emailHelper.ts to extract links from parsed email |

No new packages required. All tools already installed.

## Architecture Patterns

### Validation Execution Order

**Recommended: Audit -> Type Check -> SES Diagnosis -> SES Fix -> E2E**

1. **Legacy Pattern Audit (VALD-01)** -- fastest, mechanical grep across 25 files. Expected clean based on Phase 27 verification. If findings exist, fix them first since they may cause type/runtime errors.
2. **Type Check (VALD-02)** -- run `svelte-check --threshold error`. Expected clean (0 errors after Phase 27). This catches compile-time issues before runtime E2E testing.
3. **SES Diagnosis** -- investigate why LocalStack SES email delivery fails before running E2E tests. This is the critical path item.
4. **SES Fix** -- apply the fix for the diagnosed issue.
5. **E2E Tests (VALD-03)** -- run all candidate-app E2E tests. Must run after SES fix so email-dependent tests pass.

### Svelte-Check Command

```bash
cd apps/frontend && npx svelte-check --threshold error
```

Key flags:
- `--threshold error` -- only report errors, not warnings (warnings are non-blocking per D-08)
- Do NOT use `--compiler-warnings treat-as-errors` (deferred to post-migration)
- Cannot be scoped to subdirectories -- checks entire workspace. All errors count, regardless of file location.

### Legacy Pattern Audit Commands

Scope: `apps/frontend/src/routes/candidate/` (25 .svelte files)

```bash
# $: reactive statements (ALL occurrences including comments)
grep -rn '\$:' apps/frontend/src/routes/candidate/ --include="*.svelte"

# on:event directives (not native onclick)
grep -rn ' on:[a-z]' apps/frontend/src/routes/candidate/ --include="*.svelte"

# <slot elements
grep -rn '<slot' apps/frontend/src/routes/candidate/ --include="*.svelte"

# createEventDispatcher
grep -rn 'createEventDispatcher' apps/frontend/src/routes/candidate/ --include="*.svelte"
```

**Current findings (verified by research):**
| Pattern | In Executing Code | In Comments/Stashed | Total |
|---------|-------------------|---------------------|-------|
| `$:` | 0 | 0 | 0 |
| `on:event` | 0 | 1 (settings, stashed HTML) | 1 |
| `<slot` | 0 | 0 | 0 |
| `createEventDispatcher` | 0 | 0 | 0 |

The one `on:change` occurrence is on line 112 of `apps/frontend/src/routes/candidate/(protected)/settings/+page.svelte`, inside a `<!-- Stashed language selector -->` HTML comment block. It is not executing code. Per D-05, the requirement is "zero matches" -- the grep will report it, and the planner must decide whether to treat it as a failure (remove the stashed block) or pass (it is already commented out).

### E2E Test Commands

```bash
# Full suite (all projects including voter, variants)
npx playwright test -c tests/playwright.config.ts

# Candidate-only projects
npx playwright test -c tests/playwright.config.ts --project=candidate-app --project=candidate-app-mutation --project=candidate-app-settings

# Note: candidate projects depend on data-setup and auth-setup,
# which Playwright automatically includes when you specify dependent projects
```

**Project execution order** (enforced by Playwright dependencies):
1. `data-setup` -- imports test dataset, unregisters addendum candidates, resets passwords
2. `auth-setup` -- logs in as Test Candidate Alpha, saves storageState
3. `candidate-app` -- runs candidate-auth.spec.ts and candidate-questions.spec.ts (parallel)
4. `candidate-app-mutation` -- runs candidate-registration.spec.ts and candidate-profile.spec.ts (depends on candidate-app)
5. `candidate-app-settings` -- runs candidate-settings.spec.ts (depends on candidate-app-mutation)

**Batching recommendation:** Run all candidate projects at once. Playwright config handles ordering via project dependencies. Running individual spec files without including setup projects would fail.

### SES Email Infrastructure Architecture

The email flow for registration and password-reset tests:

```
Test (outside Docker)                  Docker Network
┌─────────────────────┐               ┌──────────────────────────────────────────┐
│                     │               │                                          │
│  strapiAdminClient  │─── HTTP ───>  │  Strapi (port 1337)                      │
│  sendEmail()        │               │    ├─ Admin Tools plugin                 │
│  sendForgotPassword │               │    │   ├─ email service: sendToAll()     │
│                     │               │    │   └─ candidateAuth: sendForgotPw()  │
│                     │               │    └─ @strapi/provider-email-nodemailer  │
│                     │               │        └─ Nodemailer SES transport       │
│                     │               │            └─ sendRawEmail ──────────>   │
│                     │               │                                          │
│  emailHelper        │               │  LocalStack (awslocal:4566)              │
│  fetchEmails()      │─── HTTP ───>  │    ├─ SES: stores sent email in memory   │
│  GET /_aws/ses      │  localhost:   │    ├─ /_aws/ses: serves stored emails    │
│                     │     4566      │    └─ Init script: verify-email-identity │
└─────────────────────┘               └──────────────────────────────────────────┘
```

**Key config values:**
- Strapi inside Docker: `LOCALSTACK_ENDPOINT=http://awslocal:4566` (overridden in docker-compose.dev.yml)
- Tests outside Docker: `LOCALSTACK_ENDPOINT=http://127.0.0.1:4566` (from `.env`)
- SES email provider: `@strapi/provider-email-nodemailer` 5.9.0 with SES transport
- SES credentials: `test/test` (LocalStack defaults)
- SES region: `us-east-1`
- Verified sender: `no-reply@openvaa.org` (verified by `localstack-init-aws.sh`)
- Nodemailer uses `sendRawEmail` API, storing `RawData` in LocalStack
- emailHelper.ts reads `RawData` and parses with `mailparser`

**Email response format (from LocalStack `/_aws/ses`):**
```json
{
  "messages": [
    {
      "Id": "unique-id",
      "Region": "us-east-1",
      "Source": "no-reply@openvaa.org",
      "RawData": "MIME encoded email content...",
      "Timestamp": "2026-03-21T..."
    }
  ]
}
```

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Type checking | Custom TypeScript script | `svelte-check --threshold error` | Handles Svelte component types, snippets, runes |
| Pattern scanning | Regex engine | grep with known pattern list | Well-tested, fast, handles edge cases |
| E2E test orchestration | Custom runner | Playwright project dependencies | Already configured with setup/teardown, ordering |
| Email parsing | Custom MIME parser | mailparser + cheerio (already used) | MIME parsing is deceptively complex |

**Key insight:** This phase is entirely about running existing tools, diagnosing an infrastructure issue, and fixing what they find. No new infrastructure is needed.

## Common Pitfalls

### Pitfall 1: Running E2E Without Docker Stack
**What goes wrong:** All tests fail with connection errors
**Why it happens:** E2E tests need frontend (5173), strapi (1337), postgres (5432), localstack (4566)
**How to avoid:** Verify Docker stack is up before running. The plan assumes `yarn dev` is already running (D-11).
**Warning signs:** `ECONNREFUSED` or timeout errors in first test

### Pitfall 2: SES Email Identity Not Verified
**What goes wrong:** Strapi's email plugin throws an error when sending, emails never reach LocalStack inbox
**Why it happens:** LocalStack requires `verify-email-identity` for the sender. The init script at `apps/strapi/localstack-init-aws.sh` does this, but if LocalStack was restarted without re-running init, the identity is lost.
**How to avoid:** Check `awslocal ses list-identities --region us-east-1` -- the `MAIL_FROM` address must appear
**Warning signs:** Strapi logs show SES send errors, no emails in `/_aws/ses` response

### Pitfall 3: Stale Email Matching in Tests
**What goes wrong:** Tests match stale emails from previous runs instead of the newly sent email
**Why it happens:** LocalStack persists emails in memory across test runs
**How to avoid:** The tests already handle this via `countEmailsForRecipient()` before sending, then `getLatestEmailHtml(email, skipCount)` to skip stale emails. If the count logic has a bug, stale emails could cause false matches or `undefined` results.
**Warning signs:** `registrationLink` is from a previous test run (wrong URL or expired token)

### Pitfall 4: Svelte-Check Scope Confusion
**What goes wrong:** Errors outside candidate routes treated as blockers or missed
**Why it happens:** `svelte-check` checks the entire frontend workspace, cannot be scoped
**How to avoid:** Per D-07, run on full codebase. Per D-08, zero errors required anywhere. Warnings are non-blocking.
**Warning signs:** Error counts different from expected

### Pitfall 5: Playwright Data Setup Failure Cascading
**What goes wrong:** `data-setup` or `auth-setup` fails, all downstream candidate tests skip
**Why it happens:** Project dependency chain: data-setup -> auth-setup -> candidate-app -> candidate-app-mutation -> candidate-app-settings
**How to avoid:** Check setup project results first. If auth-setup fails (Strapi timeout, rate limiting), investigate that before looking at spec failures.
**Warning signs:** All candidate tests show "skipped", only setup projects have actual failures

### Pitfall 6: LocalStack Container Version Drift
**What goes wrong:** API response format changes silently
**Why it happens:** `localstack/localstack` image tag is `:latest` -- no pinned version. A `docker compose pull` could update the image.
**How to avoid:** Check `docker inspect localstack` for the actual image version. If the API response format doesn't match what emailHelper expects (no `messages` array, no `RawData` field), the version may have changed.
**Warning signs:** `fetchEmails()` returns empty array or unexpected structure

### Pitfall 7: Commented-Out Code Matching as Legacy Pattern
**What goes wrong:** Grep reports `on:change` in HTML comment block as a legacy pattern violation
**Why it happens:** Grep matches text regardless of context (executing code vs comment)
**How to avoid:** Distinguish executing code from comments. The stashed `on:change` on line 112 of settings is inside `<!-- ... -->`. The CONTEXT says "zero matches required" for `on:event` directives -- need to decide if a commented-out directive counts.
**Warning signs:** Single match in settings page, inside HTML comment block

## Code Examples

### SES Diagnostic Commands

```bash
# 1. Check LocalStack container health
docker ps --filter name=awslocal --format "{{.Status}}"

# 2. Check SES email identities
docker exec $(docker ps -q --filter name=awslocal) awslocal ses list-identities --region us-east-1

# 3. Check SES inbox for any stored emails
curl -s http://localhost:4566/_aws/ses | python3 -m json.tool

# 4. Check Strapi logs for email send errors
docker logs $(docker ps -q --filter name=strapi) 2>&1 | grep -i "email\|ses\|error" | tail -20

# 5. Send a test email directly via LocalStack SES CLI
docker exec $(docker ps -q --filter name=awslocal) awslocal ses send-email \
  --from "no-reply@openvaa.org" \
  --destination "ToAddresses=test@test.com" \
  --message 'Subject={Data=Test},Body={Text={Data=Test body}}' \
  --region us-east-1

# 6. Check if the test email appeared
curl -s http://localhost:4566/_aws/ses | python3 -m json.tool
```

### Trigger Email via Admin Tools (manual test)

```bash
# Get admin JWT token
TOKEN=$(curl -s -X POST http://localhost:1337/admin/login \
  -H "Content-Type: application/json" \
  -d '{"email":"mock.admin@openvaa.org","password":"admin"}' | \
  python3 -c "import sys,json; print(json.load(sys.stdin)['data']['token'])")

# Find candidate documentId
CANDIDATE=$(curl -s -X POST http://localhost:1337/openvaa-admin-tools/find-data \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '"{\"collection\":\"candidates\",\"filters\":{\"email\":{\"\\$eq\":\"test.unregistered@openvaa.org\"}}}"' | \
  python3 -c "import sys,json; print(json.load(sys.stdin)['data'][0]['documentId'])")

# Send registration email
curl -s -X POST http://localhost:1337/openvaa-admin-tools/send-email \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d "{\"candidateId\":\"$CANDIDATE\",\"subject\":\"Test\",\"content\":\"Link: {LINK}\",\"requireRegistrationKey\":true}"

# Check if email arrived in LocalStack
curl -s http://localhost:4566/_aws/ses | python3 -m json.tool
```

### Potential SES Fix Patterns

**If email is not being sent (Strapi error):**
```bash
# Check that LOCALSTACK_ENDPOINT is correctly resolved inside Strapi container
docker exec $(docker ps -q --filter name=strapi) printenv LOCALSTACK_ENDPOINT
# Expected: http://awslocal:4566

# Check that awslocal hostname resolves inside Strapi container
docker exec $(docker ps -q --filter name=strapi) ping -c 1 awslocal
```

**If email is sent but not retrieved (API issue):**
```bash
# Check the raw response from the SES endpoint
curl -v http://localhost:4566/_aws/ses
# Look at Content-Type and response body structure

# If response has different structure (e.g., Body instead of RawData):
# Update emailHelper.ts to handle both formats
```

**If email is sent but mailparser fails (MIME parsing issue):**
```typescript
// Debug: log the raw response to see what LocalStack actually returns
const emails = await fetchEmails();
console.log('SES inbox response:', JSON.stringify(emails.slice(0, 1), null, 2));
```

## Validation Architecture

### Test Framework
| Property | Value |
|----------|-------|
| Framework | Playwright 1.58.2 + svelte-check 4.4.5 |
| Config file | `tests/playwright.config.ts` (E2E), `apps/frontend/tsconfig.json` (types) |
| Quick run command | `cd apps/frontend && npx svelte-check --threshold error` |
| Full suite command | `npx playwright test -c tests/playwright.config.ts` |

### Phase Requirements -> Test Map
| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|-------------|
| VALD-01 | Zero legacy patterns in candidate routes | audit script | `grep -rn` commands (see Architecture Patterns) | N/A (grep) |
| VALD-02 | Zero TypeScript errors | static analysis | `cd apps/frontend && npx svelte-check --threshold error` | Yes (svelte-check installed) |
| VALD-03 | All 5 candidate E2E tests pass | e2e | `npx playwright test -c tests/playwright.config.ts --project=candidate-app --project=candidate-app-mutation --project=candidate-app-settings` | Yes (5 spec files) |

### Sampling Rate
- **Per task commit:** `cd apps/frontend && npx svelte-check --threshold error` (after any code changes)
- **Per wave merge:** Candidate E2E projects
- **Phase gate:** All three validation requirements green before `/gsd:verify-work`

### Wave 0 Gaps
None -- existing test infrastructure covers all phase requirements. No new test files or frameworks needed.

## SES Email Infrastructure - Deep Analysis

### What We Know (HIGH confidence)

1. **3 tests fail** in `candidate-app-mutation` project:
   - `candidate-registration.spec.ts:73` -- "should complete registration via email link"
   - `candidate-registration.spec.ts:133` -- "should complete forgot-password and reset flow via SES email"
   - `candidate-profile.spec.ts:59` -- "should register the fresh candidate via email link"

2. **The failure mode**: `registrationLink` extracted from email is `undefined`, causing `page.goto(registrationLink)` to fail with "expected string, got undefined"

3. **The failure is pre-existing**: Confirmed by reverting all Phase 27 changes -- same failure. Existed since at least v1.3.

4. **The email flow chain**:
   - Test calls `strapiAdminClient.sendEmail()` -> Strapi Admin Tools `/send-email` endpoint
   - Strapi email service builds registration URL, calls `strapi.plugins['email'].services.email.send()`
   - `@strapi/provider-email-nodemailer` uses SES transport -> `sendRawEmail` to LocalStack
   - Test calls `emailHelper.fetchEmails()` -> GET `http://localhost:4566/_aws/ses`
   - Parses `RawData` field with `mailparser`, extracts link with `cheerio`

5. **Configuration is correct**: SES credentials (`test/test`), region (`us-east-1`), verified identity (init script), endpoint URLs all look correct.

### Investigation Priority (recommended order)

1. **Is LocalStack SES receiving emails?**
   - `curl -s http://localhost:4566/_aws/ses` -- if empty `{"messages": []}`, the email is never sent
   - Check Strapi logs for email send errors

2. **Is the email identity verified?**
   - `docker exec $(docker ps -q --filter name=awslocal) awslocal ses list-identities --region us-east-1`
   - Must include `no-reply@openvaa.org`

3. **Is the sendEmail API call succeeding?**
   - Add temporary logging to the test to capture the `sendEmail` response
   - Check if `sendEmail` throws or returns `{ type: 'failure', cause: ... }`

4. **Does the response format match expectations?**
   - The `emailHelper.ts` expects `{ messages: Array<{ RawData: string, ... }> }`
   - If LocalStack version changed, the format might differ

5. **Is the candidate data correct?**
   - `data.setup.ts` calls `unregisterCandidate()` for both test.unregistered emails
   - If unregistration fails silently, the candidate might lack a `registrationKey`
   - The `sendEmail` service checks for `registrationKey` and fails if missing

### Most Likely Root Causes (MEDIUM confidence)

**Hypothesis A: LocalStack SES not receiving emails from Strapi**
- Strapi's SES transport may be failing silently (the `sendToAll` function catches errors per-candidate and continues)
- The `sendToAll` response returns `{ type: 'success', sent: 0, errors: [...] }` even if all sends fail
- The test `strapiAdminClient.sendEmail()` checks `response.ok()` and `body.type === 'failure'`, but does NOT check `sent === 0` or the `errors` array

**Hypothesis B: Email identity not verified after LocalStack restart**
- The init script `localstack-init-aws.sh` runs `verify-email-identity` only on container first start
- If LocalStack data was cleared (volume deleted) but the init script didn't re-run, the identity is gone
- Without a verified identity, SES will reject the send request

**Hypothesis C: Nodemailer SES transport misconfiguration**
- The plugins.ts creates the SES client at module load time with `env('LOCALSTACK_ENDPOINT')`
- If `LOCALSTACK_ENDPOINT` resolves to `http://127.0.0.1:4566` inside the Strapi container (from .env), it would fail because 127.0.0.1 inside Docker is the container itself, not the host
- BUT the docker-compose.dev.yml explicitly overrides `LOCALSTACK_ENDPOINT: http://awslocal:4566`, so this should be correct
- Verify by checking `printenv LOCALSTACK_ENDPOINT` inside the Strapi container

**Hypothesis D: `@aws-sdk/client-ses` constructor uses SES v1 API but LocalStack expects something different**
- The plugins.ts creates `new aws.SES({...})` (v1 API class from `@aws-sdk/client-ses`)
- Nodemailer SES transport expects v3 SDK format: `{ ses: client, aws: sdk }`
- If there's a version mismatch between nodemailer's expectations and the SDK, the transport may silently fail

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| `$:` reactive statements | `$derived` / `$derived.by` / `$effect` | Svelte 5 | Migration complete in candidate routes |
| `on:event` directives | `onclick` / callback props | Svelte 5 | Migration complete in candidate routes |
| `<slot>` / `<slot name="x">` | `{@render children()}` / snippet props | Svelte 5 | Migration complete in candidate routes |
| `export let` | `$props()` | Svelte 5 | Migration complete in candidate routes |
| `_localstack/ses` endpoint | `_aws/ses` endpoint | LocalStack 1.4+ | Code already uses `_aws/ses` |

## Open Questions

1. **SES email infrastructure root cause**
   - What we know: 3 tests fail because `registrationLink` is `undefined`, meaning `getLatestEmailHtml()` returns `undefined`, meaning either no emails exist or none match the recipient
   - What's unclear: Whether the email is never sent, sent but not stored, or stored but not matching
   - Recommendation: Follow the diagnostic priority list above. Start with `curl http://localhost:4566/_aws/ses` to see if any emails exist.

2. **Commented-out `on:change` in settings page**
   - What we know: Line 112 of settings `+page.svelte` has `on:change={handleLanguageSelect}` inside `<!-- Stashed language selector -->` HTML comment block
   - What's unclear: Whether a grep match in an HTML comment counts as a "legacy pattern" for VALD-01 purposes. The CONTEXT says "zero matches required" which literally means the grep should return 0 results.
   - Recommendation: Remove the stashed HTML comment block to ensure the grep returns exactly 0 matches. The stashed code serves no runtime purpose and can be fully removed.

3. **LocalStack image version**
   - What we know: Uses `localstack/localstack:latest` (no pinned version)
   - What's unclear: Which exact version is running, and whether a recent update changed behavior
   - Recommendation: Check with `docker inspect` and consider pinning in a future PR.

## Sources

### Primary (HIGH confidence)
- `tests/playwright.config.ts` -- Playwright config with project dependencies and candidate project definitions
- `tests/tests/specs/candidate/*.spec.ts` -- 5 candidate E2E test files (read in full)
- `tests/tests/utils/emailHelper.ts` -- SES email retrieval helper (read in full)
- `tests/tests/utils/strapiAdminClient.ts` -- Admin Tools API client (read in full)
- `tests/tests/setup/data.setup.ts` -- Data setup with candidate unregistration and password reset
- `tests/tests/setup/auth.setup.ts` -- Auth setup with retry logic
- `apps/strapi/config/plugins.ts` -- Email provider config (nodemailer + SES)
- `apps/strapi/src/plugins/openvaa-admin-tools/server/src/services/email.ts` -- Email service
- `apps/strapi/src/plugins/openvaa-admin-tools/server/src/services/candidateAuth.ts` -- Forgot password service
- `apps/strapi/src/plugins/openvaa-admin-tools/server/src/services/utils/sendToAll.ts` -- Email send utility
- `apps/strapi/localstack-init-aws.sh` -- LocalStack init (SES identity verification)
- `apps/strapi/docker-compose.dev.yml` -- Docker service config
- `docker-compose.dev.yml` -- Root Docker compose
- `.env` -- Environment variables (MAIL_*, SES_*, LOCALSTACK_ENDPOINT)
- `apps/frontend/svelte.config.js` -- Svelte compiler config (no global runes)
- `.planning/phases/28-validation-gate/28-CONTEXT.md` -- User decisions
- `.planning/milestones/v1.3-phases/26-validation-gate/26-RESEARCH.md` -- v1.3 validation gate patterns
- Live grep audit: 0 executing legacy patterns, 1 commented-out `on:change`

### Secondary (MEDIUM confidence)
- [LocalStack SES Documentation](https://docs.localstack.cloud/aws/services/ses/) -- SES inbox API endpoint, response format, supported operations
- [Nodemailer SES Transport](https://nodemailer.com/transports/ses) -- SES transport uses `sendRawEmail` under the hood
- [LocalStack 4.0 Changes](https://blog.localstack.cloud/important-changes-in-localstack-4-0/) -- No SES-specific breaking changes documented
- `.planning/todos/pending/2026-03-21-fix-candidate-app-mutation-e2e-tests-ses-email-infrastructure.md` -- SES todo

### Tertiary (LOW confidence)
- SES `RawData` vs `Body` response format: LocalStack docs describe `Body` field with `text_part`/`html_part`, but the code uses `RawData` (which is what nodemailer's `sendRawEmail` stores). These may be different response fields for different SES API methods (`sendEmail` vs `sendRawEmail`). Needs runtime verification.

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH -- all tools already installed, versions verified from yarn catalog
- Architecture: HIGH -- validation commands documented from prior v1.3 gate, codebase patterns verified
- Legacy audit: HIGH -- live grep confirms Phase 27 verification (0 executing, 1 commented)
- TypeScript: HIGH -- Phase 27 confirmed 0 errors, 120 warnings
- SES diagnosis: MEDIUM -- root cause hypothesized from code analysis, needs runtime verification
- Pitfalls: HIGH -- based on actual codebase state and prior validation gate experience

**Research date:** 2026-03-21
**Valid until:** 2026-04-04 (14 days -- codebase may change if other work proceeds)
