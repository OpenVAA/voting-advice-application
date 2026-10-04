/**
 * Utility functions for working with links in the docs site: markdown link extraction, the page model that decides what a route resolves to, and the GitHub source-path check.
 */
import { execFileSync, spawnSync } from 'child_process';
import * as fs from 'fs/promises';
import { compile } from 'mdsvex';
import * as path from 'path';
import { fileURLToPath } from 'url';
import { mdsvexOptions } from '../../mdsvex.config.js';
import type { Dirent } from 'fs';

/**
 * The docs workspace root (`apps/docs`).
 */
export const DOCS_DIR = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');

/**
 * The SvelteKit routes directory of the docs site.
 */
export const ROUTES_DIR = path.join(DOCS_DIR, 'src', 'routes');

/**
 * Files served as-is from the site root.
 */
export const STATIC_DIR = path.join(DOCS_DIR, 'static');

/**
 * The classes of findings the link checker reports.
 */
export const LINK_CHECK_CLASSES = [
  'md-link',
  'svelte-href',
  'nav-route',
  'anchor',
  'stub',
  'github-path',
  'inbound'
] as const;

export type LinkCheckClass = (typeof LINK_CHECK_CLASSES)[number];

export interface MarkdownLink {
  text: string;
  url: string;
  line: number;
  column: number;
  raw: string;
}

export interface BrokenLink {
  /**
   * Path of the file holding the link, relative to the repository root.
   */
  file: string;
  link: MarkdownLink;
  reason: string;
  kind: LinkCheckClass;
}

/**
 * What a route path resolves to:
 * - `page-md` / `page-svelte`: a directory with `+page.md` / `+page.svelte`
 * - `stub`: a directory with only `+page.ts`, i.e. a redirect stub
 * - `asset`: a file under `static/` or a plain file under `src/routes`
 * - `none`: nothing
 */
export type PageKind = 'page-md' | 'page-svelte' | 'stub' | 'asset' | 'none';

export interface PageResolution {
  kind: PageKind;
  /**
   * The page file, stub file or asset file the route resolved to.
   */
  file?: string;
}

/**
 * The repository paths tracked by git.
 */
export interface TrackedPaths {
  files: Set<string>;
  /**
   * Every directory that contains a tracked file, at any depth.
   */
  dirs: Set<string>;
}

/**
 * Extract all markdown links from content Matches [text](url) and [text](<url>) formats
 */
