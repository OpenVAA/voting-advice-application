# 261001-n8y: origin/main-era vestige sweep

- **Base revision:** `72b3367292c074b467b17ee1caab630b25e7b19f` (`gate-evidence/base.rev`). The sweep ran on top of the Part A commits (`f12c4a951`, `bb6a528a6`, `2ef324cf6`).
- **Date:** 2026-10-01
- **Branch:** `fix/888-review-findings` (the `-gsd` linked worktree)
- **Exclusion set for every grep:** `.planning/`, `yarn.lock`, `.yarn/`. `node_modules` is untracked, so `git grep` never sees it.
- **Raw hit lists:** `gate-evidence/sweep/*.txt`, one file per pattern. Hit counts below are the counts at sweep time. The fixes listed afterwards changed some of them; the "After" column shows the current count where it moved.
- **Evidence deleted:** the untracked `gate-evidence/` directory this document cites was inspected and deleted in Phase 167 (plan 167-06); its counts survive only as transcribed here.

## Sweep commands and hit counts

| # | Class | Command (`git grep … -- ':!.planning' ':!yarn.lock' ':!.yarn'`) | Hits / files | After |
|---|-------|------------------------------------------------------------------|--------------|-------|
| 1 | Strapi | `-n -i -E '(^\|[^a-z])strapi'` | 173 / 30 | 173 / 30 |
| 1b | Strapi (false-positive control) | `-n -i 'strapi'` | 175. The extra 2 are `bootstrapId` in `packages/dev-seed/src/generators/AccountsGenerator.ts` | n/a |
| 2 | Strapi package path | `-n 'vaa-strapi'` | 43 / 14 | 43 / 14 |
| 3 | Old i18n library | `-n 'sveltekit-i18n'` | 2 / 1 | 2 / 1 |
| 4 | Old i18n parser | `-n 'parser-icu'` | 1 / 1 | 1 / 1 |
| 5 | Store-style i18n calls | `-n -E '\$t\(\|\$locale\b'` | 5 / 3 | 5 / 3 |
| 6 | LocalStack | `-n -i 'localstack'` | 7 / 3 | 7 / 3 |
| 7 | awslocal | `-n -i 'awslocal'` | 1 / 1 | 1 / 1 |
| 8 | AWS SDK | `-n -E '@aws-sdk\|aws-sdk'` | 0 | 0 |
| 9 | Old mock-data env | `-n 'GENERATE_MOCK_DATA'` | 8 / 3 | 8 / 3 |
| 10 | Old env names | `-n -E 'STRAPI_\|BACKEND_API_TOKEN\|PUBLIC_BROWSER_BACKEND_URL\|PUBLIC_SERVER_BACKEND_URL\|MAIL_FROM\|MAIL_REPLY_TO\|AWS_'` | 52 / 15 | 52 / 15 |
| 11 | Root-relative old paths | `-n -E '(^\|[^a-zA-Z0-9_./-])/?(frontend\|backend)/'` | 23 / 14 | 18 / 11 |
| 12 | `$voter` alias | `-n -F '$voter'` | 4 / 4 | 0 |
| 13 | Legacy catalog (Part A) | `-n -E 'i18n/translations\|translations\.type\|staticTranslations\|TYPEGEN_CATALOG_DIR\|type-gen'` | 0 after `2ef324cf6` | 0 |
| 14 | Svelte 4 idioms, `*.svelte` only | `export let ` / `^\s*\$:` / `(^\|[^a-zA-Z])on:[a-z]+=` / `<slot` / `createEventDispatcher` / `\$\$props\|\$\$restProps\|\$\$slots` / `svelte/legacy` / `<svelte:component` / `<svelte:fragment` / `beforeUpdate\|afterUpdate` | 3 / 0 / 0 / 0 / 0 / 0 / 0 / 0 / 0 / 0. All 3 `export let` hits, plus 4 `$$Props`, are in `apps/docs/src/lib/components/openVAALogo/OpenVAALogo.svelte`. The first `on:` pattern (`on:[a-z]+=`) gave 9 false positives, all `transition:slide=` / `transition:fly=`, so the anchored pattern replaced it | unchanged |
| 15 | `.env.example` consumers | each `^[A-Z][A-Z0-9_]*=` of `.env.example`, `apps/frontend/.env.example` and `apps/supabase/supabase/functions/.env.example`, then `git grep -l -w` excluding docs, `*.md` and `*.env.example` | 45 variables; every one has at least one non-docs consumer (`sweep/env-example.txt`) | n/a |
| 16 | Dependencies | `node gate-evidence/dep-sweep.mjs`, run over every manifest (root, `apps/*`, `packages/*`), excluding `package.json` | 218 checked. 32 have no mention in their own workspace (`sweep/deps.txt`), each then checked against package.json scripts, `importHelpers`, lockfile peers and `security/audit-baseline.json` | 2 removed |
| 17 | Root inventory | `git ls-files` at depth 1, plus `git status --ignored --porcelain` (names only) | 37 tracked entries | n/a |

