# Feature Landscape: Supabase Migration

**Domain:** Backend migration from Strapi v5 to Supabase for a Voting Advice Application (VAA)
**Researched:** 2026-03-12
**Confidence:** MEDIUM-HIGH (Supabase official docs verified, codebase analysis thorough, some patterns from community sources)

---

## Context

OpenVAA is migrating its backend from Strapi v5 to Supabase. The existing Strapi backend provides content management, REST API, authentication, file storage, email, and admin tools. This research maps each existing Strapi feature to its Supabase equivalent and identifies new capabilities that emerge.

**Current data scale (from codebase analysis):**
- 20-100 questions per election
- 100-10,000 candidates per election (nominations link candidates to elections+constituencies)
- 2-20 parties per election
- 1-5 elections per deployment
- Answers stored as JSON blob on candidate/party records: `{ [questionId]: { value, info } }`
- All user-facing text fields use JSON locale maps: `{ "en": "...", "fi": "..." }`
- App settings are a singleton with nested component objects

**Frontend adapter layer (critical dependency):**
The frontend uses a `UniversalDataProvider` / `UniversalDataWriter` abstraction with methods like `getElectionData()`, `getEntityData()`, `getQuestionData()`, `setAnswers()`, `login()`, etc. The Strapi adapter (`StrapiDataProvider`, `StrapiDataWriter`) implements these. Migration requires writing a `SupabaseDataProvider` and `SupabaseDataWriter` that implement the same interfaces. The abstraction is clean -- the adapter boundary is well-defined.

---

## 1. Candidate Answer Storage

### Current State (Strapi)

Answers are stored as a single `json` column on the `candidates` table (and `parties` table). The shape is:

```json
{
  "questionDocumentId1": { "value": 3, "info": { "en": "Because...", "fi": "Koska..." } },
  "questionDocumentId2": { "value": { "en": "Text answer", "fi": "..." }, "info": null }
}
```

This is read in bulk (all answers for all candidates at once for matching), and written per-candidate (candidate updates their own answers one at a time or in batch).

### Options Analysis

#### Option A: JSONB Column (Preserve Current Pattern)

**Row counts:** 100-10,000 rows in candidates table, each with one JSONB column containing 20-100 answer entries.

| Aspect | Assessment |
|--------|------------|
| Read pattern (voter app) | Single SELECT fetching all candidates with answers -- no joins needed. Very fast. At 10K candidates, ~10K rows scanned with JSONB extraction. |
| Write pattern (candidate app) | JSONB merge update via `jsonb_set()` or full column overwrite. Simple. |
| Aggregation (matching) | All data in-memory after single fetch. Frontend matching library already expects this shape. No server-side aggregation needed. |
| RLS | Straightforward: RLS on candidates table, answers travel with the row. |
| Schema evolution | Adding new question types or answer fields requires no migration. |
| Data integrity | No FK constraints on question IDs within JSON. Orphaned answers possible. |
| Query by answer value | Possible with JSONB operators + GIN index, but awkward. Rarely needed. |
| Index strategy | GIN index on answers column only if querying by answer content. For bulk fetch, B-tree on candidate ID suffices. |

**Estimated storage:** 10K candidates x 100 questions x ~200 bytes/answer = ~200MB JSONB data. Well within PostgreSQL comfort zone.

#### Option B: Fully Relational (`candidate_answers` Table)

**Row counts:** 10K candidates x 100 questions = 1,000,000 rows in answers table.

| Aspect | Assessment |
|--------|------------|
| Read pattern (voter app) | JOIN candidates with candidate_answers, aggregate back to per-candidate shape. At 10K candidates x 100 questions = 1M rows to scan and aggregate. |
| Write pattern (candidate app) | INSERT/UPDATE individual answer rows. Clean upsert with unique constraint on (candidate_id, question_id). |
| Aggregation (matching) | Requires server-side aggregation or multiple queries. The frontend matching library expects a flat answers dict per candidate. |
| RLS | RLS on candidate_answers table -- candidate can only modify their own rows. Clean. |
| Schema evolution | ALTER TABLE for new answer fields. Migration required. |
| Data integrity | FK to questions table. Orphaned answers impossible. |
| Query by answer value | Clean WHERE clause on value column. Useful for analytics. |
| Index strategy | Composite index on (candidate_id, question_id). Standard B-tree. |

**Estimated storage:** 1M rows x ~100 bytes/row = ~100MB. Comparable to JSONB.

#### Recommendation: JSONB Column (Option A)

**Use JSONB because:**

