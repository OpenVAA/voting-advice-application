<!--
@component
Display an `Entity`’s open answer to a question. If the content is empty, nothing will be rendered.

### Properties

- Any valid properties of an `<Expander>` component

### Usage

```tsx
<QuestionOpenAnswer content={openAnswer} />
```
-->

<svelte:options runes />

<script lang="ts">
  import { onMount, tick } from 'svelte';
  import { getComponentContext } from '$lib/contexts/component';
  import { concatClass, getUUID } from '$lib/utils/components';
  import type { QuestionOpenAnswerProps } from './QuestionOpenAnswer.type';

  let { content, ...restProps }: QuestionOpenAnswerProps = $props();

  const { t } = getComponentContext();

  const id = getUUID();

  let el: HTMLDivElement;
  let collapsible = $state(false);
  let expanded = $state(false);
  let fullHeight = $state('none');

  onMount(() =>
    tick().then(() => {
      if (el) {
        collapsible = el.clientHeight < el.scrollHeight;
        fullHeight = `${el.scrollHeight}px`;
      }
    })
  );
</script>

{#if content && content.trim() !== ''}
  <div
    bind:this={el}
    {id}
    aria-expanded={collapsible ? expanded : undefined}
    class:collapsible
    class:expanded
    style:--full-height={fullHeight}
    {...concatClass(restProps, 'relative grid max-h-[8rem] overflow-hidden rounded-md bg-base-200 text-center')}>
    {#if collapsible}
      <button
        onclick={() => {
          if (collapsible) expanded = !expanded;
        }}
        aria-controls={id}
        class="focus:ring-neutral absolute top-0 right-0 bottom-0 left-0 focus:ring-2 focus:ring-inset">
        <span class="opacity-0">{t('common.expandOrCollapse')}</span>
      </button>
    {/if}
    <span class="m-md col-start-1 row-start-1 before:content-[open-quote] after:content-[close-quote]">
      {content}
    </span>
  </div>
{/if}

<style lang="postcss">
  @reference "../../../tailwind-theme.css";
  .collapsible {
    @apply transition-all;
  }
  /* NB. before: is a valid pseudoclass even though the linter flags it */
  .collapsible:not(.expanded) {
    @apply before:h-lg before:from-base-200 before:absolute before:right-0 before:bottom-0 before:left-0 before:bg-gradient-to-t before:content-[''];
  }
  .collapsible.expanded {
    @apply max-h-[var(--full-height)] before:h-0;
  }
</style>
