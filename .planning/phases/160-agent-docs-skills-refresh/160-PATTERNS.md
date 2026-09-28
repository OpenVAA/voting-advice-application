# Phase 160: Agent Docs & Skills Refresh - Pattern Map

**Mapped:** 2026-08-28
**Files analyzed:** 14 created/modified (+2 deletions)
**Analogs found:** 13 / 14

> **This phase's artifacts are Markdown, YAML frontmatter and shell — not application code.** The
> "role / data flow" classification below is adapted accordingly: *role* is the document genre
> (reference-map, procedure-list, routing-index, decision-record, hygiene-script, generator), and
> *data flow* is how the content stays true (hand-authored, derived-from-source, generated,
> relocated, pointer).
>
> **Every line:column citation below is a PLANNING-TIME reading at HEAD `db220cb5f`.** Phases 152–159
> land first. Re-verify each anchor at execution time (RESEARCH.md § *152–159 coupling map*).

## File Classification

| New/Modified File | Role | Data flow | Closest Analog | Match |
|---|---|---|---|---|
| `.claude/skills/data/object-model.md` (§ Key Relationships, +3 bullets) | reference-map | hand-authored | its own neighbouring bullets, `:134-142` | exact (self) |
| `.claude/skills/database/extension-patterns.md` (new step 14 + tail note) | procedure-list | hand-authored | `:69-75` numbered steps; `:184-190` tail list | exact (self) |
| `.claude/skills/filters/extension-patterns.md` (new step 7 + tail note) | procedure-list | hand-authored | `:48-56` step 6; `:106-112` tail list | exact (self) |
| `.claude/skills/data/extension-patterns.md` (tail note) | procedure-list | hand-authored | `data/extension-patterns.md:155-166` | exact (self) |
| `.claude/skills/matching/extension-patterns.md` (tail note) | procedure-list | hand-authored | `matching/extension-patterns.md:88-98` | exact (self) |
| `.claude/skills/components/SKILL.md` (frontmatter rewrite + `targets:` + body) | skill root / routing-index | derived-from-source (drift-guarded) | `.claude/skills/data/SKILL.md:1-7` | exact |
| `.claude/skills/components/context-reactivity.md` **(new)** | normative essay | relocated from `CLAUDE.md:327-378` | `.claude/skills/data/object-model.md` (a `SKILL.md`-adjacent concrete resource file) | role-match |
| `.claude/skills/components/component-listing.md` **(new, only if D-I3 option B/C)** | listing | generated | `apps/docs/.../generated/+page.md` + `generate-component-docs.ts:217-279` | exact |
| `.claude/skills/README.md` **(new — the decision record)** | decision-record | hand-authored, dated | **`packages/README.md`** | exact |
| `CLAUDE.md` § Skill Routing (`:419-424`) | routing-index | pointer | its own current entry, `:421-424` | exact (self) |
| `CLAUDE.md` body trim + pointer to the relocated essay | pointer | pointer | `CLAUDE.md` § *Canonical package paradigm* → `packages/README.md` | exact |
| `.claude/skills/BOUNDARIES.md` (14 rows) | ownership-map | hand-authored table | its own live rows, `:9-14`, `:50-56` | exact (self) |
| `.claude/scripts/audit-skill-links.sh` **(new link/path-integrity checker)** | hygiene-script | derived-from-source | **`.claude/scripts/audit-skill-drift.sh`** (bash) / `scripts/assert-a11y-scan-wiring.mjs` (node) | exact |
| `.planning/todos/pending/*.md` (D-N2 filings) | todo | hand-authored | existing `.planning/todos/pending/2026-08-28-claude-md-stale-factual-claims.md` | exact |

---

## Pattern Assignments

### `.claude/skills/data/object-model.md` — the three additions (REVIEW-DOC-01)

**Analog:** the file's own `## Key Relationships` list. **House style = one line per relationship,
`**Term:**` bolded prefix, consequence after the colon, no paragraphs.**

**Register to imitate** (`:134-142`, verbatim):

