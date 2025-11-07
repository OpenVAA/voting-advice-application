<!--
@component
Extraction review component

Shows extracted text (from PDF or TXT) with ability to edit before approval.
Split-screen layout: original file on left, editable text on right.
Emits 'approved' event when extraction is approved.
Emits 'failed' event when document is marked as failed.
-->

<script lang="ts">
  import { createEventDispatcher } from 'svelte';
  import { enhance } from '$app/forms';
  import { invalidate } from '$app/navigation';
  import type { ProcessingDocument } from '$lib/api/file-processing/types';
  import FileViewer from './FileViewer.svelte';

  export let document: ProcessingDocument;

  const dispatch = createEventDispatcher<{ approved: void; failed: void }>();

  let submitting = false;
  let error: string | null = null;
  let failureReason = '';
  let showFailDialog = false;

  // Initialize editedText from document (non-reactive to allow user edits)
  let editedText: string = document.extractedText ?? '';

  // Processing options (only for TXT files that don't have options set yet)
  let autoSegmentText = false;

  // Check if this is a TXT file (no extraction metrics means no PDF extraction happened)
  $: isTxtFile = document.fileType === 'txt' || !document.metrics?.extraction;

  // Form submission handlers following SvelteKit pattern
  const handleApproveSubmit = () => {
    submitting = true;
    error = null;
    return async ({ result, update }) => {
      if (result.type === 'failure') {
        error = result.data?.error || 'Failed to approve extraction';
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

  <!-- Two-column layout: Original file + Extracted text -->
  <div class="h-[600px] grid grid-cols-2 gap-4">
    <!-- Left: Original file viewer -->
    <FileViewer documentId={document.id} fileType={document.fileType} filename={document.filename} />

    <!-- Right: Extracted text editor -->
    <div class="overflow-auto rounded-lg border bg-white p-4">
      <h4 class="font-semibold mb-2 sticky top-0 bg-white">
        Extracted Text (editable)
        {#if hasChanges}
          <span class="badge badge-warning ml-2">Modified</span>
        {/if}
      </h4>
      <textarea
        id="extractedText"
        bind:value={editedText}
        class="font-mono h-[calc(100%-2.5rem)] w-full textarea textarea-bordered text-sm"
        placeholder="Extracted text will appear here..."></textarea>
    </div>
  </div>

  <!-- Processing options for TXT files -->
  {#if isTxtFile}
    <div class="rounded-lg border bg-gray-50 p-4 space-y-3">
      <h4 class="font-semibold text-sm">Processing Options</h4>
      <p class="text-xs text-gray-600">Configure automatic processing steps for this document</p>

      <div class="form-control">
        <label class="label cursor-pointer justify-start gap-4">
          <input type="checkbox" class="checkbox checkbox-sm" bind:checked={autoSegmentText} />
          <div>
            <span class="label-text font-semibold">Auto-approve segmentation</span>
            <p class="text-xs text-gray-600">Automatically segment text and skip manual review</p>
          </div>
        </label>
      </div>
    </div>
  {/if}

  {#if error}
    <div class="alert alert-error">
      <span>{error}</span>
    </div>
  {/if}

  <!-- Actions -->
  <div class="flex gap-2">
    <!-- Approval form -->
    <form method="POST" action="?/approveExtraction" use:enhance={handleApproveSubmit}>
      <input type="hidden" name="documentId" value={document.id} />
      <input type="hidden" name="editedText" value={editedText} />
      <input type="hidden" name="autoSegmentText" value={autoSegmentText} />
      <button type="submit" class="btn btn-primary" disabled={submitting || !editedText}>
        {#if submitting}
          <span class="loading loading-spinner"></span>
          Processing...
        {:else}
          Approve Text
        {/if}
      </button>
    </form>
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
          <form method="POST" action="?/fail" use:enhance={handleFailSubmit}>
            <input type="hidden" name="documentId" value={document.id} />
            <input type="hidden" name="reason" value={failureReason} />
            <input type="hidden" name="stage" value="extraction" />
            <button type="submit" class="btn btn-error" disabled={submitting}> Mark as Failed </button>
          </form>
          <button class="btn" type="button" on:click={() => (showFailDialog = false)} disabled={submitting}> Cancel </button>
        </div>
      </div>
    </div>
  {/if}
</div>
