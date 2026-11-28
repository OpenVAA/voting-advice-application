# Reach proof matches the login URL against the full URL, not the pathname

**Filed:** 2026-08-27 · **Source:** Phase 147 code review, finding WR-02 (`147-REVIEW.md`)
**Severity:** warning — false-FAIL risk only, never false-pass
**Site:** `tests/tests/specs/a11y/candidate-a11y.spec.ts:170` (`CANDIDATE_LOGIN_URL`), used at `:217-222`

## What

`assertCandidateReach` proves a scan looked at an authenticated document by asserting the settled URL
is inside the candidate application and is **not** the login route. The not-login half compares
`CANDIDATE_LOGIN_URL` against the **full settled URL string, including its query string**, rather than
against the parsed pathname.

## Why it matters

A future candidate URL that carries `/candidate/login` as a **query-parameter substring** — a
`?redirect=/candidate/login` after an expired session, a `?returnTo=` on a re-auth bounce — would make
the reach proof fail on a page that was in fact correctly reached and correctly authenticated.

The failure direction is the safe one: this can only manufacture a **spurious red**, never a green on a
login page. It cannot produce the false confidence the reach proof exists to prevent. That is why it is
filed rather than fixed at phase close.

## Fix

Compare `new URL(settledUrl).pathname` against the login route instead of substring-matching the whole
URL. Re-run the two a11y projects afterwards (`candidate-a11y-scan` and `a11y-smoke`) and confirm 17/17
still holds — this touches a reach proof, so it is a behaviour change to a guard and wants its own
observation, not just a green suite.

## Related

- `[[147-NEGATIVE-CONTROL.md]]` row `REACH-14` — the 14 reach proofs this guard backs
- `.planning/phases/147-candidate-app-scan-reach-authenticated-fixture-raw-key-gate/147-REVIEW.md` — WR-01/WR-02
- WR-01 (the stale `assertNoRawI18nKeys` docblock claim) was fixed at phase close; this one was not
