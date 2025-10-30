<!--
@component
Metadata entry form for documents

Allows entering/editing document metadata before processing.
Emits 'submitted' event when metadata is saved.
Emits 'skip' event to move to next document without processing.
-->

<script lang="ts">
  import { createEventDispatcher } from 'svelte';
  import type { DocumentMetadata,ProcessingDocument } from '$lib/api/file-processing/types';

  export let document: ProcessingDocument;

  const dispatch = createEventDispatcher<{ submitted: void; skip: void }>();

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
</script>

<div class="space-y-4">
  <h3 class="font-semibold text-xl">Document Metadata</h3>

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
      <button type="submit" class="btn btn-primary" disabled={submitting}>
        {#if submitting}
          <span class="loading loading-spinner"></span>
          Processing...
        {:else}
          Submit & Extract
        {/if}
      </button>
      <button type="button" class="btn btn-ghost" on:click={() => dispatch('skip')} disabled={submitting}>
        Skip to Next
      </button>
    </div>
  </form>
</div>
