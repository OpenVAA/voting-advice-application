/**
 * In-memory document store for file processing pipeline
 * This is a server-side only module that maintains processing state
 */

import type { ProcessingDocument } from '$lib/api/file-processing/types';

// In-memory storage (resets on server restart)
const documentsMap = new Map<string, ProcessingDocument>();
const fileBuffers = new Map<string, Buffer>();

export const documentStore = {
  /**
   * Add a new document to the store
   */
  add(document: ProcessingDocument, fileBuffer: Buffer): void {
    documentsMap.set(document.id, document);
    fileBuffers.set(document.id, fileBuffer);
  },

  /**
   * Get a document by ID
   */
  get(id: string): ProcessingDocument | undefined {
    return documentsMap.get(id);
  },

  /**
   * Get file buffer for a document
   */
  getFileBuffer(id: string): Buffer | undefined {
    return fileBuffers.get(id);
  },

  /**
   * Update a document
   */
  update(id: string, updates: Partial<ProcessingDocument>): ProcessingDocument | null {
    const doc = documentsMap.get(id);
    if (!doc) return null;

    const updated = {
      ...doc,
      ...updates,
      updatedAt: new Date()
    };
    documentsMap.set(id, updated);
    return updated;
  },

  /**
   * Get all documents in the queue (excluding failed)
   */
  getQueue(): Array<ProcessingDocument> {
    return Array.from(documentsMap.values()).filter((doc) => doc.state !== 'FAILED');
  },

  /**
   * Get all failed documents
   */
  getFailedQueue(): Array<ProcessingDocument> {
    return Array.from(documentsMap.values()).filter((doc) => doc.state === 'FAILED');
  },

  /**
   * Remove a document from the store
   */
  remove(id: string): boolean {
    fileBuffers.delete(id);
    return documentsMap.delete(id);
  },

  /**
   * Clear all documents (for testing)
   */
  clear(): void {
    documentsMap.clear();
    fileBuffers.clear();
  },

  /**
   * Get total document count
   */
  count(): number {
    return documentsMap.size;
  }
};
