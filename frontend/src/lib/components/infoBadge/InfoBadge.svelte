<script lang="ts">
  import type {InfoBadgeProps} from './InfoBadge.type';

  type $$Props = InfoBadgeProps;
  export let text: $$Props['text'] = '';
  export let classes: $$Props['classes'] = '';
  export let disabled: $$Props['disabled'] = false;

  let baseClasses = 'badge badge-sm px-[0.25rem]';

  classes = ` font-bold relative text-[0.8rem] d-flex justify-center items-center ${classes}`;
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
  class="{baseClasses} {disabled
    ? 'border-0 bg-black text-white opacity-20'
    : 'badge-warning'} {classes}">
  <span class="m-0 p-0">{text}</span>
</div>
