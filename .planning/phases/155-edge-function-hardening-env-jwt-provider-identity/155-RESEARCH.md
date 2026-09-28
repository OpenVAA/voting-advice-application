# Phase 155: Edge Function Hardening — env, JWT, provider identity - Research

**Researched:** 2026-08-28
**Domain:** Supabase Deno Edge Functions — JWT decoding, OIDC claim verification, environment-configuration hygiene, and the test harness that can prove any of it
**Confidence:** HIGH (every load-bearing claim was reproduced by a command run this session; the two `[ASSUMED]` items are named in the Assumptions Log)

**Measured at:** working tree of `integration/ship-12-squash`, HEAD `db220cb5f` (three doc commits after the `52c631edf` the CONTEXT measured at; **no source line moved** — every file:line in CONTEXT `<facts>` re-verified byte-exact below).

---

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions

Copied from `155-CONTEXT.md` § `<decisions>`. The prose sections there carry the reasoning; these are the binding outcomes.

- **D-D1 — Criterion 4 (Signicat identity): option (a).** *Reduce criterion 4 to a documentation-and-confirmation task.* "check current Signicat docs that `sub` is a stable per-person pseudonym (not per-session or per-client), record the finding with a citation, and close. No code change expected. The removal branch is moot." — **"The `hetu` fallback and the 'remove Signicat support completely' branch are both dead**; a planner must not re-open either." — **"If — and only if — that check finds `sub` is *not* a stable per-person identifier, criterion 4 re-opens as a real code decision; that outcome must be escalated as a `checkpoint:decision`, not absorbed."**

- **D-D2 — Env-default removal: option (a).** *All 7 sites, plus a guard asserting no `Deno.env.get(...)` is followed by `??`/`||` in the functions tree.* "the criterion says '**Every** `??`/`||` env default'; the guard makes the class **closed** rather than the instances fixed." Guard note: "the guard's own predicate must not be defeated by `identity-callback:197`, whose `||` chain begins with a **non-env** operand… A naive '`Deno.env.get` immediately followed by `??`/`||`' matcher catches it; a 'assignment starts with `Deno.env.get`' matcher does not."

- **D-D3 — `identity-callback:197`: option (a).** *Throw in **155** on missing `DEFAULT_PROJECT_ID`; let **161** rename / converge the variable.* "155 therefore **does** touch line 197 and **does not** touch line 31." 155 does **not** introduce, rename, or converge `PROJECT_ID`.

