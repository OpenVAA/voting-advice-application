<!--
@component
Human-in-the-loop document pre-processing pipeline

Main orchestrator page for the file processing workflow:
1. Upload documents
2. Extract text (PDF → markdown or read TXT)
3. Review extraction
4. Segment text
5. Review segmentation
6. Extract and approve metadata
7. Complete or fail

Shows current document being processed and document sidebar.
-->

<script lang="ts">
  import { invalidate } from '$app/navigation';
  import DocumentUploadZone from './components/DocumentUploadZone.svelte';
  import ExtractionReview from './components/ExtractionReview.svelte';
  import FileViewer from './components/FileViewer.svelte';
  import MetadataForm from './components/MetadataForm.svelte';
  import DocumentSidebar from './components/DocumentSidebar.svelte';
  import SegmentationReview from './components/SegmentationReview.svelte';
  import type {ProcessingDocument} from '$lib/api/file-processing/types';

  // Receive data from server load function
  export let data../file-processing/$types.js;

  // Initialize from server-provided data
  let documents: Array<ProcessingDocument> = data.documents;
  let failedDocuments: Array<ProcessingDocument> = data.failedDocuments;
  let currentDocument: ProcessingDocument | null = null;
  let error: string | null = null;
  let mainContainer: HTMLDivElement;

  // Set initial current document
  $: if (!currentDocument && documents.length > 0) {
    currentDocument = documents[0];
  }

  // Update local state when server data changes
  $: documents = data.documents;
  $: failedDocuments = data.failedDocuments;

  // Refresh data from server (used during long-running operations)
  async function refreshQueue() {
    try {
      await invalidate('app:documents');
      // Update current document reference after refresh
      if (currentDocument) {
        const updated = documents.find((d) => d.id === currentDocument?.id);
        if (updated) {
          currentDocument = updated;
        }
      }
    } catch (err) {
      error = err instanceof Error ? err.message : 'Failed to refresh documents';
      console.error('Refresh error:', err);
    }
  }

  async function handleDocumentUploaded(event: CustomEvent<ProcessingDocument>) {
    const newDoc = event.detail;

    // Refresh server data to include newly uploaded document
    await invalidate('app:documents');

    // Set as current if none selected
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
    // Document will now be in REQUIRES_SEGMENTATION state
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

  let extracting = false;
  let segmenting = false;
  let extractingMetadata = false;
  let deleting = false;
  let showDeleteDialog = false;

  // Auto-processing flags
  let autoExtractText = false;
  let autoSegmentText = false;

  async function handleStartProcessing() {
    if (!currentDocument) return;

    extracting = true;
    error = null;

    try {
      const response = await fetch('/api/file-processing/extract', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          documentId: currentDocument.id,
          processingOptions: {
            auto_extract_text: autoExtractText,
            auto_segment_text: autoSegmentText
          }
        })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to start processing');
      }

      await refreshQueue();
      // Update current document reference to show new state
      const updated = documents.find((d) => d.id === currentDocument?.id);
      if (updated) {
        currentDocument = updated;
      }
    } catch (err) {
      error = err instanceof Error ? err.message : 'Failed to start processing';
      console.error('Start processing error:', err);
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

  async function handleSegment() {
    if (!currentDocument) return;

    segmenting = true;
    error = null;

    try {
      const response = await fetch('/api/file-processing/segment', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          documentId: currentDocument.id
        })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to segment text');
      }

      await refreshQueue();
      // Update current document reference to show new state
      const updated = documents.find((d) => d.id === currentDocument?.id);
      if (updated) {
        currentDocument = updated;
      }
    } catch (err) {
      error = err instanceof Error ? err.message : 'Failed to segment text';
      console.error('Segment text error:', err);
    } finally {
      segmenting = false;
    }
  }

  async function handleExtractMetadata() {
    if (!currentDocument) return;

    extractingMetadata = true;
    error = null;

    try {
      const response = await fetch('/api/file-processing/extract-metadata', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          documentId: currentDocument.id
        })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to extract metadata');
      }

      await refreshQueue();
      // Update current document reference to show new state
      const updated = documents.find((d) => d.id === currentDocument?.id);
      if (updated) {
        currentDocument = updated;
      }
    } catch (err) {
      error = err instanceof Error ? err.message : 'Failed to extract metadata';
      console.error('Extract metadata error:', err);
    } finally {
      extractingMetadata = false;
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

  // Auto-trigger segmentation when document enters REQUIRES_SEGMENTATION with auto_segment_text ON
  $: if (
    currentDocument?.state === 'REQUIRES_SEGMENTATION' &&
    currentDocument?.processingOptions?.auto_segment_text &&
    !segmenting
  ) {
    handleSegment();
  }
</script>

<div class="grid h-screen grid-cols-[1fr_256px] bg-gray-100">
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
          <h2 class="card-title flex min-w-0 items-center gap-2">
            <span class="truncate" title={currentDocument.filename}>Processing: {currentDocument.filename}</span>
            <span class="badge badge-primary shrink-0">{currentDocument.state}</span>
          </h2>

          <!-- Stage-specific content -->
          {#if currentStage === 'REQUIRES_TEXT_EXTRACTION'}
            <div class="space-y-4">
              <h3 class="font-semibold text-xl">Start Processing</h3>

              <!-- Document info and processing options -->
              <div class="space-y-4">
                <div class="space-y-2 text-sm">
                  <p><strong>Filename:</strong> {currentDocument.filename}</p>
                  <p><strong>Type:</strong> {currentDocument.fileType.toUpperCase()}</p>
                </div>

                <div class="divider"></div>

                <!-- Auto-processing options -->
                <div class="form-control">
                  <label class="label cursor-pointer justify-start gap-4">
                    <input type="checkbox" class="checkbox" bind:checked={autoExtractText} />
                    <div>
                      <span class="font-semibold label-text">Auto-approve text extraction</span>
                      <p class="text-xs text-gray-600">Skip manual review of extracted text</p>
                    </div>
                  </label>
                </div>

                <div class="form-control">
                  <label class="label cursor-pointer justify-start gap-4">
                    <input type="checkbox" class="checkbox" bind:checked={autoSegmentText} />
                    <div>
                      <span class="font-semibold label-text">Auto-approve segmentation</span>
                      <p class="text-xs text-gray-600">Automatically segment text and skip manual review</p>
                    </div>
                  </label>
                </div>

                <div class="divider"></div>

                <!-- Action buttons -->
                <div class="flex gap-2">
                  <button class="btn btn-primary" on:click={handleStartProcessing} disabled={extracting}>
                    {#if extracting}
                      <span class="loading loading-spinner"></span>
                      Processing...
                    {:else}
                      Start Processing
                    {/if}
                  </button>
                  <button
                    class="btn btn-ghost btn-error"
                    on:click={() => (showDeleteDialog = true)}
                    disabled={extracting}>
                    Delete Document
                  </button>
                </div>
              </div>
            </div>
          {:else if currentStage === 'EXTRACTING'}
            <div class="flex flex-col items-center gap-4 p-8">
              <span class="loading loading-spinner loading-lg"></span>
              <p class="font-semibold text-lg">Extracting text from PDF...</p>
              <p class="text-sm text-gray-600">This may take a moment for large documents</p>
            </div>
          {:else if currentStage === 'AWAITING_TEXT_APPROVAL'}
            <ExtractionReview
              document={currentDocument}
              on:approved={handleExtractionApproved}
              on:failed={handleDocumentFailed} />
          {:else if currentStage === 'REQUIRES_SEGMENTATION'}
            <div class="space-y-4">
              <h3 class="font-semibold text-xl">Segment Text</h3>

              <!-- Two-column layout: Original file + Extracted text -->
              <div class="grid h-[600px] grid-cols-2 gap-4">
                <!-- Left: Original file viewer -->
                <FileViewer
                  documentId={currentDocument.id}
                  fileType={currentDocument.fileType}
                  filename={currentDocument.filename} />

                <!-- Right: Extracted text (read-only) -->
                <div class="overflow-auto rounded-lg border bg-white p-4">
                  <h4 class="font-semibold sticky top-0 mb-2 bg-white">Extracted Text (read-only)</h4>
                  <div class="font-mono whitespace-pre-wrap text-sm text-gray-700">
                    {currentDocument.extractedText || 'No extracted text available'}
                  </div>
                </div>
              </div>

              <p class="text-gray-600">
                Text extraction complete. Review the document and extracted text above, then segment the text into
                logical chunks for processing.
              </p>

              <!-- Actions -->
              <div class="flex gap-2">
                <button class="btn btn-primary" on:click={handleSegment} disabled={segmenting || deleting}>
                  {#if segmenting}
                    <span class="loading loading-spinner"></span>
                    Segmenting...
                  {:else}
                    Segment
                  {/if}
                </button>
                <button
                  class="btn btn-ghost"
                  on:click={handleSkipDocument}
                  disabled={segmenting || deleting || documents.length === 1}>
                  Next Document
                </button>
                <button
                  class="btn btn-ghost btn-error"
                  on:click={() => (showDeleteDialog = true)}
                  disabled={segmenting || deleting}>
                  Delete
                </button>
              </div>
            </div>
          {:else if currentStage === 'SEGMENTING'}
            <div class="flex flex-col items-center gap-4 p-8">
              <span class="loading loading-spinner loading-lg"></span>
              <p class="font-semibold text-lg">Segmenting text...</p>
              <p class="text-sm text-gray-600">Dividing document into logical chunks</p>
            </div>
          {:else if currentStage === 'AWAITING_SEGMENTATION_APPROVAL'}
            <SegmentationReview
              document={currentDocument}
              on:approved={handleSegmentationApproved}
              on:failed={handleDocumentFailed}
              on:refresh={handleSegmentationRefresh} />
          {:else if currentStage === 'REQUIRES_METADATA_EXTRACTION'}
            <div class="space-y-4">
              <h3 class="font-semibold text-xl">Extract Metadata</h3>
              <p class="text-gray-600">
                Segmentation complete. Extract metadata (title, authors, source, etc.) from the document using LLM.
              </p>

              <div class="flex gap-2">
                <button class="btn btn-primary" on:click={handleExtractMetadata} disabled={extractingMetadata}>
                  {#if extractingMetadata}
                    <span class="loading loading-spinner"></span>
                    Extracting Metadata...
                  {:else}
                    Extract Metadata
                  {/if}
                </button>
              </div>
            </div>
          {:else if currentStage === 'EXTRACTING_METADATA'}
            <div class="flex flex-col items-center gap-4 p-8">
              <span class="loading loading-spinner loading-lg"></span>
              <p class="font-semibold text-lg">Extracting metadata...</p>
              <p class="text-sm text-gray-600">Analyzing document for title, authors, and other metadata</p>
            </div>
          {:else if currentStage === 'AWAITING_METADATA_APPROVAL'}
            <MetadataForm
              document={currentDocument}
              documentsCount={documents.length}
              on:submitted={handleMetadataApproved}
              on:skip={handleSkipDocument}
              on:delete={handleDocumentDeleted} />
          {:else if currentStage === 'COMPLETED'}
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

  <!-- Document sidebar -->
  <DocumentSidebar
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
        Are you sure you want to delete <strong>{currentDocument.filename}</strong>? This action cannot be undone.
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
        <button class="btn" on:click={() => (showDeleteDialog = false)} disabled={deleting}> Cancel </button>
      </div>
    </div>
  </div>
{/if}
