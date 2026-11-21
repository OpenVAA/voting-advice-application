---
phase: "179"
slug: "identity-provider-registration-coverage-close"
status: verified
# threats_open = count of OPEN threats at or above workflow.security_block_on severity (the blocking gate)
threats_open: 0
asvs_level: 1
created: "2026-10-22"
---

# Phase 179 — Security

> Per-phase security contract: threat register, accepted risks, and audit trail.
> The register is the union of the 24 plans' `<threat_model>` blocks (authored at plan time). Verified by
> `gsd-security-auditor` at L1 against c478b7078, then corrected by the orchestrator against the phase code
> review (`179-REVIEW.md` CR-01): three closures rested on throttle slots that a caller can step around.
> Those three were re-closed on 2026-10-22 against e9a6c35e4 after the review fix (`179-REVIEW-FIX.md`).

---

## Trust Boundaries

| Boundary | Description | Data Crossing |
|----------|-------------|---------------|
| Browser → SvelteKit OIDC routes | authorize / callback, type cookie, PKCE and state cookies | entity type, authorization code (untrusted) |
| SvelteKit server → `identity-callback` | server-only call proven by `IDENTITY_CALLBACK_SERVER_SECRET` | ID token, project id, entity type |
| Signed-in browser → `account-access` `confirm-address` | caller's own access token | typed address, project id, locale (untrusted) |
| Edge Functions → auth service (service role) | invite, email-change links, user lookup | addresses, app metadata |
| Signed-in browser → `/api/contestant/identity-provider` | same-origin JSON, request's own Supabase client (RLS) | organization names, address |
| Test harness → local stack | mock issuer, wrapper-generated keys and secret | test keys, generated secret (never logged) |

---

## Threat Register

*Status: open · closed · open — below high threshold (non-blocking)*

### Open

None.

### Closed

Evidence is file:line or test as recorded by the auditor (paths: IC = `functions/identity-callback`, AA = `functions/account-access`, CB/AZ = `routes/api/oidc/{callback,authorize}/+server.ts`, SPEC = `contestant-identity-provider.spec.ts`, BSPEC = `contestant-bank-auth.spec.ts`, WRAP = `tests/scripts/e2e-run.sh`).

