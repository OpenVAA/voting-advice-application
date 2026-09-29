<!--
@component Display the buttons used for answering Likert and other single choice questions.

The buttons are rendered as `<input type="radio">` elements contained inside a `<fieldset>`. Consider passing an `aria-labelledby` pointing to the question or an `aria-label`.

The buttons for ordinal questions are by default displayed horizontally and with a line connecting them, while categorical ones are displayed vertically using a larger text size and without a line. These can be overridden by setting the relevant properties. The vertical layout should always be used for choices with long labels.

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

- `question`: The question to answer or display. A `MultipleChoiceCategoricalQuestion` uses checkboxes, any other question radio buttons.
- `choices`: The choices to show, in place of the question's own. Required for a `BooleanQuestion`.
- `disabled`: Whether to disable all the buttons. @default `false`
- `mode`: The same component can be used both for answering the questions and displaying answers. @default `'answer'`
- `selectedId`: The initially selected key of the radio group.
- `selectedIds`: The initially selected keys in checkbox mode.
- `otherSelected`: The answer key of the entity in display mode.
- `otherSelectedIds`: The answer keys of the entity in display mode, in checkbox mode.
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
  selectedId={question.ensureValue(answers.answers[question.id]?.value)}
  onChange={answerQuestion}
  onReselect={doFoo} />

<QuestionChoices
  {question}
  mode="display"
  selectedId={question.ensureValue(answers.answers[question.id]?.value)}
  otherSelected={candidateAnswer}
  otherLabel={t('candidateApp.common.candidateAnswerLabel')} />
