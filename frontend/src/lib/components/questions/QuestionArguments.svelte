<!--
@component
Display the pros and cons arguments related to a question.

### Properties

- `question`: The question whose arguments to display.
- Any valid properties of a `<div>` element

### Usage

```tsx
<QuestionArguments {question}/>
```
-->

<script lang="ts">
  import { ARGUMENT_TYPE, getCustomData } from '@openvaa/app-shared';
  import { isChoiceQuestion } from '@openvaa/data';
  import { getComponentContext } from '$lib/contexts/component';
  import { concatClass } from '$lib/utils/components';
  import { sanitizeHtml } from '$lib/utils/sanitize';
  import type { ArgumentType, QuestionArguments } from '@openvaa/app-shared';
  import type { TranslationKey } from '$types';
  import type { QuestionArgumentsProps } from './QuestionArguments.type';

  type $$Props = QuestionArgumentsProps;

  export let question: $$Props['question'];

  const { t } = getComponentContext();

  const { arguments: args } = getCustomData(question) || {};

  const TITLE_KEYS: Record<ArgumentType, TranslationKey> = {
    [ARGUMENT_TYPE.BooleanPros]: 'questions.arguments.pro',
    [ARGUMENT_TYPE.BooleanCons]: 'questions.arguments.con',
    [ARGUMENT_TYPE.CategoricalPros]: 'questions.arguments.proCategory',
    [ARGUMENT_TYPE.LikertPros]: 'questions.arguments.pro',
    [ARGUMENT_TYPE.LikertCons]: 'questions.arguments.con'
  };

  /**
   * Whether the argument holds counterarguments.
   */
  function isCon({ type }: QuestionArguments): boolean {
    return type === ARGUMENT_TYPE.BooleanCons || type === ARGUMENT_TYPE.LikertCons;
  }

  /**
   * Sort arguments to show pros before cons.
   */
  function sortArguments(args: Array<QuestionArguments>): Array<QuestionArguments> {
    return [...args].sort((a, b) => Number(isCon(a)) - Number(isCon(b)));
  }
</script>

{#if args?.length}
  <div {...concatClass($$restProps, `grid gap-lg ${args.length === 2 ? 'grid-cols-2' : 'grid-cols-1'}`)}>
    {#each sortArguments(args) as argument}
      {#if argument.arguments?.length}
        {@const { choiceId } = argument}
        <div>
          <h5 class="font-bold">
            {$t(TITLE_KEYS[argument.type], {
              option: choiceId && isChoiceQuestion(question) ? question.getChoice(choiceId)?.label : ''
            })}
          </h5>
          <ul class={argument.arguments.length === 1 ? '!list-none !pl-0' : ''}>
            {#each argument.arguments as line}
              <li>{@html sanitizeHtml(line.content)}</li>
            {/each}
          </ul>
        </div>
      {/if}
    {/each}
  </div>
{/if}
