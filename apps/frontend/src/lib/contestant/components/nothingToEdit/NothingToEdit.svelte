<!--
@component A whole view for a signed-in user who has nothing to edit: a title, an explanation, the email address the user is signed in with, what to do next, and three actions, contacting support, opening the settings page and logging out. It renders its own `MainContent`, so a page shows it with one tag and nothing around it.

The view offers no way into the pages of an entity and builds no route into them. The settings page, with the account's address and the password change, belongs to the user rather than to an entity, so the view links to it.

### Dynamic component

Accesses `ContestantContext`. The signed-in email is read from the context's `user`; when the user has no email, the label and the address are left out together, and the last sentence asks the user to tell support that they registered with Bank ID instead of pointing at an address.

### Properties

- `title`: The page title. Default: `t('contestantApp.nothingToEdit.title')`
- `children`: Replaces the default explanation, e.g. to give another reason the user has nothing to edit.

### Accessibility

- The address is a `<dd>` under its label, so it is announced with the label. It is never hyphenated or translated, and it wraps at any character rather than overflowing.

### Usage

```tsx
<NothingToEdit />
<NothingToEdit title="Your Email Is Not Confirmed">
  <p class="text-center">Confirm your email address to continue.</p>
</NothingToEdit>
```
-->

<script lang="ts">
  import { ContactSupport } from '$contestant/components/contactSupport';
  import { LogoutButton } from '$contestant/components/logoutButton';
  import { MainContent } from '$layouts/main';
  import { Button } from '$lib/components/button';
  import { getContestantContext } from '$lib/contexts/contestant';
  import type { NothingToEditProps } from './NothingToEdit.type';

  let { title, children }: NothingToEditProps = $props();

  ////////////////////////////////////////////////////////////////////
  // Get contexts
  ////////////////////////////////////////////////////////////////////

  // user is a reactive accessor: read via contestantCtx.user in the markup, never destructured.
  const contestantCtx = getContestantContext();
  const { getRoute, t } = contestantCtx;
</script>

<MainContent title={title ?? t('contestantApp.nothingToEdit.title')} data-testid="contestant-nothing-to-edit">
  {#if children}
    {@render children()}
  {:else}
    <p class="text-center">{t('contestantApp.nothingToEdit.content')}</p>
  {/if}

  {#if contestantCtx.user?.email}
    <dl class="my-lg text-center">
      <dt class="small-label">{t('contestantApp.nothingToEdit.signedInAs')}</dt>
      <dd
        class="font-bold [overflow-wrap:anywhere] hyphens-none"
        translate="no"
        data-testid="contestant-nothing-to-edit-email">
        {contestantCtx.user.email}
      </dd>
    </dl>
  {/if}

  <p class="text-center">
    {contestantCtx.user?.email
      ? t('contestantApp.nothingToEdit.nextSteps')
      : t('contestantApp.nothingToEdit.nextStepsNoAddress')}
  </p>

  {#snippet primaryActions()}
    <ContactSupport variant="main" />
    <Button
      href={getRoute.current('ContestantAppSettings')}
      text={t('contestantApp.nothingToEdit.settings')}
      variant="normal"
      data-testid="contestant-nothing-to-edit-settings" />
    <LogoutButton variant="normal" icon={undefined} data-testid="contestant-nothing-to-edit-logout" />
  {/snippet}
</MainContent>
