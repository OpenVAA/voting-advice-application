<!--
@component A block that leads the user to support: an optional lead-in and one button. The button links to the support section of the Help page or opens an email to the support address.

The block builds no route into the pages of an entity, so it can be rendered on a page whose URL names none.

### Dynamic component

Accesses `ContestantContext`.

### Properties

- `children`: Optional lead-in rendered above the button, e.g. a sentence saying when to contact support.
- `action`: Where the button leads. Default: `'help'`
  - `'help'`: A link to the support section of the Help page.
  - `'email'`: An email to the support address, opened in a new tab.
- `variant`: The variant of the button. Default: `'prominent'`
- `iconPos`: The position of the icon in the button. Passed to the `Button`. Default: the `Button`’s own default for its variant
- Any valid attributes of a `<div>` element.

### Settings

- `admin.email`: The address the `'email'` action writes to.

### Usage

```tsx
<ContactSupport />
<ContactSupport variant="main">
  <p>Contact support if you cannot find your profile.</p>
</ContactSupport>
<ContactSupport action="email" id={SUPPORT_ANCHOR} />
```
-->

<script lang="ts">
  import { getContestantAppName } from '$contestant/utils/contestantAppName';
  import { Button } from '$lib/components/button';
  import { getContestantContext } from '$lib/contexts/contestant';
  import { concatClass } from '$lib/utils/components';
  import { getEmailUrl } from '$lib/utils/email';
  import { SUPPORT_ANCHOR } from './ContactSupport.type';
  import type { ContactSupportProps } from './ContactSupport.type';

  let { children, action = 'help', variant = 'prominent', iconPos, ...restProps }: ContactSupportProps = $props();

  // Spread onto the button, so that a caller that gives no position leaves the button its own default.
  const iconPosProps = $derived(iconPos === undefined ? {} : { iconPos });

  ////////////////////////////////////////////////////////////////////
  // Get contexts
  ////////////////////////////////////////////////////////////////////

  const ctx = getContestantContext();
  const { getRoute, t } = ctx;

  ////////////////////////////////////////////////////////////////////
  // Build the link
  ////////////////////////////////////////////////////////////////////

  // appSettings is a reactive accessor: read via ctx.appSettings inside the derived, never destructured.
  const supportMailto = $derived(
    getEmailUrl({
      subject: `${t('contestantApp.help.supportEmailSubject')}: ${getContestantAppName({ appSettings: ctx.appSettings, t })}`,
      to: ctx.appSettings.admin.email
    })
  );

  const helpLink = $derived(`${getRoute.current('ContestantAppHelp')}#${SUPPORT_ANCHOR}`);
</script>

<div {...concatClass(restProps, 'flex w-full flex-col items-center gap-md')}>
  {@render children?.()}
  {#if action === 'email'}
    <Button
      href={supportMailto}
      {variant}
      target="_blank"
      icon="feedback"
      {...iconPosProps}
      text={t('contestantApp.common.contactSupport')}
      data-testid="contestant-contact-support" />
  {:else}
    <Button
      href={helpLink}
      {variant}
      icon="help"
      {...iconPosProps}
      text={t('contestantApp.common.contactSupport')}
      data-testid="contestant-contact-support" />
  {/if}
</div>
