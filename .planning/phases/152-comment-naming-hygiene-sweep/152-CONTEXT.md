# Phase 152: Comment & Naming Hygiene Sweep - Context

**Gathered:** 2026-08-28
**Status:** Ready for planning
**Source of decisions:** `.planning/v2.15-DISCUSSION-POINTS.md` § 0 (facts 7-10), § A (A1-A6), § N (N1-N3)

<domain>
## Phase Boundary

A reader opening any file in `packages/**`, `apps/**` or `tests/**` meets comments that explain the
code in front of them, and nothing else: no forced line breaks inside a comment span, no historical
narrative, no planning-artifact paths, no phase/plan numbers, no decision ids, no escape-encoded
dashes. The class is then held shut by a committed scan wired into `yarn lint:check`, not by
operator memory.

**Delivered:**

1. **The forced-line-break scan** — a committed Node script implementing the definition in D-A4, wired
   into `yarn lint:check`, returning zero across `packages/**`, `apps/**`, `tests/**`. It also carries
   the `\uXXXX`-escape-in-comment pattern from D-A5.
2. **The planning-reference purge across the full measured class** — **817 comment lines**
   (packages 336 · apps 219 · tests 223, over a 34,063-line comment corpus), rewrite-by-default,
   delete only pure narrative (D-A1).
3. **The `(voters)/+layout.svelte` exemplar**, dispositioned per D-A2 — `:36-45` deleted, `:46-47`
   compressed to one line, `:59-75` gone, `:92-106` reduced to one line justifying `onMount`, `:109`
   removed, `:116` **kept**.
4. **The three renames** (roadmap criterion 3): `SettingsOverlay.svelte.ts` → `settingsOverlay.svelte.ts`
   (and `SettingsOverlay.svelte.test.ts` alongside it, at
   `apps/frontend/src/lib/contexts/utils/`), `EntityListWithControls.helpers.ts` → `helpers.ts`
   (at `apps/frontend/src/lib/dynamic-components/entityList/`, with its `.test.ts` sibling), and the
   fixture `quatenaryChoices` → **`quaternaryChoices`** (D-A3).
5. **The single escape-encoded dash** at `apps/frontend/src/lib/dynamic-components/entityCard/EntityCardAction.svelte:12`
   (`–` inside the Slots docstring) becomes the character itself (D-A5).
6. **The UK/US spelling audit of symbol names**, committed even if the answer is "none found", with
   prose/fixture hits recorded as explicitly out of scope (D-A6).
7. **A residue pass** proving no comment edit changed program behaviour (roadmap criterion 5); Phase 151
   measured 126 non-comment-shaped lines as the expected order of magnitude, not zero.

**Explicitly NOT in scope:**

- Normalising the **85** comment lines that use `--` as a dash, and the ~2,870 lines already using real
  `—`/`–` characters — D-A5 leaves both alone.
- Prose and fixture UK-spelling hits: `params/etSg.test.ts:22` and `params/etPl.test.ts:23` use
  `'organisation'` as a **deliberate negative-test input**; `Input.svelte:46,52` has "Favourite colours"
  inside a usage-example docstring. D-A6 keeps identifiers only.
- Any behavioural change. Comments and names only.
- Filing follow-up work items surfaced by other phases — those land in `.planning/todos/pending/`
  during their own owning phase (D-N2), not here.

</domain>

<decisions>
## Implementation Decisions

**How to read the winner column.** In `.planning/v2.15-DISCUSSION-POINTS.md`, every box left unchecked
means the `★ RECOMMENDED` option is *chosen*, not undecided. For § A the operator went further and
**explicitly ticked** `[x]` on all six — each of A1-A6 is therefore an **active confirmation** of the
recommendation, not a silent default. The three cross-cutting decisions (N1, N2, N3) were left
**unchecked**, so they carry by the default rule. No `**EDIT:**` / `**NOTE:**` / `**NOTES**:` free text
is attached to any § A or § N decision — the free-text annotations in that document sit under sections
F, G, H, I (phases 157-160) and do not bear on this phase.

### D-A1 (⚠ DECIDE) — How wide is the planning-reference purge?

