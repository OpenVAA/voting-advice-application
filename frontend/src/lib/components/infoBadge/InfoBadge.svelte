<script lang="ts">
  import type {InfoBadgeProps} from './InfoBadge.type';

  type $$Props = InfoBadgeProps;
  export let text: $$Props['text'] = '';
  export let classes: $$Props['classes'] = '';
  export let disabled: $$Props['disabled'] = false;
</script>

<!--
  @component
  Small badge component used to display information next to other components.

  ### Properties

  - `text`: Text to be dispyled in the badge.
  - `classes`: Custom css classes added to the wrapping div element.

  ### Usage

  <InfoBadge text="example" classes="p-10" />

-->

<div
  class="badge badge-sm px-[0.25rem] {disabled
    ? 'border-0 bg-black text-white opacity-20'
    : 'badge-warning'}
     d-flex relative items-center justify-center text-[0.8rem] font-bold {classes}">
  <span class="m-0 p-0">{text}</span>
</div>
