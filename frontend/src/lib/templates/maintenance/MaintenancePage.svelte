<script lang="ts">
  import {onMount} from 'svelte';
  import {t} from '$lib/i18n';
  import {track} from '$lib/utils/analytics/track';
  import {sanitizeHtml} from '$lib/utils/sanitize';
  import {HeroEmoji} from '$lib/components/heroEmoji';

  onMount(() => track('maintenance_shown'));
</script>

<!--
@component
The template for showing an under maintenance page.

### Tracking events

- `maintenance_shown`

### Usage

```tsx
<MaintenancePage/>
```
-->

<!-- Page title -->
<main
  class="flex w-full flex-grow flex-col items-center justify-center bg-base-300 pb-safelgb pl-safelgl pr-safelgr pt-lg sm:items-center">
  <!-- Hero image -->
  <figure role="presentation">
    <HeroEmoji slot="hero" emoji={$t('maintenance.heroEmoji')} />
  </figure>

  <!-- Title block -->
  <div class="w-full max-w-xl py-lg text-center">
    <h1>{$t('maintenance.title')}</h1>
  </div>

  <!-- Main content -->
  <div class="flex w-full max-w-xl flex-col items-center text-center">
    {@html sanitizeHtml($t('maintenance.content'))}
  </div>
</main>
