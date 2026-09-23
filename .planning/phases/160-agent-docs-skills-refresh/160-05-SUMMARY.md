---
phase: 160-agent-docs-skills-refresh
plan: 05
subsystem: docs
tags: [claude-md, skills, svelte5, runes, context-reactivity, docs-generator, drift-guard]

requires:
  - phase: 160-agent-docs-skills-refresh
    provides: "Plan 01's `.claude/scripts/audit-skill-links.sh`, its corpus baseline, and the two CLAUDE.md anchors it repaired and re-derived"
  - phase: 160-agent-docs-skills-refresh
    provides: "Plan 04's `.claude/skills/README.md` — the one-level routing rule in two mechanically checkable clauses, the `targets:`-must-be-directories constraint, and the link-plus-targets sync judgement this plan implements"
  - phase: 159-component-and-context-consolidation
    provides: "the post-consolidation component tree and context shapes every anchor here was re-derived against"
  - phase: 152-comment-and-naming-hygiene
    provides: "the comment-hygiene scan in `yarn lint:check` that the regenerated navigation config had to satisfy"
provides:
  - "`.claude/skills/components/context-reactivity.md` — the relocated Context Destructuring Rule and `dataRoot` `#version`-bridge carve-out, with every anchor re-derived"
  - "A fully rewritten `.claude/skills/components/SKILL.md`: discriminative non-stem description, three verified directory `targets:`, a two-destination one-hop body, and a re-check tail"
  - "A component listing that is current as of this phase (98 -> 104 entries), plus a durable fix to the navigation generator that had been undoing Phase 152's comment-hygiene repair on every run"
affects: [160-06, 160-08, 160-09]

actuals:
  tokens: 57975
  tasks: 3
  commits: 4
plan_head_before: c548c0df3209980f27c24d70f2b834b956e7421e

tech-stack:
  added: []
  patterns:
    - "A skill's frontmatter description opens with its own discriminative clause and says when to use it RATHER THAN its named neighbours — never with the `Domain expert for the` stem that 6 of the corpus's 8 descriptions share."
    - "A skill links to a generated listing and declares the listing's source directories as `targets:`; it never carries a second hand-maintained copy."
    - "A generated artifact that a guard rejects is fixed in the GENERATOR, not in the output — otherwise the next regeneration silently undoes the repair."

key-files:
  created:
    - .claude/skills/components/context-reactivity.md
  modified:
    - .claude/skills/components/SKILL.md
    - apps/docs/scripts/generate-navigation-config.ts
    - apps/docs/src/lib/navigation.config.ts
    - apps/docs/src/routes/(content)/developers-guide/frontend/components/generated/
    - apps/docs/src/routes/(content)/developers-guide/frontend/routing/generated/

key-decisions:
  - "The description does NOT open with `Domain expert for the`. The plan's read_first told me to copy `data/SKILL.md`'s grammar exactly; `.claude/skills/README.md` (my own Plan 04 dependency) forbids that opening in the same breath. The README wins: the grammar that matters is `Understands … / Activate when …`, and the stem is the part measured to carry no routing signal. Re-derived at execution: 6 of 8."
  - "The canonical-pattern code block was corrected, not carried verbatim. The source block contained `const dataRoot = $derived(ctx.dataRoot);` — a line the cited file does not contain and which the carve-out three paragraphs below it explicitly prohibits. Relocating it verbatim would have shipped an example that teaches the anti-pattern."
  - "The three non-component artifacts the docs entry point also regenerates (route map, navigation config) were committed rather than reverted. Reverting them would leave the tree disagreeing with its own generator, so the next run re-dirties it."
  - "The navigation generator was fixed at source. Phase 152 had repaired its OUTPUT only; the first regeneration in Task 1 undid that repair and turned `yarn lint:check` red. Fixing the output again would have re-armed the same trap."

patterns-established:
  - "Anchor discipline: every path and line range re-derived at execution time and content-checked (`sed -n 'NN,MMp' | grep -c '<the thing the citation names>'`), never copied from a plan or a prior summary."
  - "A plan acceptance criterion that uses an awk range over frontmatter must terminate on the closing `---` delimiter; `/^[a-z_]+:/` alone does not, and bleeds the whole body."

requirements-completed: [REVIEW-DOC-02, REVIEW-DOC-03, REVIEW-DOC-04]

