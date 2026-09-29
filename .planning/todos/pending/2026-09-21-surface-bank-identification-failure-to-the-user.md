---
created: 2026-09-21T19:20:00Z
title: Surface bank identification failure to the user
area: ui
severity: major
files:
  - apps/frontend/src/routes/candidate/preregister/+page.svelte (the gap: nothing here reads `$page.url.searchParams.get('error')`)
  - apps/frontend/src/lib/candidate/utils/oidcError.ts (the four app-chosen codes, plus `upstreamOidcError` for provider-chosen ones)
  - apps/frontend/src/routes/api/oidc/callback/+server.ts (every redirect that carries an `error` value)
  - apps/frontend/messages/{da,en,et,fi,fr,lb,sv}/candidateApp.preregister.json (the copy; 7 locales)
  - apps/frontend/src/lib/routes/route.ts (`CandAppHelp` -> /candidate/help, which exists)
---

## Problem

**Sequencing: immediate follow-up, blocked only on the bank-auth round trip working end to end.**
Filed 2026-09-21 during the Idura debug session (`.planning/debug/idura-bank-auth-empty-client.md`),
which is exactly the evidence for it: five consecutive real failures produced **no user-visible
message at any point**.

`/api/oidc/callback` redirects to the preregister route with `?error=<code>` on every failure path,
and `apps/frontend/src/routes/candidate/preregister/+page.svelte` **never reads that parameter**. Its
only two `error` mentions are `console.error` calls. So the value is written and silently dropped: a
candidate whose identification fails lands back on the form with no indication anything happened,
cannot tell "retry might work" from "this is broken", and is given no route to support.

The operator's requested copy, for codes that may indicate a transient fault:

> "Something went awry with the identification, sorry! Please try again and if the problem persist,
> please contact support."

with a link to `/candidate/help`.

## Solution

TBD on presentation (where the message sits, how it is styled) — but the **code taxonomy is the
substance of this work**, and getting it wrong is worse than showing nothing. Retry-and-apologise
copy is wrong for at least two of the cases below.

### The codes, and whether "try again" is honest

`oidcError.ts` defines four application-chosen values; a fifth case reflects the provider's own value
through `upstreamOidcError`, so the set is **open** and the default branch matters.

| Code | Cause | Flake-ish? |
|---|---|---|
| `token_exchange_failed` | The POST to the provider's token endpoint failed | **Yes** — genuinely transient; the requested copy fits |
| `invalid_state` | State cookie missing or mismatched: expiry, back button, a `localhost` vs `127.0.0.1` host switch — or CSRF | **Mixed** — retry usually helps, but it is also the CSRF signal, so do not imply "harmless glitch" |
| `missing_code` | Provider returned no `code` | **Mixed** — a provider hiccup, or the user abandoning at the bank |
| `invalid_token` | Decryption, signature or claim verification failed | **No** — deterministic. Today's session: an `aud` mismatch from a misconfigured env. Retrying is futile, and "please try again" sends the user in a loop while the real fault is server-side |
| upstream (e.g. `access_denied`) | Provider-chosen; `access_denied` is the user **deliberately cancelling** | **No** — apologising for a flake when someone chose to cancel is actively wrong. Needs its own calm copy, or none |

So: at minimum a two-branch split (transient → the requested copy + help link; everything else →
copy that does not promise a retry), with `access_denied` carved out. A single message for all five
would be a regression in honesty even though it is an improvement in visibility.

### Constraints

- **Localisation is mandatory, not optional.** CLAUDE.md: every user-facing string must support the
  supported locales, and `yarn assert:i18n-catalog-namespaces` is a `lint:check` link. The copy goes
  into `candidateApp.preregister` in **all seven** catalogues (`da, en, et, fi, fr, lb, sv`), not
  inline in the component. The English text above is the source string, not the implementation.
- **Do not widen what the error value discloses.** The four codes are an operator-facing contract
  that `tests/IDURA-TEST-RUNBOOK.md` names verbatim, and the callback deliberately puts only an
  opaque failure class on the query string — never `error.message`, which carries the incoming `kid`.
  This work renders what is already there; it must not add detail to the URL to make the message
  richer. Server-side logs are where detail belongs, and as of `6bb364382` they name
  `code`/`claim`/`reason` without the token payload.
- **`upstreamOidcError` values are provider-controlled and reach the DOM.** Treat them as untrusted:
  map known values to fixed copy and fall back to a generic message; never interpolate the raw value
  into the page.
- `/candidate/help` exists as a route and as `CandAppHelp` in `route.ts` — link via the route builder,
  not a hardcoded path.
- Worth an a11y pass when implemented: an error that appears after navigation should be announced,
  not only shown (this repo already has an `aria-live` route announcer pattern from the spike work).

### Related, not this

- `2026-09-02-close-bank-auth-oidc-round-trip-window.md` — the `PLAYWRIGHT_BANK_AUTH` specs are
  unproven at HEAD. That suite is where this behaviour would eventually be tested, so the two touch,
  but neither blocks the other.
- `2026-08-22-identity-callback-verifyjwt-fails-open-on-aud-iss.md` — **likely stale.** The
  2026-09-21 security audit confirmed `requireVerifyClaimBinding` now throws
  `ERR_AUDIENCE_UNCONFIGURED` / `ERR_ISSUER_UNCONFIGURED` rather than failing open. Verify and close
  it separately rather than as part of this.
