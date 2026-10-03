#!/usr/bin/env node

/**
 * PROJECT-SCOPED QUERY GUARD.
 *
 * Every table carrying a `project_id` foreign key to `public.projects` holds rows for more than
 * one project. A query against such a table that does not name its project does not fail: it
 * succeeds and returns another project's rows. This guard makes that failure loud at the call site.
 *
 * The predicate is inverted. Rather than assert that every `.from(<scoped table>)` chain contains an
 * `.eq('project_id', …)`, it forbids the raw call shape outright: no bare
 * `this.supabase.from(<declared scoped table>)` and no bare `this.supabase.rpc(<declared scoped
 * rpc>)` in a guarded adapter source. The declared scoped helper is used instead. Four call shapes
 * defeat the literal predicate: builders bound with `let` and reassigned across `if` statements, a
 * union-typed dynamic table argument, a select whose filter is applied several statements later, and
 * bucket accesses that are not table accesses at all. The inversion also covers the read path: a new
 * unscoped `.from('elections')` is a violation whether or not `project_id` appears elsewhere in the
 * file.
 *
 * REACH. Checks 1 to 8 run over the adapter sources, including the `utils/` subtree, which is where
 * every project-scoped query is supposed to live. Check 9 runs over every other `.ts` and `.svelte`
 * source under the frontend tree and asserts that all project-scoped table and rpc access lives
 * under the adapter directory. The Edge Function check runs over both corpora, because it decides
 * everything from the function-name literal and one live invocation is a route handler. Both walks
 * fail closed when they find no files. That the two corpora partition the frontend tree is asserted
 * from outside the guard, in the gate spec, because a walk cannot audit its own exclusions.
 *
 * ACCESS PUNCTUATORS. Every punctuator position a matcher admits is held in place by a committed
 * fixture shape: `packages/dev-seed/tests/projectScopingGate.test.ts` reverts each admitted position
 * to its plain form on its own and requires the self-test to break. A position a matcher anchors
 * nothing to the left of cannot be load-bearing, because the match simply begins further along;
 * those positions are listed in `REDUNDANT_CELLS` in the same spec, where their mutants are asserted
 * to stay green. The spec also generates every punctuator at every operator position of each
 * matcher's canonical call shape and requires a written disposition per cell.
 *
 * STATED RESIDUALS. Each phrase below is pinned by the assertion that measures it, so a residual
 * cannot be stated here without a measurement, nor measured without being stated:
 *   - an interposed comment is not trivia the matchers admit, so a receiver and a member separated
 *     by a block comment are unmatched in both corpora
 *   - the owner rule's `?` exclusion is a bare character, so `const self = this ?? other;` — a
 *     nullish coalesce that binds the owner whenever it is non-null — is UNREPORTED, as its
 *     client-level twin `nullishCoalescedClient` would be under the same spelling. Reporting it
 *     means narrowing the exclusion to a `?` not followed by a second `?`, which makes the lookahead
 *     an admitted punctuator position needing a `MATCHER_NAMES` entry and a disposition matrix
 *   - the owner rule reads a binding of `this` at an `=`, so an owner reached by any other
 *     expression is unread: a spread, an `Object.assign`, an arrow that returns it, a `for…of`
 *     over an array holding it, an array destructure of that array, and a getter returning it. No
 *     live site uses any of these
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
 *     declared, so a plain member read bound to a local is reported as an alias, and the message is
 *     then a false statement about what was bound; a `CLIENT_SUB_OBJECTS` map would separate the
 *     two at the cost of a written disposition per client member
 *   - the table and rpc matchers are anchored on the receiver spelling and the binding rule needs a
 *     leading `=`, so a client held in a PARAMETER is read by neither: a guarded source may hand the
 *     client to a function that issues arbitrary unscoped queries, uncounted. The live instance is
 *     `tableBuilder` in `supabaseAdapter.ts`, the one raw table call in the guarded corpus; its
 *     single caller `scopedFrom` appends the project filter, so it is unread rather than unsafe
 *   - the boundary walk reads only the TypeScript and Svelte extensions, so a .js or .mjs source
 *     under the frontend source tree is in neither corpus; every such file is generated Paraglide
 *     output, which the gate spec measures, so a hand-authored one is a named failure
 *   - a receiver wrapped in PARENTHESES is unread by every matcher here, because a parenthesis is
 *     part of the receiver's expression grammar rather than a punctuator, and this guard does not
 *     widen the receiver; there is no live instance, and the matchers are measured against the shape
 *
 * The residual notes at the escape-hatch and boundary rules refer to this list rather than carrying
 * counts of their own.
 *
 * The checks, each a distinct route by which an unscoped query could reach production:
 *
 *   Check 1 — Forbidden table shape. A `this.supabase.from('<declared scoped table>')` in a
 *     guarded source is a violation naming file, line and table. `this.supabase.storage.from(…)`
 *     is a bucket, not a table, and is excluded structurally rather than by a name list.
 *   Check 2 — Undeclared table literal. A table literal in neither declared list is a hard
 *     failure, so a table cannot enter the adapter without a written disposition.
 *   Check 3 — Non-literal argument. A `from(` or `rpc(` whose argument is not a string literal
 *     is a hard failure: a site the guard cannot parse is a site it cannot cover.
 *   Check 4 — RPC disposition. A static guard cannot see inside an rpc body, so every rpc a
 *     guarded source calls carries a written disposition. An rpc dispositioned
 *     `requires p_project_id` must be called with a `p_project_id` key.
 *   Check 5 — Source-set completeness. Every adapter source is in exactly one of the two declared
 *     lists, and every declared entry exists on disk.
 *   Check 6 — Escape hatches. A guarded source may not bind the client, or any node on its member
 *     chain, to a local; destructure a method off either; reach a member by computed key, directly
 *     or one link along the chain; reach the client field by a bracketed key; or bind the client's
 *     owner at an `=`. Each reaches the client past the receiver anchor checks 1 to 4 depend on, so
 *     each is forbidden outright rather than chased with a wider receiver pattern (see
 *     `CLIENT_BINDING_RE`). The binding rule excludes an initialiser whose chain terminates in a
 *     call, so `this.supabase?.from(…)` is reported once, by check 1, and not again as an alias.
 *   Check 7 — Edge Function disposition. An invocation runs server-side code no source guard can
 *     read, so every Edge Function invoked carries a written disposition and the call is held to
 *     it. The member name is read in its dot and computed spellings, over both corpora. A computed
 *     key names a function the guard cannot read, so that site is reported, as check 3 reports a
 *     table argument it cannot parse.
 *   Check 8 — Schema hop. A guarded source may not reach a table through `.schema(…).from(…)`. The
 *     mid-chain call stops the receiver-anchored table matcher, so the access would be uncounted.
 *     See `SCHEMA_HOP_RE`.
 *   Check 9 — The boundary. A table or rpc reached on a Supabase client anywhere under the frontend
 *     source tree outside the adapter directory is a violation, because checks 1 to 4 do not run
 *     there and there is no scoped helper to route it through.
 *
 * SELF-PROOF ON EVERY RUN. The real corpus yields zero forbidden table sites by design, so a bare
 * violation count cannot tell "checked and clean" from "checked nothing". Two mechanisms close that
 * gap, and both run in the ordinary invocation that `lint:check` calls:
 *
 *   - The self-test runs every per-source check over two committed fixture pairs, one for the
 *     adapter corpus and one for the corpus outside it (the same call can be legitimate at one
 *     address and a violation at the other), and asserts that each violating fixture reports the
 *     exact expected shapes and neither clean one reports any. Its outcome is appended to the
 *     summary line. `--self-test` runs it on its own.
 *   - A non-vacuity floor fails the run when no raw client call was examined. A floor, not an exact
 *     count: an exact count reddens on every legitimate refactor. The fixtures supply the precision.
 *
 * WHY NOT ROW-LEVEL SECURITY. RLS returns empty results rather than failing, so an unparameterised
 * query is silently wrong exactly where it needs to be loud. RLS stays as defence in depth and does
 * not discharge this guard.
 *
 * WHY A REGEX READ RATHER THAN AN AST PARSE. The assertion is about a source spelling in one
 * hand-authored directory, and this matches the sibling `assert-*.mjs` scripts: Node built-ins only,
 * no build step, exit 1 naming the specific problem. Comment spans are excluded through the
 * repository's shared classifier, so a docblock that quotes a forbidden shape is not read as one.
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
 * These are the public-schema tables with no `project_id` column, so there is no project to name.
 * A table literal in neither list is a hard failure by check 2, so a new table has to acquire a
 * written disposition before the adapter can reach it.
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
 * A static source guard cannot see inside an rpc body, so an rpc's scoping is a written claim.
 * `requires p_project_id` means the call must pass a `p_project_id` key, which check 4 asserts.
 * `scoped-by-identity: …` means the function derives its scope from the caller's identity or from a
 * row id it is given, and names which. `UNSCOPED: …` would mean the body carries no project term and
 * returns every project's rows; no entry has it. A disposition that overstates a function's scoping
 * is worse than none, because it hides the leak from the next reader.
 *
 * `get_nominations` and `get_questions` take a required `p_project_id` with no default, declared in
 * `apps/supabase/supabase/schema/503-entity-rpcs.sql` and `505-question-rpcs.sql`.
 *
 * `project_open_for_voters` returns only whether the project is open, for the id the adapter already
 * holds, and the adapter asks it only when the caller can read no `app_settings` row. It takes the
 * project as a required argument, so it is held to check 4.
 *
 * `user_can` returns only a boolean about the caller's own grants claim, and the admin writer asks it
 * of the adapter's own project. Its target argument is `p_target_id`, not `p_project_id`, so it is
 * dispositioned by identity rather than held to check 4's key test.
 */
