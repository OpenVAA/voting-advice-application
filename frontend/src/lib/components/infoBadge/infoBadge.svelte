<script lang="ts">
  import type {infoBadgeProps} from './infoBadge.type';

  type $$Props = infoBadgeProps;
  export let text: $$Props['text'] = '';
  export let classes: $$Props['classes'] = 'badge';

  const baseClasses =
    'badge badge-sm badge-warning px-[0.2rem] relative text-[0.8rem] d-flex justify-center items-center';

  const finalClasses = `${baseClasses} ${classes}`;
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

<div class={finalClasses}><span class="m-0 p-0">{text}</span></div>
