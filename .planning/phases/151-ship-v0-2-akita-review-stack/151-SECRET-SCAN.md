---
phase: 151-ship-v0-2-akita-review-stack
plan: 17
artifact: secret-scan
scanned_object: "ship/v0.2-akita-11-planning (6f04fa02313b60b7447a7262a0e05a3091a7cb12)"
scanned_range: "3aa503741425a1df4d528a883f3c294906e96cc4..6f04fa02313b60b7447a7262a0e05a3091a7cb12"
scanned_at: 2026-08-17
scanner: "TruffleHog (primary) + gsd-151-17 pattern sweep (independent) + targeted project-shape greps"
scanner_version: "trufflehog 3.95.2; python 3.9.16; git 2.50.1 (Apple Git-155)"
ruleset: "TruffleHog default detector set (all detectors, results=verified,unknown,unverified,filtered_unverified) + ruleset gsd-151-17 v1 (24 named rules, listed in full below)"
files_in_diff: 2324
files_scanned: 2325
lines_scanned: 911828
lines_scanned_corpus_only: 888337
diff_changed_lines: 879930
coverage: superset
archives_expanded: 2
findings_total: 14
findings_live: 0
findings_accepted: 9
findings_false_positive: 5
verdict: pass-with-accepted-findings
operator_signoff: pending
blocking: true
---

# Phase 151 — Secret Scan of the Planning Slice

**Slice 11 is the one pull request D-12 says is approvable without reading. This scan is the only
thing between 879,826 unread lines and a public repository.** It ran before the slice was pushed,
and the slice is still unpushed at the time this record was written.

**Verdict: `pass-with-accepted-findings`. Zero live credentials. Nine credential-shaped findings,
each classified non-live with stated evidence; five false positives.** The verdict is *not*
self-approving — Task 3 puts it to the operator, and this file is what they read.

---

## 1. What was scanned — stated as set containment, not as a line-count proxy

The plan asks that `lines_scanned` fall within 2% of the diff's changed-line count, as a proxy for
"the whole diff was scanned, not a subset". **That proxy is reported below, but the stronger claim
was measured directly: the scanned set is a strict superset of the diff set, and the one extra file
is named.**

| quantity | value |
|---|---:|
| files in slice 11's diff (`10..11`, `--no-renames`) | **2324** |
| files scanned | **2325** |
| files in the diff that were NOT scanned | **0** |
| diff changed lines (`+879,826 / −104`) | **879,930** |
| lines scanned, corpus only | **888,337** (+0.96%) |
| lines scanned, including expansion of 2 archives | **911,828** (+3.63%) |
| archives expanded | **2** |

**The scanned set is larger than the diff on purpose, and the excess is fully attributed:**

- **`.claude/settings.json` ships in slice 11's tree but appears in NO slice's diff.** It is
  byte-identical at `origin/main` (blob `10842a650`), so no slice's diff contains it — this is
  exactly the "dropped finding" class this phase's manifest warns about, where a file is reviewed by
  nobody because review is organised by diff. **It was scanned anyway** (7 lines; content is a
  Claude Code permissions stanza with two `Bash(...)` allow entries and no values). Scanning the
  *publication surface* rather than the *diff* is what caught it.
- **The two modified files were scanned in full**, not only in their added hunks: `CLAUDE.md`
  (424 lines, of which 209 added) and `.agents/code-review-checklist.md` (50 lines, of which 34
  added). +231 lines.
- **The two `.zip` archives were decompressed and their 143 members scanned** (+23,491 lines). A
  container that is not opened is a container that is not scanned.

The corpus-vs-diff line arithmetic closes **exactly**, with no residue:

```
879,826  git insertions
+  8,324  newline bytes inside the two .zip files (git counts binary files as 0)
+    215  CLAUDE.md unchanged lines
+     16  .agents/code-review-checklist.md unchanged lines
+      7  .claude/settings.json (in no diff at all)
−     51  files whose last line has no trailing newline (git counts that line; `wc -l` does not)
= 888,337  measured corpus lines
```

A two-sided reading of the plan's "within 2%" criterion fails on the archive-expanded figure
(+3.63%). **It fails in the safe direction — by scanning more than the diff, not less** — and the
set-containment measurement above is what the criterion was proxying for. Recorded rather than
massaged.

