<!--
@component
A template part that language selection options for the navigation menu if these are available.

### Dynamic component

- Accesses `getRoute` from `AppContext`.

### Usage

```tsx
<LanguageSelection/>
```
-->

<script lang="ts">
  import { getAppContext } from '$lib/contexts/app';
  import { NavGroup, NavItem } from '$lib/dynamic-components/navigation';
  import { assertTranslationKey } from '$lib/i18n/utils/assertTranslationKey';

  ////////////////////////////////////////////////////////////////////
  // Get contexts
  ////////////////////////////////////////////////////////////////////

  const { getRoute, locale: currentLocale, locales, t } = getAppContext();
</script>

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
