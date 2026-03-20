<!--@component

# Election selection page

Display an election selection input.

See `+page.ts` for possible redirects.

### Settings

- `elections.startFromConstituencyGroup`: If set, the elections shown for selection are dependent on the selected constituency. Also affects the route and its parameters onto which the Continue button directs to.
-->

<svelte:options runes />

<script lang="ts">
  import { goto } from '$app/navigation';
  import { Button } from '$lib/components/button';
  import { ElectionSelector } from '$lib/components/electionSelector';
  import { HeroEmoji } from '$lib/components/heroEmoji';
  import { getVoterContext } from '$lib/contexts/voter';
  import MainContent from '../../MainContent.svelte';
  import type { Id } from '@openvaa/core';

  ////////////////////////////////////////////////////////////////////
  // Get contexts
  ////////////////////////////////////////////////////////////////////

  const { appSettings, dataRoot, getRoute, selectedConstituencies, selectedElections, t } = getVoterContext();

  ////////////////////////////////////////////////////////////////////
  // Initialize elections and possible implied constituencies
  ////////////////////////////////////////////////////////////////////

  let selected: Array<Id> = $state([]);

  let elections = $derived.by(() => {
    let result = $dataRoot.elections;
    if ($appSettings.elections?.startFromConstituencyGroup) {
      // Only show elections for which a Constituency is available
      result = result.filter((e) => e.getApplicableConstituency($selectedConstituencies));
    }
    return result;
  });

  $effect(() => {
    selected = ($selectedElections.length ? $selectedElections : elections).map((e) => e.id);
  });

  ////////////////////////////////////////////////////////////////////
  // Selecting elections and submitting
  ////////////////////////////////////////////////////////////////////

  let canSubmit = $derived(selected?.length > 0);

  function handleSubmit(): void {
    if (!canSubmit) return;
    const electionId = Object.values(selected);
    goto(
      $appSettings.elections?.startFromConstituencyGroup
        ? $getRoute({ route: 'Questions', electionId })
        : // Reset any lingering electionIds which may have been left in the search param if a different constituency was seleced before
          $getRoute({ route: 'Constituencies', electionId, constituencyId: undefined })
    );
  }
</script>

<MainContent title={t('elections.title')}>
  {#snippet hero()}
    <figure role="presentation">
      <HeroEmoji emoji={t('dynamic.elections.heroEmoji')} />
    </figure>
  {/snippet}

  {#if elections.length}
    <p class="text-center">
      {elections.length === 1
        ? t('dynamic.elections.ingress.singleElection')
        : t('dynamic.elections.ingress.multipleElections')}
    </p>

    <ElectionSelector {elections} bind:selected data-testid="voter-elections-list" />
  {/if}

  {#snippet primaryActions()}
    <Button
      onclick={handleSubmit}
      disabled={!canSubmit}
      variant="main"
      icon="next"
      text={t('common.continue')}
      data-testid="voter-elections-continue" />
  {/snippet}
</MainContent>
