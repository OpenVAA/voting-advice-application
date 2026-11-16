# ContactSupport

A block that leads the user to support: an optional lead-in and one button, or a sentence whose own words are the link. The button or the link leads to the support section of the Help page or opens an email to the support address.

The block builds no route into the pages of an entity, so it can be rendered on a page whose URL names none. Outside the Contestant App there is no Help page, so the block always leads to an email there.

### Dynamic component

Accesses `AppContext`. The app it is rendered in decides the Help page's link and the app named in the email's subject.

### Properties

- `children`: Optional lead-in rendered above the button, e.g. a sentence saying when to contact support. Not rendered with `sentence`.
- `sentence`: The translation key of a sentence holding the placeholder `{contactSupportLink}`. With it the block is that sentence, one paragraph, with the link in place of the placeholder, and no button. The link’s words are `contestantApp.common.contactSupportLink`.
- `action`: Where the button or the link leads in the Contestant App. Outside it the block always leads to an email. Default: `'help'`
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

## Source

- Component: [apps/frontend/src/lib/dynamic-components/contactSupport/ContactSupport.svelte](https://github.com/OpenVAA/voting-advice-application/blob/main/apps/frontend/src/lib/dynamic-components/contactSupport/ContactSupport.svelte)
- Types: [apps/frontend/src/lib/dynamic-components/contactSupport/ContactSupport.type.ts](https://github.com/OpenVAA/voting-advice-application/blob/main/apps/frontend/src/lib/dynamic-components/contactSupport/ContactSupport.type.ts)
