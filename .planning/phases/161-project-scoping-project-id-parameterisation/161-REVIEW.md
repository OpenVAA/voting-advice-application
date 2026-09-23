---
phase: 161-project-scoping-project-id-parameterisation
reviewed: 2026-09-07T10:35:00Z
depth: standard
files_reviewed: 8
files_reviewed_list:
  - scripts/assert-project-scoped-queries.mjs
  - packages/dev-seed/tests/projectScopingGate.test.ts
  - scripts/fixtures/project-scoped-queries/violation.fixture.ts
  - scripts/fixtures/project-scoped-queries/clean.fixture.ts
  - scripts/fixtures/project-scoped-queries/outside-boundary.violation.fixture.ts
  - scripts/fixtures/project-scoped-queries/outside-boundary.clean.fixture.ts
  - .planning/todos/pending/2026-09-07-run-escape-hatch-and-schema-hop-checks-outside-the-adapter-directory.md
  - .planning/todos/pending/2026-09-07-widen-the-client-binding-rule-to-the-whole-initialiser.md
findings:
  critical: 3
  warning: 6
  info: 3
  total: 12
status: issues_found
---

# Phase 161: Code Review Report

**Reviewed:** 2026-09-07T10:35:00Z
**Depth:** standard
**Files Reviewed:** 8
**Status:** issues_found

## Summary

The three landed plans (161-17, 161-18, 161-19) do close what they claim. I reproduced the
committed state before touching anything, and every number in `<project_context>` holds:

```
$ node scripts/assert-project-scoped-queries.mjs --self-test
Project-scoped query guard — self-test flagged 32 line(s) in …/violation.fixture.ts (32 access(es))
and 0 in …/clean.fixture.ts (8 access(es)), plus 11 line(s) in …/outside-boundary.violation.fixture.ts
(11 site(s)) and 0 in …/outside-boundary.clean.fixture.ts (2 site(s)), matching the committed expectation.
EXIT=0

$ node scripts/assert-project-scoped-queries.mjs
… 5 guarded source(s), 0 deferred, 5 adapter source(s) on disk, 5 raw client call(s) examined,
2 Edge Function invocation(s), 7 client-touching site(s) in all, 550 source(s) outside the adapter
directory walked, 1 outside site(s) examined, 0 violation(s); …
EXIT=0

$ yarn workspace @openvaa/dev-seed vitest run tests/projectScopingGate.test.ts
✓ tests/projectScopingGate.test.ts (112 tests) 1379ms   —   Tests  112 passed (112)
```

I could not defeat the punctuator family (`.` / `?.` / `?.(`), the computed-key family, the
corpus axis for invocations, or the receiver-depth axis. Those are genuinely closed.

**The defect class recurred anyway, three times, one axis over from each closed axis.** All three
were reproduced by this project's own standard — append the shape to a scratch copy of the committed
fixture, run the self-test unpiped, observe the counts refuse to move, revert. Exact commands and
observed output are recorded per finding. The tree is clean; `git status --porcelain` at the end of
this review shows only the pre-existing `.planning/config.json`, `.planning/state.json` and
`.planning/milestone.lock` entries.

1. **The punctuator set is not the set the language has.** The whole enumeration — `PUNCTUATOR_TOKENS`,
   `PunctuatorKind`, and the "closed vocabulary" assertion — is scoped to punctuators spelled with a
   question mark. This is a **TypeScript** codebase, and TypeScript's non-null assertion `!.` is a
   member-access punctuator the enumeration structurally cannot see. It is not hypothetical: 54 live
   uses in `apps/frontend/src` today.
2. **A whole directory inside the guard's own strictest address is in NEITHER corpus.** Files under
   `apps/frontend/src/lib/api/adapters/supabase/utils/` are skipped by `enumerateAdapterSources` and
   excluded from `enumerateFrontendSourcesOutsideAdapter` by the `ADAPTER_DIR` prefix test. Check 5,
   whose stated job is "a source in neither list silently reduces coverage", cannot see them, because
   the exclusion happens inside the enumeration check 5 reads.
3. **A client held in a parameter, not bound by `=`, is uncounted — and that shape is live** at
   `apps/frontend/src/lib/api/adapters/supabase/supabaseAdapter.ts:49-51`, which is the ONE raw
   `.from(<table>)` in the guarded corpus and is not among the "5 raw client call(s) examined".

On the two items `<what_you_are_reviewing>` asked me to judge independently:

