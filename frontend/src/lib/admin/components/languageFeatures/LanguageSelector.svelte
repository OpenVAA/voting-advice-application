<!--@component
# Language Selector

Reusable component for selecting target language for language-based features (question info, argument condensation, etc.).
Automatically selected if only one language is available.

-->

<script lang="ts">
  import { Select } from '$lib/components/select';
  import { getComponentContext } from '$lib/contexts/component';
  import { assertTranslationKey } from '$lib/i18n/utils';
  import { getUUID } from '$lib/utils/components';
  import type { LanguageSelectorProps } from './LanguageSelector.type';

  const { locale, locales, t } = getComponentContext();

  type $Props = LanguageSelectorProps;

  export let selected: $Props['selected'] = $locale;
  export let name: $Props['name'] = 'language';
  export let id: $Props['id'] = getUUID();

  let options: LanguageSelectorProps['options'];
  $: options = $locales.map((l) => ({
    id: l,
    label: $t(assertTranslationKey(`lang.${l}`))
  }));
</script>

<div class="form-control w-full">
  <label for={id} class="label">
    {$t('adminApp.languageFeatures.targetLanguage.label')}
  </label>
  <Select {id} {name} bind:selected {options} class="max-w-none" autocomplete="off" />
  <div class="text-secondary mt-md text-sm">
    {$t('adminApp.languageFeatures.targetLanguage.help')}
  </div>
</div>
