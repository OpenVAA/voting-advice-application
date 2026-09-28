---
phase: 158-routing-auth-surface-harmonisation
plan: 07
subsystem: auth
tags: [sveltekit, routing, oidc, redirect, buildRoute, paraglide, qs, typescript, vitest, playwright]

requires:
  - phase: 158-routing-auth-surface-harmonisation
    provides: "`$lib/routes` — the single routes locus and `buildRoute`, moved and proven by the 158-01 tracer"
provides:
  - "All six redirects in `routes/api/oidc/callback/+server.ts` built by `buildRoute` from the `CandAppPreregister` route key, none by string concatenation or interpolation"
  - "`apps/frontend/src/lib/candidate/utils/oidcError.ts` — `OIDC_ERROR`, the `OidcError` union and the one named widening site `upstreamOidcError`"
  - "`oidcError.test.ts` — 14 tests pinning the four operator-facing wire spellings and asserting the value is percent-encoded exactly once, with a discriminating double-encode case"
  - "The recorded criterion-3 scope statement: what the sweep covers, what it excludes site by site, and why"
affects: [158-06, 158-09, 159, any phase touching the OIDC callback or the preregistration query string]

actuals:
  tokens: 3514
  tasks: 2
  commits: 3

tech-stack:
  added: []
  patterns:
    - "Closed string-literal union plus a `Record<Key, Value>` map, so omitting a member is a compile error; the sibling `loginError.ts` shape, never a TypeScript enum"
    - "An externally-supplied value that cannot be enumerated is widened at ONE named function rather than by widening the union to `string`"
    - "A contract test for a URL-emitting rewrite carries a discriminating case that fails on the shape the rewrite removed, so the passing cases cannot hold vacuously"

key-files:
  created:
    - apps/frontend/src/lib/candidate/utils/oidcError.ts
    - apps/frontend/src/lib/candidate/utils/oidcError.test.ts
  modified:
    - apps/frontend/src/routes/api/oidc/callback/+server.ts

key-decisions:
  - "MEASURED: the preregistration page does NOT read the `error` query parameter at all, so the producer-consumer agreement assertion was deliberately SKIPPED rather than invented"
  - "`route.ts` was NOT modified: `CandAppPreregister` already had a `ROUTE` entry, so 158-02's drift guard is untouched by this plan"
  - "The key union backing the `Record` is deliberately NOT exported, so `grep -c 'export type OidcError'` is 1 as the acceptance criterion requires"
  - "The redirect now carries `locals.currentLocale`; for the base locale the emitted string is byte-identical to the literal it replaced, and a locale-prefixed callback URL now returns the visitor to that locale's page instead of the unprefixed one"
  - "The plan's named E2E project `candidate-journey` has ZERO preregistration legs; the OIDC callback is covered by `bank-auth-journey`, which was run instead and passed"

patterns-established:
  - "Prove a zero-result grep with a positive control on the pre-change blob before recording it as a clean pass"
  - "Prove a `Record`-based exhaustiveness claim by deleting a member and observing the typecheck go red, not by reading the type"

requirements-completed: [REVIEW-RT-03]

