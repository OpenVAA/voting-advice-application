<!--@component

# Candidate app main layout

- Inits CandidateContext
- Sets top bar settings
- Render the `Layout` component for the Candidate App
-->

<script lang="ts">
  import { staticSettings } from '@openvaa/app-shared';
  import { error } from '@sveltejs/kit';
  import { onDestroy } from 'svelte';
  import { getAppContext } from '$lib/contexts/app';
  import { initCandidateContext } from '$lib/contexts/candidate';
  import { getLayoutContext } from '$lib/contexts/layout';
  import { CandidateNav } from '$lib/dynamic-components/navigation/candidate';
  import Layout from '../Layout.svelte';

  ////////////////////////////////////////////////////////////////////
  // Get app context
  ////////////////////////////////////////////////////////////////////

  const { appType, t } = getAppContext();

  ////////////////////////////////////////////////////////////////////
  // Check support for Candidate App
  ////////////////////////////////////////////////////////////////////

  if (!staticSettings.dataAdapter.supportsCandidateApp) {
    error(404, {
      message: $t('candidateApp.notSupported.title'),
      description: $t('candidateApp.notSupported.content'),
      emoji: $t('candidateApp.notSupported.heroEmoji')
    });
  }

  ////////////////////////////////////////////////////////////////////
  // Init Candidate Context
  ////////////////////////////////////////////////////////////////////

  initCandidateContext();
  $appType = 'candidate';

  ////////////////////////////////////////////////////////////////////
  // Layout and top bar
  ////////////////////////////////////////////////////////////////////

  const { navigation, topBarSettings } = getLayoutContext(onDestroy);
  topBarSettings.push({
    actions: {
      logout: 'show'
    }
  });

  const menuId = 'candidate-app-menu';
  let isDrawerOpen: boolean;
</script>

<Layout {menuId} bind:isDrawerOpen>
  <CandidateNav on:keyboardFocusOut={navigation.close} id={menuId} hidden={!isDrawerOpen} slot="menu" />

  <slot />
</Layout>
