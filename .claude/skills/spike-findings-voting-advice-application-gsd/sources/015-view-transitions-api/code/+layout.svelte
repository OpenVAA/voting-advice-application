<!--
  Spike 015 — Outer layout
  Wires up onNavigate(document.startViewTransition) for cross-route nav
  inside this branch. Honors prefers-reduced-motion + a runtime ?notr=1
  toggle so we can see same-tree behavior with and without transitions.
-->
<script lang="ts">
  import { onNavigate } from '$app/navigation';
  import { trackMount } from '../nav-forensics/mountLedger.svelte';
  import LedgerPanel from '../nav-forensics/LedgerPanel.svelte';

  let { children } = $props();
  const ledger = trackMount('TransitionOuter');

  // Per-navigation decision. We check the DESTINATION (`navigation.to.url`)
  // not `page.url`, because page.url still reflects the source URL during
  // onNavigate. The destination is what the user is going to.
  function shouldAnimate(destUrl: URL | undefined): boolean {
    if (typeof document === 'undefined') return false;
    if (!document.startViewTransition) return false;
    if (window.matchMedia?.('(prefers-reduced-motion: reduce)').matches) return false;
    if (destUrl?.searchParams.get('notr') === '1') return false;
    return true;
  }

  // SvelteKit pattern: onNavigate runs BEFORE the new page is rendered. If
  // we return a Promise, SvelteKit waits for it before swapping. The
  // browser's startViewTransition takes a callback that should APPLY THE
  // DOM CHANGE — but the SvelteKit swap happens INSIDE the resolved
  // promise. So the canonical pattern is: capture the "complete" promise
  // SvelteKit returns from `navigation.complete`, and feed it to
  // startViewTransition.
  onNavigate((navigation) => {
    if (!shouldAnimate(navigation.to?.url)) return;
    return new Promise((resolve) => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const transition = (document as any).startViewTransition(async () => {
        resolve();
        await navigation.complete;
      });
      void transition;
    });
  });
</script>

<div class="outer" data-mount-id={ledger.instanceId}>
  <header class="chrome-header">
    <strong>nav-transitions (015)</strong>
    <nav>
      <a href="/runes-test/nav-transitions/questions/q1">Q1</a>
      <a href="/runes-test/nav-transitions/questions/q2">Q2</a>
      <a href="/runes-test/nav-transitions/questions/q3">Q3</a>
      <a href="/runes-test/nav-transitions/questions/q1?notr=1">Q1 (no transitions)</a>
      <a href="/runes-test/nav-transitions/questions/q2?notr=1">Q2 (no transitions)</a>
      <a href="/runes-test/nav-transitions/questions">Index</a>
    </nav>
  </header>

  <main>{@render children?.()}</main>

  <LedgerPanel />
</div>

<style>
  .outer {
    min-height: 100vh;
    padding-right: 23rem;
  }
  .chrome-header {
    background: #fce7f3;
    padding: 0.6rem 1rem;
    border-bottom: 2px solid #ec4899;
  }
  .chrome-header strong { margin-right: 1rem; }
  .chrome-header nav { display: inline-flex; gap: 0.6rem; flex-wrap: wrap; }
  .chrome-header a {
    color: #9d174d;
    text-decoration: underline;
  }
  main { padding: 1rem; }

  /* ── View Transitions CSS ─────────────────────────────────── */

  /* Customize the default cross-fade for the "old" snapshot:
     slide-out to the left over 280ms */
  :global(::view-transition-old(root)) {
    animation: 280ms cubic-bezier(0.4, 0, 0.2, 1) both slide-out-left;
  }
  :global(::view-transition-new(root)) {
    animation: 280ms cubic-bezier(0.4, 0, 0.2, 1) both slide-in-right;
  }

  /* Per-element transitions — these names are assigned in the child route's
     CSS via `view-transition-name`. The browser pairs old + new by name. */
  :global(::view-transition-old(question-title)) {
    animation: 220ms cubic-bezier(0.4, 0, 0.2, 1) both fade-out-up;
  }
  :global(::view-transition-new(question-title)) {
    animation: 220ms cubic-bezier(0.4, 0, 0.2, 1) both fade-in-down;
  }

  :global(::view-transition-old(question-hero)),
  :global(::view-transition-new(question-hero)) {
    animation-duration: 200ms;
  }

  /* Honor reduced motion preference at the CSS level too (belt + braces) */
  @media (prefers-reduced-motion: reduce) {
    :global(::view-transition-group(*)),
    :global(::view-transition-old(*)),
    :global(::view-transition-new(*)) {
      animation: none !important;
    }
  }

  @keyframes slide-out-left {
    from { transform: translateX(0); opacity: 1; }
    to { transform: translateX(-30px); opacity: 0; }
  }
  @keyframes slide-in-right {
    from { transform: translateX(30px); opacity: 0; }
    to { transform: translateX(0); opacity: 1; }
  }
  @keyframes fade-out-up {
    from { transform: translateY(0); opacity: 1; }
    to { transform: translateY(-10px); opacity: 0; }
  }
  @keyframes fade-in-down {
    from { transform: translateY(10px); opacity: 0; }
    to { transform: translateY(0); opacity: 1; }
  }
</style>
