<script lang="ts">
  import {_} from 'svelte-i18n';
  import type {NamedIconProps} from './namedIcon.type';
  import {Icon} from '$lib/components/shared/icon';

  type $$Props = NamedIconProps;
  export let size: $$Props['size'] = undefined;
  export let color: $$Props['color'] = undefined;
  export let desc: $$Props['desc'] = undefined;
  export let title: $$Props['title'] = $_('icons.skip');

  // Icon path: see /design/icons/
</script>

<Icon {size} fill={color} {desc} {title} viewBox="0 0 24 24" {...$$restProps}>
  <path
    d="m18.4,10.6c-1.85-1.61-4.25-2.6-6.9-2.6-4.65,0-8.58,3.03-9.96,7.22l2.36.78c1.05-3.19,4.05-5.5,7.6-5.5,1.95,0,3.73.72,5.12,1.88l-3.62,3.62h9V7l-3.6,3.6Z" />
</Icon>
