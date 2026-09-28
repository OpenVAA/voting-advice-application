---
phase: 161-project-scoping-project-id-parameterisation
verified: 2026-09-13T16:40:00Z
verifier: Claude (gsd-verifier), goal-backward, re-verification (SEVENTH pass, after `ab2fe6d9b` the CR-05 half-closure, `b69d08ae5` the sixth report, and `5bf08907e` the operator's acceptance of CR-05's remainder)
status: passed
score: 4/4 criteria ACHIEVED (0 blocking; 2 non-blocking documentation warnings)
recommendation: CLOSE
operator_decision:
  date: 2026-09-13
  by: operator
  verdict: ACCEPTED_RESIDUAL
  scope: "CR-05's remaining half (the nullish-coalesced owner, `const self = this ?? other;`) and the owner-EXPRESSION grammar's six spellings."
  decision: >-
    Accepted as permanent stated residuals. The operator was shown the measured cost of closing them
    — reporting `??` requires narrowing the `?` exclusion, which makes the lookahead an admitted
    punctuator position, which the gate spec's back-pressure then requires be registered on
    `MATCHER_NAMES`; measured, that is 2 spec failures for the regex alone and 6 more on
    registration, because the punctuator enumeration recognises only `?.`, `!.` and `?.(` and derives
    a disposition matrix this lookahead-only rule has no links for — and judged the remaining reach
    gap not worth that work. Live exposure of every named shape is ZERO, re-measured at this HEAD.
  closed_by_commit: ab2fe6d9b
  still_true: >-
    This does NOT retract the sixth pass's findings. The `this!` half of CR-05 was closed in
    `ab2fe6d9b`; the `??` half and the six owner-expression spellings remain genuinely uncounted and
    are now STATED in the guard's residual list and pinned in `RESIDUAL_PHRASES`, so the gate spec
    measures the claim in both directions. The back-pressure predicate's blindness to a bare `?`
    inside an excluding character class is also real and is NOT fixed; `ab2fe6d9b` deliberately
    declines to exploit it. A future widening of this rule must re-open the `MATCHER_NAMES` question
    rather than assume it was answered.
covered_files:
  - .planning/REQUIREMENTS.md
  - .planning/ROADMAP.md
  - .planning/phases/161-project-scoping-project-id-parameterisation/161-UAT.md
  - .planning/phases/161-project-scoping-project-id-parameterisation/161-VERIFICATION.md
  - .planning/phases/161-project-scoping-project-id-parameterisation/deferred-items.md
  - apps/supabase/supabase/functions/identity-callback/envReadSites.test.ts
  - apps/supabase/supabase/functions/identity-callback/index.ts
  - package.json
  - packages/dev-seed/tests/projectScopingGate.test.ts
  - scripts/assert-project-scoped-queries.mjs
  - scripts/fixtures/project-scoped-queries/clean.fixture.ts
  - scripts/fixtures/project-scoped-queries/outside-boundary.clean.fixture.ts
  - scripts/fixtures/project-scoped-queries/outside-boundary.violation.fixture.ts
  - scripts/fixtures/project-scoped-queries/violation.fixture.ts
