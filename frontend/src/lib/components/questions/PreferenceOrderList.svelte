<!--
@component
Mockup preference order list. Shows an ordered list with placeholders above an unordered list of choices.
Click a choice to move it into the ordered list and use arrows to reorder.
-->

<script lang="ts">
  import { crossfade } from 'svelte/transition';
  import { quintOut } from 'svelte/easing';
  import { flip } from 'svelte/animate';
  import type { Id } from '@openvaa/core';
  import type { Choice } from '@openvaa/data';
  import { getComponentContext } from '$lib/contexts/component';
  import type { QuestionChoicesProps } from './QuestionChoices.type';
  import { splitLabel } from './splitLabel';

  type PreferenceOrderListProps = {
    question: QuestionChoicesProps['question'];
    disabled?: boolean;
    onChange?: (details: { question: QuestionChoicesProps['question']; value: Id }) => void;
  };

  export let question: PreferenceOrderListProps['question'];
  export let disabled: PreferenceOrderListProps['disabled'] = false;
  export let onChange: PreferenceOrderListProps['onChange'] = undefined;

  const { t } = getComponentContext();

  export const [send, receive] = crossfade({
    duration: (d) => Math.sqrt(d * 200),
    easing: quintOut,
    fallback(node) {
      const style = getComputedStyle(node);
      const transform = style.transform === 'none' ? '' : style.transform;

      return {
        duration: 600,
        easing: quintOut,
        css: (t) => `
          transform: ${transform} scale(${t});
          opacity: ${t}
        `
      };
    }
  });

  // For convenience
  let choices: Array<Choice<undefined>> | Array<Choice<unknown>>;
  let text: string;
  $: ({ choices, text } = question);

  let shuffledChoices: Array<Choice<undefined>> | Array<Choice<unknown>> = [];
  let orderedIds: Id[] = [];
  let lastQuestionId: Id | undefined;

  function shuffle<T>(items: T[]): T[] {
    const array = [...items];
    for (let i = array.length - 1; i > 0; i -= 1) {
      const j = Math.floor(Math.random() * (i + 1));
      [array[i], array[j]] = [array[j], array[i]];
    }
    return array;
  }

  $: if (question?.id && question.id !== lastQuestionId) {
    lastQuestionId = question.id;
    shuffledChoices = shuffle([...(choices ?? [])]);
    orderedIds = [];
  }

  $: availableChoices = (shuffledChoices ?? []).filter((choice) => !orderedIds.includes(choice.id));

  $: choiceById = new Map((choices ?? []).map((choice) => [choice.id, choice]));

  $: orderedChoices = Array.from({ length: Math.min(orderedIds.length + 1, choices?.length ?? 0) }, (_, index) => {
    const id = orderedIds[index];
    return id ? (choiceById.get(id) ?? null) : null;
  });

  function addToOrder(id: Id) {
    if (disabled) return;
    if (orderedIds.includes(id)) return;
    if (orderedIds.length >= (choices?.length ?? 0)) return;
    orderedIds = [...orderedIds, id];
    notify();
  }

  function moveUp(index: number) {
    if (disabled || index <= 0) return;
    orderedIds = swap(orderedIds, index, index - 1);
    notify();
  }

  function moveDown(index: number) {
    if (disabled || index >= orderedIds.length - 1) return;
    orderedIds = swap(orderedIds, index, index + 1);
    notify();
  }

  function swap<T>(array: T[], i: number, j: number): T[] {
    const copy = [...array];
    [copy[i], copy[j]] = [copy[j], copy[i]];
    return copy;
  }

  function notify() {
    if (orderedIds.length !== (choices?.length ?? 0)) return;
    onChange?.({ question, value: orderedIds[orderedIds.length - 1] });
  }
</script>

