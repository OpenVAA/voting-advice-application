<!--
@component
A template part that language selection options for the navigation menu if these are available.

### Dynamic component

- Uses Paraglide `localizeHref` for language switching.

### Usage

```tsx
<LanguageSelection/>
```
-->

<script lang="ts">
  import { page } from '$app/state';
  import { getAppContext } from '$lib/contexts/app';
  import { NavGroup, NavItem } from '$lib/dynamic-components/navigation';
  import { assertTranslationKey } from '$lib/i18n/utils/assertTranslationKey';
  import { locales as paraglideLocales, localizeHref } from '$lib/paraglide/runtime';

  ////////////////////////////////////////////////////////////////////
  // Get contexts
  ////////////////////////////////////////////////////////////////////

  const { locale: currentLocale, locales, t } = getAppContext();
</script>

<!-- Only show the language selection if there are multiple locales to choose from -->
{#if locales.length > 1}
  <NavGroup title={t('common.language.select')}>
    {#each locales as loc}
      <NavItem
        data-sveltekit-reload
        href={localizeHref(page.url.pathname, { locale: loc as (typeof paraglideLocales)[number] })}
        icon="language"
        text={t(assertTranslationKey(`lang.${loc}`))}
        disabled={loc === currentLocale} />
    {/each}
  </NavGroup>
{/if}
