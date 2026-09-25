#!/usr/bin/env node

/**
 * PROJECT-SCOPED QUERY GUARD.
 *
 * Every table carrying a `project_id` foreign key to `public.projects` holds rows for more than
 * one project. A query against such a table that does not name the project it is for does not
 * fail — it succeeds and returns somebody else's rows. That is the failure this guard exists to
 * make loud, at the call site, before a merge.
 *
 * The predicate is INVERTED from the obvious one. Rather than assert that every `.from(<scoped
 * table>)` chain contains an `.eq('project_id', …)`, it forbids the raw call shape outright: no
 * bare `this.supabase.from(<declared scoped table>)` and no bare `this.supabase.rpc(<declared
 * scoped rpc>)` in a guarded adapter source. The declared scoped helper is used instead.
 *
 * The inversion is not a convenience. Four measured call shapes defeat the literal predicate:
 * builders bound with `let` and reassigned across `if` statements, a union-typed dynamic table
 * argument, a select whose filter is applied several statements later, and bucket accesses that
 * are not table accesses at all. The inversion also covers the READ path by construction — a
 * brand-new unscoped `.from('elections')` is a violation whether or not `project_id` already
 * appears anywhere in that file, which the literal predicate cannot deliver against a source
 * that has no `project_id` reference today.
 *
 * WHAT THIS GUARD'S REACH IS, stated so it is a checked claim rather than a reader's assumption.
 * Checks 1 to 8 run over the adapter sources, which is where every project-scoped query is supposed
 * to live — ALL of them, including the `utils/` subtree, which was skipped by this walk and by the
 * boundary walk at once and so sat in neither corpus until the fourth review's CR-02. Check 9 runs
 * over the rest of the frontend source tree and asserts exactly that: all project-scoped table and
 * rpc access lives under the adapter directory, so a table or rpc reached from any other address is
 * a violation naming the file, the line and the boundary — at every address the two corpora reach,
 * which is now every `.ts` and `.svelte` source under the frontend tree and no other extension. That
 * last clause is the one exclusion this sentence still carries, and it is stated in the residual list
 * below rather than left for a reader to find, because a reach claim with an unstated exclusion is
 * how this paragraph went false twice. The exhaustiveness of the two-corpus partition is asserted
 * from OUTSIDE the guard, in the gate spec: a walk cannot audit its own exclusions, which is exactly
 * how the `utils/` subtree left. The Edge
 * Function check runs over BOTH corpora, because it decides everything from the function-name
 * literal and one live invocation is a route handler rather than an adapter method. The widened walk
 * fails closed when it finds no files, for the reason the adapter walk does.
 *
 * HOW FAR THE ACCESS PUNCTUATORS REACH, and where that claim is kept honest. Optional chaining has
 * three source punctuators, and the enumeration proving this guard reads all of them is deliberately
 * NOT in this paragraph — it is in `packages/dev-seed/tests/projectScopingGate.test.ts`, which
 * derives one CELL per punctuator admission from each declaration's own text, reverts each cell to
 * its plain form on its own, and requires the revert to break the self-test. Every admitted position
 * is therefore held in place by a committed fixture shape whose disposition depends on it. A position
 * a matcher anchors nothing to the LEFT of is exempt, and its redundancy is measured rather than
 * assumed: the match simply begins further along, so no fixture can make that position load-bearing —
 * each such mutant is asserted to stay green, so a change that ever made one matter would fail there.
 * The exempt set is enumerated in `REDUNDANT_CELLS` in that same spec rather than counted here,
 * because a numeral stated in this paragraph is wrong the moment the set moves. The same spec
 * generates every punctuator at every operator position of
 * each matcher's canonical call shape and demands a written disposition per cell, so a position the
 * language has that no matcher admits fails there too. A sentence here could go stale in either
 * direction; those assertions cannot.
 *
 * STATED RESIDUALS. Each phrase below is pinned by the assertion that measures it, so a residual
 * cannot be stated here without a measurement, nor measured without being stated:
 *   - an interposed comment is not trivia the matchers admit, so a receiver and a member separated
 *     by a block comment are unmatched in both corpora
 *   - the owner rule's `?` exclusion is a bare character, so `const self = this ?? other;` — a
 *     nullish coalesce that binds the owner whenever it is non-null — is UNREPORTED, exactly as its
 *     client-level twin `nullishCoalescedClient` would be under the same spelling. Narrowing it to a
 *     `?` not followed by a second `?` is what reports it, and that makes the lookahead an admitted
 *     punctuator position, which requires registering this rule on the gate spec's `MATCHER_NAMES`
 *     and giving it a disposition matrix. That is a DECISION deferred, not an impossibility, and it
 *     is recorded here rather than left as a silent hole
 *   - the owner rule reads a binding of `this` at an `=`, so an owner reached by any other
 *     expression is unread: a spread, an `Object.assign`, an arrow that returns it, a `for…of`
 *     over an array holding it, an array destructure of that array, and a getter returning it are
 *     each a receiver no matcher here sees. This is the OWNER-EXPRESSION grammar, and it is stated
 *     rather than chased for the reason the receiver grammar is: every widening is a guess about
 *     the next spelling. Zero live sites exploit any of the six
 *   - a forbidden shape quoted inside a string literal is read as live code, because comment spans
 *     are excluded from the corpora and string spans are not
 *   - the escape-hatch and schema-hop checks do not run outside the adapter directory, so the
 *     computed spellings at that address are unreported
 *   - the binding rule reads only an initialiser that begins with the receiver, so a client aliased
 *     to the right of a nullish coalescing or a ternary is not reported, while a ternary TEST on the
 *     client is reported as an alias although it binds nothing
 *   - a computed member whose key is not a string literal is unreported, so an invocation reached
 *     through a runtime-computed member name on the client or on its functions object is unread
 *   - the binding rule decides from the member NAME alone and no client-member disposition list is
 *     declared, so a plain member read bound to a local is reported as an alias, and for any such
 *     site the message is a false statement about what was bound; a CLIENT_SUB_OBJECTS map would
 *     separate the two at the cost of a written disposition per client member, which makes this a
 *     decision rather than an impossibility
 *   - the table and rpc matchers are anchored on the receiver spelling and the binding rule needs a
 *     leading `=`, so a client held in a PARAMETER is read by neither: a guarded source may hand the
 *     client to a function that issues arbitrary unscoped queries, uncounted. The live instance is
 *     `tableBuilder` in `supabaseAdapter.ts`, which is the ONE raw table call in the guarded corpus
 *     and is not among the raw client calls this guard reports examining; its single caller
 *     `scopedFrom` appends the project filter, so it is unread rather than unsafe
 *   - the boundary walk reads only the TypeScript and Svelte extensions, so a .js or .mjs source
 *     under the frontend source tree is in neither corpus; every such file is generated Paraglide
 *     output today, which the gate spec MEASURES rather than assumes, so a hand-authored one is a
 *     named failure rather than a silent exclusion
 *   - a receiver wrapped in PARENTHESES is unread by every matcher here, because a parenthesis is
 *     not a punctuator but a piece of the receiver's expression grammar, and widening the receiver
 *     is the one widening this guard declines on principle; there is no live instance, and the five
 *     matchers are measured against the shape so the claim is a reading rather than an assumption
 *
 * The two matcher-local residual paragraphs — at the escape-hatch rule and at the boundary rule —
 * cross-reference this list rather than carrying counts of their own, because a numeral stated
 * beside one matcher is wrong the moment this list moves.
 *
 * NINE checks, each a distinct way an unscoped query could reach production:
 *
 *   Check 1 — Forbidden table shape. A `this.supabase.from('<declared scoped table>')` in a
 *     guarded source is a violation naming file, line and table. `this.supabase.storage.from(…)`
 *     is a BUCKET, not a table, and is excluded structurally rather than by a name list.
 *   Check 2 — Undeclared table literal. A table literal in neither declared list is a hard
 *     failure, so a table cannot enter the adapter without a written disposition.
 *   Check 3 — Non-literal argument. A `from(` or `rpc(` whose argument is not a string literal
 *     is a hard failure. A site the guard cannot parse is a site it cannot cover, and reporting
 *     it as clean would be the guard lying about its own reach.
 *   Check 4 — RPC disposition. A static source guard cannot see inside an RPC body, so every
 *     rpc a guarded source calls must carry an explicit written disposition. An rpc dispositioned
 *     `requires p_project_id` must be called with a `p_project_id` key.
 *   Check 5 — Source-set completeness. Every adapter source is in exactly one of the two declared
 *     lists, and every declared entry exists on disk. A source in neither list, or a stale entry
 *     naming a file that is gone, silently reduces coverage.
 *   Check 6 — Escape hatches. A guarded source may not bind the client — or any node on its member
 *     chain — to a local, destructure a method off either, reach a member by computed key — directly
 *     or one link along the chain — or reach the client FIELD by a bracketed key, or bind the client's
 *     OWNER at an `=`. All eight reach the
 *     same client past the receiver anchor checks 1 to 4 depend on, and were demonstrated doing it
 *     while this guard reported the file clean. Forbidden outright rather than chased with a wider
 *     receiver pattern — see the reasoning at CLIENT_BINDING_RE. The binding half of the rule
 *     distinguishes a BINDING from an optional-chained ACCESS by excluding only an initialiser whose
 *     chain TERMINATES IN A CALL: `this.supabase?.from(…)` is reported once, by check 1, and not a
 *     second time as an alias, so this family's count stays a true statement about bindings rather
 *     than a pooled total of two different findings.
 *   Check 7 — Edge Function disposition. An invocation crosses into code no source guard can read,
 *     so every Edge Function invoked from a guarded source carries a written disposition and the
 *     call is held to that disposition's promise. It is a distinct route because the query runs
 *     server-side, where none of the checks above look: an unparameterised function returns every
 *     project's rows to a caller that never spelled a table name at all. The member name is read in
 *     its DOT spelling and in its COMPUTED spelling, and both run over both corpora: this check is
 *     the one per-source check that `checkSource` and `checkOutsideSource` each call, so a rule
 *     placed here is corpus-agnostic by construction rather than by a sentence. A computed key
 *     names a function this guard cannot read, so the site is reported rather than dispositioned —
 *     the same decision check 3 makes for a table argument it cannot parse.
 *   Check 8 — Schema hop. A guarded source may not reach a table through `.schema(…).from(…)`. It is
 *     a call in the middle of the chain, which the receiver-anchored table matcher stops at, so the
 *     table access is uncounted rather than merely unchecked. Forbidden outright for the reason at
 *     CLIENT_BINDING_RE, and it costs no live site — see SCHEMA_HOP_RE.
 *   Check 9 — The boundary. All project-scoped table and rpc access lives under the adapter
 *     directory. A table or rpc reached on a Supabase client from anywhere else under the frontend
 *     source tree is a violation, because at that address none of checks 1 to 4 has run and there is
 *     no scoped helper to be steered toward. Stated as a rule rather than left as a comment: the
 *     sentence was true when it was written, measured, and this is what keeps it true.
 *
 * WHY THIS GUARD PROVES ITSELF ON EVERY RUN. Every guarded source reaches its tables only through
 * the scoped helper, so the real corpus yields ZERO forbidden table sites — which is the point of
 * the conversion, and also means a bare count of violations cannot distinguish "checked and clean"
 * from "checked nothing". Two mechanisms close that gap, and both run in the ORDINARY invocation
 * rather than behind a flag, because the spelling wired into `lint:check` is the only spelling
 * whose green anybody ever sees:
 *
 *   - The self-test runs every per-source check over two committed fixture PAIRS — one pair for the
 *     adapter corpus and one for the corpus outside it, kept separate because the same call can be
 *     legitimate at one address and a violation at the other — and asserts that each violating
 *     fixture reddens with the exact expected shapes and neither clean one does. Its outcome
 *     is appended to the summary line. `--self-test` survives as a direct entry point for a reader
 *     debugging the fixtures; it is no longer the only path that proves anything.
 *   - A non-vacuity floor fails the run when ZERO call sites were examined. A floor, never an exact
 *     count: an exact count reddens on every legitimate refactor and trains the reader to update
 *     the number without reading it. The fixtures supply the precision.
 *
 * WHY NOT ROW-LEVEL SECURITY. RLS returns EMPTY RESULTS rather than failing, so an unparameterised
 * query is silently wrong exactly where it needs to be loud. RLS stays as defence in depth and
 * does not discharge this guard.
 *
 * WHY A REGEX READ RATHER THAN AN AST PARSE. The assertion is about a source spelling in one
 * hand-authored directory, and this matches the house style of the sibling `assert-*.mjs` family:
 * Node built-ins only, no build step, exit 1 naming the specific problem. Comment spans are
 * excluded through the repository's shared classifier rather than a fourth hand-rolled copy, so a
 * docblock that quotes a forbidden shape to explain it is not read as one.
 *
 * Usage:
 *   node scripts/assert-project-scoped-queries.mjs
 *   node scripts/assert-project-scoped-queries.mjs --self-test
 *
 * Exit codes:
 *   0 - all checks clean
 *   1 - at least one violation, a named precondition failure, or a failed self-test
 */

