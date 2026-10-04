# Phase 168: Docs-Site Rewrite — Strapi to Supabase - Context

**Gathered:** 2026-10-01
**Status:** Ready for planning

**Source of decisions:** `.planning/v2.15-166-169-DISCUSSION-POINTS.md` § *Phase 168 — Docs-Site
Rewrite — Strapi to Supabase* (with its page-inventory appendix and cross-phase notes), one section of
a single checkbox document covering phases 166–169 that the operator filled in one pass and recorded
in commit `e65bed5cf` ("docs(166-169): record the filled discussion decisions"). Its rule: an
unticked decision accepts the `★ RECOMMENDED` option; a ticked box overrules; `**EDIT:**` /
`**NOTE:**` free text beats every box. **The operator ticked no box and wrote no EDIT or NOTE text
anywhere in the Phase 168 section** (verified against `git show e65bed5cf`, whose eight ticks all
fall in the 166, 167 and 169 sections). Every Phase 168 decision below is therefore its `★` option,
as written. The section's own fill-status line says "24 decisions", but the IDs it enumerates
(0.1, A1–A5, B1–B2, C1–C3, D1–D4, E1–E3, F1–F4) number **22**; this file carries all 22, one
D-entry each. The scout grounding was HEAD `89a4bd9ff` on `fix/888-review-findings`, worktree `-gsd`.

<domain>
## Phase Boundary

Every page of the docs site (`apps/docs`) describes the system that exists — the Supabase backend,
Edge Functions, Paraglide i18n, `@openvaa/dev-seed`, the single repo-root `.env` model, Svelte 5
runes, the admin app, the current features and settings — with no Strapi-era page, banner or nav
entry left. The Developers' Guide's information architecture is reorganised where the old structure
no longer fits (D-02). Every other docs page (About, the Publishers' Guide, the landing page, the
generated component and route pages) is audited and recorded as current / updated / merged /
deleted / redirect stub (D-20).

The seven draft success criteria are fixed by `.planning/ROADMAP.md` § *Phase 168*: (1) VESTIGES
pages rewritten, merged or deleted and the four Strapi nav titles gone; (2) every other page audited,
`<ResearchQuote>` blocks byte-identical by diff; (3) VESTIGES sweeps #1, #2, #5–#7, #9, #10 clean
under `apps/docs` bar recorded exceptions; (4) every factual claim verified against the code;
(5) candidate-flow pages match the current flows and the three related todos are updated or closed;
(6) the broken docs scripts dealt with; (7) docs build, docs lint/check, link check.

**Widened 2026-10-01 (operator):** not only the ~30 VESTIGES pages but every docs page is in scope.

**Not in this phase:**
- Editing any `<ResearchQuote>` block or `apps/docs/src/lib/components/ResearchQuote.svelte` (D-07, D-08).
- Reorganising About or the Publishers' Guide trees; they keep their structure (D-02, D-05).
- Any product-code change. The dead password-reset `?code=` branch, if it exists, is **not** removed
  here; it goes to a code phase (D-18). Hence no E2E gate (D-22).
- typedoc API-reference generation (D-13 deletes the dead typedoc wiring instead of implementing it).
- A generator for the settings reference (D-06 re-derives by hand from the type).
- Stating version numbers that Phase 169 could change (D-17).
- Rider 2 (sqlfluff in the roadmap) and Rider 3 (`$voter`, already fixed in `dad6569be`) of the
  broken-scripts todo — recorded in the ledger as out of scope / already done (D-13).

</domain>

<decisions>
## Implementation Decisions

Decision IDs map one-to-one onto the discussion document's `168-XX` IDs, given in parentheses.
Every decision is locked; the planner does not re-open them. The discussion document holds the
rejected options and their costs and is the reference if a plan wants to reopen one.

### 0 — Factual baseline