1. **The query pattern demands it.** The voter app fetches ALL candidates with ALL answers in a single request for client-side matching. This is a bulk read, not a filtered query. JSONB avoids a 1M-row join and JSON aggregation on every page load.

2. **The matching library expects it.** `@openvaa/matching` receives answers as `{ [questionId]: { value, info } }`. A relational model would require server-side aggregation back into this exact shape. The JSONB column already stores data in the consumption format.

3. **Write patterns are simple.** Candidates update their own answers. This is a single row update via `jsonb_set()` or full column replacement. No complex multi-row transactions needed.

4. **The current system works.** This is not a theoretical choice -- Strapi already stores answers as JSON and it performs well at production scale. Migration should preserve what works.

5. **RLS is simpler.** One policy on the candidates table covers both profile data and answers. No need for separate policies on a junction table.

**Mitigate JSONB weaknesses with:**
- Validation at the application layer (already exists in frontend)
- A Postgres CHECK constraint or trigger validating JSONB structure against known question IDs
- The load test phase of the migration should validate read performance at 10K candidates

**When to reconsider:** If a future feature requires querying "all candidates who answered X to question Y" frequently (analytics dashboard), add a materialized view or denormalized index rather than restructuring the core storage.

| Feature | Status | Complexity | Frontend Adapter Impact |
|---------|--------|------------|------------------------|
| JSONB answer storage on candidates table | Table stakes | LOW | Minimal -- `parseAnswers()` already handles JSON shape |
| JSONB answer storage on parties table | Table stakes | LOW | Same as candidates |
| Application-layer answer validation | Table stakes | MEDIUM | None -- validation is in `@openvaa/app-shared` |
| Postgres CHECK constraint on JSONB structure | Differentiator | LOW | None |
| Load test at 10K candidates | Table stakes | MEDIUM | None |

---

## 2. Multi-Tenant Data Isolation

### Current State (Strapi)

No multi-tenancy in current Strapi setup. Each deployment is a separate Strapi instance with its own database. The roadmap explicitly calls for multi-tenant support in Supabase.

### Recommendation: Shared Tables with `organization_id` Column + RLS

**Use tenant column + RLS because:**

1. **Simpler operations.** Schema-per-tenant requires managing N schemas, running migrations N times, and complicates connection pooling. For a VAA with 10-50 organizations, this overhead is disproportionate.

2. **Supabase RLS is designed for this.** RLS policies can reference `auth.jwt() ->> 'organization_id'` to automatically filter all queries by tenant. Once policies are in place, data isolation is enforced at the database level -- the application cannot accidentally leak cross-tenant data.

3. **Shared infrastructure cost.** One Supabase project serves all tenants, keeping costs at the current $80-350/month range rather than multiplying by tenant count.

**Implementation pattern:**

```sql
-- Every tenant-scoped table gets this column
ALTER TABLE elections ADD COLUMN organization_id UUID NOT NULL REFERENCES organizations(id);

-- RLS policy pattern (repeated for each table)
CREATE POLICY "tenant_isolation" ON elections
  USING (organization_id = (auth.jwt() ->> 'organization_id')::uuid);

-- Index for RLS performance (critical)
CREATE INDEX idx_elections_org ON elections(organization_id);
```

**Tenant context in JWT:** Store `organization_id` in Supabase Auth user metadata (`raw_app_meta_data`). Supabase Auth includes this in the JWT automatically. RLS policies read from JWT, requiring zero application-layer filtering.

| Feature | Status | Complexity | Frontend Adapter Impact |
|---------|--------|------------|------------------------|
| `organization_id` column on all content tables | Table stakes | MEDIUM | None -- RLS handles filtering transparently |
| RLS policies for tenant isolation | Table stakes | HIGH | None -- Supabase client respects RLS automatically |
| Index on organization_id for all tables | Table stakes | LOW | None |
| Organization management (CRUD) | Table stakes | MEDIUM | New admin UI needed (future milestone) |
| Tenant context in JWT via user metadata | Table stakes | MEDIUM | Login flow must set organization context |
| Cross-tenant admin access (super-admin) | Differentiator | MEDIUM | Requires service_role key on server side |
| Tenant-scoped storage buckets | Differentiator | MEDIUM | Storage paths include org ID prefix |

### RLS Performance Warning

Missing indexes on RLS-referenced columns are the number one performance killer in Supabase multi-tenant apps. Every table with an `organization_id` column MUST have a B-tree index on that column. The migration should include a validation step that checks for missing indexes.

---

## 3. Localization Patterns

### Current State (Strapi)

Multilingual content is stored as JSON columns with locale keys:

```json
{ "en": "Municipal Elections 2024", "fi": "Kuntavaalit 2024", "sv": "Kommunalvalet 2024" }
```

This pattern is used on: `election.name`, `election.shortName`, `election.info`, `question.text`, `question.info`, `question.fillingInfo`, `question.shortName`, `party.name`, `constituency.name`, `candidate.answers[].info`, and many more.

The frontend's `translate()` function extracts the correct locale from these JSON objects. The `parseBasics()` utility handles the common `name/shortName/info` pattern.

### Recommendation: JSONB Columns with Locale Keys (Preserve Current Pattern)

**Use JSONB locale columns because:**

1. **The current pattern works and the frontend is built around it.** The `translate()` function, `parseBasics()`, and every data adapter method already handles `{ locale: string }` JSON objects. Changing to a separate translations table would require rewriting every data parser.

2. **Read efficiency.** A single row fetch returns all translations for that entity. No joins to a translations table. For a VAA that supports 2-5 locales, the overhead of storing all translations in one column is negligible.

3. **Write simplicity.** Admins edit content in all locales simultaneously (typical for small teams). A single row update captures all locale changes atomically.

4. **Supabase has no built-in i18n -- it is all PostgreSQL.** There is no Supabase-native localization feature. Any pattern is a PostgreSQL pattern. JSONB locale columns are the simplest PostgreSQL pattern for this use case.

**Why NOT a separate translations table:**
- Adds a JOIN to every content query (elections, questions, candidates, parties, constituencies, etc.)
- Breaks the 1:1 mapping between Strapi schemas and Supabase tables
- Requires rewriting all frontend data parsers
- Adds complexity for negligible benefit at 2-5 locales

**Helper function for Supabase queries:**

```sql
-- Extract localized text server-side when needed
CREATE FUNCTION localized(data JSONB, locale TEXT) RETURNS TEXT AS $$
  SELECT COALESCE(data ->> locale, data ->> 'en', data ->> (SELECT key FROM jsonb_each_text(data) LIMIT 1));
$$ LANGUAGE sql IMMUTABLE;
```

| Feature | Status | Complexity | Frontend Adapter Impact |
|---------|--------|------------|------------------------|
| JSONB locale columns on all content tables | Table stakes | LOW | None -- same shape as Strapi |
| `localized()` helper function in Postgres | Differentiator | LOW | None -- for server-side use only |
| Locale validation CHECK constraint | Differentiator | LOW | None |
| Full-text search across locales (PGroonga) | Anti-feature for now | HIGH | N/A -- not needed for VAA |

---

## 4. Application Settings

### Current State (Strapi)

App Settings is a Strapi singleton (`singleType`) with nested components for header, matching, survey, entityDetails, questions, results, entities, headerStyle, elections, access, notifications, and candidateApp. App Customization is a separate singleton with translation overrides, FAQ content, and branding images.

The frontend loads these via `getAppSettings()` and `getAppCustomization()` calls that return deeply nested objects.

### Recommendation: Typed Settings Table with JSONB Value Column

**Use a typed settings table because:**

1. **Preserves the nested structure.** App settings contain deeply nested objects (e.g., `results.cardContents.candidate[]`). Flattening these into key-value pairs would lose type safety and make updates painful.

2. **Singleton pattern maps to single row.** Supabase has no "single type" concept. A settings table with a single row per organization achieves the same thing.

3. **RLS-compatible.** Settings row scoped by `organization_id` provides tenant-specific configuration.

**Schema:**

```sql
CREATE TABLE app_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) UNIQUE,
  header JSONB NOT NULL DEFAULT '{}',
  matching JSONB NOT NULL DEFAULT '{}',
  survey JSONB,
  entity_details JSONB NOT NULL DEFAULT '{}',
  questions JSONB NOT NULL DEFAULT '{}',
  results JSONB NOT NULL DEFAULT '{}',
  entities JSONB NOT NULL DEFAULT '{}',
  header_style JSONB,
  elections JSONB,
  access JSONB NOT NULL DEFAULT '{}',
  notifications JSONB,
  candidate_app JSONB NOT NULL DEFAULT '{}',
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE app_customization (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) UNIQUE,
  publisher_name JSONB,
  publisher_logo_path TEXT,
  publisher_logo_dark_path TEXT,
  poster_path TEXT,
  poster_dark_path TEXT,
  cand_poster_path TEXT,
  cand_poster_dark_path TEXT,
  translation_overrides JSONB DEFAULT '[]',
  candidate_app_faq JSONB DEFAULT '[]',
  updated_at TIMESTAMPTZ DEFAULT now()
);
```

