<!--
@component
Checkbox component with a label and optional description slot.

### Properties

- `checked`: The checked state of the checkbox. @default false
- `name`: The name attribute for the checkbox input.
- `label`: The label text for the checkbox.
- `disabled`: Whether the checkbox is disabled. @default false
- Any valid attributes of a `<label>` element.

### Slots

- `description`: An optional slot for adding descriptive text below the label.

### Usage

```tsx
<Checkbox name="terms" label="I accept the terms and conditions">
  <span slot="description" class="text-xs text-gray-500">
    By checking this box, you agree to our Terms of Service and Privacy Policy.
  </span>
</Checkbox>
```
-->
<script lang="ts">
  import { concatClass } from '$lib/utils/components';
  import type { CheckboxProps } from './Checkbox.type';

  type $$Props = CheckboxProps;

  export let checked = false;
  export let name: string;
  export let label: string;
  export let disabled = false;
</script>

<label {...concatClass($$restProps, 'flex items-start')}>
  <div class="h-5 flex items-center">
    <input
      type="checkbox"
      {name}
      bind:checked
      {disabled}
      class="text-primary-600 focus:ring-primary-500 h-4 w-4 rounded border-gray-300" />
  </div>
  <div class="ml-3">
    <span class="font-medium text-sm text-gray-700">{label}</span>
    {#if $$slots.description}
      <div class="mt-1">
        <slot name="description" />
      </div>
    {/if}
  </div>
</label>
