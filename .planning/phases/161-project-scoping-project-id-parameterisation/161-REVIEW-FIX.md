---
phase: 161-project-scoping-project-id-parameterisation
fixed_at: 2026-09-07T11:35:00Z
review_path: .planning/phases/161-project-scoping-project-id-parameterisation/161-REVIEW.md
iteration: 1
findings_in_scope: 9
fixed: 9
skipped: 0
status: all_fixed
---

# Phase 161: Code Review Fix Report

**Fixed at:** 2026-09-07T11:35:00Z
**Source review:** `.planning/phases/161-project-scoping-project-id-parameterisation/161-REVIEW.md`
**Iteration:** 1
**`$PRE_FIX_HEAD`:** `ec4a00ece3f32bf53d2422afba5fa4dc9ae73249` (captured as the first action; every tree-hygiene check below is RANGED against it)

**Summary:**

- Findings in scope: 9 (CR-01, CR-02, CR-03, WR-01 … WR-06)
- Fixed: 9
- Skipped: 0
- Out of scope, deliberately not addressed: IN-01, IN-02, IN-03 (see "Info items" below)

All three Criticals were **reproduced against the current tree before fixing** and **re-run against
the committed tree after**, by this project's own method: append the shape, run the guard unpiped,
read the exit status, revert, prove `git status --porcelain scripts/` empty. Every assertion added
here was **driven red on purpose** before being trusted, and where the point was that nothing else
catches it, the red was required to be unique.

---

## Closing numbers, each beside the command that produced it

All five gates run **unpiped**, reading each gate's own exit status.

| Gate | Before | After | Exit |
|---|---|---|---|
| `node scripts/assert-project-scoped-queries.mjs --self-test` | `32 / 0 / 11 / 0` vs sites `32 / 8 / 11 / 2` | **`38 / 0 / 13 / 0`** vs sites **`38 / 8 / 13 / 2`** | 0 |
| `node scripts/assert-project-scoped-queries.mjs` | `5 / 0 / 5 / 5 / 2 / 7 / 550 / 1 / 0` | **`12 / 0 / 12`** / `5 / 2 / 7 / 550 / 1 / 0` | 0 |
| `yarn workspace @openvaa/dev-seed vitest run tests/projectScopingGate.test.ts` | 112 | **117** | 0 |
| `yarn test:unit` | 25/25 | 25/25 | 0 |
| `yarn lint:check` | all 18 links | all 18 links, 0 `[ERROR]` | 0 |

The live summary's **first three numbers moved and the rest did not**, and that split is the
acceptance criterion: `5 / 0 / 5 → 12 / 0 / 12` is CR-02 bringing the seven `utils/` helpers into the
corpus, and `5 raw client calls / 2 invocations / 7 sites / 550 outside / 1 outside site / 0
violations` staying byte-identical is the measurement that they reach no client and that CR-01's
punctuator widening reached no live adapter site.

### Every committed count that moved, and where

| Expectation | Before | After | Moved in |
|---|---|---|---|
| `violationCount` | 32 | **38** | `c407f8e28` (34), `7086d724f` (38) |
| `violationTally.accesses` | 8 | **9** | `7086d724f` |
| `violationTally.escapeHatches` | 14 | **17** | `c407f8e28` (16), `7086d724f` (17) |
| `violationTally.invocations` | 5 | **6** | `7086d724f` |
| `violationTally.schemaHops` | 5 | **6** | `7086d724f` |
| `destructureCount` | 2 | **4** | `c407f8e28` |
| `aliasCount` | 5 | 5 (unchanged) | — |
| `computedCount` | 5 | **6** | `7086d724f` |
| check-8 schema-hop violations | 5 | **6** | `7086d724f` |
| `outsideViolationCount` | 11 | **13** | `7086d724f` |
| check-9 boundary table reads | 3 | **4** | `7086d724f` |
| `cleanCount` / `outsideCleanCount` | 8 / 2 | 8 / 2 (unchanged) | — |
| `GUARDED_SOURCES` / adapter sources on disk | 5 / 5 | **12 / 12** | `7ba9f857e` |
| `RESIDUAL_PHRASES` / docblock bullets | 6 / 6 | **9 / 9** | `b878db48c` (7), `7ba9f857e` (8), `7086d724f` (9) |
| Gate spec tests | 112 | **117** | across five commits |