- **The `boundClientMemberRead` corpus move is not laundering, but its justification is overstated.**
  `destructuredCallResult` is still in `clean.fixture.ts`, still contributes zero counted sites, and
  is still asserted unreported (`cleanMessages.length === 0`, `cleanCount === 8`). The near-miss
  control holds. But the impossibility claim that authorises the move — "no source-level rule can
  tell a bound client SUB-OBJECT from a bound SCALAR member" — is false of a rule written in the
  guard's own house style (WR-03).
- **Several of the new assertions can fail; two of the twenty `NEGATIVE_CONTROLS` entries cannot.**
  I deleted the whole `destructuredCallResult` method from `clean.fixture.ts` and the whole
  `bucketUpload` function from `outside-boundary.clean.fixture.ts`, on their own, and both the guard
  (exit 0, unchanged expectation) and the full 112-test gate spec stayed green — because the shape
  name survives in a sibling docblock and the assertion is `toContain` over the file text (WR-01).
  That is WR-04's own defect class recurring on the closure written to end it, and it lands on the
  shape the spec itself calls "the one shape CR-02's closure turns on".

The two `.planning/todos/pending/` amendments are accurate. Neither over-claims; both correctly
narrow their remaining scope and neither now says it covers something it does not (verified against
the live declarations — see IN-03).

## Critical Issues

### CR-01: TypeScript's non-null assertion `!` evades every matcher, uncounted, at every operator position

**File:** `scripts/assert-project-scoped-queries.mjs:432` (`ACCESS_RE`), `:517-518`
(`CLIENT_BINDING_RE`), `:521` (`COMPUTED_ACCESS_RE`), `:561` (`SCHEMA_HOP_RE`), `:588` (`INVOKE_RE`),
`:665-666` (`BOUNDARY_ACCESS_RE`); `packages/dev-seed/tests/projectScopingGate.test.ts:391-395`
(`PUNCTUATOR_TOKENS`), `:616` (`PunctuatorKind`), `:1624-1629` (the vocabulary-closure assertion)

**Issue:** Every matcher spells its member operator `\s*\??\.\s*`. TypeScript's non-null assertion
sits between the receiver and the dot — `this.supabase!.from('elections')` — and no matcher admits
it. So does a parenthesised receiver, `(this.supabase).from('elections')`. Both are UNCOUNTED, not
merely unreported: `collectAccesses` never yields a site, so check 3's "a site the guard cannot parse
is a site it cannot cover" never fires, `tally.accesses` does not move, and the per-family
non-vacuity floor cannot see the family go silent.

The guard's `SCHEMA_HOP_RE` docblock argues the access punctuator is safe to widen because it "is a
closed set fixed by the language", and honestly records that the set was believed to be two and
turned out to be three. The set it enumerates is JavaScript's optional-chaining set. The language
this repository is written in is TypeScript, whose member-access punctuator set additionally contains
`!.`. `grep -rEn '[A-Za-z_$)\]]!\.' apps/frontend/src` returns **54 live occurrences** — this is an
established house spelling, not a curiosity.

The gate spec cannot catch it by construction. `PUNCTUATOR_TOKENS` enumerates three token forms all
spelled with `\?`, and the closure assertion at `:1624-1629` strips those three and asserts
`expect(remainder).not.toContain('\\?')`. A fourth form admitting `!` would be written
`(?:!\s*)?\.` — which contains no `\?` at all — so the assertion whose docblock promises "a fourth
form is then a decision somebody has to make rather than a spelling that can arrive unnoticed" would
stay green through exactly that arrival.

**Reproduction (run, observed, reverted):**

```
$ cp scripts/fixtures/project-scoped-queries/violation.fixture.ts <scratch>/violation.fixture.ts.bak
# appended to the class in scripts/fixtures/project-scoped-queries/violation.fixture.ts:
#   nonNullAssertedTableRead()      -> this.supabase!.from('organizations').select('*')
#   nonNullAssertedInvocation()     -> this.supabase.functions!.invoke('probe_nonnull_undispositioned', { body: {} })
#   parenthesisedReceiverTableRead()-> (this.supabase).from('organizations').select('*')
#   nonNullAssertedSchemaHop()      -> this.supabase!.schema('public').from('elections').select('*')
#   nonNullAssertedAliasedClient()  -> const db = (this.supabase); return db.from('elections').select('*')
$ node scripts/assert-project-scoped-queries.mjs --self-test
Project-scoped query guard — self-test flagged 32 line(s) … (32 access(es)) and 0 … (8 access(es)),
plus 11 line(s) … (11 site(s)) and 0 … (2 site(s)), matching the committed expectation.
EXIT=0
```

