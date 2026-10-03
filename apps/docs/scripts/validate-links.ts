#!/usr/bin/env tsx
/**
 * Validate the links of the docs site.
 *
 * Finding classes:
 * - `md-link`: every internal markdown link in a `.md` file under `src/routes` resolves to a page or a static asset
 * - `svelte-href`: every literal internal `href="/…"` in a `.svelte` file (or HTML in a `.md` file) under `src` resolves to a page or a static asset
 * - `nav-route`: every leaf item of `src/lib/navigation.config.ts` resolves to a page (section routes are prefixes, not links, and are not checked)
 * - `anchor`: every `#hash` of an internal link (markdown links, hrefs, same-page links, redirect stub targets) names an id on its target page
 * - `stub`: every redirect stub (a route with only `+page.ts`) makes exactly one `redirect(301 | 308, '<literal>')` call to an internal route that is a page, not another stub
 * - `github-path`: every GitHub source link (`https://github.com/OpenVAA/voting-advice-application/(blob|tree)/main/<path>`) in a `.md` or `.svelte` file under `src` names a file or directory tracked by git
 * - `inbound`: every reference to the site from a tracked file outside `apps/docs` (an `openvaa.org` URL, with its `#hash`, or a repository path under `docs/src/routes`) resolves
 *
 * Modes:
 * - default: also rewrites relative markdown links to absolute ones in place (run by `generate:docs`)
 * - `--check`: report only; no file is written, and a link that lands on a redirect stub is a finding
 *
 * Options:
 * - `--only <class,…>`: report only the named classes
 * - `--scope <route>` (repeatable): report only findings in the page at that route; a value ending in `/**` matches the route and every route below it. Findings in files that are not route pages are dropped.
 *
 * Exit codes: 0 no findings, 1 findings, 2 usage error.
 */
import * as fs from 'fs/promises';
import { glob } from 'glob';
import * as path from 'path';
import {
  checkGithubSourceLink,
  collectHeadingIds,
  extractGithubSourceLinks,
  extractMarkdownLinks,
  extractSvelteHrefs,
  findInboundReferences,
  getRepoRoot,
  hasAnchor,
  isHashLink,
  isInternalLink,
  LINK_CHECK_CLASSES,
  listTrackedPaths,
  makeAbsoluteLink,
  normalizeRoutePath,
  parseStubTarget,
  replaceLink,
  resolvePage,
  routeOfFile,
  ROUTES_DIR,
  splitHash
} from './utils/links';
import { findMarkdownFiles } from './utils/routes';
import { navigation } from '../src/lib/navigation.config';
import type { NavigationItem, NavigationSection } from '../src/lib/navigation.type';
import type { BrokenLink, LinkCheckClass, MarkdownLink, PageResolution } from './utils/links';

const SRC_DIR = path.join(ROUTES_DIR, '..');
const NAVIGATION_CONFIG = path.join(SRC_DIR, 'lib', 'navigation.config.ts');
const DOCS_ROUTES_PREFIX = 'apps/docs/src/routes/';

interface CliOptions {
  check: boolean;
  only: Set<LinkCheckClass>;
  scopes: Array<{ route: string; subtree: boolean }>;
}

interface ValidationResult {
  markdownFiles: number;
  internalLinks: number;
  fixedLinks: number;
  sourceFiles: number;
  githubLinks: number;
  svelteHrefs: number;
  dynamicHrefs: number;
  navLeaves: number;
  stubs: number;
  anchors: number;
  inboundReferences: number;
  skippedPatterns: number;
  findings: Array<BrokenLink>;
}

class UsageError extends Error {}

/**
 * Main function
 */
