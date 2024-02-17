<script lang="ts">
  import {t} from '$lib/i18n';
  import {page} from '$app/stores';
  import {getRoute, Route} from '$lib/utils/navigation';
  import {resetLocalStorage} from '$lib/utils/stores';
</script>

<div class="flex w-full flex-grow flex-col items-center bg-base-300">
  <figure class="hero bg-[#d4dbef]">
    <img
      class="max-h-[30vh] w-full max-w-lg bg-white object-cover"
      src="/images/hero.png"
      alt=""
      srcset="" />
  </figure>

  <main class="flex-grow">
    <div class="flex max-w-xl flex-col items-center p-lg pl-safelgl pr-safelgr">
      <div class="flex flex-col flex-nowrap items-center">
        <hgroup class="py-lg">
          <p class="text-2xl font-bold text-primary">{$t('viewTexts.appTitle')}</p>
          <h1 class="text-3xl font-normal">{$page.data.election.name}</h1>
        </hgroup>
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
      </div>
    </div>
  </main>

  <footer class="p-lg text-center text-sm text-secondary">
    {$t('viewTexts.publishedBy', {publisher: 'OpenVAA'})}
    <img class="inline w-14" src={'/icons/publisher.svg'} alt="governmental" srcset="" /> • {$t(
      'viewTexts.madeWith',
      {openVAA: 'OpenVAA'}
    )}
    <img class="inline w-14" src="/icons/vote.svg" alt="" srcset="" /> OpenVAA
  </footer>
</div>
