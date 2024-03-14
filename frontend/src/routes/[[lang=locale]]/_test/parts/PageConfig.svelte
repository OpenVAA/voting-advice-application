<script lang="ts">
  import {getPageContext} from './page.context';

  export let containerClass = '';

  const ctx = getPageContext();

  $: {
    ctx.containerClass.set(containerClass);
  }
</script>
