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
  class={'tooltip underline decoration-dotted ' + (open ? 'tooltip-open' : '')}
  data-tip={title ? `${title}: ${tip}` : tip}
  on:click|self={() => (open = !open)}>
  <slot />
  {#if open}
    <!-- svelte-ignore a11y-click-events-have-key-events -->
    <!-- svelte-ignore a11y-no-static-element-interactions -->
    <div
      class="fixed inset-0 z-40"
      on:click={() => {
        open = false;
      }}>
    </div>
  {/if}
</button>
