<!--@component

# Multiple constituency selection component

Display, for each election, the constituencies to select from, each with a checkbox, so that several constituencies can be selected in one election. Use it where one entity stands in several constituencies of an election, as a party does; `ConstituencySelector` selects one constituency in each election.

- Each election has a section of its own, headed by the election's name when there are several. In it each constituency group of the election is a group of checkboxes, labelled by a prompt that names the group.
- The selection is one list of constituencies: a constituency that two elections share is selected in both sections at once.
- With `useSingleGroup` the one group is offered as one list for every election.

### Properties

- `elections`: The `Election`s for which to show the `Constituency`s.
- `disableSorting`: If `true`, the `Constituency`s are not ordered alphabetically. Default: `false`
- `onShadedBg`: Set to `true` if using the component on a dark (`base-300`) background. Default: `false`
- `selected`: Bindable value for the `Id`s of the selected `Constituency`s, each once.
- `useSingleGroup`: If specified, only this group is offered for selection, as one list for every `Election`. To be used when the `elections.startFromConstituencyGroup` setting is set.
- `selectionComplete`: A utility bindable value which is `true` when at least one `Constituency` is selected for each `Election`, or in the single group if `useSingleGroup` is set.
- `onChange`: Callback triggered when the selection changes.
- Any valid attributes of a `<div>` element

### Accessibility

- Each group of checkboxes is a `<fieldset>` whose `<legend>` names the constituency group.

### Usage

```tsx
<MultiConstituencySelector
  elections={ctx.dataRoot.elections}
  bind:selected
  bind:selectionComplete
  onChange={(sel) => console.info('Selected', sel)} />
```
-->

<script lang="ts">
  import { getComponentContext } from '$lib/contexts/component';
  import { concatClass } from '$lib/utils/components';
  import type { Id } from '@openvaa/core';
  import type { Constituency, ConstituencyGroup, Election } from '@openvaa/data';
  import type { MultiConstituencySelectorProps } from './MultiConstituencySelector.type';

  let {
    elections,
    disableSorting,
    onShadedBg,
    selected = $bindable([]),
    useSingleGroup,
    // eslint-disable-next-line no-useless-assignment -- false positive on write-only $bindable prop; remove when https://github.com/sveltejs/eslint-plugin-svelte/issues/1478 is fixed
    selectionComplete = $bindable(false),
    onChange,
    ...restProps
  }: MultiConstituencySelectorProps = $props();

  ////////////////////////////////////////////////////////////////////
  // Get contexts
  ////////////////////////////////////////////////////////////////////

  // `locale` is the i18n plain-string locale of the ComponentContext, read off `ctx` where the constituencies are sorted.
  const ctx = getComponentContext();
  const { t } = ctx;

  ////////////////////////////////////////////////////////////////////
  // Sections
  ////////////////////////////////////////////////////////////////////

  type Section = {
    applicableElections: Array<Election>;
    groups: Array<ConstituencyGroup>;
  };

  /** One section for each election, or one for every election over the single group. */
  const sections = $derived<Array<Section>>(
    useSingleGroup
      ? [{ applicableElections: elections, groups: [useSingleGroup] }]
      : elections.map((election) => ({ applicableElections: [election], groups: election.constituencyGroups }))
  );

  // The selection is complete when every section has a constituency of its groups selected.
  $effect(() => {
    selectionComplete = sections.length > 0 && sections.every((section) => hasSelection(section, selected));
  });

  /**
   * Whether a constituency of the section's groups is among those selected.
   */
  function hasSelection({ groups }: Section, ids: Array<Id>): boolean {
    return groups.some((group) => group.data.constituencyIds.some((id) => ids.includes(id)));
  }

  ////////////////////////////////////////////////////////////////////
  // Selecting constituencies
  ////////////////////////////////////////////////////////////////////

  function handleChange(id: Id, checked: boolean): void {
    selected = checked ? [...selected.filter((other) => other !== id), id] : selected.filter((other) => other !== id);
    onChange?.({
      selected,
      selectionComplete: sections.every((section) => hasSelection(section, selected))
    });
  }

  function sort(constituencies: Array<Constituency>): Array<Constituency> {
    return disableSorting
      ? constituencies
      : [...constituencies].sort((a, b) => a.name.localeCompare(b.name, ctx.locale));
  }
</script>

{#if sections.length}
  <div data-testid="multi-constituency-selector" {...concatClass(restProps, 'mb-md grid gap-lg self-stretch')}>
    {#each sections as { applicableElections, groups }, sectionIndex}
      <div class="mt-md gap-md grid" data-testid="multi-constituency-selector-section">
        {#if sections.length > 1}
          <h3 class="relative pl-[2rem]">
            <span class="circled" class:circled-on-shaded={onShadedBg}>{sectionIndex + 1}</span>
            {applicableElections
              .toReversed()
              .map((e) => e.name)
              .join(t('common.multipleAnswerSeparator'))}
          </h3>
        {/if}
        {#each groups as group}
          <fieldset class="gap-sm grid">
            <legend class="mb-sm font-bold">
              {t('components.constituencySelector.selectPrompt', { constituencyGroup: group.name })}
            </legend>
            {#if group.info}
              <p class="m-0">{group.info}</p>
            {/if}
            {#each sort(group.constituencies) as constituency (constituency.id)}
              <label class="label gap-sm cursor-pointer justify-start !p-0">
                <input
                  type="checkbox"
                  class="checkbox"
                  value={constituency.id}
                  checked={selected.includes(constituency.id)}
                  onchange={(event) => handleChange(constituency.id, event.currentTarget.checked)}
                  data-testid="multi-constituency-selector-option" />
                <span>{constituency.name}</span>
              </label>
            {/each}
          </fieldset>
        {/each}
      </div>
    {/each}
  </div>
{/if}
