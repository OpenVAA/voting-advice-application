<!--
@component
Metadata review form for documents

Allows reviewing/editing document metadata extracted automatically.
Pre-fills fields from extracted metadata with ability to edit.
Split-screen layout: original file preview on left, metadata form on right.
Emits 'submitted' event when metadata is approved.
Emits 'skip' event to move to next document without processing.
-->

<script lang="ts">
  import { createEventDispatcher } from 'svelte';
  import { enhance } from '$app/forms';
  import { invalidate } from '$app/navigation';
  import FileViewer from './FileViewer.svelte';
  import type { DocumentMetadata, ProcessingDocument } from '$lib/api/file-processing/types';

  export let document: ProcessingDocument;
  export let documentsCount: number;

  const dispatch = createEventDispatcher<{ submitted: void; skip: void; delete: void }>();

  // Use extracted metadata if available, otherwise use final metadata (for backwards compat)
  let metadata: DocumentMetadata = {
    title: document.extractedMetadata?.title ?? document.metadata?.title ?? '',
    authors: document.extractedMetadata?.authors ?? document.metadata?.authors ?? [],
    source: document.extractedMetadata?.source ?? document.metadata?.source ?? '',
    publishedDate: document.extractedMetadata?.publishedDate ?? document.metadata?.publishedDate ?? '',
    documentType: document.extractedMetadata?.documentType ?? document.metadata?.documentType ?? 'unofficial',
    locale: document.extractedMetadata?.locale ?? document.metadata?.locale ?? ''
  };

  let authorsString = metadata.authors?.join(', ') ?? '';
  let submitting = false;
  let error: string | null = null;
  let showDeleteDialog = false;
  let deleting = false;

  // Prepare metadata for submission
  function prepareMetadata(): DocumentMetadata {
    const authors = authorsString
      .split(',')
      .map((a) => a.trim())
      .filter((a) => a.length > 0);

    return {
      ...metadata,
      authors: authors.length > 0 ? authors : undefined,
      title: metadata.title || undefined,
      source: metadata.source || undefined,
      publishedDate: metadata.publishedDate || undefined,
      locale: metadata.locale || undefined
    };
  }

  // Form submission handlers following SvelteKit pattern
  const handleSubmitForm = () => {
    submitting = true;
    error = null;
    return async ({ result, update }) => {
      if (result.type === 'failure') {
        error = result.data?.error || 'Failed to approve metadata';
        submitting = false;
        return;
      }
      if (result.type === 'success') {
        await invalidate('app:documents');
        dispatch('submitted');
      }
      await update();
      submitting = false;
    };
  };

  const handleDeleteForm = () => {
    deleting = true;
    error = null;
    return async ({ result, update }) => {
      if (result.type === 'failure') {
        error = result.data?.error || 'Failed to delete document';
        deleting = false;
        showDeleteDialog = false;
        return;
      }
      if (result.type === 'success') {
        await invalidate('app:documents');
        dispatch('delete');
      }
      await update();
      deleting = false;
      showDeleteDialog = false;
    };
  };
</script>

<div class="space-y-4">
  <h3 class="font-semibold text-xl">Document Metadata</h3>

  <!-- Two-column layout: File preview + Metadata form -->
  <div class="grid h-[600px] grid-cols-2 gap-4">
    <!-- Left: Original file viewer -->
    <FileViewer documentId={document.id} fileType={document.fileType} filename={document.filename} />

    <!-- Right: Metadata form -->
    <div class="overflow-auto rounded-lg border bg-white p-4">
      <form method="POST" action="?/approveMetadata" use:enhance={handleSubmitForm} class="space-y-4">
        <input type="hidden" name="documentId" value={document.id} />
        <input type="hidden" name="metadata" value={JSON.stringify(prepareMetadata())} />
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
              Complete Processing
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
          Are you sure you want to delete <strong>{document.filename}</strong>? This action cannot be undone.
        </p>
        <div class="modal-action">
          <form method="POST" action="?/delete" use:enhance={handleDeleteForm}>
            <input type="hidden" name="documentId" value={document.id} />
            <button type="submit" class="btn btn-error" disabled={deleting}>
              {#if deleting}
                <span class="loading loading-spinner"></span>
                Deleting...
              {:else}
                Delete Permanently
              {/if}
            </button>
          </form>
          <button class="btn" type="button" on:click={() => (showDeleteDialog = false)} disabled={deleting}>
            Cancel
          </button>
        </div>
      </div>
    </div>
  {/if}
</div>