async function main() {
  let options: CliOptions;
  try {
    options = parseArgs(process.argv.slice(2));
  } catch (error) {
    if (!(error instanceof UsageError)) throw error;
    console.error(`Usage error: ${error.message}`);
    console.error(
      'Usage: validate-links [--check] [--only <class,…>] [--scope <route>]…\n' +
        `Classes: ${LINK_CHECK_CLASSES.join(', ')}`
    );
    process.exitCode = 2;
    return;
  }

  console.info(
    `Validating docs links (${options.check ? 'check mode, no files are written' : 'default mode, relative links are rewritten'})...\n`
  );

  const result: ValidationResult = {
    markdownFiles: 0,
    internalLinks: 0,
    fixedLinks: 0,
    sourceFiles: 0,
    githubLinks: 0,
    svelteHrefs: 0,
    dynamicHrefs: 0,
    navLeaves: 0,
    stubs: 0,
    anchors: 0,
    inboundReferences: 0,
    skippedPatterns: 0,
    findings: []
  };
  function wants(...classes: Array<LinkCheckClass>): boolean {
    return classes.some((c) => options.only.has(c));
  }

  // In default mode the markdown pass always runs, because it also rewrites relative links
  if (!options.check || wants('md-link', 'anchor')) await validateMarkdownLinks(options, result);
  if (wants('svelte-href', 'anchor')) await validateSvelteHrefs(options, result);
  if (wants('nav-route')) await validateNavigation(result);
  if (wants('stub', 'anchor')) await validateStubs(result);
  if (wants('github-path')) await validateGithubSourceLinks(result);
  if (wants('inbound')) await validateInboundReferences(options, result);

  const reported = result.findings.filter((finding) => isReported(finding, options));
  printSummary(result, reported, options);

  process.exitCode = reported.length > 0 ? 1 : 0;
}

/**
 * Parse the command line arguments.
 * @throws UsageError on an unknown argument or class
 */
function parseArgs(args: Array<string>): CliOptions {
  const options: CliOptions = { check: false, only: new Set(LINK_CHECK_CLASSES), scopes: [] };
  for (let i = 0; i < args.length; i++) {
    const [flag, inlineValue] = args[i].startsWith('--') ? splitOnce(args[i], '=') : [args[i], undefined];
    if (flag === '--check' && inlineValue === undefined) {
      options.check = true;
    } else if (flag === '--only' || flag === '--scope') {
      const value = inlineValue ?? args[++i];
      if (!value || value.startsWith('--')) throw new UsageError(`${flag} needs a value`);
      if (flag === '--only') options.only = parseClasses(value);
      else options.scopes.push(parseScope(value));
    } else {
      throw new UsageError(`unknown argument ${args[i]}`);
    }
  }
  return options;
}

function splitOnce(value: string, separator: string): [string, string | undefined] {
  const index = value.indexOf(separator);
  return index === -1 ? [value, undefined] : [value.slice(0, index), value.slice(index + 1)];
}

function parseClasses(value: string): Set<LinkCheckClass> {
  const classes = new Set<LinkCheckClass>();
  for (const name of value.split(',').map((s) => s.trim())) {
    if (!(LINK_CHECK_CLASSES as ReadonlyArray<string>).includes(name))
      throw new UsageError(`unknown class "${name}"; valid classes are ${LINK_CHECK_CLASSES.join(', ')}`);
    classes.add(name as LinkCheckClass);
  }
  return classes;
}

function parseScope(value: string): { route: string; subtree: boolean } {
  const subtree = value.endsWith('/**');
  const trimmed = (subtree ? value.slice(0, -3) : value).replace(/\/+$/, '');
  return { route: `/${trimmed.replace(/^\/+/, '')}`, subtree };
}

/**
 * Whether a finding passes the `--only` and `--scope` filters.
 */
function isReported(finding: BrokenLink, options: CliOptions): boolean {
  if (!options.only.has(finding.kind)) return false;
  if (options.scopes.length === 0) return true;
  const route = routeOfFile(path.join(getRepoRoot(), finding.file));
  if (!route) return false;
  return options.scopes.some(
    (scope) =>
      route === scope.route || (scope.subtree && route.startsWith(scope.route === '/' ? '/' : `${scope.route}/`))
  );
}

function repoRelative(filePath: string): string {
  return path.relative(getRepoRoot(), filePath);
}

function isPage(page: PageResolution): boolean {
  return page.kind === 'page-md' || page.kind === 'page-svelte';
}

/**
 * The reason a link landing on a redirect stub is a finding, naming the stub's own target.
 */
async function stubReason(stubFile: string): Promise<string> {
  const { target, error } = parseStubTarget(await fs.readFile(stubFile, 'utf-8'));
  return `Targets redirect stub → ${target ?? `(invalid stub: ${error})`}; link the final URL`;
}