## Findings

| Location (path + content anchor) | Vestige | Class | Reason / commit | Existing todo |
|---|---|---|---|---|
| `apps/frontend/src/lib/i18n/translations/` (whole directory) | Second, unread translation catalog from sveltekit-i18n | fixed | `f12c4a951` (consumers repointed), `2ef324cf6` (deleted) | none |
| `apps/frontend/svelte.config.js` `alias.$voter`, `apps/frontend/vitest.config.ts` `find: '$voter'`, `apps/frontend/README.md` § Path aliases, `CLAUDE.md` § Path aliases | Dead path alias: `src/lib/voter` does not exist. The consumer grep `git grep -n -E "from ['\"]\$voter\|\$voter/"` returned nothing (exit 1) | fixed | `dad6569be` | none |
| `apps/frontend/package.json` devDependency `svelte-visibility-change` | No importer, script, config or peer | fixed | `ec30a1500`. The `yarn.lock` diff is confined to this package's resolution and the workspace line | none |
| `apps/frontend/package.json` devDependency `tslib` | No importer, and no `importHelpers` anywhere. No lockfile peer requires it, and the transitive entry stays | fixed | `ec30a1500` | none |
| `ROADMAP.md` "Figure out if we need different skills for:" (`frontend/src/lib/contexts`, `frontend/src/lib/api`) | Root-relative pre-`apps/` paths | fixed | `985f26a6c` | none |
| `apps/frontend/src/routes/+layout.svelte` comment "based on `pollInterval` in frontend/svelte.config.js" | Root-relative pre-`apps/` path | fixed | `985f26a6c` | none |
| `apps/docs/…/generated/dynamic-components/entityCard/EntityCardAction/+page.md` `## Source` link texts | Stale generated output (`frontend/src/…`); the other 103 generated pages say `apps/frontend/src/…` | fixed | `985f26a6c` | none |
| `apps/frontend/src/lib/i18n/README.md` editTranslations link `/frontend/tools/…` | Root-relative pre-`apps/` link | fixed | `2ef324cf6` (Part A) | none |
| `apps/docs/…/localization/supported-locales/+page.md`, `local-translations/+page.md`, `troubleshooting/+page.md` § "Commit error: … generateTranslationKeyType.ts" | Described the deleted catalog, the Strapi file-copy step and a pre-commit check that `.husky/pre-commit` does not run | fixed | `2ef324cf6` (Part A). The supported-locales legacy-Strapi banner was removed because no Strapi step remains on the page | none |
| `apps/frontend/package.json` devDependency `@testing-library/jest-dom` | No importer | fixed | `ddcd396ef` (Phase 167): removed; the lodash baseline row 1115806 it alone pulled in was hand-deleted in the same commit | `2026-09-03-dependabot-alert-list-is-stale-against-main.md` (audit-baseline area) |
| `apps/frontend/package.json` devDependency `@vitest/coverage-v8` | No script or config references it | fixed | `ddcd396ef` (Phase 167): removed; `vitest --coverage` names the missing provider if anyone needs it locally | none |
| `apps/docs/package.json` devDependencies `@eslint/compat`, `@tailwindcss/forms`, `rehype-autolink-headings`, `typedoc-plugin-markdown`, `unist-util-visit`, `vitest-browser-svelte` | No importer or script in the docs app | fixed (5 of 6; `typedoc-plugin-markdown` kept for Phase 168) | `ddcd396ef` (Phase 167) | `2026-08-28-broken-docs-script-references.md` (typedoc scripts) |
| `packages/llm/package.json` dependency `jsonrepair` | No importer in `packages/llm` | fixed | `ddcd396ef` (Phase 167): removed | none |
| 10 rows of `sweep/deps.txt`: `typescript` in core / dev-tools / filters / matching / supabase-types, `eslint` + `tsx` in dev-tools, `prettier` in supabase-types, `svelte-check` in docs, `eslint-config-prettier` in shared-config | Zero mentions inside their own workspace's files | intentional | Verified implicit. Each is either a bin its own `package.json` scripts invoke (`tsc` / `tsup` / `eslint` / `tsx` / `prettier` / `svelte-check`) or, for `eslint-config-prettier`, the module behind shared-config's `compat.extends(…, 'prettier')` | none |
| 6 docs-app rows (`@eslint/js`, `@typescript-eslint/eslint-plugin`, `@typescript-eslint/parser`, `eslint-plugin-simple-import-sort`, `globals`, `typescript-eslint`), plus the frontend's `@typescript-eslint/eslint-plugin` | Direct devDependencies that duplicate what `@openvaa/shared-config/eslint` imports itself. The docs/frontend configs never import them, and `typescript-eslint` (the meta package) is imported nowhere | fixed | `ddcd396ef` (Phase 167): all seven removed; lint findings unchanged and both guarded rules shown to still fire | none |
| `apps/frontend/package.json` devDependency `eslint-plugin-svelte` | Not imported by the frontend's own ESLint config | fixed: kept, now imported explicitly | `ddcd396ef` (Phase 167): `apps/frontend/eslint.config.mjs` imports it by name and spreads `svelte.configs['flat/prettier']` | `2026-09-03-dependabot-alert-list-is-stale-against-main.md` |
| `packages/argument-condensation/package.json` devDependency `dotenv`; `packages/question-info/package.json` `js-yaml` + `@types/js-yaml` | No importer in their own workspace (`js-yaml` is imported by `packages/llm/src/prompts/promptRegistry.ts`, not by question-info) | fixed | `879d0ccf0` (Phase 167): `js-yaml` declared in `@openvaa/llm`, which imports it; `ddcd396ef`: `dotenv`, `js-yaml` and `@types/js-yaml` removed from argument-condensation and question-info | none |
| `apps/frontend/src/lib/server/constants.ts` `BACKEND_API_TOKEN` (+ 7 auth test mocks setting it to `''`) | Strapi-era API-token constant; no reader outside test mocks | fixed | `837b895c4` (Phase 167): the constant and all seven mock keys removed | `2026-08-28-vite-envdir-root-would-fix-six-empty-constants.md` (names the BACKEND_URL constants; note that `svelte.config.js` now sets `env.dir` to the repo root, so that todo may itself be stale) |
| `apps/frontend/src/lib/utils/constants.ts` `PUBLIC_BROWSER_BACKEND_URL` / `PUBLIC_SERVER_BACKEND_URL`; `apps/frontend/src/routes/api/cache/+server.ts` | Pre-Supabase backend URL pair, assigned in no `.env.example` | fixed | `837b895c4` (Phase 167): the pair and the `/api/cache` proxy removed; the route had no backend left to proxy | `2026-08-28-vite-envdir-root-would-fix-six-empty-constants.md`, `2026-08-28-reintroduce-the-local-data-adapter.md`, `2026-09-27-adapter-selection-entrypoints.md` |
| `apps/supabase/supabase/config.toml` "Configures AWS_ACCESS_KEY_ID / AWS_SECRET_ACCESS_KEY for S3 bucket" | `AWS_` match | intentional | Supabase CLI template comments for its own S3 storage config, not the old LocalStack stack | none |
| `apps/docs/src/lib/components/openVAALogo/OpenVAALogo.svelte` `export let` / `$$Props` | Svelte 4 props syntax | fixed | `dad0754fe` (Phase 167): ported to `$props()` and `$derived.by` | none |
| `apps/docs/scripts/generate-component-docs.ts` commented-out `getTypeDocLink` (`replace('frontend/src/lib/', '')`) | Dead commented code with an old path | deferred | Part of the absent typedoc generation | `2026-08-28-broken-docs-script-references.md` |
| `apps/docs/src/lib/navigation.config.ts` titles "Strapi", "OpenVAA admin tools plugin for Strapi", "Localization in Strapi", "Registration Process in Strapi" | Nav entries for Strapi-era pages | deferred | They go with the pages they link (docs rewrite) | none |
| `apps/docs/src/routes/(content)/about/roadmap/+page.md` "Backend migrated from Strapi to Supabase (completed)" | Strapi mention | intentional | A true historical statement on a roadmap page | none |
| `.claude/skills/BOUNDARIES.md` "The retired Strapi backend's row was removed" | Strapi mention | intentional | Agent-facing record explaining the map's shape; CLAUDE.md exempts `.claude/` | none |
| `.claude/skills/ship-review-stack/sources/build-rename-commit.sh` (`backend/vaa-strapi`, `frontend/**  ->  apps/frontend/**`, `--drop-prefix backend/`) | Strapi and root-relative paths | intentional | The script exists to rewrite pre-`apps/` history, so the old paths are its input | none |
| `.claude/scripts/audit-skill-links.sh` comment "`frontend/src/lib/components/`" | Root-relative path | intentional | It names the old prefix the audit must reject | none |
| `security/audit-baseline.json` `note` | Strapi / `vaa-strapi` mention | intentional | Accepted-advisory rationale text | `2026-09-03-dependabot-alert-list-is-stale-against-main.md` |
| `packages/dev-seed/src/generators/AccountsGenerator.ts` `bootstrapId` | Case-insensitive `strapi` match | false positive | `bootSTRAPId` | none |
| `apps/docs/README.md` tree `frontend/+page.md`; `apps/frontend/src/routes/candidate/preregister/+layout.server.ts` "(backend/per-instance controlled …)" | Root-relative-path regex matches | false positive | A docs route directory, and prose using "backend/per-instance" | none |
| `apps/frontend/src/lib/i18n/README.md` "use `t(...)` directly, not `$t(...)`" | `$t(` match | intentional | It warns against the old store syntax | none |
| `PRE-SHIP-REFACTORING.md` (root) | Operator-authored refactoring backlog; unreferenced by CLAUDE.md or any file | deferred | User-authored planning document | none |
| `ROADMAP.md` (root) | Operator-authored roadmap; only its stale paths were fixed | intentional | Operator-authored; STATE.md cites it as a phase source | none |
| `.bg-shell/manifest.json` | Tracked tool state | deferred | Ambiguous tool residue | `2026-09-03-bg-shell-tracked.md` |
| `docker-compose.dev.yml`, `render.example.yaml` | Root deployment files | intentional | CLAUDE.md documents both as current; neither contains a Strapi, LocalStack or old-env vestige | none |
| `docs/key-generation.md` | Root guide | intentional | Current guide, referenced by `packages/dev-tools/src/keygen.ts`, both `.env.example` files, `apps/frontend/src/lib/api/utils/auth/oidcFailure.ts` and `tests/IDURA-TEST-RUNBOOK.md` | none |
| `design/icons/custom-icons.ai`, `images/ee24-vaa-animation.gif`, `images/youthvaa-animation.gif` | Root binary assets that no tracked file references (`git grep` of the three basenames hits only the `.ai` file itself) | deferred | Operator design source and showcase media, not code vestiges. Whether to keep them is an operator decision | none |
| `.agents/`, `.changeset/`, `.git-blame-ignore-revs`, `vitest.workspace.ts`, `security/` | Root tooling | intentional | Referenced by CLAUDE.md, scripts or configs | none |
| Docs Strapi-era prose (30 pages, listed below) | Strapi / LocalStack / `GENERATE_MOCK_DATA` / `$t` / `backend/vaa-strapi` prose | deferred | Docs rewrite | none; STATE.md's "Strapi-era leftover" rows (`password-reset-code-method.md`, `register-page-registrationkey-method.md`) cover the two candidate-flow behaviours some of these pages describe, and `configurable-mock-data.md` covers the `GENERATE_MOCK_DATA` replacement |