coverage:
  - id: D1
    description: "The docs component listing is current: the generate entry point ran to completion once and its output was reviewed component by component"
    requirement: REVIEW-DOC-03
    verification:
      - kind: other
        ref: "yarn workspace @openvaa/docs generate:docs -> exit 0, 'Generated documentation for 104 components'"
        status: pass
      - kind: other
        ref: "independent multiline count over the three COMPONENT_DIRS with the generator's own /<!--\\s*@component\\s*([\\s\\S]*?)-->/i pattern -> 104 entries / 103 unique; identical to the regenerated listing's name set (diff -> empty)"
        status: pass
      - kind: other
        ref: "yarn workspace @openvaa/docs validate:links -> exit 0 (198 files, 172 internal links, 0 broken)"
        status: pass
    human_judgment: false
  - id: D2
    description: "The context-reactivity invariant is relocated intact: all five load-bearing components present, all 26 reactive-accessor names carried, all four external references resolving"
    requirement: REVIEW-DOC-02
    verification:
      - kind: other
        ref: "five-phrase grep loop ('ONCE at component-init', 'tracking scope', 'never bind', '#version', 'FLATTEN-02') -> prints nothing"
        status: pass
      - kind: other
        ref: "accessor set comparison: 26 backticked names in the source's reactive-accessor paragraph, 26 in the destination, comm -23 source dest -> empty"
        status: pass
      - kind: other
        ref: "for f in $(grep -oE '\\.planning/[A-Za-z0-9_./-]+\\.md' context-reactivity.md | sort -u); do test -f $f; done -> all 4 OK"
        status: pass
    human_judgment: false
  - id: D3
    description: "Every path and line citation in context-reactivity.md resolves and each cited range contains what the citation claims"
    requirement: REVIEW-DOC-04
    verification:
      - kind: other
        ref: "bash .claude/scripts/audit-skill-links.sh .claude/skills/components/context-reactivity.md -> Checked: 10  Dangling: 0, exit 0"
        status: pass
      - kind: other
        ref: "per-range content checks: results/[[electionTab]]/+layout.svelte:63-70 contains getVoterContext()+selectedConstituencies; candidateContext.svelte.ts:44-45 contains 'Destructure-trap contract'; :131-134 contains 'Root mechanism'+'tracking scope'; elections/+page.svelte:40-41 contains '$derived.by'+'voterCtx.dataRoot.elections'"
        status: pass
    human_judgment: false
  - id: D4
    description: "The components SKILL.md description routes for the content the skill now holds and is discriminative against its neighbours"
    requirement: REVIEW-DOC-03
    verification:
      - kind: other
        ref: "grep -c 'Svelte 4' -> 0; description line: 'destructure' >= 1 and mentions dataRoot; opening stem is not 'Domain expert for the' (6 of 8 corpus descriptions re-derived as sharing it)"
        status: pass
    human_judgment: false
  - id: D5
    description: "targets: is populated with three repo-root-relative directories that exist, so the drift guard checks the skill rather than skipping it"
    requirement: REVIEW-DOC-03
    verification:
      - kind: other
        ref: "corrected awk extraction -> 3 items, each test -d OK; bash .claude/scripts/audit-skill-drift.sh components -> 'components OK (synced as of 2026-09-13)', Checked: 1  Skipped: 0 (verdict text read; exit code NOT used as evidence)"
        status: pass
    human_judgment: false
  - id: D6
    description: "The SKILL.md body is one hop to two concrete destinations, with no embedded listing and a re-check tail"
    requirement: REVIEW-DOC-03
    verification:
      - kind: other
        ref: "grep -c 'context-reactivity.md' -> 3; grep -c 'developers-guide/frontend/components' -> 1; grep -cE '^- \\[[A-Z][A-Za-z]+\\]\\(' -> 0; grep -ci 're-check' -> 2"
        status: pass
    human_judgment: false
  - id: D7
    description: "Repo gates are green and this plan introduced no dangling citation into the corpus"
    requirement: REVIEW-DOC-04
    verification:
      - kind: other
        ref: "yarn lint:check -> exit 0 (read from $? on the command itself, never through a pipe); 23/23 turbo tasks, all in-tree guards 0 violations"
        status: pass
      - kind: other
        ref: "whole-corpus audit-skill-links.sh -> Checked: 770  Dangling: 327  Skipped: 220, against 327/743 after Plan 04: +27 citations checked, +0 dangling"
        status: pass
      - kind: other
        ref: "npx prettier --check on both skill files -> clean"
        status: pass
    human_judgment: false
  - id: D8
    description: "The relocation did not weaken the invariant — every normative statement, the canonical pattern, and the carve-out's prohibition and remedy still bind"
    verification: []
    human_judgment: true
    rationale: "A grep proves the words moved and a link audit proves the anchors resolve; only a human reading the destination against the source can judge that no MUST was softened and that the corrected canonical-pattern block is a strengthening rather than an edit to the invariant. The plan's own <human-check> says exactly this."

duration: ~30 min
completed: 2026-09-13
status: complete
---

# Phase 160 Plan 05: The components skill — relocated invariant, routing description, drift targets Summary

**A 917-byte routing stub replaced by a real skill: a 9.5 KB `SKILL.md` whose description routes on the destructure trap and the `dataRoot` `#version` hole rather than on the shared `Domain expert for the` stem, three verified directory `targets:` that make the drift guard check it, and a one-hop body pointing at the relocated `context-reactivity.md` and at a component listing regenerated from 98 to 104 entries.**

## Performance

