import type { SourceExcerpt } from '../types';
import type { Segmenter } from './segmenter.type';

/**
 * Options for character-based segmentation
 */
export interface CharacterSegmenterOptions {
  /** Maximum length of each segment in characters */
  maxLength: number;
  /** Number of characters to overlap between segments (for context preservation) */
  overlap?: number;
}

/**
 * Simple segmenter that splits documents by character length with optional overlap
 */
export class CharacterSegmenter implements Segmenter {
  private options: CharacterSegmenterOptions;

  constructor(options: CharacterSegmenterOptions) {
    this.options = options;
  }

  segment(document: string): Array<SourceExcerpt> {
    const { maxLength, overlap = 0 } = this.options;
    const segments: Array<SourceExcerpt> = [];
    const content = document;

    if (content.length <= maxLength) {
      // Document is small enough, return as single segment
      return [
        {
          id: `${document}_seg_0`,
          parentId: document,
          content: content,
          metadata: {}
        }
      ];
    }

    let start = 0;
    let segmentIndex = 0;

    while (start < content.length) {
      const end = Math.min(start + maxLength, content.length);
      const segmentContent = content.slice(start, end);

      segments.push({
        id: `${document}_seg_${segmentIndex}`,
        parentId: document,
        content: segmentContent,
        metadata: {}
      });

      // If we've reached the end of the document, we're done.
      if (end === content.length) {
        break;
      }

      // Move start position, accounting for overlap
      const nextStart = end - overlap;

      // Ensure that we are always making progress to avoid infinite loops.
      if (nextStart > start) {
        start = nextStart;
      } else {
        // If overlap is too large, we would get stuck.
        // Advance start to the end of the current segment to make progress.
        start = end;
      }
      segmentIndex++;
    }

    return segments;
  }

  segmentBatch(documents: Array<string>): Array<SourceExcerpt> {
    return documents.flatMap((doc) => this.segment(doc));
  }
}
