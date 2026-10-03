# About these docs

This site is the OpenVAA documentation. Its pages, the scripts that generate some of them and the checks that guard them live in the [`apps/docs` workspace](https://github.com/OpenVAA/voting-advice-application/tree/main/apps/docs) (`@openvaa/docs`). The workspace [README](https://github.com/OpenVAA/voting-advice-application/blob/main/apps/docs/README.md) lists its files and scripts.

## How the site is built and published

- The site is a SvelteKit app. Most pages are Markdown files (`+page.md`) under `src/routes/(content)`, compiled by mdsvex. The [mdsvex options](https://github.com/OpenVAA/voting-advice-application/blob/main/apps/docs/mdsvex.config.js) add `rehype-slug`, which gives every heading an `id`, so a link can point at a section with `#anchor`. The landing page and the newsletter page are Svelte components.
- Every Markdown page uses the layout `src/lib/layouts/MdLayout.svelte`.
- The build uses `@sveltejs/adapter-static` and writes a single-page app to `build/`, with `404.html` as the fallback for every URL. No page is prerendered, so the build itself checks no links; the link check below does.
- The [Deploy Documentation workflow](https://github.com/OpenVAA/voting-advice-application/blob/main/.github/workflows/docs.yml) publishes the site to GitHub Pages. It runs on every push to `main` that changes `apps/docs/**`, and can be started by hand. It installs the dependencies, builds the shared packages, runs `generate:docs`, builds the site and deploys `apps/docs/build`. It does not run on pull requests.

To work on the site, start its dev server:

```bash
yarn workspace @openvaa/docs dev
```

The server listens on port 5174, which `apps/docs/vite.config.ts` sets, so it can run next to the frontend's dev server.

## Generated pages

Two parts of the Developers' Guide are generated from the frontend code: the [component pages](/developers-guide/frontend/components/generated) and the [route map](/developers-guide/frontend/routing/generated). Regenerate them with:

```bash
yarn workspace @openvaa/docs generate:docs
```

This runs `scripts/generate-all-docs-and-validate.ts` and then formats the workspace with Prettier. The script runs five steps in order and stops at the first one that fails:

1. `generate-component-docs.ts` reads the `@component` docstring of every Svelte component in the directories listed as `COMPONENT_DIRS` in `scripts/docs-scripts.config.ts`. It writes one page per component, with links to the component's source and type files and the README of its directory if there is one, and an index of all components.
2. `generate-route-map.ts` writes a map of the route directories under `apps/frontend/src/routes`.
3. `move-generated.ts` replaces `frontend/components/generated` and `frontend/routing/generated` in the Developers' Guide with the new output, so the page of a deleted component disappears.
4. `generate-navigation-config.ts` checks the navigation against the pages (see [Navigation](#navigation)).
5. `validate-links.ts` checks the links (see [Link check](#link-check)) and rewrites relative Markdown links as absolute ones.

The generated pages are committed, and the workflow regenerates them before every deployment. Never edit one by hand: change the component's docstring or its directory README, and regenerate. The first two steps can also run alone (`yarn workspace @openvaa/docs generate:component-docs` and `yarn workspace @openvaa/docs generate:route-map`), but their output only reaches the site through `generate:docs`.

## Navigation

The navigation is the tree in `src/lib/navigation.config.ts`. Its order is set by hand. Run the navigation generator to compare the tree with the pages under `src/routes`:

```bash
yarn workspace @openvaa/docs generate:navigation
```

- Each item's title is replaced with the first `#` heading of its page, unless the item sets `fixedTitle: true`. Renaming a page's H1 therefore renames its navigation item.
- A page that has no item gets one, marked with a `// New` comment.
- An item whose page is gone is dropped and leaves a `// Removed: <route>` comment.
- The generated component and route pages are not part of the navigation; the Components and Routing pages link to them.

To add a page, create its `+page.md` starting with the H1, run the generator, move the new item where it belongs, delete the `// New` comment and format the file. The tree is consistent when a second run changes nothing.

## Moved pages

When a page moves, its old URL keeps working through a redirect stub: a route directory that holds only a `+page.ts` like this one, which sends `/developers-guide/auto-documentation` here:

```ts
import { redirect } from '@sveltejs/kit';

export function load() {
  redirect(308, '/developers-guide/about-these-docs');
}
```

The site is a single-page app, so the redirect runs in the browser. Stubs are not in the navigation, and the site's own pages link to the new URL, never to a stub.

## Checks

| Command                                                                                  | What it checks                                                                                        |
| ---------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------- |
| `yarn workspace @openvaa/docs validate:links --check`                                    | Links, anchors, the navigation, redirect stubs and GitHub source links; see [Link check](#link-check) |
| `yarn workspace @openvaa/docs check:research-quotes --base <rev> --component-base <rev>` | That the research quotes are unchanged; see [Research quotes](#research-quotes)                       |
| `yarn workspace @openvaa/docs lint`                                                      | ESLint. The root `yarn lint:check` runs it too                                                        |
| `yarn workspace @openvaa/docs check`                                                     | svelte-check                                                                                          |
| `yarn workspace @openvaa/docs format:check`                                              | Prettier. The root `yarn format:check` runs it too                                                    |
| `yarn workspace @openvaa/docs lint:full`                                                 | Prettier and ESLint                                                                                   |
| `yarn workspace @openvaa/docs build`                                                     | The production build                                                                                  |

### Link check

`validate:links --check` reports findings without changing a file. It exits with 0 when there are none, 1 when there are, and 2 on a usage error. It has seven classes of finding:

| Class         | What must hold                                                                                                                                                     |
| ------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `md-link`     | Every internal Markdown link in a `.md` page resolves to a page or a static asset.                                                                                 |
| `svelte-href` | Every literal internal link in an `href` attribute (a value that starts with `/`) in a `.svelte` file, or in HTML inside a `.md` page, resolves.                   |
| `nav-route`   | Every leaf item of `navigation.config.ts` resolves to a page.                                                                                                      |
| `anchor`      | Every `#anchor` of an internal link names a heading `id` on the target page.                                                                                       |
| `stub`        | Every redirect stub redirects with a literal 301 or 308 to a page, not to another stub.                                                                            |
| `github-path` | Every GitHub source link (`https://github.com/OpenVAA/voting-advice-application/blob/main/<path>`, or `/tree/main/`) names a file or directory tracked by git.     |
| `inbound`     | Every reference to the site from a tracked file outside `apps/docs` (an `openvaa.org` URL with its anchor, or a repository path under `docs/src/routes`) resolves. |

In `--check` mode a link that lands on a redirect stub is also a finding. Two options narrow the report: `--only <class,…>` reports only the named classes, and `--scope <route>` (repeatable) reports only the findings in the page at that route; a route ending in `/**` includes every page below it. Without `--check`, as `generate:docs` runs it, the script also rewrites relative Markdown links as absolute ones.

### Research quotes

Some Publishers' Guide pages quote research in blocks of the `ResearchQuote` component. The quotes must stay exactly as they were written, so `check:research-quotes` compares every block, in order and character for character, with the blocks at the `--base` revision, and requires every page that had blocks to still import `ResearchQuote`. It also requires `ResearchQuote.svelte`, `ReferenceList.svelte` and `Author.svelte` to be unchanged since the `--component-base` revision, which defaults to `--base`. Edit the text around a block, never the block itself. With `--extract-dir <dir>` the script writes the blocks it compared to `rq-base.json` and `rq-head.json` in that directory.
