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
  import { getLayoutContext } from '$lib/contexts/layout';
  import { NavGroup, Navigation, NavItem } from '$lib/dynamic-components/navigation';
  import { LanguageSelection } from '../languages';
  import { getAppContext } from '$lib/contexts/app';

  const { navigation } = getLayoutContext(onDestroy);
  const { t } = getAppContext();
</script>

<Navigation slot="nav" on:navFocusOut {...$$restProps}>
  <NavItem
    on:click={navigation.close}
    icon="close"
    text={$t('common.closeMenu')}
    class="pt-16"
    id="drawerCloseButton" />

  <NavGroup>
    <NavItem href="/en/admin" icon="home" text={$t('common.home')} />
    <NavItem href="/en/admin/factor-analysis" icon="create" text="Factor analysis" />
    <NavItem href="/en/admin/question-info" icon="create" text="Question info generation" disabled />
    <NavItem href="/en/admin/argument-condensation" icon="create" text="Argument condensation" disabled />
  </NavGroup>

  <NavGroup>
    <NavItem href="/admin/help" icon="help" text={$t('help.title')} />
    <NavItem href="/admin/privacy" icon="privacy" text={$t('privacy.title')} />
  </NavGroup>

  <LanguageSelection />
</Navigation>
