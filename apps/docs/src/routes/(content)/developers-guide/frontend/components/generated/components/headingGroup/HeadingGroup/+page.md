# HeadingGroup

Used to group the page's main headings, such as a pre-heading (kicker)
and the main title.

### Properties

- `aria-roledescription`: The Aria role description of the `<hgroup>` element. Default: `$t('aria.headingGroup')`
- `role`: The Aria role of the `<hgroup>` element. Default: `'group'`
- Any valid attributes of a `<hgroup>` element.

### Slots

- default: the contents of the heading group.

### Usage

```tsx
<HeadingGroup>
  <PreHeading class="text-accent">{$t('categories.environment')}</PreHeading>
  <h1>{$t('titles.environment')}</h1>
</HeadingGroup>
```

## Source

[frontend/src/lib/components/headingGroup/HeadingGroup.svelte](https://github.com/OpenVAA/voting-advice-application/blob/main/frontend/src/lib/components/headingGroup/HeadingGroup.svelte)

[frontend/src/lib/components/headingGroup/HeadingGroup.type.ts](https://github.com/OpenVAA/voting-advice-application/blob/main/frontend/src/lib/components/headingGroup/HeadingGroup.type.ts)
