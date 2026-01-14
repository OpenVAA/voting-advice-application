# PreHeading

Used for a pre-title, or kicker, above the main title of a page within a `HeadingGroup`.

### Properties

- `aria-roledescription`: The Aria role description of the `<p>` element representing the pre-title. Default: `$t('aria.preHeading')`
- Any valid attributes of a `<p>` element.

### Slots

- default: the contents of pre-title

### Usage

```tsx
<PreHeading class="text-accent">{$t('categories.environment')}</PreHeading>
```

## Source

[frontend/src/lib/components/headingGroup/PreHeading.svelte](https://github.com/OpenVAA/voting-advice-application/blob/main/frontend/src/lib/components/headingGroup/PreHeading.svelte)

[frontend/src/lib/components/headingGroup/PreHeading.type.ts](https://github.com/OpenVAA/voting-advice-application/blob/main/frontend/src/lib/components/headingGroup/PreHeading.type.ts)