coverage:
  - id: D1
    description: "Every redirect the OIDC callback endpoint emits, including the anchor the requirement names, is built by the route builder rather than by concatenation or interpolation"
    requirement: REVIEW-RT-03
    verification:
      - kind: other
        ref: "grep -cE \"redirect\\(303, '/|redirect\\(303, \\`/\" apps/frontend/src/routes/api/oidc/callback/+server.ts -> 0 (positive control: 6 on the pre-change blob)"
        status: pass
      - kind: other
        ref: "6 live probes against a fresh dev server; every Location header is the expected preregistration URL"
        status: pass
      - kind: e2e
        ref: "PLAYWRIGHT_BANK_AUTH=1 npx playwright test --project=bank-auth-journey -> 130 passed (10.6m)"
        status: pass
    human_judgment: false
  - id: D2
    description: "The error values the endpoint puts on the query string are a declared union with one declaration site, and omitting a member is a compile error"
    requirement: REVIEW-RT-03
    verification:
      - kind: unit
        ref: "apps/frontend/src/lib/candidate/utils/oidcError.test.ts (14 tests)"
        status: pass
      - kind: other
        ref: "positive control: deleting a member makes `yarn typecheck` report `Property 'missingCode' is missing ... but required in type 'Record<OidcErrorKey, OidcError>'`"
        status: pass
    human_judgment: false
  - id: D3
    description: "No value reaches the query string double-encoded: the hand `encodeURIComponent` is gone and the builder does the single encoding"
    requirement: REVIEW-RT-03
    verification:
      - kind: other
        ref: "grep -c 'encodeURIComponent' apps/frontend/src/routes/api/oidc/callback/+server.ts -> 0"
        status: pass
      - kind: unit
        ref: "oidcError.test.ts 'double encodes a value that was hand encoded first' — the discriminating case"
        status: pass
      - kind: other
        ref: "live probe: raw `access denied/x` returns Location `?error=access%20denied%2Fx`, not `access%2520denied%2Fx`"
        status: pass
    human_judgment: false
  - id: D4
    description: "The voter-app results and constituency navigation is excluded from the sweep, enumerated site by site with its reason, so the exclusion reads as a decision"
    requirement: REVIEW-RT-03
    verification:
      - kind: other
        ref: "the Scope statement section below, with re-measured anchors for all five excluded sites"
        status: pass
    human_judgment: false
  - id: D5
    description: "The rewrite does not perturb the rest of the application"
    verification:
      - kind: e2e
        ref: "yarn test:e2e full default suite -> 150 passed (10.5m)"
        status: pass
      - kind: unit
        ref: "yarn workspace @openvaa/frontend test:unit -> 75 files / 1392 tests passed"
        status: pass
      - kind: other
        ref: "yarn typecheck (svelte-check 0 errors 0 warnings) and yarn lint:check both exit 0"
        status: pass
    human_judgment: false

duration: 105min
completed: 2026-09-02
status: complete
---

# Phase 158 Plan 07: OIDC Callback Redirect Sweep Summary

**All six OIDC callback redirects now built from the `CandAppPreregister` route key with the hand encoding removed, their error values declared once behind a compile-checked union, and the sweep's boundary written down as a decision — proven by 14 new unit tests, six live redirect probes, a 150-passed default suite and a 130-passed run that includes the bank-auth journey.**

## Performance

- **Duration:** ~105 min (two full E2E runs at 10.5m and 10.6m, two database resets and the bank-auth environment build dominate)
- **Started:** 2026-09-02T00:15Z
- **Completed:** 2026-09-02T02:00Z
- **Tasks:** 2
- **Files modified:** 3 (2 created, 1 modified)

## The measurement the plan asked for first: does the consuming page switch on error values?

**No. It does not read the `error` query parameter at all.**

`apps/frontend/src/routes/candidate/preregister/+page.svelte` is 167 lines. It reads no search
parameter of any kind: there is no `page.url` reference, no `$app/state` import and no `error`
identifier anywhere in the file. Its two rendered branches switch on `candCtx.idTokenClaims`
(`:121`), not on a query value.

The census that establishes this is exhaustive rather than local. Across the whole tree there is
exactly ONE reader of an `error` search parameter, and it is the producer itself:

```
git grep -n "searchParams.get('error')" -- apps packages tests
apps/frontend/src/routes/api/oidc/callback/+server.ts:25:  const errorParam = url.searchParams.get('error');
```

Positive control for that zero result: the same grep relaxed to `searchParams.get(` returns 19
files, so the pattern is capable of matching. The nearest thing to a consumer is a DIFFERENT
page on a DIFFERENT route — `candidate/preregister/status/+page.svelte:16` reads `code`, not
`error`, and maps it through `preregistrationError.ts`. That page is reached from the Edge
Function leg, not from this endpoint's redirect.