| Threat ID | Category | Component | Severity | Disposition | Mitigation | Status |
|-----------|----------|-----------|----------|-------------|------------|--------|
| T-179-011 | Repudiation | verdict from stale/partial/void run | medium | mitigate | `179-verdict.mjs` stale :238, void :250-262, subset :390; refusal cases | closed |
| T-179-012 | Tampering | baseline of another tree | medium | mitigate | baseline-r5 head tree-equal to base outside `.planning` | closed |
| T-179-013 | Tampering | frozen 00001 edited | high | mitigate | empty diff; `scope` refusal :132 | closed |
| T-179-014 | Tampering | built against operator's round | high | mitigate | `179-read-rulings.mjs:181-182` HALT | closed |
| T-179-015 | Info disclosure | driver echoes a stack key | medium | mitigate | withhold-stack-keys filter; `_dev:concurrent` (9cb7478d7) pinned by `withholdStackKeys.test.ts` | closed |
| T-179-021 | Info disclosure | probe prints token/link/address | high | mitigate | probe hygiene 0 hits | closed |
| T-179-022 | Spoofing | confirmation on an unrun reading | high | mitigate | P1/P2/P6 observed | closed |
| T-179-023 | EoP | IdP accounts read as password set | medium | mitigate | invite recipe IC/index.ts:296-300; conformance :178 | closed |
| T-179-024 | DoS | no edge runtime after p8 | medium | mitigate | probe stop/start + per-function check (note: not in `finally`) | closed |
| T-179-031 | EoP | victim's link claims victim's entity | high | mitigate | 00002:47 `identity_provider IS NULL`; pgTAP `IDP:` | closed |
| T-179-033 | Info disclosure | `pending_email_taken` about others | medium | mitigate | 00004 zero-arg, `auth.uid()` row only; pgTAP `PET:` | closed |
| T-179-034 | Tampering | schema/ vs migrations | medium | mitigate | equivalence ×3; gate row 0 | closed |
| T-179-035 | Tampering | frozen baseline edited | high | mitigate | 00001 unchanged; manifest ends 00004 | closed |
| T-179-041 | Spoofing | parallel tests share identity | medium | mitigate | random single-use codes, mock tests | closed |
| T-179-042 | EoP | mock reachable off-host | medium | mitigate | bind 127.0.0.1 | closed |
| T-179-043 | EoP | deployment trusts test keys | high | transfer | → 179-05, verified as T-179-051 | closed |
| T-179-051 | EoP | config trusts test keys/mock | high | mitigate | `assert-test-keys-scope.mjs` in `lint:check` + gate row | closed |
| T-179-052 | Spoofing | cert verification disabled | medium | mitigate | `NODE_EXTRA_CA_CERTS`; no `NODE_TLS_REJECT_UNAUTHORIZED` | closed |
| T-179-053 | DoS | no edge runtime after a run | medium | mitigate | WRAP `restore_stack`, exit 9 | closed |
| T-179-054 | Info disclosure | generated keys in repo/log | medium | mitigate | mktemp outside repo, 0700/0600, removed by name | closed |
| T-179-061 | Tampering | crafted CI2 link reflects text | high | mitigate | class-only load; frozen table; tests | closed |
| T-179-062 | Info disclosure | per-stage failure messages | medium | mitigate | three classes, nine codes | closed |
| T-179-063 | Spoofing | misleading retry text | low | mitigate | noRetry set; Try again only when offered | closed |
| T-179-071 | Tampering | forged type cookie | high | mitigate | AZ:51-52, CB:168-169, IC:277-285; SPEC:743 | closed |
| T-179-072 | Tampering | stale type cookie | medium | mitigate | httpOnly 600 s, overwritten, deleted on read | closed |
| T-179-073 | Tampering | open redirect | medium | mitigate | redirect from origin + route constant | closed |
| T-179-074 | Info disclosure | PKCE verifier readable | medium | mitigate | server-generated, httpOnly | closed |
| T-179-075 | Spoofing | login CSRF | medium | mitigate | state/PKCE binding CB:67-94 | closed |
| T-179-081 | Tampering | body steers project/type | high | mitigate | closed request contract; named project's matrix | closed |
| T-179-082 | EoP | rule drift | medium | mitigate | `registrationMatrix.test.ts` vs pgTAP table | closed |
| T-179-083 | Info disclosure | caught message in answer | medium | mitigate | `resultBody`, single respond | closed |
| T-179-091 | Info disclosure | identity code/birth date in token | high | mitigate | `appMetadata.ts`; BSPEC:258-259 | closed |
| T-179-092 | Spoofing | lookup on non-identifier | high | mitigate | match on `sub` | closed |
| T-179-093 | DoS | entity per sign-in / org flood | medium | mitigate | one entity per project+type (concurrent first sign-in: see REVIEW WR-01) | closed |
| T-179-094 | EoP | removed grant undone | medium | mitigate | `gone` → `no_entity` | closed |
| T-179-095 | Spoofing | secret by timing | low | mitigate | constant-time compare | closed |
| T-179-096 | Tampering | malformed record read as none | medium | mitigate | throws; tests | closed |
| T-179-101 | Spoofing | typed address without proof | high | mitigate | only the mailed link changes it; no `updateUserById` in account-access (see REVIEW WR-02) | closed |
| T-179-103 | EoP | forged caller changes another's address | high | mitigate | caller from own token, public key (b201e4910) | closed |
| T-179-104 | Spoofing | stranger opens the mail | medium | mitigate | impersonal template; J3 | closed |
| T-179-105 | Info disclosure | token/address in log | medium | mitigate | fixed-message logger; tests | closed |
| T-179-111 | Tampering | cross-site save | medium | mitigate | Origin + JSON content type, 403 | closed |
| T-179-112 | EoP | renames another entity | high | mitigate | only the record's unconfirmed org; RLS | closed |
| T-179-113 | Info disclosure | placeholder rendered | medium | mitigate | emptied in data writer | closed |
| T-179-114 | EoP | F skipped by client input | high | mitigate | `getUser` + `addressStateOf` | closed |
| T-179-115 | Tampering | gate facts from session/URL | medium | mitigate | `assert:no-session-in-loads` | closed |
| T-179-121 | EoP | CI1 dismissed client-side | high | mitigate | server load chooses the gate | closed |
| T-179-122 | Info disclosure | other account's data rendered | medium | mitigate | user-level fields only | closed |
| T-179-123 | Tampering | address as markup | low | mitigate | text in `<dd>`, no `{@html}` | closed |
| T-179-131 | EoP | direct call in a closed project | high | mitigate | matrix read first; BSPEC:353 | closed |
| T-179-132 | Info disclosure | identity code in every token | high | mitigate | `identityAppMetadata` only | closed |
| T-179-133 | Spoofing | link for a stray placeholder | high | mitigate | link for the address read by id | closed |
| T-179-134 | EoP | password nobody knows | medium | mitigate | invite, no createUser | closed |
| T-179-135 | DoS | entity per sign-in / throw on two grants | medium | mitigate | `ownEntity.ts`; SPEC:795 | closed |
| T-179-136 | Info disclosure | caught message, verification oracle | medium | mitigate | IC:395-400; tests | closed |
| T-179-137 | Spoofing | stolen token replayed | high | transfer | → 179-15, verified as T-179-151 | closed |
| T-179-141 | Tampering | forged type cookie at callback | high | mitigate | deleted on read; `identityProviderEntityType` + lock (bd89c0042) | closed |
| T-179-142 | EoP | CI1 skipped via marker | high | mitigate | marker only adds a gate | closed |
| T-179-143 | Info disclosure | ID token in browser | high | mitigate | server-side invoke; no ID-token cookie | closed |
| T-179-144 | Tampering | gate decided on URL | medium | mitigate | `layout.tracking.test.ts` | closed |
| T-179-145 | Spoofing | session from foreign token | medium | mitigate | `verifyOtp` on the function's token | closed |
| T-179-146 | Repudiation | red scenario committed unproven | medium | mitigate | 179-14-red then held 570/570 before commit | closed |
| T-179-151 | Spoofing | stolen ID token presented directly | high | mitigate | credential checked first; `fn-closed` row 0 | closed |
| T-179-152 | DoS | anonymous paging of users | medium | mitigate | refused before body/lookup | closed |
| T-179-153 | EoP | unset secret opens function | high | mitigate | `requireEnv`, empty = unset | closed |
| T-179-154 | Info disclosure | secret in log/argv/repo | high | mitigate | generated in script, 0600, never printed | closed |
| T-179-155 | Spoofing | secret by timing | low | mitigate | constant-time compare | closed |
| T-179-156 | Tampering | request steers project | medium | mitigate | uuid + that project's matrix; credential-gated | closed |
| T-179-161 | EoP | confirmed voter-visible party | high | mitigate | `confirmed: false`, no name; SPEC:609 | closed |
| T-179-162 | Tampering | default type registers a party | low | mitigate | nothing chosen on arrival | closed |
| T-179-163 | EoP | names to non-owned/confirmed entity | high | mitigate | request's own client, RLS + trigger | closed |
| T-179-164 | DoS | one identity many parties | medium | mitigate | one per project+type; SPEC:637 | closed |
| T-179-171 | EoP | removed grant undone | medium | mitigate | `no_entity`; SPEC:256 | closed |
| T-179-172 | EoP | address gate skipped by direct URL | high | mitigate | protected layout load; SPEC:231 | closed |
| T-179-173 | Spoofing | pending user told to sign in by email | low | mitigate | sentence only when proved | closed |
| T-179-181 | Info disclosure | pending address to someone else | medium | mitigate | verified user data, protected pages only | closed |
| T-179-182 | DoS | Send again floods a mailbox | low | mitigate | server slot + 65 s countdown | closed |
| T-179-183 | Spoofing | password manager saves pending address | low | mitigate | username only when proved | closed |
| T-179-191 | Spoofing | half-verified change lands as proved | medium | mitigate | error/no session = failure | closed |
| T-179-192 | Info disclosure | race landing tells anonymous visitor | low | mitigate | generic `emailTaken` only | closed |
| T-179-193 | EoP | proved IdP account claims invitation | high | mitigate | 00002:47; pgTAP `IDP:` | closed |
| T-179-201 | Tampering | forged type creates organization | high | mitigate | SPEC:743 | closed |
| T-179-202 | DoS | second grant throws/duplicates | medium | mitigate | SPEC:795 | closed |
| T-179-211 | EoP | dead route accepts ID token | high | mitigate | preregister and token routes deleted | closed |
| T-179-212 | Info disclosure | ID-token cookie name | medium | mitigate | no idToken; `assert:cookie-names` | closed |
| T-179-221 | EoP | legacy route reintroduced | medium | mitigate | `assert-no-preregister.mjs` (e045c68dd) in `lint:check` | closed |
| T-179-222 | Repudiation | stale operator docs | low | mitigate | docs name the secret and codes | closed |
| T-179-231 | Repudiation | coverage for unexercised mode | medium | mitigate | `assert-e2e-coverage-tags.mjs` + self-test | closed |
| T-179-232 | Repudiation | todo closed without evidence | medium | mitigate | df48d0981 resolutions | closed |
| T-179-241 | Repudiation | close on different heads/void | medium | mitigate | gates r3 and final run both c478b7078, not void | closed |
| T-179-242 | Repudiation | residual reported as closed | medium | mitigate | 179-24-SUMMARY residuals section | closed |
| T-179-243 | EoP | closure not served at close | high | mitigate | edge runtime restarted; `fn-closed` 0 | closed |
| T-179-032 | Info disclosure | `in-use` answer of `address_confirmation_request` as a bulk oracle | high | mitigate | Re-closed after CR-01 fix (b1f981564): `00003_address_confirmation_request.sql` answers false and writes nothing unless the user's `registered_entities` names the project; caller slot `confirm:<user>` 10/15 min and address slot `confirm-address:<sha256>` 1/60 s, neither per project. pgTAP `48-address-confirmation-request` ACR "another project answers false: the address's slot is not per project"; full pgTAP 2640 green | closed |
| T-179-102 | Info disclosure | `confirm-address` `in-use` answer as a bulk oracle | high | mitigate | AA `addressConfirmation.ts` `registeredIn` refuses an unregistered project before `takeSlot` (:157 before :173); slots project-independent as T-179-032; unit 1099→1126 green; E2E 179-review-fix-final 613/613 | closed |
| T-179-106 | DoS | mail flooding of one address | low | mitigate | Address slot `confirm-address:<sha256>` 1/60 s regardless of project (as T-179-032) | closed |
| T-179-SC ×24 | Tampering | package installs | low | accept | no lockfile/dependency change in the phase | closed |

