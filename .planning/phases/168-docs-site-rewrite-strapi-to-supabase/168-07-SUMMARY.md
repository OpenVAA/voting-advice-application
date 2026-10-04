---
phase: 168-docs-site-rewrite-strapi-to-supabase
plan: 07
subsystem: docs-content
status: complete
tags: [docs, sveltekit, mdsvex, generator, svelte5-runes, research-quotes, audit-ledger, ci-workflows]

requires:
  - phase: 168-docs-site-rewrite-strapi-to-supabase
    provides: "168-01.1: the pruning move-generated.ts, the --component-base span gate, docs lint in lint:check"
  - phase: 168-docs-site-rewrite-strapi-to-supabase
    provides: "168-02: final URLs and H1s, 26 redirect stubs, the Contributing anchors the PR template uses"
  - phase: 168-docs-site-rewrite-strapi-to-supabase
    provides: "168-03..06: their CLAIMS.md page verdicts, findings and sweep exceptions (folded here)"
provides:
  - "Regenerated generated pages committed at the phase HEAD (EntityCardAction orphan gone) and a tidied generator template"
  - "About these docs and apps/docs/README.md describing the real pipeline, checks, navigation, stubs and deploy"
  - "Contributing with a runes-era code-style guide and a real CI workflows page; About and landing audited"
  - "Publishers' Guide (29 pages) audited with research blocks byte-identical"
  - "168-DOCS-AUDIT.md with no pending verdict and every plan's sweep exceptions copied"
  - "168-07-CLAIMS.md (214 claim rows, 47 page verdicts, 4 findings, 2 sweep exceptions)"
  - "gate-evidence/168-07-pipeline.txt: generate:docs exit 0 and idempotent on a second run"
affects: [168-08, 169]

estimate:
  tokens: 85000
actuals:
  tokens: 97936
  tasks: 3
  commits: 8
plan_head_before: f5a1be4744055b0759b689b4dcf5604e8134b46d
plan_head_after: c474c56d3c3c76c0a960fb07027da2f0fe0982be

tech-stack:
  added: []
  patterns:
    - "Generator wording changes are committed separately from a pure regeneration, so the diff of each is reviewable"
    - "A sentence another file quotes verbatim (the component index intro, quoted by the components skill) is extended, never reworded"
    - "Code-proven absence is written as 'not yet available' instead of deleting operator-authored feature descriptions"
    - "Docs prose never contains a literal `<ResearchQuote` or `href=\"/…\"`: both are parsed by the gates as real blocks or links"

key-files:
  created:
    - .planning/phases/168-docs-site-rewrite-strapi-to-supabase/168-07-CLAIMS.md
    - .planning/phases/168-docs-site-rewrite-strapi-to-supabase/gate-evidence/168-07-pipeline.txt
  modified:
    - apps/docs/scripts/generate-component-docs.ts
    - apps/docs/scripts/generate-route-map.ts
    - "apps/docs/src/routes/(content)/developers-guide/frontend/components/generated/** (103 pages + index; 1 deleted)"
    - "apps/docs/src/routes/(content)/developers-guide/frontend/routing/generated/+page.md"
    - "apps/docs/src/routes/(content)/developers-guide/about-these-docs/+page.md"
    - apps/docs/README.md
    - "apps/docs/src/routes/(content)/developers-guide/contributing/* (6 of 7 pages)"
    - "apps/docs/src/routes/(content)/about/{association,features,project,roadmap}/+page.md"
    - "apps/docs/src/routes/(content)/publishers-guide/** (8 pages)"
    - .planning/phases/168-docs-site-rewrite-strapi-to-supabase/168-DOCS-AUDIT.md
  deleted:
    - "apps/docs/src/routes/(content)/developers-guide/frontend/components/generated/dynamic-components/entityCard/EntityCardAction/+page.md (by the generator)"

key-decisions:
  - "Regeneration (78369e329) committed before the generator wording audit (12d04f015); navigation.config.ts unchanged, so no 03-06 H1 drift"
  - "Generator index intro sentence kept verbatim because .claude/skills/components/SKILL.md quotes it; a second sentence names the scanned directories"
  - "Embedded directory READMEs get a tree link (move-generated rewrites any link ending in /README.md) and demoted headings so each component page has one H1"
  - "Voter-set statement weights, real-time top results, csv translation import/export and a static no-database site are code-proven absent; pages say 'not yet available' or drop the bullet, operator plans otherwise untouched"
  - "Stub rows in the ledger keep 'redirect stub' and append 'content: <verdict> (168-0N)' plus that plan's text for the old route"
  - "Commit subjects use the repo's bracketed scope docs[docs]: (as 168-01/02 did), not the plan's docs(docs):"
  - "DOCS-01/02/03/04/06 left Pending: each is shared with 168-08"

