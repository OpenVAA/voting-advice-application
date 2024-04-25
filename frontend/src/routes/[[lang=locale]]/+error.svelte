<script lang="ts">
  import {page} from '$app/stores';
  import {t} from '$lib/i18n';
</script>

<div class="flex h-full flex-col justify-center">
  <h1 class="text-center text-xl text-error">
    {$t(`error.${$page.status}`, {default: $t('error.default')})}
  </h1>
</div>
