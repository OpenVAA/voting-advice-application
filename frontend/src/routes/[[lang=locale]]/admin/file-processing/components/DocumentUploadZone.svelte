<!--
@component
Document upload zone with drag-and-drop support

Allows uploading PDF and TXT files to begin processing.
Emits 'uploaded' event with the new document.
-->

<script lang="ts">
  import { createEventDispatcher } from 'svelte';
  import type { ProcessingDocument, UploadResponse } from '$lib/api/file-processing/types';

  const dispatch = createEventDispatcher<{ uploaded: ProcessingDocument }>();

  let dragActive = false;
  let uploading = false;
  let uploadError: string | null = null;

  async function handleFileUpload(file: File) {
    if (!file.name.endsWith('.pdf') && !file.name.endsWith('.txt')) {
      uploadError = 'Only PDF and TXT files are supported';
      return;
    }

    uploading = true;
    uploadError = null;

    try {
      const formData = new FormData();
      formData.append('file', file);

      const response = await fetch('/api/file-processing/upload', {
        method: 'POST',
        body: formData
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Upload failed');
      }

      const uploadResult: UploadResponse = await response.json();

      // Fetch the full document to emit
      const docResponse = await fetch(`/api/file-processing/document/${uploadResult.documentId}`);
      const docData = await docResponse.json();

      dispatch('uploaded', docData.document);
    } catch (error) {
      uploadError = error instanceof Error ? error.message : 'Upload failed';
      console.error('Upload error:', error);
    } finally {
      uploading = false;
    }
  }

  function handleDrop(event: DragEvent) {
    event.preventDefault();
    dragActive = false;

    const files = event.dataTransfer?.files;
    if (files && files.length > 0) {
      // Upload files one by one
      Array.from(files).forEach((file) => handleFileUpload(file));
    }
  }

  function handleDragOver(event: DragEvent) {
    event.preventDefault();
    dragActive = true;
  }

  function handleDragLeave() {
    dragActive = false;
  }

  function handleFileInput(event: Event) {
    const input = event.target as HTMLInputElement;
    const files = input.files;
    if (files && files.length > 0) {
      Array.from(files).forEach((file) => handleFileUpload(file));
    }
    // Reset input
    input.value = '';
  }
</script>

<div
  class="border-2 rounded-lg border-dashed p-8 text-center transition-colors {dragActive
    ? 'border-primary bg-primary/10'
    : 'border-gray-300 hover:border-gray-400'}"
  on:drop={handleDrop}
  on:dragover={handleDragOver}
  on:dragleave={handleDragLeave}
  role="button"
  tabindex="0">
  {#if uploading}
    <div class="flex flex-col items-center gap-2">
      <span class="loading loading-spinner loading-lg"></span>
      <p>Uploading...</p>
    </div>
  {:else}
    <svg
      xmlns="http://www.w3.org/2000/svg"
      class="mx-auto h-12 w-12 text-gray-400"
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor">
      <path
        stroke-linecap="round"
        stroke-linejoin="round"
        stroke-width="2"
        d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
    </svg>
    <p class="mt-2 text-sm text-gray-600">
      Drag and drop PDF or TXT files here, or
      <label class="cursor-pointer text-primary hover:underline">
        browse
        <input type="file" class="hidden" accept=".pdf,.txt" multiple on:change={handleFileInput} />
      </label>
    </p>
    <p class="mt-1 text-xs text-gray-500">Supports PDF and TXT files</p>
  {/if}

  {#if uploadError}
    <div class="alert alert-error mt-4">
      <span>{uploadError}</span>
    </div>
  {/if}
</div>