covered_digest: "v1:sha256:7bad8e907cb1635a80b778cb2aa69e1056d735dfb805dbd7a3390517d54cada3"
re_verification:
  previous_status: gaps_found
  previous_score: 3/4 criteria ACHIEVED (1 PARTIAL, blocking)
  gaps_closed:
    - >-
      SIXTH-PASS GAP 1, FIRST HALF — the non-null-asserted owner `const self = this!;`. CLOSED, and I
      reproduced the closure first-hand rather than reading the commit message. I appended the sixth
      pass's own shape verbatim to a scratch copy of `scripts/fixtures/project-scoped-queries/clean.fixture.ts`
      (`const self = this!;` then `return self.supabase.from('elections').select('*');`) and ran
      `node scripts/assert-project-scoped-queries.mjs --self-test`, exit status read on its own line.
      Where the sixth pass measured SILENCE (exit 0, `clean.fixture.ts (8 access(es))`, 0 violations),
      it now exits 1 with TWO expectations failed — `clean.fixture.ts yielded 9 site(s), expected
      exactly 8 (the bucket access must be excluded)` and `clean.fixture.ts:154: this binds the
      client's owner to a local`. The mechanism is a real widening, not a re-disposition: line 692
      now reads `const OWNER_BINDING_RE = /(?<![=!<>])=\s*(?:await\s+)?this\b(?!\s*(?:[.?[]|!(?:\.|=)))/g;`,
      in which the `!` position is two characters wide (`!(?:\.|=)` declines a mid-chain `!.` and a
      comparison `!=`, and admits a terminating `this!`). The shape is committed rather than left to
      a scratch file — `violation.fixture.ts` carries `nonNullAssertedOwner()` with `const self = this!;`
      — and the counts moved with it: the self-test now pins `violationCount === 41` and
      `violationTally.escapeHatches === 20`, up from 40 and 19, with the owner family pinned BY NAME
      at `ownerAliasCount === 2` whose failure message names which of the two spellings is missing.
      Fixture reverted; `git status --porcelain -- scripts/ packages/` is empty.
    - >-
      SIXTH-PASS GAP 1, SECOND HALF — the nullish-coalesced owner `const self = this ?? other;`.
      RECLASSIFIED from unstated gap to ACCEPTED STATED RESIDUAL, and the reclassification is earned
      rather than asserted. It is STATED: the guard's module docblock now carries the bullet "the
      owner rule's `?` exclusion is a bare character, so `const self = this ?? other;` — a nullish
      coalesce that binds the owner whenever it is non-null — is UNREPORTED, exactly as its
      client-level twin `nullishCoalescedClient` would be under the same spelling". It is MEASURED IN
      BOTH DIRECTIONS: `RESIDUAL_PHRASES` in `packages/dev-seed/tests/projectScopingGate.test.ts` now
      holds the phrase `'a nullish coalesce that binds the owner whenever it is non-null — is UNREPORTED'`,
      and I proved that binding LIVE rather than decorative by mutating it in both directions (see
      the next bullet). And it is genuinely NOT quietly fixed: I re-ran the shape against the guard
      (`const self = this ?? other;` + `self.supabase.from('elections')`) and it is still silent —
      it contributes ZERO to the site count, which is the whole point of its being stated.
    - >-
      THE BIDIRECTIONAL BINDING IS LIVE, NOT DECORATIVE — the single fact the whole stated-residual
      rule rests on, and I proved it by two mutations at this HEAD rather than by reading the
      assertion. (a) DELETE A BULLET: I removed the six-line owner-EXPRESSION bullet from the guard's
      `STATED RESIDUALS` section and the spec reddened `2 failed | 119 passed`, by name —
      `states exactly the residuals the matrix pins, and no others` with
      `expected 'STATED RESIDUALS. Each phrase below i…' to contain 'so an owner reached by any other expr…'`,
      and `reddens when a stated residual is deleted from the docblock` with `expected 9 to be 10`.
      (b) ADD A PHRASE WITH NO BULLET: I appended `'a phrase with no bullet behind it'` to
      `RESIDUAL_PHRASES` and the spec reddened `2 failed | 119 passed` again, with
      `expected … to contain 'a phrase with no bullet behind it'` and `expected 10 to be 11`. Both
      directions hold: a residual cannot be stated without being measured, nor measured without
      being stated. Both mutations reverted; tree clean.
    - >-
      SIXTH-PASS GAP 3 — the owner-EXPRESSION grammar, and the affirmative universal claim in the
      docblock that contradicted it. The CLAIM IS GONE from the docblock: the sentence "Every alias
      of an alias must pass through this one position to exist at all" no longer stands as an
      assertion; `OWNER_BINDING_RE`'s docblock now says the rule "closes the chain at its ROOT for
      every alias that is spelled as a BINDING OF `this` ITSELF", followed by a section headed
      "WHAT THIS RULE DOES NOT CLOSE, stated because the sentence that stood here claimed it did"
      that quotes the old sentence and calls it FALSE. The grammar is STATED and pinned: the
      docblock bullet "the owner rule reads a binding of `this` at an `=`, so an owner reached by any
      other expression is unread: a spread, an `Object.assign`, an arrow that returns it, a `for…of`
      over an array holding it, an array destructure of that array, and a getter returning it are
      each a receiver no matcher here sees", with `'so an owner reached by any other expression is unread'`
      in `RESIDUAL_PHRASES`. Bullet count and phrase count both equal 11, and the binding reddens in
      both directions per the bullet above. RECLASSIFIED as an accepted stated residual.
    - >-
      THE `??` HALF IS HONESTLY DECLARED, NOT QUIETLY HIDDEN — `ab2fe6d9b`'s claim that it declined
      to exploit the back-pressure hole is TRUE, checked against the committed regex rather than the
      commit message. The `?` exclusion is still a BARE `?` inside the character class of the
      original spelling: line 692's lookahead reads `(?!\s*(?:[.?[]|!(?:\.|=)))`. It is NOT spelled
      `[?]`, and the whole matcher span contains no escaped `\?` anywhere — so the back-pressure
      predicate at `expect(matcherSpanOf(name).text, `${name} is an unenumerated matcher`).not.toContain('\\?')`
      passes for the reason the commit states rather than for a reason it engineered. `OWNER_BINDING_RE`
      remains absent from `MATCHER_NAMES` (which still holds exactly the nine entries `ACCESS_RE` …
      `COMPUTED_FUNCTIONS_RE`). I also re-measured the COST the operator's decision rests on, rather
      than accepting it: replacing `[.?[]` with `[.[]|\?(?!\?)` — the narrowing that would report the
      nullish-coalesced owner — reddens the gate spec at exactly `2 failed | 119 passed`, by name,
      at `names every matcher the guard declares that admits an optional punctuator` and
      `admits no optional punctuator, which is the measured fact its absence from MATCHER_NAMES rests on`.
      The operator was shown a measurement, and the measurement reproduces. Mutation reverted.
    - >-
      THE UNSTATED-SHAPE HUNT FOUND NO ELEVENTH FINDING, and it was an active hunt rather than an
      absence of one. I injected TWENTY-ONE candidate owner shapes into a scratch copy of
      `clean.fixture.ts` across two batches and read which the guard reports. NINE are REPORTED —
      `let`-bound then reassigned (`self = this;`), the double assertion (`const self = this as unknown as CleanFixture;`),
      a `this` bound inside a NESTED ARROW, the RENAMED destructure (`const { supabase: alias } = this;`),
      the destructure with a DEFAULT (`const { supabase = other } = this;`), a comma-separated
      declarator list, a DEFAULT PARAMETER (`probeDefaultParam(self: CleanFixture = this)`), an
      assignment to a module-level sink (`sink.owner = this;`), and a `.bind(this)` helper whose body
      spells `this.supabase.from(…)` and is caught by check 1. TEN are silent, and every one of them
      falls under a pinned residual phrase's GENERAL clause, not merely near one — see
      `gaps_remaining` for the two whose coverage is by a general clause rather than by name, which I
      am recording explicitly rather than absorbing.
    - >-
      NO REGRESSION IN THE GATES, all six run by me at this HEAD with every exit status read on its
      own line and none through a pipe. `node scripts/assert-project-scoped-queries.mjs --self-test`
      -> `SELFTEST_EXIT=0`, `41 line(s) in violation.fixture.ts (41 access(es))`, `0 in clean.fixture.ts
      (8 access(es))`, `13 line(s) in outside-boundary.violation.fixture.ts`, `0 in
      outside-boundary.clean.fixture.ts`, `matching the committed expectation` — the 41/0/13/0 the
      orchestrator named. The live-corpus invocation -> `LIVE_EXIT=0`, `12 guarded source(s), 0
      deferred, 12 adapter source(s) on disk, 5 raw client call(s) examined, 2 Edge Function
      invocation(s), 7 client-touching site(s) in all, 550 source(s) outside the adapter directory
      walked, 1 outside site(s) examined, 0 violation(s)`. The gate spec -> `GATE_EXIT=0`,
      `Tests 121 passed (121)` — the 121 the orchestrator named. `yarn test:unit` -> `UNIT_EXIT=0`,
      `25 successful, 25 total`. `yarn lint:check` -> `LINT_EXIT=0`, and its LAST line is the
      project-scoped query guard's own summary, so the chain reaches its final link. `yarn format:check`
      -> `FORMAT_EXIT=0`, `All matched files use Prettier code style!`.
  gaps_remaining:
    - >-
      SIXTH-PASS GAP 2 — the root cause, RECLASSIFIED to a known, recorded, NON-BLOCKING weakness
      rather than carried as a blocker, with the reasoning shown. It is NOT fixed and I am not
      pretending it is: `OWNER_BINDING_RE` is still off `MATCHER_NAMES`, its trailing lookahead is
      still a punctuator-disposition position that no matrix enumerates, and the back-pressure
      predicate still reads `.not.toContain('\\?')` — an ESCAPED `\?` — while the rule spells its
      literal `?` bare inside an excluding character class, so the predicate is structurally
      incapable of seeing that decision. What CHANGED is the only thing that made it blocking: in the
      sixth pass this blindness hid an UNSTATED uncounted shape, and now the shape it hides is
      STATED, pinned and measured in both directions. A weakness that can only ever hide something
      already written down and already measured is a recorded weakness, not a silent hole. It is
      recorded in `operator_decision.still_true` and in `deferred-items.md`, and both say a future
      widening of this rule must RE-OPEN the `MATCHER_NAMES` question rather than assume it was
      answered. That condition is the correct disposition and I am carrying it forward, not
      discharging it.
    - >-
      OBSERVATION, recorded so it is not silently absorbed — TWO of the ten silent shapes I found are
      covered by a pinned residual's GENERAL clause rather than by its enumeration, and a reader
      should know which. (a) THE OWNER HANDED TO A FUNCTION: `takeOwner(this)` where
      `function takeOwner(owner: CleanFixture) { return owner.supabase.from('elections')… }` is
      silent. The residual that covers it names the CLIENT, not the owner — "the table and rpc
      matchers are anchored on the receiver spelling and the binding rule needs a leading `=`, so a
      client held in a PARAMETER is read by neither: a guarded source may hand the client to a
      function that issues arbitrary unscoped queries, uncounted". The MECHANISM sentence is exactly
      why the owner case is silent too, and the owner-rule bullet independently says the rule reads
      ONLY a binding of `this` at an `=`, so no sentence in the docblock claims this shape is caught.
      I am therefore NOT counting it as an unstated gap — but the phrase says "client" where the
      shape is the owner, and given this phase's ten-times-repeated lesson that the owner level is
      not the client level, the wording is worth tightening. (b) AN INTERPOSED COMMENT BEFORE THE
      OWNER: `const self = /* owner */ this;` is silent because `=\s*` cannot cross a comment. The
      pinned phrase "an interposed comment is not trivia the matchers admit" is a general statement
      about the matchers and covers it; its consequence clause says "a receiver and a member
      separated by a block comment", which is narrower than the phrase. Same disposition: stated by
      the general clause, worth widening in the consequence.
    - >-
      SIXTH-PASS GAP 4 — DOCUMENTATION, still open, still non-blocking, and now WORSE BY ONE. None of
      the three stale sentences the sixth pass named was touched by `ab2fe6d9b`, and I found a third
      stale count it did not name. (i) Check 6's docblock still opens "`ACCESS_RE` is anchored on the
      receiver spelling `this.supabase` / `this.#supabase`. SIX shapes reach the same client past
      that anchor" and enumerates six without the owner — stale by THREE now, since check 6 reports
      the owner alias, the owner destructure and the non-null-asserted owner. (ii) The module
      docblock's check-6 line still reads "A guarded source may not bind the client — or any node on
      its member chain — to a local, destructure a method off either, reach a member by computed key
      … All six reach the same client past the receiver anchor" — no owner, and the count is the same
      stale six. (iii) NEW this pass: `checkEscapeHatches`'s own docblock reads "Check 6 over one
      source: the three shapes that reach the client past the receiver anchor", a THIRD stale count
      in the same function, naming three where the function now runs six matchers. All three
      UNDERSTATE the rule's reach, so none can mislead a reader into believing something is caught
      that is not; that is why they are warnings rather than blockers, on the same classification the
      sixth pass applied to (i) and (ii).
    - >-
      NEW this pass, DOCUMENTATION class, non-blocking but it is the exact sentence `ab2fe6d9b`
      claims to have deleted as FALSE — it survives verbatim in the guard's OPERATOR-FACING VIOLATION
      MESSAGE. `scripts/assert-project-scoped-queries.mjs` builds check 6's owner message from
      concatenated literals, and two of them read `'matcher here anchors on — so the file reports
      clean while querying whatever it likes. Every alias of '` + `'an alias passes through this one
      position, which is why it is forbidden at the `=` rather than chased '` + `'down the chain.'`.
      I did not find this by grep — a grep for the whole sentence returns only the docblock's own
      quotation of it as false, because the sentence is SPLIT ACROSS TWO STRING LITERALS, which is
      most likely why the commit that deleted it from the docblock missed it here. I found it by
      READING THE GUARD'S OUTPUT during my `this!` reproduction, where it printed in full:
      `clean.fixture.ts:154: this binds the client's owner to a local. … Every alias of an alias
      passes through this one position, which is why it is forbidden at the `=` rather than chased
      down the chain.` The claim is false by the same enumeration that falsified its docblock twin —
      I measured ten shapes this pass that reach the client without passing through that position.
      NON-BLOCKING because it creates no uncounted shape and lets nothing through: the canonical
      statement of the guard's reach is the `STATED RESIDUALS` section, which is complete, pinned and
      measured. But it is a false sentence shown to a developer at the exact moment they are reading
      the guard's verdict, and it should be deleted in the same commit as the three stale counts
      above.
  regressions: []
