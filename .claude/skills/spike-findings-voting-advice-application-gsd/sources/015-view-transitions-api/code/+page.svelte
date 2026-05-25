<script lang="ts">
  import { trackMount } from '../nav-forensics/mountLedger.svelte';
  const ledger = trackMount('TransitionsIndex');
  const supported = $derived(typeof document !== 'undefined' && 'startViewTransition' in document);
  const prefersReduce = $derived(typeof window !== 'undefined' && window.matchMedia?.('(prefers-reduced-motion: reduce)').matches);
</script>

<article data-mount-id={ledger.instanceId}>
  <h1>Spike 015 — view-transitions-api</h1>
  <p><strong>Browser support:</strong> {supported ? '✓ document.startViewTransition available' : '✗ not supported'} •
    <strong>Reduced motion:</strong> {prefersReduce ? 'preferred — transitions disabled' : 'not preferred'}</p>
  <p>This route applies <code>onNavigate(document.startViewTransition)</code> to wrap
    every client-side nav. Compare with <code>?notr=1</code> links to feel the difference.</p>
  <ol>
    <li>Click <strong>Q1</strong> to start. Watch for a slide-in.</li>
    <li>Click <strong>Q2</strong>. The title slides down/up and the hero cross-fades.</li>
    <li>Click <strong>Q1 (no transitions)</strong> — instant swap, no animation.</li>
    <li>Toggle reduced motion in your OS — transitions should disable automatically.</li>
  </ol>
</article>

<style>
  article { max-width: 50rem; line-height: 1.5; }
</style>
