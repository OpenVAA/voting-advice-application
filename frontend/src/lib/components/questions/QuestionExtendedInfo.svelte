<!--
@component
Display the question's expandable information content.

### Properties

- `title`: The title for the info, usually the question text.
- `info`: The info content to show as a plain or HTML string.
- `infoSections`: An array of objects with `title` and `content` properties to show as expandable sections.
- Any valid properties of a `<div>` element

### Callback properties

- `onSectionCollapse`: A callback triggered when an info section is collapsed. Mostly used for tracking.
- `onSectionExpand`: A callback triggered when an info section is expanded.  Mostly used for tracking.

### Usage

```tsx
<QuestionExtendedInfo
  info={question.info}
  infoSections={customData.infoSections} />
```
-->

<script lang="ts">
  import { concatClass } from '$lib/utils/components';
  import { sanitizeHtml } from '$lib/utils/sanitize';
  import { Expander } from '../expander';
  import type { QuestionExtendedInfoProps } from './QuestionExtendedInfo.type';

  type $$Props = QuestionExtendedInfoProps;

  export let title: $$Props['title'];
  export let info: $$Props['info'];
  export let infoSections: $$Props['infoSections'] = [];
  export let onSectionCollapse: $$Props['onSectionCollapse'] = undefined;
  export let onSectionExpand: $$Props['onSectionExpand'] = undefined;
</script>

<div {...concatClass($$restProps, 'flex flex-col gap-lg justify-stretch')}>
  <h2 class="text-center">{title}</h2>
  <div class="prose">
    {@html sanitizeHtml(info)}
  </div>
  {#if infoSections?.length}
    <div class="prose">
      {#each infoSections as { title, content }}
        {#if title}
          <Expander
            {title}
            titleClass="flex justify-between font-bold"
            contentClass="!text-left"
            on:collapse={() => onSectionCollapse?.(title)}
            on:expand={() => onSectionExpand?.(title)}>
            {@html sanitizeHtml(content)}
          </Expander>
        {/if}
      {/each}
    </div>
  {/if}
</div>
