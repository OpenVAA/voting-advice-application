<!--
@component
The template for showing an under maintenance page outside of the main layout.

NB. Use this component only in cases of irrecoverable errors, as the template will not include any menu links.

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
  import { sanitizeHtml } from '$lib/utils/sanitize';

  const { t, track } = getAppContext();

  track('maintenance_shown');
  
  const title = $t('maintenance.title');
  const content = $t('dynamic.maintenance.content');
  const emoji = $t('dynamic.maintenance.heroEmoji');
</script>

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
