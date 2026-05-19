# Image

Display an `@openvaa/data: Image` object, automatically switching between dark and normal variants if available.

### Properties

- `image`: The `Image` object to display.
- `format`: The preferred format of the image. The default one will be used if the format is not defined or not available.
- Any valid attributes of a `<img>` element

### Usage

```tsx
<Image image={candidate.image} format="thumbnail" on:load={() => console.info('Loaded!')} />
```

## Source

[frontend/src/lib/components/image/Image.svelte](https://github.com/OpenVAA/voting-advice-application/blob/main/frontend/src/lib/components/image/Image.svelte)

[frontend/src/lib/components/image/Image.type.ts](https://github.com/OpenVAA/voting-advice-application/blob/main/frontend/src/lib/components/image/Image.type.ts)
