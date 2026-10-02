---
phase: quick-260927-kjb
plan: 01
subsystem: frontend/drawer-host
status: complete
tags: [svelte5, runes, drawer-host, hooks, refactor]
requires: []
provides:
  - "Generic DrawerPayload<TProps> (component + props getter) and HostedDrawerPayload"
  - "useEntityDrawer(getEntity, onClose) hook with last-defined-entity latch"
affects:
  - apps/frontend/src/lib/components/modal/drawerHost
  - apps/frontend/src/lib/components/questions/QuestionExtendedInfoButton.svelte
  - apps/frontend/src/lib/dynamic-components/entityDetails
  - "apps/frontend/src/routes/(voters)/(located)/results/[[electionTab]]/[[entityTab=etPl]]/[[entity=etSg]]/[[id]]/+page.svelte"
tech-stack:
  added: []
  patterns:
    - "Drawer payload = Component<TProps> + reactive props getter; one sound erasure inside the generic open()"
    - ".svelte.ts hook replaces a render-nothing opener component"
key-files:
  created:
    - apps/frontend/src/lib/dynamic-components/entityDetails/useEntityDrawer.svelte.ts
    - apps/frontend/src/lib/dynamic-components/entityDetails/useEntityDrawer.svelte.test.ts
  modified:
    - apps/frontend/src/lib/components/modal/drawerHost/drawerHostState.svelte.ts
    - apps/frontend/src/lib/components/modal/drawerHost/drawerHostState.svelte.test.ts
    - apps/frontend/src/lib/components/modal/drawerHost/DrawerHost.svelte
    - apps/frontend/src/lib/components/questions/QuestionExtendedInfoButton.svelte
    - apps/frontend/src/lib/dynamic-components/entityDetails/index.ts
    - "apps/frontend/src/routes/(voters)/(located)/results/[[electionTab]]/[[entityTab=etPl]]/[[entity=etSg]]/[[id]]/+page.svelte"
    - .claude/skills/spike-findings-voting-advice-application-gsd/references/results-redraw.md
    - .claude/skills/spike-findings-voting-advice-application-gsd/SKILL.md
    - .claude/skills/components/SKILL.md
  deleted:
    - apps/frontend/src/lib/dynamic-components/entityDetails/EntityDrawerOpener.svelte
    - apps/frontend/src/lib/dynamic-components/entityDetails/EntityDrawerOpener.type.ts
decisions:
  - "The drawer payload type parameter is named TProps, not Props: the repo's @typescript-eslint/naming-convention rule requires type parameters to match ^T[A-Z]."
  - "Test stubs are typed function declarations (function Stub(_internals: unknown, _props: P): Record<string, never>), not arrow consts, because func-style is 'declaration'. The typed props parameter keeps the @ts-expect-error mismatch check a real compile error, which a probe confirmed."
metrics:
  duration: "~24 min"
  started: 2026-09-27T12:01:19Z
  completed: 2026-09-27T12:24:44Z
  tasks: 3
  files_changed: 13
commits: 5
plan_head_before: 3f95dd5c8116d9a8b21fdabbca85021473f201e7
plan_head_after: 46fbed6aa38bc49c58c17f6b008c6d4c74792b32
actuals:
  tokens: 24266    # chars/4 over the full contents of the 11 added or modified files; the realized diff alone is about 9177 tokens (36707 chars / 4)
  tasks: 3
  commits: 5
---

# Phase quick-260927-kjb Plan 01: Replace EntityDrawerOpener with useEntityDrawer Summary

The drawer payload is now a type-checked `Component<TProps>` plus a reactive `props` getter, where it used to be a `Snippet`. The entity drawer opens through a `.svelte.ts` hook, `useEntityDrawer(getEntity, onClose)`, that holds a last-defined-entity latch, and the render-nothing opener component is deleted.

## What was built

