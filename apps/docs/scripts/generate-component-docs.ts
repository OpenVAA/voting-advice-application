#!/usr/bin/env tsx
/**
 * Extract @component docstrings from Svelte files and generate markdown documentation
 */
import * as fs from 'fs/promises';
import { glob } from 'glob';
import * as path from 'path';
import { COMPONENT_DIRS, COPY_TARGETS, GENERATED_OUTPUT, GITHUB_BASE, REPO_ROOT } from './docs-scripts.config';

const OUTPUT_DIR = GENERATED_OUTPUT.components;
const TOC_FILE = path.join(OUTPUT_DIR, 'README.md');

interface ComponentDir {
  dir: string;
  name: string;
  importPrefix: string;
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
 * Main function
 */
async function main() {
  console.info('Extracting component documentation...\n');

  const allDocs: Array<ComponentDoc> = [];

  for (const componentDir of COMPONENT_DIRS) {
    console.info(`Processing ${componentDir.name}...`);

    // Find all Svelte files
    const files = await glob(`${componentDir.dir}/**/*.svelte`, {
      ignore: ['**/node_modules/**']
    });

    console.info(`  Found ${files.length} Svelte files`);

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

      // Determine the category subdirectory based on which component dir this is from
      let categorySubdir: string;
      if (componentDir.importPrefix === '$lib/components') {
        categorySubdir = 'components';
      } else if (componentDir.importPrefix === '$lib/dynamic-components') {
        categorySubdir = 'dynamic-components';
      } else if (componentDir.importPrefix === '$candidate/components') {
        categorySubdir = 'candidate/components';
      } else {
        categorySubdir = 'components';
      }

      // Create componentName/+page.md structure for SvelteKit routing
      const componentDirPath = path.join(OUTPUT_DIR, categorySubdir, path.dirname(relativePath), name);
      const outputPath = path.join(componentDirPath, '+page.md');

      await fs.mkdir(componentDirPath, { recursive: true });
      await fs.writeFile(outputPath, markdown, 'utf-8');

      console.info(`  ✓ ${name}`);
    }
  }

  // Generate table of contents
  console.info('\nGenerating table of contents...');
  const toc = await generateTableOfContents(allDocs);
  await fs.writeFile(TOC_FILE, toc, 'utf-8');

  console.info(`\n✓ Generated documentation for ${allDocs.length} components`);
  console.info(`✓ Table of contents: ${TOC_FILE}`);
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
async function findTypeFile(svelteFilePath: string): Promise<string | null> {
  const basePath = svelteFilePath.replace('.svelte', '.type.ts');
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

  // Source link - make path relative to repo root
  const relativeSourcePath = path.relative(REPO_ROOT, doc.sourcePath).replace(/\\/g, '/');
  lines.push('## Source\n');
  lines.push(`[${relativeSourcePath}](${GITHUB_BASE}/${relativeSourcePath})\n`);

  // Type documentation link if exists
  if (doc.typeFilePath) {
    const relativeTypePath = path.relative(REPO_ROOT, doc.typeFilePath).replace(/\\/g, '/');
    lines.push(`[${relativeTypePath}](${GITHUB_BASE}/${relativeTypePath})\n`);
    // const typeDocPath = await getTypeDocLink(doc.typeFilePath);

    // lines.push('## Type Definition\n');

    // if (typeDocPath) {
    //   lines.push(`See [TypeDoc documentation](${typeDocPath}) for detailed type information.\n`);
    // }

    // lines.push(
    //   `Source: [\`${typeGithubPath}\`](${GITHUB_BASE}/${typeGithubPath})\n`
    // );
  }

  // README content if exists
  if (doc.readmePath) {
    const readmeContent = await fs.readFile(doc.readmePath, 'utf-8');
    lines.push('## Additional Documentation\n');
    lines.push(readmeContent);
    lines.push('');
  }

  return lines.join('\n');
}

// /**
//  * Get the TypeDoc link for a type file (relative to generated API docs)
//  */
// async function getTypeDocLink(typeFilePath: string): Promise<string | null> {
//   // This is a simplified version - TypeDoc will generate the actual paths
//   // The link structure will depend on TypeDoc's output
//   const relativePath = typeFilePath.replace('frontend/src/lib/', '').replace('.type.ts', '');
//   return `../api/frontend/${relativePath}.md`;
// }

/**
 * Generate table of contents for all components
 */
async function generateTableOfContents(docs: Array<ComponentDoc>): Promise<string> {
  const lines: Array<string> = [];

  lines.push('# Component Documentation\n');
  lines.push('This documentation is automatically generated from the `@component` docstrings in Svelte files.\n');
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

  // Process each COMPONENT_DIR in order
  for (const componentDir of COMPONENT_DIRS) {
    const components = byComponentDir.get(componentDir.dir);
    if (!components || components.length === 0) continue;

    // Sort components alphabetically by name
    components.sort((a, b) => a.name.localeCompare(b.name));

    lines.push(`### ${componentDir.name}\n`);

    for (const component of components) {
      // Determine the category subdirectory based on which component dir this is from
      let categorySubdir: string;
      if (component.componentDir.importPrefix === '$lib/components') {
        categorySubdir = 'components';
      } else if (component.componentDir.importPrefix === '$lib/dynamic-components') {
        categorySubdir = 'dynamic-components';
      } else if (component.componentDir.importPrefix === '$candidate/components') {
        categorySubdir = 'candidate/components';
      } else {
        categorySubdir = 'components';
      }

      // Generate absolute URL for the component page
      const componentPath = path
        .join(categorySubdir, path.dirname(component.relativePath), component.name)
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

main().catch((error) => {
  console.error('Error generating component documentation:', error);
  process.exit(1);
});