criteria:
  c1:
    name: "PUBLIC_PROJECT_ID env exists, defaults to the default project, documented in .env.example, DEFAULT_SEED_PROJECT_ID no longer a silent fallback"
    verdict: ACHIEVED
    blocking: false
    caveat: >-
      Re-measured at this HEAD, not carried forward. `.env.example` line 59 reads
      `PUBLIC_PROJECT_ID=00000000-0000-0000-0000-000000000001`.
      `grep -rn DEFAULT_SEED_PROJECT_ID --include='*.ts' --include='*.mjs' --include='*.js' packages/ apps/ scripts/`
      returns 0 lines — the constant is gone, not shadowed. The no-silent-fallback posture is live at
      the adapter: `apps/frontend/src/lib/api/adapters/supabase/supabaseAdapter.ts` still carries
      `if (normalised === '') throw new Error(`PUBLIC_PROJECT_ID is required but not set. ${PROJECT_ID_REMEDY}`);`.
      None of the three commits since the sixth pass touches this surface —
      `git diff --stat 9b48fbcd3 HEAD -- . ':(exclude).planning'` lists only the gate spec, the
      guard, and the two fixtures.
  c2:
    name: "Every project-scoped query is parameterised by it; a query missing the parameter is caught by a guard rather than by a reviewer"
    verdict: ACHIEVED
    blocking: false
    reason: >-
      CRITERION 2 NOW HOLDS, under this phase's own rule and not a rule invented for this pass. The
      rule the fourth pass drew and the sixth pass applied in both directions is: a shape the guard
      cannot read is a GAP if it is uncounted AND unstated, and a RESIDUAL if it is stated and
      measured. Reach was never required to be total — the sixth pass declined to count
      `const self = (this);` and the parameter-held client against the phase for exactly this reason.
      Three things had to be true for c2 to pass under that rule, and I measured all three rather
      than reading them. FIRST, the `this!` half is genuinely CLOSED: my own injection of
      `const self = this!;` + `self.supabase.from('elections')` into `clean.fixture.ts` now exits 1
      with `yielded 9 site(s), expected exactly 8` and a named message at the injected line, where
      the sixth pass measured exit 0 and every count byte-identical; the shape is committed as
      `nonNullAssertedOwner()` and the counts moved with it (41 sites, 20 escape hatches,
      `ownerAliasCount === 2` pinned by name). SECOND, the remainder is STATED AND MEASURED, not
      merely asserted: the docblock's `STATED RESIDUALS` section holds 11 bullets, `RESIDUAL_PHRASES`
      holds 11 phrases including `'a nullish coalesce that binds the owner whenever it is non-null — is UNREPORTED'`
      and `'so an owner reached by any other expression is unread'`, and the binding between them is
      LIVE — deleting a bullet reddens the spec `2 failed | 119 passed`
      (`expected … to contain 'so an owner reached by any other expr…'`, `expected 9 to be 10`), and
      adding a phrase with no bullet reddens it `2 failed | 119 passed`
      (`expected … to contain 'a phrase with no bullet behind it'`, `expected 10 to be 11`). THIRD,
      no ELEVENTH unstated shape survives an active hunt: I injected 21 candidate owner shapes, 9
      were reported (including the reassigned `let`, the `as unknown as` assertion, the nested arrow,
      the renamed destructure, the defaulted destructure, the default parameter and the module-sink
      assignment the orchestrator specifically named), and all 10 silent ones fall under a pinned
      residual's clause — the Proxy, the `Reflect.get`, the optional call `this?.valueOf()`, the
      angle-bracket assertion `<CleanFixture>this`, the computed member `this['inner']`, the getter
      `this.inner`, the object-literal property `{ self: this }` and the spread `{ ...this }` under
      "an owner reached by any other expression is unread"; `const self = (this);` under the
      parenthesis residual; `this ?? other` under its own bullet by name. Two are covered by a
      general clause rather than an enumeration and are recorded explicitly in `gaps_remaining`
      rather than absorbed. The first half of the criterion remains TRUE and measured: the live
      corpus is `12 guarded source(s), 0 deferred, 12 adapter source(s) on disk, 5 raw client call(s)
      examined, 2 Edge Function invocation(s), 7 client-touching site(s) in all, 550 source(s)
      outside the adapter directory walked, 1 outside site(s) examined, 0 violation(s)`, exit 0, and
      live exposure of every residual shape is ZERO. What remains open is documentation — three stale
      counts and one false sentence in a violation message — which understates the guard rather than
      overstating it and cannot make a shape unstated. That is a warning, on the same classification
      the sixth pass applied to the identical class, and it does not block.
  c3:
    name: "E2E creates its own project under a dedicated test project id; yarn test:e2e no longer requires yarn db:reset, proven by two green runs in a row"
    verdict: ACHIEVED
    blocking: false
    caveat: >-
      Held, and the on-disk evidence re-read by me at this HEAD rather than carried forward. Three
      consecutive default-suite runs, none preceded by a reset, all with `exit` -> `0`, all with
      `head` -> `9b48fbcd356c6be362a693bbe7dec9af4a82ffb1`, all `155 passed`: `161-post-cr04`,
      `161-close5`, `161-post-cr04-default`. The opt-in bank-auth evidence in `161-bank-auth-gate/`
      was audited by the sixth pass (`bank-auth-project.log` 8 passed; `journey-run1/2/3.log` 130
      passed each) and is unchanged. NO NEW E2E RUN IS OWED over `ab2fe6d9b`, and that is a
      measurement rather than an assumption: `git diff --stat 9b48fbcd3 HEAD -- . ':(exclude).planning'`
      lists exactly four files — `packages/dev-seed/tests/projectScopingGate.test.ts` (a vitest
      spec), `scripts/assert-project-scoped-queries.mjs` (a lint-chain script), and the two
      `scripts/fixtures/project-scoped-queries/*.fixture.ts` files, whose own header states they are
      "never imported, never built and never executed". None is reachable from the served
      application, so the suite's behaviour at `9b48fbcd3` is the suite's behaviour at HEAD. Per the
      orchestrator's instruction the suite was NOT re-run; it needs an operator-started stack.
  c4:
    name: "E2E prerequisite documentation in CLAUDE.md and tests/README.md updated to match, and a grep for the retired 'reset the DB first' instruction returns nothing"
    verdict: ACHIEVED
    blocking: false
    caveat: >-
      Re-measured, not carried forward.
      `grep -rniE 'reset the db first|db:reset.*before.*e2e|requires.*db:reset' CLAUDE.md tests/README.md`
      returns 0 lines at this HEAD. None of the three commits since the sixth pass touches either
      document — the only non-`.planning/` files changed since `9b48fbcd3` are the guard, the gate
      spec and the two fixtures.
