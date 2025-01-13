<script lang="ts">
  import { staticSettings } from '@openvaa/app-shared';
  import { error } from '@sveltejs/kit';
  import { onDestroy, setContext } from 'svelte';
  import { getAppContext } from '$lib/contexts/app';
  import { getLayoutContext } from '$lib/contexts/layout';
  import { t } from '$lib/i18n';
  import { candidateContext } from '$lib/utils/legacy-candidateContext';

  setContext('candidate', candidateContext);

  const { appType } = getAppContext();

  const { topBarSettings } = getLayoutContext(onDestroy);
  topBarSettings.push({
    actions: {
      logout: 'show'
    }
  });

  if (!staticSettings.dataAdapter.supportsCandidateApp) {
    error(404, {
      message: $t('candidateApp.notSupported.title'),
      description: $t('candidateApp.notSupported.content'),
      emoji: $t('candidateApp.notSupported.emoji')
    });
  }

  $appType = 'candidate';
</script>

<slot />