```markdown
## Key Relationships

- **Election -> ConstituencyGroup(s) -> Constituency(ies):** Elections have constituency groups; each group contains constituencies the voter chooses from.
- **Constituency -> parentConstituency:** Optional nesting for multi-level elections (e.g., regional + municipal).
- **Nomination links Entity + Election + Constituency:** A Nomination represents an entity nominated in a specific election-constituency pair.
- **CandidateNomination -> Candidate:** Links to the nominated person.
- **OrganizationNomination -> Organization:** Links to the party/association; may contain CandidateNominations and FactionNominations as children.
```

**Source-citation pattern used elsewhere in the same file** — a bare `Source:` line under the heading,
never an inline footnote:

```markdown
## Question Category Types

Source: `objects/questions/category/questionCategoryTypes.ts`
```

**Copy this for the additions:** the two selection-semantics rules are **not** model-enforced
(RESEARCH.md A2). Keep them bullet-shaped in the same register, but do not write a `Source:` path
that implies enforcement — attribute them as selection semantics. A three-paragraph explanation is an
anti-pattern here (RESEARCH.md § *Anti-pattern to avoid in the wording*).

**Anti-pattern in the corpus to avoid:** the `-> ` ASCII arrow and `--` em-dash substitute are the
house convention in this file; do not introduce `→` / `—` into `object-model.md` (they are used in
`CLAUDE.md` and `ship-review-stack`, not here).

---

### The four `extension-patterns.md` — the missing steps (REVIEW-DOC-02)

**Analog A — a numbered step with a named entry point** (`database/extension-patterns.md:60-75`):

```markdown
10. **Update COLUMN_MAP** `packages/supabase-types/src/column-map.ts` (repo root relative)
    - Add entries for any columns where snake_case differs from desired camelCase property name
    - Pattern: follow existing COLUMN_MAP entries (e.g., sort_order -> 'order', custom_data -> 'customData')

12. **Add test data** `tests/database/00-helpers.test.sql`
    - Add a `test_id` entry for the new entity in the predictable UUID constants section
    ...
    - Pattern: follow existing entity insertions in create_test_data()

13. **Write pgTAP tests** (see "Adding pgTAP Tests" guide below)
```

Shape to copy verbatim for the **new step 14 (dev-seed)** and **new step 7 (E2E filter)**:
`N. **<Imperative verb phrase>** \`<path>\`` on the step line, then indented `- ` sub-bullets, the
last of which is a `- Pattern: follow existing <thing> in <file>` pointer. **Every step in all four
files ends with that `Pattern:` pointer** — it is the corpus's strongest convention and is exactly
what RESEARCH.md asks for (name the fixture and the journey spec, not "add an E2E test").

Concrete pointers to put in the two new steps:
- dev-seed: `packages/dev-seed/src/templates/index.ts` (registry) + `packages/dev-seed/README.md`
  § *Template shape reference* — **not** "update all 40 templates".
- E2E filter: `tests/tests/fixtures/voter/entityFilters.fixture.ts` (`createEntityFilters(page)`) +
  `tests/tests/specs/voter/voter-journey.spec.ts:611`.

**Analog B — the uniform tail list** (`data/extension-patterns.md:155-166`, and identically shaped at
`database:184`, `filters:106`, `matching:88`):

```markdown
## Verification After Extension

After completing any extension, verify:

1. `cd packages/data && yarn test:unit` -- all existing tests pass (no regressions)
2. New test file passes with expected assertions
...
8. If new entity: verify `DataRoot` collection getter returns instances sorted by `order` property
```

**Copy this shape for the "re-check the skill afterwards" note:** append it as the **final numbered
item** of each of the four lists, phrased identically across the four. Two sub-conventions to match:
items are either a backticked command followed by ` -- <what passing means>`, or a bare
`Check that …` / `If <condition>: verify …` sentence. The note is the second kind.

**Rationale text to carry** (RESEARCH.md Pitfall 2, measured): the `database` skill currently cites
**15 dangling schema filenames in 51 places** because nobody re-checked it after the `0NN-` → banded
`NNN-` renumbering. Cite the count; do **not** fix the 51 here (Phase 156 churns the same files).

