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

<MainContent title={t('candidateApp.privacy.title')}>
  {#snippet hero()}
    <figure role="presentation">
      <HeroEmoji emoji={t('dynamic.candidateAppPrivacy.heroEmoji')} />
    </figure>
  {/snippet}

  <div class="my-lg gap-xl flex flex-col">
    <TermsOfUse />
  </div>

  {#snippet primaryActions()}
    <Button
      icon="next"
      variant="main"
      text={t('common.home')}
      href={$userData ? $getRoute('CandAppHome') : $getRoute('CandAppLogin')}
      data-testid="candidate-privacy-home" />
  {/snippet}
</MainContent>
