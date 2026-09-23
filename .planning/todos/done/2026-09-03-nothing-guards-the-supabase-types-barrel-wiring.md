---
created: '2026-09-03T09:34:00.000Z'
title: Nothing fails if the supabase-types barrel is rewired past the override — measured by negative control NC-3/NC-3b
area: packages/supabase-types
severity: medium
source: Phase 164 (returns-table nullability) Plan 04 Task 1 — surfaced by the negative control itself, filed per D-N2
resolved: '2026-09-03'
resolves_phase: 164
resolution: >-
  Closed by 164-05 as an operator-authorised scope addition, taking the second of the
  two routes this entry sketched: check 6 of scripts/assert-rpc-return-nullability.mjs,
  which already reads database.overrides.ts from the same package and is wired into
  lint:check. It reads the export STATEMENT rather than the specifier as a bare string,
  which is the risk the Solution section named -- probe NC-7b demonstrates the disguise
  (a barrel that keeps the './database.merged' import and exports Database from
  './database') passing a bare grep and reddening check 6. The check covers BOTH links of
  the chain, not only the barrel: probe NC-7e measures that rewiring database.merged.ts
  itself is equally invisible to yarn workspace @openvaa/frontend check (exit 0, 2750
  files). Probed before trusted, per PROH-01: NC-7a..NC-7e in
  .planning/phases/164-returns-table-nullability-audit-single-override-mechanism/164-NEGATIVE-CONTROL.md
  section 13, all RED with verbatim output, both mutated files restored byte-identically
  by git hash-object.
files:
  - packages/supabase-types/src/index.ts
  - packages/dev-seed/tests/rpcNullabilityGate.test.ts
  - scripts/assert-rpc-return-nullability.mjs
---

## Problem

The whole `RETURNS TABLE` nullability guarantee hangs on **one line**:

    packages/supabase-types/src/index.ts:1
    export type { Database } from './database.merged';

Change `'./database.merged'` to `'./database'` — the pre-phase state, a one-token edit — and the
override layer is bypassed for every consumer in the monorepo. **Measured, nothing fails.**

Phase 164 plan 04's negative control ran exactly this and recorded the verdicts
(`164-NEGATIVE-CONTROL.md` § 6):

| Override wiring | Null-guard at the consumer | `yarn workspace @openvaa/frontend check` |
|---|---|---|
| `./database.merged` (as committed) | present | exit 0 — 2750 files, 0 errors |
| `./database.merged` (as committed) | **deleted** | **exit 1 — TS2345** |
| `./database` (rewired) | present | exit 0 — 2749 files, 0 errors |
| `./database` (rewired) | **deleted** | **exit 0** — 2749 files, 0 errors |

The last row is the gap. With the barrel rewired, the null-guard is both **unflagged** (nothing
reports it as dead code — `@typescript-eslint/no-unnecessary-condition` is not enabled anywhere, and
no type-checked ESLint preset is extended) and **unforced** (deleting it compiles clean). A future
contributor who removes the guard as "obviously dead" gets a green build, and
`Nomination`'s constructor invariant in `packages/data` is the next thing to find out about it.

**The phase's other three gates do not cover this.** Each was verified able to fail, and each is
aimed elsewhere:

- `scripts/assert-rpc-return-nullability.mjs` reads the schema tree, the enumeration artifact and
  `database.overrides.ts`. It never reads `index.ts`. Rewiring the barrel leaves it exit 0.
- The `supabase-types-drift` CI job regenerates `src/database.ts` and diffs it. A barrel edit does not
  change the generated file, so the job stays green.
- `yarn workspace @openvaa/supabase-types typecheck` compiles `database.overrides.ts` and
  `database.merged.ts` on their own merits. Both still compile perfectly when nothing imports them.

Measured, `database.merged` has exactly **one** functional reference in the tree:

    $ grep -rn "database\.merged" . --exclude-dir=node_modules --exclude-dir=.git --exclude-dir=.planning
    packages/supabase-types/src/database.overrides.ts:43   (a comment)
    packages/supabase-types/src/index.ts:1                 (the export — the only functional one)
    packages/dev-seed/tests/rpcNullabilityGate.test.ts:6   (a docblock)

The two `.md`-adjacent hits are prose. The spec that mentions it in its docblock does **not** assert
it.

## Why it was out of scope for Phase 164 plan 04

Plan 04's deliverable is the evidence document — it mutates, observes and reverts, and ships no
guard of its own. Adding an assertion is a code change belonging to a plan that owns
`packages/dev-seed/tests/rpcNullabilityGate.test.ts` (plan 03's deliverable) or the assert script
(plan 02's). Writing one here would have meant plan 04 shipping an unprobed guard in the same run
where its whole job is to prove guards are probed.

## Solution

TBD. Cheapest credible fix, in the shape the phase already uses:

- Add an assertion to `packages/dev-seed/tests/rpcNullabilityGate.test.ts` — the repo-meta spec that
  already pins the `lint:check` link and the CI job's shape — reading
  `packages/supabase-types/src/index.ts` and requiring the `Database` export to come from
  `./database.merged`. It is a file read and a regex, needs no new dependency, and sits with the
  phase's other structural pins.
- Or add it as check 6 in `scripts/assert-rpc-return-nullability.mjs`, which already reads
  `database.overrides.ts` from the same package and is wired into `lint:check`.

Either way, **probe it before trusting it** (`PROH-01`): rewire the barrel, confirm the new assertion
goes red naming the offending import, revert, confirm green. The reproduction is fully recorded in
`164-NEGATIVE-CONTROL.md` § 6 and takes one line to re-apply.

Note the risk in the cheap version: an assertion that only greps for the string
`'./database.merged'` passes if the barrel keeps the import but stops exporting `Database` from it.
Asserting the whole export statement, not just the specifier, is worth the extra few characters.

## Context

Surfaced during Phase 164 plan 04 Task 1, branch `integration/ship-12-squash`, HEAD `8c34b5184`.
Filed under decision **D-N2** rather than left as a source comment. This is the negative control
doing what it was commissioned for: NC-3 was designed to ask whether the override mechanism is
load-bearing, and answering that question truthfully also exposed that nothing holds the mechanism in
place.
