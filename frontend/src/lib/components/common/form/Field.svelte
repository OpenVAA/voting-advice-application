<script lang="ts">
  export let customStyle: string | undefined = undefined;
  export let bgColor: string = 'bg-base-100';
  export let id: string | undefined = undefined;
  export let label: string | undefined = '';
</script>

<!-- 
@component
A field component meant to be used with `FieldGroup`.
Meant to be mainly used with two chidlren that are aligned on both ends of the field.

### Properties

- `customStyle`: A custom style passed on to the parent component.
- `bgColor`: The background color of the field.
- `id`: The id of the field used for labeling. Optional.
- `label`: The label of the field. Label will not be shown if it's empty. Optional.

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
  {#if id && label && label?.length > 0}
    <label
      for={id}
      class="label-sm label pointer-events-none mx-6 my-2 whitespace-nowrap text-secondary"
      >{label}</label>
  {/if}
  <slot />
</div>