export function extractMarkdownLinks(content: string): Array<MarkdownLink> {
  const links: Array<MarkdownLink> = [];
  // Match both [text](url) and [text](<url>) formats The second format allows parentheses in the URL
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
 * Split a URL into its path and its `#hash` (without the `#`). A `?query` is dropped.
 */
export function splitHash(url: string): { path: string; hash: string } {
  const hashIndex = url.indexOf('#');
  const beforeHash = hashIndex === -1 ? url : url.slice(0, hashIndex);
  const hash = hashIndex === -1 ? '' : url.slice(hashIndex + 1);
  const queryIndex = beforeHash.indexOf('?');
  return { path: queryIndex === -1 ? beforeHash : beforeHash.slice(0, queryIndex), hash };
}

/**
 * Convert a path relative to `src/routes` to its URL route by dropping layout groups (segments in parentheses), e.g.
 * `(content)/about/features` becomes `/about/features`.
 */
export function normalizeRoutePath(routePath: string): string {
  const segments = routePath.split(/[\\/]/).filter(Boolean);
  const filteredSegments = segments.filter((segment) => !isLayoutGroup(segment) && segment !== '.');
  return filteredSegments.length > 0 ? `/${filteredSegments.join('/')}` : '/';
}

/**
 * The URL route of a route file (`+page.md`, `+page.svelte` or `+page.ts` under `src/routes`), or `undefined` for any other file.
 * @param filePath An absolute path
 */
export function routeOfFile(filePath: string, routesDir = ROUTES_DIR): string | undefined {
  const relativePath = path.relative(routesDir, filePath);
  if (relativePath.startsWith('..') || path.isAbsolute(relativePath)) return undefined;
  if (!['+page.md', '+page.svelte', '+page.ts'].includes(path.basename(relativePath))) return undefined;
  return normalizeRoutePath(path.dirname(relativePath));
}

const dirCache = new Map<string, Promise<Array<Dirent>>>();

function readDirCached(dir: string): Promise<Array<Dirent>> {
  let entries = dirCache.get(dir);
  if (!entries) {
    entries = fs.readdir(dir, { withFileTypes: true }).catch(() => []);
    dirCache.set(dir, entries);
  }
  return entries;
}

function isLayoutGroup(name: string): boolean {
  return name.startsWith('(') && name.endsWith(')');
}

/**
 * Collect every directory or file under `dir` that matches the URL segments, descending into layout groups without consuming a segment.
 */
async function matchRoute(
  dir: string,
  segments: Array<string>,
  index: number,
  out: Array<{ path: string; isFile: boolean }>
): Promise<void> {
  if (index === segments.length) out.push({ path: dir, isFile: false });
  for (const entry of await readDirCached(dir)) {
    const entryPath = path.join(dir, entry.name);
    if (entry.isDirectory() && isLayoutGroup(entry.name)) {
      await matchRoute(entryPath, segments, index, out);
    } else if (index < segments.length && entry.name === segments[index]) {
      if (entry.isDirectory()) await matchRoute(entryPath, segments, index + 1, out);
      else if (index === segments.length - 1) out.push({ path: entryPath, isFile: true });
    }
  }
}

function safeDecode(value: string): string {
  try {
    return decodeURIComponent(value);
  } catch {
    return value;
  }
}

const PAGE_KIND_RANK: Record<PageKind, number> = { 'page-md': 4, 'page-svelte': 3, stub: 2, asset: 1, none: 0 };

/**
 * Resolve a URL route path (e.g. `/developers-guide/quick-start`) to what the site serves there. A `#hash` or `?query` is ignored. Layout groups are searched at every level.
 */
export async function resolvePage(routePath: string, routesDir = ROUTES_DIR): Promise<PageResolution> {
  const segments = splitHash(routePath).path.split('/').filter(Boolean).map(safeDecode);
  if (segments.some((segment) => segment === '.' || segment === '..')) return { kind: 'none' };

  const candidates: Array<{ path: string; isFile: boolean }> = [];
  await matchRoute(routesDir, segments, 0, candidates);

  let best: PageResolution = { kind: 'none' };
  for (const candidate of candidates) {
    let resolution: PageResolution = { kind: 'none' };
    if (candidate.isFile) {
      resolution = { kind: 'asset', file: candidate.path };
    } else {
      const names = new Set((await readDirCached(candidate.path)).filter((e) => e.isFile()).map((e) => e.name));
      if (names.has('+page.md')) resolution = { kind: 'page-md', file: path.join(candidate.path, '+page.md') };
      else if (names.has('+page.svelte'))
        resolution = { kind: 'page-svelte', file: path.join(candidate.path, '+page.svelte') };
      else if (names.has('+page.ts')) resolution = { kind: 'stub', file: path.join(candidate.path, '+page.ts') };
    }
    if (PAGE_KIND_RANK[resolution.kind] > PAGE_KIND_RANK[best.kind]) best = resolution;
  }
  if (best.kind !== 'none' || segments.length === 0) return best;

  const staticFile = path.join(STATIC_DIR, ...segments);
  try {
    if ((await fs.stat(staticFile)).isFile()) return { kind: 'asset', file: staticFile };
  } catch {
    // Not a static asset either
  }
  return best;
}

/**
 * The result of parsing a redirect stub's `+page.ts`: either its target or why it is not a valid stub.
 */
export type StubTarget = { target: string; error?: undefined } | { target?: undefined; error: string };

/**
 * Parse the source of a redirect stub. A valid stub makes exactly one call `redirect(301 | 308, '<target>')` whose target is a single string literal starting with a single `/` (an internal route, no scheme, no `//`).
 */
export function parseStubTarget(source: string): StubTarget {
  const calls = source.match(/\bredirect\s*\(/g) ?? [];
  if (calls.length === 0) return { error: 'no redirect() call' };
  if (calls.length > 1) return { error: `${calls.length} redirect() calls, expected exactly one` };
  const match = source.match(/\bredirect\s*\(\s*(\d+)\s*,\s*(?:'([^'\\$`]*)'|"([^"\\$`]*)")\s*\)/);
  if (!match) return { error: 'the redirect target is not a single string literal' };
  const [, status, singleQuoted, doubleQuoted] = match;
  if (status !== '301' && status !== '308') return { error: `redirect status ${status}, expected 301 or 308` };
  const target = singleQuoted ?? doubleQuoted;
  if (!target.startsWith('/') || target.startsWith('//'))
    return { error: `redirect target ${target} is not an internal route` };
  return { target };
}

let repoRoot: string | undefined;

/**
 * The repository root, from `git rev-parse --show-toplevel`.
 */
export function getRepoRoot(): string {
  repoRoot ??= execFileSync('git', ['rev-parse', '--show-toplevel'], { cwd: DOCS_DIR, encoding: 'utf-8' }).trim();
  return repoRoot;
}

/**
 * The files git tracks and every directory containing one, as repository-relative paths.
 */
export function listTrackedPaths(): TrackedPaths {
  const output = execFileSync('git', ['ls-files', '-z'], {
    cwd: getRepoRoot(),
    encoding: 'utf-8',
    maxBuffer: 256 * 1024 * 1024
  });
  const files = new Set(output.split('\0').filter(Boolean));
  const dirs = new Set<string>();
  for (const file of files) {
    let dir = path.posix.dirname(file);
    while (dir !== '.' && !dirs.has(dir)) {
      dirs.add(dir);
      dir = path.posix.dirname(dir);
    }
  }
  return { files, dirs };
}

const GITHUB_SOURCE_URL = /^https:\/\/github\.com\/OpenVAA\/voting-advice-application\/(?:blob|tree)\/main(?:\/|$)/;
const BARE_GITHUB_SOURCE_URL =
  /https:\/\/github\.com\/OpenVAA\/voting-advice-application\/(?:blob|tree)\/main(?:\/[^\s)<>"'`\]]*)?/g;
const HREF_ATTRIBUTE = /\bhref\s*=\s*(["'])(.*?)\1/g;

/**
 * Extract every GitHub source link (`https://github.com/OpenVAA/voting-advice-application/(blob|tree)/main/<path>`) from markdown or Svelte source: markdown links (including `[text](<url>)` URLs containing `)` or `[[`), `href` attributes and bare URLs. Each occurrence is reported once.
 */
export function extractGithubSourceLinks(content: string): Array<MarkdownLink> {
  const found: Array<MarkdownLink> = [];
  const lines = content.split('\n');

  for (let lineIndex = 0; lineIndex < lines.length; lineIndex++) {
    let line = lines[lineIndex];
    const lineNumber = lineIndex + 1;

    for (const link of extractMarkdownLinks(line)) {
      if (!GITHUB_SOURCE_URL.test(link.url)) continue;
      found.push({ ...link, line: lineNumber });
      line = maskSpan(line, link.column - 1, link.raw.length);
    }

    for (const match of line.matchAll(HREF_ATTRIBUTE)) {
      if (!GITHUB_SOURCE_URL.test(match[2])) continue;
      found.push({ text: '', url: match[2], line: lineNumber, column: match.index + 1, raw: match[0] });
      line = maskSpan(line, match.index, match[0].length);
    }

    for (const match of line.matchAll(BARE_GITHUB_SOURCE_URL)) {
      found.push({ text: '', url: match[0], line: lineNumber, column: match.index + 1, raw: match[0] });
    }
  }

  return found;
}

function maskSpan(line: string, start: number, length: number): string {
  return line.slice(0, start) + ' '.repeat(length) + line.slice(start + length);
}

/**
 * Check one GitHub source link against the tracked paths. The path is taken without `#…` / `?…` and a trailing `/`, and URL-decoded.
 * @returns The reason the link is dead, or `undefined` when it names a tracked file or directory.
 */
export function checkGithubSourceLink(url: string, tracked: TrackedPaths): string | undefined {
  const rawPath = splitHash(url.replace(GITHUB_SOURCE_URL, '')).path.replace(/\/+$/, '');
  let repoPath: string;
  try {
    repoPath = decodeURIComponent(rawPath);
  } catch {
    return `Malformed URL encoding in ${rawPath}`;
  }
  if (repoPath === '' || tracked.files.has(repoPath) || tracked.dirs.has(repoPath)) return undefined;
  return `Not a tracked file or directory: ${repoPath}`;
}

const headingIdCache = new Map<string, Promise<Set<string>>>();

/**
 * Collect the element ids a page offers as `#anchor` targets. A `+page.md` is compiled with the site's own mdsvex options, so the ids are the `rehype-slug` heading ids of the built page; a `.svelte` page offers its literal `id="…"` attributes.
 * @param pageFile An absolute path to a `+page.md` or `+page.svelte`
 * @throws If the page cannot be read or compiled
 */
export function collectHeadingIds(pageFile: string): Promise<Set<string>> {
  let ids = headingIdCache.get(pageFile);
  if (!ids) {
    ids = readHeadingIds(pageFile);
    headingIdCache.set(pageFile, ids);
  }
  return ids;
}

async function readHeadingIds(pageFile: string): Promise<Set<string>> {
  const source = await fs.readFile(pageFile, 'utf-8');
  let markup = source;
  if (pageFile.endsWith('.md')) {
    const compiled = await compile(source, mdsvexOptions);
    if (!compiled) throw new Error(`mdsvex returned no output for ${pageFile}`);
    markup = compiled.code;
  }
  return new Set([...markup.matchAll(/\sid\s*=\s*(?:"([^"{}]+)"|'([^'{}]+)')/g)].map((m) => m[1] ?? m[2]));
}

/**
 * Whether a `#hash` (without the `#`) names one of the ids, compared both as written and URL-decoded.
 */
export function hasAnchor(ids: Set<string>, hash: string): boolean {
  return ids.has(hash) || ids.has(safeDecode(hash));
}

/**
 * Extract the literal internal `href="/…"` / `href='/…'` attributes from Svelte or HTML markup. Dynamic `href={…}` values cannot be checked statically and are only counted.
 */
export function extractSvelteHrefs(source: string): { hrefs: Array<MarkdownLink>; dynamic: number } {
  const hrefs: Array<MarkdownLink> = [];
  let dynamic = 0;
  const lines = source.split('\n');
  for (let lineIndex = 0; lineIndex < lines.length; lineIndex++) {
    for (const match of lines[lineIndex].matchAll(/\bhref\s*=\s*(?:"([^"]*)"|'([^']*)'|\{)/g)) {
      const value = match[1] ?? match[2];
      if (value === undefined || value.includes('{')) {
        dynamic++;
        continue;
      }
      if (!value.startsWith('/') || value.startsWith('//')) continue;
      hrefs.push({ text: '', url: value, line: lineIndex + 1, column: match.index + 1, raw: match[0] });
    }
  }
  return { hrefs, dynamic };
}

/**
 * A reference to the docs site from a tracked file outside `apps/docs`.
 */
export interface InboundReference {
  /**
   * The referring file, relative to the repository root.
   */
  file: string;
  line: number;
  column: number;
  /**
   * The public URL (`site-url`) or the repository path (`repo-path`), possibly with a `#hash`.
   */
  target: string;
  type: 'site-url' | 'repo-path';
}

const SITE_URL =
  /https?:\/\/(?:www\.)?openvaa\.org(\/(?:about|developers-guide|publishers-guide)(?:[/?#][^\s)>"'`\]]*)?)/g;
const DOCS_REPO_PATH = /(?:apps\/)?docs\/src\/routes(?:\/(?:\([^()\s/]*\)|[^\s()<>"'`[\]/|]+))*\/?/g;

/**
 * Find every reference to the docs site in tracked files outside `apps/docs`, `.planning`, `yarn.lock` and `node_modules`: public `openvaa.org` URLs of the About, Developers' Guide and Publishers' Guide sections, and repository paths under `docs/src/routes`. Paths containing `...`, `*` or `{` are patterns rather than links; they are skipped and counted.
 */
export function findInboundReferences(): { references: Array<InboundReference>; skippedPatterns: number } {
  const grep = spawnSync(
    'git',
    [
      'grep',
      '-n',
      '-I',
      '--null',
      '-E',
      '-e',
      'https?://(www\\.)?openvaa\\.org/(about|developers-guide|publishers-guide)',
      '-e',
      'docs/src/routes',
      '--',
      '.',
      ':(exclude)apps/docs',
      ':(exclude).planning',
      ':(exclude)yarn.lock',
      ':(exclude)**/node_modules/**'
    ],
    { cwd: getRepoRoot(), encoding: 'utf-8', maxBuffer: 64 * 1024 * 1024 }
  );
  if (grep.status === 1) return { references: [], skippedPatterns: 0 };
  if (grep.status !== 0) throw new Error(`git grep failed (status ${grep.status}): ${grep.stderr}`);

  const references: Array<InboundReference> = [];
  let skippedPatterns = 0;
  for (const outputLine of grep.stdout.split('\n')) {
    if (!outputLine) continue;
    const [file, lineNumber, ...rest] = outputLine.split('\0');
    const content = rest.join('\0');
    const line = Number(lineNumber);

    for (const match of content.matchAll(SITE_URL)) {
      const target = match[1].replace(/[.,;:!]+$/, '');
      references.push({ file, line, column: match.index + 1, target, type: 'site-url' });
    }
    for (const match of content.matchAll(DOCS_REPO_PATH)) {
      if (/\.\.\.|\*|\{/.test(match[0])) {
        skippedPatterns++;
        continue;
      }
      const target = match[0].replace(/[.,;:!]+$/, '').replace(/\/+$/, '');
      references.push({ file, line, column: match.index + 1, target, type: 'repo-path' });
    }
  }
  return { references, skippedPatterns };
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
