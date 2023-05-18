<script>
  export let text;
  export let onClick;
</script>

<section class="px-3">
  <div class="flex justify-center pb-3">
    <button
      on:click={onClick}
      class="h-12 w-12 rounded-full border-4 border-solid border-white bg-secondary hover:bg-primary"
      aria-label={text} />
  </div>
  <p class="flex justify-center text-xs uppercase text-secondary">{text}</p>
</section>