/**
 * Check that `hash` names an id on the page file, pushing a finding of class `kind` if not.
 */
async function checkAnchor(
  result: ValidationResult,
  finding: Omit<BrokenLink, 'reason'>,
  pageFile: string,
  hash: string
): Promise<void> {
  if (!hash) return;
  result.anchors++;
  let ids: Set<string>;
  try {
    ids = await collectHeadingIds(pageFile);
  } catch (error) {
    result.findings.push({ ...finding, reason: `Cannot collect the ids of ${repoRelative(pageFile)}: ${error}` });
    return;
  }
  if (!hasAnchor(ids, hash))
    result.findings.push({ ...finding, reason: `No id "${hash}" on ${repoRelative(pageFile)}` });
}

/**
 * Validate the internal markdown links of every `.md` file under `src/routes`, and the `#hash` of each. In default mode, relative links that resolve are rewritten to absolute ones.
 */
async function validateMarkdownLinks(options: CliOptions, result: ValidationResult): Promise<void> {
  const mdFiles = await findMarkdownFiles(ROUTES_DIR);
  result.markdownFiles = mdFiles.length;
  for (const filePath of mdFiles.sort()) {
    await validateMarkdownFile(filePath, options, result);
  }
}

async function validateMarkdownFile(filePath: string, options: CliOptions, result: ValidationResult): Promise<void> {
  const content = await fs.readFile(filePath, 'utf-8');
  const internalLinks = extractMarkdownLinks(content).filter((link) => isInternalLink(link.url));
  if (internalLinks.length === 0) return;

  result.internalLinks += internalLinks.length;
  const file = repoRelative(filePath);
  const resolvable = new Array<MarkdownLink>();

  for (const link of internalLinks) {
    if (isHashLink(link.url)) {
      await checkAnchor(result, { file, link, kind: 'anchor' }, filePath, link.url.slice(1));
      continue;
    }

    const { path: route, hash } = splitHash(makeAbsoluteLink(link.url, filePath, ROUTES_DIR));
    const page = await resolvePage(route);

    if (page.kind === 'none') {
      result.findings.push({ file, link, kind: 'md-link', reason: `Target not found: ${route}` });
      continue;
    }
    if (page.kind === 'stub' && options.check) {
      result.findings.push({ file, link, kind: 'md-link', reason: await stubReason(page.file!) });
      continue;
    }
    if (isPage(page)) await checkAnchor(result, { file, link, kind: 'anchor' }, page.file!, hash);
    resolvable.push(link);
  }

  if (!options.check) {
    let modifiedContent = content;
    let hasChanges = false;
    for (const link of resolvable) {
      if (link.url.startsWith('/')) continue;
      const absoluteUrl = makeAbsoluteLink(link.url, filePath, ROUTES_DIR);
      if (absoluteUrl !== link.url) {
        modifiedContent = replaceLink(modifiedContent, link, absoluteUrl);
        hasChanges = true;
        result.fixedLinks++;
      }
    }
    if (hasChanges) {
      await fs.writeFile(filePath, modifiedContent, 'utf-8');
      console.info(`✓ Fixed links in: ${file}`);
    }
  }
}

/**
 * Validate the literal internal `href`s of every `.svelte` file under `src` (and HTML `href`s in `.md` files), and the `#hash` of each.
 */
async function validateSvelteHrefs(options: CliOptions, result: ValidationResult): Promise<void> {
  const files = await glob('**/*.{svelte,md}', { cwd: SRC_DIR, ignore: ['**/node_modules/**'], absolute: true });
  for (const filePath of files.sort()) {
    const file = repoRelative(filePath);
    const { hrefs, dynamic } = extractSvelteHrefs(await fs.readFile(filePath, 'utf-8'));
    result.svelteHrefs += hrefs.length;
    result.dynamicHrefs += dynamic;
    for (const link of hrefs) {
      const { path: route, hash } = splitHash(link.url);
      const page = await resolvePage(route);
      if (page.kind === 'none') {
        result.findings.push({ file, link, kind: 'svelte-href', reason: `Target not found: ${route}` });
      } else if (page.kind === 'stub') {
        if (options.check)
          result.findings.push({ file, link, kind: 'svelte-href', reason: await stubReason(page.file!) });
      } else if (isPage(page)) {
        await checkAnchor(result, { file, link, kind: 'anchor' }, page.file!, hash);
      }
    }
  }
}