**Consequence, and the plan's own instruction:** the producer-consumer agreement assertion was
**deliberately skipped**, per the plan's "record that and skip the assertion rather than
inventing coupling that does not exist". There is no consumer set to agree with.

**This also means the five error values are currently INERT on the page.** The endpoint puts
them on the URL, the operator runbook tells a human to read them out of the address bar
(`tests/IDURA-TEST-RUNBOOK.md:166-172`), and the page renders nothing different for any of them.
That is a pre-existing product gap, not something this plan introduced, and it is out of scope
here — but it is the reason the union is pinned by a test against the RUNBOOK's spellings rather
than against a consumer's switch. See "Deferred / filed" below.

## Scope statement — the recorded criterion-3 boundary

This is a deliverable of the plan, not housekeeping. **It is a recorded exclusion, not an
oversight.**

### What the sweep covers

Every `redirect()` inside the request hook, the generic API routes and the candidate routes
builds its target with `buildRoute`. Measured now, across `apps/frontend/src`:

| File | Redirects | State |
|---|---:|---|
| `hooks.server.ts` | 2 | ✅ `buildRoute` (landed by the 158-01 tracer) |
| `routes/api/oidc/callback/+server.ts` | 6 | ✅ `buildRoute` — **this plan** |
| `routes/(voters)/constituencies/+page.ts` | 1 | ✅ already `buildRoute` before the phase |
| `routes/(voters)/elections/+page.ts` | 1 | ✅ already `buildRoute` before the phase |
| `routes/candidate/preregister/+layout.server.ts` | 1 | ✅ already `buildRoute` before the phase |
| `routes/candidate/auth/callback/+server.ts` | 5 | ⏳ Tier 1, **owned by 158-06**, not this plan |
| `routes/admin/login/+page.server.ts` | 1 | ⏳ Tier 2 `redirectTo` branch, still hand-built |
| `routes/candidate/login/+page.server.ts` | 1 | ⏳ Tier 2 `redirectTo` branch, still hand-built |

The two Tier 2 rows were re-measured after 158-05 collapsed both login entry points onto
`lib/auth/passwordLogin.ts`: the shared helper landed, but the `redirectTo ? \`/${locale}/${redirectTo}\` : home`
branch survives in both files. They are named here so the phase's own accounting stays honest;
they are not this plan's to rewrite.

### What the sweep EXCLUDES, enumerated, with the reason

The voter-app results and constituency navigation is excluded. Five sites, re-measured at this
plan's HEAD:

| # | Site (re-measured) | Shape | Reason for exclusion |
|---|---|---|---|
| 1 | `routes/(voters)/(located)/results/[[electionTab]]/+layout.ts:45` | `redirect(307, \`/results${url.search}\`)` | Governed by the earlier phase's 4-segment optional route contract that `$lib/routes/route.ts:63-72` documents. |
| 2 | `routes/(voters)/(located)/results/[[electionTab]]/+layout.ts:52` | `redirect(307, \`/results/${available[0]}${url.search}\`)` | Same contract; the loader's own docblock at `:13` states it deliberately does NOT force-fill `entityTab`. |
| 3 | `routes/(voters)/(located)/results/[[electionTab]]/[[entityTab=etPl]]/[[entity=etSg]]/[[id]]/+page.ts:36` | `redirect(307, \`/results${electionSegment}${listSuffix}${url.search}\`)` | The leaf coupling-guard half of the same navigation-loop fix. |
| 4 | `routes/(voters)/(located)/results/[[electionTab]]/+layout.svelte:212` — the `buildListRoute` helper, consumed by five `goto` calls at `:222`, `:229`, `:234`, `:239`, `:247` | `` `/results${electionSegment}${pluralSegment}${page.url.search}` `` | **The load-bearing absence is recorded in the source.** `:214` reads: "No `/candidates` force-fill when plural is absent: the URL `/results/{electionTab}` is itself a valid render shape". `+layout.ts:13` and `voterContext.type.ts:45` explain that force-filling the segment BOUNCES navigation because downstream consumers re-emit same-shape URLs. Routing this through `buildRoute` risks reintroducing that loop. |
| 5 | `routes/(voters)/constituencies/+page.svelte:104` | `` goto(`${target.pathname}${merged ? `?${merged}` : ''}`) `` | Not a route construction. `target` is a `URL` already validated against the voter-app allowlist at `:90-99`; this is deliberate pass-through of a validated destination. |