const PROJECT_SCOPED_RPCS = {
  get_nominations: 'requires p_project_id',
  get_questions: 'requires p_project_id',
  get_candidate_user_data: 'requires p_project_id',
  upsert_answers: 'scoped-by-identity: entity type + entity id + RLS',
  merge_question_custom_data: 'scoped-by-identity: question id + RLS',
  project_open_for_voters: 'requires p_project_id',
  user_can:
    'scoped-by-identity: the caller JWT grants claim, asked of the target the call names (the adapter passes its own project id)'
};

/**
 * Every Edge Function a guarded source may invoke, mapped to its written disposition.
 *
 * A static source guard cannot see inside an Edge Function body either, so a function's scoping is a
 * written claim. `requires a project term` means the invocation must carry the project it is for:
 * check 7 asserts a `projectId` or `project_id` key in the argument text, because the live call
 * sites use both spellings. `scoped-by-deployment: …` means the function resolves its project from
 * the named deployment variable and refuses a body project term naming any other project, so its
 * payload carries no project term by design.
 *
 * There is no UNSCOPED value: a function whose queries carry no project term is fixed before it is
 * dispositioned. The map is keyed by function name because the disposition belongs to the function,
 * whichever file invokes it.
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
 * allowed to obtain a raw builder, through `tableBuilder`, and a `this.supabase.from(` there would
 * bypass the abstraction rather than implement it.
 *
 * The `utils/` helpers are guarded because they are inside the adapter directory, which is where a
 * client handed to a helper lands. They reach no client, and guarding them keeps it that way. See
 * `enumerateAdapterSources`.
 */
