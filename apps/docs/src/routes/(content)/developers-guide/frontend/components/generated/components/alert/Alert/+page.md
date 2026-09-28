# Alert

Show a non-model alert or dialog that appears at the bottom of the screen.

### Properties

- `title`: The title of the alert.
- `icon`: Possible icon of the alert.
- `autoOpen`: Whether to open the alert automatically. Default: `true`
- `isOpen`: Bind to this to get the alert's open state.
- `onClose`: The callback triggered when the alert is closed.
- `onOpen`: The callback triggered when the alert is opened.
- Any valid attributes of a `<dialog>` element

### Snippet Props

- `actions`: The action buttons to display.
- `children`: The content of the alert.

### Bindable functions

- `openAlert`: Opens the alert
- `closeAlert`: Closes the alert

### Usage

```tsx
<script lang="ts">
  let alertRef: Alert;
</script>
<Alert
  bind:this={alertRef}
  title="Can we help you?"
  icon="warning"
  onClose={() => console.info('Alert closed')}>
  Please tell us whether we can help you?
  {#snippet actions()}
    <div class="flex flex-col w-full max-w-md mx-auto">
      <Button onclick={() => {console.info('Yes'); alertRef.closeAlert();}} text="Yes" variant="main"/>
      <Button onclick={() => alertRef.closeAlert()} text="No"/>
    </div>
  {/snippet}
</Alert>
```

## Source

[apps/frontend/src/lib/components/alert/Alert.svelte](https://github.com/OpenVAA/voting-advice-application/blob/main/apps/frontend/src/lib/components/alert/Alert.svelte)

[apps/frontend/src/lib/components/alert/Alert.type.ts](https://github.com/OpenVAA/voting-advice-application/blob/main/apps/frontend/src/lib/components/alert/Alert.type.ts)
