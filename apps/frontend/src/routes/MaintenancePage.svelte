<!--
@component
The template for showing an under maintenance page outside of the main layout.

NB. Use this component only in cases of irrecoverable errors, as the template will not include any menu links.

### Props

- `title`: The title of the maintenance page. Default t('maintenance.title')
- `content`: The content of the maintenance page. Default t('dynamic.maintenance.content')
- `emoji`: An optional emoji to be displayed on the hero image. Default t('dynamic.maintenance.heroEmoji')

### Tracking events

- `maintenance_shown`

### Usage

```tsx
<MaintenancePage/>
```
-->

<script lang="ts">
  import { HeroEmoji } from '$lib/components/heroEmoji';
  import { getAppContext } from '$lib/contexts/app';
  import { concatClass } from '$lib/utils/components';
  import { sanitizeHtml } from '$lib/utils/sanitize';
  import type { MaintenancePageProps } from './MaintenancePage.type';

  let { title, content, emoji, ...restProps }: MaintenancePageProps = $props();

  const { t, track } = getAppContext();

  track('maintenance_shown');

  const effectiveTitle = $derived(title ?? t('maintenance.title'));
  const effectiveContent = $derived(content ?? t('dynamic.maintenance.content'));
  const effectiveEmoji = $derived(emoji ?? t('dynamic.maintenance.heroEmoji'));
</script>

<!-- Page title -->
<main
  {...concatClass(
    restProps,
    'flex w-full flex-grow flex-col items-center justify-center bg-base-300 pb-safelgb pl-safelgl pr-safelgr pt-lg sm:items-center'
  )}>
  <!-- Hero image -->
  <figure role="presentation">
    <HeroEmoji emoji={effectiveEmoji ?? t('dynamic.error.heroEmoji')} />
  </figure>

  <!-- Title block -->
  <div class="py-lg w-full max-w-xl text-center">
    <h1>{effectiveTitle ?? t('error.default')}</h1>
  </div>

  <!-- Main content -->
  {#if effectiveContent}
    <div class="flex w-full max-w-xl flex-col items-center text-center">
      {@html sanitizeHtml(effectiveContent)}
    </div>
  {/if}
</main>