gaps: []
warnings:
  - truth: "The guard's own documentation states its reach accurately (criterion 2, supporting)"
    status: partial
    blocking: false
    reason: >-
      Four sentences in `scripts/assert-project-scoped-queries.mjs` describe a guard smaller than the
      one that ships, and one of them repeats verbatim the affirmative universal claim that
      `ab2fe6d9b` deleted from the `OWNER_BINDING_RE` docblock as FALSE. None makes a shape unstated
      — the canonical reach statement is the `STATED RESIDUALS` section, which is complete, pinned
      and bidirectionally measured — so all four understate rather than overstate, and none blocks.
    artifacts:
      - path: "scripts/assert-project-scoped-queries.mjs"
        issue: >-
          Check 6's docblock opens "`ACCESS_RE` is anchored on the receiver spelling `this.supabase` /
          `this.#supabase`. SIX shapes reach the same client past that anchor" and enumerates six
          without the owner. Stale by three: check 6 now also reports the owner alias, the owner
          destructure and the non-null-asserted owner.
      - path: "scripts/assert-project-scoped-queries.mjs"
        issue: >-
          The module docblock's check-6 line reads "A guarded source may not bind the client — or any
          node on its member chain — to a local, destructure a method off either, reach a member by
          computed key — directly or one link along the chain — or reach the client FIELD by a
          bracketed key. All six reach the same client past the receiver anchor checks 1 to 4 depend
          on". No owner, and the same stale count of six.
      - path: "scripts/assert-project-scoped-queries.mjs"
        issue: >-
          NEW, unnamed by any prior pass: `checkEscapeHatches`'s own docblock reads "Check 6 over one
          source: the three shapes that reach the client past the receiver anchor" — a third stale
          count, in the function itself, naming three where six matchers now run.
      - path: "scripts/assert-project-scoped-queries.mjs"
        issue: >-
          NEW: check 6's owner VIOLATION MESSAGE still asserts "Every alias of an alias passes through
          this one position, which is why it is forbidden at the `=` rather than chased down the
          chain." — the sentence `ab2fe6d9b` deleted from the docblock as FALSE, surviving in
          operator-facing output because it is split across two concatenated string literals
          (`'… Every alias of '` + `'an alias passes through this one position, …'`), which is why a
          grep for it finds only the docblock's quotation of it as false. I observed it printed in
          full during my own `this!` reproduction. Falsified by the same enumeration that falsified
          its docblock twin: ten shapes measured this pass reach the client without passing through
          that position.
    missing:
      - >-
        In one commit: delete the false sentence from check 6's owner violation message; widen check
        6's docblock enumeration from "SIX shapes" to name the owner in its three reported spellings;
        widen the module docblock's check-6 line the same way; and correct `checkEscapeHatches`'s own
        "the three shapes" to the number of matchers it runs. All four are text-only and none changes
        a count, so the gate spec's existing pins hold across the change.
      - >-
        Optional, and recorded rather than required: tighten two residual phrases whose general
        clause covers more than their consequence clause names — "a client held in a PARAMETER is
        read by neither" also holds for the OWNER in a parameter (`takeOwner(this)` then
        `owner.supabase.from(…)`, measured silent this pass), and "an interposed comment is not
        trivia the matchers admit" also holds between `=` and `this` (`const self = /* owner */ this;`,
        measured silent this pass). Changing a phrase means changing its docblock bullet in the same
        commit, which the bidirectional binding enforces.
