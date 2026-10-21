<!--@component

# Privacy page

Displays information about the privacy policy of the app as well as the possible data collection consent of the voter.

### Settings

- `analytics.trackEvents`: Affects whether the `DataConsent` component is shown.

### Analytics

Read from `ctx.analyticsGate.current`:

- `projection.active`: Whether the analytics section is shown.
- `projection.consentMode`: Which description is shown, `privacy.analytics.content.gated` or `privacy.analytics.content.free`. The page-view count and the Global Privacy Control rule are always shown with it.
- The `DataConsent` component is shown only when the visitor has a choice to make: the relay is usable (`relayUsable`, so not under Global Privacy Control), `trackEvents` is on and the consent mode is `gated`.
-->

<script lang="ts">
  import { MainContent } from '$layouts/main';
  import { Button } from '$lib/components/button';
  import { HeadingGroup, PreHeading } from '$lib/components/headingGroup';
  import { HeroEmoji } from '$lib/components/heroEmoji';
  import { getAppContext } from '$lib/contexts/app';
  import { relayUsable } from '$lib/contexts/app/tracking/gates';
  import { getLayoutContext } from '$lib/contexts/layout';
  import { DataConsent } from '$lib/dynamic-components/dataConsent';
  import { sanitizeHtml } from '$lib/utils/sanitize';

  const ctx = getAppContext();
  const { getRoute, t } = ctx;
  // analyticsGate is a reactive handle — read via ctx.analyticsGate.current, never destructure.
  const gate = $derived(ctx.analyticsGate.current);
  // The consent control is offered only when there is a choice to make: in consent-free mode and under Global Privacy Control there is none, and the analytics text says why.
  const showConsentControl = $derived(gate.trackEvents && gate.projection.consentMode === 'gated' && relayUsable(gate));

  const { topBarSettings } = getLayoutContext();
  topBarSettings.use({
    actions: {
      return: 'show',
      returnButtonLabel: t('common.returnHome')
    }
  });
</script>

<MainContent title={t('privacy.title')}>
  {#snippet hero()}
    <figure role="presentation">
      <HeroEmoji emoji={t('dynamic.privacy.heroEmoji')} />
    </figure>
  {/snippet}

  {#snippet heading()}
    <HeadingGroup>
      <PreHeading class="text-primary">{t('dynamic.appName')}</PreHeading>
      <h1 tabindex="-1">{t('privacy.title')}</h1>
    </HeadingGroup>
  {/snippet}

  <div class="grid" data-testid="voter-privacy-content">
    <div>
      {@html sanitizeHtml(t('dynamic.privacy.content'))}
    </div>
    {#if gate.projection.active}
      <h2 class="mt-lg mb-md">{t('privacy.analytics.title')}</h2>
      <div>
        <p>
          {gate.projection.consentMode === 'gated'
            ? t('privacy.analytics.content.gated')
            : t('privacy.analytics.content.free')}
        </p>
        <p>{t('privacy.analytics.pageviews')}</p>
        <p>{t('privacy.analytics.gpc')}</p>
      </div>
    {/if}
    <h2 class="mt-lg mb-md">{t('privacy.cookies.title')}</h2>
    <div>
      {@html sanitizeHtml(t('privacy.cookies.content'))}
    </div>
    {#if showConsentControl}
      <h2 class="mt-lg mb-md">{t('common.privacy.dataCollection.title')}</h2>
      <DataConsent description="inline" class="bg-base-300 p-lg rounded-lg" />
    {/if}
  </div>

  {#snippet primaryActions()}
    <Button
      variant="main"
      href={getRoute.current('Home')}
      text={t('common.returnHome')}
      data-testid="voter-privacy-return" />
  {/snippet}
</MainContent>