- **Duration:** ~30 min (start time approximate — `PLAN_START_TIME` was not captured; first task commit 2026-09-13T20:44:50+03:00, last 20:51:37+03:00)
- **Completed:** 2026-09-13T17:52:23Z
- **Tasks:** 3
- **Files modified:** 110 (1 created, 109 modified — 107 of them generated docs output)

## Accomplishments

- **The invariant has a home before it loses its old one.** `context-reactivity.md` is committed at `9268b977d`; `CLAUDE.md`'s copy is untouched and is Plan 06's to remove. No commit in this phase leaves the rule absent from the tree.
- **Every anchor was re-derived, and one was found to be worse than stale.** All four code citations Plan 01 repaired still hold at their cited line numbers. But the canonical-pattern *code block* in the source did not match the file it cited, and taught the exact anti-pattern the carve-out below it prohibits. Fixed in the move.
- **The component listing is current for the first time since 2026-03-31**: 98 -> 104 entries, 97 -> 103 unique names, verified equal to an independent multiline count, and its diff read component by component.
- **A latent guard-defeating loop was closed.** Regenerating the docs turned `yarn lint:check` red: Phase 152 had repaired the navigation config's header but not the generator that writes it, so the first regeneration undid the repair. Fixed at source.
- **Zero dangling citations added to a corpus of 770.**

## Task Commits

