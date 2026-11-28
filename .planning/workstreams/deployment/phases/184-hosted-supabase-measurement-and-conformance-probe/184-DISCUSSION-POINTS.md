# Phase 184 — Discussion points

**Phase:** Hosted Supabase Measurement and Conformance Probe (workstream `deployment`)
**Written:** 2026-10-26, from a scout of the tree at `bc3fae7c7`
**Closes:** SUPA-01 to SUPA-07, SUPA-13, SUPA-14, OBS-01, OBS-02, OBS-03, OBS-05, OBS-07
**Builds toward:** OBS-04, OBS-09, OBS-10, PIPE-06

## How to fill this

- Each decision lists its options as checkboxes. Exactly one is marked **★ RECOMMENDED**.
- **If you leave every box in a decision unticked, the ★ option is chosen.** You only need to tick a box to overrule it.
- Tick one other box to overrule. A `**NOTE:**` or `**EDIT:**` line beats any box.
- **⚠ DECIDE** marks the five decisions that change the shape of the phase: **A-01, C-02, D-06, E-01, E-02**. Read those first.

Not asked here, because a ruling already settles them: Terraform's `supabase_settings` is the only writer of settings, and `config push` is used nowhere (C4, 183 D-15). The operator applies, and the agent holds no credential (183 D-10). Port 2587 is tried first (C6). `open_for_voters` comes from the environment, default `false` (181-R2). The bootstrap runs as `postgres` over psql (181 D-09). Function code ships with the CLI, and the secrets go through Terraform's `supabase_edge_function_secrets` (C7, research ARCHITECTURE.md). The throwaway project is deleted after this phase (183 D-12). Nothing is seeded per run from CI (E1).

---

## Factual baseline (re-verified 2026-10-26)

| Claim the phase inherits | On the tree | Evidence |
|---|---|---|
| The baseline is frozen | Yes. One migration, with its sha256, at commit `81e6a3f22` | `apps/supabase/supabase/migrations.manifest.json` |
| Persistent project | `cofbsatfrdysyphajsky` (`openvaa-staging`, eu-north-1). Both auth hooks are **on**, and their functions are **not yet on it** | `infra/envs/staging/supabase/terraform.tfvars`, STATE.md blocker [183] |
| Throwaway project | `suxeqyhafjueinxnojge` (`openvaa-scratch`), in the scratch root with local state | `183-25` and `183-21` evidence, `infra/envs/scratch/supabase/` |
| SMTP on the hosted Auth | Not applied: `smtp` is null, and the first SMTP enablement has never been tried | `terraform.tfvars` comment, STATE.md blocker [183] |
| `max_rows` | 50000 in the HCL JSON, equal to `dataAdapter.pageSize` | `infra/modules/supabase/hosted-settings.json`, `packages/app-shared/src/settings/staticSettings.ts:17` |
| `anon` 8 s timeout | Set in the baseline | `00001_initial_schema.sql:92` |
| `verify_jwt` | Declared `false` for `identity-callback` only. Nothing is declared for `account-access` or `send-email` | `apps/supabase/supabase/config.toml:428-432` |
| The send-email hook | A SQL function that **sends no mail**. Mail goes out only through `account-access` and `send-email`, using their own `SMTP_*` secrets | `00001_initial_schema.sql:2150,2241` |
| Bootstrap, drift check, seed check | Written and seen locally. The drift check has **never** been run with `--target linked` | `infra/scripts/{bootstrap.sql,check-drift.sh,check-seed.sql}`, STATE.md blockers [181-11, 181-12] |
| Bootstrap precondition | The server's parameter-logging settings must be read with `SHOW` before the first hosted run | STATE.md blocker [181-11] |
| Settings no longer sent | `oauth_server_enabled` and `oauth_server_allow_dynamic_registration`. The probe should read them | STATE.md blocker [183] |
| Legacy keys | Research says they are deprecated "by the end of 2026" `[DOCS]`. What this project issues has not been observed | `research/PITFALLS.md` Pitfall 7, `ARCHITECTURE.md` F5 |
| Postgres major | The local `major_version = 17`. Hosted: not observed | `config.toml:48` |

