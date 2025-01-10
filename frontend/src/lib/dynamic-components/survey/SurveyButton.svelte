<!--
@component
Display a button for filling out a user survey.

### Dynamic component

Accesses `AppContext` to set and read the current survey status and link.

### Properties

- Any valid common properties of a `<Button>` component.

### Bindable properties

- `clicked`: Whether the button has been clicked.

### Events

- `click`: Dispatched when the button is clicked. The event has no details.

### Tracking events

- `survey_opened`: Dispatched when the survey link is opened.

### Usage

```tsx
<SurveyButton bind:clicked on:click={() => console.info('Clicked!')}/>
  <SurveyButton variant="main"/>
  ```
-->

<script lang="ts">
  import { createEventDispatcher } from 'svelte';
  import { Button } from '$lib/components/button';
  import { getAppContext } from '$lib/contexts/app';
  import { concatClass } from '$lib/utils/components';
  import type { SurveyButtonProps } from './SurveyButton.type';

  type $$Props = SurveyButtonProps;

  export let clicked: $$Props['clicked'] = false;

  const { setSurveyStatus, startEvent, surveyLink, t } = getAppContext();

  const dispatch = createEventDispatcher<{ click: null }>();

  function handleClick() {
    if (clicked) return;
    clicked = true;
    setSurveyStatus('received');
    dispatch('click');
    startEvent('survey_opened');
  }
</script>

<Button
  href={$surveyLink}
  target="_blank"
  on:click={handleClick}
  variant="normal"
  color="accent"
  disabled={clicked}
  text={clicked ? $t('dynamic.survey.thanks') : $t('dynamic.survey.button')}
  icon="research"
  iconPos="left"
  {...concatClass($$restProps, 'justify-center')} />
