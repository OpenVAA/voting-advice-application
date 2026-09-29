# Phase 152: Comment & Naming Hygiene Sweep — Research

**Researched:** 2026-08-28
**Measured at:** HEAD `22c2542e3`, branch `integration/ship-12-squash`, working tree clean of source edits
**Domain:** Repo-wide comment/identifier hygiene codemod + a committed `lint:check` guard
**Confidence:** HIGH for every count below (all produced by commands run against this tree this session, each reproduced verbatim beside its result). MEDIUM only where explicitly flagged.

> **Every number in this document was measured on this tree today.** Where a measurement contradicts
> `152-CONTEXT.md`, `.planning/ROADMAP.md` or `.planning/REQUIREMENTS.md`, the contradiction is called out
> in bold and **the measurement wins**. There are **six** such contradictions and one of them
> (§ 1, the D-A4 class size) changes the shape of the phase.

---

<user_constraints>

## User Constraints (from CONTEXT.md)

### Locked Decisions

Copied from `.planning/phases/152-comment-naming-hygiene-sweep/152-CONTEXT.md` § `<decisions>`. All six § A
decisions were **actively ticked `[x]`** by the operator; the three § N decisions carry by the
unchecked-means-recommended rule.

**D-A1 — How wide is the planning-reference purge?**
Won: option (a) — *"Full class, with a rewrite-not-delete default"*. Operator rationale as written:
*"every one of the 817 is visited; a comment whose content is a live invariant is **rewritten** to state the
invariant without the phase reference; only pure narrative is deleted. Codemod strips the citation, human
pass decides rewrite-vs-delete. This is what the criterion says, and a partial sweep leaves the class
reopenable."*
Rejected: (b) the 19 reviewed sites only — *"leaves 798 lines of the same class in the tree and makes
criterion 1's 'cannot silently reopen' scan unenforceable"*; (c) skip `tests/**` — *"the E2E specs are the
heaviest planning-narrative carriers in the repo and are read most often by agents"*; (d) delete-by-default
— *"destroys measured hazard notes that no other document holds"*.
Two worked rewrite-not-delete examples named in the decision: `packages/dev-seed/.../resolve-template.ts:62-70`
(`Object.prototype` hazard) and `supabaseDataWriter.ts:86-90` (measured Playwright timing hazard). Strip the
citation; keep the invariant.

**D-A2 — `(voters)/+layout.svelte:36-47`.**
Won: option (a) — *"Delete `:36-45`; keep `:46-47` compressed to one line"*. Rationale: *"the exemplar then
demonstrates the actual rule ('comments explain the code in front of them'), and the destructure trap the
invariant guards is the single most-repeated defect in this codebase's history."*
Rejected: (b) delete `:36-47` entirely — *"the next editor destructures `ctx.appSettings` and reintroduces a
documented Phase-61 defect class"*; (c) keep the block and strip only the citations — *"leaves ~10 lines of
prose in the file the phase nominates as the example of what code should look like afterwards."*

**D-A3 — `quatenaryChoices`.**
Won: option (a) — *"Rename to `quaternaryChoices`"*. Rationale: *"the correct English word, consistent with
`binaryChoices` at `:17`, and it satisfies the reviewer's evident intent (fix the spelling)."*
Rejected: (b) the reviewer's literal `quartenaryChoices` — *"ships a misspelling into a file the same phase is
cleaning for correctness"*; (c) leave it. **The PR #865 review comment says "Rename to `quartenaryChoices`" —
do not follow it verbatim.**

**D-A4 — What counts as a "forced line break", and how the scan is committed.**
Won: option (a) — *"A committed Node script implementing that rule, wired into `yarn lint:check`"*.
**The class definition, as written in the decision preamble (this is the specification):** *"a comment line
that ends without terminal punctuation **and** whose next line continues the same comment span at the same
indent."*
Rationale: *"the criterion says 'committed as a script so the class cannot silently reopen'; putting it in
`lint:check` is what makes reopening impossible rather than merely visible. Precedent: the Phase-144
chain-membership assertion."*
Rejected: (b) prettier `printWidth` reflow — *"prettier does not reflow comment prose, so this closes
nothing"*; (c) a one-off audit script not wired into CI — *"the class silently reopens on the next PR"*.
This same script also carries the `\uXXXX`-escape-in-comment pattern from D-A5. **One gate with two rules,
not two gates.** Wiring precedent: `b410d3a90` — assert **membership** in the `lint:check` chain, not
position.

**D-A5 — "Encoded dashes".**
Won: option (a) — *"Fix the one `\u2013`; add the `\uXXXX`-in-comment pattern to the A4 scan; leave `--`
alone"*. Rationale: *"the reviewer's complaint was escape-encoding, and 2,870 comment lines already use real
`—`/`–` characters happily. The guard stops the class rather than the instance."*
Rejected: (b) also normalise the `--` occurrences to `—` — *"extra diff sites in files other phases are about
to rewrite, inviting conflicts"*; (c) normalise every dash to a plain hyphen — *"it degrades readable prose
across the whole tree."*
The reviewer's literal wording was "just use a hyphen"; **the decision overrules that** in favour of the real
character.

**D-A6 — UK/US spelling audit scope.**
Won: option (a) — *"Identifiers only; record prose/fixture hits as explicitly out of scope in the committed
audit"*. Rationale: *"matches the criterion's own wording, and changing the `etSg`/`etPl` fixtures would
silently weaken two passing tests."*
Rejected: (b) identifiers + JSDoc prose — *"touches ~30 doc blocks other phases are rewriting"*; (c)
everything including test fixtures and example strings — *"breaks the two param tests and edits user-facing
example copy for no functional gain."*
The audit output is committed **even when the answer is "none found"**, and must name the out-of-scope hits
explicitly.

**D-N1 — 152 runs first.** Won: option (a) — keep 152 first as roadmapped and land its scan in
`yarn lint:check` so later phases cannot reopen the class. *"The enforcement, not the ordering, is what makes
the sweep durable."* **The consequence this phase must own:** getting the scan into `lint:check` *is the
load-bearing deliverable of the whole phase*, not a rider on criterion 1.
Rejected: (c) split into guard-first/sweep-last — *"a guard that fails on 817 pre-existing violations cannot
be enabled until the sweep runs, so the split does not work as stated unless the guard ships disabled — which
is no guard."*

**D-N2 — Follow-up work items land in `.planning/todos/pending/`, filed during the owning phase.** Anything
the sweep surfaces that is **not** a comment edit (a real defect hiding behind a narrative comment) is filed
there rather than fixed in-phase.

**D-N3 — One `<padded>-CONTEXT.md` per phase plus a shared `<padded>-DISCUSSION-LOG.md` pointer.** Both now
exist for Phase 152.

**D-0.1 — Do NOT edit `.planning/ROADMAP.md` from this phase's planning or execution.** Another agent owns
that correction concurrently.

### Claude's Discretion

CONTEXT.md marks nothing as discretionary. The planner's remaining freedom is confined to the five
`<open>` items CONTEXT.md hands forward (§ 12 below) and to implementation mechanics not fixed by a decision:
the scan script's exact exclusion set, the batching of the rewrite pass, and the wave structure.

### Deferred Ideas (OUT OF SCOPE)

- Normalising the comment lines that use `--` as a dash, and the lines already using real `—`/`–` — D-A5
  leaves both alone. **See the ⚠ HARD CONSTRAINT in § 2.**
- Prose and fixture UK-spelling hits: `apps/frontend/src/params/etSg.test.ts:22` and `etPl.test.ts:23`
  (`'organisation'` as a **deliberate negative-test input**); `Input.svelte:46,52` ("Favourite colours" in a
  usage-example docstring). D-A6 keeps identifiers only.
- Any behavioural change. Comments and names only.
- Filing follow-up work items surfaced by *other* phases — those land in `.planning/todos/pending/` during
  their own owning phase (D-N2).

</user_constraints>

<phase_requirements>

## Phase Requirements

| ID | Description (from `.planning/REQUIREMENTS.md:88-91`) | Research Support |
|----|-------------|------------------|
| **REVIEW-HYG-01** | No comment in `packages/**`, `apps/**` or `tests/**` carries a forced line break, or a character escape where the character itself belongs, and the scan proving it is committed as a script wired into `yarn lint:check` so the class cannot silently reopen. | § 1 (the scan: definition, measured class size, tokenizer requirements, false-positive taxonomy, **the definition-vs-feasibility conflict the planner must resolve**), § 2 (the escape rule, exactly 1 comment-scoped hit), § 3 (the enable ordering + the wiring precedent + the negative control) |
| **REVIEW-HYG-02** | A comment explains the code in front of it and nothing else — no historical narrative, planning-artifact path, phase or plan number, or decision id survives — and the sweep changes no program behaviour. | § 4 (the measured class: **946 occurrences / 888 lines / 642 spans / 278 files**, and the corrected per-tree split), § 5 (the two-stage pipeline: the *already-committed* Phase-151 codemod and what must change in it), § 6 (the residue pass, **98** non-comment-shaped lines), § 7 (the exemplar, line-exact at HEAD) |
| **REVIEW-HYG-03** | The renames leave no dangling reference and `yarn build`, `yarn test:unit` and `yarn lint:check` are green after each. | § 8 (all three renames, every referencing site enumerated; the case-only-rename procedure; **the second `quatenaryChoices` file nothing in the planning record mentions**) |
| **REVIEW-HYG-04** | No symbol name in the repo carries a UK spelling where the repo's convention is US, and the audit establishing that is committed even when its answer is "none found". | § 9 (the word list, the measured identifier hit set — **3 distinct identifiers / 14 occurrences / 3 files** — and the full out-of-scope register) |

`152-CONTEXT.md` `<open>` item 1 says *"REVIEW-HYG-01..04 are not defined anywhere"*. **That is now stale.**
`.planning/REQUIREMENTS.md:85-91` defines all four under `### Comment & Naming Hygiene`, added 2026-08-28.
Verified this session — the ids are the acceptance surface and the verifier has something to check against.

```bash
sed -n '85,91p' .planning/REQUIREMENTS.md   # → the four REVIEW-HYG entries
```

</phase_requirements>

---

## Summary

Phase 152 is **two sweeps and one guard**, and the guard is the deliverable that survives (D-N1). The two
sweeps are of very different natures and the planner must not conflate them:

1. **The planning-reference purge (REVIEW-HYG-02)** is *judgement* work over **642 comment spans in 278
   files**. Its mechanical half is **already built and committed** at
   `.claude/skills/ship-review-stack/sources/hygiene-codemod.mjs` — 935 lines, dry-run by default,
   self-test passing, fixture-backed for `.ts`/`.svelte`/`.sql`/`.sh`. Phase 152 does not build this; it
   *retargets* it, because its rule 6 currently **collapses** `Phase 88` → `see phase 88` and Phase 152
   needs the reference **gone**. 642 of the 744 surviving phase references are already in that collapsed
   form — the existing gate calls that state green, and Phase 152 must call it red.

2. **The forced-line-break sweep (REVIEW-HYG-01)** is *mechanical* work, but the D-A4 definition taken
   literally covers **14,094 comment lines across 747 files in 5,550 wrapped paragraphs** — 40% of the
   34,885-line non-blank comment corpus. This is the single most consequential finding in this document and
   it is 17× the size of the planning-reference sweep. It is not a false-positive artefact: the reviewer's
   own six cited examples are all ordinary hand-wrapped prose paragraphs, and un-wrapping them is exactly
   what "remove line breaks from multiline comments everywhere" asks for. § 1 gives the four dispositions
   available to the planner and their costs.

3. **The guard.** Both rules ride one committed Node script in `scripts/`, matching the house style of the
   three existing `assert-*.mjs` guards, appended to the `lint:check` `&&` chain, with its chain
   **membership** asserted by a vitest spec mirroring `packages/dev-seed/tests/ciTypecheckGate.test.ts`
   (`b410d3a90`). The enable-ordering problem D-N1(c) named is real and has a clean intra-phase answer
   (§ 3): the guard is *authored and self-tested* early, *measured* to produce the sweep's work queue, and
   *wired* only in the last wave, with a deliberate reintroduction proving it catches.

The three renames and the UK/US audit are small, fully enumerated, and carry one surprise each (§ 8, § 9).

**Primary recommendation:** plan five waves — (0) build the scan + retarget the codemod and prove both by
self-test; (1) the mechanical citation strip + the three renames + the escape fix + the terse-name rename;
(2) the 642-span judgement pass, batched by file-concentration; (3) the D-A4 line-break sweep under whichever
disposition § 1 resolves to; (4) wire into `lint:check`, assert membership, run the negative control, run the
full E2E suite. Resolve § 1's definition question **before** planning locks — it decides whether wave 3 is a
200-line edit or a 14,094-line one.

---

## Architectural Responsibility Map

| Capability | Primary Tier | Secondary Tier | Rationale |
|------------|-------------|----------------|-----------|
| Comment-span classification (which bytes are a comment) | Build/tooling — Node script, no transpile | — | Must run before anything is built (the `assert-unit-test-coverage.mjs` bootstrapping argument, quoted verbatim in § 3). A TS implementation would need a build step and could deadlock the pipeline it gates. |
| Forced-line-break + escape detection | Build/tooling — `scripts/assert-comment-hygiene.mjs` | — | Same tier as the three existing guards; invoked from `lint:check`. |
| Chain-membership enforcement (the guard is actually run) | Test — vitest in `packages/dev-seed/tests/` | CI — `.github/workflows/main.yaml:92` | Precedent `ciTypecheckGate.test.ts` already reads root `package.json` from `REPO_ROOT` in this exact workspace, for this exact reason. |
| Planning-reference stripping (mechanical half) | Build/tooling — the committed `hygiene-codemod.mjs` | — | Deterministic, span-scoped, dry-run-first. Owns only what a regex can own safely. |
| Rewrite-vs-delete judgement (the other half) | Agent/human pass, file by file | — | D-A1 assigns it explicitly; § 6 shows why a regex-only pass over the residue would edit program behaviour. |
| File renames | Filesystem + git; `git mv` | Type system (`tsc`) proves no dangling reference | Import specifiers are the only linkage; `typecheck` is the oracle. |
| Identifier renames (UK/US, terse names) | Source — TypeScript/Svelte | Type system | All measured sites are local or single-workspace; `yarn build` + `yarn typecheck` prove closure. |

---

## Section 1 — The D-A4 scan, and the finding that reshapes the phase

### 1.1 The class definition is implementable. Its measured size is not what the phase assumed.

D-A4's specification, verbatim: *"a comment line that ends without terminal punctuation **and** whose next
line continues the same comment span at the same indent."*

I implemented that definition exactly — a per-file comment tokenizer with block/line/HTML/SQL/hash state and
crude string-literal suppression, then the two-line predicate — and ran it over every tracked file in
`packages/**`, `apps/**`, `tests/**` with extension `.ts .tsx .js .mjs .cjs .svelte .sql .sh .bash .yaml .yml`.

```
mode=strict corpus_comment_lines=45709 violations=17800 {"apps":6032,"packages":5307,"tests":6461}
mode=loose  corpus_comment_lines=45709 violations=15101 {"apps":5067,"packages":4275,"tests":5759}
```

*(`strict` = terminal punctuation is `. ! ?`; `loose` also accepts `: ; , ) ] } >`. `strict` is the faithful
reading — a line ending in a comma is unambiguously a forced break.)*

