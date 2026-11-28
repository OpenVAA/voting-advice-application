# Phase 184: Hosted Supabase Measurement and Conformance Probe - Discussion Log

> **Audit trail only.** Do not use as input to planning, research, or execution agents.
> Decisions are captured in CONTEXT.md — this log preserves the alternatives considered.

**Date:** 2026-10-26
**Phase:** 184-hosted-supabase-measurement-and-conformance-probe
**Areas discussed:** A Order and targets, B Functions/secrets/mail, C Bootstrap/gateway/keys, D Probe, E Records and carry-overs
**Format:** a one-pass checkbox document (`184-DISCUSSION-POINTS.md`), per the standing preference. An unticked
decision takes its ★ RECOMMENDED option. The full option text, with what each alternative costs, is in that
document.

---

| ID | Question | Options offered | Selected |
|----|----------|-----------------|----------|
| A-01 ⚠ | Which project goes first | ★ throwaway first, every step / persistent first for push+functions+bootstrap / persistent only | ★ (unticked) |
| A-02 | SUPA-01's "one command" | ★ `push-migrations.sh` wrapper / bare `db push` in runbook / one `deploy-supabase.sh` | ★ (unticked) |
| A-03 | DB connection from the workstation | ★ direct first, session pooler fallback / session pooler always / IPv4 add-on | ★ (unticked) |
| B-01 | `identity-callback` without bank auth | ★ deploy without IdP secrets, must fail closed / deploy with Idura test client / don't deploy | ★ (unticked) |
| B-02 | SES port measurement | ★ real `account-access` send, 2587→587→465→25 / connect-only probe function | ★ (unticked) |
| B-03 | DKIM/SPF/DMARC reading | ★ operator pastes mailbox headers / external mail tester | ★ (unticked) |
| B-04 | Auth's own SMTP setting | ★ apply anyway and read back / leave null and reword SUPA-02 | ★ (unticked) |
| C-01 | `behind_cloudflare` | ★ measure first on throwaway / set `true` from docs | ★ (unticked) |
| C-02 ⚠ | Gateway refuses anon-key call | ★ measure, then `verify_jwt = false` for `account-access` / frontend sends Bearer anon key / record only | ★ (unticked) |
| C-03 | Bootstrap vs parameter logging | ★ seven `SHOW`s first, checkpoint if unsafe / run anyway and rotate | ★ (unticked) |
| C-04 | Signed-in token check | ★ first administrator on persistent + disposable user on throwaway / throwaway only | ★ (unticked) |
| C-05 | No legacy keys or near retirement | ★ record, stay on legacy if they work, checkpoint if not / move to publishable now | ★ (ticked) |
| D-01 | Probe language | ★ Node built-ins + Vitest / Bash+curl+jq+psql | ★ (unticked) |
| D-02 | Probe sources and credentials | ★ Management API + anon public API + read-only psql, never service role / add service role | ★ (unticked) |
| D-03 | Probe contents | ★ criterion-2 settings, oauth flags, buckets, functions, hooks, >1000 rows, timeout, PG17, `no-seed`; drift separate / drift inside probe | ★ (unticked) |
| D-04 | Expected values source | ★ parity guard's files / probe's own table | ★ (unticked) |
| D-05 | Seeing every check fail | ★ one batched break / one break per run / groups of 3-4 | ★ (unticked) |
| D-06 ⚠ | >1000 rows on persistent | ★ seed E1 dataset once in 184, no auth users / throwaway only / defer to 185 | ★ (unticked) |
| D-07 | Header record | ★ throwaway only, hand-made temporary functions / persistent via appended migration | ★ (unticked) |
| E-01 ⚠ | Where observations live | ★ evidence files + "Observed" table in staging supabase README / evidence only / new `infra/OBSERVATIONS.md` | ★ (unticked) |
| E-02 ⚠ | 183 security items | ★ re-transfer all four to 187 / settle in 184 | ★ (unticked) |
| E-03 | Drift check linked | ★ planted DDL red control on throwaway, schema-set check, PG* ref check / trust local red | ★ (unticked) |
| E-04 | Throwaway at phase end | ★ operator deletes it / keep until 187 | ★ (unticked) |
| E-05 | Keyword-matched todos | ★ fold none / fold named ones | ★ (unticked) |

**Operator note under C-05:** "Add the todo to be executed immediately after the streams are merged."
Resolution: the FUT-02 todo already exists
(`.planning/todos/pending/2026-10-11-migrate-to-supabase-publishable-keys-after-streams-merge.md`) and is
already queued as the first work after both streams merge. This phase appends the observed key model and any
retirement date to it, rather than filing a duplicate.

**Free-text "anything else" note:** left empty.

## Claude's Discretion

Plan split and waves (within D-01's order), the probe's module layout and check names, the wording of evidence
and of the "Observed" rows.

## Deferred Ideas

FUT-02 (publishable keys) after the merge; the four 183 security items in 187; the frontend container's header
record in 185.
