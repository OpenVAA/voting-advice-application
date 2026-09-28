# D-A4 forced-line-break sweep — THE DECISION

> **Status:** decided. **Chosen option: (b) — D-A4 verbatim for detection, with the five
> structural categories codified as constants in the committed script.**
>
> This file is the phase's own record of the ruling. Its INPUT is
> [`152-LINEBREAK-RULING.md`](./152-LINEBREAK-RULING.md), where the operator ruled ahead of
> wave 6. This file re-measures the live tree, confirms the ruling still stands on numbers
> from *this* tree rather than from a research document written several waves earlier, and
> records the figures `152-14` actually spent.

---

## 1. The situation, in one paragraph

D-A4's class definition is verbatim: *"a comment line that ends without terminal punctuation
**and** whose next line continues the same comment span at the same indent."* Taken literally
and run over every tracked file in `packages/**`, `apps/**` and `tests/**`, that definition
covers — per `152-RESEARCH.md` § 1.1 — **14,094 comment lines, in 5,550 wrapped paragraphs,
across 747 files**: about **40%** of the 34,885-line non-blank comment corpus, and **17×** the
planning-reference sweep this phase was scoped around. **No planning document for this phase
contains that figure.** `152-CONTEXT.md`, `.planning/ROADMAP.md` and `.planning/REQUIREMENTS.md`
all size the *planning-reference* class (817 in CONTEXT.md, re-measured at 888 citation lines /
948 occurrences / 642 spans) and say nothing at all about the size of the *forced-line-break*
class; ROADMAP criterion 1 says only that the scan "returns zero". The size was never measured
until `152-RESEARCH.md` measured it, which is why plan `152-14` opens with a decision checkpoint
rather than an edit. The reviewers meant the rule literally — all six sites they cited with
"remove line breaks" are ordinary hand-wrapped prose paragraphs, and the clearest of them
carries the reviewer's own word *"everywhere"* — Prettier will not reflow the joined result,
and no lint rule constrains the resulting line length.

---

## 2. Live figures, measured on this tree

Measured at `HEAD = 3e6158382` (after plans 01–13 landed), immediately before the sweep.

```bash
node .planning/phases/152-comment-naming-hygiene-sweep/scripts/unwrap-comment-paragraphs.mjs --report
node .planning/phases/152-comment-naming-hygiene-sweep/scripts/unwrap-comment-paragraphs.mjs --gratuitous-only --report
node .planning/phases/152-comment-naming-hygiene-sweep/scripts/unwrap-comment-paragraphs.mjs --self-test
```

### 2.1 `--report` (the sanctioned mode)

| Quantity | Live | Ruling (research § 1.1) | Delta |
|---|---:|---:|---:|
| Files scanned | 1,560 | — | — |
| Comment lines in scope | 45,491 | — | — |
| Wrapped-prose junctions — `apps` | 3,937 | — | — |
| Wrapped-prose junctions — `packages` | 4,057 | — | — |
| Wrapped-prose junctions — `tests` | 5,942 | — | — |
| **Wrapped-prose junctions — total** | **13,936** | 14,094 | **−1.12%** |
| **Wrapped paragraphs** | **5,549** | 5,550 | **−0.02%** |
| **Files** | **741** | 747 | **−0.80%** |
| Comment lines affected (junctions + paragraphs) | 19,485 | — | — |

Joined-length distribution: **p50 = 188, p75 = 281, p90 = 410, p99 = 688, max = 1,738**;
**4,584 paragraphs join to more than 120 characters.**

### 2.2 `--gratuitous-only --report` (option (c), had it been chosen)

| Quantity | Live | Ruling (research § 1.4) | Delta |
|---|---:|---:|---:|
| Junctions — `apps` / `packages` / `tests` | 539 / 353 / 273 | — | — |
| **Junctions — total** | **1,165** | ~2,400 lines | — |
| **Paragraphs** | **965** | 1,113 | **−13.3%** |
| Files | 419 | — | — |
| Joined length | p50 = 100, p90 = 117, max = 120, **over 120: 0** | — | — |

### 2.3 The structural exclusions — all six non-zero, all codified constants

| Row | Live count | Note |
|---|---:|---|
| `banner-rule` | 510 | |
| `list-item` | 1,296 | |
| `jsdoc-tag` | 429 | |
| `hanging-indent` | 449 | |
| `comment-table` | 34 | |
| `paragraph-break` | 4,190 | **Amendment 1** — a blank comment line ends the paragraph |
| `block-delimiter` | 868 | eligibility precondition, *not* one of the five ruled categories |

