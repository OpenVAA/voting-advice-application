---
phase: 158-routing-auth-surface-harmonisation
plan: 06
subsystem: auth
tags: [sveltekit, supabase, gotrue, routing, paraglide, redirect-allowlist, eslint-guard]

requires:
  - phase: 158-01
    provides: the route module at `$lib/routes`, which this plan's redirects are built through
  - phase: 158-02
    provides: the route-consistency lock binding `route.ts`, the route tree and the request hook
  - phase: 158-03
    provides: the single cookie declaration site at `$lib/cookies`
  - phase: 158-07
    provides: the OIDC callback redirects already routed through the route builder
provides:
  - the candidate auth callback and logout endpoints relocated under the generic `/api` prefix
  - two new `ROUTE` keys addressing them
  - the callback's five redirects rebuilt through the route builder
  - a measured answer on GoTrue redirect-allowlist pattern support
affects: [admin app auth reuse, deployment configuration, e2e auth fixtures]

actuals:
  tokens: 12127
  tasks: 3
  commits: 6

tech-stack:
  added: []
  patterns:
    - "An in-app path with no route key is localized through localizeAppPath, which wraps the same localizeHref call buildRoute finishes with, so the app has one way of writing a localized URL"
    - "A caller-supplied redirect target on an auth path is validated by safeRedirectTarget before it is redirected to"
    - "A redirect-allowlist claim is measured against the running auth service with a zero-side-effect /auth/v1/verify probe, and the probe is instrument-validated in both directions before its result is believed"

key-files:
  created:
    - apps/frontend/src/routes/api/candidate/auth/callback/+server.ts
    - apps/frontend/src/routes/api/candidate/auth/logout/+server.ts
  modified:
    - apps/frontend/src/lib/routes/route.ts
    - apps/frontend/src/lib/routes/buildRoute.ts
    - apps/frontend/src/lib/api/adapters/supabase/dataWriter/supabaseDataWriter.ts
    - apps/frontend/src/lib/api/adapters/supabase/dataWriter/supabaseDataWriter.test.ts
    - apps/frontend/eslint.config.mjs
    - apps/supabase/supabase/config.toml
    - tests/tests/fixtures/shared/emailBucket.fixture.ts
    - tests/tests/utils/supabaseAdminClient.ts

key-decisions:
  - "The auth callback and logout endpoints live at /api/candidate/auth/*, moved by git mv with no shims, per operator answer (c)"
  - "T-158-30 AMENDED on measured evidence: a single-segment mid-path wildcard is admitted in the redirect allowlist; trailing, prefix, bare ** and host wildcards remain forbidden and were never tried"
  - "The redirect allowlist is NOT the exact-URL list its own comment claims: the auth service short-circuits on hostname equality with site_url, ignoring scheme, port and path, before consulting the list"
  - "The plan's locale premise was false and the move does not change locale derivation; the real locale defect was an unprefixed redirectTo in the writer, now fixed"
  - "T-158-32's stated mechanism is backwards: the adapter allowlist is an exemption list, so a stale entry fails CLOSED and loudly"
  - "The PKCE code the verify endpoint hands the callback is never exchanged; recorded as a pre-existing defect rather than repaired, because the code_verifier lives in browser storage"

patterns-established:
  - "A file move that also rewrites the file is landed as two commits, so the rename records at full similarity and the rewrite reads on its own"
  - "A guard re-proof after a move is a discriminating pair: the ban observed firing at the new location on a planted violation, and the exemption observed holding for the named files"

requirements-completed: [REVIEW-RT-03, REVIEW-RT-05]

duration: 45min
completed: 2026-09-02
status: complete
---

# Phase 158 Plan 06: Move the candidate auth endpoints under the API prefix — Summary

**The candidate auth callback and logout endpoints now answer at `/api/candidate/auth/*`, every callback redirect is built from a route key carrying the request locale, and the redirect allowlist that governs them was measured rather than assumed — the measurement showed the plan's description of it was wrong in three ways.**

The operator's three checkpoint answers are recorded below verbatim, written BEFORE any file
moves, which is Task 1's acceptance criterion.

---

## Task 1 — the blocking-human gate, and its record

### Acceptance state at the moment of recording

```
$ git status --porcelain apps/frontend/src/routes/candidate/auth
(no output)
```

Neither endpoint had moved when the answers below were written down. The prior executor
stopped at this gate having made no file changes and no commits; this continuation agent
re-verified the clean state before writing anything.

### Operator answer (a) — the production redirect allowlist

