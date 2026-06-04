---
phase: 89-continuing-test-refactoring-implement-the-new-candidate-jour
plan: LAST
type: execute
wave: 4
depends_on:
  - 89-03
  - 89-04
files_modified:
  - tests/tests/specs/candidate/candidate-auth.spec.ts
  - tests/tests/specs/candidate/candidate-password.spec.ts
  - tests/tests/specs/candidate/candidate-registration.spec.ts
  - tests/tests/specs/candidate/candidate-questions.spec.ts
  - tests/tests/specs/candidate/candidate-required-info.spec.ts
  - tests/tests/specs/candidate/candidate-settings.spec.ts
  - tests/playwright.config.ts
  - tests/tests/pages/candidate
autonomous: true
requirements:
  - D-89-04
  - TIR4-RETIRE-01

must_haves:
  truths:
    - "5 candidate spec files deleted from disk: candidate-auth.spec.ts, candidate-password.spec.ts, candidate-registration.spec.ts, candidate-questions.spec.ts, candidate-required-info.spec.ts"
    - "candidate-settings.spec.ts is intact except blocks 7.1.2 (lines 166-187), 7.1.3 (lines 200-220), 7.1.4 (lines 242-271) which are excised per D-89-04"
    - "All other surviving candidate specs (candidate-profile, candidate-profile-validation, candidate-translation, candidate-bank-auth, candidate-settings residual) remain intact"
    - "playwright.config.ts testMatch entries no longer reference deleted spec files; defunct project entries are removed"
    - "Legacy PageObject classes at tests/tests/pages/candidate/*Page.ts are pruned ONLY when grep audit confirms zero remaining consumers across surviving specs"
    - "Full e2e suite (default + PLAYWRIGHT_LEGACY=1) passes post-deletion with zero broken imports + zero orphan testIgnore entries"
  artifacts:
    - path: "tests/playwright.config.ts"
      provides: "Updated testMatch/testIgnore reflecting the post-retirement spec inventory"
    - path: "tests/tests/specs/candidate/candidate-settings.spec.ts"
      provides: "Residual TIR5-deferred test blocks only (7.1.1, 7.1.7, 7.1.8, 7.1.10-17)"
  key_links:
    - from: "tests/playwright.config.ts"
      to: "surviving candidate spec files"
      via: "testMatch project entry regex"
      pattern: "candidate-(profile|translation|bank-auth|settings)"
---

<objective>
Plan 89-LAST executes the legacy retirement scope per D-89-04. Deletes the 5 candidate spec files fully absorbed by 89-03 candidate-mega-journey + 89-04 perms. Excises blocks 7.1.2/7.1.3/7.1.4 from candidate-settings.spec.ts (the file STAYS for its TIR5-deferred residual blocks 7.1.1/7.1.7/7.1.8/7.1.10-17). Audits per-class consumers of legacy PageObject classes at tests/tests/pages/candidate/ and prunes ONLY classes with zero surviving consumers. Updates playwright.config.ts to remove defunct testIgnore entries + project definitions that pointed at deleted specs.

Purpose: Complete the parallel-landing → legacy-retirement transition that Phase 89 charter mandates.
Output: 5 deleted specs + 3 excised blocks + N pruned PageObject classes + updated playwright.config.ts + full-suite green proof.
</objective>

<execution_context>
@$HOME/.claude/get-shit-done/workflows/execute-plan.md
@$HOME/.claude/get-shit-done/templates/summary.md
</execution_context>

<context>
@.planning/PROJECT.md
@.planning/ROADMAP.md
@.planning/STATE.md
@.planning/phases/89-continuing-test-refactoring-implement-the-new-candidate-jour/89-CONTEXT.md
@.planning/phases/89-continuing-test-refactoring-implement-the-new-candidate-jour/89-RESEARCH.md
@.planning/phases/89-continuing-test-refactoring-implement-the-new-candidate-jour/89-PATTERNS.md
@.planning/phases/89-continuing-test-refactoring-implement-the-new-candidate-jour/89-03-PLAN.md
@.planning/phases/89-continuing-test-refactoring-implement-the-new-candidate-jour/89-04-PLAN.md
@TEST-INVENTORY-REFACTOR-4.md
@CLAUDE.md
</context>

<tasks>

