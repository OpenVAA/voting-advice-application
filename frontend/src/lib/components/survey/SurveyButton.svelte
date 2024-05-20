<script lang="ts">
  import {createEventDispatcher} from 'svelte';
  import {t} from '$lib/i18n';
  import {setSurveyStatus} from '$lib/stores';
  import {surveyLink} from '$lib/utils/analytics/survey';
  import {startEvent} from '$lib/utils/analytics/track';
  import {concatClass} from '$lib/utils/components';
  import {Button} from '$lib/components/button';
  import type {SurveyButtonProps} from './SurveyButton.type';

  type $$Props = SurveyButtonProps;

  export let clicked: $$Props['clicked'] = false;

  const dispatch = createEventDispatcher<{click: null}>();

  function onClick() {
    if (clicked) return;
    clicked = true;
    setSurveyStatus('received');
    dispatch('click');
    startEvent('survey_opened');
  }
</script>

<!--
@component
Display a button for filling out a user survey.

### Properties

- Any valid common properties of a `<Button>` component.

### Bindable properties

- `clicked`: Whether the button has been clicked.

### Events

- `click`: Dispatched when the button is clicked. The event has no details.

### Usage

```tsx
<SurveyButton bind:clicked on:click={() => console.info('Clicked!')}/>
<SurveyButton variant="main"/>
```
-->

<Button
  href={$surveyLink}
  target="_blank"
  on:click={onClick}
  variant="normal"
  color="accent"
  disabled={clicked}
  text={clicked ? $t('survey.thanks') : $t('survey.button')}
  icon="research"
  iconPos="left"
  {...concatClass($$restProps, 'justify-center')} />
