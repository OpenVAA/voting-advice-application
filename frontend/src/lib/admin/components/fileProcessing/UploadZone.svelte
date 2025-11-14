<!--@component
# Upload Zone

A clean file upload component with drag-and-drop support.
Validates file type (PDF/TXT) and size (<50MB) before upload.
Uses AdminContext DataWriter for backend-agnostic uploads.

## Props
- `disabled` - Disable the upload zone
- `onSuccess` - Optional callback function called after successful upload

## Usage
```svelte
<UploadZone on:success={() => invalidate('app:documents')} />
```
-->

<script lang="ts">
  import { invalidate } from '$app/navigation';
  import { Button } from '$lib/components/button';
  import { getAdminContext } from '$lib/contexts/admin';

  ////////////////////////////////////////////////////////////////////////
  // Context
  ////////////////////////////////////////////////////////////////////////

  const { uploadDocument } = getAdminContext();

  ////////////////////////////////////////////////////////////////////////
  // Props
  ////////////////////////////////////////////////////////////////////////

  export let disabled = false;
  export let onSuccess: (() => void) | undefined = undefined;

  ////////////////////////////////////////////////////////////////////////
  // Constants
  ////////////////////////////////////////////////////////////////////////

  const MAX_FILE_SIZE = 50 * 1024 * 1024; // 50MB in bytes
  const ALLOWED_TYPES = ['application/pdf', 'text/plain'];
  const ALLOWED_EXTENSIONS = ['.pdf', '.txt'];

  ////////////////////////////////////////////////////////////////////////
  // State
  ////////////////////////////////////////////////////////////////////////

  let fileInput: HTMLInputElement;
  let isDragging = false;
  let isUploading = false;
  let errorMessage = '';
  let successMessage = '';

  ////////////////////////////////////////////////////////////////////////
  // File validation
  ////////////////////////////////////////////////////////////////////////

  function validateFile(file: File): { valid: boolean; error?: string } {
    if (!ALLOWED_TYPES.includes(file.type)) {
      return { valid: false, error: 'Only PDF and TXT files are allowed' };
    }

    if (file.size > MAX_FILE_SIZE) {
      return {
        valid: false,
        error: `File size must be less than ${MAX_FILE_SIZE / 1024 / 1024}MB`
      };
    }

    return { valid: true };
  }

  ////////////////////////////////////////////////////////////////////////
  // Upload handler
  ////////////////////////////////////////////////////////////////////////

  async function handleUpload(file: File) {
    const validation = validateFile(file);
    if (!validation.valid) {
      errorMessage = validation.error || 'Invalid file';
      successMessage = '';
      return;
    }

    isUploading = true;
    errorMessage = '';
    successMessage = '';

    try {
      await uploadDocument({ file });

      successMessage = 'File uploaded successfully';
      errorMessage = '';
      fileInput.value = ''; // Clear the input

      // Invalidate documents data to refresh the list
      await invalidate('app:documents');

      // Call optional success callback
      if (onSuccess) {
        onSuccess();
      }

      // Clear success message after 7 seconds
      setTimeout(() => {
        successMessage = '';
      }, 7000);
    } catch (error) {
      console.error('Upload error:', error);
      errorMessage = 'Failed to upload file. Please try again.';
      successMessage = '';
    } finally {
      isUploading = false;
    }
  }

  ////////////////////////////////////////////////////////////////////////
  // Event handlers
  ////////////////////////////////////////////////////////////////////////

  function handleSelectClick() {
    fileInput.click();
  }

  function handleFileInput(event: Event) {
    const target = event.target as HTMLInputElement;
    const file = target.files?.[0];

    if (file) {
      handleUpload(file);
    }
  }

  function handleDragEnter(event: DragEvent) {
    event.preventDefault();
    isDragging = true;
  }

  function handleDragOver(event: DragEvent) {
    event.preventDefault();
    isDragging = true;
  }

  function handleDragLeave(event: DragEvent) {
    event.preventDefault();
    isDragging = false;
  }

  function handleDrop(event: DragEvent) {
    event.preventDefault();
    isDragging = false;

    const file = event.dataTransfer?.files[0];
    if (file) {
      handleUpload(file);
    }
  }
</script>

<div class="w-full">
  <div
    class="border-2 relative flex flex-col items-center justify-center rounded-lg border-dashed border-base-content/20 bg-base-300 p-8 transition-colors"
    class:border-primary={isDragging}
    class:bg-primary={isDragging}
    class:bg-opacity-5={isDragging}
    on:dragenter={handleDragEnter}
    on:dragover={handleDragOver}
    on:dragleave={handleDragLeave}
    on:drop={handleDrop}
    role="button"
    tabindex="0">
    <input
      type="file"
      bind:this={fileInput}
      accept={ALLOWED_EXTENSIONS.join(',')}
      on:change={handleFileInput}
      disabled={disabled || isUploading}
      class="hidden" />

    <Button
      type="button"
      text="Select"
      variant="main"
      on:click={handleSelectClick}
      disabled={disabled || isUploading}
      loading={isUploading}
      class="mb-2" />

    <p class="text-sm text-neutral">or drag and drop</p>
    <p class="mt-2 text-xs text-neutral">PDF or TXT files, max 50MB</p>
  </div>

  {#if errorMessage}
    <div class="alert alert-error mt-4">
      <span>{errorMessage}</span>
    </div>
  {/if}

  {#if successMessage}
    <div class="alert alert-success mt-4">
      <span>{successMessage}</span>
    </div>
  {/if}
</div>
