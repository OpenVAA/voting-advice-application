---
phase: 165-review-stack-comment-remediation
plan: 22
subsystem: docs
tags: [docs-site, tailwind, style-inlining, routing, comment-hygiene]

requires:
  - phase: 165-review-stack-comment-remediation
    provides: 165-01 instruments (hygiene gate, read log, assert-absent, code-identity, ledger-check)
provides:
  - Routing docs page describing the runes-era `getRoute.current` handle (C-4080518476)
  - Docs-site components styled with Tailwind classes, with the only kept CSS being the TOC's webkit scrollbar rules (docs half of C-4106826598, D-10)
affects: [165-33, 165-36]

tech-stack:
  added: []
  patterns:
    - "`text-(length:--text-sm)` applies the theme font-size token without the line-height that `text-sm` also sets, so text inside a `prose` container keeps its inherited line-height"
    - "`not-prose` on a component list inside `prose`, instead of `m-0 p-0` resets that tie with `.prose :where(ul)` on specificity and lose on utility order"
    - "Heading-level indentation through a literal class map (`LEVEL_INDENT`), so Tailwind's scanner sees every class"

key-files:
  created:
    - .planning/phases/165-review-stack-comment-remediation/scripts/hygiene-reads/165-22.tsv
  modified:
    - apps/docs/src/routes/(content)/developers-guide/frontend/routing/+page.md
    - apps/docs/src/lib/components/Header.svelte
    - apps/docs/src/lib/components/NavigationItem.svelte
    - apps/docs/src/lib/components/PeerNavigation.svelte
    - apps/docs/src/lib/components/TableOfContents.svelte
    - apps/docs/src/lib/layouts/MdLayout.svelte
    - .planning/phases/165-review-stack-comment-remediation/165-LEDGER.md

key-decisions:
  - "The TOC's four ::-webkit-scrollbar rules stay as CSS under D-10: the scrollbar is a browser-generated pseudo-element with no Tailwind utility"
  - "DaisyUI's `menu-active` class is kept on the active sidebar link beside `bg-base-300 text-neutral`, because it also clears the outline and noise background"
  - "Formatting of apps/docs files is checked from inside apps/docs: the root .prettierignore's bare `docs` entry makes a root-level `prettier --check` pass these paths without reading them"

requirements-completed: [165-SC2, 165-SC3, C-4080518476]

actuals:
  tokens: 2234
  tasks: 3
  commits: 4
plan_head_before: c5a588afb4f4d4638390a40eddaa518d4cdaf683
plan_head_after: 462f3024384cabe77f8c2921f4cc5a5f4190000c

duration: 20min
completed: 2026-09-27
status: complete
---

# Phase 165 Plan 22: Docs Routing Page and Docs-Site Style Inlining Summary

**The routing docs page now describes `getRoute.current(...)` and links files that exist. Four of the five docs components have no `<style>` block; TableOfContents keeps only its webkit scrollbar rules. Every other computed style matches the previous rendering across 18 elements.**

## Performance

- **Duration:** about 20 min
- **Completed:** 2026-09-27T18:58Z
- **Tasks:** 3 of 3
- **Files modified:** 6 source files, plus the read log and the ledger

## Accomplishments

- **Routing page (C-4080518476).** The "Building routes" section now:
  - describes `AppContext.getRoute` as a handle whose `current` property is the route builder bound to the current route;
  - links `getRoute.svelte.ts` and `appContext.type.ts`;
  - shows `getRoute.current('Results')` and `getRoute.current({ route: 'Results', electionId: ['e1', 'e2'] })`;
  - says the builder keeps the selected `electionId`s and `constituencyId`s, and that the locale is not a route parameter: it comes from Paraglide's URL strategy, and the builder adds the prefix.

  A typo in an unchanged sentence was also fixed ("if there data" → "if the data").
- **Style inlining (C-4106826598, D-10).** Header, NavigationItem, PeerNavigation and MdLayout no longer have a `<style>` block. TableOfContents keeps one block, holding only its scrollbar rules. Removed class names that carried no other rule: `peer-navigation`, `peer-nav-*`, `toc-title`, `toc-list`, `toc-item*`, `toc-link`, `toc-sidebar`, and the `active` class on TOC items. The active TOC state now uses the button's existing `aria-current="location"` through `aria-[current=location]:` variants.

## Task Commits

