---
phase: quick-260927-kjb
plan: 01
type: execute
wave: 1
depends_on: []
quick_id: 260927-kjb
files_modified:
  - apps/frontend/src/lib/components/modal/drawerHost/drawerHostState.svelte.ts
  - apps/frontend/src/lib/components/modal/drawerHost/drawerHostState.svelte.test.ts
  - apps/frontend/src/lib/components/modal/drawerHost/DrawerHost.svelte
  - apps/frontend/src/lib/components/questions/QuestionExtendedInfoButton.svelte
  - apps/frontend/src/lib/dynamic-components/entityDetails/useEntityDrawer.svelte.ts
  - apps/frontend/src/lib/dynamic-components/entityDetails/useEntityDrawer.svelte.test.ts
  - apps/frontend/src/lib/dynamic-components/entityDetails/index.ts
  - apps/frontend/src/routes/(voters)/(located)/results/[[electionTab]]/[[entityTab=etPl]]/[[entity=etSg]]/[[id]]/+page.svelte
  - .claude/skills/spike-findings-voting-advice-application-gsd/references/results-redraw.md
  - .claude/skills/spike-findings-voting-advice-application-gsd/SKILL.md
  - .claude/skills/components/SKILL.md
files_deleted:
  - apps/frontend/src/lib/dynamic-components/entityDetails/EntityDrawerOpener.svelte
  - apps/frontend/src/lib/dynamic-components/entityDetails/EntityDrawerOpener.type.ts
autonomous: true
requirements: [QUICK-260927-kjb]

estimate:
  tokens: 65000
  raw_tokens: 130000
  tasks: 3
  confidence: high

must_haves:
  truths:
    - "Opening an entity on /results shows its details in the `voter-results-drawer` dialog; switching to another entity while it is open updates the content in place without reopening; closing it plays the out-animation without a render error (voter-results-redraw E2E green)"
    - "The question-info button opens the extended info in the same host, with `voter-questions-popup-info-modal` on the rendered body (perm-interactive-info E2E green)"
    - "`drawerHost.open` accepts a component together with a props getter that returns that component's props; a mismatched pair is a compile error, and the stored `current` holds any payload with no explicit-any type"
    - "The entity drawer is opened by `useEntityDrawer`, called once at results-page init with a getter; the Svelte opener component and its type file are deleted"
    - "yarn lint:check, the frontend check, yarn test:unit and the full E2E suite all pass: 0 failed, 0 flaky, 0 skipped, 0 did-not-run"
  artifacts:
    - path: apps/frontend/src/lib/components/modal/drawerHost/drawerHostState.svelte.ts
      provides: "Generic DrawerPayload<Props> (component + props getter), HostedDrawerPayload, generic open"
      contains: "props: () => Props"
    - path: apps/frontend/src/lib/components/modal/drawerHost/DrawerHost.svelte
      provides: "Renders the payload component with its props inside the existing svelte:boundary"
      contains: "shown.props()"
    - path: apps/frontend/src/lib/dynamic-components/entityDetails/useEntityDrawer.svelte.ts
      provides: "useEntityDrawer(getEntity, onClose) hook with last-defined-entity latch"
      contains: "export function useEntityDrawer"
    - path: apps/frontend/src/lib/dynamic-components/entityDetails/useEntityDrawer.svelte.test.ts
      provides: "Rune-driven unit test of the hook: open once, A to B without reopening, close on undefined, latch retained, teardown close"
    - path: apps/frontend/src/lib/components/modal/drawerHost/drawerHostState.svelte.test.ts
      provides: "Host-registration contract on the new payload shape, plus a compile-time mismatch check"
  key_links:
    - from: "apps/frontend/src/routes/(voters)/(located)/results/[[electionTab]]/[[entityTab=etPl]]/[[entity=etSg]]/[[id]]/+page.svelte"
      to: apps/frontend/src/lib/dynamic-components/entityDetails/useEntityDrawer.svelte.ts
      via: "script-level call after the drawerEntity derivation"
      pattern: "useEntityDrawer\\("
    - from: apps/frontend/src/lib/dynamic-components/entityDetails/useEntityDrawer.svelte.ts
      to: apps/frontend/src/lib/components/modal/drawerHost/drawerHostState.svelte.ts
      via: "drawerHost.open with component EntityDetails and a props getter over the latch"
      pattern: "component: EntityDetails"
    - from: apps/frontend/src/lib/components/modal/drawerHost/DrawerHost.svelte
      to: apps/frontend/src/lib/components/modal/drawerHost/drawerHostState.svelte.ts
      via: "renders shown.component with shown.props() inside svelte:boundary"
      pattern: "shown\\.component"
