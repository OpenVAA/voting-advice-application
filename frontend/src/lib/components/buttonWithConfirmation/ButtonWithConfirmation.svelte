<!--
@component
A component for buttons that mostly contain text and an icon. Use the `variant` prop to specify the button type. When using an `icon`, use `iconPos` to set the position of the icon relative to the text.

- `main`: A large, prominent button that is used for the main action of the page. In general, there should only be one of these on a page.
- `prominent`: A large, quite prominent button.
- `floating-icon`: A button with a large icon and no text. This is usually used for a floating action button.
- `icon`: A button containing only an icon. Note that you still need to provide the `text` property, which will be used as the `aria-label` and `title` of the button.
- `responsive-icon`: A button rendered as icon only on small screens but which exposes the text label on large screens. Set the `iconPos` to `left` or `right` to control its location in the expanded view.
- `secondary`: A button with a smaller (uppercase) text and possibly an icon.
- `normal`: The default button type, which usually consists of an icon and text.

Only `main` buttons have a backround color. The other variants use DaisyUI's `btn-ghost` class, i.e. they do not have a background color.

The button is rendered as an `<a>` element if `href` is supplied. Otherwise a `<button>` element will be used. Be sure to provide an `on:click` event handler or other way of making the item interactive.

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
