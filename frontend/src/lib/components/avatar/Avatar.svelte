<!--
@component
Display either an image or a initials-based avatar for an entity. The color of the initials background is based on the entity's color or `'base-300'` by default. If the color is specified, it should be dark enough, because the `primary-content` color is used for the text.

### Properties

- `entity`: The entity for which to display the avatar.
- `size`: The size of the avatar. @default `'md'`
- `linkFullImage`: Whether to link the thumbnail to the full image. @default false
- Any valid attributes of a `<figure>` element

### Usage

```tsx
<Avatar entity={candidate} size="lg" linkFullImage/>
```
-->

<script lang="ts">
  import { Image } from '$lib/components/image/';
  import { getComponentContext } from '$lib/contexts/component';
  import { concatProps } from '$lib/utils/components';
  import { unwrapEntity } from '$lib/utils/entities';
  import { abbreviate } from '$lib/utils/text/abbreviate';
  import type { Colors, Image as ImageType } from '@openvaa/data';
  import type { AvatarProps } from './Avatar.type';

  type $$Props = AvatarProps;

  export let entity: $$Props['entity'];
  export let size: $$Props['size'] = 'md';
  export let linkFullImage: $$Props['linkFullImage'] = false;

  ////////////////////////////////////////////////////////////////////
  // Get contexts
  ////////////////////////////////////////////////////////////////////

  const { t } = getComponentContext();

  ////////////////////////////////////////////////////////////////////
  // Parse properties and create styles
  ////////////////////////////////////////////////////////////////////

  let classes: string;
  let image: ImageType | null;
  let imageStatus: 'error' | 'loading' | 'loaded' = 'loading';
  let initials: string | null;
  let initialsClasses: string;
  let name: string;
  let styles: string;

  $: {
    let color: Colors | null;
    let shortName: string;
    ({
      entity: { color, image, name, shortName }
    } = unwrapEntity(entity));
    classes = size === 'sm' ? 'w-[2.75rem] h-[2.75rem]' : 'w-[3.125rem] h-[3.125rem]';
    classes += ' shrink-0 overflow-hidden flex justify-center items-center';
    styles = '';

    if (image && imageStatus !== 'error') {
      classes += ' rounded-md';
    } else {
      classes += ' rounded-full';

      // Set custom color (if we have an image, these are not needed)
      if (color?.normal) {
        styles += ` --bg-color: ${color.normal};`;
        classes += ' bg-[var(--bg-color)] text-primary-content';
        if (color.dark) {
          styles += ` --bg-color-dark: ${color.dark};`;
          classes += ' dark:bg-[var(--bg-color-dark)]';
        }
      } else {
        classes += ' bg-base-300';
      }

      // Set initials
      initialsClasses = 'avatar placeholder text-center';
      // Use shortName if it's short enough
      initials = shortName && shortName.length <= 6 ? shortName : abbreviate(name);
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
          initialsClasses += ' text-md';
          break;
        default:
          initialsClasses += ' text-sm';
      }
    }
  }

  ////////////////////////////////////////////////////////////////////
  // Functions
  ////////////////////////////////////////////////////////////////////

  function handleImgError(): void {
    imageStatus = 'error';
  }

  function handleImgLoad(): void {
    imageStatus = 'loaded';
  }
</script>

<figure {...concatProps($$restProps, { class: classes, style: styles })}>
  {#if image && imageStatus !== 'error'}
    {#if linkFullImage}
      <a
        href={image.url}
        target="_blank"
        title={$t('common.showFullImage')}
        aria-label={$t('common.showFullImage')}
        class="h-full w-full">
        <Image
          {image}
          format="thumbnail"
          class="border-bg-300 h-full w-full border-md object-cover"
          alt={name}
          on:load={handleImgLoad}
          on:error={handleImgError} />
      </a>
    {:else}
      <Image
        {image}
        format="thumbnail"
        class="border-bg-300 h-full w-full border-md object-cover"
        alt={name}
        on:load={handleImgLoad}
        on:error={handleImgError} />
    {/if}
  {:else}
    <div class={initialsClasses}>{initials}</div>
  {/if}
</figure>
