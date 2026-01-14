# VoterNav

A template part that outputs the navigation menu for the Voter App for use in `Layout`.

### Dynamic component

- Accesses the `VoterContext`.

### Properties

- Any valid properties of a `Navigation` component.

### Settings

- `elections.disallowSelection`: Affects whether the select elections item is shown.
- `elections.startFromConstituencyGroup`: Affects the order of the items shown and under which conditions they are disabled.
- `entities.showAllNominations`: Affects whether the 'All nominations' route is shown.

### Usage

```tsx
<VoterNav>
  <NavItem href={$getRoute('Home')} icon="home" text={$t('common.home')} />
</VoterNav>
```

## Source

[frontend/src/lib/dynamic-components/navigation/voter/VoterNav.svelte](https://github.com/OpenVAA/voting-advice-application/blob/main/frontend/src/lib/dynamic-components/navigation/voter/VoterNav.svelte)

[frontend/src/lib/dynamic-components/navigation/voter/VoterNav.type.ts](https://github.com/OpenVAA/voting-advice-application/blob/main/frontend/src/lib/dynamic-components/navigation/voter/VoterNav.type.ts)
