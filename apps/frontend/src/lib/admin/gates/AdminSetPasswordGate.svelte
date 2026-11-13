<!--
@component The Admin App's set-password view: the shared set-password view, given the Admin App's address, its `setPassword` and its sign-out, with the Admin App's login to leave to after a sign-out that worked. A sign-out that fails stays on the view, and the Admin App's layout shows that it failed.

### Dynamic component

Accesses `AdminContext`. The address is read from the context's `userData`.

### Properties

None.

### Usage

```tsx
<AdminSetPasswordGate />
```
-->

<script lang="ts">
  import { getAdminContext } from '$lib/contexts/admin';
  import { SetPasswordGate } from '$lib/dynamic-components/gates';

  // userData is a reactive accessor: read via adminCtx.userData in the markup, never destructured.
  const adminCtx = getAdminContext();
  const { logout, setPassword } = adminCtx;
</script>

<SetPasswordGate
  email={adminCtx.userData?.email}
  {setPassword}
  {logout}
  redirectTo="AdminAppLogin"
  testId="admin-set-password-gate" />