Classifying the 17,800 strict hits by what the *next* line looks like separates structural false positives
from genuine wrapped prose:

| Category | Count | In scope? |
|---|---:|---|
| **wrapped prose** (the target class) | **14,094** | **yes** |
| `banner/rule` — next or current line is a `////`/`====`/`----` separator | 1,418 | no |
| `next-is-list-item` — next line starts `- `, `* `, `1. `, `(a)` … | 1,258 | no |
| `next-is-jsdoc-tag` — next line starts `@param`, `@returns`, … | 429 | no |
| `next-deeper-indent` — hanging-indent continuation (ASCII tables, code samples) | 567 | no |
| `table-row` — pipe tables inside comments | 34 | no |

**Wrapped prose by tree: apps 4,098 · packages 4,109 · tests 5,887 = 14,094 lines, in 5,550 distinct wrapped
paragraphs, across 747 files.**

```bash
# reproduce (script listed verbatim in § "Code Examples" below)
node scan.mjs strict            # → the two totals above
node scan.mjs strict --json | node classify.mjs   # → the category table
```

**⚠ LOUD CONTRADICTION 1 — the phase has no number for this at all.** `152-CONTEXT.md`, `ROADMAP.md` and
`REQUIREMENTS.md` all size the *planning-reference* sweep (817) and say nothing about the size of the
*forced-line-break* class. Criterion 1 simply says the scan "returns **zero**". Measured, reaching zero under
the literal definition means editing **14,094 comment lines in 747 files** — **17× the planning-reference
sweep** and touching **98% of the files this phase would otherwise leave alone**.

### 1.2 The reviewer meant it literally — this is not a mis-reading of D-A4

I read all six sites the reviewer cited with "remove line breaks". Every one is an ordinary hand-wrapped
paragraph, not a pathological case:

```bash
sed -n '3,14p'   packages/data/src/utils/formatAnswer.ts
sed -n '80,90p'  packages/filters/src/filter/enumerated/enumeratedFilter.ts
sed -n '316,318p' packages/filters/tests/filter.test.ts   # (block at :315-317)
sed -n '13,14p'  apps/frontend/src/lib/api/adapters/apiRoute/apiRouteAdapter.ts
sed -n '361,365p' apps/frontend/src/lib/api/adapters/supabase/dataProvider/supabaseDataProvider.ts
sed -n '249,251p' apps/supabase/supabase/functions/identity-callback/index.ts
```

`apiRouteAdapter.ts:13-14` is the clearest signal — a **two-line** `// reason:` comment wrapping at ~110
chars, and the reviewer's comment on it is *"Remove line breaks from multiline comments **everywhere**."*
There is no narrower rule that catches that site and spares the other 5,549 paragraphs.
`[VERIFIED: .planning/PRE-SHIP-REVIEW-TRIAGE.md:39-84 read this session; all six source blocks read at HEAD]`

### 1.3 Un-wrapping is safe against the formatter, and ugly against the line-length convention

Measured joined length over the 5,550 paragraphs:

```
p50=185  p75=282  p90=418  p99=717  max=1780
over 120 chars: 4,437 (79.9%)   over 300: 1,197   over 500: 299
```

Prettier does **not** reflow comments — proven by direct execution rather than assumed:

```bash
printf '/**\n * %s\n */\nexport const a = 1;\n// %s\nexport const b = 2;\n' \
  "$(python3 -c "print('word '*60)")" "$(python3 -c "print('tail '*60)")" > in.ts
./node_modules/.bin/prettier --stdin-filepath probe.ts < in.ts | awk '{print NR": len="length($0)}'
# 1: len=3 / 2: len=302 / 3: len=3 / 4: len=19 / 5: len=302 / 6: len=19
```
`[VERIFIED: prettier run this session against the repo's own installed binary]`

There is also **no ESLint `max-len` rule** anywhere in `packages/shared-config/`
(`grep -rn "max-len\|printWidth" packages/shared-config/` → no output), so a 1,780-char comment line passes
`yarn lint:check` and `yarn format:check` untouched. It does contradict `.editorconfig`'s
`max_line_length = 120`, which prettier reads as its `printWidth` default — so the tree would ship comments
that are 15× the width its own config declares.
`[VERIFIED: .editorconfig:11 read this session — `max_line_length = 120`; `prettier.config.mjs` re-exports
`@openvaa/shared-config/prettier`, which sets only `bracketSpacing`, `singleQuote`, `trailingComma`,
`bracketSameLine` — no `printWidth`]`

### 1.4 The four dispositions available to the planner

The phase cannot proceed to a green criterion 1 without choosing one. **No decision in CONTEXT.md covers
this**, because the size was never measured before now. Presented in the shape D-A1/D-A2 use, so the operator
can rule quickly:

| # | Disposition | Cost | Consequence |
|---|---|---|---|
| **(a)** | Implement D-A4 verbatim; un-wrap all 5,550 paragraphs. | 14,094 lines / 747 files. Mechanical (a join is deterministic), so a codemod does it, but it collides head-on with **59 of the 94 files phases 153-160 also edit** (§ 11). | Criterion 1 green as written. Comment lines average 185 chars, 80% over the declared 120. Enormous merge surface for eleven downstream phases. |
| **(b)** ★ | Implement D-A4 verbatim **for detection**, and scope the *sweep* to the wrapped-prose class only, excluding the five structural categories (banners, list items, JSDoc tags, hanging indents, tables) as codified exclusions **in the committed script**. | Still 14,094 lines, but the script is honest and the 3,706 structural lines never appear as violations. | Same as (a) for effort; strictly better as a standing guard, because a future author adding a JSDoc `@param` list does not redden the build. **This exclusion set is required under every disposition** — (a) without it is a guard nobody can keep green. |
| **(c)** | Narrow the rule to a *gratuitous* break: flag only when the joined result would still fit inside 120 chars (i.e. the author broke a line that did not need breaking). | Measured: 1,113 of 5,550 paragraphs (20.1%) join to ≤120 chars — roughly **2,400 lines**. | Defensible, checkable, keeps the tree readable and consistent with `.editorconfig`. **But it does not close the reviewer's six cited sites** — `formatAnswer.ts:6` joins to 400+ chars — so criterion 1 would be green while the reviewed defects survive. Would need an operator override of the D-A4 text. |
| **(d)** | Split: enforce the rule as a standing guard from a *baseline*, sweeping only the reviewed sites + any file a later phase touches. | Small now. | **Explicitly rejected by D-N1(c)**: *"a guard that fails on 817 pre-existing violations cannot be enabled until the sweep runs… unless the guard ships disabled — which is no guard."* Same objection applies verbatim here at 14,094. Do not re-propose. |

**Recommendation to the planner: (b).** It is the only reading that is simultaneously faithful to D-A4's text,
implementable as a permanently-green gate, and consistent with D-N1's requirement that the gate be live.
Surface the 14,094 number to the operator *before* planning locks — CONTEXT.md's `<open>` list has no entry
for it and the operator has never seen it.

### 1.5 What the scan script must actually handle

Extensions in the three trees (`git ls-files packages apps tests | sed -E 's/.*\.([A-Za-z0-9]+)$/\1/' | sort | uniq -c | sort -rn`):

```
1260 ts   719 json   227 md   186 svelte   56 sql   31 yaml   11 mjs   8 js   7 sh   6 css   4 html
```

→ **1,465 files** carry C-family comments (`ts`+`svelte`+`mjs`+`js`), **56** SQL, **7** shell, **31** YAML.
`.tsx`/`.cjs`/`.bash`/`.yml` do not currently occur in these trees but cost nothing to accept.

Comment syntaxes the tokenizer must classify (each measured present):

| Syntax | Where | Note |
|---|---|---|
| `// …` | `.ts`, `.js`, `.mjs`, `<script>` in `.svelte` | Must suppress `//` inside string literals — `https://` URLs and the `'^\\u0000'` regex strings in `packages/shared-config/eslint.config.mjs:164-174` are live false positives. |
| `/* … */` with `*` continuation | same | JSDoc blocks are the dominant form. The `*` prefix must be consumed before the terminal-punctuation test, and the *indent* compared is post-`*`. |
| `<!-- … -->` | `.svelte` | **Includes the `<!--@component …-->` docstring form**, which is where the D-A5 escape lives (`EntityCardAction.svelte:1-12`) and where the exemplar's sibling docstrings live. Cannot be skipped. |
| `-- …` | `.sql` (56 files) | ⚠ Interacts with the dash constraint below. |
| `# …` | `.sh` (7), `.yaml` (31) | Must not treat `#!` shebang line 1 as a comment span start for the line-break rule. |

**Precedent for the classifier: do not write a new one.** `hygiene-codemod.mjs` already ships a per-file
state machine over exactly these four families *with multi-line-template-literal quote tracking*, and its
docblock records why: *"C-6 requires SQL and shell support: without it nine files are silently skipped or,
worse, wrongly rewritten."* It is fixture-tested for all four (`--self-test` → 4 fixtures, 0 failures, run
this session). Extract or import that classifier rather than re-deriving it.
`[VERIFIED: .claude/skills/ship-review-stack/sources/hygiene-codemod.mjs:1-120 read this session;
`node .claude/skills/ship-review-stack/sources/hygiene-codemod.mjs --self-test` → `Self-test PASSED`, exit 0]`

---

## Section 2 — The D-A5 escape rule, and the ⚠ HARD CONSTRAINT

### 2.1 The escape: exactly one comment-scoped hit, as CONTEXT.md says

```bash
git grep -n '\\u[0-9a-fA-F]\{4\}' -- packages apps tests    # → 9 hits
```

| Site | In a comment? | Disposition |
|---|---|---|
| `apps/frontend/src/lib/dynamic-components/entityCard/EntityCardAction.svelte:12` | **yes** — inside the `<!--@component …-->` docstring | **the D-A5 fix** |
| `apps/frontend/src/lib/components/select/Select.svelte:87` | no — `.replace(/[\u0300-\u036f]/g, '')` | leave |
| `apps/frontend/src/lib/i18n/translations/index.ts:62,63` | no — `'Fran\u00e7ais'`, `'L\u00ebtzebuergesch'` string literals | leave |
| `packages/shared-config/eslint.config.mjs:164,171,172,173,174` | no — `'^\\u0000'`-shaped regex strings | leave |

Running the comment-scoped predicate over the tokenized corpus returns **1**:
```
comment lines containing \uXXXX escape: 1 ["apps/frontend/.../EntityCardAction.svelte:12"]
```
The site verified verbatim:
```
 12| \u2013 default: The contents to wrap.
```
`[VERIFIED: apps/frontend/src/lib/dynamic-components/entityCard/EntityCardAction.svelte:1-20 read this
session; line 12 is the literal six characters `\u2013` followed by ` default: The contents to wrap.`]`

**This confirms CONTEXT.md fact 8 exactly**, and it demonstrates why the rule must be *comment-scoped*: a
naive `git grep` produces **8 false positives**, five of them inside `packages/**` where the phase's scope
would appear to authorise an edit that would break ESLint's import-sort config.

HTML entities: **zero**, as stated.
```bash
git grep -nE '&(ndash|mdash|#8211|#8212|#x201[34]);' -- packages apps tests | wc -l   # → 0
```

### 2.2 ⚠ HARD CONSTRAINT — the scan must NOT grow a general dash rule

**⚠ LOUD CONTRADICTION 2 — the `--` count is 212, not 85.**

```bash
# comment lines (tokenized, non-blank) containing " -- " with spaces both sides
node measure.mjs   # → comment lines with " -- ": 212   {"apps":138,"tests":75}
                   # → comment lines containing a real en/em dash: 3,025
                   # → non-blank comment corpus: 34,885
```

`152-CONTEXT.md` fact 8 and the `<domain>` block both say **85**. Measured: **212**, across apps (138) and
tests (75). *(`packages` contributes 0 to the space-delimited form; the `--` in SQL and shell there is the
comment marker itself and is consumed by the tokenizer.)* CONTEXT.md's ~2,870 real-dash figure measures
**3,025**, and its 34,063-line corpus measures **34,885** non-blank comment lines.

**The measurements make the constraint stronger, not weaker.** And the sample reveals a hazard CONTEXT.md
does not mention:

```
apps/frontend/src/hooks.server.ts:1  eslint-disable func-style -- SvelteKit hooks use typed const exports…
apps/frontend/src/hooks.ts:1         eslint-disable func-style -- SvelteKit hooks use typed const exports…
```

`--` is **ESLint's own rule-description separator** in a disable directive. A dash-normalising rule would not
merely produce 212 cosmetic diffs — on those two lines it would **change the directive's parse** and could
silently disable a rule repo-wide in the frontend's two hooks entry points.

**State in the plan, verbatim, as a scan-implementation constraint:** the D-A4 script implements exactly two
rules — the forced-line-break predicate and the `\uXXXX`-in-comment predicate. **It has no dash rule of any
kind.** 212 `--`-as-dash comment lines and 3,025 real-dash comment lines are pre-existing and correct
(D-A5(b) and D-A5(c) were both explicitly rejected); a dash rule fails on 3,237 lines on day one and breaks
two ESLint directives.

---

## Section 3 — The enable-ordering problem, and the wiring precedent

### 3.1 The `lint:check` chain, verbatim at HEAD

```json
"lint:check": "turbo run lint && eslint --flag v10_config_lookup_from_file tests && yarn typecheck:tests && yarn typecheck && yarn assert:i18n-catalog-namespaces && yarn assert:a11y-scan-wiring",
"assert:unit-coverage": "node scripts/assert-unit-test-coverage.mjs",
"assert:i18n-catalog-namespaces": "node scripts/assert-i18n-catalog-namespaces.mjs",
"assert:a11y-scan-wiring": "node scripts/assert-a11y-scan-wiring.mjs",
"test:unit": "yarn assert:unit-coverage && turbo run test:unit",
```
`[VERIFIED: package.json:24-35 read this session]`

The new guard appends as a seventh link: `&& yarn assert:comment-hygiene`, with
`"assert:comment-hygiene": "node scripts/assert-comment-hygiene.mjs"`.

### 3.2 Existing script conventions — follow them exactly

Three precedents in `scripts/`, all `.mjs`, all Node-built-ins-only, all with the same skeleton:

| File | Lines | Phase |
|---|---:|---|
| `scripts/assert-unit-test-coverage.mjs` | 1,155 | 141 |
| `scripts/assert-i18n-catalog-namespaces.mjs` | ~230 | 147 |
| `scripts/assert-a11y-scan-wiring.mjs` | ~300 | 147 |

