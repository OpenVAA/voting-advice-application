<!--
@component
Segmentation review component

Shows segmented text with ability to edit segments before approval.
Displays full text on left, individual segments on right.
Emits 'approved' event when segmentation is approved.
Emits 'failed' event when document is marked as failed.
-->

<script lang="ts">
  import { createEventDispatcher } from 'svelte';
  import type { ProcessingDocument } from '$lib/api/file-processing/types';

  export let document: ProcessingDocument;

  const dispatch = createEventDispatcher<{ approved: void; failed: void; refresh: void }>();

  let selectedSegmentIndex = 0;
  let activeSegments = new Set<number>();
  let submitting = false;
  let error: string | null = null;
  let failureReason = '';
  let showFailDialog = false;
  let triggerSegmentation = document.state === 'EXTRACTION_APPROVED'; // Auto-trigger if coming from extraction

  // Initialize segments from document when first available
  let segments: Array<string> = document.segments ? [...document.segments] : [];
  let hasInitializedSegments = document.segments !== undefined;

  $: if (document.segments !== undefined && !hasInitializedSegments) {
    segments = [...document.segments];
    hasInitializedSegments = true;
  }

  function toggleSegment(index: number) {
    if (activeSegments.has(index)) {
      activeSegments.delete(index);
    } else {
      activeSegments.add(index);
    }
    activeSegments = activeSegments; // Trigger reactivity
  }

  function expandAll() {
    activeSegments = new Set(segments.map((_, i) => i));
  }

  function collapseAll() {
    activeSegments = new Set();
  }

  function calculateRows(text: string): number {
    const lineCount = text.split('\n').length;
    return Math.max(3, Math.min(lineCount + 1, 20)); // Min 3, max 20 rows
  }

  async function autoTriggerSegmentation() {
    if (!triggerSegmentation) return;

    submitting = true;
    error = null;

    try {
      const response = await fetch('/api/file-processing/segment', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          documentId: document.id
        })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to segment text');
      }

      triggerSegmentation = false;

      // Dispatch to refresh parent (don't auto-approve, let user review)
      setTimeout(() => dispatch('refresh'), 100);
    } catch (err) {
      error = err instanceof Error ? err.message : 'Failed to segment text';
      console.error('Segmentation error:', err);
      triggerSegmentation = false;
    } finally {
      submitting = false;
    }
  }

  async function handleApprove() {
    submitting = true;
    error = null;

    try {
      const response = await fetch('/api/file-processing/approve-segmentation', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          documentId: document.id,
          editedSegments: segments
        })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to approve segmentation');
      }

      dispatch('approved');
    } catch (err) {
      error = err instanceof Error ? err.message : 'Failed to approve segmentation';
      console.error('Approval error:', err);
    } finally {
      submitting = false;
    }
  }

  async function handleFail() {
    if (!failureReason.trim()) {
      error = 'Please provide a failure reason';
      return;
    }

    submitting = true;
    error = null;

    try {
      const response = await fetch('/api/file-processing/fail', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          documentId: document.id,
          reason: failureReason,
          stage: 'segmentation'
        })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to mark as failed');
      }

      dispatch('failed');
    } catch (err) {
      error = err instanceof Error ? err.message : 'Failed to mark as failed';
      console.error('Fail error:', err);
    } finally {
      submitting = false;
      showFailDialog = false;
    }
  }

  $: totalChars = segments.reduce((sum, seg) => sum + seg.length, 0);

  // Auto-trigger segmentation if needed
  $: if (triggerSegmentation) {
    autoTriggerSegmentation();
  }
</script>

