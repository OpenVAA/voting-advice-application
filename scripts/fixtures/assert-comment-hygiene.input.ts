/**
 * Fixture INPUT for `node scripts/assert-comment-hygiene.mjs --self-test`.
 *
 * NOT compiled, NOT imported, NOT linted, NOT formatted (see .prettierignore). It exists so that the comment-span classifier and BOTH of the guard's rules have a committed proof rather than a claim; its sibling `assert-comment-hygiene.expected.ts.violations` is the exact `file:line` list the guard must report, and `--self-test` diffs the two.
 *
 * POSITIVE (rule 1): this line carries a literal escape \u2013 inside a block comment.
 *
 * POSITIVE (rule 2): this line ends without terminal punctuation and
 * the line under it continues the same comment span at the same indent.
 *
 * NEGATIVE (rule 2, paragraph-break): the blank comment line above terminates the paragraph, so nothing joins across it.
 *
 * =====================
 * NEGATIVE (rule 2, banner-rule): the rule line above is structure, and a rule line is never joined from either side.
 *
 * NEGATIVE (rule 2, list-item): the three cases are
 * - the first one
 * - the second one
 * - the third one.
 *
 * NEGATIVE (rule 2, jsdoc-tag): a tag list is structure and is never joined
 * @param a the first operand
 * @returns nothing at all
 *
 * NEGATIVE (rule 2, hanging-indent): the sample below is code, not prose
 *     col     value
 *
 * NEGATIVE (rule 2, comment-table): the rows below are a table
 * | a | b |
 * | c | d |
 */

// POSITIVE (rule 1): a literal escape \u00e9 inside a line comment.
export const LINE_COMMENT_HIT = 1;

// NEGATIVE: a one-line comment span with no escape in it at all.
export const CLEAN = 2;

/* NEGATIVE: a single-line block comment with no escape. */
export const ALSO_CLEAN = 3;

// NEGATIVE below: the escape is inside a single-quoted string, so it is code, not prose.
export const SINGLE_QUOTED = 'an escape \u2014 inside a string literal must never be flagged';

// NEGATIVE below: the // inside a URL is inside a string, so it opens no comment span, and the escape after it is therefore code too.
export const URL = 'https://example.org/\u2013not-a-comment';

// NEGATIVE below: a template literal spanning two lines; everything between the backticks is string content, including a slash-slash sequence and an escape.
export const TEMPLATE = `
  a template literal body carrying \u2013 and
  // a slash-slash sequence that is NOT a comment
`;

// NEGATIVE (rule 2): a trailing comment on a code line is its own span and never joins
export const TRAILING_A = 5; // with the comment beneath it
// even when the three of them read as one paragraph.

export const VALUES = [LINE_COMMENT_HIT, CLEAN, ALSO_CLEAN, SINGLE_QUOTED, URL, TEMPLATE, TRAILING_A];

export const TRAILING = 4; // POSITIVE (rule 1): a trailing comment is a span too, carrying \u2013.
