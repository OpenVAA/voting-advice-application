<script lang="ts">
  import {t} from '$lib/i18n';
  import {surveyLink} from '$lib/utils/analytics/survey';
  import {startEvent} from '$lib/utils/analytics/track';
  import {concatClass} from '$lib/utils/components';
  import {setSurveyStatus, settings, userPreferences} from '$lib/stores';
  import {Button} from '$lib/components/button';
  import type {SurveyBannerProps} from './SurveyBanner.type';

  type $$Props = SurveyBannerProps;

  export let variant: $$Props['variant'] = 'default';

  let showThanks = false;

  function onClick() {
    showThanks = true;
    setSurveyStatus('received');
    startEvent('survey_opened');
  }
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

{#if showThanks || ($settings.analytics?.survey && $userPreferences.survey?.status !== 'received')}
  <div
    {...concatClass(
      $$restProps,
      'grid justify-items-center w-full ' +
        (variant === 'compact' ? '' : 'rounded-lg bg-base-200 p-lg pt-md')
    )}>
    <Button
      href={$surveyLink}
      target="_blank"
      on:click={onClick}
      variant="normal"
      color="accent"
      class="justify-center"
      disabled={showThanks}
      text={showThanks ? $t('survey.thanks') : $t('survey.button')}
      icon="research"
      iconPos="left" />
    {#if variant !== 'compact'}
      <div class="text-center text-sm text-secondary">{$t('survey.info')}</div>
    {/if}
  </div>
{/if}
