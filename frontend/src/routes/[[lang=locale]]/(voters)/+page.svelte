<script lang="ts">
  import {page} from '$app/stores';
  import {t} from '$lib/i18n';
  import {getRoute, Route} from '$lib/utils/navigation';
  import {resetLocalStorage, settings} from '$lib/utils/stores';
  import {Button} from '$lib/components/button';
  import {HeadingGroup, PreHeading} from '$lib/components/headingGroup';
  import {FrontPage} from '$lib/templates/frontPage';
</script>

<FrontPage title={$page.data.election.name}>
  <HeadingGroup slot="heading">
    <PreHeading class="text-2xl font-bold text-primary">{$t('viewTexts.appTitle')}</PreHeading>
    <h1 class="text-3xl font-normal">{$page.data.election.name}</h1>
  </HeadingGroup>

  <img slot="hero" class="bg-white" src={$settings.poster?.url ?? '/images/hero.png'} alt="" />

  <p class="text-center">
    {$t('viewTexts.frontpageIngress', {
      electionDate: new Date($page.data.election.electionDate)
    })}
  </p>

  <Button
    variant="main"
    href={$getRoute(Route.Intro)}
    on:click={resetLocalStorage}
    text={$t('actionLabels.startButton')} />
  <a href={$getRoute(Route.Info)} class="btn btn-ghost w-full max-w-md"
    >{$t('actionLabels.electionInfo')}</a>
  <a href={$getRoute(Route.About)} class="btn btn-ghost w-full max-w-md"
    >{$t('actionLabels.howItWorks')}</a>
</FrontPage>
