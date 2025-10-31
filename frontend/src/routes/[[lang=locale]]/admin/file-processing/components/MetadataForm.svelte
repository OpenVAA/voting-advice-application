<!--
@component
Metadata entry form for documents

Allows entering/editing document metadata before processing.
Split-screen layout: original file preview on left, metadata form on right.
Emits 'submitted' event when metadata is saved.
Emits 'skip' event to move to next document without processing.
-->

<script lang="ts">
  import { createEventDispatcher } from 'svelte';
  import type { DocumentMetadata,ProcessingDocument } from '$lib/api/file-processing/types';
  import FileViewer from './FileViewer.svelte';

  export let document: ProcessingDocument;
  export let documentsCount: number;

  const dispatch = createEventDispatcher<{ submitted: void; skip: void; delete: void }>();

  let metadata: DocumentMetadata = {
    title: document.metadata?.title ?? '',
    authors: document.metadata?.authors ?? [],
    source: document.metadata?.source ?? '',
    publishedDate: document.metadata?.publishedDate ?? '',
    documentType: document.metadata?.documentType ?? 'unofficial',
    locale: document.metadata?.locale ?? ''
  };

  let authorsString = metadata.authors?.join(', ') ?? '';
  let submitting = false;
  let error: string | null = null;
  let showDeleteDialog = false;
  let deleting = false;

  async function handleSubmit() {
    submitting = true;
    error = null;

    try {
      // Parse authors from comma-separated string
      const authors = authorsString
        .split(',')
        .map((a) => a.trim())
        .filter((a) => a.length > 0);

      const metadataToSubmit: DocumentMetadata = {
        ...metadata,
        authors: authors.length > 0 ? authors : undefined,
        title: metadata.title || undefined,
        source: metadata.source || undefined,
        publishedDate: metadata.publishedDate || undefined,
        locale: metadata.locale || undefined
      };

      const response = await fetch('/api/file-processing/metadata', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          documentId: document.id,
          metadata: metadataToSubmit
        })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to save metadata');
      }

      // Trigger extraction automatically after metadata is saved
      const extractResponse = await fetch('/api/file-processing/extract', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          documentId: document.id
        })
      });

      if (!extractResponse.ok) {
        const errorData = await extractResponse.json();
        throw new Error(errorData.error || 'Failed to extract text');
      }

      dispatch('submitted');
    } catch (err) {
      error = err instanceof Error ? err.message : 'Failed to save metadata';
      console.error('Metadata submission error:', err);
    } finally {
      submitting = false;
    }
  }

  async function handleDelete() {
    deleting = true;
    error = null;

    try {
      const response = await fetch('/api/file-processing/delete', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          documentId: document.id
        })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to delete document');
      }

      dispatch('delete');
    } catch (err) {
      error = err instanceof Error ? err.message : 'Failed to delete document';
      console.error('Delete document error:', err);
    } finally {
      deleting = false;
      showDeleteDialog = false;
    }
  }
</script>

<div class="space-y-4">
  <h3 class="font-semibold text-xl">Document Metadata</h3>

  <!-- Two-column layout: File preview + Metadata form -->
  <div class="h-[600px] grid grid-cols-2 gap-4">
    <!-- Left: Original file viewer -->
    <FileViewer documentId={document.id} fileType={document.fileType} filename={document.filename} />

    <!-- Right: Metadata form -->
    <div class="overflow-auto rounded-lg border bg-white p-4">
      <form on:submit|preventDefault={handleSubmit} class="space-y-4">
    <!-- Title -->
    <div class="form-control">
      <label class="label" for="title">
        <span class="label-text">Title</span>
      </label>
      <input
        id="title"
        type="text"
        bind:value={metadata.title}
        class="input input-bordered"
        placeholder="Document title" />
    </div>

    <!-- Authors -->
    <div class="form-control">
      <label class="label" for="authors">
        <span class="label-text">Authors (comma-separated)</span>
      </label>
      <input
        id="authors"
        type="text"
        bind:value={authorsString}
        class="input input-bordered"
        placeholder="John Doe, Jane Smith" />
    </div>

    <!-- Source/Link -->
    <div class="form-control">
      <label class="label" for="source">
        <span class="label-text">Source/Link</span>
      </label>
      <input
        id="source"
        type="text"
        bind:value={metadata.source}
        class="input input-bordered"
        placeholder="https://example.com/document" />
    </div>

    <!-- Published Date -->
    <div class="form-control">
      <label class="label" for="publishedDate">
        <span class="label-text">Published Date</span>
      </label>
      <input id="publishedDate" type="date" bind:value={metadata.publishedDate} class="input input-bordered" />
    </div>

    <!-- Document Type -->
    <div class="form-control">
      <label class="label" for="documentType">
        <span class="label-text">Document Type</span>
      </label>
      <select id="documentType" bind:value={metadata.documentType} class="select select-bordered">
        <option value="official">Official</option>
        <option value="unofficial">Unofficial</option>
      </select>
    </div>

    <!-- Locale -->
    <div class="form-control">
      <label class="label" for="locale">
        <span class="label-text">Locale (optional)</span>
      </label>
      <input
        id="locale"
        type="text"
        bind:value={metadata.locale}
        class="input input-bordered"
        placeholder="en, fi, sv, etc."
        maxlength="5" />
    </div>

    {#if error}
      <div class="alert alert-error">
        <span>{error}</span>
      </div>
    {/if}

    <!-- Actions -->
    <div class="flex gap-2">
      <button type="submit" class="btn btn-primary" disabled={submitting || deleting}>
        {#if submitting}
          <span class="loading loading-spinner"></span>
          Processing...
        {:else}
          Submit & Extract
        {/if}
      </button>
      <button
        type="button"
        class="btn btn-ghost"
        on:click={() => dispatch('skip')}
        disabled={submitting || deleting || documentsCount === 1}>
        Next Document
      </button>
      <button
        type="button"
        class="btn btn-ghost btn-error"
        on:click={() => (showDeleteDialog = true)}
        disabled={submitting || deleting}>
        Delete
      </button>
    </div>
      </form>
    </div>
  </div>

  <!-- Delete confirmation dialog -->
  {#if showDeleteDialog}
    <div class="modal modal-open">
      <div class="modal-box">
        <h3 class="text-lg font-bold">Delete Document</h3>
        <p class="py-4">
          Are you sure you want to delete <strong>{document.filename}</strong>?
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
          <button class="btn" on:click={() => (showDeleteDialog = false)} disabled={deleting}> Cancel </button>
        </div>
      </div>
    </div>
  {/if}
</div>