**Scope decision the analog supports:** `ship-review-stack` has no `extension-patterns.md` and
`BOUNDARIES.md:23-27` states *"Process skills own no source directory."* — exclude it, record the
reason. The grown `components` skill gets the note.

---

### `.claude/skills/components/SKILL.md` — frontmatter (F7) + `targets:` (D-I3 option D)

**Analog:** `.claude/skills/data/SKILL.md:1-7` — the only skill whose frontmatter is *both* correct
and minimal.

```yaml
---
name: data
description: 'Domain expert for the @openvaa/data package -- the universal data model for Voting Advice Applications. Understands the DataRoot/DataObject hierarchy, entity variants (Candidate, Organization, Alliance, Faction), question types and their matching interfaces, nomination system, smart defaults, and MISSING_VALUE conventions. Activate when working in packages/data/, extending data models, adding entity or question types, reviewing data package changes, or understanding how VAA data objects connect to matching and filters.'
targets:
  - packages/data/src/
---
```

Description grammar, invariant across all five populated skills: single-quoted one-liner,
`Domain expert for <X>. Understands <comma list>. Activate when <comma list of triggers>.`
The `Activate when` clause is the routing layer under D-I1's asserted rule — it is what must gain the
destructure-trap / `dataRoot` triggers so an agent lands here in one hop.

**Multi-target example, verbatim** (`.claude/skills/database/SKILL.md:4-7`):

```yaml
targets:
  - apps/supabase/
  - packages/supabase-types/
```

**Exact shape `audit-skill-drift.sh` parses** — read from source, `:27-50`:

- Frontmatter is delimited by two bare `---` lines; parsing stops at the second.
- `^targets:` (column 0, no leading space) opens the list.
- **An inline `[]` on the `targets:` line breaks parse immediately (`:37-39`)** → `SKIP  (no targets defined)`.
  This is `components`' and `architect`'s current state.
- Each entry must match `^[[:space:]]+-[[:space:]]+(.*)` — i.e. `  - path`. The first non-matching
  line ends the list, so `targets:` must be the **last** frontmatter key or be followed only by its items.
- Paths are **repo-root-relative**.

> ⚠ **`targets:` entries MUST be DIRECTORIES.** `audit-skill-drift.sh:79-82`:
> ```bash
> for target in "${targets[@]}"; do
>   if [[ ! -d "$target" ]]; then
>     target_details+="    $target  (directory not found)\n"
>     continue
> ```
> A file target is silently skipped and the skill scores **OK forever** — an inert audit. Recorded at
> `.planning/STATE.md:971` (151-19). Assert `[ -d "$t" ]` for each new target before committing.

Proposed `components` targets (all three verified to exist):

```yaml
targets:
  - apps/frontend/src/lib/components
  - apps/frontend/src/lib/dynamic-components
  - apps/frontend/src/lib/candidate/components
```

**Record as a deliberate choice:** `audit-skill-drift.sh:130-135` `exit 1`s on drift, so this is a
red-by-default posture on the next commit to any component directory (churn measured at 2/3/2 commits
per 90 days — in line with the four skills that already carry targets).

---

### `.claude/skills/components/` body — receiving the relocated essay (D-I2)

**Analog for the SKILL.md → concrete-resource-file split** (`data/`): `SKILL.md` carries frontmatter
+ `## Package Purpose` + `## Conventions` (numbered, each an imperative with a `NEVER`/`ALWAYS`
clause), and points **directly** at `object-model.md` and `extension-patterns.md` — one hop, no index.
Mirror that exactly: `components/SKILL.md` → `context-reactivity.md` (+ `component-listing.md`).

**`## Conventions` register to imitate** (`data/SKILL.md:24-46`) — numbered, bolded lead-in, `NEVER`
in caps, with the historical incident cited inline as justification:

```markdown
3. **Type guards over instanceof**: NEVER use `instanceof` for `DataObject` type checking. Use
   `isEntity()`, `isQuestion()`, ... from `packages/data/src/utils/typeGuards.ts`. Historical
   `instanceof` bugs (commit 87efe19a) caused cross-module-boundary failures.
```

