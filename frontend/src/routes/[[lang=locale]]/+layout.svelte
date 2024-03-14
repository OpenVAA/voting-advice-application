<script lang="ts">
  import {t} from '$lib/i18n';
  import '../../app.css';
  import type {LayoutData} from './$types';

  export let data: LayoutData;
</script>

<svelte:head>
  <title>{$t('viewTexts.appTitle')}</title>
</svelte:head>

{#if data.election}
  <slot />
{:else}
  <span class="loading loading-spinner loading-lg" />
{/if}
