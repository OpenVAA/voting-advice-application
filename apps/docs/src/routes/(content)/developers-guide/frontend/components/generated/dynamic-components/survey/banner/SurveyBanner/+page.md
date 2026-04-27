# SurveyBanner

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

## Source

[frontend/src/lib/dynamic-components/survey/banner/SurveyBanner.svelte](https://github.com/OpenVAA/voting-advice-application/blob/main/frontend/src/lib/dynamic-components/survey/banner/SurveyBanner.svelte)

[frontend/src/lib/dynamic-components/survey/banner/SurveyBanner.type.ts](https://github.com/OpenVAA/voting-advice-application/blob/main/frontend/src/lib/dynamic-components/survey/banner/SurveyBanner.type.ts)
