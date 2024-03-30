<script lang="ts">
  import Icon from '../icon/Icon.svelte';
  import type {WarningProps} from './Warning.type';

  type $$Props = WarningProps;

  export let display: $$Props['display'] = true;
</script>

<!--
@component
A simple warning component to be used with BasicPage

### Usage

```tsx
<Warning>
    Some warning.
</Warning>
```
-->

<div class="text-warning">
  {#if display}
    <div class="flex items-start gap-6">
      <div class="w-60">
        <Icon name="missingIcon" />
      </div>
      <div class="flex-grow text-left">
        <slot />
      </div>
    </div>
  {/if}
</div>
