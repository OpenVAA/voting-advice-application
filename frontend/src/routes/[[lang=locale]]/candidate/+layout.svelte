<script lang="ts">
  import {t} from '$lib/i18n';
  import localSettings from '$lib/config/settings.json';
  import {appType} from '$lib/stores';
  import {ErrorPage} from '$lib/templates/error';

  $appType = 'candidate';
</script>

{#if localSettings.dataProvider.supportsCandidateApp}
  <slot />
{:else}
  <ErrorPage
    title={$t('candidateApp.notSupported.title')}
    content={$t('candidateApp.notSupported.content')}
    emoji={$t('candidateApp.notSupported.emoji')} />
{/if}
