# Phase 160: Agent Docs & Skills Refresh - Context

**Gathered:** 2026-08-28
**Status:** Ready for planning
**Derived from:** `.planning/v2.15-DISCUSSION-POINTS.md` § I (I1–I3), § 0 facts 25–26, § N (cross-cutting),
filled by the operator. Per that document's own rule: an unchecked decision resolves to its
`★ RECOMMENDED` option; a ticked non-recommended box overrules the `★`; and `**EDIT:**` /
`**NOTE:**` / `**NOTES**:` free text beats every box.
**Measured against:** worktree `voting-advice-application-gsd`, branch `integration/ship-12-squash`,
HEAD `52c631edf`, 2026-08-28. Every byte count below was **re-measured this session**, not carried
over from the discussion document — see `<facts>` for the re-measurement and its agreement.

<domain>
## Phase Boundary

The agent-facing documentation of this repo — `CLAUDE.md` and `.claude/skills/**` — is made accurate
against the **post-remediation** tree, its extension patterns are completed, and its *structure* is
settled by a recorded measurement rather than by the fashion of the two papers the reviewer attached.

Delivers five things:

1. **`.claude/skills/data/object-model.md`** gains the three reviewer-specified additions (one
   constituency per election; non-contradictory constituency selection across elections sharing a
   group or nested constituencies; child-implies-parent; the party-list pattern as an
   `OrganizationNomination` with `CandidateNomination` children).
2. **The extension patterns** gain their missing steps — check dev-seed templates on a schema change
   (`database/extension-patterns.md:75`); add E2E coverage for a new filter, in the full voter
   journey where applicable (`filters/extension-patterns.md:57`); and a note in **all** skills'
   extension patterns that the skill itself must be re-checked afterwards, because skills contain
   listings (`matching/SKILL.md:1`).
3. **A structural decision on evidence** (D-I1): the progressive-disclosure threshold measured, the
   conclusion recorded, and a forward-looking one-level-depth rule asserted. Includes an explicit
   keep-or-delete judgement on the generated `spike-findings-voting-advice-application-gsd` skill.
4. **`CLAUDE.md` trimmed** (D-I2) to commands + hard conventions, with the Svelte-context essay
   **relocated** into the `components` skill and routed to in one hop.
5. **The two routing stubs resolved** (D-I3): `architect` folded into `CLAUDE.md`'s routing section
   and deleted; `components` grown into a real skill — receiving the D-I2 essay and, per the
   operator's binding note, a recorded evaluation of how the docs' component listing is kept in sync.

Satisfies REVIEW-DOC-01..04 (see `<open>` — these ids are not defined in `REQUIREMENTS.md`).
Source: 8 review comments on PR #874, enumerated at `.planning/PRE-SHIP-REVIEW-TRIAGE.md:341-362`.

## Upstream dependency — this phase MUST run last of the code phases

**Depends on: Phases 152–159.** The roadmap states it (`ROADMAP.md:1155`) and it is not a soft
ordering hint: **the documentation describes the post-remediation tree.** Anything this phase writes
about a surface that 152–159 have not yet changed will be wrong the moment they land. Concretely:

- **152** (comment & naming hygiene) rewrites 817 comment lines and — per D-N1 — lands a scan in
  `yarn lint:check`. Every comment and doc line this phase writes must already satisfy that
  convention, or 160 reopens the class it is documenting.
- **157** (adapter boundary), **158** (routing & auth: `lib/routes` is *created*, not moved into —
  fact 21), **159** (component & context consolidation, incl. the 211-`$effect` census) all change
  paths and symbols that `CLAUDE.md` and `BOUNDARIES.md` name by hand.
- **159** in particular **edits contexts and `$effect`s** — it is the first consumer of the
  Svelte-context content D-I2 relocates. That content must be findable when 159 runs, which is why
  D-I2 is a *relocation with a pointer*, never a deletion (see D-I2).

Planning implication: if 160 is planned in parallel with 152–159, its plans must re-verify every
path, symbol and line reference at execution time rather than at planning time.

