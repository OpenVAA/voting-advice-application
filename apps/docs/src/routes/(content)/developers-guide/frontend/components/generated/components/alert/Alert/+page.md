# Alert

Show a non-model alert or dialog that appears at the bottom of the screen.

### Properties

- `title`: The title of the alert.
- `icon`: Possible icon of the alert.
- `autoOpen`: Whether to open the alert automatically. Default: `true`
- `isOpen`: Bind to this to get the alert's open state.
- `onClose`: The callback triggered when the alert is closed.
- Any valid attributes of a `<dialog>` element

### Bindable functions

- `openAlert`: Opens the alert
- `closeAlert`: Closes the alert

### Slots

- `actions`: The action buttons to display.
- default: The content of the alert.

### Events

- `open`: Fired after the alert is opened.
- `close`: Fired when the alert is closed by any means.
- Neither event has any details.

### Usage

```tsx
<script lang="ts">
  let closeAlert: () => void;
</script>
<Alert
  bind:closeAlert
  title="Can we help you?"
  icon="warning"
  onClose={() => console.info('Alert closed')}>
  Please tell us whether we can help you?
  <div slot="actions" class="flex flex-col w-full max-w-md mx-auto">
    <Button on:click={() => {console.info('Yes'); closeAlert();}} text="Yes" variant="main"/>
    <Button on:click={closeAlert} text="No"/>
  </div>
</Alert>
```

## Source

[frontend/src/lib/components/alert/Alert.svelte](https://github.com/OpenVAA/voting-advice-application/blob/main/frontend/src/lib/components/alert/Alert.svelte)

[frontend/src/lib/components/alert/Alert.type.ts](https://github.com/OpenVAA/voting-advice-application/blob/main/frontend/src/lib/components/alert/Alert.type.ts)
