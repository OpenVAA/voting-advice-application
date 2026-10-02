# Phase 168 — Docs Audit Ledger

**Base revision:** `0ec229dfe7ee26eafa21882fa37f6d49817e51f9` (`gate-evidence/base-rev.txt`, recorded by 168-01 Task 1
after Phases 166 and 167 were merged).

**Row set (D-20):** one numbered row per hand-written page at the base revision, plus row `G` for the generated set.
The rows are derived, never typed from a count:

```bash
git ls-files -- 'apps/docs/src/routes/(content)' 'apps/docs/src/routes/+page.svelte' | grep -E '/\+page\.(md|svelte)$' | grep -v '/generated/'
```

At the base this prints 93 lines (92 under `(content)/` plus the landing `+page.svelte`); the generated set holds 106
page files (component pages, the component index, the route map).

**Columns:** `Old route` is the URL at base. `New route` and `Verdict` start `pending`; the owner plan fills them.
`Verdict` is one of `current` / `updated` / `merged → <route>` / `deleted (no equivalent: <reason>)` / `redirect stub`.
`Owner plan` follows D-19 (03 Backend + Seed data; 04 Quick start, Architecture, Development, Configuration except
app-settings, Deployment, Troubleshooting; 05 Frontend + Localization; 06 Candidate app, Admin app (`llm-features`), both
app-settings pages; 07 About, landing, Contributing, Publishers' Guide except app-settings, `auto-documentation`, the
generated set). `Planned fate` comes from CONTEXT `<page_inventory>`. `RQ blocks` = `git grep -c '<ResearchQuote' <base> -- <file>`
(22 in total at base, all frozen by `check:research-quotes`).

## Pages