1. **Task 1: routing page describes the `getRoute.current` handle (tracer)**: `c20063c17` (docs)
2. **Task 2: inline the docs-site component styles**: `943889e29` (style)
3. **Task 3: hygiene pass and read records**: `6837af5d6` (docs, comment-only, `Hygiene: D-04`) and `462f30243` (chore, read log)

The tracer gate passed: the Task 1 `<verify>` commands were re-run end to end before any expansion task (`assert-absent.sh` exit 0, `grep -q 'getRoute.current('` exit 0).

## Linked paths on the routing page (all tracked)

`git ls-files --error-unmatch` exits 0 for each:

- `apps/frontend/src/lib/contexts/app/appContext.type.ts`
- `apps/frontend/src/lib/contexts/app/getRoute.svelte.ts`
- `apps/frontend/src/lib/routes/buildRoute.ts`
- `apps/frontend/src/lib/routes/impliedParams.ts`
- `apps/frontend/src/lib/routes/params.ts`
- `apps/frontend/src/lib/routes/route.ts`

The page's one other link, `/developers-guide/frontend/routing/generated`, is a site-internal route, and `apps/docs/src/routes/(content)/developers-guide/frontend/routing/generated/` exists.

## Kept CSS

`git grep -c '<style' -- apps/docs/src` returns a single file: `apps/docs/src/lib/components/TableOfContents.svelte:1`.

| File | Kept rules | Reason (the comment in the file) |
|---|---|---|
| `apps/docs/src/lib/components/TableOfContents.svelte` | `.toc::-webkit-scrollbar` (width), `::-webkit-scrollbar-track` (transparent), `::-webkit-scrollbar-thumb` (base-300, 2px radius), `::-webkit-scrollbar-thumb:hover` (secondary) | "The scrollbar is a browser-generated pseudo-element, which Tailwind has no utility for." The `toc` class stays on the `<nav>` only as the hook for these rules. |

## Before/after rendering check

**Method.** The docs dev server ran on port 5199 (`vite dev --strictPort`) and was restarted after the edits, so HMR could not serve stale modules. A Playwright script (Chromium, 1400×900) opened `/developers-guide/frontend/routing` and recorded two things for 18 elements chosen by structural selectors that do not depend on the removed class names:

- 38 computed properties per element, plus its bounding box;
- the same, in the hover state of a peer-navigation link and of a TOC link.

The elements:

| Component | Elements |
|---|---|
| Header | active and inactive section link |
| NavigationItem | active link, inactive link, `<summary>` |
| PeerNavigation | `<nav>`, both links, label and title spans |
| TableOfContents | `<nav>`, title, list, a level-2 item, a level-3 item, a link |
| MdLayout | the TOC `<aside>` |

**Result.** After the fixes below, 0 differences in every non-transition property and every bounding box, at rest and on hover. The `::-webkit-scrollbar` pseudo-element still computes `width: 4px`. On `/developers-guide/deployment`, which is long enough to activate a heading, the active TOC link computes the primary colour at weight 500, the same as the removed `.toc-item.active .toc-link` rule.

**Differences the check found and fixed before the commit:**

- `border-base-300` coloured all four sides of the TOC. Only the left side has width, but the colour now comes from `border-l-base-300`, which matches the original exactly.
- The TOC `<ul>`/`<li>` picked up prose margins (17.5px on the list and 7px on each item). `m-0`/`my-0` tie with `.prose :where(ul)` on specificity, and the prose rules come later. `not-prose` on the `<ul>` fixes it; preflight already zeroes list margins, padding and markers.

**Accepted difference.** The TOC and peer-navigation links now use `transition-colors duration-200`: the 200ms duration is unchanged, and the easing is Tailwind's default `cubic-bezier(0.4, 0, 0.2, 1)` where the original used `ease`. The property list is Tailwind's colour set; the original was `all` on the peer link and `color` on the TOC link. Only colours change on hover, so the visible transition is the same.

## Gates

Each status was read directly, not through a pipe.

