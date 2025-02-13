<!--
@component
Display the question's expandable information content.

### Properties

- `info`: The info content to show as a plain or HTML string.
- `infoSections`: An array of objects with `title` and `content` properties to show as expandable sections.
- `onCollapse`: A callback triggered when the info content is collapsed. Mostly used for tracking.
- `onExpand`: A callback triggered when the info content is expanded.  Mostly used for tracking.
- Any valid properties of an `<Expander>` component

### Usage

```tsx
<QuestionExtendedInfo
  info={question.info}
  infoSections={customData.infoSections} />
```
-->

<script lang="ts">
  import { sanitizeHtml } from '$lib/utils/sanitize';
  import { Expander } from '../expander';
  import type { QuestionInfoProps } from './QuestionExtendedInfo.type';

  type $$Props = QuestionInfoProps;

  export let info: $$Props['info'];
  export let infoSections: $$Props['infoSections'] = [];
  $: visibleInfoSections = infoSections?.filter(
    (section): section is Required<QuestionInfoSection> => !!section?.title && !!section?.content && !!section?.visible
  );
</script>

<div>
  {@html sanitizeHtml(info)}
  {#if visibleInfoSections?.length}
    <div class="mt-16">
      {#each visibleInfoSections as { title, content }}
        <Expander {title} {...$$restProps} titleClass="flex justify-between font-bold" contentClass="!text-left">
          {@html sanitizeHtml(content)}
        </Expander>
      {/each}
    </div>
  {/if}
</div>
