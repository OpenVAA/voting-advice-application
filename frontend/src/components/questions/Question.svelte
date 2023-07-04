<script lang="ts">
  import {_} from 'svelte-i18n';
  import {createEventDispatcher} from 'svelte';
  import LikertScaleAnsweringButtons from './LikertScaleAnsweringButtons.svelte';

  // TODO: Only expose an attribute taking in a Question object, bc there are so
  // many properties we need, such as, topic, futherInfo, etc.
  // TODO: Maybe make this component generic so that it can also be used in
  // candidate details and elsewhere.
  export let text!: string;
  export let number!: number;
  export let options!: {value: number; label: string}[];
  export let topic: string | null = null;
  export let info: string | null = null;

  $: name = `question-${number}`;

  const dispatch = createEventDispatcher();

  function onChange(event: CustomEvent) {
    dispatch('change', {number, ...event.detail});
  }
</script>

<section class="flex-auto">
  <fieldset>
    <legend>
      <hgroup>
        {#if topic && topic !== ''}
          <!-- TODO: Set color based on topic -->
          <p class="text-secondary">{topic}</p>
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
      <LikertScaleAnsweringButtons {name} {options} on:change={onChange} />
    </div>
    <div class="flex items-center justify-center">
      <!-- TODO: Add action and an icon -->
      <button class="btn-ghost btn text-secondary">{$_('questions.skip')}</button>
    </div>
  </fieldset>
</section>