1. **Task 1: Regenerate the component listing once, and review its diff** — `887566be4` (docs)
2. **Task 2: Relocate the context-reactivity invariant into a concrete resource file** — `9268b977d` (docs)
3. **Deviation fix (found by Task 3's lint gate, caused by Task 1)** — `dd117c31d` (fix)
4. **Task 3: Rewrite the components skill** — `8609c8c31` (docs)

## Task 1 — the generator run and the diff, component by component

**Entry point and exit status.** `yarn workspace @openvaa/docs generate:docs`, which runs
`apps/docs/scripts/generate-all-docs-and-validate.ts`. **Exit 0.** Its stage banners:

```
✓ Created output directories
Extracting component documentation...
✓ Generated documentation for 104 components
✓ Table of contents: …/apps/docs/scripts/.temp/components/README.md
Generating route map...            ✓ Route map generated
Moving generated files...          ✓ components moved and transformed
                                   ✓ routes moved and transformed
Generating navigation configuration...  ✓ No structural changes, titles updated where applicable
Validating documentation links...  ✓ complete
✓ Documentation generation complete!
```

The broken sibling scripts were **not** repaired: `apps/docs/package.json`'s `generate:component-docs`
points at `scripts/extract-component-docs.ts`, which does not exist. Plan 04 files it; Phase 153 owns it.

**The count, and the independent check.** The committed listing's footer read `Total: 98 components`
(97 unique names). It now reads `Total: 104 components` (103 unique — `LogoutButton` exists in both
`dynamic-components` and `candidate/components`). Independently counted with the generator's own
multiline pattern `/<!--\s*@component\s*([\s\S]*?)-->/i` over the three `COMPONENT_DIRS` from
`apps/docs/scripts/docs-scripts.config.ts`:

| Directory | `.svelte` files | with `@component` |
|---|---:|---:|
| `apps/frontend/src/lib/components` | 68 | 67 |
| `apps/frontend/src/lib/dynamic-components` | 30 | 30 |
| `apps/frontend/src/lib/candidate/components` | 7 | 7 |
| **Total** | **105** | **104** |

**104 = 104**, and `diff` of the independent name set against the regenerated listing's name set is
empty. (A line-oriented grep reports 7 and is simply wrong — the marker sits on its own line inside a
multi-line comment. The plan warned about this; it reproduces.)

**The diff, name by name — 7 added, 1 removed.** Each confirmed against the working tree:

| Name | Change | Grounding in the tree |
|---|---|---|
| `EntityListWithControls` | added | `apps/frontend/src/lib/dynamic-components/entityList/EntityListWithControls.svelte`, added in `c3e948a84` (the runes/Supabase library rewrite) — postdates the 2026-03-31 listing |
| `NumberScaleInput` | added | `apps/frontend/src/lib/components/questions/NumberScaleInput.svelte`, same commit, same reason |
| `QuestionArguments` | added | `apps/frontend/src/lib/components/questions/QuestionArguments.svelte`, same commit, same reason |
| `ImagePart` | added | `apps/frontend/src/lib/components/input/parts/ImagePart.svelte`, added in `c2665b117` "refactor(159-09): extract Input's four complex branches into co-located parts" |
| `MultilingualTextPart` | added | same commit, same extraction |
| `MultipleTextPart` | added | same commit; this is where `MultipleTextInput.svelte` went — that file was deleted in `c2665b117` and had itself only landed in `b7bec6208` (159-09), i.e. it never appeared in the committed listing |
| `SelectMultiplePart` | added | same commit, same extraction |
| `EntityCardAction` | **removed** | deleted in `fb555ee98` "refactor(159-05): replace the entity-card action wrapper with a card-local snippet"; `find … -name 'EntityCardAction.svelte'` returns nothing |

Research predicted four additions including `MultipleTextInput`; that prediction predates Phase 159,
which replaced that component with the four `parts/*Part` files. Re-deriving rather than trusting it is
what surfaced the difference — the phase's standing practice, applied and vindicated again.

**`yarn workspace @openvaa/docs validate:links`: exit 0** — 198 files scanned, 172 internal links, 0
broken, 0 fixed.

## Task 2 — the relocation, and every anchor re-derived

`.claude/skills/components/context-reactivity.md` (9,097 B). It opens the way `packages/README.md`
opens — `H1` plus a blockquote naming its reader and the bug class it prevents — then states plainly
that it is relocated content, where it came from, and why it lives here rather than being cut.

**The five load-bearing components, by mechanical grep (silence = pass):**

```
$ for p in 'ONCE at component-init' 'tracking scope' 'never bind' '#version' 'FLATTEN-02'; do
    grep -qF "$p" .claude/skills/components/context-reactivity.md || echo "MISSING PHRASE: $p"; done
(no output)
```

**No substitutions were needed** — all five phrases from the plan survive verbatim in the post-159
source text.

**The accessor list survived exactly.** Backticked names in the source's reactive-accessor paragraph
(`CLAUDE.md:350`): **26**. In the destination's § 1b: **26**. `comm -23 source destination` is empty —
every one carried, none dropped. The stable-reference list (`t`, `getRoute`, `darkMode`, `answers`,
`userData`, `logout`, `register`, `preregister`, `startEvent`, `*Countdown`) carried in full.

**The four external references all exist** and are all cited:

```
OK .planning/debug/dataroot-stale-direct-nav.md
OK .planning/milestones/v2.6-phases/61-voter-app-question-flow/61-03-DIAGNOSIS.md
OK .planning/spikes/024-derived-alias-stable-ref-skip/README.md
OK .planning/spikes/CONVENTIONS.md
```

`CONVENTIONS.md` § 9 confirmed live: `### 9. $derived.by over per-field reads for reference-stable
$state proxies`, with the Spike-024 anti-pattern entry at `### Intermediate $derived alias over a
stable-ref accessor → downstream-skip (Spike 024)`.

### Per-citation range checks — every `path:NN-MM` content-verified

Re-derived against the working tree at execution, not copied from the plan, from `CLAUDE.md`, or from
`160-01-SUMMARY.md`. All four of Plan 01's repaired values **still hold** after Phase 159:

| Citation | Check run | Result |
|---|---|---|
| `apps/frontend/src/routes/(voters)/(located)/results/[[electionTab]]/+layout.svelte:63-70` | `sed -n '63,70p' … \| grep -c 'getVoterContext()'` and `… \| grep -c 'selectedConstituencies'` | 1 and 1 — **PASS** |
| `apps/frontend/src/lib/contexts/candidate/candidateContext.svelte.ts:44-45` | `sed -n '44,45p' … \| grep -c 'Destructure-trap contract'` | 1 — **PASS** |
| `apps/frontend/src/lib/contexts/candidate/candidateContext.svelte.ts:131-134` | `sed -n '131,134p' … \| grep -c 'Root mechanism'` and `\| grep -c 'tracking scope'` | 1 and 1 — **PASS** |
| `apps/frontend/src/routes/(voters)/elections/+page.svelte:40-41` | `sed -n '40,41p' … \| grep -c 'derived.by'` and `\| grep -c 'voterCtx.dataRoot.elections'` | 1 and 1 — **PASS** |

**Link audit:** `bash .claude/scripts/audit-skill-links.sh .claude/skills/components/context-reactivity.md`
-> `Checked: 10  Dangling: 0  Skipped: 1`, **exit 0**.

**The ordering guarantee holds.** `git log --oneline -- .claude/skills/components/context-reactivity.md`
shows `9268b977d`, and `CLAUDE.md` is untouched by this plan (`git diff --name-only <base>..HEAD` matches
no `CLAUDE.md` path). Plan 06 removes the source; the assertion that the destination commit precedes it
is Plan 06's to close.

## Task 3 — the rewritten skill

**Description.** The old one advertised `export let`, `$$Props` and "Svelte 4 component patterns" on a
tree where `apps/frontend/svelte.config.js` forces `runes: true` outside `node_modules` and where, over
the three target directories, `export let` appears in **0** files, `$$Props` in **0**, `<slot` in **0**,
against **103** files calling `$props()` and **103** co-located `*.type.ts` files. The new description:

- names the context-reactivity triggers explicitly — "the context destructure trap (destructuring a
  reactive accessor such as opinionQuestions captures an empty array for the life of the component) and
  the dataRoot #version-bridge carve-out (a $derived read alias over dataRoot goes stale on cold /
  direct-URL entry)" — so a stale-context bug routes here from the description alone;
- says **when to use this skill rather than its neighbours**, naming `data`, `matching`, `filters` and
  `database` and drawing the line at "the file is a `.svelte` component or a context consumer under
  `apps/frontend/src/lib`";
