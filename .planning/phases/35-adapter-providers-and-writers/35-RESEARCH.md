# Phase 35: Adapter Providers and Writers - Research

**Researched:** 2026-03-22
**Status:** Complete

## Research Summary

Phase 35 replaces proxy stubs (created in Phase 34) with real Supabase adapter implementations for DataProvider, DataWriter, FeedbackWriter, and a new AdminWriter. Source implementations exist on the `feat-gsd-supabase-migration` parallel branch.

## Key Findings

### 1. Current State — Proxy Stubs

Phase 34 created three proxy stub modules that throw errors when accessed:

- `apps/frontend/src/lib/api/adapters/supabase/dataProvider/index.ts` — exports `dataProvider` proxy
- `apps/frontend/src/lib/api/adapters/supabase/dataWriter/index.ts` — exports `dataWriter` proxy
- `apps/frontend/src/lib/api/adapters/supabase/feedbackWriter/index.ts` — exports `feedbackWriter` proxy

Each directory contains only an `index.ts` file. The actual implementation files (e.g., `supabaseDataProvider.ts`) need to be created.

### 2. Parallel Branch Source Analysis

#### SupabaseDataProvider (`frontend/src/lib/api/adapters/supabase/dataProvider/`)
- Extends `supabaseAdapterMixin(UniversalDataProvider)`
- Implements all 7 abstract methods: `_getAppSettings`, `_getAppCustomization`, `_getElectionData`, `_getConstituencyData`, `_getNominationData`, `_getEntityData`, `_getQuestionData`
- Uses PostgREST query builder directly (no apiGet/apiPost wrappers)
- Uses utilities: `getLocalized`, `toDataObject`, `parseStoredImage`, `parseAnswers`
- References `constants.PUBLIC_SUPABASE_URL` for storage URL construction
- Uses `ENTITY_TYPE` from `@openvaa/data`
- Imports types from `$lib/api/base/dataTypes`, `$lib/api/base/getDataOptions.type`, `$lib/contexts/app`, `@openvaa/app-shared`, `@openvaa/data`
- Full test file exists with mock Supabase client pattern

#### SupabaseDataWriter (`frontend/src/lib/api/adapters/supabase/dataWriter/`)
- Extends `supabaseAdapterMixin(UniversalDataWriter)`
- Contains BOTH candidate-facing AND admin methods (CONTEXT.md says admin methods were erroneously placed here)
- **Candidate methods (keep in DataWriter):**
  - `_login` — `supabase.auth.signInWithPassword`
  - `_logout` — `supabase.auth.signOut` + server-side cookie clearing
  - `logout` (public override) — skips UniversalDataWriter's dual POST pattern
  - `_requestForgotPasswordEmail` — `supabase.auth.resetPasswordForEmail`
  - `_resetPassword` — `supabase.auth.updateUser`
  - `_setPassword` — `supabase.auth.updateUser`
  - `_preregister` — invokes `invite-candidate` Edge Function
  - `_register` — `supabase.auth.updateUser`
  - `_getBasicUserData` — session + JWT claim parsing
  - `_getCandidateUserData` — `get_candidate_user_data` RPC
  - `_setAnswers` — `upsert_answers` RPC with File upload to Storage
  - `_updateEntityProperties` — candidate table update with image upload
- **Admin methods (move to AdminWriter):**
  - `_updateQuestion` — `merge_custom_data` RPC
  - `_sendEmail` — invokes `send-email` Edge Function
  - `_insertJobResult` — insert into `admin_jobs` table
- **Missing abstract method implementations:**
  - `_checkRegistrationKey` — not implemented (Supabase uses invite flow, not registration keys)
- Full test file exists with mock auth patterns

#### SupabaseFeedbackWriter (`frontend/src/lib/api/adapters/supabase/feedbackWriter/`)
- Extends `supabaseAdapterMixin(UniversalFeedbackWriter)`
- Minimal stub — `_postFeedback` throws "not implemented"
- No test file on parallel branch

### 3. Base Class Contracts

#### UniversalDataProvider (7 abstract methods)
All return `Promise<DPDataType[key]>`:
- `_getAppSettings()` → `Partial<DynamicSettings>`
- `_getAppCustomization(options?)` → `AppCustomization`
- `_getElectionData(options?)` → `ElectionData[]`
- `_getConstituencyData(options?)` → `{ groups, constituencies }`
- `_getNominationData(options?)` → `{ nominations, entities }`
- `_getEntityData(options?)` → `AnyEntityVariantData[]`
- `_getQuestionData(options?)` → `{ categories, questions }`

#### UniversalDataWriter (14 abstract methods)
All must be implemented:
- `_preregister(opts)` — Edge Function
- `_checkRegistrationKey(opts)` — Not applicable for Supabase (throw "not supported")
- `_register(opts)` — updateUser
- `_login(opts)` — signInWithPassword
- `_logout(opts)` — signOut
- `_getBasicUserData(opts)` — session/JWT
- `_requestForgotPasswordEmail(opts)` — resetPasswordForEmail
- `_resetPassword(opts)` — updateUser
- `_setPassword(opts)` — updateUser
- `_getCandidateUserData(opts)` — RPC
- `_setAnswers(opts)` — RPC + Storage
- `_updateEntityProperties(opts)` — table update + Storage
- `_updateQuestion(opts)` — RPC (admin, but required by base class)
- `_insertJobResult(opts)` — table insert (admin, but required by base class)

**Important finding:** `_updateQuestion` and `_insertJobResult` are abstract on `UniversalDataWriter`, so they MUST remain implemented in `SupabaseDataWriter`. The AdminWriter extraction must create a separate class that ALSO implements these, but the DataWriter still needs stubs/implementations for the abstract contract.