**Not in scope:** rewriting the four `.claude/skills/*/SKILL.md` domain skills (`data`, `database`,
`filters`, `matching`) into a different structure — D-I1 explicitly restructures nothing; any change
to `apps/docs` content beyond what the D-I3 sync evaluation concludes; adding new CI jobs (that is
Phase 163); re-authoring the `ship-review-stack` procedure skill.

</domain>

<decisions>
## Implementation Decisions

Three phase-local decisions (I1–I3) plus four cross-cutting ones that bind this phase.
**All three phase-local decisions were resolved by an explicit `[x]` tick on option (a)** — which in
each case is also the `★ RECOMMENDED` option, so the tick confirms rather than overrules. **Two of
them carry operator free text**, which is binding and beats the box.

### D-I1 — Does the skill corpus exceed the threshold at which progressive disclosure pays?

**Won: option (a), by explicit tick `[x]`** (also the `★ RECOMMENDED` option).

> **(a) Record the measurement, conclude below-threshold, restructure nothing; assert one-level
> depth as a rule going forward.**

**Winning rationale (verbatim from the document):** "the criterion asks for a decision *on a
measurement*, and the measurement says the investment does not pay. The forward-looking depth rule
is the part that keeps the finding useful."

The measurement (fact 25, re-measured this session — see `<facts>`):

| Corpus | Files | Bytes |
|---|---:|---:|
| All `.claude/skills/**/*.md` | 42 | 464,728 |
| — of which the generated `spike-findings-*` skill | 26 | 288,325 (62%) |
| **Hand-authored skills** | **16** | **176,403** |
| `CLAUDE.md` | 1 | 26,149 |

The cited threshold is "the corpus exceeds what the agent can navigate by direct reading." 176 KB
across 16 files is comfortably navigable by direct reading; the paper's crossover is multi-repo
scale. Rejected: **(b)** restructure into more, smaller skills anyway — the same paper says it buys
nothing below the crossover; **(c)** hand-flatten the generated `spike-findings` skill — it is
machine-generated by `/gsd-spike --wrap-up`, so a hand-flatten is undone by the next wrap-up.

**Operator free text attached to I1 — verbatim, binding:**

> **NOTES**: If the spike findings look like not useful to maintain as skills, remove them, bc
> they'll be available from git history.

**⚠ This note is a deletion instruction for 62% of the corpus, and it changes the shape of the
phase.** D-I1's box says "restructure nothing"; the note says "and consider deleting the largest
thing in it." These are compatible — deleting a skill is not restructuring the remainder — but the
phase now **owes an explicit keep-or-delete judgement on
`.claude/skills/spike-findings-voting-advice-application-gsd/` (26 files, 288,325 B), with the
reasoning recorded**, exactly as criterion 3 demands the disclosure decision be recorded.

Two things the judgement must weigh, both measured this session:

- **The evidence favours deletion.** Both spike domains have **landed**. Domain 1 (rune migration,
  spikes 001–012): `grep -rn "from 'svelte/store'" apps/frontend/src` → **1 hit repo-wide, 0 in
  `lib/contexts/`**. Domain 2 (View Transitions + a11y, spikes 013–016): wired at
  `apps/frontend/src/lib/utils/viewTransition.ts`. The skill is an implementation blueprint for work
  that is done; its description still says "Auto-loaded during implementation work."
- **Deletion has a hard prerequisite.** `CLAUDE.md:419-424` — the **"Skill Routing" section — is a
  pointer to exactly that skill and nothing else.** Delete the skill without removing the pointer
  and the routing section becomes a dangling reference: **precisely the class Phase 152 exists to
  eliminate**, reintroduced by the phase whose job is documentation accuracy. If the judgement is
  DELETE, the `CLAUDE.md` routing-section edit is part of the same change, not a follow-up. Note the
  interaction with D-I3, which *also* rewrites that routing section (to absorb `architect`).

**Forward-looking rule to assert (the durable half of (a)):** one routing level, never two. A
`SKILL.md` frontmatter description is the routing layer; its body either contains the instructions
or points directly at concrete resource files — never at a second index inside the skill. Note when
asserting it that `CLAUDE.md § Skill Routing → spike-findings/SKILL.md § Feature Areas →
references/*.md` is today a **two-hop chain**, i.e. the repo's one live violation of the rule it is
about to assert — which is itself an argument the judgement above should weigh.

