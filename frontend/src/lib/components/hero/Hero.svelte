<!--
@component
Display a hero illustration.

### Properties

- `content`: The content to display.
- Any valid attributes of a `<div>` element.

### Usage

```tsx
<Hero content={{ emoji: '🎃' }}/>
```
-->

<script lang="ts">
  import { isEmoji, isImage } from '@openvaa/app-shared';
  import { Image } from '$lib/components/image/';
  import { concatClass } from '$lib/utils/components';
  import ErrorMessage from '../errorMessage/ErrorMessage.svelte';
  import { HeroEmoji } from '../heroEmoji';
  import type { HeroProps } from './Hero.type';

  type $$Props = HeroProps;

  export let content: $$Props['content'];

  isImage(content);
</script>

<div {...concatClass($$restProps, 'overflow-hidden max-w-full flex items-center justify-center')}>
  {#if isEmoji(content)}
    <HeroEmoji emoji={content.emoji} />
  {:else if isImage(content)}
    <Image image={content} class="max-h-[25vh] max-w-full object-contain" />
  {:else}
    <ErrorMessage logMessage="Unsupported content for Hero: {JSON.stringify(content)}" />
  {/if}
</div>
