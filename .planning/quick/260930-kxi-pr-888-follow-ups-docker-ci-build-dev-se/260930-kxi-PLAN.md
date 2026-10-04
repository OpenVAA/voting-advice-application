---
phase: quick-260930-kxi
plan: 01
type: execute
wave: 1
depends_on: []
quick_id: 260930-kxi
files_modified:
  - apps/supabase/supabase/schema/107-feedback.sql
  - apps/supabase/supabase/schema/301-auth-functions.sql
  - apps/supabase/supabase/migrations/00001_initial_schema.sql
  - apps/supabase/supabase/seed.sql
  - apps/supabase/supabase/tests/database/35-feedback-rate-limit-key.test.sql
  - tests/tests/fixtures/shared/feedbackDialog.fixture.ts
  - .env.example
  - "apps/docs/src/routes/(content)/developers-guide/deployment/+page.md"
  - "apps/docs/src/routes/(content)/developers-guide/configuration/environmental-variables/+page.md"
  - .claude/skills/database/schema-reference.md
  - .planning/quick/260930-kxi-pr-888-follow-ups-docker-ci-build-dev-se/probe-feedback-trust.sh
  - .github/workflows/main.yaml
  - packages/dev-seed/tests/ciDockerImageBuildGate.test.ts
  - packages/dev-seed/src/cli/teardown.ts
  - packages/dev-seed/tests/cli/localityGuard.test.ts
  - packages/dev-seed/tests/cli/fixtures/simulateRootEnv.mjs
  - packages/dev-seed/src/supabaseAdminClient.ts
  - packages/dev-seed/src/index.ts
  - packages/dev-seed/tests/localSupabaseUrl.test.ts
  - packages/dev-seed/tests/serviceRoleClientCallSites.test.ts
  - tests/tests/specs/candidate/candidate-bank-auth.spec.ts
autonomous: true
requirements: [QUICK-260930-kxi]

estimate:
  tokens: 115000
  raw_tokens: 230000
  tasks: 3
  confidence: high

must_haves:
  truths:
    - "The feedback rate limit keys on a client-sent `cf-connecting-ip` ONLY when `private.deployment_settings.behind_cloudflare` is true. With it false, or with the settings row missing, the key is the gateway-appended last `x-forwarded-for` hop, so six inserts rotating `cf-connecting-ip` behind one hop are refused at the sixth. Proven by pgTAP and by a live probe through the local Kong/PostgREST path"
    - "The migration ships `behind_cloudflare = false`. The local stack's `seed.sql` sets it true, so after `yarn db:reset` (and CI's `supabase start`) the E2E `isolateFeedbackRateLimit` fixture still gives every feedback POST its own bucket. `anon` and `authenticated` can neither read nor change the setting, and neither API role can execute the key helper"
    - "`.env.example` and the docs name the setting, say it is a DATABASE setting and not an environment variable, give the one operator statement, and state its precondition: every request reaches the API through Cloudflare (hosted Supabase does; a self-hosted gateway only when the origin accepts Cloudflare alone)"
    - "`.github/workflows/main.yaml` has a `docker-image-build` job that builds `apps/frontend/Dockerfile` target `production` from the repo root, with no push, no registry login, no paths-filter and no `if:`. A dev-seed unit gate pins those properties, and the same build exits 0 locally from `git archive HEAD`"
    - "`yarn db:seed:teardown` builds its service-role client from `SUPABASE_URL` (falling back to `PUBLIC_SUPABASE_URL`) and `SUPABASE_SERVICE_ROLE_KEY` read AFTER the repo-root `.env` is loaded. A root `.env` naming a non-local host is refused by the locality guard, proven by a subprocess test that simulates the `.env` without touching the real one"
    - "`tests/tests/specs/candidate/candidate-bank-auth.spec.ts` gets its service-role client from dev-seed's guarded `createServiceRoleClient`. A unit gate proves the only supabase-js client construction under `packages/dev-seed/src` and `tests/` is inside that factory"
    - "Verification gate: `yarn lint:check`, `yarn format:check`, `yarn typecheck`, `yarn test:unit` and `yarn workspace @openvaa/frontend build` each exit 0, every status read directly. The full default E2E suite plus the opt-in `bank-auth` and `bank-auth-journey` projects are reported with passed / failed / flaky / did-not-run counts taken from each run's `results.json`, with did-not-run counted as failed. Any failure this branch caused is fixed and re-gated; pre-existing or environmental failures are reported with evidence, never hidden"
  artifacts:
    - path: apps/supabase/supabase/schema/107-feedback.sql
      provides: "private.deployment_settings (single row, behind_cloudflare boolean default false); private.feedback_client_ip(json, boolean); check_feedback_rate_limit reads the setting and passes it"
      contains: "behind_cloudflare"
    - path: apps/supabase/supabase/seed.sql
      provides: "Local/E2E opt-in: behind_cloudflare = true, with the reason and the never-for-a-non-Cloudflare-deployment warning"
      contains: "deployment_settings"
    - path: apps/supabase/supabase/tests/database/35-feedback-rate-limit-key.test.sql
      provides: "Trusted and untrusted rate-limit keying through the trigger, the missing-row fail-closed case, helper precedence for both flag values, setting privileges, column default and single-row constraint"
      contains: "behind_cloudflare"
    - path: .github/workflows/main.yaml
      provides: "docker-image-build job (build only, no push)"
      contains: "docker-image-build:"
    - path: packages/dev-seed/tests/ciDockerImageBuildGate.test.ts
      provides: "Standing gate for the docker-image-build job's properties"
    - path: packages/dev-seed/src/cli/teardown.ts
      provides: "createTeardownClient: reads SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY at call time, after the .env load"
      contains: "createTeardownClient"
    - path: packages/dev-seed/src/supabaseAdminClient.ts
      provides: "createServiceRoleClient: the one guarded supabase-js service-role construction; the SupabaseAdminClient constructor uses it"
      contains: "export function createServiceRoleClient"
    - path: packages/dev-seed/tests/serviceRoleClientCallSites.test.ts
      provides: "Call-site census: the guarded factory is the only supabase-js client construction in packages/dev-seed/src and tests/"
  key_links:
    - from: apps/supabase/supabase/schema/107-feedback.sql
      to: private.deployment_settings
      via: "check_feedback_rate_limit reads behind_cloudflare (COALESCE to false) and passes it as the helper's second argument"
      pattern: "feedback_client_ip\\("
    - from: apps/supabase/supabase/seed.sql
      to: tests/tests/fixtures/shared/feedbackDialog.fixture.ts
      via: "seed opt-in is what makes the fixture's per-request cf-connecting-ip select a bucket on the local stack"
      pattern: "behind_cloudflare"
    - from: apps/supabase/supabase/schema/301-auth-functions.sql
      to: apps/supabase/supabase/schema/107-feedback.sql
      via: "REVOKE after the blanket private EXECUTE grant names the new two-argument signature"
      pattern: "feedback_client_ip \\(json, boolean\\)"
    - from: packages/dev-seed/src/cli/teardown.ts
      to: packages/dev-seed/src/supabaseAdminClient.ts
      via: "CLI block calls createTeardownClient, which passes process.env values explicitly to the constructor"
      pattern: "createTeardownClient\\("
    - from: tests/tests/specs/candidate/candidate-bank-auth.spec.ts
      to: packages/dev-seed/src/supabaseAdminClient.ts
      via: "imports createServiceRoleClient from @openvaa/dev-seed"
      pattern: "createServiceRoleClient"
