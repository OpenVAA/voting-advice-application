---
phase: 167-origin-main-vestige-cleanup
plan: 05
subsystem: docs-ui
tags: [svelte5, runes, sveltekit, app-state, tailwind-v4, env-loading, comment-hygiene]

requires:
  - phase: 167-origin-main-vestige-cleanup
    provides: 167-04 commit ④ (ddcd396ef) left a clean tree with the docs app checking and building
provides:
  - commit ⑤ (dad0754fe) refactor[docs]. PeerNavigation reads `page` from `$app/state` through `$derived`. OpenVAALogo uses `$props()` with `...restProps`, `$derived.by`, the rest props spread onto the `svg`, and `class` merged inline. The colour default is documented as `'primary'`
  - commit ⑥ (a02f3362e) docs[frontend]. The comment above `resolveProjectIdEnv` in `apps/frontend/vite.config.ts` now describes how env loading works today
  - a render probe showing the Header and Footer class strings are byte-identical before and after, and that extra attributes now reach the svg
  - a sweep-#14 measurement under `git grep -P` with a positive control. All eleven patterns and `$app/stores` count 0
affects: [167-06, 168]

actuals:
  tokens: 1387
  tasks: 3
  commits: 2
plan_head_before: 18f8c2c05601888f2672a7c25db37b647aa40d8a
plan_head_after: a02f3362e2f407a0b43e7fa253ef144d6e257cfa

tech-stack:
  added: []
  patterns:
    - "Server-render probe for a Svelte component: compile with `svelte/compiler` `generate: 'server'`, import the emitted JS, and render with `svelte/server` for fixed prop sets. Compare the opening tag's `class` attribute before and after. Keep the script inside the owning workspace so bare `svelte/...` specifiers resolve, and delete it before the commit"
    - "Sweep counts come from `git grep -P` with its rc read directly (1 = no match, 128 = error). A positive control first runs the same pattern against the phase base to show the measurement can see what it measures"

key-files:
  created: []
  modified:
    - apps/docs/src/lib/components/PeerNavigation.svelte
    - apps/docs/src/lib/components/openVAALogo/OpenVAALogo.svelte
    - apps/docs/src/lib/components/openVAALogo/OpenVAALogo.type.ts
    - apps/frontend/vite.config.ts

key-decisions:
  - "The logo keeps both the literal fill switch and the trailing `fill-${color}` append. That reproduces the old class string byte for byte, doubled `fill-primary inline` included. The literals are the only `fill-*` occurrences in apps/docs, so they keep Tailwind v4 emitting `.fill-primary`, `.fill-secondary` and `.fill-neutral`"
  - "The new docstring bullet uses the frontend twin's wording, 'Any valid attributes of a `<svg>` element.', to match the header's existing `<svg>` phrasing"
  - "VEST-05 is marked complete here, because both ports, the unchanged render and the zero sweep all land in ⑤. VEST-06 is NOT marked: its comment half lands in ⑥, but the todo closure is 167-06's"

patterns-established:
  - "`git grep -E '^\\s*\\$:'` returns a false zero on this host (Apple Git 2.50.1). Re-confirmed here: the -E form exits 1 with 0 lines against the phase base, and the -P form finds both files"

requirements-completed: [VEST-05]