### D-I2 ⚠ DECIDE — `CLAUDE.md` (26,149 B) against the 288-run ablation finding

**Won: option (a), by explicit tick `[x]`** (also the `★ RECOMMENDED` option).

> **(a) Trim to commands + hard conventions; move the Svelte-context essay into the `components`
> skill and route to it in one hop; record the reasoning including what was deliberately kept.**

**Winning rationale (verbatim):** "respects the finding (lean context file, invest in verification)
without discarding the one class of knowledge the finding's own failure analysis says agents
*cannot* recover by reading code. Also gives the 917-byte `components` stub a reason to exist."

Rejected: **(b)** keep as is — satisfies the criterion's "whatever is decided … recorded" but
declines the finding; **(c)** cut to commands and conventions only, essay deleted — "deletes the
destructure-trap and Spike-024 guidance, which are the two defects this codebase has actually
re-suffered."

**The essay is live, load-bearing invariant — not history.** `CLAUDE.md:327-378` is two sections:
the **Context Destructuring Rule (Svelte 5)** and its **`dataRoot` `#version`-bridge carve-out**.
They document a Svelte 5 referential-equality behaviour the code cannot show:

- The destructure trap: destructuring a reactive accessor invokes the getter once at component-init
  and binds the initial empty `$state` array — diagnosed in v2.6 Phase 61
  (`.planning/milestones/v2.6-phases/61-voter-app-question-flow/61-03-DIAGNOSIS.md`), explained
  in-tree at `apps/frontend/src/lib/contexts/candidate/candidateContext.svelte.ts:106-123`.
- The Spike-024 hole: for an **identity-stable** `#version`-bridge accessor (`dataRoot`), the
  canonical `const X = $derived(ctx.X)` read alias goes **stale on cold / direct-URL entry**, because
  the alias yields the same reference each bump and Svelte 5 skips downstream notification.
  Evidence: `.planning/spikes/024-derived-alias-stable-ref-skip/README.md` (4/4 validated
  classification), `.planning/spikes/CONVENTIONS.md` §9, `.planning/debug/dataroot-stale-direct-nav.md`
  (root cause + 14-site consumer map).

**Therefore, three constraints the move must satisfy — record them, do not merely trim:**

1. **The move is a RELOCATION, not a deletion.** Both sections must arrive in
   `.claude/skills/components/SKILL.md` (or a concrete resource file it points at directly) with
   their content intact — including the carve-out's "never bind `dataRoot` to an intermediate read
   alias" rule, the canonical patterns, and the spike/debug references above. Weakening the wording
   in the course of moving it is a regression, not a trim.
2. **A routing pointer stays behind in `CLAUDE.md`** — one hop, per D-I1's asserted rule. The paper's
   own prescription is "route to the rest in one hop", not "drop the pointer".
3. **Phase 159 depends on the content being findable.** 159 edits contexts and audits 211 `$effect`
   sites; it is the immediate consumer. Since 160 runs *after* 159, the relocation must not land in a
   state where 159's authors (or a later reader auditing 159's work) cannot find the rule.

**Also record what was deliberately kept** — option (a) says so explicitly, and it is the half a
"trim" naturally loses. At minimum the E2E Hard Rule (cardinal failure), the E2E preflight contract
(Phase 137), the `db:*` vs `dev:*` naming split, and the Svelte Warning-Accepted comment format are
hard conventions, not prose, and stay.

### D-I3 — `architect` (813 B) and `components` (917 B) are routing stubs

**Won: option (a), by explicit tick `[x]`** (also the `★ RECOMMENDED` option).

> **(a) Fold `architect` into `CLAUDE.md`'s routing section and delete it; grow `components` by
> receiving the I2a essay.**

**Winning rationale (verbatim):** "removes one pure hop and gives the other real content, which is
the paper's own prescription applied rather than quoted."

Rejected: **(b)** grow both into real skills — "writes new documentation the ablation finding says
will not improve correctness"; **(c)** leave both — "keeps two skills whose entire body is a pointer."

