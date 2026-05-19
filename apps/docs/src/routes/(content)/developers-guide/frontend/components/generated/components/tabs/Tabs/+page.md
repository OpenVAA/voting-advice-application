# Tabs

Show a tab title bar that can be used to switch between different tabs.

### Properties

- `tabs`: The titles of the tabs.
- `activeIndex`: The index of the active tab. Bind to this to change or read the active tab. @default 0
- Any valid attributes of a `<ul>` element

### Callbacks

- `onChange`: Callback for when the active tab changes. The event `details` contains the active tab as `tab` as well as its `index`. Note, it's preferable to just bind to the `activeTab` property instead.

### Accessibility

- The tab can be activated by pressing `Enter` or `Space`.
- TODO[a11y]: Add support for keyboard navigation with the arrow keys.

### Usage

```tsx
<Tabs bind:activeIndex tabs={['Basic Info', 'Opinions']} />
```

## Source

[frontend/src/lib/components/tabs/Tabs.svelte](https://github.com/OpenVAA/voting-advice-application/blob/main/frontend/src/lib/components/tabs/Tabs.svelte)

[frontend/src/lib/components/tabs/Tabs.type.ts](https://github.com/OpenVAA/voting-advice-application/blob/main/frontend/src/lib/components/tabs/Tabs.type.ts)
