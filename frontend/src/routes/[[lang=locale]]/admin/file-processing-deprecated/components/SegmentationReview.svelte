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
  import { enhance } from '$app/forms';
  import { invalidate } from '$app/navigation';
  import type { ProcessingDocument } from '$lib/api/file-processing/types';

  export let document: ProcessingDocument;

  const dispatch = createEventDispatcher<{ approved: void; failed: void; refresh: void }>();

  let selectedSegmentIndex = 0;
  let activeSegments = new Set<number>();
  let submitting = false;
  let error: string | null = null;
  let failureReason = '';
  let showFailDialog = false;

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

  // Form submission handlers following SvelteKit pattern
  const handleApproveSubmit = () => {
    submitting = true;
    error = null;
    return async ({ result, update }) => {
      if (result.type === 'failure') {
        error = result.data?.error || 'Failed to approve segmentation';
        submitting = false;
        return;
      }
      if (result.type === 'success') {
        await invalidate('app:documents');
        dispatch('approved');
      }
      await update();
      submitting = false;
    };
  };

  const handleFailSubmit = () => {
    if (!failureReason.trim()) {
      error = 'Please provide a failure reason';
      return () => {}; // Return no-op function
    }

    submitting = true;
    error = null;
    return async ({ result, update }) => {
      if (result.type === 'failure') {
        error = result.data?.error || 'Failed to mark as failed';
        submitting = false;
        showFailDialog = false;
        return;
      }
      if (result.type === 'success') {
        await invalidate('app:documents');
        dispatch('failed');
      }
      await update();
      submitting = false;
      showFailDialog = false;
    };
  };

  $: totalChars = segments.reduce((sum, seg) => sum + seg.length, 0);
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

  {#if segments.length === 0}
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
      <!-- Left: Original extracted text -->
      <div class="overflow-auto rounded-lg border bg-gray-50 p-4">
        <h4 class="font-semibold sticky top-0 mb-2 bg-gray-50">Full Text (read-only)</h4>
        <div class="font-mono whitespace-pre-wrap text-sm">
          {document.extractedText || ''}
        </div>
      </div>

      <!-- Right: Segment list -->
      <div class="overflow-auto rounded-lg border p-4">
        <h4 class="font-semibold mb-2">Segments (editable)</h4>
        <div class="space-y-2">
          {#each segments as segment, i}
            <div class="rounded border p-2 {activeSegments.has(i) ? 'border-primary bg-primary/5' : 'border-gray-300'}">
              <!-- Always visible header - clickable to toggle -->
              <button
                class="p-1 flex w-full items-center justify-between rounded text-left transition-colors hover:bg-gray-50"
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
                  class="font-mono textarea textarea-bordered textarea-sm mt-2 w-full text-xs"
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
      <form method="POST" action="?/approveSegmentation" use:enhance={handleApproveSubmit}>
        <input type="hidden" name="documentId" value={document.id} />
        <input type="hidden" name="segments" value={JSON.stringify(segments)} />
        <button type="submit" class="btn btn-primary" disabled={submitting}>
          {#if submitting}
            <span class="loading loading-spinner"></span>
            Processing...
          {:else}
            Accept Segmentation
          {/if}
        </button>
      </form>
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
          <form method="POST" action="?/fail" use:enhance={handleFailSubmit}>
            <input type="hidden" name="documentId" value={document.id} />
            <input type="hidden" name="reason" value={failureReason} />
            <input type="hidden" name="stage" value="segmentation" />
            <button type="submit" class="btn btn-error" disabled={submitting}> Mark as Failed </button>
          </form>
          <button class="btn" type="button" on:click={() => (showFailDialog = false)} disabled={submitting}>
            Cancel
          </button>
        </div>
      </div>
    </div>
  {/if}
</div>
