# 168-07 Claims Ledger — About these docs, the docs README, Contributing, About, landing, Publishers' Guide, generated set

Pages written or audited by plan 168-07, and one content-anchored row per command, script, file, port and flow the pages state.
`node .planning/phases/168-docs-site-rewrite-strapi-to-supabase/scripts/check-claims.mjs ledger` re-checks every `## Claims` row
with `git grep -F` of the quoted anchor in its anchor file (D-09). Anchors are copied from code or configuration at the execution
HEAD; README and CLAUDE.md prose is never an anchor.

Page keys used in the Claims table: `about-these-docs` (`/developers-guide/about-these-docs`), `docs-README` (`apps/docs/README.md`),
`generated` (the generator template text), `contributing/<page>`, `about/<page>`, `landing` (`/`), `pg/<path>` (Publishers' Guide
pages under `/publishers-guide/`).

## Page verdicts

| Old route | New route | Verdict | What changed | RQ |
| --- | --- | --- | --- | --- |
| `/developers-guide/auto-documentation` | redirect stub → `/developers-guide/about-these-docs` | merged → /developers-guide/about-these-docs | The three-sentence page ("partly automatically generated … see the README file in the package") is replaced by the pipeline description; the workspace link is kept. | 0 |
| `/developers-guide/about-these-docs` (168-02 moved H1, old body) | `/developers-guide/about-these-docs` | updated | Written from the docs workspace: SvelteKit + mdsvex (`rehype-slug`), the MdLayout, adapter-static SPA with the `404.html` fallback and no prerender, the Deploy Documentation workflow (push to `main` touching `apps/docs/**`, manual dispatch, not on PRs), the dev port from `vite.config.ts`, the five `generate:docs` steps plus Prettier, never hand-editing generated pages, how the navigation generator treats titles (`fixedTitle`), `// New` and `// Removed:` items, redirect stubs, the checks table, the seven link-check classes with `--check`/`--only`/`--scope`, and the research-quote check (`--base`, `--component-base`, `--extract-dir`). | 0 |
| `apps/docs/README.md` (not a route) | — | updated | The typedoc-era tree (`docs/`, `generated/`, `guides/`, `api/`, `copy-generated.ts`, `generate-docs.ts`), port 5173 and `cd docs` deployment are replaced by the real `scripts/` and `src/` tree, the 17-script table from `package.json`, port 5174 from `vite.config.ts`, the root `docs:*` shortcuts, the workflow and a pointer to About these docs. | 0 |
| `/developers-guide/frontend/components/generated/**`, `/developers-guide/frontend/routing/generated/**` | same | regenerated; EntityCardAction removed | Regenerated at the phase HEAD with the pruning generator (commit `78369e329`): the orphan `EntityCardAction` page deleted, `QuestionArguments` picks up its current docstring, the route map loses `api/cache` (removed in 167). Then the generator's template text was audited and tidied (commit `12d04f015`): the index names the three scanned directories and how to regenerate; Source links are labelled `Component` / `Types`; the embedded directory README sits under "Directory README" with a tree link and demoted headings (one H1 per page); the route-map intro names `apps/frontend/src/routes` and explains the group and parameter notation. Navigation unchanged. | 0 |

## Claims

