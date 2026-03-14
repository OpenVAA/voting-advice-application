# Phase 12: Services - Research

**Researched:** 2026-03-14
**Domain:** Supabase Storage, Email, Bulk Data Operations (RPC), Edge Functions
**Confidence:** HIGH

## Summary

Phase 12 implements four distinct service capabilities on the existing Supabase schema: (1) Storage buckets with RLS for entity photo upload/serve, (2) dev email capture via Inbucket (already running), (3) bulk import/delete RPC functions with transactional guarantees, and (4) transactional email via Edge Function. All four build directly on the existing Phase 10 auth/RLS infrastructure and Phase 9 schema.

The most architecturally complex piece is the bulk import RPC function, which must replicate Strapi admin-tools behavior (collection-keyed JSON with externalId-based upsert and relationship resolution) inside a single Postgres transaction. The storage cleanup triggers require careful implementation using `pg_net` for async HTTP calls to the Storage API -- direct SQL deletion of `storage.objects` rows orphans actual files. The email Edge Function follows the established Deno pattern from `invite-candidate` but adds multilingual template resolution via a Postgres RPC helper.

**Primary recommendation:** Implement as four independent SQL/function modules (storage schema + RLS, bulk import RPC, bulk delete RPC, email Edge Function), each testable in isolation before integration.

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions
- Two buckets: `public-assets` (anon-readable) and `private-assets` (auth-required)
- Public bucket only serves files for published entities -- unpublished entity files stay private until published
- Use Supabase Storage (not AWS S3) -- RLS integration, no extra credentials, works locally out of the box
- Project-scoped paths: `{project_id}/{entity_type}/{entity_id}/filename.ext`
- Project-level public files (images, videos, PDFs) stored under `{project_id}/project/` path
- Permissive file types -- trust project admins. Higher max size for videos (500MB)
- Write/delete permissions tied to the user and the entities (candidates/organizations) they control via user_roles
- DB trigger cleanup: when an entity is deleted, its storage files are automatically removed
- DB trigger on image column update: when an image JSONB column is updated, the old file is deleted from storage
- `external_id` column added to all content tables -- optional (nullable), unique when present
- Research whether `external_id` should be immutable once set
- ExternalId-based upsert: records matched by external_id for idempotent create-or-update
- Bulk delete supports both modes: (1) externalId prefix-based and (2) explicit ID list
- ExternalId-based relationship resolution: import JSON expresses relationships as externalIds, RPC resolves to UUIDs internally
- All content tables supported for bulk operations
- Transactional guarantee: entire import/delete fully succeeds or fully rolls back
- Postgres RPC function (not Edge Function) for bulk operations -- runs in-database for performance and atomicity
- Generic email API -- not candidate-specific, reusable for any notification scenario
- Frontend sends multilingual templates (all locales) + recipient userIds to Edge Function
- Server-side variable resolution via Postgres RPC: joins user_roles -> entity tables -> relationships
- User's preferred locale stored in `auth.users.raw_user_meta_data`
- Edge Function picks the correct locale template per recipient
- Dry-run flag: `dry_run=true` returns rendered content per recipient without sending
- Dev: emails captured by Inbucket (already running on port 54324)
- Production: configurable SMTP/provider (not implemented in this phase, just the interface)
- Separate `StoredImage` type for database JSONB: `{path, pathDark?, alt?, width?, height?, focalPoint?: {x: 0-1, y: 0-1}}`
- Frontend Supabase adapter maps `StoredImage` -> `Image` (resolving paths to full Supabase Storage URLs) -- done in future adapter phase
- On-the-fly image transforms via Supabase URL parameters (Pro plan in production; dev serves originals)
- Focal point as relative coordinates (x: 0.0-1.0, y: 0.0-1.0)
- Image question answers use the same `StoredImage` format
- `validate_answer_value()` trigger updated to validate StoredImage structure for image-type questions

