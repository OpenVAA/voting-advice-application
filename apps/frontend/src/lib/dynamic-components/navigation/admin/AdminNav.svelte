<!--
@component
A template part that outputs the navigation menu for the Admin App for use in `Layout`.

### Dynamic component

- Accesses the `AdminContext` in the future.

### Properties

- Any valid properties of a `Navigation` component.

### Usage

```tsx
<AdminNav>
  <NavItem onclick={closeMenu} icon="close" text="Close"/>
</AdminNav>
```
-->

<script lang="ts">
  import { onDestroy } from 'svelte';
  import { getAdminContext } from '$lib/contexts/admin';
  import { getLayoutContext } from '$lib/contexts/layout';
  import { NavGroup, Navigation, NavItem } from '$lib/dynamic-components/navigation';
  import { LanguageSelection } from '../languages';
  import type { AdminNavProps } from './AdminNav.type';

  let { onKeyboardFocusOut, ...restProps }: AdminNavProps = $props();

  const { navigation } = getLayoutContext(onDestroy);
  const { isAuthenticated, t, getRoute } = getAdminContext();
</script>

<Navigation {onKeyboardFocusOut} {...restProps}>
  <NavItem onclick={navigation.close} icon="close" text={t('common.closeMenu')} class="pt-16" id="drawerCloseButton" />

  {#if isAuthenticated}
    <NavGroup>
      <!-- TODO: i18n the Jobs Monitoring text -->
      <NavItem href={$getRoute('AdminAppHome')} icon="home" text={t('adminApp.common.home')} />
      <NavItem href={$getRoute('AdminAppJobs')} icon="list" text="Jobs Monitoring" />
      <NavItem href={$getRoute('AdminAppFactorAnalysis')} icon="create" text={t('adminApp.factorAnalysis.title')} />
      <NavItem href={$getRoute('AdminAppQuestionInfo')} icon="create" text={t('adminApp.questionInfo.title')} />
      <NavItem
        href={$getRoute('AdminAppArgumentCondensation')}
        icon="create"
        text={t('adminApp.argumentCondensation.title')} />
    </NavGroup>
  {:else}
    <NavGroup>
      <NavItem href={$getRoute('AdminAppLogin')} icon="login" text={t('common.login')} />
    </NavGroup>
  {/if}

  <LanguageSelection />
</Navigation>
