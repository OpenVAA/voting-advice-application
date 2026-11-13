---
phase: quick-261011-ujg
plan: 01
type: execute
wave: 1
depends_on: []
quick_id: 261011-ujg
files_modified:
  - .planning/quick/261011-ujg-apply-the-operator-s-reading-of-section-/261011-ujg-BASE
  - .planning/v2.16-OPERATOR-DECISIONS-2026-10-09.md
  - .planning/phases/178-sign-in-email-code-registration/178-EXECUTION-RULES.md
  - .planning/phases/178-sign-in-email-code-registration/178-01-PLAN.md
  - .planning/phases/178-sign-in-email-code-registration/178-04-PLAN.md
  - .planning/phases/178-sign-in-email-code-registration/178-14-PLAN.md
  - .planning/phases/178-sign-in-email-code-registration/178-24-PLAN.md
  - .planning/phases/178-sign-in-email-code-registration/178-VALIDATION.md
  - .planning/STATE.md
autonomous: true
requirements: [QUICK-261011-ujg]
user_setup: []

estimate:
  tokens: 55000
  raw_tokens: 110000
  tasks: 3
  confidence: high

must_haves:
  truths:
    - "Sections A to H of the decision document are byte-equal to the committed text: the two stray keystrokes are gone, H1's box (b) is the one ticked box of section H, and no box and no recommendation mark was moved."
    - "Under the reading rule plan 178-01 carries, the round document reads `H1: applied (b)` and thirty-five untouched items, exit 0. H1 in any other state halts — untouched and ticked on its recommended option included — and a tick off the recommended option on any other item halts as before. Each was seen on a scratch reader and scratch documents outside the repository."
    - "The execution rules name (b) as J1's built option with the operator's ruling of 2026-10-11 cited, and (a) as the option not built; they name PL-29 (a) as the operator's explicit acceptance; their names table holds `BasicUserData.passwordSet: boolean` and neither the options type nor the narrowed gate type."
    - "No plan of Phase 178 and no row of its validation map states or rests on the on-request form: the fact is filled on every call of `getBasicUserData`, which takes no setting; each Admin job poll and each Admin page load makes one more database round trip, stated in plan 178-04 and accepted in its threat register by the operator's ruling; a failed read fails the user-data read for every caller."
    - "Every plan of Phase 178 passes the structure and frontmatter validators, and every verify block and embedded script of those plans still parses. The context, research, pattern map, UI contract, round file, roadmap and requirements are unchanged, and so is everything outside `.planning/`."
    - "The decision document's Fill status records the reading — H1 (b); H2 to H38 at their recommended options; H38 (a) as the operator's explicit acceptance; the UI contract's thirty proposals at theirs; the two stray keystrokes reverted — and `.planning/STATE.md` says Phase 178 is planned, read and ready to execute."
  prohibitions:
    - id: PROH-261011-01
      statement: "Phase 178 is not started: no plan of it is executed, no file a plan of it creates is created, and nothing outside `.planning/` is edited."
      status: resolved
      verification: judgment
    - id: PROH-261011-02
      statement: "No box of the decision document is ticked, unticked or moved and no recommendation mark is moved; no line of its sections A to H is edited beyond restoring the two stray lines."
      status: resolved
      verification: judgment
    - id: PROH-261011-03
      statement: "The halt is weakened for no item but H1: the reading rule's applied table holds one entry, its fallback list stays empty, and H1 itself has one accepted state."
      status: resolved
      verification: judgment
    - id: PROH-261011-04
      statement: "`178-CONTEXT.md`, `178-RESEARCH.md`, `178-PATTERNS.md`, `178-UI-SPEC.md`, `178-OPERATOR-ROUND`, `.planning/ROADMAP.md` and `.planning/REQUIREMENTS.md` are not edited; `CAND-APP-PLAN.md` is never staged; no `git add -A`, no `git stash`, no branch created or switched."
      status: resolved
      verification: judgment
  artifacts:
    - path: ".planning/v2.16-OPERATOR-DECISIONS-2026-10-09.md"
      provides: "the reading of 2026-10-11 under Fill status"
      contains: "Read on 2026-10-11, section H"
    - path: ".planning/phases/178-sign-in-email-code-registration/178-EXECUTION-RULES.md"
      provides: "J1 built at (b) by the operator's ruling, and the reading rule's one applied item"
      contains: "applied"
    - path: ".planning/phases/178-sign-in-email-code-registration/178-01-PLAN.md"
      provides: "the reading command that takes a ticked (b) on H1 as applied"
      contains: "APPLIED"
    - path: ".planning/phases/178-sign-in-email-code-registration/178-04-PLAN.md"
      provides: "Task 3 in the every-call form"
      contains: "passwordSet: boolean"
    - path: ".planning/STATE.md"
      provides: "Phase 178 ready to execute"
      contains: "ready to execute"
  key_links:
    - from: ".planning/phases/178-sign-in-email-code-registration/178-01-PLAN.md"
      to: ".planning/v2.16-OPERATOR-DECISIONS-2026-10-09.md"
      via: "the applied table names the item by its id in the round document, and the facts line it must print"
      pattern: "H1: applied"
    - from: ".planning/phases/178-sign-in-email-code-registration/178-04-PLAN.md"
      to: ".planning/phases/178-sign-in-email-code-registration/178-EXECUTION-RULES.md"
      via: "ruling 2 cites the rulings table's J1 row"
      pattern: "J1 \\(b\\)"
    - from: ".planning/phases/178-sign-in-email-code-registration/178-14-PLAN.md"
      to: ".planning/phases/178-sign-in-email-code-registration/178-04-PLAN.md"
      via: "the load reads the fact every call carries; its verify looks for the call with no argument"
      pattern: "getBasicUserData\\(\\)"
---

<objective>
The operator read section H of `.planning/v2.16-OPERATOR-DECISIONS-2026-10-09.md` and the UI contract's round on 2026-10-11. Apply that reading to Phase 178 before it is executed: revert two stray keystrokes, change the plans from J1 (a) to J1 (b), make plan 178-01's reading take the ticked (b) on H1 as applied, record the reading, and lift the hold in the state file.

Purpose: as committed, plan 178-01's reading command stops the phase at H1 (observed on the planning day with the script it copies: exit 1, one halt, "H1: halt — option (b) ticked, for which the plans state no fallback an executor may build"), and the plans — plan 178-04 Task 3 first, plan 178-14 after it — build the option the operator overruled.

Output: planning documents only. Phase 178 is NOT started, and no application code is touched.
</objective>

<execution_context>
@~/.claude/gsd-core/workflows/execute-plan.md
@~/.claude/gsd-core/templates/summary.md
</execution_context>

<context>
Read by section, never whole unless said: the files of this plan are large. Every place below is cited by quoted content, never by line number; find it with a search.

A hook line of the form `CONTEXT WARNING NN%` in a tool's output belongs to the orchestrator. Ignore it and keep working.

**Names**

| Name | Value |
|---|---|
| `P` | `.planning/phases/178-sign-in-email-code-registration` |
| `Q` | `.planning/quick/261011-ujg-apply-the-operator-s-reading-of-section-` |
| `D` | `.planning/v2.16-OPERATOR-DECISIONS-2026-10-09.md` |
| `R177` | `.planning/phases/177-define-nominations/177-read-rulings.mjs` |

