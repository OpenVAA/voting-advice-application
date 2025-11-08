<!--
@component
Document sidebar showing document processing status

Displays all documents grouped by state with section headers.
Shows failed documents in a separate section.
Emits 'documentSelected' event when a document is clicked.
Emits 'refresh' event to reload document list.
-->

<script lang="ts">
  import { createEventDispatcher } from 'svelte';
  import type { DocumentState, ProcessingDocument } from '$lib/api/file-processing/types';

  export let documents: Array<ProcessingDocument>;
  export let failedDocuments: Array<ProcessingDocument>;
  export let currentDocumentId: string | undefined;

  const dispatch = createEventDispatcher<{
    documentSelected: string;
    refresh: void;
  }>();

  // Group documents by state
  $: requiresExtraction = documents.filter((d) => d.state === 'REQUIRES_TEXT_EXTRACTION');
  $: awaitingTextApproval = documents.filter((d) => d.state === 'AWAITING_TEXT_APPROVAL');
  $: requiresSegmentation = documents.filter((d) => d.state === 'REQUIRES_SEGMENTATION');
  $: awaitingSegmentationApproval = documents.filter((d) => d.state === 'AWAITING_SEGMENTATION_APPROVAL');
  $: awaitingMetadataApproval = documents.filter((d) => d.state === 'AWAITING_METADATA_APPROVAL');
  $: complete = documents.filter((d) => d.state === 'COMPLETED');

  // Active documents are those actively being processed or awaiting processing
  $: activeDocuments = documents.filter((d) => d.state !== 'COMPLETED' && d.state !== 'FAILED');

  // Helper to render document card
  function renderDocumentCard(doc: ProcessingDocument) {
    return {
      doc,
      isSelected: doc.id === currentDocumentId
    };
  }
</script>

