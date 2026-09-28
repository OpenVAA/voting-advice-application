<!--@component

# Candidate logged in main layout

- Provides data CandidateContext:
  - candidate user data
  - questions
- Shows the terms of use form if it has not been agreed to yet
-->

<script lang="ts">
  import { log } from '@openvaa/app-shared';
  import { untrack } from 'svelte';
  import { TermsOfUseForm } from '$candidate/components/termsOfUse';
  import { MainContent } from '$layouts/main';
  import { isValidResult } from '$lib/api/utils/isValidResult';
  import { Button } from '$lib/components/button';
  import { ErrorMessage } from '$lib/components/errorMessage';
  import { HeroEmoji } from '$lib/components/heroEmoji';
  import { Loading } from '$lib/components/loading';
  import { getCandidateContext } from '$lib/contexts/candidate/candidateContext.svelte';
  import type { Snippet } from 'svelte';
  import type { DPDataType } from '$lib/api/base/dataTypes';
  import type { LayoutData } from './$types';

  let { data, children }: { data: LayoutData; children: Snippet } = $props();

  ////////////////////////////////////////////////////////////////////
  // Get context
  ////////////////////////////////////////////////////////////////////

  const { setDataRoot, logout, t, userData } = getCandidateContext();

  ////////////////////////////////////////////////////////////////////
  // Accept terms of use
  ////////////////////////////////////////////////////////////////////

  let status = $state<ActionStatus>('idle');
  let termsAcceptedLocal = $state(false);
  // Gates the layoutState 'terms' → 'ready' transition. Set true only after handleSubmit's save() resolves, so ticking the checkbox alone does not unmount the form before Continue is clicked (which would short-circuit userData.save() and leave acceptance unpersisted).
  let termsSubmitted = $state(false);

  async function handleSubmit() {
    if (!termsAcceptedLocal) return;
    status = 'loading';
    try {
      userData.setTermsOfUseAccepted(new Date().toJSON());
      // BRANCH ON THE RESULT. `save()` is composite and its answers branch returns `{ type: 'failure' }` on an unverified read-back (`candidateUserDataState.svelte.ts:260`) — positioned BEFORE the `updateEntityProperties` call that persists `termsOfUseAccepted`. Ignoring the return therefore reports success for a save in which the terms write never ran. That was harmless until `157.1-06`, whose answers branch previously returned a truthy `{}` that let the guard pass; this check is what keeps the phase from shipping a silent success of its own making (criterion 2).
      // Same idiom as the two already-checked entrances (`questions/[questionId]/+page.svelte:215`, `profile/+page.svelte`), same existing failure surface, and NOT converted to a throw (decision B4(a)).
      const result = await userData.save();
      if (result?.type !== 'success') {
        log.error('Terms-of-use acceptance was not persisted: the composite save reported a failure.');
        status = 'error';
        return;
      }
      status = 'success';
      termsSubmitted = true;
    } catch (error) {
      log.error('Failed to save terms-of-use acceptance', { err: error });
      status = 'error';
    }
  }

  async function handleCancel() {
    status = 'loading';
    await logout();
    status = 'idle';
  }

  ////////////////////////////////////////////////////////////////////
  // Provide data and possibly show terms of use form
  ////////////////////////////////////////////////////////////////////

  // Validation is a pure `$derived.by` over the already-resolved loader data (`+layout.server.ts` awaits both `questionData` and `candidateUserData` before returning). No `Promise.all`, no `.then()`, no microtask boundary between `$effect` and `$state` writes. This shape removes the Svelte 5 SSR+hydration reactivity race that stuck the previous `$effect` + promise-chain pattern at <Loading /> on full page loads.
  const validity = $derived.by(() => {
    if (!isValidResult(data.questionData, { allowEmpty: true })) {
      return { state: 'error' as const };
    }
    const ud = data.candidateUserData;
    if (!ud?.nominations || !ud?.candidate) {
      return { state: 'error' as const };
    }
    // Cast after `isValidResult` narrowing: `data.questionData` is typed as the wider loader union (`DPDataType['questions'] | Error`) due to the `.catch((e) => e)` in `+layout.server.ts`. `isValidResult` is already a type guard; the cast is safe at this boundary and mirrors the same pattern used by the root layout.
    return {
      state: 'resolved' as const,
      questionData: data.questionData as DPDataType['questions'],
      candidate: ud.candidate,
      entities: ud.nominations.entities,
      nominations: ud.nominations.nominations,
      userData: ud
    };
  });

  // 4-way enum retained — clean readable branch shape.
  // `$derived` (not `$state`) — recomputes automatically when `validity` or `termsAcceptedLocal` changes, so `handleSubmit` has no explicit `layoutState = 'ready'` write.
  const layoutState = $derived<'loading' | 'error' | 'terms' | 'ready'>(
    validity.state === 'error' ? 'error' : !validity.candidate.termsOfUseAccepted && !termsSubmitted ? 'terms' : 'ready'
  );

  // Side effect — applies resolved data to `dataRoot` and initializes `userData`.
  // Reads `$derived` validity. NO `.then()`, NO microtask wait — `userData.init` is a synchronous `savedData = data` assignment, so there is nothing to await.
  //
  // IMPORTANT: mutate the DataRoot via `setDataRoot(updater)` (the encapsulated non-reactive write path on the rune-native DataContext class) rather than the `dataRoot` reactive form. `dataRoot.update(() => provide*(...))`
  // inside a `$effect` creates an infinite reactive loop in Svelte 5: reading `.current` registers the version counter as a dependency of this effect, and the `DataRoot.update()` call notifies subscribers (bumping `version`) — retriggering the effect. `setDataRoot` runs the mutation inside `untrack`, so this effect takes no dependency on the version counter; this matches the root layout. Wrapped in `.update(() => ...)` for batched subscriber notification — the canonical form is in apps/frontend/src/lib/admin/utils/loadElectionData.ts.
  $effect(() => {
    if (validity.state !== 'resolved') return;
    // Snapshot validity fields inside the effect's tracked scope, then apply side-effects via `setDataRoot` (its internal `untrack` covers the dr-mutation) and a wrapping `untrack` for `userData.init` to prevent any subscriber re-notification (from DataRoot.subscribe / candidateUserDataStore.savedData writes) from retriggering this effect (Svelte 5 `effect_update_depth_exceeded`).
    const snapshot = {
      questionData: validity.questionData,
      entities: validity.entities,
      userData: validity.userData
    };
    setDataRoot((dr) => {
      dr.update(() => {
        dr.provideQuestionData(snapshot.questionData);
        dr.provideEntityData(snapshot.entities);
        // NB: we deliberately do NOT call dr.provideNominationData here. The candidate's own nominations are loaded as raw partial data on `userData` (no entity graph), so provideNominationData would throw `DataProvisionError: No matching entity found for nomination`. The profile page formats nominations directly from that raw data, resolving election/constituency names via dr.getElection/getConstituency.
      });
    });
    untrack(() => userData.init(snapshot.userData));
  });

  // Error logging side-effect, in its own `$effect` so it re-runs on validity changes without being entangled with the data-application effect above.
  $effect(() => {
    if (validity.state === 'error') log.error('Error loading protected-layout data');
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
    {#if status === 'error'}
      <!-- The EXISTING save-failure key, shared with the two already-checked `save()` entrances so all three report the same thing; it exists in every shipped locale (decision B4(a) — no new key). -->
      <div role="alert" data-testid="tou-save-error" class="text-error my-md text-center">
        {t('candidateApp.error.saveFailed')}
      </div>
    {/if}
    {#snippet primaryActions()}
      <Button
        text={t('common.continue')}
        variant="main"
        disabled={!termsAcceptedLocal}
        loading={status === 'loading'}
        onclick={handleSubmit}
        data-testid="terms-of-use-submit" />
      <Button color="warning" text={t('common.logout')} loading={status === 'loading'} onclick={handleCancel} />
    {/snippet}
  </MainContent>
{:else}
  {@render children?.()}
{/if}