The shared shape, taken from all three and reproduced in § "Code Examples":
`#!/usr/bin/env node` · a docblock opening **"THE INCIDENT THIS FILE EXISTS FOR"** · an explicit `Usage:` and
`Exit codes:` block · `const SELF = 'scripts/<name>.mjs'` · `REPO_ROOT` derived from
`fileURLToPath(import.meta.url)` · a `violate(message)` closure that increments a counter and prints
`[ERROR] ${SELF}: …` to **stderr** · a final `console.log` **summary line that always prints, even at zero**
· `process.exitCode = violations > 0 ? 1 : 0`. Exit codes are `0` clean / `1` violation-or-unreadable-input
(`assert-a11y-scan-wiring.mjs` adds *"A file this guard cannot read is wiring it cannot verify — this fails
closed"*), and `hygiene-codemod.mjs` adds `2` for usage error.

`assert-unit-test-coverage.mjs:38-44` also records, verbatim, why these live outside TypeScript — quote it in
the plan so the executor does not "improve" the new script into a `.ts` file:

> *"This file is deliberately OUTSIDE TypeScript, against CLAUDE.md's 'use TypeScript strictly', for that same
> bootstrapping reason: a guard that must run before anything is built cannot itself require a build."*

`[VERIFIED: scripts/assert-unit-test-coverage.mjs:1-60, scripts/assert-a11y-scan-wiring.mjs:1-120,
scripts/assert-i18n-catalog-namespaces.mjs:1-70 + tail read this session]`

**Scope note the planner must carry:** root `scripts/` is **not** in `packages/**`/`apps/**`/`tests/**`, so
these three guards' own docblocks — which are dense planning-reference prose (`assert-unit-test-coverage.mjs:4`
reads *"(see phase 141, requirements UNIT-04 and UNIT-02 / decision D-17)"*) — are **out of scope** and must
not be swept. Same for `.github/`, `.claude/`, `.agents/`, `CLAUDE.md`, `.planning/` (the last four are
enforced-in-code exemptions inside `hygiene-codemod.mjs`, per its D-15 hard exclusion (b)).

### 3.3 The workable intra-phase sequence (answers D-N1(c)'s objection)

D-N1(c) was rejected because a guard cannot be *enabled* against pre-existing violations. That rejection is
about **enabling**, not about **authoring**. The sequence below never has a disabled guard in the tree and
never has a red `lint:check`:

| Wave | Step | Gate state |
|---|---|---|
| **0** | Author `scripts/assert-comment-hygiene.mjs` with its own fixture self-test (`--self-test`, mirroring `hygiene-codemod.mjs`). **Not** referenced from `package.json`. Run it manually; its output *is* the work queue for waves 1-3. | not wired — but not "shipped disabled" either: it is unreferenced, self-tested, and its report is the phase's own instrument |
| **1** | Mechanical: citation strip (retargeted codemod, `--apply`), the escape fix, the three renames, the terse-name rename. | not wired |
| **2** | Judgement: the 642-span rewrite-vs-delete pass, batched. | not wired |
| **3** | The forced-line-break sweep under § 1.4's chosen disposition. Re-run the scan → **0**. | not wired |
| **4** | Add `assert:comment-hygiene` to `package.json`; append `&& yarn assert:comment-hygiene` to `lint:check`; add the chain-**membership** vitest assertion; run the negative control; run `yarn lint:check` and the full E2E suite. | **wired and green** |

The wiring commit is the only one that can turn `lint:check` red, and by construction the tree is already at
zero when it lands.

### 3.4 The wiring assertion — mirror `b410d3a90` exactly

```bash
git show b410d3a90 --stat   # packages/dev-seed/tests/ciTypecheckGate.test.ts | 11 +++++++++--
```

The corrected assertion, verbatim from the commit:

```ts
// The invariant is MEMBERSHIP of the `&&` chain, not terminal position:
// every link after it is equally aborted by a type failure, so guards may
// be appended freely. Asserting `endsWith` instead made this test fail the
// moment Phase 147 appended its two scan guards — a correct change the
// over-specified assertion had no business rejecting.
const links = ROOT_PACKAGE_JSON.scripts['lint:check'].split('&&').map((link) => link.trim());
expect(links).toContain('yarn typecheck');
```

Phase 152's new assertion is the same three lines with `'yarn assert:comment-hygiene'`, added to
`packages/dev-seed/tests/ciTypecheckGate.test.ts` (or a sibling spec in the same directory). That file already
reads root `package.json` from `REPO_ROOT` and documents why a repo-meta spec lives in `dev-seed`:

> *"`yarn test:unit` is `turbo run test:unit`, so a repo-meta spec needs a package to run in, and this package
> already reads repo-root files from its tests."*

**Do not assert terminal position.** `b410d3a90`'s entire subject line is the lesson.
`[VERIFIED: git show b410d3a90 and packages/dev-seed/tests/ciTypecheckGate.test.ts:1-45,69-88 read this session]`

### 3.5 The negative control — the repo's own flip pattern

`.planning/STATE.md:57-71` records the Phase-147 pattern the planner should reuse, in the operator's own
framing: *"CSCAN-02 against `AX1-NEW` read against `AX1-OLD`, because **the flip is the evidence and the green
is not**"*. The shape: a paired OLD/NEW row where OLD is the *injected defect observed caught* and NEW is the
clean re-run, with the identity between them carried by a stated invariant.

`b410d3a90`'s commit body gives the compact form for a chain guard:
> *"Negative control: removing the `yarn typecheck` link makes the reworked assertion fail (1 of 4); restoring
> it passes 4 of 4."*

Phase 152's two controls, both cheap and both reversible in one edit:
- **HYG1-OLD / HYG1-NEW** — reintroduce one forced line break into one comment (e.g. re-wrap
  `apiRouteAdapter.ts:13`); `yarn lint:check` must exit 1 naming that `file:line`. Revert; exit 0.
- **HYG2-OLD / HYG2-NEW** — remove `&& yarn assert:comment-hygiene` from `lint:check`; the vitest
  membership spec must fail. Restore; pass.

`[VERIFIED: .planning/STATE.md:57-71 grepped and read this session; b410d3a90 commit body read this session]`

---

## Section 4 — The planning-reference class, re-measured

**⚠ LOUD CONTRADICTION 3 — the class is larger than 817, and the per-tree split is different.**

Two independent measurements, one mine and one from the repo's own committed instrument.

### 4.1 The repo's own instrument (authoritative — it is the tool the gate will use)

```bash
bash .claude/skills/ship-review-stack/sources/hygiene-grep-report.sh
```
```
  pattern               occ   files    bare  expect     verdict
  phase-ref             744     261     102  bare = 0   FAIL
  spike-ref              40      30       0  bare = 0   OK
  decision-id-long        1       1       -  occ = 0    FAIL
  decision-id-bare       78      27       -  occ = 0    FAIL
  section-anchor         21       8       -  occ = 0    FAIL
  planning-path          11       7       -  occ = 0    FAIL
  plan-number             1       1       -  occ = 0    FAIL
  milestone-ver          50      33       -  -          REPORT
  task-id               123      60       -  occ = 0    FAIL

  planning-reference total (8 rows) : 946
  task-id supplementary             : 123
  union files touched by any row    : 299
```

### 4.2 My independent line-level measurement

```bash
node planref.mjs
# CITATION class: 888 lines {"apps":290,"packages":341,"tests":257}   distinct files: 278
#   by pattern (overlapping): phase-number 694, decision-id 254, spike-ref 39, planning-path 9, plan-artifact 4
# NARRATIVE-only (no citation): 54 {"apps":28,"packages":11,"tests":15}
# UNION: 942
```

