<script lang="ts">
  import {_} from 'svelte-i18n';
  import {GetFullNameInOrder} from '$lib/utils/internationalisation';
  import type {PageServerData} from './$types';

  export let data: PageServerData;
</script>

<article class="flex w-full flex-grow flex-col items-center bg-base-300 lg:p-md lg:pb-0">
  <div class="w-full max-w-xl flex-grow rounded-t-lg bg-base-100 pb-[3.5rem] lg:shadow-xl">
    <div class="card">
      <div class="card-body">
        <h1 class="card-title">{data.party.name}</h1>
        <h3>{data.party.info}</h3>
        {#if data.party.nominatedCandidates?.length}
          <p><strong>{$_('candidates.candidates')}:</strong></p>
          <ul>
            {#each data.party.nominatedCandidates as candidate}
              <li>
                <a href={`/candidates/${candidate.id}`}>
                  {GetFullNameInOrder(candidate.firstName, candidate.lastName)}
                </a>
              </li>
            {/each}
          </ul>
        {/if}
      </div>
    </div>
  </div>
</article>
