<!--@component

# Election selection page

Display constituency selection inputs for all selected elections.

See `+page.ts` for possible redirects.
-->

<script lang="ts">
  import { goto } from '$app/navigation';
  import { Button } from '$lib/components/button';
  import { ElectionSelector } from '$lib/components/electionSelector';
  import { HeroEmoji } from '$lib/components/heroEmoji';
  import { getVoterContext } from '$lib/contexts/voter';
  import MainContent from '../../MainContent.svelte';

  ////////////////////////////////////////////////////////////////////
  // Get contexts
  ////////////////////////////////////////////////////////////////////

  const { dataRoot, getRoute, selectedElections, t } = getVoterContext();

  ////////////////////////////////////////////////////////////////////
  // Selecting elections and submitting
  ////////////////////////////////////////////////////////////////////

  let selected = ($selectedElections.length ? $selectedElections : $dataRoot.elections).map((e) => e.id);

  // Submitting
  let canSubmit = false;
  $: canSubmit = selected?.length > 0;

  function handleSubmit(): void {
    if (!canSubmit) return;
    goto($getRoute({ route: 'Constituencies', electionId: selected }));
  }
</script>

<MainContent title={$t('elections.title')}>
  <figure role="presentation" slot="hero">
    <HeroEmoji emoji={$t('dynamic.elections.heroEmoji')} />
  </figure>

  <p class="text-center">
    {$t('dynamic.elections.ingress')}
  </p>

  <ElectionSelector elections={$dataRoot.elections} bind:selected on:change={console.error} />

  <Button
    slot="primaryActions"
    on:click={handleSubmit}
    disabled={!canSubmit}
    variant="main"
    icon="next"
    text={$t('common.continue')} />
</MainContent>
