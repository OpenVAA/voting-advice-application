<script lang="ts">
  import {_} from 'svelte-i18n';
  import {GetFullNameInOrder} from '$lib/utils/internationalisation';
  import CandidateDetailsCard from '$lib/components/CandidateDetailsCard.svelte';

  export let data;

  let party = data?.party?.data;

  // TODO: create a more dynamic way to create the candidate object
  const candidate = {
    age: 35,
    name: GetFullNameInOrder(data.firstName, data.lastName),
    electionListShort: party.attributes.partyAbbreviation,
    gender: '—',
    list: party.attributes.party,
    motherTongues: data?.motherTongues?.data.map((item) => item.attributes.language),
    themes: data?.themes.map((item) => item.attributes.name)
  };
</script>

{#if data}
  <CandidateDetailsCard {candidate} />
{/if}