---

<objective>
Close the four follow-ups PR #888 (branch `fix/888-review-findings`) lists as not fixed, each as its own atomic commit, then run the full verification gate and report its counts faithfully.

1. **Feedback rate limit (Task 1, tracer).** A client can currently pick its own feedback rate-limit bucket by sending `cf-connecting-ip` to a deployment that has no Cloudflare in front. Trust that header only when the deployment says it is behind Cloudflare. The E2E isolation that depends on the header must keep working.
2. **Docker CI job (Task 2a).** Add a CI job that builds the production Docker image, with no push.
3. **`seed:teardown` load order (Task 2b).** The teardown CLI reads `SUPABASE_URL` and the key before the repo-root `.env` is loaded, so values that live only in `.env` never reach its client.
4. **Bank-auth service-role client (Task 2c).** `candidate-bank-auth.spec.ts` builds its own service-role client, which the dev-seed locality guard does not cover. Route it through the guarded factory.
5. **Verification gate (Task 3).**

**Design choice for item 4, recorded so the reviewer can check it.** The feedback insert goes straight from the browser to PostgREST (`SupabaseFeedbackWriter._postFeedback` in `apps/frontend/src/lib/api/adapters/supabase/feedbackWriter/supabaseFeedbackWriter.ts`), and a Postgres trigger reads the header. No process that reads `.env` is on that path, so an environment variable cannot gate it.

The setting therefore lives in the database. This follows the repo's existing precedent `public.storage_config` in `400-storage.sql`: a per-deployment value the operator sets in the database, with `seed.sql` supplying the local value. The flag lives in the unexposed `private` schema.

The safe default is false. Local and E2E stacks opt in through `seed.sql`, which is the "test/dev config opts in" the task allows. `.env.example` gets a comment-only pointer so readers of the env docs find the setting, because it is not an env var.

Purpose: close the spoofable rate-limit bucket, make CI catch Dockerfile regressions like the one quick 260930-gjw fixed (root lifecycle scripts missing from the image install), and make both service-role paths honour the locality guard and the `.env` they claim to honour.

Output:
- 4 fix commits: one per follow-up.
- A probe script and gate evidence in the quick directory.
- `260930-kxi-SUMMARY.md` with faithful gate counts.
</objective>

<execution_context>
@~/.claude/gsd-core/workflows/execute-plan.md
@~/.claude/gsd-core/templates/summary.md
</execution_context>

<context>
@.planning/STATE.md
@CLAUDE.md
@.claude/skills/database/SKILL.md
@.planning/quick/260930-gk1-revalidate-then-fix-apps-supabase-supabase-schema-107-feedba/260930-gk1-SUMMARY.md
@.planning/quick/260930-gk2-revalidate-then-fix-packages-dev-seed-seed-and-teardown-clis/260930-gk2-SUMMARY.md
@.planning/quick/260930-gjw-revalidate-then-fix-root-package-json-preinstall-node-script/260930-gjw-SUMMARY.md

