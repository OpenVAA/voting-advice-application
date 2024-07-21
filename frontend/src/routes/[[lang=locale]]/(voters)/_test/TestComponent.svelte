<script lang="ts">
  import {getComponentsContext} from '$lib/_contexts/components';
  export let key: string;
  const {t} = getComponentsContext();
</script>

<strong>Test component fetching translations: ({$t(key)})</strong>
