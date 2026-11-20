# 189-04 — the deployment subtree and the nav's Overview child (A-02, research Pitfall 1)

Measured 2026-11-20 on `feat/deployment-terraform-supabase`, HEAD `1329dd52e` before this plan.
Local tree only. Every generator run was `yarn workspace @openvaa/docs generate:navigation`,
followed by Prettier on the config.

Prettier note: the root `.prettierignore` lists `docs`, so `node_modules/.bin/prettier --write
apps/docs/src/lib/navigation.config.ts` run from the repository root skips the file
(`--file-info` prints `"ignored": true`) and leaves the generator's double quotes and tabs in
place. Run from `apps/docs`, the same binary (`../../node_modules/.bin/prettier --write
src/lib/navigation.config.ts`) applies `apps/docs/prettier.config.mjs`, which is what
`generate:docs` does through `yarn format`. Every Prettier step below was run that way.

## Task 1 — three pages, then the generator

Pages created, each a first `# ` heading and one paragraph:
`developers-guide/deployment/hosted-settings` (`# Hosted Supabase settings`),
`developers-guide/deployment/operations` (`# Operations`),
`developers-guide/configuration/analytics` (`# Analytics`). No `deployment/render` page.

NAV_FIRST_RUN=generator exit 0, "✓ Added 3 new item(s)"; after Prettier, `git diff --stat` of the config: `1 file changed, 18 insertions(+), 1 deletion(-)` — Analytics appended under Configuration, Deployment turned into a section with Hosted Supabase settings and Operations as children, each marked `// New`; nothing else changed

Second run, after adding `{ title: 'Overview', route: '/developers-guide/deployment', fixedTitle: true }`
as the first child of Deployment by hand: generator exit 0, "✓ Removed 1 item(s)". The generator
wrote, in the child's place:

```
          // Removed: /developers-guide/deployment
```

NAV_OVERVIEW_KEPT=no

As the reading of `compareSection` predicted (research assumption A5): the discovered children of
a section are only the routes one level below it, so a current child whose route is the section's
own route finds no discovered match and is written as a `// Removed:` line. The `// New` markers of
the first run were dropped by this run too.

Third run: generator exit 0, "✓ No structural changes"; the only change it made was to drop the
`// Removed: /developers-guide/deployment` comment line, which the loader does not carry (it
imports the config, so comments are not read). Fourth run: no change at all (`diff` exit 0).

NAV_IDEMPOTENT=no (third run removed the one `// Removed:` comment line left by the second run and changed no entry; the fourth run changed nothing)

The config is left as the generator wrote it after the fourth run: Deployment has the two children
and no Overview, so `/developers-guide/deployment` is a `<details><summary>` with no link in the
nav (`NavigationItem.svelte`, the `hasChildren` branch). Task 2 decides how it stays reachable.

`yarn workspace @openvaa/docs validate:links --check`: Total findings 0 (md-link, svelte-href,
nav-route, anchor, stub, github-path and inbound all 0).

NAV_VALIDATE_EXIT=0

The link check passes because the deployment page is still a known route with inbound links; it
does not check that a nav item with children links to its own page.