### Claude's Discretion
- Exact RLS policy SQL for storage buckets (read/write/delete per role)
- DB trigger implementation for storage cleanup (direct delete vs queue-based)
- RPC function internal structure (processing order, error handling, batch sizes)
- Edge Function email sending implementation (Deno SMTP client or fetch-based)
- How to handle the published flag transition (moving files between private/public buckets vs. RLS-only approach)
- StoredImage validation trigger details

### Deferred Ideas (OUT OF SCOPE)
None -- discussion stayed within phase scope
</user_constraints>

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|-----------------|
| SRVC-01 | Supabase Storage buckets configured for candidate photos, party images, and public assets with RLS | Storage bucket config in config.toml + RLS policies on storage.objects table using helper functions |
| SRVC-02 | Candidate photo upload and serve works via Supabase Storage API | StoredImage JSONB type, upload RLS policies, public URL serving via getPublicUrl/createSignedUrl |
| SRVC-03 | Mailpit accessible at localhost for dev email with human-readable web UI | Already running at port 54324 (Inbucket); SMTP at 54325; Edge Function connects via Docker internal network |
| SRVC-04 | Bulk data import via Postgres RPC function with transactional guarantee | PostgREST wraps RPC in transaction; SECURITY INVOKER plpgsql function with external_id upsert logic |
| SRVC-05 | Bulk data delete via Postgres RPC function with transactional guarantee | Same transactional RPC pattern; prefix-based and explicit ID list modes |
| SRVC-06 | Transactional email for non-auth flows via Edge Function | Deno Edge Function using nodemailer npm package; connects to Inbucket SMTP locally; Postgres RPC for template variable resolution |
</phase_requirements>

## Standard Stack

### Core
| Library/Tool | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| Supabase Storage | Built-in | File storage with RLS | Already enabled in config.toml; integrates with auth |
| pg_net | Built-in extension | Async HTTP from triggers | Required for storage cleanup triggers; non-blocking |
| nodemailer | 6.9.x (npm:) | SMTP email sending in Deno | Official Supabase example; works with Inbucket locally |
| @supabase/supabase-js | 2.x | Edge Function client | Already used in invite-candidate and signicat-callback |
| plpgsql | Built-in | RPC function language | Used throughout existing schema for triggers/functions |

### Supporting
| Library/Tool | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| Inbucket | Built-in (Supabase local) | Dev email capture | Always active on port 54324 (web UI) / 54325 (SMTP) |
| Supabase Vault | Built-in | Secret storage | Store service_role_key for pg_net trigger calls |
| storage.foldername() | Built-in helper | Path parsing in RLS | Extracting project_id/entity_type from storage paths |
| storage.filename() | Built-in helper | Filename extraction | RLS policies checking file ownership |
| storage.extension() | Built-in helper | Extension extraction | Validation in RLS policies |

### Alternatives Considered
| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| pg_net (async) for cleanup | http extension (sync) | pg_net is non-blocking in triggers, http would block the DELETE transaction |
| nodemailer SMTP | Resend/SendGrid API | SMTP works with Inbucket locally without external API keys; production can swap provider |
| RLS-only approach for published | Moving files between buckets | RLS-only is simpler -- no file copying needed on publish/unpublish; recommended |

## Architecture Patterns

### Recommended Schema File Structure
```
apps/supabase/supabase/schema/
  014-storage.sql           # Bucket RLS policies, cleanup triggers
  015-external-id.sql       # external_id columns on all content tables
  016-bulk-operations.sql   # bulk_import() and bulk_delete() RPC functions
apps/supabase/supabase/functions/
  send-email/index.ts       # Transactional email Edge Function
```

