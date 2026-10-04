# Phase 168: Docs-Site Rewrite — Strapi to Supabase - Research

**Researched:** 2026-10-01
**Domain:** SvelteKit 2 + mdsvex static docs site (`apps/docs`); docs tooling (link checker, generators, ESLint wiring); technical-writing verification against the Supabase-era codebase
**Confidence:** HIGH for tooling and mechanism findings (each reproduced this session); MEDIUM for the post-166/167 end state (planned, not yet on disk)
**Research HEAD:** `ec0cd7810` on `fix/888-review-findings`, worktree `-gsd`. Every count below is a snapshot to re-derive at execution time (D-01, D-16).

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions

Decision IDs map one-to-one onto the discussion document's `168-XX` IDs, given in parentheses.
Every decision is locked; the planner does not re-open them. The discussion document holds the
rejected options and their costs and is the reference if a plan wants to reopen one.

#### 0 — Factual baseline

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

#### A — Scope and information architecture

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

#### B — Research interludes (byte-identity)

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

#### C — Verifying claims against the code (criterion 4)

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

#### D — Tooling

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

#### E — Inputs from sibling phases and todos

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

#### F — Plan shape, ledger and gates

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

### Deferred Ideas (OUT OF SCOPE)

- **Removing the dead password-reset `?code=` branch**, if reading the code shows it is unreachable —
  stays in `password-reset-code-method.md` for a code phase (D-18).
- **typedoc API reference generation** — not implemented; the dead wiring is deleted (D-13). A future
  phase may revive it.
- **Generating the settings reference from the type** — not built (D-06).
- **Retiring the redirect stubs** — recorded in the ledger for a later phase (D-04).
- **Reorganising About / the Publishers' Guide** — out of scope (D-02, D-05).
- **sqlfluff in the roadmap** (Rider 2 of the broken-scripts todo) — out of scope, ledger-recorded.
</user_constraints>

<phase_requirements>
## Phase Requirements (proposed — register at planning)

The roadmap says "Requirements: TBD — registered at planning". The prefix `DOCS-` is unused in
`.planning/REQUIREMENTS.md` (existing prefixes include `REVIEW-DOC`, `PRESHIP`, `PERMFU`, `RNAV`)
[VERIFIED: grep of REQUIREMENTS.md requirement IDs this session]. Proposed IDs, one per draft success
criterion, with tooling and stubs split out because each needs its own negative control under the
REQUIREMENTS.md *Standing acceptance rule* ("prove the guard fails before claiming it guards").

| ID | Description (maps to) | Research support |
|----|-----------------------|------------------|
| DOCS-01 | Every VESTIGES page is rewritten, merged or deleted; the Developers' Guide follows the D-02 tree; the four Strapi nav titles are gone; `generate-navigation-config.ts` leaves no `// New` / `// Removed` marker (SC1, D-02, D-03) | § IA mechanics, § Navigation generator behaviour |
| DOCS-02 | Every page (93 hand-written + the generated set) has a row in `168-DOCS-AUDIT.md`; `<ResearchQuote>` spans are byte-identical to the phase base, proven by a script observed red on a one-character injection (SC2, D-05, D-07, D-08, D-20) | § ResearchQuote gate |
| DOCS-03 | Sweeps #1, #2, #5–#7, #9, #10 and the three new D-21 patterns return no hit under `apps/docs` other than ledger-recorded exceptions (SC3, D-21) | § Sweep commands |
| DOCS-04 | Every factual claim on a changed page has a content-anchored claim-ledger row; one independent `gsd-doc-verifier` pass over every changed page; every `yarn …` command matches a script; the safe ones were run (SC4, D-09, D-11) | § Claim ledger, § Verifier pass, § Command check |
| DOCS-05 | Candidate-app pages describe the post-166 grant-only flows; `register-page-registrationkey-method.md` closed as superseded, `configurable-mock-data.md` closed (or narrowed), `password-reset-code-method.md` settled by reading the code (SC5, D-16, D-18) | § Section source-of-truth map, § Todo leads |
| DOCS-06 | The broken docs scripts are repaired or deleted per D-13; `glob` is declared in `apps/docs`; the generator deletes stale generated pages (orphan `EntityCardAction` gone); typedoc devDependencies reconciled; the todo is closed (SC6, D-13, D-14) | § Generator does not delete stale pages, § typedoc reconciliation |
| DOCS-07 | `validate-links.ts --check` covers `.md` links, `.svelte` hrefs, nav leaf routes, `#anchors`, redirect stubs and GitHub source paths, each observed red on an injected fault; every moved/deleted URL has a stub; every in-repo inbound reference resolves (SC7 link check, D-04, D-10, D-12) | § Link checker design, § Redirect stubs |
| DOCS-08 | `apps/docs` has a `lint` script that root `lint:check` runs; the config loads (crash cause recorded); docs lint is green and observed red on an injected violation; docs `check`, `build`, `format:check` green (SC7 build/lint/check, D-15, D-22) | § Docs lint is broken twice over |
</phase_requirements>

## Summary