**Why NOT a generic key-value store:**
- The settings have a well-defined TypeScript type (`DynamicSettings`). A key-value store would lose all type structure and require reassembling the object client-side from scattered key lookups.
- Settings are read as a whole on app load (not individual keys), so a single row fetch is optimal.

| Feature | Status | Complexity | Frontend Adapter Impact |
|---------|--------|------------|------------------------|
| `app_settings` table with JSONB columns per section | Table stakes | MEDIUM | `_getAppSettings()` rewritten to query single row |
| `app_customization` table | Table stakes | MEDIUM | `_getAppCustomization()` rewritten to query single row + storage URLs |
| Org-scoped settings via organization_id | Table stakes | LOW | Transparent via RLS |
| Default settings via Postgres DEFAULT values | Differentiator | LOW | None |
| Settings validation via Postgres CHECK | Differentiator | MEDIUM | None |
| Realtime settings updates (Supabase Realtime) | Differentiator | LOW | New capability -- settings changes push to connected clients |

---

## 5. Authentication

### Current State (Strapi)

The Strapi `users-permissions` plugin provides:

1. **Candidate registration flow:** Admin pre-registers candidate (creates candidate record + registration key + sends email) -> candidate visits registration link -> checks key -> sets password -> user account created and linked to candidate.
2. **Candidate login:** Email + password -> JWT returned.
3. **Password reset:** Email-based reset flow with customized HTML template.
4. **Bank auth (Signicat/OIDC):** Authorization code flow via external IdP. Candidate self-registers after bank authentication verifies identity.
5. **Roles:** `public` (unauthenticated voter), `authenticated` (candidate), `admin` (admin app access).
6. **Permissions:** Per-role, per-action permissions table (see `defaultPermissions` in strapi-server.ts).

### Mapping to Supabase Auth

| Strapi Feature | Supabase Equivalent | Notes |
|---------------|---------------------|-------|
| Email/password signup | `supabase.auth.signUp()` | Built-in. But OpenVAA disables open registration -- candidates are pre-registered by admin. |
| Registration key flow | `supabase.auth.admin.inviteUserByEmail()` or `generateLink()` | Admin creates candidate record, then invites user. `before-user-created` hook can enforce pre-registration requirement. |
| Login | `supabase.auth.signInWithPassword()` | Built-in. Returns session with JWT. |
| Password reset | `supabase.auth.resetPasswordForEmail()` | Built-in. Email template customizable in Supabase dashboard. |
| Bank auth (OIDC) | Third-party auth or custom Edge Function | Supabase supports Clerk, Auth0, Firebase, Cognito, WorkOS natively. Generic OIDC (Signicat) requires custom implementation via Edge Function or third-party auth integration. |
| User roles | `raw_app_meta_data` in auth.users + custom `user_roles` table | Supabase Auth has no built-in role concept beyond `authenticated`/`anon`. Roles must be stored in app metadata or a custom table. |
| Per-action permissions | RLS policies | Supabase replaces Strapi's permission system entirely with RLS. Each table has policies that check user role/identity. |

### Critical: Pre-Registration Flow

The existing candidate registration is a multi-step flow that does NOT map directly to Supabase's standard signup:

1. Admin creates candidate record (name, email, nomination data)
2. System generates registration key and emails it
3. Candidate visits link, confirms identity, sets password
4. User account is created and linked to candidate

**Supabase implementation:**

```
1. Admin calls Edge Function that:
   a. Creates candidate row in candidates table (via service_role)
   b. Uses supabase.auth.admin.inviteUserByEmail() to create auth user
   c. Links auth user ID to candidate row
   d. Sends customized email with invite link

2. Candidate clicks invite link -> Supabase Auth processes invite
3. Candidate sets password via supabase.auth.updateUser()
4. before-user-created hook validates candidate exists for this email
```

### Critical: Bank Auth (Signicat OIDC)

Signicat is a Nordic bank authentication provider. It is NOT in Supabase's built-in provider list. Options:

1. **Third-party auth integration:** If Signicat JWTs are asymmetrically signed with OIDC discovery URL, Supabase can trust them directly. This is the cleanest path but requires Signicat to expose OIDC endpoints (which it does -- Signicat is OIDC-compliant).

2. **Custom Edge Function:** Handle the OIDC code exchange in an Edge Function, create/find user in Supabase Auth, return session. More control but more code to maintain.

3. **Auth0 as intermediary:** Use Auth0 (supported by Supabase) with Signicat as a social connection. Adds a service but simplifies the integration.

