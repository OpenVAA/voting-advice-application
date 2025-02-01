<script lang="ts">
  import { Button } from '$lib/components/button';
  import { Expander } from '$lib/components/expander';
  import { t } from '$lib/i18n';
  import { customization, settings } from '$lib/legacy-stores';
  import { getRoute, ROUTE } from '$lib/utils/legacy-navigation';
  import Layout from '../../../Layout.svelte';
</script>

<Layout title={$t('candidateApp.help.title')}>
  <div class="text-center">
    <p>{$t('candidateApp.help.ingress')}</p>
  </div>

  {#each $customization.candidateAppFAQ ?? [] as faq}
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
      href="mailto:{$settings.admin.email}"
      icon="feedback"
      iconPos="left"
      text={$t('candidateApp.common.contactSupport')} />
  </div>

  <svelte:fragment slot="primaryActions">
    <Button
      icon="next"
      variant="main"
      text={$t('candidateApp.common.continueFilling')}
      href={$getRoute(ROUTE.CandAppHome)} />
  </svelte:fragment>
</Layout>
