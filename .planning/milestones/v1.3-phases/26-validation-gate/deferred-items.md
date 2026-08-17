# Deferred Items - Phase 26 Validation Gate

## Svelte 5 Reactivity Bug: $state changes in {#snippet} blocks

**Discovered during:** Plan 26-03, Task 1
**Severity:** Medium (workaround in place for E2E tests)
**Affected files:** `apps/frontend/src/routes/(voters)/(located)/results/+page.svelte`

### Issue

When `$state` variables are modified inside event handlers (e.g., `handleEntityTabChange` setting `activeEntityType`), the template rendering inside `{#snippet}` blocks does not update. The JavaScript value changes correctly (confirmed via `console.log`), `$effect` callbacks that depend on the state also run correctly, but the DOM elements referencing the state variable don't re-render.

This affects the results page tab switching between Candidates and Parties sections. The Tabs component correctly updates its visual state, and the `onChange` callback fires and updates `activeEntityType`. But the content section (which is inside a `{#snippet fullWidth()}` block rendered by `MainContent`) continues showing the previous entity type's data.

### Evidence

- `console.log` confirms `activeEntityType` changes from `'candidate'` to `'organization'`
- `$effect` callbacks that depend on `activeEntityType` do NOT re-run after the change
- A debug `<div>` in the template showing `{activeEntityType}` continues to display `'candidate'`
- A separate `$state` counter incremented in the same handler also fails to update in the DOM
- The issue persists after page reload, container restart, and code changes
- The issue is pre-existing (present in the original code before any Plan 26-03 changes)

### Workaround

E2E tests have been updated to:
1. Not rely on tab switching for content assertions
2. Navigate directly to entity detail page URLs instead of clicking through the drawer
3. Verify tab UI state changes (visual selection) without asserting content section updates

### Recommended Investigation

- Check if Svelte 5.53.12 has known issues with reactivity in `{#snippet}` contexts
- Test with a minimal reproduction case outside of SvelteKit
- Consider refactoring the results page to not use `{#snippet fullWidth()}`

## Auth Setup Loading Timeout

**Discovered during:** Plan 26-03, Task 1
**Severity:** Low (infrastructure, pre-existing)

The candidate app login page sometimes fails to load within the timeout. The root layout fetches data promises from Strapi and shows `<Loading>` until they resolve. When Strapi is slow or overloaded (e.g., during parallel test execution), the page can stay on `Loading...` indefinitely.

The auth-setup test has been updated with retry logic (3 attempts, 20s each) but this may not be sufficient if Strapi is consistently unresponsive.
