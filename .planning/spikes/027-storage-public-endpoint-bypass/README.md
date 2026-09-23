---
spike: 027
idea: grant-model-read-cost
name: storage-public-endpoint-bypass
type: standard
validates: "Given the public = true public-assets bucket, when an object is fetched as anon with the anon SELECT policy forced to USING (false), then we learn whether the 6.4x policy is ever evaluated on the voter's image path"
verdict: VALIDATED
related: [025, 026]
tags: [storage, rls, grant-model, performance, security, phase-162.1]
---

# Spike 027: Does the Voter's Image Path Ever Evaluate the 6.4x Storage Policy?

## RESULT IN ONE PARAGRAPH

**No. The 6.4x cost is never paid on any path the application uses. Accept it.** `public-assets` is a
`public = true` bucket, and on a public bucket Supabase Storage serves downloads **without consulting
`storage.objects` RLS at all**. That holds for both download endpoints (`/object/public/…`, which the
voter app uses, and `/object/authenticated/…`). The anon SELECT policy, `storage_path_is_public`, the
function behind the 6.4x, is evaluated **only when an object list is requested** (`POST /object/list`),
and no application code lists `public-assets` as anon. **But the same measurement exposes something
more important than the cost:** the visibility rule that policy encodes (only confirmed, nominated
entities in open projects) **is not enforced on downloads.** Every object in `public-assets` is readable
by anyone who has, or can guess, its URL, including assets of unconfirmed candidates and of projects not
open for voters. That is a design fact the operator should see, recorded below as a finding, not a
fix.

## What Was Measured, and How

`probe.mjs` uploads a real image as `service_role` into a **visible** candidate's folder of Spike 026's
municipal fixture, then reads it as **anon** through every read endpoint, twice:

1. with the **shipped** policy (`anon_select_public_assets`, qual md5 `2c137e2b`);
2. with the policy **forced to `USING (false)`** (qual md5 `68934a3e`), which denies every row.

An endpoint whose answer does not change when the policy denies everything **does not consult the policy**.

`probe-fresh.mjs` then rules out caching. With the policy still at `false`, it uploads **never-seen**
objects, including two at paths the **shipped** policy would also deny (a candidate id that does not
exist, and a non-UUID path), and reads them. A **private-bucket** control shows RLS *is* enforced where
the bucket is private.

### Result table (anon reader)

| Endpoint | shipped policy | policy = `false` | consults the policy? |
|---|---|---|---|
| `GET /object/public/public-assets/…` **(voter app)** | 200 | **200** | **no** |
| `GET /object/authenticated/public-assets/…` | 200 | **200** | **no** |
| `GET /object/info/public/public-assets/…` | 200 | **200** | **no** |
| `POST /object/list/public-assets` | 1 object | **0 objects** | **yes, and only this one** |

### Caching ruled out: fresh objects, policy already `false`

| Fresh object | anon `/object/public` | anon `/object/authenticated` |
|---|---|---|
| visible candidate's folder | 200 | 200 |
| **nonexistent** candidate id (shipped policy would deny) | **200** | **200** |
| **garbage** non-UUID path (shipped policy would deny) | **200** | **200** |
| control: same object in the **private** bucket | 400 | 400 |

### Latency (shipped policy, 50 requests each, anon)

| Endpoint | median | p95 |
|---|---|---|
| `/object/public/…` | 3.0 ms | 5.6 ms |
| `/object/authenticated/…` | 3.0 ms | 4.5 ms |

Identical, as expected when neither evaluates the policy.

### What else reads storage in the codebase (searched)

| Caller | Operation | Role |
|---|---|---|
| `apps/frontend/.../utils/storageUrl.ts` | builds `/object/public/public-assets/…` URLs | none (plain GET) |
| `supabaseDataWriter.ts:290` | upload (candidate photo) | authenticated, INSERT policies, not the anon read |
| `packages/dev-seed/src/supabaseAdminClient.ts` | `list` / `remove` | **service_role**, which bypasses RLS |

**No application path lists `public-assets` as anon.** The policy's only consumer is a request nobody makes.

## Verdict for Residual (b): anon storage read, 6.4x

**ACCEPT.** The cost is real per evaluated row but lands only on `POST /object/list` as anon, which no
code path issues. Voters' image loads never evaluate it (3.0 ms median either way). No monitor is
needed for cost, because nothing to monitor runs through it.

## ⚠ Finding Beyond the Cost: the Visibility Rule Is Not Enforced on Downloads

This is **not a Phase 162 regression**. It is how Supabase public buckets work, and it was equally true
before the phase. But Phase 162 wrote a careful visibility rule for `public-assets` (D-27,
`storage_path_is_public`), and the rule **only gates listing**. Concretely, today:

- An **unconfirmed** candidate's uploaded portrait is downloadable by URL.
- Assets in a project with `open_for_voters = false` are downloadable by URL.
- Paths contain UUIDs, so URLs are hard to guess. But they are not secret: entity ids appear in
  API responses, so a caller who can see an id can build its asset URL.

Whether that matters is a product/privacy decision, not a performance one. Options for the operator,
not evaluated here:

1. **Accept** as "public-assets means public once uploaded" and document it next to D-27.
2. Make `public-assets` **private** and serve through signed URLs or `/object/authenticated/`, at
   which point the policy **is** enforced and its 6.4x cost **does** land on every image fetch.
   **That would turn residual (b) from unreachable into hot**, so the two questions are coupled.
3. Move unconfirmed/closed-project uploads to `private-assets` until publication.

## How to Run

```bash
eval "$(yarn workspace @openvaa/supabase exec supabase status -o env | grep -E '^(API_URL|ANON_KEY|SERVICE_ROLE_KEY)=')"
export API_URL ANON_KEY SERVICE_ROLE_KEY
.planning/spikes/026-election-scale-entity-read/load.sh      # fixture the probe uploads into
node .planning/spikes/027-storage-public-endpoint-bypass/probe.mjs
node .planning/spikes/027-storage-public-endpoint-bypass/probe-fresh.mjs
yarn db:reset                                                  # restores the policy and removes the fixture
```

The probe deliberately leaves the policy perturbed; `yarn db:reset` restores the committed schema.

## Investigation Trail

1. Hypothesis from the Supabase docs: public buckets bypass access control for downloads. Not taken on trust.
2. First probe: `/object/public` unaffected by a deny-all policy, `list` affected, which confirms the
   perturbation applied. **Surprise:** `/object/authenticated` was *also* unaffected.
3. The surprise could have been an authorization cache. `probe-fresh.mjs` used never-seen objects,
   including paths the shipped policy denies, and got 200 on both endpoints. The private-bucket
   control got 400. Conclusion: bucket publicity, not caching, decides the download.
4. Searched Phase 162's records for any mention of the bypass: none. This is new information.

## Sources

- [Supabase Storage Access Control](https://supabase.com/docs/guides/storage/security/access-control)
- [Supabase Storage Buckets: fundamentals](https://supabase.com/docs/guides/storage/buckets/fundamentals)
