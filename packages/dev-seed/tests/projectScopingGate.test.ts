/**
 * The project-scoped query guard's WIRING, asserted rather than described.
 *
 * ## What breaks without this file
 *
 * `scripts/assert-project-scoped-queries.mjs` is the only thing standing between an unscoped query and a merge. Its durable half is not the conversions it accompanies; it is its membership of `yarn lint:check`, the one command every local run and CI pass goes through. Unwire the link and the guard still exists on disk, the tree still looks converted, and nothing tells anybody it stopped running. Wire it but delete the script and the chain fails with a bare `node: cannot find module`, which names no invariant and sends the reader nowhere. Both failure modes are asserted below.
 *
 * ## MEMBERSHIP, NEVER POSITION
 *
 * Every assertion here is about the `&&` chain CONTAINING a link. Every link after a failing one is equally skipped, so position is incidental, and asserting a terminal position or an index makes appending the next guard a test failure -- a correct change an over-specified assertion has no business rejecting. Several sibling efforts append their own links to this same chain. Do not use `endsWith`, do not compare the whole `lint:check` string with `toBe`, and do not assert a count.
 *
 * ## Why it lives in packages/dev-seed
 *
 * `yarn test:unit` is `turbo run test:unit`, so a repo-meta spec needs a package to run in, and this package already reads repo-root files from its tests. It sits beside the other repo-root readers rather than in a home of its own.
 */

