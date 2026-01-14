/**
 * Utility functions for working with routes
 */
import * as fs from 'fs/promises';
import { glob } from 'glob';
import * as path from 'path';
import { COPY_TARGETS } from '../docs-scripts.config';

export interface RouteInfo {
  route: string;
  fullPath: string;
  title?: string;
  hasPage: boolean;
  isSecondary?: boolean;
}

/**
 * Discover all routes by finding +page.md and +page.svelte files
 * Excludes generated documentation directories (COPY_TARGETS)
 */
export async function discoverRoutes(routesDir: string): Promise<Array<RouteInfo>> {
  // Build ignore patterns for all COPY_TARGETS destinations
  const ignorePatterns = [
    '**/node_modules/**',
    ...COPY_TARGETS.map((target) => {
      // Extract the relative path from routesDir
      const relativePath = path.relative(routesDir, target.dest);
      return `${relativePath}/**`;
    })
  ];

  const pageFiles = await glob('**/{+page.md,+page.svelte}', {
    cwd: routesDir,
    ignore: ignorePatterns
  });

  const routes: Array<RouteInfo> = [];

  for (const file of pageFiles) {
    const dir = path.dirname(file);
    // Remove route groups (segments wrapped in parentheses) from the route path
    // E.g., "(content)/about" becomes "/about"
    const route = dir === '.' ? '/' : normalizeRoute(dir);
    const fullPath = path.join(routesDir, dir);

    // Try to extract title from +page.md
    let title: string | undefined;
    const mdPath = path.join(routesDir, dir, '+page.md');
    try {
      const content = await fs.readFile(mdPath, 'utf-8');
      title = extractTitle(content);
    } catch {
      // No +page.md or couldn't read it
    }

    routes.push({
      route,
      fullPath,
      title,
      hasPage: true
    });
  }

  return routes.sort((a, b) => a.route.localeCompare(b.route));
}

/**
 * Normalize route path by removing layout groups (segments in parentheses)
 * In SvelteKit, folders wrapped in parentheses like (group) don't contribute to the URL
 * E.g., "(content)/about/features" becomes "/about/features"
 */
function normalizeRoute(dirPath: string): string {
  const segments = dirPath.split('/').filter(Boolean);
  // Filter out segments that start and end with parentheses
  const filteredSegments = segments.filter((segment) => !(segment.startsWith('(') && segment.endsWith(')')));
  return filteredSegments.length > 0 ? `/${filteredSegments.join('/')}` : '/';
}

/**
 * Extract title from markdown content (first # heading)
 */
export function extractTitle(content: string): string | undefined {
  const match = content.match(/^#\s+(.+)$/m);
  return match ? match[1].trim() : undefined;
}

/**
 * Convert route path to title (fallback when no title in markdown)
 */
export function routeToTitle(route: string): string {
  if (route === '/') return 'Home';

  const segments = route.split('/').filter(Boolean);
  const lastSegment = segments[segments.length - 1];

  // Convert kebab case
  const title = lastSegment.split('-').join(' ');

  // Capitalize first letter
  return title.charAt(0).toUpperCase() + title.slice(1);
}

/**
 * Find all markdown files in a directory
 */
export async function findMarkdownFiles(dir: string): Promise<Array<string>> {
  const files = await glob('**/*.md', {
    cwd: dir,
    ignore: ['**/node_modules/**']
  });

  return files.map((file) => path.join(dir, file));
}

/**
 * Get the directory path from import.meta.url
 */
export function getDirname(importMetaUrl: string): string {
  const __filename = new URL(importMetaUrl).pathname;
  return path.dirname(__filename);
}
