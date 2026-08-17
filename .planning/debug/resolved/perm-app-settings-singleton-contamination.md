---
status: resolved
trigger: "perm-* E2E family flaky: all ~25 perm setup projects deep-merge their app_settings into the single runtime app_settings DB singleton; after all setups run, the singleton is a blend of every perm's settings, so each perm spec walks against contaminated settings and stalls."
created: 2026-06-20T00:00:00Z
updated: 2026-06-20T03:00:00Z
---

## Current Focus

reasoning_checkpoint:
  hypothesis: "Each perm template emits a COMPLETE app_settings object in app_settings.fixed[0].settings, but the Writer Pass-5 applies it via the ADDITIVE merge_jsonb_column RPC (updateAppSettings) into the SINGLE never-reset app_settings DB row. Entity teardown excludes app_settings (teardown.ts:29 — 'resetting app_settings is db:reset's job'). So any key set by a PRIOR perm but ABSENT from the current perm's settings object persists, contaminating the current perm's walk."
  confirming_evidence:
    - "shared.ts:120-127 explicitly documents the bleed and whack-a-moles candidateApp.show:false into MINIMAL_BASE."
    - "perm-localisation-positive uses MINIMAL_BASE verbatim (no overrides) — its app_settings is a full object; contamination must come from foreign keys merged by upstream perms (e.g. startFromConstituencyGroup which MINIMAL_BASE explicitly OMITS, set true by perm-startfromcg)."
    - "writer.ts:179-191 Pass-5 calls updateAppSettings (additive merge); setupFromTemplate.ts:238-239 also additive. NEITHER replaces."
    - "Every perm template's settings is a COMPLETE settings object (MINIMAL_BASE or a deep-merge of it), never a partial — so a full REPLACE is semantically correct."
  falsification_test: "If after REPLACE-applying the perm's own complete settings the singleton STILL contained foreign keys, the templates would not be complete settings objects (they are). If perm-localisation-positive failed on run-2 even after REPLACE, contamination is not the cause (it is — fresh run passes 53/0)."
  fix_rationale: "REPLACE (full overwrite of the settings JSONB) instead of additive merge in the seed path makes each perm's seeded app_settings AUTHORITATIVE — stale foreign keys from prior perms are wiped. Addresses the root cause (additive accumulation in a singleton), not a symptom. Serialization is ALREADY in place (perm DAG is strictly serial: each perm setup depends on the previous perm SPEC; all perm specs fullyParallel:false), so the REPLACE is never raced."
  blind_spots: "(1) e2e/base also seeds app_settings via the same Writer path — REPLACE must not break the base dataset's settings (base template's settings is also a complete object, so REPLACE is safe, but must verify base journeys stay green). (2) The scenario-overlay appSettingsOverride (setupFromTemplate.ts:238) is an intentional ADDITIVE overlay applied AFTER seeding — must keep it additive (it runs after the REPLACE). (3) _probes run out-of-band via `yarn db:seed` (CLI Writer path) — REPLACE in Writer Pass-5 covers them too."

hypothesis: CONFIRMED — perm app_settings singleton merge-contamination (additive merge into never-reset singleton).
test: implement REPLACE-app_settings in the seed path (Writer Pass-5 + the post-seed assertion); reproduce flake, then prove flake-free >=3x + CI-posture.
expecting: after fix each perm's complete settings authoritatively overwrites the singleton; contamination scenario passes >=3x + CI full suite ~95/0.
next_action: add replaceAppSettings() to dev-seed admin client; switch Writer Pass-5 to REPLACE; tighten post-seed assertion to EXACT (toEqual) so contamination can never pass silently again. Keep appSettingsOverride additive (runs after).

## Symptoms

expected: each perm spec runs against ITS OWN template app_settings; voter/candidate walks complete.
actual: perm specs walk against a deep-merge blend of ALL perms' app_settings; some walks stall (e.g. perm-localisation-positive EFLOW-06 stalls on voter Intro, walkUntilQuestionsIntro times out 10s on getByTestId('voter-questions-start')).
errors: "Timeout 10000ms exceeded waiting for getByTestId('voter-questions-start')"; "43 did not run" cascade; perm/_probes/a11y-smoke collateral failures.
reproduction: run perm-localisation-positive.spec.ts twice without intervening db:reset (run1=53/0 fresh, run2=1/52 dirty); OR broad ./tests positional + -g invocations that load all perm setups.
started: structural — singleton-sharing has always bled; team whack-a-moles it in shared.ts (forced candidateApp.show:false).

