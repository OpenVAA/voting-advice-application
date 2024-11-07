<script lang="ts">
  import MultilangTextInput from '$lib/candidate/components/textArea/MultilangTextInput.svelte';
  import { locales } from '$lib/i18n';
  import type { InputFieldProps } from './InputField.type';

  type $$Props = InputFieldProps<LocalizedString>;

  export let questionId: $$Props['questionId'];
  export let headerText: $$Props['headerText'] = '';
  export let locked: $$Props['locked'] = false;
  export let compact: $$Props['compact'] = false;
  export let value: $$Props['value'] = {};
  export let previousValue: $$Props['previousValue'] = {};
  export let onChange: $$Props['onChange'] = undefined;

  let textArea: MultilangTextInput; // Used to clear the local storage from the parent component
  let localStorageId = `candidate-app-${questionId}`;

  export function clearLocalStorage() {
    if (!localStorageId) {
      return;
    }
    for (const locale of $locales) {
      localStorage.removeItem(localStorageId + '-' + locale);
    }
  }

  let previouslySavedMultilang: LocalizedString = {};
  if (previousValue) {
    previouslySavedMultilang = previousValue;
  }

  let multilangText: LocalizedString = {};
  if (value) {
    multilangText = value;
  }

  $: {
    if (multilangText) {
      onChange?.({ questionId, value: multilangText });
    }
  }
</script>

<!--
@component
A component for a text question that can be answered.

### Bindable function

- `clearLocalStorage`: A function that clears the local storage.

### Properties

- `question`: The question object.
- `headerText`: The header text. Defaults to the question's text. Optional.
- `locked`: A boolean value that indicates if the questions are locked.
- `value`: The text value.
- `previousText`: The previous text value. Optional.
- `onChange`: A function that is called when the value changes.

### Usage

```tsx
<TextInput
  question={question}
  locked={locked}
  previousText={previousText}
  bind:clearLocalStorage={clearLocalStorage}
  value={value}
  onChange={onChange}
   />
```
-->

<MultilangTextInput
  {locked}
  id={questionId}
  {localStorageId}
  {previouslySavedMultilang}
  {headerText}
  {compact}
  placeholder="—"
  bind:multilangText
  bind:this={textArea} />
