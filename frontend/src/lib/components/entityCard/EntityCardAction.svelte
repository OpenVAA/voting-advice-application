<script lang="ts">
  import {error} from '@sveltejs/kit';
  import type {EntityCardActionProps} from './EntityCardAction.type';

  type $$Props = EntityCardActionProps;

  export let action: $$Props['action'] = undefined;
  export let shadeOnHover: $$Props['shadeOnHover'] = false;
</script>

<!--@component
A simple utility component for possibly wrapping content in an action handler.

### Properties

- `action`: The action to take when the part or card is clicked.
- `shadeOnHover`: Whether to shade the element on hover. Use when applying to subcards or their parent card's header. @default `false`

### Slots

– default: The contents to wrap.

### Usage

```tsx
<EntityCardAction action={$getRoute({route: Route.candidates, id: candidate.id})}>
  Content here
</EntityCardAction>
```
-->

{#if action == null}
  <slot />
{:else if typeof action === 'function'}
  <button on:click={action} class="!text-neutral" class:hover-shaded={shadeOnHover}>
    <slot />
  </button>
{:else if typeof action === 'string'}
  <a href={action} class="!text-neutral" class:hover-shaded={shadeOnHover}>
    <slot />
  </a>
{:else}
  {error(500, `Unknown action type: ${typeof action}`)}
{/if}

<style lang="postcss">
  .hover-shaded {
    /** Hover: is a valid prefix */
    @apply rounded-md transition-all hover:bg-base-content/20 hover:ring-4 hover:ring-base-content/20;
  }
</style>