**Won: option (a) — "Full class, with a rewrite-not-delete default". Ticked `[x]` by the operator
(and also the ★ RECOMMENDED option) — an active choice.**

Operator rationale as written: *"every one of the 817 is visited; a comment whose content is a live
invariant is **rewritten** to state the invariant without the phase reference; only pure narrative is
deleted. Codemod strips the citation, human pass decides rewrite-vs-delete. This is what the criterion
says, and a partial sweep leaves the class reopenable."*

Rejected, with the reasons recorded so they are not re-proposed:
- (b) the 19 reviewed sites only — "leaves 798 lines of the same class in the tree and makes criterion
  1's 'cannot silently reopen' scan unenforceable, since it would fail immediately on untouched files";
- (c) `apps/**` + `packages/**`, skip `tests/**` (594 lines) — "the E2E specs are the heaviest
  planning-narrative carriers in the repo and are read most often by agents";
- (d) full class, delete-by-default — "destroys measured hazard notes that no other document holds".

**Two worked examples of the rewrite-not-delete case named in the decision text:**
`packages/dev-seed/.../resolve-template.ts:62-70` explains a live `Object.prototype` hazard, and
`supabaseDataWriter.ts:86-90` records a measured Playwright timing hazard — both carry real information
with a phase number attached. Strip the citation; keep the invariant.

**Sizing consequence:** the work is a two-stage pipeline (mechanical citation-strip codemod, then a
human/agent rewrite-vs-delete pass) over 817 lines, not a 19-site edit.

### D-A2 (⚠ DECIDE) — `(voters)/+layout.svelte:36-47`, the half-history/half-invariant block

**Won: option (a) — "Delete `:36-45`; keep `:46-47` compressed to one line". Ticked `[x]` (and ★
RECOMMENDED) — an active choice.**

Operator rationale as written: *"the exemplar then demonstrates the actual rule ('comments explain the
code in front of them'), and the destructure trap the invariant guards is the single most-repeated
defect in this codebase's history."*

Rejected: (b) delete `:36-47` entirely — *"the next editor destructures `ctx.appSettings` and
reintroduces a documented Phase-61 defect class"*; (c) keep the block and strip only the citations —
*"leaves ~10 lines of prose in the file the phase nominates as the example of what code should look
like afterwards."*

Measured shape (fact 10, re-read this session): `:36-45` is WR-04 `popupQueue` destructuring narrative;
`:46-47` reads *"appSettings is a reactive accessor (see phase 113 flatten) — read via
`ctx.appSettings`, never destructure (the alias below tracks it)"* — a **live CLAUDE.md invariant**
guarding `:49-51` (`const ctx = initVoterContext(); const { appType, popupQueue, userPreferences, t } =
ctx; const appSettings = $derived(ctx.appSettings);`). The compressed keeper must state the rule
without the "see phase 113" citation.

### D-A3 — `quatenaryChoices`

**Won: option (a) — "Rename to `quaternaryChoices`". Ticked `[x]` (and ★ RECOMMENDED) — an active
choice, and it deliberately deviates from the reviewer's literal request.**

Operator rationale as written: *"the correct English word, consistent with `binaryChoices` at `:17`,
and it satisfies the reviewer's evident intent (fix the spelling)."*

Rejected: (b) the reviewer's literal `quartenaryChoices` — *"ships a misspelling into a file the same
phase is cleaning for correctness"*; (c) leave it — *"the criterion names this rename explicitly."*

Site: `packages/data/src/objects/questions/variants/multipleChoiceCategoricalQuestion.test.ts:11`.
The PR #865 review comment says "Rename to `quartenaryChoices`" — **do not** follow it verbatim.

### D-A4 — What counts as a "forced line break", and how the scan is committed

**Won: option (a) — "A committed Node script implementing that rule, wired into `yarn lint:check`".
Ticked `[x]` (and ★ RECOMMENDED) — an active choice.**

**The class definition, as written in the decision preamble (this is the specification):** *"a comment
line that ends without terminal punctuation **and** whose next line continues the same comment span at
the same indent."*

Operator rationale as written: *"the criterion says 'committed as a script so the class cannot silently
reopen'; putting it in `lint:check` is what makes reopening impossible rather than merely visible.
Precedent: the Phase-144 chain-membership assertion."*

