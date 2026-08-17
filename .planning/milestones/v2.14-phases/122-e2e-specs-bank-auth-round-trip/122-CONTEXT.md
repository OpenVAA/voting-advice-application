# Phase 122: E2E Specs — Bank-Auth Round-Trip - Context

**Gathered:** 2026-06-16
**Status:** Ready for planning

<domain>
## Phase Boundary

The full bank-auth (Idura OIDC) round-trip runs deterministically as E2E. Requirement: **EFLOW-10** (1). Two complementary specs:

- **EFLOW-10 (Edge-Function seam, EXTEND/RETARGET):** retarget the existing `candidate-bank-auth.spec.ts` (synthetic-JWE → direct `identity-callback` Edge Function POST, no live IdP) to **Idura-only** — assert `sub`-based identity match, Idura claim set, magic-link session; drop Signicat. Make it run **deterministically green** (not env-skipped) by configuring the test decryption JWKS in `beforeAll`.
- **EFLOW-10b (full-browser journey, NEW):** operator-requested UI journey — `/candidate/preregister` → `preregister-start` → `/api/oidc/authorize` → (mock IdP) 302 → `/api/oidc/callback` (server-side exchange + decrypt) → authenticated → select election/constituency → email + ToU → `preregister()` → registration-key → set password → logged-in. Faked via the **Option-B local mock OIDC issuer** (LOCKED 2026-06-14).

Both gated on `PLAYWRIGHT_BANK_AUTH=1`. No live IdP, no real network → cardinal-rule safe. Must pass 3×.

</domain>

<decisions>
## Implementation Decisions

### Mock approach (pre-locked by operator 2026-06-14 — recorded, not re-decided)
- **D-01 (EFLOW-10b mock seam):** **Option B — local mock OIDC issuer pointed to by env**, served as a Playwright `webServer` (or global-setup spawn) scoped to a NEW `bank-auth-journey` project. Exposes authorize / token / JWKS endpoints; reuses `buildTestIdToken` for the token response; test-side env vars (`IDURA_DOMAIN` / `IDENTITY_PROVIDER_TOKEN_ENDPOINT` / `IDENTITY_PROVIDER_JWKS_URI` / `IDENTITY_PROVIDER_ISSUER`) point at it. Real authorize→callback→exchange→decrypt→claims chain runs UNMODIFIED. Option C (server-side mock-mode flag) explicitly REJECTED — no test-only branch in production auth code.
- **D-02 (EFLOW-10 deterministic green gate):** The 122 plan MUST set the Supabase secret `IDENTITY_PROVIDER_DECRYPTION_JWKS` to the test `encPrivJwk` in `beforeAll` so the probe's `keysConfigured` branch is taken EVERY run (the keys-configured create path runs deterministically — a "did not run" counts as a failure under the cardinal rule). Document the run command.
- **D-03 (`buildTestIdToken` extraction):** Extract `buildTestIdToken` (currently in-spec in `candidate-bank-auth.spec.ts`) into a shared util so BOTH the Edge-Function spec (EFLOW-10) and the mock issuer (EFLOW-10b) consume one token builder.

### Seed strategy
- **D-04 (EFLOW-10b dataset):** **Reuse an existing 2-election perm dataset shape** (>1 election + selectable constituencies) for the `bank-auth-journey` setup so the election/constituency selection steps render — avoid a new dedicated data-setup pair. EFLOW-10 (Edge-Function) stays additive/assert-only on e2e/base + synthetic in-test identity.

### Claude's Discretion
- Exact existing 2-election perm dataset to point the `bank-auth-journey` setup at (confirm at build time it seeds >1 election AND selectable constituencies).
- Whether the mock issuer is a `webServer` entry vs a global-setup spawn (both acceptable per plan).
- The candidate-preregister page-object shape for the elections→constituencies→email/ToU→register walk.

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Master coverage plan (LOCKED — read first)
- `.planning/v2.14-E2E-COVERAGE-PLAN.md` — §EFLOW-10 bank-auth (Phase 122) [audit rationale + grounded server-side flow map + Option-B lock] and §Build List → Bank-Auth EFLOW-10 (Phase 122) [spec paths, project wiring, deterministic-green-gate requirement, semantic steps for both EFLOW-10 and EFLOW-10b]. Authoritative WHAT-to-build spec.

### Bank-auth domain
- `.planning/idura-ftn-auth-plan.md` — Idura `sub`-based identity matching (replaces `birthdate`); standard OIDC JWE id_token shape shared with Signicat.
- `tests/IDURA-TEST-RUNBOOK.md` — manual run procedure / run command reference.

### Spec + production code seams (verified in plan)
- `tests/tests/specs/candidate/candidate-bank-auth.spec.ts` — the EXISTING spec to retarget (EFLOW-10); owns `buildTestIdToken` (to extract, D-03), synthetic-JWE → direct Edge Function POST, keys-configured/not probe.
- `apps/frontend/src/routes/candidate/preregister/+page.svelte` — `preregister-start` entry; `redirectToIdentityProvider()` (same-tab redirect).
- `apps/frontend/src/routes/api/oidc/authorize/+server.ts` — builds IdP authorize URL (state/nonce httpOnly cookies).
- `apps/frontend/src/routes/api/oidc/callback/+server.ts` — SERVER-SIDE `exchangeCodeForToken()`; sets id_token httpOnly cookie.
- `apps/frontend/src/routes/candidate/preregister/+layout.server.ts` + `apps/frontend/src/lib/api/utils/auth/getIdTokenClaims.ts` — SERVER-SIDE JWE decrypt/verify (`IDENTITY_PROVIDER_DECRYPTION_JWKS` / `_JWKS_URI` / `_ISSUER`).
- `(authenticated)/elections/`, `/constituencies/`, `/email/` (`TermsOfUseForm`, `preregister()`) — post-auth UI steps (seed-dependent on >1 election / selectable constituencies).

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- `buildTestIdToken` (in `candidate-bank-auth.spec.ts`) — synthetic JWE id_token (RSA-OAEP-256 enc + RS256 sig via `jose`); extract to shared util (D-03), reuse for both specs and the mock issuer's token endpoint.
- Existing opt-in `bank-auth` project (`PLAYWRIGHT_BANK_AUTH=1`, `dependencies: [data-setup-base]`) — EFLOW-10 reuses it; EFLOW-10b adds a sibling `bank-auth-journey` project.

### Established Patterns
- The decisive constraint: OIDC code→token exchange AND JWE decryption run in the **SvelteKit Node server**, not the browser — so `page.route()` is insufficient; the mock must sit at a server-reachable seam (Option B local issuer).
- Both specs avoid any live IdP/network → deterministic (3× gate).

### Integration Points
- D-02 wires test JWKS into `beforeAll` (Supabase secret) for the EFLOW-10 green gate.
- EFLOW-10b adds: mock-OIDC-issuer harness (authorize/token/JWKS) + `webServer`/global-setup entry + env-var pointing + candidate-preregister page-object + a 2-election setup dependency (D-04).

</code_context>

<specifics>
## Specific Ideas

EFLOW-10b mock approach (Option B) and EFLOW-10 deterministic-green-gate were operator-LOCKED at the Phase 118 approval gate; D-04 (reuse 2-election perm shape) was confirmed in this discussion. This phase executes the plan's Bank-Auth (Phase 122) build list as written.

</specifics>

<deferred>
## Deferred Ideas

None — discussion stayed within phase scope.

</deferred>

---

*Phase: 122-e2e-specs-bank-auth-round-trip*
*Context gathered: 2026-06-16*
