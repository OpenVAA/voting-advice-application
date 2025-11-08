/**
 * Type definitions for the document store.
 * Used for tracking uploaded documents in the file processing feature.
 */

/**
 * A document that has been uploaded by an admin user.
 * Documents are stored in-memory and will be lost on server restart.
 */
export interface UploadedDocument {
  /** Unique identifier (UUID) */
  id: string;
  /** Original filename */
  filename: string;
  /** File type (validated on upload) */
  fileType: 'pdf' | 'txt';
  /** File size in bytes */
  size: number;
  /** Timestamp when the document was uploaded */
  uploadedAt: Date;
  /** File contents stored in memory */
  buffer: Buffer;
}
