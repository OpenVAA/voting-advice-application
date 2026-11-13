/**
 * The deployment templates name the variables a production start needs, and `identity-callback` declares its JWT setting.
 *
 * The production server refuses to start without `PUBLIC_PROJECT_ID` and `ORIGIN`, and it reads `ADDRESS_HEADER` and `XFF_DEPTH` to find the client address behind a proxy. This suite specifies where each of the four is written down:
 *
 * - `render.example.yaml` declares all four as `envVars` entries.
 * - `docker-compose.dev.yml` passes all four with a default, so an unset variable never reaches the container as an empty string by accident.
 * - `.env.example` lists the three proxy variables as commented lines only. CI copies that file to `.env` and Compose reads `.env`, so a live `ORIGIN` there would reach the production test image and make it refuse every form post.
 * - `apps/supabase/supabase/config.toml` declares `verify_jwt = false` for `identity-callback`, which verifies the identity provider's token itself.
 *
 * It lives in this package because `yarn test:unit` runs per workspace and this package already reads repository-root files from its tests.
 */

import { readFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';

const HERE = dirname(fileURLToPath(import.meta.url));
/** `packages/dev-seed/tests` → repo root. */
const REPO_ROOT = resolve(HERE, '../../..');

/** The variables adapter-node reads to place the server behind a proxy. */
const PROXY_VARIABLES: Array<string> = ['ORIGIN', 'ADDRESS_HEADER', 'XFF_DEPTH'];
/** Everything a template that starts the production server has to name. */
const SERVER_VARIABLES: Array<string> = ['PUBLIC_PROJECT_ID', ...PROXY_VARIABLES];

function read(path: string): string {
  return readFileSync(resolve(REPO_ROOT, path), 'utf8');
}

function capture(text: string, pattern: RegExp): Array<string> {
  return [...text.matchAll(pattern)].map((m) => m[1]);
}

/**
 * The entries of the first `environment:` map in a Compose file: the lines indented deeper than the key itself.
 */
function composeEnvironment(text: string): Array<string> {
  const lines = text.split('\n');
  const start = lines.findIndex((line) => /^\s*environment:\s*$/.test(line));
  if (start === -1) return [];
  const indent = lines[start].search(/\S/);
  const entries: Array<string> = [];
  for (const line of lines.slice(start + 1)) {
    if (line.trim() === '') continue;
    if (line.search(/\S/) <= indent) break;
    entries.push(line.trim());
  }
  return entries;
}

/**
 * The entries that pass `name` with a default, in the form `NAME: ${NAME:-default}`. The default may be empty. A bare `${NAME}` is not such an entry: Compose substitutes an empty string for it when the variable is unset.
 */
function composeEntriesWithDefault(entries: Array<string>, name: string): Array<string> {
  const pattern = new RegExp(`^${name}: \\$\\{${name}:-[^}]*\\}$`);
  return entries.filter((entry) => pattern.test(entry));
}

/**
 * The lines of an env file that assign `name`, as dotenv and Compose both read them: optional leading whitespace and an optional `export`.
 */
function liveLines(text: string, name: string): Array<string> {
  return capture(text, new RegExp(`^([ \\t]*(?:export[ \\t]+)?${name}[ \\t]*=.*)$`, 'gm'));
}

/** The lines of an env file that list `name` commented out, in the form `# NAME=value`. */
function commentedLines(text: string, name: string): Array<string> {
  return capture(text, new RegExp(`^(# ${name}=.*)$`, 'gm'));
}

describe('deployment templates', () => {
  describe('render.example.yaml', () => {
    const text = read('render.example.yaml');

    it('is read and is not empty', () => {
      expect(text.trim().length).toBeGreaterThan(0);
    });

    it.each(SERVER_VARIABLES)('declares - key: %s', (name) => {
      expect(capture(text, new RegExp(`^[ \\t]*(- key: ${name})(?=\\s|$)`, 'gm')).length).toBeGreaterThan(0);
    });
  });

  describe('docker-compose.dev.yml', () => {
    const text = read('docker-compose.dev.yml');
    const entries = composeEnvironment(text);

    it('is read and has an environment map with entries', () => {
      expect(text.trim().length).toBeGreaterThan(0);
      expect(entries.length).toBeGreaterThan(0);
    });

    it.each(SERVER_VARIABLES)('passes %s with a default', (name) => {
      expect(composeEntriesWithDefault(entries, name).length).toBeGreaterThan(0);
    });

    it('keeps the shape of the PUBLIC_SUPABASE_URL entry', () => {
      expect(capture(text, /PUBLIC_SUPABASE_URL:\s*\$\{PUBLIC_SUPABASE_URL:-([^}]+)\}/g)).toHaveLength(1);
    });

    it('does not count a bare substitution as an entry with a default', () => {
      expect(composeEntriesWithDefault(['ORIGIN: ${ORIGIN}'], 'ORIGIN')).toEqual([]);
      expect(composeEntriesWithDefault(['ORIGIN: ${ORIGIN:-}'], 'ORIGIN')).toHaveLength(1);
    });
  });

  describe('.env.example', () => {
    const text = read('.env.example');

    it('is read and is not empty', () => {
      expect(text.trim().length).toBeGreaterThan(0);
    });

    it.each(PROXY_VARIABLES)('lists %s as a commented line', (name) => {
      expect(commentedLines(text, name).length).toBeGreaterThan(0);
    });

    it.each(PROXY_VARIABLES)('has no live line for %s', (name) => {
      expect(liveLines(text, name)).toEqual([]);
    });

    it('recognises a live line, and does not take a commented one for it', () => {
      expect(liveLines('ORIGIN=https://vaa.example.org\n', 'ORIGIN')).toHaveLength(1);
      expect(liveLines('  export ORIGIN = https://vaa.example.org\n', 'ORIGIN')).toHaveLength(1);
      expect(liveLines('# ORIGIN=https://vaa.example.org\n', 'ORIGIN')).toEqual([]);
    });
  });

  describe('apps/supabase/supabase/config.toml', () => {
    const text = read('apps/supabase/supabase/config.toml');
    const section = text.split(/^\[/m).find((candidate) => candidate.startsWith('functions.identity-callback]'));

    it('is read and is not empty', () => {
      expect(text.trim().length).toBeGreaterThan(0);
    });

    it('declares a [functions.identity-callback] section', () => {
      expect(section).toBeDefined();
    });

    it('assigns verify_jwt = false in the [functions.identity-callback] section', () => {
      expect(capture(section ?? '', /^verify_jwt\s*=\s*(\S+)/gm)).toEqual(['false']);
    });
  });
});
