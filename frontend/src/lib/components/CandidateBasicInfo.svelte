<script lang="ts">
  import {_} from 'svelte-i18n';
  export let candidate;
</script>

<section class="mt-4">
  <div class="w-full px-10 pt-3">
    <div class="flex justify-between">
      <div class="flex-col">
        <div class="mb-3.5 flex items-center">
          <p class="mr-1.5 w-16 text-xs uppercase text-secondary">Age</p>
          <p class="text-sm">{candidate.age} yrs.</p>
        </div>
        <div class="mb-3.5 flex items-center">
          <p class="mr-1.5 w-16 text-xs uppercase text-secondary">Gender</p>
          <p class="text-sm">{candidate.gender}</p>
        </div>
        <div class="flex items-center">
          <p class="mr-1.5 w-16 text-xs uppercase text-secondary">List</p>
          <p class="flex text-sm">
            <img class="mr-2" src="/icons/party-icon.svg" alt="Party Icon" />
            {candidate.list}
          </p>
        </div>
      </div>
      <img class="h-16 w-16" src="/images/candidate-photo.png" alt="Candidate Photo" />
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
      <div class="mb-3.5 flex items-start">
        <p class="mr-1.5 w-16 text-xs uppercase text-secondary">Themes</p>
        <ul class="-mt-0.5 ml-5 list-disc text-sm">
          {#each candidate.themes as theme}
            <li>{theme}</li>
          {/each}
        </ul>
      </div>
    </div>
  </div>
</section>