| # | Old route | New route | Owner plan | Planned fate | Verdict | What changed | Claim-ledger anchor | RQ blocks |
|---|---|---|---|---|---|---|---|---|
| 1 | `/about/association` | pending | 168-07 | audit | pending | — | — | 0 |
| 2 | `/about/features` | pending | 168-07 | update shipped / not-shipped facts only (D-05) | pending | — | — | 0 |
| 3 | `/about/intro` | pending | 168-07 | audit | pending | — | — | 0 |
| 4 | `/about/newsletter` | pending | 168-07 | audit | pending | — | — | 0 |
| 5 | `/about/project` | pending | 168-07 | audit | pending | — | — | 0 |
| 6 | `/about/roadmap` | pending | 168-07 | fix the "Update to Svelte 5" status only; Strapi history line is a recorded sweep exception | pending | — | — | 0 |
| 7 | `/about/rules` | pending | 168-07 | audit | pending | — | — | 0 |
| 8 | `/developers-guide/app-and-repo-structure` | pending | 168-04 | move → Architecture (+ data flow: adapter → Supabase); redirect stub | pending | — | — | 0 |
| 9 | `/developers-guide/auto-documentation` | pending | 168-07 | move → About these docs (generation pipeline); redirect stub | pending | — | — | 0 |
| 10 | `/developers-guide/backend/authentication` | pending | 168-03 | rewrite → Authentication and authorisation (Supabase Auth, PKCE, grants, access-token hook, RLS) | pending | — | — | 0 |
| 11 | `/developers-guide/backend/customized-behaviour` | pending | 168-03 | delete (no equivalent: Strapi customisation); redirect stub | pending | — | — | 0 |
| 12 | `/developers-guide/backend/default-data-loading` | pending | 168-03 | merge → Seed data; redirect stub | pending | — | — | 0 |
| 13 | `/developers-guide/backend/intro` | pending | 168-03 | rewrite → Backend (Supabase) overview | pending | — | — | 0 |
| 14 | `/developers-guide/backend/mock-data-generation` | pending | 168-03 | merge → Seed data; redirect stub | pending | — | — | 0 |
| 15 | `/developers-guide/backend/openvaa-admin-tools-plugin-for-strapi` | pending | 168-03 | delete; content → Data import and deletion (new); redirect stub | pending | — | — | 0 |
| 16 | `/developers-guide/backend/plugins` | pending | 168-03 | delete (no equivalent: Strapi plugins); redirect stub | pending | — | — | 0 |
| 17 | `/developers-guide/backend/preparing-backend-dependencies` | pending | 168-04 | delete / fold into Running the development environment; redirect stub | pending | — | — | 0 |
| 18 | `/developers-guide/backend/re-generating-types` | pending | 168-03 | move → Generated types; redirect stub | pending | — | — | 0 |
| 19 | `/developers-guide/backend/running-the-backend-separately` | pending | 168-04 | fold into Running the development environment (db:* scripts); redirect stub | pending | — | — | 0 |
| 20 | `/developers-guide/backend/security` | pending | 168-03 | replace → Authentication and authorisation (RLS, grants); redirect stub | pending | — | — | 0 |
| 21 | `/developers-guide/candidate-user-management/creating-a-new-candidate` | pending | 168-06 | move → Candidate app / Pre-registration and invitation (post-166 flow); redirect stub | pending | — | — | 0 |
| 22 | `/developers-guide/candidate-user-management/mock-data` | pending | 168-03 | delete → Seed data; redirect stub | pending | — | — | 0 |
| 23 | `/developers-guide/candidate-user-management/password-validation` | pending | 168-06 | move → Candidate app / Password validation; redirect stub | pending | — | — | 0 |
| 24 | `/developers-guide/candidate-user-management/registration-process-in-strapi` | pending | 168-06 | move → Candidate app / Registration; redirect stub | pending | — | — | 0 |
| 25 | `/developers-guide/candidate-user-management/resetting-the-password` | pending | 168-06 | move → Candidate app / Login and password reset; redirect stub | pending | — | — | 0 |
| 26 | `/developers-guide/configuration/app-customization` | pending | 168-04 | update (remove Strapi instructions) | pending | — | — | 0 |
| 27 | `/developers-guide/configuration/app-settings` | pending | 168-06 | update: re-derive keys and defaults from packages/app-shared/src/settings (D-06) | pending | — | — | 0 |
| 28 | `/developers-guide/configuration/environmental-variables` | pending | 168-04 | rewrite (single repo-root .env, functions/.env; post-167) | pending | — | — | 0 |
| 29 | `/developers-guide/configuration/intro` | pending | 168-04 | audit; retained as the Configuration overview | pending | — | — | 0 |
| 30 | `/developers-guide/configuration/static-settings` | pending | 168-04 | audit | pending | — | — | 0 |
| 31 | `/developers-guide/contributing/ai-agents` | pending | 168-07 | audit | pending | — | — | 0 |
| 32 | `/developers-guide/contributing/code-style-guide` | pending | 168-07 | update Svelte 5 sections (URL fixed: inbound links) | pending | — | — | 0 |
| 33 | `/developers-guide/contributing/contribute` | pending | 168-07 | audit | pending | — | — | 0 |
| 34 | `/developers-guide/contributing/issues` | pending | 168-07 | audit | pending | — | — | 0 |
| 35 | `/developers-guide/contributing/pull-request` | pending | 168-07 | audit | pending | — | — | 0 |
| 36 | `/developers-guide/contributing/recommended-ide-settings-code` | pending | 168-07 | audit | pending | — | — | 0 |
| 37 | `/developers-guide/contributing/workflows` | pending | 168-07 | audit (CI detail) | pending | — | — | 0 |
| 38 | `/developers-guide/deployment` | pending | 168-04 | rewrite (Render frontend + Supabase Cloud) | pending | — | — | 0 |
| 39 | `/developers-guide/development/intro` | pending | 168-04 | merge → Running the development environment; redirect stub | pending | — | — | 0 |
| 40 | `/developers-guide/development/monorepo` | pending | 168-04 | audit (Turborepo, watch claim) | pending | — | — | 0 |
| 41 | `/developers-guide/development/requirements` | pending | 168-04 | rewrite (no port 1337; Docker for Supabase only) | pending | — | — | 0 |
| 42 | `/developers-guide/development/running-the-development-environment` | pending | 168-04 | rewrite (dev:* vs db:* scripts) | pending | — | — | 0 |
| 43 | `/developers-guide/development/testing` | pending | 168-04 | rewrite (unit, pgTAP, E2E + preflight) | pending | — | — | 0 |
| 44 | `/developers-guide/frontend/accessing-data-and-state-management` | pending | 168-05 | merge → Data API and adapters; redirect stub | pending | — | — | 0 |
| 45 | `/developers-guide/frontend/components` | pending | 168-05 | keep (URL fixed); audit | pending | — | — | 0 |
| 46 | `/developers-guide/frontend/contexts` | pending | 168-05 | update (runes; stable vs reactive accessors) | pending | — | — | 0 |
| 47 | `/developers-guide/frontend/data-api` | pending | 168-05 | rewrite → Data API and adapters; redirect stub | pending | — | — | 0 |
| 48 | `/developers-guide/frontend/environmental-variables` | pending | 168-04 | merge → Configuration / Environment variables; redirect stub | pending | — | — | 0 |
| 49 | `/developers-guide/frontend/intro` | pending | 168-05 | rewrite (Svelte 5 runes) | pending | — | — | 0 |
| 50 | `/developers-guide/frontend/routing` | pending | 168-05 | audit (URL fixed) | pending | — | — | 0 |
| 51 | `/developers-guide/frontend/styling` | pending | 168-05 | audit | pending | — | — | 0 |
| 52 | `/developers-guide/llm-features` | pending | 168-06 | fold → Admin app; redirect stub | pending | — | — | 0 |
| 53 | `/developers-guide/localization/intro` | pending | 168-05 | rewrite (Paraglide + t()) | pending | — | — | 0 |
| 54 | `/developers-guide/localization/local-translations` | pending | 168-05 | merge → Translations and overrides; redirect stub | pending | — | — | 0 |
| 55 | `/developers-guide/localization/locale-routes` | pending | 168-05 | merge → Locale resolution; redirect stub | pending | — | — | 0 |
| 56 | `/developers-guide/localization/locale-selection-step-by-step` | pending | 168-05 | merge → Locale resolution; redirect stub | pending | — | — | 0 |
| 57 | `/developers-guide/localization/localization-in-strapi` | pending | 168-05 | merge / delete → Translations and overrides; redirect stub | pending | — | — | 0 |
| 58 | `/developers-guide/localization/localization-in-the-frontend` | pending | 168-05 | merge → Translations and overrides; redirect stub | pending | — | — | 0 |
| 59 | `/developers-guide/localization/storing-multi-locale-data` | pending | 168-05 | audit | pending | — | — | 0 |
| 60 | `/developers-guide/localization/supported-locales` | pending | 168-05 | audit | pending | — | — | 0 |
| 61 | `/developers-guide/quick-start` | pending | 168-04 | rewrite (yarn install → .env → yarn dev → db:seed; URL fixed: README link) | pending | — | — | 0 |
| 62 | `/developers-guide/troubleshooting` | pending | 168-04 | drop Docker/Strapi sections; keep Husky/Playwright; Supabase/dev-server sections | pending | — | — | 0 |
| 63 | `/publishers-guide/after-publishing-the-vaa/intro` | pending | 168-07 | audit | pending | — | — | 0 |
| 64 | `/publishers-guide/after-publishing-the-vaa/marketing` | pending | 168-07 | audit | pending | — | — | 0 |
| 65 | `/publishers-guide/after-publishing-the-vaa/user-support` | pending | 168-07 | audit | pending | — | — | 0 |
| 66 | `/publishers-guide/app-settings` | pending | 168-06 | update: re-derive keys and defaults from packages/app-shared/src/settings (D-06) | pending | — | — | 0 |
| 67 | `/publishers-guide/data-collection/additional-data-for-the-voter` | pending | 168-07 | audit | pending | — | — | 0 |
| 68 | `/publishers-guide/data-collection/candidates-or-parties-answers` | pending | 168-07 | audit | pending | — | — | 0 |
| 69 | `/publishers-guide/data-collection/data-from-final-election-lists` | pending | 168-07 | audit | pending | — | — | 0 |
| 70 | `/publishers-guide/data-collection/initial-data` | pending | 168-07 | audit | pending | — | — | 0 |
| 71 | `/publishers-guide/data-collection/intro` | pending | 168-07 | audit | pending | — | — | 0 |
| 72 | `/publishers-guide/data-collection/moderation-of-candidate-answers` | pending | 168-07 | audit | pending | — | — | 0 |
| 73 | `/publishers-guide/intro` | pending | 168-07 | audit | pending | — | — | 0 |
| 74 | `/publishers-guide/other-information-sources` | pending | 168-07 | audit | pending | — | — | 0 |
| 75 | `/publishers-guide/preparing/candidates-and-parties-data-be` | pending | 168-07 | audit | pending | — | — | 0 |
| 76 | `/publishers-guide/preparing/intro` | pending | 168-07 | audit prose outside the ResearchQuote blocks only (D-05, D-07) | pending | — | — | 1 |
| 77 | `/publishers-guide/preparing/languages-will-the-vaa-be` | pending | 168-07 | audit | pending | — | — | 0 |
| 78 | `/publishers-guide/preparing/matching` | pending | 168-07 | audit prose outside the ResearchQuote blocks only (D-05, D-07) | pending | — | — | 4 |
| 79 | `/publishers-guide/preparing/the-application-be-hosted` | pending | 168-07 | audit | pending | — | — | 0 |
| 80 | `/publishers-guide/preparing/the-specifics-of-the-elections` | pending | 168-07 | audit prose outside the ResearchQuote blocks only (D-05, D-07) | pending | — | — | 2 |
| 81 | `/publishers-guide/preparing/the-statements-or-questions-posed` | pending | 168-07 | audit prose outside the ResearchQuote blocks only (D-05, D-07) | pending | — | — | 6 |
| 82 | `/publishers-guide/preparing/the-vaa-look-and-feel` | pending | 168-07 | audit | pending | — | — | 0 |
| 83 | `/publishers-guide/preparing/the-voter-see-when-using` | pending | 168-07 | audit prose outside the ResearchQuote blocks only (D-05, D-07) | pending | — | — | 8 |
| 84 | `/publishers-guide/preparing/timeline` | pending | 168-07 | audit | pending | — | — | 0 |
| 85 | `/publishers-guide/preparing/to-ask-voters-to-give` | pending | 168-07 | audit | pending | — | — | 0 |
| 86 | `/publishers-guide/preparing/to-offer-a-survey-for` | pending | 168-07 | audit | pending | — | — | 0 |
| 87 | `/publishers-guide/preparing/what-data-should-be-collected` | pending | 168-07 | audit | pending | — | — | 0 |
| 88 | `/publishers-guide/preparing/what-other-information-is-collected` | pending | 168-07 | audit prose outside the ResearchQuote blocks only (D-05, D-07) | pending | — | — | 1 |
| 89 | `/publishers-guide/preparing/who-is-the-target-group` | pending | 168-07 | audit | pending | — | — | 0 |
| 90 | `/publishers-guide/publish-with-openvaa` | pending | 168-07 | audit | pending | — | — | 0 |
| 91 | `/publishers-guide/what-are-vaas/intro` | pending | 168-07 | audit | pending | — | — | 0 |
| 92 | `/publishers-guide/what-are-vaas/vaas-used` | pending | 168-07 | audit | pending | — | — | 0 |
| 93 | `/` | pending | 168-07 | audit (showcase, project text) | pending | — | — | 0 |
| G | `/developers-guide/frontend/components/generated/**`, `/developers-guide/frontend/routing/generated/**` | pending | 168-07 | regenerate (D-14); the orphan `EntityCardAction` page is deleted by the generator, never by hand | pending | — | — | 0 |

