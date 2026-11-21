#!/usr/bin/env tsx
/**
 * Move generated documentation into the docs site and transform for SvelteKit routing
 */
import { existsSync } from 'fs';
import { mkdir, readdir, readFile, rename, rm, writeFile } from 'fs/promises';
import { join, resolve, sep } from 'path';
import { COPY_TARGETS, DOCS_ROUTES_DIR, GENERATED_DIR } from './docs-scripts.config';
import { isMainModule } from './utils/cli';

const generatedDir = GENERATED_DIR;

/**
 * Transform markdown content to fix links for SvelteKit routing
 * - Convert README.md links to directory links, keeping a `#hash`
 * - Remove .md extensions from all internal links (SvelteKit will resolve them as directories)
 *
 * A link with a scheme is left as it is, and so is everything inside a fenced code block.
 */
export function transformMarkdownLinks(content: string): string {
  let inFence = false;
  return content
    .split('\n')
    .map((line) => {
      if (/^\s*(```|~~~)/.test(line)) {
        inFence = !inFence;
        return line;
      }
      return inFence ? line : transformLinksInLine(line);
    })
    .join('\n');
}

function transformLinksInLine(line: string): string {
  return line.replace(
    /\[([^\]]+)\]\((?![a-z][a-z0-9+.-]*:)([^)#]*)\.md(#[^)]*)?\)/gi,
    (_match, text: string, target: string, hash = '') => {
      if (target === 'README') return `[${text}](.${hash})`;
      if (target.endsWith('/README')) return `[${text}](${target.slice(0, -'/README'.length)}${hash})`;
      return `[${text}](${target}${hash})`;
    }
  );
}

/**
 * Recursively move and transform markdown files
 */
export async function moveAndTransformDir(srcDir: string, destDir: string, rootSrcDir: string): Promise<void> {
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

/**
 * Replace the destination with the transformed contents of the source, then remove the source.
 *
 * The replacement is built in a sibling staging directory and swapped in only once it is complete, so a failure partway leaves the committed destination as it was. The whole destination is replaced, so pages for deleted sources do not survive, and it must lie inside the routes directory.
 * @param srcPath - The generated directory to move.
 * @param destPath - The directory under the site's routes that it replaces.
 * @param routesDir - The directory the destination must lie inside.
 * @throws If the destination is not inside `routesDir`, or if the transform fails.
 */
export async function moveTarget(srcPath: string, destPath: string, routesDir = DOCS_ROUTES_DIR): Promise<void> {
  const dest = resolve(destPath);
  if (!dest.startsWith(resolve(routesDir) + sep))
    throw new Error(`Refusing to replace ${dest}: it is outside ${routesDir}`);

  const staging = `${dest}.staging`;
  await rm(staging, { recursive: true, force: true });
  try {
    await moveAndTransformDir(srcPath, staging, srcPath);
  } catch (error) {
    await rm(staging, { recursive: true, force: true });
    throw error;
  }
  await rm(dest, { recursive: true, force: true });
  await rename(staging, dest);
  await rm(srcPath, { recursive: true, force: true });
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

    // A missing source keeps its committed destination
    if (!existsSync(srcPath)) {
      console.warn(`Warning: Source path not found: ${srcPath}`);
      continue;
    }

    console.info(`Moving ${src} → ${dest}...`);
    await moveTarget(srcPath, destPath);
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

if (isMainModule(import.meta.url)) {
  moveGenerated().catch((error) => {
    console.error('Error moving generated docs:', error);
    process.exit(1);
  });
}
