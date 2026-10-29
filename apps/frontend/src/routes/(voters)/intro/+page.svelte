<!--@component

# Intro page

Shown after the front page in the voter app. Displays a list of the steps the voter will need to take. The list is constructed based on the data and settings.

### Settings

- `elections.disallowSelection`: Affects whether the select elections step is shown.
- `elections.startFromConstituencyGroup`: Affects the order of the steps shown and the continue button’s behavior.
-->

<script lang="ts">
  import { MainContent } from '$layouts/main';
  import { Button } from '$lib/components/button';
  import { HeroEmoji } from '$lib/components/heroEmoji';
  import { getVoterContext } from '$lib/contexts/voter';

  // Destructuring the reactive context getters (electionsSelectable, constituenciesSelectable) captures the initial empty/false snapshot. Read via `voterCtx.X` instead. Stable functions (getRoute, t) remain destructured.
  const voterCtx = getVoterContext();
  const { getRoute, t } = voterCtx;
  // appSettings is a reactive accessor — read via voterCtx.X, never destructure.
  const appSettings = $derived(voterCtx.appSettings);
</script>

<MainContent title={t('dynamic.intro.title')} data-testid="voter-intro">
  {#snippet hero()}
    <figure role="presentation">
      <HeroEmoji emoji={t('dynamic.intro.heroEmoji')} />
    </figure>
  {/snippet}

  <p class="text-center">
    {t('dynamic.intro.ingress')}
  </p>
  <ol class="list-circled w-fit" data-testid="voter-intro-steps">
    <!-- Elections are selected either before or after constituencies depending on `startFromConstituencyGroup` -->
    {#if voterCtx.electionsSelectable && !appSettings.elections?.startFromConstituencyGroup}
      <li>{t('dynamic.intro.list.elections')}</li>
    {/if}
    {#if voterCtx.constituenciesSelectable}
      <li>{t('dynamic.intro.list.constituencies')}</li>
    {/if}
    {#if voterCtx.electionsSelectable && appSettings.elections?.startFromConstituencyGroup}
      <li>{t('dynamic.intro.list.elections')}</li>
    {/if}
    <li>{t('dynamic.intro.list.opinions')}</li>
    <li>{t('dynamic.intro.list.results')}</li>
    <li>{t('dynamic.intro.list.details')}</li>
  </ol>

  {#snippet primaryActions()}
    <Button
      href={appSettings.elections?.startFromConstituencyGroup
        ? getRoute.current('Constituencies')
        : getRoute.current('Elections')}
      variant="main"
      icon="next"
      text={t('dynamic.intro.continue')}
      data-testid="voter-intro-start" />
  {/snippet}
</MainContent>
