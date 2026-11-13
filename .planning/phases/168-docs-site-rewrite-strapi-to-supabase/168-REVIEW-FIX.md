---
phase: 168-docs-site-rewrite-strapi-to-supabase
step: review-fix
batch: review-fix-D
findings_fixed: [WR-01, WR-02, WR-03, WR-04, WR-05, WR-06, IN-01, IN-02, IN-03, IN-04, IN-05, IN-06, IN-07, IN-08]
base: 2fb65aab2
gates: tests/e2e-runs/179-gates/review-fix-D
e2e_close: tests/e2e-runs/179-e2e/review-fix-D-r2
status: complete
---

# Phase 168 review fix

Fixed in review-fix batch D, with phases 166, 167 and 169. Every finding held at `2fb65aab2`. The docs tooling had no test, so the batch gave `apps/docs` a unit harness (`test:unit`, `vitest run --project server`, with `scripts/**/*.test.ts` added to the server project; see `167-REVIEW-FIX.md` § IN-01) and made each script importable first, in a commit that changes no behaviour. The red tests were then written against the importable scripts and committed together, with the exit of their red run; each fix followed in its own commit.

| Finding | Disposition | Commits |
| --- | --- | --- |
| WR-01 | fixed | 5ac3d56e3 (red), 94dfa8cbd (fix) |
| WR-02 | fixed | 5ac3d56e3 (red), 5e18ce797 (fix) |
| WR-03 | fixed | 5ac3d56e3 (red), 4bd9b1ca2 (fix) |
| WR-04 | fixed | 5ac3d56e3 (red), 19cde7320 (fix) |
| WR-05 | fixed | 5ac3d56e3 (red), 59e5f44a8 (fix) |
| WR-06 | fixed | 5ac3d56e3 (red), 402cb9faa (fix) |
| IN-01 | fixed | 5ac3d56e3 (red), 868f6b87b (fix) |
| IN-02 | fixed, dead code removed | 39f9c6189 |
| IN-03 | fixed, refactor pinned by a test | 5ac3d56e3 (pin), ff5e028fe |
| IN-04 | fixed | 5ac3d56e3 (red), 61fc803ce (fix) |
| IN-05 | fixed, documentation | ef63d5b7b |
| IN-06 | fixed, manifest | 2361a2cb7 |
| IN-07 | fixed (isSecondary: no change, see below) | 5ac3d56e3 (red), 285711b34 (fix) |
| IN-08 | fixed | 5ac3d56e3 (red), dbf2979a5 (fix) |

## The importable scripts

`08078d2aa` gives each script a guard, `isMainModule(import.meta.url)` in the new `scripts/utils/cli.ts`, so it runs its command only when it is the process's entry script, and exports what a test drives: `moveTarget`, `transformMarkdownLinks`, `generateComponentDocs` (output and component directories as options), `findTypeFile`, `generateRouteMap`, `loadCurrentConfig` (the config file as a parameter), `compareNavigations`, `generateTypeScript`, `parseArgs` and `markdownPass`. No behaviour changed: `yarn workspace @openvaa/docs generate:docs` regenerated every committed page byte-for-byte except one, `…/generated/contestant/components/nothingToEdit/NothingToEdit/+page.md`, whose source docstring had changed earlier. That page was restored, not committed (see the deferred list below), and `validate:links --check` reported 0 findings.

## The red run

`5ac3d56e3`: `yarn workspace @openvaa/docs test:unit`, **exit 1**, 20 of 29 failed across 7 of 8 files (the eighth is the logo test of 167 IN-01, green by then), each on its finding. The table-of-contents case passed, as intended: it pins the layout the IN-03 refactor had to keep. Log `tests/e2e-runs/179-unit/review-fix-D-168-red.log`.

## WR-01: the moved pages are built aside and swapped in

`moveTarget` asserts that the destination lies inside `src/routes/(content)` before anything is removed, builds the transformed pages in `<dest>.staging`, removes the staging directory and rethrows if the transform fails, and only then replaces the destination and removes the source. The red cases: a source file that cannot be read left the destination holding only the half-written copy, and a destination outside the routes directory was cleared.

## WR-02: the roots do not depend on the working directory, and an empty source fails

`docs-scripts.config.ts` resolves `DOCS_ROOT` from its own location, as `utils/links.ts` already did. `generateComponentDocs` throws when a component directory holds no Svelte file, and when no component has a docstring, so `generate-all-docs-and-validate.ts` stops before `move-generated.ts` can replace the committed pages with an empty index. The red cases: with the working directory changed, the roots followed it; an empty component directory produced "Total: 0 components".

## WR-03: the navigation config is imported, not evaluated

`loadCurrentConfig` imports the config module, so any TypeScript it holds is read as the compiler reads it, and the `eval` of a regex slice is gone. Only a missing file starts from an empty navigation; a file that does not import, or exports no `navigation` array, fails the generator before it overwrites the curated titles and flags. The red cases: a config ending in `satisfies Navigation` loaded as `[]`, and so did one that does not parse. Running the generator on the real config leaves it byte-identical after formatting.

