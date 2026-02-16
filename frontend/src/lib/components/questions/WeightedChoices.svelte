<!--
@component
Mockup weighted choices component. Shows choices with point allocation controls.
Users have n points to spend (where n = number of choices) distributed across choices.
-->

<script lang="ts">
  import { quintOut } from 'svelte/easing';
  import { flip } from 'svelte/animate';
  import { fade } from 'svelte/transition';
  import type { Id } from '@openvaa/core';
  import type { Choice } from '@openvaa/data';
  import { getComponentContext } from '$lib/contexts/component';
  import type { QuestionChoicesProps } from './QuestionChoices.type';
  import { splitLabel } from './splitLabel';

  type WeightedChoicesProps = {
    question: QuestionChoicesProps['question'];
    disabled?: boolean;
    onChange?: (details: { question: QuestionChoicesProps['question']; value: Id }) => void;
  };

  export let question: WeightedChoicesProps['question'];
  export let disabled: WeightedChoicesProps['disabled'] = false;
  export let onChange: WeightedChoicesProps['onChange'] = undefined;

  const { t } = getComponentContext();

  // For convenience
  let choices: Array<Choice<undefined>> | Array<Choice<unknown>>;
  let text: string;
  $: ({ choices, text } = question);

  // Track points allocated to each choice
  let points: Record<Id, number> = {};
  let lastQuestionId: Id | undefined;

  // Initialize points when question changes
  $: if (question?.id && question.id !== lastQuestionId) {
    lastQuestionId = question.id;
    points = {};
    (choices ?? []).forEach((choice) => {
      points[choice.id] = 0;
    });
  }

  // Calculate total points available and spent
  $: totalPoints = (choices ?? []).length;
  $: spentPoints = Object.values(points).reduce((sum, p) => sum + p, 0);
  $: remainingPoints = totalPoints - spentPoints;

  function addPoint(id: Id) {
    if (disabled) return;
    if (remainingPoints <= 0) return;
    points = { ...points, [id]: (points[id] ?? 0) + 1 };
    notify();
  }

  function removePoint(id: Id) {
    if (disabled) return;
    if ((points[id] ?? 0) <= 0) return;
    points = { ...points, [id]: (points[id] ?? 0) - 1 };
    notify();
  }

  function notify() {
    const spent = [...Object.values(points)];
    const total = spent.reduce((sum, p) => sum + p, 0);
    if (total !== totalPoints) return;
    const max = Math.max(...spent);
    const id = Object.keys(points).find((key) => points[key] === max);
    onChange?.({ question, value: id! });
  }
</script>

<fieldset class="weighted-choices" aria-label={text}>
  <legend class="sr-only">{text}</legend>

  <div class="points-display" class:points-zero={remainingPoints === 0}>
    <div class="points-label">{$t('dynamic.temp.weightedChoices.pointsRemaining')}</div>
    <div class="points-value">
      {remainingPoints}
    </div>
  </div>

  <ul class="choices-list">
    {#each choices ?? [] as choice (choice.id)}
      {@const [pureLabel, labelInfo] = splitLabel(choice.label)}
      <li class="choice-item" animate:flip={{ duration: 250, easing: quintOut }}>
        <div class="choice-content">
          <div class="choice-label">
            {pureLabel}
            <p class="text-sm text-secondary">{labelInfo}</p>
          </div>
          <div class="choice-controls">
            <button
              type="button"
              class="control-button"
              on:click={() => removePoint(choice.id)}
              disabled={disabled || (points[choice.id] ?? 0) === 0}
              aria-label={$t('dynamic.temp.weightedChoices.removePoint', { label: choice.label })}>
              −
            </button>
            <div
              class="points-indicator"
              class:points-zero={(points[choice.id] ?? 0) === 0}
              transition:fade={{ duration: 150 }}>
              {points[choice.id] ?? 0}
            </div>
            <button
              type="button"
              class="control-button"
              on:click={() => addPoint(choice.id)}
              disabled={disabled || remainingPoints === 0}
              aria-label={$t('dynamic.temp.weightedChoices.addPoint', { label: choice.label })}>
              +
            </button>
          </div>
        </div>
      </li>
    {/each}
  </ul>
</fieldset>

<style>
  .weighted-choices {
    display: flex;
    flex-direction: column;
    gap: 1.25rem;
  }

  .points-display {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 0.75rem;
  }

  .points-label {
    font-weight: 500;
    color: oklch(var(--bc) / 0.7);
  }

  .points-value {
    font-weight: 700;
    color: oklch(var(--p));
    transition: color 150ms ease;
  }

  .points-display.points-zero {
    color: oklch(var(--s));
    opacity: 0.5;
  }

  .choices-list {
    display: grid;
    gap: 0.5rem;
    list-style: none;
    padding: 0;
    margin: 0;
  }

  .choice-content {
    display: grid;
    grid-template-columns: 1fr auto;
    align-items: center;
    gap: 1rem;
    transition: box-shadow 120ms ease;
  }

  .choice-content:has(.control-button:not(:disabled):hover) {
    box-shadow: 0 4px 12px -8px rgba(0, 0, 0, 0.3);
  }

  .choice-label {
    font-weight: 500;
    line-height: 1.4;
  }

  .choice-controls {
    display: flex;
    align-items: center;
    gap: 0.5rem;
  }

  .control-button {
    width: 2.5rem;
    height: 2.5rem;
    border-radius: 0.6rem;
    border: 1px solid oklch(var(--b2));
    background: oklch(var(--b1));
    font-size: 1.25rem;
    font-weight: 600;
    display: flex;
    align-items: center;
    justify-content: center;
    transition:
      transform 120ms ease,
      background 120ms ease,
      border-color 120ms ease;
  }

  .control-button:disabled {
    opacity: 0.3;
    cursor: not-allowed;
  }

  .control-button:not(:disabled):hover {
    transform: scale(1.1);
    background: oklch(var(--p) / 0.12);
    border-color: oklch(var(--p) / 0.3);
  }

  .control-button:not(:disabled):active {
    transform: scale(0.95);
  }

  .points-indicator {
    min-width: 2rem;
    text-align: center;
    font-weight: 700;
    font-size: 1.25rem;
    color: oklch(var(--p));
  }
  .points-indicator.points-zero {
    color: oklch(var(--s));
    opacity: 0.5;
  }

  @media (min-width: 640px) {
    .choice-content {
      grid-template-columns: 1fr auto;
      padding: 1rem 1.25rem;
    }

    .control-button {
      width: 2.75rem;
      height: 2.75rem;
    }
  }
</style>