<task type="auto">
  <name>Task 1: Audit legacy PageObject class consumers (read-only inventory)</name>
  <files>.planning/phases/89-continuing-test-refactoring-implement-the-new-candidate-jour/89-LAST-AUDIT.md</files>
  <read_first>
    - tests/tests/pages/candidate (ls — list all *Page.ts files)
    - tests/tests/specs/candidate (ls — list all spec files; identify which survive post-deletion: candidate-profile, candidate-profile-validation, candidate-translation, candidate-bank-auth, candidate-settings residual)
    - .planning/phases/89-continuing-test-refactoring-implement-the-new-candidate-jour/89-RESEARCH.md (§ "Plan 89-LAST" audit method + likely-keep table)
  </read_first>
  <action>
    For each `*Page.ts` file under `tests/tests/pages/candidate/`:
    Run `grep -rln "from.*pages/candidate/<ClassName>" tests/tests/specs/ tests/tests/fixtures/` (the import path pattern).
    Build a table in `89-LAST-AUDIT.md` listing: class name, surviving consumers (after the 5 specs are deleted), verdict (KEEP / DELETE).

    Apply the post-deletion projection: assume `candidate-auth.spec.ts`, `candidate-password.spec.ts`, `candidate-registration.spec.ts`, `candidate-questions.spec.ts`, `candidate-required-info.spec.ts` are gone. The remaining consumers are computed against the SURVIVING specs only.

    Expected verdicts per 89-RESEARCH:
    - HomePage.ts → likely KEEP (candidate-profile-validation, candidate-settings residual)
    - LoginPage.ts → likely KEEP
    - PreviewPage.ts → audit needed
    - ProfilePage.ts → KEEP (candidate-profile, candidate-profile-validation)
    - QuestionPage.ts → audit (candidate-translation?)
    - QuestionsPage.ts → audit
    - SettingsPage.ts → KEEP (candidate-settings residual)

    The audit table is the source of truth for Task 3.
  </action>
  <verify>
    <automated>test -f .planning/phases/89-continuing-test-refactoring-implement-the-new-candidate-jour/89-LAST-AUDIT.md &amp;&amp; grep -c "KEEP\|DELETE" .planning/phases/89-continuing-test-refactoring-implement-the-new-candidate-jour/89-LAST-AUDIT.md | awk '{ if ($1 < 7) { print "FAIL: expected ≥7 class verdicts, got " $1; exit 1 } else { print "PASS: " $1 " class verdicts" } }'</automated>
  </verify>
  <done>89-LAST-AUDIT.md exists with explicit KEEP/DELETE verdict per PageObject class.</done>
</task>

<task type="auto">
  <name>Task 2: Delete 5 absorbed spec files + excise 7.1.2/3/4 blocks from candidate-settings.spec.ts</name>
  <files>
    tests/tests/specs/candidate/candidate-auth.spec.ts,
    tests/tests/specs/candidate/candidate-password.spec.ts,
    tests/tests/specs/candidate/candidate-registration.spec.ts,
    tests/tests/specs/candidate/candidate-questions.spec.ts,
    tests/tests/specs/candidate/candidate-required-info.spec.ts,
    tests/tests/specs/candidate/candidate-settings.spec.ts
  </files>
  <read_first>
    - tests/tests/specs/candidate/candidate-settings.spec.ts (lines 166-187 [7.1.2], 200-220 [7.1.3], 242-271 [7.1.4] — exact line ranges to excise per D-89-04 + R10)
    - .planning/phases/89-continuing-test-refactoring-implement-the-new-candidate-jour/89-RESEARCH.md (§ "Plan 89-LAST" + R10 — confirms 7.1.3 retires per CONTEXT.md D-89-04)
    - .planning/phases/89-continuing-test-refactoring-implement-the-new-candidate-jour/89-CONTEXT.md (D-89-04 verbatim cuts)
  </read_first>
  <behavior>
    - The 5 spec files no longer exist on disk.
    - candidate-settings.spec.ts still exists. Its 7.1.1, 7.1.7, 7.1.8, 7.1.10-17 test blocks are intact. Its 7.1.2, 7.1.3, 7.1.4 test blocks are removed.
    - Any helper imports / test-id imports left orphaned by the excision are cleaned up so lint passes.
  </behavior>
  <action>
    Step A: `git rm` each of the 5 listed spec files.
    Step B: In `candidate-settings.spec.ts`, locate the 7.1.2 `should show maintenance page when candidateApp is disabled` test block (around lines 166-187), 7.1.3 `should show maintenance page when underMaintenance is true` (lines 200-220), 7.1.4 `should display notification popup when enabled` (lines 242-271). Delete these three test blocks. Preserve any surrounding describe wrappers if they contain other tests; otherwise remove empty describe wrappers.
    Step C: Run `yarn lint:check` and clean any newly-orphaned imports.
  </action>
  <verify>
    <automated>! test -f tests/tests/specs/candidate/candidate-auth.spec.ts &amp;&amp; ! test -f tests/tests/specs/candidate/candidate-password.spec.ts &amp;&amp; ! test -f tests/tests/specs/candidate/candidate-registration.spec.ts &amp;&amp; ! test -f tests/tests/specs/candidate/candidate-questions.spec.ts &amp;&amp; ! test -f tests/tests/specs/candidate/candidate-required-info.spec.ts &amp;&amp; test -f tests/tests/specs/candidate/candidate-settings.spec.ts &amp;&amp; grep -c "should show maintenance page when candidateApp is disabled\|should show maintenance page when underMaintenance is true\|should display notification popup when enabled" tests/tests/specs/candidate/candidate-settings.spec.ts | awk '{ if ($1 > 0) { print "FAIL: excised blocks still present: " $1; exit 1 } else { print "PASS: 7.1.2/3/4 excised" } }' &amp;&amp; yarn lint:check 2>&amp;1 | tail -5</automated>
  </verify>
  <done>5 specs deleted; candidate-settings.spec.ts retains residual TIR5-deferred blocks only; lint clean.</done>
