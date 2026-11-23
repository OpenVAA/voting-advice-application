import { resolve } from 'node:path';
import type { StaticSettings } from '@openvaa/app-shared';
import type { Plugin } from 'vite';

/** The settings the theme transform reads. */
type ThemeSettings = Pick<StaticSettings, 'colors' | 'font'>;

/** The two DaisyUI themes `app.css` defines. */
type ThemeName = keyof StaticSettings['colors'];

/** A colour key of one theme in `StaticSettings.colors`. */
type ColorKey = keyof StaticSettings['colors']['light'];

/**
 * The DaisyUI theme variables each colour key of `StaticSettings.colors` sets. Every variable listed here must occur exactly once in each `@plugin 'daisyui/theme'` block of `app.css`.
 */
const THEME_DECLARATIONS: Readonly<Record<Exclude<ColorKey, 'line-color'>, ReadonlyArray<string>>> = {
  primary: ['--color-primary', '--color-success'],
  'primary-content': ['--color-primary-content', '--color-success-content'],
  secondary: ['--color-secondary'],
  'secondary-content': ['--color-secondary-content'],
  accent: ['--color-accent', '--color-info'],
  'accent-content': ['--color-accent-content', '--color-info-content'],
  neutral: ['--color-neutral'],
  'neutral-content': ['--color-neutral-content'],
  'base-100': ['--color-base-100'],
  'base-200': ['--color-base-200'],
  'base-300': ['--color-base-300'],
  'base-content': ['--color-base-content'],
  warning: ['--color-warning', '--color-error'],
  'warning-content': ['--color-warning-content', '--color-error-content']
};

/** The fallback families written after the first family of `--font-base` for a serif font, before the emoji families. */
const SERIF_FALLBACK = "ui-serif, Georgia, Cambria, 'Times New Roman', Times, serif, ";

/** The first emoji family of `--font-base`, where its fallback list ends. */
const FIRST_EMOJI_FAMILY = "'Apple Color Emoji'";

/** A span of text in a string. */
type Span = { start: number; end: number };

/**
 * Options of {@link applyThemeToAppCss}.
 */
export type ApplyThemeToAppCssOptions = {
  /** The text of `app.css`. */
  css: string;
  /** The settings whose colours and font are written into the CSS. */
  settings: ThemeSettings;
};

/**
 * Write the colours and font of `settings` into the text of `app.css`: both DaisyUI theme blocks, the `--line-color` of the `[data-theme]` blocks and the first family and fallback list of `--font-base`.
 *
 * Only the value of a known declaration is replaced, so with settings equal to the literals in `app.css` the result is the input unchanged. A mapped declaration that is missing or duplicated throws, naming the declaration and the theme, so a change to `app.css` that the transform no longer understands fails the build. The values are spliced in as they are: the function relies on `StaticSettingsSchema` having validated every colour as six-digit hex and the font name against its character set.
 * @param options - The CSS and the settings.
 * @returns The CSS with the settings' values written in.
 */
export function applyThemeToAppCss({ css, settings }: ApplyThemeToAppCssOptions): string {
  let out = css;
  for (const theme of ['light', 'dark'] as const) {
    out = replaceInBlock({
      css: out,
      block: findThemeBlock(out, theme),
      theme,
      values: themeValues(settings.colors[theme])
    });
    out = replaceInBlock({
      css: out,
      block: findSelectorBlock(out, `[data-theme='${theme}']`, theme),
      theme,
      values: [['--line-color', settings.colors[theme]['line-color']]]
    });
  }
  return applyFont(out, settings.font);
}

/**
 * Options of {@link instanceTheme}.
 */
export type InstanceThemeOptions = {
  /** The absolute path of `app.css`, the only module the plugin transforms. */
  appCssPath: string;
  /** The settings whose colours and font are written into `app.css`. */
  settings: ThemeSettings;
};

/**
 * A Vite plugin that writes the colours and font of the merged static settings into `app.css` with {@link applyThemeToAppCss}. It is `enforce: 'pre'` and must be listed before Tailwind, so that the DaisyUI themes are compiled from the transformed text.
 * @param options - The path of `app.css` and the settings.
 * @returns The Vite plugin.
 */
export function instanceTheme({ appCssPath, settings }: InstanceThemeOptions): Plugin {
  const target = resolve(appCssPath);
  return {
    name: 'openvaa:instance-theme',
    enforce: 'pre',
    transform(code, id) {
      if (resolve(id.split('?')[0]) !== target) return undefined;
      return { code: applyThemeToAppCss({ css: code, settings }), map: null };
    }
  };
}

/**
 * The declarations of one theme with the value each gets, `undefined` for an optional colour that is not set. Every mapped declaration is listed, set or not, so that each is checked for drift.
 * @param colors - The colours of the theme.
 * @returns Pairs of a declaration name and its value.
 */
