<script lang="ts">
  import { onMount } from 'svelte';
  import { t } from '$lib/i18n';
  import { concatClass, getUUID } from '$lib/utils/components';

  let el: HTMLDivElement;
  let collapsible = false;
  let expanded = false;
  let fullHeight = 'none';

  const id = getUUID();

  onMount(() => {
    if (el) {
      collapsible = el.clientHeight < el.scrollHeight;
      fullHeight = `${el.scrollHeight}px`;
    }
  });
</script>

<!--
@component
Display a Candidate's or Party's open answer to a question.

### Properties

- Any valid properties of an `<Expander>` component

### Slots

- default: The open answer

### Usage

```tsx
<QuestionOpenAnswer>{openAnswer}</QuestionOpenAnswer>
```
-->

<div
  bind:this={el}
  {id}
  aria-expanded={collapsible ? expanded : undefined}
  class:collapsible
  class:expanded
  style:--full-height={fullHeight}
  {...concatClass($$restProps, 'relative grid max-h-[8rem] overflow-hidden mt-16 rounded-md bg-base-200 text-center')}>
  {#if collapsible}
    <button
      on:click={() => {
        if (collapsible) expanded = !expanded;
      }}
      aria-controls={id}
      class="absolute bottom-0 left-0 right-0 top-0 focus:ring-2 focus:ring-inset focus:ring-neutral">
      <span class="opacity-0">{$t('common.expandOrCollapse')}</span>
    </button>
  {/if}
  <span class="col-start-1 row-start-1 m-md before:content-[open-quote] after:content-[close-quote]">
    <slot />
  </span>
</div>

<style lang="postcss">
  .collapsible {
    @apply transition-all;
  }
  /* NB. before: is a valid pseudoclass even though the linter flags it */
  .collapsible:not(.expanded) {
    @apply before:absolute before:bottom-0 before:left-0 before:right-0 before:h-lg before:bg-gradient-to-t before:from-base-200 before:content-[''];
  }
  .collapsible.expanded {
    @apply max-h-[var(--full-height)] before:h-0;
  }
</style>