**Why:** each site's exact URL shape is governed by an earlier phase's route contract and by a
documented navigation-loop fix whose in-source comment records the exact ABSENCE of a forced
segment as load-bearing. Rewriting them is a separate change with its own regression surface, and
REVIEW-RT-03 names none of them.

**One site the research listed as Tier 3 turns out to need no exclusion.**
`routes/(voters)/(located)/questions/+layout.svelte` — the research said "`url` is produced
upstream; check the producer, not this line". Measured now, the producer is at `:204` and `:208`
and BOTH branches are `getRoute.current({ route: 'QuestionCategory' | 'Question', ... })`, i.e.
the route builder. The `goto(url, { noScroll })` at `:213` is therefore already clean and is not
carried as an exclusion.

**No standing grep guard was added**, as the plan directs. It would fail on the five exclusions
above and would need a suppression list that is worse than this prose.

## Confirmation: no value is double-encoded

`grep -c 'encodeURIComponent' apps/frontend/src/routes/api/oidc/callback/+server.ts` is **0**.
The single surviving encoding is the builder's own, and it is asserted from three directions:

1. **Unit, discriminating.** `oidcError.test.ts` feeds the builder a value that was hand-encoded
   first — exactly what the endpoint used to do — and asserts the round trip yields
   `access%20denied` rather than `access denied`. Without this case the passing cases could hold
   on a builder that never encoded anything.
2. **Live probe.** Against a fresh dev server, a raw provider value `access denied/x` returns
   `Location: /candidate/preregister?error=access%20denied%2Fx`. Encoded once. The double-encoded
   form would have been `access%2520denied%2Fx`.
3. **Behaviour preservation.** For this input the OLD code emitted the same string, because it
   hand-encoded and never passed through `qs`. So the rewrite is byte-neutral on the wire for the
   pass-through case — the defect this guards is the one that would have appeared had the hand
   encoding been LEFT IN alongside the builder.

## Accomplishments

- **Six hand-built redirect strings became six route-builder calls** in the file the tracer did
  not reach, including the redirect REVIEW-RT-03 names as its anchor. Every target is now a
  `ROUTE` map key, so an attacker-influenced value can only ever land in a query parameter.
- **The error values have one declaration site**, with a `Record` over a key union that makes
  omitting a member a compile error. Proven by deleting a member and watching the typecheck go
  red, twice.
- **The upstream pass-through is represented explicitly** by one named function rather than by
  widening the union to `string`, so the widening is visible at the single call site that needs
  it.
- **The consumer question was measured, not assumed**, and the answer (no consumer) is why the
  agreement assertion was skipped rather than invented.
- **The sweep's boundary is written down** with five enumerated exclusions, re-measured anchors,
  and a sixth site demoted from the exclusion list because it turned out to be already clean.
- **Both E2E gates green**, including the only project that actually walks the endpoint.

## Task Commits

1. **Task 1 RED: pin the error values and their single encoding** — `a6c4d6eb7` (test)
2. **Task 1 GREEN: declare the union in one place** — `bb797c187` (feat)
3. **Task 2: all six redirects through the route builder** — `4a1400a33` (refactor)

No REFACTOR commit: the GREEN module needed no cleanup pass.

## Files Created/Modified

- `apps/frontend/src/lib/candidate/utils/oidcError.ts` — **created.** `upstreamOidcError` (the
  single named widening site), `OIDC_ERROR` (the `Record`-typed map), `OidcError` (the closed
  wire-value union) and `UpstreamOidcError`. The backing key union is intentionally private.