Five forbidden shapes, including an undispositioned Edge Function invocation and a schema hop, inside
the guard's strictest corpus: **every committed count byte-identical, exit 0.** The same three shapes
at the boundary address (`locals.supabase!.from('elections')`,
`locals.supabase.functions!.invoke('probe_nonnull_undispositioned', …)`,
`(locals.supabase).from('elections')`) appended to `outside-boundary.violation.fixture.ts` likewise
left `11 site(s)` unmoved at exit 0. Both fixtures were restored; `git status --porcelain` is clean of
`scripts/`.

Note the asymmetry that makes this worse inside the adapter than outside it: the ESLint
adapter-boundary guard (`apps/frontend/eslint.config.mjs:297-301`) fires on any `.supabase` member
access outside `ADAPTER_BOUNDARY_ALLOWLIST`, so the boundary corpus has defence in depth. The adapter
directory is allowlisted there, so inside the guard's strictest corpus this evasion is unmitigated.

**Fix:** Admit the TypeScript non-null assertion at every operator position, and widen the enumeration
so the next non-`?` punctuator is a named failure rather than a ninth review's finding.

```js
// scripts/assert-project-scoped-queries.mjs — one shared spelling for a member operator.
// `!` may appear before the punctuator; `?.` and `!.` do not co-occur, so one optional
// group per side is sufficient and is decidable by inspection.
const ACCESS_RE =
  /this\s*!?\s*\??\.\s*#?supabase((?:\s*!?\s*\??\.\s*[A-Za-z_$][\w$]*)*?)\s*!?\s*\??\.\s*(from|rpc)\s*(?:\?\.\s*)?\(/g;
```

Apply the same `!?\s*` admission at every member position of `SCHEMA_HOP_RE`, `BOUNDARY_ACCESS_RE`,
`COMPUTED_ACCESS_RE`, `INVOKE_RE`, `COMPUTED_INVOKE_RE`, `COMPUTED_FUNCTIONS_RE`, and inside
`CLIENT_BINDING_RE`'s lookahead chain. Then, in the gate spec:

```ts
// packages/dev-seed/tests/projectScopingGate.test.ts
const PUNCTUATOR_TOKENS = [
  { form: 'member', token: '\\??\\.', plain: '\\.' },
  { form: 'non-null-member', token: '!?\\s*', plain: '' },   // NEW
  { form: 'computed-or-call', token: '(?:\\?\\.\\s*)?', plain: '' },
  { form: 'lookahead-branch', token: '\\?\\.|', plain: '' }
] as const;
```

and replace the closure assertion's `\\?`-only residual test with one that admits no *unaccounted
optional construct* of any spelling — e.g. after stripping every enumerated token, assert the
remainder contains neither `\\?` nor `?` outside a group opener nor `!`. Add one violating fixture
shape per newly-admitted position (the mutation harness will then require each to be load-bearing),
and add `(this.supabase).from(…)` as a violating shape or a stated residual — a parenthesised
receiver is not a punctuator and needs its own decision.

The `SCHEMA_HOP_RE` docblock's "WIDENING THE OPERATOR IS NOT THE RECEIVER WIDENING ARGUED AGAINST"
paragraph must be corrected in the same edit: the closed set it names is JavaScript's, and this guard
reads TypeScript.

---

### CR-02: `adapters/supabase/utils/**` is in NEITHER corpus, and check 5 is structurally blind to it

**File:** `scripts/assert-project-scoped-queries.mjs:1360` (`if (entry !== 'utils') walk(relPath);`),
`:1391` (`if (relPath !== ADAPTER_DIR && !relPath.startsWith(\`${ADAPTER_DIR}/\`)) walk(relPath);`),
`:1451-1459` (check 5); mirrored in `packages/dev-seed/tests/projectScopingGate.test.ts:1105`

**Issue:** `enumerateAdapterSources` skips the `utils` directory. `enumerateFrontendSourcesOutsideAdapter`
skips everything whose path starts with `${ADAPTER_DIR}/` — which includes `utils`. So
`apps/frontend/src/lib/api/adapters/supabase/utils/**` is walked by neither corpus, and check 5's
"a source in neither `GUARDED_SOURCES` nor `DEFERRED_SOURCES` is a source nobody decided about"
cannot fire, because check 5 iterates `enumerateAdapterSources()` — the very list the exclusion is
applied to. The same applies to any non-`.ts` file under the adapter directory (a `.svelte` file
there is skipped by the adapter walk's extension test and by the outside walk's prefix test).