The phase is mostly technical writing, but four tooling facts decide whether its gates mean anything,
and two of them contradict the locked CONTEXT. **(1) `yarn generate:docs` does not delete stale
generated pages.** `move-generated.ts` only writes into the destination; nothing removes a page whose
component is gone. A full regeneration run in an isolated copy of HEAD left `EntityCardAction/+page.md`
in place (only `QuestionArguments` content changed). D-14's "this deletes the orphan `EntityCardAction`
page" is therefore false as written; the generator needs a "clear the destination first" fix (a tooling
change, consistent with "no hand-fixing of generated pages"). **(2) The docs ESLint crash is not
host-specific.** It reproduces on Node 22.22.1 (CI's version), 24.12.0, 24.14.1 and 25.2.1, and it
depends only on import order: importing `@openvaa/shared-config/eslint` before `eslint-config-prettier`
crashes; the reverse order loads. Once the config loads, docs lint reports **18–19 real errors** — 15 of
them `.svelte` parse errors because the shared config's global TypeScript parser overrides the Svelte
parser. Wiring `lint` into `turbo run lint` without fixing both would turn root `lint:check` (and CI's
`main.yaml`) red.

**(3) The link checker must be taught what a page is.** `checkLinkExists` accepts only `+page.md`, so a
link to a `.svelte` page or to a `+page.ts` redirect stub reads as broken; navigation *section* routes are
documented as "Not used as a link" and must not be validated as pages. A prototype found **39 dead GitHub
source paths** (confirming fact 5; the 40th raw hit, `candidate/(protected)/settings/+page.svelte`, exists
and was a parse artefact), **4 broken `#anchor` targets out of 21**, and **5 unresolved `yarn` commands**
(all on pages this phase rewrites). Anchor ids can be reproduced exactly, with no new dependency, by
running `mdsvex.compile` with `rehype-slug` and `smartypants: true` — the options in `svelte.config.js`.
**(4) Redirect stubs work.** A `+page.ts`-only route that calls `redirect(308, …)` built cleanly and, served
from a GitHub-Pages-like static host (404 status plus `404.html` fallback), redirected client-side in Chromium
to the target page.

**Primary recommendation:** Build plan 01's tooling first and prove each check red before any writing
starts. That means: the `--check` link checker with all six checks, the ResearchQuote span gate, the
generator destination-clear fix, the ESLint config fix plus the existing lint errors fixed, and the script
repairs. Then lay the D-02 skeleton with stubs in plan 02. Every writer works from the Section source-of-truth
map below, cites content anchors, and treats `CLAUDE.md` as a pointer, never as evidence. CLAUDE.md is itself
stale in places, for example "seeded automatically on `supabase start`" and "the cache disk".

## Architectural Responsibility Map

| Capability | Primary Tier | Secondary Tier | Rationale |
|------------|-------------|----------------|-----------|
| Page content (hand-written guides) | CDN / Static (GitHub Pages, SPA) | — | `adapter-static`, `fallback: '404.html'`, no prerender; every URL is served by `404.html` + client router [VERIFIED: apps/docs/svelte.config.js:24-30] |
| Redirects for moved URLs | Browser / Client (SvelteKit universal `load` in `+page.ts`) | — | No server exists at deploy time; only client-side `redirect()` can act [VERIFIED: browser probe this session] |
| Generated component/route pages | Build tooling (`apps/docs/scripts`, run in CI before `vite build`) | Frontend source (input) | `generate:docs` reads `apps/frontend/src/lib/{components,dynamic-components,candidate/components}` and `apps/frontend/src/routes` |
| Link, anchor, stub and source-path integrity | Build tooling (`validate-links.ts --check`) | CI (`docs.yml`, and root gates) | The build cannot catch links (fact 9) |
| Docs lint, format and typecheck | Repo gates (`turbo run lint`, `format:check`, `turbo run typecheck`) | CI `main.yaml` | `main.yaml` runs `yarn format:check`, `yarn typecheck` and `yarn lint:check` on every PR [VERIFIED: .github/workflows/main.yaml `run:` lines] |
| Facts the pages describe | Supabase (schema, Edge Functions), frontend, dev-seed, app-shared | — | Source-of-truth map below |

## Standard Stack

Nothing new is installed. Every tool below is already in the docs workspace or the repo root.

### Core (existing, used as-is)
| Library | Declared version | Purpose | Why |
|---------|------------------|---------|-----|
| `@sveltejs/kit` + `@sveltejs/adapter-static` | `catalog:` / `^3.0.10` | Site + static SPA output | Already the site [VERIFIED: apps/docs/package.json] |
| `mdsvex` | `^0.12.6` | Markdown pages; also the anchor-id oracle for the checker (`compile`) | Same pipeline as production, no new dependency [VERIFIED: prototype ran `compile(src, { extensions: ['.md'], rehypePlugins: [rehypeSlug], smartypants: true })` and returned heading ids] |
| `rehype-slug` | `^6.0.0` | Heading ids that `#anchor` links target | It is the configured rehype plugin [VERIFIED: apps/docs/svelte.config.js:15] |
| `glob` | `^11.0.0` (root), **to be declared in `apps/docs`** | File discovery in scripts | Imported by `generate-component-docs.ts`, `generate-route-map.ts`, `utils/routes.ts`; resolves only through hoisting today [VERIFIED: grep + root package.json `"glob": "^11.0.0"`] |
| `tsx` | `catalog:` | Runs the scripts | Existing |
| `eslint-plugin-svelte` | `^3.13.1` | Svelte lint config | Existing; `type: module` package |

### Supporting (only if the lint fix needs it)
| Library | Version | Purpose | When |
|---------|---------|---------|------|
| `@typescript-eslint/parser` | `catalog:` (`^8.57.0` in `.yarnrc.yml`) | `parserOptions.parser` for `<script lang="ts">` in `.svelte` files | Only if plan 01's ESLint fix imports it. **167-D14 removes it from `apps/docs` as "no importer"**; if 168 adds an importer, re-declaring it is correct and must be recorded as a cross-phase reconciliation |

### Alternatives Considered
| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| `mdsvex.compile` for anchor ids | `github-slugger` directly | Not declared in `apps/docs` (transitive of `rehype-slug`), and it would miss `smartypants` effects on heading text. Rejected by D-12 ("add no dependency") anyway |
| Extending `validate-links.ts` | Off-the-shelf crawler (linkinator etc.) | Rejected by D-12 |

**Installation:** none beyond declaring `glob` (and possibly re-declaring `@typescript-eslint/parser`) in `apps/docs/package.json`, then `yarn install`. Both already resolve in `yarn.lock`.

## Package Legitimacy Audit

| Package | Registry | Age | Downloads | Source Repo | Verdict | Disposition |
|---------|----------|-----|-----------|-------------|---------|-------------|
| `glob` | npm | many years | very high | github.com/isaacs/node-glob | OK (seam) | Approved — already a root dependency, locked at 11.1.0; declaring the same range adds no new resolution |
| `@typescript-eslint/parser` | npm | many years | very high | github.com/typescript-eslint/typescript-eslint | SUS (seam reason: `too-new` — the *latest* release is recent) | Conditional — already in the repo catalog and lockfile, used by `packages/shared-config` and `apps/frontend`. Re-declaring via `catalog:` installs nothing new. Planner adds a `checkpoint:human-verify` only if a version outside the catalog is ever proposed |

**Packages removed due to [SLOP] verdict:** none.
**Packages flagged as suspicious [SUS]:** `@typescript-eslint/parser` (seam heuristic `too-new` on the latest publish; the repo's catalog pin is the existing, audited one). `npm view glob scripts.postinstall` → empty.

## Architecture Patterns

### System Architecture Diagram

```
 author edits .md / .svelte pages ──┐
                                     │
 apps/frontend/src (components, ─────┤
 routes)                             ▼
                     ┌──────────────────────────────────┐
  yarn generate:docs │ generate-component-docs.ts       │ → scripts/.temp/components
  (CI docs.yml, and  │ generate-route-map.ts            │ → scripts/.temp/routes
   plan 07 locally)  │ move-generated.ts  ── writes into│ → (content)/developers-guide/frontend/
                     │                    [NEW: clear   │    {components,routing}/generated/
                     │                     dest first]  │
                     │ generate-navigation-config.ts    │ → src/lib/navigation.config.ts (titles from H1,
                     │                                  │    // New / // Removed markers)
                     │ validate-links.ts (rewrite mode) │ → fixes relative links, exit 1 on broken
                     └───────────────┬──────────────────┘
                                     ▼  then `yarn format` (prettier --write .)
        ┌───────────────────── gates (plan 08, also 169) ───────────────────────┐
        │ validate-links.ts --check: md links · .svelte hrefs · nav leaf routes │
        │   · #anchors (mdsvex.compile+rehype-slug) · stubs · GitHub paths      │
        │ ResearchQuote span diff vs base · sweeps · check · build · lint:full │
        │ root lint:check (turbo lint now incl. docs) · format:check           │
        └──────────────────────────────────┬────────────────────────────────────┘
                                           ▼
                     vite build → build/404.html (+ _app assets)  →  GitHub Pages
                                           ▼
     browser GET /old/url → 404 + 404.html → SvelteKit router → +page.ts load
                         → redirect(308, '/new/url') → client navigation → page
```

### Recommended IA mechanics (URL mapping proposal for plan 02)

D-04 lets the planner derive the moved-URL list. Recommendation: **keep an existing slug whenever a page
survives under D-02, even when its title changes**, because every kept slug is one fewer stub and the nav
title comes from the H1 anyway. This matches the existing convention that each section's overview page
is `<section>/intro` (`configuration/intro`, `frontend/intro`, `localization/intro`) [VERIFIED: route list
this session].

| D-02 page | Proposed URL | Stubs pointing to it |
|-----------|--------------|----------------------|
| Quick start | `/developers-guide/quick-start` (fixed) | — |
| Architecture | `/developers-guide/architecture` | `app-and-repo-structure` |
| Requirements | `development/requirements` (kept) | — |
| Running the development environment | `development/running-the-development-environment` (kept) | `development/intro`, `backend/preparing-backend-dependencies`, `backend/running-the-backend-separately` |
| Monorepo and Turborepo | `development/monorepo` (kept) | — |
| Seed data | `development/seed-data` | `backend/mock-data-generation`, `backend/default-data-loading`, `candidate-user-management/mock-data` |
| Testing | `development/testing` (kept) | — |
| Environment variables | `configuration/environmental-variables` (kept slug) | `frontend/environmental-variables` |
| Backend Overview | `backend/intro` (kept, overview convention) | `backend/customized-behaviour`, `backend/plugins` (deleted, no equivalent) |
| Authentication and authorisation | `backend/authentication` (kept) | `backend/security` |
| Edge Functions / Email | `backend/edge-functions`, `backend/email` (new) | — |
| Data import and deletion | `backend/data-import-and-deletion` (new) | `backend/openvaa-admin-tools-plugin-for-strapi` |
| Generated types | `backend/generated-types` | `backend/re-generating-types` |
| Data API and adapters | per D-04 `frontend/data-api` **is a stub**; e.g. `frontend/data-api-and-adapters` | `frontend/data-api`, `frontend/accessing-data-and-state-management` |
| Locale resolution | `localization/locale-resolution` | `localization/locale-routes`, `localization/locale-selection-step-by-step` |
| Translations and overrides | `localization/translations-and-overrides` | `localization/local-translations`, `localization/localization-in-the-frontend`, `localization/localization-in-strapi` |
| Candidate app pages | `candidate-app/{pre-registration-and-invitation,registration,login-and-password-reset,bank-authentication,password-validation}` | each `candidate-user-management/*` page, plus `candidate-user-management` itself (an inbound README link targets the section route) |
| Admin app | `/developers-guide/admin-app` | `llm-features` |
| About these docs | `/developers-guide/about-these-docs` | `auto-documentation` |

Two notes for the planner. First, D-04 lists `frontend/data-api` under "stubs needed" even though two READMEs
link it. Follow D-04 literally and repoint those READMEs. Keeping that slug would also satisfy "keep URLs with
inbound references", so the plan should record which reading it chose. Second, section routes such as
`/developers-guide/contributing` and `/developers-guide/candidate-user-management` have **no page today**.
Root `README.md` and `apps/frontend/src/routes/candidate/README.md` link them, so those inbound links are
already dead [VERIFIED: route list plus inbound grep this session]. Repoint them to a leaf page, or give the
section route a stub.

### Pattern 1: Redirect stub (`+page.ts` only, no `+page.svelte`)
**What:** a directory under `src/routes/(content)/…` holding only `+page.ts`, whose `load` calls `redirect()`.
**When:** every moved or deleted URL (D-04).
**Verified behaviour:** `vite build` exits 0 with such a route. Served from a static host that answers unknown
paths with HTTP 404 plus `build/404.html`, Chromium followed the redirect to the target, whose `<h1>` rendered
[VERIFIED: scratch-copy build plus a Playwright probe this session]. Note the HTTP status is **404** on GitHub
Pages, for stubs *and* for every real page, because the site is a pure SPA. Crawlers see 404s regardless; that
is pre-existing.

```ts
// apps/docs/src/routes/(content)/developers-guide/backend/security/+page.ts
import { redirect } from '@sveltejs/kit';

export function load() {
  redirect(308, '/developers-guide/backend/authentication');
}
```
`discoverRoutes` globs only `+page.md` / `+page.svelte` [VERIFIED: apps/docs/scripts/utils/routes.ts `glob('**/{+page.md,+page.svelte}'`], so stubs are invisible to the navigation generator. Stubs must therefore **not** appear in `navigation.config.ts`; if one does, the generator emits `// Removed:` for it.

### Pattern 2: ResearchQuote span gate (D-07)
A prototype at HEAD extracted **22 spans across 6 files**, each file with opens = closes, no nesting, and
`import ResearchQuote from` present [VERIFIED: scratch script over `git show HEAD:<file>`]. The opening tags
span several lines and carry `references={[…]}` arrays that contain `>` characters, along with a zero-width
space in one reference. That rules out tag-regex approaches such as `<ResearchQuote[^>]*>`.

```js
// Span extraction: non-greedy from the tag start to the closing tag; compare as JS strings (byte-exact, ZWSP kept)
const spans = [...source.matchAll(/<ResearchQuote\b[\s\S]*?<\/ResearchQuote>/g)].map((m) => m[0]);
// Also assert per file: count('<ResearchQuote') === count('</ResearchQuote>') === spans.length (guards nesting/truncation)
```
Recommended shape (planner decides placement):
- Read the base side with `git show <base>:<path>` and the HEAD side from the **working tree**. The negative
  control can then be a temporary edit with no commit. Inject one character inside one block, observe exit 1,
  run `git checkout -- <file>`, then observe exit 0 and a clean `git diff --exit-code`.
- Key the list by (path, ordinal) and also compare the per-file counts, so a deleted block, an added block and
  a reordered pair all fail.
- Derive the file set with `git grep -l '<ResearchQuote' <base> -- apps/docs/src/routes`, never a hard-coded list.
- Because 169 re-runs this gate (Cross-phase), it should live where 169 can call it, for example
  `apps/docs/scripts/check-research-quotes.ts` with `--base <rev>` and a package script. Comments in that file
  fall under `assert:comment-hygiene`, whose scan roots include `apps/` [VERIFIED: scripts/assert-comment-hygiene.mjs `SCAN_ROOTS = ['apps', 'packages', 'tests']`],
  so they must not cite `.planning/` paths or D-ids.
- `ResearchQuote.svelte` renders `ReferenceList.svelte` and `Author.svelte`. D-07 freezes only
  `ResearchQuote.svelte`. Including the two children in the `git diff --exit-code` costs nothing and closes a
  rendering hole, but it is not in the locked text: see Open Question 3.

### Pattern 3: Link checker `--check` design (D-12)
Current behaviour [VERIFIED: apps/docs/scripts/validate-links.ts, scripts/utils/links.ts read this session]:
- `findMarkdownFiles` globs `**/*.md` (it includes generated pages). `extractMarkdownLinks` is **per-line**, so
  a link split across lines would be missed. None exists today [VERIFIED: grep `^\s*\](` → 0].
- `checkPathExists` accepts a path only if it is a file or a directory containing **`+page.md`**. A
  `.svelte` page or a `+page.ts` stub fails.
- `resolveLink` strips `#hash`. Relative links are rewritten to absolute and written back with `fs.writeFile`.

Additions (all within D-12, no dependency):

| Check | Source of truth | Baseline at HEAD |
|-------|-----------------|------------------|
| md internal links | existing, plus accept `+page.svelte` / `+page.ts` targets | 173 links, 0 broken |
| `.svelte` `href="/…"` | `src/routes/**/*.svelte`, `src/lib/**/*.svelte` | 8 hrefs (landing 5, Header/Footer `/`, `/favicon.png` → a `static/` asset, so resolve `static/` too) |
| nav routes | `navigation.config.ts`: **leaf `NavigationItem` routes must resolve to a page; `NavigationSection` routes are prefixes only** ("Not used as a link" [VERIFIED: apps/docs/src/lib/navigation.type.ts]) | 0 known broken |
| `#anchors` | `mdsvex.compile(md, { extensions: ['.md'], rehypePlugins: [rehypeSlug], smartypants: true })` → collect `id="…"` | **21 anchor links, 4 broken** (`mock-data → …#mock-users`, `contexts #example-loading-cascade-…`, `troubleshooting #docker-error-no-space-left-on-device-errordocker-…`, `publishers-guide/app-settings #customization`) |
| stubs | every `+page.ts`-only dir: parse the `redirect(…, '<target>')` literal; the target must be a real page, not another stub (no chains) | n/a |
| GitHub source paths | `git ls-files` set plus derived dirs; parse both `[t](url)` and `[t](<url>)` (URLs containing `)` or `[[`), and `decodeURIComponent` | **39 dead** (40 raw minus the `(protected)` artefact) |
| (recommended) inbound refs | `git grep` outside `apps/docs` for `openvaa.org/(about\|developers-guide\|publishers-guide)/…` and for `apps/docs/src/routes/…` file links | 20 `openvaa.org` docs URLs plus 16 local-path links today |

Recommendations:
- Extract the mdsvex options into one module (for example `apps/docs/mdsvex.config.js`) that both
  `svelte.config.js` and the checker import, so anchor ids cannot drift from production.
- In `--check` mode, treat **a link that targets a stub as an error**. Stubs exist for outside visitors; repo
  content should link the final URL, and this rule is what stops writers citing old URLs.
- `--check` must exit non-zero on any finding and must never write. Keep the default (rewrite) mode for
  `generate:docs`, so CI's docs job still runs the GitHub-path check through `generate:docs` (D-10).
- `generate:docs` runs `validate-links.ts` through `execAsync`, and `runCommand` rethrows on a non-zero exit,
  so a new failure there fails the pipeline [VERIFIED: generate-all-docs-and-validate.ts `runCommand`].

### Pattern 4: Generator must clear its own output (D-14)
`move-generated.ts` calls `moveAndTransformDir(srcPath, destPath, srcPath)`. That function only `mkdir`s and
`writeFile`s; nothing removes `dest` first [VERIFIED: apps/docs/scripts/move-generated.ts:83-94]. A full
`generate-all-docs-and-validate.ts` run plus prettier in an isolated copy of HEAD changed exactly one page
(`QuestionArguments`), and **`dynamic-components/entityCard/EntityCardAction/+page.md` survived**. Meanwhile
`find apps/frontend/src -name 'EntityCardAction*'` returns nothing [VERIFIED: scratch run this session].
Fix: `await rm(destPath, { recursive: true, force: true })` before `moveAndTransformDir` for each
`COPY_TARGETS` entry. Both destinations (`frontend/components/generated`, `frontend/routing/generated`) hold
only generator output, including their index `+page.md` [VERIFIED: docs-scripts.config.ts:35-52 and the
generated TOC write in generate-component-docs.ts]. This is a tooling change, not hand-fixing, so it fits D-14.
It belongs in plan 01 or plan 07.

### Anti-Patterns to Avoid
- **Validating nav section routes as pages.** `/developers-guide/backend` has never had a page.
- **Using `CLAUDE.md` as evidence.** It says "The database is seeded automatically on `supabase start` via
  seed.sql". It also lists "the cache disk" under Deployment, which 167 removes. Cite code anchors only.
- **Copying 166-CONTEXT's frontend path.** It cites `routes/[[lang=locale]]/candidate/(protected)/+layout.server.ts`,
  but the tree has `apps/frontend/src/routes/candidate/(protected)/+layout.server.ts`, with no locale segment
  [VERIFIED: ls this session].
- **Running `validate:links` (default mode) as a check.** It rewrites files. Use `--check`.
- **Pasting `supabase start` / `db:status` output into `gate-evidence/`.** It prints anon and service-role keys
  (see Security Domain).

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Heading-slug computation | A slugify function | `mdsvex.compile` + `rehype-slug` with the site's own options | `smartypants` changes heading text before slugging, and duplicate headings get `-1` suffixes |
| Redirects | A meta-refresh HTML page or a `404.svelte` lookup table | A `+page.ts` `redirect()` stub | Verified working on the static host; one file per URL, easy to retire (D-04) |
| Nav consistency | A hand diff | `generate-navigation-config.ts`, then `git diff --exit-code src/lib/navigation.config.ts`, then grep for `// New` / `// Removed:` | It is the tool D-02 names |
| Settings reference | A generator | Hand re-derivation from `packages/app-shared/src/settings/*` (D-06) | Locked |
| Generated component pages | Hand edits | Fix the docstring in the frontend or the generator template, then regenerate (D-14) | The next CI run overwrites hand edits |

**Key insight:** in this phase every check is only as good as its model of "what is a page". Pages are
`+page.md`, `+page.svelte` and stub `+page.ts` under route groups; nav sections are not pages; static assets
live in `static/`. Encode that model once in `utils/links.ts` and reuse it everywhere.

## Runtime State Inventory

This phase moves and deletes URLs, so the five categories are answered explicitly.

| Category | Items Found | Action Required |
|----------|-------------|------------------|
| Stored data | None in a database: the site is static, with no datastore [VERIFIED: no server, no adapter beyond static] | None |
| Live service config | GitHub Pages deployment through `.github/workflows/docs.yml` (main only, path `apps/docs/**`); no custom-domain file in `apps/docs/static` (only `favicon.png`, `images/`) [VERIFIED: git ls-files]. **External** inbound links (openvaa.org URLs in other sites, emails and newsletters, search indexes) cannot be edited | Redirect stubs (D-04) are the only lever, and they act client-side only |
| OS-registered state | None — verified: no scheduled tasks or services reference docs routes | None |
| Secrets/env vars | None renamed by this phase. Pages *describe* env names that 167 removes (`BACKEND_API_TOKEN`, `PUBLIC_*_BACKEND_URL`, `PUBLIC_CACHE_ENABLED`, `CACHE_*`) | Code edit (prose) only |
| Build artifacts | `apps/docs/build/` and `.svelte-kit/` are gitignored and regenerated by `svelte-kit sync`/`vite build`. `scripts/.temp` is removed by `move-generated.ts`. The turbo cache is keyed on `$TURBO_DEFAULT$` inputs [VERIFIED: apps/docs/turbo.json] | None; first build after route moves regenerates types |

In-repo inbound references (code edits in plan 02): `.agents/code-review-checklist.md` (4, file paths),
`.github/PULL_REQUEST_TEMPLATE` (2, with anchors `#self-review` and `#commit-your-update`, which must survive in
the contributing pages), root `README.md` (4 openvaa.org URLs, one to the page-less `/developers-guide/contributing`),
**root `ROADMAP.md` (2, code-style-guide; not in fact 13's list)**, seven frontend/app-shared READMEs
(`packages/app-shared/src/settings/README.md`'s "locally" links already point at a wrong path
`/docs/src/routes/developers-guide/…`), `.claude/skills/components/SKILL.md`, `.claude/skills/README.md`,
and `.claude/scripts/audit-skill-routing.sh` (it mentions the generated index path; that path does not move)
[VERIFIED: git grep this session]. Re-derive this list at run time.

## Common Pitfalls

### Pitfall 1: Docs lint is broken twice over (D-15)
**What goes wrong:** `yarn workspace @openvaa/docs lint:local` exits 2 with `ERR_INTERNAL_ASSERTION … at loadCJSModuleWithModuleLoad` while ESLint is loading `eslint.config.js` [VERIFIED: run this session].
**Diagnosis (observations VERIFIED, mechanism UNCONFIRMED):**
- Each of the three imports loads alone. A test module importing `@openvaa/shared-config/eslint` **then** `eslint-config-prettier` crashes; with the order reversed it loads. The crash reproduces on Node v22.22.1 (CI's version per `.github/workflows/docs.yml`), v24.12.0, v24.14.1 and v25.2.1, so it is **not a host problem**.
- A plausible mechanism, not verified: during module evaluation the shared config calls `compat.extends(…, 'prettier')`, so `FlatCompat` `require`s the CommonJS `eslint-config-prettier` synchronously while the ESM loader has that same module pending as a sibling static import, and Node's loader asserts. Record the cause as **UNCONFIRMED (mechanism)**, with **CONFIRMED (order-dependence, version-independence)**.
- With the config made to load (two variants tried in a scratch copy), `eslint .` reports **18 errors** (no explicit prettier import) or **19** (prettier imported first, which adds one `simple-import-sort` error on the config itself):
  - 15 × `Parsing error: '>' expected` on `.svelte` files: the shared config's block sets `languageOptions.parser: tsParser` for all files after `svelte.configs.prettier`, which overrides the Svelte parser;
  - 2 × `import/consistent-type-specifier-style` in `scripts/generate-navigation-config.ts` and `scripts/validate-links.ts`;
  - 1 × `Parsing error: Type expected` in `OpenVAALogo.svelte` (167 rewrites this file).
**How to avoid:** in plan 01, (a) fix the load order or drop the redundant `eslint-config-prettier` import (the shared config already extends `prettier`). Simple-import-sort will re-sort a hand-reordered import list, so dropping the import is the stable option. (b) Restore Svelte parsing by placing `svelte.configs.prettier` **after** `sharedConfig` and adding a `files: ['**/*.svelte']` block with `parserOptions.parser` set to the TS parser, the pattern `apps/frontend/eslint.config.mjs` uses [VERIFIED: its `files: ['**/*.svelte']` block with `parser: '@typescript-eslint/parser'`]. (c) Fix the remaining real errors. (d) Add `"lint": "eslint ."`. (e) Run the negative control (inject a `simple-import-sort` violation and a `no-explicit-any` hit, as in 167-D16): lint must fail **naming both rules**. Prove the effective config with `eslint --print-config` on one `.svelte` and one `.ts` file.
**Warning signs:** green docs lint with 0 files linted, or a `.svelte` file with no `svelte/*` rule in `--print-config`.

### Pitfall 2: Believing `generate:docs` prunes stale pages
See Pattern 4. Verify after regeneration: `git status --porcelain -- '…/generated'` shows the `EntityCardAction` deletion, and the count of generated component pages equals the count of components with an `@component` docstring.

### Pitfall 3: `gsd-doc-verifier` result files collide
**What goes wrong:** the agent writes `.planning/tmp/verify-{basename of doc_path}.json` [VERIFIED: ~/.claude/agents/gsd-doc-verifier.md Step 6]. Every docs page is `+page.md`, so every result overwrites the last.
**How to avoid:** before each spawn, copy the page to a unique basename (for example `.planning/tmp/docs-verify/developers-guide__backend__authentication.md`) and pass that as `doc_path`. Results are then `verify-developers-guide__backend__authentication.md.json`. Alternatively spawn sequentially and rename after each.
**Also:** the verifier checks `yarn <script>` against the **root** `package.json` and detects file paths only when they carry an extension. It will raise false FAILs on `yarn workspace @openvaa/x …` and miss directory paths such as `apps/supabase/supabase/functions/send-email`. Treat it as the second reader D-09 wants, reconcile its FAILs against the claim ledgers, and record each disagreement.

### Pitfall 4: Gate evidence leaks local keys
`supabase start` and `supabase status` print the anon key, the service-role key and the JWT secret. D-11 runs `db:start` and `yarn dev`. Capture exit codes, redact key-bearing lines before writing to `gate-evidence/`, and record categories only (the 167-D23 precedent).

### Pitfall 5: Prettier reflows a ResearchQuote page
`generate:docs` ends with `yarn format` (`prettier --write .` over all of `apps/docs`). Today `format:check` passes, so formatting is idempotent [VERIFIED: `yarn workspace @openvaa/docs format:check` exit 0]. Any prose edit on the six pages followed by `yarn format` could still reflow a block's neighbourhood. Run the span gate **after** `yarn format`.

### Pitfall 6: A sweep pattern returns a false zero
167-D04 found that `git grep -E '^\s*\$:'` returns a false zero on this host. The D-21 patterns tested this session gave identical counts under `-E` and `-P` (#5: 4/4; Svelte 4 set: 23/23) [VERIFIED]. Still, use `-P` for any pattern containing `\s` or `\b`, and record both the command and the count.

### Pitfall 7: Nav titles silently revert
`compareSection` replaces every title with the discovered H1 unless `fixedTitle: true`. Section titles without a page come from `routeToTitle` (kebab-case to words) [VERIFIED: generate-navigation-config.ts]. "Backend (Supabase)" therefore needs `fixedTitle: true`, and each page's H1 must equal its intended nav title.

### Pitfall 8: Docs CI does not run on PRs
`docs.yml` triggers only on `push` to `main` with `apps/docs/**` changes [VERIFIED: .github/workflows/docs.yml `on:`]. The D-10 GitHub-path check inside `generate:docs` therefore runs only post-merge, and **never when a frontend rename breaks a generated page's Source link**. See Open Question 1.

## Code Examples

### Anchor-id oracle (verified this session)
```js
// Source: prototype run in a scratch copy of apps/docs (mdsvex ^0.12.6, rehype-slug ^6.0.0)
import { compile } from 'mdsvex';
import rehypeSlug from 'rehype-slug';
const out = await compile(markdown, { extensions: ['.md'], rehypePlugins: [rehypeSlug], smartypants: true });
const ids = new Set([...out.code.matchAll(/\sid="([^"]+)"/g)].map((m) => m[1]));
```

### GitHub source-path check (prototype; 39 dead at HEAD)
```js
// tracked = new Set(git ls-files); dirs = every prefix directory of a tracked file
const re = /https:\/\/github\.com\/OpenVAA\/voting-advice-application\/(blob|tree)\/main\/([^\s)"'`<>\]]+)/g;
// Better: take URLs from the existing extractMarkdownLinks (handles <url> with ')' and '[[') and from href="…"
const target = decodeURIComponent(path.replace(/[#?].*$/, '').replace(/\/$/, ''));
const dead = !tracked.has(target) && !dirs.has(target);
```

### Docs lint script and ESLint shape (sketch; verify with --print-config)
```js
// apps/docs/eslint.config.js — order matters: shared first, Svelte after it, then the TS-in-Svelte parser
import { default as sharedConfig } from '@openvaa/shared-config/eslint';
import tsParser from '@typescript-eslint/parser'; // re-declare in apps/docs if used (167-D14 removes it)
import svelte from 'eslint-plugin-svelte';

export default [
  ...sharedConfig,
  ...svelte.configs.prettier,
  { files: ['**/*.svelte'], languageOptions: { parserOptions: { parser: tsParser } } }
];
```
This sketch is `[ASSUMED]` until plan 01 runs it and compares `--print-config` output. The verified facts are only that the original order crashes and that the frontend uses the per-`.svelte` parser block.

### Sweep commands (D-21; read exit status directly)
```bash
git grep -n -i -E '(^|[^a-z])strapi' -- apps/docs            # #1  (168 hits / 27 files at HEAD)
git grep -n 'vaa-strapi' -- apps/docs                          # #2  (41)
git grep -n -P '\$t\(|\$locale\b' -- apps/docs                 # #5  (4)
git grep -n -i 'localstack' -- apps/docs                       # #6  (7)
git grep -n -i 'awslocal' -- apps/docs                         # #7  (1)
git grep -n 'GENERATE_MOCK_DATA' -- apps/docs                  # #9  (8)
git grep -n -E 'STRAPI_|BACKEND_API_TOKEN|PUBLIC_BROWSER_BACKEND_URL|PUBLIC_SERVER_BACKEND_URL|MAIL_FROM|MAIL_REPLY_TO|AWS_' -- apps/docs  # #10 (27)
git grep -n -i 'docker' -- apps/docs                           # new (38 / 12 files; exceptions: deployment, production build, Docker-for-Supabase in requirements)
git grep -n -P 'Svelte 4|export let|\$\$Props|\$\$restProps' -- apps/docs  # new (23)
git grep -n -F '[[lang' -- apps/docs                           # new (1)
```
(`git grep` exits 1 when there are no matches. "Clean" is exit 1, or every hit listed in the ledger.)

## Section Source-of-Truth Map (for plans 03–07)

Writers read these files at the **post-166/167 HEAD** (D-16) and cite content anchors from them.

| Plan / section | Read these (code, not CLAUDE.md) |
|----------------|----------------------------------|
| 03 Backend overview | `apps/supabase/README.md` (§ "Two SQL directories", § Commands, § Local ports, § Tests, § Edge Functions, § Type generation); `apps/supabase/supabase/schema/*.sql` (26 numbered files, `000-enums` … `900-test-helpers`); `migrations/00001_initial_schema.sql` (generated); `config.toml`; `apps/supabase/package.json` scripts (`start`, `reset`, `lint:sql`, `lint:schema`, `test:db`, `test:unit`) |
| 03 Auth and authorisation | `schema/300-auth-tables.sql` (`public.grants`), `301-auth-functions.sql` (`user_can`, `custom_access_token_hook`), `302-rls.sql`, `303-column-grants.sql`, `400-storage.sql`; `config.toml` `[auth.hook.custom_access_token]`; post-166: `private.caller_entity_ids`, `get_candidate_user_data` in `503-entity-rpcs.sql`; `.claude/skills/database/{schema-reference,rls-policy-map}.md` (pointers only) |
| 03 Edge Functions / Email | `apps/supabase/supabase/functions/{identity-callback,invite-candidate,send-email}/index.ts` + `envConfig.ts`; `functions/.env.example` (10 names at HEAD); `502-email-helpers.sql` (`resolve_email_variables`); Inbucket port in `config.toml` / README § Local ports |
| 03 Data import and deletion | `501-bulk-operations.sql` (`bulk_import`, `bulk_delete`, `_bulk_upsert_record`, `resolve_external_ref`); `500-external-id.sql`; `504-admin-rpcs.sql` |
| 03 Generated types | root `db:types` → `yarn workspace @openvaa/supabase-types generate`; `packages/supabase-types/src/{database.ts,column-map.ts}`, `RPC-NULLABILITY.md` (that package has no README) |
| 03 Seed data | `packages/dev-seed/README.md`; `src/templates/index.ts` `BUILT_IN_TEMPLATES` (keys: `default`, `e2e/base` and about 30 `perm-*` keys, **not** `e2e/perm/...`); root scripts `db:seed`, `db:seed:default`, `db:seed:teardown`, `db:reset-with-data`; `apps/supabase/supabase/seed.sql` |
| 04 Quick start / Requirements / Running | root `package.json` (`dev`, `dev:*`, `db:*`, `engines`); `.nvmrc` is absent, so link `engines` (D-17); `tests/README.md` § Run |
| 04 Testing | root `test:unit`, `test:e2e`; `tests/scripts/e2e-run.sh`; `tests/README.md` (preflight); `apps/supabase` `test:db` (pgTAP in `supabase/tests/database/`) |
| 04 Environment variables | root `.env.example` (35 names at HEAD; 30 after 167 removes `PUBLIC_CACHE_ENABLED` + 4 `CACHE_*`); `apps/frontend/.env.example` (explains it is not read); `apps/frontend/svelte.config.js` `env: { dir: repoRoot }`; `vite.projectIdEnv.ts`; `scripts/assert-env-pairs-agree.mjs`, `assert-env-pair-registry.mjs`, `assert-edge-function-env.mjs`; root `check:env-local` |
| 04 Deployment | `render.example.yaml` (post-167: no cache disk), `apps/frontend/Dockerfile`, `docker-compose.dev.yml` (production build testing only) |
| 04 Troubleshooting | `apps/supabase/README.md` § Local ports; root `dev:clean`, `dev:reset` |
| 05 Frontend | `apps/frontend/svelte.config.js` (runes forced, aliases `$types`, `$candidate`, `$layouts`); `src/lib/api/` (`adapters/{apiRoute,supabase}`, `dataProvider.ts`, `base/universalAdapter.ts`); `src/lib/server/api/adapters/local/`; `src/lib/contexts/*`; `src/lib/routes/`; `.claude/skills/components/context-reactivity.md` (stable vs reactive accessors) |
| 05 Localization | `apps/frontend/src/lib/i18n/{wrapper.ts,overrides.ts,init.ts,README.md}`; `apps/frontend/messages/<locale>/*.json` + `messages/README.md`; `scripts/compile-paraglide.ts` (`paraglide:compile`); `packages/app-shared/src/settings/staticSettings.ts` `supportedLocales` |
| 06 Candidate app | `apps/frontend/src/routes/candidate/**` (no locale segment); `routes/api/candidate/auth/callback/+server.ts` (`token_hash` + `type` → `verifyOtp`, then `CandAppResetPassword` / `CandAppSetPassword`); `supabaseDataWriter.ts` (`_requestForgotPasswordEmail` `redirectTo` = `CandAppAuthCallback`, `_resetPassword`, `_setPassword`, `_preregister`); post-166 `invite-candidate` and `identity-callback`; `docs/key-generation.md`; `tests/IDURA-TEST-RUNBOOK.md` |
| 06 Admin app | `apps/frontend/src/routes/admin/(protected)/{argument-condensation,jobs,question-info}`, `routes/admin/login`; `packages/{llm,argument-condensation,question-info}` READMEs |
| 06 App settings (both pages) | `packages/app-shared/src/settings/{dynamicSettings.ts,dynamicSettings.type.ts,staticSettings.ts,staticSettings.type.ts,README.md}` (D-06) |
| 07 About these docs | `apps/docs/package.json` scripts, `apps/docs/scripts/*`, `.github/workflows/docs.yml`; docs README (stale: it shows a `docs/` tree with `typedoc.json` and says port 5173, but `vite.config.ts` sets `server: { port: 5174 }`) |

### Todo leads (D-18), from reading this session
- **password-reset `?code=`**: the page computes `const code = page.url.searchParams.get('code')` and branches. The only email link producer, `_requestForgotPasswordEmail`, sets `redirectTo` to `CandAppAuthCallback`. That callback handles `token_hash` + `type`, and on `recovery` redirects to `CandAppResetPassword` **without** a `code` parameter. `_resetPassword` ignores `code` ("The `code` param is unused"). No in-repo path sends a `code` to the reset page [VERIFIED: reads of the four files]. The open sub-question for the executor: whether Supabase's PKCE recovery link can deliver `?code=` to the *callback* (which ignores it). That concerns the callback, not the page branch. Expected outcome: the branch is dead, so the todo stays open (D-18).
- **registrationKey**: the todo's own header already says it is superseded by `2026-09-15-refactor-candidate-and-entity-registration-flow-and-nominati.md` (present in `todos/pending/`). Close it as D-18 says.
- **configurable-mock-data**: satisfied by `db:seed --template`, `db:reset-with-data` and `BUILT_IN_TEMPLATES`. Close it.

### typedoc reconciliation (resolve in plan 01)
`typedoc` and `typedoc-plugin-markdown` have **no consumer anywhere** except `apps/docs/package.json`, the dead
root scripts and `TYPEDOC_CONFIG` [VERIFIED: git grep]. After D-13 both are orphaned, so remove both in plan 01.
Removing `typedoc` leaves a stale `security/audit-baseline.json` row: id `1113465`, `minimatch`,
`"via": "typedoc@0.28.15"` [VERIFIED: audit-baseline.json read this session]. Follow 167-D20's procedure: run
`yarn audit:deps`, confirm the id is listed as "no longer appear", hand-delete the row only if `typedoc` is its
only via, update the `note` count ("These 70 findings" before 167; 167 hand-edits it), and **never run
`--update-baseline`**. A stale row is a note, not a failure, so if plan 01 would rather not touch the baseline,
record the row for 169.

## State of the Art

| Old (described by pages) | Current | Impact |
|--------------------------|---------|--------|
| Strapi CMS + Docker Compose dev stack, LocalStack S3/SES | Supabase CLI (`db:*`) + Edge Functions + Inbucket | Backend section rewritten |
| `sveltekit-i18n`, `$t()`, `[[lang=locale]]` route param | Paraglide `t()` wrapper, `url` strategy, no locale route param | Localization section rewritten |
| Svelte 4 (`export let`, `$$Props`, stores) | Svelte 5 runes forced on | Frontend overview, contexts and code-style guide updated |
| `GENERATE_MOCK_DATA_ON_*` | `@openvaa/dev-seed` templates | Seed data page |
| `auth_user_id` link (pre-166) | grant-only identity (post-166) | Candidate and auth pages |
| `/api/cache` proxy, `PUBLIC_*_BACKEND_URL`, `BACKEND_API_TOKEN` (pre-167) | removed (post-167) | Data API, env and deployment pages |

## Assumptions Log

| # | Claim | Section | Risk if Wrong |
|---|-------|---------|---------------|
| A1 | The ESLint crash mechanism (FlatCompat `require` of `eslint-config-prettier` during ESM link) | Pitfall 1 | Low: the fix (drop or reorder the import) is chosen by observation, not by mechanism |
| A2 | The ESLint config sketch (shared → svelte → TS parser block) removes the 15 parse errors | Code Examples | Medium: plan 01 must measure with `eslint .` and `--print-config` |
| A3 | Post-167 root `.env.example` has 30 names (35 − 5) | Source map | Low: re-derived at execution (D-16) |
| A4 | Post-166 function and RPC names (`private.caller_entity_ids`, the `get_candidate_user_data` contract) as in 166-CONTEXT | Source map | Medium: read the 166 SUMMARY and code at execution |
| A5 | Supabase PKCE recovery links never carry `?code=` to the reset page | Todo leads | Low: the executor settles it by reading (D-18) |
| A6 | The proposed URL slugs | IA mechanics | Low: planner's call under D-04 |

## Open Questions

1. **Should the link check also run on PRs?**
   - Known: `docs.yml` runs only after merge to `main` and only for `apps/docs/**`. Frontend component renames break generated Source links without triggering it.
   - Unclear: whether the operator wants a `validate-links --check` step in `main.yaml`. With one, a component rename forces a docs regeneration in the same PR.
   - Recommendation: add `yarn workspace @openvaa/docs validate:links --check` to `main.yaml`'s lint job, or widen `docs.yml`'s `paths` to `apps/frontend/src/**`. D-10 names only "CI's docs job", so this needs the operator's yes.
2. **`frontend/data-api`: stub or keep?** D-04 lists it under stubs, while its "keep URLs with inbound references" rule would keep it. Recommendation: follow the literal list and record the choice in the ledger.
3. **Freeze `ReferenceList.svelte` / `Author.svelte` too?** They render inside every ResearchQuote. Recommendation: include them in the D-07 `git diff --exit-code` (no cost) and note it as a strengthening of D-07, not a change.
4. **Where does the ResearchQuote gate script live?** 169 must re-run it. Recommendation: `apps/docs/scripts/` with a package script. A phase-directory script would be orphaned after the phase closes.

## Environment Availability

| Dependency | Required By | Available | Version | Fallback |
|------------|------------|-----------|---------|----------|
| Node | all scripts | ✓ | v24.14.1 (CI uses 22.22.1; nvm also has 22.22.1, 24.12.0, 25.2.1) | `~/.nvm/versions/node/v22.22.1/bin/node` to mirror CI |
| Yarn | workspaces | ✓ | 4.13.0 | — |
| Docker | Supabase CLI (D-11 `db:start`) | ✓ | client 29.7.2 | — |
| Supabase CLI | `db:start`, `db:seed` | ✓ via `node_modules/.bin/supabase` (not on PATH) | — | `yarn db:start` |
| Local Supabase stack | D-11 runs | ✓ `openvaa-local` containers running; **a second unrelated stack (`next-supabase-skimle2`) is also on this host** — never restart Docker | — | — |
| Playwright Chromium | stub probe (optional) | ✓ | — | — |
| `apps/docs` `check` / `build` / `format:check` | gates | ✓ all exit 0 at HEAD (check: 611 files 0/0; build: 1 HTML file) | — | — |
| `apps/docs` `lint:local` | gates | ✗ exits 2 (Pitfall 1) | — | Fix in plan 01 |

**Missing dependencies with no fallback:** none.
**Missing dependencies with fallback:** none. Docs lint is a defect to fix, not a missing tool.

## Validation Architecture

### Test Framework
| Property | Value |
|----------|-------|
| Framework | No unit-test suite in `apps/docs` (no `*.test.*` files; `vite.config.ts` declares vitest projects that are unused). Validation is gate scripts plus recorded negative controls, following the REQUIREMENTS.md standing rule and the 167-D08 precedent (temporary working-copy injections, never committed) |
| Config file | none (Wave 0 adds the `--check` mode and the span-gate script) |
| Quick run command | `yarn workspace @openvaa/docs validate:links --check` |
| Full suite command | the D-22 gate set, each exit code read directly (never through a pipe) |

### Phase Requirements → Test Map
| Req ID | Behavior | Type | Automated command | Failure signal | Negative control (must be observed red first) |
|--------|----------|------|-------------------|----------------|-----------------------------------------------|
| DOCS-01 | No Strapi nav titles; nav consistent with tree | gate | `yarn workspace @openvaa/docs generate:navigation && git diff --exit-code -- apps/docs/src/lib/navigation.config.ts` and `git grep -n -E '// (New\|Removed)' -- apps/docs/src/lib/navigation.config.ts` | diff exit 1, or grep exit 0 | Delete one hand-ordered leaf from the config: the generator re-adds it with `// New` |
| DOCS-02 | ResearchQuote spans byte-identical; component frozen | gate | `tsx apps/docs/scripts/check-research-quotes.ts --base <base>` (name proposed) + `git diff --exit-code <base> -- apps/docs/src/lib/components/ResearchQuote.svelte` | exit 1 naming file and ordinal | One-character edit inside one block → exit 1; revert → exit 0; `git diff --exit-code` clean |
| DOCS-02 | Ledger complete | manual + script | count `168-DOCS-AUDIT.md` rows against `git ls-files apps/docs/src/routes \| grep -E '\+page\.(md\|svelte)$' \| grep -v generated/` at **base** | count mismatch | — |
| DOCS-03 | Sweeps clean bar exceptions | gate | the D-21 commands (Code Examples) | any hit not in the ledger | Not applicable (a grep can't be blind once the command is recorded); record `-E` vs `-P` agreement |
| DOCS-04 | Claims anchored | script | per ledger row: `git grep -q -F -- '<quoted anchor>' -- <file>` | exit 1 for that row | Mutate one anchor string → that row fails |
| DOCS-04 | Commands resolve | script | command matcher (prototype: 39 `yarn` mentions, 5 unresolved at HEAD) | any unresolved | Add `yarn db:nonexistent` to a page → fails |
| DOCS-04 | Independent reader | agent | one `gsd-doc-verifier` per changed page (unique basenames, Pitfall 3) | BLOCKER findings not reconciled in the ledger | — |
| DOCS-05 | Candidate pages = post-166 flows | ledger + verifier | the DOCS-04 commands over `candidate-app/*` and `backend/authentication` | — | — |
| DOCS-06 | Scripts repaired; orphan pruned | gate | `yarn docs:generate` (renamed) exit 0; `yarn workspace @openvaa/docs generate:component-docs` exit 0; `test -z "$(find apps/docs/src/routes -path '*EntityCardAction*')"` | non-zero exit / file exists | Before the fix: regenerating leaves `EntityCardAction` (observed this session) |
| DOCS-07 | Link check covers 6 classes | gate | `yarn workspace @openvaa/docs validate:links --check` | exit 1 with a list | Inject one fault per class (broken md link, `.svelte` href, nav leaf, `#anchor`, stub target, GitHub path) → each red; plus "file unchanged after `--check`" (`git diff --exit-code`) |
| DOCS-08 | Docs lint wired and real | gate | `yarn workspace @openvaa/docs lint` and `yarn lint:check` | non-zero | Inject `simple-import-sort` + `no-explicit-any` violations → lint fails naming both; revert |
| DOCS-08 | Build/check/format | gate | `yarn workspace @openvaa/docs check`, `… build`, `… format:check`, root `yarn format:check` | non-zero | — |

### Sampling Rate
- **Per task commit:** `validate:links --check` plus the span gate (seconds).
- **Per wave merge:** add `check`, `build`, `lint`, `format:check`.
- **Phase gate:** the full D-22 set plus root `yarn lint:check` / `yarn format:check`, before `/gsd-verify-work`.

### Wave 0 Gaps
- [ ] `--check` mode and the five new check classes in `apps/docs/scripts/validate-links.ts` / `utils/links.ts`
- [ ] ResearchQuote span-gate script plus the base extract in `gate-evidence/`
- [ ] `move-generated.ts` clears destinations
- [ ] ESLint config fix plus existing lint errors fixed, then the `lint` script
- [ ] Claim-anchor checker and command matcher (phase-local scripts are fine)

## Security Domain

`security_enforcement` is not set in `.planning/config.json`, so it counts as enabled.

### Applicable ASVS Categories
| ASVS Category | Applies | Standard Control |
|---------------|---------|-----------------|
| V2 Authentication | no (docs describe auth; no auth code changes) | — |
| V3 Session Management | no | — |
| V4 Access Control | no | — |
| V5 Input Validation | marginal: redirect stubs take no input (literal targets) | Literal string targets only; never build a redirect target from `url.searchParams` |
| V6 Cryptography | no | — |
| V8 Data Protection / V14 Config | yes | No secret values in pages or `gate-evidence/` (Pitfall 4); example env blocks use `.env.example` placeholders only |

### Known Threat Patterns
| Pattern | STRIDE | Mitigation |
|---------|--------|------------|
| Key leakage via captured `supabase start/status` output | Information disclosure | Redact; record categories only (167-D23 precedent) |
| Docs teaching an insecure pattern (for example a service-role key in the browser, or a stale auth flow) | Tampering / Elevation | D-09 claim ledger plus verifier; describe the grant-only, PKCE, RLS flows from code |
| Open redirect via stub | Spoofing | Static literal targets; the checker asserts each target is an internal page |

## Project Constraints (from CLAUDE.md)

- **Comment Hygiene** applies to every comment added under `apps/` (including `apps/docs/scripts/*.ts` and stub `+page.ts` files): no historical narrative, no `.planning` paths or D-ids, nothing addressed to the reviewer. Gated by `yarn assert:comment-hygiene` (part of `lint:check`) and `hygiene-grep-report.sh --assert-clean`.
- **Never read a gate's status through a pipe** (memory and D-22).
- **Content anchors, never line numbers**, in plans and ledgers (memory and D-09). (Line ranges in this file are research provenance only.)
- `.planning` commits in this repo: commit `.planning` docs before spawning parallel planners or executors (D-19). In the main repo, gsd-tools doc commits may need `--no-verify`.
- **Localization / accessibility** rules apply to product code, which this phase does not touch. The docs site is English-only.
- **`.agents/code-review-checklist.md`** is binding for review, and its code-style-guide link must keep resolving (D-04).
- The docs are **excluded from root prettier** (`.prettierignore` entry `docs`) and formatted by `yarn workspace @openvaa/docs format`. Root `format:check` already calls the docs `format:check` [VERIFIED: package.json:49]. Root `typecheck` already covers docs `svelte-check` through its `typecheck` script. **Only lint is newly wired by D-15.**

## Sources

### Primary (HIGH confidence, verified this session)
- `apps/docs/{package.json,svelte.config.js,eslint.config.js,vite.config.ts,turbo.json,README.md}`, `apps/docs/scripts/*.ts`, `apps/docs/src/lib/navigation.{config,type}.ts`: read in full or in part
- Runs: `yarn workspace @openvaa/docs {check,format:check,build,lint:local}` (exit 0/0/0/2); `generate-all-docs-and-validate.ts` plus prettier in an isolated copy; ESLint bisection across Node 22.22.1/24.12.0/24.14.1/25.2.1; redirect-stub build plus Chromium probe on a 404-fallback static server; anchor, GitHub-path, command and span prototypes
- `.github/workflows/{docs.yml,main.yaml}`, root `package.json`, `.prettierignore`, `scripts/assert-comment-hygiene.mjs`, `security/audit-baseline.json`
- `.planning/phases/{166,167,168}-*/…-CONTEXT.md`, `261001-n8y-VESTIGES.md`, the four todos, `~/.claude/agents/gsd-doc-verifier.md`

### Secondary (MEDIUM)
- 166/167 CONTEXT descriptions of the post-phase end state (planned, not yet executed)

### Tertiary (LOW)
- Web search on `ERR_INTERNAL_ASSERTION loadCJSModuleWithModuleLoad` (no authoritative match; the mechanism stays UNCONFIRMED): [lightrun eslint ESM answers](https://lightrun.com/answers/eslint-eslint-err_require_esm-when-requiring-eslintrcjs), [nodejs/node#58515 mirror](https://proxy-ga.blitzz.co/proxy/123456/github.com/nodejs/node/issues/58515)

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH. Nothing new; every tool was exercised.
- Architecture (stubs, checker, generator): HIGH. Each mechanism was reproduced.
- Pitfalls: HIGH for the observations; the ESLint *mechanism* is UNCONFIRMED.
- Post-166/167 content facts: MEDIUM. They must be re-derived at execution (D-16).

**Research date:** 2026-10-01
**Valid until:** execution start of Phase 168 (after 166 and 167 merge). Re-derive every count then.
