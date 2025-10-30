<!--
@component
Extraction review component

Shows extracted text (from PDF or TXT) with ability to edit before approval.
Emits 'approved' event when extraction is approved.
Emits 'failed' event when document is marked as failed.
-->

<script lang="ts">
  import { createEventDispatcher } from 'svelte';
  import type { ProcessingDocument } from '$lib/api/file-processing/types';

  export let document: ProcessingDocument;

  const dispatch = createEventDispatcher<{ approved: void; failed: void }>();

  let submitting = false;
  let error: string | null = null;
  let failureReason = '';
  let showFailDialog = false;

  // Initialize editedText from document when first available
  let editedText = document.extractedText ?? '';
  let hasInitialized = document.extractedText !== undefined;

  $: if (document.extractedText !== undefined && !hasInitialized) {
    editedText = document.extractedText;
    hasInitialized = true;
  }

  async function handleApprove() {
    submitting = true;
    error = null;

    try {
      const response = await fetch('/api/file-processing/approve-extraction', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          documentId: document.id,
          editedText: editedText !== document.extractedText ? editedText : undefined
        })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to approve extraction');
      }

      // Trigger segmentation automatically after approval
      const segmentResponse = await fetch('/api/file-processing/segment', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          documentId: document.id
        })
      });

      if (!segmentResponse.ok) {
        const errorData = await segmentResponse.json();
        throw new Error(errorData.error || 'Failed to segment text');
      }

      dispatch('approved');
    } catch (err) {
      error = err instanceof Error ? err.message : 'Failed to approve extraction';
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
          stage: 'extraction'
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

  $: charCount = editedText.length;
  $: hasChanges = editedText !== document.extractedText;
</script>

<div class="space-y-4">
  <div class="flex items-center justify-between">
    <h3 class="font-semibold text-xl">Extracted Text Review</h3>
    <div class="text-sm text-gray-600">
      {charCount.toLocaleString()} characters
      {#if hasChanges}
        <span class="badge badge-warning ml-2">Modified</span>
      {/if}
    </div>
  </div>

  {#if document.metrics?.extraction}
    <div class="stats shadow">
      <div class="stat">
        <div class="stat-title">Processing Time</div>
        <div class="stat-value text-sm">
          {(document.metrics.extraction.processingTimeMs / 1000).toFixed(2)}s
        </div>
      </div>
      <div class="stat">
        <div class="stat-title">Cost</div>
        <div class="stat-value text-sm">${document.metrics.extraction.costs.total.toFixed(4)}</div>
      </div>
      <div class="stat">
        <div class="stat-title">Characters</div>
        <div class="stat-value text-sm">
          {charCount.toLocaleString()}
        </div>
      </div>
    </div>
  {/if}

  <!-- Extracted text editor -->
  <div class="form-control">
    <label class="label" for="extractedText">
      <span class="label-text">Extracted Text (editable - review and modify if needed before accepting)</span>
    </label>
    <textarea
      id="extractedText"
      bind:value={editedText}
      class="font-mono h-[600px] textarea textarea-bordered text-sm"
      placeholder="Extracted text will appear here..."></textarea>
  </div>

  {#if error}
    <div class="alert alert-error">
      <span>{error}</span>
    </div>
  {/if}

  <!-- Actions -->
  <div class="flex gap-2">
    <button class="btn btn-primary" on:click={handleApprove} disabled={submitting || !editedText}>
      {#if submitting}
        <span class="loading loading-spinner"></span>
        Processing...
      {:else}
        Accept & Segment
      {/if}
    </button>
    <button class="btn btn-outline btn-error" on:click={() => (showFailDialog = true)} disabled={submitting}>
      Fail Document
    </button>
  </div>

  <!-- Fail dialog -->
  {#if showFailDialog}
    <div class="modal modal-open">
      <div class="modal-box">
        <h3 class="text-lg font-bold">Mark Document as Failed</h3>
        <p class="py-4">Please provide a reason for failure:</p>
        <textarea
          bind:value={failureReason}
          class="textarea textarea-bordered w-full"
          placeholder="Extraction failed because..."></textarea>
        <div class="modal-action">
          <button class="btn btn-error" on:click={handleFail} disabled={submitting}> Mark as Failed </button>
          <button class="btn" on:click={() => (showFailDialog = false)} disabled={submitting}> Cancel </button>
        </div>
      </div>
    </div>
  {/if}
</div>
