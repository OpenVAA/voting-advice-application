/**
 * The three environment templates name the five analytics variables the frontend server reads at start.
 *
 * - `.env.example` sets the provider to `log`, so a local stack and the CI gate suite, both built from this file, see analytics events as structured server lines. The code default stays `none`. The PostHog key appears only as a commented line with no value: CI copies this file to `.env`, and a tracked key would be a leaked secret.
 * - `render.example.yaml` declares all five, and the key entry uses `sync: false` with no `value:`, so the secret is entered in the Render dashboard only.
 * - `docker-compose.dev.yml` passes all five through with a default, the provider defaulting to `none` as in the code.
 * - No template names a `PUBLIC_ANALYTICS` variable: the analytics configuration is private to the server, and the browser receives only the projection the root load returns.
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

const ANALYTICS_VARIABLES: Array<string> = [
  'ANALYTICS_PROVIDER',
  'ANALYTICS_CONSENT_MODE',
  'ANALYTICS_VISIT_ID_MODE',
  'ANALYTICS_POSTHOG_KEY',
  'ANALYTICS_POSTHOG_HOST'
];

const TEMPLATES: Array<string> = ['.env.example', 'render.example.yaml', 'docker-compose.dev.yml'];

function read(path: string): string {
  return readFileSync(resolve(REPO_ROOT, path), 'utf8');
}

/**
 * The lines of an env file that assign `name`, as dotenv and Compose both read them: optional leading whitespace and an optional `export`.
 */
function liveLines(text: string, name: string): Array<string> {
  return [...text.matchAll(new RegExp(`^([ \\t]*(?:export[ \\t]+)?${name}[ \\t]*=.*)$`, 'gm'))].map((m) => m[1]);
}

/** The live lines that give `name` a non-empty value, quotes aside. */
function liveLinesWithValue(text: string, name: string): Array<string> {
  return liveLines(text, name).filter((line) => {
    const value = line.slice(line.indexOf('=') + 1).trim();
    return value.replace(/^(['"])(.*)\1$/, '$2').trim() !== '';
  });
}

/**
 * The lines of the `- key: name` entry in a Render blueprint: the key line and the lines indented deeper than its dash that follow it.
 */
function renderEntry(text: string, name: string): Array<string> | undefined {
  const lines = text.split('\n');
  const start = lines.findIndex((line) => new RegExp(`^[ \\t]*- key: ${name}(?=\\s|$)`).test(line));
  if (start === -1) return undefined;
  const indent = lines[start].search(/\S/);
  const entry = [lines[start]];
  for (const line of lines.slice(start + 1)) {
    if (line.trim() === '' || line.search(/\S/) <= indent) break;
    entry.push(line);
  }
  return entry;
}

/** The Compose entries that pass `name` through, in the form `NAME: ${NAME:-default}`, as their defaults. */
function composeDefaults(text: string, name: string): Array<string> {
  return [...text.matchAll(new RegExp(`^[ \\t]*${name}: \\$\\{${name}:-([^}]*)\\}[ \\t]*$`, 'gm'))].map((m) => m[1]);
}

describe('analytics variables in the environment templates', () => {
  describe('.env.example', () => {
    const text = read('.env.example');

    it('sets ANALYTICS_PROVIDER=log on one live line', () => {
      expect(liveLines(text, 'ANALYTICS_PROVIDER')).toEqual(['ANALYTICS_PROVIDER=log']);
    });

    it.each(ANALYTICS_VARIABLES)('names %s', (name) => {
      expect(text).toMatch(new RegExp(`^[ \\t#]*${name}=`, 'm'));
    });

    it('gives ANALYTICS_POSTHOG_KEY no value on a live line', () => {
      expect(liveLinesWithValue(text, 'ANALYTICS_POSTHOG_KEY')).toEqual([]);
    });

    it('recognises a live line with a value, and does not take an empty or commented one for it', () => {
      expect(liveLinesWithValue('ANALYTICS_POSTHOG_KEY=phc_x\n', 'ANALYTICS_POSTHOG_KEY')).toHaveLength(1);
      expect(liveLinesWithValue('ANALYTICS_POSTHOG_KEY=""\n', 'ANALYTICS_POSTHOG_KEY')).toEqual([]);
      expect(liveLinesWithValue('# ANALYTICS_POSTHOG_KEY=phc_x\n', 'ANALYTICS_POSTHOG_KEY')).toEqual([]);
    });
  });

  describe('render.example.yaml', () => {
    const text = read('render.example.yaml');

    it.each(ANALYTICS_VARIABLES)('declares - key: %s', (name) => {
      expect(renderEntry(text, name)).toBeDefined();
    });

    it('declares ANALYTICS_POSTHOG_KEY with sync: false and no value', () => {
      const entry = renderEntry(text, 'ANALYTICS_POSTHOG_KEY') ?? [];
      expect(entry[1]?.trim()).toBe('sync: false');
      expect(entry.some((line) => /^\s*value:/.test(line))).toBe(false);
    });
  });

  describe('docker-compose.dev.yml', () => {
    const text = read('docker-compose.dev.yml');

    it.each(ANALYTICS_VARIABLES)('passes %s through with a default', (name) => {
      expect(composeDefaults(text, name)).toHaveLength(1);
    });

    it('defaults ANALYTICS_PROVIDER to none, as the code does', () => {
      expect(composeDefaults(text, 'ANALYTICS_PROVIDER')).toEqual(['none']);
    });
  });

  it.each(TEMPLATES)('%s names no PUBLIC_ANALYTICS variable', (path) => {
    expect(read(path)).not.toMatch(/PUBLIC_ANALYTICS/);
  });
});
