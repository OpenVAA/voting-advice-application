<script lang="ts">
  import { TextArea, InputField } from '$candidate/components/textArea';
  import { Button } from '$lib/components/button';
  import { Field, FieldGroup } from '$lib/components/common/form';
  import { locale as currentLocale, locales, t } from '$lib/i18n';
  import type { TextAreaProps, MultilangTextAreaProps } from './TextArea.type';

  type $$Props = TextAreaProps & MultilangTextAreaProps;
  export let id: $$Props['id'];
  export let multilangText: $$Props['multilangText'];

  export let headerText: $$Props['headerText'] = undefined;
  export let localStorageId: $$Props['localStorageId'] = undefined;
  export let previouslySavedMultilang: $$Props['previouslySavedMultilang'] = undefined;
  export let rows: $$Props['rows'] = 4;
  export let disabled: $$Props['disabled'] = false;
  export let compact: $$Props['compact'] = false;
  export let placeholder: $$Props['placeholder'] = '';
  export let locked: $$Props['locked'] = false;

  export const deleteLocal = () => {
    if (!localStorageId) {
      return;
    }
    for (const locale of $locales) {
      localStorage.removeItem(localStorageId + '-' + locale);
    }
  };

  // Locked indicates that the text can no longer be edited
  // but still allows the user to view entered text including translations whereas
  // disabled is used to indicate that the text area cannot be used yet
  $: disabled = disabled && !locked; // Locked takes precedence over disabled

  let translationsShown = false;
  $: translationsShown = translationsShown && !disabled; // Hide translations if disabled
</script>

<!--
@component
A text area that can be used to input text in multiple languages.
Uses either a text area or an input field for each language.
Text is given as a LocalizedString object with the language code as the key.

The primary language is always shown, other languages can be toggled.
If all languages are shown, the header is shown for each language.

### Slots
- `header` - Optional header for the text area, can be used instead of the default one.

### Properties
- `id` (required): The id of the text area.
- `multilangText` (required): The text in multiple languages as a LocalizedString object
- `headerText` (optional): The header text.
- `localStorageId` (optional): The local storage id of the text area. If provided, the text is saved to local storage periodically.
- `previouslySavedMultilang` (optional): The previously saved text in multiple languages. Is shown if there is no locally saved text.
- `rows` (optional): The number of rows of the text area.
- `disabled` (optional): If the text area is disabled. This is used to indicate that the text area cannot be used yet.
- `compact` (optional): If the text area is a multiline text area or a input field.
- `placeholder` (optional): The placeholder of the text area. Shown for non-current locale text areas.
- `locked` (optional): If the text area is locked and has a lock icon. This is used to indicate that the text can no longer be edited.

### Bindable functions
- `deleteLocal`: Deletes the local storage for the text area. Used to clear the local storage from a parent component.

### Usage

Text area variant
```tsx
<MultilangTextArea
  id="example-id"
  headerText="Example Header"
  localStorageId="example-local-storage-id"
  previouslySavedMultilang={answer?.openAnswer}
  disabled={false}
  placeholder="—"
  bind:multilangText={openAnswer}
  bind:this={openAnswerTextArea} />
```

Input field variant
```tsx
<MultilangTextArea
  id="example-id"
  headerText="Example Header"
  placeholder="—"
  bind:multilangText={openAnswer}
  compact={true} />
```
-->

<div class="m-12 w-full">
  {#if headerText && !compact}
    <label for={id} class="small-label mx-10 my-6 p-0">{headerText}</label>
  {:else}
    <slot name="header" />
  {/if}

  <FieldGroup>
    {#if multilangText}
      <!-- Current locale text area is always shown -->
      <Field>
        {#if compact}
          <InputField
            bind:text={multilangText[$currentLocale]}
            id={translationsShown ? id + '-' + $currentLocale : id}
            {headerText}
            {disabled}
            {locked} />
        {:else}
          <TextArea
            bind:text={multilangText[$currentLocale]}
            id={translationsShown ? id + '-' + $currentLocale : id}
            headerText={translationsShown ? $t(`lang.${$currentLocale}`) : undefined}
            localStorageId={localStorageId + '-' + $currentLocale}
            previouslySaved={previouslySavedMultilang?.[$currentLocale]}
            {rows}
            {disabled}
            {locked} />
        {/if}
      </Field>

      {#if translationsShown}
        {#each $locales.filter((locale) => locale !== $currentLocale) as locale}
          <Field>
            {#if compact}
              <InputField
                id={id + '-' + locale}
                bind:text={multilangText[locale]}
                headerText={$t(`lang.${locale}`)}
                {placeholder}
                {disabled}
                {locked} />
            {:else}
              <TextArea
                id={id + '-' + locale}
                bind:text={multilangText[locale]}
                headerText={$t(`lang.${locale}`)}
                localStorageId={localStorageId + '-' + locale}
                previouslySaved={previouslySavedMultilang?.[locale]}
                {rows}
                {disabled}
                {placeholder}
                {locked} />
            {/if}
          </Field>
        {/each}
      {/if}
    {/if}
  </FieldGroup>

  {#if translationsShown}
    <p class="px-6 text-sm">{$t('candidateApp.textarea.info')}</p>
  {/if}

  <!-- Toggle whether translations are shown -->
  <Button
    type="button"
    on:click={() => (translationsShown = !translationsShown)}
    text={translationsShown ? $t('candidateApp.textarea.hide') : $t('candidateApp.textarea.show')}
    variant="normal"
    icon={translationsShown ? 'hide' : 'language'}
    {disabled}
    iconPos="left" />
</div>
