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
  import { localizeHref } from '$lib/paraglide/runtime';
  import type { locales as paraglideLocales } from '$lib/paraglide/runtime';

  ////////////////////////////////////////////////////////////////////
  // Get contexts
  ////////////////////////////////////////////////////////////////////

  const ctx = getAppContext();
  const { locales, t } = ctx;
  // locale is a reactive accessor (see phase 113 flatten) — read via ctx.locale, never destructure.
  const currentLocale = $derived(ctx.locale);
</script>

<!-- Only show the language selection if there are multiple locales to choose from -->
{#if locales.current.length > 1}
  <NavGroup title={t('common.language.select')} data-testid="lang-selector">
    {#each locales.current as loc}
      <NavItem
        data-sveltekit-reload
        href={localizeHref(page.url.pathname, { locale: loc as (typeof paraglideLocales)[number] })}
        icon="language"
        text={t(assertTranslationKey(`lang.${loc}`))}
        disabled={loc === currentLocale} />
    {/each}
  </NavGroup>
{/if}
