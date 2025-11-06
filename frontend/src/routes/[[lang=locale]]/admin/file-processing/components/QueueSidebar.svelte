<!--
@component
Queue sidebar showing document processing status

Displays all documents grouped by state with section headers.
Shows failed documents in a separate section.
Emits 'documentSelected' event when a document is clicked.
Emits 'refresh' event to reload queue.
Emits 'queueAll' event to move all unprocessed documents to extraction queue.
Emits 'extractBatch' event to trigger batch extraction.
-->

<script lang="ts">
  import { createEventDispatcher } from 'svelte';
  import type { DocumentState,ProcessingDocument } from '$lib/api/file-processing/types';

  export let documents: Array<ProcessingDocument>;
  export let failedDocuments: Array<ProcessingDocument>;
  export let currentDocumentId: string | undefined;

  const dispatch = createEventDispatcher<{
    documentSelected: string;
    refresh: void;
    queueAll: void;
    extractBatch: void;
  }>();

  // Group documents by state
  $: unprocessed = documents.filter(d => d.state === 'UPLOADED');
  $: queued = documents.filter(d => d.state === 'QUEUED_FOR_EXTRACTION');
  $: extracted = documents.filter(d => d.state === 'EXTRACTED');
  $: textApproved = documents.filter(d => d.state === 'EXTRACTION_APPROVED' || d.state === 'METADATA_INSERTION');
  $: metadataApproved = documents.filter(d => d.state === 'METADATA_APPROVED');
  $: segmented = documents.filter(d => d.state === 'SEGMENTED');
  $: complete = documents.filter(d => d.state === 'SEGMENTATION_APPROVED');

  // Active documents are those actively being processed (exclude unprocessed, queued, and completed)
  $: activeDocuments = documents.filter(d =>
    d.state !== 'UPLOADED' &&
    d.state !== 'QUEUED_FOR_EXTRACTION' &&
    d.state !== 'SEGMENTATION_APPROVED'
  );

  let queueing = false;
  let dequeueing = false;
  let extracting = false;

  async function handleQueueAll() {
    if (unprocessed.length === 0) return;
    queueing = true;
    try {
      const response = await fetch('/api/file-processing/queue-documents', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          documentIds: unprocessed.map(d => d.id)
        })
      });

      if (!response.ok) {
        throw new Error('Failed to queue documents');
      }

      dispatch('refresh');
    } catch (error) {
      console.error('Error queuing documents:', error);
    } finally {
      queueing = false;
    }
  }

  async function handleDequeueAll() {
    if (queued.length === 0) return;
    dequeueing = true;
    try {
      const response = await fetch('/api/file-processing/dequeue-documents', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          documentIds: queued.map(d => d.id)
        })
      });

      if (!response.ok) {
        throw new Error('Failed to dequeue documents');
      }

      dispatch('refresh');
    } catch (error) {
      console.error('Error dequeueing documents:', error);
    } finally {
      dequeueing = false;
    }
  }

  async function handleExtractBatch() {
    if (queued.length === 0) return;
    extracting = true;
    try {
      const response = await fetch('/api/file-processing/extract-batch', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          batchSize: 2
        })
      });

      if (!response.ok) {
        throw new Error('Failed to extract batch');
      }

      dispatch('refresh');
    } catch (error) {
      console.error('Error extracting batch:', error);
    } finally {
      extracting = false;
    }
  }

  // Helper to render document card
  function renderDocumentCard(doc: ProcessingDocument) {
    return {
      doc,
      isSelected: doc.id === currentDocumentId
    };
  }
</script>

