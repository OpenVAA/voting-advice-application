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
  import { Expander } from '$lib/components/expander';
  import { getComponentContext } from '$lib/contexts/component';
  import { sanitizeHtml } from '$lib/utils/sanitize';
  import type { QuestionInfoProps } from './QuestionInfo.type';

  type $$Props = QuestionInfoProps;

  export let info: $$Props['info'];
  export let onCollapse: $$Props['onCollapse'] = undefined;
  export let onExpand: $$Props['onExpand'] = undefined;

  const { t } = getComponentContext();
</script>

<Expander
  on:collapse={() => onCollapse?.()}
  on:expand={() => onExpand?.()}
  title={$t('common.readMore')}
  {...$$restProps}>
  {@html sanitizeHtml(info) }
</Expander>
