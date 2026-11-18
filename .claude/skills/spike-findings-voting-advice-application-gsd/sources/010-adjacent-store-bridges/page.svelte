<!--
  SPIKE 010 — Rune-native popupQueue demo.

  Mirrors the production +layout.svelte:69+230 consumer pattern with the
  rune-native store. Buttons push/shift fake popup items and the current head
  of the queue renders directly from `popup.current` (no fromStore).
-->
<script lang="ts">
  import { popupRuneStore } from './popupRuneStore.svelte';

  const popup = popupRuneStore();

  // .ts $derived alias is OPTIONAL for popup since the value is read once per
  // queue change. Template direct works equivalently.
  const current = $derived(popup.current);

  let queueDisplay = $state<Array<string>>([]);

  function pushFake(label: string) {
    popup.push({
      // Use any() to bypass component type — the spike doesn't need a real
      // SvelteComponent, just a unique identity for queue depth observation.
      component: { name: label } as unknown as PopupQueueItemComponent
    });
    queueDisplay = [...queueDisplay, label];
  }
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  type PopupQueueItemComponent = any;

  function shiftFake() {
    popup.shift();
    queueDisplay = queueDisplay.slice(1);
  }
</script>

<div class="p-6 max-w-3xl mx-auto space-y-4 font-mono text-sm">
  <header>
    <h1 class="text-xl font-bold">Spike 010 — Popup Queue (rune-native)</h1>
    <p class="text-xs text-gray-600">
      Drop-in rune-native replacement for `popupStore.svelte.ts`. Same push/shift
      API, exposes `.current` (was `subscribe` via `toStore`). Zero svelte/store
      imports. Mirrors production +layout.svelte popup-queue rendering shape.
    </p>
    <p class="text-xs">
      <a href="/runes-test" class="text-blue-600 underline">← back to runes-test</a>
    </p>
  </header>

  <section class="border rounded p-3 space-y-2">
    <h2 class="text-sm font-bold">Controls</h2>
    <div class="flex flex-wrap gap-2">
      <button class="border px-3 py-1 text-xs" onclick={() => pushFake('Survey')}>push("Survey")</button>
      <button class="border px-3 py-1 text-xs" onclick={() => pushFake('Feedback')}>push("Feedback")</button>
      <button class="border px-3 py-1 text-xs" onclick={() => pushFake('Onboarding')}>push("Onboarding")</button>
      <button class="border px-3 py-1 text-xs" onclick={shiftFake}>shift()</button>
    </div>
  </section>

  <section class="border-2 border-blue-500 rounded p-3 bg-blue-50 space-y-2">
    <h2 class="text-sm font-bold text-blue-900">Reactive readout (no fromStore)</h2>
    <table class="text-xs border-collapse w-full">
      <tbody>
        <tr><td class="pr-3 text-gray-600">popup.current (template direct):</td><td><code>{popup.current ? JSON.stringify(popup.current.component) : '∅'}</code></td></tr>
        <tr><td class="pr-3 text-gray-600">current ($derived alias):</td><td><code>{current ? JSON.stringify(current.component) : '∅'}</code></td></tr>
        <tr><td class="pr-3 text-gray-600">queue depth:</td><td>{queueDisplay.length}</td></tr>
        <tr><td class="pr-3 text-gray-600">queue contents:</td><td><code>{JSON.stringify(queueDisplay)}</code></td></tr>
      </tbody>
    </table>
  </section>

  <section class="border rounded p-3 text-xs text-gray-700 space-y-1">
    <h2 class="text-sm font-bold">Predicted behavior</h2>
    <ul class="list-disc pl-5 space-y-0.5">
      <li>Click "push(Survey)": queue depth = 1, current = Survey</li>
      <li>Click "push(Feedback)": queue depth = 2, current = Survey (head unchanged)</li>
      <li>Click "shift()": queue depth = 1, current = Feedback (head advances)</li>
      <li>Click "shift()" again: queue depth = 0, current = ∅</li>
    </ul>
  </section>
</div>
