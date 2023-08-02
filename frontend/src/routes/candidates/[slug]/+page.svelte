<script lang="ts">
  import {_} from 'svelte-i18n';
  import {candidateRankings} from '$lib/utils/stores';
  import {GetFullNameInOrder} from '$lib/utils/internationalisation';
  import CandidateDetailsCard from '$lib/components/CandidateDetailsCard.svelte';
  import type {CompatibilityScore} from '$types/compatibilityScore.type';

  export let data;

  let party = data?.party?.data;
  let compatibilityScore: CompatibilityScore;

  // TODO: create a more dynamic way to create the candidate object
  const candidate = {
    id: data.id,
    age: 35,
    name: GetFullNameInOrder(data.firstName, data.lastName),
    electionListShort: party.attributes.partyAbbreviation,
    gender: '—',
    list: party.attributes.party,
    motherTongues: data?.motherTongues?.data.map((item) => item.attributes.language),
    themes: data?.themes.map((item) => item.attributes.name)
  };

  candidateRankings.subscribe((value) => {
    compatibilityScore = value.find((score) => score.id === candidate.id);
  });
</script>

{#if data}
  <CandidateDetailsCard {candidate} {compatibilityScore} />
{/if}
