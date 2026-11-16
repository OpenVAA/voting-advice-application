<!--@component

# Contestant app privacy page

Shows a registry and privacy statement

### Analytics

Read from `contestantCtx.analyticsGate.current`:

- The `DataConsent` control is shown when the contestant has a choice to make, the same condition under which the terms-of-use view offers the opt-out (`shouldShowContestantOptOut`): a provider is configured, no Global Privacy Control, `analytics.trackEvents` is on and the consent mode is `gated`. It lets the contestant change the choice made when accepting the terms.
-->

<script lang="ts">
  import { TermsOfUse } from '$contestant/components/termsOfUse';
  import { MainContent } from '$layouts/main';
  import { Button } from '$lib/components/button';
  import { HeroEmoji } from '$lib/components/heroEmoji';
  import { shouldShowContestantOptOut } from '$lib/contexts/app/tracking/gates';
  import { getContestantContext } from '$lib/contexts/contestant';
  import { DataConsent } from '$lib/dynamic-components/dataConsent';

  ////////////////////////////////////////////////////////////////////
  // Get contexts
  ////////////////////////////////////////////////////////////////////

  const contestantCtx = getContestantContext();
  const { getRoute, t } = contestantCtx;
</script>

<MainContent title={t('contestantApp.privacy.title')}>
  {#snippet hero()}
    <figure role="presentation">
      <HeroEmoji emoji={t('dynamic.contestantAppPrivacy.heroEmoji')} />
    </figure>
  {/snippet}

  <div class="my-lg gap-xl flex flex-col">
    <TermsOfUse />
    {#if shouldShowContestantOptOut(contestantCtx.analyticsGate.current)}
      <DataConsent description="inline" class="bg-base-300 p-lg rounded-lg" />
    {/if}
  </div>

  {#snippet primaryActions()}
    <Button
      icon="next"
      variant="main"
      text={t('common.home')}
      href={getRoute.current(contestantCtx.isAuthenticated ? 'ContestantAppHome' : 'ContestantAppLogin')}
      data-testid="contestant-privacy-home" />
  {/snippet}
</MainContent>
