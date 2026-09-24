/**
 * `cn` — the class-combining helper, and the merge configuration it stands on.
 *
 * Every case below is drawn from THIS repo's real class vocabulary, not from Tailwind's documentation examples. That is the point: `apps/frontend/src/app.css` does not extend Tailwind's theme, it REPLACES it (`--spacing-*: initial`, `--border-width-*: initial` and friends at the top of its `@theme` block), and then defines scales that mix numeric and word names. A default-configured `twMerge` therefore misgroups a measurable slice of this project's classes — in one direction silently DROPPING a class that should have survived, in the other silently declining to merge a genuine conflict.
 *
 * The red list under a DEFAULT-configured `twMerge`, measured 2026-09-22 before the configuration was written, is recorded in the item summary. Four cases were red, and the one that matters most is `cn('border-md', 'border-neutral')`: `border-md` is this project's 1px border WIDTH, it is not a number, so a default configuration cannot place it in the border-width group and lets it fall through to the permissive border-COLOUR group — where the later, genuine colour `border-neutral` evicts it.
 * That is `Toggle.svelte`'s own class string losing its border with no caller involved at all.
 *
 * Assertions are on TOKEN SETS, never on the raw output string: `twMerge` makes no promise about whitespace or ordering beyond last-wins, and pinning the string would make this file fail on an upstream formatting change that broke nothing.
 */

import { existsSync, readdirSync, readFileSync } from 'node:fs';
import { join, relative } from 'node:path';
import { describe, expect, it } from 'vitest';
import { cn, concatClass } from './components';

/** The distinct tokens of a class string, order-insensitive. */
function tokens(value: string): Set<string> {
  return new Set(value.split(/\s+/).filter(Boolean));
}

/** The tokens of a `concatClass` result's `class` property, in order. */
function classTokens(result: { class?: unknown }): Array<string> {
  return String(result.class ?? '')
    .split(/\s+/)
    .filter(Boolean);
}

/** Assert `cn(...inputs)` yields exactly `expected` as a token set. */
function expectTokens(actual: string, expected: ReadonlyArray<string>): void {
  expect([...tokens(actual)].sort()).toEqual([...expected].sort());
}

describe('cn — conflicts that MUST be resolved, later wins', () => {
  it.each([
    // [description, inputs, the single surviving token]
    ['numeric spacing height', ['h-16', 'h-32'], 'h-32'],
    ['numeric spacing width', ['w-16', 'w-32'], 'w-32'],
    ['numeric outline width', ['outline-2', 'outline-4'], 'outline-4'],
    ['daisyUI colour vs. the v4 CSS-variable shorthand', ['bg-base-100', 'bg-(--line-bg)'], 'bg-(--line-bg)'],
    ['custom WORD spacing scale, gap', ['gap-md', 'gap-lg'], 'gap-lg'],
    ['numeric and word spacing in one group, padding', ['p-2', 'p-md'], 'p-md'],
    ['the safe-area spacing family', ['pl-safelgl', 'pl-0'], 'pl-0'],
    ['custom border-WIDTH scale', ['border-md', 'border-lg'], 'border-lg'],
    ['numeric spacing margin', ['m-8', 'm-16'], 'm-16']
  ])('%s: %j collapses to a single survivor', (_label, inputs, survivor) => {
    expectTokens(cn(...inputs), [survivor]);
  });
});

describe('cn — non-conflicts that MUST both survive, because they target different CSS properties', () => {
  it('keeps a custom border WIDTH alongside a border COLOUR — the Toggle.svelte case', () => {
    // The single most important assertion in this file. It fails on a default-configured twMerge.
    expectTokens(cn('border-md', 'border-neutral'), ['border-md', 'border-neutral']);
  });

  it('keeps a border width alongside a border STYLE', () => {
    // This is what keeps the QuestionChoices dimmed branch equivalent to the scoped rule it replaces.
    expectTokens(cn('border-lg', 'border-none'), ['border-lg', 'border-none']);
  });

  it('keeps an outline width alongside an outline colour', () => {
    expectTokens(cn('outline-2', 'outline-(--radio-bg)'), ['outline-2', 'outline-(--radio-bg)']);
  });

  it('keeps a font size alongside a text colour', () => {
    expectTokens(cn('text-md', 'text-primary'), ['text-md', 'text-primary']);
  });

  it('passes daisyUI component classes through untouched', () => {
    expectTokens(cn('radio', 'radio-primary'), ['radio', 'radio-primary']);
    expectTokens(cn('checkbox', 'checkbox-primary'), ['checkbox', 'checkbox-primary']);
  });

  it('keeps the whole of the QuestionChoices radio base string intact when merged with itself alone', () => {
    const base =
      'radio-primary radio border-lg bg-base-100 relative h-32 w-32 outline-4 outline-(--radio-bg) disabled:opacity-100';
    expectTokens(cn(base), [...tokens(base)]);
  });
});