**Every count moved in the SAME commit as the behaviour that moved it**, and
`node scripts/assert-project-scoped-queries.mjs` **exits 0 at every one of the seven commits** —
measured, by checking out each commit's guard, fixtures and gate spec in turn and running it. No
intervening commit is red.

### Ranged tree hygiene

```
git diff ec4a00ece..HEAD --stat -- apps/                  -> 0 bytes (EMPTY)
git diff ec4a00ece..HEAD --stat -- package.json yarn.lock -> 0 bytes (EMPTY)
```

`apps/` is untouched across the whole pass. CR-01 names 54 live `!.` occurrences under
`apps/frontend/src` and CR-03 names a live shape at `supabaseAdapter.ts:49-51`; **neither was
edited**. The guard was widened and the residual stated instead.

---

## Fixed Issues

### CR-01 + WR-02: TypeScript's non-null assertion, and a vocabulary closed only over question marks

**Files modified:** `scripts/assert-project-scoped-queries.mjs`,
`packages/dev-seed/tests/projectScopingGate.test.ts`,
`scripts/fixtures/project-scoped-queries/violation.fixture.ts`,
`scripts/fixtures/project-scoped-queries/outside-boundary.violation.fixture.ts`
**Commit:** `7086d724f`
**Fixed together**, as the review requires — repairing either alone leaves the other free to admit
the fifth spelling the same way.

**Reproduced first.** Five shapes appended to `violation.fixture.ts` — non-null table read, non-null
undispositioned Edge Function invocation, non-null schema hop, parenthesised receiver, and a
parenthesised-receiver alias — left **every committed count byte-identical at exit 0**. Confirmed.

**Applied fix.** One token widening per position rather than a fourth form beside the existing one:

```
member operator     \??\.          ->  [!?]?\.
computed-or-call    (?:\?\.\s*)?   ->  (?:\?\.\s*|!\s*)?
```

at every position of all nine matchers, mirrored in `PUNCTUATOR_TOKENS`. **This is a deliberate
adaptation of the review's suggested fix, and the reason matters.** The review proposed adding
`{ form: 'non-null-member', token: '!?\\s*' }` as a FOURTH token form. Measured, that creates
roughly seventeen new cells across the nine matchers, each of which the harness then requires to be
load-bearing or exempt — seventeen new fixture shapes, and a bridge (`links` vs `tokens`) that no
longer balances. One widened token keeps the existing cells exactly where they are, leaves the
bridge untouched, and moves no cell count.

**The closure is by construction, not by hand-enumeration.** The matrix's kind/spelling split already
models "the same position spelled differently", so `non-null` joins `plain` and `optional` as a third
**spelling**: every generated cell is now rendered in three spellings and every disposition arm says
what the third one does. A position a future matcher admits `.` and `?.` at but not `!.` is a named
failure per cell.

**Demonstrated red.** Narrowing ONE position of `ACCESS_RE` back to the JavaScript-only set:

```
× enumerates four cells in the access matcher, in declaration order
× admits no punctuator in ACCESS_RE outside the three enumerated token forms
× disposes every generated cell of ACCESS_RE
    -> ACCESS_RE.receiver-to-client.member non-null: expected false to be true
× bridges ACCESS_RE's admitted positions to its enumerated tokens
× disposes every generated cell of COMPUTED_RECEIVER_RE
```

**WR-02.** The closure assertion was `not.toContain('\\?')` — closed only over question marks. It
measured the three enumerated forms against themselves rather than the matcher against the language,
so any admission not spelled with `?` passed silently, **including the `!?\s*` form the review itself
proposed**. It now reads both punctuator characters, which requires reducing the residual first: a
literal `?` is spelled `\?` (an unescaped one is a quantifier and must not be flagged), while a
literal `!` is spelled bare — and so is the `!` in a lookaround opener `(?<!` / `(?!` and in a
character class `[=!<>]`, both of which two committed matchers carry. `literalResidualOf` removes the
regex structure (escapes preserved, character classes dropped, group and assertion openers dropped).
Measured clean on all nine matchers and against three counterfactual fourth-form admissions.