- **D-01 (168-0.1):** All 15 scout facts are accepted as the phase's factual baseline and restated
  here. Facts 4, 5, 6, 9 and 10 are not in the roadmap entry, and each changes the work (more pages,
  a new check, a deletion instead of a fix, a gate that does not gate, a lint gate not wired in).
  Counts are a snapshot at `89a4bd9ff`; **the planner re-derives every population at run time**
  (post-166/167 HEAD, see D-16) and never bends work to a count.

  | # | Fact (at `89a4bd9ff`) |
  |---|---|
  | 1 | **199 page files**: 93 hand-written (92 under `(content)/` + landing `+page.svelte`) and 106 generated (104 component pages, the component index, the route map). |
  | 2 | Roadmap "~30 pages / 25 banners" confirmed: VESTIGES lists 30 (29 hand-written + 1 generated). Exactly 25 pages carry a banner: 13 "This page documents the legacy Strapi backend…", 12 "Parts of this page reference…". |
  | 3 | Sweep hit counts scoped to `apps/docs`: #1 Strapi 168 hits / 27 files (incl. `navigation.config.ts`) · #2 `vaa-strapi` 41/12 · #5 `$t(`/`$locale` 4/2 · #6 LocalStack 7/3 · #7 awslocal 1/1 · #9 `GENERATE_MOCK_DATA` 8/3 · #10 old env names 27/4. `sveltekit-i18n` (2) and `parser-icu` (1) sit in `localization/intro`. |
  | 4 | **At least 12 stale pages outside the VESTIGES list** that no Strapi/env pattern catches: `development/intro` (nav "Docker"; Docker + LocalStack) · `development/requirements` (Docker, port 1337) · `quick-start` (Docker `yarn dev`, ports swapped, Strapi `admin/admin`) · `frontend/intro` ("currently uses Svelte 4") · `contributing/code-style-guide` (Svelte 4 note, `export let`, `$$Props`, `$$restProps`, dead `IconBase` link) · `localization/locale-routes` (`[[lang]]` param, `I18nContext` store; CLAUDE.md: no locale route param, Paraglide `url` strategy) · `localization/locale-selection-step-by-step` (links the gone `routes/[[lang=locale]]/+layout.ts`) · `frontend/contexts` (members described as "stores") · `candidate-user-management/mock-data` (links the Strapi mock-users page) · `about/roadmap` ("Update to Svelte 5" listed as upcoming) · `about/features` (multiple-item text "to be added", but `2026-05-31-implement-multiple-text-question-input` is completed) · `auto-documentation` (points at a stale README). |
  | 5 | **39 GitHub source links point at non-existent paths** (of 322 unique `github.com/OpenVAA/voting-advice-application/(blob\|tree)/main/<path>` targets): 26 into `backend/vaa-strapi/…`, 3 into `adapters/strapi`, the rest `IconBase.svelte/.type.ts`, `EntityCardAction.svelte/.type.ts`, `lib/stores/stores.ts`, `utils/authenticationStore.ts`, `routes/[[lang=locale]]/+layout.ts`, and one `(protected)` parse artefact. **No tool checks these.** |
  | 6 | The generated `EntityCardAction` page documents a component that no longer exists (VESTIGES' "fixed in `985f26a6c`" only rewrote its path text). Frontend has 29 dynamic components; 30 are generated. |
  | 7 | `<ResearchQuote>` appears **22 times in 6 pages**, all under `publishers-guide/preparing/`: `intro` 1, `matching` 4, `the-specifics-of-the-elections` 2, `the-statements-or-questions-posed` 6, `the-voter-see-when-using` 8, `what-other-information-is-collected` 1. None of the 6 has a Strapi hit or banner. |
  | 8 | `scripts/validate-links.ts` (`yarn validate:links`) scans **only `.md`** under `src/routes`, resolves internal links, **rewrites relative links to absolute in place** (`fs.writeFile`), exits 1 on a broken link. It ignores `.svelte` pages (landing, `about/newsletter`), `navigation.config.ts` routes, heading anchors (`utils/links.ts` strips `#hash`) and GitHub links. |
  | 9 | **The docs build cannot catch a broken link:** no `prerender` anywhere in `apps/docs`; `adapter-static` with `fallback: '404.html'` → pure SPA; `build/` holds exactly one HTML file. |
  | 10 | **Docs lint is not in the root `lint:check` gate:** `apps/docs` has no `lint` script (only `lint:local`, `lint:full`), so `turbo run lint` skips it. `yarn lint:local` crashes on this host with Node `ERR_INTERNAL_ASSERTION` while loading the config (Node v24.14.1) — **cause UNCONFIRMED**. `yarn check` (svelte-check) passes: 611 files, 0/0. |
  | 11 | Broken-scripts todo still holds, plus one item: root `docs:generate`, `docs:typedoc`, `docs:typedoc-frontend`, `docs:components`, `docs:routes` name non-existent workspace scripts; `generate:component-docs` runs a missing `extract-component-docs.ts`; `TYPEDOC_CONFIG` (in `docs-scripts.config.ts`) points at a missing `scripts/config/`; `getTypeDocLink` is commented out. **New:** `test:e2e` points Playwright at `testDir: 'e2e'`, which does not exist. `generate:docs` is the one working entry point and the one CI runs. |
  | 12 | `navigation.config.ts` (469 lines, 106 `title:` entries) is semi-generated: `generate-navigation-config.ts` keeps hand-set order, refreshes titles from the page H1 unless `fixedTitle`, marks new/removed items with comments. The four Strapi titles are present. |
  | 13 | **17 inbound references outside `apps/docs`**: `.agents/code-review-checklist.md` (4, to `contributing/code-style-guide` and siblings), `.github/PULL_REQUEST_TEMPLATE` (2), root `README.md` (4), seven frontend/app-shared READMEs (11 links to `frontend/{data-api,components,contexts,routing}`, `candidate-user-management`, `configuration/{static-settings,app-settings}`), `.claude/skills/components/SKILL.md` and `.claude/skills/README.md` (the generated component index). Plus public `openvaa.org` URLs. |
  | 14 | The docs site deploys only from `main`, only when `apps/docs/**` changes (GitHub Pages, `.github/workflows/docs.yml`). CI runs `yarn generate:docs` before every build, so committed generated pages are what the deploy rebuilds. |
  | 15 | **The system to describe:** Supabase at `apps/supabase/` (one migration file, `schema/`, `seed.sql`, pgTAP `tests/`, Edge Functions `identity-callback`, `invite-candidate`, `send-email`); `@openvaa/dev-seed` templates `default` and `e2e/{base,perm}`; scripts `yarn dev` (= `db:start` + concurrent dev server), `db:reset`, `db:seed [--template]`, `db:reset-with-data`, `db:types`; env files root `.env.example` (35 vars), `functions/.env.example` (10), `apps/frontend/.env.example` (0); Paraglide i18n through the `t()` wrapper and runtime overrides; Svelte 5 runes; an admin app (`argument-condensation`, `jobs`, `question-info`); Render frontend + Supabase Cloud deployment. **Fact 15 is pre-166/167 and must be re-derived** — 167 changes the env model (D-16). |

### A — Scope and information architecture

- **D-02 (168-A1) ⚠:** **Reorganise the Developers' Guide into the tree below.** Each section maps
  to one system that exists; "Backend" becomes "Backend (Supabase)". About and the Publishers' Guide
  keep their trees (D-05). Order is set by hand in `navigation.config.ts`; `generate-navigation-config.ts`
  then runs as a consistency check — **after the run, no "New" or "Removed" markers may remain**.

  ```
  Developers' Guide
  ├── Quick start                      (rewritten: yarn install → .env → yarn dev → db:seed)
  ├── Architecture                     (was app-and-repo-structure; + data flow: adapter → Supabase)
  ├── Development
  │   ├── Requirements                 (Node/Yarn/Supabase CLI/Docker-for-Supabase; no 1337)
  │   ├── Running the development environment   (dev:* vs db:* scripts; merges development/intro)
  │   ├── Monorepo and Turborepo
  │   ├── Seed data (dev-seed)         (NEW; replaces backend/mock-data-generation + default-data-loading
  │   │                                 + candidate-user-management/mock-data)
  │   └── Testing                      (unit, pgTAP, E2E + preflight)
  ├── Configuration
  │   ├── Environment variables        (root .env, functions/.env, PUBLIC_PROJECT_ID; merges frontend/environmental-variables' rules)
  │   ├── Static settings · App settings · App customization
  ├── Backend (Supabase)
  │   ├── Overview                     (schema, migrations, project scoping; replaces backend/intro)
  │   ├── Authentication and authorisation (Supabase Auth, PKCE, grants, access-token hook, RLS;
  │   │                                 replaces backend/authentication + backend/security)
  │   ├── Edge Functions               (NEW: identity-callback, invite-candidate, send-email)
  │   ├── Email                        (NEW: send-email, Inbucket locally; replaces SES/LocalStack prose)
  │   ├── Data import and deletion     (bulk RPCs; replaces openvaa-admin-tools-plugin-for-strapi)
  │   └── Generated types              (supabase-types / db:types; replaces re-generating-types)
  ├── Frontend
  │   ├── Overview (Svelte 5 runes) · Routing (+generated) · Contexts · Data API and adapters
  │   │   (merges accessing-data-and-state-management + data-api) · Components (+generated) · Styling
  ├── Localization
  │   ├── Overview (Paraglide + t()) · Supported locales · Locale resolution (url strategy;
  │   │   merges locale-routes + locale-selection-step-by-step) · Translations and overrides
  │   │   (merges local-translations + localization-in-the-frontend + localization-in-strapi) · Multi-locale data
  ├── Candidate app
  │   ├── Pre-registration and invitation · Registration · Login and password reset
  │   ├── Bank authentication (OIDC)   (NEW; links docs/key-generation.md)
  │   └── Password validation
  ├── Admin app                        (NEW, short: argument-condensation, jobs, question-info; absorbs llm-features)
  ├── Deployment                       (Render frontend + Supabase Cloud; render.example.yaml)
  ├── Contributing                     (unchanged tree; code-style-guide updated)
  ├── Troubleshooting                  (Supabase/dev-server sections only)
  └── About these docs                 (was auto-documentation; generation pipeline)
  ```
  The four Strapi nav titles ("Strapi", "OpenVAA admin tools plugin for Strapi", "Localization in
  Strapi", "Registration Process in Strapi") leave `navigation.config.ts`.
  — **Reversibility:** costly — URLs move (D-04 stubs them), inbound references are repointed, and
  pages are merged; undoing means splitting merged pages back out and re-repointing.

- **D-03 (168-A2):** **Merge or delete, never rewrite one-to-one to keep a page alive.** Each Strapi
  page is merged into the D-02 page that now covers its topic, or deleted when no current equivalent
  exists. The audit ledger (D-20) records `merged → <target>` or `deleted (no equivalent: <reason>)`
  for every one. Examples fixed by the discussion: `backend/customized-behaviour` and `backend/plugins`
  have no Supabase equivalent (delete); `backend/security` (211 lines of Strapi route policies) is
  replaced by the RLS and grants content in "Authentication and authorisation". The six stubs
  (`backend/{intro,customized-behaviour,plugins,preparing-backend-dependencies,re-generating-types,running-the-backend-separately}`)
  and the four obsolete-system pages (`openvaa-admin-tools-plugin-for-strapi`, `localization-in-strapi`,
  `registration-process-in-strapi`, `backend/security`) follow the per-page fates in the inventory below.
  Content that is still correct (e.g. most of the two app-settings pages) is kept, not discarded.

- **D-04 (168-A3) ⚠:** **Keep URLs with inbound references where D-02 allows; redirect-stub every
  other moved or deleted URL; repoint every in-repo inbound reference in the same plan; the link
  check (D-12) checks the stubs.** A redirect is a stub `+page.ts` that throws SvelteKit's
  `redirect()` (works client-side in the pure SPA, fact 9).
  - **URLs that do not move** under D-02: `contributing/*`, `frontend/{components,contexts,routing}`,
    `configuration/{static-settings,app-settings}`, `quick-start`.
  - **Stubs needed** (at minimum): `candidate-user-management/*` (section renamed to `candidate-app`),
    `frontend/data-api` (merged), and the removed backend pages; plus every other moved route the
    D-02 tree implies (e.g. `app-and-repo-structure` → Architecture, `auto-documentation` → About
    these docs) — the planner derives the full moved-URL list from the final tree.
  - Every stub is recorded in the ledger (D-20, verdict `redirect stub`) so a later phase can retire them.
  - `.agents/code-review-checklist.md`'s code-style-guide link is mandatory-path (CLAUDE.md makes the
    checklist binding for review) and must keep resolving.
  — **Reversibility:** reversible — stubs are standalone files; removing one is a single deletion.

- **D-05 (168-A4):** **Audit every page.** Prose outside `<ResearchQuote>` blocks may be corrected;
  the blocks themselves never change (D-07). `about/roadmap` and `about/features` are corrected only
  for facts the code proves (shipped / not shipped); the operator-authored plans in them are left as
  written. The Publishers' Guide (33 pages) and About (7 pages) keep their trees.

- **D-06 (168-A5):** **Re-derive the two app-settings pages from the code.** For
  `publishers-guide/app-settings` and `developers-guide/configuration/app-settings`, each documented
  key and default is re-derived from `packages/app-shared/src/settings/` (the type plus the defaults).
  Keys that no longer exist are removed; new keys are added. The page links the type file rather than
  restating the type. No generator is built.

### B — Research interludes (byte-identity)

- **D-07 (168-B1):** **Span-level byte-identity gate script.** It extracts every
  `<ResearchQuote …>…</ResearchQuote>` span, opening tag included, from the 6 pages at the phase base
  revision and again at HEAD, and compares the two **ordered** lists byte for byte. It also asserts
  `git diff --exit-code <base> -- apps/docs/src/lib/components/ResearchQuote.svelte`. The base
  revision and both extracts go into the phase's `gate-evidence/`. The count (22 at scout time) is
  derived at run time, never hard-coded. **Negative control:** a one-character edit inside one block
  must make the script fail before the real run is accepted. Span matching (not whole-file freeze) is
  what lets surrounding prose be corrected under D-05.

- **D-08 (168-B2):** The `import ResearchQuote` line and the **order** of the blocks must survive;
  surrounding headings may change and line positions are not frozen. D-07's ordered-list comparison
  enforces order; a missing import fails `yarn check`.

### C — Verifying claims against the code (criterion 4)

- **D-09 (168-C1) ⚠:** **Per-plan claim ledgers plus one independent verifier pass.** Each rewrite
  plan writes a claim ledger for the pages it touches: one row per command, env name, file path or
  flow, each with a **content anchor** (file plus symbol or quoted string — never a line number). At
  the end, one independent `gsd-doc-verifier` pass over every changed page compares its findings with
  the ledgers. Writers cite as they go; a second reader catches what the writer believed.

- **D-10 (168-C2):** **A standing GitHub-source-link check.** Every
  `github.com/OpenVAA/voting-advice-application/(blob|tree)/main/<path>` link in
  `apps/docs/src/routes` must resolve to a tracked path at HEAD. It is wired into `validate-links.ts`
  (or a sibling script that `generate:docs` calls) so CI's docs job runs it. The 39 dead targets of
  fact 5 are fixed (repointed or removed) under it.

- **D-11 (168-C3):** **Commands in code blocks are matched and, where safe, run.** Every `yarn …`
  command is matched to a script in the named workspace's `package.json`. The non-destructive ones
  (`yarn install`, `db:start`, `db:seed --template default`, `yarn dev` start-up, `generate:docs`,
  `check`, `build`) are actually run once, output kept in `gate-evidence/`.

### D — Tooling

- **D-12 (168-D1):** **Extend `validate-links.ts`; add no dependency.** It additionally checks
  `.svelte` page `href`s, every `route` in `navigation.config.ts`, `#anchor` targets (against the
  `rehype-slug` ids), the redirect stubs (D-04) and the GitHub-path check (D-10). Add a `--check`
  mode that reports without rewriting files; the gate uses `--check`. No off-the-shelf crawler —
  Phase 169 is bumping dependencies, so a new one here is unwelcome.

- **D-13 (168-D2) ⚠:** **Repair what has a live counterpart, delete what does not, close the todo.**
  - Rename the three root scripts `docs:generate`, `docs:components`, `docs:routes` to the real
    workspace script names.
  - Point `generate:component-docs` at `generate-component-docs.ts`.
  - Delete `docs:typedoc`, `docs:typedoc-frontend`, `TYPEDOC_CONFIG`, the commented-out
    `getTypeDocLink`, and `test:e2e` + `playwright.config.ts` (no `e2e/` dir).
  - Declare `glob` in `apps/docs/package.json` (Rider 1).
  - Update the docs README and the auto-documentation page ("About these docs") to match.
  - Close `2026-08-28-broken-docs-script-references.md`. Rider 2 (sqlfluff in the roadmap) and
    Rider 3 (`$voter`, already fixed in `dad6569be`) are recorded in the ledger as out of scope /
    already done.
  - No typedoc feature is implemented. The `typedoc` devDependency is then consumer-less (see the
    reconciliation note under Cross-phase).
  — **Reversibility:** reversible — reviving typedoc later means re-adding config and scripts; nothing
  deleted here is load-bearing.

- **D-14 (168-D3):** **Regenerate, commit, then audit the generator's template text.** Run
  `yarn generate:docs` after the frontend is final for this phase (i.e. at the post-166/167 HEAD);
  this deletes the orphan `EntityCardAction` page (fact 6). Commit the result, then audit the
  generator's own template text (the intro and the "Source" wording) like any other page. Generated
  pages stay committed (`.claude/skills/components/SKILL.md` and `.claude/skills/README.md` cite the
  committed index). No hand-fixing of generated pages.

- **D-15 (168-D4):** **Wire docs lint into the root gate.** Add a `lint` script to `apps/docs` so
  root `lint:check` (`turbo run lint`) covers the docs. **Diagnose the `lint:local` crash first** and
  record its cause as confirmed or UNCONFIRMED before calling it a host problem (standing lesson:
  agent root-cause claims are UNCONFIRMED until re-tested in isolation).

### E — Inputs from sibling phases and todos

- **D-16 (168-E1) ⚠:** **Plan now; execute only after both 166 and 167 are merged.** The roadmap
  lists only 167; the scout found 166 too — 166 rewrites the flows the candidate and auth pages
  describe (`invite-candidate` writes only the grant, `identity-callback` looks candidates up by
  grant, `auth_user_id` retired). The candidate-app, auth, env and tooling plans each read the relevant
  166/167 SUMMARY.md and **re-derive the facts at that HEAD**. Writing those pages against the pre-166
  flow would make them stale on arrival.
  — **Reversibility:** cheap — a sequencing choice only.

- **D-17 (168-E2):** **No changeable version numbers in prose.** Pages state no Node, Svelte,
  SvelteKit, Vite or Supabase CLI versions that Phase 169 could change; they link `package.json`
  `engines`, the catalog or the README instead, and say "Svelte 5" only where the major is the point.
  A cross-phase note asks 169 to re-run the docs build and link gate (see Cross-phase).

- **D-18 (168-E3):** **Document behaviour; do not change it.**
  - `register-page-registrationkey-method.md`: **close as superseded** (its own header says the
    2026-09-15 refactor todo "can close this one"). The Registration page describes the invite flow as
    it is now, and the code method only as the declared contract that throws.
  - `password-reset-code-method.md`: settle its first question (is the `?code=` branch reachable?) **by
    reading the code**; document only the live session-based flow; **leave the todo open** if the dead
    branch is still there, so the code change goes to a code phase.
  - `configurable-mock-data.md`: **close as satisfied by `@openvaa/dev-seed`** (`db:seed --template`,
    `db:reset-with-data`), citing the scripts — or narrow it to whatever "on initialise" behaviour the
    operator still wants.

### F — Plan shape, ledger and gates

- **D-19 (168-F1) ⚠:** **Eight plans, split by section, in waves:**
  - **01** — baseline and tooling: the ResearchQuote base extract (D-07), the `validate-links`
    extensions and GitHub-path check (D-09/D-10/D-12), the docs `lint` wiring (D-15), the script
    repairs (D-13), and the audit ledger opened with all 93 rows (D-20).
  - **02** — IA skeleton: new directories, `navigation.config.ts`, redirect stubs, repointing the 17
    inbound references (D-02, D-04).
  - **03–06**, in parallel after 02: **03** Backend (Supabase) and Seed data · **04** Development,
    Configuration, Deployment, Troubleshooting, Quick start · **05** Frontend and Localization ·
    **06** Candidate app, Admin app and both app-settings pages.
  - **07** — About, the landing page, Contributing, the Publishers' Guide audit, and regenerating the
    generated pages (D-14).
  - **08** — gates, the `gsd-doc-verifier` pass, the sweeps, the todo reconciliation.

  Sections do not share pages, so 03–06 cannot conflict. Each plan writes its own claim-ledger rows.
  **Commit `.planning` docs before spawning parallel planners or executors** (standing lesson:
  parallel GSD agents clobber uncommitted ROADMAP edits).

- **D-20 (168-F2):** **One `168-DOCS-AUDIT.md` ledger** in the phase directory: one row per
  hand-written page (93 at scout time) plus one row for the generated set. Columns: old route, new
  route, verdict (`current` / `updated` / `merged → X` / `deleted` / `redirect stub`), what changed,
  claim-ledger anchor, and whether the page holds ResearchQuote blocks.

- **D-21 (168-F3):** **Sweeps = VESTIGES patterns plus three new ones.** Re-run VESTIGES #1, #2,
  #5–#7, #9, #10 scoped to `-- apps/docs`, plus: `-i docker` outside deployment/production-build
  prose; `Svelte 4|export let|\$\$Props|\$\$restProps`; and `\[\[lang`. Every remaining hit is listed
  in the ledger with a reason. Expected intentional hits: the `about/roadmap` history line; the
  docs-app sweep-pattern text, if any.

- **D-22 (168-F4):** **The gate set:** `yarn workspace @openvaa/docs generate:docs` (already runs
  `validate-links`), `check`, `build`, `lint:full`, the extended link check in `--check` mode (D-12),
  the ResearchQuote diff (D-07), the sweeps (D-21), and root `lint:check` + `format:check` (which now
  include the docs, D-15). **No E2E run** — no product code changes (D-18 keeps it that way). Gate
  status is read from the exit code, **never through a pipe**.

### Claude's Discretion

The discussion document leaves only these to the planner:

- Whether the GitHub-path check lives inside `validate-links.ts` or in a sibling script that
  `generate:docs` calls (D-10: "or").
- For `configurable-mock-data.md`, whether to close it or narrow it — narrowing only if the operator
  still wants an "on initialise" behaviour; default is close (D-18).

</decisions>

<page_inventory>
## Page Inventory (hand-written pages, HEAD `89a4bd9ff`)

Restated from the discussion document's appendix. Legend: **L** lines · **B** ● = legacy-Strapi
banner · **RQ** `<ResearchQuote>` count · **Status** `V` VESTIGES list, `S` stale (fact 4), `?` audit
needed, `✓` looks current (still audited). Fate = D-02 / D-03. Re-derive at run time.

| Route (under `(content)/`) | L | B | RQ | Status | Fate |
|---|---|---|---|---|---|
| about/association · intro · newsletter (.svelte) · project · rules | 29·5·55·49·95 | – | – | ? | audit |
| about/features | 118 | – | – | S | update shipped/not-shipped |
| about/roadmap | 12 | – | – | V(intentional)+S | fix "Svelte 5" status only |
| developers-guide/app-and-repo-structure | 24 | – | – | ✓ | → Architecture (+data flow) |
| developers-guide/auto-documentation | 7 | – | – | S | → About these docs |
| developers-guide/backend/authentication | 35 | ● | – | V | merge → Auth and authorisation |
| developers-guide/backend/customized-behaviour | 5 | ● | – | V | delete (no equivalent) |
| developers-guide/backend/default-data-loading | 13 | ● | – | V | merge → Seed data |
| developers-guide/backend/intro | 5 | ● | – | V | → Backend overview |
| developers-guide/backend/mock-data-generation | 56 | ● | – | V | merge → Seed data |
| developers-guide/backend/openvaa-admin-tools-plugin-for-strapi | 139 | ● | – | V | delete; Data import and deletion (new) |
| developers-guide/backend/plugins | 7 | ● | – | V | delete (no equivalent) |
| developers-guide/backend/preparing-backend-dependencies | 10 | ● | – | V | delete / fold into Running dev env |
| developers-guide/backend/re-generating-types | 5 | ● | – | V | → Generated types |
| developers-guide/backend/running-the-backend-separately | 9 | ● | – | V | fold into Running dev env (db:*) |
| developers-guide/backend/security | 211 | ● | – | V | replace → Auth and authorisation (RLS/grants) |
| developers-guide/candidate-user-management/creating-a-new-candidate | 40 | ● | – | V | → Candidate app / Pre-registration and invitation (post-166) |
| developers-guide/candidate-user-management/mock-data | 3 | – | – | S | delete → link to Seed data |
| developers-guide/candidate-user-management/password-validation | 85 | – | – | ✓ | move → Candidate app |
| developers-guide/candidate-user-management/registration-process-in-strapi | 33 | ● | – | V | → Candidate app / Registration |
| developers-guide/candidate-user-management/resetting-the-password | 16 | ● | – | V | → Login and password reset |
| developers-guide/configuration/intro · static-settings | 8·16 | – | – | ? | audit |
| developers-guide/configuration/app-customization · app-settings | 17·37 | ● | – | V | update (D-06) |
| developers-guide/configuration/environmental-variables | 23 | ● | – | V | rewrite (env files; post-167) |
| developers-guide/contributing/code-style-guide | 250 | – | – | S | update Svelte 5 sections (URL fixed: inbound links) |
| developers-guide/contributing/contribute · issues · pull-request · recommended-ide-settings-code · workflows · ai-agents | 42·36·44·22·3·5 | – | – | ? | audit (workflows: CI detail) |
| developers-guide/deployment | 279 | ● | – | V | rewrite (Render + Supabase Cloud) |
| developers-guide/development/intro | 3 | – | – | S | merge → Running dev env |
| developers-guide/development/monorepo | 54 | – | – | ? | audit (Turborepo, watch claim) |
| developers-guide/development/requirements | 7 | – | – | S | rewrite |
| developers-guide/development/running-the-development-environment | 37 | ● | – | V | rewrite |
| developers-guide/development/testing | 78 | ● | – | V | rewrite (unit, pgTAP, E2E preflight) |
| developers-guide/frontend/accessing-data-and-state-management | 192 | ● | – | V | merge → Data API and adapters |
| developers-guide/frontend/components | 11 | – | – | ✓ | keep (URL fixed) |
| developers-guide/frontend/contexts | 48 | – | – | S | update (runes; stable vs reactive) |
| developers-guide/frontend/data-api | 243 | ● | – | V | rewrite → Data API and adapters |
| developers-guide/frontend/environmental-variables | 13 | – | – | V | merge → Configuration / Env vars (post-167) |
| developers-guide/frontend/intro | 7 | – | – | S | rewrite (Svelte 5) |
| developers-guide/frontend/routing | 26 | – | – | ? | audit (URL fixed) |
| developers-guide/frontend/styling | 62 | – | – | ? | audit |
| developers-guide/llm-features | 3 | – | – | ? | fold → Admin app |
| developers-guide/localization/intro | 14 | – | – | V | rewrite (Paraglide) |
| developers-guide/localization/local-translations | 19 | – | – | ? | merge → Translations and overrides |
| developers-guide/localization/locale-routes · locale-selection-step-by-step | 15·31 | – | – | S | merge → Locale resolution |
| developers-guide/localization/localization-in-strapi | 15 | ● | – | V | merge/delete → Translations and overrides |
| developers-guide/localization/localization-in-the-frontend | 40 | – | – | V | merge → Translations and overrides |
| developers-guide/localization/storing-multi-locale-data · supported-locales | 5·10 | – | – | ? | audit |
| developers-guide/quick-start | 19 | – | – | S | rewrite (URL fixed: README link) |
| developers-guide/troubleshooting | 107 | ● | – | V | drop Docker/Strapi sections; keep Husky/Playwright |
| publishers-guide/app-settings | 157 | ● | – | V | update (D-06) |
| publishers-guide/preparing/intro · matching · the-specifics-of-the-elections · the-statements-or-questions-posed · the-voter-see-when-using · what-other-information-is-collected | 30·134·123·266·227·43 | – | 1·4·2·6·8·1 | ? | audit prose outside blocks only (D-07) |
| publishers-guide/preparing/* (11 other pages) | 5–57 | – | – | ? | audit |
| publishers-guide/{intro, publish-with-openvaa, other-information-sources}, what-are-vaas/* (2), data-collection/* (6), after-publishing-the-vaa/* (3) | 3–53 | – | – | ? | audit |
| landing `src/routes/+page.svelte` | 235 | – | – | ? | audit (showcase, project text) |
| generated: 104 component pages + 2 indexes | – | – | – | V(1) | regenerate (D-14); `EntityCardAction` page deleted |

Totals: 93 hand-written pages · 25 banners (13 full-page + 12 partial) · 22 ResearchQuote blocks in 6
pages · 29 VESTIGES pages + 1 generated · ≥12 more stale pages (S) · 39 dead GitHub source links ·
4 Strapi nav titles out of 106.

</page_inventory>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### The phase's own contract
- `.planning/ROADMAP.md` § *Phase 168: Docs-Site Rewrite — Strapi to Supabase* — goal and the seven
  draft success criteria (firmed and registered as requirements at planning).
- `.planning/v2.15-166-169-DISCUSSION-POINTS.md` § *Phase 168* — the 22 decisions with rejected options
  and costs, the appendix, and § *168 — Cross-phase notes*; also § *Cross-phase picture* at the top.
- `.planning/quick/261001-n8y-remove-the-legacy-src-lib-i18n-translati/261001-n8y-VESTIGES.md` —
  § Deferred `apps/docs` pages (the 30-entry list) and the sweep patterns #1–#10.

### Todos the phase updates or closes
- `.planning/todos/pending/2026-08-28-broken-docs-script-references.md` (D-13, closed)
- `.planning/todos/pending/register-page-registrationkey-method.md` (D-18, closed as superseded)
- `.planning/todos/pending/password-reset-code-method.md` (D-18, open if dead branch remains)
- `.planning/todos/pending/configurable-mock-data.md` (D-18, closed / narrowed)

### Upstream phases (read their SUMMARY.md at execution time, D-16)
- `.planning/phases/166-retire-auth-user-id-entity-identity-from-grants/` — grant-only identity,
  `invite-candidate` / `identity-callback` flows.
- `.planning/phases/167-origin-main-vestige-cleanup/` — cache-proxy removal, single root `.env`,
  docs devDependency removals, `OpenVAALogo.svelte` runes fix.

### Standing project rules
- `CLAUDE.md` — Development Environment, Backend, Deployment sections (the system the pages describe);
  "No locale route param" / Paraglide `url` strategy.
- `.agents/code-review-checklist.md` — mandatory for review; its code-style-guide link must keep
  resolving (D-04).
- Memory lessons: content anchors, never line numbers (D-09); never read gate status through a pipe
  (D-22); commit `.planning` before parallel planners (D-19); flag agent root causes UNCONFIRMED (D-15).

</canonical_refs>

<code_context>
## Existing Code Insights

Snapshot at `89a4bd9ff`; re-derive at execution HEAD.

### Reusable Assets
- `apps/docs/scripts/validate-links.ts` + `utils/links.ts` — the link checker D-12 extends (note it
  currently rewrites files in place and strips `#hash`).
- `apps/docs/scripts/generate-navigation-config.ts` — merges hand order with page H1 titles; used as
  D-02's consistency check (no "New"/"Removed" markers left).
- `apps/docs/scripts/generate-component-docs.ts` (and the route-map generator) — run via
  `yarn generate:docs`, the one working entry point and the one CI runs (D-14).
- `rehype-slug` ids — the anchor targets D-12 validates against.
- `apps/docs/src/lib/components/ResearchQuote.svelte` — frozen (D-07).

### Established Patterns
- `apps/docs/src/lib/navigation.config.ts` — hand-ordered, `fixedTitle` overrides H1 refresh.
- Pure-SPA `adapter-static` with `fallback: '404.html'`, no `prerender` — redirects are client-side
  `+page.ts` stubs throwing `redirect()` (D-04); the build checks no links (D-12 fills that gap).
- `apps/docs/package.json` scripts: `check`, `build`, `generate:docs`, `lint:local`, `lint:full`
  (no `lint`, D-15); root `package.json` `docs:*` scripts are the broken ones (D-13).
- `.github/workflows/docs.yml` — deploy from `main` on `apps/docs/**` changes; regenerates first.

### Integration Points
- The 17 inbound references outside `apps/docs` (fact 13) — repointed in plan 02 (D-04, D-19).
- `packages/app-shared/src/settings/` — source of truth for both app-settings pages (D-06).
- `apps/supabase/` (schema, migration, `seed.sql`, pgTAP `tests/`, `functions/{identity-callback,invite-candidate,send-email}`),
  `packages/dev-seed/` templates, root `.env.example`, `apps/supabase/functions/.env.example`,
  `render.example.yaml`, `docs/key-generation.md` — what the rewritten pages cite.

</code_context>

<cross_phase>
## Cross-Phase Notes

- **Execution is serial: 166 → 167 → 168 → 169.** 168 is planned now but **executes only after both
  166 and 167 are merged** (D-16), even though the roadmap lists only 167.
- **From 166:** the candidate-app and auth pages (`creating-a-new-candidate`, registration,
  `backend/authentication`, `backend/security` → RLS and grants) describe the **grant-only** flow:
  `invite-candidate` writes only the grant, `identity-callback` looks candidates up by grant,
  `auth_user_id` is retired.
- **From 167** (167-C1(a), 167-E2, 167-D4(a), all ★ and unticked): there is **no cache proxy** —
  `/api/cache`, `PUBLIC_CACHE_ENABLED`, `CACHE_*`, `flat-cache` and the Render disk step disappear from
  `frontend/data-api`, `frontend/accessing-data-and-state-management` and `deployment`.
  **`BACKEND_API_TOKEN` and `PUBLIC_*_BACKEND_URL` are gone** from `deployment`, `backend/authentication`
  and `frontend/environmental-variables`. The env pages describe a **single repo-root `.env`** that both
  public and private variables are read from. 167's `OpenVAALogo.svelte` runes fix is base for plan 01,
  not redone. 167 leaves the code-style-guide's Svelte 4 `$$restProps` / `concatClass` prose for 168.
- **Reconciliation note (typedoc devDependencies) — resolve at planning, not a new decision:** 168-D2's
  text assumes 167 removes `typedoc-plugin-markdown`, but 167-D4's ★ (a) **keeps** it "for Phase 168's
  typedoc decision". With D-13 (no typedoc feature), both `typedoc` and `typedoc-plugin-markdown` end
  up consumer-less after 168. The planner checks the post-167 manifest and either removes both in plan
  01 alongside the script repairs or records them for 169's dependency pass; either way the ledger
  notes it so no orphan dependency is silently left.
- **To 169:** 169's gate re-runs **168's extended link check (`--check` mode) and the ResearchQuote
  byte-identity diff**, plus the docs production build, because a SvelteKit or mdsvex major could change
  how blocks render. Under D-17 the pages state no versions 169 could change.

</cross_phase>

<specifics>
## Specific Ideas

- The new IA tree in D-02 is to be reproduced as written, including the parenthetical merge targets.
- Redirect stubs are SvelteKit `+page.ts` files throwing `redirect()` — not server config (pure SPA).
- The ResearchQuote gate needs a recorded negative control (one-character edit inside a block → fail)
  before its real run counts.
- `about/roadmap`'s Strapi history line is an expected, recorded sweep exception.

</specifics>

<deferred>
## Deferred Ideas

- **Removing the dead password-reset `?code=` branch**, if reading the code shows it is unreachable —
  stays in `password-reset-code-method.md` for a code phase (D-18).
- **typedoc API reference generation** — not implemented; the dead wiring is deleted (D-13). A future
  phase may revive it.
- **Generating the settings reference from the type** — not built (D-06).
- **Retiring the redirect stubs** — recorded in the ledger for a later phase (D-04).
- **Reorganising About / the Publishers' Guide** — out of scope (D-02, D-05).
- **sqlfluff in the roadmap** (Rider 2 of the broken-scripts todo) — out of scope, ledger-recorded.

</deferred>

---

*Phase: 168-Docs-Site Rewrite — Strapi to Supabase*
*Context gathered: 2026-10-01*
