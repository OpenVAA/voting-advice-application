<script lang="ts">
  import MultilangTextInput from '$lib/candidate/components/textArea/MultilangTextInput.svelte';
  import {locales} from '$lib/i18n';
  import type {InputFieldProps} from './InputField.type';

  type $$Props = InputFieldProps<LocalizedString>;

  export let question: $$Props['question'];
  export let headerText: $$Props['headerText'] = question.text;
  export let locked: $$Props['locked'] = false;
  export let text: $$Props['value'] = {};

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

  export let previousText: AnswerPropsValue = ''; // Used to detect changes in the text value
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
A component for a text question that can be answered.

### Bindable variables

- `text`: The text value.

### Bindable function

- `clearLocalStorage`: A function that clears the local storage.

### Properties

- `question`: The question object.
- `headerText`: The header text. Defaults to the question's text. Optional.
- `questionsLocked`: A boolean value that indicates if the questions are locked.
- `previousText`: The previous text value. Optional.


### Usage

```tsx
<TextInput
  question={question}
  questionsLocked={questionsLocked}
  previousText={previousText}
  bind:text={text}
  bind:clearLocalStorage={clearLocalStorage}
   />
```
-->

<MultilangTextInput
  {locked}
  id={question.text}
  {localStorageId}
  {previouslySavedMultilang}
  {headerText}
  placeholder="—"
  bind:multilangText={text}
  bind:this={textArea} />
