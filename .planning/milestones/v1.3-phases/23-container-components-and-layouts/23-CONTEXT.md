# Phase 23: Container Components and Layouts - Context

**Gathered:** 2026-03-19
**Status:** Ready for planning

<domain>
## Phase Boundary

Container components with named `<slot>` elements are converted to `{@render}` snippet props, `createEventDispatcher` is removed from all remaining dispatching components and replaced with callback props, and root layout components (Layout, MainContent, SingleCardContent) are migrated to runes with snippet-based content rendering. All consumer call sites across voter, candidate, and admin apps are updated atomically.

</domain>

<decisions>
## Implementation Decisions

### Snippet prop naming convention
- Named slots map directly to snippet prop names: `slot="actions"` → `actions` snippet prop
- Default slot becomes `children` (official Svelte 5 convention)
- No suffix — just the slot name (not `actionsSnippet`)
- Consumers change from `<div slot="actions">` to `{#snippet actions()}...{/snippet}`
- Default content can be placed directly inside component tags (no `{#snippet}` wrapper needed)

### Conditional slot rendering
- `$$slots.note` checks → simple truthiness check: `{#if note}{@render note()}{/if}`
- No explicit `undefined` checks — snippet props are undefined when not passed, truthiness works

### Snippet pass-through (forwarding)
- TimedModal's `<slot name="actions" slot="actions" />` → pass-through prop: accept `actions` snippet prop and pass it directly to child Modal component
- No wrapper snippets needed for simple forwarding

### Callback prop convention
- All callback props use **camelCase** `on` prefix: `onExpand`, `onCollapse`, `onKeyboardFocusOut`, `onCancel`, `onSent`, `onError`, `onClick`
- This applies universally — even simple events use camelCase (`onClick`, not `onclick`) for consistency across all custom callbacks
- Phase 22's lowercase pattern (`onclick`, `onchange`) was for native HTML event attributes; custom callbacks use camelCase

### createEventDispatcher → callback prop mapping
- **Alert**: dispatches `open`/`close` → `onOpen`/`onClose` callback props (existing `onClose` prop kept, `onOpen` added)
- **Expander**: dispatches `expand`/`collapse` → `onExpand`/`onCollapse` callback props
- **Navigation**: dispatches `keyboardFocusOut` → `onKeyboardFocusOut` callback prop
- **SurveyButton**: dispatches `click` → `onClick` callback prop
- **Feedback**: dispatches `cancel`/`error`/`sent` → `onCancel`/`onError`/`onSent` callback props
- DataConsent already uses `onchange` prop — no dispatcher to remove (verify and align naming to camelCase if needed)

### Layout.svelte migration
- Full runes conversion: `export let` → `$props()`, `$$restProps` → `...restProps`
- `isDrawerOpen` gets `$bindable()` annotation
- `menu` slot → `menu` snippet prop, default slot → `children`
- `on:click={closeDrawer}` on drawer overlay → `onclick={closeDrawer}`
- Route layout consumers update `slot="menu"` to `{#snippet menu()}...{/snippet}`

### MainContent.svelte migration
- All 6 named slots become snippet props: `note`, `hero`, `heading`, `fullWidth`, `primaryActions`
- Default slot → `children`
- All `$$slots.*` conditional checks → simple truthiness checks
- Full runes conversion alongside snippet migration
- All ~15 consumer route files updated atomically

### Legacy component runes upgrade
- All 6 legacy container components (Alert, ModalContainer, TimedModal, SingleCardContent, MainContent, Layout) get full runes conversion alongside snippet/dispatcher work
- `export let` → `$props()`, `$$restProps` → `...restProps`, `$$slots` → truthiness checks, `type $$Props` renamed
- Add `<svelte:options runes />` to each
- This mirrors Phase 22's leaf component migration pattern — no partial conversions

### ModalContainer modernization
- `on:transitionend` → `ontransitionend`, `on:click` → `onclick`
- `svelte:document on:keydown` → `<svelte:document onkeydown={handler} />`
- Full runes conversion for props and state

