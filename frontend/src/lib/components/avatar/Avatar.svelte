<script lang="ts">
  import {concatClass} from '$lib/utils/components';
  import {abbreviate} from '$lib/utils/text/abbreviate';
  import type {AvatarProps} from './Avatar.type';

  type $$Props = AvatarProps;
  export let name: $$Props['name'];
  export let src: $$Props['src'] = undefined;
  export let initials: $$Props['initials'] = undefined;
  export let color: $$Props['color'] = 'base-300';

  // Create class names
  let classes: string;
  $: {
    classes = `w-[3.125rem] h-[3.125rem] overflow-hidden flex justify-center items-center bg-${color}`;
    classes += src ? ' rounded-md' : ' rounded-full';
  }
</script>

<!--
@component
Display either a photo or a initials-based avatar for an entity.

### Properties

- `name`: The name of the entity. This is used either for the `alt` text of a possible image or the construction of a initials for a placeholder.
- `src`: The `src` of the avatar image.
- `initials`: These can be provided to override the automatic initials construction.
- `color`: The background color of the initials placeholder. @default `'base-300'`
- Any valid attributes of a `<figure>` element

### Usage

```tsx
<Avatar name={candidate.name} src={candidateRankings.photo}/>
```
-->

<figure {...concatClass($$restProps, classes)}>
  {#if src}
    <img class="h-full w-full object-contain" {src} alt={name} />
  {:else}
    <div class="avatar placeholder text-2xl">
      {initials ?? abbreviate(name)}
    </div>
  {/if}
</figure>
