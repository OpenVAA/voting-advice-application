<!--@component

# Candidate app help page

Shows a FAQ and other support content for the candidate application.

### Settings

- `admin.email`: Shown for contacting support
-->

<script lang="ts">
  import { Button } from '$lib/components/button';
  import { Expander } from '$lib/components/expander';
  import { getCandidateContext } from '$lib/contexts/candidate';
  import MainContent from '../../MainContent.svelte';

  ////////////////////////////////////////////////////////////////////
  // Get contexts
  ////////////////////////////////////////////////////////////////////

  const { appSettings, appCustomization, getRoute, t } = getCandidateContext();
</script>

<MainContent title={$t('candidateApp.help.title')}>
  <div class="text-center">
    <p>{$t('candidateApp.help.ingress')}</p>
  </div>

  {#each $appCustomization.candidateAppFAQ ?? [] as faq}
    <Expander title={faq.question} variant="question-help">
      {faq.answer}
    </Expander>
  {:else}
    <p class="mt-lg text-center text-secondary">
      {$t('candidateApp.help.noFAQ')}
    </p>
  {/each}

  <div class="mt-md">
    <Button
      href="mailto:{$appSettings.admin.email}"
      target="_blank"
      icon="feedback"
      iconPos="left"
      text={$t('candidateApp.common.contactSupport')} />
  </div>

  <svelte:fragment slot="primaryActions">
    <Button
      icon="next"
      variant="main"
      text={$t('common.home')}
      href={$getRoute('CandAppLogin')} />
  </svelte:fragment>
</MainContent>
