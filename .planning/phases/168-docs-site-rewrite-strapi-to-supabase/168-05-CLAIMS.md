# 168-05 Claims Ledger — Frontend and Localization

Pages written by plan 168-05, every old page merged into them, and one content-anchored row per module, symbol, alias,
path, command and strategy value the pages state. `node .planning/phases/168-docs-site-rewrite-strapi-to-supabase/scripts/check-claims.mjs ledger`
re-checks every `## Claims` row with `git grep -F` of the quoted anchor in its anchor file (D-09). Anchors are copied
from code or configuration at the execution HEAD; README and CLAUDE.md prose is never an anchor.

Page keys used in the Claims table (routes under `/developers-guide/`): `frontend/intro`, `frontend/routing`,
`frontend/contexts`, `frontend/data-api-and-adapters`, `frontend/components`, `frontend/styling`, `localization/intro`,
`localization/supported-locales`, `localization/locale-resolution`, `localization/translations-and-overrides`,
`localization/storing-multi-locale-data`.

## Page verdicts

| Old route | New route | Verdict | What changed | RQ |
| --- | --- | --- | --- | --- |
| `/developers-guide/frontend/intro` | `/developers-guide/frontend/intro` | updated | The "currently uses Svelte 4" note and the one-line "See also" are replaced by the stack (SvelteKit with adapter-node, Svelte 5 with runes forced on outside `node_modules`, Tailwind + DaisyUI, Paraglide, Supabase, Vitest), the three aliases from `svelte.config.js`, the key `src/lib` directories, the three request hooks and `reroute`, the three app route roots and the workspace scripts. No version numbers; `package.json` and the `.yarnrc.yml` catalog are linked instead. | 0 |

## Claims

