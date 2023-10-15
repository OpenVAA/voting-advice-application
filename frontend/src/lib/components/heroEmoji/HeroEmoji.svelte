<script lang="ts">
  import type {HeroEmojiProps} from './HeroEmoji.type';

  type $$Props = HeroEmojiProps;

  // Merge the necessary classes to possible extra classes defined in the props
  $$restProps.class = `text-center font-emoji text-[6.5rem] leading-[6.5rem] ${
    $$restProps.class ?? ''
  }`;
</script>

<!--
@component
Used for large emojis acting as illustrations.

The content of the component is the emoji or emojis to be displayed.

### Properties

- Any valid attributes of a `div` element.

### Slots

- default: the emoji or emojis to be displayed.

### Usage

```tsx
<HeroEmoji>🚀</HeroEmoji>
```
-->

<div {...$$restProps}><slot /></div>
