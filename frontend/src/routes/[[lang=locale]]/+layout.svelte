<script lang="ts">
  import {t} from '$lib/i18n';
  import {staticSettings} from 'vaa-shared';
  import {openFeedbackModal} from '$lib/stores';
  import {FeedbackModal} from '$lib/components/feedback/modal';
  import {Loading} from '$lib/components/loading';
  import {MaintenancePage} from '$lib/templates/maintenance';
  import '../../app.css';
  import type {LayoutData} from './$types';

  export let data: LayoutData;

  let underMaintenance;
  $: underMaintenance = data.appSettings.underMaintenance ?? false;

  const fontUrl =
    staticSettings.font?.url ??
    'https://fonts.googleapis.com/css2?family=Inter:wght@400;700&display=swap';
</script>

<svelte:head>
  <title>{underMaintenance ? $t('maintenance.title') : $t('dynamic.appName')}</title>
  <meta
    name="theme-color"
    content={staticSettings?.colors?.light?.['base-300'] ?? '#d1ebee'}
    media="(prefers-color-scheme: light)" />
  <meta
    name="theme-color"
    content={staticSettings?.colors?.dark?.['base-300'] ?? '#1f2324'}
    media="(prefers-color-scheme: dark)" />
  {#if fontUrl.indexOf('fonts.googleapis') !== -1}
    <link rel="preconnect" href="https://fonts.googleapis.com" />
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin="true" />
  {/if}
  <link href={fontUrl} rel="stylesheet" />
</svelte:head>

{#if underMaintenance}
  <MaintenancePage />
{:else}
  {#if data.election}
    <slot />
  {:else}
    <Loading showLabel />
  {/if}
  <FeedbackModal bind:openFeedback={$openFeedbackModal} />
{/if}
