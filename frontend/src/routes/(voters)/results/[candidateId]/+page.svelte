<script lang="ts">
  import {_} from 'svelte-i18n';
  import {page} from '$app/stores';
  import {candidateRankings} from '$lib/utils/stores';
  import {SingleCardPage} from '$lib/components/singleCardPage';
  import {AddToListIcon, HelpIcon} from '$lib/components/icons';
  import {IconButton} from '$lib/components/iconButton';
  import {CandidateDetailsCard} from '$lib/components/candidates';
  import {GetFullNameInOrder} from '$lib/utils/internationalisation';

  const questions = $page.data.questions;
  let candidate: CandidateProps | undefined;
  let ranking: RankingProps | undefined;

  // This block is reactive, although currently it's not necesary.
  // If, however, we add a way to navigate between candidates, then
  // this page will not update if the route param is changed unless
  // we check for it in a reactive way
  $: {
    const id = '' + $page.params.candidateId;
    // First, check if we have a ranking for the candidate,
    // which contains the Candidate object
    // TODO: We could disallow access to this page if there are no
    // $candidateRankings by moving the redirect check currently in
    // ../+page.svelte to ../+layout.svelte
    if ($candidateRankings.length > 0) {
      const result = $candidateRankings.find((r) => '' + r.candidate.id === id);
      if (result) {
        candidate = result.candidate;
        ranking = result.match;
      }
    }
    // If not, try to find the candidate
    if (!candidate) {
      candidate = $page.data.candidates.find((c) => '' + c.id === id);
    }
  }

  // TODO: Create an error page and use it if there's an error
  const title = candidate
    ? GetFullNameInOrder(candidate.firstName, candidate.lastName)
    : $_('candidates.notFound');
</script>

<SingleCardPage {title}>
  <svelte:fragment slot="secondaryActions">
    <IconButton href="/list" aria-label={$page.data.appLabels.actionLabels.addToList}>
      <AddToListIcon />
    </IconButton>
    <IconButton href="/help" aria-label={$page.data.appLabels.actionLabels.help}>
      <HelpIcon />
    </IconButton>
  </svelte:fragment>

  {#if candidate}
    <CandidateDetailsCard {candidate} {ranking} {questions} />
  {:else}
    {$_('candidates.notFound')}
  {/if}
</SingleCardPage>
