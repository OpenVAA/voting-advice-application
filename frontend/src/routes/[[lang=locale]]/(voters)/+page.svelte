<script lang="ts">
  import {locale, t} from '$lib/i18n';
  import {darkMode} from '$lib/utils/darkMode';
  import {getRoute, Route} from '$lib/utils/navigation';
  import {sanitizeHtml} from '$lib/utils/sanitize';
  import {election, openFeedbackModal, settings} from '$lib/stores';
  import {Button} from '$lib/components/button';
  import {HeadingGroup, PreHeading} from '$lib/components/headingGroup';
  import {SurveyBanner} from '$lib/components/survey/banner';
  import {FrontPage} from '$lib/templates/frontPage';
  import OpenVaaLogo from '$lib/components/openVAALogo/OpenVAALogo.svelte';
</script>

<FrontPage title={$election?.name ?? ''} class="bg-transparent">
  <HeadingGroup slot="heading" class="mt-[22vh] w-full">
    <PreHeading
      ><img
        src="images/nuorten-vaalikone-logo-{$locale ?? 'fi'}-{$darkMode ? 'white' : 'black'}.svg"
        alt={$t('viewTexts.appTitle')}
        class="w-[26rem]" /></PreHeading>
    <h1 class="text-3xl font-normal">{$election?.name ?? ''}</h1>
  </HeadingGroup>

  <Button
    variant="main"
    href={$getRoute(Route.Intro)}
    text={$t('actionLabels.startButton')}
    class="min-h-[3rem] text-lg" />

  <div class="-mb-lg mt-xl grid justify-items-stretch rounded-md bg-base-200 p-lg">
    <p class="text-center">
      {@html sanitizeHtml(
        $t('viewTexts.frontpageIngress', {
          electionDate: new Date($election?.electionDate ?? '')
        })
      )}
    </p>

    <a href={$getRoute(Route.Info)} class="btn btn-ghost w-full max-w-md justify-self-center"
      >{$t('actionLabels.electionInfo')}</a>
    <a href={$getRoute(Route.About)} class="btn btn-ghost w-full max-w-md justify-self-center"
      >{$t('actionLabels.howItWorks')}</a>
    <Button
      on:click={$openFeedbackModal}
      class="w-full max-w-md justify-self-center"
      text={$t('navigation.sendFeedback')} />
    {#if $settings.analytics.survey?.showIn?.includes('frontpage')}
      <SurveyBanner class="-mt-sm" />
    {/if}

    <div class="my-lg">
      <h3 class="my-lg text-center">{$t('common.inCooperation')}</h3>
      <div
        class="vaa-frontpage-logos align-center flex flex-row flex-wrap items-center justify-center gap-x-xl gap-y-lg">
        <OpenVaaLogo />
        <img src="images/allianssi-logo-full-{$darkMode ? 'white' : 'black'}.png" alt="Allianssi" />
        <img
          src="images/ee24-logo-{$darkMode ? 'white' : 'color'}-{$locale ?? 'fi'}.svg"
          alt="#Käytä ääntäsi, #Använd din röst, #Use your vote" />
        <img
          src="images/kone-logo-{$darkMode ? 'white' : 'black'}-{$locale ?? 'fi'}.svg"
          alt="Koneen Säätiö, Konestiftelsen, Kone Foundation" />
        <img
          src="images/sitra-logo-{$darkMode ? 'white' : 'black'}.svg"
          alt="Sitra"
          class="!max-w-[6rem]" />
      </div>
    </div>
  </div>
</FrontPage>

<style lang="postcss">
  :global(body) {
    @apply bg-[url('https://dfe4vsdvqdchh.cloudfront.net/frontpage-bg-sm.jpg')] bg-cover bg-fixed 
      bg-center 
      dark:bg-[url('https://dfe4vsdvqdchh.cloudfront.net/frontpage-bg-sm-dark.jpg')]
      sm:bg-[url('https://dfe4vsdvqdchh.cloudfront.net/frontpage-bg-md.jpg')]
      dark:sm:bg-[url('https://dfe4vsdvqdchh.cloudfront.net/frontpage-bg-md-dark.jpg')] 
      lg:bg-[url('https://dfe4vsdvqdchh.cloudfront.net/frontpage-bg-lg.jpg')]
      dark:lg:bg-[url('https://dfe4vsdvqdchh.cloudfront.net/frontpage-bg-lg-dark.jpg')];
  }

  :global(.vaa-frontpage-logos > svg, .vaa-frontpage-logos > img) {
    @apply inline-block max-h-[2rem] max-w-[8rem];
  }
</style>
