<script lang="ts">
  import CandidateDetailsCard from '$lib/components/CandidateDetailsCard.svelte';
  import LoadingIndicator from '$lib/components/LoadingIndicator.svelte';
  import {_} from 'svelte-i18n';
  import {
    availableMatchableQuestions,
    availableNonMatchableQuestions,
    currentPersonNomination
  } from '$lib/stores/stores';
  import {TemplateQuestion, type Person, type Question, PersonNomination} from '$lib/vaa-data';

  // TO DO: Now we expect the person to be a nomination,
  // allow a raw Person as well
  const candidate = currentPersonNomination;

  const compatibilityScore = undefined;

  // TO DO: Fetch compatibilityScores and update them to the Match object type
</script>

{#if $candidate}
  <CandidateDetailsCard
    candidate={$candidate}
    {compatibilityScore}
    basicInfoQuestions={$availableNonMatchableQuestions.sorted}
    opinionQuestions={$availableMatchableQuestions.sorted} />
{:else}
  <LoadingIndicator />
{/if}
