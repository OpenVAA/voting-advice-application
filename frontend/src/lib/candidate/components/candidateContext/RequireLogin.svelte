<script lang="ts">
  import {LoginPage} from '$lib/candidate/templates/login';
  import {getContext} from 'svelte';
  import type {CandidateContext} from '$lib/utils/candidateStore';
  import type {Candidate} from '$lib/types/candidateAttributes';
  import BasicPage from '$lib/templates/basicPage/BasicPage.svelte';
  import Warning from '$lib/components/warning/Warning.svelte';
  import {t} from '$lib/i18n';

  const {userStore, tokenStore} = getContext<CandidateContext>('candidate');
  export let showLogin = false;
  let candidate = <Candidate | undefined>undefined;
  userStore.subscribe((value) => (candidate = value?.candidate));
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
  {#if candidate != undefined}
    <slot />
  {:else}
    <BasicPage title="">
      <Warning display slot="heading">
        <p>{$t('candidateApp.error.userNoCandidateError')}</p>
      </Warning>
    </BasicPage>
  {/if}
{:else if ($tokenStore === undefined || ($tokenStore && !$userStore)) && showLogin}
  <div class="mt-100 flex h-screen flex-col items-center">
    <span class="loading loading-spinner loading-lg" />
  </div>
{:else if showLogin}
  <LoginPage />
{:else}
  <slot name="not-logged-in" />
{/if}
