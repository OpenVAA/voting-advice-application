/**
 * POST /api/file-processing/upload
 * Upload a document (PDF or TXT) to begin processing
 */

import { json } from '@sveltejs/kit';
import { randomUUID } from 'crypto';
import { documentStore } from '$lib/server/fileProcessingStore';
import type { ProcessingDocument, UploadResponse } from '$lib/api/file-processing/types';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export async function POST({ request }: { request: Request }) {
  try {
    const formData = await request.formData();
    const file = formData.get('file') as File;

    if (!file) {
      return json({ error: 'No file provided' }, { status: 400 });
    }

    // Validate file type
    const fileType = file.name.endsWith('.pdf') ? 'pdf' : file.name.endsWith('.txt') ? 'txt' : null;

    if (!fileType) {
      return json({ error: 'Only PDF and TXT files are supported' }, { status: 400 });
    }

    // Convert file to buffer
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    // Create document record
    const documentId = randomUUID();
    const document: ProcessingDocument = {
      id: documentId,
      filename: file.name,
      fileType,
      state: 'UPLOADED',
      metadata: {
        documentType: 'unofficial' // Default, will be set in metadata form
      },
      createdAt: new Date(),
      updatedAt: new Date()
    };

    // Store document and file buffer
    documentStore.add(document, buffer);

    const response: UploadResponse = {
      documentId,
      filename: file.name,
      fileType,
      size: buffer.length
    };

    return json(response);
  } catch (error) {
    console.error('Upload error:', error);
    return json({ error: 'Failed to upload file' }, { status: 500 });
  }
}
