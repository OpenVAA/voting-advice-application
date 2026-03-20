<!--
@component
Display a button for filling out a user survey.

### Dynamic component

Accesses `AppContext` to set and read the current survey status and link.

### Properties

- Any valid common properties of a `<Button>` component.

### Bindable properties

- `clicked`: Whether the button has been clicked.

### Callback Props

- `onClick`: Called when the button is clicked.

### Tracking events

- `survey_opened`: Dispatched when the survey link is opened.

### Usage

```tsx
<SurveyButton bind:clicked onClick={() => console.info('Clicked!')}/>
<SurveyButton variant="main"/>
```
-->

<svelte:options runes />

<script lang="ts">
  import { Button } from '$lib/components/button';
  import { getAppContext } from '$lib/contexts/app';
  import { concatClass } from '$lib/utils/components';
  import type { SurveyButtonProps } from './SurveyButton.type';

  let {
    clicked = $bindable(false),
    onClick = undefined,
    ...restProps
  }: SurveyButtonProps = $props();

  const { setSurveyStatus, startEvent, surveyLink, t } = getAppContext();

  function handleClick() {
    if (clicked) return;
    clicked = true;
    setSurveyStatus('received');
    onClick?.();
    startEvent('survey_opened');
  }
</script>

<Button
  href={$surveyLink}
  target="_blank"
  onclick={handleClick}
  variant="normal"
  color="accent"
  disabled={clicked}
  text={clicked ? t('dynamic.survey.thanks') : t('dynamic.survey.button')}
  icon="research"
  iconPos="left"
  data-testid="survey-button"
  {...concatClass(restProps, 'justify-center')} />
