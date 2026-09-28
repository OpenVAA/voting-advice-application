# Phase 158: Routing & Auth Surface Harmonisation - Context

**Gathered:** 2026-08-28
**Status:** Ready for planning
**Source of decisions:** `.planning/v2.15-DISCUSSION-POINTS.md` § G (G1–G5), § 0 facts 21–23, § N (N1–N3)
**Depends on:** Phase 157 — Adapter Boundary & Typing

<domain>
## Phase Boundary

After this phase the frontend has **one** login implementation behind three thin entry points,
**one** module that declares every cookie name the app writes, and **one** discoverable directory
where route strings and route patterns are defined — and a test fails when a fourth appears.

Delivers, per the operator's filled decision document:

1. **A new `$lib/routes/` locus** (it does not exist today) holding the relocated `buildRoute.ts`,
   `route.ts`, `loginRedirectTarget.ts`, and the `(protected)` route pattern, plus the import codemod
   that follows the move.
2. **A written proposal** — not a migration — for what else should move out of `lib/utils/` and
   directly under `lib/` (G1 **NOTES**, binding).
3. **`$lib/cookies/`** — a frozen const map of the four cookie names, plus a source test with two
   failure modes: a cookie-name literal at a write site, and two colliding names.
4. **A shared login helper in `$lib/auth`**, with `admin/login`, `candidate/login` and
   `api/auth/login` kept as their own thin entry points.
5. **`route.id`-based candidate matching in `hooks.server.ts`**, replacing the subpath-unsafe
   `pathname.includes('/candidate')`, with consistency between pattern / route tree / hook enforced
   by test.
6. **The two readability/test-hygiene fixes** at `candidate/(protected)/+page.svelte` and
   `candidate/(protected)/profile/+page.svelte`, plus the root-layout title and theme-colour edits.
7. **Six follow-up review comments filed** into `.planning/todos/pending/`, **classified
   blocking / non-blocking, with the classification recorded**, and the blocking ones implemented
   inside Phase 158 or 159 (G5 **NOTES**, binding).

Requirements: REVIEW-RT-01..07.
Source: 27 review comments on PR #870 — the largest single bucket
(`.planning/PRE-SHIP-REVIEW-TRIAGE.md:245-317`).

**Not in scope:**
- Mass-moving anything out of `lib/utils/` — G1's NOTES buys a *proposal document*, and nothing more.
  A planner that turns this into a sweep has exceeded the decision.
- Merging the three login routes into one route, or adding a role parameter to a login path
  (both explicitly rejected — see D-G3).
- Implementing the *non*-blocking follow-ups (D-G5).
- The `$effect` census, component consolidation and context work — Phase 159.
- Renaming/restructuring `logDebugError` and the adapter-leakage source test — Phase 157 criterion 6.

## Upstream dependency — what 158 assumes 157 has delivered

`Depends on: 157` — the adapter boundary must exist before routes stop reaching through it.
Concretely, 158 assumes 157 has landed:

- **157-6: the adapter-specifics source test**, with an explicit allowed-loci list. 158 moves route
  and auth code between loci; that test is the thing that keeps the move from re-leaking Supabase
  into `routes/`. Several of 158's own review comments
  (`admin/login/+page.server.ts:27`, `candidate/auth/callback/+server.ts:8`,
  `candidate/preregister/+layout.server.ts:9`, `api/candidate/preregister/+server.ts:16`) ask for
  exactly that boundary from the routing side.
- **157-1/157-2: validated (not cast) adapter reads**, so the shared `$lib/auth` login helper of
  D-G3 can consume typed results rather than re-casting at the route layer.
- **157-6: `logDebugError` renamed and reworked** into structured output. Login routes call it
  (`admin/login/+page.server.ts:29`); 158 must use the post-157 name, not reintroduce the old one.

If 157 slips, D-G3's helper still lands, but the "nothing outside the adapter knows Supabase exists"
half of the login-collapse comments cannot be discharged inside 158.

</domain>

<decisions>
## Implementation Decisions

**Provenance and reading rule.** These come from `.planning/v2.15-DISCUSSION-POINTS.md`, an
all-options checkbox document filled by the operator. Its own stated semantics
(`:11-24`): exactly one option per decision carries `★ RECOMMENDED`; **all boxes unchecked = the ★
option is chosen** (not undecided); a ticked non-recommended box overrules the ★; and
`**EDIT:** / **NOTE:** / **NOTES**:` free text **beats every box**.

Phase 158 owns five decisions (G1–G5), two of them ⚠ DECIDE. **Two carry binding operator free
text** — G1 and G5 — and both *enlarge* the phase beyond what the ticked box alone says.

---

### D-G1 ⚠ DECIDE — Where does the centralised routes locus live?

**Won: option (a) — BY TICK** (the operator ticked (a); it was also the ★).

