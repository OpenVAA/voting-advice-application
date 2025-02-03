<!--
@component
The default container used in a modal.

### Properties

- `class`: The class to apply to the modal container.

### Usage

This component is used as the default container for a modal.
You can override this by passing a different container to the
`container` prop of the `Modal` component.
  -->

<script lang="ts">
  import { concatClass } from '$lib/utils/components';
</script>

<div {...concatClass($$restProps, 'modal-box')}>
  <slot />
</div>
