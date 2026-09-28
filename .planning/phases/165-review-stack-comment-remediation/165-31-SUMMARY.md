---
phase: 165-review-stack-comment-remediation
plan: 31
subsystem: frontend
tags: [tailwind, style-inlining, components, a11y, comment-hygiene]

requires:
  - phase: 165-review-stack-comment-remediation
    provides: 165-01 instruments (hygiene gate, read log, assert-absent, code-identity, e2e-verdict, ledger-check)
provides:
  - tailwind-classes-present.mjs, which proves that each introduced utility class compiles to a rule in the production CSS
  - ImagePart badge styling as Tailwind classes (C-4106608766)
  - Eight frontend components without a `<style>` block (the input family, Alert, Button, Toggle, InputGroup, Expander); this plan's share of C-4106826598 / D-10
affects: [165-32, 165-33, 165-36]

tech-stack:
  added: []
  patterns:
    - "State styling through variants on the element that owns the state: `group` on the button with `group-disabled:` / `group-aria-disabled:` / `group-[.disabled]:` on its label, `has-checked:` on a toggle label, and `peer` on the collapse checkbox with `peer-checked:` on the content"
    - "Styling descendants rendered by child components through an arbitrary variant on the container (`[&>:not(:first-child)_.vaa-group-join-item]:rounded-t-none`), in place of a `:global` rule"
    - "Tailwind utilities sit directly in `@layer utilities`, while daisyUI sits in nested `daisyui.l1.l2.l3` sublayers of it, so a utility such as `min-h-0` overrides daisyUI's collapse min-height regardless of specificity"

key-files:
  created:
    - .planning/phases/165-review-stack-comment-remediation/scripts/tailwind-classes-present.mjs
    - .planning/phases/165-review-stack-comment-remediation/scripts/hygiene-reads/165-31.tsv
  modified:
    - apps/frontend/src/lib/components/input/parts/ImagePart.svelte
    - apps/frontend/src/lib/components/input/Input.svelte
    - apps/frontend/src/lib/components/input/parts/SelectMultiplePart.svelte
    - apps/frontend/src/lib/components/alert/Alert.svelte
    - apps/frontend/src/lib/components/button/Button.svelte
    - apps/frontend/src/lib/components/toggle/Toggle.svelte
    - apps/frontend/src/lib/components/input/InputGroup.svelte
    - apps/frontend/src/lib/components/expander/Expander.svelte
    - .planning/phases/165-review-stack-comment-remediation/165-LEDGER.md

key-decisions:
  - "No CSS rule is kept in any of the eight components: InputGroup's two `:global` join-item rules and Expander's checked-content padding rule both compile as variants and read clearly"
  - "Button's label dimming uses `group` on the button element itself, so the dimming now follows the button's own disabled state rather than any `[disabled]` ancestor; a button inside a disabled fieldset is still `:disabled`, so the rendering is the same"
  - "The class checker treats `group` and `peer` as markers (no rule of their own by design) and follows `cn(` calls across lines; classes assembled in plain string variables are passed to it explicitly"
  - "Hook class names left with no rule and no consumer (`required-badge`, `locked-badge`, `vaa-alert-hidden`, `vaa-button-label`, `vaa-input-container`, `not-rotated-icon`, `rotated-icon`) are removed; `vaa-group-join-item` stays, as the InputGroup variant selects on it"

requirements-completed: [165-SC2, 165-SC3, 165-SC4, C-4106608766]

actuals:
  tokens: 4897
  tasks: 3
  commits: 6
plan_head_before: d6170e29c787517ce75413823d81b89271a8cb86
plan_head_after: 3789408b9ce1ec607c41a53df141267deef689b7

duration: 25min
completed: 2026-09-28
status: complete
---

# Phase 165 Plan 31: Style-Block Inlining, Part 1 (Input Family and Base Components) Summary

**ImagePart, Input, SelectMultiplePart, Alert, Button, Toggle, InputGroup and Expander have no `<style>` block. Their rules are now Tailwind classes and state variants, and a compiled-CSS checker confirms that every introduced class generates a rule. E2E is GREEN at 165/0/0/0.**

## Performance

- **Duration:** about 25 min
- **Started:** 2026-09-28T05:48:56Z
- **Completed:** 2026-09-28T06:13:33Z
- **Tasks:** 3 of 3
- **Files modified:** 8 components, plus the checker, the read log and the ledger

