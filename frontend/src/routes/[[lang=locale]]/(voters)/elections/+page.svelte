<!--@component

# Election selection page

Display an election selection input.

See `+page.ts` for possible redirects.

### Settings

- `elections.startFromConstituencyGroup`: If set, the elections shown for selection are dependent on the selected constituency. Also affects the route and its parameters onto which the Continue button directs to.
-->

<script lang="ts">
  import { Election } from '@openvaa/data';
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

  let elections: Array<Election>;
  /** Used to extend `constituencyId` param when continuing */
  let impliedConstituencies: { [electionId: Id]: Id } = {};
  let selected = ($selectedElections.length ? $selectedElections : $dataRoot.elections).map((e) => e.id);

  $: {
    elections = $dataRoot.elections;
    if ($appSettings.elections?.startFromConstituencyGroup && $selectedConstituencies.length) {
      const constituency = $selectedConstituencies[0];
      // Only show election for which a Constituency can be implied and save these for later
      elections = elections.filter((e) => {
        let constituencyId: Id | undefined;
        for (const group of e.constituencyGroups) {
          constituencyId = group.getImpliedConstituency(constituency)?.id;
          if (constituencyId) {
            impliedConstituencies[e.id] = constituencyId;
            return true;
          }
        }
        return false;
      });
    }
  }

  ////////////////////////////////////////////////////////////////////
  // Selecting elections and submitting
  ////////////////////////////////////////////////////////////////////

  // Submitting
  let canSubmit = false;
  $: canSubmit = selected?.length > 0;

  function handleSubmit(): void {
    if (!canSubmit) return;
    let route: string;
    // If we're using implied constituencies, we update the constituencyId param to include the implied constituencies for each selected election. We also need to filter elections because the initial selection may inlude elections later filtered out
    if ($appSettings.elections?.startFromConstituencyGroup) {
      route = $getRoute({
        route: 'Questions',
        electionId: selected.filter((id) => elections.map((e) => e.id).includes(id)),
        constituencyId: Object.entries(impliedConstituencies)
          .filter(([k]) => selected.includes(k))
          .map(([, v]) => v)
      });
    } else {
      route = $getRoute({ route: 'Constituencies', electionId: selected });
    }
    goto(route);
  }
</script>

<MainContent title={$t('elections.title')}>
  <figure role="presentation" slot="hero">
    <HeroEmoji emoji={$t('dynamic.elections.heroEmoji')} />
  </figure>

  <p class="text-center">
    {$t('dynamic.elections.ingress')}
  </p>

  <ElectionSelector {elections} bind:selected />

  <Button
    slot="primaryActions"
    on:click={handleSubmit}
    disabled={!canSubmit}
    variant="main"
    icon="next"
    text={$t('common.continue')} />
</MainContent>
