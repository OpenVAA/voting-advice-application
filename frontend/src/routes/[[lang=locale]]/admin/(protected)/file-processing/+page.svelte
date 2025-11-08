<!--@component
# File Processing Page

Admin page for uploading and processing documents (PDF/TXT files).
Follows the pattern established by argument-condensation feature.

## Features
- Upload PDF or TXT files (max 50MB)
- Select all or specific documents for processing
- Delete uploaded documents
- Process documents (stub implementation)
-->

<script lang="ts">
  import { enhance } from '$app/forms';
  import { invalidate } from '$app/navigation';
  import { DocumentSelector, UploadZone } from '$lib/admin/components/fileProcessing';
  import { Button } from '$lib/components/button';
  import { getAdminContext } from '$lib/contexts/admin';
  import MainContent from '../../../MainContent.svelte';
  import type { ActionResult, SubmitFunction } from '@sveltejs/kit';
  import type { DocumentInfo } from '$lib/api/base/dataWriter.type';

  ////////////////////////////////////////////////////////////////////////
  // Data
  ////////////////////////////////////////////////////////////////////////

  export let data: { documents: Array<DocumentInfo> };

  $: documents = data.documents;

  ////////////////////////////////////////////////////////////////////////
  // Context
  ////////////////////////////////////////////////////////////////////////

  const { t, deleteDocuments } = getAdminContext();

  ////////////////////////////////////////////////////////////////////////
  // State
  ////////////////////////////////////////////////////////////////////////

  let selectedIds: Array<string> = [];
  let isAllSelected = false;
  let processingStatus: 'idle' | 'processing' | 'success' | 'error' = 'idle';
  let deletingStatus: 'idle' | 'deleting' | 'success' | 'error' = 'idle';
  let statusMessage = '';

  ////////////////////////////////////////////////////////////////////////
  // Process form handlers
  ////////////////////////////////////////////////////////////////////////

  const handleProcessSubmit: SubmitFunction = () => {
    processingStatus = 'processing';
    statusMessage = '';

    return async ({ result }: { result: ActionResult }) => {
      processingStatus = 'idle';

      if (result.type === 'success') {
        processingStatus = 'success';
        statusMessage = result.data?.message || 'Documents processed successfully';

        // Clear success message after 5 seconds
        setTimeout(() => {
          processingStatus = 'idle';
          statusMessage = '';
        }, 5000);
      } else if (result.type === 'failure' || result.type === 'error') {
        processingStatus = 'error';
        statusMessage =
          (result.type === 'failure' && result.data?.message) || 'Failed to process documents. Please try again.';
      }

      return { cancel: true };
    };
  };

  ////////////////////////////////////////////////////////////////////////
  // Delete handlers
  ////////////////////////////////////////////////////////////////////////

  async function handleDelete() {
    const count = isAllSelected ? documents.length : selectedIds.length;
    const idsToDelete = isAllSelected ? documents.map((d: DocumentInfo) => d.id) : selectedIds;

    if (
      !confirm(
        `Are you sure you want to delete ${count} document${count !== 1 ? 's' : ''}? This action cannot be undone.`
      )
    ) {
      return;
    }

    deletingStatus = 'deleting';
    statusMessage = '';

    try {
      const result = await deleteDocuments({ documentIds: idsToDelete });

      deletingStatus = 'success';
      statusMessage = `Deleted ${result.removed} document${result.removed !== 1 ? 's' : ''}`;
      selectedIds = [];

      // Refresh document list
      await invalidate('app:documents');

      // Clear success message after 3 seconds
      setTimeout(() => {
        deletingStatus = 'idle';
        statusMessage = '';
      }, 3000);
    } catch (error) {
      console.error('Delete error:', error);
      deletingStatus = 'error';
      statusMessage = 'Failed to delete documents. Please try again.';
    }
  }

  ////////////////////////////////////////////////////////////////////////
  // Reactive statements
  ////////////////////////////////////////////////////////////////////////

  $: hasDocuments = documents.length > 0;
  $: hasSelection = isAllSelected || selectedIds.length > 0;
  $: selectionCount = isAllSelected ? documents.length : selectedIds.length;
</script>

<MainContent title="File Processing">
  <div class="flex flex-col items-center">
    <p class="mb-lg max-w-xl text-center">
      Upload PDF or TXT documents for processing. You can upload files individually and then select which ones to
      process.
    </p>

    <!-- Upload Zone -->
    <div class="w-full max-w-xl">
      <UploadZone />
    </div>

    <!-- Document count -->
    {#if hasDocuments}
      <div class="mt-8 w-full max-w-xl rounded-lg bg-base-200 p-4">
        <p class="text-center text-sm">
          {documents.length} document{documents.length !== 1 ? 's' : ''} uploaded
        </p>
      </div>
    {/if}

    <!-- Processing Form -->
    {#if hasDocuments}
      <div class="mt-8 w-full max-w-xl">
        <h2 class="font-semibold mb-4 text-lg">Process Documents</h2>

        <form method="POST" action="?/process" class="space-y-6" use:enhance={handleProcessSubmit}>
          <!-- Hidden input for "process all" mode -->
          <input type="hidden" name="processAll" value={isAllSelected ? 'true' : 'false'} />

          <!-- Document Selector -->
          <DocumentSelector
            {documents}
            bind:selectedIds
            bind:isAllSelected
            disabled={processingStatus === 'processing' || deletingStatus === 'deleting'} />

          <!-- Status Messages -->
          {#if statusMessage}
            <div
              class="alert"
              class:alert-success={processingStatus === 'success' || deletingStatus === 'success'}
              class:alert-error={processingStatus === 'error' || deletingStatus === 'error'}
              class:alert-info={processingStatus === 'processing' || deletingStatus === 'deleting'}>
              <span>{statusMessage}</span>
            </div>
          {/if}

          <!-- Action Buttons -->
          <div class="flex flex-col items-center gap-4">
            <Button
              text={processingStatus === 'processing' ? 'Processing...' : 'Process Documents'}
              type="submit"
              variant="main"
              loading={processingStatus === 'processing'}
              disabled={!hasSelection || processingStatus === 'processing' || deletingStatus === 'deleting'} />

            {#if hasSelection}
              <p class="text-sm text-neutral">
                {selectionCount} document{selectionCount !== 1 ? 's' : ''} will be processed
              </p>
            {/if}
          </div>
        </form>

        <!-- Delete Button -->
        <div class="mt-8 flex flex-col items-center">
          <Button
            text={deletingStatus === 'deleting' ? 'Deleting...' : 'Delete Selected'}
            loading={deletingStatus === 'deleting'}
            disabled={!hasSelection || processingStatus === 'processing' || deletingStatus === 'deleting'}
            on:click={handleDelete}
            class="btn-outline" />
        </div>
      </div>
    {/if}
  </div>
</MainContent>
