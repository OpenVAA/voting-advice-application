<script lang="ts">
  import {answerContext} from '$lib/utils/answerStore';
  import {onMount, setContext} from 'svelte';

  setContext('answers', answerContext);

  onMount(() => {
    answerContext.loadAnswerData();
  });
</script>

<slot />
