<script lang="ts">
  import {_} from 'svelte-i18n';
  import LikertScaleAnsweringButton from './LikertScaleAnsweringButton.svelte';
  export let use5pointScale = false;
  export let onClick: (value: number) => void;
</script>

<section class="flex items-center justify-center">
  <div class="grid {use5pointScale ? 'grid-cols-5' : 'grid-cols-4'}">
    <LikertScaleAnsweringButton
      onClick={() => onClick(0)}
      text={$_('questions.scale.fullyDisagree')} />
    <LikertScaleAnsweringButton onClick={() => onClick(1)} text={$_('questions.scale.disagree')} />
    {#if use5pointScale}
      <LikertScaleAnsweringButton onClick={() => onClick(2)} text={$_('questions.scale.neutral')} />
    {/if}
    <LikertScaleAnsweringButton onClick={() => onClick(3)} text={$_('questions.scale.agree')} />
    <LikertScaleAnsweringButton
      onClick={() => onClick(4)}
      text={$_('questions.scale.fullyAgree')} />
  </div>
  <div class="absolute -z-50 m-auto h-1 bg-secondary max-md:mb-12 max-md:w-60 md:mb-8 md:w-96" />
</section>