deferred:
  - truth: "send-email accepts any admin role without comparing scope_id to the project"
    addressed_in: "Phase 162"
    evidence: >-
      161-11-SUMMARY.md's T-161-11-03, carried forward from the fifth and sixth passes and
      re-confirmed untouched at this HEAD — `git diff --stat 9b48fbcd3 HEAD -- . ':(exclude).planning'`
      lists no file under `apps/supabase/supabase/functions/send-email`. Phase 162's ROADMAP goal and
      success criteria are the grants matrix and the `can_access_project` / `can_edit_project`
      separation, which is where a scope_id comparison belongs.
human_verification: []
---

# Phase 161: Project Scoping — `PROJECT_ID` Parameterisation — Re-Verification Report (SEVENTH pass)

**Phase Goal (verbatim, `.planning/ROADMAP.md` § "Phase 161: Project Scoping — `PROJECT_ID` Parameterisation"):**

> Every query names the project it is for, and an E2E run creates its own project instead of requiring the whole local database to be reset.

**Verified:** 2026-09-13
**HEAD:** `5bf08907ec4422af3988fd76e67d9ee40741a5ce`
**Status:** passed — 4 of 4 criteria achieved
**Recommendation:** CLOSE

---

## The narrow question this pass answers

Three commits landed since the sixth pass: `ab2fe6d9b` (close half of CR-05, state the rest),
`b69d08ae5` (the sixth report), and `5bf08907e` (the operator's acceptance of CR-05's remainder).
The first was written by the session that dispatched this verification, so nothing in its commit
message is treated here as evidence; every number below is one I produced at this HEAD.

