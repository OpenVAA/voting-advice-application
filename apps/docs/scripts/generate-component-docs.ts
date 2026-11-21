#!/usr/bin/env tsx
/**
 * Extract @component docstrings from Svelte files and generate markdown documentation
 */
import * as fs from 'fs/promises';
import { glob } from 'glob';
import * as path from 'path';
import { COMPONENT_DIRS, COPY_TARGETS, GENERATED_OUTPUT, GITHUB_BASE, REPO_ROOT } from './docs-scripts.config';
import { isMainModule } from './utils/cli';

export interface ComponentDir {
  dir: string;
  name: string;
  importPrefix: string;
  categorySubdir: string;
}

interface ComponentDoc {
  name: string;
  relativePath: string;
  docstring: string;
  sourcePath: string;
  typeFilePath?: string;
  readmePath?: string;
  importPath: string;
  componentDir: ComponentDir;
}

/**
 * Write a page for every component with a `@component` docstring, and a table of contents, into the output directory.
 * @param options.outputDir - Where the pages are written.
 * @param options.componentDirs - The component directories to read.
 */
export async function generateComponentDocs({
  outputDir = GENERATED_OUTPUT.components,
  componentDirs = COMPONENT_DIRS
}: { outputDir?: string; componentDirs?: ReadonlyArray<ComponentDir> } = {}): Promise<void> {
  console.info('Extracting component documentation...\n');

  const tocFile = path.join(outputDir, 'README.md');
  const allDocs: Array<ComponentDoc> = [];

  // Start from an empty directory, so a page whose component has gone is not moved into the site
  await fs.rm(outputDir, { recursive: true, force: true });

  for (const componentDir of componentDirs) {
    console.info(`Processing ${componentDir.name}...`);

    // Find all Svelte files
    const files = await glob(`${componentDir.dir}/**/*.svelte`, {
      ignore: ['**/node_modules/**']
    });

    console.info(`  Found ${files.length} Svelte files`);
    if (files.length === 0) throw new Error(`No component found in ${componentDir.dir}`);

    for (const file of files) {
      const docstring = await extractDocstring(file);

      if (!docstring) {
        console.info(`  ⚠️  No @component docstring in ${file}`);
        continue;
      }

      const name = path.basename(file, '.svelte');
      const relativePath = path.relative(componentDir.dir, file);
      const typeFile = await findTypeFile(file);
      const dirPath = path.dirname(file);
      const readmePath = await findReadme(dirPath);

      // Calculate import path
      const relativeDir = path.dirname(relativePath);
      const importPath =
        relativeDir === '.' ? `${componentDir.importPrefix}` : `${componentDir.importPrefix}/${relativeDir}`;

      const doc: ComponentDoc = {
        name,
        relativePath,
        docstring,
        sourcePath: file,
        typeFilePath: typeFile ?? undefined,
        readmePath: readmePath ?? undefined,
        importPath,
        componentDir
      };

      allDocs.push(doc);

      // Generate markdown
      const markdown = await generateComponentMarkdown(doc);

      // Create componentName/+page.md structure for SvelteKit routing
      const componentDirPath = path.join(outputDir, componentDir.categorySubdir, path.dirname(relativePath), name);
      const outputPath = path.join(componentDirPath, '+page.md');

      await fs.mkdir(componentDirPath, { recursive: true });
      await fs.writeFile(outputPath, markdown, 'utf-8');

      console.info(`  ✓ ${name}`);
    }
  }

  if (allDocs.length === 0) throw new Error('No component has a @component docstring');

  // Generate table of contents
  console.info('\nGenerating table of contents...');
  const toc = await generateTableOfContents(allDocs, componentDirs);
  await fs.mkdir(outputDir, { recursive: true });
  await fs.writeFile(tocFile, toc, 'utf-8');

  console.info(`\n✓ Generated documentation for ${allDocs.length} components`);
  console.info(`✓ Table of contents: ${tocFile}`);
}

/**
 * Extract the @component docstring from a Svelte file
 */
async function extractDocstring(filePath: string): Promise<string | null> {
  const content = await fs.readFile(filePath, 'utf-8');

  // Match the @component comment block
  const match = content.match(/<!--\s*@component\s*([\s\S]*?)-->/i);

  if (!match) return null;

  // Extract the content and clean it up
  const docstring = match[1].trim();

  return docstring;
}

/**
 * Check if a corresponding .type.ts file exists
 */
export async function findTypeFile(svelteFilePath: string): Promise<string | null> {
  const basePath = svelteFilePath.replace(/\.svelte$/, '.type.ts');
  try {
    await fs.access(basePath);
    return basePath;
  } catch {
    return null;
  }
}

/**
 * Check if a README.md exists in the directory
 */
