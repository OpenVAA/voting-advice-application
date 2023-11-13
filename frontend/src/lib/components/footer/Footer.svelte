<script lang="ts">
  import {page} from '$app/stores';
</script>

<footer class="p-lg text-center text-sm text-secondary">
  {$page.data.appLabels.viewTexts.publishedBy.replace('{{0}}', '')}
  <img class="inline w-14" src={'/icons/publisher.svg'} alt="governmental" srcset="" />
  Institution • {$page.data.appLabels.viewTexts.madeWith.replace('{{0}}', '')}
  <img class="inline w-14" src="/icons/vote.svg" alt="" srcset="" /> OpenVAA
</footer>