Rejected: (b) prettier `printWidth` reflow — *"prettier does not reflow comment prose, so this closes
nothing"*; (c) a one-off audit script not wired into CI — *"the class silently reopens on the next PR,
which is the failure the criterion names."*

Implementation note carried from D-A5: this same script also carries the `\uXXXX`-escape-in-comment
pattern. It is one gate with two rules, not two gates.

Precedent to follow for the wiring: Phase 144 asserted `typecheck`'s **membership** in the
`lint:check` chain rather than its position — see `b410d3a90` (`fix(144): assert typecheck's chain
MEMBERSHIP in lint:check, not its position`).

### D-A5 — "Encoded dashes"

**Won: option (a) — "Fix the one `–`; add the `\uXXXX`-in-comment pattern to the A4 scan; leave `--`
alone". Ticked `[x]` (and ★ RECOMMENDED) — an active choice.**

Operator rationale as written: *"the reviewer's complaint was escape-encoding, and 2,870 comment lines
already use real `—`/`–` characters happily. The guard stops the class rather than the instance."*

Rejected: (b) also normalise the 85 `--` occurrences to `—` — *"85 extra diff sites in files other
phases are about to rewrite, inviting conflicts"*; (c) normalise every dash to a plain hyphen (~2,955
sites) — *"it degrades readable prose across the whole tree."*

The single site is `apps/frontend/src/lib/dynamic-components/entityCard/EntityCardAction.svelte:12`,
where the Slots docstring reads `– default: The contents to wrap.` — verified this session. Note
that the reviewer's literal wording was "just use a hyphen"; the decision **overrules** that in favour
of the real character, on the "2,870 lines already do this" evidence.

### D-A6 — UK/US spelling audit scope

**Won: option (a) — "Identifiers only; record prose/fixture hits as explicitly out of scope in the
committed audit". Ticked `[x]` (and ★ RECOMMENDED) — an active choice.**

Operator rationale as written: *"matches the criterion's own wording, and changing the `etSg`/`etPl`
fixtures would silently weaken two passing tests."*

Rejected: (b) identifiers + JSDoc prose — *"touches ~30 doc blocks other phases are rewriting"*;
(c) everything including test fixtures and example strings — *"breaks the two param tests and edits
user-facing example copy for no functional gain."*

Measured: **45 non-comment hits**, of which the sample is mostly *not* symbols. The audit output is
committed even when the answer is "none found" (roadmap criterion 4), and it must name the out-of-scope
hits explicitly so the next reader does not re-audit them:
`packages/.../params/etSg.test.ts:22` and `params/etPl.test.ts:23` (`'organisation'` as a deliberate
negative-test input), `Input.svelte:46,52` ("Favourite colours" in a usage-example docstring).

The originating review comment is at `apps/supabase/supabase/schema/000-enums.sql:17` (PR #866).

## Cross-cutting decisions that bind this phase

### D-N1 — Sequencing: 152 runs first, before eleven phases that write new comments

**Won: option (a) — "Keep 152 first as roadmapped, and land its scan in `yarn lint:check` (per A4a) so
later phases cannot reopen the class". Won by default — every box unchecked, and (a) is ★ RECOMMENDED.**

Operator rationale as written: *"the enforcement, not the ordering, is what makes the sweep durable,
and running first means every later phase is written against the new convention."*

**The consequence this phase must own:** phases 153-164 will add comments. Because the D-A4 scan lands
in `yarn lint:check`, **any later phase that reopens the class fails the gate.** The ordering alone
would not have achieved that — the gate is what does. Getting the scan into `lint:check` is therefore
not a nice-to-have rider on criterion 1; it is the load-bearing deliverable of the whole phase.

Rejected: (b) move 152 to the end — *"eleven phases are then authored under the old convention and the
final sweep is much larger"*; (c) split 152 into guard-first / sweep-last — *"a guard that fails on 817
pre-existing violations cannot be enabled until the sweep runs, so the split does not work as stated
unless the guard ships disabled — which is no guard."*

### D-N2 — Where follow-up-task comments land

**Won: option (a) — `.planning/todos/pending/`, filed during the owning phase. Won by default (★
RECOMMENDED, unchecked).** Rationale as written: *"that register is already this project's mechanism
(12 todos filed in Phase 147), and `/gsd-discuss-phase` cross-references it automatically on future
phases."* Relevance here: anything the 817-line sweep surfaces that is **not** a comment edit (a real
defect hiding behind a narrative comment, say) is filed there rather than fixed in-phase.

