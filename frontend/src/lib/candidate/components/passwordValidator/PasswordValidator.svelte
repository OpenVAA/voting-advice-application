<script lang="ts">
  import {tweened} from 'svelte/motion';
  import {cubicOut} from 'svelte/easing';
  import {t} from '$lib/i18n';
  import {type ValidationDetail, validatePasswordDetails, minPasswordLength} from '@openvaa/app-shared';
  import {onMount} from 'svelte';
  import {assertTranslationKey} from '$lib/i18n/utils/assertTranslationKey';
  export let password = '';
  export let username = '';
  export let validPassword = false;

  // Perform debounced validation, validation status is updated after a delay when the user stops typing
  let validationDetails: Record<string, ValidationDetail> = {};
  let validationProgress = 0;
  let timeout: NodeJS.Timeout;
  $: {
    clearTimeout(timeout);
    timeout = setTimeout(() => {
      const {details, status} = validatePasswordDetails(password, username);
      validationDetails = details;
      validPassword = status;

      // Localize validation messages
      for (const key in validationDetails) {
        validationDetails[key].message = $t(assertTranslationKey(validationDetails[key].message), {
          minPasswordLength
        });
      }
    }, 200);
  }

  onMount(() => () => {
    clearTimeout(timeout);
  });

  // Add animation to the progress bar
  const progress = tweened(0, {
    duration: 300,
    easing: cubicOut
  });

  // Filter rules based on their type and enforcement
  function filterRules(
    validationDetails: Record<string, ValidationDetail>,
    negative: boolean,
    enforced: boolean
  ) {
    if (negative) {
      // Filter negative rules based on enforcement
      return Object.values(validationDetails).filter(
        (rule) => rule.negative && !rule.status && (enforced ? rule.enforced : !rule.enforced)
      );
    } else {
      return Object.values(validationDetails).filter((rule) => !rule.negative);
    }
  }

  $: validationRules = filterRules(validationDetails, false, false);
  $: negativeEnforcedRules = filterRules(validationDetails, true, true);
  $: negativeNonEnforcedRules = filterRules(validationDetails, true, false);

  // Update the progress bar based on the number of completed rules
  $: {
    const completedRules = validationRules.filter((rule) => rule.status).length;
    validationProgress = completedRules === 0 ? 0 : completedRules / validationRules.length;
    progress.set(validationProgress);
  }
</script>

<!--
@component
Component for real-time password validation UI.
Password is validated against rules defined in `passwordValidation.ts`.

A progress bar is shown that indicates the number of completed rules.
The progress bar is colored based on the validation state:

There are two types of rules:
- Positive rules: These are basic requirements that must be met for the password to be valid.
These are always enforced and their status is shown in the UI.
Completed positive rules are shown in a different color with a checkmark.
- Negative rules: These are rules that are used to prevent bad password practises.
These can be either enforced or non-enforced. Negative rules are shown if they are violated.

Due to the use of debounced validation, the component will only update after a delay when the user stops typing.
Therefore, the validity should be also checked on form submit as well and on the server side for security reasons.

### Properties
- `password`: The password to validate
- `username`: The username used to prevent the password from being too similar
- `validPassword`: A boolean that is set to true when the password is valid


### Usage

When using this component, the `validPassword` property should be bound to a boolean variable that is used to enable/disable the submit button.
`password` and `username` should be given as props.
```tsx
<PasswordValidator bind:validPassword={validPassword} password={password} username={username} />
```
-->

<div class="m-sm flex w-full flex-col">
  <ul class="m-sm items-start">
    <!-- Show each validation rule and its state, completed rules are shown in a different color with a checkmark -->
    {#each Object.values(validationRules) as rule}
      <li>
        {#if rule.status}
          <p class="text-primary">✓ <strong>{rule.message}</strong></p>
        {:else}
          <p>{rule.message}</p>
        {/if}
      </li>
    {/each}

    <!-- Show negative rules if they are violated -->
    {#each Object.values(negativeEnforcedRules) as rule}
      <li><p class="text-error">✘ <strong>{rule.message}</strong></p></li>
    {/each}

    {#each Object.values(negativeNonEnforcedRules) as rule}
      <li><p class="text-error">✗ {rule.message}</p></li>
    {/each}
  </ul>

  <!-- Display the progress bar in a different color based on validation state -->
  {#if validPassword}
    <progress class="progress progress-primary" value={$progress} />
  {:else if negativeEnforcedRules.length > 0}
    <progress class="progress progress-error" value={$progress} />
  {:else}
    <progress class="progress progress-secondary" value={$progress} />
  {/if}
</div>
