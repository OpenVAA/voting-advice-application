---
phase: 165-review-stack-comment-remediation
plan: 33
subsystem: frontend
tags: [tailwind, style-inlining, components, header, census, comment-hygiene, e2e]

requires:
  - phase: 165-review-stack-comment-remediation
    provides: 165-22 docs-site inlining; 165-31 tailwind-classes-present.mjs and the inlining method; 165-32 question inputs, ScoreGauge and Video; 165-01 instruments (hygiene gate, read log, assert-absent, code-identity, e2e-verdict, ledger-check)
provides:
  - Header.svelte with no <style> block; its top bar, background image, progress bar and inner bar are Tailwind classes composed with cn() (C-4106826598, the anchored file)
  - EntityCard, EntityDetails, EntityInfo, InfoItem, NavItem and the privacy, candidate profile and candidate questions pages with no <style> block
  - Banner and the root layout reduced to one kept rule each, with a one-line reason
  - hoverShadedRule.test.ts that mounts EntityCard and asserts the hover-shading classes on the rendered action
  - The repo-wide style-block census (29 blocks at ship/v2.15-12-planning, 5 at the tip), the evidence for C-4106826598
affects: [165-35, 165-36]

tech-stack:
  added: []
  patterns:
    - "State-dependent background images as arbitrary-type utilities over custom properties set with style: (bg-(image:--image), bg-(size:--background-size), bg-(position:--background-position))"
    - "A disabled state driven by the component's own prop as a cn() predicate, in place of attribute and pseudo-class selectors in a scoped rule"
    - "Pseudo-element rules shared by several elements as a class-string constant (OFFSET_BORDER, INFO_GROUP), composed with cn() where an element overrides one part"
    - "A style-hook test replaced by a mount test that reads the classes off the rendered element"

key-files:
  created:
    - .planning/phases/165-review-stack-comment-remediation/scripts/hygiene-reads/165-33.tsv
  modified:
    - apps/frontend/src/lib/layouts/main/Header.svelte
    - apps/frontend/src/lib/layouts/main/Banner.svelte
    - apps/frontend/src/lib/dynamic-components/entityCard/EntityCard.svelte
    - apps/frontend/src/lib/dynamic-components/entityCard/tests/hoverShadedRule.test.ts
    - apps/frontend/src/lib/dynamic-components/entityDetails/EntityDetails.svelte
    - apps/frontend/src/lib/dynamic-components/entityDetails/EntityInfo.svelte
    - apps/frontend/src/lib/dynamic-components/entityDetails/InfoItem.svelte
    - apps/frontend/src/lib/dynamic-components/navigation/NavItem.svelte
    - apps/frontend/src/routes/+layout.svelte
    - apps/frontend/src/routes/(voters)/privacy/+page.svelte
    - apps/frontend/src/routes/candidate/(protected)/profile/+page.svelte
    - apps/frontend/src/routes/candidate/(protected)/questions/+page.svelte
    - tests/tests/specs/a11y/candidate-a11y.spec.ts
    - .planning/phases/165-review-stack-comment-remediation/165-LEDGER.md

key-decisions:
  - "Rendering parity wins over a never-applied declaration: NavItem's scoped disabled rule set `!text-secondary`, but an unlayered !important loses to the layered `!text-neutral` utility, so disabled items were measured at rgb(51, 51, 51). The inlined predicate keeps `pointer-events-none hover:bg-transparent` and drops the colour; making disabled items secondary is a one-token design change left to the maintainer"
  - "Header's inner bar keeps only `bg-(--background-color)`: the old `@apply bg-base-300` was overridden in the same rule by `background-color: var(--background-color)`, and bgColor is always set, so the base-300 token was never applied"
  - "Header's transitions use the plan's Tailwind tokens (ease-out, ease-in, transition-colors duration-500) rather than arbitrary values; the measured difference is the easing curve and transition-property list, not any rendered state"
  - "Banner keeps its :global rule, now plain `color: var(--headerIcon-color)` with no @reference; it colours links and buttons that other components render into the actions container, which variants on the container would express less clearly"
  - "The root layout keeps its reduced-motion ::view-transition rule verbatim; only its comment changed, to one line"

