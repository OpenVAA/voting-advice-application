# Routes

> See also the online doc [Routing](https://openvaa.org/developers-guide/frontend/routing) (or [locally](</apps/docs/src/routes/(content)/developers-guide/frontend/routing/+page.md>))

This directory contains the SvelteKit route structure for the OpenVAA frontend application.

Locale handling is managed by Paraglide JS via the reroute hook in `src/hooks.ts`. Locale prefixes are added/stripped transparently.

- Voters app routes are in `(voters)/`, with those requiring a selected election and constituency under `(voters)/(located)/`
- Candidate app routes are in `candidate/`, and the ones requiring a signed-in candidate under `candidate/(protected)/`
- Admin app routes are in `admin/`, and the ones requiring the `admin` role under `admin/(protected)/`
- Server endpoints are in `api/` — `api/admin/jobs/**` (job control, each guarded on the `admin` role), `api/auth/**`, `api/oidc/**` (the bank-authentication provider exchange), plus `api/candidate/preregister`, `api/data/[collection]`, `api/feedback` and `api/cache`

The files directly in this directory are the app shell rather than routes:
`Layout.svelte` (skip link, `<main>` landmark, drawer and menu), `Header.svelte`,
`MainContent.svelte` / `SingleCardContent.svelte` (the `<h1>` and the
`[data-focus-on-nav]` post-navigation focus target), `Banner.svelte`,
`MaintenancePage.svelte` and `+error.svelte`. `loginRedirectTarget.ts` is shared
by the two login form actions and is not routable.

See the Routing documentation for detailed information.
