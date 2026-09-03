/**
 * Template placeholder substitution tests (REVIEW-EDGE-03).
 *
 * The criterion is one sentence wide -- a placeholder written `{{ varname }}` with surrounding spaces must render -- but the risk in satisfying it is wider than the criterion: the pattern also has to keep resolving every placeholder the product already uses, and those are produced by SQL rather than written by hand.
 *
 * SO THE FIXTURE IS ENUMERATED FROM THE TREE, NOT FROM THE EXAMPLES. `REAL_VARS` below is the complete set of keys `public.resolve_email_variables` can emit, read off `apps/supabase/supabase/schema/502-email-helpers.sql` rather than paraphrased: two candidate keys, one organization key and two nomination keys. Two of the five are THREE segments deep (`nomination.constituency.name`, `nomination.election.name`), which no example in the plan or the research covers -- a pattern written against two-segment examples alone would reject a live production key and no gate in this phase would catch it.
 *
 * No mocks and no network: `renderTemplate` is a pure string function.
 */

import { describe, it, expect } from 'vitest';
import { renderTemplate } from './templateVars';

/**
 * Every key `resolve_email_variables` can put in the `variables` JSONB, verbatim from the SQL that builds it.
 *
 * Source lines, so a future reader can re-derive rather than trust: `502-email-helpers.sql` builds `'candidate.first_name'` and `'candidate.last_name'` together, `'organization.name'` at two separate sites (the candidate's organisation and the party role's own), `'nomination.constituency.name'` and `'nomination.election.name'` from the nomination join.
 */
const REAL_VARS: Record<string, string> = {
  'candidate.first_name': 'Ada',
  'candidate.last_name': 'Lovelace',
  'organization.name': 'Analytical Engine Party',
  'nomination.constituency.name': 'Helsinki',
  'nomination.election.name': 'Parliamentary Election 2027'
};

/** The plan's own worked example, kept alongside the real keys so both the undotted and the dotted shape are exercised by every whitespace case. */
const VARS: Record<string, string> = { name: 'Ada', 'candidate.first_name': 'Ada' };

