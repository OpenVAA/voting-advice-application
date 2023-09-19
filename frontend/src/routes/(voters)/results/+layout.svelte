<script lang="ts">
  import {_} from 'svelte-i18n';
  import type {LayoutServerData} from './$types';

  export let data: LayoutServerData;
</script>

{#if !data.candidates.length}
  <p>{$_('candidates.notFound')}</p>
{:else}
  <slot />
{/if}
