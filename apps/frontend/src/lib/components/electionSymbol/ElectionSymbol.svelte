<!--
@component
Display an entity's election symbol, which is usually a number but may also be an image, e.g. in Pakistan.

### Properties

- `text`: The text of the symbol, e.g. '15' or 'A'. If the symbol is an image, `text` will be used as its `alt` attribute.
- `image`: The `src` of an image election symbol.
- Any valid attributes of a `<span>` element

### Usage

```tsx
<ElectionSymbol>46</ElectionSymbol>
<ElectionSymbol><img src="arrow.png" alt="Arrow"/></ElectionSymbol>
```
-->

<script lang="ts">
  import { concatClass } from '$lib/utils/components';
  import type { ElectionSymbolProps } from './ElectionSymbol.type';

  let { text, image, ...restProps }: ElectionSymbolProps = $props();

  let classes = $derived.by(() => {
    let c =
      'flex items-center justify-center h-[1.6rem] min-w-[1.6rem] border border-sm border-color-[var(--line-color)] rounded-sm ';
    if (!image) c += ' px-4 font-bold';
    return c;
  });
</script>

<span {...concatClass(restProps, classes)}>
  {#if image}
    <img src={image} alt={text} class="h-full w-full object-contain" />
  {:else}
    {text}
  {/if}
</span>
