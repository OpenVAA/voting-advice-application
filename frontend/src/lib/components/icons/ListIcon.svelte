<script lang="ts">
  import {_} from 'svelte-i18n';
  import type {NamedIconProps} from './namedIcon.type';
  import {Icon} from '$lib/components/shared/icon';

  type $$Props = NamedIconProps;
  export let size: $$Props['size'] = undefined;
  export let color: $$Props['color'] = undefined;
  export let desc: $$Props['desc'] = undefined;
  export let title: $$Props['title'] = $_('icons.list');

  // Icon path from Material Symbols Outlined ('FILL' 1, 'wght' 400, 'GRAD' 0, 'opsz' 24)
  // https://fonts.google.com/icons?selected=Material%20Symbols%20Outlined%3Aformat_list_bulleted%3AFILL%401%3Bwght%40400%3BGRAD%400%3Bopsz%4024
  // License: Apache V 2.0, https://github.com/google/material-design-icons/blob/master/LICENSE
</script>

<Icon {size} fill={color} {desc} {title} viewBox="0 -960 960 960" {...$$restProps}>
  <path
    d="M360-200v-80h480v80H360Zm0-240v-80h480v80H360Zm0-240v-80h480v80H360ZM200-160q-33 0-56.5-23.5T120-240q0-33 23.5-56.5T200-320q33 0 56.5 23.5T280-240q0 33-23.5 56.5T200-160Zm0-240q-33 0-56.5-23.5T120-480q0-33 23.5-56.5T200-560q33 0 56.5 23.5T280-480q0 33-23.5 56.5T200-400Zm0-240q-33 0-56.5-23.5T120-720q0-33 23.5-56.5T200-800q33 0 56.5 23.5T280-720q0 33-23.5 56.5T200-640Z" />
</Icon>