## Deferred `apps/docs` pages (docs rewrite)

All under `apps/docs/src/routes/(content)/`. The list is the union of the Strapi, `vaa-strapi`, LocalStack, `awslocal`, `GENERATE_MOCK_DATA`, old-env, `$t(` / `$locale`, `sveltekit-i18n` and root-relative-path hits. 25 of the 30 carry the "legacy Strapi backend" banner. The five without it are marked †.

- `about/roadmap` † (intentional, see above)
- `developers-guide/backend/authentication`
- `developers-guide/backend/customized-behaviour`
- `developers-guide/backend/default-data-loading`
- `developers-guide/backend/intro`
- `developers-guide/backend/mock-data-generation` (`configurable-mock-data.md`)
- `developers-guide/backend/openvaa-admin-tools-plugin-for-strapi`
- `developers-guide/backend/plugins`
- `developers-guide/backend/preparing-backend-dependencies`
- `developers-guide/backend/re-generating-types`
- `developers-guide/backend/running-the-backend-separately`
- `developers-guide/backend/security`
- `developers-guide/candidate-user-management/creating-a-new-candidate`
- `developers-guide/candidate-user-management/registration-process-in-strapi` (`register-page-registrationkey-method.md`)
- `developers-guide/candidate-user-management/resetting-the-password` (`password-reset-code-method.md`)
- `developers-guide/configuration/app-customization`
- `developers-guide/configuration/app-settings`
- `developers-guide/configuration/environmental-variables`
- `developers-guide/deployment`
- `developers-guide/development/running-the-development-environment`
- `developers-guide/development/testing`
- `developers-guide/frontend/accessing-data-and-state-management`
- `developers-guide/frontend/components/generated/dynamic-components/entityCard/EntityCardAction` † (fixed in `985f26a6c`; no longer a hit)
- `developers-guide/frontend/data-api`
- `developers-guide/frontend/environmental-variables` † (`constants.PUBLIC_BROWSER_BACKEND_URL` example)
- `developers-guide/localization/intro` † (`sveltekit-i18n`, `@sveltekit-i18n/parser-icu`, `$t('foo.bar')`)
- `developers-guide/localization/localization-in-strapi`
- `developers-guide/localization/localization-in-the-frontend` † (`$t(…)`, `I18nContext`, ICU message format, `export let`)
- `developers-guide/troubleshooting` (its generator section was removed in `2ef324cf6`; the Strapi sections remain)
- `publishers-guide/app-settings`

## Untracked and ignored root files (reported, not touched)

Taken from `git status --ignored --porcelain`, names only. None was read, deleted or committed:

- untracked: `.turbo/` (also listed in the session-start status)
- ignored: `.claude/scheduled_tasks.lock`, `.claude/settings.local.json`, `.env`, `.env.bak-161-03`, `.gsd/`, `.turbo/`, `.vscode/`, `.yarn/install-state.gz`, `dev-server.log`, `raw.json`, `supabase/` (see `2026-08-28-153-stray-top-level-supabase-directory.md`), `test-results/`

## Not a vestige, but observed

- `yarn audit:deps` exits 1 with 7 new high+ advisories (`@vitest/browser`, `vitest`, `shell-quote`, `tar`, `@faker-js/faker`, `@isaacs/brace-expansion`, `@sveltejs/kit`, `brace-expansion`, …). The GHSA set is identical against the base lockfile (`gate-evidence/t3-audit-deps-base.log` vs `t3-audit-deps.log`), so it predates this task. Advisories published after the baseline was last reviewed are the likely cause; this is UNCONFIRMED. Related: `2026-09-03-dependabot-alert-list-is-stale-against-main.md`.
