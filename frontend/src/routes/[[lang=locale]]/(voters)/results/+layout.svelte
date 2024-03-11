<script lang="ts">
  import {t} from '$lib/i18n';
  import type {LayoutServerData} from './$types';

  export let data: LayoutServerData;

  let candidates: CandidateProps[];
  $: candidates = data.candidates;
</script>

{#if !candidates?.length}
  <p>{$t('candidates.notFound')}</p>
{:else}
  <slot />
{/if}
