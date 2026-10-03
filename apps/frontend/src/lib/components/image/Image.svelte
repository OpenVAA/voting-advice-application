<!--
@component Display an `@openvaa/data: Image` object, automatically switching between dark and normal variants if available.

### Properties

- `image`: The `Image` object to display.
- `format`: The preferred format of the image. The default one will be used if the format is not defined or not available.
- Any valid attributes of a `<img>` element

### Usage

```tsx
<Image image={candidate.image} format="thumbnail" onload={() => console.info('Loaded!')}/>
```
-->

<script lang="ts">
  import { getComponentContext } from '$lib/contexts/component';
  import { getImageUrl } from '$lib/utils/image';
  import type { ImageProps } from './Image.type';

  let { image, format, alt, ...restProps }: ImageProps = $props();

  ////////////////////////////////////////////////////////////////////
  // Get contexts
  ////////////////////////////////////////////////////////////////////

  // `darkMode` is a reactive accessor that follows the OS colour-scheme preference: read it through the context, never destructured, or the image keeps the variant chosen at mount.
  const componentCtx = getComponentContext();
</script>

<img
  data-testid="image-img"
  {...restProps}
  alt={alt || (image.alt ?? '')}
  src={getImageUrl({ image, format, dark: componentCtx.darkMode })} />