/**
 * Validate that every leaf item of the navigation resolves to a page. Section routes only mark the active section and are not links.
 */
async function validateNavigation(result: ValidationResult): Promise<void> {
  const file = repoRelative(NAVIGATION_CONFIG);
  const configLines = (await fs.readFile(NAVIGATION_CONFIG, 'utf-8')).split('\n');
  const leaves = new Array<NavigationItem>();
  collectLeaves(navigation, leaves);
  result.navLeaves = leaves.length;

  for (const item of leaves) {
    const page = await resolvePage(item.route);
    if (isPage(page)) continue;
    const lineIndex = configLines.findIndex((line) => line.includes(`'${item.route}'`));
    const link: MarkdownLink = { text: item.title, url: item.route, line: lineIndex + 1, column: 1, raw: item.route };
    const reason =
      page.kind === 'stub'
        ? await stubReason(page.file!)
        : page.kind === 'asset'
          ? `Navigation leaf resolves to a file, not a page: ${repoRelative(page.file!)}`
          : `Navigation leaf has no page: ${item.route}`;
    result.findings.push({ file, link, kind: 'nav-route', reason });
  }
}

function collectLeaves(items: Array<NavigationSection | NavigationItem>, leaves: Array<NavigationItem>): void {
  for (const item of items) {
    if ('children' in item) collectLeaves(item.children, leaves);
    else leaves.push(item);
  }
}

/**
 * Validate every redirect stub: a route directory holding `+page.ts` and no page file.
 */
