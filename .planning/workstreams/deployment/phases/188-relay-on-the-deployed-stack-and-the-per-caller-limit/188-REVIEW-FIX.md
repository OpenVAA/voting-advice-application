---
phase: 188-relay-on-the-deployed-stack-and-the-per-caller-limit
fixed_at: 2026-11-19T21:31:11Z
review_path: .planning/workstreams/deployment/phases/188-relay-on-the-deployed-stack-and-the-per-caller-limit/188-REVIEW.md
iteration: 1
findings_in_scope: 9
fixed: 9
skipped: 0
status: all_fixed
---

# Phase 188: Code Review Fix Report

**Fixed at:** 2026-11-19T21:31:11Z
**Source review:** `.planning/workstreams/deployment/phases/188-relay-on-the-deployed-stack-and-the-per-caller-limit/188-REVIEW.md`
**Iteration:** 1
**Scope:** all, at the operator's direction ("fix everything", Info included)

**Summary:**

- Findings in scope: 9 (CR-01, WR-01 to WR-03, IN-01 to IN-05)
- Fixed: 9
- Skipped: 0

Every fix was made and committed on the main checkout of `feat/deployment-terraform-supabase` (`workflow.use_worktrees` was not used, by instruction). No worktree was created, and every gate below ran in the main checkout, so the numbers can be reproduced from this tree. Nothing was pushed, and no hosted service was touched.

## Fixed Issues

### CR-01: The relay WAF rule is bypassed by a locale prefix or a percent-encoded path

