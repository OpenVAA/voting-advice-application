<script lang="ts">
  import { staticSettings } from '@openvaa/app-shared';
  import { t } from '$lib/i18n';
  import { appType } from '$lib/stores';
  import { ErrorPage } from '$lib/templates/error';

  $appType = 'candidate';
</script>

{#if staticSettings.dataProvider.supportsCandidateApp}
  {#await import('$lib/candidate/components/candidateContext') then { CandidateContextProvider }}
    <svelte:component this={CandidateContextProvider}>
      <slot />
    </svelte:component>
  {/await}
{:else}
  <ErrorPage
    title={$t('candidateApp.notSupported.title')}
    content={$t('candidateApp.notSupported.content')}
    emoji={$t('candidateApp.notSupported.emoji')} />
{/if}
