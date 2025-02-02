<!--
@component
Display the buttons used for answering Likert and other single choice questions.

The buttons are rendered as `<input type="radio">` elements contained inside a `<fieldset>`. Consider passing an `aria-labelledby` pointing to the question or an `aria-label`.

The buttons for ordinal questions are by default displayed horizontally and with a line connecting them, while categorical ones are displayed vertically using a larger text size and without a line. These can be overriden by setting the relevant properties. The vertical layout should always be used for choices with long labels.

The radio buttons' behaviour is as follows when using a pointer or touch device:

1. Selecting an option triggers the `onChange` callback
2. Clicking on the selected radio button triggers the `onReselect` callback

Keyboard navigation works in the following way:

1. `Tab` focuses the whole radio group
2. The arrow keys change the focused radio button and *select* it at the same time
3. When the keyboard focus leaves the radio group, either of the callbacks is triggered, depending on whether value has been changed or not
4. The event is also dispatched when the user presses the `Space` or `Enter` key

### Display mode

The same component can also be used to display the answers of the voter and another entity by setting `mode` to `'display'` and supplying `otherSelected` and `otherLabel`. In this case the buttons cannot be selected.

### Properties

- `name`: The `name` of the radio group. Usually the question's id
- `choices`: The `key`-`label` pairs of the radio buttons
- `disabled`: Whether to disable all the buttons. @default `false`
- `mode`: The same component can be used both for answering the questions and displaying answers. @default `'answer'`
- `selectedId`: The initially selected key of the radio group.
- `otherSelected`: The answer key of the entity in display mode.
- `otherLabel`: The label for the entity's answer. Be sure to supply this if `otherSelected` is supplied.
- `showLine`:  Whether to show a line connecting the choices. @default `true` for ordinal questions, and `false` for categorical questions
- `onShadedBg`: Set to `true` if using the component on a dark (`base-300`) background. @default `false`
- `variant`: Defines the layout variant of the buttons. The `vertical` variant can be used for questions with longer labels. @default `'horizontal'` for ordinal questions, and `'vertical'` for categorical questions.
- Any valid attributes of a `<fieldset>` element

### Callbacks

- `onReselect`: Triggered when user has clicked on the same radio button that was initially selected.
- `onChange`: Triggered when the user has clicked on a different radio button than which was initially selected or there was no selected value initially.

### Usage

```tsx
<QuestionChoices
  {question}
  selectedId={$voterAnswers[question.id]}
  onChange={answerQuestion}
  onReselect={doFoo} />

<QuestionChoices
  {question}
  mode="display"
  selectedId={$voterAnswers[question.id]}
  otherSelected={candidateAnswer}
  otherLabel={$t('candidateApp.common.candidateAnswerLabel')} />
```
-->

