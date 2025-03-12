<!--
@component
Show a tooltip when hovering over text.

### Properties

- `title`: The title of the tooltip (Optional).
- `tip`: The text to show in the tooltip.

### Usage

```tsx
<Tooltip tip="Tip">
  Hover over me
</Tooltip>
```
-->

<script lang="ts">
  import type { TooltipProps } from './Tooltip.type';

  type $$Props = TooltipProps;

  export let title: $$Props['title'] = '';
  export let tip: $$Props['tip'] = '';
  // This allows the tooltip to be viewed with touch controls when hover is not available
  let open = false;
</script>

<button
  class={'tooltip tooltip-bottom underline decoration-primary decoration-dotted ' + (open ? 'tooltip-open' : '')}
  data-tip={title ? `${title}: ${tip}` : tip}
  on:focus={() => (open = true)}
  on:blur={() => (open = false)}
  on:keydown={(e) => {
    if (e.key === 'Escape') {
      open = false;
    }
  }}>
  <slot />
</button>

<style>
  .tooltip::after {
    @apply border-b-base-200;
  }

  .tooltip::before {
    @apply rounded-md bg-base-200 p-10 font-normal text-neutral shadow-md;
  }
</style>
