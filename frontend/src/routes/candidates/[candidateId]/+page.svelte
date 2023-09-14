<script lang="ts">
  import {_} from 'svelte-i18n';
  import {page} from '$app/stores';
  import {candidates} from '$lib/utils/stores';
  import {CandidateDetailsCard} from '$lib/components/candidates';

  let candidate: CandidateProps | undefined;

  $: if ($page.params.candidateId) {
    candidate = $candidates.find((c) => '' + c.id === '' + $page.params.candidateId);
  }
</script>

{#if candidate}
  <CandidateDetailsCard {candidate} />
{:else}
  {$_('candidates.notFound')}
{/if}
