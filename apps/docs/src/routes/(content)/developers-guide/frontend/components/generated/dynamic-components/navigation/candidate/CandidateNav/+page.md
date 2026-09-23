# CandidateNav

A template part that outputs the navigation menu for the Candidate App for use in `Layout`.

### Dynamic component

- Accesses the `CandidateContext`.

### Properties

- Any valid properties of a `Navigation` component

### Usage

```tsx
<CandidateNav>
  <NavItem onclick={closeMenu} icon="close" text="Close" />
</CandidateNav>
```

## Source

[apps/frontend/src/lib/dynamic-components/navigation/candidate/CandidateNav.svelte](https://github.com/OpenVAA/voting-advice-application/blob/main/apps/frontend/src/lib/dynamic-components/navigation/candidate/CandidateNav.svelte)

[apps/frontend/src/lib/dynamic-components/navigation/candidate/CandidateNav.type.ts](https://github.com/OpenVAA/voting-advice-application/blob/main/apps/frontend/src/lib/dynamic-components/navigation/candidate/CandidateNav.type.ts)
