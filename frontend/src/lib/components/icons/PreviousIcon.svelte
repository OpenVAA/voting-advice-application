<script lang="ts">
  import {_} from 'svelte-i18n';
  import type {NamedIconProps} from './namedIcon.type';
  import {Icon} from '$lib/components/shared/icon';

  type $$Props = NamedIconProps;
  export let size: $$Props['size'] = undefined;
  export let color: $$Props['color'] = undefined;
  export let desc: $$Props['desc'] = undefined;
  export let title: $$Props['title'] = $_('icons.previous');

  // Icon path from Material Symbols Outlined ('FILL' 1, 'wght' 400, 'GRAD' 0, 'opsz' 24)
  // https://fonts.google.com/icons?selected=Material%20Symbols%20Outlined%3Aarrow_back_ios%3AFILL%401%3Bwght%40400%3BGRAD%400%3Bopsz%4024
  // License: Apache V 2.0, https://github.com/google/material-design-icons/blob/master/LICENSE
</script>

<Icon {size} fill={color} {desc} {title} viewBox="0 -960 960 960" {...$$restProps}>
  <path d="M400-80 0-480l400-400 71 71-329 329 329 329-71 71Z" />
</Icon>
