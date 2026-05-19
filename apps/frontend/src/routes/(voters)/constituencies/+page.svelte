<!--@component

# Constituency selection page

Display constituency selection inputs.

See `+page.ts` for possible redirects.

### Settings

- `elections.startFromConstituencyGroup`: If set, only this `ConstituencyGroup` will be displayed for selection. Also affects the route onto which the Continue button directs to.
-->

<script lang="ts">
  import qs from 'qs';
  import { goto } from '$app/navigation';
  import { page } from '$app/state';
  import { Button } from '$lib/components/button';
  import { ConstituencySelector } from '$lib/components/constituencySelector';
  import { HeroEmoji } from '$lib/components/heroEmoji';
  import { getVoterContext } from '$lib/contexts/voter';
  import { filterPersistent } from '$lib/utils/route/filterPersistent';
  import { parseParams } from '$lib/utils/route/parseParams';
  import MainContent from '../../MainContent.svelte';
  import type { Id } from '@openvaa/core';
  
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

  // Pre-fill `selected` from the voter context's current constituency choices
  // (e.g., on back-navigation from /questions). The previous implementation
  // delegated to `Election.getApplicableConstituency`, which THROWS when more
  // than one constituency in the array matches the election — a state that
  // surfaces whenever two elections share a constituency group but the user
  // has previously selected different members of that group for each. The
  // resulting `DataTypeError: More than one constituency matches the
  // election` propagated out of the $effect and broke the constituency page.
  //
  // Instead, iterate per-election and pick the MOST SPECIFIC applicable
  // constituency — the one whose enclosing group has the fewest members
  // (i.e., the leaf in the hierarchy). For a Regions-or-Municipalities
  // election, that's the municipality the voter chose; the region implication
  // is reconstructed from the municipality via the hierarchy at evaluation
  // time. Ties fall back to first-match deterministically.
  $effect(() => {
    if (!voterCtx.selectedConstituencies.length) return;
    for (const election of elections) {
      const matches = voterCtx.selectedConstituencies.filter((c) =>
        election.constituencyGroups.some((g) => g.data.constituencyIds.includes(c.id))
      );
      if (!matches.length) continue;
      const best = matches.reduce((a, b) => {
        const aSize =
          election.constituencyGroups.find((g) => g.data.constituencyIds.includes(a.id))?.constituencies.length ?? Infinity;
        const bSize =
          election.constituencyGroups.find((g) => g.data.constituencyIds.includes(b.id))?.constituencies.length ?? Infinity;
        return bSize < aSize ? b : a;
      });
      selected[election.id] = best.id;
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
    // Dedupe: when two elections share a constituency group and the
    // selector linked their picks (ConstituencySelector cross-section
    // propagation), `selected` carries the same id under multiple election
    // keys. The URL contract is a set, not a per-election map, so collapse.
    const constituencyId = Array.from(new Set(Object.values(selected).filter((id) => id)));
    // CLEAN-02 (Phase 78 Plan 02): if a deferred-target `?next=` is set,
    // decode + re-validate against the voter-app URL whitelist regex and
    // navigate to the original destination. Whitelist re-check is a
    // defense-in-depth pass — the (located)/+layout.ts entry-point check
    // already filtered open-redirect targets, but a fresh page load of
    // `/constituencies?next=...` bypasses that gate, so this layer must
    // re-validate before calling goto().
    //
    // reason: voter-app whitelist re-check — prevents open-redirect at
    // selector-consumption layer (defense in depth vs CLEAN-02
    // (located)/+layout.ts entry-point check).
    const VOTER_ROUTE_WHITELIST = /^\/[a-z]{2}\/.*|^\/(results|questions|nominations)\b/;
    const next = page.url.searchParams.get('next');
    if (next) {
      const decoded = decodeURIComponent(next);
      if (VOTER_ROUTE_WHITELIST.test(decoded)) {
        // Append the just-picked electionId + constituencyId to the deferred
        // target before goto. Without this, `goto(decoded)` lands on a raw
        // `/results` URL with neither id present; (located)/+layout.ts then
        // sees no electionId in URL OR voter-context state (the constituency
        // page never writes back to voterCtx — the URL is the only
        // persistence) and bounces the voter back through /elections,
        // looping CLEAN-02 test 1. Preserve any query params the original
        // deferred target already carried (e.g., `?entityType=candidates`
        // in CLEAN-02 test 2 — the test asserts that param survives the
        // round-trip).
        const target = new URL(decoded, page.url.origin);
        const persistent = filterPersistent(parseParams({ url: page.url }));
        const targetParams = qs.parse(target.search.replace(/^\?/g, ''));
        const merged = qs.stringify(
          { ...persistent, ...targetParams, constituencyId },
          { encodeValuesOnly: true }
        );
        await goto(`${target.pathname}${merged ? `?${merged}` : ''}`);
        return;
      }
      // Fall through to default navigation when whitelist rejects the value.
    }
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