### Pattern 1: Storage RLS with Project-Scoped Paths
**What:** RLS policies on `storage.objects` use `storage.foldername()` to extract project_id from the file path and check against JWT role claims.
**When to use:** All storage access control.
**Example:**
```sql
-- Source: Supabase Storage Access Control docs + project RLS pattern from 010-rls.sql
-- Path format: {project_id}/{entity_type}/{entity_id}/filename.ext

-- Public bucket: anon can read files for published entities
CREATE POLICY "anon_select_public_assets" ON storage.objects FOR SELECT TO anon
  USING (
    bucket_id = 'public-assets'
  );

-- Authenticated upload: must have write access to the entity
CREATE POLICY "authenticated_insert_public_assets" ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (
    bucket_id = 'public-assets'
    AND (SELECT can_access_project((storage.foldername(name))[1]::uuid))
  );

-- Candidate can upload to their own folder
CREATE POLICY "candidate_insert_own_assets" ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (
    bucket_id = 'private-assets'
    AND (storage.foldername(name))[2] = 'candidate'
    AND EXISTS (
      SELECT 1 FROM candidates c
      WHERE c.id = (storage.foldername(name))[3]::uuid
        AND c.auth_user_id = (SELECT auth.uid())
    )
  );
```

### Pattern 2: Storage Cleanup via pg_net (Async HTTP)
**What:** Database triggers call the Supabase Storage API via `pg_net` to delete actual files when entity rows or image columns change. Direct deletion from `storage.objects` table MUST NOT be used -- it orphans files in the underlying S3 storage.
**When to use:** Entity deletion and image column updates.
**Critical pitfall:** The `pg_net` requests don't execute until the transaction commits, which is actually the desired behavior for cleanup triggers (files only deleted if the DB change succeeds).
**Example:**
```sql
-- Source: pg_net docs + community patterns from supabase/discussions/7067
CREATE OR REPLACE FUNCTION delete_storage_file(bucket text, file_path text)
RETURNS void
LANGUAGE plpgsql SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  base_url text;
  service_key text;
BEGIN
  -- Retrieve from vault (or environment in local dev)
  base_url := current_setting('app.supabase_url', true);
  service_key := current_setting('app.service_role_key', true);

  IF base_url IS NULL OR service_key IS NULL THEN
    RAISE WARNING 'Storage cleanup skipped: missing app.supabase_url or app.service_role_key';
    RETURN;
  END IF;

  PERFORM net.http_delete(
    url := base_url || '/storage/v1/object/' || bucket || '/' || file_path,
    headers := jsonb_build_object(
      'Authorization', 'Bearer ' || service_key,
      'Content-Type', 'application/json'
    )
  );
END;
$$;
```

### Pattern 3: Transactional Bulk Import RPC
**What:** A single `bulk_import(data jsonb)` Postgres function that processes collection-keyed JSON, resolves externalId relationships, and performs upserts. PostgREST automatically wraps the entire RPC call in a transaction.
**When to use:** Admin data import operations.
**Key insight:** PostgREST wraps all POST RPC calls in a read/write transaction. If ANY statement inside the function raises an exception, the entire transaction is rolled back automatically. No explicit BEGIN/COMMIT/ROLLBACK needed.
**Example:**
```sql
-- Source: PostgREST transactional RPC behavior + Strapi admin-tools data.ts pattern
CREATE OR REPLACE FUNCTION bulk_import(data jsonb)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY INVOKER  -- Uses caller's RLS context (admin)
AS $$
DECLARE
  collection_name text;
  collection_data jsonb;
  item jsonb;
  result jsonb := '{}'::jsonb;
  created_count integer;
  updated_count integer;
BEGIN
  FOR collection_name, collection_data IN SELECT * FROM jsonb_each(data)
  LOOP
    created_count := 0;
    updated_count := 0;
    FOR item IN SELECT * FROM jsonb_array_elements(collection_data)
    LOOP
      -- Resolve external_id references, upsert record
      -- (Implementation details in the actual function)
    END LOOP;
    result := result || jsonb_build_object(
      collection_name, jsonb_build_object('created', created_count, 'updated', updated_count)
    );
  END LOOP;
  RETURN result;
END;
$$;
```

