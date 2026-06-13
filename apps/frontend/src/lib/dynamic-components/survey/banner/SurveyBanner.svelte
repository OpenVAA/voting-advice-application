<!--
@component
Display a prompt for filling out a user survey if the setting is enabled and the user has not answered the survey yet. Otherwise, nothing will be rendered.

### Dynamic component

Accesses `AppContext` to get `appSettings` and `userPreferences`.

### Properties

- `variant`: The layout variant of the banner. Can be either `default` or `compact`. @default `default`
- Any valid common attributes of a `<div>` element.

### Usage

```tsx
<SurveyBanner/>
<SurveyBanner variant="compact"/>
```
-->

<script lang="ts">
  import { getAppContext } from '$lib/contexts/app';
  import { concatClass } from '$lib/utils/components';
  import { SurveyButton } from '..';
  import type { SurveyBannerProps } from './SurveyBanner.type';

  let { variant = 'default', ...restProps }: SurveyBannerProps = $props();

  const ctx = getAppContext();
  const { userPreferences, t } = ctx;
  // appSettings is a reactive accessor (Phase 113 flatten) — read via ctx.X, never destructure.
  const appSettings = $derived(ctx.appSettings);
  let clicked: boolean = $state(false);
</script>

{#if clicked || (appSettings.survey && userPreferences.current.survey?.status !== 'received')}
  <div
    data-testid="survey-banner"
    {...concatClass(
      restProps,
      'grid justify-items-center w-full ' + (variant === 'compact' ? '' : 'rounded-lg bg-base-200 p-lg pt-md')
    )}>
    <!-- bind: keep — Pattern 2: SurveyButton.clicked is $bindable(false) -->
    <SurveyButton bind:clicked />
    {#if variant !== 'compact'}
      <div class="small-info text-center">{t('dynamic.survey.info')}</div>
    {/if}
  </div>
{/if}
