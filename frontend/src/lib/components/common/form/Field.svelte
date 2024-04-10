<script lang="ts">
  export let customStyle: string | undefined = undefined;
  export let bgColor: string = 'bg-base-100';
</script>

<!-- 
  @component
  A field component meant to be used with `FieldGroup`.
  Meant to be mainly used with two chidlren that are aligned on both ends of the field.

  ### Properties

 - `customStyle`: A custom style passed on to the parent component.

  You should not try to use a variant and customize at the same time.

  ### Usage

  ```tsx
  <FieldGroup>
    <Field>
      <label for="input_1"> Label for input </label>  
      <input id="input_1"/>
    </Field>
  </FieldGroup>
  ```
-->

<div class="flex h-full items-center justify-between {bgColor}" style={customStyle}>
  <slot />
</div>