coverage:
  - id: D1
    description: "PeerNavigation.svelte reads page from $app/state and derives peerNav with $derived. The repo has no $app/stores import and no `$:` statement left in that file"
    requirement: VEST-05
    verification:
      - kind: other
        ref: "git grep -n -F '$app/stores' -- apps packages -> rc 1, 0 lines; git grep -n -P '^\\s*\\$:' -- apps/docs/src/lib/components/PeerNavigation.svelte -> rc 1; yarn workspace @openvaa/docs check -> exit 0 (611 files, 0 errors, 0 warnings); docs build -> exit 0"
        status: pass
    human_judgment: false
  - id: D2
    description: "OpenVAALogo.svelte (docs) uses $props() with ...restProps and $derived.by, spreads restProps onto the svg and merges class inline. Header and Footer render byte-identical class strings, and extra attributes now reach the svg"
    requirement: VEST-05
    verification:
      - kind: other
        ref: "render probe (svelte/compiler generate:'server' + svelte/server render): diff of lines 1-2 before vs after -> exit 0; line 3 after matches 'extra.*aria-hidden=yes' (count 1)"
        status: pass
      - kind: other
        ref: "grep -l 'fill-primary' apps/docs/build/_app/immutable/assets/*.css -> 1 file (0.Ca1LhN-l.css), containing .fill-primary, .fill-secondary and .fill-neutral rules"
        status: pass
    human_judgment: false
  - id: D3
    description: "Sweep #14: all ten patterns plus $$Props, run with git grep -P over *.svelte, and the $app/stores search each count 0. The positive control against the phase base finds the two pre-port files"
    requirement: VEST-05
    verification:
      - kind: other
        ref: "Task 2 verify loop: control rc=0 n=2; eleven patterns each rc=1 n=0; $app/stores rc=1 n=0"
        status: pass
    human_judgment: false
  - id: D4
    description: "The comment above resolveProjectIdEnv in apps/frontend/vite.config.ts describes today's loading: SvelteKit reads the root .env through kit.env.dir, and the two project ids are copied in because a process.env entry overrides the file even when empty. Commit ⑥ changes the comment only"
    requirement: VEST-06
    verification:
      - kind: other
        ref: "git grep -F 'over `apps/frontend`' -> rc 1; git show -U0 HEAD changed lines=2, non-comment grep rc 1; yarn workspace @openvaa/frontend check -> exit 0 (2797 files, 0/0); yarn assert:comment-hygiene -> exit 0 (0 violations)"
        status: pass
    human_judgment: false

duration: 3min
completed: 2026-10-02
status: complete
---

# Phase 167 Plan 05: Docs runes ports and the vite env comment Summary

**Commit ⑤ (`dad0754fe`) ports the docs app's last two Svelte 4 components to runes:**

- **PeerNavigation:** reads `page` from `$app/state` and derives `peerNav` with `$derived`.
- **OpenVAALogo:** uses `$props()` with `...restProps`, computes its classes with `$derived.by`, spreads the rest props onto the `svg`, and documents `'primary'` as the colour default.
- **Render probe:** both call sites render byte-identical class strings, and caller attributes now reach the `svg`.

Sweep #14 is now zero under the corrected `-P` measurement. **Commit ⑥ (`a02f3362e`)** rewrites the `vite.config.ts` env comment so it describes how env loading works today.

## Performance

- **Duration:** about 3 min
- **Started:** 2026-10-02T06:23:48Z
- **Completed:** 2026-10-02T06:26:55Z
- **Tasks:** 3 (two code commits, per D-24 ⑤ and ⑥)
- **Files modified:** 4

## Accomplishments

Every exit below was read directly. `S` is the session scratchpad.

### Task 1: PeerNavigation (tracer)

| Count | Before | After |
|---|---|---|
| `git grep -n -P '^\s*\$:' -- '*.svelte' ':!.planning'` | 2 (PeerNavigation:5, OpenVAALogo:31) | 1 (OpenVAALogo only) |
| `git grep -n -F '$app/stores' -- apps packages` | 1 (PeerNavigation:2) | 0 (rc 1) |

The script block now reads `import { page } from '$app/state';` and `const peerNav = $derived(getPeerNavigation(page.url));`. The markup is untouched. After the edit, `yarn workspace @openvaa/docs check` exited 0 (611 files, 0 errors, 0 warnings) and `yarn workspace @openvaa/docs build` exited 0.

**Tracer gate:** end-of-phase mode, automated-only `<verify>`. Re-run before expanding: check exit 0, the `$app/stores` grep exit 1, the PeerNavigation `$:` grep exit 1. All passed.

### Task 2: OpenVAALogo port, render probe, sweep #14, commit ⑤

**Render probe.** The script was `apps/docs/.render-probe/probe.mjs`. It compiles the component with `compile(source, { generate: 'server', filename })`, imports the emitted JS and renders it with `render` from `svelte/server` (svelte 5.53.12). It prints the opening `svg` tag's `class` and whether the tag carries `aria-hidden="true"`.

