import * as fs from 'fs';
import * as path from 'path';
import type { SourceSegment } from '@openvaa/vector-store/types';

/**
 * Find all document files (.pdf and .txt) recursively in subdirectories
 */
export function findDocuments(
  dir: string,
  relativePath = ''
): Array<{ path: string; subdirectory: string; filename: string; fileType: 'pdf' | 'txt' }> {
  const results: Array<{ path: string; subdirectory: string; filename: string; fileType: 'pdf' | 'txt' }> = [];

  if (!fs.existsSync(dir)) {
    console.warn(`Directory not found: ${dir}`);
    return results;
  }

  const entries = fs.readdirSync(dir, { withFileTypes: true });

  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);
    const newRelativePath = relativePath ? path.join(relativePath, entry.name) : entry.name;

    if (entry.isDirectory()) {
      // Recursively search subdirectories
      results.push(...findDocuments(fullPath, newRelativePath));
    } else if (entry.isFile()) {
      const lowerName = entry.name.toLowerCase();
      let fileType: 'pdf' | 'txt' | null = null;

      if (lowerName.endsWith('.pdf')) {
        fileType = 'pdf';
      } else if (lowerName.endsWith('.txt')) {
        fileType = 'txt';
      }

      if (fileType) {
        results.push({
          path: fullPath,
          subdirectory: relativePath || 'root',
          filename: entry.name,
          fileType
        });
      }
    }
  }

  return results;
}

/**
 * Save segments to a readable text file with double line separations
 */
export function saveSegmentsToFile(segments: Array<SourceSegment>, outputPath: string): void {
  const content = segments
    .map((seg) => {
      const header = `=== SEGMENT ${seg.segmentIndex + 1} ===`;
      const summarySection = seg.summary ? `\n[Summary: ${seg.summary}]\n` : '';
      return `${header}${summarySection}\n${seg.content}`;
    })
    .join('\n\n\n'); // Two line separations between segments

  fs.writeFileSync(outputPath, content, 'utf-8');
  console.info(`  ✓ Saved readable segments to: ${outputPath}`);
}
