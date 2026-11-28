# PreHeading

Used for a pre-title, or kicker, above the main title of a page within a `HeadingGroup`.

### Properties

- `aria-roledescription`: The Aria role description of the `<p>` element representing the pre-title. Default: `t('components.preHeading.roleDescription')`
- Any valid attributes of a `<p>` element.

### Snippet Props

- `children`: the contents of the pre-title.

### Usage

```tsx
<PreHeading class="text-accent">{t('categories.environment')}</PreHeading>
```

## Source

- Component: [apps/frontend/src/lib/components/headingGroup/PreHeading.svelte](https://github.com/OpenVAA/voting-advice-application/blob/main/apps/frontend/src/lib/components/headingGroup/PreHeading.svelte)
- Types: [apps/frontend/src/lib/components/headingGroup/PreHeading.type.ts](https://github.com/OpenVAA/voting-advice-application/blob/main/apps/frontend/src/lib/components/headingGroup/PreHeading.type.ts)