### Pattern 4: Email Edge Function with Template Resolution
**What:** Edge Function receives multilingual templates + recipient userIds, calls a Postgres RPC to resolve template variables per recipient (joining user_roles -> entities -> relationships), selects the correct locale, and sends via SMTP.
**When to use:** Any non-auth transactional email (candidate notifications, admin messages).
**Example:**
```typescript
// Source: Supabase Edge Function email examples + invite-candidate pattern
import nodemailer from 'npm:nodemailer@6.9.10';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

// For local dev, connect to Inbucket SMTP
const transport = nodemailer.createTransport({
  host: Deno.env.get('SMTP_HOST') || 'inbucket',  // Docker service name
  port: parseInt(Deno.env.get('SMTP_PORT') || '2500'),
  secure: false,
  // No auth needed for Inbucket
});
```

### Anti-Patterns to Avoid
- **Direct SQL deletion on storage.objects:** Orphans actual files in S3 storage. ALWAYS use the Storage API via `pg_net` or SDK.
- **Synchronous HTTP in triggers (http extension):** Blocks the transaction; use `pg_net` for async non-blocking calls.
- **SECURITY DEFINER on bulk import RPC:** Would bypass RLS, defeating authorization. Use SECURITY INVOKER so the admin's JWT claims are checked.
- **Edge Function for bulk import:** Would lose transactional atomicity and add network latency; Postgres RPC runs in-database.
- **Hardcoding service_role_key in functions:** Use `pg_net` with vault secrets or Postgres custom settings (`app.service_role_key`).

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| File storage + auth | Custom S3 integration | Supabase Storage | RLS integration, local dev support, SDK support |
| Storage path parsing | Custom regex in policies | `storage.foldername()`, `storage.filename()`, `storage.extension()` | Built-in helpers optimized for RLS |
| Async HTTP from DB | Custom HTTP client in plpgsql | `pg_net` extension | Non-blocking, transaction-aware, built-in |
| Email SMTP | Custom TCP/socket implementation | nodemailer via `npm:nodemailer` | Battle-tested, Deno-compatible via npm prefix |
| Transaction management in RPC | Manual BEGIN/COMMIT/ROLLBACK | PostgREST auto-wrapping | PostgREST wraps all POST RPC calls in transactions automatically |
| JWT claim parsing in RPC | Custom JWT decode | `auth.jwt()`, `auth.uid()` | Built-in Supabase auth helpers, already used in 79 RLS policies |

**Key insight:** PostgREST automatically wraps all RPC POST calls in a transaction. A function that raises an EXCEPTION will cause the entire transaction to roll back. This eliminates the need for explicit transaction management in the bulk import/delete functions.

## Common Pitfalls

### Pitfall 1: Orphaned Storage Files
**What goes wrong:** Deleting rows from `storage.objects` via SQL removes metadata but leaves actual files in the underlying S3 storage, consuming storage space permanently.
**Why it happens:** The `storage.objects` table is metadata only; the actual file lives in the storage provider.
**How to avoid:** ALWAYS delete files via the Storage API (REST endpoint or SDK). From database triggers, use `pg_net` to call the Storage API asynchronously.
**Warning signs:** Files still accessible at old URLs after entity deletion; storage usage grows without corresponding object count.

### Pitfall 2: pg_net Requests and Transaction Timing
**What goes wrong:** pg_net HTTP requests don't execute until the transaction commits. If the transaction rolls back, the HTTP request is never sent.
**Why it happens:** pg_net uses unlogged tables and processes requests after commit.
**How to avoid:** For cleanup triggers, this is actually desirable (files only deleted if the DB change succeeds). But for critical notifications, consider using Edge Functions invoked from the application layer instead.
**Warning signs:** Files not being cleaned up during development when transactions are rolling back for other reasons.

### Pitfall 3: RLS on storage.objects Requires Explicit Policies
**What goes wrong:** Uploads fail silently with "not authorized" errors even though content table RLS works fine.
**Why it happens:** Storage RLS policies are on `storage.objects` table (in the `storage` schema), completely separate from content table policies. No policies = no access by default.
**How to avoid:** Write explicit policies for SELECT, INSERT, UPDATE, DELETE on `storage.objects` for each bucket. Test upload/download with each role.
**Warning signs:** 403 errors on storage operations; uploads work with service_role but not with user tokens.

