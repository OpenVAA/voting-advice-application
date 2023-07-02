<script lang="ts">
  import {createEventDispatcher} from 'svelte';
  import LikertScaleAnsweringButtons from './LikertScaleAnsweringButtons.svelte';

  // TODO: Only expose an attribute taking in a Question object, bc there are so
  // many properties we need, such as, topic, futherInfo, etc.
  // TODO: Maybe make this component generic so that it can also be used in
  // candidate details and elsewhere.
  export let text!: string;
  export let number!: number;
  export let options!: {value: number; label: string}[];

  $: name = `question-${number}`;

  const dispatch = createEventDispatcher();

  function onChange(event: CustomEvent) {
    dispatch('change', {number, ...event.detail});
  }
</script>

<section>
  <fieldset>
    <legend>
      <hgroup>
        <p>Example theme</p>
        <h1>{text}</h1>
      </hgroup>
    </legend>
    <div class="options">
      <!-- TODO: Check question type here -->
      <LikertScaleAnsweringButtons {name} {options} on:change={onChange} />
    </div>
    <div class="info">
      <!-- TODO: Convert to Expander component -->
      <a href="#1">Read More About This Issue</a>
    </div>
  </fieldset>
</section>
