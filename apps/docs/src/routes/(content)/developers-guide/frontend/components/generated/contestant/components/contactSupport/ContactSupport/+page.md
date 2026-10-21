# ContactSupport

A block that leads the user to support: an optional lead-in and one button. The button links to the support section of the Help page or opens an email to the support address.

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

## Source

- Component: [apps/frontend/src/lib/contestant/components/contactSupport/ContactSupport.svelte](https://github.com/OpenVAA/voting-advice-application/blob/main/apps/frontend/src/lib/contestant/components/contactSupport/ContactSupport.svelte)
- Types: [apps/frontend/src/lib/contestant/components/contactSupport/ContactSupport.type.ts](https://github.com/OpenVAA/voting-advice-application/blob/main/apps/frontend/src/lib/contestant/components/contactSupport/ContactSupport.type.ts)