</task>

<task type="auto">
  <name>Task 3: Prune unused PageObject classes per Task 1 audit verdicts</name>
  <files>
    tests/tests/pages/candidate
  </files>
  <read_first>
    - .planning/phases/89-continuing-test-refactoring-implement-the-new-candidate-jour/89-LAST-AUDIT.md (Task 1 verdicts)
    - tests/tests/fixtures/index.ts (full — legacy PageObject root; this file STAYS but may need pruned import lines for any DELETE-verdict class)
  </read_first>
  <behavior>
    - Every PageObject class with a DELETE verdict per Task 1 audit is removed.
    - tests/tests/fixtures/index.ts (legacy PageObject root) has its import lines for DELETE-verdict classes removed; lines for KEEP-verdict classes are intact.
    - No new TypeScript errors; no new lint errors.
  </behavior>
  <action>
    For each class marked DELETE in 89-LAST-AUDIT.md:
    - `git rm` the file at `tests/tests/pages/candidate/<ClassName>.ts`.
    - Remove its import + registration line in `tests/tests/fixtures/index.ts` if present.
    Run `yarn build && yarn lint:check` after each deletion.
  </action>
  <verify>
    <automated>yarn build 2>&amp;1 | tail -5 &amp;&amp; yarn lint:check 2>&amp;1 | tail -5</automated>
  </verify>
  <done>DELETE-verdict classes removed; KEEP-verdict classes intact; build + lint clean.</done>
</task>

<task type="auto">
  <name>Task 4: Update playwright.config.ts — remove defunct projects + clean testIgnore</name>
  <files>tests/playwright.config.ts</files>
  <read_first>
    - tests/playwright.config.ts (full — focus on lines 97-538 PLAYWRIGHT_LEGACY block + the testMatch/testIgnore audit per 89-RESEARCH § "Plan 89-LAST")
    - .planning/phases/89-continuing-test-refactoring-implement-the-new-candidate-jour/89-RESEARCH.md (§ "Plan 89-LAST" verbatim config edits)
  </read_first>
  <behavior>
    - `candidate-app` project testMatch is updated to exclude deleted specs (candidate-auth, candidate-questions). If the remaining regex covers only `candidate-translation`, ensure it still matches.
    - `candidate-app-mutation` project testMatch is updated to remove candidate-registration (only candidate-profile remains).
    - `candidate-app-password` project is DELETED entirely (its lone spec candidate-password.spec.ts is gone).
    - `variant-hidden-required-candidate` project is DELETED (its spec candidate-required-info.spec.ts is gone). If its setup `data-setup-hidden-required` has no other consumer, delete that too.
    - Any testIgnore entries referencing deleted files are removed.
    - All remaining surviving projects (perm-*, voter-mega-journey, candidate-mega-journey, candidate-app residual, candidate-app-mutation residual, candidate-app-settings, re-auth-setup) are intact.
  </behavior>
  <action>
    Apply the config edits per 89-RESEARCH § "Plan 89-LAST" Files-to-MODIFY block:
    (a) candidate-app testMatch: trim to surviving specs (likely just candidate-translation).
    (b) candidate-app-mutation testMatch: trim to candidate-profile.
    (c) DELETE candidate-app-password project entry entirely (lines ~238-247 per 89-RESEARCH; verify exact line range).
    (d) DELETE variant-hidden-required-candidate project entry. If its data-setup project has no other consumer, delete it too. Confirm via grep.
    (e) Audit testIgnore entries across all surviving projects; remove any references to deleted specs.
  </action>
  <verify>
    <automated>cd tests &amp;&amp; npx tsc --noEmit 2>&amp;1 | tail -5 &amp;&amp; grep -c "candidate-auth\|candidate-password\|candidate-registration\|candidate-questions\|candidate-required-info" tests/playwright.config.ts | awk '{ if ($1 > 0) { print "FAIL: deleted spec references remain: " $1; exit 1 } else { print "PASS: 0 deleted-spec references" } }'</automated>
  </verify>
  <done>candidate-app-password + variant-hidden-required-candidate projects deleted; testMatch regexes trimmed; testIgnore audited; 0 references to deleted specs remain; TypeScript clean.</done>