**Demonstrated discrimination**, on a `!`-only admission containing no `\?` anywhere:

```
new assertion -> RED,   "ACCESS_RE admits a literal '!' outside the enumerated forms"
old assertion -> GREEN, 1 passed | 114 skipped
```

**Held by counts as well as by the matrix**: six committed violating shapes — four in the adapter
corpus (table read, schema hop, invocation, and a computed member spelling the assertion before a
BRACKET rather than a dot) and two at the boundary address — each pinned by a declaration-anchored
presence assertion.

**The parenthesised receiver** is the decision the review asked for explicitly. It is a **stated
residual, measured**: all five matchers are asserted not to read `(this.supabase).from(...)`, with
the unparenthesised shape asserted read as the instrument. A parenthesis is not a punctuator — it is
the receiver's expression grammar, and widening the receiver is the one widening this guard declines
on principle. No live instance (grep).

The `SCHEMA_HOP_RE` "closed set fixed by the language" paragraph is corrected in the same edit, as
the review requires. It is on its second round of this correction, and the word wrong both times is
**which language**.

**Re-run against the committed tree:** adapter corpus **EXIT 1, 5 expectations FAILED**; boundary
corpus **EXIT 1, 2 expectations FAILED**. Tree clean after each.

### CR-02: `adapters/supabase/utils/**` in neither corpus

**Files modified:** `scripts/assert-project-scoped-queries.mjs`,
`packages/dev-seed/tests/projectScopingGate.test.ts`
**Commit:** `7ba9f857e`

**Reproduced first.** A probe at `utils/zzProbe.ts` carrying `this.supabase.from('elections')`, a raw
`client.from('elections')` and an undispositioned Edge Function invocation produced
`5 / 2 / 7 / 550 / 1 / 0` at **exit 0** — byte-identical to the clean run, and not even reported as an
undeclared adapter source. Confirmed.

**Applied fix.** Both walks now descend into `utils/`, and the seven helpers are declared in
`GUARDED_SOURCES`. **The review's key point is addressed directly:** the gate spec's
`adapterSourcesOnDisk()` mirrored the identical skip, so "two derivations of one set" was two copies
of one blind spot. Both skips are gone, and a new assertion walks the frontend source tree **once**
and holds the union of the two corpora against it minus a **written** exclusion predicate.

Measured: **12 + 550 = 562 = 799 total `.ts`/`.svelte` − 237 tests/specs/type-only/ambient**, with
**zero overlap**. An exclusion added to either walk and not to the predicate stops the partition
closing.

**Closed by construction as well as by the assertion:** declaring the seven in `GUARDED_SOURCES`
means re-adding the skip turns them into stale declarations and the guard exits 1 naming all seven.
Demonstrated. Re-adding the skip to the spec's own walk reddens the partition case. Also
demonstrated.

**Re-run against the committed tree:** **EXIT 1**, `'…/utils/zzProbe.ts' issues adapter calls but is
in neither GUARDED_SOURCES nor DEFERRED_SOURCES`, 13 on disk vs 12 guarded, with the gate spec
reddening independently on two cases.

### CR-03: a client held in a parameter, uncounted and unnamed

**Files modified:** `scripts/assert-project-scoped-queries.mjs`,
`packages/dev-seed/tests/projectScopingGate.test.ts`
**Commit:** `b878db48c`
**Disposition: STATED, which the review names as acceptable.**

**Reproduced first.** `paramHeldClientTableRead` appended to `violation.fixture.ts` left the
self-test byte-identical at exit 0. Independently confirmed the reviewer's supporting claims: the
"5 raw client calls" are five `.rpc(` sites and **zero** `.from(` sites, and
`supabaseAdapter.ts:50 return client.from(table);` is the only raw project-scoped `.from(` in the
guarded corpus (`:294` is a storage bucket).

**Why stated rather than closed.** Closing it means forbidding the hand-off with a matcher on
`<function>(this.supabase`, and that matcher reports the **live** call site
`tableBuilder(this.#supabase, table)` — so the prohibition cannot land without first moving
`tableBuilder` onto the mixin, which is an `apps/` change this pass is barred from, and would leave
`lint:check` red in the meantime. Today's site is not a leak: `scopedFrom` appends
`.eq('project_id', projectId)`.

