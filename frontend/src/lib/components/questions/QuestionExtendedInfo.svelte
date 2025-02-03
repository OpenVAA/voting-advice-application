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
  import { sanitizeHtml } from '$lib/utils/sanitize';
  import { Expander } from '../expander';
  import type { QuestionInfoProps } from './QuestionExtendedInfo.type';

  type $$Props = QuestionInfoProps;

  export let info: $$Props['info'];
  export let infoSections: $$Props['infoSections'] = [];
</script>

<div>
  {@html sanitizeHtml(info)}
  <div class="mt-16">
    {#each infoSections ?? [] as { title, content }}
      <Expander {title} {...$$restProps} titleClass="flex justify-between font-bold" contentClass="!text-left">
        {@html sanitizeHtml(content)}
      </Expander>
    {/each}
  </div>
</div>