**Recommendation:** Use Supabase's third-party auth integration with Signicat's OIDC discovery URL if Signicat JWTs meet the requirements (asymmetric signing, `kid` header). Otherwise, use an Edge Function for the code exchange. Avoid adding Auth0 as an intermediary -- it adds cost and complexity.

| Feature | Status | Complexity | Frontend Adapter Impact |
|---------|--------|------------|------------------------|
| Email/password login | Table stakes | LOW | `_login()` rewritten to use `supabase.auth.signInWithPassword()` |
| Password reset flow | Table stakes | LOW | `_requestForgotPasswordEmail()` uses `supabase.auth.resetPasswordForEmail()` |
| Pre-registration invite flow | Table stakes | HIGH | `_preregister()` rewritten to call Edge Function |
| Registration key -> invite link migration | Table stakes | HIGH | `_checkRegistrationKey()` and `_register()` replaced with invite acceptance |
| Role-based access (candidate/admin) | Table stakes | MEDIUM | `_getBasicUserData()` reads role from user metadata or custom table |
| Bank auth (Signicat OIDC) | Table stakes | HIGH | OIDC flow rewritten for Supabase third-party auth or Edge Function |
| `before-user-created` hook for invite validation | Table stakes | MEDIUM | None -- server-side only |
| Session management (JWT refresh) | Table stakes | LOW | Supabase client handles automatically |
| Password validation rules | Table stakes | LOW | `before-user-created` hook or Edge Function validates password |

---

## 6. Email

### Current State (Strapi)

- AWS SES via Strapi email plugin
- Used for: password reset emails, candidate registration emails
- Custom HTML templates (e.g., `reset-password.html`)
- Configurable sender/reply-to via env vars

### Mapping to Supabase Email

| Aspect | Development | Production |
|--------|-------------|------------|
| Email provider | Supabase CLI auto-captures with Mailpit (localhost:54324) | Custom SMTP required (AWS SES, Resend, SendGrid) |
| Rate limit | No limit locally | 30/hour initially with custom SMTP, configurable |
| Template customization | Via config files in local dev | Dashboard (Authentication -> Templates) or Edge Functions |
| Transactional emails | Auth-related only (reset, invite, confirm) | Same + custom via Edge Functions |
| Custom email (non-auth) | Edge Function + SMTP service | Edge Function + SMTP service |

### Critical: Registration Email Customization

The current system sends heavily customized registration emails with candidate-specific data (name, registration key URL). Supabase's built-in invite email is generic. Two paths:

1. **Use `generateLink()` + custom send:** Generate the invite link server-side, then send a fully custom email via SES/Resend Edge Function. This preserves full control over email content.

2. **Use Supabase email templates:** Customize the invite template in the dashboard. Limited to Supabase template variables -- may not include custom candidate fields.

**Recommendation:** Use `generateLink()` in the registration Edge Function and send custom emails via AWS SES (already in use). This preserves the current email customization while using Supabase Auth for the underlying user creation.

| Feature | Status | Complexity | Frontend Adapter Impact |
|---------|--------|------------|------------------------|
| Password reset emails | Table stakes | LOW | None -- Supabase handles automatically |
| Custom registration invite emails | Table stakes | MEDIUM | None -- Edge Function handles |
| Local email testing via Mailpit | Table stakes | LOW | None |
| Custom SMTP configuration (AWS SES) | Table stakes | LOW | None -- Supabase dashboard config |
| Custom email templates | Differentiator | MEDIUM | None |
| Email sending from Edge Functions | Table stakes | MEDIUM | None -- replaces Strapi email plugin |

---

## 7. Storage

### Current State (Strapi)

- AWS S3 via Strapi upload plugin
- Used for: candidate photos, party logos, publisher logos, posters
- Access: public read (images served via URLs), authenticated write (candidates upload their own photo)

### Mapping to Supabase Storage

Supabase Storage is S3-compatible with built-in CDN, image transformations, and RLS-based access control. It replaces the Strapi S3 plugin directly.

**Bucket design:**

```
public-assets/                    -- Public bucket (logos, posters)
  {org_id}/publisher-logo.png
  {org_id}/poster.png

candidate-photos/                 -- Private bucket with RLS
  {org_id}/{candidate_id}/photo.jpg

party-images/                     -- Private bucket with RLS
  {org_id}/{party_id}/logo.png
```

**RLS policies for candidate photos:**

```sql
-- Candidates can upload/update their own photo
CREATE POLICY "candidate_upload_own_photo" ON storage.objects
  FOR INSERT TO authenticated
  WITH CHECK (
    bucket_id = 'candidate-photos' AND
    (storage.foldername(name))[2] = auth.uid()::text
  );

-- Public read for all candidate photos (voter app needs this)
CREATE POLICY "public_read_candidate_photos" ON storage.objects
  FOR SELECT TO anon, authenticated
  USING (bucket_id = 'candidate-photos');
```