### D-N3 — How the discussion document becomes CONTEXT.md

**Won: option (a) — one `<padded>-CONTEXT.md` per phase generated from that phase's decisions, plus a
shared `<padded>-DISCUSSION-LOG.md` pointer back to the source. Won by default (★ RECOMMENDED,
unchecked).** Rationale as written: *"`gsd-planner` and `gsd-phase-researcher` read a single phase's
CONTEXT.md; a milestone-level file would make each planner read twelve phases' worth of irrelevant
decisions."* **This document is that artifact for Phase 152.** The shared discussion-log pointer is
listed under `<open>` — it has not been written yet.

### D-0.1 — Baseline status of the § 0 fact table (context, not a 152 decision)

Option **(c)** was ticked — a **non-recommended** box, overruling the ★ on (a). The operator chose:
*"Also correct `.planning/ROADMAP.md:1003-1217` in place — the nine ⚑ rows are edited into the phase
entries now, so the roadmap stops carrying false premises."* That correction is being applied
concurrently by another agent. **Do not edit `ROADMAP.md` from this phase's planning or execution.**


### Decision index (machine-readable)

One bullet per decision above, in the grammar `plan-phase`'s decision-coverage gate parses.
The sections carry the reasoning and evidence; **this is an index, not a summary — plan from
the sections.** It lives inside `<decisions>` because the parser reads only this block when
one is present, and ignores `###` headings entirely.