BEFORE (unmodified component, `$S/167-05-render-before.txt`):
```
{}	class="h-28 pt-4 fill-primary inline fill-primary inline"	aria-hidden=no
{"color":"secondary","size":"sm"}	class="h-20 pt-2 fill-secondary inline fill-secondary inline"	aria-hidden=no
{"class":"extra","aria-hidden":"true"}	class="h-28 pt-4 fill-primary inline fill-primary inline"	aria-hidden=no
```
AFTER (ported component, `$S/167-05-render-after.txt`):
```
{}	class="h-28 pt-4 fill-primary inline fill-primary inline"	aria-hidden=no
{"color":"secondary","size":"sm"}	class="h-20 pt-2 fill-secondary inline fill-secondary inline"	aria-hidden=no
{"class":"extra","aria-hidden":"true"}	class="h-28 pt-4 fill-primary inline fill-primary inline extra"	aria-hidden=yes
```
- **Header and Footer (lines 1 and 2):** `diff` exit 0, so they are byte-identical.
- **The empty-props render** (`{}`, which is also the Header call) gives the default size and the primary fill, unchanged.
- **Line 3:** the caller's `extra` now follows the computed classes, and `aria-hidden="true"` is now forwarded. The old component dropped both, as D-01 fact 18 found.
- **Clean-up:** the probe directory was deleted with `rm -rf apps/docs/.render-probe` before staging, and `test ! -e` exited 0. `git status --porcelain -- apps/docs` then listed only the three intended `M` files, and `git log --all -- apps/docs/.render-probe` returns 0 commits.
- **Harmless warning:** each probe run printed an `esm-env` "conditions should include development or production" warning to stderr. The probe ran outside Vite, so this was expected, and it does not affect the output.

**Port details:**
- **Props:** `let { title = 'OpenVAA', color = 'primary', size = 'md', class: className, ...restProps }: OpenVAALogoProps = $props();`
- **Classes:** `const classes = $derived.by(…)` with the same size switch (default `h-28 pt-4`). The three literal `' fill-primary inline'` / `' fill-secondary inline'` / `' fill-neutral inline'` strings stay, as does the trailing `` ` fill-${color} inline` `` append.
- **Element:** `<svg role="img" … {...restProps} class={[classes, className]}>`.
- **Docs:** the header's `color` bullet now says ``Default: `'primary'` ``, and the bullet ``- Any valid attributes of a `<svg>` element.`` is added. In `OpenVAALogo.type.ts`, `color`'s `@default` changed from `'neutral'` to `'primary'`.
- **Acceptance greps on the component:** `$props()` 1, `{...restProps}` 1, `$derived.by` 1, `class={[classes, className]}` 1, each fill literal 1, `export let` 0, `$$Props` 0, ``'neutral'` `` (as a default) 0.

**Build and CSS.**
- `yarn workspace @openvaa/docs check`: exit 0 (611 files, 0 errors, 0 warnings).
- `yarn workspace @openvaa/docs build`: exit 0.
- `grep -l 'fill-primary' apps/docs/build/_app/immutable/assets/*.css` found `0.Ca1LhN-l.css`, which contains `.fill-neutral{fill:var(--color-neutral)}`, `.fill-primary{fill:var(--color-primary)}` and `.fill-secondary{fill:var(--color-secondary)}`. That satisfies PROH-167-08: no fill utility disappeared.

**Sweep #14 (D-04).** Each command was `git grep -n -P "<pattern>" -- '*.svelte' ':!.planning' > $S/167-05-sweep.out`. The rc is git grep's own, and n is the line count of that file.

| Pattern | rc | n |
|---|---|---|
| **Positive control:** `git grep -n -P '^\s*\$:' 8c519ac97 -- '*.svelte'` (the phase base) | 0 | **2** (PeerNavigation:5, OpenVAALogo:31) |
| Same control with `-E` (for the record only) | 1 | 0, the false zero of fact 17, re-confirmed |
| `export let ` | 1 | 0 |
| `^\s*\$:` | 1 | 0 |
| `(^\|[^a-zA-Z])on:[a-z]+=` | 1 | 0 |
| `<slot` | 1 | 0 |
| `createEventDispatcher` | 1 | 0 |
| `\$\$props\|\$\$restProps\|\$\$slots` | 1 | 0 |
| `svelte/legacy` | 1 | 0 |
| `<svelte:component` | 1 | 0 |
| `<svelte:fragment` | 1 | 0 |
| `beforeUpdate\|afterUpdate` | 1 | 0 |
| `\$\$Props` | 1 | 0 |
| `git grep -n -F '$app/stores' -- apps packages` | 1 | 0 |

No rc of 128 appeared, so no empty output was a git grep error.

### Task 3: vite.config.ts comment, commit ⑥

**Facts re-checked against the tree** (this covers the flagged VEST-06 assumption):
- `apps/frontend/svelte.config.js:23` still has `dir: repoRoot` inside `env`.
- `vite.projectIdEnv.ts` still copies only `PROJECT_ID_ENV_KEYS = ['PUBLIC_PROJECT_ID', 'E2E_PROJECT_ID']`.
- The backend-URL pair was removed in 167-02. The `svelte.config.js` comment beside `env` still says "`$env/*/public` exposes only `PUBLIC_`-prefixed keys".

The comment above `resolveProjectIdEnv` now reads:

> SvelteKit reads this same root `.env` (`kit.env.dir`), but any `process.env` entry overrides the file, an empty one included, so the two project ids are copied in from the file wherever the shell left them unset or blank. Only those two keys cross over; see `vite.projectIdEnv.ts`.

Checked against the four Comment Hygiene rules by reading it: no historical narrative, no planning reference, nothing addressed to a reviewer, and one line in the file's existing style. "Unset or blank" matches what the helper does (`isBlank`: absent, empty or whitespace-only).

| Check | Result |
|---|---|
| `git grep -n -F 'over \`apps/frontend\`' -- apps/frontend/vite.config.ts` | rc 1 |
| `used to` / `previously` / `over \`apps/frontend\`` in the file | 0 |
| `git show -U0 HEAD -- apps/frontend/vite.config.ts`: changed lines | 2 (one `-//`, one `+//`); the non-comment grep has rc 1 |
| `yarn workspace @openvaa/frontend check` | exit 0 (2797 files, 0 errors, 0 warnings), both before and after the commit |
| `yarn assert:comment-hygiene` | exit 0 (1757 files, 0 violations), both before and after the commit |
| `yarn prettier --check` on all four touched files | exit 0 |

