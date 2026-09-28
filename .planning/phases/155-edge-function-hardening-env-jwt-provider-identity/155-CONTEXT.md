# Phase 155: Edge Function Hardening — env, JWT, provider identity - Context

**Gathered:** 2026-08-28
**Status:** Ready for planning
**Requirements:** REVIEW-EDGE-01..04 (see `<open>` — these ids are not defined in `REQUIREMENTS.md`)

**Decision source:** `.planning/v2.15-DISCUSSION-POINTS.md` § D (D1–D4), § 0 facts **12, 13, 14**,
§ N (N1–N3). That document's fill rule is binding here: *every box in § D is unchecked, and an
unchecked decision is the `★ RECOMMENDED` option CHOSEN, not an open question.* The operator wrote
no `**EDIT:**` / `**NOTE:**` free text anywhere in § D or § N, so **all four D decisions and all
three N decisions resolve to `(a)` by default**, with nothing to carry over verbatim.

**Grounding.** Every file:line below was **re-verified this session at HEAD `52c631edf`** (the
discussion doc measured them at `bff94f382`; two doc commits have landed since and no source line
moved). Where the roadmap and a § 0 fact disagree, **the fact wins** — but note that as of this
writing `.planning/ROADMAP.md` has already been corrected in place (working-tree modification, per
the operator's tick of § 0.1 option **(c)**), so roadmap and facts now agree for Phases 155 and 161.
This document does not edit the roadmap.

---

<domain>
## Phase Boundary

Three Supabase Edge Functions — `identity-callback`, `invite-candidate`, `send-email`
(`apps/supabase/supabase/functions/`) — stop decoding JWTs with the wrong alphabet, stop
substituting silent defaults for missing configuration, and have their template-substitution
contract made honest. The provider-identity half of the original goal is **already delivered on the
code** and is reduced to a documented confirmation.

Delivers, after the § 0 corrections:

1. **base64url JWT decode** at the **two** measured `atob` sites — `invite-candidate/index.ts:81`
   and `send-email/index.ts:111`, **one per function, not two per file** — demonstrated by a token
   that fails before and succeeds after.
2. **Seven** `??`/`||` env defaults replaced by a throw naming the missing variable, **plus a guard
   closing the class** (D2a). Includes the repo-wide hard-coded-port / localhost-URL sweep the
   reviewer asked for, dispositioned.
3. `send-email` placeholder regex accepts `{{ varname }}` with surrounding spaces, matched by test,
   with a one-line comment recording that dotted keys are resolved **literally, flat** (D4a).
4. **Criterion 4 is retired on evidence** (D1a): Signicat is keyed on `sub`, not `birthdate`. What
   remains is a documentation task — confirm against current Signicat docs that `sub` is a stable
   per-person pseudonym (not per-session, not per-client), record the finding with a citation, close.
   **No code change expected.** The roadmap's "or remove Signicat support" branch is **moot**.

**Not in scope:**

- **`PROJECT_ID` parameterisation** — Phase 161 owns it. 155 touches `identity-callback/index.ts:197`
  only to make it throw; it does **not** introduce, rename, or converge the variable (D3a).
- **`config.toml` hard-coded ports** — Phase 156 criterion 8 owns those explicitly. 155's port /
  localhost sweep must **hand that finding to 156** rather than fix it.
- **The `verifyJwt` aud/iss fail-open defect** and the fourth ID-token-verifier copy — both are
  filed pending todos on this exact file and are **not** among 155's four criteria. See `<open>`.
- Any change to the frontend provider path (`apps/frontend/src/lib/api/utils/auth/providers/`);
  Phase 142.1 already collapsed and hardened that side.

</domain>

---

<decisions>
## Implementation Decisions

### D-D1 — Criterion 4 (Signicat identity): is it still open? ⚠ DECIDE

**Won: option (a), by default** (no box ticked in § D1). *Reduce criterion 4 to a
documentation-and-confirmation task.*

**Rationale as written:** check current Signicat docs that `sub` is a stable per-person pseudonym
(not per-session or per-client), record the finding with a citation, and close. No code change
expected. The removal branch is moot.

Rejected: **(b)** re-deriving the choice from scratch — re-litigates an evidence-backed decision
made days ago and risks reversing it on weaker grounds. **(c)** striking criterion 4 outright —
honest that the work is done, but loses the one premise still worth checking (that Signicat's `sub`
really is stable across sessions).

**What is retired, stated plainly:** the roadmap's original framing — *"find a pseudonym or hetu, or
drop Signicat — birthdate-based matching is not unique"* — is **satisfied and closed**, not deferred
and not silently dropped. Fact 14 and the evidence in `<facts>` are the grounds. **The `hetu`
fallback and the "remove Signicat support completely" branch are both dead**; a planner must not
re-open either.

**What remains, and it is the whole of criterion 4:** one external-documentation check on the
stability of Signicat's `sub`, with a citation, recorded on the phase record. If — and only if —
that check finds `sub` is *not* a stable per-person identifier, criterion 4 re-opens as a real code
decision; that outcome must be escalated as a `checkpoint:decision`, not absorbed.

### D-D2 — Env-default removal: how many sites, and is the class closed?

**Won: option (a), by default.** *All 7 sites, plus a guard asserting no `Deno.env.get(...)` is
followed by `??`/`||` in the functions tree.*

**Rationale as written:** the criterion says "**Every** `??`/`||` env default"; the guard makes the
class **closed** rather than the instances fixed.

Rejected: **(b)** the 3 roadmap-named lines only — leaves the four worst-consequence defaults,
including the wrong-host one. **(c)** all 7 without a guard — closes today's instances; the next
Edge Function reopens the class.

**Consequence for scope:** the roadmap named **3** sites at line numbers that had **drifted**
(`:168/:196/:341`). The real set is **7** at `:169/:197/:361` + `send-email:210,211,234` +
`invite-candidate:131`. The seventh — `invite-candidate/index.ts:131`,
`Deno.env.get('SITE_URL') || Deno.env.get('SUPABASE_URL')` — is a **silent wrong-host** default that
no review comment named; § D2 calls it "arguably the worst of the seven". It is in scope.

**Guard note for the planner:** the guard's own predicate must not be defeated by
`identity-callback:197`, whose `||` chain begins with a **non-env** operand
(`project_id || Deno.env.get('DEFAULT_PROJECT_ID') || DEFAULT_SEED_PROJECT_ID`). A naive
"`Deno.env.get` immediately followed by `??`/`||`" matcher catches it; a "assignment starts with
`Deno.env.get`" matcher does not.

### D-D3 — `identity-callback:197` project-id default: 155 or 161? (the boundary)

**Won: option (a), by default.** *Throw in **155** on missing `DEFAULT_PROJECT_ID`; let **161**
rename / converge the variable.*

**Rationale as written:** 155 ships its own criterion without waiting on 161, and 161's
parameterisation arrives at a call site that **already fails loudly** rather than one that silently
seeds.

Rejected: **(b)** defer the site to 161 — no double edit, but leaves a named criterion-2 site open
through six intervening phases and forces D2a's guard to carve out an exception. **(c)** introduce
`PROJECT_ID` early in 155 — one edit total, but pulls 161's central decision into a phase that has
not discussed it, and 161's guard work lands against a half-built convention.

**The boundary, recorded so neither phase both-changes nor both-skips it:**

| Artefact | Owner | What that phase does |
|---|---|---|
| `identity-callback/index.ts:197` — the `\|\| Deno.env.get('DEFAULT_PROJECT_ID') \|\| DEFAULT_SEED_PROJECT_ID` fallback chain | **155** | Removes the silent fallback; **throws** naming `DEFAULT_PROJECT_ID`. Does **not** rename the variable. |
| `identity-callback/index.ts:31` — `const DEFAULT_SEED_PROJECT_ID = '00000000-…-0001'` (fact 27) | **161** | Owns the constant's fate: it becomes / is replaced by the `PROJECT_ID` env, documented in `.env.example`. |
| The name `DEFAULT_PROJECT_ID` → `PROJECT_ID` convergence | **161** | 155 deliberately leaves the pre-161 name in place; renaming is 161's call. |
| The "query is project-scoped" guard | **161** | Distinct from D2a's env-default guard; do not merge them. |

155 therefore **does** touch line 197 and **does not** touch line 31. This ordering is now also
written into the roadmap's Phase 161 preamble, so the two entries agree.

### D-D4 — `send-email` placeholder regex vs. dotted paths

**Won: option (a), by default.** *Allow surrounding spaces (the reviewer's ask) and keep the flat
lookup, with a one-line comment stating that dotted keys are literal.*

**Rationale as written:** closes the criterion, and documents the trap without inventing a resolution
semantic nobody has asked for.

Rejected: **(b)** implement real dotted-path resolution — makes the regex honest, but **changes
template rendering behaviour for any existing template using a dotted key as a flat name**.
**(c)** spaces only, no note — smallest diff; leaves the mismatch for the next reader to rediscover.

**Measured reinforcement for (a), and a hard warning against (b):** the producer of `vars` —
`resolve_email_variables` — emits keys that **literally contain dots**:
`'candidate.first_name'`, `'candidate.last_name'`, `'organization.name'`,
`'nomination.constituency.name'`, `'nomination.election.name'`
(`apps/supabase/supabase/schema/502-email-helpers.sql:93-96,107,124,128,139`). So the flat
`vars[key]` lookup is not accidentally-working — it is the **live contract**, and option (b) would
have broken **every** existing placeholder in the product. The comment (a) requires should say
exactly that: the dotted key is a flat key that contains dots, produced dotted by
`resolve_email_variables`; the regex's `(?:\.\w+)*` group is **not** a path traversal.

The misleading in-file comment at `send-email/index.ts:174` — `// Replace {{variable.path}}
placeholders with resolved values` — is the source of the confusion and should be corrected in the
same edit.

### D-N1 — Sequencing against Phase 152's comment sweep (cross-cutting)

**Won: option (a), by default.** 152 stays first and lands its scan in `yarn lint:check`.
**Consequence for 155:** every comment this phase writes — the D4 dotted-key note, the D1
Signicat-docs citation, each throw's explanatory line — is authored **after** the sweep and **under**
the enforced convention. A comment that would have been swept (planning references, forced line
breaks, `--`-as-dash) will fail `lint:check` in this phase, not in 152.

### D-N2 — Where follow-up items land (cross-cutting)

**Won: option (a), by default.** `.planning/todos/pending/`, filed **during the owning phase**.
**Consequence for 155:** anything this phase surfaces and does not fix — notably the aud/iss
fail-open and the fourth-verifier-copy items in `<open>`, and the `config.toml` port finding handed
to 156 — is filed there with its file:line anchor, not left in a summary. (The operator's `**NOTES**`
under § G5 — *"Implement the blocking ones within 158/9 or so"* — scopes the *blocking* follow-ups
to Phases 158/159 and is recorded here for completeness; it is § G's text, not § D's, and does not
bind 155.)

### D-N3 — Document shape (cross-cutting)

**Won: option (a), by default.** One `<padded>-CONTEXT.md` per phase — **this file** — generated from
§ D of the shared discussion document, with the shared document itself as the discussion log. There
is no milestone-level CONTEXT.md; downstream agents read only this file plus the refs it names.

### Claude's Discretion

- The exact mechanism of the D2a guard (ESLint rule vs. committed Node scan wired into
  `yarn lint:check` — note § A4a already establishes a committed-Node-script-in-`lint:check`
  precedent for this milestone) and its failure message.
- How the base64url decode is implemented (hand-rolled pad-and-translate vs. a Deno-available
  helper), given the runtime constraint in `<facts>`.
- The wording of the D4 comment and of each throw message, subject to naming the missing variable.
- Where the D1 Signicat citation is recorded (phase record vs. a docstring addition to
  `claimConfig.ts`) — provided it is discoverable from the phase directory.


### Decision index (machine-readable)

One bullet per decision above, in the grammar `plan-phase`'s decision-coverage gate parses.
The sections carry the reasoning and evidence; **this is an index, not a summary — plan from
the sections.** It lives inside `<decisions>` because the parser reads only this block when
one is present, and ignores `###` headings entirely.

- **D-D1:** Criterion 4 (Signicat identity): is it still open? ⚠ DECIDE
- **D-D2:** Env-default removal: how many sites, and is the class closed
- **D-D3:** `identity-callback:197` project-id default: 155 or 161? (the boundary)
- **D-D4:** `send-email` placeholder regex vs. dotted paths
- **D-N1:** Sequencing against Phase 152's comment sweep (cross-cutting)
- **D-N2:** Where follow-up items land (cross-cutting)
- **D-N3:** Document shape (cross-cutting)

</decisions>

---

<facts>
## Measured Facts (re-verified 2026-08-28 at HEAD `52c631edf`)

**Path note.** The Edge Functions live at `apps/supabase/supabase/functions/` (doubled `supabase`
segment). The discussion document and the roadmap cite them relative to that directory
(`identity-callback/index.ts:169`); every path below is repo-relative and was resolved and read.

### ⚑ Fact 14 — criterion 155-4 is **ALREADY SATISFIED**

Signicat is keyed on `sub`, not `birthdate`. Changed in Phase 142.1.

- `apps/supabase/supabase/functions/identity-callback/claimConfig.ts:43-47` —
  `signicat: { identityMatchProp: 'sub', firstNameProp: 'given_name', lastNameProp: 'family_name',
  extractClaims: ['birthdate'] }`. (§ 0 cites the range as `:44-49`; measured exactly,
  `signicat:` opens at `:43`, `identityMatchProp: 'sub'` is `:44`, `extractClaims: ['birthdate']`
  is `:47`, the block closes at `:48`. The claim is correct; the range is off by one at each end.)
- `…/claimConfig.ts:38-40` — the file's own docstring: *"Signicat was keyed on `birthdate` until
  Phase 142.1, which made that a certainty for any realistic candidate population rather than a
  corner case. Never key on a claim that is not an identifier."*
- **It is test-locked, not merely changed.** `…/identity-callback/claimConfig.test.ts:16-20` —
  `it('uses sub for identity matching (stable OIDC subject)')` asserting
  `PROVIDER_CONFIGS.signicat.identityMatchProp === 'sub'`, with `:31-35` asserting `birthdate`
  survives as metadata.
- **The frontend twin agrees**, so there is no cross-copy drift to fix:
  `apps/frontend/src/lib/api/utils/auth/providers/authConfig.ts:31-36` —
  `SIGNICAT_AUTH_CONFIG = { identityMatchProp: 'sub', extractClaims: ['birthdate'], … }`;
  `IDURA_AUTH_CONFIG` at `:49-54` likewise. Distinctness is asserted end-to-end at
  `apps/frontend/src/lib/api/utils/auth/providers/signicat.test.ts:366-380`
  (*"gives two candidates sharing a birthdate different identifiers"*).

**Therefore:** the roadmap's criterion-4 code work is done, the "or remove Signicat support" branch
is moot, and the only live residue is the external-docs confirmation D1a describes.

### ⚑ Fact 13 — env defaults number **7**, not 3, and include one the roadmap never named

Exhaustive: `grep -rnE "Deno\.env\.get\([^)]*\)[[:space:]]*(\?\?|\|\|)"` over
`apps/supabase/supabase/functions/` returns exactly these seven and nothing else.

| # | Site | Code | Consequence of the default |
|---|---|---|---|
| 1 | `identity-callback/index.ts:169` | `Deno.env.get('IDENTITY_PROVIDER_TYPE') ?? 'signicat'` | silently picks a provider |
| 2 | `identity-callback/index.ts:197` | `project_id \|\| Deno.env.get('DEFAULT_PROJECT_ID') \|\| DEFAULT_SEED_PROJECT_ID` | silently seeds into the default project — **D3's boundary site** |
| 3 | `identity-callback/index.ts:361` | `${Deno.env.get('SITE_URL') \|\| 'http://127.0.0.1:5173'}/candidate` | hard-coded localhost URL **and** port in a redirect |
| 4 | `send-email/index.ts:210` | `Deno.env.get('SMTP_HOST') \|\| 'inbucket'` | mail silently routed to the dev catcher |
| 5 | `send-email/index.ts:211` | `parseInt(Deno.env.get('SMTP_PORT') \|\| '2500')` | hard-coded port |
| 6 | `send-email/index.ts:234` | `from \|\| Deno.env.get('SMTP_FROM') \|\| 'noreply@openvaa.org'` | silent sender identity |
| 7 | **`invite-candidate/index.ts:131`** | `Deno.env.get('SITE_URL') \|\| Deno.env.get('SUPABASE_URL')` | **silent wrong-host invite links** — named by no review comment |

The roadmap's original `:168 / :196 / :341` had drifted to `:169 / :197 / :361`. Sites 3 and 5 also
discharge part of criterion 2's "repo-wide search for hard-coded ports and localhost URLs" — the
search is still owed repo-wide, with `config.toml` findings handed to Phase 156 (its criterion 8).

### ⚑ Fact 12 — `atob` on JWT segments is **one site per function**, not two

Exhaustive: `grep -rn atob` over the functions tree returns exactly two hits.

- `apps/supabase/supabase/functions/invite-candidate/index.ts:81` —
  `const payload = JSON.parse(atob(token.split('.')[1]));`
- `apps/supabase/supabase/functions/send-email/index.ts:111` — byte-identical line.

Both sit under the same comment (`// Decode JWT to check roles from claims (Custom Access Token
Hook)`) and both feed an **admin-authorisation** check (`payload.user_roles` →
`isAdmin` at `invite-candidate:84-90`, `send-email:114-116`). A decode failure is therefore an
authorisation failure, which is why the criterion demands a demonstrated failing token rather than
an asserted fix.

**The reviewer's "this also appears on line 111 / line 114" is wrong** (`PRE-SHIP-REVIEW-TRIAGE.md`,
Phase 155 § comments 5 and 6 — Copilot). `invite-candidate:111` is not a second `atob`, and
`send-email:114` is the `isAdmin` predicate. Do not go looking for a fourth site; there are two.

### Fact 27 (context for D3) — no `PROJECT_ID` env exists

`apps/supabase/supabase/functions/identity-callback/index.ts:31` —
`const DEFAULT_SEED_PROJECT_ID = '00000000-0000-0000-0000-000000000001';`. Phase 161 owns it.

### D4's producer contract (measured this session, beyond § 0)

- `apps/supabase/supabase/functions/send-email/index.ts:175-176` —
  `const replaceVars = (text: string): string =>` /
  `text.replace(/\{\{(\w+(?:\.\w+)*)\}\}/g, (_match, key) => vars[key] ?? _match);`
- `…/send-email/index.ts:174` — the misleading comment `// Replace {{variable.path}} placeholders
  with resolved values`.
- `apps/supabase/supabase/schema/502-email-helpers.sql:93-96,107,124,128,139` — the producer emits
  **flat keys containing dots**. The flat lookup is the live contract, not a bug.

### Runtime constraint that shapes every "matched by test" clause

`identity-callback/index.ts` imports from `deno.land` / `esm.sh` URLs, so **only `claimConfig.ts` is
vitest-reachable** in that function; the tree's only Edge-Function unit test today is
`identity-callback/claimConfig.test.ts`. `invite-candidate/index.ts` and `send-email/index.ts` have
**no in-tree unit test at all**. Criteria 1 and 3 both say "exercised" / "matched by test", so the
planner must choose a harness — extract the decode and the substitution into URL-import-free modules
beside `claimConfig.ts` (the pattern that file already establishes), or add a Deno test task. This
is the same obstacle recorded in `.planning/todos/pending/2026-08-22-identity-callback-verifyjwt-fails-open-on-aud-iss.md`
§ Solution 3.

</facts>

---

<open>
## Open Items (uncovered by § D; not decided here)

1. **`REVIEW-EDGE-01..04` are undefined.** `.planning/ROADMAP.md:1065` cites them as this phase's
   requirements, but `grep -rn 'REVIEW-EDGE' .planning/` returns **that one line only** —
   `REQUIREMENTS.md` defines no such ids. Either they are to be back-filled or the roadmap's
   `**Requirements**` line is nominal. Not resolvable from § D; flagged rather than invented.

2. **Test harness for `invite-candidate` / `send-email` is unchosen.** Criteria 1 and 3 both require
   a test, and neither function is reachable from vitest today (see `<facts>`). § D never disposed of
   this. The planner must decide (extract-to-module vs. Deno test task) and should treat it as
   affecting the shape of the work, not a detail.

3. **`.env.example` coverage of the seven variables is unverified.** Reading `.env.example` was
   refused by the environment's sandbox this session, so whether `IDENTITY_PROVIDER_TYPE`,
   `DEFAULT_PROJECT_ID`, `SITE_URL`, `SMTP_HOST`, `SMTP_PORT`, `SMTP_FROM` are documented there is
   **unknown**. D2a turns each into a hard failure when unset, so a missing `.env.example` entry
   becomes a broken local setup. Verify before the first throw lands.

4. **Two pending todos sit on `identity-callback/index.ts` and are NOT among the four criteria.**
   Both are Phase 142.1 output and both are in scope for the *file* but not for the *phase*:
   - `.planning/todos/pending/2026-08-22-identity-callback-verifyjwt-fails-open-on-aud-iss.md` —
     **severity: high**. `identity-callback/index.ts:70-91` omits `audience`/`issuer` verify options
     entirely when the env vars are unset, so jose performs neither a presence check nor a value
     comparison. It is *worse* than the frontend defect Phase 142.1 fixed, on an endpoint served
     `--no-verify-jwt` that provisions Supabase auth users. **This is the same defect class as D2**
     — a missing env var silently degrading behaviour — and D2a's guard will not catch it, because
     the pattern is a conditional `if (clientId)` rather than a `??`/`||`. Whether 155 absorbs it is
     **not decided by § D**; per D-N2 it stays filed unless a planner escalates it.
   - `.planning/todos/pending/2026-08-22-edge-function-fourth-idtoken-verifier-copy.md` — the Edge
     Function is a fourth copy of the decrypt→verify→claims path, named and excluded by 142.1 D-03.
     Any hardening 155 lands here does not reach the frontend core, and nothing fails when the two
     drift.

5. **The repo-wide hard-coded-port / localhost sweep has no disposition rule.** Criterion 2 requires
   the search and says its results are "dispositioned", but § D2 does not say *how* — fix in place,
   file per D-N2, or hand to another phase. Known collision: `config.toml`'s hard-coded ports belong
   to **Phase 156 criterion 8**. Everything else is undecided.

6. **The negative-control bar for criterion 1 is unstated.** The criterion says the defect is
   "demonstrated, not asserted" — a token containing `-`/`_` or lacking padding must be *observed*
   to fail on current code. Whether that observation is recorded in a ledger (the
   `142.1-NEGATIVE-CONTROL-LEDGER.md` / `137-NEGATIVE-CONTROL.md` precedent) or inline in a summary
   is not decided.

</open>

---

*Phase: 155-edge-function-hardening-env-jwt-provider-identity*
*Context gathered: 2026-08-28 — decisions from `.planning/v2.15-DISCUSSION-POINTS.md` § D, § 0 facts 12/13/14, § N*

---

## Operator decision O1 — added after this context was written (2026-08-28)

**The `aud` / `iss` fail-open is folded into this phase.** It is now **ROADMAP criterion 5** and
**REVIEW-EDGE-05**; see `.planning/v2.15-DISCUSSION-POINTS.md` § O1.

This context filed the defect under `<open>` as "in-file but not in-phase". That is now superseded: it
**is** in phase.

Why it needed a separate decision rather than falling out of D2: the defect is filed from Phase 142.1 and
sits in the files this phase already opens, and it is the same class as D2 — a missing environment variable
silently weakens security. But it **escapes D2(a)'s guard**, because D2(a) hunts `??` / `||` defaulting
operators and this weakening is an **unset-variable branch**. A phase that hardens every `??`/`||` site in
these files and leaves this one open would read as an oversight, not as a scope boundary.

**What must be true:** both checks fail **closed**. A token carrying a wrong `aud` **and** a wrong `iss`
is exercised against an unset-env configuration and observed **rejected**. Treat this as the
highest-severity item in the phase.

The second Phase-142.1 todo on these files (the duplicated/weaker verifier copy) is **not** folded in and
stays filed.

---

## Amendments after planning (2026-08-28)

Per the standing rule that a re-verification must amend the stale item rather than only append to it:

- **`<open>` item 1 is DISCHARGED.** `REVIEW-EDGE-01..04` are defined at `REQUIREMENTS.md:113-117`, and
  `REVIEW-EDGE-05` was added by operator decision **O1**. The phase's acceptance surface exists.
- **`<open>` item 2 is WITHDRAWN — the claim was false.** This context reported that no test harness exists
  for `invite-candidate` / `send-email`. Research disproved it by measurement: `apps/supabase/vitest.config.ts`
  already declares `include: ['supabase/functions/**/*.test.ts']`, `apps/supabase/package.json` already
  declares `test:unit: vitest run`, and `yarn workspace @openvaa/supabase test:unit` runs **20/20 green**.
  **Any new `*.test.ts` beside any Edge Function is picked up with zero config change.** The `deno test`
  alternative is dead anyway — `deno` is not installed and no `deno.json`/`deno.lock` exists in the tree.
  This mattered: criteria 1, 3 and 5 all demand exercised proofs, and the false claim made them look
  blocked when they were not.
