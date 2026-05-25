<!--
  Spike 016 — Outer layout
  Combines 014b's unified-layout pattern + 015's view-transitions + 016's
  explicit focus management hooks.
-->
<script lang="ts">
  import { afterNavigate, onNavigate } from '$app/navigation';
  import { page } from '$app/state';
  import { trackMount } from '../nav-forensics/mountLedger.svelte';
  import LedgerPanel from '../nav-forensics/LedgerPanel.svelte';

  let { children } = $props();
  const ledger = trackMount('A11yOuter');

  // Forensics log for a11y observations.
  let a11yLog = $state<Array<{ ts: string; event: string; detail?: string }>>([]);
  function recordA11y(event: string, detail?: string): void {
    a11yLog.push({ ts: new Date().toISOString().slice(11, 23), event, detail });
    if (a11yLog.length > 50) a11yLog.shift();
  }

  function shouldAnimate(destUrl: URL | undefined): boolean {
    if (typeof document === 'undefined') return false;
    if (!document.startViewTransition) return false;
    if (window.matchMedia?.('(prefers-reduced-motion: reduce)').matches) return false;
    if (destUrl?.searchParams.get('notr') === '1') return false;
    return true;
  }

  onNavigate((navigation) => {
    recordA11y('onNavigate-start', `${navigation.from?.url.pathname} → ${navigation.to?.url.pathname}`);
    if (!shouldAnimate(navigation.to?.url)) {
      recordA11y('skip-transition', 'reduced-motion or notr=1');
      return;
    }
    return new Promise((resolve) => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const transition = (document as any).startViewTransition(async () => {
        recordA11y('vt-callback-start');
        resolve();
        await navigation.complete;
        recordA11y('vt-callback-end');
      });
      transition.finished.then(() => recordA11y('vt-finished'));
    });
  });

  afterNavigate(({ from, to, type }) => {
    recordA11y('afterNavigate', `type=${type} ${from?.url.pathname ?? ''} → ${to?.url.pathname ?? ''}`);

    // Focus management strategy: when arriving at a question page, move
    // focus to the question's input (or its heading for VoiceOver users).
    // This must run AFTER the view transition completes so the focus ring
    // ends up on the visibly-new element rather than the snapshotted-old.
    if (typeof document === 'undefined') return;
    requestAnimationFrame(() => {
      const target =
        document.querySelector<HTMLElement>('[data-focus-on-nav]') ??
        document.querySelector<HTMLElement>('h1');
      if (target) {
        target.focus({ preventScroll: true });
        recordA11y('focus-applied', target.tagName + (target.id ? '#' + target.id : ''));
      } else {
        recordA11y('focus-skipped', 'no target');
      }
    });
  });

  // Expose log to the page for visualization.
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  if (typeof window !== 'undefined') (window as any).__a11yLog = a11yLog;
</script>

<div class="outer" data-mount-id={ledger.instanceId}>
  <header class="chrome-header">
    <strong>nav-a11y (016)</strong>
    <nav>
      <a href="/runes-test/nav-a11y/questions/q1">Q1</a>
      <a href="/runes-test/nav-a11y/questions/q2">Q2</a>
      <a href="/runes-test/nav-a11y/questions/q3">Q3</a>
      <a href="/runes-test/nav-a11y/questions/q1?notr=1">Q1 (no tr)</a>
      <a href="/runes-test/nav-a11y/questions">Index</a>
    </nav>
  </header>
  <main id="main">
    {@render children?.()}
  </main>

  <!-- aria-live region for route-change announcements (more reliable than
       relying on svelte:head title for SR announce) -->
  <div aria-live="polite" aria-atomic="true" class="sr-only" id="route-announcer">
    {page.params.questionId ? `Question ${page.params.questionId}` : 'Questions list'}
  </div>

  <!-- A11y forensic panel — flow shown to the user -->
  <aside class="a11y-panel">
    <strong>A11y log</strong>
    <ol>
      {#each a11yLog as e}
        <li><span class="ts">{e.ts}</span> <strong>{e.event}</strong>
          {#if e.detail}<span class="detail">{e.detail}</span>{/if}</li>
      {/each}
    </ol>
  </aside>

  <LedgerPanel />
</div>

<style>
  .outer {
    min-height: 100vh;
    padding-right: 38rem; /* room for both ledger AND a11y panel */
  }
  .chrome-header {
    background: #fee2e2;
    padding: 0.6rem 1rem;
    border-bottom: 2px solid #ef4444;
  }
  .chrome-header strong { margin-right: 1rem; }
  .chrome-header nav { display: inline-flex; gap: 0.6rem; flex-wrap: wrap; }
  .chrome-header a { color: #991b1b; text-decoration: underline; }
  main { padding: 1rem; }

  .a11y-panel {
    position: fixed;
    right: 23.5rem; /* sits to the left of LedgerPanel */
    top: 0.5rem;
    bottom: 0.5rem;
    width: 14rem;
    background: rgba(20, 22, 24, 0.95);
    color: #e8e8e8;
    font: 11px/1.35 ui-monospace, monospace;
    border-radius: 6px;
    padding: 0.5rem;
    z-index: 9999;
    overflow-y: auto;
  }
  .a11y-panel strong { color: #fbbf24; display: block; margin-bottom: 0.4rem; }
  .a11y-panel ol { list-style: none; padding: 0; margin: 0; }
  .a11y-panel li { margin-bottom: 0.3rem; }
  .a11y-panel .ts { color: #788; margin-right: 0.3rem; }
  .a11y-panel .detail { color: #9ad; display: block; padding-left: 0.5rem; font-size: 10px; }

  .sr-only {
    position: absolute;
    width: 1px; height: 1px;
    padding: 0; margin: -1px;
    overflow: hidden;
    clip: rect(0, 0, 0, 0);
    white-space: nowrap;
    border: 0;
  }

  /* View Transitions */
  :global(::view-transition-old(question-title)),
  :global(::view-transition-new(question-title)) {
    animation-duration: 220ms;
  }
  :global(::view-transition-old(question-body)),
  :global(::view-transition-new(question-body)) {
    animation-duration: 240ms;
  }
  @media (prefers-reduced-motion: reduce) {
    :global(::view-transition-group(*)),
    :global(::view-transition-old(*)),
    :global(::view-transition-new(*)) {
      animation: none !important;
    }
  }
</style>