requirements-completed: [165-SC2, 165-SC3, 165-SC4, C-4106826598]

actuals:
  tokens: 14129
  tasks: 3
  commits: 6
plan_head_before: 5086da1396cad6a2e6a4538b99782f27197e453d
plan_head_after: 102cb20401e15b4ae4d0e295e2aeb0e9dcfbd77b

coverage:
  - id: D1
    description: "Header.svelte has no style block; every class it introduces compiles"
    requirement: "C-4106826598"
    verification:
      - kind: other
        ref: "bash scripts/assert-absent.sh '<style' -- apps/frontend/src/lib/layouts/main/Header.svelte"
        status: pass
      - kind: other
        ref: "node scripts/tailwind-classes-present.mjs --from-diff ship/v2.15-12-planning"
        status: pass
    human_judgment: false
  - id: D2
    description: "Dynamic components and route pages inlined; hover shading asserted on the rendered card"
    requirement: "C-4106826598"
    verification:
      - kind: unit
        ref: "apps/frontend/src/lib/dynamic-components/entityCard/tests/hoverShadedRule.test.ts"
        status: pass
      - kind: e2e
        ref: "tests/scripts/e2e-run.sh --run-dir tests/e2e-runs/165-33 --no-db-reset"
        status: pass
    human_judgment: false
  - id: D3
    description: "Restyled pages look the same as ship/v2.15-12-planning in light and dark mode"
    verification:
      - kind: automated_ui
        ref: "before/after computed-style capture (scratchpad cmp33/capture.ts), 25 states"
        status: pass
    human_judgment: true
    rationale: "The plan's end-of-phase human check compares the rendered pages visually; the candidate profile and questions pages were not in the automated capture"

duration: 40min
completed: 2026-09-28
status: complete
---

# Phase 165 Plan 33: Style-Block Inlining, Part 3 (Header, Banner, Dynamic Components, Route Pages) and the Repo-Wide Census Summary

**Header.svelte is Tailwind classes composed with `cn()` and has no `<style>` block. The dynamic components and the three route pages have none either. Banner and the root layout keep one rule each, with a reason. Across `apps/frontend/src` and `apps/docs/src`, 29 component style blocks at `ship/v2.15-12-planning` are down to 5, and every remaining rule is one Tailwind cannot express. E2E is GREEN at 165/0/0/0.**

## Performance

- **Duration:** about 40 min
- **Started:** 2026-09-28T07:31:02Z
- **Completed:** 2026-09-28T08:10:46Z
- **Tasks:** 3 of 3
- **Files modified:** 12 components and pages, their unit test, one E2E spec comment, the read log and the ledger

## Accomplishments

- **Header (C-4106826598, the anchored file).**
  - The header is `cn('… min-h-0 transition-[min-height] duration-250 ease-out', imageSrc && 'min-h-[40vh] items-start bg-(image:--image) bg-(size:--background-size) bg-(position:--background-position) bg-no-repeat ease-in')`.
  - The progress bar carries `rounded-none` and the same on its three vendor pseudo-elements (`[&::-moz-progress-bar]:`, `[&::-webkit-progress-bar]:`, `[&::-webkit-progress-value]:`).
  - The inner bar carries `bg-(--background-color) transition-colors duration-500`.
  - The `top-bar`, `prominent-top-bar-with-background` and `inner-actions-bar` hook classes are gone; nothing in `apps` or `tests` selected on them.
