<script lang="ts">
  import type {HeroEmojiProps} from './HeroEmoji.type';

  type $$Props = HeroEmojiProps;

  // Merge the necessary classes to possible extra classes defined in the props
  $$restProps.class = `whitespace-nowrap truncate text-clip text-center font-emoji text-[6.5rem] leading-none ${
    $$restProps.class ?? ''
  }`;
</script>

<!--
@component
Used for large emojis acting as decorative illustrations.

The content of the component is the emoji or emojis to be displayed.

The content is hidden from screen readers by default, because the
intended use is for [decorative purposes](https://www.w3.org/WAI/tutorials/images/decorative/).
To override, add `aria-hidden="false"` to the tag and also consider
adding an `aria-label`.

To change the size of the emoji, add a `text-[size]` utility class
using the `class` attribute, e.g. `class="text-[10rem]"`.

### Properties

- Any valid attributes of a `<div>` element.

### Slots

- default: the emoji or emojis to be displayed.

### Usage

```tsx
<HeroEmoji>🚀</HeroEmoji>
```
-->

<div role="img" aria-hidden="true" {...$$restProps}><slot /></div>
