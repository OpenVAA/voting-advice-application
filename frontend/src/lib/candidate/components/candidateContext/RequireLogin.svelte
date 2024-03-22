<script lang="ts">
  import {LoginPage} from '$lib/candidate/templates/login';
  import {getContext} from 'svelte';
  import type {CandidateContext} from '$lib/utils/candidateStore';

  const {userStore, tokenStore} = getContext<CandidateContext>('candidate');
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

{#if $userStore}
  <slot />
{:else if ($tokenStore === undefined || ($tokenStore && !$userStore)) && showLogin}
  <div class="mt-100 flex h-screen flex-col items-center">
    <span class="loading loading-spinner loading-lg" />
  </div>
{:else if showLogin}
  <LoginPage />
{:else}
  <slot name="not-logged-in" />
{/if}
