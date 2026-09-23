# Declare a `CLIENT_SUB_OBJECTS` disposition map, so a bound scalar member is not reported as an alias

**Filed:** 2026-09-07
**Source:** Phase 161 `161-REVIEW.md` WR-03 (the claim it corrects), raised while fixing that finding
**Effort:** ~1 plan — a seventh mandatory-disposition list, with an arrival check, fixtures and mutation cells of its own

## What

`CLIENT_BINDING_RE` decides from the member NAME alone. `= this.supabase.functions;` (a client
SUB-OBJECT, which reaches every table the client does) and `= this.supabase.restUrl;` (a plain
SCALAR) are the same source shape, so the promoted rule that reports the first necessarily reports
the second. The second is a false positive, and it is committed as a violating fixture shape
(`boundClientMemberRead`) and stated as the guard's sixth residual.

A `CLIENT_SUB_OBJECTS` disposition map would separate them at source level, with no type
information, exactly the way this guard already resolves the same class of question four times over:

| Existing list | Decides |
|---|---|
| `PROJECT_SCOPED_TABLES` / `NON_PROJECT_SCOPED_TABLES` | whether a table literal needs a project filter |
| `PROJECT_SCOPED_RPCS` | whether an rpc carries a project term |
| `PROJECT_SCOPED_EDGE_FUNCTIONS` | whether an invoked function is scoped |

The Supabase client's sub-object surface is small, closed and stable — `auth`, `functions`,
`storage`, `rest`, `realtime`, `schema` — so the map is enumerable rather than open-ended, and an
unrecognised member becomes a HARD FAILURE on arrival (as a new table literal is under check 2)
rather than a silent pass.

## Why it is not done in the fix pass that filed this

The fix pass' scope was the review's findings. WR-03's finding is that the artifact recorded a
**design tradeoff as an impossibility** — the check-6 docblock read "no source-level rule can tell a
bound client SUB-OBJECT from a bound SCALAR member", and used that to authorise moving a
known-false-positive shape out of the negative corpus. That claim is now corrected in the guard, in
the fixture docblock and in the gate spec, and the residual now says the map is undeclared rather
than impossible.

Actually declaring it is a behaviour change, not a prose one, and it moves several committed counts:

- `boundClientMemberRead` moves back to `clean.fixture.ts` — `violationCount` 32 → 31,
  `violationTally.escapeHatches` 14 → 13, `aliasCount` 5 → 4, `cleanCount` 8 → 9
- the sixth `STATED RESIDUALS` bullet is DELETED — `RESIDUAL_PHRASES` and the docblock bullet count
  move together, and the case pinning it in both directions has to move with them
- a new arrival check needs its own violating fixture shape (a bound member on neither list), its own
  exact self-test count and its own message
- `MATCHER_NAMES` / `CALL_SHAPES` / the mutation harness gain whatever the new rule declares

That is a plan. What this repository's standard forbids — and what has been fixed — is recording the
tradeoff as an impossibility: "a residual cannot be stated without being measured", and an
unfalsifiable "no rule can" is not a measurement.

## Verification when it lands

- `node scripts/assert-project-scoped-queries.mjs --self-test` — unpiped, at the moved counts, with
  every expectation changed in the SAME commit as the behaviour that moved it
- `const restUrl = this.supabase?.restUrl;` NOT reported; `const fns = this.supabase.functions;`
  still reported and still counted in the escape-hatch family
- `const x = this.supabase.somethingNobodyDispositioned;` a HARD FAILURE naming the member
- `destructuredCallResult` still unreported in `clean.fixture.ts` — the near-miss control the whole
  promotion turns on
- `yarn lint:check` and `yarn test:unit`, both unpiped, at every commit boundary
