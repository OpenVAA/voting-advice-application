<script lang="ts">
  import {_} from 'svelte-i18n';
  import {createEventDispatcher} from 'svelte';
  import LikertScaleAnsweringButtons from './LikertScaleAnsweringButtons.svelte';
  import type {LikertQuestion} from '$lib/vaa-data';

  // TODO: Make this into a wrapper for questions and handle different types
  // in subcomponents, such as LikertQuestion.
  // TODO: Only expose an attribute taking in a Question object, bc there are so
  // many properties we need, such as, topic, futherInfo, etc.
  // TODO: Maybe make this component generic so that it can also be used in
  // candidate details and elsewhere.

  // TO DO: Define an interface with just the necessary properties instead of
  // an vaa-data object type.
  export let question: LikertQuestion;
  export let selectedKey: number | undefined = undefined;

  const {id, text, parent, values, info} = question;

  const dispatch = createEventDispatcher();

  function onChange(event: CustomEvent) {
    dispatch('change', {question, ...event.detail});
  }

  function onSkip() {
    dispatch('skip', {question});
  }
</script>

<section class="flex-auto">
  <fieldset>
    <legend>
      <hgroup>
        {#if parent?.shortName}
          <!-- TODO: Set color based on category -->
          <p class="text-secondary">{parent?.shortName}</p>
        {/if}
        <h1>{text}</h1>
      </hgroup>
    </legend>
    {#if info && info !== ''}
      <div class="flex items-center justify-center">
        <!-- TODO: Convert to Expander component -->
        <button class="btn-ghost btn text-primary">{$_('questions.readMore')}</button>
      </div>
    {/if}
    <div class="mb-3 mt-5 flex items-center justify-center">
      <!-- TODO: Check question type here -->
      <LikertScaleAnsweringButtons name={id} {values} {selectedKey} on:change={onChange} />
    </div>
    <div class="flex items-center justify-center">
      <!-- TODO: Add action and an icon -->
      <button on:click={onSkip} class="btn-ghost btn text-secondary">{$_('questions.skip')}</button>
    </div>
  </fieldset>
</section>