<script lang="ts">
  import { type Choice, SingleChoiceCategoricalQuestion, SingleChoiceOrdinalQuestion } from '@openvaa/data';
  import { getComponentContext } from '$lib/contexts/component';
  import { onKeyboardFocusOut } from '$lib/utils/onKeyboardFocusOut';
  import type { Id } from '@openvaa/core';
  import type { QuestionChoicesProps } from './QuestionChoices.type';

  type $$Props = QuestionChoicesProps;

  export let question: $$Props['question'];
  export let disabled: $$Props['disabled'] = false;
  export let selectedId: $$Props['selectedId'] = undefined;
  export let otherSelected: $$Props['otherSelected'] = undefined;
  export let otherLabel: $$Props['otherLabel'] = '';
  export let mode: $$Props['mode'] = 'answer';
  export let onShadedBg: $$Props['onShadedBg'] = false;
  export let showLine: $$Props['showLine'] = undefined;
  export let variant: $$Props['variant'] = undefined;
  export let onReselect: $$Props['onReselect'] = undefined;
  export let onChange: $$Props['onChange'] = undefined;

  // For convenience
  let choices: Array<Choice<undefined>> | Array<Choice<unknown>>;
  let text: string;
  $: ({ choices, text } = question);

  ////////////////////////////////////////////////////////////////////
  // Get contexts
  ////////////////////////////////////////////////////////////////////

  const { t } = getComponentContext();

  ////////////////////////////////////////////////////////////////////
  // Layout variants
  ////////////////////////////////////////////////////////////////////

  // The is to show the line for ordinal questions and not for categorical ones.
  let doShowLine: boolean;
  // The default layout for ordinal questions is horizontal, and vertical for categorical ones.
  let vertical: boolean;
  $: {
    if (showLine) doShowLine = showLine;
    else doShowLine = question instanceof SingleChoiceOrdinalQuestion;
    if (variant) vertical = variant === 'vertical';
    else vertical = question instanceof SingleChoiceCategoricalQuestion;
  }

  ////////////////////////////////////////////////////////////////////
  // Selecting choices
  ////////////////////////////////////////////////////////////////////

  /** Holds the currently selected value and is initialized with the value of `selectedId` */
  let selected: Id | null | undefined;
  const inputs: Record<string, HTMLInputElement> = {};
  $: {
    selected = selectedId;
    // We need to explicitly set the selected value, because group binding does not consistently update the input states themeselves
    if (selected && inputs[selected]) inputs[selected].checked = true;
  }

  // In order to achieve the correct behaviour with both mouse/touch and keyboard users and on different browsers, we have to listen a number of events. The radio inputs' events are fired in this order:
  //
  // 1. `keydown`: keyboard only
  //    `pointerdown`: mouse/touch only (Chrome also fires this when `disabled`)
  // 2. `pointerup`: mouse/touch only (Chrome also fires this when `disabled`)
  // 3. `click`:  both mouse/touch and keyboard users, but Safari does not fire this if the `<label>` is clicked even though that selects the radio button
  // 4. `change`: the group value is only updated at this point
  // 5. `keyup`: keyboard only
  //
  // In addition, a custom `onFocusOut` event is fired when the user leaves the radio group.
  //
  // With these complications, the behaviour is here implemented as follows:
  //
  // 1. Listen to `click` events of the `<label>`
  //    - If the source is keyboard, do nothing
  //    - If the source is mouse/touch, dispatch an event and using the value passed as a parameter to the event handler, because the radio group's value is not yet updated
  // 2. Listen to `onFocusOut` of the `<div>` containing the radio group
  //    - Dispatch the `change`/`reselect` event using the value of the radio group
  //    - This event should only fired when the user defocuses the radio group using the keyboard because if it received focus due to a pointer click we would already have dealt it with the click handler
  // 3. Listen to `keyup` events of the `<input>` elements
  //    - For a nicer keyboard UX, also listen to `space` and `enter` keys and and submit the answer if they are pressed inside the radio group

  /**
   * Used to check for changes to the radio buttons or clicks on them. These include keyboard interactions using the arrow keys as well.
   */
  function handleClick(event: MouseEvent, value: Id) {
    if (disabled) return;
    let keyboard: boolean;
    if ('pointerType' in event) {
      // `pointerType` is the main way of finding out whether the user is using a keyboard
      keyboard = event.pointerType !== 'mouse' && event.pointerType !== 'pen' && event.pointerType !== 'touch';
    } else {
      // Safari and Firefox, however, use the old `MouseEvent` type instead, which does not include `pointerType`. In them, we have to check the `detail` property.
      keyboard = event.detail === 0;
    }
    // If the user is using the keyboard, we do not fire any events now, but only when they move focus away from the radio buttons, which is covered by `onRadioGroupFocusOut`
    if (!keyboard) {
      triggerCallback(value);
    }
  }

  /**
   * Select the option if the user presses the space or enter key when in the radio group
   */
  function handleKeyUp(event: KeyboardEvent, value: Id) {
    if (disabled) return;
    if (event.key === ' ' || event.key === 'Spacebar' || event.key === 'Enter') {
      selected = value;
      triggerCallback(value);
    }
  }

  /**
   * Trigger a callback using the value of the radio group when the user leaves the radio group using the keyboard.
   */
  function handleGroupFocusOut() {
    if (disabled) return;
    triggerCallback();
  }

  ////////////////////////////////////////////////////////////////////
  // Callbacks
  ////////////////////////////////////////////////////////////////////

  /**
   * Trigger a callback depending on either the value passed or the radio group's value if no value is supplied.
   *
   * NB. The event will only be dispatched if a valid value is either supplied or selected in the radio group.
   *
   * @param value Optional value that overrides the current value of the radio group. This should be passed when invoking this function from the `click` event handler, because it is fired before the radio group's value is updated. @default undefined
   */
  function triggerCallback(value?: Id | null): void {
    // Use the selected value if no value is supplied
    value ??= selected;
    // Only dispatch the event if the value is defined
    if (value == null) return;
    const details = { question, value };
    if (selectedId != null && value == selectedId) {
      onReselect?.(details);
    } else {
      onChange?.(details);
    }
  }
</script>