<div class="w-64 max-w-64 flex-none overflow-hidden flex h-full flex-col border-l bg-white shadow-lg">
  <!-- Header -->
  <div class="border-b p-4 min-w-0">
    <div class="mb-2 flex items-center justify-between">
      <h2 class="font-semibold text-lg">Uploaded Documents</h2>
      <button class="btn btn-circle btn-ghost btn-sm" on:click={() => dispatch('refresh')} title="Refresh queue">
        <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path
            stroke-linecap="round"
            stroke-linejoin="round"
            stroke-width="2"
            d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
        </svg>
      </button>
    </div>
    <div class="text-sm text-gray-600 truncate">
      {activeDocuments.length} active • {unprocessed.length + queued.length} queued • {failedDocuments.length} failed
    </div>

    <!-- Action buttons -->
    <div class="mt-3 flex flex-col gap-2">
      <button
        class="btn btn-primary btn-sm"
        on:click={handleQueueAll}
        disabled={unprocessed.length === 0 || queueing}>
        {#if queueing}
          <span class="loading loading-spinner loading-xs"></span>
        {/if}
        Queue All ({unprocessed.length})
      </button>
      <button
        class="btn btn-secondary btn-sm"
        on:click={handleDequeueAll}
        disabled={queued.length === 0 || dequeueing}>
        {#if dequeueing}
          <span class="loading loading-spinner loading-xs"></span>
        {/if}
        Dequeue All ({queued.length})
      </button>
      <button class="btn btn-accent btn-sm" on:click={handleExtractBatch} disabled={queued.length === 0 || extracting}>
        {#if extracting}
          <span class="loading loading-spinner loading-xs"></span>
        {/if}
        Extract Queued ({queued.length})
      </button>
    </div>
  </div>

  <!-- Document list with grouping -->
  <div class="flex-1 overflow-y-auto min-w-0 overflow-x-hidden">
    {#if documents.length === 0}
      <div class="py-8 text-center text-gray-500">
        <p>No documents uploaded</p>
        <p class="mt-2 text-xs">Upload files to begin</p>
      </div>
    {:else}
      <!-- Unprocessed -->
      {#if unprocessed.length > 0}
        <div class="border-b min-w-0 overflow-hidden">
          <h3 class="font-semibold bg-gray-100 p-2 text-xs uppercase text-gray-600">
            Unprocessed ({unprocessed.length})
          </h3>
          <div class="p-2 space-y-2 min-w-0">
            {#each unprocessed as doc}
              <button
                class="p-2 w-full min-w-0 rounded border text-left text-sm transition-colors {doc.id === currentDocumentId
                  ? 'border-primary bg-primary/10'
                  : 'border-gray-200 hover:bg-gray-50'}"
                on:click={() => dispatch('documentSelected', doc.id)}>
                <p class="font-medium truncate" title={doc.filename}>{doc.filename}</p>
              </button>
            {/each}
          </div>
        </div>
      {/if}

      <!-- Queued for Extraction -->
      {#if queued.length > 0}
        <div class="border-b min-w-0 overflow-hidden">
          <h3 class="font-semibold bg-blue-50 p-2 text-xs uppercase text-blue-700">
            Queued for Extraction ({queued.length})
          </h3>
          <div class="p-2 space-y-2 min-w-0">
            {#each queued as doc}
              <button
                class="p-2 w-full min-w-0 rounded border text-left text-sm transition-colors {doc.id === currentDocumentId
                  ? 'border-primary bg-primary/10'
                  : 'border-gray-200 hover:bg-gray-50'}"
                on:click={() => dispatch('documentSelected', doc.id)}>
                <p class="font-medium truncate" title={doc.filename}>{doc.filename}</p>
              </button>
            {/each}
          </div>
        </div>
      {/if}

      <!-- Extracted - Pending Text Review -->
      {#if extracted.length > 0}
        <div class="border-b min-w-0 overflow-hidden">
          <h3 class="font-semibold bg-yellow-50 p-2 text-xs uppercase text-yellow-700">
            Pending Text Review ({extracted.length})
          </h3>
          <div class="p-2 space-y-2 min-w-0">
            {#each extracted as doc}
              <button
                class="p-2 w-full min-w-0 rounded border text-left text-sm transition-colors {doc.id === currentDocumentId
                  ? 'border-primary bg-primary/10'
                  : 'border-gray-200 hover:bg-gray-50'}"
                on:click={() => dispatch('documentSelected', doc.id)}>
                <p class="font-medium truncate" title={doc.filename}>{doc.filename}</p>
              </button>
            {/each}
          </div>
        </div>
      {/if}

      <!-- Pending Metadata Review -->
      {#if textApproved.length > 0}
        <div class="border-b min-w-0 overflow-hidden">
          <h3 class="font-semibold bg-orange-50 p-2 text-xs uppercase text-orange-700">
            Pending Metadata Review ({textApproved.length})
          </h3>
          <div class="p-2 space-y-2 min-w-0">
            {#each textApproved as doc}
              <button
                class="p-2 w-full min-w-0 rounded border text-left text-sm transition-colors {doc.id === currentDocumentId
                  ? 'border-primary bg-primary/10'
                  : 'border-gray-200 hover:bg-gray-50'}"
                on:click={() => dispatch('documentSelected', doc.id)}>
                <p class="font-medium truncate" title={doc.filename}>{doc.filename}</p>
              </button>
            {/each}
          </div>
        </div>
      {/if}

      <!-- Metadata Approved - Pending Segmentation -->
      {#if metadataApproved.length > 0}
        <div class="border-b min-w-0 overflow-hidden">
          <h3 class="font-semibold bg-purple-50 p-2 text-xs uppercase text-purple-700">
            Pending Segmentation ({metadataApproved.length})
          </h3>
          <div class="p-2 space-y-2 min-w-0">
            {#each metadataApproved as doc}
              <button
                class="p-2 w-full min-w-0 rounded border text-left text-sm transition-colors {doc.id === currentDocumentId
                  ? 'border-primary bg-primary/10'
                  : 'border-gray-200 hover:bg-gray-50'}"
                on:click={() => dispatch('documentSelected', doc.id)}>
                <p class="font-medium truncate" title={doc.filename}>{doc.filename}</p>
              </button>
            {/each}
          </div>
        </div>
      {/if}

      <!-- Segmented - Pending Review -->
      {#if segmented.length > 0}
        <div class="border-b min-w-0 overflow-hidden">
          <h3 class="font-semibold bg-indigo-50 p-2 text-xs uppercase text-indigo-700">
            Pending Segmentation Review ({segmented.length})
          </h3>
          <div class="p-2 space-y-2 min-w-0">
            {#each segmented as doc}
              <button
                class="p-2 w-full min-w-0 rounded border text-left text-sm transition-colors {doc.id === currentDocumentId
                  ? 'border-primary bg-primary/10'
                  : 'border-gray-200 hover:bg-gray-50'}"
                on:click={() => dispatch('documentSelected', doc.id)}>
                <p class="font-medium truncate" title={doc.filename}>{doc.filename}</p>
              </button>
            {/each}
          </div>
        </div>
      {/if}

      <!-- Complete -->
      {#if complete.length > 0}
        <div class="border-b min-w-0 overflow-hidden">
          <h3 class="font-semibold bg-green-50 p-2 text-xs uppercase text-green-700">
            Complete ({complete.length})
          </h3>
          <div class="p-2 space-y-2 min-w-0">
            {#each complete as doc}
              <button
                class="p-2 w-full min-w-0 rounded border text-left text-sm transition-colors {doc.id === currentDocumentId
                  ? 'border-primary bg-primary/10'
                  : 'border-gray-200 hover:bg-gray-50'}"
                on:click={() => dispatch('documentSelected', doc.id)}>
                <p class="font-medium truncate" title={doc.filename}>{doc.filename}</p>
              </button>
            {/each}
          </div>
        </div>
      {/if}
    {/if}

    <!-- Failed documents section -->
    {#if failedDocuments.length > 0}
      <div class="min-w-0 overflow-hidden">
        <h3 class="font-semibold bg-red-50 p-2 text-xs uppercase text-red-700">Failed ({failedDocuments.length})</h3>
        <div class="p-2 space-y-2 min-w-0">
          {#each failedDocuments as doc}
            <button
              class="p-2 w-full min-w-0 rounded border border-error/30 bg-error/5 text-left text-sm transition-colors hover:bg-error/10"
              on:click={() => dispatch('documentSelected', doc.id)}>
              <p class="font-medium truncate" title={doc.filename}>{doc.filename}</p>
              {#if doc.failureReason}
                <p class="mt-1 text-xs text-error truncate" title={doc.failureReason}>
                  {doc.failureReason}
                </p>
              {/if}
            </button>
          {/each}
        </div>
      </div>
    {/if}
  </div>
</div>
