<script lang="ts">
  import {t} from '$lib/i18n';
  import {sanitizeHtml} from '$lib/utils/sanitize';
  import {HeroEmoji} from '$lib/components/heroEmoji';
  import type {ErrorPageProps} from './ErrorPage.type';

  type $$Props = ErrorPageProps;

  export let title: $$Props['title'] = undefined;
  export let content: $$Props['content'] = undefined;
  export let emoji: $$Props['emoji'] = undefined;
</script>

<!--
@component
The template for showing an error page.

NB. Use this component only in cases of irrecoverable errors, as the template will not include any menu links.

### Properties

- `title`: The title of the page
- `content`: The text content of the page, which will be displayed as HTML and sanitized.
- `emoji`: The hero emoji to be displayed on the page.

### Usage

```tsx
<ErrorPage title="An Unknown Error Occured" emoji="💔"/>
```
-->

<!-- Page title -->
<main
  class="flex w-full flex-grow flex-col items-center justify-center bg-base-300 pb-safelgb pl-safelgl pr-safelgr pt-lg sm:items-center">
  <!-- Hero image -->
  <figure role="presentation">
    <HeroEmoji emoji={emoji ?? $t('dynamic.error.heroEmoji')} />
  </figure>

  <!-- Title block -->
  <div class="w-full max-w-xl py-lg text-center">
    <h1>{title ?? $t('error.default')}</h1>
  </div>

  <!-- Main content -->
  {#if content}
    <div class="flex w-full max-w-xl flex-col items-center text-center">
      {@html sanitizeHtml(content)}
    </div>
  {/if}
</main>
