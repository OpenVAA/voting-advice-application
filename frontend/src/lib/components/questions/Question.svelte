<script lang="ts">
  import {_} from 'svelte-i18n';
  import {createEventDispatcher} from 'svelte';
  import type {OnChangeEventDetail, OnSkipEventDetail} from './Question.type';
  import LikertScaleAnsweringButtons from './LikertScaleAnsweringButtons.svelte';

  // TODO: Only expose an attribute taking in a Question object, bc there are so
  // many properties we need, such as, topic, futherInfo, etc.
  // TODO: Maybe make this component generic so that it can also be used in
  // candidate details and elsewhere.
  export let id: QuestionProps['id'];
  export let text: QuestionProps['text'];
  export let type: QuestionProps['type'];
  export let options: QuestionProps['options'];
  export let category: QuestionProps['category'] = '';
  export let info: QuestionProps['info'] = '';

  const dispatch = createEventDispatcher();

  function onChange(event: CustomEvent) {
    dispatch('change', {id, ...event.detail} as OnChangeEventDetail);
  }

  function onSkip(event: MouseEvent) {
    dispatch('skip', {id, originalEvent: event} as OnSkipEventDetail);
  }
</script>

<fieldset>
  <legend>
    <hgroup class="pb-sm">
      {#if category && category !== ''}
        <!-- TODO: Set color based on category -->
        <p class="text-secondary">{category}</p>
      {/if}
      <h1>{text}</h1>
    </hgroup>
  </legend>
  {#if info && info !== ''}
    <div class="flex items-center justify-center">
      <!-- TODO: Convert to Expander component -->
      <button class="btn-ghost btn">{$_('questions.readMore')}</button>
    </div>
  {/if}
  <div class="flex flex-col items-center justify-center gap-md pt-lg">
    {#if type === 'Likert'}
      <LikertScaleAnsweringButtons name={id} {options} on:change={onChange} />
    {:else}
      {$_('error.general')}
    {/if}
    <div>
      <!-- TODO: Add action and an icon -->
      <button on:click={onSkip} class="btn-ghost btn text-secondary">{$_('questions.skip')}</button>
    </div>
  </div>
</fieldset>
