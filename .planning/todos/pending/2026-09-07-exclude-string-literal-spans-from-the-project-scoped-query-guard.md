# Exclude string and template literal spans from the project-scoped query guard

**Filed:** 2026-09-07
**Source:** Phase 161 plan 16 (161-REVIEW.md IN-02; stated as a residual in the guard's module docblock)
**Effort:** ~1 plan, most of it in the shared classifier rather than in the guard

## What

`scripts/assert-project-scoped-queries.mjs` excludes COMMENT spans from both corpora, through the
repository's shared classifier in `scripts/lib/comment-spans.mjs`, so a docblock quoting a forbidden
shape to explain it is not read as one. It excludes STRING spans from neither. So this is reported
as a live violation:

```ts
const message = "never write this.supabase.from('elections')";
```

Measured: every one of the seven matchers matches its own canonical shape when that shape is quoted
inside a double-quoted string. The gate spec asserts exactly this and pins the phrase "a forbidden
shape quoted inside a string literal is read as live code" to the guard's module docblock, so the
residual is stated and measured rather than left for a reader to find.

## Why it is not done here

It is a false POSITIVE rather than a false negative, so it costs a reader an explanation rather than
costing the repository a leak — the opposite direction from every other finding this phase has
closed, and the safe one to leave standing. It also belongs in the shared classifier rather than in
this guard: three other `assert-*.mjs` gates consume `commentSpans`, and adding a fourth hand-rolled
span reader here is the duplication that classifier exists to prevent. Changing the shared classifier
is a change to every consumer of it, which is a larger blast radius than this phase's file set.

## What would make it worth doing

A real site tripping it. Today no guarded source and no source in the outside corpus quotes a
forbidden shape in a string, so the residual costs nothing; the first time somebody writes an error
message or a code sample containing one, the guard reports a violation the author cannot act on, and
the pressure will be to add an exception rather than fix the classifier.

## Scope when picked up

1. Extend `scripts/lib/comment-spans.mjs` to yield string and template spans alongside comment spans,
   behind an option so existing consumers are unaffected until they opt in.
2. Have `commentMapOf` in the guard request them, and confirm the self-test's exact counts do not
   move — the fixtures contain quoted shapes in their docblocks already.
3. Add a fixture shape that quotes a forbidden call inside a string literal to `clean.fixture.ts` as
   a positive control, and raise its expected site count.
4. Delete the residual phrase from the module docblock's stated-residual list and the assertion that
   pins it in the gate spec. The spec asserts the list length, so both halves must move together.
