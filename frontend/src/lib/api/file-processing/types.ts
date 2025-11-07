/**
 * Types for the human-in-the-loop document pre-processing pipeline
 */

import type { TextSegmentationMetrics } from '@openvaa/file-processing';
import type { LLMPipelineMetrics } from '@openvaa/llm-refactor';

export type DocumentState =
  | 'REQUIRES_TEXT_EXTRACTION'
  | 'EXTRACTING'
  | 'AWAITING_TEXT_APPROVAL'
  | 'REQUIRES_SEGMENTATION'
  | 'SEGMENTING'
  | 'AWAITING_SEGMENTATION_APPROVAL'
  | 'REQUIRES_METADATA_EXTRACTION'
  | 'EXTRACTING_METADATA'
  | 'AWAITING_METADATA_APPROVAL'
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

  // Processing options (auto-trigger flags)
  processingOptions?: {
    auto_extract_text: boolean; // Auto-extract PDF text, skip AWAITING_TEXT_APPROVAL
    auto_segment_text: boolean; // Auto-segment, skip AWAITING_SEGMENTATION_APPROVAL
  };

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
  processingOptions?: {
    auto_extract_text?: boolean;
    auto_segment_text?: boolean;
  };
}

export interface ExtractResponse {
  documentId: string;
  extractedText: string;
  metrics: {
    extraction: LLMPipelineMetrics;
  };
  state: DocumentState;
}

export interface ApproveExtractionRequest {
  documentId: string;
  editedText?: string;
  processingOptions?: {
    auto_segment_text?: boolean;
  };
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

export interface ExtractMetadataRequest {
  documentId: string;
}

export interface ExtractMetadataResponse {
  documentId: string;
  extractedMetadata: DocumentMetadata;
  metrics: LLMPipelineMetrics;
  state: DocumentState;
}

export interface ReReviewRequest {
  documentId: string;
}
