<script lang="ts">
  import { NavGroup, NavItem } from '$lib/dynamic-components/navigation';
  import { locale as currentLocale, locales, t } from '$lib/i18n';
  import { assertTranslationKey } from '$lib/i18n/utils/assertTranslationKey';
  import { getRoute } from '$lib/utils/legacy-navigation';
</script>

<!--
@component
A template part that language selection options for the navigation menu if these are available.

### Properties

- The component accepts no properties.

### Usage

```tsx
<LanguageSelection/>
```
-->

<!-- Only show the language selection if there are multiple locales to choose from -->
{#if $locales.length > 1}
  <NavGroup title={$t('common.language.select')}>
    {#each $locales as locale}
      <NavItem
        href={$getRoute({ locale })}
        icon="language"
        text={$t(assertTranslationKey(`lang.${locale}`))}
        disabled={locale === $currentLocale} />
    {/each}
  </NavGroup>
{/if}
