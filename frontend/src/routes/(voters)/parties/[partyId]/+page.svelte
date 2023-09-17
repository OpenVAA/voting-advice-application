<script lang="ts">
  import {_} from 'svelte-i18n';
  import {GetFullNameInOrder} from '$lib/utils/internationalisation';
  import type {PageServerData} from './$types';

  export let data: PageServerData;
</script>

<section class="card m-8 w-96 bg-base-100 shadow-xl">
  <div class="card-body">
    <h2 class="card-title">{data.party.name}</h2>
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
</section>