- **`drawerHostState.svelte.ts`:** `DrawerPayload<TProps extends object = Record<string, unknown>>` has `key`, `title`, `component`, `props`, `onDismiss` and `testId`, each with TSDoc. `HostedDrawerPayload` is the erased form. `open` is generic, keeps its `browser` guard as the first statement, and stores the payload with a single commented `as unknown as HostedDrawerPayload`. The change adds no explicit `any` and no eslint-disable.
- **`DrawerHost.svelte`:** renders `<shown.component {...shown.props()} />` inside the unchanged `<svelte:boundary>`. The lagging `shown` effect and the close timer are untouched, so the payload still renders through the out-animation. The "Teardown safety" paragraph is rewritten in present tense and points at `useEntityDrawer.svelte.ts`.
- **`QuestionExtendedInfoButton.svelte`:** opens with `component: QuestionExtendedInfo` and a props getter over the `$state.raw` latch. The snippet is gone. Touched comments follow CLAUDE.md § Comment Hygiene: no decision ids and no "has always".
- **`useEntityDrawer.svelte.ts`:**
  - an `$effect.pre` feeds the `$state.raw` latch, which is never reset
  - `isOpen = $derived(!!getEntity())`
  - one `$effect` that depends only on `isOpen`: it opens with a `newKey('entity')` key and `testId` `voter-results-drawer`, and its teardown closes by key
  - switching from A to B updates the drawer through the props and title getters, without reopening it
- **Results page:** calls `useEntityDrawer(() => (drawerVisible ? drawerEntity : undefined), handleDrawerClose)` after the `drawerEntity` `$derived.by` block. The template drawer block and its comment are removed, and the `@component` sentence is updated.
- **Barrel:** the opener exports are removed and `export * from './useEntityDrawer.svelte'` is added.
- **Skills:** the payload field list and last-defined-value bullet in `results-redraw.md` are updated; the spike `SKILL.md` mapping row cites the hook; the counts in convention 1 of `components/SKILL.md` are re-derived.

## Gate results (each exit status read directly)

| Gate | Result |
|---|---|
| `yarn lint:check` | exit 0. The only warnings are pre-existing: 15 in `dev-seed` and 1 in `candidateContext.svelte.test.ts`. |
| `yarn format:check` | exit 0 |
| `yarn workspace @openvaa/frontend check` | exit 0: 2192 files, 0 errors, 0 warnings |
| `yarn test:unit` | exit 0: 25/25 turbo tasks, 260 test files, 3332 tests passed. Frontend: 109 files, 1864 tests. |
| Task 1 E2E, `--project voter-results-redraw` (`tests/e2e-runs/quick-260927-kjb-t1`) | 7 expected, 0 unexpected, 0 flaky, 0 skipped; preflight SUCCESS |
| Task 2 E2E, `--project voter-results-redraw` (`tests/e2e-runs/quick-260927-kjb-t2`) | 7 expected, 0 unexpected, 0 flaky, 0 skipped; preflight SUCCESS |
| **Full E2E** (`tests/e2e-runs/quick-260927-kjb`, HEAD `46fbed6aa`) | **171 passed, 0 failed, 0 flaky, 0 skipped, 0 did-not-run** (per-test status all `expected`), 11.4 min, preflight SUCCESS, playwright exit 0 |
| `audit-skill-links.sh components` | exit 0: 30 checked, 0 dangling |
| `audit-skill-links.sh spike-findings-voting-advice-application-gsd` | **exit 1**: 112 dangling. **This failure predates the plan:** at base `3f95dd5c8` it was also exit 1, with 113 dangling. This plan removed one dangling citation and added none. See `deferred-items.md`. |
| `git grep EntityDrawerOpener -- apps packages tests/tests .claude CLAUDE.md` | no matches |
| Hygiene grep on lines added under `apps/` since `3f95dd5c8` (decision ids, `.planning/` paths, plan numbers) | no matches; every touched comment was also read for historical narrative |

Two probes checked coverage:

