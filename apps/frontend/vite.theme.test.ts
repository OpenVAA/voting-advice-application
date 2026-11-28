// @vitest-environment node

import { mkdtempSync, readFileSync, rmSync, statSync, utimesSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { staticSettings } from '@openvaa/app-shared';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { buildThemeCss, fontStack, themeColors, themeFromSettings, writeThemeCss } from './vite.theme';
import type { Plugin } from 'vite';
import type { ThemeSettings } from './vite.theme';

/** The declarations of the `@plugin 'daisyui/theme'` block named `name`, in source order. */
function themeDeclarations(css: string, name: string): Array<string> {
  const block = css
    .split("@plugin 'daisyui/theme' {")
    .slice(1)
    .map((rest) => rest.slice(0, rest.indexOf('}')))
    .find((body) => body.includes(`name: '${name}';`));
  if (!block) throw new Error(`no theme named ${name}`);
  return block
    .split('\n')
    .map((line) => line.trim())
    .filter(Boolean);
}

/** Run the plugin's `config` hook, whichever hook form the plugin uses. */
function runConfigHook(plugin: Plugin): void {
  const hook = plugin.config;
  if (!hook) throw new Error('the plugin has no config hook');
  const handler = typeof hook === 'function' ? hook : hook.handler;
  void handler.call({} as never, {}, { command: 'build', mode: 'production' });
}

const LIGHT = staticSettings.colors.light;
const DARK = staticSettings.colors.dark;

describe('buildThemeCss with the default static settings', () => {
  const css = buildThemeCss(staticSettings);

  it('declares the light theme with its full palette', () => {
    expect(themeDeclarations(css, 'light')).toEqual([
      "name: 'light';",
      'default: true;',
      'color-scheme: light;',
      `--color-primary: ${LIGHT.primary};`,
      `--color-primary-content: ${LIGHT['base-100']};`,
      `--color-secondary: ${LIGHT.secondary};`,
      `--color-secondary-content: ${LIGHT['base-100']};`,
      `--color-accent: ${LIGHT.accent};`,
      `--color-accent-content: ${LIGHT['base-100']};`,
      `--color-neutral: ${LIGHT.neutral};`,
      `--color-neutral-content: ${LIGHT['base-100']};`,
      `--color-base-100: ${LIGHT['base-100']};`,
      `--color-base-200: ${LIGHT['base-200']};`,
      `--color-base-300: ${LIGHT['base-300']};`,
      `--color-base-content: ${LIGHT.neutral};`,
      `--color-info: ${LIGHT.accent};`,
      `--color-info-content: ${LIGHT['base-100']};`,
      `--color-success: ${LIGHT.primary};`,
      `--color-success-content: ${LIGHT['base-100']};`,
      `--color-warning: ${LIGHT.warning};`,
      `--color-warning-content: ${LIGHT['base-100']};`,
      `--color-error: ${LIGHT.warning};`,
      `--color-error-content: ${LIGHT['base-100']};`,
      '--radius-box: 0.25rem;',
      '--radius-field: 0.5rem;',
      '--radius-selector: 0.5rem;',
      '--border: 0px;'
    ]);
  });

  it('declares the dark theme as the one preferred in dark mode', () => {
    const declarations = themeDeclarations(css, 'dark');
    expect(declarations.slice(0, 3)).toEqual(["name: 'dark';", 'prefersdark: true;', 'color-scheme: dark;']);
    expect(declarations).toContain(`--color-primary: ${DARK.primary};`);
    expect(declarations).toContain(`--color-base-300: ${DARK['base-300']};`);
    expect(declarations).toContain(`--color-error: ${DARK.warning};`);
    expect(declarations).toContain(`--color-primary-content: ${DARK['base-100']};`);
  });

  it('sets the line colour of each theme', () => {
    expect(css).toContain(`:root,\n[data-theme='light'] {\n  --line-color: ${LIGHT['line-color']};`);
    expect(css).toContain(`[data-theme='dark'] {\n  --line-color: ${DARK['line-color']};`);
  });

  it('clears the font namespace and defines the base and emoji fonts', () => {
    expect(css).toContain(
      "@theme {\n  --font-*: initial;\n  --font-base: 'Inter', system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, 'Noto Sans', sans-serif, 'Apple Color Emoji', 'Segoe UI Emoji', 'Segoe UI Symbol', 'Noto Color Emoji';\n  --font-emoji: 'Apple Color Emoji', 'Segoe UI Emoji', 'Segoe UI Symbol', 'Noto Color Emoji';\n}"
    );
  });
});

describe('themeColors', () => {
  it('derives every colour the settings omit from the ones they define', () => {
    const colors = themeColors({
      primary: '#000001',
      secondary: '#000002',
      accent: '#000003',
      neutral: '#000004',
      'base-100': '#000005',
      'base-200': '#000006',
      'base-300': '#000007',
      warning: '#000008',
      'line-color': '#000009'
    });
    expect(Object.fromEntries(colors)).toMatchObject({
      info: '#000003',
      success: '#000001',
      error: '#000008',
      'base-content': '#000004',
      'primary-content': '#000005',
      'error-content': '#000005'
    });
    expect(colors.map(([name]) => name)).not.toContain('line-color');
  });
});

describe('fontStack', () => {
  it('uses the serif fallbacks for a serif font', () => {
    expect(fontStack({ name: 'Lora', url: '', style: 'serif' })).toMatch(
      /^'Lora', ui-serif, Georgia, .*serif, 'Apple Color Emoji'/
    );
  });

  it('keeps a name that is already quoted and quotes one with spaces', () => {
    expect(fontStack({ name: '"Open Sans"', url: '' })).toMatch(/^"Open Sans", system-ui,/);
    expect(fontStack({ name: 'Open Sans', url: '' })).toMatch(/^'Open Sans', system-ui,/);
  });
});

describe('writeThemeCss and the plugin', () => {
  let dir: string;
  let outFile: string;

  beforeEach(() => {
    dir = mkdtempSync(join(tmpdir(), 'openvaa-theme-'));
    outFile = join(dir, 'theme.generated.css');
  });

  afterEach(() => {
    rmSync(dir, { recursive: true, force: true });
  });

  it('writes the stylesheet, and leaves an up-to-date file untouched', () => {
    expect(writeThemeCss(outFile, staticSettings)).toBe(true);
    expect(readFileSync(outFile, 'utf8')).toBe(buildThemeCss(staticSettings));
    const past = new Date(2000, 0, 1);
    utimesSync(outFile, past, past);
    expect(writeThemeCss(outFile, staticSettings)).toBe(false);
    expect(statSync(outFile).mtime.getTime()).toBe(past.getTime());
  });

  it('rewrites a stale file when the settings change', () => {
    writeFileSync(outFile, buildThemeCss(staticSettings));
    const settings: ThemeSettings = {
      ...staticSettings,
      colors: { ...staticSettings.colors, light: { ...LIGHT, primary: '#123456' } }
    };
    expect(writeThemeCss(outFile, settings)).toBe(true);
    expect(readFileSync(outFile, 'utf8')).toContain('--color-primary: #123456;');
  });

  it('writes the stylesheet from its config hook, ahead of the other plugins', () => {
    const plugin = themeFromSettings(outFile, staticSettings);
    expect(plugin.name).toBe('openvaa:theme-from-settings');
    expect(plugin.enforce).toBe('pre');
    runConfigHook(plugin);
    expect(readFileSync(outFile, 'utf8')).toBe(buildThemeCss(staticSettings));
  });
});
