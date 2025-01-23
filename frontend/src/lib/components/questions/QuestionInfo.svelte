<!--
@component
Display the question's expandable information content.

### Properties

- `info`: The info content to show as a plain or HTML string.
- `onCollapse`: A callback triggered when the info content is collapsed. Mostly used for tracking.
- `onExpand`: A callback triggered when the info content is expanded.  Mostly used for tracking.
- Any valid properties of an `<Expander>` component

### Usage

```tsx
<QuestionInfo {info}/>
```
-->

<script lang="ts">
  import { Drawer } from '$lib/components/drawer';
  import { getComponentContext } from '$lib/contexts/component';
  import { sanitizeHtml } from '$lib/utils/sanitize';
  import { Button } from '../button';
  import { Expander } from '../expander';
  import Modal from '../modal/Modal.svelte';
  import type { QuestionInfoProps } from './QuestionInfo.type';

  type $$Props = QuestionInfoProps;

  export let title: $$Props['title'];
  export let info: $$Props['info'];
  export let background: $$Props['background'] = undefined;
  export let argumentsFor: $$Props['argumentsFor'] = undefined;
  export let argumentsAgainst: $$Props['argumentsAgainst'] = undefined;
  export let currentSituation: $$Props['currentSituation'] = undefined;
  export let terms: $$Props['terms'] = undefined;
  export let onCollapse: $$Props['onCollapse'] = undefined;
  export let onExpand: $$Props['onExpand'] = undefined;

  const { t } = getComponentContext();
</script>

<Drawer {title} on:close={() => onCollapse?.()}>
  {@html sanitizeHtml(info)}
  <div class="mt-16">
    {#if background}
      <Expander
        title="Background"
        {...$$restProps}
        titleClass="flex justify-between font-bold"
        contentClass="!text-left">
        {@html sanitizeHtml(background)}
      </Expander>
    {/if}
    {#if argumentsFor}
      <Expander
        title="Arguments for"
        {...$$restProps}
        titleClass="flex justify-between font-bold"
        contentClass="!text-left">
        {@html sanitizeHtml(argumentsFor)}
      </Expander>
    {/if}
    {#if argumentsAgainst}
      <Expander
        title="Arguments against"
        {...$$restProps}
        titleClass="flex justify-between font-bold"
        contentClass="!text-left">
        {@html sanitizeHtml(argumentsAgainst)}
      </Expander>
    {/if}
    {#if currentSituation}
      <Expander
        title="Current situation"
        {...$$restProps}
        titleClass="flex justify-between font-bold"
        contentClass="!text-left">
        {@html sanitizeHtml(currentSituation)}
      </Expander>
    {/if}
    {#if terms}
      <Expander title="Terms" {...$$restProps} titleClass="flex justify-between font-bold" contentClass="!text-left">
        {@html sanitizeHtml(terms)}
      </Expander>
    {/if}
  </div>
</Drawer>