**Measuring it corrected the fix.** The residual was first written saying the shape is past two
matchers, with `BOUNDARY_ACCESS_RE` described as wide enough to read it but running over the wrong
corpus. The new gate-spec case **failed on that assumption**: the boundary rule anchors on a receiver
whose identifier contains `supabase`, and the live parameter is called `client`, so it misses the
shape **twice over** — on the name and on the corpus. Both halves are now asserted, with the
discriminator (rename the parameter `supabaseClient` and the boundary rule reads it) so no reader can
conclude parameters as such are covered at the boundary address.

The check-6 docblock's "no legitimate need for any of the six" sentence named the getter and stopped;
that clause is deleted and replaced with the counter-example itself, read **off disk by content
anchor** (never by line number), with the pattern checked to discriminate against three
counterfactuals.

### WR-01: two — in fact five — negative controls that cannot go red

**Files modified:** `packages/dev-seed/tests/projectScopingGate.test.ts`
**Commit:** `e8beb9ba2`

The presence assertion was `toContain(shape)` over the fixture's whole text, and every control's name
also appears in prose. **Re-ran 161-19's deletion sweep over all twenty entries**, as the review asks,
rather than repairing the two it named:

```
all 20 still controls        guard summary byte-identical at exit 0 for every one
un-held by `toContain`       5 of 20, not 2:
                               clean :: destructuredCallResult          (named by review)
                               clean :: scopedFrom                      (NEW)
                               outside-boundary.clean :: bucketUpload   (named by review)
                               violation :: scopedFrom                  (NEW)
                               violation :: scopedTableRead             (NEW)
caught by the declaration    20 of 20
```

The three extra are why the review asked for the sweep rather than for the two repairs.

**Demonstrated red.** Deleting the whole `destructuredCallResult` method from `clean.fixture.ts`,
leaving the name only at line 25: the guard's self-test stays at **EXIT 0** (it IS a control; nothing
else sees it) while the gate spec goes **1 failed | 111 passed**, naming the shape.

### WR-03 + WR-04: an impossibility that was a decision, over a class that was not one site

**Files modified:** `scripts/assert-project-scoped-queries.mjs`,
`scripts/fixtures/project-scoped-queries/violation.fixture.ts`,
`packages/dev-seed/tests/projectScopingGate.test.ts`, plus a new todo
**Commit:** `1dbe567ed`
**Fixed together** — IN-03 warns explicitly that they rewrite the same sentence and must not be
sequenced as independent.

The claim "no source-level rule can tell a bound client SUB-OBJECT from a bound SCALAR member" is
false in this guard's own house style, and it was used to authorise moving a known false positive out
of the negative corpus. A `CLIENT_SUB_OBJECTS` map does exactly that at source level, as
`NON_PROJECT_SCOPED_TABLES` already does for a table literal. **The move itself stands**, re-checked
rather than taken on the corrected claim: `destructuredCallResult` is still in `clean.fixture.ts`,
still contributes zero counted sites, still asserted unreported.

WR-04's "that one site" singularised an unbounded class — every
`const x = this.supabase.<scalar-member>;` a guarded source ever writes.

**Demonstrated red.** Reworded in the guard alone: `× states exactly the residuals the matrix pins`
and `× reports a bound scalar member of the client as an alias` — 2 failed | 110 passed.

**Actually declaring the map is deferred, explicitly and with its cost written down**, per the fix
prompt's instruction to say so rather than leave the false claim standing. It is a behaviour change
that moves four committed counts and deletes a residual. Filed at
`.planning/todos/pending/2026-09-07-declare-a-client-sub-objects-disposition-map.md`.

### WR-05: a back-check conditional on a naming convention nothing enforces

**Files modified:** `packages/dev-seed/tests/projectScopingGate.test.ts`
**Commit:** `44ff006a7`

The scan was `^const ([A-Z][A-Z0-9_]*_RE) =`. The discriminator is now the **initialiser** — `=`
followed by a regex literal — which drops the suffix dependency. **Adapted from the review's
suggestion:** its `= \/` (a literal space) silently drops `CLIENT_BINDING_RE` and
`BOUNDARY_ACCESS_RE`, both of which wrap their literal onto the next line. `=\s*\/` names the same
eleven constants as the committed form on the unmutated guard.