| Command | Exit |
|---|---|
| `bash scripts/assert-absent.sh '\$getRoute\|contexts/app/getRoute\.ts\b' -- '<routing page>'` | 0 (`absent`) |
| `grep -q 'getRoute.current(' '<routing page>'` | 0 |
| `yarn workspace @openvaa/docs check` | 0 — `612 FILES 0 ERRORS 0 WARNINGS 0 FILES_WITH_PROBLEMS` |
| `yarn workspace @openvaa/docs build` | 0 — `Wrote site to "build"` |
| `bash scripts/hygiene-changed-files.sh --check-reads --files <six files>` | 0 — `VERDICT: CLEAN`, unread=0 |
| `cd apps/docs && ../../node_modules/.bin/prettier --check <six files>` | 0 |
| `node_modules/.bin/prettier --check <six files>` (the plan's literal command) | 0, without reading the files (see Deviations) |
| `node scripts/code-identity.mjs HEAD WORKTREE apps/docs/src/lib/components/TableOfContents.svelte` (before the hygiene commit) | 0 — `code-identical` |
| `bash scripts/ledger-check.sh` | 0 — `VERDICT: PASSED` |

## Review-comment dispositions

| Comment | Disposition | Owner | Evidence | Commit | Draft reply |
|---|---|---|---|---|---|
| C-4080518476 (#884, Copilot, routing `+page.md:20`) | fix | 165-22 | `assert-absent.sh` finds neither `$getRoute` nor `contexts/app/getRoute.ts` on the page; `grep -q 'getRoute.current('` exit 0; all six linked frontend paths tracked; docs `check` and `build` exit 0 | c20063c17 | Fixed in c20063c17: the section now links `getRoute.svelte.ts` and `appContext.type.ts`, describes `AppContext.getRoute` as a handle whose `current` is the route builder, shows `getRoute.current('Results')` and `getRoute.current({ route: 'Results', electionId: ['e1', 'e2'] })`, and no longer lists `lang` as a route parameter, since the locale comes from Paraglide's URL strategy. |
| C-4106826598 (#880, kaljarv, docs half) | fix (contribution) | 165-33 owns the row | Header, NavigationItem, PeerNavigation and MdLayout have no `<style>` block; TableOfContents keeps only its four scrollbar rules, with a reason comment; computed styles unchanged, except the transition curve | 943889e29, 6837af5d6 | Left to 165-33 for its repo-wide reply. For the docs site: every component rule is now a Tailwind class, except the TOC's webkit scrollbar pseudo-elements. |

The ledger row for C-4080518476 is filled. The C-4106826598 row belongs to 165-33 and is left `pending`.

## Decisions Made

See `key-decisions` in the frontmatter.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 3 - Blocking] The plan's root-level prettier check reads nothing under `apps/docs`**
- **Found during:** Task 2
- **Issue:** The root `.prettierignore` has a bare `docs` entry, and gitignore-style matching applies it to `apps/docs`. `node_modules/.bin/prettier --check <apps/docs paths>` from the repo root therefore prints "All matched files use Prettier code style!" without checking the files. Run from `apps/docs`, which has its own config with the Tailwind class-sorting plugin, the same command flagged three of the edited files.
- **Fix:** Format and check from `apps/docs` (`../../node_modules/.bin/prettier`). All six files pass there. The plan's literal command also exits 0.
- **Commit:** 943889e29

**2. [Rule 1 - Bug] Two computed-style regressions, caught by the before/after check before the commit**
- **Found during:** Task 2
- **Issue:** Prose list margins leaked into the TOC, and the TOC border colour was set on all four sides (details under Before/after rendering check).
- **Fix:** `not-prose` on the `<ul>` and `border-l-base-300`.
- **Commit:** 943889e29

**3. [Rule 2 - Hygiene] Two TableOfContents comments that restated the next line removed**
- **Found during:** Task 3
- **Fix:** Removed `// Filter headings based on maxLevel` and `// Observe all headings`; `code-identity.mjs` confirms the change is comment-only.
- **Commit:** 6837af5d6

The plan lists `hygiene-allow/165-22.tsv` in `files_modified`, but no allowlist row was needed, so the file was not created.

## Issues Encountered

- `node_modules/.bin/eslint` reports "File ignored because no matching configuration was supplied" for the five docs components: the repo ESLint config does not cover `apps/docs`. This predates the plan and is not one of its gates.

## Known Stubs

None.

## Next Phase Readiness

- 165-33's repo-wide census of C-4106826598 can count `apps/docs` as done. The only remaining docs `<style>` block is the justified scrollbar block in `TableOfContents.svelte`.

## Self-Check: PASSED

- The six source files, `hygiene-reads/165-22.tsv` and this SUMMARY exist on disk.
- Commits `c20063c17`, `943889e29`, `6837af5d6` and `462f30243` are reachable from HEAD.
