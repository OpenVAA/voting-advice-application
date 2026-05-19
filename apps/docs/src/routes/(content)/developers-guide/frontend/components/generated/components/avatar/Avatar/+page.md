# Avatar

Display either an image or a initials-based avatar for an entity. The color of the initials background is based on the entity's color or `'base-300'` by default. If the color is specified, it should be dark enough, because the `primary-content` color is used for the text.

### Properties

- `entity`: The entity for which to display the avatar.
- `size`: The size of the avatar. Default: `'md'`
- `linkFullImage`: Whether to link the thumbnail to the full image. Default: `false`
- Any valid attributes of a `<figure>` element

### Usage

```tsx
<Avatar entity={candidate} size="lg" linkFullImage />
```

## Source

[frontend/src/lib/components/avatar/Avatar.svelte](https://github.com/OpenVAA/voting-advice-application/blob/main/frontend/src/lib/components/avatar/Avatar.svelte)

[frontend/src/lib/components/avatar/Avatar.type.ts](https://github.com/OpenVAA/voting-advice-application/blob/main/frontend/src/lib/components/avatar/Avatar.type.ts)
