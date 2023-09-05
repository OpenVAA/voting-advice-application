<script lang="ts">
  import type {CardProps} from './Card.type';

  type $$Props = CardProps;
</script>

<!-- svelte-ignore a11y-no-noninteractive-tabindex -->
<article
  class="relative flex flex-col rounded-2xl bg-base-100 p-6 transition-shadow duration-300 ease-in-out hover:shadow-xl"
  {...$$props}
  on:click
  on:keypress>
  <div class="flex justify-stretch gap-4">
    <figure>
      <slot name="card-media" />
    </figure>
    <div class="flex w-full flex-row items-center justify-between">
      <div class="flex flex-col items-start justify-evenly">
        <slot name="body-title" />
        <slot name="body-content" />
      </div>
      <div class="flex flex-row">
        <slot name="body-match" />
      </div>
    </div>
  </div>
  <div class="p-1">
    <slot name="card-footer" />
  </div>
</article>
