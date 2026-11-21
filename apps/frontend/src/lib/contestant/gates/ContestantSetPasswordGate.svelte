<!--
@component The Contestant App's set-password view: the shared set-password view, given the Contestant App's address, its `setPassword` and its Log out, which leaves to the Contestant App's login. A saved password ends the entry flow.

### Dynamic component

Accesses `ContestantContext`. The address is read from the context's `user`.

### Properties

None.

### Usage

```tsx
<ContestantSetPasswordGate />
```
-->

<script lang="ts">
  import { getContestantContext } from '$lib/contexts/contestant/contestantContext.svelte';
  import { SetPasswordGate } from '$lib/dynamic-components/gates';

  // user is a reactive accessor: read via contestantCtx.user in the markup, never destructured.
  const contestantCtx = getContestantContext();
  const { clearEntryFlow, logout, setPassword } = contestantCtx;
</script>

<SetPasswordGate
  email={contestantCtx.user?.email}
  {setPassword}
  {logout}
  onSaved={clearEntryFlow}
  testId="contestant-set-password-gate" />