**The shell.** Every automated block of this plan is written byte for byte into a script file outside the repository and run with `bash` from the checkout root (zsh does not split an unquoted variable into words). A status is read from the command itself, never through a pipe. Commits are by pathspec: `git commit -m "…" -- <paths>`, a new file added by explicit path first; each message ends with `Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>`.
</context>

## The reading

Confirmed by the operator in session on 2026-10-11:

- **H1 (J1) is option (b)**: `password_set` is filled on every call of `getBasicUserData`, and the method's option goes. The box was already ticked in the committed file.
- **H2 to H38 are untouched** and stand at their ★ options.
- **H38 (PL-29)** was put to the operator by name and answered **(a) accept and document**: an explicit acceptance, not a default. Its boxes stay unticked.
- **U-01 to U-30** of `178-UI-SPEC.md` are untouched and stand at their ★.

Measured on the planning day (head `e375152a4`): `node $R177 $D H` exits 1 with 36 items, 35 of them `recommended-unticked` and one halt, H1; the UI contract's round holds no ticked box and no NOTE or EDIT line and its status is `approved`; `git diff -- $D` shows exactly two changed lines.

## The reading rule plan 178-01 carries

`178-read-rulings.mjs` is Phase 177's script copied, re-pointed, and with **one addition**:

- a table `APPLIED`, declared beside `FALLBACK`, with the single entry `H1: 'b'` — the item's id in the round document and the option the plans build by the operator's ruling;
- for an item of that table, after the checks for NOTE text, stray text, an odd box, the count of ★ options and more than one tick, and before the untouched case: exactly one box ticked, on the table's letter, is printed `<item>: applied (<option>)` and is no halt; every other state of that item is `<item>: halt — the plans build option (<letter>) by the operator's ruling and the document does not say so`, with the item verbatim;
- for every other item the rule is the original's, and `FALLBACK` stays empty.

The facts file then holds the line `- H1: applied (b)`. Task 1's automated block builds this rule onto a scratch copy of `$R177` outside the repository and is the executable statement of it. Observed with it on the planning day: the round document, exit 0, `H1: applied (b)`, 35 untouched; H1 with its tick removed, exit 1, H1 halts; H1 with the tick on (a), exit 1, H1 halts; H38 with (b) ticked as well, exit 1, H38 halts and H1 is applied; sections `CD` exit 0; section `F` exit 1 with F1 halting.

## The (b) form

Cited everywhere as: *item J1 (b), the operator's ruling of 2026-10-11 (decision H1)*.

| Aspect | Under (b) |
|---|---|
| The type | `BasicUserData.passwordSet` is a `boolean` every `BasicUserData` holds. No options type is added. `getBasicUserData()` keeps today's signature and takes no argument, so the writer's base-class file is not edited by plan 178-04. |
| The adapter | `_getBasicUserData()` makes one call of `get_user_entities` for the adapter's project **on every call**, after the user and the grants are read as today. `parseCallerPasswordSet` is unchanged. An RPC error or an answer that is no boolean makes the method throw, for every caller (D-06, PROH-178-11: never defaulted). |
| The cost | Each Admin job poll (the identity check behind `requireAdminIdentity`, through `getUserData`), each load of the two Admin pages that call the method, and each load of the Contestant App's protected layout make one more database round trip. Accepted by the ruling. No sentence may say that the Admin App's calls cost what they cost today, or that some caller makes no extra read. |
| The coupling | A failed read of the fact fails the whole user-data read for every caller: the Contestant layout signs the user out with `loginFailed`, as it does today for a rejected read, and the Admin identity check gets no user. A consequence, not a new decision; stated in plan 178-04's truth and in T-178-20. |
| The evidence in 178-04 Task 3 | Unit: every call makes exactly one read with the adapter's project id and returns `passwordSet` as answered, once `true` and once `false`; an RPC error and a malformed answer each reject, neither logged and defaulted. One case in `supabaseDataWriter.integration.test.ts`: on the local stack a signed-in editor's `getBasicUserData()` resolves with a boolean `passwordSet`. The closing gate set gains the row `integration`: `178-04-close --rows typecheck,lint,integration,unit,check-frontend,build,format` — seven rows, in the driver's own order — and Task 3 gains Task 2's precondition line. Reason: from Task 3's commit every signed-in server load of both apps reaches the read. |
| The gate (178-14) | No narrowed gate type: the gate list and `firstNeededGate` take `BasicUserData`. The predicate `user.passwordSet === false` is unchanged. The load calls `getBasicUserData()` as it does today and still hands the user to the gate list only when `passwordSet` is a boolean, signing out with `loginFailed` otherwise. The type-level unit case becomes: a user object without the member is not assignable to the gate list's parameter. |
| The threat rows | T-178-22: disposition `accept`, citing the ruling and its date, naming the Admin App's job polls and page loads. T-178-20: its component also names the Admin identity check, its mitigation also names the integration case that calls the method. T-178-19 and T-178-81 are true under both forms and stay. |
| The sources | `178-RESEARCH.md` § *J1* (third bullet of its prescription), `178-PATTERNS.md` (the gate's parameter type; the paragraph on `passwordSet`), the UI contract's shared-code row on `BasicUserData` and `178-CONTEXT.md` describe or allow the on-request form. **None is edited.** The execution rules say the ruling is the later reading, and plans 178-04 and 178-14 each carry a ruling line that says so. |
| PL-29 | The built option does not change. Sentences that call it unanswered, or its acceptance the planner's alone, say instead: accepted by the operator on 2026-10-11 (decision H38 (a)). |

## Sites found on the planning day

A starting point. The population is derived again by the searches of the next section when the task runs.

**`178-EXECUTION-RULES.md` — the rulings and the reading (Task 1)**

- The paragraph under `## Items built at the recommended option, each isolated` that begins "**Nothing below has been answered by the operator.**" (the heading itself stays: plan 178-01 cites it). Its first sentence becomes: "**The operator read this round on 2026-10-11** (`.planning/v2.16-OPERATOR-DECISIONS-2026-10-09.md`, section H and *Fill status*): J1 is ruled (b) and is built so; PL-29 (a) is the operator's explicit acceptance; every other item, and each of the UI contract's thirty proposals, is untouched and stands at its recommended option." "stops the phase when a reply names another option" becomes "stops the phase when the document says anything else". After the sentence that ends "*(UI over research)*" add: "**On item J1 the operator's ruling is later than all three**: `178-RESEARCH.md` § *J1* (the third bullet of its prescription), `178-PATTERNS.md` (the gate's parameter type and the paragraph on `passwordSet`) and the UI contract's shared-code row on `BasicUserData` describe the on-request form. None of them is edited, and where a plan and one of them differ on this point the plan stands."
- The row `| J1 |`. Built cell, beginning with `(b) `: "(b) — ruled by the operator on 2026-10-11 (decision H1): a key on `get_user_entities` through the new zero-argument `private.caller_password_set`, filled on `BasicUserData` on every call of `getBasicUserData`, which takes no setting. Each Admin job poll and each Admin page load makes one more database round trip". Other cell: "(a), the planner's recommendation, not built: filled only when the protected layout asks for it, through an optional setting of `getBasicUserData` — plan 178-04 Task 3 and the load of plan 178-14 Task 2. (c) a dedicated RPC: plan 178-04 Tasks 1 and 2".
- The row `| PL-29 |`: its Built cell begins "accepted by the operator on 2026-10-11 (decision H38 (a), put to the operator by name) and documented: …", the rest as written.
- The paragraph that begins "`$P/178-read-rulings.mjs`, built by plan 178-01 from Phase 177's reading command": after "is a halt with the item printed verbatim." add: "One item is read otherwise, because the plans already build the operator's ruling on it: H1 of the round document (item J1) reads `applied` when exactly its option (b) is ticked and nothing else is said under it, and is a halt in every other state — untouched, or ticked on its ★, included. No other item has an accepted second option." In its last sentence, after "means its recommended option" add " — J1 excepted, which stands at (b) on the ruling recorded above —".