## WR-04: no traversal through an encoded separator

`resolvePage` refuses a decoded segment that holds `/` or `\`, as well as `.` and `..`, and a static lookup must stay inside `static/`. The red case: `/..%2fpackage.json` resolved as a static asset, `apps/docs/package.json`.

## WR-05: a rewritten link is written as it was meant

`replaceLink` passes a replacer function, so `$&` and the other replacement patterns in the link text or URL are written literally, and keeps the `[text](<url>)` form when the link used it. The red cases: `$&` in the text inserted the matched link; a bracketed URL lost its brackets.

## WR-06: the staging directories start empty and are ignored

`generateComponentDocs` and `generateRouteMap` remove their output directory before writing, so a page whose component has gone is not moved into the site, and the root `.gitignore` ignores `apps/docs/scripts/.temp/`. The red cases: a stale page survived each generator, and `git check-ignore` did not match the staging directory.

## IN-01: only internal `.md` links are rewritten

`transformMarkdownLinks` skips a link with a scheme (an external URL ending in `/README.md` was rewritten to its directory), skips fenced code blocks, and keeps a README link's anchor (`foo/README.md#x` became `foo/README#x`, now `foo#x`). The comment in the component generator that explained its GitHub tree link by the old rewrite was reworded.

## IN-02: the route map's dead file listing is gone

`DIRS_ONLY`, the `RouteFile` type, the file grouping and the file-listing code, whose link would have embedded an absolute filesystem path, are removed, and `getDisplayName`'s identical branches collapsed into one expression. No behaviour is reachable that changed, so there is no red; the regenerated map is identical to the committed page.

## IN-03: one place says where a directory's pages go

Each `COMPONENT_DIRS` entry carries `categorySubdir`, which both the page layout and the table of contents read; the two if/else chains are gone. The case written before the change ("links each component in the table of contents to the page it writes") passed before and after.

## IN-04: the type file is found from the suffix

`findTypeFile` replaces `/\.svelte$/` only. The red case: a component under a directory named `a.svelte-kit` was reported with no type file.

## IN-05: the redirect's status is said to be nominal

The stub parser's comment and the about-these-docs page state that the static single-page site runs a redirect in the browser and sends no status code, so a client without JavaScript gets the fallback page. The page also states when the link check rewrites (see IN-08). The alternative the review offered, `export const prerender = true` on the 26 stubs so they build to meta-refresh HTML, changes the build and is left as an option, listed for the operator in the batch report.

## IN-06: the docs manifest

`eslint-config-prettier` is no longer a devDependency of `apps/docs`: the docs ESLint config takes Prettier's rules through `@openvaa/shared-config`, which declares it. `typecheck` runs `yarn run check` rather than repeating its command. After `yarn install`, `yarn lint` and `yarn typecheck` in the docs app exit 0 (0 errors, 0 warnings), and `assert:declared-binaries` reports 0 violations. A manifest entry has no behaviour a test can show, so there is no red.

## IN-07: the navigation generator

- A section that becomes an item now writes a `// Removed:` line for each of its children (the red case found no such line).
- `compareNavigations` no longer takes the routes, and `compareSection` no longer takes the discovered map and the title map; none was read.
- `discoverRoutes` uses `normalizeRoutePath` from `utils/links.ts`, and its own copy is gone.
- **`isSecondary`: no change needed.** `NavigationSection` declares no `isSecondary` (only `NavigationItem` does), so in a conversion from section to item there is no flag to copy, and in one from item to section the section cannot hold it.

## IN-08: the link checker's edge cases

- `markdownPass` writes markdown only in default mode and only while `md-link` is among the reported classes; `--only svelte-href` no longer rewrites anything. The script header and the about-these-docs page say so.
- A link to the branch root with a `?query` or `#hash` is read whole (the lookahead leaves the query or hash for `splitHash`).
- A bare URL drops trailing `.`, `,`, `;` and `:`.
- The `github-path` class's description says that it reads the checked-out branch's paths while the links name `main`, so a link it accepts on another branch answers 404 on GitHub until that branch merges.

## Green

`yarn workspace @openvaa/docs test:unit`: 29 passed in 8 files, the logo test of 167 IN-01 included. `eslint scripts` and `prettier --check scripts`: clean. `validate:links --check`: 0 findings in every class.

## Deferred, out of scope

- **Generated page drift.** `NothingToEdit/+page.md` under the generated components route no longer matches its component's docstring (a later edit added a sentence about the account settings). It is regenerated by `generate:docs` and was left as it is.

## Gates and E2E close

See `167-REVIEW-FIX.md` § Gates and E2E close of batch D. The `docs-links` and `build` rows cover the docs app.
