<svelte:options runes />

<!--
@component
Allows user to log out.

### Dynamic component

Accesses `AuthContext` and `AppContext`.

### Properties

- `redirectTo`: The route to redirect to after logging out. Default: `'Home'`
- Any valid properties of a `<Button>` component.

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

  let { redirectTo = 'Home', ...restProps }: LogoutButtonProps = $props();

  const { getRoute, t } = getAppContext();
  const { logout } = getAuthContext();

  async function handleLogout() {
    await logout();
    await goto($getRoute(redirectTo!), { invalidateAll: true });
  }
</script>

<Button onclick={handleLogout} icon="logout" text={t('common.logout')} color="warning" {...restProps} />