async function validateStubs(result: ValidationResult): Promise<void> {
  const stubFiles = await glob('**/+page.ts', { cwd: ROUTES_DIR, absolute: true });
  for (const stubFile of stubFiles.sort()) {
    const dir = path.dirname(stubFile);
    const entries = await fs.readdir(dir);
    if (entries.includes('+page.md') || entries.includes('+page.svelte')) continue;
    result.stubs++;

    const file = repoRelative(stubFile);
    const source = await fs.readFile(stubFile, 'utf-8');
    const callLine = source.split('\n').findIndex((line) => /\bredirect\s*\(/.test(line)) + 1;
    const parsed = parseStubTarget(source);
    const link: MarkdownLink = {
      text: '',
      url: parsed.target ?? '(none)',
      line: Math.max(callLine, 1),
      column: 1,
      raw: ''
    };
    if (parsed.error !== undefined) {
      result.findings.push({ file, link, kind: 'stub', reason: `Invalid redirect stub: ${parsed.error}` });
      continue;
    }

    const { path: targetRoute, hash } = splitHash(parsed.target);
    const page = await resolvePage(targetRoute);
    if (page.kind === 'stub') {
      result.findings.push({
        file,
        link,
        kind: 'stub',
        reason: `Redirect chain: the target is itself a redirect stub (${repoRelative(page.file!)})`
      });
    } else if (!isPage(page)) {
      result.findings.push({ file, link, kind: 'stub', reason: `Redirect target is not a page: ${targetRoute}` });
    } else {
      await checkAnchor(result, { file, link, kind: 'anchor' }, page.file!, hash);
    }
  }
}

/**
 * Validate every GitHub source link in the `.md` and `.svelte` files under `src` against the files tracked by git.
 */
async function validateGithubSourceLinks(result: ValidationResult): Promise<void> {
  const tracked = listTrackedPaths();
  const files = await glob('**/*.{md,svelte}', { cwd: SRC_DIR, ignore: ['**/node_modules/**'], absolute: true });
  result.sourceFiles = files.length;
  for (const filePath of files.sort()) {
    const content = await fs.readFile(filePath, 'utf-8');
    for (const link of extractGithubSourceLinks(content)) {
      result.githubLinks++;
      const reason = checkGithubSourceLink(link.url, tracked);
      if (reason) result.findings.push({ file: repoRelative(filePath), link, kind: 'github-path', reason });
    }
  }
}

/**
 * Validate every reference to the site from tracked files outside `apps/docs`. A public URL must land on a page (in check mode a redirect stub is a finding, as in-repo references should name the final URL) and its `#hash` must name an id there; a repository path must be tracked.
 */
async function validateInboundReferences(options: CliOptions, result: ValidationResult): Promise<void> {
  const tracked = listTrackedPaths();
  const { references, skippedPatterns } = findInboundReferences();
  result.inboundReferences = references.length;
  result.skippedPatterns = skippedPatterns;

  for (const reference of references) {
    const finding: Omit<BrokenLink, 'reason'> = {
      file: reference.file,
      link: { text: '', url: reference.target, line: reference.line, column: reference.column, raw: reference.target },
      kind: 'inbound'
    };
    const { path: target, hash } = splitHash(reference.target);

    if (reference.type === 'site-url') {
      const route = target.replace(/\/+$/, '') || '/';
      const page = await resolvePage(route);
      if (page.kind === 'stub') {
        if (options.check) result.findings.push({ ...finding, reason: await stubReason(page.file!) });
      } else if (!isPage(page)) {
        result.findings.push({ ...finding, reason: `No page at ${route}` });
      } else {
        await checkAnchor(result, finding, page.file!, hash);
      }
      continue;
    }

    const repoPath = target.replace(/^\/+/, '');
    if (!tracked.files.has(repoPath) && !tracked.dirs.has(repoPath)) {
      result.findings.push({ ...finding, reason: `Not a tracked file or directory: ${repoPath}` });
    } else if (repoPath.startsWith(DOCS_ROUTES_PREFIX) && tracked.dirs.has(repoPath)) {
      const page = await resolvePage(normalizeRoutePath(repoPath.slice(DOCS_ROUTES_PREFIX.length)));
      if (page.kind === 'stub' && options.check)
        result.findings.push({ ...finding, reason: await stubReason(page.file!) });
    } else if (hash && /\/\+page\.(md|svelte)$/.test(repoPath)) {
      await checkAnchor(result, finding, path.join(getRepoRoot(), repoPath), hash);
    }
  }
}

/**
 * Print validation summary
 */
function printSummary(result: ValidationResult, reported: Array<BrokenLink>, options: CliOptions): void {
  console.info('\n' + '='.repeat(60));
  console.info('VALIDATION SUMMARY');
  console.info('='.repeat(60));
  console.info(`Markdown files:       ${result.markdownFiles}`);
  console.info(`Internal md links:    ${result.internalLinks}`);
  console.info(`Fixed links:          ${result.fixedLinks}`);
  console.info(`Literal hrefs:        ${result.svelteHrefs} (dynamic, not checked: ${result.dynamicHrefs})`);
  console.info(`Navigation leaves:    ${result.navLeaves}`);
  console.info(`Redirect stubs:       ${result.stubs}`);
  console.info(`Anchors checked:      ${result.anchors}`);
  console.info(`Source files:         ${result.sourceFiles} (scanned for GitHub links)`);
  console.info(`GitHub links:         ${result.githubLinks}`);
  console.info(`Inbound references:   ${result.inboundReferences} (patterns skipped: ${result.skippedPatterns})`);
  if (options.scopes.length > 0)
    console.info(`Scope:                ${options.scopes.map((s) => s.route + (s.subtree ? '/**' : '')).join(', ')}`);
  console.info('='.repeat(60));

  if (reported.length > 0) {
    console.info('\nFINDINGS:');

    const byFile = new Map<string, Array<BrokenLink>>();
    for (const finding of reported) {
      if (!byFile.has(finding.file)) byFile.set(finding.file, []);
      byFile.get(finding.file)!.push(finding);
    }

    for (const [file, findings] of byFile) {
      console.info(`\n${file}:`);
      for (const finding of findings) {
        console.info(`  [${finding.kind}] ${file}:${finding.link.line}`);
        console.info(`    ${finding.link.text ? `[${finding.link.text}](${finding.link.url})` : finding.link.url}`);
        console.info(`    → ${finding.reason}`);
      }
    }
    console.info('');
  }

  console.info('Findings by class:');
  for (const kind of LINK_CHECK_CLASSES) {
    if (!options.only.has(kind)) continue;
    console.info(`  ${kind}: ${reported.filter((f) => f.kind === kind).length}`);
  }
  console.info(`Total findings: ${reported.length}`);
}

main().catch((error) => {
  console.error('Error validating links:', error);
  process.exit(1);
});
