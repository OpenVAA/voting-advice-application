<script lang="ts">
  import {_} from 'svelte-i18n';
  import type {PageServerData} from './$types';
  import {page} from '$app/stores';
  import {GetFullNameInOrder} from '$lib/utils/internationalisation';
  import {SingleCardPage} from '$lib/components/singleCardPage';
  import {HelpIcon} from '$lib/components/icons';
  import {IconButton} from '$lib/components/iconButton';

  export let data: PageServerData;
</script>

<SingleCardPage title={data.party.name}>
  <svelte:fragment slot="secondaryActions">
    <IconButton href="/help" aria-label={$page.data.appLabels.actionLabels.help}>
      <HelpIcon />
    </IconButton>
  </svelte:fragment>

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
</SingleCardPage>