| Source | Figure | Per-tree |
|---|---|---|
| `152-CONTEXT.md` fact 7 / `ROADMAP.md` / `REQUIREMENTS.md` | 817 comment **lines** | packages 336 · apps 219 · tests 223 |
| **Measured — comment lines carrying ≥1 citation** | **888** | **packages 341 · apps 290 · tests 257** |
| **Measured — + narrative-only lines (no citation token)** | **942** | packages 352 · apps 318 · tests 272 |
| **Measured — occurrences (repo's own report)** | **946** (+123 task-id = **1,069**) | 299 files union |

The `packages` figure is stable (341 vs 336); `apps` (+71) and `tests` (+34) are where CONTEXT.md undercounts.
**Size the sweep against 888 lines / 946 occurrences, not 817.** The direction of the error is the safe one —
the sweep is bigger than planned, not smaller — but a plan that budgets 219 lines for `apps` will run 33% over.

Precision was checked, not assumed. The `decision-id` detector matched only genuine ids (`WR-02` ×35,
`WR-04` ×17, `D-04` ×11, `NAVA11Y-01` ×8, `TMPL-02` ×8, `CSCAN-01` ×6, `TIR3` ×5, `T-58-07` ×3, …) with **no**
false positives of the `UTF-8`/`WCAG-21` shape. The `phase-number` detector matched 58 distinct tokens, all
genuine (`phase 140` ×95, `phase 56` ×80, `phase 113` ×69, …). Four low-numbered matches were hand-inspected:
`00-helpers.test.sql:421` (`Phase 2: Smoke tests`) and `run-concurrency-scaling.sh` (`PHASE 1: JSONB SCHEMA`)
are **algorithm/stage markers, not citations** — the committed codemod already classes these
`ambiguous-reference` residue (hard exclusion (g)) and never rewrites them.

### 4.3 ⚠ LOUD CONTRADICTION 4 — 642 of the 744 phase references are in a form the existing gate calls GREEN

`phase-ref` shows `occ 744` / `bare 102`. **`bare` counts references *not* preceded by `see `.** Phase 151
already ran its codemod's rule 6, which *collapses* `Phase 88` → `see phase 88`, and `hygiene-grep-report.sh
--assert-clean` is written to check the survivor rows **on `bare`, never on `occ`** — its own header says so:

> *"THE COLLAPSED SURVIVOR FORM'S BASELINE IS NOT ZERO. `see phase N` already appears 4 times in 3 files in
> the current tree. That is the floor, not a violation: D-14 authorises exactly this form to survive.
> `--assert-clean` therefore checks the survivor rows on their `bare` column, never on `occ`."*

**Phase 152's criterion 2 authorises no such survivor.** REVIEW-HYG-02: *"no historical narrative,
planning-artifact path, phase or plan number, or decision id survives."* So:

- **642 comment lines carry `see phase N` and are invisible to the existing gate.** They are the majority of
  Phase 152's work.
- The codemod's **rule 6 must be inverted** for this phase: collapse → delete-and-repair, or (safer)
  demote every `phase-ref`/`spike-ref` match to residue so the wave-2 agent pass owns all of them.
- The report script needs a Phase-152 mode (a flag, or a sibling script) where `phase-ref` and `spike-ref`
  are asserted on **`occ = 0`**, not `bare = 0`. **A plan that reuses `--assert-clean` unchanged ships a gate
  that is green on 642 violations.**

`[VERIFIED: .claude/skills/ship-review-stack/sources/hygiene-grep-report.sh:29-33 read this session; the
744/102 split is that script's own output, run this session]`

### 4.4 The rewrite-vs-delete split, and how to make wave 2 tractable

Lines are the wrong unit — a five-line narrative block is one judgement, not five. Measured at span level:

```bash
node spans.mjs
# comment SPANS containing >=1 planning reference: 642 {"apps":235,"packages":238,"tests":169}
# files: 278
# span length histogram (non-blank comment lines): {"1":84,"2-3":106,"4-6":133,"7-12":119,"13+":200}
# spans where EVERY line is a reference line: 85
```

**642 spans in 278 files.** The shape:

| Span length | Count | Likely disposition |
|---|---:|---|
| 1 line | 84 | **85 of these are pure-reference spans** — mechanical delete or strip. Near-zero judgement. |
| 2-3 lines | 106 | mostly strip-citation-keep-sentence |
| 4-6 lines | 133 | mixed |
| 7-12 lines | 119 | mixed; the rewrite-not-delete class concentrates here |
| **13+ lines** | **200** | the heavy narrative blocks — **the real work**, ~31% of spans |

**Largest single-file concentration: `tests/playwright.config.ts` — 52 reference spans / 74 reference lines.**
That one file is 8% of the whole judgement surface and should be its own task.

Top-20 concentration (`node spans.mjs` tail):
```
52 tests/playwright.config.ts                                    9 packages/dev-seed/src/template/permittedKeys.ts
15 packages/dev-seed/src/templates/e2e/base.ts                   9 packages/dev-seed/src/writer.ts
13 tests/tests/specs/voter/voter-journey.spec.ts                 9 packages/dev-seed/tests/template/permittedKeys.test.ts
12 packages/dev-seed/src/supabaseAdminClient.ts                  7 apps/frontend/src/lib/dynamic-components/entityCard/EntityCard.svelte
12 packages/dev-seed/tests/integration/default-template...       7 packages/dev-seed/src/emitters/latent/project.ts
10 apps/frontend/src/lib/contexts/app/appContext.svelte.ts       7 packages/dev-seed/tests/assertKnownRowProps.test.ts
 9 apps/frontend/src/lib/contexts/voter/voterContext.svelte.ts   7 tests/tests/specs/a11y/a11y-smoke.spec.ts
```

**Recommended batching for wave 2:** by file, descending by span count, in four task groups —
(i) `playwright.config.ts` alone (52); (ii) the `packages/dev-seed/**` cluster (~110 spans, one coherent
domain); (iii) `apps/frontend/src/lib/contexts/**` + `dynamic-components/**` (~60); (iv) the long tail
(~420 spans across ~250 files, ≤6 spans each, parallelisable by directory). Batching **by tree** is worse:
it splits `dev-seed`'s source and test halves across two agents that need the same context.

### 4.5 The two worked rewrite-not-delete examples

**`packages/dev-seed/src/cli/resolve-template.ts:62-70` — CONTEXT.md's extent is exact.** Nine comment lines.
Verbatim at HEAD:
```
 62|  // ⚠ Own-property lookup, not a bare index (`144-REVIEW` WR-06). `builtIns` is
 63|  // a plain object literal, so `builtIns['toString']` was
 64|  // `Object.prototype.toString` — truthy — and `--template toString` skipped the
 65|  // "Unknown template" branch entirely. The consequence changed in THIS phase:
 66|  // the value used to be returned silently, and now it reaches `validateTemplate`
 67|  // (see the call below), which reports
 68|  // `Template validation failed: template.: Invalid input: expected object,
 69|  // received function` — measured — instead of the actionable message with the
 70|  // list of built-ins.
```
The live invariant is lines 62-64: `Object.hasOwn` is required because a bare index hits `Object.prototype`.
Lines 65-70 are *"The consequence changed in THIS phase"* — pure narrative about a past edit. Rewrite target
(one or two lines): the hazard, the guard, no `144-REVIEW`, no WR-06, no "this phase".

**⚠ LOUD CONTRADICTION 5 — `supabaseDataWriter.ts:86-90` does not exist as described.** The measured
Playwright-timing block is at **`:88-104` (17 lines)**, not `:86-90` (5 lines). Lines 84-85 are a *different*,
unrelated comment (`// currentPassword and authToken are WithAuth compatibility shims -- ignored by
Supabase.`). The real block:
```
 88|  // Future-reference note (see phase 86.1 ToU-406 chase): `auth.updateUser({ password })`
 89|  // rotates the access token. …
 …    …  (a) the live failure was not reproduced under 20× repeat-each …
 …    …  (b) `refreshSession()` issues an extra network round-trip …
103|  // If the 406 reappears, add `await this.supabase.auth.refreshSession()` here
104|  // (and mirror in `_resetPassword` / `_register` above) and re-verify.
```
It does carry real, measured information — a *deliberately-not-taken* fix with its two reasons and a
re-trigger condition — so D-A1's rewrite-not-delete verdict stands. But it is a **17-line, 13+ bucket span**,
not a 5-line one, and it is one of the harder judgement calls in the phase. Give it its own task.
`[VERIFIED: packages/dev-seed/src/cli/resolve-template.ts:62-70 and
apps/frontend/src/lib/api/adapters/supabase/dataWriter/supabaseDataWriter.ts:84-104 read this session]`

---

## Section 5 — The mechanical stage: reuse, do not rebuild

`.claude/skills/ship-review-stack/` is not documentation about a codemod — it **is** the codemod, committed,
fixture-tested, and passing today. Read `SKILL.md` § 6 and the two source scripts before planning wave 1.

| Asset | Path | State today |
|---|---|---|
| Codemod | `.claude/skills/ship-review-stack/sources/hygiene-codemod.mjs` | 935 lines. `--self-test` → **4 fixtures, 0 failures**, exit 0. Dry-run by default. |
| Fixtures | `.../sources/fixtures/hygiene-codemod.{input,expected}.{ts,svelte,sql,sh}` | 8 files, 4 language families |
| Report/gate | `.../sources/hygiene-grep-report.sh` | 229 lines; `--assert-clean`, `--save-baseline`, baseline-diff columns |
| Procedure | `.../SKILL.md` § 6 *"Run the mechanical hygiene pass, then the judgement pass"* | 377 lines |

Dry-run over the current tree, run this session (**wrote nothing — `git status` unchanged**):

```bash
node .claude/skills/ship-review-stack/sources/hygiene-codemod.mjs \
  --quiet --residue-out /tmp/residue.tsv --json-out /tmp/hyg.json
```
```
  per-rule hits                     residue by reason (the agent pass's work queue)
    artifact-path        26           not-a-comment-span           98
    section-anchor        0           markdown-file                40
    plan-number           1           milestone-version            44
    decision-id-long      1           todo-class                   59
    decision-id-bare     65           unstrippable-section-anchor  16
    task-id              35           ambiguous-reference           9
    phase-ref            60           attributive-reference        27
    spike-ref             0           files carrying residue      139
  arithmetic (hits + residue == total): OK
MODE: DRY-RUN (no file on disk was modified)
```

### What Phase 152 must change in it

| # | Change | Why |
|---|---|---|
| 1 | **Invert rule 6.** It currently rewrites `Phase 88` → `see phase 88` (D-14's collapsed survivor form). Phase 152 forbids the survivor. Either delete-and-repair, or — safer — demote every `phase-ref`/`spike-ref` match to residue and let the wave-2 agent pass own all 744. | § 4.3. Leaving rule 6 as-is *creates* 60 more `see phase N` lines that the same phase then has to delete. |
| 2 | **Narrow the scope.** Default globs include `.md` (40 markdown-file residue). Phase 152's scope is code in `packages/**`/`apps/**`/`tests/**`. Pass explicit `--files`, and keep the in-code D-15 exemption (`CLAUDE.md`, `.agents/`, `.claude/`, `.planning/`) untouched. | Scope creep into `.md` would edit `packages/data/README.md` and the docs site. |
| 3 | **Relocate + re-self-test.** The script's own `Usage:` block still points at `.planning/phases/151-.../scripts/`. Copy it to a Phase-152-owned path, re-run `--self-test`, and extend the fixtures with a case for the inverted rule 6. | A codemod whose fixtures do not cover the changed rule is untested at exactly the point it changed. |
| 4 | **Keep every hard exclusion (a)-(h).** Each is a measured hazard, not a hypothesis — notably (h) attributive references (*"Mirrors the Phase 64 fix"* → *"Mirrors the see phase 64 fix"*, 113 of 704 measured at Phase-151 time). Phase 152 deletes rather than collapses, so (h) becomes *delete-and-reword*, which is agent work, not regex work. | Widening a regex here is how the *"38 broken comments in the test tree, 28 in the routing surface and 6 in the [components]"* incident in `SKILL.md:314` happened. |

`SKILL.md:265` is worth quoting into the plan as the phase's own risk statement: *"Six artifacts in Phase 151
were self-consistent and wrong: a `hits + residue == total` balance while…"* — an arithmetic identity is not
a correctness proof.

---

## Section 6 — Criterion 5: the residue pass

Criterion 5: *"the codemod runs dry-run first, and a residue pass confirms every match it declined to touch
was non-comment-shaped (a `console.warn`, a test title, an ESLint `message:`). Phase 151 measured 126 such
lines — treat that as the expected order of magnitude, not as zero."*

**The mechanism already exists and is exactly this**: `hygiene-codemod.mjs`'s warn-only second pass, emitting
`--residue-out <path>` as TSV `(path, line, reason, rule, text)`, with the `not-a-comment-span` reason being
precisely criterion 5's class, plus the asserted `hits + residue == total` balance so nothing is silently
dropped. The codemod docblock states the split's motivation in the same terms the criterion uses:

> *"126 of the matched lines are NOT comment-shaped and include a runtime user-visible `console.warn` string,
> Playwright test titles, and an ESLint rule `message:`. A regex-only pass over all of them would edit program
> behaviour."*

**Measured today: `not-a-comment-span` = 98** (apps 8 · packages 58 · tests 32), down from Phase 151's 126.
Report 98 as the current expectation; 126 is a stale figure.

```bash
awk -F'\t' '$3=="not-a-comment-span"' /tmp/residue.tsv | wc -l                       # 98
awk -F'\t' '$3=="not-a-comment-span"{split($1,a,"/"); print a[1]}' /tmp/residue.tsv | sort | uniq -c
```

Resolving the 98 back to source lines confirms the class:

```
packages/dev-seed/tests/generators/ElectionsGenerator.test.ts:26   it('applies externalIdPrefix to generated rows (GEN-04)', () => {
packages/dev-seed/tests/cli/resolve-template.test.ts:115           it('D-07: throws for a built-in carrying an unknown top-level key…', async () => {
apps/frontend/src/lib/_guards/eslint-store-guard.test.ts:90        describe('svelte/store ESLint guard — ASSERT-08 app-wide reach', () => {
apps/frontend/src/lib/i18n/tests/translations.test.ts:218          describe('TranslationKey type safety (CLEAN-04)', () => {
apps/supabase/benchmarks/scripts/run-concurrency-scaling.sh:77     echo "--- PHASE 1: JSONB SCHEMA ---"
apps/supabase/supabase/functions/identity-callback/index.ts:28     import * as jose from 'https://deno.land/x/jose@v5.9.6/index.ts';
```

Overwhelmingly **vitest `describe`/`it` titles**, plus two shell `echo` stage markers and one import URL
matched by the report-only `milestone-version` row. **Zero `console.warn` hits** in the current tree
(`git grep -nE "console\.(warn|error|log)\([^)]*([Pp]hase\s*[0-9]|\.planning/)" -- packages apps tests` → no
output) — that member of criterion 5's example triple is now historical.

### ⚠ LOUD CONTRADICTION 6 — criterion 5 and review comment #4 disagree about test titles

Criterion 5 treats a **test title** as a legitimately-declined, out-of-scope match. But review comment #4, at
`packages/filters/tests/filter.test.ts:315`, says: *"**Never use planning references in test names.** Also rem
line breaks from comment."* And that site has both — the comment at `:316-318` (`// TIR3 cluster 1: …`) *and*
the test name at `:315`:

```
315| test('ChoiceQuestionFilter: TIR3 empty-include semantics', () => {
316|   // TIR3 cluster 1: distinguish `include = undefined` (filter inactive, all
317|   // pass) from `include = []` (filter ACTIVE with zero allowed → 0 results).
318|   // Prior to this contract, both states collapsed to "filter inactive".
```

Resolution the planner should adopt (it satisfies both): the **codemod** declines every test title — that is
what makes the criterion-5 residue proof meaningful — and the **wave-2 agent pass** renames them deliberately,
as a separate task with its own gate. Renaming a test title is a program-visible change: it alters reporter
output and `--grep` selection. **Two safety checks are mandatory on that task:**

- `yarn test:e2e` is `playwright test … --grep-invert @probe` — selection is by **tag**, not title, so
  Playwright project/spec selection is unaffected. `[VERIFIED: package.json:29]`
- `tests/e2e-runs/` registers and `.planning/` records cite test titles verbatim. Renaming a title without
  updating them creates a dangling citation. Scope the title renames to the **20 files / 23 anchored
  occurrences** measured below, and check each against the registers.

```bash
git grep -nE "^\s*(describe|it|test)(\.\w+)?\(\s*['\"\`][^'\"\`]*((D|WR|T|TIR|RUNES|CLEAN|GEN|CLI|TMPL|ASSERT|SWEEP|EPERM|REAL|CSCAN|NAVA11Y|TYPE|VGATE|REACH)-?[0-9]|[Pp]hase\s*[0-9])" -- packages apps tests | wc -l   # 23
# … | git grep -l … | wc -l   # 20 files
```
*(This anchored form under-counts relative to the codemod's 98 because it requires the call at line start;
use the residue TSV as the authoritative queue.)*

---

## Section 7 — The exemplar, line-exact at HEAD `22c2542e3`

**All of CONTEXT.md fact 10's line numbers hold.** Verified by direct read; quoted verbatim so the planner
writes exact before/after.

```bash
awk 'NR>=30 && NR<=125 {printf "%3d| %s\n", NR, $0}' "apps/frontend/src/routes/(voters)/+layout.svelte"
```

| Extent | Content at HEAD (verbatim) | D-A2 disposition |
|---|---|---|
| `:36-45` | `// WR-04 (see phase 86.3 review): popupQueue is a stable instance reference per` / `// CLAUDE.md "Context Destructuring Rule" — popupStore() returns an object` / `// literal `{ push, shift, subscribe }` (popupStore.svelte.ts:23) attached as` / `// a plain context property (appContext.svelte.ts:226), NOT a $state/$derived` / `// getter. The `push`/`shift`/`subscribe` methods are bound function` / `// references; destructuring captures the instance once at component init` / `// and subsequent `popupQueue.push(...)` calls correctly mutate the live` / `// queue. DO NOT swap popupQueue for a $derived/$state-based collection (or` / `// a getter on the context object) without migrating consumers to` / ``// `ctx.popupQueue.push(...)` per the destructuring rule.`` | **DELETE** |
| `:46-47` | `// appSettings is a reactive accessor (see phase 113 flatten) — read via` / ``// `ctx.appSettings`, never destructure (the alias below tracks it).`` | **KEEP, compressed to ONE line, without "see phase 113"** |
| `:48-51` | `const ctx = initVoterContext();` / `const { appType, popupQueue, userPreferences, t } = ctx;` / `const appSettings = $derived(ctx.appSettings);` / `appType.set('voter');` | the code the invariant guards — unchanged |
| `:59-75` | 17 lines: `// see phase 86.3-01 wave A fix (cells #1 + #2): …` … `// untrack-guarded inside settingsOverlay (SettingsOverlay.svelte.ts).` | **GONE** |
| `:77` | `// Reactive reads — these register the OUTER $effect's dependencies.` | **not in the disposition — keep.** It explains the code in front of it and is the phase's own rule made visible. Do not delete by momentum. |
| `:92-106` | 15 lines: `// see phase 86.3-01 cell #3 (notifications.voterApp) REVERTED 2026-05-20 to the` … `// in the same onMount, per the same small-fix constraint.` | **reduce to ONE line justifying `onMount`** |
| `:109` | `// Queue the voter-app notification popup (cell #3 — onMount one-shot).` | **REMOVE** |
| `:116` | `// Ask for event tracking consent if we have no explicit answer` | **KEEP** (the reviewer: *"the logic is a bit slow to read from the if clause"*) — and it guards `:117-123`, a 5-line boolean |

Two notes for the executor:

1. `:75` names `SettingsOverlay.svelte.ts`, which **this same phase renames** (§ 8.1). Because `:59-75` is
   deleted outright, no stale filename survives here — but the *other* prose reference to that module, at
   `apps/frontend/src/lib/contexts/layout/layoutContext.svelte.ts:131` (*"the write-after-read hazard
   SettingsOverlay documents"*), **does** need updating with the rename.
2. The compressed `:46-47` keeper must state the CLAUDE.md invariant with no citation. Suggested single line
   (the planner should fix the exact wording so the executor does not improvise):
   `// appSettings is a reactive accessor — read via ctx.appSettings, never destructure.`

`[VERIFIED: apps/frontend/src/routes/(voters)/+layout.svelte:30-125 read this session at HEAD 22c2542e3]`

---

## Section 8 — The three renames (REVIEW-HYG-03)

### 8.1 `SettingsOverlay.svelte.ts` → `settingsOverlay.svelte.ts`

**This IS a case-only rename on a case-insensitive filesystem.**
```bash
git config core.ignorecase                      # → true
diskutil info / | grep "File System Personality" # → APFS (case-insensitive by default)
git --version                                    # → 2.50.1 (Apple Git-155)
```

Use the two-step procedure. `git mv --force` can work on modern git, but the two-step is unconditionally safe
and leaves an unambiguous history:
```bash
cd apps/frontend/src/lib/contexts/utils
git mv SettingsOverlay.svelte.ts       __settingsOverlay.tmp.ts
git mv __settingsOverlay.tmp.ts        settingsOverlay.svelte.ts
git mv SettingsOverlay.svelte.test.ts  __settingsOverlay.tmp.test.ts
git mv __settingsOverlay.tmp.test.ts   settingsOverlay.svelte.test.ts
```

**Every referencing site** (`git grep -n "SettingsOverlay" -- ':!.planning'`):

| Site | Kind | Action |
|---|---|---|
| `apps/frontend/src/lib/contexts/layout/layoutContext.svelte.ts:9` | `import { settingsOverlay } from '../utils/SettingsOverlay.svelte';` | **specifier → `'../utils/settingsOverlay.svelte'`** |
| `apps/frontend/src/lib/contexts/layout/layoutContext.type.ts:4` | `import type { SettingsOverlayApi } from '../utils/SettingsOverlay.svelte';` | **specifier** |
| `…/utils/SettingsOverlay.svelte.test.ts:4,5` | `from './SettingsOverlay.svelte'` ×2 | **specifier** (and the file itself is renamed) |
| `apps/frontend/src/routes/(voters)/+layout.svelte:75` | prose in a comment | inside the `:59-75` block **deleted** by D-A2 — no action |
| `apps/frontend/src/lib/contexts/layout/layoutContext.svelte.ts:131` | prose: *"the write-after-read hazard SettingsOverlay documents"* | **update the prose to the new filename** |
| `layoutContext.type.ts:10,14,27`; `SettingsOverlay.svelte.test.ts:35,36`; `SettingsOverlay.svelte.ts:34,77,142,147,148` | the **type** `SettingsOverlayApi` and the **class** `SettingsOverlay` | **DO NOT RENAME.** The reviewer asked for the *file*; a PascalCase class/interface is correct TS convention. Criterion 3 names only the file. |
| `.claude/skills/spike-findings-.../sources/006-layout-overlay-rune/**` (7 sites) | the archived spike source | **out of scope** — `.claude/` is a D-15-exempt tree and a historical spike record |

**Note the import specifier omits `.ts`** — it is `'../utils/SettingsOverlay.svelte'`. The four specifier
edits are the entire linkage; `yarn typecheck` is the oracle that no fifth exists.

### 8.2 `EntityListWithControls.helpers.ts` → `helpers.ts`

**No collision.** `git ls-files apps/frontend/src/lib/dynamic-components/entityList/` returns 9 files; the
only `helpers`-named ones are the two being renamed:
```
EntityList.svelte  EntityList.type.ts  EntityListControls.svelte  EntityListControls.type.ts
EntityListWithControls.helpers.test.ts  EntityListWithControls.helpers.ts
EntityListWithControls.svelte  EntityListWithControls.type.ts  index.ts
```
Not a case-only rename — a plain `git mv` each.

**Every referencing site** (`git grep -n "EntityListWithControls\.helpers" -- ':!.planning'`) — 9 occurrences
in 3 files:

| Site | Kind |
|---|---|
| `EntityListWithControls.svelte:43` | `import { computeFiltered, countActiveFilters } from './EntityListWithControls.helpers';` — **specifier** |
| `EntityListWithControls.helpers.test.ts:2` | same specifier — **specifier** (file also renamed → `helpers.test.ts`) |
| `EntityListWithControls.svelte:27` | prose in the `<!--@component-->` docstring: *"See `EntityListWithControls.helpers.ts` for the pure…"* — **update** |
| `EntityListWithControls.helpers.ts:12` | prose: *"Tested in `EntityListWithControls.helpers.test.ts`."* — **update** |
| `EntityListWithControls.helpers.test.ts:6,9,11,19,25` | prose, including three `[VERIFIED: EntityListWithControls.helpers.ts:14-21]`-style citations — **update all five** |

`scripts/assert-unit-test-coverage.mjs` discovers tests by `readdirSync`, not by a hard-coded roster, and its
invariant is **workspace-level** (a workspace with tests declares `test:unit`; a workspace declaring it is
executed by turbo). Neither rename can trip it. `[VERIFIED: scripts/assert-unit-test-coverage.mjs:1-60,
207-218 read this session; `grep -n "SettingsOverlay\|EntityListWithControls" scripts/assert-unit-test-coverage.mjs`
→ no output]`

### 8.3 `quatenaryChoices` → `quaternaryChoices`

**⚠ LOUD CONTRADICTION — a second file carries the misspelling and no planning document mentions it.**

```bash
git grep -in "quatenary\|quartenary\|quaternary" -- packages apps tests
```
```
packages/data/src/objects/questions/variants/multipleChoiceCategoricalQuestion.test.ts:11,33,46,61,70   (5)
packages/data/src/objects/questions/variants/singleChoiceCategoricalQuestion.test.ts:19,34,36           (3)
```

**8 occurrences in 2 files.** `152-CONTEXT.md`, `ROADMAP.md:1015` and `REQUIREMENTS.md:90` all name only
`multipleChoiceCategoricalQuestion.test.ts:11`. **`singleChoiceCategoricalQuestion.test.ts` is unmentioned
anywhere in the planning record.** Its `quatenaryChoices` is a function-local `const` inside a test body
(`:19`, used at `:34` and `:36`); its sibling `binaryChoices` sits at `:15` — the same consistency anchor D-A3
cites for the other file.

Leaving it would ship the misspelling in the adjacent file of the same directory, in the phase whose whole
purpose is naming correctness. **Rename both.** The identifier is file-local in both cases: zero exports, zero
cross-file references.

Confirming the anchor D-A3 relies on, in the named file:
```
 11| const quatenaryChoices: Array<Choice<undefined>> = [   // 4 entries a/b/c/d → quaternary
 17| const binaryChoices: Array<Choice<undefined>> = [      // 2 entries
```
`[VERIFIED: packages/data/src/objects/questions/variants/multipleChoiceCategoricalQuestion.test.ts:1-25 and
singleChoiceCategoricalQuestion.test.ts:15-22 read this session]`

### 8.4 Gates affected, and honest timing guidance

| Gate | Affected by | Command |
|---|---|---|
| `yarn build` | 8.1, 8.2 (module graph) | `turbo run build` — cached; CLAUDE.md states an unchanged rebuild is *"under 5 seconds"*. A rename invalidates `@openvaa/frontend` only; `packages/**` is untouched by 8.1/8.2. |
| `yarn typecheck` | 8.1, 8.2 — **the real oracle for "no dangling reference"** | `turbo run typecheck` |
| `yarn test:unit` | 8.1, 8.2 (renamed specs), 8.3 (both `packages/data` specs) | `yarn assert:unit-coverage && turbo run test:unit`. Scoped: `yarn workspace @openvaa/data test:unit`, `yarn workspace @openvaa/frontend test:unit`. |
| `yarn lint:check` | all three (import-sort ordering may shift on the renamed specifiers) | the 6-link chain in § 3.1 |
| `yarn test:e2e` | none of the three directly — **but the phase's comment sweep touches E2E specs and fixtures heavily**, so CLAUDE.md's cardinal rule binds the phase as a whole | `yarn test:e2e` after a fresh `yarn db:reset` and one dev server on `:5173` |

**I did not run any of these** (the brief forbids it, and they mutate the tree/turbo cache). Wall-clock
figures are the executor's to measure, not mine to assume. `[ASSUMED]` — I would not put a minute figure in
the plan; have the executor record actuals in the SUMMARY.

---

## Section 9 — The UK/US symbol-name audit (REVIEW-HYG-04 / D-A6)

### 9.1 Method

Two passes. A broad stem-match over all lines (874 raw occurrences) proved unusable for the criterion —
`disc*` matches `discover`/`disconnect`/`discourse`, `axe` matches the a11y tool, `analys*` matches
`FactorAnalysis` (*analysis* is US spelling too), and `labelled` matches **`aria-labelledby`**, a W3C attribute
name that must never be renamed. So the audited pass is: **strip comments and string literals, tokenize
identifiers, split camelCase/snake_case, and match each word against a curated whole-word UK list** (62 stems,
listed in § "Code Examples"), over `.ts .tsx .js .mjs .cjs .svelte .sql` in the three trees.

```bash
node uk2.mjs
# IDENTIFIER-context UK-variant hits: 21     distinct identifiers: 5
#   8x offences   5x permLocalisationPositiveTemplate   3x describeOffence   3x localisation   2x localisable
```

Two of the five are not identifiers on inspection (`localisation` resolved to Playwright project-name
*strings*; `localisable` to rendered docs prose). **In-scope result: 3 distinct identifiers, 14 occurrences,
3 files.**

### 9.2 (a) Identifiers — IN SCOPE

| Identifier | Sites | Proposed | Blast radius |
|---|---|---|---|
| `describeOffence` (fn) | `packages/dev-seed/tests/assertKnownRowProps.builtins.test.ts:63,99,101` | `describeOffense` | **file-local**, not exported |
| `offences` (local `const`) | same file `:81,90,106,165,166,169` | `offenses` | **file-local** |
| `permLocalisationPositiveTemplate` (exported `const`) | `packages/dev-seed/src/templates/e2e/perm/perm-localisation-positive.ts:79,212`; `packages/dev-seed/src/templates/index.ts:38,85,167` | `permLocalizationPositiveTemplate` | **5 sites, 2 files, one workspace** |

⚠ **The `permLocalisation…` rename must stop at the identifier.** The identifier is bound to a *string* key
`'perm-localisation-positive'` (`templates/index.ts:85`) which is the `--template` CLI argument, the module
filename, and the stem of **10+ Playwright project names, `testMatch` regexes, setup/teardown names and spec
filenames** in `tests/playwright.config.ts:1264-1294`. Those are strings and paths, not symbols → **out of
D-A6's scope**. Renaming them is an E2E-suite-wide change and CLAUDE.md's cardinal rule makes that an
unacceptable rider on a comment-hygiene phase. Rename the identifier (5 sites), and **record in the committed
audit** that the key/filename/project-name family stays UK-spelled by scope, with a pointer so the next reader
does not re-open it. If the planner judges the resulting identifier-vs-key mismatch worse than the
inconsistency, the alternative is to leave all 5 and record *that* — but it must be recorded either way.

### 9.3 (b) Comments / prose — OUT OF SCOPE (D-A6), recorded

- `organisation(s)` — **27 comment/prose sites**, concentrated in `packages/dev-seed/src/templates/e2e/perm/*.ts`
  topology docblocks (`* Topology: 1 election, 1 CG with 1 CO, 2 organisations, …`, 14 files),
  `packages/dev-seed/src/templates/_helpers/buildMinimal.ts:15,97,269,430`,
  `packages/dev-seed/src/templates/e2e/base.ts:36`, `tests/tests/specs/perm/perm-localisation-positive.spec.ts:5`,
  `tests/tests/specs/perm/perm-org-matching.spec.ts:11,26`, `tests/tests/specs/voter/voter-journey.spec.ts:1183`.
- `offences` in prose — `packages/dev-seed/src/template/permittedKeys.ts:101`.
- `colour(s)` / `behaviour` / `grey` / `cancelled` / `labelling` / `practises` in component
  `<!--@component-->` docstrings — `Icon.svelte:13`, `OpenVAALogo.svelte:13`, `InfoBadge.svelte:9`,
  `PreventNavigation.svelte:8`, `Video.svelte:19`, `PasswordValidator.svelte:13`, `Term.svelte:114,117`,
  `ConstituencySelector.svelte:297`, `editTranslations.ts:123`.
- Markdown outside the three trees: `packages/data/README.md:71`, `apps/docs/src/routes/(content)/**/*.md`.

### 9.4 (c) Test fixtures, example strings, user-facing copy — OUT OF SCOPE, recorded

CONTEXT.md's three named hits, **all verified present and correctly characterised**:
- `apps/frontend/src/params/etSg.test.ts:22` → `['organisation', false]` — a **deliberate negative-test input**
  (asserting the param matcher *rejects* it). Changing it silently weakens a passing test.
- `apps/frontend/src/params/etPl.test.ts:23` → `['organisations', false]` — same.
- `apps/frontend/src/lib/components/input/Input.svelte:46,52` → `label="Favourite colours"` and
  `info="Select any number of colours in the order you prefer them."` inside the ```` ```tsx ```` usage block
  of the `<!--@component-->` docstring.

Additional, **not** named in CONTEXT.md:
- `apps/docs/src/routes/+page.svelte:143,189` — `localisable` in **rendered user-facing copy**
  (`<span>🌍 Fully localisable</span>`). Out of scope, and changing it is a copy decision, not a hygiene one.
- `tests/tests/specs/voter/voter-journey.spec.ts:1180,1492` — `test.step('organisation matching …')` and
  `test.step('organisation details …')` — **step titles**, i.e. strings. Interacts with § 6's test-title
  question; out of D-A6 scope regardless.

### 9.5 Where the audit artefact should live

Criterion 4 requires the audit be committed *even when the answer is "none found"*, and it is not "none
found". Recommend **`.planning/phases/152-comment-naming-hygiene-sweep/152-SPELLING-AUDIT.md`**, containing:
the word list used (so a future audit is a re-run, not a re-derivation), the exact command, the three
in-scope identifiers with their dispositions, and §§ 9.3-9.4 verbatim as the out-of-scope register. Do not
bury it in a SUMMARY — the criterion's stated purpose is *"so the next reader does not repeat it"*, which
requires a findable, single-purpose file.

---

## Section 10 — The three CONTEXT.md `<open>` items the planner must dispose of

### 10.1 `EntityCard.svelte:126` — the terse names. **Blast radius: zero. Scope it in.**

Review comment (PR #869): *"Don't use variable names as terse as this (and `scs` etc.). The only place to use
such is in small ad hoc closures like `.filter((o) => o.foo))`."*

```bash
F=apps/frontend/src/lib/dynamic-components/entityCard/EntityCard.svelte
grep -nwE "qs|showSM|scs|scsMaxOverride" $F
git grep -lw scs -- apps packages tests   # → only $F (+ 2 unrelated .png filenames)
git grep -lw showSM -- apps packages tests # → only $F
```

All four are **function-local `let` bindings in one block**, 13 occurrences, **1 file, zero exports, zero
external references**:

```
126|  let qs: CardQuestions | undefined;
127|  let showSM = false;
129|  showSM = appSettings.results?.cardContents?.[type]?.includes('submatches') ?? false;
131|  qs = getCardQuestions({
140|  let scs: Array<EntityCardProps> | undefined;
141|  let scsMaxOverride: number | undefined; // see phase 69: alliance branch overrides maxSubcards…
148|  scs = findCandidateNominations({ … }).map((e) => ({
157|  scs = findOrganizationNominations({ … }).map(
162|  scsMaxOverride = Infinity; // see phase 69: render all member orgs, not just top-3
184|  questions: qs,
185|  showSubMatches: showSM,
186|  subcards: scs,
187|  subcardsMax: scsMaxOverride,
```

Lines 184-187 hand each terse local to a **well-named prop**, which supplies the rename targets for free:
`qs` → `cardQuestions`, `showSM` → `showSubMatches`, `scs` → `subcards`, `scsMaxOverride` → `subcardsMaxOverride`.
(`showSubMatches: showSubMatches` at 185 then becomes shorthand-able; check the repo's `object-shorthand`
lint setting before deciding.)

**Recommendation: scope it into this phase**, as a task in wave 1 alongside the other renames. It is one of
the 19 reviewed comments, in the naming half of a naming phase, at a cost of 13 line edits in 1 file with a
type-checked closure proof. Filing it to `.planning/todos/pending/` per D-N2 is defensible only if the
operator wants criterion 3's rename list treated as closed — but D-N2's stated trigger is *work that is not a
comment edit and is a real defect*, and this is neither: it is a name, and this phase renames names.
**Do not silently drop it.**
Bonus: `:141` and `:162` carry `// see phase 69:` citations, so the task overlaps wave 1's citation strip.

### 10.2 `supabaseDataProvider.ts:361` — the split confirmed

Review comment (PR #869): *"Aren't the fields already typed by `toDataObject`? They should be. Also, remove
line breaks from comment."*

```
361|  // Explicitly-typed shared DataObject fields (localized name/short_name/
362|  // info + mapped order/customData from toDataObject) plus the JSONB
363|  // runtime guards for image and answers. Building a variant-specific
364|  // object below lets the discriminated `AnyEntityVariantData` union
365|  // resolve structurally — no union-suppressing cast.
366|  const base = {
```

**Split confirmed.** The comment is at `:361-365` (5 lines, starting exactly at the reviewed line).
- **This phase (152):** the forced-line-break half — join `:361-365` into one line. Carries no planning
  reference, so it is *not* in the 888-line class; it is in the D-A4 class and only there.
- **Phase 157 (Adapter Boundary & Typing):** the typing half. The comment *asserts* the fields are
  explicitly typed; the code below at `:367-374` is a wall of `as string | null | undefined` casts. The
  reviewer is questioning whether those casts are needed at all — a substantive typing change in the
  adapter, squarely Phase 157's goal (*"Data crossing the Supabase boundary is validated into its type rather
  than cast into it"*).

**Action for the planner:** do not merely note the split — Phase 157's planner runs concurrently. Add a line
to `152-RESEARCH`-derived plan notes and, per CONTEXT.md `<open>` 3, confirm with 157. If Phase 152 joins the
comment and Phase 157 later deletes the casts, the comment becomes wrong; the safest 152 action is the join
**plus** leaving the sentence semantically unchanged so 157 can rewrite it wholesale.

### 10.3 `Input.svelte:316` — partly load-bearing; keep one line, delete two

Review comment (PR #869): *"Remove comment, the frontend components should not reference data provider
implementations."*

```
314|      }
315|
316|      // Number — coerce the DOM string value to a real JS number (or undefined when cleared).
317|      // The backend `validate_answer_value` RPC requires a JSON number, so emitting the raw
318|      // string would fail validation ("Answer for number question must be a number").
319|    } else if (type === 'number' && currentTarget instanceof HTMLInputElement) {
```

**Judgement: `:316` is load-bearing; `:317-318` are the boundary violation the reviewer named.**

- `:316` labels the branch and states *what* the code does and *why* (coerce, and map cleared → `undefined`).
  It explains the code in front of it. Deleting it leaves an unlabelled fourth arm of a four-way
  `if/else if` chain (the neighbouring arms at `:310` and `:325` carry the same kind of label).
- `:317-318` name a **backend RPC** (`validate_answer_value`) and quote its error string. `git grep -n
  "validate_answer_value" -- apps/frontend` returns **exactly one hit: this line.** It is the sole place the
  frontend component layer names a database function — precisely the architectural-boundary complaint.

**Recommended disposition: keep `:316`, delete `:317-318`.** Removing the whole block would obey the
reviewer's literal words while deleting a comment that satisfies the phase's own criterion; keeping `:317-318`
would leave the only frontend→RPC reference in the tree. This is not covered by any decision, so the planner
should state the disposition explicitly in the plan (as D-A2 does for the exemplar) rather than leaving it to
the executor. Note also the comment's odd placement — it sits *inside* the previous branch's block, labelling
the branch that follows; joining `:316`'s content should not move it.

---

## Section 11 — Blast radius and cross-phase conflict risk

Phase 152 runs first (D-N1(a)) and touches **760 files** — the union of the D-A4 wrapped-prose surface (747
files) and the planning-reference surface (278 files).

Cross-referencing every file cited in `.planning/PRE-SHIP-REVIEW-TRIAGE.md` under phases 153-160 against that
surface:

```bash
awk '/^## Phase 1[5-6][0-9]:/{ph=$0} /^- \*\*`/{ if(ph!=""){ match($0,/`[^`]+`/); s=substr($0,RSTART+1,RLENGTH-2); sub(/:[0-9]+$/,"",s); print ph"\t"s } }' \
  .planning/PRE-SHIP-REVIEW-TRIAGE.md | node overlap.mjs
```

| Later phase | Files it cites | Also inside 152's surface | Overlap |
|---|---:|---:|---:|
| 153 Build & Tooling Config | 17 | 1 | 6% |
| 154 dev-seed Determinism | 6 | 6 | **100%** |
| 155 Edge Function Hardening | 4 | 3 | 75% |
| 156 Supabase Schema | 16 | 11 | 69% |
| 157 Adapter Boundary & Typing | 9 | 6 | 67% |
| **158 Routing & Auth Harmonisation** | 22 | **19** | **86%** |
| **159 Component & Context Consolidation** | 14 | **13** | **93%** |
| 160 Agent Docs & Skills | 6 | 0 | 0% |
| **Total** | **94** | **59** | **63%** |

**Implications the planner must carry into the plan:**

1. **Land Phase 152 as a small number of large, coherent commits** (ideally: one per wave, or one per batch
   within wave 2), not as hundreds of per-file commits. Later phases rebase over it; a wide-but-shallow diff
   rebases far better than a deep interleaved one.
2. **Phases 158 and 159 will rewrite 32 of the files 152 edits.** If § 1.4 resolves to disposition (a) or (b),
   152 also un-wraps every comment in those files — a large mechanical diff on files two later phases rewrite
   structurally. Flag this to the operator as the concrete cost of the D-A4 sweep.
3. **The `\u2013` instance has essentially zero durable value.** `ROADMAP.md:1161` (Phase 159 criterion 3):
   *"`EntityCardAction` is replaced by a snippet — it is a pre-snippet-era workaround — and the separate
   component is deleted."* The file carrying the escape is **deleted by Phase 159**. Say so in the plan:
   **the durable half of the D-A5 fix is the guard rule, not the one-character edit.** Fix the instance anyway
   (criterion 1 names it, and 159 may slip), but do not budget it as a deliverable.
4. **Root `scripts/` is out of scope and must stay that way.** The three `assert-*.mjs` guards' own docblocks
   are among the densest planning prose in the repo. Sweeping them is out of scope AND would make the
   new guard's own docblock inconsistent with its three siblings.
5. **One out-of-scope doc-drift item worth a `.planning/todos/pending/` entry (D-N2):**
   `.github/workflows/main.yaml:70-79` still says *"`yarn lint:check` chains `yarn typecheck` as its last
   link"* — false since `b410d3a90`, and about to be more false when this phase appends a seventh link.
   `.github/` is out of scope; file it, don't fix it here.

---

## Don't Hand-Roll

| Problem | Don't build | Use instead | Why |
|---|---|---|---|
| Comment-span classification across `//`, `/* */`, `<!-- -->`, `--`, `#` with string-literal suppression | a fresh regex tokenizer | the classifier inside `.claude/skills/ship-review-stack/sources/hygiene-codemod.mjs` | 935 lines, fixture-tested for all four families, `--self-test` green today. Its docblock records the exact hazards a naive version hits — a `//` inside a template literal, and *"without [SQL and shell support] nine files are silently skipped or, worse, wrongly rewritten."* My own throwaway prototype hit both. |
| Stripping planning citations from comments | a new codemod | the same script, retargeted per § 5 | Ordered rules 1-7, NUL-sentinel repair so aligned tables stay byte-identical, structural idempotency guarantee, asserted `hits + residue == total`. Re-deriving this is weeks of hazards someone already paid for. |
| Before/after occurrence reporting + the gate | `git grep | wc -l` in a plan step | `hygiene-grep-report.sh` (`--save-baseline`, baseline-diff columns, `--assert-clean`) | Its header documents a *corrected* correction: `\bD-\d{2}\b` matches the `D-13` prefix inside `D-137-11` because `-` is a word boundary, so the naive two-row split double-counts every long-form id. A hand-rolled grep reproduces that bug. |
| Asserting the guard is actually run | a comment asking future authors to keep it wired | the vitest chain-**membership** spec (`b410d3a90`) | `assert-unit-test-coverage.mjs:12` states the principle: *"A comment asking future authors to add a `test:unit` script would be the same kind of non-guard this milestone exists to remove, so the invariant is CHECKED."* |
| Detecting UK spellings | a spellchecker dependency, or a broad substring match | a curated whole-word list over tokenized identifiers (§ 9.1) | Substring matching produced 874 hits of which ~98% were false (`disc`→`discover`, `axe`→the a11y tool, `labelled`→`aria-labelledby`, `analys`→`analysis`). The curated form produced 21, of which 14 are real. |
| Reflowing comments to a width | prettier / `printWidth` | nothing — it does not do this | Proven by execution: a 302-char comment survives `prettier --stdin-filepath` byte-identical. D-A4(b) was rejected for exactly this reason and the rejection is now measured, not asserted. |

**Key insight:** this repo has already built, tested and shipped the hard half of this phase. The research
question was never *"how do I write a comment codemod"* — it is *"what must change in the one that exists,
and what does the current tree measure."* Both answers are in §§ 4-5.

---

## Common Pitfalls

### Pitfall 1: reusing `hygiene-grep-report.sh --assert-clean` as Phase 152's gate
**What goes wrong:** the gate reports green while **642** `see phase N` references remain.
**Why:** that script checks survivor rows on `bare` (not preceded by `see `), because Phase 151's D-14
*authorised* the collapsed form. Phase 152's REVIEW-HYG-02 authorises no survivor.
**Avoid:** assert `phase-ref` and `spike-ref` on **`occ = 0`**. Prove it: run the reused gate before the
sweep, watch it say `spike-ref … OK` at `occ 40`, and use that as the negative control for the new one.
**Warning sign:** a plan step that says "run `--assert-clean` and confirm green".

### Pitfall 2: letting the codemod's rule 6 run unmodified
**What goes wrong:** the mechanical wave *creates* 60 fresh `see phase N` lines that the judgement wave then
has to delete — churn, and a larger diff for eleven downstream phases to rebase over.
**Avoid:** invert or disable rule 6 before wave 1, and extend the fixtures to cover the change.
**Warning sign:** the dry-run's `phase-ref 60` under *per-rule hits* rather than under *residue*.

### Pitfall 3: growing a dash rule "while we're in there"
**What goes wrong:** the guard fails on **3,237** pre-existing lines on day one, and on
`apps/frontend/src/hooks.server.ts:1` / `hooks.ts:1` it changes an **ESLint disable-directive parse**,
potentially disabling `func-style` silently.
**Avoid:** two rules only. Write the prohibition into the script's docblock so the next reader cannot add a
third by reflex. (CONTEXT.md `<open>` 6 names this; the measurement makes it sharper.)
**Warning sign:** any mention of `—`, `–`, or `--` in the scan's rule list.

### Pitfall 4: a scan whose `\uXXXX` rule is not comment-scoped
**What goes wrong:** 8 false positives, five inside `packages/shared-config/eslint.config.mjs:164-174`
(`'^\\u0000'` import-sort regexes) that an over-eager fix would corrupt, breaking lint repo-wide.
**Avoid:** the escape rule runs **only** inside a classified comment span, same as rule 1.
**Warning sign:** the scan implemented as a `git grep` rather than over the tokenizer.

### Pitfall 5: deleting the exemplar's `:46-47` invariant, or its `:77` comment
**What goes wrong:** `:46-47` is a live CLAUDE.md invariant guarding the `const appSettings =
$derived(ctx.appSettings)` on the very next line — the destructure trap CLAUDE.md calls *"the single
most-repeated defect in this codebase's history"*. `:77` explains the `$effect`'s reactive reads and is
outside the disposition.
**Avoid:** D-A2 is explicit. Write the compressed replacement text **into the plan**, not into the executor's
discretion.
**Warning sign:** a task that says "delete :36-47".

### Pitfall 6: treating test-title renames as free
**What goes wrong:** titles are cited verbatim in `tests/e2e-runs/` registers and `.planning/` records;
renaming one creates dangling citations. And CLAUDE.md's cardinal rule means any E2E disturbance blocks the
phase.
**Avoid:** separate task, separate gate, cross-check against the registers, full `yarn test:e2e` after.
`--grep-invert @probe` selects by tag not title, so selection itself is safe — but do not extend the renames
to `tests/playwright.config.ts` project names (§ 9.2).
**Warning sign:** test-title edits bundled into the same commit as comment edits.

### Pitfall 7: renaming `permLocalisationPositiveTemplate`'s *key* along with its identifier
**What goes wrong:** the key `'perm-localisation-positive'` is the `--template` CLI argument, a module
filename, and the stem of 10+ Playwright project names, `testMatch` regexes and setup/teardown names.
Renaming it is an E2E-suite-wide change.
**Avoid:** identifier only (5 sites). Record the deliberate mismatch in the audit.
**Warning sign:** a `sed` over `perm-localisation-positive`.

### Pitfall 8: the case-only rename on macOS
**What goes wrong:** `git config core.ignorecase` is `true` on this APFS volume; a single-step
`git mv SettingsOverlay.svelte.ts settingsOverlay.svelte.ts` can be a no-op or leave a confusing index state.
**Avoid:** the two-step `git mv` via a temporary name (§ 8.1), for both the module and its `.test.ts`.
**Warning sign:** `git status` showing no rename after the `mv`.

### Pitfall 9: believing a `hits + residue == total` balance proves correctness
**What goes wrong:** `SKILL.md:265` records it directly — *"Six artifacts in Phase 151 were self-consistent
and wrong"*, and `SKILL.md:314` records the outcome: *"The hygiene codemod left 38 broken comments in the test
tree, 28 in the routing surface and 6 in the [components]."*
**Avoid:** the balance is a completeness check, not a correctness one. Correctness comes from reading the
diff. Budget a review pass over the wave-1 mechanical diff before wave 2 starts.
**Warning sign:** a verification step whose only evidence is the arithmetic line.

---

## Code Examples

### The scan script skeleton — the house style, from all three existing guards

```js
#!/usr/bin/env node
/**
 * COMMENT HYGIENE GUARD (phase 152, requirement REVIEW-HYG-01).
 *
 * The incident this file exists for: <state it>.
 *
 * TWO rules, and only two. It has NO dash rule of any kind: 212 comment lines
 * use ` -- ` as a dash (two of them are ESLint disable-directive separators at
 * apps/frontend/src/hooks.server.ts:1 and hooks.ts:1, where a rewrite changes
 * the directive's PARSE) and 3,025 already use real em/en dashes. D-A5(b) and
 * D-A5(c) were both rejected. Adding a third rule here fails on 3,237 lines.
 *
 * Usage:
 *   node scripts/assert-comment-hygiene.mjs
 *   node scripts/assert-comment-hygiene.mjs --self-test
 *
 * Exit codes:
 *   0 - clean, or --self-test passed
 *   1 - at least one violation, or a named precondition failure
 */
import { readFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const SELF = 'scripts/assert-comment-hygiene.mjs';
const REPO_ROOT = path.resolve(fileURLToPath(import.meta.url), '..', '..');

function main() {
  let violations = 0;
  const violate = (message) => { violations++; console.error(`[ERROR] ${SELF}: ${message}`); };
  // … scan …
  console.log(`Comment hygiene guard (phase 152: REVIEW-HYG-01) — files: ${n}; ${violations} violation(s).`);
  process.exitCode = violations > 0 ? 1 : 0;
}
main();
```
`[VERIFIED: distilled from scripts/assert-a11y-scan-wiring.mjs:1-105 and scripts/assert-i18n-catalog-namespaces.mjs:1-70 + tail, both read this session]`

### The D-A4 predicate (research prototype — for measurement; the shipped version uses the codemod's classifier)

```js
// cl = ordered comment lines for one file: {i, indent, marker, content, spanId}
const TERM = /[.!?]\s*$/;                       // terminal punctuation
const LIST = /^\s*([-*•+>]|\d+[.)]|[a-z][.)]\s)/;
const TAG  = /^\s*@\w+/;
const RULE = /^\s*([/=*#_~-]{4,}|[-=]{3,})\s*$/;
const TABLE = /^\s*\|/;

for (let k = 0; k < cl.length; k++) {
  const cur = cl[k], nxt = cl[k + 1];
  if (!nxt) continue;
  if (nxt.i !== cur.i + 1) continue;            // physically adjacent
  if (nxt.spanId !== cur.spanId) continue;      // "continues the same comment span"
  if (nxt.indent !== cur.indent) continue;      // "at the same indent"
  if (!cur.content.trim() || !nxt.content.trim()) continue;
  if (TERM.test(cur.content)) continue;         // "ends without terminal punctuation"
  // committed exclusions (§ 1.4 disposition (b)) — WITHOUT these the guard is unkeepable:
  if (RULE.test(cur.content) || RULE.test(nxt.content)) continue;   // banner rules      (1,418)
  if (TAG.test(nxt.content)) continue;                              // JSDoc tag list      (429)
  if (TABLE.test(cur.content) || TABLE.test(nxt.content)) continue; // comment tables       (34)
  if (LIST.test(nxt.content)) continue;                             // list items        (1,258)
  if (/^\s{2,}/.test(nxt.content) && !/^\s{2,}/.test(cur.content)) continue; // hanging (567)
  violate(`${file}:${cur.i + 1} — forced line break inside a comment span.`);
}
```

### The curated UK word list used for § 9 (whole-word, over tokenized identifiers)

```js
// Deliberately EXCLUDES: analys* (analysis is US too), disc (discover/disconnect/discourse),
// axe (the a11y tool), labelled (aria-labelledby is a W3C attribute name).
const UK = [
  /^organis(e|ed|es|ing|ation|ations|ational)?$/, /^recognis(e|ed|es|ing|able)?$/,
  /^normalis(e|ed|es|ing|ation)?$/,  /^initialis(e|ed|es|ing|ation)?$/,
  /^serialis(e|ed|es|ing|ation)?$/,  /^authoris(e|ed|es|ing|ation)?$/,
  /^customis(e|ed|es|ing|ation)?$/,  /^optimis(e|ed|es|ing|ation)?$/,
  /^minimis(e|ed|es|ing)?$/,         /^maximis(e|ed|es|ing)?$/,
  /^categoris(e|ed|es|ing|ation)?$/, /^localis(e|ed|es|ing|ation|able)?$/,
  /^visualis(e|ed|es|ing|ation)?$/,  /^synchronis(e|ed|es|ing|ation)?$/,
  /^prioritis(e|ed|es|ing|ation)?$/, /^summaris(e|ed|es|ing)?$/,
  /^standardis(e|ed|es|ing|ation)?$/,/^utilis(e|ed|es|ing|ation)?$/,
  /^randomis(e|ed|es|ing|ation)?$/,  /^sanitis(e|ed|es|ing|ation)?$/,
  /^finalis(e|ed|es|ing)?$/,         /^analys(e|ed|es|ing|er)$/,
  /^colour(s|ed|ing|ful)?$/,         /^behaviour(s|al|ally)?$/,
  /^favourite(s)?$/, /^flavour(s|ed)?$/, /^honour(s|ed)?$/, /^labour(s|ed)?$/,
  /^neighbour(s|ing|hood)?$/, /^centre(s|d)?$/, /^metre(s)?$/, /^fibre(s)?$/,
  /^licence(s|d)?$/, /^defence(s)?$/, /^offence(s)?$/, /^practis(e|ed|es|ing)$/,
  /^programme(s|d)?$/, /^catalogue(s|d)?$/, /^dialogue(s)?$/, /^analogue(s)?$/,
  /^grey(s|ed|ish)?$/, /^cancell(ed|ing)$/, /^modell(ed|ing)$/, /^labell(ed|ing)$/,
  /^travell(ed|ing|er)$/, /^fulfil(s|ment)?$/, /^enrol(s|ment)?$/, /^skilful(ly)?$/,
  /^judgement(s)?$/, /^acknowledgement(s)?$/, /^whilst$/, /^amongst$/,
  /^artefact(s)?$/, /^storey(s)?$/, /^tyre(s)?$/, /^sceptic(al|ism)?$/,
  /^mould(s|ed|ing)?$/, /^cheque(s)?$/, /^manoeuvre(s|d)?$/, /^aeroplane(s)?$/
];
const splitIdent = (id) => id.replace(/([a-z0-9])([A-Z])/g, '$1 $2').replace(/[_$]/g, ' ').split(/\s+/);
```

### The chain-membership assertion (copy `b410d3a90`'s shape exactly)

```ts
it('keeps `yarn assert:comment-hygiene` a blocking link of lint:check', () => {
  // The invariant is MEMBERSHIP of the `&&` chain, not terminal position:
  // every link after it is equally aborted by a failure, so guards may be
  // appended freely. Asserting `endsWith` instead made this test fail the
  // moment Phase 147 appended its two scan guards (see b410d3a90).
  const links = ROOT_PACKAGE_JSON.scripts['lint:check'].split('&&').map((link) => link.trim());
  expect(links).toContain('yarn assert:comment-hygiene');
  expect(ROOT_PACKAGE_JSON.scripts['assert:comment-hygiene']).toBe(
    'node scripts/assert-comment-hygiene.mjs'
  );
});
```
`[VERIFIED: packages/dev-seed/tests/ciTypecheckGate.test.ts:69-88 at HEAD, read this session]`

---

## Project Constraints (from CLAUDE.md)

| Directive | Bearing on this phase |
|---|---|
| **E2E hard rule — a failing E2E test is a CARDINAL FAILURE.** No task may proceed or be marked done while any E2E test fails. No "known-flaky" exemption. A "did not run" test counts as a failure. | The sweep edits `tests/**` heavily (5,887 wrapped-prose lines + 169 reference spans + 32 residue test titles). **The phase gate is a full `yarn test:e2e`, not a subset.** CLAUDE.md: *"Prefer E2E for interim verification… run the whole suite."* |
| **E2E preflight** — Playwright global setup asserts the served app came from *this* checkout via `/@fs`; no skip flag. `FRONTEND_PORT` is the only escape hatch. | Execution prereq: exactly one fresh dev server on `:5173`, `strictPort` on. Matches the standing memory `project_e2e_execution_devserver_prereq`. |
| **Use TypeScript strictly — avoid `any`, prefer explicit types.** | ⚠ The new guard is `.mjs`, deliberately outside TS. `assert-unit-test-coverage.mjs:38-44` states the sanctioned exception verbatim (*"a guard that must run before anything is built cannot itself require a build"*). Quote it in the new script's docblock so the deviation is reviewed rather than repeated blindly. |
| **Localization** — all user-facing strings must support multiple locales. | Bounds § 9: `apps/docs/src/routes/+page.svelte:189` (`Fully localisable`) is rendered copy, not a symbol. Out of scope. |
| **Context Destructuring Rule (Svelte 5)** — `appSettings`, `dataRoot`, `locale` are reactive accessors and must NOT be destructured; `dataRoot` additionally must be read directly in the consuming tracking scope (the Spike-024 alias hole). | This is the invariant `(voters)/+layout.svelte:46-47` states. D-A2 keeps it precisely because CLAUDE.md carries it. The compressed rewrite must not weaken it. |
| **Svelte warning-accepted format** — `// svelte-warning: accepted — <rationale>` immediately above the triggering line. | Any such comment encountered in the sweep is *explaining the code in front of it* and is **in-format**: preserve it. Do not join it into a neighbouring span. |
| **Always check work against `.agents/code-review-checklist.md`.** | Applies to the wave-1 mechanical diff review (Pitfall 9). |
| **Never commit sensitive data.** | No bearing; noted for completeness. |
| **Skill routing** — `.claude/skills/ship-review-stack/` documents this repo's comment-hygiene codemod + residue-pass procedure. | Read before planning wave 1. § 5. |

---

## Runtime State Inventory

This is a rename/refactor phase, so the inventory is mandatory. The canonical question: *after every file in
the repo is updated, what runtime systems still have the old string cached, stored, or registered?*

| Category | Items found | Action required |
|---|---|---|
| **Stored data** | **None.** No renamed identifier or filename is a database key, collection name, external_id or seed value. `quatenaryChoices` / `describeOffence` / `offences` are file-local test bindings; `SettingsOverlay` / `EntityListWithControls.helpers` are module paths. `permLocalisationPositiveTemplate`'s *key* string `'perm-localisation-positive'` **is** a runtime `--template` value and seed `external_id` stem — which is exactly why § 9.2 keeps the key unrenamed. Verified: `git grep -n "SettingsOverlay\|EntityListWithControls\|quatenary\|describeOffence" -- apps/supabase packages/dev-seed/src/templates` → no data-bearing hit. | none |
| **Live service config** | **None.** No Supabase RLS policy, Edge Function name, storage bucket or app_settings row references any renamed symbol. Verified: `git grep -n "SettingsOverlay\|EntityListWithControls" -- apps/supabase` → no output. | none |
| **OS-registered state** | **None.** No launchd/systemd/Task Scheduler/pm2 registration in this repo names a renamed symbol. | none |
| **Secrets / env vars** | **None.** No `.env.example` key, CI secret name or `FRONTEND_PORT`-class variable references a renamed symbol. Verified: `git grep -n "SettingsOverlay\|EntityListWithControls\|quatenary" -- .env.example .github` → no output. | none |
| **Build artefacts / installed packages** | **Yes — three tracked `tsbuildinfo` files** (`apps/docs/tsconfig.tsbuildinfo`, `apps/frontend/tsconfig.tsbuildinfo`, `packages/supabase-types/tsconfig.tsbuildinfo`) plus the `.turbo/` local cache will hold the pre-rename module graph. **The case-only rename in § 8.1 is the specific hazard**: an incremental `tsc` on a case-insensitive filesystem can resolve the old casing from cache. Also `apps/frontend/.svelte-kit` and `apps/frontend/node_modules/.vite`. | After the renames land, run `yarn dev:clean` (wipes `.svelte-kit` + `node_modules/.vite`) and a **cache-busted** typecheck (`TURBO_FORCE=true npx turbo run typecheck --filter=@openvaa/frontend`) before trusting green. A cached green is a replayed verdict, not evidence — the phrasing `packages/dev-seed/tests/template/strictRowTypes.type-test.ts:13` already uses. *(The three tracked `tsbuildinfo` files are themselves Phase 153's REVIEW-CFG-06; do not remove them here.)* |

Additionally, in the **agent** runtime rather than the machine one: `.planning/` records, `tests/e2e-runs/`
registers and `.claude/skills/spike-findings-…/sources/006-layout-overlay-rune/**` cite
`SettingsOverlay.svelte.ts` and several soon-to-be-renamed test titles. All are out of scope (D-15 exempt
trees / historical records), but the **test-title** renames in § 6 can leave dangling citations in
`tests/e2e-runs/` — check before renaming, per Pitfall 6.

---

## Environment Availability

| Dependency | Required by | Available | Version | Fallback |
|---|---|---|---|---|
| Node | every guard + codemod | ✓ | v24.14.1 | — |
| yarn (Berry) | all gates | ✓ | 4.x (workspaces resolve) | — |
| prettier | `format:check`; verified not to reflow comments | ✓ | catalog `^3.7.4` | — |
| vitest | the chain-membership spec + `test:unit` | ✓ | catalog `^3.2.4` | — |
| eslint | `lint:check` | ✓ | catalog `^9.39.2` | — |
| turbo | `build` / `typecheck` / `test:unit` | ✓ | `^2.8.17` | — |
| git | the renames; `--force` case handling | ✓ | 2.50.1 (Apple Git-155) | two-step `git mv` (recommended regardless) |
| python3 | only used by my prettier probe | ✓ | — | not needed by the phase |
| `hygiene-codemod.mjs` | the mechanical stage | ✓ **in-repo, self-test green** | Phase 151 | none needed |
| `hygiene-grep-report.sh` | the before/after gate | ✓ **in-repo, runs clean** | Phase 151 | none needed |
| Supabase CLI + Docker | the phase-gate E2E run only | not probed | — | E2E is the executor's step; see `project_gsd_e2e_disk_sinks` — ENOSPC voids full-suite runs |

**Missing dependencies with no fallback:** none.
**Missing dependencies with fallback:** none.
**Not probed (deliberately):** the Supabase/Docker stack. The brief forbids running the gates; the executor
must confirm disk headroom before the phase-gate E2E run (standing memory: ~52 GiB reclaimable `Docker.raw`
bloat has voided full-suite runs in this worktree).

---

## Validation Architecture

`.planning/config.json` has no `workflow.nyquist_validation` key → treated as enabled.

### Test Framework

| Property | Value |
|---|---|
| Unit framework | vitest `^3.2.4` (root catalog) |
| E2E framework | Playwright (`@playwright/test`, catalog) |
| Config files | root `vitest.config.ts` (packages), `apps/frontend/vitest.config.ts`, per-package `vitest.config.ts`; `tests/playwright.config.ts` |
| Quick run (this phase) | `yarn workspace @openvaa/dev-seed test:unit` — the chain spec lives here |
| Targeted run | `yarn workspace @openvaa/data test:unit` (renames) · `yarn workspace @openvaa/frontend test:unit` (renames) |
| Full unit suite | `yarn test:unit` (= `yarn assert:unit-coverage && turbo run test:unit`) |
| Guard-only | `node scripts/assert-comment-hygiene.mjs` · `… --self-test` |
| Phase gate | `yarn lint:check` **then** `yarn test:e2e` (full suite, CLAUDE.md cardinal rule) |

### Phase Requirements → Test Map

| Req | Behaviour | Type | Automated command | File exists? |
|---|---|---|---|---|
| REVIEW-HYG-01 | Scan finds zero forced line breaks + zero comment escapes | guard | `node scripts/assert-comment-hygiene.mjs` | ❌ **Wave 0** |
| REVIEW-HYG-01 | Scan's own rules are correct on known inputs | unit (fixtures) | `node scripts/assert-comment-hygiene.mjs --self-test` | ❌ **Wave 0** |
| REVIEW-HYG-01 | Scan is a blocking link of `lint:check` | unit | `yarn workspace @openvaa/dev-seed test:unit -t 'assert:comment-hygiene'` | ⚠ **extend** `packages/dev-seed/tests/ciTypecheckGate.test.ts` |
| REVIEW-HYG-01 | Guard **catches** a reintroduction (HYG1-OLD/NEW) | manual negative control | re-wrap `apiRouteAdapter.ts:13`; `yarn lint:check` exits 1 naming the site; revert; exits 0 | ❌ **Wave 4**, record in SUMMARY |
| REVIEW-HYG-02 | No planning reference survives in the three trees | guard | `bash <phase>/scripts/hygiene-grep-report.sh --assert-clean` **retargeted to `occ = 0` on `phase-ref`/`spike-ref`** | ⚠ **retarget** (§ 4.3) |
| REVIEW-HYG-02 | The sweep changed no program behaviour | residue pass | `node <phase>/scripts/hygiene-codemod.mjs --residue-out <p>` then review all `not-a-comment-span` rows (**98**) | ✓ mechanism exists |
| REVIEW-HYG-02 | Exemplar matches D-A2 line for line | manual read | diff `(voters)/+layout.svelte` against § 7's table | manual-only — a line-exact prose disposition has no automatable oracle |
| REVIEW-HYG-03 | No dangling reference after the renames | typecheck | `TURBO_FORCE=true npx turbo run typecheck` | ✓ existing |
| REVIEW-HYG-03 | Renamed specs still run and pass | unit | `yarn test:unit` | ✓ existing |
| REVIEW-HYG-03 | Build green | build | `yarn build` | ✓ existing |
| REVIEW-HYG-04 | Audit exists and is committed | artefact check | `test -f .planning/phases/152-…/152-SPELLING-AUDIT.md` | ❌ **Wave 1** |
| REVIEW-HYG-04 | No UK identifier remains | script | `node <phase>/scripts/uk-identifier-audit.mjs` → 0 in-scope hits | ❌ **Wave 0** (promote the § 9 prototype to a committed script so the audit is a re-run, not a re-derivation) |
| all | E2E cardinal gate | e2e | `yarn test:e2e` | ✓ existing |

### Sampling Rate

- **Per task commit:** `node scripts/assert-comment-hygiene.mjs` (once it exists) + the workspace-scoped
  `test:unit` for any workspace touched.
- **Per wave merge:** `yarn lint:check` + `yarn test:unit`.
- **Phase gate:** `yarn build` → `yarn lint:check` → `yarn test:unit` → full `yarn test:e2e` green, after
  `yarn db:reset` and one fresh dev server.

### Wave 0 Gaps

- [ ] `scripts/assert-comment-hygiene.mjs` — REVIEW-HYG-01, with a `--self-test` and committed fixtures for
      `.ts` / `.svelte` / `.sql` / `.sh` (mirror `hygiene-codemod.mjs`'s fixture layout).
- [ ] `.planning/phases/152-…/scripts/hygiene-codemod.mjs` — the retargeted copy (rule 6 inverted, scope
      narrowed, fixtures extended for the changed rule).
- [ ] `.planning/phases/152-…/scripts/hygiene-grep-report.sh` — the retargeted gate (`occ = 0`).
- [ ] `.planning/phases/152-…/scripts/uk-identifier-audit.mjs` — REVIEW-HYG-04, promoted from § 9's prototype.
- [ ] Extend `packages/dev-seed/tests/ciTypecheckGate.test.ts` with the chain-membership assertion.
- [ ] `.planning/phases/152-…/152-SPELLING-AUDIT.md` — the committed audit artefact.
- Framework install: **none needed** — vitest, Playwright, prettier, eslint and turbo are all present.

---

## Security Domain

`security_enforcement` is not set to `false` in `.planning/config.json`, so this section is included. This is
a comments-and-names phase with **no** new input surface, but three of the ASVS-relevant sites are ones the
sweep *touches*, and that is where the risk sits.

### Applicable ASVS Categories

| ASVS Category | Applies | Standard control / relevance here |
|---|---|---|
| V2 Authentication | no (no auth code changes) | but the sweep edits comments in `apps/supabase/supabase/functions/identity-callback/index.ts` — see below |
| V3 Session Management | no | — |
| V4 Access Control | no | — |
| V5 Input Validation | **indirectly** | `Input.svelte:317-318` (§ 10.3) documents the `validate_answer_value` RPC as the server-side validator. Deleting the comment does **not** remove the validation — the RPC is server-side — but the plan should say so explicitly so a reviewer does not read the deletion as removing a check. |
| V6 Cryptography | no | — |
| V7 Error Handling & Logging | **yes** | `identity-callback/index.ts:249-251` is an error-disclosure comment: *"Logged, never returned … The claim-extraction message enumerates which configured claim names were present or missing, which discloses the provider's claim mapping to an unauthenticated caller."* That is a **live security invariant guarding the `console.error` on the next line**, not narrative. D-A1's rewrite-not-delete default applies with force. It is one of the 19 reviewed sites (`:255`, "Rem line breaks from comments") — **join the lines, keep every word of the meaning.** |
| V14 Configuration | **yes** | The two ESLint disable-directive lines in § 2.2 (`hooks.server.ts:1`, `hooks.ts:1`). A dash rule would change a lint-configuration parse. Covered by the hard constraint. |

### Known Threat Patterns for this change class

| Pattern | STRIDE | Standard mitigation |
|---|---|---|
| A "comment-only" codemod silently edits a runtime string (a `console.warn`, an error `message:`, a thrown text) | Tampering | Comment-span classifier + the residue pass; **98** declined non-comment-shaped lines reviewed by hand (criterion 5). Already the phase's design. |
| Deleting a comment that documents a **deliberate** security posture, so the next editor "fixes" it | Information Disclosure | The `identity-callback:249-251` case above. D-A1's rewrite-not-delete default is the mitigation; name this site explicitly in the plan as a keep-the-meaning rewrite. |
| A dash/whitespace normalisation altering an ESLint disable directive, silently disabling a rule | Tampering | § 2.2's hard constraint; two rules only, prohibition recorded in the script docblock. |
| A codemod widening its own path scope into `.claude/` / `.planning/` / `CLAUDE.md` | Tampering | Already mitigated **in code**, not by convention: `hygiene-codemod.mjs` hard exclusion (b) refuses those trees *whatever `--files` glob it is handed*. Preserve that guard in the retargeted copy. |
| A guard that reports green while violations remain | Repudiation | § 4.3's `bare` vs `occ` trap — the single highest-likelihood failure in this phase. Negative control (HYG1/HYG2) is the mitigation. |

---

## State of the Art

| Old approach | Current approach | When changed | Impact on this phase |
|---|---|---|---|
| Planning references *collapsed* to `see phase N` (D-14 survivor form) | Phase 152 removes them entirely (REVIEW-HYG-02) | v2.15, this phase | 642 lines are in the collapsed form; the Phase-151 gate calls that green. § 4.3. |
| `lint:check` asserted by `endsWith('&& yarn typecheck')` | asserted by **chain membership** | `b410d3a90`, 2026-08-28 | The new guard's wiring assertion must use membership. § 3.4. |
| One-off `node -e` verification at plan close | standing vitest specs + committed `assert-*.mjs` guards | Phases 141/144/147 | The whole shape of REVIEW-HYG-01. |
| `dev:*` / `supabase:*` script aliases | `db:*` (database only) / `dev:*` (full stack) | v2.10 close | Use `yarn db:reset` + `yarn dev`, never removed aliases. |
| `appSettings` / `dataRoot` / `locale` as `{ current }` handles | bare reactive accessors | v2.13 Phase 113 | The exemplar's `:46-47` invariant. `.current` reads no longer exist on these three. |

**Deprecated / outdated in the phase's own inputs:**
- `152-CONTEXT.md` `<open>` 1 (*"REVIEW-HYG-01..04 are not defined anywhere"*) — **stale**; they are at
  `.planning/REQUIREMENTS.md:88-91`.
- `152-CONTEXT.md` `<open>` 5 (*"the shared `152-DISCUSSION-LOG.md` has not been written"*) — **stale**; it
  exists.
- Phase 151's "126 non-comment-shaped lines" — now **98**.
- `.github/workflows/main.yaml:70-79`'s *"as its last link"* — false since `b410d3a90`. Out of scope; file to
  `.planning/todos/pending/` (D-N2).

---

## Assumptions Log

| # | Claim | Section | Risk if wrong |
|---|---|---|---|
| A1 | The reviewer's *"remove line breaks from multiline comments everywhere"* means un-wrap hand-wrapped prose, not something narrower. Inferred from six cited sites, all of which are plain wrapped paragraphs; the reviewer was not asked. | § 1.2 | If wrong in the narrow direction, disposition (c) is right and the sweep is 2,400 lines rather than 14,094. **This is the one assumption worth putting to the operator before planning locks.** |
| A2 | Terminal punctuation means `. ! ?`. D-A4 does not enumerate the set. | § 1.1 | Including `:` and `;` moves the count from 17,800 → 15,101 (strict → loose). Does not change the phase's shape; does change the exact zero-target. |
| A3 | Wall-clock durations of `yarn build` / `test:unit` / `lint:check` are not stated because I did not run them. | § 8.4 | A plan that budgets wall-clock from my figures would be budgeting from nothing. Executor measures and records. |
| A4 | Renaming a vitest `describe`/`it` title is program-visible but suite-selection-safe, because `test:e2e` greps by tag (`@probe`), not title. Verified for Playwright; **not** verified for any vitest `-t` usage in CI. | § 6 | A CI step selecting vitest tests by `-t '<title>'` would break. `grep -n "test:unit" .github/workflows/main.yaml` shows plain `yarn test:unit` with no `-t`, so the risk is low — but confirm before the title-rename task. |
| A5 | `yarn dev:clean` + `TURBO_FORCE` typecheck is sufficient to clear stale case-insensitive module resolution after the § 8.1 rename. Reasoned from the caches enumerated, not observed. | Runtime State Inventory | A stale cached green on the case-only rename. Cheap to falsify: rename, force-typecheck, and confirm the new casing appears in the emitted `tsbuildinfo`. |
| A6 | `.claude/skills/spike-findings-…/sources/006-layout-overlay-rune/**`'s 7 `SettingsOverlay` references are a historical spike record and need no update. Based on the D-15 exemption and the directory name, not on a decision. | § 8.1 | A stale pointer in an agent-facing skill. Low cost; if the operator disagrees it is a 7-line edit. |

---

## Open Questions

1. **§ 1.4 — which D-A4 disposition?** *(blocks planning; the only one that does)*
   - **Known:** the literal definition covers 14,094 lines / 5,550 paragraphs / 747 files; 4,437 paragraphs
     (80%) join to over 120 chars; prettier will not reflow them; there is no `max-len` rule to stop them;
     the reviewer's six cited sites are all in this class; disposition (d) is pre-rejected by D-N1(c).
   - **Unclear:** whether the operator, having never seen the 14,094 figure, still wants criterion 1's
     literal zero, or whether disposition (c)'s "gratuitous break only" (~2,400 lines) is the real intent.
   - **Recommendation:** put the number to the operator as a § A-shaped decision with (a)/(b)/(c) and their
     costs, before the plan locks. Plan for **(b)** in the meantime — the structural exclusion set it
     requires is needed under (a) too, so no work is wasted either way.

2. **§ 10.1 — scope the terse-name rename in, or file it?**
   - **Known:** 13 occurrences, 1 file, zero external references, rename targets supplied by the adjacent
     prop names. It is one of the 19 reviewed comments in a naming phase.
   - **Unclear:** whether the operator regards criterion 3's three-rename list as closed.
   - **Recommendation:** scope it in (wave 1). If the planner disagrees, file to `.planning/todos/pending/`
     per D-N2 with the measured blast radius attached, so it is a decision rather than an omission.

3. **§ 8.3 — `singleChoiceCategoricalQuestion.test.ts` is unmentioned everywhere.**
   - **Known:** it carries `quatenaryChoices` at `:19,34,36`; file-local; same directory; same `binaryChoices`
     anchor at `:15`.
   - **Unclear:** nothing, really — it looks like an oversight in the original triage.
   - **Recommendation:** include it. Note the widening in the plan so the verifier does not flag a rename
     that no requirement text names.

4. **§ 9.2 — `permLocalisationPositiveTemplate`: rename the identifier alone, or leave it?**
   - **Known:** the identifier is 5 sites in 2 files; its *key* string is the `--template` argument, a
     filename, and the stem of 10+ Playwright project names.
   - **Unclear:** whether an identifier/key spelling mismatch is worse than the UK spelling.
   - **Recommendation:** rename the identifier; record the key family as out of scope with the reason. Either
     way the committed audit must say which was chosen and why (criterion 4's whole point).

5. **§ 6 — test titles: criterion 5 says decline, review comment #4 says rename.**
   - **Known:** 98 residue rows, ~23 anchored `describe`/`it` titles in 20 files; Playwright selects by tag;
     `tests/e2e-runs/` registers cite titles verbatim.
   - **Recommendation:** codemod declines (preserving criterion 5's proof); a separate wave-2 task renames
     them with its own register cross-check and a full E2E run. Confirm with the operator that criterion 5's
     "declined = out of scope" phrasing is about the *codemod*, not about the *phase*.

6. **§ 5 — where do the retargeted scripts live?** Phase 151's copies are in `.claude/skills/` (a skill), and
   their `Usage:` blocks still point at `.planning/phases/151-…/scripts/`. Phase 152 needs its own copies.
   Recommend `.planning/phases/152-comment-naming-hygiene-sweep/scripts/` for the one-shot codemod and report
   (they are phase instruments), and `scripts/assert-comment-hygiene.mjs` at repo root for the standing guard
   (it is shipped tooling, wired into `lint:check`). Only the latter is a permanent repo artefact.

---

## Sources

### Primary (HIGH confidence) — measured or read on this tree, this session

- `git ls-files` / `git grep` / `git show b410d3a90` — all counts, all site enumerations
- `.claude/skills/ship-review-stack/SKILL.md` (377 lines), `sources/hygiene-codemod.mjs` (935),
  `sources/hygiene-grep-report.sh` (229) — read; both scripts **executed** (self-test, dry-run, report mode)
- `scripts/assert-unit-test-coverage.mjs`, `assert-i18n-catalog-namespaces.mjs`, `assert-a11y-scan-wiring.mjs`
- `packages/dev-seed/tests/ciTypecheckGate.test.ts`
- `package.json`, `prettier.config.mjs`, `packages/shared-config/prettier.config.mjs`, `.editorconfig`,
  `.github/workflows/main.yaml`, `.planning/config.json`
- `apps/frontend/src/routes/(voters)/+layout.svelte:30-125`;
  `.../entityCard/EntityCard.svelte:112-190`; `.../entityCardAction/EntityCardAction.svelte:1-20`;
  `.../input/Input.svelte:40-58,308-325`;
  `.../supabase/dataProvider/supabaseDataProvider.ts:352-375`; `.../dataWriter/supabaseDataWriter.ts:78-108`;
  `.../apiRoute/apiRouteAdapter.ts:1-22`; `packages/dev-seed/src/cli/resolve-template.ts:55-78`;
  `packages/data/src/objects/questions/variants/{multiple,single}ChoiceCategoricalQuestion.test.ts`;
  `packages/data/src/utils/formatAnswer.ts:1-14`; `packages/filters/**` cited sites;
  `apps/supabase/supabase/functions/identity-callback/index.ts:248-262`
- `prettier --stdin-filepath` executed against the repo's installed binary — the no-reflow proof
- `.planning/{REQUIREMENTS.md,ROADMAP.md,STATE.md,PRE-SHIP-REVIEW-TRIAGE.md}` and both Phase-152 context docs
- `git config core.ignorecase` → `true`; `diskutil info /` → APFS; `git --version` → 2.50.1

### Secondary (MEDIUM confidence)

- `.planning/STATE.md:57-71` — the `AX1-OLD`/`AX1-NEW` flip pattern (read as a record of a prior phase, not
  re-executed)
- `CLAUDE.md` — project constraints, taken as authoritative-by-instruction

### Tertiary (LOW confidence)

- None. No web search, no external documentation, and no package was recommended, so no
  `## Package Legitimacy Audit` section is required — **this phase installs no external packages.** Every tool
  it needs (Node built-ins, vitest, prettier, eslint, turbo, git) is already a declared dependency.

---

## Metadata

**Confidence breakdown:**

| Area | Level | Reason |
|---|---|---|
| Counts and site enumerations | **HIGH** | Every figure produced by a command run against this tree this session, with the command printed beside it. Where two methods disagree (my 888 vs the repo's 946 occurrences) both are reported with the unit that distinguishes them. |
| The D-A4 class size and its category breakdown | **HIGH** for the measurement; **MEDIUM** for the *interpretation* | The 14,094 is measured. Whether the operator wants all 14,094 swept is Open Question 1 (assumption A1). |
| Reusability of the Phase-151 codemod | **HIGH** | Executed: `--self-test` 4/4 green, dry-run produced a full residue report, `git status` unchanged after. |
| The `bare` vs `occ` gate trap | **HIGH** | Read in the script's own header and confirmed by its output (`phase-ref occ 744 / bare 102`). |
| The exemplar's line numbers | **HIGH** | Read at HEAD `22c2542e3`; every extent quoted verbatim. |
| Renames and their reference sets | **HIGH** | Exhaustive `git grep`; the `singleChoiceCategoricalQuestion.test.ts` finding is a direct grep result. |
| UK/US audit | **HIGH** for the hit set; **MEDIUM** for completeness | 62 curated stems is a good list but not an exhaustive one. Committing the list (Wave 0 gap) is what makes the next audit a re-run rather than a re-derivation. |
| Gate wall-clock times | **not assessed** | Deliberately: running them was out of brief. Assumption A3. |

**Research date:** 2026-08-28
**Measured at:** HEAD `22c2542e3` (note: `152-CONTEXT.md` was written against `bff94f382`; five commits have
landed since, none touching the measured surface)
**Valid until:** ~7 days, or the moment any of phases 153-164 lands — 63% of their cited files are inside this
phase's touch surface, so every count above drifts as they execute. Re-run the commands rather than trusting
the numbers if this document is more than a week old.
