<script lang="ts">
  import type {CardProps} from './Card.type';

  type $$Props = CardProps;
  // TODO: Only apply the cursor-pointer hover:shadow-xl classes if the on:click
  // prop is set. But how to check for this? It's not listed in $$props...
</script>

<!-- svelte-ignore a11y-no-noninteractive-tabindex -->
<article
  class="duration-300 relative flex cursor-pointer flex-col rounded-md bg-base-100 p-md transition-shadow ease-in-out hover:shadow-xl"
  {...$$props}
  on:click
  on:keypress>
  <div class="flex justify-stretch gap-md">
    <figure>
      <slot name="card-media" />
    </figure>
    <div class="flex w-full flex-row items-center justify-between">
      <div class="flex flex-col items-start gap-6">
        <slot name="body-title" />
        <slot name="body-content" />
      </div>
      <div class="flex flex-row">
        <slot name="body-match" />
      </div>
    </div>
  </div>
  <div>
    <slot name="card-footer" />
  </div>
</article>
