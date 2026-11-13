# 183-26 Hosted-settings parity guard: red controls

Each run below is the guard `scripts/assert-hosted-settings-parity.mjs` (as of commit `fc7521da6`) run once against
one changed copy under `$TMPDIR`, with every other input real. Each copy was made by its own setup command whose
status was checked before the guard ran; the guard's exit status was captured on the line after the command, never
through a pipe. The real compared files were never edited: their content hashes before and after are listed below.

Section written whole from the attempt file named on the next line.

Attempt: 26-2 20261019T062611Z.fc7521da6
Started: 2026-10-19T06:26:11Z at commit fc7521da6

Content hashes before (git hash-object):
before f1ea82b0c2b0e55c5c88f3a3d373079aa72184b5 apps/supabase/supabase/config.toml
before 605aa86c7c65eb151a6b14bbd218c3028ebe9de7 infra/modules/supabase/hosted-settings.json
before 50379d984f0d3329180aac267044c1e996bce7a3 packages/app-shared/src/settings/staticSettings.ts
before e3a9a5a9d8bb3735005bb043320586aa84112dcf infra/modules/supabase/main.tf
before a9767aaf00d563e0002eabc5c5bde0b91628c41a infra/modules/supabase/outputs.tf
before a0df1a697c0b8aeb0f0ec196b24af0c47f609f19 infra/modules/supabase/settings.tf
before 141056a6f2864039616e49f513ca9889b51c9fd7 infra/modules/supabase/variables.tf

| Run | Change | Expected status | Exit status | Finding line | Date |
|-----|--------|-----------------|-------------|--------------|------|
| 1 | none: real inputs | 0 | 0 | `census: 66 live key(s) of [api], [api.tls], [auth] and [auth.*]: must agree 24, hosted may be stricter 5, differs by design 2, not compared 35; 3 origin(s) checked across 3 Supabase root(s); access-token hook not applied in: none; send-email hook not applied in: none.` | 2026-10-19T06:26:16Z |
| 2 | `--settings` the committed fixture (`api.max_rows` 49999) | 1 | 1 | `scripts/fixtures/hosted-settings-parity/hosted-settings.max-rows-49999.json: api/max_rows: config.toml 50000, hosted api.max_rows 49999, dataAdapter.pageSize 50000; all three must be equal — the frontend reads each collection in one request and does not paginate, so a smaller cap truncates a response without an error` | 2026-10-19T06:26:16Z |
| 3 | JSON copy with `auth.jwt_exp` 7200 | 1 | 1 | `/var/folders/3p/10hbv0415234v3x5ctp50l4m0000gn/T/parity-red.LswvF9/jwt.json: auth/jwt_expiry: hosted auth.jwt_exp 7200 is weaker than local 3600; it must be at most the local value — an access token is a bearer credential; a hosted lifetime longer than the tested one widens what a stolen token can do` | 2026-10-19T06:26:16Z |
| 4 | JSON copy whose second redirect path is `/*/api/auth/*` | 1 | 1 | `/var/folders/3p/10hbv0415234v3x5ctp50l4m0000gn/T/parity-red.LswvF9/redirect.json: auth/additional_redirect_urls: the path "/*/api/auth/*" ends in *; the path "/*/api/auth/*" is not the path suffix of any local entry; the local entry "http://localhost:5173/*/api/auth/callback" has no hosted callback path and is not listed as local-only — the hosted redirect allow list is the origin followed by two fixed callback paths; a wildcard there turns a closed redirect boundary into an open one` | 2026-10-19T06:26:17Z |
| 5 | `config.toml` copy with `security_captcha = false` added under `[auth]` | 1 | 1 | `/var/folders/3p/10hbv0415234v3x5ctp50l4m0000gn/T/parity-red.LswvF9/unclassified.toml: auth/security_captcha: the live key is in no class of this guard; classify it, with its reason, before it can be relied on or ignored` | 2026-10-19T06:26:17Z |
| 6 | `config.toml` copy without the `otp_length` line of `[auth.email]` | 1 | 1 | `/var/folders/3p/10hbv0415234v3x5ctp50l4m0000gn/T/parity-red.LswvF9/stale.toml: auth.email/otp_length: the key is classified as 'must agree' but is not live in the file; remove or correct its row` | 2026-10-19T06:26:17Z |
| 7 | `staticSettings.ts` copy with `pageSize: 1000` | 1 | 1 | `/var/folders/3p/10hbv0415234v3x5ctp50l4m0000gn/T/parity-red.LswvF9/staticSettings.ts: api/max_rows: config.toml 50000, hosted api.max_rows 50000, dataAdapter.pageSize 1000; all three must be equal — the frontend reads each collection in one request and does not paginate, so a smaller cap truncates a response without an error` | 2026-10-19T06:26:17Z |
| 8 | `--envs-dir` an empty directory | 1 | 1 | `/var/folders/3p/10hbv0415234v3x5ctp50l4m0000gn/T/parity-red.LswvF9/empty-envs: auth/site_url: no Supabase root under this directory yields a public_origin, so the origin rule examined nothing; a check that examined nothing does not report success` | 2026-10-19T06:26:17Z |
| 9a | `infra/envs` copy: staging sets `enable_access_token_hook = false`, no comment | 1 | 1 | `/var/folders/3p/10hbv0415234v3x5ctp50l4m0000gn/T/parity-red.LswvF9/envs-9a/staging/supabase/terraform.tfvars: auth.hook.custom_access_token/enabled: enable_access_token_hook = false switches the compared hook keys off for this root; it needs a trailing comment '# hook off until <reason>'` | 2026-10-19T06:26:17Z |
| 9b | `infra/envs` copy: the same line with `# hook off until the function is on this project` | 0 | 0 | `census: 66 live key(s) of [api], [api.tls], [auth] and [auth.*]: must agree 24, hosted may be stricter 5, differs by design 2, not compared 35; 3 origin(s) checked across 3 Supabase root(s); access-token hook not applied in: staging; send-email hook not applied in: none.` | 2026-10-19T06:26:17Z |
| 10 | `--module-dir` module copy whose `settings.tf` merges `{}` in place of `local.hosted.auth` | 1 | 1 | `/var/folders/3p/10hbv0415234v3x5ctp50l4m0000gn/T/parity-red.LswvF9/module-10: module/local.hosted.auth: the module's code does not read the JSON group auth as local.hosted.auth, so its compared values are not sent; the JSON would be a dead file while the comparison stays green` | 2026-10-19T06:26:17Z |
| 11 | `--module-dir` module copy whose project block has no `prevent_destroy` | 1 | 1 | `/var/folders/3p/10hbv0415234v3x5ctp50l4m0000gn/T/parity-red.LswvF9/module-11/main.tf: module/supabase_project: the project block has no lifecycle prevent_destroy = true, so a plan may destroy the project` | 2026-10-19T06:26:18Z |

