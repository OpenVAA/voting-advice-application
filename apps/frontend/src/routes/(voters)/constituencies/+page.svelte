<!--@component

# Constituency selection page

Display constituency selection inputs.

See `+page.ts` for possible redirects.

### Settings

- `elections.startFromConstituencyGroup`: If set, only this `ConstituencyGroup` will be displayed for selection. Also affects the route onto which the Continue button directs to.
-->

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

  // Phase 61-03 voter-side parallel fix: read selectedConstituencies +
  // selectedElections via voterCtx.X (live $state) rather than destructured
  // snapshots. This was the originating bug per the user investigation —
  // destructuring captured an empty `selectedElections` on cold deeplink.
  const voterCtx = getVoterContext();
  const { appSettings, dataRoot, getRoute, t } = voterCtx;

  ////////////////////////////////////////////////////////////////////
  // Set initial values
  ////////////////////////////////////////////////////////////////////

  /** The selected `constituencyIds` per election */
  let selected = $state<{ [electionId: Id]: Id }>({});

  // `useSingleGroup` MUST be `$derived` AND must safely handle the
  // dataRoot-not-yet-populated state. The original `const` shape captured
  // the empty `getConstituencyGroup(...)` lookup at module init when the
  // root layout's `$effect` had not yet provided constituency data; even
  // making it `$derived` is not enough because `getConstituencyGroup`
  // throws when the id is missing — a synchronous throw in a `$derived`
  // surfaces as a page error and freezes the page on its initial empty
  // template (variant-startfromcg.spec.ts:115 hydration race).
  const useSingleGroup = $derived.by(() => {
    const id = $appSettings.elections?.startFromConstituencyGroup;
    if (!id) return undefined;
    return $dataRoot.constituencyGroups.find((g) => g.id === id);
  });

  let elections = $derived(useSingleGroup ? $dataRoot.elections : voterCtx.selectedElections);

  $effect(() => {
    if (voterCtx.selectedConstituencies.length) {
      for (const election of elections) {
        const constituency = election.getApplicableConstituency(voterCtx.selectedConstituencies);
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

  async function handleSubmit(): Promise<void> {
    if (!canSubmit) return;
    const constituencyId = Object.values(selected).filter((id) => id);
    await goto(
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
