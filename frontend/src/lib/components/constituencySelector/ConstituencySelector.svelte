<!--@component

# Constituency selection component

Display constituency selection inputs for elections.

If any of the `ConstituencyGroup`s for the `Election`s are shared, only a single selectior will be shown for them. Also, if any `ConstituencyGroup`s are completely subsumed by another, only the selector for the child group will be shown and the selected parent will be implied.

### Properties

- `elections`: The `Election`s for which to show the `Constituency`s.
- `disableSorting`: If `true`, the `Constituency`s are not ordered alphabetically. Default `false`.
- `onShadedBg`: Set to `true` if using the component on a dark (`base-300`) background. @default false
- `selected`: Bindable value for the `Id`s of the selected `Constituency`s organized by `Election`.
- `selectionComplete`: A utility bindable value which is `true` when a selection has been made for each `Election`.
- `onChange`: Callback triggered when the selection changes.
- Any valid attributes of a `<div>` element.

### Usage

```tsx
<ConstituenctSelector
  elections={$dataRoot.elections} 
  bind:selected={$selectedConstituencies} 
  onChange={(sel) => console.info('Selected', sel)} />
```
-->

<script lang="ts">
  import { type Constituency, ConstituencyGroup, Election } from '@openvaa/data';
  import { error } from '@sveltejs/kit';
  import { getComponentContext } from '$lib/contexts/component';
  import { concatClass } from '$lib/utils/components';
  import { SingleGroupConstituencySelector } from '.';
  import type { Id } from '@openvaa/core';
  import type { ConstituencySelectorProps } from './ConstituencySelector.type';

  type $$Props = ConstituencySelectorProps;

  export let elections: $$Props['elections'];
  export let disableSorting: $$Props['disableSorting'] = undefined;
  export let onShadedBg: $$Props['onShadedBg'] = undefined;
  export let selected: NonNullable<$$Props['selected']> = {};
  export let selectionComplete: $$Props['selectionComplete'] = false;
  export let onChange: $$Props['onChange'] = undefined;

  ////////////////////////////////////////////////////////////////////
  // Get contexts
  ////////////////////////////////////////////////////////////////////

  const { t } = getComponentContext();

  ////////////////////////////////////////////////////////////////////
  // Combining elections
  ////////////////////////////////////////////////////////////////////

  /**
   * Holds the `id` of the selected `Constituency` for element in `combinedElections`.
   */
  let sectionSelected = new Array<Id>();
  /**
   * Holds the possibly combined elections in a standard format for displaying.
   */
  let sections = new Array<{
    applicableElections: Array<Election>;
    groups: Array<ConstituencyGroup>;
  }>();

  $: if (elections[0]?.root) buildSections(selected);

  /**
   * Wrap in a function to prevent undue reactivity. We only want this to run when elections or selected change.
   */
  function buildSections(selected: $$Props['selected']): void {
    sections = [];
    const root = elections[0].root;
    const allMaybeCombined = root.getCombinedElections(elections);
    for (let i = 0; i < allMaybeCombined.length; i++) {
      const maybeCombined = allMaybeCombined[i];
      // Parse maybeCombined and pre-select combined item
      if (maybeCombined instanceof Election) {
        sections.push({
          applicableElections: [maybeCombined],
          groups: maybeCombined.constituencyGroups
        });
        sectionSelected[i] = selected?.[maybeCombined.id] ?? '';
        continue;
      }
      if (maybeCombined?.type === 'combined') {
        const { elections, constituencyGroup } = maybeCombined;
        if (elections?.length && constituencyGroup) {
          sections.push({
            applicableElections: elections,
            groups: [constituencyGroup]
          });
          // If a constituency in this combined item is to be selected, it has to be one in the last, i.e., child election
          const childElection = elections[elections.length - 1];
          sectionSelected[i] = selected?.[childElection.id] ?? '';
          continue;
        }
      }
      error(500, `Invalid combined item: ${JSON.stringify(maybeCombined)}`);
    }
  }

  ////////////////////////////////////////////////////////////////////
  // Selecting constituencies
  ////////////////////////////////////////////////////////////////////

  function handleChange(): void {
    processSectionSelected();
    onChange?.({
      selected: selected ?? {},
      selectionComplete: !!selectionComplete
    });
  }

  /**
   * Sync `selected` with `sectionSelected`, using implied `Constituency`s if applicable.
   */
  function processSectionSelected(): void {
    for (let i = 0; i < sections.length; i++) {
      const { applicableElections, groups } = sections[i];
      const selectedId = sectionSelected[i];
      // If there is a selection, set it and those possibly implied by it
      if (selectedId) {
        // For multiple elections, we need to imply the constituency for each election. Note that getImpliedConstituency will return the constituency itself if its applicable
        if (applicableElections.length > 1) {
          const constituency = groups[0].root.getConstituency(selectedId);
          for (const election of applicableElections) {
            const impliedId = election.constituencyGroups[0].getImpliedConstituency(constituency)?.id;
            if (impliedId) selected[election.id] = impliedId;
            else
              error(500, `Constituency ${selectedId} should have implied a constituency for election ${election.id}!`);
          }
        } else {
          selected[applicableElections[0].id] = selectedId;
        }
        // No selection, reset all related elections
      } else {
        applicableElections.forEach((e) => (selected[e.id] = ''));
      }
    }
  }

  /**
   * Utility for getting a constituency by id
   */
  function getConstituency(id: Id): Constituency {
    return elections[0].root.getConstituency(id);
  }

  // The selection can be submitted when all elections have a constituency selected.
  $: selectionComplete = elections.length > 0 && elections.every(({ id }) => selected[id]);
