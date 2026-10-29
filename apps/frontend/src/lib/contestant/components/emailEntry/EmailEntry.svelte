<!--
@component An email address and its confirmation: two `EmailField`s and the comparison of the two. It serves any screen that asks a user to enter and confirm an address, and knows nothing of what the address is for.

The two addresses are compared trimmed and without regard to case. The mismatch is shown at the confirmation when that field loses focus while both hold text, and by `validate()`; an edit of either field removes it. Neither field rewrites what was typed or pasted.

A screen that sends the address on can show what the server answered about it at the address field with `showEmailError()`, as an address another account holds. The message is shown as the fields' own are, carries `data-reason="in-use"`, and is removed by the next edit of either field or by `validate()`.

### Properties

- `email`: Bindable: The address in the first field. Default: `''`
- `id`: The base of the two controls' ids: the address takes `<id>-email` and its confirmation `<id>-confirmation`. Default: a generated id
- `validate`: Bindable: Function that judges the two fields. It returns `true` for two equal, usable addresses. Otherwise it returns `false`, shows at each field what is wrong with it and moves focus to the first field in error.
- `showEmailError`: Bindable: Function that shows a message at the address field, with `data-reason="in-use"` on it, and moves focus to that field. What was typed is kept.
- Any valid attributes of a `<div>` element.

### Accessibility

- Each control has a visible label of its own, and the two have different names and ids.
- A message is an alert tied to its control, which is `aria-invalid` while the message is shown.

### Usage

```tsx
<form method="POST" novalidate onsubmit={handleSubmit}>
  <EmailEntry bind:email bind:this={entry} />
</form>

function handleSubmit(event: SubmitEvent): void {
  event.preventDefault();
  if (!entry?.validate()) return;
  …
}
```
-->

<script lang="ts">
  import { EmailField } from '$contestant/components/emailField';
  import { getComponentContext } from '$lib/contexts/component';
  import { concatClass, getUUID } from '$lib/utils/components';
  import type { EmailEntryProps } from './EmailEntry.type';

  let { email = $bindable(''), id: idProp = undefined, ...restProps }: EmailEntryProps = $props();

  /**
   * Judge the two fields, show at each what is wrong with it and move focus to the first field in error.
   * @returns `true` for two equal, usable addresses.
   */
  export function validate(): boolean {
    emailErrorReason = undefined;
    if (!email.trim()) emailError = t('contestantApp.login.emailRequired');
    else if (!emailField?.checkValidity()) emailError = t('components.input.error.invalidEmail');
    else emailError = undefined;

    if (!confirmation.trim()) showAtConfirmation(t('contestantApp.login.emailRequired'), false);
    else if (!sameAddress()) showAtConfirmation(t('contestantApp.register.emailEntry.mismatch'), true);
    else showAtConfirmation(undefined, false);

    if (emailError) emailField?.focus();
    else if (confirmationError) confirmationField?.focus();
    return !emailError && !confirmationError;
  }

  /**
   * Show a message at the address field and move focus to it, as for an address the server says another account holds. The next edit of either field removes it.
   * @param message - The sentence to show.
   */
  export function showEmailError(message: string): void {
    emailError = message;
    emailErrorReason = IN_USE_REASON;
    emailField?.focus();
  }

  const { t } = getComponentContext();

  /** The reason written on a message `showEmailError()` shows. */
  const IN_USE_REASON = 'in-use';

  // Generated once, so that the two ids are the same on every read.
  const fallbackId = getUUID();
  const id = $derived(idProp ?? fallbackId);

  let confirmation = $state('');
  let emailError = $state<string>();
  /** The reason of the message at the address field, while it is one `showEmailError()` put there. */
  let emailErrorReason = $state<string>();
  let confirmationError = $state<string>();
  /** Whether the message at the confirmation is the mismatch, which an edit of either field removes. */
  let mismatchShown = $state(false);

  let emailField: EmailField | undefined = $state();
  let confirmationField: EmailField | undefined = $state();

  function sameAddress(): boolean {
    return email.trim().toLowerCase() === confirmation.trim().toLowerCase();
  }

  function showAtConfirmation(message: string | undefined, isMismatch: boolean): void {
    confirmationError = message;
    mismatchShown = isMismatch;
  }

  function handleConfirmationLeft(): void {
    if (email.trim() && confirmation.trim() && !sameAddress())
      showAtConfirmation(t('contestantApp.register.emailEntry.mismatch'), true);
  }

  // The confirmation's field clears its own message when it is edited; an edit of the address clears the mismatch alone.
  function handleEmailEdited(): void {
    emailErrorReason = undefined;
    if (mismatchShown) showAtConfirmation(undefined, false);
  }

  // The address field clears its own message when it is edited; an edit of the confirmation clears a message `showEmailError()` put there.
  function handleConfirmationEdited(): void {
    if (!emailErrorReason) return;
    emailError = undefined;
    emailErrorReason = undefined;
  }
</script>

<div {...concatClass(restProps, 'flex w-full flex-col gap-md')}>
  <EmailField
    bind:this={emailField}
    bind:value={email}
    bind:error={emailError}
    id="{id}-email"
    name="email"
    autocomplete="email"
    data-testid="email-entry-email"
    errorTestId="email-entry-email-error"
    errorReason={emailErrorReason}
    oninput={handleEmailEdited} />
  <EmailField
    bind:this={confirmationField}
    bind:value={confirmation}
    bind:error={confirmationError}
    id="{id}-confirmation"
    label={t('common.emailConfirmation')}
    name="email-confirmation"
    autocomplete="email"
    data-testid="email-entry-confirmation"
    errorTestId="email-entry-confirmation-error"
    oninput={handleConfirmationEdited}
    onfocusout={handleConfirmationLeft} />
</div>
