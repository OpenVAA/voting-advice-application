<!--
@component
A simple warning component to be used with BasicPage

´´

### Properties

- `display`: A boolean value to set whether to display the warning or not.

### Usage

```tsx
<Warning>
  Warning content, such as text or HTML element.
</Warning>
```
-->

<script lang="ts">
  import { Icon } from '$lib/components/icon';
  import type { WarningProps } from './Warning.type';

  type $$Props = WarningProps;

  export let display: $$Props['display'] = true;
</script>

<div class="text-warning">
  {#if display}
    <div class="flex items-start gap-6">
      <div class="w-60">
        <Icon name="warning" />
      </div>
      <div class="flex-grow text-left">
        <slot />
      </div>
    </div>
  {/if}
</div>