function themeValues(colors: StaticSettings['colors'][ThemeName]): Array<[string, string | undefined]> {
  return (
    Object.entries(THEME_DECLARATIONS) as Array<[keyof typeof THEME_DECLARATIONS, ReadonlyArray<string>]>
  ).flatMap(([key, names]) => names.map((name): [string, string | undefined] => [name, colors[key]]));
}

/**
 * Find the body of the single `@plugin 'daisyui/theme'` block named `theme`.
 * @param css - The CSS to search.
 * @param theme - The theme name.
 * @returns The span of the block body.
 */
function findThemeBlock(css: string, theme: ThemeName): Span {
  const blocks = [...css.matchAll(/@plugin 'daisyui\/theme' \{([^}]*)\}/g)].filter((m) =>
    m[1].includes(`name: '${theme}';`)
  );
  if (blocks.length !== 1)
    throw new Error(`app.css must have exactly one DaisyUI theme block named '${theme}', found ${blocks.length}`);
  return bodySpan(blocks[0]);
}

/**
 * Find the body of the single rule whose selector list ends with `selector`.
 * @param css - The CSS to search.
 * @param selector - The last selector of the rule.
 * @param theme - The theme the rule belongs to, for the error message.
 * @returns The span of the rule body.
 */
function findSelectorBlock(css: string, selector: string, theme: ThemeName): Span {
  const blocks = [...css.matchAll(new RegExp(`${escapeRegExp(selector)}\\s*\\{([^}]*)\\}`, 'g'))];
  if (blocks.length !== 1)
    throw new Error(`app.css must have exactly one ${selector} block for the '${theme}' theme, found ${blocks.length}`);
  return bodySpan(blocks[0]);
}

/**
 * The span of the first capture group of a block match.
 * @param match - A match whose first group is the block body and ends one character before the match.
 * @returns The span of the body.
 */
function bodySpan(match: RegExpExecArray | RegExpMatchArray): Span {
  const end = (match.index ?? 0) + match[0].length - 1;
  return { start: end - match[1].length, end };
}

/**
 * Replace the values of declarations inside one block, requiring each declaration to occur exactly once there.
 * @param options - The CSS, the block span, the theme for error messages, and the declaration values; an `undefined` value is checked but left as it is.
 * @returns The CSS with the values replaced.
 */
function replaceInBlock({
  css,
  block,
  theme,
  values
}: {
  css: string;
  block: Span;
  theme: ThemeName;
  values: ReadonlyArray<[string, string | undefined]>;
}): string {
  let body = css.slice(block.start, block.end);
  for (const [name, value] of values) {
    const matches = [...body.matchAll(new RegExp(`(?<![\\w-])${escapeRegExp(name)}:\\s*([^;]*);`, 'g'))];
    if (matches.length !== 1)
      throw new Error(
        `app.css must declare ${name} exactly once in the '${theme}' theme, found ${matches.length}: the instance theme transform cannot set it`
      );
    const [match] = matches;
    const valueEnd = (match.index ?? 0) + match[0].length - 1;
    const valueStart = valueEnd - match[1].length;
    if (value === undefined || match[1] === value) continue;
    body = body.slice(0, valueStart) + value + body.slice(valueEnd);
  }
  return css.slice(0, block.start) + body + css.slice(block.end);
}

/**
 * Write the font family name, and for a serif font the serif fallback list, into the single `--font-base` declaration.
 * @param css - The CSS.
 * @param font - The font settings.
 * @returns The CSS with `--font-base` updated.
 */
function applyFont(css: string, font: ThemeSettings['font']): string {
  const matches = [...css.matchAll(/(?<![\w-])--font-base:([^;]*);/g)];
  if (matches.length !== 1) throw new Error(`app.css must declare --font-base exactly once, found ${matches.length}`);
  const [match] = matches;
  const valueStart = (match.index ?? 0) + match[0].length - 1 - match[1].length;
  const value = match[1];
  const family = value.match(/'[^']*'/);
  if (!family || family.index === undefined)
    throw new Error('app.css --font-base must start with a quoted family name');
  const familyEnd = family.index + family[0].length;
  let rest = value.slice(familyEnd);
  if (font.style === 'serif') {
    const emoji = rest.indexOf(FIRST_EMOJI_FAMILY);
    if (emoji === -1)
      throw new Error(`app.css --font-base must end with the emoji families from ${FIRST_EMOJI_FAMILY}`);
    rest = `, ${SERIF_FALLBACK}${rest.slice(emoji)}`;
  }
  const newValue = `${value.slice(0, family.index)}'${font.name}'${rest}`;
  if (newValue === value) return css;
  return css.slice(0, valueStart) + newValue + css.slice(valueStart + value.length);
}

/**
 * Escape `text` for use as a literal inside a regular expression.
 * @param text - The literal text.
 * @returns The escaped text.
 */
function escapeRegExp(text: string): string {
  return text.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}
