// PDF Processing
export { convertPdfToMarkdown } from './pdfProcessor';
export type { PdfProcessorOptions, PdfProcessorResult } from './pdfProcessor.type';

// Text Segmentation
export { segmentText } from './textSegmentation';
export type { SegmentationOptions, SegmentationResult } from './textSegmentation.type';

// Document Analysis
export { analyzeDocument } from './documentAnalysis';
export type {
  TextAnalysisOptions as DocumentAnalysisOptions,
  TextAnalysisResult as DocumentAnalysisResult,
  SegmentWithAnalysis,
  SourceMetadata
} from './documentAnalysis.type';
