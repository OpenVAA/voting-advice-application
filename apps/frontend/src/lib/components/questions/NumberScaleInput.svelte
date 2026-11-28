<!--
@component Display a `NumberQuestion`'s answering input as a native range slider (DaisyUI `range range-primary`) with a live numeric value label. The same component renders a read-only dual-marker view in `display` mode (voter value + entity value), mirroring the `QuestionChoices` display-mode marker pattern and reused by `EntityOpinions`.

**Contract:** the component assumes the question has a valid range
(`question.min` and `question.max` both defined, non-equal). The caller (`OpinionQuestionInput`) gates on `question.isMatchable`, so a rangeless number question never reaches this component and cannot render a broken 0-width range.

Native `<input type="range">` is chosen deliberately so keyboard-arrow exact-value stepping works for free: ArrowUp/ArrowRight step +1, ArrowDown/ArrowLeft −1, Home→min, End→max. Values at exactly `min`/`max` are reachable and clamp.

### Properties

- `question`: The `NumberQuestion`. Not reactive.
- `mode`: `'answer'` (default) or `'display'`.
- `value`: The voter's current numeric answer, or `null` when unanswered.
- `otherValue`: The entity's numeric answer in `display` mode.
- `otherLabel`: The label for the entity's answer in `display` mode.
- `onShadedBg`: Set to `true` on a dark (`base-300`) background. @default `false`
- Any valid attributes of a `<div>` element.

### Callbacks

- `onChange`: Triggered when the voter releases the slider or steps it with the keyboard, never per drag pixel, and when the voter presses an unset slider, which saves the value it shows.

### Usage

```tsx
<NumberScaleInput {question} {value} onChange={answerQuestion} />

<NumberScaleInput
  {question}
  mode="display"
  {value}
  otherValue={entityValue}
  otherLabel={t('contestantApp.common.candidateAnswerLabel')} />
```
-->

<script lang="ts">
  import { untrack } from 'svelte';
  import { getComponentContext } from '$lib/contexts/component';
  import { concatClass, getUUID } from '$lib/utils/components';
  import type { NumberScaleInputProps } from './NumberScaleInput.type';

  let {
    question,
    mode = 'answer',
    value = undefined,
    otherValue = undefined,
    otherLabel = '',
    onShadedBg = false,
    onChange = undefined,
    ...restProps
  }: NumberScaleInputProps = $props();

  const { t } = getComponentContext();

  const labelId = getUUID();

  // The height is the touch-target token, so the range thumb meets WCAG 2.1 AA without shrinking the track.
  const RANGE_CLASS = 'range range-primary h-touch w-full cursor-pointer disabled:cursor-default';

  /** A display-mode answer label, positioned along the track. */
  const MARKER_CLASS =
    'text-secondary absolute top-0 -translate-x-1/2 rtl:translate-x-1/2 text-xs font-normal whitespace-nowrap uppercase';

  ////////////////////////////////////////////////////////////////////
  // Range bounds
  ////////////////////////////////////////////////////////////////////

  // The caller guarantees a valid range (isMatchable). We fall back to 0/0 only to keep TypeScript happy — this branch is never reached at runtime.
  const min = $derived(question.min ?? 0);
  const max = $derived(question.max ?? 0);
  const midpoint = $derived(Math.round((min + max) / 2));

  ////////////////////////////////////////////////////////////////////
  // Answer mode: live local value
  ////////////////////////////////////////////////////////////////////

  // Whether the voter has set a value. Starts true when a stored answer exists; becomes true on the first slider interaction. Drives the unanswered-opinion convention: no `text-primary` on the label until the value is set.
  // Init reads are intentionally non-reactive (the $effect below re-syncs on every later `value` change) — untrack() is the documented remedy for state_referenced_locally on a deliberate one-shot init read.
  let isSet = $state(untrack(() => value != null));
  // The live numeric value shown in the label. Updates on every `input` event so the label tracks the thumb during a drag; unset sliders sit at midpoint.
  let liveValue = $state<number>(untrack(() => value ?? midpoint));

  $effect(() => {
    // Re-sync when the incoming answer changes (e.g. mode switch / navigation).
    isSet = value != null;
    liveValue = value ?? midpoint;
  });

  /** Update the live label as the thumb moves (does NOT persist). */
  function handleInput(event: Event & { currentTarget: HTMLInputElement }): void {
    liveValue = event.currentTarget.valueAsNumber;
    isSet = true;
  }

  /** Persist `raw` as the voter's answer. */
  function commit(raw: number): void {
    if (Number.isNaN(raw)) return;
    liveValue = raw;
    isSet = true;
    onChange?.({ question, value: question.ensureValue(raw) as number });
  }

  /** Persist on release / keyboard step only — never per drag pixel. */
  function handleChange(event: Event & { currentTarget: HTMLInputElement }): void {
    commit(event.currentTarget.valueAsNumber);
  }

  /** Save the value an unset slider already shows, which a press produces no `change` event for. */
  function commitIfUnset(): void {
    if (!isSet) commit(liveValue);
  }

  function handleKeydown(event: KeyboardEvent): void {
    if (event.key === 'Enter' || event.key === ' ') commitIfUnset();
  }

  ////////////////////////////////////////////////////////////////////
  // Display mode: marker positions
  ////////////////////////////////////////////////////////////////////

  /** Position along the track as a 0–100% offset from `min`. */
  function percent(v: number): number {
    if (max === min) return 0;
    return Math.min(100, Math.max(0, ((v - min) / (max - min)) * 100));
  }

  const voterPct = $derived(value != null ? percent(value) : null);
  const otherPct = $derived(otherValue != null ? percent(otherValue) : null);
  // When both values are equal we render a single combined marker so neither label hides the other.
  const bothEqual = $derived(value != null && otherValue != null && value === otherValue);
