<!--@component

# All nominations layout

Provides the data used by the nominations route.

### Settings

- `entities.showAllNominations`: Affects whether this route is available (handled by `layout.ts`)
-->

<script lang="ts">
  import { tick } from 'svelte';
  import { isValidResult } from '$lib/api/utils/isValidResult.js';
  import { ErrorMessage } from '$lib/components/errorMessage';
  import { Loading } from '$lib/components/loading';
  import { getVoterContext } from '$lib/contexts/voter';
  import type { Snippet } from 'svelte';
  import type { DPDataType } from '$lib/api/base/dataTypes';
  import type { LayoutData } from './$types';

  let { data, children }: { data: LayoutData; children: Snippet } = $props();

  // dataRoot is a reactive accessor (Phase 113 flatten) — read via ctx.dataRoot,
  // never destructure. The reads below are deliberately INSIDE the non-reactive `update()`
  // function so dataRoot is not tracked (tracking it would cause an infinite loop).
  const ctx = getVoterContext();

  let error = $state<Error | undefined>(undefined);
  let ready = $state(false);

  $effect(() => {
    // Read data synchronously to register as dependency
    const questionData = data.questionData;
    const nominationData = data.nominationData;
    // Reset state
    error = undefined;
    ready = false;
    Promise.all([questionData, nominationData]).then(async (resolved) => {
      error = await update(resolved);
    });
  });

  /**
   * Handle the update inside a function so that we don't track dataRoot, which would result in an infinite loop.
   * @returns `Error` if the data is invalid, `undefined` otherwise.
   */
  async function update([questionData, nominationData]: [
    DPDataType['questions'] | Error,
    DPDataType['nominations'] | Error
  ]): Promise<Error | undefined> {
    if (!isValidResult(questionData, { allowEmpty: true })) return new Error('Error loading question data');
    if (!isValidResult(nominationData, { allowEmpty: true })) return new Error('Error loading nomination data');
    ctx.dataRoot.update(() => {
      ctx.dataRoot.provideQuestionData(questionData);
      ctx.dataRoot.provideEntityData(nominationData.entities);
      ctx.dataRoot.provideNominationData(nominationData.nominations);
    });
    await tick();
    ready = true;
  }
</script>

{#if error}
  <ErrorMessage class="bg-base-300" />
{:else if !ready}
  <Loading />
{:else}
  {@render children?.()}
{/if}