patterns-established:
  - "Page gate per task: scoped validate:links --check, check-claims ledger + commands, D-21/D-17 sweeps, workspace Prettier check"

requirements-completed: []

coverage:
  - id: D1
    description: "Generated component and route pages regenerated at the phase HEAD with the pruning generator and committed; the EntityCardAction orphan is gone; every generated Source link resolves; the cited index path still exists"
    requirement: "DOCS-06"
    verification:
      - kind: other
        ref: "Task 1 <verify> #1: no EntityCardAction under generated/, generated/+page.md exists, validate:links --check --scope generated/** exit 0, git grep -i typedoc -- apps/docs exit 1"
        status: pass
    human_judgment: false
  - id: D2
    description: "Generator template text audited and tidied in the generator scripts only (never a hand-edited page); a second generate:docs run changes nothing"
    requirement: "DOCS-06"
    verification:
      - kind: other
        ref: "yarn workspace @openvaa/docs generate:docs twice, git diff --exit-code -- apps/docs exit 0 after each (gate-evidence/168-07-pipeline.txt)"
        status: pass
    human_judgment: true
    rationale: "Whether the new wording ('Directory README', 'Component'/'Types' labels, route-map notation) reads well is an editorial judgement"
  - id: D3
    description: "About these docs and the docs README describe the real pipeline, checks, navigation, stubs, deploy and port 5174"
    requirement: "DOCS-04"
    verification:
      - kind: other
        ref: "Task 1 <verify> #2: validate:links --check --scope /developers-guide/about-these-docs, check-claims ledger and commands over the page and README, prettier --check (all exit 0)"
        status: pass
    human_judgment: true
    rationale: "Completeness and clarity of the pipeline explanation for a new contributor needs a human reader; 168-08's verifier pass also reads it"
  - id: D4
    description: "Contributing teaches runes-era components with the PR-template and checklist anchors intact; About carries only code-proven status changes; the landing page is audited"
    requirement: "DOCS-01"
    verification:
      - kind: other
        ref: "Task 2 <verify> #1 (scoped validate:links over 15 routes, --only inbound, claims ledger and commands) exit 0; #2 (no Svelte 4 idiom or IconBase in Contributing, <= 1 Strapi line under About) exit 0"
        status: pass
    human_judgment: true
    rationale: "The code-style guide's runes conventions are a teaching text; an operator should confirm they match house style"
  - id: D5
    description: "Publishers' Guide audited (29 pages) with all 22 research spans byte-identical; every ledger row has a verdict; unscoped link check and the span gate green"
    requirement: "DOCS-02"
    verification:
      - kind: other
        ref: "Task 3 <verify> #1: generate:docs && git diff --exit-code -- apps/docs && check:research-quotes --base <base> --component-base <component base> && validate:links --check (exit 0)"
        status: pass
      - kind: other
        ref: "Task 3 <verify> #2: no 'pending' under ## Pages, 94 rows (exit 0)"
        status: pass
    human_judgment: false

duration: 24min
completed: 2026-10-02
---

# Phase 168 Plan 07: Generated pages, About these docs, Contributing, About and Publishers' Guide Summary

**I regenerated the generated pages and committed them, and tidied the generator's own wording. About these docs and the docs README now describe the real pipeline. The code-style guide now teaches Svelte 5 runes, and the CI workflows page lists the real jobs. About, the landing page and the 29 Publishers' Guide pages are audited and corrected only where the code proves a fact; the 22 research-quote blocks are unchanged. The audit ledger has no `pending` verdict left. `generate:docs` exits 0 and a second run changes nothing.**

## Performance

- **Duration:** about 24 min
- **Started:** 2026-10-02T12:03:29Z
- **Completed:** 2026-10-02T12:27:06Z
- **Tasks:** 3 of 3
- **Files modified:** 131 in the plan diff (`f5a1be474..c474c56d3`), 107 of them generated pages

## Accomplishments

- **Regeneration (D-14).** At HEAD the pruning generator deleted the orphan `EntityCardAction` page. It also picked up `QuestionArguments`' current docstring and dropped the `api/cache` route that 167 removed. `navigation.config.ts` did not change.
- **Generator wording.** All changes are in the scripts; a second run reproduces them exactly.
  - The component index names its three source directories and how to regenerate. Its first sentence is kept verbatim, because the components skill quotes it.
  - Source links are labelled `Component` and `Types`.
  - An embedded directory README sits under "Directory README", with a tree link and its headings moved down one level, so each page has a single H1.
  - The route map's intro names `apps/frontend/src/routes` and explains the group and parameter notation.