<div class="space-y-4">
  <div class="flex items-center justify-between">
    <h3 class="font-semibold text-xl">Segmentation Review</h3>
    <div class="flex items-center gap-4">
      <div class="text-sm text-gray-600">
        {segments.length} segments • {totalChars.toLocaleString()} characters total
      </div>
      <div class="flex gap-2">
        <button class="btn btn-ghost btn-xs" on:click={expandAll}>Expand All</button>
        <button class="btn btn-ghost btn-xs" on:click={collapseAll}>Collapse All</button>
      </div>
    </div>
  </div>

  {#if submitting && triggerSegmentation}
    <div class="flex flex-col items-center gap-4 p-8">
      <span class="loading loading-spinner loading-lg"></span>
      <p>Segmenting text using LLM...</p>
      <p class="text-sm text-gray-600">This may take a moment for large documents</p>
    </div>
  {:else if segments.length === 0}
    <div class="alert alert-warning">
      <span>No segments available. Please run segmentation first.</span>
    </div>
  {:else}
    {#if document.metrics?.segmentation}
      <div class="stats shadow">
        <div class="stat">
          <div class="stat-title">Processing Time</div>
          <div class="stat-value text-sm">
            {(document.metrics.segmentation.processingTimeMs / 1000).toFixed(2)}s
          </div>
        </div>
        <div class="stat">
          <div class="stat-title">Cost</div>
          <div class="stat-value text-sm">
            ${document.metrics.segmentation.costs.total.toFixed(4)}
          </div>
        </div>
        <div class="stat">
          <div class="stat-title">Avg Segment Length</div>
          <div class="stat-value text-sm">
            {Math.round(document.metrics.segmentation.averageSegmentLength)} chars
          </div>
        </div>
      </div>
    {/if}

    <!-- Two-column layout -->
    <div class="h-96 grid grid-cols-2 gap-4">
      <!-- Left: Full text with highlighted segments -->
      <div class="overflow-auto rounded-lg border bg-gray-50 p-4">
        <h4 class="font-semibold sticky top-0 mb-2 bg-gray-50">Full Text (read-only)</h4>
        <div class="font-mono whitespace-pre-wrap text-sm">
          {#if document.extractedText}
            {#each segments as segment, i}
              <span
                class="cursor-pointer transition-colors {i === selectedSegmentIndex
                  ? 'bg-yellow-200'
                  : 'hover:bg-yellow-100'}"
                on:click={() => {
                  selectedSegmentIndex = i;
                  activeSegments.add(i);
                  activeSegments = activeSegments;
                }}
                role="button"
                tabindex="0"
                on:keydown={(e) => {
                  if (e.key === 'Enter') {
                    selectedSegmentIndex = i;
                    activeSegments.add(i);
                    activeSegments = activeSegments;
                  }
                }}>
                {segment}
              </span>
              {#if i < segments.length - 1}
                <span class="text-red-500">|</span>
              {/if}
            {/each}
          {/if}
        </div>
      </div>

      <!-- Right: Segment list -->
      <div class="overflow-auto rounded-lg border p-4">
        <h4 class="font-semibold mb-2">Segments (editable)</h4>
        <div class="space-y-2">
          {#each segments as segment, i}
            <div
              class="rounded border p-2 {activeSegments.has(i)
                ? 'border-primary bg-primary/5'
                : 'border-gray-300'}">
              <!-- Always visible header - clickable to toggle -->
              <button
                class="w-full flex items-center justify-between text-left transition-colors hover:bg-gray-50 rounded p-1"
                on:click={() => toggleSegment(i)}>
                <span class="font-semibold text-xs text-gray-600">
                  Segment {i + 1} ({segment.length} chars)
                </span>
                <!-- Chevron icon indicating expand/collapse state -->
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  class="h-4 w-4 transition-transform {activeSegments.has(i) ? 'rotate-180' : ''}"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7" />
                </svg>
              </button>

              <!-- Conditionally rendered textarea -->
              {#if activeSegments.has(i)}
                <textarea
                  bind:value={segments[i]}
                  class="font-mono textarea textarea-bordered textarea-sm w-full text-xs mt-2"
                  rows={calculateRows(segment)}
                  style="max-height: 400px; overflow-y: auto;"
                  on:focus={() => (selectedSegmentIndex = i)}></textarea>
              {/if}
            </div>
          {/each}
        </div>
      </div>
    </div>

    {#if error}
      <div class="alert alert-error">
        <span>{error}</span>
      </div>
    {/if}

    <!-- Actions -->
    <div class="flex gap-2">
      <button class="btn btn-primary" on:click={handleApprove} disabled={submitting}>
        {#if submitting}
          <span class="loading loading-spinner"></span>
          Processing...
        {:else}
          Accept Segmentation
        {/if}
      </button>
      <button class="btn btn-outline btn-error" on:click={() => (showFailDialog = true)} disabled={submitting}>
        Fail Document
      </button>
    </div>
  {/if}

  <!-- Fail dialog -->
  {#if showFailDialog}
    <div class="modal modal-open">
      <div class="modal-box">
        <h3 class="text-lg font-bold">Mark Document as Failed</h3>
        <p class="py-4">Please provide a reason for failure:</p>
        <textarea
          bind:value={failureReason}
          class="textarea textarea-bordered w-full"
          placeholder="Segmentation failed because..."></textarea>
        <div class="modal-action">
          <button class="btn btn-error" on:click={handleFail} disabled={submitting}> Mark as Failed </button>
          <button class="btn" on:click={() => (showFailDialog = false)} disabled={submitting}> Cancel </button>
        </div>
      </div>
    </div>
  {/if}
</div>
