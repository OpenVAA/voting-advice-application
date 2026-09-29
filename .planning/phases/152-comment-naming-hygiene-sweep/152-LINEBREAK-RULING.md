# D-A4 forced-line-break sweep — OPERATOR RULING

> **Status:** ruled 2026-08-28, ahead of wave 6, at the operator's request.
> **This file is the INPUT to `152-14` Task 1.** Task 1 does not re-open the decision; it
> re-runs the instrument for live figures, confirms they do not materially contradict the
> figures this ruling was made on, and folds this ruling into `152-LINEBREAK-DECISION.md`.
> If the live figures DO materially contradict them, Task 1 stops and re-raises — a ruling
> made on stale numbers is not a ruling on the real thing.

## Ruling

**Option (b) — D-A4 verbatim for detection, with the structural categories codified as
constants in the committed script.**

The operator left the box unticked and supplied notes rather than an overrule. Per the
project's standing discussion convention (*unchecked = the ★ RECOMMENDED option wins;
boxes are ticked only to overrule*), option (b) carries.

Option (c) (gratuitous-only, join ≤ 120 chars) is **rejected**, and the operator's own
first note is the reason: (c)'s entire rationale was consistency with the 120-character
maximum declared in `.editorconfig`, and the operator has stated that maximum is not
expected to apply here. With that rationale removed, (c) buys a smaller merge surface at
the cost of leaving the reviewers' six cited sites unfixed while criterion 1 reads green
— which was always its disqualifying cost.

Option (a) is rejected as strictly dominated by (b): same 14,094-line edit, same effort,
same outcome, but without the codified exclusions the guard is unkeepable.

Option (d) was already unavailable per D-N1(c).

### Figures this ruling was made on (from `152-RESEARCH.md` § 1.1)

| Quantity | Value |
|---|---:|
| Wrapped-prose comment lines (the target class) | 14,094 |
| Wrapped paragraphs | 5,550 |
| Files touched | 747 |
| Share of the 34,885-line non-blank comment corpus | ~40% |
| Structural lines excluded (banner 1,418 · list 1,258 · JSDoc 429 · hanging 567 · tables 34) | 3,706 |
| Cross-phase collision (files cited by phases 153–160 inside this surface) | 59 of 94 (63%) |

## Amendment 1 — paragraph breaks are a NAMED rule, not an incidental line

Operator note, verbatim:

> *"When doing the sweep, note that paragraph breaks are allowed, i.e. 2 consecutive
> linebreaks with the same indent."*

A blank comment line terminates the paragraph. The sweep MUST NOT join across one:

```
// first paragraph ends here
//                                <- paragraph break: never join across this
// second paragraph starts here
```

**This behaviour is already present** in the reference predicate at `152-RESEARCH.md`
§ 1.1, as the line `if (!cur.content.trim() || !nxt.content.trim()) continue;`. The
amendment is therefore **not a behaviour change** — it is a promotion of an incidental
implementation detail to a first-class, named, fixture-tested rule, so that it cannot be
lost in a refactor of `unwrap-comment-paragraphs.mjs`.

Required in `152-14` (and in `152-02`'s instrument if it is built before this is read):

- The blank-comment-line guard is a **named constant / named predicate** sitting with the
  other five codified exclusions, carrying a comment identifying it as the paragraph-break
  rule and citing this ruling.
- It is covered by a **committed fixture pair** (input + expected-violations) proving that
  two paragraphs separated by a blank comment line produce **zero** violations at the
  junction, while the same two paragraphs with the blank line removed produce one.
- It is listed in the dry-run report's excluded-category counts alongside banner rules,
  list items, JSDoc tags, hanging indents and comment tables.

## Amendment 2 — `.editorconfig` is NOT modified

Operator note, verbatim:

> *"the 120 max in editorconfig can be removed"* … then, on being shown what it controls:
> *"Just note that we don't expect it to apply to anything."*

`.editorconfig` is **left byte-identical**. The removal was proposed on the premise that
`max_line_length = 120` is an editor hint. It is not:

- `prettier.config.mjs` re-exports `@openvaa/shared-config/prettier`.
- That config sets **no `printWidth`**, and its own header comment reads: *"See also
  `.editorconfig` for settings that `prettier` parses for defaults."*
- Therefore `max_line_length = 120` **is** this repository's Prettier `printWidth`.
  Deleting it drops `printWidth` to Prettier's default **80** and reformats every TS and
  Svelte file in the monorepo — a diff far larger than this sweep — turning `format:check`
  red immediately.

**What is recorded instead, which is what the note actually asked for:** the 120-character
maximum is **not expected to apply to anything this sweep produces**, and it does not.
Prettier does not reflow comments (proven by running the repo's own installed binary
against a 302-character comment, which survived byte-identical), and there is no ESLint
max-length rule anywhere in the shared config. Long joined comment lines — median 185,
p90 418, max 1,780 — already pass both `lint:check` and `format:check` today. The declared
120 maximum never constrained comments and was never an obstacle to this sweep.

A later reader finding a 400-character comment line should therefore read it as
**sanctioned by this ruling**, not as a violation of the declared maximum.

If code line-width is ever to be freed, that is a separate decision and must pin
`printWidth` explicitly in `packages/shared-config/prettier.config.mjs` FIRST, so that
removing the `.editorconfig` line cannot silently mean 80.

## Unchanged by this ruling

Every prohibition in `152-14-PLAN.md` stands, in particular:

- **No dash rule**, anywhere — not in the sweep, the instrument, or the guard. The two
  ESLint disable directives in `apps/frontend/src/hooks.server.ts` and
  `apps/frontend/src/hooks.ts` must be byte-identical afterwards.
- The five structural exclusions are **codified constants, never flags or an ignore file**.
- A line-1 `#!` shebang is never a comment-span start.
- The identity-callback disclosure comment is joined with **every word of its meaning kept**,
  recorded verbatim before and after.
- The adapter base-object comment is **joined only**, left semantically unchanged for Phase 157.
- The sweep lands as a **small number of large, coherent commits** (≤ 3 over `apps packages tests`).
- `assert-comment-only-diff.mjs` over the sweep range must report zero non-comment byte
  changes with **zero** allow entries.

---

## Live-figure confirmation — resolved 2026-08-28 by `152-02`, ahead of `152-14`

This ruling was made on `152-RESEARCH.md`'s figures, and instructed `152-14` Task 1 to stop
and re-raise if the live instrument materially contradicted them. **It does not.** `152-02`
built `unwrap-comment-paragraphs.mjs` and ran it against the live tree:

| Quantity | Ruling (research) | Live (`152-02`) | Delta |
|---|---:|---:|---:|
| Wrapped-prose junctions | 14,094 | 14,171 | +0.55% |
| Wrapped paragraphs | 5,550 | 5,576 | +0.47% |
| Files | 747 | 742 | −0.67% |

All three agree to within **0.7%**. The re-raise condition is **NOT triggered**: `152-14`
Task 1 should record this confirmation and proceed to Task 2 under option (b) without
returning to the operator.

**Amendment 1 is implemented and proven.** `PARAGRAPH_BREAK` is a named constant beside the
five structural exclusions, cites this ruling, carries its own report row (**4,201 junctions**
excluded), and is proven by a committed fixture pair whose two inputs differ by exactly one
line: 0 violations with the blank comment line present, 1 violation with it removed.

**Amendment 2 stands unchanged** — `.editorconfig` is untouched.
