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
  import { getEmailUrl } from '$lib/utils/email';
  import MainContent from '../../MainContent.svelte';

  ////////////////////////////////////////////////////////////////////
  // Get contexts
  ////////////////////////////////////////////////////////////////////

  const { appSettings, appCustomization, getRoute, t, userData } = getCandidateContext();

  ////////////////////////////////////////////////////////////////////
  // Build support email link
  ////////////////////////////////////////////////////////////////////
  
  const supportMailto = getEmailUrl({
    subject: `${$t('candidateApp.help.supportEmailSubject')}: ${$t('dynamic.candidateAppName')}`,
    to: $appSettings.admin.email,
  });
</script>

<MainContent title={$t('candidateApp.help.title')}>
  <div class="text-center mb-lg">
    {$t('candidateApp.help.ingress')}
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

    <Button
      href={supportMailto}
      variant="prominent"
      target="_blank"
      icon="feedback"
      text={$t('candidateApp.common.contactSupport')}
      class="mt-lg" />

  <svelte:fragment slot="primaryActions">
    <Button
      icon="next"
      variant="main"
      text={$t('common.home')}
      href={$userData ? $getRoute('CandAppHome') : $getRoute('CandAppLogin')} />
  </svelte:fragment>
</MainContent>
