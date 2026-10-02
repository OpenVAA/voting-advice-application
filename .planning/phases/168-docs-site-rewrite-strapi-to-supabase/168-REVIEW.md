---
phase: 168-docs-site-rewrite-strapi-to-supabase
reviewed: 2026-10-02T00:00:00Z
depth: standard
files_reviewed: 54
files_reviewed_list:
  - apps/docs/eslint.config.js
  - apps/docs/mdsvex.config.js
  - apps/docs/package.json
  - apps/docs/playwright.config.ts
  - apps/docs/scripts/check-research-quotes.ts
  - apps/docs/scripts/docs-scripts.config.ts
  - apps/docs/scripts/generate-all-docs-and-validate.ts
  - apps/docs/scripts/generate-component-docs.ts
  - apps/docs/scripts/generate-navigation-config.ts
  - apps/docs/scripts/generate-route-map.ts
  - apps/docs/scripts/move-generated.ts
  - apps/docs/scripts/utils/links.ts
  - apps/docs/scripts/validate-links.ts
  - apps/docs/src/lib/components/Footer.svelte
  - apps/docs/src/lib/components/Header.svelte
  - apps/docs/src/lib/components/Navigation.svelte
  - apps/docs/src/lib/components/NavigationItem.svelte
  - apps/docs/src/lib/components/ReferenceList.svelte
  - apps/docs/src/lib/components/ResearchQuote.svelte
  - apps/docs/src/lib/components/TableOfContents.svelte
  - apps/docs/src/lib/layouts/MdLayout.svelte
  - apps/docs/src/lib/navigation.config.ts
  - apps/docs/src/routes/(content)/developers-guide/app-and-repo-structure/+page.ts
  - apps/docs/src/routes/(content)/developers-guide/auto-documentation/+page.ts
  - apps/docs/src/routes/(content)/developers-guide/backend/customized-behaviour/+page.ts
  - apps/docs/src/routes/(content)/developers-guide/backend/default-data-loading/+page.ts
  - apps/docs/src/routes/(content)/developers-guide/backend/mock-data-generation/+page.ts
  - apps/docs/src/routes/(content)/developers-guide/backend/openvaa-admin-tools-plugin-for-strapi/+page.ts
  - apps/docs/src/routes/(content)/developers-guide/backend/plugins/+page.ts
  - apps/docs/src/routes/(content)/developers-guide/backend/preparing-backend-dependencies/+page.ts
  - apps/docs/src/routes/(content)/developers-guide/backend/re-generating-types/+page.ts
  - apps/docs/src/routes/(content)/developers-guide/backend/running-the-backend-separately/+page.ts
  - apps/docs/src/routes/(content)/developers-guide/backend/security/+page.ts
  - apps/docs/src/routes/(content)/developers-guide/candidate-user-management/creating-a-new-candidate/+page.ts
  - apps/docs/src/routes/(content)/developers-guide/candidate-user-management/mock-data/+page.ts
  - apps/docs/src/routes/(content)/developers-guide/candidate-user-management/password-validation/+page.ts
  - apps/docs/src/routes/(content)/developers-guide/candidate-user-management/registration-process-in-strapi/+page.ts
  - apps/docs/src/routes/(content)/developers-guide/candidate-user-management/resetting-the-password/+page.ts
  - apps/docs/src/routes/(content)/developers-guide/development/intro/+page.ts
  - apps/docs/src/routes/(content)/developers-guide/frontend/accessing-data-and-state-management/+page.ts
  - apps/docs/src/routes/(content)/developers-guide/frontend/data-api/+page.ts
  - apps/docs/src/routes/(content)/developers-guide/frontend/environmental-variables/+page.ts
  - apps/docs/src/routes/(content)/developers-guide/llm-features/+page.ts
  - apps/docs/src/routes/(content)/developers-guide/localization/local-translations/+page.ts
  - apps/docs/src/routes/(content)/developers-guide/localization/locale-routes/+page.ts
  - apps/docs/src/routes/(content)/developers-guide/localization/locale-selection-step-by-step/+page.ts
  - apps/docs/src/routes/(content)/developers-guide/localization/localization-in-strapi/+page.ts
  - apps/docs/src/routes/(content)/developers-guide/localization/localization-in-the-frontend/+page.ts
  - apps/docs/src/routes/+layout.svelte
  - apps/docs/src/routes/+page.svelte
  - apps/docs/svelte.config.js
  - package.json
  - packages/shared-config/eslint.config.mjs
  - security/audit-baseline.json
