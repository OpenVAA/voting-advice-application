<!--
@component
A button which will open a confirmation modal when clicked before the action is executed.

### Properties

- `modalTitle`: The title of the confirmation modal.
- `onConfirm`: Callback triggered when the user confirms the action.
- `onCancel`: Callback triggered when the user cancels the action.
- `cancelLabel`: The label for the cancel button in the modal.
- `confirmLabel`: The label for the confirm button in the modal.
- Any valid properties of a `<Button>` component except `href` and `on:click`.

### Slots

- `badge`: A slot for adding a badge to the button.

### Reactivity

Reactivity is not supported for the properties: `variant`, `iconPos`.

### Usage

```tsx
<Button on:click={next} variant="main" icon="next"
text="Continue"/>
<Button on:click={skip} icon="skip" iconPos="top" color="secondary"
text="Skip this question"/>
<Button on:click={addToList} variant="icon" icon="addToList" 
text="Add to list">
 <InfoBadge text="5" slot="badge"/>
</Button>
```
-->

<script lang="ts">
  import { Button } from '$lib/components/button';
  import { ConfirmationModal } from '$lib/components/modal/confirmation';
  import type { ButtonWithConfirmationProps } from './ButtonWithConfirmation.type';

  type $$Props = ButtonWithConfirmationProps;

  export let text: $$Props['text'];
  export let onConfirm: $$Props['onConfirm'];
  export let modalTitle: $$Props['modalTitle'];
  export let onCancel: $$Props['onCancel'] = undefined;
  export let cancelLabel: $$Props['cancelLabel'] = undefined;
  export let confirmLabel: $$Props['confirmLabel'] = undefined;

  let openModal: (() => void) | undefined;
</script>

<Button {text} on:click={openModal} {...$$restProps}></Button>

<ConfirmationModal bind:openModal title={modalTitle} {...{ onConfirm, onCancel, cancelLabel, confirmLabel }}>
  <slot />
</ConfirmationModal>
