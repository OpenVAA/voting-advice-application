<script lang="ts">
  import {t} from '$lib/i18n';
  import {GetFullNameInOrder} from '$lib/utils/internationalisation';
  import {Route, getRoute} from '$lib/utils/navigation';
  import {candidateRankings} from '$lib/utils/stores';
  import {Button} from '$lib/components/button';
  import {CandidateDetailsCard} from '$lib/components/candidates';
  import {SingleCardPage} from '$lib/templates/singleCardPage';
  import type {PageData} from './$types';

  export let data: PageData;

  const {candidateId, candidates, questions, infoQuestions} = data;

  let candidate: CandidateProps | undefined;
  let ranking: RankingProps | undefined;

  // First, check if we have a ranking for the candidate,
  // which contains the Candidate object
  // TODO: We could disallow access to this page if there are no
  // $candidateRankings by moving the redirect check currently in
  // ../+page.svelte to ../+layout.svelte
  if ($candidateRankings.length > 0) {
    const result = $candidateRankings.find((r) => r.candidate.id == candidateId);
    if (result) {
      candidate = result.candidate;
      ranking = result.match;
    }
  }
  // If not, try to find the candidate
  if (!candidate) {
    candidate = candidates.find((c) => c.id == candidateId);
  }

  const title = candidate
    ? GetFullNameInOrder(candidate.firstName, candidate.lastName)
    : $t('candidates.notFound');
</script>

<SingleCardPage {title}>
  <Button
    slot="banner"
    class="!text-neutral"
    variant="icon"
    icon="close"
    href={getRoute(Route.Results)}
    text={$t('header.back')} />
  {#if candidate}
    <CandidateDetailsCard {candidate} {ranking} opinionQuestions={questions} {infoQuestions} />
  {:else}
    <h1 class="text-warning">{title}</h1>
  {/if}
</SingleCardPage>