Commands (run from the repository root; <...> is a copy under $TMPDIR):
- 1: node scripts/assert-hosted-settings-parity.mjs
- 2: node scripts/assert-hosted-settings-parity.mjs --settings scripts/fixtures/hosted-settings-parity/hosted-settings.max-rows-49999.json
- 3: node scripts/assert-hosted-settings-parity.mjs --settings <copy with auth.jwt_exp 7200>
- 4: node scripts/assert-hosted-settings-parity.mjs --settings <copy whose second redirect path is /*/api/auth/*>
- 5: node scripts/assert-hosted-settings-parity.mjs --config <copy with security_captcha = false added under [auth]>
- 6: node scripts/assert-hosted-settings-parity.mjs --config <copy without the otp_length line of [auth.email]>
- 7: node scripts/assert-hosted-settings-parity.mjs --static-settings <copy with pageSize: 1000>
- 8: node scripts/assert-hosted-settings-parity.mjs --envs-dir <empty directory>
- 9a: node scripts/assert-hosted-settings-parity.mjs --envs-dir <copy of infra/envs, staging sets enable_access_token_hook = false>
- 9b: node scripts/assert-hosted-settings-parity.mjs --envs-dir <copy of infra/envs, staging sets enable_access_token_hook = false # hook off until ...>
- 10: node scripts/assert-hosted-settings-parity.mjs --module-dir <module copy, local.hosted.auth, replaced by {},>
- 11: node scripts/assert-hosted-settings-parity.mjs --module-dir <module copy, the prevent_destroy = true line of the project block deleted>

Run 9b census: census: 66 live key(s) of [api], [api.tls], [auth] and [auth.*]: must agree 24, hosted may be stricter 5, differs by design 2, not compared 35; 3 origin(s) checked across 3 Supabase root(s); access-token hook not applied in: staging; send-email hook not applied in: none.
Run 1 structure: structure: 4 .tf file(s) of infra/modules/supabase; 5 of 5 JSON group(s) read; 15 HCL-owned key(s); 203 tracked file(s) scanned for a second writer of hosted settings.
Run 7 full finding: /var/folders/3p/10hbv0415234v3x5ctp50l4m0000gn/T/parity-red.LswvF9/staticSettings.ts: api/max_rows: config.toml 50000, hosted api.max_rows 50000, dataAdapter.pageSize 1000; all three must be equal — the frontend reads each collection in one request and does not paginate, so a smaller cap truncates a response without an error
Scratch directory: /var/folders/3p/10hbv0415234v3x5ctp50l4m0000gn/T//parity-red.LswvF9

Content hashes after (git hash-object):
after f1ea82b0c2b0e55c5c88f3a3d373079aa72184b5 apps/supabase/supabase/config.toml
after 605aa86c7c65eb151a6b14bbd218c3028ebe9de7 infra/modules/supabase/hosted-settings.json
after 50379d984f0d3329180aac267044c1e996bce7a3 packages/app-shared/src/settings/staticSettings.ts
after e3a9a5a9d8bb3735005bb043320586aa84112dcf infra/modules/supabase/main.tf
after a9767aaf00d563e0002eabc5c5bde0b91628c41a infra/modules/supabase/outputs.tf
after a0df1a697c0b8aeb0f0ec196b24af0c47f609f19 infra/modules/supabase/settings.tf
after 141056a6f2864039616e49f513ca9889b51c9fd7 infra/modules/supabase/variables.tf

Hashes: each of the 7 files has the same content hash after the runs as before.

Red controls: 12 of 12 as expected

## What this supports

Seen on 2026-10-19 (UTC) by direct runs of the guard: it fails when a security-relevant key of `config.toml` and the
HCL's hosted settings disagree (runs 2, 3, 4 and 7), when its classification goes stale in either direction (runs 5
and 6), when it would examine no origin (run 8), when a root switches a compared hook off without a stated reason (run
9a, while the reasoned switch passes and is named in the census, run 9b), when the HCL stops encoding the JSON (run 10)
and when the project block loses `prevent_destroy` (run 11). It passes on the real inputs (run 1).

The guard's other structural findings (a missing password ignore, an unknown or misplaced key, a misspelled HCL-owned
key, an empty-object conditional, the CLI's configuration-push command in a scanned file) are each held by an embedded
self-test case, `node scripts/assert-hosted-settings-parity.mjs --self-test` (66 cases, exit 0).

## Still to be seen, and where

- The same failure through `yarn lint:check`, the chain this guard is a link of: plan 183-13.
- The hosted project serving what the JSON and the HCL declare, read back after an apply: plans 183-24 and 183-25.
