<script lang="ts">
  import {_} from 'svelte-i18n';
  import {candidateRankings} from '$lib/utils/stores';
  import {GetFullNameInOrder} from '$lib/utils/internationalisation';
  import CandidateDetailsCard from '$lib/components/CandidateDetailsCard.svelte';
  import type {CompatibilityScore} from '$types/compatibilityScore.type';

  export let data;

  let candidate = data?.candidate?.attributes;
  let party = candidate?.party?.data;
  let compatibilityScore: CompatibilityScore;

  // TODO: create a more dynamic way to create the candidate object
  const candidateDetails = {
    id: data.candidate.id,
    age: 35,
    name: GetFullNameInOrder(candidate.firstName, candidate.lastName),
    partyShortName: party.attributes.shortName,
    gender: '—',
    list: party.attributes.name,
    motherTongues: candidate?.motherTongues?.data.map((item) => item.attributes.language),
    questionCategories: data.questionCategories.map((item) => item.attributes.name)
  };

  candidateRankings.subscribe((value) => {
    compatibilityScore = value.find((score) => score.id === candidateDetails.id);
  });
</script>

{#if data}
  <CandidateDetailsCard {candidateDetails} {compatibilityScore} />
{/if}
