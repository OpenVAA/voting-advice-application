<!--@component
# Document Selector

Displays a list of uploaded documents with selection options.
Follows the pattern used in argument-condensation for question selection.

## Props
- `documents` - Array of uploaded documents to display
- `selectedIds` - Bind to this to get/set selected document IDs
- `disabled` - Disable the selector (e.g., during processing)

## Usage
```svelte
<DocumentSelector
  {documents}
  bind:selectedIds
  disabled={isProcessing}
/>
```
-->

<script lang="ts">
  import { getUUID } from '$lib/utils/components';
  import type { DocumentInfo } from '$lib/api/base/dataWriter.type';

  ////////////////////////////////////////////////////////////////////////
  // Props
  ////////////////////////////////////////////////////////////////////////

  export let documents: Array<DocumentInfo> = [];
  export let selectedIds: Array<string> = [];
  export let disabled = false;

  ////////////////////////////////////////////////////////////////////////
  // State
  ////////////////////////////////////////////////////////////////////////

  let selectedOption: 'all' | 'selected' = 'all';
  const radioGroupName = getUUID();

  ////////////////////////////////////////////////////////////////////////
  // Reactive statements
  ////////////////////////////////////////////////////////////////////////

  $: allSelected = selectedIds.length === documents.length && documents.length > 0;

  // Reset selection when switching to "all"
  $: if (selectedOption === 'all') {
    selectedIds = [];
  }

  ////////////////////////////////////////////////////////////////////////
  // Helper functions
  ////////////////////////////////////////////////////////////////////////

  function formatFileSize(bytes: number): string {
    if (bytes < 1024) {
      return `${bytes} B`;
    } else if (bytes < 1024 * 1024) {
      return `${(bytes / 1024).toFixed(1)} KB`;
    } else {
      return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
    }
  }

  function formatDate(date: Date | string): string {
    const dateObj = typeof date === 'string' ? new Date(date) : date;
    return new Intl.DateTimeFormat('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    }).format(dateObj);
  }

  function toggleSelectAll() {
    if (allSelected) {
      selectedIds = [];
    } else {
      selectedIds = documents.map((doc) => doc.id);
    }
  }

  ////////////////////////////////////////////////////////////////////////
  // Derived values for parent form
  ////////////////////////////////////////////////////////////////////////

  // Export whether "all" is selected for parent form to know
  export let isAllSelected = false;
  $: isAllSelected = selectedOption === 'all';
</script>

{#if documents.length > 0}
  <div class="w-full space-y-4">
    <!-- Selection mode radio buttons -->
    <fieldset class="w-full">
      <legend class="sr-only">Document selection mode</legend>
      <div class="flex flex-col gap-md">
        <label class="label cursor-pointer justify-start gap-sm !p-0">
          <input
            type="radio"
            class="radio-primary radio"
            name={radioGroupName}
            value="all"
            bind:group={selectedOption}
            {disabled} />
          <span class="label-text">All documents</span>
        </label>

        <label class="label cursor-pointer justify-start gap-sm !p-0">
          <input
            type="radio"
            class="radio-primary radio"
            name={radioGroupName}
            value="selected"
            bind:group={selectedOption}
            {disabled} />
          <span class="label-text">Selected documents</span>
        </label>
      </div>
    </fieldset>

    <!-- Document list (shown when "selected" is chosen) -->
    {#if selectedOption === 'selected'}
      <div class="max-h-96 w-full space-y-0 overflow-y-auto rounded-lg border border-base-300">
        <!-- Select all checkbox -->
        <label class="flex items-center space-x-10 border-b border-base-200 p-4">
          <input
            type="checkbox"
            class="checkbox-primary checkbox"
            checked={allSelected}
            on:change={toggleSelectAll}
            {disabled} />
          <span class="font-semibold label-text">
            {allSelected ? 'Deselect all' : 'Select all'}
            ({documents.length} document{documents.length !== 1 ? 's' : ''})
          </span>
        </label>

        <!-- Individual document checkboxes -->
        {#each documents as document}
          <label class="flex items-start space-x-10 border-b border-base-200 p-4 last:border-0">
            <input
              type="checkbox"
              name="documentIds"
              class="mt-1 checkbox-primary checkbox"
              value={document.id}
              bind:group={selectedIds}
              {disabled} />

            <div class="space-y-1 flex flex-1 flex-col">
              <div class="flex items-center gap-2">
                <span class="font-medium label-text">{document.filename}</span>
                <span
                  class="badge badge-sm"
                  class:badge-primary={document.fileType === 'pdf'}
                  class:badge-secondary={document.fileType === 'txt'}>
                  {document.fileType.toUpperCase()}
                </span>
              </div>
              <div class="flex items-center gap-4 text-xs text-neutral">
                <span>{formatFileSize(document.size)}</span>
                <span>•</span>
                <span>{formatDate(document.uploadedAt)}</span>
              </div>
            </div>
          </label>
        {/each}
      </div>
    {:else}
      <!-- Preview when "all" is selected -->
      <div class="rounded-lg bg-base-200 p-4">
        <p class="text-sm text-neutral">
          All {documents.length} document{documents.length !== 1 ? 's' : ''} will be processed
        </p>
      </div>
    {/if}
  </div>
{:else}
  <div class="rounded-lg bg-base-200 p-8 text-center">
    <p class="text-neutral">No documents uploaded yet</p>
    <p class="mt-2 text-sm text-neutral">Upload a document to get started</p>
  </div>
{/if}
