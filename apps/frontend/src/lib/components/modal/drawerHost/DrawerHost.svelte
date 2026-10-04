<!--@component

# The app's single drawer

Mount exactly one in the root layout of each app that offers drawers, below that app's context init — the voter app mounts it in `routes/(voters)/+layout.svelte`; enabling drawers in the candidate app is one more `<DrawerHost />` in `routes/candidate/+layout.svelte`. Hosted content is rendered here, so it resolves the contexts of the app it is mounted in; openers pass no contexts.

Shows `drawerHost.current` (see `drawerHostState.svelte.ts`) in ONE persistent `<dialog>`:

- **open**: `showModal()`, then the panel slides up and the backdrop fades in (CSS transitions, one frame after `showModal`).
- **payload change while open** (entity A → entity B, or entity → question info): content swaps; the dialog is not reopened, so nothing behind it repaints and no backdrop flash.
- **close**: panel slides down and backdrop fades out, THEN `dialog.close()`, so the out-animation plays in full (under reduced motion the dialog closes at once).

User dismissal (close button, backdrop click, Escape) calls the payload's `onDismiss` — routed openers navigate back, and their unmount closes the host.

### Accessibility

Holds `ModalContainer`'s contract rather than the `<dialog>` defaults: Escape is intercepted by a document-level key handler (the native `cancel` → `close` path would skip the host's own cleanup and the out-animation), focus enters the dialog after the open animation via `focusFirstDescendant`, the backdrop dismissal is a labelled `<button>` rather than a bare click target on the dialog, and the dialog carries `aria-modal` plus an `aria-label` fed from the payload's title getter.

### Teardown safety

The hosted payload is wrapped in `<svelte:boundary>` — the only valid attributes are `onerror`, `failed` and `pending`. The host keeps rendering the payload through the out-animation after its opener stops supplying a value, and a throw raised in that flush would abort the close and leave the dialog open with no way out. The openers' last-defined-value convention (see `openEntityDrawer.svelte.ts` in `$lib/dynamic-components/entityDetails`) prevents the throw; the boundary prevents the hang. A `try/catch` cannot do this job — it cannot intercept an error raised inside Svelte's render flush.
-->

<script lang="ts">
  import { log } from '@openvaa/app-shared';
  import { onDestroy, untrack } from 'svelte';
  import { browser } from '$app/environment';
  import { Button } from '$lib/components/button';
  import { getComponentContext } from '$lib/contexts/component';
  import { focusFirstDescendant } from '$lib/utils/aria/focus';
  import { prefersReducedMotion } from '$lib/utils/motion';
  import { DELAY } from '$lib/utils/timing';
  import { drawerHost } from './drawerHostState.svelte';
  import type { HostedDrawerPayload } from './drawerHostState.svelte';

  const { t } = getComponentContext();

  // At init rather than in an effect: an opener's `$effect` may call `drawerHost.open` in the same flush this host mounts in.
  if (browser) onDestroy(drawerHost.register());

  /**
   * The one duration for both the JS close timer and the CSS transitions.
   *
   * It reaches the transition utilities as the `--drawer-ms` custom property set on the dialog below, so the timer and the animations cannot drift apart. `Drawer.svelte` flies with the same `DELAY.xs`.
   */
  const CLOSE_DELAY = DELAY.xs;

  let dialog = $state<HTMLDialogElement>();
  /** The payload on screen. Lags `drawerHost.current` by the out-animation when closing. */
  let shown = $state<HostedDrawerPayload | null>(null);
  let visible = $state(false);
  let closeTimer: ReturnType<typeof setTimeout> | undefined;
  let focusTimer: ReturnType<typeof setTimeout> | undefined;
  onDestroy(() => {
    clearTimeout(closeTimer);
    clearTimeout(focusTimer);
  });

  $effect(() => {
    const next = drawerHost.current;
    untrack(() => {
      if (!dialog) return;
      if (next) {
        clearTimeout(closeTimer);
        shown = next;
        if (!dialog.open) {
          dialog.showModal();
          const openedKey = next.key;
          // One frame in the closed-state styles first, so the slide-up / fade-in transitions run. The reveal is skipped if the drawer was closed or given another payload in the meantime.
          requestAnimationFrame(() =>
            requestAnimationFrame(() => {
              if (drawerHost.current?.key === openedKey) visible = true;
            })
          );
          // Focus entry mirrors `ModalContainer`: after `DELAY.sm`, and into the first focusable descendant. The backdrop button is `tabindex="-1"`, so it is skipped and focus lands inside the panel.
          clearTimeout(focusTimer);
          focusTimer = setTimeout(() => {
            // The drawer may have been dismissed or given another payload while the timer ran.
            if (dialog?.open && drawerHost.current?.key === openedKey) focusFirstDescendant(dialog);
          }, DELAY.sm);
        } else {
          // Content swap in place: no second `showModal()`, so nothing behind repaints and the backdrop does not flash.
          visible = true;
        }
      } else if (shown) {
        clearTimeout(focusTimer);
        visible = false;
        // Under reduced motion both transitions are off, so waiting out the animation would leave the dialog sitting there with no motion at all.
        if (prefersReducedMotion()) {
          dialog.close();
          shown = null;
        } else {
          closeTimer = setTimeout(() => {
            dialog?.close();
            shown = null;
          }, CLOSE_DELAY);
        }
      }
    });
  });

  function dismiss(): void {
    // `shown` outlives `drawerHost.current` only through the close animation, so a key mismatch means the drawer is already closing.
    if (!shown || drawerHost.current?.key !== shown.key) return;
    if (shown.onDismiss) shown.onDismiss();
    else drawerHost.close(shown.key);
  }

  /** Escape via a document-level handler rather than the dialog's native close, for `ModalContainer`'s stated reason: the native behaviour closes the dialog before any cleanup can run. The dialog's own `cancel` is suppressed below so the two cannot both fire. */
  function handleEscape(e: KeyboardEvent): void {
    if (shown && e.key === 'Escape') {
      dismiss();
      e.stopPropagation();
    }
  }

  /** Force the dialog shut without waiting for anything. Only used as the boundary's recovery: a payload that cannot render must not be able to hold the dialog open. */
  function forceClose(): void {
    clearTimeout(closeTimer);
    clearTimeout(focusTimer);
    visible = false;
    shown = null;
    dialog?.close();
    drawerHost.close();
  }

  /**
   * The boundary's recovery path. EVERY statement is guarded: a throw raised inside `onerror` puts the host straight back into the hung state the boundary exists to prevent, which is the one failure this handler cannot be allowed to have.
   */
  function handlePayloadError(error: unknown): void {
    try {
      log.error(`DrawerHost payload failed to render: ${error instanceof Error ? error.message : String(error)}`);
    } catch {
      // A logger that throws must not be the reason the dialog stays open.
    }
    try {
      forceClose();
    } catch {
      // Nothing further can be done here; the dialog is already in its least-bad state.
    }
  }
