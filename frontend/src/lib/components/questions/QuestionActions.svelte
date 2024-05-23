<script lang="ts">
  import {t} from '$lib/i18n';
  import {createEventDispatcher} from 'svelte';
  import {concatClass} from '$lib/utils/components';
  import {Button} from '$lib/components/button';
  import type {QuestionActionsProps} from './QuestionActions.type';

  type $$Props = QuestionActionsProps;

  export let answered: $$Props['answered'] = false;
  export let disabled: $$Props['disabled'] = false;
  export let disablePrevious: $$Props['disablePrevious'] = false;
  export let variant: $$Props['variant'] = 'default';
  export let separateSkip: $$Props['separateSkip'] = false;
  export let nextLabel: $$Props['nextLabel'] = undefined;
  export let previousLabel: $$Props['previousLabel'] = undefined;

  const dispatch = createEventDispatcher();

  function onDelete() {
    // We need to check `answered` here, because the button might be shown even when no answer was given due to the delay in hiding and showing actions
    if (answered) dispatch('delete');
  }

  function onNext() {
    dispatch(answered || !separateSkip ? 'next' : 'skip');
  }

  function onPrevious() {
    dispatch('previous');
  }
</script>

<!--
@component
Display the question's secondary actions, such as skip.

### Properties

- `answered`: Set to `true` if the question has already been answered. This controls which actions are shown. @default `false`
- `disabled`: Whether to disable all the actions. @default `false`
- `disablePrevious`:  Whether to disable the previous button. @default `false`
- `variant`: Use to switch between looser and tighter layouts. @default `'default'`
- `separateSkip`: Whether to separate `skip` and `next` actions both as events and button symbols. @default `false`
- `nextLabel`: The text label for the `next` button. @default `$t('questions.next')` or `$t('questions.skip')`
- `previousLabel`: The text label for the `previous` button. @default `$t('questions.previous')`
- Any valid properties of a `<div>` element

### Events

If `separateSkip` is set to `true`, the `next` event is switched to a `skip` event if the user has not yet answered the question. Otherwise, only `next` events will be fired.

- `previous`: The user has clicked on the previous button.
- `next`: The user has clicked on the next button. This is only available if `answered` is `true` or `separateSkip` is `true`.
- `skip`: The user has clicked on the skip button. This is only available if `answered` is `false` and `separateSkip` is `true`.
- `delete`: The user has clicked on the delete answer button. This is only available if `answered` is `true`.

### Usage

```tsx
<QuestionActions 
  answered={voterAnswer != null}
  separateSkip={true}
  variant="tight"
  on:previous={gotoPreviousQuestion}
  on:delete={deleteAnswer}
  on:next={gotoNextQuestion}
  on:skip={skipQuestion} />
```
-->

<div
  role="group"
  aria-label={$t('aria.additionalQuestionActionsLabel')}
  {...concatClass($$restProps, 'mt-lg grid w-full grid-cols-3 items-stretch gap-md')}>
  <Button
    on:click={onNext}
    style="grid-row: 1; grid-column: 3"
    color="secondary"
    {disabled}
    variant={variant === 'icon' ? 'icon' : 'secondary'}
    iconPos={variant === 'tight' ? 'right' : 'top'}
    class={variant === 'icon' || variant === 'tight' ? 'content-end' : ''}
    icon={answered || !separateSkip ? 'next' : 'skip'}
    text={nextLabel ?? (answered || !separateSkip ? $t('questions.next') : $t('questions.skip'))} />
  <Button
    on:click={onDelete}
    disabled={!disabled && answered ? undefined : true}
    class="transition-opacity delay-500 disabled:opacity-0"
    style="grid-row: 1; grid-column: 2"
    color="secondary"
    variant={variant === 'icon' ? 'icon' : 'secondary'}
    iconPos={variant === 'tight' ? 'left' : 'top'}
    icon="close"
    text={$t('questions.remove')} />
  <Button
    on:click={onPrevious}
    disabled={disabled || disablePrevious}
    style="grid-row: 1; grid-column: 1"
    color="secondary"
    variant={variant === 'icon' ? 'icon' : 'secondary'}
    iconPos={variant === 'tight' ? 'left' : 'top'}
    class={variant === 'icon' || variant === 'tight' ? 'content-start' : ''}
    icon="previous"
    text={previousLabel ?? $t('questions.previous')} />
</div>
