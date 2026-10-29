<!--@component
Fixture INPUT for `node scripts/assert-comment-hygiene.mjs --self-test`.

POSITIVE (rule 1): a literal escape \u2013 inside an HTML component docstring, the exact shape of the one real violation this guard was written for (EntityCardAction.svelte:12).

POSITIVE (rule 2): this line ends without terminal punctuation and
the line under it continues the same comment span at the same indent.

=====================
NEGATIVE (rule 2, banner-rule): the rule line above is structure and is never joined.

NEGATIVE (rule 2, list-item): the slots are
- default, the contents to wrap
- footer, the contents to append.

NEGATIVE (rule 2, jsdoc-tag): a tag list is structure and is never joined
@param a the first operand

NEGATIVE (rule 2, hanging-indent): the sample below is code, not prose
    yarn lint:check

NEGATIVE (rule 2, comment-table): the rows below are a table
| slot | purpose |
| default | wrapping |
-->

<script lang="ts">
  // POSITIVE (rule 1): a literal escape \u00e9 inside a line comment in the script block.
  // NEGATIVE (rule 2): the line above ends with terminal punctuation, so this one is not a forced break.

  /* NEGATIVE: a single-line block comment with no escape. */

  // NEGATIVE below: the escape is inside a single-quoted string.
  const label = 'an escape \u2014 inside a string literal must never be flagged';

  // NEGATIVE below: the // is inside a string, so no comment span opens on this line.
  const href = 'https://example.org/\u2013not-a-comment';

  // NEGATIVE below: a template literal spanning two lines.
  const block = `
    a template literal body carrying \u2013 and
    // a slash-slash sequence that is NOT a comment
  `;

  // NEGATIVE (rule 2, tool-directive): a directive must stay first in its comment
  // svelte-ignore state_referenced_locally
  const flagged = label;
</script>

<!-- POSITIVE (rule 1): a one-line HTML comment carrying \u2013 in markup. -->
<a {href}>{label}{block}{flagged}</a>