### Pitfall 4: Published Flag Transition for Storage
**What goes wrong:** An admin unpublishes an entity but its photos remain publicly accessible, or publishes an entity but its photos aren't accessible.
**Why it happens:** Storage RLS policies don't automatically track entity publication status.
**How to avoid:** Use a single bucket approach where RLS policies on `storage.objects` JOIN to the entity tables to check the `published` flag. This is simpler than moving files between buckets on publish/unpublish.
**Recommendation:** Use `public-assets` for entity images with an RLS SELECT policy that checks `published = true` on the owning entity. Admins and entity owners can always access their own files regardless of published status.

### Pitfall 5: Edge Function SMTP Port Blocking (Production)
**What goes wrong:** Email sending works locally via Inbucket but fails in production.
**Why it happens:** Supabase hosted Edge Functions block outbound connections on ports 25, 465, and 587 (standard SMTP ports).
**How to avoid:** For production, use an HTTP-based email API (Resend, SendGrid, etc.) rather than direct SMTP. Design the Edge Function with a pluggable transport (SMTP for local dev, HTTP API for production).
**Warning signs:** Connection timeouts on email send in production; works fine locally.

### Pitfall 6: external_id Uniqueness Scope
**What goes wrong:** External IDs from different projects collide, causing incorrect upsert matches.
**Why it happens:** If `external_id` has a global UNIQUE constraint, the same external_id can't be used in different projects.
**How to avoid:** Make the UNIQUE constraint composite: `UNIQUE (project_id, external_id)`. This allows the same external_id in different projects while preventing duplicates within a project.
**Warning signs:** Import failures on seemingly valid data; cross-project data corruption.

### Pitfall 7: Docker Network Hostname for Inbucket
**What goes wrong:** Edge Function can't connect to Inbucket SMTP because it uses `127.0.0.1` or `localhost`.
**Why it happens:** Edge Functions run in Docker containers. `localhost` inside the container refers to the container itself, not the host machine.
**How to avoid:** Use the Docker service name (likely `inbucket` or `mail`) as the SMTP host inside Edge Functions. The SMTP port inside the Docker network is typically 2500, not 54325 (which is the port mapped to the host).
**Warning signs:** Connection refused errors when sending email from Edge Functions locally.

## Code Examples

### Storage Bucket Configuration in config.toml
```toml
# Source: Supabase CLI config docs
[storage.buckets.public-assets]
public = true
file_size_limit = "500MiB"

[storage.buckets.private-assets]
public = false
file_size_limit = "500MiB"
```

### StoredImage JSONB Type Validation
```sql
-- Source: Project decision + existing validate_answer_value() pattern in 000-functions.sql
-- Update the 'image' WHEN branch in validate_answer_value():
WHEN 'image' THEN
  IF jsonb_typeof(answer_value) != 'object' THEN
    RAISE EXCEPTION 'Answer for image question must be an object';
  END IF;
  -- Validate StoredImage structure
  IF NOT (answer_value ? 'path') THEN
    RAISE EXCEPTION 'StoredImage must have a "path" property';
  END IF;
  IF jsonb_typeof(answer_value -> 'path') != 'string' THEN
    RAISE EXCEPTION 'StoredImage "path" must be a string';
  END IF;
  -- Optional fields validation
  IF answer_value ? 'pathDark' AND jsonb_typeof(answer_value -> 'pathDark') != 'string' THEN
    RAISE EXCEPTION 'StoredImage "pathDark" must be a string';
  END IF;
  IF answer_value ? 'alt' AND jsonb_typeof(answer_value -> 'alt') != 'string' THEN
    RAISE EXCEPTION 'StoredImage "alt" must be a string';
  END IF;
  IF answer_value ? 'width' AND jsonb_typeof(answer_value -> 'width') != 'number' THEN
    RAISE EXCEPTION 'StoredImage "width" must be a number';
  END IF;
  IF answer_value ? 'height' AND jsonb_typeof(answer_value -> 'height') != 'number' THEN
    RAISE EXCEPTION 'StoredImage "height" must be a number';
  END IF;
  IF answer_value ? 'focalPoint' THEN
    IF jsonb_typeof(answer_value -> 'focalPoint') != 'object' THEN
      RAISE EXCEPTION 'StoredImage "focalPoint" must be an object';
    END IF;
  END IF;
```