- **EntityCard.** The subcard rule is `OFFSET_BORDER` (the `after:` 1px rule above a subcard), the hover shading is `HOVER_SHADE`, applied as `cn('transition-all !text-neutral', shadeOnHover && HOVER_SHADE)`. `class:hover-shaded` and the `offset-border` / `hover-shaded` classes are gone.
- **EntityDetails, EntityInfo, InfoItem.** The single-tab bottom rule is a `cn()` predicate on the header; the info-group rule is the `INFO_GROUP` constant; InfoItem's grid orientation is a `cn()` choice between the two class sets. `test-label` stays: `voter-journey.spec.ts` selects on it.
- **NavItem.** The disabled state is `disabled && 'pointer-events-none hover:bg-transparent'`, from the component's own `disabled` prop, which drives both the `<button disabled>` and the `<a aria-disabled>` branches. No caller passes a `disabled` class.
- **Route pages.** The privacy page's three authored `h2`s carry `mt-lg mb-md`; the candidate profile's three `section`s carry `mt-lg self-stretch`; the candidate questions card carries the `before:` row line directly.
- **Banner.** The `:global` rule stays, as plain CSS with a reason line (see the census).
- **hoverShadedRule.test.ts.** Mounts `EntityCard` against a fake app context and asserts the four shading classes on a subcard's action and their absence on a list card's action.
- **Comment hygiene.** Three comment-only commits (`code-identity.mjs`: code-identical). The root layout lost its planning ids (`162-08 Q4`, `162.1 D-16`, `research C-2`, `decision B2`, `NAVA11Y-02`), a line-number reference and its historical narrative; EntityCard, EntityDetails, InfoItem, Banner, the questions and profile pages lost narrative, stale docs and typos; `candidate-a11y.spec.ts` no longer names the removed `vaa-button-label` class.

## Task Commits

1. **Task 1: Header (tracer).** `cc2550ff0` (style). Tracer gate: build, class checker (0 missing), `assert-absent.sh '<style'` (exit 0) and `check` (0/0) passed before any expansion.
2. **Task 2: dynamic components, Banner, route pages, hover test.** `237e2e8ff` (style).
3. **Task 3: census, hygiene, E2E.**
   - `7bfcd55bc` (docs, comment-only, `Hygiene: D-04`)
   - `c9263f5ea` (docs, comment-only, `Hygiene: D-04`)
   - `7fc1a849d` (chore, read log)
   - `102cb2040` (docs, ledger row)

## Style-block census

`git grep -l '<style' -- 'apps/frontend/src/**/*.svelte' 'apps/docs/src/**/*.svelte'` at `ship/v2.15-12-planning` lists 29 files. At the tip it lists 5. Every remaining rule:

| File | Rule | Reason (as written in the file) |
|---|---|---|
| `apps/frontend/src/lib/components/scoreGauge/ScoreGauge.svelte` | `progress::-moz-progress-bar` | Firefox's progress-bar fill, a vendor pseudo-element with no utility form. |
| same | `progress::-webkit-progress-value` | Chrome's and Safari's progress-bar fill, a vendor pseudo-element with no utility form. |
| same | `.radial-progress:before` (radial and conic gradients over base-300) | DaisyUI's radial-progress gradient with a base-300 layer added, which draws the full circle behind the value. |
| `apps/frontend/src/lib/components/video/Video.svelte` | `:global(video::cue)` | Caption text: `::cue` is a browser-generated pseudo-element, which takes no class. |
| same | `:global(video::-webkit-media-text-track-display)` | Padding and corners of WebKit's generated caption box. |
| same | `:global(video::-webkit-media-text-track-container)` | Lifts WebKit's generated caption container above the controls; `translate` works in both Chrome and Safari, where `bottom` has no effect in Safari. |
| same | `:global(.video-transcript img)`, `figure img`, `figure`, `figcaption`, `h1`–`h4` (5 rules) | The transcript is injected HTML, which takes no class, so its images, figures and headings are styled here. |
| `apps/frontend/src/lib/layouts/main/Banner.svelte` | `:global(.vaa-basicPage-actions > a:not([aria-disabled='true']), … > * > a…, > button:not([disabled]), > * > button…)` | Colours the enabled links and buttons that other components render into the actions container; a disabled link carries `aria-disabled`, a disabled button `disabled`. |
| `apps/frontend/src/routes/+layout.svelte` | `@media (prefers-reduced-motion: reduce) { :global(::view-transition-group(*)), …-old(*), …-new(*) { animation: none !important } }` | Stops every view-transition animation under reduced motion; the media query wraps the `:global` selectors because Svelte's CSS parser rejects an at-rule nested inside `:global`. |
| `apps/docs/src/lib/components/TableOfContents.svelte` | `.toc::-webkit-scrollbar`, `-track`, `-thumb`, `-thumb:hover` | The scrollbar is a browser-generated pseudo-element, which Tailwind has no utility for. |

