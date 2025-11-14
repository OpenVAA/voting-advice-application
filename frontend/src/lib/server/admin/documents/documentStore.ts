/**
 * In-memory document store for tracking uploaded files in the file processing feature.
 * Documents are stored in memory and will be lost on server restart.
 * This is a simple implementation that can be replaced with persistent storage later.
 */

import type { UploadedDocument } from './documentStore.type';

// Global in-memory document store
const documents = new Map<string, UploadedDocument>();

/**
 * Add a new document to the store
 * @param document - The document to add
 * @returns The added document
 */
export function addDocument(document: UploadedDocument): UploadedDocument {
  documents.set(document.id, document);
  return document;
}

/**
 * Get a specific document by ID
 * @param id - The document ID to retrieve
 * @returns The document or undefined if not found
 */
export function getDocument(id: string): UploadedDocument | undefined {
  return documents.get(id);
}

/**
 * Get all documents
 * @returns Array of all uploaded documents, sorted by upload date (newest first)
 */
export function getAllDocuments(): Array<UploadedDocument> {
  return Array.from(documents.values()).sort((a, b) => b.uploadedAt.getTime() - a.uploadedAt.getTime());
}

/**
 * Remove one or more documents from the store
 * @param ids - Array of document IDs to remove
 * @returns Number of documents removed
 */
export function removeDocuments(ids: Array<string>): number {
  let removed = 0;
  for (const id of ids) {
    if (documents.delete(id)) {
      removed++;
    }
  }
  return removed;
}

/**
 * Remove all documents from the store
 * Useful for testing or reset functionality
 */
export function clearAll(): void {
  documents.clear();
}

/**
 * Get the total number of documents in the store
 * @returns Count of documents
 */
export function getDocumentCount(): number {
  return documents.size;
}
