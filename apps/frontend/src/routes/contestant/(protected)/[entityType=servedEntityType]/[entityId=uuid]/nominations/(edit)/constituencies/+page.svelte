<!--@component

# Contestant app nomination editor: the constituency step

Asks for the constituency the entity the user edits stands in, one for each election. See `+page.ts` for the redirects that pass the step over.

- **What is listed**: one selector for each chosen election that has several constituencies. An election with a single constituency has nothing to choose and is not listed. While a constituency group is chosen first, one selector over that group stands for every election that admits the entity's type.
- **An election in which the entity holds several nominations** has no selector. In its place a section headed by the election says that those nominations are kept as they are and are changed on the next step. No further constituency can be added in that election.
- **What is selected on arrival**: for each election listed, the constituency of it that the address names; otherwise the constituency of the entity's one nomination in that election; and otherwise none. While a constituency group is chosen first, the one selector shows a constituency as selected only where its group holds it.
- **Selecting another constituency than the stored one** writes nothing: the details step shows the nomination at the new constituency and names the previous one.
- **Continue** is enabled once every selector has a constituency. It leads to the details step and passes the chosen elections and constituencies on in the address. While a constituency group is chosen first it leads to the election step when several elections are held in the chosen constituency, and it is disabled when none is.
- **A constituency with no election**: while a constituency group is chosen first and no election that admits the entity's type is held in the selected constituency, nor in a constituency it lies in, one sentence under the selector says so. It stays until another constituency is selected.
- **Cancel** leads to the nominations view.
- **While the constituencies are not on the page**, which is the case in the server-rendered markup, a loading indicator stands in the selectors' place and Continue is in its loading form, so a selector that is shown is one a user can operate.

Nothing is written on this step.

Everything that differs between entity types is read from the descriptor of the selected entity's type.

### Settings

- `elections.startFromConstituencyGroup`: Whether one constituency group is chosen before the election, as one selector for every election.

### Accessibility

- Each selector is labelled by the selector component, and with several elections each is headed by its election's name.
- A section that stands in for a selector is headed by its election's name, at the level of the selectors' headings.
- The sentence for a constituency with no election is a status message (`role="status"`), since it appears in answer to a selection while Continue, which it describes, is disabled and takes no focus.
-->

