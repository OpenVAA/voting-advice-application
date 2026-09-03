-- Fixture INPUT for `node scripts/assert-comment-hygiene.mjs --self-test`.
-- POSITIVE (rule 1): a literal escape \u2013 inside a SQL line comment.
--
-- POSITIVE (rule 2): this line ends without terminal punctuation and
-- the line under it continues the same comment span at the same indent.
--
-- =====================
-- NEGATIVE (rule 2, banner-rule): the rule line above is structure and is never joined.
--
-- NEGATIVE (rule 2, list-item): the two cases are
-- - the first one
-- - the second one.
--
-- NEGATIVE (rule 2, jsdoc-tag): a tag line is structure even in a SQL file
-- @param one the first operand
--
-- NEGATIVE (rule 2, hanging-indent): the reference table below is code, not prose
--     election_a   dddddddd-0001
--
-- NEGATIVE (rule 2, comment-table): the rows below are a table
-- | column | type |
-- | id | uuid |

/* POSITIVE (rule 1): a literal escape \u00e9 inside a block comment, which SQL also accepts. */

/* NEGATIVE: a single-line block comment with no escape. */

-- NEGATIVE below: both escapes are inside single-quoted string literals, so they are values, not prose, and the double-hyphen inside the second one opens no comment span.
select
  'an escape \u2014 inside a string literal must never be flagged' as label,
  'https://example.org/\u2013not-a-comment' as url,
  1 as ok; -- POSITIVE (rule 1): a trailing SQL comment is a span too, carrying \u2013.
