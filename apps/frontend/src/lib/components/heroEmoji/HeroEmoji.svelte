<svelte:options runes />

<!--
@component
Used for large emojis acting as decorative illustrations.

The content is hidden from screen readers by default, because the
intended use is for [decorative purposes](https://www.w3.org/WAI/tutorials/images/decorative/).
To override, add `aria-hidden="false"` to the tag and also consider
adding an `aria-label`.

To change the size of the emoji, add a `text-[size]` utility class
using the `class` attribute, e.g. `class="text-[10rem]"`.

### Properties

- `emoji`: The emoji to use. Note that all non-emoji characters will be removed. If `undefined` the component will not be rendered at all. Default: `undefined`
- Any valid attributes of a `<div>` element.

### Usage

```tsx
<HeroEmoji emoji="🚀"/>
```
-->

<script lang="ts">
  import { concatClass } from '$lib/utils/components';
  import type { HeroEmojiProps } from './HeroEmoji.type';

  let { emoji, ...restProps }: HeroEmojiProps = $props();

  // NB: Emoji glyph filtering breaks on Safari. See: https://developer.apple.com/forums/thread/729609
</script>

{#if emoji != null && emoji !== ''}
  <div
    aria-hidden="true"
    role="img"
    style="font-variant-emoji: emoji;"
    {...concatClass(
      restProps,
      'whitespace-nowrap truncate text-clip text-center font-emoji text-[6.5rem] leading-[1.1]'
    )}>
    {emoji}
  </div>
{/if}
