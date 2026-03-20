<svelte:options runes />

<!--@component
A simple utility component for possibly wrapping content in an action handler.

### Properties

- `action`: The action to take when the part or card is clicked.
- `shadeOnHover`: Whether to shade the element on hover. Use when applying to subcards or their parent card's header. Default: `false`
- Any valid attributes common to HTML elements. Note that these will only be applied if `<EntityCardAction>` is rendered.

### Slots

\u2013 default: The contents to wrap.

### Usage

```tsx
<EntityCardAction action={$getRoute({route: 'ResultsCandidate', entityId: candidate.id})}>
  Content here
</EntityCardAction>
```
-->

<script lang="ts">
  import { error } from '@sveltejs/kit';
  import { concatClass } from '$lib/utils/components';
  import type { EntityCardActionProps } from './EntityCardAction.type';

  let { action, shadeOnHover = false, children, ...restProps }: EntityCardActionProps = $props();
</script>

{#if action == null || action === false || action === ''}
  {@render children?.()}
{:else if typeof action === 'function'}
  <button
    onclick={action}
    class:hover-shaded={shadeOnHover}
    data-testid="entity-card-action"
    {...concatClass(restProps, 'transition-all !text-neutral')}>
    {@render children?.()}
  </button>
{:else if typeof action === 'string'}
  <a
    href={action}
    data-sveltekit-noscroll
    class:hover-shaded={shadeOnHover}
    data-testid="entity-card-action"
    {...concatClass(restProps, 'transition-all !text-neutral')}>
    {@render children?.()}
  </a>
{:else}
  {error(500, `Unknown action type: ${typeof action}`)}
{/if}

<style lang="postcss">
  @reference "../../../tailwind-theme.css";
  .hover-shaded {
    @apply hover:bg-base-content/20 hover:ring-base-content/20 rounded-md hover:ring-4;
  }
</style>
