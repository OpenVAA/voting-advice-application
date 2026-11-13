<!--@component

# Election selection page

Display an election selection input.

See `+page.ts` for possible redirects.

### Settings

- `elections.startFromConstituencyGroup`: If set, the elections shown for selection are dependent on the selected constituency. Also affects the route and its parameters onto which the Continue button directs to.
-->

<script lang="ts">
  import { goto } from '$app/navigation';
  import { page } from '$app/state';
  import { MainContent } from '$layouts/main';
  import { Button } from '$lib/components/button';
  import { ElectionSelector } from '$lib/components/electionSelector';
  import { HeroEmoji } from '$lib/components/heroEmoji';
  import { getVoterContext } from '$lib/contexts/voter';
  import { electionsHeldIn } from '$lib/routes';
  import type { Id } from '@openvaa/core';

  ////////////////////////////////////////////////////////////////////
  // Get contexts
  ////////////////////////////////////////////////////////////////////

  // Read selectedConstituencies + selectedElections via voterCtx.X (live $state) rather than as destructured snapshots, which never update. Genuinely stable members (getRoute, t) remain destructured.
  const voterCtx = getVoterContext();
  const { getRoute, t } = voterCtx;
  // appSettings/dataRoot are reactive accessors — read via voterCtx.X, never destructure.
  const appSettings = $derived(voterCtx.appSettings);

  ////////////////////////////////////////////////////////////////////
  // Initialize elections and possible implied constituencies
  ////////////////////////////////////////////////////////////////////

  let selected: Array<Id> = $state([]);

  // If `startFromConstituencyGroup` is set, only the elections held in the selected constituencies are shown.
  let elections = $derived(
    appSettings.elections?.startFromConstituencyGroup
      ? electionsHeldIn({ elections: voterCtx.dataRoot.elections, constituencies: voterCtx.selectedConstituencies })
      : voterCtx.dataRoot.elections
  );

  $effect(() => {
    selected = (voterCtx.selectedElections.length ? voterCtx.selectedElections : elections).map((e) => e.id);
  });

  ////////////////////////////////////////////////////////////////////
  // Selecting elections and submitting
  ////////////////////////////////////////////////////////////////////

  let canSubmit = $derived(selected?.length > 0);

  // The navigation is awaited, so that an error of it reaches the click handler and the handler does not return before the address has changed. The `Array.from` copy hands the route builder a plain array and not the `$state` proxy on `selected`.
  async function handleSubmit(): Promise<void> {
    if (!canSubmit) return;
    const electionId = Array.from(selected);
    // Deferred-target handling: forward the `?next=` target parameter through to the constituency selector so the final selector step can resume the originally-requested route. `next` is NOT a persistent search param (see params.ts PERSISTENT_SEARCH_PARAMS), so buildRoute drops it unless we pass it explicitly. No whitelist re-check here — the entry-point check in `(located)/+layout.ts` already filtered before this point.
    const next = page.url.searchParams.get('next');
    const nextForward: { next?: string } = next ? { next } : {};
    await goto(
      appSettings.elections?.startFromConstituencyGroup
        ? getRoute.current({ route: 'Questions', electionId, ...nextForward })
        : // Reset any lingering electionIds which may have been left in the search param if a different constituency was seleced before
          getRoute.current({ route: 'Constituencies', electionId, constituencyId: undefined, ...nextForward })
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
