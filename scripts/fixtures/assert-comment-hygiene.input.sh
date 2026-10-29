#!/usr/bin/env bash
# Fixture INPUT for `node scripts/assert-comment-hygiene.mjs --self-test`.
#
# Line 1 above is a shebang, NOT a comment span: it is an interpreter directive that happens to start with a hash, and the classifier's one NET-NEW rule says so.
#
# POSITIVE (rule 1): a literal escape \u2013 inside a shell comment.
#
# POSITIVE (rule 2): this line ends without terminal punctuation and
# the line under it continues the same comment span at the same indent.
#
# =====================
# NEGATIVE (rule 2, banner-rule): the rule line above is structure and is never joined.
#
# NEGATIVE (rule 2, list-item): the two cases are
# - the first one
# - the second one.
#
# NEGATIVE (rule 2, jsdoc-tag): a tag line is structure even in a shell script
# @param one the first operand
#
# NEGATIVE (rule 2, hanging-indent): the recipe below is code, not prose
#     yarn db:reset
#     yarn dev
#
# NEGATIVE (rule 2, comment-table): the rows below are a table
# | flag | meaning |
# | -h | help |

set -euo pipefail

# NEGATIVE below: both escapes are inside single-quoted strings, and the hash inside the second one opens no comment span.
url='https://example.org/\u2013not-a-comment'
label='an escape \u2014 inside a string#literal must never be flagged'

printf '%s %s\n' "$url" "$label" # POSITIVE (rule 1): a trailing comment carrying \u00e9.
