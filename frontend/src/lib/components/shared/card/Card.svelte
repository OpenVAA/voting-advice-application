<script lang="ts">
  import type {CardProps} from './Card.type';

  type $$Props = CardProps;

  export let keyboardClick: $$Props['keyboardClick'] = 'Enter';

  if (keyboardClick && typeof keyboardClick === 'string') keyboardClick = [keyboardClick];

  let cardElement: HTMLElement;

  /**
   * Trigger the on:click handler when any of the listed keyboard keys
   * is pressed.
   *
   * TODO: Wrap the item in an `<a>` so that tabbed browsing works and then
   * we won't need this keyboard handler anymore.
   */
  function onKeyPress(event: KeyboardEvent) {
    if (cardElement && keyboardClick && keyboardClick.includes(event.key)) {
      cardElement.click();
    }
  }
</script>

<!-- svelte-ignore a11y-no-noninteractive-tabindex -->
<article
  class="duration-300 relative flex cursor-pointer flex-col rounded-md bg-base-100 p-md transition-shadow ease-in-out hover:shadow-xl"
  {...$$props}
  bind:this={cardElement}
  on:click
  on:keypress={onKeyPress}
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