| # | Page | Kind | Claim | Anchor file | Anchor |
| --- | --- | --- | --- | --- | --- |
| 1 | frontend/intro | fact | The frontend workspace is `@openvaa/frontend` | apps/frontend/package.json | `"name": "@openvaa/frontend"` |
| 2 | frontend/intro | fact | The frontend is built with `@sveltejs/adapter-node` | apps/frontend/svelte.config.js | `import adapter from '@sveltejs/adapter-node';` |
| 3 | frontend/intro | fact | `compilerOptions` sets `runes: true` | apps/frontend/svelte.config.js | `runes: true` |
| 4 | frontend/intro | fact | `dynamicCompileOptions` returns `runes: true` for files outside `node_modules` | apps/frontend/svelte.config.js | `if (!filename.includes('node_modules')) {` |
| 5 | frontend/intro | fact | The runes return value of `dynamicCompileOptions` | apps/frontend/svelte.config.js | `return { runes: true };` |
| 6 | frontend/intro | fact | Tailwind is imported in `src/app.css` | apps/frontend/src/app.css | `@import 'tailwindcss';` |
| 7 | frontend/intro | fact | DaisyUI is loaded as a plugin in `src/app.css` | apps/frontend/src/app.css | `@plugin 'daisyui' {` |
| 8 | frontend/intro | fact | Paraglide is compiled by its Vite plugin | apps/frontend/vite.config.ts | `paraglideVitePlugin(PARAGLIDE_OPTIONS)` |
| 9 | frontend/intro | fact | The Supabase server client comes from `@supabase/ssr` | apps/frontend/src/lib/supabase/server.ts | `import { createServerClient } from '@supabase/ssr';` |
| 10 | frontend/intro | fact | Unit tests run with Vitest | apps/frontend/package.json | `"test:unit": "vitest run"` |
| 11 | frontend/intro | path | The Yarn catalog lives in `.yarnrc.yml` | .yarnrc.yml | `catalog:` |
| 12 | frontend/intro | flow | `kit.env.dir` points at the repo root | apps/frontend/svelte.config.js | `dir: repoRoot` |
| 13 | frontend/intro | fact | The `$types` alias resolves to `src/lib/types` | apps/frontend/svelte.config.js | `$types: path.resolve('./src/lib/types')` |
| 14 | frontend/intro | fact | The `$candidate` alias resolves to `src/lib/candidate` | apps/frontend/svelte.config.js | `$candidate: path.resolve('./src/lib/candidate')` |
| 15 | frontend/intro | fact | The `$layouts` alias resolves to `src/lib/layouts` | apps/frontend/svelte.config.js | `$layouts: path.resolve('./src/lib/layouts')` |
| 16 | frontend/intro | path | `$lib/routes` is a barrel | apps/frontend/src/lib/routes/index.ts | - |
| 17 | frontend/intro | path | `$lib/contexts/voter` is a context module | apps/frontend/src/lib/contexts/voter/index.ts | - |
| 18 | frontend/intro | path | The data provider entry point is in `src/lib/api` | apps/frontend/src/lib/api/dataProvider.ts | `export function createDataProvider(source: AdapterSource): SupabaseDataProvider {` |
| 19 | frontend/intro | path | The data writer entry point is in `src/lib/api` | apps/frontend/src/lib/api/dataWriter.ts | - |
| 20 | frontend/intro | path | The admin writer entry point is in `src/lib/api` | apps/frontend/src/lib/api/adminWriter.ts | - |
| 21 | frontend/intro | path | The feedback writer entry point is in `src/lib/api` | apps/frontend/src/lib/api/feedbackWriter.ts | - |
| 22 | frontend/intro | path | The server-side local adapter is in `src/lib/server/api/adapters/local` | apps/frontend/src/lib/server/api/adapters/local/localServerAdapter.ts | - |
| 23 | frontend/intro | path | The Admin App job features are in `src/lib/server/admin` | apps/frontend/src/lib/server/admin/features/condenseArguments.ts | - |
| 24 | frontend/intro | fact | The server constants read private env | apps/frontend/src/lib/server/constants.ts | `import { env } from '$env/dynamic/private';` |
| 25 | frontend/intro | fact | `createSupabaseServerClient` is in `src/lib/supabase` | apps/frontend/src/lib/supabase/server.ts | `export function createSupabaseServerClient(event: RequestEvent)` |
| 26 | frontend/intro | fact | `createSupabaseBrowserClient` is in `src/lib/supabase` | apps/frontend/src/lib/supabase/browser.ts | `export function createSupabaseBrowserClient()` |
| 27 | frontend/intro | fact | `createSupabaseAnonClient` is in `src/lib/supabase` | apps/frontend/src/lib/supabase/anon.ts | `export function createSupabaseAnonClient` |
| 28 | frontend/intro | fact | The Admin App job client is in `src/lib/supabase` | apps/frontend/src/lib/supabase/job.ts | `export function createSupabaseJobClient` |
| 29 | frontend/intro | path | The base component library | apps/frontend/src/lib/components | - |
| 30 | frontend/intro | path | The dynamic component library | apps/frontend/src/lib/dynamic-components | - |
| 31 | frontend/intro | path | The candidate component library | apps/frontend/src/lib/candidate/components | - |
| 32 | frontend/intro | fact | `$layouts/main` exports `Layout` | apps/frontend/src/lib/layouts/main/index.ts | `export { default as Layout } from './Layout.svelte';` |
| 33 | frontend/intro | fact | `$layouts/main` exports `Header` | apps/frontend/src/lib/layouts/main/index.ts | `export { default as Header } from './Header.svelte';` |
| 34 | frontend/intro | fact | `$layouts/main` exports `MainContent` | apps/frontend/src/lib/layouts/main/index.ts | `export { default as MainContent } from './MainContent.svelte';` |
| 35 | frontend/intro | fact | The `t()` wrapper is in `src/lib/i18n` | apps/frontend/src/lib/i18n/wrapper.ts | `export function t(key: TranslationKey, params?: Record<string, unknown>): string {` |
| 36 | frontend/intro | fact | The runtime overrides are in `src/lib/i18n` | apps/frontend/src/lib/i18n/overrides.ts | `export function setOverrides(locale: string, overrides: Record<string, unknown>): void {` |
| 37 | frontend/intro | fact | `src/lib/paraglide` is generated and git-ignored | apps/frontend/.gitignore | `src/lib/paraglide/` |
| 38 | frontend/intro | path | Authentication helpers | apps/frontend/src/lib/auth/index.ts | - |
| 39 | frontend/intro | path | Admin App components | apps/frontend/src/lib/admin/components | - |
| 40 | frontend/intro | path | Cookie helpers | apps/frontend/src/lib/cookies/index.ts | - |
| 41 | frontend/intro | path | Shared types | apps/frontend/src/lib/types/index.ts | - |
| 42 | frontend/intro | path | General utilities | apps/frontend/src/lib/utils/components.ts | - |
| 43 | frontend/intro | path | The client hooks | apps/frontend/src/hooks.client.ts | - |
| 44 | frontend/intro | path | The message catalogue | apps/frontend/messages/en/common.json | - |
| 45 | frontend/intro | path | The inlang project settings | apps/frontend/project.inlang/settings.json | - |
| 46 | frontend/intro | path | The Paraglide options module | apps/frontend/paraglide.options.ts | `export const PARAGLIDE_OPTIONS: CompilerOptions = {` |
| 47 | frontend/intro | flow | The server hooks run three handlers in sequence | apps/frontend/src/hooks.server.ts | `export const handle: Handle = sequence(supabaseHandle, paraglideHandle, appGateHandle);` |
| 48 | frontend/intro | flow | `supabaseHandle` creates a per-request server client | apps/frontend/src/hooks.server.ts | `const supabase = createSupabaseServerClient(event);` |
| 49 | frontend/intro | flow | The client goes on `event.locals` | apps/frontend/src/hooks.server.ts | `event.locals.supabase = supabase;` |
| 50 | frontend/intro | flow | `safeGetSession` goes on `event.locals` | apps/frontend/src/hooks.server.ts | `event.locals.safeGetSession = safeGetSession;` |
| 51 | frontend/intro | fact | `safeGetSession` verifies the access token once per request | apps/frontend/src/hooks.server.ts | `verifies each access token once per request` |
| 52 | frontend/intro | flow | `paraglideHandle` runs Paraglide's middleware | apps/frontend/src/hooks.server.ts | `paraglideMiddleware(event.request,` |
| 53 | frontend/intro | flow | `paraglideHandle` sets `event.locals.currentLocale` | apps/frontend/src/hooks.server.ts | `event.locals.currentLocale = locale;` |
| 54 | frontend/intro | flow | `paraglideHandle` fills `%lang%` and `%projectId%` | apps/frontend/src/hooks.server.ts | `html.replace('%lang%', locale).replace('%projectId%', SERVED_PROJECT_ID)` |
| 55 | frontend/intro | fact | `app.html` carries the `%lang%` placeholder | apps/frontend/src/app.html | `<html lang="%lang%">` |
| 56 | frontend/intro | fact | `app.html` carries the `%projectId%` placeholder | apps/frontend/src/app.html | `data-project-id="%projectId%"` |
| 57 | frontend/intro | flow | `appGateHandle` resolves the app gate from the route id | apps/frontend/src/hooks.server.ts | `const gate = resolveAppGate(routeId);` |
| 58 | frontend/intro | flow | A signed-in user on a login page is redirected away | apps/frontend/src/hooks.server.ts | `if (session && routeId === ROUTE[gate.loginRoute]) {` |
| 59 | frontend/intro | flow | A user without a session in a `(protected)` route is redirected | apps/frontend/src/hooks.server.ts | `if (!session && isProtectedRoute(routeId)) {` |
| 60 | frontend/intro | fact | The gate is a session gate, not a role gate | apps/frontend/src/lib/routes/appGates.ts | `A row is a SESSION gate, not a ROLE gate.` |
| 61 | frontend/intro | fact | The protected layout decides whether the user may act in the app | apps/frontend/src/hooks.server.ts | `decided by that application's protected layout and form actions` |
| 62 | frontend/intro | flow | `reroute` removes the locale with `deLocalizeUrl` | apps/frontend/src/hooks.ts | `return deLocalizeUrl(request.url).pathname;` |
| 63 | frontend/intro | flow | The server hooks set the logger level | apps/frontend/src/hooks.server.ts | `configureLogger({ level: logLevel });` |
| 64 | frontend/intro | flow | The client hooks set the logger level | apps/frontend/src/hooks.client.ts | `configureLogger({ level: logLevel });` |
| 65 | frontend/intro | env | The level comes from `PUBLIC_LOG_LEVEL` | apps/frontend/src/hooks.client.ts | `constants.PUBLIC_LOG_LEVEL,` |
| 66 | frontend/intro | path | The Voter App route root | apps/frontend/src/routes/(voters)/+layout.svelte | - |
| 67 | frontend/intro | flow | `(located)` redirects to the selection pages when no selection can be implied | apps/frontend/src/routes/(voters)/(located)/+layout.ts | `If we don't have, them redirect to the necessary selection page.` |
| 68 | frontend/intro | path | The Candidate App route root | apps/frontend/src/routes/candidate/+layout.svelte | - |
| 69 | frontend/intro | path | The Candidate App protected group | apps/frontend/src/routes/candidate/(protected) | - |
| 70 | frontend/intro | path | The Admin App route root | apps/frontend/src/routes/admin/+layout.svelte | - |
| 71 | frontend/intro | path | The Admin App protected group | apps/frontend/src/routes/admin/(protected) | - |
| 72 | frontend/intro | fact | The Admin App and the Candidate App are the gated apps | apps/frontend/src/lib/routes/appGates.ts | `export const APP_GATES: ReadonlyArray<AppGate> = Object.freeze([CANDIDATE_GATE, ADMIN_GATE]);` |
| 73 | frontend/intro | path | The server routes | apps/frontend/src/routes/api/feedback | - |
| 74 | frontend/intro | command | `yarn dev` is a root script | package.json | `"dev":` |
| 75 | frontend/intro | command | `yarn workspace @openvaa/frontend dev` runs Vite | apps/frontend/package.json | `"dev": "vite dev"` |
| 76 | frontend/intro | command | `yarn workspace @openvaa/frontend build` builds | apps/frontend/package.json | `"build": "svelte-kit sync && vite build` |
| 77 | frontend/intro | path | The build output is `build/` | apps/frontend/turbo.json | `"outputs": ["build/**", "src/lib/paraglide/**"]` |
| 78 | frontend/intro | command | `check` runs `svelte-check` failing on warnings | apps/frontend/package.json | `svelte-check --tsconfig ./tsconfig.json --fail-on-warnings` |
| 79 | frontend/intro | command | `paraglide:compile` compiles the messages | apps/frontend/package.json | `"paraglide:compile": "tsx scripts/compile-paraglide.ts"` |
| 80 | frontend/intro | fact | `paraglide:compile` writes to `src/lib/paraglide` | apps/frontend/paraglide.options.ts | `outdir: './src/lib/paraglide'` |
| 81 | frontend/intro | fact | `paraglide:compile` compiles without a frontend build | apps/frontend/scripts/compile-paraglide.ts | `without a frontend build` |

## Findings for todos

None yet.

## Sweep exceptions

None.
