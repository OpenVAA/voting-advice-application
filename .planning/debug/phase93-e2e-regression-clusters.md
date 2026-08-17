---
status: resolved
trigger: "Two regression clusters from Phase 93 E2E reorg: (A) prefix-rewrite misses test-* -> test-e2e-base-*, (B) election-count isolation leak (3 elections instead of 1/2)"
created: 2026-06-03T00:00:00Z
updated: 2026-06-04T00:00:00Z
resolved: 2026-06-04
resolution_note: "Both clusters fixed + committed (Cluster A: 1e7d8842f; Cluster B: efd7cbe11). All offline gates green (typecheck, dev-seed unit 450/17, playwright --list 84/72, eslint). The one remaining open gate — the operator-owned full `yarn test:e2e` checkpoint — was satisfied by Phase 94's human-verified green run (82 passed / 2 skipped, 2026-06-04 via /gsd-verify-work). Closed at v2.10 milestone audit."
---

## Current Focus

hypothesis: Cluster A = stale test-* literals in tests/utils not rewritten to test-e2e-base-*. Cluster B = playwright project graph (Plan 04 a9b20222f) dropped a serialization edge letting base+perm chains coexist on shared DB.
test: Read base.ts canonical ids, grep all stale literals, diff playwright config at a9b20222f.
expecting: Find stale literals in candidateJourneyConstants.ts + voterNavigation.ts; find missing teardown/dependency edge in playwright graph.
next_action: Read base.ts, candidateJourneyConstants.ts, voterNavigation.ts, playwright.config.ts, and diff a9b20222f.

## Symptoms

expected: perm-1e1cg1co sees 1 election; voter-journey sees 2 elections; candidate-journey setup finds candidate by external_id.
actual: BOTH perm-1e1cg1co and voter-journey see 3 elections (base 2 + perm 1 coexist). candidate-journey setup fails: "sendEmail: failed to find candidate test-ca-aa-unregistered: Cannot coerce the result to a single JSON object".
errors: "sendEmail: failed to find candidate test-ca-aa-unregistered: Cannot coerce the result to a single JSON object"
reproduction: yarn db:reset && yarn dev, then yarn test:e2e
started: Phase 93 E2E reorg (Plan 93-06 prefix rewrite + Plan 93-04 playwright graph rewrite)

## Eliminated

## Evidence

- timestamp: T1
  checked: base.ts canonical external_ids vs candidateJourneyConstants.ts
  found: base seeds candidate `test-e2e-base-ca-aa-unregistered` but UNREGISTERED_CANDIDATE_EXTERNAL_ID='test-ca-aa-unregistered' (stale). CONFIRMS Cluster A candidate failure.
  implication: Fix line 56 -> 'test-e2e-base-ca-aa-unregistered'.

- timestamp: T2
  checked: How INFO_QUESTION_ANSWERS keys are consumed (candidate-journey.spec.ts:130,487,541,666)
  found: keys are internal map keys; spec does externalId.replace(/^test-/,'') -> regex \[qu-info-text\] matching rendered NAME tokens (base.ts name: '[qu-info-text]...'). NOT used as DB external_ids. Changing keys to test-e2e-base-* would BREAK the .replace derivation.
  implication: LEAVE INFO_QUESTION_ANSWERS keys as-is. Orchestrator claim verified.

- timestamp: T3
  checked: voterNavigation.ts stale election/constituency refs (lines 28,29,34,35)
  found: refs test-election-1/2, test-constituency-alpha/e2 = OLD deleted e2e.ts ids. base now uses test-e2e-base-el-reg/el-mun + co-reg-n/s + co-mun-*. resolveSeedUuids() returns empty arrays -> broken fallback URL.
  implication: Only consumed by navigateDirectlyToQuestions FALLBACK (goto-silent-fail recovery), used by perm specs + minimalVoterResultsPage fixture, NOT primary voter-journey path. Fix for completeness; latent not primary.

- timestamp: T4
  checked: git diff a9b20222f^ a9b20222f -- playwright.config.ts
  found: BEFORE: data-setup-baseV1 dependencies:['perm-not-located-2e2cg'] (base anchored on LAST perm spec -> entire perm chain completed BEFORE base seeded). AFTER (FLAG-6): data-setup-base has NO perm dependency, only teardown:'data-teardown-base'. Base + perm chains now run concurrently on shared single DB.
  implication: perm-1e1cg1co setup runs runTeardown('test-') which matches test-e2e-base-% (base rows). With concurrency, base + perm interleave -> 3 elections. ROOT CAUSE of Cluster B.