import { readdirSync, readFileSync, statSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { commentSpans, familyFor, inSpans } from './lib/comment-spans.mjs';

const SELF = 'scripts/assert-project-scoped-queries.mjs';
const REPO_ROOT = path.resolve(fileURLToPath(import.meta.url), '..', '..');

/** The comment family for TypeScript sources: slash-slash and slash-star. */
const TS_FAMILY = { c: true };

/** The directory whose sources the completeness check enumerates. */
const ADAPTER_DIR = 'apps/frontend/src/lib/api/adapters/supabase';

/** The root of the frontend source tree. Everything under it and outside `ADAPTER_DIR` is the boundary check's corpus. */
const FRONTEND_SRC_DIR = 'apps/frontend/src';

/**
 * The tables carrying a `project_id` foreign key to `public.projects`.
 *
 * This list mirrors the `ProjectScopedTable` union in
 * `apps/frontend/src/lib/api/adapters/supabase/supabaseAdapter.type.ts`. A table gains an entry
 * here when it gains that foreign key, and the two lists are meant to be read against each other.
 */
const PROJECT_SCOPED_TABLES = [
  'admin_jobs',
  'alliances',
  'app_settings',
  'candidates',
  'constituencies',
  'constituency_groups',
  'elections',
  'factions',
  'feedback',
  'nominations',
  'organizations',
  'question_categories',
  'questions'
];

/**
 * Table literals legitimately reachable without a project filter, each with the reason it is one.
 *
 * These are the tables of the public schema that carry NO `project_id` column, so there is no
 * project to name. The list is complete against the schema at the time of writing; a table that
 * appears in neither list is a hard failure by check 2, which is how a new arrival is forced to
 * acquire a written disposition instead of slipping through.
 */
const NON_PROJECT_SCOPED_TABLES = {
  accounts: 'the tenant a project belongs to, one level ABOVE a project',
  constituency_group_constituencies: 'a join table; both sides are already project-scoped',
  election_constituency_groups: 'a join table; both sides are already project-scoped',
  projects: 'the project registry itself',
  storage_config: 'deployment-wide storage settings, not per project',
  grants:
    'the authority map: who may do what to whom, keyed by user and by a polymorphic target that is an account, a project or an entity rather than always a project'
};

/**
 * Every rpc a guarded source may call, mapped to its written disposition.
 *
 * A static source guard cannot see inside an rpc body, so an rpc's scoping is a claim somebody has
 * to make in writing. `requires p_project_id` means the call must pass a `p_project_id` key and
 * check 4 asserts it. `scoped-by-identity: …` means the function derives its scope from the
 * caller's identity or from a row id it is given, and names which. `UNSCOPED: …` means the body was
 * read and found to carry no project term at all, so the call really does return every project's
 * rows; it is written down rather than quietly omitted, because a disposition that overstates a
 * function's scoping is worse than none — it launders the leak past the next reader.
 *
 * There is no UNSCOPED entry left. `get_questions` was the last one: its body selected from
 * `question_categories` and `questions`, both of which carry a `project_id` foreign key, while its
 * `WHERE` clauses tested only `election_ids`, `constituency_ids` and `election_rounds`, each
 * defaulting NULL. It was closed the way the identical defect on `get_nominations` was closed — a
 * required `p_project_id` with no DEFAULT, first in the argument list, on a re-granted signature —
 * so its disposition is now `requires p_project_id` and check 4 enforces the key at the call site.
 * Both parameters now live in the declarative schema: `get_nominations` in
 * `apps/supabase/supabase/schema/503-entity-rpcs.sql`, `get_questions` in
 * `apps/supabase/supabase/schema/505-question-rpcs.sql`.
 *
 * `project_open_for_voters` returns only a boolean — whether the project is open — for the id the
 * adapter already holds, and the adapter asks it only when the caller can read no `app_settings`
 * row (162.1 D-06). It still takes the project as a required argument, so it is held to check 4
 * like the two data RPCs.
 *
 * `user_can` returns only a boolean about the CALLER'S OWN grants claim and reads no row a caller
 * could not already reason about; the admin writer asks it of the adapter's own configured project
 * (162-REVIEW WR-03). Its target argument is `p_target_id`, not `p_project_id`, so it cannot be held
 * to check 4's key test and is dispositioned by identity instead.
 */
const PROJECT_SCOPED_RPCS = {
  get_nominations: 'requires p_project_id',
  get_questions: 'requires p_project_id',
  get_candidate_user_data: 'requires p_project_id',
  upsert_answers: 'scoped-by-identity: entity id + RLS',
  merge_question_custom_data: 'scoped-by-identity: question id + RLS',
  project_open_for_voters: 'requires p_project_id',
  user_can:
    'scoped-by-identity: the caller JWT grants claim, asked of the target the call names (the adapter passes its own project id)'
};

/**
 * Every Edge Function a guarded source may invoke, mapped to its written disposition.
 *
 * A static source guard cannot see inside an Edge Function body any more than it can see inside an
 * rpc body, so a function's scoping is a claim somebody has to make in writing. `requires a project
 * term` means the invocation must carry the project it is for, and check 7 asserts a `projectId` or
 * `project_id` key in the argument text — both spellings, because both are live: one call site
 * spells the payload in camelCase and the other in the payload's own snake_case convention, and a
 * check that accepted only one would be wrong about the other. `scoped-by-deployment: …` means the
 * function resolves its project from the named deployment variable and treats a body project term as
 * a claim it refuses unless it names that same project, so its payload carries no project term BY
 * DESIGN and demanding one at the call site would be a false demand.
 *
 * There is no UNSCOPED value, and that is not an oversight. A function whose queries carry no
 * project term at all is FIXED before it is dispositioned: writing a disposition wider than the
 * truth launders the leak past the next reader, which is worse than no disposition at all, and
 * writing an honest one that admits the leak leaves it standing behind a word that looks decided.
 *
 * The map is keyed by function name rather than by call site because the disposition belongs to the
 * function: the same function invoked from two files needs the same answer in both.
 */
const PROJECT_SCOPED_EDGE_FUNCTIONS = {
  'invite-candidate': 'requires a project term',
  'send-email': 'requires a project term',
  'identity-callback': 'scoped-by-deployment: PUBLIC_PROJECT_ID'
};

/**
 * The adapter sources whose call shapes are checked.
 *
 * `supabaseAdapter.ts` is guarded because it is where the scoped helper lives: it is the one place
 * allowed to obtain a raw builder, through its own `tableBuilder`, and a `this.supabase.from(` that
 * appeared there would be a bypass of the abstraction rather than an implementation of it.
 *
 * The `utils/` helpers are guarded because they are INSIDE the adapter directory, which is exactly
 * where a client handed to a helper lands. They reach no client today — that is a measurement, not a
 * premise, and it is why adding them moved no count — but "reaches no client today" is a property of
 * this afternoon rather than of the directory, and it was previously enforced by nothing at all: the
 * walk skipped `utils/` and the boundary walk skipped everything under `ADAPTER_DIR`, so the whole
 * subtree sat in NEITHER corpus. See `enumerateAdapterSources`.
 */
const GUARDED_SOURCES = [
  `${ADAPTER_DIR}/supabaseAdapter.ts`,
  `${ADAPTER_DIR}/dataProvider/supabaseDataProvider.ts`,
  `${ADAPTER_DIR}/dataWriter/supabaseDataWriter.ts`,
  `${ADAPTER_DIR}/adminWriter/supabaseAdminWriter.ts`,
  `${ADAPTER_DIR}/feedbackWriter/supabaseFeedbackWriter.ts`,
  `${ADAPTER_DIR}/utils/convertFilterValue.ts`,
  `${ADAPTER_DIR}/utils/fetchAllRows.ts`,
  `${ADAPTER_DIR}/utils/localizeRow.ts`,
  `${ADAPTER_DIR}/utils/mapRow.ts`,
  `${ADAPTER_DIR}/utils/parseJsonbColumn.ts`,
  `${ADAPTER_DIR}/utils/parseOutcome.ts`,
  `${ADAPTER_DIR}/utils/storageUrl.ts`,
  `${ADAPTER_DIR}/utils/toDataObject.ts`
];

/**
 * The declared exception surface: adapter sources deliberately left outside checks 1 to 4, each
 * with the reason it is one.
 *
 * It is EMPTY, and empty is its resting state rather than a milestone. An entry here is a source
 * whose call shapes nobody checks, so one may be added only for a reason that will still be true
 * next year — a language or client limitation that makes the scoped helper unusable at a named
 * site, written out in full. An entry that merely records that a file has not been converted yet
 * is a backlog item, not an exception, and the gate spec in
 * `packages/dev-seed/tests/projectScopingGate.test.ts` fails on one: a temporary reason parked in
 * this array reads as a decision to the next person who opens the file, which is exactly how
 * reduced coverage becomes permanent.
 *
 * Check 5 keeps the two lists exhaustive against the directory, so a source can leave
 * `GUARDED_SOURCES` only by acquiring an entry here — it cannot simply go missing.
 */
const DEFERRED_SOURCES = [];

/** The two committed fixtures the self-test runs the guarded-source checks over. */
const FIXTURE_DIR = 'scripts/fixtures/project-scoped-queries';
const VIOLATION_FIXTURE = `${FIXTURE_DIR}/violation.fixture.ts`;
const CLEAN_FIXTURE = `${FIXTURE_DIR}/clean.fixture.ts`;

/**
 * The two committed fixtures the self-test runs the OUTSIDE-corpus checks over.
 *
 * A separate pair rather than a reuse of the two above, because the corpus semantics differ. The
 * clean guarded-source fixture deliberately contains a dispositioned rpc call — legitimate inside
 * the adapter directory, a boundary violation outside it — so exercising the boundary rule over that
 * same file would force one of the two meanings to give way.
 */
const OUTSIDE_VIOLATION_FIXTURE = `${FIXTURE_DIR}/outside-boundary.violation.fixture.ts`;
const OUTSIDE_CLEAN_FIXTURE = `${FIXTURE_DIR}/outside-boundary.clean.fixture.ts`;

/**
 * Read a source, or report why it could not be read and return null.
 *
 * A file this guard cannot read is a file it cannot check, so an unreadable source is a failure
 * rather than a skip.
 * @param relPath - The path relative to the repository root.
 * @returns The file's text, or null if it could not be read.
 */
function readSource(relPath) {
  try {
    return readFileSync(path.resolve(REPO_ROOT, relPath), 'utf8');
  } catch (error) {
    console.error(
      `[ERROR] ${SELF}: could not read '${relPath}' (${error.message}). ` +
        'A source this guard cannot read is a source it cannot cover, so this fails closed.'
    );
    return null;
  }
}

/**
 * The comment spans of `text`, as absolute character ranges, plus the line-start offsets.
 *
 * The family is a parameter because the boundary corpus contains `.svelte` files, whose prose can
 * sit in an HTML comment as well as a slash one. A TypeScript-only reading of such a file would take
 * a shape quoted inside `<!-- -->` for live code.
 * @param text - The whole file.
 * @param family - The comment family, defaulting to the slash-slash and slash-star pair.
 * @returns The comment spans and the line starts.
 */
function commentMapOf(text, family = TS_FAMILY) {
  const state = { inBlockC: false, inBlockHtml: false, inTemplate: false, lineIndex: 0 };
  const lines = text.split('\n');
  const spans = [];
  const lineStarts = [];
  let offset = 0;

  for (let i = 0; i < lines.length; i++) {
    lineStarts.push(offset);
    state.lineIndex = i;
    for (const [start, end] of commentSpans(lines[i], family, state)) {
      spans.push([offset + start, offset + end]);
    }
    offset += lines[i].length + 1;
  }

  return { spans, lineStarts };
}

/**
 * The 1-based line number containing absolute character index `idx`.
 * @param lineStarts - The line-start offsets from `commentMapOf`.
 * @param idx - The absolute character index.
 * @returns The 1-based line number.
 */
function lineNumberOf(lineStarts, idx) {
  let lo = 0;
  let hi = lineStarts.length - 1;
  while (lo < hi) {
    const mid = Math.ceil((lo + hi) / 2);
    if (lineStarts[mid] <= idx) lo = mid;
    else hi = mid - 1;
  }
  return lo + 1;
}

/**
 * Read the argument list of a call whose opening parenthesis is at `openIdx`.
 *
 * The scan is bracket-balanced and quote-aware, so an argument object spanning several lines and
 * containing its own parentheses is read whole rather than truncated at the first `)`.
 *
 * It is also COMMENT-aware, and that is a correctness requirement rather than a refinement. An
 * ordinary English apostrophe in a comment between two arguments — `the payload's own convention` —
 * is not a string delimiter, but a quote-only scan reads it as one, swallows every bracket until the
 * next apostrophe anywhere in the file, and returns an argument text running hundreds of lines past
 * the call. A disposition then checked against that text is checked against the wrong text, and
 * passing for that reason is indistinguishable from passing for the right one. Measured on a live
 * invocation, which read 2019 characters where the call is 562.
 * @param text - The whole file.
 * @param openIdx - The index of the opening parenthesis.
 * @returns The argument text and the index just past the closing parenthesis, or null if the call
 * is unterminated.
 */
function readCallArguments(text, openIdx) {
  let depth = 0;
  let quote = null;
  for (let i = openIdx; i < text.length; i++) {
    const ch = text[i];
    if (quote) {
      if (ch === '\\') i++;
      else if (ch === quote) quote = null;
      continue;
    }
    if (ch === '/' && text[i + 1] === '/') {
      const newline = text.indexOf('\n', i);
      if (newline === -1) break;
      i = newline;
      continue;
    }
    if (ch === '/' && text[i + 1] === '*') {
      const close = text.indexOf('*/', i + 2);
      if (close === -1) break;
      i = close + 1;
      continue;
    }
    if (ch === "'" || ch === '"' || ch === '`') {
      quote = ch;
      continue;
    }
    if (ch === '(' || ch === '[' || ch === '{') depth++;
    else if (ch === ')' || ch === ']' || ch === '}') {
      depth--;
      if (depth === 0) return { args: text.slice(openIdx + 1, i), end: i + 1 };
    }
  }
  return null;
}

/** Matches `this.supabase` or `this.#supabase`, any intervening member chain, then `.from(` or `.rpc(`. The access punctuator is ANY of the spellings the language has, at every position this pattern contains — the two member ones at each member position and the optional-CALL one at the call. The call punctuator is an optional GROUP holding both its characters rather than an optional `?`, because that punctuator puts a dot between the `?` and the `(`. Each position is held in place by a committed fixture shape and an exact self-test count. */
const ACCESS_RE =
  /this\s*[!?]?\.\s*#?supabase((?:\s*[!?]?\.\s*[A-Za-z_$][\w$]*)*?)\s*[!?]?\.\s*(from|rpc)\s*(?:\?\.\s*|!\s*)?\(/g;

/** Matches a leading single- or double-quoted string literal argument. */
const LEADING_LITERAL_RE = /^\s*(['"])([^'"]*)\1\s*(?:,|$)/;

/**
 * Check 6 — the escape hatches, forbidden outright rather than chased.
 *
 * `ACCESS_RE` is anchored on the receiver spelling `this.supabase` / `this.#supabase`. EIGHT shapes
 * reach the same client past that anchor, and each was demonstrated reading a project-scoped table
 * while this guard reported the file clean: an alias (`const db = this.supabase`), a destructured
 * method (`const { from } = this.supabase`), a computed member (`this.supabase['from']`), a computed
 * member one link along the chain (`this.supabase.rest['from']`), a computed access to the client
 * FIELD itself (`this['supabase'].from`), and a binding of a client SUB-OBJECT
 * (`const fns = this.supabase.functions`), which reaches the same tables one link past where the
 * binding rule used to stop. They are worse than unchecked — they are UNCOUNTED, so check 3's "a
 * site the guard cannot parse is a site it cannot cover" never fires for them either.
 *
 * What the sixth cost, stated because it is the reason the binding rule was promoted rather than
 * left alone: two undispositioned Edge Function invocations inside the adapter directory — this
 * guard's strictest corpus — were uncounted, because `INVOKE_RE` requires the literal member name
 * `functions` immediately before `invoke` and an aliased local does not carry it. So the per-family
 * non-vacuity floor could not see them either, which is the failure this check exists to end.
 *
 * The computed pair at a chained link and at the client field were found by enumerating the
 * punctuator set against every operator position rather than by a reader noticing a spelling, and
 * each is the same escape as the third — the computed rule simply looked one link too late in one
 * case and one link too early in the other. Both meet the standard the schema-hop prohibition met
 * before it was written: a repository-wide search for a bracket-quoted client key returns nothing,
 * and a search of the guarded sources for a bracketed access after any client member returns
 * nothing, so neither rule costs a live call site. The sixth meets it too: every live
 * `= this.supabase…` chain in a guarded source terminates in a CALL, so the widened lookahead
 * excludes every one of them and the live summary is unmoved.
 *
 * WHAT THE PROMOTION COSTS is stated in the module docblock's residual list rather than counted
 * here: this rule decides from the member NAME alone and no client-member disposition list is
 * declared, so a plain member read bound to a local is reported as an alias and the message is a
 * false statement about ANY such site. It is committed as a violating fixture shape
 * (`boundClientMemberRead`) rather than deleted, because a limitation nobody can see is not a
 * disposed limitation.
 *
 * THAT COST IS A DECISION, NOT AN IMPOSSIBILITY, and the distinction is corrected here rather than
 * left standing. This paragraph read "no source-level rule can tell a bound client SUB-OBJECT from a
 * bound SCALAR member", and used that to authorise moving a known false positive out of the negative
 * corpus. It is false in this guard's own house style: the client's sub-object surface is small,
 * closed and stable (`auth`, `functions`, `storage`, `rest`, `realtime`, `schema`), and a
 * `CLIENT_SUB_OBJECTS` disposition map — mandatory-disposition on arrival, exactly as check 2 is for
 * a new table literal — separates `= this.supabase.functions;` from `= this.supabase.restUrl;` at
 * source level with no type information, turning an unrecognised member into a hard failure rather
 * than a silent pass. `PROJECT_SCOPED_TABLES`, `NON_PROJECT_SCOPED_TABLES`, `PROJECT_SCOPED_RPCS`
 * and `PROJECT_SCOPED_EDGE_FUNCTIONS` already resolve exactly this class of question that way.
 *
 * The map is NOT declared, and the reason is a cost rather than a barrier: it is a seventh mandatory
 * disposition list, with its own arrival check, its own fixture shapes and its own mutation cells,
 * and it would move `boundClientMemberRead` back to the clean corpus and delete a residual. That is
 * a plan, not a docblock edit. What this repository's standard does forbid is recording the tradeoff
 * as an impossibility: "a residual cannot be stated without being measured", and an unfalsifiable
 * "no rule can" is not a measurement. The scope of the false positive is likewise unbounded rather
 * than singular — it is EVERY `const x = this.supabase.<scalar-member>;` a guarded source ever
 * writes, of which the fixture holds one instance.
 *
 * The move itself was re-checked rather than taken on the strength of the corrected claim, and it
 * stands: `destructuredCallResult` is still in `clean.fixture.ts`, still contributes zero counted
 * sites, and is still asserted unreported. The near-miss control the promotion turns on survived it.
 *
 * THE CORPUS-AXIS LIMITATION the two computed rules carry is stated in the module docblock's residual list
 * rather than counted here: they run over the adapter corpus only, because the walk outside it runs
 * the boundary and invocation checks alone, so the same spellings at an address outside the adapter
 * directory are unreported. It is a corpus-axis limitation rather than a punctuator one, and it is
 * listed where the whole set is listed so that no paragraph beside one matcher carries a numeral the
 * set can move without it.
 *
 * WHY PROHIBITION RATHER THAN A WIDER RECEIVER PATTERN. Widening the receiver to any identifier and
 * deciding from the table literal would cover these and invite the next: the receiver is an
 * open-ended expression grammar, and every widening is a guess about which spellings a future author
 * will reach for. A prohibition is decidable by inspection and has no next case. It also costs
 * nothing here, because a guarded adapter source has no legitimate need for any of the six — the
 * sanctioned route to a table is the scoped helper. If a guarded source ever does need one of these
 * shapes, that is a finding to record and escalate, not an exception to widen quietly.
 *
 * THAT PARAGRAPH USED TO NAME THE GETTER AND STOP, and the sentence it stopped on was false about
 * this repository. It read that the accessor handing the client to the scoped helper "RETURNS it
 * rather than binding it, which this rule's leading `=` does not reach" — true of a getter, and
 * silent about the PARAMETER. `scopedFrom` hands the raw client to a free function:
 *
 *     export function tableBuilder(client: SupabaseClient<Database>, table: TTable) {
 *       return client.from(table);
 *     }
 *
 * That is a counter-example to "no legitimate need" sitting in the tree, and it is the ONE raw
 * `.from(<project-scoped table>)` in the whole guarded corpus. It is invisible to every rule here,
 * and to THREE of them rather than the two a reader would expect. There is no `=`, so the binding
 * rule misses it. The receiver is `client`, so `ACCESS_RE` misses it. And `BOUNDARY_ACCESS_RE`
 * misses it TWICE OVER — once because it anchors on a receiver whose identifier contains `supabase`
 * and this parameter is called `client`, and again because `CORPUS_OF` puts it outside the adapter
 * directory, so it never runs over this file at all. Both halves are measured in the gate spec
 * rather than reasoned here, because the first was assumed to be false while the fix was written and
 * the measurement is what corrected it. The raw-client-call count this guard prints is therefore
 * five `.rpc(` sites and zero `.from(` sites, while the guard reports having examined every raw
 * client call in the adapter.
 *
 * It is STATED as a residual rather than closed, and the reason is recorded rather than implied.
 * Closing it means forbidding the hand-off — a matcher on `<function>(this.supabase` — and that
 * matcher reports `tableBuilder(this.#supabase, table)` at the live call site, so the prohibition
 * cannot land without first moving `tableBuilder` onto the mixin. Today's site is NOT a leak:
 * `scopedFrom` appends `.eq('project_id', projectId)` to the builder it returns. So the shape is
 * live, uncounted, and now named — which is the standard this phase has held to, rather than the
 * silence it was in.
 */
// The trailing lookahead spans the whitespace rather than consuming it, deliberately, and that
// measured finding holds for the widened shape exactly as it did for the narrow one it replaces. A
// consuming `\s*` in front of a negative lookahead is satisfiable by BACKTRACKING: the engine gives
// back the whitespace, finds a newline where it needed a non-dot, and calls the binding bare — which
// reported the adapter's own multi-line `= await this.supabase\n  .rpc(…)` as an alias. Every `\s*`
// now sits INSIDE the lookahead, spanning the gaps of the chain it reads, so that chain crosses
// newlines and both live multi-line bindings stay excluded. Measured, not feared.
//
// What the lookahead excludes is an initialiser whose member chain TERMINATES IN A CALL or in a
// computed access — not, as it was, any directly-following member token. That supersedes the
// ALTERNATION finding this paragraph used to record, because there is no alternation left to reason
// about, and it is the second measured finding on this one lookahead. Excluding only a TERMINATING
// call is what tells an optional-chained ACCESS, which check 1 reports, from an ALIAS, which only
// this rule reports — while newly reporting a binding one link along the chain, which nothing read
// at all: `const fns = this.supabase.functions;` reaches every table the client does, through a
// receiver no matcher here can see, and `INVOKE_RE` cannot see the `fns.invoke(…)` behind it either.
//
// The exact alias and destructure counts in the self-test are what read differently under each
// candidate lookahead, which is what makes them a measurement rather than a restatement of this
// code. All four readings were measured against the committed shape set rather than reasoned about:
// with NO trailing lookahead it reads 7 and 2, because both optional-chained table accesses are
// mistaken for aliases; with a bare `?` added to a character class it reads 2 and 1, because `??`
// begins with the same character and the `.` in that class also excludes every binding one link
// along; with the NARROW lookahead this one replaces it reads 3 and 1, because a sub-object binding
// is excluded alongside the access it was written to exclude; and only the committed form reads 5
// and 2 — the plain, nullish-coalesced, optional-receiver, sub-object and bound-scalar-member
// bindings all reported, both optional-chained accesses left alone. The committed fixtures pinning
// the two discriminating shapes are `nullishCoalescedClient` and `subObjectAliasedClient`.
const CLIENT_BINDING_RE =
  /(?<![=!<>])=\s*(?:await\s+)?this\s*[!?]?\.\s*#?supabase\b(?!(?:\s*[!?]?\.\s*[A-Za-z_$][\w$]*)*\s*(?:\?\.\s*|!\s*)?[([])/g;

/** The computed-member half of check 6: `supabase['from']`, `supabase[method]`, `supabase?.['from']`, `supabase.rest['from']` one link along the chain, and every relative. The chain is the same BARE-IDENTIFIER chain `ACCESS_RE` allows, so a computed member at a chained link is no longer invisible while its unchained twin is reported; an index taken on the RESULT OF A CALL is still not matched, because a call is not a bare identifier. The optional operator is an OPTIONAL GROUP holding the whole two-character punctuator rather than an optional `?`: the optional spelling puts a dot between the `?` and the `[`, so a lone `?` would both miss that shape and newly match a ternary whose test is a Supabase-named identifier. */
const COMPUTED_ACCESS_RE = /\bsupabase(?:\s*[!?]?\.\s*[A-Za-z_$][\w$]*)*\s*(?:\?\.\s*|!\s*)?\[/g;

/** The computed-RECEIVER half of check 6: the client field itself reached by a bracketed string key, `this['supabase']` and `this?.['supabase']`. Its sibling above looks one link too late — it anchors on the identifier `supabase`, which a bracketed key spells inside a string literal, so the receiver reached this way is past every anchor including that one. The optional punctuator is held whole in a group for the reason the sibling's docstring gives. */
const COMPUTED_RECEIVER_RE = /\bthis\s*(?:\?\.\s*|!\s*)?\[\s*(['"])#?supabase\1\s*\]/g;

/**
 * The OWNER half of check 6: a binding of `this` ITSELF, one link EARLIER than every sibling above.
 *
 * This is CR-04, and it is the fifth consecutive blind spot of the same class — a spelling that was
 * UNCOUNTED rather than merely unreported, so the per-family non-vacuity floor could not see the
 * family go silent either. Both shapes it closes reach every table the client does:
 *
 *   const self = this;              then `self.supabase.from('elections')` — `ACCESS_RE` needs the
 *                                   literal `this` before `supabase` and never sees the alias.
 *   const { supabase } = this;      then `supabase.from('elections')` — `CLIENT_BINDING_RE` needs
 *                                   `this.supabase` right of the `=`, and this initialiser is bare
 *                                   `this`, so the destructure is past its anchor too.
 *
 * `BOUNDARY_ACCESS_RE` does match both, which is the detail that makes this a CORPUS defect rather
 * than a vocabulary one: `checkSource` never calls `checkBoundary`, so the matcher that could see
 * these shapes is never run over the corpus that contains them. That is CR-01's blindness in mirror
 * image, at the guard's strictest corpus rather than at its widest.
 *
 * WHY A PROHIBITION ON THE OWNER RATHER THAN A WIDER RECEIVER. The reasoning `CLIENT_BINDING_RE` and
 * `SCHEMA_HOP_RE` already record applies here with more force, not less. Chasing the receiver means
 * reading `self.supabase`, then `const b = a;` behind it, then the next spelling after that — an
 * open-ended expression grammar in which every widening is a guess about the next case. Binding the
 * owner is a CLOSED shape: `this` is a keyword with exactly one spelling, so forbidding it at the
 * `=` closes the chain at its ROOT for every alias that is spelled as a BINDING OF `this` ITSELF.
 *
 * WHAT THIS RULE DOES NOT CLOSE, stated because the sentence that stood here claimed it did. It read
 * "every alias of an alias must pass through this one position to exist at all", which is FALSE and
 * was falsified by enumeration rather than by argument: `[...this]` / `{ ...this }`,
 * `Object.assign({}, this)`, `() => this`, `for (const o of [this])`, `const [o] = [this]`, and a
 * getter returning `this` each reach the client through a receiver this rule never sees, because
 * none of them binds `this` at an `=`. That is the OWNER-EXPRESSION grammar, and it is open-ended in
 * exactly the way `CLIENT_BINDING_RE`'s docblock says a receiver grammar is: every widening is a
 * guess about the next spelling. It is therefore a STATED RESIDUAL rather than a chase — named here,
 * counted by nothing, and listed in `RESIDUAL_PHRASES` so the gate spec measures the claim in both
 * directions. Zero live sites exploit any of the six today, checked rather than assumed.
 *
 * MEASURED COST, not assumed: a repository-wide search for a bare `this` binding under
 * `apps/frontend/src` returns four sites — `appContext.svelte.ts`, `trackingService.svelte.ts`,
 * `authContext.svelte.ts` and `dataContext.svelte.ts` — and NONE of them is in the adapter directory
 * this rule is wired to. The prohibition therefore costs zero live call sites today, exactly as the
 * schema-hop prohibition did.
 *
 * The trailing lookahead holds its whitespace INSIDE itself for the reason `CLIENT_BINDING_RE`'s
 * docblock records at length: a consuming `\s*` in front of a negative lookahead is satisfiable by
 * BACKTRACKING, so the engine would give the whitespace back, find a space where it needed a
 * non-dot, and report `= this\n  .supabase` — a member access check 1 already reports — as an owner
 * binding. What the lookahead excludes is every punctuator that CONTINUES the chain rather than
 * ending it — `.`, `[`, and the `!.` of a non-null assertion mid-chain — plus the two shapes that
 * share a first character with one of those and mean something else: a comparison (`!=`, `!==`) and
 * a ternary whose test is `this` (a `?` NOT followed by a second `?`).
 *
 * THE CHARACTER-CLASS FORM THIS REPLACES WAS WRONG, and it is CR-05. The lookahead read
 * `(?!\s*[.?![])` — a class excluding the bare characters `.`, `?`, `!` and `[` — which excluded
 * far more than the chain: `const self = this!;` (a non-null assertion that TERMINATES, binding the
 * owner) and `const self = this ?? other;` (a nullish coalesce that binds the owner when it is
 * non-null) both begin with an excluded character and were therefore UNCOUNTED, the same signature
 * as the nine findings before them. Both have committed VIOLATING siblings one link along the same
 * chain — `nullishCoalescedClient` and `nonNullAssertedTableRead` — so the punctuators were already
 * known to this guard at the client level while the owner level could not read them. The exclusions
 * are now two characters wide wherever the language's shape is two characters wide, which is what
 * tells `!.` from `!;`, and `?.` from `??`.
 */
const OWNER_BINDING_RE = /(?<![=!<>])=\s*(?:await\s+)?this\b(?!\s*(?:[.?[]|!(?:\.|=)))/g;

/**
 * Whether the binding at `atEquals` is a DESTRUCTURE rather than an alias, decided across the
 * statement rather than across the line.
 *
 * This read `DESTRUCTURING_LHS_RE = /\{[^{}]*\}\s*$/` against `text.slice(lineStart, match.index)`
 * — the text before the `=` ON THE MATCH'S OWN LINE — and got two shapes wrong, each in the same
 * direction: reported as an alias, in the other family's count, with a message that is a false
 * statement about the site.
 *
 *   const {                      a destructure Prettier has WRAPPED. The slice before the `=` is
 *     from                       just `} `, which has no opening brace, so the pattern rejects it.
 *   } = this.supabase;           Every fixture shape is single-line, so no committed count moved
 *                                and nothing anywhere failed — a FORMATTING change at a live site
 *                                silently moves one family into the other's total.
 *
 *   const { a: { from } } = this.supabase;    a NESTED pattern. `[^{}]*` cannot span the inner
 *                                            braces, so this is rejected too. Not in the review's
 *                                            finding; found by measuring the one it did name.
 *
 * The self-test pins `aliasCount` and `destructureCount` SEPARATELY, with the stated rationale that
 * "a change that moved one into the other's family would leave a pooled total intact and fail here
 * by name". That rationale only holds while the classifier is right, and a line-scoped reading of a
 * statement that may wrap is not.
 *
 * Decided by BRACE BALANCE instead: skip the whitespace left of the `=`, require a `}`, and walk
 * back to its match. That spans newlines and nests by construction, so neither shape above depends
 * on how Prettier happened to break the line. A function rather than a regex because balance is not
 * a regular property — which is exactly why the pattern it replaces got the nested case wrong.
 * @param text - The whole file.
 * @param atEquals - The offset of the `=` that bound the client.
 * @returns Whether a destructuring pattern sits immediately left of it.
 */
function bindsByDestructuring(text, atEquals) {
  let index = atEquals - 1;
  while (index >= 0 && /\s/.test(text[index])) index--;
  if (index < 0 || text[index] !== '}') return false;

  let depth = 0;
  for (; index >= 0; index--) {
    if (text[index] === '}') depth++;
    else if (text[index] === '{') {
      depth--;
      if (depth === 0) return true;
    }
  }
  return false;
}

/**
 * Check 8 — the schema hop, forbidden outright for the same reason the escape hatches are.
 *
 * `ACCESS_RE`'s chain group spans BARE IDENTIFIERS only, so it walks `this.supabase.storage.from(`
 * and stops dead at `this.supabase.schema('public').from(`: a call in the middle of the chain is not
 * a member name. The table on the far side is therefore not merely unchecked but UNCOUNTED, so
 * check 3's "a site the guard cannot parse is a site it cannot cover" never fires for it either and
 * the non-vacuity floor reads a file full of them as a file with nothing in it.
 *
 * WHY PROHIBITION RATHER THAN A WIDER RECEIVER PATTERN. The reasoning at `CLIENT_BINDING_RE` applies
 * unchanged: the receiver is an open-ended expression grammar, and every widening is a guess about
 * the next spelling, whereas a prohibition is decidable by inspection and has no next case. Two
 * measured facts make it defensible rather than merely convenient here. A repository-wide search for
 * this shape returns nothing, so the rule costs no live call site. And of the client's own members
 * only the schema call returns an object carrying `from` and `rpc` — `storage` and `functions` are
 * property reads handled by their own rules, and `auth` reaches no table — so forbidding this one
 * call closes the shape rather than sampling it.
 *
 * WIDENING THE OPERATOR IS NOT THE RECEIVER WIDENING ARGUED AGAINST ABOVE, and the distinction is
 * the same one this docblock already draws. The receiver is an open-ended expression grammar, so
 * every widening of it is a guess about the next spelling and there is always a next one. The access
 * PUNCTUATOR is a closed set fixed by the language, so reading all of it is not a guess.
 *
 * WHICH LANGUAGE, and that word is the whole of the correction this paragraph is now on its second
 * round of. The argument was first written about a set of TWO — `.` and `?.` — and there turned out
 * to be a third, `?.(`, which every matcher here was blind to while this paragraph said there was no
 * next case. It was then restated as "the punctuator set the language defines" and there turned out
 * to be a FOURTH: `!.`, TypeScript's non-null assertion, sitting between the receiver and the dot.
 * The set enumerated both times was JAVASCRIPT's optional-chaining set. The language this repository
 * is written in is TypeScript, whose member-access punctuator set additionally contains `!.` — an
 * established house spelling with 54 live occurrences under `apps/frontend/src`, not a curiosity.
 * The set is now `.`, `?.`, `!.` and their bracket and call forms, and the closed set that matters is
 * the one THIS language defines rather than the one its subset does.
 *
 * What makes "no next case" a CHECKED claim rather than a promise is that the set is enumerated in
 * full — every punctuator at every operator position each matcher declares — and every cell of that
 * enumeration is either held down by a committed fixture whose disposition depends on it, or
 * recorded as a measured exemption. The enumeration could not SEE the fourth spelling: its three
 * token forms were all spelled with a question mark, and the assertion that kept the vocabulary
 * closed tested only for a residual `\?`, so a form admitting `!` contains nothing that test reads.
 * Both halves are repaired together, because repairing either alone leaves the other free to let the
 * fifth spelling in the same way. A position widened with no fixture behind it is what this
 * paragraph previously licensed, and a spelling no assertion reads is how two of them went unread.
 */
const SCHEMA_HOP_RE =
  /this\s*[!?]?\.\s*#?supabase(?:\s*[!?]?\.\s*[A-Za-z_$][\w$]*)*\s*[!?]?\.\s*schema\s*(?:\?\.\s*|!\s*)?\(/g;

/**
 * Matches `.functions.invoke(` on ANY receiver, with tolerant whitespace around each dot.
 *
 * Deliberately NOT anchored on `this.supabase`, which is the one place this guard departs from its
 * own receiver anchor, for two reasons. The disposition belongs to the FUNCTION rather than to the
 * caller: the same function invoked from two files needs the same answer in both, so a matcher keyed
 * on who is calling would have to be told the answer twice. And one live invocation in this
 * repository reaches the client through an entirely different receiver — a request-scoped client
 * handed to a route — so a receiver-anchored invocation check would be blind to it, which is the
 * same mistake checks 6 and 8 exist to stop, committed in a new place.
 *
 * The widening is safe here in a way it would not be for a table access. A table access has to
 * decide from the receiver whether the object is the project-scoped client at all; an invocation is
 * decided entirely from the function-name literal, which means the check reads the same over
 * whatever corpus it is handed.
 *
 * Every access punctuator is read, at every position this pattern contains. The leading one is
 * widened for consistency with this matcher's siblings and changes nothing on its own — the pattern
 * is unanchored, so a receiver reached with `?.` was already matched from the dot onward, and no
 * fixture can make that position load-bearing. Its redundancy is a MEASURED exemption recorded in
 * `REDUNDANT_CELLS` in the gate spec rather than counted here, stated rather than left for a reader
 * to discover as an unproven cell. The position between `functions`
 * and `invoke`, and the optional-CALL punctuator on `invoke` itself, are the two that were actually
 * blind, and each is held down by a committed fixture shape and an exact self-test count.
 */
const INVOKE_RE = /[!?]?\.\s*functions\s*[!?]?\.\s*invoke\s*(?:\?\.\s*|!\s*)?\(/g;

/**
 * Matches the `invoke` member reached by a COMPUTED STRING KEY on a `functions` object —
 * `functions['invoke'](`, `functions?.['invoke'](` and `functions['invoke']?.(`.
 *
 * Like `INVOKE_RE` it is deliberately unanchored on its receiver and decides everything from the
 * member-name literal, which is what lets it read the same over whatever corpus it is handed. It is
 * wired into the one per-source check both corpus composers call, so it reaches the boundary address
 * as well as the adapter one rather than only where a reader assumed it would.
 *
 * It is the direct closure of the corpus-axis finding this guard's fourth review named: `INVOKE_RE`'s
 * computed spelling was dispositioned to a matcher that runs over the adapter corpus alone and is
 * never called at the boundary address, so the disposition was true where it was measured and false
 * where the invocation check actually runs. An Edge Function reached this way had no disposition
 * checked and was not counted by the invocation family either, so the per-family non-vacuity floor
 * could not see the shape go silent.
 *
 * The key must be a STRING LITERAL, in any of the three spellings JavaScript has for one. A key
 * computed at runtime is unread, which is stated in this module's residual list rather than left for
 * a reader to discover.
 */
const COMPUTED_INVOKE_RE = /\bfunctions\s*(?:\?\.\s*|!\s*)?\[\s*(['"`])invoke\1\s*\]\s*(?:\?\.\s*|!\s*)?\(/g;

/**
 * Matches the client's `functions` member reached by a COMPUTED STRING KEY — `['functions']`,
 * `?.['functions']`, and the double-quoted and backticked spellings of the same key.
 *
 * It is the half of the computed invocation surface `INVOKE_RE` cannot see: that rule requires the
 * literal member name `functions` immediately before `invoke`, and a bracketed key spells the name
 * inside a string literal, so the invocation behind it is past the one anchor the invocation check
 * depends on. Receiver-unanchored for the same reason its two siblings are — the disposition belongs
 * to the FUNCTION rather than to the caller, and one live invocation reaches the client through an
 * entirely different receiver.
 *
 * Its leading optional-punctuator group is a MEASURED EXEMPTION rather than an unproven widening.
 * The pattern anchors nothing to its left, so a receiver reached with `?.` is already matched from
 * the bracket onward and no fixture can make that position load-bearing. The exemption is recorded
 * in `REDUNDANT_CELLS` in `packages/dev-seed/tests/projectScopingGate.test.ts`, where its mutant is
 * asserted to stay GREEN — so a change that ever made the position matter would fail there. No count
 * is stated here, because a numeral beside one matcher is wrong the moment that set moves.
 */
const COMPUTED_FUNCTIONS_RE = /(?:\?\.\s*|!\s*)?\[\s*(['"`])functions\1\s*\]/g;

/**
 * Check 9 — a table or rpc reached from a source OUTSIDE the adapter directory.
 *
 * The receiver is WIDER than `ACCESS_RE`'s, deliberately. Out here the client is not a field of a
 * class: it is a request-scoped object handed to a route handler (`locals.supabase`), a module local,
 * or a named admin client. So the anchor is the client's own identifier — any identifier whose name
 * contains `supabase` — rather than the `this.` that precedes it inside the adapter, followed by the
 * same bare-identifier chain `ACCESS_RE` allows and then the table or rpc call. The access
 * punctuator is any of the spellings the language has, at every position this pattern contains,
 * exactly as it is in `ACCESS_RE`: a table reached `locals.supabase?.from(…)` or
 * `locals.supabase.from?.(…)` is the same finding as one reached `locals.supabase.from(…)`, and is
 * reported by this same rule with the same message. Each position is held down by a committed
 * fixture shape in the outside pair and an exact per-message count, rather than by this sentence.
 *
 * WHY THIS RULE IS A BOUNDARY RATHER THAN THE ADVICE CHECKS 1 TO 4 GIVE. Those checks answer a bare
 * table access with "use the scoped helper", which is an instruction only a source that HAS one can
 * follow; a route handler does not. The rule that holds out here is the address itself: all
 * project-scoped table and rpc access lives under the adapter directory, so an access at any other
 * address is outside every check that decides whether a table is project-scoped, and the route to a
 * table from out here is the adapter's public surface.
 *
 * It is a tripwire rather than a backlog. Measured before it was written: a search of the frontend
 * source tree outside the adapter directory for a table or rpc call on a Supabase receiver returns
 * nothing, so the statement is true on the day it is made and the check exists to keep it true.
 *
 * THE RESIDUALS AT THIS ADDRESS are listed in the module docblock rather than counted here, because
 * a numeral stated beside one matcher is wrong the moment that list moves. The one specific to this
 * rule is that it reads the client by its conventional name, so a client rebound to an unrelated
 * local (`const db = locals.supabase`) is not seen out here. That is the same shape check 6 forbids
 * outright inside the adapter directory, and it is not forbidden here only because a prohibition
 * needs a corpus somebody has read end to end. A rebinding that then reached a table would still be
 * the finding this boundary describes.
 */
const BOUNDARY_ACCESS_RE =
  /(?<![\w$])[\w$]*[Ss]upabase[\w$]*((?:\s*[!?]?\.\s*[A-Za-z_$][\w$]*)*?)\s*[!?]?\.\s*(from|rpc)\s*(?:\?\.\s*|!\s*)?\(/g;

/**
 * Every `from` / `rpc` access in `text` that is not inside a comment.
 *
 * Bucket accesses (`this.supabase.storage.from(…)`) are dropped here rather than filtered by name
 * downstream: a bucket is not a table, and excluding it structurally means no bucket name ever has
 * to be added to a table list to keep this guard quiet.
 * @param text - The whole file.
 * @returns One record per access, with its method, argument text, line and literal (if any).
 */
function collectAccesses(text) {
  const map = commentMapOf(text);
  const accesses = [];
  ACCESS_RE.lastIndex = 0;
  let match;
  while ((match = ACCESS_RE.exec(text)) !== null) {
    if (inSpans(match.index, map.spans)) continue;
    const chain = match[1] ?? '';
    if (/\bstorage\b/.test(chain)) continue;
    const openIdx = match.index + match[0].length - 1;
    const call = readCallArguments(text, openIdx);
    const line = lineNumberOf(map.lineStarts, match.index);
    if (call === null) {
      accesses.push({ method: match[2], line, args: null, literal: null });
      continue;
    }
    const literalMatch = LEADING_LITERAL_RE.exec(call.args);
    accesses.push({
      method: match[2],
      line,
      args: call.args,
      literal: literalMatch ? literalMatch[2] : null
    });
  }
  return accesses;
}

/**
 * Check 6 over one source: the four shapes that reach the client past the receiver anchor — an alias or
 * destructure of the client, a computed member on it, a computed key naming the client field, and a binding
 * of the client's OWNER at an `=`.
 * @param relPath - The path used in messages.
 * @param text - The source text.
 * @param violate - The reporter to call per violation.
 * @returns How many escape-hatch sites were found.
 */
function checkEscapeHatches(relPath, text, violate) {
  const map = commentMapOf(text);
  let found = 0;

  CLIENT_BINDING_RE.lastIndex = 0;
  let match;
  while ((match = CLIENT_BINDING_RE.exec(text)) !== null) {
    if (inSpans(match.index, map.spans)) continue;
    found++;
    const line = lineNumberOf(map.lineStarts, match.index);
    const destructured = bindsByDestructuring(text, match.index);
    violate(
      `${relPath}:${line}: this ${destructured ? 'destructures the raw client' : 'aliases the raw client or one of its members'} ` +
        'to a local binding. A member of the client reaches every table the client does, through a receiver ' +
        'this guard cannot see, so the file reports clean while querying whatever it likes. Reach tables ' +
        'through `this.scopedFrom(<table>)`.'
    );
  }

  COMPUTED_ACCESS_RE.lastIndex = 0;
  while ((match = COMPUTED_ACCESS_RE.exec(text)) !== null) {
    if (inSpans(match.index, map.spans)) continue;
    found++;
    violate(
      `${relPath}:${lineNumberOf(map.lineStarts, match.index)}: computed member access on the client. It is ` +
        'the same call spelled so no dot-access matcher sees it, which makes the guard report clean on a ' +
        'query it never read. Name the member, or reach tables through `this.scopedFrom(<table>)`.'
    );
  }

  OWNER_BINDING_RE.lastIndex = 0;
  while ((match = OWNER_BINDING_RE.exec(text)) !== null) {
    if (inSpans(match.index, map.spans)) continue;
    found++;
    const line = lineNumberOf(map.lineStarts, match.index);
    const destructured = bindsByDestructuring(text, match.index);
    violate(
      `${relPath}:${line}: this ${destructured ? "destructures the client out of the client's owner" : "binds the client's owner"} ` +
        'to a local. The owner reaches the client, and the client reaches every table, through a receiver no ' +
        'matcher here anchors on — so the file reports clean while querying whatever it likes. An owner bound ' +
        'at an `=` is forbidden here rather than chased down the chain; an owner reached by some other ' +
        'expression is a stated residual, not a shape this rule reads. Reach tables through ' +
        '`this.scopedFrom(<table>)`.'
    );
  }

  COMPUTED_RECEIVER_RE.lastIndex = 0;
  while ((match = COMPUTED_RECEIVER_RE.exec(text)) !== null) {
    if (inSpans(match.index, map.spans)) continue;
    found++;
    violate(
      `${relPath}:${lineNumberOf(map.lineStarts, match.index)}: computed access to the client field. The ` +
        'client reached by a bracketed key is past every receiver anchor the table and rpc checks depend ' +
        'on, so the query behind it is never read and the file reports clean. Name the member, or reach ' +
        'tables through `this.scopedFrom(<table>)`.'
    );
  }

  return found;
}

/**
 * Check 8 over one source: the schema hop, which puts a table behind a mid-chain call.
 * @param relPath - The path used in messages.
 * @param text - The source text.
 * @param violate - The reporter to call per violation.
 * @returns How many schema-hop sites were found.
 */
function checkSchemaHop(relPath, text, violate) {
  const map = commentMapOf(text);
  let found = 0;

  SCHEMA_HOP_RE.lastIndex = 0;
  let match;
  while ((match = SCHEMA_HOP_RE.exec(text)) !== null) {
    if (inSpans(match.index, map.spans)) continue;
    found++;
    violate(
      `${relPath}:${lineNumberOf(map.lineStarts, match.index)}: this reaches a table through a schema call. ` +
        'It is a call in the MIDDLE of the client chain, which the receiver-anchored table matcher stops at, ' +
        'so the access is uncounted rather than merely unchecked and the file reports clean. Reach tables ' +
        'through `this.scopedFrom(<table>)`.'
    );
  }

  return found;
}

/**
 * Check 7 over one source: every Edge Function invocation, held to its written disposition.
 *
 * An invocation is not a table access and cannot be forbidden — the ones this repository makes are
 * load-bearing. It is the rpc situation one surface over: the guard cannot read the body, so the
 * scoping is a written claim and what this check enforces is the claim's own promise at the call
 * site. Sites are COUNTED as well as reported, so a source consisting only of invocations is a
 * source the non-vacuity floor still sees.
 * @param relPath - The path used in messages.
 * @param text - The source text.
 * @param violate - The reporter to call per violation.
 * @param family - The comment family of `text`, for the corpus that contains more than TypeScript.
 * @returns How many invocation sites were found.
 */
function checkEdgeFunctionInvocations(relPath, text, violate, family = TS_FAMILY) {
  const map = commentMapOf(text, family);
  let found = 0;

  INVOKE_RE.lastIndex = 0;
  let match;
  while ((match = INVOKE_RE.exec(text)) !== null) {
    if (inSpans(match.index, map.spans)) continue;
    found++;
    const site = `${relPath}:${lineNumberOf(map.lineStarts, match.index)}`;
    const openIdx = match.index + match[0].length - 1;
    const call = readCallArguments(text, openIdx);

    if (call === null) {
      violate(
        `${site}: a \`.functions.invoke(\` whose argument list this guard could not read to its closing ` +
          'parenthesis. A site the guard cannot parse is a site it cannot cover, so it is reported rather ' +
          'than skipped.'
      );
      continue;
    }

    const literalMatch = LEADING_LITERAL_RE.exec(call.args);
    if (literalMatch === null) {
      violate(
        `${site}: \`.functions.invoke(\` is called with a non-literal argument ` +
          `(\`${call.args.split('\n')[0].trim().slice(0, 60)}\`). This guard reads string literals; a function ` +
          'name computed at runtime is a site it cannot cover, so it is reported rather than skipped. Name ' +
          'the Edge Function literally.'
      );
      continue;
    }

    const name = literalMatch[2];
    const disposition = PROJECT_SCOPED_EDGE_FUNCTIONS[name];
    if (disposition === undefined) {
      violate(
        `${site}: Edge Function '${name}' has no disposition in PROJECT_SCOPED_EDGE_FUNCTIONS in ${SELF}. A ` +
          'static guard cannot see inside a function body, so every Edge Function this repository invokes ' +
          'needs an explicit written disposition here.'
      );
      continue;
    }
    if (disposition === 'requires a project term' && !/\b(projectId|project_id)\b/.test(call.args)) {
      violate(
        `${site}: Edge Function '${name}' is dispositioned '${disposition}' but is invoked without a project ` +
          'term in its argument object. Pass the project this call is for, as `projectId` or `project_id`.'
      );
    }
  }

  COMPUTED_INVOKE_RE.lastIndex = 0;
  while ((match = COMPUTED_INVOKE_RE.exec(text)) !== null) {
    if (inSpans(match.index, map.spans)) continue;
    found++;
    violate(
      `${relPath}:${lineNumberOf(map.lineStarts, match.index)}: computed member on the client's \`functions\` ` +
        'object. The Edge Function behind it is named by a key this guard cannot read, so its written ' +
        'disposition is never checked and the site would be uncounted by the invocation family. Name the ' +
        "member: `.functions.invoke('<function>', …)`."
    );
  }

  COMPUTED_FUNCTIONS_RE.lastIndex = 0;
  while ((match = COMPUTED_FUNCTIONS_RE.exec(text)) !== null) {
    if (inSpans(match.index, map.spans)) continue;
    found++;
    violate(
      `${relPath}:${lineNumberOf(map.lineStarts, match.index)}: computed access to the client's \`functions\` ` +
        'member. The invocation behind it is past the member anchor the invocation check depends on, so the ' +
        "function's disposition is never checked. Name the member: `.functions.invoke('<function>', …)`."
    );
  }

  return found;
}

/**
 * Run checks 1 to 4 and checks 6 to 8 over one source.
 *
 * The returned total is what the non-vacuity floor reads, so every check that finds sites counts
 * them into it: a shape nobody counts is a shape the floor cannot see. The optional `tally` records
 * the same sites BY FAMILY, and that split is load-bearing rather than reporting garnish — see the
 * floor in `main` for the failure it exists to prevent.
 * @param relPath - The path used in messages.
 * @param text - The source text.
 * @param violate - The reporter to call per violation.
 * @param tally - Optional per-family counters, added into rather than replaced.
 * @returns How many client-touching sites were examined.
 */
function checkSource(relPath, text, violate, tally) {
  const accesses = collectAccesses(text);

  for (const access of accesses) {
    const site = `${relPath}:${access.line}`;

    if (access.args === null) {
      violate(
        `${site}: a \`this.supabase.${access.method}(\` whose argument list this guard could not read to its ` +
          'closing parenthesis. A site the guard cannot parse is a site it cannot cover, so it is reported ' +
          'rather than skipped.'
      );
      continue;
    }

    if (access.literal === null) {
      violate(
        `${site}: \`this.supabase.${access.method}(\` is called with a non-literal argument ` +
          `(\`${access.args.split('\n')[0].trim().slice(0, 60)}\`). This guard reads string literals; an ` +
          'argument computed at runtime is a site it cannot cover, so it is reported rather than skipped. ' +
          'Name the table or rpc literally, or route the call through `this.scopedFrom(<table>)`.'
      );
      continue;
    }

    if (access.method === 'from') {
      if (PROJECT_SCOPED_TABLES.includes(access.literal)) {
        violate(
          `${site}: bare \`this.supabase.from('${access.literal}')\`. \`${access.literal}\` carries a ` +
            'project_id foreign key to public.projects, so an unfiltered query against it returns other ' +
            `projects' rows. Use \`this.scopedFrom('${access.literal}')\` instead.`
        );
      } else if (!Object.prototype.hasOwnProperty.call(NON_PROJECT_SCOPED_TABLES, access.literal)) {
        violate(
          `${site}: table '${access.literal}' is declared in neither PROJECT_SCOPED_TABLES nor ` +
            `NON_PROJECT_SCOPED_TABLES in ${SELF}. Add it to whichever is true of it, with a reason, so its ` +
            'scoping is a decision somebody wrote down.'
        );
      }
      continue;
    }

    const disposition = PROJECT_SCOPED_RPCS[access.literal];
    if (disposition === undefined) {
      violate(
        `${site}: rpc '${access.literal}' has no disposition in PROJECT_SCOPED_RPCS in ${SELF}. A static ` +
          'guard cannot see inside an rpc body, so every rpc the adapter calls needs an explicit written ' +
          'disposition here.'
      );
      continue;
    }
    if (disposition === 'requires p_project_id' && !/\bp_project_id\b/.test(access.args)) {
      violate(
        `${site}: rpc '${access.literal}' is dispositioned '${disposition}' but is called without a ` +
          'p_project_id key in its argument object.'
      );
    }
  }

  const escapeHatches = checkEscapeHatches(relPath, text, violate);
  const invocations = checkEdgeFunctionInvocations(relPath, text, violate);
  const schemaHops = checkSchemaHop(relPath, text, violate);

  if (tally) {
    tally.accesses += accesses.length;
    tally.escapeHatches += escapeHatches;
    tally.invocations += invocations;
    tally.schemaHops += schemaHops;
  }

  return accesses.length + escapeHatches + invocations + schemaHops;
}

/**
 * Check 9 over one source: a table or rpc reached from outside the adapter directory.
 *
 * Bucket accesses are dropped exactly where `collectAccesses` drops them — before the site is
 * counted, on the shape of the chain rather than on a name — so a bucket is neither reported nor
 * added to the examined count, and no bucket name ever has to be written down to keep this quiet.
 * @param relPath - The path used in messages.
 * @param text - The source text.
 * @param violate - The reporter to call per violation.
 * @param family - The comment family of `text`, for the corpus that contains more than TypeScript.
 * @returns How many boundary-crossing sites were found.
 */
function checkBoundary(relPath, text, violate, family = TS_FAMILY) {
  const map = commentMapOf(text, family);
  let found = 0;

  BOUNDARY_ACCESS_RE.lastIndex = 0;
  let match;
  while ((match = BOUNDARY_ACCESS_RE.exec(text)) !== null) {
    if (inSpans(match.index, map.spans)) continue;
    const chain = match[1] ?? '';
    if (/\bstorage\b/.test(chain)) continue;
    found++;
    violate(
      `${relPath}:${lineNumberOf(map.lineStarts, match.index)}: a \`${match[2]}(\` on a Supabase client outside ` +
        `'${ADAPTER_DIR}'. All project-scoped table and rpc access lives under the adapter directory, so an ` +
        'access here is outside every check that decides whether a table is project-scoped, and there is no ' +
        'scoped helper at this address to route it through. Reach the data through the adapter.'
    );
  }

  return found;
}

/**
 * Run the outside-corpus checks over one source: the boundary, and the invocation disposition.
 *
 * The sibling of `checkSource`, for the corpus outside the adapter directory. It is a SHORTER list
 * than that one on purpose. Checks 1 to 4 report a bare table access by telling the author to use
 * the scoped helper, and no source out here has one, so that advice would be advice the file cannot
 * take; the rule that applies at this address is the boundary instead. The invocation check runs
 * unchanged, because it decides everything from the function-name literal and so reads the same over
 * whatever corpus it is handed.
 * @param relPath - The path used in messages.
 * @param text - The source text.
 * @param violate - The reporter to call per violation.
 * @returns How many client-touching sites were examined.
 */
function checkOutsideSource(relPath, text, violate) {
  const family = familyFor(relPath) ?? TS_FAMILY;
  return checkBoundary(relPath, text, violate, family) + checkEdgeFunctionInvocations(relPath, text, violate, family);
}

/**
 * Run the per-source checks over the two fixture pairs and assert that the guard still fires.
 *
 * Called from `main` on EVERY invocation, not only under the flag. See the module docblock: a flag nobody passes proves nothing, and the spelling wired into the chain is the spelling that has to be self-proving.
 * @returns The outcome, and the one-line summary its caller prints.
 */
function selfTest() {
  const violationSrc = readSource(VIOLATION_FIXTURE);
  const cleanSrc = readSource(CLEAN_FIXTURE);
  const outsideViolationSrc = readSource(OUTSIDE_VIOLATION_FIXTURE);
  const outsideCleanSrc = readSource(OUTSIDE_CLEAN_FIXTURE);
  if (violationSrc === null || cleanSrc === null || outsideViolationSrc === null || outsideCleanSrc === null) {
    return { passed: false, summary: `self-test could not read its fixtures, so it proved nothing.` };
  }

  const violationMessages = [];
  // The per-family tally `checkSource` already computes, asked for rather than discarded. Asserting
  // only the pooled total is the exact shape this file condemns where the non-vacuity floor reads
  // the access family rather than a grand total: a regression that moves one site out of one family
  // and another into a second leaves the pooled number intact, so a pooled assertion cannot tell a
  // raised count from a shuffled one.
  const violationTally = { accesses: 0, escapeHatches: 0, invocations: 0, schemaHops: 0 };
  const violationCount = checkSource(VIOLATION_FIXTURE, violationSrc, (m) => violationMessages.push(m), violationTally);
  const cleanMessages = [];
  const cleanCount = checkSource(CLEAN_FIXTURE, cleanSrc, (m) => cleanMessages.push(m));
  const outsideViolationMessages = [];
  const outsideViolationCount = checkOutsideSource(OUTSIDE_VIOLATION_FIXTURE, outsideViolationSrc, (m) =>
    outsideViolationMessages.push(m)
  );
  const outsideCleanMessages = [];
  const outsideCleanCount = checkOutsideSource(OUTSIDE_CLEAN_FIXTURE, outsideCleanSrc, (m) =>
    outsideCleanMessages.push(m)
  );

  let failed = 0;
  const expect = (condition, description) => {
    if (condition) return;
    failed++;
    console.error(`[ERROR] ${SELF}: self-test expectation failed — ${description}.`);
  };

  /**
   * How many of `messages` contain `needle`.
   *
   * Used wherever two committed shapes share one message text. A `some(...)` cannot tell a doubled
   * shape from a single one, so it would go on passing if one of the pair stopped being reported —
   * which is exactly what a widened matcher has to be able to prove it did not do.
   * @param messages - The messages one fixture produced.
   * @param needle - The message substring identifying one shape.
   * @returns The number of matching messages.
   */
  const countIn = (messages, needle) => messages.filter((m) => m.includes(needle)).length;

  // The counts are exact on purpose, and they are the positive control for the structural bucket
  // exclusion. Each fixture contains storage-bucket accesses on top of the sites counted here, so a
  // count one higher than expected would mean a bucket was read as a table, and a count of zero
  // would mean nothing was checked at all. The violating fixture's thirty-two are eight access
  // sites, fourteen escape hatches, five invocations and five schema hops; the clean fixture's eight
  // are three dispositioned rpcs and five invocations.
  //
  // The thirty-two sites sit on thirty-ONE source lines, and the difference is stated here rather
  // than left for a reader to rediscover as an off-by-one. `computedInvokeMemberInsideAdapter` is
  // matched by TWO rules and they SEPARATE rather than merge: check 6's computed-member rule counts
  // it into the escape-hatch family and check 7's computed-invocation rule counts it into the
  // invocation family, so that single line raises both tallies — and produces both messages. Each is
  // asserted below by its own exact count, so a change that merged the two rules would fail by name
  // rather than by a quieter total.
  // Checks 6, 7 and 8 count as well as report, because
  // their shapes were UNCOUNTED before they existed — so check 3's "a site the guard cannot parse is
  // a site it cannot cover" could not fire for them either, and a source containing nothing else
  // would have sailed past the non-vacuity floor.
  //
  // The pooled total is asserted BY FAMILY as well, and that is the difference between a number that
  // moved and a number that says WHICH rule moved it. A pooled count is satisfied by a regression
  // that takes one site out of the access family and puts another into the escape-hatch family; the
  // four family assertions below are not, so a raised count here is a statement about a named rule
  // rather than about a sum.
  //
  // The violating fixture now carries THREE bucket accesses — the plain-dot spelling, the
  // optional-chained one and the optional-CALL one — and none of them is in the arithmetic above.
  // That is what makes them a control for the access matcher's chain capture group: turn that group
  // non-capturing while the operators are widened and all three read as tables, so this count goes
  // up by three and the check-1 expectations start naming a bucket as if it were a table.
  expect(
    violationCount === 41,
    `${VIOLATION_FIXTURE} yielded ${violationCount} site(s), expected exactly 41 (the bucket accesses must be excluded)`
  );
  expect(
    violationTally.accesses === 9,
    `${VIOLATION_FIXTURE} yielded ${violationTally.accesses} raw client call site(s), expected exactly 9`
  );
  expect(
    violationTally.escapeHatches === 20,
    `${VIOLATION_FIXTURE} yielded ${violationTally.escapeHatches} escape-hatch site(s), expected exactly 20`
  );
  expect(
    violationTally.invocations === 6,
    `${VIOLATION_FIXTURE} yielded ${violationTally.invocations} Edge Function invocation site(s), expected exactly 6`
  );
  expect(
    violationTally.schemaHops === 6,
    `${VIOLATION_FIXTURE} yielded ${violationTally.schemaHops} schema-hop site(s), expected exactly 6`
  );
  expect(
    cleanCount === 8,
    `${CLEAN_FIXTURE} yielded ${cleanCount} site(s), expected exactly 8 (the bucket access must be excluded)`
  );
  expect(
    violationMessages.some((m) => m.includes("bare `this.supabase.from('elections')`")),
    `${VIOLATION_FIXTURE} did not produce the check-1 forbidden-table violation`
  );
  expect(
    violationMessages.some((m) => m.includes('non-literal argument')),
    `${VIOLATION_FIXTURE} did not produce the check-3 non-literal-argument violation`
  );
  expect(
    violationMessages.some((m) => m.includes('has no disposition in PROJECT_SCOPED_RPCS')),
    `${VIOLATION_FIXTURE} did not produce the check-4 undispositioned-rpc violation`
  );
  // The two OPTIONAL-CHAINED shapes, pinned by the distinctive literal each carries rather than by
  // the check they belong to. Their plain-dot siblings above produce the same message text, so an
  // expectation naming only the check would be satisfied by the sibling alone and would say nothing
  // about whether the optional spelling is reached at all.
  expect(
    violationMessages.some((m) => m.includes("bare `this.supabase.from('candidates')`")),
    `${VIOLATION_FIXTURE} did not produce the check-1 forbidden-table violation for the optional-chained access`
  );
  expect(
    violationMessages.some((m) => m.includes("rpc 'also_not_declared_anywhere'")),
    `${VIOLATION_FIXTURE} did not produce the check-4 undispositioned-rpc violation for the optional-chained call`
  );
  // One operator POSITION each, pinned by the distinctive table literal the shape carries. A
  // literal-bearing message needs no exact count, because the literal belongs to exactly one shape —
  // which is the opposite of the schema-hop and computed-access messages below, whose exactness is
  // the only thing that says a second spelling is reached at all.
  expect(
    violationMessages.some((m) => m.includes("bare `this.supabase.from('constituencies')`")),
    `${VIOLATION_FIXTURE} did not produce the check-1 forbidden-table violation for the optional-CALL punctuator`
  );
  expect(
    violationMessages.some((m) => m.includes("bare `this.supabase.from('factions')`")),
    `${VIOLATION_FIXTURE} did not produce the check-1 forbidden-table violation for the optional operator at the ` +
      'receiver position'
  );
  expect(
    violationMessages.some((m) => m.includes("bare `this.supabase.from('feedback')`")),
    `${VIOLATION_FIXTURE} did not produce the check-1 forbidden-table violation for the optional operator at an ` +
      'intervening chain link'
  );
  // The escape hatches, pinned one by one rather than as an aggregate count. Each was demonstrated to reach a project-scoped table while the guard reported the file clean, so each needs its own expectation: a total that happens to add up would not say WHICH of them is still covered.
  //
  // The alias count and the destructure count are EXACT, and together they are a FOUR-way
  // discriminator on the binding rule's trailing lookahead — the strongest single assertion in this
  // file. The violation fixture holds FIVE binding shapes the rule must report — a plain alias, a
  // nullish-coalesced one, one bound through the optional operator at the receiver position, a
  // SUB-OBJECT alias and a bound scalar member — plus FOUR destructures: one off the client, one off
  // its `functions` member, one WRAPPED across lines and one NESTED, beside two table accesses bound
  // to locals which it must NOT report.
  // Every candidate lookahead reads that set differently, and all four readings were measured rather
  // than reasoned about: with NO trailing lookahead it reads 7 and 2, because both optional-chained
  // accesses are mistaken for aliases; with a bare `?` added to a character class it reads 2 and 1,
  // because `??` begins with the same character and the `.` in that class also excludes every
  // binding one link along the chain; with the NARROW lookahead this rule carried until the
  // receiver-depth axis was closed it reads 3 and 1, because a sub-object binding is excluded
  // alongside the access it was written to exclude; and only the committed form — which excludes an
  // initialiser whose chain TERMINATES IN A CALL — reads 5 and 2. The numbers moved when the
  // promotion landed, and a comment left stating the old ones would let a regression to any of the
  // three wrong candidates look expected.
  //
  // The two counts are pinned SEPARATELY rather than pooled, and that separation is what keeps the
  // two halves of the receiver-depth finding measured apart: `const fns = this.supabase.functions;`
  // is an alias and `const { invoke } = this.supabase.functions;` is a destructure, so a change that
  // moved one into the other's family would leave a pooled total intact and fail here by name.
  //
  // That separation only says something while the CLASSIFIER is right, and it was not. It read the
  // text before the `=` on the match's own LINE, so a destructure a formatter had wrapped presented
  // only `} ` and was counted as an alias, and a NESTED pattern was rejected by a character class
  // that cannot cross a brace. Every fixture shape was single-line, so the two counts agreed with a
  // classifier that was wrong about both — a formatting change at a live site would have moved one
  // family into the other with the pooled sum intact and nothing failing. `bindsByDestructuring`
  // decides by brace balance across the statement, and the two shapes are committed, so the SCOPE of
  // that decision is now held down by these counts rather than by the shape of the fixtures.
  const aliasCount = countIn(violationMessages, 'aliases the raw client');
  const destructureCount = countIn(violationMessages, 'destructures the raw client');
  expect(
    aliasCount === 5,
    `${VIOLATION_FIXTURE} produced ${aliasCount} check-6 aliased-client violation(s), expected exactly 5 ` +
      '(the plain alias, the nullish-coalesced one, the optional-receiver one, the sub-object one and the ' +
      'bound scalar member)'
  );
  expect(
    destructureCount === 4,
    `${VIOLATION_FIXTURE} produced ${destructureCount} check-6 destructured-client violation(s), expected ` +
      'exactly 4 (the method off the client, the method off its `functions` member, the same pattern WRAPPED ' +
      'across lines, and a NESTED pattern)'
  );
  // The OWNER family, pinned separately from the two above for the reason they are pinned separately
  // from each other: a pooled escape-hatch total is satisfied by a regression that takes one site out
  // of the owner family and puts another into the alias family, and these three assertions are not.
  // Both halves are named, because the two shapes fail differently — reverting the trailing lookahead
  // to admit a following member access turns the near-miss scalar read in the clean fixture into a
  // false positive there, while dropping the rule entirely takes BOTH counts here to zero and moves
  // no other family, which is what makes each shape load-bearing rather than merely present.
  const ownerAliasCount = countIn(violationMessages, "binds the client's owner");
  const ownerDestructureCount = countIn(violationMessages, "destructures the client out of the client's owner");
  expect(
    ownerAliasCount === 2,
    `${VIOLATION_FIXTURE} produced ${ownerAliasCount} check-6 owner-binding violation(s), expected exactly 2 ` +
      '(the plain `const self = this` and the non-null-asserted `const self = this!`, which is the ' +
      'half of CR-05 this rule closes — widen the `!` exclusion back to the bare character and this ' +
      'count drops rather than leaving a pooled total intact. The nullish-coalesced owner is the ' +
      'half NOT closed, and is a stated residual rather than a committed shape)'
  );
  expect(
    ownerDestructureCount === 1,
    `${VIOLATION_FIXTURE} produced ${ownerDestructureCount} check-6 owner-destructure violation(s), expected ` +
      'exactly 1 (`const { supabase } = this`, after which the table read carries no receiver at all)'
  );
  // Exact rather than `some(...)`, because the guard's computed-access message names no member and
  // no table: the committed shapes are indistinguishable in the output, so only their number says
  // whether each spelling is reached. A `some(...)` here would go on passing on the plain-dot shape
  // alone. The five are the two directly on the client — plain and optional — the two at a CHAINED
  // link, which is the same escape one link further along than this rule used to look, and the
  // computed `invoke` key on the client's `functions` member, which this rule reaches as a chained
  // computed member and check 7 reaches as an invocation. That last one is the ADJACENCY: two rules,
  // one line, two families, neither suppressing the other.
  const computedCount = countIn(violationMessages, 'computed member access');
  expect(
    computedCount === 6,
    `${VIOLATION_FIXTURE} produced ${computedCount} check-6 computed-access violation(s), expected exactly 6 ` +
      '(directly on the client and at a chained link, in both optional spellings and the NON-NULL one, plus ' +
      'the computed invocation key)'
  );
  // The computed access to the client FIELD, pinned by its own exact count for the same reason: its
  // message names neither the key nor the member that follows it, so the two committed shapes are
  // indistinguishable and only their number says the optional spelling of the computed punctuator is
  // reached.
  const computedReceiverCount = countIn(violationMessages, 'computed access to the client field');
  expect(
    computedReceiverCount === 2,
    `${VIOLATION_FIXTURE} produced ${computedReceiverCount} check-6 computed-client-field violation(s), ` +
      'expected exactly 2 (the plain spelling and the optional one)'
  );
  // The two invocation shapes, pinned separately for the same reason the escape hatches are: one asks
  // whether the function is dispositioned at all, the other whether the call keeps the disposition's
  // promise, and a single expectation satisfied by either would not say which of the two still fires.
  expect(
    violationMessages.some((m) => m.includes('has no disposition in PROJECT_SCOPED_EDGE_FUNCTIONS')),
    `${VIOLATION_FIXTURE} did not produce the check-7 undispositioned-invocation violation`
  );
  expect(
    violationMessages.some((m) => m.includes('is invoked without a project term')),
    `${VIOLATION_FIXTURE} did not produce the check-7 missing-project-term violation`
  );
  expect(
    violationMessages.some((m) => m.includes("Edge Function 'also_not_dispositioned_anywhere'")),
    `${VIOLATION_FIXTURE} did not produce the check-7 undispositioned-invocation violation for the ` +
      'optional-chained call'
  );
  expect(
    violationMessages.some((m) => m.includes("Edge Function 'one_more_undispositioned'")),
    `${VIOLATION_FIXTURE} did not produce the check-7 undispositioned-invocation violation for the ` +
      'optional-CALL punctuator'
  );
  // The ADJACENCY, asserted from check 7's side. This message names neither the key nor the function,
  // so only its NUMBER says the computed-invocation rule fired here at all — and its being ONE beside
  // the check-6 count of five above is what says the two rules SEPARATED on that single line rather
  // than one of them swallowing the other.
  const adapterComputedInvokeCount = countIn(violationMessages, "computed member on the client's `functions` object");
  expect(
    adapterComputedInvokeCount === 1,
    `${VIOLATION_FIXTURE} produced ${adapterComputedInvokeCount} check-7 computed-invocation violation(s), ` +
      'expected exactly 1 (the one adapter-corpus shape, which check 6 also reports and counts separately)'
  );
  // Exact for the same reason the computed-access count is, and more so now that there are five of
  // them: the schema-hop message names neither the schema, the table nor the receiver, so every
  // committed shape is indistinguishable from every other in the output and only their NUMBER says
  // the newer spellings are reached at all. A `some(...)` here would go on passing on the
  // plain-dot shape alone. The five are the plain hop, the optional operator at the chain-to-schema
  // position, at the receiver position, at an intervening chain link, and the optional-CALL
  // punctuator on the schema call itself — one per position the matcher declares.
  const schemaHopCount = countIn(violationMessages, 'reaches a table through a schema call');
  expect(
    schemaHopCount === 6,
    `${VIOLATION_FIXTURE} produced ${schemaHopCount} check-8 schema-hop violation(s), expected exactly 6 ` +
      '(one per punctuator-and-position the matcher declares)'
  );
  expect(
    cleanMessages.length === 0,
    `${CLEAN_FIXTURE} produced ${cleanMessages.length} violation(s): ${cleanMessages.join(' | ')}`
  );

  // The outside pair, exercised exactly as the guarded-source pair above is. The two boundary shapes
  // are pinned separately rather than by an aggregate: a table read and an rpc call reach a table by
  // different routes, and one expectation satisfied by either would not say which of the two still
  // fires. The counts are exact for the same reason they are exact above — each outside fixture
  // carries shapes that must NOT be counted (two storage buckets and an adapter-surface call in the
  // clean one), so a number one higher than expected means a bucket was read as a table and a zero
  // means nothing was checked. The violating fixture's eleven are the boundary matcher's six — a
  // table read and an rpc call at each of the three punctuator-and-position cells that matcher
  // declares — plus FIVE computed Edge Function invocations, at the address the invocation check was
  // unanchored to reach and where nothing read those spellings before. The five are three on the
  // `invoke` key (plain, optional-member and optional-call) and two on the `functions` key (quoted
  // and backticked). It is not a partition of the boundary matcher's cells and is not claimed as one.
  // The clean fixture's two are its two dispositioned invocations, and its THIRD bucket — the
  // optional-CALL one — is deliberately not among them, which is what makes that shape a control
  // rather than a count; its two computed near misses are controls for the same reason.
  expect(
    outsideViolationCount === 13,
    `${OUTSIDE_VIOLATION_FIXTURE} yielded ${outsideViolationCount} site(s), expected exactly 13`
  );
  expect(
    outsideCleanCount === 2,
    `${OUTSIDE_CLEAN_FIXTURE} yielded ${outsideCleanCount} site(s), expected exactly 2 (the bucket accesses must be excluded)`
  );
  // Exact per shape rather than `some(...)`, because every punctuator spelling is now among them and
  // the boundary message names the method but not the receiver: a `some(...)` cannot tell a tripled
  // shape from a single one, so it would go on passing if the widening reached only one of the three.
  const boundaryFromCount = countIn(outsideViolationMessages, '`from(` on a Supabase client outside');
  const boundaryRpcCount = countIn(outsideViolationMessages, '`rpc(` on a Supabase client outside');
  expect(
    boundaryFromCount === 4,
    `${OUTSIDE_VIOLATION_FIXTURE} produced ${boundaryFromCount} check-9 boundary violation(s) for a table ` +
      'read, expected exactly 4 (one per punctuator-and-position the matcher declares)'
  );
  expect(
    boundaryRpcCount === 3,
    `${OUTSIDE_VIOLATION_FIXTURE} produced ${boundaryRpcCount} check-9 boundary violation(s) for an rpc ` +
      'call, expected exactly 3 (one per punctuator-and-position the matcher declares)'
  );
  // The two computed-invocation rules at the boundary address, each pinned by its own exact count.
  // Exactness rather than `some(...)` for the reason every sibling count in this file gives: these
  // messages name neither the key nor the function, so the committed shapes are indistinguishable in
  // the output and only their NUMBER says each spelling is reached. A `some(...)` would go on passing
  // on the plain-dot shape alone, which is precisely the state a widening most easily leaves behind.
  const outsideComputedInvokeCount = countIn(
    outsideViolationMessages,
    "computed member on the client's `functions` object"
  );
  const outsideComputedFunctionsCount = countIn(
    outsideViolationMessages,
    "computed access to the client's `functions` member"
  );
  expect(
    outsideComputedInvokeCount === 3,
    `${OUTSIDE_VIOLATION_FIXTURE} produced ${outsideComputedInvokeCount} check-7 computed-invocation ` +
      'violation(s), expected exactly 3 (the computed `invoke` key spelled plain, with the optional member ' +
      'punctuator, and with the optional-CALL punctuator)'
  );
  expect(
    outsideComputedFunctionsCount === 2,
    `${OUTSIDE_VIOLATION_FIXTURE} produced ${outsideComputedFunctionsCount} check-7 computed-\`functions\` ` +
      'violation(s), expected exactly 2 (the quoted spelling of the key and the backticked one)'
  );
  expect(
    outsideCleanMessages.length === 0,
    `${OUTSIDE_CLEAN_FIXTURE} produced ${outsideCleanMessages.length} violation(s): ${outsideCleanMessages.join(' | ')}`
  );

  const summary =
    `self-test flagged ${violationMessages.length} line(s) in ${VIOLATION_FIXTURE} (${violationCount} ` +
    `access(es)) and ${cleanMessages.length} in ${CLEAN_FIXTURE} (${cleanCount} access(es)), plus ` +
    `${outsideViolationMessages.length} line(s) in ${OUTSIDE_VIOLATION_FIXTURE} (${outsideViolationCount} ` +
    `site(s)) and ${outsideCleanMessages.length} in ${OUTSIDE_CLEAN_FIXTURE} (${outsideCleanCount} site(s)), ` +
    `${failed === 0 ? 'matching the committed expectation' : `${failed} expectation(s) FAILED`}.`;
  return { passed: failed === 0, summary };
}

/**
 * Every adapter source the completeness check considers: `.ts` files under the adapter directory,
 * excluding tests, type-only modules and barrels, none of which reach the database.
 *
 * `utils/` USED TO BE A FOURTH EXCLUSION, and it was the hole this walk's own check could not see.
 * The subtree was skipped here, and `enumerateFrontendSourcesOutsideAdapter` skips everything whose
 * path starts with `${ADAPTER_DIR}/` — which includes it — so
 * `apps/frontend/src/lib/api/adapters/supabase/utils/**` was walked by NEITHER corpus. Check 5's
 * "a source in neither list is a source nobody decided about" could not fire for it, because check 5
 * iterates the output of THIS function and the exclusion was applied inside it: the check read a
 * list the exclusion had already emptied. A probe file dropped there containing
 * `this.supabase.from('elections')`, a raw `client.from('elections')` and an undispositioned Edge
 * Function invocation produced zero violations, zero added counts, every summary number
 * byte-identical, and was not even reported as an undeclared adapter source.
 *
 * The subtree is now walked as part of the adapter corpus, which is the correct half of the two: it
 * is inside `ADAPTER_DIR`, so it is exactly where a client handed to a helper lands, and the rule
 * that applies to it is the adapter's strict one rather than the boundary's. The seven helpers are
 * declared in `GUARDED_SOURCES` and reach no client, so no count moved but the on-disk and guarded
 * totals.
 *
 * The EXHAUSTIVENESS of the two-corpus partition is not asserted here, because a walk cannot audit
 * its own exclusions — that is the whole failure above. It is asserted from outside, in
 * `packages/dev-seed/tests/projectScopingGate.test.ts`, which walks the frontend source tree once
 * and requires the union of the two corpora to equal it minus a written exclusion predicate. That is
 * what makes the two derivations independent statements rather than two copies of one blind spot.
 * @returns The relative paths, sorted.
 */
function enumerateAdapterSources() {
  const found = [];
  const walk = (relDir) => {
    for (const entry of readdirSync(path.resolve(REPO_ROOT, relDir)).sort()) {
      const relPath = `${relDir}/${entry}`;
      if (statSync(path.resolve(REPO_ROOT, relPath)).isDirectory()) {
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
 * Every frontend source the boundary check considers: `.ts` and `.svelte` files under the frontend
 * source tree that are not under the adapter directory.
 *
 * The exclusions carry a reason each, because an exclusion list is where coverage quietly leaves.
 * The adapter directory is excluded because it has its own, stricter corpus above — a file cannot be
 * in both, and the rule that applies to it there is not the rule that applies out here. Tests and
 * specs are excluded because they never run in production, and because a test's whole job is to
 * spell shapes production must not: a mock client reached with `.from('elections')` is a correct
 * test, not a leak. Type-only modules and ambient declarations are excluded because they emit no
 * runtime code at all, so neither can issue a call. And `.js` / `.mjs` are excluded because every
 * one of them under this tree is generated Paraglide message output — which was the one exclusion
 * here carrying NO reason, in a docblock whose own sentence says an exclusion list is where coverage
 * quietly leaves. It is now stated in the module docblock's residual list AND measured in the gate
 * spec, so a hand-authored `.js` arriving under this tree is a named failure rather than a file
 * nobody walks.
 * @returns The relative paths, sorted.
 */
function enumerateFrontendSourcesOutsideAdapter() {
  const found = [];
  const walk = (relDir) => {
    for (const entry of readdirSync(path.resolve(REPO_ROOT, relDir)).sort()) {
      const relPath = `${relDir}/${entry}`;
      if (statSync(path.resolve(REPO_ROOT, relPath)).isDirectory()) {
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

function main() {
  if (process.argv.includes('--self-test')) {
    // Kept as a direct entry point for a reader debugging the fixtures. It is no longer the only path that proves anything: the ordinary invocation below runs the same check.
    const { passed, summary } = selfTest();
    console.log(`Project-scoped query guard — ${summary}`);
    process.exitCode = passed ? 0 : 1;
    return;
  }

  let violations = 0;
  const violate = (message) => {
    violations++;
    console.error(`[ERROR] ${SELF}: ${message}`);
  };

  // --- Check 5: source-set completeness, run first because it bounds what the others saw ---
  const declared = new Map();
  for (const file of GUARDED_SOURCES) declared.set(file, 'GUARDED_SOURCES');
  for (const { file } of DEFERRED_SOURCES) {
    if (declared.has(file)) {
      violate(`'${file}' is declared in both GUARDED_SOURCES and DEFERRED_SOURCES. It belongs to exactly one.`);
      continue;
    }
    declared.set(file, 'DEFERRED_SOURCES');
  }

  let onDisk;
  try {
    onDisk = enumerateAdapterSources();
  } catch (error) {
    console.error(
      `[ERROR] ${SELF}: could not enumerate '${ADAPTER_DIR}' (${error.message}). ` +
        'Without the enumeration this guard cannot know what it failed to check, so this fails closed.'
    );
    process.exitCode = 1;
    return;
  }

  if (onDisk.length === 0) {
    console.error(
      `[ERROR] ${SELF}: '${ADAPTER_DIR}' yielded no adapter sources. An empty corpus reports zero ` +
        'violations forever, which is indistinguishable from a clean tree, so it is a failure.'
    );
    process.exitCode = 1;
    return;
  }

  for (const file of onDisk) {
    if (!declared.has(file)) {
      violate(
        `'${file}' issues adapter calls but is in neither GUARDED_SOURCES nor DEFERRED_SOURCES in ${SELF}. ` +
          'A source in neither list is a source nobody decided about; add it to one, with a reason if it is ' +
          'deferred.'
      );
    }
  }
  for (const [file, list] of declared) {
    if (!onDisk.includes(file)) {
      violate(
        `'${file}' is declared in ${list} but does not exist on disk. A stale declaration silently reduces ` +
          'coverage, so it is a failure rather than a no-op.'
      );
    }
  }

  // --- Checks 1 to 4 and 6 to 8 over the guarded sources ---
  let examined = 0;
  const tally = { accesses: 0, escapeHatches: 0, invocations: 0, schemaHops: 0 };
  for (const file of GUARDED_SOURCES) {
    const text = readSource(file);
    if (text === null) {
      process.exitCode = 1;
      return;
    }
    examined += checkSource(file, text, violate, tally);
  }

  // --- Check 9 and check 7 over the frontend sources OUTSIDE the adapter directory ---
  //
  // The corpus the guard could not see at all until it was walked: a query issued from anywhere else under the frontend source tree was outside every check above by construction, and one live Edge Function invocation already sat out here.
  let outsideSources;
  try {
    outsideSources = enumerateFrontendSourcesOutsideAdapter();
  } catch (error) {
    console.error(
      `[ERROR] ${SELF}: could not enumerate '${FRONTEND_SRC_DIR}' (${error.message}). ` +
        'Without the enumeration this guard cannot know what it failed to check, so this fails closed.'
    );
    process.exitCode = 1;
    return;
  }

  // The floor for the widened corpus sits on the ENUMERATION rather than on the call sites it finds, and the difference is the whole point. A floor on outside call sites would assert that there must always be at least one Supabase call outside the adapter directory, which is the opposite of what this boundary says: the correct long-run number out here is ZERO, and a correct tree would go red. A floor on the enumeration asserts something true instead — the walker must find files — which is the failure the adapter corpus's own empty-list check exists for, reproduced for a corpus large enough that nobody would notice it emptying.
  if (outsideSources.length === 0) {
    console.error(
      `[ERROR] ${SELF}: the walk of '${FRONTEND_SRC_DIR}' yielded no sources outside '${ADAPTER_DIR}'. An empty ` +
        'corpus reports zero violations forever, which is indistinguishable from a clean tree, so it is a failure.'
    );
    process.exitCode = 1;
    return;
  }

  let outsideExamined = 0;
  for (const file of outsideSources) {
    const text = readSource(file);
    if (text === null) {
      process.exitCode = 1;
      return;
    }
    outsideExamined += checkOutsideSource(file, text, violate);
  }

  // --- The non-vacuity floor -------------------------------------------------
  //
  // A matcher that matches nothing reports zero violations forever, and zero violations is exactly what a correctly converted tree also reports. Without this, a plain rename of the mixin's `supabase` accessor — an ordinary refactor nobody would think to re-check — reduces this guard to an instrument that examines nothing and still prints a clean bill.
  //
  // It is a FLOOR and not an expected count, deliberately. An exact count reddens on every legitimate refactor that adds or removes a call site, which teaches the reader to update the number without reading it, and a guard nobody reads is a formality. The precision comes from the self-test below instead: its fixture expectations ARE exact, and they only change when somebody means to change them.
  //
  // The floor reads the DOT-ACCESS family rather than the grand total, and that is a correction rather than a refinement. Each check counts its own finds into the total so that no shape is invisible to the floor, but a total pooled across families lets one family hold the floor up for another: with the invocation check counting two live sites, a dead `ACCESS_RE` left the total at two and the floor stayed silent on a table matcher that had stopped matching. Measured against the committed reproduction, which is precisely that mutation. A per-family floor is strictly stronger than the pooled one it replaces — every state the old floor caught, this catches, plus the masked ones.
  if (tally.accesses === 0) {
    violate(
      `no raw client call sites were examined across ${GUARDED_SOURCES.length} guarded source(s) ` +
        `(${examined - tally.accesses} site(s) of other kinds were). A matcher that matches nothing reports ` +
        'zero violations forever, so an empty call-site corpus is a failure rather than a clean bill. Check ' +
        'ACCESS_RE against the receiver spelling the adapter actually uses.'
    );
  }

  // --- The self-test, in this same invocation ---------------------------------
  //
  // Every guarded source reaches its tables through the scoped helper, so the real corpus above yields zero forbidden sites by design. The fixtures are what make this guard's own firing observable, and they run HERE — in the spelling `lint:check` calls — so there is no second command to remember and none to drop.
  const { passed: selfTestPassed, summary: selfTestSummary } = selfTest();
  if (!selfTestPassed) {
    violate(
      'the self-test did not match its committed expectations (the failing expectations are printed above). ' +
        'The clean result over the real corpus says nothing until this passes: a guard that has never been ' +
        'seen to fire has not been shown to guard anything.'
    );
  }

  console.log(
    `Project-scoped query guard — ${GUARDED_SOURCES.length} guarded source(s), ${DEFERRED_SOURCES.length} ` +
      `deferred, ${onDisk.length} adapter source(s) on disk, ${tally.accesses} raw client call(s) examined, ` +
      `${tally.invocations} Edge Function invocation(s), ${examined} client-touching site(s) in all, ` +
      `${outsideSources.length} source(s) outside the adapter directory walked, ${outsideExamined} outside ` +
      `site(s) examined, ${violations} violation(s); ${selfTestSummary}`
  );
  process.exitCode = violations > 0 ? 1 : 0;
}

main();
