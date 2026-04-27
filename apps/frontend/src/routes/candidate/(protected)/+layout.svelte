<!--@component

# Candidate logged in main layout

- Provides data CandidateContext:
  - candidate user data
  - questions
- Shows the terms of use form if it has not been agreed to yet
-->

<script lang="ts">
  import { untrack } from 'svelte';
  import type { Snippet } from 'svelte';
  import { get } from 'svelte/store';
  import { TermsOfUseForm } from '$candidate/components/termsOfUse';
  import { isValidResult } from '$lib/api/utils/isValidResult';
  import { Button } from '$lib/components/button';
  import { ErrorMessage } from '$lib/components/errorMessage';
  import { HeroEmoji } from '$lib/components/heroEmoji';
  import { Loading } from '$lib/components/loading';
  import { getCandidateContext } from '$lib/contexts/candidate/candidateContext.svelte';
  import { logDebugError } from '$lib/utils/logger';
  import MainContent from '../../MainContent.svelte';
  import type { DPDataType } from '$lib/api/base/dataTypes';
  import type { LayoutData } from './$types';

  let { data, children }: { data: LayoutData; children: Snippet } = $props();

  ////////////////////////////////////////////////////////////////////
  // Get context
  ////////////////////////////////////////////////////////////////////

  const { dataRoot, logout, t, userData } = getCandidateContext();

  ////////////////////////////////////////////////////////////////////
  // Accept terms of use
  ////////////////////////////////////////////////////////////////////

  let status = $state<ActionStatus>('idle');
  let termsAcceptedLocal = $state(false);

  async function handleSubmit() {
    if (!termsAcceptedLocal) return;
    status = 'loading';
    userData.setTermsOfUseAccepted(new Date().toJSON());
    await userData.save();
    status = 'success';
    // layoutState recomputes automatically via $derived from termsAcceptedLocal — no explicit write.
  }

  async function handleCancel() {
    status = 'loading';
    await logout();
    status = 'idle';
  }

  ////////////////////////////////////////////////////////////////////
  // Provide data and possibly show terms of use form
  ////////////////////////////////////////////////////////////////////

  // Validation is a pure `$derived.by` over the already-resolved loader data
  // (`+layout.server.ts` awaits both `questionData` and `candidateUserData`
  // before returning). No `Promise.all`, no `.then()`, no microtask boundary
  // between `$effect` and `$state` writes. This shape removes the Svelte 5
  // SSR+hydration reactivity race that stuck the previous `$effect` +
  // promise-chain pattern at <Loading /> on full page loads.
  // Ref: 60-RESEARCH §Pattern 1, D-01 + D-03.
  const validity = $derived.by(() => {
    if (!isValidResult(data.questionData, { allowEmpty: true })) {
      return { state: 'error' as const };
    }
    const ud = data.candidateUserData;
    if (!ud?.nominations || !ud?.candidate) {
      return { state: 'error' as const };
    }
    // Cast after `isValidResult` narrowing: `data.questionData` is typed as the
    // wider loader union (`DPDataType['questions'] | Error`) due to the
    // `.catch((e) => e)` in `+layout.server.ts`. `isValidResult` is already a
    // type guard; the cast is safe at this boundary and mirrors the same
    // pattern used by the root layout (Plan 60-02 decision #2).
    return {
      state: 'resolved' as const,
      questionData: data.questionData as DPDataType['questions'],
      candidate: ud.candidate,
      entities: ud.nominations.entities,
      nominations: ud.nominations.nominations,
      userData: ud
    };
  });

  // 4-way enum retained per RESEARCH §Alternatives — clean readable branch shape.
  // `$derived` (not `$state`) — recomputes automatically when `validity` or
  // `termsAcceptedLocal` changes, so `handleSubmit` has no explicit `layoutState = 'ready'` write.
  const layoutState = $derived<'loading' | 'error' | 'terms' | 'ready'>(
    validity.state === 'error'
      ? 'error'
      : !validity.candidate.termsOfUseAccepted && !termsAcceptedLocal
        ? 'terms'
        : 'ready'
  );

  // Side effect — applies resolved data to `dataRoot` and initializes `userData`.
  // Reads `$derived` validity. NO `.then()`, NO microtask wait — `userData.init`
  // is a synchronous `savedData = data` assignment; the previous `tick`-wait was
  // a defensive v2.1 artifact with no remaining purpose — RESEARCH Assumption A2.
  //
  // IMPORTANT: access the DataRoot instance via `get(dataRoot)` rather than the
  // `$dataRoot` auto-subscription form. `$dataRoot.update(() => provide*(...))`
  // inside a `$effect` creates an infinite reactive loop in Svelte 5: the
  // auto-subscription registers the store as a dependency of this effect, and
  // the `DataRoot.update()` call notifies subscribers — retriggering the effect.
  // `get()` reads the current value without establishing a reactive dependency.
  // Wrapped in `.update(() => ...)` for batched subscriber notification (canonical
  // form — see apps/frontend/src/lib/admin/utils/loadElectionData.ts).
  $effect(() => {
    if (validity.state !== 'resolved') return;
    // Snapshot validity fields inside the effect's tracked scope, then apply
    // side-effects inside `untrack` to prevent any subscriber re-notification
    // (from DataRoot.subscribe / candidateUserDataStore.savedData writes) from
    // retriggering this effect (Svelte 5 `effect_update_depth_exceeded`).
    const snapshot = {
      questionData: validity.questionData,
      entities: validity.entities,
      nominations: validity.nominations,
      userData: validity.userData
    };
    untrack(() => {
      const dr = get(dataRoot);
      dr.update(() => {
        dr.provideQuestionData(snapshot.questionData);
        dr.provideEntityData(snapshot.entities);
        dr.provideNominationData(snapshot.nominations);
      });
      userData.init(snapshot.userData);
    });
  });

  // Error logging side-effect — parity with pre-refactor `logDebugError` calls
  // (was inlined in the old `update()` function; now a dedicated `$effect`).
  $effect(() => {
    if (validity.state === 'error') logDebugError('Error loading protected-layout data');
  });
</script>

{#if layoutState === 'error'}
  <ErrorMessage class="bg-base-300" />
{:else if layoutState === 'loading'}
  <Loading />
{:else if layoutState === 'terms'}
  <MainContent title={t('dynamic.candidateAppPrivacy.consent.title')}>
    {#snippet hero()}
      <figure role="presentation">
        <HeroEmoji emoji={t('dynamic.candidateAppPrivacy.consent.heroEmoji')} />
      </figure>
    {/snippet}
    <TermsOfUseForm bind:termsAccepted={termsAcceptedLocal} />
    {#snippet primaryActions()}
      <Button
        text={t('common.continue')}
        variant="main"
        disabled={!termsAcceptedLocal}
        loading={status === 'loading'}
        onclick={handleSubmit} />
      <Button color="warning" text={t('common.logout')} loading={status === 'loading'} onclick={handleCancel} />
    {/snippet}
  </MainContent>
{:else}
  {@render children?.()}
{/if}
