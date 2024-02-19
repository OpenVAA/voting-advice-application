<script lang="ts">
  import {RequireAnswers} from '$candidate/components/answers';
</script>

<!-- Require answers to be loaded before showing a question-->
<RequireAnswers>
  <slot />
</RequireAnswers>
