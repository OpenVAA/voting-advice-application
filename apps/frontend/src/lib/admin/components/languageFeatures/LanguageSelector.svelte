<!--
@component
Reusable component for selecting target language for language-based features (question info, argument condensation, etc.). Automatically selected if only one language is available.

### Properties

- `selected`: The selected language value.
- `name`: The name of the form element. Default: `'language'`
- `id`: The id of the select element.
- `options`: The available language options.
- Any valid attributes of a `Select` component

### Usage

```tsx
<LanguageSelector bind:selected={targetLanguage} />
```
-->

<svelte:options runes />

<script lang="ts">
  import { Select } from '$lib/components/select';
  import { getComponentContext } from '$lib/contexts/component';
  import { assertTranslationKey } from '$lib/i18n/utils';
  import { getUUID } from '$lib/utils/components';
  import type { LanguageSelectorProps } from './LanguageSelector.type';

  const { locale, locales, t } = getComponentContext();

  let { selected = $bindable($locale), name = 'language', id = getUUID(), ...restProps }: LanguageSelectorProps = $props();

  const options = $derived($locales.map((l) => ({
    id: l,
    label: t(assertTranslationKey(`lang.${l}`))
  })));
</script>

<div class="w-full">
  <label for={id} class="label">
    {t('adminApp.languageFeatures.targetLanguage.label')}
  </label>
  <Select {id} {name} bind:selected {options} class="max-w-none" autocomplete="off" />
  <div class="mt-md text-secondary text-sm">
    {t('adminApp.languageFeatures.targetLanguage.help')}
  </div>
</div>
