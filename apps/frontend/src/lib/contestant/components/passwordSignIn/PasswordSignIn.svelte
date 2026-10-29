<!--
@component The password half of a sign-in form: the labelled password field, the message of a refused sign-in, the link to the forgot-password page and, where it is offered, the link for a user who has not set a password, in that order. That order is the tab order: the field, its show-or-hide toggle, the links.

Both links lead to the forgot-password page, which sends a user without a password a mail to sign in with as well. Each carries the address the caller passes as `email` in the page's `email` search parameter, so that the page's field holds it; with no address, or one of spaces alone, neither carries one. Neither needs the address.

The component decides nothing. Its caller says when the field is in error, by setting `error`, passes the sentence of a refusal as `failure`, and says whether the second link is offered. Each screen that renders it passes its own test ids.

### Dynamic component

Accesses `ContestantContext`.

### Properties

- `password`: Bindable: The password in the field. Default: `''`
- `error`: Bindable: The message shown at the field while it is in error, e.g. when it was left empty. Cleared when the user edits the field.
- `failure`: The sentence of a refused sign-in, shown under the field. Not shown when empty.
- `failureStatus`: The status a refused sign-in was answered with, rendered as `data-status` on the refusal.
- `email`: The address typed so far, which both links carry to the forgot-password page.
- `noPasswordYetOffered`: Whether the link for a user who has not set a password is rendered. Default: `false`
- `id`: The id of the password control. The field's error takes the id `<id>-error`. Default: a generated id
- `errorTestId`: The test id of the field's error.
- `failureTestId`: The test id of the refusal.
- `forgotPasswordTestId`: The test id of the link to the forgot-password page.
- `noPasswordYetTestId`: The test id of the link for a user who has not set a password.
- `focus`: Bindable: Function to set focus to the password control.
- Any valid attributes of a `<div>` element.

### Accessibility

- The label is visible and tied to the password control by `for`; the control has no placeholder.
- The control is `aria-invalid` and described by the field's error while that is shown.
- The field's error and the refusal each have `role="alert"`.
- Both links are links the server renders, and work before the page's script has loaded.

### Usage

```tsx
<form id="sign-in" method="POST" novalidate>
  <EmailField bind:value={email} autocomplete="username" />
  <PasswordSignIn
    bind:password
    bind:error={passwordError}
    {email}
    noPasswordYetOffered
    failure={refusal}
    failureStatus={status}
    errorTestId="login-password-error"
    failureTestId="login-errorMessage"
    forgotPasswordTestId="login-forgot-password-link"
    noPasswordYetTestId="login-no-password-yet-link" />
</form>
```
-->

<script lang="ts">
  import { PasswordField } from '$contestant/components/passwordField';
  import { Button } from '$lib/components/button';
  import { ErrorMessage } from '$lib/components/errorMessage';
  import { getContestantContext } from '$lib/contexts/contestant';
  import { concatClass, getUUID } from '$lib/utils/components';
  import type { PasswordSignInProps } from './PasswordSignIn.type';

  let {
    password = $bindable(''),
    error = $bindable(),
    failure = undefined,
    failureStatus = undefined,
    email = undefined,
    noPasswordYetOffered = false,
    id: idProp = undefined,
    errorTestId = undefined,
    failureTestId = undefined,
    forgotPasswordTestId = undefined,
    noPasswordYetTestId = undefined,
    ...restProps
  }: PasswordSignInProps = $props();

  export function focus(): void {
    field?.focus();
  }

  // Both are stable references of the context, so they are safe to destructure.
  const { getRoute, t } = getContestantContext();

  // Generated once, so that the id is the same on every read.
  const fallbackId = getUUID();
  const id = $derived(idProp ?? fallbackId);

  let field: PasswordField | undefined = $state();

  // Spread onto each element, so that a caller that gives no test id leaves the element its own.
  const errorTestIdProps = $derived(errorTestId === undefined ? {} : { 'data-testid': errorTestId });
  const failureTestIdProps = $derived(failureTestId === undefined ? {} : { 'data-testid': failureTestId });
  const forgotPasswordTestIdProps = $derived(
    forgotPasswordTestId === undefined ? {} : { 'data-testid': forgotPasswordTestId }
  );
  const noPasswordYetTestIdProps = $derived(
    noPasswordYetTestId === undefined ? {} : { 'data-testid': noPasswordYetTestId }
  );

  /** The forgot-password page, with the typed address when there is one. */
  const forgotPasswordHref = $derived.by(() => {
    const address = email?.trim();
    return getRoute.current(
      address ? { route: 'ContestantAppForgotPassword', email: address } : 'ContestantAppForgotPassword'
    );
  });

  // The field writes here when the user edits it, which is also when its error goes.
  function handlePasswordEdited(next: string): void {
    password = next;
    error = undefined;
  }
</script>

<div {...concatClass(restProps, 'flex w-full flex-col gap-md')}>
  <div class="gap-xs flex w-full flex-col">
    <label for={id} class="text-start">{t('common.password')}</label>
    <PasswordField
      bind:this={field}
      bind:password={() => password, handlePasswordEdited}
      {id}
      autocomplete="current-password"
      externalLabel
      describedby={error ? `${id}-error` : undefined}
      invalid={!!error} />
    {#if error}
      <ErrorMessage inline message={error} id="{id}-error" role="alert" {...errorTestIdProps} />
    {/if}
  </div>
  {#if failure}
    <ErrorMessage inline message={failure} role="alert" data-status={failureStatus} {...failureTestIdProps} />
  {/if}
  <Button href={forgotPasswordHref} text={t('contestantApp.login.forgotPassword')} {...forgotPasswordTestIdProps} />
  {#if noPasswordYetOffered}
    <Button href={forgotPasswordHref} text={t('contestantApp.login.noPasswordYet')} {...noPasswordYetTestIdProps} />
  {/if}
</div>