## Accomplishments

- **ImagePart (C-4106608766).** The required badge carries `text-warning`, the locked badge `text-secondary`, and each badge's label `sr-only`. `Input` and `SelectMultiplePart` had the identical block and are inlined the same way.
- **Alert.** The hidden state is `cn(..., !isOpen && 'translate-y-full opacity-0')`. The class string that was built by `+` concatenation is now composed with `cn()`.
- **Button.** `group` is on the button. The label carries `group-disabled:text-neutral/20 group-aria-disabled:text-neutral/20 group-[.disabled]:text-neutral/20`, composed with `cn()`.
- **Toggle.** The option label carries `has-checked:bg-neutral has-checked:text-primary-content`.
- **InputGroup.** The container squares the joined edges with `[&>:not(:first-child)_.vaa-group-join-item]:rounded-t-none` and `[&>:not(:last-child)_.vaa-group-join-item]:rounded-b-none`, composed with `cn()` in place of a `{joinGap}` interpolation.
- **Expander.**
  - The icon has `transition-transform duration-200 ease-linear` plus `rotate-90`, or `rotate-270` when expanded.
  - The title and the collapse checkbox carry `min-h-0`.
  - The checkbox is a `peer`, and the content carries `peer-checked:py-md peer-checked:transition-[padding]`.
- **`tailwind-classes-present.mjs`.**
  - Reads every stylesheet under `apps/frontend/.svelte-kit/output/client/_app/immutable/assets/`, unescapes the class selectors, and reports each requested class as `present` or `MISSING`.
  - `--from-diff <rev>` collects class tokens on lines added in `apps/frontend/src/**/*.svelte`, from `class="…"`, `class={…}`, `class:` and single- or multi-line `cn(` calls.
  - Exits 0 when every class is present, 1 when any is missing, and 2 when there is no build output.

## Task Commits

1. **Task 1: ImagePart end to end, with the class checker (tracer)**: `aaf103c0f` (style). The tracer gate passed: the build, the checker (`text-secondary text-warning sr-only`, exit 0), `check` (0/0) and `assert-absent.sh '<style'` (exit 0) were re-run before any expansion task.
2. **Task 2: Input, SelectMultiplePart, Alert, Button, Toggle**: `385363a9f` (style). This commit also carries the checker's multi-line `cn(` support and marker handling.
3. **Task 3: InputGroup, Expander, hygiene and E2E**:
   - `506bc460a` (style)
   - `a69a2e5b0` (docs, comment-only, `Hygiene: D-04`)
   - `ffb9fa269` (chore, read log)
   - `3789408b9` (docs, ledger row)

## Kept CSS

None. `assert-absent.sh '<style'` exits 0 over all eight files. Neither of the rules the plan allowed this plan to keep was needed:

| Candidate rule | Replacement | Why it is equivalent |
|---|---|---|
| InputGroup `:global(.vaa-input-container > :not(:first-child) .vaa-group-join-item)` (and `:not(:last-child)`) | Arbitrary variants on the container | Compiled to `.\[…\]\:rounded-t-none>:not(:first-child) .vaa-group-join-item{border-top-*-radius:var(--radius-none)}`. At specificity (0,3,0) in the utilities layer, it beats the join item's own `rounded-lg`. |
| Expander `.collapse:not(.collapse-close) > input:checked ~ .collapse-content { py-md; transition-[padding] }` | `peer` on the checkbox, `peer-checked:py-md peer-checked:transition-[padding]` on the content | Compiles to `:is(:where(.peer):checked~*)`. At (0,2,0) it still overrides the `category` variant's `pt-lg`, as the unlayered rule did, and it outranks daisyUI's sublayered padding and transition rules. |

The `:not(.collapse-close)` guard is not reproduced: no caller passes `collapse-close`.

## Equivalence reasoning

The plan does not include a before/after computed-style harness. The live components render only with the seeded E2E stack, and the plan's local evidence is the class checker, the a11y scans and the end-of-phase visual check. The compiled CSS was read instead:

- **Removed style blocks were unlayered.** Their Svelte-scoped rules outranked any layered class, whatever its specificity. For each replacement, the new utility wins over every competing class:
  - Badge colour and Alert hide: no competing class on the element.
  - Button label: `group-*` at (0,2,0) beats the label's `text-${color}` at (0,1,0).
  - Toggle: `has-checked:` utilities beat `small-label`'s `text-secondary`, which is in `@layer components`.
  - Expander: `min-h-0` and `peer-checked:` beat daisyUI, which sits in nested sublayers of `utilities`.
- **Same values.**
  - `translate-y-full` is `--tw-translate-y: 100%`, the old `translate-y-[100%]`.
  - `rotate-90` / `rotate-270` set the `rotate` property instead of `transform: rotate()`, which gives the same angle and the same 90°→270° interpolation. `transition-transform` includes `rotate`, and `duration-200 ease-linear` matches the old `0.2s linear`.
  - `--spacing-0`, `--radius-none`, `--default-transition-duration` and `--default-transition-timing-function` are all defined in the compiled theme (0px, 0px, .15s, cubic-bezier(.4,0,.2,1)).
- **Accepted difference.** Button's label rule matched any `[disabled]` / `.disabled` / `[aria-disabled=true]` ancestor. It now matches only the button, which is the `group`. A button inside a disabled fieldset is itself `:disabled`, and no caller passes `class="disabled"` to a `Button`, so no rendered output changes. No other element in `apps/frontend/src` uses a `group-*` variant, so the new `group` cannot capture foreign descendants.

## Gates

Each status was read directly, not through a pipe (final run after the last source commit).

| Command | Exit |
|---|---|
| `yarn workspace @openvaa/frontend build` | 0 |
| `node scripts/tailwind-classes-present.mjs --from-diff ship/v2.15-12-planning peer-checked:py-md 'peer-checked:transition-[padding]' min-h-0` | 0 — 52 classes, 0 missing (`group` and `peer` reported as markers) |
| `node scripts/tailwind-classes-present.mjs this-class-does-not-exist-165` | 1 — `MISSING` (the checker goes red) |
| `bash scripts/assert-absent.sh '<style' -- <eight components>` | 0 |
| `yarn workspace @openvaa/frontend check` | 0 — `2781 FILES 0 ERRORS 0 WARNINGS` |
| `yarn workspace @openvaa/frontend test:unit` | 0 — 108 files, 1888/1888 |
| `TURBO_FORCE=true yarn lint:check` | 0 |
| `node scripts/code-identity.mjs HEAD WORKTREE <Alert, Expander, Input, InputGroup>` (before the hygiene commit) | 0 — `code-identical` ×4 |
| `bash scripts/tip-proofs.sh` | 0 |
| `bash scripts/hygiene-changed-files.sh --check-reads --files <210 committed branch files>` | 0 — `VERDICT: CLEAN`, unread=0 |
| `tests/scripts/e2e-run.sh --run-dir tests/e2e-runs/165-31 --no-db-reset` | 0 — 165 passed (11.0m), preflight successes 1, failures 0 |
| `node scripts/e2e-verdict.mjs tests/e2e-runs/165-31` | 0 — `VERDICT: GREEN (expected 165 >= 165, 0 failed, 0 flaky, 0 did-not-run)` |
| `bash scripts/ledger-check.sh` | 0 — `VERDICT: PASSED` |

`git grep -n 'vaa-alert-hidden' -- apps tests` finds no reference (exit 1).

**E2E verdict:** GREEN 165/0/0/0, `tests/e2e-runs/165-31`.

## Review-comment dispositions

