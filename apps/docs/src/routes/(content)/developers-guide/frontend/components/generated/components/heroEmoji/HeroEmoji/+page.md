# HeroEmoji

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
<HeroEmoji emoji="🚀" />
```

## Source

[frontend/src/lib/components/heroEmoji/HeroEmoji.svelte](https://github.com/OpenVAA/voting-advice-application/blob/main/frontend/src/lib/components/heroEmoji/HeroEmoji.svelte)

[frontend/src/lib/components/heroEmoji/HeroEmoji.type.ts](https://github.com/OpenVAA/voting-advice-application/blob/main/frontend/src/lib/components/heroEmoji/HeroEmoji.type.ts)