---

<!-- planner-discipline-allow: EntityDrawerOpener -->

<objective>
Replace the render-nothing entity drawer opener component with a `.svelte.ts` hook, `useEntityDrawer`, and make the drawer payload a component plus a reactive props getter instead of a `Snippet`.

Purpose: an opener that renders nothing is a hook in disguise, and a snippet payload forces every opener to be a `.svelte` file. A component-plus-props payload lets any `.svelte.ts` code open the app's drawer, keeps the payload type-checked end to end, and leaves the host's close-animation and teardown-safety behaviour unchanged.

Output: generic `DrawerPayload<Props>` + `HostedDrawerPayload` in the drawer-host state; `DrawerHost` rendering the component; `QuestionExtendedInfoButton` on the new payload; `useEntityDrawer.svelte.ts` + its unit test; the results page calling the hook; the old opener deleted; skill references updated. All locked design points from the exploration session are implemented as specified — see each task.
</objective>

<execution_context>
@~/.claude/gsd-core/workflows/execute-plan.md
@~/.claude/gsd-core/templates/summary.md
</execution_context>

<context>
@CLAUDE.md
@.claude/skills/components/SKILL.md
@.claude/skills/components/context-reactivity.md
@.claude/skills/spike-findings-voting-advice-application-gsd/references/results-redraw.md
@apps/frontend/src/lib/components/modal/drawerHost/drawerHostState.svelte.ts
@apps/frontend/src/lib/components/modal/drawerHost/DrawerHost.svelte
@apps/frontend/src/lib/components/modal/drawerHost/drawerHostState.svelte.test.ts
@apps/frontend/src/lib/components/questions/QuestionExtendedInfoButton.svelte
@apps/frontend/src/lib/dynamic-components/entityDetails/EntityDrawerOpener.svelte
@apps/frontend/src/lib/dynamic-components/entityDetails/index.ts
@apps/frontend/src/routes/(voters)/(located)/results/[[electionTab]]/[[entityTab=etPl]]/[[entity=etSg]]/[[id]]/+page.svelte
@apps/frontend/src/lib/contexts/app/popup/popupState.svelte.test.ts

