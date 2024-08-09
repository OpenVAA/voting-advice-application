<script lang="ts">
  import {onMount} from 'svelte';
  import {t} from '$lib/i18n';
  import {track} from '$lib/utils/analytics/track';
  import {ErrorPage} from '../error';

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

<ErrorPage
  title={$t('maintenance.title')}
  content={$t('dynamic.maintenance.content')}
  emoji={$t('dynamic.maintenance.heroEmoji')} />
