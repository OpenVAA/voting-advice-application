<script lang="ts">
  import {page} from '$app/stores';
</script>

<footer class="p-lg text-center text-sm text-secondary">
  {$t('.viewTexts.publishedBy.replace')('{{0}}', '')}
  <img class="inline w-14" src={'/icons/publisher.svg'} alt="governmental" srcset="" />
  Institution • {$t('viewTexts.madeWith.replace')('{{0}}', '')}
  <img class="inline w-14" src="/icons/vote.svg" alt="" srcset="" /> OpenVAA
</footer>
