#!/usr/bin/env tsx
/**
 * Validate the links of the docs site.
 *
 * Finding classes:
 * - `md-link`: every internal markdown link in a `.md` file under `src/routes` resolves to a page or a static asset
 * - `github-path`: every GitHub source link (`https://github.com/OpenVAA/voting-advice-application/(blob|tree)/main/<path>`)
 *   in a `.md` or `.svelte` file under `src` names a file or directory tracked by git
 *
 * Modes:
 * - default: also rewrites relative markdown links to absolute ones in place (run by `generate:docs`)
 * - `--check`: report only; no file is written, and a markdown link that lands on a redirect stub is a finding
 *
 * Options:
 * - `--only <class,…>`: report only the named classes
 * - `--scope <route>` (repeatable): report only findings in the page at that route; a value ending in `/**` matches the
 *   route and every route below it. Findings in files that are not route pages are dropped.
 *
 * Exit codes: 0 no findings, 1 findings, 2 usage error.
 */
import * as fs from 'fs/promises';
import { glob } from 'glob';
import * as path from 'path';
import {
  checkGithubSourceLink,
  extractGithubSourceLinks,
  extractMarkdownLinks,
  getRepoRoot,
  isHashLink,
  isInternalLink,
  LINK_CHECK_CLASSES,
  listTrackedPaths,
  makeAbsoluteLink,
  parseStubTarget,
  replaceLink,
  resolvePage,
  routeOfFile,
  ROUTES_DIR,
  splitHash
} from './utils/links';
import { findMarkdownFiles } from './utils/routes';
import type { BrokenLink, LinkCheckClass, MarkdownLink } from './utils/links';

const SRC_DIR = path.join(ROUTES_DIR, '..');

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
    findings: []
  };

  // Markdown links are processed in default mode even when not reported, because that pass also rewrites relative links
  if (!options.check || options.only.has('md-link')) await validateMarkdownLinks(options, result);
  if (options.only.has('github-path')) await validateGithubSourceLinks(result);

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

/**
 * Validate the internal markdown links of every `.md` file under `src/routes`. In default mode, relative links that resolve are rewritten to absolute ones.
 */
async function validateMarkdownLinks(options: CliOptions, result: ValidationResult): Promise<void> {
  const mdFiles = await findMarkdownFiles(ROUTES_DIR);
  result.markdownFiles = mdFiles.length;
  for (const filePath of mdFiles) {
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
    if (isHashLink(link.url)) continue;

    const route = splitHash(makeAbsoluteLink(link.url, filePath, ROUTES_DIR)).path;
    const page = await resolvePage(route);

    if (page.kind === 'none') {
      result.findings.push({ file, link, kind: 'md-link', reason: `Target not found: ${route}` });
      continue;
    }
    if (page.kind === 'stub' && options.check) {
      const source = await fs.readFile(page.file!, 'utf-8');
      const { target, error } = parseStubTarget(source);
      result.findings.push({
        file,
        link,
        kind: 'md-link',
        reason: `Targets redirect stub → ${target ?? `(invalid stub: ${error})`}; link the final URL`
      });
      continue;
    }
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
 * Print validation summary
 */
function printSummary(result: ValidationResult, reported: Array<BrokenLink>, options: CliOptions): void {
  console.info('\n' + '='.repeat(60));
  console.info('VALIDATION SUMMARY');
  console.info('='.repeat(60));
  console.info(`Markdown files:    ${result.markdownFiles}`);
  console.info(`Internal links:    ${result.internalLinks}`);
  console.info(`Fixed links:       ${result.fixedLinks}`);
  console.info(`Source files:      ${result.sourceFiles} (.md and .svelte under src, GitHub links)`);
  console.info(`GitHub links:      ${result.githubLinks}`);
  if (options.scopes.length > 0)
    console.info(`Scope:             ${options.scopes.map((s) => s.route + (s.subtree ? '/**' : '')).join(', ')}`);
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