</script>

<div
  {...concatClass(restProps, 'grid w-full gap-4')}
  style:--range-bg={onShadedBg ? 'var(--color-base-200)' : 'var(--color-base-100)'}
  data-testid="number-scale-input">
  {#if mode === 'display'}
    <!-- Read-only dual-marker display -->
    <div role="group" aria-label={question.text}>
      <div class="relative pt-24">
        <!-- Markers positioned proportionally above the track -->
        {#if bothEqual && voterPct != null}
          {@const label = t('questions.answers.yourAndOtherAnswer', { other: otherLabel })}
          <div class={MARKER_CLASS} style:inset-inline-start="{voterPct}%" data-testid="number-scale-voter-marker">
            <span aria-hidden="true">{label}</span>
            <span class="sr-only">{t('questions.answers.numberAnswer', { label, value })}</span>
          </div>
        {:else}
          {#if voterPct != null}
            {@const label = t('questions.answers.yourAnswer')}
            <div class={MARKER_CLASS} style:inset-inline-start="{voterPct}%" data-testid="number-scale-voter-marker">
              <span aria-hidden="true">{label}</span>
              <span class="sr-only">{t('questions.answers.numberAnswer', { label, value })}</span>
            </div>
          {/if}
          {#if otherPct != null}
            <div class={MARKER_CLASS} style:inset-inline-start="{otherPct}%" data-testid="number-scale-entity-marker">
              <span aria-hidden="true">{otherLabel}</span>
              <span class="sr-only"
                >{t('questions.answers.numberAnswer', { label: otherLabel, value: otherValue })}</span>
            </div>
          {/if}
        {/if}
        <input
          type="range"
          class={RANGE_CLASS}
          {min}
          {max}
          step="1"
          value={value ?? otherValue ?? midpoint}
          disabled
          aria-hidden="true"
          data-testid="question-number-slider" />
      </div>
      <div class="flex justify-between">
        <span class="text-secondary text-sm">{min}</span>
        <span class="text-secondary text-sm">{max}</span>
      </div>
    </div>
  {:else}
    <!-- Answer mode -->
    <div class="flex items-center justify-between">
      <span id={labelId} class="sr-only">{question.text}</span>
      <span class="text-secondary text-sm">{min}</span>
      <span
        class="text-base"
        class:text-primary={isSet}
        class:font-bold={isSet}
        aria-hidden="true"
        data-testid="question-number-value">
        {liveValue}
      </span>
      <span class="text-secondary text-sm">{max}</span>
    </div>
    <input
      type="range"
      class={RANGE_CLASS}
      {min}
      {max}
      step="1"
      value={liveValue}
      oninput={handleInput}
      onchange={handleChange}
      onclick={commitIfUnset}
      onkeydown={handleKeydown}
      aria-labelledby={labelId}
      aria-valuenow={isSet ? liveValue : undefined}
      data-testid="question-number-slider" />
  {/if}
</div>
