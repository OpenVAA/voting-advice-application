<script lang="ts">
  import {t} from '$lib/i18n';
  import type {LayoutServerData} from './$types';

  export let data: LayoutServerData;
</script>

{#if !data.candidates.length}
  <p>{$t('candidates.notFound')}</p>
{:else}
  <slot />
{/if}
