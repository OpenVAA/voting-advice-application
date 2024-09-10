<script lang="ts">
  import {t} from '$lib/i18n';
  import {getRoute, Route} from '$lib/utils/navigation';
  import {BasicPage} from '$lib/templates/basicPage';
  import {Button} from '$lib/components/button';
  import {Expander} from '$lib/components/expander';
  import {customization} from '$lib/stores';
</script>

<BasicPage title={$t('candidateApp.help.title')}>
  <div class="text-center">
    <p class="pb-lg">{$t('candidateApp.help.ingress')}</p>
  </div>

  {#if $customization.candidateAppFAQ}
    {#each $customization.candidateAppFAQ as faq}
      <Expander title={faq.question} variant="question-help">
        {faq.answer}
      </Expander>
    {/each}
  {/if}

  <svelte:fragment slot="primaryActions">
    <Button
      icon="next"
      variant="main"
      text={$t('candidateApp.common.continueFilling')}
      href={$getRoute(Route.CandAppHome)} />
  </svelte:fragment>
</BasicPage>
