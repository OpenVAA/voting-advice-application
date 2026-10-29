<!--@component

# Contestant app nomination editor: the election step

Asks which elections the entity the user edits stands in. The address of this step is also the editor's entry: see `+page.ts` for the redirects that pass the step over.

- **What is listed**: the elections that admit the entity's type, in the order the application lists elections. While a constituency group is chosen first, only those of them held in the constituencies the address names.
- **What is checked on arrival**: the elections the address names; where it names none, the elections the entity is nominated in; and none for an entity with no nomination. An entity is never put into an election it did not choose.
- **Unchecking the election of a stored nomination** removes nothing: the nomination keeps its card on the details step, where the card says that it is about to be removed and can be kept.
- **Continue** is enabled once an election is checked. While none is, a sentence under the group says that one must be selected, and the button is described by it. Continue leads to the constituency step, or to the details step when nothing is left to choose there, and passes the chosen elections on in the address. An election in which the entity holds several nominations has no constituency to choose.
- **Cancel** leads to the nominations view.
- **While the elections are not on the page**, which is the case in the server-rendered markup, a loading indicator stands in the list's place and Continue is in its loading form. No shorter list and no sentence is shown meanwhile, so a list that is shown is one a user can operate.

Nothing is written on this step.

Everything that differs between entity types is read from the descriptor of the selected entity's type.

### Settings

- `elections.startFromConstituencyGroup`: Whether the constituency is chosen before the election. The elections listed are then those held in the chosen constituencies, and Continue leads to the details step.

### Accessibility

- The checkboxes are a group named by the page's title, and each checkbox is named by its election.
- The sentence under the group is the description of Continue while Continue is disabled.
-->

<script lang="ts">
  import { goto } from '$app/navigation';
  import { MainContent } from '$layouts/main';
  import { Button } from '$lib/components/button';
  import { ElectionSelector } from '$lib/components/electionSelector';
  import { Loading } from '$lib/components/loading';
  import { admissibleElectionsOf } from '$lib/contestant/nominations';
  import { entityDescriptorOf } from '$lib/contestant/utils/entityDescriptor';
  import { getContestantContext } from '$lib/contexts/contestant';
  import { electionsHeldIn } from '$lib/routes';
  import {
    afterElections,
    constituenciesOf,
    EDITOR_STEP_ROUTE,
    reachedNominationsOf,
    selectionSearch
  } from '../stepSelection';
  import type { Id } from '@openvaa/core';
  import type { PageData } from './$types';

  let { data }: { data: PageData } = $props();

  ////////////////////////////////////////////////////////////////////
  // Get contexts
  ////////////////////////////////////////////////////////////////////

  // appSettings, dataRoot, nominations and selectedEntity are reactive accessors: read via contestantCtx.X inside the tracking scope, never destructured, and dataRoot never through an alias.
  const contestantCtx = getContestantContext();
  const { getRoute, t } = contestantCtx;

  ////////////////////////////////////////////////////////////////////
  // The elections
  ////////////////////////////////////////////////////////////////////

  /** The id of the sentence that describes Continue while no election is checked. */
  const HINT_ID = 'contestant-nomination-elections-hint';

  /** Everything that differs by entity type. */
  const descriptor = $derived(entityDescriptorOf(contestantCtx.selectedEntity?.type));

  /** Whether the elections are on the page. They are not in the server-rendered markup. */
  const ready = $derived(contestantCtx.dataRoot.elections.length > 0);

  /** The elections that admit the entity's type, in the order the application lists elections. */
  const admissible = $derived.by(() => {
    const entityType = contestantCtx.selectedEntity?.type;
    return entityType ? admissibleElectionsOf(contestantCtx.dataRoot.elections, entityType) : [];
  });

  /** The elections listed: while a constituency group is chosen first, those held in the constituencies the address names. */
  const elections = $derived(
    contestantCtx.appSettings.elections?.startFromConstituencyGroup
      ? electionsHeldIn({
          elections: admissible,
          constituencies: constituenciesOf(contestantCtx.dataRoot, data.nominationSelection.constituencyIds)
        })
      : admissible
  );

  /** The ids of the checked elections, as the checkboxes hold them. */
  let selected = $state<Array<Id>>(electionsOfAddress());

  /** The checked elections that are listed, in the order of the list. */
  const chosen = $derived(
    elections.filter((election) => selected.includes(election.id)).map((election) => election.id)
  );

  const canSubmit = $derived(ready && chosen.length > 0);

  /**
   * The elections checked on arrival: those the step's load answers for its address and the entity's nominations.
   */
  function electionsOfAddress(): Array<Id> {
    return [...data.nominationSelection.electionIds];
  }

  ////////////////////////////////////////////////////////////////////
  // Continuing
  ////////////////////////////////////////////////////////////////////

  /**
   * Go on to the step that follows for the elections chosen, with the selection in the address. Nothing is written.
   */
  async function handleSubmit(): Promise<void> {
    if (!canSubmit) return;
    const forward = afterElections({
      appSettings: contestantCtx.appSettings,
      dataRoot: contestantCtx.dataRoot,
      admissible,
      nominations: reachedNominationsOf(contestantCtx.nominations, data.nominationFacts),
      selection: { electionIds: chosen, constituencyIds: data.nominationSelection.constituencyIds }
    });
    await goto(getRoute.current({ route: EDITOR_STEP_ROUTE[forward.step], ...selectionSearch(forward.selection) }));
  }
</script>

<MainContent title={t(descriptor.nominationElectionsTitle)} data-testid="contestant-nomination-elections">
  <p class="text-center">{t(descriptor.nominationElectionsIngress)}</p>

  {#if ready}
    <ElectionSelector
      {elections}
      bind:selected
      role="group"
      aria-label={t(descriptor.nominationElectionsTitle)}
      data-testid="contestant-nomination-elections-list" />
    {#if !chosen.length}
      <p class="small-info mt-sm text-center" id={HINT_ID} data-testid="contestant-nomination-elections-hint">
        {t('contestantApp.nominations.elections.noneSelected')}
      </p>
    {/if}
  {:else}
    <Loading />
  {/if}

  {#snippet primaryActions()}
    <Button
      variant="main"
      icon="next"
      text={t('common.continue')}
      loading={!ready}
      disabled={!canSubmit}
      aria-describedby={ready && !chosen.length ? HINT_ID : undefined}
      onclick={handleSubmit}
      data-testid="contestant-nomination-elections-continue" />
    <Button
      text={t('common.cancel')}
      href={getRoute.current('ContestantAppNominations')}
      data-testid="contestant-nomination-cancel" />
  {/snippet}
</MainContent>
