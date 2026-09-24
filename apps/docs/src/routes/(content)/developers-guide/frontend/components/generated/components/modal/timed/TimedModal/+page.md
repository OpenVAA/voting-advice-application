# TimedModal

A modal dialog that will automatically close after a set amount of time.

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
- `onTimeout`: Callback triggered right before the modal is closed due to a timeout. Note that the `onClose` callback will be triggered after this.

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

## Source

[apps/frontend/src/lib/components/modal/timed/TimedModal.svelte](https://github.com/OpenVAA/voting-advice-application/blob/main/apps/frontend/src/lib/components/modal/timed/TimedModal.svelte)

[apps/frontend/src/lib/components/modal/timed/TimedModal.type.ts](https://github.com/OpenVAA/voting-advice-application/blob/main/apps/frontend/src/lib/components/modal/timed/TimedModal.type.ts)