These are exactly the groups the plan allows: Video's caption and transcript rules, ScoreGauge's vendor pseudo-elements and gradient, the root layout's reduced-motion rule, and justified `:global` / pseudo-element rules (Banner's, from this plan; the docs TOC's, from 165-22).

**The 24 files inlined, by plan.**

| Plan | Files | Commits |
|---|---|---|
| 165-22 | docs `Header`, `NavigationItem`, `PeerNavigation`, `MdLayout` (and `TableOfContents` down to its scrollbar rules) | 943889e29 |
| 165-31 | `ImagePart`, `Input`, `SelectMultiplePart`, `Alert`, `Button`, `Toggle`, `InputGroup`, `Expander` | aaf103c0f, 385363a9f, 506bc460a |
| 165-32 | `QuestionChoices`, `NumberScaleInput`, `QuestionOpenAnswer` (and `ScoreGauge`, `Video` down to the rules above) | df30baed5, 387396c7a, 874e0322c, 7c605e9fb |
| 165-33 | `Header`, `EntityCard`, `EntityDetails`, `EntityInfo`, `InfoItem`, `NavItem`, privacy, candidate profile and candidate questions pages (and `Banner`, the root layout down to one rule each) | cc2550ff0, 237e2e8ff |

`git grep -l '<style' -- apps/frontend/src/lib/dynamic-components` prints nothing (exit 1). Outside those two trees, `<style>` blocks appear only in `.claude/skills/spike-findings-voting-advice-application-gsd/sources/**`, the spike experiments' archived code, which is not shipped.

## Before/after rendering check

**Method.** As in 165-32:
- The `e2e/base` template was seeded into the default project, and a dev server for this checkout ran on port 5299.
- The plan-start versions of all eleven files were swapped in, the server restarted, and a Playwright script (Chromium, 1400×900, reduced motion) recorded 70 computed properties, `::before` and `::after`, and the bounding box of every element under each root.
- The current versions were swapped back, the server restarted, and the capture repeated.
- **States (light and dark):** the home page header with the background image; the open navigation menu with its two `aria-disabled` items; the candidate login header; the privacy page; the candidates results list, with the first card hovered; the parties list with subcards, at rest, with a card header hovered and with a subcard hovered; party details and candidate details (info tab); the alliances list; and a question page with the progress bar.

**Result.** 31 property differences, all on the header, all in transitions or an equivalent keyword:
- `align-items: start` → `flex-start` on the prominent header (4×). In a single-line row flex container the two place items identically; every box is identical.
- `transition-timing-function` `ease-out` / `ease-in` → Tailwind's `cubic-bezier(0, 0, 0.2, 1)` / `cubic-bezier(0.4, 0, 1, 1)` on the header (9×).
- The inner bar's `transition-property: background-color` → Tailwind's colour list, and `ease` → `cubic-bezier(0.4, 0, 0.2, 1)` (18×).

No colour, background, border, shadow, spacing or box differs. The hovered subcard's shading (`oklab(… / 0.2)` background and the 4px ring) and the 74 `::after` offset rules are identical before and after. Disabled navigation items were `rgb(51, 51, 51)` with `pointer-events: none` before, and still are.

**Not in the capture.** The candidate profile and questions pages need a registered candidate session. Their classes are the removed rules' values on the same elements, with no competing class on those elements. The single-tab `EntityDetails` bottom rule is not reached by the base settings; its compiled rule is `after:border-b-[var(--line-color)]` → `border-bottom-color: var(--line-color)`, the old value. The progress bar's vendor pseudo-elements take no `getComputedStyle`; their compiled rules are `border-radius: var(--radius-none)` in the utilities layer, above daisyUI's sublayered `.progress::-webkit-progress-*` radius.

