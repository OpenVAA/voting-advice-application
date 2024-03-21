<script lang="ts">
  import {t} from '$lib/i18n';
  import {settings} from '$lib/utils/stores';
  import '../../app.css';
  import type {LayoutData} from './$types';

  export let data: LayoutData;
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
</svelte:head>

{#if data.election}
  <slot />
{:else}
  <span class="loading loading-spinner loading-lg" />
{/if}
