<!--
@component
Used to display an error message. Also logs the error to the console.

### Properties

- `inline`: Whether to show an inline version of the message. By default the message tries to center itself in the available area and displays a large emoji. @default `false`
- `message`: The message to display. Default `$t('error.default')`
- `logMessage`: The message to log in the console in development mode. @default value of `message`
- Any valid attributes of a `<div>` element.

### Usage

```tsx
<ErrorMessage />
```
-->

<script lang="ts">
  import { getComponentContext } from '$lib/contexts/component';
  import { concatClass } from '$lib/utils/components';
  import { logDebugError } from '$lib/utils/logger';
  import { sanitizeHtml } from '$lib/utils/sanitize';
  import { HeroEmoji } from '../heroEmoji';
  import type { ErrorMessageProps } from './ErrorMessage.type';

  type $$Props = ErrorMessageProps;

  export let inline: $$Props['inline'] = false;
  export let message: $$Props['message'] = undefined;
  export let logMessage: $$Props['logMessage'] = undefined;

  const { t } = getComponentContext();

  message ||= $t('error.default');
  const emoji = $t('dynamic.error.heroEmoji');

  ////////////////////////////////////////////////////////////////////
  // Log error
  ////////////////////////////////////////////////////////////////////

  logDebugError(`[ErrorMessage] ${logMessage || message}`);

  ////////////////////////////////////////////////////////////////////
  // Styling
  ////////////////////////////////////////////////////////////////////

  const classes = inline
    ? 'inline-flex flex-row align-bottom gap-sm'
    : 'flex flex-col items-center justify-center h-full w-full gap-y-lg pb-safelgb pl-safelgl pr-safelgr pt-lg';
</script>

<div {...concatClass($$restProps, classes)}>
  {#if inline}
    <span class="text-center text-error">{emoji} {message}</span>
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