async function findReadme(dirPath: string): Promise<string | null> {
  const readmePath = path.join(dirPath, 'README.md');
  try {
    await fs.access(readmePath);
    return readmePath;
  } catch {
    return null;
  }
}

/**
 * Generate markdown for a component
 */
async function generateComponentMarkdown(doc: ComponentDoc): Promise<string> {
  const lines: Array<string> = [];

  // Component name as header
  lines.push(`# ${doc.name}\n`);

  // Main documentation from @component docstring
  lines.push(doc.docstring);
  lines.push('');

  // Source links, with paths relative to the repo root
  const relativeSourcePath = repoRelative(doc.sourcePath);
  lines.push('## Source\n');
  lines.push(`- Component: [${relativeSourcePath}](${GITHUB_BASE}/${relativeSourcePath})`);
  if (doc.typeFilePath) {
    const relativeTypePath = repoRelative(doc.typeFilePath);
    lines.push(`- Types: [${relativeTypePath}](${GITHUB_BASE}/${relativeTypePath})`);
  }
  lines.push('');

  // The README of the component's directory, with its headings moved one level down so the page keeps a single H1
  if (doc.readmePath) {
    const readmeContent = await fs.readFile(doc.readmePath, 'utf-8');
    // A link to the README's directory, whose page GitHub renders with the README
    const relativeReadmeDir = repoRelative(path.dirname(doc.readmePath));
    lines.push('## Directory README\n');
    lines.push(
      `From the README in [${relativeReadmeDir}](${GITHUB_BASE.replace(/\/blob\/main$/, '/tree/main')}/${relativeReadmeDir}):\n`
    );
    lines.push(demoteHeadings(readmeContent));
    lines.push('');
  }

  return lines.join('\n');
}

/**
 * Return a path relative to the repo root with forward slashes
 */
function repoRelative(filePath: string): string {
  return path.relative(REPO_ROOT, filePath).replace(/\\/g, '/');
}

/**
 * Add one `#` to every ATX heading outside fenced code blocks, so an embedded README's H1 becomes an H2
 */
function demoteHeadings(markdown: string): string {
  let inFence = false;
  return markdown
    .split('\n')
    .map((line) => {
      if (/^\s*(```|~~~)/.test(line)) {
        inFence = !inFence;
        return line;
      }
      if (!inFence && /^#{1,5}\s/.test(line)) return `#${line}`;
      return line;
    })
    .join('\n');
}

/**
 * Generate table of contents for all components
 */
async function generateTableOfContents(
  docs: Array<ComponentDoc>,
  componentDirs: ReadonlyArray<ComponentDir>
): Promise<string> {
  const lines: Array<string> = [];

  lines.push('# Component Documentation\n');
  lines.push('This documentation is automatically generated from the `@component` docstrings in Svelte files.\n');
  const scannedDirs = componentDirs.map(({ dir }) => `\`${repoRelative(dir)}\``);
  lines.push(
    `It lists every component with such a docstring in ${scannedDirs.slice(0, -1).join(', ')} and ${scannedDirs.at(-1)}. ` +
      'The pages are regenerated by `yarn workspace @openvaa/docs generate:docs`, so change a docstring rather than a page.\n'
  );
  lines.push('## Components by Category\n');

  const routeRoot = COPY_TARGETS.find((t) => t.src === 'components')?.route.replace(/\/+$/, '');
  if (!routeRoot) throw new Error('COPY_TARGETS missing entry for components');

  // Group by component directory
  const byComponentDir = new Map<string, Array<ComponentDoc>>();

  for (const doc of docs) {
    const dirKey = doc.componentDir.dir;
    if (!byComponentDir.has(dirKey)) {
      byComponentDir.set(dirKey, []);
    }
    byComponentDir.get(dirKey)!.push(doc);
  }

  // Process each component directory in order
  for (const componentDir of componentDirs) {
    const components = byComponentDir.get(componentDir.dir);
    if (!components || components.length === 0) continue;

    // Sort components alphabetically by name
    components.sort((a, b) => a.name.localeCompare(b.name));

    lines.push(`### ${componentDir.name}\n`);

    for (const component of components) {
      // Generate absolute URL for the component page
      const componentPath = path
        .join(component.componentDir.categorySubdir, path.dirname(component.relativePath), component.name)
        .replace(/\\/g, '/'); // Normalize path separators for URLs
      const absoluteUrl = `${routeRoot}/${componentPath}`;

      lines.push(
        `- [${component.name}](${absoluteUrl})\n\n  \`import { ${component.name} } from '${component.importPath}';\`\n`
      );
    }

    lines.push('');
  }

  lines.push('---\n');
  lines.push(`Total: ${docs.length} components\n`);

  return lines.join('\n');
}

if (isMainModule(import.meta.url)) {
  generateComponentDocs().catch((error) => {
    console.error('Error generating component documentation:', error);
    process.exit(1);
  });
}
