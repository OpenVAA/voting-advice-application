#!/usr/bin/env tsx
/**
 * Validate and fix internal links in markdown files
 *
 * This script:
 * 1. Finds all markdown files in docs/src/routes
 * 2. Extracts all internal links (not starting with https?://)
 * 3. Validates that the links point to existing files/routes
 * 4. Fixes relative links by making them absolute
 * 5. Reports broken links that couldn't be fixed
 */
import * as fs from 'fs/promises';
import * as path from 'path';
import { fileURLToPath } from 'url';
import {
  type BrokenLink,
  checkLinkExists,
  extractMarkdownLinks,
  isHashLink,
  isInternalLink,
  makeAbsoluteLink,
  replaceLink,
  resolveLink
} from './utils/links';
import { findMarkdownFiles } from './utils/routes';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const ROUTES_DIR = path.join(__dirname, '../src/routes');

interface ValidationResult {
  totalFiles: number;
  totalLinks: number;
  fixedLinks: number;
  brokenLinks: Array<BrokenLink>;
}

/**
 * Main function
 */
async function main() {
  console.info('Validating internal links in markdown files...\n');

  const mdFiles = await findMarkdownFiles(ROUTES_DIR);
  console.info(`Found ${mdFiles.length} markdown files\n`);

  const result: ValidationResult = {
    totalFiles: mdFiles.length,
    totalLinks: 0,
    fixedLinks: 0,
    brokenLinks: []
  };

  for (const filePath of mdFiles) {
    await validateFile(filePath, result);
  }

  printSummary(result);

  if (result.brokenLinks.length > 0) {
    process.exit(1);
  }
}

/**
 * Validate and fix links in a single file
 */
async function validateFile(filePath: string, result: ValidationResult): Promise<void> {
  const content = await fs.readFile(filePath, 'utf-8');
  const links = extractMarkdownLinks(content);

  // Filter to only internal links (not external URLs)
  const internalLinks = links.filter((link) => isInternalLink(link.url));

  if (internalLinks.length === 0) {
    return;
  }

  result.totalLinks += internalLinks.length;

  let modifiedContent = content;
  let hasChanges = false;
  const fileRelPath = path.relative(ROUTES_DIR, filePath);

  for (const link of internalLinks) {
    // Skip hash-only links
    if (isHashLink(link.url)) {
      continue;
    }

    // Resolve the link to an absolute path
    const resolvedPath = resolveLink(link.url, filePath, ROUTES_DIR);

    if (!resolvedPath) {
      // Just a hash link, skip
      continue;
    }

    // Check if the link exists
    const exists = await checkLinkExists(resolvedPath);

    if (!exists) {
      // Link is broken
      result.brokenLinks.push({
        file: fileRelPath,
        link,
        reason: `Target not found: ${resolvedPath}`
      });
      continue;
    }

    // If the link is relative, convert to absolute
    if (!link.url.startsWith('/')) {
      const absoluteUrl = makeAbsoluteLink(link.url, filePath, ROUTES_DIR);

      if (absoluteUrl !== link.url) {
        // Replace the link in content
        modifiedContent = replaceLink(modifiedContent, link, absoluteUrl);
        hasChanges = true;
        result.fixedLinks++;
      }
    }
  }

  // Write back the file if there were changes
  if (hasChanges) {
    await fs.writeFile(filePath, modifiedContent, 'utf-8');
    console.info(`✓ Fixed links in: ${fileRelPath}`);
  }
}

/**
 * Print validation summary
 */
function printSummary(result: ValidationResult): void {
  console.info('\n' + '='.repeat(60));
  console.info('VALIDATION SUMMARY');
  console.info('='.repeat(60));
  console.info(`Files scanned:     ${result.totalFiles}`);
  console.info(`Internal links:    ${result.totalLinks}`);
  console.info(`Fixed links:       ${result.fixedLinks}`);
  console.info(`Broken links:      ${result.brokenLinks.length}`);
  console.info('='.repeat(60));

  if (result.brokenLinks.length > 0) {
    console.info('\nBROKEN LINKS:\n');

    // Group by file
    const byFile = new Map<string, Array<BrokenLink>>();
    for (const broken of result.brokenLinks) {
      if (!byFile.has(broken.file)) {
        byFile.set(broken.file, []);
      }
      byFile.get(broken.file)!.push(broken);
    }

    for (const [file, links] of byFile) {
      console.info(`\n${file}:`);
      const filePath = path.join(ROUTES_DIR, file);
      for (const broken of links) {
        console.info(`  ${filePath}:${broken.link.line}`);
        console.info(`    [${broken.link.text}](${broken.link.url})`);
        console.info(`    → ${broken.reason}`);
      }
    }

    console.info('\n');
  }
}

main().catch((error) => {
  console.error('Error validating links:', error);
  process.exit(1);
});
