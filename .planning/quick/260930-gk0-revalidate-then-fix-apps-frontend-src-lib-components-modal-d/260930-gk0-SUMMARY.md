---
phase: quick-260930-gk0
plan: 01
quick_id: 260930-gk0
subsystem: frontend/modal/drawerHost
status: complete
tags: [frontend, drawer, a11y, motion, tdd, revalidation]
requires: []
provides:
  - "DrawerHost open-path reveal guarded on the opened key"
  - "DrawerHost dismiss() ignoring user dismissal while closing"
affects:
  - apps/frontend/src/lib/components/modal/drawerHost/DrawerHost.svelte
tech-stack:
  added: []
  patterns:
    - "Deferred callbacks re-check `drawerHost.current?.key === openedKey` before acting (same guard for the rAF reveal and the focus timer)"
key-files:
  created: []
  modified:
    - apps/frontend/src/lib/components/modal/drawerHost/DrawerHost.svelte
    - apps/frontend/src/lib/components/modal/drawerHost/DrawerHost.svelte.test.ts
decisions:
  - "Stated finding (both parts) DROPPED: it was already fixed at HEAD by bcdbe8d13, which is folded into af31f1f0f"
  - "Edge case A is fixed by a key guard in the inner rAF callback. No cancelAnimationFrame bookkeeping and no new state"
  - "Edge case B is fixed by one key-mismatch guard in dismiss(). handleEscape is left as it is, so it still owns Escape during the close"
metrics:
  duration: "~6 min"
  completed: 2026-09-30
actuals:
  tokens: 1600
  tasks: 3
  commits: 2
plan_head_before: 539ae3a28eae0575b425d34444874649ca7226b9
plan_head_after: 0ff348c57
---

# Phase quick-260930-gk0 Plan 01: DrawerHost revalidation and close-path edge cases Summary

The stated review finding is DROPPED because HEAD already fixes it. Two adjacent edge cases were reproduced red and fixed with two one-line key guards in `DrawerHost.svelte`:
- A close within the first two frames no longer slides the panel back up.
- Dismissal during the close animation no longer re-invokes `onDismiss`.

**Outcome:** the stated finding is DROPPED (both parts were fixed by bcdbe8d13, carried in af31f1f0f). The related edge cases A and B are FIXED.

## Task 1: Revalidation of the stated finding (no code change)

### Part 1: close animation gated on the View-Transitions helper. DROPPED, already fixed at HEAD

- `grep -c shouldAnimate DrawerHost.svelte` returns `0`. The close branch skips the animation wait only on `prefersReducedMotion()`, imported from `$lib/utils/motion`.
- `git log --oneline -S "prefersReducedMotion" -- .../DrawerHost.svelte` returns `af31f1f0f feat[frontend]: one per-app drawer host for entity details and question info`.
  - That is the squash that carries `bcdbe8d13 fix(165.1): drawer focus guard and a motion gate independent of view transitions`.
  - bcdbe8d13 still resolves, and it is reachable from `backup/f888-prequash`.
- Pinned by the passing tests "waits out the close animation even where View Transitions are unsupported" and "closes at once under reduced motion".

### Part 2: focus `setTimeout(DELAY.sm)` not cancelled on a quick close. DROPPED, already fixed at HEAD

- The close branch (`next` null, `shown` set) calls `clearTimeout(focusTimer)` before `visible = false`.
- The timer callback re-checks `dialog?.open && drawerHost.current?.key === openedKey`.
- Pinned by the passing test "does not move focus into a drawer dismissed before the open delay elapsed".
- Test run at HEAD 539ae3a28 (`yarn workspace @openvaa/frontend test:unit src/lib/components/modal/drawerHost`, exit 0): 2 files, 10 tests passed (DrawerHost 4, drawerHostState 6).

### The View-Transitions gate helper (`apps/frontend/src/lib/utils/viewTransition.ts`)

- `shouldAnimate(destUrl)` returns false in four cases: on SSR, without `document.startViewTransition`, under `prefersReducedMotion()`, and on `?notr=1`.
- Its only importers are `lib/components/tabs/Tabs.svelte` and `routes/+layout.svelte`. Both start a View Transition, so their feature-detect is correct. DrawerHost does not import the helper.
- `git diff 539ae3a28..HEAD` over `viewTransition.ts`, `Tabs.svelte` and `routes/+layout.svelte` is empty (0 lines).

