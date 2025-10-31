<!--
@component
File viewer component for displaying original uploaded documents

Displays PDF and TXT files using browser-native rendering via iframe.
Uses the file serving API endpoint to fetch file buffers.

Props:
- documentId: ID of the document to display
- fileType: 'pdf' or 'txt'
- filename: Original filename (for display/accessibility)
-->

<script lang="ts">
  export let documentId: string;
  export let fileType: 'pdf' | 'txt';
  export let filename: string;

  $: fileUrl = `/api/file-processing/file/${documentId}`;
</script>

<div class="h-full w-full overflow-hidden rounded-lg border bg-white">
  <div class="bg-gray-100 border-b px-4 py-2">
    <h4 class="font-semibold text-sm">Original File: {filename}</h4>
  </div>
  <div class="h-[calc(100%-3rem)] w-full">
    <iframe
      src={fileUrl}
      title="Document preview: {filename}"
      class="h-full w-full border-0"
    ></iframe>
  </div>
</div>