const GUARDED_SOURCES = [
  `${ADAPTER_DIR}/supabaseAdapter.ts`,
  `${ADAPTER_DIR}/dataProvider/supabaseDataProvider.ts`,
  `${ADAPTER_DIR}/dataWriter/supabaseDataWriter.ts`,
  `${ADAPTER_DIR}/adminWriter/supabaseAdminWriter.ts`,
  `${ADAPTER_DIR}/feedbackWriter/supabaseFeedbackWriter.ts`,
  `${ADAPTER_DIR}/utils/bySortOrderThenId.ts`,
  `${ADAPTER_DIR}/utils/convertFilterValue.ts`,
  `${ADAPTER_DIR}/utils/fetchAllRows.ts`,
  `${ADAPTER_DIR}/utils/localizeRow.ts`,
  `${ADAPTER_DIR}/utils/mapRow.ts`,
  `${ADAPTER_DIR}/utils/parseFailureMessages.ts`,
  `${ADAPTER_DIR}/utils/parseJsonbColumn.ts`,
  `${ADAPTER_DIR}/utils/parseOutcome.ts`,
  `${ADAPTER_DIR}/utils/parseStoredCustomization.ts`,
  `${ADAPTER_DIR}/utils/storageUrl.ts`,
  `${ADAPTER_DIR}/utils/toDataObject.ts`
];

/**
 * The declared exception surface: adapter sources deliberately left outside checks 1 to 4, each
 * with the reason it is one.
 *
 * It stays EMPTY. An entry here is a source whose call shapes nobody checks, so one may be added
 * only for a lasting reason: a language or client limitation that makes the scoped helper unusable
 * at a named site, written out in full. An entry recording that a file has not been converted yet is
 * a backlog item, not an exception, and the gate spec in
 * `packages/dev-seed/tests/projectScopingGate.test.ts` fails on one: a temporary reason parked here
 * reads as a decision to the next reader, which is how reduced coverage becomes permanent.
 *
 * Check 5 keeps the two lists exhaustive against the directory, so a source can leave
 * `GUARDED_SOURCES` only by acquiring an entry here.
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
 * It is also comment-aware, which correctness requires. An apostrophe in a comment between two
 * arguments (`the payload's own convention`) is not a string delimiter, but a quote-only scan reads
 * it as one and swallows every bracket up to the next apostrophe in the file, so a disposition would
 * be checked against the wrong text.
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

/** Matches `this.supabase` or `this.#supabase`, any intervening member chain, then `.from(` or `.rpc(`. Every access punctuator TypeScript has is read at every position this pattern contains: `.`, `?.` or `!.` at each member position, and the optional-call or non-null punctuator before the call's parenthesis. The call punctuator is an optional GROUP holding both its characters rather than an optional `?`, because that punctuator puts a dot between the `?` and the `(`. Each position is held in place by a committed fixture shape and an exact self-test count. */
const ACCESS_RE =
  /this\s*[!?]?\.\s*#?supabase((?:\s*[!?]?\.\s*[A-Za-z_$][\w$]*)*?)\s*[!?]?\.\s*(from|rpc)\s*(?:\?\.\s*|!\s*)?\(/g;

