<script>
  import {getContext} from 'svelte';
  import {Loading} from '$lib/components/loading';
  import {LoginPage} from '$lib/candidate/templates/login';

  const {user, token} = getContext('auth');
  export let showLogin = false;
</script>

<!--
@component
Require candidates to be logged in to view the children of this component.

### Slots

- default: The content to show when the user is logged in.
- not-logged-in: The content to show when the user is not logged in.

### Properties

- showLogin (optional):
  - If true, the component will render the login page when the user is not logged in.
  - If false, the children of this component will be hidden when the user is not logged in.
  - Default value is false.

### Usage

```tsx
<RequireLogin>
  <p>Example content</p>
</RequireLogin>
```
-->

{#if $user}
  <slot />
{:else if ($token === undefined || ($token && !$user)) && showLogin}
  <div class="mt-100 flex h-screen flex-col items-center">
    <Loading showLabel />
  </div>
{:else if showLogin}
  <LoginPage />
{:else}
  <slot name="not-logged-in" />
{/if}
