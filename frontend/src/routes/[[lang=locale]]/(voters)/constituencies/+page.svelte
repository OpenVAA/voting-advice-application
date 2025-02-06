<!--@component

# Constituency selection page

Display constituency selection inputs for all selected elections.

See `+page.ts` for possible redirects.
-->

<script lang="ts">
  import { goto } from '$app/navigation';
  import { Button } from '$lib/components/button';
  import { ConstituencySelector } from '$lib/components/constituencySelector';
  import { HeroEmoji } from '$lib/components/heroEmoji';
  import { getVoterContext } from '$lib/contexts/voter';
  import MainContent from '../../MainContent.svelte';
  import type { Id } from '@openvaa/core';

  ////////////////////////////////////////////////////////////////////
  // Get contexts
  ////////////////////////////////////////////////////////////////////

  const { getRoute, selectedElections: elections, t } = getVoterContext();

  ////////////////////////////////////////////////////////////////////
  // Selecting constituencies and submitting
  ////////////////////////////////////////////////////////////////////

  /** The selected constituencyIds per election */
  let selected: {
    [electionId: Id]: Id;
  } = {};

  // The selection can be submitted when all elections have a constituency selected.
  let canSubmit = false;

  function handleSubmit(): void {
    if (!canSubmit) return;
    goto($getRoute({ route: 'Questions', constituencyId: Object.values(selected) }));
  }
</script>

<MainContent title={$t('constituencies.title')}>
  <figure role="presentation" slot="hero">
    <HeroEmoji emoji={$t('dynamic.constituencies.heroEmoji')} />
  </figure>

  <p class="text-center">
    {$t(
      $elections.length > 1
        ? 'dynamic.constituencies.ingressMultipleElections'
        : 'dynamic.constituencies.ingressSingleElection'
    )}
  </p>

  <ConstituencySelector
    elections={$elections}
    bind:selected
    bind:selectionComplete={canSubmit}/>

  <Button
    slot="primaryActions"
    on:click={handleSubmit}
    disabled={!canSubmit}
    variant="main"
    icon="next"
    text={$t('common.continue')} />
</MainContent>
