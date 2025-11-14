/**
 * API endpoints for document management in file processing feature.
 * Provides backend-agnostic access to the document store.
 */

import { json } from '@sveltejs/kit';
import { getUserData } from '$lib/auth';
import { addDocument, getAllDocuments, removeDocuments } from '$lib/server/admin/documents/documentStore';
import type { UploadedDocument } from '$lib/server/admin/documents/documentStore.type';
import type { RequestHandler } from './$types';

////////////////////////////////////////////////////////////////////////
// Constants
////////////////////////////////////////////////////////////////////////

const MAX_FILE_SIZE = 50 * 1024 * 1024; // 50MB in bytes
const ALLOWED_MIME_TYPES = ['application/pdf', 'text/plain'];

////////////////////////////////////////////////////////////////////////
// GET - Retrieve all documents
////////////////////////////////////////////////////////////////////////

export const GET: RequestHandler = async ({ cookies, fetch }) => {
  // Check admin authorization
  const userData = await getUserData({ fetch, cookies });
  if (userData?.role !== 'admin') {
    return json({ error: 'Forbidden' }, { status: 403 });
  }

  try {
    const documents = getAllDocuments();
    return json(documents);
  } catch (error) {
    console.error('Error getting documents:', error);
    return json({ error: 'Failed to get documents' }, { status: 500 });
  }
};

////////////////////////////////////////////////////////////////////////
// POST - Upload a new document
////////////////////////////////////////////////////////////////////////

export const POST: RequestHandler = async ({ request, cookies, fetch }) => {
  // Check admin authorization
  const userData = await getUserData({ fetch, cookies });
  if (userData?.role !== 'admin') {
    return json({ error: 'Forbidden' }, { status: 403 });
  }

  try {
    const formData = await request.formData();
    const file = formData.get('file') as File | null;

    // Validation: check if file exists
    if (!file || !(file instanceof File)) {
      return json({ error: 'No file provided' }, { status: 400 });
    }

    // Validation: check file type
    if (!ALLOWED_MIME_TYPES.includes(file.type)) {
      return json({ error: 'Only PDF and TXT files are allowed' }, { status: 400 });
    }

    // Validation: check file size
    if (file.size > MAX_FILE_SIZE) {
      return json({ error: `File size must be less than ${MAX_FILE_SIZE / 1024 / 1024}MB` }, { status: 400 });
    }

    // Validation: check filename
    if (!file.name || file.name.trim() === '') {
      return json({ error: 'Invalid filename' }, { status: 400 });
    }

    // Read file into buffer
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    // Determine file type
    const fileType = file.type === 'application/pdf' ? 'pdf' : 'txt';

    // Create document object
    const document: UploadedDocument = {
      id: crypto.randomUUID(),
      filename: file.name,
      fileType,
      size: file.size,
      uploadedAt: new Date(),
      buffer
    };

    // Add to store
    addDocument(document);

    return json({
      success: true,
      document: {
        id: document.id,
        filename: document.filename,
        fileType: document.fileType,
        size: document.size,
        uploadedAt: document.uploadedAt
      }
    });
  } catch (error) {
    console.error('Error uploading document:', error);
    return json({ error: 'Failed to upload document' }, { status: 500 });
  }
};

////////////////////////////////////////////////////////////////////////
// DELETE - Remove documents by IDs
////////////////////////////////////////////////////////////////////////

export const DELETE: RequestHandler = async ({ request, cookies, fetch }) => {
  // Check admin authorization
  const userData = await getUserData({ fetch, cookies });
  if (userData?.role !== 'admin') {
    return json({ error: 'Forbidden' }, { status: 403 });
  }

  try {
    const { documentIds } = await request.json();

    if (!Array.isArray(documentIds) || documentIds.length === 0) {
      return json({ error: 'No document IDs provided' }, { status: 400 });
    }

    const removed = removeDocuments(documentIds);

    return json({
      success: true,
      removed
    });
  } catch (error) {
    console.error('Error deleting documents:', error);
    return json({ error: 'Failed to delete documents' }, { status: 500 });
  }
};