This is the corpus axis one level over from the one 161-17 closed. The module docblock's claim that
"Check 9 runs over the rest of the frontend source tree and asserts exactly that: all project-scoped
table and rpc access lives under the adapter directory" is false at this address, and the gate spec's
`adapterSourcesOnDisk()` reproduces the identical exclusion, so the "two derivations of one set"
argument does not cover it — both derivations share the blind spot.

**Reproduction (run, observed, reverted):**

```
$ cat > apps/frontend/src/lib/api/adapters/supabase/utils/zzProbe.ts <<'EOF'
import type { SupabaseClient } from '@supabase/supabase-js';
export function probe(client: SupabaseClient) { return client.from('elections').select('*'); }
export function probeThis(this: { supabase: SupabaseClient }) { return this.supabase.from('elections').select('*'); }
export function probeInvoke(client: SupabaseClient) { return client.functions.invoke('probe_utils_undispositioned', { body: {} }); }
EOF
$ node scripts/assert-project-scoped-queries.mjs
Project-scoped query guard — 5 guarded source(s), 0 deferred, 5 adapter source(s) on disk,
5 raw client call(s) examined, 2 Edge Function invocation(s), 7 client-touching site(s) in all,
550 source(s) outside the adapter directory walked, 1 outside site(s) examined, 0 violation(s); …
EXIT=0
$ rm apps/frontend/src/lib/api/adapters/supabase/utils/zzProbe.ts
```

Three forbidden shapes — including the canonical `this.supabase.from('elections')` that check 1
exists for, and an undispositioned Edge Function invocation — produced **zero violations, zero added
counts, and every summary number byte-identical** to the clean run (5 / 2 / 7 / 550 / 1 / 0). The
file was not even reported as an undeclared adapter source. Removed; tree clean.

**Fix:** Stop dropping `utils/` on the floor. Either walk it as part of the adapter corpus (it is
inside `ADAPTER_DIR`, so it is exactly where a client handed to a helper lands), or route it into the
outside corpus explicitly. The first is correct:

```js
// scripts/assert-project-scoped-queries.mjs — enumerateAdapterSources
const walk = (relDir) => {
  for (const entry of readdirSync(path.resolve(REPO_ROOT, relDir)).sort()) {
    const relPath = `${relDir}/${entry}`;
    if (statSync(path.resolve(REPO_ROOT, relPath)).isDirectory()) {
      walk(relPath);              // `utils` no longer skipped
      continue;
    }
    …
  }
};
```

and add the resulting `utils/*.ts` files to `GUARDED_SOURCES` (they are pure helpers today, so the
counts are unmoved — verify with an unpiped run). Mirror the change in the gate spec's
`adapterSourcesOnDisk()` so the two derivations stay independent statements of one set. Additionally,
add an assertion that the union of the two enumerations covers every `.ts`/`.svelte` file under
`FRONTEND_SRC_DIR` minus the declared exclusion reasons — the partition being exhaustive is the
invariant, and today nothing measures it.

---

### CR-03: a client held in a parameter is uncounted — and that shape is live in a guarded source

**File:** `apps/frontend/src/lib/api/adapters/supabase/supabaseAdapter.ts:49-51` (the live shape);
`scripts/assert-project-scoped-queries.mjs:432` (`ACCESS_RE`), `:488-518` (the check-6 docblock's
claim), `:49-64` (`STATED RESIDUALS`)

**Issue:** Check 6 forbids six ways of reaching the client past the receiver anchor, and its docblock
justifies prohibition-over-widening with: *"it costs nothing here, because a guarded adapter source
has no legitimate need for any of the six — the sanctioned route to a table is the scoped helper, and
the accessor that hands the client to that helper RETURNS it rather than binding it, which this
rule's leading `=` does not reach."*

That sentence names the getter and stops. It does not name the **parameter**. The scoped helper hands
the raw client to a free function:

```ts
// apps/frontend/src/lib/api/adapters/supabase/supabaseAdapter.ts:49-51
export function tableBuilder<TTable extends ProjectScopedTable>(client: SupabaseClient<Database>, table: TTable) {
  return client.from(table);
}
```

This is the only raw `.from(<project-scoped table>)` in the entire guarded corpus, and it is invisible
to the guard. The summary's "5 raw client call(s) examined" is five `.rpc(` sites
(`get_nominations`, `get_questions`, `merge_question_custom_data`, `get_candidate_user_data`,
`upsert_answers` — confirmed by `grep -rn "\.rpc(" apps/frontend/src/lib/api/adapters/supabase/`);
zero `.from(` sites are counted. The guard reports it examined every raw client call in the adapter
while the one raw table call is at an address it does not read.

