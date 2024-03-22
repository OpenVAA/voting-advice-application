<script lang="ts">
  import type {TextAreaProps} from './TextArea.type';

  type $$Props = TextAreaProps;

  export let id: $$Props['id'];
  export let text: $$Props['text'] = undefined;

  export let headerText: $$Props['headerText'] = undefined;
  export let disabled: $$Props['disabled'] = false;
  export let placeholder: $$Props['placeholder'] = '';
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
- `disabled` (optional): If the input field is disabled.
- `placeholder` (optional): The placeholder of the input field.

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
  <slot name="header" field={undefined} />
{/if}

<div class="flex w-full pr-6">
  <input
    type="text"
    {disabled}
    {id}
    {placeholder}
    bind:value={text}
    class="input input-sm input-ghost flex w-full justify-end pr-2 text-right disabled:border-none disabled:bg-base-100" />
</div>
