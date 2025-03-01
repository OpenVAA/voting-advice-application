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
</script>

<span class="tooltip underline decoration-dotted" data-tip={title ? `${title}: ${tip}` : tip}>
  <slot />
</span>
