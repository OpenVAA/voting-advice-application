<script lang="ts">
  import {page} from '$app/stores';
  import {t} from '$lib/i18n';
  const message = $page.error?.message ?? $page.status;
</script>

<div class="flex h-full flex-col justify-center">
  <h1 class="text-center text-xl text-error">
    {$t(`error.${message}`, {default: $t('error.default')})}
  </h1>
</div>