describe('cn — the clsx half: composition', () => {
  it('joins variadic string arguments', () => {
    expectTokens(cn('flex', 'items-center'), ['flex', 'items-center']);
  });

  it('drops false, null, undefined and the empty string', () => {
    expectTokens(cn('flex', false, null, undefined, '', 'items-center'), ['flex', 'items-center']);
  });

  it('flattens nested arrays', () => {
    expectTokens(cn(['flex', ['items-center', 'gap-md']]), ['flex', 'items-center', 'gap-md']);
  });

  it('flattens object syntax, keeping only truthy keys', () => {
    expectTokens(cn({ flex: true, hidden: false, 'gap-md': 1 }), ['flex', 'gap-md']);
  });

  it('returns the empty string for no arguments', () => {
    expect(cn()).toBe('');
  });
});

/**
 * ────────────────────────────────────────────────────────────────────────────────────────────────
 * GROUP A — `concatClass` characterisation.
 * ────────────────────────────────────────────────────────────────────────────────────────────────
 *
 * Cases 1-6 describe behaviour `concatClass` ALREADY had before it was reimplemented over `cn`. They were green before that edit and are green after, and that before/after identity is the equivalence proof for its 77 call sites: the reimplementation moved the composition, it did not change what the function does with its inputs. They must not be "adapted" to whatever the new implementation happens to do.
 *
 * Case 7 is the ONE intended change, and it was red before. It is pinned here so that the semantic shift — a caller's class now wins a conflict against the component's own — can never happen again by accident, unnoticed.
 */
describe('concatClass — characterisation', () => {
  it('case 1: prepends the component classes before the caller class', () => {
    expect(classTokens(concatClass({ class: 'caller' }, 'own'))).toEqual(['own', 'caller']);
  });

  it('case 2: adds a class key when props has none, preserving the other props', () => {
    const result = concatClass({ id: 'x' }, 'own');
    expect(classTokens(result)).toEqual(['own']);
    expect(result.id).toBe('x');
  });

  it('case 3: does not mutate the input and returns a different reference', () => {
    const props = { class: 'caller', id: 'x' };
    const result = concatClass(props, 'own');
    expect(result).not.toBe(props);
    expect(props.class).toBe('caller');
  });

  it('case 4: passes other props through untouched, including non-string values', () => {
    function onclick(): void {
      // A prop that is neither a string nor nullish, carried through by reference.
    }
    const result = concatClass({ class: 'caller', disabled: true, count: 3, onclick }, 'own');
    expect(result.disabled).toBe(true);
    expect(result.count).toBe(3);
    expect(result.onclick).toBe(onclick);
  });

  it.each([
    ['null', null],
    ['undefined', undefined]
  ])('case 5: a %s class contributes nothing, not its String() form', (_label, value) => {
    expect(classTokens(concatClass({ class: value }, 'own'))).toEqual(['own']);
  });

  it('case 6: coerces a non-string, non-nullish class with String()', () => {
    // A value whose String() form is a single token that no Tailwind group claims, so this case is stable under case 7's merge semantics.
    expect(classTokens(concatClass({ class: { toString: () => 'coerced-token' } }, 'own'))).toEqual([
      'own',
      'coerced-token'
    ]);
  });

  it('case 7: the caller wins a conflict against the component own class', () => {
    // THE semantic change. Before the reimplementation this yielded ['h-16', 'h-32'] and Tailwind's generated source order decided the winner; now the caller's override actually takes effect.
    expect(classTokens(concatClass({ class: 'h-32' }, 'h-16'))).toEqual(['h-32']);
  });
});

/**
 * ────────────────────────────────────────────────────────────────────────────────────────────────
 * GROUP B — the self-merge identity sweep.
 * ────────────────────────────────────────────────────────────────────────────────────────────────
 *
 * The gate the decision to put `cn` inside `concatClass` rests on. For EVERY literal class string passed as the second argument to `concatClass` anywhere under `apps/frontend/src`, merging that string with itself alone must drop nothing: `cn(s)` must have the same token set as `s`.
 *
 * That is the exhaustive check against the dangerous half of the risk — a component silently losing a class out of its OWN string because the merge misgrouped it, which needs no caller to trigger and is exactly the live `Toggle.svelte` defect the merge configuration exists to prevent.
 *
 * The population is DERIVED FROM SOURCE at test time and never hardcoded, so it cannot go stale as components are added, and the non-empty assertion below means a broken scanner fails loudly rather than passing vacuously.
 */

