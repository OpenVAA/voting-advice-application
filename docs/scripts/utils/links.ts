/**
 * Utility functions for working with markdown links
 */
import * as fs from 'fs/promises';
import * as path from 'path';

export interface MarkdownLink {
  text: string;
  url: string;
  line: number;
  column: number;
  raw: string;
}

export interface BrokenLink {
  file: string;
  link: MarkdownLink;
  reason: string;
}

/**
 * Extract all markdown links from content
 * Matches [text](url) and [text](<url>) formats
 */
export function extractMarkdownLinks(content: string): Array<MarkdownLink> {
  const links: Array<MarkdownLink> = [];
  // Match both [text](url) and [text](<url>) formats
  // The second format allows parentheses in the URL
  const linkRegex = /\[([^\]]+)\]\((?:<([^>]+)>|([^)]+))\)/g;
  const lines = content.split('\n');

  for (let lineIndex = 0; lineIndex < lines.length; lineIndex++) {
    const line = lines[lineIndex];
    let match;
    linkRegex.lastIndex = 0;

    while ((match = linkRegex.exec(line)) !== null) {
      // Group 2 is <url>, group 3 is url without angle brackets
      const url = match[2] || match[3];
      links.push({
        text: match[1],
        url: url,
        line: lineIndex + 1,
        column: match.index + 1,
        raw: match[0]
      });
    }
  }

  return links;
}

/**
 * Check if a link is internal (not starting with protocol)
 */
export function isInternalLink(url: string): boolean {
  return !url.match(/^https?:\/\//i) && !url.match(/^mailto:/i) && !url.match(/^tel:/i);
}

/**
 * Check if a link is a hash/anchor link
 */
export function isHashLink(url: string): boolean {
  return url.startsWith('#');
}

/**
 * Resolve a relative link to an absolute path
 * @param linkUrl The link URL (relative or absolute)
 * @param currentFilePath The path to the file containing the link
 * @param routesDir The base routes directory
 * @returns Absolute file path
 */
export function resolveLink(linkUrl: string, currentFilePath: string, routesDir: string): string {
  // Remove hash/anchor from URL
  const urlWithoutHash = linkUrl.split('#')[0];
  if (!urlWithoutHash) return ''; // Just a hash link

  if (urlWithoutHash.startsWith('/')) {
    // Absolute link - relative to routes dir
    // For absolute links, we need to search for the actual file path
    // because layout groups (like (content)) don't appear in URLs
    return resolveAbsoluteLink(urlWithoutHash, routesDir);
  } else {
    // Relative link - relative to current file
    const currentDir = path.dirname(currentFilePath);
    return path.resolve(currentDir, urlWithoutHash);
  }
}

/**
 * Resolve an absolute link to the actual filesystem path
 * Handles layout groups (parenthesized folders) that don't appear in URLs
 * E.g., "/about" might be at "routes/about" or "routes/(content)/about"
 */
function resolveAbsoluteLink(urlPath: string, routesDir: string): string {
  // Try the direct path first
  const directPath = path.join(routesDir, urlPath);
  // We'll return the direct path and let checkLinkExists try alternatives
  return directPath;
}

/**
 * Check if a resolved link path exists
 * Checks for the path as-is, with +page.md, and as a directory
 * Also searches within layout groups (parenthesized folders)
 */
export async function checkLinkExists(resolvedPath: string): Promise<boolean> {
  // First try direct paths
  if (await checkPathExists(resolvedPath)) {
    return true;
  }

  // If not found, try searching within layout groups
  // E.g., if looking for routes/about, also check routes/(content)/about
  const routesDir = findRoutesDir(resolvedPath);
  if (!routesDir) return false;

  const relativePath = path.relative(routesDir, resolvedPath);

  // Try inserting layout groups at different positions
  // Look for directories with parentheses in the routes dir
  try {
    const entries = await fs.readdir(routesDir, { withFileTypes: true });
    const layoutGroups = entries
      .filter((e) => e.isDirectory() && e.name.startsWith('(') && e.name.endsWith(')'))
      .map((e) => e.name);

    for (const group of layoutGroups) {
      // Try with layout group at the beginning
      const altPath = path.join(routesDir, group, relativePath);
      if (await checkPathExists(altPath)) {
        return true;
      }
    }
  } catch {
    // Ignore errors reading directory
  }

  return false;
}

/**
 * Check if a specific path exists (file or directory with +page.md)
 */
async function checkPathExists(resolvedPath: string): Promise<boolean> {
  try {
    const stat = await fs.stat(resolvedPath);
    if (stat.isFile()) {
      return true;
    }
    if (stat.isDirectory()) {
      // Check for +page.md in the directory
      const pagePath = path.join(resolvedPath, '+page.md');
      try {
        await fs.access(pagePath);
        return true;
      } catch {
        return false;
      }
    }
  } catch {
    // Try with +page.md extension
    const withPageMd = path.join(resolvedPath, '+page.md');
    try {
      await fs.access(withPageMd);
      return true;
    } catch {
      return false;
    }
  }
  return false;
}

/**
 * Find the routes directory from a resolved path
 */
function findRoutesDir(resolvedPath: string): string | null {
  const parts = resolvedPath.split(path.sep);
  const routesIndex = parts.findIndex((p) => p === 'routes');
  if (routesIndex === -1) return null;
  return parts.slice(0, routesIndex + 1).join(path.sep);
}

/**
 * Normalize route path by removing layout groups (segments in parentheses)
 * In SvelteKit, folders wrapped in parentheses like (group) don't contribute to the URL
 * E.g., "(content)/about/features" becomes "/about/features"
 */
function normalizeRoutePath(routePath: string): string {
  const segments = routePath.split('/').filter(Boolean);
  // Filter out segments that start and end with parentheses
  const filteredSegments = segments.filter((segment) => !(segment.startsWith('(') && segment.endsWith(')')));
  return filteredSegments.length > 0 ? `/${filteredSegments.join('/')}` : '/';
}

/**
 * Convert relative link to absolute link based on routes directory
 * @param linkUrl The original link URL
 * @param currentFilePath The path to the file containing the link
 * @param routesDir The base routes directory
 * @returns The corrected absolute link
 */
export function makeAbsoluteLink(linkUrl: string, currentFilePath: string, routesDir: string): string {
  // Keep hash if present
  const [urlWithoutHash, hash] = linkUrl.split('#');

  if (urlWithoutHash.startsWith('/')) {
    // Already absolute
    return linkUrl;
  }

  // Resolve the path
  const currentDir = path.dirname(currentFilePath);
  const resolvedPath = path.resolve(currentDir, urlWithoutHash);

  // Convert to route path (relative to routes dir)
  let routePath = path.relative(routesDir, resolvedPath);

  // Ensure it starts with /
  if (!routePath.startsWith('/')) {
    routePath = '/' + routePath;
  }

  // Remove +page.md if present
  routePath = routePath.replace(/\/\+page\.md$/, '');

  // Normalize by removing layout group segments (e.g., (content))
  routePath = normalizeRoutePath(routePath);

  // Add back hash if present
  return hash ? `${routePath}#${hash}` : routePath;
}

/**
 * Replace a link in markdown content
 */
export function replaceLink(content: string, oldLink: MarkdownLink, newUrl: string): string {
  const newLinkMarkdown = `[${oldLink.text}](${newUrl})`;
  return content.replace(oldLink.raw, newLinkMarkdown);
}