---

## A — Order and targets

### A-01 — Which project goes first ⚠ DECIDE

The baseline is frozen, so nothing forces the persistent project to wait. With both hooks on and no functions, nobody can sign in to the persistent project until the push lands. Nobody needs to today.

- [ ] ★ RECOMMENDED — **Throwaway first, every step.** Push, deploy the functions, set the secrets, bootstrap, enable SMTP, run the drift check and measure everything on `suxeqyhafjueinxnojge`. Then repeat the same commands on the persistent project, with no changes. The persistent project then gets one clean pass, and the throwaway ends up broken on purpose for the probe's red run (D-05).
- [ ] Persistent first for the push, the functions and the bootstrap, and the throwaway only for the breaks. Fewer steps, but any surprise in the first push (pooler, IPv4, history table) lands on the project that cannot be recreated.
- [ ] Persistent only, with the breaks planted and reverted there. The throwaway is deleted early, but the persistent project carries every red control's residue.

### A-02 — What "one command" means for SUPA-01

- [ ] ★ RECOMMENDED — A committed wrapper, `infra/scripts/push-migrations.sh`. It checks that the work directory is linked to the ref it is given, runs `supabase db push --linked` (with `--dry-run` shown first), reads the exit status directly, and then runs `check-drift.sh --target linked`. A second run must print "up to date" and exit 0. The other steps (functions, secrets, bootstrap) keep their own commands, and the runbook orders them in the PIPE-06 order.
- [ ] A bare `supabase db push --linked` documented in the runbook, with no wrapper. Less code, but the "is this the right project" check and the drift step depend on the operator remembering them.
- [ ] One `deploy-supabase.sh` that does push, functions, secrets and bootstrap. Closer to PIPE-06, but phase 187 owns that order, and a single script hides which step failed.

### A-03 — The database connection from your workstation

Research says the direct host is IPv6-only, and that the measurement is the IPv4 path with the pooler as the fallback.

- [ ] ★ RECOMMENDED — Try the direct connection first and record whether it works. If it fails, use the **session-mode** pooler (port 5432) for push, bootstrap, drift check and the probe's catalog reads, and record that. The transaction-mode pooler (6543) is not used, because it breaks the session settings that `bootstrap.sql` relies on.
- [ ] The session pooler always, with no direct attempt. Simpler, but it leaves "does the direct host work from IPv4" unobserved, and phase 187's runner will ask the same question.
- [ ] Buy the IPv4 add-on. A standing monthly cost, for a need the pooler already meets.

---

## B — Functions, secrets and mail

### B-01 — `identity-callback` on staging without bank authentication

SUPA-05 asks for three functions. A4 excludes bank authentication from the deployed test, so no IdP sandbox client exists.

- [ ] ★ RECOMMENDED — Deploy it with `verify_jwt = false` (as declared), `PUBLIC_PROJECT_ID` and `SITE_URL` set, and no `IDENTITY_PROVIDER_*` secret. The probe checks that it is served and that it refuses a call. Research first confirms that the function fails closed when its provider variables are unset; if it does not, that becomes a finding and a fix in this phase.
- [ ] Deploy it with the Idura test client's values. This is the start of bank authentication on staging, which A4 excludes.
- [ ] Do not deploy it. This contradicts SUPA-05's "three", which would need rewording.

### B-02 — How the SES port is measured (SUPA-14)

- [ ] ★ RECOMMENDED — Use the real `account-access` function on the throwaway project. Set `SMTP_PORT=2587` and ask for one link mail to your mailbox, which is verified for the sandbox (183-19). If no mail arrives, try 587, then 465, then 25. The first port that delivers is written into the secrets and into the Auth `smtp` object of both roots. The failed attempts double as the OBS-05 "slot released after a failed send" observation.
- [ ] A temporary connect-only probe function that opens TCP connections to every port at once. Faster and cleaner as a network fact, but it proves nothing about delivery, so a real send is needed anyway.

