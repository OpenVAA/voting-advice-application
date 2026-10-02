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
| `/developers-guide/contributing/ai-agents` | same | updated | "Agent information is only provided for Claude in CLAUDE.md" widened to the three sources that exist (CLAUDE.md, `.claude/skills`, `.agents/code-review-checklist.md`); the trigger list now names the four events `claude.yml` listens to, the access rule is "write, maintain or admin access" (the workflow's permission check) instead of "repository member", and the two hand-startable workflows are mentioned. | 0 |
| `/developers-guide/contributing/code-style-guide` | same | updated | URL and the headings `Comments` / `Svelte components` kept (the PR checklist links both anchors). The Svelte 4 note, every `export let` / `$$Props` / `$$restProps` example and the dead `IconBase` links are replaced by the runes-era conventions from the code: runes forced by `svelte.config.js`, the `svelte/store` ESLint ban, the third component library (`$candidate/components`), `$props()` typed by a co-located `.type.ts` with defaults in the destructuring and `$derived` instead of reassignment, `HeroEmoji` as it is now, attribute order before the spread, `concatClass` (tailwind-merge, caller wins), renaming dashed attributes in the destructuring, snippets with `{@render}` (Button's `badge`), `Snippet Props` instead of `Slots` in the docstring, `Button` as the documentation example, and the Svelte 5 FAQ link. Three typos fixed. | 0 |
| `/developers-guide/contributing/contribute` | same | updated | `#commit-your-update` heading kept. Corrected: `.vscode` and `.idea` ARE in the project's `.gitignore` (the page said they were not). The self-review link now has no trailing slash before the anchor. | 0 |
| `/developers-guide/contributing/issues` | same | updated | Audited; editorial (labels, milestones) left as written. One typo fixed ("Fox example"). | 0 |
| `/developers-guide/contributing/pull-request` | same | updated | `#self-review` heading kept. "pull requested template" → "pull request template"; the self-link to the checklist is a same-page `#self-review`; three cross-page anchor links lose the trailing slash before `#`. Checklist content unchanged. | 0 |
| `/developers-guide/contributing/recommended-ide-settings-code` | same | updated | "Pretter" typo fixed; the Git Graph link pointed at the ESLint extension and now points at Git Graph (`mhutchie.git-graph`). | 0 |
| `/developers-guide/contributing/workflows` | same | updated | The one-paragraph page is rewritten from `main.yaml`, `docs.yml`, `release.yml` and the Claude workflows: triggers and `paths-ignore`, the twelve `main.yaml` jobs with what each runs, and the three other workflow groups. | 0 |
| `/about/association` | same | updated | Audited; operator-authored contact and board data left as written. One typo fixed ("It's purpose"). | 0 |
| `/about/features` | same | updated | Code-proven status changes only (D-05): multiple-item text and number opinion questions marked available (no longer "to be added"), boolean added as an opinion type, the locale list extended to the seven compiled locales with the three default ones named, the `csv` import/export bullet removed (`git grep -i csv` finds no code outside binary assets), and the local static-data version marked partial (the server-side adapter exists but `createDataProvider` always returns the Supabase provider). During the Publishers' Guide audit (Task 3) two more were marked not yet available in the application: real-time top results while answering (no code in the frontend) and voter-set statement weights (the matching algorithm accepts `questionWeights`, the frontend never passes them). Preference order stays "to be added" (still a TODO in `@openvaa/data`). Two typos fixed. Everything else left as written. | 0 |
| `/about/intro` | same | current | Audited; no change. | 0 |
| `/about/newsletter` | same | current | Audited (Mailchimp form, Svelte page); no change. | 0 |
| `/about/project` | same | updated | Audited; the project history and plans are left as written (operator-authored). Four typos fixed (a missing "focus", "orgnasations", "pespective", "Ín"). | 0 |
| `/about/roadmap` | same | updated | "Update to Svelte 5" marked "(completed)" (runes forced in `svelte.config.js`). The other plans and the Strapi history line left as written (sweep exception). | 0 |
| `/about/rules` | same | current | Audited (Finnish association rules); no change. | 0 |
| `/` (landing `+page.svelte`) | same | current | Audited: the `0.1 Shiba` release matches the frontend's `0.1.0`, every internal `href` resolves (`svelte-href` class), and the feature and project text matches the code. The showcase links are external. No change. | 0 |
| `/publishers-guide/after-publishing-the-vaa/intro` | same | current | Audited; editorial guidance only; no change. | 0 |
| `/publishers-guide/after-publishing-the-vaa/marketing` | same | current | Audited; editorial guidance only; no change. | 0 |
| `/publishers-guide/after-publishing-the-vaa/user-support` | same | current | Audited; editorial guidance only; no change. | 0 |
| `/publishers-guide/data-collection/additional-data-for-the-voter` | same | current | Audited; editorial checklist; no change. | 0 |
| `/publishers-guide/data-collection/candidates-or-parties-answers` | same | current | Audited; editorial; no change. | 0 |
| `/publishers-guide/data-collection/data-from-final-election-lists` | same | updated | Audited; one typo fixed ("election numbers of symbols" → "or symbols"). | 0 |
| `/publishers-guide/data-collection/initial-data` | same | updated | Audited; one missing word restored ("you will need to provide the data below"). | 0 |
| `/publishers-guide/data-collection/intro` | same | current | Audited; editorial; no change. | 0 |
| `/publishers-guide/data-collection/moderation-of-candidate-answers` | same | current | Audited; the open-answer fact matches the code (answers can carry a free-form explanation); no change. | 0 |
| `/publishers-guide/intro` | same | current | Audited; no change. | 0 |
| `/publishers-guide/other-information-sources` | same | current | Audited; external references; no change. | 0 |
| `/publishers-guide/preparing/candidates-and-parties-data-be` | same | updated | Email-based registration now describes the invitation flow as the code has it (the candidate is sent an invitation email, sets a password and logs in) instead of "signing up with their email". Bank-authentication storage (full name, birth date), the FAQ page and the editorial guidance checked and kept. | 0 |
| `/publishers-guide/preparing/intro` | same | current | Audited prose outside the one ResearchQuote block; no change. Block and import untouched. | 1 |
| `/publishers-guide/preparing/languages-will-the-vaa-be` | same | current | Audited; the translations folder link (`apps/frontend/messages`) and the Supported locales link resolve; no change. | 0 |
| `/publishers-guide/preparing/matching` | same | updated | Prose outside the four ResearchQuote blocks only: the distance metric is fixed to Manhattan in the app (other metrics need a source-code change), only candidates are hidden for missing answers (parties are always included), and empty candidate answers ARE penalised as maximally distant (`RelativeMaximum`). Blocks and import untouched (span gate exit 0). | 4 |
| `/publishers-guide/preparing/the-application-be-hosted` | same | updated | "You may opt for a static website with no separate database" is not possible with the code at HEAD (the app always reads from Supabase); replaced with that fact and a link to Deployment. | 0 |
| `/publishers-guide/preparing/the-specifics-of-the-elections` | same | current | Audited prose outside the two ResearchQuote blocks (election selection, hierarchical constituencies, alliances match the settings and data model); no change. | 2 |
| `/publishers-guide/preparing/the-statements-or-questions-posed` | same | updated | Prose outside the six ResearchQuote blocks only: the answer-type paragraph adds that yes/no and numeric (min/max) questions can also be used in matching. Blocks and import untouched. | 6 |
| `/publishers-guide/preparing/the-vaa-look-and-feel` | same | current | Audited; the listed customisations exist (logo and poster in App customization, colours and font in static settings, text overrides); no change. | 0 |
| `/publishers-guide/preparing/the-voter-see-when-using` | same | updated | Prose outside the eight ResearchQuote blocks only: statement weights and real-time top results are marked "not yet available" in the process list and their sections (no frontend code for either; the matching algorithm supports weights). Everything else (category intros and selection, results link, sections, card contents, top-3 sub-cards, details tabs) matches the settings. Blocks and import untouched. | 8 |
| `/publishers-guide/preparing/timeline` | same | current | Audited; editorial; no change. | 0 |
| `/publishers-guide/preparing/to-ask-voters-to-give` | same | current | Audited; the rating feedback form and the configurable results-page delay (`results.showFeedbackPopup`) match the code; no change. | 0 |
| `/publishers-guide/preparing/to-offer-a-survey-for` | same | current | Audited; matches the `survey` settings (`linkTemplate`, `showIn`); no change. | 0 |
| `/publishers-guide/preparing/what-data-should-be-collected` | same | current | Audited; no tracking by default (`analytics.trackEvents: false`), the consent prompt (`DataConsent`) and the Umami adapter match the code; no change. | 0 |
| `/publishers-guide/preparing/what-other-information-is-collected` | same | current | Audited prose outside the one ResearchQuote block; no change. | 1 |
| `/publishers-guide/preparing/who-is-the-target-group` | same | current | Audited; editorial; no change. | 0 |
| `/publishers-guide/publish-with-openvaa` | same | current | Audited; the `#contact` anchor on Association resolves; no change. | 0 |
| `/publishers-guide/what-are-vaas/intro` | same | current | Audited; research text with `Author` and `ReferenceList` (frozen components); no change. | 0 |
| `/publishers-guide/what-are-vaas/vaas-used` | same | current | Audited; editorial; no change. | 0 |

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
| 104 | contributing/code-style-guide | fact | Runes mode is forced for files outside `node_modules` | apps/frontend/svelte.config.js | `if (!filename.includes('node_modules')) {` |
| 105 | contributing/code-style-guide | fact | ESLint bans `svelte/store` | apps/frontend/eslint.config.mjs | `name: 'svelte/store',` |
| 106 | contributing/code-style-guide | fact | ... across `src/**` | apps/frontend/eslint.config.mjs | `files: ['src/**/*.{ts,js,mjs,cjs,svelte}'],` |
| 107 | contributing/code-style-guide | path | `$candidate/components` is the third library | apps/frontend/svelte.config.js | `$candidate: path.resolve('./src/lib/candidate')` |
| 108 | contributing/code-style-guide | fact | HeroEmoji's props type extends the div attributes | apps/frontend/src/lib/components/heroEmoji/HeroEmoji.type.ts | `export type HeroEmojiProps = SvelteHTMLElements['div'] & {` |
| 109 | contributing/code-style-guide | fact | HeroEmoji reads its props with `$props()` and a rest property | apps/frontend/src/lib/components/heroEmoji/HeroEmoji.svelte | `let { emoji, ...restProps }: HeroEmojiProps = $props();` |
| 110 | contributing/code-style-guide | fact | HeroEmoji renders only for a non-empty emoji | apps/frontend/src/lib/components/heroEmoji/HeroEmoji.svelte | `{#if emoji != null && emoji !== ''}` |
| 111 | contributing/code-style-guide | fact | HeroEmoji spreads the rest props through `concatClass` | apps/frontend/src/lib/components/heroEmoji/HeroEmoji.svelte | `restProps,` |
| 112 | contributing/code-style-guide | fact | The barrel re-exports the component and its type | apps/frontend/src/lib/components/heroEmoji/index.ts | `export { default as HeroEmoji } from './HeroEmoji.svelte';` |
| 113 | contributing/code-style-guide | fact | `concatClass` lives in `$lib/utils/components` | apps/frontend/src/lib/utils/components.ts | `export function concatClass<TProps extends Record<string, any>>(props: TProps, classes: string) {` |
| 114 | contributing/code-style-guide | fact | `cn` is built on tailwind-merge | apps/frontend/src/lib/utils/components.ts | `import { extendTailwindMerge } from 'tailwind-merge';` |
| 115 | contributing/code-style-guide | fact | The caller's classes come last, so the caller wins | apps/frontend/src/lib/utils/components.ts | `class: cn(classes, callerClass)` |
| 116 | contributing/code-style-guide | fact | Optional props get defaults in the destructuring (Button) | apps/frontend/src/lib/components/button/Button.svelte | `variant = 'normal',` |
| 117 | contributing/code-style-guide | fact | Button declares an optional `badge` snippet | apps/frontend/src/lib/components/button/Button.type.ts | `badge?: Snippet;` |
| 118 | contributing/code-style-guide | fact | Button renders it with `{@render}` | apps/frontend/src/lib/components/button/Button.svelte | `{@render badge?.()}` |
| 119 | contributing/code-style-guide | fact | The caller example passes `badge` as a snippet | apps/frontend/src/lib/components/button/Button.svelte | `{#snippet badge()}<InfoBadge text="5" />{/snippet}` |
| 120 | contributing/code-style-guide | fact | Docstrings document snippets under `Snippet Props` | apps/frontend/src/lib/components/button/Button.svelte | `### Snippet Props` |
| 121 | contributing/code-style-guide | fact | The `@component` docstring is what the generator reads | apps/docs/scripts/generate-component-docs.ts | `const match = content.match(/<!--\s*@component\s*([\s\S]*?)-->/i);` |
| 122 | contributing/code-style-guide | fact | The icon directory has no `IconBase` (the old example) | apps/frontend/src/lib/components/icon/index.ts | `export { default as Icon } from './Icon.svelte';` |
| 123 | contributing/code-style-guide | fact | `Array<Foo>` is enforced | packages/shared-config/eslint.config.mjs | `'@typescript-eslint/array-type': [` |
| 124 | contributing/code-style-guide | fact | Type parameters must be `T`-prefixed PascalCase | packages/shared-config/eslint.config.mjs | `regex: '^T[A-Z]',` |
| 125 | contributing/contribute | fact | `.idea` is ignored | .gitignore | `.idea/` |
| 126 | contributing/contribute | fact | `.vscode` is ignored | .gitignore | `.vscode/*` |
| 127 | contributing/contribute | fact | The PR template links `#commit-your-update` | .github/PULL_REQUEST_TEMPLATE | `contributing/contribute#commit-your-update` |
| 128 | contributing/pull-request | fact | The PR template links `#self-review` | .github/PULL_REQUEST_TEMPLATE | `contributing/pull-request#self-review` |
| 129 | contributing/ai-agents | path | CLAUDE.md exists | CLAUDE.md | - |
| 130 | contributing/ai-agents | path | Skills for the components, data, database, filters and matching | .claude/skills/components/SKILL.md | - |
| 131 | contributing/ai-agents | path | ... data skill | .claude/skills/data/SKILL.md | - |
| 132 | contributing/ai-agents | path | ... database skill | .claude/skills/database/SKILL.md | - |
| 133 | contributing/ai-agents | path | ... filters skill | .claude/skills/filters/SKILL.md | - |
| 134 | contributing/ai-agents | path | ... matching skill | .claude/skills/matching/SKILL.md | - |
| 135 | contributing/ai-agents | path | The code review checklist | .agents/code-review-checklist.md | - |
| 136 | contributing/ai-agents | flow | `claude.yml` listens to issue comments | .github/workflows/claude.yml | `issue_comment:` |
| 137 | contributing/ai-agents | flow | ... to PR review comments | .github/workflows/claude.yml | `pull_request_review_comment:` |
| 138 | contributing/ai-agents | flow | ... to submitted reviews | .github/workflows/claude.yml | `pull_request_review:` |
| 139 | contributing/ai-agents | flow | ... and to issues | .github/workflows/claude.yml | `issues:` |
| 140 | contributing/ai-agents | flow | `@claude review` routes to review | .github/workflows/claude.yml | `grep -qiE '@claude[[:space:][:punct:]]+review'` |
| 141 | contributing/ai-agents | flow | `@claude solve` routes to solve | .github/workflows/claude.yml | `grep -qiE '@claude[[:space:][:punct:]]+solve'` |
| 142 | contributing/ai-agents | flow | Other mentions are generic tasks | .github/workflows/claude.yml | `ACTION="generic"` |
| 143 | contributing/ai-agents | flow | The author needs write, maintain or admin access | .github/workflows/claude.yml | `if [[ "$PERMISSION" == "admin" ` |
| 144 | contributing/ai-agents | flow | The review workflow can be started by hand with a PR number | .github/workflows/claude-code-review.yml | `description: "PR number to review"` |
| 145 | contributing/ai-agents | flow | The solve workflow can be started by hand with an issue number | .github/workflows/claude-solve-issue.yml | `description: "Issue number to solve"` |
| 146 | contributing/workflows | flow | `main.yaml` runs on pull requests | .github/workflows/main.yaml | `pull_request:` |
| 147 | contributing/workflows | flow | ... and on pushes to `ci-evidence/**` branches | .github/workflows/main.yaml | `- "ci-evidence/**"` |
| 148 | contributing/workflows | flow | Markdown-only changes are ignored | .github/workflows/main.yaml | `- "**.md"` |
| 149 | contributing/workflows | flow | `.env.example`-only changes are ignored | .github/workflows/main.yaml | `- ".env.example"` |
| 150 | contributing/workflows | flow | Validation job: format check | .github/workflows/main.yaml | `run: yarn format:check` |
| 151 | contributing/workflows | flow | Validation job: typecheck | .github/workflows/main.yaml | `run: yarn typecheck` |
| 152 | contributing/workflows | flow | Validation job: lint | .github/workflows/main.yaml | `run: yarn lint:check` |
| 153 | contributing/workflows | flow | Validation job: unit tests | .github/workflows/main.yaml | `run: yarn test:unit` |
| 154 | contributing/workflows | flow | Validation job: frontend svelte-check | .github/workflows/main.yaml | `run: yarn workspace @openvaa/frontend check` |
| 155 | contributing/workflows | flow | Validation job: frontend build | .github/workflows/main.yaml | `run: yarn workspace @openvaa/frontend build` |
| 156 | contributing/workflows | flow | `docker-image-build` builds without pushing | .github/workflows/main.yaml | `name: "Build the production frontend image (no push)"` |
| 157 | contributing/workflows | flow | `supabase-tests` is filtered to Supabase changes | .github/workflows/main.yaml | `- 'packages/supabase-types/**'` |
| 158 | contributing/workflows | flow | ... and runs pgTAP | .github/workflows/main.yaml | `run: supabase test db` |
| 159 | contributing/workflows | flow | `sql-lint` runs `db:lint:sql` | .github/workflows/main.yaml | `run: yarn db:lint:sql` |
| 160 | contributing/workflows | flow | `supabase-types-drift` regenerates the types | .github/workflows/main.yaml | `run: yarn db:types` |
| 161 | contributing/workflows | flow | `dev-seed-integration` runs the dev-seed tests | .github/workflows/main.yaml | `run: yarn workspace @openvaa/dev-seed test:unit` |
| 162 | contributing/workflows | flow | `e2e-tests` uses the run wrapper | .github/workflows/main.yaml | `run: tests/scripts/e2e-run.sh --run-dir tests/e2e-runs/ci --no-db-reset --no-watch` |
| 163 | contributing/workflows | flow | `e2e-visual` runs the visual project | .github/workflows/main.yaml | `--project visual-regression` |
| 164 | contributing/workflows | flow | `dependency-audit` fails at high severity outside the baseline | .github/workflows/main.yaml | `name: "Run yarn audit:deps (fails at high severity and above, outside the accepted baseline)"` |
| 165 | contributing/workflows | flow | `secret-scan` scans for committed secrets | .github/workflows/main.yaml | `name: "Scan for committed secrets (trufflehog)"` |
| 166 | contributing/workflows | flow | `skill-drift-check` runs the drift audit | .github/workflows/main.yaml | `run: .claude/scripts/audit-skill-drift.sh` |
| 167 | contributing/workflows | flow | ... which fails when a skill drifted | .claude/scripts/audit-skill-drift.sh | `Drifted skills may contain outdated information.` |
| 168 | contributing/workflows | flow | The Node engine guard's negative control | .github/workflows/main.yaml | `name: "Assert the node-engine guard REJECTS an out-of-range Node"` |
| 169 | contributing/workflows | flow | `release.yml` runs on pushes to `main` with Changesets | .github/workflows/release.yml | `uses: changesets/action@v1` |
| 170 | about/features | fact | Seven locales are compiled | apps/frontend/project.inlang/settings.json | `"locales": ["en", "fi", "sv", "da", "et", "fr", "lb"],` |
| 171 | about/features | fact | English is offered by default | packages/app-shared/src/settings/staticSettings.ts | `code: 'en',` |
| 172 | about/features | fact | Finnish is offered by default | packages/app-shared/src/settings/staticSettings.ts | `code: 'fi',` |
| 173 | about/features | fact | Swedish is offered by default | packages/app-shared/src/settings/staticSettings.ts | `code: 'sv',` |
| 174 | about/features | fact | Multiple-item text questions exist | packages/data/src/objects/questions/variants/multipleTextQuestion.ts | `export class MultipleTextQuestion extends Question<typeof QUESTION_TYPE.MultipleText> {` |
| 175 | about/features | fact | ... and have an input | apps/frontend/src/lib/components/input/parts/MultipleTextPart.svelte | - |
| 176 | about/features | fact | Number opinion questions render as a slider when matchable | apps/frontend/src/lib/components/questions/OpinionQuestionInput.svelte | `{:else if isNumberQuestion(question) && question.isMatchable}` |
| 177 | about/features | fact | Boolean opinion questions render | apps/frontend/src/lib/components/questions/OpinionQuestionInput.svelte | `{:else if isBooleanQuestion(question)}` |
| 178 | about/features | fact | Boolean questions are matchable | packages/data/src/objects/questions/variants/booleanQuestion.ts | `A matchable simple question whose answer is a boolean.` |
| 179 | about/features | fact | Preference order is not implemented | packages/data/src/objects/questions/base/questionTypes.ts | `// PreferenceOrder: 'preferenceOrder', // TODO: Implement` |
| 180 | about/features | fact | The client always gets the Supabase provider | apps/frontend/src/lib/api/dataProvider.ts | `export function createDataProvider(source: AdapterSource): SupabaseDataProvider {` |
| 181 | about/roadmap | fact | Svelte 5 runes are on | apps/frontend/svelte.config.js | `runes: true` |
| 182 | landing | fact | The current release is 0.1 | apps/frontend/package.json | `"version": "0.1.0",` |
| 183 | landing | fact | The GitHub link goes to the repository | apps/docs/src/lib/consts.ts | `export const OPENVAA_REPO_URL = 'https://github.com/OpenVAA/voting-advice-application';` |
| 184 | pg/preparing/the-application-be-hosted | fact | The app always reads from Supabase | apps/frontend/src/lib/api/dataProvider.ts | `export function createDataProvider(source: AdapterSource): SupabaseDataProvider {` |
| 185 | pg/preparing/matching | fact | The app matches with the Manhattan metric | apps/frontend/src/lib/contexts/voter/voterContext.svelte.ts | `distanceMetric: DISTANCE_METRIC.Manhattan,` |
| 186 | pg/preparing/matching | fact | The matching algorithm supports other metrics | packages/matching/src/distance/metric.ts | `export const DISTANCE_METRIC: Record<string, MetricFunction> = {` |
| 187 | pg/preparing/matching | fact | Missing answers are imputed as the furthest possible answer | apps/frontend/src/lib/contexts/voter/voterContext.svelte.ts | `method: MISSING_VALUE_METHOD.RelativeMaximum` |
| 188 | pg/preparing/matching | fact | RelativeMaximum imputes the furthest answer from the voter's | packages/matching/src/missingValue/missingValueMethod.ts | `Imputes the furthest possible answer from the reference value` |
| 189 | pg/preparing/matching | fact | Hiding entities with missing answers is supported for candidates only | packages/app-shared/src/settings/dynamicSettings.type.ts | `This is currently only supported for candidates.` |
| 190 | pg/preparing/matching | fact | Party answers are imputed from candidates by default | packages/app-shared/src/settings/dynamicSettings.ts | `organizationMatching: 'impute'` |
| 191 | pg/preparing/the-statements-or-questions-posed | fact | Boolean questions are matchable | packages/data/src/objects/questions/variants/booleanQuestion.ts | `A matchable simple question whose answer is a boolean.` |
| 192 | pg/preparing/the-statements-or-questions-posed | fact | Number questions are matchable when they have a min and a max | packages/data/src/objects/questions/variants/numberQuestion.ts | `The question is matchable if both` |
| 193 | pg/preparing/the-voter-see-when-using | fact | The matching algorithm accepts question weights | packages/matching/src/algorithms/matchingAlgorithm.ts | `questionWeights?: Record<Id, number>;` |
| 194 | pg/preparing/the-voter-see-when-using | fact | The app constructs the algorithm without weights | apps/frontend/src/lib/contexts/voter/voterContext.svelte.ts | `algorithm = new MatchingAlgorithm({` |
| 195 | pg/preparing/the-voter-see-when-using | fact | Party cards show up to three candidates | apps/frontend/src/lib/dynamic-components/entityCard/EntityCard.svelte | `maxSubcards = 3,` |
| 196 | pg/preparing/the-voter-see-when-using | fact | Entity details open over the results list | apps/frontend/src/routes/(voters)/(located)/results/[[electionTab]]/[[entityTab=etPl]]/[[entity=etSg]]/[[id]]/+page.svelte | `import { openEntityDrawer } from '$lib/dynamic-components/entityDetails';` |
| 197 | pg/preparing/candidates-and-parties-data-be | flow | Candidates are sent an invitation email | apps/supabase/supabase/functions/invite-candidate/index.ts | `supabaseAdmin.auth.admin.inviteUserByEmail(email, {` |
| 198 | pg/preparing/candidates-and-parties-data-be | flow | An invitation link leads to setting a password | apps/frontend/src/routes/api/candidate/auth/callback/+server.ts | `route: 'CandAppSetPassword'` |
| 199 | pg/preparing/candidates-and-parties-data-be | fact | Bank authentication stores the birth date | apps/supabase/supabase/functions/identity-callback/claimConfig.ts | `extractClaims: ['birthdate']` |
| 200 | pg/preparing/candidates-and-parties-data-be | fact | ... and the name | apps/supabase/supabase/functions/identity-callback/index.ts | `given_name: firstName,` |
| 201 | pg/preparing/candidates-and-parties-data-be | fact | The Candidate App has an FAQ page fed by App customization | apps/frontend/src/routes/candidate/help/+page.svelte | `appCustomization.current.candidateAppFAQ` |
| 202 | pg/preparing/languages-will-the-vaa-be | path | The translations folder | apps/frontend/messages/README.md | - |
| 203 | pg/preparing/the-vaa-look-and-feel | fact | The publisher logo is customisable | apps/frontend/src/lib/contexts/app/appCustomization.type.ts | `publisherLogo?: Image;` |
| 204 | pg/preparing/the-vaa-look-and-feel | fact | The front page poster is customisable | apps/frontend/src/lib/contexts/app/appCustomization.type.ts | `poster?: Image;` |
| 205 | pg/preparing/the-vaa-look-and-feel | fact | Colours are static settings | packages/app-shared/src/settings/staticSettings.ts | `colors: {` |
| 206 | pg/preparing/the-vaa-look-and-feel | fact | The font is a static setting | packages/app-shared/src/settings/staticSettings.ts | `font: {` |
| 207 | pg/preparing/the-vaa-look-and-feel | fact | Any text can be overridden | apps/frontend/src/lib/contexts/app/appCustomization.type.ts | `translationOverrides?: Record<TranslationKey, string>;` |
| 208 | pg/preparing/to-ask-voters-to-give | fact | The feedback form collects a rating (its `feedback_sent` event carries `rating` and `description`) | apps/frontend/src/lib/dynamic-components/feedback/Feedback.svelte | `feedback_sent` |
| 209 | pg/preparing/to-ask-voters-to-give | fact | The feedback popup delay is configurable | packages/app-shared/src/settings/dynamicSettings.ts | `showFeedbackPopup: 180,` |
| 210 | pg/preparing/to-offer-a-survey-for | fact | The survey prompt locations | packages/app-shared/src/settings/dynamicSettings.type.ts | `showIn: Array<'frontpage' ` |
| 211 | pg/preparing/what-data-should-be-collected | fact | Event tracking is off by default | packages/app-shared/src/settings/staticSettings.ts | `trackEvents: false` |
| 212 | pg/preparing/what-data-should-be-collected | fact | Umami is the built-in analytics platform | packages/app-shared/src/settings/staticSettings.type.ts | `readonly name: 'umami';` |
| 213 | pg/preparing/what-data-should-be-collected | fact | Voters are asked for consent | apps/frontend/src/lib/dynamic-components/dataConsent/DataConsent.svelte | - |
| 214 | pg/publish-with-openvaa | fact | The Association page has a Contact heading | apps/docs/src/routes/(content)/about/association/+page.md | `### Contact` |

## Findings for todos

| # | Finding | Evidence (anchor file: anchor) | Disposition |
| --- | --- | --- | --- |
| F1 | `.claude/skills/components/SKILL.md` § "The component listing" still says that "several sibling `generate:*` scripts in `apps/docs/package.json` name files that do not exist; they are filed as a todo, not repaired here". 168-01.1 repaired them (`generate:component-docs` now runs the real generator). Its quote of the index intro is still accurate (the sentence was kept verbatim). | `apps/docs/package.json`: `"generate:component-docs": "tsx scripts/generate-component-docs.ts"` | Skill-text drift for 168-08 (or a skills pass); not a docs-site page. |
| F2 | `tsc -p apps/docs/scripts/tsconfig.json --noEmit` fails with `TS2307: Cannot find module 'unified'` inside `node_modules/mdsvex/dist/main.d.ts`; no gate runs that command (`check`, `lint`, `build` all pass). Pre-existing, not caused by this plan. | `apps/docs/scripts/validate-links.ts` imports through `utils/links.ts`; `apps/docs/scripts/tsconfig.json`: `"include": ["./**/*.ts"` | Out of scope; recorded for a tooling pass. |
| F3 | Two voter-facing features that the Publishers' Guide and About › Features described as options do not exist in the frontend: real-time top results while answering, and voter-set statement weights (`@openvaa/matching` accepts `questionWeights`, the voter context never passes them). Both pages now say "not yet available". Whether either is still planned is an operator question. | `apps/frontend/src/lib/contexts/voter/voterContext.svelte.ts`: `algorithm = new MatchingAlgorithm({`; `git grep -n -i weight -- apps/frontend/src` lists only admin pipeline weights and a CSS comment | Roadmap/todo question for the operator (168-08 may record it); no code change (D-18). |
| F4 | Publishers' Guide › hosting said a VAA without the Candidate App could be "a static website with no separate database". With `createDataProvider` always returning the Supabase provider (168-05 F1), no static mode exists at HEAD. The page now says a database is always needed. | `apps/frontend/src/lib/api/dataProvider.ts`: `export function createDataProvider(source: AdapterSource): SupabaseDataProvider {` | Same disposition as 168-05 F1 (restore or remove the local mode). |

## Sweep exceptions

| Page | Hit | Reason |
| --- | --- | --- |
| `about/roadmap` | `Backend migrated from Strapi to Supabase (completed)` | D-21 expected exception: the operator's roadmap history line, left as written (D-05). |
| `developers-guide/contributing/workflows` | `docker-image-build` (job name) and "production image of the frontend from `apps/frontend/Dockerfile`" (one line) | The CI job builds the frontend's production container image; deployment prose, not a Docker development stack (D-21 permitted case). |