This is the *same rhetorical shape* as the essay being relocated (rule → mechanism → incident that
proves it), so the move is a register-preserving one.

**Source of the relocated text:** `CLAUDE.md:327-378` (52 lines, 12.3% of the file). Move verbatim,
then repair its anchors. The five load-bearing components that must survive (RESEARCH.md § *How to
prove no weakening*): the two-class taxonomy + ~25-name accessor list (`:337`); the "invokes the
getter ONCE at component-init time" mechanism (`:345`); the Phase-113 reclassification of
`appSettings`/`dataRoot`/`locale` (`:354,:361,:367`); the Spike-024 carve-out incl. *"never bind
`dataRoot` to an intermediate read alias"* (`:369-373`); the four external references (`:365`, `:375`).

> ⚠ **Two of the essay's three code anchors are already wrong** (RESEARCH.md Pitfall 1).
> `CLAUDE.md:347` cites `…/results/+layout.svelte` — **the file does not exist**; the real path
> gained a `[[electionTab]]` segment. `:365` cites `candidateContext.svelte.ts:106-123` — the
> explanation is actually at `:61-66` and `:178-188`. Only `elections/+page.svelte:43-44` is correct.
> **Relocating verbatim carries both defects into the new home.** Anchor repair is a step inside the
> relocation task, executed after 159 lands.

---

### `CLAUDE.md` pointer sites — pointer half + destination half

**Analog #1 — the routing-section entry form** (`CLAUDE.md:419-424`, the shape to reuse for the
`components` pointer and the folded-in `architect` content):

```markdown
## Skill Routing

- **Spike findings for voting-advice-application-gsd** — two domains:
  - Svelte 5 rune migration (spikes 001–012): reactive context shapes, `runeLocalStorage` helper, …
  - Page navigation + View Transitions + a11y (spikes 013–016): SvelteKit already reuses …
    → `Skill("spike-findings-voting-advice-application-gsd")`
```

Shape: bolded label → one-or-two-line **discriminative** description (what questions land here) →
`→ \`Skill("<name>")\`` on its own indented last line. Three edits collide in these 6 lines
(D-I1 may remove the only entry; D-I2 adds `components`; D-I3 folds in `architect`) — **one task**.

**Analog #2 — the canonical "normative rule lives elsewhere, reached by a pointer" pair.** This is the
closest in-repo analog for relocating a long normative essay behind a one-hop pointer.

*Pointer half*, `CLAUDE.md` § *Architecture → Module Resolution & Dependencies*, verbatim:

```markdown
**Canonical package paradigm:** New `packages/<name>/` workspaces follow the shape of `@openvaa/core`
(lowest in the dep graph; tiebreaker per the canonical-paradigm doc). Same `package.json` scripts +
`exports`, `tsconfig.json` extends `@openvaa/shared-config/ts`, `tsup.config.ts`, flat `src/index.ts`
barrel, no `.js` extensions on TS-internal relative imports. See `packages/README.md` for the full
reference.
```

*Destination half*, `packages/README.md:1-5`:

```markdown
# OpenVAA packages — canonical paradigm

> **Reference for new package creation and existing-package paradigm checks.**

The OpenVAA monorepo contains four canonical packages that share a single, byte-equivalent paradigm.
```