import { spawnSync } from 'node:child_process';
import { readdirSync, readFileSync, rmSync, statSync, writeFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';

const HERE = dirname(fileURLToPath(import.meta.url));
/** `packages/dev-seed/tests` → repo root. */
const REPO_ROOT = resolve(HERE, '../../..');

/** The guard read as TEXT, not imported. Its declarations are the thing under assertion, and reading the source is what lets a docblock be told apart from a live entry. */
const GUARD_PATH = 'scripts/assert-project-scoped-queries.mjs';
const GUARD_SOURCE = readFileSync(resolve(REPO_ROOT, GUARD_PATH), 'utf8');

/** The directory the guard enumerates, mirrored here so assertion (b) below derives its own population instead of trusting the guard's. */
const ADAPTER_DIR = 'apps/frontend/src/lib/api/adapters/supabase';

/** The root of the frontend source tree, mirrored here for the same reason `ADAPTER_DIR` is: the widened corpus is derived below rather than read out of the guard. */
const FRONTEND_SRC_DIR = 'apps/frontend/src';

/** The directory holding the two fixtures the guard proves itself against. */
const FIXTURE_DIR = 'scripts/fixtures/project-scoped-queries';

/** The four fixtures the guard proves itself against, by the tail each entry actually spells. Enumerated once so a case iterating them cannot quietly cover two of the four — the two `outside-boundary.*` names each CONTAIN one of the other two as a substring, so a list of the short pair reads as though it covered all four. */
const FIXTURE_TAILS: Array<string> = [
  'violation.fixture.ts',
  'clean.fixture.ts',
  'outside-boundary.violation.fixture.ts',
  'outside-boundary.clean.fixture.ts'
];

/**
 * Every shape in the fixture corpus whose whole job is to stay UNREPORTED, named here so deleting one is a named failure rather than a silence.
 *
 * The mutation harness further down proves that every admitted POSITION is held in place by a committed fixture shape whose disposition depends on it. That is the POSITIVE half of each pair only. The negative half is held by nothing at all, and necessarily so: a control contributes zero counted sites BY DEFINITION, so deleting it leaves every count identical, the self-test green and the whole suite green. `161-REVIEW.md` names that failure mode WR-04 and measured it — the three bucket shapes deleted from `violation.fixture.ts` left the self-test matching its committed expectation at exit 0. A control nothing asserts is not a control; it is a comment that happens to compile.
 *
 * Membership below is MEASURED rather than reasoned. Each shape was deleted from its fixture on disk on its own, the guard's self-test re-run, and its summary line required back byte-identical at exit 0. Three shapes deliberately NOT on this list — `dispositionedRpc` and `deploymentScopedInvocation` in `clean.fixture.ts`, `subObjectAliasedClient` in `violation.fixture.ts` — were put through the identical measurement and each moved the counts to exit 1, which is what says the measurement was reading something rather than reporting a uniform silence.
 *
 * The assertion over this list is deliberately a PRESENCE check rather than a re-run of that deletion sweep. The sweep needs 20 mutations of files on disk to say what it says, and a suite that rewrites the guard's own fixtures on every run is a suite that can leave them rewritten. Presence is the half that has to survive a maintainer tidying the fixtures, and it is the half that goes red when one does.
 */
const NEGATIVE_CONTROLS: Array<{ fixture: string; shapes: Array<string> }> = [
  {
    fixture: 'clean.fixture.ts',
    shapes: [
      // The live `auth.getUser()` destructure — 161-18's false-positive control, and the one shape CR-02's closure turns on: the promotion of the binding rule is only free of live cost while this stays unreported.
      'destructuredCallResult',
      // 161-17's two computed-invocation near misses: an identifier that merely ENDS in `functions`, and a key that merely BEGINS with it.
      'nearMissSuffixedFunctions',
      'nearMissFunctionsPrefixedKey',
      // A storage bucket is not a table, and a client call that reaches no table at all.
      'bucketUpload',
      'nonTableClientCall',
      // The sanctioned route and the stub it goes through — the shape the guard is steering callers toward, which must never be reported as the thing it replaces.
      'scopedFrom',
      'scopedTableRead'
    ]
  },
  {
    fixture: 'outside-boundary.clean.fixture.ts',
    shapes: [
      // The same two near misses, committed at the boundary address as well as at the adapter one.
      'nearMissSuffixedFunctions',
      'nearMissFunctionsPrefixedKey',
      // All three punctuator spellings of a bucket access. The third is a control rather than a count, which is precisely what makes it deletable in silence.
      'bucketUpload',
      'optionalChainedBucketUpload',
      'optionalCallBucketUpload',
      // A call on the adapter's own surface rather than on a raw client, in both punctuator spellings, and a helper that touches no client at all.
      'viaAdapterSurface',
      'viaOptionalAdapterSurface',
      'collectRows'
    ]
  },
  {
    fixture: 'violation.fixture.ts',
    shapes: [
      // The three bucket shapes WR-04 deleted to make its point, and the sanctioned route beside them, inside the corpus the guard treats most strictly.
      'bucketUpload',
      'optionalChainedBucketUpload',
      'optionalCallBucketUpload',
      'scopedFrom',
      'scopedTableRead'
    ]
  }
];

/**
 * A source's MODULE docblock — the first block comment in the file, which is where the guard's reach is stated.
 *
 * Parameterised rather than computed once, for the same reason `matcherSpanOf` and `functionBodyOf` are: one case below reads a MUTATED copy of the guard's source, and a second derivation written out beside it would be free to disagree with this one. One reader, two inputs.
 * @param source - The source text to read; the guard's own by default.
 * @returns The first block comment, delimiters included.
 */
function moduleDocblockOf(source: string = GUARD_SOURCE): string {
  const start = source.indexOf('/**');
  if (start === -1) throw new Error(`${GUARD_PATH} carries no module docblock`);
  return source.slice(start, source.indexOf('*/', start) + 2);
}

/**
 * The docblock's STATED RESIDUALS section — its heading down to the blank line that ends the list.
 *
 * Scoped rather than whole, and that is what makes the count below mean something: the module docblock holds other bulleted lists, so counting list items across all of it would measure the wrong paragraphs and drift with every unrelated edit. It throws by name when the heading is absent, because a section that could not be found would otherwise turn every assertion over it into a zero from an instrument pointed at nothing.
 * @param source - The source text to read; the guard's own by default.
 * @returns The stated-residual section's source text.
 */
function residualSectionOf(source: string = GUARD_SOURCE): string {
  const docblock = moduleDocblockOf(source);
  const start = docblock.indexOf(' * STATED RESIDUALS');
  if (start === -1) throw new Error(`the module docblock of ${GUARD_PATH} states no residual list`);
  const end = docblock.indexOf('\n *\n', start);
  return docblock.slice(start, end === -1 ? docblock.length : end);
}

/**
 * A residual section as flowing prose, so a phrase pinned below can be asserted whole even where the paragraph wraps it across two lines.
 * @param section - The section's source text, comment markers included.
 * @returns The same text with its markers and line breaks flattened to single spaces.
 */
function residualProseOf(section: string): string {
  return section
    .split('\n')
    .map((line) => line.replace(/^\s*\*\s?/, ''))
    .join(' ')
    .replace(/\s+/g, ' ');
}

/** The line shape of one stated-residual BULLET, and of a CONTINUATION line belonging to the bullet above it. The second is what lets a WHOLE bullet be deleted below rather than only its first line, which would leave an orphaned half-sentence behind and measure a section nobody would ever write. */
const RESIDUAL_BULLET_RE = /^ \* {3}- /;
const RESIDUAL_CONTINUATION_RE = /^ \* {5}\S/;

/**
 * How many bullets a stated-residual section holds.
 *
 * One counter read by both the case that pins the count and the case that deletes a bullet to show the count fall, so the demonstration cannot pass against a counter of its own that the pinning case has never used.
 * @param section - The section's source text, comment markers included.
 * @returns The number of bullet lines in it.
 */
function residualBulletCountOf(section: string): number {
  return section.split('\n').filter((line) => RESIDUAL_BULLET_RE.test(line)).length;
}

const RESIDUAL_SECTION = residualSectionOf();

const RESIDUAL_SECTION_PROSE = residualProseOf(RESIDUAL_SECTION);

/**
 * Every residual the guard's reach paragraph is allowed to state, and every residual a disposition below is allowed to name.
 *
 * The binding runs in BOTH directions and that is the point of it. A phrase here must appear in the module docblock, so a residual cannot be measured without being stated; and the docblock's stated-residual list must hold exactly this many entries, so a residual cannot be stated without being measured. A reach claim that no assertion measures is how this guard's docblock went false twice — the sentence was true the day it was written and stale at the next widening, and nothing anywhere failed.
 */
const RESIDUAL_PHRASES: Array<string> = [
  'an interposed comment is not trivia the matchers admit',
  'a forbidden shape quoted inside a string literal is read as live code',
  'the computed spellings at that address are unreported',
  'the binding rule reads only an initialiser that begins with the receiver',
  'a computed member whose key is not a string literal is unreported',
  'the binding rule decides from the member NAME alone and no client-member disposition list is declared, so a plain member read bound to a local is reported as an alias',
  'a client held in a PARAMETER is read by neither',
  'so a .js or .mjs source under the frontend source tree is in neither corpus',
  'a receiver wrapped in PARENTHESES is unread by every matcher here',
  'a nullish coalesce that binds the owner whenever it is non-null — is UNREPORTED',
  'so an owner reached by any other expression is unread'
];

/**
 * The text of one top-level array declaration in the guard, from `const NAME = [` to its closing `];`.
 *
 * Slicing rather than importing is deliberate: the assertions below are about what the DECLARATION contains, and an import would hand back a value in which a docblock and a live entry are indistinguishable. It throws rather than returning an empty string when the declaration is not found, so a renamed constant fails loudly instead of turning every assertion over the slice into a zero from an empty instrument.
 *
 * The closing bracket is found by BALANCE rather than by a `\n];` line, so an empty declaration written on one line reads the same as a populated multi-line one. Emptiness is the resting state of one of these two arrays, and a reader that could only parse the populated form would have started throwing the moment the array was emptied — the very state these assertions exist to hold in place.
 * @param name - The constant's name.
 * @returns The declaration's source text, closing bracket included.
 */
function declarationOf(name: string): string {
  const marker = `const ${name} = [`;
  const start = GUARD_SOURCE.indexOf(marker);
  if (start === -1) throw new Error(`${name} is not declared as an array literal in ${GUARD_PATH}`);
  let depth = 0;
  for (let i = start + marker.length - 1; i < GUARD_SOURCE.length; i++) {
    if (GUARD_SOURCE[i] === '[') depth++;
    else if (GUARD_SOURCE[i] === ']') {
      depth--;
      if (depth === 0) return GUARD_SOURCE.slice(start, i + 1);
    }
  }
  throw new Error(`${name}'s array literal is unterminated in ${GUARD_PATH}`);
}

/**
 * The text of one top-level OBJECT declaration in the guard, from `const NAME = {` to its closing `};`.
 *
 * The sibling of `declarationOf`, which slices array literals and would run off the end of an object one. Same contract in both directions: the closing brace is found by BALANCE rather than by a line pattern, so a one-line declaration reads the same as a multi-line one, and a constant that has been renamed or restructured throws instead of returning an empty string — an assertion over an empty slice is a zero from an instrument that is not pointed at anything.
 * @param name - The constant's name.
 * @returns The declaration's source text, closing brace included.
 */
function objectDeclarationOf(name: string): string {
  const marker = `const ${name} = {`;
  const start = GUARD_SOURCE.indexOf(marker);
  if (start === -1) throw new Error(`${name} is not declared as an object literal in ${GUARD_PATH}`);
  let depth = 0;
  for (let i = start + marker.length - 1; i < GUARD_SOURCE.length; i++) {
    if (GUARD_SOURCE[i] === '{') depth++;
    else if (GUARD_SOURCE[i] === '}') {
      depth--;
      if (depth === 0) return GUARD_SOURCE.slice(start, i + 1);
    }
  }
  throw new Error(`${name}'s object literal is unterminated in ${GUARD_PATH}`);
}

/** Where one matcher's declaration sits in the text it was sliced from. */
interface MatcherSpan {
  /** The index of the `const NAME =` marker in the source it was found in. */
  start: number;
  /** The declaration's text, from the marker through the literal's closing delimiter. */
  text: string;
  /** The index of the first character of the pattern, in the same source. */
  patternStart: number;
  /** The index of the literal's closing delimiter, in the same source. */
  patternEnd: number;
}

/**
 * One matcher declaration in the guard, located in the guard's source text.
 *
 * The third slicer beside `declarationOf` and `objectDeclarationOf`, and it keeps their contract in both directions. It THROWS by name when the constant is not found, because an assertion over a regular expression that silently failed to be found is a pass from an instrument pointed at nothing — a renamed matcher would otherwise turn every measurement below into a green from a search of an empty string.
 *
 * The marker is anchored at LINE START through a multiline search rather than taken as the first textual occurrence anywhere in the file. The guard's docblocks quote source shapes constantly, and this file stores a whole declaration as a string of its own further down, so a first-occurrence marker is one prose edit away from slicing an explanation instead of the code it explains.
 *
 * The OPENING delimiter is bounded to the declaration's own window — from the marker to the next line-anchored `const `, `function ` or docblock opener — rather than taken as the first slash anywhere after the marker. A declaration holding no literal in its own window therefore throws by name instead of quietly borrowing the next declaration's. The CLOSING delimiter is found by scanning, because several of these patterns contain a character class holding a bracket or a parenthesis and one contains an escaped backslash, so a naive search would stop in the middle of a class.
 * @param name - The matcher constant's name.
 * @param source - The text to read, defaulting to the guard. It is a parameter so this helper's own failure modes can be MEASURED against a synthetic source rather than described in a comment.
 * @returns Where the declaration and its pattern sit in `source`.
 */
function matcherSpanOf(name: string, source: string = GUARD_SOURCE): MatcherSpan {
  if (!/^[A-Z][A-Z0-9_]*$/.test(name)) throw new Error(`'${name}' is not the name of a matcher constant`);
  const markerMatch = new RegExp(`^const ${name} =`, 'm').exec(source);
  if (markerMatch === null) throw new Error(`${name} is not declared at the start of a line in ${GUARD_PATH}`);

  const start = markerMatch.index;
  const lineEnd = source.indexOf('\n', start);
  const afterLine = lineEnd === -1 ? source.length : lineEnd + 1;
  const nextDeclaration = /^(?:const |function |\/\*\*)/m.exec(source.slice(afterLine));
  const windowEnd = nextDeclaration === null ? source.length : afterLine + nextDeclaration.index;

  const open = source.indexOf('/', start + markerMatch[0].length);
  if (open === -1 || open >= windowEnd)
    throw new Error(`${name} declares no regular-expression literal of its own in ${GUARD_PATH}`);

  let inClass = false;
  for (let i = open + 1; i < windowEnd; i++) {
    const ch = source[i];
    if (ch === '\\') {
      i++;
      continue;
    }
    if (ch === '\n') break;
    if (ch === '[') inClass = true;
    else if (ch === ']') inClass = false;
    else if (ch === '/' && !inClass)
      return { start, text: source.slice(start, i + 1), patternStart: open + 1, patternEnd: i };
  }
  throw new Error(`${name}'s regular-expression literal is unterminated in ${GUARD_PATH}`);
}

/**
 * One matcher declaration in the guard, rebuilt as a `RegExp`.
 *
 * The expression is constructed WITHOUT the global flag, deliberately. `RegExp.prototype.test` on a global expression advances `lastIndex` and returns false on the next call, so a global copy would make each assertion depend on the one before it and the measurements would read differently purely by their order in the file.
 * @param name - The matcher constant's name.
 * @param source - The text to read, defaulting to the guard.
 * @returns The same pattern the guard uses, flagless.
 */
function regexDeclarationOf(name: string, source: string = GUARD_SOURCE): RegExp {
  const span = matcherSpanOf(name, source);
  return new RegExp(source.slice(span.patternStart, span.patternEnd));
}

/**
 * The BODY of one top-level function in the guard, from the `{` that opens it to the matching `}`.
 *
 * The fourth slicer beside `declarationOf`, `objectDeclarationOf` and `matcherSpanOf`, and it keeps their contract in both directions. It THROWS by name when the function is not found, for the reason every sibling throws: an assertion over a body that was silently not found is a pass from an instrument pointed at nothing, and a renamed function would otherwise turn the derivation below into a green from a search of an empty string.
 *
 * The marker is anchored at LINE START for the reason `matcherSpanOf`'s is: the guard's docblocks name its own functions constantly, so a first-occurrence marker is one prose edit away from slicing an explanation instead of the code it explains. The closing brace is found by BALANCE, which is what makes a one-line body read the same as a multi-line one.
 * @param name - The function's name.
 * @param source - The text to read, defaulting to the guard. It is a parameter so the derivation built on it can be MEASURED against a synthetic source rather than described in a comment.
 * @returns The body text, both braces included.
 */
function functionBodyOf(name: string, source: string = GUARD_SOURCE): string {
  const markerMatch = new RegExp(`^function ${name}\\(`, 'm').exec(source);
  if (markerMatch === null) throw new Error(`${name} is not declared as a top-level function in ${GUARD_PATH}`);

  const open = source.indexOf('{', markerMatch.index + markerMatch[0].length);
  if (open === -1) throw new Error(`${name} opens no body of its own in ${GUARD_PATH}`);

  let depth = 0;
  for (let i = open; i < source.length; i++) {
    if (source[i] === '{') depth++;
    else if (source[i] === '}') {
      depth--;
      if (depth === 0) return source.slice(open, i + 1);
    }
  }
  throw new Error(`${name}'s body is unterminated in ${GUARD_PATH}`);
}

/**
 * The character ranges of every NEGATIVE LOOKAHEAD in one matcher declaration, in the declaration slice's own coordinates.
 *
 * The fifth slicer beside `declarationOf`, `objectDeclarationOf`, `matcherSpanOf` and `functionBodyOf`, and it exists so that WHICH of a matcher's punctuator cells belong to a lookahead is DERIVED rather than authored. A lookahead position has no spelling in the shape it rejects, so it belongs to no link of the call shape and must be excluded from the bridge below — and the point of deriving it is that a lookahead WIDENED with a new position cannot silently leave the bridge trivially satisfied. A hand-authored count would go stale at exactly the edit that matters.
 *
 * The scan skips escaped characters and characters inside a class for the reason `matcherSpanOf` does: several of these patterns hold a class containing a bracket or a parenthesis (`[([]` is one of them), so a naive parenthesis balance would open a group that the source never opened. The closing parenthesis is found by BALANCE, so a lookahead containing its own groups reads the same as a flat one.
 * @param name - The matcher constant's name.
 * @returns One `{ start, end }` per negative lookahead, offsets relative to the declaration slice, `end` exclusive.
 */
function lookaheadSpansOf(name: string): Array<{ start: number; end: number }> {
  const text = matcherSpanOf(name).text;
  const spans: Array<{ start: number; end: number }> = [];

  /** Advance past a character class opened at `from`, returning the index of its closing bracket. */
  const skipClass = (from: number): number => {
    for (let i = from + 1; i < text.length; i++) {
      if (text[i] === '\\') {
        i++;
        continue;
      }
      if (text[i] === ']') return i;
    }
    return text.length;
  };

  for (let i = 0; i < text.length; i++) {
    if (text[i] === '\\') {
      i++;
      continue;
    }
    if (text[i] === '[') {
      i = skipClass(i);
      continue;
    }
    if (!text.startsWith('(?!', i)) continue;

    let depth = 0;
    let end = -1;
    for (let j = i; j < text.length; j++) {
      const ch = text[j];
      if (ch === '\\') {
        j++;
        continue;
      }
      if (ch === '[') {
        j = skipClass(j);
        continue;
      }
      if (ch === '(') depth++;
      else if (ch === ')') {
        depth--;
        if (depth === 0) {
          end = j;
          break;
        }
      }
    }
    if (end === -1) throw new Error(`${name}'s negative lookahead is unterminated in ${GUARD_PATH}`);
    spans.push({ start: i, end: end + 1 });
    i = end;
  }

  return spans;
}

/**
 * The three source-token forms every optional-punctuator admission in this guard is written in, each beside the PLAIN counterpart a revert replaces it with.
 *
 * A member operator (`\??\.`) reverts to a literal dot. A computed-or-call punctuator, held whole in an optional group because the spelling puts a dot between the `?` and the bracket or parenthesis, reverts to nothing at all. And a lookahead branch, which admits the punctuator in order to EXCLUDE it, likewise reverts to nothing.
 *
 * The vocabulary is closed, and a test case per matcher below is what keeps it closed: stripping all three forms from a declaration must leave no escaped question mark behind. A fourth form is then a decision somebody has to make rather than a spelling that can arrive unnoticed and go uncounted — which is the shape of the defect this whole enumeration exists to prevent.
 */
const PUNCTUATOR_TOKENS = [
  { form: 'member', token: '[!?]?\\.', plain: '\\.' },
  { form: 'computed-or-call', token: '(?:\\?\\.\\s*|!\\s*)?', plain: '' },
  { form: 'lookahead-branch', token: '\\?\\.|', plain: '' }
] as const;

/** The punctuator form a cell's token belongs to. */
type PunctuatorForm = (typeof PUNCTUATOR_TOKENS)[number]['form'];

/**
 * Every matcher in the guard that reads a client access, named ONCE.
 *
 * Both derivations below read this list: the per-cell mutation harness and the operator table. A matcher added to the guard and left out of one of them would be measured by the other alone, which is the state a single hand-maintained list always drifts into. The list is held honest from the guard's side too — a matcher constant the guard declares that is NOT here may admit no optional punctuator at all, asserted below, so a new one carrying a punctuator is a named failure rather than a silent omission.
 */
const MATCHER_NAMES: Array<string> = [
  'ACCESS_RE',
  'SCHEMA_HOP_RE',
  'BOUNDARY_ACCESS_RE',
  'COMPUTED_ACCESS_RE',
  'COMPUTED_RECEIVER_RE',
  'CLIENT_BINDING_RE',
  'INVOKE_RE',
  'COMPUTED_INVOKE_RE',
  'COMPUTED_FUNCTIONS_RE'
];

/** The two corpora the guard walks: the adapter directory, and the frontend source tree outside it. */
type Corpus = 'adapter' | 'outside';

/** The two per-corpus composers, each beside the corpus it walks. Which of them CALLS a given reader is the only fact deciding where a matcher inside that reader is ever exercised, which is why the map below is read out of their bodies rather than written down beside them. */
const CORPUS_COMPOSERS: Array<{ composer: string; corpus: Corpus }> = [
  { composer: 'checkSource', corpus: 'adapter' },
  { composer: 'checkOutsideSource', corpus: 'outside' }
];

/**
 * Whether `body` READS the constant `name` — a property access on it, which is the only way this guard ever uses a matcher (`NAME.lastIndex`, `NAME.exec`).
 *
 * A property access rather than a bare mention, and both halves of that are measured rather than stylistic. The word boundary is load-bearing because `ACCESS_RE` is a substring of both `COMPUTED_ACCESS_RE` and `BOUNDARY_ACCESS_RE`, so a substring test would credit the access matcher with the corpora of two rules that are not it. The trailing dot is load-bearing because the guard's non-vacuity floor names `ACCESS_RE` inside a diagnostic STRING in `main`, so a bare-mention test would make `main` a reader of it — and `main` is called by neither composer, which would turn this derivation into a throw on correct code.
 * @param body - The function body to read.
 * @param name - The constant's name.
 * @returns Whether the body takes a property off that constant.
 */
function readsConstant(body: string, name: string): boolean {
  return new RegExp(`\\b${name}\\s*\\.`).test(body);
}

/**
 * Whether `body` CALLS the function `name`.
 * @param body - The function body to read.
 * @param name - The callee's name.
 * @returns Whether the body invokes it.
 */
function callsFunction(body: string, name: string): boolean {
  return new RegExp(`\\b${name}\\s*\\(`).test(body);
}

/**
 * Every top-level function in the guard that reads a matcher, mapped to the corpora it is run over.
 *
 * Derived from the guard's own text in two steps, neither of which is authored anywhere: a function is a READER when its body takes a property off one of `MATCHER_NAMES`, and its corpora are exactly the composers whose bodies call it. A reader called by neither composer throws by name — a rule wired to no corpus reports nothing forever, over a corpus nobody walks, and that is the state this derivation exists to catch rather than to describe.
 * @param source - The text to read, defaulting to the guard.
 * @returns One entry per reader, each with the corpora it runs over.
 */
function readerFunctionsOf(source: string = GUARD_SOURCE): Map<string, ReadonlySet<Corpus>> {
  const declared = [...source.matchAll(/^function ([A-Za-z_$][\w$]*)\(/gm)].map((match) => match[1]);
  if (declared.length === 0)
    throw new Error(`no top-level function is declared at the start of a line in ${GUARD_PATH}`);

  const composerBodies = CORPUS_COMPOSERS.map(({ composer, corpus }) => ({
    corpus,
    body: functionBodyOf(composer, source)
  }));

  const readers = new Map<string, ReadonlySet<Corpus>>();
  for (const name of declared) {
    const body = functionBodyOf(name, source);
    if (!MATCHER_NAMES.some((matcher) => readsConstant(body, matcher))) continue;

    const corpora = new Set<Corpus>();
    for (const composer of composerBodies) {
      if (callsFunction(composer.body, name)) corpora.add(composer.corpus);
    }
    if (corpora.size === 0)
      throw new Error(
        `${name} reads a matcher in ${GUARD_PATH} but is called by neither ${CORPUS_COMPOSERS.map((entry) => entry.composer).join(' nor ')}, so every rule it holds runs over no corpus at all`
      );
    readers.set(name, corpora);
  }
  return readers;
}

/**
 * Each matcher's CORPUS, derived from the guard's own call graph rather than authored beside the disposition that depends on it.
 *
 * This is the closure of the corpus-blind `reported-by` disposition: `INVOKE_RE`'s computed cells named a matcher that runs over the adapter corpus alone, so the claim was true at the one address the generated variant measured it and false at the address `INVOKE_RE` was unanchored to reach. A hand-authored `corpus` field would have to be edited in lockstep with the guard's call graph, which is the defect class rather than the fix, so the value is read out of the source: `CORPUS_OF[matcher]` is the union of the corpora of every reader that takes a property off it. A matcher read by nothing throws by name.
 * @param source - The text to read, defaulting to the guard.
 * @returns One entry per name in `MATCHER_NAMES`.
 */
function deriveCorpusMap(source: string = GUARD_SOURCE): Record<string, ReadonlySet<Corpus>> {
  const readers = readerFunctionsOf(source);
  const map: Record<string, ReadonlySet<Corpus>> = {};

  for (const matcher of MATCHER_NAMES) {
    const corpora = new Set<Corpus>();
    for (const [reader, readerCorpora] of readers) {
      if (!readsConstant(functionBodyOf(reader, source), matcher)) continue;
      for (const corpus of readerCorpora) corpora.add(corpus);
    }
    if (corpora.size === 0)
      throw new Error(`${matcher} is read by no function in ${GUARD_PATH}, so it reports nothing forever`);
    map[matcher] = corpora;
  }
  return map;
}

/** The readers the guard declares, derived once. */
const READER_FUNCTIONS = readerFunctionsOf();

/** Every matcher's corpus, derived once. Never authored: see `deriveCorpusMap`. */
const CORPUS_OF = deriveCorpusMap();

/**
 * One matcher's corpus set as a sorted array, which is the form both the assertions and the failure messages read.
 *
 * The map is a PARAMETER rather than a closed-over constant, for the reason every other helper here takes its source as one: the derivation is measured against a synthetic guard below, and a reader that could only read the real map would have to be duplicated to say anything about the synthetic one.
 * @param map - A derived corpus map.
 * @param name - The matcher's name.
 * @returns Its corpora, sorted.
 */
function corpusListOf(map: Record<string, ReadonlySet<Corpus>>, name: string): Array<Corpus> {
  const corpora = map[name];
  if (corpora === undefined) throw new Error(`${name} has no derived corpus, so it is not on MATCHER_NAMES`);
  return [...corpora].sort();
}

/**
 * The cells whose mutant is required to stay GREEN, each with the measured reason no fixture can make it load-bearing.
 *
 * An exemption here is a CLAIM that a position cannot matter, not a note that nobody wrote a fixture for it — so its assertion is inverted rather than skipped. A change that ever makes an exempt position load-bearing turns its mutant red and fails this list, which is what forces the entry out instead of letting it quietly outlive its reason. The converse is held by the cell's own case: a non-exempt cell whose mutant stays green fails there, naming the matcher and the ordinal.
 */
const REDUNDANT_CELLS: Array<{ matcher: string; ordinal: number; reason: string }> = [
  {
    matcher: 'INVOKE_RE',
    ordinal: 1,
    reason:
      'This matcher is deliberately unanchored on its left, so a receiver reached through the optional punctuator was already matched from the dot onward and a plain dot still matches the dot inside that punctuator. No fixture can make the position load-bearing, which is why its redundancy is measured here rather than asserted in prose.'
  },
  {
    matcher: 'COMPUTED_FUNCTIONS_RE',
    ordinal: 1,
    reason:
      'This pattern anchors nothing to its left either: it begins AT the bracket, so a receiver reached through the optional punctuator is already matched from that bracket onward and reverting the cell leaves every committed shape still matched. Its mutant is therefore required to stay GREEN rather than skipped — an exemption is a claim that a position cannot matter, and a claim gets a measurement. Its sibling COMPUTED_INVOKE_RE gets no entry: both of its cells sit INSIDE the pattern, each is exercised by a committed fixture shape of its own, and both mutants go red.'
  }
];

/** One optional-punctuator admission in one matcher declaration — the unit of proof the mutation harness works in. */
interface PunctuatorCell {
  /** The matcher whose declaration carries it. */
  matcher: string;
  /** Its 1-based position in DECLARATION ORDER, so an exemption naming a matcher and an ordinal keeps meaning the same position across edits. */
  ordinal: number;
  /** Which of the three enumerated forms it is. */
  form: PunctuatorForm;
  /** The token as it is spelled in the guard's source. */
  token: string;
  /** What a revert replaces the token with. */
  plain: string;
  /** Its offset within the declaration slice. */
  offset: number;
  /** Its offset within the whole guard source, which is where a single-cell mutation is applied. */
  absoluteOffset: number;
  /** Whether it sits inside a negative LOOKAHEAD, DERIVED from the declaration's own lookahead spans rather than authored. A lookahead position admits a punctuator in order to REJECT it, so it has no spelling in the shape the matcher matches and belongs to no link of the call shape — which is why the bridge below partitions on this rather than counting one enumerated form. */
  inLookahead: boolean;
}

/**
 * Every optional-punctuator admission one matcher declares, in declaration order.
 *
 * The enumeration is DERIVED from the declaration text rather than authored beside it, which is the whole point: a position added to a matcher becomes a cell the moment it is written, without anybody remembering to add it to a list. Each cell is then mutated back to its plain form on its own and required to break the guard's self-test, so a position admitted with nothing depending on it is a named failure rather than the next reader's finding.
 *
 * It throws by name when two enumerated spans overlap, for the same reason its siblings throw when a constant is missing: an overlapping vocabulary would silently double-count one position, and a count nobody can trust is worse than no count.
 * @param name - The matcher constant's name.
 * @returns One cell per token occurrence, ordered by offset.
 */
function optionalPunctuatorCellsOf(name: string): Array<PunctuatorCell> {
  const span = matcherSpanOf(name);
  const lookaheads = lookaheadSpansOf(name);
  const found: Array<{ start: number; end: number; form: PunctuatorForm; token: string; plain: string }> = [];

  for (const { form, token, plain } of PUNCTUATOR_TOKENS) {
    let at = span.text.indexOf(token);
    while (at !== -1) {
      found.push({ start: at, end: at + token.length, form, token, plain });
      at = span.text.indexOf(token, at + token.length);
    }
  }
  found.sort((a, b) => a.start - b.start);
  for (let i = 1; i < found.length; i++) {
    if (found[i].start < found[i - 1].end)
      throw new Error(`${name}'s enumerated punctuator tokens overlap at offset ${found[i].start} in ${GUARD_PATH}`);
  }

  return found.map((cell, index) => ({
    matcher: name,
    ordinal: index + 1,
    form: cell.form,
    token: cell.token,
    plain: cell.plain,
    offset: cell.start,
    absoluteOffset: span.start + cell.start,
    inLookahead: lookaheads.some((lookahead) => cell.start >= lookahead.start && cell.end <= lookahead.end)
  }));
}

/**
 * A declaration reduced to what it matches LITERALLY: regex structure removed, escapes preserved.
 *
 * The vocabulary-closure assertion needs to ask "does this pattern still admit a punctuator character after every enumerated token is stripped", and the two punctuator characters answer that question differently. `?` is a metacharacter, so a LITERAL one is spelled `\?` and an unescaped one is a quantifier that must not be flagged. `!` is not a metacharacter, so a literal one is spelled bare — and so is the `!` in a lookaround opener (`(?<!`, `(?!`) and in a character class (`[=!<>]`), both of which two committed matchers carry. Reducing away the structure is what lets one predicate read both characters without failing on correct code.
 *
 * Escapes are PRESERVED rather than dropped, because `\?` surviving is the whole point of the first half. Character classes are dropped whole; group and assertion openers are dropped, their closing parenthesis left behind as harmless residue since only the two punctuator characters are read.
 * @param text - A regex declaration's source text, enumerated tokens already stripped.
 * @returns The same text with its regex structure removed.
 */
function literalResidualOf(text: string): string {
  let out = '';
  for (let index = 0; index < text.length; index++) {
    const ch = text[index];
    if (ch === '\\') {
      out += text.slice(index, index + 2);
      index++;
      continue;
    }
    if (ch === '[') {
      let end = index + 1;
      while (end < text.length && text[end] !== ']') {
        if (text[end] === '\\') end++;
        end++;
      }
      index = end;
      continue;
    }
    if (ch === '(') {
      const opener = /^\(\?(?::|=|!|<=|<!|<[A-Za-z_$][\w$]*>)/.exec(text.slice(index));
      if (opener !== null) {
        index += opener[0].length - 1;
        continue;
      }
    }
    out += ch;
  }
  return out;
}

/** A copy of the guard with exactly ONE cell reverted to its plain form, mutated inside that matcher's declaration slice only — a global replace would change the other matchers too and measure nothing. */
function guardWithCellReverted(cell: PunctuatorCell): string {
  return (
    GUARD_SOURCE.slice(0, cell.absoluteOffset) +
    cell.plain +
    GUARD_SOURCE.slice(cell.absoluteOffset + cell.token.length)
  );
}

/** Which punctuator a generated variant spells at the link under test. `member` is a dot, `computed` a bracket, `call` a parenthesis — each in a plain and an optional spelling. */
type PunctuatorKind = 'member' | 'computed' | 'call';

/**
 * What the suite is able to SAY about one (link x punctuator) cell, and what saying it costs in assertions.
 *
 * Five values, each with a measurement behind it. `matches`: the matcher reads both spellings there. `reported-by`: this matcher does not, the named one does, AND the named one runs over every corpus this one runs over — three claims, all three measured. `outside-the-pattern`: the link exists in the call shape but sits before anything the pattern anchors on, so the matcher matches under both spellings and matches with the link dropped altogether. `residual`: the matcher does not read it, and the guard's module docblock says so in the phrase named here.
 *
 * `admitted-by-exclusion` is the fifth, and it is the only one about a position the pattern does not CONSUME. The matcher admits the position solely in order to exclude ONE spelling of it in a negative lookahead, so both punctuator spellings match on the canonical shape — dropping the link matches too — while the input named in `excludedBy`, the spelling the lookahead exists to reject, does NOT. That last clause is what makes the verdict a measurement rather than a shrug: it goes red the moment the lookahead stops excluding what it was written to exclude, which is precisely how a future edit would reintroduce the singular assumption the widened rule replaced.
 *
 * The corpus half of `reported-by` was added after a review found a disposition that was true only where the generated variant happened to measure it. `INVOKE_RE`'s computed cells named `COMPUTED_ACCESS_RE`, a rule `checkOutsideSource` never calls, while `INVOKE_RE` itself is deliberately unanchored so it reads at the boundary address too — so the cell was certified covered at an address where the named rule does not run. A disposition that names a narrower matcher is now a named failure, and both corpora are derived from the guard's own call graph rather than declared here.
 */
type Disposition =
  | { verdict: 'matches' }
  | { verdict: 'reported-by'; matcher: string }
  | { verdict: 'outside-the-pattern'; reason: string; absent: string }
  | { verdict: 'admitted-by-exclusion'; reason: string; excludedBy: string }
  | { verdict: 'residual'; phrase: string };

/** One operator position of a matcher's canonical call shape. */
interface ShapeLink {
  /** Its name, which is what a failing cell is reported by. */
  id: string;
  type: 'member' | 'call';
  /** The member name, for a member link. */
  name?: string;
  /** The argument text, for a call link. */
  args?: string;
  /** The punctuator this link wears whenever it is not the link under test. */
  canonical: PunctuatorKind;
  dispositions: Partial<Record<PunctuatorKind, Disposition>>;
  /** A kind that is not a DISTINCT position at this link, with the reason and an input proving the spelling is caught anyway — so declaring it costs a measurement rather than silencing a cell. */
  samePosition?: { kind: PunctuatorKind; as: string; reason: string; provenBy: string };
  /** Set when the pattern anchors nothing to the LEFT of this link, so no trivia placed there can change whether it matches. */
  leftUnanchored?: string;
}

/** One matcher's canonical call shape, as an ordered list of links rather than as a string, so a cell can vary one link and leave the rest canonical. */
interface CallShape {
  matcher: string;
  head: string;
  tail: string;
  links: Array<ShapeLink>;
  /** Cells belonging to a negative LOOKAHEAD rather than to a link of the call shape — a lookahead position has no spelling in the shape it rejects — excluded from the bridge with a written reason. */
  lookaheadCells: { count: number; reason: string };
}

/**
 * The three spellings every operator position has in THIS language.
 *
 * `plain` and `optional` are JavaScript's. `non-null` is TypeScript's, and it is the one CR-01 found missing: `this.supabase!.from('elections')` puts the non-null assertion between the receiver and the punctuator, and no matcher admitted it at any position. It was UNCOUNTED rather than merely unreported — `collectAccesses` yielded no site, so check 3's "a site the guard cannot parse is a site it cannot cover" never fired and the per-family floor could not see the family go silent.
 *
 * It is a SPELLING here rather than a fourth `PunctuatorKind`, because it is the same POSITION spelled differently — which is exactly what the kind/spelling split already models. Adding it as a spelling is what makes the closure by construction: every cell the matrix generates is now rendered in three spellings instead of two, and every disposition arm has to say what the third one does. A position a future matcher admits `.` and `?.` at but not `!.` is a named failure here rather than the ninth review's finding.
 */
type PunctuatorSpelling = 'plain' | 'optional' | 'non-null';

/** One link, rendered at a given punctuator kind and spelling. */
function segmentOf(link: ShapeLink, kind: PunctuatorKind, spelling: PunctuatorSpelling): string {
  const optional = spelling === 'optional';
  const nonNull = spelling === 'non-null';
  if (link.type === 'call') return `${optional ? '?.' : nonNull ? '!' : ''}(${link.args})`;
  if (kind === 'member') return `${optional ? '?.' : nonNull ? '!.' : '.'}${link.name}`;
  return `${optional ? '?.' : nonNull ? '!' : ''}['${link.name}']`;
}

/** The canonical shape with ONE link spelled at the given kind and spelling, and every other link left canonical and plain. */
function renderCell(
  shape: CallShape,
  linkId: string | null,
  kind: PunctuatorKind,
  spelling: PunctuatorSpelling
): string {
  let out = shape.head;
  for (const link of shape.links) {
    out += link.id === linkId ? segmentOf(link, kind, spelling) : segmentOf(link, link.canonical, 'plain');
  }
  return out + shape.tail;
}

/** One link rendered with trivia around, inside or in place of its punctuator. */
function triviaSegmentOf(link: ShapeLink, mode: 'spaced' | 'newlined' | 'split' | 'commented', gap: string): string {
  if (mode === 'split') {
    // Whitespace INSIDE the two characters of an optional punctuator, which is not a punctuator at all.
    if (link.type === 'call') return `? (${link.args})`;
    return link.canonical === 'member' ? `? .${link.name}` : `? ['${link.name}']`;
  }
  if (mode === 'commented') {
    if (link.type === 'call') return `/* c */(${link.args})`;
    return link.canonical === 'member' ? `/* c */.${link.name}` : `/* c */['${link.name}']`;
  }
  if (link.type === 'call') return `${gap}(${link.args})`;
  return link.canonical === 'member' ? `${gap}.${gap}${link.name}` : `${gap}[${gap}'${link.name}'${gap}]`;
}

/** The canonical shape with trivia applied at one link, or at every link when no target is named. */
function renderTrivia(
  shape: CallShape,
  mode: 'spaced' | 'newlined' | 'split' | 'commented',
  targetId: string | null = null
): string {
  const gap = mode === 'newlined' ? '\n' : ' ';
  let out = shape.head;
  for (const link of shape.links) {
    out +=
      targetId === null || targetId === link.id
        ? triviaSegmentOf(link, mode, gap)
        : segmentOf(link, link.canonical, 'plain');
  }
  return out + shape.tail;
}

/**
 * One committed canonical call shape per matcher, expressed as LINKS.
 *
 * This is the other direction of the same defect the mutation harness closes. That one catches a token nothing exercises; this one catches a POSITION OF THE LANGUAGE that no matcher admits — which is how the optional-call punctuator arrived, invisible to every hand-written list of inputs because nobody thought to write it down. The cells are generated from links crossed with the punctuator kinds applicable to them, and a generated cell with no written disposition is a named failure.
 *
 * Each disposition is authored ONCE and measured TWICE, because the suite expands it into both spellings of its punctuator.
 */
const CALL_SHAPES: Array<CallShape> = [
  {
    matcher: 'ACCESS_RE',
    head: 'this',
    tail: ';',
    lookaheadCells: { count: 0, reason: '' },
    links: [
      {
        id: 'receiver-to-client',
        type: 'member',
        name: 'supabase',
        canonical: 'member',
        dispositions: {
          member: { verdict: 'matches' },
          computed: { verdict: 'reported-by', matcher: 'COMPUTED_RECEIVER_RE' }
        }
      },
      {
        id: 'client-to-chain-member',
        type: 'member',
        name: 'rest',
        canonical: 'member',
        dispositions: {
          member: { verdict: 'matches' },
          computed: { verdict: 'reported-by', matcher: 'COMPUTED_ACCESS_RE' }
        }
      },
      {
        id: 'chain-member-to-method',
        type: 'member',
        name: 'from',
        canonical: 'member',
        dispositions: {
          member: { verdict: 'matches' },
          computed: { verdict: 'reported-by', matcher: 'COMPUTED_ACCESS_RE' }
        }
      },
      {
        id: 'invocation',
        type: 'call',
        args: "'elections'",
        canonical: 'call',
        dispositions: { call: { verdict: 'matches' } }
      }
    ]
  },
  {
    matcher: 'SCHEMA_HOP_RE',
    head: 'this',
    tail: ".from('elections');",
    lookaheadCells: { count: 0, reason: '' },
    links: [
      {
        id: 'receiver-to-client',
        type: 'member',
        name: 'supabase',
        canonical: 'member',
        dispositions: {
          member: { verdict: 'matches' },
          computed: { verdict: 'reported-by', matcher: 'COMPUTED_RECEIVER_RE' }
        }
      },
      {
        id: 'client-to-chain-member',
        type: 'member',
        name: 'rest',
        canonical: 'member',
        dispositions: {
          member: { verdict: 'matches' },
          computed: { verdict: 'reported-by', matcher: 'COMPUTED_ACCESS_RE' }
        }
      },
      {
        id: 'chain-member-to-schema',
        type: 'member',
        name: 'schema',
        canonical: 'member',
        dispositions: {
          member: { verdict: 'matches' },
          computed: { verdict: 'reported-by', matcher: 'COMPUTED_ACCESS_RE' }
        }
      },
      {
        id: 'invocation',
        type: 'call',
        args: "'public'",
        canonical: 'call',
        dispositions: { call: { verdict: 'matches' } }
      }
    ]
  },
  {
    matcher: 'BOUNDARY_ACCESS_RE',
    head: 'locals',
    tail: ';',
    lookaheadCells: { count: 0, reason: '' },
    links: [
      {
        id: 'receiver-to-client',
        type: 'member',
        name: 'supabase',
        canonical: 'member',
        leftUnanchored:
          'The pattern begins AT the client identifier, so nothing to the left of this link is anchored and no trivia placed here can change whether it matches.',
        dispositions: {
          member: {
            verdict: 'outside-the-pattern',
            reason:
              'Out here the client is not a field of a class, so this matcher anchors on the client identifier itself and the object holding it is before everything the pattern reads. Both spellings match because neither is read.',
            absent: "supabase.rest.from('elections');"
          },
          computed: { verdict: 'residual', phrase: 'the computed spellings at that address are unreported' }
        }
      },
      {
        id: 'client-to-chain-member',
        type: 'member',
        name: 'rest',
        canonical: 'member',
        dispositions: {
          member: { verdict: 'matches' },
          computed: { verdict: 'residual', phrase: 'the computed spellings at that address are unreported' }
        }
      },
      {
        id: 'chain-member-to-method',
        type: 'member',
        name: 'from',
        canonical: 'member',
        dispositions: {
          member: { verdict: 'matches' },
          computed: { verdict: 'residual', phrase: 'the computed spellings at that address are unreported' }
        }
      },
      {
        id: 'invocation',
        type: 'call',
        args: "'elections'",
        canonical: 'call',
        dispositions: { call: { verdict: 'matches' } }
      }
    ]
  },
  {
    matcher: 'COMPUTED_ACCESS_RE',
    head: 'this.supabase',
    tail: "('elections');",
    lookaheadCells: { count: 0, reason: '' },
    links: [
      {
        id: 'client-to-chain-member',
        type: 'member',
        name: 'rest',
        canonical: 'member',
        dispositions: { member: { verdict: 'matches' } },
        samePosition: {
          kind: 'computed',
          as: 'terminal-computed',
          reason:
            'This pattern declares exactly ONE bracket, at the end of a chain whose length is free. A computed spelling at a chain link is therefore that same bracket with a shorter chain rather than a second position, and it is caught for that reason rather than left as a hole.',
          provenBy: "this.supabase['rest'].from('elections');"
        }
      },
      {
        id: 'terminal-computed',
        type: 'member',
        name: 'from',
        canonical: 'computed',
        dispositions: {
          computed: { verdict: 'matches' },
          member: { verdict: 'reported-by', matcher: 'ACCESS_RE' }
        }
      }
    ]
  },
  {
    matcher: 'COMPUTED_RECEIVER_RE',
    head: 'this',
    tail: ".from('elections');",
    lookaheadCells: { count: 0, reason: '' },
    links: [
      {
        id: 'receiver-to-client',
        type: 'member',
        name: 'supabase',
        canonical: 'computed',
        dispositions: {
          computed: { verdict: 'matches' },
          member: { verdict: 'reported-by', matcher: 'ACCESS_RE' }
        }
      }
    ]
  },
  {
    matcher: 'CLIENT_BINDING_RE',
    head: 'const db = this',
    tail: ';',
    lookaheadCells: {
      count: 2,
      reason:
        "The widened lookahead reads the WHOLE member chain — a member operator and a computed-or-call punctuator — in order to reject one spelling of it: an initialiser whose chain terminates in a call. Both positions therefore belong to no link of the call shape, because a lookahead position has no spelling in the shape the pattern matches. The count is not trusted: it is compared against a classification DERIVED from this declaration's own lookahead spans, so widening the lookahead again moves the measured side too."
    },
    links: [
      {
        id: 'receiver-to-client',
        type: 'member',
        name: 'supabase',
        canonical: 'member',
        dispositions: {
          member: { verdict: 'matches' },
          computed: { verdict: 'reported-by', matcher: 'COMPUTED_RECEIVER_RE' }
        }
      },
      {
        // The link CR-02 cost this matrix. Until it existed, `CLIENT_BINDING_RE`'s call shape had exactly ONE link, so no chain-link cell was ever generated and the bridge was satisfied by 1 link against 1 token — the links themselves being the hand-written list this matrix exists everywhere else to eliminate. A sub-object alias was therefore a position the matrix structurally could not see.
        id: 'client-to-chain-member',
        type: 'member',
        name: 'functions',
        canonical: 'member',
        dispositions: {
          member: {
            verdict: 'admitted-by-exclusion',
            reason:
              "The rule reports a binding of ANY node on the client's member chain, and declines only when that chain TERMINATES IN A CALL — which is what stops `this.supabase.from('elections')` being reported a second time as an alias when check 1 has already reported it as an access. So this position is admitted rather than consumed: both spellings of it are bindings the rule reports, and only the terminating call is excluded. The instant a future edit re-excludes any following member access, the plain and optional renderings stop matching and this cell goes red.",
            excludedBy: "const db = this.supabase.functions.invoke('send-email', {});"
          },
          computed: { verdict: 'reported-by', matcher: 'COMPUTED_ACCESS_RE' }
        }
      }
    ]
  },
  {
    matcher: 'INVOKE_RE',
    head: 'this.supabase',
    tail: ';',
    lookaheadCells: { count: 0, reason: '' },
    links: [
      {
        id: 'client-to-functions',
        type: 'member',
        name: 'functions',
        canonical: 'member',
        leftUnanchored:
          'The pattern begins AT this punctuator and anchors nothing before it, so a receiver reached any other way is matched from the dot onward regardless. This is the same property that makes this position a measured exemption in the mutation harness.',
        dispositions: {
          member: { verdict: 'matches' },
          computed: { verdict: 'reported-by', matcher: 'COMPUTED_FUNCTIONS_RE' }
        }
      },
      {
        id: 'functions-to-invoke',
        type: 'member',
        name: 'invoke',
        canonical: 'member',
        dispositions: {
          member: { verdict: 'matches' },
          computed: { verdict: 'reported-by', matcher: 'COMPUTED_INVOKE_RE' }
        }
      },
      {
        id: 'invocation',
        type: 'call',
        args: "'send-email', {}",
        canonical: 'call',
        dispositions: { call: { verdict: 'matches' } }
      }
    ]
  },
  {
    matcher: 'COMPUTED_INVOKE_RE',
    head: 'locals.supabase',
    tail: ';',
    lookaheadCells: { count: 0, reason: '' },
    links: [
      {
        id: 'client-to-functions',
        type: 'member',
        name: 'functions',
        canonical: 'member',
        leftUnanchored:
          'The pattern begins AT the identifier `functions` and anchors nothing before it, so a receiver reached any other way is matched from that identifier onward regardless.',
        dispositions: {
          member: {
            verdict: 'outside-the-pattern',
            reason:
              'This matcher decides everything from the member-name literal, so the object holding `functions` is before everything the pattern reads. Both spellings match because neither is read.',
            absent: "functions['invoke']('send-email', {});"
          },
          computed: { verdict: 'reported-by', matcher: 'COMPUTED_FUNCTIONS_RE' }
        }
      },
      {
        id: 'functions-to-invoke',
        type: 'member',
        name: 'invoke',
        canonical: 'computed',
        dispositions: {
          computed: { verdict: 'matches' },
          member: { verdict: 'reported-by', matcher: 'INVOKE_RE' }
        }
      },
      {
        id: 'invocation',
        type: 'call',
        args: "'send-email', {}",
        canonical: 'call',
        dispositions: { call: { verdict: 'matches' } }
      }
    ]
  },
  {
    matcher: 'COMPUTED_FUNCTIONS_RE',
    head: 'locals.supabase',
    tail: ".invoke('send-email', {});",
    lookaheadCells: { count: 0, reason: '' },
    links: [
      {
        id: 'client-to-functions',
        type: 'member',
        name: 'functions',
        canonical: 'computed',
        leftUnanchored:
          'The pattern begins AT the bracket and anchors nothing before it, so a receiver reached any other way is matched from that bracket onward regardless. This is the property its exemption in the mutation harness claims, and the two derivations are required to name the same matchers.',
        dispositions: {
          computed: { verdict: 'matches' },
          member: { verdict: 'reported-by', matcher: 'INVOKE_RE' }
        }
      }
    ]
  }
];

/**
 * One reused path beside the guard, at which every mutant is written, run and removed.
 *
 * Beside the original rather than in a temp directory, because the guard resolves both the shared comment classifier and the repository root RELATIVE TO ITS OWN LOCATION: a copy anywhere else fails for reasons that have nothing to do with what is under test. One path per process rather than one per cell, because the cases in a file run in sequence — and named distinctly from the two vacuity probes further down so a collision is impossible. All three paths are ignored by git, so a run that dies before its cleanup cannot leave a runnable copy of the guard in the tree for somebody to commit.
 */
const CELL_PROBE_PATH = `scripts/.cell-mutation-probe-${process.pid}.mjs`;

/**
 * Run a candidate guard source through the guard's own self-test.
 *
 * The self-test flag skips the walk of the five-hundred-file outside corpus, so one spawn costs about fifty milliseconds and the whole per-cell harness costs about a second. A harness that ran the full corpus per cell would be twenty times that, and would be the first thing somebody deleted.
 * @param source - The guard source to run, mutated or not.
 * @returns The spawn result.
 */
function selfTestOf(source: string): ReturnType<typeof spawnSync> {
  const probePath = resolve(REPO_ROOT, CELL_PROBE_PATH);
  try {
    writeFileSync(probePath, source);
    return spawnSync(process.execPath, [probePath, '--self-test'], { cwd: REPO_ROOT, encoding: 'utf8' });
  } finally {
    rmSync(probePath, { force: true });
  }
}

/**
 * How many times a name occurs in the guard OUTSIDE its own declaration.
 *
 * The difference between a rule that runs and a rule that is merely present. A matcher or a map can be declared, documented and never read, and the guard then reports green for a shape nobody is looking at — which is the exact state the invocation and schema-hop blind spots were found in, one level up. A second occurrence is what says something consumes it.
 * @param name - The constant's name.
 * @param declaration - That constant's own declaration slice, which is discounted.
 * @returns The number of occurrences elsewhere in the guard.
 */
function occurrencesOutside(name: string, declaration: string): number {
  const total = GUARD_SOURCE.split(name).length - 1;
  const inside = declaration.split(name).length - 1;
  return total - inside;
}

/**
 * The adapter sources the guard is expected to cover: `.ts` files anywhere under the adapter directory, excluding tests, type-only modules and barrels.
 *
 * Derived here by walking the tree rather than read off the guard, so this is an INDEPENDENT statement of the same population the guard's own check 5 computes. Two derivations of one set is the point: deleting either leaves the invariant asserted.
 *
 * It used to skip `utils/`, mirroring the guard — and that mirroring is precisely why "two derivations" did NOT cover CR-02: both derivations carried the same exclusion, so both were blind at the same address, and a third assertion agreeing with two identical blind spots proves nothing. The skip is gone from both, and `it('partitions the frontend source tree exhaustively between its two corpora')` below is the assertion that makes the pair genuinely independent — it walks the tree ONCE and holds the union of the two corpora against it, so an exclusion added to either walk has to be added to a written predicate as well or the partition stops closing.
 * @returns The repo-relative paths, sorted.
 */
function adapterSourcesOnDisk(): Array<string> {
  const found: Array<string> = [];
  const walk = (relDir: string): void => {
    for (const entry of readdirSync(resolve(REPO_ROOT, relDir)).sort()) {
      const relPath = `${relDir}/${entry}`;
      if (statSync(resolve(REPO_ROOT, relPath)).isDirectory()) {
        walk(relPath);
        continue;
      }
      if (!entry.endsWith('.ts')) continue;
      if (entry.endsWith('.test.ts') || entry.endsWith('.type.ts') || entry === 'index.ts') continue;
      found.push(relPath);
    }
  };
  walk(ADAPTER_DIR);
  return found.sort();
}

/**
 * The frontend sources the guard's boundary check is expected to cover: `.ts` and `.svelte` files under the frontend source tree, excluding everything under the adapter directory, tests, specs, type-only modules and ambient declarations.
 *
 * The sibling of `adapterSourcesOnDisk`, walked here for the reason that one gives: the guard decides which files it checks, so its own corpus is the one thing it cannot audit. This corpus is the larger of the two and the newer, which makes it the easier of the two to lose quietly — a walker that stops descending still returns a list, and a shorter list reports fewer violations without reporting anything at all about the difference.
 * @returns The repo-relative paths, sorted.
 */
function frontendSourcesOutsideAdapterOnDisk(): Array<string> {
  const found: Array<string> = [];
  const walk = (relDir: string): void => {
    for (const entry of readdirSync(resolve(REPO_ROOT, relDir)).sort()) {
      const relPath = `${relDir}/${entry}`;
      if (statSync(resolve(REPO_ROOT, relPath)).isDirectory()) {
        if (relPath !== ADAPTER_DIR && !relPath.startsWith(`${ADAPTER_DIR}/`)) walk(relPath);
        continue;
      }
      if (!entry.endsWith('.ts') && !entry.endsWith('.svelte')) continue;
      if (entry.endsWith('.test.ts') || entry.endsWith('.spec.ts')) continue;
      if (entry.endsWith('.type.ts') || entry.endsWith('.d.ts')) continue;
      found.push(relPath);
    }
  };
  walk(FRONTEND_SRC_DIR);
  return found.sort();
}

const ROOT_PACKAGE_JSON = JSON.parse(readFileSync(resolve(REPO_ROOT, 'package.json'), 'utf8')) as {
  scripts: Record<string, string>;
};

/** The `&&` chain, split and trimmed. Every assertion below is `toContain` over this array. */
const LINT_CHECK_LINKS = ROOT_PACKAGE_JSON.scripts['lint:check'].split('&&').map((link) => link.trim());

describe('the project-scoped query guard is wired into lint:check', () => {
  it('keeps `yarn assert:project-scoped-queries` a blocking link of lint:check', () => {
    expect(LINT_CHECK_LINKS).toContain('yarn assert:project-scoped-queries');
  });

  it('points that link at the committed script', () => {
    expect(ROOT_PACKAGE_JSON.scripts['assert:project-scoped-queries']).toBe(
      'node scripts/assert-project-scoped-queries.mjs'
    );
  });

  it('has not lost a link that already existed when the guard was appended', () => {
    // Wired-but-appended-destructively is the third failure mode: rewriting the chain value rather than appending to it can drop a sibling guard silently. These are the links that existed at the moment the new one was added; the assertion is that appending did not cost any of them. It deliberately says nothing about links added since.
    for (const link of [
      'turbo run lint',
      'yarn typecheck:tests',
      'yarn typecheck',
      'yarn assert:i18n-catalog-namespaces',
      'yarn assert:a11y-scan-wiring'
    ]) {
      expect(LINT_CHECK_LINKS).toContain(link);
    }
  });

  it('still has a script file behind the link, carrying its own name', () => {
    // Wired-but-deleted belongs here rather than at lint time: a missing script file makes the chain fail with a bare `node: cannot find module`, which names no invariant.
    expect(readFileSync(resolve(REPO_ROOT, 'scripts/assert-project-scoped-queries.mjs'), 'utf8')).toContain(
      'PROJECT-SCOPED QUERY GUARD'
    );
  });

  it('keeps the self-test fixtures the guard proves itself against, and keeps the guard pointed at them', () => {
    // Every guarded adapter source reaches the database only through the scoped helper, so a plain run examines zero forbidden sites and that zero says nothing on its own. The fixtures are what make the guard's own firing observable, so losing one silently returns it to that state.
    //
    // Existence alone is the WEAK half of this, and it is kept only as the cheap tripwire that names the missing path. The strong half is the last describe block in this file, which RUNS the wired spelling and requires it to report the fixture outcome — a fixture that exists but is exercised by nothing is exactly the state this guard was found in.
    // The guard composes both paths from a `FIXTURE_DIR` template literal, so the assertion is over the directory and the tail each entry actually spells rather than over the interpolated whole — the same shape the GUARDED_SOURCES assertion below uses.
    //
    // All FOUR tails, each asserted on its own. The list read `['violation.fixture.ts', 'clean.fixture.ts']` until this plan, and both of those strings are SUBSTRINGS of the two `outside-boundary.*` filenames — so the outside pair was covered by neither the file read (which resolved the short names) nor the `toContain` (which the long names satisfy incidentally). Two of the four were asserted; the list read as though four were.
    expect(GUARD_SOURCE).toContain(FIXTURE_DIR);
    for (const tail of FIXTURE_TAILS) {
      expect(readFileSync(resolve(REPO_ROOT, `${FIXTURE_DIR}/${tail}`), 'utf8').length, tail).toBeGreaterThan(0);
      expect(GUARD_SOURCE, tail).toContain(tail);
    }
  });

  it('keeps every negative control the fixtures rest on', () => {
    // The instrument before the measurement, twice over. An unreadable fixture would turn every `toContain` below into a failure whose cause is the READ rather than a deleted control, and an empty `shapes` list would report a pass over nothing — which is the exact shape of the two assertions 161-16 had to replace because they could not go red.
    expect(NEGATIVE_CONTROLS.length).toBeGreaterThan(0);
    for (const { fixture, shapes } of NEGATIVE_CONTROLS) {
      const text = readFileSync(resolve(REPO_ROOT, `${FIXTURE_DIR}/${fixture}`), 'utf8');
      expect(text.length, fixture).toBeGreaterThan(0);
      expect(shapes.length, fixture).toBeGreaterThan(0);
      // Named one at a time rather than by a count, so the failure message says WHICH control went missing. A count would say only that the total fell, which is the least useful half of what is known here.
      //
      // The assertion is over the DECLARATION rather than over the bare name, and that is WR-01's fix rather than a tidy-up. It read `expect(text).toContain(shape)` until here, over the fixture's whole text — and every control's name also appears in PROSE: in its own docblock, in a sibling's, or in a type member declared to make it self-describing. Deleting the control therefore left the assertion satisfied by a comment. The docblock two paragraphs up promised the opposite: "Presence is the half that has to survive a maintainer tidying the fixtures, and it is the half that goes red when one does." It did not.
      //
      // MEASURED, by re-running 161-19's deletion sweep over all twenty entries against both spellings rather than over the two the review named. Each control's declaration (plus the docblock immediately above it) was deleted from its fixture on disk on its own, the guard's self-test re-run, and both assertions evaluated against the mutated text. All twenty are still controls — the guard's summary came back byte-identical at exit 0 for every one, which reproduces 161-19's measurement. FIVE of the twenty were un-held by `toContain`: `clean :: destructuredCallResult`, `clean :: scopedFrom`, `outside-boundary.clean :: bucketUpload`, `violation :: scopedFrom` and `violation :: scopedTableRead`. The review named the first and the third; the sweep it asked for found three more, which is why it asked for the sweep. The declaration-anchored form below reddens on all twenty.
      //
      // Every control is a class METHOD (indented exactly two spaces, the fixtures being Prettier-formatted) or a top-level `export function`. A docblock mention can satisfy neither alternative, because neither admits a leading `*` or `` ` `` before the name and both require the opening parenthesis of a parameter list after it.
      for (const shape of shapes) {
        const declared = new RegExp(String.raw`^\s{2}(?:async\s+)?${shape}\s*\(|^export function ${shape}\s*\(`, 'm');
        expect(
          declared.test(text),
          `${fixture} :: ${shape} is no longer DECLARED (a docblock mention does not count)`
        ).toBe(true);
      }
    }
  });
});

/**
 * The guard's COVERAGE, asserted independently of the guard.
 *
 * The guard decides which files it checks, so its own list is the one thing it cannot audit. A file quietly moved out of `GUARDED_SOURCES`, or a new adapter source parked in the exception surface with a reason that means "not yet", reduces coverage while every command still reports green — the guard is running, it is just running over less. Both assertions below restate the invariant from outside the guard, so deleting either one leaves it asserted by the other.
 */
describe('the project-scoped query guard covers every adapter source', () => {
  it('declares an exception surface holding no not-yet-converted entry', () => {
    const deferred = declarationOf('DEFERRED_SOURCES');

    // The instrument first: the slice really is the declaration, so the absence asserted next is a measurement rather than a search of an empty string. Without this a renamed or restructured constant would make the assertion below pass forever.
    expect(deferred).toContain('DEFERRED_SOURCES');
    expect(deferred.endsWith(']')).toBe(true);

    // A reason recording that a file has not been converted yet is a backlog item, not an exception. Parked in this array it reads as a decision to the next person who opens the guard, which is how temporarily-reduced coverage becomes permanent.
    expect(deferred).not.toContain('conversion pending');
    // The same phrase must not reappear anywhere else in the guard either — including in the docblock that explains the rule, where it would read as a live entry to a grep.
    expect(GUARD_SOURCE).not.toContain('conversion pending');
  });

  it('names every adapter source in GUARDED_SOURCES', () => {
    const guarded = declarationOf('GUARDED_SOURCES');
    const sources = adapterSourcesOnDisk();

    // The corpus, proven before it is used: an empty walk would make the loop below assert nothing at all.
    expect(sources.length).toBeGreaterThan(0);
    expect(sources).toContain(`${ADAPTER_DIR}/supabaseAdapter.ts`);

    // The declaration builds each path from an `ADAPTER_DIR` template literal, so the assertion is over the tail each entry actually spells rather than over the interpolated whole.
    for (const source of sources) {
      expect(guarded).toContain(source.slice(ADAPTER_DIR.length + 1));
    }
  });

  it('partitions the frontend source tree exhaustively between its two corpora', () => {
    // CR-02's real closure. The guard walks the frontend source tree with TWO enumerators, and each one's exclusions are applied INSIDE it — so a file dropped by both is in neither corpus, and no check that iterates either list can ever see it. Check 5's "a source in neither GUARDED_SOURCES nor DEFERRED_SOURCES is a source nobody decided about" reads the output of the adapter walk, which is the very list the exclusion has already emptied.
    //
    // `apps/frontend/src/lib/api/adapters/supabase/utils/**` sat in that gap: skipped by the adapter walk's `utils` test and by the outside walk's `ADAPTER_DIR` prefix test. A probe file there carrying `this.supabase.from('elections')`, a raw `client.from('elections')` and an undispositioned Edge Function invocation produced ZERO violations and left every summary number byte-identical.
    //
    // Both walks now descend into it, and the two corpora above are no longer enough on their own: mirroring one walk in the other is what let two derivations share one blind spot. So the tree is walked ONCE here, and the union of the two corpora is held against it minus an exclusion predicate that has to be WRITTEN DOWN. An exclusion added to either walk and not to this predicate stops the partition closing, which is a named failure rather than a subtree that quietly leaves.
    const everySource: Array<string> = [];
    const walkAll = (relDir: string): void => {
      for (const entry of readdirSync(resolve(REPO_ROOT, relDir)).sort()) {
        const relPath = `${relDir}/${entry}`;
        if (statSync(resolve(REPO_ROOT, relPath)).isDirectory()) {
          walkAll(relPath);
          continue;
        }
        if (entry.endsWith('.ts') || entry.endsWith('.svelte')) everySource.push(relPath);
      }
    };
    walkAll(FRONTEND_SRC_DIR);

    /** Why a file under the frontend source tree is in NEITHER corpus. A reason each, because an exclusion list is where coverage quietly leaves. */
    const exclusionReasonFor = (relPath: string): string | null => {
      const name = relPath.slice(relPath.lastIndexOf('/') + 1);
      const inAdapterDir = relPath.startsWith(`${ADAPTER_DIR}/`);
      // Never run in production, and a test's whole job is to spell shapes production must not; type-only modules and ambient declarations emit no runtime code, so neither can issue a call.
      if (name.endsWith('.test.ts') || name.endsWith('.spec.ts') || name.endsWith('.type.ts') || name.endsWith('.d.ts'))
        return 'test, spec, type-only module or ambient declaration';
      // The adapter walk takes `.ts` only and drops barrels; the outside walk cannot pick either up, because it refuses everything under ADAPTER_DIR. Both are empty populations today and are written because the WALKS apply them, not because a file needs them.
      if (inAdapterDir && name === 'index.ts')
        return 'a barrel inside the adapter directory re-exports rather than queries';
      if (inAdapterDir && name.endsWith('.svelte'))
        return 'the adapter corpus is TypeScript only; a .svelte file here would be in neither corpus and is a finding';
      return null;
    };

    const adapter = adapterSourcesOnDisk();
    const outside = frontendSourcesOutsideAdapterOnDisk();

    // The instrument before the measurement: three non-empty populations, or every set operation below is a comparison of empty lists reporting a pass.
    expect(everySource.length).toBeGreaterThan(0);
    expect(adapter.length).toBeGreaterThan(0);
    expect(outside.length).toBeGreaterThan(0);

    // DISJOINT. A file in both corpora would be checked under two different rules, and the adapter's is the strict one — so an overlap is a file whose verdict depends on which walk reached it first.
    expect(
      adapter.filter((file) => outside.includes(file)),
      'sources claimed by BOTH corpora'
    ).toEqual([]);

    // EXHAUSTIVE. Every source the tree holds is in exactly one corpus, or carries a written reason for being in neither.
    const union = [...adapter, ...outside].sort();
    const expected = everySource.filter((file) => exclusionReasonFor(file) === null).sort();
    expect(
      expected.filter((file) => !union.includes(file)),
      'sources in NEITHER corpus and covered by no written exclusion — this is the CR-02 shape'
    ).toEqual([]);
    expect(
      union.filter((file) => !expected.includes(file)),
      'sources a corpus walks that the written exclusions say should be excluded'
    ).toEqual([]);
    expect(union).toEqual(expected);

    // The subtree the gap was found at, named so the closure cannot be undone silently by a walker that stops descending.
    expect(adapter, 'the utils subtree is inside the adapter corpus').toContain(`${ADAPTER_DIR}/utils/mapRow.ts`);
  });

  it('measures the one extension exclusion the boundary walk still carries', () => {
    // The partition above closes over `.ts` and `.svelte`. Every OTHER extension under the frontend source tree is in neither corpus, and the enumerator's own docblock says its exclusions "carry a reason each, because an exclusion list is where coverage quietly leaves" — while this one carried none at all.
    //
    // The reason is that every `.js` / `.mjs` file under this tree is GENERATED Paraglide message output, and generated i18n output issues no Supabase call. That is a property of the tree today rather than of the extension, so it is MEASURED here instead of asserted in prose: a hand-authored `.js` arriving under `apps/frontend/src` reddens this case by name, which is the difference between a stated exclusion and a silent one.
    const unwalked: Array<string> = [];
    const walkAll = (relDir: string): void => {
      for (const entry of readdirSync(resolve(REPO_ROOT, relDir)).sort()) {
        const relPath = `${relDir}/${entry}`;
        if (statSync(resolve(REPO_ROOT, relPath)).isDirectory()) {
          walkAll(relPath);
          continue;
        }
        if (entry.endsWith('.js') || entry.endsWith('.mjs') || entry.endsWith('.cjs')) unwalked.push(relPath);
      }
    };
    walkAll(FRONTEND_SRC_DIR);

    // The instrument before the measurement: the population is non-empty, so the `every` below is a statement about files rather than a vacuous pass over none. If Paraglide's output ever moves out of the source tree this goes red too — correctly, because the residual would then be describing an exclusion that excludes nothing.
    expect(
      unwalked.length,
      'no .js/.mjs under the frontend source tree — the stated exclusion excludes nothing'
    ).toBeGreaterThan(0);

    const handAuthored = unwalked.filter((file) => !file.startsWith(`${FRONTEND_SRC_DIR}/lib/paraglide/`));
    expect(
      handAuthored,
      'hand-authored .js/.mjs under the frontend source tree: these are walked by NEITHER corpus, so the boundary check has never read them'
    ).toEqual([]);

    expect(RESIDUAL_SECTION_PROSE).toContain(
      'so a .js or .mjs source under the frontend source tree is in neither corpus'
    );
  });
});

/**
 * The guard's reach past the receiver anchor, restated from outside the guard.
 *
 * Two shapes reach a project-scoped table without ever spelling `this.supabase.from(`: an Edge Function invocation, whose query runs in code no source guard can read, and a schema hop, whose table sits behind a call in the middle of the client chain. Each is answered by a declaration in the guard, and each declaration has the same two failure modes — it can be emptied of the thing it disposes, and it can be left in place while nothing reads it any more. Both are green states for every command in the repository, which is why they are asserted here as well as by the guard's own self-test: two derivations of one invariant, so deleting either leaves it asserted by the other.
 */
describe('the project-scoped query guard sees past the receiver anchor', () => {
  it('dispositions every Edge Function this repository invokes, and is read where it is declared', () => {
    const map = objectDeclarationOf('PROJECT_SCOPED_EDGE_FUNCTIONS');

    // The instrument first: the slice really is the declaration, so the absence asserted last is a measurement rather than a search of an empty string.
    expect(map).toContain('PROJECT_SCOPED_EDGE_FUNCTIONS');
    expect(map.endsWith('}')).toBe(true);

    // The three functions this repository invokes. A function invoked with no entry here is already a violation by the guard's own check; this says the entries that exist name the functions that are actually called, so the map cannot be quietly emptied while every command stays green.
    for (const fn of ['invite-candidate', 'identity-callback', 'send-email']) {
      expect(map).toContain(fn);
    }

    // Declared and read, not declared and forgotten.
    expect(occurrencesOutside('PROJECT_SCOPED_EDGE_FUNCTIONS', map)).toBeGreaterThanOrEqual(1);

    // A disposition recording that a function's queries carry no project term at all is a leak written down behind a word that looks decided. The function is fixed before it is dispositioned, so no entry may admit one.
    //
    // Scoped to the declaration deliberately: the guard's rpc-disposition docblock discusses that keyword in prose, so a whole-file search would match the explanation rather than an entry and this assertion would fail on correct code.
    expect(map).not.toContain('UNSCOPED');
  });

  it('keeps a schema-hop matcher, and keeps something reading it', () => {
    // The declaration is a regular expression rather than a literal container, so there is no slice to take. Presence and use are the two things worth asserting about it, and the second is the one that distinguishes a live rule from a decorative one.
    expect(GUARD_SOURCE).toContain('const SCHEMA_HOP_RE =');
    expect(GUARD_SOURCE.split('SCHEMA_HOP_RE').length - 1).toBeGreaterThanOrEqual(2);
    expect(GUARD_SOURCE).toContain('function checkSchemaHop(');
  });
});

/**
 * The guard's REACH past the adapter directory, restated from outside the guard.
 *
 * Until the boundary check existed, a project-scoped query issued from anywhere else under the frontend source tree was outside every check by construction — not deferred, not excepted, simply never looked at, while every command in the repository reported green. The rule that closes it has the same two failure modes every other declaration here has: the walker can stop finding files, and the matcher can be left in place while nothing reads it. Both are asserted here as well as by the guard's own self-test, so deleting either derivation leaves the invariant asserted by the other.
 */
describe('the project-scoped query guard reaches past the adapter directory', () => {
  it('walks a non-empty frontend corpus that excludes the adapter directory', () => {
    const sources = frontendSourcesOutsideAdapterOnDisk();

    // The corpus, proven before it is used: an empty walk would make the loop below assert nothing at all, which is the exact state the probe further down reproduces on purpose.
    expect(sources.length).toBeGreaterThan(0);
    // Route handlers are the part of this corpus that reaches a client at all, so a walk that found none of them found nothing worth walking.
    expect(sources.some((source) => source.startsWith('apps/frontend/src/routes/'))).toBe(true);

    for (const source of sources) {
      expect(source).not.toBe(ADAPTER_DIR);
      expect(source.startsWith(`${ADAPTER_DIR}/`)).toBe(false);
    }
  });

  it('keeps a boundary matcher and a widened walker, and keeps something reading each', () => {
    // Neither declaration is a container to slice, so presence and use are the two things worth asserting, and the second is the one that tells a live rule from a decorative one. A matcher nobody reads reports nothing forever, over a corpus nobody walks.
    expect(GUARD_SOURCE).toContain('const BOUNDARY_ACCESS_RE =');
    expect(GUARD_SOURCE.split('BOUNDARY_ACCESS_RE').length - 1).toBeGreaterThanOrEqual(2);
    expect(GUARD_SOURCE).toContain('function checkBoundary(');

    expect(GUARD_SOURCE).toContain('function enumerateFrontendSourcesOutsideAdapter(');
    expect(GUARD_SOURCE.split('enumerateFrontendSourcesOutsideAdapter').length - 1).toBeGreaterThanOrEqual(2);
  });
});

/**
 * The guard's NEAR MISSES, which are the half of the closure that cannot be generated.
 *
 * Every spelling a matcher must READ is generated above, from each matcher's committed call shape crossed with the punctuator set, so no hand-written list of inputs can leave a position unmeasured. What generation cannot supply is the other side: the shapes a matcher must LEAVE ALONE. Those are chosen, one per way each rule goes wrong, and a rule that matched everything would satisfy every positive above while reporting the whole repository.
 *
 * Each row also carries the ANCHOR its declaration must contain — an anchor per row rather than one shared string, because one of these matchers deliberately names no receiver at all — so the instrument is checked before anything is measured through it.
 */
describe('the project-scoped query guard leaves its near misses alone', () => {
  /** One matcher, with the substring its declaration must carry and the shapes it must not report. `nearMisses` is a list because the boundary matcher has two worth stating. */
  const OPERATOR_CASES: Array<{
    name: string;
    anchor: string;
    nearMisses: Array<string>;
  }> = [
    {
      name: 'ACCESS_RE',
      anchor: '#?supabase',
      // A client call that reaches no table at all. The access matcher decides from the METHOD, so a rule that reported this would report every use of the client.
      nearMisses: ["await this.supabase?.auth.updateUser({ password: 'x' });"]
    },
    {
      name: 'SCHEMA_HOP_RE',
      anchor: '#?supabase',
      // A plain table access with no mid-chain call. It is check 1's business, not check 8's, and a schema-hop rule that claimed it would double-report every access.
      nearMisses: ["this.supabase?.from('elections');"]
    },
    {
      name: 'BOUNDARY_ACCESS_RE',
      anchor: '[Ss]upabase',
      // The adapter's own public surface — the nearest miss the boundary rule has, since its receiver names Supabase and only the method name distinguishes it — and a plain collection helper, which is the widest way a boundary rule goes wrong.
      nearMisses: ['supabaseAdapter?.getElections();', 'Array.from(rows);']
    },
    {
      name: 'COMPUTED_ACCESS_RE',
      anchor: '\\bsupabase',
      // A ternary whose test is a Supabase-named identifier followed by a bracketed expression. It is what a lone optional `?` in this pattern would newly match, which is why the optional group holds the whole punctuator instead.
      nearMisses: ["const x = supabase ? ['a'] : b;"]
    },
    {
      name: 'COMPUTED_RECEIVER_RE',
      anchor: '#?supabase',
      // A bracketed key on a receiver that is not `this`, and a bracketed key on `this` that is not the client field. This rule anchors on both halves, so a matcher that dropped either would report one of these.
      nearMisses: ["const client = clients['supabase'];", "const x = this['supabaseAdapter'];"]
    },
    {
      name: 'INVOKE_RE',
      // This matcher is deliberately unanchored on the receiver, so its anchor is the member name it decides from.
      anchor: 'invoke',
      // A `functions` member read that is not an invocation. The disposition check is about the invocation, so a rule that fired here would demand a disposition for a call that names no function.
      nearMisses: ['this.supabase?.functions.list();']
    },
    {
      name: 'COMPUTED_INVOKE_RE',
      // Unanchored on its receiver for the reason its dot-spelled sibling is, so its anchor is the member name it decides from.
      anchor: 'invoke',
      // The plain invocation, which is INVOKE_RE's business and would be double-reported by a rule that claimed it; the same key and the same call on an identifier that merely ENDS in `functions`, which only the word boundary excludes; and a computed READ with no call at all, which the trailing parenthesis excludes.
      nearMisses: [
        "this.supabase?.functions.invoke('send-email', {});",
        "const handler = subfunctions['invoke']('x');",
        "const inv = this.supabase.functions['invoke'];"
      ]
    },
    {
      name: 'COMPUTED_FUNCTIONS_RE',
      // Unanchored on its receiver for the same reason, so its anchor is the member name whose computed spelling it exists to read.
      anchor: 'functions',
      // The plain member spelling, which is INVOKE_RE's business; and a key that merely BEGINS with the member name, which the closing-quote backreference is the only thing excluding.
      nearMisses: ["this.supabase.functions.invoke('send-email', {});", "const flags = config['functionsEnabled'];"]
    }
  ];

  it('measures every matcher on the committed list, and names no matcher that is not on it', () => {
    // The coupling that stops the two derivations drifting apart. This table and the mutation harness read one list, so a matcher added to the guard cannot be measured by one of them alone. The binding rule is the single deliberate absence: its repair is a NARROWING rather than a widening, so it gets the three-way discrimination test below instead of a row here.
    for (const { name } of OPERATOR_CASES) expect(MATCHER_NAMES).toContain(name);
    for (const name of MATCHER_NAMES) {
      const measured = OPERATOR_CASES.some((row) => row.name === name) || name === 'CLIENT_BINDING_RE';
      expect(measured).toBe(true);
    }
  });

  for (const { name, anchor, nearMisses } of OPERATOR_CASES) {
    it(`leaves ${name}'s near misses alone`, () => {
      const matcher = regexDeclarationOf(name);

      // The instrument first, and it has to be an instrument that CAN fail. Asserting a non-empty source passes on precisely the empty pattern it claims to catch — `new RegExp('').source` is the four-character group `(?:)` — and asserting the expression is not global measures the slicer, which never passes a flag, rather than the guard. So: the sliced source is not the empty pattern's own source, and it carries the substring this declaration is supposed to carry. An assertion over a pattern that was silently not found is a pass from an instrument pointed at nothing, and an empty pattern matches everything.
      expect(matcher.source).not.toBe(new RegExp('').source);
      expect(matcher.source).toContain(anchor);

      // The list is proven non-empty before it is looped, for the same reason: a row that lost its inputs would assert nothing while still reporting a pass.
      expect(nearMisses.length).toBeGreaterThan(0);
      for (const nearMiss of nearMisses) {
        expect(matcher.test(nearMiss), `${name} must not report ${nearMiss}`).toBe(false);
      }
    });
  }

  it('tells an aliased client apart from an optional-chained access in CLIENT_BINDING_RE', () => {
    // The one declaration in the guard whose trailing lookahead has to separate two findings rather than admit one spelling, so it gets its own multi-way measurement instead of the operator triple above.
    //
    // These assertions read differently under each candidate trailing lookahead, which is what makes them a measurement rather than a restatement of the code. All four readings were measured against the committed shape set. Drop the lookahead altogether and the last two fail, because both optional-chained table accesses are reported as aliases. Narrow it by adding a bare `?` to a character class and the second AND fifth fail, because `??` begins with the same character and the `.` in that class also excludes every binding one link along the chain. Keep the NARROW lookahead this rule carried before the receiver-depth axis was closed and the fifth fails, because a sub-object binding is excluded alongside the access it was written to exclude. Only the committed form — excluding an initialiser whose chain TERMINATES IN A CALL — passes all six.
    const binding = regexDeclarationOf('CLIENT_BINDING_RE');
    expect(binding.global).toBe(false);

    expect(binding.test('const db = this.supabase;')).toBe(true);
    expect(binding.test('const db = this.supabase ?? someOtherClient;')).toBe(true);
    // The fourth input, added with the third committed alias shape: this rule's own RECEIVER operator position, which was widened in source and exercised by nothing.
    expect(binding.test('const db = this?.supabase;')).toBe(true);
    // The two added with the promotion: a binding of a client SUB-OBJECT, which is the whole of CR-02, and the optional-CALL access bound to a local, which is the shape the widened lookahead's own call punctuator has to keep excluding.
    expect(binding.test('const fns = this.supabase.functions;')).toBe(true);
    expect(binding.test("const b = this.supabase?.from('candidates');")).toBe(false);
    expect(binding.test("const builder = this.supabase.from?.('constituencies');")).toBe(false);
  });
});

/**
 * The SLICER, measured rather than trusted.
 *
 * Every number below this point is taken through `matcherSpanOf`, so an instrument that finds the wrong text or silently finds none reports a measurement of nothing as a pass. Two failure modes are worth reproducing on purpose, and both are reproduced against a SYNTHETIC source rather than described: a marker matched inside prose that quotes a declaration, and an opening delimiter borrowed from the next declaration down.
 */
describe('the gate spec slices a matcher declaration from the declaration', () => {
  it('reads the declaration rather than a docblock line quoting one', () => {
    const synthetic = ['/** Explains the rule: const ACCESS_RE = /decoy/g; */', 'const ACCESS_RE = /real/g;', ''].join(
      '\n'
    );

    // A first-textual-occurrence marker slices the explanation; a line-anchored one slices the code. The docblock line begins with a space and a star, so it can never be a line-anchored `const`.
    expect(synthetic.indexOf('const ACCESS_RE =')).toBeLessThan(synthetic.indexOf('\nconst ACCESS_RE ='));
    expect(regexDeclarationOf('ACCESS_RE', synthetic).source).toBe('real');
  });

  it('throws naming the constant rather than borrowing the next declaration s literal', () => {
    // Absent altogether.
    expect(() => regexDeclarationOf('NOT_A_DECLARED_MATCHER_RE')).toThrow(/NOT_A_DECLARED_MATCHER_RE/);

    // Present, but carrying no literal of its own. An unbounded search for the opening delimiter takes the `/` of the docblock below it and then the pattern of whatever declaration follows; a bounded one throws by name, because a pattern that was not found is not a pattern that matched nothing.
    const synthetic = [
      'const NO_LITERAL_RE = 5;',
      '',
      '/** The next one. */',
      'const OTHER_RE = /borrowed/g;',
      ''
    ].join('\n');
    expect(() => regexDeclarationOf('NO_LITERAL_RE', synthetic)).toThrow(/NO_LITERAL_RE/);
    expect(regexDeclarationOf('OTHER_RE', synthetic).source).toBe('borrowed');
  });
});

/**
 * The CORPUS each matcher is exercised over, derived from the guard's own call graph.
 *
 * Until this block existed the corpus was an implicit property mentioned in prose in three docblocks and measured nowhere, and a `reported-by` disposition could therefore name a matcher that never runs at the address of the matcher it was disposing. That is not a hole somebody forgot to look at; it is a hole with a written certificate on it, which is worse, because the certificate is what the next reader plans against.
 *
 * The value is DERIVED rather than authored, and the difference is the whole point. A hand-written `corpus` field on each disposition would have to be edited in lockstep with the guard's call graph, and a constant that must be edited in lockstep with the code it describes is the defect class this whole spec exists to end. The derivation is possible here because the call graph is plain top-level function bodies: a function is a reader when it takes a property off a matcher, and its corpora are exactly the composers that call it.
 */
describe('the gate spec derives each matcher s corpus from the guard s own source', () => {
  it('derives each matcher s corpus from the guard s own call graph', () => {
    // The instrument first: an empty reader set would make every corpus below an empty set, and an empty set is a superset of nothing — every `reported-by` assertion would then pass by vacuity.
    expect(READER_FUNCTIONS.size).toBeGreaterThan(0);
    for (const corpora of READER_FUNCTIONS.values()) expect(corpora.size).toBeGreaterThan(0);

    // The second derivation, written out by hand, so deleting either leaves the fact asserted by the other. The three that run over both corpora are exactly the three the invocation check holds, which is the one check `checkSource` and `checkOutsideSource` each call.
    const expected: Record<string, Array<Corpus>> = {
      ACCESS_RE: ['adapter'],
      SCHEMA_HOP_RE: ['adapter'],
      COMPUTED_ACCESS_RE: ['adapter'],
      COMPUTED_RECEIVER_RE: ['adapter'],
      CLIENT_BINDING_RE: ['adapter'],
      BOUNDARY_ACCESS_RE: ['outside'],
      INVOKE_RE: ['adapter', 'outside'],
      COMPUTED_INVOKE_RE: ['adapter', 'outside'],
      COMPUTED_FUNCTIONS_RE: ['adapter', 'outside']
    };

    // Both directions, so a matcher added to one list and not the other fails here rather than going unmeasured. The derived map is read on the same footing as the hand-written one, so a matcher the derivation silently dropped fails here too.
    expect(Object.keys(expected).sort()).toEqual([...MATCHER_NAMES].sort());
    expect(Object.keys(CORPUS_OF).sort()).toEqual([...MATCHER_NAMES].sort());
    for (const name of MATCHER_NAMES) {
      expect(corpusListOf(CORPUS_OF, name), `${name}'s derived corpus`).toEqual(expected[name]);
    }
  });

  it('reads the call graph rather than a table, measured against a synthetic source', () => {
    // The negative control that makes the derivation a MEASUREMENT rather than a description. A hard-coded table would report the same answer for any source it was handed, so it is handed a source in which the answer is different: one where `checkOutsideSource` also composes the escape-hatch check, which is the single edit that would put `COMPUTED_ACCESS_RE` on both corpora.
    const composition =
      'return checkBoundary(relPath, text, violate, family) + checkEdgeFunctionInvocations(relPath, text, violate, family);';
    // The instrument first: if the line were not found, the "synthetic" copy would be the guard verbatim and this case would assert the real derivation twice.
    expect(GUARD_SOURCE).toContain(composition);
    const synthetic = GUARD_SOURCE.replace(
      composition,
      `${composition.slice(0, -1)} + checkEscapeHatches(relPath, text, violate);`
    );
    expect(synthetic).not.toBe(GUARD_SOURCE);

    const syntheticMap = deriveCorpusMap(synthetic);
    expect(corpusListOf(syntheticMap, 'COMPUTED_ACCESS_RE')).toEqual(['adapter', 'outside']);
    // And unmoved in the real one, which is the half that says the difference came from the source rather than from the derivation.
    expect(corpusListOf(CORPUS_OF, 'COMPUTED_ACCESS_RE')).toEqual(['adapter']);

    // The slicer under it throws by name rather than returning an empty body, for the reason every sibling slicer throws: an assertion over a body that was silently not found is a pass from an instrument pointed at nothing.
    expect(() => functionBodyOf('checkNothingAtAllInThisGuard')).toThrow(/checkNothingAtAllInThisGuard/);
  });
});

/**
 * Every operator position every matcher declares, PROVEN load-bearing by mutation.
 *
 * The defect this closes has been found and closed eight times in eight spellings, and each time the shape was the same: a position widened in the source, a sentence saying the closure was total, and nothing measuring it. A position nothing depends on reports green forever, and the only reader who ever finds it is the next review.
 *
 * So the positions are not listed here. They are ENUMERATED from the declaration text, each one is reverted to its plain form on its own, and the mutated copy of the guard is required to fail the guard's own self-test. A cell whose mutant stays green is a position admitted with nothing behind it, and it fails HERE, naming the matcher and the ordinal, instead of surviving to a ninth review. The one cell that cannot be proven is not skipped but INVERTED — its mutant is required to stay green — so an exemption is a measurement rather than a note.
 *
 * The control comes first and is not a formality. A harness in which every spawn fails for an unrelated reason — a bad path, an unreadable fixture, a syntax error in the copy — reports every cell as proven. Running the UNMUTATED source through the same path and requiring exit 0 is what makes a red mutant attributable to the mutation.
 *
 * What this costs, recorded rather than left for a reader to discover: the self-test flag skips the walk of the five-hundred-file outside corpus, so each spawn is about fifty milliseconds and the whole block is about a second. A harness that ran the full corpus per cell would be twenty times that, and would be the first thing somebody deleted.
 */
describe('every operator position every matcher declares is load-bearing, or is a measured exemption', () => {
  it('runs an unmutated copy of the guard through the same path and requires it to pass', () => {
    const control = selfTestOf(GUARD_SOURCE);
    expect(control.stdout).toContain('matching the committed expectation');
    expect(control.status).toBe(0);
  });

  it('names every matcher the guard declares that admits an optional punctuator', () => {
    // Every top-level constant the guard initialises with a REGULAR-EXPRESSION LITERAL, whatever it is named.
    //
    // The scan read `^const ([A-Z][A-Z0-9_]*_RE) =` until this fix, which made the whole of the back-pressure below conditional on a NAMING CONVENTION nothing in this repository enforces. A matcher constant spelled `CLIENT_ACCESS_PATTERN` or `NON_NULL_ACCESS` was absent from `declared`, so it was neither required to be on `MATCHER_NAMES` nor required to admit no punctuator — enumerated by nothing, disposed by nothing, mutated by nothing, while every case in this block stayed green. `161-REVIEW.md` names that WR-05.
    //
    // The discriminator is now the INITIALISER rather than the name: `=` followed by a regex literal. The `\s*` before the slash is load-bearing and measured, not decorative — `CLIENT_BINDING_RE` and `BOUNDARY_ACCESS_RE` both wrap their literal onto the next line, so the review's suggested `= \/` (a literal space) silently drops two of the nine matchers this list exists to hold. It fails loudly rather than silently, because the `toContain` loop below would then miss them; but a derivation that has to fail to be noticed is the defect, not the fix.
    const declared = [...GUARD_SOURCE.matchAll(/^const ([A-Z][A-Z0-9_]*) =\s*\//gm)].map((match) => match[1]);

    // The population proven before it is used, for the reason every other derivation here proves its own: an empty scan would make the loop below assert nothing while still reporting a pass.
    expect(declared.length).toBeGreaterThan(0);
    for (const name of MATCHER_NAMES) expect(declared).toContain(name);

    // The other direction, which is the one that catches an addition rather than a removal. A matcher constant the guard declares and this list omits may admit no optional punctuator at all — the two helper patterns are literal readers with none — so a new matcher carrying one fails here instead of going unenumerated. Labelled by name, because the failure this catches is a matcher nobody enumerated and the least useful version of that message is one that does not say which.
    for (const name of declared.filter((candidate) => !MATCHER_NAMES.includes(candidate))) {
      expect(matcherSpanOf(name).text, `${name} is an unenumerated matcher`).not.toContain('\\?');
    }
  });

  it('declares no exemption for a cell the enumeration does not produce', () => {
    const every = MATCHER_NAMES.flatMap((name) => optionalPunctuatorCellsOf(name));

    expect(every.length).toBeGreaterThan(0);
    for (const entry of REDUNDANT_CELLS) {
      // A stale exemption is a failure rather than a dead line: an entry naming a cell that no longer exists is an unmeasured claim wearing the shape of a measured one.
      expect(every.some((cell) => cell.matcher === entry.matcher && cell.ordinal === entry.ordinal)).toBe(true);
      expect(entry.reason.length).toBeGreaterThan(0);
    }
  });

  it('derives which cells belong to a negative lookahead from the declaration s own spans', () => {
    // The classification the bridge partitions on, measured rather than authored. A hand-written count of lookahead cells is right on the day it is written and wrong at the next widening of the lookahead — and a lookahead is exactly where a widening lands, because that is where a matcher says which shapes it declines. Deriving it means a position added inside a lookahead becomes an accounted-for cell the moment it is written.
    const binding = lookaheadSpansOf('CLIENT_BINDING_RE');

    // The instrument first: an empty span list would classify every cell as consumed and the partition below would be a pass from a derivation pointed at nothing.
    expect(binding.length).toBeGreaterThan(0);
    const bindingText = matcherSpanOf('CLIENT_BINDING_RE').text;
    for (const span of binding) {
      const sliced = bindingText.slice(span.start, span.end);
      expect(sliced.startsWith('(?!'), `the derived span must begin a negative lookahead: ${sliced}`).toBe(true);
      expect(sliced.endsWith(')'), `the derived span must end at its own closing parenthesis: ${sliced}`).toBe(true);
    }

    // The negative control, which is what says the derivation reads the DECLARATION rather than returning a constant: the access matcher declares no lookahead at all, so none of its cells may be classified into one.
    expect(lookaheadSpansOf('ACCESS_RE')).toEqual([]);
    for (const cell of optionalPunctuatorCellsOf('ACCESS_RE')) expect(cell.inLookahead).toBe(false);

    // And the binding rule, which is the one matcher that has both kinds: two positions inside its lookahead, admitted only in order to reject a spelling, and one the pattern actually CONSUMES.
    const bindingCells = optionalPunctuatorCellsOf('CLIENT_BINDING_RE');
    expect(bindingCells.map((cell) => cell.form)).toEqual(['member', 'member', 'computed-or-call']);
    expect(bindingCells.map((cell) => cell.inLookahead)).toEqual([false, true, true]);
    for (const cell of bindingCells) {
      const inside = binding.some((span) => cell.offset >= span.start && cell.offset < span.end);
      expect(cell.inLookahead, `${cell.matcher} cell ${cell.ordinal} (${cell.form})`).toBe(inside);
    }
  });

  it('enumerates four cells in the access matcher, in declaration order', () => {
    const cells = optionalPunctuatorCellsOf('ACCESS_RE');

    // Ordinals are assigned by the order a token appears in the declaration, which is what lets an exemption name a matcher and an ordinal and keep meaning the same position across edits.
    expect(cells.length).toBe(4);
    expect(cells.map((cell) => cell.ordinal)).toEqual([1, 2, 3, 4]);
    expect(cells.map((cell) => cell.form)).toEqual(['member', 'member', 'member', 'computed-or-call']);
    expect(cells.map((cell) => cell.plain)).toEqual(['\\.', '\\.', '\\.', '']);
    for (const cell of cells) {
      expect(GUARD_SOURCE.slice(cell.absoluteOffset, cell.absoluteOffset + cell.token.length)).toBe(cell.token);
    }
    expect(cells.map((cell) => cell.offset)).toEqual(
      [...cells].sort((a, b) => a.offset - b.offset).map((cell) => cell.offset)
    );
  });

  it('reverts each CLIENT_BINDING_RE cell to a different measured reading of the alias count', () => {
    // The promoted rule's three positions, each proven load-bearing for the REASON it is load-bearing rather than merely by a red. The harness above requires each mutant to break the self-test; a mutant that breaks it for an unrelated reason — a syntax error in the copy, an unreadable fixture, a path that does not resolve — is indistinguishable from a proof there. So each revert is additionally required to redden on the ALIAS COUNT specifically, which is the same instrument-first discipline the harness's own unmutated control uses, applied one level down.
    //
    // The three mechanisms, measured rather than predicted: reverting cell 1 (the receiver operator) stops `optionalReceiverAliasedClient` being reported and the count falls 5 -> 4; reverting cell 2 (the member operator inside the lookahead's chain) makes the lookahead unable to read `?.from`, so `optionalChainedTableRead`'s bound access is reported a SECOND time as an alias and the count rises 5 -> 6; reverting cell 3 (the computed-or-call token inside the lookahead) makes it unable to reject the optional-CALL spelling, so `optionalCallTableRead`'s bound access is reported as an alias and the count rises 5 -> 6. Two of the three live INSIDE the lookahead and move the count in OPPOSITE directions, which is what says they are distinct positions rather than one position counted twice.
    const cells = optionalPunctuatorCellsOf('CLIENT_BINDING_RE');
    expect(cells.length).toBe(3);

    // No exemption was added to make a position pass. An exemption is a CLAIM that a position cannot matter, and all three of these demonstrably can — so this rule may carry none, and a future edit that quiets a stubborn cell by exempting it fails here rather than in the next review.
    expect(REDUNDANT_CELLS.some((entry) => entry.matcher === 'CLIENT_BINDING_RE')).toBe(false);

    for (const cell of cells) {
      const label = `CLIENT_BINDING_RE cell ${cell.ordinal} (${cell.form})`;
      const result = selfTestOf(guardWithCellReverted(cell));

      expect(result.status, `${label} must break the guard's self-test`).not.toBe(0);
      expect(result.stderr, `${label} must redden on the alias count, not on an unrelated failure`).toContain(
        'check-6 aliased-client violation(s)'
      );
    }
  });

  for (const name of MATCHER_NAMES) {
    const cells = optionalPunctuatorCellsOf(name);

    it(`enumerates at least one optional-punctuator cell in ${name}`, () => {
      // A matcher whose enumeration silently returned nothing would report every one of its zero cells as proven, which is a pass from an instrument pointed at nothing.
      expect(cells.length).toBeGreaterThan(0);
    });

    it(`admits no punctuator in ${name} outside the three enumerated token forms`, () => {
      // What makes the vocabulary CLOSED. Strip every enumerated span from the declaration; whatever is left may not match a punctuator character LITERALLY. An author who admits one in a fourth form fails here, naming the matcher, rather than adding a cell nobody counts.
      //
      // WR-02: this tested `not.toContain('\\?')` and nothing else, so it was closed only over QUESTION MARKS. It measured the three enumerated forms against themselves rather than the matcher against the language, and any admission not spelled with `?` passed silently — including the `!?\s*` form the review itself proposed for CR-01, which contains no `\?` at all. The assertion whose comment promised "a fourth form is a decision somebody has to make, not a spelling that can arrive unnoticed" would have stayed green through exactly that arrival.
      //
      // Both punctuator characters are tested now, and the difference between them is why the residual has to be reduced first. A literal `?` is spelled `\?` — escaped, because it is a regex metacharacter — so an unescaped `?` is a QUANTIFIER (`#?supabase`, a lazy `*?`) and must not be flagged. A literal `!` is spelled BARE, because `!` is not a metacharacter, so it is indistinguishable from the `!` in a lookaround opener `(?<!` / `(?!` or in a character class such as `[=!<>]`. `literalResidualOf` removes the regex STRUCTURE — escapes preserved, character classes dropped, group and assertion openers dropped — leaving only what the pattern matches literally. Measured against all nine committed matchers, which leave neither character behind, and against three counterfactual fourth-form admissions, each of which is caught.
      let remainder = matcherSpanOf(name).text;
      for (const { token } of PUNCTUATOR_TOKENS) remainder = remainder.split(token).join('');
      const literal = literalResidualOf(remainder);

      expect(literal, `${name} admits a literal '?' outside the enumerated forms`).not.toContain('\\?');
      expect(literal, `${name} admits a literal '!' outside the enumerated forms`).not.toContain('!');
    });

    for (const cell of cells) {
      const exemption = REDUNDANT_CELLS.find(
        (entry) => entry.matcher === cell.matcher && entry.ordinal === cell.ordinal
      );

      it(`${exemption ? 'is measurably redundant' : "makes the guard's self-test fail"} when ${name} cell ${cell.ordinal} (${cell.form}) is reverted`, () => {
        const mutated = guardWithCellReverted(cell);

        // The mutation applied, before its effect is read: a revert that changed nothing would re-run the unmutated guard and report the position as proven by a green that means the opposite.
        expect(mutated).not.toBe(GUARD_SOURCE);

        const status = selfTestOf(mutated).status;
        if (exemption) expect(status).toBe(0);
        else expect(status).not.toBe(0);
      });
    }
  }
});

/**
 * Every punctuator the language has, at every operator position every matcher declares.
 *
 * The mutation harness above closes one direction: a token nothing exercises. This block closes the other: a position the language HAS that no matcher admits. That is the direction the optional-call punctuator arrived through, and no hand-written list of inputs could have surfaced it, because a list only holds what somebody thought to write down. So the cells are GENERATED — links crossed with the punctuator kinds applicable to them — and a generated cell with no written disposition is a named failure rather than a silence.
 *
 * The BRIDGE between the two enumerations is the strongest thing here. Per matcher, the number of links admitting a member punctuator must equal the number of member-operator tokens the declaration carries, and the number admitting a computed or call punctuator must equal the number of computed-or-call tokens. It goes red in both directions: a token with no link is a position exercised by nothing, and a link with no token is a position of the call shape nothing admits. Deleting either enumeration leaves the invariant asserted by the other; deleting the bridge is itself a test failure.
 */
describe('every punctuator at every operator position carries a written disposition', () => {
  it('commits a canonical call shape for every matcher on the list, and for no matcher off it', () => {
    for (const name of MATCHER_NAMES) expect(CALL_SHAPES.map((shape) => shape.matcher)).toContain(name);
    for (const shape of CALL_SHAPES) expect(MATCHER_NAMES).toContain(shape.matcher);
  });

  it('states exactly the residuals the matrix pins, and no others', () => {
    // Both directions, which is the whole point. Every pinned phrase must be in the docblock, so a residual cannot be measured without being stated; and the docblock's stated-residual list must hold exactly as many entries as there are pinned phrases, so a residual cannot be stated without being measured.
    for (const phrase of RESIDUAL_PHRASES) expect(RESIDUAL_SECTION_PROSE).toContain(phrase);
    expect(residualBulletCountOf(RESIDUAL_SECTION)).toBe(RESIDUAL_PHRASES.length);

    // The two sentences a reach paragraph must not carry: a universal claim about the punctuator set, and a claim that a fixture and a count already prove it for every matcher. Both were true the day they were written and false at the next widening, with nothing anywhere failing.
    expect(GUARD_SOURCE).not.toContain('route past any of the nine checks');
    expect(GUARD_SOURCE).not.toContain('count proving it rather than a sentence here saying so');

    // And no matcher-local paragraph may carry a residual COUNT of its own — a numeral stated beside one matcher is wrong the moment the list above moves, which is the identical defect one scope down.
    expect(GUARD_SOURCE).not.toContain('ONE RESIDUAL');
  });

  it('reddens when a stated residual is deleted from the docblock', () => {
    // The both-directions invariant above, DEMONSTRATED rather than described. The sibling case says a residual cannot be stated without being measured, and rests that on a bullet count; this case deletes one whole bullet from a scratch copy of the guard's source and shows the count it rests on actually fall — at SIX phrases rather than the four the invariant was written against.
    //
    // The phrase is 161-17's, chosen because it is the newest and the least likely to be load-bearing anywhere else. The copy is never written to disk and never handed to `selfTestOf`: deleting a docblock bullet changes no BEHAVIOUR, so a self-test run over it would come back green and would be measuring the wrong thing entirely. The reading belongs where the sibling case does its own — in the spec's reading of the text.
    const phrase = 'a computed member whose key is not a string literal is unreported';
    const lines = GUARD_SOURCE.split('\n');
    const bulletAt = lines.findIndex((line) => RESIDUAL_BULLET_RE.test(line) && line.includes(phrase));
    // The instrument first: a phrase that was not found would delete nothing and leave every assertion below reading the unmutated guard, which is a pass that says nothing.
    expect(bulletAt, `${phrase} must be a stated-residual bullet to be deleted`).toBeGreaterThan(-1);

    // The WHOLE bullet — its own line plus the continuation lines that wrap it — because deleting only the first would leave an orphaned half-sentence the docblock could never have been written with.
    let end = bulletAt + 1;
    while (end < lines.length && RESIDUAL_CONTINUATION_RE.test(lines[end])) end++;
    expect(end, 'the chosen bullet wraps, so its deletion must span more than one line').toBeGreaterThan(bulletAt + 1);

    const mutated = lines.slice(0, bulletAt).concat(lines.slice(end)).join('\n');
    const mutatedSection = residualSectionOf(mutated);

    expect(mutated).not.toBe(GUARD_SOURCE);
    expect(residualBulletCountOf(mutatedSection)).toBe(RESIDUAL_PHRASES.length - 1);
    expect(residualProseOf(mutatedSection)).not.toContain(phrase);
    // And the real source still carries it, so a failure above is a statement about the DELETION rather than about a phrase that had already gone.
    expect(RESIDUAL_SECTION_PROSE).toContain(phrase);
  });

  it('binds every left-unanchored admitted position to a measured exemption', () => {
    // A position the pattern admits but anchors nothing to the left of cannot be made load-bearing by any fixture, which is exactly what an exemption claims. The two derivations therefore have to name the same matchers, or one of them is describing a matcher the other has never heard of.
    //
    // The predicate reads BOTH admitted punctuator kinds, and the widening is what lets a computed-key matcher's exemption be bound the same way a dot-key matcher's is. Reading `member` alone could not see a left-unanchored position whose admitted punctuator is the COMPUTED one, so `COMPUTED_FUNCTIONS_RE` would carry an exemption in the harness that nothing on this side ever named — the two derivations would drift apart in exactly the direction this case exists to prevent.
    const unanchored = CALL_SHAPES.filter((shape) =>
      shape.links.some(
        (link) =>
          link.leftUnanchored !== undefined &&
          (link.dispositions.member?.verdict === 'matches' || link.dispositions.computed?.verdict === 'matches')
      )
    ).map((shape) => shape.matcher);

    expect(new Set(unanchored)).toEqual(new Set(REDUNDANT_CELLS.map((entry) => entry.matcher)));
    for (const shape of CALL_SHAPES) {
      for (const link of shape.links) {
        if (link.leftUnanchored !== undefined) expect(link.leftUnanchored.length).toBeGreaterThan(0);
      }
    }
  });

  it('reads a forbidden shape quoted inside a string literal as live code', () => {
    // A stated residual rather than a repair: the guard excludes COMMENT spans from both corpora and string spans from neither, so a shape quoted to explain it is read as the thing it explains. Measured here, stated in the docblock, and the two fail together.
    for (const shape of CALL_SHAPES) {
      const matcher = regexDeclarationOf(shape.matcher);
      expect(matcher.test(`const quoted = "${renderCell(shape, null, 'member', 'plain')}";`)).toBe(true);
    }
    expect(RESIDUAL_SECTION_PROSE).toContain('a forbidden shape quoted inside a string literal is read as live code');
  });

  it('reads only an initialiser that begins with the receiver in the binding rule', () => {
    // The other residual that is about DIRECTION rather than reach, and it runs both ways. A client aliased to the right of a nullish coalescing or a ternary is not reported, and a ternary TEST on the client is reported as an alias although it binds nothing. Both are measured so the sentence in the docblock cannot drift from either.
    const binding = regexDeclarationOf('CLIENT_BINDING_RE');

    expect(binding.test('const db = this.supabase;')).toBe(true);
    expect(binding.test('const db = other ?? this.supabase;')).toBe(false);
    expect(binding.test('const db = cond ? this.supabase : other;')).toBe(false);
    expect(binding.test('const hasClient = this.supabase ? 1 : 0;')).toBe(true);
    expect(RESIDUAL_SECTION_PROSE).toContain(
      'the binding rule reads only an initialiser that begins with the receiver'
    );
  });

  it('reports a bound scalar member of the client as an alias', () => {
    // The residual the PROMOTION costs, pinned in both directions so neither half can outlive the other.
    //
    // The binding rule decides from the member NAME alone, and no client-member disposition list is declared: `= this.supabase.functions;` and `= this.supabase.restUrl;` are the same source shape and the rule has nothing to separate them by. So the rule that reports `const fns = this.supabase.functions;` — the finding this whole axis exists for — necessarily reports a plain member read too, and for ANY such site the message is a false statement about what was bound. It is a decided limitation with a committed fixture shape (`boundClientMemberRead`) and a docblock line behind it, not an unstated hole.
    //
    // WR-03 corrected the claim this used to rest on. It read "No source-level rule CAN tell a bound client SUB-OBJECT from a bound SCALAR member" — an impossibility, used to authorise moving a known false positive out of the negative corpus. One can: a `CLIENT_SUB_OBJECTS` disposition map does it at source level with no type information, exactly as `NON_PROJECT_SCOPED_TABLES` already does for a table literal. The map is not declared because it is a seventh mandatory-disposition list with its own arrival check, fixtures and mutation cells — a decided cost, filed rather than pretended away. WR-04 corrected the scope in the same edit: the false positive is EVERY `const x = this.supabase.<scalar-member>;` a guarded source writes, an unbounded class of which the fixture holds one instance, not "that one site".
    //
    // The two halves are asserted together on purpose. The first is the false positive the promotion accepts; the second is the nearest LIVE shape it must not reach — a destructure of a CALL RESULT, live at `apps/frontend/src/lib/api/adapters/supabase/dataWriter/supabaseDataWriter.ts:166` — and if the second ever became true the limitation would have stopped being a stated cost and become a broken build.
    const binding = regexDeclarationOf('CLIENT_BINDING_RE');

    expect(binding.test('const restUrl = this.supabase?.restUrl;')).toBe(true);
    expect(binding.test('const { data } = await this.supabase.auth.getUser();')).toBe(false);
    expect(RESIDUAL_SECTION_PROSE).toContain(
      'the binding rule decides from the member NAME alone and no client-member disposition list is declared, so a plain member read bound to a local is reported as an alias'
    );
  });

  it("reads TypeScript's non-null assertion at every operator position, and holds each by a fixture", () => {
    // CR-01. Every matcher spelled its member operator `\??\.`, which is JAVASCRIPT's optional-chaining set. This repository is TypeScript, whose member-access punctuator set additionally contains `!.` — 54 live occurrences under apps/frontend/src, an established house spelling. `this.supabase!.from('elections')` was UNCOUNTED at every position: no site yielded, so check 3 never fired, `tally.accesses` never moved, and the per-family floor could not see the family go silent.
    //
    // The matrix above already requires the `non-null` SPELLING at every dispositioned cell, which is the by-construction half. This is the other half the phase's standard asks for: each admission is also held down by a COMMITTED FIXTURE whose disposition depends on it, so the closure is a count rather than only a rendering.
    const violation = readFileSync(resolve(REPO_ROOT, `${FIXTURE_DIR}/violation.fixture.ts`), 'utf8');
    const outside = readFileSync(resolve(REPO_ROOT, `${FIXTURE_DIR}/outside-boundary.violation.fixture.ts`), 'utf8');

    // Declaration-anchored for WR-01's reason: these names appear in prose too, and a control a docblock mention can satisfy is not a control.
    for (const [text, fixture, shapes] of [
      [
        violation,
        'violation.fixture.ts',
        [
          'nonNullAssertedTableRead',
          'nonNullAssertedSchemaHop',
          'nonNullAssertedInvocation',
          'nonNullAssertedComputedAccess'
        ]
      ],
      [outside, 'outside-boundary.violation.fixture.ts', ['nonNullAssertedTableRead', 'nonNullAssertedInvocation']]
    ] as Array<[string, string, Array<string>]>) {
      expect(text.length, fixture).toBeGreaterThan(0);
      for (const shape of shapes) {
        const declared = new RegExp(String.raw`^\s{2}(?:async\s+)?${shape}\s*\(|^export function ${shape}\s*\(`, 'm');
        expect(declared.test(text), `${fixture} :: ${shape} must stay DECLARED`).toBe(true);
      }
    }
    // And that each really does carry the non-null assertion, which is the property they exist for — rewriting one to a plain dot would leave it declared and stop measuring anything.
    expect(violation.match(/this\.supabase(\.functions)?!\s*[.[]/g)?.length ?? 0).toBeGreaterThanOrEqual(4);
    expect(outside.match(/locals\.supabase(\.functions)?!\s*\./g)?.length ?? 0).toBeGreaterThanOrEqual(2);

    // THE PARENTHESISED RECEIVER, the decision the review asked for explicitly: a violating shape, or a stated residual. It is a residual, and it is MEASURED rather than asserted. A parenthesis is not a punctuator — it is a piece of the receiver's EXPRESSION GRAMMAR, and widening the receiver is the one widening this guard declines on principle, which is the same distinction the schema-hop docblock draws between a closed punctuator set and an open-ended receiver. There is no live instance.
    const parenthesised = "return (this.supabase).from('elections').select('*');";
    for (const name of [
      'ACCESS_RE',
      'BOUNDARY_ACCESS_RE',
      'CLIENT_BINDING_RE',
      'SCHEMA_HOP_RE',
      'COMPUTED_ACCESS_RE'
    ]) {
      expect(regexDeclarationOf(name).test(parenthesised), `${name} must not read a parenthesised receiver`).toBe(
        false
      );
    }
    // The instrument: the same shape WITHOUT the parentheses is read, so the five falsehoods above are statements about the parentheses rather than about a shape no matcher was ever going to match.
    expect(regexDeclarationOf('ACCESS_RE').test("return this.supabase.from('elections').select('*');")).toBe(true);
    expect(RESIDUAL_SECTION_PROSE).toContain('a receiver wrapped in PARENTHESES is unread by every matcher here');
  });

  it('classifies a destructure by brace balance across the statement, not across the line', () => {
    // WR-06. The alias and destructure counts are pinned separately, with the stated rationale that "a change that moved one into the other's family would leave a pooled total intact and fail here by name". That rationale is only worth something while the CLASSIFIER is right, and a line-scoped read of a statement that may wrap is not.
    //
    // Two shapes were misclassified, both in the same direction — reported as an ALIAS, counted in the wrong family, with a message that is a false statement about the site. The review named the first; the second was found by measuring it. A destructure a formatter has WRAPPED presents only `} ` before the `=` on the match's own line, which has no opening brace; and a NESTED pattern such as `const { a: { from } } = this.supabase;` is rejected because `[^{}]*` cannot cross the inner braces.
    //
    // The guard now decides by brace BALANCE from the `=` leftward, which spans newlines and nests by construction. Asserted here over the guard's own exported behaviour surface — the MESSAGE it emits — because the classification is only observable through which of the two message texts a site gets.
    const violation = readFileSync(resolve(REPO_ROOT, `${FIXTURE_DIR}/violation.fixture.ts`), 'utf8');

    // The two shapes are COMMITTED, in the spellings that make each repaired reading load-bearing. Presence is asserted the way every other negative-control declaration is, so tidying either away is a named failure rather than a count that quietly returns to the wrong family.
    for (const shape of ['destructuredAcrossLines', 'destructuredNestedPattern']) {
      const declared = new RegExp(String.raw`^\s{2}(?:async\s+)?${shape}\s*\(`, 'm');
      expect(declared.test(violation), `${shape} must stay DECLARED in violation.fixture.ts`).toBe(true);
    }
    // And that the wrapped one really is wrapped, which is the whole property it exists to carry: a formatter joining it onto one line would leave the count intact and the position proven by nothing.
    expect(violation, 'destructuredAcrossLines must span lines to mean anything').toMatch(
      /const \{\s*\n\s*from\s*\n\s*\} = this\.supabase;/
    );

    // The classifier itself is a function rather than a regex, precisely because brace balance is not a regular property — so it is exercised through the guard rather than re-implemented here. The guard's own self-test pins destructureCount at 4 and aliasCount at 5; this asserts the guard still SPELLS both families, so a refactor that collapsed them into one message would fail here rather than leaving a four-way discriminator reading a single text.
    expect(GUARD_SOURCE).toContain('destructures the raw client');
    expect(GUARD_SOURCE).toContain('aliases the raw client or one of its members');
    // The line-scoped read is gone, and the absence is anchored on the DECLARATION rather than the bare name — the docblock that explains the repair quotes the old constant, and an absence assertion satisfied by prose fails on correct code, which is WR-01's defect class with its sign flipped.
    expect(GUARD_SOURCE, 'the line-scoped destructure classifier must not return').not.toContain(
      'const DESTRUCTURING_LHS_RE'
    );
    expect(GUARD_SOURCE).toContain('function bindsByDestructuring');
  });

  it('leaves a client held in a parameter unread by every adapter-corpus matcher, and says so', () => {
    // CR-03's residual, MEASURED in both directions rather than asserted in prose.
    //
    // A client reached through a PARAMETER is past every anchor the adapter corpus has. There is no `=`, so the binding rule misses it; the receiver is `client` rather than `this.supabase`, so the table and rpc matcher misses it; and `BOUNDARY_ACCESS_RE`, whose receiver IS wide enough to read it, only ever runs over the corpus outside the adapter directory. The consequence generalises past the one live instance: any guarded source may hand `this.#supabase` to a function that then issues arbitrary unscoped queries, uncounted — so check 3's "a site the guard cannot parse is a site it cannot cover" never fires, and `tally.accesses` does not move.
    const access = regexDeclarationOf('ACCESS_RE');
    const binding = regexDeclarationOf('CLIENT_BINDING_RE');
    const boundary = regexDeclarationOf('BOUNDARY_ACCESS_RE');
    const shape = "return client.from('elections').select('*');";

    // The instrument first: the anchored matcher DOES read the receiver-spelled shape, so the three falsehoods below are statements about the PARAMETER rather than about a matcher that reads nothing.
    expect(access.test("return this.supabase.from('elections').select('*');")).toBe(true);

    expect(access.test(shape), 'ACCESS_RE is receiver-anchored').toBe(false);
    expect(binding.test(shape), 'CLIENT_BINDING_RE needs a leading `=`').toBe(false);

    // The boundary rule is the one whose receiver is wide enough to reach a bare local — and it does NOT read this either, for a SECOND reason measured here rather than assumed. It anchors on the client's conventional NAME (`[\w$]*[Ss]upabase[\w$]*`), and the live parameter is called `client`. So the shape is past THREE matchers, not two.
    expect(boundary.test(shape), 'BOUNDARY_ACCESS_RE anchors on a supabase-NAMED receiver').toBe(false);
    // The discriminator is the NAME rather than the parameter-ness: rename the same parameter and the boundary rule reads it. That is what says the miss above is about the identifier, so a reader cannot conclude that parameters as such are covered out here.
    expect(boundary.test("return supabaseClient.from('elections').select('*');")).toBe(true);
    // And `CORPUS_OF` is what says that even a supabase-named parameter goes unread at THIS address: the boundary rule never runs over the adapter corpus at all.
    expect(CORPUS_OF['BOUNDARY_ACCESS_RE'], 'BOUNDARY_ACCESS_RE runs OUTSIDE the adapter directory only').not.toContain(
      'adapter'
    );

    // And the LIVE counter-example, read off disk rather than quoted from the review, because the check-6 docblock's corrected sentence is a claim ABOUT THIS REPOSITORY. `tableBuilder` is an exported function taking the client as a parameter and calling `.from(` on it, inside a GUARDED source — which is what makes "a guarded adapter source has no legitimate need for any of the six" a sentence that had to lose its clause about the accessor RETURNING the client.
    const adapter = readFileSync(resolve(REPO_ROOT, `${ADAPTER_DIR}/supabaseAdapter.ts`), 'utf8');
    expect(adapter.length).toBeGreaterThan(0);
    expect(adapter, 'the live param-held client the residual names').toMatch(
      /export function tableBuilder[\s\S]{0,400}?\(\s*client:[\s\S]{0,200}?client\s*\.\s*from\s*\(/
    );

    expect(RESIDUAL_SECTION_PROSE).toContain('a client held in a PARAMETER is read by neither');
  });

  it('admits every JavaScript spelling of a computed string key', () => {
    // JavaScript has THREE spellings of a string key — apostrophe, double quote and backtick — and a closure that read two of them would leave the third an enumerable spelling that evades it on the day it lands. That is the shape of every defect this file has been extended to close, so the third spelling is exercised rather than assumed.
    //
    // The input is rendered from each matcher's own `CALL_SHAPES` entry rather than written out here, so this case cannot drift from the shape the matrix measures: change the committed call shape and this case changes with it.
    for (const name of ['COMPUTED_INVOKE_RE', 'COMPUTED_FUNCTIONS_RE']) {
      const shape = CALL_SHAPES.find((candidate) => candidate.matcher === name);
      if (shape === undefined) throw new Error(`${name} has no committed call shape`);
      const computedLink = shape.links.find((link) => link.canonical === 'computed');
      if (computedLink?.name === undefined) throw new Error(`${name}'s call shape declares no computed link`);

      const matcher = regexDeclarationOf(name);
      const canonical = renderCell(shape, null, 'member', 'plain');
      // The instrument first: the rendered shape really is one this matcher reads, so a false below is a statement about the QUOTE rather than about a shape it was never going to match.
      expect(matcher.test(canonical), `${name} canonical`).toBe(true);

      for (const quote of ["'", '"', '`']) {
        const rendered = canonical.replace(`'${computedLink.name}'`, `${quote}${computedLink.name}${quote}`);
        expect(matcher.test(rendered), `${name} with a ${quote} key: ${rendered}`).toBe(true);
      }
    }
  });

  it('leaves a computed member whose key is not a string literal unread', () => {
    // The one limitation the computed-invocation closure does not reach, measured here and stated in the docblock, so neither half can outlive the other. A key computed at runtime names a function this guard cannot read at all, which is a decided limitation rather than an unstated hole.
    const runtimeKeys = [
      "locals.supabase.functions[method]('send-email', {});",
      "locals.supabase[member].invoke('send-email', {});"
    ];
    for (const name of ['COMPUTED_INVOKE_RE', 'COMPUTED_FUNCTIONS_RE']) {
      const matcher = regexDeclarationOf(name);
      for (const input of runtimeKeys) expect(matcher.test(input), `${name} on ${input}`).toBe(false);
    }
    expect(RESIDUAL_SECTION_PROSE).toContain('a computed member whose key is not a string literal is unreported');
  });

  for (const shape of CALL_SHAPES) {
    it(`disposes every generated cell of ${shape.matcher}`, () => {
      const matcher = regexDeclarationOf(shape.matcher);

      // The instrument first, and the population before it is used: an empty shape would generate no cells and report a pass over nothing.
      expect(matcher.source).not.toBe(new RegExp('').source);
      expect(shape.links.length).toBeGreaterThan(0);

      for (const link of shape.links) {
        for (const kind of (link.type === 'call' ? ['call'] : ['member', 'computed']) as Array<PunctuatorKind>) {
          const key = `${shape.matcher}.${link.id}.${kind}`;
          const disposition = link.dispositions[kind];

          if (disposition === undefined) {
            const samePosition = link.samePosition;
            if (samePosition === undefined || samePosition.kind !== kind) {
              throw new Error(`${key} is a generated cell with no written disposition`);
            }
            expect(samePosition.reason.length, `${key} reason`).toBeGreaterThan(0);
            // A kind declared not to be a distinct position still costs a measurement: the spelling has to be caught somewhere, or the declaration is a hole wearing a reason.
            expect(matcher.test(samePosition.provenBy), `${key} proven by ${samePosition.as}`).toBe(true);
            continue;
          }

          const plain = renderCell(shape, link.id, kind, 'plain');
          const optional = renderCell(shape, link.id, kind, 'optional');
          // TypeScript's third spelling of the same position. Rendered for every cell and asserted in every arm below, so the CR-01 class — a punctuator the language has that no matcher admits — is a named failure per cell rather than a discovery.
          const nonNull = renderCell(shape, link.id, kind, 'non-null');

          switch (disposition.verdict) {
            case 'matches':
              expect(matcher.test(plain), `${key} plain`).toBe(true);
              expect(matcher.test(optional), `${key} optional`).toBe(true);
              expect(matcher.test(nonNull), `${key} non-null`).toBe(true);
              break;
            case 'reported-by': {
              const other = regexDeclarationOf(disposition.matcher);
              expect(matcher.test(plain), `${key} plain`).toBe(false);
              expect(matcher.test(optional), `${key} optional`).toBe(false);
              expect(matcher.test(nonNull), `${key} non-null`).toBe(false);
              expect(other.test(plain), `${key} plain read by ${disposition.matcher}`).toBe(true);
              expect(other.test(optional), `${key} optional read by ${disposition.matcher}`).toBe(true);
              expect(other.test(nonNull), `${key} non-null read by ${disposition.matcher}`).toBe(true);

              // The CORPUS half of the disposition, which is what the generated variant cannot see: the input is rendered from one head, so it is only ever measured at one address, and a rule that runs somewhere else is certified by a measurement taken where it does not run.
              //
              // SUPERSET rather than equality, deliberately. A matcher that runs over BOTH corpora legitimately reports for one that runs over the adapter alone — the reader simply meets it at more addresses than it needs to. The reverse is the defect: the disposition is true at the address where the variant measures it and false at the address the matcher under test actually reaches, which is a positively-certified hole rather than an unnoticed one.
              const under = corpusListOf(CORPUS_OF, shape.matcher);
              const named = corpusListOf(CORPUS_OF, disposition.matcher);
              for (const corpus of under) {
                expect(
                  named,
                  `${key}: ${disposition.matcher} runs over ${named.join('+')}, which is narrower than ${shape.matcher}'s ${under.join('+')} — it cannot report at the '${corpus}' address`
                ).toContain(corpus);
              }
              break;
            }
            case 'outside-the-pattern':
              expect(disposition.reason.length, `${key} reason`).toBeGreaterThan(0);
              expect(matcher.test(plain), `${key} plain`).toBe(true);
              expect(matcher.test(optional), `${key} optional`).toBe(true);
              expect(matcher.test(nonNull), `${key} non-null`).toBe(true);
              // The proof that the link really is before everything the pattern reads: drop it entirely and the matcher still matches.
              expect(matcher.test(disposition.absent), `${key} with the link absent`).toBe(true);
              break;
            case 'admitted-by-exclusion':
              expect(disposition.reason.length, `${key} reason`).toBeGreaterThan(0);
              // EVERY spelling matches, because the pattern does not consume this position at all — it only looks past it.
              expect(matcher.test(plain), `${key} plain`).toBe(true);
              expect(matcher.test(optional), `${key} optional`).toBe(true);
              expect(matcher.test(nonNull), `${key} non-null`).toBe(true);
              // And the half that makes this a measurement rather than a shrug: the ONE spelling the lookahead exists to reject must actually be rejected. Stop excluding it and this goes red, which is the invariant that keeps a widened rule from quietly narrowing back.
              expect(
                matcher.test(disposition.excludedBy),
                `${key} must not match the spelling its lookahead excludes: ${disposition.excludedBy}`
              ).toBe(false);
              break;
            case 'residual':
              expect(RESIDUAL_PHRASES, `${key} phrase`).toContain(disposition.phrase);
              expect(matcher.test(plain), `${key} plain`).toBe(false);
              expect(matcher.test(optional), `${key} optional`).toBe(false);
              expect(matcher.test(nonNull), `${key} non-null`).toBe(false);
              expect(RESIDUAL_SECTION_PROSE, `${key} phrase in the docblock`).toContain(disposition.phrase);
              break;
          }
        }
      }
    });

    it(`bridges ${shape.matcher}'s admitted positions to its enumerated tokens`, () => {
      // The lookahead exclusion is a MEASUREMENT rather than a number. Cells are partitioned by `inLookahead`, which `optionalPunctuatorCellsOf` derives from the declaration's own lookahead spans, so a lookahead widened with a new position moves the in-lookahead count and has to be accounted for — it cannot leave the link-to-token comparison trivially satisfied. That is what CR-02 cost the old shape: `CLIENT_BINDING_RE`'s links WERE the hand-written list this matrix exists to eliminate, so its bridge was satisfied by 1 link against 1 token and said nothing at all about a binding one link along the chain.
      //
      // The in-lookahead half counts cells of EVERY form rather than the one form whose name says `lookahead`, because a widened lookahead reads the shape it rejects in the same tokens the pattern reads the shape it matches in. Neither half can absorb the other's positions.
      const cells = optionalPunctuatorCellsOf(shape.matcher);
      const consumed = cells.filter((cell) => !cell.inLookahead);
      const memberCells = consumed.filter((cell) => cell.form === 'member').length;
      const computedOrCallCells = consumed.filter((cell) => cell.form === 'computed-or-call').length;
      const lookaheadCells = cells.filter((cell) => cell.inLookahead).length;

      const memberAdmitted = shape.links.filter((link) => link.dispositions.member?.verdict === 'matches').length;
      const computedOrCallAdmitted = shape.links.filter(
        (link) => link.dispositions.computed?.verdict === 'matches' || link.dispositions.call?.verdict === 'matches'
      ).length;

      expect(memberAdmitted, `${shape.matcher} member links against member tokens`).toBe(memberCells);
      expect(computedOrCallAdmitted, `${shape.matcher} computed-or-call links against tokens`).toBe(
        computedOrCallCells
      );
      expect(lookaheadCells, `${shape.matcher} lookahead cells`).toBe(shape.lookaheadCells.count);
      if (shape.lookaheadCells.count > 0) expect(shape.lookaheadCells.reason.length).toBeGreaterThan(0);
    });

    it(`admits whitespace around ${shape.matcher}'s punctuators and nothing inside one`, () => {
      const matcher = regexDeclarationOf(shape.matcher);

      expect(matcher.test(renderTrivia(shape, 'spaced')), `${shape.matcher} spaced`).toBe(true);
      expect(matcher.test(renderTrivia(shape, 'newlined')), `${shape.matcher} newlined`).toBe(true);

      for (const link of shape.links) {
        // A link the pattern anchors nothing to the left of is skipped for the two negatives: the match simply begins further along, so trivia there says nothing about what the matcher reads.
        if (link.leftUnanchored !== undefined) continue;

        // A link the pattern does not CONSUME is INVERTED rather than skipped, and the inversion IS the proof the position sits outside what the pattern reads. Splitting the punctuator or interposing a comment makes the LOOKAHEAD unable to read the chain — so the shape stops being one the rule declines and the binding matches. Asserting `false` here would be asserting something untrue of the rule; skipping would be asserting nothing at all.
        const expected = link.dispositions.member?.verdict === 'admitted-by-exclusion';
        expect(matcher.test(renderTrivia(shape, 'split', link.id)), `${shape.matcher}.${link.id} split`).toBe(expected);
        expect(matcher.test(renderTrivia(shape, 'commented', link.id)), `${shape.matcher}.${link.id} commented`).toBe(
          expected
        );
      }
      expect(RESIDUAL_SECTION_PROSE).toContain('an interposed comment is not trivia the matchers admit');
    });
  }
});

/**
 * The guard's NON-VACUITY, asserted by breaking it on purpose.
 *
 * Every guarded adapter source reaches its tables through the scoped helper, so the real corpus yields zero forbidden sites and the guard's happy path prints a zero. That leaves "checked and clean" and "checked nothing" reporting the same number, and the difference between them is the whole value of the guard. The reproduction below is the second state: a copy of the guard whose access matcher matches nothing, run over the real tree. It examined zero call sites and exited 0 — a clean bill from an instrument that had stopped looking.
 *
 * The copy is written beside the original rather than into a temp directory, because the guard resolves both the shared comment classifier and the repository root RELATIVE TO ITS OWN LOCATION. A copy anywhere else would fail for reasons that have nothing to do with what is under test, which is the difference between a reproduction and a coincidence.
 */
describe('the project-scoped query guard fails closed when it examines nothing', () => {
  /**
   * The access matcher's declaration, and a replacement that is valid, global, and matches no source text.
   *
   * DERIVED from the guard rather than transcribed beside it. It was a hand-authored copy of the whole regex literal until CR-01 widened the operator, at which point it stopped matching the guard and this case went red — loudly, which is the good half, but it is the same defect class WR-05 names one scope over: a hand-authored constant that has to be edited in lockstep with the guard, and whose only back-pressure is a failure somebody has to interpret. The declaration is read out of the source now, so a widening of `ACCESS_RE` carries this reproduction with it.
   */
  // The reader spans the STATEMENT rather than the LINE, and that is a measured correction rather than a tidy-up. It read `/^const ACCESS_RE = .*$/m` — a single-line pattern requiring content after the `= ` — until Prettier wrapped this declaration's literal onto its own line, at which point the marker line ends at the `=`, the match returned nothing, and the derivation yielded the empty string. The instrument assertion below caught it, which is the good half; but this is the SAME line-versus-statement defect the `declared` scan above already fixed for exactly this reason, recorded there as "`CLIENT_BINDING_RE` and `BOUNDARY_ACCESS_RE` both wrap their literal onto the next line". One site was left on the old reading, and a FORMATTING change was therefore enough to redden a case about matcher vacuity. Spanning to the literal's own terminator makes the wrapped and unwrapped spellings read identically, which is what the guard's other slicers already guarantee by balance.
  const ACCESS_RE_DECL = /^const ACCESS_RE =\s*\/[\s\S]*?\/[gimsuy]*;/m.exec(GUARD_SOURCE)?.[0] ?? '';
  const ACCESS_RE_BROKEN = 'const ACCESS_RE = /this\\.matches\\.absolutely\\.nothing\\.at\\.all\\(/g;';

  /** The widened walker's tail, and a replacement that walks nothing while still returning a list. */
  const OUTSIDE_WALK_DECL = '  walk(FRONTEND_SRC_DIR);\n  return found.sort();';
  const OUTSIDE_WALK_BROKEN = '  return [];';

  it('exits non-zero when the access matcher has stopped matching', () => {
    // The instrument first: if the declaration were not found, the "mutated" copy would be the guard verbatim and this test would assert the ordinary green run instead of the broken one. `toContain` is no longer that instrument now the value is DERIVED from the same string — it would pass on the empty string — so the derivation is proven by what it holds: a global regex literal anchored on the client receiver.
    expect(ACCESS_RE_DECL, 'ACCESS_RE is not declared at the start of a line').not.toBe('');
    expect(ACCESS_RE_DECL).toContain('supabase');
    expect(ACCESS_RE_DECL.endsWith('/g;'), `ACCESS_RE must be a global literal: ${ACCESS_RE_DECL}`).toBe(true);
    const mutated = GUARD_SOURCE.replace(ACCESS_RE_DECL, ACCESS_RE_BROKEN);
    expect(mutated).not.toBe(GUARD_SOURCE);

    const tmpPath = resolve(REPO_ROOT, `scripts/.vacuity-probe-${process.pid}.mjs`);
    let result;
    try {
      writeFileSync(tmpPath, mutated);
      result = spawnSync(process.execPath, [tmpPath], { cwd: REPO_ROOT, encoding: 'utf8' });
    } finally {
      rmSync(tmpPath, { force: true });
    }

    // The measurement that makes the exit code meaningful: this run really did examine nothing.
    expect(result.stdout).toContain('0 raw client call(s) examined');
    expect(result.status).not.toBe(0);
  });

  it('exits non-zero when the walk outside the adapter directory finds nothing', () => {
    // The same reproduction one corpus over. The failure it models is not a matcher that stopped matching but a WALKER that stopped walking: the boundary corpus is five hundred files and reports zero violations when it is whole, so it reports the identical zero when it is empty. A walker that quietly stops descending is therefore invisible everywhere except here.
    //
    // The instrument first: if the tail were not found, the "mutated" copy would be the guard verbatim and this test would assert the ordinary green run instead of the broken one.
    expect(GUARD_SOURCE).toContain(OUTSIDE_WALK_DECL);
    const mutated = GUARD_SOURCE.replace(OUTSIDE_WALK_DECL, OUTSIDE_WALK_BROKEN);
    expect(mutated).not.toBe(GUARD_SOURCE);

    // Beside the original rather than in a temp directory, for the reason this describe block's docblock gives: the guard resolves both the shared comment classifier and the repository root relative to its own location.
    const tmpPath = resolve(REPO_ROOT, `scripts/.boundary-vacuity-probe-${process.pid}.mjs`);
    let result;
    try {
      writeFileSync(tmpPath, mutated);
      result = spawnSync(process.execPath, [tmpPath], { cwd: REPO_ROOT, encoding: 'utf8' });
    } finally {
      rmSync(tmpPath, { force: true });
    }

    // The measurement that makes the exit code meaningful: this run really did fail for the empty walk rather than for anything else it might have tripped over on the way.
    expect(result.stderr).toContain('yielded no sources outside');
    expect(result.status).not.toBe(0);
  });

  it('proves itself against its fixtures in the spelling that is actually wired, with no flag', () => {
    // The flagged spelling proving itself is worth nothing if the wired spelling is a different command: the flag is then one edit away from being dropped by somebody who never learns it mattered. So the ordinary invocation — the one `lint:check` runs — has to report the fixture outcome itself.
    const result = spawnSync(process.execPath, [resolve(REPO_ROOT, GUARD_PATH)], {
      cwd: REPO_ROOT,
      encoding: 'utf8'
    });
    expect(result.status).toBe(0);
    expect(result.stdout).toContain('self-test');
    expect(result.stdout).toMatch(/matching the committed expectation/);
  });
});

/**
 * The OWNER rule, which is CR-04's closure and the one matcher deliberately OFF `MATCHER_NAMES`.
 *
 * Why it is off that list, stated as the measured property it rests on rather than as a preference. `MATCHER_NAMES` drives two derivations, and both ask the same question: which optional PUNCTUATOR does this matcher admit at each of its member-access positions. `OWNER_BINDING_RE` has no member-access position at all — it matches a binding of the `this` keyword itself and stops — so every cell those derivations would generate for it is a cell about a position it does not contain. Registering it would mean authoring fake positions to satisfy an enumeration, which is the hand-maintained list the matrix exists to eliminate, wearing the matrix's own shape.
 *
 * The spec's back-pressure rule already ALLOWS this: a declared matcher off the list may admit no optional punctuator, and this one admits none. What that rule does not do is measure the matcher, and an unmeasured rule is how CR-01 through CR-04 each survived a pass. So the omission is not left as a silence — it is tied below to the two facts that justify it, and the rule is given the corpus derivation and the behavioural controls the listed matchers get from the matrix.
 */
describe('the owner rule closes CR-04 and is measured despite being off the matcher list', () => {
  it('is declared by the guard, so the assertions below are not reading an absent constant', () => {
    const declared = [...GUARD_SOURCE.matchAll(/^const ([A-Z][A-Z0-9_]*) =\s*\//gm)].map((match) => match[1]);

    expect(declared.length).toBeGreaterThan(0);
    expect(declared).toContain('OWNER_BINDING_RE');
  });

  it('admits no optional punctuator, which is the measured fact its absence from MATCHER_NAMES rests on', () => {
    // The SAME predicate the back-pressure loop applies to every unenumerated matcher, asserted here in its own right. If a future edit teaches this rule to read `?.`, this fails and the back-pressure loop fails beside it — so the day the justification stops holding is the day the build says so, rather than the day somebody re-reads the docblock.
    const text = matcherSpanOf('OWNER_BINDING_RE').text;

    expect(text.length).toBeGreaterThan(0);
    expect(text, 'the owner rule must admit no optional-chaining punctuator').not.toContain('\\?');
    // The deeper reason, and the one the punctuator fact is downstream of: no member-access operator is CONSUMED anywhere in the pattern. The `[.?![]` class is inside a negative lookahead, where those characters are what the rule DECLINES rather than what it reads, so it contributes no position. Measured by slicing the lookahead out and asserting the remainder carries no `\.`.
    const consumed = text.replace(/\(\?![^)]*\)/g, '');
    expect(consumed, 'the owner rule must consume no member access').not.toContain('\\.');
  });

  it('derives its corpus from the guard s own call graph, so it is not a rule wired to nothing', () => {
    // CR-01's lesson applied to the new rule on the day it lands rather than a pass later: a matcher read by a function no composer calls reports nothing forever, over a corpus nobody walks. The corpus is READ OUT of the call graph here exactly as `deriveCorpusMap` reads it for the listed matchers — never authored beside the claim that depends on it.
    const readers = [...READER_FUNCTIONS].filter(([reader]) =>
      readsConstant(functionBodyOf(reader), 'OWNER_BINDING_RE')
    );

    expect(readers.length, 'OWNER_BINDING_RE is read by no reader function').toBeGreaterThan(0);
    const corpora = new Set(readers.flatMap(([, set]) => [...set]));
    expect([...corpora].sort()).toEqual(['adapter']);
  });

  it('reports both shapes CR-04 named, and neither of its two near misses', () => {
    const owner = regexDeclarationOf('OWNER_BINDING_RE');

    // The two shapes the fourth re-verification injected and could not make the guard move on.
    expect(owner.test('const self = this;'), 'the owner alias must be reported').toBe(true);
    expect(owner.test('const { supabase } = this;'), 'the owner destructure must be reported').toBe(true);
    // The chain-continuing spellings, each of which belongs to a sibling rule rather than to this one. Reported here would mean double-counting a site check 1 or check 6 already owns.
    for (const shape of ['= this.supabase', '= this?.supabase', '= this!.supabase', "= this['supabase']"]) {
      expect(owner.test(shape), `${shape} belongs to a sibling rule, not to the owner rule`).toBe(false);
    }
    // The comparison operators, which share the keyword and none of the meaning.
    for (const shape of ['other === this', 'other !== this', 'a <= this', 'a >= this']) {
      expect(owner.test(shape), `${shape} is a comparison, not a binding`).toBe(false);
    }
  });
});