| Comment | Disposition | Owner | Evidence | Commit | Draft reply |
|---|---|---|---|---|---|
| C-4106608766 (#880, kaljarv, `ImagePart.svelte:104`) | fix | 165-31 | No `<style>` block in `ImagePart`, `Input` or `SelectMultiplePart`. The badges carry `text-warning` / `text-secondary`, and their labels `sr-only`. The class checker finds a compiled rule for each. E2E GREEN 165/0/0/0, a11y scans included. | aaf103c0f, 385363a9f | Inlined in aaf103c0f: the badges now carry `text-warning` / `text-secondary` and their labels `sr-only`, and the style block is gone. `Input` and `SelectMultiplePart` had the same block and are inlined the same way (385363a9f). |
| C-4106826598 (#880, kaljarv, frontend share, part 1) | fix (contribution) | 165-33 owns the row | Eight components have no `<style>` block, and none keeps a CSS rule (see Kept CSS). | aaf103c0f, 385363a9f, 506bc460a | Left to 165-33 for its repo-wide reply. For this part: the input family, Alert, Button, Toggle, InputGroup and Expander are styled entirely by Tailwind classes. |

The C-4106608766 ledger row is filled. The C-4106826598 row belongs to 165-33 and stays `pending`.

## For the end-of-phase visual check

Compare with `ship/v2.15-12-planning`, in light and dark mode:

- The candidate profile editor: image input, locked and required badges, a multi-select input, and the joined input groups.
- Any page showing an alert or popup, including its slide-in and slide-out.
- Disabled buttons.
- A toggle (video/text).
- An expander, including the icon rotation and the open-content padding of a `category` expander on the candidate questions page.

## Decisions Made

See `key-decisions` in the frontmatter.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 3 - Blocking] `--from-diff` could not see multi-line `cn(` calls or plain string variables**
- **Found during:** Task 2
- **Issue:** Prettier breaks the new `cn(` calls across lines. Button's and Expander's classes are also built in plain string variables, which no `class=` / `cn(` pattern matches.
- **Fix:** The checker now carries the open-paren depth of a `cn(` call across consecutive added lines. Classes built in string variables (`peer-checked:*`, `min-h-0`, `group-*:text-neutral/20`, `first-letter:uppercase`) were passed to it explicitly. It also reports `group` and `peer` as markers, since Tailwind generates no rule for them by design.
- **Commit:** 385363a9f

**2. [Rule 2 - Hygiene] Comment residue in the changed components**
- **Found during:** Task 3
- **Issue:**
  - `Input.svelte` had a narrative comment ("no longer pins … now that"), which the gate flagged.
  - Alert's close-button comment cited a planning decision id, "the review's suggestion" and line numbers.
  - Expander had two historical-narrative comments ("The original code mutated…", "Svelte 5: … instead of mutating…").
  - Also fixed: typos (`containarProps`, `locale.Button`, `toggle.render`, `componend`, `checkbow`, `non-model`), Input's `5.x` sub-numbering under section 6, Expander's stale `### Events` section (it now lists the `onExpand` / `onCollapse` callbacks), InputGroup's `### Slots` section (now `children`), and an empty `Styling` banner.
- **Fix:** Comment-only commit. `code-identity.mjs` confirms that no code changed.
- **Commit:** a69a2e5b0

The plan lists `hygiene-allow/165-31.tsv` in `files_modified`, but no allowlist row was needed, so the file was not created.

The plan's literal `hygiene-changed-files.sh --base ship/v2.15-12-planning --check-reads` includes the maintainer's uncommitted `MainContent.svelte` and `.planning/milestone.lock`. The gate therefore ran over the committed branch set (`ship/v2.15-12-planning...HEAD`, exempt trees dropped) through `--files`, as the orchestrator's notes prescribe.

## Issues Encountered

- Running `node_modules/.bin/eslint` from the repo root reports "File ignored because no matching configuration was supplied" for frontend `.svelte` files. It was run from `apps/frontend` instead, and `yarn lint:check` covers the frontend config.
- The a11y spec `tests/tests/specs/a11y/candidate-a11y.spec.ts` names `vaa-button-label` in a descriptive comment about a past contrast measurement. That class name is now removed from `Button`. The spec's assertions do not select on it, and the comment is left to the repo-wide census in 165-33.

## Known Stubs

None.

## Next Phase Readiness

- 165-32 and 165-33 can count these eight components as done for C-4106826598. None keeps a `<style>` block.
- `tailwind-classes-present.mjs` is ready for the remaining style-inlining plans. For classes built in string variables, pass them explicitly next to `--from-diff`.

## Self-Check: PASSED

- The eight components, `tailwind-classes-present.mjs`, `hygiene-reads/165-31.tsv` and this SUMMARY exist on disk.
- Commits `aaf103c0f`, `385363a9f`, `506bc460a`, `a69a2e5b0`, `ffb9fa269` and `3789408b9` are reachable from HEAD.
- `MainContent.svelte` still shows only the maintainer's unstaged modification, and no commit of this plan touches it.
