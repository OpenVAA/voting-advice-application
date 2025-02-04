<!--@component

# Voter app main layout

- Inits VoterContext
- Sets top bar settings
- Render the `Layout` component for the Voter App

### Settings

- `header.showHelp`: Whether the help button is shown in the header.
- `header.showFeedback`: Whether the feedback button is shown in the header.
-->

<script lang="ts">
  import { onDestroy } from 'svelte';
  import { getLayoutContext } from '$lib/contexts/layout';
  import { initVoterContext } from '$lib/contexts/voter';
  import Layout from '../Layout.svelte';
  import { VoterNav } from '$lib/dynamic-components/navigation/voter/';
  
  ////////////////////////////////////////////////////////////////////
  // Init Voter Context
  ////////////////////////////////////////////////////////////////////

  const { appSettings, appType } = initVoterContext();
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

<Layout 
  {menuId} 
  bind:isDrawerOpen>

  <VoterNav 
    on:keyboardFocusOut={navigation.close}
    id={menuId}
    hidden={!isDrawerOpen}
    slot="menu" />

  <slot />
  
</Layout>