#### UniversalFeedbackWriter (1 abstract method)
- `_postFeedback(data)` → `DataApiActionResult`

### 4. Index.ts Export Pattern

The proxy stubs export singleton instances. The real implementations should follow the same pattern — each `index.ts` exports a class instance (or the class itself for factory use). Looking at the adapter switch code:

The adapter switch imports from `./supabase/dataProvider`, `./supabase/dataWriter`, `./supabase/feedbackWriter`. The current `index.ts` files export proxy objects. The replacement should export actual class instances.

However, looking more carefully at how they're used — the adapter switch lazily creates instances. The `index.ts` should export the **class** (not an instance) so the adapter switch can instantiate and call `.init()` with config.

Let me re-examine: The current stubs export `dataProvider`, `dataWriter`, `feedbackWriter` as pre-created proxy objects. This means the consumers expect pre-initialized singletons. But that's the stub pattern — the real implementation likely needs the class exported and instantiation handled by the adapter switch.

Looking at the Strapi adapter for comparison — it exports classes that get instantiated by the adapter switch.

**Decision:** Export classes from the implementation files, update `index.ts` to re-export the classes. The adapter switch handles instantiation.

### 5. Type Gaps

The parallel branch DataWriter imports types not present on the current branch:
- `SendEmailOptions` — used by `_sendEmail` (admin method)
- `SendEmailResult` — used by `_sendEmail` (admin method)
- `UpdatedEntityProps` — used by `_updateEntityProperties` return type

These need to be either:
a) Added to `dataWriter.type.ts` (if keeping in DataWriter)
b) Defined in a new `adminWriter.type.ts` (if moving to AdminWriter)

For `_sendEmail`: Since this is an admin method moving to AdminWriter, the types can be defined alongside the AdminWriter.

For `UpdatedEntityProps`: This is used by `_updateEntityProperties` which stays in DataWriter. The type needs to exist in `dataWriter.type.ts`. However, the base class abstract method returns `LocalizedCandidateData`, not `UpdatedEntityProps`. The parallel branch implementation returns `{ termsOfUseAccepted, image }` which is a subset — the actual return type doesn't need `UpdatedEntityProps` to be formally defined since it's internal.

### 6. AdminWriter Architecture

The AdminWriter is a NEW class not on the parallel branch. Per CONTEXT.md decisions:
- Extends `supabaseAdapterMixin(...)` — but what base class?
- No `UniversalAdminWriter` base class exists
- Admin methods: `updateQuestion` (merge_custom_data RPC), `sendEmail` (Edge Function), `insertJobResult` (admin_jobs insert)
- Also needs job management: `getActiveJobs`, `getPastJobs`, `startJob`, `getJobProgress`, `abortJob`, `abortAllJobs`

**Problem:** There is no base abstract class for AdminWriter. The admin methods are currently defined on the `DataWriter` interface and `UniversalDataWriter` base class. Creating a standalone `SupabaseAdminWriter` means it doesn't implement any existing interface.

**Resolution:** Create `SupabaseAdminWriter` as a standalone class that extends `supabaseAdapterMixin(UniversalAdapter)` directly. It implements admin methods that duplicate the ones on DataWriter. The DataWriter keeps its implementations (required by abstract contract) but they can delegate to AdminWriter or remain self-contained.

Given the CONTEXT.md decision D-10 ("Naming is acknowledged as awkward — captured as TODO for later rename"), the pragmatic approach is:
1. Keep DataWriter with ALL its abstract implementations (including `_updateQuestion`, `_insertJobResult`)
2. Create AdminWriter as a NEW additional class with admin-specific methods
3. The admin methods on DataWriter remain functional — AdminWriter is an alternative entry point for admin operations
4. Future refactoring (WAUTH-01) will clean up this duplication

### 7. Validation Architecture

**Unit Tests:**
- DataProvider: Comprehensive mock-based tests from parallel branch (12+ test cases)
- DataWriter: Comprehensive mock-based tests from parallel branch (20+ test cases)
- AdminWriter: New tests needed for extracted admin methods
- FeedbackWriter: No tests (stub implementation)

**Acceptance Pattern:**
- Each class can be instantiated and initialized with mock Supabase client
- All abstract methods are implemented (TypeScript compilation)
- Test files pass with `yarn test:unit`
- `index.ts` exports correct class/instance
- Admin methods moved to AdminWriter still work identically

## Technical Risks

1. **Abstract method contract:** DataWriter's `_updateQuestion` and `_insertJobResult` are abstract on UniversalDataWriter — cannot be removed without modifying the base class (out of scope)
2. **Missing types:** `SendEmailOptions`/`SendEmailResult` don't exist on current branch — need to define for AdminWriter's `sendEmail`
3. **FeedbackWriter is a stub:** Parallel branch has unimplemented `_postFeedback` — this phase copies it as-is (real implementation deferred)
4. **Import path differences:** Parallel branch uses `$lib/...` which resolves to `frontend/src/lib/...` — current branch resolves to `apps/frontend/src/lib/...`. The `$lib` alias works the same way, so imports need no path changes.

## Recommendations

1. Create implementation files alongside existing `index.ts` files (don't replace index.ts, add new .ts files and update index.ts to re-export)
2. Copy DataProvider verbatim from parallel branch — no changes needed beyond import verification
3. Copy DataWriter with admin method stubs retained (abstract contract requirement) but add TODO comments
4. Create AdminWriter as standalone class extending `supabaseAdapterMixin(UniversalAdapter)` with admin operations
5. Copy FeedbackWriter as-is (stub with throw)
6. Copy test files, adapt mock patterns, add AdminWriter tests

---

*Phase: 35-adapter-providers-and-writers*
*Research completed: 2026-03-22*
