import { clsx } from 'clsx';
import { extendTailwindMerge } from 'tailwind-merge';
import type { ClassValue } from 'clsx';

/**
 * The tailwind-merge configuration. Its source of truth is the `@theme` block of `apps/frontend/src/app.css`.
 *
 * `app.css` replaces Tailwind's theme rather than extending it: the `@theme` block clears the defaults (`--spacing-*: initial`, `--radius-*: initial`, `--text-*: initial`, …) and defines scales that mix numeric and word names. `tailwind-merge` assumes Tailwind's default scales, so without this configuration it misgroups part of that vocabulary in two ways:
 *
 *  - A class is dropped. `border-md` is a 1px border width, but it is not a number, so the stock border-width group cannot claim it and it falls through to the border-colour group, where a later colour evicts it. `Toggle.svelte` passes `border-md border-neutral` in one literal.
 *  - A conflict is not merged. In `gap-md` vs `gap-lg`, `p-2` vs `p-md` or `pl-safelgl` vs `pl-0` the word-named side is unrecognised, so both survive and Tailwind's source order decides.
 *
 * The lists below mirror the word-named `--spacing-*` and `--border-width-*` tokens of `app.css`, and `components.test.ts` fails when they drift.
 */

/**
 * The word names of `app.css`'s spacing scale (`--spacing-*`). tailwind-merge's default spacing scale is `['px', isNumber]`, so only the word names need declaring. Extending the `spacing` theme scale, rather than individual class groups, makes every spacing-driven group (`m`, `p`, `gap`, `w`, `h`, `inset`, `space`, `size`, `scroll-*`, `leading` and their directional variants) pick them up.
 */
export const SPACING_WORD_NAMES = [
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
 * The word names of `app.css`'s border-width scale (`--border-width-*`). `0` and the bare `border` (the `DEFAULT`) are already in tailwind-merge's stock border-width group.
 */
export const BORDER_WIDTH_WORD_NAMES = ['md', 'lg', 'xl'] as const;

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
       * `truncate` is removed from the text-overflow group and given its own group below. It sets `overflow`, `text-overflow` and `white-space` together, so a single-property utility such as `text-clip` must not evict it and take `overflow: hidden` with it; in its own group it neither evicts nor is evicted by one.
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
 * Combine class values into one class string, resolving conflicting Tailwind utilities: when two inputs target the same CSS property the last one wins, so `cn('h-16', 'h-32')` is `'h-32'`. Values are flattened with `clsx`, so strings, arrays, objects and conditionals are accepted and falsy entries are dropped. Classes targeting different properties are all kept: `cn('border-md', 'border-neutral')` keeps a width and a colour.
 *
 * The conflict resolution depends on the merge configuration above matching `app.css`'s theme scales.
 */
export function cn(...inputs: Array<ClassValue>): string {
  return twMerge(clsx(inputs));
}

/** Create a unique identifier for use as an element ID. */
export function getUUID(): string {
  return crypto?.randomUUID ? crypto.randomUUID() : (Math.random() * 10e15).toString(16);
}

/**
 * Concat string values with properties passed by the user. Mainly used to prepend default `class` values into `restProps` before passing them to an element or a Svelte component.
 * @param props - The passed properties, usually `restProps`
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
 * The component's own `classes` come first and the caller's `props.class` last, combined with `cn`, so the caller wins a conflict: a caller passing `class="h-32"` to a component whose own string says `h-16` gets a 32-unit box.
 *
 * `props` is never mutated and the result is a shallow copy. A nullish `class` contributes nothing, a non-string one is coerced with `String(...)`, and props with no `class` key gain one holding `classes`.
 *
 * @param props - The passed properties, usually `restProps`
 * @param classes - The base classes to use
 * @returns The merged props, based on a shallow copy of `props`, with `classes` and any `props.class` combined and their conflicts resolved
 */
// reason: SvelteKit's `HTMLAttributes<*>` types lack an index signature, so callers cannot satisfy `Record<string, unknown>` without unsafe casting. `Record<string, any>` is the minimum constraint that accepts every prop-record shape the framework produces.
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function concatClass<TProps extends Record<string, any>>(props: TProps, classes: string) {
  // Coerce a non-string class value to a string. A nullish value stays nullish, so `cn` drops it rather than emitting the string "null".
  const callerClass =
    props['class'] == null || typeof props['class'] === 'string' ? props['class'] : String(props['class']);
  // The return type callers type-check against: the props with an optional string `class`.
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
