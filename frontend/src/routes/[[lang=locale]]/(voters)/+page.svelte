<script lang="ts">
  import {page} from '$app/stores';
  import {t} from '$lib/i18n';
  import {getRoute, Route} from '$lib/utils/navigation';
  import {resetLocalStorage} from '$lib/utils/stores';
  import {HeadingGroup, PreHeading} from '$lib/components/headingGroup';
  import {OpenVAALogo} from '$lib/components/openVAALogo';
  import {FrontPage} from '$lib/templates/frontPage';
</script>

<FrontPage title={$page.data.election.name}>
  <HeadingGroup slot="heading">
    <PreHeading class="text-2xl font-bold text-primary">{$t('viewTexts.appTitle')}</PreHeading>
    <h1 class="text-3xl font-normal">{$page.data.election.name}</h1>
  </HeadingGroup>

  <img slot="hero" class="bg-white" src="/images/hero.png" alt="" />

  <p class="text-center">
    {$t('viewTexts.toolDescription', {
      electionDate: new Date($page.data.election.electionDate)
    })}
  </p>

  <a
    href={getRoute(Route.Intro)}
    on:click={resetLocalStorage}
    class="btn btn-primary mb-md w-full max-w-md">{$t('actionLabels.startButton')}</a>
  <a href={getRoute(Route.Info)} class="btn btn-ghost w-full max-w-md"
    >{$t('actionLabels.electionInfo')}</a>
  <a href={getRoute(Route.About)} class="btn btn-ghost w-full max-w-md"
    >{$t('actionLabels.howItWorks')}</a>

  <svelte:fragment slot="footer">
    {$t('viewTexts.publishedBy', {publisher: 'OpenVAA'})}
    • {$t('viewTexts.madeWith')}
    <a href="https://github.com/OpenVAA/voting-advice-application/" target="_blank"
      ><OpenVAALogo color="secondary" size="xs" /></a>
  </svelte:fragment>
</FrontPage>
