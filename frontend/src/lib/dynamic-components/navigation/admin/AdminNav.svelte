<!--
@component
A template part that outputs the navigation menu for the Admin App for use in `Layout`.

### Dynamic component

- Accesses the `AdminContext`.

### Properties

- Any valid properties of a `Navigation` component.

### Usage

```tsx
<AdminNav>
  <NavItem slot="close" on:click={closeMenu} icon="close" text="Close"/>
</AdminNav>
```
-->

<script lang="ts">
  import { onDestroy } from 'svelte';
  import { getAppContext } from '$lib/contexts/app';
  import { getLayoutContext } from '$lib/contexts/layout';
  import { NavGroup, Navigation, NavItem } from '$lib/dynamic-components/navigation';
  import { LanguageSelection } from '../languages';

  const { navigation } = getLayoutContext(onDestroy);
  const { t, getRoute } = getAppContext();
</script>

<Navigation slot="nav" on:navFocusOut {...$$restProps}>
  <NavItem
    on:click={navigation.close}
    icon="close"
    text={$t('common.closeMenu')}
    class="pt-16"
    id="drawerCloseButton" />

  <NavGroup>
    <NavItem href={$getRoute('AdminHome')} icon="home" text={$t('adminApp.common.home')} />
    <NavItem href={$getRoute('AdminFactorAnalysis')} icon="create" text={$t('adminApp.factorAnalysis.title')} />
    <NavItem href={$getRoute('AdminQuestionInfo')} icon="create" text={$t('adminApp.questionInfo.title')} />
    <NavItem
      href={$getRoute('AdminArgumentCondensation')}
      icon="create"
      text={$t('adminApp.argumentCondensation.title')}
      disabled />
  </NavGroup>

  <NavGroup>
    <NavItem href={$getRoute('AdminHelp')} icon="help" text={$t('help.title')} disabled />
    <NavItem href={$getRoute('AdminPrivacy')} icon="privacy" text={$t('privacy.title')} disabled />
  </NavGroup>

  <LanguageSelection />
</Navigation>