Every one of the five ruled categories, and the Amendment-1 rule beside them, fires with a
**non-zero** count on the live tree. They are named constants in
`unwrap-comment-paragraphs.mjs` — there is no runtime flag, no ignore file and no per-path
roster; excusing a case requires editing that file, so it is reviewed as the decision it is.
The instrument's `--self-test` passes: 2 fixtures + 10 edge cases, **0 failures**, including
the edge case asserting that a **line-1 `#!` shebang is never a comment-span start**.

> **On the `banner-rule` and `hanging-indent` rows differing from the research figures**
> (510 vs 1,418; 449 vs 567): these are not the same quantity. The committed instrument runs
> the terminal-punctuation test **first**, so each exclusion row counts only junctions that
> *would otherwise have been reported* — see the ORDERING section of the instrument's
> docblock, which made the rows comparable to `paragraph-break` deliberately. The research
> figures counted structural *lines*. Both are non-zero, which is the property the ruling
> required.

### 2.4 Live-figure confirmation — the re-raise condition is NOT triggered

`152-LINEBREAK-RULING.md` instructed `152-14` Task 1 to stop and return to the operator **only
if the live instrument materially contradicted** the figures the ruling was made on. It does
not. All three headline quantities agree to within **1.2%**, and the drift direction is
explained: this phase has landed **thirteen plans of comment edits** since the research
measurement, which necessarily moves the counts a little. A delta of ~1% is not a material
contradiction — a different order of magnitude, or a changed disposition, would be. The
decision therefore proceeds under option (b) without returning to the operator.

---

## 3. The options, as they were put

### (a) Implement D-A4 verbatim — un-wrap all 5,549 paragraphs

- **Cost:** 13,936 junctions across 741 files. Fully mechanical.
- **Consequence:** criterion 1 green exactly as written; all six reviewer-cited sites closed;
  comment lines average 188 characters with 4,584 paragraphs over the declared 120; a very
  large merge surface immediately before eleven downstream phases.
- **Why not:** strictly dominated by (b) — same edit, same effort, same outcome, but without
  the codified exclusions the resulting guard is **unkeepable**: a future author adding a
  JSDoc `@param` list would redden the build, and the pressure would be to weaken the guard
  rather than fix the comment.

### (b) ★ RECOMMENDED — D-A4 verbatim for detection, five structural categories codified as exclusion constants

- **Cost:** the same 13,936-junction edit and the same large merge surface as (a); the same
  very long joined comment lines.
- **Consequence:** identical outcome to (a) for identical effort, and strictly better as a
  standing guard — the structurally excluded junctions never appear as violations. Faithful
  to D-A4's text and compatible with D-N1's requirement that the gate be live. **The
  exclusion set is required under (a) anyway and is already built, so no work is wasted
  whichever way this is ruled.**

### (c) Narrow the rule to a *gratuitous* break — flag only where the joined result still fits within 120 characters

- **Cost:** 1,165 junctions in 965 paragraphs instead of 13,936 — a much smaller merge
  surface for phases 153–164.
- **Consequence:** **does not close the reviewers' six cited sites**, several of which join to
  over 400 characters. Criterion 1 would read green while the reviewed defects survive.
- **Why not:** (c)'s entire rationale was consistency with the 120-character maximum declared
  in `.editorconfig` — and the operator has stated that maximum **is not expected to apply
  here** (see § 5). With its rationale removed, (c) buys a smaller merge surface at the price
  of leaving the reviewed defects unfixed behind a green gate, which was always its
  disqualifying cost.

### (d) Enforce from a baseline; sweep only the reviewed sites — UNAVAILABLE

Pre-rejected by **D-N1(c)**, quoted in terms:

> *"a guard that fails on N pre-existing violations cannot be enabled until the sweep runs, so
> the split does not work as stated unless the guard ships disabled — which is no guard."*

Listed here only so a later reader can see it was considered and why it could not be taken.

---

## 4. The one-way-door cost, stated explicitly

This sweep touches **741 files**. Per `152-RESEARCH.md` § 11, **59 of the 94 files phases
153–160 cite sit inside that surface — 63%** — and **phases 158 and 159 alone will
structurally rewrite 32 of them**. Under (a) or (b) those files receive a large mechanical
comment diff immediately before two phases rewrite them. Reverting after those phases land
means re-resolving their diffs. Deciding the scale before it is spent is cheap; deciding it
afterwards is not. That is why the checkpoint sat immediately before the task that spends it.