### external_id Column Addition Pattern
```sql
-- Add to all content tables with composite uniqueness
ALTER TABLE elections ADD COLUMN external_id text;
CREATE UNIQUE INDEX idx_elections_external_id ON elections (project_id, external_id) WHERE external_id IS NOT NULL;

-- Repeat for all content tables:
-- constituencies, constituency_groups, candidates, organizations,
-- factions, alliances, nominations, questions, question_categories,
-- question_templates, app_settings
```

### Bulk Import Input Format (mirroring Strapi admin-tools)
```json
{
  "elections": [
    {
      "external_id": "election-2024",
      "name": {"en": "Municipal Elections 2024", "fi": "Kuntavaalit 2024"},
      "election_date": "2024-04-14"
    }
  ],
  "candidates": [
    {
      "external_id": "cand-001",
      "first_name": "Matti",
      "last_name": "Meikalainen",
      "organization": {"external_id": "party-sdp"}
    }
  ],
  "nominations": [
    {
      "external_id": "nom-cand-001",
      "candidate": {"external_id": "cand-001"},
      "election": {"external_id": "election-2024"},
      "constituency": {"external_id": "constituency-helsinki"}
    }
  ]
}
```

### Email Edge Function Request Format
```json
{
  "templates": {
    "en": {
      "subject": "Your answers are needed",
      "body": "Dear {{candidate.first_name}}, please answer the questions for {{nomination.constituency.name}}."
    },
    "fi": {
      "subject": "Vastauksesi tarvitaan",
      "body": "Hei {{candidate.first_name}}, vastaa kysymyksiin alueelle {{nomination.constituency.name}}."
    }
  },
  "recipient_user_ids": ["uuid-1", "uuid-2"],
  "from": "noreply@openvaa.org",
  "dry_run": false
}
```

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| Strapi media library (AWS S3) | Supabase Storage with RLS | This migration | Direct RLS integration, no external credentials |
| Strapi `externalId` field | First-class `external_id` column with composite unique index | This migration | More robust than Strapi-specific field; DB-enforced uniqueness |
| Strapi email plugin (SES) | Edge Function + nodemailer (SMTP) | This migration | Provider-agnostic; pluggable transport |
| Strapi admin-tools data service (JS) | Postgres RPC function (plpgsql) | This migration | In-database execution; true transactional guarantee; no network overhead |
| `http` extension for DB HTTP calls | `pg_net` extension (async) | pg_net is current standard | Non-blocking; doesn't hold transaction open during HTTP call |

**Deprecated/outdated:**
- The synchronous `http` Postgres extension should NOT be used in triggers; `pg_net` is the recommended async alternative
- Direct S3 client for storage: Supabase Storage SDK handles this transparently
- SMTP ports 25/465/587 in production Supabase: blocked by platform; use HTTP APIs for production email

## Discretion Recommendations

### Published flag transition: RLS-only approach (RECOMMENDED)
Rather than moving files between private and public buckets on publish/unpublish, use a single RLS approach:
- Entity images go in `public-assets` bucket (public = true means anyone with the URL can access)
- The security model relies on the fact that the URL paths are not guessable (contain UUIDs)
- For truly sensitive files (private-assets), use signed URLs via `createSignedUrl()`
- This avoids the complexity of file-moving triggers and the latency they would add

**Alternative considered:** Two-bucket approach where files move on publish. Rejected because: adds complexity, requires copying files (not moving -- Storage API limitation), and the URL changes would break any cached references.

### Storage cleanup: pg_net async approach (RECOMMENDED)
Use `pg_net` for async HTTP DELETE calls to the Storage API. This is non-blocking and transaction-safe.
- On entity DELETE trigger: clean up all files under `{project_id}/{entity_type}/{entity_id}/`
- On image column UPDATE trigger: if old path differs from new path, delete old file
- pg_net requests only fire after the transaction commits (desired behavior for cleanup)