**`178-01-PLAN.md` (Task 1)**

- The truth that begins "The operator's rounds are read by a fixed rule and not by judgment": say that J1's built option is (b) by the operator's ruling and that the command reads it as applied.
- The source-coverage row `| Orchestrator |`: "nothing answered by the operator" becomes the reading of 2026-10-11 (J1 (b); PL-29 (a) accepted; every other item untouched).
- `## Rulings and deviations carried by this plan`: a fifth item — one ruling of the operator is already in the plans; the command accepts that one tick as applied, halts on every other state of the item, and gives no other item an accepted second option.
- Task 2 step 1 (begins "`$P/178-read-rulings.mjs`: Phase 177's reading script copied"): "and nothing else changed" gives way to the one addition of § *The reading rule*, stated in full; the printed forms gain `<item>: applied (<option>)`.
- Task 2 step 2 (begins "The script seen deciding both ways"): add the applied branch seen both ways, on scratch copies of the round document outside the repository — H1's tick removed, and H1's tick moved to its ★ option: exit 1 each, H1 halting; a second option ticked on another item of the section: exit 1, that item halting and H1 applied.
- Task 2 step 4 (begins "This phase's own round."): with the round document named, H1 reads `applied (b)`; the sentence on an absent file gains the J1 exception of the execution rules.
- Task 2 acceptance criteria: one line — with the round document named, the reading prints `H1: applied (b)`, and the facts file holds exactly one line of the applied form.
- Task 2's automated chain: inside the `then` branch of `if [ -f $P/178-OPERATOR-ROUND ]`, directly after the `--facts` run, append `&& grep -q -E '^- H1: applied \(b\)' $P/178-BASELINE-FACTS.md && test "$(grep -c -E '^- [A-Z][0-9]+: applied ' $P/178-BASELINE-FACTS.md)" = "1"`. Nothing else of the chain changes.
- Task 2's fails-when text, threat row T-178-03 and the reader's line in the artifacts-produced block: each says the same exception in a clause.

**`178-04-PLAN.md` (Task 2) — the located change the option names**

