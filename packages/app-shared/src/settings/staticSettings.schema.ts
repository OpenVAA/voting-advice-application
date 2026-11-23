import { z } from 'zod';
import type { StaticSettings } from './staticSettings.type';

/**
 * A six-digit hex colour, e.g. `#2546a8`, the form the shipped settings use. The values are written into CSS, so this format is also what keeps a colour from escaping its declaration.
 */
const HexColorSchema = z.string().regex(/^#[0-9a-fA-F]{6}$/, 'Expected a six-digit hex colour, e.g. #2546a8');

/**
 * Characters that may not appear in an asset URL, because the URL is written into HTML attributes and CSS `url()` values.
 */
const UNSAFE_URL_CHARACTERS = /[\s"'<>()\\]/;

/**
 * A `..` path segment.
 */
const PARENT_SEGMENT = /(^|\/)\.\.(\/|$)/;

/**
 * An asset URL: either a same-origin absolute path (a single leading `/`, no `..` segment) or an `https:` URL, in both cases free of whitespace, quotes, angle brackets, parentheses and backslashes.
 */
const AssetUrlSchema = z
  .string()
  .refine(isSafeAssetUrl, 'Expected a same-origin path starting with a single / or an https: URL');

/**
 * A plain font family name: letters, digits, spaces, `_` and `-`, unquoted and without surrounding whitespace.
 */
const FontNameSchema = z
  .string()
  .regex(/^[A-Za-z0-9 _-]+$/, 'Expected an unquoted font family name of letters, digits, spaces, _ and -')
  .refine((name) => name.trim() === name, 'Expected no leading or trailing whitespace');

/**
 * The colours of one theme: the nine required keys and the six optional `*-content` keys.
 */
const ThemeColorsSchema = z.strictObject({
  primary: HexColorSchema,
  secondary: HexColorSchema,
  accent: HexColorSchema,
  neutral: HexColorSchema,
  'base-100': HexColorSchema,
  'base-200': HexColorSchema,
  'base-300': HexColorSchema,
  warning: HexColorSchema,
  'line-color': HexColorSchema,
  'primary-content': HexColorSchema.optional(),
  'secondary-content': HexColorSchema.optional(),
  'accent-content': HexColorSchema.optional(),
  'neutral-content': HexColorSchema.optional(),
  'base-content': HexColorSchema.optional(),
  'warning-content': HexColorSchema.optional()
});

/**
 * One element of `supportedLocales`.
 */
const LocaleSchema = z.strictObject({
  code: z.string().min(1),
  name: z.string().min(1),
  isDefault: z.boolean().optional()
});

/**
 * The validation schema of {@link StaticSettings}.
 *
 * It is strict at every level, array elements and each `dataAdapter` variant included, so a mistyped key fails instead of being ignored. `resolveStaticSettings` validates the merged settings with it, which is how an instance overlay is checked at build time. {@link StaticSettingsSchemaParity} keeps the schema equal to the type.
 */
export const StaticSettingsSchema = z.strictObject({
  /** Settings related to the administrative functions. */
  admin: z.strictObject({
    /** The admin email of the application. */
    email: z.email()
  }),
  /** The version of the app and the handling of saved user data. */
  appVersion: z.strictObject({
    /** The current version of the app. */
    version: z.number().int().nonnegative(),
    /** Saved user data of a lower version is reset. */
    requireUserDataVersion: z.number().int().nonnegative(),
    /** The url of the source code for the app. */
    source: z.url()
  }),
  /** The data adapter, one of the two variants. */
  dataAdapter: z.discriminatedUnion('type', [
    z.strictObject({
      type: z.literal('local'),
      supportsContestantApp: z.literal(false),
      supportsAdminApp: z.literal(false),
      pageSize: z.number().int().positive()
    }),
    z.strictObject({
      type: z.literal('supabase'),
      supportsContestantApp: z.literal(true),
      supportsAdminApp: z.literal(true),
      pageSize: z.number().int().positive()
    })
  ]),
  /** The light and dark theme colours. */
  colors: z.strictObject({
    /** The light (default) theme. */
    light: ThemeColorsSchema,
    /** The dark theme. */
    dark: ThemeColorsSchema
  }),
  /** The main font. */
  font: z.strictObject({
    /** The plain font family name. */
    name: FontNameSchema,
    /** The download url of the font. */
    url: AssetUrlSchema,
    /** The fallback font family. */
    style: z.enum(['sans', 'serif']).optional()
  }),
  /** The supported locales, at least one and at most one of them the default. */
  supportedLocales: z
    .array(LocaleSchema)
    .min(1)
    .refine(
      (locales) => locales.filter((locale) => locale.isDefault === true).length <= 1,
      'supportedLocales may mark at most one locale as isDefault'
    )
    .readonly(),
  /** The static fallback logo. */
  logo: z
    .strictObject({
      /** The logo for a light background. */
      url: AssetUrlSchema,
      /** The logo for a dark background. */
      urlDark: AssetUrlSchema.optional()
    })
    .optional()
});

/**
 * Whether two types are assignable to each other.
 */
type MutuallyAssignable<TA, TB> = [TA] extends [TB] ? ([TB] extends [TA] ? true : false) : false;

/**
 * `TValue` with every property at every depth made required, so that comparing two such types also compares their optional keys: a type with an optional key and one without it are assignable to each other, but their required forms are not.
 */
type DeepRequired<TValue> =
  TValue extends ReadonlyArray<infer TElement>
    ? ReadonlyArray<DeepRequired<TElement>>
    : TValue extends object
      ? { [TKey in keyof TValue]-?: DeepRequired<TValue[TKey]> }
      : TValue;

/**
 * Compiles only when `TValue` is `true`.
 */
type Expect<TValue extends true> = TValue;

/**
 * A compile-time check that {@link StaticSettingsSchema} describes exactly {@link StaticSettings}: a member added to, removed from or retyped in only one of the two, optional members included, fails `typecheck` here.
 */
export type StaticSettingsSchemaParity = [
  Expect<MutuallyAssignable<z.infer<typeof StaticSettingsSchema>, StaticSettings>>,
  Expect<MutuallyAssignable<DeepRequired<z.infer<typeof StaticSettingsSchema>>, DeepRequired<StaticSettings>>>
];

/**
 * Whether `url` is a same-origin absolute path or an `https:` URL containing none of {@link UNSAFE_URL_CHARACTERS}.
 */
function isSafeAssetUrl(url: string): boolean {
  if (UNSAFE_URL_CHARACTERS.test(url)) return false;
  if (url.startsWith('/')) return !url.startsWith('//') && !PARENT_SEGMENT.test(url);
  try {
    return new URL(url).protocol === 'https:';
  } catch {
    return false;
  }
}
