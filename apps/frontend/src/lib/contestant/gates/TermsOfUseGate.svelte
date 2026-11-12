<!--
@component Show the terms of use to a signed-in user who has not accepted them for this project, with a button for accepting and continuing and another for logging out. Accepting records the acceptance and reruns the page's loads, so the page the user asked for replaces this view. A failed acceptance is reported and the form stays.

When events could be sent in gated mode (`shouldShowContestantOptOut`), a box for opting out of the collection of usage data is shown under the terms. It starts ticked when this browser already holds a refusal. A recorded acceptance then writes the box's choice to the visitor's consent choice, `denied` when ticked and `granted` when not. When the box is not shown, nothing is written.

### Dynamic component

Accesses `ContestantContext`: `acceptTermsOfUse`, `logout`, `setDataConsent` and `analyticsGate`.

### Properties

None.

### Usage

```tsx
<TermsOfUseGate />
```
-->

<script lang="ts">
  import { log } from '@openvaa/app-shared';
  import { invalidateAll } from '$app/navigation';
  import { TermsOfUseForm, TrackingOptOut } from '$contestant/components/termsOfUse';
  import { MainContent } from '$layouts/main';
  import { Button } from '$lib/components/button';
  import { HeroEmoji } from '$lib/components/heroEmoji';
  import { shouldShowContestantOptOut } from '$lib/contexts/app/tracking/gates';
  import { getContestantContext } from '$lib/contexts/contestant/contestantContext.svelte';

  ////////////////////////////////////////////////////////////////////
  // Get contexts
  ////////////////////////////////////////////////////////////////////

  const ctx = getContestantContext();
  const { t, logout, acceptTermsOfUse, setDataConsent } = ctx;

  ////////////////////////////////////////////////////////////////////
  // Accept the terms of use or log out
  ////////////////////////////////////////////////////////////////////

  let status = $state<ActionStatus>('idle');
  let termsAccepted = $state(false);
  // analyticsGate is a reactive handle: read via ctx.analyticsGate.current, never destructure.
  const showOptOut = $derived(shouldShowContestantOptOut(ctx.analyticsGate.current));
  // A refusal already stored in this browser starts the box ticked, so accepting the terms never turns it into a grant.
  let optOut = $state(ctx.analyticsGate.current.consent === 'denied');

  async function handleSubmit() {
    if (!termsAccepted) return;
    status = 'loading';
    try {
      const result = await acceptTermsOfUse();
      if (result?.type !== 'success') throw new Error('The terms-of-use acceptance was not recorded.');
      if (showOptOut) setDataConsent(optOut ? 'denied' : 'granted');
      // Awaited so that Continue keeps its loading state until the page has its new data. Only the rerun load, reading the stored acceptance, removes this view.
      await invalidateAll();
      status = 'idle';
    } catch (error) {
      log.error('Failed to record the terms-of-use acceptance', { err: error });
      status = 'error';
    }
  }

  async function handleLogout() {
    status = 'loading';
    await logout();
    status = 'idle';
  }
</script>

<MainContent title={t('dynamic.contestantAppPrivacy.consent.title')}>
  {#snippet hero()}
    <figure role="presentation">
      <HeroEmoji emoji={t('dynamic.contestantAppPrivacy.consent.heroEmoji')} />
    </figure>
  {/snippet}
  <TermsOfUseForm bind:termsAccepted />
  {#if showOptOut}
    <TrackingOptOut bind:optOut />
  {/if}
  {#if status === 'error'}
    <div role="alert" data-testid="tou-save-error" class="text-error my-md text-center">
      {t('contestantApp.error.saveFailed')}
    </div>
  {/if}
  {#snippet primaryActions()}
    <Button
      text={t('common.continue')}
      variant="main"
      disabled={!termsAccepted}
      loading={status === 'loading'}
      onclick={handleSubmit}
      data-testid="terms-of-use-submit" />
    <Button color="warning" text={t('common.logout')} loading={status === 'loading'} onclick={handleLogout} />
  {/snippet}
</MainContent>