**Image transformations:** Supabase Storage provides on-the-fly image resizing, compression, and format conversion. This is a new capability -- the current system serves original uploads without optimization.

| Feature | Status | Complexity | Frontend Adapter Impact |
|---------|--------|------------|------------------------|
| Candidate photo upload | Table stakes | MEDIUM | `_updateEntityProperties()` rewritten to use Supabase Storage upload |
| Public image serving via CDN | Table stakes | LOW | Image URLs change from S3 to Supabase Storage URLs |
| RLS on storage (candidate owns their photo) | Table stakes | MEDIUM | None -- handled by Supabase client automatically |
| Org-scoped storage paths | Table stakes | LOW | Storage paths include org ID |
| On-the-fly image optimization | Differentiator | LOW | Use Supabase image transformation URLs (new capability) |
| Multiple image variants (dark mode logos) | Table stakes | LOW | Same upload pattern, separate files |

### Frontend Impact: Image URL Changes

The current `parseImage()` utility constructs image URLs from Strapi's media format. This must be rewritten to construct Supabase Storage public URLs. The change is localized to `parseImage()` -- all consumers use the parsed URL string.

---

## 8. Admin Data Operations

### Current State (Strapi)

The Admin Tools plugin (`openvaa-admin-tools`) provides:

1. **Import:** Bulk upsert of data by collection (candidates, nominations, parties, questions, etc.) in a single transaction. Matches existing records by `externalId` or `documentId`.
2. **Delete:** Bulk delete by `externalId` prefix within a transaction.
3. **Find:** Query candidates by registration status and constituency.
4. **Candidate auth management:** Sending registration emails, managing auth state.
5. **Email:** Batch email sending to candidates.

This is used by the Admin App in the frontend and by E2E tests for data setup.

### Mapping to Supabase

| Admin Tool Feature | Supabase Equivalent | Implementation |
|-------------------|---------------------|----------------|
| Bulk import (transactional) | Edge Function with service_role + `supabase.from().upsert()` | Edge Function wraps batch upsert in a Postgres transaction |
| Bulk delete by externalId | Edge Function with service_role + filtered delete | Edge Function performs DELETE WHERE external_id LIKE prefix |
| Find candidates by status | Direct Supabase query with RLS (admin role) | Frontend queries candidates table directly with admin JWT |
| Registration email management | Edge Function using `supabase.auth.admin.*` | Edge Function wraps invite/generateLink APIs |
| Batch email sending | Edge Function + SES/Resend | Edge Function iterates recipients, sends via SMTP |

### Critical: Transaction Support

The current import service wraps all operations in a single database transaction -- if any row fails, everything rolls back. Supabase client SDK does not expose transaction control directly. Options:

1. **Edge Function with direct Postgres connection:** Use `postgres` npm package in Edge Function to get transaction control. More complex but preserves atomicity.

2. **Database function (RPC):** Write a Postgres function that accepts JSON import data and performs the upsert within a transaction. Call via `supabase.rpc('import_data', { data })`. This is the cleanest approach -- the transaction logic lives in the database.

3. **Edge Function with SDK upsert (no transaction):** Accept partial failures. Simpler but loses the current atomicity guarantee.

**Recommendation:** Use Postgres RPC functions for bulk import/delete. The transaction guarantee is important for data integrity during election setup. The Postgres function receives the structured data as JSONB, iterates and upserts within a single transaction, and returns success/failure counts.

| Feature | Status | Complexity | Frontend Adapter Impact |
|---------|--------|------------|------------------------|
| Bulk import via Postgres RPC | Table stakes | HIGH | Admin App calls `supabase.rpc('import_data', {...})` |
| Bulk delete via Postgres RPC | Table stakes | MEDIUM | Admin App calls `supabase.rpc('delete_data', {...})` |
| Transactional guarantee | Table stakes | MEDIUM | None -- handled in Postgres function |
| Find candidates by registration status | Table stakes | LOW | Direct Supabase query replaces API call |
| Batch email via Edge Function | Table stakes | MEDIUM | Admin App calls Edge Function |
| E2E test data setup compatibility | Table stakes | MEDIUM | Test helpers call same RPC functions |
| Admin role check in RPC functions | Table stakes | LOW | `SECURITY DEFINER` functions check role from JWT |

---

## Feature Dependencies

