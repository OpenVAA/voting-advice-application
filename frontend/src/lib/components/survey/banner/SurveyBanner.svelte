<script lang="ts">
  import {t} from '$lib/i18n';
  import {concatClass} from '$lib/utils/components';
  import {settings, userPreferences} from '$lib/stores';
  import {SurveyButton} from '..';
  import type {SurveyBannerProps} from './SurveyBanner.type';

  type $$Props = SurveyBannerProps;

  export let variant: $$Props['variant'] = 'default';

  let clicked: boolean;
</script>

<!--
@component
Display a prompt for filling out a user survey if the setting is enabled and the user has not answered the survey yet. Otherwise, nothing will be rendered.

### Properties

- `variant`: The layout variant of the banner. Can be either `default` or `compact`. @default `default`
- Any valid common attributes of a `<div>` element.

### Usage

```tsx
<SurveyBanner/>
<SurveyBanner variant="compact"/>
```
-->

{#if clicked || ($settings.analytics?.survey && $userPreferences.survey?.status !== 'received')}
  <div
    {...concatClass(
      $$restProps,
      'grid justify-items-center w-full ' +
        (variant === 'compact' ? '' : 'rounded-lg bg-base-200 p-lg pt-md')
    )}>
    <SurveyButton bind:clicked />
    {#if variant !== 'compact'}
      <div class="text-center text-sm text-secondary">{$t('dynamic.survey.info')}</div>
    {/if}
  </div>
{/if}
