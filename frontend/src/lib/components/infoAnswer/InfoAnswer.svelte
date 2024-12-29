<!--
@component
Used to display a possibly wrapped entity's answer to an info question. Depending on the question type it is rendered as a `<span>`, `<ol>` or `<a>` element.

### Properties

- `answer`: The possibly missing answer to the question.
- `question`: The info question object.
- `format`: How to format the answer. @default `default`
  - `default`: use the same format as in `<EntityDetails>`.
  - `tag`: format the answers as a pill or tag. Nb. links are always rendered as tags.
- Any valid common attributes of an HTML element.

### Usage

```tsx
<InfoAnswer answer={candidate.getAnswer(question)} {question}/>
```
-->

<script lang="ts">
  import { getComponentContext } from '$lib/contexts/component';
  import { concatClass } from '$lib/utils/components';
  import { checkUrl, getLinkText } from '$lib/utils/links';
  import { sanitizeHtml } from '$lib/utils/sanitize';
  import { ucFirst } from '$lib/utils/text/ucFirst';
  import type { InfoAnswerProps } from './InfoAnswer.type';

  type $$Props = InfoAnswerProps;

  export let answer: $$Props['answer'] = undefined;
  export let question: $$Props['question'];
  export let format: $$Props['format'] = 'default';

  const { t } = getComponentContext();

  let asTag: boolean;
  $: asTag = format === 'tag';

  ////////////////////////////////////////////////////////////////////
  // Functions
  ////////////////////////////////////////////////////////////////////

  function formatLinkListItem(link: string | undefined): string {
    link = checkUrl(question.formatAnswer({ answer }));
    if (!link) return '';
    const text = getLinkText(link);
    if (!text) return '';
    return `<a
      href="${link}"
      target="_blank"
      rel="noopener noreferrer"
      class="vaa-tag hyphens-none mb-sm ${$$restProps.class ?? ''}">
      ${text}
    </a>`;
  }

  /**
   * Format an array-type item when using the tagged format. We need to sanitize the contents because we're using @html.
   */
  function formatTagItem(item: string): string {
    return `<span class="tag">${item}</span>`;
  }
</script>

{#if answer == null}
  <!-- `question.formatAnswer` will handle missing answer formatting -->
  <span {...concatClass($$restProps, 'text-secondary')}>
    {question.formatAnswer()}
  </span>
{:else if question.subtype === 'link'}
  {@const link = checkUrl(question.formatAnswer({ answer }))}
  {#if link}
    <a
      href={question.formatAnswer({ answer })}
      target="_blank"
      rel="noopener noreferrer"
      {...concatClass($$restProps, 'vaa-tag hyphens-none')}>
      {question.text}
    </a>
  {:else}
    {question.formatAnswer()}
  {/if}
{:else if question.type === 'multipleText' || question.type === 'multipleChoiceCategorical'}
  {#if question.subtype === 'linkList'}
    {@html sanitizeHtml(
      question.formatAnswer({
        answer,
        separator: ' ',
        map: formatLinkListItem
      })
    )}
  {:else if asTag}
    <div {...$$restProps}>
      {@html sanitizeHtml(
        question.formatAnswer({
          answer,
          separator: $t('common.multipleAnswerSeparator'),
          map: formatTagItem
        })
      )}
    </div>
  {:else}
    <span {...$$restProps}>
      {question.formatAnswer({ answer, separator: $t('common.multipleAnswerSeparator') })}
    </span>
  {/if}
  <!-- 
  TODO[preferenceOrder]: Check
  {:else if question.type === 'preferenceOrder'}
    <ol {...$$restProps}>
      {#each answer as item}
        <li class:vaa-tag={asTag}>{item}</li>
      {/each}
    </ol>
-->
{:else if question.type === 'image'}
  <figure class:vaa-tag={asTag} {...$$restProps}>
    {@html sanitizeHtml(question.formatAnswer({ answer }))}
  </figure>
{:else}
  <span class:vaa-tag={asTag} {...$$restProps}>
    {ucFirst(question.formatAnswer({ answer }))}
  </span>
{/if}