## Eliminated

## Evidence

- timestamp: 2026-06-20T00:00:00Z
  checked: packages/dev-seed/src/templates/e2e/perm/shared.ts:120-127 + tests/tests/setup/shared/setupFromTemplate.ts:233-239
  found: shared.ts explicitly documents the singleton bleed and whack-a-moles it. setupFromTemplate applies app_settings additively via merge_jsonb_column (updateAppSettings) for overlays; the post-seed check at 214-231 is a toMatchObject SUBSET match that tolerates contamination.
  implication: Need a REPLACE (full-set) app_settings client method + a per-spec beforeAll that authoritatively re-applies the spec's own template app_settings, plus serialization so it isn't raced.

- timestamp: 2026-06-20T01:00:00Z
  checked: REPRODUCTION (OLD additive code, fix stashed out) — contaminate singleton with startFromConstituencyGroup pointing at a non-existent CG (simulating prior perm-startfromcg leak; MINIMAL_BASE OMITS the key so additive merges NEVER clear it), then run perm-localisation-positive --no-deps.
  found: EFLOW-06 FAILED after all retries — walkUntilQuestionsIntro TimeoutError 10000ms on getByTestId('voter-questions-start') at voter-journey.fixture.ts:231. EXACTLY the bug-report symptom. The stale startFromConstituencyGroup points at a CG absent from localisation's topology → voter Intro stalls.
  implication: Root cause CONFIRMED empirically. perm-startfromcg.spec.ts beforeAll sets startFromConstituencyGroup additively; afterAll restores to (prior ?? null) but the KEY persists; downstream perms' MINIMAL_BASE merges never drop it.

- timestamp: 2026-06-20T01:30:00Z
  checked: FIX (REPLACE active) — same contamination, then run data-setup-perm-localisation-positive --no-deps, then read singleton, then run the spec.
  found: setup PASSED (EXACT toEqual held); singleton elections went from {showElectionTags,disallowSelection,startFromConstituencyGroup:dead-beef} → {showElectionTags:true,disallowSelection:false} (stale key WIPED); spec 2 passed (45.9s).
  implication: REPLACE in setupFromTemplate authoritatively wipes contamination; EXACT assertion proves zero carry-forward.

## Resolution

root_cause: perm app_settings applied additively (merge_jsonb_column / updateAppSettings) into a single DB app_settings row that is shared by all perm setups and NEVER reset by entity teardown (teardown excludes app_settings; reset is db:reset's job). Keys a prior perm sets but a downstream perm's complete settings object OMITS (notably elections.startFromConstituencyGroup, which MINIMAL_BASE_APP_SETTINGS deliberately omits) persist forever, contaminating downstream perms' voter/candidate walks. perm-startfromcg.spec.ts is the canonical leaker (sets startFromConstituencyGroup at runtime; afterAll restore leaves the key present).
fix: Added replaceAppSettings(settings) to @openvaa/dev-seed SupabaseAdminClient (full-set .update({settings}), NOT additive merge). setupFromTemplate now REPLACE-applies each template's OWN complete resolved settings after the additive Writer seed, and the post-seed assertion is tightened from toMatchObject (subset, contamination-tolerant) to toEqual (EXACT) — any surviving foreign key fails LOUDLY at setup. Serialization was ALREADY correct (perm DAG strictly serial; all perm specs fullyParallel:false). Generic Writer Pass-5 left additive (the `default` dev-seed template intentionally partial-merges into the bootstrap row).
verification: Reproduced flake on OLD code (EFLOW-06 10s Intro timeout). With fix: REPLACE wipes contamination. Determinism: perm-localisation-positive 3/3 green + perm-show-feedback-survey 3/3 green, each under injected startFromConstituencyGroup+underMaintenance contamination. CI-posture full suite on a clean db:reset: 120 passed / 0 failed / 0 did-not-run / 5 flaky. The 0-did-not-run = perm cascade ELIMINATED (was 43 did-not-run baseline). The 5 flaky are a DISTINCT pre-existing class (voter-journey.fixture.ts Intro-stall timing artifact + axe render-pressure on e2e/base — see resolved elections-continue-stall.md), NOT app_settings contamination and NOT introduced by this fix (zero replaceAppSettings/toEqual failures in the run; base journeys all clean). Left out of scope.
files_changed:
  - packages/dev-seed/src/supabaseAdminClient.ts (added replaceAppSettings)
  - tests/tests/setup/shared/setupFromTemplate.ts (REPLACE + EXACT assertion)