### B-03 — How the DKIM, SPF and DMARC result is read

- [ ] ★ RECOMMENDED — From your mailbox: you paste the `Authentication-Results` header (and `Received-SPF` if your provider adds it) of the one mail into the evidence file. A manual step for you, recorded with its date.
- [ ] Through an external mail-tester address. This needs a sandbox verification of that address and sends a mail to a third party.

### B-04 — Auth's own SMTP setting (SUPA-02)

Auth sends no mail through it, because the send-email hook swallows every mail. SUPA-02 still lists SMTP.

- [ ] ★ RECOMMENDED — Apply it anyway, with the measured port and the same SES user, and read it back. A hook that is switched off later would otherwise fall back to Supabase's built-in mailer. This also resolves the "first SMTP enablement is untried" blocker from 183.
- [ ] Leave `smtp` null and reword SUPA-02. A requirement change for a setting that is cheap to apply.

---

## C — Bootstrap, gateway and keys

### C-01 — `behind_cloudflare` on the hosted project (feeds OBS-10)

- [ ] ★ RECOMMENDED — Measure first. On the throwaway project, record which forwarded headers reach an Edge Function and a PostgREST request (D-07), including whether a `cf-connecting-ip` sent by the client is overwritten. Set `BOOTSTRAP_BEHIND_CLOUDFLARE` from that record, and only then bootstrap the persistent project.
- [ ] Set `true` from Supabase's documentation, and confirm it later in 185. Saves a measurement, but if the header is not set by the platform, a client can choose its own bucket in the feedback rate limit.

### C-02 — If the gateway refuses a call with the anon key and no user token (OBS-03) ⚠ DECIDE

`account-access` has no `verify_jwt` entry, so the hosted default (verification **on**) applies. With a legacy anon key the call may still pass, because that key is itself a JWT. With a publishable key it would not.

- [ ] ★ RECOMMENDED — Measure first. If the call is refused, or if only the legacy JWT shape lets it through, declare `verify_jwt = false` for `account-access` in `config.toml`. The function already makes its own checks, and this does not break when FUT-02 brings publishable keys. The parity guard's table gains the key.
- [ ] Keep verification on, and have the frontend send the anon key as `Authorization: Bearer`. Works on legacy keys only, and breaks at FUT-02.
- [ ] Keep verification on and record the refusal only. OBS-03 says "works or is changed", so this does not close it.

### C-03 — Bootstrap when the server logs statement parameters

- [ ] ★ RECOMMENDED — Run the seven `SHOW`s first (the list in the 181-11 blocker) on each project and record them. Run the bootstrap only if none would log a successful or slow statement's parameters. Otherwise stop at a checkpoint with the values, and you decide.
- [ ] Run it regardless and rotate the service-role key afterwards. Rotating a legacy JWT key means rotating the JWT secret, which signs every key and session.

### C-04 — The signed-in token check (criterion 2, "hook on, with a signed-in token carrying its claims")

Sign-up is off, so a user has to be created with the admin API.

- [ ] ★ RECOMMENDED — On the persistent project, create the **first administrator** by the documented one-off step, which 185 and 186 need anyway. Sign in with a password over `/auth/v1/token` and decode the claims that the hook adds. The address is yours; the password comes from your password manager and is never written down. On the throwaway, create a disposable user for the same check.
- [ ] Throwaway only. The persistent hook then stays unobserved until 185.

### C-05 — If the project issues no legacy keys, or they are about to be retired (SUPA-13)

C5: stay on legacy keys if they work. Research cites a deprecation "by the end of 2026" `[DOCS]`, about two months after this phase.

- [x] ★ RECOMMENDED — Record what is issued, the dashboard's state of the legacy keys and any retirement date shown. If the legacy keys work for every call shape, stay on them (C5) and add the date to the FUT-02 todo. If they **do not** exist or do not work, stop at a checkpoint: pulling FUT-02 forward is a scope change for you to rule on.
- [ ] Move to publishable keys now in any case. This changes the frontend, the functions and the storage trigger in a stream shared with v2.16, which C5 ruled against.

