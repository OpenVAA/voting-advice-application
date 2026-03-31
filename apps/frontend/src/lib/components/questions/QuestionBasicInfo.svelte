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
  import type { QuestionBasicInfoProps } from './QuestionBasicInfo.type';

  let { info, onCollapse = undefined, onExpand = undefined, ...restProps }: QuestionBasicInfoProps = $props();

  const { t } = getComponentContext();
</script>

<Expander onCollapse={() => onCollapse?.()} onExpand={() => onExpand?.()} title={t('common.readMore')} {...restProps}>
  {@html sanitizeHtml(info)}
</Expander>