- extends the activation clause to `getVoterContext()`, `getCandidateContext()` and `getAppContext()`;
- **does not open with `Domain expert for the`.** Re-derived at execution: **6 of 8** `SKILL.md`
  descriptions share that stem (`architect`, `components`, `data`, `database`, `filters`, `matching`);
  only `ship-review-stack` and the spike-findings skill open differently. Dropping it takes the count to
  5 of 8 before Plan 07's deletions.

**Targets.** Three block-list items, `targets:` as the last frontmatter key:

```yaml
targets:
  - apps/frontend/src/lib/components
  - apps/frontend/src/lib/dynamic-components
  - apps/frontend/src/lib/candidate/components
```

Each verified `test -d` before committing. **Drift-guard verdict text, before and after:**

| | Command | Output |
|---|---|---|
| **Before** (empty inline `targets: []`) | `bash .claude/scripts/audit-skill-drift.sh components` | `components      SKIP  (no targets defined)` — `Checked: 0  Drifted: 0  Skipped: 1` |
| **After** | same | `components      OK    (synced as of 2026-09-13)` — `Checked: 1  Drifted: 0  Skipped: 0` |

Non-`SKIP`, so the frontmatter parsed and the guard now checks the skill. **Its exit code is not used as
evidence of anything else about this phase** — this plan's own commits are what reset its per-skill
baseline, which is exactly why it currently reads `OK`. Recording the deliberate posture the plan asked
for: the guard **exits non-zero on the next commit to any of those three directories**. That is the
mechanism working as designed, not an accident; over the last 90 days those directories saw 13, 13 and
11 commits, inside the band the corpus already accepts for `apps/supabase` (79).

**Body — two destinations, both one hop, no second index.** `## Library Purpose` (the three libraries
and the dependency rule that separates them), `## Conventions` (7 numbered items in the `data` skill's
register: bolded lead-in, prohibitions in capitals, the measurement or incident cited inline as
justification), then:

1. `.claude/skills/components/context-reactivity.md`, preceded by a compressed but complete statement of
   the rule — the two-class taxonomy, `NEVER destructure a reactive accessor`, and `NEVER bind dataRoot
   to an intermediate read alias` — so a reader who never follows the link is not misled.
2. `apps/docs/src/routes/(content)/developers-guide/frontend/components/generated/+page.md`, **linked,
   not copied**, quoting the listing's own self-describing header and naming both the generator and the
   working entry point. No component names are embedded.

**The re-check tail** closes the file in the shape Plan 03 gave the four `extension-patterns.md` files,
and says explicitly what the plan asked for: the drift guard flags the source change, the note is what
makes a human act on it — complements, not substitutes.

**Acceptance criteria, each run:**

| Criterion | Command | Result |
|---|---|---|
| Stale API claim gone | `grep -c 'Svelte 4'` | `0` — PASS |
| Stub body gone | `grep -ci 'placeholder'` / `grep -ci 'this stub establishes'` | `0` / `0` — PASS |
| Description discriminative | `sed -n '/^description:/p' \| grep -ci 'destructure'`; same line mentions the data root | `1`; yes — PASS |
| `targets:` not inline-empty | `grep -c 'targets: \[\]'` | `0` — PASS |
| ≥ 3 block items | corrected awk (see below) | `3` — PASS |
| Every target a directory | `test -d` loop | no output — PASS |
| Guard verdict not `SKIP` | `audit-skill-drift.sh components` | `components OK` — PASS |
| Both pointers present | `grep -c 'context-reactivity.md'` / `grep -c 'developers-guide/frontend/components'` | `3` / `1` — PASS |
| No embedded listing | `grep -cE '^- \[[A-Z][A-Za-z]+\]\('` | `0` — PASS |
| Re-check note present | `grep -ci 're-check'` | `2` — PASS |
| Link audit | `audit-skill-links.sh components` | `Checked: 27  Dangling: 0`, exit 0 — PASS |
| `yarn lint:check` | exit status read from `$?` on the command itself | `0` — PASS |

### One acceptance criterion was defective and was substituted

The plan's target-extraction one-liner —
`awk '/^targets:/{f=1;next} /^[a-z_]+:/{f=0} f'` — **never terminates**, because the frontmatter closes
with `---`, which matches neither pattern. Run literally it emits the entire body and reports
`target items: 9` with 100+ spurious `NOT A DIRECTORY:` lines. This is a cousin of the `awk '/^## X/,/^## /'`
range flaw Plans 02, 03 and 04 all hit.

**Substituted extraction, used for both the count and the `test -d` loop:**

```bash
awk '/^targets:/{f=1;next} /^---$/{f=0} /^[a-z_]+:/{f=0} f' .claude/skills/components/SKILL.md
```

It yields exactly the three items, matching `audit-skill-drift.sh`'s own parser, which stops at the
first line not matching `^[[:space:]]+-[[:space:]]+`. The corrected form is what every figure above was
measured with; the vacuous form is recorded here rather than reported as a pass.

## Files Created/Modified