NOTE: Add the todo to be executed immediately after the streams are merged.

---

## D — The conformance probe (SUPA-07)

### D-01 — What it is written in

- [ ] ★ RECOMMENDED — A Node script, `infra/scripts/probe-hosted.mjs`, using Node built-ins only (`fetch`, `child_process` for `psql`), as the parity guard does (183 D-14). Each check has a stable name and prints `PASS <name>` or `FAIL <name>: <finding>`. The exit status is 0 only if every check passes, 1 on any failure and 2 if it could not run. A Vitest spec covers the comparison logic against recorded responses.
- [ ] Bash with `curl`, `jq` and `psql`. Matches `check-drift.sh`, but the comparison logic is harder to test and `jq` becomes a new dependency.

### D-02 — What it reads, and with which credentials

- [ ] ★ RECOMMENDED — Three sources. The Management API with `SUPABASE_ACCESS_TOKEN` (settings, `max_rows`, the oauth flags, the functions list and their `verify_jwt`, the key model). The public API with the anon key only (`/auth/v1/settings`, a PostgREST read of more than 1000 rows, the 8 s timeout, the functions served). The catalog over psql as a read-only role (the buckets, both hook functions, the Postgres major version, `check-seed.sql`). It **never** takes the service-role key.
- [ ] The service-role key as well, for broader reads. More coverage for a key the probe does not need.

### D-03 — What the probe includes

- [ ] ★ RECOMMENDED — The settings of criterion 2, the oauth flags, both buckets, all three functions served (with `identity-callback` unverified), the hooks' functions present, more than 1000 rows read whole, the `anon` timeout, Postgres major 17, and the seed check (run as a subprocess and named `no-seed`). The drift check stays its own step after the push, because it needs Docker for a shadow database.
- [ ] The drift check inside the probe as well. One command covers everything, but the probe then needs Docker and the linked work directory, which phase 187's post-deploy step may not want.

### D-04 — Where the expected values come from

- [ ] ★ RECOMMENDED — The same files the parity guard reads: `infra/modules/supabase/hosted-settings.json`, the tfvars of the target root (site URL, redirect entries) and `staticSettings.dataAdapter.pageSize`. There is no second table of expected values.
- [ ] A table of its own in the probe. Lets the two drift apart, which is what SUPA-11 exists to prevent.

### D-05 — How every check is seen failing on the throwaway

- [ ] ★ RECOMMENDED — **One batched break.** All the planted faults go in together: settings through a scratch-root apply with overridden values, one bucket dropped, one function deleted, a seed-shaped user inserted, and `max_rows` lowered. One probe run must then show **every** check as `FAIL`, each with a finding that matches its planted fault (not a cascade such as "unreachable"). Then the faults are reverted, and a green run follows. This means one operator apply for the break and one for the revert.
- [ ] One break per run, N runs. The strongest attribution, but around 15 operator round trips.
- [ ] Hand-picked groups of three or four. A middle path, with the grouping chosen in planning.

### D-06 — Where the more-than-1000-rows read gets its rows on the persistent project ⚠ DECIDE

The persistent project holds no data. E1 seeds the smoke dataset once, out of band. The seed check fails on `openvaa.test` users, which dev-seed templates may create (not verified).

- [ ] ★ RECOMMENDED — Seed the E1 dataset once in **this** phase, from your shell with dev-seed, and reuse it in 185 (OBS-08) and 186. Research first confirms a template that creates more than 1000 anon-readable rows and **no** auth users, so that `no-seed` stays green. If none exists, planning adds a template option rather than relaxing the seed check.
- [ ] Throwaway only for the row read. The persistent probe then checks the `max_rows` setting and an anon read of whatever exists. OBS-07 is closed on the throwaway, and the probe's row check is weaker on staging.
- [ ] Defer the dataset to 185, and run the row check on the throwaway for now. 185 adds the persistent check.

