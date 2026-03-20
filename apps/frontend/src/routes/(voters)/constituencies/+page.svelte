<!--@component

# Constituency selection page

Display constituency selection inputs.

See `+page.ts` for possible redirects.

### Settings

- `elections.startFromConstituencyGroup`: If set, only this `ConstituencyGroup` will be displayed for selection. Also affects the route onto which the Continue button directs to.
-->

<svelte:options runes />

<script lang="ts">
  import { goto } from '$app/navigation';
  import { Button } from '$lib/components/button';
  import { ConstituencySelector } from '$lib/components/constituencySelector';
  import { HeroEmoji } from '$lib/components/heroEmoji';
  import { getVoterContext } from '$lib/contexts/voter';
  import MainContent from '../../MainContent.svelte';
  import type { Id } from '@openvaa/core';
  import type { Election } from '@openvaa/data';

  ////////////////////////////////////////////////////////////////////
  // Get contexts
  ////////////////////////////////////////////////////////////////////

  const { appSettings, dataRoot, getRoute, selectedConstituencies, selectedElections, t } = getVoterContext();

  ////////////////////////////////////////////////////////////////////
  // Set initial values
  ////////////////////////////////////////////////////////////////////

  /** The selected `constituencyIds` per election */
  let selected = $state<{ [electionId: Id]: Id }>({});

  const useSingleGroup = $appSettings.elections?.startFromConstituencyGroup
    ? $dataRoot.getConstituencyGroup($appSettings.elections.startFromConstituencyGroup)
    : undefined;

  let elections = $derived(useSingleGroup ? $dataRoot.elections : $selectedElections);

  $effect(() => {
    if ($selectedConstituencies.length) {
      for (const election of elections) {
        const constituency = election.getApplicableConstituency($selectedConstituencies);
        if (constituency) selected[election.id] = constituency.id;
      }
    }
  });

  ////////////////////////////////////////////////////////////////////
  // Selecting constituencies and submitting
  ////////////////////////////////////////////////////////////////////

  /** Bound to `ConstituencySelector` */
  let selectionComplete = $state(false);

  let canSubmit = $derived(selectionComplete);

  function handleSubmit(): void {
    if (!canSubmit) return;
    const constituencyId = Object.values(selected).filter((id) => id);
    goto(
      $appSettings.elections?.startFromConstituencyGroup
        ? // Reset any lingering electionIds which may have been left in the search param if a different constituency was seleced before
          $getRoute({ route: 'Elections', constituencyId, electionId: undefined })
        : $getRoute({ route: 'Questions', constituencyId })
    );
  }
</script>

<MainContent title={t('constituencies.title')}>
  {#snippet hero()}
    <figure role="presentation">
      <HeroEmoji emoji={t('dynamic.constituencies.heroEmoji')} />
    </figure>
  {/snippet}

  {#if elections.length}
    <p class="text-center">
      {useSingleGroup
        ? t('dynamic.constituencies.ingress.singleGroup')
        : elections.length > 1
          ? t('dynamic.constituencies.ingress.multipleElections')
          : t('dynamic.constituencies.ingress.singleElection')}
    </p>

    <ConstituencySelector
      {elections}
      {useSingleGroup}
      bind:selected
      bind:selectionComplete
      data-testid="voter-constituencies-list" />
  {/if}

  {#snippet primaryActions()}
    <Button
      onclick={handleSubmit}
      disabled={!canSubmit}
      variant="main"
      icon="next"
      text={t('common.continue')}
      data-testid="voter-constituencies-continue" />
  {/snippet}
</MainContent>