## Redirect stubs

_Filled by 168-02: one row per stub `+page.ts` (old route → target), so a later phase can retire them._

## Sweep exceptions

_Filled by 168-08: every remaining D-21 sweep hit under `apps/docs`, with its reason._

## Verifier reconciliation

_Filled by 168-08: each `gsd-doc-verifier` finding against the claim ledgers, and how it was settled._

## Decisions recorded at execution

- **`configuration/intro` is retained as the Configuration overview** (168-01). The D-02 tree lists only
  Environment variables, Static settings, App settings and App customization under Configuration; the page inventory
  gives `configuration/intro` the fate "audit", and every other section keeps its `<section>/intro` overview, so the
  page stays (owner 168-04) rather than becoming a stub.
- **Inbound-reference anchors are `inbound` findings** (168-01). `validate:links --check` reports a broken `#hash` on an
  `openvaa.org` URL (or on a `docs/src/routes/…/+page.md` path) in a file outside `apps/docs` under the `inbound`
  class, beside that reference's other failures, so `--only inbound` proves both the target and its anchor (the PR
  template's `#self-review` / `#commit-your-update`). Broken anchors of markdown links, hrefs and stub targets inside
  the site are `anchor` findings.
- **Placeholder commands are skipped, not resolved** (168-01). `check-claims.mjs commands` lists a command whose
  workspace or script token is a placeholder (`<…>`, `{…}`, `[…]`, `...`) as skipped; at base the one such command is
  `yarn workspace [module-name] [script-name]` in `development/monorepo`.