reasoning_checkpoint:
  hypothesis: "Cluster B = FLAG-6 dropped the base->perm-not-located-2e2cg serialization anchor; base setup now runs concurrently with the perm chain on the shared single DB. perm-1e1cg1co setup's runTeardown('test-') deletes base test-e2e-base-% rows, and base's e2e-perm- preclear cannot serialize against perm -> base(2el)+perm(1el) coexist = 3 elections in both voter-journey and perm-1e1cg1co specs."
  confirming_evidence:
    - "git diff shows base dependencies:['perm-not-located-2e2cg'] removed, replaced by bare teardown: key"
    - "perm-1e1cg1co.setup.ts passes extraTeardownPrefix:['test-','e2e-perm-']; 'test-' matches base test-e2e-base-%"
    - "base.setup.ts only preclears 'e2e-perm-', never serializes against perm seeding"
  falsification_test: "Seed base then perm-1e1cg1co concurrently and count elections; if isolation holds (1 or 2, never 3) hypothesis is wrong."
  fix_rationale: "Restore a serialization edge base<->perm WITHOUT violating FLAG-6 standalone-base intent. Option: make the FIRST perm setup (data-setup-perm-1e1cg1co) depend on the base teardown completion, OR drop the 'test-' preclear from perm setups (perm uses e2e-perm- prefix exclusively, so the 'test-' preclear is the actual cross-namespace violator — it deletes base rows). Minimal fix = remove 'test-' from perm preclears since perm never seeds test-* rows; base owns test-e2e-base-, perm owns e2e-perm-. Two disjoint namespaces should NOT preclear each other's prefix."
  blind_spots: "Whether any perm template still seeds bare test-* rows (would need the 'test-' preclear). Whether removing 'test-' from ALL perm setups (89-04 + 91 families also use ['test-','e2e-perm-']) is safe. Whether base setup completing AFTER perm could leave base's 2 elections visible to a later perm spec (need base teardown to fire, or base+perm genuinely disjoint)."

- timestamp: T5
  checked: LIVE reproduction via tsx + SupabaseAdminClient seeding base + perm-1e1cg1co
  found: INTERLEAVE B reproduced 3 elections (base 2 + perm 1) when base re-seeds alongside perm without coordinated preclear. FIXED serial ordering (base+journeys complete, THEN perm setup) yields voter=2, perm=1. CONFIRMED both root cause + fix.
  implication: Fix = serialize 88-03 perm chain AFTER journeys; perm depends on journeys (not base on perm) preserves FLAG-6 opt-in standalone (opt-in --project runs pull only base, never perm).

## Resolution

root_cause: |
  CLUSTER A (candidate-journey setup failure): UNREGISTERED_CANDIDATE_EXTERNAL_ID in
  tests/tests/utils/candidateJourneyConstants.ts:56 still 'test-ca-aa-unregistered' but
  base.ts now seeds 'test-e2e-base-ca-aa-unregistered' (Plan 06 prefix rewrite missed
  consumers in tests/utils outside its file list). sendEmail can't find the candidate.
  Secondary (latent): voterNavigation.ts:28-35 has 4 stale election/constituency refs
  (test-election-1/2, test-constituency-alpha/e2) from the deleted old e2e.ts dataset;
  only used in the navigateDirectlyToQuestions fallback (perm specs + minimalVoterResultsPage).
  INFO_QUESTION_ANSWERS keys (test-qu-info-*) are CORRECT as-is (internal map keys consumed
  via .replace(/^test-/) to derive [qu-info-*] display-label regexes, NOT DB external_ids).

  CLUSTER B (3-election leak): Plan 04 (a9b20222f) FLAG-6 dropped the
  data-setup-baseV1.dependencies=['perm-not-located-2e2cg'] anchor that serialized the perm
  chain BEFORE base seeding. The 88-03 perm chain (data-setup-perm-1e1cg1co, no deps) now runs
  CONCURRENTLY with data-setup-base on the shared single DB. base and perm share the app_settings
  JSONB singleton AND have mutually-destructive preclears (perm setup's extraTeardownPrefix 'test-'
  deletes base test-e2e-base-% rows; base setup's 'e2e-perm-' preclear deletes perm rows), with no
  serialization edge. Interleaving lets base(2 elections) + perm(1 election) coexist = 3.
fix: |
  CLUSTER A: candidateJourneyConstants.ts:56 -> 'test-e2e-base-ca-aa-unregistered'.
  voterNavigation.ts:28,29,34,35 -> test-e2e-base-el-reg/el-mun + test-e2e-base-co-reg-n/co-mun-ne.
  INFO_QUESTION_ANSWERS left unchanged (verified correct).
  CLUSTER B: serialize the 88-03 perm chain AFTER the journey leaves — set
  data-setup-perm-1e1cg1co.dependencies=['voter-journey','candidate-journey'] and chain the
  89-04 perm family after perm-not-located-2e2cg (instead of candidate-journey) to keep ONE
  linear perm ordering. Preserves FLAG-6: perm depends on journeys (not base on perm), so opt-in
  --project runs pull only base+auth, never the perm family.
verification: |
  - Live: base seeds candidate findable under test-e2e-base-ca-aa-unregistered (1 row), old id 0 rows.
  - Live: serialized ordering (base+journeys -> perm setup) yields voter=2 elections, perm=1. No 3-leak.
  - yarn typecheck:tests EXIT 0.
  - yarn workspace @openvaa/dev-seed test:unit: 450 passed, 17 skipped.
  - npx playwright test --list: 84 tests / 72 files, graph resolves, no cycle.
  - grep mega|baseV1 (excl e2e-perm, .planning): empty.
  - eslint changed files: 0 errors.
  NOT yet run offline: full yarn test:e2e (operator-owned E2E checkpoint).
files_changed:
  - tests/tests/utils/candidateJourneyConstants.ts (commit 1e7d8842f)
  - tests/tests/utils/voterNavigation.ts (commit 1e7d8842f)
  - tests/playwright.config.ts (commit efd7cbe11)