**Decision.** Create `apps/frontend/src/lib/routes/` and move into it:
- `apps/frontend/src/lib/utils/route/buildRoute.ts`
- `apps/frontend/src/lib/utils/route/route.ts`
- `apps/frontend/src/routes/loginRedirectTarget.ts`
- the `(protected)` route pattern (new — it is not defined anywhere today; see D-G4)

Then run one import codemod. Rejected: (b) keeping `lib/utils/route/` — "the locus stays buried
under `utils/`, where the next author looking for route definitions will not find it, and criterion
5's named path stays wrong"; (c) a new `$routes` alias — "adds a fifth path alias and collides
conceptually with SvelteKit's own `src/routes`".

**Rationale (verbatim from the ★ line):** "matches the reviewer's named path, and a 'routes'
directory that is discoverable by name is the point of centralising. One import codemod."

**Operator free text — VERBATIM, BINDING:**

> **NOTES**: Also, sweep other content of lib/utils and make a proposal of other sections to move directly to lib.

**How this is to be read.** The NOTES adds a **second deliverable: a proposal document** covering the
rest of `lib/utils/`, naming which sections should move directly under `lib/` and which should stay.
It is **a proposal, not a migration.** No file outside the four named above moves in Phase 158 on the
strength of this note. The proposal is the artifact; acting on it is a later decision.

**Measured input for the proposal** (`apps/frontend/src/lib/utils/`, measured 2026-08-28):
- Subdirectories: `aria/` (1 file) · `color/` (8) · `matching/` (10) · `questions/` (2) ·
  `route/` (8, of which 2 leave under this decision) · `text/` (3)
- 28 top-level `.ts` files, 1194 lines total; largest are `matches.ts` (119), `sorting.ts` (77),
  `links.ts` (71), `components.ts` (57), `entityDetails.ts` (52), `settings.ts` (51).
- `lib/` already has these siblings for the proposal to reason against: `_guards`, `admin`, `api`,
  `auth`, `candidate`, `components`, `contexts`, `dynamic-components`, `i18n`, `paraglide`,
  `server`, `supabase`, `types`, `utils`.

**Codemod scope, measured:** 24 files import from `utils/route` (8 under `lib/`, 16 under `routes/`);
`loginRedirectTarget` has exactly 2 importers plus 1 doc reference
(`routes/candidate/login/+page.server.ts:13`, `routes/admin/login/+page.server.ts:15`,
`routes/README.md:18`).

**Open sub-question the planner must settle:** `lib/utils/route/` also holds `filterPersistent.ts`,
`impliedParams.ts`, `params.ts`, `parseParams.ts` (+ `parseParams.test.ts`) and an `index.ts`
barrel re-exporting all five. The decision names only `buildRoute.ts` and `route.ts` as moving.
Splitting the directory leaves a two-locus barrel; moving all of it exceeds the decision's letter.
Recommend the planner move the whole `route/` directory and record the widening — but this is a
deviation to be raised, not assumed.

---

### D-G2 — Cookie name const module

**Won: option (a) — BY DEFAULT** (no box ticked; the ★ option stands).

**Decision.** Create `apps/frontend/src/lib/cookies/index.ts` exporting a **frozen const map** of the
cookie names, plus **a source test with exactly two failure modes**: (i) it fails when a cookie-name
*literal* appears at a write site, and (ii) it fails when two cookie names collide.

**Rationale (verbatim from the ★ line):** "criterion 2 asks for exactly both failure modes, and a
dedicated module is the reviewer's named location."

Rejected: (b) putting the consts in the D-G1 routes locus — "cookies are not routes, and the
collision test then has to reach into an unrelated file"; (c) per-file consts — "does nothing about
collisions, which is the stated reason for the ask."

**Reviewer's original ask** (`api/oidc/authorize/+server.ts:31`): "Move cookie names into a const so
that they match between files. Check **all** cookies written by the app and move those in the same
const as well and place it in `lib/cookies` or so that we can make sure cookie names never overlap."
Note the reviewer's word is *all* — the boundary question in `<open>` matters.

---

### D-G3 ⚠ DECIDE — What shape does the login collapse take?

**Won: option (a) — BY TICK** (the operator ticked (a); it was also the ★).

**Decision.** **One shared server helper in `$lib/auth`.** The three route files —
`routes/admin/login/+page.server.ts`, `routes/candidate/login/+page.server.ts`,
`routes/api/auth/login/+server.ts` — **keep their own entry points** and become thin wrappers over
that helper.

**Rationale (verbatim from the ★ line):** "admin and candidate have genuinely different redirect
targets and permission mappings (`admin/login/+page.server.ts:43`), so a single route would grow a
role switch; a shared helper removes the duplication without inventing that switch."

Rejected: (b) funnelling all three through `/api/auth/login` — "form actions and a JSON endpoint have
different error and redirect semantics, so this forces one of them to be emulated"; (c) a single route
with a role parameter — "the role parameter is attacker-controlled input on the login path, which is
the wrong place to add one."

