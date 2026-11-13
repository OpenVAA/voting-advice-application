<!--
@component Display an `Entity`’s open answer to a question. If the content is empty, nothing will be rendered.

### Properties

- `content`: The open answer text.
- Any valid attributes of a `<div>` element

### Usage

```tsx
<QuestionOpenAnswer content={openAnswer} />
```
-->

<script lang="ts">
  import { onMount, tick } from 'svelte';
  import { getComponentContext } from '$lib/contexts/component';
  import { cn, concatClass, getUUID } from '$lib/utils/components';
  import type { QuestionOpenAnswerProps } from './QuestionOpenAnswer.type';

  let { content, ...restProps }: QuestionOpenAnswerProps = $props();

  const { t } = getComponentContext();

  const id = getUUID();

  let el: HTMLDivElement | undefined = $state();
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
  <!-- bind: keep — el is $state(); single ref read in onMount/tick -->
  <div
    bind:this={el}
    {id}
    aria-expanded={collapsible ? expanded : undefined}
    style:--full-height={fullHeight}
    {...concatClass(
      restProps,
      cn(
        'relative grid max-h-[8rem] overflow-hidden rounded-md bg-base-200 text-center',
        collapsible && 'transition-all',
        collapsible &&
          (expanded
            ? 'max-h-(--full-height) before:h-0'
            : "before:absolute before:right-0 before:bottom-0 before:left-0 before:h-lg before:bg-gradient-to-t before:from-base-200 before:content-['']")
      )
    )}>
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
