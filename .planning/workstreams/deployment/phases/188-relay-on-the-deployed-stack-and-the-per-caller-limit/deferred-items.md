# Phase 188 deferred items

## From 188-05

### 1. A red targeted run whose cause was a host network change (`net::ERR_NETWORK_CHANGED`)

- **Run:** `tests/e2e-runs/188-05-contestant-identity-provider-20261118T182838Z`, wrapper exit 1, no VOID marker. 237 passed, 2 failed, 375 did not run.
- **Failed:** `admin-account-flows` › "an invited project admin who asks for a link from the Admin App's login …" and `contestant-password-recovery` › "after a sign-out that failed with the cookies gone, Back …". Both timed out at 90 s on `getByTestId('forgot-password-submit')`, a button that stays natively disabled until the screen has mounted.
- **Cause, from the two traces in the run's `html/data`:** at 18:31:17Z and at 18:31:35Z Chrome aborted every in-flight module request of the page with `net::ERR_NETWORK_CHANGED`. The dev server answered them, and it logged `Failed to fetch dynamically imported module …/client/nodes/*.js` 18 times, all at those two moments. The page never hydrated. Nothing under `apps/frontend` differs from the tree of the green 188-01 run. `account-access` answered every request it got.
- **Not established:** what changed the host's network at those two moments. `log show` returned nothing for the window.
- **Next run:** `tests/e2e-runs/188-05-contestant-identity-provider-r2-20261118T183748Z`, same tree, wrapper exit 0: 614 passed, 0 failed, 0 flaky, 0 `Failed to fetch` lines. That run is evidence about the tree. It does not explain the first run.
- **Open:** the wrapper's void detection covers host suspend only. A network change that aborts browser requests leaves a red run with no marker, which under the CLAUDE.md rules is a failure. Whether the wrapper should detect such a change (for example by grepping the run's traces for `ERR_NETWORK_CHANGED`), or the host's cause should be found and removed, is for the phase verifier or the operator to decide.

### 2. `code-sign-in` is called from the frontend server, so its per-caller bucket is likely the server's address — RESOLVED (option a)

- **Resolved 2026-11-19, option (a), by the operator** (188-CONTEXT.md E-03, commit 6e0aafd67). `code-sign-in` takes no caller slot. The take covers `check-code`, `request-link` and `request-recovery` only. The take is guarded by `takesCallerSlot` over `CALLER_LIMITED_OPERATIONS` in `functions/account-access/callerLimit.ts` (commit 2ee346c83), and the docs now state the residual as it stands (commit c7dc1f32b). The record, gates and E2E runs are in `188-08-SUMMARY.md` § Deviation: code-sign-in outside the caller take. A code sign-in is still bounded by the per-code budget of `invitation_code_claimant_email` (10 per 15 minutes per used code) and by the auth service's per-address sign-in limit. The shared auth sign-in budget (authentication docs' Known residuals, the item before it) stays open as a pre-launch risk.

The original record follows.


- `apps/frontend/src/routes/contestant/register/sign-in/+page.server.ts` calls `invitationCodeLogin` → `signInWithInvitationCode` → `account-access` `code-sign-in` from the frontend server. 188-DISCUSSION-POINTS.md records the premise "The browser, directly … The frontend server is not in the path" for all four operations. From the code, that premise is false for `code-sign-in`.
- Once deployed behind Cloudflare, the `cf-connecting-ip` the function sees for a code sign-in is likely the ECS task's egress address. All code sign-ins through that screen would then share one bucket of 30 per 10 minutes per task, and 30 form submissions by anyone would refuse everyone's code sign-in for the rest of the window. The server reports the refusal as invalid credentials. This is UNCONFIRMED on a hosted project: what the hosted function sees for a server request has not been measured.
- 188-05 built what E-02 and E-03 decided (four operations in the take). It documented the risk as a pre-launch risk in the authentication docs' Known residuals and did not change the design.
- Options, for the operator: (a) take `code-sign-in` out of the caller take, as was done for `confirm-address`; (b) have the frontend server forward the browser's address under a server secret that the function verifies; (c) keep it, and measure on the hosted project at 188-10/E-06. Any of these can be done before plan 188-10's push.

## From 188-03

### 1. `terraform validate` of `infra/modules/frontend-service` alone fails at HEAD, before this plan's change

- `terraform -chdir=infra/modules/frontend-service validate` prints `Error: Provider configuration not present` for the first `provider = aws.us_east_1` resource, because the module declares `configuration_aliases = [aws.us_east_1]` and a module validated as a root has no such configuration. Measured on a `git archive HEAD` copy of the module at 137fe3487 (before 188-03): the same error, naming `aws_acm_certificate.viewer`.
- 188-03's Task 1 `<verify>` chains this command first, so it cannot exit 0 as written. 188-03 validated the module through both AWS roots instead (`validate` of a root validates its module calls) and through the module's own `terraform test`, which plans and applies every resource against the mock providers.
- Open: a later plan whose `<verify>` validates the module directly should validate a root instead, or the module could gain a test-only root. Not changed here.
