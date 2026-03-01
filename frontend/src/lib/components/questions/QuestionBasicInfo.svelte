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
<QuestionBasicInfo {info}/>
```
-->

<script lang="ts">
  import { Expander } from '$lib/components/expander';
  import { getComponentContext } from '$lib/contexts/component';
  import { sanitizeHtml } from '$lib/utils/sanitize';
  import QuestionArguments from './QuestionArguments.svelte';
  import type { QuestionBasicInfoProps } from './QuestionBasicInfo.type';

  type $$Props = QuestionBasicInfoProps;

  export let info: $$Props['info'];
  export let onCollapse: $$Props['onCollapse'] = undefined;
  export let onExpand: $$Props['onExpand'] = undefined;
  export let question: $$Props['question'] = undefined;

  const { t } = getComponentContext();
</script>

<Expander
  on:collapse={() => onCollapse?.()}
  on:expand={() => onExpand?.()}
  title={$t('common.readMore')}
  {...$$restProps}>
  {@html sanitizeHtml(info)}
  {#if question}
    {#key question}
      <QuestionArguments {question} class="mt-lg" />
    {/key}
  {/if}
</Expander>