**Files modified:** `infra/modules/frontend-service/waf.tf`, `infra/modules/frontend-service/tests/frontend_service.tftest.hcl`, `infra/envs/staging/aws/README.md`
**Commit:** 42113274e
**Status:** fixed: requires human verification (a match rule; the AWS WAF regex engine is not exercised offline)
**Applied fix:** The scope-down is a `regex_match_statement` on the URI path after `URL_DECODE` (priority 0) and then `NORMALIZE_PATH` (priority 1), against `^/([^/]+/)?api/usage(/|$)`, held in `local.relay_path_pattern`. Paraglide's `deLocalizeUrl` strips one leading locale segment (`fi`, `sv`, `da`, `et`, `fr`, `lb`; `en` has no prefix), and SvelteKit decodes the path once before routing, so one optional segment of any name and one decode cover every path the application routes to the relay. Nothing else of the site matches. The tftest pins the two transformations in order, and with Terraform's `regex()` it asserts 7 paths that match (among them `/fi/api/usage` and `/FI/api/usage`) and 9 that do not (among them `/api/usages`, `/fi/sv/api/usage`, `/fi/questions`). A red control with the old `^/api/usage` failed both path assertions. The staging README gets a new 2026-11-19 observations row. The existing dated row records a plan that was actually run, so it was left unchanged.
**Verification:** `terraform test` of a copy of the module made under the scratchpad (with its own `TF_DATA_DIR`, so that the operator's module `.terraform/` and its untracked lock file stay untouched): 38 passed, 0 failed. Both AWS roots were checked with `init -backend=false -lockfile=readonly` and `validate` under fresh `TF_DATA_DIR`s (`.../scratchpad/tfdata-fix-example`, `.../tfdata-fix-staging`): valid. `terraform test` of `envs/example/aws`: 1 passed. `terraform fmt -check -recursive infra`: clean.

### WR-01: `invitation_caller_take` can deadlock two concurrent takes

**Files modified:** `apps/supabase/supabase/migrations/00024_invitation_caller_take_without_waits.sql` (new), `apps/supabase/supabase/migrations.manifest.json`, `apps/supabase/supabase/schema/506-invitation-rpcs.sql`, `apps/supabase/supabase/tests/database/59-invitation-caller-limit.test.sql`, `apps/docs/src/routes/(content)/developers-guide/deployment/+page.md`, `.claude/skills/database/SKILL.md`, `.claude/skills/database/schema-reference.md`
**Commit:** 35e7489f8 (shared with IN-02, which lands in the same migration)
**Status:** fixed: requires human verification (concurrency logic)
**Applied fix:** `00023` is untouched. Migration `00024` uses `CREATE OR REPLACE` on the function, so that the take of the caller's own slot comes first, under its advisory lock. The cleanup then runs as `DELETE ... WHERE key IN (SELECT ... AND x.key <> v_key AND <ended> FOR UPDATE SKIP LOCKED)`, so a transaction that holds an advisory lock never waits on a row lock. These are unchanged: the signature, the return contract, `v_max = 30`, `v_window = 10 minutes`, `SECURITY DEFINER`, `search_path = ''`, the REVOKE from `PUBLIC, anon, authenticated` and the GRANT to `service_role`. `schema/506` mirrors the function byte for byte, and the manifest lists the migration with its sha256. pgTAP file 59 gains three assertions: the caller's own ended row is taken anew at 1 rather than deleted, and the definition is read for take-before-cleanup, `x.key <> v_key` and `FOR UPDATE SKIP LOCKED`. pgTAP cannot run two transactions, so the property was also shown with two live sessions on the local database (`.../scratchpad/skiplocked-demo.sh`). Session A held a row lock on an ended `caller:` row. Session B's take for another address, under `lock_timeout = 2s`, returned 0 in 6.9 ms and left the locked row in place. With the 00023 body loaded in B's transaction, the same call failed `canceling statement due to lock timeout` after 2.0 s, while deleting that tuple. The demo cleaned up its rows (`leftover=0`).
**Verification:** `yarn assert:schema-migration-parity`: 24 migrations, frozen ones match. `yarn check:schema-equivalence`: EQUAL (CREATE FUNCTION 150 on both sides). `yarn db:types` was not needed, because the signature is unchanged.

### WR-02: The capacity figure is the last step that passed, not the highest rate below the first failure

**Files modified:** `infra/scripts/load-check/figure.mjs`, `infra/scripts/load-check.sh`, `infra/scripts/load-check/voter-journey.js`, `infra/scripts/load-check/README.md`, `infra/scripts/load-check.test.ts`
**Commit:** a71dcdc0d
**Status:** fixed: requires human verification (figure algorithm)
**Applied fix:** `computeFigure` takes the last step of the leading run of met steps (`findIndex(!met)`, then slice), so the first unmet step ends the figure. It throws, and so exits 1, when `load_check.steps` holds a value that is not a positive finite number, or holds steps that do not rise strictly. `check_arguments` refuses non-rising `--steps` with exit 2, before Docker runs, and `parseSteps` in the k6 script refuses them too. The new tests are:
- a failed middle step (5 met, 10 unmet, 20 and 40 met), which gives 5;
- a failed first step, which gives 0;
- four non-rising step lists for the figure;
- two wrapper self-test cases, `steps-that-fall-are-refused` and `repeated-step-is-refused`;
- the k6 refusal text.

### WR-03: Fonts count as page requests, and each one triggers a relay post

**Files modified:** `infra/scripts/load-check/journey-from-trace.mjs`, `infra/scripts/load-check/voter-journey.js`, `infra/scripts/load-check.sh`, `infra/scripts/load-check/staging-journey.json`, `infra/scripts/load-check/local-journey.json`, `infra/scripts/load-check/README.md`, `infra/scripts/load-check.test.ts`
**Commit:** c420dd9d9
**Status:** fixed: requires human verification (classification and load model)
**Applied fix:** A base-origin GET or HEAD is `kind: page` only when it is a document navigation, and every other one is `kind: asset`:
- When the trace's `_resourceType` is present, `document` decides. Playwright's HAR tracer writes that field on every network snapshot.
- When it is absent, a request is a page when the last segment of its path has no file extension and the path is not under `/api/`.

`isNavigation` is exported, and `main` now runs only when the module is executed directly. `voter-journey.js` and the wrapper's `JOURNEY_CHECK_JS` accept `asset` on the base origin only. An asset request posts no relay batch and is tagged `kind:asset`, so it falls outside the page threshold.

**Journey data (no re-recording, nothing hosted regenerated):** the committed `staging-journey.json` holds no resource type. Its base-origin entries were retagged in place by the second rule, from their own URLs; that rule is the extractor's own, applied to each entry. `/fonts/inter.css` and the two `.woff2` files, on three navigations, became 9 `asset` entries. The 5 `page` entries left are `/`, `/intro`, `/elections`, `/constituencies` and `/questions`, and the 63 `data` entries are unchanged. In `local-journey.json`, `/api/health` became `asset` by the same rule. So a staging journey now makes 5 relay posts, not 14. The recorded 40 journeys a minute was measured under the old tagging, and that run is not repeated here.

**Tests:**
- both tagging rules, on synthetic trace lines;
- the k6 rule that a relay batch follows only a page;
- two wrapper self-test cases, `asset-off-base-host-is-refused` and `unknown-kind-is-refused`;
- both committed journeys, held to the rule;
- the staging journey's five pages and nine assets.

### IN-01: The browser cannot read `Retry-After`

**Files modified:** `apps/supabase/supabase/functions/account-access/contract.ts`, `.../index.ts`, `.../contract.test.ts`, `.../flowConformance.test.ts`, `apps/docs/src/routes/(content)/developers-guide/deployment/+page.md`
**Commit:** 23eb71278
**Applied fix:** The CORS headers move from `index.ts` into `contract.ts` as the frozen `CORS_HEADERS`, which adds `Access-Control-Expose-Headers: Retry-After`. `answer()` and the OPTIONS preflight both send it. The contract tests pin the exact three headers, check that they reach a `Response`'s `Headers` beside a `Retry-After` of a 429, and check the freeze. The conformance test pins that `index.ts` defines no `Access-Control-` header of its own and builds both of its `Response`s with `CORS_HEADERS`. These function tests are vitest, as the rest of the function's tests are. The Deno typecheck covers the modules.

### IN-02: An IPv4-mapped IPv6 address falls into one shared `::/64` bucket

**Files modified:** the same as WR-01
**Commit:** 35e7489f8 (one migration with WR-01; a listed migration is never edited, so the two could not be split across commits)
**Applied fix:** An address whose host lies in `::ffff:0:0/96` is keyed as `host('0.0.0.0'::inet + (v_inet - '::ffff:0:0'::inet))`. The containment test uses `set_masklen(v_inet, 128)`, so a mask in the header cannot steer the address back into `::/64`. pgTAP adds four assertions:
- thirty takes alternating between `198.51.100.7` and `::ffff:198.51.100.7` are admitted;
- the thirty-first, in mapped form, is refused;
- another mapped address is admitted;
- both keys are their IPv4 hosts.

### IN-03: No test pins that the bucket is per project

**Files modified:** `apps/supabase/supabase/tests/database/59-invitation-caller-limit.test.sql`
**Commit:** 5b0795133
**Applied fix:** This runs after the thirty-first refused take in `project_a`. The same address is admitted in `project_b` (0), and the take is counted as 1 under `project_b`'s own key. `plan` goes from 32 to 34; it was 25 before WR-01 and IN-02.

### IN-04: The load figure does not check for dropped iterations

**Files modified:** `infra/scripts/load-check/voter-journey.js`, `infra/scripts/load-check/figure.mjs`, `infra/scripts/load-check.sh`, `infra/scripts/load-check/README.md`, `infra/scripts/load-check.test.ts`
**Commit:** a8dca4e76
**Applied fix:**
- **Threshold:** each step gets a `count<1` threshold on `dropped_iterations{scenario:step_<i>}`. k6 tags a dropped iteration with its scenario's name, not with the scenario's own `step` tag.
- **Figure:** `figure.mjs` reads that count and prints `dropped=<n>` on every step line. A step that dropped an iteration is not met, and an absent count counts as none dropped.
- **Tests:** a step with one drop ends the figure below it, and the threshold is present in the script.
- **Not checked:** the exact form in which k6 2.4.0 writes this sub-metric in `handleSummary` data was not observed in a real run here.

### IN-05: The 40-second stop timeout covers one slice of the shutdown flush

**Files modified:** `infra/envs/staging/aws/terraform.tfvars`, `infra/envs/example/aws/terraform.tfvars`
**Commit:** f1c131f43
**Applied fix:** The comment now matches the module variable's description: 25 + 10 + 5 is enough for one slice of the queue to reach a responsive PostHog, and a full queue against an unresponsive PostHog can still be cut off at the kill. Only the comment was changed; the value of 40 and the code were not. Both roots `validate`, and the example root's `terraform test` passes.

## Gates

All gates ran in the main checkout at `f1c131f43`, in the background, each with its own log under `/private/tmp/claude-501/-Users-kallejarvenpaa-Desktop-OpenVAA-voting-advice-application-infra/bb5983b3-b19b-4105-bdcf-29f5c4061f2c/scratchpad/gates/`. Every exit status was read from the command itself, never through a pipe.

| Gate | Result |
| --- | --- |
| `yarn db:reset` | exit 0 |
| pgTAP, `yarn workspace @openvaa/supabase test:db` | exit 0; `Files=59, Tests=2932`, `Result: PASS` (2923 before the review fixes, plus 9) |
| `yarn db:lint:sql` | exit 0; 0 errors, 3 warnings, the existing unindexed-FK notes |
| `yarn db:types` | not run: no signature changed |
| `yarn workspace @openvaa/supabase typecheck` (Deno) | exit 0 (and a cold run after the IN-01 change checked every module, exit 0) |
| `yarn workspace @openvaa/supabase test:unit` | exit 0; 27 files, 1192 tests |
| `yarn test:unit:infra` | exit 0; 16 files, 436 tests |
| `yarn test:unit` (stack running) | exit 0 |
| `yarn assert:comment-hygiene` | exit 0; 0 violations |
| `yarn format:check` | exit 0 |
| `yarn lint:check` | exit 0 |
| `yarn check:schema-equivalence` | EQUAL |
| `terraform test`, module (scratch copy) and example root | 38 passed; 1 passed |

E2E was not run, by instruction: the orchestrator runs the full suite.

## Notes

- **Pre-existing lint findings:** ESLint, run directly on `account-access/index.ts`, reports two findings (`simple-import-sort`, and `func-style` at the `Deno.serve` handler). Both are present at HEAD before these fixes too, and no gate lints that tree.
- **Documentation touched beyond the cited files:** the deployment docs page (the caller-limit cleanup order, the mapped-address bucket, the exposed header) and the database skill's two files (the caller key and the cleanup order), so that neither describes the replaced behaviour.

---

_Fixed: 2026-11-19T21:31:11Z_
_Fixer: Claude (gsd-code-fixer)_
_Iteration: 1_
