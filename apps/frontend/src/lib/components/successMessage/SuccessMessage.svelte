<!--
@component
Used to display a message when an action succeeds.

### Properties

- `inline`: Whether to show an inline version of the message. By default the message tries to center itself in the available area and displays a large emoji. Default: `false`
- `message`: The message to display. Default: `t('common.success')`
- Any valid attributes of a `<div>` element.

### Usage

```tsx
<SuccessMessage />
<SuccessMessage inline message="Password saved!" />
```
-->

<script lang="ts">
  import { getComponentContext } from '$lib/contexts/component';
  import { concatClass } from '$lib/utils/components';
  import { HeroEmoji } from '../heroEmoji';
  import type { SuccessMessageProps } from './SuccessMessage.type';

  let { inline = false, message, ...restProps }: SuccessMessageProps = $props();

  const { t } = getComponentContext();

  message ||= t('common.success');
  const emoji = t('dynamic.success.heroEmoji');

  ////////////////////////////////////////////////////////////////////
  // Styling
  ////////////////////////////////////////////////////////////////////

  const classes = inline
    ? 'inline-flex flex-row align-bottom gap-sm'
    : 'flex flex-col items-center justify-center h-full w-full gap-y-lg pb-safelgb pl-safelgl pr-safelgr pt-lg';
</script>

<div {...concatClass(restProps, classes)}>
  {#if inline}
    <span class="text-success text-center">{emoji} {message}</span>
  {:else}
    {#if emoji}
      <figure role="presentation" class="my-lg">
        <HeroEmoji {emoji} />
      </figure>
    {/if}
    <h2 class="text-success text-center">{message}</h2>
  {/if}
</div>
