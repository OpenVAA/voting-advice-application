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

## Task 2 — the decision

Offered because Task 1 recorded `NAV_OVERVIEW_KEPT=no`. The operator chose in the main session;
the orchestrator stored the reply under attempt key `189-04-2`, attempt
`20261120T124525Z.addfc700f`. Checked by the executor before Task 3, both exit 0:

- `bash "$A" bound 189-04-2 OPERATOR_REPLY plan=189-04 task=2` (the line
  `OPERATOR_REPLY=received attempt=20261120T124525Z.addfc700f plan=189-04 task=2`)
- `bash "$A" has 189-04-2 '^answer_nav=generator-overview$'`

`A` is `.planning/workstreams/deployment/phases/183-terraform-foundation-and-supabase-as-code/tools/attempt.sh`.
The overview stays at `/developers-guide/deployment`, with no redirect stub and no inbound link change.

## Task 3 — the generator lists a section's own page as its Overview child

Docs unit tests before the change: 8 files, 37 tests, exit 0.

Red first (commit `204b1a89e`): three cases in `generate-navigation-config.test.ts`, with
`buildNavigationStructure` exported (TSDoc added) so the tests can build a discovered navigation.
Run: 2 failed, 38 passed. The two failures were the behaviours under test: a subsection with a
page got `deep` as its first child instead of Overview, and a config holding the Overview child
was written with `// Removed`. The third case (a subsection with no page of its own gets no
Overview child) passed before and after, as a guard against over-applying the change.

Green (commit `c7ce359f4`): `buildSubsectionChildren` starts a subsection's children with
`{ title: 'Overview', route: <the subsection route>, fixedTitle: true }` when `allRoutes` holds a
page at that route. 40 passed.

The first regeneration then put the new Overview child last in Deployment's children, after the
two children the config already listed, because `compareSection` appends every child it finds
new. A fourth case went red for that (commit `06de9125f`: 1 failed, 40 passed), and
`compareSection` now puts a new child whose route is the section's own route first. 41 passed.

Which sections the change reaches: a subsection with children and a page of its own. In this
tree that is Deployment alone. Configuration, Backend, Frontend, Localization, Contributing and
the other depth-2 sections have no page at their own route; `frontend/components` and
`frontend/routing` have a page, but their only subdirectories are generated copies that route
discovery excludes, so they stay items with no children.

Regeneration (generator, then Prettier from `apps/docs`):

- Run 1: exit 0, "✓ Added 1 new item(s)". `git diff --stat`: `1 file changed, 6 insertions(+)`, all
  in the Deployment entry: `// New` and the Overview child, first. No other section changed.
- Run 2: exit 0, "✓ No structural changes". The only change was the `// New` comment line removed.
- Run 3: exit 0, "✓ No structural changes"; `diff` against run 2's output exit 0.

The committed config is run 2's output; a run of the generator on it changes nothing.

NAV_IDEMPOTENT_AFTER=yes (the run on the committed config changed nothing; the run before it only removed the `// New` marker left by the run that added the child)

`git diff 3988f937c -- apps/docs/src/lib/navigation.config.ts`: the Analytics item under
Configuration, and Deployment turned into a section with Overview (`fixedTitle: true`, route
`/developers-guide/deployment`), Hosted Supabase settings and Operations. Nothing else.

`yarn workspace @openvaa/docs validate:links --check`: exit 0, Total findings 0.
`yarn workspace @openvaa/docs check`: 719 files, 0 errors, 0 warnings. ESLint and Prettier (from
`apps/docs`) clean on the generator, its test and the config.

NAV_DECISION=generator-overview
DOCS_UNIT_EXIT=0
DOCS_UNIT_DELTA=+4 (37 -> 41 tests, 8 files unchanged)