Operational facts the executor needs (from the operator's memory notes; do not rediscover them the hard way):

- **Commits in this worktree.** This is a linked worktree. `git config --get core.hooksPath` must print `/dev/null` here. If a commit is rejected by a foreign husky hook, re-check that setting; the per-command fallback is `git -c core.hooksPath=/dev/null commit`.
- **Read every gate's exit status directly, never through a pipe.** Use the form "`cmd > LOG 2>&1; status=$?`", then filter LOG. `yarn lint:check` is a long `&&` chain: a red early link hides every later link. `yarn format:check` is a separate gate.
- **Secret files.** Never read `.env` or `apps/frontend/.env`; the secret-read hook blocks it anyway. Take the local keys from `yarn -s workspace @openvaa/supabase supabase status -o env` into shell variables without echoing them.
- **Long runs.** Anything that may run longer than about 8 minutes goes in the background with output teed to a log: a Docker image build, any E2E run, and the dev server. Poll the log every 60 to 90 seconds; the harness kills an agent that is silent for 600 s.
- **Docker disk (VM).** Measure the Docker VM with `docker run --rm alpine df -h /`, not the Mac. Require at least 15 GiB free before the image build and before E2E. If short, run `docker builder prune -af` and re-measure. If still short, STOP and report. Never restart Docker Desktop and never prune images or volumes: this host also runs an unrelated `next-supabase-skimle2` Supabase stack.
- **Do not delete `tests/e2e-runs/`.** It is git-ignored evidence.
- **`db:types` ordering.** Run `yarn db:types` right after a `yarn db:reset`, never after `supabase test db`, which leaks pgTAP helpers into the generated types.
</context>

<tasks>

<task type="tracer" tdd="true">
  <name>Task 1 (tracer): Trust cf-connecting-ip for the feedback rate limit only when the deployment is behind Cloudflare</name>
  <files>apps/supabase/supabase/schema/107-feedback.sql, apps/supabase/supabase/schema/301-auth-functions.sql, apps/supabase/supabase/migrations/00001_initial_schema.sql (generated by `yarn schema:regenerate`, never hand-edited), apps/supabase/supabase/seed.sql, apps/supabase/supabase/tests/database/35-feedback-rate-limit-key.test.sql, tests/tests/fixtures/shared/feedbackDialog.fixture.ts, .env.example, apps/docs/src/routes/(content)/developers-guide/deployment/+page.md, apps/docs/src/routes/(content)/developers-guide/configuration/environmental-variables/+page.md, .claude/skills/database/schema-reference.md, .planning/quick/260930-kxi-pr-888-follow-ups-docker-ci-build-dev-se/probe-feedback-trust.sh</files>
  <precondition>Docker is running and `yarn db:start` exits 0 (local Supabase stack `openvaa-local` reachable on 127.0.0.1:54321).</precondition>
  <behavior>
    Changes to `35-feedback-rate-limit-key.test.sql`, written first and observed RED:
    - Helper, trusted (second argument true): it prefers `cf-connecting-ip` over the last hop. The existing precedence, fallback, IPv6 and NULL/empty cases keep their expected values, now called with true.
    - Helper, untrusted (false): a valid `cf-connecting-ip` is ignored and the last `x-forwarded-for` hop is returned. With only `cf-connecting-ip` present, the result is `unknown`.
    - Trigger, `behind_cloudflare` false: five inserts succeed and a sixth is refused with P0001. The inserts rotate `cf-connecting-ip` (a distinct 198.51.100.x each) behind one fixed last hop. The counter is keyed on the hop, and no counter is keyed on any of the `cf-connecting-ip` values.
    - Trigger, settings row deleted inside the test transaction: fail closed, identical to false. A `cf-connecting-ip` value creates no bucket; the hop does.
    - Trigger, `behind_cloudflare` true: the existing "cf-connecting-ip decides the bucket" and "distinct cf values behind one shared hop keep separate buckets" blocks pass unchanged. Each block sets the flag explicitly at its start, so the seed's value never decides an assertion.
    - Setting surface:
      - The column default is false (`col_default_is`).
      - A second row is refused (check_violation or unique_violation).
      - `anon` and `authenticated` have none of SELECT, INSERT, UPDATE or DELETE on `private.deployment_settings` (`has_table_privilege`).
      - `has_function` and the two not-executable assertions use the signature `private.feedback_client_ip(json, boolean)`.
    - `plan(N)` is updated to the new total.
  </behavior>
  <action>
**Step 0. Baseline.** Record the base revision before any change: write the output of `git rev-parse HEAD` to `.planning/quick/260930-kxi-pr-888-follow-ups-docker-ci-build-dev-se/item-base.rev`. Start the stack with `yarn db:start`.

**Step 1. RED.** Edit `apps/supabase/supabase/tests/database/35-feedback-rate-limit-key.test.sql` per the behavior block:
- Rewrite the file header to describe trust gating.
- Toggle the flag as postgres: call `reset_role()`, run `UPDATE private.deployment_settings SET behind_cloudflare = <bool>`, then call `set_test_user('anon')` again.
- Keep the existing TEST-NET range conventions (client-written values in 192.0.2.0/24, expected keys in 198.51.100.0/24).
- Keep the per-block `DELETE FROM private.feedback_rate_limits` hygiene.
- The final ROLLBACK undoes every setting change.

Run `yarn workspace @openvaa/supabase test:db > LOG 2>&1; status=$?`. Confirm it is RED for the reason expected: the missing table and the missing two-argument signature.

**Step 2. Schema, in `apps/supabase/supabase/schema/107-feedback.sql`.**

(a) After the `private.feedback_rate_limits` table, create `private.deployment_settings`, a single-row table with two columns:
- `singleton boolean PRIMARY KEY DEFAULT true CHECK (singleton)`
- `behind_cloudflare boolean NOT NULL DEFAULT false`

Then insert its default row idempotently with `INSERT ... DEFAULT VALUES ON CONFLICT DO NOTHING`.

`ENABLE ROW LEVEL SECURITY` and `REVOKE ALL` on it from PUBLIC, anon, authenticated and service_role. Only the owner reads it: the SECURITY DEFINER trigger, the seed, and an operator in the SQL editor.

Give it a comment block that states all of the following:
- It holds per-deployment facts that migrations cannot know.
- `behind_cloudflare` says every request reaches the API through Cloudflare, which sets `cf-connecting-ip` itself.
- Its only reader is `check_feedback_rate_limit`.
- The operator statement is `UPDATE private.deployment_settings SET behind_cloudflare = true;`.
- Hosted Supabase is behind Cloudflare. A self-hosted gateway qualifies only when its origin accepts connections from Cloudflare alone.

(b) Change `private.feedback_client_ip` to take `(p_headers json, p_trust_cf_connecting_ip boolean)` and stay IMMUTABLE SECURITY INVOKER. It reads `cf-connecting-ip` only when the flag is true; the `x-forwarded-for` last-hop and `unknown` fallbacks are unchanged. Give the boolean no DEFAULT, so every caller decides.

Rewrite the helper's comment block to describe the gate as it is now:
- It must no longer say Kong-forwarded `cf-connecting-ip` is read unconditionally.
- It must state that an untrusted deployment keys on the gateway-appended hop.
- It must state that hosted Supabase without the flag can collapse many voters onto one platform-internal hop, which is why hosted deployments must set it.

Update the `REVOKE EXECUTE ... FROM PUBLIC` statement below the function to the new signature.

(c) In `check_feedback_rate_limit`, read `COALESCE((SELECT behind_cloudflare FROM private.deployment_settings), false)` into a local variable and pass it as the helper's second argument. A missing row therefore fails closed.

(d) In `apps/supabase/supabase/schema/301-auth-functions.sql`, find the REVOKE that follows the blanket `GRANT EXECUTE ON ALL FUNCTIONS IN SCHEMA private` (anchor: the comment naming `private.feedback_client_ip`). Change its signature to `(json, boolean)`.

**Step 3. Regenerate and prove the schema.**
1. Run `yarn schema:regenerate` and READ the diff of `apps/supabase/supabase/migrations/00001_initial_schema.sql`; it must contain only these changes.
2. `yarn db:reset`.
3. `yarn db:types`. Then `git status --porcelain packages/supabase-types` must be empty, because the generator covers `public` only. If it is not empty, inspect the diff and commit it with this change only if it is genuinely caused by it.
4. `yarn workspace @openvaa/supabase test:db` must be GREEN across all files, including `10-schema-migrations.test.sql`, whose rate-limit block uses `x-forwarded-for` only.
5. `yarn db:lint:sql` and `yarn assert:schema-migration-parity` must exit 0.

**Step 4. Local opt-in.** In `apps/supabase/supabase/seed.sql`, directly after the `storage_config` block, upsert `private.deployment_settings` to `behind_cloudflare = true` (`INSERT ... ON CONFLICT (singleton) DO UPDATE`). The comment must state all of the following:
- The local CLI stack has no Cloudflare in front.
- The value is set so the E2E `isolateFeedbackRateLimit` fixture can give each feedback POST its own bucket.
- The migration default is false.
- This seed must never be applied to a deployment that is not behind Cloudflare.

Do not touch the `('supabase_url', ...)` literal, which `packages/dev-seed/tests/localSupabaseUrl.test.ts` parses. Re-run `yarn db:reset` so the seed applies.

**Step 5. Fixture docblock (comment-only change).** In `tests/tests/fixtures/shared/feedbackDialog.fixture.ts`, update the `isolateFeedbackRateLimit` docblock. The header selects the bucket locally only because `seed.sql` sets `private.deployment_settings.behind_cloudflare`; without it the rate limit ignores the header. Change no code.

**Step 6. Documentation.**
- **`.env.example`:** add a comment-only section, for example "Database-side deployment settings (not environment variables)", after the Project scoping section. It explains:
  - why the Cloudflare trust flag cannot be an env var (a Postgres trigger on a browser-to-PostgREST insert reads it);
  - the operator statement;
  - the precondition;
  - that the local seed turns it on.

  Constraints: add no `KEY=` line and no URL. Do not disturb the cross-runtime pair block, which `scripts/assert-env-pair-registry.mjs` requires to stay contiguous.
- **Deployment docs:** in `apps/docs/src/routes/(content)/developers-guide/deployment/+page.md`, add a section before "Manually Creating a Production Build" covering the feedback rate limit and Cloudflare: what the setting does, the statement, the precondition, and the hosted-Supabase shared-hop consequence of leaving it false.
- **Env-var docs:** in `apps/docs/src/routes/(content)/developers-guide/configuration/environmental-variables/+page.md`, add one bullet noting that this setting is database-side and pointing to the deployment page.
- **Database skill:** in `.claude/skills/database/schema-reference.md`, add a `**deployment_settings** (107-feedback.sql)` entry beside `storage_config`, in the same shape.

All comments must describe the code as it is now. Do not narrate history ("previously", "no longer", "now"): the repo's comment-hygiene guard and recent style commits enforce this. End every comment line with punctuation before a forced line break.

**Step 7. End-to-end probe (the tracer's real path).** Write `.planning/quick/260930-kxi-pr-888-follow-ups-docker-ci-build-dev-se/probe-feedback-trust.sh`. It uses bash with `set -euo pipefail`, and takes the API URL and anon key from `supabase status -o env` without printing them.

It toggles the setting and clears probe state as postgres. Use `docker exec supabase_db_openvaa-local psql -U postgres -d postgres -c ...`, or `psql postgresql://postgres:postgres@127.0.0.1:54322/postgres` when `psql` is on PATH.

Every request is a `POST /rest/v1/feedback` through the local gateway on 127.0.0.1:54321. It carries `apikey`, `Authorization: Bearer <anon>`, `Prefer: return=minimal`, and body `{"project_id":"00000000-0000-0000-0000-000000000001","rating":3,"description":"kxi-probe"}`.

The stages:
- **(A)** Set `behind_cloudflare=false` and clear `private.feedback_rate_limits`. Send six POSTs, each with a distinct `cf-connecting-ip` in 203.0.113.0/24. Expect five 201 responses, then a non-2xx whose body carries P0001 / "Rate limit exceeded".
- **(B)** Set true and clear. Send six POSTs with six distinct `cf-connecting-ip` values; expect six 201 responses.
- **(C)** Still true and cleared. Send six POSTs with one repeated `cf-connecting-ip`; expect the sixth refused.
- **Always, from an EXIT trap:** restore `behind_cloudflare=true` and delete the `kxi-probe` feedback rows and the probe's rate-limit rows.

The script exits non-zero on any mismatch and prints one PASS/FAIL line per stage. Run it:

`bash .planning/quick/260930-kxi-pr-888-follow-ups-docker-ci-build-dev-se/probe-feedback-trust.sh > LOG 2>&1; status=$?`

**Step 8. Commit.** Run `yarn format:check` and `yarn assert:comment-hygiene`, each status read directly. Then make ONE commit:
- Files: the schema files, the regenerated migration, seed.sql, the pgTAP file, the fixture, `.env.example`, both docs pages and the skill reference. The probe script is quick-task evidence and not part of the fix commit.
- Subject: `fix[db]: trust cf-connecting-ip for the feedback rate limit only behind Cloudflare`.
- Body: bullets describing the setting, the default, the seed opt-in and the docs.
  </action>
  <verify>
    <automated>yarn db:reset > "${TMPDIR:-/tmp}"/kxi-t1-reset.log 2>&1; s1=$?; yarn workspace @openvaa/supabase test:db > "${TMPDIR:-/tmp}"/kxi-t1-pgtap.log 2>&1; s2=$?; bash .planning/quick/260930-kxi-pr-888-follow-ups-docker-ci-build-dev-se/probe-feedback-trust.sh > "${TMPDIR:-/tmp}"/kxi-t1-probe.log 2>&1; s3=$?; yarn assert:schema-migration-parity > "${TMPDIR:-/tmp}"/kxi-t1-parity.log 2>&1; s4=$?; yarn db:lint:sql > "${TMPDIR:-/tmp}"/kxi-t1-sqllint.log 2>&1; s5=$?; echo "reset=$s1 pgtap=$s2 probe=$s3 parity=$s4 sqllint=$s5"; [ $s1 -eq 0 ] && [ $s2 -eq 0 ] && [ $s3 -eq 0 ] && [ $s4 -eq 0 ] && [ $s5 -eq 0 ]</automated>
  </verify>
  <done>
- The pgTAP suite is green, including every new 35-file assertion. The new assertions were observed RED before the schema change.
- The probe prints PASS for stages A, B and C against the live local gateway.
- The migration parity gate and SQL lint exit 0; `packages/supabase-types` is unchanged or carries a justified diff.
- `.env.example`, both docs pages and the skill reference describe the setting.
- Exactly one `fix[db]` commit exists for item 4.
  </done>
</task>

<task type="auto" tdd="true">
  <name>Task 2: Docker image CI job, teardown .env load order, bank-auth spec behind the locality guard (three atomic commits)</name>
  <files>.github/workflows/main.yaml, packages/dev-seed/tests/ciDockerImageBuildGate.test.ts, packages/dev-seed/src/cli/teardown.ts, packages/dev-seed/tests/cli/localityGuard.test.ts, packages/dev-seed/tests/cli/fixtures/simulateRootEnv.mjs, packages/dev-seed/src/supabaseAdminClient.ts, packages/dev-seed/src/index.ts, packages/dev-seed/tests/localSupabaseUrl.test.ts, packages/dev-seed/tests/serviceRoleClientCallSites.test.ts, tests/tests/specs/candidate/candidate-bank-auth.spec.ts</files>
  <precondition>Local Supabase is up (the dev-seed live test tiers need it) and the Docker VM has at least 15 GiB free for the image build.</precondition>
  <behavior>
    - ciDockerImageBuildGate:
      - `docker-image-build` is declared exactly once.
      - Its comment-stripped block runs `docker build` with `--file apps/frontend/Dockerfile`, `--target production` and the repo-root context.
      - The block contains no push, no registry login, no `paths-filter` and no `if:` key.
      - `apps/frontend/Dockerfile` still declares a stage `AS production`.
      - Negative control: adding a push flag to the job turns it red, and reverting makes it green again.
    - Teardown .env load order:
      - A teardown subprocess is given a simulated repo-root `.env` whose `SUPABASE_URL` is `https://guard-probe.invalid`, and nothing exported. It exits 1 with the locality refusal naming `guard-probe.invalid`.
      - The same holds when the simulated `.env` sets only `PUBLIC_SUPABASE_URL`.
      - A seed-CLI parity case with the same simulated `.env` also refuses; it is a control that is green before and after.
      - Before the fix, the two teardown cases are RED.
    - createServiceRoleClient:
      - It refuses a non-local URL before supabase-js `createClient` is called.
      - It calls `createClient` with the URL, the key and `{ auth: { autoRefreshToken: false, persistSession: false } }` for a local URL.
      - It passes a non-local URL when `allowRemote: true` or `DEV_SEED_ALLOW_REMOTE=1`.
      - The `SupabaseAdminClient` constructor delegates to it, so the existing constructor-enforcement tests stay green.
    - serviceRoleClientCallSites:
      - The census covers the git-tracked `*.ts` files under `packages/dev-seed/src` and `tests/`, derived at run time with comments stripped.
      - Exactly one supabase-js client construction exists, and it sits inside `createServiceRoleClient` in `packages/dev-seed/src/supabaseAdminClient.ts`.
      - Negative control: temporarily restoring a direct construction in the bank-auth spec turns it red.
  </behavior>
  <action>
Do the three follow-ups in this order, each ending in its own commit.

**2a. Docker image build in CI (follow-up 1).**

In `.github/workflows/main.yaml`, add a job `docker-image-build` immediately after the `frontend-and-shared-module-validation` job and before `supabase-tests`. That keeps clear of the `secret-scan` to `frontend-and-shared-module-validation` boundary that `ciSecretScanFlags.test.ts` slices on.

The job:
- `runs-on: ubuntu-latest`.
- Step one: checkout with `actions/checkout@v4`.
- Step two: a single run step, `docker build --progress=plain --file apps/frontend/Dockerfile --target production --tag openvaa-frontend:ci .`.
- No new third-party action (no buildx or build-push action), no push, no login, no secrets, no `paths-filter`, no `if:`.

Above the job, write a comment block in the file's style. It says:
- The job builds the production target that `docker-compose.dev.yml` and `render.example.yaml` deploy, from the repo root as they do.
- It runs on every change, because the image copies `apps/`, `packages/`, `scripts/` and the root manifests. A root lifecycle script outside those directories breaks only the image install, which no other job exercises.
- It builds and never pushes.

Write `packages/dev-seed/tests/ciDockerImageBuildGate.test.ts`, modelled on two existing tests:
- `packages/dev-seed/tests/rpcNullabilityGate.test.ts`: its `jobBlock` extraction via the `JOB_KEY_RE` next-job scan, and its comment stripping.
- `packages/dev-seed/tests/ciSecretScanFlags.test.ts`: its docblock explaining why the test lives in dev-seed and why comment lines are stripped.

It asserts the behavior-block properties. Observe the negative control, then revert it.

Verify the real build locally from tracked files only. This mirrors CI's fresh checkout and keeps the untracked `apps/frontend/.env` out of any image. Run it in the background with a log and poll:

`git archive --format=tar HEAD | docker build --progress=plain --file apps/frontend/Dockerfile --target production --tag openvaa-frontend:kxi-local - > LOG 2>&1; status=$?`

Status 0 is required. If the build fails, diagnose it and report. A failure present at the base revision is a pre-existing Dockerfile defect: record it and ask before widening scope. Afterwards run `docker image rm openvaa-frontend:kxi-local` and `docker builder prune -af`, then re-measure VM free space.

Commit `.github/workflows/main.yaml` and the gate test as `build[ci]: build the production frontend Docker image in CI`.

**2b. seed:teardown loads .env before reading its URL and key (follow-up 2).**

Root cause, per the 260930-gk2 SUMMARY:
- The ESM imports of `packages/dev-seed/src/cli/teardown.ts` evaluate `supabaseAdminClient.ts` first, and its module-level `SUPABASE_URL` / `SUPABASE_SERVICE_ROLE_KEY` fallbacks are captured then.
- Only after that does the CLI body's `process.loadEnvFile` and `PUBLIC_SUPABASE_URL` fallback run.
- The CLI then constructs `SupabaseAdminClient(undefined, undefined, ...)`, so `.env` values never reach the client.

The seed CLI avoids this because `Writer`'s constructor reads `process.env` at call time and passes the values explicitly. Do the same here:
- Add an exported `createTeardownClient(options: LocalityGuardOptions = {})` to `teardown.ts`. It returns `new SupabaseAdminClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY, undefined, options)`. The values are read when it is called. When a variable is unset, `undefined` still falls through to the module defaults, and those are local.
- Call it from the `isDirectInvocation` block with `{ allowRemote: values['allow-remote'] === true }`.
- Leave the module-level fallbacks in `supabaseAdminClient.ts` alone; the E2E harness relies on argument-less construction.
- Update step 4 of `teardown.ts`'s header docblock to describe the call-time read.
- Check that `TEARDOWN_USAGE` in `packages/dev-seed/src/cli/teardown-help.ts` is now accurate ("variables defined there ... take effect without `export`"). Edit it only if some sentence is still false.

Regression test: add `packages/dev-seed/tests/cli/fixtures/simulateRootEnv.mjs`, a preload module passed with `--import` after `tsx`. It does two things:
- It replaces `process.loadEnvFile` with a function that copies the entries of `JSON.parse(process.env.SIMULATED_ROOT_ENV)` into `process.env`. This simulates the repo-root `.env` without reading or writing the real one.
- It replaces `globalThis.fetch` with a function that rejects with a fixed "network disabled by simulateRootEnv" error. The pre-fix RED run then fails hermetically instead of contacting the real local database.

In `packages/dev-seed/tests/cli/localityGuard.test.ts`, add a describe block for the `.env` load order:
- Spawn the CLIs as the file already does with `spawnSync(process.execPath, ['--import', 'tsx', '--import', <fixture file URL>, cli, ...])`.
- The child env has SUPABASE_URL, PUBLIC_SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY and DEV_SEED_ALLOW_REMOTE deleted. SIMULATED_ROOT_ENV is set.
- Cover the three behavior-block cases.

Observe the two teardown cases RED on the unfixed code first, then GREEN.

Commit `teardown.ts`, the test file and the fixture, plus `teardown-help.ts` if it changed, as `fix[dev-seed]: seed:teardown reads its URL and key after loading the repo-root .env`.

**2c. Bank-auth spec through the guarded factory (follow-up 3).**

In `packages/dev-seed/src/supabaseAdminClient.ts`:
- Add an exported `createServiceRoleClient(url: string, serviceRoleKey: string, options: LocalityGuardOptions = {}): SupabaseClient`. It calls `assertLocalSupabaseUrl(url, options)`, then supabase-js `createClient(url, serviceRoleKey, { auth: { autoRefreshToken: false, persistSession: false } })`.
- Make the `SupabaseAdminClient` constructor assign `this.client` through it, preserving `url ?? SUPABASE_URL` and `serviceRoleKey ?? SUPABASE_SERVICE_ROLE_KEY`.
- Give it a TSDoc naming the guard, the opt-outs, and that every service-role client in dev-seed and `tests/` must come from it.

Re-export it from `packages/dev-seed/src/index.ts` next to the existing `SupabaseAdminClient` export.

In `tests/tests/specs/candidate/candidate-bank-auth.spec.ts`:
- Build `adminClient` with `createServiceRoleClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY)`, imported from `@openvaa/dev-seed`.
- Drop the spec's own supabase-js import.
- Keep the loud missing-key throws as they are. Every `adminClient.from(...)` and `adminClient.auth.admin.*` call keeps working unchanged, because the factory returns the same `SupabaseClient` type.

Tests:
- In `packages/dev-seed/tests/localSupabaseUrl.test.ts`, add factory cases beside the existing constructor-enforcement tests, reusing that file's mocked `createClient`.
- Add `packages/dev-seed/tests/serviceRoleClientCallSites.test.ts`: the call-site census in the behavior block. List the files with `git ls-files` so the population is derived at run time, strip comments before matching, and report every offending file in the failure message. Observe the negative control.

Commit `supabaseAdminClient.ts`, `index.ts`, the spec and both tests as `fix[tests]: the bank-auth spec builds its service-role client through the dev-seed locality guard`.

**For each commit**, run with status read directly:
- `yarn workspace @openvaa/dev-seed test:unit`
- `yarn workspace @openvaa/dev-seed typecheck`
- `yarn workspace @openvaa/dev-seed lint`
- `yarn typecheck:tests`
- `yarn assert:comment-hygiene`

For 2c, also run `node_modules/.bin/eslint --flag v10_config_lookup_from_file tests`. Comments describe the code as it is now.
  </action>
  <verify>
    <automated>yarn workspace @openvaa/dev-seed test:unit tests/ciDockerImageBuildGate.test.ts tests/cli/localityGuard.test.ts tests/localSupabaseUrl.test.ts tests/serviceRoleClientCallSites.test.ts > "${TMPDIR:-/tmp}"/kxi-t2-focused.log 2>&1; s1=$?; yarn workspace @openvaa/dev-seed test:unit > "${TMPDIR:-/tmp}"/kxi-t2-devseed.log 2>&1; s2=$?; yarn workspace @openvaa/dev-seed typecheck > "${TMPDIR:-/tmp}"/kxi-t2-tc.log 2>&1; s3=$?; yarn typecheck:tests > "${TMPDIR:-/tmp}"/kxi-t2-tctests.log 2>&1; s4=$?; echo "focused=$s1 devseed=$s2 typecheck=$s3 typecheck_tests=$s4"; [ $s1 -eq 0 ] && [ $s2 -eq 0 ] && [ $s3 -eq 0 ] && [ $s4 -eq 0 ]</automated>
  </verify>
  <done>
- Three commits exist, in order: `build[ci]`, `fix[dev-seed]`, `fix[tests]`.
- Each new test was observed RED against the unfixed code, or through its negative control, before going GREEN.
- The local `git archive HEAD` production image build exited 0, and its image and build cache were removed afterwards.
- The dev-seed suite, typecheck, lint and `typecheck:tests` exit 0.
  </done>
</task>

<task type="auto">
  <name>Task 3: Verification gate: static gates, frontend build, full E2E suite, and both opt-in bank-auth projects</name>
  <files>(no source files unless a gate failure is caused by this branch; then the minimal fix files, each fix its own commit)</files>
  <precondition>Tasks 1 and 2 are committed; Docker is running; the Docker VM has at least 15 GiB free (`docker run --rm alpine df -h /`).</precondition>
  <action>
Read every exit status directly, never through a pipe. Save each log under the session scratchpad. Record every command, its exit status and its counts in the SUMMARY.

**1. Pre-flight.**
- `git status --porcelain` shows no unintended changes.
- Measure the VM disk: at least 15 GiB free, or follow the prune-then-stop rule in the context section.
- Ensure no stale dev server:
  - `lsof -nP -iTCP:5173 -sTCP:LISTEN` and the same for 5273 show no listener from this checkout. Kill stale ones with `pkill -f 'vite.js dev'`; the pattern `vite dev` does not match. Re-check that the ports are free.
  - `docker ps --format '{{.Names}}\t{{.Ports}}'` reveals any container publishing 5173. Never stop the user's containers. The wrapper below defaults to port 5273 precisely because a sibling Docker container can hold 5173.

**2. Static gates, in this order.**
- Local Supabase must be up, because the dev-seed live tiers run inside `yarn test:unit`.
- Run each separately: `yarn lint:check`, `yarn format:check`, `yarn typecheck`, `yarn test:unit`, `yarn workspace @openvaa/frontend build`.
- If `lint:check` is red, do not infer the state of its later links from the short-circuited chain. Fix, then re-run the whole chain.
- Run the unit suite BEFORE any E2E run. Leftover seeded state from an E2E run can fail the dev-seed integration test.

**3. Full default E2E suite (clean DB, one fresh server).**
- Run in the background:
  `tests/scripts/e2e-run.sh --run-dir tests/e2e-runs/kxi-full > <scratchpad>/kxi-e2e-full.log 2>&1; echo "exit=$?" >> <scratchpad>/kxi-e2e-full.log`
  It performs `yarn db:reset` (clean DB), readiness polling, and spawns and owns ONE fresh dev server on FRONTEND_PORT (default 5273). It runs Playwright exactly as `yarn test:e2e` does, including `--grep-invert @probe`.
- `yarn test:e2e` also runs `yarn assert:i18n-catalog-namespaces && yarn assert:a11y-scan-wiring` before Playwright. Run those two as well, each status read directly.
- Poll every 60 to 90 seconds.
- The wrapper's exit code is authoritative for pass or fail (0 pass, 1 test failures, 3 to 7 environment/preflight failures, 130 interrupted).
- Take the counts from `tests/e2e-runs/kxi-full/results.json` `.stats`: expected (passed), unexpected (failed), flaky, skipped.
- Report `skipped` as did-not-run and count it as FAILED, unless a spec declares an intentional skip; name any such spec.

**4. Opt-in `bank-auth` project** (exercises the spec changed by follow-up 3). Follow `tests/IDURA-TEST-RUNBOOK.md`, section "Deterministic E2E run (synthetic JWE → Edge Function, no live IdP)", steps E-1 to E-4:
- Generate the Edge env file and the test JWKS from `tests/tests/utils/testKeys.ts`.
- Serve the JWKS on 8777 in the background.
- Serve `identity-callback` with `--no-verify-jwt --env-file` pointing at that file, in the background.
- Run `PLAYWRIGHT_BANK_AUTH=1 tests/scripts/e2e-run.sh --run-dir tests/e2e-runs/kxi-bank-auth --project bank-auth --no-db-reset`. Export the anon and service-role keys (from `supabase status -o env`, not echoed) as `SUPABASE_ANON_KEY` and `SUPABASE_SERVICE_ROLE_KEY` first; the spec throws without them.
- If the wrapper cannot carry this run, fall back to the runbook's direct `npx playwright test --project=bank-auth -c tests/playwright.config.ts` with a manually started fresh dev server, and say so in the SUMMARY.

**5. Opt-in `bank-auth-journey` project.** Follow the runbook's "Full-browser journey (mock OIDC issuer, no live IdP)" section, steps B-1 onward, with one measured correction the runbook gets wrong:
- The journey's Edge env is E-1's, but with `IDENTITY_PROVIDER_ISSUER=https://127.0.0.1:9443`.
- Keep `IDENTITY_PROVIDER_JWKS_URI=http://host.docker.internal:8777/jwks`.

So stop the E-3 function serve and re-serve it with that env. Export the B-1 IdP variables (`IDURA_DOMAIN=127.0.0.1:9443`, the issuer, the client id, the JWKS URI, `NODE_TLS_REJECT_UNAUTHORIZED=0`, and the rest of the runbook's table) in the shell that launches the wrapper, so the dev server the wrapper spawns inherits them.

Then run in the background:
`PLAYWRIGHT_BANK_AUTH=1 tests/scripts/e2e-run.sh --run-dir tests/e2e-runs/kxi-bank-auth-journey --project bank-auth-journey --no-db-reset`

It pulls the whole perm serial chain transitively and takes full-suite time. Poll it. Report the counts from its `results.json` as in step 3, and confirm the journey spec itself executed.

Afterwards, stop the function serve and the JWKS server. If a run was killed mid-chain, clean up orphans:
- delete E2E-project rows by `project_id` in psql, in the order `nominations`, `candidates`, `organizations`;
- delete `auth.users` WHERE email LIKE '%@test.openvaa.local'.

Bootstrap accounts end in `@openvaa.test` and must survive.

**6. Failures.**
- For each failed or did-not-run test, re-run the failing spec in isolation on a fresh dev server before judging it.
- Attribute it to this branch only with evidence: the failing path exercises a file these four commits changed, and it reproduces in isolation. Otherwise report it as pre-existing, environmental or flaky, with the evidence, and mark any unproven root cause UNCONFIRMED.
- A failure caused by this branch is fixed in its own atomic commit. After such a fix, re-run the affected static gates AND the full suite from a clean `db:reset`, because a fix made after the gate voids that gate's run.
- Environmental blockers stop the gate and are reported rather than worked around by hand: disk, port collisions, and the storage 502 wedge. For the storage 502 wedge the recovery is `yarn db:stop && yarn db:start`, then `db:reset`.

**7. SUMMARY.** Write `260930-kxi-SUMMARY.md` in the quick directory. For every gate it records:
- the command and the exit status read directly;
- for each E2E run, `total / passed / failed / flaky / did-not-run`, with did-not-run added to failed in the headline figure ("X passed, Y failed (a direct + b cascaded)");
- the run-directory paths as evidence.

It also states two things:
- The new CI job cannot be observed in Actions from this branch: `main.yaml` triggers only on `main` and `ci-evidence/**`. It was verified by the equivalent local build, and pushing an evidence branch is the operator's call.
- As an observation, not fixed here: the root `.dockerignore` excludes no `.env` files, so a working-tree image build copies any untracked `apps/frontend/.env` into the image.
  </action>
  <verify>
    <automated>yarn lint:check > "${TMPDIR:-/tmp}"/kxi-g-lint.log 2>&1; a=$?; yarn format:check > "${TMPDIR:-/tmp}"/kxi-g-fmt.log 2>&1; b=$?; yarn typecheck > "${TMPDIR:-/tmp}"/kxi-g-tc.log 2>&1; c=$?; yarn test:unit > "${TMPDIR:-/tmp}"/kxi-g-unit.log 2>&1; d=$?; yarn workspace @openvaa/frontend build > "${TMPDIR:-/tmp}"/kxi-g-build.log 2>&1; e=$?; echo "lint=$a format=$b typecheck=$c unit=$d build=$e"; [ $a -eq 0 ] && [ $b -eq 0 ] && [ $c -eq 0 ] && [ $d -eq 0 ] && [ $e -eq 0 ] && node -e "for (const r of ['kxi-full','kxi-bank-auth','kxi-bank-auth-journey']) { const s=require('./tests/e2e-runs/'+r+'/results.json').stats; console.log(r, JSON.stringify(s)); if (s.unexpected !== 0 || s.skipped !== 0) process.exitCode = 1; }"</automated>
  </verify>
  <done>
- All five static gates exit 0, each status read directly.
- `tests/e2e-runs/kxi-full`, `kxi-bank-auth` and `kxi-bank-auth-journey` each hold a `results.json`, with counts reported faithfully in the SUMMARY: did-not-run counted as failed, flaky listed.
- Every branch-caused failure is fixed in its own commit and re-gated from a clean `db:reset`.
- Every remaining failure is reported with its evidence and its attribution, and marked UNCONFIRMED where the root cause is not proven.
- Nothing is hidden or re-labelled as a pass.
  </done>
</task>

</tasks>

<threat_model>
## Trust Boundaries

| Boundary | Description |
|----------|-------------|
| browser → gateway (Kong/Cloudflare) → PostgREST → feedback trigger | Untrusted request headers (`cf-connecting-ip`, `x-forwarded-for`) cross here and decide the rate-limit bucket |
| operator → `private.deployment_settings` | A per-deployment trust decision; must not be reachable by API roles |
| developer tooling / E2E harness → Supabase with the service-role key | An RLS-bypassing credential; must only ever reach a local stack unless explicitly opted out |
| CI runner → Docker build | Builds from repository content; must not publish or authenticate anywhere |

## STRIDE Threat Register

| Threat ID | Category | Component | Severity | Disposition | Mitigation Plan |
|-----------|----------|-----------|----------|-------------|-----------------|
| T-kxi-01 | Spoofing | `private.feedback_client_ip` / `check_feedback_rate_limit` | medium | mitigate | `cf-connecting-ip` is read only when `private.deployment_settings.behind_cloudflare` is true. The default is false and a missing row reads as false (COALESCE). pgTAP proves rotating the header behind one hop is refused at the sixth insert, and the live probe proves it through local Kong |
| T-kxi-02 | Elevation of Privilege | `private.deployment_settings` | high | mitigate | The table is in the unexposed `private` schema, with RLS enabled and REVOKE ALL from PUBLIC, anon, authenticated and service_role. pgTAP asserts that anon and authenticated have no SELECT, INSERT, UPDATE or DELETE and cannot execute the helper |
| T-kxi-03 | Denial of Service | hosted deployments that leave the flag false | medium | mitigate | The shared platform-internal hop collapses voters into one 5-per-5-minute bucket. The SQL comments, `.env.example`, the deployment docs and the env-var docs page all state that hosted Supabase must set the flag, and give the one statement |
| T-kxi-04 | Spoofing | local `seed.sql` opt-in | low | accept | The local CLI stack is not exposed. The seed comment forbids applying it to a deployment not behind Cloudflare, and hosted projects never run `seed.sql` |
| T-kxi-05 | Information Disclosure | `seed:teardown` service-role client | high | mitigate | Once the `.env` values are honoured, a `.env` naming a remote host would direct the service-role key there. The existing locality guard refuses it unless `--allow-remote` or `DEV_SEED_ALLOW_REMOTE=1` is given, and the new subprocess test pins that refusal for both `.env` spellings |
| T-kxi-06 | Information Disclosure | `candidate-bank-auth.spec.ts` service-role client | medium | mitigate | The client is built through `createServiceRoleClient`, which applies `assertLocalSupabaseUrl`. The call-site census keeps the factory the only construction under `packages/dev-seed/src` and `tests/` |
| T-kxi-07 | Tampering | `docker-image-build` CI job | low | mitigate | The job adds no new third-party action (plain `docker build`), uses no secrets, no login and no push. The unit gate asserts the absence of push and login |
| T-kxi-08 | Information Disclosure | local verification image | medium | mitigate | The image is built from `git archive HEAD` (tracked files only), so the untracked `apps/frontend/.env` cannot enter it, and it is removed afterwards. The root `.dockerignore` gap is reported as an observation |
| T-kxi-SC | Tampering | npm/pip/cargo installs | high | accept | No package is installed or added by this plan. The package-legitimacy gate does not apply |
</threat_model>

<verification>
Source coverage audit (quick mode: the GOAL is the five task items; there is no REQUIREMENTS, RESEARCH or CONTEXT for this quick task):

| Item | Covered by |
|------|------------|
| 1. CI job builds the production Docker image, no push | Task 2a |
| 2. Teardown loads `.env` before reading `SUPABASE_URL` (and the key) | Task 2b |
| 3. Bank-auth spec's service-role client behind the locality guard | Task 2c |
| 4. Trust `cf-connecting-ip` only when configured behind Cloudflare; E2E isolation kept; documented in `.env.example` and docs | Task 1 |
| 5. Verification gate: lint:check, typecheck, unit, frontend build, full `yarn test:e2e`, bank-auth-journey, direct exit status, did-not-run counted as failed, faithful report | Task 3 (it adds `format:check` and the `bank-auth` project, because follow-up 3 changes that project's spec) |

Phase-level checks:
- `git log --oneline <item-base.rev>..HEAD` shows the four fix commits, plus any gate-fix commits, each atomic.
- Task 1's verify: pgTAP green, probe PASS for stages A, B and C, parity and SQL lint green.
- Task 2's verify: focused and full dev-seed tests, typecheck and `typecheck:tests` green; the local image build exited 0.
- Task 3's verify: the five static gates exit 0. All three E2E runs report `unexpected == 0` and `skipped == 0` in `results.json`, or the SUMMARY reports the non-zero figures faithfully with attribution.
</verification>

<success_criteria>
- A client-sent `cf-connecting-ip` cannot choose a feedback rate-limit bucket unless the deployment declares `behind_cloudflare`. Local and E2E stacks declare it through `seed.sql`, and the voter-journey feedback specs stay green.
- CI has a build-only `docker-image-build` job, pinned by a unit gate and proven by an equivalent local build.
- `yarn db:seed:teardown` honours the repo-root `.env` for its URL and key, and the locality guard still refuses a non-local host from it.
- The bank-auth spec's service-role client goes through the guarded factory, and a census keeps it that way.
- The full gate ran with every status read directly. Its counts are in the SUMMARY with did-not-run counted as failed, and no failure is hidden.
</success_criteria>

<output>
Create `.planning/quick/260930-kxi-pr-888-follow-ups-docker-ci-build-dev-se/260930-kxi-SUMMARY.md` when done.
</output>