**Cleanup.** `yarn db:seed:teardown --prefix test-e2e-base-` deleted 142 rows and 30 storage objects. The default project's `app_settings.settings` is `{}` again (it had also still held the settings 165-32 could not reset). The project has 0 elections, 0 questions and 0 nominations, and the one candidate that predates both seeds.

## Gates

Each status was read directly, not through a pipe (final run on the tip).

| Command | Exit |
|---|---|
| `yarn workspace @openvaa/frontend build` | 0 |
| `node scripts/tailwind-classes-present.mjs --from-diff ship/v2.15-12-planning` plus the classes of `OFFSET_BORDER`, `HOVER_SHADE`, `INFO_GROUP` and the NavItem predicate passed explicitly | 0 — 172 classes, 0 missing |
| `bash scripts/assert-absent.sh '<style' -- apps/frontend/src/lib/layouts/main/Header.svelte` | 0 |
| `yarn workspace @openvaa/frontend check` | 0 — 2781 files, 0 errors, 0 warnings |
| `yarn workspace @openvaa/frontend test:unit` | 0 — 108 files, 1888/1888 |
| `TURBO_FORCE=true yarn lint:check` | 0 |
| `node scripts/code-identity.mjs HEAD WORKTREE <files>` before each comment-only commit | 0 — code-identical (7, then 2) |
| `bash scripts/hygiene-changed-files.sh --check-reads --files <235 committed branch files, .planning/ dropped>` | 0 — `VERDICT: CLEAN`, unread=0 |
| `bash scripts/tip-proofs.sh` | 0 |
| `bash scripts/ledger-check.sh` | 0 — `VERDICT: PASSED` |
| `tests/scripts/e2e-run.sh --run-dir tests/e2e-runs/165-33 --no-db-reset` | 0 — 165 passed (10.9m), preflight failures 0 |
| `node scripts/e2e-verdict.mjs "$(ls -d tests/e2e-runs/165-33* \| sort \| tail -1)"` | 0 — `VERDICT: GREEN (expected 165 >= 165, 0 failed, 0 flaky, 0 did-not-run)` |
| `git diff --name-only ship/v2.15-12-planning HEAD -- apps/frontend/src/lib/layouts/main/MainContent.svelte` | empty — no commit touches it |

**E2E verdict:** GREEN 165/0/0/0, `tests/e2e-runs/165-33`, on the first run.

**Hover test red runs** (scratch edits to `EntityCard.svelte`, restored byte-identical with `cmp`):
- `HOVER_SHADE = ''`: "shades a clickable subcard on hover" fails (`expected "transition-all !text-neutral" to contain "rounded-md"`), 1 failed / 1 passed.
- Shading applied regardless of `shadeOnHover`: "does not shade a clickable list card" fails (`… not to contain "rounded-md"`), 1 failed / 1 passed.

## Review-comment dispositions

