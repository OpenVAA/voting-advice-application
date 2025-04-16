<!--@component
Card component for displaying content in a box with shadow
-->
<script lang="ts">
  import { concatClass } from '$lib/utils/components';
  import type { CardProps } from './Card.type';

  type $$Props = CardProps;
</script>

<div {...concatClass($$restProps, 'rounded-lg bg-white shadow-sm')}>
  <slot />
</div>
