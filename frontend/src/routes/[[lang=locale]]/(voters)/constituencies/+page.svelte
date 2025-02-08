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
  import { ConstituencySelector, SingleGroupConstituencySelector } from '$lib/components/constituencySelector';
  import { HeroEmoji } from '$lib/components/heroEmoji';
  import { getVoterContext } from '$lib/contexts/voter';
  import MainContent from '../../MainContent.svelte';
  import type { Id } from '@openvaa/core';

  ////////////////////////////////////////////////////////////////////
  // Get contexts
  ////////////////////////////////////////////////////////////////////

  const { appSettings, dataRoot, getRoute, selectedElections: elections, t } = getVoterContext();

  ////////////////////////////////////////////////////////////////////
  // Selecting constituencies and submitting
  ////////////////////////////////////////////////////////////////////

  /** Set by `ConstituencySelector` */
  let allSelected = false;
  let canSubmit = false;
  /** The selected `constituencyIds` per election */
  let selected: {
    [electionId: Id]: Id;
  } = {};
  /** When `startFromConstituencyGroup` is set */
  let singleSelected: Id = '';

  $: canSubmit = $appSettings.elections?.startFromConstituencyGroup ? !!singleSelected : allSelected;

  function handleSubmit(): void {
    if (!canSubmit) return;
    goto(
      $appSettings.elections?.startFromConstituencyGroup
        ? $getRoute({ route: 'Elections', constituencyId: singleSelected })
        : $getRoute({ route: 'Questions', constituencyId: Object.values(selected) })
    );
  }
</script>

<MainContent title={$t('constituencies.title')}>
  <figure role="presentation" slot="hero">
    <HeroEmoji emoji={$t('dynamic.constituencies.heroEmoji')} />
  </figure>

  <p class="text-center">
    {$appSettings.elections?.startFromConstituencyGroup
      ? $t('dynamic.constituencies.ingress.singleGroup')
      : $elections.length > 1
        ? $t('dynamic.constituencies.ingress.multipleElections')
        : $t('dynamic.constituencies.ingress.singleElection')}
  </p>

  {#if $appSettings.elections?.startFromConstituencyGroup}
    <SingleGroupConstituencySelector
      group={$dataRoot.getConstituencyGroup($appSettings.elections.startFromConstituencyGroup)}
      bind:selected={singleSelected} />
  {:else}
    <ConstituencySelector elections={$elections} bind:selected bind:selectionComplete={allSelected} />
  {/if}

  <Button
    slot="primaryActions"
    on:click={handleSubmit}
    disabled={!canSubmit}
    variant="main"
    icon="next"
    text={$t('common.continue')} />
</MainContent>
