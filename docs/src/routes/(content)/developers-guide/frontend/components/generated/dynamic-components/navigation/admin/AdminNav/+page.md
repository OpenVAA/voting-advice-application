# AdminNav

A template part that outputs the navigation menu for the Admin App for use in `Layout`.

### Dynamic component

- Accesses the `AdminContext` in the future.

### Properties

- Any valid properties of a `Navigation` component.

### Usage

```tsx
<AdminNav>
  <NavItem slot="close" on:click={closeMenu} icon="close" text="Close" />
</AdminNav>
```

## Source

[frontend/src/lib/dynamic-components/navigation/admin/AdminNav.svelte](https://github.com/OpenVAA/voting-advice-application/blob/main/frontend/src/lib/dynamic-components/navigation/admin/AdminNav.svelte)

[frontend/src/lib/dynamic-components/navigation/admin/AdminNav.type.ts](https://github.com/OpenVAA/voting-advice-application/blob/main/frontend/src/lib/dynamic-components/navigation/admin/AdminNav.type.ts)