### D-07 — The header record that feeds OBS-04 and OBS-10

- [ ] ★ RECOMMENDED — On the **throwaway** only: a temporary echo Edge Function, and a temporary SQL function that returns `current_setting('request.headers')`, created by hand and never committed to `migrations/` (append-only since the freeze). Each is called with and without a spoofed `x-forwarded-for` and `cf-connecting-ip`, the record is written with its date, and both are removed before the probe's green run. The gateway is the platform's, so the throwaway stands for the persistent project. The frontend container's side stays in 185.
- [ ] The same on the persistent project, through an appended migration. "As deployed" is literal, but it puts a header-echo endpoint into the permanent schema.

---

## E — Records and carry-overs

### E-01 — Where the dated observations live ⚠ DECIDE

Phase 189 writes the documentation from these observations (DOCS).

- [ ] ★ RECOMMENDED — Raw evidence goes in `184-*/evidence/184-NN-*.md`, as in 183. Each settled observation gets one dated row in an **"Observed"** table in `infra/envs/staging/supabase/README.md`, next to its existing "Not yet observed" table, and the row moves from one table to the other.
- [ ] Evidence files only. Phase 189 then digs them out of `.planning/`, which is not published.
- [ ] A new `infra/OBSERVATIONS.md` for every root. One place, but a second index beside the runbooks.

### E-02 — The 183 security items transferred to "phase 184" ⚠ DECIDE

TR-183-01 and TR-183-02 (the plan role's workflow pin, the staging Environment's branch policy and the numeric id claims), and AR-183-01 and AR-183-02 (the `ReadOnlyAccess` remainder and the plan role's lock write). They are all about the GitHub OIDC roles, which no workflow uses until 187. Phase 184 adds no workflow.

- [ ] ★ RECOMMENDED — Re-transfer all four to **phase 187**, where the PR and deploy workflows exist and the fix can be seen working. Record the re-transfer in `183-SECURITY.md` with its date.
- [ ] Settle them in 184 as a separate plan. Possible, but each one changes the bootstrap root (an operator apply) for roles that nothing calls yet.

### E-03 — The drift check on the linked project (the 181-12 blocker)

- [ ] ★ RECOMMENDED — Before a green result is trusted, plant one DDL change on the **throwaway** and see `check-drift.sh --target linked` exit 1. Then record whether the default schema set is empty on a clean hosted database. If it is not, narrow the set in the script, with that output as evidence. Also add a check that the `PG*` connection points at the linked ref. Remove the 51 MB shadow-baseline cache after the run.
- [ ] Trust the local red control from 181 and run green only. That leaves the "never run linked" blocker open.

### E-04 — The throwaway project at the end of the phase

- [ ] ★ RECOMMENDED — The operator deletes it in the dashboard after the probe's red and green runs and the header record, as 183 D-12 says, and the scratch root's local state is removed. Phases 185 to 187 plant their red controls on the AWS side.
- [ ] Keep it until 187 as a target for the pipeline's red run. It costs a Pro project's compute each month, and PIPE-09's red run is a broken build, not a broken project.

### E-05 — Pending todos matched by keyword

`todo.match-phase` matched five todos, all frontend or UI (the candidate answer store, app header styling, moving auth code to adapters, `tweened`, the `.cjs` store guard). They matched on words such as "after" and "frontend", not on this phase's scope.

- [ ] ★ RECOMMENDED — Fold none. Each stays pending.
- [ ] Fold the ones you name: **NOTE:**

---

**NOTE (anything else):**

## Fill status

| Section | Decisions | ⚠ |
|---|---|---|
| A Order and targets | 3 | 1 |
| B Functions, secrets, mail | 4 | 0 |
| C Bootstrap, gateway, keys | 5 | 1 |
| D Probe | 7 | 1 |
| E Records and carry-overs | 5 | 2 |
| **Total** | **24** | **5** |
