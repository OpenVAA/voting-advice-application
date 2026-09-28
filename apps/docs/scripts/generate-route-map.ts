#!/usr/bin/env tsx
/**
 * Generate a route map from the SvelteKit routes directory
 */
import * as fs from 'fs/promises';
import { glob } from 'glob';
import * as path from 'path';
import { GENERATED_OUTPUT, GITHUB_BASE, ROUTES_DIR } from './docs-scripts.config';

const DIRS_ONLY = true;
const OUTPUT_FILE = path.join(GENERATED_OUTPUT.routes, 'README.md');

interface RouteFile {
  name: string;
  fullPath: string;
}

interface RouteNode {
  path: string;
  fullPath: string;
  type: 'page' | 'layout' | 'server' | 'error' | 'group' | 'param' | 'dir';
  children: Array<RouteNode>;
  files: Array<RouteFile>;
  readme?: string;
}

/**
 * Main function
 */
async function main() {
  console.info('Generating route map...\n');

  const tree = await buildRouteTree();
  const markdown = generateMarkdown(tree);

  await fs.mkdir(path.dirname(OUTPUT_FILE), { recursive: true });
  await fs.writeFile(OUTPUT_FILE, markdown, 'utf-8');

  console.info(`✓ Route map generated: ${OUTPUT_FILE}`);
}

/**
 * Build a tree structure from route paths
 */
async function buildRouteTree(): Promise<RouteNode> {
  const root: RouteNode = {
    path: 'routes',
    fullPath: ROUTES_DIR,
    type: 'dir',
    children: [],
    files: []
  };

  // Get all route files
  const files = await glob(`${ROUTES_DIR}/**/*.{svelte,ts,js}`, {
    ignore: ['**/node_modules/**']
  });

  // Group files by directory
  const dirFiles = new Map<string, Array<RouteFile>>();

  for (const file of files) {
    const dir = path.dirname(file);
    if (!dirFiles.has(dir)) {
      dirFiles.set(dir, []);
    }
    if (DIRS_ONLY) continue;
    dirFiles.get(dir)!.push({
      name: path.basename(file),
      fullPath: file
    });
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

  return root;
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

  return { name: segment, type: 'dir' };
}

/**
 * Generate markdown for route tree
 */
function generateMarkdown(tree: RouteNode): string {
  const lines: Array<string> = [];

  lines.push('# Route Map\n');
  lines.push('This is an automatically generated map of the SvelteKit application routes.\n');
  lines.push('```');
  lines.push(...generateTreeLines(tree, '', true));
  lines.push('```');

  return lines.join('\n');
}

/**
 * Generate tree structure lines
 */
function generateTreeLines(node: RouteNode, prefix: string, isLast: boolean): Array<string> {
  const lines: Array<string> = [];
  const connector = isLast ? '└── ' : '├── ';
  const extension = isLast ? '    ' : '│   ';

  // Display directory/route name
  const displayName = getDisplayName(node);
  lines.push(`${prefix}${connector}${displayName}/`);

  // Sort and display files
  const sortedFiles = [...node.files].sort((a, b) => {
    // Sort by importance: +page, +layout, +server, +error, others
    const order = ['+page', '+layout', '+server', '+error'];
    const aPrefix = order.find((o) => a.name.startsWith(o));
    const bPrefix = order.find((o) => b.name.startsWith(o));

    if (aPrefix && bPrefix) {
      return order.indexOf(aPrefix) - order.indexOf(bPrefix);
    }
    if (aPrefix) return -1;
    if (bPrefix) return 1;
    return a.name.localeCompare(b.name);
  });

  const childPrefix = prefix + extension;

  // Display files before subdirectories
  sortedFiles.forEach((file, index) => {
    const isLastFile = index === sortedFiles.length - 1 && node.children.length === 0;
    const fileConnector = isLastFile ? '└── ' : '├── ';
    const githubLink = `${GITHUB_BASE}/${file.fullPath}`;
    lines.push(`${childPrefix}${fileConnector}[${file.name}](${githubLink})`);
  });

  // Sort children
  const sortedChildren = [...node.children].sort((a, b) => {
    // Groups first, then params, then regular dirs
    if (a.type !== b.type) {
      if (a.type === 'group') return -1;
      if (b.type === 'group') return 1;
      if (a.type === 'param') return 1;
      if (b.type === 'param') return -1;
    }
    return a.path.localeCompare(b.path);
  });

  // Recurse for children
  sortedChildren.forEach((child, index) => {
    const isLastChild = index === sortedChildren.length - 1;
    lines.push(...generateTreeLines(child, childPrefix, isLastChild));
  });

  return lines;
}

/**
 * Get display name for a node
 */
function getDisplayName(node: RouteNode): string {
  if (node.type === 'group') {
    return `(${node.path})`;
  }

  if (node.type === 'param') {
    return node.path;
  }

  return node.path;
}

main().catch((error) => {
  console.error('Error generating route map:', error);
  process.exit(1);
});
