<script lang="ts">
  import { staticSettings } from '@openvaa/app-shared';
  import { error } from '@sveltejs/kit';
  import { t } from '$lib/i18n';
  import { appType } from '$lib/legacy-stores';

  if (!staticSettings.dataProvider.supportsCandidateApp) {
    error(404, {
      message: $t('candidateApp.notSupported.title'),
      description: $t('candidateApp.notSupported.content'),
      emoji: $t('candidateApp.notSupported.emoji')
    });
  }

  $appType = 'candidate';
</script>

{#await import('$lib/candidate/components/candidateContext') then { CandidateContextProvider }}
  <svelte:component this={CandidateContextProvider}>
    <slot />
  </svelte:component>
{/await}
