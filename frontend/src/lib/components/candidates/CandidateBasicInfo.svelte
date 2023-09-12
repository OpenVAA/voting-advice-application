<script lang="ts">
  // import {_} from 'svelte-i18n';

  export let candidate: CandidateProps;
</script>

<section class="mt-4">
  <div class="w-full px-10 pt-3">
    <div class="flex justify-between">
      <div class="flex-col">
        <div class="flex items-center">
          <p class="mr-1.5 w-16 text-xs uppercase text-secondary">List</p>
          <p class="flex text-sm">
            <img class="mr-2" src="/icons/party-icon.svg" alt="Party Icon" />
            {candidate.party.shortName}
      <img class="h-16 w-16" src="/images/candidate-photo.png" alt="Candidate" />
    </div>
    <div class="divider my-5 h-px" />
    <div>
      <div class="mb-3.5 flex items-start">
        <p class="mr-1.5 w-16 text-xs uppercase text-secondary">Mother Tongue</p>
        <ul class="-mt-0.5 ml-5 list-disc text-sm">
          {#each candidate.motherTongues as motherTongue}
            <li>{motherTongue}</li>
          {/each}
        </ul>
      </div>
    </div>
  </div>
</section>