- `apps/frontend/src/lib/candidate/utils/oidcError.test.ts` — **created.** 14 tests.
- `apps/frontend/src/routes/api/oidc/callback/+server.ts` — **modified.** Six redirects, the
  `locals` destructure, the removed `encodeURIComponent`, and one stale comment corrected.
- `apps/frontend/src/lib/routes/route.ts` — **NOT modified.** See the decision below.

## Decisions Made

### `route.ts` needed no new entry, so 158-02's guard is untouched

The plan said to add a `ROUTE` entry for the preregistration route "if it does not have one".
Measured: `CandAppPreregister: \`${CANDIDATE}/preregister\`` already exists at
`$lib/routes/route.ts:85`. **No edit was made**, so `git status --short apps/frontend/src/lib/routes/`
is empty and 158-02's `routeConsistency.test.ts` drift guard — including its
`KNOWN_UNBUILT_PROTECTED_ROUTES` rows for `AdminAppFactorAnalysis` and `AdminAppJob` — is
untouched by this plan. That guard runs in the unit suite and passed.

### The key union is private, so the acceptance grep is literally 1

The criterion is `grep -c 'export type OidcError'` equals 1. That pattern is a SUBSTRING match, so
any second exported type whose name begins `OidcError` also matches it. The first draft exported
`OidcErrorName` and the grep returned 2; renaming it to `OidcErrorKey` still returned 2, for the
same reason. The resolution is that the key union does not need exporting at all — call sites
reach the values through `OIDC_ERROR`, never through the key type — so it is declared without
`export`. The grep is now 1, `export const OIDC_ERROR` is 1 and `enum ` is 0, and the
exhaustiveness property is unaffected (re-proven by the positive control after the change).

This is the same instrument-trap family the phase has already been bitten by twice. Recorded so
the next plan writing a `grep -c 'export type X'` criterion knows the pattern is a prefix, not a
symbol.

### The redirect now carries the request locale; the base locale is byte-identical

The old code emitted a bare `/candidate/preregister` regardless of locale. `buildRoute` hands its
result to Paraglide's `localizeHref`, which prefixes non-base locales and omits the prefix for the
base one (`en`). Measured live on the running server:

| Request | Location emitted |
|---|---|
| `GET /api/oidc/callback` | `/candidate/preregister?error=missing_code` |
| `GET /fi/api/oidc/callback` | `/fi/candidate/preregister?error=missing_code` |
| `GET /sv/api/oidc/callback?error=access_denied` | `/sv/candidate/preregister?error=access_denied` |

**Two facts matter here and neither was obvious.**

First, `locals.currentLocale` is genuinely wired for `/api/*` routes — the `paraglideHandle`
runs before the API-skipping `candidateAuthHandle`, so the API route does see it. The prefixed
probes are the proof; an unwired value would have produced the unprefixed URL in all three rows.

Second, a `PARAGLIDE_LOCALE=fi` cookie on an UNPREFIXED callback URL does **not** produce a
prefix. The `url` strategy is first in `strategy: ['url', 'cookie', 'baseLocale']`, and an
unprefixed URL resolves to the base locale there, so the cookie is never consulted. The locale
therefore travels via the callback URL itself, which is correct: the preregistration page builds
its `redirect_uri` through `getRoute.current(...)`, so a Finnish visitor's IdP round trip returns
to `/fi/api/oidc/callback` and is now returned to `/fi/candidate/preregister` instead of being
dropped onto the English-canonical URL.

**For the base locale the emitted string is byte-identical to the literal it replaced**, which is
why both English E2E suites are unaffected. The non-base improvement is a real behaviour change
and is recorded here as one rather than discovered later.

### The plan's named E2E project has no preregistration legs

Acceptance criterion 6 reads "`yarn test:e2e --project=candidate-journey` passes its
preregistration legs". Measured: `grep -ci preregister tests/tests/specs/candidate/candidate-journey.spec.ts`
returns **0**. That project is the password-based candidate journey; it never touches the OIDC
callback. The criterion cannot be met as written because the legs it names do not exist.

