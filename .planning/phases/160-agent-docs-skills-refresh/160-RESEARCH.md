# Phase 160: Agent Docs & Skills Refresh — Research

**Researched:** 2026-08-28
**Measured against:** worktree `voting-advice-application-gsd`, branch `integration/ship-12-squash`, HEAD **`db220cb5f`**
**Domain:** agent-facing documentation (`CLAUDE.md`, `.claude/skills/**`), doc-generation tooling, drift guards
**Confidence:** HIGH for everything measured in-tree; MEDIUM for the two cited papers (read only through the reviewer's paraphrase in the triage)

> **HEAD moved since CONTEXT.md was written.** CONTEXT.md was measured at `52c631edf`; this research is at `db220cb5f`. Every § 0 fact re-verified here still reproduces **byte-for-byte** — but **three CONTEXT.md statements are now falsified** (F6, `<open>` 1, and F8's row count). See § *Corrections to CONTEXT.md* — read it before planning, it changes two tasks.

---

## Summary

The phase's four success criteria are unambiguous and its three decisions are locked, so the planning risk is not "what to do" — it is **what the docs will be describing**. Two thirds of the surprises this research turned up are dangling references that already exist in the tree, and the phase's own success criterion 2 ("skills contain listings, re-check them") names the exact class. The `database` skill alone carries **15 distinct schema filenames that no longer exist, in 51 places**, because the schema was renumbered from an `0NN-` scheme to a banded `NNN-` scheme and nothing re-checked the skill. `CLAUDE.md`'s Context-Destructuring essay — the content D-I2 relocates — cites a **file that does not exist** and a line range that has drifted. Five of the seven root `docs:*` scripts point at workspace scripts that do not exist. This is the phase's real subject matter, and it is measurable.

The two structural judgements both come out clearly on the evidence. For **D-I1's keep-or-delete on `spike-findings-*`**: 173,289 B of its 288,325 B (60%) are **Prettier-reformatted duplicates** of `.planning/spikes/*/README.md` — 17 of 17 verified semantically identical after whitespace/quote normalisation — and `.planning/spikes/` is the superset (24 spikes vs the skill's 16, and it holds Spike 024, which the skill does **not**). The "git history" fallback in the operator's NOTES is **weaker than it sounds** and must be recorded as such: `.claude/skills/` has never existed on `main` (the add commit is not an ancestor of `main`), so a delete-then-squash removes the content from `main`'s history entirely. The delete is nonetheless safe — not because of git, but because `.planning/spikes/` stays in the working tree and is the source the skill was generated from.

For **D-I3's sync mechanism**: the "link to the docs listing" option ships a list that is **already 5 months stale** (committed listing 98 entries generated 2026-03-31; the live tree would generate 102, with 4 components missing). The "generate into the skill" option must first repair **six broken script references**. The `targets:`-drift-guard option is the cheapest, but CONTEXT.md's F6 is wrong about it — the guard is **not inert**; it checks 5 skills and **currently exits 1**.

**Primary recommendation:** Plan five sequenced waves — (1) the two non-structural criteria (object-model additions, extension-pattern steps) which are independent of everything; (2) the D-I1 measurement + keep/delete judgement, recorded in a new in-repo doc; (3) `CLAUDE.md` trim + relocation into `components`; (4) the `CLAUDE.md` routing-section rewrite as **one task with three edits**; (5) the reflexive self-check + `BOUNDARIES.md`. Waves 3 and 4 are strictly serial because they collide on two files. Every file:line citation the plans carry must be **re-verified at execution time**, not planning time, because 152–159 land first.

---

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions

- **D-I1 — option (a), by explicit `[x]` tick (also `★ RECOMMENDED`):** *"Record the measurement, conclude below-threshold, restructure nothing; assert one-level depth as a rule going forward."*
  - **Operator free text, verbatim and binding:** *"**NOTES**: If the spike findings look like not useful to maintain as skills, remove them, bc they'll be available from git history."*
  - Forward-looking rule to assert: **one routing level, never two.** A `SKILL.md` frontmatter description is the routing layer; its body either contains the instructions or points directly at concrete resource files — never at a second index inside the skill.

- **D-I2 — option (a), by explicit `[x]` tick (also `★ RECOMMENDED`):** *"Trim to commands + hard conventions; move the Svelte-context essay into the `components` skill and route to it in one hop; record the reasoning including what was deliberately kept."*
  - Three binding constraints on the move: **(1)** it is a RELOCATION, not a deletion — both sections arrive intact in `.claude/skills/components/SKILL.md` (or a concrete resource file it points at directly), including the carve-out's "never bind `dataRoot` to an intermediate read alias" rule, the canonical patterns and the spike/debug references. Weakening the wording while moving it is a regression, not a trim. **(2)** A routing pointer stays behind in `CLAUDE.md` — one hop. **(3)** Phase 159 depends on the content being findable.
  - **Also record what was deliberately kept.** At minimum: the E2E Hard Rule (cardinal failure), the E2E preflight contract (Phase 137), the `db:*` vs `dev:*` naming split, and the Svelte Warning-Accepted comment format are hard conventions, not prose, and stay.

- **D-I3 — option (a), by explicit `[x]` tick (also `★ RECOMMENDED`):** *"Fold `architect` into `CLAUDE.md`'s routing section and delete it; grow `components` by receiving the I2a essay."*
  - **Operator free text, verbatim and binding:** *"**NOTES**: Consider whether it would be useful to maintain, link, or copy the list of components in docs to the components skill. We'll need to update the docs part but we could keep these automatically in sync if linkage is not straightforward enough."*
  - The phase owes a **recorded evaluation of link vs. copy vs. generate** for the component listing; the operator's stated tiebreak is **automatic sync if a straightforward linkage is not available.**

- **D-I2 / D-I3 interaction:** both write into the same 917-byte `components/SKILL.md`. **Sequence them, not parallel.** Both also touch `CLAUDE.md`'s routing section, as does D-I1's judgement — **three edits, one section: sequence them as one task, not three.**

### Cross-cutting decisions that bind this phase

- **D-N1 (a):** Phase 152 lands a planning-reference scan in `yarn lint:check`. **Every comment and doc line this phase writes is subject to that guard.**
- **D-N2 (a):** Follow-up items are filed in `.planning/todos/pending/` during the owning phase, with a file:line anchor — not left as prose in a summary.
- **§ 0.1 (c):** `.planning/ROADMAP.md` was corrected in place by another agent. **This phase does not edit `ROADMAP.md`.**

### Claude's Discretion

- Whether the grown `components` skill is one file or `SKILL.md` + concrete resource files (subject to D-I1's one-level rule).
- Exact wording of the relocated Svelte-context sections, provided no invariant is weakened (D-I2.1).
- Where in `CLAUDE.md` the trimmed content and the routing entries sit.
- Which of the four extension-pattern files receive the "re-check the skill afterwards" note verbatim vs. tailored.

### Deferred Ideas (OUT OF SCOPE)

- Rewriting the four `.claude/skills/*/SKILL.md` domain skills into a different structure — D-I1 explicitly restructures nothing.
- Any change to `apps/docs` content beyond what the D-I3 sync evaluation concludes.
- Adding new CI jobs (Phase 163).
- Re-authoring the `ship-review-stack` procedure skill.
- Phase 162 (Permissions & Auth Model Refactor) is deliberately left open and excluded from this planning run.

</user_constraints>

---

<phase_requirements>
## Phase Requirements

**`<open>` item 1 in CONTEXT.md is RESOLVED.** REVIEW-DOC-01..04 **are** defined, at `.planning/REQUIREMENTS.md:160-163`, added by commit `48713631f` — *after* CONTEXT.md was measured at `52c631edf`, which is why its grep missed them. They map **1:1 onto roadmap criteria 1–4**, exactly as CONTEXT.md guessed but declined to assume. `[VERIFIED: .planning/REQUIREMENTS.md:160-163; git log -S 'REVIEW-DOC-01']`

| ID | Definition (`REQUIREMENTS.md`) | Research support |
|----|-------------------------------|------------------|
| REVIEW-DOC-01 | `.claude/skills/data/object-model.md` states the constituency and party-list rules an agent needs: one constituency per election; non-contradictory constituency selection across elections sharing a group or nested constituencies; child-implies-parent selection; and the party-list pattern as an `OrganizationNomination` with `CandidateNomination` children. | § *Criterion 1* — exact insertion lines 134 / 135 / 138 confirmed; reviewer's verbatim wording quoted; source-of-truth verified in `@openvaa/data`. |
| REVIEW-DOC-02 | The documented extension patterns are complete — dev-seed templates on a schema change, E2E coverage for a new filter (in the full voter journey where applicable), and re-checking the skill itself afterwards because skills contain listings. | § *Criterion 2* — insertion points, the uniform `## Verification After Extension` tail shared by all four files, the dev-seed template inventory (40 files), and the existing `entityFilters` E2E fixture to point at. |
| REVIEW-DOC-03 | The skill corpus's structure is chosen on a measurement, not an opinion; the number is recorded; the skills are restructured or left alone on that result. | § *Criterion 3* — corpus re-measured byte-for-byte; the spike-skill redundancy proof; the one-hop rule's single live violation located. |
| REVIEW-DOC-04 | `CLAUDE.md`'s existence is a recorded decision rather than an inherited default — evaluated against the 288-run ablation, decision and reasoning written down including "keep as is". | § *Criterion 4* — trim inventory, relocation destination, the three stale claims to fix in flight, the "deliberately kept" list all verified live. |

**Traceability rows already exist** at `REQUIREMENTS.md:309-312` and `:341` (`160 — Agent Docs & Skills Refresh | REVIEW-DOC-01..04 | 4`). No verifier gap. `[VERIFIED: .planning/REQUIREMENTS.md:309-312,341]`

</phase_requirements>

---

## Corrections to CONTEXT.md

Read these before planning. Each is measured, each changes a task.

### ⚠ C1 — **F6 is FALSE. The drift guard is not inert; it is RED.**

CONTEXT.md F6 states: *"it SKIPs any skill with `targets: []`, which is every skill in the tree. The drift guard is installed and inert."* Measured, that is wrong on both halves.

```bash
bash .claude/scripts/audit-skill-drift.sh; echo "EXIT=$?"
```

Actual output at `db220cb5f`: `[VERIFIED: command output, this session]`

```
  architect       SKIP  (no targets defined)
  components      SKIP  (no targets defined)
  data            DRIFT  1 commits, 1 files since 2026-08-17
  database        DRIFT  1 commits, 3 files since 2026-08-17
  filters         OK    (synced as of 2026-08-17)
  matching        OK    (synced as of 2026-08-17)
  ship-review-stack  OK    (synced as of 2026-08-28)
  spike-findings-voting-advice-application-gsd  SKIP  (no targets defined)
---
Checked: 5  Drifted: 2  Skipped: 3
EXIT=1
```

**Five of eight skills carry populated `targets:`** — verbatim from the frontmatters: `[VERIFIED: .claude/skills/*/SKILL.md frontmatter, read this session]`

| Skill | `targets:` |
|---|---|
| `architect` | `targets: []` |
| `components` | `targets: []` |
| `data` | `- packages/data/src/` |
| `database` | `- apps/supabase/`, `- packages/supabase-types/` |
| `filters` | `- packages/filters/src/` |
| `matching` | `- packages/matching/src/` |
| `ship-review-stack` | `- .agents`, `- .claude/scripts`, `- .planning/phases/151-ship-v0-2-akita-review-stack/scripts` |
| `spike-findings-*` | *(no `targets:` key at all)* |

Only the three routing/generated skills skip. **The planner must not carry the "inert guard" premise into a task.**

### ⚠ C2 — **`<open>` item 1 is resolved.** REVIEW-DOC-01..04 exist. See `<phase_requirements>`. Drop the "resolve before planning" task.

### ⚠ C3 — **F8 undercounts.** `architect` appears in **8** rows of `BOUNDARIES.md`, not four.

```bash
grep -n 'architect' .claude/skills/BOUNDARIES.md
```

`:15` (`frontend/` directory row), `:19` (`packages/app-shared/` directory row), `:57`–`:60` (four Concept Domains rows), `:81` and `:83` (two Gray Zones rows). `[VERIFIED: .claude/skills/BOUNDARIES.md:15,19,57-60,81,83]`

---

## Architectural Responsibility Map

| Capability | Primary tier | Secondary tier | Rationale |
|------------|-------------|----------------|-----------|
| Agent routing (which skill for which question) | `CLAUDE.md` § Skill Routing + each `SKILL.md` frontmatter `description` | — | D-I1's asserted rule makes the description **the** routing layer; the `CLAUDE.md` section is the repo-level index. One hop from either. |
| Domain reference content (schema, algorithms, filters, data model) | `.claude/skills/<domain>/*.md` | — | Already correct; D-I1 restructures nothing. |
| Framework-behaviour invariants the code cannot show (destructure trap, `#version` bridge) | `.claude/skills/components/` (post-D-I2) | `CLAUDE.md` pointer (one hop) | The ablation's own failure analysis says this is the class agents cannot recover by reading code — hence relocate, never delete. |
| Build/test commands and hard conventions | `CLAUDE.md` (inline) | — | The ablation's prescription: inline the always-relevant, route to the rest. |
| Ownership arbitration between skills | `.claude/skills/BOUNDARIES.md` | — | Cross-skill map; owned by no criterion but invalidated by D-I3 (see § *Criterion-adjacent*). |
| Component enumeration | `apps/docs` generator (`generate-component-docs.ts`) | `components` skill (via link / `targets:` / generation) | The listing is derived data; the generator is the single source. Duplicating it into a skill is what D-I3 must cost. |
| Skill-vs-source drift detection | `.claude/scripts/audit-skill-drift.sh` + `targets:` frontmatter | `.github/workflows/main.yaml:25-34` | Mechanism exists and works; its CI observation does not (see § *Pitfall 4*). |

---

## Standard Stack

**No external packages are installed by this phase.** Every deliverable is a Markdown edit, a frontmatter edit, or a decision record. The `## Package Legitimacy Audit` section is therefore **not applicable** — there is nothing to audit, and the planner must not introduce a dependency to satisfy a template.

Tooling already in the tree that the phase uses:

| Tool | Location | Purpose | Status |
|------|----------|---------|--------|
| `audit-skill-drift.sh` | `.claude/scripts/audit-skill-drift.sh` (135 lines) | Skill-vs-source drift from `targets:` | Works; exits 1 on drift; **red today** |
| `generate-component-docs.ts` | `apps/docs/scripts/generate-component-docs.ts` (8,934 B) | Extracts `@component` docstrings → per-component `+page.md` + TOC | Works; **last run 2026-03-31** |
| `generate-all-docs-and-validate.ts` | `apps/docs/scripts/` | Orchestrates the 5 doc scripts | Works, reachable **only** via `yarn workspace @openvaa/docs generate:docs` |
| `yarn lint:check` | root `package.json:` | Will carry Phase 152's planning-reference scan | Chain verified below |

`yarn lint:check` today, verbatim: `[VERIFIED: package.json scripts, read this session]`

```
turbo run lint && eslint --flag v10_config_lookup_from_file tests && yarn typecheck:tests && yarn typecheck && yarn assert:i18n-catalog-namespaces && yarn assert:a11y-scan-wiring
```

No planning-reference scan link yet — **Phase 152 adds it.** `[VERIFIED: package.json; ls .claude/scripts/ → audit-skill-drift.sh only]`

---

## The 152–159 → 160 coupling map

CONTEXT.md is right that 160 must run last. This is the concrete enumeration the orchestrator asked for: **which phase changes which fact that 160 writes.** Every cell below was checked against the live tree; the "today" column is what a plan authored now would (wrongly) write.

| Upstream | What it changes | Doc fact it invalidates | Today's value | Planning action |
|---|---|---|---|---|
| **152** | 817 comment lines rewritten; planning-reference scan lands in `yarn lint:check` | *Every doc line 160 writes* — a doc edit that introduces a planning reference into a code comment fails lint | scan absent from `lint:check` | 160's doc prose must not put planning references into **code comments**; `.md` files are the safe locus. Re-run `yarn lint:check` after 160's edits. |
| **156** | `party` → `organization` **throughout enums, schema, migrations and dev-seed templates**; `102-entities.sql:27` name/short_name resolved; `504-admin-rpcs.sql:12` renamed or generalised | `database/SKILL.md`, `schema-reference.md`, `rls-policy-map.md` terminology and enum listings; the `data` skill's `OrganizationNomination` prose | skill text uses both "party" and "organization" | The object-model addition (criterion 1) uses `OrganizationNomination` — **already the post-156 name**, so criterion 1 is 156-safe. The `database` skill's enum listings are not. |
| **157** | `supabaseDataProvider.ts` casts at `:56`, `:92`, `:368-378`, `:511` removed; **`WithAuth` type deleted (41 refs / 6 files)**; `logDebugError` → structured logger | `CLAUDE.md:190` "Supabase adapter in `apps/frontend/src/lib/api/adapters/supabase/`"; `:192` `universalAdapter.ts` | both paths exist today | Re-verify both paths at execution. Note the roadmap's own correction: the real path carries a `dataProvider/` segment. |
| **158** | **`$lib/routes/` is CREATED** (does not exist today); `buildRoute.ts`, `route.ts`, `loginRedirectTarget.ts` move into it; candidate auth callback + logout move under `/api` | `CLAUDE.md:231-235` path-alias list; `:239-245` key-directories list; `:243` "`lib/utils/` — Helper functions" | `svelte.config.js:11-15` declares exactly `$types`, `$voter`, `$candidate` | **`CLAUDE.md`'s alias list must be rewritten after 158**, not before. `$lib/routes` is a new entry. |
| **159** | 92 `$effect(` + 38 `$effect.root(` census; `reactiveHandle.type.ts` → `contexts/utils`; `candidateContext.svelte.ts:355` block extracted; `voterContext.svelte.ts:37` helper moves; **`MainContent` + route-root components move under a `$layouts/main` barrel behind a new alias** | The **entire D-I2 essay's** anchors: `candidateContext.svelte.ts:106-123`, `results/+layout.svelte:61-79`, `elections/+page.svelte:43-44`; and `CLAUDE.md:231-235` again (`$layouts` is a *second* new alias) | see § *Pitfall 1* — two of three are already wrong | **The relocation cannot be authored from today's line numbers.** Plan the essay move as "carry the invariant text verbatim; re-derive every anchor at execution." |

**Planning implication (restating CONTEXT.md's, now with the list):** the phase's plans must contain a **re-verify step for each of the anchors above**, executed at execution time. A plan that hard-codes `candidateContext.svelte.ts:106-123` will ship a dangling reference into the skill that replaces the one it is fixing.

---

## Criterion 1 — `data/object-model.md`, the three additions (REVIEW-DOC-01)

### Exact insertion points

The three reviewer comments land on three consecutive bullets of `## Key Relationships`. Verbatim from the file: `[VERIFIED: .claude/skills/data/object-model.md:134-138]`

```
134:- **Election -> ConstituencyGroup(s) -> Constituency(ies):** Elections have constituency groups; each group contains constituencies the voter chooses from.
135:- **Constituency -> parentConstituency:** Optional nesting for multi-level elections (e.g., regional + municipal).
136:- **Nomination links Entity + Election + Constituency:** A Nomination represents an entity nominated in a specific election-constituency pair.
137:- **CandidateNomination -> Candidate:** Links to the nominated person.
138:- **OrganizationNomination -> Organization:** Links to the party/association; may contain CandidateNominations and FactionNominations as children.
```

The reviewer's wording, verbatim from the triage: `[VERIFIED: .planning/PRE-SHIP-REVIEW-TRIAGE.md:348-353]`

- **`:134`** — *"Perhaps add in a succinct way: - The voter can also choose one constituency per election - In multi-elections settings, the constituency selections cannot be contradictory when multiple elections share the same constituency group or the constituencies are nested"*
- **`:135`** — *"Perhaps add: this allows the user to select only the child constiuency and we can imply the parent."*
- **`:138`** — *"Perhaps add: A very common pattern is a party list of candidates which is an OrganizationNomination with CandidateNominations as children."*

**The roadmap converts these hedged "Perhaps add" comments into mandatory criteria.** CONTEXT.md `<open>` 2 says to treat the roadmap wording as binding and the hedges as noise, and to state the conversion. Do state it.

### What the planner needs to know about the content

Two of the three additions are **product rules, not code facts** — they describe voter-facing selection semantics, not a class relationship. The `:138` addition is a pure restatement of the existing bullet's second clause and is code-checkable.

- `OrganizationNomination` already documents *"may contain CandidateNominations and FactionNominations as children"* at `:138` — so the party-list addition is a **naming of the common case**, not new information. `[VERIFIED: object-model.md:138]`
- `Constituency -> parentConstituency` nesting is already documented at `:135`; "child implies parent" is the **selection consequence** of that nesting, which the file does not state. `[VERIFIED: object-model.md:135]`
- "One constituency per election" and "selections cannot be contradictory across shared groups / nested constituencies" are **not present anywhere** in the file. `[VERIFIED: grep over object-model.md]`

> ⚠ **`[ASSUMED]` — flag for the planner.** I did **not** find a source-of-truth file in `@openvaa/data` that *enforces* "one constituency per election" or the non-contradiction rule. Those may be UI-layer invariants (`lib/contexts/voter/`) or unenforced conventions. The reviewer is the product owner and his statement is authoritative for a doc addition — but **the plan must not claim the rule is enforced by the data model** unless a task verifies it. Write the additions as *selection semantics*, sourced to the reviewer, not as class invariants.

### Anti-pattern to avoid in the wording

`object-model.md` is a **relationship map**, not a UX document. The additions must stay bullet-shaped and in the same register as their neighbours (one line, `**Term:**` prefix, consequence after the colon). A three-paragraph explanation of constituency selection belongs in a voter-flow doc, not here — and would itself violate D-I1's spirit.

---

## Criterion 2 — the three extension-pattern steps (REVIEW-DOC-02)

### 2a. dev-seed template step — `database/extension-patterns.md`

The reviewer's comment sits at `:75`, which is the **last numbered step** of the `## Adding a New Table` guide: `[VERIFIED: .claude/skills/database/extension-patterns.md:69-77]`

```
69: 12. **Add test data** `tests/database/00-helpers.test.sql`
...
75: 13. **Write pgTAP tests** (see "Adding pgTAP Tests" guide below)
76:
77: ## Adding RLS Policies
```

So the new step is **step 14**, appended before the `## Adding RLS Policies` heading.

**What it must point at.** The dev-seed template surface, measured: `[VERIFIED: find packages/dev-seed/src/templates -name '*.ts' | wc -l`]

| Path | Count | Role |
|---|---:|---|
| `packages/dev-seed/src/templates/default.ts` | 1 (11,885 B) | The `default` template — the Finnish demo dataset |
| `packages/dev-seed/src/templates/defaults/*.ts` | 4 | `alliances-override.ts`, `candidates-override.ts`, `nominations-override.ts`, `questions-override.ts` |
| `packages/dev-seed/src/templates/e2e/base.ts` | 1 | Canonical E2E base dataset |
| `packages/dev-seed/src/templates/e2e/perm/*.ts` | **30** | Per-permutation E2E templates |
| `packages/dev-seed/src/templates/index.ts` | 1 (10,654 B) | Template registry |
| **Total `.ts` under `templates/`** | **40** | |

A new table therefore has **up to 40 template files** to consider, plus `packages/dev-seed/README.md` § *Template shape reference* (`:241`) and § *Authoring Custom Templates* (`:119`). `[VERIFIED: grep -n '^#\{1,3\} ' packages/dev-seed/README.md]`

**Anti-pattern:** do not write the step as "update the dev-seed templates". Write it as a *check* with a named entry point — the registry at `templates/index.ts` and the shape reference in the README — because 30 of the 40 are permutation fixtures that a new table usually does **not** touch, and an unconditional "update all templates" instruction is worse than none.

### 2b. E2E filter step — `filters/extension-patterns.md`

The comment at `:57` is the blank line after the last numbered step of `## Adding a New Filter Type`: `[VERIFIED: .claude/skills/filters/extension-patterns.md:48-58]`

```
48: 6. **Add tests** `tests/filter.test.ts` (relative to `packages/filters/`)
...
56:    - Pattern: follow existing `NumberQuestionFilter` or `ChoiceQuestionFilter` test block in `filter.test.ts`
57:
58: ## Adding a Question-Type Filter Variant
```

New **step 7**, before the `## Adding a Question-Type Filter Variant` heading. Reviewer wording, verbatim: *"Add step: Add e2e tests for the filter, preferably in the full voter journey if applicable."* `[VERIFIED: .planning/PRE-SHIP-REVIEW-TRIAGE.md:355]`

**Note the second guide.** `filters/extension-patterns.md` has two guides (`## Adding a New Filter Type` at `:5`, `## Adding a Question-Type Filter Variant` at `:58`) and the second one **also** ends in an "Add tests" step at `:104` citing `filter.test.ts`. The reviewer commented on the first only. Decide explicitly whether the E2E step goes in both; the same argument applies to both. `[VERIFIED: grep -n '^#\{1,3\} ' .claude/skills/filters/extension-patterns.md]`

**The infrastructure already exists — point at it.** `[VERIFIED: tests/tests/fixtures/voter/entityFilters.fixture.ts, 356 lines, read this session]`

- Fixture: `tests/tests/fixtures/voter/entityFilters.fixture.ts` — `createEntityFilters(page)` exposing `openFilterDialog()`, `getFilter(target)`, `setSelection()`, `selectAll()`, `selectNone()`, `setNumberRange(min, max)`, `isAllSelected()`, `expectResetToBeDisabled()`, `setTextFilter()`, `clearTextFilter()`, `reset()`, `close()`.
- Consumer: `tests/tests/specs/voter/voter-journey.spec.ts:611` — `test('full voter journey end-to-end', async ({ page, resultsPage, entityFilters, entityDetails, voterHomePage }) => {`.
- Filter UI components live at `apps/frontend/src/lib/components/entityFilters`.

So the step should name the fixture and the journey spec, giving the next author a concrete extension point — not just "add an E2E test".

### 2c. The "re-check the skill afterwards" note — *all* skills

Reviewer wording, verbatim: *"If it's necessary, add a note to the extension patterns in all skills that the skill itself should be checked afterwards bc they contain listings."* `[VERIFIED: .planning/PRE-SHIP-REVIEW-TRIAGE.md:356]`

**There is a uniform insertion point across all four files.** Each `extension-patterns.md` ends with a `## Verification After Extension` numbered list: `[VERIFIED: grep -n '^#\{1,3\} ' + tail on all four files, this session]`

| File | Lines | `## Verification After Extension` at | Existing items |
|---|---:|---:|---:|
| `data/extension-patterns.md` | 166 | `:155` | 8 |
| `database/extension-patterns.md` | 193 | `:184` | 6 |
| `filters/extension-patterns.md` | 115 | `:106` | 6 |
| `matching/extension-patterns.md` | 98 | `:88` | 7 |

**Recommendation: append the note as the final numbered item of each `## Verification After Extension` list**, phrased identically across the four. That satisfies "all skills" with a single uniform edit, keeps the note where it will actually be read (at the end of the work, not the start), and gives a clean four-site diff.

**The `<open>` 2 question — does the note also belong in `ship-review-stack` and the grown `components`?** Evidence for a decision:

- `ship-review-stack` has **no `extension-patterns.md`** and owns no directory — `BOUNDARIES.md:23-27` says so in terms: *"Process skills own no source directory."* The reviewer's rationale ("bc they contain listings") does not apply to a procedure. **Recommend: exclude, record the reason.** `[VERIFIED: .claude/skills/BOUNDARIES.md:23-27]`
- The grown `components` skill **will** contain a listing (that is D-I3's whole subject), so the note applies **a fortiori**. **Recommend: include**, and note that this is the one place where the note and the sync mechanism meet.

**The note is not hypothetical — it is already violated.** See § *Pitfall 2*: the `database` skill carries 15 dangling schema filenames in 51 places precisely because nobody re-checked it after a renumbering. Cite that in the note's rationale so the next reader knows the cost is real.

### 2d. Reflexive application — `<open>` 6

Criterion 2's note applies to **this phase's own edits**. 160 changes `data/object-model.md`, all four `extension-patterns.md`, `components/SKILL.md`, deletes `architect/`, possibly deletes `spike-findings-*/`, and edits `CLAUDE.md`. **Plan an explicit final task** that re-checks every listing in the changed skills and in `BOUNDARIES.md`, rather than leaving it implicit. Concrete check available:

```bash
bash .claude/scripts/audit-skill-drift.sh; echo "EXIT=$?"
```

**Useful side effect the planner should know about.** The script derives its baseline from `git log -1 --format="%H" -- "$skill_dir/"` (`audit-skill-drift.sh:62`). Any commit touching a skill directory **resets that skill's baseline to HEAD**. Phase 160 commits edits inside `data/` and `database/` — the two skills currently DRIFTing — so the audit **goes green as a mechanical consequence of the phase**, whether or not the listings were actually re-checked. `[VERIFIED: .claude/scripts/audit-skill-drift.sh:60-71, read this session]`

> ⚠ **Do not use a green `audit-skill-drift.sh` as evidence that criterion 2d was satisfied.** It will be green either way. The evidence must be the listing diff itself.

---

## Criterion 3 — the progressive-disclosure measurement (REVIEW-DOC-03)

### The measurement, re-derived at `db220cb5f`

```bash
find .claude/skills -name '*.md' | wc -l
find .claude/skills -name '*.md' -exec cat {} + | wc -c
find .claude/skills/spike-findings-voting-advice-application-gsd -name '*.md' | wc -l
find .claude/skills/spike-findings-voting-advice-application-gsd -name '*.md' -exec cat {} + | wc -c
wc -c CLAUDE.md
```

| Corpus | Files | Bytes | vs CONTEXT.md fact 25 |
|---|---:|---:|---|
| All `.claude/skills/**/*.md` | **42** | **464,728** | exact |
| — of which generated `spike-findings-*` | **26** | **288,325** (62.04%) | exact |
| Hand-authored skills | **16** | **176,403** | exact |
| `CLAUDE.md` | 1 | **26,149** | exact |
| `.claude/skills/architect/SKILL.md` | 1 | **813** | exact |
| `.claude/skills/components/SKILL.md` | 1 | **917** | exact |

`[VERIFIED: commands above, run this session at HEAD db220cb5f]` — **reproduces byte-for-byte across a 5-commit HEAD advance.** Record these numbers; do not re-derive them again.

Full per-file inventory (`find .claude/skills -name '*.md' -exec wc -c {} + | sort -rn`), hand-authored subset: `[VERIFIED: command output]`

```
27017 ship-review-stack/SKILL.md      23467 database/SKILL.md
16374 database/schema-reference.md    13201 database/rls-policy-map.md
12585 matching/algorithm-reference.md 11951 BOUNDARIES.md
11311 database/extension-patterns.md  10223 data/extension-patterns.md
 9113 matching/SKILL.md                9032 data/SKILL.md
 9032 data/object-model.md             8276 filters/extension-patterns.md
 6853 filters/SKILL.md                 6238 matching/extension-patterns.md
  917 components/SKILL.md               813 architect/SKILL.md
```

### The conclusion D-I1 locks, and why it holds

The cited threshold, verbatim from the reviewer: *"disclosure only pays off once the corpus exceeds what the agent can navigate by direct reading … On a single-document scale, a strong harness that greps and reads on its own gets near-zero benefit from a curated index … The crossover comes when the corpus grows past what direct navigation can handle (multi-repo setups, large internal doc collections)."* `[CITED: .planning/PRE-SHIP-REVIEW-TRIAGE.md:346, quoting arXiv:2607.17598]`

**176,403 B across 16 files, in one repo, is below that crossover.** Record the number, conclude below-threshold, restructure nothing — as D-I1(a) locks.

> `[ASSUMED]` — I have **not** read arXiv:2607.17598 or arXiv:2607.27250 directly this session; both are known to me only through the reviewer's paraphrase in the triage. The paraphrase is detailed and internally consistent, and the decision is already locked, so this does not block planning. But **do not write a claim about the papers' methodology into the recorded decision beyond what the triage says**, and quote the triage rather than the papers.

### The one-level rule and its single live violation

The rule to assert, from the reviewer verbatim: *"A SKILL.md's frontmatter description is the routing layer; the body should either contain the instructions or point directly at concrete resource files (references/api.md, scripts/build.py) — not at a second index inside the skill."* `[CITED: .planning/PRE-SHIP-REVIEW-TRIAGE.md:346]`

**The repo's one violation, located precisely:**

```
CLAUDE.md:419-424 § Skill Routing
  → Skill("spike-findings-voting-advice-application-gsd")
    → SKILL.md:149 § Feature Areas  ← a TABLE of 8 rows, i.e. a second index
      → references/*.md  (8 files)
    → SKILL.md:162 § Source Files   ← a THIRD index
      → sources/*/README.md  (17 files)
```

`[VERIFIED: grep -n '^#\{1,4\} ' + grep -n 'references/' on .claude/skills/spike-findings-voting-advice-application-gsd/SKILL.md, this session — headings at :7 Project, :42 Requirements, :103 From Spikes 013–016, :149 Feature Areas, :162 Source Files, :171 Production Landing Map, :240 Processed Spikes]`

Every other skill routes in one hop: `data/SKILL.md` → `object-model.md` / `extension-patterns.md` directly, and so on. **The spike-findings skill is the sole two-hop (in fact three-hop) chain**, which is itself an argument the keep/delete judgement must weigh — as CONTEXT.md notes.

### The keep-or-delete judgement on `spike-findings-*` — evidence

The operator's NOTES makes this judgement **required**, with the reasoning recorded. Here is what the planner needs.

#### E1 — Composition of the 288,325 B

```bash
S=.claude/skills/spike-findings-voting-advice-application-gsd
wc -c $S/SKILL.md
ls $S/references/*.md | wc -l ; cat $S/references/*.md | wc -c
ls $S/sources/*/README.md | wc -l ; cat $S/sources/*/README.md | wc -c
```

| Part | Files | Bytes | % of skill | % of whole corpus |
|---|---:|---:|---:|---:|
| `SKILL.md` | 1 | 29,487 | 10.2% | 6.3% |
| `references/*.md` | 8 | 85,549 | 29.7% | 18.4% |
| `sources/*/README.md` | 17 | 173,289 | **60.1%** | **37.3%** |

`[VERIFIED: commands above, this session]`

#### E2 — **The 17 `sources/` files carry zero unique knowledge.** They are Prettier-reformatted copies of `.planning/spikes/*/README.md`.

`.planning/` is Prettier-ignored (`.prettierignore:36` — the entry is `.planning/`, under the comment `# Planning docs are not source code`), so the in-repo skill copies diverge from their originals **only by formatting**. `[VERIFIED: .prettierignore:36, read this session]`

Verification, normalising away whitespace, quote style and Markdown emphasis characters:

```bash
S=.claude/skills/spike-findings-voting-advice-application-gsd
for f in $S/sources/*/README.md; do
  n=$(basename $(dirname "$f")); b=".planning/spikes/$n/README.md"
  ha=$(tr -d " \t\n|\`'\"*_-" < "$f" | shasum | cut -d' ' -f1)
  hb=$(tr -d " \t\n|\`'\"*_-" < "$b" | shasum | cut -d' ' -f1)
  [ "$ha" = "$hb" ] && echo "$n IDENTICAL" || echo "$n DIFFERS"
done
```

**13 of 17 hash-identical under that normalisation.** The 4 that did not (`008-ssr-hydration-runes`, `009-store-codemod-feasibility`, `013-nav-mount-forensics`, `016-focus-and-a11y-during-transitions`) were then diffed line by line: **every difference is Prettier reflow** — a code block re-wrapped, `*` escaped as `\*` in prose, YAML `"` → `'`, list re-indentation, comment-column alignment. **No added or removed sentence in any of the four.** `[VERIFIED: diff of the four pairs, inspected this session]`

Example, `009-store-codemod-feasibility`, the entire semantic delta:

```
< validates: 'Given a regex-based Node.js codemod …'      ← skill copy (Prettier: single quotes)
> validates: "Given a regex-based Node.js codemod …"      ← .planning original
< ### Dry-run against production tree (apps/frontend/src/\*_/_.svelte)
> ### Dry-run against production tree (apps/frontend/src/**/*.svelte)
```

Note the second line: Prettier's escaping actually made the skill copy **worse** than its source.

#### E3 — `.planning/spikes/` is the superset, and holds the one spike the essay depends on

```bash
ls .planning/spikes/
```

24 spike directories (`001`…`024`, with `014a`/`014b`) plus `CONTEXT-CLASS-PROOF.md`, `CONTEXT-MEMBER-AUDIT.md`, `CONVENTIONS.md`, `MANIFEST.md`, `WRAP-UP-SUMMARY.md`. The skill wraps **16** of them (001–016). `[VERIFIED: ls output, this session]`

**Spikes 017–024 are not in the skill at all** — including **`024-derived-alias-stable-ref-skip`**, which is the source of the `dataRoot` `#version` carve-out that D-I2 relocates. The skill is therefore not just redundant; it is an **incomplete** snapshot that stops before the most load-bearing finding. `[VERIFIED: ls .claude/skills/spike-findings-*/sources/ → highest is 016; .planning/spikes/024-derived-alias-stable-ref-skip/README.md exists]`

#### E4 — Both spike domains have landed

```bash
grep -rn "from 'svelte/store'" apps/frontend/src | wc -l
grep -rn "from 'svelte/store'" apps/frontend/src/lib/contexts | wc -l
ls apps/frontend/src/lib/utils/viewTransition.ts
```

Domain 1 (rune migration): **1 hit repo-wide, 0 under `lib/contexts/`.** Domain 2 (View Transitions): wired at `apps/frontend/src/lib/utils/viewTransition.ts`. The skill's own description still reads *"Auto-loaded during implementation work"* — it is a blueprint for completed work. `[VERIFIED: reproduces CONTEXT.md F2; frontmatter read this session]`

#### E5 — ⚠ **"Available from git history" is materially weaker than the NOTES assumes.**

```bash
git ls-tree -r main --name-only .claude/          # → .claude/settings.json   (1 file)
C=$(git log --format=%H --diff-filter=A -- .claude/skills/spike-findings-*/SKILL.md | tail -1)
git merge-base --is-ancestor "$C" main            # → non-zero
git rev-list --count main..HEAD                   # → 46
```

`[VERIFIED: commands above, this session]`

Three facts, each of which weakens the fallback:

1. **`main` contains exactly one file under `.claude/`: `settings.json`.** `.claude/skills/` has **never** been on `main`.
2. **The add commit `14afb2d80a9eaf47f8e1e1424ac07f65d1500e2a` (`docs[planning]: add the v0.2 planning record and agent configuration`) is not an ancestor of `main`.** `main` is not an ancestor of HEAD either; HEAD is 46 commits ahead of the merge base.
3. **The repo squash-merges.** `main`'s history carries GitHub squash signatures (`refactor: move matching to lib and rename (#143)`) and only 8 merge commits in its last 200. This working branch is literally named `integration/ship-12-squash`, and `.claude/skills/ship-review-stack/` exists precisely to restructure this branch into a stacked PR set. `[VERIFIED: git log --oneline --merges -15 main; git branch --show-current]`

**Consequence to record:** if the skill is added and deleted within a range that reaches `main` as one squashed commit, its contents **never enter `main`'s history**. The recovery path would be the pre-squash branch ref, which is not a durable artifact. `.planning/` is likewise absent from `main` (`git ls-tree main --name-only | grep -c '^\.planning'` → 0), so neither the skill nor its sources are recoverable from `main` today.

**But the delete is still safe** — for a different reason than the NOTES gives. `.planning/spikes/` **stays in the working tree**, is not touched by this phase, is the superset (24 vs 16), and is the source the skill was generated from. The correct recorded reasoning is *"the content is preserved in-tree at `.planning/spikes/`"*, **not** *"it's in git history"*. Write it that way; the git-history claim would be a false premise handed to the next reader.

#### E6 — The unique 115,036 B, and the hard prerequisite

If deleted, the genuinely non-duplicated content lost is `SKILL.md` (29,487 B) + `references/*.md` (85,549 B) = **115,036 B** of synthesised digest — cross-spike syntheses (`migration-inventory-and-order.md`, `consumer-migration-codemod.md`, the 4-wave order, the Production Landing Map at `SKILL.md:171`). That synthesis is **not** in `.planning/spikes/` and would be genuinely lost from the working tree. `[VERIFIED: byte counts above; grep -n '^#\{1,4\} ' on SKILL.md]`

> The planner must weigh this, not skip it: E2/E3 prove the *sources* are redundant, they do **not** prove the *syntheses* are. An intermediate disposition exists and should be considered explicitly: **delete `sources/` only** (173,289 B, 60% of the skill, 37% of the whole corpus), keep `SKILL.md` + `references/`, and repoint `§ Source Files` at `.planning/spikes/`. That collapses the three-hop chain to two and removes the pure duplication, at the cost of not satisfying "remove them" literally. **Whatever is chosen, record why.**

**Hard prerequisite for any delete (CONTEXT.md F1, re-verified).** `CLAUDE.md:419-424` is the `## Skill Routing` section and its **only** content is this skill: `[VERIFIED: CLAUDE.md:419-424, read this session]`

```
419: ## Skill Routing
420:
421: - **Spike findings for voting-advice-application-gsd** — two domains:
422:   - Svelte 5 rune migration (spikes 001–012): …
423:   - Page navigation + View Transitions + a11y (spikes 013–016): …
424:     → `Skill("spike-findings-voting-advice-application-gsd")`
```

Deleting the skill without this edit creates a dangling reference — **the exact class Phase 152 exists to eliminate**, reintroduced by the phase whose job is documentation accuracy. The edit is part of the same change, and it collides with D-I3's edit to the same section (§ *Write-collision map*).

---

## Criterion 4 — `CLAUDE.md` against the ablation (REVIEW-DOC-04)

### Current structure — the trim inventory

`CLAUDE.md` is **424 lines / 26,149 B**. Section map, verbatim heading lines: `[VERIFIED: grep -n '^#\{1,4\} ' CLAUDE.md; wc -l CLAUDE.md]`

| Lines | Section | Disposition under D-I2(a) |
|---:|---|---|
| 1–8 | `# CLAUDE.md`, `## Overview` | keep (short) |
| 9–111 | `## Development Commands` (Setup, Building, Testing, **E2E Hard Rule** `:39`, **E2E preflight** `:47`, Linting, Workspaces, **Database & Stack Commands** `:72`, Single Test Dev) | **KEEP — these are the commands + hard conventions the ablation says to inline.** Fix `:87` (§ *Pitfall 3*). |
| 112–200 | `## Architecture` (Monorepo `:114`, Module Resolution `:142`, Build System `:157`, Key Architectural Patterns `:167`) | Candidate for trim; `:124` is factually wrong (§ *Pitfall 3*). |
| 201–217 | `## Development Environment` | keep (ports, URLs — commands class) |
| 218–247 | `## Frontend (SvelteKit)` (`:231-235` aliases, `:239-245` key dirs) | **Rewrite AFTER 158/159** — two new aliases land |
| 248–266 | `## Backend (Supabase)` | trim candidate |
| 267–316 | `## Common Workflows` | trim candidate |
| 317–326 | `## Important Implementation Notes` | keep (hard conventions) |
| **327–378** | **`### Context Destructuring Rule (Svelte 5)`** + the `dataRoot` carve-out | **RELOCATE to `components` skill — D-I2.1** |
| 379–390 | `### Svelte Warning-Accepted Format` | **KEEP** (named in D-I2's "deliberately kept" list) |
| 391–400 | `## Deployment` | trim candidate |
| 401–410 | `## Troubleshooting` | trim candidate |
| 411–414 | `## Roadmap` | trim candidate (4 lines, one stale-prone claim: *"Svelte 5 upgrade"* is listed as 2026 roadmap on an already-migrated codebase) |
| 415–418 | `## Code Review` | keep |
| **419–424** | **`## Skill Routing`** | **REWRITE — three edits collide here** |

**The relocation is 52 lines (`:327-378`) of a 424-line file — 12.3% by line.** That is the size of the D-I2 move; everything else in the trim is discretionary. `[VERIFIED: heading line numbers above]`

### The "deliberately kept" list — all four verified live

D-I2(a) requires recording what was kept. All four named items are real and current: `[VERIFIED: this session]`

| Item | Location | Live? |
|---|---|---|
| E2E Hard Rule (cardinal failure) | `CLAUDE.md:39-45` | yes — and it governs this repo's whole test discipline |
| E2E preflight contract (Phase 137) | `CLAUDE.md:47-55` | yes — `tests/global-setup.ts:20,37` implements `FRONTEND_PORT`; `apps/frontend/vite.config.ts:13-16,43` implements the env override and `strictPort: true` |
| `db:*` vs `dev:*` naming split | `CLAUDE.md:72-95` | yes — **all 25 `yarn <script>` invocations in `CLAUDE.md` exist in `package.json`** (checked below) |
| Svelte Warning-Accepted format | `CLAUDE.md:379-390` | yes |

Command-block audit — the todo asked for it explicitly (*"check the rest of the `db:*` / `dev:*` command block against `package.json`"*):

```bash
grep -oE '^yarn [a-z0-9:_-]+' CLAUDE.md | sed 's/^yarn //' | sort -u
node -e "const s=Object.keys(require('./package.json').scripts); …"
```

**Result: 25 distinct commands cited, 0 missing from `package.json`.** The command block is structurally sound; only two *descriptions* are wrong (§ *Pitfall 3*). `[VERIFIED: command output, this session]`

### The relocation destination and the pointer mechanics

**Destination.** `.claude/skills/components/SKILL.md` (917 B today) or a concrete resource file it points at directly. D-I1's one-level rule **permits** `SKILL.md` → `context-reactivity.md` (a concrete file) and **forbids** `SKILL.md` → an index → the file.

**Recommendation: `SKILL.md` + two concrete resource files.** Rationale, on the measurements: the essay is 52 lines / ≈8.5 KB and the component listing (if copied) is 17.4 KB. Putting both in one `SKILL.md` produces a ≈27 KB skill — larger than `database/SKILL.md` (23,467 B), today's biggest hand-authored domain skill. Splitting into `SKILL.md` (routing + component conventions) → `context-reactivity.md` + `component-listing.md` is **one hop from `SKILL.md`'s body to concrete files**, which is exactly what the rule permits, and mirrors the shape every other domain skill already uses (`data/SKILL.md` → `object-model.md` + `extension-patterns.md`). `[VERIFIED: per-file byte table above]`

**Pointer mechanics — the pattern the repo already uses.** `CLAUDE.md:419-424` shows the established form: a bolded label, a one-to-two-line discriminative description, then `→ Skill("<name>")` on its own indented line. Reuse it verbatim in shape. `[VERIFIED: CLAUDE.md:421-424]`

**How to prove no weakening (D-I2.1).** The invariant text has five load-bearing components; a verification task should assert each is present in the destination:

1. The two-class taxonomy — **stable references** (destructurable: `t`, `getRoute`, `darkMode`, `answers`, `userData`, lifecycle fns) vs **reactive accessors** (must be read `ctx.X`), with the ~25-name accessor list at `CLAUDE.md:337`.
2. The **why** at `:345` — "Destructuring invokes the getter ONCE at component-init time and binds the captured value… Reads via `ctx.X` re-invoke the getter inside the tracking scope."
3. The **Phase-113 reclassification** at `:354,:361,:367` — `appSettings`/`dataRoot`/`locale` are bare reactive fields post-FLATTEN-02 (no `.current`), **must not** be destructured; `getRoute` remains a `{ current }` handle and stays destructurable.
4. The **Spike-024 carve-out** at `:369-373` — identity-stable `#version`-bridge accessors; the `$derived` read alias goes stale on cold/direct-URL entry; **"never bind `dataRoot` to an intermediate read alias"**; safe consumption is `ctx.dataRoot.<prop>` read directly inside the consuming tracking scope.
5. The **four external references** at `:365` and `:375` — `61-03-DIAGNOSIS.md`, `.planning/spikes/024-derived-alias-stable-ref-skip/README.md`, `.planning/spikes/CONVENTIONS.md` §9, `.planning/debug/dataroot-stale-direct-nav.md`. **All four exist today** (`[VERIFIED: existence check, this session]`) — carry them across and re-verify.

A cheap mechanical proof: a task that greps the destination for the five load-bearing phrases (`ONCE at component-init`, `tracking scope`, `never bind`, `#version`, `FLATTEN-02`) and fails if any is absent.

---

## Criterion-adjacent: `BOUNDARIES.md` — in scope or filed?

`BOUNDARIES.md` (11,951 B, 85 lines) is owned by no success criterion but is invalidated by this phase's own work. The full damage assessment: `[VERIFIED: .claude/skills/BOUNDARIES.md, read this session]`

**Rows naming `architect` (deleted by D-I3): 8** — `:15`, `:19`, `:57`, `:58`, `:59`, `:60`, `:81`, `:83`. (CONTEXT.md F8 said four.)

**Rows with paths that do not exist:** `[VERIFIED: directory existence check, this session]`

| Line | Path in table | Live? | Correct path |
|---:|---|---|---|
| `:15` | `frontend/` | **MISSING** | `apps/frontend/` |
| `:16` | `frontend/src/lib/components/` | **MISSING** | `apps/frontend/src/lib/components/` (exists) |
| `:17` | `frontend/src/lib/dynamic-components/` | **MISSING** | `apps/frontend/src/lib/dynamic-components/` (exists) |
| `:18` | `frontend/src/lib/candidate/components/` | **MISSING** | `apps/frontend/src/lib/candidate/components/` (exists) |
| `:21` | `backend/vaa-strapi/` | **MISSING** | retired entirely — the row and its "see CLAUDE.md legacy note" reference should go (there is no legacy note in `CLAUDE.md` today) |

**Other stale rows:** `:64` `Svelte 4 component conventions` (same defect as F7); four rows marked `(deferred)` at `:15-19` that D-I3 resolves.

**Total: 8 architect rows + 5 bad paths + 1 Svelte-4 row = 14 of 85 lines require an edit — 16.5% of the file.** Four of them (`:16`–`:18`, `:64`) are `components` rows, i.e. **exactly the skill D-I3 grows**.

**Recommendation: scope `BOUNDARIES.md` INTO Phase 160.** Three arguments: (a) deleting `architect` without it leaves 8 dangling rows in a file whose entire purpose is authoritative ownership — the same dangling-reference class as F1; (b) 4 of the 14 rows are `components` rows the phase is rewriting anyway; (c) it is a single-file, ~14-line edit. If the planner scopes it out instead, D-N2 requires a `.planning/todos/pending/` entry with the file:line anchors above — but the `architect` rows cannot be deferred, because the skill they point to will not exist.

---

## D-I3: the component-listing sync — the four mechanisms, costed

The operator's tiebreak is **automatic sync if a straightforward linkage is not available**. Here is the evidence for each option.

### Option A — Link to the docs listing

**The listing exists** at `apps/docs/src/routes/(content)/developers-guide/frontend/components/generated/+page.md`, 17,428 B, header *"This documentation is automatically generated from the `@component` docstrings in Svelte files."*, footer `Total: 98 components`. `[VERIFIED: file head/tail read this session]`

**⚠ It is already 5 months stale.** File mtime `2026-03-31`; the generator's config and the live tree have moved since.

```bash
# committed listing: unique component names
grep -oE '^- \[[A-Za-z0-9_]+\]' ".../generated/+page.md" | sed 's/^- \[//; s/\]$//' | sort -u | wc -l   # → 97
# live tree: files matching the generator's own regex /<!--\s*@component\s*([\s\S]*?)-->/i
# across the three COMPONENT_DIRS from docs-scripts.config.ts:57-73
```

| | Committed listing | Live tree | Delta |
|---|---:|---:|---|
| `lib/components` | — | 65 `.svelte`, **64** with `@component` | |
| `lib/dynamic-components` | — | 31 `.svelte`, **31** with `@component` | |
| `lib/candidate/components` | — | 7 `.svelte`, **7** with `@component` | |
| **Total entries** | **98** | **102** | **+4** |
| Unique names | 97 | 101 | +4 |
| Names in docs not live | — | — | **0** |
| Names live not in docs | — | — | **4**: `EntityListWithControls`, `MultipleTextInput`, `NumberScaleInput`, `QuestionArguments` |

`[VERIFIED: multiline-aware node script replicating generate-component-docs.ts:122's regex, run this session; docs-scripts.config.ts:57-73 read this session]`

> **Note for the executor:** a line-oriented `grep` **undercounts to 7**, because the docstring format is `<!--\n@component\n…`. The generator reads whole files (`generate-component-docs.ts:118-129`). Any verification task must be multiline-aware or it will report a false catastrophe.

**Verdict on A:** linking is straightforward *mechanically* (one Markdown link), but it links to a **known-stale list**. The operator's note already anticipates this — *"We'll need to update the docs part"*. Linking without regenerating ships the staleness into the skill.

### Option B — Copy the listing into the skill

17,428 B copied into a 917-byte stub. Immediately becomes a second stale copy with no guard. **Contradicts the operator's stated preference** (automatic sync) and adds 17 KB to a corpus D-I1 just concluded is fine at 176 KB. **Not recommended.**

### Option C — Generate into the skill

**⚠ The generation pipeline is broken in six places.** `[VERIFIED: node comparison of root package.json scripts against apps/docs/package.json scripts, this session]`

| Root script | Delegates to | Exists in `apps/docs`? |
|---|---|---|
| `docs:generate` | `@openvaa/docs generate` | **NO** (it is `generate:docs`) |
| `docs:typedoc` | `@openvaa/docs generate:typedoc` | **NO** |
| `docs:typedoc-frontend` | `@openvaa/docs generate:typedoc-frontend` | **NO** |
| `docs:components` | `@openvaa/docs generate:components` | **NO** (it is `generate:component-docs`) |
| `docs:routes` | `@openvaa/docs generate:routes` | **NO** (it is `generate:route-map`) |
| `docs:prepare` | turbo build + frontend prepare | yes |
| `docs:dev` | `@openvaa/docs dev` | yes |

Plus CONTEXT.md F5, confirmed: `apps/docs/package.json:22` is `"generate:component-docs": "tsx scripts/extract-component-docs.ts"` and **`extract-component-docs.ts` does not exist** — the real file is `generate-component-docs.ts`. `[VERIFIED: apps/docs/package.json:22; ls apps/docs/scripts/]`

**5 of 7 root `docs:*` scripts + 1 workspace script = 6 broken references.** The only working entry point is `yarn workspace @openvaa/docs generate:docs` → `generate-all-docs-and-validate.ts`, whose five sub-scripts all exist (`generate-component-docs.ts`, `generate-route-map.ts`, `move-generated.ts`, `generate-navigation-config.ts`, `validate-links.ts`). `[VERIFIED: generate-all-docs-and-validate.ts:26-30 read this session; ls apps/docs/scripts/]`

**Verdict on C:** "generate into the skill" requires repairing six script references first. That is real work, and it is arguably **Phase 153's** ("Every build- and tooling-level assertion the repo makes about itself is true"). See § *The 153/160 boundary*.

**If C is chosen anyway**, the mechanism is small: `generate-component-docs.ts` already builds the TOC in `generateTableOfContents()` (`:217-279`) and writes it to `TOC_FILE = path.join(OUTPUT_DIR, 'README.md')` (`:11`). A second `writeFile` to `.claude/skills/components/component-listing.md` is a ~3-line addition. The hard part is the six broken references and a CI job to run it — and **new CI jobs are out of scope (Phase 163)**.

### Option D — `targets:` drift guard *(cheapest; **F6 was wrong about it**)*

Populate `components`' frontmatter:

```yaml
targets:
  - apps/frontend/src/lib/components
  - apps/frontend/src/lib/dynamic-components
  - apps/frontend/src/lib/candidate/components
```

**Two hard constraints, both from prior recorded experience:**

1. **Targets must be DIRECTORIES.** `audit-skill-drift.sh:79-81` does `if [[ ! -d "$target" ]]; then target_details+="(directory not found)"; continue; fi` — a file target is silently skipped and the skill **scores OK forever**. This is recorded at `.planning/STATE.md:971`: *"151-19: skill drift targets must be DIRECTORIES — audit-skill-drift.sh reports a file target as 'directory not found' and scores OK forever, an inert audit."* `[VERIFIED: .claude/scripts/audit-skill-drift.sh:79-81, read this session; .planning/STATE.md:971]`
2. **DRIFT exits 1** (`audit-skill-drift.sh:130-135`). Adding these targets makes the build red on the next commit to any component directory. That is the mechanism working as designed, but it is a **red-CI-by-default** posture and must be recorded as a deliberate choice, not stumbled into.

Churn estimate (caveat: this worktree's history is squashed, so counts understate real churn):

```bash
for d in apps/frontend/src/lib/{components,dynamic-components,candidate/components}; do
  git rev-list --count --since='90 days ago' HEAD -- $d; done
```

2 / 3 / 2 commits in 90 days — comparable to `packages/data/src` (2) and `apps/supabase` (2), which already carry targets. **The marginal CI-noise cost is in line with the existing four target-carrying skills.** `[VERIFIED: command output, this session]`

### Recommendation for D-I3

**Record the evaluation as: A + D, with C filed as a todo.**

- **D (populate `targets:`)** delivers "automatic sync" in the operator's sense — the guard fires when the source changes — at near-zero cost, uses the mechanism the repo already runs in CI, and is inside 160's surface (it is a frontmatter edit to a file the phase rewrites anyway).
- **A (link, not copy)** keeps one source of truth. Pair it with a one-time regeneration so the linked list is current at the moment 160 lands — **`yarn workspace @openvaa/docs generate:docs`**, the one working entry point.
- **C (generate into the skill)** and the six broken script references become a `.planning/todos/pending/` entry per D-N2, anchored at `apps/docs/package.json:22` and `package.json` `docs:*`, with the Phase 153 cross-reference.

This satisfies the operator's tiebreak literally: a straightforward linkage **is** available (A), and automatic sync (D) is added on top because it is cheaper than not adding it.

---

## The 153/160 boundary — recommendation, with the evidence to record it

The orchestrator asked for the drift-script contract precisely so this boundary can be **decided and recorded**. Here it is.

### The script's contract, read from source

`[VERIFIED: .claude/scripts/audit-skill-drift.sh, 135 lines, read in full this session]`

| Behaviour | Line(s) | Detail |
|---|---:|---|
| Frontmatter parse | `:27-50` | Reads until the second `---`; `^targets:` starts a list; **an inline `[]` breaks immediately** (`:37-39`); list items must match `^[[:space:]]+-[[:space:]]+(.*)` |
| Empty targets → SKIP | `:52-56` | prints `SKIP  (no targets defined)` |
| Baseline | `:62` | `git log -1 --format="%H" -- "$skill_dir/"` — the last commit touching **the skill directory** |
| Uncommitted skill → SKIP | `:64-68` | `SKIP  (skill not yet committed)` |
| Non-directory target | `:79-82` | `(directory not found)`, **`continue`** — the target is silently ignored |
| Drift test | `:85-87` | `git rev-list <skill_commit>..HEAD -- <target>` and `git diff --name-only` |
| Green | `:98` | `OK    (synced as of <date>)` |
| Red | `:100-103,130-135` | `DRIFT  N commits, M files since <date>` and **`exit 1`** |
| Single-skill mode | `:111-118` | `audit-skill-drift.sh <skill-name>` |

A correct `targets:` entry is therefore: **a repo-root-relative directory path, one per `  - ` list item, no inline `[]`.** Example from a working skill, verbatim: `[VERIFIED: .claude/skills/database/SKILL.md frontmatter]`

```yaml
targets:
  - apps/supabase/
  - packages/supabase-types/
```

A green run is `Checked: N  Drifted: 0` + exit 0; a red run is `Drifted: ≥1` + exit 1 with per-target commit/file counts.

### The CI wiring — and why it is unobserved

`[VERIFIED: .github/workflows/main.yaml:1-35, read this session]`

```yaml
on:
  push:    { branches: [main], paths-ignore: ["**.md", "**/*/.env.example", ".env.example"] }
  pull_request:
    types: [opened, synchronize, reopened, ready_for_review]
    branches: [main]
    paths-ignore: ["**.md", "**/*/.env.example", ".env.example"]
jobs:
  skill-drift-check:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
        with: { fetch-depth: 0 }
      - name: "Check skill drift"
        run: .claude/scripts/audit-skill-drift.sh
```

**Two independent reasons it does not currently produce a signal:**

1. **`paths-ignore: "**.md"`.** Phase 160 is an all-Markdown change. A PR whose diff is only `.md` files **does not trigger this workflow at all** — so the job cannot go red on 160's own work.
2. **`origin/main` does not have this job.** Recorded at `.planning/STATE.md:942`: *"151-10: stack PRs fire origin/main's main.yaml, which has NO skill-drift-check — research Pitfall 7 is wrong; real CI signature is 'Setup Yarn 4.6' / YN0028."* `[VERIFIED: .planning/STATE.md:942]`

So: the mechanism works locally and exits 1 correctly, and its CI observation is currently vacuous.

### Recommended boundary

- **Phase 160 owns:** the `targets:` frontmatter **content** — populating `components`, and deciding whether `spike-findings-*` and `architect` need entries (moot if deleted). Frontmatter is skill content; skills are 160's surface.
- **Phase 153 owns:** the *assertion that the CI step is true* — its Goal is literally *"Every build- and tooling-level assertion the repo makes about itself is true, and the ones that were never true are fixed rather than documented."* The `paths-ignore` hole and the origin/main gap are exactly that class. `[VERIFIED: .planning/ROADMAP.md Phase 153 Goal]`
- **Phase 163 owns:** any *new* CI job — explicitly out of 160's scope per CONTEXT.md.

**Record this split in the phase's decision record**, with `STATE.md:942`, `STATE.md:971` and `main.yaml:7-22` as the anchors. Filing it as a todo per D-N2 is the fallback if the planner disagrees.

---

## Write-collision map — what must be sequenced

The orchestrator asked for every collision site. Here they are, with line anchors.

| File | Writers | Collision |
|---|---|---|
| **`.claude/skills/components/SKILL.md`** (917 B) | **D-I2** (receives the 52-line essay), **D-I3** (component listing / sync), **F7** (frontmatter description rewrite), **D-I3-D** (`targets:` populate) | **4 writes, 1 file.** Two of them are frontmatter, two are body. **Serial.** |
| **`CLAUDE.md:419-424` § Skill Routing** | **D-I1** (may remove its only entry), **D-I2** (adds the `components` pointer), **D-I3** (absorbs `architect`'s content) | **3 edits, 6 lines.** CONTEXT.md is explicit: *"sequence them as one task, not three."* |
| **`CLAUDE.md`** (whole file) | D-I2 trim (`:327-378` removal + § selection), Pitfall-3 fixes (`:87`, `:124`), the `:347` dangling-path repair, the 158/159 alias-list rewrite (`:231-235`, `:239-245`) | 5 write classes. Group the **body** edits into one task and the **routing section** into another; they do not overlap in line range. |
| **`.claude/skills/BOUNDARIES.md`** | `architect` deletion (8 rows), path corrections (5 rows), Svelte-4 row (`:64`) | Single task; no other writer. |
| **`.claude/skills/data/object-model.md`** | Criterion 1 only (`:134`, `:135`, `:138`) | No collision — **fully parallel-safe.** |
| **The four `extension-patterns.md`** | Criterion 2 (dev-seed → `database`; E2E → `filters`; self-check note → all four) | `database` and `filters` each get 2 edits in different sections; safe within one task per file. **Parallel-safe across the four.** |
| **`.claude/skills/architect/`** | Deleted by D-I3 | Must land **after** its content is folded into `CLAUDE.md § Skill Routing`. |
| **`.claude/skills/spike-findings-*/`** | Possibly deleted by D-I1 | Must land **after** the `CLAUDE.md § Skill Routing` edit. |

**Recommended wave structure:**

- **Wave 1 (parallel):** object-model additions · the four extension-pattern edits. Zero collisions with anything.
- **Wave 2:** the D-I1 measurement + keep/delete judgement, written to the decision record (see § *Where the record lives*). No file edits to `CLAUDE.md` yet.
- **Wave 3 (serial):** `components/SKILL.md` — frontmatter rewrite (F7 + `targets:`), then the essay relocation (D-I2), then the listing/sync (D-I3).
- **Wave 4 (serial, single task):** `CLAUDE.md § Skill Routing` — all three edits at once. Then the deletions (`architect/`, and `spike-findings-*` if the judgement is DELETE).
- **Wave 5:** `CLAUDE.md` body trim + the three factual fixes + the post-158/159 alias rewrite; `BOUNDARIES.md`; the reflexive self-check (2d).

---

## Where the recorded number and reasoning should live

Criteria 3 and 4 both demand a **recorded decision** the next reader will find, and the operator constraint forbids editing `ROADMAP.md` / `REQUIREMENTS.md` / `STATE.md`. Options in the tree:

| Candidate | Pro | Con |
|---|---|---|
| `.planning/phases/160-agent-docs-skills-refresh/160-DECISIONS.md` | GSD-native; sits with the phase's other artifacts | `.planning/` is **not on `main`** and is stripped by `gsd-pr-branch`; a reader outside this branch never sees it |
| **`.claude/skills/README.md`** *(new)* | Lives **with the corpus it describes**; a reader of `.claude/skills/` finds it; ships with the code; the natural home for "why this corpus is shaped this way" | New file (small) |
| `.claude/skills/BOUNDARIES.md` (append) | Already the cross-skill meta-doc; already being edited | Mixes ownership arbitration with a structural decision record — two concerns |
| `CLAUDE.md` | Maximum visibility | **Directly contradicts D-I2**, which is trimming it |

**Recommendation: `.claude/skills/README.md`.** It is the one location that (a) travels with the artifact, (b) survives the `.planning/`-stripping ship path, (c) is where an agent or human browsing `.claude/skills/` will actually land, and (d) does not re-inflate `CLAUDE.md`. Give it three sections: **the measurement** (the byte table above, with its commands), **the disclosure conclusion + the one-level rule**, and **the `spike-findings` keep/delete judgement with its reasoning** (including the E5 git-history caveat).

`CLAUDE.md § Skill Routing` then gets a one-hop pointer to it — which is itself a demonstration of the rule the file asserts. **A phase-local `160-DECISIONS.md` is the wrong sole home**; if the planner also wants one, make it a pointer, not the record.

---

## Common Pitfalls

### Pitfall 1 — **The essay being relocated contains a dangling file reference and a drifted line range.** *(highest severity)*

`CLAUDE.md:347` reads:

```
**Canonical pattern** (`apps/frontend/src/routes/(voters)/(located)/results/+layout.svelte:61-79`):
```

**That file does not exist.** `[VERIFIED: existence check, this session]` The nearest real file is:

```
apps/frontend/src/routes/(voters)/(located)/results/[[electionTab]]/+layout.svelte
```

— the path acquired a `[[electionTab]]` segment. `[VERIFIED: find apps/frontend/src/routes -path '*results*' -name '+layout.svelte']`

`CLAUDE.md:365` reads *"The in-tree explanation lives at `apps/frontend/src/lib/contexts/candidate/candidateContext.svelte.ts:106-123`."* Measured, `:106` is `return this.#appContext.locale;` and `:123` is `// userData composite producer — declared AFTER #answersLocked + #lo…`. **Neither is the explanation.** The real explanation is in two places in that file: `[VERIFIED: grep -n on candidateContext.svelte.ts, this session]`

```
 61: * ── Destructure-trap contract ────────────────────────────────────────────────
 62: * This very context is the canonical Phase-61 destructure-trap diagnostic
 ...
 66: * data load propagate. Do NOT regress to destructured-capture or pull-chain.
...
178:  // Root mechanism: Svelte 5 tracks reactive reads from within a tracking scope,
179:  // but a DESTRUCTURED context-object property (`const { opinionQuestions } = ctx`)
...
188:  // Consumers that previously destructured now read `ctx.X` directly; inline
```

`CLAUDE.md:373`'s third anchor **is correct**: `apps/frontend/src/routes/(voters)/elections/+page.svelte:43-44` reads `let elections = $derived.by(() => {` / `let result = voterCtx.dataRoot.elections;` — exactly the pattern cited. `[VERIFIED: sed -n '43,44p']`

**Two of three anchors are already wrong, and 159 will move the third.** Relocating the essay verbatim would **carry both defects into the new home** — a phase whose job is documentation accuracy shipping two dangling references. **Plan an explicit anchor-repair step inside the relocation task**, executed after 159 lands.

### Pitfall 2 — **Skill listings are already stale, and the `database` skill is the proof.**

The schema was renumbered from an `0NN-` scheme to a banded `NNN-` scheme and nothing re-checked the skill.

```bash
grep -rhoE '[0-9]{3}-[a-z-]+\.sql' .claude/skills/database/ | sort -u \
  | while read f; do [ -f "apps/supabase/supabase/schema/$f" ] || echo "$f"; done
```

**15 distinct dangling filenames, 51 occurrences across 4 files.** `[VERIFIED: command output, this session]`

| Cited (dangling) | Renumbered to |
|---|---|
| `001-tenancy.sql` | `100-tenancy.sql` |
| `002-elections.sql` | `101-elections.sql` |
| `003-entities.sql` | `102-entities.sql` |
| `004-questions.sql` | `103-questions.sql` |
| `005-nominations.sql` | `104-nominations.sql` |
| `006-answers-jsonb.sql` | (no direct successor — nearest is `105-answers.sql`) |
| `007-app-settings.sql` | `106-app-settings.sql` |
| `009-indexes.sql` | `200-indexes.sql` |
| `010-rls.sql` | `302-rls.sql` |
| `011-auth-tables.sql` | `300-auth-tables.sql` |
| `012-auth-hooks.sql` | (no direct successor — nearest is `301-auth-functions.sql`) |
| `013-auth-rls.sql` | (no direct successor — folded into `302-rls.sql`) |
| `014-storage.sql` | `400-storage.sql` |
| `015-external-id.sql` | `500-external-id.sql` |
| `016-bulk-operations.sql` | `501-bulk-operations.sql` |

Per-file occurrence counts: `schema-reference.md` 22 · `extension-patterns.md` 17 · `rls-policy-map.md` 9 · `SKILL.md` 3.

**The skill is internally inconsistent** — it cites both `010-rls.sql` (dangling) and `302-rls.sql` (live), both `011-auth-tables.sql` and `300-auth-tables.sql`. A partial migration was made and abandoned.

Also measured against the `database` skill's own frontmatter claims: `[VERIFIED: grep counts over apps/supabase/supabase/, this session]`

| Advertised in `description` | Measured |
|---|---|
| "17-table PostgreSQL schema" | **20** `CREATE TABLE` in `schema/` |
| "97 RLS policies" | **97** `CREATE POLICY` — **correct** |
| "3 Edge Functions" | **3** (`identity-callback`, `invite-candidate`, `send-email`) — **correct** |
| "204 pgTAP tests" | 11 `.sql` files, 267 assertion calls — not directly comparable; likely drifted |

**Implication for planning:** this is the concrete cost that justifies criterion 2c's note. **But fixing all 51 is not in any REVIEW-DOC requirement**, and **Phase 156 renames `party` → `organization` throughout the schema anyway**, which will churn these files again. **Recommend: cite the count in the 2c note's rationale, and file the 51 fixes as a `.planning/todos/pending/` entry (D-N2) rather than absorbing them into 160.** If the planner scopes them in, do it **after** 156.

### Pitfall 3 — **Three stale factual claims in `CLAUDE.md`, all confirmed.**

Two are filed at `.planning/todos/pending/2026-08-28-claude-md-stale-factual-claims.md` (`resolves_phase: 160`); the third is new from this research (Pitfall 1).

**(a) `CLAUDE.md:87` — sqlfluff.** Current text, verbatim:

```
yarn db:lint:sql              # Run SQL linter on all migrations (sqlfluff + Splinter advisors)
```

Measured chain: `[VERIFIED: package.json:24; apps/supabase/package.json:12-14, read this session]`

```
package.json:24            "db:lint:sql": "yarn workspace @openvaa/supabase lint:all"
apps/supabase/package.json:14  "lint:all":  "yarn lint:sql && yarn lint:schema"
apps/supabase/package.json:12  "lint:sql":  "supabase db lint --schema public --fail-on warning"
apps/supabase/package.json:13  "lint:schema": "node scripts/lint-schema.mjs"
```

**There is no sqlfluff anywhere in the repo** — no dependency, no `.sqlfluff` config, and the only non-`.planning` occurrence of the string is `CLAUDE.md:87` itself. `[VERIFIED: grep -rn 'sqlfluff' over json/yaml/md/cfg/toml; ls .sqlfluff apps/supabase/.sqlfluff → both missing]`

**Corrected text for the planner:**

```
yarn db:lint:sql              # Run the SQL linters: `supabase db lint` (plpgsql_check, --fail-on warning) + scripts/lint-schema.mjs (Splinter advisors)
```

⚠ The todo notes the same false premise has a **second home** in `ROADMAP.md`'s Phase 163 criterion 1 (*"a deliberate sqlfluff violation … turns the build red"*). **This phase must not edit `ROADMAP.md`** (§ 0.1(c)). File the ROADMAP half as a `.planning/todos/pending/` cross-reference to Phase 163 per D-N2.

**(b) `CLAUDE.md:124` — ESM + CommonJS.** Current text: *"`@openvaa/app-shared` … Builds to both ESM (frontend) and CommonJS (backend)"*.

Measured: `[VERIFIED: packages/app-shared/tsup.config.ts:5; packages/app-shared/package.json:5,12-22, read this session]`

```ts
// packages/app-shared/tsup.config.ts:3-9
export default defineConfig({
  entry: ['src/index.ts'],
  format: ['esm'],
  ...
```

and the package's own `description` already says so: *"ESM-only — all current consumers are ESM (`type: module`)."* The `exports` map has **only** an `import` condition — no `require`.

**Corrected text:** *"`@openvaa/app-shared` — Shared between frontend and backend (application settings, extended data types, utilities). **ESM-only** (`tsup` `format: ['esm']`); every consumer is `type: module`."*

**(c) `CLAUDE.md:347` — the dangling `results/+layout.svelte` path.** See Pitfall 1.

**Base rate is unmeasured for prose, measured for commands.** The todo says *"these two were found incidentally, not by an audit, so the base rate of stale claims in that section is unmeasured."* This research closes half of that: **all 25 `yarn` commands cited in `CLAUDE.md` exist** (§ *The "deliberately kept" list*), and **all 11 cited external files/paths exist** (`.agents/code-review-checklist.md`, `tests/README.md`, `packages/README.md`, `packages/dev-seed/README.md`, `packages/matching/examples/example.ts`, `render.example.yaml`, `docker-compose.dev.yml`, and the four planning-doc references at `:365`/`:375`). `[VERIFIED: existence checks, this session]` **The remaining unmeasured surface is descriptive prose**, which is where all three defects were found.

### Pitfall 4 — Do not treat the drift guard as a verification oracle. See § *Criterion 2d* — it goes green mechanically, and its CI step does not fire on `.md`-only PRs.

### Pitfall 5 — **F7 is real: the `components` frontmatter advertises Svelte 4 on a Svelte 5 codebase.**

Current, verbatim `[VERIFIED: .claude/skills/components/SKILL.md:1-5, read this session]`:

```yaml
---
name: components
description: 'Domain expert for the OpenVAA frontend component library. Understands base components (Button, Modal, Input, Icon), dynamic data-aware components (EntityCard, EntityList, Navigation), candidate-specific components, Tailwind/DaisyUI styling conventions, accessibility patterns (WCAG 2.1 AA), Svelte 4 component patterns (export let, $$Props, concatClass), and the slot/variant system. Activate when creating or modifying Svelte components, reviewing component changes, or understanding the component architecture.'
targets: []
---
```

Under D-I1's asserted rule the **description IS the routing layer**, so this is a routing defect. Body, verbatim: `> Deferred to post-Svelte 5 migration. This stub establishes the skill trigger.` followed by a `## Placeholder` list ending `- Svelte 4 component conventions`.

**Corrected description (proposal — the planner may reword; the substance is what matters):**

> Domain expert for the OpenVAA frontend component library. Covers base components (Button, Modal, Input, Icon), dynamic data-aware components (EntityCard, EntityList, Navigation), candidate-app components, Tailwind/DaisyUI conventions, WCAG 2.1 AA patterns, **Svelte 5 runes component patterns (`$props()`, `$state`, `$derived`, snippets), and the context reactivity rules — the destructure trap and the `dataRoot` `#version`-bridge carve-out**. Activate when creating or modifying Svelte components, reviewing component changes, or reading/writing code that consumes `getVoterContext()` / `getCandidateContext()` / `getAppContext()`.

The bolded clause is what makes the description discriminative **after** the D-I2 relocation — an agent hitting a destructure-trap bug must be routed here in one hop. `BOUNDARIES.md:64` (`Svelte 4 component conventions`) carries the same defect and is fixed in the same wave.

`architect`'s description is **not** stale (it describes monorepo/routing/adapter/settings, all still true) — its problem is only that the body is a placeholder, which D-I3 resolves by folding it into `CLAUDE.md § Skill Routing`. `[VERIFIED: .claude/skills/architect/SKILL.md, read this session]`

### Pitfall 6 — the multiline `@component` regex. See § *Option A* — a line-oriented grep undercounts 102 → 7.

### Pitfall 7 — D-N1's lint guard applies to code comments, not `.md`

Phase 152's scan targets **planning references in code comments**. This phase writes `.md` and frontmatter almost exclusively, so the exposure is low — but the relocated essay's `.planning/spikes/…` and `.planning/debug/…` references are **planning references**, and they are load-bearing (D-I2.1 requires carrying them). **They belong in a `.md` skill file, which is safe.** Do not, in the course of the relocation, add any of them to a `.svelte` or `.ts` comment. Re-run `yarn lint:check` after 160's edits regardless.

---

## Don't Hand-Roll

| Problem | Don't build | Use instead | Why |
|---|---|---|---|
| Detecting skill-vs-source drift | A new script or CI job | `.claude/scripts/audit-skill-drift.sh` + `targets:` frontmatter | Already installed, already in CI, already working (5 checked / exit 1). New CI jobs are Phase 163's scope. |
| Enumerating components | A hand-maintained list in the skill | `apps/docs/scripts/generate-component-docs.ts` + the generated `+page.md` | One source of truth already exists; a second copy is guaranteed to drift (the existing one already has, by 4 entries over 5 months). |
| Re-measuring the corpus | Re-deriving byte counts | The table in § *Criterion 3*, with its commands | Reproduces byte-for-byte across a 5-commit HEAD advance. |
| Re-flattening the spike-findings skill | A hand-flatten of the two-hop chain | Delete, or delete `sources/` only | CONTEXT.md rejects (c) explicitly: the skill is machine-generated by `/gsd-spike --wrap-up`, so a hand-flatten is undone by the next wrap-up. |
| Preserving the spike knowledge | Copying content out before deleting | `.planning/spikes/` (already in-tree, 24 spikes) | E2/E3 prove the `sources/` half is already there and the planning copy is the superset. |
| Verifying the relocation | Prose review | A grep for the five load-bearing phrases (§ *How to prove no weakening*) | Mechanical, cheap, and catches the exact failure mode D-I2.1 forbids. |

**Key insight:** every mechanism this phase needs already exists in the repo. What is missing is not tooling — it is **the recorded decision about which mechanism to point at**, which is what criteria 3 and 4 are actually asking for.

---

## State of the Art

| Old | Current | Impact on this phase |
|---|---|---|
| Skills as a hierarchy of indexes | One-level disclosure: description → concrete files | D-I1 asserts it; the spike-findings skill is the one violation |
| Big context files improve correctness | 288-run ablation finds no measurable gain; keep lean, invest in verification | D-I2 trims; but the ablation's own failure analysis carves out framework invariants agents can't recover from code — which is why the essay moves rather than dies |
| Svelte 4 (`export let`, `$$Props`) | Svelte 5 runes; `vitePlugin.dynamicCompileOptions` forces `runes: true` outside `node_modules` (`apps/frontend/svelte.config.js:20-26`) | F7 / `BOUNDARIES.md:64` are stale on this |
| `frontend/`, `backend/vaa-strapi/` | `apps/frontend/`, Supabase (`apps/supabase/supabase/`) | `BOUNDARIES.md:15-18,21` still names the retired layout |
| `schema/0NN-*.sql` | `schema/NNN-*.sql` banded scheme | Pitfall 2 — 15 dangling names in the `database` skill |
| `supabase:*` scripts | `db:*` (DB-only) / `dev:*` (full stack) | Correct in `CLAUDE.md`; **keep** per D-I2 |

**Deprecated / to remove:** `CLAUDE.md:411-413` `## Roadmap` lists *"Svelte 5 upgrade"* as 2026 work on an already-migrated codebase — a trim candidate that is also a stale claim.

---

## Runtime State Inventory

This phase edits and deletes documentation. Applying the rename/refactor inventory anyway, because a skill **deletion** has non-file consequences:

| Category | Items found | Action required |
|---|---|---|
| **Stored data** | **None** — no database, cache or datastore keys the skill names. Verified: `.claude/skills/` contains only `.md` files (42) plus `.claude/scripts/audit-skill-drift.sh`. | none |
| **Live service config** | **None** in an external service. **In-repo:** `.github/workflows/main.yaml:34` invokes the drift script by path — the path is unchanged by this phase. | none |
| **OS-registered state** | **None.** No task scheduler, pm2, launchd or systemd unit references `.claude/skills/`. Verified: no such registrations in this repo. | none |
| **Secrets / env vars** | **None.** No env var names the skill corpus. `FRONTEND_PORT` is referenced *by* `CLAUDE.md` and is unchanged. | none |
| **Build artifacts / installed packages** | **`apps/docs/scripts/.temp/`** (`GENERATED_DIR`, `docs-scripts.config.ts:16`) holds intermediate generated docs; **`apps/docs/src/routes/(content)/developers-guide/frontend/components/generated/`** holds the committed 5-month-old output. If option A's one-time regeneration is taken, **this directory is rewritten and its diff is a real, reviewable change** (+4 components at minimum). | regenerate + review the diff, if A is chosen |
| **⚠ Agent-runtime registration** | **The skill *name* is a runtime identifier.** `Skill("spike-findings-voting-advice-application-gsd")` at `CLAUDE.md:424` and the `architect` / `components` skill triggers are resolved by the harness from the directory name + frontmatter `name`. Deleting a directory without removing every invocation leaves a call to a nonexistent skill. | grep for `Skill("architect")`, `Skill("components")`, `Skill("spike-findings-…")` and every prose mention, repo-wide, before deleting |

**Concrete pre-delete check the planner should schedule:**

```bash
grep -rn 'spike-findings-voting-advice-application-gsd' --include='*.md' --include='*.json' --include='*.yaml' . | grep -v '^./.claude/skills/spike-findings' | grep -v '^./.planning/'
grep -rn 'Skill("architect")\|skills/architect' --include='*.md' . | grep -v '^./.planning/'
```

Known hits today: `CLAUDE.md:421-424` (the routing section) and `.planning/STATE.md:622,623` (historical milestone records — **do not edit**, and this phase must not touch `STATE.md` anyway).

---

## Environment Availability

| Dependency | Required by | Available | Version / evidence | Fallback |
|---|---|---|---|---|
| `git` | corpus measurement, drift script, history checks | ✓ | in use throughout this research | — |
| `bash` | `audit-skill-drift.sh` | ✓ | script ran to completion, exit 1 | — |
| `node` | replicating the generator's regex; script-wiring audit | ✓ | ran inline | — |
| `yarn` 4.13 | `lint:check`, `generate:docs` | ✓ | `package.json` + CI pins 4.13 | — |
| `tsx` | `apps/docs` generators | ✓ | `apps/docs/package.json:61` (`"tsx": "catalog:"`) | — |
| `glob` | `generate-component-docs.ts:6` | ✓ **but undeclared** | **not in `apps/docs/package.json`**; declared at root `package.json:65` (`"glob": "^11.0.0"`) and resolves via hoisting | works today; **hoisting-dependent** — worth a todo alongside the 6 broken script refs |
| Supabase / Docker | **not needed** | n/a | this phase runs no DB | — |
| Playwright / dev server | **not needed for the deliverables** | n/a | but see § *Validation Architecture* | — |

**Missing with no fallback:** none. **Missing with fallback:** none blocking. **Noted risk:** `glob` is an undeclared dependency of `apps/docs` — file with the six broken script references.

---

## Validation Architecture

`workflow.nyquist_validation` is **absent** from `.planning/config.json` (which contains `research`, `plan_check`, `verifier`, `_auto_chain_active`, `use_worktrees`), so it is treated as enabled. `[VERIFIED: .planning/config.json, read this session]`

### Test framework

| Property | Value |
|---|---|
| Unit | `vitest` — `yarn test:unit` |
| E2E | Playwright — `yarn test:e2e` (preflight-gated) |
| Lint/type gate | `yarn lint:check` (chain quoted in § *Standard Stack*) |
| Docs-specific | `yarn workspace @openvaa/docs validate:links` (`apps/docs/package.json:25` → `scripts/validate-links.ts`, exists) |
| **Skill-specific** | `bash .claude/scripts/audit-skill-drift.sh` |

**This phase changes no runtime behaviour.** Its deliverables are Markdown, frontmatter and one deletion. The Nyquist framing therefore inverts: **the sampling target is documentation truth, not code behaviour.**

### Requirements → check map

| Req | Behaviour | Type | Automated command | Exists? |
|---|---|---|---|---|
| REVIEW-DOC-01 | The three additions are present in `object-model.md` | doc assertion | `grep -c 'one constituency per election\|child.*imply.*parent\|party list' .claude/skills/data/object-model.md` | ✅ trivially scriptable |
| REVIEW-DOC-02 | Each of the four `extension-patterns.md` carries the self-check note; `database` has the dev-seed step; `filters` has the E2E step | doc assertion | `for f in data database filters matching; do grep -q '<self-check phrase>' .claude/skills/$f/extension-patterns.md \|\| echo "MISSING: $f"; done` | ✅ |
| REVIEW-DOC-03 | The measurement and the judgement are recorded in a findable in-repo file | doc assertion | `test -f .claude/skills/README.md && grep -q '464,728\|464728' .claude/skills/README.md` | ✅ |
| REVIEW-DOC-04 | The `CLAUDE.md` decision is recorded; the essay arrived intact | doc assertion | grep the five load-bearing phrases in the destination (§ *How to prove no weakening*) | ✅ |
| **All** | No dangling reference introduced | link integrity | a link/path checker over `.claude/skills/**` + `CLAUDE.md` | ❌ **Wave 0 gap** |
| **All** | Repo still lints and types | regression | `yarn lint:check` | ✅ exists |

### Sampling rate

- **Per task:** the relevant `grep` assertion above (sub-second).
- **Per wave:** `bash .claude/scripts/audit-skill-drift.sh` — **for its output text, not its exit code** (Pitfall 4).
- **Phase gate:** `yarn lint:check` green (Phase 152's scan will be chained into it) **+** the link-integrity check below **+** a full `yarn test:e2e` per the repo's cardinal rule, since Waves 3–5 touch files 159 also touches and a stale-doc phase must not be the one that ships a red suite.

### Wave 0 gaps

- [ ] **A path/link-integrity check over `.claude/skills/**` and `CLAUDE.md`.** This is the single highest-value new artifact the phase could produce, and this research supplies the evidence that it is needed: **15 dangling schema names in 51 places**, **one dangling `.svelte` path in the essay**, **one drifted line range**, **5 dangling directory rows in `BOUNDARIES.md`**, **6 broken script references**. A ~40-line script that extracts backticked `path.ext` tokens and `NNN-*.sql` names and asserts existence would have caught every one of them.
  - **Scope caution:** making it *blocking* is a new CI gate → **Phase 163**. Landing it as a script that the phase runs manually, and that 163 later wires, respects the boundary. Record the choice.
- [ ] No test-framework install needed.

*(If the planner declines the checker: file it per D-N2 with the six anchors above.)*

---

## Security Domain

`security_enforcement` is not set in `.planning/config.json`, so it is treated as enabled. `[VERIFIED: .planning/config.json]`

### Applicable ASVS categories

| ASVS | Applies | Reasoning / control |
|---|---|---|
| V2 Authentication | **no** | No auth surface is touched. |
| V3 Session Management | **no** | — |
| V4 Access Control | **no** | — |
| V5 Input Validation | **no** | No input is processed; the phase writes static Markdown. |
| V6 Cryptography | **no** | — |
| V7 Error Handling & Logging | **no** | — |
| **V14 Configuration** | **yes** | The phase edits `.claude/skills/*/SKILL.md` frontmatter (`targets:`) and, if option C is taken, a `package.json` script. Both are configuration surfaces. |

### Threat patterns for this phase's stack (Markdown + shell + CI config)

| Pattern | STRIDE | Mitigation |
|---|---|---|
| **Documentation of a security-relevant fact goes stale and misleads a future implementer** | Information Disclosure (indirect) | This is the phase's *entire purpose*. The measured base rate — 3 confirmed false claims in `CLAUDE.md`, 15 dangling schema names — is the evidence. The link-integrity checker is the durable mitigation. |
| **Deleting a skill leaves a dangling `Skill()` invocation** | Denial of Service (agent-level) | The pre-delete grep in § *Runtime State Inventory*. |
| **A `targets:` entry that is a file, not a directory, silently disables the guard** | Tampering (guard bypass) | `audit-skill-drift.sh:79-81` + `STATE.md:971`. Assert `[ -d ]` for every new target before committing. |
| **`paths-ignore: "**.md"` means a docs-only PR bypasses every CI job** | Tampering (gate bypass) | Recorded in § *The 153/160 boundary*; the mitigation is Phase 153's, not 160's — but 160 must not *claim* CI verified its work. |
| **Editing `.github/workflows/**` from a docs phase** | Elevation of Privilege | **Out of scope.** 160 must not touch workflow files; CI changes are Phase 163. |

**No secret, credential, or `.env` surface is in scope.** `CLAUDE.md` names `PUBLIC_SUPABASE_URL` / `PUBLIC_SUPABASE_ANON_KEY` (`:214-215`, `:395-396`) — both are public-by-design keys and neither carries a value. Do not add values while trimming.

---

## Assumptions Log

| # | Claim | Section | Risk if wrong |
|---|---|---|---|
| A1 | The two cited papers (arXiv:2607.17598, arXiv:2607.27250) say what the triage paraphrase says. **Not read directly this session.** | Criterion 3, Criterion 4 | LOW — both decisions are already locked by operator tick; the risk is only in *how the recorded reasoning quotes them*. **Mitigation: quote `PRE-SHIP-REVIEW-TRIAGE.md:346`/`:362`, not the papers.** |
| A2 | "One constituency per election" and the non-contradiction rule are **selection semantics**, not model-enforced invariants. I found no enforcing code in `@openvaa/data`. | Criterion 1 | MEDIUM — writing them as class invariants would put a false claim in the skill. **Mitigation: source them to the reviewer; do not assert enforcement.** |
| A3 | The `database` skill's "204 pgTAP tests" is drifted. Measured 11 `.sql` files / 267 assertion calls — not directly comparable without running `supabase test db`. | Pitfall 2 | LOW — it is a supporting example, not a deliverable. |
| A4 | The 90-day commit counts understate real churn, because this worktree's history is squashed. | Option D | LOW — the comparison is *relative* to the four existing target-carrying skills, measured the same way, so the ranking holds. |
| A5 | The four "no direct successor" schema renames (`006-answers-jsonb`, `012-auth-hooks`, `013-auth-rls`, and the `010-utility-functions` collision) need a human to map. | Pitfall 2 | LOW — the item is recommended for a todo, not for 160. |
| A6 | `main` is the eventual merge target and the merge will be a squash. Inferred from branch name `integration/ship-12-squash`, the `ship-review-stack` skill's existence, and `(#NNN)` signatures in `main`'s log. | E5 | MEDIUM — if the ship is a true merge, the git-history fallback is stronger than stated. **But the recommendation does not depend on it**: the delete is justified by `.planning/spikes/` being in-tree, not by git. |
| A7 | Running `yarn workspace @openvaa/docs generate:docs` succeeds today. **I did not run it** (it writes files; this was a read-only task). All five sub-scripts exist and `glob` resolves. | Option A/C | MEDIUM — if it fails, option A's "regenerate once" step fails with it. **Mitigation: make the regeneration its own task with its own verification, not a side effect of another task.** |

---

## Open Questions

1. **Keep, delete, or delete-`sources/`-only for `spike-findings-*`?**
   - Known: 60% is provably redundant (E2); `.planning/spikes/` is the superset and holds Spike 024 which the skill lacks (E3); both domains have landed (E4); it is the repo's only rule-violating routing chain; 115,036 B of synthesis is genuinely unique (E6).
   - Unclear: whether the syntheses have future value. The rune migration is done; but `references/migration-inventory-and-order.md` and the Production Landing Map arguably document *how the current code got its shape*.
   - **Recommendation:** DELETE the whole skill, with the reasoning recorded as *"the sources are byte-for-byte-equivalent duplicates of `.planning/spikes/` (24 spikes, superset), the syntheses describe completed work, and the routing chain is the repo's only two-hop violation"* — **and explicitly reject the git-history justification in favour of the in-tree one (E5).** Offer delete-`sources/`-only as the recorded runner-up.

2. **Is `BOUNDARIES.md` in scope?** — § *Criterion-adjacent* recommends **in scope**; 14 of 85 lines, 8 of them mandatory (dangling `architect` rows). Planner decides and records.

3. **Do the 51 dangling schema citations get fixed here?** — § *Pitfall 2* recommends **no**: not required by any REVIEW-DOC id, and Phase 156 will churn the same files. File per D-N2, cite the count in criterion 2c's rationale.

4. **Does the "re-check the skill" note go into `ship-review-stack` and `components`?** — § 2c recommends **components yes, ship-review-stack no**, with `BOUNDARIES.md:23-27` as the reason.

5. **Does the link-integrity checker land in 160 or 163?** — § *Wave 0 gaps*. Recommend: **the script lands in 160 (it is a skill-hygiene tool), the CI wiring lands in 163.**

6. **Does 160 own the six broken `docs:*` script references?** — Recommend **no** (Phase 153's Goal covers it verbatim), **but** the D-I3 evaluation must cite them as the cost of option C. File per D-N2.

---

## Sources

### Primary (HIGH confidence) — read in full this session

- `.claude/skills/architect/SKILL.md`, `.claude/skills/components/SKILL.md` — both stubs, frontmatter + body
- `.claude/scripts/audit-skill-drift.sh` (135 lines) — full contract
- `.claude/skills/BOUNDARIES.md` (85 lines) — full ownership map
- `CLAUDE.md:320-380` (the essay), `:410-424` (routing), `:1-424` heading map
- `.claude/skills/data/object-model.md:110-175`; the four `extension-patterns.md` heading maps + tails
- `apps/docs/scripts/generate-component-docs.ts`, `docs-scripts.config.ts`, `generate-all-docs-and-validate.ts`, `move-generated.ts:1-60`
- `apps/docs/package.json`, root `package.json`, `apps/supabase/package.json`, `packages/app-shared/package.json`, `packages/app-shared/tsup.config.ts`
- `.github/workflows/main.yaml:1-80`; `.prettierignore`
- `.planning/REQUIREMENTS.md:155-166,309-312,341`; `.planning/PRE-SHIP-REVIEW-TRIAGE.md:341-362`; `.planning/ROADMAP.md` Phases 152–164; `.planning/STATE.md:920,942,971`
- `.planning/todos/pending/2026-08-28-claude-md-stale-factual-claims.md`
- `.planning/phases/160-agent-docs-skills-refresh/160-CONTEXT.md`, `160-DISCUSSION-LOG.md`

### Primary (HIGH confidence) — measured by command this session

Every corpus, count, drift, existence and diff figure in this document carries its command inline. All were run at HEAD `db220cb5f`, branch `integration/ship-12-squash`.

### Secondary (MEDIUM confidence)

- arXiv:2607.17598 (flat hierarchy / progressive disclosure) and arXiv:2607.27250 (288-run ablation) — **known only via `PRE-SHIP-REVIEW-TRIAGE.md:346` and `:362`.** See A1.

### Tertiary (LOW confidence)

- The squash-merge inference in E5 — see A6.

---

## Project Constraints (from CLAUDE.md)

Directives extracted from `./CLAUDE.md` that bind this phase's execution:

1. **E2E Hard Rule (cardinal failure), `:39-45`** — no task may complete while any E2E test fails. **"Did not run" counts as a failure.** No known-flaky exemptions. Prefer the whole suite (`yarn test:e2e`) over ad-hoc checks. *Applies: the phase gate.*
2. **E2E preflight, `:47-55`** — the preflight cannot be skipped; `FRONTEND_PORT` is the only escape hatch.
3. **Never commit sensitive data**, `:318`. *Applies: the `CLAUDE.md` trim must not introduce env values.*
4. **Localization**, `:324` — all user-facing strings support multiple locales. *Not applicable: skill/`CLAUDE.md` content is agent-facing, not user-facing.*
5. **Always check against `.agents/code-review-checklist.md`**, `:325`. *(File verified present.)*
6. **Context Destructuring Rule, `:327-378`** — the content this phase relocates. **Binding on the relocation: do not weaken (D-I2.1).**
7. **Svelte Warning-Accepted format, `:379-390`** — `// svelte-warning: accepted — <rationale>` immediately above the triggering line. *Applies only if the phase touches `.svelte` files; it should not.*
8. **`db:*` = database only; `dev:*` = full stack**, `:72-95`. *Applies: keep this section intact per D-I2; fix only `:87`'s description.*
9. **Use TypeScript strictly; avoid `any`**, `:321`. *Applies only if option C's generator change is taken.*

**No CLAUDE.md directive conflicts with any locked decision.** The one tension — D-I2 trims `CLAUDE.md`, and `CLAUDE.md` is itself the source of these constraints — is resolved by D-I2(a)'s own "record what was deliberately kept" clause: items 1, 2, 7 and 8 are on the operator's explicit keep list.

---

## Metadata

**Confidence breakdown:**

| Area | Level | Reason |
|---|---|---|
| Corpus measurement (criterion 3) | **HIGH** | Reproduced byte-for-byte across a 5-commit HEAD advance; commands recorded |
| Spike-skill redundancy proof | **HIGH** | 17/17 files compared; the 4 non-matching pairs diffed line by line and confirmed formatting-only |
| Drift-guard contract | **HIGH** | Script read in full and executed; behaviour matches the source |
| Component-listing drift | **HIGH** | Replicated the generator's own regex; delta enumerated by name |
| Stale `CLAUDE.md` claims | **HIGH** | All three confirmed against source files read this session |
| `BOUNDARIES.md` damage | **HIGH** | Every row counted and every path existence-checked |
| Dangling schema citations | **HIGH** | Counted, deduplicated, and mapped to successors |
| 152–159 coupling map | **MEDIUM-HIGH** | Derived from the roadmap's corrected criteria; those phases have not run, so the *outcomes* are predictions |
| Git-history availability (E5) | **MEDIUM** | Facts are verified; the squash inference (A6) is an inference |
| The two papers | **MEDIUM** | Read only through the triage paraphrase (A1) |
| Product rules in criterion 1 | **MEDIUM** | Reviewer-authoritative but not code-verified (A2) |

**Research date:** 2026-08-28
**Valid until:** **the moment Phase 159 lands.** Every path, line number and symbol in the § *152–159 coupling map* must be re-verified at execution time. The corpus byte counts and the redundancy proof are stable and do not need re-derivation.
