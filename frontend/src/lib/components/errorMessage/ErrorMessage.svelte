<!--
@component
Used to display an error message.

### Properties

- `inline`: Whether to show an inline version of the error message. By default the error tries to center itself in the available area and displays a large emoji. @default `false`
- `message`: The error message to display. Default `$t('error.default')`
- Any valid attributes of a `<div>` element.

### Usage

```tsx
<ErrorMessage />
```
-->

<script lang="ts">
  import { getComponentContext } from '$lib/contexts/component';
  import { concatClass } from '$lib/utils/components';
  import { sanitizeHtml } from '$lib/utils/sanitize';
  import { HeroEmoji } from '../heroEmoji';
  import type { ErrorMessageProps } from './ErrorMessage.type';

  type $$Props = ErrorMessageProps;

  export let inline: $$Props['inline'] = false;
  export let message: $$Props['message'] = undefined;

  const { t } = getComponentContext();

  message ||= $t('error.default');
  const emoji = $t('dynamic.error.heroEmoji');

  ////////////////////////////////////////////////////////////////////
  // Styling
  ////////////////////////////////////////////////////////////////////

  const classes = inline
    ? 'inline-flex flex-row align-bottom gap-sm'
    : 'flex flex-col items-center justify-center h-full w-full gap-y-lg pb-safelgb pl-safelgl pr-safelgr pt-lg';
</script>

<div {...concatClass($$restProps, classes)}>
  {#if inline}
    <span class="text-center text-error">{message}</span>
  {:else}
    {#if emoji}
      <figure role="presentation" class="my-lg">
        <HeroEmoji {emoji} />
      </figure>
    {/if}
    <h2 class="text-center text-error">{message}</h2>
    <div class="text-center">{@html sanitizeHtml($t('error.content'))}</div>
  {/if}
</div>