- Frontmatter `files_modified`: `apps/frontend/src/lib/api/base/universalDataWriter.ts` leaves; `apps/frontend/src/lib/api/adapters/supabase/dataWriter/supabaseDataWriter.integration.test.ts` enters. The same in Task 3's files line.
- The truth that begins "The adapter fills `BasicUserData.passwordSet` only when it is asked to" (it holds "makes no extra round trip" and names the Admin App's job polling).
- The artifact of `dataWriter.type.ts` (`provides`, and `contains: "GetBasicUserDataOptions"` becomes `contains: "passwordSet: boolean"`), and the key link whose `via` ends "when the fact is asked for".
- The objective: "the adapter's way of asking for the fact", "the adapter's option with its parser and tests".
- The context block: after the "Read by section" sentence, one sentence — on item J1 the research's third prescription bullet and what the pattern map says of filling the fact on request are superseded by ruling 2.
- The long-gates block: the row list `178-04-close --rows typecheck,lint,unit,check-frontend,build,format`.
- Ruling 2 (begins "**The fact is filled on request** (item J1 (a))") and ruling 4 (the close: Task 3's change is now reached by every signed-in load, so the integration row runs again over the committed adapter).
- The source-coverage row `| RESEARCH |`: "J1 points 1 to 4 and the prescription".
- `## What this plan's commits do to committed specs`: "`getBasicUserData()` without the option does what it did" is false under (b). It says instead what Task 3's commit reaches (every signed-in server load of both apps: one more read, and a rejection when it fails), that no page, layout or load is edited, that with the read answering nothing a browser observes changes, and that the first full run over it is `178-05-close`.
- Task 3, whole: its name, its reversibility line, its files line, its read-first list, its behaviour block, every step of its action, the acceptance criteria, the automated chain, the fails-when text and the done line. The automated chain changes in exactly these links: the link that looks for `export type GetBasicUserDataOptions` goes; `"passwordSet?: boolean"` becomes `"passwordSet: boolean"`; the negative link becomes `{ git grep -q -E "getBasicUserData\([^)]" -- $F ':!*.test.ts'; test $? -eq 1; }` (no caller passes the method an argument; it matches nothing on today's tree); a link `git grep -q -F "getBasicUserData" -- $F/lib/api/adapters/supabase/dataWriter/supabaseDataWriter.integration.test.ts` is added; the last link's row list is the seven rows of § *The (b) form*. The new done line: "Every read of the user-level data says whether the signed-in user has a password — a boolean or an error, never a guess — and nothing decides on it yet."
- Step 5 of Task 3 under (b): every other producer, mock and typed fixture of `BasicUserData` that the type check names gains the member, and each is named in the summary; no caller is changed.
- Threat rows `| T-178-20 |` and `| T-178-22 |` (the latter holds "the read is made only when asked; a unit case holds that the default call makes none").
- The verification block (the `178-04-close` line), the success criteria ("the adapter can ask for it without guessing"), the artifacts-produced block (the Frontend line names the options type, the optional member and `getBasicUserData(opts?)`), and the output block ("items J1 and J5 are unanswered and built at their recommended options": J1 is built at option (b) by the operator's ruling; J5 is unanswered and built at its recommended option; the files the type check named are recorded).

**`178-14-PLAN.md` (Task 2)**

- The truth that begins "The gate is decided by the server, on the user-level data, on a fact the gate's own type requires" (it holds "the protected layout's load asks the writer for the fact").
- The artifact whose `provides` is "the gate entry, its id and the type that requires the fact"; the key link whose `via` begins "the load asks the writer for the fact" — its `pattern: "passwordSet: true"` becomes `pattern: "passwordSet"`.
- `## Rulings and deviations carried by this plan`: an eleventh item — the fact is on every read of the user-level data (item J1 (b)); the load calls the method as it does today; the gate list takes `BasicUserData`; the research's § *J1* and the pattern map's gate section prescribe a narrowed type and a setting on the call, and on this point the ruling is the later reading.
- Task 2's reversibility line ("the type that requires the fact").
- Task 2 step 1: the `gates.test.ts` type-level case ("a `BasicUserData` without the member is not assignable") and the `layout.server.test.ts` case "the load asks the writer for the fact".
- Task 2 step 2 (holds `export type GateUserData = BasicUserData & { passwordSet: boolean }`) and step 4 (holds `getBasicUserData({ passwordSet: true })`).
- Task 2 acceptance criteria: the two lines that name `GateUserData` and the call with the setting.
- Task 2's automated chain: in the `node -e` script, the token list `["\x27setPassword\x27","GateUserData","passwordSet === false","Object.freeze"]` loses its second member, and `l.indexOf("getBasicUserData({ passwordSet: true })")<0` with the message "the load does not ask for the fact" becomes `l.indexOf("getBasicUserData()")<0` with the message "the load does not read the user-level data". Nothing else of the script changes. The fails-when text: "its type or its predicate" and "a load that does not ask for the fact" follow.
- The artifacts-produced block: the Gate line (names the narrowed type) and the Load line.
- PL-29: the truth that ends "and put to the operator as item PL-29.", ruling 9 ("The other options are the operator's") and the row `| T-178-153 |` each gain the operator's acceptance of 2026-10-11 (decision H38 (a)).
- The output block: "items J1, J2, U-22, PL-01, PL-09, PL-10, PL-14 and PL-29 are unanswered and built at their recommended options" becomes: item J1 is built at option (b) by the operator's ruling of 2026-10-11, item PL-29 at option (a) by the operator's explicit acceptance of the same day, and items J2, U-22, PL-01, PL-09, PL-10 and PL-14 are unanswered and built at their recommended options.

**The others (Task 2)**

- `178-24-PLAN.md`: the truth that begins "Every item of the operator's round stands" (keep those opening words) says "are each built at the recommended option". It becomes: J1 at option (b), the operator's ruling of 2026-10-11, and J2 to J6, U-01 to U-30 and PL-01 to PL-29 each at the recommended option.
- `178-VALIDATION.md`: the row `| 178-04-03 |` — its behaviour cell is Task 3's new done line, its test-type cell gains `integration`, its threat cell gains T-178-20.
- `178-EXECUTION-RULES.md` § *Names this phase introduces*: the `| writer |` row holds the options type and `BasicUserData.passwordSet?: boolean` (becomes `BasicUserData.passwordSet: boolean`, on every call; the options type goes); the `| frontend |` row that begins "gate id `'setPassword'`" holds the narrowed gate type (goes).

**True under both forms on the planning day — left untouched**: every mention of the `PasswordSetter` component and its test ids (178-08, 178-09, 178-11, 178-19, 178-22, 178-23); `private.user_password_set` and the `password_set` member of the claim's answer (178-01, 178-02, 178-06); plan 178-04's Tasks 1 and 2, its truths on the schema, and T-178-17 to T-178-19 and T-178-21; plan 178-14's T-178-81; the PL-29 sentences of plans 178-22, 178-23 and 178-24; the "unanswered" sentence of every plan that names neither J1 nor PL-29.

## How the population is derived

Run each search; every hit is judged by one rule: **a line that is false under (b), or that rests on the fact being asked for, is brought to § *The (b) form*; a line true under both forms is left as it is.** A hit that is not in the list above and is left is named in the summary with its reason. No line is rewritten for style.

1. `grep -n -E 'J1([^0-9A-Za-z]|$)|getBasicUserData|GetBasicUserDataOptions|GateUserData|BasicUserData|passwordSet([^A-Za-z]|$)|password fact' $P/178-*-PLAN.md $P/178-EXECUTION-RULES.md $P/178-VALIDATION.md`
2. `grep -n -i -E "round trip|job poll|polling|when (it is )?asked|on request|asks? (the writer )?for the fact|asked for the fact|with the option|without the option|optional (argument|member|setting)|no extra|nobody asks|none asks|type requires|type-level|Admin App.s (calls|job)" $P/178-*-PLAN.md $P/178-EXECUTION-RULES.md $P/178-VALIDATION.md`
3. `grep -n -E 'unanswered|answered by the operator|stands at its built option|built at the recommended option|PL-29|T-178-(19|20|22|81|153)([^0-9]|$)' $P/178-*-PLAN.md $P/178-EXECUTION-RULES.md $P/178-VALIDATION.md`
4. `grep -n -F -e '178-04-close' -e '178-04 Task 3' -e '178-04-03' $P/178-*-PLAN.md $P/178-EXECUTION-RULES.md $P/178-VALIDATION.md`

## The text for the record

**Fill status**, one paragraph on one line, placed after the paragraph that begins "**Read on 2026-10-11, section G, in part:**" and before the one that begins "**Found while Phase 177 was executed":

> **Read on 2026-10-11, section H and the UI contract's round:** H1 (b) ticked — `password_set` is filled on every call of `getBasicUserData` and the method's option goes; each Admin job poll and each Admin page load makes one more database round trip. The plans of Phase 178 are changed to it (quick task `261011-ujg-apply-the-operator-s-reading-of-section-`), and plan 178-01's reading takes that one tick as applied and stops at any other state of H1. H2 to H38 untouched, so each is its ★ option. H38 (PL-29) was put to the operator by name in the session and answered (a), accept and document: an explicit acceptance on the record, not a default; its boxes stay unticked. The thirty proposals U-01 to U-30 of `178-UI-SPEC.md` untouched, so each is its ★ option. Two stray keystrokes in the working copy of this file, neither of them a reply, were reverted before the reading was applied: a space after "(plan" in H1's option (b), and a dropped letter in "uninvited" in H5's option (a). On this reading Phase 178 is ready to execute.

A fact the execution found otherwise (for example, the keystrokes already reverted) is stated as found.

**The index table** at the top of the same file: in the row that begins `| H — Phase 178`, the last cell "Planned, held for your reading" becomes "Planned; read 2026-10-11" (row F's cell, "answered 2026-10-10", is the precedent).

**`.planning/STATE.md`**, four frontmatter keys and nothing else:

- `stopped_at`: the sentence "Phase 178 is planned (24 plans) and held until the operator has read section H and the 30 proposals of 178-UI-SPEC.md." becomes "Phase 178 is planned (24 plans) and ready to execute: the operator read section H and the 30 proposals of 178-UI-SPEC.md on 2026-10-11 — H1 (b), applied to the plans; H38 (a) accepted; every other item at its recommended option." The rest of the line stays.
- `last_activity_desc`: "Phase 177 executed plan by plan, closed green and verified; Phase 178 planned, read by the operator and ready to execute".
- `last_activity`: `2026-10-11`. `last_updated`: the time of the edit, in the form the key has.

<tasks>

<task type="tracer">
  <name>Task 1: The reading path end to end — the committed document reads `H1: applied (b)` under the rule plan 178-01 carries</name>
  <reversibility rating="reversible">Planning documents and one one-line file.</reversibility>
  <precondition>`git diff -- .planning/v2.16-OPERATOR-DECISIONS-2026-10-09.md` shows either exactly the two stray lines of step 2 or nothing at all.</precondition>
  <files>.planning/quick/261011-ujg-apply-the-operator-s-reading-of-section-/261011-ujg-BASE, .planning/v2.16-OPERATOR-DECISIONS-2026-10-09.md, .planning/phases/178-sign-in-email-code-registration/178-EXECUTION-RULES.md, .planning/phases/178-sign-in-email-code-registration/178-01-PLAN.md</files>
  <read_first>
    - `$D`: the preamble of `## H.`, `### H1` whole, option (a) of `### H5`, `### H38` whole, and `## Fill status` down to the paragraph that begins "**Found while Phase 177 was executed".
    - `$R177`, whole: the header's rule, `FALLBACK`, and the chain of `else if` that decides an item.
    - `$P/178-EXECUTION-RULES.md`: `## Names this phase introduces` and `## Items built at the recommended option, each isolated` down to `## The probe rows`.
    - `$P/178-01-PLAN.md`, whole.
  </read_first>
  <action>
1. The base. When `$Q/261011-ujg-BASE` does not exist, write the output of `git rev-parse HEAD` into it, one line, before any other edit. Every later check compares with that commit, so each block stays true when it is run again after a later task.

2. The stray keystrokes. Run `git diff -- $D`. It must show exactly two changed lines and nothing else: in H1's paragraph on option (b), the line that ends "until the plans are changed to it (plan" has gained a trailing space; and in option (a) of H5, the word "uninvited" has lost a letter. An empty diff means they are already gone: go on, and say so in the summary. **Anything else in the diff is a reply nobody has read: stop, quote the diff in the report, edit nothing.** Restore the two lines to the base's bytes — `git checkout -- $D` is allowed here because, and only because, the diff was just seen to hold those two lines alone; two scoped edits do as well. Then `git diff --quiet -- $D` exits 0. No box is touched: H1's box (b) stays ticked.

3. `$P/178-EXECUTION-RULES.md`: bring the four places of § *Sites found* → *the rulings and the reading* to the texts given there. The section's heading is not changed.

4. `$P/178-01-PLAN.md`: bring the places of § *Sites found* → `178-01-PLAN.md` to § *The reading rule plan 178-01 carries*. Step 1 of its Task 2 states the addition in full, so that its executor needs nothing but that step and Phase 177's script: the table and its one entry, where the branch sits in the chain, the one accepted state, the halt's reason, and that every other item is read as before. The plan keeps two tasks and every other link of its verify chains.

5. Run this task's automated block. It builds the rule onto a scratch copy of `$R177` outside the repository, reads the round document and three scratch variants of it, and checks the two files. Keep its outputs for the summary.

6. When the block exits 0, commit by pathspec — `$Q/261011-ujg-BASE` (added by path), `$P/178-EXECUTION-RULES.md`, `$P/178-01-PLAN.md` — subject `docs(178): the reading command takes the operator's ticked (b) on H1 as applied and halts on every other state of it`. The decision document has no change to commit after step 2.
  </action>
  <acceptance_criteria>
    - From `## A.` to `## Fill status`, `$D` is byte-equal to the base commit's; at this task's end the whole file is.
    - The scratch reader exits 0 on the round document with `H1: applied (b)` and 35 untouched items of 36; exits 1 with H1 halting when H1's tick is removed and when it sits on (a); exits 1 with H38 halting and H1 applied when H38's (b) is ticked as well; exits 0 on sections `CD` and 1 on section `F`.
    - The rulings table's J1 row has (b) as its built option and names 2026-10-11; the PL-29 row names 2026-10-11; plan 178-01 names `APPLIED`, the printed form `<item>: applied (<option>)` and the facts line of H1; plan 178-01 passes both validators and its verify blocks parse.
  </acceptance_criteria>
  <verify>
    <automated>export PATH="$HOME/.nvm/versions/node/v24.21.0/bin:$PATH" && P=.planning/phases/178-sign-in-email-code-registration && Q=.planning/quick/261011-ujg-apply-the-operator-s-reading-of-section- && D=.planning/v2.16-OPERATOR-DECISIONS-2026-10-09.md && R177=.planning/phases/177-define-nominations/177-read-rulings.mjs && GT="$HOME/.claude/gsd-core/bin/gsd-tools.cjs" && W="$(mktemp -d)" && B="$(cat $Q/261011-ujg-BASE)" && git cat-file -e "$B^{commit}" && git show "$B:$D" > $W/base.md && awk '/^## A\./,/^## Fill status/' $W/base.md > $W/body-base.txt && awk '/^## A\./,/^## Fill status/' $D > $W/body-now.txt && test -s $W/body-now.txt && cmp -s $W/body-base.txt $W/body-now.txt && node -e 'const fs=require("fs");const [src,out,doc,dir]=process.argv.slice(1);let s=fs.readFileSync(src,"utf8");const a="const FALLBACK = [];";const b="  else if (ticked.length === 0) {";if(s.split(a).length!==2||s.split(b).length!==2){console.log("the reader no longer holds the two anchors the proof patches");process.exit(3)}s=s.replace(a,a+"\nconst APPLIED = { H1: \x27b\x27 };");s=s.replace(b,"  else if (APPLIED[it.id]) {\n    if (ticked.length === 1 && ticked[0].letter === APPLIED[it.id]) {\n      code = \x27applied\x27;\n      letter = APPLIED[it.id];\n    } else why = \x27the plans build option (\x27 + APPLIED[it.id] + \x27) by the operator\\\x27s ruling and the document does not say so\x27;\n  }\n"+b);fs.writeFileSync(out,s);const d=fs.readFileSync(doc,"utf8");const sw=(t,from,to)=>{if(t.split(from).length!==2){console.log("not exactly once: "+from);process.exit(3)}return t.replace(from,to)};const b1="- [x] **(b) filled on every call";const a1="- [ ] **(a) a key on `get_user_entities` through the new zero-argument";const h38="- [ ] **(b) The same gate in the Admin App: a plan of its own after 178-14";const v1=sw(d,b1,"- [ ]"+b1.slice(5));fs.writeFileSync(dir+"/v1.md",v1);fs.writeFileSync(dir+"/v2.md",sw(v1,a1,"- [x]"+a1.slice(5)));fs.writeFileSync(dir+"/v3.md",sw(d,h38,"- [x]"+h38.slice(5)))' $R177 $W/reader.mjs $D $W && node --check $W/reader.mjs && node $W/reader.mjs $D H > $W/h.out && grep -q -x -F "H1: applied (b)" $W/h.out && test "$(grep -c -E '^H[0-9]+: ' $W/h.out)" = "36" && test "$(grep -c -E '^H[0-9]+: recommended-unticked ' $W/h.out)" = "35" && for v in v1 v2; do { node $W/reader.mjs $W/$v.md H > $W/$v.out; test $? -eq 1; } && grep -q -E '^H1: halt ' $W/$v.out || exit 1; done && { node $W/reader.mjs $W/v3.md H > $W/v3.out; test $? -eq 1; } && grep -q -x -F "H1: applied (b)" $W/v3.out && grep -q -E '^H38: halt ' $W/v3.out && node $W/reader.mjs $D CD > $W/cd.out && { node $W/reader.mjs $D F > $W/f.out; test $? -eq 1; } && grep -q -E '^F1: halt ' $W/f.out && grep -F "| J1 |" $P/178-EXECUTION-RULES.md > $W/j1.txt && test "$(grep -c "" $W/j1.txt)" = "1" && grep -q -E '^\| J1 \| [^|]+ \| \(b\) ' $W/j1.txt && grep -q -F "2026-10-11" $W/j1.txt && grep -F "| PL-29 |" $P/178-EXECUTION-RULES.md > $W/pl29.txt && grep -q -F "2026-10-11" $W/pl29.txt && grep -q -F "applied" $P/178-EXECUTION-RULES.md && { grep -q -F "Nothing below has been answered by the operator" $P/178-EXECUTION-RULES.md; test $? -eq 1; } && for n in "APPLIED" "<item>: applied (<option>)" "H1: applied"; do grep -q -F -e "$n" $P/178-01-PLAN.md || { echo "plan 178-01 lacks: $n"; exit 1; }; done && node "$GT" query verify.plan-structure $P/178-01-PLAN.md > $W/ps.json && node "$GT" query frontmatter.validate $P/178-01-PLAN.md --schema plan > $W/fm.json && grep -q -F '"valid": true' $W/fm.json && node -e 'const fs=require("fs");const dir=process.argv[1];const o="<"+"automated>";const c="</"+"automated>";let nb=0;for(const f of process.argv.slice(2)){const t=fs.readFileSync(f,"utf8");const re=new RegExp(o+"([\\s\\S]*?)"+c,"g");let m;while((m=re.exec(t)))fs.writeFileSync(dir+"/blk-"+(nb++)+".sh",m[1]+"\n")}if(!nb)process.exit(1)' $W $P/178-01-PLAN.md && for f in $W/blk-*.sh; do bash -n "$f" || { echo "does not parse: $f"; exit 1; }; done && git diff --quiet "$B" -- $P/178-OPERATOR-ROUND $P/178-UI-SPEC.md</automated>
    <fails_when>non-zero exit: no recorded base, or one that is no commit; a decision document that differs from the base between `## A.` and `## Fill status` (a stray keystroke left, a box touched, or anything else changed); Phase 177's reader without the two anchors the proof patches (exit 3); the round document not read as `H1: applied (b)` with 35 of 36 untouched; H1 not halting with its tick removed or moved; another item's off-★ tick not halting, or H1 not applied beside it; sections `CD` not exit 0 or `F` not exit 1; a J1 row that is absent, doubled, not built at (b) or undated; a PL-29 row without the date; the old opening sentence still in the rules; plan 178-01 without the table's name, the printed form or H1's facts line, failing a validator, or holding a verify block that does not parse; or a changed round file or UI contract. Whether the edits are committed is asserted by Task 3's block.</fails_when>
  </verify>
  <done>The one path that stopped the phase is proven open: the document as committed, read under the rule plan 178-01 now states, gives H1 as applied and stops at nothing — and stops at H1 again the moment the document says otherwise.</done>
</task>

<task type="auto">
  <name>Task 2: Every place of the plans that states or rests on the on-request form is brought to the every-call form</name>
  <reversibility rating="reversible">Planning documents; the plans are not executed.</reversibility>
  <files>.planning/phases/178-sign-in-email-code-registration/178-04-PLAN.md, .planning/phases/178-sign-in-email-code-registration/178-14-PLAN.md, .planning/phases/178-sign-in-email-code-registration/178-24-PLAN.md, .planning/phases/178-sign-in-email-code-registration/178-VALIDATION.md, .planning/phases/178-sign-in-email-code-registration/178-EXECUTION-RULES.md</files>
  <read_first>
    - `$P/178-04-PLAN.md`, whole.
    - `$P/178-14-PLAN.md`: its frontmatter, `## Rulings and deviations carried by this plan`, Task 2 from its name to the end of its verify block, the threat rows T-178-81 and T-178-153, the artifacts-produced block and the output block. Its verify line is one very long line: read it with a search for the quoted tokens, not whole.
    - `$P/178-VALIDATION.md`: the three rows that begin `| 178-04-0`.
    - `$P/178-24-PLAN.md`: the truth that begins "Every item of the operator's round stands".
    - This plan's § *The (b) form*, § *Sites found on the planning day* and § *How the population is derived*.
  </read_first>
  <action>
1. Derive the population: run the four searches of § *How the population is derived* and keep their output. The list of § *Sites found* is where to begin, not what to trust: a hit outside it is judged by the same rule, and a listed place the search no longer finds is reported, not hunted by line number.

2. `$P/178-04-PLAN.md`: bring every place listed for it to § *The (b) form*. Task 3 is rewritten as one piece — it keeps its number, its `type` and `tdd` attributes, its red-first step and its evidence file names. State the every-call form positively: the names that exist only under the other form are not carried into the plan as things to avoid. Ruling 2 cites the form's citation line and says what the Admin App's calls now cost. The threat register keeps its ids and its column count; the row of T-178-22 changes disposition and says who accepted.

3. `$P/178-14-PLAN.md`: bring every place listed for it to the same form. In the `node -e` script of Task 2's verify make exactly the two changes named and no other; the script stays one line and holds no single quote. Add the eleventh ruling. The three PL-29 places gain the operator's acceptance and lose nothing else.

4. `$P/178-24-PLAN.md`, the row of `$P/178-VALIDATION.md` and the two rows of the names table in `$P/178-EXECUTION-RULES.md`: as listed.

5. Every other hit of step 1 is read and judged; nothing true under both forms is edited. Research, pattern map, UI contract and context are not opened for editing: the execution rules' sentence on the later reading (Task 1) is what settles them.

6. Run this task's automated block. When it names something still stated, fix the place it names; never weaken the block.

7. When the block exits 0, commit the changed files by pathspec, subject `docs(178): the plans changed to J1 (b) — the password fact is filled on every read of the user-level data and the method's option goes; each Admin job poll and page load makes one more round trip`.
  </action>
  <acceptance_criteria>
    - No plan and no row of the validation map holds a name or a sentence that exists only under the on-request form; plan 178-04 holds `passwordSet: boolean`, the seven-row list and the integration test's path; its T-178-22 row is `accept`, dated, and names the Admin App.
    - Plan 178-14's verify looks for the call with no argument; plan 178-24's truth names (b); the validation row names `integration`.
    - No "unanswered" sentence lists J1 or PL-29.
    - All 24 plans pass the structure and frontmatter validators; every verify block of every plan parses and every script inside one passes a syntax check.
    - Research, pattern map, UI contract, context, round file, roadmap and requirements are unchanged.
  </acceptance_criteria>
  <verify>
    <automated>export PATH="$HOME/.nvm/versions/node/v24.21.0/bin:$PATH" && P=.planning/phases/178-sign-in-email-code-registration && Q=.planning/quick/261011-ujg-apply-the-operator-s-reading-of-section- && GT="$HOME/.claude/gsd-core/bin/gsd-tools.cjs" && W="$(mktemp -d)" && B="$(cat $Q/261011-ujg-BASE)" && git cat-file -e "$B^{commit}" && for n in "GetBasicUserDataOptions" "GateUserData" "passwordSet?: boolean" "getBasicUserData({ passwordSet" 'pattern: "passwordSet: true"' "J1 (a)" "makes no extra round trip" "nobody asks yet" "default call makes none" "178-04-close --rows typecheck,lint,unit" "does not ask for the fact"; do { grep -q -F -e "$n" $P/178-*-PLAN.md $P/178-VALIDATION.md; test $? -eq 1; } || { echo "still stated: $n"; exit 1; }; done && grep -h -F "unanswered" $P/178-*-PLAN.md > $W/un.txt && { grep -q -E 'items? (((J|U-|PL-)[0-9]+[a-d]?|and|to)[, ]*)*(J1|PL-29)[, ]+(((J|U-|PL-)[0-9]+[a-d]?|and|to)[, ]*)*(is|are) unanswered' $W/un.txt; test $? -eq 1; } && awk '/^## Names this phase introduces/,/^## Items built at the recommended option/' $P/178-EXECUTION-RULES.md > $W/names.txt && grep -q -F "BasicUserData.passwordSet: boolean" $W/names.txt && { grep -q -F -e "GetBasicUserDataOptions" -e "GateUserData" $W/names.txt; test $? -eq 1; } && grep -q -F "passwordSet: boolean" $P/178-04-PLAN.md && grep -q -F "178-04-close --rows typecheck,lint,integration,unit,check-frontend,build,format" $P/178-04-PLAN.md && grep -q -F "supabaseDataWriter.integration.test.ts" $P/178-04-PLAN.md && { grep -q -F "universalDataWriter.ts" $P/178-04-PLAN.md; test $? -eq 1; } && grep -F "| T-178-22 |" $P/178-04-PLAN.md > $W/t22.txt && test "$(grep -c "" $W/t22.txt)" = "1" && grep -q -F "| accept |" $W/t22.txt && grep -q -F "Admin" $W/t22.txt && grep -q -F "2026-10-11" $W/t22.txt && grep -q -F 'l.indexOf("getBasicUserData()")' $P/178-14-PLAN.md && grep -F "Every item of the operator's round stands" $P/178-24-PLAN.md > $W/t24.txt && grep -q -F "(b)" $W/t24.txt && grep -F "| 178-04-03 |" $P/178-VALIDATION.md > $W/v43.txt && grep -q -F "integration" $W/v43.txt && for f in $P/178-*-PLAN.md; do node "$GT" query verify.plan-structure "$f" > $W/ps.json || { echo "structure: $f"; exit 1; }; node "$GT" query frontmatter.validate "$f" --schema plan > $W/fm.json; grep -q -F '"valid": true' $W/fm.json || { echo "frontmatter: $f"; exit 1; }; done && node -e 'const fs=require("fs");const dir=process.argv[1];const o="<"+"automated>";const c="</"+"automated>";let nb=0;let nj=0;for(const f of process.argv.slice(2)){const t=fs.readFileSync(f,"utf8");const re=new RegExp(o+"([\\s\\S]*?)"+c,"g");let m;while((m=re.exec(t))){const b=m[1];fs.writeFileSync(dir+"/blk-"+(nb++)+".sh",b+"\n");let at=0;for(;;){const a=b.indexOf("node -e \x27",at);if(a<0)break;const e=b.indexOf("\x27",a+9);if(e<0){console.log("an unclosed script in "+f);process.exit(1)}fs.writeFileSync(dir+"/js-"+(nj++)+".js",b.slice(a+9,e));at=e+1}}}if(!nb||!nj)process.exit(1)' $W $P/178-*-PLAN.md && for f in $W/blk-*.sh; do bash -n "$f" || { echo "does not parse: $f"; exit 1; }; done && for f in $W/js-*.js; do node --check "$f" || { echo "script: $f"; exit 1; }; done && git diff --quiet "$B" -- $P/178-CONTEXT.md $P/178-RESEARCH.md $P/178-PATTERNS.md $P/178-UI-SPEC.md $P/178-OPERATOR-ROUND .planning/ROADMAP.md .planning/REQUIREMENTS.md && git diff --name-only "$B" > $W/changed.txt && { grep -q -v -E '^\.planning/(phases/178-sign-in-email-code-registration/178-([0-9]+-PLAN|EXECUTION-RULES|VALIDATION)\.md|v2\.16-OPERATOR-DECISIONS-2026-10-09\.md|STATE\.md|quick/261011-ujg-[^/]+/[^/]+)$' $W/changed.txt; test $? -eq 1; }</automated>
    <fails_when>non-zero exit: a name or a sentence of the on-request form still in a plan or in the validation map (the block prints which); an "unanswered" sentence that still lists J1 or PL-29; a names table without the boolean member or with the options type or the narrowed gate type; plan 178-04 without the boolean member, the seven-row list or the integration test's path, still naming the base-class file, or with a T-178-22 row that is doubled, not accepted, undated or silent on the Admin App; plan 178-14's verify not looking for the call with no argument; plan 178-24's truth without (b); the validation row without `integration`; a plan that fails a validator (printed); a verify block that does not parse or a script inside one with a syntax error (printed); a changed context, research, pattern map, UI contract, round file, roadmap or requirements file; a changed path outside the phase's plans, rules and validation map, the decision document, the state file and this quick task's directory. Whether the edits are committed is asserted by Task 3's block.</fails_when>
  </verify>
  <done>What Phase 178 will build is what the operator ruled: the fact on every read of the user-level data, the cost to the Admin App said and accepted in the plan that makes it, and no plan left that would stop on a contradiction between itself and another.</done>
</task>

<task type="auto">
  <name>Task 3: The reading on the record, and the phase ready to execute</name>
  <reversibility rating="reversible">One paragraph, one table cell and four frontmatter values.</reversibility>
  <files>.planning/v2.16-OPERATOR-DECISIONS-2026-10-09.md, .planning/STATE.md</files>
  <read_first>
    - `$D`: the index table at the top, and `## Fill status` down to the paragraph that begins "**Found while Phase 177 was executed" — the three "Read on" paragraphs are the style.
    - `.planning/STATE.md`: its frontmatter only.
    - This plan's § *The text for the record*.
  </read_first>
  <action>
1. `$D`, under `## Fill status`: add the paragraph of § *The text for the record* at the place named there, on one line, with a blank line on each side. Correct any fact of it that the execution found otherwise. No other line below that heading changes.

2. `$D`, the index table: the one cell of the row for section H, as given. No line between `## A.` and `## Fill status` is edited, and no box is touched.

3. `.planning/STATE.md`: the four frontmatter keys as given, by scoped edits. Nothing else of the file — not `current_phase`, `status`, `progress` or `state_head`, and nothing of the body. `.planning/ROADMAP.md` is not touched.

4. Commit by pathspec, subject `docs(178): section H read on 2026-10-11 — H1 (b), H38 (a) accepted, every other item and the UI contract's thirty proposals at their recommended options; the phase is ready to execute`. The commit takes `$D` and `.planning/STATE.md`. When the instructions this executor was dispatched with forbid it to commit `.planning/STATE.md`, that one file stays in the working tree and the summary says so; the block below reads the working tree and passes either way.

5. Run this task's automated block, after the commit: it is the one block that asserts nothing of the phase directory or the decision document is left uncommitted. A failure is fixed in a further commit and the block run again.
  </action>
  <acceptance_criteria>
    - Everything of `$D` from `## A.` to `## Fill status` is byte-equal to the base commit's; above it only the section H row changed; below it only the one paragraph was added.
    - The paragraph is one line and names H1 (b), H2 to H38, H38 (PL-29) with (a), U-01 to U-30, the method, the Admin App, plan 178-01, the keystrokes and this quick task.
    - `stopped_at` says Phase 178 is ready to execute; only the four keys of the state file changed.
    - Nothing outside `.planning/` changed, nothing of the phase directory or the decision document is uncommitted, and `CAND-APP-PLAN.md` is still untracked.
  </acceptance_criteria>
  <verify>
    <automated>export PATH="$HOME/.nvm/versions/node/v24.21.0/bin:$PATH" && P=.planning/phases/178-sign-in-email-code-registration && Q=.planning/quick/261011-ujg-apply-the-operator-s-reading-of-section- && D=.planning/v2.16-OPERATOR-DECISIONS-2026-10-09.md && S=.planning/STATE.md && W="$(mktemp -d)" && B="$(cat $Q/261011-ujg-BASE)" && git cat-file -e "$B^{commit}" && git show "$B:$D" > $W/base.md && awk '/^## A\./,/^## Fill status/' $W/base.md > $W/body-base.txt && awk '/^## A\./,/^## Fill status/' $D > $W/body-now.txt && test -s $W/body-now.txt && cmp -s $W/body-base.txt $W/body-now.txt && awk '/^## A\./{exit} {print}' $W/base.md > $W/top-base.txt && awk '/^## A\./{exit} {print}' $D > $W/top-now.txt && grep -v -F "| H — Phase 178" $W/top-base.txt > $W/top-base-rest.txt && grep -v -F "| H — Phase 178" $W/top-now.txt > $W/top-now-rest.txt && cmp -s $W/top-base-rest.txt $W/top-now-rest.txt && grep -F "| H — Phase 178" $W/top-now.txt > $W/row.txt && test "$(grep -c "" $W/row.txt)" = "1" && grep -q -F "2026-10-11" $W/row.txt && { grep -q -i -F "held" $W/row.txt; test $? -eq 1; } && awk 'f{print} /^## Fill status/{f=1}' $W/base.md > $W/fill-base.txt && awk 'f{print} /^## Fill status/{f=1}' $D > $W/fill-now.txt && grep -F "**Read on 2026-10-11, section H and the UI contract" $W/fill-now.txt > $W/para.txt && test "$(grep -c "" $W/para.txt)" = "1" && for n in "H1 (b)" "H2 to H38" "H38 (PL-29)" "(a)" "U-01 to U-30" "getBasicUserData" "Admin" "178-01" "keystrokes" "261011-ujg"; do grep -q -F -e "$n" $W/para.txt || { echo "the paragraph lacks: $n"; exit 1; }; done && grep -v -F "**Read on 2026-10-11, section H and the UI contract" $W/fill-now.txt > $W/fill-now-rest.txt && grep -v '^$' $W/fill-now-rest.txt > $W/fa.txt && grep -v '^$' $W/fill-base.txt > $W/fb.txt && cmp -s $W/fa.txt $W/fb.txt && grep -E '^stopped_at: ' $S > $W/stop.txt && test "$(grep -c "" $W/stop.txt)" = "1" && grep -q -F "Phase 178" $W/stop.txt && grep -q -F "ready to execute" $W/stop.txt && { grep -q -F "held until" $W/stop.txt; test $? -eq 1; } && grep -E '^last_activity_desc: ' $S > $W/desc.txt && { grep -q -F "planned and held" $W/desc.txt; test $? -eq 1; } && git diff -U0 "$B" -- $S > $W/state.diff && grep -E '^[+-][^+-]' $W/state.diff > $W/state-lines.txt && { grep -q -v -E '^[+-](stopped_at|last_updated|last_activity|last_activity_desc): ' $W/state-lines.txt; test $? -eq 1; } && git diff --quiet "$B" -- .planning/ROADMAP.md .planning/REQUIREMENTS.md && git diff --name-only "$B" > $W/changed.txt && { grep -q -v -E '^\.planning/(phases/178-sign-in-email-code-registration/178-([0-9]+-PLAN|EXECUTION-RULES|VALIDATION)\.md|v2\.16-OPERATOR-DECISIONS-2026-10-09\.md|STATE\.md|quick/261011-ujg-[^/]+/[^/]+)$' $W/changed.txt; test $? -eq 1; } && git status --porcelain -- $P $D > $W/st.txt && test ! -s $W/st.txt && git diff --quiet HEAD -- . ':(exclude).planning' && { git ls-files --error-unmatch CAND-APP-PLAN.md > /dev/null 2>&1; test $? -eq 1; }</automated>
    <fails_when>non-zero exit: a changed line between `## A.` and `## Fill status` (a box, a stray keystroke, an edited item); a changed line above `## A.` other than the section H row; a section H row that is absent, doubled, undated or still says the section waits; no paragraph of the reading under Fill status, two of them, or one that lacks a named fact (printed); any other change below that heading; a `stopped_at` that is absent, doubled, silent on Phase 178, not saying it is ready, or still saying it waits; the old activity line; a changed line of the state file outside the four keys, or none changed; a changed roadmap or requirements file; a changed path outside the allowed set; an uncommitted change in the phase directory or the decision document; a change outside `.planning/`; or `CAND-APP-PLAN.md` tracked.</fails_when>
  </verify>
  <done>The reading is on the record in the operator's own document, in the words of the earlier readings, and the state file says what is true: Phase 178 is planned, read and ready to execute — and not started.</done>
</task>

</tasks>

<threat_model>
## Trust Boundaries

| Boundary | Description |
|----------|-------------|
| the operator's document → what the plans build | a tick, a note or a stray keystroke decides what Phase 178 may build |
| the reading rule → the phase's halt | one accepted exception must not become a rule that accepts |
| a plan → the plan after it | a name one plan drops and another still requires stops the phase mid-way |

## STRIDE Threat Register

| Threat ID | Category | Component | Severity | Disposition | Mitigation Plan |
|-----------|----------|-----------|----------|-------------|-----------------|
| T-261011-01 | Tampering | a reply nobody read applied as if it were none: an uncommitted change of the decision document beyond the two stray lines, swept away by a checkout | high | mitigate | the diff is read before anything is restored and anything else in it stops the task; afterwards the document is byte-equal to the base, and at the end everything from `## A.` to `## Fill status` still is (Tasks 1 and 3; PROH-261011-02) |
| T-261011-02 | Elevation of privilege | the halt weakened for other items — a generic second option an executor may build | high | mitigate | the applied table holds one entry and one accepted state; the proof ticks another item's (b) and sees it halt, and reads section `F`, whose F1 holds a (b), and sees it halt (Task 1; PROH-261011-03) |
| T-261011-03 | Repudiation | the plans build (b) while the document later says something else, and the phase runs on | medium | mitigate | H1 untouched, ticked on its ★ or ticked elsewhere halts under the rule, seen on scratch documents; plan 178-01's verify requires the facts line `- H1: applied (b)` and exactly one applied line (Task 1) |
| T-261011-04 | Tampering | a plan left half-changed: one plan drops the narrowed gate type or the options type and another still requires it, so an executor stops on a contradiction or builds the overruled form | medium | mitigate | the population is derived by search when the task runs; names and sentences of the on-request form are refused in every plan and in the validation map; all 24 plans are validated and every verify block parsed (Task 2) |
| T-261011-05 | Denial of service | a consequence of (b) left unsaid: the Admin App's extra round trip, and a failed read now failing every caller | low | mitigate | both are stated in plan 178-04 — truth, ruling 2, T-178-20 and T-178-22 (accepted by the operator's ruling, dated) — and the plan gains an integration case over the live read (Task 2) |
| T-261011-SC | Tampering | npm/pip/cargo installs | low | accept | this plan installs no package |
</threat_model>

<verification>
Each task's automated block, run with `bash` from a script file. Together they hold: the decision document equal to the base outside the index row and the Fill status paragraph; the reading rule seen accepting once and refusing four ways; the on-request form gone from the plans and the validation map; 24 plans valid and parsing; the reading recorded; the state file changed in four keys.

Not run, and said so in the summary: the rewritten verify blocks of plans 178-01, 178-04 and 178-14 are parsed, not executed — they run when Phase 178 does.
</verification>

<success_criteria>
`.planning/phases/178-sign-in-email-code-registration/178-OPERATOR-ROUND` still names section H of the decision document; plan 178-01's reading of it, as the plan now states the rule, gives H1 applied and no halt; every plan builds J1 (b) and says what it costs the Admin App; the reading of 2026-10-11 is under Fill status; the state file says Phase 178 is ready to execute; and no plan of Phase 178 has been run.
</success_criteria>

<output>
Create `.planning/quick/261011-ujg-apply-the-operator-s-reading-of-section-/261011-ujg-SUMMARY.md` when done, with `status: complete` in its frontmatter. Record: the base commit; what `git diff` showed for the decision document before anything was restored; the proof's seven outcomes with their exit statuses; every place changed, by file and quoted anchor; every search hit left untouched that § *Sites found* does not list, with the reason; every listed place the search no longer found; the three commits; and, as items for the orchestrator, the consequences of (b) this plan settled without a ruling — the narrowed gate type goes, a failed read fails the Admin identity check too, plan 178-04's closing gate set gains the integration row and one integration case, the index row's cell — and that the rewritten verify blocks were parsed and not run.
</output>