- `.claude/skills/components/context-reactivity.md` **(new, 9,097 B)** — the relocated invariant in 7
  sections: the two property classes, the canonical pattern, the diagnostic origin, the
  handle-shaped-member caveat, the `#version`-bridge carve-out, the four references, and enforcement.
- `.claude/skills/components/SKILL.md` — rewritten end to end, 917 B -> 9,464 B.
- `apps/docs/scripts/generate-navigation-config.ts` — one template literal joined to a single line.
- `apps/docs/src/lib/navigation.config.ts` — regenerated; 3 title changes plus the restored header.
- `apps/docs/src/routes/(content)/developers-guide/frontend/components/generated/**` — 104 component
  pages plus the table of contents; 4 new component directories.
- `apps/docs/src/routes/(content)/developers-guide/frontend/routing/generated/+page.md` — regenerated
  route map. It still carried the `[[lang=locale]]` route segment that Phase 158 removed.

## Decisions Made

See `key-decisions` in the frontmatter. The two worth reading closely are the description stem (where I
followed `.claude/skills/README.md` over my own plan's `read_first`) and the canonical-pattern
correction (where "move the text, do not rewrite it" collided with a block that was measurably wrong).

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] The canonical-pattern code block contradicted both its own citation and the carve-out below it**

- **Found during:** Task 2
- **Issue:** `CLAUDE.md:360-372` presents a code block as the canonical pattern at
  `results/[[electionTab]]/+layout.svelte:63-70`. The file at those lines does **not** contain
  `const dataRoot = $derived(ctx.dataRoot);`, and it deliberately does not — the in-file comment at
  line 67 says so, and the carve-out three paragraphs below the block prohibits exactly that
  construction. Relocating it verbatim would have shipped an example teaching the anti-pattern the same
  file prohibits, under a citation that does not support it.
- **Fix:** § 2 of `context-reactivity.md` reproduces the real eight lines, and adds a short paragraph
  drawing the reader's attention to what the example does **not** contain and why. The prohibition is
  strengthened, not softened, so the no-weakening constraint is satisfied.
- **Files modified:** `.claude/skills/components/context-reactivity.md`
- **Verification:** `sed -n '63,70p' …/+layout.svelte` compared line by line against the block;
  `grep -c 'getVoterContext()'` -> 1, `grep -c 'selectedConstituencies'` -> 1
- **Committed in:** `9268b977d`

**2. [Rule 3 - Blocking] The docs generate entry point re-emitted a header that Phase 152's comment-hygiene guard rejects**

- **Found during:** Task 3 (the `yarn lint:check` gate)
- **Issue:** Task 1's regeneration turned `yarn lint:check` **red** with two violations:
  `apps/docs/src/lib/navigation.config.ts:2` and `:3`, rule 2 (D-A4) — forced line break. Phase 152
  had repaired the generated **output** but not `generateTypeScript()` in
  `apps/docs/scripts/generate-navigation-config.ts`, which still emitted the three-line form. The
  repair therefore survived only until the first regeneration — and nothing had regenerated since 152.
- **Fix:** Joined the template's three header lines into the single line 152 landed, in the generator.
  Re-ran the full entry point; the output now matches what 152 committed and stays guard-clean on every
  future run. Fixing the output again instead would have re-armed the same trap.
- **Files modified:** `apps/docs/scripts/generate-navigation-config.ts`,
  `apps/docs/src/lib/navigation.config.ts`
- **Verification:** `yarn lint:check` -> exit 1 before, **exit 0** after (`$?` read from the command
  itself, never through a pipe); comment-hygiene guard reports `files scanned: 1663 … 0 violation(s)`
- **Committed in:** `dd117c31d`

**3. [Rule 3 - Blocking] `.type.ts` as a bare backticked token is a dangling citation**

- **Found during:** Task 3
- **Issue:** `bash .claude/scripts/audit-skill-links.sh components` reported
  `.type.ts  (no file by that name in the repository)`. The token is a file-KIND reference, but Plan
  01's checker resolves bare filenames by basename and `.type.ts` is no file's basename.
- **Fix:** The one location where a concrete file was meant now names it
  (`Button.type.ts` beside `Button.svelte`, both of which resolve); the two genuinely generic uses are
  written `*.type.ts`, which the checker's glob exemption skips. No `skill-link-allow` marker was
  needed, so no exemption noise was added.
- **Files modified:** `.claude/skills/components/SKILL.md`
- **Verification:** `audit-skill-links.sh components` -> `Checked: 27  Dangling: 0`, exit 0
- **Committed in:** `8609c8c31`

**4. [Rule 3 - Blocking] The single generate entry point writes two artifacts outside this plan's `files_modified`**

- **Found during:** Task 1
- **Issue:** `generate:docs` orchestrates the component extraction, the route map, the file move, the
  navigation config and the link validation. `files_modified` names only the components `generated`
  directory, but the run also rewrote
  `apps/docs/src/routes/(content)/developers-guide/frontend/routing/generated/+page.md` and
  `apps/docs/src/lib/navigation.config.ts`.