### TimedModal modernization
- `$:` reactive statement for progressBarTimer → `$effect`
- `$$restProps` → `...restProps`
- Slot forwarding → snippet pass-through
- Full runes conversion

### Route layout consumer updates
- Claude's discretion on whether to also convert `on:event` patterns in route layout files while touching them for snippet updates, or keep those for Phase 24

### Cross-app consumer updates
- Carry forward from Phase 22: update ALL call sites (voter + candidate + admin) immediately
- Both apps must remain compilable throughout

### Verification approach
- Carry forward from Phase 22: E2E tests verified at phase end, not per-component
- All 92 E2E tests must pass after complete phase migration

### Claude's Discretion
- Migration ordering and plan batching strategy
- Minimal safe change set per route layout file (snippet-only vs full modernization)
- How to handle `svelte:document` event binding (confirmed: use native event attributes on svelte:document if that's the Svelte-recommended method)
- Edge cases in snippet conversion for complex components

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Svelte 5 migration patterns
- `apps/frontend/svelte.config.js` — Current compiler config; per-component runes opt-in
- Svelte 5 migration guide (external) — `{@render}` snippets, `$props()`, `$bindable()`, callback props, `children` convention

### Container components to migrate
- `apps/frontend/src/lib/components/alert/Alert.svelte` — Named `actions` slot + `createEventDispatcher` (open, close) + legacy mode
- `apps/frontend/src/lib/components/modal/Modal.svelte` — Named `actions` slot + legacy mode
- `apps/frontend/src/lib/components/modal/ModalContainer.svelte` — Default slot + `on:transitionend` + `svelte:document on:keydown` + legacy mode
- `apps/frontend/src/lib/components/modal/timed/TimedModal.svelte` — Slot forwarding (`<slot name="actions" slot="actions" />`) + `$:` reactive + legacy mode
- `apps/frontend/src/lib/components/modal/drawer/Drawer.svelte` — Default slot (check runes status)
- `apps/frontend/src/lib/components/modal/confirmation/ConfirmationModal.svelte` — Default slot (check runes status)
- `apps/frontend/src/lib/components/button/Button.svelte` — Named `badge` slot (already in runes)
- `apps/frontend/src/lib/components/headingGroup/HeadingGroup.svelte` — Default slot (already in runes)
- `apps/frontend/src/lib/components/expander/Expander.svelte` — Default slot + `createEventDispatcher` (already in runes)
- `apps/frontend/src/lib/components/warning/Warning.svelte` — Default slot (check runes status)
- `apps/frontend/src/lib/components/input/InputGroup.svelte` — Default slot (check runes status)
- `apps/frontend/src/lib/components/buttonWithConfirmation/ButtonWithConfirmation.svelte` — Default slot (check runes status)
- `apps/frontend/src/lib/components/term/Term.svelte` — Inline default slot (check runes status)

### Dispatching components to migrate
- `apps/frontend/src/lib/dynamic-components/feedback/Feedback.svelte` — `createEventDispatcher` (cancel, error, sent) — already in runes
- `apps/frontend/src/lib/dynamic-components/survey/SurveyButton.svelte` — `createEventDispatcher` (click) — already in runes
- `apps/frontend/src/lib/dynamic-components/navigation/Navigation.svelte` — `createEventDispatcher` (keyboardFocusOut) — already in runes
- `apps/frontend/src/lib/dynamic-components/dataConsent/DataConsent.svelte` — Already uses callback props (verify onchange → onChange alignment)

### Layout components to migrate
- `apps/frontend/src/routes/MainContent.svelte` — 6 named slots + legacy mode
- `apps/frontend/src/routes/SingleCardContent.svelte` — Named `note` slot + legacy mode
- `apps/frontend/src/routes/Layout.svelte` — Named `menu` slot + `isDrawerOpen` bind + `on:click` + legacy mode

### Key consumer files
- `apps/frontend/src/routes/(voters)/+layout.svelte` — Layout consumer with `slot="menu"` + `on:keyboardFocusOut`
- `apps/frontend/src/routes/candidate/+layout.svelte` — Layout consumer with `slot="menu"` + `on:keyboardFocusOut`
- `apps/frontend/src/routes/admin/+layout.svelte` — Layout consumer with `slot="menu"` + `on:keyboardFocusOut`
- `apps/frontend/src/lib/dynamic-components/feedback/modal/FeedbackModal.svelte` — Feedback consumer with `on:cancel`/`on:sent`
- `apps/frontend/src/lib/dynamic-components/feedback/popup/FeedbackPopup.svelte` — Feedback consumer with `on:sent`
- `apps/frontend/src/lib/dynamic-components/survey/popup/SurveyPopup.svelte` — SurveyButton consumer with `on:click`
- `apps/frontend/src/lib/dynamic-components/navigation/voter/VoterNav.svelte` — Navigation consumer with `on:keyboardFocusOut`
- `apps/frontend/src/lib/dynamic-components/navigation/admin/AdminNav.svelte` — Navigation consumer
- `apps/frontend/src/lib/components/questions/QuestionBasicInfo.svelte` — Expander consumer with `on:expand`/`on:collapse`
- `apps/frontend/src/lib/components/questions/QuestionExtendedInfo.svelte` — Expander consumer with `on:expand`/`on:collapse`

### Dynamic components with slots
- `apps/frontend/src/lib/dynamic-components/entityCard/EntityCard.svelte` — Default slot
- `apps/frontend/src/lib/dynamic-components/entityCard/EntityCardAction.svelte` — Default slot
- `apps/frontend/src/lib/dynamic-components/navigation/NavItem.svelte` — Default slot
- `apps/frontend/src/lib/dynamic-components/navigation/NavGroup.svelte` — Default slot
- `apps/frontend/src/lib/dynamic-components/entityDetails/InfoItem.svelte` — Default slot

### Requirements
- `.planning/REQUIREMENTS.md` — COMP-04, COMP-05, LAYOUT-01, LAYOUT-02

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- `concatClass()` utility — Already adapted for `...restProps` pattern in Phase 22; same usage here
- Phase 22 established the `$props()` destructuring + `...restProps` pattern across 98 leaf components
- `$bindable()` annotation pattern established in Phase 22 for bound props

### Established Patterns
- Per-component `<svelte:options runes />` — not global runes flag
- Callback props for native events: `onclick`, `onchange` (Phase 22)
- Custom callback props: camelCase `on` prefix — `onExpand`, `onClose`, etc. (Phase 23 decision)
- `bind:this` for export function consumers (Phase 22 decision)
- `children` for default slot content (Svelte 5 convention, Phase 23 decision)

### Integration Points
- Layout.svelte is consumed by all 3 app root layouts (voters, candidate, admin)
- MainContent.svelte is consumed by ~15 voter route pages
- SingleCardContent.svelte is consumed by entity detail pages
- Expander consumers include QuestionBasicInfo and QuestionExtendedInfo
- Feedback consumers include FeedbackModal and FeedbackPopup
- Navigation consumers include VoterNav and AdminNav

</code_context>

<specifics>
## Specific Ideas

- When converting slots to snippets, use the Svelte-recommended approach for `svelte:document` event bindings (native event attributes)
- camelCase callback convention applies universally to all custom callbacks for consistency

</specifics>

<deferred>
## Deferred Ideas

- **Layout → +layout conversion**: Convert Layout.svelte, MainContent.svelte, SingleCardContent.svelte into proper `+layout` files. This wasn't possible in Svelte 4 because `+layout` files couldn't accept slots, but Svelte 5 snippets may enable this pattern. Would simplify the routing architecture.

</deferred>

---

*Phase: 23-container-components-and-layouts*
*Context gathered: 2026-03-19*
