<script lang="ts">
  import {_} from 'svelte-i18n';

  export let candidate: CandidateProps;
</script>

<section class="mt-4">
  <div class="w-full px-10 pt-3">
    <div class="flex justify-between">
      <div class="flex-col">
        <div class="mb-3.5 flex items-start">
          <p class="mr-1.5 w-16 text-xs uppercase text-secondary">{$_('candidate.list')}</p>
          <p class="flex text-sm">
            <img class="mr-2" src="/icons/party-icon.svg" alt="Party Icon" />
            {candidate.party.name} ({candidate.party.shortName})
          </p>
        </div>
        {#if candidate.electionSymbol}
          <div class="mb-3.5 flex items-start">
            <p class="mr-1.5 w-16 text-xs uppercase text-secondary">
              {$_('candidate.electionSymbol')}
            </p>
            <p class="flex text-sm">
              {candidate.electionSymbol}
            </p>
          </div>
        {/if}
      </div>
      <img class="h-16 w-16" src="/images/candidate-photo.png" alt="Candidate" />
    </div>
    <div class="divider my-5 h-px" />
    <div>
      <div class="mb-3.5 flex items-start">
        <p class="mr-1.5 w-16 text-xs uppercase text-secondary">{$_('candidate.motherTongue')}</p>
        <ul class="-mt-0.5 ml-5 list-disc text-sm">
          {#each candidate.motherTongues as lang}
            <li>{lang}</li>
          {/each}
        </ul>
      </div>
      <div class="mb-3.5 flex items-start">
        <p class="mr-1.5 w-16 text-xs uppercase text-secondary">{$_('candidate.otherLanguages')}</p>
        <ul class="-mt-0.5 ml-5 list-disc text-sm">
          {#each candidate.otherLanguages as lang}
            <li>{lang}</li>
          {/each}
        </ul>
      </div>
      <div class="mb-3.5 flex items-start">
        <p class="mr-1.5 w-16 text-xs uppercase text-secondary">
          {$_('candidate.politicalExperience')}
        </p>
        <ul class="-mt-0.5 ml-5 list-disc text-sm">
          {candidate.politicalExperience}
        </ul>
      </div>
    </div>
  </div>
</section>