<fieldset
  use:onKeyboardFocusOut={handleGroupFocusOut}
  style:--radio-bg={onShadedBg ? 'var(--b3)' : 'var(--b1)'}
  style:--line-bg={onShadedBg ? 'var(--b1)' : 'var(--b3)'}
  class:vertical
  {...$$restProps}>

  <!-- Add a label for screen readers -->
  <legend class="sr-only">{text}</legend>

  <!-- The line behind the choices -->
  {#if doShowLine}
    {#if vertical}
      <div
        aria-hidden="true"
        class="absolute left-16 w-4 -translate-x-1/2 bg-[oklch(var(--line-bg))]"
        style="grid-column: 2; height: calc(100% / {choices?.length} * {(choices?.length ?? 0) -
          1}); top: calc(50% / {choices?.length})" />
    {:else}
      <div
        aria-hidden="true"
        class="absolute top-16 h-4 -translate-y-1/2 bg-[oklch(var(--line-bg))]"
        style="grid-row: 2; width: calc(100% / {choices?.length} * {(choices?.length ?? 0) -
          1}); left: calc(50% / {choices?.length})" />
    {/if}
  {/if}

  <!-- The radio buttons -->
  {#each choices ?? [] as { id, label }, i}
    <!-- The voter's and entity's answers in `display` mode -->
    {#if mode === 'display'}
      {@const style = `grid-${vertical ? 'row' : 'column'}: ${i + 1};`}
      {#if selectedId == id && otherSelected == id}
        <div class="display-label text-primary" {style}>
          {$t('questions.answers.yourAnswer')} & {otherLabel}
        </div>
      {:else if selectedId == id}
        <div class="display-label text-primary" {style}>{$t('questions.answers.yourAnswer')}</div>
      {:else if otherSelected == id}
        <div class="display-label" {style}>{otherLabel}</div>
      {/if}
    {/if}

    <!-- The button -->
    <!-- svelte-ignore a11y-no-noninteractive-element-interactions -->
    <label on:click={(e) => handleClick(e, id)} on:keyup={(e) => handleKeyUp(e, id)}>
      <input
        type="radio"
        class="radio-primary radio relative h-32 w-32 border-lg bg-base-100 outline outline-4 outline-[oklch(var(--radio-bg))] disabled:opacity-100"
        class:entitySelected={otherSelected == id}
        name="questionChoices-{question.id}"
        disabled={mode !== 'answer'}
        value={id}
        bind:this={inputs[id]}
        bind:group={selected}
        on:keyup={(e) => handleKeyUp(e, id)} />

      <!-- The text label. If we are displaying answers, we only show the label when it's in use to reduce clutter. We do show the answer also, when none are selected, because it would look weird otherwise. Due to Aria concerns we always show it to screenreaders. -->
      <div
        class:sr-only={mode === 'display' && (selectedId || otherSelected) && selectedId != id && otherSelected != id}
        class={vertical ? 'text-start' : 'small-label text-center'}>
        {label}
      </div>
    </label>
  {/each}
</fieldset>

<style lang="postcss">
  fieldset {
    @apply relative grid w-full gap-0;
  }

  fieldset.vertical {
    @apply grid-flow-row auto-rows-fr gap-md;
    grid-template-columns: fr fr auto;
  }

  fieldset:not(.vertical) {
    @apply auto-cols-fr grid-flow-row;
    grid-template-rows: auto max-content;
  }

  label {
    @apply grid gap-md;
  }

  fieldset.vertical label {
    @apply min-w-[8rem] auto-cols-fr grid-flow-col items-center justify-items-start gap-md;
    grid-column: 2;
    grid-template-columns: auto;
  }

  fieldset:not(.vertical) label {
    @apply grid-flow-row auto-rows-max justify-items-center;
    grid-row: 2;
  }

  .display-label {
    @apply small-label;
  }

  fieldset.vertical .display-label {
    @apply small-label self-center pe-6 text-end;
    grid-column: 1;
  }

  fieldset:not(.vertical) .display-label {
    @apply small-label self-end pb-6 text-center;
    grid-row: 1;
  }

  input[type='radio']:disabled:not(:checked):not(.entitySelected) {
    @apply m-8 h-16 w-16 border-none bg-[oklch(var(--line-bg))] outline-2;
  }

  input.entitySelected:disabled:not(:checked) {
    @apply border-neutral bg-neutral;
    box-shadow:
      0 0 0 4px oklch(var(--b1)) inset,
      0 0 0 4px oklch(var(--b1)) inset;
  }
</style>