findings:
  critical: 0
  warning: 6
  info: 8
  total: 14
status: issues_found
---

# Phase 168: Code Review Report

**Reviewed:** 2026-10-02
**Depth:** standard
**Files Reviewed:** 54 (`apps/docs/playwright.config.ts` was deleted in the phase; `yarn.lock` was not reviewed as source)
**Status:** issues_found

## Summary

Reviewed the docs tooling (link checker, research-quote gate, generators, move script), the lint and package changes, the 26 redirect stubs and the lint-touched Svelte files. Everything was read in full.

Checks run:

- `yarn lint` in `apps/docs` is clean.
- `tsx scripts/validate-links.ts --check` reports 0 findings across all 7 classes.
- `git grep --null -n` output was confirmed to be `file\0line\0content`, which is what `findInboundReferences` assumes.
- The audit-baseline removal of the two `linkify-it` rows is consistent with the lockfile, which no longer contains `linkify-it`, `markdown-it` or `typedoc`.

The Svelte changes are import reordering, `string[]` to `Array<string>`, and one arrow function turned into a declaration. None change behaviour. The 26 redirect stubs are uniform, valid and chain-free.

No security vulnerabilities or crash-class defects were found. The concerns are robustness defects in the scripts that mutate the working tree, which is where this phase's risk sits:

- `move-generated.ts` deletes before it has built the replacement.
- The navigation generator can silently reset the file it owns.
- The generators do not fail closed on empty input.

## Warnings

### WR-01: `move-generated.ts` deletes the destination before the replacement exists

**File:** `apps/docs/scripts/move-generated.ts:93-97`
**Issue:** `await rm(destPath, { recursive: true, force: true })` runs first, then `moveAndTransformDir` repopulates it. If the transform throws partway (unreadable file, ENOSPC, a bug in a later entry), the committed `components/generated` or `routing/generated` tree is left half-deleted and half-written. The source directory is kept because the `rm(srcPath)` after it is never reached. Nothing uncommitted is protected: a hand-edited or hand-added file under a `generated/` directory (for example a redirect stub or a corrected page) is destroyed with no warning.

Path safety itself is acceptable. `destPath` and `srcPath` come only from the `COPY_TARGETS` constants and `GENERATED_DIR`, with no user input. A wrong cwd makes `rm` hit a non-existent path. Symlinks are not followed. There is, however, no assertion that `dest` really lies inside `src/routes`.

**Fix:** Build into a sibling temp directory and swap only after success, and assert containment before any `rm`:
```ts
const routesRoot = resolve(DOCS_ROUTES_DIR);
if (!resolve(destPath).startsWith(routesRoot + sep)) throw new Error(`Refusing to clear ${destPath}`);
const staging = `${destPath}.staging`;
await rm(staging, { recursive: true, force: true });
await moveAndTransformDir(srcPath, staging, srcPath);
await rm(destPath, { recursive: true, force: true });
await rename(staging, destPath);
await rm(srcPath, { recursive: true, force: true });
```

### WR-02: Empty generator output is accepted and then wipes the committed pages

**File:** `apps/docs/scripts/generate-component-docs.ts:38-111`, `apps/docs/scripts/docs-scripts.config.ts:9-11`
**Issue:** `DOCS_ROOT = process.cwd()`, so `FRONTEND_ROOT`, `GENERATED_DIR` and every destination depend on the launch directory. The link checker, by contrast, anchors on `import.meta.url`.

If the scripts run from the wrong directory, or `apps/frontend/src/lib/components` moves, `glob` returns 0 files without error. The generator writes a README with "Total: 0 components". `generate-all-docs-and-validate.ts` carries on to `move-generated.ts`, which (WR-01) clears `components/generated` and replaces it with a lone index. `validate-links` then fails on the dangling links, but only after the destructive step.

**Fix:** Anchor the config on the file location (`path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')`) like `utils/links.ts`. In the generator, throw when `files.length === 0` for any `COMPONENT_DIRS` entry, or when `allDocs.length === 0`.

### WR-03: `loadCurrentConfig` uses `eval` and silently resets the config on any failure

