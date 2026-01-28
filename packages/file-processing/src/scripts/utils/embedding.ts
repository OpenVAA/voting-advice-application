import * as fs from 'fs';
import * as path from 'path';

/**
 * Recursively find all JSON files in a directory and its subdirectories
 */
export function findJsonFiles(dir: string): Array<{ fullPath: string; relativePath: string }> {
  const results: Array<{ fullPath: string; relativePath: string }> = [];

  if (!fs.existsSync(dir)) {
    return results;
  }

  function searchDirectory(currentDir: string, relPath = '') {
    const entries = fs.readdirSync(currentDir, { withFileTypes: true });

    for (const entry of entries) {
      const fullPath = path.join(currentDir, entry.name);
      const newRelPath = relPath ? path.join(relPath, entry.name) : entry.name;

      if (entry.isDirectory()) {
        searchDirectory(fullPath, newRelPath);
      } else if (entry.isFile() && entry.name.toLowerCase().endsWith('.json')) {
        results.push({ fullPath, relativePath: newRelPath });
      }
    }
  }

  searchDirectory(dir);
  return results;
}
