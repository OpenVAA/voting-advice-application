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
| `/developers-guide/frontend/routing` | `/developers-guide/frontend/routing` | updated | Audited; the URL is unchanged. Kept: route versus search parameters, `params.ts`, `impliedParams.ts`, `buildRoute`, the `getRoute` handle and its examples, the generated route map link. Added: no locale segment (`reroute` / `deLocalizeUrl`, `localizeHref`), the route tree table (`(voters)`, `(located)`, `candidate`, `candidate/(protected)`, `admin`, `admin/(protected)`, `api`), `PROTECTED_GROUP`, the `$lib/routes` modules (`ROUTE`, membership predicates, `APP_GATES`), `routeConsistency.test.ts` and its two registered unbuilt keys, `ROUTE_PARAMS` / `PERSISTENT_SEARCH_PARAMS` / `ARRAY_PARAMS`, the `etPl` / `etSg` matchers, and `getRoute` as a stable reference. Changed: the route-parameter example (`entityType` / `entityId` are listed in `ROUTE_PARAMS` but no route uses them; the example is now `questionId` and the results segments). | 0 |
| `/developers-guide/frontend/contexts` | `/developers-guide/frontend/contexts` | updated | Every member described as a "store" (`Readable<…>`, `Writable<…>`, `StackedStore`, `AnswerStore`, `UserDataStore`) and the "Contexts vs global stores" section removed; `/[lang]` initialisers replaced by the real layouts; the broken `#example-loading-cascade-…` anchor removed (the cascade now lives in Data API and adapters § How loaded data reaches components, linked instead); the stray table row removed; `AdminContext` "TBA" filled. Added: `FilterContext`, `init*` / `get*` errors, the runes-based members, the stable-reference versus reactive-accessor classes, the two prohibitions (never destructure a reactive accessor; never alias `dataRoot`, guarded by `noDataRootDerivedAlias.test.ts`), the spread caveat and `setDataRoot`. | 0 |
| `/developers-guide/frontend/data-api` | redirect stub → `/developers-guide/frontend/data-api-and-adapters` | merged → /developers-guide/frontend/data-api-and-adapters | Kept: the three-service idea (provider, data writer, feedback writer; now four with the admin writer), the folder-structure list and the class diagram, both rewritten. Dropped: the Cache section (`/api/cache`, the disk cache, the `CACHE_` variables; removed in 167), the Strapi adapter folder and the Strapi classes, `routes/[lang=locale]/`, the `candidate/login` and `preregisterWithApiToken` route entries (the preregister route is reached by `preregisterWithIdToken`), and "the implementation specified in the settings is returned" (the client always gets the Supabase provider). | 0 |
| `/developers-guide/frontend/accessing-data-and-state-management` | redirect stub → `/developers-guide/frontend/data-api-and-adapters` | merged → /developers-guide/frontend/data-api-and-adapters | Kept: the load → `dataRoot` → contexts paradigm, now § How loaded data reaches components with the real loaders and layouts. Dropped: "either a Strapi backend is accessed or data is read from local `json` files", the `PUBLIC_CACHE_ENABLED` cache reroute, the `$lib/server/_api/serverDataProvider` chain, the `[lang]` paths and `export let data` in the flowchart, and `dataRoot` as a `Readable` store. | 0 |
| `/developers-guide/frontend/data-api-and-adapters` | `/developers-guide/frontend/data-api-and-adapters` | updated | Rewritten from the two merged pages: the four factories and what each returns, `AdapterSource` and its three arms, the root-layout example, the adapter-boundary rule, reading (project scope via `scopedFrom`, anon key and RLS, paging, `getLocalized`, colour processing), writing (data, admin and feedback writers, the routes behind `UNIVERSAL_API_ROUTES`, the context wrappers), `UniversalAdapter.fetch` as 167 left it, the server-side local adapter and the unwired `apiRoute` adapters, the loading flow, the folder structure and a Strapi-free class diagram. The banner and the self-link to this page left by 168-02's mechanical repoint are gone. | 0 |
| `/developers-guide/frontend/components` | `/developers-guide/frontend/components` | updated | Audited; the URL is unchanged. Kept: the dynamic/static split and the generated index link. Added: the third library (`$candidate/components`), the import aliases, the barrel rule, and the runes-era conventions from `Button` (`$props()` typed by a co-located `.type.ts`, snippets with `{@render}`, `concatClass` with caller-wins merging, the `svelte/store` ban, the `@component` comment the generator reads). The Code style guide link no longer carries an anchor (that page is 168-07's). | 0 |
| `/developers-guide/frontend/styling` | `/developers-guide/frontend/styling` | updated | `tailwind.config.cjs` (does not exist) replaced by the CSS-first configuration in `app.css` (`@import 'tailwindcss'`, `@plugin 'daisyui'`, `@plugin 'daisyui/theme'`, `@theme`, the `@source inline` safelist, `tailwind-theme.css` for `@reference`). Kept: the colour table (values re-checked against `app.css`), contrast rules, `color-test.txt`, z-index (re-derived: `z-10` users corrected, the page header no longer uses it), the Modal top-layer note. Added: how `StaticSettings.colors` relates to the theme (see F2). "See `app.css`" made specific (`@layer base`). | 0 |

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
| 82 | frontend/routing | flow | `reroute` removes the locale prefix before route matching | apps/frontend/src/hooks.ts | `return deLocalizeUrl(request.url).pathname;` |
| 83 | frontend/routing | flow | The route builder adds the locale prefix with `localizeHref` | apps/frontend/src/lib/routes/buildRoute.ts | `return localizeHref(url, locale ?` |
| 84 | frontend/routing | fact | The Voter App root route id is the `(voters)` group | apps/frontend/src/lib/routes/route.ts | `export const VOTER = '/(voters)';` |
| 85 | frontend/routing | fact | The Voter App front page is the group root | apps/frontend/src/lib/routes/route.ts | `Home: VOTER,` |
| 86 | frontend/routing | fact | `(located)` holds the routes that need a selected election and constituency | apps/frontend/src/lib/routes/route.ts | `Route-id prefix of the Voter App routes that require a selected election and constituency.` |
| 87 | frontend/routing | path | The questions are under `(located)` | apps/frontend/src/lib/routes/route.ts | `{VOTER_LOCATED}/questions/[questionId]` |
| 88 | frontend/routing | path | The results are under `(located)` | apps/frontend/src/lib/routes/route.ts | `{VOTER_LOCATED}/results/[[electionTab]]/[[entityTab=etPl]]/[[entity=etSg]]/[[id]]` |
| 89 | frontend/routing | flow | The `(located)` layout redirects to the selection pages | apps/frontend/src/routes/(voters)/(located)/+layout.ts | `If we don't have, them redirect to the necessary selection page.` |
| 90 | frontend/routing | path | Candidate App login | apps/frontend/src/lib/routes/route.ts | `{CANDIDATE}/login` |
| 91 | frontend/routing | path | Candidate App registration | apps/frontend/src/lib/routes/route.ts | `{CANDIDATE}/register` |
| 92 | frontend/routing | path | Candidate App pre-registration | apps/frontend/src/lib/routes/route.ts | `{CANDIDATE}/preregister` |
| 93 | frontend/routing | path | Candidate App password reset | apps/frontend/src/lib/routes/route.ts | `{CANDIDATE}/password-reset` |
| 94 | frontend/routing | path | Candidate App help | apps/frontend/src/lib/routes/route.ts | `{CANDIDATE}/help` |
| 95 | frontend/routing | path | Candidate App privacy | apps/frontend/src/lib/routes/route.ts | `{CANDIDATE}/privacy` |
| 96 | frontend/routing | path | Candidate App profile is protected | apps/frontend/src/lib/routes/route.ts | `{CANDIDATE_PROT}/profile` |
| 97 | frontend/routing | path | Candidate App questions are protected | apps/frontend/src/lib/routes/route.ts | `{CANDIDATE_PROT}/questions` |
| 98 | frontend/routing | path | Candidate App preview is protected | apps/frontend/src/lib/routes/route.ts | `{CANDIDATE_PROT}/preview` |
| 99 | frontend/routing | path | Candidate App settings are protected | apps/frontend/src/lib/routes/route.ts | `{CANDIDATE_PROT}/settings` |
| 100 | frontend/routing | path | Admin App login | apps/frontend/src/lib/routes/route.ts | `{ADMIN}/login` |
| 101 | frontend/routing | path | Admin App dashboard is the protected group root | apps/frontend/src/routes/admin/(protected)/+page.svelte | - |
| 102 | frontend/routing | path | Admin App jobs | apps/frontend/src/lib/routes/route.ts | `{ADMIN_PROT}/jobs` |
| 103 | frontend/routing | path | Admin App question info | apps/frontend/src/lib/routes/route.ts | `{ADMIN_PROT}/question-info` |
| 104 | frontend/routing | path | Admin App argument condensation | apps/frontend/src/lib/routes/route.ts | `{ADMIN_PROT}/argument-condensation` |
| 105 | frontend/routing | path | Server route: Admin App job control | apps/frontend/src/routes/api/admin/jobs/start/+server.ts | - |
| 106 | frontend/routing | path | Server route: auth | apps/frontend/src/routes/api/auth/logout/+server.ts | - |
| 107 | frontend/routing | path | Server route: the OIDC exchange | apps/frontend/src/routes/api/oidc/callback/+server.ts | - |
| 108 | frontend/routing | path | Server route: candidate pre-registration | apps/frontend/src/routes/api/candidate/preregister/+server.ts | - |
| 109 | frontend/routing | path | Server route: `data/[collection]` | apps/frontend/src/routes/api/data/[collection]/+server.ts | - |
| 110 | frontend/routing | path | Server route: `feedback` | apps/frontend/src/routes/api/feedback/+server.ts | - |
| 111 | frontend/routing | fact | `PROTECTED_GROUP` is defined once | apps/frontend/src/lib/routes/route.ts | `export const PROTECTED_GROUP = '(protected)';` |
| 112 | frontend/routing | flow | The hook redirects a user without a session from a protected route | apps/frontend/src/hooks.server.ts | `if (!session && isProtectedRoute(routeId)) {` |
| 113 | frontend/routing | fact | `isProtectedRoute` matches the group as a whole segment | apps/frontend/src/lib/routes/route.ts | `return routeId.split('/').includes(PROTECTED_GROUP);` |
| 114 | frontend/routing | fact | `ROUTE` maps keys to route ids | apps/frontend/src/lib/routes/route.ts | `export const ROUTE = {` |
| 115 | frontend/routing | fact | `Results` is a route key | apps/frontend/src/lib/routes/route.ts | `Results: ` |
| 116 | frontend/routing | fact | `CandAppProfile` is a route key | apps/frontend/src/lib/routes/route.ts | `CandAppProfile: ` |
| 117 | frontend/routing | fact | `Route` is the type of the keys | apps/frontend/src/lib/routes/route.ts | `export type Route = keyof typeof ROUTE;` |
| 118 | frontend/routing | fact | `isCandidateRoute` | apps/frontend/src/lib/routes/route.ts | `export function isCandidateRoute(routeId: string): boolean {` |
| 119 | frontend/routing | fact | `isApiRoute` | apps/frontend/src/lib/routes/route.ts | `export function isApiRoute(routeId: string): boolean {` |
| 120 | frontend/routing | fact | `isAdminRoute` | apps/frontend/src/lib/routes/appGates.ts | `export function isAdminRoute(routeId: string): boolean {` |
| 121 | frontend/routing | fact | Membership is decided from a route id, never a pathname | apps/frontend/src/lib/routes/route.ts | `Takes a SvelteKit ROUTE ID, never a pathname.` |
| 122 | frontend/routing | fact | `APP_GATES` gates the Candidate App and the Admin App | apps/frontend/src/lib/routes/appGates.ts | `export const APP_GATES: ReadonlyArray<AppGate> = Object.freeze([CANDIDATE_GATE, ADMIN_GATE]);` |
| 123 | frontend/routing | fact | `resolveAppGate` | apps/frontend/src/lib/routes/appGates.ts | `export function resolveAppGate(routeId: string): AppGate` |
| 124 | frontend/routing | fact | `params.ts` lists the route parameters | apps/frontend/src/lib/routes/params.ts | `export const ROUTE_PARAMS = [` |
| 125 | frontend/routing | fact | `parseParams` | apps/frontend/src/lib/routes/parseParams.ts | `export function parseParams({` |
| 126 | frontend/routing | fact | Elections can be implied | apps/frontend/src/lib/routes/impliedParams.ts | `export function getImpliedElectionIds({` |
| 127 | frontend/routing | fact | Constituencies can be implied | apps/frontend/src/lib/routes/impliedParams.ts | `export function getImpliedConstituencyIds({` |
| 128 | frontend/routing | fact | `buildRoute` | apps/frontend/src/lib/routes/buildRoute.ts | `export function buildRoute(options: RouteOptions, current?: BuildRouteCurrent): string {` |
| 129 | frontend/routing | fact | `routeConsistency.test.ts` checks the tree against `ROUTE` | apps/frontend/src/lib/routes/routeConsistency.test.ts | `const PAGE_FILES = ['+page.svelte', '+page.server.ts', '+page.ts'];` |
| 130 | frontend/routing | fact | Unbuilt protected routes are registered | apps/frontend/src/lib/routes/routeConsistency.test.ts | `const KNOWN_UNBUILT_PROTECTED_ROUTES: Record<string, string> = {` |
| 131 | frontend/routing | fact | `AdminAppJob` has no page | apps/frontend/src/lib/routes/routeConsistency.test.ts | `Admin job detail. No directory exists for it` |
| 132 | frontend/routing | fact | `AdminAppFactorAnalysis` has no page | apps/frontend/src/lib/routes/routeConsistency.test.ts | `Admin factor analysis.` |
| 133 | frontend/routing | command | The test runs in `yarn test:unit` (Vitest) | apps/frontend/package.json | `"test:unit": "vitest run"` |
| 134 | frontend/routing | fact | `questionId` is a route parameter | apps/frontend/src/lib/routes/params.ts | `'questionId'` |
| 135 | frontend/routing | fact | `electionTab` is a route parameter | apps/frontend/src/lib/routes/params.ts | `'electionTab',` |
| 136 | frontend/routing | fact | `entityTab` is a route parameter | apps/frontend/src/lib/routes/params.ts | `'entityTab',` |
| 137 | frontend/routing | fact | `entity` is a route parameter | apps/frontend/src/lib/routes/params.ts | `'entity',` |
| 138 | frontend/routing | fact | `id` is a route parameter | apps/frontend/src/lib/routes/params.ts | `'id',` |
| 139 | frontend/routing | fact | `electionId` and `constituencyId` are persistent search parameters | apps/frontend/src/lib/routes/params.ts | `export const PERSISTENT_SEARCH_PARAMS = ['constituencyId', 'electionId'] as const;` |
| 140 | frontend/routing | fact | They are also array parameters | apps/frontend/src/lib/routes/params.ts | `export const ARRAY_PARAMS = ['constituencyId', 'electionId'] as const;` |
| 141 | frontend/routing | flow | The builder carries the persistent parameters over from the current page | apps/frontend/src/lib/routes/buildRoute.ts | `...(current ? filterPersistent(parseParams(current)) : {}),` |
| 142 | frontend/routing | fact | The `elections.disallowSelection` setting | packages/app-shared/src/settings/dynamicSettings.type.ts | `disallowSelection?: boolean;` |
| 143 | frontend/routing | fact | The `etPl` matcher accepts the plural names | apps/frontend/src/params/etPl.ts | `return param === 'candidates'` |
| 144 | frontend/routing | fact | The `etSg` matcher accepts the singular names | apps/frontend/src/params/etSg.ts | `return param === 'candidate'` |
| 145 | frontend/routing | fact | `buildRoute` accepts a route key alone | apps/frontend/src/lib/routes/buildRoute.ts | `if (typeof options === 'string') options = { route: options };` |
| 146 | frontend/routing | fact | The options take an optional `locale` | apps/frontend/src/lib/routes/buildRoute.ts | `locale?: string;` |
| 147 | frontend/routing | flow | The route's default parameters are combined first | apps/frontend/src/lib/routes/buildRoute.ts | `...(route && route in DEFAULT_PARAMS ? DEFAULT_PARAMS[route] : {}),` |
| 148 | frontend/routing | flow | Each parameter goes to the path or the query string | apps/frontend/src/lib/routes/buildRoute.ts | `if (isRouteParam(key)) routeParams[key] = clean;` |
| 149 | frontend/routing | fact | `getRoute` is a `{ current }` handle on the `AppContext` | apps/frontend/src/lib/contexts/app/appContext.type.ts | `getRoute: { readonly current: RouteBuilder };` |
| 150 | frontend/routing | fact | `getAppContext` | apps/frontend/src/lib/contexts/app/appContext.svelte.ts | `export function getAppContext()` |
| 151 | frontend/routing | flow | `getRoute.current` is bound to the current page | apps/frontend/src/lib/contexts/app/getRoute.svelte.ts | `return (options: RouteOptions) => buildRoute(options, { params, route, url });` |
| 152 | frontend/routing | flow | Without a route key, the current route is used | apps/frontend/src/lib/routes/buildRoute.ts | `const routeId = route ? ROUTE[route] : current?.route?.id` |
| 153 | frontend/routing | fact | `getRoute` is destructured as a stable reference | apps/frontend/src/routes/(voters)/(located)/results/[[electionTab]]/+layout.svelte | `const { answers, getRoute, startEvent, startFeedbackPopupCountdown, startSurveyPopupCountdown, t } = voterCtx;` |
| 154 | frontend/routing | fact | `getRoute.current` is re-derived on every navigation | apps/frontend/src/lib/contexts/app/getRoute.svelte.ts | `every navigation invalidates` |
| 155 | frontend/contexts | path | One directory per context | apps/frontend/src/lib/contexts/voter/index.ts | - |
| 156 | frontend/contexts | fact | A second `init` call throws | apps/frontend/src/lib/contexts/voter/voterContext.svelte.ts | `initVoterContext() called for a second time` |
| 157 | frontend/contexts | fact | A `get` before `init` throws | apps/frontend/src/lib/contexts/voter/voterContext.svelte.ts | `getVoterContext() called before initVoterContext()` |
| 158 | frontend/contexts | fact | Context members are runes state | apps/frontend/src/lib/contexts/data/dataContext.svelte.ts | `#version = $state(0);` |
| 159 | frontend/contexts | flow | The root layout initialises the `I18nContext` | apps/frontend/src/routes/+layout.svelte | `initI18nContext();` |
| 160 | frontend/contexts | fact | `I18nContext` members | apps/frontend/src/lib/contexts/i18n/i18nContext.ts | `import { getLocale, locales, t, translate } from '$lib/i18n';` |
| 161 | frontend/contexts | flow | The root layout initialises the `ComponentContext` | apps/frontend/src/routes/+layout.svelte | `initComponentContext();` |
| 162 | frontend/contexts | flow | `ComponentContext` includes the `I18nContext` | apps/frontend/src/lib/contexts/component/componentContext.svelte.ts | `Object.assign(this, getI18nContext());` |
| 163 | frontend/contexts | fact | `ComponentContext.darkMode` | apps/frontend/src/lib/contexts/component/componentContext.type.ts | `darkMode: boolean;` |
| 164 | frontend/contexts | flow | The root layout initialises the `DataContext` | apps/frontend/src/routes/+layout.svelte | `initDataContext();` |
| 165 | frontend/contexts | fact | `DataContext.dataRoot` | apps/frontend/src/lib/contexts/data/dataContext.type.ts | `readonly dataRoot: DataRoot;` |
| 166 | frontend/contexts | fact | `DataContext.setDataRoot` | apps/frontend/src/lib/contexts/data/dataContext.type.ts | `setDataRoot: (updater: (dataRoot: DataRoot) => void) => void;` |
| 167 | frontend/contexts | flow | The root layout initialises the `AppContext` | apps/frontend/src/routes/+layout.svelte | `const appCtx = initAppContext();` |
| 168 | frontend/contexts | fact | `AppContext` includes the `ComponentContext` | apps/frontend/src/lib/contexts/app/appContext.type.ts | `export type AppContext = Omit<ComponentContext,` |
| 169 | frontend/contexts | fact | `AppContext` includes the `DataContext` | apps/frontend/src/lib/contexts/app/appContext.type.ts | `  DataContext &` |
| 170 | frontend/contexts | fact | `AppContext.appSettings` | apps/frontend/src/lib/contexts/app/appContext.type.ts | `readonly appSettings: AppSettings;` |
| 171 | frontend/contexts | fact | `AppContext.appCustomization` | apps/frontend/src/lib/contexts/app/appContext.type.ts | `appCustomization: {` |
| 172 | frontend/contexts | fact | `AppContext.appType` | apps/frontend/src/lib/contexts/app/appContext.type.ts | `appType: {` |
| 173 | frontend/contexts | fact | `AppContext.userPreferences` | apps/frontend/src/lib/contexts/app/appContext.type.ts | `userPreferences: {` |
| 174 | frontend/contexts | fact | `AppContext.popupQueue` | apps/frontend/src/lib/contexts/app/appContext.type.ts | `popupQueue: PopupState;` |
| 175 | frontend/contexts | fact | `AppContext.sendFeedback` | apps/frontend/src/lib/contexts/app/appContext.type.ts | `sendFeedback: FeedbackWriter['postFeedback'];` |
| 176 | frontend/contexts | fact | The tracking function `startEvent` | apps/frontend/src/lib/contexts/app/tracking/trackingService.type.ts | `startEvent: (name: TrackingEvent['name'], data?: TrackingEvent['data']) => TrackingEvent;` |
| 177 | frontend/contexts | fact | The consent setter | apps/frontend/src/lib/contexts/app/appContext.type.ts | `setDataConsent: (consent: UserDataCollectionConsent) => void;` |
| 178 | frontend/contexts | fact | The survey setter | apps/frontend/src/lib/contexts/app/appContext.type.ts | `setSurveyStatus: (status: UserFeedbackStatus) => void;` |
| 179 | frontend/contexts | flow | The root layout initialises the `LayoutContext` | apps/frontend/src/routes/+layout.svelte | `const layoutCtx = initLayoutContext();` |
| 180 | frontend/contexts | fact | `LayoutContext.topBarSettings` | apps/frontend/src/lib/contexts/layout/layoutContext.type.ts | `topBarSettings: SettingsOverlayApi<TopBarSettings, DeepPartial<TopBarSettings>>;` |
| 181 | frontend/contexts | fact | `LayoutContext.pageStyles` | apps/frontend/src/lib/contexts/layout/layoutContext.type.ts | `pageStyles: SettingsOverlayApi<PageStyles, DeepPartial<PageStyles>>;` |
| 182 | frontend/contexts | fact | `LayoutContext.progress` | apps/frontend/src/lib/contexts/layout/layoutContext.type.ts | `progress: Progress;` |
| 183 | frontend/contexts | fact | `LayoutContext.navigation` | apps/frontend/src/lib/contexts/layout/layoutContext.type.ts | `navigation: Navigation;` |
| 184 | frontend/contexts | fact | `LayoutContext.video` | apps/frontend/src/lib/contexts/layout/layoutContext.type.ts | `video: VideoController;` |
| 185 | frontend/contexts | fact | `LayoutContext.useTopBar` | apps/frontend/src/lib/contexts/layout/layoutContext.type.ts | `useTopBar: (overlay: DeepPartial<TopBarSettings>) => void;` |
| 186 | frontend/contexts | fact | `LayoutContext.usePageStyles` | apps/frontend/src/lib/contexts/layout/layoutContext.type.ts | `usePageStyles: (overlay: DeepPartial<PageStyles>) => void;` |
| 187 | frontend/contexts | fact | `LayoutContext.useNavigation` | apps/frontend/src/lib/contexts/layout/layoutContext.type.ts | `useNavigation: (overlay: DeepPartial<NavigationSettings>) => void;` |
| 188 | frontend/contexts | fact | `LayoutContext.setRouteTitle` | apps/frontend/src/lib/contexts/layout/layoutContext.type.ts | `setRouteTitle: (title: string) => void;` |
| 189 | frontend/contexts | flow | The root layout initialises the `AuthContext` | apps/frontend/src/routes/+layout.svelte | `initAuthContext();` |
| 190 | frontend/contexts | fact | `AuthContext.isAuthenticated` | apps/frontend/src/lib/contexts/auth/authContext.type.ts | `readonly isAuthenticated: boolean;` |
| 191 | frontend/contexts | fact | `AuthContext.logout` | apps/frontend/src/lib/contexts/auth/authContext.type.ts | `logout: () => Promise<void>;` |
| 192 | frontend/contexts | fact | `AuthContext.requestForgotPasswordEmail` | apps/frontend/src/lib/contexts/auth/authContext.type.ts | `requestForgotPasswordEmail: (opts: { email: string })` |
| 193 | frontend/contexts | fact | `AuthContext.resetPassword` | apps/frontend/src/lib/contexts/auth/authContext.type.ts | `resetPassword: (opts: { code: string; password: string })` |
| 194 | frontend/contexts | fact | `AuthContext.setPassword` | apps/frontend/src/lib/contexts/auth/authContext.type.ts | `setPassword: (opts: { password: string }) => Promise<DataApiActionResult>;` |
| 195 | frontend/contexts | flow | The Voter App layout initialises the `VoterContext` | apps/frontend/src/routes/(voters)/+layout.svelte | `const ctx = initVoterContext();` |
| 196 | frontend/contexts | fact | `VoterContext` includes the `AppContext` | apps/frontend/src/lib/contexts/voter/voterContext.type.ts | `export type VoterContext = AppContext & {` |
| 197 | frontend/contexts | fact | `VoterContext.answers` | apps/frontend/src/lib/contexts/voter/voterContext.type.ts | `answers: AnswerState;` |
| 198 | frontend/contexts | fact | `VoterContext.matches` | apps/frontend/src/lib/contexts/voter/voterContext.type.ts | `matches: MatchTree;` |
| 199 | frontend/contexts | fact | `VoterContext.entityFilters` | apps/frontend/src/lib/contexts/voter/voterContext.type.ts | `entityFilters: FilterTree;` |
| 200 | frontend/contexts | fact | `VoterContext.filterContext` | apps/frontend/src/lib/contexts/voter/voterContext.type.ts | `filterContext: FilterContext;` |
| 201 | frontend/contexts | fact | `VoterContext.selectedElections` | apps/frontend/src/lib/contexts/voter/voterContext.type.ts | `selectedElections: Array<Election>;` |
| 202 | frontend/contexts | fact | `VoterContext.selectedConstituencies` | apps/frontend/src/lib/contexts/voter/voterContext.type.ts | `selectedConstituencies: Array<Constituency>;` |
| 203 | frontend/contexts | fact | `VoterContext.opinionQuestions` | apps/frontend/src/lib/contexts/voter/voterContext.type.ts | `opinionQuestions: Array<AnyQuestionVariant>;` |
| 204 | frontend/contexts | fact | `VoterContext.infoQuestions` | apps/frontend/src/lib/contexts/voter/voterContext.type.ts | `infoQuestions: Array<AnyQuestionVariant>;` |
| 205 | frontend/contexts | fact | `VoterContext.resultsAvailable` | apps/frontend/src/lib/contexts/voter/voterContext.type.ts | `resultsAvailable: boolean;` |
| 206 | frontend/contexts | fact | `VoterContext.resetVoterData` | apps/frontend/src/lib/contexts/voter/voterContext.type.ts | `resetVoterData: () => void;` |
| 207 | frontend/contexts | flow | `initVoterContext` initialises the `FilterContext` | apps/frontend/src/lib/contexts/voter/voterContext.svelte.ts | `initFilterContext({` |
| 208 | frontend/contexts | fact | `FilterContext.filterGroup` | apps/frontend/src/lib/contexts/filter/filterContext.type.ts | `readonly filterGroup:` |
| 209 | frontend/contexts | fact | `FilterContext.version` | apps/frontend/src/lib/contexts/filter/filterContext.type.ts | `readonly version: number;` |
| 210 | frontend/contexts | flow | The Candidate App layout initialises the `CandidateContext` | apps/frontend/src/routes/candidate/+layout.svelte | `initCandidateContext();` |
| 211 | frontend/contexts | fact | `CandidateContext` includes the `AppContext` | apps/frontend/src/lib/contexts/candidate/candidateContext.type.ts | `export type CandidateContext = AppContext &` |
| 212 | frontend/contexts | fact | `CandidateContext` includes the `AuthContext` | apps/frontend/src/lib/contexts/candidate/candidateContext.type.ts | `  AuthContext & {` |
| 213 | frontend/contexts | fact | `CandidateContext.userData` | apps/frontend/src/lib/contexts/candidate/candidateContext.type.ts | `userData: CandidateUserDataState;` |
| 214 | frontend/contexts | fact | `CandidateContext.selectedElections` | apps/frontend/src/lib/contexts/candidate/candidateContext.type.ts | `selectedElections: Array<Election>;` |
| 215 | frontend/contexts | fact | `CandidateContext.opinionQuestions` | apps/frontend/src/lib/contexts/candidate/candidateContext.type.ts | `opinionQuestions: Array<AnyQuestionVariant>;` |
| 216 | frontend/contexts | fact | `CandidateContext.answersLocked` | apps/frontend/src/lib/contexts/candidate/candidateContext.type.ts | `answersLocked: boolean;` |
| 217 | frontend/contexts | fact | `CandidateContext.profileComplete` | apps/frontend/src/lib/contexts/candidate/candidateContext.type.ts | `profileComplete: boolean;` |
| 218 | frontend/contexts | fact | `CandidateContext.checkRegistrationKey` | apps/frontend/src/lib/contexts/candidate/candidateContext.type.ts | `checkRegistrationKey: (opts: { registrationKey: string })` |
| 219 | frontend/contexts | fact | `CandidateContext.register` | apps/frontend/src/lib/contexts/candidate/candidateContext.type.ts | `register: (opts: { registrationKey: string; password: string })` |
| 220 | frontend/contexts | fact | `CandidateContext.preregister` | apps/frontend/src/lib/contexts/candidate/candidateContext.type.ts | `preregister: (opts: {` |
| 221 | frontend/contexts | fact | `CandidateContext.exchangeCodeForIdToken` | apps/frontend/src/lib/contexts/candidate/candidateContext.type.ts | `exchangeCodeForIdToken: (opts: {` |
| 222 | frontend/contexts | flow | The Admin App layout initialises the `AdminContext` | apps/frontend/src/routes/admin/+layout.svelte | `const ctx = initAdminContext();` |
| 223 | frontend/contexts | fact | `AdminContext` includes the `AppContext` and the `AuthContext` | apps/frontend/src/lib/contexts/admin/adminContext.type.ts | `export type AdminContext = AppContext &` |
| 224 | frontend/contexts | fact | `AdminContext.userData` | apps/frontend/src/lib/contexts/admin/adminContext.type.ts | `userData: BasicUserData` |
| 225 | frontend/contexts | fact | `AdminContext.jobs` | apps/frontend/src/lib/contexts/admin/adminContext.type.ts | `jobs: JobStates;` |
| 226 | frontend/contexts | fact | `AdminContext.updateQuestion` | apps/frontend/src/lib/contexts/admin/adminContext.type.ts | `updateQuestion(opts:` |
| 227 | frontend/contexts | fact | `AdminContext.startJob` | apps/frontend/src/lib/contexts/admin/adminContext.type.ts | `startJob(opts:` |
| 228 | frontend/contexts | fact | `AdminContext.getJobProgress` | apps/frontend/src/lib/contexts/admin/adminContext.type.ts | `getJobProgress(opts:` |
| 229 | frontend/contexts | fact | `AdminContext.abortJob` | apps/frontend/src/lib/contexts/admin/adminContext.type.ts | `abortJob(opts:` |
| 230 | frontend/contexts | fact | `AdminContext.insertJobResult` | apps/frontend/src/lib/contexts/admin/adminContext.type.ts | `insertJobResult(opts:` |
| 231 | frontend/contexts | fact | The example's import | apps/frontend/src/routes/(voters)/(located)/results/[[electionTab]]/+layout.svelte | `import { getVoterContext } from '$lib/contexts/voter';` |
| 232 | frontend/contexts | fact | The example reads the context | apps/frontend/src/routes/(voters)/(located)/results/[[electionTab]]/+layout.svelte | `const voterCtx = getVoterContext();` |
| 233 | frontend/contexts | fact | The example destructures the stable references | apps/frontend/src/routes/(voters)/(located)/results/[[electionTab]]/+layout.svelte | `const { answers, getRoute, startEvent, startFeedbackPopupCountdown, startSurveyPopupCountdown, t } = voterCtx;` |
| 234 | frontend/contexts | fact | The example binds `appSettings` with `$derived` | apps/frontend/src/routes/(voters)/(located)/results/[[electionTab]]/+layout.svelte | `const appSettings = $derived(voterCtx.appSettings);` |
| 235 | frontend/contexts | fact | The example binds `selectedElections` with `$derived` | apps/frontend/src/routes/(voters)/(located)/results/[[electionTab]]/+layout.svelte | `const elections = $derived(voterCtx.selectedElections);` |
| 236 | frontend/contexts | fact | `voterCtx.resultsAvailable` is read directly | apps/frontend/src/routes/(voters)/(located)/results/[[electionTab]]/+layout.svelte | `voterCtx.resultsAvailable ?` |
| 237 | frontend/contexts | fact | `ctx.dataRoot.elections` is read directly in a template | apps/frontend/src/lib/components/electionSelector/ElectionSelector.svelte | `elections={ctx.dataRoot.elections}` |
| 238 | frontend/contexts | fact | `t`, `translate` and `locales` are stable references | apps/frontend/src/lib/contexts/component/componentContext.svelte.ts | `They are STABLE references` |
| 239 | frontend/contexts | fact | `darkMode` is a `{ current }` handle on the `AppContext` | apps/frontend/src/lib/contexts/app/appContext.type.ts | `darkMode: { readonly current: boolean };` |
| 240 | frontend/contexts | fact | `appType` and `getRoute` are stable handles read through `current` | apps/frontend/src/lib/layouts/main/Banner.svelte | `are stable rune handles from AppContext; read` |
| 241 | frontend/contexts | fact | `logout` survives being destructured | apps/frontend/src/lib/contexts/auth/authContext.svelte.ts | `they survive detach` |
| 242 | frontend/contexts | fact | `appSettings` must not be destructured | apps/frontend/src/lib/contexts/app/appContext.type.ts | `(never destructured) — it is a reactive accessor per CLAUDE.md` |
| 243 | frontend/contexts | fact | `currentResultsElection` must not be destructured | apps/frontend/src/lib/contexts/voter/voterContext.type.ts | `this is a reactive accessor and MUST NOT be destructured out of the context object` |
| 244 | frontend/contexts | flow | Destructuring calls the getter once | apps/frontend/src/lib/contexts/voter/voterContext.type.ts | `the getter would be invoked ONCE at component-init time` |
| 245 | frontend/contexts | fact | `isAuthenticated` is reactive | apps/frontend/src/lib/contexts/auth/authContext.svelte.ts | `#isAuthenticated = $derived(!!page.data.session);` |
| 246 | frontend/contexts | fact | `DataRoot` keeps its identity; a version counter is bumped | apps/frontend/src/lib/contexts/data/dataContext.svelte.ts | `has a STABLE identity and is mutated in place` |
| 247 | frontend/contexts | fact | A `$derived` alias over `dataRoot` goes stale | apps/frontend/src/lib/contexts/tests/noDataRootDerivedAlias.test.ts | `Consumers reading through that alias keep their empty pre-mount snapshot.` |
| 248 | frontend/contexts | fact | The unit test fails on such an alias | apps/frontend/src/lib/contexts/tests/noDataRootDerivedAlias.test.ts | `If this test fails, it means a source file under` |
| 249 | frontend/contexts | fact | Spreading copies a snapshot | apps/frontend/src/lib/contexts/auth/authContext.svelte.ts | `as a snapshot, which is the documented spread-of-context trap` |
| 250 | frontend/contexts | flow | `setDataRoot` runs the update untracked | apps/frontend/src/lib/contexts/data/dataContext.svelte.ts | `untrack(() => updater(this.#dataRoot));` |
| 251 | frontend/contexts | fact | The untracked write keeps the effect from looping | apps/frontend/src/lib/contexts/data/dataContext.type.ts | `cannot self-loop` |
| 252 | frontend/data-api-and-adapters | fact | The four root modules are the selectors into the adapters | apps/frontend/eslint.config.mjs | `Four selector modules that name the adapter path` |
| 253 | frontend/data-api-and-adapters | fact | `createDataProvider` returns a `SupabaseDataProvider` | apps/frontend/src/lib/api/dataProvider.ts | `export function createDataProvider(source: AdapterSource): SupabaseDataProvider {` |
| 254 | frontend/data-api-and-adapters | fact | `createDataWriter` returns a `SupabaseDataWriter` | apps/frontend/src/lib/api/dataWriter.ts | `export function createDataWriter(source: AdapterSource): SupabaseDataWriter {` |
| 255 | frontend/data-api-and-adapters | fact | `createAdminWriter` returns a `SupabaseAdminWriter` | apps/frontend/src/lib/api/adminWriter.ts | `export function createAdminWriter(source: AdapterSource): SupabaseAdminWriter {` |
| 256 | frontend/data-api-and-adapters | fact | `createFeedbackWriter` returns a `SupabaseFeedbackWriter` | apps/frontend/src/lib/api/feedbackWriter.ts | `export function createFeedbackWriter(source: AdapterSource): SupabaseFeedbackWriter {` |
| 257 | frontend/data-api-and-adapters | fact | The provider reads app settings | apps/frontend/src/lib/api/base/dataProvider.type.ts | `getAppSettings: (options?: GetDataOptionsBase)` |
| 258 | frontend/data-api-and-adapters | fact | The provider reads app customization | apps/frontend/src/lib/api/base/dataProvider.type.ts | `getAppCustomization: (options?: GetAppCustomizationOptions)` |
| 259 | frontend/data-api-and-adapters | fact | The provider reads elections | apps/frontend/src/lib/api/base/dataProvider.type.ts | `getElectionData: (options?: GetElectionsOptions)` |
| 260 | frontend/data-api-and-adapters | fact | The provider reads constituencies | apps/frontend/src/lib/api/base/dataProvider.type.ts | `getConstituencyData: (options?: GetConstituenciesOptions)` |
| 261 | frontend/data-api-and-adapters | fact | The provider reads nominations | apps/frontend/src/lib/api/base/dataProvider.type.ts | `getNominationData: (options?: GetNominationsOptions)` |
| 262 | frontend/data-api-and-adapters | fact | The provider reads entities | apps/frontend/src/lib/api/base/dataProvider.type.ts | `getEntityData: (options?: GetEntitiesOptions)` |
| 263 | frontend/data-api-and-adapters | fact | The provider reads questions | apps/frontend/src/lib/api/base/dataProvider.type.ts | `getQuestionData: (options?: GetQuestionsOptions)` |
| 264 | frontend/data-api-and-adapters | fact | The data writer handles registration | apps/frontend/src/lib/api/base/dataWriter.type.ts | `register: (opts: { registrationKey: string; password: string })` |
| 265 | frontend/data-api-and-adapters | fact | The data writer handles pre-registration | apps/frontend/src/lib/api/base/dataWriter.type.ts | `preregisterWithIdToken: (opts: {` |
| 266 | frontend/data-api-and-adapters | fact | The data writer handles passwords | apps/frontend/src/lib/api/base/dataWriter.type.ts | `setPassword: (opts: { password: string })` |
| 267 | frontend/data-api-and-adapters | fact | The data writer reads the candidate's data | apps/frontend/src/lib/api/base/dataWriter.type.ts | `getCandidateUserData: <TNominations extends boolean` |
| 268 | frontend/data-api-and-adapters | fact | The data writer writes the candidate's answers | apps/frontend/src/lib/api/base/dataWriter.type.ts | `updateAnswers: (opts: SetAnswersOptions)` |
| 269 | frontend/data-api-and-adapters | fact | The data writer has the job methods | apps/frontend/src/lib/api/base/dataWriter.type.ts | `getActiveJobs: (opts: GetActiveJobsOptions)` |
| 270 | frontend/data-api-and-adapters | fact | The admin writer updates questions | apps/frontend/src/lib/api/adapters/supabase/adminWriter/supabaseAdminWriter.ts | `async updateQuestion({ id, data: { customData } }: SetQuestionOptions)` |
| 271 | frontend/data-api-and-adapters | fact | The admin writer inserts job results | apps/frontend/src/lib/api/adapters/supabase/adminWriter/supabaseAdminWriter.ts | `async insertJobResult({ data }: InsertJobResultOptions)` |
| 272 | frontend/data-api-and-adapters | fact | The admin writer sends email | apps/frontend/src/lib/api/adapters/supabase/adminWriter/supabaseAdminWriter.ts | `async sendEmail({` |
| 273 | frontend/data-api-and-adapters | fact | `callerMayOnProject` | apps/frontend/src/lib/api/adapters/supabase/adminWriter/supabaseAdminWriter.ts | `async callerMayOnProject(permission: Enums<'grant_permission'>): Promise<boolean> {` |
| 274 | frontend/data-api-and-adapters | flow | `callerMayOnProject` checks the grant with `user_can` | apps/frontend/src/lib/api/adapters/supabase/adminWriter/supabaseAdminWriter.ts | `this.supabase.rpc('user_can', {` |
| 275 | frontend/data-api-and-adapters | flow | The app context posts feedback through the feedback writer | apps/frontend/src/lib/contexts/app/appContext.svelte.ts | `return createFeedbackWriter({ fetch, browser: true }).postFeedback(feedback);` |
| 276 | frontend/data-api-and-adapters | fact | Every call returns a fresh instance | apps/frontend/src/lib/api/dataProvider.ts | `Every call returns a fresh instance` |
| 277 | frontend/data-api-and-adapters | fact | An admin writer can be built for one job | apps/frontend/src/lib/api/adminWriter.ts | `for ONE job` |
| 278 | frontend/data-api-and-adapters | fact | An ESLint rule bans constructing an adapter at module scope | apps/frontend/src/lib/_guards/eslint-adapter-singleton-guard.test.ts | `clause 1 bans a module-scope` |
| 279 | frontend/data-api-and-adapters | flow | `createDataProvider` always builds the Supabase provider | apps/frontend/src/lib/api/dataProvider.ts | `return new SupabaseDataProvider(resolveAdapterConfig(source));` |
| 280 | frontend/data-api-and-adapters | fact | `dataAdapter.type` does not change the client's provider | packages/app-shared/src/settings/staticSettings.type.ts | `the client uses the Supabase data provider whatever` |
| 281 | frontend/data-api-and-adapters | fact | The `locals` arm | apps/frontend/src/lib/api/dataProvider.ts | `{ fetch: Fetch; locals: { supabase: SupabaseClient<SupabaseDatabase> } }` |
| 282 | frontend/data-api-and-adapters | fact | The `client` arm | apps/frontend/src/lib/api/dataProvider.ts | `{ fetch: Fetch; client: SupabaseClient<SupabaseDatabase> }` |
| 283 | frontend/data-api-and-adapters | fact | The `browser` arm | apps/frontend/src/lib/api/dataProvider.ts | `{ fetch: Fetch; browser: true }` |
| 284 | frontend/data-api-and-adapters | fact | A caller that supplies no client does not compile | apps/frontend/src/lib/api/dataProvider.ts | `so a caller that supplies no client does not compile` |
| 285 | frontend/data-api-and-adapters | flow | The `locals` arm uses the hook's client | apps/frontend/src/lib/api/dataProvider.ts | `if ('locals' in source) return { ...locales, fetch: source.fetch, client: source.locals.supabase };` |
| 286 | frontend/data-api-and-adapters | flow | A universal load builds its client from the cookies | apps/frontend/src/routes/+layout.ts | `createSupabaseUniversalClient({ fetch, cookies: data.supabaseCookies })` |
| 287 | frontend/data-api-and-adapters | flow | The root server load passes the Supabase auth cookies | apps/frontend/src/routes/+layout.server.ts | `supabaseCookies` |
| 288 | frontend/data-api-and-adapters | flow | An Admin App job passes the job client | apps/frontend/src/lib/server/admin/features/condenseArguments.ts | `client: createSupabaseJobClient({ accessToken: session?.access_token })` |
| 289 | frontend/data-api-and-adapters | flow | A route without a session passes the anonymous client | apps/frontend/src/routes/candidate/preregister/+layout.server.ts | `createDataProvider({ fetch, client: createSupabaseAnonClient({ fetch }) })` |
| 290 | frontend/data-api-and-adapters | flow | The `browser` arm uses the tab's single client | apps/frontend/src/lib/api/dataProvider.ts | `if ('browser' in source) return { ...locales, fetch: source.fetch, client: createSupabaseBrowserClient() };` |
| 291 | frontend/data-api-and-adapters | fact | The browser client is one per tab | apps/frontend/src/lib/supabase/browser.ts | `keeps one module-level client in a browser` |
| 292 | frontend/data-api-and-adapters | fact | Every arm accepts `locale` | apps/frontend/src/lib/api/dataProvider.ts | `locale?: string;` |
| 293 | frontend/data-api-and-adapters | fact | Every arm accepts `defaultLocale` | apps/frontend/src/lib/api/dataProvider.ts | `defaultLocale?: string;` |
| 294 | frontend/data-api-and-adapters | fact | A method's `locale` option overrides them | apps/frontend/src/lib/api/dataProvider.ts | `and each read method's` |
| 295 | frontend/data-api-and-adapters | fact | The example's imports | apps/frontend/src/routes/+layout.ts | `import { createDataProvider, createSupabaseUniversalClient } from '$lib/api/dataProvider';` |
| 296 | frontend/data-api-and-adapters | fact | The example's locale import | apps/frontend/src/routes/+layout.ts | `import { getLocale } from '$lib/paraglide/runtime';` |
| 297 | frontend/data-api-and-adapters | fact | The example's locale | apps/frontend/src/routes/+layout.ts | `const lang = getLocale();` |
| 298 | frontend/data-api-and-adapters | fact | The example's provider | apps/frontend/src/routes/+layout.ts | `const dataProvider = createDataProvider({ fetch, client: supabaseClient, locale: lang });` |
| 299 | frontend/data-api-and-adapters | fact | The example's read | apps/frontend/src/routes/+layout.ts | `dataProvider.getAppSettings({ locale: lang }).catch((e) => e),` |
| 300 | frontend/data-api-and-adapters | fact | The adapter-boundary allowlist | apps/frontend/eslint.config.mjs | `const ADAPTER_BOUNDARY_ALLOWLIST = [` |
| 301 | frontend/data-api-and-adapters | fact | `$lib/api/adapters` is inside the boundary | apps/frontend/eslint.config.mjs | `'src/lib/api/adapters/**',` |
| 302 | frontend/data-api-and-adapters | fact | `$lib/supabase` is inside the boundary | apps/frontend/eslint.config.mjs | `'src/lib/supabase/**',` |
| 303 | frontend/data-api-and-adapters | fact | `SupabaseDataProvider` extends `UniversalDataProvider` through the mixin | apps/frontend/src/lib/api/adapters/supabase/dataProvider/supabaseDataProvider.ts | `export class SupabaseDataProvider extends supabaseAdapterMixin(UniversalDataProvider) {` |
| 304 | frontend/data-api-and-adapters | flow | The project id comes from the configuration or `PUBLIC_PROJECT_ID` | apps/frontend/src/lib/api/adapters/supabase/supabaseAdapter.ts | `const raw = configured && configured.trim() !== '' ? configured : constants.PUBLIC_PROJECT_ID;` |
| 305 | frontend/data-api-and-adapters | flow | An unset project id throws | apps/frontend/src/lib/api/adapters/supabase/supabaseAdapter.ts | `PUBLIC_PROJECT_ID is required but not set.` |
| 306 | frontend/data-api-and-adapters | flow | A non-UUID project id throws | apps/frontend/src/lib/api/adapters/supabase/supabaseAdapter.ts | `if (!CANONICAL_UUID.test(normalised))` |
| 307 | frontend/data-api-and-adapters | fact | There is no fallback project | apps/frontend/src/lib/api/adapters/supabase/supabaseAdapter.ts | `There is deliberately NO fallback value` |
| 308 | frontend/data-api-and-adapters | fact | `scopedFrom` | apps/frontend/src/lib/api/adapters/supabase/supabaseAdapter.ts | `scopedFrom<TTable extends ProjectScopedTable>(table: TTable): ScopedTableAccess<TTable> {` |
| 309 | frontend/data-api-and-adapters | flow | `scopedFrom` filters reads, updates and deletes and fills inserts | apps/frontend/src/lib/api/adapters/supabase/supabaseAdapter.ts | `Reads, updates and deletes get the project filter appended; inserts get the project column supplied` |
| 310 | frontend/data-api-and-adapters | fact | The server client uses the anon key | apps/frontend/src/lib/supabase/server.ts | `createServerClient<SupabaseDatabase>(constants.PUBLIC_SUPABASE_URL, constants.PUBLIC_SUPABASE_ANON_KEY, {` |
| 311 | frontend/data-api-and-adapters | fact | The browser client uses the anon key | apps/frontend/src/lib/supabase/browser.ts | `constants.PUBLIC_SUPABASE_ANON_KEY` |
| 312 | frontend/data-api-and-adapters | fact | The universal client uses the anon key | apps/frontend/src/lib/supabase/universal.ts | `constants.PUBLIC_SUPABASE_ANON_KEY` |
| 313 | frontend/data-api-and-adapters | fact | The anonymous client uses the anon key | apps/frontend/src/lib/supabase/anon.ts | `constants.PUBLIC_SUPABASE_ANON_KEY` |
| 314 | frontend/data-api-and-adapters | fact | The job client uses the anon key and the admin's token | apps/frontend/src/lib/supabase/job.ts | `constants.PUBLIC_SUPABASE_ANON_KEY` |
| 315 | frontend/data-api-and-adapters | fact | Row-level security is enabled on the tables | apps/supabase/supabase/schema/302-rls.sql | `ALTER TABLE public.accounts ENABLE ROW LEVEL SECURITY;` |
| 316 | frontend/data-api-and-adapters | fact | Row-level security evaluates a job's writes as its admin | apps/frontend/src/lib/supabase/job.ts | `row-level security evaluates every read and write as the admin who started the job` |
| 317 | frontend/data-api-and-adapters | fact | The frontend never reads the service-role key | .env.example | `reads it; only local tooling and the test harness do.` |
| 318 | frontend/data-api-and-adapters | flow | Reads are paged by `dataAdapter.pageSize` | apps/frontend/src/lib/api/adapters/supabase/dataProvider/supabaseDataProvider.ts | `pageSize: staticSettings.dataAdapter.pageSize` |
| 319 | frontend/data-api-and-adapters | fact | The page size must equal `max_rows` | packages/app-shared/src/settings/staticSettings.type.ts | `Must equal PostgREST` |
| 320 | frontend/data-api-and-adapters | flow | Localized columns are extracted with `getLocalized` | apps/frontend/src/lib/api/adapters/supabase/dataProvider/supabaseDataProvider.ts | `getLocalized(notif.title, locale, this.defaultLocale)` |
| 321 | frontend/data-api-and-adapters | fact | The default `defaultLocale` | apps/frontend/src/lib/api/adapters/supabase/supabaseAdapter.ts | `#defaultLocale = 'en';` |
| 322 | frontend/data-api-and-adapters | fact | `UniversalDataProvider` handles errors and processes the data | apps/frontend/src/lib/api/base/universalDataProvider.ts | `It implements error handling and pre-processing of raw data` |
| 323 | frontend/data-api-and-adapters | flow | Entity colours are checked | apps/frontend/src/lib/api/base/universalDataProvider.ts | `entities: this.ensureColors(entities),` |
| 324 | frontend/data-api-and-adapters | flow | Question category colours are checked | apps/frontend/src/lib/api/base/universalDataProvider.ts | `categories: this.ensureColors(categories),` |
| 325 | frontend/data-api-and-adapters | fact | `SupabaseDataWriter` extends `UniversalDataWriter` | apps/frontend/src/lib/api/adapters/supabase/dataWriter/supabaseDataWriter.ts | `export class SupabaseDataWriter extends supabaseAdapterMixin(UniversalDataWriter) {` |
| 326 | frontend/data-api-and-adapters | fact | It uses Supabase Auth | apps/frontend/src/lib/api/adapters/supabase/dataWriter/supabaseDataWriter.ts | `Auth methods use Supabase GoTrue via` |
| 327 | frontend/data-api-and-adapters | fact | Sessions are kept in cookies | apps/frontend/src/lib/api/adapters/supabase/dataWriter/supabaseDataWriter.ts | `Cookie-based sessions are used` |
| 328 | frontend/data-api-and-adapters | flow | `logout` calls the logout route | apps/frontend/src/lib/api/base/universalDataWriter.ts | `url: UNIVERSAL_API_ROUTES.logout,` |
| 329 | frontend/data-api-and-adapters | flow | `preregisterWithIdToken` calls the preregister route | apps/frontend/src/lib/api/base/universalDataWriter.ts | `url: UNIVERSAL_API_ROUTES.preregister,` |
| 330 | frontend/data-api-and-adapters | fact | `preregisterWithIdToken` is a universal method | apps/frontend/src/lib/api/base/universalDataWriter.ts | `async preregisterWithIdToken(body: {` |
| 331 | frontend/data-api-and-adapters | flow | `exchangeCodeForIdToken` calls the token route | apps/frontend/src/lib/api/base/universalDataWriter.ts | `async exchangeCodeForIdToken(opts: {` |
| 332 | frontend/data-api-and-adapters | flow | `clearIdToken` calls the token route | apps/frontend/src/lib/api/base/universalDataWriter.ts | `async clearIdToken(): DWReturnType<DataApiActionResult> {` |
| 333 | frontend/data-api-and-adapters | flow | The token route is used by both | apps/frontend/src/lib/api/base/universalDataWriter.ts | `url: UNIVERSAL_API_ROUTES.token` |
| 334 | frontend/data-api-and-adapters | flow | The job methods call the job routes | apps/frontend/src/lib/api/base/universalDataWriter.ts | `url: UNIVERSAL_API_ROUTES.jobsActive,` |
| 335 | frontend/data-api-and-adapters | fact | `abortAllJobs` is a universal method | apps/frontend/src/lib/api/base/universalDataWriter.ts | `async abortAllJobs(): Promise<DataApiActionResult> {` |
| 336 | frontend/data-api-and-adapters | fact | `UNIVERSAL_API_ROUTES` | apps/frontend/src/lib/api/base/universalApiRoutes.ts | `export const UNIVERSAL_API_ROUTES = {` |
| 337 | frontend/data-api-and-adapters | fact | `SupabaseAdminWriter` extends `UniversalAdapter` through the mixin | apps/frontend/src/lib/api/adapters/supabase/adminWriter/supabaseAdminWriter.ts | `export class SupabaseAdminWriter extends supabaseAdapterMixin(UniversalAdapter) {` |
| 338 | frontend/data-api-and-adapters | flow | The job features build an admin writer from the job source | apps/frontend/src/lib/server/admin/features/condenseArguments.ts | `const adminWriter = createAdminWriter(jobSource);` |
| 339 | frontend/data-api-and-adapters | flow | The feedback writer inserts with the adapter's project id | apps/frontend/src/lib/api/adapters/supabase/feedbackWriter/supabaseFeedbackWriter.ts | `The table requires` |
| 340 | frontend/data-api-and-adapters | fact | The `anon_insert_feedback` policy gates the insert | apps/supabase/supabase/schema/302-rls.sql | `CREATE POLICY "anon_insert_feedback" ON public.feedback FOR INSERT TO anon` |
| 341 | frontend/data-api-and-adapters | fact | A rate-limit trigger gates the insert | apps/supabase/supabase/schema/107-feedback.sql | `Rate limiting trigger prevents spam` |
| 342 | frontend/data-api-and-adapters | flow | The `CandidateContext` wraps the data writer | apps/frontend/src/lib/contexts/candidate/candidateContext.svelte.ts | `return prepareDataWriter().register(...args);` |
| 343 | frontend/data-api-and-adapters | flow | The `AuthContext` wraps the data writer | apps/frontend/src/lib/contexts/auth/authContext.svelte.ts | `const dw = prepareDataWriter();` |
| 344 | frontend/data-api-and-adapters | flow | The `AdminContext` wraps the data writer | apps/frontend/src/lib/contexts/admin/adminContext.svelte.ts | `return prepareDataWriter().startJob(opts);` |
| 345 | frontend/data-api-and-adapters | flow | The `AdminContext` wraps the admin writer | apps/frontend/src/lib/contexts/admin/adminContext.svelte.ts | `return prepareAdminWriter().updateQuestion(opts);` |
| 346 | frontend/data-api-and-adapters | flow | The context data writer uses the `browser` arm | apps/frontend/src/lib/contexts/utils/prepareDataWriter.ts | `return createDataWriter({ fetch, browser: true });` |
| 347 | frontend/data-api-and-adapters | flow | The context admin writer uses the `browser` arm | apps/frontend/src/lib/contexts/utils/prepareAdminWriter.ts | `return createAdminWriter({ fetch, browser: true });` |
| 348 | frontend/data-api-and-adapters | fact | `UniversalAdapter` | apps/frontend/src/lib/api/base/universalAdapter.ts | `export abstract class UniversalAdapter {` |
| 349 | frontend/data-api-and-adapters | fact | It keeps the request's `fetch` | apps/frontend/src/lib/api/base/universalAdapter.ts | `readonly #fetch: Fetch;` |
| 350 | frontend/data-api-and-adapters | fact | The `get` helper | apps/frontend/src/lib/api/base/universalAdapter.ts | `async get<TParser extends ResponseParser` |
| 351 | frontend/data-api-and-adapters | fact | The `post` helper | apps/frontend/src/lib/api/base/universalAdapter.ts | `async post<TParser extends ResponseParser` |
| 352 | frontend/data-api-and-adapters | fact | The `put` helper | apps/frontend/src/lib/api/base/universalAdapter.ts | `async put<TParser extends ResponseParser` |
| 353 | frontend/data-api-and-adapters | fact | The `delete` helper | apps/frontend/src/lib/api/base/universalAdapter.ts | `async delete<TParser extends ResponseParser` |
| 354 | frontend/data-api-and-adapters | flow | `fetch` passes the URL unchanged | apps/frontend/src/lib/api/base/universalAdapter.ts | `const response = await this.#fetch(url, fullInit)` |
| 355 | frontend/data-api-and-adapters | flow | `fetch` adds a Bearer header for an `authToken` | apps/frontend/src/lib/api/base/universalAdapter.ts | `const fullHeaders = authToken ? addHeader(headers, 'Authorization',` |
| 356 | frontend/data-api-and-adapters | flow | `fetch` throws on a refusal | apps/frontend/src/lib/api/base/universalAdapter.ts | `if (isRefusedResponse(response)) {` |
| 357 | frontend/data-api-and-adapters | flow | The server data provider loads the local adapter for `'local'` | apps/frontend/src/lib/server/api/dataProvider.ts | `module = import('./adapters/local/dataProvider');` |
| 358 | frontend/data-api-and-adapters | flow | Otherwise nothing is loaded | apps/frontend/src/lib/server/api/dataProvider.ts | `module = Promise.resolve({});` |
| 359 | frontend/data-api-and-adapters | flow | The server feedback writer loads the local adapter for `'local'` | apps/frontend/src/lib/server/api/feedbackWriter.ts | `module = import('./adapters/local/feedbackWriter');` |
| 360 | frontend/data-api-and-adapters | fact | The default adapter type is `'supabase'` | packages/app-shared/src/settings/staticSettings.ts | `type: 'supabase',` |
| 361 | frontend/data-api-and-adapters | flow | The local provider reads `<collection>.json` from `LOCAL_DATA_DIR` | apps/frontend/src/lib/server/api/adapters/local/localPaths.ts | `[collection, path.join(constants.LOCAL_DATA_DIR,` |
| 362 | frontend/data-api-and-adapters | env | `LOCAL_DATA_DIR` is a private env variable | apps/frontend/src/lib/server/constants.ts | `LOCAL_DATA_DIR: env.LOCAL_DATA_DIR ?? '',` |
| 363 | frontend/data-api-and-adapters | flow | Feedback goes to the `feedbacks` subdirectory | apps/frontend/src/lib/server/api/adapters/local/localPaths.ts | `feedbacks: path.join(constants.LOCAL_DATA_DIR, 'feedbacks')` |
| 364 | frontend/data-api-and-adapters | flow | Each item is written as a file | apps/frontend/src/lib/server/api/adapters/local/localServerAdapter.ts | `await fs.writeFile(fp, data);` |
| 365 | frontend/data-api-and-adapters | fact | `GET /api/data/[collection]` | apps/frontend/src/routes/api/data/[collection]/+server.ts | `export async function GET({ params, url }) {` |
| 366 | frontend/data-api-and-adapters | fact | `POST /api/feedback` | apps/frontend/src/routes/api/feedback/+server.ts | `export async function POST({ request }) {` |
| 367 | frontend/data-api-and-adapters | flow | The data route errors without a server adapter | apps/frontend/src/routes/api/data/[collection]/+server.ts | `if (!dataProvider) error(500, 'No server data provider available');` |
| 368 | frontend/data-api-and-adapters | flow | The feedback route errors without a server adapter | apps/frontend/src/routes/api/feedback/+server.ts | `if (!feedbackWriter) error(500, 'No server feedback writer available');` |
| 369 | frontend/data-api-and-adapters | fact | `ApiRouteDataProvider` | apps/frontend/src/lib/api/adapters/apiRoute/dataProvider/apiRouteDataProvider.ts | `export class ApiRouteDataProvider extends apiRouteAdapterMixin(UniversalDataProvider) {` |
| 370 | frontend/data-api-and-adapters | fact | `ApiRouteDataFeedbackWriter` | apps/frontend/src/lib/api/adapters/apiRoute/feedbackWriter/apiRouteFeedbackWriter.ts | `export class ApiRouteDataFeedbackWriter extends apiRouteAdapterMixin(UniversalFeedbackWriter) {` |
| 371 | frontend/data-api-and-adapters | flow | The `apiRoute` adapters call the data route | apps/frontend/src/lib/api/adapters/apiRoute/apiRoutes.ts | `{API_ROOT}/data/` |
| 372 | frontend/data-api-and-adapters | flow | The `apiRoute` adapters call the feedback route | apps/frontend/src/lib/api/adapters/apiRoute/apiRoutes.ts | `{API_ROOT}/feedback` |
| 373 | frontend/data-api-and-adapters | flow | `createFeedbackWriter` always builds the Supabase writer | apps/frontend/src/lib/api/feedbackWriter.ts | `return new SupabaseFeedbackWriter(resolveAdapterConfig(source));` |
| 374 | frontend/data-api-and-adapters | flow | The root load reads app customization | apps/frontend/src/routes/+layout.ts | `dataProvider.getAppCustomization({ locale: lang })` |
| 375 | frontend/data-api-and-adapters | flow | The root load reads elections | apps/frontend/src/routes/+layout.ts | `dataProvider.getElectionData({ locale: lang }).catch((e) => e),` |
| 376 | frontend/data-api-and-adapters | flow | The root load reads constituencies | apps/frontend/src/routes/+layout.ts | `dataProvider.getConstituencyData({ locale: lang }).catch((e) => e)` |
| 377 | frontend/data-api-and-adapters | flow | The `(located)` load reads questions | apps/frontend/src/routes/(voters)/(located)/+layout.ts | `.getQuestionData({` |
| 378 | frontend/data-api-and-adapters | flow | The `(located)` load reads nominations | apps/frontend/src/routes/(voters)/(located)/+layout.ts | `.getNominationData({` |
| 379 | frontend/data-api-and-adapters | flow | The root layout writes elections through `setDataRoot` | apps/frontend/src/routes/+layout.svelte | `dr.provideElectionData(snapshot.electionData);` |
| 380 | frontend/data-api-and-adapters | flow | The root layout writes constituencies | apps/frontend/src/routes/+layout.svelte | `dr.provideConstituencyData(snapshot.constituencyData);` |
| 381 | frontend/data-api-and-adapters | flow | The `(located)` layout adds questions | apps/frontend/src/routes/(voters)/(located)/+layout.svelte | `dataRoot.provideQuestionData(questionData);` |
| 382 | frontend/data-api-and-adapters | flow | The `(located)` layout adds entities | apps/frontend/src/routes/(voters)/(located)/+layout.svelte | `dataRoot.provideEntityData(nominationData.entities);` |
| 383 | frontend/data-api-and-adapters | flow | The `(located)` layout adds nominations | apps/frontend/src/routes/(voters)/(located)/+layout.svelte | `dataRoot.provideNominationData(nominationData.nominations);` |
| 384 | frontend/data-api-and-adapters | fact | `DataRoot` comes from `@openvaa/data` | apps/frontend/src/lib/contexts/data/dataContext.svelte.ts | `import { DataRoot } from '@openvaa/data';` |
| 385 | frontend/data-api-and-adapters | fact | `matches` is a voter context value | apps/frontend/src/lib/contexts/voter/voterContext.type.ts | `matches: MatchTree;` |
| 386 | frontend/data-api-and-adapters | fact | The candidate's own data is in `userData` | apps/frontend/src/lib/contexts/candidate/candidateContext.type.ts | `userData: CandidateUserDataState;` |
| 387 | frontend/data-api-and-adapters | fact | `dataProvider.ts` re-exports the client factories | apps/frontend/src/lib/api/dataProvider.ts | `export { createSupabaseUniversalClient, SUPABASE_COOKIE_PREFIX } from '$lib/supabase/universal';` |
| 388 | frontend/data-api-and-adapters | path | `base/` holds the `DataProvider` interface | apps/frontend/src/lib/api/base/dataProvider.type.ts | - |
| 389 | frontend/data-api-and-adapters | path | `base/` holds the `DataWriter` interface | apps/frontend/src/lib/api/base/dataWriter.type.ts | - |
| 390 | frontend/data-api-and-adapters | path | `base/` holds the `FeedbackWriter` interface | apps/frontend/src/lib/api/base/feedbackWriter.type.ts | - |
| 391 | frontend/data-api-and-adapters | fact | `supabaseAdapterMixin` | apps/frontend/src/lib/api/adapters/supabase/supabaseAdapter.ts | `export function supabaseAdapterMixin<TBase extends Constructor>` |
| 392 | frontend/data-api-and-adapters | path | `utils/` holds the OIDC helpers | apps/frontend/src/lib/api/utils/auth/providers/idura.ts | - |
| 393 | frontend/data-api-and-adapters | path | `utils/` holds translation helpers | apps/frontend/src/lib/api/utils/translateQuestionTerms.ts | - |
| 394 | frontend/data-api-and-adapters | fact | `LocalServerDataProvider` | apps/frontend/src/lib/server/api/adapters/local/dataProvider/localServerDataProvider.ts | `export class LocalServerDataProvider extends LocalServerAdapter` |
| 395 | frontend/data-api-and-adapters | fact | `LocalServerFeedbackWriter` | apps/frontend/src/lib/server/api/adapters/local/feedbackWriter/localServerFeedbackWriter.ts | `export class LocalServerFeedbackWriter extends LocalServerAdapter` |
| 396 | frontend/data-api-and-adapters | fact | `LocalServerAdapter` is their base class | apps/frontend/src/lib/server/api/adapters/local/localServerAdapter.ts | `export abstract class LocalServerAdapter {` |
| 397 | frontend/data-api-and-adapters | path | Server route: `oidc/*` | apps/frontend/src/routes/api/oidc/token/+server.ts | - |
| 398 | frontend/data-api-and-adapters | path | Server route: `admin/jobs/*` | apps/frontend/src/routes/api/admin/jobs/active/+server.ts | - |
| 399 | frontend/components | path | The base component library | apps/frontend/src/lib/components | - |
| 400 | frontend/components | fact | `Button` is exported from its directory | apps/frontend/src/lib/components/button/index.ts | `export { default as Button } from './Button.svelte';` |
| 401 | frontend/components | path | `Modal` | apps/frontend/src/lib/components/modal/Modal.svelte | - |
| 402 | frontend/components | path | `Expander` | apps/frontend/src/lib/components/expander/index.ts | - |
| 403 | frontend/components | fact | A few base components read an app context | apps/frontend/src/lib/components/controller/InfoMessages.svelte | `const { t } = getAdminContext();` |
| 404 | frontend/components | path | The dynamic component library | apps/frontend/src/lib/dynamic-components | - |
| 405 | frontend/components | fact | `EntityCard` reads the app context | apps/frontend/src/lib/dynamic-components/entityCard/EntityCard.svelte | `const ctx = getAppContext();` |
| 406 | frontend/components | path | `EntityDetails` | apps/frontend/src/lib/dynamic-components/entityDetails/index.ts | - |
| 407 | frontend/components | fact | `QuestionHeading` is imported from `$lib/dynamic-components` | apps/frontend/src/routes/(voters)/(located)/questions/+layout.svelte | `import { QuestionHeading } from '$lib/dynamic-components/questionHeading';` |
| 408 | frontend/components | path | The candidate component library | apps/frontend/src/lib/candidate/components | - |
| 409 | frontend/components | fact | Candidate components are imported from `$candidate/components` | apps/frontend/src/lib/candidate/components/passwordSetter/PasswordSetter.svelte | `import { PasswordField } from '$candidate/components/passwordField';` |
| 410 | frontend/components | fact | `PasswordSetter` | apps/frontend/src/lib/candidate/components/passwordSetter/PasswordSetter.svelte | - |
| 411 | frontend/components | fact | `TermsOfUse` | apps/frontend/src/lib/candidate/components/termsOfUse/index.ts | `export { default as TermsOfUse } from './TermsOfUse.svelte';` |
| 412 | frontend/components | fact | Components are compiled in runes mode | apps/frontend/svelte.config.js | `return { runes: true };` |
| 413 | frontend/components | fact | Props come from one `$props()` destructuring | apps/frontend/src/lib/components/button/Button.svelte | `}: ButtonProps = $props();` |
| 414 | frontend/components | fact | The props type is imported from the type file | apps/frontend/src/lib/components/button/Button.svelte | `import type { ButtonProps } from './Button.type';` |
| 415 | frontend/components | fact | The props type extends the HTML attributes | apps/frontend/src/lib/components/button/Button.type.ts | `type ButtonBaseElementProps = HTMLAttributes<HTMLElement> & {` |
| 416 | frontend/components | fact | Named regions are `Snippet` props | apps/frontend/src/lib/components/button/Button.type.ts | `badge?: Snippet;` |
| 417 | frontend/components | fact | Snippets are rendered with `{@render}` | apps/frontend/src/lib/components/button/Button.svelte | `{@render badge?.()}` |
| 418 | frontend/components | flow | The rest props are spread with `concatClass` | apps/frontend/src/lib/components/button/Button.svelte | `{...concatClass(restProps, classes)}>` |
| 419 | frontend/components | fact | `concatClass` is in `$lib/utils/components` | apps/frontend/src/lib/utils/components.ts | `export function concatClass<TProps extends Record<string, any>>(props: TProps, classes: string) {` |
| 420 | frontend/components | fact | The caller's class wins a conflict | apps/frontend/src/lib/utils/components.ts | `so the caller wins a conflict` |
| 421 | frontend/components | fact | An ESLint rule bans `svelte/store` | apps/frontend/eslint.config.mjs | `name: 'svelte/store',` |
| 422 | frontend/components | fact | Components carry an `@component` comment | apps/frontend/src/lib/components/button/Button.svelte | `@component A component for buttons` |
| 423 | frontend/components | flow | The generator reads the `@component` comment | apps/docs/scripts/generate-component-docs.ts | `const match = content.match(/<!--\s*@component\s*([\s\S]*?)-->/i);` |
| 424 | frontend/components | flow | A component without one is skipped | apps/docs/scripts/generate-component-docs.ts | `No @component docstring in` |
| 425 | frontend/styling | fact | Tailwind is imported in `app.css` | apps/frontend/src/app.css | `@import 'tailwindcss';` |
| 426 | frontend/styling | fact | DaisyUI is loaded in `app.css` | apps/frontend/src/app.css | `@plugin 'daisyui' {` |
| 427 | frontend/styling | fact | The themes are defined in `app.css` | apps/frontend/src/app.css | `@plugin 'daisyui/theme' {` |
| 428 | frontend/styling | fact | The `@theme` scales are in `app.css` | apps/frontend/src/app.css | `@theme {` |
| 429 | frontend/styling | fact | Tailwind runs as a Vite plugin | apps/frontend/vite.config.ts | `tailwindcss(),` |
| 430 | frontend/styling | fact | The default spacing scale is cleared | apps/frontend/src/app.css | `--spacing-*: initial;` |
| 431 | frontend/styling | fact | The default text scale is cleared | apps/frontend/src/app.css | `--text-*: initial;` |
| 432 | frontend/styling | fact | The default radius scale is cleared | apps/frontend/src/app.css | `--radius-*: initial;` |
| 433 | frontend/styling | fact | The default font scale is cleared | apps/frontend/src/app.css | `--font-*: initial;` |
| 434 | frontend/styling | fact | The default transition scale is cleared | apps/frontend/src/app.css | `--transition-duration-*: initial;` |
| 435 | frontend/styling | fact | Named spacing `md` | apps/frontend/src/app.css | `--spacing-md: 0.625rem;` |
| 436 | frontend/styling | fact | Named spacing `lg` | apps/frontend/src/app.css | `--spacing-lg: 1.25rem;` |
| 437 | frontend/styling | fact | Numeric spacing `40` | apps/frontend/src/app.css | `--spacing-40: 2.5rem;` |
| 438 | frontend/styling | fact | Named text size `md` | apps/frontend/src/app.css | `--text-md: 0.9375rem;` |
| 439 | frontend/styling | fact | The colour-class safelist | apps/frontend/src/app.css | `@source inline(` |
| 440 | frontend/styling | fact | `tailwind-theme.css` references `app.css` | apps/frontend/src/tailwind-theme.css | `@reference "./app.css";` |
| 441 | frontend/styling | fact | A component style block references `tailwind-theme.css` | apps/frontend/src/lib/components/video/Video.svelte | `@reference "../../../tailwind-theme.css";` |
| 442 | frontend/styling | fact | The `light` theme | apps/frontend/src/app.css | `name: 'light';` |
| 443 | frontend/styling | fact | The `light` theme is the default | apps/frontend/src/app.css | `default: true;` |
| 444 | frontend/styling | fact | The `dark` theme follows the browser preference | apps/frontend/src/app.css | `prefersdark: true;` |
| 445 | frontend/styling | fact | Light `neutral` | apps/frontend/src/app.css | `--color-neutral: #333333;` |
| 446 | frontend/styling | fact | Light `primary` | apps/frontend/src/app.css | `--color-primary: #2546a8;` |
| 447 | frontend/styling | fact | Light `secondary` | apps/frontend/src/app.css | `--color-secondary: #666666;` |
| 448 | frontend/styling | fact | Light `warning` | apps/frontend/src/app.css | `--color-warning: #a82525;` |
| 449 | frontend/styling | fact | Light `error` | apps/frontend/src/app.css | `--color-error: #a82525;` |
| 450 | frontend/styling | fact | Light `base-100` | apps/frontend/src/app.css | `--color-base-100: #ffffff;` |
| 451 | frontend/styling | fact | Light `base-200` | apps/frontend/src/app.css | `--color-base-200: #e8f5f6;` |
| 452 | frontend/styling | fact | Light `base-300` | apps/frontend/src/app.css | `--color-base-300: #d1ebee;` |
| 453 | frontend/styling | fact | Light `primary-content` | apps/frontend/src/app.css | `--color-primary-content: #ffffff;` |
| 454 | frontend/styling | fact | `StaticSettings.colors` has the same light values | packages/app-shared/src/settings/staticSettings.ts | `primary: '#2546a8',` |
| 455 | frontend/styling | fact | `StaticSettings.colors` has the same dark values | packages/app-shared/src/settings/staticSettings.ts | `primary: '#6887e3',` |
| 456 | frontend/styling | flow | The `theme-color` meta tags read `StaticSettings.colors` | apps/frontend/src/routes/+layout.svelte | `<meta name="theme-color" content={staticSettings.colors.light['base-300']}` |
| 457 | frontend/styling | flow | The contrast check reads `StaticSettings.colors` | apps/frontend/src/lib/utils/color/ensureColors.ts | `const bg = staticSettings.colors?.light?.['base-300'] ?? 'd1ebee';` |
| 458 | frontend/styling | path | `color-test.txt` | apps/docs/src/routes/(content)/developers-guide/frontend/styling/color-test.txt | - |
| 459 | frontend/styling | fact | `z-10`: the navigation drawer | apps/frontend/src/lib/layouts/main/Layout.svelte | `<div class="drawer-side z-10">` |
| 460 | frontend/styling | fact | `z-10`: the drawer close button | apps/frontend/src/lib/components/modal/drawer/Drawer.svelte | `class="!absolute right-0 bottom-0 z-10" />` |
| 461 | frontend/styling | fact | `z-10`: the `Select` menu | apps/frontend/src/lib/components/select/Select.svelte | `menu mb-xl absolute top-6 left-0 z-10` |
| 462 | frontend/styling | fact | `z-10`: the `Term` tooltip | apps/frontend/src/lib/components/term/Term.svelte | `left-1/2 z-10` |
| 463 | frontend/styling | fact | `z-20`: the `Video` buttons | apps/frontend/src/lib/components/video/Video.svelte | `bottom-4 z-20 rounded-full` |
| 464 | frontend/styling | fact | `z-30`: the `Alert` | apps/frontend/src/lib/components/alert/Alert.svelte | `'alert fixed z-30` |
| 465 | frontend/styling | flow | The modal dialog is shown in the top layer | apps/frontend/src/lib/components/modal/ModalContainer.svelte | `modalContainer?.showModal();` |
| 466 | frontend/styling | fact | The base styling defaults | apps/frontend/src/app.css | `@layer base {` |

## Findings for todos

- **F1 — the `apiRoute` adapters are unwired.** `ApiRouteDataProvider` and `ApiRouteDataFeedbackWriter` (`apps/frontend/src/lib/api/adapters/apiRoute/`) are constructed nowhere outside two ESLint-guard fixtures: `git grep -n -E "ApiRouteDataProvider|ApiRouteDataFeedbackWriter" -- apps/frontend/src ':!apps/frontend/src/lib/api/adapters/apiRoute'` hits only `src/lib/_guards/eslint-adapter-singleton-guard.test.ts`. `createDataProvider` and `createFeedbackWriter` always return the Supabase adapters, so setting `staticSettings.dataAdapter.type` to `'local'` loads the server-side local adapter behind `/api/data/[collection]` and `/api/feedback` but nothing in the app calls those routes. `staticSettings.type.ts` still tells an operator to check `LOCAL_DATA_DIR` "when using the `local` adapter", which reads as if it switched the app's data source. Whether the local mode is meant to be restored or removed is UNCONFIRMED. Consistent with 168-04's Architecture wording.
- **F2 — theme colours are defined twice.** The DaisyUI themes in `apps/frontend/src/app.css` hard-code the palette; `StaticSettings.colors` (`packages/app-shared/src/settings/staticSettings.ts`) carries the same values but feeds only the `theme-color` meta tags (`routes/+layout.svelte`) and the contrast background in `lib/utils/color/ensureColors.ts`. Editing `staticSettings.ts` alone does not change the app's theme, while `CLAUDE.md` says the theme colours are defined in `staticSettings.ts`. The Styling page documents the two places. Whether one should be generated from the other is UNCONFIRMED.
- **F3 — `ROUTE_PARAMS` lists two unused parameters.** `entityType` and `entityId` are in `ROUTE_PARAMS` (`apps/frontend/src/lib/routes/params.ts`) but no route directory uses them (`git ls-files apps/frontend/src/routes | grep -E "\[entityType|\[entityId"` exits 1). The old Routing page used them as its route-parameter example; the page now uses `questionId` and the results segments. Whether they are dead is UNCONFIRMED (they may be read as query parameters somewhere).

## Sweep exceptions

None.