- **Enforcement of the `@ts-expect-error` mismatch line:** I temporarily replaced `{ wrong: 1 }` with a valid prop, and `check` reported "Unused '@ts-expect-error' directive". I ran this before and after the lint fix.
- **Coverage of the new files:** I added deliberate type errors to the hook, its test and the results page, and `check` flagged all three. It checked 2780 files on its first run and 2192 on every later run. The probes show that the touched files are covered either way. The count difference does not come from this change.

## TDD Gate Compliance

- RED: `2af04689d`. `test:` commit; the run failed with `Failed to resolve import "./useEntityDrawer.svelte"`.
- GREEN: `6a023f5d1`. `refactor:` commit with the hook and its wiring; 6/6 hook tests pass.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 3 - Blocking] Satisfied `yarn lint:check` (func-style, type-parameter naming)**
- **Found during:** Task 3 full gate. The worktree has `core.hooksPath=/dev/null`, so no pre-commit lint ran on the Task 1 and 2 commits.
- **Issue:** the lint rules reject the plan's literal forms:
  - `func-style: declaration` rejects `const Stub: Component<…> = () => ({})` (in both tests) and the arrow accessor `const shownEntity = () => latched!`.
  - `@typescript-eslint/naming-convention` requires type parameters to match `^T[A-Z]`, which rejects `Props`.
- **Fix:**
  - `Props` → `TProps` (so the artifact contains `props: () => TProps` rather than `props: () => Props`).
  - The stubs became typed function declarations whose second parameter carries the props type, which keeps the mismatch check a compile error (probed).
  - The accessor became `function shownEntity()`.
- **Files modified:** `drawerHostState.svelte.ts`, `drawerHostState.svelte.test.ts`, `useEntityDrawer.svelte.ts`, `useEntityDrawer.svelte.test.ts`.
- **Commit:** `d096d0dd0`, a separate `fix:` commit as the plan directs.

**2. [Rule 1 - Accuracy] Spike SKILL.md mapping row uses the full path**
- The plan asked for `dynamic-components/entityDetails/useEntityDrawer.svelte.ts`. The skill-link audit cannot resolve that short form, which would have left the row a dangling citation, just as the old opener path was. I used `apps/frontend/src/lib/dynamic-components/entityDetails/useEntityDrawer.svelte.ts`, which resolves. Nothing else in the row changed.

**3. [Rule 1 - Accuracy] `results-redraw.md`: "openers render nothing in place"**
- This line is no longer true: the question-info opener is a button, and the entity opener is now a hook. It now reads "openers render no overlay of their own".

**4. `components/SKILL.md` counts:** the re-derived figures are 101 files calling `$props()` and 101 co-located `*.type.ts` files; the text said 103 and 103. At base `3f95dd5c8` they were already 102 and 102, and deleting the opener removed one more of each. The numbers and the date (2026-09-27) are updated, as the plan directs.

### Deferred Issues

- The spike-findings skill-link audit fails with 112 dangling citations. This is pre-existing and outside this plan's scope; see `deferred-items.md`.

## Known Stubs

None.

## Threat Flags

None. The change adds no new network, auth, storage or input surface. The three mitigations in T-260927-kjb-01..03 are in place:
- the `browser` guard remains the first statement of `open`
- the boundary and the lagging `shown` effect are unchanged, and the latch test is green
- the single erasure sits inside `open`, and the `@ts-expect-error` check enforces it

## Commits

- `99af3489a` refactor: drawer payload becomes a component plus a props getter
- `2af04689d` test: useEntityDrawer opens, swaps, closes and latches the entity drawer
- `6a023f5d1` refactor: replace the entity drawer opener component with useEntityDrawer
- `d096d0dd0` fix: satisfy lint:check func-style and type-parameter naming in the drawer payload
- `46fbed6aa` docs: point the drawer-host skill references at useEntityDrawer

## Self-Check: PASSED

- The created files exist, and the opener `.svelte` and `.type.ts` are deleted.
- All 5 commit hashes are found in `git log --all`.
- The commit count is measured from the ledger: `git rev-list --count 3f95dd5c8..HEAD` = 5.
