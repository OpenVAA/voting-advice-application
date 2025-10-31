/**
 * GET /api/file-processing/file/:id
 * Serve the original uploaded file (PDF or TXT) for viewing in browser
 */

import { documentStore } from '$lib/server/fileProcessingStore';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export async function GET({ params }: { params: any }) {
  try {
    const { id } = params;

    const document = documentStore.get(id);
    const buffer = documentStore.getFileBuffer(id);

    if (!document || !buffer) {
      return new Response('Document not found', { status: 404 });
    }

    // Set appropriate content type based on file type
    const contentType = document.fileType === 'pdf' ? 'application/pdf' : 'text/plain; charset=utf-8';

    return new Response(buffer, {
      headers: {
        'Content-Type': contentType,
        'Content-Disposition': `inline; filename="${document.filename}"`,
        'Cache-Control': 'private, max-age=3600'
      }
    });
  } catch (error) {
    console.error('File serving error:', error);
    return new Response('Failed to serve file', { status: 500 });
  }
}
