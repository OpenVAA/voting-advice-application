<script lang="ts">
  import {locale as currentLocale, locales, t} from '$lib/i18n';
  import {getRoute} from '$lib/utils/navigation';
  import {NavGroup, NavItem} from '$lib/components/navigation';
  import {assertTranslationKey} from '$lib/i18n/utils/assertTranslationKey';
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
        href={$getRoute({locale})}
        icon="language"
        text={$t(assertTranslationKey(`lang.${locale}`))}
        disabled={locale === $currentLocale} />
    {/each}
  </NavGroup>
{/if}
