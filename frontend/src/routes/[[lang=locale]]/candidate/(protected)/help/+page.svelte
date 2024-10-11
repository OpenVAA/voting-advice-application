<script lang="ts">
  import {t} from '$lib/i18n';
  import {getRoute, Route} from '$lib/utils/navigation';
  import {BasicPage} from '$lib/templates/basicPage';
  import {Button} from '$lib/components/button';
  import {Expander} from '$lib/components/expander';
  import {customization, settings} from '$lib/stores';
</script>

<BasicPage title={$t('candidateApp.help.title')}>
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
      href={$getRoute(Route.CandAppHome)} />
  </svelte:fragment>
</BasicPage>