</task>

<task type="auto">
  <name>Task 5: Full-suite green proof (default + PLAYWRIGHT_LEGACY=1)</name>
  <files>.planning/phases/89-continuing-test-refactoring-implement-the-new-candidate-jour/89-LAST-VERIFY.txt</files>
  <read_first>
    - .planning/phases/88-e2e-test-catalog-audit-remove-add-consolidate-tests-fresh-ba/88-04-VERIFY.txt (88-04 verify log format)
  </read_first>
  <action>
    Run two full-suite invocations:
    Run A: `yarn db:reset && yarn db:seed --template baseV1 && yarn test:e2e` (default-mode — picks up perm-* + baseV1 chain + voter-mega + candidate-mega + 3 perms).
    Run B: `cd tests && PLAYWRIGHT_LEGACY=1 yarn test:e2e` (legacy chain — surviving candidate specs pass).
    Capture stdout/exit codes to `89-LAST-VERIFY.txt`.
    Both runs must exit 0.
    If any failure: identify root cause (broken import / orphan testIgnore / missing PageObject); fix; rerun. Atomic commits per fix per 88-04 precedent.
  </action>
  <verify>
    <automated>test -f .planning/phases/89-continuing-test-refactoring-implement-the-new-candidate-jour/89-LAST-VERIFY.txt &amp;&amp; grep -c "Run A.*PASS\|Run B.*PASS\|run a.*pass\|run b.*pass" .planning/phases/89-continuing-test-refactoring-implement-the-new-candidate-jour/89-LAST-VERIFY.txt | awk '{ if ($1 < 2) { print "FAIL: expected ≥2 PASS markers (default + legacy), got " $1; exit 1 } else { print "PASS: " $1 " PASS markers" } }'</automated>
  </verify>
  <done>Both default + PLAYWRIGHT_LEGACY=1 full-suite runs PASS; 89-LAST-VERIFY.txt records both.</done>
</task>

</tasks>

<threat_model>
## Trust Boundaries

| Boundary | Description |
|----------|-------------|
| File deletion → import-graph | Deleting a PageObject still consumed by surviving spec yields TS error |
| testIgnore cleanup → suite coverage | Removing wrong testIgnore entry could double-execute a spec under two projects |

## STRIDE Threat Register

| Threat ID | Category | Component | Disposition | Mitigation Plan |
|-----------|----------|-----------|-------------|-----------------|
| T-89-LAST-01 | Tampering | Premature deletion of in-use PageObject | mitigate | Task 1 audit table is the source of truth; Task 3 only deletes DELETE-verdict classes. |
| T-89-LAST-02 | Denial of Service | Defunct project entry kept in playwright.config.ts referencing missing spec | mitigate | Task 4 explicit deletions per 89-RESEARCH § "Plan 89-LAST"; Task 5 full-suite catches any orphan. |
| T-89-LAST-03 | Information Disclosure | Excision of candidate-settings 7.1.3 might lose underMaintenance coverage | accept | Per D-89-04 explicit retirement (R10 confirms 7.1.3 retires); the perm-* chain covers voterApp/candidateApp disable cases. |
| T-89-LAST-04 | Repudiation | Lost git history on deleted specs | accept | `git rm` preserves history; deletion is the documented retirement per D-89-04. |
| T-89-LAST-SC | Tampering | No package installs | accept | No npm/pip/cargo install tasks. |
</threat_model>

<verification>
- 5 deleted specs no longer exist on disk.
- candidate-settings.spec.ts contains 0 occurrences of the 3 excised test descriptions.
- All KEEP-verdict PageObject classes intact; DELETE-verdict classes gone.
- playwright.config.ts: 0 references to deleted spec names; candidate-app-password + variant-hidden-required-candidate project entries removed.
- `yarn build && yarn lint:check` clean.
- `yarn test:e2e` PASS (default mode).
- `PLAYWRIGHT_LEGACY=1 yarn test:e2e` PASS.
- 89-LAST-VERIFY.txt records both full-suite runs.
</verification>

<success_criteria>
- D-89-04 retirement scope executed verbatim.
- TIR4-RETIRE-01 closed: legacy candidate spec inventory shrunk to D-89-04 keep list only.
- Full e2e suite green in both default + legacy modes.
- 0 orphan testIgnore entries; 0 broken imports.
</success_criteria>

<output>
Create `.planning/phases/89-continuing-test-refactoring-implement-the-new-candidate-jour/89-LAST-SUMMARY.md` when done.
</output>
