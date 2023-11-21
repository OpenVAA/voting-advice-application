<script lang="ts">
  import {authContext, loadLocalStorage} from '$lib/utils/authenticationStore';
  import {onMount, setContext} from 'svelte';

  setContext('auth', authContext);
  const token = authContext.token;

  onMount(() => {
    loadLocalStorage();
    $token && authContext.loadUserData();
  });
</script>

<!--
@component
Authentication provider provides the authentication context to all its children.

### Contexts

- auth: The authentication context

### Slots

- default: The children of the component

### Usage

```tsx
<AuthenticationProvider>
  <p>Example content</p>
</AuthenticationProvider>
```
-->

<slot />
