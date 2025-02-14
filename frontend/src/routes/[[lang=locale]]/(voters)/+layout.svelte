<!--@component

# Voter app main layout

- Inits VoterContext
- Sets top bar settings
- Render the `Layout` component for the Voter App
- Shows a maintenance page if the Voter App is not accessible yet

### Settings

- `access.voterApp`: Whether to show the Voter App.
- `header.showHelp`: Whether the help button is shown in the header.
- `header.showFeedback`: Whether the feedback button is shown in the header.
-->

<script lang="ts">
  import { onDestroy } from 'svelte';
  import { getLayoutContext } from '$lib/contexts/layout';
  import { initVoterContext } from '$lib/contexts/voter';
  import { VoterNav } from '$lib/dynamic-components/navigation/voter/';
  import Layout from '../Layout.svelte';
  import MaintenancePage from '../MaintenancePage.svelte';

  ////////////////////////////////////////////////////////////////////
  // Init Voter Context
  ////////////////////////////////////////////////////////////////////

  const { appSettings, appType, t } = initVoterContext();
  $appType = 'voter';

  ////////////////////////////////////////////////////////////////////
  // Layout
  ////////////////////////////////////////////////////////////////////

  const { navigation, topBarSettings } = getLayoutContext(onDestroy);
  topBarSettings.push({
    actions: {
      feedback: $appSettings.header.showFeedback ? 'show' : 'hide',
      help: $appSettings.header.showHelp ? 'show' : 'hide'
    }
  });

  const menuId = 'voter-app-menu';
  let isDrawerOpen: boolean;
</script>

{#if $appSettings.access.voterApp}
  <Layout {menuId} bind:isDrawerOpen>
    <VoterNav on:keyboardFocusOut={navigation.close} id={menuId} hidden={!isDrawerOpen} slot="menu" />
    <slot />
  </Layout>
{:else}
  <MaintenancePage
    title={$t('dynamic.voterAppNotAccessible.title')}
    content={$t('dynamic.voterAppNotAccessible.content')} />
{/if}