## 2. How to reproduce this scan

```bash
# 0. the object under scan (unpushed at scan time)
S10=3aa503741425a1df4d528a883f3c294906e96cc4     # ship/v0.2-akita-10-root-config
S11=6f04fa02313b60b7447a7262a0e05a3091a7cb12     # ship/v0.2-akita-11-planning

# 1. materialise the PUBLICATION SURFACE (not the diff): every file the slice ships
mkdir -p /tmp/corpus
git archive "$S11" -- .planning .claude .agents CLAUDE.md | tar -x -C /tmp/corpus
find /tmp/corpus -type f | wc -l          # -> 2325

# 2. PRIMARY scanner
trufflehog filesystem /tmp/corpus \
  --results=verified,unknown,unverified,filtered_unverified --json --no-update
#   -> chunks 7028, bytes 72,866,595, verified_secrets 0, unverified_secrets 13

# 3. INDEPENDENT sweep (ruleset gsd-151-17 v1; the script is reproduced in § 6)
python3 sweep.py /tmp/corpus

# 4. decisive test for the two HS256 tokens — do they verify against Supabase's
#    PUBLISHED local-development secret? (see finding S-05 / S-06)
#    secret = "super-secret-jwt-token-with-at-least-32-characters-long"
```

**Note on why `trufflehog git` was not used.** This checkout is a *linked git worktree*, so `.git`
is a file rather than a directory, and TruffleHog's git mode aborts with
`failed to read index file: … not a directory`. The filesystem mode over a `git archive` extraction
was used instead. **This is a stronger scope, not a weaker one**: it scans the slice's whole
publication surface rather than only the commits in the range, which is how `.claude/settings.json`
was caught.

## 3. Findings — every one, redacted and classified

**No excerpt below contains a full candidate value.** Redaction form is
`<first 6>…[N withheld]…<last 4>`.

**One string in this file is deliberately unredacted and is not a finding:**
`super-secret-jwt-token-with-at-least-32-characters-long`, in § 2 and in S-05. That is Supabase's
**published** local-development signing secret — printed by `supabase start` on every developer
machine and documented publicly by Supabase. It is the *reference constant used to disprove* two
findings, and the scan is not reproducible without naming it. It is a credential to nothing.

### Accepted — credential-shaped, classified non-live with evidence (9)

