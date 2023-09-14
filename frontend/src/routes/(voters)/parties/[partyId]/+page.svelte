<script lang="ts">
  import {_} from 'svelte-i18n';
  import {page} from '$app/stores';
  import type {PageServerData} from './$types';
  import {GetFullNameInOrder} from '$lib/utils/internationalisation';

  export let data: PageServerData;
  const {party} = data;
</script>

{#if party}
  <section class="card m-8 w-96 bg-base-100 shadow-xl">
    <div class="card-body">
      <h2 class="card-title">{party.name}</h2>
      <h3>{party.info}</h3>
      <p><strong>{$_('candidates.candidates')}:</strong></p>
      <ul>
        {#each party.nominatedCandidates || [] as candidate}
          <li>
            <a href={`/candidates/${candidate.id}`}>
              {GetFullNameInOrder(candidate.firstName, candidate.lastName)}
            </a>
          </li>
        {/each}
      </ul>
    </div>
  </section>
{/if}