> ⚠ **How this rewrites roadmap criterion 1.** Criterion 1 reads: "The admin, candidate and
> generic-API login paths are collapsed onto shared logic. **If the generic `/api` login route is left
> unused by the collapse, it is deleted rather than kept.**" Under D-G3(a) the three entry points are
> **kept by construction** — that is the whole content of the decision. The deletion clause is
> therefore **conditional and, on this choice, does not fire**: `api/auth/login/+server.ts` is not
> left unused, it is one of the three thin wrappers. A planner must not read criterion 1 as
> mandating the deletion.
>
> The clause is not dead, though. It fires only if, during implementation, the `/api` JSON login
> endpoint turns out to have **no caller at all** in the app. That is a fact to *measure* during
> planning (grep for callers of `/api/auth/login`), not to assume in either direction. Record the
> measurement either way, so the verifier can see why the clause did or did not fire.

**Also folded in by criterion 5 and the triage comments:**
- The permissions mapping at `admin/login/+page.server.ts:43` (`['project_admin','account_admin',
  'super_admin']`) is extracted to the same shared `$lib/auth` utility — the reviewer's words: "This
  should be extracted to a `/lib/auth` or so utility for centralised permissions mapping."
- `routes/candidate/auth/callback/+server.ts` and `routes/candidate/auth/logout/+server.ts` move
  under the generic `/api` routes so admin can reuse them
  (triage `candidate/auth/callback/+server.ts:8`, `candidate/auth/logout/+server.ts:1`).
- `lib/auth/` already exists (`getUserData.ts`, `index.ts`) — this is an addition to a real
  directory, not a new locus.

---

### D-G4 — `hooks.server.ts` — the subpath-unsafe `pathname.includes('/candidate')`

**Won: option (a) — BY DEFAULT** (no box ticked; the ★ option stands).

**Decision.** **Match on `route.id` instead of `pathname`.**

**Rationale (verbatim from the ★ line):** "base-path safe by construction, consistent with the
`(protected)` check two lines below, and needs no regex."

Rejected: (b) an anchored `pathname` regex incorporating `base` — "reintroduces the class of bug the
reviewer flagged the moment `base` is misconfigured"; (c) both — "a redundant second condition that
can drift out of agreement."

**Reviewer's original ask:** "The check must be more restrictive because candidate might be used on a
subpath. Also, move all path definitions to the centralised routes locus. Define the `(protected)`
pattern there as well and add tests to enforce consistency." — i.e. D-G4 and D-G1 are one comment;
the `(protected)` pattern's new home is the `$lib/routes/` locus D-G1 creates, and the
consistency test spans pattern ↔ route tree ↔ hook.

⚠ **DO NOT CITE LINE NUMBERS FOR `hooks.server.ts`. Cite the expressions.** (Decision C1(a),
`158-DISCUSSION-POINTS-ADDENDUM.md`.) The three anchors have drifted **four times in eight days**.
Measured at HEAD `bea81d1a8` (2026-09-01): `const { url, route } = event;` at `:80`,
`pathname.includes('/candidate')` at `:90`, `route.id.includes('(protected)')` at `:95`, and the two
hand-built redirects at `:93` and `:97` — the fourth drift, caused by Phase 157.1's `PUBLIC_LOG_LEVEL`
work (`e65ac3b84`, `553d71a5b`) landing above them. Every number in this file and in the ROADMAP
entry is a historical record, not guidance. **Navigate by the expression, always.**

---

### D-G5 — Six review comments say "add as a follow-up task", not "fix"

**Won: option (a) — BY TICK — but its scope is overruled by the operator's NOTES.**

The ticked box (a) reads: "File each as a `.planning/todos/pending/` item during its owning phase;
**implement none**." Its ★ rationale: "the reviewer explicitly asked for follow-ups, and the repo's
todo register is where they become findable. Two of them (`QuestionChoices` UAT, `admin/login`
supabase-independence) are marked *blocking*, so they need a register entry with that flag, not
silent deferral."

**Operator free text — VERBATIM, BINDING:**

> **NOTES**: Implement the blocking ones within 158/9 or so.

**⚠ The tick and the NOTES are in direct tension.** The tick says *implement none*; the NOTES says
*implement the blocking ones*. Per the document's own precedence rule (`:15` — "free text beats
every box"), **the NOTES wins.**

**RESOLUTION — the binding reading of D-G5:**

1. **File all six** into `.planning/todos/pending/`, during the phase that owns each comment, with
   the file:line anchor preserved (that anchor is the reason todos are chosen over ROADMAP backlog
   entries — see D-N2).
2. **Classify each of the six blocking / non-blocking, and record the classification** — in the todo
   file's front matter *and* in the phase's summary artifact. This classification is itself a
   deliverable: it is the thing that makes the NOTES actionable, and without it "implement the
   blocking ones" has no referent.
