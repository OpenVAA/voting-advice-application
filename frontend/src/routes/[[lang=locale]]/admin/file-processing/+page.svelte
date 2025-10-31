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
  import MetadataForm from './components/MetadataForm.svelte';
  import QueueSidebar from './components/QueueSidebar.svelte';
  import SegmentationReview from './components/SegmentationReview.svelte';
  import type {ProcessingDocument} from '$lib/api/file-processing/types';

  let documents: Array<ProcessingDocument> = [];
  let failedDocuments: Array<ProcessingDocument> = [];
  let currentDocument: ProcessingDocument | null = null;
  let error: string | null = null;

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

  async function handleMetadataSubmitted() {
    await refreshQueue();
    // Move to next stage
    if (currentDocument) {
      const updated = documents.find((d) => d.id === currentDocument?.id);
      if (updated) {
        currentDocument = updated;
      }
    }
  }

  async function handleExtractionApproved() {
    await refreshQueue();
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

  async function handleDocumentDeleted() {
    await refreshQueue();
    // Move to next document in queue after deletion
    if (documents.length > 0) {
      currentDocument = documents[0];
    } else {
      currentDocument = null;
    }
  }

  $: currentStage = currentDocument?.state ?? null;
</script>

<div class="flex h-screen bg-gray-100">
  <!-- Main content area -->
  <div class="flex-1 overflow-auto p-8">
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
          <h2 class="card-title">
            Processing: {currentDocument.filename}
            <span class="badge badge-primary">{currentDocument.state}</span>
          </h2>

          <!-- Stage-specific content -->
          {#if currentStage === 'UPLOADED' || currentStage === 'METADATA_ENTERED'}
            <MetadataForm
              document={currentDocument}
              documentsCount={documents.length}
              on:submitted={handleMetadataSubmitted}
              on:skip={handleSkipDocument}
              on:delete={handleDocumentDeleted} />
          {:else if currentStage === 'EXTRACTED'}
            <ExtractionReview
              document={currentDocument}
              on:approved={handleExtractionApproved}
              on:failed={handleDocumentFailed} />
          {:else if currentStage === 'EXTRACTION_APPROVED' || currentStage === 'SEGMENTED'}
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
