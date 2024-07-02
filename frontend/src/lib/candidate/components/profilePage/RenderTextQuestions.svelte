<script lang="ts">
  import MultilangTextInput from '$lib/candidate/components/textArea/MultilangTextInput.svelte';
  import {locales} from '$lib/i18n';

  export let question: QuestionProps;
  export let questionsLocked: boolean | undefined;
  export let text: LocalizedString = {};

  let textArea: MultilangTextInput; // Used to clear the local storage from the parent component
  let localStorageId = `candidate-app-${question.text}`;

  export const clearLocalStorage = () => {
    if (!localStorageId) {
      return;
    }
    for (const locale of $locales) {
      localStorage.removeItem(localStorageId + '-' + locale);
    }
  };

  export let previousText: AnswePropsValue = ''; // Used to detect changes in the manifesto
  let previouslySavedMultilang: LocalizedString = {};

  if (
    typeof previousText === 'object' &&
    previousText !== null &&
    !Array.isArray(previousText) &&
    previousText instanceof Date === false
  ) {
    previouslySavedMultilang = previousText;
  }
</script>

<!--
@component
A component for rendering a text question.

### Bindable variables

- `text`: The text value.

### Bindable function

- `clearLocalStorage`: A function that clears the local storage.

### Properties

- `question`: The question object.
- `questionsLocked`: A boolean value that indicates if the questions are locked.
- `previousText`: The previous text value. Optional.


### Usage

```tsx
<RenderTextQuestions
  question={question}
  questionsLocked={questionsLocked}
  bind:text={text}
  bind:clearLocalStorage={clearLocalStorage}
  previousText={previousText} />
```
-->

<MultilangTextInput
  locked={questionsLocked}
  id={question.text}
  {localStorageId}
  {previouslySavedMultilang}
  placeholder="—"
  bind:multilangText={text}
  bind:this={textArea} />
