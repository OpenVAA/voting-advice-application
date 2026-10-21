<!--@component

# Contestant App entity layout

- Applies the data of the entity the user edits to `ContestantContext`, whenever this layout's load data resolves:
  - the questions, to the data root
  - the user data with the entity and its nominations, to the user-data store
- Renders an error message in place of the page when that data is not usable.
- Lets go of the entity when the user leaves the entity tree: the user-data store is emptied, and the entity's persisted answer draft is kept.
-->

<script lang="ts">
  import { log } from '@openvaa/app-shared';
  import { untrack } from 'svelte';
  import { isValidResult } from '$lib/api/utils/isValidResult';
  import { ErrorMessage } from '$lib/components/errorMessage';
  import { Loading } from '$lib/components/loading';
  import { getContestantContext } from '$lib/contexts/contestant/contestantContext.svelte';
  import type { Snippet } from 'svelte';
  import type { DPDataType } from '$lib/api/base/dataTypes';
  import type { LayoutData } from './$types';

  let { data, children }: { data: LayoutData; children: Snippet } = $props();

  ////////////////////////////////////////////////////////////////////
  // Get context
  ////////////////////////////////////////////////////////////////////

  const { setDataRoot, userData } = getContestantContext();

  ////////////////////////////////////////////////////////////////////
  // Provide the entity's data
  ////////////////////////////////////////////////////////////////////

  // A pure `$derived.by` over the already-resolved loader data: `+layout.server.ts` awaits everything it returns, so there is no promise and no microtask boundary between this and the effects below.
  const validity = $derived.by(() => {
    if (!isValidResult(data.questionData, { allowEmpty: true })) {
      return { state: 'error' as const };
    }
    const ud = data.contestantUserData;
    if (!ud?.nominations || !ud?.entity) {
      return { state: 'error' as const };
    }
    // `data.questionData` is typed as the wider loader union (`DPDataType['questions'] | Error`), because the load answers a failed question read with the error itself. `isValidResult` has excluded the error, so the cast is safe at this boundary.
    return {
      state: 'resolved' as const,
      questionData: data.questionData as DPDataType['questions'],
      entity: ud.entity,
      nominations: ud.nominations,
      userData: ud
    };
  });

  const layoutState = $derived<'loading' | 'error' | 'ready'>(validity.state === 'error' ? 'error' : 'ready');

  // Applies the resolved data to the data root and initialises `userData`. Both are synchronous, so there is nothing to await.
  //
  // The data root is mutated through `setDataRoot(updater)`, which runs the updater untracked. Calling `dataRoot.update()` on the reactive accessor here would make the data root's version counter a dependency of this effect, and the update bumps that counter, so the effect would retrigger itself without end.
  $effect(() => {
    if (validity.state !== 'resolved') return;
    // The fields are read here, in the tracked scope; `userData.init` is wrapped in `untrack` so that nothing it reads or writes becomes a dependency of this effect.
    const snapshot = {
      questionData: validity.questionData,
      userData: validity.userData
    };
    setDataRoot((dr) => {
      dr.update(() => {
        dr.provideQuestionData(snapshot.questionData);
        // The data root is given the questions alone. The entity's nominations stay on `userData` as a flat list that carries its own names: it holds no entity graph for the data root to match a nomination to.
      });
    });
    untrack(() => userData.init(snapshot.userData));
  });

  // The body reads nothing reactive, so its cleanup runs once, when the layout is torn down.
  $effect(() => {
    return () => userData.leaveEntity();
  });

  $effect(() => {
    if (validity.state === 'error') log.error('Error loading the entity layout data');
  });
</script>

{#if layoutState === 'error'}
  <ErrorMessage class="bg-base-300" />
{:else if layoutState === 'loading'}
  <Loading />
{:else}
  {@render children?.()}
{/if}
