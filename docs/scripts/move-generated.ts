#!/usr/bin/env tsx
/**
 * Move generated documentation into the docs site and transform for SvelteKit routing
 */
import { existsSync } from 'fs';
import { mkdir, readdir, readFile, rm, writeFile } from 'fs/promises';
import { join } from 'path';
import { COPY_TARGETS, GENERATED_DIR } from './docs-scripts.config';

const generatedDir = GENERATED_DIR;

/**
 * Transform markdown content to fix links for SvelteKit routing
 * - Convert README.md links to directory links
 * - Remove .md extensions from all internal links (SvelteKit will resolve them as directories)
 */
function transformMarkdownLinks(content: string): string {
  // Replace links to README.md with directory links
  content = content.replace(/\[([^\]]+)\]\(([^)]+)\/README\.md\)/g, '[$1]($2)');
  content = content.replace(/\[([^\]]+)\]\(README\.md\)/g, '[$1](.)');

  // Remove .md extension from all relative links (not URLs), including those with hash fragments
  // This transforms foo/bar.md#anchor to foo/bar#anchor
  content = content.replace(/\[([^\]]+)\]\((?!https?:\/\/)([^)#]+)\.md(#[^)]+)?\)/g, '[$1]($2$3)');

  return content;
}

/**
 * Recursively move and transform markdown files
 */
async function moveAndTransformDir(srcDir: string, destDir: string, rootSrcDir: string): Promise<void> {
  await mkdir(destDir, { recursive: true });

  const entries = await readdir(srcDir, { withFileTypes: true });

  for (const entry of entries) {
    const srcPath = join(srcDir, entry.name);
    const destPath = join(destDir, entry.name);

    if (entry.isDirectory()) {
      // Recursively move directories
      await moveAndTransformDir(srcPath, destPath, rootSrcDir);
    } else if (entry.isFile()) {
      if (entry.name === 'README.md') {
        // Transform README.md to +page.md with link fixes
        const content = await readFile(srcPath, 'utf-8');
        const transformedContent = transformMarkdownLinks(content);
        const pageDestPath = join(destDir, '+page.md');
        await writeFile(pageDestPath, transformedContent, 'utf-8');
      } else if (entry.name === '+page.md') {
        // Already a +page.md file, just copy with link fixes
        const content = await readFile(srcPath, 'utf-8');
        const transformedContent = transformMarkdownLinks(content);
        await writeFile(destPath, transformedContent, 'utf-8');
      } else if (entry.name.endsWith('.md')) {
        // Transform foo.md to foo/+page.md for SvelteKit routing
        const content = await readFile(srcPath, 'utf-8');
        const transformedContent = transformMarkdownLinks(content);
        const baseName = entry.name.replace(/\.md$/, '');
        const pageDirPath = join(destDir, baseName);
        await mkdir(pageDirPath, { recursive: true });
        const pageDestPath = join(pageDirPath, '+page.md');
        await writeFile(pageDestPath, transformedContent, 'utf-8');
      } else {
        // Copy non-markdown files as-is
        const content = await readFile(srcPath);
        await writeFile(destPath, content);
      }
    }
  }
}

async function moveGenerated(): Promise<void> {
  console.info('Moving and transforming generated documentation...\n');

  if (!existsSync(generatedDir)) {
    console.warn('Warning: Generated docs not found at', generatedDir);
    console.warn('Run `yarn generate:docs` first to generate documentation.');
    return;
  }

  // Move each target folder
  for (const { src, dest } of COPY_TARGETS) {
    const srcPath = join(generatedDir, src);
    const destPath = dest;

    // We're currently not generating API docs, so skip if source doesn't exist
    if (!existsSync(srcPath) && !src.startsWith('api/')) {
      console.warn(`Warning: Source path not found: ${srcPath}`);
      continue;
    }

    console.info(`Moving ${src} → ${dest}...`);
    await moveAndTransformDir(srcPath, destPath, srcPath);

    // Remove the source directory after moving
    await rm(srcPath, { recursive: true, force: true });
    console.info(`✓ ${src} moved and transformed`);
  }

  // Clean up the generated directory if it's empty
  try {
    const remainingEntries = await readdir(generatedDir);
    if (remainingEntries.length === 0) {
      await rm(generatedDir, { recursive: true, force: true });
      console.info('✓ Cleaned up empty generated directory');
    }
  } catch {
    // Directory might not exist or already be deleted
  }

  console.info('\n✓ Generated documentation moved and transformed to docs site');
}

moveGenerated().catch((error) => {
  console.error('Error moving generated docs:', error);
  process.exit(1);
});