- **D-D4 — `send-email` placeholder regex: option (a).** *Allow surrounding spaces (the reviewer's ask) and keep the flat lookup, with a one-line comment stating that dotted keys are literal.* "option (b) would have broken **every** existing placeholder in the product." The comment "should say exactly that: the dotted key is a flat key that contains dots, produced dotted by `resolve_email_variables`; the regex's `(?:\.\w+)*` group is **not** a path traversal." The misleading comment at `send-email/index.ts:174` "should be corrected in the same edit."

- **D-N1 — Sequencing against Phase 152: option (a).** 152 stays first and lands its scan in `yarn lint:check`; every comment 155 writes is authored under the enforced convention.

- **D-N2 — Follow-up items: option (a).** `.planning/todos/pending/`, filed **during the owning phase**, "with its file:line anchor, not left in a summary."

- **D-N3 — Document shape: option (a).** One `<padded>-CONTEXT.md` per phase; downstream agents read only that file plus the refs it names.

- **Operator decision O1 (2026-08-28)** — **the `aud`/`iss` fail-open is folded into this phase** as ROADMAP criterion 5 / REVIEW-EDGE-05. "**What must be true:** both checks fail **closed**. A token carrying a wrong `aud` **and** a wrong `iss` is exercised against an unset-env configuration and observed **rejected**. Treat this as the highest-severity item in the phase." The second Phase-142.1 todo (the duplicated/weaker verifier copy) is **not** folded in and stays filed.

### Claude's Discretion

- The exact mechanism of the D2a guard (ESLint rule vs. committed Node scan wired into `yarn lint:check` — § A4a precedent) and its failure message.
- How the base64url decode is implemented (hand-rolled pad-and-translate vs. a Deno-available helper).
- The wording of the D4 comment and of each throw message, subject to naming the missing variable.
- Where the D1 Signicat citation is recorded (phase record vs. a docstring addition to `claimConfig.ts`) — provided it is discoverable from the phase directory.

### Deferred Ideas (OUT OF SCOPE)

- **`PROJECT_ID` parameterisation** — Phase 161 owns it. 155 touches `:197` only to make it throw.
- **`config.toml` hard-coded ports** — Phase 156 criterion 8 owns those. 155's sweep **hands the finding to 156** rather than fixing it.
- **The fourth ID-token-verifier copy** (`.planning/todos/pending/2026-08-22-edge-function-fourth-idtoken-verifier-copy.md`) — stays filed. 155 makes *this* copy fail closed; it does not collapse the copies.
- Any change to the frontend provider path (`apps/frontend/src/lib/api/utils/auth/providers/`) — Phase 142.1 already hardened that side.

</user_constraints>

---

<phase_requirements>
## Phase Requirements

| ID | Description (verbatim source: `.planning/REQUIREMENTS.md:113-117`) | Research Support |
|----|-------------|------------------|
| REVIEW-EDGE-01 | "Both Edge Functions decode JWT segments as **base64url**, not base64 — `invite-candidate/index.ts:81` and `send-email/index.ts:111`… A token containing `-`/`_` or lacking padding is observed to fail on the current code and succeed after" | § Criterion 1 — both sites re-verified; the *failing* property isolated by measurement (`-`/`_` throws, **missing padding does not**); a runnable vitest harness proven to exist; a guarded negative-control recipe given |
| REVIEW-EDGE-02 | "every `??`/`||` env default throws naming the missing variable. Measured, that is **7 sites, not 3**… A repo-wide search for hard-coded ports and localhost URLs is performed and its results dispositioned." | § Criterion 2 — all 7 re-verified byte-exact; a guard regex written and **tested 7/7 positive, 4/4 negative**; ESLint measured *not to reach* this tree, settling the mechanism; sweep run and bucketed with a proposed disposition rule |
| REVIEW-EDGE-03 | "`send-email`'s template substitution accepts `{{ varname }}` with surrounding spaces, matched by test." | § Criterion 3 — exact current regex and its producer contract cited; extract-to-module harness identified; dotted-key trap measured on the SQL producer |
| REVIEW-EDGE-04 | "No identity is matched on a field that is not unique per person, and that claim rests on cited provider documentation rather than on assumption." | § Criterion 4 — **the external check is done in this document**, with verbatim quotes and URLs. Verdict: PAIRWISE-PER-ORGANISATION-BUT-STABLE, with two caveats the planner must read |
| REVIEW-EDGE-05 | "The `aud` and `iss` claim checks fail **closed**: a token carrying a wrong `aud` and a wrong `iss` is rejected even when the corresponding env var is unset." | § Criterion 5 — defect **reproduced this session** (ACCEPTED → REJECTED); the already-reviewed frontend shape located file:line for mirroring; `jose` proven reachable from vitest inside `apps/supabase` |

</phase_requirements>

---

## Summary

This phase has one hard problem and four straightforward ones. The hard problem is **the harness**, and the good news is that it is already solved in the tree and nobody has noticed. `apps/supabase/vitest.config.ts` declares `include: ['supabase/functions/**/*.test.ts']`, `apps/supabase/package.json` declares `"test:unit": "vitest run"`, and `turbo run test:unit` executes it — measured end to end this session: `yarn workspace @openvaa/supabase test:unit` runs `claimConfig.test.ts`, **20 tests, 20 passed**, and the turbo dry run lists `@openvaa/supabase | test:unit | vitest run` as a real command. **Any new `*.test.ts` placed beside any Edge Function is picked up with zero configuration change.** The `deno test` alternative is not merely worse, it is unrunnable here: `deno` is not installed (`command not found`) and there is no `deno.json`, `deno.jsonc` or `deno.lock` anywhere in the tree. So the harness decision is settled by evidence: **extract-to-module + vitest**, following the pattern `claimConfig.ts` already establishes and documents in its own docstring ("This module has NO Deno imports… so it can be imported by both the Edge Function and vitest").

All three "exercised" criteria were **reproduced end to end this session** using only what is already installed. The `aud`/`iss` fail-open: a token minted with `iss=https://evil-idp.example`, `aud=some-other-clients-id` is **ACCEPTED** by `jose.jwtVerify(jwt, key, {})` — the exact options object the current code builds when both env vars are unset — and **REJECTED** with `ERR_JWT_CLAIM_VALIDATION_FAILED / unexpected "iss" claim value` once the options are supplied. `jose@6.2.1` resolves from inside `apps/supabase` via the hoisted root `node_modules`, so this proof runs as an ordinary vitest test. The base64url defect: a segment containing `-`/`_` makes `atob` throw `InvalidCharacterError: Invalid character`, and a pad-and-translate decode parses it correctly. **But one measured detail contradicts the criterion's own wording**: missing padding *alone* does **not** break `atob` — WHATWG forgiving-base64 accepts `len % 4 ∈ {0, 2, 3}` and rejects only `len % 4 == 1`. The negative control must therefore be built on the `-`/`_` alphabet, not on padding, and the test needs a self-guard asserting the constructed segment really contains one of those characters — otherwise it silently degrades into a no-op, because a realistic Supabase access-token payload almost never contains them (measured: **0 of 2000** synthetic-but-realistic payloads, 0 of 200 in an ASCII length-offset sweep, 0 of 5 Nordic-name payloads).

The largest planning risk is **`.env.example`**, CONTEXT `<open>` item 3, which was unreadable in the previous session and is answered here via `git show HEAD:.env.example`: **six of the seven D2a variables are undocumented**, and the seventh two are present only under a `PUBLIC_` prefix the Edge Functions do not read. Making them throw with no documentation would be a trap — except that the blast radius turns out to be far smaller than feared, because `send-email` and `invite-candidate` have **no live caller anywhere in the product or the test suite**. That combination (undocumented variables + dead call paths) is itself the most useful thing this research produces, and it should shape how loudly the phase advertises what it changed.

**Primary recommendation:** extract three URL-import-free sibling modules — `jwtSegment.ts` (base64url decode), `templateVars.ts` (placeholder substitution), `verifyConfig.ts` (fail-closed audience/issuer resolution) — test each with vitest under the config that already exists, add `scripts/assert-edge-env-defaults.mjs` as the D2a guard wired into `lint:check` beside the three existing `assert:*` guards, and add the six missing variables to `.env.example` **in the same commit as the first throw**.

---

## Architectural Responsibility Map

| Capability | Primary Tier | Secondary Tier | Rationale |
|------------|-------------|----------------|-----------|
| JWT segment decode (`atob` → base64url) | **API / Backend** (Deno Edge Function) | — | The decode feeds an admin-authorisation predicate (`invite-candidate:84-90`, `send-email:114-116`); a decode failure is an authorisation failure. It must not be delegated to the client. |
| JWT signature + `aud`/`iss` verification | **API / Backend** (Deno Edge Function) | — | `identity-callback` is served `--no-verify-jwt` and is publicly reachable; it is the trust boundary. The frontend has its own peer copy (Phase 142.1) — that is a *peer*, not a substitute. |
| Environment-configuration validation | **API / Backend** (function module init / call path) | **Build/CI** (the D2a static guard) | Runtime throw names the missing variable; the static guard closes the *class* so the next function cannot reopen it. Two tiers on purpose — D-D2 rejected option (c), "all 7 without a guard". |
| Email template rendering (`{{ var }}`) | **API / Backend** (`send-email`) | **Database** (`resolve_email_variables` produces the flat dotted keys) | The variable *contract* lives in `apps/supabase/supabase/schema/502-email-helpers.sql`; the *renderer* lives in the Edge Function. D-D4 turns on respecting that split. |
| Identity-claim → account key mapping | **API / Backend** (`claimConfig.ts`) | **External IdP** (Signicat/Idura) | The stability property is owned by the provider, not by us — which is exactly why criterion 4 is a documentation check against provider docs, not a code change. |
| Test execution of all of the above | **Build/CI** (vitest via turbo) | — | `apps/supabase` is a workspace with a real `test:unit` executed by `turbo run test:unit` (measured). No new tier needed. |

---

## Standard Stack

### Core

| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| `vitest` | `catalog:` → **3.2.4** (measured in the run banner: `RUN v3.2.4`) | Runs `apps/supabase/supabase/functions/**/*.test.ts` | Already declared in `apps/supabase/package.json` `devDependencies` and already executing 20 tests. Zero new dependency. `[VERIFIED: apps/supabase/package.json + measured run]` |
| `jose` | **6.2.1** at `/node_modules/jose` (hoisted) | Mints and verifies test tokens for the criterion-5 proof | `yarn why jose` → required by `@openvaa/dev-tools` and `@openvaa/frontend`; resolves from `apps/supabase` by ordinary upward node-module lookup, proven this session. `[VERIFIED: yarn why jose + a dynamic import executed from apps/supabase]` |
| Node built-ins (`node:fs`, `node:path`, `node:url`, `node:child_process`) | Node 20+ | The D2a guard script | The three existing `scripts/assert-*.mjs` guards use nothing else, on purpose (bootstrapping: "a guard that must run before anything is built cannot itself require a build" — `scripts/assert-unit-test-coverage.mjs:41-43`). `[VERIFIED: scripts/assert-unit-test-coverage.mjs]` |

### Supporting

| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| `jose` (Deno) | `https://deno.land/x/jose@v5.9.6/index.ts` | The **runtime** verifier inside `identity-callback` | Unchanged by this phase. Note the **major-version skew** against the vitest-side `jose@6.2.1` — see Pitfall 4. `[VERIFIED: apps/supabase/supabase/functions/identity-callback/index.ts:34]` |
| `nodemailer` | `npm:nodemailer@6.9.10` | `send-email` SMTP transport | Unchanged. Named only because the three SMTP env sites (`:210,:211,:234`) configure it. `[VERIFIED: apps/supabase/supabase/functions/send-email/index.ts:2]` |

### Alternatives Considered

| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| vitest over extracted modules | `deno test` task | **Not runnable here.** `deno --version` → `command not found`; `find` for `deno.json`/`deno.jsonc`/`deno.lock` → **zero hits**; no `deno test` in any `package.json` script, `turbo.json` task or `.github/workflows/*`. Wiring it means installing a runtime, authoring a lock/vendor story for `deno.land`/`esm.sh` URL imports, adding a turbo task, and adding a CI step — and the payoff is fidelity this phase can get more cheaply. `[VERIFIED: measured this session]` |
| A committed Node scan for D2a | A custom ESLint rule | **ESLint does not reach this tree.** `turbo run lint --dry` reports `@openvaa/supabase \| <NONEXISTENT>` — the workspace has no `lint` script and no `eslint.config.*`. An ESLint mechanism therefore requires first standing up an entire lint surface for a Deno codebase with URL imports and `.ts` import specifiers. `[VERIFIED: turbo run lint --dry=json, this session]` |
| Extract-to-module | Test `index.ts` directly with vitest + import mocking | `index.ts` imports `https://esm.sh/@supabase/supabase-js@2` and `https://deno.land/x/jose@v5.9.6/index.ts` at top level; vitest cannot resolve those. This is the constraint `claimConfig.ts` was created to work around, and its own docstring says so. `[VERIFIED: identity-callback/index.ts:33-34; claimConfig.ts:1-8]` |

**Installation:**

```bash
# Nothing to install. Every tool this phase needs is already present.
# If jose is to be imported by a test under apps/supabase, prefer declaring it
# explicitly rather than relying on the hoist (see Pitfall 5):
#   yarn workspace @openvaa/supabase add -D jose
```

**Version verification (run this session):**

```
$ yarn workspace @openvaa/supabase test:unit
 RUN  v3.2.4 …/apps/supabase
 ✓ supabase/functions/identity-callback/claimConfig.test.ts (20 tests) 3ms
 Test Files  1 passed (1)      Tests  20 passed (20)

$ yarn why jose
├─ @openvaa/dev-tools@workspace:packages/dev-tools └─ jose@npm:6.2.1 (via npm:^6.2.1)
└─ @openvaa/frontend@workspace:apps/frontend       └─ jose@npm:6.2.1 (via npm:^6.2.1)

$ deno --version
zsh: command not found: deno
```

## Package Legitimacy Audit

**This phase installs no external packages.** Every dependency it uses is already in the lockfile and already exercised by the running suite.

| Package | Registry | Age | Downloads | Source Repo | Verdict | Disposition |
|---------|----------|-----|-----------|-------------|---------|-------------|
| `vitest` | npm | mature | — | github.com/vitest-dev/vitest | OK (pre-existing) | No install — already in `apps/supabase/package.json` |
| `jose` | npm | mature | — | github.com/panva/jose | OK (pre-existing) | No install required; optional explicit devDependency declaration only (see Pitfall 5) |

**Packages removed due to [SLOP] verdict:** none.
**Packages flagged as suspicious [SUS]:** none.

---

## Criterion-by-criterion research

### Criterion 1 (REVIEW-EDGE-01) — base64url decode

#### The two sites, re-verified byte-exact

`grep -rn atob apps/supabase/supabase/functions/` returns **exactly two hits**, confirming CONTEXT Fact 12:

```
apps/supabase/supabase/functions/invite-candidate/index.ts:81:    const payload = JSON.parse(atob(token.split('.')[1]));
apps/supabase/supabase/functions/send-email/index.ts:111:    const payload = JSON.parse(atob(token.split('.')[1]));
```

`[VERIFIED: apps/supabase/supabase/functions/invite-candidate/index.ts:81; apps/supabase/supabase/functions/send-email/index.ts:111]`

Surrounding context confirms both feed an authorisation predicate. `invite-candidate:80-90`:

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

`send-email:110-116` is the same shape with a two-role `isAdmin`. `[VERIFIED: read this session]`

> **A correction the planner must carry.** `payload.user_roles || []` at `invite-candidate:82` and `send-email:112` is a `||` default — but it is **not** a `Deno.env.get` default and is **not** one of criterion 2's seven sites. Do not "fix" it: it is a legitimate absent-claim default, and the D2a guard predicate (below) correctly does not match it.

#### ⚠ Measured: it is the alphabet that breaks, NOT the padding

The criterion (and the roadmap) say "a token containing `-`/`_` **or lacking padding**". Measured against WHATWG `atob` (the same forgiving-base64 algorithm Deno implements):

| Input property | Result |
|---|---|
| segment length `% 4 == 0` | **ACCEPTED** |
| segment length `% 4 == 2` (unpadded) | **ACCEPTED** |
| segment length `% 4 == 3` (unpadded) | **ACCEPTED** |
| segment length `% 4 == 1` | THREW `InvalidCharacterError` |
| segment containing `-` or `_` | **THREW `InvalidCharacterError: Invalid character`** |

`[VERIFIED: reproduced this session — four length classes and a dash/underscore case each run through atob()]`

**Consequence for planning:** the negative control MUST be constructed on the `-`/`_` alphabet. A "we stripped the padding" token is not a demonstration — it passes today. A base64url segment of a real JWT is essentially never length `% 4 == 1` either (base64url of *n* bytes has length `⌈4n/3⌉`, which is never ≡ 1 mod 4), so the padding branch is unreachable in practice.

Reproduction, verbatim from this session:

```
segment: eyJ1c2VyX3JvbGVzIjpbey…LCJub3RlIjoiw7_Dv35-Pz4ifQ   (contains _ , unpadded)
CURRENT atob(): THREW DOMException Invalid character
FIXED base64url: parsed -> {"user_roles":[{"role":"super_admin","scope_type":"project", …
```

#### ⚠ Measured: the defect is LATENT, not a live outage

A realistic Supabase access-token payload almost never contains `-`/`_` in its base64url form, because ASCII-only JSON rarely produces the 6-bit groups `111110`/`111111`:

| Corpus | Segments containing `-` or `_` |
|---|---|
| 2000 synthetic-but-realistic Supabase access-token payloads (uuid `sub`/`session_id`, email, `app_metadata`, `user_metadata`, `amr`, `user_roles`) — avg segment length 853 | **0 / 2000 (0.00 %)** |
| 200-step ASCII length-offset sweep over the same shape | **0 / 200** |
| Nordic / non-ASCII names (`Väinö Tunnistus`, `Åsa Öhman`, `Jyrki Kääriäinen`, `Émile Zöllner`, `Ñuño`) | **0 / 5** |
| Deliberately constructed (`{"v":"~~~"}` → `eyJ2Ijoifn5-In0`) | **1 / 1 — BREAKS** |

`[VERIFIED: reproduced this session]`

**Frame it honestly.** This is a *correctness* defect with a real bypass shape (a decode throw inside the outer `try` becomes an opaque 500 on an admin-authorisation path), not an ongoing production failure. Claiming "every real token breaks" would be false and would be caught. Claiming "it can never happen" would also be false — it is one claim value away.

**Test-design consequence (important):** the negative-control test must *assert its own premise*, or it silently becomes a no-op the day someone tidies the fixture:

```ts
const seg = Buffer.from(JSON.stringify(payload)).toString('base64url');
// GUARD — without this the negative control degrades into a tautology, because most
// realistic payloads produce a segment that plain atob() decodes without complaint.
expect(/[-_]/.test(seg), 'fixture must actually exercise the base64url alphabet').toBe(true);
```

A payload whose values include a `~~~`-style run reliably produces one; measured: `{"user_roles":[…],"marker":"~~~"}` → `…LCJtYXJrZXIiOiJ-fn4ifQ`, guard `true`. `[VERIFIED: reproduced this session]`

#### ⚠ A second, adjacent defect in the same line: `atob` returns latin1

`atob` yields a binary string, one code unit per byte. Any non-ASCII claim value is mojibake after `JSON.parse`:

```
latin1 atob JSON:        ÃÃ¤kkÃ¶nen
TextDecoder utf-8 JSON:  Ääkkönen
```

`[VERIFIED: reproduced this session]`

Not one of the five criteria — but the fix for criterion 1 rewrites this exact expression, and writing a decode helper that leaves the UTF-8 bug in place would be a knowing omission. Recommended shape (Deno-available, no import):

```ts
/** Decode one base64url JWT segment to a UTF-8 string. */
export function decodeJwtSegment(segment: string): string {
  const base64 = segment.replace(/-/g, '+').replace(/_/g, '/');
  const padded = base64 + '='.repeat((4 - (base64.length % 4)) % 4);
  const binary = atob(padded);
  const bytes = Uint8Array.from(binary, (c) => c.charCodeAt(0));
  return new TextDecoder().decode(bytes);
}
```

`[VERIFIED: this exact function body was executed this session and round-tripped both the `-`/`_` case and `Ääkkönen`]`

If the planner prefers to keep the UTF-8 half out of scope, say so explicitly in the plan rather than leaving it implicit — but note it costs two lines.

---

### Criterion 2 (REVIEW-EDGE-02) — env defaults

#### All seven sites, re-verified byte-exact

`grep -rnE "Deno\.env\.get\([^)]*\)[[:space:]]*(\?\?|\|\|)" apps/supabase/supabase/functions/` returns **exactly seven** hits — confirming CONTEXT Fact 13 with no drift:

| # | Site | Verbatim current line | Missing-variable name for the throw |
|---|---|---|---|
| 1 | `identity-callback/index.ts:169` | `const providerType = Deno.env.get('IDENTITY_PROVIDER_TYPE') ?? 'signicat';` | `IDENTITY_PROVIDER_TYPE` |
| 2 | `identity-callback/index.ts:197` | `const projectId = project_id \|\| Deno.env.get('DEFAULT_PROJECT_ID') \|\| DEFAULT_SEED_PROJECT_ID;` | `DEFAULT_PROJECT_ID` (**D-D3 boundary — do not rename**) |
| 3 | `identity-callback/index.ts:361` | `` redirectTo: `${Deno.env.get('SITE_URL') \|\| 'http://127.0.0.1:5173'}/candidate` `` | `SITE_URL` |
| 4 | `invite-candidate/index.ts:131` | `const siteUrl = Deno.env.get('SITE_URL') \|\| Deno.env.get('SUPABASE_URL');` | `SITE_URL` (the wrong-host default) |
| 5 | `send-email/index.ts:210` | `const smtpHost = Deno.env.get('SMTP_HOST') \|\| 'inbucket';` | `SMTP_HOST` |
| 6 | `send-email/index.ts:211` | `const smtpPort = parseInt(Deno.env.get('SMTP_PORT') \|\| '2500');` | `SMTP_PORT` |
| 7 | `send-email/index.ts:234` | `const senderAddress = from \|\| Deno.env.get('SMTP_FROM') \|\| 'noreply@openvaa.org';` | `SMTP_FROM` |

`[VERIFIED: grep output reproduced verbatim this session]`

**Site 2's ordering, spelled out** so 155 and 161 do not both-change or both-skip it: `project_id` (the request-body value) stays as the first operand; the second and third operands collapse into a throw naming `DEFAULT_PROJECT_ID`. `identity-callback/index.ts:31` — `const DEFAULT_SEED_PROJECT_ID = '00000000-0000-0000-0000-000000000001';` — is **161's**, verified still present and unmodified. `[VERIFIED: apps/supabase/supabase/functions/identity-callback/index.ts:31]`

**Site 7's ordering** likewise: `from` is a request-body field (`SendEmailRequest.from?: string`, `send-email/index.ts:13`) and must remain the first operand; only the second `||` collapses. `[VERIFIED: send-email/index.ts:9-14]`

#### The adjacent class the criterion does NOT cover (file per D-N2)

Eight further lines carry **thirteen** `Deno.env.get(...)!` non-null assertions. These fail with an unnamed `TypeError` or a `SyntaxError` rather than a named throw — same *consequence* class, different *operator*, so D2a's guard will not see them and criterion 2's wording ("every `??`/`||` env default") does not reach them:

```
invite-candidate/index.ts:63    SUPABASE_URL! , SUPABASE_ANON_KEY!
invite-candidate/index.ts:101   SUPABASE_URL! , SUPABASE_SERVICE_ROLE_KEY!
send-email/index.ts:93          SUPABASE_URL! , SUPABASE_ANON_KEY!
send-email/index.ts:128         SUPABASE_URL! , SUPABASE_SERVICE_ROLE_KEY!
identity-callback/index.ts:53   IDENTITY_PROVIDER_DECRYPTION_JWKS!   (feeds JSON.parse -> bare SyntaxError)
identity-callback/index.ts:71   IDENTITY_PROVIDER_JWKS_URI!          (feeds new URL()   -> bare TypeError)
identity-callback/index.ts:262  SUPABASE_URL! , SUPABASE_SERVICE_ROLE_KEY!
identity-callback/index.ts:355  SUPABASE_URL!
```

`[VERIFIED: grep -rnE "Deno\.env\.get\([^)]*\)!" over the functions tree, this session]`

Recommendation: **file, do not fix** (D-N2). The `SUPABASE_*` triple is auto-injected by the platform — the function's own docstring says so at `identity-callback/index.ts:22-23` (`"SUPABASE_URL: Supabase project URL (auto-set by Supabase)"`), so they are a genuinely different risk profile. `IDENTITY_PROVIDER_DECRYPTION_JWKS!` and `IDENTITY_PROVIDER_JWKS_URI!` are **not** auto-injected and are the two worth naming in the todo. `[CITED: apps/supabase/supabase/functions/identity-callback/index.ts:16-24]`

#### The D2a guard: mechanism settled by measurement

**ESLint is not an option without first building a lint surface for this workspace.** `turbo run lint --dry=json` output, filtered:

```
@openvaa/supabase       | <NONEXISTENT>
@openvaa/supabase-types | <NONEXISTENT>
```

`apps/supabase/package.json` has scripts `start stop reset diff status lint:sql lint:schema lint:all test:unit` — **no `lint`, no `typecheck`** — and there is no `eslint.config.*` under `apps/supabase`. `turbo run typecheck --dry` likewise reports `@openvaa/supabase | <NONEXISTENT>`. `[VERIFIED: turbo dry runs + apps/supabase/package.json, this session]`

So today the **only** automated gate touching the Edge Functions is Prettier (`format:check` runs `prettier --check .`, and `.prettierignore` has no entry for `apps/supabase`). No ESLint, no type-check, and — until this phase — no tests for two of the three functions. `[VERIFIED: .prettierignore read this session]`

**Therefore: committed Node scan in `lint:check`.** This is also the § A4a precedent CONTEXT points at, and it exists in triplicate.

**The precedent, exactly:**

Root `package.json` `lint:check` (verbatim):

```
turbo run lint && eslint --flag v10_config_lookup_from_file tests && yarn typecheck:tests && yarn typecheck && yarn assert:i18n-catalog-namespaces && yarn assert:a11y-scan-wiring
```

with the scripts:

```
"assert:unit-coverage":            "node scripts/assert-unit-test-coverage.mjs",
"assert:i18n-catalog-namespaces":  "node scripts/assert-i18n-catalog-namespaces.mjs",
"assert:a11y-scan-wiring":         "node scripts/assert-a11y-scan-wiring.mjs",
```

`[VERIFIED: package.json, read this session]`

> Note the split: `assert:unit-coverage` is chained into **`test:unit`** (`"test:unit": "yarn assert:unit-coverage && turbo run test:unit"`), the other two into **`lint:check`**. The new guard belongs in `lint:check`, alongside the two that gate source shape.

**The house shape** (`scripts/assert-a11y-scan-wiring.mjs`, measured):

- `const SELF = 'scripts/assert-….mjs';` so messages name where to go.
- `const REPO_ROOT = path.resolve(fileURLToPath(import.meta.url), '..', '..');` — root from the file's own location, never from CWD.
- `readSource()` that **fails closed** on an unreadable file: *"A file this guard cannot read is wiring it cannot verify — this fails closed."*
- `let violations = 0; const violate = (message) => { violations++; console.error(\`[ERROR] ${SELF}: ${message}\`); };`
- Terminal: `` console.log(`… guard (…) — ${violations} violation(s).`) `` then `process.exitCode = violations > 0 ? 1 : 0;`
- **Deliberately regex, not AST** — `:44-49`: *"It is deliberately NOT an AST parse: these are single-sourced, hand-authored config/source files with one occurrence of each pattern, and a regex read is the cheapest thing that can name the violation precisely."*
- Comment stripping when a pattern must not match inside prose: `const codeOnly = src.replace(/\/\*[\s\S]*?\*\//g, '').replace(/^\s*\/\/.*$/gm, '');` (`:171`)
- Node built-ins only, no build step, `.mjs` outside TypeScript on purpose (`assert-unit-test-coverage.mjs:37-43`).

`[VERIFIED: scripts/assert-a11y-scan-wiring.mjs:60-140,171-180 and its tail; scripts/assert-unit-test-coverage.mjs:1-60]`

**Chain-membership assertion precedent** (so the guard cannot be quietly unwired): `packages/dev-seed/tests/ciTypecheckGate.test.ts:83-86` reads the root manifest and asserts on the **links** of `lint:check`, not on their order:

```ts
const links = ROOT_PACKAGE_JSON.scripts['lint:check'].split('&&').map((link) => link.trim());
…
expect(ROOT_PACKAGE_JSON.scripts['lint:check']).toContain('yarn typecheck:tests');
expect(ROOT_PACKAGE_JSON.scripts.typecheck).toBe('turbo run typecheck');
```

That is Phase 144's "assert chain MEMBERSHIP, not position" fix (commit `b410d3a90`). The new guard should get the same treatment. `[VERIFIED: packages/dev-seed/tests/ciTypecheckGate.test.ts:72-86]`

#### ⚠ The guard predicate, written and TESTED

Proposed predicate:

```js
/Deno\.env\.get\(\s*['"`][^'"`]+['"`]\s*\)\s*(\?\?|\|\|)/
```

Run against every `.ts` file under `apps/supabase/supabase/functions/` this session:

```
identity-callback/index.ts:169  const providerType = Deno.env.get('IDENTITY_PROVIDER_TYPE') ?? 'signicat';
identity-callback/index.ts:197  const projectId = project_id || Deno.env.get('DEFAULT_PROJECT_ID') || DEFAULT_SEED_PROJECT_ID;
identity-callback/index.ts:361  redirectTo: `${Deno.env.get('SITE_URL') || 'http://127.0.0.1:5173'}/candidate`
invite-candidate/index.ts:131   const siteUrl = Deno.env.get('SITE_URL') || Deno.env.get('SUPABASE_URL');
send-email/index.ts:210         const smtpHost = Deno.env.get('SMTP_HOST') || 'inbucket';
send-email/index.ts:211         const smtpPort = parseInt(Deno.env.get('SMTP_PORT') || '2500');
send-email/index.ts:234         const senderAddress = from || Deno.env.get('SMTP_FROM') || 'noreply@openvaa.org';
TOTAL matched: 7
```

Negative controls, all correctly **not** matched:

```
NEG false | const a = Deno.env.get('X')!;
NEG false | const b = Deno.env.get('Y');
NEG false | if (Deno.env.get('Z')) {}
NEG false | const c = other || fallback;
```

And the D-D2 trap case, correctly **matched**:

```
POS(:197 shape) true   // "const projectId = project_id || Deno.env.get('DEFAULT_PROJECT_ID') || …"
```

`[VERIFIED: executed this session — 7/7 positive, 4/4 negative, plus the :197 shape]`

**Two implementation notes the planner should carry into the guard:**

1. **Scan the whole file, not line by line.** Prettier's 120-column width keeps all seven on one line today, but a longer variable name would wrap `Deno.env.get('X')\n  ?? 'y'` and a line-scoped scan would miss it. Match against the full source with the `s`-insensitive pattern above plus `\s*` already spanning newlines, then derive the line number from the match index.
2. **Strip comments first**, using the same `codeOnly` expression the a11y guard uses — otherwise a docstring quoting the forbidden pattern (this phase will write several) trips the guard against itself.

**Failure-message shape** (matching the house voice — the guard must say *why*, not just *what*):

> `[ERROR] scripts/assert-edge-env-defaults.mjs: apps/supabase/supabase/functions/send-email/index.ts:210 supplies a default for a missing environment variable ('??' or '||' immediately after Deno.env.get). A missing variable must fail loudly naming the variable, not silently substitute a value — REVIEW-EDGE-02. Replace the default with a throw that names the variable.`

#### The repo-wide port / localhost sweep — run, with a proposed disposition rule

Raw sweep over `apps packages tests scripts` plus root configs for `localhost|127.0.0.1|0.0.0.0` and the known port literals returns **784 lines**, which is not a dispositionable artefact. Bucketed:

**Bucket A — production source (`apps/*/src`, `apps/supabase/supabase`, `packages/*/src`), non-test: 8 hits.** This is the whole of the actionable set.

| File:line | Content | Disposition |
|---|---|---|
| `apps/supabase/supabase/functions/identity-callback/index.ts:361` | `` `${Deno.env.get('SITE_URL') \|\| 'http://127.0.0.1:5173'}/candidate` `` | **(a) fix in this phase** — it is criterion-2 site #3 |
| `packages/dev-seed/src/supabaseAdminClient.ts:42` | `const SUPABASE_URL = process.env.SUPABASE_URL ?? 'http://localhost:54321';` | **(c) file per D-N2** — same defect class, different package. Note it says `localhost` while its siblings say `127.0.0.1` |
| `packages/dev-seed/src/cli/seed.ts:216` | `const url = process.env.SUPABASE_URL ?? 'http://127.0.0.1:54321';` | **(c) file per D-N2** |
| `packages/dev-seed/src/cli/teardown.ts:224` | `${process.env.SUPABASE_URL ?? 'http://127.0.0.1:54321'}` (inside an error message) | **(d) no action** — it is a diagnostic string, and printing the effective URL is the point |
| `packages/dev-seed/src/writer.ts:98` | `'Expected format: http://127.0.0.1:54321'` | **(d) no action** — help text |
| `packages/dev-seed/src/cli/help.ts:39` | `SUPABASE_URL … (e.g. http://127.0.0.1:54321)` | **(d) no action** — help text |
| `packages/dev-seed/src/cli/teardown-help.ts:27` | same | **(d) no action** — help text |
| `apps/frontend/src/lib/i18n/tests/__mocks__/app-state.ts:11` | `url: new URL('http://localhost/')` | **(d) no action** — test mock |

**Bucket B — `apps/supabase/supabase/config.toml`: 15 hits** (`port = 54321/54322/54320/54329/54323/54324/54327`, `smtp_port = 54325`, `inspector_port = 8083`, `api_url = "http://127.0.0.1"`, `site_url = "http://127.0.0.1:5173"`, `additional_redirect_urls = [...]`). **Disposition (b): hand to Phase 156 criterion 8** — CONTEXT `<open>` item 5 names this collision explicitly and `REQUIREMENTS.md` REVIEW-DB-08 owns it ("the `config.toml` hard-coded ports resolved from env or documented as a caveat").

**Bucket C — deployment (`docker-compose.dev.yml:12,14,16,17`): 4 hits**, all already `${VAR:-default}` shell-parameter defaults with documented fallbacks. **Disposition (d): no action** — this is the idiomatic compose form and is not silent (the default is visible in the file).

**Bucket D — `tests/` (38 hits) and `tests/playwright.config.ts`**: test infrastructure, and already parameterised where it matters (`playwright.config.ts:379` — `process.env.FRONTEND_PORT ? \`http://localhost:${…}\` : 'http://localhost:5173'`, which is the documented `FRONTEND_PORT` escape hatch in `CLAUDE.md`). **Disposition (d): no action.**

**Proposed disposition rule** (CONTEXT `<open>` item 5 says none exists; this is the concrete one the counts support):

> A hard-coded host or port is **fixed in this phase** only if it is one of criterion 2's seven Edge-Function sites. Otherwise: if it is a **silent default that changes where bytes go** (bucket A rows 2–3), it is **filed** as a pending todo with its file:line anchor per D-N2. If it lives in **`config.toml`**, it is **handed to Phase 156 criterion 8** by naming it in the todo/summary rather than editing it. If it is **help text, an error message, a test fixture, or an already-visible shell default**, it is **recorded as no-action** in the sweep table — the sweep is not complete until each hit has one of those four labels.

`[VERIFIED: every bucket count and every quoted line reproduced by grep this session]`

---

### Criterion 3 (REVIEW-EDGE-03) — `{{ varname }}` with spaces

Current code, verbatim (`send-email/index.ts:174-176`):

```ts
      // Replace {{variable.path}} placeholders with resolved values
      const replaceVars = (text: string): string =>
        text.replace(/\{\{(\w+(?:\.\w+)*)\}\}/g, (_match, key) => vars[key] ?? _match);
```

`[VERIFIED: apps/supabase/supabase/functions/send-email/index.ts:174-176]`

The producer contract that D-D4 turns on, verbatim (`apps/supabase/supabase/schema/502-email-helpers.sql:92-96`):

```sql
      IF c_first_name IS NOT NULL THEN
        vars := vars || jsonb_build_object(
          'candidate.first_name', c_first_name,
          'candidate.last_name', c_last_name
        );
      END IF;
```

`[VERIFIED: apps/supabase/supabase/schema/502-email-helpers.sql:92-96]` — the keys **literally contain dots**. The flat `vars[key]` lookup is the live contract, exactly as CONTEXT records; D-D4 option (b) would have broken every existing placeholder.

**Minimal change satisfying the criterion:** allow optional surrounding whitespace inside the braces while keeping the captured key identical:

```ts
/\{\{\s*(\w+(?:\.\w+)*)\s*\}\}/g
```

Test matrix the criterion implies: `{{x}}`, `{{ x }}`, `{{  x  }}`, `{{\tx\t}}`, `{{candidate.first_name}}`, `{{ candidate.first_name }}`, an unknown key (must pass `_match` through unchanged — the current `?? _match` behaviour), and `{{ }}` / `{{}}` (must NOT match, because `\w+` requires at least one character).

**Harness:** extract to `apps/supabase/supabase/functions/send-email/templateVars.ts` exporting `renderTemplate(text: string, vars: Record<string, string>): string`, imported by `index.ts` as `'./templateVars.ts'` (Deno style) and by the test as `'./templateVars'` (no extension) — the exact asymmetry `claimConfig.ts` / `claimConfig.test.ts` already runs on. `[VERIFIED: claimConfig.test.ts:12 imports `from './claimConfig'` while index.ts:35 imports `from './claimConfig.ts'`, and both resolve — proven by the 20 passing tests]`

**Note for the D-D4 comment placement:** `send-email/index.ts:174`'s comment moves with the function. Correcting it in place *and* moving it is one edit, not two.

**Bonus fact for the planner:** the substitution runs **before** the `dry_run` early return (`send-email/index.ts:188-206`), which is why a `dry_run: true` integration probe *could* exercise rendering without SMTP. It is not needed — the unit test is cheaper and runnable — but it is the cross-check if one is ever wanted.

---

### Criterion 4 (REVIEW-EDGE-04) — Signicat `sub` stability. **THE EXTERNAL CHECK IS DONE. READ THIS SECTION.**

#### Code state re-verified: nothing to change

`apps/supabase/supabase/functions/identity-callback/claimConfig.ts:42-55`, verbatim:

```ts
export const PROVIDER_CONFIGS: Record<string, ProviderClaimConfig> = {
  signicat: {
    identityMatchProp: 'sub',
    firstNameProp: 'given_name',
    lastNameProp: 'family_name',
    extractClaims: ['birthdate']
  },
  idura: {
    identityMatchProp: 'sub',
    firstNameProp: 'given_name',
    lastNameProp: 'family_name',
    extractClaims: ['birthdate', 'hetu']
  }
};
```

`[VERIFIED: apps/supabase/supabase/functions/identity-callback/claimConfig.ts:42-55]`

The docstring above it (`:34-41`) records the reason: *"Signicat was keyed on `birthdate` until Phase 142.1, which made that a certainty for any realistic candidate population rather than a corner case. Never key on a claim that is not an identifier."* And it is test-locked at `claimConfig.test.ts:16-20`. `[VERIFIED: both files read this session]` **CONTEXT Fact 14 is confirmed; no code change is expected.**

#### VERDICT: **PAIRWISE-PER-ORGANISATION-BUT-STABLE** — with two caveats

Signicat's own concept page for Subject says, verbatim:

> **Persistent**: An eID always supplies the exact same value to identify a specific end-user across sessions.
> **Transient**: The subject varies across authentication sessions. **For example, Finnish Trust Network (FTN) provides a different subject identifier for each new session.**

`[CITED: https://developer.signicat.com/docs/eid-hub/concepts/subject — retrieved 2026-08-28]`

That sentence, read alone, would **fail** criterion 4. It does not, because of the next paragraph on the same page:

> We apply the following logic to generate the `idpId` attribute that we send you:
> - If an eID returns a **Persistent** subject identifier to Signicat, we use this value as the `idpId` to generate the hashed subject.
> - **If an eID returns a Transient subject or does not return any subject identifier to Signicat, we try to generate a persistent hashed subject from another attribute. The criteria to choose an attribute is that it must be unique and consistent to identify a specific end-user. For example, we may select the National Identity Number (`nin`) as the `idpId`.**

`[CITED: https://developer.signicat.com/docs/eid-hub/concepts/subject]`

and the hashing definition:

> `Hashed_Subject = Replace(Base64(Sha256(output_of_proprietary_algorithm)))`
> - `idp`: Signicat-specific code to indicate the eID used for authentication…
> - `idpId`: Raw subject, as provided by the eID (identity provider)…
> - **`organizationId`: Uniquer [sic] identifier of your organisation, as registered in the Signicat Dashboard.**

`[CITED: https://developer.signicat.com/docs/eid-hub/concepts/subject]`

The FTN pages close the loop by showing what `idpId` actually is for FTN. The FTN ID-token example carries `"sub": "2uwfL96EEeJCQSqGbrWwTr5S3sCK9SibSlv2-EAf7A8="` alongside `"idp": "ftn"`, `"idp_id": "070770-905D"` and `"ftn_hetu": "070770-905D"` — i.e. **the substituted persistent attribute for FTN is the HETU.** `[CITED: https://developer.signicat.com/identity-methods/ftn/integration-guide/oidc-ftn — ID-token decoded-payload example]` The SAML/REST example on the attributes page shows the same shape: `"subject": { "id": "tPrysd7qtFvlSEBh7sYG0R8LXYYIgnZ5RmlR-Vl9IEs=", "idpId": "070770-905D", … }`. `[CITED: https://developer.signicat.com/identity-methods/ftn/attributes-reference]`

**So `sub` is stable per person for a given Signicat organisation.** That satisfies criterion 4's requirement, and D-D1's escalation branch does **not** fire.

**Caveat 1 — the stability is manufactured, not intrinsic, and its input is the HETU.** The raw FTN subject is transient; Signicat substitutes `nin`/HETU and hashes it. Two operational consequences worth one sentence each in the phase record: (i) if Signicat ever changes the substituted attribute for FTN, every stored `identity_match_value` is invalidated; (ii) `organizationId` is an input to the hash, so **migrating to a different Signicat organisation changes every `sub`** — a re-key event, not a config change. Neither is a code defect and neither blocks the phase.

**Caveat 2 — `ftn_sub` is a different claim and must never be used.** Signicat's own note, verbatim:

> `ftn_sub` … A unique identifier returned by the bank. **Note**: **Do not use this attribute as a permanent identifier for the end-user, as it may be transient and is not guaranteed to be globally unique.**

`[CITED: https://developer.signicat.com/identity-methods/ftn/attributes-reference]`

Our code uses OIDC `sub`, **not** `ftn_sub` — verified above. This distinction is the single most valuable thing to write into the `claimConfig.ts` docstring, because a future reader "improving" the match to the more-specific-looking `ftn_sub` would reintroduce the collision class Phase 142.1 removed.

**A third, product-specific note the planner should verify with the operator rather than assume:** the FTN attributes page warns that `nin` is only returned when *"ID Token User data"* is set to **All** in **Dashboard > OIDC clients > Advanced > Security** — and that the **Minimal** setting *"Returns only `sub`"*. `[CITED: https://developer.signicat.com/identity-methods/ftn/integration-guide/oidc-ftn]` This affects `birthdate`/`hetu` extraction (`extractClaims`), not `sub` itself, so it does not threaten criterion 4 — but if the OpenVAA client is on **Minimal**, `extractClaims: ['birthdate']` silently yields nothing. Worth a line in the record; not worth a code change in this phase.

**Product-line caveat (honest limitation of this check).** The pages quoted above are Signicat's **eID Hub** documentation. The project's configured endpoint is `https://openvaa.sandbox.signicat.com/auth/open` (`.env.example` `IDENTITY_PROVIDER_ISSUER` / `IDENTITY_PROVIDER_JWKS_URI`), and the FTN OIDC page's own ID-token example uses `"iss": "https://<YOUR_SIGNICAT_DOMAIN>/auth/open"` — **the same `/auth/open` path**, which is what ties the quoted documentation to this deployment. `[VERIFIED: .env.example IDENTITY_PROVIDER_ISSUER=https://openvaa.sandbox.signicat.com/auth/open — read via `git show HEAD:.env.example`; CITED: the `iss` value in the FTN OIDC ID-token example]` I regard the tie as sound but not airtight; the record should quote both and let a reader judge.

**Recommended recording location** (Claude's discretion per CONTEXT): a short block in `claimConfig.ts`'s existing `PROVIDER_CONFIGS` docstring — it already carries the "never key on a claim that is not an identifier" rationale, it is the file a future reader opens, and it is test-adjacent — **plus** the full quotes and URLs in this phase's record so the citation is discoverable from the phase directory as required.

---

### Criterion 5 (REVIEW-EDGE-05) — `aud`/`iss` fail closed. **Highest severity.**

#### The actual current code, verbatim (`identity-callback/index.ts:69-94`)

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

  return payload;
}
```

`[VERIFIED: apps/supabase/supabase/functions/identity-callback/index.ts:69-94]`

Two things follow that the plan must state out loud. First, **the comment at `:79-87` is the defect's own justification** — "so a deployment that has not set IDENTITY_PROVIDER_ISSUER keeps its current behaviour instead of failing closed on upgrade." That comment must be **replaced**, not merely contradicted by the code beneath it; leaving it would make the file argue against itself. Second, the docstring at `:20-21` says `IDENTITY_PROVIDER_CLIENT_ID: Expected audience in the JWT (checked when set)` and `IDENTITY_PROVIDER_ISSUER: Expected issuer of the JWT (checked when set)` — **"(checked when set)" becomes false** and must change in the same edit. `[VERIFIED: identity-callback/index.ts:16-24, 79-88]`

#### The defect, REPRODUCED this session

```
$ cd apps/supabase && node --input-type=module -e "…"
jose resolved from apps/supabase: jwtVerify=function SignJWT=function createLocalJWKSet=function
A (env unset, current code — verifyOptions = {}): ACCEPTED   <-- the defect
B (fail-closed — { audience, issuer } always supplied): REJECTED
   ERR_JWT_CLAIM_VALIDATION_FAILED | unexpected "iss" claim value
```

The token was minted with `iss: 'https://evil-idp.example'` and `aud: 'some-other-clients-id'` and signed RS256 by a locally generated key pair, then verified against that key pair's public half. **This is exactly the criterion-5 proof, and it runs in this environment today, with no network and no `deno`.** `[VERIFIED: reproduced this session with jose@6.2.1 imported from apps/supabase]`

#### The already-reviewed shape to mirror

Phase 142.1's frontend fix is the template, and it is deliberate about two things this copy also needs. `apps/frontend/src/lib/api/utils/auth/decryptAndVerifyIdToken.ts:83-113`:

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
  get issuer(): string {
    const issuer = constants.IDENTITY_PROVIDER_ISSUER;
    if (!issuer) {
      throw Object.assign(new Error('Cannot verify ID token: no expected issuer is configured.'), {
        code: 'ERR_ISSUER_UNCONFIGURED'
      });
    }
    return issuer;
  }
```

and — the part that matters most — the **structural, not positional** re-check on the call path itself, `decryptAndVerifyIdToken.ts:151-181`:

```ts
  // Re-check on the CALL PATH, not only in `defaultOptions`' getters. jose binds a token to
  // a relying party only when these are TRUTHY: `jwt_claims_set.js` pushes a presence check
  // when the option is `!== undefined`, but compares the VALUE only under `if (audience && …)`
  // / `if (issuer && …)`. So `''` -- and `undefined` even more so -- accepts any token signed
  // by a key in the configured JWK set, including one minted for a different relying party.
  //
  // The getters alone make that guard POSITIONAL: they fire only for callers who take
  // `defaultOptions`. …  Validating here makes the guard structural -- it holds for every
  // caller, whatever options they pass.
  const audience = options.audience;
  const issuer = options.issuer;

  if (!audience) { throw Object.assign(new Error('Cannot verify ID token: no audience is configured.'), { code: 'ERR_AUDIENCE_UNCONFIGURED' }); }
  if (!issuer)   { throw Object.assign(new Error('Cannot verify ID token: no issuer is configured.'),   { code: 'ERR_ISSUER_UNCONFIGURED' }); }

  const { payload } = await jose.jwtVerify(
    new TextDecoder().decode(plaintext),
    jose.createRemoteJWKSet(new URL(options.publicSignatureJWKSetUri)),
    { audience, issuer }
  );
```

`[VERIFIED: apps/frontend/src/lib/api/utils/auth/decryptAndVerifyIdToken.ts:83-113, 151-181]`

**Three properties to carry across, and one deliberately not to.**

Carry: (1) **coded** failures — reuse the identical codes `ERR_AUDIENCE_UNCONFIGURED` / `ERR_ISSUER_UNCONFIGURED`, since the fourth-copy todo's cheapest remedy is "a shared source of truth for the codes alone" and matching strings costs nothing now. (2) **Opaque messages** — never echo the configured value; the Edge Function has an even stronger version of this bar already, and its `catch` at `:226-233` says so: *"jose's claim-validation messages name the offending claim ('unexpected \"iss\" claim value'), which is exactly the discrimination the oracle needs"*, so the throw is logged and a fixed `'Token verification failed'` returned. (3) **Structural, not positional** — validate on the path that calls `jose.jwtVerify`, not only where the env is read.

Do **not** carry: the getter-object shape. The frontend uses getters because its constants module `?? ''`-defaults and its providers each pass an options object; the Edge Function reads `Deno.env.get` directly inside one function. A plain extracted function is simpler and matches this file.

#### Recommended extraction for criterion 5's testability

```ts
// apps/supabase/supabase/functions/identity-callback/verifyConfig.ts
// NO Deno imports and NO URL imports -- same contract as claimConfig.ts, so vitest can reach it.

export interface VerifyClaimBinding { audience: string; issuer: string; }

/**
 * Resolve the audience/issuer binding, FAILING CLOSED when either is unset.
 * Takes the values rather than reading Deno.env, so the caller keeps the only env read
 * and this module stays runtime-agnostic (and therefore testable).
 */
export function requireVerifyClaimBinding(clientId?: string, issuer?: string): VerifyClaimBinding {
  if (!clientId) {
    throw Object.assign(new Error('Cannot verify ID token: no expected audience is configured.'), {
      code: 'ERR_AUDIENCE_UNCONFIGURED'
    });
  }
  if (!issuer) {
    throw Object.assign(new Error('Cannot verify ID token: no expected issuer is configured.'), {
      code: 'ERR_ISSUER_UNCONFIGURED'
    });
  }
  return { audience: clientId, issuer };
}
```

Then `verifyJwt` becomes `const { audience, issuer } = requireVerifyClaimBinding(Deno.env.get('IDENTITY_PROVIDER_CLIENT_ID'), Deno.env.get('IDENTITY_PROVIDER_ISSUER')); … jose.jwtVerify(jwt, jwks, { audience, issuer })`.

**The proof then has two layers, and both are runnable here:**

- **Layer 1 (pure, no `jose`):** `requireVerifyClaimBinding(undefined, undefined)` throws `ERR_AUDIENCE_UNCONFIGURED`; `(id, undefined)` throws `ERR_ISSUER_UNCONFIGURED`; `(id, iss)` returns the binding. Fast, no crypto.
- **Layer 2 (the criterion's literal wording — "a token … is exercised … and observed rejected"):** mint a wrong-`aud`/wrong-`iss` token with `jose` from `node_modules`, verify it against a **local** key (`jose.generateKeyPair` + the public key directly, or `jose.createLocalJWKSet`) so no network is touched, and assert: `{}` → resolves (the pre-fix behaviour, the negative control) and `requireVerifyClaimBinding(...)`-derived options → rejects with `ERR_JWT_CLAIM_VALIDATION_FAILED`. **Both halves ran this session.**

Layer 1 alone would satisfy a literal reading of "fail closed"; layer 2 is what makes it a *demonstration* rather than an assertion, which is the standing bar in this milestone (§ criterion 1's "demonstrated, not asserted"; the `142.1-NEGATIVE-CONTROL-LEDGER.md` / `137-NEGATIVE-CONTROL.md` precedent CONTEXT `<open>` item 6 names). **Do both.**

#### Deployment story — D-N2's "decide it first" step, answered

The todo's Solution step 2 says: *"check whether any environment actually runs without `IDENTITY_PROVIDER_CLIENT_ID` / `IDENTITY_PROVIDER_ISSUER` set."* Answer, measured:

- `.env.example` documents `IDENTITY_PROVIDER_ISSUER` (unprefixed — the name the function reads) ✅ but documents the client id **only** as `PUBLIC_IDENTITY_PROVIDER_CLIENT_ID` ❌ — see the Environment Availability section.
- `tests/IDURA-TEST-RUNBOOK.md:79-81` lists the Edge Function's required set as `IDENTITY_PROVIDER_TYPE, IDENTITY_PROVIDER_DECRYPTION_JWKS, IDENTITY_PROVIDER_JWKS_URI, IDENTITY_PROVIDER_CLIENT_ID, plus optional DEFAULT_PROJECT_ID, SITE_URL` — **`IDENTITY_PROVIDER_ISSUER` is not in the list**, and neither runbook env recipe (`:94-118` Option B, `:225-228` the E2E `/tmp/eflow10.env`) sets it. `[VERIFIED: tests/IDURA-TEST-RUNBOOK.md:79-81, 94-118, 225-228]`

**So there IS at least one configuration in this repo that runs without `IDENTITY_PROVIDER_ISSUER`: the documented bank-auth E2E recipe.** Failing closed will break it loudly — which is the intent, but per the todo it must be a knowing change. **The plan must include updating `tests/IDURA-TEST-RUNBOOK.md` (both recipes) to set `IDENTITY_PROVIDER_ISSUER`**, or the opt-in `PLAYWRIGHT_BANK_AUTH` suite goes red the moment someone runs it. This is the sharpest concrete regression this phase can cause.

---

## Architecture Patterns

### System Architecture Diagram

```
                        ┌───────────────────────────────────────────────┐
   Browser              │  SvelteKit frontend (apps/frontend)           │
   ───────              │                                               │
   candidate/preregister├─► routes/api/candidate/preregister/+server.ts │
                        │      :16  supabase.functions.invoke(          │
                        │             'identity-callback', { id_token })│
                        └──────────────────┬────────────────────────────┘
                                           │  HTTPS  (--no-verify-jwt, PUBLIC)
                                           ▼
        ┌──────────────────────────────────────────────────────────────────────┐
        │  Deno Edge Function: identity-callback/index.ts                      │
        │                                                                      │
        │  isJweToken? ──yes──► decryptJweToken()  [IDENTITY_PROVIDER_          │
        │      │                    :53 JWKS!          DECRYPTION_JWKS]        │
        │      no                    │                                         │
        │      ▼                     ▼                                         │
        │   ┌──────────────────────────────────────────────┐                   │
        │   │ verifyJwt()  :69-94                          │   ◄── CRITERION 5 │
        │   │   jwksUri  = env JWKS_URI!                    │                   │
        │   │   clientId = env CLIENT_ID   ─┐               │                   │
        │   │   issuer   = env ISSUER      ─┤ unset ⇒ OMITTED│  ← FAILS OPEN    │
        │   │   jose.jwtVerify(jwt, remoteJWKS, opts)       │                   │
        │   │   EXTRACT to verifyConfig.ts ⇒ fail closed    │                   │
        │   └───────────────────┬──────────────────────────┘                   │
        │                       ▼                                              │
        │   extractIdentityClaims(payload, PROVIDER_CONFIGS[type])             │
        │        ▲ claimConfig.ts  (URL-import-free ⇒ VITEST-REACHABLE)        │
        │        │ identityMatchProp: 'sub'   ◄── CRITERION 4 (docs only)      │
        │   providerType = env IDENTITY_PROVIDER_TYPE ?? 'signicat'  ◄─ C2 #1  │
        │                       ▼                                              │
        │   projectId = body || env DEFAULT_PROJECT_ID || CONST      ◄─ C2 #2  │
        │                       ▼                                              │
        │   supabase.auth.admin  findUserByIdentityMatch → createUser →        │
        │                        role assign → generateLink                    │
        │                          redirectTo: env SITE_URL || 127.0.0.1:5173  │
        │                                                            ◄─ C2 #3  │
        └──────────────────────────────────────────────────────────────────────┘

        ┌────────────────────────────────┐     ┌────────────────────────────────┐
        │ invite-candidate/index.ts      │     │ send-email/index.ts            │
        │  getUser()  (real verification)│     │  getUser()                     │
        │  :81 atob(seg)   ◄─ CRITERION 1│     │  :111 atob(seg)  ◄─ CRITERION 1│
        │  :84 isAdmin predicate         │     │  :114 isAdmin predicate        │
        │  :131 SITE_URL || SUPABASE_URL │     │  :175 replaceVars ◄─ CRITERION 3│
        │                     ◄─ C2 #7   │     │  :188 dry_run early return     │
        │  inviteUserByEmail(redirectTo) │     │  :210/211/234 SMTP  ◄─ C2 #4-6 │
        └────────────────────────────────┘     └────────────────────────────────┘
             ▲  NO LIVE CALLER                       ▲  NO LIVE CALLER
             │  (supabaseDataWriter.ts:134 is        │  (supabaseAdminWriter.ts:81
             │   reachable only via                  │   is reachable only via
             │   preregisterWithApiToken, which      │   `adminWriter`, which is
             │   nothing calls)                      │   exported and never consumed)

   ── Gates today ──────────────────────────────────────────────────────────────
   prettier --check .              ✅ covers all three functions
   turbo run lint  (ESLint)        ❌ @openvaa/supabase has NO lint script
   turbo run typecheck             ❌ @openvaa/supabase has NO typecheck script
   turbo run test:unit → vitest    ✅ include: supabase/functions/**/*.test.ts
                                      (today: claimConfig.test.ts only, 20 tests)
   NEW: scripts/assert-edge-env-defaults.mjs → yarn lint:check   ◄── D2a
```

### Recommended Project Structure

```
apps/supabase/supabase/functions/
├── identity-callback/
│   ├── index.ts              # imports ./claimConfig.ts, ./verifyConfig.ts  (Deno: .ts suffix)
│   ├── claimConfig.ts        # EXISTING pattern — no Deno, no URL imports
│   ├── claimConfig.test.ts   # EXISTING — 20 tests, already run by turbo
│   ├── verifyConfig.ts       # NEW — fail-closed audience/issuer  (criterion 5)
│   └── verifyConfig.test.ts  # NEW — layer 1 (pure) + layer 2 (jose token)
├── invite-candidate/
│   ├── index.ts
│   ├── jwtSegment.ts         # NEW — base64url decode  (criterion 1)
│   └── jwtSegment.test.ts    # NEW
└── send-email/
    ├── index.ts
    ├── jwtSegment.ts         # NEW — see Pitfall 2 on duplication vs. sharing
    ├── templateVars.ts       # NEW — {{ var }} substitution  (criterion 3)
    └── templateVars.test.ts  # NEW

scripts/
└── assert-edge-env-defaults.mjs   # NEW — D2a guard, wired into lint:check
```

### Pattern 1: URL-import-free sibling module (the tree's own established pattern)

**What:** Extract pure logic out of an Edge Function `index.ts` into a sibling `.ts` that imports nothing from `deno.land`/`esm.sh` and touches no `Deno.*` global. `index.ts` imports it with the Deno-required `.ts` suffix; the vitest file imports it without.

**When to use:** whenever an Edge Function behaviour must be "matched by test". It is the only shape that works, and it is already proven in-tree.

**Example:**

```ts
// Source: apps/supabase/supabase/functions/identity-callback/claimConfig.ts:1-8 (verbatim)
/**
 * Provider claim configuration and extraction logic.
 *
 * Pure functions extracted from the identity-callback Edge Function for
 * testability. This module has NO Deno imports (no Deno.env, no Deno.serve,
 * no URL imports from deno.land) so it can be imported by both the Edge
 * Function and vitest.
 */
```

```ts
// Source: apps/supabase/supabase/functions/identity-callback/index.ts:35   (Deno side, .ts suffix)
import { PROVIDER_CONFIGS, extractIdentityClaims } from './claimConfig.ts';

// Source: apps/supabase/supabase/functions/identity-callback/claimConfig.test.ts:11-12 (vitest side)
import { describe, it, expect } from 'vitest';
import { PROVIDER_CONFIGS, extractIdentityClaims } from './claimConfig';
```

`[VERIFIED: all three files read this session; the asymmetry works — 20 tests pass]`

### Pattern 2: Env read stays at the boundary; validation lives in the pure module

**What:** the extracted module takes *values*, not the environment. `Deno.env.get` stays in `index.ts`; the module decides whether the value is acceptable and throws naming the variable.

**Why:** it keeps the module runtime-agnostic (vitest has no `Deno` global), it keeps exactly one place that knows the variable names, and it makes the throw testable without any environment manipulation. The alternative — a `requireEnv()` helper that calls `Deno.env.get` itself — is untestable from vitest without stubbing a global that does not exist there.

```ts
// index.ts (boundary)
const providerType = requireEnv('IDENTITY_PROVIDER_TYPE', Deno.env.get('IDENTITY_PROVIDER_TYPE'));

// envConfig.ts (pure, testable)
export function requireEnv(name: string, value: string | undefined): string {
  if (!value) {
    throw Object.assign(
      new Error(`Missing required environment variable: ${name}.`),
      { code: 'ERR_ENV_UNCONFIGURED', variable: name }
    );
  }
  return value;
}
```

> Passing the name *and* the value is redundant-looking and deliberate: it is what lets the message name the variable while keeping the module free of `Deno`. A plan that shortens it to `requireEnv(Deno.env.get('X'))` loses the variable name from the error — which is the entire point of criterion 2.

### Pattern 3: The negative control asserts its own premise

Covered under criterion 1. Restated as a pattern because it applies to criterion 5 too: the layer-2 test's "before" arm must genuinely reproduce the acceptance, or the "after" arm proves nothing. Assert the fixture's properties (`/[-_]/.test(seg)`; `payload.aud !== expectedAud`) inside the test.

### Anti-Patterns to Avoid

- **Implementing dotted-path resolution in `replaceVars`.** D-D4 rejected it, and the SQL producer proves why: `502-email-helpers.sql:93-96` emits keys that literally contain dots. Path traversal would break every existing placeholder.
- **Renaming `DEFAULT_PROJECT_ID` to `PROJECT_ID`.** D-D3 gives that to Phase 161. 155 changes the *behaviour* at `:197`, not the *name*.
- **Editing `identity-callback/index.ts:31`.** Phase 161's line. 155 does not touch it.
- **Fixing `config.toml` ports.** Phase 156 criterion 8. Hand it over; do not edit.
- **Collapsing the Edge Function verifier onto the frontend core.** The fourth-copy todo stays filed and explicitly says the collapse "would need a cross-runtime module-sharing decision this todo does not prejudge."
- **A guard predicate anchored on "the assignment starts with `Deno.env.get`".** It misses `:197` and `:234`. CONTEXT names this trap; the tested predicate above avoids it.
- **A line-by-line guard scan.** Wrapping defeats it. Scan whole-file, strip comments, derive line numbers from the match index.
- **Leaving `identity-callback/index.ts:79-87` in place after fixing `verifyJwt`.** That comment argues *for* the defect. It must go in the same edit, as must "(checked when set)" at `:20-21`.

---

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| JWT claim validation (`aud`/`iss`/`exp`/`nbf`) | A manual claim-comparison block after `jwtVerify` | `jose`'s own `{ audience, issuer }` verify options | jose already implements presence + value + `exp`/`nbf` skew handling. The bug is that the options are *omitted*, not that jose is wrong. Reproduced this session: with options supplied, jose rejects with a precise `ERR_JWT_CLAIM_VALIDATION_FAILED`. |
| Base64url→string | A custom base64 alphabet decoder | `atob` + a three-line pad-and-translate, then `TextDecoder` | The alphabet translation is 2 lines and the padding 1; writing a full decoder invites an off-by-one. Deno has no `Buffer.from(x,'base64url')`, so the translate step is genuinely needed — but only that step. |
| A test runner for Edge Functions | A bespoke Deno harness, a `deno.json`, a vendored URL cache, a new turbo task and a new CI step | The vitest config that already exists and already runs | Measured: 20 tests execute today via `turbo run test:unit`. `deno` is not even installed here. |
| A static "no silent env default" check | A custom ESLint rule + a new lint surface for `apps/supabase` | `scripts/assert-edge-env-defaults.mjs` in the shape of the three existing guards | `turbo run lint` reports `@openvaa/supabase \| <NONEXISTENT>` — there is no lint surface to hang a rule on. The Node-scan precedent is three files deep and documented. |
| Discovering new `*.test.ts` under the functions tree | A glob addition, a new vitest project, a `testMatch` | Nothing — `include: ['supabase/functions/**/*.test.ts']` already covers it | `[VERIFIED: apps/supabase/vitest.config.ts]` |

**Key insight:** every capability this phase needs already exists in the tree and is already wired; the phase's real work is *extraction and evidence*, not construction. The one genuinely new artefact is the D2a guard, and even that has three committed siblings to copy.

---

## Runtime State Inventory

Not a rename/refactor/migration phase — but this phase turns optional configuration into hard failures, which has the same "the repo is not the whole system" property. Filled on that basis.

| Category | Items Found | Action Required |
|----------|-------------|------------------|
| Stored data | **None.** No data records key on any of the seven variables. `identity_match_value` in `auth.users.app_metadata` derives from the token's `sub`, and criterion 4 changes no code, so no stored value is invalidated. Verified by reading `identity-callback/index.ts` §6-§7 and `claimConfig.ts`. | none |
| Live service config | **Supabase Edge Function secrets** — the deployed runtime's env is set via `supabase secrets set` (or a `--env-file`), and that state lives outside git. `tests/tests/specs/candidate/candidate-bank-auth.spec.ts:115` documents the command form. **Any deployed environment missing `IDENTITY_PROVIDER_ISSUER`, `SITE_URL`, `DEFAULT_PROJECT_ID`, `SMTP_HOST/PORT/FROM` will start throwing once this ships.** | Operator must set the variables before/with deploy. Name them in the phase summary. |
| OS-registered state | **None** — no scheduled task, launchd plist, pm2 process or systemd unit references these functions. Verified: no such registration exists in-repo and the functions run inside supabase-edge-runtime. | none |
| Secrets / env vars | **Seven D2a variables + two criterion-5 variables.** In `.env.example`: `IDENTITY_PROVIDER_ISSUER` ✅ present; `IDENTITY_PROVIDER_CLIENT_ID` ❌ present only as `PUBLIC_IDENTITY_PROVIDER_CLIENT_ID`; `IDENTITY_PROVIDER_TYPE` ❌ present only as `PUBLIC_IDENTITY_PROVIDER_TYPE`; `DEFAULT_PROJECT_ID` ❌ absent; `SITE_URL` ❌ absent; `SMTP_HOST` ❌ absent; `SMTP_PORT` ❌ absent; `SMTP_FROM` ❌ absent; unprefixed `SUPABASE_URL` ❌ absent (`PUBLIC_SUPABASE_URL` present). There is **no `apps/supabase/supabase/functions/.env`** in the repo or on disk. | Add the six missing entries to `.env.example` in the same commit as the first throw. |
| Build artefacts | **None.** Edge Functions are not built; `@openvaa/supabase` has no `build` script (`turbo run build` → `@openvaa/supabase \| <NONEXISTENT>`). | none |
| **Documentation that becomes false** | `tests/IDURA-TEST-RUNBOOK.md:79-81` ("plus **optional** `DEFAULT_PROJECT_ID`, `SITE_URL`"), `:117-118` ("`# DEFAULT_PROJECT_ID=… # falls back to the seed project if unset`", "`# SITE_URL=… # default already matches config.toml`"), `:121` ("`DEFAULT_PROJECT_ID` is optional (falls back to the seed project). `SITE_URL` defaults to `http://127.0.0.1:5173`"), plus the `/tmp/eflow10.env` recipe at `:222-229` which sets **no** `IDENTITY_PROVIDER_ISSUER`. Also `identity-callback/index.ts:17` ("defaults to 'signicat'") and `:20-21` ("checked when set"). | **Update all of these in-phase.** They are the runbook a human follows; leaving them stale turns a deliberate hard failure into a mystery. |

`[VERIFIED: every row measured this session — `git show HEAD:.env.example`, `find apps/supabase -name ".env*"` (empty), `turbo run build --dry`, and direct reads of the runbook and index.ts]`

---

## Common Pitfalls

### Pitfall 1: Assuming `.env.example` documents these variables

**What goes wrong:** the plan lands seven throws, a developer copies `.env.example` to `.env`, and `identity-callback` throws on the first bank-auth attempt with `Missing required environment variable: SITE_URL` — a variable that appears nowhere in the example file.
**Why it happens:** CONTEXT `<open>` item 3 left this unverified because the previous session's sandbox refused to read `.env.example`. It reads fine via `git show HEAD:.env.example`, and the answer is bad: **six of seven absent, and two of the "present" ones are present only under a `PUBLIC_` prefix the Edge Functions do not read.**
**How to avoid:** add `IDENTITY_PROVIDER_TYPE`, `IDENTITY_PROVIDER_CLIENT_ID`, `DEFAULT_PROJECT_ID`, `SITE_URL`, `SMTP_HOST`, `SMTP_PORT`, `SMTP_FROM` to `.env.example` **in the same commit as the first throw**, in a clearly-labelled "Edge Function (un-prefixed) configuration" block that says *why* the unprefixed twins exist.
**Warning signs:** a plan task that changes an Edge Function without a paired `.env.example` diff.

> Note the prefix trap in its own right: the frontend reads `PUBLIC_IDENTITY_PROVIDER_TYPE`/`PUBLIC_IDENTITY_PROVIDER_CLIENT_ID` (Vite `PUBLIC_` convention) while the Edge Function reads the unprefixed names. `tests/IDURA-TEST-RUNBOOK.md:76-79` calls this "the main gotcha" and is right. Do not "consolidate" the names in this phase.

### Pitfall 2: Duplicating `jwtSegment.ts` in two function directories without saying so

**What goes wrong:** the decode helper is needed in `invite-candidate` and `send-email`. Deno Edge Functions cannot import across function directories in the deployed bundle without a shared `_shared/` convention that this repo does not have (`find apps/supabase/supabase/functions -type f` returns five files across three directories — **no `_shared/`**).
**Why it happens:** the instinct to DRY collides with the deployment boundary.
**How to avoid:** either accept two byte-identical copies **with a cross-reference comment in each** (the honest, low-risk option, and the same posture the fourth-verifier todo takes toward the frontend), or introduce a `_shared/` directory as a deliberate, named decision. Do not introduce one silently — Supabase's function bundler treats each top-level directory as a deployment unit, and a shared directory changes that contract.
**Warning signs:** an import of `'../invite-candidate/jwtSegment.ts'` from `send-email`.

### Pitfall 3: Writing a test that cannot fail

**What goes wrong:** the criterion-1 test builds a fixture whose base64url form contains no `-`/`_`, so `atob` succeeds on both the old and new code and the "negative control" is a tautology. Measured probability that a realistic payload dodges the defect: **~100 %** (0 hits in 2205 trials).
**Why it happens:** base64url and base64 agree on almost all inputs; the difference is two characters out of sixty-four.
**How to avoid:** the in-test premise guard shown under criterion 1. Same discipline for criterion 5: assert the minted token's `aud`/`iss` really differ from the expected values before asserting rejection.
**Warning signs:** a criterion-1 test whose fixture is "a realistic Supabase JWT".

### Pitfall 4: `jose` major-version skew between the test and the runtime

**What goes wrong:** the criterion-5 proof runs against `jose@6.2.1` from `node_modules`, while `identity-callback` runs `jose@v5.9.6` from `deno.land`. A behaviour that differs between majors would make the proof describe code that is not deployed.
**Why it happens:** the two dependency systems are unconnected, and nothing asserts they agree.
**How to avoid:** (i) state the skew explicitly in the plan and the record rather than eliding it; (ii) keep layer 1 (the pure `requireVerifyClaimBinding` test) as the *primary* proof — it is version-independent — and treat layer 2 as corroboration; (iii) note that the todo's own measurement cites v5's `jose/dist/webapi/lib/jwt_claims_set.js:101-121` presence/value semantics and this session measured the identical behaviour on v6, so the two agree on the property under test. `[ASSUMED — the v5/v6 equivalence is inferred from matching observed behaviour plus the todo's v5 source citation, not from reading v5's source this session]`
**Warning signs:** a plan that claims the test "proves the deployed function is fixed" without qualification.

### Pitfall 5: Relying on the `jose` hoist without declaring it

**What goes wrong:** the test imports `jose` from `apps/supabase` and it resolves today only because Yarn's node-modules linker hoisted `jose@6.2.1` to the repo root for `@openvaa/frontend` and `@openvaa/dev-tools`. If either drops the dependency, or the linker changes, the Edge Function test breaks for a reason unrelated to itself.
**Why it happens:** hoisting makes undeclared dependencies work silently.
**How to avoid:** `yarn workspace @openvaa/supabase add -D jose` so the dependency is declared where it is used. Cheap, and it makes the test's provenance honest.
**Warning signs:** `apps/supabase/package.json` `devDependencies` containing only `supabase` and `vitest` while a test under it imports `jose`.

### Pitfall 6: Believing the E2E suite exercises `send-email`

**What goes wrong:** a plan adds a `checkpoint:human-verify` or an E2E gate for the `send-email` throws, or — worse — panics that the default suite will break.
**Why it happens:** `tests/tests/specs/candidate/candidate-journey.spec.ts:429` and `tests/tests/specs/perm/perm-localisation-positive.spec.ts:235` both call `client.sendEmail(...)`, which *looks* like it drives the Edge Function.
**How to avoid:** it does not. `tests/tests/utils/supabaseAdminClient.ts:538-600` implements `sendEmail` with `auth.admin.generateLink` / `auth.admin.inviteUserByEmail` — GoTrue's own mailer via the Inbucket/Mailpit config in `config.toml`, never `functions.invoke`. `[VERIFIED: read this session]`
**Warning signs:** a plan task justifying itself by "the E2E suite sends email".

### Pitfall 7: Assuming Phase 152's comment scan is already gating this phase

**What goes wrong:** the plan relies on `lint:check` catching a comment-convention violation, and it does not, because the scan does not exist yet.
**Why it happens:** D-N1 says 152 lands first, and `.planning/phases/152-comment-naming-hygiene-sweep/` exists — but it holds only `152-{01..07}-PLAN.md`, `152-CONTEXT.md`, `152-DISCUSSION-LOG.md`, `152-PATTERNS.md`, `152-RESEARCH.md`, `152-VALIDATION.md`. **No `*-SUMMARY.md`, no execution commits** (the last five commits are all `docs(v2.15)`/`docs(todo)`), and root `lint:check` is still `turbo run lint && eslint … tests && yarn typecheck:tests && yarn typecheck && yarn assert:i18n-catalog-namespaces && yarn assert:a11y-scan-wiring` — no comment scan link. `grep` for `assert:comment|comment-hygiene|assert-comment` across `package.json`, `scripts/` and `.github/` returns **nothing**.
**How to avoid:** **write this phase's comments to the convention manually** (no planning references, no forced line breaks, no `--`-as-dash), and do not assume a gate. If 152 executes before 155, the comments are gated retroactively and pass; if not, they are still correct. `[VERIFIED: phase-dir listing, git log, package.json and grep, this session]`
**Warning signs:** a plan verification step that runs `yarn lint:check` "to check comment hygiene".

---

## Code Examples

### Verifying the aud/iss fail-open, then the fail-closed fix (runs today, no network)

```ts
// Source: pattern of apps/frontend/src/lib/api/utils/auth/decryptAndVerifyIdToken.ts:151-181,
//         executed end-to-end this session from apps/supabase with jose@6.2.1
import { describe, it, expect } from 'vitest';
import * as jose from 'jose';
import { requireVerifyClaimBinding } from './verifyConfig';

describe('aud/iss fail closed (REVIEW-EDGE-05)', () => {
  it('rejects a wrong-aud, wrong-iss token even when the env vars are unset', async () => {
    const { publicKey, privateKey } = await jose.generateKeyPair('RS256');
    const jwt = await new jose.SignJWT({ sub: 'abc' })
      .setProtectedHeader({ alg: 'RS256' })
      .setIssuer('https://evil-idp.example')
      .setAudience('some-other-clients-id')
      .setExpirationTime('1h')
      .sign(privateKey);

    // NEGATIVE CONTROL — the shape the current code builds when both env vars are unset.
    // Measured this session: this RESOLVES. That acceptance is the defect.
    await expect(jose.jwtVerify(jwt, publicKey, {})).resolves.toBeDefined();

    // Layer 1 — the pure guard: unset configuration must throw, not degrade.
    expect(() => requireVerifyClaimBinding(undefined, undefined)).toThrow(
      expect.objectContaining({ code: 'ERR_AUDIENCE_UNCONFIGURED' })
    );

    // Layer 2 — with a configured binding, jose rejects. Measured message:
    //   ERR_JWT_CLAIM_VALIDATION_FAILED | unexpected "iss" claim value
    const binding = requireVerifyClaimBinding('our-client-id', 'https://good-idp.example');
    await expect(jose.jwtVerify(jwt, publicKey, binding)).rejects.toMatchObject({
      code: 'ERR_JWT_CLAIM_VALIDATION_FAILED'
    });
  });
});
```

### Base64url decode with a premise-guarded negative control

```ts
// Source: measured this session; the guard exists because 0 of 2205 realistic payloads
// produced a segment plain atob() rejects.
import { describe, it, expect } from 'vitest';
import { decodeJwtSegment } from './jwtSegment';

describe('base64url JWT segment decode (REVIEW-EDGE-01)', () => {
  it('decodes a segment plain atob() rejects', () => {
    const payload = { user_roles: [{ role: 'super_admin', scope_type: 'project', scope_id: 'p' }], marker: '~~~' };
    const seg = Buffer.from(JSON.stringify(payload)).toString('base64url');

    // Premise guard — without it this test passes trivially the day the fixture changes.
    expect(/[-_]/.test(seg), 'fixture must exercise the base64url alphabet').toBe(true);

    // NEGATIVE CONTROL: the current expression. Measured: InvalidCharacterError.
    expect(() => JSON.parse(atob(seg))).toThrow();

    // The fix.
    expect(JSON.parse(decodeJwtSegment(seg))).toEqual(payload);
  });

  it('round-trips non-ASCII claim values as UTF-8, not latin1', () => {
    // atob() alone yields "ÃÃ¤kkÃ¶nen" — measured.
    const seg = Buffer.from(JSON.stringify({ name: 'Ääkkönen' })).toString('base64url');
    expect(JSON.parse(decodeJwtSegment(seg)).name).toBe('Ääkkönen');
  });
});
```

### The D2a guard core (predicate already tested 7/7 · 4/4)

```js
// Source: shape copied from scripts/assert-a11y-scan-wiring.mjs:60-100,171 (verbatim idioms);
// predicate executed against the functions tree this session.
const ENV_DEFAULT = /Deno\.env\.get\(\s*['"`][^'"`]+['"`]\s*\)\s*(\?\?|\|\|)/g;

function scan(filePath, src) {
  // Same comment strip the a11y guard uses at :171 — this phase's own docstrings
  // will quote the forbidden pattern, and the guard must not trip on prose.
  const codeOnly = src.replace(/\/\*[\s\S]*?\*\//g, (m) => m.replace(/[^\n]/g, ' ')).replace(/^\s*\/\/.*$/gm, '');
  const hits = [];
  let m;
  ENV_DEFAULT.lastIndex = 0;
  while ((m = ENV_DEFAULT.exec(codeOnly)) !== null) {
    hits.push({ line: codeOnly.slice(0, m.index).split('\n').length, text: m[0] });
  }
  return hits;
}
```

> The comment-strip variant above replaces block-comment bodies with spaces rather than deleting them, so line numbers survive the strip. The a11y guard deletes, because it only needs a boolean.

### The `lint:check` wiring (follow the existing links exactly)

```jsonc
// package.json
"assert:edge-env-defaults": "node scripts/assert-edge-env-defaults.mjs",
"lint:check": "turbo run lint && eslint --flag v10_config_lookup_from_file tests && yarn typecheck:tests && yarn typecheck && yarn assert:i18n-catalog-namespaces && yarn assert:a11y-scan-wiring && yarn assert:edge-env-defaults"
```

```ts
// Membership assertion, in the shape of packages/dev-seed/tests/ciTypecheckGate.test.ts:83-86.
// MEMBERSHIP, not position — Phase 144 / commit b410d3a90.
expect(ROOT_PACKAGE_JSON.scripts['lint:check']).toContain('yarn assert:edge-env-defaults');
expect(ROOT_PACKAGE_JSON.scripts['assert:edge-env-defaults']).toBe('node scripts/assert-edge-env-defaults.mjs');
```

---

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| `atob(token.split('.')[1])` for JWT segments | base64url translate + pad, then `TextDecoder('utf-8')` | RFC 7515 §2 has required base64url since 2015 | The two are indistinguishable on most inputs, which is why the defect survives review. Node 16+ offers `Buffer.from(s,'base64url')`; **Deno has no `Buffer`**, so the translate step is genuinely needed here. |
| `if (clientId) verifyOptions.audience = clientId` | Always supply `{ audience, issuer }`; throw when unconfigured | Phase 142.1 established it on the frontend (`bc505fa97`, `3dcfd9b83`) | jose's split semantics (presence check on `!== undefined`, value comparison on truthiness) make "configure it when you have it" an authentication bypass rather than a graceful degradation. |
| Optional env with a sensible default | Throw naming the missing variable + a static guard closing the class | This milestone (REVIEW-EDGE-02 / D-D2) | Turns a class of silent misconfiguration into a loud one. Costs a documentation obligation (`.env.example`, the Idura runbook) that the phase must pay. |
| Untested Edge Functions | URL-import-free sibling modules under the existing vitest config | Established in-tree by `claimConfig.ts` (Phase 142.1) | The pattern already carries 20 tests; this phase widens it rather than inventing anything. |

**Deprecated/outdated:**

- The comment at `identity-callback/index.ts:79-87` ("keeps its current behaviour instead of failing closed on upgrade") — superseded by operator decision O1. Remove.
- `identity-callback/index.ts:17` ("defaults to 'signicat'") and `:20-21` ("checked when set") — become false in this phase. Rewrite.
- `tests/IDURA-TEST-RUNBOOK.md:79-81, 117-121, 222-229` — the "optional / falls back" framing becomes false, and the E2E env recipe omits `IDENTITY_PROVIDER_ISSUER`. Update.

---

## Assumptions Log

| # | Claim | Section | Risk if Wrong |
|---|-------|---------|---------------|
| A1 | Deno's `atob` implements the same WHATWG forgiving-base64 algorithm measured here on Node — i.e. it rejects `-`/`_` and accepts unpadded input of length `% 4 ∈ {0,2,3}` | Criterion 1 | LOW. Both are WHATWG `atob`. If Deno differed, the *direction* would still hold (base64url is not base64) but the padding finding might not. Mitigation: the recommended fix pads unconditionally, so it is correct under either behaviour. `deno` is not installed here, so this could not be measured directly. |
| A2 | `jose@5.9.6` (the Deno runtime version) and `jose@6.2.1` (the vitest version) agree on the `aud`/`iss` presence-vs-value semantics under test | Criterion 5 / Pitfall 4 | LOW-MEDIUM. The v6 behaviour was measured this session and matches the v5 source lines the Phase-142.1 todo cites (`jwt_claims_set.js:101-121`). If they diverged, layer-2 would prove less than claimed — layer 1 is unaffected. Mitigation: keep layer 1 primary; state the skew. |
| A3 | Supabase injects `SUPABASE_URL` / `SUPABASE_ANON_KEY` / `SUPABASE_SERVICE_ROLE_KEY` into the Edge Function environment automatically, so their `!` assertions are lower-risk than the identity-provider ones | Criterion 2, adjacent class | LOW. Sourced from the function's own docstring (`identity-callback/index.ts:22-23`, "auto-set by Supabase"), not from platform documentation read this session. Affects only the *priority* of a filed todo, not any code change. |
| A4 | The eID-Hub "Subject" semantics quoted for criterion 4 apply to the `/auth/open` endpoint this project targets | Criterion 4 | MEDIUM. Tied by the shared `/auth/open` path between `.env.example`'s `IDENTITY_PROVIDER_ISSUER` and the FTN OIDC page's ID-token `iss` example. If the deployment is on a different Signicat product line with different subject handling, the citation would need re-sourcing — but the *verdict* would still be "stable", since every Signicat product line documents `sub` as the recurring-user key. Mitigation: record both quotes so a reader can re-judge. |
| A5 | `send-email` and `invite-candidate` have no live caller — the throws cannot break `yarn dev`, `yarn db:reset`, `yarn test:e2e` or the seed | Environment Availability | LOW-MEDIUM. Established by grep over `apps` and `tests` for `functions.invoke`, `adminWriter.`, and `preregisterWithApiToken` — all declarations, no call sites. A caller constructed dynamically (string-built function name) would evade the grep; none was seen. Mitigation: the phase can confirm cheaply by running the full E2E suite, which it should do anyway. |

---

## Open Questions

1. **Does `send-email`'s throw set belong behind a feature check, given the function is uncalled?**
   - What we know: nothing in the product or the suite invokes it; `supabaseAdminWriter.ts:81` is reachable only via an `adminWriter` export that is never consumed.
   - What's unclear: whether an out-of-tree admin app calls it, or whether it is intended future surface.
   - Recommendation: fix it exactly as the criterion says (it is cheap and correct), and note the dead-call-path finding in the phase record so the operator can decide separately whether the function should exist at all. Do **not** delete it in this phase.

2. **`_shared/` directory, or two copies of `jwtSegment.ts`?**
   - What we know: no `_shared/` exists; Supabase treats each top-level function directory as a deployment unit.
   - What's unclear: whether the deployed bundler in this project's Supabase version follows relative imports outside the function directory.
   - Recommendation: two copies with cross-reference comments, unless the plan wants to spend a task validating `_shared/` against a real `supabase functions deploy`. Duplication here is 12 lines and fully tested on both sides.

3. **Negative-control recording format** (CONTEXT `<open>` item 6, still open).
   - What we know: the precedents are `142.1-NEGATIVE-CONTROL-LEDGER.md` and `137-NEGATIVE-CONTROL.md`.
   - Recommendation: a `155-NEGATIVE-CONTROL-LEDGER.md` with one row per criterion (1, 3, 5) recording fixture · pre-fix observation · post-fix observation · the test file that now holds it. Three criteria demand demonstrations; a ledger is proportionate and matches the milestone's habit.

4. **Does `IDENTITY_PROVIDER_TYPE` deserve a throw, or an explicit allow-list error?**
   - What we know: `:169` currently defaults to `'signicat'`; `:170-175` already returns a 500 for an unknown provider type.
   - What's unclear: nothing blocking — but the throw and the existing unknown-type branch should read as one story, not two.
   - Recommendation: make the missing-variable case throw naming `IDENTITY_PROVIDER_TYPE` and leave the unknown-value 500 as is; mention both in one comment.

5. **Is `REVIEW-EDGE-01..05` now defined?** CONTEXT `<open>` item 1 flagged them as undefined. **Resolved:** `.planning/REQUIREMENTS.md:113-117` defines all five, and the coverage table at `:336` reads `| 155 — Edge Function Hardening | REVIEW-EDGE-01..05 | 5 |`. The `<open>` item is stale. `[VERIFIED: read this session]`

---

## Environment Availability

| Dependency | Required By | Available | Version | Fallback |
|------------|------------|-----------|---------|----------|
| `vitest` | Criteria 1, 3, 5 tests | ✓ | 3.2.4 | — |
| `turbo` | Executing those tests in CI | ✓ | pinned in repo | — |
| `jose` (node) | Criterion 5 layer-2 proof | ✓ | 6.2.1 (hoisted at `/node_modules/jose`) | Layer 1 alone (pure, no jose) |
| Node built-ins | D2a guard | ✓ | Node 20+ | — |
| `deno` | The `deno test` alternative | ✗ | — | **vitest + extract-to-module (recommended)** |
| `deno.json` / `deno.lock` | Same | ✗ | — | Same |
| ESLint over `apps/supabase` | The ESLint-rule D2a alternative | ✗ (`turbo run lint` → `<NONEXISTENT>`) | — | **Committed Node scan (recommended)** |
| Type-check over `apps/supabase` | Any typecheck-based gate | ✗ (`turbo run typecheck` → `<NONEXISTENT>`) | — | vitest + prettier are the only gates today |
| Prettier over the functions tree | Formatting the new files | ✓ (no `.prettierignore` entry) | — | — |
| Network access to `developer.signicat.com` | Criterion 4 | ✓ via `curl` (WebFetch returned 404; `curl` with a browser UA returned 200) | — | — |

### Env-var availability — the D2a blast-radius table

| Variable | Read at | In `.env.example`? | Supplied locally by | Breaks when it throws? |
|---|---|---|---|---|
| `IDENTITY_PROVIDER_TYPE` | `identity-callback:169` | ❌ (only `PUBLIC_IDENTITY_PROVIDER_TYPE`) | runbook Option A/B, `supabase secrets` | `identity-callback` only |
| `DEFAULT_PROJECT_ID` | `identity-callback:197` | ❌ | runbook calls it **optional** | `identity-callback` only |
| `SITE_URL` | `identity-callback:361`, `invite-candidate:131` | ❌ | runbook calls it **optional** | `identity-callback`, `invite-candidate` |
| `SMTP_HOST` | `send-email:210` | ❌ | nothing in repo | `send-email` only (**no caller**) |
| `SMTP_PORT` | `send-email:211` | ❌ | nothing in repo | `send-email` only (**no caller**) |
| `SMTP_FROM` | `send-email:234` | ❌ | nothing in repo | `send-email` only (**no caller**) |
| `IDENTITY_PROVIDER_CLIENT_ID` | `identity-callback:72` (criterion 5) | ❌ (only `PUBLIC_…`) | runbook `:115`, `:228` | `identity-callback` |
| `IDENTITY_PROVIDER_ISSUER` | `identity-callback:73` (criterion 5) | ✓ `:62` | **NOT set by either runbook recipe** | `identity-callback` — **and the documented bank-auth E2E recipe** |
| `SUPABASE_URL` (unprefixed) | 5 `!` sites | ❌ (only `PUBLIC_SUPABASE_URL`) | auto-injected by Supabase | not touched by this phase |

`[VERIFIED: git show HEAD:.env.example; tests/IDURA-TEST-RUNBOOK.md:79-121, 222-229; grep over the functions tree]`

### Which local flows actually invoke these functions

| Flow | `identity-callback` | `invite-candidate` | `send-email` |
|---|---|---|---|
| `yarn dev` | only if a user walks `/candidate/preregister` (`routes/api/candidate/preregister/+server.ts:16`) | ✗ no caller | ✗ no caller |
| `yarn db:reset` / `db:reset-with-data` / `db:seed` | ✗ | ✗ | ✗ |
| `yarn test:e2e` (default) | ✗ — the `bank-auth` and `bank-auth-journey` projects are **opt-in behind `PLAYWRIGHT_BANK_AUTH`** (`tests/playwright.config.ts:512-533, 604+`) | ✗ | ✗ (`supabaseAdminClient.sendEmail` uses GoTrue's `inviteUserByEmail`/`generateLink`, **not** `functions.invoke`) |
| `PLAYWRIGHT_BANK_AUTH=1 yarn test:e2e` | ✓ directly | ✗ | ✗ |

**Missing dependencies with no fallback:** none.
**Missing dependencies with fallback:** `deno` → vitest + extract-to-module; ESLint on `apps/supabase` → committed Node scan.

**Bottom line on regression risk:** the feared "D2a breaks local dev / E2E / seed" scenario **does not materialise**. The one real exposure is the opt-in bank-auth E2E recipe, which omits `IDENTITY_PROVIDER_ISSUER` — and that is a documentation fix inside this phase, not a blocker.

---

## Validation Architecture

`.planning/config.json` does not set `workflow.nyquist_validation`, so it is enabled.

### Test Framework

| Property | Value |
|----------|-------|
| Framework | vitest 3.2.4 |
| Config file | `apps/supabase/vitest.config.ts` — `{ globals: true, environment: 'node', include: ['supabase/functions/**/*.test.ts'] }` |
| Quick run command | `yarn workspace @openvaa/supabase test:unit` |
| Full suite command | `yarn test:unit` (→ `yarn assert:unit-coverage && turbo run test:unit`) |

`[VERIFIED: apps/supabase/vitest.config.ts; apps/supabase/package.json; root package.json; both commands' behaviour measured]`

### Phase Requirements → Test Map

| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|-------------|
| REVIEW-EDGE-01 | base64url segment decodes; plain `atob` throws on the same input; UTF-8 preserved | unit | `yarn workspace @openvaa/supabase vitest run supabase/functions/invite-candidate/jwtSegment.test.ts` | ❌ Wave 0 |
| REVIEW-EDGE-01 | same, `send-email` copy | unit | `… supabase/functions/send-email/jwtSegment.test.ts` | ❌ Wave 0 |
| REVIEW-EDGE-02 | each of 7 sites throws naming its variable | unit (over the extracted `requireEnv`) | `… supabase/functions/**/envConfig.test.ts` | ❌ Wave 0 |
| REVIEW-EDGE-02 | the class stays closed | static guard | `node scripts/assert-edge-env-defaults.mjs` (chained into `yarn lint:check`) | ❌ Wave 0 |
| REVIEW-EDGE-02 | the guard cannot be silently unwired | unit | `yarn workspace @openvaa/dev-seed vitest run tests/ciTypecheckGate.test.ts` (extend it, or add a sibling) | ⚠ file exists, assertion to add |
| REVIEW-EDGE-02 | sweep dispositioned | manual + recorded | phase record table (see § sweep above) | n/a — documentation |
| REVIEW-EDGE-03 | `{{x}}`, `{{ x }}`, `{{  x  }}`, dotted flat keys, unknown key passthrough, `{{}}` non-match | unit | `… supabase/functions/send-email/templateVars.test.ts` | ❌ Wave 0 |
| REVIEW-EDGE-04 | `identityMatchProp === 'sub'`; `birthdate` stays metadata | unit | `… supabase/functions/identity-callback/claimConfig.test.ts` | ✅ **exists and passes (20 tests)** |
| REVIEW-EDGE-04 | the docs citation is on the record | manual | phase record + `claimConfig.ts` docstring | n/a — documentation |
| REVIEW-EDGE-05 | unset config throws `ERR_AUDIENCE_UNCONFIGURED` / `ERR_ISSUER_UNCONFIGURED` | unit | `… supabase/functions/identity-callback/verifyConfig.test.ts` | ❌ Wave 0 |
| REVIEW-EDGE-05 | wrong-`aud`+wrong-`iss` token accepted under `{}`, rejected under the binding | unit (jose, local keys, no network) | same file | ❌ Wave 0 |

### Sampling Rate

- **Per task commit:** `yarn workspace @openvaa/supabase test:unit` (measured 237 ms wall, 3 ms of tests — effectively free)
- **Per wave merge:** `yarn test:unit && yarn lint:check`
- **Phase gate:** `yarn test:unit` green, `yarn lint:check` green (now including the new guard), and `yarn test:e2e` green per the project's cardinal rule. Add `PLAYWRIGHT_BANK_AUTH=1` **once** to confirm the runbook update actually works — the criterion-5 change is on that path.

### Wave 0 Gaps

- [ ] `apps/supabase/supabase/functions/identity-callback/verifyConfig.ts` + `.test.ts` — covers REVIEW-EDGE-05
- [ ] `apps/supabase/supabase/functions/invite-candidate/jwtSegment.ts` + `.test.ts` — covers REVIEW-EDGE-01
- [ ] `apps/supabase/supabase/functions/send-email/jwtSegment.ts` + `.test.ts` — covers REVIEW-EDGE-01
- [ ] `apps/supabase/supabase/functions/send-email/templateVars.ts` + `.test.ts` — covers REVIEW-EDGE-03
- [ ] An `envConfig.ts` + `.test.ts` (one per function, or one duplicated — see Pitfall 2) — covers REVIEW-EDGE-02
- [ ] `scripts/assert-edge-env-defaults.mjs` + its `lint:check` link + a membership assertion — covers REVIEW-EDGE-02's guard half
- [ ] `yarn workspace @openvaa/supabase add -D jose` — makes the criterion-5 test's dependency honest (Pitfall 5)
- [ ] Framework install: **none needed** — vitest is already declared and already running

---

## Security Domain

`.planning/config.json` does not set `security_enforcement`, so it is enabled.

### Applicable ASVS Categories

| ASVS Category | Applies | Standard Control |
|---------------|---------|-----------------|
| V2 Authentication | **yes** | `jose.jwtVerify` against a remote JWKS with `{ audience, issuer }` **always supplied** — criterion 5. The endpoint is served `--no-verify-jwt` and provisions Supabase auth users, so this is the whole trust boundary. |
| V3 Session Management | **yes (adjacent)** | `supabase.auth.admin.generateLink` issues the session; unaffected by this phase except that `SITE_URL` stops silently defaulting (criterion 2 site #3), which is a redirect-target correctness issue. |
| V4 Access Control | **yes** | The `atob`-decoded `user_roles` claim drives `isAdmin` at `invite-candidate:84-90` and `send-email:114-116`. Criterion 1 is an access-control-path correctness fix, not a cosmetic one. |
| V5 Input Validation | **yes** | `{{ var }}` substitution over caller-supplied templates (criterion 3); the placeholder regex must stay anchored (`\w+(?:\.\w+)*`) and must not gain path traversal (D-D4 rejected (b)). |
| V6 Cryptography | **yes — do not hand-roll** | JWE decrypt + JWS verify are entirely `jose`'s. This phase adds no crypto; it only stops omitting jose's own claim bindings. |
| V7 Error Handling & Logging | **yes** | The file's existing bar: log the real error, return a fixed opaque string (`identity-callback:206-213, 226-233, 242-249`). Every new throw must respect it — **do not add the missing variable's name to an HTTP response**, only to the log and to the thrown `Error`. |
| V14 Configuration | **yes — the phase's centre of gravity** | Criterion 2 + the D2a guard. Fail-closed on missing configuration, statically enforced. |

### Known Threat Patterns for Deno Edge Functions + OIDC

| Pattern | STRIDE | Standard Mitigation |
|---------|--------|---------------------|
| Token minted for a different relying party accepted (`aud` unbound) | Spoofing | Always pass `audience`; throw when unconfigured — criterion 5. **Measured accepted today.** |
| Token from an attacker-controlled IdP accepted (`iss` unbound) | Spoofing | Always pass `issuer`; throw when unconfigured — criterion 5. **Measured accepted today.** |
| Verification oracle via echoed error strings | Information Disclosure | Already mitigated at `identity-callback:206-213, 226-233, 242-249` — log, never return. **Preserve this when adding throws.** |
| Silent default routes mail/redirects to the wrong host | Tampering / Spoofing | Criterion 2 sites #3, #4, #7 (`SITE_URL`, `SMTP_HOST`) |
| Silent default seeds records into the wrong tenant | Tampering | Criterion 2 site #2 (`DEFAULT_PROJECT_ID`) — and Phase 161 finishes the job |
| Silent default selects the wrong identity provider | Spoofing | Criterion 2 site #1 (`IDENTITY_PROVIDER_TYPE`) |
| Non-unique identity claim merges two people into one account | Spoofing / Elevation | Already mitigated (`identityMatchProp: 'sub'`, Phase 142.1). Criterion 4 confirms the premise externally. |
| Decode failure on an authorisation path becomes an opaque 500 | Denial of Service (mild) | Criterion 1 |
| Drift between the Edge Function verifier and the frontend core | Tampering | **Filed, not fixed** — `.planning/todos/pending/2026-08-22-edge-function-fourth-idtoken-verifier-copy.md`. Mitigate cheaply by reusing the identical error codes (see criterion 5). |

---

## Sources

### Primary (HIGH confidence — measured in-repo this session)

- `apps/supabase/supabase/functions/{identity-callback,invite-candidate,send-email}/index.ts` — all seven env sites, both `atob` sites, `verifyJwt`, the `replaceVars` regex, the error-handling bar
- `apps/supabase/supabase/functions/identity-callback/{claimConfig.ts,claimConfig.test.ts}` — the extraction pattern and criterion 4's code state
- `apps/supabase/vitest.config.ts`, `apps/supabase/package.json`, root `package.json`, `turbo.json` — the harness
- `turbo run {test:unit,lint,typecheck,build} --dry=json` — which workspaces are actually executed
- `yarn workspace @openvaa/supabase test:unit` — 20 tests, 20 passed
- `apps/frontend/src/lib/api/utils/auth/decryptAndVerifyIdToken.ts:83-113, 151-181` — the reviewed fail-closed shape to mirror
- `scripts/assert-{unit-test-coverage,a11y-scan-wiring}.mjs` — the D2a guard precedent
- `packages/dev-seed/tests/ciTypecheckGate.test.ts:72-86` — the chain-membership assertion precedent
- `git show HEAD:.env.example` — the env-documentation gap (CONTEXT `<open>` item 3, now answered)
- `tests/IDURA-TEST-RUNBOOK.md:79-121, 222-229` — how Edge Function secrets are actually supplied
- `tests/playwright.config.ts:512-533` — `PLAYWRIGHT_BANK_AUTH` opt-in gating
- `tests/tests/utils/supabaseAdminClient.ts:538-600` — `sendEmail` does **not** call the Edge Function
- `apps/supabase/supabase/schema/502-email-helpers.sql:92-96` — the flat dotted-key producer contract
- `apps/supabase/supabase/config.toml` — the port bucket handed to Phase 156
- Executed experiments: `atob` alphabet/padding classes; the 2205-payload latency corpus; the UTF-8 mangling round-trip; the jose accept→reject reproduction; the guard-regex 7/7 · 4/4 validation

### Secondary (MEDIUM confidence — external documentation, retrieved 2026-08-28)

- https://developer.signicat.com/docs/eid-hub/concepts/subject — subject types (Persistent/Transient), the FTN transience statement, the substitution rule, the `Sha256(idp + idpId + organizationId)` hash definition
- https://developer.signicat.com/identity-methods/ftn/attributes-reference — the FTN OIDC claim table, the `ftn_sub` "do not use as a permanent identifier" warning, the `"subject": { "id": …, "idpId": "070770-905D" }` example
- https://developer.signicat.com/identity-methods/ftn/integration-guide/oidc-ftn — the decoded FTN ID-token example showing `sub`, `idp: "ftn"`, `idp_id`, `iss: https://<DOMAIN>/auth/open`, and the Minimal/Standard/All ID-token data setting

> Retrieval note: `WebFetch` returned HTTP 404 for all three URLs; `curl` with a browser user-agent returned 200, and appending `.md` (no trailing slash) yields Signicat's own markdown source, which is what the verbatim quotes above are taken from.

### Tertiary (LOW confidence)

- A general web search summarising Signicat's `sub` guidance ("never changes over time") — superseded by the primary pages above and used only to locate them. Not relied on for any claim.

---

## Metadata

**Confidence breakdown:**

- Standard stack: **HIGH** — nothing new is installed; every tool was executed this session.
- Harness decision (extract-to-module vs. `deno test`): **HIGH** — settled by `deno --version` failing, zero deno config files, and a passing vitest run.
- Criterion 1 mechanics: **HIGH** for the alphabet/padding/latency findings (all reproduced); **MEDIUM** for the Deno-vs-Node `atob` equivalence (A1).
- Criterion 2 sites + guard predicate: **HIGH** — 7/7 grep match, 7/7 predicate match, 4/4 negative controls, ESLint reach measured.
- Criterion 3: **HIGH** — regex and producer contract read verbatim.
- Criterion 4: **MEDIUM-HIGH** — verbatim provider quotes with URLs; MEDIUM only on the product-line tie (A4).
- Criterion 5: **HIGH** — defect reproduced accept→reject; mirror shape located file:line.
- Blast radius / `.env.example`: **HIGH** — the previously-blocked read succeeded via git; call-path analysis by exhaustive grep (A5 is the only residual).
- Phase 152 sequencing: **HIGH** — phase dir, git log, `lint:check` string and grep all agree it has not executed.

**Research date:** 2026-08-28
**Valid until:** 2026-09-27 (30 days). Two things would invalidate it sooner: Phase 152/153/154 executing (which changes `lint:check`'s link list and possibly the comment convention's enforcement), or any commit touching `apps/supabase/supabase/functions/` (which moves the line numbers this document pins).
