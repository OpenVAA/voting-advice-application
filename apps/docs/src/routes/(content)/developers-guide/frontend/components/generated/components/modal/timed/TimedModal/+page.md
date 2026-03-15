# TimedModal

A modal dialog that will automatically close after a set amount of time.

### Slots

- `actions`: The action buttons to display.
- default: The content of the modal.

### Properties

- `title`: The title of the modal
- `timerDuration`: Logout timer duration in seconds. @default `30`
- `timeLeft`: Bind to this to get time left in seconds
- Any valid properties of a `<Modal>` component.

### Callbacks

- `onClose`: Callback for when the modal closes. Note that the modal may still be transitioning to `hidden`.
- `onOpen`: Callback for when the modal opens. Note that the modal may still be transitioning from `hidden`.
- `timeout`: Callback triggered right before the modal is closed due to a timeout. Note that the `onClose` callback will be triggered after this.

### Bindable functions

- `openModal`: Opens the modal
- `closeModal`: Closes the modal

### Accessibility

See the `<Modal>` component documentation for more information.

### Usage

```tsx
<TimedModal
  bind:closeModal
  title="Timout modal"
  onOpen={() => console.info('Opened')}
  onClose={() => console.info('Closed')}
  onTimeout={() => console.info('Timeout!')}>
  <p>Wait for it…</p>
  <Button slot="actions" on:click={closeModal} text="Close" variant="main" />
</TimedModal>
```

## Source

[frontend/src/lib/components/modal/timed/TimedModal.svelte](https://github.com/OpenVAA/voting-advice-application/blob/main/frontend/src/lib/components/modal/timed/TimedModal.svelte)

[frontend/src/lib/components/modal/timed/TimedModal.type.ts](https://github.com/OpenVAA/voting-advice-application/blob/main/frontend/src/lib/components/modal/timed/TimedModal.type.ts)
