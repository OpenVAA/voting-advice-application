import { clsx } from 'clsx';
import { extendTailwindMerge } from 'tailwind-merge';
import type { ClassValue } from 'clsx';

/**
 * ────────────────────────────────────────────────────────────────────────────────────────────────
 * THE MERGE CONFIGURATION — its source of truth is the `@theme` block of `apps/frontend/src/app.css`.
 * ────────────────────────────────────────────────────────────────────────────────────────────────
 *
 * `app.css` does not EXTEND Tailwind's theme, it REPLACES it: the `@theme` block opens by clearing the defaults outright (`--spacing-*: initial`, `--radius-*: initial`, `--text-*: initial`, …) and then defines scales that mix numeric and WORD names. `tailwind-merge` ships with Tailwind's default scales, so out of the box it misgroups a measurable slice of this project's vocabulary. Both failure directions are real here and were measured before this configuration was written:
 *
 *  - FALSE POSITIVE, a class is silently DROPPED. `border-md` is this project's 1px border WIDTH. It is not a number, so the unconfigured border-width group cannot claim it and it falls through to the permissive border-COLOUR group — where a later, genuine colour evicts it. `Toggle.svelte` passes `border-md border-neutral` in one literal and would lose its border with no caller involved.
 *  - FALSE NEGATIVE, a genuine conflict is NOT merged. `gap-md` vs `gap-lg`, `p-2` vs `p-md`, `pl-safelgl` vs `pl-0`: the word-named side is unrecognised, both survive, and the outcome falls back to Tailwind's source order.
 *
 * STANDING MAINTENANCE OBLIGATION, accepted knowingly when this was adopted: the lists below DUPLICATE knowledge that lives in `app.css`. Add a word-scale token there and it must be mirrored here, or it silently stops merging. Keep the configuration in this one place so a future scale change has an obvious landing site.
 */

/**
 * The WORD names of `app.css`'s spacing scale (`--spacing-*`), which sits alongside its numeric names.
 * Tailwind's default spacing scale is `['px', isNumber]`, so the numeric half already works and only these need teaching. Extending the `spacing` THEME scale rather than individual class groups is what makes every spacing-driven group — `m`, `p`, `gap`, `w`, `h`, `inset`, `space`, `size`, `scroll-*`, `leading` and their directional variants — pick them up in one place.
 */
const SPACING_WORD_NAMES = [
  'xs',
  'sm',
  'md',
  'lg',
  'xl',
  'xxl',
  'touch',
  // The safe-area family (`env(safe-area-inset-*)`, optionally offset by a named step).
  'safel',
  'safer',
  'safet',
  'safeb',
  'safemdl',
  'safemdr',
  'safemdt',
  'safemdb',
  'safelgl',
  'safelgr',
  'safelgt',
  'safelgb',
  'safenavt'
] as const;

/**
 * The names of `app.css`'s border-width scale (`--border-width-*`). Border widths in this project are t-shirt sizes, NOT numbers. `0` and the bare `border` (the DEFAULT) are already covered by tailwind-merge's stock border-width group; only the word names need declaring.
 */
const BORDER_WIDTH_WORD_NAMES = ['md', 'lg', 'xl'] as const;

/** Build `{ 'border-w-x': [{ 'border-x': [...names] }] }` for every directional border-width group. */
const borderWidthClassGroups = Object.fromEntries(
  (
    [
      ['border-w', 'border'],
      ['border-w-x', 'border-x'],
      ['border-w-y', 'border-y'],
      ['border-w-t', 'border-t'],
      ['border-w-r', 'border-r'],
      ['border-w-b', 'border-b'],
      ['border-w-l', 'border-l'],
      ['border-w-s', 'border-s'],
      ['border-w-e', 'border-e'],
      ['border-w-bs', 'border-bs'],
      ['border-w-be', 'border-be']
    ] as const
  ).map(([groupId, prefix]) => [groupId, [{ [prefix]: [...BORDER_WIDTH_WORD_NAMES] }]])
);