describe('renderTemplate (REVIEW-EDGE-03)', () => {
  it('substitutes a placeholder written with no inner spaces', () => {
    // Today's behaviour, pinned first: whatever the whitespace tolerance adds, the existing shape must keep working.
    expect(renderTemplate('Hei {{name}}!', VARS)).toBe('Hei Ada!');
  });

  it('substitutes a placeholder written with one space on each side, identically to the no-space form', () => {
    // The criterion itself. Asserting equality with the no-space rendering rather than against a literal is what makes this a statement about the TWO forms agreeing, which is what the reviewer asked for.
    expect(renderTemplate('Hei {{ name }}!', VARS)).toBe(renderTemplate('Hei {{name}}!', VARS));
    expect(renderTemplate('Hei {{ name }}!', VARS)).toBe('Hei Ada!');
  });

  it('substitutes a placeholder padded with two spaces on each side', () => {
    // `\s*` is a quantifier, not a single optional space; this is the assertion that says so.
    expect(renderTemplate('Hei {{  name  }}!', VARS)).toBe('Hei Ada!');
  });

  it('substitutes a placeholder padded with tab characters', () => {
    // A template pasted out of an editor carries tabs as readily as spaces, and `\s` covers both -- stated as a test because "whitespace" in a criterion is otherwise read as "space".
    expect(renderTemplate('Hei {{\tname\t}}!', VARS)).toBe('Hei Ada!');
  });

  it('resolves a dotted key through the flat lookup, with and without surrounding spaces', () => {
    // The D-D4 contract as behaviour: `candidate.first_name` is ONE key whose text contains a dot, so the value comes from `vars['candidate.first_name']` and never from a walk into `vars.candidate`.
    expect(renderTemplate('Hei {{candidate.first_name}}!', VARS)).toBe('Hei Ada!');
    expect(renderTemplate('Hei {{ candidate.first_name }}!', VARS)).toBe('Hei Ada!');
  });

  it('resolves every key resolve_email_variables can actually emit, including the three-segment ones', () => {
    // The regression this file exists to prevent: a pattern written against the two-segment examples would silently stop rendering the nomination keys, which are the only three-segment keys in the product. Both whitespace forms are checked for each real key, because the change under test is exactly the whitespace tolerance.
    for (const key of Object.keys(REAL_VARS)) {
      expect(renderTemplate(`x {{${key}}} y`, REAL_VARS), `tight form of ${key}`).toBe(`x ${REAL_VARS[key]} y`);
      expect(renderTemplate(`x {{ ${key} }} y`, REAL_VARS), `spaced form of ${key}`).toBe(`x ${REAL_VARS[key]} y`);
    }
  });

  it('proves the flat lookup is flat, by resolving a dotted key from a map with no nested object at all', () => {
    // The negative control for D-D4. `REAL_VARS` has no `nomination` property, so if the dotted group were resolved as a path this would render the pass-through instead of the value. It cannot pass under a traversal implementation.
    expect('nomination' in REAL_VARS, 'the map must be flat for this control to mean anything').toBe(false);
    expect(renderTemplate('{{nomination.election.name}}', REAL_VARS)).toBe('Parliamentary Election 2027');
  });

  it('leaves an unknown key in the output exactly as written, braces and all', () => {
    // Today's pass-through behaviour, preserved deliberately: `resolve_email_variables` returns an EMPTY variables object for a user with neither a candidate nor a party role, so this is a live path and not a curiosity.
    expect(renderTemplate('Hei {{unknown_key}}!', VARS)).toBe('Hei {{unknown_key}}!');
    expect(renderTemplate('Hei {{ unknown_key }}!', VARS)).toBe('Hei {{ unknown_key }}!');
    expect(renderTemplate('Hei {{candidate.first_name}}!', {})).toBe('Hei {{candidate.first_name}}!');
  });

  it('does not match an empty placeholder, with or without inner spaces', () => {
    // `\w+` requires at least one character, so `{{}}` is not a placeholder at all and must survive untouched rather than becoming the empty string. Stated as a test because the whitespace tolerance is exactly the change that could have made `{{ }}` match.
    expect(renderTemplate('a {{}} b', VARS)).toBe('a {{}} b');
    expect(renderTemplate('a {{ }} b', VARS)).toBe('a {{ }} b');
    expect(renderTemplate('a {{\t}} b', VARS)).toBe('a {{\t}} b');
  });

  it('substitutes every placeholder in a string in one pass', () => {
    // Mixed spacing in one template on purpose: a real subject line is edited by more than one person.
    expect(
      renderTemplate('{{ candidate.first_name }} {{candidate.last_name}}, {{ organization.name }}', REAL_VARS)
    ).toBe('Ada Lovelace, Analytical Engine Party');
  });

  it('does not recurse into a substituted value that itself looks like a placeholder', () => {
    // `String.prototype.replace` does not re-scan what it inserted, and that is a security property rather than an implementation detail: values arrive from the database, so a name containing `{{ ... }}` must be inert text and not a second lookup.
    expect(renderTemplate('{{name}}', { name: '{{name}}', evil: 'resolved' })).toBe('{{name}}');
    expect(renderTemplate('{{name}}', { name: '{{evil}}', evil: 'resolved' })).toBe('{{evil}}');
  });

  it('substitutes a key that is present with an empty value, rather than passing it through', () => {
    // CHARACTERISATION, NOT A RULING. The plan's flagged assumption records that no source artefact decided the present-but-empty case. This asserts what the code has ALWAYS done -- `??` falls back only on null and undefined, so an empty string is a value and is substituted -- so that the behaviour is documented and any future change to it is deliberate. It does not settle whether that behaviour is the desired one.
    expect(renderTemplate('Hei {{name}}!', { name: '' })).toBe('Hei !');
    expect(renderTemplate('Hei {{ name }}!', { name: '' })).toBe('Hei !');
  });
});
