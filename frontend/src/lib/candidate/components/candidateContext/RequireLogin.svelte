<script lang="ts">
  import { getContext } from 'svelte';
  import { LoadingSpinner } from '$candidate/components/loadingSpinner';
  import { LoginPage } from '$lib/candidate/templates/login';
  import { Warning } from '$lib/components/warning/index';
  import { t } from '$lib/i18n';
  import { BasicPage } from '$lib/templates/basicPage';
  import type { CandidateContext } from '$lib/utils/candidateContext';

  const { user, token } = getContext<CandidateContext>('candidate');
  export let showLogin = false;
  $: candidate = $user?.candidate;
  $: nomination = candidate?.nomination;
  $: election = nomination?.election;

  let error: string | undefined;
  $: {
    if (!candidate) error = $t('candidateApp.error.userNoCandidate');
    else if (!nomination) error = $t('candidateApp.error.candidateNoNomination');
    else if (!election) error = $t('candidateApp.error.nominationNoElection');
    else error = undefined;
  }
</script>

<!--
@component
Require candidates to be logged in to view the children of this component.
Shows an error message if there is no candidate associated with the user.

### Slots

- `default`: The content to show when the user is logged in.
- `not-logged-in`: The content to show when the user is not logged in.

### Properties

- `showLogin` (optional):
  If true, the component will render the login page when the user is not logged in.
  If false, the children of this component will be hidden when the user is not logged in.

### Usage

```tsx
<RequireLogin>
  <p>Example content</p>
</RequireLogin>
```
-->

{#if $user}
  {#if !error}
    <slot />
  {:else}
    <BasicPage title="Error">
      <Warning display slot="heading">
        <p>{error}</p>
      </Warning>
    </BasicPage>
  {/if}
{:else if ($token === undefined || ($token && !$user)) && showLogin}
  <LoadingSpinner />
{:else if showLogin}
  <LoginPage />
{:else}
  <slot name="not-logged-in" />
{/if}