## Task Commits

1. **Task 1: PeerNavigation (tracer).** Left uncommitted, as the plan requires; it lands in ⑤.
2. **Task 2: OpenVAALogo, probe, sweep.** `dad0754fe` (refactor): `refactor[docs]: OpenVAALogo and PeerNavigation use runes`. It contains exactly the three docs files.
3. **Task 3: vite comment.** `a02f3362e` (docs): `docs[frontend]: the vite.config.ts env comment describes the root .env loading`. It contains only `apps/frontend/vite.config.ts`.

`git rev-list --count 18f8c2c05..a02f3362e` = 2. Neither commit deletes a file.

The commits ran with the normal `git commit`, without `--no-verify`. This worktree carries the persistent worktree-local `core.hooksPath=/dev/null` override, so no hook executed. Prettier and comment hygiene were therefore run by hand before each commit (above).

**Plan metadata:** the docs commit that follows this SUMMARY.

## Files Created/Modified

- `apps/docs/src/lib/components/PeerNavigation.svelte`: `$app/state` plus `$derived`
- `apps/docs/src/lib/components/openVAALogo/OpenVAALogo.svelte`: `$props()` with `...restProps`, `$derived.by`, the spread and the inline `class` merge, and the docstring default fixed
- `apps/docs/src/lib/components/openVAALogo/OpenVAALogo.type.ts`: `color` `@default 'primary'`
- `apps/frontend/vite.config.ts`: the comment above `resolveProjectIdEnv` (comment only)

## Decisions Made

See `key-decisions` above. VEST-05 is complete. VEST-06 is half done: the comment is in ⑥, and the todo moves to `done/` with its resolution note in 167-06.

## Deviations from Plan

None. The plan executed as written.

A process note, not a deviation: my first Edit of `PeerNavigation.svelte` was rejected because the file had not yet been opened with the Read tool. The first check and build therefore ran against the unmodified file. I re-applied the edit, and the check, build and after-counts recorded above are from the edited file.

## Issues Encountered

None. The docs ESLint config crash (exit 2, `ERR_INTERNAL_ASSERTION`) remains Phase 168's. It was not touched or re-tested here.

## User Setup Required

None.

## Next Phase Readiness

- 167-06 can start. The tree is clean apart from the existing untracked `261001-n8y/gate-evidence/` directory, which is D-23's for 167-06.
- For 167-06's todo closure (D-22), the three facts its resolution note states were re-checked at `a02f3362e` and all hold (see Task 3).

---
*Phase: 167-origin-main-vestige-cleanup*
*Completed: 2026-10-02*

## Self-Check: PASSED

- All four modified files exist, and their content matches the acceptance greps above.
- Commits `dad0754fe` and `a02f3362e` exist on `fix/888-review-findings` with the planned subjects and file lists.
- `apps/docs/.render-probe` does not exist and appears in no commit.
