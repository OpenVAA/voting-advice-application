<!--
@component A block that leads the user to support: an optional lead-in and one button, or a sentence whose own words are the link. The button or the link leads to the support section of the Help page or opens an email to the support address.

The block builds no route into the pages of an entity, so it can be rendered on a page whose URL names none.

### Dynamic component

Accesses `ContestantContext`.

### Properties

- `children`: Optional lead-in rendered above the button, e.g. a sentence saying when to contact support. Not rendered with `sentence`.
- `sentence`: The translation key of a sentence holding the placeholder `{contactSupportLink}`. With it the block is that sentence, one paragraph, with the link in place of the placeholder, and no button. The link’s words are `contestantApp.common.contactSupportLink`.
- `action`: Where the button or the link leads. Default: `'help'`
  - `'help'`: A link to the support section of the Help page.
  - `'email'`: An email to the support address. The button opens it in a new tab.
- `variant`: The variant of the button. Default: `'prominent'`
- `icon`: The icon of the button, or `null` for a button with no icon. Default: `'help'` for the `'help'` action, `'feedback'` for the `'email'` action
- `iconPos`: The position of the icon in the button. Passed to the `Button`. Default: the `Button`’s own default for its variant
- Any valid attributes of a `<div>` element, given to the paragraph with `sentence`.

### Settings

- `admin.email`: The address the `'email'` action writes to.

### Usage

```tsx
<ContactSupport />
<ContactSupport variant="main" icon={null}>
  <p>Contact support if you cannot find your profile.</p>
</ContactSupport>
<ContactSupport action="email" id={SUPPORT_ANCHOR} />
<ContactSupport sentence="contestantApp.identityProvider.error.retry.support" />
```
-->

<script lang="ts">
  import { getContestantAppName } from '$contestant/utils/contestantAppName';
  import { Button } from '$lib/components/button';
  import { getContestantContext } from '$lib/contexts/contestant';
  import { concatClass } from '$lib/utils/components';
  import { getEmailUrl } from '$lib/utils/email';
  import { sanitizeHtml } from '$lib/utils/sanitize';
  import { escapeHtml } from '$lib/utils/text/escapeHtml';
  import { SUPPORT_ANCHOR } from './ContactSupport.type';
  import type { ContactSupportProps } from './ContactSupport.type';

  let {
    children,
    sentence,
    action = 'help',
    variant = 'prominent',
    icon,
    iconPos,
    ...restProps
  }: ContactSupportProps = $props();

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

  // A caller that gives no icon gets the action's own; `null` is a button with none.
  const buttonIcon = $derived(icon === undefined ? (action === 'email' ? 'feedback' : 'help') : icon);

  // The link given to the sentence in place of its placeholder. The whole sentence is sanitised when rendered.
  const contactSupportLink = $derived(
    `<a href="${escapeHtml(action === 'email' ? supportMailto : helpLink)}" class="underline">${escapeHtml(t('contestantApp.common.contactSupportLink'))}</a>`
  );
</script>

{#if sentence}
  <p {...concatClass(restProps, 'text-center')}>{@html sanitizeHtml(t(sentence, { contactSupportLink }))}</p>
{:else}
  <div {...concatClass(restProps, 'flex w-full flex-col items-center gap-md')}>
    {@render children?.()}
    {#if action === 'email'}
      <Button
        href={supportMailto}
        {variant}
        target="_blank"
        icon={buttonIcon}
        {...iconPosProps}
        text={t('contestantApp.common.contactSupport')}
        data-testid="contestant-contact-support" />
    {:else}
      <Button
        href={helpLink}
        {variant}
        icon={buttonIcon}
        {...iconPosProps}
        text={t('contestantApp.common.contactSupport')}
        data-testid="contestant-contact-support" />
    {/if}
  </div>
{/if}
