<!--
@component
The template for showing an under maintenance page outside of the main layout.

NB. Use this component only in cases of irrecoverable errors, as the template will not include any menu links.

### Props

- `title`: The title of the maintenance page. Default $t('maintenance.title')
- `content`: The content of the maintenance page. Default $t('dynamic.maintenance.content')
- `emoji`: An optional emoji to be displayed on the hero image. Default $t('dynamic.maintenance.heroEmoji')

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

  type $$Props = MaintenancePageProps;

  export let title: $$Props['title'] = undefined;
  export let content: $$Props['content'] = undefined;
  export let emoji: $$Props['emoji'] = undefined;

  const { t, track } = getAppContext();

  track('maintenance_shown');

  title ??= $t('maintenance.title');
  content ??= $t('dynamic.maintenance.content');
  emoji ??= $t('dynamic.maintenance.heroEmoji');
</script>

<!-- Page title -->
<main {...concatClass($$restProps, 'flex w-full flex-grow flex-col items-center justify-center bg-base-300 pb-safelgb pl-safelgl pr-safelgr pt-lg sm:items-center')}>
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
