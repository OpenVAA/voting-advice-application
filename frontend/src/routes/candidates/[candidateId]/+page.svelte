<script lang="ts">
  import {_} from 'svelte-i18n';
  import {page} from '$app/stores';
  import {allCandidates} from '$lib/utils/stores';
  import {CandidateDetailsCard, type CandidateProps} from '$lib/components/candidates';

  let candidate: CandidateProps | undefined;

  $: if ($page.params.candidateId) {
    candidate = $allCandidates.find((c) => '' + c.id === '' + $page.params.candidateId);
  }
</script>

{#if candidate}
  <CandidateDetailsCard {candidate} />
{:else}
  {$_('candidates.notFound')}
{/if}