The project that DOES walk this endpoint is `bank-auth-journey`, gated behind
`PLAYWRIGHT_BANK_AUTH=1` and excluded from the default suite. Its spec docblock states the
`preregister-continue` control "appears ONLY when idTokenClaims is populated post-callback", so
its visibility is exactly a proof that the rewritten success redirect landed. **It was run and it
passed**, alongside `candidate-journey`, which the same run also executed as part of the chain.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 3 — Blocking] The acceptance grep for the exported type could not return 1 as drafted**
- **Found during:** Task 1, at the acceptance-grep gate
- **Issue:** `grep -c 'export type OidcError'` returned 2, because the second exported type
  `OidcErrorName` shares the prefix and the pattern is a substring match
- **Fix:** the key union does not need exporting; it is now declared without `export`. Renaming
  alone did not help and is recorded above as a dead end
- **Files modified:** `apps/frontend/src/lib/candidate/utils/oidcError.ts`
- **Verification:** the three acceptance greps return 1, 1 and 0; the exhaustiveness positive
  control re-run after the change still goes red
- **Committed in:** `bb797c187`

**2. [Rule 1 — Bug] A comment in the callback endpoint would have been left lying**
- **Found during:** Task 2
- **Issue:** the leak-safety comment above the `invalid_token` branch ended "The redirect below is
  unchanged." — true when written, false after the rewrite
- **Fix:** reworded to state that the redirect still carries only the opaque failure class and
  that only the URL assembly changed, preserving the comment's actual point
- **Files modified:** `apps/frontend/src/routes/api/oidc/callback/+server.ts`
- **Committed in:** `4a1400a33`

### Substitution, not an auto-fix

**3. The E2E project named by acceptance criterion 6 was substituted, with the measurement**
- The plan names `candidate-journey`; that project has zero preregistration coverage (measured
  above). `bank-auth-journey` was run instead — the only project that walks the callback — and it
  transitively runs `candidate-journey` and the whole perm chain anyway. Both the default suite
  and the bank-auth run are recorded below.

---

**Total deviations:** 2 auto-fixed (1 blocking, 1 bug) plus 1 recorded substitution. **Impact on
scope:** none. No behaviour was added or removed beyond what the plan specifies; the one
behaviour change that did occur (the non-base locale prefix) is recorded above as a decision.

## Verification Evidence

