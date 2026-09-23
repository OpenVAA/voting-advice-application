# Close the bank-auth OIDC round-trip window opened by Phase 158

**Filed:** 2026-09-02, at Phase 158's close, by operator decision to track rather than block
**Severity:** high — it is the only behavioural proof of the OIDC exchange, and the surface under it changed
**Consolidates:** `WINDOWS.md` rows **217, 220, 221, 222** (four separate `unrun-verify` rows, all the same gap seen from four plans)

## The gap in one sentence

The `PLAYWRIGHT_BANK_AUTH`-gated `bank-auth` / `bank-auth-journey` specs have **not run since
Phase 158 renamed the cookies and moved the auth endpoints they exercise**, so the live OIDC
round trip is unproven at HEAD.

## What changed underneath them

| Plan | Change |
|---|---|
| `158-03` | Four cookie names rewritten across 18 sites / 6 files, onto one declaration at `$lib/cookies` |
| `158-06` | Candidate auth callback and logout moved to `/api/candidate/auth/*`; `routes/candidate/auth/` deleted (full move, no shims) |

Both touch exactly the surface this flow uses: the cookies the handshake sets, and the endpoint
it returns to.

## What IS proven — do not redo this

Re-confirmed live by the phase verifier at `83578fb06`, not merely claimed:

- Static byte-identity proof over the rewrite diff — every literal maps to the identical wire string.
- `yarn assert:cookie-names` scans **783 files, 0 violations**, is chained into `yarn lint:check`,
  and **fails at exit 1 on a planted literal**, naming the exact file and line. Proven non-vacuous
  twice: once by `158-03`'s close-out, once by the verifier.
- Six negative controls in the ledger's section B.
- Unit coverage of the individual cookie read/write sites.
- `158-06` measured GoTrue's matcher directly and found it short-circuits on hostname equality
  with `site_url`, ignoring scheme, port and path — so the two old `127.0.0.1` allowlist entries
  never did any work, and `localhost` was the only origin the list governed.

## What is NOT proven

**That the handshake completes.** authorize → callback → token exchange → session cookie set under
the new names, at the moved endpoint. A guard firing is not a round trip. No static check
substitutes for a live external-IdP exchange.

## Why it was not closed in-phase

It needs the mock OIDC issuer stood up **plus** the frontend's own IdP-pointing env — operator and
deployment-environment responsibility, unavailable to an agent. Four separate plans (`158-03`,
`158-06`, `158-16`, `158-09`) each declined to fake it and logged a window instead, which is the
correct behaviour and the reason this is a clean hand-off rather than a surprise.

## How to close it

1. Stand up the mock issuer and set the frontend's IdP env per `tests/IDURA-TEST-RUNBOOK.md`.
2. Run the two gated projects with `PLAYWRIGHT_BANK_AUTH=1`.
3. **Account for the serial-chain cost before you run:** these specs join the tail of the perm
   serial chain and perform an authoritative `app_settings` REPLACE against the target database.
   Do not point them at anything you care about.
4. On green, retire rows 217, 220, 221 and 222 together — they are one gap, not four.
5. On red, the first suspects are the four renamed cookie names and the moved callback path,
   in that order.

## Related

- `.planning/todos/pending/2026-06-03-full-bank-authentication-flow-e2e-spec.md` — the older,
  broader ask for this coverage; this window is the narrower "it regressed and we have not
  re-run it" case.
- `.planning/todos/pending/2026-08-22-bank-auth-journey-setup-header-contradicts-config.md`
- `.planning/phases/158-routing-auth-surface-harmonisation/158-VERIFICATION.md` — human
  verification item 1.
- `WINDOWS.md` row **218** is a *separate* Phase 158 `unrun-verify` (the code-review-checklist
  walk over `158-03`'s diff is unevidenced) and is not covered by this TODO.