| # | Rule / detector | File | Line | Redacted | Classification and the evidence for it |
|---|---|---|---:|---|---|
| **S-01** | TruffleHog `JWT`; sweep `jwt`, `bearer-token` | `.planning/milestones/v2.10-phases/79-…/post-fix/rca-traces/trace-run-1.zip` (`!0-trace.network`, `!resources/f0d9a8e00….html`) | 327–331, 351, 6862 | `eyJhbG…[920 withheld]…vGjQ` | **Expired local access token.** Decoded: `alg ES256`, `iss http://127.0.0.1:54321/auth/v1` (loopback), `role authenticated`, `sub eb1d35cb-…`, `exp 2026-05-12T21:15:49Z` — **expired 96 days before this scan**. Issuer is the local Supabase dev stack per `CLAUDE.md`; **zero `*.supabase.co/.in/.net` hosts appear anywhere in the corpus** (measured). Signed by an ephemeral per-instance key (`kid b81269f1-…`) that `supabase start` / `yarn db:reset` regenerates. 7 occurrences. |
| **S-02** | as S-01 | `…/trace-run-2.zip` (same two members) | 327–331, 351, 6862 | `eyJhbG…[920 withheld]…a8fw` | Same class as S-01. `sub d19bcceb-…`, `exp 2026-05-12T21:22:06Z`, **expired 96 days**. 7 occurrences. |
| **S-03** | sweep `apikey-assign` (matched on `access_token`) | `…/trace-run-1.zip!0-trace.network` + `!resources/…` | 351 sites | `base64…[2789 withheld]…ZX19` | **Supabase session cookie `sb-127-auth-token`**, whose base64 body decodes to a session object carrying `access_token` (= S-01), `expires_at`, `user`, **and a `refresh_token`** — `whp…[7 withheld]…ue`, 12 chars. A refresh token does not expire on a clock, so it is called out rather than folded into S-01. **Not live:** it is a row in the *local* instance's `auth.refresh_tokens` table, in a database created `2026-05-12` and destroyed on every `yarn db:reset` since; it is meaningless to any host but `127.0.0.1:54321`. |
| **S-04** | as S-03 | `…/trace-run-2.zip` (same members) | 351 sites | `base64…[2787 withheld]…V9fQ` | Same class as S-03. `refresh_token` `x37…[7 withheld]…p7`, 12 chars. |
| **S-05** | sweep `jwt` | 14 occurrences across 4 files (both trace archives, `0-trace.network` + one `.html` resource each) | various | `eyJhbG…[139 withheld]…n_I0` | **The published Supabase CLI demo *anon* key — a public constant, not a credential.** Decoded: `alg HS256`, `iss supabase-demo`, `role anon`, `exp 2032-11-11`. **Decisive evidence: it verifies against Supabase's published local-development signing secret** `super-secret-jwt-token-with-at-least-32-characters-long`, which `supabase start` prints on every developer machine and Supabase documents publicly (HMAC recomputed, signature matched). A cloud project uses a per-project secret, so this token authenticates against nothing deployed. **Already public independently:** the identical token is tracked at `HEAD` in `.env.example`, `apps/supabase/benchmarks/k6/config.js` and `apps/supabase/benchmarks/scripts/run-benchmarks.sh` — the last two shipped in slice 03, **already merged into the public PR #866**. |
| **S-06** | sweep `apikey-assign`, `supabase-env` | `.planning/milestones/v2.7-phases/67-default-seed-alliances/67-02-PLAN.md` | 166 | `${SUPA…[183 withheld]…81IU` | **The published Supabase CLI demo *service_role* key**, appearing as a shell default: `"apikey: ${SUPABASE_SERVICE_ROLE_KEY:-<demo key>}"` against `http://127.0.0.1:54321`. `iss supabase-demo`, `role service_role`, `exp 2032-11-11`. **Verifies against the same published demo secret** — recomputed and matched. This is the most powerful Supabase role, which is exactly why it was verified cryptographically rather than judged by appearance; being the public demo constant, it grants `service_role` only on an instance configured with the public secret, i.e. a local dev stack. |
| **S-07** | sweep `password-assign` | `…/trace-run-{1,2}.zip!resources/295c6c0b9d….json` (POST body) + 4 `.planning/` files incl. `79-…/post-fix/rca-traces/registration-rca.spec.ts:152` | 1, and 4 sites | `Prof…[11 withheld]…1!` (17 chars) | **Test-fixture registration password**, POSTed to `http://127.0.0.1:54321/auth/v1/signup?email=test.unregistered2%40openvaa.org`. Used by an RCA capture spec against the local stack. **This one is NOT already public** — it appears only under `.planning/`, in no tracked file outside it. Classified non-live because the account exists only in a local database and no cloud host appears in the corpus. **Residual risk is stated, not hidden — see § 5.** |
| **S-08** | sweep `password-assign` | 21 `.planning/` files (v1.0, v2.10, v2.14, and this phase's `151-DISPOSITION.md:1272`) | various | `Pass…[4 withheld]…1!` (10 chars) | **A documented public mock-data password, already published twice over.** It is `TEST_CANDIDATE_PASSWORD` at `tests/tests/utils/testCredentials.ts:44` — slice 05, **already public as PR #868** — whose own header comment records that the dataset "is seeded only against a local Supabase instance". It is also printed in the developers' guide at `apps/docs/…/backend/mock-data-generation/+page.md` as the default for `mock.candidate@openvaa.org` — slice 09, **already public as PR #872**. Publishing it again in `.planning/` discloses nothing new. |
| **S-09** | sweep `db-url-with-creds` | `78-05-PLAN.md:223`, `75-02a-SUMMARY.md:36,79,148`, `67-02-PLAN.md:157` | 5 sites | `postgr…[21 withheld]…res@` | **The documented local Supabase default connection string**, `postgresql://postgres:postgres@127.0.0.1:54322/postgres` — loopback, default port, default credentials that the Supabase CLI creates on every `supabase start`. Quoted inside `psql …` command lines in planning prose. Grants nothing off-host. |

### False positives — not credentials at all (5)

| # | Rule / detector | Where | Count | Why it is not a credential |
|---|---|---|---:|---|
| **S-10** | TruffleHog `Box` | `.planning/quick/260524-l1t-…/260524-l1t-PLAN.md:217,234` | 2 | The identifier **`dismissLeftoverDialogsBestEffort`** — **exactly 32 characters**, which is the Box detector's generic token shape. It is a declared function at `tests/tests/specs/voter/voter-journey.spec.ts:511`, quoted in prose about converting helpers to named arguments. |
| **S-11** | sweep `private-key-block` | `151-DISPOSITION.md:331`, `pr-bodies/02.md:108` | 2 | Prose **about** a PEM parser defect (finding F-14: `pem-to-jwk.ts` accepts `-----BEGIN ENCRYPTED PRIVATE KEY-----` then calls `importPKCS8`, which takes no passphrase). The match is the 37-character marker string quoted as documentation. **Verified there is no inline key material anywhere:** a grep for a `BEGIN … PRIVATE KEY` marker followed by base64 body returns **0** across the whole corpus. |
| **S-12** | sweep `long-hex` | 191 `.planning/` files (`sha256.txt`, `STATE.md`, milestone roadmaps and audits) | 254 | **All 254 are exactly 64 characters** — a single-valued length distribution, i.e. SHA-256 digests, recorded as determinism/content-hash evidence. No hex run of any other length matched. |
| **S-13** | sweep `long-base64` | 1,486 inside the two trace archives; 1,744 elsewhere | 3,230 | Trace-side hits are data URIs and trace payloads. Outside the archives the rule matches **file paths** (`/` is in the base64 alphabet — e.g. `apps/frontend/src/lib/…Store`), long camelCase identifiers, and the same SHA-256 digests as S-12. A deliberately high-noise rule, kept in the ruleset because narrowing it is how a real blob gets missed. |
| **S-14** | sweep `supabase-env`, `apikey-assign`; targeted greps | `78-06-PLAN.md`, `78-RESEARCH.md`, `73-REVIEW.md`, `136-05-SUMMARY.md`, `84-RCA-FINDINGS.md`, `45-*`, `46-*`, `48-*`, `122-*` | 62 distinct | **Environment-variable NAMES and references with no value**: `process.env.SUPABASE_SERVICE_ROLE_KEY`, `$SERVICE_ROLE_KEY`, `<service-role-key>`, `env.IDURA_SIGNING_JWKS ?? ''`. The `PUBLIC_*` ones are public by SvelteKit convention. Bank-auth values are documentation templates with elisions — `IDURA_SIGNING_JWKS='[{...private signing JWK...}]'`, `'[{"kty":"RSA","kid":"openvaa-signing-1","use":"sig","alg":"RS256",...}]'`. |

### Rules that matched nothing — 15 of 24, stated so coverage is legible

`pgp-key-block`, `ssh-private`, `aws-access-key-id`, `aws-secret`, `github-token`, `slack-token`,
`google-api-key`, `stripe-key`, `openai-anthropic`, `npm-token`, `sendgrid`, `twilio`,
`smtp-url-creds`, `authorization-hdr`, `signicat-oidc`.

**Bank-authentication signing material specifically: zero.** A search for JWK private components
(`"d"`, `"p"`, `"q"`, `"dp"`, `"dq"`, `"qi"` bound to a ≥20-character value) returns **0** across
the corpus, and the only three `"kty":"RSA"` occurrences are the elided documentation templates in
S-14. This mattered enough to check on its own because `docs/key-generation.md` exists in this
repository precisely to explain generating those keys.

## 4. Why two methods, and what the second one caught that the first did not

**TruffleHog reported 13 findings covering 2 distinct JWTs. The independent sweep found 4 distinct
JWTs.** The two it added are the demo `anon` key (S-05, 14 occurrences) and the demo `service_role`
key (S-06) — TruffleHog's JWT detector did not surface either. They turned out to be public
constants, but *that conclusion required finding them first*, and a single-scanner run would have
published a `service_role`-shaped token without ever classifying it.

The sweep also found the session cookies (S-03/S-04) and their refresh tokens, which no detector
flagged because the credential is base64-inside-a-cookie-value rather than a recognised token shape.

**This is the phase's recurring lesson applied to its highest-stakes check:** an enumeration is only
as complete as its key, and a scanner's clean result is a statement about its ruleset, not about the
content.

## 5. What this scan does NOT cover — the claim most likely to be silently false

1. **Anything committed to slice 11 after `6f04fa023`.** Slice 11's pathspec is
   `.planning .claude .agents CLAUDE.md`, and *every plan writes `.planning/` files* — including
   this one. This record, `pr-bodies/10.md`, the manifest edits and `151-17-SUMMARY.md` are all
   **outside this scan**, as is everything plans 151-18 and 151-19 write. **Slice 11 must be re-cut
   and the delta re-scanned before it is pushed.** Plan 151-18 owns that; it is recorded in the
   stack manifest's frontmatter as `slice_11_must_be_recut_before_push: true`.
2. **No optical character recognition was performed.** The two trace archives contain **107 JPEG
   and 2 PNG screenshots** of the application under test. A credential rendered as pixels — in a
   form field, a devtools panel, a terminal capture — would not be found by either method. The app
   under test was the local VAA with seeded data, so the exposure is judged low, but it is a real
   limit and it is named rather than assumed away.
3. **Slices 01a through 10 were not re-scanned here.** They are already public (PRs #863–#872).
   S-05 was found to be already published via PR #866; no attempt was made to scan those slices
   exhaustively, because this plan's control is scoped to the slice nobody reads.
4. **`.env` itself is untracked and out of scope** — but planning documents *quoting* one were in
   scope and were scanned; see S-14.
5. **Non-secret sensitive content was not assessed.** Fifteen milestones of decisions, cost figures,
   post-mortems and waiver records ship deliberately per D-12. That is a disclosure decision, not a
   secret-scanning one, and it belongs to the operator at Task 3.
6. **PII-shaped content is present and is not a credential:** the test account
   `test.unregistered2@openvaa.org` and two user UUIDs appear in the trace archives.
   `@openvaa.org` is a real domain; the local addresses used elsewhere are `@test.openvaa.local`.

### The one residual risk worth the operator's attention

**S-07 (`Prof…[11 withheld]…1!`) is the only credential-shaped literal in this slice that is not already
public and is not a documented constant.** Every in-repo signal says it is inert: it is a test
fixture, POSTed to a loopback URL, for an account created in a local database on 2026-05-12 that has
been reset many times since, and **no cloud Supabase host appears anywhere in the 2,325 files**.

What no in-repo measurement can see is whether an account with that email and password exists on a
deployed staging or production instance. This is the same shape of residual risk the operator
accepted knowingly for the Capacitor removal, and it is stated here in the same terms so it can be
objected to on the strength of this text alone. **Recommendation: accept.** The alternative —
rewriting fifteen milestones of planning history to strip a test password — is disproportionate to a
fixture that a `db:reset` already invalidated, provided the operator can confirm the credential was
never reused off-localhost.

## 6. Ruleset `gsd-151-17` v1 — the 24 rules, verbatim

Recorded in full so a sceptic can re-run the sweep, or fault it, without reconstructing it from
prose. Every rule is applied per line to every file, and to every member of every `.zip`.

| rule | pattern (Python `re`, bytes) |
|---|---|
| `private-key-block` | `-----BEGIN[ A-Z]*PRIVATE KEY-----` |
| `pgp-key-block` | `-----BEGIN PGP PRIVATE KEY BLOCK-----` |
| `ssh-private` | `-----BEGIN OPENSSH PRIVATE KEY-----` |
| `jwt` | `eyJ[A-Za-z0-9_-]{8,}\.[A-Za-z0-9_-]{8,}\.[A-Za-z0-9_-]{8,}` |
| `aws-access-key-id` | `\b(?:AKIA\|ASIA\|AGPA\|AIDA\|AROA\|ANPA)[A-Z0-9]{16}\b` |
| `aws-secret` | `(?i)aws_secret_access_key\s*[=:]\s*["\']?([A-Za-z0-9/+=]{40})` |
| `github-token` | `\b(?:ghp\|gho\|ghu\|ghs\|ghr)_[A-Za-z0-9]{36,}\b\|\bgithub_pat_[A-Za-z0-9_]{60,}\b` |
| `slack-token` | `\bxox[baprs]-[A-Za-z0-9-]{10,}\b` |
| `google-api-key` | `\bAIza[0-9A-Za-z_-]{35}\b` |
| `stripe-key` | `\b(?:sk\|rk)_live_[0-9A-Za-z]{20,}\b` |
| `openai-anthropic` | `\bsk-(?:ant-)?[A-Za-z0-9_-]{20,}\b` |
| `npm-token` | `\bnpm_[A-Za-z0-9]{36}\b` |
| `sendgrid` | `\bSG\.[A-Za-z0-9_-]{22}\.[A-Za-z0-9_-]{43}\b` |
| `twilio` | `\bSK[0-9a-fA-F]{32}\b` |
| `db-url-with-creds` | `(?i)\b(?:postgres(?:ql)?\|mysql\|mongodb(?:\+srv)?\|redis\|amqp)://[^\s:@/"\']{1,64}:[^\s:@/"\']{1,128}@` |
| `smtp-url-creds` | `(?i)\bsmtps?://[^\s:@/"\']{1,64}:[^\s:@/"\']{1,128}@` |
| `authorization-hdr` | `(?i)authorization["\']?\s*[:=]\s*["\']?(?:bearer\|basic)\s+([A-Za-z0-9._~+/=-]{16,})` |
| `bearer-token` | `(?i)\bbearer\s+([A-Za-z0-9._~+/=-]{24,})` |
| `apikey-assign` | `(?i)\b(?:api[_-]?key\|apikey\|access[_-]?token\|auth[_-]?token\|secret[_-]?key\|client[_-]?secret\|private[_-]?key\|service[_-]?role[_-]?key\|jwt[_-]?secret\|session[_-]?secret\|encryption[_-]?key\|signing[_-]?key)["\']?\s*[:=]\s*["\']?([^\s"\',;)}]{12,})` |
| `password-assign` | `(?i)\b(?:password\|passwd\|pwd\|db[_-]?pass)["\']?\s*[:=]\s*["\']?([^\s"\',;)}]{8,})` |
| `supabase-env` | `\bSUPABASE_[A-Z_]*(?:KEY\|SECRET\|TOKEN\|PASSWORD)\b\s*[:=]\s*["\']?([^\s"\',;)}]{8,})` |
| `signicat-oidc` | `(?i)\b(?:SIGNICAT\|IDURA\|OIDC)_[A-Z_]*(?:SECRET\|KEY\|TOKEN\|PASSWORD)\b\s*[:=]\s*["\']?([^\s"\',;)}]{8,})` |
| `long-hex` | `\b[0-9a-fA-F]{64,}\b` |
| `long-base64` | `\b[A-Za-z0-9+/]{60,}={0,2}\b` |

Raw hit counts by rule, for reproduction: `apikey-assign` 710, `bearer-token` 12,
`db-url-with-creds` 5, `jwt` 29 (4 distinct), `long-base64` 3230, `long-hex` 254,
`password-assign` 19 (13 distinct values), `private-key-block` 2, `supabase-env` 10; the other 15
rules zero.

## 7. Decision owed

`findings_live: 0`, so the plan's hard stop does not fire and Task 3's `remove-and-rescan` is not
the forced answer. **The decision is nevertheless the operator's**, and it covers three things:

1. the nine accepted classifications, particularly **S-07**, the only non-public credential-shaped
   literal (§ 5);
2. the named coverage limits, particularly **no OCR over 109 screenshots** and **the re-scan
   obligation on everything committed after `6f04fa023`**;
3. **the deliberate publication of fifteen milestones of planning artifacts** to a public
   repository — D-12's intent, and worth one moment of consent rather than none.

---

*Phase: 151-ship-v0-2-akita-review-stack · Plan 17 · scan executed 2026-08-17, before any push*
