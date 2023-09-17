<script lang="ts">
  import '../app.css';
  import type {LayoutServerData} from './$types';

  export let data: LayoutServerData;

  if (!(data.appLabels && data.election)) {
    throw new Error('AppLabels or election not found');
  }
</script>

<main>
  <slot />
</main>
