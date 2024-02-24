<script lang="ts">
  import {HeaderActions} from '../parts';
</script>

<HeaderActions>
  <button on:click={() => console.info('foo')}>Help</button>
</HeaderActions>

<slot />