**What to copy:** the pointer keeps a **compressed but complete statement of the rule** (enough that a
reader who never follows the link is not misled), names the destination by path, and ends with
`See <path> for the full reference.` The destination opens with an `H1` and a blockquote saying who it
is for. Reproduce both halves for the Svelte-context essay:
`CLAUDE.md` keeps ~4 lines (the two-class rule + "never destructure a reactive accessor" + "never bind
`dataRoot` to an intermediate read alias") and points at `.claude/skills/components/context-reactivity.md`.

---

### `.claude/skills/README.md` — the recorded decision (REVIEW-DOC-03 + REVIEW-DOC-04)

**Analog: `packages/README.md`.** It is the repo's one existing document that records *a decision
about a corpus, with its measurement, its justified exceptions, and a self-maintenance warning* —
exactly the four things criteria 3 and 4 demand. Structure to copy, section for section:

| `packages/README.md` section | Purpose | `.claude/skills/README.md` counterpart |
|---|---|---|
| H1 + `> **Reference for …**` blockquote | who this is for | same |
| `## Canonical packages` (numbered, with the tiebreaker named) | the inventory | `## The corpus` — the 42/464,728 · 26/288,325 · 16/176,403 · `CLAUDE.md` 26,149 table **with its commands** |
| `## Paradigm summary` (bulleted rules, each with an inline verification command) | the asserted rule | `## The one-level routing rule` + the disclosure conclusion |
| `## Justified divergences` (each exception, each with its reason) | the recorded judgements | `## Judgements` — the `spike-findings-*` keep/delete with its reasoning; the `architect` fold; what `CLAUDE.md` deliberately kept |
| `## Adding a new package` | forward-looking instruction | `## Adding a skill` |

**Verbatim excerpts showing the house style of a recorded decision.**

Rule stated with its own verification command inline (`packages/README.md`, § *Paradigm summary*):

```markdown
- **Import-path policy.** TS-internal relative imports do **not** carry `.js` extensions —
  `import { X } from './foo'`, never `import { X } from './foo.js'`. … (To verify:
  `grep -rEn "from ['\"]\.+/.*\.js['\"]" packages/{core,data,matching,filters}/src/` returns zero matches.)
```

An exception recorded with its reason, not just its existence:

```markdown
- **`@openvaa/dev-tools`** is `private: true`, has no `license`/`LICENSE`, and does not build: it is a
  maintainer-only CLI (key generation, PEM→JWK conversion) run through `tsx`, so `scripts.build` is a
  deliberate no-op, `tsconfig.json` sets `noEmit: true`, and there is no `module`/`types`/`exports`
  surface because nothing imports it.
```

The self-maintenance warning — **copy this sentence's spirit verbatim into the new README**:

```markdown
When you add or retire a package, update this list in the same commit — a stale list here is worse
than no list, because it reads as an assurance.
```

That single sentence is the same argument as criterion 2c's "re-check the skill afterwards" note, and
reusing its phrasing ties the two deliverables together.

**Why here and not a phase-local `160-DECISIONS.md`:** `.planning/` is not on `main` and is stripped
by `gsd-pr-branch`; `packages/README.md` is the precedent for "the decision lives with the corpus it
describes". A phase-local file, if written, is a pointer — not the record.

**Content the record must carry, per RESEARCH.md:**
- The measurement table + the exact `find`/`wc -c` commands (reproduces byte-for-byte at 2 HEADs).
- The below-threshold conclusion, **quoting `PRE-SHIP-REVIEW-TRIAGE.md:346`, not the papers** (A1).
- The one-level rule and its single live violation (`CLAUDE.md § Skill Routing → spike-findings/SKILL.md:149 § Feature Areas → references/*.md`).
- The `spike-findings-*` judgement — and **reject the git-history justification in favour of the
  in-tree one**: `.claude/skills/` has never existed on `main`, the repo squash-merges, so
  "available from git history" is false; the true reason the delete is safe is that
  `.planning/spikes/` (24 spikes, superset, holds Spike 024 which the skill lacks) stays in the tree.

---

### `.claude/skills/BOUNDARIES.md` — 14 rows

**Analog: its own live rows.** Three tables, each a different column set; match the one you are editing.

```markdown
## Directory Ownership

| Directory                                | Primary Skill   | Notes                                                         |
| ---------------------------------------- | --------------- | ------------------------------------------------------------- |
| `packages/data/`                         | data            | All source, tests, types for @openvaa/data                    |
| `frontend/src/lib/components/`           | components      | Base UI component library (deferred)                          |
```

```markdown
## Gray Zones

| Area | Contenders | Primary Owner | Resolution |
| Frontend contexts (voterContext, candidateContext) | architect, components | architect | Contexts are architecture; components consume them via getter functions |
```

Conventions to preserve: backticked trailing-slash directory paths in column 1; bare lowercase skill
names in the owner column; `--` for "none"; `(deferred)` markers removed as they are resolved; the
prose paragraph after the first table (`:23-27`, *"Process skills own no source directory."*) is the
model for any new narrative carve-out.

**Edits:** 8 `architect` rows (`:15`, `:19`, `:57-60`, `:81`, `:83`) — mandatory, since the skill they
point at will not exist; 5 dangling paths (`frontend/*` → `apps/frontend/*`, `backend/vaa-strapi/`
retired); `:64` `Svelte 4 component conventions` → Svelte 5 runes. Note `:15`/`:19`/`:57-60`'s
`architect` ownership must be re-homed, not deleted — `CLAUDE.md § Skill Routing` absorbs it (D-I3).

---

### `.claude/scripts/audit-skill-links.sh` (new) — the link/path-integrity checker

**Analog: `.claude/scripts/audit-skill-drift.sh`** — same directory, same audience, same CI-adjacent
role. A sibling script must match its argument handling, output format and exit convention.

**Header + argument contract** (`:1-11`, `:111-124`):

```bash
#!/usr/bin/env bash
# Audit skill drift: checks if source code targets have changed since a skill was last updated.
# Usage: .claude/scripts/audit-skill-drift.sh [skill-name]
# Without arguments, audits all skills.

set -euo pipefail

SKILLS_DIR=".claude/skills"
DRIFTED=0
CHECKED=0
SKIPPED=0
...
if [[ $# -gt 0 ]]; then
  skill_dir="$SKILLS_DIR/$1"
  if [[ ! -d "$skill_dir" ]]; then
    echo "Skill not found: $1"
    exit 1
  fi
  audit_skill "$skill_dir"
else
  for skill_dir in "$SKILLS_DIR"/*/; do
    [[ -d "$skill_dir" ]] && audit_skill "$skill_dir"
  done
fi
```

**Per-item output format** (`:54`, `:98`, `:101-102`) — fixed-width name column, uppercase verdict
token, parenthesised reason, indented detail lines only on failure:

```bash
printf "  %-14s  SKIP  (no targets defined)\n" "$skill_name"
printf "  %-14s  OK    (synced as of %s)\n" "$skill_name" "$skill_date"
printf "  %-14s  DRIFT  %d commits, %d files since %s\n" "$skill_name" "$total_commits" "$changed_files" "$skill_date"
printf "$target_details"   # "    <target>  (directory not found)\n"
```

**Banner + summary + exit convention** (`:106-135`):

```bash
echo ""
echo "Skill Drift Audit"
echo "================="
echo ""
...
echo ""
echo "---"
echo "Checked: $CHECKED  Drifted: $DRIFTED  Skipped: $SKIPPED"

if [[ "$DRIFTED" -gt 0 ]]; then
  echo ""
  echo "Drifted skills may contain outdated information."
  echo "Review target changes and update skill files as needed."
  exit 1
fi
```

Copy: shebang `#!/usr/bin/env bash`; a 3-line `# Usage:` docblock; `set -euo pipefail`; counter
globals; one `audit_<thing>()` function taking a dir; `<Title>` + `=====` banner; `---` +
`Checked: N  Drifted: N  Skipped: N` summary; a remediation sentence then `exit 1`; **implicit exit 0
on success** (no trailing `exit 0`).

**Secondary analog for the rationale docblock** — `scripts/assert-a11y-scan-wiring.mjs:1-45` is the
house style for a guard that must explain *the incident it exists for* and enumerate its checks
before any code. Its own note — *"matching the house style of `scripts/assert-unit-test-coverage.mjs`"* —
shows the corpus expects a new guard to name the sibling it imitates. Its failure reporter is the
model for actionable messages:

```js
  console.log(`A11y-scan wiring guard (phase 147: CSCAN-02, CSCAN-03) — ${violations} violation(s).`);
  process.exitCode = violations > 0 ? 1 : 0;
```

**Evidence to cite in the new script's docblock** (all measured): 15 dangling schema names in 51
places; one dangling `.svelte` path + one drifted line range in the relocated essay; 5 dangling
directory rows in `BOUNDARIES.md`; 6 broken script references.

> **Scope boundary to record:** the script lands in 160 (skill-hygiene tool, `.claude/scripts/`
> sibling); **wiring it into CI is Phase 163**. `.github/workflows/**` is out of scope for 160.

---

### The component listing — generator analog (D-I3)

**The repo's live generated-listing pattern** is `apps/docs/scripts/generate-component-docs.ts`.

Config-driven inputs and a single named output constant (`:1-11`):

```ts
#!/usr/bin/env tsx
/**
 * Extract @component docstrings from Svelte files and generate markdown documentation
 */
import { COMPONENT_DIRS, COPY_TARGETS, GENERATED_OUTPUT, GITHUB_BASE, REPO_ROOT } from './docs-scripts.config';

const OUTPUT_DIR = GENERATED_OUTPUT.components;
const TOC_FILE = path.join(OUTPUT_DIR, 'README.md');
```

The listing builder (`generateTableOfContents`, `:217-279`) — an array of lines, a self-describing
header, grouping by `COMPONENT_DIRS` order, alphabetical within group, and a `Total:` footer:

```ts
lines.push('# Component Documentation\n');
lines.push('This documentation is automatically generated from the `@component` docstrings in Svelte files.\n');
lines.push('## Components by Category\n');
...
lines.push(`- [${component.name}](${absoluteUrl})\n\n  \`import { ${component.name} } from '${component.importPath}';\`\n`);
...
lines.push('---\n');
lines.push(`Total: ${docs.length} components\n`);
```

```ts
main().catch((error) => {
  console.error('Error generating component documentation:', error);
  process.exit(1);
});
```

Rendered output form to match if anything is emitted into the skill
(`apps/docs/src/routes/(content)/developers-guide/frontend/components/generated/+page.md:1-11`):

```markdown
# Component Documentation