- **Fix:** Committed both. Reverting them would leave the working tree disagreeing with its own
  generator, so the next run re-dirties it — and the route map was badly stale, still showing the
  `[[lang=locale]]` segment Phase 158 removed. Both are generated artifacts of the entry point the plan
  told me to run; leaving half a regeneration behind is the worse outcome.
- **Files modified:** as above
- **Verification:** `git status --short` clean of `apps/docs` after the final run; `validate:links`
  exit 0
- **Committed in:** `887566be4` (route map), `dd117c31d` (navigation config, after the generator fix)

**5. [Rule 1 - Bug] The plan's `targets:` extraction one-liner is vacuous**

- **Found during:** Task 3
- **Issue:** `awk '/^targets:/{f=1;next} /^[a-z_]+:/{f=0} f'` does not stop at the closing `---`
  frontmatter delimiter, so it emits the whole body. Reported `9` items and 100+ false
  `NOT A DIRECTORY:` lines.
- **Fix:** Added `/^---$/{f=0}`. The corrected form matches `audit-skill-drift.sh`'s own parser and
  yields exactly the three targets.
- **Files modified:** none (a verification-method correction, recorded here per the phase's standing
  rule that a vacuous check is never reported as a pass)
- **Verification:** corrected extraction -> 3 items, all `test -d` OK; cross-checked against the drift
  guard's own non-`SKIP` verdict
- **Committed in:** n/a — recorded in this summary

---

**Total deviations:** 5 auto-fixed (2 × Rule 1 bug, 3 × Rule 3 blocking).
**Impact on plan:** Deviations 1 and 2 are the load-bearing ones — 1 prevented shipping an
anti-pattern under a false citation, 2 fixed a guard-defeating loop that would have re-broken lint on
every future docs regeneration. 4 expanded the commit footprint beyond `files_modified`, entirely within
generated output of the entry point the plan specified. No scope creep: nothing outside `apps/docs/` and
`.claude/` was touched.

## Issues Encountered

- **`bash .claude/scripts/audit-skill-links.sh .claude/skills/components/`** (the plan's `<verification>`
  form, with a trailing slash) prints `Skill or file not found` and exits 1. The script takes a skill
  **name** or a single file path, not a directory path. The working equivalents, both run and both green:
  `audit-skill-links.sh components` (`Checked: 27  Dangling: 0`, exit 0) and the per-file form. The
  verification line, not the skill, is what was wrong.
- **The `+page.md` listing has 104 entries but 103 unique names.** `LogoutButton` exists twice — once
  under `dynamic-components` and once under `candidate/components`. Both are live and both are correctly
  listed; the two figures are not in conflict.

## Verification

| Check | Result |
|---|---|
| `yarn workspace @openvaa/docs generate:docs` | **exit 0**, "Generated documentation for 104 components" |
| `yarn workspace @openvaa/docs validate:links` | **exit 0** — 198 files, 172 links, 0 broken |
| `bash .claude/scripts/audit-skill-links.sh components` | `Checked: 27  Dangling: 0  Skipped: 14`, **exit 0** |
| `bash .claude/scripts/audit-skill-drift.sh components` | `components OK (synced as of 2026-09-13)` — **non-`SKIP`**, `Checked: 1  Skipped: 0` |
| Five-phrase grep loop | prints nothing — all five present, **no substitutions** |
| Four external references | all four exist |
| Four `path:NN-MM` range content checks | all PASS (table above) |
| `yarn lint:check` | **exit 0**, read from `$?` on the command itself — 23/23 turbo tasks, all in-tree guards 0 violations |
| `npx prettier --check` on both skill files | clean |
| Whole-corpus `audit-skill-links.sh` | `Checked: 770  Dangling: 327  Skipped: 220` — vs `327 / 743` after Plan 04: **+27 checked, +0 dangling** |
| Prohibited files untouched | `git diff --name-only <base>..HEAD` matches no `CLAUDE.md`, `ROADMAP`, `REQUIREMENTS` or `STATE` path |

**Not run: the E2E suite.** `git diff --name-only <base>..HEAD` touches nothing under
`apps/frontend/`, `packages/` or `tests/` — every changed file is under `apps/docs/` or `.claude/`. No
Playwright outcome can differ. The phase's suite gate is Plan 09's (`160-09-PLAN.md` Task 3), and this
is recorded rather than silently skipped.

**Not claimed: CI verification.** `.github/workflows/main.yaml` triggers on push to `main` or to a
`ci-evidence/**` branch and on pull-request events targeting `main`; this branch,
`integration/ship-12-squash`, matches none of them, and both trigger forms carry
`paths-ignore: "**.md"`. A green `audit-skill-drift.sh` is likewise not evidence — this plan's own
commits are what reset its per-skill baseline, which is precisely why it now reads `OK`. The evidence
for this plan is the local runs tabulated above.

## Known Stubs

None. Both artifacts are complete. Two scope boundaries, neither a stub:

- The broken `apps/docs/package.json` `generate:*` script references are **not** repaired here — Plan 04
  filed them, Phase 153 owns them (operator decision `O4`).