- **D-A1:** How wide is the planning-reference purge — full class, rewrite-not-delete default
- **D-A2:** `(voters)/+layout.svelte:36-47` — delete `:36-45`, keep `:46-47` compressed to one line
- **D-A3:** `quatenaryChoices` → `quaternaryChoices` (**not** the reviewer's `quartenaryChoices`)
- **D-A4:** What counts as a forced line break, and the committed scan wired into `yarn lint:check`
- **D-A5:** Encoded dashes — fix the one escape, add the `\uXXXX` rule to the A4 scan, leave `--` alone
- **D-A6:** UK/US spelling audit scope — identifiers only, prose/fixture hits recorded out of scope
- **D-N1:** Sequencing — 152 runs first; the `lint:check` gate, not the ordering, is what makes it durable
- **D-N2:** Where follow-up-task comments land — `.planning/todos/pending/`, filed during the owning phase
- **D-N3:** How the discussion document becomes CONTEXT.md — one per phase, plus a DISCUSSION-LOG pointer

</decisions>

<facts>
## Measured Facts This Phase Owns

All four were re-measured at HEAD `bff94f382`, branch `integration/ship-12-squash`, on 2026-08-28, and
re-confirmed on the tree while writing this document. **Where a fact and the roadmap disagree, the fact
wins** — that precedence is § 0.1's own rule, and it is the reason facts 7-9 are flagged ⚑.

### Fact 7 ⚑ — the planning-reference class is 817 lines, not 19

Planning references in comments number **817 lines**: **packages 336 · apps 219 · tests 223**, over a
**34,063-line** comment corpus. The roadmap's Source line ("19 review comments across PRs #865, #866,
#869, #870") describes the *review* that prompted the phase, not the *class* the criterion names.
Criterion 2 says "**Every** comment carrying historical narrative, a planning-artifact path, a phase or
plan number, or a decision id" — that is 817 lines. **Size the sweep against 817.** Anyone planning
against 19 is planning the wrong phase.

### Fact 8 ⚑ — zero HTML-entity dashes exist

There is no HTML-entity dash anywhere in the repo. The single "encoded dash" the reviewer flagged is a
`–` **escape** at `apps/frontend/src/lib/dynamic-components/entityCard/EntityCardAction.svelte:12`
(verified: the Slots docstring line reads `– default: The contents to wrap.`). Separately, **85**
comment lines use `--` as a dash — D-A5 leaves every one of them alone — and ~2,870 comment lines
already use real `—`/`–` characters. So "encoded dashes" is **one instance, not a class**; the class is
created going forward by the escape-pattern rule added to the D-A4 scan.

### Fact 9 ⚑ — both spellings in the review are wrong

The fixture is spelled **`quatenaryChoices`** at
`packages/data/src/objects/questions/variants/multipleChoiceCategoricalQuestion.test.ts:11`. The
reviewer's requested replacement **`quartenaryChoices` is also not a word.** The correct English word is
**`quaternaryChoices`**, which is what D-A3 selects, and which is consistent with `binaryChoices` at
`:17` of the same file.

### Fact 10 — the exemplar's line numbers are right; its disposition in the roadmap is not

The four `(voters)/+layout.svelte` line numbers cited by the review (`:36`, `:92`, `:109`, `:116`) are
**correct**. But the measured block extents are `:36-47`, `:59-75`, `:92-106`, `:109`, `:116` — and
`:36`'s block **runs to `:47`**, whose **last two lines state a live CLAUDE.md invariant, not history**
(the `appSettings`-is-a-reactive-accessor rule guarding `:49-51`).

> **Roadmap-vs-fact conflict, stated explicitly.** `.planning/ROADMAP.md` criterion 2 says the exemplar
> disposition is "the prose at :36 and :59 gone". Taken literally against the measured extent, that
> deletes the live invariant at `:46-47`. **Fact 10 + D-A2 win:** delete `:36-45`, keep `:46-47`
> compressed to one line. The rest of the roadmap's disposition stands unchanged — `:59-75` gone,
> `:92-106` reduced to one line justifying `onMount`, `:109` removed, `:116` **kept** (the reviewer
> marked that one as earning its place: *"the logic is a bit slow to read from the if clause"*).

### Evidence paths

| Fact | Evidence |
|---|---|
| 7 | Measured counts per tree: packages 336 · apps 219 · tests 223 / 34,063-line comment corpus (`.planning/v2.15-DISCUSSION-POINTS.md` § 0 row 7) |
| 8 | `apps/frontend/src/lib/dynamic-components/entityCard/EntityCardAction.svelte:12` (the `–` escape); 85 `--`-as-dash comment lines; ~2,870 real-dash comment lines |
| 9 | `packages/data/src/objects/questions/variants/multipleChoiceCategoricalQuestion.test.ts:11` (fixture), `:17` (`binaryChoices`, the consistency anchor) |
| 10 | `apps/frontend/src/routes/(voters)/+layout.svelte` — `:36-47` (WR-04 narrative + the appSettings invariant), `:59-75` (phase 86.3 / 95 topBar narrative), `:92-106` (phase 86.3 cell #3 revert narrative), `:109`, `:116` |
| renames | `apps/frontend/src/lib/contexts/utils/SettingsOverlay.svelte.ts` + `.test.ts`; `apps/frontend/src/lib/dynamic-components/entityList/EntityListWithControls.helpers.ts` + `.helpers.test.ts` (both exist, verified) |
| review source | `.planning/PRE-SHIP-REVIEW-TRIAGE.md:39-84` — all 19 comments verbatim with file:line |

</facts>

<open>
## Open / Unresolved

1. **`REVIEW-HYG-01..04` are not defined anywhere.** The roadmap's `**Requirements**` line names them,
   but `grep -rn 'REVIEW-HYG' .planning/*.md` returns exactly one hit — `.planning/ROADMAP.md:1009`
   itself. `.planning/REQUIREMENTS.md` has no such ids. The verifier will have nothing to check the
   phase against. **Resolve before planning locks:** either add the four requirement entries, or record
   that the roadmap's five success criteria are the acceptance surface.

2. **`EntityCard.svelte:126` — terse variable names has no covering decision.** Review comment (PR
   #869): *"Don't use variable names as terse as this (and `scs` etc.). The only place to use such is in
   small ad hoc closures like `.filter((o) => o.foo))`."* This is a **naming** item inside a naming
   phase, but roadmap criterion 3 enumerates only three renames and § A resolves only the spelling
   audit (D-A6, identifiers/UK-US only). Nothing in the decision document sizes or scopes a terse-symbol
   rename. Planner must either scope it (and measure the blast radius of `scs` and its siblings) or file
   it to `.planning/todos/pending/` per D-N2. Do **not** silently drop it — it is one of the 19.

3. **`supabaseDataProvider.ts:361` is a split item.** The review comment has two halves: *"Aren't the
   fields already typed by `toDataObject`? They should be"* (a **typing** question that belongs to Phase
   157, Adapter Boundary & Typing) and *"remove line breaks from comment"* (this phase). Confirm the
   split with the 157 planner so the typing half is not lost between the two phases.

4. **`Input.svelte:316`** — *"Remove comment, the frontend components should not reference data provider
   implementations."* Reads as inside D-A1's purge (a comment that does not explain the code in front of
   it), but it is an architectural-boundary complaint rather than a planning reference, so it is not
   strictly in the 817-line class. Treat as in scope for the sweep unless the planner finds the comment
   is load-bearing.

5. **The shared `152-DISCUSSION-LOG.md` pointer required by D-N3(a) has not been written.** D-N3 calls
   for "one `<padded>-CONTEXT.md` per phase … **plus** a shared `<padded>-DISCUSSION-LOG.md` pointer back
   here". Only the CONTEXT.md exists so far. Until it does, this document's header line
   (`Source of decisions`) is the pointer.

6. **`--` vs `—` in the 85 lines is settled as "leave alone" (D-A5b rejected), but the D-A4 scan must not
   accidentally flag them.** The scan's rule is about *line breaks* and *`\uXXXX` escapes*; if its
   implementation grows a general dash rule, it will fail on 85 pre-existing lines on day one. Named
   here so the implementer does not widen the rule by reflex.

7. **Concurrent roadmap edit in flight.** Per D-0.1(c), another agent is editing
   `.planning/ROADMAP.md:1003-1217` to fold the nine ⚑ facts into the phase entries. The Phase 152 entry
   read for this document already carries a `**Corrected 2026-08-28**` preamble for facts 7, 8 and 9 —
   but **not** for fact 10, whose conflict with criterion 2's exemplar disposition is documented above
   and remains live at the time of writing. Re-read the roadmap entry before planning; where it still
   disagrees with a § 0 fact, the fact wins.

</open>

---

*Phase: 152-comment-naming-hygiene-sweep*
*Context gathered: 2026-08-28*
*Decisions source: `.planning/v2.15-DISCUSSION-POINTS.md` § 0 facts 7-10 · § A (A1-A6, all ticked `[x]`) · § N (N1-N3, all by default)*
---

## Operator decision O6 — the D-A4 scan's heuristic partition (2026-08-28)

Answers the open question this phase's planning run raised: D-A4 read literally covers **14,094** comment
lines, against the 817 this document was priced on.

**Direction given:** check all sites manually, but devise heuristics if that is unwieldy.

**Outcome:** measured, not proposed. See `152-WRAP-HEURISTIC.md` in this directory for the full evidence
and `152-wrap-scan.py` for the prototype. Headline:

- `printWidth` is **120**, but the corpus is wrapped near **80** (median per-file max column **83**,
  histogram peak **78**, only 4.9% of files reaching 111–120). Measuring against 120 flags 14,565 breaks —
  the yardstick, not the defect.
- Comparing each break against **its own file's prevailing wrap width** and applying seven justified
  exclusions yields **762 breaks across 251 files**, with **95.4%** auto-classified. An 18.5× reduction.

**What this changes for the plans:** `152-02` productionises the prototype as one of the phase's committed
instruments; `152-14`'s blocking checkpoint keeps its shape but now carries a measured partition and a
recommendation instead of a bare 14,094. The human still reviews all 762 — the heuristic only removes the
breaks that provably need no eyes.

**Note the estimator matters more than the threshold.** Median under-flags, p90 over-flags (it rates
`enumeratedFilter.ts` at 124 when its lines visibly cluster at 77–81; the chosen estimator says 84). The
choice was made on correctness against files read by eye, not on which produced the smallest residue.

### Decision index addendum

- **D-A4-H:** Per operator decision O6 — run D-A4's detection verbatim and codify seven measured, individually warranted exclusion rules in the committed scan, reducing the reviewable set from 14,094 to 762 across 251 files without putting anything silently out of scope.