The consequence generalises: any guarded source may pass `this.#supabase` to a function and that
function may issue arbitrary unscoped queries, uncounted. There is no `=`, so `CLIENT_BINDING_RE`
misses it; the receiver is `client`, so `ACCESS_RE` misses it; the source is in the adapter corpus, so
`BOUNDARY_ACCESS_RE` never runs over it.

**Reproduction (run, observed, reverted):**

```
# appended to scripts/fixtures/project-scoped-queries/violation.fixture.ts:
#   export function paramHeldClientTableRead(client: AnyClient): AnyBuilder {
#     return client.from('elections').select('*');
#   }
$ node scripts/assert-project-scoped-queries.mjs --self-test
Project-scoped query guard — self-test flagged 32 line(s) … (32 access(es)) and 0 … (8 access(es)),
plus 11 line(s) … (11 site(s)) and 0 … (2 site(s)), matching the committed expectation.
EXIT=0
```

Unchanged committed expectation, exit 0 — uncounted. (A control run that additionally appended
`client.functions.invoke('probe_param_held_undispositioned', …)` DID redden — `33 site(s)` and
`6 Edge Function invocation site(s)` — which is what says the harness was reading something and that
the miss is specific to the table/rpc matchers, `INVOKE_RE` being deliberately receiver-unanchored.)
Fixture restored; tree clean.

Today's live site is not a leak: `scopedFrom` appends `.eq('project_id', projectId)` to the builder
`tableBuilder` returns. But the shape is live, uncounted, and unnamed in `STATED RESIDUALS` — which is
the standard this phase has treated as blocking on nine prior occasions regardless of live
exploitation.

**Fix:** Pick one and write it down:

1. **Close it.** Forbid a `from`/`rpc` on any identifier whose *declared type* is not the concern of a
   regex — so instead, forbid the export shape: a guarded source may not pass the client out of the
   class. A matcher on `(tableBuilder|<any function>)\(\s*this\s*\??\.\s*#?supabase` catches the hand-off,
   and `tableBuilder` becomes a method on the mixin (it already only ever has one caller,
   `scopedFrom` at line 106). This costs one refactor and closes the axis.
2. **State it.** Add a seventh residual naming the shape explicitly, add
   `paramHeldClientTableRead` to `violation.fixture.ts` as a *documented non-firing* shape is NOT
   available (a fixture shape that fires nothing cannot be pinned) — so it must be added to
   `RESIDUAL_PHRASES` plus the module docblock, and the check-6 docblock's "no legitimate need"
   sentence corrected, since `tableBuilder` is a counter-example sitting in the tree.

Whichever is chosen, the check-6 docblock sentence at `:483-487` is currently a false statement about
this repository and must change.

## Warnings

### WR-01: two of the twenty `NEGATIVE_CONTROLS` entries cannot go red — WR-04's defect class, on WR-04's closure

**File:** `packages/dev-seed/tests/projectScopingGate.test.ts:57-101` (`NEGATIVE_CONTROLS`),
`:1194-1204` (the presence assertion)

**Issue:** The assertion is `expect(text).toContain(shape)` over the fixture's whole text, and the
shape names are method names that also appear in sibling **docblocks**. Deleting the control itself
therefore leaves the assertion satisfied. Two of the twenty entries are in this state:

- `clean.fixture.ts :: destructuredCallResult` — the name also appears at
  `clean.fixture.ts:25` ("Declared so `destructuredCallResult` below stays self-describing"). This is
  the entry the list's own comment calls *"161-18's false-positive control, and the one shape CR-02's
  closure turns on: the promotion of the binding rule is only free of live cost while this stays
  unreported."*
- `outside-boundary.clean.fixture.ts :: bucketUpload` — the name also appears at
  `outside-boundary.clean.fixture.ts:57` ("The same bucket as `bucketUpload` above").

The docblock at `:48-56` asserts the opposite: *"Presence is the half that has to survive a maintainer
tidying the fixtures, and it is the half that goes red when one does."*

**Reproduction (run, observed, reverted), for the more serious of the two:**

```
# deleted the ENTIRE destructuredCallResult method (docblock + body) from clean.fixture.ts
$ grep -n "destructuredCallResult" scripts/fixtures/project-scoped-queries/clean.fixture.ts
25:    /** Declared so `destructuredCallResult` below stays self-describing. … */
$ node scripts/assert-project-scoped-queries.mjs --self-test
… matching the committed expectation.
EXIT=0
$ yarn workspace @openvaa/dev-seed vitest run tests/projectScopingGate.test.ts
✓ tests/projectScopingGate.test.ts (112 tests)   —   Tests  112 passed (112)
```

