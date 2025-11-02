<!--
@component
Queue sidebar showing document processing status

Displays all documents in queue with their current state.
Shows failed documents in a separate section.
Emits 'documentSelected' event when a document is clicked.
Emits 'refresh' event to reload queue.
-->

<script lang="ts">
  import { createEventDispatcher } from 'svelte';
  import type { DocumentState,ProcessingDocument } from '$lib/api/file-processing/types';

  export let documents: Array<ProcessingDocument>;
  export let failedDocuments: Array<ProcessingDocument>;
  export let currentDocumentId: string | undefined;

  const dispatch = createEventDispatcher<{ documentSelected: string; refresh: void }>();

  function getStateColor(state: DocumentState): string {
    switch (state) {
      case 'UPLOADED':
        return 'badge-neutral';
      case 'METADATA_ENTERED':
        return 'badge-info';
      case 'EXTRACTED':
        return 'badge-warning';
      case 'EXTRACTION_APPROVED':
        return 'badge-warning';
      case 'SEGMENTED':
        return 'badge-warning';
      case 'SEGMENTATION_APPROVED':
        return 'badge-success';
      case 'COMPLETED':
        return 'badge-success';
      case 'FAILED':
        return 'badge-error';
      default:
        return 'badge-ghost';
    }
  }

  function getStateLabel(state: DocumentState): string {
    switch (state) {
      case 'UPLOADED':
        return 'Uploaded';
      case 'METADATA_ENTERED':
        return 'Metadata';
      case 'EXTRACTED':
        return 'Extracted';
      case 'EXTRACTION_APPROVED':
        return 'Approved';
      case 'SEGMENTED':
        return 'Segmented';
      case 'SEGMENTATION_APPROVED':
        return 'Complete';
      case 'COMPLETED':
        return 'Done';
      case 'FAILED':
        return 'Failed';
      default:
        return state;
    }
  }
</script>

<div class="w-64 flex h-full flex-col border-l bg-white shadow-lg">
  <!-- Header -->
  <div class="border-b p-4">
    <div class="mb-2 flex items-center justify-between">
      <h2 class="font-semibold text-lg">Processing Queue</h2>
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
    <div class="text-sm text-gray-600">
      {documents.length} active • {failedDocuments.length} failed
    </div>
  </div>

  <!-- Document list -->
  <div class="flex-1 space-y-2 overflow-y-auto p-4">
    {#if documents.length === 0}
      <div class="py-8 text-center text-gray-500">
        <p>No documents in queue</p>
        <p class="mt-2 text-xs">Upload files to begin</p>
      </div>
    {:else}
      {#each documents as doc}
        <button
          class="p-3 w-full rounded-lg border text-left transition-colors {doc.id === currentDocumentId
            ? 'border-primary bg-primary/10'
            : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'}"
          on:click={() => dispatch('documentSelected', doc.id)}>
          <div class="flex items-start justify-between gap-2">
            <div class="min-w-0 flex-1">
              <p class="font-medium truncate text-sm" title={doc.filename}>
                {doc.filename}
              </p>
              <p class="mt-1 text-xs text-gray-500">
                {new Date(doc.createdAt).toLocaleString()}
              </p>
            </div>
            <span class="badge {getStateColor(doc.state)} badge-sm">
              {getStateLabel(doc.state)}
            </span>
          </div>

          {#if doc.metadata?.title}
            <p class="mt-2 truncate text-xs text-gray-600" title={doc.metadata.title}>
              {doc.metadata.title}
            </p>
          {/if}

          <!-- Progress indicators -->
          <div class="gap-1 mt-2 flex">
            <div class="h-1 flex-1 rounded {doc.state !== 'UPLOADED' ? 'bg-primary' : 'bg-gray-200'}"></div>
            <div
              class="h-1 flex-1 rounded {doc.state !== 'UPLOADED' && doc.state !== 'METADATA_ENTERED'
                ? 'bg-primary'
                : 'bg-gray-200'}">
            </div>
            <div
              class="h-1 flex-1 rounded {doc.state === 'SEGMENTED' || doc.state === 'SEGMENTATION_APPROVED'
                ? 'bg-primary'
                : 'bg-gray-200'}">
            </div>
            <div class="h-1 flex-1 rounded {doc.state === 'SEGMENTATION_APPROVED' ? 'bg-success' : 'bg-gray-200'}">
            </div>
          </div>
        </button>
      {/each}
    {/if}

    <!-- Failed documents section -->
    {#if failedDocuments.length > 0}
      <div class="mt-4 border-t pt-4">
        <h3 class="font-semibold mb-2 text-sm text-error">Failed Documents</h3>
        {#each failedDocuments as doc}
          <button
            class="p-3 mb-2 w-full rounded-lg border border-error/30 bg-error/5 text-left transition-colors hover:bg-error/10"
            on:click={() => dispatch('documentSelected', doc.id)}>
            <div class="flex items-start justify-between gap-2">
              <div class="min-w-0 flex-1">
                <p class="font-medium truncate text-sm" title={doc.filename}>
                  {doc.filename}
                </p>
                {#if doc.failureReason}
                  <p class="mt-1 text-xs text-error" title={doc.failureReason}>
                    {doc.failureReason}
                  </p>
                {/if}
              </div>
              <span class="badge badge-error badge-sm">Failed</span>
            </div>
          </button>
        {/each}
      </div>
    {/if}
  </div>
</div>
