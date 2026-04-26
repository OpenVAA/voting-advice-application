<!--@component

# Election selection page

Display an election selection input.

See `+page.ts` for possible redirects.

### Settings

- `elections.startFromConstituencyGroup`: If set, the elections shown for selection are dependent on the selected constituency. Also affects the route and its parameters onto which the Continue button directs to.
-->

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

  // Phase 61-03 voter-side parallel fix: read selectedConstituencies +
  // selectedElections via voterCtx.X (live $state) rather than destructured
  // snapshots. Stable stores/functions (appSettings, dataRoot, getRoute, t)
  // remain destructured.
  const voterCtx = getVoterContext();
  const { appSettings, dataRoot, getRoute, t } = voterCtx;

  ////////////////////////////////////////////////////////////////////
  // Initialize elections and possible implied constituencies
  ////////////////////////////////////////////////////////////////////

  let selected: Array<Id> = $state([]);

  let elections = $derived.by(() => {
    let result = $dataRoot.elections;
    if ($appSettings.elections?.startFromConstituencyGroup) {
      // Only show elections for which a Constituency is available.
      // `getApplicableConstituency` throws when more than one of the passed
      // constituencies maps to one of the election's groups (e.g. a municipality
      // and its parent region both end up in selectedConstituencies for an
      // election whose cgs include both Regions and Municipalities). Treat
      // that throw as "applicable" — the election clearly matches *something*
      // in the selection — so the multi-cg election still appears in the list
      // (variant-startfromcg.spec.ts:145 hierarchy edge case).
      result = result.filter((e) => {
        try {
          return !!e.getApplicableConstituency(voterCtx.selectedConstituencies);
        } catch {
          return true;
        }
      });
    }
    return result;
  });

  $effect(() => {
    selected = (voterCtx.selectedElections.length ? voterCtx.selectedElections : elections).map((e) => e.id);
  });

  ////////////////////////////////////////////////////////////////////
  // Selecting elections and submitting
  ////////////////////////////////////////////////////////////////////

  let canSubmit = $derived(selected?.length > 0);

  // Async + awaited so the click handler reports navigation errors instead of
  // swallowing them. Prior implementation `function handleSubmit(): void`
  // discarded the goto() promise — when SvelteKit's client-side navigation
  // raced with a $effect (e.g. a stores' `.set()` triggered on first click
  // hydration) goto() resolved to undefined and the URL never changed
  // (multi-election.spec.ts:173 documents the same flake). The Array.from
  // copy decouples the URL builder from the $state proxy on `selected` so
  // qs.stringify sees a plain array.
  async function handleSubmit(): Promise<void> {
    if (!canSubmit) return;
    const electionId = Array.from(selected);
    await goto(
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
