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
  import { MainContent } from '$layouts/main';
  import { Button } from '$lib/components/button';
  import { ConstituencySelector } from '$lib/components/constituencySelector';
  import { HeroEmoji } from '$lib/components/heroEmoji';
  import { getVoterContext } from '$lib/contexts/voter';
  import { isVoterAppPath, mostSpecificConstituency, parseParams, usesSingleConstituencyGroup } from '$lib/routes';
  import { filterPersistent } from '$lib/routes/filterPersistent';
  import type { Id } from '@openvaa/core';

  ////////////////////////////////////////////////////////////////////
  // Get contexts
  ////////////////////////////////////////////////////////////////////

  // Read selectedConstituencies + selectedElections via voterCtx.X (live $state) rather than as destructured snapshots: destructuring captures an empty `selectedElections` on a cold deeplink and never updates.
  const voterCtx = getVoterContext();
  const { getRoute, t } = voterCtx;
  // appSettings/dataRoot are reactive accessors — read via voterCtx.X, never destructure.
  const appSettings = $derived(voterCtx.appSettings);
  // dataRoot is identity-stable (#version-bridge): NEVER bind it to an intermediate $derived alias and read through the alias — the alias yields the same DataRoot ref on each #version bump, so Svelte 5 skips downstream notification and the cold/direct-URL snapshot stays empty. Read `voterCtx.dataRoot.<prop>` directly inside each consuming tracking scope. See CLAUDE.md "Context Destructuring Rule" and the stable-reference alias anti-pattern.

  ////////////////////////////////////////////////////////////////////
  // Set initial values
  ////////////////////////////////////////////////////////////////////

  /** The selected `constituencyIds` per election */
  let selected = $state<{ [electionId: Id]: Id }>({});

  // `useSingleGroup` must be `$derived`, and its lookup must not throw: the constituency data may not be provided yet when this is first read, and a throw in a `$derived` surfaces as a page error.
  const useSingleGroup = $derived(
    usesSingleConstituencyGroup({ appSettings, constituencyGroups: voterCtx.dataRoot.constituencyGroups })
  );

  let elections = $derived(useSingleGroup ? voterCtx.dataRoot.elections : voterCtx.selectedElections);

  // Pre-fill `selected` from the voter context's current constituency choices (e.g., on back-navigation from /questions). Several of them may be applicable to one election: two elections may share a constituency group for which a different member was selected for each, and a constituency may be selected together with its parent. `mostSpecificConstituency` picks one of them per election and does not throw for such a selection.
  $effect(() => {
    if (!voterCtx.selectedConstituencies.length) return;
    for (const election of elections) {
      const best = mostSpecificConstituency({ election, constituencies: voterCtx.selectedConstituencies });
      if (best) selected[election.id] = best.id;
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
    // Dedupe: when two elections share a constituency group and the selector linked their picks (ConstituencySelector cross-section propagation), `selected` carries the same id under multiple election keys. The URL contract is a set, not a per-election map, so collapse.
    const constituencyId = Array.from(new Set(Object.values(selected).filter((id) => id)));
    // Deferred-target handling: if a `?next=` target is set, decode it, re-validate it against the Voter App path allowlist and navigate to it. The `(located)/+layout.ts` entry point already filtered it, but a fresh load of `/constituencies?next=...` bypasses that gate, so this layer re-validates before calling goto() to prevent an open redirect.
    const next = page.url.searchParams.get('next');
    if (next) {
      const decoded = decodeURIComponent(next);
      if (isVoterAppPath(decoded)) {
        // The persistent search params of this page's address, the elections among them, and the constituencies just picked are appended to the deferred target. The target's own address carries neither, and the address is the only place the selection is kept: this page writes nothing back to the voter context, so `(located)/+layout.ts` would find no election and send the voter to the election selection again. The query params the deferred target already carries, such as `entityType`, are kept.
        const target = new URL(decoded, page.url.origin);
        const persistent = filterPersistent(parseParams({ url: page.url }));
        const targetParams = qs.parse(target.search.replace(/^\?/g, ''));
        const merged = qs.stringify({ ...persistent, ...targetParams, constituencyId }, { encodeValuesOnly: true });
        await goto(`${target.pathname}${merged ? `?${merged}` : ''}`);
        return;
      }
      // Fall through to default navigation when whitelist rejects the value.
    }
    await goto(
      appSettings.elections?.startFromConstituencyGroup
        ? // Reset any lingering electionIds which may have been left in the search param if a different constituency was seleced before
          getRoute.current({ route: 'Elections', constituencyId, electionId: undefined })
        : getRoute.current({ route: 'Questions', constituencyId })
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