The question is not "is the guard's reach total". It never was, and no pass has ever asked for that.
The rule is this phase's own, drawn by the fourth pass and applied in both directions by the sixth:

> A shape the guard cannot read is a **GAP** if it is uncounted **and unstated**. It is a **RESIDUAL**
> if it is **stated and measured in both directions**. A residual does not block.

So the question is: with CR-05's remainder genuinely stated and measured, does criterion 2 hold?

**It does.** The three things that had to be true are true and I measured each of them rather than
reading them: the `this!` half is closed (reproduced first-hand, where the sixth pass measured
silence); the remainder is stated in the docblock, pinned in `RESIDUAL_PHRASES`, and the binding
between the two reddens when mutated in **either** direction; and an active 21-shape hunt found no
eleventh unstated shape. What remains is documentation — and it understates the guard rather than
overstating it, which is why it is a warning, on exactly the classification the sixth pass applied to
the same class.

---

## Summary verdict table

```
+----+--------------------------------------------------------------+------------------------+----------+
| #  | Criterion (abbreviated)                                      | Verdict                | Blocking |
+----+--------------------------------------------------------------+------------------------+----------+
| c1 | PUBLIC_PROJECT_ID exists / defaults / documented; no silent  | ACHIEVED               | no       |
|    | DEFAULT_SEED_PROJECT_ID fallback                             |                        |          |
| c2 | Every project-scoped query parameterised; a missing one      | ACHIEVED               | no       |
|    | caught by a guard rather than by a reviewer                  |                        |          |
| c3 | E2E owns its project; no db:reset precondition; two green    | ACHIEVED               | no       |
|    | runs in a row                                                |                        |          |
| c4 | E2E prerequisite docs updated; retired instruction greps to  | ACHIEVED               | no       |
|    | nothing                                                      |                        |          |
+----+--------------------------------------------------------------+------------------------+----------+
```

