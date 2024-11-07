<script lang="ts">
  export let customStyle: string | undefined = undefined;
  export let bgColor: string = 'oklch(var(--b3))';
  export let id: string | undefined = undefined;
  export let label: string | undefined = undefined;
</script>

<!-- 
@component
A field component meant to be used with `FieldGroup`.
Meant to be mainly used with two chidlren that are aligned on both ends of the field.

### Properties

- `customStyle`: A custom style passed on to the parent component.
- `bgColor`: The background color of the field.
- `id`: The id of the input which the label is for. You must supply either both id and label or neither of them. Optional.
- `label`: The label of the field.

### Usage

```tsx
<FieldGroup>
  <Field id="input_1" label="label">
    <input id="input_1"/>
  </Field>
</FieldGroup>
```
-->

<div class="flex h-full items-center justify-between {bgColor}" style={customStyle}>
  {#if id && label}
    <label for={id} class="label-sm label pointer-events-none mx-6 my-2 whitespace-nowrap text-secondary"
      >{label}</label>
  {/if}
  <slot />
</div>
