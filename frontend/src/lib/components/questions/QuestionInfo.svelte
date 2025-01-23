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
  export let infoSections: $$Props['infoSections'] = [];
  export let onCollapse: $$Props['onCollapse'] = undefined;
  export let onExpand: $$Props['onExpand'] = undefined;

  const { t } = getComponentContext();
</script>

<Drawer {title} on:close={() => onCollapse?.()}>
  {@html sanitizeHtml(info)}
  <div class="mt-16">
    {#each infoSections ?? [] as { title, content }}
      <Expander {title} {...$$restProps} titleClass="flex justify-between font-bold" contentClass="!text-left">
        {@html sanitizeHtml(content)}
      </Expander>
    {/each}
  </div>
</Drawer>
