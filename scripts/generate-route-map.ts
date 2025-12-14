#!/usr/bin/env tsx
/**
 * Generate a route map from the SvelteKit routes directory
 */
import { glob } from 'glob';
import * as fs from 'fs/promises';
import * as path from 'path';

const ROUTES_DIR = 'frontend/src/routes';
const OUTPUT_FILE = 'docs/generated/routes/README.md';

interface RouteNode {
  path: string;
  fullPath: string;
  type: 'page' | 'layout' | 'server' | 'error' | 'group' | 'param';
  children: RouteNode[];
  files: string[];
  readme?: string;
}

/**
 * Parse route segment to identify special types
 */
function parseSegment(segment: string): { name: string; type: RouteNode['type'] } {
  // Dynamic parameter: [param] or [param=matcher]
  if (segment.startsWith('[') && segment.endsWith(']')) {
    return { name: segment, type: 'param' };
  }

  // Route group: (group)
  if (segment.startsWith('(') && segment.endsWith(')')) {
    return { name: segment.slice(1, -1), type: 'group' };
  }

  return { name: segment, type: 'page' };
}

/**
 * Build a tree structure from route paths
 */
async function buildRouteTree(): Promise<RouteNode> {
  const root: RouteNode = {
    path: '/',
    fullPath: ROUTES_DIR,
    type: 'page',
    children: [],
    files: []
  };

  // Get all route files
  const files = await glob(`${ROUTES_DIR}/**/*.{svelte,ts,js}`, {
    ignore: ['**/node_modules/**']
  });

  // Group files by directory
  const dirFiles = new Map<string, string[]>();

  for (const file of files) {
    const dir = path.dirname(file);
    if (!dirFiles.has(dir)) {
      dirFiles.set(dir, []);
    }
    dirFiles.get(dir)!.push(path.basename(file));
  }

  // Build tree
  const dirs = Array.from(dirFiles.keys()).sort();

  for (const dir of dirs) {
    const relativePath = path.relative(ROUTES_DIR, dir);

    if (relativePath === '') {
      // Root files
      root.files = dirFiles.get(dir)!;
      continue;
    }

    const segments = relativePath.split(path.sep);
    let current = root;

    // Navigate/create tree structure
    for (let i = 0; i < segments.length; i++) {
      const segment = segments[i];
      const { name, type } = parseSegment(segment);

      let child = current.children.find((c) => c.path === name);

      if (!child) {
        const isLast = i === segments.length - 1;
        child = {
          path: name,
          fullPath: path.join(ROUTES_DIR, segments.slice(0, i + 1).join(path.sep)),
          type,
          children: [],
          files: isLast ? dirFiles.get(dir)! : []
        };
        current.children.push(child);
      } else if (i === segments.length - 1) {
        child.files = dirFiles.get(dir)!;
      }

      current = child;
    }
  }

  // Check for READMEs
  await addReadmes(root);

  return root;
}

/**
 * Recursively add README content to nodes
 */
async function addReadmes(node: RouteNode): Promise<void> {
  const readmePath = path.join(node.fullPath, 'README.md');

  try {
    const content = await fs.readFile(readmePath, 'utf-8');
    node.readme = content;
  } catch {
    // No README in this directory
  }

  for (const child of node.children) {
    await addReadmes(child);
  }
}

/**
 * Generate route path for display
 */
function getDisplayPath(node: RouteNode, parentPath: string): string {
  if (node.type === 'group') {
    return parentPath;
  }

  if (node.type === 'param') {
    const paramName = node.path.slice(1, -1).split('=')[0];
    return path.posix.join(parentPath, `:${paramName}`);
  }

  return path.posix.join(parentPath, node.path);
}

/**
 * Generate markdown for route tree
 */
function generateMarkdown(node: RouteNode, depth: number = 0, parentPath: string = ''): string[] {
  const lines: string[] = [];
  const indent = '  '.repeat(depth);

  if (depth === 0) {
    lines.push(`# Route Map\n`);
    lines.push(`This is an automatically generated map of the SvelteKit application routes.\n`);
    lines.push(`## Route Structure\n`);
  }

  const displayPath = getDisplayPath(node, parentPath);

  if (depth > 0) {
    // Route entry
    const icon = node.type === 'param' ? ':link:' : node.type === 'group' ? ':file_folder:' : ':page_facing_up:';
    const typeLabel = node.type === 'group' ? ' (layout group)' : node.type === 'param' ? ' (dynamic)' : '';

    lines.push(`${indent}- **${displayPath}**${typeLabel}`);

    // List files
    if (node.files.length > 0) {
      const pageFiles = node.files.filter((f) => f.includes('+page'));
      const layoutFiles = node.files.filter((f) => f.includes('+layout'));
      const serverFiles = node.files.filter((f) => f.includes('+server'));
      const errorFiles = node.files.filter((f) => f.includes('+error'));

      if (pageFiles.length > 0) {
        lines.push(`${indent}  - Page: ${pageFiles.join(', ')}`);
      }
      if (layoutFiles.length > 0) {
        lines.push(`${indent}  - Layout: ${layoutFiles.join(', ')}`);
      }
      if (serverFiles.length > 0) {
        lines.push(`${indent}  - Server: ${serverFiles.join(', ')}`);
      }
      if (errorFiles.length > 0) {
        lines.push(`${indent}  - Error: ${errorFiles.join(', ')}`);
      }
    }

    // README content
    if (node.readme) {
      lines.push(`${indent}  > ${node.readme.split('\n')[0]}`);
    }
  }

  // Recurse for children
  const sortedChildren = [...node.children].sort((a, b) => {
    // Groups first, then params, then regular routes
    if (a.type !== b.type) {
      if (a.type === 'group') return -1;
      if (b.type === 'group') return 1;
      if (a.type === 'param') return 1;
      if (b.type === 'param') return -1;
    }
    return a.path.localeCompare(b.path);
  });

  for (const child of sortedChildren) {
    lines.push(...generateMarkdown(child, depth + 1, displayPath));
  }

  return lines;
}

/**
 * Main function
 */
async function main() {
  console.log('Generating route map...\n');

  const tree = await buildRouteTree();
  const markdown = generateMarkdown(tree);

  await fs.mkdir(path.dirname(OUTPUT_FILE), { recursive: true });
  await fs.writeFile(OUTPUT_FILE, markdown.join('\n'), 'utf-8');

  console.log(`✓ Route map generated: ${OUTPUT_FILE}`);
}

main().catch((error) => {
  console.error('Error generating route map:', error);
  process.exit(1);
});
