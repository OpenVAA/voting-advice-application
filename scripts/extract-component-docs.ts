#!/usr/bin/env tsx
/**
 * Extract @component docstrings from Svelte files and generate markdown documentation
 */
import { glob } from 'glob';
import * as fs from 'fs/promises';
import * as path from 'path';

const COMPONENT_DIRS = [
  'frontend/src/lib/components',
  'frontend/src/lib/candidate/components',
  'frontend/src/lib/dynamic-components'
];

const OUTPUT_DIR = 'docs/generated/components';
const TOC_FILE = path.join(OUTPUT_DIR, 'README.md');

interface ComponentDoc {
  name: string;
  relativePath: string;
  docstring: string;
  sourcePath: string;
  typeFilePath?: string;
  readmePath?: string;
}

/**
 * Extract the @component docstring from a Svelte file
 */
async function extractDocstring(filePath: string): Promise<string | null> {
  const content = await fs.readFile(filePath, 'utf-8');

  // Match the @component comment block
  const match = content.match(/<!--\s*@component\s*([\s\S]*?)-->/);

  if (!match) return null;

  // Extract the content and clean it up
  let docstring = match[1].trim();

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
  const lines: string[] = [];

  // Component name as header
  lines.push(`# ${doc.name}\n`);

  // Main documentation from @component docstring
  lines.push(doc.docstring);
  lines.push('');

  // Source link
  const githubPath = doc.sourcePath.replace(/\\/g, '/');
  lines.push(`## Source\n`);
  lines.push(`[\`${githubPath}\`](https://github.com/OpenVAA/voting-advice-application/blob/main/${githubPath})\n`);

  // Type documentation link if exists
  if (doc.typeFilePath) {
    const typeGithubPath = doc.typeFilePath.replace(/\\/g, '/');
    const typeDocPath = await getTypeDocLink(doc.typeFilePath);

    lines.push(`## Type Definition\n`);

    if (typeDocPath) {
      lines.push(`See [TypeDoc documentation](${typeDocPath}) for detailed type information.\n`);
    }

    lines.push(`Source: [\`${typeGithubPath}\`](https://github.com/OpenVAA/voting-advice-application/blob/main/${typeGithubPath})\n`);
  }

  // README content if exists
  if (doc.readmePath) {
    const readmeContent = await fs.readFile(doc.readmePath, 'utf-8');
    lines.push(`## Additional Documentation\n`);
    lines.push(readmeContent);
    lines.push('');
  }

  return lines.join('\n');
}

/**
 * Get the TypeDoc link for a type file (relative to generated API docs)
 */
async function getTypeDocLink(typeFilePath: string): Promise<string | null> {
  // This is a simplified version - TypeDoc will generate the actual paths
  // The link structure will depend on TypeDoc's output
  const relativePath = typeFilePath.replace('frontend/src/lib/', '').replace('.type.ts', '');
  return `../api/frontend/${relativePath}.md`;
}

/**
 * Generate table of contents for all components
 */
async function generateTableOfContents(docs: ComponentDoc[]): Promise<string> {
  const lines: string[] = [];

  lines.push(`# Component Documentation\n`);
  lines.push(`This documentation is automatically generated from the \`@component\` docstrings in Svelte files.\n`);
  lines.push(`## Components by Directory\n`);

  // Group by directory
  const byDir = new Map<string, ComponentDoc[]>();

  for (const doc of docs) {
    const dir = path.dirname(doc.relativePath);
    if (!byDir.has(dir)) {
      byDir.set(dir, []);
    }
    byDir.get(dir)!.push(doc);
  }

  // Sort directories
  const sortedDirs = Array.from(byDir.keys()).sort();

  for (const dir of sortedDirs) {
    const components = byDir.get(dir)!.sort((a, b) => a.name.localeCompare(b.name));

    lines.push(`### ${dir}\n`);

    for (const component of components) {
      const mdPath = component.relativePath.replace('.svelte', '.md');
      lines.push(`- [${component.name}](./${mdPath})`);
    }

    lines.push('');
  }

  lines.push(`\n---\n`);
  lines.push(`Total: ${docs.length} components\n`);

  return lines.join('\n');
}

/**
 * Main function
 */
async function main() {
  console.log('Extracting component documentation...\n');

  const allDocs: ComponentDoc[] = [];

  for (const dir of COMPONENT_DIRS) {
    console.log(`Processing ${dir}...`);

    // Find all Svelte files
    const files = await glob(`${dir}/**/*.svelte`, {
      ignore: ['**/node_modules/**']
    });

    console.log(`  Found ${files.length} Svelte files`);

    for (const file of files) {
      const docstring = await extractDocstring(file);

      if (!docstring) {
        console.log(`  ⚠️  No @component docstring in ${file}`);
        continue;
      }

      const name = path.basename(file, '.svelte');
      const relativePath = path.relative(dir, file);
      const typeFile = await findTypeFile(file);
      const dirPath = path.dirname(file);
      const readmePath = await findReadme(dirPath);

      const doc: ComponentDoc = {
        name,
        relativePath,
        docstring,
        sourcePath: file,
        typeFilePath: typeFile ?? undefined,
        readmePath: readmePath ?? undefined
      };

      allDocs.push(doc);

      // Generate markdown
      const markdown = await generateComponentMarkdown(doc);
      const outputPath = path.join(OUTPUT_DIR, dir.replace('frontend/src/lib/', ''), relativePath.replace('.svelte', '.md'));

      await fs.mkdir(path.dirname(outputPath), { recursive: true });
      await fs.writeFile(outputPath, markdown, 'utf-8');

      console.log(`  ✓ ${name}`);
    }
  }

  // Generate table of contents
  console.log('\nGenerating table of contents...');
  const toc = await generateTableOfContents(allDocs);
  await fs.writeFile(TOC_FILE, toc, 'utf-8');

  console.log(`\n✓ Generated documentation for ${allDocs.length} components`);
  console.log(`✓ Table of contents: ${TOC_FILE}`);
}

main().catch((error) => {
  console.error('Error generating component documentation:', error);
  process.exit(1);
});