| # | Page | Kind | Claim | Anchor file | Anchor |
| --- | --- | --- | --- | --- | --- |
| 1 | about-these-docs | path | The docs workspace is `apps/docs`, named `@openvaa/docs` | apps/docs/package.json | `"name": "@openvaa/docs"` |
| 2 | about-these-docs | fact | Markdown pages are compiled by mdsvex | apps/docs/svelte.config.js | `import { mdsvex } from 'mdsvex';` |
| 3 | about-these-docs | fact | The mdsvex options add `rehype-slug` | apps/docs/mdsvex.config.js | `rehypePlugins: [rehypeSlug],` |
| 4 | about-these-docs | fact | Every Markdown page uses MdLayout | apps/docs/svelte.config.js | `_: './src/lib/layouts/MdLayout.svelte'` |
| 5 | about-these-docs | fact | The build uses adapter-static | apps/docs/svelte.config.js | `import adapter from '@sveltejs/adapter-static';` |
| 6 | about-these-docs | fact | The SPA fallback is `404.html` | apps/docs/svelte.config.js | `fallback: '404.html',` |
| 7 | about-these-docs | fact | The build is written to `build/` | apps/docs/svelte.config.js | `pages: 'build',` |
| 8 | about-these-docs | fact | The landing page is a Svelte page | apps/docs/src/routes/+page.svelte | - |
| 9 | about-these-docs | fact | The newsletter page is a Svelte page | apps/docs/src/routes/(content)/about/newsletter/+page.svelte | - |
| 10 | about-these-docs | flow | The docs workflow runs on pushes to `main` | .github/workflows/docs.yml | `- main` |
| 11 | about-these-docs | flow | ... only when `apps/docs/**` changes | .github/workflows/docs.yml | `- "apps/docs/**"` |
| 12 | about-these-docs | flow | ... and can be started by hand | .github/workflows/docs.yml | `workflow_dispatch:` |
| 13 | about-these-docs | flow | The workflow installs dependencies | .github/workflows/docs.yml | `run: yarn install --frozen-lockfile` |
| 14 | about-these-docs | flow | The workflow builds the shared packages | .github/workflows/docs.yml | `run: yarn build` |
| 15 | about-these-docs | flow | The workflow runs `generate:docs` | .github/workflows/docs.yml | `yarn generate:docs` |
| 16 | about-these-docs | flow | The workflow deploys `apps/docs/build` | .github/workflows/docs.yml | `path: ./apps/docs/build` |
| 17 | about-these-docs | flow | The deploy target is GitHub Pages | .github/workflows/docs.yml | `uses: actions/deploy-pages@v4` |
| 18 | about-these-docs | command | `dev` starts the docs dev server | apps/docs/package.json | `"dev": "vite dev"` |
| 19 | about-these-docs | fact | The dev server port is 5174 | apps/docs/vite.config.ts | `server: { port: 5174 }` |
| 20 | about-these-docs | command | `generate:docs` runs the pipeline script and then formats | apps/docs/package.json | `"generate:docs": "tsx scripts/generate-all-docs-and-validate.ts && yarn format"` |
| 21 | about-these-docs | command | `format` is Prettier over the workspace | apps/docs/package.json | `"format": "prettier --write ."` |
| 22 | about-these-docs | flow | Step 1 generates the component pages | apps/docs/scripts/generate-all-docs-and-validate.ts | `await runCommand('tsx scripts/generate-component-docs.ts', 'Extracting component documentation');` |
| 23 | about-these-docs | flow | Step 2 generates the route map | apps/docs/scripts/generate-all-docs-and-validate.ts | `await runCommand('tsx scripts/generate-route-map.ts', 'Generating route map');` |
| 24 | about-these-docs | flow | Step 3 moves the generated pages | apps/docs/scripts/generate-all-docs-and-validate.ts | `await runCommand('tsx scripts/move-generated.ts', 'Moving generated files');` |
| 25 | about-these-docs | flow | Step 4 runs the navigation generator | apps/docs/scripts/generate-all-docs-and-validate.ts | `await runCommand('tsx scripts/generate-navigation-config.ts', 'Generating navigation configuration');` |
| 26 | about-these-docs | flow | Step 5 validates the links | apps/docs/scripts/generate-all-docs-and-validate.ts | `await runCommand('tsx scripts/validate-links.ts', 'Validating documentation links');` |
| 27 | about-these-docs | flow | A failing step stops the run (the error is rethrown and the process exits 1) | apps/docs/scripts/generate-all-docs-and-validate.ts | `throw error;` |
| 28 | about-these-docs | fact | The scanned component directories are `COMPONENT_DIRS` in the shared config | apps/docs/scripts/docs-scripts.config.ts | `export const COMPONENT_DIRS = [` |
| 29 | about-these-docs | fact | The generator reads `@component` docstrings | apps/docs/scripts/generate-component-docs.ts | `const match = content.match(/<!--\s*@component\s*([\s\S]*?)-->/i);` |
| 30 | about-these-docs | fact | A component page links the type file when there is one | apps/docs/scripts/generate-component-docs.ts | `- Types: [` |
| 31 | about-these-docs | fact | A component page embeds its directory README | apps/docs/scripts/generate-component-docs.ts | `## Directory README` |
| 32 | about-these-docs | fact | The route map covers the frontend's routes directory | apps/docs/scripts/docs-scripts.config.ts | `export const ROUTES_DIR = join(FRONTEND_ROOT, 'src', 'routes');` |
| 33 | about-these-docs | path | The components destination is `frontend/components/generated` | apps/docs/scripts/docs-scripts.config.ts | `dest: join(DEVELOPERS_GUIDE_DIR, 'frontend', 'components', 'generated'),` |
| 34 | about-these-docs | path | The route-map destination is `frontend/routing/generated` | apps/docs/scripts/docs-scripts.config.ts | `dest: join(DEVELOPERS_GUIDE_DIR, 'frontend', 'routing', 'generated'),` |
| 35 | about-these-docs | flow | `move-generated.ts` clears each destination before writing, so deleted components lose their page | apps/docs/scripts/move-generated.ts | `// Clear the destination so pages for deleted sources do not survive` |
| 36 | about-these-docs | flow | Without `--check`, `validate-links.ts` rewrites relative links as absolute | apps/docs/scripts/validate-links.ts | `default: also rewrites relative markdown links to absolute ones in place (run by` |
| 37 | about-these-docs | command | `generate:component-docs` runs the component generator alone | apps/docs/package.json | `"generate:component-docs": "tsx scripts/generate-component-docs.ts"` |
| 38 | about-these-docs | command | `generate:route-map` runs the route-map generator alone | apps/docs/package.json | `"generate:route-map": "tsx scripts/generate-route-map.ts"` |
| 39 | about-these-docs | fact | The standalone generators write to the intermediate `scripts/.temp` directory | apps/docs/scripts/docs-scripts.config.ts | `export const GENERATED_DIR = join(DOCS_ROOT, 'scripts', '.temp');` |
| 40 | about-these-docs | command | `generate:navigation` runs the navigation generator | apps/docs/package.json | `"generate:navigation": "tsx scripts/generate-navigation-config.ts"` |
| 41 | about-these-docs | path | The navigation tree is `src/lib/navigation.config.ts` | apps/docs/src/lib/navigation.config.ts | - |
| 42 | about-these-docs | fact | Titles are refreshed unless `fixedTitle` is true | apps/docs/src/lib/navigation.type.ts | `If set to true, the title won't be updated automatically based on the content when the navigation is generated.` |
| 43 | about-these-docs | fact | A page's title is its first `#` heading | apps/docs/scripts/utils/routes.ts | `const match = content.match(/^#\s+(.+)$/m);` |
| 44 | about-these-docs | fact | New items are marked `// New` | apps/docs/scripts/generate-navigation-config.ts | `// New` |
| 45 | about-these-docs | fact | Removed items are dropped and leave a `// Removed: <route>` comment | apps/docs/scripts/generate-navigation-config.ts | `return; // Don't include the actual item` |
| 46 | about-these-docs | fact | The generated directories are excluded from route discovery | apps/docs/scripts/utils/routes.ts | `// Build ignore patterns for all COPY_TARGETS destinations` |
| 47 | about-these-docs | fact | The Components page links the generated index | apps/docs/src/routes/(content)/developers-guide/frontend/components/+page.md | `(/developers-guide/frontend/components/generated)` |
| 48 | about-these-docs | fact | The Routing page links the route map | apps/docs/src/routes/(content)/developers-guide/frontend/routing/+page.md | `(/developers-guide/frontend/routing/generated)` |
| 49 | about-these-docs | flow | The quoted stub is the real `auto-documentation` stub | apps/docs/src/routes/(content)/developers-guide/auto-documentation/+page.ts | `redirect(308, '/developers-guide/about-these-docs');` |
| 50 | about-these-docs | fact | A stub may redirect with 301 or 308 only | apps/docs/scripts/utils/links.ts | `if (status !== '301' && status !== '308') return` |
| 51 | about-these-docs | command | `validate:links` runs the link check | apps/docs/package.json | `"validate:links": "tsx scripts/validate-links.ts"` |
| 52 | about-these-docs | command | `check:research-quotes` runs the research-quote check | apps/docs/package.json | `"check:research-quotes": "tsx scripts/check-research-quotes.ts"` |
| 53 | about-these-docs | command | `lint` is ESLint | apps/docs/package.json | `"lint": "eslint ."` |
| 54 | about-these-docs | flow | The root `lint:check` runs every workspace's `lint` | package.json | `"lint:check": "turbo run lint &&` |
| 55 | about-these-docs | command | `check` is svelte-check | apps/docs/package.json | `"check": "svelte-kit sync && svelte-check --tsconfig ./tsconfig.json"` |
| 56 | about-these-docs | command | `format:check` is a Prettier check | apps/docs/package.json | `"format:check": "prettier --check ."` |
| 57 | about-these-docs | flow | The root `format:check` runs the docs `format:check` | package.json | `prettier --check . && yarn workspace @openvaa/docs format:check` |
| 58 | about-these-docs | command | `lint:full` is Prettier and ESLint | apps/docs/package.json | `"lint:full": "prettier --check . && eslint ."` |
| 59 | about-these-docs | command | `build` is the production build | apps/docs/package.json | `"build": "vite build"` |
| 60 | about-these-docs | fact | `--check` reports without writing | apps/docs/scripts/validate-links.ts | `report only; no file is written, and a link that lands on a redirect stub is a finding` |
| 61 | about-these-docs | fact | Exit codes of the link check | apps/docs/scripts/validate-links.ts | `Exit codes: 0 no findings, 1 findings, 2 usage error.` |
| 62 | about-these-docs | fact | Class `md-link` | apps/docs/scripts/utils/links.ts | `'md-link',` |
| 63 | about-these-docs | fact | Class `svelte-href` | apps/docs/scripts/utils/links.ts | `'svelte-href',` |
| 64 | about-these-docs | fact | Class `nav-route` | apps/docs/scripts/utils/links.ts | `'nav-route',` |
| 65 | about-these-docs | fact | Class `anchor` | apps/docs/scripts/utils/links.ts | `'anchor',` |
| 66 | about-these-docs | fact | Class `stub` | apps/docs/scripts/utils/links.ts | `'stub',` |
| 67 | about-these-docs | fact | Class `github-path` | apps/docs/scripts/utils/links.ts | `'github-path',` |
| 68 | about-these-docs | fact | Class `inbound` | apps/docs/scripts/utils/links.ts | `'inbound'` |
| 69 | about-these-docs | fact | Inbound references are `openvaa.org` URLs and repository paths under `docs/src/routes` | apps/docs/scripts/utils/links.ts | `and repository paths under` |
| 70 | about-these-docs | fact | `--only` and `--scope` options | apps/docs/scripts/validate-links.ts | `} else if (flag === '--only' ` |
| 71 | about-these-docs | fact | A scope ending in `/**` includes the subtree | apps/docs/scripts/validate-links.ts | `a value ending in` |
| 72 | about-these-docs | fact | Blocks are compared in order as exact strings against `--base` | apps/docs/scripts/check-research-quotes.ts | `spans are compared as exact strings in order` |
| 73 | about-these-docs | fact | Pages that had blocks must still import ResearchQuote | apps/docs/scripts/check-research-quotes.ts | `const IMPORT = 'import ResearchQuote from';` |
| 74 | about-these-docs | fact | The three components must match the component base, which defaults to `--base` | apps/docs/scripts/check-research-quotes.ts | `which is` |
| 75 | about-these-docs | fact | `--extract-dir` writes `rq-base.json` and `rq-head.json` | apps/docs/scripts/check-research-quotes.ts | `await fs.writeFile(path.join(extractDir, 'rq-head.json')` |
| 76 | docs-README | command | `preview` serves the built site | apps/docs/package.json | `"preview": "vite preview"` |
| 77 | docs-README | command | `typecheck` is svelte-check | apps/docs/package.json | `"typecheck": "svelte-kit sync && svelte-check --tsconfig ./tsconfig.json"` |
| 78 | docs-README | command | `check:watch` is svelte-check in watch mode | apps/docs/package.json | `--watch"` |
| 79 | docs-README | command | Root shortcut `docs:dev` | package.json | `"docs:dev": "yarn workspace @openvaa/docs dev"` |
| 80 | docs-README | command | Root shortcut `docs:generate` | package.json | `"docs:generate": "yarn workspace @openvaa/docs generate:docs"` |
| 81 | docs-README | command | Root shortcut `docs:components` | package.json | `"docs:components": "yarn workspace @openvaa/docs generate:component-docs"` |
| 82 | docs-README | command | Root shortcut `docs:routes` | package.json | `"docs:routes": "yarn workspace @openvaa/docs generate:route-map"` |
| 83 | docs-README | flow | The root `format` runs the docs `format` | package.json | `prettier --write . && yarn workspace @openvaa/docs format` |
| 84 | docs-README | path | Script `check-research-quotes.ts` | apps/docs/scripts/check-research-quotes.ts | - |
| 85 | docs-README | path | Script `docs-scripts.config.ts` | apps/docs/scripts/docs-scripts.config.ts | - |
| 86 | docs-README | path | Script utils `links.ts` | apps/docs/scripts/utils/links.ts | - |
| 87 | docs-README | path | Script utils `routes.ts` | apps/docs/scripts/utils/routes.ts | - |
| 88 | docs-README | path | Landing page layout | apps/docs/src/routes/+layout.svelte | - |
| 89 | docs-README | path | Content group directory | apps/docs/src/routes/(content)/+layout.svelte | - |
| 90 | docs-README | path | Site components directory (holds ResearchQuote) | apps/docs/src/lib/components/ResearchQuote.svelte | - |
| 91 | docs-README | path | Navigation type file | apps/docs/src/lib/navigation.type.ts | - |
| 92 | docs-README | path | HTML template | apps/docs/src/app.html | - |
| 93 | docs-README | path | Static assets | apps/docs/static/favicon.png | - |
| 94 | docs-README | path | The mdsvex options module shared by the build and the link check | apps/docs/mdsvex.config.js | `The mdsvex options shared by the site build` |
| 95 | docs-README | path | ESLint config | apps/docs/eslint.config.js | - |
| 96 | docs-README | path | Prettier config | apps/docs/prettier.config.mjs | - |
| 97 | docs-README | path | Tailwind config | apps/docs/tailwind.config.mjs | - |
| 98 | docs-README | path | TypeScript config | apps/docs/tsconfig.json | - |
| 99 | generated | fact | The index intro sentence the components skill quotes is kept verbatim | apps/docs/scripts/generate-component-docs.ts | `This documentation is automatically generated from the` |
| 100 | generated | fact | The index names the scanned directories | apps/docs/scripts/generate-component-docs.ts | `It lists every component with such a docstring in` |
| 101 | generated | fact | Embedded README headings are demoted one level | apps/docs/scripts/generate-component-docs.ts | `function demoteHeadings(markdown: string): string {` |
| 102 | generated | fact | The route-map intro explains groups and parameters | apps/docs/scripts/generate-route-map.ts | `A name in parentheses is a route group, which adds no URL segment` |
| 103 | generated | fact | The orphan's component no longer exists: the `entityCard` barrel exports `EntityCard` only (no `EntityCardAction.svelte` is tracked) | apps/frontend/src/lib/dynamic-components/entityCard/index.ts | `export { default as EntityCard } from './EntityCard.svelte';` |

## Findings for todos

| # | Finding | Evidence (anchor file: anchor) | Disposition |
| --- | --- | --- | --- |
| F1 | `.claude/skills/components/SKILL.md` § "The component listing" still says that "several sibling `generate:*` scripts in `apps/docs/package.json` name files that do not exist; they are filed as a todo, not repaired here". 168-01.1 repaired them (`generate:component-docs` now runs the real generator). Its quote of the index intro is still accurate (the sentence was kept verbatim). | `apps/docs/package.json`: `"generate:component-docs": "tsx scripts/generate-component-docs.ts"` | Skill-text drift for 168-08 (or a skills pass); not a docs-site page. |
| F2 | `tsc -p apps/docs/scripts/tsconfig.json --noEmit` fails with `TS2307: Cannot find module 'unified'` inside `node_modules/mdsvex/dist/main.d.ts`; no gate runs that command (`check`, `lint`, `build` all pass). Pre-existing, not caused by this plan. | `apps/docs/scripts/validate-links.ts` imports through `utils/links.ts`; `apps/docs/scripts/tsconfig.json`: `"include": ["./**/*.ts"` | Out of scope; recorded for a tooling pass. |

## Sweep exceptions

| Page | Hit | Reason |
| --- | --- | --- |
