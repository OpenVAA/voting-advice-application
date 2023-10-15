<script lang="ts">
  import {_} from 'svelte-i18n';
  import type {NamedIconProps} from './namedIcon.type';
  import {Icon} from '$lib/components/shared/icon';

  type $$Props = NamedIconProps;
  export let size: $$Props['size'] = undefined;
  export let color: $$Props['color'] = undefined;
  export let desc: $$Props['desc'] = undefined;
  export let title: $$Props['title'] = $_('icons.info');

  // Icon path from Material Symbols Outlined ('FILL' 1, 'wght' 400, 'GRAD' 0, 'opsz' 24)
  // https://fonts.google.com/icons?selected=Material%20Symbols%20Outlined%3Ainfo%3AFILL%401%3Bwght%40400%3BGRAD%400%3Bopsz%4024
  // License: Apache V 2.0, https://github.com/google/material-design-icons/blob/master/LICENSE
</script>

<Icon {size} fill={color} {desc} {title} viewBox="0 -960 960 960" {...$$restProps}>
  <path
    d="M440-280h80v-240h-80v240Zm40-320q17 0 28.5-11.5T520-640q0-17-11.5-28.5T480-680q-17 0-28.5 11.5T440-640q0 17 11.5 28.5T480-600Zm0 520q-83 0-156-31.5T197-197q-54-54-85.5-127T80-480q0-83 31.5-156T197-763q54-54 127-85.5T480-880q83 0 156 31.5T763-763q54 54 85.5 127T880-480q0 83-31.5 156T763-197q-54 54-127 85.5T480-80Z" />
</Icon>