- **About these docs + README (D-13).** These cover:
  - the build: mdsvex with `rehype-slug`, and an adapter-static SPA with a `404.html` fallback and no prerender;
  - the deploy: `docs.yml` runs on pushes to `main` that touch `apps/docs/**` and never on PRs;
  - port 5174 from `vite.config.ts`;
  - the five `generate:docs` steps plus Prettier;
  - the navigation generator: `fixedTitle`, `// New` and `// Removed:`;
  - redirect stubs;
  - every check: the seven link-check classes with `--check`/`--only`/`--scope`, the research-quote gate, lint, check, format and build.

  The README has the real tree and a 17-script table. Nothing mentions typedoc.
- **Contributing (D-04).**
  - **Code-style guide:** now in Svelte 5 runes, based on the code. It covers `$props()` typed by a `.type.ts`, defaults in the destructuring, `$derived`, snippets with `{@render}`, and `concatClass` with tailwind-merge (the caller's class wins). It also covers renaming dashed attributes, the `svelte/store` ban and the third component library. `Button` replaces the dead `IconBase` example, and the `#comments` and `#svelte-components` anchors are kept.
  - **Workflows:** lists the 12 `main.yaml` jobs plus `docs.yml`, `release.yml` and the Claude workflows.
  - **Other fixes:**
    - The `.gitignore` fact on Contribute is corrected.
    - The Git Graph link pointed at ESLint and is fixed.
    - AI agents lists the sources and the trigger and access rules.
- **About (D-05).**
  - The roadmap marks "Update to Svelte 5" as completed.
  - Features changes only where the code proves the status:
    - Multiple-item text and number questions are marked available, and boolean is added as an opinion type.
    - The list of 7 compiled locales is updated.
    - The csv import/export bullet is gone.
    - The local static-data mode is marked partial.
    - Weights and real-time results are marked "not yet available".
  - Typos are fixed.
- **Landing:** current, with no change.
- **Publishers' Guide (D-05, D-07, D-08).** Only prose outside the blocks changed. The corrections:
  - Hosting: a database is always needed.
  - Matching: the metric is fixed in the app, only candidates are hidden for missing answers, and empty answers count as maximally distant.
  - Answer types: yes/no and number questions can also be matched.
  - The voter-view options say "not yet available" for weights and real-time results.
  - Email registration is now described as an invitation.
  - Two typos are fixed.

  The span gate exits 0 with 22/22 spans unchanged.
- **Ledger (D-20).** All 94 `## Pages` rows now carry a verdict and an anchor: 41 updated, 26 current, 26 redirect stubs with their content fate, and `G` regenerated. The Sweep exceptions from 168-04 and 168-07 are copied into it, and three decisions are recorded.

## Task Commits

1. **Task 1: Regenerate, tidy the generator, document the pipeline** (tracer):
   - `78369e329` docs[docs]: regenerate component and route pages
   - `12d04f015` docs[docs]: tidy generated page wording
   - `d26b34902` docs[docs]: document the docs pipeline in About these docs and the README
   - `74ae17fa5` docs(168-07): claims ledger for About these docs, the README and the generator text
2. **Task 2: Contributing, About, landing**:
   - `4987b41bf` docs[docs]: update contributing, about and landing pages
   - `0dc4134a4` docs(168-07): claims for the contributing, about and landing pages
3. **Task 3: Publishers' Guide, ledger fold, full pipeline**:
   - `1b465c7da` docs[docs]: audit the publishers' guide
   - `c474c56d3` docs(168-07): fold every page verdict into the audit ledger, record the pipeline run

**Tracer feedback gate:** this run is interactive (`_auto_chain_active: false`) and `human_verify_mode` is at its default, end-of-phase. Task 1's `<verify>` holds only `<automated>` commands. I re-ran both `<verify>` commands end to end and both exited 0. ⚡ The tracer was verified end to end, so expansion into Tasks 2 and 3 went ahead.

## Gates (exit status read from each command, final HEAD `c474c56d3`)

| Command | exit |
|---|---|
| `yarn workspace @openvaa/docs generate:docs` (run 1, logged) then `git diff --exit-code -- apps/docs` | 0, 0 |
| `generate:docs` (run 2) then `git diff --exit-code -- apps/docs` | 0, 0 |
| `validate:links --check` (unscoped) | 0 (0 findings; 386 GitHub links, 42 inbound refs) |
| `check:research-quotes --base <base> --component-base <component base>` | 0 (22/22 spans) |
| `check-claims.mjs ledger 168-07-CLAIMS.md` | 0 (214 rows) |
| `yarn workspace @openvaa/docs lint` / `check` / `build` / `format:check` | 0 / 0 (652 files, 0/0) / 0 / 0 |
| `yarn assert:comment-hygiene` | 0 |
| D-21 and D-17 sweeps over the Contributing, About, landing, Publishers' Guide and About these docs pages | exit 1 everywhere, except the two recorded exceptions (the roadmap Strapi line and the workflows `docker-image-build` job) |

## Decisions Made

See `key-decisions`. They are also recorded in `168-DOCS-AUDIT.md` § Decisions recorded at execution.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] About these docs prose tripped two gates**
- **Found during:** Task 1.
- **Issue:** First, a literal `` `<ResearchQuote>` `` in the page would count as an added block, because `check-research-quotes.ts` fails on any `<ResearchQuote` outside the base files. Second, a literal `` `href="/…"` `` was parsed as an internal link by the `svelte-href` class (scoped check exit 1, 1 finding).
- **Fix:** I reworded both: "blocks of the `ResearchQuote` component", and "an `href` attribute (a value that starts with `/`)".
- **Verification:** The scoped link check exits 0 and the span gate exits 0.
- **Committed in:** `d26b34902`

