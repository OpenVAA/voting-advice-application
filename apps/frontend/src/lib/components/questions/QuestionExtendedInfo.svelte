<!--
@component
Display the question's expandable information content.

### Properties

- `question`: The question to show the info for.
- `title`: Optional title for the info, by default the question text.
- Any valid properties of a `<div>` element

### Callback properties

- `onSectionCollapse`: A callback triggered when an info section is collapsed. Mostly used for tracking.
- `onSectionExpand`: A callback triggered when an info section is expanded.  Mostly used for tracking.

### Usage

```tsx
<QuestionExtendedInfo {question} />
```
-->

<script lang="ts">
  import { getCustomData } from '@openvaa/app-shared';
  import { getComponentContext } from '$lib/contexts/component';
  import { concatClass } from '$lib/utils/components';
  import { sanitizeHtml } from '$lib/utils/sanitize';
  import { Expander } from '../expander';
  import { QuestionArguments } from '.';
  import type { QuestionExtendedInfoProps } from './QuestionExtendedInfo.type';

  type $$Props = QuestionExtendedInfoProps;

  export let question: $$Props['question'];
  export let title: $$Props['title'] = undefined;
  export let onSectionCollapse: $$Props['onSectionCollapse'] = undefined;
  export let onSectionExpand: $$Props['onSectionExpand'] = undefined;

  const { t } = getComponentContext();

  const { info } = question;
  const { arguments: args, infoSections } = getCustomData(question);
</script>

<div {...concatClass($$restProps, 'flex flex-col gap-lg justify-stretch')}>
  <h2 class="text-center">{title || question.text}</h2>
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
      {#if args}
        {@const title = t('questions.arguments.title')}
        <Expander
          {title}
          titleClass="flex justify-between font-bold"
          contentClass="!text-left"
          on:collapse={() => onSectionCollapse?.(title)}
          on:expand={() => onSectionExpand?.(title)}>
          <QuestionArguments {question} />
        </Expander>
      {/if}
    </div>
  {/if}
</div>
