<!--@component
# Language Selector

Reusable component for selecting target language for language-based features (question info, argument condensation, etc.).
Automatically hides if only one language is available.

@prop {string} selectedLanguage - The currently selected language code (bindable)
@prop {string} currentLocale - The current locale from route params (used as default)
-->

<script lang="ts">
  import { getAdminContext } from '$lib/contexts/admin';

  const { appSettings, t } = getAdminContext();

  export let selectedLanguage: string;
  export let currentLocale: string;

  // Get supported locales from appSettings
  $: supportedLocales = $appSettings.supportedLocales || [];

  // Auto-select current locale on mount if no selection
  $: if (!selectedLanguage && currentLocale) {
    selectedLanguage = currentLocale;
  }

  // Hide selector if only one language available
  $: showSelector = supportedLocales.length > 1;
</script>

{#if showSelector}
  <div class="form-control w-full">
    <label for="target-language" class="label">
      <span class="label-text">{$t('adminApp.languageFeatures.targetLanguage.label')}</span>
    </label>
    <select
      id="target-language"
      name="language"
      class="select select-bordered w-full"
      bind:value={selectedLanguage}>
      {#each supportedLocales as locale}
        <option value={locale.code}>{locale.name}</option>
      {/each}
    </select>
    <label class="label">
      <span class="label-text-alt text-neutral">{$t('adminApp.languageFeatures.targetLanguage.help')}</span>
    </label>
  </div>
{:else}
  <!-- Hidden input to ensure language is always submitted -->
  <input type="hidden" name="language" value={selectedLanguage} />
{/if}