```
-->

<script lang="ts">
  import { getCustomData } from '@openvaa/app-shared';
  import { isMultipleChoiceQuestion, isObjectType, OBJECT_TYPE } from '@openvaa/data';
  import { untrack } from 'svelte';
  import { getComponentContext } from '$lib/contexts/component';
  import { cn, concatClass } from '$lib/utils/components';
  import { getEffectiveSelectionBounds } from '$lib/utils/multiChoiceValidity';
  import { onKeyboardFocusOut } from '$lib/utils/onKeyboardFocusOut';
  import type { Id } from '@openvaa/core';
  import type { QuestionChoicesProps } from './QuestionChoices.type';

  let {
    question,
    choices: explicitChoices = undefined,
    disabled = false,
    selectedId = undefined,
    selectedIds = undefined,
    otherSelected = undefined,
    otherSelectedIds = undefined,
    otherLabel = '',
    mode = 'answer',
    onShadedBg = false,
    showLine = undefined,
    variant = undefined,
    onReselect = undefined,
    onChange = undefined,
    ...restProps
  }: QuestionChoicesProps = $props();

  ////////////////////////////////////////////////////////////////////
  // Display-mode styling
  ////////////////////////////////////////////////////////////////////

  /**
   * How a radio option that neither the voter nor the entity picked is drawn in `display` mode: a small dot on the connecting line. It is applied on top of the input's base classes, and `cn` lets these sizes and outline width replace the base ones.
   */
  const UNPICKED_RADIO = 'm-8 h-16 w-16 border-none bg-(--line-bg) outline-2';

  /** How a checkbox option that neither the voter nor the entity picked is drawn in `display` mode: the same dot, with square corners. */
  const UNPICKED_CHECKBOX = cn(UNPICKED_RADIO, 'rounded-sm');

  /** How the entity's answer is drawn in `display` mode when the voter did not pick it: a filled dot inside a ring. */
  const ENTITY_PICKED =
    'disabled:not-checked:border-neutral disabled:not-checked:bg-neutral disabled:not-checked:shadow-[inset_0_0_0_4px_var(--color-base-100)]';

  ////////////////////////////////////////////////////////////////////
  // Multi-select (checkbox) mode
  ////////////////////////////////////////////////////////////////////

  // Checkbox multi-select mode is used for a `MultipleChoiceCategoricalQuestion`, and radio buttons for every other question.
  let multiMode = $derived(isMultipleChoiceQuestion(question));

  // For convenience. `explicitChoices` wins when provided (required for `BooleanQuestion`, which has no native `.choices`; caller synthesizes them).
  let choices = $derived(explicitChoices ?? ('choices' in question ? question.choices : undefined));
  let text = $derived(question.text);

  ////////////////////////////////////////////////////////////////////
  // Get contexts
  ////////////////////////////////////////////////////////////////////

  const { t } = getComponentContext();

  ////////////////////////////////////////////////////////////////////
  // Layout variants
  ////////////////////////////////////////////////////////////////////

  // The default is to show the line for ordinal and boolean questions and not for categorical ones.
  let doShowLine = $derived.by(() => {
    if (showLine !== undefined) return showLine;
    return (
      isObjectType(question, OBJECT_TYPE.SingleChoiceOrdinalQuestion) ||
      isObjectType(question, OBJECT_TYPE.BooleanQuestion)
    );
  });
  // The default layout for ordinal questions is horizontal, and vertical for categorical ones (both single- and multi-choice categorical).
  let vertical = $derived.by(() => {
    if (variant) return variant === 'vertical';
    return (
      isObjectType(question, OBJECT_TYPE.SingleChoiceCategoricalQuestion) ||
      isObjectType(question, OBJECT_TYPE.MultipleChoiceCategoricalQuestion) ||
      !!getCustomData(question).vertical
    );
  });

  // Vertical: the display labels in column 1 and the choices in column 2, one row each. Horizontal: the display labels in row 1 and the choices in row 2, one column each.
  let fieldsetClass = $derived(
    cn(
      'relative grid w-full grid-flow-row',
      vertical ? 'gap-md auto-rows-fr' : 'auto-cols-fr grid-rows-[auto_max-content] gap-0'
    )
  );
  let labelClass = $derived(
    cn(
      'gap-md grid',
      vertical
        ? 'col-start-2 min-w-[8rem] auto-cols-fr grid-flow-col grid-cols-[auto] items-center justify-items-start'
        : 'row-start-2 auto-rows-max grid-flow-row justify-items-center'
    )
  );
  let displayLabelClass = $derived(
    cn(
      'text-secondary text-xs font-normal uppercase',
      vertical ? 'col-start-1 self-center pe-6 text-end' : 'row-start-1 self-end pb-6 text-center'
    )
  );

  ////////////////////////////////////////////////////////////////////
  // Selecting choices
  ////////////////////////////////////////////////////////////////////

  /** Holds the currently selected value and is initialized with the value of `selectedId` */
  let selected: Id | null | undefined = $state(undefined);
  const inputs: Record<string, HTMLInputElement> = $state({});
  $effect(() => {
    selected = selectedId;
    // We need to explicitly set the selected value, because group binding does not consistently update the input states themeselves
    if (selected && inputs[selected]) inputs[selected].checked = true;
  });

  ////////////////////////////////////////////////////////////////////
  // Multi-select checkbox state + change dispatch
  ////////////////////////////////////////////////////////////////////

  /**
   * Holds the currently selected `Id`s in checkbox multi-select mode. Seeded per question identity: the effect tracks `question.id` (Q→Q re-seed) and reads the `selectedIds` prop UNTRACKED. The prop is deliberately NOT live-tracked — when the voter layout deletes an invalid in-progress answer (gate), the `selectedIds` prop transitions to null and a live-tracking sync would wipe the voter's checked boxes mid-interaction (the boxes render from `selectedMulti.includes(id)`). Q→Q re-seeding is preserved via the `question.id` key; explicit deletes clear via the layout's delete-epoch remount. Mirrors OpinionQuestionInput.svelte's question-keyed untrack seed.
   */
  let selectedMulti: Array<Id> = $state([]);
  $effect(() => {
    void question.id;
    untrack(() => {
      selectedMulti = Array.isArray(selectedIds) ? [...selectedIds] : [];
    });
  });

  /**
   * Toggle a checkbox choice and dispatch the full selection as an array of choice `Id`s. Labels play no role in the value. Over-selection beyond `maxSelections` stays physically possible and surfaces as invalidity in the callers — we never disable unchecked boxes here.
   */
  function handleToggle(id: Id): void {
    if (disabled || mode !== 'answer') return;
    const next = selectedMulti.includes(id) ? selectedMulti.filter((x) => x !== id) : [...selectedMulti, id];
    selectedMulti = next;
    onChange?.({ question, value: [...next] });
  }

  /**
   * The min/max selection constraints for the helper text. Returns `undefined` when neither `minSelections` nor `maxSelections` is authored.
   * The bounds themselves come from `getEffectiveSelectionBounds`, the same derivation the saveability gate uses, so the helper text cannot advertise a floor the gate refuses to accept — re-deriving `minSelections ?? 1` here would say "select between 0 and N" for an authored zero while the gate requires at least one selection.
   */
  let multiConstraints = $derived.by<{ effectiveMin: number; effectiveMax: number } | undefined>(() => {
    if (!multiMode) return undefined;
    const { minSelections, maxSelections } = getCustomData(question);
    if (minSelections == null && maxSelections == null) return undefined;
    return getEffectiveSelectionBounds({ minSelections, maxSelections, choiceCount: choices?.length ?? 0 });
  });

  // To behave correctly for mouse, touch and keyboard users on different browsers, we listen to several events. The radio inputs' events are fired in this order:
  //
  // 1. `keydown` (keyboard only) or `pointerdown` (mouse/touch only; Chrome also fires this when `disabled`)
  // 2. `pointerup`: mouse/touch only (Chrome also fires this when `disabled`)
  // 3. `click`: both mouse/touch and keyboard users, but Safari does not fire this if the `<label>` is clicked even though that selects the radio button
  // 4. `change`: the group value is only updated at this point
  // 5. `keyup`: keyboard only
  //
  // In addition, a custom `onFocusOut` event is fired when the user leaves the radio group.
  //
  // The behaviour is therefore implemented as follows:
  //
  // 1. Listen to `click` events of the `<label>`
  //    - If the source is keyboard, do nothing
  //    - If the source is mouse/touch, dispatch an event using the value passed to the event handler, because the radio group's value is not yet updated
  // 2. Listen to `onFocusOut` of the `<fieldset>` containing the radio group
  //    - Dispatch the `change`/`reselect` event using the value of the radio group
  //    - This only fires when the user leaves the radio group using the keyboard, because a pointer click has already been handled by the click handler
  // 3. Listen to `keyup` events of the `<input>` elements
  //    - For a nicer keyboard UX, also listen to the `space` and `enter` keys and submit the answer if they are pressed inside the radio group

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
   * @param value - Optional value that overrides the current value of the radio group. This should be passed when invoking this function from the `click` event handler, because it is fired before the radio group's value is updated. @default undefined
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
  style:--radio-bg={onShadedBg ? 'var(--color-base-200)' : 'var(--color-base-100)'}
  style:--line-bg={onShadedBg ? 'var(--color-base-100)' : 'var(--color-base-200)'}
  style:--num-choices={choices?.length ?? 0}
  data-testid="question-choices"
  {...concatClass(restProps, fieldsetClass)}>
  <!-- Add a label for screen readers -->
  <legend class="sr-only">{text}</legend>

  <!-- The line behind the choices -->
  {#if doShowLine}
    {#if vertical}
      <div
        aria-hidden="true"
        class="absolute left-16 w-4 -translate-x-1/2 bg-(--line-bg)"
        style="grid-column: 2; height: calc(100% / var(--num-choices) * (var(--num-choices) - 1)); top: calc(50% / var(--num-choices))">
      </div>
    {:else}
      <div
        aria-hidden="true"
        class="absolute top-16 h-4 -translate-y-1/2 bg-(--line-bg)"
        style="grid-row: 2; width: calc(100% / var(--num-choices) * (var(--num-choices) - 1)); left: calc(50% / var(--num-choices))">
      </div>
    {/if}
  {/if}

  <!-- The choice buttons -->
  {#each choices ?? [] as { id, label }, i}
    {#if multiMode}
      <!-- Checkbox multi-select mode (MultipleChoiceCategoricalQuestion) -->
      {@const voterSelected = selectedIds?.includes(id) ?? false}
      {@const entitySelected = otherSelectedIds?.includes(id) ?? false}
      {@const hasAnySelection = (selectedIds?.length ?? 0) > 0 || (otherSelectedIds?.length ?? 0) > 0}
      <!-- NB. deliberately NOT the same predicate as the `sr-only` one below, which additionally
           requires that SOMETHING is selected. With nothing selected the labels stay visible but every
           option is still drawn as a dot. -->
      {@const unpicked = mode === 'display' && !voterSelected && !entitySelected}

      <!-- The voter's and entity's answers in `display` mode -->
      {#if mode === 'display'}
        {@const style = `grid-${vertical ? 'row' : 'column'}: ${i + 1};`}
        {#if voterSelected && entitySelected}
          <div class={displayLabelClass} {style}>
            {t('questions.answers.yourAnswer')} & {otherLabel}
          </div>
        {:else if voterSelected}
          <div class={displayLabelClass} {style}>{t('questions.answers.yourAnswer')}</div>
        {:else if entitySelected}
          <div class={displayLabelClass} {style}>{otherLabel}</div>
        {/if}
      {/if}

      <!-- The checkbox. The `<label>` widens the click target; a checkbox's
           native change event handles both pointer and keyboard toggles, so no
           custom keydown/focusout plumbing is needed (unlike the radio group). -->
      <label class={labelClass}>
        <input
          type="checkbox"
          class={cn(
            'checkbox-primary checkbox border-lg relative h-32 w-32 outline-4 outline-(--radio-bg) disabled:opacity-100',
            unpicked && UNPICKED_CHECKBOX,
            entitySelected && ENTITY_PICKED
          )}
          name="questionChoices-{question.id}"
          disabled={mode !== 'answer'}
          value={id}
          data-testid="question-choice"
          checked={selectedMulti.includes(id)}
          onchange={() => handleToggle(id)} />

        <!-- A test id marker for the entity's answer in display mode. -->
        {#if entitySelected}
          <span data-testid="entity-selected-answer" class="sr-only">entity-selected</span>
        {/if}

        <div
          class:sr-only={mode === 'display' && hasAnySelection && !voterSelected && !entitySelected}
          class={vertical ? 'text-start' : 'small-label text-center'}>
          {label}
        </div>
      </label>
    {:else}
      <!-- NB. deliberately NOT the same predicate as the `sr-only` one below, which additionally
           requires that SOMETHING is selected. With nothing selected the labels stay visible but every
           option is still drawn as a dot. -->
      {@const unpicked = mode === 'display' && selectedId != id && otherSelected != id}

      <!-- The voter's and entity's answers in `display` mode -->
      {#if mode === 'display'}
        {@const style = `grid-${vertical ? 'row' : 'column'}: ${i + 1};`}
        {#if selectedId == id && otherSelected == id}
          <div class={displayLabelClass} {style}>
            {t('questions.answers.yourAnswer')} & {otherLabel}
          </div>
        {:else if selectedId == id}
          <div class={displayLabelClass} {style}>{t('questions.answers.yourAnswer')}</div>
        {:else if otherSelected == id}
          <div class={displayLabelClass} {style}>{otherLabel}</div>
        {/if}
      {/if}

      <!-- The button -->
      <!-- The label wraps a radio input (interactive); the listeners exist
           to widen the click/key target to the entire label region.
           Both pointer and keyboard interactions are handled. -->
      <!-- svelte-ignore a11y_no_noninteractive_element_interactions -->
      <label class={labelClass} onclick={(e) => handleClick(e, id)} onkeyup={(e) => handleKeyUp(e, id)}>
        <!-- bind: keep — $state target for bind:this; inputs is $state({}) per the declaration above; two-way DOM radio group bind:group={selected}, selected is $state. Directive order is immaterial for these shapes under Svelte 5 semantics. -->
        <input
          type="radio"
          class={cn(
            'radio-primary radio border-lg bg-base-100 relative h-32 w-32 outline-4 outline-(--radio-bg) disabled:opacity-100',
            unpicked && UNPICKED_RADIO,
            otherSelected == id && ENTITY_PICKED
          )}
          name="questionChoices-{question.id}"
          disabled={mode !== 'answer'}
          value={id}
          data-testid="question-choice"
          bind:this={inputs[id]}
          bind:group={selected}
          onkeyup={(e) => handleKeyUp(e, id)} />

        <!--
          A test id marker for the entity's answer in display mode. It is a separate sr-only element because the input already carries `data-testid="question-choice"` and an element can have only one `data-testid`.
        -->
        {#if otherSelected == id}
          <span data-testid="entity-selected-answer" class="sr-only">entity-selected</span>
        {/if}

        <!-- The text label. If we are displaying answers, we only show the label when it's in use to reduce clutter. We do show the answer also, when none are selected, because it would look weird otherwise. Due to Aria concerns we always show it to screenreaders. -->
        <div
          class:sr-only={mode === 'display' && (selectedId || otherSelected) && selectedId != id && otherSelected != id}
          class={vertical ? 'text-start' : 'small-label text-center'}>
          {label}
        </div>
      </label>
    {/if}
  {/each}
</fieldset>

<!-- Multi-select constraint helper text. Rendered outside the grid
     `<fieldset>` so it does not create a stray grid cell. -->
{#if mode === 'answer' && multiConstraints}
  <p class="small-label text-secondary mt-md text-center" data-testid="question-choice-helper">
    {multiConstraints.effectiveMin === multiConstraints.effectiveMax
      ? t('questions.multiChoice.selectExact', { count: multiConstraints.effectiveMax })
      : t('questions.multiChoice.selectRange', {
          min: multiConstraints.effectiveMin,
          max: multiConstraints.effectiveMax
        })}
  </p>
{/if}
