/**
 * Types for the human-in-the-loop document pre-processing pipeline
 */

import type { TextSegmentationMetrics } from '@openvaa/file-processing';
import type { LLMPipelineMetrics } from '@openvaa/llm-refactor';

export type DocumentState =
  | 'UPLOADED'
  | 'QUEUED_FOR_EXTRACTION'
  | 'EXTRACTED'
  | 'EXTRACTION_APPROVED'
  | 'METADATA_INSERTION'
  | 'METADATA_APPROVED'
  | 'SEGMENTED'
  | 'SEGMENTATION_APPROVED'
  | 'COMPLETED'
  | 'FAILED';

export interface DocumentMetadata {
  title?: string;
  authors?: Array<string>;
  source?: string;
  publishedDate?: string;
  documentType: 'official' | 'unofficial';
  locale?: string;
}

export interface ProcessingDocument {
  id: string; // UUID
  filename: string;
  fileType: 'pdf' | 'txt';
  state: DocumentState;

  // Metadata (extracted and user-edited)
  extractedMetadata?: DocumentMetadata; // Auto-extracted metadata
  metadata?: DocumentMetadata; // Final user-approved metadata

  // Processing results
  extractedText?: string;
  segments?: Array<string>;

  // Metrics
  metrics?: {
    extraction?: LLMPipelineMetrics;
    metadataExtraction?: LLMPipelineMetrics;
    segmentation?: TextSegmentationMetrics;
  };

  // Failure tracking
  failureReason?: string;
  failureStage?: string;

  // Timestamps
  createdAt: Date;
  updatedAt: Date;
}

export interface ProcessingQueue {
  documents: Array<ProcessingDocument>;
  failedDocuments: Array<ProcessingDocument>;
}

// API request/response types

export interface UploadResponse {
  documentId: string;
  filename: string;
  fileType: 'pdf' | 'txt';
  size: number;
}

export interface MetadataRequest {
  documentId: string;
  metadata: DocumentMetadata;
}

export interface ExtractRequest {
  documentId: string;
}

export interface ExtractResponse {
  documentId: string;
  extractedText: string;
  extractedMetadata: DocumentMetadata;
  metrics: {
    extraction: LLMPipelineMetrics;
    metadataExtraction: LLMPipelineMetrics;
  };
  state: DocumentState;
}

export interface ApproveExtractionRequest {
  documentId: string;
  editedText?: string;
}

export interface SegmentRequest {
  documentId: string;
  options?: {
    minSegmentLength?: number;
    maxSegmentLength?: number;
  };
}

export interface SegmentResponse {
  documentId: string;
  segments: Array<string>;
  metrics: TextSegmentationMetrics;
  state: DocumentState;
}

export interface ApproveSegmentationRequest {
  documentId: string;
  editedSegments?: Array<string>;
}

export interface FailRequest {
  documentId: string;
  reason: string;
  stage: string;
}

export interface QueueDocumentsRequest {
  documentIds: Array<string>; // Can be single or multiple
}

export interface QueueDocumentsResponse {
  queuedDocuments: Array<ProcessingDocument>;
}

export interface DequeueDocumentsRequest {
  documentIds: Array<string>; // Can be single or multiple
}

export interface DequeueDocumentsResponse {
  dequeuedDocuments: Array<ProcessingDocument>;
}

export interface BatchExtractRequest {
  batchSize?: number; // Defaults to 2
}

export interface BatchExtractResponse {
  processed: number;
  total: number;
  documents: Array<ProcessingDocument>;
}

export interface ApproveMetadataRequest {
  documentId: string;
  metadata: DocumentMetadata;
}

export interface QueueResponse {
  documents: Array<ProcessingDocument>;
  failedDocuments: Array<ProcessingDocument>;
}