This documentation is automatically generated from the `@component` docstrings in Svelte files.

## Components by Category

### Static Components

- [AccordionSelect](/developers-guide/frontend/components/generated/components/accordionSelect/AccordionSelect)

  `import { AccordionSelect } from '$lib/components/accordionSelect';`
```

**If option C is taken**, the mechanism is a second `writeFile` alongside `TOC_FILE` — ~3 lines. The
cost is elsewhere: 6 broken script references (5 root `docs:*` + `apps/docs/package.json:22`'s
`extract-component-docs.ts`, which does not exist) and a CI job that is Phase 163's. RESEARCH.md
recommends **A + D** (link to the regenerated docs listing + populate `targets:`), with C filed as a
todo. **The header line above is what a linked-to listing already announces about itself — quoting it
in the skill is the cheapest honest form of the link.**

> The generator's `@component` match is multiline (`/<!--\s*@component\s*([\s\S]*?)-->/i`, `:118-129`).
> Any verification task must be multiline-aware — a line-oriented `grep` undercounts 102 → 7.

---

### `.planning/todos/pending/*.md` (D-N2 filings)

**Analog:** `.planning/todos/pending/2026-08-28-claude-md-stale-factual-claims.md` (already exists,
carries `resolves_phase: 160`). Filename form `YYYY-MM-DD-<kebab-slug>.md`; frontmatter with
`resolves_phase`; each item carries a **file:line anchor**, not prose.

Items to file: the 51 dangling schema citations (after 156); the 6 broken `docs:*` script references
(Phase 153); `glob` undeclared in `apps/docs/package.json`; the `sqlfluff` false premise's second home
in `ROADMAP.md` Phase 163 criterion 1 (this phase must not edit `ROADMAP.md`); option C if declined.

---

## Shared Patterns

### One-level routing (the rule this phase asserts, applied to its own output)
**Source:** `.claude/skills/data/SKILL.md` — frontmatter `description` is the routing layer; the body
points **directly** at `object-model.md` / `extension-patterns.md`.
**Apply to:** `components/SKILL.md`, `CLAUDE.md § Skill Routing`, `.claude/skills/README.md`.
Never introduce a second index inside a skill. The repo's one violation is
`spike-findings/SKILL.md:149 § Feature Areas` → `references/*.md` (a table of 8) and `:162 § Source
Files` → `sources/*/README.md` (17) — a three-hop chain from `CLAUDE.md:424`.

### Cite-the-incident justification
**Source:** `data/SKILL.md:33-38` (*"Historical `instanceof` bugs (commit 87efe19a) caused
cross-module-boundary failures"*); `scripts/assert-a11y-scan-wiring.mjs:5-18` (*"The incident this
file exists for:"*); `packages/README.md` (*"a stale list here is worse than no list"*).
**Apply to:** every new normative sentence this phase writes — the 2c self-check note, the
`context-reactivity.md` rules, the `README.md` judgements, the link-checker docblock. The corpus
never asserts a rule without naming the failure that produced it.

### `Pattern: follow existing <X> in <file>` pointer
**Source:** all four `extension-patterns.md`, last sub-bullet of nearly every step.
**Apply to:** the new dev-seed step and the new E2E filter step.

### Anchor discipline
**Source:** RESEARCH.md Pitfall 1 (2 of 3 essay anchors already dangling) + Pitfall 2 (15 names / 51 sites).
**Apply to:** every file this phase writes. **No `path:line` citation may be copied from CONTEXT.md or
RESEARCH.md into a shipped artifact without re-verification at execution time** — 152–159 land first
and move `$lib/routes`, `$layouts`, `candidateContext.svelte.ts`, and the `results/+layout.svelte`
route shape.

### Verification-by-grep, not by prose review
**Source:** `packages/README.md`'s inline `(To verify: <command> returns zero matches.)`;
`scripts/assert-*.mjs`'s `process.exitCode = violations > 0 ? 1 : 0`.
**Apply to:** each REVIEW-DOC id. Per RESEARCH.md, grep the destination for the five load-bearing
phrases (`ONCE at component-init`, `tracking scope`, `never bind`, `#version`, `FLATTEN-02`).
**Do not use a green `audit-skill-drift.sh` as evidence** — it goes green mechanically because the
phase commits inside `data/` and `database/`, resetting their baselines (`audit-skill-drift.sh:62`).