### RPC function structure: Process in dependency order (RECOMMENDED)
The bulk import function should process collections in a specific order to resolve dependencies:
1. elections, constituency_groups, constituencies (no entity dependencies)
2. organizations, alliances (independent entities)
3. factions (depends on organizations via nominations)
4. candidates (may reference organizations)
5. question_templates, question_categories, questions (category depends on template)
6. nominations (depends on all entities + elections + constituencies)
7. app_settings (standalone)

### Edge Function email transport: nodemailer with SMTP (RECOMMENDED)
Use `npm:nodemailer` with configurable SMTP settings:
- Local dev: connects to Inbucket via Docker network (host: `inbucket`, port: 2500)
- Production: configurable via environment variables (SMTP_HOST, SMTP_PORT, etc.)
- The interface is set up for future HTTP API providers (Resend, SendGrid) without changing the Edge Function contract

### external_id immutability: RECOMMENDED
Make `external_id` immutable once set. This prevents accidental overwrites during reimport and ensures stable external references. Implement via a BEFORE UPDATE trigger that raises an exception if `OLD.external_id IS NOT NULL AND OLD.external_id IS DISTINCT FROM NEW.external_id`.

## Validation Architecture

### Test Framework
| Property | Value |
|----------|-------|
| Framework | pgTAP (Phase 13 scope) + manual verification |
| Config file | None yet -- Phase 13 will add pgTAP infrastructure |
| Quick run command | Manual: `supabase db reset` + test scripts |
| Full suite command | N/A until Phase 13 |

### Phase Requirements -> Test Map
| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|-------------|
| SRVC-01 | Buckets configured with RLS | smoke | `supabase db reset` + verify buckets exist in Studio | No -- Wave 0 |
| SRVC-02 | Candidate photo upload/serve | manual | Upload via JS SDK + verify URL | No -- Wave 0 |
| SRVC-03 | Mailpit accessible | smoke | `curl http://127.0.0.1:54324` | No -- manual |
| SRVC-04 | Bulk import transactional | integration | `supabase rpc bulk_import --data '...'` + verify | No -- Wave 0 |
| SRVC-05 | Bulk delete transactional | integration | `supabase rpc bulk_delete --data '...'` + verify | No -- Wave 0 |
| SRVC-06 | Transactional email Edge Function | integration | `curl` to Edge Function + check Inbucket | No -- Wave 0 |

### Sampling Rate
- **Per task commit:** `supabase db reset` + manual verification
- **Per wave merge:** Full schema rebuild + all manual checks
- **Phase gate:** All requirements verified before `/gsd:verify-work`

### Wave 0 Gaps
- [ ] Schema file `014-storage.sql` -- storage RLS policies
- [ ] Schema file `015-external-id.sql` -- external_id columns + immutability trigger
- [ ] Schema file `016-bulk-operations.sql` -- RPC functions
- [ ] Edge Function `send-email/index.ts` -- email sending
- [ ] Migration regenerated: `00001_initial_schema.sql` updated
- [ ] Type regeneration: `packages/supabase-types/` updated after schema changes

## Open Questions

1. **Inbucket Docker hostname for Edge Functions**
   - What we know: Supabase local Edge Functions run in Docker with `SUPABASE_URL=http://kong:8000`. Inbucket is another container in the same network.
   - What's unclear: The exact Docker service name for Inbucket in the Supabase CLI stack (likely `inbucket` or `mail`). The internal SMTP port is likely 2500.
   - Recommendation: Start Supabase locally and inspect `docker network inspect` to confirm service names. Alternatively, use the environment variable pattern from invite-candidate to call Inbucket's SMTP.

2. **pg_net availability in Supabase local**
   - What we know: pg_net is a standard Supabase extension, enabled by default in hosted projects.
   - What's unclear: Whether it's available out of the box in the local Supabase CLI stack or needs explicit enabling.
   - Recommendation: Test with `SELECT * FROM pg_extension WHERE extname = 'pg_net'` after `supabase start`. If not available, add `CREATE EXTENSION IF NOT EXISTS pg_net;` to schema.