- `.claude/skills/BOUNDARIES.md` still carries four `components` rows naming Svelte 4 conventions and
  pre-`apps/` directory paths. Plan 08 owns that file.

## Threat Flags

None. No network endpoint, auth path, file-access pattern or schema change. T-160-03 mitigated (three
`test -d` assertions plus a non-`SKIP` guard verdict); T-160-11 mitigated (five phrases, four
references, four content-checked ranges, destination committed before source removal); T-160-01
mitigated (linked not copied, regenerated in its own task, diff read name by name); T-160-12 mitigated
(`grep -c 'Svelte 4'` -> 0, description carries the triggers).

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness

- **Plan 06 can remove the `CLAUDE.md` section.** Its destination exists at `9268b977d` and is complete;
  the removal commit will be strictly later, so the invariant is never absent. Plan 06 should assert
  that ordering at its end, as Task 2's last acceptance criterion specifies.
- **⚠ Plan 06 has a much larger obligation than "remove the section", and this plan measured it.**
  `grep -rn 'Context Destructuring Rule' apps/frontend/src` returns **39 lines across 32 files** — source
  comments, type-file JSDoc, route components and three test files, all naming the rule as living in
  `CLAUDE.md` (e.g. *"per CLAUDE.md's Context Destructuring Rule"*, *"See CLAUDE.md § Context
  Destructuring Rule, the `dataRoot` version-bridge carve-out"*). **Every one becomes a dangling
  reference the moment the section leaves `CLAUDE.md`.** The cheapest resolution is for Plan 06's
  `## Skill Routing` entry to keep the exact phrase *"Context Destructuring Rule"* findable in
  `CLAUDE.md` while pointing at `.claude/skills/components/context-reactivity.md`, so all 39 still
  resolve in one hop; repointing 32 files is the expensive alternative. Those files are outside this
  plan's `files_modified`, so the measurement is recorded rather than acted on — but it should not be
  discovered at Plan 06's execution time.
- **The carve-out is already machine-enforced, which this plan did not know going in.** Phase 159
  shipped `apps/frontend/src/lib/contexts/tests/noDataRootDerivedAlias.test.ts` (requirement
  REVIEW-CMP-05, spike 024): a vitest scan over `apps/frontend/src` that fails if any source file
  reintroduces `const dataRoot = $derived(ctx.dataRoot)`. It is deliberately narrow (only an alias whose
  entire derived body is a `dataRoot` accessor), throws rather than passing vacuously on an empty scan,
  and excludes its own file. So the relocated prose is not the only enforcement of the § 5 prohibition —
  the destructure-trap half remains review-only, the alias half does not. Its own docblock also cites
  `CLAUDE.md § Context Destructuring Rule`, so it is one of the 39 references above.
- **Plan 09's Check B has one fewer violator.** The `Domain expert for the` stem is now shared by 5 of 8
  `SKILL.md` descriptions (was 6 of 8); Plan 07's deletion of `architect` takes it to 4 of 7. Plan 09
  must re-derive rather than carry either figure.
- **Plan 09's Check A sees a conformant `components` skill.** Its body points at two concrete files and
  at no index. The depth violation remains the spike-findings chain alone, subject to Plan 07.
- **Plan 08's link baseline moved for a benign reason:** 327 dangling of **770** checked, up from 327 of
  743. The dangling count is unchanged; the denominator grew by this plan's 27 citations. Subtract the
  spike-findings skill's 219 before reading any improvement if Plan 07 decides DELETE.
- **The drift guard is now armed on three high-churn directories.** The next commit to any of
  `apps/frontend/src/lib/components`, `.../dynamic-components` or `.../candidate/components` makes
  `audit-skill-drift.sh` exit non-zero for this skill. That is the mechanism, not a regression.
- **No blockers.** `.planning/ROADMAP.md`, `.planning/REQUIREMENTS.md` and `.planning/STATE.md` are
  unmodified by this plan, per CONTEXT.md § 0.1(c).

---

_Phase: 160-agent-docs-skills-refresh_
_Completed: 2026-09-13_

## Self-Check: PASSED

- `key-files.created` present on disk: `.claude/skills/components/context-reactivity.md` FOUND.
- `key-files.modified` present on disk: `.claude/skills/components/SKILL.md`,
  `apps/docs/scripts/generate-navigation-config.ts`, `apps/docs/src/lib/navigation.config.ts` FOUND;
  both generated directories FOUND.
- All five commits resolve in `git log --oneline --all`: `887566be4`, `9268b977d`, `dd117c31d`,
  `8609c8c31`, `66ec7179d`.
- `commits: 4` is MEASURED: `git rev-list --count c548c0df3..HEAD` at SUMMARY-write time -> 4 (the
  fifth, `66ec7179d`, is this SUMMARY's own metadata commit).
- Prohibition honoured: `git diff --name-only c548c0df3..HEAD` matches no `CLAUDE.md`, `ROADMAP`,
  `REQUIREMENTS` or `STATE` path.