### ModalContainer comparison

- **Focus:** the `setTimeout(DELAY.sm)` callback bails on `if (!isOpen) return;`. That is equivalent to DrawerHost's existing guard.
- **Escape:** `handleEscape` is gated on `isOpen`, which drops to false the moment `handleClose` runs. DrawerHost's `handleEscape`/`dismiss` were gated on `shown`, which lags through the close. That gap is edge case B.

Planning had reproduced edge cases A and B red with a throwaway probe. Tasks 2 and 3 below re-proved each one red before fixing it.

## Task 2: Edge case A, a close within the open's two frames. FIXED

- **RED (negative control, unmodified component):**
  - `× stays in the closed-state styles when closed within its first two frames → expected false to be true` fails at the `translate-y-full` assertion (test line 127).
  - `× starts a reopen from the closed-state styles after a close within its first two frames → expected false to be true` fails at the `translate-y-full` assertion right after the reopen (test line 143).
  - Result: `Tests 2 failed | 10 passed (12)`.
- **GREEN:**
  - `const openedKey = next.key` moved above the rAF chain.
  - The inner callback became `if (drawerHost.current?.key === openedKey) visible = true;`.
  - The existing comment was extended with one present-tense clause.
  - Result: 12/12 passed.
- Commit: `a29f7e310`

## Task 3: Edge case B, dismissal during the close animation. FIXED

- **RED (negative control, component after Task 2):**
  - `× calls onDismiss once, not again while the drawer is closing → expected "spy" to be called 1 times, but got 4 times`.
  - The 4 calls are Escape, Escape, backdrop and close button. Planning's probe measured 3 without the close-button click.
  - The reopen test failed through the same shared sequence.
  - Result: `Tests 2 failed | 12 passed (14)`.
- **GREEN:**
  - `dismiss()` now returns on `!shown || drawerHost.current?.key !== shown.key`, with a single-line comment explaining the lagging `shown`.
  - `handleEscape`, `forceClose`, `handlePayloadError`, the effect and the markup are untouched.
  - Result: 14/14 passed.
  - The reuse-key reopen test confirms the drawer is dismissable again (`onDismiss` called twice in total).
- Commit: `0ff348c57`

## Final gates (each exit status read directly, not through a pipe)

| Gate | Result |
|---|---|
| `yarn workspace @openvaa/frontend test:unit src/lib/components/modal/drawerHost` | exit 0, 14/14 (DrawerHost 8, drawerHostState 6) |
| `yarn workspace @openvaa/frontend check` | exit 0, 0 errors / 0 warnings |
| scoped eslint (`--flag v10_config_lookup_from_file src/lib/components/modal/drawerHost/`) | exit 0 |
| `yarn prettier --check apps/frontend/src/lib/components/modal/drawerHost/` | exit 0 |
| `yarn assert:comment-hygiene` | exit 0, 0 violations |
| `yarn workspace @openvaa/frontend test:unit` (full) | exit 0, 128 files / 2054 tests passed |

- `git diff 539ae3a28..HEAD --stat` lists only `DrawerHost.svelte` (+10/-3 net over both commits) and `DrawerHost.svelte.test.ts`.
- The component's header `<!--@component -->` doc comment is untouched. It belongs to sibling item 260930-gjv.

## Deviations from Plan

None. The plan executed as written.
- Minor: the planned test file's shared sequence lives in a `dismissWhileClosing` helper, so the reuse-key test repeats it rather than depending on test order.
- Minor: the inner rAF callback is a block body `{ if (...) visible = true; }`. The plan's grep anchor still matches.

## Known Stubs

None.

## Self-Check: PASSED

- FOUND: apps/frontend/src/lib/components/modal/drawerHost/DrawerHost.svelte
- FOUND: apps/frontend/src/lib/components/modal/drawerHost/DrawerHost.svelte.test.ts
- FOUND commit a29f7e310
- FOUND commit 0ff348c57
