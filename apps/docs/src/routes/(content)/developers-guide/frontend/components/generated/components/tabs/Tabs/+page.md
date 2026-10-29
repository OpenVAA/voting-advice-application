# Tabs

Show a tab title bar that can be used to switch between different tabs.

### Properties

- `tabs`: The tabs, each `{ label, id? }`.
- `activeTab`: The `id ?? label` of the active tab. Bind to this to change or read the active tab. When it is unset or matches no tab, the first tab is active. @default the first tab
- `transitionOnChange`: Cross-fade a local tab switch in a View Transition. @default false
- Any valid attributes of a `<ul>` element

### Callbacks

- `onChange`: Callback for when the user activates a tab, called with that tab. Note, it's preferable to just bind to the `activeTab` property instead.

### Accessibility

- The tab can be activated by pressing `Enter` or `Space`.
- TODO[a11y]: Add support for keyboard navigation with the arrow keys.

### Usage

```tsx
<Tabs
  bind:activeTab
  tabs={[
    { id: 'info', label: 'Basic Info' },
    { id: 'opinions', label: 'Opinions' }
  ]}
/>
```

## Source

- Component: [apps/frontend/src/lib/components/tabs/Tabs.svelte](https://github.com/OpenVAA/voting-advice-application/blob/main/apps/frontend/src/lib/components/tabs/Tabs.svelte)
- Types: [apps/frontend/src/lib/components/tabs/Tabs.type.ts](https://github.com/OpenVAA/voting-advice-application/blob/main/apps/frontend/src/lib/components/tabs/Tabs.type.ts)