<script lang="ts">
  import { goto } from '$app/navigation';
  import { MainContent } from '$layouts/main';
  import { Button } from '$lib/components/button';
  import { ConstituencySelector } from '$lib/components/constituencySelector';
  import { Loading } from '$lib/components/loading';
  import { admissibleElectionsOf } from '$lib/contestant/nominations';
  import { entityDescriptorOf } from '$lib/contestant/utils/entityDescriptor';
  import { getContestantContext } from '$lib/contexts/contestant';
  import { electionsHeldIn, usesSingleConstituencyGroup } from '$lib/routes';
  import {
    afterConstituencies,
    constituenciesOf,
    constituenciesStoodFor,
    EDITOR_STEP_ROUTE,
    selectionSearch
  } from '../stepSelection';
  import type { Id } from '@openvaa/core';
  import type { PageData } from './$types';

  let { data }: { data: PageData } = $props();

  ////////////////////////////////////////////////////////////////////
  // Get contexts
  ////////////////////////////////////////////////////////////////////

  // appSettings, dataRoot and selectedEntity are reactive accessors: read via contestantCtx.X inside the tracking scope, never destructured, and dataRoot never through an alias.
  const contestantCtx = getContestantContext();
  const { getRoute, t } = contestantCtx;

  ////////////////////////////////////////////////////////////////////
  // The elections a constituency is chosen for
  ////////////////////////////////////////////////////////////////////

  /** The id of the sentence that describes Continue while no admissible election is held in the selected constituency. */
  const NO_ELECTION_ID = 'contestant-nomination-constituencies-no-election';

  /** Everything that differs by entity type. */
  const descriptor = $derived(entityDescriptorOf(contestantCtx.selectedEntity?.type));

  /** Whether the elections and the constituencies are on the page. They are not in the server-rendered markup. */
  const ready = $derived(
    contestantCtx.dataRoot.elections.length > 0 && contestantCtx.dataRoot.constituencies.length > 0
  );

  /** The elections that admit the entity's type, in the order the application lists elections. */
  const admissible = $derived.by(() => {
    const entityType = contestantCtx.selectedEntity?.type;
    return entityType ? admissibleElectionsOf(contestantCtx.dataRoot.elections, entityType) : [];
  });

  /** The constituency group that is chosen first, as one selector for every election. Its lookup does not throw while the constituencies are not on the page. */
  const useSingleGroup = $derived(
    usesSingleConstituencyGroup({
      appSettings: contestantCtx.appSettings,
      constituencyGroups: contestantCtx.dataRoot.constituencyGroups
    })
  );

  /** The elections handed to the selector, as the step's load names them: every admissible election while one group is chosen first, and otherwise the chosen elections that have a constituency to choose. */
  const toChoose = $derived.by(() => {
    if (!ready) return [];
    const ids = data.nominationConstituencyChoice.toChoose;
    return admissible.filter((election) => ids.includes(election.id));
  });

  /** The chosen elections that have a section in a selector's place, as the step's load names them: those in which the entity holds several nominations. */
  const kept = $derived.by(() => {
    if (!ready) return [];
    const ids = data.nominationConstituencyChoice.kept;
    return admissible.filter((election) => ids.includes(election.id));
  });

  ////////////////////////////////////////////////////////////////////
  // The selection
  ////////////////////////////////////////////////////////////////////

  /** The id of the constituency selected for each election. It starts from what the step's load answers, and is the user's from then on. */
  let selected = $state<{ [electionId: Id]: Id }>(constituenciesOnArrival());

  /** Whether every selector has a constituency. Bound to the selector. */
  let selectionComplete = $state(false);

  /**
   * The constituency selected on arrival for each election the selector is handed.
   */
  function constituenciesOnArrival(): { [electionId: Id]: Id } {
    return { ...data.nominationConstituencyChoice.onArrival };
  }

  /** The ids of the selected constituencies, each once. */
  const chosenConstituencyIds = $derived([...new Set(Object.values(selected).filter((id) => id))]);

  /** Where Continue leads. `undefined` when a constituency group is chosen first and no admissible election is held in the selected constituency or in a constituency it lies in. */
  const forward = $derived(
    ready
      ? afterConstituencies({
          appSettings: contestantCtx.appSettings,
          dataRoot: contestantCtx.dataRoot,
          admissible,
          selection: { electionIds: data.nominationSelection.electionIds, constituencyIds: chosenConstituencyIds }
        })
      : undefined
  );

  /** Whether a constituency group is chosen first, a constituency of it is selected, and no election that admits the entity's type is held there or in a constituency it lies in. */
  const noElectionHeld = $derived(
    ready &&
      selectionComplete &&
      !!contestantCtx.appSettings.elections?.startFromConstituencyGroup &&
      !electionsHeldIn({
        elections: admissible,
        constituencies: constituenciesStoodFor({
          elections: admissible,
          constituencies: constituenciesOf(contestantCtx.dataRoot, chosenConstituencyIds)
        })
      }).length
  );

  const canSubmit = $derived(ready && selectionComplete && forward !== undefined);

  ////////////////////////////////////////////////////////////////////
  // Continuing
  ////////////////////////////////////////////////////////////////////

  /**
   * Go on to the step that follows for the constituencies selected, with the selection in the address. Nothing is written.
   */
  async function handleSubmit(): Promise<void> {
    if (!canSubmit || !forward) return;
    await goto(getRoute.current({ route: EDITOR_STEP_ROUTE[forward.step], ...selectionSearch(forward.selection) }));
  }
</script>

<MainContent title={t(descriptor.nominationConstituenciesTitle)} data-testid="contestant-nomination-constituencies">
  <p class="text-center">{t(descriptor.nominationConstituenciesIngress)}</p>

  {#if !ready}
    <Loading />
  {:else if toChoose.length}
    <ConstituencySelector
      elections={toChoose}
      {useSingleGroup}
      bind:selected
      bind:selectionComplete
      data-testid="contestant-nomination-constituencies-list" />
    {#each kept as election (election.id)}
      <section class="mt-lg self-stretch" data-testid="contestant-nomination-constituencies-kept">
        <h3>{election.name}</h3>
        <p class="small-info mt-xs">{t('contestantApp.nominations.constituencies.severalKept')}</p>
      </section>
    {/each}
    {#if noElectionHeld}
      <p
        class="small-info mt-sm text-center"
        id={NO_ELECTION_ID}
        role="status"
        data-testid="contestant-nomination-constituencies-no-election">
        {t(descriptor.nominationConstituenciesNoElection)}
      </p>
    {/if}
  {/if}

  {#snippet primaryActions()}
    <Button
      variant="main"
      icon="next"
      text={t('common.continue')}
      loading={!ready}
      disabled={!canSubmit}
      aria-describedby={noElectionHeld ? NO_ELECTION_ID : undefined}
      onclick={handleSubmit}
      data-testid="contestant-nomination-constituencies-continue" />
    <Button
      text={t('common.cancel')}
      href={getRoute.current('ContestantAppNominations')}
      data-testid="contestant-nomination-cancel" />
  {/snippet}
</MainContent>