</script>

{#if sections.length}
  <div {...concatClass($$restProps, 'mb-md grid gap-lg self-stretch')}>
    {#each sections as { applicableElections, groups }, sectionIndex}
      <div class="mt-md grid gap-md">
        <!-- Show an number in front of heading if multiple selections need be made -->
        {#if sections.length > 1}
          <h3 class="relative pl-[2rem]">
            <span class="circled" class:circled-on-shaded={onShadedBg}>{sectionIndex + 1}</span>
            {applicableElections
              .toReversed()
              .map((e) => e.name)
              .join($t('common.multipleAnswerSeparator'))}
          </h3>
        {/if}

        {#if groups.length > 1}
          <!-- Use a special list layout if the election has multiple constituency groups -->
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
                <SingleGroupConstituencySelector
                  {group}
                  {disableSorting}
                  {onShadedBg}
                  bind:selected={sectionSelected[sectionIndex]}
                  on:change={handleChange} />
              </div>
              {#if groupIndex < groups.length - 1}
                <div class="divider">{$t('common.or')}</div>
              {/if}
            {/each}
          </div>
        {:else}
          {@const group = groups[0]}
          <!-- Use a simple ayout if there is only one constituency group -->

          <SingleGroupConstituencySelector
            {group}
            {disableSorting}
            {onShadedBg}
            bind:selected={sectionSelected[sectionIndex]}
            onChange={handleChange} />

          <!-- If there are multiple applicable elections, show the implied constituency for each -->

          {#if applicableElections.length > 1}
            <div
              class="mt-xs grid w-full max-w-md grid-cols-2 items-center gap-x-md gap-y-sm place-self-center transition-opacity"
              class:faded={!sectionSelected[sectionIndex]}>
              {#each applicableElections.toReversed() as election}
                {@const constituencyId = selected[election.id]}
                <div class="small-label">{election.shortName}</div>
                <div>{constituencyId ? getConstituency(constituencyId).name : '—'}</div>
              {/each}
            </div>
          {/if}
        {/if}
      </div>
    {/each}
  </div>
{/if}
