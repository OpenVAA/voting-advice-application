<script lang="ts">
  import type {TextAreaProps} from './TextArea.type';
  import {Icon} from '$lib/components/icon';

  type $$Props = TextAreaProps;

  export let id: $$Props['id'];
  export let text: $$Props['text'] = '';

  export let headerText: $$Props['headerText'] = undefined;
  export let disabled: $$Props['disabled'] = false;
  export let placeholder: $$Props['placeholder'] = '';
  export let locked: $$Props['locked'] = false;
</script>

<!--
@component
A compact text input field.

### Slots
- `header` (optional) - Optional header for the input field, can be used instead of the default one.

### Properties
- `id` (required): The id of the input field.
- `text` (required): The text in the input field.
- `headerText` (optional): The header text of the input field.
- `disabled` (optional): If the text area is disabled. This is used to indicate that the text area cannot be used yet.
- `placeholder` (optional): The placeholder of the input field.
- `locked` (optional): If the text area is locked and has a lock icon. This is used to indicate that the text can no longer be edited.

### Usage
```tsx
<InputField
  id="example-id"
  headerText="Example Header"
  placeholder="Example Placeholder"
  bind:text={textVariable} />
```
-->

{#if headerText}
  <label
    for={id}
    class="label-sm label pointer-events-none mx-6 my-2 whitespace-nowrap text-secondary">
    {headerText}
  </label>
{:else}
  <slot name="header" />
{/if}

<div class="flex w-full pr-6">
  <input
    type="text"
    disabled={disabled && !locked}
    readonly={locked}
    {id}
    {placeholder}
    bind:value={text}
    class="input input-sm input-ghost flex w-full justify-end pr-2 text-right disabled:border-none disabled:bg-base-100" />
</div>

{#if locked}
  <Icon name="locked" class="my-auto flex-shrink-0 text-secondary" />
{/if}