const twMerge = extendTailwindMerge<'truncate'>({
  override: {
    classGroups: {
      /**
       * `truncate` is removed from the text-overflow group and given its own group below.
       *
       * Found by the self-merge identity sweep, which reported `HeroEmoji.svelte` losing `truncate` out of its own class string to the later `text-clip`. tailwind-merge's stock grouping is defensible — both utilities do set `text-overflow` — but `truncate` is a COMPOSITE utility (`overflow: hidden` AND `text-overflow: ellipsis` AND `white-space: nowrap`), so a single-property utility cannot safely subsume it: evicting it silently takes the `overflow: hidden` with it. Isolating it means it can neither evict nor be evicted by a single-property utility, which is the conservative reading and matches what the generated CSS does today.
       */
      'text-overflow': ['text-ellipsis', 'text-clip']
    }
  },
  extend: {
    theme: {
      spacing: [...SPACING_WORD_NAMES]
    },
    classGroups: {
      ...borderWidthClassGroups,
      truncate: ['truncate']
    }
  }
});

/**
 * Combine class values into one class string, RESOLVING conflicting Tailwind utilities: when two inputs target the same CSS property the LAST one wins, so `cn('h-16', 'h-32')` is `'h-32'`. Values are flattened with `clsx`, so strings, arrays, objects and conditionals are all accepted and falsy entries are dropped. Classes targeting DIFFERENT properties are all kept — `cn('border-md', 'border-neutral')` keeps both, a width and a colour.
 *
 * The conflict resolution is only correct because the merge instance above is configured for this project's own theme scales; see that comment before changing `app.css`'s `@theme` block.
 */
export function cn(...inputs: Array<ClassValue>): string {
  return twMerge(clsx(inputs));
}

/** Create a unique identifier for use as an element ID. */
export function getUUID(): string {
  return crypto?.randomUUID ? crypto.randomUUID() : (Math.random() * 10e15).toString(16);
}

/**
 * Concat string values with properties passed by the user. Mainly used to prepend default `class` values into `$$restProps` before passing them to an element or a Svelte component.
 * @param props - The passed properties, usually `$$restProps`
 * @param defaults - A record of string properties that will be prepended to the same values in `props`
 * @returns The merged props, based on a shallow copy of `props`
 */
export function concatProps<TObject extends object>(props: TObject, defaults: Partial<StringProps<TObject>>) {
  // Make a shallow copy of props so as not to alter its values
  const merged = { ...props };
  for (const k in defaults) {
    merged[k] = (
      k in merged && typeof merged[k] === 'string' ? `${defaults[k] ?? ''} ${merged[k]}` : defaults[k]
    ) as TObject[typeof k];
  }
  return merged;
}

/**
 * Prepend default class values into `restProps` before passing them to an element or a Svelte component.
 *
 * The component's own `classes` come FIRST and the caller's `props.class` LAST, and the two are combined with `cn` — so where they conflict, the CALLER wins. That is the point of the ordering: a caller passing `class="h-32"` to a component whose own string says `h-16` now actually gets a 32-unit box, instead of the outcome depending on which rule Tailwind happened to emit later.
 *
 * Everything else about this function is unchanged: `props` is never mutated, the result is a shallow copy, a nullish `class` contributes nothing, a non-string one is coerced with `String(...)`, and props with no `class` key gain one holding `classes`.
 *
 * @param props - The passed properties, usually `restProps`
 * @param classes - The base classes to use
 * @returns The merged props, based on a shallow copy of `props`, with `classes` and any `props.class` combined and their conflicts resolved
 */
// reason: SvelteKit's `HTMLAttributes<*>` types lack an index signature, so callers cannot satisfy `Record<string, unknown>` without unsafe casting. `Record<string, any>` is the minimum constraint that accepts every prop-record shape the framework produces.
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function concatClass<TProps extends Record<string, any>>(props: TProps, classes: string) {
  // Normalize class to string if it's a non-string ClassValue (Svelte 5 compatibility). A nullish value stays nullish so `cn` drops it rather than emitting the string "null".
  const callerClass =
    props['class'] == null || typeof props['class'] === 'string' ? props['class'] : String(props['class']);
  // Cast back to the shape callers have always inferred here: 77 call sites type-check against it, so it is deliberately neither widened nor narrowed.
  return {
    ...props,
    class: cn(classes, callerClass)
  } as unknown as TProps & { class?: string | null };
}

/**
 * Extract the string properties of an object.
 */
type StringProps<TObject extends object> = {
  [K in keyof TObject]: string extends TObject[K] ? string : never;
};