3. **Implement the ones classified blocking inside Phase 158 or Phase 159** (the operator's "158/9 or
   so"), in whichever of the two owns that comment's file. The non-blocking ones stay filed and
   unimplemented.

**The six comments, with anchors verified on the tree 2026-08-28:**

| # | Anchor | Comment (verbatim from triage) | Owning phase | Reviewer marked "blocking"? |
|---|---|---|---|---|
| 1 | `apps/frontend/src/routes/Banner.svelte:9` | "Add this is as a follow up task." (the file's own `### TODO`: allow layouts to insert arbitrary content in the header, make this a static component) | 158 | no |
| 2 | `apps/frontend/src/routes/Header.svelte:44` | "Add as a follow up task, refactoring the header style settings." | 158 | no |
| 3 | `apps/frontend/src/routes/(voters)/(located)/questions/+layout.svelte:144` | "Add a follow up for a e2e test targeting this behaviour." (the `onMount` once-per-session handler) | 158 | no |
| 4 | `apps/frontend/src/routes/candidate/preregister/(authenticated)/elections/+page.svelte:1` | "Add a follow-up task: harmonise election and constituency selection logic with the Voter App (mainly `startFromConstituencyGroup` option)." | 158 | no |
| 5 | `apps/frontend/src/lib/api/dataProvider.ts:12` *(anchor is wrong on the tree — see `<open>`; the real line is `lib/server/api/dataProvider.ts:12`, the `default:` arm of the adapter switch)* | "We should add reintroducing the local adapter as a follow-up task." | **157** (triage line 236 falls in 157's bucket) | no |
| 6 | `apps/frontend/src/lib/components/questions/QuestionChoices.svelte:1` | "Add as a follow-up **blocking** task for me to UAT: - BooleanInput - multi-select choices" | **159** | **YES** |

So **of the six as enumerated, exactly one carries the reviewer's own "blocking" word** — #6, and it
is owned by Phase 159. See `<open>` for the discrepancy between this enumeration and the ★ line's
claim that *two* of the six are blocking.

Rejected: (b) implementing them all inside 158/159 — "roughly doubles both phases and pulls in a
Voter-App/Candidate-App harmonisation that is its own design problem" (note: the NOTES does **not**
select (b); it carves out only the blocking subset); (c) ROADMAP backlog — "loses the file:line
anchor that makes them actionable."

---

## Cross-cutting decisions that bind this phase

### D-N1 — 152's comment purge runs before this phase

**Won: option (a) — BY DEFAULT.** Phase 152 stays first and lands its planning-reference scan in
`yarn lint:check`, "so later phases cannot reopen the class."

**Consequence for 158:** every comment this phase writes — and 158 writes a lot of them, since it
moves files and adds two test modules — is authored **after** the guard is live and must satisfy the
new convention. Do not write `.planning/`-path references into source comments.

### D-N2 — Where the "follow-up task" comments land

**Won: option (a) — BY DEFAULT.** `.planning/todos/pending/`, filed during the owning phase, **with
the blocking ones flagged.** Rationale: "that register is already this project's mechanism (12 todos
filed in Phase 147), and `/gsd-discuss-phase` cross-references it automatically on future phases."

This is the destination D-G5 step 1 writes to. Existing register convention observed 2026-08-28:
`.planning/todos/pending/<YYYY-MM-DD>-<slug>.md`, `# Title` + `**Found:**` line + symptom/root-cause
prose. 106+ files present; `completed/` and `done/` siblings exist.

Rejected: (b) ROADMAP backlog — "loses the file:line anchor"; (c) GitHub issues — "splits the record
across two systems."

### D-N3 — How the discussion document becomes CONTEXT.md

**Won: option (a) — BY DEFAULT.** One `<padded>-CONTEXT.md` per phase (this file), generated from
that document's decisions for this phase, **plus a shared `<padded>-DISCUSSION-LOG.md` pointer back
to the source document.** Rationale: "a milestone-level file would make each planner read twelve
phases' worth of irrelevant decisions."

The DISCUSSION-LOG half of (a) is **not** created by this file — see `<open>`.

### D-0.1 — The 33-fact table is the run's factual baseline

**Won: option (c) — BY TICK** (the ★ was (a)). "Accept all 33 facts … **and** also correct
`.planning/ROADMAP.md:1003-1217` in place — the nine ⚑ rows are edited into the phase entries now,
so the roadmap stops carrying false premises."

That roadmap correction is **already applied** to the Phase 158 entry (it now carries a
"**Corrected 2026-08-28**" preamble restating criteria 3, 4, 5 against facts 21 and 23). One
correction it introduced is itself wrong — see fact 23 below.

### Claude's Discretion

- The internal file layout of `$lib/routes/` (flat vs. `route/` subdir preserved) and whether an
  `index.ts` barrel is kept, provided imports resolve by the codemod and the `(protected)` pattern
  is exported from there.
- The mechanism of the two source tests (D-G2's literal/collision test and D-G4's pattern↔hook
  consistency test) — AST rule, grep-based vitest, or ESLint rule — provided both stated failure
  modes are demonstrated failing before they are claimed to guard.
- The exact shape and filename of the D-G1 `lib/utils` proposal document, provided it lives in the
  phase directory and names sections, not individual files only.
- The signature and internal decomposition of the shared `$lib/auth` login helper.


### Decision index (machine-readable)

One bullet per decision above, in the grammar `plan-phase`'s decision-coverage gate parses.
The sections carry the reasoning and evidence; **this is an index, not a summary — plan from
the sections.** It lives inside `<decisions>` because the parser reads only this block when
one is present, and ignores `###` headings entirely.

- **D-G1:** Where does the centralised routes locus live
- **D-G2:** Cookie name const module
- **D-G3:** What shape does the login collapse take
- **D-G4:** `hooks.server.ts` — the subpath-unsafe `pathname.includes('/candidate')`
- **D-G5:** Six review comments say "add as a follow-up task", not "fix"
- **D-N1:** 152's comment purge runs before this phase
- **D-N2:** Where the "follow-up task" comments land
- **D-N3:** How the discussion document becomes CONTEXT.md
- **D-0.1:** The 33-fact table is the run's factual baseline

</decisions>

<facts>
## Measured Facts (verified on the tree, 2026-08-28, branch `integration/ship-12-squash`)

Facts 21, 22, 23 are this phase's rows from `.planning/v2.15-DISCUSSION-POINTS.md` § 0. **Every
line number below was re-measured for this document**, and one of the three does not hold.

### Fact 21 ⚑ — the routes locus does not exist yet — **CONFIRMED**

- `apps/frontend/src/lib/utils/route/` exists and contains: `buildRoute.ts`, `filterPersistent.ts`,
  `impliedParams.ts`, `index.ts`, `params.ts`, `parseParams.test.ts`, `parseParams.ts`, `route.ts`.
- **`apps/frontend/src/lib/routes/` does not exist.** `ls` → "No such file or directory".
- `apps/frontend/src/lib/utils/route/index.ts` is a 5-line barrel re-exporting
  `./buildRoute`, `./impliedParams`, `./params`, `./parseParams`, `./route`.
- **24 files** import from `utils/route` — 8 under `lib/`, 16 under `routes/`.
- `loginRedirectTarget.ts` is at **`apps/frontend/src/routes/loginRedirectTarget.ts`** — inside the
  SvelteKit route tree, *not* under `lib/` at all. Two importers:
  `routes/candidate/login/+page.server.ts:13` and `routes/admin/login/+page.server.ts:15`
  (both `import { safeRedirectTarget } from '../../loginRedirectTarget';`), plus a mention at
  `routes/README.md:18`. Reviewer comment on it: "Move this to `lib/routes`".
- **No `(protected)` pattern constant exists anywhere** — the only occurrence is the inline string
  in `hooks.server.ts` (fact 23). Criterion 4's "defined in that same locus" is therefore a
  *creation*, not a move.

**The roadmap agrees** (it was corrected this session to say `lib/routes` "is a destination this
phase *creates*"). Fact wins where it does not; here they concur.

### Fact 22 — cookies: 4 names, 5 files — **CONFIRMED (call-site count measured as 17, not 18)**

Four names: `id_token`, `oidc_state`, `oidc_nonce`, `oidc_code_verifier`.
**`apps/frontend/src/lib/cookies/` does not exist.**

Measured named-cookie call sites (`cookies.get|set|delete` with a literal name), excluding tests:

| File | Sites | Names |
|---|---:|---|
| `apps/frontend/src/routes/api/oidc/callback/+server.ts` | 9 | `oidc_state` (1 get, 2 delete) · `oidc_nonce` (1 get, 1 delete) · `oidc_code_verifier` (1 get, 1 delete) · `id_token` (1 set) |
| `apps/frontend/src/routes/api/oidc/authorize/+server.ts` | 2 | `oidc_state` (set, `:31`) · `oidc_nonce` (set) |
| `apps/frontend/src/routes/api/oidc/token/+server.ts` | 2 | `id_token` (set, delete) |
| `apps/frontend/src/routes/candidate/preregister/+layout.server.ts` | 2 | `id_token` (get, delete) |
| `apps/frontend/src/routes/api/candidate/preregister/+server.ts` | 2 | `id_token` (get, delete) |
| **Total** | **17** | across **5 files** — file count matches fact 22 exactly |

**Boundary cases the const module must decide about (see `<open>`):**
- `apps/frontend/src/lib/supabase/server.ts` — 2 further `cookies.getAll()` / `cookies.set(name, …)`
  calls. These are the Supabase SSR client's **name-agnostic** cookie bridge: they write Supabase's
  auth cookies under names Supabase chooses. A literal-detecting test must not false-positive here.
- `apps/frontend/src/lib/api/utils/auth/__tests__/authorize-endpoint.test.ts` — references cookie
  names in assertions. Tests are the likeliest home of the 18th site in fact 22's count.

Discrepancy is 17 vs. 18 and does not change any decision; it changes the codemod's expected-hit
count, so the planner should re-measure rather than trust either number blind.

### Fact 23 ⚑ — the subpath-unsafe match — **line numbers DO NOT HOLD; re-measured**

`apps/frontend/src/hooks.server.ts`, `candidateAuthHandle`, measured with `nl -ba`:

```
58  const candidateAuthHandle: Handle = async ({ event, resolve }) => {
59    const { url, route } = event;          <- route enters scope HERE (not :66)
60    const locale = getLocale();
61    const pathname = url.pathname;
62
63    // Skip non-route and API requests
64    if (route?.id == null || pathname.startsWith(NORMALIZED_API_ROOT)) {
65      return resolve(event);
66    }
67
68    // Handle candidate auth redirects                 <- :68 is the COMMENT
69    if (pathname.includes('/candidate')) {             <- THE DEFECT, at :69
70      const { session } = await event.locals.safeGetSession();
71      if (session && pathname.endsWith('candidate/login')) {
72        redirect(303, `/${locale}/candidate`);         <- :72 is a redirect, not the (protected) check
73      }
74      if (!session && route.id.includes('(protected)')) {   <- the (protected) check, at :74
75        const cleanPath = pathname.replace(new RegExp(`^/${locale}`), '');
76        redirect(303, `/${locale}/candidate/login?redirectTo=${cleanPath.substring(1)}`);
```

| Claim | Fact 23 / corrected ROADMAP say | **Measured** |
|---|---|---|
| `pathname.includes('/candidate')` | `:68` | **`:69`** |
| `route.id.includes('(protected)')` | `:72` | **`:74`** |
| `route` in scope | `:66` | **`:59`** |

The original roadmap value (`:69`) and the original PR-review anchor
(`.planning/PRE-SHIP-REVIEW-TRIAGE.md:250` — "`apps/frontend/src/hooks.server.ts:69`") were
**correct**; fact 23 shifted them by one line and the roadmap was then "corrected" to the wrong
value. `git log` confirms `hooks.server.ts` is unchanged since `0a7939aff`, so this is not drift —
fact 23 anchored on the comment line. The substance of fact 23 is unaffected: the defect is real,
`route.id` is available, and `:74` already demonstrates the safe idiom two lines below. **Use the
measured numbers.**

### Other anchors this phase's criteria name — all verified

- `apps/frontend/src/routes/admin/login/+page.server.ts:43` — the permissions mapping,
  `const isAdmin = userRoles.some((r) => ['project_admin', 'account_admin', 'super_admin'].includes(r.role));`
  ✅ exact. (`:27` is the Supabase `signInWithPassword` call the "blocking supabase-independence"
  comment targets.)
- `apps/frontend/src/routes/api/oidc/callback/+server.ts:30` —
  `throw redirect(303, '/candidate/preregister?error=' + encodeURIComponent(errorParam));` ✅ the
  hand-built return route criterion 3 names.
- `apps/frontend/src/routes/candidate/auth/callback/+server.ts:31` —
  `` redirect(303, `/${lang}/candidate/password-reset`); `` ✅ the second hand-built route
  ("Construct routes using `buildRoute`"). Note this is a **different file** from the one at `:30`;
  criterion 3's "`+server.ts:30` … and `:31`" reads as one file but is two.
- `apps/frontend/src/routes/candidate/(protected)/+page.svelte:38` — ✅ `if (candCtx.profileComplete) {`,
  the head of the branch chain inside `$derived.by`, each arm re-listing every prop (criterion 6).
- `apps/frontend/src/routes/candidate/(protected)/profile/+page.svelte` — ⚠ `:281` is the **start of
  the explanatory comment block** (`:281-288`); the test-only element itself is at **`:289`**
  (`<div data-testid="profile-image-error">`), wrapping an `<Input type="image">` whose own
  `containerProps` already carries `data-testid="profile-image-upload"` at `:297`. The comment
  block explains *why* the wrapper exists (Input's shared `<ErrorMessage>` at `:640-642` makes an
  inner testid ambiguous) — criterion 7's fix must answer that argument, not just delete the div.
- `apps/frontend/src/routes/+layout.svelte:212` — ✅ the maintenance title,
  `<title>{underMaintenance ? t('maintenance.title') : t('dynamic.appName')}</title>`. Reviewer's
  requested markup, verbatim: `{t('dynamic.appName')} {#if underMaintenance} – {t('maintenance.title')} {/if}`
- `apps/frontend/src/routes/+layout.svelte:215` — ✅ the light theme-colour default
  (`?? '#d1ebee'`). ⚠ There is a **second** one at **`:219`** (`?? '#1f2324'`, dark). Criterion 7
  says "theme-colour defaults" plural but cites only `:215`; **both** must go.

### Requirement IDs

`REVIEW-RT-01..07` are cited by the ROADMAP entry and by `gsd-tools query init.plan-phase 158`, but
**`.planning/REQUIREMENTS.md` contains zero `REVIEW-` identifiers** (`grep -c "REVIEW-"` → 0). The
seven success criteria in the ROADMAP entry are the only authoritative statement of them. See `<open>`.

</facts>

<open>
## Open Questions and Uncovered Ground

**Must be resolved during planning or research — none of these are settled by the decision document.**

1. **✅ SETTLED by decision C1(a) — this question is CLOSED. The answer is: never cite line numbers
   for `hooks.server.ts`.** The triple has now drifted **FOUR times**: `:59/:69/:74` (2026-08-28) →
   `:66/:76/:81` (2026-08-31, Phase 157's logger import) → **`:80/:90/:95` (2026-09-01 at HEAD
   `bea81d1a8`, Phase 157.1's `PUBLIC_LOG_LEVEL` work — `e65ac3b84`, `553d71a5b`)**; the two hand-built
   redirects moved `:72/:76` → `:79/:83` → **`:93/:97`**. Carried in as **OB-4** in
   `158-CARRIED-OBLIGATIONS.md`, which required exactly this re-measurement at HEAD before planning.
   **Standing rule for every plan, task and acceptance criterion in this phase: anchor on the
   EXPRESSION** (`const { url, route } = event;`, `pathname.includes('/candidate')`,
   `route.id.includes('(protected)')`), never on a number. Every number below and in the ROADMAP entry
   is a historical record, NOT current guidance.

   ~~Fact 23's line numbers are wrong and the ROADMAP was corrected to match them.~~ Measured (2026-08-28):
   the defect is at `hooks.server.ts:69`, `(protected)` at `:74`, `route` in scope at `:59`. The
   Phase 158 ROADMAP entry now says `:68` / `:72` / `:66` in two places (its "Corrected 2026-08-28"
   preamble and criterion 4). **Do not edit ROADMAP.md from this phase's planning** — flag it to the
   operator, or let the concurrently-running roadmap-correction agent own the re-fix. This context
   file is the authority on the numbers meanwhile.

2. **⚠ D-G5: the six-item list and the "two blocking" claim do not line up.** G5's ★ rationale says
   "Two of them (`QuestionChoices` UAT, **`admin/login` supabase-independence**) are marked
   *blocking*" — but `admin/login/+page.server.ts:27` is **not** among the six comments G5
   enumerates (the sixth slot is `dataProvider.ts:12`, "reintroduce the local adapter", which the
   reviewer did *not* mark blocking). Of the six as listed, only `QuestionChoices.svelte:1` carries
   the reviewer's word "blocking". Three readings are possible and the operator should pick:
   (i) the enumeration is authoritative → one blocking item, owned by Phase 159;
   (ii) the ★ prose is authoritative → the set is seven, and `admin/login:27` is the second blocking
   item, owned by Phase 158;
   (iii) `admin/login:27`'s blocking ask ("make this supabase independent in routes … add a source
   test for ensuring that no adapter-specifics find their way into routes, components or anywhere
   not especially allowed") is **already Phase 157 criterion 6**, in which case it is discharged
   upstream and needs only a cross-reference, not a todo.
   **Recommendation:** treat (iii) as likely and (ii) as the safe fallback — but the phase's own
   blocking/non-blocking classification deliverable (D-G5 step 2) is where this gets settled on
   the record.

3. **D-G5 item #5's anchor does not exist as cited.** The triage says
   `apps/frontend/src/lib/api/dataProvider.ts:12`, but that file is **one line**
   (`export { dataProvider } from './adapters/supabase/dataProvider';`). The comment's content
   ("reintroducing the local adapter") matches
   **`apps/frontend/src/lib/server/api/dataProvider.ts:12`** — the `default:` arm of a
   `switch (type)` whose `case 'local':` already imports `./adapters/local/dataProvider`. Confirm
   before filing the todo, so the anchor that justifies the todo-over-backlog choice is real.
   Also: this comment sits in **Phase 157's** triage bucket (line 236), not 158's — so under D-N2
   ("filed during the owning phase") it is 157's to file, not 158's.

4. **D-G1's sub-directory split.** `lib/utils/route/` holds six modules and a barrel; the decision
   names two as moving. Splitting leaves the barrel straddling two loci. Planner must choose and
   record: move the whole directory (recommended, a widening to be raised as a deviation) or split
   and re-point the barrel.

5. **D-G2's write-site boundary.** The reviewer said "check **all** cookies written by the app".
   `lib/supabase/server.ts` writes Supabase auth cookies through a name-agnostic bridge
   (`cookies.set(name, value, …)` where `name` comes from Supabase). Decide whether those are in
   scope for the const map (they cannot be — the app does not choose the names) and, either way,
   make sure the literal-detecting test does not false-positive on them. Fact 22's 18-vs-measured-17
   count likely turns on exactly this boundary plus the test file.

6. **`REVIEW-RT-01..07` have no entries in `.planning/REQUIREMENTS.md`.** The ROADMAP's seven success
   criteria are the only definition. Either backfill the requirement IDs or accept the criteria as
   authoritative and record that — otherwise the verifier has nothing to trace to.

7. **D-N3's DISCUSSION-LOG half is not delivered.** N3(a) specifies "one `<padded>-CONTEXT.md` per
   phase … **plus a shared `<padded>-DISCUSSION-LOG.md` pointer back here**". This file is the
   CONTEXT.md; the pointer file was out of scope for this write. Until it exists, this file's
   "Source of decisions" header line is the pointer.

8. **Roadmap requirements not otherwise covered by a G-decision** — carried here so nothing is lost,
   since G1–G5 do not dispose of all seven criteria:
   - **Criterion 3's `buildRoute` sweep** is broader than the two cited anchors. No decision fixes
     how far it reaches — how many hand-built route strings exist app-wide is unmeasured, and
     `hooks.server.ts:72,76` builds two more (`` `/${locale}/candidate` ``,
     `` `/${locale}/candidate/login?redirectTo=…` ``) that criterion 4's rewrite touches anyway.
     Measure before planning.
   - **Criterion 4's consistency test** (pattern ↔ route tree ↔ hook) has no chosen mechanism.
     Left to Claude's Discretion above, but its two failure modes should be demonstrated failing
     first, per this project's standing "prove the guard fails before claiming it guards" rule.
   - **Criterion 6** (`candidate/(protected)/+page.svelte:38`) — the reviewer also asks for "the
     possible badges defined at the same time"; no decision covers the badge-set shape.
   - **Criterion 7's testid rewrite** must survive the argument recorded in the `:281-288` comment
     and must not break the e2e specs that select `profile-image-error` / `profile-image-upload`.
     Which specs those are is unmeasured.
   - **Unbucketed triage comments in 158's list** that no criterion names:
     `hooks.server.ts:17` ("parameterise this dependent on the adapter configuration and rename to
     `dataAdapterHandle` if possible" — adjacent to Phase 157's boundary),
     `questions/+layout.ts:1` ("Try to drop this"),
     `questions/[questionId]/+page.svelte:1` ("check if this is necessary or if some content from
     the layout can be moved here with the transitions surviving" — collides with spikes 013–016),
     `(voters)/+layout.svelte:59` ("as well as this"),
     `api/candidate/preregister/+server.ts:16` ("Check."),
     `api/oidc/callback/+server.ts:35` ("whether we could use strict type for the error parameters"),
     `candidate/preregister/+layout.server.ts:9` ("extract this to the adapter and use the typing
     provided with no ad hoc casts" — arguably Phase 157's).
     None is dispositioned by G1–G5. The planner must fold, defer-with-a-todo, or explicitly decline
     each, and say which.

</open>

---

*Phase: 158-routing-auth-surface-harmonisation*
*Context gathered: 2026-08-28*
*Decision source: `.planning/v2.15-DISCUSSION-POINTS.md` § G, § 0 (facts 21–23), § N*
---

## OPERATOR RULING — 2026-08-29: the frontend/Deno provider-config drift guard

Ruled, unowned until now, and this phase is its natural home (it owns the auth surface). Full text
in `.planning/v2.15-OPERATOR-DECISIONS-2026-08-29.md` § "Drift guard"; register entry **WINDOWS 160**
(status `ruled` — it becomes `fixed` when this work lands, and not before).

**The defect class:** the frontend and Deno provider configs are a duplicated pair that has now
**drifted undetected twice**. That is a missing-assertion problem, not an edit problem.

**Measured state (do not re-derive from memory — but do re-measure before acting, house rule 3):**

- `apps/frontend/src/lib/api/utils/auth/providers/authConfig.ts` — `IDURA_AUTH_CONFIG.extractClaims`
  is `['birthdate', 'hetu', 'country']`.
- `apps/supabase/supabase/functions/identity-callback/claimConfig.ts` —
  `PROVIDER_CONFIGS.idura.extractClaims` is `['birthdate', 'hetu']`.
- The **security half already agrees**: `identityMatchProp: 'sub'` on both sides for both providers,
  test-locked at both ends. This is metadata drift, not an open hole.
- **`country` has ZERO consumers** anywhere in `apps/frontend/src` or `apps/supabase/supabase` — the
  only occurrences are the array element itself, two docstring lines, and an unrelated i18n
  locale-matching comment.

**The ruling — full agreement, in this order:**

1. **Remove `country` from the frontend config.** Nothing reads it.
2. **Assert byte-agreement on the whole provider config** — both `identityMatchProp` **and**
   `extractClaims` — in the same class as the `envConfig.ts` byte-identity assertion that `155-05`
   ships.

This contradicts no existing test: `tests/tests/specs/candidate/candidate-bank-auth.spec.ts:174`
says verbatim that *"`country` is NOT in the production extractClaims set, so it is intentionally
not asserted"* and asserts the exact two-element set — which is precisely the set that remains after
step 1. No allowlist machinery is needed and no unread claim survives in the config.

**Rejected, with reasons:** guarding `identityMatchProp` only (leaves the field that has drifted
twice unguarded); agreement-with-a-justified-divergence-allowlist (builds machinery to preserve a
claim nothing reads).

**Flip-test the guard** (house rule 2): a config-agreement assertion that examines nothing also
reports green. Prove it reddens by perturbing one side.