3. **Supabase Vault for service_role_key in triggers**
   - What we know: pg_net triggers need the service_role_key to call the Storage API. Hardcoding is a security risk.
   - What's unclear: How Supabase Vault works in local development; whether custom settings (`SET app.service_role_key`) are simpler for local dev.
   - Recommendation: Use PostgreSQL custom settings (`app.supabase_url`, `app.service_role_key`) set in the seed.sql or via `ALTER DATABASE ... SET`. This is simpler for local dev and can be replaced with Vault in production.

4. **Storage API batch delete endpoint**
   - What we know: The SDK `remove()` method accepts an array (up to 1000 items). The REST API endpoint format for batch delete needs verification.
   - What's unclear: Whether `pg_net` can call the batch delete endpoint or if each file needs an individual HTTP call.
   - Recommendation: For entity deletion cleanup, list files under the entity's path prefix first, then batch delete. This may require a two-step approach (list + delete).

## Sources

### Primary (HIGH confidence)
- [Supabase Storage Access Control](https://supabase.com/docs/guides/storage/security/access-control) - RLS policy patterns, helper functions
- [Supabase Storage Schema Design](https://supabase.com/docs/guides/storage/schema/design) - storage.objects table, metadata-only deletion warning
- [Supabase Storage Helper Functions](https://supabase.com/docs/guides/storage/schema/helper-functions) - `storage.foldername()`, `storage.filename()`, `storage.extension()`
- [Supabase Storage Creating Buckets](https://supabase.com/docs/guides/storage/buckets/creating-buckets) - SDK, SQL, config.toml approaches
- [Supabase pg_net Extension](https://supabase.com/docs/guides/database/extensions/pg_net) - net.http_delete, trigger integration, async behavior
- [Supabase Edge Function Email](https://supabase.com/docs/guides/functions/examples/send-emails) - Deno + nodemailer pattern
- [Supabase Storage Delete Objects](https://supabase.com/docs/guides/storage/management/delete-objects) - SDK remove(), 1000 item batch limit
- [Supabase Storage Image Transformations](https://supabase.com/docs/guides/storage/serving/image-transformations) - URL parameters, Pro plan requirement

### Secondary (MEDIUM confidence)
- [PostgREST RPC Transaction Wrapping](https://dev.to/voboda/gotcha-supabase-postgrest-rpc-with-transactions-45a7) - Automatic transaction wrapping behavior verified
- [Supabase CLI config.toml](https://supabase.com/docs/guides/cli/config) - storage.buckets configuration format
- [Supabase Storage Deletion Discussion](https://github.com/orgs/supabase/discussions/7067) - pg_net pattern for cleanup triggers
- [MakerKit Inbucket Docs](https://makerkit.dev/docs/next-supabase-turbo/emails/inbucket) - Inbucket SMTP connection details (host: 127.0.0.1, port: 54325 from host)
- [Supabase Edge Function SMTP Port Issue](https://github.com/supabase/supabase/issues/6255) - Production SMTP port blocking

### Tertiary (LOW confidence)
- Docker internal hostname for Inbucket (likely `inbucket`, needs local verification)
- pg_net local availability (likely available, needs `supabase start` verification)

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH - All tools are built-in Supabase features or documented patterns
- Architecture: HIGH - Patterns derived from official docs + existing project patterns (010-rls.sql, invite-candidate)
- Storage RLS: HIGH - Well-documented with helper functions; follows same pattern as existing 79 RLS policies
- Bulk import RPC: HIGH - PostgREST transaction wrapping is well-documented; mirrors existing Strapi admin-tools
- Email Edge Function: MEDIUM - SMTP to Inbucket from Edge Function Docker container needs hostname verification
- Pitfalls: HIGH - Critical orphaned-file pitfall well-documented in multiple community discussions

**Research date:** 2026-03-14
**Valid until:** 2026-04-14 (stable -- Supabase Storage and RPC patterns are mature)