/**
 * `apps/frontend/src`, resolved from the vitest root rather than from `import.meta.url` — under this project's `conditions: ['browser']` vitest config, `import.meta.url` is not a `file:` URL and cannot be converted to a path. `existsSync` below turns a cwd change into a loud failure rather than an empty population.
 */
const SRC_ROOT = join(process.cwd(), 'src');

/** Every `.svelte` and `.ts` file under `apps/frontend/src`, excluding this module's own pair. */
function sourceFiles(dir: string, found: Array<string> = []): Array<string> {
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    const full = join(dir, entry.name);
    if (entry.isDirectory()) {
      if (entry.name !== 'node_modules') sourceFiles(full, found);
    } else if (/\.(svelte|ts)$/.test(entry.name) && !/^components(\.test)?\.ts$/.test(entry.name)) {
      found.push(full);
    }
  }
  return found;
}

/**
 * Every quoted string literal appearing in the SECOND-argument position of a `concatClass(` call.
 *
 * The span of the second argument is found by a balanced-paren scan that respects quotes, then split off at the first top-level comma. Literals are extracted from that whole span rather than only from a single argument shape, so ternaries (`cond ? 'a b' : ''`) and `+` concatenations contribute their literals too — strictly wider coverage than matching one call shape would give. Template literals carrying an interpolation are skipped, because their runtime value is not knowable here.
 */
function concatClassLiterals(source: string): Array<string> {
  const literals: Array<string> = [];
  const NEEDLE = 'concatClass(';
  for (let at = source.indexOf(NEEDLE); at !== -1; at = source.indexOf(NEEDLE, at + 1)) {
    let depth = 0;
    let quote: string | null = null;
    let commaAt = -1;
    let end = -1;
    for (let i = at + NEEDLE.length - 1; i < source.length; i++) {
      const ch = source[i];
      if (quote) {
        if (ch === '\\') i++;
        else if (ch === quote) quote = null;
        continue;
      }
      if (ch === "'" || ch === '"' || ch === '`') quote = ch;
      else if (ch === '(' || ch === '[' || ch === '{') depth++;
      else if (ch === ')' || ch === ']' || ch === '}') {
        depth--;
        if (depth === 0) {
          end = i;
          break;
        }
      } else if (ch === ',' && depth === 1 && commaAt === -1) commaAt = i;
    }
    if (end === -1 || commaAt === -1) continue;
    const span = source.slice(commaAt + 1, end);
    for (const [, single, double, backtick] of span.matchAll(
      /'((?:\\.|[^'\\])*)'|"((?:\\.|[^"\\])*)"|`((?:\\.|[^`\\])*)`/gs
    )) {
      const literal = single ?? double ?? backtick;
      if (literal && !literal.includes('${')) literals.push(literal);
    }
  }
  return literals;
}

describe('concatClass — self-merge identity sweep over every literal class string in the source tree', () => {
  const population: Array<{ file: string; literal: string }> = [];
  for (const file of sourceFiles(SRC_ROOT)) {
    for (const literal of concatClassLiterals(readFileSync(file, 'utf8'))) {
      population.push({ file: relative(SRC_ROOT, file), literal });
    }
  }

  it('discovers a non-empty population, so a broken scanner cannot pass vacuously', () => {
    expect(existsSync(SRC_ROOT), `expected the source root to exist at ${SRC_ROOT}`).toBe(true);
    // Reported rather than asserted against a fixed number: the population grows with the component libraries, and pinning a count would turn every new component into a false failure here.
    console.info(`[self-merge sweep] ${population.length} literal concatClass class strings discovered`);
    expect(population.length).toBeGreaterThan(0);
  });

  it('drops no token from any component own class string', () => {
    const divergences: Array<string> = [];
    for (const { file, literal } of population) {
      const before = tokens(literal);
      const after = tokens(cn(literal));
      const dropped = [...before].filter((token) => !after.has(token));
      if (dropped.length) divergences.push(`${file}: dropped ${dropped.join(', ')} from "${literal}"`);
    }
    // The failure message IS the trip-condition report: it names the file and the dropped token so the finding can be routed straight to the merge configuration, or escalated if it cannot be.
    expect(divergences).toEqual([]);
  });
});