---

## Accepted Risks Log

| Risk ID | Threat Ref | Rationale | Accepted By | Date |
|---------|------------|-----------|-------------|------|
| AR-179-01 | T-179-SC (×24) | No package installed; lockfile and dependencies unchanged across the phase | each plan's threat model | 2026-10-21 |
| AR-179-02 | T-179-032, T-179-033, T-179-102 (auth-service part only) | A signed-in account's own `PUT /auth/v1/user` answers `email_exists` for a taken address; hosted Supabase has no hook or configurable gateway to block it. An account is needed first, nothing can be taken over without the mailed link, hosted IP limit on `/auth/v1/user` applies. Revisit if Supabase adds a before-user-updated hook. Does NOT cover the phase's own `confirm-address` bypass (CR-01). | operator | 2026-10-22 |

---

## Unregistered Flags (non-blocking)

- WRAP:636 JWKS server (`python3 -m http.server`) binds every interface on port 8777 during a run; it serves only the committed test public key.
- 179-13 service-role `app_settings` read (covered by T-179-131); test-tree service-role helpers (179-17, 179-20).
- Pre-existing: `rejectUnauthorized: false` on account-access's credential-less SMTP path (local mail catcher).

---

## Security Audit Trail

| Audit Date | Threats Total | Closed | Open | Run By |
|------------|---------------|--------|------|--------|
| 2026-10-22 | 119 | 116 | 3 (2 at/above high) | gsd-security-auditor (L1), corrected by orchestrator per 179-REVIEW CR-01 |
| 2026-10-22 | 119 | 119 | 0 | orchestrator re-close against e9a6c35e4 after 179-REVIEW-FIX (CR-01, WR-01, WR-02) |

---

## Sign-Off

- [x] All threats have a disposition (mitigate / accept / transfer)
- [x] Accepted risks documented in Accepted Risks Log
- [x] `threats_open: 0` confirmed — CR-01 fixed in b1f981564, verified on e9a6c35e4

**Approval:** verified 2026-10-22