```
[Multi-tenant isolation (org_id + RLS)]
    |-- required-by --> [All content tables schema]
    |-- required-by --> [App settings (org-scoped)]
    |-- required-by --> [Storage bucket paths]
    |-- required-by --> [Auth user metadata (org assignment)]

[Supabase Auth setup]
    |-- required-by --> [Pre-registration invite flow]
    |-- required-by --> [Bank auth (OIDC)]
    |-- required-by --> [RLS policies (auth.uid() references)]
    |-- required-by --> [Storage RLS (auth.uid() in paths)]
    |-- required-by --> [Admin role-based operations]

[Schema design (tables + JSONB columns)]
    |-- required-by --> [RLS policies]
    |-- required-by --> [Answer storage]
    |-- required-by --> [Localization columns]
    |-- required-by --> [Admin import RPC functions]

[Edge Functions]
    |-- required-by --> [Pre-registration invite flow]
    |-- required-by --> [Bank auth (OIDC)]
    |-- required-by --> [Custom email sending]
    |-- required-by --> [Batch operations]

[Frontend adapter layer]
    |-- depends-on --> [Schema design]
    |-- depends-on --> [Supabase Auth]
    |-- depends-on --> [Storage setup]
    |-- depends-on --> [RLS policies verified]
```

### Dependency Ordering Implications

1. **Schema first.** All content tables with `organization_id`, JSONB locale columns, and answer storage must be defined before RLS policies or adapters can be built.
2. **Auth second.** Supabase Auth must be configured before RLS policies (they reference `auth.uid()`) and before the frontend adapter can implement login/registration.
3. **RLS third.** Policies depend on both schema and auth. Must be tested from the client SDK, not the SQL editor (SQL editor bypasses RLS).
4. **Edge Functions and Storage in parallel.** These depend on Auth but not on each other.
5. **Frontend adapter last.** Depends on everything above being in place and tested.

---

## Anti-Features

Features to explicitly NOT build during the Supabase migration.

| Anti-Feature | Why Tempting | Why Avoid | What to Do Instead |
|-------------|-------------|-----------|-------------------|
| Schema-per-tenant isolation | "Stronger isolation" | Operational complexity is disproportionate for 10-50 tenants. Migrations run N times. Connection pooling breaks. | Use shared tables with `organization_id` + RLS. If a tenant needs true isolation, deploy a separate Supabase project. |
| Separate translations table | "Proper normalization" | Adds JOINs to every query, breaks existing frontend parsers, provides no benefit at 2-5 locales. | Keep JSONB locale columns. Add `localized()` helper function for server-side extraction. |
| Relational answer storage (initially) | "Better data integrity" | Adds 1M-row JOIN to the critical voter app query path. Frontend matching library expects JSON shape. | Use JSONB answers column. Validate with load tests. Add relational table only if JSONB proves insufficient (unlikely at expected scale). |
| GraphQL API | "Modern API" | Supabase has GraphQL via pg_graphql extension, but the frontend adapter uses REST patterns. Adding GraphQL would mean maintaining two API layers. | Use Supabase REST API (PostgREST) exclusively. The universal adapter pattern already abstracts the API. |
| Supabase Realtime for voter data | "Live updates during election" | Voter app loads all data once for client-side matching. Realtime subscriptions would add complexity for zero benefit -- election data doesn't change during a user session. | Use Realtime only for admin settings (if desired) and candidate app notifications. |
| Custom admin dashboard in Supabase Studio | "Replace Strapi admin" | Supabase Studio is for developers, not election administrators. Building admin UI in Studio means learning Studio's extension API (poorly documented). | Build the admin UI in the SvelteKit frontend (separate milestone already planned). Use Supabase Studio only for developer debugging. |
| Migrating Strapi admin UI tests to Supabase | "Keep admin test coverage" | Strapi admin UI is being removed. Supabase Studio is not the replacement -- the SvelteKit Admin App is. | E2E tests should target the SvelteKit Admin App, not Supabase Studio. |

---

## MVP Recommendation

### Phase 1: Schema + Auth Foundation

Prioritize:
1. **Database schema** -- All tables with `organization_id`, JSONB locale columns, JSONB answer columns
2. **Supabase Auth** -- Email/password login, user metadata with role and org
3. **Core RLS policies** -- Tenant isolation, candidate self-edit, public read
4. **Load test** -- Validate JSONB answer performance at 10K candidates

### Phase 2: Services + Edge Functions

5. **Storage** -- Bucket setup, RLS, image upload/serve
6. **Edge Functions** -- Pre-registration invite flow, custom email sending
7. **Admin RPC** -- Import/delete Postgres functions

### Phase 3: Frontend Adapter

