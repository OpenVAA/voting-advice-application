<script lang="ts">
  import {_} from 'svelte-i18n';
  import type {PersonNomination, Question} from '$lib/vaa-data';
  import {displayAnswer} from '$lib/utils/answers';

  export let candidate: PersonNomination;
  export let questions: Question[] = [];

  // TO DO: We're temporarily hard-coding some fields, which will be implemented
  // as custom questions

  const fakeCandidate = {
    age: 34,
    gender: 'Male',
    motherTongues: ['English', 'French', 'Spanish'],
    themes: ['Environment', 'Pensioners']
  };

  // STASH: An expanded display of parties and const. associations
  // candidate.organizationNominations
  //   .map((n) => n.shortName + (n.type ? ` (${ucFirst(n.type)})` : ''))
  //   .join(', ')
</script>

<section class="mt-4">
  <div class="w-full px-10 pt-3">
    <div class="flex justify-between">
      <div class="flex-col">
        <div class="mb-3.5 flex items-center">
          <p class="mr-1.5 w-16 text-xs uppercase text-secondary">Age</p>
          <p class="text-sm">{fakeCandidate.age} yrs.</p>
        </div>
        <div class="mb-3.5 flex items-center">
          <p class="mr-1.5 w-16 text-xs uppercase text-secondary">Gender</p>
          <p class="text-sm">{fakeCandidate.gender}</p>
        </div>
        <div class="flex items-center">
          <p class="mr-1.5 w-16 text-xs uppercase text-secondary">{$_('candidate.list')}</p>
          <p class="flex text-sm">
            <!-- TO DO: Move this logic to a reusable function or Component. -->
            {#if candidate.organizationNominations.length}
              {#each candidate.organizationNominations as org}
                <span class="mr-2">
                  <img class="mr-2" src="/icons/party-icon.svg" alt="Party Icon" />
                  {org.shortName}
                </span>
              {/each}
              {#if candidate.isIndependent}
                <em>{$_('candidate.independent')}</em>
              {:else if !candidate.memberOfNominatingOrganization}
                <em>{$_('candidate.memberOfOther')} {candidate.organization?.shortName}</em>
              {/if}
            {:else}
              <p>Not listed by an organization, huh?</p>
            {/if}
          </p>
        </div>
      </div>
      <img class="h-16 w-16" src="/images/candidate-photo.png" alt="Candidate" />
    </div>
    <div class="divider my-5 h-px" />
    <div>
      <div class="mb-3.5 flex items-start">
        <p class="mr-1.5 w-16 text-xs uppercase text-secondary">Mother Tongue</p>
        <ul class="-mt-0.5 ml-5 list-disc text-sm">
          {#each fakeCandidate.motherTongues as motherTongue}
            <li>{motherTongue}</li>
          {/each}
        </ul>
      </div>
      <div class="mb-3.5 flex items-start">
        <p class="mr-1.5 w-16 text-xs uppercase text-secondary">Themes</p>
        <ul class="-mt-0.5 ml-5 list-disc text-sm">
          {#each fakeCandidate.themes as theme}
            <li>{theme}</li>
          {/each}
        </ul>
      </div>
    </div>
    <div class="divider my-5 h-px" />
    {#each questions as qst}
      <!-- TO DO: Add grouping by category here -->
      <div class="mb-3.5 flex items-start">
        <p class="mr-1.5 w-16 text-xs uppercase text-secondary">{qst.text}</p>
        <p class="flex text-sm">
          {@html displayAnswer(qst, candidate, `<em>${$_('candidate.noAnswer')}</em>`)}
        </p>
      </div>
    {/each}
  </div>
</section>
