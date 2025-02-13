<script lang="ts">
  import { createEventDispatcher } from 'svelte';
  import { t } from '$lib/i18n';
  import { logDebugError } from '$lib/utils/logger';
  import { onKeyboardFocusOut } from '$lib/utils/onKeyboardFocusOut';
  import type { LikertResponseButtonsEventDetail, LikertResponseButtonsProps } from './LikertResponseButtons.type';

  type $$Props = LikertResponseButtonsProps;

  export let name: $$Props['name'];
  export let options: $$Props['options'];
  export let disabled: $$Props['disabled'] = false;
  export let selectedKey: $$Props['selectedKey'] = undefined;
  export let entityKey: $$Props['entityKey'] = undefined;
  export let entityLabel: $$Props['entityLabel'] = '';
  export let mode: $$Props['mode'] = 'answer';
  export let onShadedBg: $$Props['onShadedBg'] = false;
  export let variant: $$Props['variant'] = 'default';

  if (mode === 'display' && entityKey && !entityLabel)
    logDebugError('You should supply an entityLabel when mode is "display" and entityKey is provided');

  /** Holds the currently selected value and is initialized as `selectedKey` */
  let selected: LegacyAnswerOption['key'] | null | undefined;
  const inputs: Record<string, HTMLInputElement> = {};
  $: {
    selected = selectedKey;
    // We need to explicitly set the selected value, because group binding does not consistently update the input states themeselves
    const input = inputs[`${selected}`];
    if (input) input.checked = true;
  }

  let vertical: boolean;
  $: vertical = variant === 'vertical';

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

  const dispatch = createEventDispatcher<{
    reselect: LikertResponseButtonsEventDetail;
    change: LikertResponseButtonsEventDetail;
  }>();

  /**
   * Used to check for changes to the radio buttons or clicks on them. These include keyboard interactions using the arrow keys as well.
   */
  function onClick(event: MouseEvent, value: LegacyAnswerOption['key']) {
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
      dispatchEvent(value);
    }
  }

  /**
   * Dispatch the `change`/`reselect` event if the user presses the space or enter key when in the radio group
   */
  function onKeyUp(event: KeyboardEvent, value: LegacyAnswerOption['key']) {
    if (disabled) return;
    if (event.key === ' ' || event.key === 'Spacebar' || event.key === 'Enter') {
      selected = value;
      dispatchEvent(value);
    }
  }

  /**
   * Dispatch the `change`/`reselect` event using the value of the radio group when the user leaves the radio group using the keyboard.
   */
  function onGroupFocusOut() {
    if (disabled) return;
    dispatchEvent();
  }

  /**
   * Dispatch the `change`/`reselect` event depending on either the value passed or the radio group's value if no value is supplied.
   *
   * NB. The event will only be dispatched if a valid value is either supplied or selected in the radio group.
   *
   * @param value Optional value that overrides the current value of the radio group. This should be passed when invoking this function from the `click` event handler, because it is fired before the radio group's value is updated. @default undefined
   */
  function dispatchEvent(value?: LegacyAnswerOption['key'] | null) {
    // Use the selected value if no value is supplied
    value ??= selected;
    // Only dispatch the event if the value is defined
    if (value == null) return;
    dispatch(
      // Check whether the selected value has changed or not
      selectedKey != null && value == selectedKey ? 'reselect' : 'change',
      { id: name, value } as LikertResponseButtonsEventDetail
    );
  }
</script>

<!--
@component
Display the radio buttons used for answering Likert and other ordinal, multiple choice questions.

The buttons are rendered as `<input type="radio">` elements contained inside a `<fieldset>`. Consider passing an `aria-labelledby` pointing to the question or an `aria-label`.

The buttons are displayed horizontally by default, but can be rendered vertically by passing `variant="vertical"` in which case a larger text size is also used. The vertical layout should be used for options with long labels.

The radio buttons' behaviour is as follows when using a pointer or touch device:

1. Selecting an option dispatches a `change` event 
2. Clicking on the selected radio button dispatches a `reselect` event

Keyboard navigation works in the following way:

1. `Tab` focuses the whole radio group
2. The arrow keys change the focused radio button and *select* it at the same time
3. When the keyboard focus leaves the radio group, either of the events is dispatched, depending on whether value has been changed or not
4. The event is also dispatched when the user presses the `Space` or `Enter` key

### Properties