<fieldset class="flex flex-col gap-lg" aria-label={text}>
  <legend class="sr-only">{text}</legend>

  <div class="ordered-panel">
    <div class="small-label my-md text-center font-bold">{$t('dynamic.temp.preferenceOrder.order')}</div>
    <ol class="ordered-list">
      {#each orderedChoices as choice, index (choice?.id ?? `slot-${index}`)}
        <li class="ordered-slot" animate:flip={{ duration: 300, easing: quintOut }}>
          {#if choice}
            {@const [pureLabel, labelInfo] = splitLabel(choice.label)}
            <div class="ordered-item" in:receive={{ key: choice.id }}>
              <div class="slot-index"></div>
              <div class="slot-label">
                {pureLabel}
                <div class="text-sm text-secondary">{labelInfo}</div>
              </div>
              <div class="slot-actions">
                <button
                  type="button"
                  class="icon-button"
                  on:click={() => moveUp(index)}
                  disabled={disabled || index === 0}
                  aria-label={$t('dynamic.temp.preferenceOrder.moveUp')}>
                  ↑
                </button>
                <button
                  type="button"
                  class="icon-button"
                  on:click={() => moveDown(index)}
                  disabled={disabled || index >= orderedIds.length - 1}
                  aria-label={$t('dynamic.temp.preferenceOrder.moveDown')}>
                  ↓
                </button>
              </div>
            </div>
          {:else}
            <div class="ordered-placeholder">
              <span class="slot-index"></span>
              <span class="placeholder-text">{$t('dynamic.temp.preferenceOrder.pickChoice')}</span>
            </div>
          {/if}
        </li>
      {/each}
    </ol>
  </div>

  {#if availableChoices.length}
    <div class="choices-panel">
      <div class="small-label my-md text-center font-bold">{$t('dynamic.temp.preferenceOrder.choices')}</div>
      <ul class="choices-list">
        {#each availableChoices as choice (choice.id)}
          {@const [pureLabel, labelInfo] = splitLabel(choice.label)}
          <li class="choice-item" animate:flip={{ duration: 250, easing: quintOut }}>
            <button
              type="button"
              class="choice-button"
              on:click={() => addToOrder(choice.id)}
              {disabled}
              out:send={{ key: choice.id }}>
              {pureLabel}
              <div class="text-sm text-secondary">{labelInfo}</div>
            </button>
          </li>
        {/each}
      </ul>
    </div>
  {/if}
</fieldset>

<style>
  .ordered-panel,
  .choices-panel {
  }

  .ordered-list,
  .choices-list {
    display: grid;
    list-style: none;
    padding: 0;
    margin: 0;
  }

  .ordered-list {
    counter-reset: ordered-counter;
  }

  .ordered-slot {
    min-height: 2rem;
    counter-increment: ordered-counter;
  }

  .ordered-item,
  .ordered-placeholder,
  .choice-button {
    display: grid;
    grid-template-columns: auto 1fr auto;
    gap: 0.5rem;
    align-items: start;
    padding: 0.5rem 0;
    border-bottom: 1px solid oklch(var(--b2));
    min-width: min(80vw, 20rem);
  }

  .ordered-placeholder {
    color: oklch(var(--bc));
    opacity: 0.3;
    border-style: dashed;
  }

  .slot-index {
    font-weight: 600;
  }

  .slot-index::before {
    content: counter(ordered-counter) '.';
  }

  .slot-label {
    font-weight: 500;
  }

  .slot-actions {
    display: flex;
    gap: 0.4rem;
  }

  .icon-button {
    width: 2.2rem;
    height: 2.2rem;
    border-radius: 0.6rem;
    border: 1px solid oklch(var(--b2));
    background: oklch(var(--b1));
    transition:
      transform 120ms ease,
      background 120ms ease,
      border-color 120ms ease;
  }

  .icon-button:disabled {
    opacity: 0.4;
    cursor: not-allowed;
  }

  .icon-button:not(:disabled):hover {
    transform: translateY(-1px);
    background: oklch(var(--p) / 0.12);
    border-color: oklch(var(--p) / 0.2);
  }

  .choice-button {
    width: 100%;
    text-align: left;
    grid-template-columns: 1fr;
    background: oklch(var(--b1));
    transition:
      transform 120ms ease,
      box-shadow 120ms ease;
  }

  .choice-button:disabled {
    opacity: 0.6;
    cursor: not-allowed;
  }

  .choice-button:not(:disabled):hover {
    transform: translateY(-1px);
    box-shadow: 0 12px 24px -20px rgba(0, 0, 0, 0.4);
  }

  @media (min-width: 720px) {
    .preference-order {
      grid-template-columns: 1fr 1fr;
      align-items: start;
    }

    .ordered-panel {
      order: 1;
    }

    .choices-panel {
      order: 2;
    }
  }
</style>
