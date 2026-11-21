<!--
@component A checkbox by which the user opts out of the collection of usage data. Ticked means opt out.

The component only holds the choice. Whether it is shown and what is done with the choice are decided by its caller.

### Dynamic component

Accesses `ComponentContext`.

### Properties

- `optOut`: Bindable: Whether the user opts out of the collection of usage data. Default: `false`
- Any valid attributes of a `<div>` element

### Usage

```tsx
<script lang="ts">
  let optOut = $state(false);
</script>
<TrackingOptOut bind:optOut />
```
-->

<script lang="ts">
  import { getComponentContext } from '$lib/contexts/component';
  import { concatClass } from '$lib/utils/components';
  import type { TrackingOptOutProps } from './TrackingOptOut.type';

  let { optOut = $bindable(false), ...restProps }: TrackingOptOutProps = $props();

  ////////////////////////////////////////////////////////////////////
  // Get contexts
  ////////////////////////////////////////////////////////////////////

  const { t } = getComponentContext();
</script>

<div {...concatClass(restProps, 'flex flex-col items-center')}>
  <label class="label mb-md gap-sm cursor-pointer justify-start !p-0">
    <!-- bind: keep — two-way DOM checkbox; optOut is $bindable(false). -->
    <input
      type="checkbox"
      class="checkbox"
      name="trackingOptOut"
      bind:checked={optOut}
      data-testid="terms-tracking-opt-out" />
    <span>{t('privacy.trackingOptOut.label')}</span>
  </label>
</div>