### Deletion hygiene (skill name is a runtime identifier)
**Source:** `CLAUDE.md:424` `→ \`Skill("spike-findings-voting-advice-application-gsd")\``.
**Apply to:** the `architect` and (if judged DELETE) `spike-findings-*` removals. Pre-delete grep,
repo-wide excluding `.planning/`, for `Skill("<name>")`, `skills/<name>` and every prose mention. The
`CLAUDE.md` routing edit is part of the same change, not a follow-up.

---

## No Analog Found

| File | Role | Data flow | Reason |
|------|------|-----------|--------|
| `.claude/skills/components/context-reactivity.md` | normative framework-behaviour essay | relocated | No existing skill file documents a **framework** invariant (as opposed to an in-repo API). The nearest shapes are `data/object-model.md` (a `SKILL.md`-adjacent concrete resource file — copy the *file role and one-hop placement*) and `data/SKILL.md § Conventions` (copy the *rule → mechanism → incident* register). The **content** is not new: it is `CLAUDE.md:327-378` verbatim, with anchors repaired. |

---

## Metadata

**Analog search scope:** `.claude/skills/**`, `.claude/scripts/`, `CLAUDE.md`, `packages/README.md`,
`scripts/*.mjs`, `apps/docs/scripts/`, `apps/docs/src/routes/(content)/developers-guide/frontend/components/`,
root + workspace `package.json`, `.planning/todos/pending/`.
**Files read this session:** 18 (analog extraction) + 2 (required reading).
**Pattern extraction date:** 2026-08-28, HEAD `db220cb5f`, branch `integration/ship-12-squash`.
**Validity:** the *patterns* (register, shape, script conventions) are stable. The *line anchors* are
not — re-verify after Phases 152–159.
