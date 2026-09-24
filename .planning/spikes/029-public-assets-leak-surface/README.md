---
spike: 029
idea: grant-model-read-cost
name: public-assets-leak-surface
type: comparison
validates: "Given public-assets downloads bypass RLS (spike 027), when every way an object path can become known or stay valid is probed as anon, then we know whether random UUID file names keep leakage rare, and what the alternatives cost"
verdict: VALIDATED
related: [027]
tags: [storage, security, privacy, pg_net, phase-162.1]
---

# Spike 029: How Leaky Is `public-assets`, and What Fixes It

## RESULT IN ONE PARAGRAPH

**Random UUID file names (the operator's candidate) already exist, and they work for what they protect.**
`supabaseDataWriter.#uploadCandidateFile` names every upload `<project>/candidates/<id>/<crypto.randomUUID()>.<ext>`.
A file that was **never public** cannot be found: anon cannot list the folder, the path appears in no API
response, and 122 random bits cannot be guessed. **But the probe found a real, pre-existing defect that
defeats the rest: `delete_storage_object` has never deleted anything.** It sends `POST` to Storage's bulk
delete route, which only accepts `DELETE`, and gets `404 Route POST:/object/public-assets not found`.
So **replaced photos and deleted candidates' photos stay online forever** under URLs that were public.
The recommendation is **C1+: keep random names, fix the delete (verified working), extend cleanup to
answer photos, and accept that an unpublished-but-once-public URL stays valid.** Making the bucket
private (C2) would enforce the rule completely, but costs **+736 ms per Helsinki-sized page** and breaks
image caching.

## The Leak Surface, Probed (anon, `probe.mjs`)

| # | Scenario | Result | Leak? |
|---|---|---|---|
| S1a | List an **unpublished** candidate's folder | 0 objects (listing is policy-gated) | no |
| S1b | Read the unpublished candidate's row via REST | 0 rows, so no image path | no |
| S1c | Look for its path in `get_nominations` | absent | no |
| S1d | Guess the URL from the candidate id | a random name returns HTTP 400; 122 random bits | no |
| S1e | The URL, if known anyway | HTTP 200 (public bucket) | only if the URL escaped |
| **S2** | Candidate was public, **then unconfirmed** | 200 before, **200 after** | **yes** |
| **S2b** | …then the **project closed** to voters | **200** | **yes** |
| **S3** | Photo **replaced** in the `image` column | old URL **200** after 10 s: cleanup trigger fired, delete failed | **yes (bug)** |
| **S4** | Photo stored as an **answer**, replaced | no trigger covers `answers` (code read) | **yes (gap)** |
| **S5** | Candidate **deleted** | photo URL **200** after 10 s | **yes (bug)** |

**Reading it:** random names fully protect files that were never public (S1). Every leak is a file whose
URL **was legitimately public at some point** (S2) or should have been **deleted** (S3–S5).

## ⚠ Finding F4: Storage Cleanup Has Never Worked (pre-existing, not Phase 162)

`public.delete_storage_object` (400-storage.sql), called by `cleanup_old_image_file` and
`cleanup_entity_storage_files`, does:

```sql
net.http_post(url := base_url || '/storage/v1/object/' || p_bucket, body := {"prefixes": [path]}, …)
```

pg_net's own response log, from S3:

```
404 | {"message":"Route POST:/object/public-assets not found","error":"Not Found","statusCode":404}
```

The bug has been in place since the schema was introduced (`11f877913`, 2026-08-17). The call is async and
its failure is swallowed, so nothing ever reported it. Two separate problems:

1. **Wrong method.** The bulk route is `DELETE /object/{bucket}` with a body, and this pg_net (0.14) cannot
   send a body with `DELETE`. **Verified fix:** the single-object route `DELETE /object/{bucket}/{path}`
   needs no body. Called through `net.http_delete` it returned `200 {"message":"Successfully deleted"}`
   and the `storage.objects` row was gone.
2. **Folders are not objects.** `cleanup_entity_storage_files` passes a folder prefix
   (`<project>/<table>/<id>/`). Storage deletes exact object names, not prefixes, so even with the method
   fixed an entity's folder would survive. The fix must enumerate
   `storage.objects WHERE bucket_id = … AND name LIKE prefix || '%'` and delete each.

**Consequence today:** every replaced or deleted photo since launch is still stored **and still public**.

## Candidate Solutions

| | Candidate | Enforces "only public entities' files are readable"? | Cost | Complexity |
|---|---|---|---|---|
| **C1** | Random UUID names **(status quo)** | for never-public files only (S1). Replaced/deleted files leak through F4 | 0 | none |
| **C1+** | **C1 + fix F4 + cleanup for answer photos (S4)** | never-public files ✓, replaced ✓, deleted ✓. Once-public-then-unpublished (S2) still readable by URL | 0 on reads | small: two functions + one trigger |
| C2 | **Private bucket + signed URLs** | fully (RLS on every signature) | **+736 ms** to sign a Helsinki-sized page (1,500 photos, one batch, anon); URLs unique and expiring, so no browser/CDN image cache; residual (b)'s 6.4x becomes hot | large: every image render, SSR, cache strategy |
| C3 | Upload private, **copy to public on publish, delete on unpublish** | fully, including S2 | 0 on reads; a copy/delete at each publish-state change | medium: hooks on `confirmed`, nomination and `open_for_voters` changes; depends on F4 fixed |

### Measured cost of C2 (`sign-cost.mjs`)

| | value |
|---|---|
| sign 1,500 paths in one batch, as anon | **median 736 ms**, max 753 ms (5 runs after warm-up) |
| fetch one image through its signed URL | 4.4 ms |
| compare: the whole voter main read for that constituency (spike 026) | ~130 ms |

## Recommendation: C1+

1. **Keep random UUID names.** They already cover the case that matters most: something never meant to be
   public (an unconfirmed candidate's photo) cannot be found. Make dev-seed follow the same convention;
   it names portraits by seed filename, which is predictable (seed data only, but it sets the example).
2. **Fix F4.** Delete one object at a time through `DELETE /object/{bucket}/{path}` via `net.http_delete`,
   and turn a folder into its object list from `storage.objects` before deleting. Add a pgTAP or E2E check
   that **observes a file disappearing**. Its absence is how F4 went unnoticed.
3. **Extend cleanup to photos stored in `answers`** (S4).
4. **Accept S2 explicitly:** a file that was published was downloadable, and unpublishing cannot recall
   copies people already took. If the operator does not accept that, the answer is C3, not C2.

## How to Run

```bash
.planning/spikes/026-election-scale-entity-read/load.sh
eval "$(yarn workspace @openvaa/supabase exec supabase status -o env | grep -E '^(API_URL|ANON_KEY|SERVICE_ROLE_KEY)=')"
export API_URL ANON_KEY SERVICE_ROLE_KEY
node .planning/spikes/029-public-assets-leak-surface/probe.mjs
node .planning/spikes/029-public-assets-leak-surface/sign-cost.mjs
yarn db:reset
```

## Investigation Trail

1. The operator's candidate (random names) turned out to be the status quo for the one app upload path, so
   the spike became "is the status quo enough", probed scenario by scenario.
2. S3 was expected to pass because a cleanup trigger exists. It failed. pg_net's `_http_response` table
   showed the 404, which exposed F4.
3. Checked whether pg_net can send `DELETE` with a body: 0.14's `http_delete` takes no body. Tried the
   single-object route instead, and it works.
4. Reading `cleanup_entity_storage_files` showed the second half of F4 (folder prefixes); S5 confirmed it.
5. S4 was first attempted with a fake question id and rejected by `validate_answers_jsonb`. It was
   replaced by the code-read fact, since no trigger watches `answers`.