---

## Gates, as run by me, every exit status read unpiped

Every status below was read from `$?` on its own line, with output redirected to a file first. None
was read through a pipe — the incident this repository records is a `lint:check` piped through
`grep` that hid 74 violations for two commits.

| Gate | Command | Result |
|---|---|---|
| Guard self-test | `node scripts/assert-project-scoped-queries.mjs --self-test` | `SELFTEST_EXIT=0` — `41` / `0` / `13` / `0`, `matching the committed expectation` |
| Guard live corpus | `node scripts/assert-project-scoped-queries.mjs` | `LIVE_EXIT=0` — `12 guarded source(s), 0 deferred, … 0 violation(s)` |
| Gate spec | `yarn workspace @openvaa/dev-seed vitest run tests/projectScopingGate.test.ts` | `GATE_EXIT=0` — `Tests 121 passed (121)` |
| Unit suite | `yarn test:unit` | `UNIT_EXIT=0` — `25 successful, 25 total` |
| Lint | `yarn lint:check` | `LINT_EXIT=0`; last line of the log is the project-scoped query guard's own summary, so the chain reaches its final link |
| Format | `yarn format:check` | `FORMAT_EXIT=0` — `All matched files use Prettier code style!` |

E2E was **not** run, per instruction; see c3 for why none is owed over `ab2fe6d9b`.

---

## 1. Is the residual binding LIVE, or decorative?

This is the fact the whole stated-residual rule rests on. If the binding does not hold, "stated" is
worthless and CR-05's remainder is still an unstated gap. I mutated it in both directions.

**Direction A — delete a bullet, the spec must redden.** I removed the six-line owner-EXPRESSION
bullet from the guard's `STATED RESIDUALS` section:

```
Tests  2 failed | 119 passed (121)
 FAIL  … > states exactly the residuals the matrix pins, and no others
   → expected 'STATED RESIDUALS. Each phrase below i…' to contain 'so an owner reached by any other expr…'
 FAIL  … > reddens when a stated residual is deleted from the docblock
   → expected 9 to be 10
```

**Direction B — add a phrase with no bullet, the spec must redden.** I appended
`'a phrase with no bullet behind it'` to `RESIDUAL_PHRASES`:

```
Tests  2 failed | 119 passed (121)
   → expected 'STATED RESIDUALS. Each phrase below i…' to contain 'a phrase with no bullet behind it'
   → expected 10 to be 11
```

The binding is live. A residual cannot be stated without being measured, nor measured without being
stated. Both mutations reverted; `git status --porcelain -- scripts/ packages/` empty.

**The two new phrases are really in both places.** `RESIDUAL_PHRASES` ends:

```ts
  'a receiver wrapped in PARENTHESES is unread by every matcher here',
  'a nullish coalesce that binds the owner whenever it is non-null — is UNREPORTED',
  'so an owner reached by any other expression is unread'
];
```

and the docblock carries the matching bullets — "the owner rule's `?` exclusion is a bare character,
so `const self = this ?? other;` — a nullish coalesce that binds the owner whenever it is non-null —
is UNREPORTED…" and "the owner rule reads a binding of `this` at an `=`, so an owner reached by any
other expression is unread: a spread, an `Object.assign`, an arrow that returns it, a `for…of` over
an array holding it, an array destructure of that array, and a getter returning it…". Eleven bullets,
eleven phrases.

---

## 2. The `this!` closure, reproduced first-hand

Injected into a scratch copy of `clean.fixture.ts`:

```ts
  scratchNonNullOwner(): AnyBuilder {
    const self = this!;
    return self.supabase.from('elections').select('*');
  }
```

`node scripts/assert-project-scoped-queries.mjs --self-test` → `INJECT_THIS_BANG_EXIT=1`:

```
[ERROR] … clean.fixture.ts yielded 9 site(s), expected exactly 8 (the bucket access must be excluded).
[ERROR] … clean.fixture.ts:154: this binds the client's owner to a local. …
… 2 expectation(s) FAILED.
```

The sixth pass measured this shape at exit 0 with `clean.fixture.ts (8 access(es))` and every
committed count byte-identical. It now reddens. The mechanism is the widened lookahead at line 692:

```js
const OWNER_BINDING_RE = /(?<![=!<>])=\s*(?:await\s+)?this\b(?!\s*(?:[.?[]|!(?:\.|=)))/g;
```

`!(?:\.|=)` is two characters wide, which is what tells a mid-chain `!.` and a comparison `!=` from a
terminating `this!`. The shape is committed as `nonNullAssertedOwner()` in `violation.fixture.ts`,
and the counts moved with it — `violationCount === 41`, `escapeHatches === 20`, and
`ownerAliasCount === 2` pinned **by name** with a failure message that says which spelling is
missing. Fixture reverted.

---

## 3. Is the `??` half honestly declared?

`ab2fe6d9b` claims it deliberately did **not** spell the exclusion `[?]` to slip past the
back-pressure predicate. Checked against the committed regex, not the message:

- The `?` is still a **bare** character inside `[.?[]` — the original spelling, unchanged in meaning.
- It is **not** `[?]`, and the matcher span contains **no escaped `\?`** anywhere.
- `OWNER_BINDING_RE` is still **absent** from `MATCHER_NAMES` (nine entries, `ACCESS_RE` …
  `COMPUTED_FUNCTIONS_RE`).
