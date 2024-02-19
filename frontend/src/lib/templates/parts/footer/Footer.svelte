<script lang="ts">
  import {t} from '$lib/i18n';
</script>

<footer class="p-lg text-center text-sm text-secondary">
  {$t('viewTexts.publishedBy', {publisher: 'OpenVAA'})}
  <img class="inline w-14" src={'/icons/publisher.svg'} alt="governmental" srcset="" /> • {$t(
    'viewTexts.madeWith',
    {openVAA: 'OpenVAA'}
  )}
  <img class="inline w-14" src="/icons/vote.svg" alt="" srcset="" /> OpenVAA
</footer>
