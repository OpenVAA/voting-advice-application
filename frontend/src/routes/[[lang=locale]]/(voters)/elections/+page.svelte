<!--@component

# Election selection page

Display constituency selection inputs for all selected elections.

See `+page.ts` for possible redirects.
-->

<script lang="ts">
  import { goto } from '$app/navigation';
  import { Button } from '$lib/components/button';
  import { HeroEmoji } from '$lib/components/heroEmoji';
  import { getVoterContext } from '$lib/contexts/voter';
  import Layout from '../../Layout.svelte';

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

<Layout title={$t('elections.title')}>
  <figure role="presentation" slot="hero">
    <HeroEmoji emoji={$t('dynamic.elections.heroEmoji')} />
  </figure>

  <p class="text-center">
    {$t('dynamic.elections.ingress')}
  </p>

  <div class="grid gap-sm">
    {#each $dataRoot.elections as { id, name }}
      <label class="label cursor-pointer justify-start gap-sm !p-0">
        <input type="checkbox" class="checkbox" name="selected-elections" value={id} bind:group={selected} />
        <span class="label-text">{name}</span>
      </label>
    {/each}
  </div>

  <Button
    slot="primaryActions"
    on:click={handleSubmit}
    disabled={!canSubmit}
    variant="main"
    icon="next"
    text={$t('common.continue')} />
</Layout>
