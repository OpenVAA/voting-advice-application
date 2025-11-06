<!--
@component
Human-in-the-loop document pre-processing pipeline

Main orchestrator page for the file processing workflow:
1. Upload documents
2. Enter metadata
3. Review extraction (PDF->markdown or TXT)
4. Review segmentation
5. Complete or fail

Shows current document being processed and queue sidebar.
-->

<script lang="ts">
  import { onMount } from 'svelte';
  import DocumentUploadZone from './components/DocumentUploadZone.svelte';
  import ExtractionReview from './components/ExtractionReview.svelte';
  import FileViewer from './components/FileViewer.svelte';
  import MetadataForm from './components/MetadataForm.svelte';
  import QueueSidebar from './components/QueueSidebar.svelte';
  import SegmentationReview from './components/SegmentationReview.svelte';
  import type {ProcessingDocument} from '$lib/api/file-processing/types';

  let documents: Array<ProcessingDocument> = [];
  let failedDocuments: Array<ProcessingDocument> = [];
  let currentDocument: ProcessingDocument | null = null;
  let error: string | null = null;
  let mainContainer: HTMLDivElement;

  onMount(() => {
    refreshQueue();
  });

  async function refreshQueue() {
    try {
      const response = await fetch('/api/file-processing/queue');
      if (!response.ok) throw new Error('Failed to fetch queue');
      const data = await response.json();
      documents = data.documents;
      failedDocuments = data.failedDocuments;

      // Set current document to first in queue if none selected
      if (!currentDocument && documents.length > 0) {
        currentDocument = documents[0];
      }
    } catch (err) {
      error = err instanceof Error ? err.message : 'Failed to load queue';
      console.error('Queue refresh error:', err);
    }
  }

  function handleDocumentUploaded(event: CustomEvent<ProcessingDocument>) {
    const newDoc = event.detail;
    documents = [...documents, newDoc];
    if (!currentDocument) {
      currentDocument = newDoc;
    }
  }

  function handleDocumentSelected(event: CustomEvent<string>) {
    const docId = event.detail;
    const doc = documents.find((d) => d.id === docId);
    if (doc) {
      currentDocument = doc;
    }
  }

  async function handleExtractionApproved() {
    await refreshQueue();
    // Document will now be in METADATA_INSERTION state
    if (currentDocument) {
      const updated = documents.find((d) => d.id === currentDocument?.id);
      if (updated) {
        currentDocument = updated;
      }
    }
  }

  async function handleMetadataApproved() {
    await refreshQueue();
    // Move to next stage after metadata approval
    if (currentDocument) {
      const updated = documents.find((d) => d.id === currentDocument?.id);
      if (updated) {
        currentDocument = updated;
      }
    }
  }

  async function handleSegmentationApproved() {
    await refreshQueue();
    if (currentDocument) {
      const updated = documents.find((d) => d.id === currentDocument?.id);
      if (updated) {
        currentDocument = updated;
      }
    }
  }

  async function handleSegmentationRefresh() {
    await refreshQueue();
    if (currentDocument) {
      const updated = documents.find((d) => d.id === currentDocument?.id);
      if (updated) {
        currentDocument = updated;
      }
    }
  }

  async function handleDocumentFailed() {
    await refreshQueue();
    // Move to next document in queue
    if (documents.length > 0) {
      currentDocument = documents[0];
    } else {
      currentDocument = null;
    }
  }

  function handleSkipDocument() {
    // Find next document in queue
    const currentIndex = documents.findIndex((d) => d.id === currentDocument?.id);
    if (currentIndex < documents.length - 1) {
      currentDocument = documents[currentIndex + 1];
    } else if (documents.length > 0) {
      currentDocument = documents[0];
    } else {
      currentDocument = null;
    }
  }

  async function handleQueueDocument() {
    if (!currentDocument) return;

    try {
      const response = await fetch('/api/file-processing/queue-documents', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          documentIds: [currentDocument.id]
        })
      });

      if (!response.ok) {
        throw new Error('Failed to queue document');
      }

      await refreshQueue();
      // Update current document reference to show new state
      const updated = documents.find((d) => d.id === currentDocument?.id);
      if (updated) {
        currentDocument = updated;
      }
    } catch (err) {
      error = err instanceof Error ? err.message : 'Failed to queue document';
      console.error('Queue document error:', err);
    }
  }

  async function handleDequeueDocument() {
    if (!currentDocument) return;

    try {
      const response = await fetch('/api/file-processing/dequeue-documents', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          documentIds: [currentDocument.id]
        })
      });

      if (!response.ok) {
        throw new Error('Failed to dequeue document');
      }

      await refreshQueue();
      // Update current document reference to show new state
      const updated = documents.find((d) => d.id === currentDocument?.id);
      if (updated) {
        currentDocument = updated;
      }
    } catch (err) {
      error = err instanceof Error ? err.message : 'Failed to dequeue document';
      console.error('Dequeue document error:', err);
    }
  }

  let extracting = false;
  let deleting = false;
  let showDeleteDialog = false;

  async function handleExtractDocument() {
    if (!currentDocument) return;

    extracting = true;
    error = null;

    try {
      const response = await fetch('/api/file-processing/extract', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          documentId: currentDocument.id
        })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to extract document');
      }

      await refreshQueue();
      // Update current document reference to show new state
      const updated = documents.find((d) => d.id === currentDocument?.id);
      if (updated) {
        currentDocument = updated;
      }
    } catch (err) {
      error = err instanceof Error ? err.message : 'Failed to extract document';
      console.error('Extract document error:', err);
    } finally {
      extracting = false;
    }
  }

  async function handleDocumentDeleted() {
    await refreshQueue();
    // Move to next document in queue after deletion
    if (documents.length > 0) {
      currentDocument = documents[0];
    } else {
      currentDocument = null;
    }
  }

  async function handleDelete() {
    if (!currentDocument) return;

    deleting = true;
    error = null;

    try {
      const response = await fetch('/api/file-processing/delete', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          documentId: currentDocument.id
        })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to delete document');
      }

      showDeleteDialog = false;
      await handleDocumentDeleted();
    } catch (err) {
      error = err instanceof Error ? err.message : 'Failed to delete document';
      console.error('Delete document error:', err);
    } finally {
      deleting = false;
    }
  }

  $: currentStage = currentDocument?.state ?? null;
