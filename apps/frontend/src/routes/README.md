# Routes

> See also the online doc [Routing](https://openvaa.org/developers-guide/frontend/routing) (or [locally](/docs/src/routes/developers-guide/frontend/routing/+page.md))

This directory contains the SvelteKit route structure for the OpenVAA frontend application.

Locale handling is managed by Paraglide JS via the reroute hook in `src/hooks.ts`. Locale prefixes are added/stripped transparently.

- Voters app routes are in `(voters)/`
- Candidate app routes are in `candidate/`
- Protected candidate routes are in `candidate/(protected)/`

See the Routing documentation for detailed information.
