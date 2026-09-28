# Routes

> See also the online doc [Routing](https://openvaa.org/developers-guide/frontend/routing) (or [locally](</apps/docs/src/routes/(content)/developers-guide/frontend/routing/+page.md>))

This directory contains the SvelteKit route structure for the OpenVAA frontend application.

Locale handling is managed by Paraglide JS via the reroute hook in `src/hooks.ts`. Locale prefixes are added/stripped transparently.

- Voters app routes are in `(voters)/`, with those requiring a selected election and constituency under `(voters)/(located)/`
- Candidate app routes are in `candidate/`, and the ones requiring a signed-in candidate under `candidate/(protected)/`
- Admin app routes are in `admin/`, and the ones requiring the `admin` role under `admin/(protected)/`
- Server endpoints are in `api/` — `api/admin/jobs/**` (job control, each guarded on the `admin` role), `api/auth/**`, `api/oidc/**` (the bank-authentication provider exchange), plus `api/candidate/preregister`, `api/data/[collection]`, `api/feedback` and `api/cache`

The only non-route file left directly in this directory is `+error.svelte`. The app
shell components that used to sit here now live outside the router's namespace, at
`$lib/layouts/main/`, behind the `$layouts` alias and a two-level barrel: `Layout.svelte`
(skip link, `<main>` landmark, drawer and menu), `Header.svelte`, `MainContent.svelte` /
`SingleCardContent.svelte` (the `<h1>` and the `[data-focus-on-nav]` post-navigation focus
target), `Banner.svelte` and `MaintenancePage.svelte`. Import them as
`import { MainContent } from '$layouts/main';` — the alias resolves identically from any
depth, and `$lib/layouts/tests/noRelativeLayoutImports.test.ts` fails the unit suite if a
relative path to one of them reappears. The post-login redirect-target validator that the two
login form actions share also lives outside this directory, at
`$lib/routes/loginRedirectTarget.ts`, alongside the route definitions.

## The `(protected)` groups are guarded against drift

The group segment is defined once, as `PROTECTED_GROUP` in `$lib/routes/route.ts`, and the two
group-prefix constants and both membership predicates are built from it. `$lib/routes/routeConsistency.test.ts`
runs in `yarn test:unit` and holds three things to that one definition: the pattern, this directory
tree, and the candidate auth handler in `src/hooks.server.ts`.

So, when you add a route under a `(protected)` directory, also add a `ROUTE` entry addressing it, or
the unit suite goes red naming the directory. When you remove one, remove its `ROUTE` entry too. And
decide route membership from `event.route.id` through `isCandidateRoute` / `isProtectedRoute`, never
from a substring or suffix test on `url.pathname` — a pathname carries the deployment's base path,
the locale prefix and resolved parameter values, so a substring test misfires under a path prefix
containing the word. Testing a served URL prefix with `startsWith`, as the handler's API skip does,
stays allowed.

See the Routing documentation for detailed information.
