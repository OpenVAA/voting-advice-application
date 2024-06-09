<!-- 
@component
A componend used to group `Field`-components together.

### Properties

- `customStyle`: A custom style passed on to the parent component.

You should not try to use a variant and customize at the same time.

### Usage

```tsx
<FieldGroup>
  <div slot="header"> header text </div>
  <Field>
    ...
  </Field>
  <div slot="footer"> footer text </div>
</FieldGroup>
```
-->

<div class="w-full">
  <slot name="header" />
  <div class="my-6 flex w-full flex-col gap-2 overflow-hidden rounded-lg">
    <slot />
  </div>
  <slot name="footer" />
</div>
