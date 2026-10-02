# DrawerHost

# The app's single drawer

Mount exactly one in the root layout of each app that offers drawers, below that app's context init — the voter app mounts it in `routes/(voters)/+layout.svelte`; enabling drawers in the candidate app is one more `<DrawerHost />` in `routes/candidate/+layout.svelte`. Hosted content is rendered here, so it resolves the contexts of the app it is mounted in; openers pass no contexts.

Shows `drawerHost.current` (see `drawerHostState.svelte.ts`) in ONE persistent `<dialog>`:

- **open**: `showModal()`, then the panel slides up and the backdrop fades in (CSS transitions, one frame after `showModal`).
- **payload change while open** (entity A → entity B, or entity → question info): content swaps; the dialog is not reopened, so nothing behind it repaints and no backdrop flash.
- **close**: panel slides down and backdrop fades out, THEN `dialog.close()` — the out-animation the per-route `Drawer` could not play (its parent `{#if}` removed it instantly).

User dismissal (close button, backdrop click, Escape) calls the payload's `onDismiss` — routed openers navigate back, and their unmount closes the host.

### Accessibility

Holds `ModalContainer`'s contract rather than the `<dialog>` defaults: Escape is intercepted by a document-level key handler (the native `cancel` → `close` path would skip the host's own cleanup and the out-animation), focus enters the dialog after the open animation via `focusFirstDescendant`, the backdrop dismissal is a labelled `<button>` rather than a bare click target on the dialog, and the dialog carries `aria-modal` plus an `aria-label` fed from the payload's title getter.

### Teardown safety

The hosted payload is wrapped in `<svelte:boundary>` — the only valid attributes are `onerror`, `failed` and `pending`. The host keeps rendering the payload through the out-animation after its opener stops supplying a value, and a throw raised in that flush would abort the close and leave the dialog open with no way out. The openers' last-defined-value convention (see `openEntityDrawer.svelte.ts` in `$lib/dynamic-components/entityDetails`) prevents the throw; the boundary prevents the hang. A `try/catch` cannot do this job — it cannot intercept an error raised inside Svelte's render flush.

## Source

[apps/frontend/src/lib/components/modal/drawerHost/DrawerHost.svelte](https://github.com/OpenVAA/voting-advice-application/blob/main/apps/frontend/src/lib/components/modal/drawerHost/DrawerHost.svelte)
