<script lang="ts">
  import type { AvatarProps } from './Avatar.type';
  import { t } from '$lib/i18n';
  import { concatProps } from '$lib/utils/components';
  import { abbreviate } from '$lib/utils/text/abbreviate';

  type $$Props = AvatarProps;
  export let name: $$Props['name'];
  export let image: $$Props['image'] = undefined;
  export let initials: $$Props['initials'] = undefined;
  export let size: $$Props['size'] = 'md';
  export let color: $$Props['color'] = 'base-300';
  export let textColor: $$Props['textColor'] = 'neutral';
  export let customColor: $$Props['customColor'] = undefined;
  export let customColorDark: $$Props['customColorDark'] = undefined;
  export let linkFullImage: $$Props['linkFullImage'] = false;

  // Create class names
  let classes: string;
  let styles: string;
  let initialsClasses: string;
  $: {
    classes = size === 'sm' ? 'w-[2.75rem] h-[2.75rem]' : 'w-[3.125rem] h-[3.125rem]';
    classes += ` shrink-0 overflow-hidden flex justify-center items-center text-${textColor}`;
    classes += image ? ' rounded-md' : ' rounded-full';
    styles = '';
    initialsClasses = 'avatar placeholder';

    // Set custom color (if we have an image, these are not needed)
    if (!image) {
      if (customColor) {
        styles += ` --bg-color: ${customColor};`;
        classes += ' bg-[var(--bg-color)]';
        if (!customColorDark) classes += ` dark:bg-${color}`;
      }
      if (customColorDark) {
        styles += ` --bg-color-dark: ${customColorDark};`;
        classes += ' dark:bg-[var(--bg-color-dark)]';
        if (!customColor) classes += ` bg-${color}`;
      }
      if (!customColor && !customColorDark) {
        classes += ` bg-${color}`;
      }
      // Set initials size
      if (!initials) initials = abbreviate(name);
      switch (initials.length) {
        case 1:
        case 2:
          initialsClasses += ' text-2xl';
          break;
        case 3:
        case 4:
          initialsClasses += ' text-xl';
          break;
        case 5:
        case 6:
          initialsClasses += ' text-lg';
          break;
        default:
          initialsClasses += ' text-md';
      }
    }
  }
</script>

<!--
@component
Display either a photo or a initials-based avatar for an entity.

### Properties

- `name`: The name of the entity. This is used either for the `alt` text of a possible image or the construction of a initials for a placeholder.
- `image`: The possible avatar image.
- `initials`: These can be provided to override the automatic initials construction.
- `size`: The size of the avatar. @default `'md'`
- `color`: The background color of the initials placeholder. @default `'base-300'`
- `textColor`: The color of the initials text placeholder. @default `'neutral'`
- `customColor`: A custom color string to use for the background color of the initials placeholder, e.g. in case of parties, which will override the `color` property. Make sure to define both `customColor` and `customColorDark` together.
- `customColorDark`: A custom color string to use for the background color of the initials placeholder in dark mode, which will override the `color` property.
- `linkFullImage`: Whether to link the thumbnail to the full image. @default false
- Any valid attributes of a `<figure>` element

### Usage

```tsx
<Avatar name={candidate.name} src={candidateRankings.photo}/>
```
-->

<figure {...concatProps($$restProps, { class: classes, style: styles })}>
  {#if image}
    {#if linkFullImage}
      <a
        href={image.url}
        target="_blank"
        title={$t('aria.showFullImage')}
        aria-label={$t('aria.showFullImage')}>
        <img
          class="border-bg-300 h-full w-full border-md object-cover"
          src={image.thumbnail.url}
          alt={name} />
      </a>
    {:else}
      <img
        class="border-bg-300 h-full w-full border-md object-cover"
        src={image.thumbnail.url}
        alt={name} />
    {/if}
  {:else}
    <div class={initialsClasses}>{initials}</div>
  {/if}
</figure>
