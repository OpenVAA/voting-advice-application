// @vitest-environment node

// The node environment is required: this file imports `vite`, which loads esbuild, and esbuild asserts `new TextEncoder().encode('') instanceof Uint8Array`. Under jsdom the encoder comes from another realm, the assertion fails and the suite does not collect.
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { mergeSettings, staticSettings } from '@openvaa/app-shared';
import { describe, expect, it } from 'vitest';
import { applyThemeToAppCss, instanceTheme } from './vite.instanceTheme';
import type { DeepPartial, StaticSettings } from '@openvaa/app-shared';
import type { Plugin } from 'vite';

const appCssPath = fileURLToPath(new URL('./src/app.css', import.meta.url));
const appCss = readFileSync(appCssPath, 'utf8');

const SERIF_FALLBACK = "ui-serif, Georgia, Cambria, 'Times New Roman', Times, serif";
const EMOJI_FAMILIES = "'Apple Color Emoji', 'Segoe UI Emoji', 'Segoe UI Symbol', 'Noto Color Emoji'";

/** The shipped settings with `override` merged over them. */
function withOverride(override: DeepPartial<StaticSettings>): StaticSettings {
  return mergeSettings(staticSettings, override) as StaticSettings;
}

/** The lines of `after` that differ from the line at the same index of `before`, which must have as many lines. */
function changedLines(before: string, after: string): Array<string> {
  const beforeLines = before.split('\n');
  const afterLines = after.split('\n');
  expect(afterLines).toHaveLength(beforeLines.length);
  return afterLines.filter((line, i) => line !== beforeLines[i]);
}

/** The text of the `@plugin 'daisyui/theme'` block named `theme` in `css`. */
function themeBlock(css: string, theme: 'light' | 'dark'): string {
  const block = css.match(/@plugin 'daisyui\/theme' \{[^}]*\}/g)?.find((b) => b.includes(`name: '${theme}';`));
  if (!block) throw new Error(`no ${theme} theme block`);
  return block;
}

/** The value of `--font-base` in `css`, with its whitespace collapsed. */
function fontBase(css: string): string {
  const match = css.match(/--font-base:([^;]*);/);
  if (!match) throw new Error('no --font-base');
  return match[1].replace(/\s+/g, ' ').trim();
}

/** Run the plugin's `transform` hook, whichever hook form the plugin uses. */
function transform(plugin: Plugin, code: string, id: string): unknown {
  const hook = plugin.transform;
  if (!hook) throw new Error('the plugin has no transform hook');
  const handler = typeof hook === 'function' ? hook : hook.handler;
  return handler.call({} as never, code, id);
}