- The predicate is unchanged: `expect(matcherSpanOf(name).text, `${name} is an unenumerated matcher`).not.toContain('\\?')`.

So the predicate passes for the reason the commit states, not for a reason it engineered. The claim
is true.

**And the cost the operator's decision rests on reproduces.** Replacing `[.?[]` with
`[.[]|\?(?!\?)` — the narrowing that would report the nullish-coalesced owner — gives:

```
Tests  2 failed | 119 passed (121)
 FAIL  … > names every matcher the guard declares that admits an optional punctuator
 FAIL  … > admits no optional punctuator, which is the measured fact its absence from MATCHER_NAMES rests on
```

Exactly the 2 the operator was shown. Mutation reverted.

The back-pressure predicate's blindness to a bare `?` in an excluding character class is a **known,
recorded** weakness — named in the sixth report and in `deferred-items.md`, and still accurately
described. It is not re-reported here as new.

---

## 4. The hunt for an eleventh unstated shape

Twenty-one candidate owner shapes injected into a scratch copy of `clean.fixture.ts` across two
batches, including every shape the orchestrator named.

**REPORTED (9)** — `let` bound then reassigned (`self = this;`); `const self = this as unknown as CleanFixture;`;
`this` bound inside a nested arrow; the renamed destructure `const { supabase: alias } = this;`; the
defaulted destructure `const { supabase = other } = this;`; a comma-separated declarator list; a
default parameter `probeDefaultParam(self: CleanFixture = this)`; an assignment to a module-level
sink `sink.owner = this;`; and a `.bind(this)` helper whose body spells `this.supabase.from(…)` and
is caught by check 1.

**SILENT (10), each covered by a pinned residual** —

| Shape | Covered by |
|---|---|
| `const self = this ?? other;` | its own bullet, **by name** |
| `const bag = { ...this };` | "an owner reached by any other expression is unread" (named in the enumeration) |
| `const self = this.inner;` (getter returning the owner) | same bullet — "a getter returning it" is named verbatim |
| `const self = new Proxy(this, {}) as CleanFixture;` | same bullet, general clause |
| `const db = Reflect.get(this, 'supabase') as AnyClient;` | same bullet, general clause |
| `const self = this?.valueOf() as CleanFixture;` | same bullet, general clause |
| `const self = <CleanFixture>this;` | same bullet, general clause |
| `const self = this['inner'];` | same bullet, general clause |
| `const bag = { self: this };` | same bullet, general clause |
| `const self = (this);` | "a receiver wrapped in PARENTHESES is unread by every matcher here" |

Two further silent shapes are covered by a general clause whose **consequence** clause names
something narrower, and I record them explicitly in `gaps_remaining` rather than absorb them:
`takeOwner(this)` then `owner.supabase.from(…)` (the residual names the *client* in a parameter, not
the owner) and `const self = /* owner */ this;` (the residual's consequence names a *receiver and a
member* separated by a comment). In both cases the mechanism sentence is exactly why the shape is
silent and no sentence in the docblock claims it is caught, so neither is an unstated gap — but both
wordings are worth tightening.

Every silent shape contributes **zero** to the site count: batch 1 injected 14 shapes and the clean
fixture went 8 → 14 accesses, i.e. exactly the 6 reported ones. The remaining 8 leave every count
byte-identical, which is the CR-signature — and which is precisely why they have to be *stated*.

**No eleventh unstated shape was found.**

---

## 5. What did NOT regress

`c1`, `c3` and `c4` were re-measured, not carried forward, and each is unchanged. The three commits
since the sixth pass touch only the guard, its two fixtures, the gate spec and `.planning/`:

```
$ git diff --stat 9b48fbcd356c6be362a693bbe7dec9af4a82ffb1 HEAD -- . ':(exclude).planning'
 packages/dev-seed/tests/projectScopingGate.test.ts |  4 +-
 scripts/assert-project-scoped-queries.mjs          | 65 +++++++++++++++++-----
 .../project-scoped-queries/clean.fixture.ts        | 12 ++++
 .../project-scoped-queries/violation.fixture.ts    | 10 ++++
```

None is reachable from the served application — a lint-chain script, a vitest spec, and two fixtures
whose own header states they are "never imported, never built and never executed" — so the three
`155 passed` E2E runs at `9b48fbcd3` remain valid at this HEAD and no new run is owed.

---

## 6. The phase is closeable

All four criteria are ACHIEVED. The gaps list is empty. What remains is four sentences of
documentation in one file, listed under `warnings` with the exact text to change; every one of them
**understates** the guard, so none can mislead a reader into believing something is caught that is
not, and none can make a shape unstated. The canonical statement of the guard's reach is the
`STATED RESIDUALS` section, which is complete, pinned, and measured in both directions — proven this
pass by mutation rather than by reading.

The one thing a later reader must not lose: the `operator_decision` block above, carried forward
verbatim, is why a residual that was a blocker at the sixth pass is not one now. It covers **two
named residuals**, not criterion 2 as a whole — and criterion 2 passes here on its own measured
evidence, not on the waiver.

---

_Verified: 2026-09-13T16:40:00Z_
_Verifier: Claude (gsd-verifier) — seventh pass_