</script>

<div class="grid grid-cols-[1fr_256px] h-screen bg-gray-100">
  <!-- Main content area -->
  <div class="min-w-0 overflow-auto p-8" bind:this={mainContainer}>
    <h1 class="mb-6 text-3xl font-bold">Document Pre-Processing Pipeline</h1>

    {#if error}
      <div class="alert alert-error mb-4">
        <span>{error}</span>
      </div>
    {/if}

    <!-- Upload zone - always visible -->
    <div class="mb-8">
      <DocumentUploadZone on:uploaded={handleDocumentUploaded} />
    </div>

    {#if currentDocument}
      <div class="card bg-white shadow-xl">
        <div class="card-body">
          <h2 class="card-title flex items-center gap-2 min-w-0">
            <span class="truncate" title={currentDocument.filename}>Processing: {currentDocument.filename}</span>
            <span class="badge badge-primary shrink-0">{currentDocument.state}</span>
          </h2>

          <!-- Stage-specific content -->
          {#if currentStage === 'UPLOADED'}
            <div class="space-y-4">
              <h3 class="font-semibold text-xl">Document Review</h3>

              <!-- Two-column layout: Document viewer + Action panel -->
              <div class="h-[600px] grid grid-cols-2 gap-4">
                <!-- Left: Document viewer -->
                <FileViewer
                  documentId={currentDocument.id}
                  fileType={currentDocument.fileType}
                  filename={currentDocument.filename} />

                <!-- Right: Action panel -->
                <div class="flex flex-col gap-4 rounded-lg border bg-gray-50 p-4">
                  <h3 class="font-semibold text-lg">Document Actions</h3>

                  <!-- Document info -->
                  <div class="space-y-2 text-sm">
                    <p><strong>Filename:</strong> {currentDocument.filename}</p>
                    <p><strong>Uploaded:</strong> {new Date(currentDocument.createdAt).toLocaleString()}</p>
                    <p><strong>Type:</strong> {currentDocument.fileType.toUpperCase()}</p>
                  </div>

                  <div class="divider"></div>

                  <!-- Instructions -->
                  <p class="text-sm text-gray-600">
                    Extract this document immediately to begin processing, or queue it for batch extraction later.
                    You can also use "Queue All" in the sidebar to queue all unprocessed documents at once.
                  </p>

                  <!-- Action buttons -->
                  <div class="mt-auto flex flex-col gap-2">
                    <button class="btn btn-accent" on:click={handleExtractDocument} disabled={extracting || deleting}>
                      {#if extracting}
                        <span class="loading loading-spinner"></span>
                        Extracting...
                      {:else}
                        Extract This Document
                      {/if}
                    </button>
                    <button class="btn btn-primary" on:click={handleQueueDocument} disabled={extracting || deleting}>
                      Queue This Document
                    </button>
                    <button class="btn btn-ghost" on:click={handleSkipDocument} disabled={documents.length === 1 || extracting || deleting}>
                      Next Document
                    </button>
                    <button class="btn btn-ghost btn-error" on:click={() => showDeleteDialog = true} disabled={extracting || deleting}>
                      Delete Document
                    </button>
                  </div>
                </div>
              </div>
            </div>
          {:else if currentStage === 'QUEUED_FOR_EXTRACTION'}
            <div class="space-y-4">
              <h3 class="font-semibold text-xl">Queued for Extraction</h3>

              <!-- Two-column layout: Document viewer + Action panel -->
              <div class="h-[600px] grid grid-cols-2 gap-4">
                <!-- Left: Document viewer -->
                <FileViewer
                  documentId={currentDocument.id}
                  fileType={currentDocument.fileType}
                  filename={currentDocument.filename} />

                <!-- Right: Action panel -->
                <div class="flex flex-col gap-4 rounded-lg border bg-gray-50 p-4">
                  <h3 class="font-semibold text-lg">Document Actions</h3>

                  <!-- Document info -->
                  <div class="space-y-2 text-sm">
                    <p><strong>Filename:</strong> {currentDocument.filename}</p>
                    <p><strong>Uploaded:</strong> {new Date(currentDocument.createdAt).toLocaleString()}</p>
                    <p><strong>Type:</strong> {currentDocument.fileType.toUpperCase()}</p>
                  </div>

                  <div class="divider"></div>

                  <!-- Instructions -->
                  <p class="text-sm text-gray-600">
                    This document is queued for extraction. Click "Extract Queued" in the sidebar to begin processing,
                    or dequeue it to move it back to unprocessed status.
                  </p>

                  <!-- Action buttons -->
                  <div class="mt-auto flex flex-col gap-2">
                    <button class="btn btn-secondary" on:click={handleDequeueDocument} disabled={deleting}>
                      Dequeue This Document
                    </button>
                    <button class="btn btn-ghost" on:click={handleSkipDocument} disabled={documents.length === 1 || deleting}>
                      Next Document
                    </button>
                    <button class="btn btn-ghost btn-error" on:click={() => showDeleteDialog = true} disabled={deleting}>
                      Delete Document
                    </button>
                  </div>
                </div>
              </div>
            </div>
          {:else if currentStage === 'EXTRACTED'}
            <ExtractionReview
              document={currentDocument}
              on:approved={handleExtractionApproved}
              on:failed={handleDocumentFailed} />
          {:else if currentStage === 'EXTRACTION_APPROVED' || currentStage === 'METADATA_INSERTION'}
            <MetadataForm
              document={currentDocument}
              documentsCount={documents.length}
              on:submitted={handleMetadataApproved}
              on:skip={handleSkipDocument}
              on:delete={handleDocumentDeleted} />
          {:else if currentStage === 'METADATA_APPROVED' || currentStage === 'SEGMENTED'}
            <SegmentationReview
              document={currentDocument}
              on:approved={handleSegmentationApproved}
              on:failed={handleDocumentFailed}
              on:refresh={handleSegmentationRefresh} />
          {:else if currentStage === 'SEGMENTATION_APPROVED'}
            <div class="alert alert-success">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                class="h-6 w-6 shrink-0 stroke-current"
                fill="none"
                viewBox="0 0 24 24"
                ><path
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  stroke-width="2"
                  d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
              <span>Document processing complete!</span>
            </div>

            <div class="mt-4 flex gap-2">
              <button class="btn btn-primary" on:click={handleSkipDocument}> Process Next Document </button>
              <button
                class="btn btn-outline"
                on:click={() => {
                  const dataStr = JSON.stringify(currentDocument, null, 2);
                  const dataBlob = new Blob([dataStr], { type: 'application/json' });
                  const url = URL.createObjectURL(dataBlob);
                  const link = document.createElement('a');
                  link.href = url;
                  link.download = `${currentDocument?.filename}_processed.json`;
                  link.click();
                  URL.revokeObjectURL(url);
                }}>
                Download JSON
              </button>
            </div>
          {/if}
        </div>
      </div>
    {:else}
      <div class="alert alert-info">
        <span>Upload documents to begin processing</span>
      </div>
    {/if}
  </div>

  <!-- Queue sidebar -->
  <QueueSidebar
    {documents}
    {failedDocuments}
    currentDocumentId={currentDocument?.id}
    on:documentSelected={handleDocumentSelected}
    on:refresh={refreshQueue} />
</div>

<!-- Delete confirmation dialog -->
{#if showDeleteDialog && currentDocument}
  <div class="modal modal-open">
    <div class="modal-box">
      <h3 class="text-lg font-bold">Delete Document</h3>
      <p class="py-4">
        Are you sure you want to delete <strong>{currentDocument.filename}</strong>?
        This action cannot be undone.
      </p>
      <div class="modal-action">
        <button class="btn btn-error" on:click={handleDelete} disabled={deleting}>
          {#if deleting}
            <span class="loading loading-spinner"></span>
            Deleting...
          {:else}
            Delete Permanently
          {/if}
        </button>
        <button class="btn" on:click={() => showDeleteDialog = false} disabled={deleting}>
          Cancel
        </button>
      </div>
    </div>
  </div>
{/if}
