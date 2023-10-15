<script lang="ts">
  import {_} from 'svelte-i18n';
  import type {NamedIconProps} from './namedIcon.type';
  import {Icon} from '$lib/components/shared/icon';

  type $$Props = NamedIconProps;
  export let size: $$Props['size'] = undefined;
  export let color: $$Props['color'] = undefined;
  export let desc: $$Props['desc'] = undefined;
  export let title: $$Props['title'] = $_('icons.candidate');

  // Icon path from Material Symbols Outlined ('FILL' 1, 'wght' 400, 'GRAD' 0, 'opsz' 24)
  // https://fonts.google.com/icons?selected=Material%20Symbols%20Outlined%3Aperson%3AFILL%401%3Bwght%40400%3BGRAD%400%3Bopsz%4024
  // License: Apache V 2.0, https://github.com/google/material-design-icons/blob/master/LICENSE
</script>

<Icon {size} fill={color} {desc} {title} viewBox="0 -960 960 960" {...$$restProps}>
  <path
    d="M480-480q-66 0-113-47t-47-113q0-66 47-113t113-47q66 0 113 47t47 113q0 66-47 113t-113 47ZM160-160v-112q0-34 17.5-62.5T224-378q62-31 126-46.5T480-440q66 0 130 15.5T736-378q29 15 46.5 43.5T800-272v112H160Z" />
</Icon>
