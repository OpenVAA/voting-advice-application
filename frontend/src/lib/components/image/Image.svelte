<!--
@component
Display an `@openvaa/data: Image` object, automatically switching between dark and normal variants if available.

### Properties

- `image`: The `Image` object to display.
- `format`: The preferred format of the image. The default one will be used if the format is not defined or not available.
- Any valid attributes of a `<img>` element

### Usage

```tsx
<Image image={candidate.image} format="thumbnail" on:load={() => console.info('Loaded!')}/>
```
-->

<script lang="ts">
  import { getComponentContext } from '$lib/contexts/component';
  import { getImageUrl } from '$lib/utils/image';
  import type { ImageProps } from './Image.type';

  type $$Props = ImageProps;

  export let image: $$Props['image'];
  export let format: $$Props['format'] = undefined;
  export let alt: $$Props['alt'] = undefined;

  ////////////////////////////////////////////////////////////////////
  // Get contexts
  ////////////////////////////////////////////////////////////////////

  const { darkMode } = getComponentContext();
</script>

<img
  {...$$restProps}
  alt={alt || (image.alt ?? '')}
  src={getImageUrl({ image, format, dark: $darkMode })}
  on:load
  on:error />