**2. [Rule 1 - Bug] Generated README link rewritten into a mislabelled directory link**
- **Found during:** Task 1, step 2.
- **Issue:** The new "Directory README" source link ended in `/README.md`. `move-generated.ts`'s `transformMarkdownLinks` rewrites every such link to its directory, so the link text said README.md but the link pointed at a `/blob/` directory URL.
- **Fix:** The generator emits a `/tree/main/<dir>` link with the directory as its text ("From the README in …").
- **Committed in:** `12d04f015`

**3. [Rule 2 - Correctness] Two features page bullets fixed during the Task 3 audit**
- **Found during:** Task 3.
- **Issue:** The Publishers' Guide audit showed that real-time top results and voter-set weights do not exist in the frontend. About › Features (a Task 2 page) listed both without qualification.
- **Fix:** Both are marked "not yet available" on Features too. The edit is committed with Task 3, and the Features verdict row records it.
- **Committed in:** `1b465c7da`

### Other deviations

- **[Convention]** Code commits use `docs[docs]:`, as in 168-01 and 168-02. The planning commits use `docs(168-07):` with `--no-verify`, because they touch only `.planning`.
- **[Interpretation]** The plan said to edit `about/roadmap` and `about/features` "only for facts the code proves". I applied the same standard to the typo fixes on Association, Project, Issues and the data-collection pages. These are editorial, change no fact, and are recorded in each verdict row.
- **[Scope, minor]** Three cross-page anchor links on Pull Request and Contribute lost a trailing slash before `#`. The link check passes either way.

**Total deviations:** 3 auto-fixed (2 Rule 1, 1 Rule 2), 3 minor. **Impact:** none on scope; every fix was needed for a gate or a correct fact.

## Issues Encountered

- `tsc -p apps/docs/scripts/tsconfig.json --noEmit` fails with `TS2307: Cannot find module 'unified'` inside `mdsvex`'s type declarations. No gate runs that command; `check`, `lint` and `build` all pass. This predates the plan and is recorded as finding F2 in `168-07-CLAIMS.md`.
- `.claude/skills/components/SKILL.md` still says the sibling `generate:*` scripts are broken. 168-01.1 already repaired them. This is recorded as finding F1 for 168-08, because the skill is not a docs-site page.

## Findings for 168-08 (in `168-07-CLAIMS.md` § Findings for todos)

- **F1:** The components skill text has drifted (see above).
- **F2:** The scripts `tsc` error (see above).
- **F3:** Voter-set statement weights and real-time top results do not exist in the frontend. Whether either is still planned is an operator question.
- **F4:** No static, database-free mode exists at HEAD (`createDataProvider` always returns the Supabase provider). This is the same disposition as 168-05 F1.

## User Setup Required

None.

## Next Phase Readiness

- 168-08 can run its final gates now:
  - The ledger has no `pending` verdict.
  - Every writer plan's sweep exceptions are in the ledger.
  - `generate:docs` and the unscoped link check are green and idempotent at `c474c56d3`.
- **Requirements:** DOCS-01, 02, 03, 04 and 06 are all shared with 168-08 (its frontmatter lists all eight), so none is marked complete here.

## Known Stubs

None. Every page this plan touched has a body. The generated pages come from the generator.

## Self-Check: PASSED

- FOUND: `168-07-CLAIMS.md`, `gate-evidence/168-07-pipeline.txt` (a run record header, then the run-1 log ending with `exit=0`), `about-these-docs/+page.md`, `apps/docs/README.md`, the generated index `+page.md`.
- ABSENT, as intended: the `EntityCardAction` generated page.
- FOUND commits: `78369e329`, `12d04f015`, `d26b34902`, `74ae17fa5`, `4987b41bf`, `0dc4134a4`, `1b465c7da`, `c474c56d3`.
- `git status --short` was empty before this SUMMARY was written.

---
*Phase: 168-docs-site-rewrite-strapi-to-supabase*
*Completed: 2026-10-02*
