---
created: 2026-08-22T09:10:00.000Z
title: "bank-auth-journey.setup.ts's header says the project 'stands ALONE'; the config says it depends on voter-prefs-tracking"
area: tests / Playwright configuration documentation
severity: medium
source: Phase 142.1 (A-08 scope boundary; threat T-142.1-19 — filed deliberately, NOT fixed)
files:
  - tests/tests/setup/candidate/bank-auth-journey.setup.ts
  - tests/playwright.config.ts
  - tests/README.md
---

## Problem

`tests/tests/setup/candidate/bank-auth-journey.setup.ts:3-4` still reads:

> Opt-in-isolated (PLAYWRIGHT_BANK_AUTH-gated; **stands ALONE, NOT threaded into the perm serial
> chain** — A4).

The configuration says the opposite, and the configuration is authoritative:

- `tests/playwright.config.ts:494` — `dependencies: ['voter-prefs-tracking']` on
  `data-setup-bank-auth-journey`.
- `tests/playwright.config.ts:443-446` — an explicit docblock stating that **as of WR-03 (Phase 140)
  it JOINS THE TAIL OF THE PERM SERIAL CHAIN**, and that this *"SUPERSEDES RESEARCH A4/Pitfall 3
  ('stands alone') by explicit operator decision: A4 bought a fast isolated gate at the cost of
  `app_settings` singleton safety, and the singleton wins."*
- `tests/README.md:187` — documents the same dependency chain.

The stale header therefore contradicts three current sources, including a docblock written expressly
to record that it was superseded.

## Why this is filed and NOT fixed

Two reasons, and the second is the load-bearing one.

1. **Out of Phase 142.1's named scope.** A-08 assigned that phase exactly two doc corrections — the
   four EFLOW-10b `Read by` cells in `tests/IDURA-TEST-RUNBOOK.md` and `signicat.ts:6`'s header. This
   was not among them, and quietly widening a doc pass is how doc passes stop being reviewable.

2. **The dangerous repair direction is the plausible-looking one.** An executor or reviewer who trusts
   the comment over the config will "reconcile" them by **removing the dependency from the config** —
   which silently detaches `bank-auth-journey` from its data setup and yields a green run that proves
   nothing. Phase 142.1 registered this as threat **T-142.1-19** (Tampering, high) and asserted the
   non-edit with `git diff --exit-code HEAD -- tests/playwright.config.ts tests/tests/setup/candidate/bank-auth-journey.setup.ts`
   in two separate verify gates, precisely so the run could not drift there unnoticed.

A secondary symptom: the header also makes the project's honest **~11-minute** runtime look like a
misconfiguration, so a reader may go hunting for a bug that is not there.

## Solution

Edit the **comment**, never the config. Replace the "stands ALONE" clause in
`bank-auth-journey.setup.ts:3-4` with the WR-03 position already written at
`playwright.config.ts:443-446`: the project is `PLAYWRIGHT_BANK_AUTH`-gated **and** threaded onto the
tail of the perm serial chain, because the shared `app_settings` singleton makes isolation unsafe; the
isolated `--project=bank-auth-journey` gate therefore takes full-suite time by design.

While there, consider a one-line pointer from the setup file to `playwright.config.ts:443-446` so the
next divergence is a one-hop check rather than a judgment call.

## Related

- Same class as `tests/README.md:124`/`:135`'s concurrency claim, already carried in `STATE.md`'s
  Deferred Items from Phase 138 F-2 — the config and the prose disagree, and the prose is wrong.
- Phase 142.1 ledger, § the `bank-auth-journey` E2E run.
