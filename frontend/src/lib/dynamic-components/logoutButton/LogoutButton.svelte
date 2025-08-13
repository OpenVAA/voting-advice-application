<!--
@component
Allows user to log out.

### Dynamic component

Accesses `AuthContext` and `AppContext`.

### Usage
```tsx
<LogoutButton />
```
-->

<script lang="ts">
  import { goto } from '$app/navigation';
  import { Button } from '$lib/components/button';
  import { getAppContext } from '$lib/contexts/app';
  import { getAuthContext } from '$lib/contexts/auth';
  import type { LogoutButtonProps } from './LogoutButton.type';

  type $$Props = LogoutButtonProps;

  export let redirectTo: $$Props['redirectTo'] = 'Home';

  ////////////////////////////////////////////////////////////////////
  // Get contexts
  ////////////////////////////////////////////////////////////////////

  const { getRoute, t } = getAppContext();
  const { logout } = getAuthContext();

  async function handleLogout() {
    await logout();
    await goto($getRoute(redirectTo!), { invalidateAll: true });
  }
</script>

<Button on:click={handleLogout} icon="logout" text={$t('common.logout')} color="warning" {...$$restProps} />
