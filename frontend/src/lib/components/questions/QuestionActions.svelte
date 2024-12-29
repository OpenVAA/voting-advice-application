<!--
@component
Display a question's secondary actions, such as skip.

### Properties

- `answered`: Set to `true` if the question has already been answered. This controls which actions are shown. @default `false`
- `disabled`: Whether to disable all the actions. @default `false`
- `disablePrevious`:  Whether to disable the previous button. @default `false`
- `variant`: Use to switch between looser and tighter layouts. @default `'default'`
- `separateSkip`: Whether to separate `skip` and `next` actions both as events and button symbols. @default `false`
- `nextLabel`: The text label for the `next` button. @default `$t('questions.next')` or `$t('questions.skip')`
- `previousLabel`: The text label for the `previous` button. @default `$t('questions.previous')`
- Any valid properties of a `<div>` element

### Callbacks

If `separateSkip` is set to `true`, the `onNext` callback is switched to a `onSkip` callback if the user has not yet answered the question. Otherwise, only `onNext` callbacks will be triggered.

- `onDelete`: Triggered when the user has clicked on the delete answer button. This is only available if `answered` is `true`.
- `onNext`: Triggered when the user has clicked on the next button. This is only available if `answered` is `true` or `separateSkip` is `true`.
- `onPrevious`: Triggered when the user has clicked on the previous button.
- `onSkip`: Triggered when user has clicked on the skip button. This is only available if `answered` is `false` and `separateSkip` is `true`.


### Usage

```tsx
<QuestionActions 
  answered={voterAnswer != null}
  separateSkip={true}
  variant="tight"
  onPrevious={gotoPreviousQuestion}
  onDelete={deleteAnswer}
  onNext={gotoNextQuestion}
  onSkip={skipQuestion} />
```
-->

<script lang="ts">
  import { Button } from '$lib/components/button';
  import { getComponentContext } from '$lib/contexts/component';
  import { concatClass } from '$lib/utils/components';
  import type { QuestionActionsProps } from './QuestionActions.type';

  type $$Props = QuestionActionsProps;

  export let answered: $$Props['answered'] = false;
  export let disabled: $$Props['disabled'] = false;
  export let disablePrevious: $$Props['disablePrevious'] = false;
  export let variant: $$Props['variant'] = 'default';
  export let separateSkip: $$Props['separateSkip'] = false;
  export let nextLabel: $$Props['nextLabel'] = undefined;
  export let previousLabel: $$Props['previousLabel'] = undefined;
  export let onDelete: $$Props['onDelete'] = undefined;
  export let onNext: $$Props['onNext'] = undefined;
  export let onPrevious: $$Props['onPrevious'] = undefined;
  export let onSkip: $$Props['onSkip'] = undefined;

  const { t } = getComponentContext();

  function handleDelete() {
    // We need to check `answered` here, because the button might be shown even when no answer was given due to the delay in hiding and showing actions
    if (answered) onDelete?.();
  }

  function handleNext() {
   if (answered || !separateSkip) {
    onNext?.();
   } else {
    onSkip?.();
   }
  }

  function handlePrevious() {
    onPrevious?.();
  }
</script>

<div
  role="group"
  aria-label={$t('questions.additionalActions')}
  {...concatClass($$restProps, 'mt-lg grid w-full grid-cols-3 items-stretch gap-md')}>
  <Button
    on:click={handleNext}
    style="grid-row: 1; grid-column: 3"
    color="secondary"
    {disabled}
    variant={variant === 'icon' ? 'icon' : 'secondary'}
    iconPos={variant === 'tight' ? 'right' : 'top'}
    class={variant === 'icon' || variant === 'tight' ? 'content-end' : ''}
    icon={answered || !separateSkip ? 'next' : 'skip'}
    text={nextLabel ?? (answered || !separateSkip ? $t('questions.next') : $t('questions.skip'))} />
  <Button
    on:click={handleDelete}
    disabled={!disabled && answered ? undefined : true}
    class="transition-opacity delay-500 disabled:opacity-0"
    style="grid-row: 1; grid-column: 2"
    color="secondary"
    variant={variant === 'icon' ? 'icon' : 'secondary'}
    iconPos={variant === 'tight' ? 'left' : 'top'}
    icon="close"
    text={$t('questions.remove')} />
  <Button
    on:click={handlePrevious}
    disabled={disabled || disablePrevious}
    style="grid-row: 1; grid-column: 1"
    color="secondary"
    variant={variant === 'icon' ? 'icon' : 'secondary'}
    iconPos={variant === 'tight' ? 'left' : 'top'}
    class={variant === 'icon' || variant === 'tight' ? 'content-start' : ''}
    icon="previous"
    text={previousLabel ?? $t('questions.previous')} />
</div>
