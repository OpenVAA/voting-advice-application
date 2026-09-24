---
created: 2026-08-20T14:00:00.000Z
title: playwright.config.ts comments claim bank-auth is default-on; the code says opt-in
area: tests / documentation drift
severity: minor
source: Phase 142 research + verification (A-10)
files:
  - tests/playwright.config.ts
  - tests/README.md
---

## Problem

`tests/playwright.config.ts:334` and `:338` state that the bank-auth projects
"run by default (opt-OUT via `PLAYWRIGHT_NO_*`)". Both the code and the config's
own docblock say the opposite:

- `:420` — the `bank-auth` project exists only inside
  `...(process.env.PLAYWRIGHT_BANK_AUTH ? [ … ] : [])`
- `:459` — same gate for the `bank-auth-journey` family
- `:260-267` — the docblock lists both under **"OPT-IN projects (excluded from the
  default run)"**, with the reason (the spec throws at module load without
  `SUPABASE_SERVICE_ROLE_KEY`/`ANON_KEY`, and needs the identity-callback Edge
  Function served)

Nothing sets `PLAYWRIGHT_BANK_AUTH`: not `package.json:28`'s `test:e2e` script,
not `turbo.json`, not `.env`/`.env.example`, and not CI —
`.github/workflows/main.yaml:246` runs plain `yarn test:e2e` and the only
Playwright env var it ever sets is `PLAYWRIGHT_VISUAL` at `:319`.

This mattered concretely: Phase 142's discussion locked a full-E2E gate on the
stated rationale that "the Phase-122 bank-auth E2E specs exercise [the authorize
endpoint] directly" — which these comments support and the code contradicts. The
gate had to be re-decided after research measured it (Phase 142 A-05).

Same class as the already-recorded `tests/README.md:124`/`:135` concurrency drift
in STATE.md's deferred items.

## Solution

Correct `:334` and `:338` to match `:260-267` and the code — bank-auth is
**opt-in via `PLAYWRIGHT_BANK_AUTH`**, not opt-out. While there, sweep the file
for any other default-on/opt-in claims and reconcile them against the actual
project-array gates.

Consider whether the comment block should state, once, near the project array,
that the gate expressions themselves are the source of truth.

---

## RESOLVED — 2026-08-21, Phase 142 (`142-04`, executed as wave 5, commit `f4e0fc1ec`)

**This todo describes work that is already done.** It is closed rather than left
open, because a standing todo describing completed work is the stale-record
failure this milestone keeps hitting.

A-10's original instruction was *"capture as a todo; do not fix in this phase."*
**The operator explicitly superseded that at `142-04`'s checkpoint**, directing
that this and two sibling file-don't-fix items be fixed. See the ledger's
*"⚠ Operator-approved SCOPE EXPANSION at `142-04`'s checkpoint"* section (item
SE-2).

What landed in `f4e0fc1ec` (comment-only — **no gate expression was changed**):

- `:334`/`:338` corrected: bank-auth is **opt-in via `PLAYWRIGHT_BANK_AUTH`**,
  matching the docblock at `:260-267` and the gates at `:420`/`:459`.
- The whole file was swept for other default-on/opt-in claims: **no further
  drift found**.
- A line was added naming the **gate expressions themselves** as the source of
  truth, which is the "consider whether" item in the Solution above.

Verified independently at close: the two bank-auth projects are still absent
from a default `yarn test:e2e` run, and were exercised in `142-06` only under an
explicit `PLAYWRIGHT_BANK_AUTH=1` opt-in command line.
