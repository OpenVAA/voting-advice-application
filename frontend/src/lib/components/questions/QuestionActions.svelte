<script lang="ts">
  import {_} from 'svelte-i18n';
  import {createEventDispatcher} from 'svelte';
  import {page} from '$app/stores';
  import {concatClass} from '$lib/utils/components';
  import {Button} from '$lib/components/button';
  import type {QuestionActionsProps} from './QuestionActions.type';

  type $$Props = QuestionActionsProps;

  export let answered: $$Props['answered'] = false;
  export let separateSkip: $$Props['separateSkip'] = false;

  const dispatch = createEventDispatcher();

  function onDelete() {
    // We need to check `answered` here, because the button might be shown even when
    // no answer was given due to the delay in hiding and showing actions
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

- `answered`: Set to `true` if the question has already been answered.
  This controls which actions are shown. @default `false`
- `separateSkip`: Whether to separate `skip` and `next` actions both as 
  events and button symbols. @default `false`
- Any valid properties of a `<div>` element

### Events

If `separateSkip` is set to `true`, the `next` event is switched to a 
`skip` event if the user has not yet answered the question. Otherwise,
only `next` events will be fired.

- `previous`: The user has clicked on the previous button.
- `next`: The user has clicked on the next button. This is only available
  if `answered` is `true` or `separateSkip` is `true`.
- `skip`: The user has clicked on the skip button. This is only available
  if `answered` is `false` and `separateSkip` is `true`.
- `delete`: The user has clicked on the delete answer button. This is only 
  available if `answered` is `true`.

### Usage

```tsx
<QuestionActions 
  answered={voterAnswer != null}
  separateSkip={true}
  on:previous={gotoPreviousQuestion}
  on:delete={deleteAnswer}
  on:next={gotoNextQuestion}
  on:skip={skipQuestion} />
```
-->

<div
  role="group"
  aria-label={$_('aria.additionalQuestionActionsLabel')}
  {...concatClass($$restProps, 'mt-lg grid w-full grid-cols-3 items-stretch gap-md')}>
  <Button
    on:click={onNext}
    style="grid-row: 1; grid-column: 3"
    color="secondary"
    iconPos="top"
    icon={answered || !separateSkip ? 'next' : 'skip'}
    text={answered || !separateSkip
      ? $_('questions.nextQuestion')
      : $page.data.appLabels.actionLabels.skip} />
  <Button
    on:click={onDelete}
    disabled={answered ? undefined : true}
    class="transition-opacity delay-500 disabled:opacity-0"
    style="grid-row: 1; grid-column: 2"
    color="secondary"
    iconPos="top"
    icon="close"
    text={$_('questions.remove')} />
  <Button
    on:click={onPrevious}
    style="grid-row: 1; grid-column: 1"
    color="secondary"
    iconPos="top"
    icon="previous"
    text={$_('questions.previous')} />
</div>
