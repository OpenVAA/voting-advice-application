<!--@component

# Constituency selection page

Display constituency selection inputs for all selected elections.

See `+page.ts` for possible redirects.
-->

<script lang="ts">
  import { goto } from '$app/navigation';
  import { Button } from '$lib/components/button';
  import { HeroEmoji } from '$lib/components/heroEmoji';
  import { getVoterContext } from '$lib/contexts/voter';
  import Layout from '../../../Layout.svelte';
  import type { Id } from '@openvaa/core';

  ////////////////////////////////////////////////////////////////////
  // Get contexts
  ////////////////////////////////////////////////////////////////////

  const { getRoute, selectedElections: elections, t } = getVoterContext();

  ////////////////////////////////////////////////////////////////////
  // Selecting constituencies and submitting
  ////////////////////////////////////////////////////////////////////

  /** The selected constituencyIds per election */
  const selected: {
    [electionId: Id]: Id;
  } = {};

  // The selection can be submitted when all elections have a constituency selected.
  let canSubmit = false;
  $: canSubmit = $elections.length > 0 && $elections.every(({ id }) => selected[id]);

  function handleSubmit(): void {
    if (!canSubmit) return;
    goto($getRoute({ route: 'Questions', constituencyId: Object.values(selected) }));
  }
</script>

<Layout title={$t('constituencies.title')}>
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

  <div class="mb-md grid gap-lg self-stretch">
    {#each $elections as election, electionIndex}
      {@const groups = election.constituencyGroups}
      <div class="mt-md grid gap-md">
        {#if $elections.length > 1}
          <h3 class="relative pl-[2rem]">
            <span class="circled">{electionIndex + 1}</span>
            {election.shortName}
          </h3>
        {/if}
        <!-- Use a special list layout if the election has multiple constituency groups -->
        {#if groups.length > 1}
          <div>
            <p class="text-secondary">
              {$t('constituencies.multipleGroupsInfo')}
            </p>
            {#each groups as group, groupIndex}
              <div class="mb-lg grid gap-sm">
                {#if group.name}
                  <h4>{group.name}</h4>
                {/if}
                {#if group.info}
                  <p class="m-0">{group.info}</p>
                {/if}
                <select class="select w-full max-w-md place-self-center" bind:value={selected[election.id]}>
                  <option disabled selected value="">
                    {$t('constituencies.selectPrompt')}
                  </option>
                  {#each group.constituencies as { id, name }}
                    <option value={id}>{name}</option>
                  {/each}
                </select>
              </div>
              {#if groupIndex < groups.length - 1}
                <div class="divider">{$t('common.or')}</div>
              {/if}
            {/each}
          </div>
          <!-- Use a simple ayout if there is only one constituency group -->
        {:else}
          <select class="select w-full max-w-md place-self-center" bind:value={selected[election.id]}>
            <option disabled selected value="">{$t('constituencies.selectPrompt')}</option>
            {#each groups[0].constituencies as { id, name }}
              <option value={id}>{name}</option>
            {/each}
          </select>
        {/if}
      </div>
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
