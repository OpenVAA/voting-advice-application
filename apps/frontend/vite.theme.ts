import { existsSync, readFileSync, writeFileSync } from 'node:fs';
import type { StaticSettings } from '@openvaa/app-shared';
import type { Plugin } from 'vite';

/** The settings the theme is built from. */
export type ThemeSettings = Pick<StaticSettings, 'colors' | 'font'>;

type ThemeName = keyof StaticSettings['colors'];

/** The emoji fonts, appended to every font stack. */
const EMOJI_FONTS = ["'Apple Color Emoji'", "'Segoe UI Emoji'", "'Segoe UI Symbol'", "'Noto Color Emoji'"];

/** The fallback fonts for each `font.style`. */
const FONT_FALLBACKS: Record<NonNullable<StaticSettings['font']['style']>, Array<string>> = {
  sans: [
    'system-ui',
    '-apple-system',
    'BlinkMacSystemFont',
    "'Segoe UI'",
    'Roboto',
    "'Helvetica Neue'",
    'Arial',
    "'Noto Sans'",
    'sans-serif'
  ],
  serif: ['ui-serif', 'Georgia', 'Cambria', "'Times New Roman'", 'Times', 'serif']
};

/** The theme-level DaisyUI variables shared by both themes. */
const SHARED_THEME_VARIABLES: Array<[string, string]> = [
  ['--radius-box', '0.25rem'],
  ['--radius-field', '0.5rem'],
  ['--radius-selector', '0.5rem'],
  ['--border', '0px']
];

/** The DaisyUI preamble of each theme. */
const THEME_HEADERS: Record<ThemeName, Array<string>> = {
  light: ["name: 'light';", 'default: true;', 'color-scheme: light;'],
  dark: ["name: 'dark';", 'prefersdark: true;', 'color-scheme: dark;']
};

/**
 * The full DaisyUI palette of one theme. The settings define only the colours the app distinguishes; the rest are derived from them: `info` is `accent`, `success` is `primary`, `error` is `warning`, `base-content` is `neutral`, and every other `-content` colour is `base-100`.
 * @param colors - One theme's colours from `staticSettings.colors`.
 * @returns The `--color-*` declarations in DaisyUI's order.
 */
export function themeColors(colors: StaticSettings['colors'][ThemeName]): Array<[string, string]> {
  const content = colors['base-100'];
  return [
    ['primary', colors.primary],
    ['primary-content', content],
    ['secondary', colors.secondary],
    ['secondary-content', content],
    ['accent', colors.accent],
    ['accent-content', content],
    ['neutral', colors.neutral],
    ['neutral-content', content],
    ['base-100', colors['base-100']],
    ['base-200', colors['base-200']],
    ['base-300', colors['base-300']],
    ['base-content', colors.neutral],
    ['info', colors.accent],
    ['info-content', content],
    ['success', colors.primary],
    ['success-content', content],
    ['warning', colors.warning],
    ['warning-content', content],
    ['error', colors.warning],
    ['error-content', content]
  ];
}

/**
 * The font stack of `--font-base`: the configured font, the fallbacks of its style and the emoji fonts. A name that is not already quoted is quoted.
 * @param font - `staticSettings.font`.
 */
export function fontStack(font: StaticSettings['font']): string {
  const name = /^['"]/.test(font.name) ? font.name : `'${font.name.replaceAll("'", "\\'")}'`;
  return [name, ...FONT_FALLBACKS[font.style ?? 'sans'], ...EMOJI_FONTS].join(', ');
}

function themeBlock(name: ThemeName, colors: StaticSettings['colors'][ThemeName]): string {
  const lines = [
    ...THEME_HEADERS[name],
    ...themeColors(colors).map(([key, value]) => `--color-${key}: ${value};`),
    ...SHARED_THEME_VARIABLES.map(([key, value]) => `${key}: ${value};`)
  ];
  return `@plugin 'daisyui/theme' {\n${lines.map((line) => `  ${line}`).join('\n')}\n}`;
}

function customVariablesBlock(selector: string, colors: StaticSettings['colors'][ThemeName]): string {
  return [
    `${selector} {`,
    `  --line-color: ${colors['line-color']};`,
    '  --progress-color: var(--color-neutral);',
    '  --progress-label-color: var(--color-neutral);',
    '}'
  ].join('\n');
}

/**
 * Build the theme stylesheet from the static settings: the light and dark DaisyUI themes, the custom per-theme variables and the font family tokens.
 *
 * The `@theme` block clears Tailwind's `--font-*` namespace before defining the two font tokens, so it must be imported after `tailwindcss` and before any other `--font-*` token.
 * @param settings - The `colors` and `font` of `staticSettings`.
 * @returns The CSS source.
 */
export function buildThemeCss({ colors, font }: ThemeSettings): string {
  return [
    '/* Generated from `staticSettings` by `apps/frontend/vite.theme.ts`. Do not edit. */',
    '',
    themeBlock('light', colors.light),
    '',
    themeBlock('dark', colors.dark),
    '',
    customVariablesBlock(":root,\n[data-theme='light']", colors.light),
    customVariablesBlock("[data-theme='dark']", colors.dark),
    '',
    '@theme {',
    '  --font-*: initial;',
    `  --font-base: ${fontStack(font)};`,
    `  --font-emoji: ${EMOJI_FONTS.join(', ')};`,
    '}',
    ''
  ].join('\n');
}

/**
 * Write the theme stylesheet to `outFile` unless it already holds exactly that content, so an unchanged theme never touches the file's modification time.
 * @param outFile - The absolute path of the generated stylesheet.
 * @param settings - The `colors` and `font` of `staticSettings`.
 * @returns Whether the file was written.
 */
export function writeThemeCss(outFile: string, settings: ThemeSettings): boolean {
  const css = buildThemeCss(settings);
  if (existsSync(outFile) && readFileSync(outFile, 'utf8') === css) return false;
  writeFileSync(outFile, css);
  return true;
}

/**
 * A Vite plugin that writes the theme stylesheet `app.css` imports, built from `staticSettings`, when the config is resolved, before Tailwind reads any CSS. It runs for both `vite dev` and `vite build`; a change to the settings takes effect on the next server start.
 * @param outFile - The absolute path of the generated stylesheet.
 * @param settings - The `colors` and `font` of `staticSettings`.
 * @returns The Vite plugin.
 */
export function themeFromSettings(outFile: string, settings: ThemeSettings): Plugin {
  return {
    name: 'openvaa:theme-from-settings',
    enforce: 'pre',
    config() {
      writeThemeCss(outFile, settings);
    }
  };
}