**File:** `apps/docs/scripts/generate-navigation-config.ts:67-83`
**Issue:** The current `navigation.config.ts` is evaluated with `eval` after a greedy regex slice. Any parse or eval failure goes to a bare `catch`, which logs a warning and returns `[]`. `main()` then overwrites `navigation.config.ts` from the discovered routes alone. That loses every `fixedTitle: true` and `isSecondary: true` flag and the curated titles, with only one `console.warn` line as a trace. A single trailing TypeScript construct such as `as const` or `satisfies` is enough to trigger it. The `eval` is also unnecessary: the file is repo-local and trusted, but a dynamic `import()` or `tsx` would do the same without it.

**Fix:** Import the module (`const { navigation } = await import(pathToFileURL(CONFIG_FILE).href)`), or at minimum rethrow unless the file is genuinely absent (`ENOENT`):
```ts
} catch (error) {
  if ((error as NodeJS.ErrnoException).code === 'ENOENT') return [];
  throw error;
}
```

### WR-04: `resolvePage` can resolve a traversal path as a static asset

**File:** `apps/docs/scripts/utils/links.ts:214-242`
**Issue:** Segments are URL-decoded before the `.`/`..` check, but a decoded segment may itself contain `/`. A link such as `/..%2f..%2f..%2fpackage.json` yields the single segment `../../../package.json`, which passes the check. `path.join(STATIC_DIR, ...segments)` then `stat`s a file outside `static/`, and the link is reported as a valid asset. The impact is limited to false "link OK" results and an existence oracle on the local filesystem. It still undermines the checker's guarantee.

**Fix:** Reject any decoded segment that contains `/`, `\`, or a `..` component, and verify containment after joining:
```ts
if (segments.some((s) => s === '.' || s === '..' || /[\\/]/.test(s))) return { kind: 'none' };
...
if (!path.resolve(staticFile).startsWith(STATIC_DIR + path.sep)) return best;
```

### WR-05: `replaceLink` can corrupt a rewritten link

**File:** `apps/docs/scripts/utils/links.ts:523-526`
**Issue:** There are two defects:

- `content.replace(oldLink.raw, newLinkMarkdown)` passes a string replacement, so `$&`, `$'`, `` $` `` and `$$` in the link text or URL are interpreted as substitution patterns.
- The replacement always emits `[text](url)`. `extractMarkdownLinks` also accepts the `[text](<url>)` form, which exists precisely so that URLs containing `)` survive. A relative `<…>` link containing parentheses is rewritten without the angle brackets and breaks.

Only default mode (as run by `generate:docs`) writes, and only for relative links, so the exposure is small but silent.

**Fix:** Use a replacer function and preserve the bracket form:
```ts
const bracketed = oldLink.raw.includes('](<');
const replacement = `[${oldLink.text}](${bracketed ? `<${newUrl}>` : newUrl})`;
return content.replace(oldLink.raw, () => replacement);
```

### WR-06: Generator output directories are never cleared and `scripts/.temp` is not git-ignored

**File:** `apps/docs/scripts/generate-all-docs-and-validate.ts:46-54`, `apps/docs/scripts/generate-component-docs.ts:96-100`
**Issue:** `ensureDirectories` only creates directories. `generate-component-docs.ts` writes into `.temp/components` without clearing it. `generate:component-docs` is a standalone script and does not call `move-generated`, so its output stays in `.temp`.

If a component's docstring is later removed or the component deleted, the stale page survives in `.temp` and is moved into the site on the next full run. The pruning added by `move-generated` (`rm(destPath)`) only covers the destination, not this staging area.

`apps/docs/scripts/.temp/` is not matched by `.gitignore` (verified with `git check-ignore`), so a leftover staging tree is one `git add -A` away from being committed.

**Fix:** `rm(OUTPUT_DIR, { recursive: true, force: true })` at the start of `generate-component-docs.ts` and `generate-route-map.ts`, and add `apps/docs/scripts/.temp/` to `.gitignore`.

## Info

### IN-01: `transformMarkdownLinks` is over-broad

**File:** `apps/docs/scripts/move-generated.ts:19-23`
**Issue:**

- The first two regexes lack the `(?!https?:\/\/)` guard that the third has, so external URLs ending in `/README.md` are rewritten to the directory URL.
- Code fences are not excluded, so example snippets are rewritten too.
- `README.md#anchor` is not handled.

`generate-component-docs.ts` already works around the first issue with a `/tree/main` URL, which shows the behaviour is known.

**Fix:** Apply the same negative lookahead to the README regexes, skip fenced regions, and handle an optional `#hash`.

### IN-02: Dead `DIRS_ONLY` branch in the route map has a latent bad link

