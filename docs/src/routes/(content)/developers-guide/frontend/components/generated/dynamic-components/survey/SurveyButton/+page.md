# SurveyButton

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

## Source

[frontend/src/lib/dynamic-components/survey/SurveyButton.svelte](https://github.com/OpenVAA/voting-advice-application/blob/main/frontend/src/lib/dynamic-components/survey/SurveyButton.svelte)

[frontend/src/lib/dynamic-components/survey/SurveyButton.type.ts](https://github.com/OpenVAA/voting-advice-application/blob/main/frontend/src/lib/dynamic-components/survey/SurveyButton.type.ts)
