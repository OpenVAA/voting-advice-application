# 184-14: the key model and `account-access`'s JWT setting

- **Inputs:** the throwaway `begckvkapaopoztbreqc`'s records in `184-10-throwaway-reads.md` (the key model, the legacy-key state, the dashboard's retirement date) and `184-12-throwaway-functions-and-gateway.md` (`D09_TRIGGER=`, `D12_LEGACY_ANON=`).
- **Who wrote it:** the executor, from those records alone, on 2026-11-10. It held no credential and contacted no hosted project. Nothing in this plan ran on either hosted project.

## 1. The key model (D-12)

D12_RAISED=no

Dated 2026-11-10. The checkpoint's three triggers were read from the records, and none holds:

| Trigger                                                  | Record                                                       | Holds |
| -------------------------------------------------------- | ------------------------------------------------------------ | ----- |
| `s4_legacy_enabled` other than true                      | `s4_legacy_enabled=true` (184-10)                            | no    |
| the legacy-keys endpoint answers 404                     | `s4_legacy_http=200` (184-10)                                | no    |
| `D12_LEGACY_ANON=fails`                                  | `D12_LEGACY_ANON=works` (184-12)                             | no    |
| a retirement date before v2.16 and v2.17 can merge       | `answer_legacy_retirement=early 2027` (184-10, the dashboard) | no    |

**The retirement date.** The dashboard gives a season, "early 2027", not a day, and no record of this workstream gives a merge date for v2.16 and v2.17. Nothing recorded puts the merge after that season. v2.17 has phases 185 to 189 left, and FUT-02 is queued as the first work after both streams merge. So the record shows no date that falls before the merge, and the checkpoint is not raised. This is the executor's reading of a coarse date against an unscheduled merge, and the orchestrator may put it to the operator. Plan 184-23 adds the date to the FUT-02 todo, which it owns.

Under C5 the deployment stays on the legacy keys. The service-role shapes are judged in plans 184-15 and 184-16, and a failure there raises the same question at that plan.

## 2. `account-access`'s JWT setting (D-09)

D09_APPLIED=yes

Dated 2026-11-10. `D09_TRIGGER=yes` (184-12): on the throwaway, the hosted gateway refused a call to `account-access` with the anon key in `apikey` alone, with 401 `UNAUTHORIZED_NO_AUTH_HEADER`, and the function did not run.

What changed:

- **`apps/supabase/supabase/config.toml`:** a `[functions.account-access]` table after `[functions.identity-callback]`, with `verify_jwt = false`. Its comment says that the gateway does not verify a JWT for the function, that the function admits an anonymous caller and makes its own checks of every request (the closed sign-up, the redirect allow list, eligibility and the throttle), and that `supabase functions deploy` reads the setting.
- **`scripts/assert-hosted-settings-parity.mjs`:** the row `functions.account-access/verify_jwt`, class "not compared", with identity-callback's reason (`DEPLOYED_FROM_THIS_FILE`). The same table is in `CORRECT_CONFIG`.
- **`packages/dev-seed/tests/deploymentTemplates.test.ts`:** two cases, the section exists and it assigns `verify_jwt = false`. They were written first and failed (2 failed, 23 passed) before the table existed.

The frontend is unchanged. supabase-js already sends the anon key as `Authorization: Bearer`, and that shape reached the function on the throwaway (184-12, 2b and 2c).

The probe's `functions.verify-jwt` reads the declared value from `config.toml`, so the served `account-access` is now held to `false`. The throwaway still serves it with `verify_jwt` true until it is redeployed. Plan 184-15 begins by redeploying `account-access` and measuring shapes (a) and (b) again.

## 3. Gates

| Gate                                                                                         | Exit |
| -------------------------------------------------------------------------------------------- | ---- |
| `node scripts/assert-hosted-settings-parity.mjs --self-test` (98 cases)                      | 0    |
| `node scripts/assert-hosted-settings-parity.mjs`                                             | 0    |
| `yarn workspace @openvaa/dev-seed test:unit tests/deploymentTemplates.test.ts tests/hostedSettingsParityGate.test.ts` (43 tests) | 0 |
| `yarn assert:comment-hygiene`                                                                | 0    |
| `yarn test:unit:infra`, offline (96 tests)                                                   | 0    |
| `scripts/assert-auth-signup-closed.mjs`, `scripts/assert-schema-migration-parity.mjs`         | 0, 0 |