Fact 26, confirmed by reading both files this session: each is a single `SKILL.md` whose body is
`> Deferred to post-Svelte 5 migration. This stub establishes the skill trigger.` followed by a
"## Placeholder / This skill will cover:" bullet list. `targets: []` in both frontmatters.

**Operator free text attached to I3 — verbatim, binding:**

> **NOTES**: Consider whether it would be useful to maintain, link, or copy the list of components in
> docs to the components skill. We'll need to update the docs part but we could keep these
> automatically in sync if linkage is not straightforward enough.

**The phase owes a recorded evaluation of link vs. copy vs. generate for the component listing**, and
the operator's stated preference is explicit: **automatic sync if a straightforward linkage is not
available.** Three measured facts the evaluation starts from (see `<facts>` F3–F5):

- The listing already exists and is already generated:
  `apps/docs/src/routes/(content)/developers-guide/frontend/components/generated/+page.md`
  (17,428 B), header: "This documentation is automatically generated from the `@component` docstrings
  in Svelte files."
- The generator is `apps/docs/scripts/generate-component-docs.ts`, run via
  `apps/docs` → `generate:docs`.
- **But `apps/docs/package.json:22`'s `generate:component-docs` script points at
  `scripts/extract-component-docs.ts`, which does not exist.** Any "generate into the skill too"
  option must reckon with a script reference that is already broken — and "we'll need to update the
  docs part" in the operator's note is consistent with that.

A fourth, cheaper mechanism exists and should be weighed alongside: `.claude/scripts/audit-skill-drift.sh`
(135 lines, called at `.github/workflows/main.yaml:34`) already detects skill-vs-source drift from a
`targets:` list in the skill frontmatter. ~~**every skill in the tree has `targets: []` or none**, so it
currently SKIPs everything~~ — **CORRECTED 2026-08-28, see the F6 note below: 5 of 8 skills declare real
targets and the guard runs on them.** Populating `components`' `targets:` is still a near-zero-cost partial
answer to "keep these automatically in sync," and is the reason the correction does not change D-I3.

### D-I2 / D-I3 interaction — both land in the same file

**D-I2 moves the Svelte-context essay INTO `.claude/skills/components/SKILL.md`, and D-I3 grows the
same file with the component listing (or its sync mechanism).** They are two writes to one 917-byte
stub. A planner must **sequence them, not schedule them in parallel** — and should decide up front
whether the grown `components` skill is one `SKILL.md` or a `SKILL.md` plus concrete resource files
(e.g. `context-reactivity.md`, `component-listing.md`), since D-I1's one-level rule permits the
latter — body pointing directly at concrete files — but forbids a second index.

Both also touch `CLAUDE.md`'s routing section: D-I3 adds the `architect` content to it, D-I2 adds the
`components` pointer to it, and D-I1's spike-findings judgement may remove its only current entry.
**Three edits, one section — sequence them as one task, not three.**

### Cross-cutting decisions that bind this phase

- **D-N3 (a) — won by default (no box ticked).** One `<padded>-CONTEXT.md` per phase, generated from
  the discussion document, plus a shared `<padded>-DISCUSSION-LOG.md` pointer back to it. This file
  is that artifact. Rationale: `gsd-planner` and `gsd-phase-researcher` read a single phase's
  CONTEXT.md; a milestone-level file would make each planner read twelve phases' worth of irrelevant
  decisions.
- **D-N1 (a) — won by default.** 152 stays first and lands its planning-reference scan in
  `yarn lint:check`. **Consequence for 160:** every comment and doc line this phase writes is subject
  to that guard; a doc edit that reintroduces a planning reference in code comments will fail lint.
- **D-N2 (a) — won by default.** Follow-up items are filed in `.planning/todos/pending/` during the
  owning phase. **Consequence for 160:** anything the D-I1 or D-I3 evaluations decline to do now is
  filed there with its file:line anchor, not left as prose in a summary.
- **§ 0.1 (c) — won by an explicit tick `[x]`, overruling `★ RECOMMENDED` (a).** All 33 facts are the
  run's factual baseline **and** `.planning/ROADMAP.md:1003-1217` is corrected in place. That
  correction is another agent's concurrent work — **this phase does not edit `ROADMAP.md`.**

### Claude's Discretion

