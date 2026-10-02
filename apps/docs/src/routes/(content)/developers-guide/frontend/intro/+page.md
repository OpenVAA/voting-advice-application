# Frontend overview

The frontend is the `@openvaa/frontend` workspace in [`apps/frontend`](https://github.com/OpenVAA/voting-advice-application/tree/main/apps/frontend). It is one SvelteKit application that serves three apps: the Voter App, the Candidate App and the Admin App.

## Stack

- **SvelteKit**, built into a Node server with `@sveltejs/adapter-node`.
- **Svelte 5 with runes.** [`svelte.config.js`](https://github.com/OpenVAA/voting-advice-application/blob/main/apps/frontend/svelte.config.js) sets `runes: true` in `compilerOptions`, and its `vitePlugin.dynamicCompileOptions` returns `runes: true` for every file whose path does not include `node_modules`. Every component and `.svelte.ts` module in the app is therefore compiled in runes mode: props come from `$props()`, state from `$state` and `$derived`, and content is passed as snippets. See [Components](/developers-guide/frontend/components).
- **Tailwind CSS and DaisyUI**, both configured in `src/app.css`. See [Styling](/developers-guide/frontend/styling).
- **Paraglide** for localization, compiled by its Vite plugin. See [Localization](/developers-guide/localization/intro).
- **Supabase** as the backend, reached through `@supabase/ssr` clients. See [Data API and adapters](/developers-guide/frontend/data-api-and-adapters).
- **Vitest** for unit tests.

The exact versions are in the workspace's [`package.json`](https://github.com/OpenVAA/voting-advice-application/blob/main/apps/frontend/package.json) and in the catalog in [`.yarnrc.yml`](https://github.com/OpenVAA/voting-advice-application/blob/main/.yarnrc.yml).

SvelteKit reads its environment from the repo-root `.env`, because `kit.env.dir` in `svelte.config.js` points there. See [Environment variables](/developers-guide/configuration/environmental-variables).

## Path aliases

Besides SvelteKit's own `$lib` (`src/lib`), `svelte.config.js` defines three aliases:

| Alias        | Directory           |
| ------------ | ------------------- |
| `$types`     | `src/lib/types`     |
| `$candidate` | `src/lib/candidate` |
| `$layouts`   | `src/lib/layouts`   |

Everything else in `src/lib` is imported through `$lib`, for example `$lib/contexts/voter` or `$lib/routes`.

## Key directories

In `apps/frontend/src/lib`:

- `api/`: the data API that layouts, pages and contexts use. It holds the data provider, the data, admin and feedback writers, and their adapters. See [Data API and adapters](/developers-guide/frontend/data-api-and-adapters).
- `server/`: code that only runs on the server: the server-side data API with the local adapter, the Admin App's job features and the private constants.
- `supabase/`: the Supabase client factories: `createSupabaseServerClient`, `createSupabaseBrowserClient`, `createSupabaseAnonClient` and the client for Admin App jobs.
- `contexts/`: the Svelte contexts through which components read data and state. See [Contexts](/developers-guide/frontend/contexts).
- `components/`, `dynamic-components/` and `candidate/components/`: the three component libraries. See [Components](/developers-guide/frontend/components).
- `layouts/`: the app shell (`Layout`, `Header`, `MainContent` and the rest), imported from `$layouts/main`.
- `routes/`: the route keys, the route builder and the app gates, imported from `$lib/routes`. See [Routing](/developers-guide/frontend/routing).
- `i18n/`: the `t()` wrapper and the runtime translation overrides. See [Localization](/developers-guide/localization/intro).
- `paraglide/`: the compiled Paraglide messages and runtime. This directory is generated and is not committed.
- `auth/`, `admin/`, `cookies/`, `types/` and `utils/`: authentication helpers, Admin App components and utilities, cookie helpers, shared types and general utilities.

Elsewhere in `apps/frontend`:

- `src/routes/`: the SvelteKit routes.
- `src/hooks.server.ts`, `src/hooks.ts` and `src/hooks.client.ts`: the SvelteKit hooks.
- `src/app.css`: the Tailwind and DaisyUI configuration and the global styles.
- `messages/`, `project.inlang/` and `paraglide.options.ts`: the message catalogue and the Paraglide configuration.

## Request hooks

[`hooks.server.ts`](https://github.com/OpenVAA/voting-advice-application/blob/main/apps/frontend/src/hooks.server.ts) runs three handlers in sequence on every request:

1. `supabaseHandle` creates a Supabase server client for the request, with cookie-based auth. It puts the client on `event.locals` together with `safeGetSession`, which verifies the access token once per request.
2. `paraglideHandle` runs Paraglide's middleware, sets `event.locals.currentLocale`, and fills the `%lang%` and `%projectId%` placeholders in `app.html`.
3. `appGateHandle` matches the route id against the app gates in `$lib/routes`. It redirects a signed-in user away from a gated app's login page, and a user without a session away from the app's `(protected)` routes. It is a session gate, not a role gate: each app's protected layout decides whether the user may use the app.

[`hooks.ts`](https://github.com/OpenVAA/voting-advice-application/blob/main/apps/frontend/src/hooks.ts) defines `reroute`, which removes the locale from the URL with Paraglide's `deLocalizeUrl`. This is why no route has a locale segment. See [Locale resolution](/developers-guide/localization/locale-resolution).

Both `hooks.server.ts` and `hooks.client.ts` also set the shared logger's level from `PUBLIC_LOG_LEVEL`.

## The three apps

| App           | Route root              | Routes with an extra condition                                                                         |
| ------------- | ----------------------- | ------------------------------------------------------------------------------------------------------ |
| Voter App     | `src/routes/(voters)/`  | `(voters)/(located)/` redirects to the selection pages until elections and constituencies are selected |
| Candidate App | `src/routes/candidate/` | `candidate/(protected)/` needs a signed-in session                                                     |
| Admin App     | `src/routes/admin/`     | `admin/(protected)/` needs a signed-in session                                                         |
| Server routes | `src/routes/api/`       | Each endpoint makes its own checks                                                                     |

See [Routing](/developers-guide/frontend/routing), the Candidate App pages, starting with [Pre-registration and invitation](/developers-guide/candidate-app/pre-registration-and-invitation), and the [Admin app](/developers-guide/admin-app).

## Workspace scripts

From the repo root, `yarn dev` starts the whole development stack. See [Running the development environment](/developers-guide/development/running-the-development-environment). The frontend's own scripts are:

- `yarn workspace @openvaa/frontend dev`: the Vite dev server only.
- `yarn workspace @openvaa/frontend build`: a production build into `build/`.
- `yarn workspace @openvaa/frontend check`: `svelte-check`, failing on warnings.
- `yarn workspace @openvaa/frontend test:unit`: the Vitest unit tests.
- `yarn workspace @openvaa/frontend paraglide:compile`: compiles the messages into `src/lib/paraglide/` without a build.

## Frontend pages

- [Routing](/developers-guide/frontend/routing)
- [Contexts](/developers-guide/frontend/contexts)
- [Data API and adapters](/developers-guide/frontend/data-api-and-adapters)
- [Components](/developers-guide/frontend/components)
- [Styling](/developers-guide/frontend/styling)
