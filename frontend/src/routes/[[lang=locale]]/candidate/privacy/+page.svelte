<!--@component

# Candidate app privacy page

Shows a registry and privacy statement
-->

<script lang="ts">
  import { TermsOfUse } from '$candidate/components/termsOfUse';
  import { Button } from '$lib/components/button';
  import { HeroEmoji } from '$lib/components/heroEmoji';
  import { getCandidateContext } from '$lib/contexts/candidate';
  import MainContent from '../../MainContent.svelte';

  ////////////////////////////////////////////////////////////////////
  // Get contexts
  ////////////////////////////////////////////////////////////////////

  const { getRoute, t, userData } = getCandidateContext();

</script>

<MainContent title={$t('candidateApp.privacy.title')}>
  <figure role="presentation" slot="hero">
    <HeroEmoji emoji={$t('dynamic.candidateAppPrivacy.heroEmoji')} />
  </figure>

  <div class="flex flex-col gap-xl my-lg">
    <TermsOfUse />
  </div>

  <svelte:fragment slot="primaryActions">
    <Button
      icon="next"
      variant="main"
      text={$t('common.home')}
      href={$userData ? $getRoute('CandAppHome') : $getRoute('CandAppLogin')} />
  </svelte:fragment>
</MainContent>