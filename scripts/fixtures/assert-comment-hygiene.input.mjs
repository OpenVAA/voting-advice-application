#!/usr/bin/env node

/**
 * Fixture INPUT for `node scripts/assert-comment-hygiene.mjs --self-test`.
 *
 * Line 1 is a shebang, NOT a comment span, even though this file's family is the C one; the classifier would otherwise see nothing special about it.
 *
 * POSITIVE (rule 1): a literal escape \u2013 inside a block comment in an .mjs file.
 *
 * POSITIVE (rule 2): this line ends without terminal punctuation and
 * the line under it continues the same comment span at the same indent.
 *
 * ---------------------
 * NEGATIVE (rule 2, banner-rule): the rule line above never absorbs the paragraph beneath it.
 *
 * NEGATIVE (rule 2, jsdoc-tag): a tag list is structure and is never joined
 * @param a the first operand
 * @returns nothing at all
 */

// POSITIVE (rule 1): a literal escape \u00e9 inside a line comment.
// NEGATIVE (rule 2): the line above ends with terminal punctuation, so this one starts a new sentence rather than continuing a broken one.

// NEGATIVE (rule 2, list-item): the exclusions are
// - banner rules
// - list items
// - JSDoc tags.

// NEGATIVE (rule 2, hanging-indent): the recipe below is code, not prose
//     yarn lint:check
//     node scripts/assert-comment-hygiene.mjs

// NEGATIVE (rule 2, comment-table): the rows below are a table
// | rule | scope |
// | 1 | escapes |

// NEGATIVE below: these are the exact shape of the five live non-comment occurrences in packages/shared-config/eslint.config.mjs:164,171-174; they are import-sort regex strings, they are code, and rewriting them would break lint across every workspace.
export const IMPORT_GROUPS = ['^\\u0000', '^node:.*\\u0000$', '^@?\\w.*\\u0000$'];

// NEGATIVE below: the // inside a URL is inside a string.
export const URL = 'https://example.org/\u2013not-a-comment';

// NEGATIVE below: a template literal spanning two lines.
export const TEMPLATE = `
  a template literal body carrying \u2013 and
  // a slash-slash sequence that is NOT a comment
`;

export const VALUES = [IMPORT_GROUPS, URL, TEMPLATE]; // POSITIVE (rule 1): trailing, with \u2014.