- Whether the grown `components` skill is one file or `SKILL.md` + concrete resource files (subject
  to D-I1's one-level rule).
- Exact wording of the relocated Svelte-context sections, provided no invariant is weakened (D-I2.1).
- Where in `CLAUDE.md` the trimmed content and the routing entries sit.
- Which of the four extension-pattern files receive the "re-check the skill afterwards" note verbatim
  vs. tailored (the reviewer said "all skills"; `data`, `database`, `filters`, `matching` are the four
  that have an `extension-patterns.md`).


### Decision index (machine-readable)

One bullet per decision above, in the grammar `plan-phase`'s decision-coverage gate parses.
The sections carry the reasoning and evidence; **this is an index, not a summary — plan from
the sections.** It lives inside `<decisions>` because the parser reads only this block when
one is present, and ignores `###` headings entirely.

- **D-I1:** Does the skill corpus exceed the threshold at which progressive disclosure pays
- **D-I2:** `CLAUDE.md` (26,149 B) against the 288-run ablation finding
- **D-I3:** `architect` (813 B) and `components` (917 B) are routing stubs

</decisions>

<facts>
## Measured Facts

### Restated from `v2.15-DISCUSSION-POINTS.md` § 0 — this phase's own

| # | Fact | Evidence |
|---|---|---|
| 25 | Skill corpus: **42 md files / 464,728 B** — but **288,325 B (62%) is the one generated `spike-findings` skill**. Hand-authored = **16 files / 176,403 B**. `CLAUDE.md` = **26,149 B** | `find .claude/skills -name '*.md'` |
| 26 | `architect` (813 B) and `components` (917 B) are single-file routing stubs | measured |

Neither is flagged ⚑, i.e. **neither contradicts the roadmap** — fact 25 *supplies* the measurement
that roadmap criterion 3 demands, rather than correcting a false premise.

### Re-measurement this session (independent, 2026-08-28, HEAD `52c631edf`)

Commands run: `find .claude/skills -name '*.md' | wc -l`, `… -exec cat {} + | wc -c`,
`wc -c CLAUDE.md`, with the same split applied to and against `spike-findings-*`.

| Corpus | Files (re-measured) | Bytes (re-measured) | Agrees with fact 25? |
|---|---:|---:|---|
| All `.claude/skills/**/*.md` | 42 | 464,728 | **exact** |
| — generated `spike-findings-*` | 26 | 288,325 (62.0%) | **exact** |
| Hand-authored skills | 16 | 176,403 | **exact** |
| `CLAUDE.md` | 1 | 26,149 | **exact** |
| `.claude/skills/architect/SKILL.md` | 1 | 813 | **exact** |
| `.claude/skills/components/SKILL.md` | 1 | 917 | **exact** |

**Facts 25 and 26 reproduce byte-for-byte. No planner needs to re-derive them.**

Hand-authored breakdown (the 16 files, for sizing the D-I1 restructure-nothing conclusion):
`ship-review-stack/SKILL.md` 27,017 · `database/SKILL.md` 23,467 · `database/schema-reference.md` 16,374 ·
`database/rls-policy-map.md` 13,201 · `matching/algorithm-reference.md` 12,585 · `BOUNDARIES.md` 11,951 ·
`database/extension-patterns.md` 11,311 · `data/extension-patterns.md` 10,223 · `matching/SKILL.md` 9,113 ·
`data/SKILL.md` 9,032 · `data/object-model.md` 9,032 · `filters/extension-patterns.md` 8,276 ·
`filters/SKILL.md` 6,853 · `matching/extension-patterns.md` 6,238 · `components/SKILL.md` 917 ·
`architect/SKILL.md` 813.

### Additional facts measured this session (not in § 0)

- **F1 — `CLAUDE.md`'s "Skill Routing" section (`:419-424`) points at exactly one skill: the
  generated `spike-findings-voting-advice-application-gsd`.** Its only content is a two-bullet
  summary of the two spike domains plus `→ Skill("spike-findings-voting-advice-application-gsd")`.
  Deleting that skill (the D-I1 NOTES candidate) leaves this section dangling unless removed in the
  same change.
- **F2 — Both spike domains have landed.** `grep -rn "from 'svelte/store'" apps/frontend/src` → **1
  hit repo-wide, 0 under `lib/contexts/`**; View Transitions are wired at
  `apps/frontend/src/lib/utils/viewTransition.ts` (the `shouldAnimate()` gate + typed
  `startViewTransition`). The skill is a blueprint for completed work.
- **F3 — An auto-generated component listing already exists in the docs app:**
  `apps/docs/src/routes/(content)/developers-guide/frontend/components/generated/+page.md`, 17,428 B,
  generated from `@component` docstrings. Its parent page
  (`…/frontend/components/+page.md`, 715 B) links to it.
- **F4 — Generator:** `apps/docs/scripts/generate-component-docs.ts`, reachable via `apps/docs`
  `generate:docs` → `generate-all-docs-and-validate.ts`.
- **F5 — `apps/docs/package.json:22` is broken:** `"generate:component-docs": "tsx
  scripts/extract-component-docs.ts"` — **`extract-component-docs.ts` does not exist** in
  `apps/docs/scripts/`. Relevant to any "generate the listing into the skill" option under D-I3.
- **F6 — `.claude/scripts/audit-skill-drift.sh` exists** (135 lines; § 0 fact 4; referenced at
  `.github/workflows/main.yaml:34`) and audits skill-vs-source drift from a `targets:` frontmatter
  list. ~~**but it SKIPs any skill with `targets: []`, which is every skill in the tree.** The drift
  guard is installed and inert.~~

  **⚠ CORRECTED 2026-08-28 — this claim is FALSE and was measured wrong.** Ground truth, verified
  directly against `.claude/skills/*/SKILL.md`: **5 skills declare real targets** (`data`, `database`,
  `filters`, `matching`, `ship-review-stack`), **2 declare `targets: []`** (`architect`, `components`),
  and **1 has no `targets:` key** (`spike-findings-…`). So the guard checks 5, skips 3 — and it
  **exits 1 on this tree today**, with real drift in `data` and `database`. It is not inert; it is RED.

  **Why this is flagged rather than quietly fixed.** The "inert" claim originated here, was repeated by
  the orchestrator as fact in Phase 153's briefing, and was caught only because Phase 153's planner
  measured it instead of building on it. It is corrected at source so the next reader of this file does
  not inherit it. Disposition is **operator decision O4**: Phase 153 owns the script fix and the drift
  resolution; the observed-CI-run half is filed as blocked, because `main.yaml` triggers only on
  push/PR to `main`, its Markdown-only `paths-ignore` would suppress it anyway, and the single run in
  which the step ever executed (`32058994754`, PR #860) failed. Phase 160 keeps only the `targets:`
  frontmatter content, which is skill content.
- **F7 — The `components` skill's frontmatter description is already stale:** it advertises "Svelte 4
  component patterns (export let, `$$Props`, concatClass)" on a codebase migrated to Svelte 5 runes.
  Under D-I1's rule the description *is* the routing layer, so this is a routing defect, not a
  cosmetic one — and D-I3(a) rewrites this file anyway.
- **F8 — `.claude/skills/BOUNDARIES.md` (11,951 B) is a cross-skill ownership map** whose directory
  table still uses the retired `frontend/` and `backend/vaa-strapi/` paths and marks `architect` /
  `components` rows "(deferred)". Deleting `architect` (D-I3) invalidates four of its rows; the
  post-152–159 tree invalidates more. It is not named by any success criterion — see `<open>`.
- **F9 — At read time the Phase 160 roadmap entry (`ROADMAP.md:1153-1164`) carries no "Corrected
  2026-08-28" note**, unlike twelve sibling entries. Consistent with facts 25/26 being unflagged.
  **Standing rule regardless: where the roadmap and a § 0 fact disagree, the fact wins.** No such
  disagreement was found for this phase.

### Roadmap success criteria (`ROADMAP.md:1153-1164`, verbatim intent)

1. `data/object-model.md` gains the three reviewer additions (constituency-per-election;
   non-contradictory selection across shared/nested constituency groups; child-implies-parent; the
   party-list `OrganizationNomination` + `CandidateNomination` children pattern).
2. Extension patterns gain the missing steps (dev-seed template check on schema change; E2E coverage
   for a new filter; the re-check-the-skill-afterwards note, because skills contain listings).
3. The progressive-disclosure question is **answered with a measurement, not an opinion**, with the
   number recorded. → **D-I1; the number is fact 25, re-measured above.**
4. `CLAUDE.md` is evaluated against the 288-run ablation finding; whatever is decided, the decision
   and its reasoning are recorded — including "keep as is". → **D-I2 (option (a), not "keep as is").**

### Source review comments (`.planning/PRE-SHIP-REVIEW-TRIAGE.md:341-362`, 8 total)

`data/SKILL.md:1` (flat-hierarchy paper, arXiv:2607.17598) · `data/object-model.md:134`, `:135`, `:138`
(the three additions) · `database/extension-patterns.md:75` (dev-seed template step) ·
`filters/extension-patterns.md:57` (E2E filter step) · `matching/SKILL.md:1` (re-check-the-skill note,
"in all skills") · `CLAUDE.md:1` (288-run ablation, arXiv:2607.27250, + the flat-hierarchy paper).

</facts>

<open>
## Open Questions and Uncovered Ground

Filed here rather than invented. Each needs an answer during research/planning, or a
`.planning/todos/pending/` entry per D-N2.

1. **`REVIEW-DOC-01..04` are not defined anywhere in `.planning/REQUIREMENTS.md`.** `grep -rn
   'REVIEW-DOC' .planning/*.md` returns exactly one hit — `ROADMAP.md:1157`, the phase's own
   `**Requirements**` line. The four ids therefore have no text mapping them to the four success
   criteria, and a verifier cannot check requirement coverage. Resolve before planning: either the
   ids map 1:1 onto criteria 1–4 (likely, but **unconfirmed** — do not assume), or they are defined
   in a document not searched here.

2. **Roadmap criteria 1 and 2 carry no discussion decision.** § I decides only the two *structural*
   questions (I1 = criterion 3, I2 = criterion 4) plus the stub question (I3). The object-model
   additions and the extension-pattern steps are prescriptive and unambiguous — but note that:
   - The reviewer's phrasing is "Perhaps add …" on all three object-model comments and "If it's
     necessary, add a note …" on the skill-self-check one. The roadmap converts these to mandatory
     criteria. Planning should treat the roadmap wording as binding and the hedges as noise, but the
     conversion is worth stating.
   - "add a note to the extension patterns in **all** skills" — only four skills have an
     `extension-patterns.md` (`data`, `database`, `filters`, `matching`). Whether the note also
     belongs in `ship-review-stack` (a process skill owning no directory) and in the grown
     `components` skill is undecided.

3. **`BOUNDARIES.md` (11,951 B) is unowned by any criterion** but is invalidated by this phase's own
   work (F8): deleting `architect` orphans four rows, and its directory table already names retired
   paths. Decide whether updating it is in scope for 160 or a filed todo.

4. **The keep/delete judgement on `spike-findings-*` has no stated acceptance test.** D-I1's NOTES
   makes it required; nothing says how the judgement is *proven* correct. The stated fallback — "they'll
   be available from git history" — is only true if the deletion commit is on a branch that reaches
   `main`; on a squash-merge workflow the file contents survive in the pre-squash branch, not
   necessarily in `main`'s history. Confirm before deleting, or record the rejection of the concern.

5. **The D-I3 sync mechanism is un-costed.** Link vs. copy vs. generate vs. `targets:`-drift-guard
   (F6) all remain open; F5's broken script is a live obstacle to the generate option. The operator's
   preference ("automatic sync if linkage is not straightforward enough") sets the tiebreak but not
   the mechanism.

6. **Whether 160 also re-checks its own listings.** Criterion 2's note says a skill must be
   re-checked after a change "bc they contain listings" — 160 is itself a change to those skills, so
   the note applies reflexively. No criterion says so; worth an explicit final task rather than an
   implicit one.

</open>

---

*Phase: 160-agent-docs-skills-refresh*
*Context gathered: 2026-08-28 (HEAD `52c631edf`, branch `integration/ship-12-squash`)*
*Decision source: `.planning/v2.15-DISCUSSION-POINTS.md` § I, § 0 facts 25–26, § N*