| Gate | Command | Result |
|---|---|---|
| 1 | `yarn typecheck` | exit 0, svelte-check 0 errors 0 warnings |
| 2 | `yarn lint:check` | exit 0 (2 pre-existing warnings, 0 errors) |
| 3 | `yarn prettier --check` on all three files | clean |
| 4 | `yarn workspace @openvaa/frontend test:unit` | 75 files / **1392 tests passed** (1290 + the 12 tracer redirect tests + 14 new, plus 158-02's guard) |
| 5 | `yarn test:e2e` default suite | **150 passed (10.5m)** — same count as the tracer's baseline |
| 6 | `PLAYWRIGHT_BANK_AUTH=1 npx playwright test --project=bank-auth-journey` | **130 passed (10.6m)**, 0 skipped, 0 did-not-run |
| 7 | acceptance greps | hand-built literals 0, `buildRoute` 7, `encodeURIComponent` 0, `export type OidcError` 1, `export const OIDC_ERROR` 1, `enum ` 0 |
| 8 | live redirect probes | 6 of 6 as expected, see below |
| 9 | `.agents/code-review-checklist.md` walked | see below |

Both E2E runs were on a dev server restarted after the code change and on a `yarn db:reset`
database whose storage buckets were confirmed present (`public-assets`, `private-assets`) before
the run, per the recorded storage-wedge gotcha.

### The six live probes

Fresh dev server on `:5173`, restarted after the edit so no stale SSR module could be served:

```
GET /api/oidc/callback?error=access_denied        -> 303 /candidate/preregister?error=access_denied
GET /api/oidc/callback?error=access%20denied%2Fx  -> 303 /candidate/preregister?error=access%20denied%2Fx
GET /api/oidc/callback                            -> 303 /candidate/preregister?error=missing_code
GET /api/oidc/callback?code=xyz&state=bbb
    (cookie oidc_state=aaa)                       -> 303 /candidate/preregister?error=invalid_state
GET /api/oidc/callback?code=xyz&state=aaa
    (cookie oidc_state=aaa)                       -> 303 /candidate/preregister?error=token_exchange_failed
GET /fi/api/oidc/callback                         -> 303 /fi/candidate/preregister?error=missing_code
```

The sixth redirect — the success path that carries no error value — is not reachable by probe
(it requires a valid id_token) and is covered by `bank-auth-journey` instead.

The `invalid_token` branch is the one redirect exercised by neither the probes nor an E2E leg. It
is identical in shape to the four proven above and differs only in which `OIDC_ERROR` member it
passes, which the unit suite covers for all four members.

### Positive controls run before recording any zero

Per the phase's standing instrument-trap discipline:

| Zero recorded | Positive control | Control result |
|---|---|---|
| `grep -cE "redirect\(303, '/\|redirect\(303, \`/"` is 0 | same grep against the pre-change blob (`git show HEAD:…`) | **6** — the pattern fires |
| no reader of the `error` search param outside the producer | same grep relaxed to `searchParams.get(` | **19 files** — the pattern fires |
| omitting a `Record` member is a compile error | deleted `missingCode`, then `invalidState`, re-ran `yarn typecheck` | **red both times**, naming the missing property |

### Re-measured anchors that differ from the planning documents

`158-RESEARCH.md` § F.1 places the six callback redirects at `:30, :35, :47, :86, :105, :112`.
**Measured at this plan's HEAD they are at `:29, :34, :44, :75, :94, :101`** — a drift of −1 to
−11. § F.2's `buildListRoute` anchors (`:270-288`, gotos at `:290, 297, 302, 307, 318`) and the
constituencies goto (`:149`) have likewise drifted; the exclusion table above carries the
re-measured values. The counts in both sections are correct; only the line numbers moved. Every
edit in this plan was located by expression, so the drift was a non-event.

### Code review checklist walk

- **Solves the issue:** yes — six sites, the named anchor among them.
- **OWASP:** the change strictly narrows the injection surface. The redirect PATH is now a `ROUTE`
  map key and can no longer be influenced by any request value; an attacker-supplied value can
  only reach a query parameter, and it is encoded by `qs`. This is stronger than the concatenation
  it replaces (A03 injection, A01 broken access control by way of open redirect).
- **No `any`:** none added.
- **No repetition:** the six call sites share one route key and one map; the values are declared
  once.
- **Documentation:** every exported symbol carries a docblock with `@param`/`@returns`; the test
  module carries a docblock explaining the discriminating case and the Paraglide harness boundary.
- **Error handling:** unchanged. The `try`/`catch` structure, the re-throw of SvelteKit redirects
  and the opaque-failure-class logging are all preserved exactly.
- **Shared dependencies not in the PR:** `buildRoute` is shared; both E2E suites and the full unit
  suite were run to confirm nothing else moved.
- **Accessibility / keyboard / screen reader:** not applicable — no UI surface changed.
- **Repo docs:** `tests/IDURA-TEST-RUNBOOK.md:166-172` documents these query values and its text
  remains accurate, because the wire spellings are unchanged (and are now pinned by a test).
- **Commit history:** three conventional commits, linear, one per TDD gate plus one per task.

## Threat Model Disposition

| Threat | Disposition |
|---|---|
| T-158-36 Tampering — upstream error value reflected into a redirect URL | **mitigated** — the value is on the query side, encoded by the builder; the path is fixed by the route map. The hand encoding is REMOVED rather than layered, proven by the discriminating unit case and the live probe. |
| T-158-37 Spoofing — redirect target becomes attacker-influenced | **mitigated** — every target is a `ROUTE` key; `grep` for hand-built literals returns 0 with a positive control at 6. |
| T-158-38 Information Disclosure — the union silently widens to any string | **mitigated** — the closed union stays closed; the widening is one named function at one call site. The consumer's handled set was measured (empty) and recorded rather than assumed. |
| T-158-39 Repudiation — the sweep's boundary is invisible | **mitigated** — the scope statement above enumerates five excluded sites with re-measured anchors and reasons, plus one demoted from the list. |
| T-158-SC package installs | **not applicable** — this plan installed nothing. |

## Threat Flags

None. No new network endpoint, auth path, file access pattern or schema change was introduced.
The one trust-boundary behaviour that changed — how the provider-supplied value is encoded —
narrows the surface rather than widening it.

## Known Stubs

None.

## Deferred / filed

**The five error values are inert on the page they are sent to.** The endpoint puts
`missing_code`, `invalid_state`, `invalid_token`, `token_exchange_failed` or a provider value on
`/candidate/preregister`'s query string, the bank-auth runbook instructs an operator to read them
from the address bar, and the page renders nothing different for any of them. This is
**pre-existing** — the old hand-built redirects did the same — and it is out of REVIEW-RT-03's
scope, which is about how the URL is BUILT, not about what the page does with it. It is recorded
here rather than fixed because wiring it means adding user-facing copy in seven locales, which is
a product decision and not a routing one.

The union this plan lands is exactly the artifact a future fix would consume: a consumer would
map `OidcError` to translation keys the way `loginError.ts` already does, and the `Record` typing
would make an unhandled member a compile error at that point.

## Issues Encountered

- The plan's acceptance grep for the exported type is a substring pattern, so it counted a second
  exported type sharing the prefix. Resolved by not exporting the key union; recorded as a
  decision above because the trap will recur.
- `candidate-journey` has no preregistration legs, so criterion 6 as written is unmeetable.
  Substituted with the project that actually walks the endpoint.
- Running `bank-auth-journey` requires the IdP env in the SvelteKit server's OWN process, a static
  test JWKS server on `:8777`, and the `identity-callback` Edge Function served standalone. All
  three were built from `tests/tests/utils/testKeys.ts` per the runbook, and all three plus the
  scratch env files were torn down afterwards so the TLS bypass could not leak into a later run.
- The Edge Function env for the JOURNEY needs `iss`/`aud` matching the MOCK ISSUER
  (`https://127.0.0.1:9443` / `test-client-id`), not `DEFAULT_TOKEN_OPTS`
  (`https://test-idp.example.com`), which is what the runbook's Step E-1 recipe writes for the
  SYNTHETIC `bank-auth` project. The runbook says to "reuse" that recipe; taken literally it
  produces an Edge Function that rejects the journey's token. Worth a runbook note.

## Next Phase Readiness

- `OIDC_ERROR` / `OidcError` are importable from `$candidate/utils/oidcError` and are the
  declaration site any later consumer should bind to.
- **158-06 owns the remaining Tier 1 file**, `routes/candidate/auth/callback/+server.ts` (5
  redirects), which it also relocates under `/api`. This plan deliberately did not touch it.
- The two Tier 2 `redirectTo` branches in `admin/login/+page.server.ts` and
  `candidate/login/+page.server.ts` are still hand-built after 158-05; the tracer's round-trip
  test is the standing proof that a `buildRoute` rewrite there is safe, whenever a plan claims
  them.
- The five recorded exclusions are the input to any future voter-app results routing change; they
  are enumerated above with re-measured anchors so a later phase does not have to re-derive them.

## Self-Check: PASSED

All three claimed files exist on disk; all three claimed commit hashes resolve in `git log`.

---
*Phase: 158-routing-auth-surface-harmonisation*
*Completed: 2026-09-02*
