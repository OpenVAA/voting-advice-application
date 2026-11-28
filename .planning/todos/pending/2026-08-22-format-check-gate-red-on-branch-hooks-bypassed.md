---
created: 2026-08-22T09:15:00.000Z
title: 'yarn format:check was red on this branch for ~12 days — commits in this worktree bypass the formatting hook'
area: CI / tooling / repository hygiene
severity: medium
source: Phase 142.1 Task 1 (found while running D-27's four static gates)
files:
  - prettier.config.mjs
  - packages/shared-config/prettier.config.mjs
  - .github/workflows/main.yaml
---

## Problem

`yarn format:check` is one of the four static gates every recent phase's plan names (D-27). Running it
at Phase 142.1's phase-start HEAD reported **three** unformatted files, and only one of them belonged
to that phase:

| File | Class |
|---|---|
| `apps/frontend/src/lib/api/utils/auth/providers/idura.test.ts` | introduced by 142.1-02 (`0e0ddcca9`) |
| `packages/dev-seed/src/templates/e2e/perm/perm-bankauth-notloc.ts` | **pre-existing** |
| `tests/README.md` | **pre-existing** |

Measured, not inferred:

```bash
git show e936f3bbc:<file> | npx prettier --check --stdin-filepath <file>   # phase-start HEAD
```

reports both of the latter unformatted **before Phase 142.1 opened**. Bisecting `tests/README.md`
further: `4c5b64116` (2026-08-10, *"chore: apply repo-wide prettier formatting (187 files)"*) left it
**CLEAN**, and it had drifted again by `76b0735a7` (2026-08-17).

⚠ **Correction to the first draft of this todo, left visible rather than rewritten away.** The first
draft said *"nothing surfaced it"*. **That was wrong.** Both files are already in
`.planning/WINDOWS.md` — entries **#7** (`perm-bankauth-notloc.ts:30`) and **#8**
(`tests/README.md:182`), recorded by **Phase 151 on 2026-08-16**, both reading *"format:check red at
151-03 baseline, DEFERRED per PD-03"*. The redness was seen, named, filed and deliberately deferred.
Both were marked `fixed` on 2026-08-22 (`gsd-tools windows fixed 7 / 8`).

**The corrected finding is narrower and sharper.** A **known-red** gate stayed red for six days across
several phases, each of which named `yarn format:check` among its own static gates, and none of which
ran it — or ran it and did not stop. The failure is not blindness; it is that **a deferred entry in a
defect register is not the same as a gate that runs**, and nothing periodically re-asserted the
register against the tree. That is the same shape as two other findings recorded in the same phase:
the 2026-08-11 fake-guard sweep never opening `providers/idura.test.ts` / `providers/signicat.test.ts`,
and the E2E preflight's clause (b) being unsatisfiable against a correct checkout until `b8de9ff06`.
**A guard that cannot pass is a guard nobody is running.**

## Mechanism

Known and already recorded in project memory: this checkout is a linked worktree that shares the main
repository's `core.hooksPath`, and carries a worktree-local `core.hooksPath=/dev/null` override so
plain `git commit` works at all. The consequence is that **every commit made in this worktree bypasses
the husky/lint-staged formatting hook**, so agent-authored hand-wrapped lines land unformatted and
nothing local objects.

## What Phase 142.1 did about it

Repaired the three files, in **two deliberately separate commits** so the phase's own diff stays
honest:

- `0ba6708fb` — `idura.test.ts` only (this phase's own regression; whitespace only, no assertion text,
  matcher or count changed; auth suite re-run 7 files / 65 tests, exit 0)
- `79038ac81` — the two pre-existing files, labelled as **outside** the phase

Recorded in the phase's ledger gate section. Today's three files are closed; **the mechanism is not**,
which is why this todo exists.

## Solution

Pick one — they are not mutually exclusive, and the first is much cheaper than the others:

1. **Make CI the backstop.** Confirm `yarn format:check` runs as its own CI step on this branch's PRs.
   If it does not, add it — the same argument A-04 makes for `yarn workspace @openvaa/frontend check`
   (which CI runs and neither `lint:check` nor `build` provides) applies verbatim here.
2. **Fix the hook path for linked worktrees**, so `core.hooksPath=/dev/null` stops being the price of a
   working `git commit` here.
3. **Add `format:check` to the standing gate list every phase plan runs**, so drift is caught at most
   one phase after it lands rather than twelve days later.

## Related

- Project memory: *"-gsd is a linked worktree sharing the main repo's broken `core.hooksPath`"*
- Phase 142.1 ledger § D-27 gate 3 — the full measurement and the two repair commits
- `b8de9ff06` — the preflight repair, the same class of finding found in the same phase
