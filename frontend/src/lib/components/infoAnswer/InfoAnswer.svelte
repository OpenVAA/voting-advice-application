<script lang="ts">
  import { t } from '$lib/i18n';
  import { getAnswerForDisplay } from '$lib/utils/answers';
  import { concatClass } from '$lib/utils/components';
  import { parseMaybeRanked } from '$lib/utils/entities';
  import { getLinkText } from '$lib/utils/links';
  import { logDebugError } from '$lib/utils/logger';
  import { ucFirst } from '$lib/utils/text/ucFirst';
  import type { InfoAnswerProps } from './InfoAnswer.type';

  type $$Props = InfoAnswerProps;

  export let entity: $$Props['entity'];
  export let question: $$Props['question'];
  export let format: $$Props['format'] = 'default';
  export let hideMissing: $$Props['hideMissing'] = false;

  let answer: string | Array<string> | undefined;
  let asTag: boolean;

  $: {
    const sureEntity = parseMaybeRanked(entity)?.entity;
    answer = sureEntity ? getAnswerForDisplay(sureEntity, question) : undefined;
    asTag = format === 'tag';
  }

  function logError(msg: string): string {
    logDebugError(msg);
    return $t('common.missingAnswer');
  }
</script>

<!--
@component
Used to display a possibly wrapped entity's answer to an info question. Depending on the question type it is rendered as a `<span>`, `<ol>` or `<a>` element.

### Properties

- `entity`: The possibly wrapped entity whose answer will be displayed.
- `question`: The info question object.
- `format`: How to format the answer. @default `default`
  - `default`: use the same format as in `<EntityDetails>`.
  - `tag`: format the answers as a pill or tag. Nb. links are always rendered as tags.
- `hideMissing`: Whether to not render the `common.missingAnswer` string for missing answers. If `true`, nothing will be rendered. @default `false`
- Any valid common attributes of an HTML element.

### Usage

```tsx
<InfoAnswer entity={candidate} {question}/>
```
-->

{#if answer == null || answer === ''}
  {#if !hideMissing}
    <span {...concatClass($$restProps, 'text-secondary')}>
      {$t('common.missingAnswer')}
    </span>
  {/if}
{:else if question.type === 'multipleChoiceCategorical' && Array.isArray(answer)}
  {#if asTag}
    <div {...$$restProps}>
      {#each answer as item}
        <span class="vaa-tag">{item}</span>
      {/each}
    </div>
  {:else}
    <span {...$$restProps}>
      {answer.join($t('common.multipleAnswerSeparator'))}
    </span>
  {/if}
{:else if question.type === 'preferenceOrder' && Array.isArray(answer)}
  <ol {...$$restProps}>
    {#each answer as item}
      <li class:vaa-tag={asTag}>{item}</li>
    {/each}
  </ol>
{:else if question.type === 'link' && typeof answer === 'string'}
  <a
    href={answer}
    target="_blank"
    rel="noopener noreferrer"
    {...concatClass($$restProps, 'vaa-tag hyphens-none')}>
    {question.text}
  </a>
{:else if question.type === 'linkList' && Array.isArray(answer)}
  {#each answer as link}
    <a
      href={link}
      target="_blank"
      rel="noopener noreferrer"
      {...concatClass($$restProps, 'vaa-tag hyphens-none mb-sm')}>
      {getLinkText(link)}
    </a>
  {/each}
{:else if typeof answer === 'string'}
  <span class:vaa-tag={asTag} {...$$restProps}>
    {ucFirst(answer)}
  </span>
{:else}
  {logError(
    `InfoAnswer: Error displaying answer for question ${question.id}: ${answer} (${typeof answer})`
  )}
{/if}

<style lang="postcss">
  .vaa-tag {
    /* last: is valid prefix */
    @apply small-label me-md inline-block rounded-[1rem] bg-base-300 px-md py-sm last:me-0;
  }
</style>
