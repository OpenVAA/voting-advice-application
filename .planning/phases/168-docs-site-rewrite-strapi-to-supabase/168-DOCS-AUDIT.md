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
| 1 | `/about/association` | `/about/association` | 168-07 | audit | updated | Audited; operator-authored contact and board data left as written. One typo fixed ("It's purpose"). | `168-07-CLAIMS.md` § Page verdicts | 0 |
| 2 | `/about/features` | `/about/features` | 168-07 | update shipped / not-shipped facts only (D-05) | updated | Code-proven status changes only (D-05): multiple-item text and number opinion questions marked available (no longer "to be added"), boolean added as an opinion type, the locale list extended to the seven compiled locales with the three default ones named, the `csv` import/export bullet removed (`git grep -i csv` finds no code outside binary assets), and the local static-data version marked partial (the server-side adapter exists but `createDataProvider` always returns the Supabase provider). During the Publishers' Guide audit (Task 3) two more were marked not yet available in the application: real-time top results while answering (no code in the frontend) and voter-set statement weights (the matching algorithm accepts `questionWeights`, the frontend never passes them). Preference order stays "to be added" (still a TODO in `@openvaa/data`). Two typos fixed. Everything else left as written. | `168-07-CLAIMS.md` § Page verdicts | 0 |
| 3 | `/about/intro` | `/about/intro` | 168-07 | audit | current | Audited; no change. | `168-07-CLAIMS.md` § Page verdicts | 0 |
| 4 | `/about/newsletter` | `/about/newsletter` | 168-07 | audit | current | Audited (Mailchimp form, Svelte page); no change. | `168-07-CLAIMS.md` § Page verdicts | 0 |
| 5 | `/about/project` | `/about/project` | 168-07 | audit | updated | Audited; the project history and plans are left as written (operator-authored). Four typos fixed (a missing "focus", "orgnasations", "pespective", "Ín"). | `168-07-CLAIMS.md` § Page verdicts | 0 |
| 6 | `/about/roadmap` | `/about/roadmap` | 168-07 | fix the "Update to Svelte 5" status only; Strapi history line is a recorded sweep exception | updated | "Update to Svelte 5" marked "(completed)" (runes forced in `svelte.config.js`). The other plans and the Strapi history line left as written (sweep exception). | `168-07-CLAIMS.md` § Page verdicts | 0 |
| 7 | `/about/rules` | `/about/rules` | 168-07 | audit | current | Audited (Finnish association rules); no change. | `168-07-CLAIMS.md` § Page verdicts | 0 |
| 8 | `/developers-guide/app-and-repo-structure` | `/developers-guide/architecture` | 168-04 | move → Architecture (+ data flow: adapter → Supabase); redirect stub | redirect stub | old URL is a stub → `/developers-guide/architecture` (168-02); content: merged → /developers-guide/architecture (168-04). Kept: the workspace list (re-derived from the 15 workspace manifests; every entry still exists and none was missing) and its grouping. Changed: directory links use `/tree/main/`, each entry gained a one-line role from its manifest, the LLM group is tied to the Admin app. | `168-04-CLAIMS.md` § Page verdicts | 0 |
| 9 | `/developers-guide/auto-documentation` | `/developers-guide/about-these-docs` | 168-07 | move → About these docs (generation pipeline); redirect stub | redirect stub | old URL is a stub → `/developers-guide/about-these-docs` (168-02); content: merged → /developers-guide/about-these-docs (168-07). The three-sentence page ("partly automatically generated … see the README file in the package") is replaced by the pipeline description; the workspace link is kept. | `168-07-CLAIMS.md` § Page verdicts | 0 |
| 10 | `/developers-guide/backend/authentication` | `/developers-guide/backend/authentication` | 168-03 | rewrite → Authentication and authorisation (Supabase Auth, PKCE, grants, access-token hook, RLS) | updated | The Strapi permissions/`BACKEND_API_TOKEN`/route-policy text is replaced by the Supabase model: `@supabase/ssr` cookie sessions, `safeGetSession`, the PKCE callback route, `public.grants`, the role and permission matrix, the access-token hook, `user_can`, grant-only entity identity (`get_candidate_user_data`, `ERR_ENTITY_IDENTITY_AMBIGUOUS`, `idx_grants_one_candidate_editor`), RLS, column grants, storage policies and where the service-role key is used. Nothing from the base text was still correct. | `168-03-CLAIMS.md` § Page verdicts | 0 |
| 11 | `/developers-guide/backend/customized-behaviour` | redirect stub → `/developers-guide/backend/intro` | 168-03 | delete (no equivalent: Strapi customisation); redirect stub | redirect stub | page removed, old URL is a stub (168-02); content: deleted (no equivalent: Strapi code edits and the Strapi admin-tools plugin; the Supabase backend's behaviour is its schema, which the Backend overview describes) (168-03). Nothing carried over; the base page described only Strapi customisation. | `168-03-CLAIMS.md` § Page verdicts | 0 |
| 12 | `/developers-guide/backend/default-data-loading` | redirect stub → `/developers-guide/development/seed-data` | 168-03 | merge → Seed data; redirect stub | redirect stub | page removed, old URL is a stub (168-02); content: merged → /developers-guide/development/seed-data (168-03). The "data loaded on initialisation" topic is now the `seed.sql` baseline section. Strapi question types, app-settings and translation loaders and API-permission setup have no equivalent and are dropped. | `168-03-CLAIMS.md` § Page verdicts | 0 |
| 13 | `/developers-guide/backend/intro` | `/developers-guide/backend/intro` | 168-03 | rewrite → Backend (Supabase) overview | updated | The Strapi stub (one banner and a one-line "scheduled to be migrated" note) is replaced by a Supabase overview written from `apps/supabase`: the two SQL directories, the schema number ranges, the regenerate/reset/types sequence, the parity assertion, project scoping (`PUBLIC_PROJECT_ID`, `public.projects`), pgTAP and SQL lint, local ports, and a map of the section. | `168-03-CLAIMS.md` § Page verdicts | 0 |
| 14 | `/developers-guide/backend/mock-data-generation` | redirect stub → `/developers-guide/development/seed-data` | 168-03 | merge → Seed data; redirect stub | redirect stub | page removed, old URL is a stub (168-02); content: merged → /developers-guide/development/seed-data (168-03). Kept: "local development and testing only", the idea of always-present dev users (now the two `seed.sql` users). Dropped: Faker/Strapi `generateMockData`, `GENERATE_MOCK_DATA_*`, `DEV_*` env vars and Strapi mock users. | `168-03-CLAIMS.md` § Page verdicts | 0 |
| 15 | `/developers-guide/backend/openvaa-admin-tools-plugin-for-strapi` | redirect stub → `/developers-guide/backend/data-import-and-deletion` | 168-03 | delete; content → Data import and deletion (new); redirect stub | redirect stub | page removed, old URL is a stub (168-02); content: deleted (no equivalent: Strapi plugin); bulk RPCs → /developers-guide/backend/data-import-and-deletion (168-03). The plugin's install/usage/registration-email/access-control text has no Supabase counterpart. Its "Import and delete data" topic is now `bulk_import`/`bulk_delete`, documented from `501-bulk-operations.sql` on the new page; its email topic is covered by `/developers-guide/backend/email`. | `168-03-CLAIMS.md` § Page verdicts | 0 |
| 16 | `/developers-guide/backend/plugins` | redirect stub → `/developers-guide/backend/intro` | 168-03 | delete (no equivalent: Strapi plugins); redirect stub | redirect stub | page removed, old URL is a stub (168-02); content: deleted (no equivalent: Strapi plugins for SES email, S3 upload and the admin-tools plugin; email is now the `send-email` function and Supabase Auth, uploads are Supabase Storage) (168-03). Nothing carried over; the email topic is covered on `/developers-guide/backend/email`. | `168-03-CLAIMS.md` § Page verdicts | 0 |
| 17 | `/developers-guide/backend/preparing-backend-dependencies` | redirect stub → `/developers-guide/development/running-the-development-environment` | 168-04 | delete / fold into Running the development environment; redirect stub | redirect stub | page removed, old URL is a stub (168-02); content: merged → /developers-guide/development/running-the-development-environment (168-04). Its only still-true point, that a workspace run on its own needs the shared packages built first, is the `yarn build` step of "The frontend only" (and the Module resolution section of Monorepo and Turborepo). The Strapi-specific part (`@openvaa/strapi` needing `@openvaa/app-shared` built) has no equivalent: `@openvaa/supabase` depends on no workspace. | `168-04-CLAIMS.md` § Page verdicts | 0 |
| 18 | `/developers-guide/backend/re-generating-types` | `/developers-guide/backend/generated-types` | 168-03 | move → Generated types; redirect stub | redirect stub | old URL is a stub → `/developers-guide/backend/generated-types` (168-02); content: merged → /developers-guide/backend/generated-types (168-03). The one Strapi line (`yarn strapi ts:generate-types`) is replaced by `yarn db:types` and the `@openvaa/supabase-types` file roles. | `168-03-CLAIMS.md` § Page verdicts | 0 |
| 19 | `/developers-guide/backend/running-the-backend-separately` | redirect stub → `/developers-guide/development/running-the-development-environment` | 168-04 | fold into Running the development environment (db:* scripts); redirect stub | redirect stub | page removed, old URL is a stub (168-02); content: merged → /developers-guide/development/running-the-development-environment (168-04). Its Strapi steps (`docker compose … up postgres`, `yarn dev`/`yarn start` of Strapi) become "The database only: `yarn db:start` / `yarn db:stop`". The Node-version and `.env` steps are covered by Requirements and Quick start. | `168-04-CLAIMS.md` § Page verdicts | 0 |
| 20 | `/developers-guide/backend/security` | redirect stub → `/developers-guide/backend/authentication` | 168-03 | replace → Authentication and authorisation (RLS, grants); redirect stub | redirect stub | page removed, old URL is a stub (168-02); content: replaced → /developers-guide/backend/authentication (168-03). The 211 lines of Strapi route policies (`filter-by-candidate`, `restrictPopulate`, …) are not translated; the RLS, column-grant and storage-policy sections of Authentication and authorisation replace them. | `168-03-CLAIMS.md` § Page verdicts | 0 |
| 21 | `/developers-guide/candidate-user-management/creating-a-new-candidate` | `/developers-guide/candidate-app/pre-registration-and-invitation` | 168-06 | move → Candidate app / Pre-registration and invitation (post-166 flow); redirect stub | redirect stub | old URL is a stub → `/developers-guide/candidate-app/pre-registration-and-invitation` (168-02); content: merged → /developers-guide/candidate-app/pre-registration-and-invitation (168-06). Kept: the idea that a candidate account comes from an administrator or from bank-identity pre-registration. Dropped: the Strapi admin-panel steps (Content Manager, `registrationKey` field, manual `User` entry with `confirmed`/`blocked`/`role`), the `localhost:1337` URLs, "enabled with the `preRegistration.enabled` static setting" (it is a dynamic app setting), "the feature is partially supported" and the two PR links standing in for documentation. The registration-key contract moved to Registration. | `168-06-CLAIMS.md` § Page verdicts | 0 |
| 22 | `/developers-guide/candidate-user-management/mock-data` | redirect stub → `/developers-guide/development/seed-data` | 168-03 | delete → Seed data; redirect stub | redirect stub | page removed, old URL is a stub (168-02); content: deleted (no equivalent: a link-only page) → Seed data (168-03). Its one link (to the Strapi mock users) is replaced by the Test users section of Seed data. | `168-03-CLAIMS.md` § Page verdicts | 0 |
| 23 | `/developers-guide/candidate-user-management/password-validation` | `/developers-guide/candidate-app/password-validation` | 168-06 | move → Candidate app / Password validation; redirect stub | redirect stub | old URL is a stub → `/developers-guide/candidate-app/password-validation` (168-02); content: merged → /developers-guide/candidate-app/password-validation (168-06). Moved by 168-02 with its text intact (the text was already Supabase-era); its content now lives on the new route, audited below. | `168-06-CLAIMS.md` § Page verdicts | 0 |
| 24 | `/developers-guide/candidate-user-management/registration-process-in-strapi` | `/developers-guide/candidate-app/registration` | 168-06 | move → Candidate app / Registration; redirect stub | redirect stub | old URL is a stub → `/developers-guide/candidate-app/registration` (168-02); content: merged → /developers-guide/candidate-app/registration (168-06). Kept: nothing Strapi-specific; the link to Password validation survives. Dropped: the `users-permissions` plugin, the `POST /api/auth/local/register` endpoint and `candidate.ts`, the `User`/`candidate` relation and `schema.json`, the JWT in local storage and `authenticationStore.ts`, the EJS email templates and their variables (`URL`, `SERVER_URL`, `ADMIN_URL`, `USER`, `TOKEN`). Email templates are now Supabase Auth's (Email page, 168-03). | `168-06-CLAIMS.md` § Page verdicts | 0 |
| 25 | `/developers-guide/candidate-user-management/resetting-the-password` | `/developers-guide/candidate-app/login-and-password-reset` | 168-06 | move → Candidate app / Login and password reset; redirect stub | redirect stub | old URL is a stub → `/developers-guide/candidate-app/login-and-password-reset` (168-02); content: merged → /developers-guide/candidate-app/login-and-password-reset (168-06). Kept: "the user gets an email with a link to reset their password using the forgot password functionality on the login page". Dropped: `PUBLIC_BROWSER_FRONTEND_URL`, the six AWS SES / `MAIL_*` variables, the `users-permissions` email-template settings, LocalStack and its mailbox URL, and the Docker Compose `awslocal` service. Local mail is Inbucket (Email page, 168-03). | `168-06-CLAIMS.md` § Page verdicts | 0 |
| 26 | `/developers-guide/configuration/app-customization` | `/developers-guide/configuration/app-customization` | 168-04 | update (remove Strapi instructions) | updated | Banner and every Strapi step (content type, populate restrictions, `strapiDataProvider`, `StrapiAppCustomizationData`, `dynamic.json` preload) removed. Now: the fields, storage in `app_settings.customization` per project, the `StoredCustomizationSchema` shape, how `_getAppCustomization` validates/localizes/resolves image URLs, the overrides loaded first by the root layout, editing without an Admin-app editor, and the three-step recipe for a new option. | `168-04-CLAIMS.md` § Page verdicts | 0 |
| 27 | `/developers-guide/configuration/app-settings` | `/developers-guide/configuration/app-settings` | 168-06 | update: re-derive keys and defaults from packages/app-shared/src/settings (D-06) | updated | D-06 re-derivation. Kept: the static/dynamic split, the links to the four settings files and the two "Adding new settings" lists' first two steps. Dropped: the partial-Strapi banner, "implemented only in Strapi" and the loading of defaults into Strapi, the `settings` store in `stores.ts`, "static settings are merged last" (they are merged first), and steps 3-7 (Strapi components, the `app-settings` controller, `strapiDataProvider.ts` populate params, `StrapiAppSettingsData`, `loadDefaultAppSettings`). Added: the `app_settings.settings` column, `StoredSettingsSchema` validation and partial preserve, notification localization, the no-row `project_open_for_voters` rule, read access, the static → dynamic → stored merge by top-level key, editing without an Admin App editor, the 53-key table with defaults (Key coverage), the question-object shape, and the `StoredSettingsSchema` step for a new dynamic setting. | `168-06-CLAIMS.md` § Page verdicts | 0 |
| 28 | `/developers-guide/configuration/environmental-variables` | `/developers-guide/configuration/environmental-variables` | 168-04 | rewrite (single repo-root .env, functions/.env; post-167) | updated | Banner and the Strapi / LocalStack / SES / S3 / mock-data / disk-cache list removed. Rewritten for the post-167 model: the single repo-root `.env` read by SvelteKit (`kit.env.dir`), Vite, dev-seed and Playwright; the empty `apps/frontend/.env.example`; the separate `functions/.env`; the four twins and `yarn check:env-local`; `PUBLIC_PROJECT_ID` (mandatory, no fallback); the constants-module rule; every variable of the three templates by group, one line each. The `behind_cloudflare` pointer kept, its link fixed (no trailing slash). | `168-04-CLAIMS.md` § Page verdicts | 0 |
| 29 | `/developers-guide/configuration/intro` | `/developers-guide/configuration/intro` | 168-04 | audit; retained as the Configuration overview | updated | Retained as the Configuration overview (168-01 decision). "Split into three parts" with four links becomes four layers with one paragraph each: environment variables (root `.env`, functions `.env`), static settings, app settings (`app_settings.settings`, linking 168-06's page) and app customization (`app_settings.customization`). Link texts corrected ("Environment variables", "App settings", "App customization"). | `168-04-CLAIMS.md` § Page verdicts | 0 |
| 30 | `/developers-guide/configuration/static-settings` | `/developers-guide/configuration/static-settings` | 168-04 | audit | updated | Audited against `staticSettings.ts` / `.type.ts`. Removed the "planned to be moved to dynamic settings" note (a plan, not code) and the "Candidate App pre-registration" bullet (no such setting in the type). Each remaining group now names its key (`admin.email`, `appVersion`, `dataAdapter` with `pageSize` = `max_rows`, `colors`, `font`, `supportedLocales`, `analytics`) and the rebuild requirement; the type file stays the reference. | `168-04-CLAIMS.md` § Page verdicts | 0 |
| 31 | `/developers-guide/contributing/ai-agents` | `/developers-guide/contributing/ai-agents` | 168-07 | audit | updated | "Agent information is only provided for Claude in CLAUDE.md" widened to the three sources that exist (CLAUDE.md, `.claude/skills`, `.agents/code-review-checklist.md`); the trigger list now names the four events `claude.yml` listens to, the access rule is "write, maintain or admin access" (the workflow's permission check) instead of "repository member", and the two hand-startable workflows are mentioned. | `168-07-CLAIMS.md` § Page verdicts | 0 |
| 32 | `/developers-guide/contributing/code-style-guide` | `/developers-guide/contributing/code-style-guide` | 168-07 | update Svelte 5 sections (URL fixed: inbound links) | updated | URL and the headings `Comments` / `Svelte components` kept (the PR checklist links both anchors). The Svelte 4 note, every `export let` / `$$Props` / `$$restProps` example and the dead `IconBase` links are replaced by the runes-era conventions from the code: runes forced by `svelte.config.js`, the `svelte/store` ESLint ban, the third component library (`$candidate/components`), `$props()` typed by a co-located `.type.ts` with defaults in the destructuring and `$derived` instead of reassignment, `HeroEmoji` as it is now, attribute order before the spread, `concatClass` (tailwind-merge, caller wins), renaming dashed attributes in the destructuring, snippets with `{@render}` (Button's `badge`), `Snippet Props` instead of `Slots` in the docstring, `Button` as the documentation example, and the Svelte 5 FAQ link. Three typos fixed. | `168-07-CLAIMS.md` § Page verdicts | 0 |
| 33 | `/developers-guide/contributing/contribute` | `/developers-guide/contributing/contribute` | 168-07 | audit | updated | `#commit-your-update` heading kept. Corrected: `.vscode` and `.idea` ARE in the project's `.gitignore` (the page said they were not). The self-review link now has no trailing slash before the anchor. | `168-07-CLAIMS.md` § Page verdicts | 0 |
| 34 | `/developers-guide/contributing/issues` | `/developers-guide/contributing/issues` | 168-07 | audit | updated | Audited; editorial (labels, milestones) left as written. One typo fixed ("Fox example"). | `168-07-CLAIMS.md` § Page verdicts | 0 |
| 35 | `/developers-guide/contributing/pull-request` | `/developers-guide/contributing/pull-request` | 168-07 | audit | updated | `#self-review` heading kept. "pull requested template" → "pull request template"; the self-link to the checklist is a same-page `#self-review`; three cross-page anchor links lose the trailing slash before `#`. Checklist content unchanged. | `168-07-CLAIMS.md` § Page verdicts | 0 |
| 36 | `/developers-guide/contributing/recommended-ide-settings-code` | `/developers-guide/contributing/recommended-ide-settings-code` | 168-07 | audit | updated | "Pretter" typo fixed; the Git Graph link pointed at the ESLint extension and now points at Git Graph (`mhutchie.git-graph`). | `168-07-CLAIMS.md` § Page verdicts | 0 |
| 37 | `/developers-guide/contributing/workflows` | `/developers-guide/contributing/workflows` | 168-07 | audit (CI detail) | updated | The one-paragraph page is rewritten from `main.yaml`, `docs.yml`, `release.yml` and the Claude workflows: triggers and `paths-ignore`, the twelve `main.yaml` jobs with what each runs, and the three other workflow groups. | `168-07-CLAIMS.md` § Page verdicts | 0 |
| 38 | `/developers-guide/deployment` | `/developers-guide/deployment` | 168-04 | rewrite (Render frontend + Supabase Cloud) | updated | Banner, the Costs section (its figures were for the Strapi + Render Postgres + AWS stack; no Supabase-era figure exists in the repo), the AWS/SES/S3 env block, Render Postgres, the Strapi backend service, the Strapi admin/API-token steps, the backend-URL pair and the Strapi build section removed. Now: Render frontend container (`render.example.yaml`, `apps/frontend/Dockerfile`, its env keys, `PUBLIC_PROJECT_ID` to add, service-role key never on the frontend) plus Supabase Cloud (migrations, buckets, access-token hook, auth URLs, SMTP, `max_rows`, account/project rows, `storage_config`, Edge Functions and secrets), the 167 operator note for older Render services, the feedback rate-limit section (kept, re-anchored), and `docker-compose.dev.yml` for a local production build. The custom-domain step kept. | `168-04-CLAIMS.md` § Page verdicts | 0 |
| 39 | `/developers-guide/development/intro` | redirect stub → `/developers-guide/development/running-the-development-environment` | 168-04 | merge → Running the development environment; redirect stub | redirect stub | page removed, old URL is a stub (168-02); content: merged → /developers-guide/development/running-the-development-environment (168-04). Its one paragraph (nav title "Docker": run everything in Docker containers with LocalStack, or the frontend/backend separately) is obsolete except the idea of running the whole stack or parts of it, which is the "Running the parts separately" section. | `168-04-CLAIMS.md` § Page verdicts | 0 |
| 40 | `/developers-guide/development/monorepo` | `/developers-guide/development/monorepo` | 168-04 | audit (Turborepo, watch claim) | updated | Audited against `turbo.json` and the root scripts. Added a Turborepo section (task ordering, caching, `lint:check`). `yarn workspaces foreach -A build` replaced by `yarn build`. The watch claim corrected: `yarn watch:shared` (`turbo watch build` over `packages/*`) rebuilds packages; the claim that the frontend is restarted is dropped (the dev server's restart plugin watches only the root `.env`). Runtime resolution now names the `exports` → `dist/` mechanism and the two source-exporting packages (`dev-seed`, `supabase-types`). Placeholder command reworded to `<workspace-name> <script-name>`. | `168-04-CLAIMS.md` § Page verdicts | 0 |
| 41 | `/developers-guide/development/requirements` | `/developers-guide/development/requirements` | 168-04 | rewrite (no port 1337; Docker for Supabase only) | updated | "Yarn 4", "Docker (unless you plan to run the app outside of Docker)" and "ports 1337, 5173 and 5432" are replaced by: Node per `engines` (and the `preinstall` / `lint:check` check), Yarn per `packageManager` and the committed `yarnPath`, a container runtime for the Supabase CLI, the CLI as a workspace dependency, Playwright browsers for E2E only, and the real ports. No version numbers. | `168-04-CLAIMS.md` § Page verdicts | 0 |
| 42 | `/developers-guide/development/running-the-development-environment` | `/developers-guide/development/running-the-development-environment` | 168-04 | rewrite (dev:* vs db:* scripts) | updated | Banner and the Docker hot-reloading section (a `backend/vaa-strapi` compose file) removed. Now: the `db:*` / `dev:*` script tables from the root manifest, what `yarn dev` runs step by step, running the database, frontend or watcher alone, ports and `FRONTEND_PORT`, `.env` restart, resetting. Kept from the old page: `yarn install`, root `.env` only, `yarn db:stop`, `yarn db:reset`, the Seed data link. | `168-04-CLAIMS.md` § Page verdicts | 0 |
| 43 | `/developers-guide/development/testing` | `/developers-guide/development/testing` | 168-04 | rewrite (unit, pgTAP, E2E + preflight) | updated | Banner and the `GENERATE_MOCK_DATA_ON_RESTART` sentence removed; the "run `yarn build` first" step dropped (turbo's `test:unit` depends on `build`). Added the unit-coverage assertion, per-workspace tests, pgTAP (`test:db`), Edge Function tests, and E2E through `tests/scripts/e2e-run.sh` (`--run-dir`, `--no-db-reset`, `--project`). The old "`yarn dev`, then `yarn test:e2e`" recipe was wrong (a plain `yarn dev` serves the default project and the preflight aborts); it now starts the dev server with the suite's `PUBLIC_PROJECT_ID`. The Playwright-project detail moved to a `tests/README.md` link. | `168-04-CLAIMS.md` § Page verdicts | 0 |
| 44 | `/developers-guide/frontend/accessing-data-and-state-management` | redirect stub → `/developers-guide/frontend/data-api-and-adapters` | 168-05 | merge → Data API and adapters; redirect stub | redirect stub | page removed, old URL is a stub (168-02); content: merged → /developers-guide/frontend/data-api-and-adapters (168-05). Kept: the load → `dataRoot` → contexts paradigm, now § How loaded data reaches components with the real loaders and layouts. Dropped: "either a Strapi backend is accessed or data is read from local `json` files", the `PUBLIC_CACHE_ENABLED` cache reroute, the `$lib/server/_api/serverDataProvider` chain, the `[lang]` paths and `export let data` in the flowchart, and `dataRoot` as a `Readable` store. | `168-05-CLAIMS.md` § Page verdicts | 0 |
| 45 | `/developers-guide/frontend/components` | `/developers-guide/frontend/components` | 168-05 | keep (URL fixed); audit | updated | Audited; the URL is unchanged. Kept: the dynamic/static split and the generated index link. Added: the third library (`$candidate/components`), the import aliases, the barrel rule, and the runes-era conventions from `Button` (`$props()` typed by a co-located `.type.ts`, snippets with `{@render}`, `concatClass` with caller-wins merging, the `svelte/store` ban, the `@component` comment the generator reads). The Code style guide link no longer carries an anchor (that page is 168-07's). | `168-05-CLAIMS.md` § Page verdicts | 0 |
| 46 | `/developers-guide/frontend/contexts` | `/developers-guide/frontend/contexts` | 168-05 | update (runes; stable vs reactive accessors) | updated | Every member described as a "store" (`Readable<…>`, `Writable<…>`, `StackedStore`, `AnswerStore`, `UserDataStore`) and the "Contexts vs global stores" section removed; `/[lang]` initialisers replaced by the real layouts; the broken `#example-loading-cascade-…` anchor removed (the cascade now lives in Data API and adapters § How loaded data reaches components, linked instead); the stray table row removed; `AdminContext` "TBA" filled. Added: `FilterContext`, `init*` / `get*` errors, the runes-based members, the stable-reference versus reactive-accessor classes, the two prohibitions (never destructure a reactive accessor; never alias `dataRoot`, guarded by `noDataRootDerivedAlias.test.ts`), the spread caveat and `setDataRoot`. | `168-05-CLAIMS.md` § Page verdicts | 0 |
| 47 | `/developers-guide/frontend/data-api` | `/developers-guide/frontend/data-api-and-adapters` | 168-05 | rewrite → Data API and adapters; redirect stub | redirect stub | old URL is a stub → `/developers-guide/frontend/data-api-and-adapters` (168-02); content: merged → /developers-guide/frontend/data-api-and-adapters (168-05). Kept: the three-service idea (provider, data writer, feedback writer; now four with the admin writer), the folder-structure list and the class diagram, both rewritten. Dropped: the Cache section (`/api/cache`, the disk cache, the `CACHE_` variables; removed in 167), the Strapi adapter folder and the Strapi classes, `routes/[lang=locale]/`, the `candidate/login` and `preregisterWithApiToken` route entries (the preregister route is reached by `preregisterWithIdToken`), and "the implementation specified in the settings is returned" (the client always gets the Supabase provider). | `168-05-CLAIMS.md` § Page verdicts | 0 |
| 48 | `/developers-guide/frontend/environmental-variables` | redirect stub → `/developers-guide/configuration/environmental-variables` | 168-04 | merge → Configuration / Environment variables; redirect stub | redirect stub | page removed, old URL is a stub (168-02); content: merged → /developers-guide/configuration/environmental-variables (168-04). Kept: "variables are read only through `$lib/utils/constants` (public) and `$lib/server/constants` (private) and imported as the `constants` object", re-checked against the two modules (`$env/dynamic/public` / `$env/dynamic/private`; no other module imports `$env/*`). Dropped: the `PUBLIC_BROWSER_BACKEND_URL` example (removed in 167) and the unverified "production compilation intricacies" reason; the example now reads `PUBLIC_PROJECT_ID`. | `168-04-CLAIMS.md` § Page verdicts | 0 |
| 49 | `/developers-guide/frontend/intro` | `/developers-guide/frontend/intro` | 168-05 | rewrite (Svelte 5 runes) | updated | The "currently uses Svelte 4" note and the one-line "See also" are replaced by the stack (SvelteKit with adapter-node, Svelte 5 with runes forced on outside `node_modules`, Tailwind + DaisyUI, Paraglide, Supabase, Vitest), the three aliases from `svelte.config.js`, the key `src/lib` directories, the three request hooks and `reroute`, the three app route roots and the workspace scripts. No version numbers; `package.json` and the `.yarnrc.yml` catalog are linked instead. | `168-05-CLAIMS.md` § Page verdicts | 0 |
| 50 | `/developers-guide/frontend/routing` | `/developers-guide/frontend/routing` | 168-05 | audit (URL fixed) | updated | Audited; the URL is unchanged. Kept: route versus search parameters, `params.ts`, `impliedParams.ts`, `buildRoute`, the `getRoute` handle and its examples, the generated route map link. Added: no locale segment (`reroute` / `deLocalizeUrl`, `localizeHref`), the route tree table (`(voters)`, `(located)`, `candidate`, `candidate/(protected)`, `admin`, `admin/(protected)`, `api`), `PROTECTED_GROUP`, the `$lib/routes` modules (`ROUTE`, membership predicates, `APP_GATES`), `routeConsistency.test.ts` and its two registered unbuilt keys, `ROUTE_PARAMS` / `PERSISTENT_SEARCH_PARAMS` / `ARRAY_PARAMS`, the `etPl` / `etSg` matchers, and `getRoute` as a stable reference. Changed: the route-parameter example (`entityType` / `entityId` are listed in `ROUTE_PARAMS` but no route uses them; the example is now `questionId` and the results segments). | `168-05-CLAIMS.md` § Page verdicts | 0 |
| 51 | `/developers-guide/frontend/styling` | `/developers-guide/frontend/styling` | 168-05 | audit | updated | `tailwind.config.cjs` (does not exist) replaced by the CSS-first configuration in `app.css` (`@import 'tailwindcss'`, `@plugin 'daisyui'`, `@plugin 'daisyui/theme'`, `@theme`, the `@source inline` safelist, `tailwind-theme.css` for `@reference`). Kept: the colour table (values re-checked against `app.css`), contrast rules, `color-test.txt`, z-index (re-derived: `z-10` users corrected, the page header no longer uses it), the Modal top-layer note. Added: how `StaticSettings.colors` relates to the theme (see F2). "See `app.css`" made specific (`@layer base`). | `168-05-CLAIMS.md` § Page verdicts | 0 |
| 52 | `/developers-guide/llm-features` | `/developers-guide/admin-app` | 168-06 | fold → Admin app; redirect stub | redirect stub | old URL is a stub → `/developers-guide/admin-app` (168-02); content: merged → /developers-guide/admin-app (168-06). Its one sentence ("See the relevant packages for these experimental features") is kept as the Packages section, now with links. | `168-06-CLAIMS.md` § Page verdicts | 0 |
| 53 | `/developers-guide/localization/intro` | `/developers-guide/localization/intro` | 168-05 | rewrite (Paraglide + t()) | updated | `sveltekit-i18n`, `@sveltekit-i18n/parser-icu`, the "Svelte 5 built-in localization" note, the optional `lang` route parameter, `$t('foo.bar')` and soft locale matching in routes removed. Now: Paraglide messages in `messages/<locale>/` compiled by the Vite plugin or `paraglide:compile`, the typed `t()` wrapper (plain function, `TranslationKey`), runtime overrides first and the key as last fallback, the `url` strategy with an unprefixed base locale, adapter-side localization of data, and links to the four other pages. | `168-05-CLAIMS.md` § Page verdicts | 0 |
| 54 | `/developers-guide/localization/local-translations` | redirect stub → `/developers-guide/localization/translations-and-overrides` | 168-05 | merge → Translations and overrides; redirect stub | redirect stub | page removed, old URL is a stub (168-02); content: merged → /developers-guide/localization/translations-and-overrides (168-05). Kept almost entirely (it was already Paraglide-era): the file-per-namespace layout and namespace key, `pathPattern`, the file-organisation principles (extended with `adminApp.*`, `common`, `dynamic`, `lang`), "add for all locales", the `TranslationKey` type and its generator, `assertTranslationKey`, and the stale-type test. | `168-05-CLAIMS.md` § Page verdicts | 0 |
| 55 | `/developers-guide/localization/locale-routes` | redirect stub → `/developers-guide/localization/locale-resolution` | 168-05 | merge → Locale resolution; redirect stub | redirect stub | page removed, old URL is a stub (168-02); content: merged → /developers-guide/localization/locale-resolution (168-05). Kept: "switching locale changes only the locale part of the URL" (now the language menu with `localizeHref`) and building links in another locale (now `getRoute.current({ locale })` on the `AppContext`, not a `getRoute` store on the `I18nContext`). Dropped: the optional `locale` route parameter, the `Accept-Language` redirects, and the soft-match redirects (`/en-UK/foo` → `/en/foo`); none exists with the `url` strategy. | `168-05-CLAIMS.md` § Page verdicts | 0 |
| 56 | `/developers-guide/localization/locale-selection-step-by-step` | `/developers-guide/localization/locale-resolution` | 168-05 | merge → Locale resolution; redirect stub | redirect stub | old URL is a stub → `/developers-guide/localization/locale-resolution` (168-02); content: merged → /developers-guide/localization/locale-resolution (168-05). The old body (moved here by 168-02) described `hooks.server.ts` parsing `Accept-Language` into `preferredLocale`, the `lang`-parameter redirect table, and `routes/[[lang=locale]]/+layout.ts` calling `loadTranslations` / `addTranslations` / `setRoute`. All replaced by Paraglide's strategy order, `reroute` / `deLocalizeUrl`, `paraglideHandle` (`event.locals.currentLocale`, `%lang%`), `getLocale()`, the root `+layout.ts` locale, and `setOverrides` (on Translations and overrides). | `168-05-CLAIMS.md` § Page verdicts | 0 |
| 57 | `/developers-guide/localization/localization-in-strapi` | redirect stub → `/developers-guide/localization/storing-multi-locale-data` (retargeted by 168-08; was `translations-and-overrides`) | 168-05 | merge / delete → Translations and overrides; redirect stub | redirect stub | page removed, old URL is a stub (168-02); content: merged → /developers-guide/localization/translations-and-overrides (168-05). Survives: translated strings stored as a locale-keyed JSON object (`LocalizedString`) and the data provider picking the requested locale. Both are now on Multi-locale data (§ Storage, § Reading), which Translations and overrides links from its override section, where override values use the same format. Dropped: Strapi's i18n plugin, the ICU plural example (stored overrides are interpolated with `intl-messageformat`, but the catalogue uses inlang variants). See F4 on the stub target. | `168-05-CLAIMS.md` § Page verdicts | 0 |
| 58 | `/developers-guide/localization/localization-in-the-frontend` | `/developers-guide/localization/translations-and-overrides` | 168-05 | merge → Translations and overrides; redirect stub | redirect stub | old URL is a stub → `/developers-guide/localization/translations-and-overrides` (168-02); content: merged → /developers-guide/localization/translations-and-overrides (168-05). Kept: one function for all messages whatever their source, overrides winning over local messages, already-translated Data API data. Dropped: `$t(…)` and the `I18nContext` store, "never import stores from `$lib/i18n`", ICU `parse()` interpolation and `updateDefaultPayload` (neither exists), and the `export let` reactive-default example (the locale is constant per page, so a value from `t()` at init stays correct). | `168-05-CLAIMS.md` § Page verdicts | 0 |
| 59 | `/developers-guide/localization/storing-multi-locale-data` | `/developers-guide/localization/storing-multi-locale-data` | 168-05 | audit | updated | Audited. Kept: single-locale data in components versus multi-locale data in the backend and the Candidate App, and the `Localized*` types in `@openvaa/app-shared`. Added: `jsonb` locale objects in the schema, `getLocalized` and its fallback order, the adapter `locale` / `defaultLocale`, the SQL `get_localized` (email helpers only), multilingual writes and inputs, `translate` from the contexts, and the separate `@openvaa/data` `LocalizedValue` / `translate`. "Admin App" dropped from the multi-locale sentence (not verified). | `168-05-CLAIMS.md` § Page verdicts | 0 |
| 60 | `/developers-guide/localization/supported-locales` | `/developers-guide/localization/supported-locales` | 168-05 | audit | updated | Audited. Kept: the four-step recipe for adding a locale. Added: the compiled locales (`project.inlang/settings.json` `locales`, `baseLocale`) versus the offered locales (`supportedLocales`), `isDefault` and the first-entry default, the error for an uncompiled `code`, `lang.json` display names, and a fifth step (run the translation tests and update their expected locale list). | `168-05-CLAIMS.md` § Page verdicts | 0 |
| 61 | `/developers-guide/quick-start` | `/developers-guide/quick-start` | 168-04 | rewrite (yarn install → .env → yarn dev → db:seed; URL fixed: README link) | updated | The Docker Compose run, the swapped ports (app on 1337, backend on 5173) and the Strapi `admin`/`admin` login are replaced by the Supabase-CLI sequence: `yarn install`, the root `.env` from `.env.example` (the preset `PUBLIC_PROJECT_ID`, the local stack's keys from `supabase status -o env`), `yarn dev` (what it starts, the port, `strictPort`), `yarn db:seed:default` / `yarn db:reset-with-data`, and the Studio and email-testing ports. | `168-04-CLAIMS.md` § Page verdicts | 0 |
| 62 | `/developers-guide/troubleshooting` | `/developers-guide/troubleshooting` | 168-04 | drop Docker/Strapi sections; keep Husky/Playwright; Supabase/dev-server sections | updated | Banner, all Docker sections (frozen lockfile, base image, no space left, `extends`), all Strapi sections, the Strapi "Bad Request" registration section and the broken `#docker-error-no-space-left-on-device-…` self-anchor removed. Husky section rewritten for the `prepare: husky` setup; Playwright locale section corrected (locators are mostly test ids; the localisation spec expects `en`/`fi`/`sv`). Added: busy port (`strictPort`), Supabase not starting / ports in use, `PUBLIC_PROJECT_ID` errors, empty app, missing service-role key, Edge Function 500, stale Vite cache (`yarn dev:clean`), resetting, and the E2E preflight failure. | `168-04-CLAIMS.md` § Page verdicts | 0 |
| 63 | `/publishers-guide/after-publishing-the-vaa/intro` | `/publishers-guide/after-publishing-the-vaa/intro` | 168-07 | audit | current | Audited; editorial guidance only; no change. | `168-07-CLAIMS.md` § Page verdicts | 0 |
| 64 | `/publishers-guide/after-publishing-the-vaa/marketing` | `/publishers-guide/after-publishing-the-vaa/marketing` | 168-07 | audit | current | Audited; editorial guidance only; no change. | `168-07-CLAIMS.md` § Page verdicts | 0 |
| 65 | `/publishers-guide/after-publishing-the-vaa/user-support` | `/publishers-guide/after-publishing-the-vaa/user-support` | 168-07 | audit | current | Audited; editorial guidance only; no change. | `168-07-CLAIMS.md` § Page verdicts | 0 |
| 66 | `/publishers-guide/app-settings` | `/publishers-guide/app-settings` | 168-06 | update: re-derive keys and defaults from packages/app-shared/src/settings (D-06) | updated | D-06 re-derivation; H1 kept. Kept: the intro and most per-key prose (D-03). Dropped: the partial-Strapi banner, "edited in the Strapi dashboard" (twice) and the "built-in features" bullet with no section behind it. Fixed: the broken `#customization` anchor (now `/developers-guide/configuration/app-customization`), `organization` card and tab value `candidates` → `children`, `submatches` described as category scores, `showMissing*` as per-entity-type settings, `showSurveyPopup`'s condition (`survey.showIn`, not `analytics.survey`; F10), the mis-indented `results.cardContents.organization`. Added: `alliance` tabs and card contents, `results.sections` values, `preRegistration.enabled`, every default, where a project's values are stored and that a stored group replaces the whole default group (F11). | `168-06-CLAIMS.md` § Page verdicts | 0 |
| 67 | `/publishers-guide/data-collection/additional-data-for-the-voter` | `/publishers-guide/data-collection/additional-data-for-the-voter` | 168-07 | audit | current | Audited; editorial checklist; no change. | `168-07-CLAIMS.md` § Page verdicts | 0 |
| 68 | `/publishers-guide/data-collection/candidates-or-parties-answers` | `/publishers-guide/data-collection/candidates-or-parties-answers` | 168-07 | audit | current | Audited; editorial; no change. | `168-07-CLAIMS.md` § Page verdicts | 0 |
| 69 | `/publishers-guide/data-collection/data-from-final-election-lists` | `/publishers-guide/data-collection/data-from-final-election-lists` | 168-07 | audit | updated | Audited; one typo fixed ("election numbers of symbols" → "or symbols"). | `168-07-CLAIMS.md` § Page verdicts | 0 |
| 70 | `/publishers-guide/data-collection/initial-data` | `/publishers-guide/data-collection/initial-data` | 168-07 | audit | updated | Audited; one missing word restored ("you will need to provide the data below"). | `168-07-CLAIMS.md` § Page verdicts | 0 |
| 71 | `/publishers-guide/data-collection/intro` | `/publishers-guide/data-collection/intro` | 168-07 | audit | current | Audited; editorial; no change. | `168-07-CLAIMS.md` § Page verdicts | 0 |
| 72 | `/publishers-guide/data-collection/moderation-of-candidate-answers` | `/publishers-guide/data-collection/moderation-of-candidate-answers` | 168-07 | audit | current | Audited; the open-answer fact matches the code (answers can carry a free-form explanation); no change. | `168-07-CLAIMS.md` § Page verdicts | 0 |
| 73 | `/publishers-guide/intro` | `/publishers-guide/intro` | 168-07 | audit | current | Audited; no change. | `168-07-CLAIMS.md` § Page verdicts | 0 |
| 74 | `/publishers-guide/other-information-sources` | `/publishers-guide/other-information-sources` | 168-07 | audit | current | Audited; external references; no change. | `168-07-CLAIMS.md` § Page verdicts | 0 |
| 75 | `/publishers-guide/preparing/candidates-and-parties-data-be` | `/publishers-guide/preparing/candidates-and-parties-data-be` | 168-07 | audit | updated | Email-based registration now describes the invitation flow as the code has it (the candidate is sent an invitation email, sets a password and logs in) instead of "signing up with their email". Bank-authentication storage (full name, birth date), the FAQ page and the editorial guidance checked and kept. | `168-07-CLAIMS.md` § Page verdicts | 0 |
| 76 | `/publishers-guide/preparing/intro` | `/publishers-guide/preparing/intro` | 168-07 | audit prose outside the ResearchQuote blocks only (D-05, D-07) | current | Audited prose outside the one ResearchQuote block; no change. Block and import untouched. | `168-07-CLAIMS.md` § Page verdicts | 1 |
| 77 | `/publishers-guide/preparing/languages-will-the-vaa-be` | `/publishers-guide/preparing/languages-will-the-vaa-be` | 168-07 | audit | current | Audited; the translations folder link (`apps/frontend/messages`) and the Supported locales link resolve; no change. | `168-07-CLAIMS.md` § Page verdicts | 0 |
| 78 | `/publishers-guide/preparing/matching` | `/publishers-guide/preparing/matching` | 168-07 | audit prose outside the ResearchQuote blocks only (D-05, D-07) | updated | Prose outside the four ResearchQuote blocks only: the distance metric is fixed to Manhattan in the app (other metrics need a source-code change), only candidates are hidden for missing answers (parties are always included), and empty candidate answers ARE penalised as maximally distant (`RelativeMaximum`). Blocks and import untouched (span gate exit 0). | `168-07-CLAIMS.md` § Page verdicts | 4 |
| 79 | `/publishers-guide/preparing/the-application-be-hosted` | `/publishers-guide/preparing/the-application-be-hosted` | 168-07 | audit | updated | "You may opt for a static website with no separate database" is not possible with the code at HEAD (the app always reads from Supabase); replaced with that fact and a link to Deployment. | `168-07-CLAIMS.md` § Page verdicts | 0 |
| 80 | `/publishers-guide/preparing/the-specifics-of-the-elections` | `/publishers-guide/preparing/the-specifics-of-the-elections` | 168-07 | audit prose outside the ResearchQuote blocks only (D-05, D-07) | current | Audited prose outside the two ResearchQuote blocks (election selection, hierarchical constituencies, alliances match the settings and data model); no change. | `168-07-CLAIMS.md` § Page verdicts | 2 |
| 81 | `/publishers-guide/preparing/the-statements-or-questions-posed` | `/publishers-guide/preparing/the-statements-or-questions-posed` | 168-07 | audit prose outside the ResearchQuote blocks only (D-05, D-07) | updated | Prose outside the six ResearchQuote blocks only: the answer-type paragraph adds that yes/no and numeric (min/max) questions can also be used in matching. Blocks and import untouched. | `168-07-CLAIMS.md` § Page verdicts | 6 |
| 82 | `/publishers-guide/preparing/the-vaa-look-and-feel` | `/publishers-guide/preparing/the-vaa-look-and-feel` | 168-07 | audit | current | Audited; the listed customisations exist (logo and poster in App customization, colours and font in static settings, text overrides); no change. | `168-07-CLAIMS.md` § Page verdicts | 0 |
| 83 | `/publishers-guide/preparing/the-voter-see-when-using` | `/publishers-guide/preparing/the-voter-see-when-using` | 168-07 | audit prose outside the ResearchQuote blocks only (D-05, D-07) | updated | Prose outside the eight ResearchQuote blocks only: statement weights and real-time top results are marked "not yet available" in the process list and their sections (no frontend code for either; the matching algorithm supports weights). Everything else (category intros and selection, results link, sections, card contents, top-3 sub-cards, details tabs) matches the settings. Blocks and import untouched. | `168-07-CLAIMS.md` § Page verdicts | 8 |
| 84 | `/publishers-guide/preparing/timeline` | `/publishers-guide/preparing/timeline` | 168-07 | audit | current | Audited; editorial; no change. | `168-07-CLAIMS.md` § Page verdicts | 0 |
| 85 | `/publishers-guide/preparing/to-ask-voters-to-give` | `/publishers-guide/preparing/to-ask-voters-to-give` | 168-07 | audit | current | Audited; the rating feedback form and the configurable results-page delay (`results.showFeedbackPopup`) match the code; no change. | `168-07-CLAIMS.md` § Page verdicts | 0 |
| 86 | `/publishers-guide/preparing/to-offer-a-survey-for` | `/publishers-guide/preparing/to-offer-a-survey-for` | 168-07 | audit | current | Audited; matches the `survey` settings (`linkTemplate`, `showIn`); no change. | `168-07-CLAIMS.md` § Page verdicts | 0 |
| 87 | `/publishers-guide/preparing/what-data-should-be-collected` | `/publishers-guide/preparing/what-data-should-be-collected` | 168-07 | audit | current | Audited; no tracking by default (`analytics.trackEvents: false`), the consent prompt (`DataConsent`) and the Umami adapter match the code; no change. | `168-07-CLAIMS.md` § Page verdicts | 0 |
| 88 | `/publishers-guide/preparing/what-other-information-is-collected` | `/publishers-guide/preparing/what-other-information-is-collected` | 168-07 | audit prose outside the ResearchQuote blocks only (D-05, D-07) | current | Audited prose outside the one ResearchQuote block; no change. | `168-07-CLAIMS.md` § Page verdicts | 1 |
| 89 | `/publishers-guide/preparing/who-is-the-target-group` | `/publishers-guide/preparing/who-is-the-target-group` | 168-07 | audit | current | Audited; editorial; no change. | `168-07-CLAIMS.md` § Page verdicts | 0 |
| 90 | `/publishers-guide/publish-with-openvaa` | `/publishers-guide/publish-with-openvaa` | 168-07 | audit | current | Audited; the `#contact` anchor on Association resolves; no change. | `168-07-CLAIMS.md` § Page verdicts | 0 |
| 91 | `/publishers-guide/what-are-vaas/intro` | `/publishers-guide/what-are-vaas/intro` | 168-07 | audit | current | Audited; research text with `Author` and `ReferenceList` (frozen components); no change. | `168-07-CLAIMS.md` § Page verdicts | 0 |
| 92 | `/publishers-guide/what-are-vaas/vaas-used` | `/publishers-guide/what-are-vaas/vaas-used` | 168-07 | audit | current | Audited; editorial; no change. | `168-07-CLAIMS.md` § Page verdicts | 0 |
| 93 | `/` | `/` | 168-07 | audit (showcase, project text) | current | Audited: the `0.1 Shiba` release matches the frontend's `0.1.0`, every internal `href` resolves (`svelte-href` class), and the feature and project text matches the code. The showcase links are external. No change. | `168-07-CLAIMS.md` § Page verdicts | 0 |
| G | `/developers-guide/frontend/components/generated/**`, `/developers-guide/frontend/routing/generated/**` | same | 168-07 | regenerate (D-14); the orphan `EntityCardAction` page is deleted by the generator, never by hand | regenerated; EntityCardAction removed | Regenerated at the phase HEAD with the pruning generator (commit `78369e329`): the orphan `EntityCardAction` page deleted, `QuestionArguments` picks up its current docstring, the route map loses `api/cache` (removed in 167). Then the generator's template text was audited and tidied (commit `12d04f015`): the index names the three scanned directories and how to regenerate; Source links are labelled `Component` / `Types`; the embedded directory README sits under "Directory README" with a tree link and demoted headings (one H1 per page); the route-map intro names `apps/frontend/src/routes` and explains the group and parameter notation. Navigation unchanged. | `168-07-CLAIMS.md` § Page verdicts (claims #99–#103) | 0 |

## Redirect stubs

Filled by 168-02. One row per stub `+page.ts` (old route → target), so a later phase can retire them. Every stub is the
same two statements, `import { redirect } from '@sveltejs/kit'` and `export function load() { redirect(308, '<target>'); }`,
with a single literal internal target that is a real page (the `stub` class of `validate:links --check` enforces it). The
old text of a moved or removed page stays readable with `git show "$(cat gate-evidence/base-rev.txt)":<old path>/+page.md`.
Derivation: `git ls-files 'apps/docs/src/routes/(content)/developers-guide' | grep '/+page\.ts$'` → 26 lines.

| # | Old route | Stub file | Target | Content fate | Executed by |
|---|---|---|---|---|---|
| 1 | `/developers-guide/app-and-repo-structure` | `apps/docs/src/routes/(content)/developers-guide/app-and-repo-structure/+page.ts` | `/developers-guide/architecture` | moved; body rewritten | 168-04 |
| 2 | `/developers-guide/auto-documentation` | `apps/docs/src/routes/(content)/developers-guide/auto-documentation/+page.ts` | `/developers-guide/about-these-docs` | moved; body rewritten | 168-07 |
| 3 | `/developers-guide/backend/customized-behaviour` | `apps/docs/src/routes/(content)/developers-guide/backend/customized-behaviour/+page.ts` | `/developers-guide/backend/intro` | deleted (no equivalent: Strapi lifecycle hooks) | 168-03 |
| 4 | `/developers-guide/backend/default-data-loading` | `apps/docs/src/routes/(content)/developers-guide/backend/default-data-loading/+page.ts` | `/developers-guide/development/seed-data` | merged | 168-03 |
| 5 | `/developers-guide/backend/mock-data-generation` | `apps/docs/src/routes/(content)/developers-guide/backend/mock-data-generation/+page.ts` | `/developers-guide/development/seed-data` | merged | 168-03 |
| 6 | `/developers-guide/backend/openvaa-admin-tools-plugin-for-strapi` | `apps/docs/src/routes/(content)/developers-guide/backend/openvaa-admin-tools-plugin-for-strapi/+page.ts` | `/developers-guide/backend/data-import-and-deletion` | deleted; bulk RPCs page | 168-03 |
| 7 | `/developers-guide/backend/plugins` | `apps/docs/src/routes/(content)/developers-guide/backend/plugins/+page.ts` | `/developers-guide/backend/intro` | deleted (no equivalent: Strapi plugins) | 168-03 |
| 8 | `/developers-guide/backend/preparing-backend-dependencies` | `apps/docs/src/routes/(content)/developers-guide/backend/preparing-backend-dependencies/+page.ts` | `/developers-guide/development/running-the-development-environment` | merged / deleted | 168-04 |
| 9 | `/developers-guide/backend/re-generating-types` | `apps/docs/src/routes/(content)/developers-guide/backend/re-generating-types/+page.ts` | `/developers-guide/backend/generated-types` | moved; body rewritten | 168-03 |
| 10 | `/developers-guide/backend/running-the-backend-separately` | `apps/docs/src/routes/(content)/developers-guide/backend/running-the-backend-separately/+page.ts` | `/developers-guide/development/running-the-development-environment` | merged (db:*) | 168-04 |
| 11 | `/developers-guide/backend/security` | `apps/docs/src/routes/(content)/developers-guide/backend/security/+page.ts` | `/developers-guide/backend/authentication` | replaced by RLS and grants | 168-03 |
| 12 | `/developers-guide/candidate-user-management/creating-a-new-candidate` | `apps/docs/src/routes/(content)/developers-guide/candidate-user-management/creating-a-new-candidate/+page.ts` | `/developers-guide/candidate-app/pre-registration-and-invitation` | moved; rewritten for the post-166 flow | 168-06 |
| 13 | `/developers-guide/candidate-user-management/mock-data` | `apps/docs/src/routes/(content)/developers-guide/candidate-user-management/mock-data/+page.ts` | `/developers-guide/development/seed-data` | deleted → link to Seed data | 168-03 |
| 14 | `/developers-guide/candidate-user-management/password-validation` | `apps/docs/src/routes/(content)/developers-guide/candidate-user-management/password-validation/+page.ts` | `/developers-guide/candidate-app/password-validation` | moved; audited | 168-06 |
| 15 | `/developers-guide/candidate-user-management/registration-process-in-strapi` | `apps/docs/src/routes/(content)/developers-guide/candidate-user-management/registration-process-in-strapi/+page.ts` | `/developers-guide/candidate-app/registration` | moved; rewritten | 168-06 |
| 16 | `/developers-guide/candidate-user-management/resetting-the-password` | `apps/docs/src/routes/(content)/developers-guide/candidate-user-management/resetting-the-password/+page.ts` | `/developers-guide/candidate-app/login-and-password-reset` | moved; rewritten | 168-06 |
| 17 | `/developers-guide/development/intro` | `apps/docs/src/routes/(content)/developers-guide/development/intro/+page.ts` | `/developers-guide/development/running-the-development-environment` | merged | 168-04 |
| 18 | `/developers-guide/frontend/accessing-data-and-state-management` | `apps/docs/src/routes/(content)/developers-guide/frontend/accessing-data-and-state-management/+page.ts` | `/developers-guide/frontend/data-api-and-adapters` | merged | 168-05 |
| 19 | `/developers-guide/frontend/data-api` | `apps/docs/src/routes/(content)/developers-guide/frontend/data-api/+page.ts` | `/developers-guide/frontend/data-api-and-adapters` | moved; rewritten as Data API and adapters | 168-05 |
| 20 | `/developers-guide/frontend/environmental-variables` | `apps/docs/src/routes/(content)/developers-guide/frontend/environmental-variables/+page.ts` | `/developers-guide/configuration/environmental-variables` | merged | 168-04 |
| 21 | `/developers-guide/llm-features` | `apps/docs/src/routes/(content)/developers-guide/llm-features/+page.ts` | `/developers-guide/admin-app` | moved; folded into Admin app | 168-06 |
| 22 | `/developers-guide/localization/local-translations` | `apps/docs/src/routes/(content)/developers-guide/localization/local-translations/+page.ts` | `/developers-guide/localization/translations-and-overrides` | merged | 168-05 |
| 23 | `/developers-guide/localization/locale-routes` | `apps/docs/src/routes/(content)/developers-guide/localization/locale-routes/+page.ts` | `/developers-guide/localization/locale-resolution` | merged | 168-05 |
| 24 | `/developers-guide/localization/locale-selection-step-by-step` | `apps/docs/src/routes/(content)/developers-guide/localization/locale-selection-step-by-step/+page.ts` | `/developers-guide/localization/locale-resolution` | moved; merged into Locale resolution | 168-05 |
| 25 | `/developers-guide/localization/localization-in-strapi` | `apps/docs/src/routes/(content)/developers-guide/localization/localization-in-strapi/+page.ts` | `/developers-guide/localization/storing-multi-locale-data` (retargeted by 168-08 from `translations-and-overrides`, per 168-05 F4: the surviving content is on Multi-locale data) | merged / deleted | 168-05 |
| 26 | `/developers-guide/localization/localization-in-the-frontend` | `apps/docs/src/routes/(content)/developers-guide/localization/localization-in-the-frontend/+page.ts` | `/developers-guide/localization/translations-and-overrides` | moved; merged into Translations and overrides | 168-05 |

### Inbound references repointed

Repo content links the final URL, never a stub (D-04). The list comes from `validate:links --check --only inbound`: 8 findings
before the repoint and 0 after (`gate-evidence/168-02-inbound.txt`).

- `README.md` (the "Contributing" item in the header list): `openvaa.org/developers-guide/contributing`, a section route that never
  had a page, now points to `…/developers-guide/contributing/contribute`.
- `apps/frontend/src/lib/api/README.md` ("See also the online doc"): the `…/frontend/data-api` URL and its local `data-api/+page.md`
  path now point to `…/frontend/data-api-and-adapters` and
  `</apps/docs/src/routes/(content)/developers-guide/frontend/data-api-and-adapters/+page.md>`. The link text is now "Data API and adapters".
- `apps/frontend/src/lib/server/api/README.md` ("See also the online doc"): the same change as the line above.
- `apps/frontend/src/routes/candidate/README.md` (the "Candidate user management" item): the section route `…/candidate-user-management`,
  which never had a page, and its local directory path now point to "Candidate app" at
  `…/candidate-app/pre-registration-and-invitation`, URL and local `+page.md` path.
- `packages/app-shared/src/settings/README.md` (the Static settings and App Settings "locally" links): the wrong prefix
  `/docs/src/routes/developers-guide/configuration/…` is replaced with
  `</apps/docs/src/routes/(content)/developers-guide/configuration/{static-settings,app-settings}/+page.md>`.

These references already resolved and were left unchanged: `.agents/code-review-checklist.md` (code-style-guide ×2, contribute,
and the two guide roots), `.github/PULL_REQUEST_TEMPLATE` (`pull-request#self-review`, `contribute#commit-your-update`), root
`ROADMAP.md` (code-style-guide), `.claude/skills/components/SKILL.md` and `.claude/skills/README.md` (the generated component index).

## Sweep exceptions

Copied by 168-07 from each writer plan's `## Sweep exceptions` (`168-03..07-CLAIMS.md`); 168-08 re-runs the sweeps over all of
`apps/docs` and completes this list. Plans with no exception: 168-03, 168-05, 168-06 (each recorded that every D-21 sweep and
`git grep -i docker` exits 1 over its pages).

| Plan | Page | Hit | Reason |
| --- | --- | --- | --- |
| 168-04 | `development/requirements` | "A container runtime such as Docker" (one line) | The Supabase CLI runs the local Supabase services as containers, so a running container runtime is a requirement; this is the D-21 "Docker for Supabase" case the plan names. |
| 168-04 | `deployment` | `docker` / `Dockerfile` / `docker-compose.dev.yml` / `docker compose` (six lines: the frontend container intro, Render step 2, and the "Testing a production build locally" section) | D-21 permitted case: the frontend is deployed as a container built from `apps/frontend/Dockerfile`, Render runs it as a Docker web service, and `docker-compose.dev.yml` builds and runs the production image locally. No Docker development stack is described. |
| 168-04 | `deployment` | `CACHE_*`, `PUBLIC_CACHE_*`, `PUBLIC_*_BACKEND_URL`, "a backend API token", `/var/data/cache` (one paragraph, "Upgrading an older Render service") | Not a D-21 hit (no full removed name is spelled, so the 167-removed-name grep exits 1), recorded so 168-08 reads it as intended: it is the Phase 167 Render operator note (167-06 SUMMARY § Hand-offs), which tells existing services to detach the cache disk and delete those variables. It describes removal, not current configuration. |
| 168-07 | `about/roadmap` | `Backend migrated from Strapi to Supabase (completed)` | D-21 expected exception: the operator's roadmap history line, left as written (D-05). |
| 168-07 | `developers-guide/contributing/workflows` | `docker-image-build` (job name) and "production image of the frontend from `apps/frontend/Dockerfile`" (one line) | The CI job builds the frontend's production container image; deployment prose, not a Docker development stack (D-21 permitted case). |

### 168-08: final sweep over all of `apps/docs`

Run at HEAD `4dee167c6` over every tracked file in `apps/docs` (pages, generated pages, scripts, components, README):
VESTIGES #1, #2, #5–#7, #9, #10 and the three D-21 patterns. Commands, exit codes, every hit and a positive control per
pattern (the same pattern at the phase base, which hits for all ten) are in `gate-evidence/168-08-sweeps.md`. Eight sweeps
exit 1. Sweep #1 and the `-i docker` sweep exit 0 with 9 hit lines in total, every one an exception already recorded above.
No hit is pattern text in `apps/docs/scripts`, and none is in a generated page.

| Sweep | File:line | Hit text | Reason (row above) |
| --- | --- | --- | --- |
| #1 Strapi | `apps/docs/src/routes/(content)/about/roadmap/+page.md:6` | `- Backend migrated from Strapi to Supabase (completed)` | 168-07 `about/roadmap`: the operator's history line (D-05, D-21 expected exception). |
| docker | `apps/docs/src/routes/(content)/developers-guide/contributing/workflows/+page.md:12` | table row `docker-image-build`: "Builds the production image of the frontend from `apps/frontend/Dockerfile`, without pushing it" | 168-07 `contributing/workflows`: CI job building the production image. |
| docker | `apps/docs/src/routes/(content)/developers-guide/deployment/+page.md:5` | "**The frontend**, a SvelteKit app built into a Node container from [`apps/frontend/Dockerfile`](…)" | 168-04 `deployment`: the frontend container intro. |
| docker | `apps/docs/src/routes/(content)/developers-guide/deployment/+page.md:38` | "2. Create the service in Render from the Blueprint. It is a Docker web service built from `./apps/frontend/Dockerfile` …" | 168-04 `deployment`: Render step 2. |
| docker | `apps/docs/src/routes/(content)/developers-guide/deployment/+page.md:78` | "[`docker-compose.dev.yml`](…) at the repository root builds the frontend's production image and runs it against the local Supabase stack." | 168-04 `deployment`: "Testing a production build locally". |
| docker | `apps/docs/src/routes/(content)/developers-guide/deployment/+page.md:82` | `docker compose -f docker-compose.dev.yml up --build` | 168-04 `deployment`: "Testing a production build locally". |
| docker | `apps/docs/src/routes/(content)/developers-guide/deployment/+page.md:85` | "… reaches the local API at `http://host.docker.internal:54321` unless `PUBLIC_SUPABASE_URL` says otherwise …" | 168-04 `deployment`: "Testing a production build locally". |
| docker | `apps/docs/src/routes/(content)/developers-guide/deployment/+page.md:87` | "To build and run the production frontend without Docker, run `yarn build` at the repository root …" | 168-04 `deployment`: "Testing a production build locally". |
| docker | `apps/docs/src/routes/(content)/developers-guide/development/requirements/+page.md:7` | "- **A container runtime such as Docker**, installed and running. The Supabase CLI runs the local Supabase services …" | 168-04 `development/requirements`: Docker for the Supabase CLI only. |

## Verifier reconciliation

Filled by 168-08 (D-09, orchestrator ruling 6). The full record, one row per page, is in `gate-evidence/168-08-verifier-reconciliation.md`.

- **The pass.** One independent `gsd-doc-verifier` pass covered all 58 changed hand-written pages: every `+page.md|svelte` that
  `git diff --diff-filter=AMR <base>..HEAD -- apps/docs/src/routes` lists, generated pages excluded. Each page went through a uniquely
  named copy (`.planning/tmp/docs-verify/MANIFEST.txt`, mapped to pages by `SOURCES.tsv`), so each has its own result file. The
  orchestrator ran it at HEAD `6c9117378` in 8 parallel batches of about 7–8 pages, not one agent per page.
- **Result.** 1022 claims checked, 1022 passed, **0 BLOCKER / 0 FAIL**. Every result has `claims_checked > 0`. With no failure to
  settle, the dispositions are: 0 fixed, 0 verifier limitation, and 1 unverifiable item resolved by source (next bullet).
- **The one item with no source:** the `q-info` / `arg-cond` commit-prefix abbreviations on `contributing/contribute`. The source is the
  commit history, not the tree: 10 `[q-info]` and 14 `[arg-cond]` subjects against 1 full-name subject, and no commitlint or hook checks
  subjects. It is an editorial convention, unchanged since the base. The page is kept as written. `168-07-CLAIMS.md` gains rows #215–#216
  anchoring the package names the abbreviations expand to.
- **Caveats the verifiers reported (recorded, not fixed):**
  - The checks were mostly existence and grep checks (paths, scripts, symbols, config keys, env vars, anchors). Several pages say
    behaviour claims and prose were **spot-checked**, and the claim counts are **hand tallies**.
  - Runtime flows were not run. Examples: `db:reset-with-e2e-data`, and the feedback rate-limit semantics on Deployment. These stay
    **unverifiable (WARNING)**, each anchored: `168-03-CLAIMS.md` #366, `168-04-CLAIMS.md` #440, and #392–#396 for
    `107-feedback.sql`.
- **The claim ledgers are the anchor-level evidence; the verifier pass is the independent second look.** Re-run on the final tree:
  `check-claims.mjs ledger` over `168-03..07-CLAIMS.md` exits 0 (2176 rows pass). `check-claims.mjs commands` over the 83 hand-written
  pages exits 0 (201 `yarn` commands resolve, 1 placeholder skipped). The `commands` check resolves `yarn workspace …` scripts per
  workspace, which covers the verifier's known root-only limit (Pitfall 3).
- **No page edit was driven by the verifier.** The one page-level change in 168-08 is the `localization-in-strapi` stub retarget, commit
  `d2dee9d6f`, which settles 168-05 F4 (see the routing table under § Residue).

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
- **`frontend/data-api` is a redirect stub, as D-04's literal list says** (168-02, orchestrator ruling 4, Q2). Keeping the slug would
  also have satisfied "keep URLs with inbound references", because two READMEs link it. The plan follows D-04's list instead: the page
  moved to `frontend/data-api-and-adapters`, and 168-02 Task 3 repoints both READMEs to the new URL.
- **Section routes that never had a page get no stub** (168-02). `/developers-guide/contributing` and
  `/developers-guide/candidate-user-management` are navigation prefixes, not pages, so there is nothing to redirect. The root
  `README.md` and the candidate README link them; 168-02 Task 3 repoints those inbound references to leaf pages
  (`contributing/contribute`, `candidate-app/pre-registration-and-invitation`).
- **Five new pages hold only their final H1 and one scope paragraph** (168-02): `development/seed-data`,
  `backend/{edge-functions,email,data-import-and-deletion}` and `candidate-app/bank-authentication`. Each paragraph names things and
  makes no behaviour claim; the owner plan writes the body. These pages have no `## Pages` row, because that table is derived from the
  base revision.
- **Navigation titles equal page H1s** (168-02). Every Developers' Guide leaf's H1 is its navigation title, except the four `Overview`
  items, whose H1s are "<Section> overview" and which carry `fixedTitle: true`. The sections "Backend (Supabase)" and "Candidate app"
  carry `fixedTitle: true` because they have no page of their own. A later plan that edits a heading therefore changes the navigation
  title too, and the D-02 consistency check (`generate:navigation`, prettier, `git diff --exit-code`, no `// New` / `// Removed`) shows it.
  Negative control: changing `backend/email`'s H1 to "Email delivery" made the check exit 1 with a one-line title diff, and it returned to 0
  after the revert.
- **Internal links were repointed mechanically, so one is now a self-link** (168-02). `frontend/data-api-and-adapters` (the old `data-api`
  body) linked "an example of the data loading cascade" at `frontend/accessing-data-and-state-management`, which now redirects to that same
  page. The link points at itself until 168-05 merges the two bodies.
- **168-07 must keep two Contributing headings** (168-02, D-04, T-168-07). `.github/PULL_REQUEST_TEMPLATE` links
  `contributing/pull-request#self-review` and `contributing/contribute#commit-your-update`, and `.agents/code-review-checklist.md`
  (binding for review under CLAUDE.md) links `contributing/code-style-guide` and `contributing/contribute`. All of them resolve after
  168-02 (`--only inbound` exit 0). The headings "Self-review" (in Pull Request) and "Commit your update" (in Contribute) must keep
  slugs `self-review` and `commit-your-update`, and those page URLs must not move. `--only inbound` checks both anchors.
- **The generated pages were regenerated and committed before their template text was audited** (168-07, D-14). Commit `78369e329`
  holds the pure regeneration (the orphan `EntityCardAction` page deleted, one docstring and the `api/cache` route-map line updated);
  `12d04f015` holds the generator wording (scanned directories in the index intro, labelled Source links, "Directory README" with demoted
  headings and a tree link, the route-map notation). The index's first sentence is kept verbatim because
  `.claude/skills/components/SKILL.md` quotes it. `navigation.config.ts` did not change, so no 03–06 writer drifted an H1.
- **"Not yet available" corrections are code-proven absences** (168-07, D-05). About › Features and the Publishers' Guide described
  voter-set statement weights and real-time top results as options; no frontend code implements either, so both pages now say "not yet
  available" rather than deleting the operator's description. The same rule removed the `csv` translation import/export bullet and the
  "static website with no separate database" hosting option (`createDataProvider` always returns the Supabase provider).
- **Folding the verdicts** (168-07, D-20). Every `## Pages` row now carries the owning plan's verdict and what-changed text with the
  anchor `168-0N-CLAIMS.md § Page verdicts`. The 26 stub rows keep `redirect stub` and append the content fate (`content: <verdict>
  (168-0N)` plus the plan's text for the old route). Row `G` reads `regenerated; EntityCardAction removed`.

- **The final gate set ran on the final tree, and a sweep with no hits is recorded with its command** (168-08, D-22, PROH-01). Every
  D-22 gate's status was read from the command itself, not through a pipe (`gate-evidence/168-08-gates.md`). Each D-21 sweep that
  exits 1 has a positive control: the same pattern at the base, where it hits (`gate-evidence/168-08-sweeps.md`).
- **`configurable-mock-data.md` is closed, not narrowed** (168-08, Claude's discretion under D-18). `@openvaa/dev-seed` provides
  configurable generation: `db:seed --template`, `db:reset-with-data`, `BUILT_IN_TEMPLATES`, and custom templates by path. The todo asked
  for generation "similar to" `GENERATE_MOCK_DATA_ON_INITIALISE`, not for seeding on initialise as such, so the one unreproduced part
  (automatic seeding) did not leave a remainder open. A new todo is the route if automatic seeding is wanted.
- **`password-reset-code-method.md` stays open** (168-08, D-18). 168-06 established that the `?code=` branch is unreachable and would
  fail if reached, but the branch still exists. The annotation points at the measured PKCE todo
  (`2026-09-02-forgot-password-pkce-code-not-exchanged.md`), which should be fixed first.
- **The `localization/localization-in-strapi` stub now points at Multi-locale data** (168-08, settles 168-05 F4; commit `d2dee9d6f`).
  The old page's surviving content (locale-keyed JSON storage, adapter-side locale picking) lives on
  `/developers-guide/localization/storing-multi-locale-data`, not on Translations and overrides. The `stub` link class and the span
  gate were re-run green after the change.
- **Every `## Findings for todos` row of 168-03..07 is routed** (168-08, D-04). Each one goes to a new todo, a dated note on an
  existing todo, or a closed todo's Resolution. None is dropped, and findings of the same class are grouped into one todo (README and
  comment drift, deployment configuration, CLAUDE.md). The table is under § Residue.
- **The OIDC nonce gap is filed as a dedicated security todo** (168-08, 168-06 F7). No existing todo mentioned the nonce, and a
  docstring in `providers/types.ts` claims the check exists. It is filed separately from the CLAUDE.md and drift todos and marked
  `security: true`, so it is not buried among wording fixes.
- **The D-11 evidence omits the key tables instead of relying on the redaction filter alone** (168-08, PROH-03). The plan's perl filter
  does not catch the Supabase CLI's S3 key rows, whose separator is `│`. `168-08-d11-runs.md` therefore quotes only the non-key
  status lines. The secret scan and a hex-key probe over `gate-evidence/` both exit 1.
- **Supabase was left as found** (168-08, T-168-24). This project's stack was already running before `yarn db:start` (13
  `openvaa-local` containers), so 168-08 did not stop it. The `yarn dev` process group was stopped with SIGTERM. No Docker restart and
  no `supabase stop --all`.

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

Completed by 168-08 (D-04). Residue leaves the phase as named todos, not prose.

### Todos filed by 168-08 (all in `.planning/todos/pending/`)

| Todo | What | Source |
| --- | --- | --- |
| `2026-10-01-docs-link-check-on-pull-requests.md` | `validate:links --check` runs only in `docs.yml`, which fires on a push to `main` touching `apps/docs/**`. No pull-request job runs it, and `main.yaml` ignores `**.md`. Options for the operator: a step in `main.yaml`'s lint job, or widening `docs.yml`. | Orchestrator ruling 4 (Q1) |
| `2026-10-01-claude-md-stale-claims-found-by-docs-rewrite.md` | CLAUDE.md "seeded automatically on `supabase start`" (partly wrong), "Theme colors defined in `staticSettings.ts`" (wrong for the rendered theme), and the Render env set without `PUBLIC_PROJECT_ID`. No cache-disk claim remains in CLAUDE.md at HEAD (checked). | 168-03 F6, 168-05 F2, 168-04 F1 |
| `2026-10-02-oidc-callback-does-not-verify-nonce.md` | **Security-relevant** (`security: true`): the OIDC callback deletes `oidc_nonce` but never compares it with the token's `nonce` claim, and a docstring claims it does. | 168-06 F7 |
| `2026-10-02-readme-comment-and-skill-drift-found-by-docs-rewrite.md` | `apps/supabase/README.md` (pgTAP count and command, lint-schema checks, "candidate role"); comments in the callback docblock, `.env.example` `E2E_PROJECT_ID`, `staticSettings.type.ts` `LOCAL_DATA_DIR` and `showSurveyPopup`; the components skill; the docs scripts `tsc`. | 168-03 F1/F4/F5/F7, 168-04 F3/F4/F8, 168-05 F1 (wording), 168-06 F10, 168-07 F1/F2 |
| `2026-10-02-deployment-config-gaps-found-by-docs-rewrite.md` | Templates without `PUBLIC_PROJECT_ID`; the unused `PUBLIC_*_FRONTEND_URL` pair; the orphan `apps/frontend/docker-compose.dev.yml`; Storage buckets only in the local `config.toml`. | 168-04 F1/F2/F5/F6 |
| `2026-10-02-admin-with-candidate-grant-locked-out-of-admin-app.md` | A dual-grant identity resolves to `candidate` and is signed out of the Admin App. | 168-06 F6 |
| `2026-10-02-voter-statement-weights-and-live-top-results-not-implemented.md` | Two described voter features have no frontend code. This is an operator question. | 168-07 F3 |
| `2026-10-02-routing-and-locale-findings-from-docs-rewrite.md` | Unused `ROUTE_PARAMS`, the unclear `cookie` locale strategy, and the language menu dropping the query string. | 168-05 F3/F5/F6 |
| `2026-10-02-password-validator-username-never-passed.md` | `PasswordSetter` never passes `username`, so that rule is dead. | 168-06 F8 |
| `2026-10-02-app-settings-shallow-merge-and-no-admin-editor.md` | `mergeAppSettings` replaces by top-level key, and the Admin App has no settings or customization editor. | 168-06 F11, F9; 168-04 F7 |

### Open todos this phase annotated (left open)

- `password-reset-code-method.md`: the 168-06 reading (the `?code=` branch is unreachable and would fail). It stays open while the branch
  exists (D-18).
- `2026-09-02-forgot-password-pkce-code-not-exchanged.md`: the 168-06 F1 residual (the callback ignores `?code=`) and the invite-email
  analogue.
- `2026-09-15-refactor-candidate-and-entity-registration-flow-and-nominati.md`: fact 18 re-confirmed (`/candidate/complete-registration`),
  and neither `invite-candidate` nor `send-email` has a UI caller (168-03 F2/F3, 168-06 F3/F4).
- `2026-09-21-preregister-route-discards-email-and-nominations.md`: the Bank authentication docs page to update when fixed (168-06 F5).
- `2026-08-28-reintroduce-the-local-data-adapter.md`: the `apiRoute` client adapters are unwired as well, and the pages to update if the mode
  returns (168-05 F1, 168-07 F4).

### Every `## Findings for todos` row of 168-03..07, routed

| Finding | Routed to |
| --- | --- |
| 168-03 F1, F4, F5, F7 | `2026-10-02-readme-comment-and-skill-drift-found-by-docs-rewrite.md` (items 1–5) |
| 168-03 F2, F3 | Note on `2026-09-15-refactor-candidate-and-entity-registration-flow-and-nominati.md` (F3 is that todo's fact 18) |
| 168-03 F6 | `2026-10-01-claude-md-stale-claims-found-by-docs-rewrite.md` (item 1) |
| 168-03 F8 | Resolution of `done/configurable-mock-data.md` (dev-seed creates no auth users; known limitation) |
| 168-03 F9 | Closed `configurable-mock-data.md` (moved to `done/`) |
| 168-04 F1 | `2026-10-02-deployment-config-gaps-found-by-docs-rewrite.md` (item 1) and the CLAUDE.md todo (item 3) |
| 168-04 F2, F5, F6 | `2026-10-02-deployment-config-gaps-found-by-docs-rewrite.md` (items 2–4) |
| 168-04 F3 | Drift todo (item 5, with 168-03 F7) |
| 168-04 F4 | Cross-reference only; its targets are routed above (168-03 F1/F5/F6). Recorded in the drift todo |
| 168-04 F7 | `2026-10-02-app-settings-shallow-merge-and-no-admin-editor.md` (item 2) |
| 168-04 F8 | Already done on the Troubleshooting page by 168-04. Recorded in the drift todo's "no action" list |
| 168-05 F1 | Note on `2026-08-28-reintroduce-the-local-data-adapter.md`; the comment wording is drift todo item 6 |
| 168-05 F2 | CLAUDE.md todo (item 2, which also records the open design question) |
| 168-05 F3, F5, F6 | `2026-10-02-routing-and-locale-findings-from-docs-rewrite.md` |
| 168-05 F4 | **Done in this plan:** stub retargeted to Multi-locale data (`d2dee9d6f`) |
| 168-06 F1 | Annotation on `password-reset-code-method.md` (left open) and a note on `2026-09-02-forgot-password-pkce-code-not-exchanged.md` |
| 168-06 F2 | Closed `register-page-registrationkey-method.md` as superseded (moved to `done/`) |
| 168-06 F3, F4 | Note on `2026-09-15-refactor-candidate-and-entity-registration-flow-and-nominati.md` |
| 168-06 F5 | Note on `2026-09-21-preregister-route-discards-email-and-nominations.md` |
| 168-06 F6 | `2026-10-02-admin-with-candidate-grant-locked-out-of-admin-app.md` |
| 168-06 F7 | `2026-10-02-oidc-callback-does-not-verify-nonce.md` (security) |
| 168-06 F8 | `2026-10-02-password-validator-username-never-passed.md` |
| 168-06 F9 | `2026-10-02-app-settings-shallow-merge-and-no-admin-editor.md` (item 2) |
| 168-06 F10 | Drift todo (item 7) |
| 168-06 F11 | `2026-10-02-app-settings-shallow-merge-and-no-admin-editor.md` (item 1) |
| 168-07 F1, F2 | Drift todo (items 8, 9) |
| 168-07 F3 | `2026-10-02-voter-statement-weights-and-live-top-results-not-implemented.md` |
| 168-07 F4 | Note on `2026-08-28-reintroduce-the-local-data-adapter.md` (same disposition as 168-05 F1) |

### Redirect stubs to retire later (D-04)

The 26 stub `+page.ts` files under `apps/docs/src/routes/(content)/developers-guide/` each hold one `redirect(308, …)` (§ Redirect stubs above
has the per-stub table). They keep old URLs working for bookmarks and outside links. Repo content already links only final URLs
(`validate:links --check --only inbound` exits 0). Retire them in a later phase, after enough time has passed, by deleting the
directories and re-running `generate:navigation` and `validate:links --check`. Old route → target at the 168-08 HEAD:

1. `/developers-guide/app-and-repo-structure` → `/developers-guide/architecture`
2. `/developers-guide/auto-documentation` → `/developers-guide/about-these-docs`
3. `/developers-guide/backend/customized-behaviour` → `/developers-guide/backend/intro`
4. `/developers-guide/backend/default-data-loading` → `/developers-guide/development/seed-data`
5. `/developers-guide/backend/mock-data-generation` → `/developers-guide/development/seed-data`
6. `/developers-guide/backend/openvaa-admin-tools-plugin-for-strapi` → `/developers-guide/backend/data-import-and-deletion`
7. `/developers-guide/backend/plugins` → `/developers-guide/backend/intro`
8. `/developers-guide/backend/preparing-backend-dependencies` → `/developers-guide/development/running-the-development-environment`
9. `/developers-guide/backend/re-generating-types` → `/developers-guide/backend/generated-types`
10. `/developers-guide/backend/running-the-backend-separately` → `/developers-guide/development/running-the-development-environment`
11. `/developers-guide/backend/security` → `/developers-guide/backend/authentication`
12. `/developers-guide/candidate-user-management/creating-a-new-candidate` → `/developers-guide/candidate-app/pre-registration-and-invitation`
13. `/developers-guide/candidate-user-management/mock-data` → `/developers-guide/development/seed-data`
14. `/developers-guide/candidate-user-management/password-validation` → `/developers-guide/candidate-app/password-validation`
15. `/developers-guide/candidate-user-management/registration-process-in-strapi` → `/developers-guide/candidate-app/registration`
16. `/developers-guide/candidate-user-management/resetting-the-password` → `/developers-guide/candidate-app/login-and-password-reset`
17. `/developers-guide/development/intro` → `/developers-guide/development/running-the-development-environment`
18. `/developers-guide/frontend/accessing-data-and-state-management` → `/developers-guide/frontend/data-api-and-adapters`
19. `/developers-guide/frontend/data-api` → `/developers-guide/frontend/data-api-and-adapters`
20. `/developers-guide/frontend/environmental-variables` → `/developers-guide/configuration/environmental-variables`
21. `/developers-guide/llm-features` → `/developers-guide/admin-app`
22. `/developers-guide/localization/local-translations` → `/developers-guide/localization/translations-and-overrides`
23. `/developers-guide/localization/locale-routes` → `/developers-guide/localization/locale-resolution`
24. `/developers-guide/localization/locale-selection-step-by-step` → `/developers-guide/localization/locale-resolution`
25. `/developers-guide/localization/localization-in-strapi` → `/developers-guide/localization/storing-multi-locale-data` (retargeted in 168-08)
26. `/developers-guide/localization/localization-in-the-frontend` → `/developers-guide/localization/translations-and-overrides`

Stubs 6, 15 and 25 keep "strapi" in their **paths**. Path names are not content, so sweep #1 (`git grep` over file content) does not
report them. They go when the stubs are retired.

### Verifier warnings left

The independent pass reported no BLOCKER or FAIL. What it could not verify stays as **unverifiable (WARNING)**, each with supporting
anchors: runtime flows such as `db:reset-with-e2e-data`, the feedback rate-limit semantics, and the `q-info` / `arg-cond`
convention, whose source is the commit history. Behaviour claims and prose were spot-checked, not exhaustively verified (§ Verifier
reconciliation).

### No-product-change probe (D-18)

`git diff --name-only "$(cat gate-evidence/base-rev.txt)"..HEAD -- apps/frontend packages apps/supabase` at 168-08 lists exactly:
`apps/frontend/src/lib/api/README.md`, `apps/frontend/src/lib/server/api/README.md`, `apps/frontend/src/routes/candidate/README.md`,
`packages/app-shared/src/settings/README.md` (the 168-02 inbound repoints), and `packages/shared-config/eslint.config.mjs`, whose whole
diff is `+export { tsParser };` (168-01.1). Nothing under `apps/supabase`. Outside `apps/docs` and `.planning`, the phase also touched
only the root `README.md` (inbound repoint), root `package.json` (`docs:*` delegation), `security/audit-baseline.json` and `yarn.lock`
(typedoc removal). These are tooling and docs only, so no product behaviour changed, and no E2E run is required (D-22).

## Handoff to Phase 169

Phase 169's gate re-runs these three commands from the repo root. They must exit 0 on 169's tree:

```bash
yarn workspace @openvaa/docs validate:links --check
yarn workspace @openvaa/docs check:research-quotes --base 0ec229dfe7ee26eafa21882fa37f6d49817e51f9 --component-base 6090476cc44aa995e3b36368b8a605c96e4ccc1a
yarn workspace @openvaa/docs build
```

- The two SHAs are the recorded ones: `gate-evidence/base-rev.txt` (the span base, the original phase base) and
  `gate-evidence/component-base-rev.txt` (the component base, re-anchored by the operator ruling of 2026-10-02). The `--base`-only form
  exits 1 by design. If `--extract-dir` is passed, give it an absolute path.
- **Pages state no version numbers that 169 could invalidate** (D-17). The docs name tools and scripts, not their versions.
  Requirements points at the root `package.json` `engines` (Node) and `packageManager` (Yarn) instead of restating them, so a dependency
  bump in 169 does not stale a page. A check over the hand-written pages for a tool name followed by a number matches only "Svelte 5"
  (the framework generation, on four pages including the roadmap). That is not a dependency version a 169 bump could change. If 169 changes a script name, a workspace name or a path that a page cites, `validate:links --check` (the
  `github-path` class) and `check-claims.mjs` (`ledger`, `commands`) report it.
- 169 also inherits `yarn audit:deps` being red (pre-existing, 167 fact 16) and the four stale js-yaml baseline ids
  (`168-01.1-SUMMARY.md` § Issues).