/** Matches a leading single- or double-quoted string literal argument. */
const LEADING_LITERAL_RE = /^\s*(['"])([^'"]*)\1\s*(?:,|$)/;

/**
 * Check 6 — the escape hatches, forbidden outright rather than chased.
 *
 * `ACCESS_RE` is anchored on the receiver spelling `this.supabase` / `this.#supabase`. These shapes
 * reach the same client past that anchor: an alias (`const db = this.supabase`), a destructured
 * method (`const { from } = this.supabase`), a computed member (`this.supabase['from']`), a computed
 * member one link along the chain (`this.supabase.rest['from']`), a computed access to the client
 * field itself (`this['supabase'].from`), a binding of a client sub-object
 * (`const fns = this.supabase.functions`), and a binding of the client's owner (`OWNER_BINDING_RE`).
 * They are worse than unchecked: they are uncounted, so check 3 never fires for them either. A bound
 * sub-object also hides Edge Function invocations, because `INVOKE_RE` requires the literal member
 * name `functions` immediately before `invoke`.
 *
 * None of these rules costs a live call site. A repository-wide search finds no bracket-quoted client
 * key and no bracketed access after a client member in the guarded sources, and every live
 * `= this.supabase…` chain in a guarded source terminates in a call, which the binding rule excludes.
 *
 * The binding rule decides from the member name alone, so a plain scalar member bound to a local is
 * reported as an alias. That is a stated residual in the module docblock, committed as the violating
 * fixture shape `boundClientMemberRead`. It is a cost, not an impossibility: the client's sub-object
 * surface is small and closed (`auth`, `functions`, `storage`, `rest`, `realtime`, `schema`), so a
 * `CLIENT_SUB_OBJECTS` disposition map, mandatory on arrival as check 2 is for a table literal, would
 * separate `= this.supabase.functions;` from `= this.supabase.restUrl;` without type information. It
 * is not declared because it would be one more mandatory disposition list, with its own arrival
 * check, fixture shapes and mutation cells. The near-miss control `destructuredCallResult` in
 * `clean.fixture.ts` stays unreported.
 *
 * The two computed rules run over the adapter corpus only, so the same spellings outside the adapter
 * directory are unreported. That corpus-axis limit is also in the module docblock's residual list.
 *
 * WHY PROHIBITION RATHER THAN A WIDER RECEIVER PATTERN. Widening the receiver to any identifier and
 * deciding from the table literal would cover these and invite the next: the receiver is an
 * open-ended expression grammar, and every widening is a guess about which spelling a future author
 * will reach for. A prohibition is decidable by inspection and has no next case. A guarded source has
 * no legitimate need for any of these shapes, because the sanctioned route to a table is the scoped
 * helper; a source that ever needs one is a finding to record and escalate, not an exception to widen
 * quietly.
 *
 * The one hand-off no rule here reads is a parameter: `scopedFrom` passes the raw client to the free
 * function `tableBuilder`.
 *
 *     export function tableBuilder(client: SupabaseClient<Database>, table: TTable) {
 *       return client.from(table);
 *     }
 *
 * It is the one raw `.from(<project-scoped table>)` in the guarded corpus. The binding rule misses it
 * because there is no `=`; `ACCESS_RE` misses it because the receiver is `client`; and
 * `BOUNDARY_ACCESS_RE` misses it both because its receiver must contain `supabase` and because it
 * never runs over the adapter corpus. The gate spec measures both halves of that last point. Every
 * raw client call this guard counts is therefore an `.rpc(`. Closing the gap would mean forbidding
 * the hand-off (a matcher on `<function>(this.supabase`), which reports the live
 * `tableBuilder(this.#supabase, table)` call, so `tableBuilder` would first have to move onto the
 * mixin. The site is not a leak: `scopedFrom` appends `.eq('project_id', projectId)` to the builder it
 * returns. It is a stated residual in the module docblock.
 */
// The trailing lookahead spans the whitespace rather than consuming it. A consuming `\s*` in front of
// a negative lookahead is satisfiable by backtracking: the engine gives the whitespace back, finds a
// newline where it needed a non-dot, and calls the binding bare, which reports a multi-line
// `= await this.supabase\n  .rpc(…)` as an alias. Every `\s*` sits inside the lookahead, spanning the
// gaps of the chain it reads, so the chain crosses newlines.
//
// The lookahead excludes an initialiser whose member chain terminates in a call or in a computed
// access. That tells an optional-chained access, which check 1 reports, from an alias, which only
// this rule reports, and it still reports a binding one link along the chain:
// `const fns = this.supabase.functions;` reaches every table the client does, through a receiver no
// matcher here can see, and `INVOKE_RE` cannot see the `fns.invoke(…)` behind it either.
//
// The self-test's exact alias and destructure counts are what discriminate this lookahead from the
// alternatives (none at all, a `?` in a character class, or one excluding any following member),
// each of which reads the committed shapes differently. The fixture shapes that pin the distinction
// are `nullishCoalescedClient` and `subObjectAliasedClient`.
const CLIENT_BINDING_RE =
  /(?<![=!<>])=\s*(?:await\s+)?this\s*[!?]?\.\s*#?supabase\b(?!(?:\s*[!?]?\.\s*[A-Za-z_$][\w$]*)*\s*(?:\?\.\s*|!\s*)?[([])/g;

/** The computed-member half of check 6: `supabase['from']`, `supabase[method]`, `supabase?.['from']`, `supabase.rest['from']` one link along the chain, and every relative. The chain is the same bare-identifier chain `ACCESS_RE` allows, so a computed member is read at a chained link as well as directly on the client; an index taken on the result of a call is not matched, because a call is not a bare identifier. The optional operator is an optional group holding the whole two-character punctuator rather than an optional `?`: the optional spelling puts a dot between the `?` and the `[`, so a lone `?` would both miss that shape and match a ternary whose test is a Supabase-named identifier. */
const COMPUTED_ACCESS_RE = /\bsupabase(?:\s*[!?]?\.\s*[A-Za-z_$][\w$]*)*\s*(?:\?\.\s*|!\s*)?\[/g;

/** The computed-RECEIVER half of check 6: the client field itself reached by a bracketed string key, `this['supabase']` and `this?.['supabase']`. Its sibling above looks one link too late — it anchors on the identifier `supabase`, which a bracketed key spells inside a string literal, so the receiver reached this way is past every anchor including that one. The optional punctuator is held whole in a group for the reason the sibling's docstring gives. */
const COMPUTED_RECEIVER_RE = /\bthis\s*(?:\?\.\s*|!\s*)?\[\s*(['"])#?supabase\1\s*\]/g;

/**
 * The OWNER half of check 6: a binding of `this` itself, one link earlier than every sibling above.
 *
 * Both shapes it forbids reach every table the client does, and no other family counts them:
 *
 *   const self = this;              then `self.supabase.from('elections')` — `ACCESS_RE` needs the
 *                                   literal `this` before `supabase` and never sees the alias.
 *   const { supabase } = this;      then `supabase.from('elections')` — `CLIENT_BINDING_RE` needs
 *                                   `this.supabase` right of the `=`, and this initialiser is bare
 *                                   `this`, so the destructure is past its anchor too.
 *
 * `BOUNDARY_ACCESS_RE` matches both, but `checkSource` never calls `checkBoundary`, so that matcher
 * never runs over the adapter corpus.
 *
 * WHY A PROHIBITION ON THE OWNER RATHER THAN A WIDER RECEIVER. Chasing the receiver means reading
 * `self.supabase`, then `const b = a;` behind it, then the next spelling: an open-ended grammar in
 * which every widening is a guess (see `CLIENT_BINDING_RE` and `SCHEMA_HOP_RE`). Binding the owner is
 * a closed shape: `this` is a keyword with one spelling, so forbidding it at the `=` closes every
 * alias spelled as a binding of `this` itself.
 *
 * It does not close an owner reached any other way: `[...this]`, `{ ...this }`,
 * `Object.assign({}, this)`, `() => this`, `for (const o of [this])`, `const [o] = [this]`, and a
 * getter returning `this`. That owner-expression grammar is open-ended in the same way, so it is a
 * stated residual in the module docblock, pinned in the gate spec's `RESIDUAL_PHRASES`. No live site
 * uses any of these.
 *
 * The prohibition costs no live call site: the four bare `this` bindings under `apps/frontend/src`
 * (`appContext.svelte.ts`, `trackingService.svelte.ts`, `authContext.svelte.ts`,
 * `dataContext.svelte.ts`) are all outside the adapter directory this rule runs over.
 *
 * The trailing lookahead holds its whitespace inside itself for the backtracking reason recorded at
 * `CLIENT_BINDING_RE`: a consuming `\s*` would let `= this\n  .supabase`, a member access check 1
 * already reports, read as an owner binding. It excludes every punctuator that continues the chain
 * (`.`, `[`, `?.`, and the `!.` of a non-null assertion) and a comparison (`!=`, `!==`). The `!`
 * exclusion is two characters wide, which tells `!.` from `!;`, so `const self = this!;` is
 * reported; its committed violating sibling one link along the chain is `nonNullAssertedTableRead`.
 * The `?` exclusion is a bare character, so it also excludes a ternary on `this` and, as a stated
 * residual, a nullish coalesce such as `this ?? other`, whose client-level sibling is
 * `nullishCoalescedClient`.
 */
const OWNER_BINDING_RE = /(?<![=!<>])=\s*(?:await\s+)?this\b(?!\s*(?:[.?[]|!(?:\.|=)))/g;

/**
 * Whether the binding at `atEquals` is a destructure rather than an alias, decided across the
 * statement rather than across the line.
 *
 * Decided by brace balance: skip the whitespace left of the `=`, require a `}`, and walk back to its
 * match. That spans newlines and nests by construction, so both of these read as destructures:
 *
 *   const {                                   a destructure a formatter has wrapped, whose own
 *     from                                    line holds only `} ` before the `=`
 *   } = this.supabase;
 *
 *   const { a: { from } } = this.supabase;    a nested pattern
 *
 * The self-test pins the alias and destructure counts separately, which only means something while
 * this classifier is right. A function rather than a regex, because balance is not a regular
 * property.
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
 * `ACCESS_RE`'s chain group spans bare identifiers only, so it walks `this.supabase.storage.from(`
 * and stops at `this.supabase.schema('public').from(`: a call in the middle of the chain is not a
 * member name. The table on the far side would be uncounted, so check 3 never fires for it and the
 * non-vacuity floor reads a file full of them as a file with nothing in it.
 *
 * WHY PROHIBITION RATHER THAN A WIDER RECEIVER PATTERN. The reasoning at `CLIENT_BINDING_RE` applies:
 * a prohibition is decidable by inspection and has no next case. A repository-wide search finds no
 * such shape, so the rule costs no live call site. Of the client's own members only the schema call
 * returns an object carrying `from` and `rpc` (`storage` and `functions` are property reads with
 * their own rules, and `auth` reaches no table), so forbidding this one call closes the shape.
 *
 * Widening the operator is not the receiver widening argued against. The receiver is an open-ended
 * grammar; the member-access punctuator set is closed and fixed by the language. That language is
 * TypeScript, so the set is `.`, `?.`, `!.` and their bracket and call forms, not only JavaScript's
 * optional-chaining subset. The gate spec enumerates every punctuator at every operator position each
 * matcher declares, and each cell is either held down by a committed fixture whose disposition
 * depends on it or recorded as a measured exemption. The spec's closed-vocabulary check reads both
 * `?` and `!`, so a new admission spelled with either fails there.
 */
const SCHEMA_HOP_RE =
  /this\s*[!?]?\.\s*#?supabase(?:\s*[!?]?\.\s*[A-Za-z_$][\w$]*)*\s*[!?]?\.\s*schema\s*(?:\?\.\s*|!\s*)?\(/g;

/**
 * Matches `.functions.invoke(` on ANY receiver, with tolerant whitespace around each dot.
 *
 * Deliberately NOT anchored on `this.supabase`, for two reasons. The disposition belongs to the
 * function rather than to the caller, so a matcher keyed on who is calling would have to be told the
 * answer twice. And one live invocation reaches the client through a different receiver, a
 * request-scoped client handed to a route, which a receiver-anchored invocation check would not see.
 *
 * The widening is safe here in a way it would not be for a table access. A table access has to
 * decide from the receiver whether the object is the project-scoped client at all; an invocation is
 * decided entirely from the function-name literal, so the check reads the same over whatever corpus
 * it is handed.
 *
 * Every access punctuator is read at every position this pattern contains. The leading position is
 * widened for consistency with the sibling matchers and cannot be load-bearing, because the pattern
 * is unanchored: a receiver reached with `?.` is already matched from the dot onward. It is a
 * measured exemption in `REDUNDANT_CELLS` in the gate spec. The position between `functions` and
 * `invoke`, and the optional-call punctuator on `invoke`, are each held down by a committed fixture
 * shape and an exact self-test count.
 */
const INVOKE_RE = /[!?]?\.\s*functions\s*[!?]?\.\s*invoke\s*(?:\?\.\s*|!\s*)?\(/g;

/**
 * Matches the `invoke` member reached by a COMPUTED STRING KEY on a `functions` object —
 * `functions['invoke'](`, `functions?.['invoke'](` and `functions['invoke']?.(`.
 *
 * Like `INVOKE_RE` it is deliberately unanchored on its receiver and decides everything from the
 * member-name literal, so it reads the same over whatever corpus it is handed. It is wired into the
 * one per-source check both corpus composers call, so it runs at the boundary address as well as the
 * adapter one. Without it, an Edge Function reached this way would have no disposition checked and
 * would be uncounted by the invocation family, so the non-vacuity floor could not see it go silent.
 *
 * The key must be a string literal, in any of the three spellings JavaScript has for one. A key
 * computed at runtime is unread, which is stated in the module docblock's residual list.
 */
const COMPUTED_INVOKE_RE = /\bfunctions\s*(?:\?\.\s*|!\s*)?\[\s*(['"`])invoke\1\s*\]\s*(?:\?\.\s*|!\s*)?\(/g;

/**
 * Matches the client's `functions` member reached by a COMPUTED STRING KEY — `['functions']`,
 * `?.['functions']`, and the double-quoted and backticked spellings of the same key.
 *
 * It is the half of the computed invocation surface `INVOKE_RE` cannot see: that rule requires the
 * literal member name `functions` immediately before `invoke`, and a bracketed key spells the name
 * inside a string literal, so the invocation behind it is past the one anchor the invocation check
 * depends on. Receiver-unanchored for the reason its two siblings are.
 *
 * Its leading optional-punctuator group is a measured exemption rather than an unproven widening.
 * The pattern anchors nothing to its left, so a receiver reached with `?.` is already matched from
 * the bracket onward and no fixture can make that position load-bearing. The exemption is recorded
 * in `REDUNDANT_CELLS` in `packages/dev-seed/tests/projectScopingGate.test.ts`, where its mutant is
 * asserted to stay green, so a change that ever made the position matter would fail there.
 */
const COMPUTED_FUNCTIONS_RE = /(?:\?\.\s*|!\s*)?\[\s*(['"`])functions\1\s*\]/g;

/**
 * Check 9 — a table or rpc reached from a source OUTSIDE the adapter directory.
 *
 * The receiver is WIDER than `ACCESS_RE`'s, deliberately. Out here the client is not a field of a
 * class: it is a request-scoped object handed to a route handler (`locals.supabase`), a module local,
 * or a named admin client. So the anchor is the client's own identifier (any identifier whose name
 * contains `supabase`) rather than the `this.` that precedes it inside the adapter, followed by the
 * same bare-identifier chain `ACCESS_RE` allows and then the table or rpc call. Every access
 * punctuator is read at every position this pattern contains, as in `ACCESS_RE`: a table reached as
 * `locals.supabase?.from(…)` or `locals.supabase.from?.(…)` is the same finding as
 * `locals.supabase.from(…)`, with the same message. Each position is held down by a committed
 * fixture shape in the outside pair and an exact per-message count.
 *
 * WHY THIS RULE IS A BOUNDARY RATHER THAN THE ADVICE CHECKS 1 TO 4 GIVE. Those checks answer a bare
 * table access with "use the scoped helper", which only a source that has one can follow; a route
 * handler does not. The rule out here is the address itself: all project-scoped table and rpc access
 * lives under the adapter directory, and the route to a table from out here is the adapter's public
 * surface.
 *
 * It is a tripwire rather than a backlog: no source outside the adapter directory calls a table or
 * rpc on a Supabase receiver, and this check keeps it so.
 *
 * The residuals at this address are in the module docblock's list. The one specific to this rule is
 * that it reads the client by its conventional name, so a client rebound to an unrelated local
 * (`const db = locals.supabase`) is not seen out here. Check 6 forbids that shape inside the adapter
 * directory; it is not forbidden here because a prohibition needs a corpus somebody has read end to
 * end. A rebinding that then reached a table would still be the finding this boundary describes.
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
 * The returned total counts every site each check finds, so no shape is invisible to the total. The
 * optional `tally` records the same sites by family, which the non-vacuity floor in `main` and the
 * self-test's per-family assertions read.
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
 * Called from `main` on every invocation, not only under `--self-test`, because the spelling `lint:check` calls is the one that has to prove itself.
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
  // The per-family tally `checkSource` computes. A pooled total cannot tell a raised count from a
  // shuffled one: moving one site out of one family and another into a second leaves it intact.
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
  // exclusion. Each fixture holds storage-bucket accesses on top of the counted sites, so a count
  // one higher than expected means a bucket was read as a table, and a count of zero means nothing
  // was checked at all. The violating fixture's bucket accesses (the plain-dot, the optional-chained
  // and the optional-call spelling) control the access matcher's chain capture group, since making
  // that group non-capturing would read every one of them as a table.
  //
  // The total is also asserted by family, so a raised count names the rule that raised it rather
  // than a sum. Checks 6, 7 and 8 count as well as report, because their shapes would otherwise be
  // uncounted and a source containing nothing else would pass the non-vacuity floor.
  //
  // One line, `computedInvokeMemberInsideAdapter`, is matched by two rules: check 6's
  // computed-member rule and check 7's computed-invocation rule count it into separate families and
  // produce both messages. Each is asserted below by its own exact count, so a change that merged
  // the two rules fails by name rather than by a quieter total.
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
  // The escape hatches, pinned one by one rather than as an aggregate count. Each reaches a
  // project-scoped table past the receiver anchor, so each needs its own expectation: a total that
  // happens to add up would not say which of them is still covered.
  //
  // The alias and destructure counts are exact, and together they discriminate the binding rule's
  // trailing lookahead from its alternatives. The violating fixture holds the binding shapes the
  // rule must report (a plain alias, a nullish-coalesced one, one bound through the optional
  // operator at the receiver position, a sub-object alias and a bound scalar member) and the
  // destructures (one off the client, one off its `functions` member, one wrapped across lines and
  // one nested), beside two table accesses bound to locals that it must not report. No lookahead, a
  // `?` in a character class, and a lookahead excluding any following member each read that set
  // differently; only the committed form, which excludes an initialiser whose chain terminates in a
  // call, reads it as these counts do.
  //
  // The two counts are pinned separately rather than pooled: `const fns = this.supabase.functions;`
  // is an alias and `const { invoke } = this.supabase.functions;` is a destructure, so a change that
  // moved one into the other's family would leave a pooled total intact and fail here by name. That
  // holds only while `bindsByDestructuring` classifies correctly, which the wrapped and nested
  // destructures pin.
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
  // The owner family, pinned separately from the two above for the same reason: a pooled
  // escape-hatch total is satisfied by a regression that moves a site between the owner and alias
  // families. Reverting the trailing lookahead to admit a following member access makes the
  // near-miss scalar read in the clean fixture a false positive there, and dropping the rule takes
  // both counts here to zero and moves no other family, so each shape is load-bearing.
  const ownerAliasCount = countIn(violationMessages, "binds the client's owner");
  const ownerDestructureCount = countIn(violationMessages, "destructures the client out of the client's owner");
  expect(
    ownerAliasCount === 2,
    `${VIOLATION_FIXTURE} produced ${ownerAliasCount} check-6 owner-binding violation(s), expected exactly 2 ` +
      '(the plain `const self = this` and the non-null-asserted `const self = this!`, which is the ' +
      'terminating non-null half this rule closes — widen the `!` exclusion back to the bare character and this ' +
      'count drops rather than leaving a pooled total intact. The nullish-coalesced owner is the ' +
      'half NOT closed, and is a stated residual rather than a committed shape)'
  );
  expect(
    ownerDestructureCount === 1,
    `${VIOLATION_FIXTURE} produced ${ownerDestructureCount} check-6 owner-destructure violation(s), expected ` +
      'exactly 1 (`const { supabase } = this`, after which the table read carries no receiver at all)'
  );
  // Exact rather than `some(...)`, because the computed-access message names no member and no
  // table: the committed shapes are indistinguishable in the output, so only their number says each
  // spelling is reached. They are the shapes directly on the client and at a chained link, in every
  // punctuator spelling, plus the computed `invoke` key on the client's `functions` member, which
  // this rule reaches as a chained computed member and check 7 reaches as an invocation: two rules,
  // one line, two families, neither suppressing the other.
  const computedCount = countIn(violationMessages, 'computed member access');
  expect(
    computedCount === 6,
    `${VIOLATION_FIXTURE} produced ${computedCount} check-6 computed-access violation(s), expected exactly 6 ` +
      '(directly on the client and at a chained link, in both optional spellings and the NON-NULL one, plus ' +
      'the computed invocation key)'
  );
  // The computed access to the client field, pinned by its own exact count for the same reason: its
  // message names neither the key nor the member that follows it, so only the number says the
  // optional spelling of the computed punctuator is reached.
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
  // The same line, asserted from check 7's side. This message names neither the key nor the
  // function, so only its number says the computed-invocation rule fired here, and its count beside
  // check 6's computed-access count says the two rules separated on that line rather than one of
  // them swallowing the other.
  const adapterComputedInvokeCount = countIn(violationMessages, "computed member on the client's `functions` object");
  expect(
    adapterComputedInvokeCount === 1,
    `${VIOLATION_FIXTURE} produced ${adapterComputedInvokeCount} check-7 computed-invocation violation(s), ` +
      'expected exactly 1 (the one adapter-corpus shape, which check 6 also reports and counts separately)'
  );
  // Exact for the same reason the computed-access count is: the schema-hop message names neither
  // the schema, the table nor the receiver, so only the number says each spelling is reached. The
  // shapes are one per punctuator and position the matcher declares.
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

  // The outside pair, exercised as the guarded-source pair above is. The two boundary shapes are
  // pinned separately: a table read and an rpc call reach a table by different routes, and one
  // expectation satisfied by either would not say which still fires. The counts are exact for the
  // reason they are exact above: each outside fixture carries shapes that must not be counted (two
  // storage buckets and an adapter-surface call in the clean one), so a number one higher than
  // expected means a bucket was read as a table and a zero means nothing was checked. The violating
  // fixture's sites are the boundary matcher's table reads and rpc calls, one per punctuator and
  // position, plus computed Edge Function invocations on the `invoke` key (plain, optional-member
  // and optional-call) and on the `functions` key (quoted and backticked). The clean fixture's sites
  // are its dispositioned invocations; its optional-call bucket and its two computed near misses
  // are controls, not counts.
  expect(
    outsideViolationCount === 13,
    `${OUTSIDE_VIOLATION_FIXTURE} yielded ${outsideViolationCount} site(s), expected exactly 13`
  );
  expect(
    outsideCleanCount === 2,
    `${OUTSIDE_CLEAN_FIXTURE} yielded ${outsideCleanCount} site(s), expected exactly 2 (the bucket accesses must be excluded)`
  );
  // Exact per shape rather than `some(...)`, because every punctuator spelling is among them and the
  // boundary message names the method but not the receiver: a `some(...)` cannot tell a tripled
  // shape from a single one, so it would pass if only one spelling were reached.
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
  // The two computed-invocation rules at the boundary address, each pinned by its own exact count:
  // these messages name neither the key nor the function, so only the number says each spelling is
  // reached.
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
 * `utils/` is walked here, as part of the adapter corpus: it is inside `ADAPTER_DIR`, which is where
 * a client handed to a helper lands, so the adapter's strict rules apply to it. The boundary walk
 * skips everything under `${ADAPTER_DIR}/`, so a subtree this walk excluded would be in neither
 * corpus, and check 5, which iterates this function's output, could not report it.
 *
 * That the two corpora partition the frontend tree is not asserted here, because a walk cannot audit
 * its own exclusions. It is asserted in `packages/dev-seed/tests/projectScopingGate.test.ts`, which
 * walks the frontend source tree independently and requires the union of the two corpora to equal
 * it minus a written exclusion predicate.
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
 * The adapter directory has its own, stricter corpus, and a file cannot be in both. Tests and specs
 * never run in production, and a test's whole job is to spell shapes production must not: a mock
 * client reached with `.from('elections')` is a correct test, not a leak. Type-only modules and
 * ambient declarations emit no runtime code, so neither can issue a call. And `.js` / `.mjs` are
 * excluded because every such file under this tree is generated Paraglide message output; that is a
 * stated residual in the module docblock, and the gate spec measures it, so a hand-authored `.js`
 * arriving here is a named failure.
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
    // A direct entry point for debugging the fixtures; the ordinary invocation below runs the same check.
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
  // A query issued from anywhere else under the frontend source tree is outside every check above by construction, and one live Edge Function invocation sits out here.
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

  // The floor for this corpus sits on the enumeration rather than on the call sites it finds. The correct number of Supabase calls out here is zero, so a floor on call sites would fail a correct tree; a floor on the enumeration asserts that the walker found files, as the adapter corpus's empty-list check does.
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
  // A matcher that matches nothing reports zero violations forever, which is also what a correctly converted tree reports. Without this floor, renaming the mixin's `supabase` accessor would leave the guard examining nothing and still printing a clean bill.
  //
  // It is a floor, not an expected count: an exact count reddens on every legitimate refactor that adds or removes a call site, which teaches the reader to update the number without reading it. The self-test's exact fixture counts supply the precision.
  //
  // The floor reads the dot-access family rather than the pooled total, because a pooled total lets one family hold the floor up for another: with live Edge Function invocations counted, a dead `ACCESS_RE` would leave the total above zero while the table matcher had stopped matching.
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
  // The real corpus yields zero forbidden sites by design, so the fixtures are what make this guard's firing observable. They run here, in the spelling `lint:check` calls, so there is no second command to drop.
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
