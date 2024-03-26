<script lang="ts">
  import {t} from '$lib/i18n';
  import {getRoute, Route} from '$lib/utils/navigation';
  import {Button} from '$lib/components/button';
  import {SingleCardPage} from '$lib/templates/singleCardPage';
  import type {PageServerData} from './$types';

  export let data: PageServerData;

  let party: PartyProps;
  $: party = data.party;
</script>

<SingleCardPage title={party.name}>
  <Button
    slot="banner"
    class="!text-neutral"
    variant="icon"
    icon="close"
    href={$getRoute(Route.Parties)}
    text={$t('header.back')} />

  <article>
    <div class="card">
      <div class="card-body">
        <h1 class="card-title">{party.name}</h1>
        <h3>{party.info}</h3>
        {#if party.nominatedCandidates?.length}
          <p><strong>{$t('candidates.candidates')}:</strong></p>
          <ul>
            {#each party.nominatedCandidates as candidate}
              <li>
                <a href={$getRoute({route: Route.Candidate, id: candidate.id})}>{candidate.name}</a>
              </li>
            {/each}
          </ul>
        {/if}
      </div>
    </div>
  </article>
</SingleCardPage>
