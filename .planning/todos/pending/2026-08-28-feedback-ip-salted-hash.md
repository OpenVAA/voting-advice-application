---
created: "2026-08-28T00:00:00.000Z"
title: The feedback rate limiter stores the raw client IP address in the clear as a primary key
area: security
severity: medium
source: Phase 156 (supabase-schema-corrections) criterion 8 / REVIEW-DB-08 item 5 and decision D-E6 — dispositioned ANSWERED-ON-THE-RECORD in 156-DISPOSITIONS.md Entry 5, implementing nothing
files:
  - apps/supabase/supabase/schema/107-feedback.sql
  - apps/supabase/supabase/migrations/00001_initial_schema.sql
related_phase: 162
---

## Problem

`private.feedback_rate_limits.ip_address` is `text PRIMARY KEY`
(`apps/supabase/supabase/schema/107-feedback.sql:14`) and holds the client's address verbatim. That
is personal data at rest, retained indefinitely — nothing prunes the table — for every anonymous
visitor who submits feedback. The table is in the `private` schema and so is not exposed through
PostgREST, which limits reach but does not change what is stored.

The address is not incidental storage; it is the rate-limit mechanism, which is why hashing it is
not a one-line change. Measured in `107-feedback.sql`:

| Line | What is there |
|---|---|
| `:52-58` | the address extracted by `SPLIT_PART` from the `x-forwarded-for` header |
| `:55` | the `'unknown'` fallback when that header is absent |
| `:59` | `TRIM` on the extracted value |
| `:62` | `pg_advisory_xact_lock(hashtext('feedback_rate:' \|\| p_client_ip))` |
| `:65` | the `INSERT … ON CONFLICT (ip_address) DO UPDATE` maintaining the 5-per-5-minutes counter |

Four consequences follow, and each is a semantic change to the rate-limit bucket rather than a
storage change:

1. The address is the **primary key**, so replacing what is stored is a data migration, not a column
   edit.
2. The **`'unknown'` fallback** means every header-less client already shares a single bucket.
   Hashing does not fix that and must not be described as if it does.
3. The **`TRIM`** means whitespace normalisation has to happen before hashing, or two spellings of
   one address become two buckets.
4. The **advisory lock is derived from the same value**. Hash the input and the lock key changes
   too — correct, but the serialisation and the counter must change together or the lock stops
   protecting the row it exists to protect.

## Solution

TBD — the recommendation Phase 156 recorded, plus the alternatives it weighed:

- **Salted hash as the rate-limit key.** Store `hash(salt || normalised_address)` in place of the
  address. The salt is a **per-deployment secret held in the deployment's own secret store** —
  injected as a database setting or a Vault entry and read at runtime. **No salt value may be
  written into a migration, a seed file, this register or any other tracked file**; the repository
  forbids committing secrets, and an "example" value in a planning artifact is the value someone
  copies. Hashing is deterministic within a deployment, so the 5-per-5-minutes behaviour is
  preserved; the lock derivation and the upsert key must be changed in the same commit, with a test
  covering the counter, the window reset and the `unknown` path.
- **Truncate the last octet — rejected, recorded so it is not re-proposed.** Still PII-adjacent, and
  it collapses more distinct clients into shared rate-limit buckets, worsening the underlying
  finding instead of closing it.
- **A retention window** deleting rows past the rate-limit horizon. Complementary rather than
  alternative, and cheap enough to do regardless of which key form is chosen — an expired counter
  row has no function, so retaining it is pure exposure.
- Decide whether the change lands as part of the permissions and auth model refactor or ahead of it;
  the table is untouched by that refactor's own scope, so it can move independently.