| Comment | Disposition | Owner | Evidence | Commit | Draft reply |
|---|---|---|---|---|---|
| C-4106826598 (#880, kaljarv, `Header.svelte:100`) | fix | 165-33 | The census above: 29 component style blocks → 5, each remaining rule with a reason. `assert-absent.sh '<style' -- Header.svelte` exit 0. Class checker 0 missing. Before/after computed styles identical apart from the header's transition curves. E2E GREEN 165/0/0/0. | 943889e29 (165-22); aaf103c0f, 385363a9f, 506bc460a (165-31); df30baed5, 387396c7a, 874e0322c, 7c605e9fb (165-32); cc2550ff0, 237e2e8ff (165-33) | Done across the repo: Header is now Tailwind classes composed with `cn()` (cc2550ff0), and 24 of the 29 component style blocks are gone. CSS remains only where Tailwind has no form, each rule with a one-line reason: ScoreGauge's vendor progress pseudo-elements and radial gradient, Video's caption pseudo-elements and injected-transcript rules, Banner's `:global` rule over the actions other components render, the root layout's reduced-motion `::view-transition` rule, and the docs TOC's scrollbar pseudo-elements. |

The ledger row is filled (`102cb2040`), and `ledger-check.sh` passes.

## For the end-of-phase visual check

Compare with `ship/v2.15-12-planning`, in light and dark mode:
- The voter home page (header over the background image) and a results page (header without it), including the header's height change when moving between them.
- The results lists: candidate cards, party cards with subcards (hover a card header and a subcard), and the "show all candidates" button's rule.
- Entity details (info tab), and an entity type configured with a single tab.
- The navigation menu with a disabled item (the current language).
- The banner actions (help, feedback, results).
- The privacy page, and the candidate profile and questions pages.

## Decisions Made

See `key-decisions` in the frontmatter. One needs the maintainer: disabled navigation items were always neutral, because the scoped `!text-secondary` never won. If they were meant to be secondary, adding `!text-secondary` to NavItem's `disabled &&` predicate restores that intent.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] NavItem's disabled colour never applied**
- **Found during:** Task 2, before/after capture.
- **Issue:** The plan's inlined form `!text-secondary pointer-events-none hover:bg-transparent` would have changed disabled items from neutral to secondary. The old unlayered `!important` colour lost to the layered `!text-neutral` utility.
- **Fix:** The predicate keeps `pointer-events-none hover:bg-transparent` only, so the rendering is unchanged. The decision is flagged above.
- **Files modified:** NavItem.svelte
- **Commit:** 237e2e8ff

**2. [Rule 2 - Hygiene] Comment residue in files this plan touched**
- **Found during:** Task 3.
- **Issue:** Touching the root layout brought it into the branch's changed set for the first time. The gate flagged two planning ids, and the read found three more, historical narrative, a line-number reference and a reflowed comment. EntityDetails had planning ids in markup comments (`Pattern 2`, `O-1`). EntityCard, Banner, the questions and profile pages had narrative or stale comments (one claimed that saving the profile requests an email). EntityDetails and InfoItem had stale docs.
- **Fix:** Two comment-only commits, code-identical by `code-identity.mjs`.
- **Commits:** 7bfcd55bc, c9263f5ea

**3. [Rule 2 - Hygiene] `candidate-a11y.spec.ts` named the removed `vaa-button-label` class**
- **Found during:** Task 3 (the stale reference 165-31 left to this census).
- **Issue:** The comment named a class 165-31 removed. The file had not been changed on the branch before, and the gate flagged a planning id (`157-10`) in it; the read found narrative ("the scout measured", "re-taken").
- **Fix:** The comment says "a button label"; the residue is rewritten in the same comment-only commit.
- **Commit:** 7bfcd55bc

The plan's literal `hygiene-changed-files.sh --base ship/v2.15-12-planning --check-reads` would include the maintainer's uncommitted `MainContent.svelte` and `.planning/milestone.lock`. Per the orchestrator notes, the gate ran over the committed branch set (`ship/v2.15-12-planning...HEAD`) through `--files`, with `.planning/` paths dropped.

`hygiene-allow/165-33.tsv` is listed in `files_modified`, but no allowlist row was needed, so the file was not created.

**Total deviations:** 3 auto-fixed (1 bug, 2 hygiene). **Impact:** none on rendering; the comment fixes are code-identical.

## Issues Encountered

- zsh does not split an unquoted variable into words, and macOS bash has no `mapfile`. Route paths with parentheses were passed to the gates through a small scratch helper that reads a path list into an array.

## Known Stubs

None.

## Threat Flags

None. T-165-54 is mitigated: the reduced-motion rule is unchanged, the disabled state keeps its effect, every class compiles, and the a11y scans in the full E2E suite are green.

## Next Phase Readiness

- C-4106826598's ledger row is complete. The gate plans (165-35, 165-36) can use the census as the thread's evidence.
- Every component style block in the repository now follows D-10.

## Self-Check: PASSED

- `Header.svelte`, `hoverShadedRule.test.ts`, `hygiene-reads/165-33.tsv` and this SUMMARY exist on disk.
- Commits `cc2550ff0`, `237e2e8ff`, `7bfcd55bc`, `c9263f5ea`, `7fc1a849d` and `102cb2040` are reachable from HEAD.
- `MainContent.svelte` still shows only the maintainer's unstaged modification. No commit of this plan touches it or `.planning/milestone.lock`.
