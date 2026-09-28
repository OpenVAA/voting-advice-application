# The binding rule reads only an initialiser that begins with the receiver — in both directions

**Filed:** 2026-09-07
**Source:** Phase 161 plan 16 (161-REVIEW.md WR-02 and IN-01; stated as a residual in the guard's module docblock)
**Effort:** ~1 plan, and it needs its near misses written before the widening lands

## What

`CLIENT_BINDING_RE` requires the receiver to follow the `=` directly
(`=\s*(?:await\s+)?this\s*\??\.\s*#?supabase\b(?!…)`). Measured at the live declaration:

```
const db = this.supabase;                    reported   (the committed alias shape)
const db = this.supabase ?? fallbackClient;  reported   (the committed nullish-coalesced shape)
const db = other ?? this.supabase;           NOT reported
const db = cond ? this.supabase : other;     NOT reported
const hasClient = this.supabase ? 1 : 0;     reported as "aliases the raw client"
```

The rule is wrong in both directions at once. The third and fourth are genuine aliases of the raw
client — the exact shape check 6 exists to forbid — and neither is seen. The fifth binds nothing and
is reported anyway, so the message is a false statement about the site.

All four are asserted in `packages/dev-seed/tests/projectScopingGate.test.ts`, and the phrase
"the binding rule reads only an initialiser that begins with the receiver" is pinned to the guard's
module docblock, so neither half can drift from the other without a test failure.

## Why it is not done here

Plan 161-16 changes prose and tests, not matchers — its own `<fails_when>` treats any movement in the
guard's committed counts as evidence a matcher was edited. Widening the initialiser is a matcher
change, and a consequential one: `/(?<![=!<>])=(?:[^;\n]*?)\bthis\s*\??\.\s*#?supabase\b(?!\s*(?:\?\.|[.[(]))/g`
newly reads `this.supabase.from('x')` inside a longer initialiser, which check 1 already reports —
so the widening has to be landed together with the near-miss fixtures that keep the two rules from
double-reporting one site. The false positive needs its own repair, which interacts with the same
trailing lookahead: the alias count in the self-test is a three-way discriminator on that lookahead's
content, and a fourth candidate spelling has to be measured against all three readings before it is
committed.

## What would make it worth doing

Either direction becoming live. A guarded source aliasing the client on the right of a `??` or a
ternary is an unreported escape hatch by this guard's own definition; a false "aliases the raw
client" on a ternary test is the kind of message that teaches a reader to distrust the guard, which
is worse than the finding.

## Scope when picked up

1. Measure each candidate lookahead against ALL FIVE shapes above plus the three committed alias
   fixtures, and record the readings the way the current three-way discriminator is recorded — the
   comment above the alias count states numbers that must be re-measured, not carried over.
2. Commit `const db = other ?? this.supabase;` and `const db = cond ? this.supabase : other;` to
   `violation.fixture.ts`, and `const hasClient = this.supabase ? 1 : 0;` to `clean.fixture.ts`.
3. Raise the exact alias count and the escape-hatch family tally together.
4. Add near-miss fixtures for the double-report risk: a longer initialiser containing a full table
   access, which check 1 already reports and the binding rule must not report a second time.
5. Delete the residual phrase from the module docblock's stated-residual list and the assertion that
   pins it. The gate spec asserts the list length, so both halves must move together.

## Note — 2026-09-07, after plan 161-18 (CR-02, the receiver-depth axis)

Three of this todo's standing facts changed. It is NOT closed: its LEFT-edge scope is untouched and
still open. What moved:

1. **The CHAIN-DEPTH axis is closed, so the remaining scope is the LEFT edge alone.** `CLIENT_BINDING_RE`
   was promoted in place to
   `/(?<![=!<>])=\s*(?:await\s+)?this\s*\??\.\s*#?supabase\b(?!(?:\s*\??\.\s*[A-Za-z_$][\w$]*)*\s*(?:\?\.\s*)?[([])/g`:
   the trailing lookahead now excludes an initialiser whose member chain TERMINATES IN A CALL rather
   than any directly-following member token. A binding one link along the chain
   (`const fns = this.supabase.functions;`) is therefore reported and counted. That closure came with
   its own cost, stated as a SIXTH residual — no source-level rule can tell a bound client sub-object
   from a bound SCALAR member, so `const restUrl = this.supabase?.restUrl;` is reported as an alias
   and for that site the message is false about what was bound.
2. **The three-way discriminator this todo's step 1 refers to is now a FOUR-way one, and its readings
   were re-measured.** Do not carry the numbers in this file, nor the ones in the pre-161-18 guard,
   into a later plan: the readings to measure a candidate against are the ones now recorded in the
   comment above the alias count in `scripts/assert-project-scoped-queries.mjs` — with no trailing
   lookahead 7 and 2; with a bare `?` in a character class 2 and 1; with the narrow pre-161-18
   lookahead 3 and 1; committed 5 and 2. The committed alias/destructure counts themselves moved
   3/1 -> 5/2.
3. **Step 5's residual phrase is one of SIX, not one of four.** `RESIDUAL_PHRASES` and the module
   docblock's `STATED RESIDUALS` bullet list both stand at six, and the gate spec asserts the two
   lengths against each other — so deleting the left-edge phrase must move both by one, to five.

Steps 2, 3 and 4 stand as written, with one arithmetic caveat: step 3's "raise the exact alias count
and the escape-hatch family tally together" now starts from `aliasCount === 5` and
`violationTally.escapeHatches === 14`, not from the 3 and 11 that were current when this was filed.
