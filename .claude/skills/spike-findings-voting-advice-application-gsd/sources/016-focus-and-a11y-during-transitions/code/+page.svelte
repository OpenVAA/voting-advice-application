<script lang="ts">
  import { trackMount } from '../nav-forensics/mountLedger.svelte';
  const ledger = trackMount('A11yIndex');
</script>

<article data-mount-id={ledger.instanceId}>
  <h1 data-focus-on-nav tabindex="-1">Spike 016 — focus + a11y under transitions</h1>
  <p>Combines 014b unified layout + 015 view transitions + explicit focus
    management via <code>afterNavigate</code> + <code>aria-live</code>
    route announcer.</p>
  <p>Protocol:
    <ol>
      <li>Tab focus into the page. Note where focus lands.</li>
      <li>Click Q1. Watch the A11y log for the event sequence.</li>
      <li>Press Tab on Q1 to enter the input. Then click Q2.</li>
      <li>Verify: focus lands on the new heading (or input if you mark it), not lost.</li>
      <li>Toggle reduced motion + retest — focus should still apply.</li>
    </ol>
  </p>
</article>

<style>
  article { max-width: 50rem; line-height: 1.5; }
  h1 { outline: none; }
  h1:focus-visible {
    outline: 3px solid #3b82f6;
    outline-offset: 4px;
    border-radius: 4px;
  }
</style>