The same procedure on `outside-boundary.clean.fixture.ts`'s `bucketUpload` (deleting its docblock and
function, lines 37-40) also left the guard at exit 0 with unchanged counts and the gate spec at
112/112. Both fixtures restored.

**Fix:** Assert the DECLARATION, not the name. The controls are all methods or exported functions, so
anchor on the declaration shape rather than the bare identifier:

```ts
for (const shape of shapes) {
  // Match `  shapeName(` at a line start (method) or `export function shapeName(` — a docblock
  // mention of the name can never satisfy either, so deleting the control is a named failure.
  const declared = new RegExp(`^\\s{2}(?:async\\s+)?${shape}\\s*\\(|^export function ${shape}\\s*\\(`, 'm');
  expect(declared.test(text), `${fixture} :: ${shape}`).toBe(true);
}
```

Re-run 161-19's deletion sweep against the corrected assertion for all twenty entries, not just the
two named here — `grep -c` per name in its fixture shows `clean :: scopedFrom` at 2 and
`violation :: scopedTableRead` at 3, so the count-based screen alone will not tell you which are safe.

---

### WR-02: the "closed vocabulary" assertion is closed only over question marks

**File:** `packages/dev-seed/tests/projectScopingGate.test.ts:1624-1629`

**Issue:** The case is titled *"admits no optional punctuator in ${name} outside the three enumerated
token forms"* and its comment promises *"A fourth form is a decision somebody has to make, not a
spelling that can arrive unnoticed."* Its mechanism is:

```ts
let remainder = matcherSpanOf(name).text;
for (const { token } of PUNCTUATOR_TOKENS) remainder = remainder.split(token).join('');
expect(remainder).not.toContain('\\?');
```

It detects only a residual **escaped question mark**. Any punctuator admission not spelled with `?`
passes silently — including the `!?\s*` form CR-01 requires. The assertion measures the three
enumerated forms against themselves; it does not measure the matcher against the language.

**Fix:** Fold into CR-01's fix. After stripping enumerated tokens, assert the remainder contains no
un-enumerated optionality of any spelling — practically, assert the remainder matches only a
whitelist of literal-character constructs, or at minimum extend the residual test to
`expect(remainder).not.toMatch(/\\\?|!|\(\?:[^)]*\)\?/)`. The stronger form is to derive the
admitted-punctuator alphabet from the declaration and require every character of it to be accounted
for by a `PUNCTUATOR_TOKENS` entry.

---

### WR-03: the impossibility claim authorising the `boundClientMemberRead` corpus move is overstated

**File:** `scripts/assert-project-scoped-queries.mjs:466-470` (check-6 docblock), `:62-64`
(`STATED RESIDUALS`); `scripts/fixtures/project-scoped-queries/violation.fixture.ts:146-156`

**Issue:** The move of `boundClientMemberRead` out of the clean corpus and into the violating one
rests on: *"no source-level rule can tell a bound client SUB-OBJECT from a bound SCALAR member — both
are spelled `= this.supabase.<identifier>;` — so the choice is between reporting this and not
reporting `subObjectAliasedClient`."*

That is a false dichotomy in this guard's own house style. The guard already resolves exactly this
class of question with declared disposition maps: `PROJECT_SCOPED_TABLES`,
`NON_PROJECT_SCOPED_TABLES`, `PROJECT_SCOPED_RPCS`, `PROJECT_SCOPED_EDGE_FUNCTIONS`. The Supabase
client's sub-object surface is small, closed and stable (`auth`, `functions`, `storage`, `rest`,
`realtime`, `schema`). A `CLIENT_SUB_OBJECTS` list — mandatory-disposition on arrival, exactly as
check 2 does for a new table literal — distinguishes `= this.supabase.functions;` from
`= this.supabase.restUrl;` at source level, with no type information, and turns an unrecognised
member into a hard failure rather than a silent pass.

I am **not** claiming the move is wrong. The near-miss control survived it: `destructuredCallResult`
is still in `clean.fixture.ts:76-79` and still unreported (`cleanMessages.length === 0` and
`cleanCount === 8` are both asserted, and both hold at HEAD). The finding is that the artifact states
a **design tradeoff as an impossibility**, and uses that impossibility to justify moving a
known-false-positive shape out of the negative corpus. This repository's own standard — "a residual
cannot be stated without being measured" — is not met by an unfalsifiable "no rule can".

**Fix:** Restate honestly, and let the residual say what it costs rather than that it could not be
avoided:

```
 *   - the binding rule decides from the member NAME alone, and no member disposition list is
 *     declared, so a bound scalar member is reported as an alias; for such a site the message is a
 *     false statement about what was bound. A CLIENT_SUB_OBJECTS disposition map would separate the
 *     two at the cost of a written disposition per client member; it is not declared, and that is a
 *     decision rather than an impossibility
```

Update the check-6 docblock's "WHAT THE PROMOTION COSTS" paragraph in the same edit, and keep
`RESIDUAL_PHRASES` in sync (the gate spec asserts the two lengths against each other, so both halves
move together).

---

### WR-04: "for that one site" understates the false-positive class

**File:** `scripts/assert-project-scoped-queries.mjs:62-64`, `:466-470`

**Issue:** The residual reads *"…so a plain member read bound to a local is reported as an alias, and
for that one site the message is a false statement about what was bound"*, and the check-6 docblock
says *"the message is a false statement about that particular site"*. Both singularise. The false
positive applies to **every** `const x = this.supabase.<scalar-member>;` a guarded source ever
writes — an unbounded class, not one site. The fixture has one instance; the rule has no bound.

**Fix:** Drop "that one site" / "that particular site" for "any such site". Trivially, but the phrase
is pinned by `RESIDUAL_PHRASES[5]` and by the assertion at `:1743-1756`, so the pinned substring must
be re-cut in the same edit.

---

### WR-05: `MATCHER_NAMES` is hand-authored, and its back-check only sees constants suffixed `_RE`

**File:** `packages/dev-seed/tests/projectScopingGate.test.ts:405-415` (`MATCHER_NAMES`),
`:1528-1539` (the back-check)

**Issue:** The list's docblock claims it "is held honest from the guard's side too — a matcher
constant the guard declares that is NOT here may admit no optional punctuator at all, asserted below,
so a new one carrying a punctuator is a named failure rather than a silent omission." The assertion
that delivers this scans:

```ts
const declared = [...GUARD_SOURCE.matchAll(/^const ([A-Z][A-Z0-9_]*_RE) =/gm)].map((m) => m[1]);
```

A matcher constant not suffixed `_RE` — `CLIENT_ACCESS_PATTERN`, `NON_NULL_ACCESS`, anything — is
absent from `declared`, so it is neither required to be on `MATCHER_NAMES` nor required to admit no
punctuator. It would be enumerated by nothing, disposed by nothing, and mutated by nothing, while
every case in this block stays green.

Given `<what_you_are_reviewing>`'s fourth criterion — flag any new hand-authored constant that can
silently drift from the guard without an assertion catching the disagreement — this is the one that
qualifies. `MATCHER_NAMES` is hand-authored and its guard-side back-pressure is conditional on a
naming convention nothing enforces.

**Fix:** Enforce the convention, or drop the dependency on it. The cheaper of the two:

```ts
// Every top-level `const NAME = /…/` declaration in the guard, regardless of suffix.
const declared = [...GUARD_SOURCE.matchAll(/^const ([A-Z][A-Z0-9_]*) = \//gm)].map((m) => m[1]);
expect(declared.length).toBeGreaterThan(0);
for (const name of MATCHER_NAMES) expect(declared).toContain(name);
for (const name of declared.filter((c) => !MATCHER_NAMES.includes(c))) {
  expect(matcherSpanOf(name).text, `${name} is an unenumerated matcher`).not.toContain('\\?');
}
```

---

### WR-06: a multi-line destructure of the client is counted in the wrong family

**File:** `scripts/assert-project-scoped-queries.mjs:527` (`DESTRUCTURING_LHS_RE`), `:720-728`

**Issue:** `checkEscapeHatches` decides alias-vs-destructure from
`text.slice(lineStart, match.index)` — the text before the `=` **on the match's own line** — tested
against `/\{[^{}]*\}\s*$/`. A destructure Prettier has wrapped across lines presents only `} ` before
the `=`, which the pattern rejects, so the site is reported as *"aliases the raw client or one of its
members"*.

Measured directly:

```
$ node -e "…CLIENT_BINDING_RE on 'const {\n  from\n} = this.supabase;'…"
matched: true at 17
slice before =: "} "
destructured? false
```

The self-test pins `aliasCount === 5` and `destructureCount === 2` **separately**, with the stated
rationale that "a change that moved one into the other's family would leave a pooled total intact and
fail here by name". A formatting change at a live site does exactly that move without any test
failing, because the live counts are a floor-plus-fixture arrangement and the fixture shapes are all
single-line. The message also becomes false about the site.

**Fix:** Read the initialiser's left-hand side across the statement rather than across the line:

```js
/** A destructuring pattern immediately left of the `=` that bound the client, across line breaks. */
const DESTRUCTURING_LHS_RE = /\}\s*$/;
```

is too loose; prefer scanning backwards from `match.index` to the preceding `;`, `{` or newline-run
that begins the statement, and testing `/\{[\s\S]*\}\s*$/` over that slice. Add a multi-line
destructure shape to `violation.fixture.ts` and raise `destructureCount` to 3 so the position is
load-bearing.

## Info

### IN-01: `.js` / `.mjs` files under the frontend source tree are never walked

**File:** `scripts/assert-project-scoped-queries.mjs:1394`

**Issue:** `enumerateFrontendSourcesOutsideAdapter` accepts only `.ts` and `.svelte`.
`find apps/frontend/src \( -name '*.js' -o -name '*.mjs' \) | wc -l` returns **601**. They are
generated Paraglide output today, so the exclusion is defensible — but the enumerator's docblock
explicitly states its exclusions "carry a reason each, because an exclusion list is where coverage
quietly leaves", and this one carries none.

**Fix:** Add the reason to the docblock (generated i18n output, no hand-authored `.js` in this tree),
or accept `.js`/`.mjs` and let the corpus grow. Prefer the second — the exclusion is currently a
silent one.

---

### IN-02: the module docblock's check-9 reach statement is false at two addresses

**File:** `scripts/assert-project-scoped-queries.mjs:26-31`, `:110-114`

**Issue:** *"Check 9 runs over the rest of the frontend source tree and asserts exactly that: all
project-scoped table and rpc access lives under the adapter directory, so a table or rpc reached from
any other address is a violation naming the file, the line and the boundary."* Not true of
`adapters/supabase/utils/**` (CR-02) nor of `.js`/`.mjs` files (IN-01). This is the same
overstated-reach failure mode the phase's third re-verification removed twice from this same
docblock.

**Fix:** Fix CR-02 and IN-01, then the sentence becomes true. If either is left open, the sentence
must name the exclusion.

---

### IN-03: both `.planning/todos/pending/` amendments check out; one nuance worth recording

**Files:** `.planning/todos/pending/2026-09-07-run-escape-hatch-and-schema-hop-checks-outside-the-adapter-directory.md`,
`.planning/todos/pending/2026-09-07-widen-the-client-binding-rule-to-the-whole-initialiser.md`

**Issue (none blocking — recorded so the next verifier need not re-derive it):** I checked both
amendments against the live declarations rather than against the SUMMARYs.

- The escape-hatch/schema-hop todo's 161-17 amendment correctly removes the invocation surface from
  its scope and correctly says the three enumerated shapes are untouched: `COMPUTED_ACCESS_RE`,
  `COMPUTED_RECEIVER_RE` and `SCHEMA_HOP_RE` are read only by `checkEscapeHatches` and
  `checkSchemaHop`, and `checkOutsideSource` (`:1009-1012`) composes only `checkBoundary` and
  `checkEdgeFunctionInvocations`. Its step 4 — flipping the boundary matcher's three computed cells
  from `residual` to `matches` — still matches the live matrix
  (`projectScopingGate.test.ts:834`, `:844`, `:854`). Accurate; does not over-claim.
- The binding-rule todo's 161-18 note is accurate on all three amended facts: the committed regex it
  quotes is byte-identical to `:517-518`; the four-way readings it names (7/2, 2/1, 3/1, 5/2) match
  the comment at `:1165-1180`; and the residual list stands at six in both `RESIDUAL_PHRASES`
  (`:168-175`) and the docblock (`:51-64`). Its step 3 arithmetic caveat (5 and 14) matches
  `aliasCount === 5` and `violationTally.escapeHatches === 14`.

One nuance: the binding-rule todo's step 5 says deleting the left-edge phrase "must move both by one,
to five". If WR-03 is actioned, the phrase text changes rather than the count, so the two edits must
not be sequenced as if independent.

**Fix:** No change required to either todo for this cycle. If CR-01/CR-02/CR-03 are actioned, both
todos should gain a dated note the way they already have for 161-17 and 161-18 — CR-03 in particular
overlaps the binding-rule todo's territory without being covered by it (that todo is about the
initialiser's LEFT edge; CR-03 is about a receiver with no initialiser at all).

---

_Reviewed: 2026-09-07T10:35:00Z_
_Reviewer: Claude (gsd-code-reviewer)_
_Depth: standard_
_Tree state after review: clean of `scripts/`, `packages/` and `apps/` — `git status --porcelain` shows only the pre-existing `.planning/config.json`, `.planning/state.json` and untracked `.planning/milestone.lock`._