</script>

<svelte:document onkeydown={handleEscape} />

<!-- bind: keep — `dialog` is a single $state ref read in the effect and the handlers -->
<dialog
  bind:this={dialog}
  class={[
    'fixed inset-0 m-0 hidden h-full max-h-full w-full max-w-full items-end justify-items-center overflow-hidden border-0 bg-transparent p-0 open:grid',
    'backdrop:bg-neutral backdrop:transition-opacity backdrop:duration-(--drawer-ms) backdrop:ease-out motion-reduce:backdrop:transition-none',
    visible ? 'backdrop:opacity-60' : 'backdrop:opacity-0'
  ]}
  style:--drawer-ms="{CLOSE_DELAY}ms"
  aria-modal="true"
  aria-label={shown?.title()}
  oncancel={(e) => {
    // Suppress the native Escape close: it would remove the dialog before the out-animation and before `dismiss()` can route. `handleEscape` above owns the key.
    e.preventDefault();
  }}
  data-testid={shown?.testId}>
  <!-- Backdrop dismissal as a labelled control, per `ModalContainer`. `tabindex="-1"` keeps it out of the tab order (it duplicates the floating close button below) while leaving it a real, named button for pointer and AT users. -->
  <button type="button" class="absolute inset-0 z-0 cursor-default bg-transparent" tabindex="-1" onclick={dismiss}>
    <span class="sr-only">{t('common.closeDialog')}</span>
  </button>

  <div
    class={[
      'bg-base-100 relative z-1 h-[calc(100dvh-3rem)] w-full max-w-xl rounded-t-lg transition-transform duration-(--drawer-ms) ease-out motion-reduce:transition-none',
      visible ? 'translate-y-0' : 'translate-y-full'
    ]}>
    <div class="h-full overflow-y-auto pb-[4rem]">
      {#if shown}
        {#key shown.key}
          <svelte:boundary onerror={handlePayloadError}>
            <shown.component {...shown.props()} />

            {#snippet failed()}
              <!-- Deliberately empty and deliberately non-throwing: `onerror` has already force-closed the dialog, and anything rendered here would render into a dialog on its way out. -->
            {/snippet}
          </svelte:boundary>
        {/key}
      {/if}
    </div>
    <Button
      type="button"
      variant="floating-icon"
      text={t('common.closeDialog')}
      icon="close"
      onclick={dismiss}
      class="!absolute right-0 bottom-0 z-10" />
  </div>
</dialog>