8. **SupabaseDataProvider** -- Read operations (elections, questions, candidates, etc.)
9. **SupabaseDataWriter** -- Write operations (login, answers, properties, admin)
10. **Bank auth (OIDC)** -- Signicat integration

### Defer:
- **Supabase Realtime** -- No immediate use case. Evaluate after core migration.
- **Image optimization** -- Supabase Storage provides this for free; enable when storage is configured.
- **Admin App migration** -- Separate milestone per project plan.

---

## Confidence Assessment

| Area | Confidence | Reason |
|------|------------|--------|
| Answer storage (JSONB) | HIGH | Codebase analysis shows exact current shape, PostgreSQL JSONB performance well-documented, scale is known |
| Multi-tenant RLS | MEDIUM-HIGH | Supabase docs comprehensive on RLS patterns, community sources confirm approach, but OpenVAA-specific policy design needs validation |
| Localization (JSONB columns) | HIGH | Direct mapping from Strapi -- same storage format, same frontend parsing |
| App settings | HIGH | Straightforward table design, singleton pattern well-understood |
| Authentication | MEDIUM | Core flows (login, password reset) are simple. Pre-registration and bank auth have complexity -- Edge Functions needed, exact Signicat OIDC compatibility needs validation |
| Email | MEDIUM-HIGH | Supabase email for auth flows is well-documented. Custom email via Edge Functions is standard pattern. |
| Storage | HIGH | Supabase Storage is S3-compatible, RLS-based access is documented, bucket design is straightforward |
| Admin operations | MEDIUM | Postgres RPC functions for transactional import are the right pattern, but require careful design and testing of the JSON-to-upsert logic |

---

## Sources

### Supabase Official Documentation (HIGH confidence)
- [Row Level Security](https://supabase.com/docs/guides/database/postgres/row-level-security)
- [Managing JSON and Unstructured Data](https://supabase.com/docs/guides/database/json)
- [Storage](https://supabase.com/docs/guides/storage)
- [Storage Access Control](https://supabase.com/docs/guides/storage/security/access-control)
- [Third-Party Auth](https://supabase.com/docs/guides/auth/third-party/overview)
- [Before User Created Hook](https://supabase.com/docs/guides/auth/auth-hooks/before-user-created-hook)
- [Custom SMTP](https://supabase.com/docs/guides/auth/auth-smtp)
- [Email Templates](https://supabase.com/docs/guides/auth/auth-email-templates)
- [Local Development](https://supabase.com/docs/guides/local-development)
- [Self-Hosting with Docker](https://supabase.com/docs/guides/self-hosting/docker)
- [Admin Invite User](https://supabase.com/docs/reference/javascript/auth-admin-inviteuserbyemail)
- [Import Data](https://supabase.com/docs/guides/database/import-data)
- [Password-based Auth](https://supabase.com/docs/guides/auth/passwords)

### PostgreSQL Performance (MEDIUM-HIGH confidence)
- [Indexing JSONB in Postgres -- Crunchy Data](https://www.crunchydata.com/blog/indexing-jsonb-in-postgres)
- [Understanding Postgres GIN Indexes -- pganalyze](https://pganalyze.com/blog/gin-index)
- [Comparing Query Performance: JSONB vs Join Queries](https://medium.com/@sruthiganesh/comparing-query-performance-in-postgresql-jsonb-vs-join-queries-e4832342d750)

### Multi-Tenant Patterns (MEDIUM confidence)
- [Supabase RLS Best Practices: Production Patterns](https://makerkit.dev/blog/tutorials/supabase-rls-best-practices)
- [Multi-Tenant Applications with RLS on Supabase](https://www.antstack.com/blog/multi-tenant-applications-with-rls-on-supabase-postgress/)
- [Enforcing RLS in Supabase: Multi-Tenant Architecture](https://dev.to/blackie360/-enforcing-row-level-security-in-supabase-a-deep-dive-into-lockins-multi-tenant-architecture-4hd2)

### Community Patterns (LOW-MEDIUM confidence)
- [Allowing Users to Invite Others with Supabase Edge Functions](https://blog.mansueli.com/allowing-users-to-invite-others-with-supabase-edge-functions)
- [Custom i18n Authentication Emails](https://blog.mansueli.com/creating-customized-i18n-ready-authentication-emails-using-supabase-edge-functions-postgresql-and-resend)
- [Image Storage Architecture with Supabase](https://dev.to/tim_derzhavets/image-storage-architecture-with-supabase-2pa)

---

_Feature research for: Supabase Migration -- OpenVAA Backend_
_Researched: 2026-03-12_
