<script lang="ts">
  import type { HeroEmojiProps } from './HeroEmoji.type';
  import { concatClass } from '$lib/utils/components';

  type $$Props = HeroEmojiProps;

  export let emoji: $$Props['emoji'] = undefined;

  // We cannot currently use this filtering to remove non-emoji glyphs because it breaks the emojis on Safari. See: https://developer.apple.com/forums/thread/729609
  // $: if (emoji != null && emoji !== '') {
  //   emoji = emoji.replace(/\P{Extended_Pictographic}/gu, '');
  // }
</script>

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

- `emoji`: The emoji to use. Note that all non-emoji characters will be removed. If `undefined` the component will not be rendered at all. @default `undefined`
- `aria-hidden`: @default `true`
- `role`: Aria role @default `img`
- `class`: Additional class string to append to the element's default classes.
- Any valid attributes of a `<div>` element.

### Usage

```tsx
<HeroEmoji emoji="🚀"/>
```
-->

{#if emoji != null && emoji !== ''}
  <div
    aria-hidden="true"
    role="img"
    style="font-variant-emoji: emoji;"
    {...concatClass(
      $$restProps,
      'whitespace-nowrap truncate text-clip text-center font-emoji text-[6.5rem] leading-[1.1]'
    )}>
    {emoji}
  </div>
{/if}