---

## 5. The chosen option, and the operator's rationale

**Decision: option (b)** — *D-A4 verbatim for detection, with the five structural categories
codified as constants in the committed script.*

The operator left the decision box unticked and supplied notes rather than an overrule. Per
this project's standing discussion convention — *unchecked = the ★ RECOMMENDED option wins;
boxes are ticked only to overrule* — option (b) carries. The operator's two notes are recorded
verbatim below, and both bind the sweep.

### Amendment 1 — paragraph breaks are a NAMED rule, not an incidental line

> *"When doing the sweep, note that paragraph breaks are allowed, i.e. 2 consecutive
> linebreaks with the same indent."*

A blank comment line terminates the paragraph; the sweep never joins across one. This was
**already** present in the reference predicate as the incidental line
`if (!cur.content.trim() || !nxt.content.trim()) continue;`, so the amendment is **not a
behaviour change** — it is the promotion of an implementation detail to a first-class, named,
fixture-tested rule that a refactor cannot silently drop.

**Implemented and verified on this tree by `152-02`, re-verified here:** `PARAGRAPH_BREAK` is a
named predicate sitting with the other five exclusions, cites the ruling in its own comment,
carries its own report row (**4,190 junctions excluded** live), and is proven by a committed
fixture **pair** whose two inputs differ by exactly one line — **0 violations with the blank
comment line present, 1 with it removed**. Both fixtures pass in `--self-test` on this tree.

### Amendment 2 — `.editorconfig` is NOT modified

> *"the 120 max in editorconfig can be removed"* … then, on being shown what it controls:
> *"Just note that we don't expect it to apply to anything."*

`.editorconfig` is left **byte-identical** (`ec6742a7a2e1a4f6e4418587e6a35c36df3f68e4`, before
and after). The removal was proposed on the premise that `max_line_length = 120` is an editor
hint. It is not: `prettier.config.mjs` re-exports `@openvaa/shared-config/prettier`, that
config sets **no `printWidth`**, and its own header defers to `.editorconfig`. So
`max_line_length = 120` **is** this repository's Prettier `printWidth`; deleting it would drop
`printWidth` to Prettier's default **80** and reformat every TS and Svelte file in the
monorepo — a diff far larger than this sweep — turning `format:check` red immediately.

**What is recorded instead, which is what the note actually asked for:** the 120-character
maximum is **not expected to apply to anything this sweep produces, and it does not.** Prettier
does not reflow comments (proven by running the repo's own installed binary against a
302-character comment, which survived byte-identical), and there is no ESLint max-length rule
anywhere in the shared config. A later reader finding a 400-character joined comment line
should read it as **sanctioned by this decision**, not as a violation of the declared maximum.

If code line-width is ever to be freed, that is a separate decision and must pin `printWidth`
explicitly in `packages/shared-config/prettier.config.mjs` **first**, so that removing the
`.editorconfig` line cannot silently mean 80.

### Option (c) was not chosen

Recorded for completeness, since the plan required it to be stated conditionally: **(c) was
not chosen**, so no override of D-A4's text is in force and no reviewed site is left unclosed
behind a green criterion 1.

---

## 6. What the sweep is therefore bound by

- The **unrestricted** mode (`--apply`, not `--gratuitous-only`) — option (b)'s scale.
- The five structural exclusions plus `PARAGRAPH_BREAK`, as **codified constants**, never
  flags, never an ignore file, never a per-path roster.
- A line-1 `#!` shebang is **never** a comment-span start.
- **No dash rule, anywhere** — not in the sweep, the instrument or the guard. The two ESLint
  disable directives at `apps/frontend/src/hooks.server.ts:1` and `apps/frontend/src/hooks.ts:1`
  use a double hyphen as the rule-description separator, where a rewrite changes the
  directive's **parse** and could silently disable a lint rule across the whole frontend. Both
  files must be byte-identical afterwards. D-A5(b) and D-A5(c) were both rejected.
- The identity-callback disclosure control is joined with **every word of its meaning kept**,
  recorded verbatim before and after.
- The adapter base-object comment is **joined only**, left semantically unchanged for Phase 157.
- The sweep lands as a **small number of large, coherent commits** (≤ 3 over `apps packages tests`).
- `assert-comment-only-diff.mjs` over the sweep range reports zero non-comment byte changes
  with **zero** allow entries. If it reports any, the fix is the classifier — never an allow entry.