**Demonstrated red**, on the mutant the old form could not see —
`const NON_NULL_ACCESS = /this\s*\??\.\s*probe/g`:

```
new derivation -> RED,   "NON_NULL_ACCESS is an unenumerated matcher"
old derivation -> GREEN, 1 passed | 111 skipped
```

### WR-06: a multi-line — and a nested — destructure in the wrong family

**Files modified:** `scripts/assert-project-scoped-queries.mjs`,
`scripts/fixtures/project-scoped-queries/violation.fixture.ts`,
`packages/dev-seed/tests/projectScopingGate.test.ts`
**Commit:** `c407f8e28`

**Reproduced first, and found a second instance the review did not name.** At the committed
declaration: single-line `destructured? true`, wrapped `false`, **nested
`const { a: { from } } = this.supabase;` also `false`** — `[^{}]*` cannot cross the inner braces.

`DESTRUCTURING_LHS_RE` is replaced by `bindsByDestructuring`, which decides by brace **balance** from
the `=` leftward. A function rather than a regex because balance is not a regular property — which is
exactly why the pattern it replaces got the nested case wrong.

**Demonstrated red**, and the shape of the red is the finding:

```
reverting to the line-scoped read:  alias 5 -> 7, destructure 4 -> 2
                                    pooled total 34, UNMOVED
```

The pooled total staying intact is what says the two-family split is the thing that catches this, and
that a pooled assertion never would — which is the rationale the separate pins were written for, now
actually true.

---

## Two places the measurement disagreed with the review

Recorded because this phase's whole history is about claims not independently re-derived. **Neither
contradicts a finding**; both make one larger.

1. **WR-01 names two un-held controls; the sweep it asks for finds five.** `clean :: scopedFrom`,
   `violation :: scopedFrom` and `violation :: scopedTableRead` are also satisfied by prose after
   their declarations are deleted. The review anticipated this — it warns that `grep -c` alone will
   not separate them — which is why it asked for the sweep rather than the two repairs.
2. **WR-06 names one misclassified shape; there are two.** The nested pattern fails for a reason
   independent of where the line breaks fall, and is now a committed fixture shape.

And one place a **fix's own first draft was wrong**, caught by insisting the residual be measured:
CR-03's residual initially said the shape is past two matchers. `BOUNDARY_ACCESS_RE` misses it twice
over — the receiver name and the corpus. The docblock now says so, and says that the first half was
assumed false while the fix was being written and that the measurement is what corrected it.

---

## Info items — deliberately not addressed at this scope

`IN-01`, `IN-02` and `IN-03` were **out of scope** per the fix brief and were not fixed as findings.
Two of the three are nonetheless no longer standing as written, because CR-02's honest closure could
not leave them:

- **IN-01 (`.js`/`.mjs` never walked)** — **not fixed**; the corpus still reads only `.ts` and
  `.svelte`. But the exclusion is no longer *silent*, which the enumerator's own docblock forbids
  ("an exclusion list is where coverage quietly leaves", and this one carried no reason). It is now
  the guard's **eighth stated residual**, MEASURED: all 601 such files live under `lib/paraglide/`,
  asserted, so a hand-authored `.js` reddens by name. Demonstrated. **Widening the corpus to walk
  them remains open.**
- **IN-02 (check-9 reach statement false at two addresses)** — the sentence is corrected. CR-02
  closes the `utils/` address; the `.js`/`.mjs` address is now named in the sentence and pinned as
  the residual above, which is precisely what IN-02 asks for when one address is left open.
- **IN-03 (todo amendments check out; one sequencing nuance)** — **no change made**, and none was
  required. Its nuance was honoured: WR-03 and WR-04 were landed in ONE commit rather than sequenced
  as independent. **Follow-up left open:** IN-03 suggests both
  `.planning/todos/pending/` amendments should gain a dated note now that CR-01/CR-02/CR-03 have
  landed, and CR-03 in particular overlaps the binding-rule todo's territory without being covered by
  it. That note was not written, to keep this pass inside its stated scope.

---

_Fixed: 2026-09-07T11:35:00Z_
_Fixer: Claude (gsd-code-fixer)_
_Iteration: 1_