- `name`: The `name` of the radio group. Usually the question's id
- `options`: The `key`-`label` pairs of the radio buttons
- `disabled`: Whether to disable all the buttons. @default `false`
- `mode`: The same component can be used both for answering the questions and displaying answers. @default `'answer'`
- `selectedKey`: The initially selected key of the radio group.
- `entityKey`: The answer key of the entity in display mode.
- `entityLabel`: The label for the entity's answer. Be sure to supply this if `entityKey` is supplied.
- `onShadedBg`: Set to `true` if using the component on a dark (`base-300`) background. @default `false`
- `variant`: Defines the layout variant of the buttons. The `vertical` variant can be used for questions with longer labels. @default `'default'`
- Any valid attributes of a `<fieldset>` element

### Events

- `reselect`: The user has clicked on the same radio button that was initially selected.
- `change`: The user has clicked on a different radio button than which was initially selected or there was no selected value initially
- Both contain the a `detail` object with the properties:
  - `id`: The `name` of the radio group. Usually the question's id
  - `value`: The selected key of the radio group.

### Usage

```tsx
<LikertResponseButtons
  aria-labelledby="questionHeadingId"
  name={question.id}
  options={question.options}
  selectedKey={$voterAnswers[question.id]}
  on:change={answerQuestion}
  on:reselect={doFoo} />

<LikertResponseButtons
  aria-labelledby="questionHeadingId"
  name={question.id}
  options={question.options}
  mode="display"
  selectedKey={$voterAnswers[question.id]}
  entityKey={candidateAnswer}
  entityLabel={$t('candidateApp.common.candidateAnswerLabel')} />
```
-->

<fieldset
  use:onKeyboardFocusOut={onGroupFocusOut}
  style:--radio-bg={onShadedBg ? 'var(--b3)' : 'var(--b1)'}
  style:--line-bg={onShadedBg ? 'var(--b1)' : 'var(--b3)'}
  class:vertical
  {...$$restProps}>
  <!-- The line behind the options -->
  {#if vertical}
    <div
      aria-hidden="true"
      class="absolute left-16 w-4 -translate-x-1/2 bg-[oklch(var(--line-bg))]"
      style="grid-column: 2; height: calc(100% / {options?.length} * {(options?.length ?? 0) -
        1}); top: calc(50% / {options?.length})" />
  {:else}
    <div
      aria-hidden="true"
      class="absolute top-16 h-4 -translate-y-1/2 bg-[oklch(var(--line-bg))]"
      style="grid-row: 2; width: calc(100% / {options?.length} * {(options?.length ?? 0) -
        1}); left: calc(50% / {options?.length})" />
  {/if}

  <!-- The radio buttons -->
  {#each options ?? [] as { key, label }, i}
    <!-- The voter's and entity's answers in `display` mode -->
    {#if mode === 'display'}
      {@const style = `grid-${vertical ? 'row' : 'column'}: ${i + 1};`}
      {#if selectedKey == key && entityKey == key}
        <div class="display-label text-primary" {style}>
          {$t('questions.answers.yourAnswer')} & {entityLabel}
        </div>
      {:else if selectedKey == key}
        <div class="display-label text-primary" {style}>{$t('questions.answers.yourAnswer')}</div>
      {:else if entityKey == key}
        <div class="display-label" {style}>{entityLabel}</div>
      {/if}
    {/if}

    <!-- The button -->
    <!-- svelte-ignore a11y-no-noninteractive-element-interactions -->
    <label on:click={(e) => onClick(e, key)} on:keyup={(e) => onKeyUp(e, key)}>
      <input
        type="radio"
        class="radio-primary radio relative h-32 w-32 border-lg bg-base-100 outline outline-4 outline-[oklch(var(--radio-bg))] disabled:opacity-100"
        class:entitySelected={entityKey == key}
        {name}
        disabled={mode !== 'answer'}
        value={key}
        bind:this={inputs[`${key}`]}
        bind:group={selected}
        on:keyup={(e) => onKeyUp(e, key)} />

      <!-- The text label. If we are displaying answers, we only show the label when it's in use to reduce clutter. Due to Aria concerns we, however, need to always show it to screenreaders. -->
      <div
        class:sr-only={!(mode === 'answer' || (mode === 'display' && (selectedKey == key || entityKey == key)))}
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
    @apply auto-cols-fr grid-flow-col items-center justify-items-start gap-md;
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