- **Docs lint crash cause** (168-01.1, D-15; record `gate-evidence/168-01.1-lint.md` § 2). Order-dependence **CONFIRMED** (the shared
  config imported before `eslint-config-prettier` crashes with `ERR_INTERNAL_ASSERTION`, the reverse order loads, each loads alone);
  Node-version independence **CONFIRMED** (identical on v24.14.1 and CI's v22.22.1); the trigger, the shared config's
  `compat.extends(…, 'prettier')`, **CONFIRMED** (a copy without that entry loads in the crashing order); `eslint-plugin-svelte` as the
  cause (the v1.2 Phase 19 attribution) **REFUTED** (the crash reproduces without it). The Node-internal mechanism stays
  **UNCONFIRMED**: a plain top-level `createRequire` of the same module does not reproduce it. Fix: drop the redundant direct import.
- **`.svelte-kit` is ignored by the docs ESLint config** (168-01.1). ESLint 9 does not read `.gitignore`, and the build output under
  `apps/docs/.svelte-kit/output` otherwise crashes the run (`naming-convention` needs type information on a `.svelte.js` file). The
  frontend config ignores the same directory. No rule changed.
- **Operator ruling 2026-10-02: Option B, "Fix at source, re-anchor freeze"** (168-01.1; D-07 × D-15; record
  `gate-evidence/168-01.1-lint.md` § 8). D-15 (fix every docs lint error at its source, no suppression, no rule weakening) collided
  with the D-07 component freeze: 4 of the 14 docs lint errors sat in `ResearchQuote.svelte` (3) and `ReferenceList.svelte` (1).
  The operator chose to fix them at source and re-anchor only the component part of the freeze; the spans stay anchored to the
  original phase base.
- **D-07 scope exception: lint-only edits to two frozen components** (168-01.1, commit `6090476cc`). `ResearchQuote.svelte`: value
  imports sorted, `type Snippet` moved to a top-level `import type`, `string[]` → `Array<string>`. `ReferenceList.svelte`:
  `string[]` → `Array<string>`. Made with `eslint --fix` plus `prettier --write`; no markup, style or logic line changed. The six
  ResearchQuote pages render byte-identical before and after (dev-server SSR, UUID-normalised; a one-character markup change turned
  all six red). `Author.svelte` is unchanged. Any further edit to the three components is still out of scope.
- **The span gate is re-anchored for the components only** (168-01.1). `check-research-quotes.ts` gained `--component-base <rev>`
  (defaults to `--base`): the 22 spans in 6 pages are still compared byte-for-byte against the original phase base
  (`gate-evidence/base-rev.txt`, `0ec229dfe`), and `COMPONENT_PATHS` against the Task 1 lint-fix commit, recorded in
  `gate-evidence/component-base-rev.txt` (`6090476cc44aa995e3b36368b8a605c96e4ccc1a`). The single documented invocation for every
  later plan and for Phase 169, from the repo root:

  ```bash
  GE=.planning/phases/168-docs-site-rewrite-strapi-to-supabase/gate-evidence
  yarn workspace @openvaa/docs check:research-quotes --base "$(cat $GE/base-rev.txt)" --component-base "$(cat $GE/component-base-rev.txt)"
  ```

  The pre-ruling form `--base "$(cat $GE/base-rev.txt)"` alone now exits 1 by design (it still compares the components to
  `0ec229dfe`). New controls, each red then green: a one-character edit in `Author.svelte` and one in `ResearchQuote.svelte` after the
  re-anchor commit (exit 1, `changed since component base`), and a one-character edit inside block 1 of `preparing/matching` (exit 1
  against the original base, `block 1 differs at character 611`).
- **Root `docs:*` keys stay; their delegation targets are repointed** (168-01.1, D-13). `docs:generate` → `generate:docs`,
  `docs:components` → `generate:component-docs`, `docs:routes` → `generate:route-map` (the workspace names are the real ones);
  `docs:typedoc` and `docs:typedoc-frontend` are deleted. `generate:component-docs` now runs `scripts/generate-component-docs.ts` (it
  named the missing `extract-component-docs.ts`).
- **The generator's missing-source guard no longer exempts `api/` sources** (168-01.1, D-14 fix). With the destination clear added
  after the guard, the old `&& !src.startsWith('api/')` exemption would let a missing `api/` source wipe its destination. No target
  starts with `api/`; the exemption was TypeDoc residue. Record: `gate-evidence/168-01.1-generator-nc.md`.
- **Three TypeDoc lines removed from `apps/docs/README.md` ahead of 168-07's rewrite** (168-01.1). The plan's acceptance grep
  (`git grep -i typedoc -- apps/docs package.json` empty) covers the README; the lines described config files that do not exist. The
  rest of the README is still stale and remains 168-07's to rewrite.

## Dependency reconciliation

_Filled by 168-01.1 (typedoc / typedoc-plugin-markdown, `glob`, the ESLint parser) and 169._

Record: `gate-evidence/168-01.1-audit-deps.md` (logs `168-01.1-audit-before.txt`, `168-01.1-audit-after.txt`).

- **`typedoc` and `typedoc-plugin-markdown` removed from `apps/docs`** (168-01.1, D-13, ruling 5). No script, config or import used
  them once the typedoc scripts, `TYPEDOC_CONFIG` and the commented link code were gone. The lockfile dropped them and 12 transitive
  entries (shiki, markdown-it, linkify-it, lunr and others); no new resolution.
- **`@playwright/test` removed from `apps/docs`** (168-01.1, ruling 5). Its only import was `apps/docs/playwright.config.ts`, deleted with
  the `test` / `test:e2e` scripts; `yarn why` showed no peer requirement from a docs dependency. `playwright` stays (peer of
  `@vitest/browser-playwright` in `vite.config.ts`).
- **`glob` declared in `apps/docs`** at the root's `^11.0.0` (Rider 1; already locked, no new resolution).
- **Audit baseline: rows 1121797 and 1124012 (linkify-it via `markdown-it@14.1.0`) hand-deleted**, note count 69 → 67 (63 → 61 high).
  The chain linkify-it ← markdown-it ← typedoc was typedoc-only in the old lockfile; they are exactly the ids the removal made stale.
  The high+ GHSA set after is a subset of the set before (`comm -13` empty). `--update-baseline` was never run. The `@typescript-eslint/parser`
  question is settled under Cross-phase interactions (named export, no manifest entry).

## Cross-phase interactions

_Filled by 168-01.1 and later plans._

- **The docs ESLint config takes `tsParser` from `@openvaa/shared-config/eslint`** (168-01.1 × 167-D14). The `.svelte` block needs the
  TypeScript parser object for `parserOptions.parser`. 167-D14 removed `@typescript-eslint/parser` from `apps/docs` devDependencies, so
  instead of re-declaring it (a new manifest entry for a SUS-flagged package), `packages/shared-config/eslint.config.mjs`, which already
  imports and depends on it, gained the one-line named export `export { tsParser };` (appended at the end so the line numbers other files
  cite in that config do not move). No install, no lockfile change.

## Out of scope / already done

- **Rider 2 of `2026-08-28-broken-docs-script-references.md` (sqlfluff in the roadmap):** out of scope for this phase
  (D-13).
- **Rider 3 (`$voter` alias):** already done in `dad6569be` ("refactor[frontend]: drop the $voter path alias, whose
  target directory does not exist") (D-13).

## Residue

- **The link check does not run on pull requests** (orchestrator ruling 4 Q1). `docs.yml` runs `generate:docs` (and so
  `validate-links`) only on pushes to `main` touching `apps/docs/**`, so a frontend rename that breaks a generated
  page's source link is caught only after merge. 168-08 files the todo.
