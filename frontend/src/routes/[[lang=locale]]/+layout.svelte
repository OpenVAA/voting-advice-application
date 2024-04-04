<script lang="ts">
  import {t} from '$lib/i18n';
  import {settings} from '$lib/utils/stores';
  import '../../app.css';
  import type {LayoutData} from './$types';

  export let data: LayoutData;

  const fontUrl =
    $settings?.font?.url ??
    'https://fonts.googleapis.com/css2?family=Inter:wght@400;700&display=swap';
</script>

<svelte:head>
  <title>{$t('viewTexts.appTitle')}</title>
  <meta
    name="theme-color"
    content={$settings?.colors?.light?.['base-300'] ?? '#d1ebee'}
    media="(prefers-color-scheme: light)" />
  <meta
    name="theme-color"
    content={$settings?.colors?.dark?.['base-300'] ?? '#1f2324'}
    media="(prefers-color-scheme: dark)" />
  {#if fontUrl.indexOf('fonts.googleapis') !== -1}
    <link rel="preconnect" href="https://fonts.googleapis.com" />
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin="true" />
  {/if}
  <link href={fontUrl} rel="stylesheet" />
</svelte:head>

{#if data.election}
  <slot />
{:else}
  <span class="loading loading-spinner loading-lg" />
{/if}
