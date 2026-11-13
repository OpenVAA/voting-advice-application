<!--
@component A modal dialog that will automatically close after a set amount of time.

The count follows the wall clock: its end is the time the modal opened plus `timerDuration`, checked every second and whenever the document is shown, restored, focused or resumed again. A document that was frozen, suspended or asleep runs no timer, so on its return the count ends at once if its time has passed, rather than after the rest of it.

### Snippet Props

- `actions`: The action buttons to display.
- `children`: The content of the modal.

### Properties

- `title`: The title of the modal
- `timerDuration`: Logout timer duration in seconds. @default `30`
- `timeLeft`: Bind to this to get time left in seconds
- Any valid properties of a `<Modal>` component.

### Callbacks

- `onClose`: Callback for when the modal closes. Note that the modal may still be transitioning to `hidden`.
- `onOpen`: Callback for when the modal opens. Note that the modal may still be transitioning from `hidden`.
- `onTimeout`: Callback triggered when the count ends, once per opening. The modal stays open until a promise it returns settles, and then closes if it is still open. Note that the `onClose` callback will be triggered after this.

### Bindable functions

- `openModal`: Opens the modal
- `closeModal`: Closes the modal

### Accessibility

See the `<Modal>` component documentation for more information.

### Usage

```tsx
<script lang="ts">
  let timedModal: TimedModal;
</script>

<TimedModal
  bind:this={timedModal}
  title="Timeout modal"
  onOpen={() => console.info('Opened')}
  onClose={() => console.info('Closed')}
  onTimeout={() => console.info('Timeout!')}>
  <p>Wait for it...</p>
  {#snippet actions()}
    <Button onclick={() => timedModal.closeModal()} text="Close" variant="main"/>
  {/snippet}
</TimedModal>
```
-->

<script lang="ts">
  import { onDestroy } from 'svelte';
  import { tweened } from 'svelte/motion';
  import Modal from '../Modal.svelte';
  import type { TimedModalProps } from './TimedModal.type';

  const DEFAULT_DURATION = 30;

  let {
    title,
    timerDuration = DEFAULT_DURATION,
    timeLeft = $bindable(Math.ceil(timerDuration ?? DEFAULT_DURATION)),
    onClose = undefined,
    onOpen = undefined,
    onTimeout = undefined,
    actions,
    children,
    ...restProps
  }: TimedModalProps = $props();

  let modalRef: Modal | undefined = $state(undefined);
  let isOpen = $state(false);

  /** Bind to open the modal dialog */
  export function openModal(noCallbacks?: boolean) {
    modalRef?.openModal(noCallbacks);
  }

  /** Bind to close the modal dialog */
  export function closeModal(noCallbacks?: boolean) {
    modalRef?.closeModal(noCallbacks);
  }

  // Used for progress bar animation. Reading `timerDuration` here is the initial seed for the tweened store; the prop is also re-read inside `startTimeout()` to handle prop changes between mounts.
  // svelte-ignore state_referenced_locally
  let progressBarTimer = $state(tweened(timerDuration, { duration: 0 }));
  /** How often the count's end is checked, in milliseconds. */
  const CHECK_INTERVAL_MS = 1000;

  /** The count's end on the wall clock, in milliseconds since the epoch, while the modal is open. */
  let deadline: number | undefined;
  /** The check that runs every {@link CHECK_INTERVAL_MS}. */
  let checkTimer: ReturnType<typeof setInterval> | undefined;

  // Update timeLeft to an integer when progressBarTimer updates
  $effect(() => {
    const val = $progressBarTimer;
    if (val) {
      const t = Math.ceil(val);
      if (t < (timeLeft ?? 0)) timeLeft = t;
    }
  });

  // Clean up if the containing document is left
  onDestroy(() => {
    stopChecking();
  });

  ////////////////////////////////////////////////////////////////////
  // Events
  ////////////////////////////////////////////////////////////////////

  function handleOpen() {
    startTimeout();
    onOpen?.();
  }

  function handleClose() {
    stopTimeout();
    onClose?.();
  }

  /** Start or reset the count and the progress bar */
  function startTimeout() {
    stopChecking();
    const durationMs = (timerDuration ?? DEFAULT_DURATION) * 1000;
    progressBarTimer = tweened(timerDuration, { duration: durationMs });
    timeLeft = timerDuration;
    $progressBarTimer = 0;
    deadline = Date.now() + durationMs;
    checkTimer = setInterval(checkDeadline, CHECK_INTERVAL_MS);
    document.addEventListener('visibilitychange', checkWhenVisible);
    document.addEventListener('resume', checkDeadline);
    window.addEventListener('pageshow', checkDeadline);
    window.addEventListener('focus', checkDeadline);
  }

  /** Stop the count and the progress bar */
  function stopTimeout() {
    stopChecking();
    progressBarTimer.set($progressBarTimer, { duration: 0 });
  }

  /** Forget the count's end, and stop every check of it. */
  function stopChecking() {
    deadline = undefined;
    if (checkTimer) clearInterval(checkTimer);
    checkTimer = undefined;
    if (typeof document === 'undefined') return;
    document.removeEventListener('visibilitychange', checkWhenVisible);
    document.removeEventListener('resume', checkDeadline);
    window.removeEventListener('pageshow', checkDeadline);
    window.removeEventListener('focus', checkDeadline);
  }

  function checkWhenVisible() {
    if (document.visibilityState === 'visible') checkDeadline();
  }

  /** End the count once its time on the wall clock has come. The end is forgotten first, so a later check ends nothing. */
  async function checkDeadline() {
    if (deadline === undefined || Date.now() < deadline) return;
    stopChecking();
    if (!isOpen) return;
    try {
      await onTimeout?.();
    } finally {
      if (isOpen) modalRef?.closeModal();
    }
  }
</script>

<!-- bind: keep — modalRef is $state(undefined) single ref; bind:isOpen against Modal.isOpen = $bindable(false) -->
<Modal
  bind:this={modalRef}
  bind:isOpen
  onOpen={handleOpen}
  onClose={handleClose}
  {title}
  {actions}
  closeOnBackdropClick={false}
  {...restProps}>
  {@render children?.()}
  <progress
    id="modal-progress"
    class="progress progress-error absolute right-0 bottom-0 left-0"
    value={progressBarTimer ? $progressBarTimer : 0}
    max={timerDuration}></progress>
</Modal>