<interfaces>
Grounded during planning (tsc probe against the repo's svelte 5.53.12 types):

- Svelte's `Component<Props extends Record<string, any>, Exports, Bindings>` has a call signature `(internals, props: Props)`, so it is CONTRAVARIANT in Props. `DrawerPayload<EntityDetailsProps>` is therefore NOT assignable to `DrawerPayload<Record<string, unknown>>`, and some erasure point is unavoidable for a template-rendered dynamic component.
- `EntityDetailsProps` (`SvelteHTMLElements['article'] & { entity }`) does NOT satisfy `Record<string, unknown>` (HTMLAttributes is an interface with no string index signature). A constraint of `Props extends object` DOES satisfy `Component`'s own constraint and accepts both real prop types.
- With `open = <Props extends object>(payload: DrawerPayload<Props>) => …`, TS infers Props from the call and rejects a props getter whose return is not the component's props (probe: `{ wrong: 1 }` and `{ class: 'x' }` without `entity` both error). `const Stub: Component<{ label: string }> = () => ({});` type-checks with no cast.
- The single sound erasure is `payload as unknown as HostedDrawerPayload` inside `open`, where `HostedDrawerPayload = DrawerPayload<Record<string, unknown>>`. The host then renders `Component<Record<string, unknown>>` spread with `Record<string, unknown>`, which type-checks.

Existing call sites that open the host (both must move to the new shape in Task 1, because the payload type change breaks them at compile time):
- `QuestionExtendedInfoButton.svelte` — `handleClick` opens with a `content` snippet rendering `QuestionExtendedInfo` from a latched `shownQuestion`.
- The entity opener component in `dynamic-components/entityDetails/` — opens in an `$effect` with a `content` snippet rendering `EntityDetails` from a latched `shownEntity`.

Global type: `MaybeWrappedEntityVariant` is ambient (declared in `apps/frontend/src/lib/types/global.d.ts`), usable without import in `.ts` and test files.

Rune test pattern (from `popupState.svelte.test.ts`): create the subject inside `$effect.root(() => …)`, keep the returned cleanup, `flushSync()` after each state write. Use `$state.raw` for test-owned entity cells so identity (`toBe`) comparisons hold — a plain `$state` wraps objects in a proxy.

Effect ordering relied on by the hook: an `$effect.pre` created during init runs synchronously at creation and before `$effect`s in every later flush, so the latch is set before the open effect reads it. Consequence: the hook calls `getEntity()` the moment it is created, so the results page MUST call it after the `drawerEntity` `$derived.by` declaration (a call above it hits the temporal dead zone).
</interfaces>
</context>

<tasks>

<task type="tracer">
  <name>Task 1: Payload becomes a component plus a props getter, end to end through both openers</name>
  <files>apps/frontend/src/lib/components/modal/drawerHost/drawerHostState.svelte.ts, apps/frontend/src/lib/components/modal/drawerHost/drawerHostState.svelte.test.ts, apps/frontend/src/lib/components/modal/drawerHost/DrawerHost.svelte, apps/frontend/src/lib/components/questions/QuestionExtendedInfoButton.svelte, apps/frontend/src/lib/dynamic-components/entityDetails/EntityDrawerOpener.svelte</files>
  <precondition>Docker is running and nothing listens on port 5273 (the E2E wrapper's default FRONTEND_PORT); workspace packages are built (`yarn build`, cached).</precondition>
  <action>
Run `yarn build` once first so the workspace packages resolve for vitest and svelte-check.

1. `drawerHostState.svelte.ts` (locked design: component plus reactive props getter; keep `key`, `title`, `onDismiss`, `testId`):
   - Replace the `Snippet` type import with `Component` from `svelte`.
   - Make `DrawerPayload` generic: `DrawerPayload<Props extends object = Record<string, unknown>>` with `key: string`, `title: () => string`, `component: Component<Props>`, `props: () => Props`, `onDismiss?: () => void`, `testId?: string`. Remove the `content` field entirely. TSDoc every field: `component` — rendered by the host inside the app whose layout mounts it, so it resolves that app's contexts itself; `props` — a getter the host re-reads while rendering, so reactive state it reads (a latched entity, say) updates the open drawer in place without reopening it. Keep the existing TSDoc on `key`, `title`, `onDismiss`; give `testId` a one-line TSDoc (the `data-testid` carried onto the host's dialog).
   - Add and export `type HostedDrawerPayload = DrawerPayload<Record<string, unknown>>` with TSDoc: the erased form the host stores and renders; only `open` produces it.
   - `current` becomes `$state<HostedDrawerPayload | null>(null)`.
   - `open` becomes the generic arrow `<Props extends object>(payload: DrawerPayload<Props>): void`. Keep the `browser` guard as its first statement with its existing comment untouched, keep the no-host warning. Store with `this.current = payload as unknown as HostedDrawerPayload;` preceded by a single-line comment saying why it is sound: this signature has already checked that `props` returns what `component` accepts, and `Component` is contravariant in its props so no cast-free widening exists. No explicit-any type and no eslint-disable anywhere.
   - `close`, `register`, `newKey` unchanged.
   - Module docblock: the sentence saying the payload's snippet resolves every context its content reads becomes "the payload's component resolves every context it reads". Nothing else in the docblock changes.

2. `DrawerHost.svelte`:
   - Import `HostedDrawerPayload` (type) instead of `DrawerPayload`; `shown` becomes `$state<HostedDrawerPayload | null>(null)`.
   - Replace the render-tag line inside the `<svelte:boundary>` with `<shown.component {...shown.props()} />`. Keep `{#if shown}`, `{#key shown.key}`, the boundary with `onerror={handlePayloadError}` and its empty `failed` snippet exactly as they are. Do NOT use the `svelte:component` element — it is deprecated in runes mode and its warning fails `check --fail-on-warnings`. If svelte-check rejects the member-expression tag, fall back to an `{@const Content = shown.component}` inside the boundary rendering `<Content {...shown.props()} />`.
   - Do NOT touch the `$effect` that lags `shown` behind `drawerHost.current`, the close timer, `dismiss`, `forceClose`, `handlePayloadError`, the markup attributes or the styles. That lag is what keeps the payload rendering through the close animation (locked design: must be preserved). The docstring's "Teardown safety" paragraph is rewritten in Task 2, not here.

3. `QuestionExtendedInfoButton.svelte` (the second opener; the type change breaks it at compile time):
   - `handleClick` opens with `component: QuestionExtendedInfo` and `props: () => ({ question: shownQuestion, title: shownQuestion.text, onSectionCollapse, onSectionExpand, class: 'p-lg', 'data-testid': 'voter-questions-popup-info-modal' })` in place of `content`. Delete the `{#snippet content()}` block. Keep the `$state.raw` latch, its `$effect.pre`, the key and the close-by-key `$effect` unchanged.
   - Touched comments follow CLAUDE.md § Comment Hygiene: the ⚠ latch comment says the host keeps rendering the payload (not `content`) through its close animation, and its parenthetical keeps only the bare `see spike 034` form — drop the decision-id citation. The comment beside `open` about the missing payload `testId` is rewritten in present tense: the test id stays on the info body the host renders rather than on the host's persistent dialog, so the questions-info fixture's hidden-state assertion measures a body that is not mounted rather than a dialog that exists but is closed. No decision ids, no "has always".
   - `@component` docstring: "the content snippet and the accessible name" becomes "the content component with its props, and the accessible name".

4. The entity opener component in `apps/frontend/src/lib/dynamic-components/entityDetails/` (deleted in Task 2; this keeps the tree compiling and the tracer runnable): in its `open` call replace `content` with `component: EntityDetails` and `props: () => ({ entity: shownEntity, class: 'min-h-full' })`, and delete its `{#snippet content()}` block. Nothing else in that file changes.

5. `drawerHostState.svelte.test.ts`:
   - Replace the `Snippet` import and the cast-based `payload(key)` helper with a typed stub, `const Stub: Component<{ label: string }> = () => ({});`, and a helper returning `DrawerPayload<{ label: string }>` with `component: Stub` and `props: () => ({ label: key })`. No `as unknown as` in the test.
   - Keep the four existing tests unchanged in intent.
   - Add a test: with a host registered, open a payload whose props getter closes over a local `let label`; assert `drawerHost.current?.component` is `Stub` and `drawerHost.current?.props()` returns the current label, then change the local and assert `props()` reflects the change (the host re-reads a getter, it does not hold a snapshot).
   - Add a compile-time check inside a test body: an `open` call whose props getter returns `{ wrong: 1 }`, preceded by a `// @ts-expect-error` comment giving the reason (props must match the component). svelte-check (`check`) enforces it; at runtime it just stores a payload, which `afterEach` clears.
   - Comments single-line per paragraph: `yarn assert:comment-hygiene` (inside `lint:check`) fails a comment line that ends without terminal punctuation and continues on the next line. This applies to every comment written in this plan.

Commit: `refactor: drawer payload becomes a component plus a props getter`.
  </action>
  <verify>
    <automated>yarn workspace @openvaa/frontend test:unit drawerHostState && yarn workspace @openvaa/frontend check && tests/scripts/e2e-run.sh --run-dir tests/e2e-runs/quick-260927-kjb-t1 --no-db-reset --project voter-results-redraw</automated>
  </verify>
  <done>
- `drawerHostState.svelte.test.ts` passes, including the props-getter reactivity test; `check` exits 0 with zero warnings, which proves the `@ts-expect-error` mismatch line is still an error.
- `git grep -n "content()" -- apps/frontend/src/lib/components/modal/drawerHost apps/frontend/src/lib/components/questions/QuestionExtendedInfoButton.svelte` returns nothing.
- `tests/scripts/e2e-run.sh … --project voter-results-redraw` exits 0 (preflight SUCCESS, 0 failed, 0 flaky, 0 did-not-run): the entity drawer opens, swaps and closes through the new payload.
  </done>
</task>

<task type="auto" tdd="true">
  <name>Task 2: useEntityDrawer hook replaces the opener component on the results page</name>
  <files>apps/frontend/src/lib/dynamic-components/entityDetails/useEntityDrawer.svelte.ts, apps/frontend/src/lib/dynamic-components/entityDetails/useEntityDrawer.svelte.test.ts, apps/frontend/src/lib/dynamic-components/entityDetails/index.ts, apps/frontend/src/routes/(voters)/(located)/results/[[electionTab]]/[[entityTab=etPl]]/[[entity=etSg]]/[[id]]/+page.svelte, apps/frontend/src/lib/components/modal/drawerHost/DrawerHost.svelte, apps/frontend/src/lib/dynamic-components/entityDetails/EntityDrawerOpener.svelte (delete), apps/frontend/src/lib/dynamic-components/entityDetails/EntityDrawerOpener.type.ts (delete)</files>
  <precondition>Task 1 is committed; Docker is running and nothing listens on port 5273.</precondition>
  <behavior>
    - While the getter returns undefined, `drawerHost.open` is never called.
    - When the getter first returns entity A, `open` is called exactly once, with the key from `drawerHost.newKey('entity')`, `testId` `'voter-results-drawer'`, `onDismiss` identical to the `onClose` passed in, `component` identical to `EntityDetails`, `props()` returning `{ entity: A, class: 'min-h-full' }` and `title()` returning A's name.
    - Getter switches A to B while open: `open` is still called once in total, and the same payload's `props().entity` is B and `title()` is B's name.
    - Getter returns undefined: `close` is called with the opened key, and the payload's `props().entity` is still B (latch retained through the close animation).
    - Getter returns C again: `open` is called a second time, with a new key, and `props().entity` is C.
    - Destroying the effect root while open calls `close` with the current key.
  </behavior>
  <action>
RED first: write `useEntityDrawer.svelte.test.ts` in `apps/frontend/src/lib/dynamic-components/entityDetails/` covering every `<behavior>` bullet, run it, confirm it fails (the module does not exist yet), commit `test: useEntityDrawer opens, swaps, closes and latches the entity drawer`.
   - Mocks via `vi.hoisted` + `vi.mock`: `$lib/components/modal/drawerHost` exporting a `drawerHost` whose `newKey` returns `${prefix}-${counter}` from a local counter and whose `open` and `close` are `vi.fn()`; `./EntityDetails.svelte` exporting a typed stub component as `default` (so the hook's `component` can be compared by identity and no real component tree is compiled); `$lib/utils/entities` exporting `unwrapEntity` that returns `{ entity: e }`.
   - Drive the hook with a test-owned `$state.raw<MaybeWrappedEntityVariant | undefined>` cell inside `$effect.root`, `flushSync()` after every write, and call the root's cleanup in `afterEach`. Fake entities are minimal objects with a `name`, cast once each to `MaybeWrappedEntityVariant` through `unknown` (test-only). Read the payload from `open.mock.calls`.

GREEN: create `useEntityDrawer.svelte.ts` (locked design, per the exploration session):
   - Export `function useEntityDrawer(getEntity: () => MaybeWrappedEntityVariant | undefined, onClose: () => void): void` with TSDoc: opens `EntityDetails` for the entity `getEntity` returns in the app's `DrawerHost` while it returns one, and closes it when it returns undefined or when the calling component is destroyed; call once at component init; switching entity while open updates the open drawer in place; the content renders from the last defined entity because the host keeps rendering through its close animation after the getter already returns undefined (see spike 034). `@param` for both arguments. It receives a getter and never destructures a context accessor (CLAUDE.md Context Destructuring Rule).
   - Imports: `untrack` from `svelte`; `drawerHost` from `$lib/components/modal/drawerHost`; `unwrapEntity` from `$lib/utils/entities`; `EntityDetails` default-imported directly from `./EntityDetails.svelte` (not from the `.` barrel, which will re-export this hook — that would be an import cycle).
   - Latch: `let latched = $state.raw<MaybeWrappedEntityVariant | undefined>()` and an `$effect.pre` that assigns `latched = entity` whenever `getEntity()` returns a defined entity. It is never reset to undefined.
   - `const isOpen = $derived(!!getEntity())`.
   - One `$effect`: if `!isOpen` return; otherwise `const key = drawerHost.newKey('entity')`, then `untrack(() => drawerHost.open({ key, title: () => unwrapEntity(<latched entity>).entity.name, component: EntityDetails, props: () => ({ entity: <latched entity>, class: 'min-h-full' }), onDismiss: onClose, testId: 'voter-results-drawer' }))`, and return `() => drawerHost.close(key)`. The effect depends only on `isOpen`, so an A to B switch never reruns it (no reopen), and its teardown closes on both the false transition and component destroy.
   - Reading the latched entity inside the getters: the latch is typed with `undefined`, but the getters only run after the pre-effect has latched a defined entity. A single non-null assertion on the latch (the results page already uses `!` on route params) with a one-line comment stating that invariant is acceptable; so is a small private accessor that encapsulates it. No explicit-any type.
   - `testId` carries no historical comment. At most a one-line present-tense note (the results specs locate the drawer by this id).
   - Run the test: GREEN. Commit `refactor: replace the entity drawer opener component with useEntityDrawer`, together with the wiring below.

Wiring and deletion (same GREEN commit):
   - `entityDetails/index.ts`: remove the two opener exports (the `.svelte` default export and the `.type` re-export); add `export * from './useEntityDrawer.svelte';` in alphabetical position.
   - Delete the opener's `.svelte` and `.type.ts` files with `git rm`.
   - Results page `+page.svelte`: replace the opener import with `import { useEntityDrawer } from '$lib/dynamic-components/entityDetails';` (keep the import sort order `yarn lint:check` enforces). Insert `useEntityDrawer(() => (drawerVisible ? drawerEntity : undefined), handleDrawerClose);` in the script directly AFTER the `drawerEntity` `$derived.by` block and before the "Track events" section. It must come after that declaration: the hook's pre-effect calls the getter synchronously at creation. `handleDrawerClose` is a function declaration, so it is hoisted and may be referenced there. Give the call the content of the removed template comment as a `//` comment: the drawer renders nothing in this file; the hook hands its payload to the `DrawerHost` mounted once in the voter app's root layout, and `voter-results-drawer` rides on that payload's `testId`. Delete the `{#if drawerVisible && drawerEntity}` template block and the template comment above it. In the `@component` docstring change only the sentence saying the page mounts the entity drawer's opener to say it opens the entity drawer through `useEntityDrawer`. Do not edit any other comment in the file.
   - `DrawerHost.svelte` docstring, "Teardown safety" paragraph (per locked design: point the last-defined-value reference at the hook): rewrite it in present tense with no decision id and no "previously". Content: the hosted payload is wrapped in `<svelte:boundary>` (the only valid attributes are `onerror`, `failed` and `pending`); the host keeps rendering the payload through the out-animation after its opener stops supplying a value, and a throw raised in that flush would abort the close and leave the dialog open with no way out; the openers' last-defined-value convention (see `useEntityDrawer.svelte.ts` in `$lib/dynamic-components/entityDetails`) prevents the throw and the boundary prevents the hang; a `try/catch` cannot do this job because it cannot intercept an error raised inside Svelte's render flush. Nothing else in `DrawerHost.svelte` changes in this task.
  </action>
  <verify>
    <automated>yarn workspace @openvaa/frontend test:unit useEntityDrawer drawerHostState && yarn workspace @openvaa/frontend check && ! git grep -n EntityDrawerOpener -- apps packages tests/tests && tests/scripts/e2e-run.sh --run-dir tests/e2e-runs/quick-260927-kjb-t2 --no-db-reset --project voter-results-redraw</automated>
  </verify>
  <done>
- `useEntityDrawer.svelte.test.ts` has a committed RED run followed by GREEN; every `<behavior>` bullet is an assertion that passes.
- The opener component and its type file are gone; `git grep EntityDrawerOpener -- apps packages tests/tests` finds nothing.
- The results page calls `useEntityDrawer(` once, after the `drawerEntity` declaration, and has no drawer block in its template.
- `check` exits 0 with zero warnings; the voter-results-redraw project run exits 0 with preflight SUCCESS and 0 failed / 0 flaky / 0 did-not-run.
  </done>
</task>

<task type="auto">
  <name>Task 3: Skill references, hygiene sweep and the full gate</name>
  <files>.claude/skills/spike-findings-voting-advice-application-gsd/references/results-redraw.md, .claude/skills/spike-findings-voting-advice-application-gsd/SKILL.md, .claude/skills/components/SKILL.md</files>
  <precondition>Tasks 1 and 2 are committed; Docker is running and nothing listens on port 5273.</precondition>
  <action>
1. `results-redraw.md`, the two drawer-host bullets under the shipped-fixes section:
   - The payload field list `{key, title, content, onDismiss, testId}` becomes `{key, title, component, props, onDismiss, testId}`, and "The snippet renders inside the voter app" becomes "The payload's component renders inside the voter app".
   - The last-defined-value bullet: the host keeps rendering the payload (not `content`) through its close animation after the opener stops supplying a value; each opener keeps a `$state.raw` latch fed by an `$effect.pre`, and the payload's `props` getter reads the latch — `apps/frontend/src/lib/dynamic-components/entityDetails/useEntityDrawer.svelte.ts` for the entity drawer, `apps/frontend/src/lib/components/questions/QuestionExtendedInfoButton.svelte` for question info. Replace the `let shownEntity = $state.raw(entity)` example accordingly. Keep the `<svelte:boundary>` / `try/catch` sentence.
   - Leave the historical Origin section as it is (skills are exempt from comment hygiene, and it is history by design).
2. `spike-findings-voting-advice-application-gsd/SKILL.md`: in the production-file mapping table row for the drawer host, replace the entity opener component path with `dynamic-components/entityDetails/useEntityDrawer.svelte.ts`. Change nothing else in the row.
3. `components/SKILL.md` convention 1: re-derive its counts over the three target directories with the same method — files calling `$props()`, co-located `*.type.ts` files, and the three zero rows (`export let`, `$$Props`, `<slot`). If any number differs from the text, update the numbers and the measurement date (2026-09-27). If none differ, leave the file untouched and drop it from the commit.
4. Do NOT regenerate the docs component listing: it never listed the deleted opener, and its `QuestionExtendedInfoButton` page is already out of step with the source, so a regeneration here would sweep unrelated drift into this change.
5. Repo-wide sweep: `git grep -n EntityDrawerOpener -- apps packages tests/tests .claude CLAUDE.md` must find nothing (`.planning/` history is exempt; `tests/e2e-runs/` is gitignored run evidence and is not touched). `git grep -n "drawerHost.open" -- apps` must list only the hook and `QuestionExtendedInfoButton.svelte`; the type system already rejects a leftover `content` field.
6. Hygiene of every line this plan added under `apps/` (CLAUDE.md § Comment Hygiene; `yarn assert:comment-hygiene` only covers escapes and forced line breaks, so this scoped check covers the reference forms): write the diff against the planning-time base `3f95dd5c8` to a temp file, then assert no added line cites a decision id, a `.planning/` path or a plan number. Read every touched comment once more for historical narrative, which no grep catches.
7. Full gate, each status read directly (never through a pipe): `yarn lint:check`, `yarn format:check`, `yarn workspace @openvaa/frontend check`, `yarn test:unit`, then `tests/scripts/e2e-run.sh --run-dir tests/e2e-runs/quick-260927-kjb --no-db-reset`. Read the run's JSON report in the run directory: `stats.unexpected`, `stats.flaky` and `stats.skipped` must all be 0 and no test may be did-not-run. The voter-results-redraw, voter-journey, voter-alliance and perm-interactive-info projects are the most relevant. Per CLAUDE.md any failing, flaky or did-not-run test blocks completion: diagnose the root cause and fix it; never retry until green. If the run dies with ENOSPC, run `docker builder prune -af` and rerun (never delete `tests/e2e-runs/`).
8. `bash .claude/scripts/audit-skill-links.sh components` and `bash .claude/scripts/audit-skill-links.sh spike-findings-voting-advice-application-gsd` both exit 0.

Commit: `docs: point the drawer-host skill references at useEntityDrawer` (skill files only; if a gate forced a code fix, commit that fix separately with a `fix:` message naming what failed).
  </action>
  <verify>
    <automated>! git grep -n EntityDrawerOpener -- apps packages tests/tests .claude CLAUDE.md && git diff 3f95dd5c8 -U0 -- apps/ > "${TMPDIR:-/tmp}/kjb-apps.diff" && ! grep -nE '^\+.*(\bD-[0-9]{2}\b|\.planning/|\b1[0-9]{2}-0[0-9]\b)' "${TMPDIR:-/tmp}/kjb-apps.diff" && bash .claude/scripts/audit-skill-links.sh components && bash .claude/scripts/audit-skill-links.sh spike-findings-voting-advice-application-gsd && yarn lint:check && yarn format:check && yarn workspace @openvaa/frontend check && yarn test:unit && tests/scripts/e2e-run.sh --run-dir tests/e2e-runs/quick-260927-kjb --no-db-reset</automated>
  </verify>
  <done>
- No tracked file under `apps/`, `packages/`, `tests/tests/`, `.claude/` or `CLAUDE.md` names the deleted opener; the skill references describe the component-plus-props payload and cite `useEntityDrawer.svelte.ts`.
- No added line under `apps/` carries a decision id, a `.planning/` path or a plan number.
- `yarn lint:check`, `yarn format:check`, the frontend `check`, `yarn test:unit` and both skill-link audits exit 0.
- The full E2E run in `tests/e2e-runs/quick-260927-kjb` exits 0 with preflight SUCCESS, and its report shows 0 unexpected, 0 flaky, 0 skipped, 0 did-not-run.
  </done>
</task>

</tasks>

<threat_model>
## Trust Boundaries

| Boundary | Description |
|----------|-------------|
| server render → module singleton | `drawerHost` is module-level state; a server-side write would leak one request's payload into another request sharing the module scope |
| opener → host render flush | the host renders opener-supplied component and props after the opener may already be destroyed |

No new network, auth, storage or user-input surface: this is a client-side refactor of how an existing dialog receives its content.

## STRIDE Threat Register

| Threat ID | Category | Component | Severity | Disposition | Mitigation Plan |
|-----------|----------|-----------|----------|-------------|-----------------|
| T-260927-kjb-01 | Information disclosure | `drawerHost.open` (module singleton under SSR) | medium | mitigate | The `browser` guard stays the first statement of the now-generic `open`, with its comment untouched (Task 1). The hook calls `open` only inside `$effect`, which never runs during SSR. `drawerHostState.svelte.test.ts` keeps passing under the mocked `browser: true`. |
| T-260927-kjb-02 | Denial of service | `DrawerHost.svelte` rendering the payload during the close animation | medium | mitigate | The `<svelte:boundary onerror={handlePayloadError}>` and its empty `failed` snippet stay around the rendered component, and the host's lagging `shown` effect is untouched (Task 1). The hook's props and title read the last-defined-entity latch, so the close flush never renders an undefined entity (Task 2 unit test "latch retained"). The voter-results-redraw E2E opens and closes the drawer. |
| T-260927-kjb-03 | Tampering (type integrity) | payload erasure in `open` | low | mitigate | The one `as unknown as HostedDrawerPayload` sits inside `open`, whose generic signature pairs `component` with `props`. The `@ts-expect-error` mismatch case in `drawerHostState.svelte.test.ts` proves the pairing is enforced by `check`. No explicit-any type is introduced. |
| T-260927-kjb-SC | Tampering | npm/pip/cargo installs | high | accept | This plan installs no packages; no package-legitimacy gate applies. |
</threat_model>

<verification>
- Task 1: payload contract, host render and both openers compile under `check --fail-on-warnings`; the host-state unit test passes; the voter-results-redraw project is green.
- Task 2: the hook's RED→GREEN unit test passes; the opener component is deleted with zero references in `apps/`, `packages/` and `tests/tests/`; the voter-results-redraw project is green again through the hook.
- Task 3: skill references updated; hygiene of added lines verified; `yarn lint:check`, `yarn format:check`, the frontend `check`, `yarn test:unit` and the full E2E suite all pass with 0 failed / 0 flaky / 0 skipped / 0 did-not-run.
</verification>

<success_criteria>
- `DrawerPayload<Props>` carries `component: Component<Props>` and `props: () => Props` (plus `key`, `title`, `onDismiss`, `testId`); `current` is `HostedDrawerPayload | null`; no explicit-any type anywhere in the change.
- `DrawerHost.svelte` renders `<shown.component {...shown.props()} />` inside the unchanged `<svelte:boundary>`, and still keeps the payload on screen through the close animation.
- `useEntityDrawer(getEntity, onClose)` exists in `apps/frontend/src/lib/dynamic-components/entityDetails/`, is exported from that folder's `index.ts`, opens once per open transition with a `drawerHost.newKey('entity')` key, swaps A to B through the reactive props and title without reopening, closes on undefined and on teardown, and renders from a latched last-defined entity.
- The results page calls the hook once at script level after `drawerEntity`; the opener component and its type file are deleted; `QuestionExtendedInfoButton` uses the new payload.
- Every added or changed comment obeys CLAUDE.md § Comment Hygiene, and every exported symbol has TSDoc.
- The full E2E suite passes: 0 failed, 0 flaky, 0 skipped, 0 did-not-run.
</success_criteria>

<output>
Create `.planning/quick/260927-kjb-replace-entitydraweropener-component-wit/260927-kjb-SUMMARY.md` when done
</output>
