<!--@component

# Results outer layout

Shows an error message if there are no nominations yet. This is usually the case only when the app is not yet open to the public.
-->

<script lang="ts">
  import { Button } from '$lib/components/button';
  import { HeroEmoji } from '$lib/components/heroEmoji';
  import { getVoterContext } from '$lib/contexts/voter/voterContext.js';
  import MainContent from '../../../MainContent.svelte';

  const { getRoute, matches, t } = getVoterContext();
</script>

{#if Object.values(matches).length > 0}
  <slot />
{:else}
  <MainContent title={$t('error.noNominations')}>
    <figure role="presentation" slot="hero">
      <HeroEmoji emoji={$t('dynamic.error.heroEmoji')} />
    </figure>

    <svelte:fragment slot="primaryActions">
      <Button href={$getRoute('Questions')} text={$t('questions.title')} variant="main" icon="next" />
      <Button href={$getRoute('Home')} text={$t('common.returnHome')} />
    </svelte:fragment>
  </MainContent>
{/if}
