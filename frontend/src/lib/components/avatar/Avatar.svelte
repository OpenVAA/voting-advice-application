<script lang="ts">
  import {t} from '$lib/i18n';
  import {concatClass} from '$lib/utils/components';
  import {abbreviate} from '$lib/utils/text/abbreviate';
  import type {AvatarProps} from './Avatar.type';

  type $$Props = AvatarProps;
  export let name: $$Props['name'];
  export let image: $$Props['image'] = undefined;
  export let initials: $$Props['initials'] = undefined;
  export let color: $$Props['color'] = 'base-300';
  export let linkFullImage: $$Props['linkFullImage'] = false;

  // Create class names
  let classes: string;
  $: {
    classes = `w-[3.125rem] h-[3.125rem] overflow-hidden flex justify-center items-center bg-${color}`;
    classes += image ? ' rounded-md' : ' rounded-full';
  }
</script>

<!--
@component
Display either a photo or a initials-based avatar for an entity.

### Properties

- `name`: The name of the entity. This is used either for the `alt` text of a possible image or the construction of a initials for a placeholder.
- `image`: The possible avatar image.
- `initials`: These can be provided to override the automatic initials construction.
- `color`: The background color of the initials placeholder. @default `'base-300'`
- `linkFullImage`: Whether to link the thumbnail to the full image. @default false
- Any valid attributes of a `<figure>` element

### Usage

```tsx
<Avatar name={candidate.name} src={candidateRankings.photo}/>
```
-->

<figure {...concatClass($$restProps, classes)}>
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
    <div class="avatar placeholder text-2xl">
      {initials ?? abbreviate(name)}
    </div>
  {/if}
</figure>