describe('applyThemeToAppCss', () => {
  it('returns app.css byte-for-byte unchanged with the shipped settings', () => {
    expect(applyThemeToAppCss({ css: appCss, settings: staticSettings })).toBe(appCss);
  });

  it('sets a light primary on --color-primary and --color-success of the light theme only', () => {
    const out = applyThemeToAppCss({
      css: appCss,
      settings: withOverride({ colors: { light: { primary: '#123456' } } })
    });
    expect(changedLines(appCss, out)).toEqual(['  --color-primary: #123456;', '  --color-success: #123456;']);
    expect(themeBlock(out, 'light')).toContain('--color-primary: #123456;');
    expect(themeBlock(out, 'dark')).toBe(themeBlock(appCss, 'dark'));
  });

  it('maps accent to --color-accent and --color-info, and warning to --color-warning and --color-error', () => {
    const out = applyThemeToAppCss({
      css: appCss,
      settings: withOverride({ colors: { dark: { accent: '#111111', warning: '#222222' } } })
    });
    expect(changedLines(appCss, out).sort()).toEqual(
      [
        '  --color-accent: #111111;',
        '  --color-info: #111111;',
        '  --color-warning: #222222;',
        '  --color-error: #222222;'
      ].sort()
    );
    expect(themeBlock(out, 'light')).toBe(themeBlock(appCss, 'light'));
  });

  it('sets a dark line-color only in the dark data-theme block', () => {
    const out = applyThemeToAppCss({
      css: appCss,
      settings: withOverride({ colors: { dark: { 'line-color': '#abcdef' } } })
    });
    expect(changedLines(appCss, out)).toEqual(['  --line-color: #abcdef;']);
    expect(out).toMatch(/\[data-theme='dark'\] \{\n {2}--line-color: #abcdef;/);
    expect(out).toContain('--line-color: #d9d9d9;');
  });

  it('sets an optional content colour on both of its declarations and leaves them when absent', () => {
    const out = applyThemeToAppCss({
      css: appCss,
      settings: withOverride({ colors: { light: { 'warning-content': '#000000' } } })
    });
    expect(changedLines(appCss, out)).toEqual([
      '  --color-warning-content: #000000;',
      '  --color-error-content: #000000;'
    ]);
    expect(themeBlock(out, 'dark')).toBe(themeBlock(appCss, 'dark'));
    expect(themeBlock(appCss, 'light')).toContain('--color-warning-content: #ffffff;');
  });

  it('replaces only the first family of --font-base for a sans font', () => {
    const out = applyThemeToAppCss({
      css: appCss,
      settings: withOverride({ font: { name: 'Open Sans', style: 'sans' } })
    });
    expect(changedLines(appCss, out)).toHaveLength(1);
    expect(fontBase(out)).toBe(fontBase(appCss).replace("'Inter'", "'Open Sans'"));
    expect(fontBase(out).startsWith("'Open Sans', system-ui,")).toBe(true);
  });

  it('writes the serif fallback list followed by the emoji families for a serif font', () => {
    const out = applyThemeToAppCss({
      css: appCss,
      settings: withOverride({ font: { name: 'Merriweather', style: 'serif' } })
    });
    expect(fontBase(out)).toBe(`'Merriweather', ${SERIF_FALLBACK}, ${EMOJI_FAMILIES}`);
    expect(out.replace(/--font-base:[^;]*;/, '')).toBe(appCss.replace(/--font-base:[^;]*;/, ''));
  });

  it('throws naming the declaration and theme when a mapped declaration is missing', () => {
    const drifted = appCss.replace('  --color-accent: #11a8a0;\n', '');
    expect(drifted).not.toBe(appCss);
    expect(() => applyThemeToAppCss({ css: drifted, settings: staticSettings })).toThrow(/--color-accent.*dark/);
  });

  it('throws naming the declaration and theme when a mapped declaration is duplicated', () => {
    const drifted = appCss.replace(
      '  --color-accent: #11a8a0;\n',
      '  --color-accent: #11a8a0;\n  --color-accent: #11a8a0;\n'
    );
    expect(drifted).not.toBe(appCss);
    expect(() => applyThemeToAppCss({ css: drifted, settings: staticSettings })).toThrow(/--color-accent.*dark/);
  });

  it('throws when a line-color declaration is missing from a data-theme block', () => {
    const drifted = appCss.replace('  --line-color: #262626;\n', '');
    expect(() => applyThemeToAppCss({ css: drifted, settings: staticSettings })).toThrow(/--line-color.*dark/);
  });
});

describe('instanceTheme', () => {
  const settings = withOverride({ colors: { light: { primary: '#123456' } } });
  const plugin = instanceTheme({ appCssPath, settings });

  it('is a pre plugin with a namespaced name', () => {
    expect(plugin.name).toBe('openvaa:instance-theme');
    expect(plugin.enforce).toBe('pre');
  });

  it('leaves every other module alone', () => {
    expect(transform(plugin, appCss, fileURLToPath(new URL('./src/other.css', import.meta.url)))).toBeUndefined();
  });

  it('transforms the app.css id with and without a query suffix', () => {
    const expected = { code: applyThemeToAppCss({ css: appCss, settings }), map: null };
    expect(transform(plugin, appCss, appCssPath)).toEqual(expected);
    expect(transform(plugin, appCss, `${appCssPath}?direct`)).toEqual(expected);
    expect((expected.code as string).includes('--color-primary: #123456;')).toBe(true);
  });
});
