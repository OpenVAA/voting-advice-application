# Run the escape-hatch and schema-hop checks over the outside corpus

**Filed:** 2026-09-07
**Source:** Phase 161 plan 16 (161-REVIEW.md WR-06; stated as a residual in the guard's module docblock)
**Effort:** ~1 plan — a corpus-axis change with a 500-file blast radius, plus a fixture pair

## What

`checkOutsideSource` in `scripts/assert-project-scoped-queries.mjs` runs the boundary check and the
Edge Function invocation check and nothing else. Checks 6 (escape hatches) and 8 (the schema hop)
run over the adapter corpus only, so at an address outside `apps/frontend/src/lib/api/adapters/supabase`
these are unreported:

```
locals.supabase['from']('elections')          computed member on the client
locals['supabase'].from('elections')          computed key on the receiver
locals.supabase.schema('public').from('x')    a table behind a mid-chain call
```

Measured against the live declarations, not inferred. The gate spec disposes all three of the
boundary matcher's computed cells as `residual` and pins the phrase
"the computed spellings at that address are unreported" to the module docblock, so the limitation
is stated and measured — but not closed.

**Update 2026-09-07 (plan 161-17).** The Edge Function INVOCATION surface is now CLOSED over both
corpora and is out of this todo's remaining scope. `COMPUTED_INVOKE_RE` and `COMPUTED_FUNCTIONS_RE`
read the computed spellings of `functions` and `invoke`, and they live in
`checkEdgeFunctionInvocations` — the one per-source check both `checkSource` and `checkOutsideSource`
call — so they run at the boundary address as well as the adapter one, with five committed violating
shapes in `outside-boundary.violation.fixture.ts` and exact per-message counts. The three shapes this
todo enumerates above are UNTOUCHED by that change: none of them is an invocation, and
`COMPUTED_ACCESS_RE` / `COMPUTED_RECEIVER_RE` / `SCHEMA_HOP_RE` still run over the adapter corpus
alone. **This todo stands as written.**

## Why it is not done here

Plan 161-16's file set is the gate spec, the guard's docblock and `.gitignore`. Running two more
checks over 550 files is a behaviour change to the guard with a real chance of finding live sites,
and the phase's evidence for "no file under `apps/` changed" — which is what lets its closing E2E
run stand — depends on not making one. It also needs its own fixture pair: the outside fixtures are
kept separate from the adapter ones precisely because the same call means different things at the
two addresses, so each new rule needs a violating shape and a clean control written for the outside
corpus specifically.

## What would make it worth doing

Any of: a real computed or schema-hop access appearing outside the adapter directory; the
`ADAPTER_BOUNDARY_ALLOWLIST` in `apps/frontend/eslint.config.mjs` growing (those nine files are
permitted `.supabase` member access, so check 9 is the only thing between them and a table); or a
second adapter surface being added, which would make "outside the adapter directory" a much larger
share of the tree.

## Scope when picked up

1. Add `checkEscapeHatches` and `checkSchemaHop` to `checkOutsideSource`. `COMPUTED_ACCESS_RE`
   already anchors on the bare identifier, so it works out here unchanged; `COMPUTED_RECEIVER_RE`
   anchors on `this` and would need widening or an explicit statement that it stays adapter-only.
2. Add the violating shapes to `outside-boundary.violation.fixture.ts` and controls to
   `outside-boundary.clean.fixture.ts`, and raise the exact counts.
3. Measure the live corpus BEFORE the rules land: a repository-wide search for each shape, so the
   change is known to cost no live call site (or the sites are fixed first).
4. Change the boundary matcher's three computed cells in the gate spec's matrix from `residual` to
   `matches`, and delete the corresponding residual phrase from the module docblock's stated-residual
   list. The gate spec asserts the list length, so both halves must move together.
