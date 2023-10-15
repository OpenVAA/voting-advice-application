<script lang="ts">
  import {_} from 'svelte-i18n';
  import type {NamedIconProps} from './namedIcon.type';
  import {Icon} from '$lib/components/shared/icon';

  type $$Props = NamedIconProps;
  export let size: $$Props['size'] = undefined;
  export let color: $$Props['color'] = undefined;
  export let desc: $$Props['desc'] = undefined;
  export let title: $$Props['title'] = $_('icons.feedback');

  // Icon path from Material Symbols Outlined ('FILL' 1, 'wght' 400, 'GRAD' 0, 'opsz' 24)
  // https://fonts.google.com/icons?selected=Material%20Symbols%20Outlined%3Afeedback%3AFILL%401%3Bwght%40400%3BGRAD%400%3Bopsz%4024
  // License: Apache V 2.0, https://github.com/google/material-design-icons/blob/master/LICENSE
</script>

<Icon {size} fill={color} {desc} {title} viewBox="0 -960 960 960" {...$$restProps}>
  <path
    d="M80-80v-720q0-33 23.5-56.5T160-880h640q33 0 56.5 23.5T880-800v480q0 33-23.5 56.5T800-240H240L80-80Zm400-280q17 0 28.5-11.5T520-400q0-17-11.5-28.5T480-440q-17 0-28.5 11.5T440-400q0 17 11.5 28.5T480-360Zm-40-160h80v-240h-80v240Z" />
</Icon>
