<!--@component

# Privacy page

Displays information about the privacy policy of the app as well as the possible data collection consent of the voter.

### Settings

- `analytics.trackEvents`: Affects whether the usage events and the survey notice are described and whether the `DataConsent` component is shown.
- `survey.linkTemplate`: Affects whether the survey notice is shown.

### Analytics

Read from `ctx.analyticsPolicy.current`:

- `projection.active`: Whether the analytics section is shown. The page-view count and the Global Privacy Control rule are always shown in it.
- `trackEvents`: Whether the section describes the usage events at all. With it off only the page view is sent, so the section describes only the page-view count.
- `projection.consentMode`: Which description of the usage events is shown, `privacy.analytics.content.gated` or `privacy.analytics.content.free`.
- `projection.visitIdMode`: With `memory`, `trackEvents` on and a `survey.linkTemplate` that holds the `{sessionId}` placeholder, the section says that the visit id is added to the survey link (`privacy.analytics.survey`). With `trackEvents` off no visit id is filled into the link, so the notice is not shown.
- The `DataConsent` component is shown only when the visitor has a choice to make: the relay is usable (`relayUsable`, so not under Global Privacy Control), `trackEvents` is on and the consent mode is `gated`.
-->

<script lang="ts">
  import { MainContent } from '$layouts/main';
  import { Button } from '$lib/components/button';
  import { HeadingGroup, PreHeading } from '$lib/components/headingGroup';
  import { HeroEmoji } from '$lib/components/heroEmoji';
  import { getAppContext } from '$lib/contexts/app';
  import { linkTemplateCarriesVisitId } from '$lib/contexts/app/survey.svelte';
  import { relayUsable } from '$lib/contexts/app/tracking/sendPolicy';
  import { getLayoutContext } from '$lib/contexts/layout';
  import { DataConsent } from '$lib/dynamic-components/dataConsent';
  import { sanitizeHtml } from '$lib/utils/sanitize';

  const ctx = getAppContext();
  const { getRoute, t } = ctx;
  // analyticsPolicy is a reactive handle — read via ctx.analyticsPolicy.current, never destructure.
  const policy = $derived(ctx.analyticsPolicy.current);
  // The consent control is offered only when there is a choice to make: in consent-free mode and under Global Privacy Control there is none, and the analytics text says why.
  const showConsentControl = $derived(
    policy.trackEvents && policy.projection.consentMode === 'gated' && relayUsable(policy)
  );
  // The survey link carries the visit id only when its template holds the placeholder, the visit has an id and events are tracked at all.
  const showSurveyNotice = $derived(
    policy.trackEvents &&
      policy.projection.visitIdMode === 'memory' &&
      linkTemplateCarriesVisitId(ctx.appSettings.survey?.linkTemplate)
  );

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
    {#if policy.projection.active}
      <h2 class="mt-lg mb-md">{t('privacy.analytics.title')}</h2>
      <div>
        {#if policy.trackEvents}
          <p>
            {policy.projection.consentMode === 'gated'
              ? t('privacy.analytics.content.gated')
              : t('privacy.analytics.content.free')}
          </p>
        {/if}
        {#if showSurveyNotice}
          <p>{t('privacy.analytics.survey')}</p>
        {/if}
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