<div class="w-64 max-w-64 flex h-full flex-none flex-col overflow-hidden border-l bg-white shadow-lg">
  <!-- Header -->
  <div class="min-w-0 border-b p-4">
    <div class="mb-2 flex items-center justify-between">
      <h2 class="font-semibold text-lg">Documents</h2>
      <button class="btn btn-circle btn-ghost btn-sm" on:click={() => dispatch('refresh')} title="Refresh">
        <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path
            stroke-linecap="round"
            stroke-linejoin="round"
            stroke-width="2"
            d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
        </svg>
      </button>
    </div>
    <div class="truncate text-sm text-gray-600">
      {activeDocuments.length} active • {complete.length} complete • {failedDocuments.length} failed
    </div>
  </div>

  <!-- Document list with grouping -->
  <div class="min-w-0 flex-1 overflow-y-auto overflow-x-hidden">
    {#if documents.length === 0}
      <div class="py-8 text-center text-gray-500">
        <p>No documents uploaded</p>
        <p class="mt-2 text-xs">Upload files to begin</p>
      </div>
    {:else}
      <!-- Requires Extraction -->
      {#if requiresExtraction.length > 0}
        <div class="min-w-0 overflow-hidden border-b">
          <h3 class="font-semibold bg-blue-50 p-2 text-xs uppercase text-blue-700">
            Requires Extraction ({requiresExtraction.length})
          </h3>
          <div class="min-w-0 space-y-2 p-2">
            {#each requiresExtraction as doc}
              <button
                class="w-full min-w-0 rounded border p-2 text-left text-sm transition-colors {doc.id ===
                currentDocumentId
                  ? 'border-primary bg-primary/10'
                  : 'border-gray-200 hover:bg-gray-50'}"
                on:click={() => dispatch('documentSelected', doc.id)}>
                <p class="font-medium truncate" title={doc.filename}>{doc.filename}</p>
              </button>
            {/each}
          </div>
        </div>
      {/if}

      <!-- Awaiting Text Approval -->
      {#if awaitingTextApproval.length > 0}
        <div class="min-w-0 overflow-hidden border-b">
          <h3 class="font-semibold bg-yellow-50 p-2 text-xs uppercase text-yellow-700">
            Awaiting Text Approval ({awaitingTextApproval.length})
          </h3>
          <div class="min-w-0 space-y-2 p-2">
            {#each awaitingTextApproval as doc}
              <button
                class="w-full min-w-0 rounded border p-2 text-left text-sm transition-colors {doc.id ===
                currentDocumentId
                  ? 'border-primary bg-primary/10'
                  : 'border-gray-200 hover:bg-gray-50'}"
                on:click={() => dispatch('documentSelected', doc.id)}>
                <p class="font-medium truncate" title={doc.filename}>{doc.filename}</p>
              </button>
            {/each}
          </div>
        </div>
      {/if}

      <!-- Requires Segmentation -->
      {#if requiresSegmentation.length > 0}
        <div class="min-w-0 overflow-hidden border-b">
          <h3 class="font-semibold bg-purple-50 p-2 text-xs uppercase text-purple-700">
            Requires Segmentation ({requiresSegmentation.length})
          </h3>
          <div class="min-w-0 space-y-2 p-2">
            {#each requiresSegmentation as doc}
              <button
                class="w-full min-w-0 rounded border p-2 text-left text-sm transition-colors {doc.id ===
                currentDocumentId
                  ? 'border-primary bg-primary/10'
                  : 'border-gray-200 hover:bg-gray-50'}"
                on:click={() => dispatch('documentSelected', doc.id)}>
                <p class="font-medium truncate" title={doc.filename}>{doc.filename}</p>
              </button>
            {/each}
          </div>
        </div>
      {/if}

      <!-- Awaiting Segmentation Approval -->
      {#if awaitingSegmentationApproval.length > 0}
        <div class="min-w-0 overflow-hidden border-b">
          <h3 class="font-semibold bg-indigo-50 p-2 text-xs uppercase text-indigo-700">
            Awaiting Segmentation Approval ({awaitingSegmentationApproval.length})
          </h3>
          <div class="min-w-0 space-y-2 p-2">
            {#each awaitingSegmentationApproval as doc}
              <button
                class="w-full min-w-0 rounded border p-2 text-left text-sm transition-colors {doc.id ===
                currentDocumentId
                  ? 'border-primary bg-primary/10'
                  : 'border-gray-200 hover:bg-gray-50'}"
                on:click={() => dispatch('documentSelected', doc.id)}>
                <p class="font-medium truncate" title={doc.filename}>{doc.filename}</p>
              </button>
            {/each}
          </div>
        </div>
      {/if}

      <!-- Awaiting Metadata Approval -->
      {#if awaitingMetadataApproval.length > 0}
        <div class="min-w-0 overflow-hidden border-b">
          <h3 class="font-semibold bg-orange-50 p-2 text-xs uppercase text-orange-700">
            Awaiting Metadata Approval ({awaitingMetadataApproval.length})
          </h3>
          <div class="min-w-0 space-y-2 p-2">
            {#each awaitingMetadataApproval as doc}
              <button
                class="w-full min-w-0 rounded border p-2 text-left text-sm transition-colors {doc.id ===
                currentDocumentId
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
        <div class="min-w-0 overflow-hidden border-b">
          <h3 class="font-semibold bg-green-50 p-2 text-xs uppercase text-green-700">
            Complete ({complete.length})
          </h3>
          <div class="min-w-0 space-y-2 p-2">
            {#each complete as doc}
              <button
                class="w-full min-w-0 rounded border p-2 text-left text-sm transition-colors {doc.id ===
                currentDocumentId
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
        <div class="min-w-0 space-y-2 p-2">
          {#each failedDocuments as doc}
            <button
              class="w-full min-w-0 rounded border border-error/30 bg-error/5 p-2 text-left text-sm transition-colors hover:bg-error/10"
              on:click={() => dispatch('documentSelected', doc.id)}>
              <p class="font-medium truncate" title={doc.filename}>{doc.filename}</p>
              {#if doc.failureReason}
                <p class="mt-1 truncate text-xs text-error" title={doc.failureReason}>
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