> **(a) Production allowlist — CONFIRMED, TWO ENTRIES.** The operator commits to updating the production dashboard allowlist before the moved code deploys, with BOTH the `/en/`-prefixed and the unprefixed form of the new `/api/candidate/auth/callback` path. Locally, `apps/supabase/supabase/config.toml` gets the corresponding two entries. This covers the pre-existing in-app forgot-password mismatch (`supabaseDataWriter.ts:87` sends an unprefixed `redirectTo` from a `localhost` origin, matching neither today's single `/en/`-prefixed entry nor `site_url` exactly).
>
> **Operator also requires:** file a TODO in `.planning/todos/pending/` recording that the production redirect-allowlist update must be mentioned in the deployment guide. Give it a dated filename in the existing convention and state the exact URLs that must be added.

### Operator answer (b) — locale handling

> **(b) Locale handling — SETTLE BY MEASUREMENT, in this preference order.** The operator's stated preference is the wildcard, falling back to b3. Neither is verified against the real GoTrue matcher and the phase research never covered redirect-URL pattern support, so **add a measurement task before you choose**, and adopt the FIRST option that measurably works:
>
> 1. **Scoped wildcard (operator's first preference).** A SINGLE-SEGMENT, MID-PATH glob only: `http://127.0.0.1:5173/*/api/candidate/auth/callback`. This pins the host AND the entire path suffix, varying only the locale segment, so it is NOT the open redirect T-158-30 guards against — that threat describes broadening "to a wildcard **or prefix**", i.e. a trailing/prefix glob like `/**`. If this form is honoured by GoTrue, the writer emits a locale-prefixed `redirectTo` (`${origin}/${locale}/api/candidate/auth/callback`) and the allowlist needs ONE pattern entry instead of seven exact ones.
>    **HARD LIMIT — do not exceed it under any circumstances:** a trailing wildcard, a prefix wildcard, a bare `/**`, a host wildcard, or any pattern that does not pin both the host and the complete path suffix is FORBIDDEN. If the only pattern GoTrue accepts is broader than the single-segment mid-path form, that counts as "does not work" — fall through to option 2. Do not negotiate this boundary downward.
> 2. **b3 — query parameter.** Writer emits `${origin}/api/candidate/auth/callback?lang=fi`; handler prefers `lang` over `locals.currentLocale`. Measure specifically: (i) whether GoTrue's exact-URL matcher accepts a `redirect_to` that already carries a query string, and (ii) whether it PRESERVES that param alongside its own `token_hash`/`type`. Both must hold.
> 3. **b1 — accept and document.** Leave `redirectTo` unprefixed; record the pre-existing locale loss in the handler docblock and as a separate `WINDOWS.md` defect. Zero new behaviour.
>
>    Record in the SUMMARY, under a heading naming **T-158-30**: which option you measured, exactly what you observed (the pattern tried, the request, the response/outcome), which option you adopted and why the others were rejected. If you adopt option 1, state explicitly that T-158-30's disposition is AMENDED — the prohibition on broad/prefix wildcards stands unchanged, and only the single-segment mid-path form is admitted, on measured evidence. If option 1 fails, T-158-30 stands entirely as written.

### Operator answer (c) — sequencing

> **(c) Sequencing — FULL MOVE.** `git mv`; the old paths cease to exist. The two `eslint.config.mjs` allowlist entries are REPOINTED, not duplicated (the file's own docblock calls that list "a live, shrinking target"). No shims.

### Consequence for Task 2's action

Answer (c) selects the full move, so Task 2's action needs **no amendment** — the plan's
`<action>` already specifies `git mv` with the shim path as the conditional branch, and
that branch is not taken. Nothing is re-written; the conditional simply resolves to the
default.

### The deployment-guide TODO required by answer (a)

Filed at `.planning/todos/pending/2026-09-02-deployment-guide-production-redirect-allowlist.md`.
It names the two exact path forms that must be added to the production dashboard list, the
old entry to remove, and the reason the step cannot be caught by any test.

---

## The plan's locale premise did not survive re-measurement

The plan's Task 1 `<how-to-verify>` (b) asserts:

> The current callback path is a locale-prefixed page route and the handler derives its
> language from that prefix. The generic API prefix is not locale-prefixed, so after the
> move the handler falls back to the request-context locale and then to the default.

**That premise is false, and this is settled by three independent readings of the tree:**

1. **The route tree carries no locale segment at all.** `CLAUDE.md` § Frontend states it
   outright: locale is resolved by Paraglide's `url` strategy configured in
   `apps/frontend/vite.config.ts` (`strategy: ['url', 'cookie', 'baseLocale']`), not by a
   route param. `apps/frontend/src/routes/candidate/auth/callback/` is not a
   locale-prefixed route; it is an unprefixed route that Paraglide serves under a locale
   prefix.
2. **The handler never read a prefix.** `+server.ts:23` is
   `const lang = locals.currentLocale ?? 'en';` — it reads the request-context locale that
   `paraglideHandle` set, exactly as it would after the move.
3. **Paraglide's locale extraction is agnostic to everything after the first segment.**
   `reroute` in `apps/frontend/src/hooks.ts` is `deLocalizeUrl(request.url).pathname`, and
   the runtime's URL pattern matches the locale as the FIRST path segment only. `/api/…`
   is not special to it. In `sequence(supabaseHandle, paraglideHandle, candidateAuthHandle)`
   only `candidateAuthHandle` early-returns on the `/api` prefix; `paraglideHandle` runs for
   every request and sets `locals.currentLocale` unconditionally.

**The move therefore does not change locale derivation.** A request to
`/fi/api/candidate/auth/callback` yields `locals.currentLocale === 'fi'` after the move
exactly as `/fi/candidate/auth/callback` did before it.

**The real locale defect is pre-existing and independent of this move.**
`supabaseDataWriter.ts:87` sends an UNPREFIXED `redirectTo`
(`${window.location.origin}/candidate/auth/callback`), so a `fi` user's recovery mail
already carries a base-locale URL today. Both E2E helpers hard-code `/en/`, so the suite
cannot see it. That is what answer (b) is actually deciding, and it is a fix rather than a
regression guard.

---

## Consumer census, re-measured before any change

Command (`git grep`, not plain `grep` — instrument trap 2 from the phase record: a plain
`grep -rn` over `apps packages tests` can match the gitignored
`apps/frontend/tsconfig.tsbuildinfo` and report a false hit):

```
$ git grep -n "candidate/auth/callback\|candidate/auth/logout" -- apps packages tests | wc -l
16
```

**16 lines across 7 files:**

| File | Lines | What |
|------|-------|------|
| `apps/frontend/eslint.config.mjs` | 42, 44 | Both moved files, in `ADAPTER_BOUNDARY_ALLOWLIST` (T-158-32 is live) |
| `apps/frontend/src/lib/api/adapters/supabase/dataWriter/supabaseDataWriter.ts` | 68, 70, 87 | Logout fetch target + its reason comment, and the forgot-password `redirectTo` |
| `apps/frontend/src/lib/api/adapters/supabase/dataWriter/supabaseDataWriter.test.ts` | 163, 169, 175, 178, 183, 194 | **4 assertion lines + 2 non-assertion lines** (a test title and a comment) |
| `apps/supabase/supabase/config.toml` | 169 | `additional_redirect_urls` |
| `tests/tests/fixtures/shared/emailBucket.fixture.ts` | 195, 198 | Default callback path (+ its `@param` doc line) |
| `tests/tests/utils/supabaseAdminClient.ts` | 520, 558 | Invite and recovery `redirectTo` |

**Two figures differ from the plan and the plan is wrong on both:**

- The plan's Task 3 `<read_first>` says "the six assertion lines naming the old paths" in
  the writer's unit spec. There are six LINES but only **four assertions** — line 163 is a
  test title and line 175 is an explanatory comment. Repointing four assertions and two
  prose lines is not the same job as repointing six assertions, and the difference matters
  because a title and a comment can go stale without any test failing.
- The plan's objective says "eight consumers". The census finds **seven files** carrying
  sixteen lines. The plan's own Task 3 enumerates eight numbered STEPS, two of which
  (`config.toml` and the eslint allowlist) are not code consumers and one of which (the
  manual locale check) is not a consumer at all. Seven files is the measured figure.

**T-158-32 is live and confirmed:** `eslint.config.mjs:42` and `:44` name both moved
files. A file-scoped allowlist whose glob matches nothing fails OPEN, so moving without
repointing would silently disarm the adapter-boundary guard on two files while the lint
gate stayed green.

---

## T-158-30 — the locale option, settled by measurement

Operator answer (b) required a measurement task before choosing, and the first option that
measurably works. **Option 1, the single-segment mid-path wildcard, works. It is adopted.**

### The instrument

A zero-side-effect probe of the auth service's own redirect matcher: `GET /auth/v1/verify`
with a deliberately invalid token and a `redirect_to` under test. The service answers 303
either to the requested URL (allowed) or to `site_url` (rejected), in both cases with the
same `otp_expired` error fragment. No email is sent, no user is touched, and the
`email_sent = 2` per-hour rate limit is not consumed.

```
curl -sS -o /dev/null -D - \
  "http://127.0.0.1:54321/auth/v1/verify?token=deadbeefdeadbeef&type=recovery&redirect_to=<urlencoded>" \
  -H "apikey: <publishable>"
```

**Instrument validated before use** (against the UNCHANGED allowlist, so the controls are
independent of anything this plan changed):

| `redirect_to` | `Location` observed |
|---|---|
| `http://127.0.0.1:5173/en/candidate/auth/callback` (then allowlisted) | echoed back — instrument can observe an accept |
| `http://evil.example.com/api/candidate/auth/callback` | `http://127.0.0.1:5173` — instrument can observe a reject |

Both directions observed, so a later zero result is a measurement and not a dead probe.

### Finding 1 — the plan's premise about the allowlist is FALSE

The plan's `key_links` states, and the `config.toml` comment repeats, that the redirect
allowlist "is an EXACT-URL list". The matcher does not work that way. Measured against the
UNCHANGED allowlist `["https://127.0.0.1:3000", "http://127.0.0.1:5173/en/candidate/auth/callback"]`
with `site_url = "http://127.0.0.1:5173"`:

| `redirect_to` | In the list? | `Location` observed | Verdict |
|---|---|---|---|
| `http://127.0.0.1:5173/literally/anything/at/all` | no | echoed back | **ALLOWED** |
| `http://127.0.0.1:5173/fi/api/candidate/auth/callback` | no | echoed back | **ALLOWED** |
| `http://127.0.0.1:5173/` | no | echoed back | **ALLOWED** |
| `http://127.0.0.1:5174/api/candidate/auth/callback` (different PORT) | no | echoed back | **ALLOWED** |
| `https://127.0.0.1:5173/api/candidate/auth/callback` (different SCHEME) | no | echoed back | **ALLOWED** |
| `http://localhost:5173/api/candidate/auth/callback` (different HOSTNAME) | no | `http://127.0.0.1:5173` | rejected |

The matcher short-circuits on **hostname equality with `site_url`**, ignoring scheme, port
and path, BEFORE the list is consulted at all. Locally every path on `127.0.0.1` is already
permitted and the two `127.0.0.1` entries in the list do nothing. `localhost` is a different
hostname and gets no short-circuit, which is why it is the only origin against which the
list can actually be measured — and, not coincidentally, the origin the browser uses
(`tests/playwright.config.ts:251` sets `baseURL` to `http://localhost:5173`, and the dev
server is reached the same way by hand).

**This is also the mechanism of the pre-existing forgot-password defect** named in operator
answer (a). `supabaseDataWriter.ts:87` builds `redirectTo` from `window.location.origin`,
which is `http://localhost:5173` in a browser, and that hostname matches neither `site_url`
nor any list entry. The in-app forgot-password link has therefore been falling back to
`site_url` — the voter home page — rather than reaching the callback at all. It is not a
theoretical mismatch; it is measured above as a reject.

### Finding 2 — the single-segment mid-path wildcard is honoured, and is genuinely single-segment

Allowlist under test, chosen so the probe exercises the LIST and not the hostname
short-circuit: `["https://127.0.0.1:3000", "http://localhost:5173/*/api/candidate/auth/callback"]`.
Supabase stopped and restarted so the auth service reloaded it.

| `redirect_to` | Expected | Observed |
|---|---|---|
| `http://localhost:5173/fi/api/candidate/auth/callback` | match | **MATCHED** (echoed back) |
| `http://localhost:5173/en/api/candidate/auth/callback` | match | **MATCHED** (echoed back) |
| `http://localhost:5173/fi/en/api/candidate/auth/callback` | no match — two segments | rejected (`-> http://127.0.0.1:5173`) |
| `http://localhost:5173/fi/api/candidate/auth/callback/extra` | no match — suffix pinned | rejected |
| `http://localhost:5173/api/candidate/auth/callback` | no match — zero segments | rejected |
| `http://localhost:5173/fi/api/evil` | no match | rejected |
| `http://localhost:5173/` | no match — no origin-wide amnesty | rejected |
| `http://evil.example.com/fi/api/candidate/auth/callback` | no match — host pinned | rejected |

`*` matches exactly one path segment and does not cross `/`. The host is pinned, the path
suffix is pinned in full, and neither a shorter nor a longer path is admitted. This is the
form operator answer (b) authorised and nothing broader.

### The option adopted, and why the others were not measured

**Option 1 adopted.** It was the operator's first preference and it measurably works, so by
the stated rule ("adopt the FIRST option that measurably works") options 2 and 3 were not
reached. Option 2 (the `?lang=` query parameter) was not measured because the rule stops at
the first success; it would have required proving both that the matcher accepts a
`redirect_to` carrying a query string AND that it preserves that parameter alongside its own
`token_hash`/`type`. Option 3 (accept the locale loss) was not reached and is not adopted,
so no `WINDOWS.md` defect is filed for a locale loss that no longer exists.

### T-158-30 disposition: AMENDED

The prohibition on broad and prefix wildcards **stands unchanged**. Only the single-segment
mid-path form is admitted, on the measured evidence above that it pins both the host and the
complete path suffix and admits exactly one intervening segment. A trailing wildcard, a
prefix wildcard, a bare `/**` and a host wildcard remain forbidden and were never tried.

**One acceptance criterion of the plan is superseded by this amendment.** Task 3's criterion
"`apps/supabase/supabase/config.toml`'s redirect allowlist ... contains no `*` character in
any entry" cannot hold alongside operator answer (b) option 1, which explicitly authorises a
`*`. The operator's answer post-dates the plan and governs. Everything the criterion was
protecting — no broadening of the host, no broadening of the path suffix — is preserved and
is now measured rather than asserted.

### The allowlist as landed, and its confirmation

```toml
additional_redirect_urls = ["https://127.0.0.1:3000", "http://localhost:5173/api/candidate/auth/callback", "http://localhost:5173/*/api/candidate/auth/callback"]
```

Two new entries, matching operator answer (a)'s commitment to the unprefixed and the
locale-prefixed form. Entry one is the base locale, which Paraglide serves unprefixed; entry
two is every other locale. The `https://127.0.0.1:3000` entry is pre-existing and untouched.
The dead `http://127.0.0.1:5173/en/candidate/auth/callback` entry was removed: it names the
old path, and by Finding 1 it never did any work.

Confirmed after the final restart:

```
http://localhost:5173/api/candidate/auth/callback          ALLOWED
http://localhost:5173/fi/api/candidate/auth/callback       ALLOWED
http://localhost:5173/sv/api/candidate/auth/callback       ALLOWED
http://127.0.0.1:5173/en/api/candidate/auth/callback       ALLOWED   (via the site_url hostname short-circuit)
--- must stay rejected ---
http://localhost:5173/fi/en/api/candidate/auth/callback    rejected (-> http://127.0.0.1:5173)
http://localhost:5173/api/candidate/auth/callback/extra    rejected (-> http://127.0.0.1:5173)
http://localhost:5173/anything                             rejected (-> http://127.0.0.1:5173)
http://evil.example.com/api/candidate/auth/callback        rejected (-> http://127.0.0.1:5173)
```

**Known limitation, unchanged by this plan:** both new entries pin port 5173, so a
`FRONTEND_PORT` override moves the browser origin off the list. The entry replaced here was
port-pinned in the same way, so this is neither introduced nor worsened here.

**Bearing on T-158-31 (production allowlist), and why the operator commitment still stands.**
Finding 1 implies that in production the same hostname short-circuit covers any path on the
`site_url` origin, which would make the production entries redundant too. That inference is
NOT relied on: it is one measurement of one auth-service version on a local stack, the
production deployment is a different build under a vendor's control, and the failure mode if
the inference is wrong is silent and production-only. The operator's answer (a) commitment
and the filed deployment TODO stand exactly as recorded.

---

## Task 2 — the move, and how it is recorded

**Landed as two commits on purpose.** A single commit that both moved and rewrote the files
recorded them at `R024` and `R045` similarity, below git's default 50% rename threshold, so
`git log -1 --diff-filter=R --name-status` — the plan's own acceptance criterion — reported
NOTHING. Splitting the work makes the provenance readable and the criterion true:

```
$ git log --diff-filter=R --name-status --format="%h %s" 6bf789b72 -1
6bf789b72 refactor(158-06): move both candidate auth endpoints under the generic API prefix

R100	apps/frontend/src/routes/candidate/auth/callback/+server.ts	apps/frontend/src/routes/api/candidate/auth/callback/+server.ts
R100	apps/frontend/src/routes/candidate/auth/logout/+server.ts	apps/frontend/src/routes/api/candidate/auth/logout/+server.ts
```

`R100` for both. The rewrite is the commit after it and can be read on its own.

### Acceptance criteria, measured

| Criterion | Result |
|---|---|
| both files exist at the new paths | yes |
| `apps/frontend/src/routes/candidate/auth/` no longer exists | yes, directory removed |
| renames recorded | `R100` / `R100`, above |
| `grep -cE 'redirect\(303, \`/' <callback>` is 0 | **0** |
| `grep -ci 'cookie' <callback>` is at least 1 | **1** |
| `route.ts` gains entries addressing both | `CandAppAuthCallback`, `CandAppAuthLogout` |
| `yarn typecheck` exits 0 | 0 errors, 0 warnings |
| `yarn workspace @openvaa/frontend test:unit` | 76 files, 1397 tests, all pass |

**The redirect-count criterion is weaker than it reads, and the positive control is what
shows it.** Run against the PRE-MOVE file the same pattern returns **4**, not 5 — the fifth
redirect sat behind a ternary, so the template literal did not immediately follow
`redirect(303, `. A criterion phrased as "is 0" would therefore have passed even if that
fifth target had been left hand-built. It was not: all five are rebuilt, and the ternary
branch is the one described below.

### The five redirect targets, and the one that has no route key

Four are plain route-key lookups: `CandAppResetPassword`, `CandAppSetPassword`,
`CandAppHome` (twice, the `next`-absent branch and the `default` arm) and `CandAppLogin`.

The fifth is the `email`/`signup` branch's `next` parameter — a caller-supplied in-app path
arriving on the query string. No route key can address an arbitrary path, so it goes through
a new `localizeAppPath` helper added to the route module, which wraps the same
`localizeHref` call `buildRoute` finishes with and performs the same locale widening in the
same one place. The alternative would have been a second, ad hoc way of writing a localized
URL, which is what the route module exists to prevent.

**Rule 2 deviation, applied here.** That `next` value was redirected to without any
validation. `safeRedirectTarget` already exists in the route module and its docblock states
it is "that guard on the auth path"; the callback was simply not using it. It is now
validated before the redirect, and a value that fails degrades to the candidate home, which
is where an absent `next` already went. The containment the old interpolation relied on was
incidental — the leading `/${lang}/` happened to keep the result same-origin — and
incidental containment is not a control.

### Two smaller changes worth naming

- **Both handlers dropped their `eslint-disable func-style` acceptance.** Neither needs the
  generated route types; both take the plain exported async function form with a
  `RequestEvent` parameter, which is the form the sibling OIDC callback already uses. Two
  lint acceptances removed rather than carried along.
- **The invite branch no longer pre-encodes the email.** The old code called
  `encodeURIComponent` and interpolated; the builder percent-encodes search-side values
  itself, so the raw value is passed. Passing the encoded one would have double-encoded it.

### T-158-34 — the middleware change, recorded here rather than in a comment

`candidateAuthHandle` returns early for any pathname under the API root, so **the candidate
auth handler no longer runs for either endpoint.** That is correct for both: neither sits
behind the protected group, and bouncing the callback to the login page would break the very
flow it exists to complete. But it is a real change in which middleware sees these requests
and it is recorded as one.

`paraglideHandle` is unaffected and still runs for every request, which is why the locale
still arrives. That distinction is the whole reason the plan's locale premise was wrong.

---

## Task 3 — the consumers, the guard, and the hand verification

### The census, before and after

| | Total lines | Carrying the new path |
|---|---|---|
| before (`f5dc33d20`) | 16 | 0 |
| after | 17 | 14 |

Three lines do not carry the new path, and all three are **deliberate references to the OLD
path as the historical subject of a regression guard** in `supabaseDataWriter.test.ts`:

- **line 185** — a comment naming the doubled path the old implementation produced.
- **line 188** — the test INPUT. It sets `window.location.pathname` to `/candidate/auth/logout`
  to simulate the URL shape that broke. Repointing it to the new path would WEAKEN the
  guard: the new path happens to equal the correct answer, so a buggy implementation that
  derives the URL from the pathname would accidentally pass.
- **line 203** — a comment explaining why the neighbouring assertion is a full-path match
  rather than a substring one.

The line count went from 16 to 17 because the writer's logout spec was split into two cases
(one pinning the endpoint, one pinning that the locale does not enter it) and the assertion
now names the route key as well as the literal path.

### Consumers repointed

1. `apps/supabase/supabase/config.toml` — the allowlist, covered under T-158-30 above. Local
   backend stopped and restarted so the auth service reloaded it, and the reload confirmed by
   re-probing.
2. `supabaseDataWriter.ts` `_logout` — now `fetch(ROUTE.CandAppAuthLogout, ...)`. The endpoint
   clears cookies and answers json; it is the same endpoint in every locale, so it carries no
   prefix. This removed the file's last reader of the current locale, and the `getLocale`
   import with it.
3. `supabaseDataWriter.ts` `_requestForgotPasswordEmail` — now
   `${origin}${buildRoute('CandAppAuthCallback')}`, which carries the reader's locale.
4. `supabaseDataWriter.test.ts` — **four assertions**, not the plan's "six assertion lines".
   Six LINES named the old paths; two of them were a test title and a comment.
5. `tests/tests/fixtures/shared/emailBucket.fixture.ts` — the default callback path and its
   `@param` doc line.
6. `tests/tests/utils/supabaseAdminClient.ts` — the invite and the recovery redirect targets.
7. `apps/frontend/eslint.config.mjs` — the two allowlist entries, below.

### T-158-32 — the lint allowlist, and a correction to the threat's mechanism

**The allowlist exists and was found live.** `apps/frontend/eslint.config.mjs`
`ADAPTER_BOUNDARY_ALLOWLIST` named both moved files.

**The threat register says a stale entry "fails OPEN". Measured, it fails CLOSED.** That
list is an EXEMPTION list, not a ban list. When its globs stopped matching, the ban started
applying to the two moved files and the lint gate went RED, loudly, on real code:

```
src/routes/api/candidate/auth/callback/+server.ts
   3:1   error  '@supabase/supabase-js' import is restricted ...  no-restricted-imports
  32:29  error  A `.supabase` access reaches through the adapter boundary ...  no-restricted-syntax
  41:21  error  A `.supabase` access reaches through the adapter boundary ...  no-restricted-syntax
src/routes/api/candidate/auth/logout/+server.ts
  14:9   error  A `.supabase` access reaches through the adapter boundary ...  no-restricted-syntax
✖ 4 problems (4 errors, 0 warnings)
```

That is a NATURAL red on production code at the new location, observed before the repoint,
and it is stronger evidence than any planted violation could be. The fail-open shape does
exist for this list, but it is the opposite direction: a stale entry leaves an amnesty
standing for a path nothing occupies, and a file later created at that path would be
silently exempt.

**Re-proof after the repoint, as a discriminating pair.** Green alone would not distinguish
"the exemption is correctly targeted" from "the ban stopped applying here at all", so both
sides were measured:

- **Ban live at the new location.** A planted `planted-violation.ts` was created beside the
  moved logout endpoint, importing `@supabase/supabase-js` and reading `locals.supabase`:

  ```
  src/routes/api/candidate/auth/logout/planted-violation.ts
    1:1   error  '@supabase/supabase-js' import is restricted from being used by a pattern ...
    4:10  error  A `.supabase` access reaches through the adapter boundary ...
  ✖ 2 problems (2 errors, 0 warnings)
  ```

  Observed RED. The plant was removed and the same command observed GREEN (no output).

- **Exemption live and file-scoped.** The two moved files themselves carry three
  `locals.supabase` accesses and one `@supabase/supabase-js` type import between them and do
  NOT fire. The plant sitting in the same DIRECTORY as an exempt file still fired, so the
  exemption is scoped to the two named files rather than to the directory.

Full `yarn lint:check` green afterwards, all guards reporting 0 violations.

**One incidental fix.** Placing the new `ROUTE` entries directly under the `// Candidate App`
section header tripped the comment-hygiene guard (rule 2 / D-A4: a comment line with no
terminal punctuation followed by a continuing comment at the same indent). The entries were
moved to the end of the candidate block instead, and the guard returned to 0 violations. Fixed
before the commit rather than carried; it is why the rewrite commit was amended once.

### The manual non-default-locale verification

The E2E fixtures hard-code the base locale, so the suite cannot see a locale regression here.
Verified by hand against the running stack, in two halves.

**Half one: what the browser actually emits.** A headless browser was driven to
`/{locale}/candidate/forgot-password`, the form submitted, and the outgoing request to the
auth service's recover endpoint captured:

| Locale started in | `html lang` | `redirect_to` emitted |
|---|---|---|
| `fi` | `fi` | `http://localhost:5173/fi/api/candidate/auth/callback` |
| `en` (base) | `en` | `http://localhost:5173/api/candidate/auth/callback` |

Both are exactly the two allowlist entries, which is what makes the entries the right two.

**Half two: the round trip through the moved handler.** A recovery link was generated for
the same user against each locale's callback URL and followed:

| | |
|---|---|
| **Locale used** | `fi` (non-default) |
| **URL received** | `http://localhost:5173/fi/api/candidate/auth/callback?token_hash=6489b8c3…&type=recovery` |
| **URL landed on** | `http://localhost:5173/fi/candidate/password-reset` |
| **Session cookie** | `set-cookie: sb-127-auth-token=base64-eyJhY2Nlc3NfdG9rZW4i…` — present |
| **Verdict** | **PASS.** The locale survived the move and the round trip. |

Base-locale contrast, run the same way: `http://localhost:5173/api/candidate/auth/callback?token_hash=…&type=recovery`
landed on `http://localhost:5173/candidate/password-reset` — unprefixed, which is correct
for the base locale.

The `set-cookie` on the response is also the live confirmation of T-158-35: the docblock
paragraph about using the hook's client survived the move, and so did the behaviour it
describes.

### A pre-existing defect the verification uncovered

Following a REAL recovery mail end to end, rather than a generated `token_hash`, showed the
in-app forgot-password flow cannot complete — and this is independent of the move:

```
mail link  http://127.0.0.1:54321/auth/v1/verify?token=pkce_f86adb…&type=recovery
           &redirect_to=http://localhost:5173/fi/api/candidate/auth/callback
hop 1      303 -> http://localhost:5173/fi/api/candidate/auth/callback?code=6f5ee11d-…
hop 2      303 -> http://localhost:5173/fi/candidate/login?errorMessage=authError
```

The auth service's PKCE verify hands the callback a **`code`** parameter. The handler reads
only `token_hash`, so the guard fails and it falls through to its error redirect.

**Not introduced here, and not fixed here.** The handler read `token_hash` before the move
too. The suite cannot see it because `toCallbackUrl` pulls the raw token out of the verify
link and hand-builds `?token_hash=` against the callback, bypassing the redirect entirely —
its own docblock says so. The obvious repair, calling `exchangeCodeForSession` in the
handler, does not work as written: the PKCE `code_verifier` lives in browser storage and the
per-request server client cannot reach it, so choosing which client performs the exchange is
an architectural decision rather than a local fix. Recorded rather than guessed at, per the
scope boundary.

Filed as `.planning/todos/pending/2026-09-02-forgot-password-pkce-code-not-exchanged.md` and
as an open `WINDOWS.md` entry.

Note that this move REPAIRED two of the three broken links in that same chain: the
`redirectTo` used to name an origin the allowlist rejected, and it used to carry no locale.
The third link remains.

### The full E2E run

Preconditions established in this order, because the auth service has to reload the
allowlist before anything exercises it:

1. `config.toml` allowlist changed, then Supabase stopped and started, then the new
   entries re-probed and confirmed.
2. Port 5173 freed of a dev server of unknown vintage (PID 41476), then `yarn db:reset`,
   then ONE fresh `yarn dev`. The preflight asserts the served application came from this
   checkout and cannot be skipped; it passed.
3. `yarn db:reset` again immediately before the run, so the suite seeded onto a clean
   database.

```
150 passed (10.4m)
[exited with code 0]
```

**150 passed, 0 failed, 0 skipped, 0 flaky.** The candidate-journey project ran (its
teardown, "unregister candidate-journey auth user", is step 149 of 150), and that project
carries the invite and recovery legs which are what exercise the moved callback end to end.

`yarn lint:check` green, all guards at 0 violations.
`yarn workspace @openvaa/frontend test:unit` green, 76 files / 1397 tests.

**One gap, recorded rather than papered over.** The `PLAYWRIGHT_BANK_AUTH`-gated specs are
excluded from the default suite and were not run for this move, as they were not run for the
cookie rewrite before it. Logged as an open `WINDOWS.md` entry.

---

## Deviations from Plan

### Rule 2 — auto-added missing critical functionality

**1. The auth callback's `next` parameter was redirected to without validation.**
- **Found during:** Task 2, while rewriting the five redirect targets.
- **Issue:** `next` arrives on the query string and is fully caller-controlled. The old code
  interpolated it straight into the redirect target. Same-origin containment was incidental,
  coming from the leading locale segment rather than from any check.
- **Fix:** validated with `safeRedirectTarget`, the route module's existing auth-path
  validator, whose own docblock says it is that guard. A rejected value degrades to the
  candidate home, which is where an absent `next` already went.
- **Files modified:** `apps/frontend/src/routes/api/candidate/auth/callback/+server.ts`
- **Commit:** `f39833693`

### Rule 3 — auto-fixed blocking issues

**2. The adapter-boundary allowlist entries named the old paths, so the lint gate went red on the moved files.**
- **Found during:** Task 2, immediately after the `git mv`.
- **Issue:** four `no-restricted-imports` / `no-restricted-syntax` errors on the two moved
  files. The plan assigns the repoint to Task 3, but leaving the gate red between commits
  would have produced a broken intermediate state.
- **Fix:** repointed in the move commit, where the change belongs anyway since the entries
  are file paths. The full re-proof stayed in Task 3 as the plan requires.
- **Files modified:** `apps/frontend/eslint.config.mjs`
- **Commit:** `6bf789b72`

**3. `localizeHref` cannot take the request locale, which is a plain string.**
- **Found during:** Task 2.
- **Issue:** `App.Locals.currentLocale` is `string`; Paraglide types its option as a closed
  union generated at build time. `buildRoute` already widens it, but the `next` branch needed
  the same widening and duplicating the cast would have put it in two places.
- **Fix:** added `localizeAppPath` to the route module, wrapping the same call with the same
  widening, once.
- **Files modified:** `apps/frontend/src/lib/routes/buildRoute.ts`
- **Commit:** `f39833693`

**4. The new `ROUTE` entries tripped the comment-hygiene guard.**
- **Found during:** Task 3, on the full `yarn lint:check`.
- **Issue:** their explanatory comment sat directly under `// Candidate App`, which is rule
  2 (D-A4): an unpunctuated comment line continued by another at the same indent.
- **Fix:** moved the entries to the end of the candidate block. Guard back to 0 violations.
- **Files modified:** `apps/frontend/src/lib/routes/route.ts`
- **Commit:** `f39833693` (amended)

### Structural deviations from the plan as written

**5. The move was split into two commits.** A single commit recorded the renames at `R024`
and `R045`, below git's default threshold, so the plan's own criterion
(`git log -1 --diff-filter=R --name-status`) reported nothing. Split into a pure relocation
(`R100`/`R100`) and a rewrite.

**6. A measurement task was inserted before the locale choice**, as operator answer (b)
required. It is not in the plan's task list.

**7. Task 3's criterion "contains no `*` character in any entry" is superseded** by operator
answer (b) option 1. Reasoned through in full under the T-158-30 heading above.

**8. Three of the plan's stated figures did not survive re-measurement**, and each is
corrected in place above: the locale premise (false), "six assertion lines" (four
assertions and two prose lines), "eight consumers" (seven files, sixteen lines).

**9. T-158-32's stated mechanism is backwards.** The allowlist is an exemption list, so a
stale entry fails CLOSED and loudly, not open and silently. Measured, with the actual red
quoted.

### Environment interruption

Docker Desktop stopped mid-plan, taking the whole local stack with it. Restarted, Supabase
brought back up, and every measurement taken after it was re-run against the restored stack.
No code change was made in response; it is recorded because several measurements above were
taken on either side of it.

## Known Stubs

None. No hardcoded empty value, placeholder string, `TODO` or `FIXME` was introduced by this
plan.

## Threat Flags

None. The move introduces no network endpoint, auth path, file access pattern or schema
change that is not already in the plan's threat model. The endpoints moved but their trust
boundary did not.

## Follow-ups filed

| Item | Where |
|---|---|
| Deployment guide must document the production redirect allowlist | `.planning/todos/pending/2026-09-02-deployment-guide-production-redirect-allowlist.md` |
| The in-app forgot-password link cannot complete (PKCE `code` never exchanged) | `.planning/todos/pending/2026-09-02-forgot-password-pkce-code-not-exchanged.md`, plus an open `WINDOWS.md` entry |
| Bank-auth E2E specs not run for this move | open `WINDOWS.md` entry |

## Self-Check: PASSED

Both artifacts exist at the paths claimed, the old route directory is gone, both filed TODOs
exist, and all five commit hashes quoted above resolve in this repository. Verified by
`[ -f ]` per path and `git log --oneline --all | grep` per hash.
