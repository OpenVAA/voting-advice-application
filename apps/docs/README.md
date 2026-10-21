# OpenVAA documentation site

The `@openvaa/docs` workspace is the OpenVAA documentation site: a SvelteKit app whose pages are mostly Markdown, compiled with mdsvex and published to GitHub Pages. The component pages and the route map of the Developers' Guide are generated from the frontend code.

How the site is built, generated, checked and published is described on the site itself, in [About these docs](https://openvaa.org/developers-guide/about-these-docs) (source: [`src/routes/(content)/developers-guide/about-these-docs/+page.md`](<src/routes/(content)/developers-guide/about-these-docs/+page.md>)).

## Directory structure

```
apps/docs/
├── scripts/                              # Generation and check scripts (run with tsx)
│   ├── generate-all-docs-and-validate.ts # The generate:docs pipeline
│   ├── generate-component-docs.ts        # Component pages from @component docstrings
│   ├── generate-route-map.ts             # Route map of apps/frontend/src/routes
│   ├── move-generated.ts                 # Moves the generated pages into src/routes
│   ├── generate-navigation-config.ts     # Checks navigation.config.ts against the pages
│   ├── validate-links.ts                 # The link check
│   ├── check-research-quotes.ts          # The research-quote check
│   ├── docs-scripts.config.ts            # Directories and URLs the scripts share
│   └── utils/                            # links.ts, routes.ts
├── src/
│   ├── routes/
│   │   ├── +page.svelte                  # Landing page
│   │   ├── +layout.svelte
│   │   └── (content)/                    # about/, developers-guide/, publishers-guide/
│   ├── lib/
│   │   ├── components/                   # Site components (navigation, ResearchQuote, …)
│   │   ├── layouts/MdLayout.svelte       # Layout of every Markdown page
│   │   ├── navigation.config.ts          # The navigation tree
│   │   └── navigation.type.ts
│   └── app.html
├── static/                               # favicon and images
├── mdsvex.config.js                      # mdsvex options shared by the build and the link check
├── svelte.config.js                      # adapter-static, 404.html fallback
├── vite.config.ts                        # Dev server port
└── eslint.config.js, prettier.config.mjs, tailwind.config.mjs, tsconfig.json
```

The generated pages live in `src/routes/(content)/developers-guide/frontend/components/generated/` and `src/routes/(content)/developers-guide/frontend/routing/generated/`. They are committed; never edit them by hand.

## Scripts

Run them from the repository root with `yarn workspace @openvaa/docs <script>`.

| Script                    | What it does                                                                                                       |
| ------------------------- | ------------------------------------------------------------------------------------------------------------------ |
| `dev`                     | Starts the dev server on port 5174 (`server.port` in `vite.config.ts`)                                             |
| `build`                   | Builds the static site into `build/`                                                                               |
| `preview`                 | Serves the built site                                                                                              |
| `generate:docs`           | Regenerates the component pages and the route map, checks the navigation and the links, then formats the workspace |
| `generate:component-docs` | Writes the component pages into `scripts/.temp` (only `generate:docs` moves them into the site)                    |
| `generate:route-map`      | Writes the route map into `scripts/.temp` (only `generate:docs` moves it into the site)                            |
| `generate:navigation`     | Compares `src/lib/navigation.config.ts` with the pages and updates titles and items                                |
| `validate:links`          | Checks the links; with `--check` it only reports (`--only <class,…>`, `--scope <route>`)                           |
| `check:research-quotes`   | Checks that the research quotes are unchanged (`--base <rev>`, `--component-base <rev>`)                           |
| `lint`                    | ESLint (part of the root `yarn lint:check`)                                                                        |
| `lint:full`               | Prettier check and ESLint                                                                                          |
| `check`, `typecheck`      | svelte-check                                                                                                       |
| `check:watch`             | svelte-check in watch mode                                                                                         |
| `format`, `format:check`  | Prettier (the root `yarn format` and `yarn format:check` run them too)                                             |

The root `package.json` has shortcuts: `yarn docs:dev`, `yarn docs:generate`, `yarn docs:components` and `yarn docs:routes`.

## Typical workflow

```bash
yarn workspace @openvaa/docs dev            # write or edit pages
yarn workspace @openvaa/docs generate:docs  # after frontend component or route changes
yarn workspace @openvaa/docs validate:links --check
yarn workspace @openvaa/docs build
```

## Deployment

The [Deploy Documentation workflow](../../.github/workflows/docs.yml) runs on every push to `main` that changes `apps/docs/**`, and can be started by hand. It installs the dependencies, builds the shared packages, runs `generate:docs`, builds the site and deploys `apps/docs/build` to GitHub Pages.