**File:** `apps/docs/scripts/generate-route-map.ts:10,67,183-188,214-224`
**Issue:** `const DIRS_ONLY = true` makes `node.files` always empty, so the file-listing code is dead. If it were ever enabled, `githubLink` would be `${GITHUB_BASE}/${file.fullPath}` with an absolute filesystem path, a broken URL. `getDisplayName` also has branches that return the same value.

**Fix:** Delete the file-listing path and the flag, or build the link from `path.relative(REPO_ROOT, file.fullPath)`. Collapse `getDisplayName`.

### IN-03: `categorySubdir` mapping duplicated

**File:** `apps/docs/scripts/generate-component-docs.ts:83-93,262-272`
**Issue:** The same if/else chain mapping `importPrefix` to a subdirectory appears twice. A third component directory added in only one place would produce a TOC that disagrees with the output layout.

**Fix:** Add `categorySubdir` to the `COMPONENT_DIRS` config entries and read it from there.

### IN-04: `findTypeFile` replaces the first `.svelte` anywhere in the path

**File:** `apps/docs/scripts/generate-component-docs.ts:136`
**Issue:** `svelteFilePath.replace('.svelte', '.type.ts')` replaces the first occurrence. A directory segment such as `.svelte-kit` or `x.svelte-y` would corrupt the path, and the type file would silently not be found.

**Fix:** `svelteFilePath.replace(/\.svelte$/, '.type.ts')`.

### IN-05: Redirect stubs emit 308 only nominally

**File:** `apps/docs/src/routes/(content)/developers-guide/*/+page.ts` (26 files), `apps/docs/scripts/utils/links.ts:253-265`
**Issue:** `adapter-static` runs with `fallback: '404.html'` and no prerendering, so `redirect(308, …)` runs client-side only. Crawlers and non-JS clients requesting an old URL get the fallback page (a 404 on most static hosts), not a permanent redirect. This is the accepted design (CONTEXT fact 9). The checker's "301 or 308" rule validates a status code the deployed site cannot emit, which may mislead later readers.

**Fix:** Say so in the checker's doc comment and in `about-these-docs`, or set `export const prerender = true` on the stubs so they build to meta-refresh HTML.

### IN-06: Unused dependency and duplicate scripts in `apps/docs/package.json`

**File:** `apps/docs/package.json:13-14,40`
**Issue:** `eslint-config-prettier` is no longer imported by `eslint.config.js` (the shared config pulls in `prettier` through `compat.extends`), so it is an unused devDependency. `typecheck` and `check` are identical.

**Fix:** Drop the dependency, or import it explicitly if wanted. Alias one script to the other.

### IN-07: Small inconsistencies in the navigation generator and route utilities

**File:** `apps/docs/scripts/generate-navigation-config.ts:150-155,200-225`, `apps/docs/scripts/utils/routes.ts:61-65`
**Issue:**

- `compareSection` takes `discoveredMap` and `routeTitles`, which are never read.
- The two branches that convert between item and section drop `isSecondary`.
- A section demoted to an item loses its children without even a `// Removed` comment, because `appendWorkingItem` only serialises children for items that have a `children` key.
- `normalizeRoute` in `routes.ts` duplicates `normalizeRoutePath` in `utils/links.ts`.

**Fix:** Drop the unused parameters, copy `isSecondary` through the conversions, and import one normaliser.

### IN-08: Link-checker edge cases

**File:** `apps/docs/scripts/validate-links.ts:124,129`, `apps/docs/scripts/utils/links.ts:298-300,326`
**Issue:**

- In default mode the markdown pass always runs and writes files. `--only svelte-href` (or any class other than `md-link` and `anchor`) can therefore still rewrite markdown. The help text does not say so.
- `GITHUB_SOURCE_URL` requires `/` or end of string after `main`, so `…/blob/main#L10` and `…/blob/main?plain=1` are silently skipped.
- Bare-URL matches keep trailing `.` and `,`, which gives false "not tracked" findings.
- `github-path` validates against the files tracked on the current branch, but the links target `main`. Per the audit-baseline note, `main` still carries the pre-v2 layout, so these links 404 on GitHub until the branch merges.

**Fix:** Skip writes when `--only` excludes `md-link`, or document it. Allow `[?#]` after `main`. Strip trailing `.,;:` from bare matches. Note the merge-order caveat in the script doc.

---

_Reviewed: 2026-10-02_
_Reviewer: Claude (gsd-code-reviewer)_
_Depth: standard_
